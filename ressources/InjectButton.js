window.addEventListener('load', () => {
    const parentButtonElement = document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar");
    const {ipcRenderer} = require('electron');
    const observerBar = new MutationObserver((mutationsList, observerBar) => {
        if (!document.querySelector('html').classList.contains('inactive-player')) {
            observerBar.disconnect();
            const observerAd = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === "attributes" && mutation.attributeName === "is-advertisement_") {
                        if (!document.querySelector("#layout > ytmusic-player-bar").hasAttribute("is-advertisement_")) {
                            if (!parentButtonElement.querySelector('#addToDownloadList')) {
                                createButton();
                            }
                        } else {
                            if (parentButtonElement.querySelector('#addToDownloadList')) {
                                removeButton();
                            }
                        }
                    }
                }
            });
            observerAd.observe(document.querySelector("#layout > ytmusic-player-bar"), {attributes: true});
        }
    });
    observerBar.observe(document.querySelector('html'), {attributes: true, attributeFilter: ['class']});

    function createButton() {
        let addDownloadBtn = document.createElement('img');
        addDownloadBtn.setAttribute('id', 'addToDownloadList');
        addDownloadBtn.setAttribute('src', 'data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABK0lEQVR4nO3dQQ6CMBRAQWq8/5Xrzh0kEmweZOYCCs+fNK3iBgAAzzeOrnDOOX0GrjfG2L3vrxtf1yMJEiNIjCAxgsS8T76dw9UZXz+vUk1IjCAxgsQIEiNIjCAxgsQIEiNIjCAxgsQIEiNIjCAxZ7ffK/a2t297PGBCYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJWX2Eu+p371e+ztLjYBMSI0iMIDGCxAgSs3qVdfWKxRfl+C9BYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJufvDZx73DHoTEiNIjCAxgsQIEiNIjCAxgsQIEiNIjCAxgsQIEnN2t9f/rP+JCYkRJEaQGEFiBAEAAJbatu0DEs8KuDhFVncAAAAASUVORK5CYII=');
        addDownloadBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            ipcRenderer.send('add-music-playlist', document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a").getAttribute('href'));
        })
        addDownloadBtn.style.height = '30px';
        parentButtonElement.appendChild(addDownloadBtn);
    }

    function removeButton() {
        let btn = document.getElementById('addToDownloadList');
        btn.parentNode.removeChild(btn);
    }
});