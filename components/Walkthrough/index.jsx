'use client';

import React, { useRef, useEffect } from 'react';
import styles from '../../app/walkthrough/walkthrough.module.css';
import { useWalkthroughData } from '../../hooks/useWalkthroughData';
import { useMarzipano } from '../../hooks/useMarzipano';
import Controls from './Controls';
import Minimap from './Minimap';

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

    // Initial Scene Load
    useEffect(() => {
        if (isViewerReady && scenesData.length > 0 && !currentSceneId) {
            // Default start scene from constants or data
            // "22-ls_bp_panopath_exterior_f0000" is the start node
            const startId = "22-ls_bp_panopath_exterior_f0000";
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
