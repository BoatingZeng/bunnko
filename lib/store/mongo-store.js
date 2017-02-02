/**
 * Created by Boating on 2017/1/10.
 */

var logger = gobj.Logger('mongo-store.js');

var events = require('events');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var dbConfig = gobj.AppConfig.MONGO_DB;

var createSharedConnection = function(options,cb){
    if(!options.store.enabled()){if(cb)cb();return;}

    if(cb)options.emitter.once('open',cb);
    if(options.isCreatingConn)return;
    options.isCreatingConn=true;
    options.store.getConnection(function(err,conn){
        if(err)throw err;

        options.store.sharedConn=conn;
        options.isCreatingConn=false;
        options.store.sharedConn.once('close',function(er){
            logger.error(gobj.format('非法关闭mongodb共享连接%s',options.options.URL), er);
            throw er;
        });

        options.emitter.emit('open',err,options.store.sharedConn);
    });
};

var MongoDB = function(options){
    var op={};
    op.isCreatingConn=false;
    op.emitter=new events.EventEmitter();
    op.emitter.setMaxListeners(1024);
    op.store=this;

    this.options=options||dbConfig;
    this.enabled=function(){return this.options.ENABLED;};
    if(this.enabled()){
        logger.verbose('创建mongodb数据库：'+this.options.URL);
    }else{
        logger.warn('未启用mongodb数据库，调用此对象的方法可能会导致错误');
    }

    this.sharedConn=undefined;
    //执行数据操作，此方法会传入conn，不要调用conn.close()以便重用连接
    //回调函数格式:fn(err,conn)
    this.query=function(cb){
        if(this.sharedConn){return cb(null,this.sharedConn);}
        createSharedConnection(op,cb);
    };

    createSharedConnection(op);//初始化创建共享连接
};

//获取数据库连接，需要自行调用conn.close()关闭连接
//回调函数格式cb(err,conn),这里使用conn表示mongodb的db变量(Db对象)
MongoDB.prototype.getConnection=function(cb){
    if(!this.enabled()){return cb();}
    var self=this;
    MongoClient.connect(this.options.URL,this.options.OPTIONS,
        function(err,conn){
            if(err)logger.error('不能获取mongodb数据库连接：'+self.options.URL,
                err);
            cb(err,conn);
        });
};

module.exports = function(options){
    return new MongoDB(options);
};