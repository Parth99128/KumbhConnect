// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import Sound from 'react-native-sound';
import BackgroundGeolocation from 'react-native-background-geolocation';

// Reusing the incredibly efficient AR Compass we built in Phase 4!
import { ARCompass, Coordinates } from './ARCompass';

// Make sure react-native-sound isn't muted even if the hardware ringer is off (iOS requirement)
Sound.setCategory('Playback', true);

interface RescueDashboardProps {
    leaderUserId: string;
    groupMembers: string[]; // List of user IDs belonging to this Group Leader
}

/**
 * The Rescue Dashboard activates exclusively for the Group Leader
 * when their phone detects an incoming MESH SOS payload from one of their specific children/members.
 */
export const GroupLeaderRescueDashboard: React.FC<RescueDashboardProps> = ({ leaderUserId, groupMembers }) => {
    const [rescueModeActive, setRescueModeActive] = useState(false);
    const [lostMemberCoords, setLostMemberCoords] = useState<Coordinates | null>(null);
    const [lostMemberId, setLostMemberId] = useState<string | null>(null);
    const [leaderCoords, setLeaderCoords] = useState<Coordinates | null>(null);
    const mapRef = useRef<MapView>(null);
    const alarmSound = useRef<typeof Sound | null>(null);

    // Initializer to load the heavy alarm noise into device memory seamlessly 
    useEffect(() => {
        // "alarm_loud.mp3" should be bundled in the Android res/raw or iOS main bundle
        alarmSound.current = new Sound('alarm_loud.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.error('[RescueDashboard] Failed to pre-load alarm sound', error);
            }
        });

        // Track Leader's own GPS so the AR Compass has a point of origin
        const watcher = BackgroundGeolocation.onLocation((location) => {
            setLeaderCoords({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });
        });

        return () => {
            if (alarmSound.current) alarmSound.current.release();
            watcher.remove();
        };
    }, []);

    // Primary Mesh Event Listener
    useEffect(() => {
        const meshListener = DeviceEventEmitter.addListener('MESH_PAYLOAD_RECEIVED', (data) => {
            
            // Logically determine if this is an SOS specifically intended for this leader
            const isSOS = data.type === 'AUTO_SOS' || data.type === 'MANUAL_SOS';
            const isMyGroupMember = groupMembers.includes(data.userId);

            if (isSOS && isMyGroupMember) {
                console.warn(`[Rescue Dashboard] Received ${data.type} from ${data.userId}! Engaging Rescue Mode!`);
                
                // 1. Kick into Rescue UI State
                setLostMemberId(data.userId);
                setLostMemberCoords({ latitude: data.lat, longitude: data.lng });
                setRescueModeActive(true);

                // 2. Trigger deafening persistent siren bypassing Silent Mode
                if (alarmSound.current) {
                    alarmSound.current.setVolume(1.0);
                    alarmSound.current.setNumberOfLoops(-1); // Infinity loops
                    alarmSound.current.play();
                }

                // 3. Immediately snap the map camera exactly to the lost member's last known ping
                if (mapRef.current) {
                    mapRef.current.animateCamera({
                        center: { latitude: data.lat, longitude: data.lng },
                        zoom: 18,
                    }, { duration: 1500 });
                }
            }
        });

        return () => meshListener.remove();
    }, [groupMembers]);

    // Safety function: Deactivate alarm once they find the missing person 
    const disableRescueMode = () => {
        console.log('[Rescue Dashboard] Rescue operation resolved.');
        setRescueModeActive(false);
        if (alarmSound.current) {
            alarmSound.current.stop();
        }
        setLostMemberCoords(null);
        setLostMemberId(null);
    };

    return (
        <View style={styles.container}>
            {/* Standard passive Map rendering layer */}
            <MapView 
                ref={mapRef} 
                style={styles.map} 
                mapType="none"
                initialRegion={{
                    latitude: 25.4358,
                    longitude: 81.8661,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <UrlTile
                    urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                />

                {/* If Rescue Mode is active, drop a marker pin on the Lost Member */}
                {rescueModeActive && lostMemberCoords && (
                    <Marker 
                        coordinate={{ latitude: lostMemberCoords.latitude, longitude: lostMemberCoords.longitude }} 
                    />
                )}
            </MapView>

            {/* 🔥 High-Priority Hardware UI Overlay 🔥 */}
            {rescueModeActive && leaderCoords && lostMemberCoords && (
                <View style={styles.rescueOverlay}>
                    
                    <View style={styles.banner}>
                        <Text style={styles.bannerText}>EMERGENCY: MEMBER LOST</Text>
                        <Text style={styles.bannerSubText}>ID: {lostMemberId}</Text>
                    </View>

                    {/* Utilizing the exact Prompt 6 AR Compass we built earlier for direction! */}
                    <ARCompass 
                        userCoords={leaderCoords} 
                        targetCoords={lostMemberCoords} 
                    />

                    <TouchableOpacity 
                        style={styles.resolveButton} 
                        onPress={disableRescueMode}
                    >
                        <Text style={styles.resolveButtonText}>MEMBER FOUND (MUTE ALARM)</Text>
                    </TouchableOpacity>

                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    rescueOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 50,
        zIndex: 1000
    },
    banner: {
        backgroundColor: '#dc2626',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        width: '90%'
    },
    bannerText: { color: 'white', fontSize: 24, fontWeight: '900' },
    bannerSubText: { color: '#fca5a5', fontSize: 16, marginTop: 5 },
    resolveButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#86efac'
    },
    resolveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});

export default GroupLeaderRescueDashboard;