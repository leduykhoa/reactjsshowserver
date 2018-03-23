/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2018/03/23
 * Time: 06:57
 */


module.exports = {
    dateTimeDefaultFormat: 'YYYY-MM-DD HH:mm:ss',
    dateTimePickerFormat: 'yyyy-mm-dd hh:ii:ss',
    getTemp: function () {
        return 'temp';
    },
    getS3Config: function () {
        return {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION,
            bucket: process.env.S3_BUCKET,
            path: process.env.S3_PATH
        }
    },
    getLocalConfig: function () {
        return {
            path: 'media'
        }
    },
    getGoogleCloudConfig: function () {
        return {
        }
    },
    getStorageSave: function () {
        // value: 'aws_s3'
        // label: 'Amazon web service S3'
        // value: 'local'
        // label: 'Current host'
        // value: 'google_cloud'
        // label: 'Google Cloud '
        return 'local';
    },

    getUrlBase: function () {
        if (process.env.PORT_REMOTE == undefined || process.env.PORT_REMOTE == '' || process.env.PORT_REMOTE == 80) {
            return process.env.URL_BASE;
        }
        return process.env.URL_BASE + ':' + process.env.PORT_REMOTE;
    },

    getPort: function () {
        if (process.env.PORT_REMOTE == undefined || process.env.PORT_REMOTE == '') {
            return 80;
        }
        process.env.PORT_REMOTE;
    },

    getPublicPath: function () {
        return 'public';
    },

    getAdminPath: function () {
        return process.env.ADMIN_PATH;
    },
    getDbUrI: function () {
        if (process.env.MONGODB_URI == undefined || process.env.MONGODB_URI == '') {
            process.exit(1);
        }
        return process.env.MONGODB_URI;
    },
    getSecret: function () {
        return process.env.SESSION_SECRET;
    },
    // Todo
    buildSlug: function (str) {
        // str = removeAccents(str.toString());
        str = str.toLowerCase();
        str = str.trim();
        // Remove all special character
        str = str.replace(/[`~!@#$%^&*()|+\=?;:'",.<>\{\}\[\]\\\/！。、・]/gi, ' ');
        str = str.replace(/( )+/gi, ' ');
        str = str.replace(/[ ]/gi, '-');
        str = str.replace(/(-)+/gi, '-');
        str = str.replace(/^-/gi, '');
        str = str.replace(/-$/gi, '');
        return str;
    }
};