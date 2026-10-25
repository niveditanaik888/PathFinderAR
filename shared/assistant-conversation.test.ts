import { describe, expect, it } from "vitest";
import { continueRouteConversation, createConversationState, prepareSpokenRouteRequest, resolveCampusDestination, resolveCampusSource } from "./assistant-conversation";

describe("assistant route conversation", () => {
  it("continues the exact library → yes → Main Gate follow-up without asking the AI model", () => {
    const first = continueRouteConversation("Where is the Central Library?", createConversationState("en", "conversation-1"));
    expect(first.state.intent).toBe("awaiting_route_confirmation");
    expect(first.state.destinationId).toBe("d10");

    const confirmation = continueRouteConversation("yes", first.state);
    expect(confirmation.handled).toBe(true);
    expect(confirmation.state.intent).toBe("awaiting_source");

    const routed = continueRouteConversation("Main Gate", confirmation.state);
    expect(routed.state.intent).toBe("route_ready");
    expect(routed.route?.source.id).toBe("gate");
    expect(routed.route?.destination.id).toBe("d10");
    expect(routed.route?.result.totalDistance).toBeGreaterThan(0);
    expect(routed.route?.result.nodeIds).toEqual(["gate", "reception", "library-entry", "library"]);
    expect(routed.route?.instructions.length).toBeGreaterThan(1);
    expect(routed.state.route).toMatchObject({ sourceNodeId: "gate", destinationId: "d10" });
  });

  it("resolves only configured aliases and supports a direct source-to-destination request", () => {
    expect(resolveCampusDestination("AIET Library")?.id).toBe("d10");
    expect(resolveCampusDestination("CSE")?.id).toBe("d5");
    expect(resolveCampusSource("Administrative Block")?.id).toBe("admin-entry");
    expect(resolveCampusDestination("unlisted destination")).toBeUndefined();

    const direct = continueRouteConversation("Give me directions from Main Gate to the library", createConversationState("en", "conversation-2"));
    expect(direct.route?.destination.name).toBe("Central Library");
  });

  it("normalizes a spoken configured destination into a direct route from the selected start", () => {
    expect(prepareSpokenRouteRequest("Navigate to the library", "gate")).toBe("from Main Gate to Central Library");
    expect(prepareSpokenRouteRequest("Navigate to the library")).toBe("Navigate to the library");
    expect(prepareSpokenRouteRequest("Navigate to an unlisted place", "gate")).toBe("Navigate to an unlisted place");
  });

  it("preserves a verified route when the user starts navigation", () => {
    const ready = continueRouteConversation("Main Gate", continueRouteConversation("yes", continueRouteConversation("Library", createConversationState("en", "conversation-3")).state).state);
    const started = continueRouteConversation("Start navigation", ready.state);
    expect(started.action).toBe("start_navigation");
    expect(started.state.navigationStatus).toBe("active");
    expect(started.state.route).toEqual(ready.state.route);
  });

  it("resolves configured Kannada source aliases into a usable route", () => {
    const state = { ...createConversationState("kn", "conversation-kn"), intent: "awaiting_source" as const, destinationId: "d10" };
    const routed = continueRouteConversation("ಮುಖ್ಯ ದ್ವಾರ", state);
    expect(routed.route?.source.id).toBe("gate");
    expect(routed.route?.destination.id).toBe("d10");
    expect(routed.reply).toContain("ಮಾರ್ಗ ದೊರಕಿದೆ");
  });

  it("accepts a localized navigation-start follow-up for a verified route", () => {
    const initial = createConversationState("hi", "localized-navigation");
    const route = continueRouteConversation("Main Gate to Central Library", initial);
    const navigation = continueRouteConversation("नेविगेशन शुरू करें", route.state);
    expect(navigation.state.intent).toBe("navigating");
    expect(navigation.reply).toContain("नेविगेशन तैयार है");
  });

  it("resolves step-by-step directions directly after destination identification", () => {
    const first = continueRouteConversation("Where is the Central Library?", createConversationState("en", "conversation-step-by-step"));
    expect(first.state.intent).toBe("awaiting_route_confirmation");
    expect(first.state.destinationId).toBe("d10");

    const followUp = continueRouteConversation("step-by-step directions", first.state);
    expect(followUp.handled).toBe(true);
    expect(followUp.state.intent).toBe("route_ready");
    expect(followUp.route?.destination.id).toBe("d10");
    expect(followUp.route?.instructions.length).toBeGreaterThan(1);
    expect(followUp.reply).toContain("Route found.");
    expect(followUp.reply).toContain("1.");
  });

  it("resolves faculty cabins and campus landmarks by voice and natural query", () => {
    expect(resolveCampusDestination("Alvas Fountain")?.id).toBe("d17");
    expect(resolveCampusDestination("Canara Bank ATM")?.id).toBe("d18");
    expect(resolveCampusDestination("Dr Manjunath Kotari Cabin")?.id).toBe("d33");
    expect(resolveCampusDestination("Dr Manjunath Kotari")?.id).toBe("d33");
    expect(resolveCampusDestination("Abhijith L Kotian Cabin")?.id).toBe("d26");

    const direct = continueRouteConversation("Directions from Main Gate to Dr Manjunath Kotari's cabin", createConversationState("en", "conv-faculty"));
    expect(direct.route?.destination.name).toBe("Dr Manjunath Kotari Cabin");
    expect(direct.route?.destination.id).toBe("d33");
  });

  it("handles transliterated Kannada confirmation 'howdu' and suffix 'gate ninda' without error", () => {
    const initial = continueRouteConversation("Central Library", createConversationState("kn", "conv-howdu"));
    expect(initial.handled).toBe(true);
    expect(initial.state.intent).toBe("awaiting_route_confirmation");
    expect(initial.state.destinationId).toBe("d10");

    // User says "howdu"
    const confirmed = continueRouteConversation("howdu", initial.state);
    expect(confirmed.handled).toBe(true);
    expect(confirmed.state.intent).toBe("awaiting_source");
    expect(confirmed.reply).toContain("ನೀವು ಎಲ್ಲಿಂದ ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೀರಿ");

    // User says "gate ninda" (with suffix)
    const routed = continueRouteConversation("gate ninda", confirmed.state);
    expect(routed.handled).toBe(true);
    expect(routed.state.intent).toBe("route_ready");
    expect(routed.route?.source.id).toBe("gate");
    expect(routed.route?.destination.id).toBe("d10");
    expect(routed.reply).toContain("ಮಾರ್ಗ ದೊರಕಿದೆ");
  });

  it("handles direct source input and compound 'howdu gate' while awaiting confirmation", () => {
    const initial = continueRouteConversation("Central Library", createConversationState("kn", "conv-direct-source"));
    
    // User replies directly with source "main gate"
    const directSource = continueRouteConversation("main gate", initial.state);
    expect(directSource.handled).toBe(true);
    expect(directSource.state.intent).toBe("route_ready");
    expect(directSource.route?.source.id).toBe("gate");

    // User replies with compound "howdu gate ninda"
    const compound = continueRouteConversation("howdu gate ninda", initial.state);
    expect(compound.handled).toBe(true);
    expect(compound.state.intent).toBe("route_ready");
    expect(compound.route?.source.id).toBe("gate");
  });

  it("handles user cancellations and greetings gracefully", () => {
    const initial = continueRouteConversation("Central Library", createConversationState("kn", "conv-cancel"));
    const canceled = continueRouteConversation("beda", initial.state);
    expect(canceled.handled).toBe(true);
    expect(canceled.state.intent).toBe("idle");
    expect(canceled.reply).toContain("ತೊಂದರೆಯಿಲ್ಲ");

    const greeting = continueRouteConversation("namaskara", createConversationState("kn", "conv-greet"));
    expect(greeting.handled).toBe(true);
    expect(greeting.reply).toContain("ಆಳ್ವಾಸ್ ರೋಬೋ");
  });
});

