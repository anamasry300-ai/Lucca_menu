const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    getFileUrl: (relativePath) => ipcRenderer.invoke('get-file-url', relativePath),
    fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
    printThermal: (htmlContent) => ipcRenderer.send('print-thermal', htmlContent),
    isElectron: true
});
