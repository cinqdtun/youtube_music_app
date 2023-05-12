const path = require('path');
const fs = require('fs');
const moment = require('moment');
const {app, BrowserView, BrowserWindow, session, ipcMain, dialog} = require('electron');

let nextMusicId = 0;
let musicList = [];
const createWindow = () => {
    let isFirstLoaded = false;
    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false
        },
        width: 1000,
        height: 620,
        minWidth: 1000,
        minHeight: 620,
        autoHideMenuBar: true,
        show: false
    })

    const app_overlay = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, "./scripts/AppOverlayScript.js")
        }
    });
    mainWindow.addBrowserView(app_overlay);
    app_overlay.webContents.loadFile(path.join(__dirname, 'index.html'));

    const youtube_player_view = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, "./scripts/InjectButton.js")
        }
    })
    mainWindow.addBrowserView(youtube_player_view);
    youtube_player_view.webContents.loadURL("https://music.youtube.com");

    const devtools = new BrowserWindow();
    app_overlay.webContents.setDevToolsWebContents(devtools.webContents);
    app_overlay.webContents.openDevTools({mode: 'detach'});

    app_overlay.webContents.on('dom-ready', () => {
        setTimeout(() => {
            app_overlay.setBounds({x: 0, y: 0, width: 350, height: 581});
            app_overlay.setAutoResize({width: false, height: true});
            if(isFirstLoaded){
                mainWindow.show();
            }else{
                isFirstLoaded = true;
            }
        }, 100)
    });

    youtube_player_view.webContents.on('dom-ready', () => {
        setTimeout(() => {
            youtube_player_view.setBounds({x: 350, y: 0, width: 650, height: 581});
            youtube_player_view.setAutoResize({width: true, height: true});
            if(isFirstLoaded){
                mainWindow.show();
            }else{
                isFirstLoaded = true;
            }
        }, 100)
    });

    ipcMain.on('add-music-playlist', (event, music) => {
        musicList.unshift({
            id: nextMusicId,
            musicData: music
        });
        nextMusicId++;
        youtube_player_view.webContents.send('update-link-list', musicList);
        app_overlay.webContents.send('update-list', musicList)
    });

    ipcMain.on('delete-music', (event, musicId) => {
        for(let i = 0; i < musicList.length; i++){
            if(musicList[i].id === musicId){
                musicList.splice(i, 1);
                youtube_player_view.webContents.send('update-link-list', musicList);
                app_overlay.webContents.send('update-list', musicList)
                break;
            }
        }
    });

    ipcMain.on('download-request', async (event) => {
        if (musicList.length > 0) {
            event.preventDefault();
            const currentDate = moment().format('DDMMYYYY');
            const folderPath = path.join(app.getPath('music'), currentDate);
        }
    })

    app.on('window-all-closed', () => {
        app.quit();
    });

}

app.whenReady().then(() => {
    createWindow();
});