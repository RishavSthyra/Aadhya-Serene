import React from 'react';
import ApartmentCard from './ApartmentCard';

export default function ApartmentList({ apartments, onSelect, compactMode = false }) {
    if (!apartments || apartments.length === 0) {
        return (
            <div className={`border border-white/18 bg-[linear-gradient(145deg,rgba(250,252,255,0.2),rgba(196,221,255,0.08)_52%,rgba(255,255,255,0.08))] text-center shadow-[0_24px_70px_rgba(14,34,74,0.16)] backdrop-blur-[18px] ${compactMode ? 'rounded-none border-x-0 px-4 py-10' : 'rounded-[30px] px-6 py-12'}`}>
                <p className={`${compactMode ? 'text-[9px] tracking-[0.2em]' : 'text-[10px] tracking-[0.24em]'} font-semibold uppercase text-white/46`}>
                    No Matches
                </p>
                <p className={`${compactMode ? 'mt-3 text-[12px] leading-6' : 'mt-4 text-sm leading-7'} text-white/72`}>
                    No apartments match the current selection. Try widening the
                    area range or clearing one of the active filters.
                </p>
            </div>
        );
    }

    return (
        <div className={compactMode ? "space-y-1.5" : "space-y-2"}>
            {apartments.map((apartment) => (
                <ApartmentCard
                    key={apartment.id}
                    apartment={apartment}
                    compactMode={compactMode}
                    onSelect={onSelect}
                />
            ))}
            {/* <div className="rounded-[24px] border border-white/16 bg-white/[0.1] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/48">
                    Collection note
                </p>
                <p className="mt-2 text-[11px] leading-5 text-white/62">
                    Adjust the filters to reveal lighter, larger, or more
                    balcony-oriented residences across the collection.
                </p>
            </div> */}
        </div>
    );
}
