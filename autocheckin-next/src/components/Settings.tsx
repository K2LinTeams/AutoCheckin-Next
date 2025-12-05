import React, { useState, useEffect } from "react";
import {
  Box, TextField, FormControlLabel, Switch, Typography, Button, Paper
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";

/**
 * The Settings component for configuring global application settings.
 * Currently allows configuring WeCom integration settings.
 *
 * @returns {JSX.Element} The rendered Settings component.
 */
const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<any>(null);

  /**
   * Effect to load the configuration from the backend when the component mounts.
   */
  useEffect(() => {
    loadConfig();
  }, []);

  /**
   * Fetches the current configuration from the backend.
   * Updates the state with the retrieved configuration.
   */
  const loadConfig = async () => {
    try {
      const c = await invoke("get_config");
      setConfig(c);
    } catch (e) {
      console.error(e);
    }
  };

  /**
   * Handles changes to WeCom settings fields.
   * Updates the local configuration state.
   *
   * @param {string} field - The name of the field being updated (e.g., 'corpid', 'secret').
   * @param {any} value - The new value for the field.
   */
  const handleWeComChange = (field: string, value: any) => {
      if (!config) return;
      setConfig({
          ...config,
          global: {
              ...config.global,
              wecom: {
                  ...config.global.wecom,
                  [field]: value
              }
          }
      });
  };

  /**
   * Saves the current configuration to the backend.
   * Displays an alert upon successful save.
   */
  const handleSave = async () => {
      await invoke("update_config", { newConfig: config });
      alert(t("Saved"));
  };

  if (!config) return <div>Loading...</div>;

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>{t("WeCom Settings")}</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={config.global.wecom.enable}
              onChange={(e) => handleWeComChange("enable", e.target.checked)}
            />
          }
          label={t("Enable")}
        />
        <TextField
          margin="normal"
          fullWidth
          label={t("CorpID")}
          value={config.global.wecom.corpid}
          onChange={(e) => handleWeComChange("corpid", e.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          label={t("Secret")}
          value={config.global.wecom.secret}
          onChange={(e) => handleWeComChange("secret", e.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          label={t("AgentID")}
          value={config.global.wecom.agentid}
          onChange={(e) => handleWeComChange("agentid", e.target.value)}
        />
        <TextField
          margin="normal"
          fullWidth
          label={t("ToUser")}
          value={config.global.wecom.touser}
          onChange={(e) => handleWeComChange("touser", e.target.value)}
        />
      </Paper>

      <Button variant="contained" onClick={handleSave}>{t("Save")}</Button>
    </Box>
  );
};

export default Settings;
