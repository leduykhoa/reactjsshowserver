/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2017/10/19
 * Time: 23:18
 */

var aws = require('aws-sdk');
var sharp = require('sharp');
var utils = require('./utils');
var s3 = {};

var config = {};

function getConfig() {
    return config;
}

s3.setConfig = function () {
    config = arguments[0];
};

s3.getS3 = function () {
    aws.config.update({
        accessKeyId: getConfig().accessKeyId,
        secretAccessKey: getConfig().secretAccessKey,
        region: getConfig().region
    });
    return new aws.S3();
};

s3.getS3Bucket = function () {
    return getConfig().bucket;
};

s3.getUrlBase = function () {
    return 'https://s3-' + getConfig().region + '.amazonaws.com/' + getConfig().bucket + '/';
};
s3.getUrl = function () {
    var module = 'media';
    if (arguments[0] != undefined && arguments[0] != '') {
        module = arguments[0];
    }
    if (getConfig().path == '') {
        return s3.getUrlBase();
    }
    return s3.getUrlBase() + getConfig().path + '/' + module + '/';
};
s3.getUrlThumbnail = function () {
    var module = 'media';
    if (arguments[0] != undefined && arguments[0] != '') {
        module = arguments[0];
    }
    return s3.getUrl(module) + 'thumbnail/';
};

s3.upload = function () {
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
        if (mimeType[4] != 'image') {
            return reject('File upload not is image');
        }
        dataReturn.type = mimeType[4];
        dataReturn.type_detect = mimeType[5];
        dataReturn.type_original = mimeType[1];
        return resolve(sharp(fileUpload.data).toBuffer({resolveWithObject: true}));
    }).then(function (data) {
        // Upload file to s3(original)
        return new Promise(function (resolve, reject) {
            if (data == undefined || data.info == undefined) {
                return reject('Something is wrong :(');
            }
            // Get metadata
            dataReturn.width = data.info.width;
            dataReturn.height = data.info.height;
            dataReturn.size = data.info.size;

            var prefixPath = utils.buildPath(getConfig().path, module);
            var path = '';
            path += utils.buildPathByDate();
            path += sessionId + '_' + utcTime;
            path += mimeType[5];

            // Setup for upload to s3
            var s3Params = {
                Bucket: s3.getS3Bucket(),
                Key: prefixPath + path,
                Expires: 180,
                ContentType: mimeType[1],
                ACL: 'public-read',
                Body: data.data
            };
            // Run upload to s3
            s3.getS3().upload(s3Params, {}, function (err, response) {
                if (err == null) {
                    dataReturn.path = path;
                    return resolve(data.data);
                } else {
                    return reject(err);
                }
            });
        });
    }).then(function (data) {
        // Resize image for weight is utils.getThumbnailSize() (default 200px)
        return sharp(data).resize(utils.getThumbnailSize()).toBuffer({resolveWithObject: true});
    }).then(function (data) {
        // Upload thumbnail to s3
        return new Promise(function (resolve, reject) {
            dataReturn.size_thumb = data.info.size;
            var prefixPath = utils.buildPathThumbnail(getConfig().path, module);
            var path = '';
            path += utils.buildPathByDate();
            path += sessionId + '_' + utcTime;
            path += mimeType[5];

            // Setup for upload to s3
            var s3Params = {
                Bucket: s3.getS3Bucket(),
                Key: prefixPath + path,
                Expires: 180,
                ContentType: mimeType[1],
                ACL: 'public-read',
                Body: data.data
            };
            // Run upload to s3
            s3.getS3().upload(s3Params, {}, function (err, result) {
                if (err == null) {
                    return resolve();
                } else {
                    return reject(err);
                }
            });
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            var prefixPath = utils.buildPath(getConfig().path, module);

            // Setup for delete image from s3
            var s3Params = {
                Bucket: s3.getS3Bucket(),
                Objects: [ // required
                    {
                        Key: encodeURIComponent(prefixPath + pathOld)
                    }
                ]
            };
            // Run delete to s3
            s3.getS3().deleteObjects(s3Params, function (err, response) {
                return resolve();
                // if (err == null) {
                //     return resolve();
                // } else {
                //     return reject(err);
                // }
            });
        });
    }).then(function () {
        return new Promise(function (resolve, reject) {
            var prefixPath = utils.buildPathThumbnail(getConfig().path, module);

            // Setup for delete thumbnail
            var s3Params = {
                Bucket: s3.getS3Bucket(),
                Objects: [ // required
                    {
                        Key: encodeURIComponent(prefixPath + pathOld)
                    }
                ]
            };
            // Run delete to s3
            s3.getS3().deleteObjects(s3Params, function (err, response) {
                return resolve([null, dataReturn]);
                // if (err == null) {
                //     return resolve([null, dataReturn]);
                // } else {
                //     return reject(err);
                // }
            });
        });
    }).catch(function (err) {
        return [err, {}];
    });
};

module.exports = s3;