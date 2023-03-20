var fs = window.electron.fs; // those are technically supposed to be const, but script reloading doesn't like that
var datafolder = window.electron.datafolder;
var shell = window.electron.shell;
var kit = window.electron.kit;
// var { Chart } = window.electron.req('chart.js')

var repodropdown = document.getElementById("repodropdown")
var filters = document.getElementById("filters")
var form = document.getElementById("reposelector")
var datacontainer = document.getElementById("datacontainer")
var launchsearchbutt = document.getElementById("searchbutton") // i love abreviating "button" as "butt"
var selectedRepo = () => repodropdown.options[repodropdown.selectedIndex].value

/**
 * @type {UserData}
 */
var userdata = getuserdata()

function addoptions(withdefault=null) {
    userdata.loadedrepos.forEach(element => {
        var newoption = document.createElement("option")
        newoption.setAttribute("value", element)
        if(element === withdefault) {
            newoption.setAttribute("selected")
        }
        newoption.innerText = element
        repodropdown.appendChild(newoption)
    })
}
function resetform(wd=null) {
    form.innerHTML = resetto
    addoptions(wd)
}
addoptions()
var resetto = form.innerHTML;

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



function addGraphOfSelectedRepo() {
    datacontainer.innerHTML = ""
    userdata.graphs.forEach(element => {
        if(element.repo === selectedRepo()) {
            createDataGraphs(element)
        }
    })
}
addGraphOfSelectedRepo()

function removefromlist(element, array) {
    // https://stackoverflow.com/questions/5767325/how-can-i-remove-a-specific-item-from-an-array-in-javascript
    // seriously, this is stupid
    let ind = array.indexOf(element)
    array.splice(ind, 1)
    return array
}

function getData() {
    repodropdown.setAttribute("disabled", "")
    launchsearchbutt.setAttribute("disabled", "")
    var loading = document.createElement("p")
    loading.innerText = "Loading repo's issues..."
    loading.setAttribute('id', 'loading')
    form.appendChild(loading)
    
    var selected = selectedRepo()
    var ownerrepo = selected.split("/")
    console.log(datacontainer.childNodes)
    if(datacontainer.childNodes[0] !== undefined) {
        removeGraph(datacontainer.childNodes[0])
    }

    // issue (heh) here is that it can only return a max of
    // 100 issues per page. wtf? I need to do several calls
    // to get all the issues. annoying.
    // https://stackoverflow.com/questions/35066774/break-for-loop-inside-then-of-a-promise
    var allissues = [];
    var labeldata = {};
    (function getallissues(index) {
        loading.innerHTML = `Loading repo's issues... Found ${allissues.length} and looking.<br><i>This may take a while depending on the amount of issues.</i>`
        kit.rest.issues.listForRepo({
            owner:ownerrepo[0],
            repo:ownerrepo[1],
            per_page: 100,
            page:index,
            since:"1970-01-01T00:00:00.000Z", // why do i need to do this ffs
            state:"all",
            sort:"created",
            direction:"asc"
        }).then((data) => {
            // console.log(data)
            if(data.data.length != 0) {
                data.data.forEach(element => {
                    if(element.pull_request === undefined) {
                        allissues.push(element)
                        element.labels.forEach(label => {
                            if(element.closed_at === null) {
                                if(labeldata[label.name] === undefined) {
                                    labeldata[label.name] = [0, 0]
                                }
                                labeldata[label.name][0] += 1; // not sure if ++ works here, so this is to be safe
                            }
                            // labeldata[label.name][1] += 1;
                        })
                    }
                })
                getallissues(index+1)
            } else {
                loading.remove()
                createData(allissues, labeldata)
                launchsearchbutt.removeAttribute("disabled")
                repodropdown.removeAttribute("disabled")
            }
        }).catch((...err) => {
            loading.innerText = "An error occured."
            console.error("Oh no! An unexpected error has occured. It's probably a 429: " + err)
        })
    })(1);

}

/**
 * @param {Node} parent 
 */
