window.addEventListener('load', () => {
    const {ipcRenderer} = require('electron');

    const closeBtn = document.querySelector('.window-control-close');
    const maximizeBtn = document.querySelector('.window-control-maximize');
    const minimizeBtn = document.querySelector('.window-control-minimize');



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
        document.querySelector("#title").textContent = title;
    });

});
