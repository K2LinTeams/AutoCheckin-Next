import React, { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Switch, Fab
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import TaskDialog from "./TaskDialog";

/**
 * Interface representing a task object.
 * @interface Task
 * @property {string} id - The unique identifier of the task.
 * @property {string} name - The name of the task.
 * @property {string} time - The scheduled time for the task.
 * @property {string} class_id - The class ID associated with the task.
 * @property {string} cookie - The authentication cookie for the task.
 * @property {object} location - The location details.
 * @property {string} location.lat - Latitude.
 * @property {string} location.lng - Longitude.
 * @property {string} location.acc - Accuracy.
 * @property {boolean} enable - Whether the task is enabled.
 */
interface Task {
  id: string;
  name: string;
  time: string;
  class_id: string;
  cookie: string;
  location: { lat: string; lng: string; acc: string };
  enable: boolean;
}

/**
 * The Tasks component displays a list of scheduled tasks.
 * Allows users to add, edit, delete, and toggle the status of tasks.
 *
 * @returns {JSX.Element} The rendered Tasks component.
 */
const Tasks: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  /**
   * Effect to load tasks from the backend when the component mounts.
   */
  useEffect(() => {
    loadTasks();
  }, []);

  /**
   * Fetches the list of tasks from the backend configuration.
   * Updates the state with the retrieved tasks.
   */
  const loadTasks = async () => {
    try {
      const config: any = await invoke("get_config");
      setTasks(config.tasks);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Opens the task dialog for creating a new task.
   */
  const handleAdd = () => {
    setCurrentTask(null);
    setOpenDialog(true);
  };

  /**
   * Opens the task dialog for editing an existing task.
   *
   * @param {Task} task - The task to be edited.
   */
  const handleEdit = (task: Task) => {
    setCurrentTask(task);
    setOpenDialog(true);
  };

  /**
   * Deletes a task after user confirmation.
   *
   * @param {string} id - The ID of the task to delete.
   */
  const handleDelete = async (id: string) => {
    if (confirm(t("Are you sure?"))) {
        await invoke("delete_task", { taskId: id });
        loadTasks();
    }
  };

  /**
   * Toggles the enabled state of a task.
   *
   * @param {Task} task - The task to toggle.
   */
  const handleToggle = async (task: Task) => {
      const updatedTask = { ...task, enable: !task.enable };
      await invoke("update_task", { task: updatedTask });
      loadTasks();
  };

  return (
    <div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("Name")}</TableCell>
              <TableCell>{t("Time")}</TableCell>
              <TableCell>{t("Class ID")}</TableCell>
              <TableCell>{t("Status")}</TableCell>
              <TableCell>{t("Actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>{task.name}</TableCell>
                <TableCell>{task.time}</TableCell>
                <TableCell>{task.class_id}</TableCell>
                <TableCell>
                  <Switch
                    checked={task.enable}
                    onChange={() => handleToggle(task)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(task)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(task.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab color="primary" sx={{ position: 'fixed', bottom: 80, right: 16 }} onClick={handleAdd}>
        <AddIcon />
      </Fab>

      <TaskDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSave={() => { setOpenDialog(false); loadTasks(); }}
        task={currentTask}
      />
    </div>
  );
};

export default Tasks;
