import { useState } from "react";
import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { BottomNavigation, BottomNavigationAction, Paper, Box } from "@mui/material";
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useTranslation } from "react-i18next";
import "@fontsource/comfortaa";
import "@fontsource/zcool-kuaile";
import "./i18n";

import Tasks from "./components/Tasks";
import Settings from "./components/Settings";

const theme = createTheme({
  typography: {
    fontFamily: [
      'Comfortaa',
      'ZCOOL KuaiLe',
      'sans-serif',
    ].join(','),
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
    },
    secondary: {
      main: '#625B71',
    },
  },
});

function App() {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);

  const MapView = () => (
      <Box p={2}>
          <p>{t("Use the task editor to select locations.")}</p>
      </Box>
  );

  const renderContent = () => {
    switch (value) {
      case 0: return <Tasks />;
      case 1: return <MapView />;
      case 2: return <Settings />;
      default: return <Tasks />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ pb: 7, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
          {renderContent()}
        </Box>
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={value}
            onChange={(_, newValue) => {
              setValue(newValue);
            }}
          >
            <BottomNavigationAction label={t("Tasks")} icon={<ListAltIcon />} />
            <BottomNavigationAction label={t("Map")} icon={<MapIcon />} />
            <BottomNavigationAction label={t("Settings")} icon={<SettingsIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

export default App;
