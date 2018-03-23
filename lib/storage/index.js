/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2017/10/19
 * Time: 23:16
 */


var storage = {};

storage.utils = require('./src/utils');
storage.s3 = require('./src/s3');
storage.local = require('./src/local');
storage.google_cloud = require('./src/google_cloud');

module.exports = storage;