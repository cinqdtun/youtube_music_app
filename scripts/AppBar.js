window.addEventListener('load', () => {
    const {ipcRenderer} = require('electron');

    const closeBtn = document.querySelector('.window-control-close');
    const maximizeBtn = document.querySelector('.window-control-maximize');
    const minimizeBtn = document.querySelector('.window-control-minimize');
    let isUnsaved = false;


    closeBtn.addEventListener('click', () => {
        ipcRenderer.send('close-window');
    });

    maximizeBtn.addEventListener('click', () => {
        ipcRenderer.send('maximize-window');
    });

    minimizeBtn.addEventListener('click', () => {
        ipcRenderer.send('minimize-window');
    });

    document.querySelector(".burger-menu").addEventListener('click', () => {
        ipcRenderer.send('show-menu');
    });

    ipcRenderer.on('title-update', (event, title) => {
        document.querySelector("#list-name-container").textContent = title;
        isUnsaved = false;
    });

    ipcRenderer.on('unsaved-changes', (event, state) => {
        if(state && !isUnsaved) {
            document.querySelector("#list-name-container").textContent += ' *';
            isUnsaved = true;
        }else if(!state){
            if(isUnsaved) {
                document.querySelector("#list-name-container").textContent = document.querySelector("#list-name-container").textContent.replace(' *', '');
            }
            isUnsaved = false;
        }
    });

});
