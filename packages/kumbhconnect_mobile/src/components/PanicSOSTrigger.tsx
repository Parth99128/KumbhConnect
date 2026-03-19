// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Vibration } from 'react-native';
import { VolumeManager } from 'react-native-volume-manager';
import BackgroundGeolocation from 'react-native-background-geolocation';
import MeshNetworkService from '../services/MeshNetworkService';

interface PanicSOSProps {
    userId: string;
}

export const PanicSOSTrigger: React.FC<PanicSOSProps> = ({ userId }) => {
    const tapTimes = useRef<number[]>([]);
    
    // Core function to fetch coordinates and bypass all checks to send the SOS
    const sendMaxPrioritySOS = async () => {
        try {
            console.warn('[PanicSOS] Initiating Max-Priority Emergency Overrides...');
            
            // Intentionally bypass typical background polling to force an immediate high-accuracy lock
            const location = await BackgroundGeolocation.getCurrentPosition({
                samples: 2, 
                persist: false
            });

            // 1. Blast the network
            MeshNetworkService.broadcastManualSOS(
                userId, 
                location.coords.latitude, 
                location.coords.longitude
            );

            // 2. Continuous extreme vibration so the user knows help was requested successfully
            Vibration.vibrate([0, 1000, 500, 1000, 500, 1000, 500, 2000]);

        } catch (error) {
            console.error('[PanicSOS] Failed to acquire GPS sequence:', error);
        }
    };

    // Hardware Button Listener Hook
    useEffect(() => {
        // Suppress the native system UI when buttons are pressed so the user isn't distracted
        VolumeManager.showNativeVolumeUI({ enabled: false });

        const volumeListener = VolumeManager.addVolumeListener((result) => {
            const now = Date.now();
            
            // Register this tap time
            tapTimes.current.push(now);

            // Clean array: Throw out any taps older than 3 seconds (3000ms)
            tapTimes.current = tapTimes.current.filter((time) => now - time <= 3000);

            // Constraint: 4 presses within the 3-second rolling window
            if (tapTimes.current.length >= 4) {
                console.log('[PanicSOS] Hardware Volume Pattern detected!');
                tapTimes.current = []; // Reset sequence lock
                sendMaxPrioritySOS();
            }
        });

        return () => {
            volumeListener.remove();
            VolumeManager.showNativeVolumeUI({ enabled: true });
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* 
                Visual On-Screen Trigger.
                Constraint: Must be long-pressed for 2 seconds to fire the exact same logic.
            */}
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.sosButton}
                delayLongPress={2000} // 2 seconds
                onLongPress={() => {
                    console.log('[PanicSOS] On-screen UI Long press detected!');
                    sendMaxPrioritySOS();
                }}
            >
                <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 40,
        alignSelf: 'center',
        zIndex: 999 
    },
    sosButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#dc2626', // Deep pure red
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#fca5a5'
    },
    sosText: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2
    }
});
