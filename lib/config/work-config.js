var path = require('path');
var APP_ROOT_DIR = path.resolve(__dirname, '../..');

module.exports = {
    BOOK_JSON:{
        path: path.join(APP_ROOT_DIR, 'data')
    },
    LOCK_UPDATE_INTERVAL: 5*60*1000, //客户端更新页锁的间隔
    LOCK_EXPIRED_TIME: 6*60*1000  //页锁的过期时间
};