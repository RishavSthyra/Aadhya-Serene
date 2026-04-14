export const INTERIOR_PANO_BASE_URL =
  "/api/cdn/panos/";
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
  return Promise.resolve();
}
