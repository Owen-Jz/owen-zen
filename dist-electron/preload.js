"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // App info
  getVersion: () => import_electron.ipcRenderer.invoke("app:getVersion"),
  setBackground: () => import_electron.ipcRenderer.invoke("app:setBackground"),
  // Notifications
  showNotification: (title, body) => import_electron.ipcRenderer.invoke("notification:show", { title, body }),
  // Tray
  setTrayTooltip: (tooltip) => import_electron.ipcRenderer.invoke("tray:setTooltip", tooltip),
  // Pomodoro events (from renderer to main)
  onPomodoroStart: (callback) => {
    import_electron.ipcRenderer.on("pomodoro:start", callback);
    return () => import_electron.ipcRenderer.removeListener("pomodoro:start", callback);
  },
  onPomodoroComplete: (callback) => {
    import_electron.ipcRenderer.on("pomodoro:complete", callback);
    return () => import_electron.ipcRenderer.removeListener("pomodoro:complete", callback);
  },
  onPomodoroBreak: (callback) => {
    import_electron.ipcRenderer.on("pomodoro:break", callback);
    return () => import_electron.ipcRenderer.removeListener("pomodoro:break", callback);
  }
});
