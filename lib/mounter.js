/**
 * Created by Boating on 2017/1/10.
 */
var logger = gobj.Logger('mounter.js');

var async = require('async');
var _ = require('underscore');
var express = require('express');
var cors = require('cors');
var app = express();

// MiddleWares
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var service = require('./service');

var ServerConfig = gobj.AppConfig.SERVER;

module.exports = function(cb) {
    async.series([
        mountConfig,
        mountDataStore,
        mountMiddleWares
    ], function(err) {
        cb(err, app);
    });
};

var mountConfig = function(next) {
    var config = ServerConfig.EXPRESS_OPTIONS;
    for(var pn in config) {
        if(!config.hasOwnProperty(pn)) continue;
        app.set(pn,config[pn]);
    }
    app.engine(config['view engine'], ServerConfig.VIEW_ENGINE);
    next();
};

var mountDataStore = function(next){
    gobj.sqlStore = gobj.MySqlStore(gobj.AppConfig.MYSQL);
    //gobj.mongodb = gobj.MongoDB(gobj.AppConfig.MONGO_DB);

    next();
};

var mountMiddleWares = function(next){
    var assetsConfig = ServerConfig.ASSETS;
    app.use(cors());
    //浏览器总是会请求/favicon.icon图标，配置此中间件快速返回请求
    app.use(favicon(assetsConfig.FAVICON));

    //静态文件
    app.use(assetsConfig.PREFIX, express.static(assetsConfig.DIR,assetsConfig.OPTIONS));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(service.routes());

    app.use(service.errorHandler.serverErrorHandler);
    app.use(service.errorHandler.notFoundErrorHandler);
    next();
};