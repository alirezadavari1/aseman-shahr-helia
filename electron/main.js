const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { TrustedTime } = require("./timeSync");

const isDev = !app.isPackaged;

let mainWindow = null;
let trustedTime = null;

const DATA_FILE_NAME = "data.json";

function getDataFilePath() {
  return path.join(app.getPath("userData"), DATA_FILE_NAME);
}

/** خواندن فایل اصلی داده از دیسک (نه از localStorage) */
function readLocalData() {
  try {
    const raw = fs.readFileSync(getDataFilePath(), "utf-8");
    const parsed = JSON.parse(raw);
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
      notices: Array.isArray(parsed.notices) ? parsed.notices : [],
    };
  } catch (e) {
    return { customers: [], deposits: [], notices: [] };
  }
}

/** نوشتن فایل اصلی داده روی دیسک */
function writeLocalData(data) {
  try {
    fs.writeFileSync(getDataFilePath(), JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist-electron", "index.html"));
  }
}

app.whenReady().then(async () => {
  trustedTime = new TrustedTime(app.getPath("userData"));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/* ---------------- IPC: ذخیره‌سازی محلی اصلی روی دیسک ---------------- */
ipcMain.handle("data:load", () => {
  return readLocalData();
});

ipcMain.handle("data:save", (event, data) => {
  return writeLocalData(data);
});

/* ---------------- IPC: خروجی/ورودی JSON با پنجره‌ی انتخاب مسیر ویندوز (بک‌آپ چندجایی) ---------------- */
ipcMain.handle("data:export", async (event, data) => {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "ذخیره‌ی فایل پشتیبان",
    defaultPath: `aseman-shahr-helia-backup-${stamp}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  try {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), "utf-8");
    return { canceled: false, filePath: result.filePath };
  } catch (e) {
    return { canceled: false, error: String(e) };
  }
});

ipcMain.handle("data:import", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "انتخاب فایل پشتیبان",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"],
  });
  if (result.canceled || result.filePaths.length === 0) return { canceled: true };
  try {
    const raw = fs.readFileSync(result.filePaths[0], "utf-8");
    const parsed = JSON.parse(raw);
    return {
      canceled: false,
      data: {
        customers: Array.isArray(parsed.customers) ? parsed.customers : [],
        deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
        notices: Array.isArray(parsed.notices) ? parsed.notices : [],
      },
    };
  } catch (e) {
    return { canceled: false, error: String(e) };
  }
});

/* ---------------- IPC: زمان قابل اعتماد (آنلاین/آفلاین/ساعت خراب) ---------------- */
ipcMain.handle("time:getTrustedNow", async () => {
  const ms = await trustedTime.getTrustedNowMs();
  return ms;
});
