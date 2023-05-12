window.addEventListener('load', () => {
    const parentButtonElement = document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar");
    const {ipcRenderer} = require('electron');
    let musicList = [];
    let adState = false;
    let isDownloading = false;

    const observerBar = new MutationObserver((mutationsList, observerBar) => {
        if (!document.querySelector('html').classList.contains('inactive-player')) {
            observerBar.disconnect();
            const observerAd = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === "attributes" && mutation.attributeName === "is-advertisement_") {
                        if (!document.querySelector("#layout > ytmusic-player-bar").hasAttribute("is-advertisement_")) {
                            if (!parentButtonElement.querySelector('#addToDownloadList')) {
                                createButton();
                                adState = false;
                            }
                        } else {
                            if (parentButtonElement.querySelector('#addToDownloadList')) {
                                removeButton();
                                adState = true;
                            }
                        }
                    }
                }
            });
            observerAd.observe(document.querySelector("#layout > ytmusic-player-bar"), {attributes: true});
        }
    });
    observerBar.observe(document.querySelector('html'), {attributes: true, attributeFilter: ['class']});

    ipcRenderer.on('update-link-list', (event, list) => {
        musicList = list;
        if(!adState) {
            removeButton();
            createButton();
        }
    });

    ipcRenderer.on('starting-downloading', (event) => {
        isDownloading = true;
        if(!adState) {
            removeButton();
            createButton();
        }
    });

    function createButton() {
        let addDownloadBtn = document.createElement('img');
        addDownloadBtn.setAttribute('id', 'addToDownloadList');
        addDownloadBtn.style.height = '30px';
        if(!isLinkContained()) {
            addDownloadBtn.setAttribute('src', 'data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABK0lEQVR4nO3dQQ6CMBRAQWq8/5Xrzh0kEmweZOYCCs+fNK3iBgAAzzeOrnDOOX0GrjfG2L3vrxtf1yMJEiNIjCAxgsS8T76dw9UZXz+vUk1IjCAxgsQIEiNIjCAxgsQIEiNIjCAxgsQIEiNIjCAxZ7ffK/a2t297PGBCYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJWX2Eu+p371e+ztLjYBMSI0iMIDGCxAgSs3qVdfWKxRfl+C9BYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJESRGkBhBYgSJufvDZx73DHoTEiNIjCAxgsQIEiNIjCAxgsQIEiNIjCAxgsQIEnN2t9f/rP+JCYkRJEaQGEFiBAEAAJbatu0DEs8KuDhFVncAAAAASUVORK5CYII=');
            addDownloadBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const music = {
                    thumbnail: document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.thumbnail-image-wrapper.style-scope.ytmusic-player-bar > img").getAttribute('src'),
                    title: document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > yt-formatted-string").textContent,
                    artist: document.querySelector("#layout > ytmusic-player-bar > div.middle-controls.style-scope.ytmusic-player-bar > div.content-info-wrapper.style-scope.ytmusic-player-bar > span > span.subtitle.style-scope.ytmusic-player-bar > yt-formatted-string > :nth-child(1)").textContent,
                    link: document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a").getAttribute('href')
                };
                ipcRenderer.send('add-music-playlist', music);
            })
        }else{
            addDownloadBtn.setAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAABLUlEQVR4nO3dQQ6CMBRAwWo8NEfg1rpzB4kEmweZuYDC8ydNqzgAAOD+HntXuCzL22fgfOu6bt7354Wv65YEiREkRpAYQWJeB9/O7uqMr59XqSYkRpAYQWIEiREkRpAYQWIEiREkRpAYQWIEiREkRpCYo9vvFVvb25c9HjAhMYLECBIjSIwgMYLECBIjSIwgMYLECBIjSIwgMYLECBIjSIwgMYLEzD7CnfW79zNfZ+pxsAmJESRGkBhBYgSJmb3KOnvF4oty/JcgMYLECBIjSIwgMYLECBIjSIwgMYLECBIjSIwgMYLECBIjSIwgMYLEXP3hM7d7Br0JiREkRpAYQWIEiREkRpAYQWIEiREkRpAYQWIEiTm62+t/1v/EhMQIEiNIjCAxggAAAFONMT7yagq4sctKfAAAAABJRU5ErkJggg==');
            addDownloadBtn.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
        parentButtonElement.appendChild(addDownloadBtn);
    }

    function removeButton() {
        document.querySelector("#addToDownloadList").remove();
    }

    function isLinkContained(){
        if(isDownloading) return true;
        const uriCurrentMusic = document.querySelector("#movie_player > div.ytp-chrome-top > div.ytp-title > div > a").getAttribute('href');
        for (let i = 0; i < musicList.length; i++) {
            if (uriCurrentMusic === musicList[i].musicData.link) return true;
        }
        return false;
    }
});