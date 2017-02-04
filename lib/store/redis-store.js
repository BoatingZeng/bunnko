/**
 * Created by Boating on 2017/2/4.
 */

var logger = gobj.Logger('redis-store.js');

var redis = require('redis');
var client = redis.createClient();

client.on('error', function(err){
    logger.error('Redis错误', err);
});

client.on('connect', function(){
    logger.debug('Redis connect 事件。')
});

client.on('ready', function(){
    logger.debug('Redis ready 事件。')
});

client.on('reconnecting', function(delay, attempt){
    logger.warn(gobj.format('Redis 重连。delay：%d。attempt：%d。', delay, attempt));
});

client.on('end', function(){
    logger.error('Redis 连接非法关闭。');
});

module.exports = client;