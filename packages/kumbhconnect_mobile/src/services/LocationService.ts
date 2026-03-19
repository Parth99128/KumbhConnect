// @ts-nocheck
import BackgroundGeolocation from 'react-native-background-geolocation';

class LocationService {
    private userStatus: 'active' | 'lost' = 'active';

    async init() {
        // 1. Listen to battery level changes
        BackgroundGeolocation.onBattery((event: any) => {
            console.log('[Battery] level: ', event.level, 'is_charging: ', event.is_charging);
            this.adjustTrackingInterval(event.level);
        });

        // 2. Listen to location updates
        BackgroundGeolocation.onLocation((location: any) => {
            console.log('[Location] -', location.coords.latitude, location.coords.longitude);
            // In a real app, send this to the /update_location FastAPI endpoint here
        });

        // 3. Configure the plugin
        await BackgroundGeolocation.ready({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: 10, // meters
            locationUpdateInterval: 30000, // Default to 30 seconds
            stopOnTerminate: false, // Continue background tracking
            startOnBoot: true,
            debug: false, // Set to true to hear auditory debug alerts
        });

        // Start tracking
        await BackgroundGeolocation.start();
    }

    /**
     * Updates the user's status and re-evaluates the battery constraint.
     */
    public async updateUserStatus(status: 'active' | 'lost') {
        this.userStatus = status;
        
        // Fetch current battery to adjust the interval immediately based on new status
        try {
            const battery = await BackgroundGeolocation.getBattery();
            this.adjustTrackingInterval(battery.level);
        } catch (error) {
            console.error('Failed to get battery level', error);
        }
    }

    /**
     * Smart Polling Implementation:
     * If battery drops below 20% (< 0.20), reduce GPS fetch interval to once every 10 mins (600000ms),
     * UNLESS their status is marked as 'lost', in which case we maintain high-frequency tracking.
     */
    private adjustTrackingInterval(batteryLevel: number) {
        if (batteryLevel < 0.20 && this.userStatus !== 'lost') {
            console.log('Low battery detected (not lost). Conserving power. Interval set to 10 mins.');
            BackgroundGeolocation.setConfig({
                locationUpdateInterval: 600000, // 10 minutes in milliseconds
                fastestLocationUpdateInterval: 600000,
                distanceFilter: 50 // Increase distance filter to save power
            });
        } else {
            console.log('Restoring normal tracking interval (or emergency high-freq mode).');
            BackgroundGeolocation.setConfig({
                locationUpdateInterval: 30000, // 30 seconds
                fastestLocationUpdateInterval: 10000,
                distanceFilter: 10
            });
        }
    }
}

export default new LocationService();
