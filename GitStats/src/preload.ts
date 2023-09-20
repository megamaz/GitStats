const { contextBridge, ipcRenderer } = require('electron')
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
    var globalcss = document.createElement("link")
    globalcss.href = "../styles/global.css"
    globalcss.rel = "stylesheet"
    document.head.appendChild(globalcss)
})