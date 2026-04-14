import { Suspense } from "react";
import InteriorPanoWalkthrough from "@/components/tour/InteriorPanoWalkthrough";

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
