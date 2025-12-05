import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

// Fix Leaflet marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * Sets the default icon for Leaflet markers.
 * This is necessary because the default icon paths are often incorrect in build environments.
 */
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

/**
 * Props for the LocationDialog component.
 * @interface LocationDialogProps
 * @property {boolean} open - Whether the dialog is currently open.
 * @property {() => void} onClose - Callback function to close the dialog.
 * @property {(lat: string, lng: string) => void} onSelect - Callback function called when a location is selected.
 * @property {string} initialLat - The initial latitude to display.
 * @property {string} initialLng - The initial longitude to display.
 */
interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lat: string, lng: string) => void;
  initialLat: string;
  initialLng: string;
}

/**
 * A helper component to handle map click events.
 *
 * @param {Object} props - The component props.
 * @param {(lat: number, lng: number) => void} props.onLocationSelect - Callback when a location is clicked on the map.
 * @returns {null} This component renders nothing.
 */
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/**
 * A dialog component that displays a map for location selection.
 * Users can click on the map to choose a location (latitude and longitude).
 *
 * @param {LocationDialogProps} props - The component props.
 * @returns {JSX.Element} The rendered LocationDialog component.
 */
const LocationDialog: React.FC<LocationDialogProps> = ({ open, onClose, onSelect, initialLat, initialLng }) => {
  const [position, setPosition] = useState<[number, number]>([39.9042, 116.4074]); // Default Beijing

  useEffect(() => {
    if (open) {
        const lat = parseFloat(initialLat);
        const lng = parseFloat(initialLng);
        if (!isNaN(lat) && !isNaN(lng)) {
            setPosition([lat, lng]);
        }
    }
  }, [open, initialLat, initialLng]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogContent sx={{ height: 500, p: 0 }}>
        <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position} />
          <LocationPicker onLocationSelect={(lat, lng) => setPosition([lat, lng])} />
        </MapContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => {
            onSelect(position[0].toFixed(6), position[1].toFixed(6));
            onClose();
        }} variant="contained">Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationDialog;
