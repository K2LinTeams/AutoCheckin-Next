import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LeafletMouseEvent } from "leaflet";

// Fix Leaflet marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (lat: string, lng: string) => void;
  initialLat: string;
  initialLng: string;
}

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

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
