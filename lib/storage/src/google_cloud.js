/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2017/10/26
 * Time: 07:22
 */

var fs = require('fs');
var request = require('request');
var sharp = require('sharp');
var utils = require('./utils');

var google_cloud = {};
var config = {};
var urlBase = '';
var tempPath = '';

function getConfig() {
    return config;
}

function getTempPath() {
    return tempPath;
}

google_cloud.setTempPath = function () {
    tempPath = arguments[0];
};

google_cloud.setConfig = function () {
    config = arguments[0];
};

google_cloud.setUrlBase = function () {
    urlBase = arguments[0];
};

google_cloud.getUrlBase = function () {
    return 'https://storage.googleapis.com/' + getConfig().bucket + '/';
};
google_cloud.getUrl = function () {
    var module = 'media';
    if (arguments[0] != undefined && arguments[0] != '') {
        module = arguments[0];
    }
    if (getConfig().path == '') {
        return google_cloud.getUrlBase();
    }
    return google_cloud.getUrlBase() + getConfig().path + '/' + module + '/';
};
google_cloud.getUrlThumbnail = function () {
    var module = 'media';
    if (arguments[0] != undefined && arguments[0] != '') {
        module = arguments[0];
    }
    return google_cloud.getUrl(module) + 'thumbnail/';
};

