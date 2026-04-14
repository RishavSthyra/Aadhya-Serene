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
  selectWarmupTiles,
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
};

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
      className="group flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(214,224,230,0.08))] text-white shadow-[0_18px_38px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition duration-200 hover:border-white/32 hover:bg-white/[0.16] disabled:cursor-not-allowed disabled:opacity-30"
    >
      <Icon className="h-5 w-5 transition duration-200 group-hover:scale-110" />
    </button>
  );
}

function formatRoomLabel(imageFilename: string) {
  const panoId = imageFilenameToPanoId(imageFilename);
  const frame = panoId.match(/F(\d{4})$/i)?.[1];

  if (!frame) {
    return panoId;
  }

  return `Pano ${frame}`;
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
  const viewerPreloadRef = useRef(new Map<string, Promise<void>>());

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewYaw, setViewYaw] = useState(0);
  const [activeNodeId, setActiveNodeId] = useState("");
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [availableNodeIds, setAvailableNodeIds] = useState<Set<string> | null>(null);

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
          label: formatRoomLabel(node.imageFilename),
          previewUrl: getResolvedPreviewUrl(panoId, INTERIOR_PANO_BASE_URL, "preview.jpg"),
        };
      }),
    [graph.nodes],
  );

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
        name: formatRoomLabel(node.imageFilename),
        caption: formatRoomLabel(node.imageFilename),
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

  const preloadViewerPanorama = useCallback(
    async (nodeId: string, viewerOverride?: Viewer | null) => {
      const viewer = viewerOverride ?? bindingsRef.current?.viewer;
      if (!viewer) {
        return;
      }

      const existing = viewerPreloadRef.current.get(nodeId);
      if (existing) {
        await existing;
        return;
      }

      const task = (async () => {
        const resolved = await resolvePano(nodeId);
        await viewer.textureLoader.preloadPanorama(resolved.panorama);
      })().catch((error) => {
        viewerPreloadRef.current.delete(nodeId);
        throw error;
      });

      viewerPreloadRef.current.set(nodeId, task);
      await task;
    },
    [resolvePano],
  );

  const preloadLinkedPanoramas = useCallback(
    async (nodeId: string, viewerOverride?: Viewer | null) => {
      const viewer = viewerOverride ?? bindingsRef.current?.viewer;
      const node = graph.byId[nodeId];
      if (!viewer || !node?.neighbors.length) {
        return;
      }

      await Promise.allSettled(
        node.neighbors.map((neighbor) => preloadViewerPanorama(neighbor.id, viewer)),
      );
    },
    [graph.byId, preloadViewerPanorama],
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
        await preloadViewerPanorama(targetId, bindings.viewer);

        setIsTransitioning(true);
        const completed = await bindings.virtualTour.setCurrentNode(targetId, {
          effect: "none",
          showLoader: false,
          speed: 380,
          rotation: false,
        });

        if (completed === false) {
          setIsTransitioning(false);
          transitionLockRef.current = false;
        }
      } catch (error) {
        console.error("Failed to change interior pano node:", error);
        setViewerError(`Failed to load ${formatRoomLabel(targetNode.imageFilename)}.`);
        setIsTransitioning(false);
        transitionLockRef.current = false;
      }
    },
    [buildTourNode, graph.byId, isTransitioning, preloadViewerPanorama],
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

  useEffect(() => {
    if (!currentNodeId) {
      return;
    }

    let cancelled = false;

    const warmCurrentPanorama = async () => {
      const node = graph.byId[currentNodeId];
      if (!node) return;

      try {
        const resolved = await resolvePano(node.id);

        await assetStore.preloadPreview(
          resolved.panoId,
          resolved.meta.preview ?? "preview.jpg",
          "high",
        );

        const warmupTiles = selectWarmupTiles(
          resolved.panoId,
          resolved.meta,
          INTERIOR_PANO_BASE_URL,
          isSlowNetwork ? 6 : 12,
        );

        await Promise.allSettled(
          warmupTiles.slice(0, isSlowNetwork ? 6 : 12).map((tile, index) =>
            assetStore.preloadTile(tile, index < 2 ? "high" : "low"),
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.debug("Warmup skipped for interior pano:", error);
        }
      }
    };

    void warmCurrentPanorama();

    return () => {
      cancelled = true;
    };
  }, [assetStore, currentNodeId, graph.byId, isSlowNetwork, resolvePano]);

  useEffect(() => {
    if (!viewerHostRef.current || !graph.nodes.length || !currentNodeId || availableNodeIds === null) {
      return;
    }

    let disposed = false;
    let initTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

    const initializeViewer = async () => {
      const startNodeId = currentNodeIdRef.current;
      const startResolved = await resolvePano(startNodeId);

      await assetStore.preloadPreview(
        startResolved.panoId,
        startResolved.meta.preview ?? "preview.jpg",
        "high",
      );

      const warmupTiles = selectWarmupTiles(
        startResolved.panoId,
        startResolved.meta,
        INTERIOR_PANO_BASE_URL,
        isSlowNetwork ? 6 : 10,
      );

      await Promise.allSettled(
        warmupTiles.slice(0, isSlowNetwork ? 6 : 10).map((tile, index) =>
          assetStore.preloadTile(tile, index < 2 ? "high" : "low"),
        ),
      );

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
            preload: !isSlowNetwork,
            transitionOptions: {
              effect: "none",
              showLoader: false,
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
        void preloadLinkedPanoramas(node.id, viewer);
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
      viewerPreloadRef.current = new Map();
      setActiveNodeId(actualStartNodeId);
      setViewYaw(viewer.getPosition().yaw);
      setViewerError(null);
      setIsTransitioning(false);
      transitionLockRef.current = false;
      void preloadViewerPanorama(actualStartNodeId, viewer);
      void preloadLinkedPanoramas(actualStartNodeId, viewer);

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

      viewerPreloadRef.current = new Map();
      transitionLockRef.current = false;
    };
  }, [
    assetStore,
    availableNodeIds,
    buildTourNode,
    currentNodeId,
    graph.nodes,
    isSlowNetwork,
    preloadLinkedPanoramas,
    preloadViewerPanorama,
    resolvePano,
  ]);

  if (availableNodeIds === null) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-white/70">
        Loading interior panoramas...
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

  const backHref = walkthroughContext.flatNumber
    ? `/apartments/${walkthroughContext.flatNumber}`
    : "/apartments";

  return (
    <section
      className={`relative isolate h-full w-full overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#050608] text-white ${className ?? ""}`}
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

      <div className="pointer-events-none absolute left-4 top-4 z-30 flex gap-3">
        <button
          type="button"
          onClick={() => router.push(backHref)}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/16 bg-[rgba(12,16,22,0.72)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/86 backdrop-blur-xl transition hover:border-white/28 hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/16 bg-[rgba(12,16,22,0.72)] text-white backdrop-blur-xl transition hover:border-white/28 hover:bg-white/10"
          aria-label="Open pano list"
        >
          <Menu className="h-5 w-5" />
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

          <div className="relative flex h-full w-full max-w-[26rem] flex-col border-r border-white/14 bg-[linear-gradient(180deg,rgba(12,16,22,0.9),rgba(12,16,22,0.76))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-[24px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                  Entire Interior Set
                </div>
                <div className="mt-2 text-[1.9rem] font-medium leading-none text-white">
                  Pano Index
                </div>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Jump to any pano from the furnished interior walkthrough.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close pano list"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/16 bg-white/8 text-white transition hover:border-white/28 hover:bg-white/12"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {roomTabs.map((tab) => {
                const isActive = tab.id === currentNodeId;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void goToNode(tab.id);
                    }}
                    className={`group flex w-full items-center gap-3 rounded-[1.3rem] border p-2.5 text-left transition ${
                      isActive
                        ? "border-[#7fd9d5]/34 bg-[linear-gradient(135deg,rgba(127,217,213,0.14),rgba(60,90,98,0.12))]"
                        : "border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(166,180,188,0.04))] hover:border-white/20 hover:bg-white/8"
                    }`}
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-[1rem] border border-white/14 bg-white/6">
                      <img
                        src={tab.previewUrl}
                        alt={tab.label}
                        className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
                        draggable={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-white">{tab.label}</div>
                      <div className="mt-1 text-sm leading-5 text-white/68">
                        {isActive
                          ? "You are currently viewing this pano."
                          : "Open this pano in the viewer."}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto absolute right-5 top-[56%] z-30 -translate-y-1/2">
        <div className="flex flex-col items-center gap-3 rounded-[1.8rem] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(214,224,230,0.08))] px-4 py-5 shadow-[0_18px_46px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
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

        .psv-loader-container {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `}</style>
    </section>
  );
}
