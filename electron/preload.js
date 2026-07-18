const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop",{
    getRuntimeVersions: () => ({
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node
    }),
    getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
    loadConversation: () => ipcRenderer.invoke("conversation:load"),
    saveConversation: (messages) => ipcRenderer.invoke("conversation:save", messages),
});
