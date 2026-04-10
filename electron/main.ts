import { app, BrowserWindow, globalShortcut, ipcMain, Notification, Tray, Menu, nativeImage } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import net from 'net';

// Use process.cwd() for CJS compatibility
const __filename = __filename || process.argv[1];
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let nextServer: ChildProcess | null = null;

// Development or production
const isDev = !app.isPackaged;

// Parse --dev-port argument for development
function getDevPort(): number {
  const portArg = process.argv.find(arg => arg.startsWith('--dev-port='));
  return portArg ? parseInt(portArg.split('=')[1], 10) : 3000;
}

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

function getIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'public/icon.png');
  }
  return path.join(__dirname, '../public/icon.png');
}

// Wait for port 3000 to be ready
function waitForPort(port: number, timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const client = new net.Socket();
      client.connect(port, '127.0.0.1', () => {
        client.destroy();
        clearInterval(interval);
        resolve();
      });
      client.on('error', () => {
        client.destroy();
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error(`Port ${port} did not become ready in time`));
        }
      });
    }, 500);
  });
}

function getAppPath(): string {
  if (app.isPackaged) {
    // In packaged app, the app is in resources/app
    return path.join(process.resourcesPath, 'app');
  }
  return process.cwd();
}

async function startNextServer(): Promise<void> {
  const appPath = getAppPath();
  console.log('[Electron] Starting Next.js server from:', appPath);

  return new Promise((resolve, reject) => {
    nextServer = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], {
      cwd: appPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'production' },
    });

    let ready = false;

    nextServer.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      process.stdout.write('[Next.js] ' + output);
      if (!ready && (output.includes('Ready') || output.includes('started server'))) {
        ready = true;
        resolve();
      }
    });

    nextServer.stderr?.on('data', (data: Buffer) => {
      process.stderr.write('[Next.js ERR] ' + data.toString());
    });

    nextServer.on('error', (err) => {
      console.error('[Electron] Failed to start Next.js server:', err);
      reject(err);
    });

    nextServer.on('close', (code) => {
      if (code !== 0 && !ready) {
        reject(new Error(`Next.js server exited with code ${code}`));
      }
    });

    // Fallback: wait for port
    setTimeout(() => {
      if (!ready) {
        waitForPort(3000).then(resolve).catch(reject);
      }
    }, 3000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: isDev ? true : false, // Show window in dev mode, hide in production
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: getIconPath(),
  });

  // Load the app - same URL for dev and production
  mainWindow.loadURL(`http://localhost:${isDev ? getDevPort() : 3000}`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Minimize to tray on close (instead of quitting)
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Show window when ready to ensure it appears
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.show();
    mainWindow?.focus();
    console.log('[Electron] Window shown');
  });
}

function createTray() {
  // Use default icon or create empty icon
  let iconPath = getIconPath();
  let icon: nativeImage;

  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Owen Zen',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: 'Start Pomodoro',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('pomodoro:start');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    },
  ]);

  tray.setToolTip('Owen Zen');
  tray.setContextMenu(contextMenu);

  // Click to show window
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function registerGlobalShortcut() {
  // Ctrl+Shift+O to summon app
  const success = globalShortcut.register('CommandOrControl+Shift+O', () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  if (!success) {
    console.log('[Electron] Global shortcut registration failed');
  }
}

function registerAutoStart() {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true, // Start minimized to tray
  });
}

// IPC handlers
ipcMain.handle('app:getVersion', () => app.getVersion());

ipcMain.handle('notification:show', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

ipcMain.handle('tray:setTooltip', (_, tooltip: string) => {
  tray?.setToolTip(tooltip);
});

ipcMain.handle('app:setBackground', () => {
  mainWindow?.hide();
});

// App lifecycle
app.whenReady().then(async () => {
  console.log('[Electron] App ready, starting Owen Zen...');

  if (!isDev) {
    try {
      await startNextServer();
      console.log('[Electron] Next.js server ready');
    } catch (err) {
      console.error('[Electron] Failed to start Next.js server:', err);
      return;
    }
  }

  createWindow();
  createTray();
  registerGlobalShortcut();
  registerAutoStart();
});

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until explicit quit
  if (process.platform !== 'darwin') {
    // On Windows/Linux, keep running in tray
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (nextServer) {
    nextServer.kill();
  }
});
