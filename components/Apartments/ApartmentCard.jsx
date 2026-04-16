'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ApartmentCard({ apartment, onSelect, compactMode = false }) {
    const { id, type, area, facing, status, balconies, floor } = apartment;
    const isAvailable = status === 'available';
    const detailLine = [
        `${area} sqft`,
        facing.charAt(0).toUpperCase() + facing.slice(1),
        `Floor ${floor}`,
        ...(balconies > 0 ? [`${balconies} ${balconies === 1 ? 'Balcony' : 'Balconies'}`] : []),
    ];

    return (
        <button
            type="button"
            onClick={() => onSelect(apartment)}
            className={`group w-full border border-white/11 bg-[linear-gradient(145deg,rgba(104,117,139,0.32),rgba(68,77,94,0.38)_58%,rgba(41,48,60,0.48)_100%)] text-left shadow-[0_12px_24px_rgba(9,12,18,0.18)] backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:bg-[linear-gradient(145deg,rgba(115,128,149,0.36),rgba(72,82,98,0.42)_58%,rgba(45,52,65,0.52)_100%)] ${
                compactMode ? 'rounded-none border-x-0 px-3 py-2.5' : 'rounded-[22px] px-4 py-3'
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <span className={`${compactMode ? 'text-[1rem]' : 'text-[1.12rem]'} font-semibold tracking-[0.08em] text-white/94`}>
                            {id.toString().padStart(3, '0')}
                        </span>
                        <span className={`rounded-full border border-white/10 bg-white/[0.05] font-semibold uppercase text-white/60 ${compactMode ? 'px-2 py-0.5 text-[6px] tracking-[0.12em]' : 'px-2.5 py-1 text-[7px] tracking-[0.16em]'}`}>
                            {type}
                        </span>
                    </div>

                    <p className={`${compactMode ? 'mt-1 text-[8px]' : 'mt-1.5 text-[10px]'} truncate text-white/50`}>
                        {detailLine.join(' / ')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`hidden rounded-full border font-semibold uppercase sm:inline-flex ${
                            compactMode ? 'px-2 py-0.5 text-[6px] tracking-[0.12em]' : 'px-2.5 py-1 text-[7px] tracking-[0.16em]'
                        } ${
                            isAvailable
                                ? 'border-[#cbd5e5]/28 bg-[#d7dfeb]/14 text-[#edf2f8]'
                                : 'border-white/10 bg-white/[0.04] text-white/42'
                        }`}
                    >
                        {isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                    <span
                        className={`inline-flex items-center justify-center rounded-full border transition ${
                            compactMode ? 'h-8 w-8' : 'h-9 w-9'
                        } ${
                            isAvailable
                                ? 'border-white/10 bg-white/[0.05] text-white/76'
                                : 'border-white/8 bg-white/[0.04] text-white/50'
                        }`}
                    >
                        <ArrowUpRight size={compactMode ? 12 : 14} />
                    </span>
                </div>
            </div>

            <div className={`${compactMode ? 'mt-1.5' : 'mt-2'} flex items-center justify-between gap-3 sm:hidden`}>
                <span
                    className={`inline-flex rounded-full border font-semibold uppercase ${
                        compactMode ? 'px-2 py-0.5 text-[6px] tracking-[0.12em]' : 'px-2.5 py-1 text-[7px] tracking-[0.16em]'
                    } ${
                        isAvailable
                            ? 'border-[#cbd5e5]/28 bg-[#d7dfeb]/14 text-[#edf2f8]'
                            : 'border-white/10 bg-white/[0.04] text-white/42'
                    }`}
                >
                    {isAvailable ? 'Available' : 'Sold Out'}
                </span>
            </div>
        </button>
    );
}
