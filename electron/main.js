const {app, BrowserWindow, ipcMain } = require('electron');
const path = require("node:path");

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
    ipcMain.handle("app:getVersion", () => {
        return app.getVersion();
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
