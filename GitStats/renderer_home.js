
var was = document.getElementById("loginresult")

window.electron.on('loginsuccess', (...success) => {
    was.innerText = success[0].reason
})

window.electron.startup();