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

interface Task {
  id: string;
  name: string;
  time: string;
  class_id: string;
  cookie: string;
  location: { lat: string; lng: string; acc: string };
  enable: boolean;
}

const Tasks: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const config: any = await invoke("get_config");
      setTasks(config.tasks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = () => {
    setCurrentTask(null);
    setOpenDialog(true);
  };

  const handleEdit = (task: Task) => {
    setCurrentTask(task);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t("Are you sure?"))) {
        await invoke("delete_task", { taskId: id });
        loadTasks();
    }
  };

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
