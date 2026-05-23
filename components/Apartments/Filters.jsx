import React from "react";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";

const TYPE_OPTIONS = ["2 BHK", "3 BHK"];
const FACING_OPTIONS = ["east", "west", "north"];
const FLOOR_OPTIONS = ["G", "1", "2", "3", "4", "5", "6"];
const BALCONY_OPTIONS = ["1", "2", "3"];

function getChipTextStyle(compactMode) {
  return {
    fontSize: compactMode ? "12px" : "12.5px",
    letterSpacing: compactMode ? "0.07em" : "0.09em",
    lineHeight: 1,
  };
}

function SegmentedOptions({
  options,
  selectedValue,
  onSelect,
  formatLabel = (value) => value,
  compactMode = false,
}) {
  const activeIndex = Math.max(0, options.indexOf(selectedValue));
  const hasSelection = options.includes(selectedValue);

  return (
    <div
      className="relative inline-grid overflow-hidden rounded-full border border-[#211827]/10 bg-[#f4f0f7] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 rounded-full bg-[#171719] shadow-[0_12px_28px_rgba(52,31,72,0.2)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          left: "4px",
          width: `calc((100% - 8px) / ${options.length})`,
          opacity: hasSelection ? 1 : 0,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />
      {options.map((value) => {
        const active = value === selectedValue;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={`relative z-10 rounded-full font-semibold uppercase transition-colors duration-300 ${
              compactMode ? "min-w-[44px] px-3 py-2" : "min-w-[52px] px-4 py-2.5"
            } ${active ? "text-white" : "text-[#1c1c20]/62 hover:text-[#1c1c20]"}`}
            style={getChipTextStyle(compactMode)}
          >
            {formatLabel(value)}
          </button>
        );
      })}
    </div>
  );
}

