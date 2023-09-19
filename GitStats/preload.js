const { contextBridge, ipcRenderer, shell } = require('electron')
const fs = require('fs')
const { Octokit } = require('octokit')
const { Chart, registerables} = require('chart.js')
Chart.register(...registerables)

let kit = undefined;

// context bridger
contextBridge.exposeInMainWorld('electron', {
	onlogin: (token) => {ipcRenderer.send('onlogin', token), kit = new Octokit({auth: token})},
	startup: () => {ipcRenderer.send("startup")},
	resetdata: () => {ipcRenderer.send("resetdata")},
	updateuserdata: (newdata) => {ipcRenderer.send("updatedata", newdata)},
    getuserdata: () => getuserdata(),
    makeChart: (ctx, data) => {
        var ch = new Chart(ctx, data)
        ch.resize(undefined, 500)
    },

	// lazy fix
	send: (channel, ...data) => ipcRenderer.send(channel, ...data),
	on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),

	// shared variables (scuffed)
	shell:shell,
	fs: fs,
	datafolder: process.env.APPDATA + "\\GitStats",
	kit: new Octokit({auth: getuserdata().usertoken}),
})

function getuserdata(){
	var datafolder = process.env.APPDATA + "\\GitStats"
    if(!fs.existsSync(datafolder)) {
        return undefined
    }

    var data = fs.readFileSync(datafolder + "\\data.json")
    // FIXME this is terrible.
    while(data.length == 0) {
        // crappy fix
        data = fs.readFileSync(datafolder + "\\data.json")
    }
    var data_string = ""
    data.forEach((v) => {
        data_string += String.fromCharCode(v)
    })
    try {
        userdata = JSON.parse(data_string)
    } catch(e) {
        console.error(`ERROR while parsing: ${e} with data_string="${data_string}" and data=${data}`)
    }
    // console.log(userdata)
    return userdata
}