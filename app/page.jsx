import Link from 'next/link';

export default function Page(){
  return (
    <main className="hero">
      <div>
        <h1>Your Haven of Harmony</h1>
        <p>Premium 2 & 3 BHK apartments in Thanisandra, Bengaluru.</p>
        <Link className="btn" href="/apartments">Step Inside Aadhya Serene</Link>
      </div>
    </main>
  );
}
