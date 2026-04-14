import React from "react";

const TYPE_OPTIONS = ["2 BHK", "3 BHK"];
const FACING_OPTIONS = ["east", "west", "north"];
const FLOOR_OPTIONS = ["G", "1", "2", "3", "4", "5", "6"];
const BALCONY_OPTIONS = ["1", "2", "3"];

function FilterChip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 ${
        active
          ? "border-[#d4b96e] bg-[#d4b96e] text-[#101217]"
          : "border-white/15 bg-white/5 text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white/90"
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
      className={`flex items-center gap-3 rounded-full border px-4 py-2.5 transition-all duration-300 ${
        active
          ? "border-[#d4b96e]/55 bg-[#d4b96e]/12"
          : "border-white/12 bg-white/5 hover:border-white/20"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">{label}</span>
      <span
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 ${
          active ? "bg-[#d4b96e]" : "bg-white/12"
        }`}
      >
        <span
          className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-300 ${
            active ? "translate-x-5.5" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function Filters({
  filters,
  onToggle,
  onSetRange,
  onToggleBoolean,
  onClose,
  resultCount,
  totalCount,
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
    <section className="px-4 pb-5 pt-4">
      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="max-w-[230px]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#d4b96e]/85">
              Apartment Curation
            </p>
            <h2 className="mt-3 text-[28px] font-medium leading-[1.05] tracking-[0.08em] text-white">
              Refine your residence
            </h2>
            <p className="mt-3 text-[12px] leading-6 text-white/52">
              Filter by layout, level, outlook, and size to reveal the homes
              that suit your pace of living.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/5 text-white/50 transition hover:border-white/25 hover:bg-white/10 hover:text-white/80"
            aria-label="Close panel"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="mb-6 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/32">
            Current selection
          </p>
          <p className="mt-2 text-[14px] leading-6 text-white/68">
            <span className="font-semibold text-[#d4b96e]">{resultCount}</span>{" "}
            residences currently match your filters
            {typeof totalCount === "number" ? (
              <>
                {" "}
                from <span className="text-white/82">{totalCount}</span> total
                homes.
              </>
            ) : (
              "."
            )}
          </p>
        </div>

        <div className="space-y-5">
          {/* Type */}
          <div>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Type
            </p>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((value) => (
                <FilterChip
                  key={value}
                  active={type.includes(value)}
                  label={value}
                  onClick={() => onToggle("type", value)}
                />
              ))}
            </div>
          </div>

          {/* Floor */}
          <div>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Floor
            </p>
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
          </div>

          {/* Facing */}
          <div>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Facing
            </p>
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
          </div>

          {/* Balconies */}
          <div>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
              Balconies
            </p>
            <div className="flex gap-2">
              {BALCONY_OPTIONS.map((value) => (
                <FilterChip
                  key={value}
                  active={balconies.includes(value)}
                  label={value}
                  onClick={() => onToggle("balconies", value)}
                />
              ))}
            </div>
          </div>

          {/* Area Range */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Area
              </p>
              <span className="text-[10px] font-semibold text-[#d4b96e]">
                {areaRange[0]}–{areaRange[1]} sqft
              </span>
            </div>
            <div className="relative h-1 flex-1 rounded-full bg-white/10">
              <div
                className="absolute h-1 rounded-full bg-[#d4b96e]"
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
                onChange={(e) =>
                  onSetRange([Math.min(Number(e.target.value), areaRange[1] - 10), areaRange[1]])
                }
                className="absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#d4b96e] [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <input
                type="range"
                min={800}
                max={1600}
                step={10}
                value={areaRange[1]}
                onChange={(e) =>
                  onSetRange([areaRange[0], Math.max(Number(e.target.value), areaRange[0] + 10)])
                }
                className="absolute top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#d4b96e] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-white/35">
              <span>800 sqft</span>
              <span>1600 sqft</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-2">
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
      </div>
    </section>
  );
}
