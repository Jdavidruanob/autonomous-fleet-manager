"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { Device } from "@/types/device";

// Fix default Leaflet icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// PUJ Cali campus center
const CAMPUS_CENTER: [number, number] = [3.3452, -76.5300];
const CAMPUS_ZOOM = 17;

interface CampusPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  devices: Device[];
  campusPoints: CampusPoint[];
}

function makeDeviceIcon(device: Device) {
  const color =
    device.status === "available"
      ? "#20a04e"
      : device.status === "in_mission"
      ? "#1d58dc"
      : "#df2225";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-family="ui-sans-serif,sans-serif">
        ${device.type === "drone" ? "✈" : "🤖"}
      </text>
    </svg>`;

  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function makeCampusPointIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:10px;height:10px;border-radius:50%;background:#1d58dc;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

function DeviceMarkersLayer({ devices }: { devices: Device[] }) {
  const devicesWithCoords = devices.filter(
    (d) => d.latitude != null && d.longitude != null
  );

  return (
    <>
      {devicesWithCoords.map((device) => (
        <Marker
          key={device.id}
          position={[device.latitude!, device.longitude!]}
          icon={makeDeviceIcon(device)}
        >
          <Popup>
            <div className="text-sm space-y-1">
              <div className="font-semibold">{device.code} — {device.name}</div>
              <div>Batería: <span className="font-medium">{Math.round(device.batteryLevel)}%</span></div>
              <div>Estado: <span className="font-medium capitalize">{device.status}</span></div>
              {device.speed != null && (
                <div>Velocidad: <span className="font-medium">{device.speed} km/h</span></div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function CampusMap({ devices, campusPoints }: Props) {
  const campusIcon = makeCampusPointIcon();

  return (
    <MapContainer
      center={CAMPUS_CENTER}
      zoom={CAMPUS_ZOOM}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Campus boundary hint */}
      <Circle
        center={CAMPUS_CENTER}
        radius={300}
        pathOptions={{ color: "#1d58dc", fillColor: "#1d58dc", fillOpacity: 0.04, weight: 1.5, dashArray: "6 4" }}
      />

      {/* Static campus points */}
      {campusPoints.map((point) => (
        <Marker
          key={point.id}
          position={[point.latitude, point.longitude]}
          icon={campusIcon}
        >
          <Popup>
            <div className="text-xs font-semibold">{point.name}</div>
          </Popup>
        </Marker>
      ))}

      {/* Live device markers */}
      <DeviceMarkersLayer devices={devices} />
    </MapContainer>
  );
}
