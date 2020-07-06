const fs = require('fs');
const http = require('http');
const https = require('https');
const mkdirp = require('mkdirp');
const path = require('path');

module.exports = async function({ localPath, log, url }) {
    const directory = path.dirname(localPath);

    await mkdirp(directory);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(localPath);
        const downloader = url.indexOf('https:') === 0 ? https : http;

        log(`Created ${localPath}`, 'succeed');

        downloader
            .get(url, response => {
                response.pipe(file);

                file.on('finish', () => {
                    file.close(() => resolve());
                });
            })
            .on('error', error => {
                fs.unlink(localPath, () => {});

                reject(error);
            });
    });
};
