'use client';

import React, { useRef, useEffect } from 'react';
import styles from '../../app/walkthrough/walkthrough.module.css';
import { useWalkthroughData } from '../../hooks/useWalkthroughData';
import { useMarzipano } from '../../hooks/useMarzipano';
import { prefetchAssetsInChunks, registerAssetCacheServiceWorker } from '../../lib/client-asset-cache';
import { EXTERIOR_DATA } from '../../utils/walkthroughConstants';
import Controls from './Controls';
import Minimap from './Minimap';

const START_SCENE_ID = '22-ls_bp_panopath_exterior_f0000';
const WARMUP_FACE_IDS = ['b', 'd', 'f', 'l', 'r', 'u'];

function buildSceneWarmupUrls(scene) {
    if (!scene?.tilesPath) {
        return [];
    }

    const cleanPath = scene.tilesPath.replace('/tiles/', '');
    const sceneBaseUrl = `${EXTERIOR_DATA.TILE_BASE_URL}/${cleanPath}`;

    return [
        `${sceneBaseUrl}/preview.jpg?v=2`,
        ...WARMUP_FACE_IDS.map((faceId) => `${sceneBaseUrl}/0/${faceId}/0/0.jpg?v=2`),
    ];
}

export default function Walkthrough() {
    const panoRef = useRef(null);

    const { navData, scenesData, navMap, isDataLoaded } = useWalkthroughData();

    const {
        isViewerReady, // is the viewer created using Marzipano
        currentSceneId, //current scene id
        yaw, //current yaw
        targets, //targets
        switchScene //switch scene
    } = useMarzipano({
        panoElement: panoRef.current,
        scenesData,
        navMap,
        navData
    }); 

    useEffect(() => {
        if (!isDataLoaded || scenesData.length === 0) {
            return;
        }

        void registerAssetCacheServiceWorker();

        const startScene = scenesData.find((scene) => scene.id === START_SCENE_ID) ?? scenesData[0];
        const startWarmupUrls = buildSceneWarmupUrls(startScene);

        if (startWarmupUrls.length > 0) {
            prefetchAssetsInChunks(startWarmupUrls, {
                chunkSize: 3,
                concurrency: 2,
                priority: 'high',
                immediate: true,
                gapMs: 80,
                idleTimeoutMs: 700,
                delayMs: 0,
            });
        }
    }, [isDataLoaded, scenesData]);

    useEffect(() => {
        if (!currentSceneId || scenesData.length === 0) {
            return;
        }

        const warmSceneIds = [
            currentSceneId,
            targets.forward,
            targets.left,
            targets.right,
            targets.back,
        ].filter(Boolean);

        const warmupUrls = [
            ...new Set(
                warmSceneIds.flatMap((sceneId) => {
                    const scene = scenesData.find((entry) => entry.id === sceneId);
                    return buildSceneWarmupUrls(scene);
                }),
            ),
        ];

        if (warmupUrls.length > 0) {
            prefetchAssetsInChunks(warmupUrls, {
                chunkSize: 4,
                concurrency: 2,
                priority: 'low',
                immediate: true,
                gapMs: 120,
                idleTimeoutMs: 900,
                delayMs: 0,
            });
        }
    }, [currentSceneId, scenesData, targets.back, targets.forward, targets.left, targets.right]);

    // Initial Scene Load
    useEffect(() => {
        if (isViewerReady && scenesData.length > 0 && !currentSceneId) {
            // Default start scene from constants or data
            // "22-ls_bp_panopath_exterior_f0000" is the start node
            const startId = START_SCENE_ID;
            switchScene(startId);
        }
    }, [isViewerReady, scenesData, currentSceneId, switchScene]);

    const handleMove = (direction) => {
        const targetId = targets[direction];
        if (targetId) {
            switchScene(targetId);
        }
    };

    return (
        <div className={styles.wrapper}>
            {(!isDataLoaded || !isViewerReady) && (
                <div className={styles.loader}>Loading walkthrough...</div>
            )}

            <div ref={panoRef} className={styles.pano} />

            <Controls targets={targets} onMove={handleMove} />

            <Minimap
                navData={navData}
                currentSceneId={currentSceneId}
                yaw={yaw}
                onNavigate={switchScene}
            />
        </div>
    );
}
