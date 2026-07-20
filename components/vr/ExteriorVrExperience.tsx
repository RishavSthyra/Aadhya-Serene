"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type ExteriorNavNode = {
  id: string;
  pos: { x: number; y: number; z: number };
  forward: { x: number; y: number; z: number };
  right: { x: number; y: number; z: number };
};

type ExteriorScene = {
  id: string;
  title: string;
  tilesPath: string;
  preview: string;
  initialView?: { yaw?: number; pitch?: number; fov?: number };
};

type HotspotTarget = {
  direction: "forward" | "left" | "right" | "back";
  nodeId: string;
  label: string;
  distance: number;
  yaw: number;
  pitch: number;
};

type Runtime = {
  dispose: () => void;
  goToNode: (nodeId: string) => void;
  resetView: () => void;
};

const TILE_BASE_URL =
  "https://aadhya-serene-assets-v2.s3.amazonaws.com/panos/exterior/tiles";
const HOTSPOT_RADIUS = 1800;
const MAX_NEIGHBORS = 8;
const MIN_PITCH = -Math.PI / 2 + 0.14;
const MAX_PITCH = Math.PI / 2 - 0.14;
const DEFAULT_START_NODE = "22-ls_bp_panopath_exterior_f0000";
const FACE_ORDER = ["r", "l", "u", "d", "f", "b"] as const;

function normalizeAngle(angle: number) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(node1: ExteriorNavNode, node2: ExteriorNavNode) {
  const dx = node2.pos.x - node1.pos.x;
  const dy = node2.pos.y - node1.pos.y;
  const dz = node2.pos.z - node1.pos.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function formatSceneLabel(nodeId: string) {
  const frame = nodeId.match(/F(\d{4})$/i)?.[1];
  return frame ? `Walkthrough Node ${frame}` : nodeId;
}

function getTargetDirection(diff: number) {
  if (diff >= Math.PI / 4 && diff < (3 * Math.PI) / 4) {
    return "right" as const;
  }

  if (diff <= -Math.PI / 4 && diff > (-3 * Math.PI) / 4) {
    return "left" as const;
  }

  if (diff >= (3 * Math.PI) / 4 || diff <= (-3 * Math.PI) / 4) {
    return "back" as const;
  }

  return "forward" as const;
}

function getNavigationTargets(
  currentNode: ExteriorNavNode | undefined,
  navNodes: ExteriorNavNode[],
  yaw = 0,
) {
  const empty = {
    forward: null,
    left: null,
    right: null,
    back: null,
  } as Record<HotspotTarget["direction"], HotspotTarget | null>;

  if (!currentNode) {
    return empty;
  }

  const candidates = navNodes
    .filter((node) => node.id !== currentNode.id)
    .map((node) => ({ node, distance: distance(currentNode, node) }))
    .filter((candidate) => candidate.distance <= HOTSPOT_RADIUS)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_NEIGHBORS);

  const bestByDirection = new Map<HotspotTarget["direction"], HotspotTarget>();

  for (const candidate of candidates) {
    const dx = candidate.node.pos.x - currentNode.pos.x;
    const dy = candidate.node.pos.y - currentNode.pos.y;
    const dz = candidate.node.pos.z - currentNode.pos.z;
    const planarDistance = Math.hypot(dx, dy) || 1;
    const dirX = dx / planarDistance;
    const dirY = dy / planarDistance;
    const projForward = dirX * currentNode.forward.x + dirY * currentNode.forward.y;
    const projRight = dirX * currentNode.right.x + dirY * currentNode.right.y;
    const neighborYaw = Math.atan2(projRight, projForward);
    const diff = normalizeAngle(neighborYaw - yaw);
    const direction = getTargetDirection(diff);
    const pitch = clamp(Math.atan2(dz, planarDistance), -0.28, 0.28);
    const score = 1 / Math.max(candidate.distance, 1);
    const existing = bestByDirection.get(direction);

    if (!existing || score > 1 / Math.max(existing.distance, 1)) {
      bestByDirection.set(direction, {
        direction,
        nodeId: candidate.node.id,
        label: formatSceneLabel(candidate.node.id),
        distance: candidate.distance,
        yaw: neighborYaw,
        pitch,
      });
    }
  }

  return {
    forward: bestByDirection.get("forward") ?? null,
    left: bestByDirection.get("left") ?? null,
    right: bestByDirection.get("right") ?? null,
    back: bestByDirection.get("back") ?? null,
  };
}

