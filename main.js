const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        minWidth: 900,
        minHeight: 700,
        title: 'Lucca Café — POS',
        icon: path.join(__dirname, 'menu', 'icon.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false
        },
        autoHideMenuBar: true,
        show: false
    });

    mainWindow.loadFile(path.join(__dirname, 'menu', 'index.html'));
    mainWindow.once('ready-to-show', () => mainWindow.show());

    mainWindow.on('closed', () => { mainWindow = null; });

    // F11 or Ctrl+F for fullscreen toggle
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' || (input.control && input.key === 'f')) {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            event.preventDefault();
        }
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC: get app path
ipcMain.handle('get-app-path', () => app.getAppPath());

// IPC: get file URL
ipcMain.handle('get-file-url', (event, relativePath) => {
    return path.join(__dirname, relativePath);
});

// IPC: check if file exists
ipcMain.handle('file-exists', (event, filePath) => {
    try { return fs.existsSync(filePath); } catch(e) { return false; }
});

// IPC: print thermal receipt (silent print)
ipcMain.on('print-thermal', (event, htmlContent) => {
    const printWin = new BrowserWindow({
        width: 300, height: 600, show: false,
        webPreferences: { contextIsolation: true, nodeIntegration: false }
    });
    printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
    printWin.webContents.on('did-finish-load', () => {
        printWin.webContents.print({
            silent: true,
            printBackground: true,
            margins: { marginType: 'none' },
            pageSize: { width: 80000, height: 600000 } // 80mm x auto
        }, (success) => {
            printWin.close();
        });
    });
});
