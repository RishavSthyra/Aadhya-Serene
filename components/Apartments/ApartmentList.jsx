import React from 'react';
import ApartmentCard from './ApartmentCard';

export default function ApartmentList({ apartments, onSelect }) {
    if (!apartments || apartments.length === 0) {
        return (
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,15,20,0.88)_0%,rgba(7,8,12,0.9)_100%)] px-6 py-12 text-center shadow-[0_24px_70px_rgba(0,0,0,0.3)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/34">
                    No Matches
                </p>
                <p className="mt-4 text-sm leading-7 text-white/62">
                    No apartments match the current selection. Try widening the
                    area range or clearing one of the active filters.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {apartments.map((apartment) => (
                <ApartmentCard
                    key={apartment.id}
                    apartment={apartment}
                    onSelect={onSelect}
                />
            ))}
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/30">
                    Curated finish
                </p>
                <p className="mt-2 text-[11px] leading-5 text-white/46">
                    Adjust the filters above to surface more residences and
                    alternate layouts.
                </p>
            </div>
        </div>
    );
}
