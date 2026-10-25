import React, { useEffect, useRef } from "react";
import type { RouteManeuver, ManeuverType } from "@shared/maneuvers";
import type { MapPosition } from "./CampusMap";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowUpLeft,
  CornerUpRight,
  CornerUpLeft,
  RotateCcw,
  Footprints,
  Layers,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export type StepByStepGuidancePanelProps = {
  maneuvers: RouteManeuver[];
  activeStepIndex: number;
  position?: MapPosition & { speed?: number; accuracy?: number; timestamp?: number };
  isNavigating: boolean;
  onAdvanceStep?: () => void;
  className?: string;
};

function getManeuverIcon(maneuver: ManeuverType) {
  switch (maneuver) {
    case "straight":
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    case "slight-right":
      return <ArrowUpRight className="h-4 w-4 text-blue-600" />;
    case "turn-right":
      return <CornerUpRight className="h-4 w-4 text-blue-600" />;
    case "slight-left":
      return <ArrowUpLeft className="h-4 w-4 text-blue-600" />;
    case "turn-left":
      return <CornerUpLeft className="h-4 w-4 text-blue-600" />;
    case "u-turn":
      return <RotateCcw className="h-4 w-4 text-blue-600" />;
    case "staircase":
      return <Footprints className="h-4 w-4 text-blue-600" />;
    case "floor-change":
      return <Layers className="h-4 w-4 text-blue-600" />;
    case "arrive":
    case "depart":
    default:
      return <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />;
  }
}

export function StepByStepGuidancePanel({
  maneuvers,
  activeStepIndex,
  className = "",
}: StepByStepGuidancePanelProps) {
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active maneuver into view safely
  useEffect(() => {
    if (typeof activeItemRef.current?.scrollIntoView === "function") {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeStepIndex]);

  const scrollUp = () => {
    scrollContainerRef.current?.scrollBy({ top: -120, behavior: "smooth" });
  };

  const scrollDown = () => {
    scrollContainerRef.current?.scrollBy({ top: 120, behavior: "smooth" });
  };

  return (
    <div
      className={`relative flex flex-col rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-xl backdrop-blur-md ${className}`}
    >
      {/* Optional scroll up button */}
      {maneuvers.length > 3 && (
        <button
          onClick={scrollUp}
          className="mx-auto -mt-1 text-slate-400 hover:text-slate-600 transition"
          aria-label="Scroll maneuvers up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}

      {/* Maneuvers Scrollable List */}
      <div
        ref={scrollContainerRef}
        className="max-h-[38vh] min-h-[140px] overflow-y-auto space-y-1.5 pr-1 scroll-smooth"
      >
        {maneuvers.length === 0 ? (
          <div className="py-6 text-center text-xs font-semibold text-slate-400">
            Select a destination to view turn guidance.
          </div>
        ) : (
          maneuvers.map((maneuver, index) => {
            const isActive = index === activeStepIndex;
            const isCompleted = index < activeStepIndex;

            return (
              <div
                key={`${maneuver.nodeId}-${index}`}
                ref={isActive ? activeItemRef : null}
                className={`flex items-start gap-3 rounded-xl p-2.5 transition-all ${
                  isActive
                    ? "bg-blue-50/90 ring-1 ring-blue-500/30 shadow-sm"
                    : isCompleted
                    ? "opacity-50 hover:opacity-80"
                    : "hover:bg-slate-50/80"
                }`}
              >
                {/* Direction Icon in Blue Rounded Square */}
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50/90 shadow-sm">
                  {getManeuverIcon(maneuver.maneuver)}
                </div>

                {/* Instruction & Distance */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold leading-tight ${
                      isActive
                        ? "text-blue-950 font-bold"
                        : isCompleted
                        ? "text-slate-500"
                        : "text-slate-800"
                    }`}
                  >
                    {maneuver.instruction}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {maneuver.distanceMeters > 0 ? `${maneuver.distanceMeters} m` : "Destination reached"}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optional scroll down button */}
      {maneuvers.length > 3 && (
        <button
          onClick={scrollDown}
          className="mx-auto -mb-1 text-slate-400 hover:text-slate-600 transition"
          aria-label="Scroll maneuvers down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
