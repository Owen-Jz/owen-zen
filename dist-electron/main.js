"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_child_process = require("child_process");
var import_path = __toESM(require("path"));
var import_net = __toESM(require("net"));
var __filename = __filename || process.argv[1];
var __dirname = import_path.default.dirname(__filename);
var mainWindow = null;
var tray = null;
var isQuitting = false;
var nextServer = null;
var isDev = !import_electron.app.isPackaged;
function getDevPort() {
  const portArg = process.argv.find((arg) => arg.startsWith("--dev-port="));
  return portArg ? parseInt(portArg.split("=")[1], 10) : 3e3;
}
function getPreloadPath() {
  return import_path.default.join(__dirname, "preload.js");
}
function getIconPath() {
  if (import_electron.app.isPackaged) {
    return import_path.default.join(process.resourcesPath, "public/icon.png");
  }
  return import_path.default.join(__dirname, "../public/icon.png");
}
function waitForPort(port, timeout = 3e4) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      const client = new import_net.default.Socket();
      client.connect(port, "127.0.0.1", () => {
        client.destroy();
        clearInterval(interval);
        resolve();
      });
      client.on("error", () => {
        client.destroy();
        if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error(`Port ${port} did not become ready in time`));
        }
      });
    }, 500);
  });
}
function getAppPath() {
  if (import_electron.app.isPackaged) {
    return import_path.default.join(process.resourcesPath, "app");
  }
  return process.cwd();
}
async function startNextServer() {
  const appPath = getAppPath();
  console.log("[Electron] Starting Next.js server from:", appPath);
  return new Promise((resolve, reject) => {
    nextServer = (0, import_child_process.spawn)("node", ["node_modules/next/dist/bin/next", "start", "-p", "3000"], {
      cwd: appPath,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" }
    });
    let ready = false;
    nextServer.stdout?.on("data", (data) => {
      const output = data.toString();
      process.stdout.write("[Next.js] " + output);
      if (!ready && (output.includes("Ready") || output.includes("started server"))) {
        ready = true;
        resolve();
      }
    });
    nextServer.stderr?.on("data", (data) => {
      process.stderr.write("[Next.js ERR] " + data.toString());
    });
    nextServer.on("error", (err) => {
      console.error("[Electron] Failed to start Next.js server:", err);
      reject(err);
    });
    nextServer.on("close", (code) => {
      if (code !== 0 && !ready) {
        reject(new Error(`Next.js server exited with code ${code}`));
      }
    });
    setTimeout(() => {
      if (!ready) {
        waitForPort(3e3).then(resolve).catch(reject);
      }
    }, 3e3);
  });
}
function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: isDev ? true : false,
    // Show window in dev mode, hide in production
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: getIconPath()
  });
  mainWindow.loadURL(`http://localhost:${isDev ? getDevPort() : 3e3}`);
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.show();
    mainWindow?.focus();
    console.log("[Electron] Window shown");
  });
}
function createTray() {
  let iconPath = getIconPath();
  let icon;
  try {
    icon = import_electron.nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = import_electron.nativeImage.createEmpty();
    }
  } catch {
    icon = import_electron.nativeImage.createEmpty();
  }
  tray = new import_electron.Tray(icon.resize({ width: 16, height: 16 }));
  const contextMenu = import_electron.Menu.buildFromTemplate([
    {
      label: "Show Owen Zen",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: "Start Pomodoro",
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send("pomodoro:start");
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        import_electron.app.quit();
      }
    }
  ]);
  tray.setToolTip("Owen Zen");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}
function registerGlobalShortcut() {
  const success = import_electron.globalShortcut.register("CommandOrControl+Shift+O", () => {
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
    console.log("[Electron] Global shortcut registration failed");
  }
}
function registerAutoStart() {
  import_electron.app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
    // Start minimized to tray
  });
}
import_electron.ipcMain.handle("app:getVersion", () => import_electron.app.getVersion());
import_electron.ipcMain.handle("notification:show", (_, { title, body }) => {
  if (import_electron.Notification.isSupported()) {
    new import_electron.Notification({ title, body }).show();
  }
});
import_electron.ipcMain.handle("tray:setTooltip", (_, tooltip) => {
  tray?.setToolTip(tooltip);
});
import_electron.ipcMain.handle("app:setBackground", () => {
  mainWindow?.hide();
});
import_electron.app.whenReady().then(async () => {
  console.log("[Electron] App ready, starting Owen Zen...");
  if (!isDev) {
    try {
      await startNextServer();
      console.log("[Electron] Next.js server ready");
    } catch (err) {
      console.error("[Electron] Failed to start Next.js server:", err);
      return;
    }
  }
  createWindow();
  createTray();
  registerGlobalShortcut();
  registerAutoStart();
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
  }
});
import_electron.app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
import_electron.app.on("before-quit", () => {
  isQuitting = true;
});
import_electron.app.on("will-quit", () => {
  import_electron.globalShortcut.unregisterAll();
  if (nextServer) {
    nextServer.kill();
  }
});
