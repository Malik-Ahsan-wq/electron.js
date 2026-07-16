const {app,BrowserWindow} = require("electron")

function createWindow(){
    const win = new BrowserWindow(
        {
            widht:300,
            height:300,
            webPreferences:{
                nodeIntegration:true
            }
        }
    )
    win.loadFile("index.html")
}

app.whenReady().then(createWindow)