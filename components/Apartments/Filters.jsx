import React from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";

const TYPE_OPTIONS = ["2 BHK", "3 BHK"];
const FACING_OPTIONS = ["east", "west", "north"];
const FLOOR_OPTIONS = ["G", "1", "2", "3", "4", "5", "6"];
const BALCONY_OPTIONS = ["1", "2", "3"];

function getChipTextStyle(compactMode) {
  return {
    fontSize: compactMode ? "13px" : "12.5px",
    letterSpacing: compactMode ? "0.1em" : "0.12em",
    lineHeight: 1,
  };
}

function FilterChip({ active, label, onClick, compactMode = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border font-semibold uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 ${
        compactMode ? "px-2.5 py-1.5" : "px-3 py-1.5"
      } ${
        active
          ? "border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.05))] text-white/92 shadow-[0_12px_24px_rgba(4,8,14,0.22)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] text-white/74 hover:border-white/14 hover:bg-white/[0.05] hover:text-white/90"
      }`}
      style={getChipTextStyle(compactMode)}
    >
      <span style={getChipTextStyle(compactMode)}>{label}</span>
    </button>
  );
}

function BooleanPill({ active, label, onClick, compactMode = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-300 ${
        compactMode ? "gap-2 px-2.5 py-1.5" : "gap-2 px-3 py-1.5"
      } ${
        active
          ? "border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] shadow-[0_10px_20px_rgba(4,8,14,0.18)]"
          : "border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] hover:border-white/14 hover:bg-white/[0.05]"
      }`}
    >
      <span
        className="font-semibold uppercase text-white/76"
        style={getChipTextStyle(compactMode)}
      >
        {label}
      </span>
      <span
        className={`relative inline-flex items-center rounded-full border transition-all duration-300 ${
          compactMode ? "h-4.5 w-8" : "h-5 w-9"
        } ${
          active ? "border-white/18 bg-white/14" : "border-white/10 bg-white/6"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full transition-transform duration-300 ${
            active
              ? compactMode
                ? "translate-x-3.5 bg-white/92"
                : "translate-x-4 bg-white/92"
              : "translate-x-0.5 bg-white/78"
          }`}
        />
      </span>
    </button>
  );
}

function FilterGroup({ label, children, compactMode = false }) {
  return (
    <div>
      <p className={`font-semibold text-white/68 ${compactMode ? "mb-1.5 text-[11.5px]" : "mb-2 text-[12px]"}`}>
        {label}
      </p>
      {children}
    </div>
  );
}

