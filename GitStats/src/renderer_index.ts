// do right on load
var savedrepos = window.gitstats.GetSavedRepos();
savedrepos.then((val) => {
    val.forEach(element => {
       AddRepoToList(element); 
    });
})

function AddRepoToList(reponame: string) {
    var loadedlist = document.getElementById("loadedrepos");
    var newitem = document.createElement("li");
    newitem.innerHTML = `<a onclick="UpdateLoadedAndOpenStats('${reponame}');" href="#">${reponame}</a>`;
    loadedlist.appendChild(newitem);
}

async function SaveRepo() {
    // instead of doing this via PHP (which is what is recommended)
    // I'm going to simply fetch the contents of the input field
    // TODO use php

    var repo_input = <HTMLInputElement>document.getElementById("repo-input");
    var matches = repo_input.value.match("^(\\w|\\-)+\\/(\\w|\\-)+$");
    if(matches !== null) {
        // this means the input was valid
        // at this point we need to check if the actual repo is valid
        var is_valid = await window.gitstats.CheckRepoExists(repo_input.value);
        if(is_valid) {
            // save it to the list of loaded repos
            var result = await window.gitstats.SaveRepo(repo_input.value);
            if(result) {
                AddRepoToList(repo_input.value);
            } else { 
                var errtext = document.getElementById("errtext");
                errtext.innerText = "This repo is already on the list."
            }

        } else {
            // we don't really care why it's not valid, we just know it isn't
            // TODO let the user know why there's an error.
            var errtext = document.getElementById("errtext");
            errtext.innerText = `Repo "${repo_input.value}" doesn't exist, or token is invalid / expired.`;
        }
        
    }
}

async function UpdateLoadedAndOpenStats(loaded:string) {
    await window.gitstats.UpdateCurrentLoaded(loaded);
    window.utilities.LoadURL("page_stats.html");
}