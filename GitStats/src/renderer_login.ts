function TryLogin() {
    var token = <HTMLInputElement>document.getElementById("token-insert");
    
    window.login.tryLogin(token.value);  
}