// Base on https://cloud.google.com/storage/docs/access-control/lists#predefined-acl
google_cloud.upload = function () {
    var fileUpload = arguments[0];
    var sessionId = arguments[1];
    var module = arguments[2];
    var pathOld = arguments[3];
    var dataReturn = {};
    var utcTime = utils.getUtcTime();
    var myBucket = getConfig().bucket;
    var token = getConfig().token;

    // Get mime type of file upload
    var mimeType = utils.getMimeType(fileUpload.mimetype);
    //
    return new Promise(function (resolve, reject) {
        if (mimeType[4] != 'image') {
            return reject('File upload not is image');
        }
        dataReturn.type = mimeType[4];
        dataReturn.type_detect = mimeType[5];
        dataReturn.type_original = mimeType[1];

        return resolve(sharp(fileUpload.data).toBuffer({resolveWithObject: true}));
    }).then(function (data) {

        // Upload file to Google cloud(original)
        return new Promise(function (resolve, reject) {
            if (data == undefined || data.info == undefined) {
                return reject('Something is wrong :(');
            }

            // Get metadata
            dataReturn.width = data.info.width;
            dataReturn.height = data.info.height;
            dataReturn.size = data.info.size;
            return resolve(data);
        });

    }).then(function (data) {
        // Check token expires
        return new Promise(function (resolve, reject) {
            // Check and get token new from local
            if (fs.existsSync(getTempPath() + '/google_cloud_token')) {
                token = fs.readFileSync(getTempPath() + '/google_cloud_token').toString();
            }
            request({
                url: 'https://www.googleapis.com/oauth2/v3/tokeninfo' + '?access_token=' + token,
                method: 'POST',
                headers: {'Accept': 'application/json'}
            }, function (err, response) {
                if (err) {
                    return reject(err);
                }
                var result = JSON.parse(response.body);
                // Check token expires > 50s
                if (result.expires_in != undefined && parseInt(result.expires_in) > 50) {
                    return resolve(data);
                } else {
                    // Refresh token
                    var params = {
                        'client_id': getConfig().clientId,
                        'client_secret': getConfig().clientSecret,
                        'grant_type': 'refresh_token',
                        'refresh_token': getConfig().refreshToken
                    };
                    request({
                        url: 'https://www.googleapis.com/oauth2/v4/token',
                        method: 'POST',
                        headers: {'Accept': 'application/x-www-form-urlencoded'},
                        form: params
                    }, function (err, response) {
                        if (err) {
                            return reject(err);
                        }
                        var json = JSON.parse(response.body);
                        token = json.access_token;
                        // Save token into this server for next request
                        if (!fs.existsSync(getTempPath() + '/')) {
                            fs.mkdirSync(getTempPath() + '/');
                        }
                        fs.writeFile(getTempPath() + '/google_cloud_token', token, function (err) {
                            // None todo
                        });
                        return resolve(data);
                    });
                }
            });
        });
    }).then(function (data) {
        return new Promise(function (resolve, reject) {
            var prefixPath = utils.buildPath(getConfig().path, module);
            // Check and create path
            var path = '';
            path += utils.buildPathByDate();
            path += sessionId + '_' + utcTime;
            path += mimeType[5];

            return request({
                url: 'https://www.googleapis.com/upload/storage/v1/b/' + myBucket + '/o?uploadType=media&predefinedAcl=publicRead&name=' + prefixPath + path,
                method: 'POST',
                headers: {
                    'Content-Type': mimeType[1],
                    'Content-Length': parseInt(data.info.size),
                    'Authorization': 'Bearer ' + token
                },
                body: data.data
            }, function (err, response) {
                var body = JSON.parse(response.body);
                if (err == null && body.error == undefined) {
                    // Set path image for save db
                    dataReturn.path = path;
                    return resolve(data);
                } else if (err == null && body.error != undefined) {
                    return reject(body.error.message);
                }
                return reject(err);
            });
        });
    }).then(function (data) {
        // Resize image for weight is utils.getThumbnailSize() (default 200px)
        return sharp(data.data).resize(utils.getThumbnailSize()).toBuffer({resolveWithObject: true});
    }).then(function (data) {
        return new Promise(function (resolve, reject) {
            // Setup for upload thumbnail to Google cloud
            var prefixPath = utils.buildPathThumbnail(getConfig().path, module);
            // Check and create path
            var path = '';
            path += utils.buildPathByDate();
            path += sessionId + '_' + utcTime;
            path += mimeType[5];

            return request({
                url: 'https://www.googleapis.com/upload/storage/v1/b/' + myBucket + '/o?uploadType=media&predefinedAcl=publicRead&name=' + prefixPath + path,
                method: 'POST',
                headers: {
                    'Content-Type': mimeType[1],
                    'Content-Length': parseInt(data.info.size),
                    'Authorization': 'Bearer ' + token
                },
                body: data.data
            }, function (err, response) {
                var body = JSON.parse(response.body);
                if (err == null && body.error == undefined) {
                    dataReturn.size_thumb = data.info.size;
                    return resolve();
                } else if (err == null && body.error != undefined) {
                    return reject(body.error.message);
                }
                return reject(err);
            });
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            // Deleted old file
            if (pathOld != '') {
                // Setup for delete image to Google cloud
                var prefixPath = utils.buildPath(getConfig().path, module);
                return request({
                    url: 'https://www.googleapis.com/storage/v1/b/' + myBucket + '/o/' + encodeURIComponent(prefixPath + pathOld),
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                }, function (err, response) {
                    var body = response.body;
                    if (err == null && body.error == undefined) {
                        return resolve();
                    } else if (err == null && body.error != undefined) {
                        return reject(body.error.message);
                    }
                    return reject(err);
                });
            } else {
                return resolve();
            }
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            // Deleted old file
            if (pathOld != '') {
                // Setup for delete thumbnail to Google cloud
                var prefixThumbnail = utils.buildPathThumbnail(getConfig().path, module);
                return request({
                    url: 'https://www.googleapis.com/storage/v1/b/' + myBucket + '/o/' + encodeURIComponent(prefixThumbnail + pathOld),
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                }, function (err, response) {
                    var body = response.body;
                    if (err == null && body.error == undefined) {
                        return resolve([null, dataReturn]);
                    } else if (err == null && body.error != undefined) {
                        return reject(body.error.message);
                    }
                    return reject(err);
                });
            } else {
                return resolve([null, dataReturn]);
            }
        });
    }).catch(function (err) {
        return [err, {}];
    });
};

module.exports = google_cloud;

