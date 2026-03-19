// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { magnetometer } from 'react-native-sensors';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

interface ARCompassProps {
    userCoords: Coordinates;
    targetCoords: Coordinates;
}

// Helper: Convert degrees to radians
const toRadians = (degree: number) => (degree * Math.PI) / 180;
// Helper: Convert radians to degrees
const toDegrees = (radian: number) => (radian * 180) / Math.PI;

/**
 * Calculates the exact forward azimuth (bearing) between two global coordinates.
 * Using standard Haversine mathematics.
 */
const calculateBearing = (start: Coordinates, end: Coordinates) => {
    const startLat = toRadians(start.latitude);
    const startLng = toRadians(start.longitude);
    const endLat = toRadians(end.latitude);
    const endLng = toRadians(end.longitude);

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = 
        Math.cos(startLat) * Math.sin(endLat) - 
        Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
};

export const ARCompass: React.FC<ARCompassProps> = ({ userCoords, targetCoords }) => {
    const [heading, setHeading] = useState(0);
    const [bearing, setBearing] = useState(0);
    
    // Reanimated shared value strictly bound to 60fps native UI thread
    const rotationAngle = useSharedValue(0);

    // 1. Calculate and update the physical bearing to the target
    useEffect(() => {
        const newBearing = calculateBearing(userCoords, targetCoords);
        setBearing(newBearing);
    }, [userCoords, targetCoords]);

    // 2. Read the device's magnetometer data for physical orientation
    useEffect(() => {
        // Subscribe to device compass / magnetometer updates
        const subscription = magnetometer.subscribe(({ x, y }) => {
            
            // Derive raw magnetic heading
            let currentHeading = Math.atan2(y, x) * (180 / Math.PI);
            if (currentHeading < 0) {
                currentHeading += 360;
            }
            setHeading(currentHeading);

            // Calculate the delta angle to make the arrow point toward the target in the real world
            let finalDirectionAngle = bearing - currentHeading;
            
            // Smooth rotation via react-native-reanimated running solidly on UI thread
            rotationAngle.value = withTiming(finalDirectionAngle, {
                duration: 150,
                easing: Easing.linear,
            });
        });

        // Cleanup the hardware subscription on unmount
        return () => subscription.unsubscribe();
    }, [bearing]);

    // 3. Connect animated style cleanly
    const animatedArrowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotationAngle.value}deg` }],
        };
    });

    return (
        <View style={styles.container}>
            <View style={styles.compassCircle}>
                <Animated.View style={[styles.arrowContainer, animatedArrowStyle]}>
                    {/* Simulated visual Arrow graphic (points upwards inherently) */}
                    <View style={styles.arrow} />
                </Animated.View>
            </View>
            <Text style={styles.text}>Target Coordinates</Text>
            <Text style={styles.subtext}>Lat: {targetCoords.latitude.toFixed(4)}, Lon: {targetCoords.longitude.toFixed(4)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 20 
    },
    compassCircle: {
        width: 250, 
        height: 250, 
        borderRadius: 125, 
        borderWidth: 6, 
        borderColor: '#1e293b',
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    arrowContainer: { 
        width: 140, 
        height: 200, 
        alignItems: 'center', 
        justifyContent: 'flex-start' 
    },
    arrow: {
        width: 0, 
        height: 0,
        borderLeftWidth: 30, 
        borderRightWidth: 30, 
        borderBottomWidth: 80,
        borderLeftColor: 'transparent', 
        borderRightColor: 'transparent',
        borderBottomColor: '#ef4444' // A bright red alert color for emergency target
    },
    text: { 
        marginTop: 30, 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#334155' 
    },
    subtext: { 
        fontSize: 14, 
        color: '#64748b', 
        paddingTop: 4 
    }
});

export default ARCompass;
