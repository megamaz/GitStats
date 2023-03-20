var fs = window.electron.fs; // those are technically supposed to be const, but script reloading doesn't like that
var datafolder = window.electron.datafolder;
var shell = window.electron.shell;
var kit = window.electron.kit;

/**
 * @returns {UserData}
 */
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

/**
 * @type {UserData}
 */
var userdata = getuserdata()

var form = document.getElementById("form")
var formoptions = document.getElementById("options")
var title = document.getElementById("issuetitle")
var desc = document.getElementById("issuedesc")
var result = document.getElementById("successcontainer")

userdata.loadedrepos.forEach(repo => {
    var newoption = document.createElement("input")
    var newoplabel = document.createElement("label")
    newoption.setAttribute("type", "checkbox")
    newoption.setAttribute("id", repo)
    newoption.setAttribute("assoc", repo)
    newoplabel.setAttribute("for", repo)
    newoplabel.innerHTML = `${repo}<br>`
    formoptions.appendChild(newoption)
    formoptions.appendChild(newoplabel)
})

function submitissues() {
    result.innerHTML = ""
    formoptions.childNodes.forEach(element => {
        if(element.checked) {
            var ownerrepo = element.getAttribute("assoc").split("/")
            kit.rest.issues.create({
                owner:ownerrepo[0],
                repo:ownerrepo[1],
                title:title.value,
                body:desc.value
            }).then((...data) => {
                console.log(`success creating issue on ${ownerrepo[0]}/${ownerrepo[1]}`)
                var p = document.createElement("p")
                var a = document.createElement("a")
                p.setAttribute("style", "display:inline")
                a.setAttribute("href", "#")
                a.setAttribute("onclick", `shell.openExternal("${data[0].data.html_url}")`)
                a.innerHTML = `${ownerrepo[0]}/${ownerrepo[1]}<br>`
                p.innerText = `success creating issue on `
                result.appendChild(p)
                result.appendChild(a)
                console.log(data)
            })
        }
    })
}