/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2017/10/19
 * Time: 23:18
 */

var moment = require('moment-timezone');
var fs = require('fs');
var parse = require('csv-parse/lib/sync');


var utils = {};

utils.buildPathByDate = function () {
    var format = 'YYYY/MM/DD/';
    var date = new Date();
    var timezone = 'UTC';
    // Return time type utc for client
    return moment.tz(date, timezone).format(format);
};

// index = 2
// type = 'application/vnd.crick.clicker.palette'
utils.getMimeType = function () {
    var type, index;
    if (arguments.length === 2) {
        index = arguments[0];
        type = arguments[1];
    } else if (arguments.length === 1) {
        type = arguments[0];
    }
    // load file csv for get type file
    var data = fs.readFileSync(__dirname + '/mime-types.csv');
    // Convert csv to array
    var records = parse(data.toString(), {delimiter: ','});
    for (var i = 0; records.length > i; i++) {
        var row = records[i];
        if (type != undefined && index != undefined && row[index] == type) {
            return row[5];
        } else if (type != undefined && row[1] == type) {
            return row;
        }
    }
    return '';
};

utils.getUtcTime = function () {
    var date = new Date();
    var timezone = 'UTC';
    // Return time type utc
    return moment.tz(date, timezone).toDate().getTime();
};

utils.getThumbnailSize = function () {
    return 200;
};
// Build path like ' storage_server / path / module /'
utils.buildPath = function (path, module) {
    if (module == undefined || module == '') {
        module = 'media';
    }
    if (path == '') {
        return module + '/';
    } else {
        return path + '/' + module + '/';
    }
};
// Build path like ' storage_server / path / module / thumbnail /'
utils.buildPathThumbnail = function (path, module) {
    return utils.buildPath(path, module) + 'thumbnail/';
};

module.exports = utils;