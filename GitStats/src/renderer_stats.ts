// things to do immediatly on load
async function OnStart() {
    let current_repo = await window.gitstats.GetCurrentLoaded();
    var header = document.getElementById("repoheader");
    header.innerText = `${current_repo}`;

    // check if table already exists
    // pull requests fall under issues
    window.sql.Run(`CREATE TABLE '${current_repo}_issues' (_number INT, _type VARCHAR(5), _state BOOL, _labels TINYTEXT, _assignee TEXT, _dateopen BIGINT, _dateclose BIGINT)`, {}).then((...args) => {
        var p = document.createElement("p");
        p.innerText = "Populating issue table, please do not close the app..."
        document.body.appendChild(p);
        window.gitstats.PopulateIssueTable(current_repo);
    }).catch((err) => {
        // most likely solution is table already exists, so we're gonna log a warning
        console.warn(`Table ${current_repo} not created: ${err}`);
    });
}
window.addEventListener('DOMContentLoaded', () => {
    OnStart();
})