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
            className={`group w-full border border-white/12 bg-[linear-gradient(145deg,rgba(89,101,121,0.42),rgba(55,63,77,0.48)_58%,rgba(36,43,54,0.58)_100%)] text-left shadow-[0_16px_32px_rgba(9,12,18,0.24)] backdrop-blur-[18px] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/22 hover:bg-[linear-gradient(145deg,rgba(103,116,136,0.44),rgba(60,68,84,0.5)_58%,rgba(40,47,59,0.62)_100%)] ${
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
