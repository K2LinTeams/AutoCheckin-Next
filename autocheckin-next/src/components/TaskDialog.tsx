import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid2, Box, IconButton, InputAdornment
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import LoginDialog from "./LoginDialog";
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MapIcon from '@mui/icons-material/Map';
import LocationDialog from "./LocationDialog";

interface Task {
  id?: string;
  name: string;
  time: string;
  class_id: string;
  cookie: string;
  location: { lat: string; lng: string; acc: string };
  enable: boolean;
}

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  task: Task | null;
}

const TaskDialog: React.FC<TaskDialogProps> = ({ open, onClose, onSave, task }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Task>({
    name: "",
    time: "08:00",
    class_id: "",
    cookie: "",
    location: { lat: "", lng: "", acc: "10.0" },
    enable: true
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        name: "",
        time: "08:00",
        class_id: "",
        cookie: "",
        location: { lat: "", lng: "", acc: "10.0" },
        enable: true
      });
    }
  }, [task, open]);

  const handleChange = (field: keyof Task, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      location: { ...formData.location, [field]: value }
    });
  };

  const handleSave = async () => {
    if (task) {
      await invoke("update_task", { task: formData });
    } else {
      await invoke("add_task", { task: { ...formData, id: "" } });
    }
    onSave();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{task ? t("Edit") : t("Add Task")}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            fullWidth
            label={t("Name")}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label={t("Time")}
            type="time"
            value={formData.time}
            onChange={(e) => handleChange("time", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="normal"
            fullWidth
            label={t("Class ID")}
            value={formData.class_id}
            onChange={(e) => handleChange("class_id", e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Cookie"
            value={formData.cookie}
            onChange={(e) => handleChange("cookie", e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setLoginOpen(true)}>
                    <QrCodeScannerIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Grid2 container spacing={2}>
            <Grid2 size={5}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Latitude")}
                value={formData.location.lat}
                onChange={(e) => handleLocationChange("lat", e.target.value)}
              />
            </Grid2>
            <Grid2 size={5}>
              <TextField
                margin="normal"
                fullWidth
                label={t("Longitude")}
                value={formData.location.lng}
                onChange={(e) => handleLocationChange("lng", e.target.value)}
              />
            </Grid2>
            <Grid2 size={2} display="flex" alignItems="center">
                 <IconButton onClick={() => setMapOpen(true)} color="primary">
                     <MapIcon />
                 </IconButton>
            </Grid2>
          </Grid2>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button onClick={handleSave} variant="contained">{t("Save")}</Button>
      </DialogActions>

      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={(cookie, classId) => {
          setFormData({ ...formData, cookie, class_id: classId || formData.class_id });
        }}
      />

      <LocationDialog
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        onSelect={(lat, lng) => {
            setFormData({
                ...formData,
                location: { ...formData.location, lat, lng }
            });
        }}
        initialLat={formData.location.lat}
        initialLng={formData.location.lng}
      />
    </Dialog>
  );
};

export default TaskDialog;
