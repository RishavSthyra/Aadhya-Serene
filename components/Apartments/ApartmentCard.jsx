'use client';

import React from 'react';

export default function ApartmentCard({ apartment, onSelect }) {
    const { id, type, area, facing, status } = apartment;
    const isAvailable = status === 'available';

    return (
        <button
            type="button"
            onClick={() => onSelect(apartment)}
            className="group w-full rounded-[20px] border border-white/10 bg-black/30 px-4 py-3 text-left backdrop-blur-[10px] transition-all duration-300 hover:border-[#d9bd74]/22 hover:bg-black/40"
        >
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-[1.35rem] font-semibold tracking-[0.06em] text-white/90">
                        {id.toString().padStart(3, '0')}
                    </span>
                    <span className="h-4 w-px bg-white/12" />
                    <span className="text-[11px] font-semibold text-white/55">{type}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 text-[11px] text-white/45">
                        <span>{area} sqft</span>
                        <span className="h-3 w-px bg-white/12" />
                        <span className="capitalize">{facing}</span>
                    </div>
                    <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] ${
                            isAvailable
                                ? 'border-[#d8c17d]/22 bg-[#d8c17d]/8 text-[#c9b36b]'
                                : 'border-white/8 bg-white/3 text-white/40'
                        }`}
                    >
                        {isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                </div>
            </div>
        </button>
    );
}
