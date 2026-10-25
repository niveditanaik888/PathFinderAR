import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, X, MapPin, Building2, Navigation, ArrowRight } from "lucide-react";
import { fuzzyMatchDestinations } from "@shared/destinationMatcher";
import type { Destination } from "@shared/pathfinder";
import { writeRouteSelection, readRouteSelection } from "@shared/route-selection";

export type SearchProps = {
  placeholder?: string;
  className?: string;
  onSelect?: (destination: Destination) => void;
  autoFocus?: boolean;
  variant?: "dark" | "light" | "adaptive";
};

export function Search({
  placeholder = "Search destinations, faculty cabins, labs…",
  className = "",
  onSelect,
  autoFocus = false,
  variant = "adaptive",
}: SearchProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuzzyMatchDestinations(query, { limit: 8, minScore: 35 });
  }, [query]);

  // Handle clicking outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (destination: Destination) => {
    setIsOpen(false);
    setQuery(destination.name);
    if (onSelect) {
      onSelect(destination);
    } else {
      const persisted = readRouteSelection(sessionStorage, window.location.search);
      const source = persisted.sourceNodeId && persisted.sourceNodeId !== "gate" ? persisted.sourceNodeId : "current-location";
      const next = writeRouteSelection(
        { sourceNodeId: source, destinationId: destination.id },
        sessionStorage
      );
      setLocation(`/map?to=${destination.id}&from=${next.sourceNodeId}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isLight = variant === "light";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <SearchIcon
          className={`absolute left-3.5 h-4 w-4 pointer-events-none ${
            isLight ? "text-slate-400" : "text-cyan-400"
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full rounded-xl border py-2 pl-10 pr-9 text-sm transition-all focus:outline-none focus:ring-2 shadow-sm ${
            isLight
              ? "border-slate-200 bg-slate-100/90 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-cyan-500/20"
              : "border-white/15 bg-slate-900/90 text-white placeholder-slate-400 backdrop-blur-md focus:border-cyan-400 focus:ring-cyan-400/20 shadow-lg"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className={`absolute right-3 grid h-5 w-5 place-items-center rounded-full transition ${
              isLight ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white"
            }`}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          role="listbox"
          className={`absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-80 overflow-y-auto rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150 ${
            isLight ? "border-slate-200 bg-white/98 text-slate-900" : "border-white/15 bg-slate-950/95 text-white"
          }`}
        >
          {results.map((dest, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <li
                key={dest.id}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => handleSelect(dest)}
                className={`group flex items-center justify-between gap-3 rounded-xl p-2.5 transition cursor-pointer ${
                  isSelected
                    ? isLight
                      ? "bg-cyan-50 text-cyan-900"
                      : "bg-cyan-500/20 text-white"
                    : isLight
                    ? "text-slate-700 hover:bg-slate-100"
                    : "text-slate-200 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {dest.imageUrl ? (
                    <img
                      src={dest.imageUrl}
                      alt=""
                      className={`h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ${
                        isLight ? "ring-slate-200" : "ring-white/10"
                      }`}
                    />
                  ) : (
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ${
                        isLight
                          ? "bg-cyan-50 text-cyan-600 ring-cyan-200"
                          : "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20"
                      }`}
                    >
                      <MapPin className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p
                      className={`font-semibold text-sm truncate ${
                        isLight ? "text-slate-900 group-hover:text-cyan-700" : "text-white group-hover:text-cyan-300"
                      }`}
                    >
                      {dest.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
                      <span>{dest.buildingName}</span>
                      <span>·</span>
                      <span>{dest.floorName}</span>
                      {dest.roomNumber && (
                        <>
                          <span>·</span>
                          <span
                            className={`font-mono ${isLight ? "text-cyan-700 font-semibold" : "text-cyan-400"}`}
                          >
                            {dest.roomNumber}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isLight ? "bg-slate-100 text-slate-600 border border-slate-200" : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {dest.category}
                  </span>
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-cyan-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
