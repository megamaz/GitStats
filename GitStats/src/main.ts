import { BrowserWindow } from 'electron';


// my thanks to https://davembush.medium.com/typescript-and-electron-the-right-way-141c2e15e4e1

export default class Main {
  static mainWindow: Electron.BrowserWindow;
  static application: Electron.App;
  static BrowserWindow;
  private static onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      Main.application.quit();
    }
  }

  private static onClose() {
    // Dereference the window object. 
    Main.mainWindow = null;
  }

  private static onReady() {
    // TODO see if there's a way to have the preload ref be .ts instead of .js
    Main.mainWindow = new Main.BrowserWindow({
      width: 800,
      height: 600,
      fullscreenable: false,
      resizable: false,
      webPreferences: {
        nodeIntegration: true,
        preload: `${__dirname}/preload.js`
      },
      icon: `file://${__dirname}/assets/gitstats.ico`
    }
    );
    Main.mainWindow
      .loadURL(`file://${__dirname}/pages/index.html`);
    Main.mainWindow.on('closed', Main.onClose);
  }

  static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
    // we pass the Electron.App object and the  
    // Electron.BrowserWindow into this function 
    // so this class has no dependencies. This 
    // makes the code easier to write tests for 
    Main.BrowserWindow = browserWindow;
    Main.application = app;
    Main.application.on('window-all-closed', Main.onWindowAllClosed);
    Main.application.on('ready', Main.onReady);
  }
}