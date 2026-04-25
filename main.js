const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let serverProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  win.loadFile("renderer/login.html");
}

app.whenReady().then(() => {
  // تشغيل السيرفر
  serverProcess = spawn("node", ["src/server.js"], {
    shell: true,
  });

  createWindow();
});

app.on("will-quit", () => {
  if (serverProcess) serverProcess.kill();
});