function removeGraph(parent) {
    userdata.graphs.splice(parent.getAttribute("graphid"), 1)
    // reassigning IDs to prevent overlapping IDs
    // (removing a graph with ID=0 when the length is 2 wil make the next graph have ID=1, so there'll be two graphs with ID=1 which is... bad)
    // (although the name "ID" doesn't specifically say it, IDs are still generally accepted to be unique IDentifiers, though technically that's a UID.)
    for(var i = 0; i < userdata.graphs.length; i++) {
        userdata.graphs[i].id = i
    }
    parent.remove()
    window.electron.updateuserdata(userdata)
}

function createData(issues, labelinfo) {
    console.log(issues[0])
    console.log(labelinfo)
    var oldest = Date.parse(issues[0].created_at)
    var newest = Date.parse(issues[issues.length-1].created_at)
    console.log(`${issues.length} issues ranging from ${oldest} to ${newest}`)

    var stepsize = ((newest - oldest) / 100)
    var steps = []
    for(let i = oldest; i < newest; i+=stepsize)
        steps.push(i)
    console.log(steps.length)

    var labels = []
    var points = []

    var amount = 1
    var closes = []
    for(var i = 0; i < issues.length; i++) {
        var created_at = Date.parse(issues[i].created_at)
        var closed_at = Date.parse(issues[i].closed_at)
        if(!isNaN(closed_at)) {
            closes.push(closed_at)
        }
        var toremove = []
        for(var j = 0; j < closes.length; j++) {
            if(closes[j] < steps[0]) {
                amount--;
                toremove.push(closes[j])
            }
        }
        toremove.forEach(element => {
            closes = removefromlist(element, closes)
        })
        if(created_at > steps[0]) {
            var dateformat = new Date(steps[0]).toISOString().slice(0, 10)
            steps.shift()
            labels.push(dateformat)
            points.push(amount)
        }
        amount ++
    }
    
    userdata.graphs.push({
        type:0,
        url:"https://www.github.com/" + selectedRepo(),
        id:userdata.graphs.length,
        repo:selectedRepo(),
        data:{
            x:labels,
            y:points
        },
        labelData:labelinfo
    })
    window.electron.updateuserdata(userdata)

    createDataGraphs(userdata.graphs[userdata.graphs.length-1])
    
}
/**
 * @param {Graphs} fromgraph 
 */
function createDataGraphs(fromgraph) {
    var graphcontainer = document.createElement("div")
    var newcanvas = document.createElement("canvas")
    var toplabelcanvas = document.createElement("canvas")
    var removebutton = document.createElement("input")
    var seerepolink = document.createElement("a")
    graphcontainer.setAttribute("id", `graph${fromgraph.id}`)
    graphcontainer.setAttribute("graphid", fromgraph.id)
    newcanvas.setAttribute("id", `chart${fromgraph.id}`)
    toplabelcanvas.setAttribute("id", `labelchart${fromgraph.id}`)
    removebutton.setAttribute("type", "button")
    removebutton.setAttribute("value", "Remove Graph")
    removebutton.setAttribute("onclick", "removeGraph(this.parentNode);")
    seerepolink.setAttribute("onclick", `shell.openExternal("${fromgraph.url}")`)
    seerepolink.setAttribute("href", "#")
    seerepolink.innerText = "See Repo"
    graphcontainer.appendChild(removebutton)
    graphcontainer.appendChild(seerepolink)
    graphcontainer.appendChild(newcanvas)
    graphcontainer.appendChild(toplabelcanvas)
    datacontainer.appendChild(graphcontainer)
    
    
    var data = {
        type:"line",
        data: {
            labels: fromgraph.data.x,
            datasets: [
                {
                    label:"Issues Opened Over Time",
                    data:fromgraph.data.y,
                    tension:0.5
                }
            ]
        }
    }

    var labelcount = []
    Object.values(fromgraph.labelData).forEach(value => {
        labelcount.push(value[0])
    })
    var labeldatachart = {
        type:"bar",
        data: {
            labels: Object.keys(fromgraph.labelData),
            datasets: [
                {
                    label:"Amount of Labels",
                    data:labelcount,
                    tension:0.5
                }
            ]
        }
    }

    window.electron.makeChart(newcanvas, data)
    window.electron.makeChart(toplabelcanvas, labeldatachart)
}