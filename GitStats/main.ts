const { app, BrowserWindow, ipcMain} = require('electron')
const path = require('path');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreenable:false,
    resizable:false,
    webPreferences: {
      nodeIntegration:true,
      preload: path.join(__dirname, 'preload.ts')
    },
    icon:"./assets/gitstats.ico"
  })
  

  win.loadFile('./pages/index.html')
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})