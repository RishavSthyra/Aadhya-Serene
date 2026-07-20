import { Suspense } from "react";
import ExteriorVrExperience from "@/components/vr/ExteriorVrExperience";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "WebXR VR Walkthrough",
  description:
    "Step inside the Aadhya Serene walkthrough in WebXR with immersive exterior panorama navigation built for Quest-class VR browsers.",
  path: "/vr",
  keywords: [
    "Aadhya Serene VR walkthrough",
    "WebXR apartment walkthrough Bengaluru",
    "Meta Quest real estate VR tour",
    "Aadhya Serene immersive panorama",
  ],
});

export default function VrPage() {
  return (
    <div className="fixed inset-0 z-20 bg-[#050608]">
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-[#050608] text-white/72">
            Loading VR walkthrough...
          </div>
        }
      >
        <ExteriorVrExperience />
      </Suspense>
    </div>
  );
}
