function TryLogin() {
    var token = <HTMLInputElement>document.getElementById("token-insert");
    
    window.login.tryLogin(token.value).then((login_success: boolean) => {
        var newtext = document.createElement("p");
        if(login_success) {
            newtext.innerText = "Success logging in."
        }
        else {
            newtext.innerText = "Failed to log in. Token may be invalid or expired.";
        }
        document.body.appendChild(
            newtext
        );
    });  
}