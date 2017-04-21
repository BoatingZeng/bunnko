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
            /*var privateKey  = fs.readFileSync(SSL.PRIVATE_KEY, 'utf8');
            var certificate = fs.readFileSync(SSL.CERTIFICATE, 'utf8');*/
            var pfx = fs.readFileSync(SSL.PFX);
            var passphrase = fs.readFileSync(SSL.PASSWORD);
            var credentials = {pfx: pfx, passphrase: passphrase};
            server = https.createServer(credentials, app);
            var httpserver = require('express').createServer();
            httpserver.get('*',function(req,res){
                res.redirect('https://mydomain.com'+req.url)
            });
            httpserver.listen(80, function(){
                logger.info(gobj.format('http服务器正在监听"%s:%d"', server.address().address, 80));
            });
        } else {
            server = http.createServer(app);
        }
        server.listen(port, function() {
            logger.info(gobj.format('服务器正在监听"%s:%d"', server.address().address, port));
        });
    });
};

/** 停止服务器,同时退出进程 */
var stopServer = function() {
    if(server) {
        logger.info('开始停止服务器');
        // http处理完请求后退出进程，如果在此处添加了关闭事件回调函数，Server可能不会触
        // 发close事件,调用以下方法后，子进程与主进程会断开连接，因此后续日志信息不会显示
        server.close(exitProcess);
    }

    // 保证强制退出进程
    setTimeout(exitProcess, ServerConfig.STOP_TIMEOUT);
    function exitProcess() {
        logger.info(gobj.format('服务器进程退出，进程号"%d"', process.pid));
        process.exit(1);
    }
};

process.on('uncaughtException', function(err) {
    logger.error('应用程序发生意外异常,即将停止', err);
    stopServer();
});

//执行来自cluster进程的命令
process.on('message',function(cmd){
    if(typeof(cmd) == 'string') {
        logger.info(gobj.format('接收到集群服务器命令"%s"', cmd));
        if(cmd == 'stop') {
            // 服务器停止命令
            stopServer();
        }
    }
});

startServer();