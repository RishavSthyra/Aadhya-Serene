import React from "react";
import { RotateCcw, X } from "lucide-react";

const TYPE_OPTIONS = ["2 BHK", "3 BHK"];
const FACING_OPTIONS = ["east", "west", "north"];
const FLOOR_OPTIONS = ["G", "1", "2", "3", "4", "5", "6"];
const BALCONY_OPTIONS = ["1", "2", "3"];

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 ${
        active
          ? "border-[#cfd7e5]/50 bg-[#cfd7e5]/16 text-white shadow-[0_8px_18px_rgba(10,14,22,0.2)]"
          : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/22 hover:bg-white/[0.08]"
      }`}
    >
      {label}
    </button>
  );
}

function BooleanPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 transition-all duration-300 ${
        active
          ? "border-[#cfd7e5]/40 bg-[#cfd7e5]/12 shadow-[0_8px_16px_rgba(10,14,22,0.18)]"
          : "border-white/12 bg-white/[0.04] hover:border-white/22 hover:bg-white/[0.08]"
      }`}
    >
      <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/74">
        {label}
      </span>
      <span
        className={`relative inline-flex h-4.5 w-8 items-center rounded-full border transition-all duration-300 ${
          active ? "border-white/22 bg-white/12" : "border-white/10 bg-white/6"
        }`}
      >
        <span
          className={`absolute h-3.5 w-3.5 rounded-full transition-transform duration-300 ${
            active ? "translate-x-4 bg-[#dde5f2]" : "translate-x-0.5 bg-white/78"
          }`}
        />
      </span>
    </button>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="mb-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/36">
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
    <section className="px-4 pb-4 pt-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="max-w-[240px]">
          <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/40">
            Apartment Curation
          </p>
          <h2 className="mt-2 text-[20px] font-medium leading-[1.04] tracking-[0.03em] text-white/94">
            Refine your residence
          </h2>
          <p className="mt-2 max-w-[220px] text-[10px] leading-5 text-white/46">
            Filter by layout, level, outlook, and size to reveal the homes
            that suit your pace of living.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/88"
            >
              <RotateCcw size={11} />
              Reset
            </button>
          ) : null}
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/64 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/84"
              aria-label="Close panel"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-4 border-b border-white/8 pb-3">
        <p className="text-[10px] leading-5 text-white/54">
          <span className="font-semibold text-white/90">{resultCount}</span> matches
          {typeof totalCount === "number" ? (
            <>
              {" "}
              from <span className="text-white/78">{totalCount}</span> homes
            </>
          ) : null}
        </p>
      </div>

      <div className="space-y-3.5">
        <FilterGroup label="Type">
          <div className="flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={type.includes(value)}
                label={value}
                onClick={() => onToggle("type", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Floor">
          <div className="flex flex-wrap gap-2">
            {FLOOR_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={floor.includes(value)}
                label={value}
                onClick={() => onToggle("floor", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Facing">
          <div className="flex flex-wrap gap-2">
            {FACING_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={facing.includes(value)}
                label={value}
                onClick={() => onToggle("facing", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Balconies">
          <div className="flex flex-wrap gap-2">
            {BALCONY_OPTIONS.map((value) => (
              <FilterChip
                key={value}
                active={balconies.includes(value)}
                label={value}
                onClick={() => onToggle("balconies", value)}
              />
            ))}
          </div>
        </FilterGroup>

        <FilterGroup label="Area">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <span className="text-[9px] text-white/40">800 sqft</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[7px] font-semibold uppercase tracking-[0.14em] text-white/66">
              {areaRange[0]} to {areaRange[1]} sqft
            </span>
            <span className="text-[9px] text-white/40">1600 sqft</span>
          </div>

          <div className="relative h-1 rounded-full bg-white/10">
            <div
              className="absolute h-1 rounded-full bg-[linear-gradient(90deg,rgba(194,206,225,0.95)_0%,rgba(225,232,243,0.95)_100%)]"
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
              className="absolute top-1/2 h-7 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#cad4e3] [&::-webkit-slider-thumb]:bg-[#eef2f7] [&::-webkit-slider-thumb]:cursor-pointer"
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
              className="absolute top-1/2 h-7 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[#cad4e3] [&::-webkit-slider-thumb]:bg-[#eef2f7] [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </FilterGroup>

        <div className="flex flex-wrap gap-2 pt-1">
          <BooleanPill
            active={availableOnly}
            label="Available"
            onClick={() => onToggleBoolean("availableOnly")}
          />
          <BooleanPill
            active={withBalcony}
            label="Balcony"
            onClick={() => onToggleBoolean("withBalcony")}
          />
        </div>
      </div>
    </section>
  );
}
