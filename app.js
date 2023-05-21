const path = require('path');
const fs = require('fs');
const moment = require('moment');
const MainUtils = require('./utils/MainUtils.js');
const {app, BrowserView, BrowserWindow, ipcMain, dialog, Menu, MenuItem, globalShortcut} = require('electron');
const os = require('os');

let nextMusicId = 0;
let musicList = [];
let appSettings;
let filePath = null;
let isSaved = true;

const exePath = app.isPackaged ? path.dirname(process.execPath) : path.resolve(__dirname);

const createWindow = () => {
    let isFirstLoaded = false;

    if (fs.existsSync(path.join(exePath, 'config.json'))) {
        appSettings = MainUtils.loadConfig();
    } else {
        const defaultSettings = {
            downloadLocation: app.getPath('music'),
            startIndex: 1,
            attributeIndexation: 'beginning',
            isUnsavedWork: false
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
        frame: false,
        title: "Youtube Music Downloader"
    });

    const app_bar = new BrowserView({
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, "./scripts/AppBar.js")
        }
    });
    mainWindow.addBrowserView(app_bar);
    app_bar.webContents.loadFile(path.join(__dirname, 'app_bar.html'));

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

    function recoverData(){
        const recoverDialog = dialog.showMessageBoxSync(mainWindow, {
            type: 'warning',
            buttons: ['Yes', 'No'],
            title: 'Recover previous changes',
            message: "The application seems to have been closed unexpectedly. Do you want to recover the previous changes?",
            defaultId: 0
        });

        if (recoverDialog === 0) {
            musicList = musicList = JSON.parse(fs.readFileSync(path.join(exePath, 'temp_music_list.mlist')));
            isSaved = false;
            youtube_player_view.webContents.send('update-link-list', musicList);
            app_overlay.webContents.send('update-list', musicList);
            app_bar.webContents.send('unsaved-changes', false);
        }else{
            isSaved = true;
            appSettings.isUnsavedWork = false;
            MainUtils.saveConfig(appSettings);
        }
    }

    function processArgs(){
        for(let i = 0; i < process.argv.length; i++){
            if(process.argv[i] === '-o' && process.argv[i + 1] !== undefined){
                musicList = musicList = JSON.parse(fs.readFileSync(process.argv[i + 1]));
                filePath = process.argv[i + 1];
                youtube_player_view.webContents.send('update-link-list', musicList);
                app_overlay.webContents.send('update-list', musicList);
                app_bar.webContents.send('title-update', path.basename(filePath));
            }
        }
    }

    app_overlay.webContents.once('dom-ready', () => {
        setTimeout(() => {
            app_overlay.setBounds({x: 0, y: 40, width: 350, height: 580});
            app_overlay.setAutoResize({width: false, height: true});
            if(isFirstLoaded){
                mainWindow.show();
                processArgs();
                if(appSettings.isUnsavedWork) {
                    setTimeout(() => {
                        recoverData();
                    }, 2000);
                }
            }else{
                isFirstLoaded = true;
            }
        }, 100)
    });

    youtube_player_view.webContents.once('dom-ready', () => {
        setTimeout(() => {
            youtube_player_view.setBounds({x: 350, y: 40, width: 650, height: 580});
            youtube_player_view.setAutoResize({width: true, height: true});
            if(isFirstLoaded){
                mainWindow.show();
                processArgs();
                if(appSettings.isUnsavedWork) {
                    setTimeout(() => {
                        recoverData();
                    }, 2000);
                }
            }else{
                isFirstLoaded = true;
            }
        }, 100)
    });

    app_bar.webContents.once('dom-ready', () => {
        setTimeout(() => {
            app_bar.setBounds({x: 0, y: 0, width: 1000, height: 40});
            app_bar.setAutoResize({width: true, height: false});
        }, 100);
    });

    function saveAs(){
        const dialogResult = dialog.showSaveDialogSync(mainWindow, {
            title: "Save Music List",
            defaultPath: path.join(os.homedir(), 'documents') + '/untitled.mlist',
            filters: [
                {name: 'Music List', extensions: ['mlist']}
            ]
        });

        if(dialogResult){
            fs.writeFileSync(dialogResult, JSON.stringify(musicList, null, 2));
            app_bar.webContents.send('title-update', path.basename(dialogResult));
            filePath = dialogResult;
            isSaved = true;
            appSettings.isUnsavedWork = false;
            MainUtils.saveConfig(appSettings);
        }
    }

    function save(){
        if(filePath === null){
            saveAs();
        }else{
            fs.writeFileSync(filePath, JSON.stringify(musicList, null, 2));
            app_bar.webContents.send('unsaved-changes', false);
            isSaved = true;
            appSettings.isUnsavedWork = false;
            MainUtils.saveConfig(appSettings);
        }
    }

    function open(){
        const dialogResult = dialog.showOpenDialogSync(mainWindow, {
            title: "Open Music List",
            defaultPath: path.join(os.homedir(), 'documents'),
            filters: [
                {name: 'Music List', extensions: ['mlist']}
            ]
        });

        if(dialogResult){
            musicList = JSON.parse(fs.readFileSync(dialogResult[0]));
            youtube_player_view.webContents.send('update-link-list', musicList);
            app_overlay.webContents.send('update-list', musicList);
            app_bar.webContents.send('title-update', path.basename(dialogResult[0]));
            filePath = dialogResult[0];
            isSaved = true;
            appSettings.isUnsavedWork = false;
            MainUtils.saveConfig(appSettings);
        }
    }

    const fileMenu = new Menu();
    fileMenu.append(new MenuItem({ label: 'Open', accelerator:'CommandOrControl+O', click: open}));

    fileMenu.append(new MenuItem({ label: 'Save as', accelerator: 'CommandOrControl+Shift+S', click: saveAs}));

    fileMenu.append(new MenuItem({ label: 'Save', accelerator: 'CommandOrControl+S', click: save}));

    fileMenu.append(new MenuItem({ label: 'Settings', click: () => {
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
                }
            });
        }}));

    const developerMenu = new Menu();

    developerMenu.append(new MenuItem({ label: 'Toggle YI Developer Tools', click: () => {
            const devtools = new BrowserWindow();
            youtube_player_view.webContents.setDevToolsWebContents(devtools.webContents);
            youtube_player_view.webContents.openDevTools({mode: 'detach'});
    }}));

    developerMenu.append(new MenuItem({ label: 'Toggle AO Developer Tools', click: () => {
            const devtools = new BrowserWindow();
            app_overlay.webContents.setDevToolsWebContents(devtools.webContents);
            app_overlay.webContents.openDevTools({mode: 'detach'});
    }}));
    developerMenu.append(new MenuItem({ label: 'Toggle AB Developer Tools', click: () => {
            const devtools = new BrowserWindow();
            app_bar.webContents.setDevToolsWebContents(devtools.webContents);
            app_bar.webContents.openDevTools({mode: 'detach'});
    }}));

    const dropdownMenu = Menu.buildFromTemplate([
        new MenuItem({ label: 'Files ', submenu: fileMenu}),
        new MenuItem({label: 'Developer Tools', submenu: developerMenu})
    ]);

    ipcMain.on('show-menu', () => {
        dropdownMenu.popup({
            window: mainWindow,
            x: 0,
            y: 40
        });
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
        app_overlay.webContents.send('update-list', musicList);
        app_bar.webContents.send('unsaved-changes', true);
        isSaved = false;
        fs.writeFileSync(path.join(exePath, 'temp_music_list.mlist'), JSON.stringify(musicList, null, 2));
        appSettings.isUnsavedWork = true;
        MainUtils.saveConfig(appSettings);
    });

    ipcMain.on('delete-music', (event, musicId) => {
        for(let i = 0; i < musicList.length; i++){
            if(musicList[i].id === musicId){
                musicList.splice(i, 1);
                youtube_player_view.webContents.send('update-link-list', musicList);
                app_overlay.webContents.send('update-list', musicList);
                app_bar.webContents.send('unsaved-changes', true);
                isSaved = false;
                fs.writeFileSync(path.join(exePath, 'temp_music_list.mlist'), JSON.stringify(musicList, null, 2));
                appSettings.isUnsavedWork = true;
                MainUtils.saveConfig(appSettings);
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
                    appSettings.startIndex = Number(appSettings.startIndex) + Number(musicList.length);
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
    });

    mainWindow.on('close', (event) => {
        event.preventDefault();
        if(!isSaved){
            const confirmDialog = dialog.showMessageBoxSync(mainWindow, {
                type: 'warning',
                buttons: ['Save', "Don't save", 'Cancel'],
                title: 'Unsaved changes',
                message: "Some changes aren't saved !\nDo you want to save ?",
                defaultId: 0
            });

            if (confirmDialog === 0) {
                save();
                if(!isSaved){
                    mainWindow.close();
                }else {
                    globalShortcut.unregister('CommandOrControl+S');
                    globalShortcut.unregister('CommandOrControl+Shift+S');
                    globalShortcut.unregister('CommandOrControl+O');
                    mainWindow.destroy();
                    app.exit();
                }
            }else if(confirmDialog === 1){
                appSettings.isUnsavedWork = false;
                MainUtils.saveConfig(appSettings);
                globalShortcut.unregister('CommandOrControl+S');
                globalShortcut.unregister('CommandOrControl+Shift+S');
                globalShortcut.unregister('CommandOrControl+O');
                mainWindow.destroy();
                app.exit();
            }
        }else{
            globalShortcut.unregister('CommandOrControl+S');
            globalShortcut.unregister('CommandOrControl+Shift+S');
            globalShortcut.unregister('CommandOrControl+O');
            mainWindow.destroy();
            app.exit();
        }
    });

    ipcMain.on('close-window', () => {
        mainWindow.close();
    });

    ipcMain.on('maximize-window', () => {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.on('minimize-window', () => {
        mainWindow.minimize();
    });


    app.on('window-all-closed', () => {
        app.quit();
    });

    ipcMain.handle('get-settings', () => {
        return appSettings;
    });

    ipcMain.handle('get-musics', () => {
        return musicList;
    });

    ipcMain.handle('open-directory-dialog', async () => {
        return await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });
    });

    globalShortcut.register('CommandOrControl+O', () => {
        if(mainWindow.isFocused()) {
            open();
        }
    });

    globalShortcut.register('CommandOrControl+Shift+S', () => {
        if(mainWindow.isFocused()) {
            saveAs()
        }
    });

    globalShortcut.register('CommandOrControl+S', () => {
        if(mainWindow.isFocused()) {
            save();
        }
    });
}

app.whenReady().then(() => {
    for(let i = 0; i < process.argv.length; i++){
        if(process.argv[i] === '-o' && process.argv[i + 1] !== undefined){
            fs.access(process.argv[i + 1], fs.constants.F_OK, (err) => {
                if (err) {
                    app.exit();
                }
            });
            if (path.extname(process.argv[i + 1]) !== '.mlist') {
                app.exit();
            }
            try{
                const file = JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf-8'));
                if (Array.isArray(file)) {
                    // Iterate over the elements in the array
                    for (const element of file) {
                        // Check if the element has the desired structure
                        if (!(
                            element &&
                            typeof element === 'object' &&
                            element.hasOwnProperty('id') &&
                            element.hasOwnProperty('musicData') &&
                            typeof element.musicData === 'object' &&
                            element.musicData.hasOwnProperty('thumbnail') &&
                            element.musicData.hasOwnProperty('title') &&
                            element.musicData.hasOwnProperty('artist') &&
                            element.musicData.hasOwnProperty('link')
                        ))
                        {
                            app.exit(); // Exit the loop if an element doesn't match the structure
                        }
                    }
                } else {
                    console.log('Object does not have the specified array property');
                }
            }catch (e) {
                app.exit();
            }
            break;
        }
    }
    createWindow();
});