export default function Filters({
  filters,
  onToggle,
  onSetRange,
  onToggleBoolean,
  onClose,
  onReset,
  resultCount,
  totalCount,
  showCloseButton = true,
  compactMode = false,
}) {
  const {
    type,
    facing,
    floor,
    balconies,
    areaRange,
    withBalcony,
    availableOnly,
  } = filters;

  const minPercent = ((areaRange[0] - 800) / (1600 - 800)) * 100;
  const maxPercent = ((areaRange[1] - 800) / (1600 - 800)) * 100;

  return (
    <section className={compactMode ? "px-3.5 pb-3.5 pt-3.5 md:px-4" : "px-4 pb-4 pt-4"}>
      <div className={`flex items-start justify-between gap-3 ${compactMode ? "mb-3.5" : "mb-4"}`}>
        <div className="flex min-w-0 items-start gap-2.5">
          <div className={`flex shrink-0 items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] text-white/84 shadow-[0_12px_28px_rgba(8,12,18,0.18),inset_0_1px_0_rgba(255,255,255,0.1)] ${compactMode ? "h-8.5 w-8.5" : "h-9 w-9"}`}>
            <SlidersHorizontal size={compactMode ? 14 : 15} />
          </div>
          <div className="min-w-0">
            <h2 className={`font-semibold leading-none tracking-[-0.02em] text-white/94 ${compactMode ? "text-[19px]" : "text-[21px]"}`}>
              Filters
            </h2>
            <p className={`mt-1 text-white/56 ${compactMode ? "text-[11px] leading-4" : "text-[11.5px] leading-4"}`}>
              Refine available homes in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReset && !compactMode ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] px-3 py-1.5 text-[11px] font-semibold text-white/78 shadow-[0_10px_24px_rgba(8,12,18,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          ) : null}
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] text-white/70 shadow-[0_10px_24px_rgba(8,12,18,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              aria-label="Close panel"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={`mb-4 flex items-center justify-between gap-3 rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))] ${compactMode ? "px-3 py-2.5" : "px-3.5 py-3"} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}>
        <div>
          <p className={`font-semibold uppercase tracking-[0.12em] text-white/48 ${compactMode ? "text-[8px]" : "text-[8.5px]"}`}>
            Live Inventory
          </p>
          <p className={`mt-1 text-white/76 ${compactMode ? "text-[11px]" : "text-[11.5px]"}`}>
            {resultCount} matching homes
          </p>
        </div>
        {typeof totalCount === "number" ? (
          <span className={`rounded-full border border-white/10 bg-white/[0.04] font-semibold text-white/74 ${compactMode ? "px-2 py-1 text-[9.5px]" : "px-2.5 py-1 text-[10px]"}`}>
            {totalCount} total
          </span>
        ) : null}
      </div>

      <div className={compactMode ? "space-y-4" : "space-y-4.5"}>
        <FilterGroup label="Type" compactMode={compactMode}>
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={type.includes(value)}
                label={value}
                compactMode={compactMode}
                onClick={() => onToggle("type", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Floor" compactMode={compactMode}>
          <div className="flex flex-wrap gap-2">
            {FLOOR_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={floor.includes(value)}
                label={value}
                compactMode={compactMode}
                onClick={() => onToggle("floor", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Facing" compactMode={compactMode}>
          <div className="flex flex-wrap gap-2">
            {FACING_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={facing.includes(value)}
                label={value}
                compactMode={compactMode}
                onClick={() => onToggle("facing", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Balconies" compactMode={compactMode}>
          <div className="flex flex-wrap gap-2">
            {BALCONY_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={balconies.includes(value)}
                label={value}
                compactMode={compactMode}
                onClick={() => onToggle("balconies", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Area" compactMode={compactMode}>
          <div className={`flex items-center justify-between gap-3 ${compactMode ? "mb-2.5" : "mb-3"}`}>
            <div>
              <p className={`font-semibold text-white/82 ${compactMode ? "text-[11.5px]" : "text-[12px]"}`}>
                {areaRange[0]} to {areaRange[1]} sqft
              </p>
              <p className={`mt-0.5 text-white/44 ${compactMode ? "text-[9.5px]" : "text-[10px]"}`}>
                Drag both ends to refine the size range.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="h-2 rounded-full bg-white/10" />
            <div
              className="absolute top-0 h-2 rounded-full bg-[linear-gradient(90deg,rgba(239,243,248,0.94)_0%,rgba(255,255,255,0.88)_100%)]"
              style={{
                left: `${minPercent}%`,
                width: `${Math.max(maxPercent - minPercent, 2)}%`,
              }}
            />
            <input
              type="range"
              min={800}
              max={1600}
              step={10}
              value={areaRange[0]}
              onChange={(event) =>
                onSetRange([
                  Math.min(Number(event.target.value), areaRange[1] - 10),
                  areaRange[1],
                ])
              }
              className="absolute top-1/2 h-8 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/24 [&::-webkit-slider-thumb]:bg-[#eef2f7] [&::-webkit-slider-thumb]:shadow-[0_10px_18px_rgba(8,12,18,0.24)] [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <input
              type="range"
              min={800}
              max={1600}
              step={10}
              value={areaRange[1]}
              onChange={(event) =>
                onSetRange([
                  areaRange[0],
                  Math.max(Number(event.target.value), areaRange[0] + 10),
                ])
              }
              className="absolute top-1/2 h-8 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white/24 [&::-webkit-slider-thumb]:bg-[#eef2f7] [&::-webkit-slider-thumb]:shadow-[0_10px_18px_rgba(8,12,18,0.24)] [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <div className={`mt-2 flex items-center justify-between text-white/44 ${compactMode ? "text-[9.5px]" : "text-[10px]"}`}>
            <span>800 sqft</span>
            <span>1600 sqft</span>
          </div>
        </FilterGroup>

        <div className={`flex flex-wrap gap-2 ${compactMode ? "pt-0.5" : "pt-1"}`}>
          <BooleanPill
            active={availableOnly}
            label="Available"
            compactMode={compactMode}
            onClick={() => onToggleBoolean("availableOnly")}
          />
          <BooleanPill
            active={withBalcony}
            label="Balcony"
            compactMode={compactMode}
            onClick={() => onToggleBoolean("withBalcony")}
          />
        </div>
      </div>
    </section>
  );
}
