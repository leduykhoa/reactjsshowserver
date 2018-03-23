/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2017/10/21
 * Time: 06:20
 */

var fs = require('fs');
var sharp = require('sharp');
var utils = require('./utils');
var local = {};

var config = {};
var urlBase = '';
var publicPath = 'public';

function getPublicPath() {
    return publicPath;
}

function getConfig() {
    return config;
}

function getUrlBase() {
    return urlBase;
}

local.setPublicPath = function () {
    publicPath = arguments[0];
};
local.setConfig = function () {
    config = arguments[0];
};

local.setUrlBase = function () {
    urlBase = arguments[0];
};

local.getUrlBase = function () {
    return getUrlBase() + '/';
};
local.getUrl = function () {
    var module = 'media';
    if (arguments[0] != undefined && arguments[0] != '') {
        module = arguments[0];
    }
    if (getConfig().path == '') {
        return local.getUrlBase();
    }
    return local.getUrlBase() + getConfig().path + '/' + module + '/';
};
local.getUrlThumbnail = function () {
    var module = 'media';
    if (arguments[0] != undefined && arguments[0] != '') {
        module = arguments[0];
    }
    return local.getUrl(module) + 'thumbnail/';
};

local.upload = function () {
    var fileUpload = arguments[0];
    var sessionId = arguments[1];
    var module = arguments[2];
    var pathOld = arguments[3];
    var dataReturn = {};
    var utcTime = utils.getUtcTime();
    // Get mime type of file upload
    var mimeType = utils.getMimeType(fileUpload.mimetype);
    //
    return new Promise(function (resolve, reject) {
        // Remote this check for interview remi
        // if (mimeType[4] != 'image') {
        //     return reject('File upload not is image');
        // }
        dataReturn.type = mimeType[4];
        dataReturn.type_detect = mimeType[5];
        dataReturn.type_original = mimeType[1];
        // Add check for upload anything just for interview remi
        if (mimeType[4] == 'image') {
            return resolve(sharp(fileUpload.data).toBuffer({resolveWithObject: true}));
        }else{
            return resolve(fileUpload.data);
        }
    }).then(function (data) {

        // Upload file to local(original)
        return new Promise(function (resolve, reject) {

            // Block this check just for interview remi
            if (data == undefined || data.info == undefined) {
                //return reject('Something is wrong :(');
            }else{
                // Get metadata
                dataReturn.width = data.info.width;
                dataReturn.height = data.info.height;
                dataReturn.size = data.info.size;
            }

            var path = '';
            path += utils.buildPathByDate();
            path += sessionId + '_' + utcTime;
            path += mimeType[5];
            var prefixPath = utils.buildPath(getConfig().path, module);
            // Check and create directory
            var directoryFull = getPublicPath() + '/' + prefixPath + path;
            directoryFull = directoryFull.split('/');
            var currentPath = directoryFull[0] + '/';
            for (let i = 1; i < directoryFull.length - 1; i++) {
                currentPath += directoryFull[i] + '/';
                if (!fs.existsSync(currentPath)) {
                    fs.mkdirSync(currentPath);
                }
            }
            // Upload to localhost
            fileUpload.mv(getPublicPath() + '/' + prefixPath + path, function (err) {
                if (err == null) {
                    dataReturn.path = path;
                    return resolve();
                } else {
                    return reject();
                }
            });
        });

    }).then(function () {
        return new Promise(function (resolve, reject) {
            // Add check for upload anything just for interview remi
            if (mimeType[4] == 'image') {
                // Resize image for weight is utils.getThumbnailSize() (default 200px)
                var filePath = getPublicPath() + '/' + utils.buildPath(getConfig().path, module) + dataReturn.path;
                var data = fs.readFileSync(filePath);
                // Setup for upload thumbnail to local
                var path = '';
                path += utils.buildPathByDate();
                path += sessionId + '_' + utcTime;
                path += mimeType[5];
                var prefixPath = utils.buildPathThumbnail(getConfig().path, module);
                // Check and create directory
                var directoryFull = getPublicPath() + '/' + prefixPath + path;
                directoryFull = directoryFull.split('/');
                var currentPath = directoryFull[0] + '/';
                for (let i = 1; i < directoryFull.length - 1; i++) {
                    currentPath += directoryFull[i] + '/';
                    if (!fs.existsSync(currentPath)) {
                        fs.mkdirSync(currentPath);
                    }
                }
                // Upload image thumbnail to local
                return sharp(data)
                    .resize(utils.getThumbnailSize())
                    .toFile(getPublicPath() + '/' + prefixPath + path, function (err, info) {
                        if (err == null) {
                            dataReturn.size_thumb = info.size;
                            return resolve();
                        } else {
                            return reject(err);
                        }
                    });
            }else{
                resolve();
            }
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            // Deleted old file
            if (pathOld != '') {
                fs.unlinkSync(getPublicPath() + '/' + utils.buildPath(getConfig().path, module) + '/' + pathOld);
                fs.unlinkSync(getPublicPath() + '/' + utils.buildPathThumbnail(getConfig().path, module) + '/' + pathOld);
            }
            // Return for save to db
            return resolve([null, dataReturn]);
        });
    }).catch(function (err) {
        return [err, {}];
    });
};

module.exports = local;