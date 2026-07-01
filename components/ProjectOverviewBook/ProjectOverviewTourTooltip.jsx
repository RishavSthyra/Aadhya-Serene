'use client';

import { X } from 'lucide-react';

export default function ProjectOverviewTourTooltip({
  closeProps,
  primaryProps,
  step,
  tooltipProps,
}) {
  return (
    <div
      {...tooltipProps}
      className="w-[min(90vw,240px)] border border-[#e2c089] bg-[rgba(18,14,10,0.96)] text-[#f6f0e7] shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
    >
      <div className="relative px-4 py-3">
        <button
          type="button"
          {...closeProps}
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center border border-white/10 bg-transparent text-[#d9ccbb] transition duration-150 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="pr-8">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#f3ddb6]">
            {step?.title}
          </h3>
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <button
            type="button"
            {...primaryProps}
            className="inline-flex items-center justify-center border border-[#e2c089] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#f3ddb6] transition duration-150 hover:bg-[#e2c089] hover:text-[#17110c]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
