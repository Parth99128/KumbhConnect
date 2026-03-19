import {
  BLE_SERVICE_UUID,
  BLE_LOCATION_CHAR_UUID,
  MESH_MAX_HOP_COUNT,
} from "@stay-connected/shared";
import { useLocationStore } from "../stores/locationStore.ts";
import { useConnectivityStore } from "../stores/connectivityStore.ts";

interface MeshLocationPacket {
  userId: string;
  lat: number;
  lng: number;
  timestamp: number;
  hopCount: number;
  groupCode: string;
}

let isAdvertising = false;
let scanInterval: ReturnType<typeof setInterval> | null = null;

interface BLEDevice {
  gatt?: {
    connect: () => Promise<{
      getPrimaryService: (serviceUuid: string) => Promise<{
        getCharacteristic: (characteristicUuid: string) => Promise<{
          readValue: () => Promise<DataView>;
        }>;
      }>;
      disconnect: () => void;
    }>;
  };
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice: (options: {
      filters: Array<{ services: string[] }>;
      optionalServices: string[];
    }) => Promise<BLEDevice>;
  };
}

/**
 * Check if Web Bluetooth is available.
 */
export function isBLESupported(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as NavigatorWithBluetooth).bluetooth;
}

/**
 * Start BLE mesh networking.
 * Advertises own location and scans for nearby group members.
 */
export async function startMesh(groupCode: string) {
  if (!isBLESupported()) {
    console.warn("Web Bluetooth not supported in this browser");
    return false;
  }

  useConnectivityStore.getState().setMeshActive(true);

  // Start scanning for nearby devices
  scanInterval = setInterval(async () => {
    try {
      await scanForPeers(groupCode);
    } catch (err) {
      console.debug("BLE scan failed:", err);
    }
  }, 10000);

  return true;
}

export function stopMesh() {
  if (scanInterval) {
    clearInterval(scanInterval);
    scanInterval = null;
  }
  isAdvertising = false;
  useConnectivityStore.getState().setMeshActive(false);
}

/**
 * Scan for nearby BLE devices running Stay Connected.
 * Due to Web Bluetooth API limitations, this requires user gesture
 * for the first connection.
 */
async function scanForPeers(groupCode: string) {
  try {
    const bluetooth = (navigator as NavigatorWithBluetooth).bluetooth;
    if (!bluetooth) return;

    const device = await bluetooth.requestDevice({
      filters: [{ services: [BLE_SERVICE_UUID] }],
      optionalServices: [BLE_SERVICE_UUID],
    });

    if (!device.gatt) return;

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(BLE_SERVICE_UUID);
    const characteristic = await service.getCharacteristic(
      BLE_LOCATION_CHAR_UUID
    );

    const value = await characteristic.readValue();
    const packet = decodeMeshPacket(value);

    if (packet && packet.groupCode === groupCode && packet.hopCount < MESH_MAX_HOP_COUNT) {
      // Update location store with mesh-received location
      useLocationStore.getState().updateMemberLocation({
        userId: packet.userId,
        name: `Mesh:${packet.userId.slice(0, 4)}`,
        latitude: packet.lat,
        longitude: packet.lng,
        accuracy: 50, // Mesh locations have ~50m accuracy
        source: "BLUETOOTH",
        timestamp: packet.timestamp,
      });

      console.log(`Mesh: received location from ${packet.userId}`);
    }

    server.disconnect();
  } catch (err) {
    // Expected - user may deny or no devices found
  }
}

function decodeMeshPacket(
  dataView: DataView
): MeshLocationPacket | null {
  try {
    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(dataView.buffer);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function encodeMeshPacket(packet: MeshLocationPacket): ArrayBuffer {
  const jsonStr = JSON.stringify(packet);
  const encoder = new TextEncoder();
  return encoder.encode(jsonStr).buffer;
}
