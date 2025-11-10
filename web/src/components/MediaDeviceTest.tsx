"use client";
import { useState } from "react";
import { checkMediaDevices, requestMediaPermissions } from "@/utils/mediaUtils";

export default function MediaDeviceTest() {
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("");

  const checkDevices = async () => {
    try {
      const info = await checkMediaDevices();
      setDeviceInfo(info);
    } catch (error) {
      console.error("Error checking devices:", error);
    }
  };

  const checkPermissions = async () => {
    try {
      const hasPermission = await requestMediaPermissions();
      setPermissionStatus(hasPermission ? "Granted" : "Denied");
    } catch (error) {
      console.error("Error checking permissions:", error);
      setPermissionStatus("Error");
    }
  };

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Media Device Test</h3>
      
      <div className="space-y-4">
        <button
          onClick={checkDevices}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Check Available Devices
        </button>
        
        <button
          onClick={checkPermissions}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Check Permissions
        </button>
        
        {deviceInfo && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded">
            <h4 className="font-semibold">Device Information:</h4>
            <p>Audio Input: {deviceInfo.hasAudioInput ? "✅" : "❌"} ({deviceInfo.audioDevices.length} devices)</p>
            <p>Video Input: {deviceInfo.hasVideoInput ? "✅" : "❌"} ({deviceInfo.videoDevices.length} devices)</p>
          </div>
        )}
        
        {permissionStatus && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded">
            <h4 className="font-semibold">Permission Status:</h4>
            <p>{permissionStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}
