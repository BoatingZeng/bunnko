/**
 * Created by Boating on 2017/1/10.
 */
var path = require('path');
var APP_ROOT_DIR = path.resolve(__dirname, '../..');

module.exports = {
    APP_ROOT_DIR: APP_ROOT_DIR,
    LOG: {
        LOG_LEVEL_MAP: {
            VERBOSE: 0,
            DEBUG: 1,
            INFO: 2,
            WARN: 3,
            ERROR: 4,
            FATAL: 5
        },
        LEVEL: 'DEBUG',
        LOG_FILE: path.join(APP_ROOT_DIR, 'log/log'),
        WRITE_TO_CONSOLE: true,
        WRITE_TO_FILE: false,
        ENABLE_ROLLING_LOG_FILE: true,//是否启用滚动日志文件，如果为true，则会按照以下设置定时使用新的日志文件
        LOG_BUFFER_SIZE: 1024*1024,//写入流的内部缓冲区大小,一旦写入缓冲大于此值,后续的log就会被抛弃掉,无法写入日志文件,直至缓冲低于此值,不设置即为默认的16kb(16384)
        LOG_FILE_DATE_FORMAT: 'YYYY-MM-DD',//日志文件日期格式，需要与日志文件超时时间对应
        LOG_FILE_TIMEOUT: 30*24*60*60*1000 //多少毫秒后创建新的日志文件
    },
    SERVER: {
        LISTEN_PORT: 8087,
        STOP_TIMEOUT: 5*1000, //在停止服务器开始后等待多少毫秒，强制终止服务器进程
        SERVICE_DIR: path.join(APP_ROOT_DIR,'lib/service'),
        HOME_SERVICE: 'home',
        VIEW_ENGINE: require('ejs').renderFile, //View模板文件扩展名使用EXPRESS_OPTIONS的'views engine'
        //Express选项配置，可配置项参考http://expressjs.com/api.html#app-settings
        EXPRESS_OPTIONS: {
            'trust proxy': true,
            'view engine': 'ejs',
            'view cache': false,
            'views': path.join(APP_ROOT_DIR, 'views')
        },

        ASSETS: {
            FAVICON: path.join(APP_ROOT_DIR, 'public/favicon.ico'),
            PREFIX: '',
            DIR: path.join(APP_ROOT_DIR, 'public'),
            OPTIONS: {
                maxAge: 60*1000//公共资源在浏览器端的缓存毫秒数，超时后会重新向服务器请求获取新资源
            }
        },

        //存储session的store类型，可选项项包括LOCAL，MONGO，默认为LOCAL
        SESSION_STORE: 'LOCAL',

        //Session中间件配置,可配置项见https://github.com/expressjs/session
        SESSIONS: {
            secret: 'cookie_secret', //普通cookie也用这个secret
            key: 'bunnko.sid',
            resave: false,
            saveUninitialized: false,
            cookie: {
                path: '/',
                maxAge: 3*24*60*60*1000
            }
        }
    },

    MYSQL: {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'mysqlboating',
        database: 'bunnko'
    },

    MONGO_DB: {
        ENABLED: true,
        URL: 'mongodb://boating:boating@localhost:27017/test',
        OPTIONS: {
            //先用默认就行
        }
    }
};