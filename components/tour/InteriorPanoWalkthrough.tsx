"use client";

import { Viewer, events as viewerEvents, type Position } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import { EquirectangularTilesAdapter } from "@photo-sphere-viewer/equirectangular-tiles-adapter";
import {
  VirtualTourPlugin,
  events as virtualTourEvents,
  type VirtualTourNode,
} from "@photo-sphere-viewer/virtual-tour-plugin";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Menu, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import navData from "@/data/nav.json";
import { clamp, distancePlanar, dotPlanar, normalizePlanar, wrapAngleRad } from "@/lib/exterior-tour/math";
import {
  buildExteriorTourGraph,
  getNodeHeading,
  imageFilenameToPanoId,
} from "@/lib/exterior-tour/nodes";
import {
  buildPhotoSpherePanorama,
  getResolvedPreviewUrl,
  PanoAssetStore,
} from "@/lib/exterior-tour/pano";
import type {
  DirectionalNavMap,
  ExteriorPanoNodeSource,
  ExteriorTourNode,
  NavigationDirection,
  PanoMeta,
} from "@/lib/exterior-tour/types";
import {
  INTERIOR_PANO_BASE_URL,
  INTERIOR_START_NODE_ID,
} from "@/lib/interior-panos";

const DEFAULT_ZOOM = 10;
const MIN_PITCH = -Math.PI / 2 + 0.08;
const MAX_PITCH = Math.PI / 2 - 0.08;
const INTERIOR_SPHERE_RESOLUTION = 128;
const INTERIOR_MIN_FOV = 36;
const INTERIOR_MAX_FOV = 74;
const INTERIOR_MINIMAP_IMAGE_URL = "/assets/glb%20aadhyaserene.avif";
const INTERIOR_MINIMAP_BOUNDS = {
  bottomLeft: { x: 3297, y: -619 },
  topRight: { x: 4318, y: 362 },
};
const INTERIOR_MINIMAP_FLIP_X = true;
const INTERIOR_MINIMAP_FLIP_Y = false;
const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)";
const TABLET_VIEWPORT_QUERY = "(max-width: 1023px)";

type InteriorPanoWalkthroughProps = {
  initialNodeId?: string;
  className?: string;
};

type ResolvedPano = {
  nodeId: string;
  panoId: string;
  meta: PanoMeta;
  panorama: ReturnType<typeof buildPhotoSpherePanorama>;
  previewUrl: string;
};

type ViewerBindings = {
  viewer: Viewer;
  virtualTour: VirtualTourPlugin;
};

type RoomTab = {
  id: string;
  label: string;
  previewUrl: string;
  featured: boolean;
};

type ViewportTier = "mobile" | "tablet" | "desktop";

type InteriorMinimapProps = {
  nodes: ExteriorTourNode[];
  activeNodeId: string;
  currentLabel: string;
  disabled?: boolean;
  onNavigate: (nodeId: string) => void;
};

const INTERIOR_PANO_DETAILS: Record<string, { label: string; featured?: boolean }> = {
  Bp_panoPath_interiorBP_panoPath4interior_F0000: { label: "Entrance", featured: true },
  Bp_panoPath_interiorBP_panoPath4interior_F0001: { label: "Entrance Passage" },
  Bp_panoPath_interiorBP_panoPath3interior_F0002: { label: "Kitchen", featured: true  },
  Bp_panoPath_interiorBP_panoPath3interior_F0003: { label: "Living Lounge" },
  Bp_panoPath_interiorBP_panoPath3interior_F0004: { label: "M.Bedroom", featured: true },
  Bp_panoPath_interiorBP_panoPath3interior_F0005: { label: "Dining Passage" },
  Bp_panoPath_interiorBP_panoPath3interior_F0006: { label: "Kitchen Transition" },
  Bp_panoPath_interiorBP_panoPath3interior_F0007: { label: "Kitchen Utility" },
  Bp_panoPath_interiorBP_panoPath5interior_F0008: { label: "C.Toilet"},
  Bp_panoPath_interiorBP_panoPath5interior_F0009: { label: "Powder Area" },
  Bp_panoPath_interiorBP_panoPath2interior_F0010: { label: "Living", featured: true },
  Bp_panoPath_interiorBP_panoPath2interior_F0011: { label: "Balcony Lounge" },
  Bp_panoPath_interiorBP_panoPath2interior_F0012: { label: "Bedroom Passage" },
  Bp_panoPath_interiorBP_panoPath2interior_F0013: { label: "Master Bedroom" },
  Bp_panoPath_interiorBP_panoPath6interior_F0014: { label: "Wardrobe Passage" },
  Bp_panoPath_interiorBP_panoPath6interior2_F0015: { label: "Master Toilet" },
  Bp_panoPath_interiorBP_panoPath6interior2_F0016: { label: "Bedroom 2", featured: true },
  Bp_panoPath_interiorBP_panoPath6interior2_F0017: { label: "Bedroom 03 Bath" },
  Bp_panoPath_interiorBP_panoPath6interior2_F0018: { label: "Kitchen"},
  Bp_panoPath_interiorBP_panoPath6interior2_F0019: { label: "Washroom", featured: true  },
};


