
let current_repo;

// things to do immediatly on load
async function OnStart() {
    current_repo = await window.gitstats.GetCurrentLoaded();
    var header = document.getElementById("repoheader");
    header.innerText = `${current_repo}`;

    // check if table already exists
    // pull requests fall under issues
    window.sql.Run(`CREATE TABLE '${current_repo}_issues' (_number INT, _type VARCHAR(5), _state BOOL, _labels TINYTEXT, _assignee TEXT, _dateopen BIGINT, _dateclose BIGINT)`, {}).then((...args) => {
        FetchAllIssues();
    }).catch((err) => {
        // most likely solution is table already exists, so we're gonna log a warning
        console.warn(`Table '${current_repo}_issues' not created: ${err}`);
    });
}
window.addEventListener('DOMContentLoaded', () => {
    OnStart();
})

async function FetchAllIssues() {
    // clear the table before re-filling it.
    await window.sql.Run(`DELETE FROM '${current_repo}_issues'`, {});

    var p = document.createElement("p");
    var stats_form = <HTMLFormElement>document.getElementById("stats");
    stats_form.disabled = true;
    p.id = "loading-text";
    p.innerText = "Populating issue table, please do not close the app...";
    document.body.appendChild(p);
    await window.gitstats.PopulateIssueTable(current_repo);
    stats_form.disabled = false;
    document.body.removeChild(p);
}