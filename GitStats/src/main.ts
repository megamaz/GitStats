import { BrowserWindow, ipcMain } from 'electron';
import Ajv2020 from 'ajv/dist/2020';
import * as sqlite3 from 'sqlite3';
import { Octokit } from 'octokit';
import { Chart } from 'chart.js';
import * as fs from 'fs';
// my thanks to https://davembush.medium.com/typescript-and-electron-the-right-way-141c2e15e4e1 for the ts framework

const datajson_path = `${__dirname}/userdata.json`
let kit: undefined | Octokit = undefined;
let current_loaded = "none loaded";
let running_fetch_task = false;
let mainWindowPublic: BrowserWindow | undefined = undefined; // bad

// the fact that I need to do this is dumb.
interface Label {
    id: number;
    node_id: string;
    url: string;
    name: string;
    color: string;
    default: boolean;
    description: string;
}

// database setup
let db: undefined | sqlite3.Database = new sqlite3.Database("./.db",
    sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE,
    (err) => {
        console.error(err);
    });


function VerifySchema(object: Object, schema: Object): boolean {
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
    } catch (error) {
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

        // close the database
        db.close();
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

        mainWindowPublic = Main.mainWindow;
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

ipcMain.handle("login:TryLogin", async (event: Event, token: string) => { return await TryLoginUpdateToken(token) });

ipcMain.handle("gitstats:CheckRepoExists", (event: Event, repo: string) => {
    if (kit === undefined) {
        return;
    }

    var username = repo.split("/")[0];
    var reponame = repo.split("/")[1];
    return new Promise((resolve, reject) => {
        kit.rest.repos.get({
            owner: username,
            repo: reponame
        }).then((...args) => {
            resolve(true);
        }).catch((...args) => {
            resolve(false);
        });
    });
});

ipcMain.handle("gitstats:SaveRepo", (event: Event, repo: string) => {
    // returns true if saved, false if not.
    var data = <Userdata>JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    if (!data.savedrepos.includes(repo)) {
        // right now I'm preventing loading the same repo twice
        // it's possible in the future that for whatever reason someone will want to do this
        // this is a problem I will tackle when it shows up.
        data.savedrepos.push(repo);
        fs.writeFileSync(datajson_path, JSON.stringify(data));
        return true;
    }
    return false;
});

ipcMain.handle("gitstats:UpdateCurrentLoaded", (event: Event, loaded: string) => {
    current_loaded = loaded;
});

ipcMain.handle("gitstats:GetCurrentLoaded", (event: Event) => {
    return current_loaded;
});

ipcMain.handle("gitstats:GetSavedRepos", (event: Event) => {
    var data = <Userdata>JSON.parse(fs.readFileSync(datajson_path, "utf-8"));
    return data.savedrepos;
});

ipcMain.handle("gitstats:PopulateIssueTable", async (event: Event, repo: string) => {
    running_fetch_task = true;
    var owner = repo.split("/")[0];
    var name = repo.split("/")[1];
    mainWindowPublic.setTitle(`GitStats: 0%`);

    // recursively is the exact way I did it in the first version
    // PROS: ensures that we don't fetch the same page twice
    // CONS: looks terrible and unreadable
    // if someone can find a better way to do this, that would be really cool. 
    var pr_data_closed = await kit.rest.search.issuesAndPullRequests({
        q:`repo:${repo}+is:pr+state:closed`,
        per_page:1
    });
    var pr_data_opened = await kit.rest.search.issuesAndPullRequests({
        q:`repo:${repo}+is:pr+state:open`,
        per_page:1
    });
    var issue_data_closed = await kit.rest.search.issuesAndPullRequests({
        q:`repo:${repo}+is:issue+state:closed`,
        per_page:1
    });
    var issue_data_opened = await kit.rest.search.issuesAndPullRequests({
        q:`repo:${repo}+is:issue+state:open`,
        per_page:1
    });
    var total_issues = pr_data_closed.data.total_count + pr_data_opened.data.total_count + issue_data_closed.data.total_count + issue_data_opened.data.total_count;
    var total_loaded = 0;

    console.log(`Total issues + pr (open and closed): ${total_issues}`);
    await (async function GetAllIssues(page_to_check: number) {
        let data = await kit.rest.issues.listForRepo({
            owner: owner,
            repo: name,
            per_page: 100,
            page: page_to_check,
            since: "1970-01-01T00:00:00.000Z",
            state: "all",
            sort: "created",
            direction: "asc"
        });

        if (data.data.length != 0) {
            data.data.forEach(element => {
                // (_number INT, _type VARCHAR(5), _state BOOL, _labels TEXT, _assignee TEXT, _dateopen BIGINT, _dateclose BIGINT)
                var _number = element.number;
                var _type = element.pull_request === undefined ? "issue" : "pr";
                var _state = element.state == "open";
                var _labels = "";
                element.labels.forEach((label: Label) => {
                    _labels += `${label.name},`;
                });
                var _assignee = "";
                element.assignees.forEach(assignee => {
                    _assignee += `${assignee.name},`;
                });
                var _dateopen = Date.parse(element.created_at);
                var _dateclose = element.closed_at === null ? 0 : Date.parse(element.closed_at);

                db.run(`INSERT INTO '${repo}_issues' 
                (_number, _type, _state, _labels, _assignee, _dateopen, _dateclose)
                VALUES (${_number}, '${_type}', ${_state ? 1 : 0}, '${_labels}', '${_assignee}', ${_dateopen}, ${_dateclose})`);
            });
            total_loaded += data.data.length;
            mainWindowPublic.setProgressBar(total_loaded / total_issues);
            mainWindowPublic.setTitle(`GitStats: ${(total_loaded / total_issues)*100}%`);
            console.log(`${page_to_check} ${data.data.length}`); // I need to know that the program hasn't completely crashed.
            await GetAllIssues(page_to_check+1);
        }
        return;

    })(1).then(() => {
        running_fetch_task = false;
        console.log("Done filling table.");
    });
    mainWindowPublic.setTitle(`GitStats`);
    mainWindowPublic.setProgressBar(0);
    console.log("Fully done!");

    return; // this is required to mark it as done
});

ipcMain.handle("sql:Run", (event: Event, command: string, params) => {
    // once again, thank ChatGPT for this.
    // I was practically tearing my hair out trying to figure this out
    // I'm pretty new to all this TS / JS stuff, so I would never have figure this out
    return new Promise((resolve, reject) => {
        db.all(command, params, function (err, rows) {
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

ipcMain.handle("utilities:LoadURL", (event: Event, url: string) => {
    if(!running_fetch_task) {
        Main.mainWindow.loadURL(`${__dirname}/${url}`);
    }
});