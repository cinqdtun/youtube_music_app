window.addEventListener('load', () => {
    const {ipcRenderer} = require('electron');
    let isDownloading = false;

    document.querySelector("#download-button").addEventListener('click', (event) => {
        if (!isDownloading) {
            ipcRenderer.send('download-request');
        }
    });

    ipcRenderer.on('update-list', (event, list) => {
        const musicListContainer = document.querySelector('#list-container-scroll');
        while (musicListContainer.firstChild) {
            musicListContainer.removeChild(musicListContainer.lastChild);
        }
        for (let i = 0; i < list.length; i++) {
            const music = list[i];
            let musicContainer = document.createElement('div');
            musicContainer.setAttribute('class', 'music-container');
            let thumbnailMusic = document.createElement('img');
            thumbnailMusic.setAttribute('class', 'thumbnail-music');
            thumbnailMusic.setAttribute('src', music.musicData.thumbnail);
            let musicsInfoContainer = document.createElement('div');
            musicsInfoContainer.setAttribute('class', 'musics-infos-container');
            let titleMusicLabel = document.createElement('p');
            titleMusicLabel.setAttribute('class', 'title-music-label app-text');
            titleMusicLabel.textContent = music.musicData.title;
            let artistLabel = document.createElement('p');
            artistLabel.setAttribute('class', 'artist-label app-text');
            artistLabel.textContent = music.musicData.artist;
            musicContainer.appendChild(thumbnailMusic);
            musicContainer.appendChild(musicsInfoContainer);
            musicsInfoContainer.appendChild(titleMusicLabel);
            musicsInfoContainer.appendChild(artistLabel);
            if(isDownloading){
                let downloadedCheckMark = document.createElement('div');
                downloadedCheckMark.setAttribute('class', 'downloaded-checkmark');
                musicsInfoContainer.appendChild(downloadedCheckMark);
            }else {
                let deleteButton = document.createElement('div');
                deleteButton.setAttribute('class', 'delete-button');
                deleteButton.addEventListener('click', (event) => {
                    if (!isDownloading) {
                        const musicId = music.id;
                        ipcRenderer.send('delete-music', musicId);
                    }
                });
                musicsInfoContainer.appendChild(deleteButton);
            }
            musicListContainer.appendChild(musicContainer);
        }

        ipcRenderer.on('starting-downloading', (event) => {
            isDownloading = true;
            document.querySelector("#search-controls").style.visibility = 'hidden';
            document.querySelector("#download-controls").style.visibility = 'visible';
        });
    });
});