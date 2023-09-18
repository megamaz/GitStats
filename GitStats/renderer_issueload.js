var fs = window.electron.fs; // those are technically supposed to be const, but script reloading doesn't like that
var datafolder = window.electron.datafolder;
var shell = window.electron.shell;

var kit = window.electron.kit;
var repoinput = document.getElementById("repoinput");
var addbutton = document.getElementById("addbutton");

// slightly convoluted, but for some reason directly parsing `data` doesn't work.
function getuserdata(){
    var data = fs.readFileSync(datafolder + "\\data.json")
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

//#region onload
var form = document.getElementById("loadedrepos")
var resetto = form.innerHTML;

resetform = () => {form.innerHTML = resetto}

function updatelist(withuserdata=null) {
    resetform()
    var userdata = undefined;
    if(withuserdata == null) {
        userdata = getuserdata()
    }
    else {
        userdata = withuserdata
    }

    userdata.loadedrepos.forEach(element => {
        var newitem = document.createElement("div")
        var newlink = document.createElement("a")
        newlink.innerHTML = `${element}<br>`
        newlink.setAttribute('onclick', `shell.openExternal("https://github.com/${element}")`)
        newlink.setAttribute("href", "#")
        
        var newbutton = document.createElement("input")
        newbutton.setAttribute('onclick', `removefromlist("${element}"); this.parentNode.parentNode.removeChild(this.parentNode)`)
        newbutton.setAttribute('value', 'Remove')
        newbutton.setAttribute('type', 'button')

        newitem.appendChild(newbutton)
        newitem.appendChild(newlink)

        form.appendChild(newitem)
    })
}
updatelist()

//#endregion

function removefromlist(element) {
    var userdata = getuserdata()
    // https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array-in-javascript
    // seriously, this is stupid
    let ind = userdata.loadedrepos.indexOf(element)
    userdata.loadedrepos.splice(ind, 1)
    window.electron.updateuserdata(userdata)
    console.log("list updated")
}

function addnewrepo() {
    var userdata = getuserdata()
    var repoinput = document.getElementById("repoinput")
    // check if the input is valid using... REGEX!
    var matches = repoinput.value.match("^(\\w|\\-)+\\/(\\w|\\-)+$")
    if(matches !== null) {
        // that means we good! I think
        if(!userdata.loadedrepos.includes(repoinput.value)) {
            // check if its a valid repo
            var reponame = repoinput.value.split("/");
            kit.rest.repos.get({
                owner:reponame[0],
                repo:reponame[1]
            }).then((...data) => {
                // in case of success
                userdata.loadedrepos.push(repoinput.value)
                window.electron.updateuserdata(userdata)
                console.log(`added new repo ${repoinput.value}`)
                updatelist(userdata)
            }).catch((...err) => {
                console.log(err);
                updatelist()
                console.log("inputted non-existing repo.")
                var urlwrong = document.createElement("p")
                urlwrong.innerText = "This repo does not exist, or your token is invalid."
                form.appendChild(urlwrong)
            })
        }
    }
    else {
        updatelist()
        console.log(`inputted format is wrong: ${matches}`)
        var urlwrong = document.createElement("p")
        urlwrong.innerText = "Your input is incorrectly formatted. Please read the message above the input line."
        form.appendChild(urlwrong)
    }
}