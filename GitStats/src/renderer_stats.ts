// things to do immediatly on load
async function OnStart() {
    let current_repo = await window.gitstats.GetCurrentLoaded();
    var header = document.getElementById("repoheader");
    header.innerText = `${current_repo}`;
}
window.addEventListener('DOMContentLoaded', () => {
    OnStart();
})