import { BrowserWindow, ipcMain } from 'electron';
import { Octokit } from 'octokit';
import path = require('path');
import * as fs from 'fs';

// my thanks to https://davembush.medium.com/typescript-and-electron-the-right-way-141c2e15e4e1 for the ts framework

let datajson_path = `${__dirname}/data.json`
let kit: undefined | Octokit     = undefined;

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

async function TryLogin() {
    var data: Userdata = JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    var token = data.usertoken;

    kit = new Octokit({
        auth: token
    });

    // thank ChatGPT for the better check
    try {
        var validation = await kit.request("GET /user", {
            headers: {
                authorization: `token ${token}`
            }
        });
        return true;
    } catch(error) {
        return false;
    }
}

async function TryLoginUpdateToken(token: string) {
    // update the token
    var data: Userdata = JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    data.usertoken = token;
    fs.writeFileSync(datajson_path, JSON.stringify(data));

    return await TryLogin();
}

class Userdata {
    usertoken: string;
    savedrepos: string[];

    static default = {
        usertoken: "no_token_set",
        savedrepos: []
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
            .loadURL(`${__dirname}/page_index.html`);
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
                fs.writeFileSync(datajson_path, JSON.stringify(newdata));
            }
        }
    }

    static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
        // we pass the Electron.App object and the  
        // Electron.BrowserWindow into this function 
        // so this class has no dependencies. This 
        // makes the code easier to write tests for
        
        TryLogin();
        
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    }
}

// handles

ipcMain.handle("login:TryLogin", async (event: Event, token: string) => {return await TryLoginUpdateToken(token)});

ipcMain.handle("gitstats:CheckRepoExists", (event: Event, repo: string) => {
    if(kit === undefined) {
        return;
    }
    
    var username = repo.split("/")[0];
    var reponame = repo.split("/")[1];

    kit.rest.repos.get({
        owner: username,
        repo: reponame
    }).then((...args) => {
        return true;
    }).catch((...args) => {
        return false;
    })
});

ipcMain.handle("gitstats:SaveRepo", (event: Event, repo: string) => {
    var data = <Userdata>JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    if(!data.savedrepos.includes(repo)) {
        // right now I'm preventing loading the same repo twice
        // it's possible in the future that for whatever reason someone will want to do this
        // this is a problem I will tackle when it shows up.
        data.savedrepos.push(repo);
        fs.writeFileSync(datajson_path, JSON.stringify(data));
    }
});