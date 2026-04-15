import { floorPlanSrc, flatsData, getFlatById } from '@/lib/flats';
import { createPageMetadata } from '@/lib/seo';

function formatFacing(facing) {
  if (!facing) return '';

  return facing.charAt(0).toUpperCase() + facing.slice(1);
}

function formatFloor(floor) {
  return floor === 'G' ? 'Ground Floor' : `Floor ${floor}`;
}

export function generateStaticParams() {
  return flatsData.map((flat) => ({
    id: flat.id,
  }));
}

export function generateMetadata({ params }) {
  const flatId = params?.id;
  const flat = getFlatById(flatId);

  if (!flat) {
    return createPageMetadata({
      title: 'Apartment Not Found',
      description:
        'Explore available 2 and 3 BHK apartments at Aadhya Serene in Thanisandra, Bengaluru with layouts, sizes, and residence details.',
      path: `/apartments/${flatId ?? ''}`,
      robots: {
        index: false,
        follow: false,
      },
    });
  }

  const facing = formatFacing(flat.facing);
  const floor = formatFloor(flat.floor);

  return createPageMetadata({
    title: `Apartment ${flat.id}`,
    description: `Explore Apartment ${flat.id}, a ${flat.type} ${flat.area} sqft ${facing}-facing home on ${floor} at Aadhya Serene in Thanisandra, Bengaluru.`,
    path: `/apartments/${flat.id}`,
    image: floorPlanSrc(flat.id),
    keywords: [
      `Apartment ${flat.id}`,
      `${flat.type} apartment in Thanisandra`,
      `${flat.area} sqft apartment Bengaluru`,
      `${facing} facing apartment`,
      'Aadhya Serene floor plan',
    ],
    type: 'article',
  });
}

export default function ApartmentDetailLayout({ children }) {
  return children;
}