function BooleanPill({ active, label, onClick, compactMode = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.86)] transition-all duration-300 ${
        compactMode ? "gap-2 px-2.5 py-1.5" : "gap-2 px-3.5 py-1.5"
      } ${
        active
          ? "border-[#211827]/12 bg-white shadow-[0_12px_28px_rgba(88,47,117,0.1)]"
          : "border-[#211827]/10 bg-[#f4f0f7] hover:border-[#211827]/16 hover:bg-[#eee8f3]"
      }`}
    >
      <span
        className="font-semibold uppercase text-[#1c1c20]/72"
        style={getChipTextStyle(compactMode)}
      >
        {label}
      </span>
      <span
        className={`relative inline-flex items-center rounded-full border transition-all duration-300 ${
          compactMode ? "h-4.5 w-8" : "h-5.5 w-10"
        } ${
          active ? "border-[#171719] bg-[#171719]" : "border-[#211827]/10 bg-[#211827]/8"
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full transition-transform duration-300 ${
            active
              ? compactMode
                ? "translate-x-3.5 bg-white"
                : "translate-x-4.5 bg-white"
              : "translate-x-0.5 bg-white"
          }`}
        />
      </span>
    </button>
  );
}

function FilterGroup({ label, children, compactMode = false }) {
  return (
    <div>
      <p className={`font-semibold text-[#1c1c20]/66 ${compactMode ? "mb-2 text-[11px]" : "mb-2.5 text-[12.5px]"}`}>
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
    <section className={compactMode ? "px-4 pb-4 pt-4 md:px-5" : "px-5 pb-5 pt-5"}>
      <div className={`flex items-start justify-between gap-3 ${compactMode ? "mb-3.5" : "mb-4"}`}>
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex shrink-0 items-center justify-center rounded-full border border-[#211827]/10 bg-white text-[#1c1c20]/82 shadow-[0_12px_30px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] ${compactMode ? "h-8.5 w-8.5" : "h-10 w-10"}`}>
            <SlidersHorizontal size={compactMode ? 14 : 16} />
          </div>
          <div className="min-w-0">
            <h2 className={`font-semibold leading-none tracking-[-0.02em] text-[#151518] ${compactMode ? "text-[19px]" : "text-[24px] 2xl:text-[26px]"}`}>
              Filters
            </h2>
            <p className={`mt-1.5 text-[#1c1c20]/52 ${compactMode ? "text-[10.5px] leading-4" : "text-[12px] leading-5"}`}>
              Refine available homes in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReset && !compactMode ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#211827]/10 bg-white px-3.5 py-2 text-[12px] font-semibold text-[#1c1c20]/70 shadow-[0_10px_24px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition hover:border-[#211827]/16 hover:text-[#151518]"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          ) : null}
          {showCloseButton ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#211827]/10 bg-white text-[#1c1c20]/62 shadow-[0_10px_24px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition hover:border-[#211827]/16 hover:text-[#151518]"
              aria-label="Close panel"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={`mb-4 flex items-center justify-between gap-3 border-y border-[#211827]/8 ${compactMode ? "px-0 py-3" : "px-0 py-4"} shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]`}>
        <div>
          <p className={`font-semibold uppercase tracking-[0.12em] text-[#1c1c20]/38 ${compactMode ? "text-[8px]" : "text-[9.5px]"}`}>
            Live Inventory
          </p>
          <p className={`mt-1 text-[#151518]/78 ${compactMode ? "text-[11.5px]" : "text-[13px]"}`}>
            {resultCount} matching homes
          </p>
        </div>
        {typeof totalCount === "number" ? (
          <span className={`rounded-full border border-[#211827]/10 bg-[#f4f0f7] font-semibold text-[#151518]/64 ${compactMode ? "px-2 py-1 text-[9.5px]" : "px-3 py-1.5 text-[11px]"}`}>
            {totalCount} total
          </span>
        ) : null}
      </div>

      <div className={compactMode ? "space-y-3.5" : "space-y-4"}>
        <FilterGroup label="Type" compactMode={compactMode}>
          <SegmentedOptions
            options={TYPE_OPTIONS}
            selectedValue={type[0]}
            compactMode={compactMode}
            onSelect={(value) => onToggle("type", value)}
          />
        </FilterGroup>

        <FilterGroup label="Floor" compactMode={compactMode}>
          <SegmentedOptions
            options={FLOOR_OPTIONS}
            selectedValue={floor[0]}
            compactMode={compactMode}
            onSelect={(value) => onToggle("floor", value)}
          />
        </FilterGroup>

        <FilterGroup label="Facing" compactMode={compactMode}>
          <SegmentedOptions
            options={FACING_OPTIONS}
            selectedValue={facing[0]}
            formatLabel={(value) => value.toUpperCase()}
            compactMode={compactMode}
            onSelect={(value) => onToggle("facing", value)}
          />
        </FilterGroup>

        <FilterGroup label="Balconies" compactMode={compactMode}>
          <SegmentedOptions
            options={BALCONY_OPTIONS}
            selectedValue={balconies[0]}
            compactMode={compactMode}
            onSelect={(value) => onToggle("balconies", value)}
          />
        </FilterGroup>

        <FilterGroup label="Area" compactMode={compactMode}>
          <div className={`flex items-center justify-between gap-3 ${compactMode ? "mb-2.5" : "mb-3"}`}>
            <div>
              <p className={`font-semibold text-[#151518]/82 ${compactMode ? "text-[11px]" : "text-[12.5px]"}`}>
                {areaRange[0]} to {areaRange[1]} sqft
              </p>
              <p className={`mt-0.5 text-[#1c1c20]/42 ${compactMode ? "text-[9.5px]" : "text-[10.5px]"}`}>
                Drag both ends to refine the size range.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="h-2 rounded-full bg-[#211827]/10" />
            <div
              className="absolute top-0 h-2 rounded-full bg-[linear-gradient(90deg,rgba(167,74,255,0.82)_0%,rgba(235,77,164,0.78)_100%)]"
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
              className="absolute top-1/2 h-8 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#171719] [&::-webkit-slider-thumb]:shadow-[0_10px_18px_rgba(28,22,38,0.24)] [&::-webkit-slider-thumb]:cursor-pointer"
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
              className="absolute top-1/2 h-8 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[#171719] [&::-webkit-slider-thumb]:shadow-[0_10px_18px_rgba(28,22,38,0.24)] [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>

          <div className={`mt-2 flex items-center justify-between text-[#1c1c20]/42 ${compactMode ? "text-[9.5px]" : "text-[10px]"}`}>
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
