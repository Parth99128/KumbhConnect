// @ts-nocheck
import { useEffect, useRef } from 'react';
import { Vibration } from 'react-native';
import { getDistance } from 'geolib';
import MeshNetworkService from '../services/MeshNetworkService';

export interface Coords {
    latitude: number;
    longitude: number;
}

/**
 * Custom hook to monitor the "Invisible Tether" between a user and their group leader.
 * Operates purely offline via geometric math.
 */
export const useGeofenceMonitor = (
    userId: string,
    userCoords: Coords | null,
    leaderCoords: Coords | null,
    enabled: boolean = true
) => {
    // Keep track of SOS state so we don't spam the mesh network every 30 seconds
    const hasTriggeredSOS = useRef<boolean>(false);

    useEffect(() => {
        if (!enabled || !userCoords || !leaderCoords) return;

        console.log('[Geofence] Tether monitor active.');

        const tetherInterval = setInterval(() => {
            // Accurate geometric calculation using Haversine formula internally
            const distanceInMeters = getDistance(
                { latitude: userCoords.latitude, longitude: userCoords.longitude },
                { latitude: leaderCoords.latitude, longitude: leaderCoords.longitude }
            );

            console.log(`[Geofence] Current distance to leader: ${distanceInMeters}m`);

            if (distanceInMeters > 100) {
                // LEVEL 2: TETHER BROKEN (> 100m)
                if (!hasTriggeredSOS.current) {
                    console.warn('[Geofence] Tether Broken! User has wandered too far. Triggering AUTO_SOS.');
                    
                    // Distinctive emergency vibration pattern: 3 long heavy pulses
                    Vibration.vibrate([0, 800, 300, 800, 300, 800]);

                    // Trigger the offline mesh payload
                    MeshNetworkService.broadcastAutoSOS(userId, userCoords.latitude, userCoords.longitude);

                    // Lock the trigger to prevent spanning
                    hasTriggeredSOS.current = true;
                }
            } else if (distanceInMeters > 50) {
                // LEVEL 1: DRIFTING WARNING (> 50m but <= 100m)
                console.log('[Geofence] Drifting warning. Alerting user.');
                
                // Short warning vibration
                Vibration.vibrate(400);

                // If they walk back into this safe zone, mentally reset the SOS lock
                if (hasTriggeredSOS.current) {
                    hasTriggeredSOS.current = false;
                }
            } else {
                // Safe Zone (<= 50m)
                // If they are back together, ensure the trigger lock is reset
                if (hasTriggeredSOS.current) {
                    hasTriggeredSOS.current = false;
                }
            }
            
        }, 30000); // Trigger mathematically every 30 seconds

        return () => {
            clearInterval(tetherInterval);
        };
    }, [userId, userCoords, leaderCoords, enabled]);
};
