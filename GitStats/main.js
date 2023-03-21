const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { Octokit } = require('octokit');
const { UserData } = require('./modules/');

const datafolder = process.env.APPDATA + '\\GitStats'
const datajson = `${datafolder}\\data.json`
let user = null;
let wind = undefined;

function createWindow () {
  createdatadir()
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    fullscreenable:false,
    resizable:false,
    webPreferences: {
      nodeIntegration:true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon:"./assets/gitstats.ico"
  })
  win.removeMenu();
  
  wind = win; // bad

  // ipcMain events
  ipcMain.on('onlogin', (event, token) => {
    createdatadir()
    var data = JSON.parse(datajson)
    data.usertoken = token;
    fs.writeFileSync(datajson, JSON.stringify(data))
    startup(win)
  })
  
  ipcMain.on("startup", (event) => {
    startup(win)
  })

  ipcMain.on("resetdata", (event) => {
    console.log("resetdata")
    fs.unlinkSync(datajson) // delete the existing data.json
    createdatadir() // recreate the data.json, now blank
  })

  ipcMain.on("updatedata", (event, newdata) => {
    fs.writeFileSync(datajson, JSON.stringify(newdata))
  })

  ipcMain.on("testtoken", (event, kit) => {
    testtoken(kit, win)
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      startup(wind).then(() => {
        createWindow()
      })
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// data
function startup(win) {
	var token;
  createdatadir()
  token = JSON.parse(datajson).usertoken
  var kit = new Octokit({
    auth: token
  })
  user = kit;
  testtoken(kit, win)
  return // shrug
}

function testtoken(kit, win) {
  kit.rest.repos.get({
    owner:"megamaz",
    repo:"megamaz"
  }).then((...data) => {
    win.webContents.send("loginsuccess", {
      success:true,
      reason:"Token successfully verified",
    })
  }).catch((...err) => {
    win.webContents.send("loginsuccess", {
      success:false,
      reason:"Token is invalid or expired, or no token was found.",
    })
  })
}


function createdatadir(){ 
  // usertoken is set to "no_token_set"
  // because an empty token actually works
  // but doesn't give you the availability
  // of managing issues.

  if(!fs.existsSync(datafolder)) {
		fs.mkdirSync(datafolder)
	}
	if(!fs.existsSync(datajson)) {
		fs.writeFileSync(datajson, JSON.stringify(UserData.default))
	}
}