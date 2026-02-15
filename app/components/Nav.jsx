"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["/about", "ABOUT"],
  ["/apartments", "APARTMENTS"],
  ["/amenities", "AMENITIES"],
  ["/walkthrough", "WALKTHROUGH"],
  ["/location", "LOCATION"],
  ["/contact", "CONTACT"],
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="header">
      <div className="brand"><Link href="/">Aadhya Serene</Link></div>
      <nav className="nav">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
