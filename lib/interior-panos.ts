import { PanoAssetStore, selectWarmupTiles } from "@/lib/exterior-tour/pano";

export const INTERIOR_PANO_BASE_URL =
  "https://cdn.sthyra.com/AADHYA%20SERENE/panos/";
export const INTERIOR_START_NODE_ID =
  "Bp_panoPath_interiorBP_panoPath2interior_F0010";
export const INTERIOR_START_PANO_ID =
  "LS_Bp_panoPath_interiorBP_panoPath2interior_F0010";
export const INTERIOR_START_PREVIEW_URL = `${INTERIOR_PANO_BASE_URL}${INTERIOR_START_PANO_ID}/preview.jpg`;

type InteriorPanoHrefOptions = {
  apartmentId?: string | null;
  flatNumber?: string | null;
  floorLabel?: string | null;
  bhk?: number | null;
  startNodeId?: string | null;
};

let interiorStartPreloadPromise: Promise<void> | null = null;

export function buildInteriorPanosHref(options?: InteriorPanoHrefOptions) {
  const params = new URLSearchParams();

  if (options?.apartmentId) {
    params.set("apartmentId", options.apartmentId);
  }

  if (options?.flatNumber) {
    params.set("flatNumber", options.flatNumber);
  }

  if (options?.floorLabel) {
    params.set("floorLabel", options.floorLabel);
  }

  if (typeof options?.bhk === "number" && Number.isFinite(options.bhk)) {
    params.set("bhk", String(options.bhk));
  }

  if (options?.startNodeId) {
    params.set("start", options.startNodeId);
  }

  const query = params.toString();
  return query ? `/interior-panos?${query}` : "/interior-panos";
}

export function preloadInteriorStartPano() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (interiorStartPreloadPromise) {
    return interiorStartPreloadPromise;
  }

  const assetStore = new PanoAssetStore(INTERIOR_PANO_BASE_URL);

  interiorStartPreloadPromise = (async () => {
    const meta = await assetStore.getMeta(INTERIOR_START_PANO_ID);

    await assetStore.preloadPreview(
      INTERIOR_START_PANO_ID,
      meta.preview ?? "preview.jpg",
      "high",
    );

    const warmupTiles = selectWarmupTiles(
      INTERIOR_START_PANO_ID,
      meta,
      INTERIOR_PANO_BASE_URL,
      10,
    );

    await Promise.allSettled(
      warmupTiles.slice(0, 10).map((tile, index) =>
        assetStore.preloadTile(tile, index < 2 ? "high" : "low"),
      ),
    );
  })().catch((error) => {
    console.debug("Interior pano preload skipped:", error);
  });

  return interiorStartPreloadPromise;
}
