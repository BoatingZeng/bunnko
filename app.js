/**
 * Created by Boating on 2017/1/10.
 */
require('./gobj.js');

var logger = gobj.Logger('app.js');

var fs = require('fs');
var http = require('http');
var https = require('https');
// 服务器组件挂载器
var mounter = require('./lib/mounter.js');

var ServerConfig = gobj.AppConfig.SERVER;
var server = undefined;

/** 启动服务器 */
var startServer = function() {
    // 挂载服务器所需的所有组件
    mounter(function(err, app) {
        if(err) {
            logger.error(err, '启动服务器时发生错误!部分服务器组件挂载失败');
            stopServer();
        }
        logger.info('服务器开始接收请求');
        var port = ServerConfig.LISTEN_PORT;
        var SSL = ServerConfig.SSL;
        if(SSL.IS_SSL){
            port = SSL.PORT;
            var pfx = fs.readFileSync(SSL.PFX);
            var passphrase = fs.readFileSync(SSL.PASSWORD);
            var credentials = {pfx: pfx, passphrase: passphrase};
            server = https.createServer(credentials, app);
            var httpserver = require('express')();
            httpserver.use(function(req,res){
                res.redirect('https://'+ServerConfig.DOMAIN+req.url);
            });
            httpserver.listen(80, function(){
                logger.info(gobj.format('http服务器正在监听"%s:%d"', server.address().address, 80));
            });
        } else {
            server = http.createServer(app);
        }
        server.listen(port, function() {
            logger.info(gobj.format('服务器正在监听"%s:%d"', server.address().address, port));
            setTimeout(function(){
                throw new Error('test error');
            }, 5000);
        });
    });
};

/** 停止服务器,同时退出进程 */
var stopServer = function() {
    if(server) {
        //请求处理完后直接退出进程
        server.close(exitProcess);
    }
    function exitProcess() {
        process.exit(1);
    }
};

process.on('uncaughtException', function(err) {
    logger.error('应用程序发生意外异常,即将停止', err);
    stopServer();
});

startServer();