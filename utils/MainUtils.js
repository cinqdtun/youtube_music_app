const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
class MainUtils {
    function

    static saveConfig(jsonConfig) {
        fs.writeFileSync('./config.json', JSON.stringify(jsonConfig, null, 2));
    }

    static loadConfig() {
        return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    }

    static downloadMusic(musicUrl, pathDownload){
        return new Promise((resolve, reject) => {
            const downloadUrl = `https://music.youtube.com/watch?v=${musicUrl.match(/v=([^&]+)/)[1]}`
            exec(`${path.join(__dirname, '..', 'libraries', 'ytdl', 'yt-dlp.exe')} ${downloadUrl} -x --audio-format mp3 --audio-quality 0 --extract-audio --add-metadata --embed-thumbnail  --ppa "EmbedThumbnail+ffmpeg_o:-c:v mjpeg -vf crop=\\"'if(gt(ih,iw),iw,ih)':'if(gt(iw,ih),ih,iw)'\\"" -o "${pathDownload}" --ffmpeg-location "${path.join(__dirname, '..', 'libraries', 'ffmpeg')}"`, (err, stdout, stderr) => {
                if (err) {
                    reject(stderr);
                }

                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                resolve(stdout);
            });
        });
    }

    static shuffleArray(startNum, endNum) {
        let pool = [];
        for (let i = startNum; i <= endNum; i++) {
            pool.push(i);
        }
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool;
    }



    static removeAccents(str) {
        const accentsMap = {
            'à': 'a',
            'á': 'a',
            'â': 'a',
            'ã': 'a',
            'ä': 'a',
            'ç': 'c',
            'è': 'e',
            'é': 'e',
            'ê': 'e',
            'ë': 'e',
            'ì': 'i',
            'í': 'i',
            'î': 'i',
            'ï': 'i',
            'ñ': 'n',
            'ò': 'o',
            'ó': 'o',
            'ô': 'o',
            'õ': 'o',
            'ö': 'o',
            'ù': 'u',
            'ú': 'u',
            'û': 'u',
            'ü': 'u',
            'ý': 'y',
            'ÿ': 'y'
        };

        return str.replace(/[^\u0000-\u007E]/g, (a) => {
            return accentsMap[a] || a;
        });
    }
}

module.exports = MainUtils;