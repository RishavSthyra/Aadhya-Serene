import { Suspense } from "react";
import InteriorPanoWalkthrough from "@/components/tour/InteriorPanoWalkthrough";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Interior Panorama Walkthrough",
  description:
    "Explore interior panorama views at Aadhya Serene to preview room layouts, finishes, and spatial flow across selected apartments.",
  path: "/interior-panos",
  keywords: [
    "Aadhya Serene interior panoramas",
    "interior apartment walkthrough Bengaluru",
    "virtual apartment interiors Thanisandra",
    "Aadhya Serene room preview",
  ],
});

export default function InteriorPanosPage() {
  return (
    <div className="fixed inset-0 z-20 bg-[#050608]">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-black text-white/70">
            Loading interior panoramas...
          </div>
        }
      >
        <InteriorPanoWalkthrough className="h-full w-full rounded-none border-0" />
      </Suspense>
    </div>
  );
}
