var loginbutton = document.getElementById("loginbutton")
var tokeninsert = document.getElementById("gittoken")

function resetuserdata() {
    window.electron.resetdata()
}

function showtoken() {
    if(tokeninsert.type === "password"){
        tokeninsert.type = "text";
    }
    else {
        tokeninsert.type = "password";
    }
}

loginbutton.addEventListener("click", () => {
    window.electron.onlogin(tokeninsert.value)
})