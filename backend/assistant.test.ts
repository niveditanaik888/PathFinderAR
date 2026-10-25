import { describe, expect, it } from "vitest";
import { answerAssistantTurn, assistantChatInputSchema, buildCampusContext, validateAssistantChatRequest } from "./assistant";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("campus assistant request validation", () => {
  it("accepts a bounded multilingual campus question", () => {
    const result = assistantChatInputSchema.parse({ message: "Where is the library?", language: "kn", history: [] });
    expect(result.language).toBe("kn");
  });

  it("rejects unsupported languages and oversized chat history", () => {
    const unsupportedLanguage = assistantChatInputSchema.safeParse({ message: "Hello", language: "fr" });
    expect(unsupportedLanguage.success).toBe(false);
    if (!unsupportedLanguage.success) expect(unsupportedLanguage.error.issues[0]?.path).toEqual(["language"]);
    expect(() => assistantChatInputSchema.parse({ message: "Hello", language: "en", history: Array.from({ length: 7 }, () => ({ role: "user", content: "Hello" })) })).toThrow();
  });

  it("returns the dedicated unsupported-language validation code for an assistant request", () => {
    expect(validateAssistantChatRequest({ message: "Hello", language: "fr", history: [] })).toEqual({ success: false, errorCode: "PRECONDITION_FAILED" });
  });

  it("exposes the dedicated error code through the assistant procedure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.assistant.chat({ message: "Bonjour", language: "fr", history: [] })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("grounds the system context in the configured PathFinder data", () => {
    expect(buildCampusContext()).toContain("Central Library");
    expect(buildCampusContext()).toContain("Computer Science Department");
    expect(buildCampusContext()).toContain("Artificial Intelligence & Machine Learning Engineering");
    expect(buildCampusContext()).toContain("https://www.aiet.org.in/");
  });

  it("lists the actual configured locations instead of returning a generic fallback", async () => {
    const result = await answerAssistantTurn({ message: "Give me the set of configured locations", language: "en", history: [] });
    expect(result.reply).toContain("Central Library");
    expect(result.reply).toContain("Computer Science Department");
    expect(result.reply).toContain("currently configured");
  });

  it("handles an unconfigured New Block request honestly with a useful next action", async () => {
    const result = await answerAssistantTurn({ message: "Where is the New Block?", language: "en", history: [] });
    expect(result.reply).toContain("couldn't find a verified PathFinder destination");
    expect(result.reply).toContain("https://new.aiet.org.in/");
  });

  it("answers queries using deterministic campus knowledge without generic error when offline", async () => {
    const greet = await answerAssistantTurn({ message: "namaskara", language: "kn", history: [] });
    expect(greet.reply).toContain("ಆಳ್ವಾಸ್ ರೋಬೋ");

    const chairman = await answerAssistantTurn({ message: "Who is the chairman of AIET?", language: "en", history: [] });
    expect(chairman.reply).toContain("Dr. M. Mohan Alva");

    const principal = await answerAssistantTurn({ message: "Who is the principal?", language: "kn", history: [] });
    expect(principal.reply).toContain("ಡಾ. ಪೀಟರ್ ಫೆರ್ನಾಂಡಿಸ್");

    const hod = await answerAssistantTurn({ message: "Where is Dr Manjunath Kotari?", language: "en", history: [] });
    expect(hod.reply).toContain("Dr. Manjunath Kotari");
    expect(hod.reply).toContain("Computing & Innovation Block");

    const courses = await answerAssistantTurn({ message: "What courses are offered?", language: "en", history: [] });
    expect(courses.reply).toContain("Computer Science & Engineering");
    expect(courses.reply).toContain("Artificial Intelligence & Machine Learning");

    // Exact user scenario: Central Library -> "howdu" -> "gate ninda"
    const step1 = await answerAssistantTurn({ message: "Central Library", language: "kn", history: [] });
    expect(step1.conversation?.intent).toBe("awaiting_route_confirmation");
    expect(step1.reply).toContain("ಮಾರ್ಗದರ್ಶನ ಬೇಕೇ");

    const step2 = await answerAssistantTurn({ message: "howdu", language: "kn", history: [], conversation: step1.conversation });
    expect(step2.conversation?.intent).toBe("awaiting_source");
    expect(step2.reply).toContain("ನೀವು ಎಲ್ಲಿಂದ ಪ್ರಾರಂಭಿಸುತ್ತಿದ್ದೀರಿ");

    const step3 = await answerAssistantTurn({ message: "gate ninda", language: "kn", history: [], conversation: step2.conversation });
    expect(step3.conversation?.intent).toBe("route_ready");
    expect(step3.route?.source.id).toBe("gate");
    expect(step3.reply).toContain("ಮಾರ್ಗ ದೊರಕಿದೆ");
  });
});

