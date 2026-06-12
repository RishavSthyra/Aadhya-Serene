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
            className={`group w-full border border-[#eee4f7] bg-[linear-gradient(145deg,rgba(255,254,252,0.96)_0%,rgba(251,245,255,0.92)_100%)] text-left shadow-[0_14px_34px_rgba(194,175,221,0.12),inset_0_1px_0_rgba(255,255,255,0.98)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ddcfee] hover:bg-[linear-gradient(145deg,rgba(255,255,255,1)_0%,rgba(252,247,255,0.98)_100%)] ${compactMode ? '' : 'backdrop-blur-[18px]'} ${
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
                        <span className={`${compactMode ? 'text-[0.95rem]' : 'text-[1.22rem]'} font-semibold tracking-[0.08em] text-[#33283e]`}>
                            {id.toString().padStart(3, '0')}
                        </span>
                        <span className={`rounded-full border border-[#eee4f7] bg-[linear-gradient(180deg,#fffdfc_0%,#f9f3ff_100%)] font-semibold uppercase text-[#917eb0] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] ${compactMode ? 'px-2 py-0.5 text-[5.5px] tracking-[0.12em]' : 'px-2.5 py-1 text-[7.5px] tracking-[0.14em]'}`}>
                            {type}
                        </span>
                    </div>

                    <p className={`${compactMode ? 'mt-1 text-[7px]' : 'mt-1.5 text-[10px]'} truncate text-[#8f8397]`}>
                        {detailLine.join(' / ')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span
                        className={`hidden border font-semibold uppercase sm:inline-flex ${
                            compactMode ? 'px-2 py-0.5 text-[5.5px] tracking-[0.12em]' : 'px-3 py-1 text-[7.5px] tracking-[0.14em]'
                        } ${
                            isAvailable
                                ? 'rounded-full border-[#e5d8f3] bg-[linear-gradient(180deg,#fffdfc_0%,#f9f3ff_100%)] text-[#8e7aa9] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]'
                                : 'rounded-full border-[#eee4f7] bg-[#f7f0fb] text-[#b1a3b6]'
                        }`}
                    >
                        {isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                    <span
                        className={`inline-flex items-center justify-center border transition ${
                            compactMode ? 'h-7.5 w-7.5' : 'h-10 w-10'
                        } ${
                            isAvailable
                                ? 'rounded-full border-[#d9cbef] bg-[linear-gradient(135deg,#cfc1ff_0%,#e6d9ff_100%)] text-[#6c60c4] shadow-[0_10px_24px_rgba(186,168,226,0.26)]'
                                : 'rounded-full border-[#eee4f7] bg-[#f7f0fb] text-[#ab9fbb]'
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
                            ? 'rounded-full border-[#e5d8f3] bg-[linear-gradient(180deg,#fffdfc_0%,#f9f3ff_100%)] text-[#8e7aa9] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]'
                            : 'rounded-full border-[#eee4f7] bg-[#f7f0fb] text-[#b1a3b6]'
                    }`}
                >
                    {isAvailable ? 'Available' : 'Sold Out'}
                </span>
            </div>
        </button>
    );
}
