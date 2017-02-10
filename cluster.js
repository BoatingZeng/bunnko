/**
 * Created by Boating on 2017/2/9.
 */

require('./gobj.js');
var cluster = require('cluster');
var ClusterConfig = gobj.AppConfig.CLUSTER;
var logger = gobj.Logger('cluster.js');
var numCPUs = require('os').cpus().length;
var serverRecreateCount = 0;
var stopFromCluster = false;

var createChildServer=function(){
    if(ClusterConfig.MAX_RECREATE_COUNT!=-1&&
        serverRecreateCount==ClusterConfig.MAX_RECREATE_COUNT){
        logger.warn(gobj.format('服务器自动重启超过最大次数"%d"，将停止重启服务器',
            ClusterConfig.MAX_RECREATE_COUNT));
        return ;
    }
    serverRecreateCount++;
    var worker=cluster.fork();

    logger.warn(gobj.format('启动服务器，进程号"%d",重启次数"%d"',
        worker.process.pid,serverRecreateCount));
    //增加一个错误告警输出，提醒运营人员服务器有异常
    if(serverRecreateCount>numCPUs+1) {
        logger.error("注意:app服务被人为或者异常原因导致重启了,当前重启次数是:"+serverRecreateCount);
    }
};

var startChildServer=function(){
    var count=ClusterConfig.CHILD_SERVER_COUNT;
    if(count==-1)count=numCPUs;
    for(var i=0;i<count;i++){
        createChildServer();
    }
};

var stopChildServer=function(){
    for(var id in cluster.workers){
        var worker=cluster.workers[id];
        worker.send('stop');
    }
};

var startCluster=function(){
    logger.info(gobj.format('启动集群，进程号"%d",子服务器文件"%s"',process.pid,
        ClusterConfig.CHILD_SERVER_FILE));
    cluster.setupMaster({exec:ClusterConfig.CHILD_SERVER_FILE});

    cluster.on("disconnect",function(worker){
        //在子进程退出后立刻创建新的子进程处理请求，以提高响应速度
        logger.info(gobj.format('子服务器已断开集群连接，进程号"%d"',worker.process.pid));
        if(!stopFromCluster){
            //如果不是因为停止集群导致的子服务器停止，则重新创建子服务器
            createChildServer();
        }
    });
    startChildServer();
};

var stopCluster=function(){
    logger.info('开始停止集群服务器');

    stopFromCluster=true;
    stopChildServer();

    setTimeout(function(){
        //以下日志不会显示，因为进程立刻退出，如果需要显示，应使用async
        //后续如果添加发送提醒邮件信息也需要使用async顺序执行
        //logger.info('集群服务器进程退出，进程号"%d"',process.pid);
        process.exit(1);
    },ClusterConfig.STOP_TIMEOUT);
};

process.on("uncaughtException",function(err){
    logger.error('应用程序发生意外异常,即将停止', err);
    stopCluster();
});

startCluster();