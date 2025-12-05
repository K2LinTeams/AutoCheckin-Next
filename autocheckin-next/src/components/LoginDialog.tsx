import React, { useState, useEffect } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Typography, Box
} from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (cookie: string, classId: string) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [checkUrl, setCheckUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (open) {
      loadQrCode();
    } else {
      setQrCode(null);
      setCheckUrl(null);
      setStatus("");
    }
  }, [open]);

  useEffect(() => {
    let interval: number;
    if (checkUrl) {
      interval = setInterval(async () => {
        try {
          const result: [string, string] | null = await invoke("check_login_status", { url: checkUrl });
          if (result) {
            clearInterval(interval);
            onSuccess(result[0], result[1]);
            onClose();
          }
        } catch (e) {
          console.error("Check login failed", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [checkUrl, onClose, onSuccess]);

  const loadQrCode = async () => {
    setLoading(true);
    try {
      const [base64, url] = await invoke<[string, string]>("get_login_qr");
      setQrCode(`data:image/png;base64,${base64}`);
      setCheckUrl(url);
      setStatus(t("Scan the QR code to login"));
    } catch (e) {
      setStatus("Failed to load QR code");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("Login")}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" p={2}>
          {loading ? (
            <CircularProgress />
          ) : qrCode ? (
            <img src={qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
          ) : (
            <Typography color="error">Error loading QR</Typography>
          )}
          <Typography variant="body1" sx={{ mt: 2 }}>{status}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button onClick={loadQrCode}>{t("Refresh")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;
