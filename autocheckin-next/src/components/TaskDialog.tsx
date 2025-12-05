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

/**
 * Interface representing a task object.
 * @interface Task
 * @property {string} [id] - The unique identifier of the task (optional).
 * @property {string} name - The name of the task.
 * @property {string} time - The time the task is scheduled for (HH:mm format).
 * @property {string} class_id - The ID of the class associated with the task.
 * @property {string} cookie - The authentication cookie for the task.
 * @property {object} location - The location details for the task.
 * @property {string} location.lat - Latitude.
 * @property {string} location.lng - Longitude.
 * @property {string} location.acc - Accuracy.
 * @property {boolean} enable - Whether the task is enabled.
 */
interface Task {
  id?: string;
  name: string;
  time: string;
  class_id: string;
  cookie: string;
  location: { lat: string; lng: string; acc: string };
  enable: boolean;
}

/**
 * Props for the TaskDialog component.
 * @interface TaskDialogProps
 * @property {boolean} open - Whether the dialog is currently open.
 * @property {() => void} onClose - Callback function to close the dialog.
 * @property {() => void} onSave - Callback function called when the task is saved.
 * @property {Task | null} task - The task object to edit, or null for creating a new task.
 */
interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  task: Task | null;
}

/**
 * A dialog component for creating or editing a task.
 * Includes fields for task details and integration with LoginDialog and LocationDialog.
 *
 * @param {TaskDialogProps} props - The component props.
 * @returns {JSX.Element} The rendered TaskDialog component.
 */
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

  /**
   * Effect to populate the form data when the dialog opens or the task prop changes.
   * If a task is provided, it populates the form with task data.
   * Otherwise, it resets the form to default values.
   */
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

  /**
   * Handles changes to top-level task fields.
   *
   * @param {keyof Task} field - The name of the field to update.
   * @param {any} value - The new value for the field.
   */
  const handleChange = (field: keyof Task, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  /**
   * Handles changes to location fields.
   *
   * @param {string} field - The name of the location field (e.g., 'lat', 'lng').
   * @param {string} value - The new value for the location field.
   */
  const handleLocationChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      location: { ...formData.location, [field]: value }
    });
  };

  /**
   * Saves the task to the backend.
   * Calls 'update_task' if editing an existing task, or 'add_task' for a new one.
   * Triggers the onSave callback upon completion.
   */
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
