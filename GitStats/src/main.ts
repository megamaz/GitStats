import { BrowserWindow, ipcMain } from 'electron';
import { Octokit } from 'octokit';
import path = require('path');
import * as fs from 'fs';
import Ajv2020 from 'ajv/dist/2020';

// my thanks to https://davembush.medium.com/typescript-and-electron-the-right-way-141c2e15e4e1 for the ts framework

let datajson_path = `${__dirname}/userdata.json`
let kit: undefined | Octokit = undefined;
let current_loaded = "none loaded";

function VerifySchema(object:Object, schema:Object): boolean {
    var ajv = new Ajv2020();
    var validate = ajv.compile(schema);
    var valid = validate(object);
    return valid;
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
            // check if the data.json format matches the Userdata schema
            var current_data: Object = JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
            var schema = JSON.parse(fs.readFileSync(`${__dirname}/userdata.schema.json`, 'utf-8'));
            var result = VerifySchema(current_data, schema);
            console.log(result);
            if (!result) {
                // json schema validation failed, the userdata.json needs to be updated to match the schema
                var ajv = new Ajv2020({
                    removeAdditional: true,
                    useDefaults: true,
                    coerceTypes: true
                });
                var validate = ajv.compile(schema);
                validate(current_data);
                fs.writeFileSync(datajson_path, JSON.stringify(current_data));
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
    // returns true if saved, false if not.
    var data = <Userdata>JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    if(!data.savedrepos.includes(repo)) {
        // right now I'm preventing loading the same repo twice
        // it's possible in the future that for whatever reason someone will want to do this
        // this is a problem I will tackle when it shows up.
        data.savedrepos.push(repo);
        fs.writeFileSync(datajson_path, JSON.stringify(data));
        return true;
    }
    return false;
});

ipcMain.handle("gitstats:UpdateCurrentLoaded", (event:Event, loaded: string) => {
    current_loaded = loaded;
})

ipcMain.handle("gitstats:GetCurrentLoaded", (event: Event) => {
    return current_loaded;
})

ipcMain.handle("gitstats:GetSavedRepos", (event: Event) => {
    var data = <Userdata>JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    return data.savedrepos;
})

ipcMain.handle("utilities:LoadURL", (event: Event, url:string) => {
    Main.mainWindow.loadURL(`${__dirname}/${url}`);
})