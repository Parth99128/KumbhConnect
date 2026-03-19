// @ts-nocheck
import NetInfo from '@react-native-community/netinfo';
import NearbyConnections from 'react-native-nearby-connections';
import { DeviceEventEmitter } from 'react-native';

const SERVICE_ID = 'KUMBH_CONNECT_MESH';

export interface MeshPayload {
    user_id: string;
    lat: number;
    long: number;
    timestamp: number;
}

class MeshNetworkService {
    private isBroadcasting = false;
    private connectedEndpoints: string[] = [];
    private currentEndpointName = `User_${Math.floor(Math.random() * 10000)}`;

    async init() {
        // Monitor network state dynamically
        NetInfo.addEventListener(state => {
            // Constraint: Only trigger if standard internet (4G/5G/Wi-Fi) is completely unavailable
            if (!state.isConnected || state.isInternetReachable === false) {
                console.log('[Mesh] No internet detected. Instantiating Mesh Network via Nearby API...');
                this.startBroadcasting();
            } else {
                console.log('[Mesh] Internet connection active. Halting Mesh Network to conserve battery.');
                this.stopBroadcasting();
            }
        });

        // Listen for incoming mesh network connection requests
        NearbyConnections.onEndpointDiscovered(({ endpointId, endpointName }) => {
            console.log(`[Mesh] Discovered nearby device: ${endpointName}. Connecting...`);
            NearbyConnections.connectToEndpoint(SERVICE_ID, endpointId);
        });

        NearbyConnections.onConnectedToEndpoint(({ endpointId }) => {
            this.connectedEndpoints.push(endpointId);
            console.log(`[Mesh] Successfully connected to endpoint: ${endpointId}`);
        });

        NearbyConnections.onDisconnectedFromEndpoint(({ endpointId }) => {
            this.connectedEndpoints = this.connectedEndpoints.filter(id => id !== endpointId);
        });

        // Receive mesh payloads from other offline users
        NearbyConnections.onReceivePayload(({ endpointId, payloadId, payloadType, bytes }) => {
            try {
                const data = JSON.parse(bytes);
                console.log(`[Mesh Receive] Offline payload from ${endpointId}:`, data);
                
                // Immediately emit this to the UI layer components globally
                DeviceEventEmitter.emit('MESH_PAYLOAD_RECEIVED', data);
                
                // Proxy to SQLite logic would go here
            } catch (error) {
                console.error('Failed to parse incoming mesh bytes');
            }
        });
    }

    async startBroadcasting() {
        if (this.isBroadcasting) return;

        try {
            // STRATEGY_P2P_CLUSTER: Uses M-to-N topologies. 
            // This is strictly required for large swarms/mesh networking using BLE and Wi-Fi Direct seamlessly.
            await NearbyConnections.startAdvertising(
                this.currentEndpointName,
                SERVICE_ID,
                NearbyConnections.STRATEGY_P2P_CLUSTER
            );
            
            await NearbyConnections.startDiscovery(
                SERVICE_ID,
                NearbyConnections.STRATEGY_P2P_CLUSTER
            );

            this.isBroadcasting = true;
            console.log('[Mesh] Advertising and Discovering started.');
        } catch (error) {
            console.error('[Mesh Error] Failed to start mesh networking', error);
        }
    }

    async stopBroadcasting() {
        if (!this.isBroadcasting) return;

        NearbyConnections.stopAdvertising();
        NearbyConnections.stopDiscovery();
        NearbyConnections.stopAllEndpoints();
        this.connectedEndpoints = [];
        this.isBroadcasting = false;
        console.log('[Mesh] Network halted.');
    }

    /**
     * Broadcasts the exact required JSON payload via the Mesh
     * Constraint: Small JSON payload (user_id, lat, long, timestamp)
     */
    broadcastLocationEvent(userId: string, lat: number, long: number) {
        if (!this.isBroadcasting || this.connectedEndpoints.length === 0) return;

        const payload: MeshPayload = {
            user_id: userId,
            lat: lat,
            long: long,
            timestamp: Date.now()
        };

        const payloadBytes = JSON.stringify(payload);

        // Broadcast to all devices currently physically tethered via Wi-Fi Direct/BLE
        NearbyConnections.sendBytes(SERVICE_ID, this.connectedEndpoints, payloadBytes);
        
        console.log(`[Mesh Transmit] Sent offline byte payload: ${payloadBytes}`);
    }

    /**
     * Broadcasts a high-priority warning triggered by the BLE Density Sniffer
     */
    broadcastCrowdWarning(lat: number, long: number) {
        if (!this.isBroadcasting || this.connectedEndpoints.length === 0) return;

        const warningPayload = {
            type: "MESH_CROWD_WARNING",
            lat: lat,
            lng: long,
            radius: 50
        };

        const payloadBytes = JSON.stringify(warningPayload);

        // Send high priority alert string over the mesh instantly
        NearbyConnections.sendBytes(SERVICE_ID, this.connectedEndpoints, payloadBytes);
        console.warn(`[Mesh Transmit] CRITICAL CROWD WARNING BLASTED to ${this.connectedEndpoints.length} devices.`);
    }

    /**
     * Broadcasts an automated SOS when a user breaks the Geofence tether (Phase 7)
     */
    broadcastAutoSOS(userId: string, lat: number, lng: number) {
        if (!this.isBroadcasting || this.connectedEndpoints.length === 0) return;

        const sosPayload = {
            type: "AUTO_SOS",
            userId: userId,
            lat: lat,
            lng: lng
        };

        const payloadBytes = JSON.stringify(sosPayload);

        NearbyConnections.sendBytes(SERVICE_ID, this.connectedEndpoints, payloadBytes);
        console.warn(`[Mesh Transmit] AUTO_SOS BLASTED for drifted user: ${userId}`);
    }

    /**
     * Broadcasts a max-priority manual panic SOS (Prompt 11)
     */
    broadcastManualSOS(userId: string, lat: number, lng: number) {
        if (!this.isBroadcasting || this.connectedEndpoints.length === 0) return;

        const panicPayload = {
            type: "MANUAL_SOS",
            userId: userId,
            lat: lat,
            lng: lng
        };

        const payloadBytes = JSON.stringify(panicPayload);

        NearbyConnections.sendBytes(SERVICE_ID, this.connectedEndpoints, payloadBytes);
        console.warn(`[Mesh Transmit] MANUAL PANIC SOS BLASTED to network for user: ${userId}`);
    }
}

export default new MeshNetworkService();
