let container = document.getElementById("container");

// https://stackoverflow.com/questions/2592092/executing-script-elements-inserted-with-innerhtml
function setInnerHTML(elm, html) {
    elm.innerHTML = html;
    
    Array.from(elm.querySelectorAll("script"))
      .forEach( oldScriptEl => {
        const newScriptEl = document.createElement("script");
        
        Array.from(oldScriptEl.attributes).forEach( attr => {
          newScriptEl.setAttribute(attr.name, attr.value) 
        });
        
        const scriptText = document.createTextNode(oldScriptEl.innerHTML);
        newScriptEl.appendChild(scriptText);
        
        oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
    });
  }

async function setcontainerhtml(filename) {
    fetch(filename).then(response => response.text()).then(html => {setInnerHTML(container, html)})
}

//#region setup
let buttons = document.getElementsByClassName("button");
for(let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", () => {
        setcontainerhtml(buttons[i].getAttribute("load"))
    })
}

document.addEventListener("keydown", event => {
    if(event.code === "Escape") {
        setcontainerhtml("embed_home.html")
    }
})

//#endregion

//#region on-launch
setcontainerhtml("embed_home.html")
//#endregion

//#region utility functions

//#endregion