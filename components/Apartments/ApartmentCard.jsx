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
            className={`group w-full border border-[#211827]/10 bg-white/78 text-left shadow-[0_14px_34px_rgba(88,47,117,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#211827]/16 hover:bg-white ${compactMode ? '' : 'backdrop-blur-[18px]'} ${
                compactMode ? 'rounded-[14px] px-3 py-2.5' : 'rounded-[18px] px-4.5 py-4'
            }`}
            style={{
                contentVisibility: 'auto',
                containIntrinsicSize: compactMode ? '64px' : '84px',
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-3.5">
                        <span className={`${compactMode ? 'text-[0.95rem]' : 'text-[1.22rem]'} font-semibold tracking-[0.08em] text-[#151518]`}>
                            {id.toString().padStart(3, '0')}
                        </span>
                        <span className={`rounded-full border border-[#211827]/10 bg-[#f4f0f7] font-semibold uppercase text-[#1c1c20]/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${compactMode ? 'px-2 py-0.5 text-[5.5px] tracking-[0.12em]' : 'px-2.5 py-1 text-[7.5px] tracking-[0.14em]'}`}>
                            {type}
                        </span>
                    </div>

                    <p className={`${compactMode ? 'mt-1 text-[7px]' : 'mt-1.5 text-[10px]'} truncate text-[#1c1c20]/52`}>
                        {detailLine.join(' / ')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`hidden border font-semibold uppercase sm:inline-flex ${
                            compactMode ? 'px-2 py-0.5 text-[5.5px] tracking-[0.12em]' : 'px-3 py-1 text-[7.5px] tracking-[0.14em]'
                        } ${
                            isAvailable
                                ? 'rounded-full border-[#211827]/12 bg-white text-[#1c1c20]/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]'
                                : 'rounded-full border-[#211827]/8 bg-[#f4f0f7] text-[#1c1c20]/38'
                        }`}
                    >
                        {isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                    <span
                        className={`inline-flex items-center justify-center border transition ${
                            compactMode ? 'h-7.5 w-7.5' : 'h-10 w-10'
                        } ${
                            isAvailable
                                ? 'rounded-full border-[#211827]/12 bg-[#171719] text-white shadow-[0_10px_24px_rgba(52,31,72,0.14)]'
                                : 'rounded-full border-[#211827]/8 bg-[#f4f0f7] text-[#1c1c20]/44'
                        }`}
                    >
                        <ArrowUpRight size={compactMode ? 11 : 15} />
                    </span>
                </div>
            </div>

            <div className={`${compactMode ? 'mt-1.5' : 'mt-1.5'} flex items-center justify-between gap-3 sm:hidden`}>
                <span
                    className={`inline-flex border font-semibold uppercase ${
                        compactMode ? 'px-2 py-0.5 text-[5.5px] tracking-[0.12em]' : 'px-3 py-1 text-[7.5px] tracking-[0.14em]'
                    } ${
                        isAvailable
                            ? 'rounded-full border-[#211827]/12 bg-white text-[#1c1c20]/74 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]'
                            : 'rounded-full border-[#211827]/8 bg-[#f4f0f7] text-[#1c1c20]/38'
                    }`}
                >
                    {isAvailable ? 'Available' : 'Sold Out'}
                </span>
            </div>
        </button>
    );
}
