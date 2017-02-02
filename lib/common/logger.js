/**
 * Created by Boating on 2017/1/10.
 */

var util = require('util');
var fs = require('fs');
var events = require('events');
var _ = require('underscore');
var moment = require('moment');

var LogConfig = gobj.AppConfig.LOG;
var LogLevel = LogConfig.LOG_LEVEL_MAP;
var APP_LOG_LEVEL = LogLevel[LogConfig.LEVEL];

var logFileWriter = false;
var emitter = new events.EventEmitter();
emitter.setMaxListeners(1000);
var isCreatingLogFileWriter = false;
var isLogBusy = false;    //日志繁忙标志,为true时会禁止日志写入文件

/** 记录日志信息,重载Logger相关方法 */
var log = function(tag,level,msg, err){
    if(_.isObject(msg)) msg = JSON.stringify(msg, null, 2);
    if(LogLevel[level]<APP_LOG_LEVEL) return;
    var logMess = formatLog(tag, level, msg, err);
    writeLog(logMess, level);
};

/** 格式化日志 */
var formatLog = function(tag, level, message, err) {
    var dateMess = moment().format('YYYY-MM-DD HH:mm:ss');
    message = message || '';
    var errMess = err ? util.format('\n%s\n%s\n', err.name, err.stack) : '';
    return util.format('[%s][%s][%s][%s][%s]',
        dateMess, level, tag, message, errMess);
};

/** 打印日志 */
var writeLog = function(message, level) {
    if(LogConfig.WRITE_TO_CONSOLE) {
        var fn=(LogLevel[level]>=LogLevel.WARN) ? console.warn : console.log;
        fn.call(console, message);
    }
    if(LogConfig.WRITE_TO_FILE){
        writeLogToFile(message);
    }
};

var Logger=function(tag){
    this.verbose = function(msg, err) {
        log(tag, "VERBOSE", msg, err); // 详尽哆嗦的信息
    };
    this.debug = function(msg, err) {
        log(tag, "DEBUG", msg, err);   // 调试信息
    };
    this.info = function(msg, err) {
        log(tag, "INFO", msg, err);    // 普通信息
    };
    this.warn = function(msg, err) {
        log(tag, "WARN", msg, err);    // 警告信息
    };
    this.error = function(msg, err) {
        log(tag, "ERROR", msg, err);   // 错误信息
    };
    this.fatal = function(msg, err) {
        log(tag, "FATAL", msg, err);   // 致命的错误信息
    }
};

var writeLogToFile=function(message){
    if(logFileWriter){
        writeLog(message);
        return;
    }

    createLogFileWriter(function(){
        writeLogToFile(message);
    });

    function writeLog(){
        if(isLogBusy) {
            return;
        }

        var isOK=logFileWriter.write(message+'\n','utf-8');
        //如果因内存不够导致消息未写入,isLogBusy标记为true,禁止再向日志文件写入信息
        if(!isOK) {
            if(LogConfig.WRITE_TO_CONSOLE) {
                console.warn("logger busy");
            }
            logFileWriter.write('logger busy\n','utf-8');

            isLogBusy=true;
            logFileWriter.once('drain', function() {
                isLogBusy=false;

                if(LogConfig.WRITE_TO_CONSOLE) {
                    console.warn("logger restored");
                }
                logFileWriter.write('logger restored\n','utf-8');
            });
        }
    }
};

var createLogFileWriter=function(cb){
    if(cb)emitter.once('open',cb);
    if(isCreatingLogFileWriter)return;

    isCreatingLogFileWriter=true;
    var dateMess = LogConfig.ENABLE_ROLLING_LOG_FILE?
        moment().format(LogConfig.LOG_FILE_DATE_FORMAT):
        '';
    if(dateMess) dateMess = '_'+dateMess;
    var filePath=LogConfig.LOG_FILE+dateMess+'.log';

    /**
     * 注意:option的highWaterMark表示内部缓冲区大小,是通过测试得出来的,官方api上并未
     * 标明,node测试版本v0.10.35,如果不行还可以直接设置其内部属性:
     * writer._writableState.highWaterMark = LogConfig.LOG_BUFFER_SIZE
     */
    var writer=fs.createWriteStream(filePath,
        {flags: 'a',encoding: 'utf-8',mode: 0666,highWaterMark:LogConfig.LOG_BUFFER_SIZE});
    writer.setMaxListeners(1000);

    //需要在文件打开后写入日志，如果文件不存在，会自动创建
    writer.once('open',function(fd){
        logFileWriter=writer;
        isCreatingLogFileWriter=false;
        isLogBusy=false;
        emitter.emit('open');
    });

    //如果写入出错，直接抛出错误
    writer.once('error',function(err){
        console.error(err,'写入日志信息时发生错误');
        throw err;
    });
};

var resetFileWriter=function(){
    if(!logFileWriter)return ;

    //重新设置logFileWriter为undefined后，
    //调用writeLogToFile()将获取新的writer
    var writer=logFileWriter;
    logFileWriter=undefined;

    //关闭写入流
    writer.end();

    setTimeout(resetFileWriter,LogConfig.LOG_FILE_TIMEOUT);
};

module.exports = function(tag) {
    tag = tag || "NO_TAG";
    return new Logger(tag);
};

if(LogConfig.ENABLE_ROLLING_LOG_FILE) setTimeout(resetFileWriter,LogConfig.LOG_FILE_TIMEOUT);