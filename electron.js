import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { ipcMain } from "electron";

ipcMain.on("close-app", () => app.quit());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

function createWindow() {
const win = new BrowserWindow({
  autoHideMenuBar: true, 
  
  icon: path.join(__dirname, "icon.png"), // 👈 ADD THIS
  webPreferences: {
     preload: path.join(__dirname, "preload.js"), // 👈 add this
    devTools: isDev,
  },
});
  win.maximize();
  // Disable right-click
  win.webContents.on("context-menu", (e) => {
    e.preventDefault();
  });

  // Disable dev shortcuts
  win.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F12" ||
      (input.control && input.shift && input.key.toLowerCase() === "i")
    ) {
      event.preventDefault();
    }
  });

 win.loadFile(path.resolve(__dirname, "dist", "index.html"));
}

app.whenReady().then(createWindow);