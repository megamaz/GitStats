function addRepoToList() {
    // instead of doing this via PHP (which is what is recommended)
    // I'm going to simply fetch the contents of the input field
    // TODO use php

    var repo_input = <HTMLInputElement>document.getElementById("repo-input");
    var matches = repo_input.value.match("^(\\w|\\-)+\\/(\\w|\\-)+$");
    if(matches !== null) {
        // this means the input was valid
        // at this point we need to check if the actual repo is valid
        window.gitstats.checkRepoExists(repo_input.value);
        
    }
}