function isFeaturedRoomTab(nodeId: string) {
  return Boolean(INTERIOR_PANO_DETAILS[nodeId]?.featured);
}

function getViewportTier() {
  if (typeof window === "undefined") {
    return "desktop" as ViewportTier;
  }

  if (window.matchMedia(MOBILE_VIEWPORT_QUERY).matches) {
    return "mobile" as ViewportTier;
  }

  if (window.matchMedia(TABLET_VIEWPORT_QUERY).matches) {
    return "tablet" as ViewportTier;
  }

  return "desktop" as ViewportTier;
}

function isAbortLikeError(error: unknown) {
  if (!error) {
    return false;
  }

  if (typeof error === "object") {
    const maybeError = error as { name?: string; message?: string };
    if (maybeError.name === "AbortError") {
      return true;
    }

    if (
      typeof maybeError.message === "string" &&
      maybeError.message.toLowerCase().includes("abort")
    ) {
      return true;
    }
  }

  return false;
}

function InteriorMinimap({
  nodes,
  activeNodeId,
  currentLabel,
  disabled = false,
  onNavigate,
}: InteriorMinimapProps) {
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    const image = new Image();
    image.decoding = "async";
    image.loading = "eager";
    image.src = INTERIOR_MINIMAP_IMAGE_URL;
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      if (width > 0 && height > 0) {
        setAspectRatio(width / height);
      }
    };
  }, []);

  const projectedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const baseXProgress = clamp(
          (node.rawPosition.x - INTERIOR_MINIMAP_BOUNDS.bottomLeft.x)
            / (INTERIOR_MINIMAP_BOUNDS.topRight.x - INTERIOR_MINIMAP_BOUNDS.bottomLeft.x),
          0,
          1,
        );
        const baseYProgress = clamp(
          (INTERIOR_MINIMAP_BOUNDS.topRight.y - node.rawPosition.y)
            / (INTERIOR_MINIMAP_BOUNDS.topRight.y - INTERIOR_MINIMAP_BOUNDS.bottomLeft.y),
          0,
          1,
        );
        const xProgress = INTERIOR_MINIMAP_FLIP_X ? 1 - baseXProgress : baseXProgress;
        const yProgress = INTERIOR_MINIMAP_FLIP_Y ? 1 - baseYProgress : baseYProgress;

        return {
          id: node.id,
          label: formatRoomLabel(node.id, node.imageFilename),
          left: xProgress * 100,
          top: yProgress * 100,
          isActive: node.id === activeNodeId,
        };
      }),
    [activeNodeId, nodes],
  );

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-30 w-[42vw] min-w-[9.75rem] max-w-[13rem] sm:w-[11.5rem] sm:max-w-[14rem] md:w-[13.5rem] lg:w-[15.5rem]">
      <div className="overflow-hidden ">
        <div
          className="relative w-full overflow-hidden "
          style={{ aspectRatio }}
        >
          <img
            src={INTERIOR_MINIMAP_IMAGE_URL}
            alt="Interior minimap"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          {projectedNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              aria-label={`Open ${node.label}`}
              title={node.label}
              disabled={disabled}
              onClick={() => onNavigate(node.id)}
              className={`absolute rounded-full border transition duration-200 ${
                node.isActive
                  ? "h-2.5 w-2.5 border-[#d9f7ff] bg-[#6ee7ff] shadow-[0_0_0_3px_rgba(77,234,255,0.18),0_0_14px_rgba(77,234,255,0.6)]"
                  : "h-1.5 w-1.5 border-[#baf4ff] bg-[#32dfff] shadow-[0_0_8px_rgba(50,223,255,0.7)] hover:scale-110 hover:border-[#e8fcff] hover:bg-[#7cebff]"
              } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
              style={{
                left: `${node.left}%`,
                top: `${node.top}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span className="sr-only">{node.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArrowButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof ArrowUp;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="group flex h-9 w-9 items-center justify-center rounded-[0.95rem] border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(235,240,245,0.14))] text-white shadow-[0_16px_34px_rgba(8,12,20,0.24),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl saturate-[180%] transition duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(238,243,247,0.2))] disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10 md:h-11 md:w-11 lg:h-12 lg:w-12"
    >
      <Icon className="h-4 w-4 transition duration-200 group-hover:scale-110 sm:h-[1.05rem] sm:w-[1.05rem] md:h-[1.15rem] md:w-[1.15rem]" />
    </button>
  );
}

function formatRoomLabel(nodeId: string, imageFilename: string) {
  const namedRoom = INTERIOR_PANO_DETAILS[nodeId]?.label;
  if (namedRoom) {
    return namedRoom;
  }

  const panoId = imageFilenameToPanoId(imageFilename);
  const frame = panoId.match(/F(\d{4})$/i)?.[1];

  if (!frame) {
    return panoId;
  }

  return `Room ${frame}`;
}

function vectorFromAngle(angle: number) {
  return {
    x: Math.cos(angle),
    y: Math.sin(angle),
    z: 0,
  };
}

function getBestDirectionalTarget(
  activeNode: ExteriorTourNode,
  candidates: ExteriorTourNode[],
  desiredAngle: number,
  direction: NavigationDirection,
) {
  const desiredVector = vectorFromAngle(desiredAngle);
  const ranked = candidates
    .map((candidate) => {
      const delta = {
        x: candidate.rawPosition.x - activeNode.rawPosition.x,
        y: candidate.rawPosition.y - activeNode.rawPosition.y,
        z: 0,
      };
      const directionVector = normalizePlanar(delta, desiredVector);
      const distance = distancePlanar(activeNode.rawPosition, candidate.rawPosition);
      const alignment = dotPlanar(directionVector, desiredVector);
      const distanceBias =
        1 - clamp(distance / Math.max(activeNode.nearestDistance * 4.75, 1), 0, 1);

      return {
        direction,
        node: candidate,
        score: alignment * 0.82 + distanceBias * 0.18,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 0.1) {
    return { direction, node: null, score: best?.score ?? -Infinity };
  }

  return best;
}

function getViewRelativeNavigationTargets(
  graph: { nodes: ExteriorTourNode[] },
  activeNode: ExteriorTourNode | undefined,
  currentYaw: number,
): DirectionalNavMap {
  const empty = {
    forward: { direction: "forward" as const, node: null, score: -Infinity },
    left: { direction: "left" as const, node: null, score: -Infinity },
    right: { direction: "right" as const, node: null, score: -Infinity },
    backward: { direction: "backward" as const, node: null, score: -Infinity },
  };

  if (!activeNode) {
    return empty;
  }

  const worldForwardAngle = getNodeHeading(activeNode) + currentYaw;
  const desiredAngles: Record<NavigationDirection, number> = {
    forward: worldForwardAngle,
    left: worldForwardAngle - Math.PI / 2,
    right: worldForwardAngle + Math.PI / 2,
    backward: worldForwardAngle + Math.PI,
  };
  const candidates = graph.nodes.filter((node) => node.id !== activeNode.id);

  return {
    forward: getBestDirectionalTarget(activeNode, candidates, desiredAngles.forward, "forward"),
    left: getBestDirectionalTarget(activeNode, candidates, desiredAngles.left, "left"),
    right: getBestDirectionalTarget(activeNode, candidates, desiredAngles.right, "right"),
    backward: getBestDirectionalTarget(activeNode, candidates, desiredAngles.backward, "backward"),
  };
}

function buildLinkPosition(node: ExteriorTourNode, target: ExteriorTourNode): Position {
  const dx = target.rawPosition.x - node.rawPosition.x;
  const dy = target.rawPosition.y - node.rawPosition.y;
  const dz = target.rawPosition.z - node.rawPosition.z;
  const planarDistance = Math.max(distancePlanar(node.rawPosition, target.rawPosition), 1);

  return {
    yaw: wrapAngleRad(Math.atan2(dy, dx) - getNodeHeading(node)),
    pitch: clamp(Math.atan2(dz, planarDistance), MIN_PITCH, MAX_PITCH),
  };
}

export default function InteriorPanoWalkthrough({
  initialNodeId,
  className,
}: InteriorPanoWalkthroughProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStartNode = searchParams.get("start") ?? initialNodeId ?? INTERIOR_START_NODE_ID;
  const viewerHostRef = useRef<HTMLDivElement | null>(null);
  const bindingsRef = useRef<ViewerBindings | null>(null);
  const activeNodeIdRef = useRef("");
  const currentNodeIdRef = useRef("");
  const cacheRef = useRef(new Map<string, ResolvedPano>());
  const transitionLockRef = useRef(false);
  const committedYawRef = useRef(0);
  const pendingYawRef = useRef(0);
  const yawFrameRef = useRef<number | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewYaw, setViewYaw] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState("");
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [availableNodeIds, setAvailableNodeIds] = useState<Set<string> | null>(null);
  const [viewportTier, setViewportTier] = useState<ViewportTier>("desktop");

  const isMobileViewport = viewportTier === "mobile";
  const isTabletViewport = viewportTier === "tablet";
  const isTabletOrBelow = viewportTier !== "desktop";

  const allNodes = useMemo(
    () => navData as ExteriorPanoNodeSource[],
    [],
  );
  const assetStore = useMemo(
    () => new PanoAssetStore(INTERIOR_PANO_BASE_URL),
    [],
  );
  const availableNodes = useMemo(() => {
    if (availableNodeIds === null) {
      return [];
    }

    return allNodes.filter((node) => availableNodeIds.has(node.id));
  }, [allNodes, availableNodeIds]);

  const graph = useMemo(() => buildExteriorTourGraph(availableNodes), [availableNodes]);
  const viewerTuning = useMemo(() => {
    const sphereResolution = isMobileViewport
      ? 64
      : isTabletOrBelow
        ? 96
        : INTERIOR_SPHERE_RESOLUTION;

    return {
      sphereResolution,
      antialias: !isMobileViewport && !isSlowNetwork,
      baseBlur: !isMobileViewport,
      moveSpeed: isMobileViewport ? 1.45 : isTabletViewport ? 1.7 : isSlowNetwork ? 1.8 : 2.2,
      moveInertia: isMobileViewport ? 0.72 : isTabletViewport ? 0.8 : isSlowNetwork ? 0.86 : 0.92,
      transitionSpeed: isMobileViewport ? 280 : isTabletViewport ? 320 : 380,
      yawUpdateThreshold: isMobileViewport ? 0.11 : isTabletViewport ? 0.075 : 0.04,
      powerPreference: isTabletOrBelow ? "default" : "high-performance",
    } as const;
  }, [isMobileViewport, isSlowNetwork, isTabletOrBelow, isTabletViewport]);

  const currentNodeId =
    (activeNodeId && graph.byId[activeNodeId] ? activeNodeId : "") ||
    (graph.byId[requestedStartNode] ? requestedStartNode : "") ||
    (graph.byId[INTERIOR_START_NODE_ID] ? INTERIOR_START_NODE_ID : "") ||
    graph.nodes[0]?.id ||
    "";

  const activeNode = graph.byId[currentNodeId];
  const navigationTargets = useMemo(
    () => getViewRelativeNavigationTargets(graph, activeNode, viewYaw),
    [activeNode, graph, viewYaw],
  );

  const roomTabs = useMemo<RoomTab[]>(
    () =>
      graph.nodes.map((node) => {
        const panoId = imageFilenameToPanoId(node.imageFilename);
        return {
          id: node.id,
          label: formatRoomLabel(node.id, node.imageFilename),
          previewUrl: getResolvedPreviewUrl(panoId, INTERIOR_PANO_BASE_URL, "preview.jpg"),
          featured: isFeaturedRoomTab(node.id),
        };
      }),
    [graph.nodes],
  );

  const visibleRoomTabs = useMemo(() => {
    const featuredTabs = roomTabs.filter((tab) => tab.featured);

    if (!featuredTabs.some((tab) => tab.id === currentNodeId)) {
      const currentTab = roomTabs.find((tab) => tab.id === currentNodeId);
      if (currentTab) {
        return [currentTab, ...featuredTabs];
      }
    }

    return featuredTabs;
  }, [currentNodeId, roomTabs]);
  const currentRoomLabel = activeNode
    ? formatRoomLabel(activeNode.id, activeNode.imageFilename)
    : "Interior Walkthrough";

  const walkthroughContext = useMemo(
    () => ({
      apartmentId: searchParams.get("apartmentId"),
      flatNumber: searchParams.get("flatNumber"),
      floorLabel: searchParams.get("floorLabel"),
      bhk: searchParams.get("bhk"),
    }),
    [searchParams],
  );

  useEffect(() => {
    let cancelled = false;

    const resolveAvailableNodes = async () => {
      const availabilityChecks = await Promise.allSettled(
        allNodes.map(async (node) => {
          const panoId = imageFilenameToPanoId(node.image_filename);
          await assetStore.getMeta(panoId);
          return node.id;
        }),
      );

      if (cancelled) {
        return;
      }

      const nextAvailableNodeIds = new Set<string>();

      availabilityChecks.forEach((result) => {
        if (result.status === "fulfilled") {
          nextAvailableNodeIds.add(result.value);
        }
      });

      setAvailableNodeIds(nextAvailableNodeIds);
    };

    void resolveAvailableNodes();

    return () => {
      cancelled = true;
    };
    
  }, [allNodes, assetStore]);

  const resolvePano = useCallback(
    async (nodeId: string) => {
      const node = graph.byId[nodeId];
      if (!node) {
        throw new Error(`Unknown interior node: ${nodeId}`);
      }

      const panoId = imageFilenameToPanoId(node.imageFilename);
      const cached = cacheRef.current.get(panoId);
      if (cached) {
        return cached;
      }

      const meta = await assetStore.getMeta(panoId);
      const previewUrl = getResolvedPreviewUrl(
        panoId,
        INTERIOR_PANO_BASE_URL,
        meta.preview ?? "preview.jpg",
      );

      const resolved: ResolvedPano = {
        nodeId,
        panoId,
        meta,
        panorama: buildPhotoSpherePanorama(panoId, meta, INTERIOR_PANO_BASE_URL, true, previewUrl),
        previewUrl,
      };

      cacheRef.current.set(panoId, resolved);
      return resolved;
    },
    [assetStore, graph.byId],
  );

  const buildTourNode = useCallback(
    async (node: ExteriorTourNode): Promise<VirtualTourNode> => {
      const resolved = await resolvePano(node.id);

      return {
        id: node.id,
        panorama: resolved.panorama,
        thumbnail: resolved.previewUrl,
        name: formatRoomLabel(node.id, node.imageFilename),
        caption: formatRoomLabel(node.id, node.imageFilename),
        links: node.neighbors
          .map((neighbor) => graph.byId[neighbor.id])
          .filter((target): target is ExteriorTourNode => Boolean(target))
          .map((target) => ({
            nodeId: target.id,
            position: buildLinkPosition(node, target),
          })),
      };
    },
    [graph.byId, resolvePano],
  );

  const goToNode = useCallback(
    async (targetId: string) => {
      const bindings = bindingsRef.current;
      const targetNode = graph.byId[targetId];

      if (
        !bindings ||
        !targetNode ||
        isTransitioning ||
        transitionLockRef.current ||
        targetId === activeNodeIdRef.current
      ) {
        return;
      }

      transitionLockRef.current = true;
      setViewerError(null);

      try {
        const refreshedNode = await buildTourNode(targetNode);
        bindings.virtualTour.updateNode(refreshedNode);

        setIsTransitioning(true);
        const completed = await bindings.virtualTour.setCurrentNode(targetId, {
          effect: "none",
          showLoader: false,
          speed: viewerTuning.transitionSpeed,
          rotation: false,
        });

        if (completed === false) {
          setIsTransitioning(false);
          transitionLockRef.current = false;
        }
      } catch (error) {
        console.error("Failed to change interior pano node:", error);
        setViewerError(`Failed to load ${formatRoomLabel(targetNode.id, targetNode.imageFilename)}.`);
        setIsTransitioning(false);
        transitionLockRef.current = false;
      }
    },
    [buildTourNode, graph.byId, isTransitioning, viewerTuning.transitionSpeed],
  );

  const navigateToDirection = useCallback(
    async (direction: NavigationDirection) => {
      const target = navigationTargets[direction].node;
      if (!target) return;
      await goToNode(target.id);
    },
    [goToNode, navigationTargets],
  );

  useEffect(() => {
    activeNodeIdRef.current = activeNodeId;
  }, [activeNodeId]);

  useEffect(() => {
    currentNodeIdRef.current = currentNodeId;
  }, [currentNodeId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mobileQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const tabletQuery = window.matchMedia(TABLET_VIEWPORT_QUERY);
    const syncViewportTier = () => {
      setViewportTier(getViewportTier());
    };

    syncViewportTier();
    mobileQuery.addEventListener("change", syncViewportTier);
    tabletQuery.addEventListener("change", syncViewportTier);

    return () => {
      mobileQuery.removeEventListener("change", syncViewportTier);
      tabletQuery.removeEventListener("change", syncViewportTier);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }

    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean; addEventListener?: (type: "change", listener: () => void) => void; removeEventListener?: (type: "change", listener: () => void) => void };
      mozConnection?: { effectiveType?: string; saveData?: boolean; addEventListener?: (type: "change", listener: () => void) => void; removeEventListener?: (type: "change", listener: () => void) => void };
      webkitConnection?: { effectiveType?: string; saveData?: boolean; addEventListener?: (type: "change", listener: () => void) => void; removeEventListener?: (type: "change", listener: () => void) => void };
    };
    const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
    if (!connection) {
      return;
    }

    const updateSlowNetworkState = () => {
      const effectiveType = connection.effectiveType?.toLowerCase() ?? "";
      setIsSlowNetwork(
        Boolean(connection.saveData) ||
          effectiveType === "slow-2g" ||
          effectiveType === "2g" ||
          effectiveType === "3g",
      );
    };

    updateSlowNetworkState();
    connection.addEventListener?.("change", updateSlowNetworkState);

    return () => {
      connection.removeEventListener?.("change", updateSlowNetworkState);
    };
  }, []);

  const commitViewYaw = useCallback(
    (nextYaw: number, force = false) => {
      pendingYawRef.current = nextYaw;

      if (
        !force
        && Math.abs(wrapAngleRad(nextYaw - committedYawRef.current)) < viewerTuning.yawUpdateThreshold
      ) {
        return;
      }

      if (yawFrameRef.current !== null) {
        return;
      }

      yawFrameRef.current = globalThis.requestAnimationFrame(() => {
        yawFrameRef.current = null;
        committedYawRef.current = pendingYawRef.current;
        setViewYaw(pendingYawRef.current);
      });
    },
    [viewerTuning.yawUpdateThreshold],
  );

  useEffect(() => {
    if (!viewerHostRef.current || !graph.nodes.length || !currentNodeId || availableNodeIds === null) {
      return;
    }

    let disposed = false;
    let initTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

    const initializeViewer = async () => {
      const startNodeId = currentNodeIdRef.current;

      const builtNodes = await Promise.allSettled(graph.nodes.map((node) => buildTourNode(node)));
      const tourNodes = builtNodes
        .filter((result): result is PromiseFulfilledResult<VirtualTourNode> => result.status === "fulfilled")
        .map((result) => result.value);

      if (disposed || !viewerHostRef.current || !tourNodes.length) {
        return;
      }

      const actualStartNodeId = tourNodes.some((node) => node.id === startNodeId)
        ? startNodeId
        : tourNodes[0].id;

      setViewerError(null);
      viewerHostRef.current.replaceChildren();

      const viewer = new Viewer({
        container: viewerHostRef.current,
        adapter: EquirectangularTilesAdapter.withConfig({
          resolution: INTERIOR_SPHERE_RESOLUTION,
          showErrorTile: false,
          baseBlur: true,
          antialias: true,
        }),
        navbar: false,
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
        defaultYaw: "0deg",
        defaultZoomLvl: DEFAULT_ZOOM,
        minFov: INTERIOR_MIN_FOV,
        maxFov: INTERIOR_MAX_FOV,
        moveSpeed: isSlowNetwork ? 1.8 : 2.2,
        moveInertia: isSlowNetwork ? 0.86 : 0.92,
        rendererParameters: {
          antialias: true,
          powerPreference: "high-performance",
        },
        plugins: [
          VirtualTourPlugin.withConfig({
            positionMode: "manual",
            renderMode: "3d",
            nodes: tourNodes,
            startNodeId: actualStartNodeId,
            preload: false,
            transitionOptions: {
              effect: "none",
              showLoader: true,
              speed: 380,
              rotation: false,
            },
            linksOnCompass: false,
          }),
        ],
      });

      const virtualTour = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin);
      const handleNodeChanged = ({ node }: { node: VirtualTourNode }) => {
        setActiveNodeId(node.id);
        setViewYaw(viewer.getPosition().yaw);
        setViewerError(null);
        setIsTransitioning(false);
        transitionLockRef.current = false;
      };
      const handlePanoramaError = () => {
        setViewerError("Panorama failed to load.");
        setIsTransitioning(false);
        transitionLockRef.current = false;
      };
      const handlePositionUpdated = (event: Event) => {
        const nextPosition = (event as Event & { position?: Position }).position;
        if (nextPosition) {
          setViewYaw(nextPosition.yaw);
        }
      };

      virtualTour.addEventListener(virtualTourEvents.NodeChangedEvent.type, handleNodeChanged);
      viewer.addEventListener(viewerEvents.PanoramaErrorEvent.type, handlePanoramaError);
      viewer.addEventListener(viewerEvents.PositionUpdatedEvent.type, handlePositionUpdated);

      bindingsRef.current = { viewer, virtualTour };
      setActiveNodeId(actualStartNodeId);
      setViewYaw(viewer.getPosition().yaw);
      setViewerError(null);
      setIsTransitioning(false);
      transitionLockRef.current = false;

      if (disposed) {
        virtualTour.removeEventListener(virtualTourEvents.NodeChangedEvent.type, handleNodeChanged);
        viewer.removeEventListener(viewerEvents.PanoramaErrorEvent.type, handlePanoramaError);
        viewer.removeEventListener(viewerEvents.PositionUpdatedEvent.type, handlePositionUpdated);
        viewer.destroy();
        if (bindingsRef.current?.viewer === viewer) {
          bindingsRef.current = null;
        }
      }
    };

    initTimer = globalThis.setTimeout(() => {
      void initializeViewer().catch((error) => {
        if (disposed || isAbortLikeError(error)) {
          return;
        }

        console.error("Failed to initialize interior pano viewer:", error);
        setViewerError("Viewer failed to initialize.");
        setIsTransitioning(false);
      });
    }, 0);

    return () => {
      disposed = true;
      if (initTimer) {
        globalThis.clearTimeout(initTimer);
      }

      if (bindingsRef.current) {
        bindingsRef.current.viewer.destroy();
        bindingsRef.current = null;
      }

      transitionLockRef.current = false;
    };
  }, [
    availableNodeIds,
    buildTourNode,
    currentNodeId,
    graph.nodes,
    isSlowNetwork,
    resolvePano,
  ]);

  if (availableNodeIds === null) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white/70">
        Loading Interior Walkthrough. Please Wait
             </div>
    );
  }

  if (!graph.nodes.length) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white/70">
        No interior panoramas found.
      </div>
    );
  }

  const backHref = "/apartments";
  const glassButtonClass =
    "border border-white/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(235,240,245,0.14))] text-white shadow-[0_16px_34px_rgba(8,12,20,0.24),inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl saturate-[180%] transition duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.44),rgba(238,243,247,0.2))]";

  return (
    <section
      className={`relative isolate h-full w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#050608] text-white sm:rounded-[1.8rem] lg:rounded-[2.25rem] ${className ?? ""}`}
    >
      <div className="absolute inset-0">
        <div ref={viewerHostRef} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,16,0.18)_0%,rgba(8,11,16,0.02)_18%,rgba(8,11,16,0.06)_72%,rgba(8,11,16,0.3)_100%)]" />
        <div
          className={`pointer-events-none absolute inset-0 bg-black/10 transition-opacity duration-200 ${
            isTransitioning ? "opacity-0" : "opacity-0"
          }`}
        />
      </div>

      <div
        className={`pointer-events-none absolute left-4 top-4 z-30 transition-opacity duration-200 ${
          isMenuOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className={`flex h-10 w-10 items-center justify-center rounded-[1rem] sm:h-11 sm:w-11 sm:rounded-[1.1rem] ${glassButtonClass} ${
            isMenuOpen ? "pointer-events-none" : "pointer-events-auto"
          }`}
          aria-label="Open pano list"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-30">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] sm:gap-2 sm:px-4 sm:py-3 sm:text-[11px] ${glassButtonClass}`}
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Back
        </button>
      </div>

      <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex justify-center">
        {/* <div className="pointer-events-auto rounded-[1.2rem] border border-white/14 bg-[rgba(12,16,22,0.66)] px-4 py-3 text-center shadow-[0_18px_42px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="text-[10px] uppercase tracking-[0.26em] text-white/54">
            Interior Walkthrough
          </div>
          <div className="mt-1 text-sm font-semibold text-white">
            {walkthroughContext.flatNumber ? `Flat ${walkthroughContext.flatNumber}` : "Representative Unit"}
            {walkthroughContext.floorLabel ? ` • Floor ${walkthroughContext.floorLabel}` : ""}
            {walkthroughContext.bhk ? ` • ${walkthroughContext.bhk} BHK` : ""}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/42">
            Start node {currentNodeId.match(/F\d{4}$/i)?.[0] ?? "F0010"}
          </div>
        </div> */}
      </div>

      {viewerError ? (
        <div className="pointer-events-none absolute inset-x-4 top-24 z-30 flex justify-center">
          <div className="rounded-full border border-[#ffb3b3]/30 bg-[rgba(38,10,10,0.58)] px-4 py-2 text-xs font-medium tracking-[0.12em] text-[#ffd4d4] backdrop-blur-xl">
            {viewerError}
          </div>
        </div>
      ) : null}

      {isMenuOpen ? (
        <div className="absolute inset-0 z-40 flex pointer-events-auto">
          <button
            type="button"
            aria-label="Close pano list"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-[rgba(10,14,20,0.48)]"
          />

          <div className="relative flex h-full w-full items-end p-3 sm:p-4 md:items-start md:p-0 lg:p-6">
            <div className="relative flex h-auto max-h-[72vh] w-full flex-col overflow-hidden rounded-[1.6rem] border border-white/20 bg-[linear-gradient(180deg,rgba(42,39,31,0.34),rgba(26,24,20,0.42)_32%,rgba(18,17,15,0.56)_100%)] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-xl saturate-[160%] md:h-full md:max-h-none md:max-w-[24rem] md:rounded-none md:border-r md:border-t-0 md:border-l-0 md:border-b-0 lg:h-auto lg:max-h-[50vh] lg:max-w-[26rem] lg:rounded-[2rem] lg:border lg:border-white/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Furnished
                </div>
                <div className="mt-2 text-[1.4rem] font-medium leading-none text-white sm:text-[1.7rem] lg:text-[1.9rem]">
                  Room Index
                </div>
              </div>

              <button
                type="button"
                aria-label="Close pano list"
                onClick={() => setIsMenuOpen(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-[0.95rem] sm:h-11 sm:w-11 sm:rounded-[1rem] ${glassButtonClass}`}
              >
                <X className="h-4 w-4 sm:h-[1.1rem] sm:w-[1.1rem]" />
              </button>
            </div>

            <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {visibleRoomTabs.map((tab) => {
                const isActive = tab.id === currentNodeId;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void goToNode(tab.id);
                    }}
                    className={`group flex w-full items-center gap-3 rounded-[1.5rem] border p-3 text-left transition ${
                      isActive
                        ? "border-[#9cd8e0]/46 bg-[linear-gradient(180deg,rgba(210,214,200,0.22),rgba(132,130,114,0.1))] shadow-[0_18px_42px_rgba(8,12,20,0.18),inset_0_1px_0_rgba(255,255,255,0.28)]"
                        : "border-white/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(226,235,243,0.07))] hover:-translate-y-0.5 hover:border-white/28 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(230,237,244,0.1))]"
                    }`}
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[1rem] border border-white/14 bg-white/6">
                      <img
                        src={tab.previewUrl}
                        alt={tab.label}
                        className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white sm:text-[15px]">{tab.label}</div>
                      <div className="mt-1 text-[13px] leading-5 text-white/72 sm:text-sm">
                        {isActive
                          ? "You are currently inside this room."
                          : "Tap to switch the panorama view to this room."}
                      </div>
                      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/54">
                        {isActive ? "Current" : "Open"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        </div>
      ) : null}

      <InteriorMinimap
        nodes={graph.nodes}
        activeNodeId={currentNodeId}
        currentLabel={currentRoomLabel}
        disabled={isTransitioning}
        onNavigate={(nodeId) => {
          void goToNode(nodeId);
        }}
      />

      <div className="pointer-events-auto absolute right-4 top-[56%] z-30 -translate-y-1/2">
        <div className="flex flex-col items-center gap-1.5 rounded-[1.35rem] border border-white/34 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(230,237,244,0.12))] px-2.5 py-3 shadow-[0_20px_42px_rgba(8,12,20,0.22),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl saturate-[180%] sm:gap-2 sm:px-3 sm:py-4 md:rounded-[1.7rem] md:px-4 md:py-5">
          <ArrowButton
            icon={ArrowUp}
            label="Move forward"
            onClick={() => void navigateToDirection("forward")}
            disabled={!navigationTargets.forward.node || isTransitioning}
          />
          <ArrowButton
            icon={ArrowLeft}
            label="Move left"
            onClick={() => void navigateToDirection("left")}
            disabled={!navigationTargets.left.node || isTransitioning}
          />
          <ArrowButton
            icon={ArrowRight}
            label="Move right"
            onClick={() => void navigateToDirection("right")}
            disabled={!navigationTargets.right.node || isTransitioning}
          />
          <ArrowButton
            icon={ArrowDown}
            label="Move back"
            onClick={() => void navigateToDirection("backward")}
            disabled={!navigationTargets.backward.node || isTransitioning}
          />
        </div>
      </div>

      <style jsx global>{`
        .psv-navbar,
        .psv-virtual-tour-arrows {
          display: none !important;
        }
      `}</style>
    </section>
  );
}
