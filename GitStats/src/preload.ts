const { contextBridge, ipcRenderer, shell } = require('electron')
import { Chart, registerables } from 'chart.js';
import * as fs from 'fs';

Chart.register(...registerables);
/*
    contextBridge serves to expose an API inside of the renderers.
    The ipcRenderer serves to send information to the main. 

    Mistake I made in v1 was to try and run node inside the renderers- they aren't built to do that. They are
    built solely for the purpose of making the page interactive, hence their name. Effectively, I was trying
    to merge frontend and backend. This resulted in an amalgamation of half-contextbridge and half-selfsufficient.

    I'm not a big fan of having main handle everything, but if that's how ElectronJS projects work then I'll
    have to conform.
*/

window.addEventListener('DOMContentLoaded', () => {
    // load the global.css into the indexes
    // this should be done in the renderers, but if I end up having multiple renderers then having this at the start gets annoying
    var globalcss = document.createElement("link");
    globalcss.href = "./global.css";
    globalcss.rel = "stylesheet";
    document.head.appendChild(globalcss);

});

contextBridge.exposeInMainWorld('login', {
    TryLogin: (token: string) => {return ipcRenderer.invoke("login:TryLogin", token);}
});

contextBridge.exposeInMainWorld('gitstats', {
    CheckRepoExists: (repo:string) => {return ipcRenderer.invoke("gitstats:CheckRepoExists", repo);},
    SaveRepo: (repo: string) => {return ipcRenderer.invoke("gitstats:SaveRepo", repo);},
    UpdateCurrentLoaded: (loaded: string) => {return ipcRenderer.invoke("gitstats:UpdateCurrentLoaded", loaded);},
    GetSavedRepos: () => {return ipcRenderer.invoke("gitstats:GetSavedRepos")},
    GetCurrentLoaded: () => {return ipcRenderer.invoke("gitstats:GetCurrentLoaded");},
    PopulateIssueTable: (repo: string) => {return ipcRenderer.invoke("gitstats:PopulateIssueTable", repo)}
});

contextBridge.exposeInMainWorld('sql', {
    Run: (command:string, params) => {return ipcRenderer.invoke("sql:Run", command, params);}
});

contextBridge.exposeInMainWorld('utilities', {
    LoadURL: (url: string) => {ipcRenderer.invoke("utilities:LoadURL", url);},
    // this is the exact way I handled it in v1. I do NOT like this.
    // however, I also do not know of a better way to do this.
    CreateChart: (canvas, data) => {
        var ch = new Chart(canvas, data);
    },

    shell:shell
});