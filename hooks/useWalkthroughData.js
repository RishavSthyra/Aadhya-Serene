import { useState, useEffect, useMemo } from 'react';
import { EXTERIOR_DATA } from '../utils/walkthroughConstants';

export function useWalkthroughData() {
    const [navData, setNavData] = useState([]); // this are the nodes
    const [scenesData, setScenesData] = useState([]); //store scene definitions
    const [isDataLoaded, setIsDataLoaded] = useState(false);   // Tracks whether loading is finished.
    const [error, setError] = useState(null); // Stores any error that occurs during loading.

    useEffect(() => {
        Promise.all([
            fetch(EXTERIOR_DATA.NAV_URL).then(res => res.json()),
            fetch(EXTERIOR_DATA.SCENES_URL).then(res => res.json())
        ]).then(([nav, scenes]) => {
            setNavData(Array.isArray(nav) ? nav : []);
            setScenesData(Array.isArray(scenes) ? scenes : []);
            setIsDataLoaded(true);
        }).catch(err => {
            console.error("Failed to load walkthrough data", err);
            setError(err);
        });
    }, []);

    const navMap = useMemo(() => {
        const map = Object.create(null);
        for (const node of navData) {
            map[node.id] = node;
        }
        return map;
    }, [navData]);

        // {
        //     id : {
        //         id : "",
        //         pos : {

        //         },
        //         forward : {
                    
        //         },
        //         right : {
                    
        //         }
        //     }
        // }

    // console.log(navMap)

    return { navData, scenesData, navMap, isDataLoaded, error };
}


