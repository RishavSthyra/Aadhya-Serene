'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function ApartmentCard({ apartment, onSelect }) {
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
            className="group w-full rounded-[22px] border border-white/12 bg-[linear-gradient(145deg,rgba(89,101,121,0.42),rgba(55,63,77,0.48)_58%,rgba(36,43,54,0.58)_100%)] px-4 py-3 text-left shadow-[0_16px_32px_rgba(9,12,18,0.24)] backdrop-blur-[18px] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/22 hover:bg-[linear-gradient(145deg,rgba(103,116,136,0.44),rgba(60,68,84,0.5)_58%,rgba(40,47,59,0.62)_100%)]"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <span className="text-[1.12rem] font-semibold tracking-[0.08em] text-white/94">
                            {id.toString().padStart(3, '0')}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-white/60">
                            {type}
                        </span>
                    </div>

                    <p className="mt-1.5 truncate text-[10px] text-white/50">
                        {detailLine.join(' / ')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`hidden rounded-full border px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.16em] sm:inline-flex ${
                            isAvailable
                                ? 'border-[#cbd5e5]/28 bg-[#d7dfeb]/14 text-[#edf2f8]'
                                : 'border-white/10 bg-white/[0.04] text-white/42'
                        }`}
                    >
                        {isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                    <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                            isAvailable
                                ? 'border-white/10 bg-white/[0.05] text-white/76'
                                : 'border-white/8 bg-white/[0.04] text-white/50'
                        }`}
                    >
                        <ArrowUpRight size={14} />
                    </span>
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 sm:hidden">
                <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[7px] font-semibold uppercase tracking-[0.16em] ${
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
