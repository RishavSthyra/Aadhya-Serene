import Amenities from '../../components/Amenities';

export const metadata = { title: 'Amenities | Aadhya Serene' };

export default function Page({ searchParams }) {
  const initialAmenity = typeof searchParams?.amenity === 'string'
    ? searchParams.amenity
    : null;

  return <Amenities initialAmenity={initialAmenity} />;
}