function faceUrl(tilesPath: string, level: number, face: string, row: number, col: number) {
  const cleanPath = tilesPath.replace(/^\/+/, "");
  return `${TILE_BASE_URL}/${cleanPath.replace(/^tiles\//, "")}/${level}/${face}/${row}/${col}.jpg?v=2`;
}

async function loadPreviewFaces(loader: THREE.TextureLoader, scene: ExteriorScene) {
  return Promise.all(
    FACE_ORDER.map(async (face) => {
      const texture = await loader.loadAsync(faceUrl(scene.tilesPath, 1, face, 0, 0));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      return texture;
    }),
  );
}

async function buildFaceTexture(
  loader: THREE.TextureLoader,
  scene: ExteriorScene,
  face: (typeof FACE_ORDER)[number],
  level = 3,
) {
  const tilesPerSide = level === 3 ? 4 : 2;
  const tileSize = 512;
  const canvas = document.createElement("canvas");
  canvas.width = tilesPerSide * tileSize;
  canvas.height = tilesPerSide * tileSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to create cube face canvas");
  }

  const tilePromises: Promise<void>[] = [];
  for (let row = 0; row < tilesPerSide; row += 1) {
    for (let col = 0; col < tilesPerSide; col += 1) {
      const url = faceUrl(scene.tilesPath, level, face, row, col);
      tilePromises.push(
        loader.loadAsync(url).then((texture) => {
          context.drawImage(texture.image, col * tileSize, row * tileSize, tileSize, tileSize);
          texture.dispose();
        }),
      );
    }
  }

  await Promise.all(tilePromises);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

async function buildHighResFaces(loader: THREE.TextureLoader, scene: ExteriorScene) {
  return Promise.all(FACE_ORDER.map((face) => buildFaceTexture(loader, scene, face, 3)));
}

async function buildMediumResFaces(loader: THREE.TextureLoader, scene: ExteriorScene) {
  return Promise.all(FACE_ORDER.map((face) => buildFaceTexture(loader, scene, face, 2)));
}

function buildHotspotPosition(yaw: number, pitch: number, radius = 10) {
  const correctedYaw = yaw + Math.PI;
  const cosPitch = Math.cos(pitch);
  return new THREE.Vector3(
    Math.sin(correctedYaw) * cosPitch * radius,
    Math.sin(pitch) * radius,
    -Math.cos(correctedYaw) * cosPitch * radius,
  );
}

function setCubeMaps(
  materials: THREE.MeshBasicMaterial[],
  textures: THREE.Texture[],
  disposePrevious = false,
) {
  materials.forEach((material, index) => {
    if (disposePrevious && material.map && material.map !== textures[index]) {
      material.map.dispose();
    }

    material.map = textures[index];
    material.needsUpdate = true;
  });
}

