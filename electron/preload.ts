import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  setBackground: () => ipcRenderer.invoke('app:setBackground'),

  // Notifications
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('notification:show', { title, body }),

  // Tray
  setTrayTooltip: (tooltip: string) =>
    ipcRenderer.invoke('tray:setTooltip', tooltip),

  // Pomodoro events (from renderer to main)
  onPomodoroStart: (callback: () => void) => {
    ipcRenderer.on('pomodoro:start', callback);
    return () => ipcRenderer.removeListener('pomodoro:start', callback);
  },

  onPomodoroComplete: (callback: () => void) => {
    ipcRenderer.on('pomodoro:complete', callback);
    return () => ipcRenderer.removeListener('pomodoro:complete', callback);
  },

  onPomodoroBreak: (callback: () => void) => {
    ipcRenderer.on('pomodoro:break', callback);
    return () => ipcRenderer.removeListener('pomodoro:break', callback);
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      setBackground: () => Promise<void>;
      showNotification: (title: string, body: string) => Promise<void>;
      setTrayTooltip: (tooltip: string) => Promise<void>;
      onPomodoroStart: (callback: () => void) => () => void;
      onPomodoroComplete: (callback: () => void) => () => void;
      onPomodoroBreak: (callback: () => void) => () => void;
    };
  }
}