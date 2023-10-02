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

    // TEMP this will eventually be replaced with better UI
    // https://stackoverflow.com/questions/2727167/how-do-you-get-a-list-of-the-names-of-all-files-present-in-a-directory-in-node-j
    var files = fs.readdirSync(".").forEach((file: string) => {
        if(file.endsWith(".html")) {
            var newelem = document.createElement("a");
            newelem.href = `./${file}`;
            newelem.innerText = file;
            document.body.appendChild(
                newelem
            );
            document.body.appendChild(document.createElement("br"));
        }
    });
})

contextBridge.exposeInMainWorld('login', {
    TryLogin: (token: string) => {return ipcRenderer.invoke("login:TryLogin", token);}
})

contextBridge.exposeInMainWorld('gitstats', {
    CheckRepoExists: (repo:string) => {return ipcRenderer.invoke("gitstats:CheckRepoExists", repo);},
    SaveRepo: (repo: string) => {ipcRenderer.invoke("gitstats:SaveRepo", repo);}
})