/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2017/10/20
 * Time: 07:07
 */

var utils = require('./../config/utils');
var storage = require('./storage/index');

var uploader = {};

function getUploader() {
    if (utils.getStorageSave() == 'aws_s3') {
        var s3 = storage.s3;
        s3.setConfig(utils.getS3Config());
        return s3;
    } else if (utils.getStorageSave() == 'google_cloud') {
        var google_cloud = storage.google_cloud;
        google_cloud.setConfig(utils.getGoogleCloudConfig());
        google_cloud.setTempPath(utils.getTemp());
        return google_cloud;
    } else if (utils.getStorageSave() == 'local') {
        var local = storage.local;
        local.setConfig(utils.getLocalConfig());
        local.setUrlBase(utils.getUrlBase());
        local.setPublicPath(utils.getPublicPath());
        return local;
    }
};

uploader.run = function () {
    var fileUpload = arguments[0];
    var sessionId = arguments[1];
    var module = arguments[2];
    var pathOld = arguments[3];
    return getUploader().upload(fileUpload, sessionId, module, pathOld);
};

uploader.getUrl = function () {
    var module = arguments[0];
    return getUploader().getUrl(module);
};

uploader.getUrlThumbnail = function () {
    var module = arguments[0];
    return getUploader().getUrlThumbnail(module);
};

module.exports = uploader;