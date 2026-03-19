// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, DeviceEventEmitter } from 'react-native';
import MapView, { UrlTile, Circle } from 'react-native-maps';
import Animated, { 
    useSharedValue, 
    withRepeat, 
    withTiming, 
    useAnimatedProps, 
    Easing 
} from 'react-native-reanimated';

// Coordinates for Prayagraj (Kumbh Mela grounds)
const KUMBH_MELA_COORDS = { latitude: 25.4358, longitude: 81.8661 };

// Create an animated component specifically for react-native-maps Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Modular component to handle the specific pulsing animation for a single warning zone.
 * Isolates the Reanimated hooks natively to prevent full React re-renders.
 */
const PulsingWarningZone = ({ target }: { target: any }) => {
    const pulseAnim = useSharedValue(1);

    useEffect(() => {
        // Start infinite pulsing heartbeat animation
        pulseAnim.value = withRepeat(
            withTiming(2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1, // Loop infinitely
            true // Reverse
        );
    }, []);

    // Dynamically calculate the radius and fade based on the pulse cycle
    const animatedProps = useAnimatedProps(() => {
        return {
            radius: target.radius * pulseAnim.value,
            fillColor: `rgba(239, 68, 68, ${0.65 / pulseAnim.value})`,
        };
    });

    return (
        <AnimatedCircle
            center={{ latitude: target.lat, longitude: target.lng }}
            strokeWidth={2}
            strokeColor="rgba(153, 27, 27, 0.9)" // Dark red border
            animatedProps={animatedProps}
        />
    );
};

const OfflineMap: React.FC = () => {
    const [warnings, setWarnings] = useState<any[]>([]);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        // 1. Establish connection to Drone AI Webhook via standard WebSockets
        const ws = new WebSocket('ws://10.0.2.2:8000/ws/alerts');
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'DRONE_WARNING') {
                    // Inject live Drone Bottleneck warning into the UI array
                    setWarnings((prev) => [...prev, data]);
                }
            } catch (e) {
                console.error("WebSocket payload error");
            }
        };

        // 2. Listen to the local Offline Mesh network for BLE crowd bursts
        const meshListener = DeviceEventEmitter.addListener('MESH_PAYLOAD_RECEIVED', (data) => {
            if (data.type === 'MESH_CROWD_WARNING') {
                // Inject live Offline Mesh warning into UI array
                setWarnings((prev) => [...prev, data]);
            }
        });

        // Cleanup hooks
        return () => {
            ws.close();
            meshListener.remove();
        };
    }, []);

    return (
        <View style={styles.container}>
            <MapView 
                ref={mapRef}
                style={styles.map}
                mapType="none" // STRICT CONSTRAINT: Completely hides default Google/Apple Maps (No API Keys)
                initialRegion={{
                    latitude: KUMBH_MELA_COORDS.latitude,
                    longitude: KUMBH_MELA_COORDS.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {/* 
                  100% Free OpenStreetMap Raster Web Tiles. 
                  Renders the map purely through HTTP imagery instead of proprietary APIs. 
                */}
                <UrlTile
                    urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                />
                
                {/* Render the pulsing Danger/Avoid zones directly over the OSM tiles */}
                {warnings.map((warn, index) => (
                    <PulsingWarningZone key={`warning-${index}`} target={warn} />
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject
    }
});

export default OfflineMap;