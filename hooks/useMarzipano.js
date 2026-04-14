import { useEffect, useRef, useState, useCallback } from 'react';
// Dynamically import Marzipano to avoid SSR issues


let Marzipano;

if (typeof window !== 'undefined') {
    Marzipano = require('marzipano');
}

import { EXTERIOR_DATA, VIEWER_OPTIONS, AUTOROTATE_OPTIONS, IDLE_TIME } from '../utils/walkthroughConstants';

//RETURNS THE DISTANCE BETWEEN TWO NODES
function dist(node1, node2) {
    if (!node1?.pos || !node2?.pos) return Infinity;
    const dx = (node2.pos.x ?? 0) - (node1.pos.x ?? 0);
    const dy = (node2.pos.y ?? 0) - (node1.pos.y ?? 0);
    const dz = (node2.pos.z ?? 0) - (node1.pos.z ?? 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

//NORMALIZES ANGLE BETWEEN -PI AND PI
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

export function useMarzipano({ panoElement, scenesData, navMap, navData }) {

    const viewerRef = useRef(null);

    const scenesByIdRef = useRef(Object.create(null));

    const [currentSceneId, setCurrentSceneId] = useState(null);

    const [yaw, setYaw] = useState(0);  // the horizontal angle is called Yaw.. The vertical angle is called Pitch

    const [targets, setTargets] = useState({ forward: null, back: null, left: null, right: null });

    const [isViewerReady, setIsViewerReady] = useState(false);

    // Initialize Viewer


    useEffect(() => {
        if (!panoElement || !Marzipano || viewerRef.current) return; // the panoRef.current is used to check if the viewer is already created

        const viewer = new Marzipano.Viewer(panoElement, VIEWER_OPTIONS);

        console.log("viewer", viewer)

        viewerRef.current = viewer;

        const autorotate = Marzipano.autorotate(AUTOROTATE_OPTIONS);

        viewer.setIdleMovement(IDLE_TIME, autorotate); // 3000s is the idle time

        // View Change Listener to update yaw
        viewer.addEventListener('viewChange', () => {
            const scene = viewer.scene();
            if (scene) {
                const view = scene.view();
                setYaw(view.yaw());
            }
        });

        setIsViewerReady(true);

        return () => {
            viewer.destroy();
            viewerRef.current = null;
        };
    }, [panoElement]);

    const createScene = useCallback((data) => {
        const viewer = viewerRef.current;
        if (!viewer) return null;

        // Ensure the tilesPath does not double-up on the 'tiles/' directory if it already exists in TILE_BASE_URL
        // scenes.json provides: "/tiles/0-ls_..."
        // TILE_BASE_URL provides: "...s3.../panos/exterior/tiles"
        // Resulting string needs to cleanly join them.

        const cleanPath = data.tilesPath.replace('/tiles/', ''); // Strip duplicate

        const source = Marzipano.ImageUrlSource.fromString(
            `${EXTERIOR_DATA.TILE_BASE_URL}/${cleanPath}/{z}/{f}/{y}/{x}.jpg?v=2`,
            {
                cubeMapPreviewUrl: `${EXTERIOR_DATA.TILE_BASE_URL}/${cleanPath}/preview.jpg?v=2`,
                crossOrigin: "anonymous"
            }
        );

        const geometry = new Marzipano.CubeGeometry([
            { tileSize: 256, size: 256, fallbackOnly: true },
            { tileSize: 512, size: 512 },
            { tileSize: 512, size: 1024 },
            { tileSize: 512, size: 2048 }
        ]);

        const limiter = Marzipano.RectilinearView.limit.traditional(2048, 120 * Math.PI / 180);
        const view = new Marzipano.RectilinearView(data.initialView || { yaw: 0, pitch: 0, fov: Math.PI / 2 }, limiter);

        return viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
        });
    }, []);

    const switchScene = useCallback((id) => {
        const viewer = viewerRef.current;

        if (!viewer || !scenesData.length) return;

        const sceneInfo = scenesData.find(s => s.id === id);
        if (!sceneInfo) return;

        if (!scenesByIdRef.current[id]) {
            scenesByIdRef.current[id] = createScene(sceneInfo);
        }

        const scene = scenesByIdRef.current[id];
        
        if (scene) {
            scene.switchTo({ transitionDuration: 1000 });
            setCurrentSceneId(id);
        }
    }, [scenesData, createScene]);

    // Navigation logic
    useEffect(() => {
        if (!currentSceneId || !navMap || !navMap[currentSceneId] || !viewerRef.current) return;

        // Run this update whenever yaw changes or scene changes
        // Using a debounced or throttled approach via a loop in the parent was okay, 
        // here we can compute it when 'yaw' changes (which updates frequently) or use a periodic check.
        // For smoothness, `setTargets` should happen frequently. 
        // `yaw` state updates on every frame of rotation.

        const currentNavNode = navMap[currentSceneId];

        // Find neighbors
        const candidates = [];

        console.log("currentNavNode", currentNavNode)

        for (const node of navData) {
            if (node.id === currentSceneId) continue;
            const d = dist(currentNavNode, node);
            if (d <= EXTERIOR_DATA.HOTSPOT_RADIUS) {
                candidates.push({ node, d });
            }
        }

        console.log("candidates", candidates)

        candidates.sort((a, b) => a.d - b.d);
        const neighbors = candidates.slice(0, EXTERIOR_DATA.MAX_NEIGHBORS).map(c => c.node);

        const newTargets = { forward: null, back: null, left: null, right: null };
        const currentTargetsWithDistance = { forward: null, back: null, left: null, right: null };

        for (const neighbor of neighbors) {
            const dx = (neighbor.pos.x ?? 0) - (currentNavNode.pos.x ?? 0);
            const dy = (neighbor.pos.y ?? 0) - (currentNavNode.pos.y ?? 0);
            const d = Math.hypot(dx, dy);
            if (d === 0) continue;

            const dirX = dx / d;
            const dirY = dy / d;

            const forwardX = currentNavNode.forward?.x ?? 0;
            const forwardY = currentNavNode.forward?.y ?? 0;
            const rightX = currentNavNode.right?.x ?? 0;
            const rightY = currentNavNode.right?.y ?? 0;

            const projForward = dirX * forwardX + dirY * forwardY;
            const projRight = dirX * rightX + dirY * rightY;
            const neighborYaw = Math.atan2(projRight, projForward);
            const diffParams = normalizeAngle(neighborYaw - yaw);

            let direction = 'forward';
            if (diffParams >= Math.PI / 4 && diffParams < 3 * Math.PI / 4) direction = 'right';
            else if (diffParams <= -Math.PI / 4 && diffParams > -3 * Math.PI / 4) direction = 'left';
            else if (diffParams >= 3 * Math.PI / 4 || diffParams <= -3 * Math.PI / 4) direction = 'back';

            if (!currentTargetsWithDistance[direction] || d < currentTargetsWithDistance[direction].d) {
                currentTargetsWithDistance[direction] = { id: neighbor.id, d: d };
                newTargets[direction] = neighbor.id;
            }
        }

        // Avoid infinite loops/re-renders if targets haven't changed deep equal
        // JSON stringify is cheap for this small object
        setTargets(prev => JSON.stringify(prev) === JSON.stringify(newTargets) ? prev : newTargets);

    }, [currentSceneId, yaw, navMap, navData]);

    return {
        isViewerReady,
        currentSceneId,
        yaw,
        targets,
        switchScene
    };
}
