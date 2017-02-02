/**
 * Created by Boating on 2017/1/10.
 * 全局对象
 */
module.exports = global.gobj = {};

//添加配置对象
var appConfigName = 'app-config.js'; //默认配置文件
process.argv.forEach(function(val, index, array) {
    if(index == 3 && array[2] == '--appconfig') {
        // 如果指定了 appconfig 参数,则以该参数的值作为app-config的配置文件名
        appConfigName = val;
    }
});

gobj.format = require('util').format;

gobj.AppConfig = require('./lib/config/' + appConfigName);
gobj.WorkConfig = require('./lib/config/work-config.js');

gobj.util = require('./lib/common/util.js');
gobj.Logger = require('./lib/common/logger.js');

gobj.MongoDB = require('./lib/store/mongo-store.js');
gobj.MySqlStore = require('./lib/store/mysql-store.js');

gobj.bookStore = require('./lib/store/books-store.js');