export default function ExteriorVrExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const vrButtonRef = useRef<HTMLDivElement | null>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const currentNodeIdRef = useRef("");
  const [navNodes, setNavNodes] = useState<ExteriorNavNode[]>([]);
  const [scenes, setScenes] = useState<ExteriorScene[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState("");
  const [canEnterVr, setCanEnterVr] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const [navResponse, scenesResponse] = await Promise.all([
          fetch("/data/exterior/nav.json", { cache: "force-cache" }),
          fetch("/data/exterior/scenes.json", { cache: "force-cache" }),
        ]);

        if (!navResponse.ok || !scenesResponse.ok) {
          throw new Error("Walkthrough assets failed to load.");
        }

        const [navJson, scenesJson] = await Promise.all([
          navResponse.json() as Promise<ExteriorNavNode[]>,
          scenesResponse.json() as Promise<ExteriorScene[]>,
        ]);

        if (cancelled) {
          return;
        }

        setNavNodes(Array.isArray(navJson) ? navJson : []);
        setScenes(Array.isArray(scenesJson) ? scenesJson : []);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load walkthrough VR data", error);
          setLoadError("Could not load the walkthrough assets.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("xr" in navigator)) {
      setCanEnterVr(false);
      return;
    }

    let cancelled = false;

    void (navigator as Navigator & {
      xr?: { isSessionSupported?: (mode: XRSessionMode) => Promise<boolean> };
    }).xr?.isSessionSupported?.("immersive-vr").then((supported) => {
      if (!cancelled) {
        setCanEnterVr(Boolean(supported));
      }
    }).catch(() => {
      if (!cancelled) {
        setCanEnterVr(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const sceneById = useMemo(
    () => Object.fromEntries(scenes.map((scene) => [scene.id, scene])) as Record<string, ExteriorScene>,
    [scenes],
  );
  const navById = useMemo(
    () => Object.fromEntries(navNodes.map((node) => [node.id, node])) as Record<string, ExteriorNavNode>,
    [navNodes],
  );
  const requestedStartNode = searchParams.get("start") ?? DEFAULT_START_NODE;

  useEffect(() => {
    if (!navNodes.length || !scenes.length || currentNodeId) {
      return;
    }

    const initialNodeId = navById[requestedStartNode]
      ? requestedStartNode
      : navById[DEFAULT_START_NODE]
        ? DEFAULT_START_NODE
        : navNodes[0]?.id;

    if (initialNodeId) {
      setCurrentNodeId(initialNodeId);
    }
  }, [currentNodeId, navById, navNodes, requestedStartNode, scenes.length]);

  const navigationTargets = useMemo(
    () => getNavigationTargets(navById[currentNodeId], navNodes),
    [currentNodeId, navById, navNodes],
  );
  const hasInitialNode = Boolean(currentNodeId);

  const goToNode = useCallback((nodeId: string) => {
    if (!navById[nodeId] || !sceneById[nodeId]) {
      return;
    }

    setCurrentNodeId(nodeId);
    currentNodeIdRef.current = nodeId;
    runtimeRef.current?.goToNode(nodeId);
  }, [navById, sceneById]);

  useEffect(() => {
    currentNodeIdRef.current = currentNodeId;
  }, [currentNodeId]);

  useEffect(() => {
    if (!mountRef.current || !vrButtonRef.current || !currentNodeIdRef.current || !navNodes.length || !scenes.length) {
      return;
    }

    let disposed = false;
    const sceneLookup = sceneById;
    const navLookup = navById;
    const textureLoader = new THREE.TextureLoader();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    const camera = new THREE.PerspectiveCamera(78, 1, 0.1, 100);
    const world = new THREE.Scene();
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const cubeMaterials = FACE_ORDER.map(() => new THREE.MeshBasicMaterial({ side: THREE.BackSide })) as THREE.MeshBasicMaterial[];
    const cube = new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), cubeMaterials);
    const hotspotGroup = new THREE.Group();
    const controllerLine = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -14),
    ]);
    const controllerRaycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    const hotObjects: THREE.Object3D[] = [];
    const faceCache = new Map<string, THREE.Texture[]>();
    const facePromiseCache = new Map<string, Promise<THREE.Texture[]>>();
    let currentYaw = sceneLookup[currentNodeIdRef.current]?.initialView?.yaw ?? 0;
    let currentPitch = sceneLookup[currentNodeIdRef.current]?.initialView?.pitch ?? 0;
    let isPointerActive = false;
    let pointerX = 0;
    let pointerY = 0;
    let loadToken = 0;

    world.add(cube);
    world.add(hotspotGroup);
    camera.position.set(0, 0, 0.01);

    renderer.xr.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight, false);
    mountRef.current.replaceChildren(renderer.domElement);

    const updateCameraRotation = () => {
      if (renderer.xr.isPresenting) {
        return;
      }

      camera.rotation.order = "YXZ";
      camera.rotation.y = currentYaw;
      camera.rotation.x = currentPitch;
    };

    const clearHotspots = () => {
      while (hotspotGroup.children.length) {
        const child = hotspotGroup.children[hotspotGroup.children.length - 1];
        if (!child) {
          continue;
        }

        child.removeFromParent();

        child.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }

          const material = mesh.material;
          if (Array.isArray(material)) {
            material.forEach((entry) => {
              const mappedEntry = entry as THREE.Material & { map?: THREE.Texture | null };
              if (mappedEntry.map) {
                mappedEntry.map.dispose();
              }
              mappedEntry.dispose();
            });
          } else if (material) {
            const mappedMaterial = material as THREE.Material & { map?: THREE.Texture | null };
            if (mappedMaterial.map) {
              mappedMaterial.map.dispose();
            }
            mappedMaterial.dispose();
          }
        });
      }

      hotObjects.length = 0;
    };

    const buildHotspots = (nodeId: string) => {
      clearHotspots();
      const node = navLookup[nodeId];
      if (!node) {
        return;
      }

      const targets = getNavigationTargets(node, navNodes);
      const hotspotEntries = Object.values(targets).filter((value): value is HotspotTarget => Boolean(value));
      const tones: Record<HotspotTarget["direction"], string> = {
        forward: "#facc15",
        left: "#5eead4",
        right: "#60a5fa",
        back: "#fda4af",
      };

      hotspotEntries.forEach((target) => {
        const container = new THREE.Group();
        container.userData.nodeId = target.nodeId;
        container.position.copy(buildHotspotPosition(target.yaw, target.pitch, 9.5));

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.093, 0.147, 48),
          new THREE.MeshBasicMaterial({
            color: tones[target.direction],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.96,
          }),
        );
        ring.lookAt(0, 0, 0);

        container.add(ring);
        hotspotGroup.add(container);
        hotObjects.push(container);
      });
    };

    const resolveFaces = async (sceneInfo: ExteriorScene) => {
      const cached = faceCache.get(sceneInfo.id);
      if (cached) {
        return cached;
      }

      const inflight = facePromiseCache.get(sceneInfo.id);
      if (inflight) {
        return inflight;
      }

      const promise = (async () => {
        try {
          const highResFaces = await buildHighResFaces(textureLoader, sceneInfo);
          const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
          highResFaces.forEach((texture) => {
            texture.anisotropy = maxAnisotropy;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;
          });
          faceCache.set(sceneInfo.id, highResFaces);
          return highResFaces;
        } catch (highResError) {
          console.error("Failed to load level-3 walkthrough cube faces", highResError);
        }

        try {
          const mediumResFaces = await buildMediumResFaces(textureLoader, sceneInfo);
          const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
          mediumResFaces.forEach((texture) => {
            texture.anisotropy = maxAnisotropy;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;
          });
          faceCache.set(sceneInfo.id, mediumResFaces);
          return mediumResFaces;
        } catch (mediumResError) {
          console.error("Failed to load level-2 walkthrough cube faces", mediumResError);
        }

        const previewFaces = await loadPreviewFaces(textureLoader, sceneInfo);
        faceCache.set(sceneInfo.id, previewFaces);
        return previewFaces;
      })().finally(() => {
        facePromiseCache.delete(sceneInfo.id);
      });

      facePromiseCache.set(sceneInfo.id, promise);
      return promise;
    };

    const preloadNodeIds = (nodeIds: string[]) => {
      nodeIds.forEach((nodeId) => {
        const targetScene = sceneLookup[nodeId];
        if (targetScene) {
          void resolveFaces(targetScene);
        }
      });
    };

    const primeNavigationCluster = (nodeId: string) => {
      const navTargets = getNavigationTargets(navLookup[nodeId], navNodes);
      const nodeIds = [
        nodeId,
        navTargets.forward?.nodeId,
        navTargets.left?.nodeId,
        navTargets.right?.nodeId,
        navTargets.back?.nodeId,
      ].filter((value): value is string => Boolean(value));

      preloadNodeIds(nodeIds);
    };

    const loadScene = async (nodeId: string, shouldResetView = false) => {
      const sceneInfo = sceneLookup[nodeId];
      if (!sceneInfo) {
        return;
      }

      const token = ++loadToken;
      setLoadError(null);

      try {
        const textures = await resolveFaces(sceneInfo);
        if (disposed || token !== loadToken) {
          return;
        }

        setCubeMaps(cubeMaterials, textures, true);
        buildHotspots(nodeId);

        if (shouldResetView) {
          currentYaw = sceneInfo.initialView?.yaw ?? 0;
          currentPitch = sceneInfo.initialView?.pitch ?? 0;
          updateCameraRotation();
        }
        primeNavigationCluster(nodeId);
      } catch (error) {
        if (!disposed) {
          console.error("Failed to load VR walkthrough scene", error);
          setLoadError("This VR scene could not be loaded.");
        }
      }
    };

    const intersectObjects = (ray: THREE.Raycaster) => {
      const intersections = ray.intersectObjects(hotObjects, true);
      const hit = intersections.find((entry) => entry.object.parent?.userData?.nodeId || entry.object.userData?.nodeId);
      const nodeId = hit?.object.parent?.userData?.nodeId ?? hit?.object.userData?.nodeId;
      if (typeof nodeId === "string") {
        goToNode(nodeId);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      isPointerActive = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isPointerActive || renderer.xr.isPresenting) {
        return;
      }

      const deltaX = event.clientX - pointerX;
      const deltaY = event.clientY - pointerY;
      pointerX = event.clientX;
      pointerY = event.clientY;
      currentYaw -= deltaX * 0.0044;
      currentPitch = clamp(currentPitch - deltaY * 0.0036, MIN_PITCH, MAX_PITCH);
      updateCameraRotation();
    };

    const handlePointerUp = () => {
      isPointerActive = false;
    };

    const handleClick = (event: MouseEvent) => {
      if (renderer.xr.isPresenting) {
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      intersectObjects(raycaster);
    };

    const handleWheel = (event: WheelEvent) => {
      if (renderer.xr.isPresenting) {
        return;
      }

      camera.fov = clamp(camera.fov + Math.sign(event.deltaY) * 2.5, 56, 92);
      camera.updateProjectionMatrix();
    };

    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight, false);
    };

    const handleControllerSelect = (controller: THREE.Group) => {
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      controllerRaycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      controllerRaycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
      intersectObjects(controllerRaycaster);
    };

    const attachController = (index: number) => {
      const controller = renderer.xr.getController(index);
      const line = new THREE.Line(
        controllerLine,
        new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.72 }),
      );
      line.name = `controller-line-${index}`;
      controller.add(line);
      controller.addEventListener("selectstart", () => handleControllerSelect(controller));
      world.add(controller);
    };

    attachController(0);
    attachController(1);
    updateCameraRotation();
    primeNavigationCluster(currentNodeIdRef.current);
    const remainingNodeIds = navNodes
      .map((node) => node.id)
      .filter((nodeId) => nodeId !== currentNodeIdRef.current);
    const preloadTimer = globalThis.setTimeout(() => {
      preloadNodeIds(remainingNodeIds);
    }, 150);
    void loadScene(currentNodeIdRef.current, true);

    void import("three/examples/jsm/webxr/VRButton.js").then(({ VRButton }) => {
      if (disposed || !vrButtonRef.current) {
        return;
      }

      const button = VRButton.createButton(renderer, {
        optionalFeatures: ["local-floor"],
      });
      button.className = "vr-enter-button";
      button.textContent = "Enter VR";
      vrButtonRef.current.replaceChildren(button);
    }).catch((error) => {
      console.error("Failed to initialize VR button", error);
      setCanEnterVr(false);
    });

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("click", handleClick);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("resize", handleResize);

    renderer.setAnimationLoop(() => {
      hotspotGroup.children.forEach((child) => {
        child.lookAt(camera.position);
      });
      renderer.render(world, camera);
    });

    runtimeRef.current = {
      goToNode: (nodeId: string) => {
        void loadScene(nodeId, false);
      },
      resetView: () => {
        const sceneInfo = sceneLookup[currentNodeIdRef.current];
        currentYaw = sceneInfo?.initialView?.yaw ?? 0;
        currentPitch = sceneInfo?.initialView?.pitch ?? 0;
        camera.fov = 78;
        camera.updateProjectionMatrix();
        updateCameraRotation();
      },
      dispose: () => {
        renderer.setAnimationLoop(null);
        renderer.dispose();
        cube.geometry.dispose();
        clearHotspots();
        cubeMaterials.forEach((material) => {
          if (material.map) {
            material.map.dispose();
          }
          material.dispose();
        });
        faceCache.forEach((textures) => {
          textures.forEach((texture) => texture.dispose());
        });
      },
    };

    return () => {
      disposed = true;
      runtimeRef.current?.dispose();
      runtimeRef.current = null;
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", handleResize);
      globalThis.clearTimeout(preloadTimer);
      vrButtonRef.current?.replaceChildren();
      mountRef.current?.replaceChildren();
    };
  }, [goToNode, hasInitialNode, navById, navNodes, sceneById, scenes.length]);

  const handleDirectionMove = useCallback((direction: HotspotTarget["direction"]) => {
    const target = navigationTargets[direction];
    if (target) {
      goToNode(target.nodeId);
    }
  }, [goToNode, navigationTargets]);

  if (isLoadingData) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050608] text-white/72">
        Loading walkthrough VR...
      </div>
    );
  }

  if (!navNodes.length || !scenes.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050608] text-white/72">
        Walkthrough assets are not available.
      </div>
    );
  }

  const glassClass =
    "border border-white/18 bg-[rgba(8,12,18,0.22)] shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-md";

  return (
    <section className="relative h-full w-full overflow-hidden bg-[#050608] text-white">
      <div ref={mountRef} className="absolute inset-0" />

      <div className="absolute left-4 top-4 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/walkthrough")}
          className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white ${glassClass}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={() => runtimeRef.current?.resetView()}
          className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white ${glassClass}`}
        >
          <RotateCcw className="h-4 w-4" />
          Reset View
        </button>
      </div>

      <div className={`absolute right-4 top-4 z-20 ${canEnterVr ? "" : "hidden"}`}>
        <div
          ref={vrButtonRef}
          className={`pointer-events-auto min-h-12 min-w-32 rounded-[1.2rem] p-1 ${glassClass}`}
        />
      </div>

      {loadError ? (
        <div className="absolute inset-x-4 top-28 z-20 flex justify-center">
          <div className="rounded-full border border-[#fecaca]/30 bg-[rgba(63,10,10,0.62)] px-4 py-2 text-xs font-medium text-[#fee2e2] backdrop-blur-xl">
            {loadError}
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
        <div className="vr-controls">
          <button
            type="button"
            className="vr-btn vr-forward"
            onClick={() => handleDirectionMove("forward")}
            disabled={!navigationTargets.forward}
            aria-label="Move Forward"
          >
            <ArrowUp className="vr-icon" />
          </button>
          <button
            type="button"
            className="vr-btn vr-left"
            onClick={() => handleDirectionMove("left")}
            disabled={!navigationTargets.left}
            aria-label="Move Left"
          >
            <ArrowLeft className="vr-icon" />
          </button>
          <button
            type="button"
            className="vr-btn vr-back"
            onClick={() => handleDirectionMove("back")}
            disabled={!navigationTargets.back}
            aria-label="Move Back"
          >
            <ArrowDown className="vr-icon" />
          </button>
          <button
            type="button"
            className="vr-btn vr-right"
            onClick={() => handleDirectionMove("right")}
            disabled={!navigationTargets.right}
            aria-label="Move Right"
          >
            <ArrowRight className="vr-icon" />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .vr-controls {
          z-index: 20;
          display: grid;
          grid-template-columns: 52px 52px 52px;
          grid-template-rows: 52px 52px;
          gap: 10px;
        }

        .vr-btn {
          display: grid;
          place-items: center;
          width: 52px;
          height: 52px;
          padding: 0;
          cursor: pointer;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.34);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.34), rgba(232, 238, 244, 0.14));
          backdrop-filter: blur(24px) saturate(180%);
          box-shadow:
            0 18px 42px rgba(6, 10, 18, 0.24),
            inset 0 1px 0 rgba(255, 255, 255, 0.54),
            inset 0 -1px 0 rgba(255, 255, 255, 0.08);
          transition: background 0.2s, transform 0.2s, opacity 0.2s, box-shadow 0.2s, border-color 0.2s;
        }

        .vr-btn:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(236, 242, 247, 0.2));
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px) scale(1.03);
        }

        .vr-btn:active {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.48), rgba(236, 242, 247, 0.24));
          transform: scale(0.97);
        }

        .vr-btn:disabled {
          opacity: 0.12;
          pointer-events: none;
          box-shadow: none;
          border-color: transparent;
        }

        .vr-icon {
          width: 28px;
          height: 28px;
          color: #fff;
          filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.35));
        }

        .vr-forward {
          grid-area: 1 / 2;
        }

        .vr-left {
          grid-area: 2 / 1;
        }

        .vr-back {
          grid-area: 2 / 2;
        }

        .vr-right {
          grid-area: 2 / 3;
        }

        .vr-enter-button {
          width: 100%;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(230, 238, 247, 0.9));
          color: #111827;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          padding: 0.95rem 1.15rem;
          text-transform: uppercase;
          cursor: pointer;
        }

        .vr-enter-button:hover {
          filter: brightness(1.04);
        }

        @media (max-width: 768px) {
          .vr-controls {
            grid-template-columns: 46px 46px 46px;
            grid-template-rows: 46px 46px;
            gap: 8px;
          }

          .vr-btn {
            width: 46px;
            height: 46px;
            border-radius: 14px;
          }

          .vr-icon {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </section>
  );
}
