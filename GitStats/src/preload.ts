const { contextBridge, ipcRenderer } = require('electron')
import * as fs from 'fs';

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
    GetCurrentLoaded: () => {return ipcRenderer.invoke("gitstats:GetCurrentLoaded");}
});

contextBridge.exposeInMainWorld('sql', {
    Run: (command:string) => {return ipcRenderer.invoke("sql:Run");}
});

contextBridge.exposeInMainWorld('utilities', {
    LoadURL: (url: string) => {ipcRenderer.invoke("utilities:LoadURL", url);}
});