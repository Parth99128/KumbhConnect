// @ts-nocheck
import { BleManager } from 'react-native-ble-plx';
import BackgroundGeolocation from 'react-native-background-geolocation';
import MeshNetworkService from './MeshNetworkService';

class BLEDensityScanner {
    private bleManager: BleManager;
    private currentDensityScore: number = 0;
    private scanInterval: NodeJS.Timeout | null = null;
    
    constructor() {
        this.bleManager = new BleManager();
    }

    /**
     * Initializes the background density routine
     */
    public startMonitoring() {
        console.log('[BLE Sniffer] Started crowd density monitoring. Polling every 3 mins.');
        
        // Wake up every 3 minutes (180,000 milliseconds)
        this.scanInterval = setInterval(() => {
            this.performScan();
        }, 180000);

        // Optional: Run one immediately on boot
        this.performScan();
    }

    public stopMonitoring() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        this.bleManager.stopDeviceScan();
        console.log('[BLE Sniffer] Stopped monitoring.');
    }

    private performScan() {
        console.log('[BLE Sniffer] Waking up for strictly 15-second density scan...');
        const uniqueDevices = new Set<string>();

        // Start scanning with no specific UUID filters. Allow duplicate packets (we filter them instantly using Sets)
        this.bleManager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
            if (error) {
                console.error('[BLE Sniffer] Scan emission error:', error);
                return;
            }
            if (device && device.id) {
                // Add unique MAC address/device ID. Do NOT connect.
                uniqueDevices.add(device.id);
            }
        });

        // Enforcement: Stop scanning exactly after 15 seconds
        setTimeout(async () => {
            this.bleManager.stopDeviceScan();
            this.currentDensityScore = uniqueDevices.size;
            
            console.log(`[BLE Sniffer] Scan complete. Found ${this.currentDensityScore} unique active BLE devices in radius.`);

            // Core Logic limit
            if (this.currentDensityScore > 250) {
                console.warn('[BLE Sniffer] THRESHOLD EXCEEDED (>250)! Massive crowd crush detected.');
                this.triggerMeshCrowdWarning();
            }
        }, 15000);
    }

    private async triggerMeshCrowdWarning() {
        try {
            // Instantly pull exact coordinates dynamically from the Geolocation service
            const location = await BackgroundGeolocation.getCurrentPosition({
                samples: 1, 
                persist: false
            });
            
            // Hand off payload formatting and broadcasting to the Mesh Network class
            MeshNetworkService.broadcastCrowdWarning(
                location.coords.latitude, 
                location.coords.longitude
            );
        } catch (error) {
            console.error('[BLE Sniffer] Failed to lock physical GPS coordinates for mesh blast', error);
        }
    }
    
    // For debugging & UI viewing locally
    public getCurrentScore(): number {
        return this.currentDensityScore;
    }
}

// Export singleton instance
export default new BLEDensityScanner();
