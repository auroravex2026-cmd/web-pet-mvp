const {app, BrowserWindow, ipcMain } = require('electron');
const path = require("node:path");
const { loadConversation, saveConversation } = require("./storage/conversation-store");
const { openDatabase } = require("./storage/database");
const { createReminder, listActiveReminders } = require("./storage/reminder-store");

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.js")
        }
    });
    mainWindow.loadURL('http://localhost:3000');
}

app.whenReady().then( () => {
    const userDataPath = app.getPath("userData");
    const database = openDatabase(userDataPath);

    ipcMain.handle("app:getVersion", () => {
        return app.getVersion();
    });

    ipcMain.handle("conversation:load", async () => {
        return await loadConversation(userDataPath);
    });

    ipcMain.handle("conversation:save", async (_event, messages) => {
        if (!Array.isArray(messages)) {
            throw new Error("messages must be an array.");
        }

        await saveConversation(userDataPath, messages);

        return {
            saved: true
        };
    })

    ipcMain.handle("reminders:create", (_event, reminderInput) => {
        return createReminder(database, reminderInput);
    });

    ipcMain.handle("reminders:list-active", () => {
        return listActiveReminders(database);
    });

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow();
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
})
