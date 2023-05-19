const path = require('path');
const fs = require('fs');
const moment = require('moment');
const MainUtils = require('./utils/MainUtils.js');
const {app, BrowserView, BrowserWindow, ipcMain, dialog} = require('electron');

let nextMusicId = 0;
let musicList = [];
let appSettings;

const createWindow = () => {
    let isFirstLoaded = false;

    if (fs.existsSync('config.json')) {
        appSettings = MainUtils.loadConfig();
    } else {
        const defaultSettings = {
            downloadLocation: app.getPath('music'),
            startIndex: 1,
            attributeIndexation: 'beginning'
        }
        MainUtils.saveConfig(defaultSettings);
        appSettings = defaultSettings;
    }
    const mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: false
        },
        width: 1000,
        height: 620,
        minWidth: 1000,
        minHeight: 620,
        autoHideMenuBar: true,
        show: false,
        title: "Youtube Music Downloader"
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



    app_overlay.webContents.once('dom-ready', () => {
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

    youtube_player_view.webContents.once('dom-ready', () => {
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

    youtube_player_view.webContents.on('did-finish-load', () => {
        youtube_player_view.webContents.executeJavaScript(`
      setInterval(() => {
        const playerAds = document.getElementsByClassName('video-ads');
        const overlayAds = document.getElementsByClassName('ytp-ad-overlay-slot');
        
        if (playerAds.length > 0) {
          playerAds[0].style.display = 'none';
        }
        
        if (overlayAds.length > 0) {
          overlayAds[0].style.display = 'none';
        }
      }, 100);
    `);
    });

    ipcMain.on('add-music-playlist', (event, music) => {
        const decodeMusic = JSON.parse(Buffer.from(music, 'base64').toString('utf-8'));
        console.log(decodeMusic);
        musicList.unshift({
            id: nextMusicId,
            musicData: decodeMusic
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

    ipcMain.on('download-request', async () => {
        if (musicList.length > 0) {
            const parentBounds = mainWindow.getBounds();
            const parentCenterX = parentBounds.x + (parentBounds.width / 2);
            const parentCenterY = parentBounds.y + (parentBounds.height / 2);
            let settingWindow = new BrowserWindow({
                parent: mainWindow,
                modal: true,
                width: 500,
                height: 222,
                x: parentCenterX - 250,
                y: parentCenterY - 111,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: true,
                    preload: path.join(__dirname, "./scripts/Settings.js")
                },
                autoHideMenuBar: true,
                resizable: false,
                minimizable: false,
                frame: false
            });
            settingWindow.loadFile(path.join(__dirname, 'settings.html'));
            mainWindow.setEnabled(false);
            settingWindow.on('close', () => {
                mainWindow.setEnabled(true);
            });

            ipcMain.once('window-closed', async (event, settings) => {
                settingWindow.close();
                if(settings.result) {
                    appSettings = settings.settings;
                    MainUtils.saveConfig(settings.settings);
                    settingWindow.close();
                    app_overlay.webContents.send('starting-downloading');
                    app_overlay.webContents.send('update-list', musicList);
                    youtube_player_view.webContents.send('starting-downloading');
                    const currentDate = moment().format('DDMMYYYY');
                    const folderPath = path.join(appSettings.downloadLocation, currentDate);
                    let downloadCanceled = false;
                    ipcMain.once('cancel-download-request', async () => {
                        downloadCanceled = true;
                    });
                    if (!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath);
                    }
                    let shuffleIndex = [];
                    let criticalError = false;
                    const startIndex = appSettings.startIndex;
                    appSettings.startIndex += musicList.length;
                    MainUtils.saveConfig(appSettings);
                    if(appSettings.attributeIndexation === 'random'){
                        shuffleIndex = MainUtils.shuffleArray(0, musicList.length);
                    }
                    for (let i = 0; i < musicList.length; i++) {
                        const music = musicList[i];
                        let tentatives = 0;
                        let downloaded = false;
                        let index;
                        if(appSettings.attributeIndexation === 'beginning'){
                            index = i + startIndex
                        }else if(appSettings.attributeIndexation === 'end'){
                            index = musicList.length - 1 - i + startIndex;
                        }else if(appSettings.attributeIndexation === 'random'){
                            index = shuffleIndex[i] + startIndex;
                        }
                        while (tentatives < 5 && !downloaded){
                            if(downloadCanceled){
                                app_overlay.webContents.send('finished-downloading');
                                app_overlay.webContents.send('update-list', musicList);
                                youtube_player_view.webContents.send('finished-downloading');
                                return;
                            }
                            await MainUtils.downloadMusic(music.musicData.link, path.join(folderPath, `${index} ${music.musicData.title}-${music.musicData.artist}.mp3`)).then(() => {
                                app_overlay.webContents.send('download-progression', {downloaded: i + 1, total: musicList.length, element: i + 1});
                                downloaded = true;
                            }).catch((error) => {
                                if(error.includes('This video is not available')){
                                    dialog.showErrorBox('Unavailable video', 'Video not available. Skipping...');
                                    tentatives = 5;
                                    return;
                                }
                                tentatives++;
                                if(tentatives === 5){
                                    dialog.showErrorBox('Error', 'An error occurred while downloading the music. Please try again later.');
                                    app_overlay.webContents.send('finished-downloading');
                                    app_overlay.webContents.send('update-list', musicList);
                                    youtube_player_view.webContents.send('finished-downloading');
                                    criticalError = true;
                                }
                            });
                            if(criticalError) return;
                        }
                    }
                    app_overlay.webContents.send('finished-downloading');
                    app_overlay.webContents.send('update-list', musicList);
                    youtube_player_view.webContents.send('finished-downloading');
                }
            });
        }
    })

    app.on('window-all-closed', () => {
        app.quit();
    });

    ipcMain.handle('get-settings', () => {
        return appSettings;
    });

    ipcMain.handle('open-directory-dialog', async () => {
        return await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
    });

    const devtools = new BrowserWindow();
    youtube_player_view.webContents.setDevToolsWebContents(devtools.webContents);
    youtube_player_view.webContents.openDevTools({mode: 'detach'});
}

app.whenReady().then(() => {
    createWindow();
});