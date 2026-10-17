// preload.js
import { contextBridge, ipcRenderer } from "electron";

console.log("preload loaded"); // debug

contextBridge.exposeInMainWorld("electronAPI", {
  closeApp: () => ipcRenderer.send("close-app"),
});
