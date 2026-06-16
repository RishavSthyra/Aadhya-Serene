'use client';

import {
  FaBath,
  FaBolt,
  FaBuilding,
  FaDoorOpen,
  FaHammer,
  FaPaintRoller,
  FaShieldAlt,
  FaTint,
  FaUtensils,
} from 'react-icons/fa';
import { MdElevator, MdGridView, MdStairs } from 'react-icons/md';
import { useMemo } from 'react';

const specificationColumns = [
  [
    {
      title: 'STRUCTURE',
      icon: FaBuilding,
      lines: ['RCC framed structure designed as per Seismic Zone II requirements'],
    },
    {
      title: 'SUPER STRUCTURE',
      icon: FaBuilding,
      lines: [
        'Framed structure.',
        'INTERNAL WALLS: 100mm / 4" inch solid cement concrete blocks',
        'EXTERNAL WALLS: 150mm / 6" inch Solid cement concrete blocks',
        'ROOF SLAB: Reinforced cement concrete / water proofing with CC screed.',
      ],
    },
    {
      title: 'PAINTING',
      icon: FaPaintRoller,
      lines: [
        'INTERNAL WALLS: With Wall Putty Finishing With Asian Premier Emulsion Paint.',
        'EXTERNAL WALLS: With Exterior Waterproof Emulsion Paint.',
      ],
    },
    {
      title: 'PLASTERING',
      icon: FaHammer,
      lines: ['All internal walls are smoothly plastered.'],
    },
    {
      title: 'RAILING',
      icon: MdStairs,
      lines: ['Staircase :MS hand rail. Balcony: MS grill'],
    },
    {
      title: 'FLOORING',
      icon: MdGridView,
      lines: [
        'Vitrified tiles well reputed brand for the living, dining, kitchen and all bedrooms.',
        'Anti-Skid Ceramic tiles of well reputed brand for the Balcony, Utility and Toilets.',
        '4" inch Skirting to all rooms',
        'Granite flooring in common areas.',
      ],
    },
  ],
  [
    {
      title: 'KITCHEN',
      icon: FaUtensils,
      lines: [
        'Granite kitchen platform with stainless steel sink.',
        '2 feet dado tile above granite kitchen platform area in ceramic glazed tiles',
        'Provision for water purifier point in kitchen',
        'Provision for washing machine in utility area',
        'Provision for refrigerator, microwave/oven, mixer and modular chimney',
      ],
    },
    {
      title: 'TOILET',
      icon: FaBath,
      lines: [
        'Ceramic glazed dado tiles up to 7 feet.',
        'White colored (CERA /AMERICAN STANDARD or equal make) sanitary ware in all toilets.',
        'Hot and cold mixture unit, shower & other bathroom fittings of GROHE or equal make.',
        'Provision of points for geyser and exhaust fan.',
        'Toilet ventilators made of UPVC with louvers.',
      ],
    },
    {
      title: 'WATER',
      icon: FaTint,
      lines: [
        'Water supply system from bore well',
        'Rain water harvesting system to recharge the water table',
        'STP (Sewage Treatment Plant)',
      ],
    },
    {
      title: 'LIFT',
      icon: MdElevator,
      lines: ["Total 5 No's - 8 Passengers lift of Johnson / Schindler/ OTIS or Equivalent make."],
    },
    {
      title: 'SECURITY SYSTEMS',
      icon: FaShieldAlt,
      lines: ['24/7 security facility'],
    },
  ],
  [
    {
      title: 'DOORS AND WINDOWS',
      icon: FaDoorOpen,
      lines: [
        'Main Door : Engineered hard wood frame and flush shutters with veneer finished.',
        'Bedroom Doors : Engineered hard wood frames and flush shutters with veneer / laminate finished.',
        'Toilet & Utility Doors : Toilet and utility doors will be door shutters with laminate on the wet face.',
        'French doors : UPVC with Clear Glass.',
      ],
    },
    {
      title: 'ELECTRICAL',
      icon: FaBolt,
      lines: [
        'TV point in living room',
        'Fire resistant electrical wires of Polycab/ Havells or equivalent make',
        'Elegant modular electrical switches of Legrand or equivalent make and one Earth Leakage Circuit Breaker for safety.',
        'One Miniature Circuit Breaker (MCB) based main distribution box for each flat',
        'A/C power point in bedrooms',
      ],
    },
    {
      title: 'POWER / BACK UP GENERATOR BESCOM - POWER',
      icon: FaBolt,
      lines: [
        'Standby generator for lights in common areas, lifts and pumps',
        'DG Back up for each apartment up to 1 KVA',
      ],
    },
  ],
];

function SpecificationBlock({ title, icon: Icon, lines }) {
  return (
    <div className="border-b border-[#d8c2a1]/82 pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.45rem] border border-[#bb8647]/88 bg-[#fbf2e4]/80 text-[#9b6224]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[0.82rem] font-semibold uppercase tracking-[0.035em] text-[#9b6224]">
            {title}
          </h3>
          <ul className="mt-1.5 space-y-1.5 text-[0.7rem] leading-[1.16] text-[#4f3d2c]">
            {lines.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-[0.38rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[#9b6224]" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SpecificationsRightPage() {
  const carouselGestureProps = useMemo(
    () => ({
      onPointerDownCapture: (event) => event.stopPropagation(),
      onPointerMoveCapture: (event) => event.stopPropagation(),
      onTouchStartCapture: (event) => event.stopPropagation(),
      onTouchMoveCapture: (event) => event.stopPropagation(),
      onMouseDownCapture: (event) => event.stopPropagation(),
      onMouseMoveCapture: (event) => event.stopPropagation(),
    }),
    [],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(180deg,#fbf6ee_0%,#f5eadc_54%,#f1e3d2_100%)] px-4 py-4 text-[#4f3d2c] sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(214,183,134,0.22),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.52),transparent_16%,transparent_82%,rgba(191,153,92,0.08)_100%)]" />
      <div className="pointer-events-none absolute inset-x-[4.5%] top-[4.5%] h-px bg-[linear-gradient(90deg,transparent,rgba(173,122,55,0.36),transparent)]" />
      <div className="pointer-events-none absolute inset-x-[4.5%] bottom-[4.5%] h-px bg-[linear-gradient(90deg,transparent,rgba(173,122,55,0.22),transparent)]" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="shrink-0">
          <h2 className="text-center font-serif text-[0.9rem] font-semibold uppercase tracking-[0.52em] text-[#9b6224] sm:text-[1rem] sm:tracking-[0.66em] lg:text-[1.05rem] lg:tracking-[0.72em]">
            Specifications
          </h2>
          <div className="mx-auto mt-3 h-px w-28 bg-[linear-gradient(90deg,transparent,rgba(173,122,55,0.62),transparent)] sm:w-36" />
        </div>

        <div
          className="mt-4 flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:gap-3 md:overflow-visible md:pb-0 lg:mt-5 lg:gap-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            touchAction: 'pan-x',
            overscrollBehaviorX: 'contain',
          }}
          {...carouselGestureProps}
        >
          {specificationColumns.map((column, index) => (
            <div
              key={index}
              className="flex min-h-0 w-[88%] shrink-0 snap-center flex-col gap-4 px-1 sm:w-[72%] md:w-auto md:min-w-0 md:gap-4 md:px-0 lg:gap-5"
              {...carouselGestureProps}
            >
              {column.map((section) => (
                <SpecificationBlock key={section.title} {...section} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
