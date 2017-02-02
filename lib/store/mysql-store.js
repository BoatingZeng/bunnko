/**
 * Created by Boating on 2017/1/10.
 */
var mysql = require('mysql');
var async = require('async');
var _ = require('underscore');

var logger = gobj.Logger('mysql-store');
var dbConfig = gobj.AppConfig.MYSQL;

var createPool = function(options){
    logger.verbose('创建SqlStore数据库连接池，'+options.host+':'+options.port);
    return mysql.createPool(options);
};

/**SqlStore类
 * -options为数据库配置参数*/
var SqlStore=function(options){
    this.options=options||dbConfig;
    this.pool=createPool(options);
};

/**需要自行调用conn.release()释放连接*/
SqlStore.prototype.getConnection=function(cb){
    this.pool.getConnection(function(err,conn){
        if(err)logger.error('不能获取SqlStore数据库连接，'+this.options.host+':'+this.options.port,
            err);
        cb(err,conn);
    });
};

/**
 * 获取用于事务的连接
 * @param callback 获取数据库连接后的回调，格式为fn(err,conn,next)，在使用完conn后，应调用next(err, conn)，把conn传回这里
 * @param commitCB 提交或回滚事务后的回调，格式为fn(err)，如果提交失败会传入error对象
 */
SqlStore.prototype.getConnectionWithTran = function(callback, commitCB){
    var pool = this.pool;
    async.waterfall([
        //获取数据库连接
        function(next){
            pool.getConnection(function(err, conn){
                if(err){
                    logger.error('不能获取mysql连接');
                    return callback(err, conn, next);
                }
                //开启事务
                conn.beginTransaction(function(err){
                    if(err)logger.error('开启mysql数据库事务出错', err);
                    callback(err,conn,next);
                });
            });
        }
    ],
    function(err, conn){
        if(!conn) return logger.warn('回调函数未传入数据库连接对象conn，数据库连接可能未释放!');
        if(err){
            conn.rollback();
            conn.release();
            if(commitCB) commitCB(err);
            return;
        }
        conn.commit(function(err){
            if(err){
                logger.error('提交数据库事务出错', err);
                conn.rollback();
            }
            conn.release();
            if(commitCB)commitCB(err);
        });
    });
};

/**
 * 在事务中执行sql
 * @param sqls {Array} 要执行的sql队列
 * @param cb 全部sql执行完成后的回调cb(err,results)，results的形式为[{rows: [], fields: []}]
 */
SqlStore.prototype.batchQuery = function(sqls, cb){
    if(!sqls||sqls.length == 0) return cb('sqls参数不合法，需要sql语句数组');
    var results = []; //储存结果
    var error;
    this.getConnectionWithTran(
        function(err, conn, next){
            if(err){
                logger.error('getConnectionWithAutoTran 异常：'+err);
                return next(err, conn);
            }
            logger.debug('开始批量执行SQL');
            async.eachSeries(sqls,
                function(sql, callback){
                    logger.debug(sql);
                    conn.query(sql, function(err, rows, fields){
                        if(err) logger.error('批量执行此SQL时出错：'+sql, err);
                        error = err;
                        results.push({rows: rows, fields: fields});
                        callback(err);
                    });
                },
                function(err){
                    /**在出错或全部执行完成后提交事务*/
                    if(err)logger.error("eachSeries 异常："+err);
                    error = err;
                    next(err,conn);
                }
            )
        },
        function(err){
            logger.debug('批量执行sql结束');
            err = err || error;
            if(err) results = [];
            cb(err, results);
        }
    );
};

//普通的query，只能执行一句，因为禁用了multipleStatements
SqlStore.prototype.query = function(sql, callback){
    var pool = this.pool;
    async.waterfall([
        //获取数据库连接
        function(cb){
            pool.getConnection(function(err, conn){
                cb(err, conn);
            });
        },
        //执行sql
        function(conn, cb){
            conn.query(sql, function(err, rows, fields){
                cb(err, conn, rows, fields);
            });
        }
    ],
    function(err, conn, rows, fields){
        if(conn) conn.release();
        callback(err, rows, fields);
    });
};

module.exports=function(options){
    return new SqlStore(options);
};