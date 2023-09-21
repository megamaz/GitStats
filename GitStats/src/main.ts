import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import path = require('path');
import { json } from 'stream/consumers';


// my thanks to https://davembush.medium.com/typescript-and-electron-the-right-way-141c2e15e4e1 for the ts framework

let datajson_path = "./data.json"

function checkJsonFormats(check: Object, latest: Object): boolean {
    // this will check if "check"'s format matches that of "latest"
    // TODO this function needs more thorough testing
    for (let prop in latest) {
        if (!(check.hasOwnProperty(prop) && latest.hasOwnProperty(prop))) {
            return false;
        }
        else {
            if (typeof check[prop] == 'object' && typeof latest[prop] == 'object') {
                var result = checkJsonFormats(check[prop], latest[prop]);
                // this looks a tad weird, but I don't want to return if the result is true.
                if (!result) {
                    return false;
                }
            }
        }
    }
    return true;
}

class Userdata {
    usertoken: string;

    static default = {
        "usertoken": "no_token_set"
    }
}

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
            icon: `${__dirname}/assets/gitstats.ico`
        }
        );
        Main.mainWindow
            .loadURL(`${__dirname}/pages/index.html`);
        Main.mainWindow.on('closed', Main.onClose);
    }

    static dataSetup() {
        // this function serves to setup the data.json

        // create the data.json if it doesn't exist
        if (!fs.existsSync(datajson_path)) {
            fs.writeFileSync(datajson_path, JSON.stringify(Userdata.default));
        }

        else {
            // check if the data.json format matches the Userdata format
            var current_data: Object = JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
            var result = checkJsonFormats(current_data, Userdata.default);
            if (!result) {
                // this means that the data format was changed
                // most likely from build update
                // we need to save the existing data, instead of completely overwriting with a new one.
                // FIXME if the property is an Object, and the object has changed format, this will not update the property to the new format. This will def lead to issues down the line.
                var newdata = {}
                for (let prop in Userdata.default) {
                    if (current_data.hasOwnProperty(prop)) {
                        newdata[prop] = current_data[prop];
                    }
                    else {
                        newdata[prop] = Userdata.default[prop];
                    }
                }
            }
            fs.writeFileSync(datajson_path, JSON.stringify(newdata));
        }
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