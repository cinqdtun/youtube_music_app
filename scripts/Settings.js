window.addEventListener('load', () => {
    const {ipcRenderer} = require('electron');
    let settings;

    ipcRenderer.invoke("get-settings").then((result) => {
        settings = result;
        document.querySelector("#location-label").textContent = settings.downloadLocation;
        document.querySelector("#start-index-input").value = settings.startIndex;
        document.querySelector("#attribute-indexation-input").value = settings.attributeIndexation;
    });

    document.querySelector("#choose-location-button").addEventListener('click', async () => {
        const resultDialog = await ipcRenderer.invoke('open-directory-dialog');
        if(!resultDialog.canceled){
           const selectedPath = resultDialog.filePaths[0];
            document.querySelector("#location-label").textContent = selectedPath;
            settings.downloadLocation = selectedPath;
        }
    });

    document.querySelector("#start-index-input").addEventListener('input', (event) => {
        if (event.target.value.length > 5) {
            event.target.value = event.target.value.slice(0, 5);
        }
        settings.startIndex = event.target.value;
    });
    document.querySelector("#attribute-indexation-input").addEventListener('change', (event) => {
        settings.attributeIndexation = event.target.value;
    });


    document.querySelector("#validate-button").addEventListener('click', () => {
        ipcRenderer.send('window-closed', {result: true, settings: settings});
    });

    document.querySelector("#cancel-button").addEventListener('click', () => {
        ipcRenderer.send('window-closed', {result: false, settings: null});
    });
});