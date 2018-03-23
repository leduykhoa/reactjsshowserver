/**
 * Copyright © 2009-2017 Lê Duy Khoa. All rights reserved.
 * Mail: leduykhoa060690@gmail.com
 * Skype: leduykhoa060690
 * Website: web-fast.com
 * Mobile: +84973421508
 * Date: 2018/03/23
 * Time: 07:32
 */

var express = require('express');
var validator = require('validator');

var router = express.Router();
var uploader = require('./../lib/uploader');

router.get('/', function (req, res) {
    return res.send('Hello World! :)');
});
/* POST save data */
router.post('/', function (req, res) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Content-Type', 'application/json');
    // Pass to next layer of middleware

    // return res.send('Hello World!');

    var dataResult = {error: 1, message: '', data: ''};

    var fileUpload = req.files.file;
    var dataSave = {};


    var pathOld = '';
    return new Promise(function (resolve, reject) {
        // Check validate
        if (fileUpload == undefined) {
            dataResult.message = 'Image: Not attach!';
            return reject(dataResult);
        }else{

            // Upload to storage(s3, google cloud, local, and maybe more)
            return resolve(uploader.run(fileUpload, req.sessionID.toLowerCase(), 'media', pathOld));
        }
    }).then(function (data) {

        if (data[0] == null) {
            data = data[1];
            dataSave.type = data.type;
            dataSave.type_detect = data.type_detect;
            dataSave.type_original = data.type_original;
            dataSave.size = data.size;
            console.log('run here');
            dataSave.size_thumb = data.size_thumb;
            console.log(data);
            dataSave.width = data.width;
            dataSave.height = data.height;
            dataSave.path = data.path;

            dataResult.error = 0;
            dataResult.data = dataSave;
            return Promise.resolve(dataResult);
        }else {
            dataResult.message = 'Upload get trouble!';
            return Promise.reject(dataResult);
        }
    }).then(function (data) {

        // Code something ...
        return res.status(200).json(data);
    }).catch(function (data) {
        console.log(data);
        console.log('run here__');
        // Code something ...
        return res.status(200).json(data);
    });
});


module.exports = router;