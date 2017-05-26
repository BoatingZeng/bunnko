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
        LEVEL: 'WARN',
        LOG_FILE: path.join(APP_ROOT_DIR, 'log/log'),
        WRITE_TO_CONSOLE: false,
        WRITE_TO_FILE: true,
        ENABLE_ROLLING_LOG_FILE: true,//是否启用滚动日志文件，如果为true，则会按照以下设置定时使用新的日志文件
        LOG_BUFFER_SIZE: 1024*1024,//写入流的内部缓冲区大小,一旦写入缓冲大于此值,后续的log就会被抛弃掉,无法写入日志文件,直至缓冲低于此值,不设置即为默认的16kb(16384)
        LOG_FILE_DATE_FORMAT: 'YYYY-MM-DD',//日志文件日期格式，需要与日志文件超时时间对应
        LOG_FILE_TIMEOUT: 30*24*60*60*1000 //多少毫秒后创建新的日志文件
    },
    CLUSTER: {
        CHILD_SERVER_FILE: path.join(APP_ROOT_DIR, 'app.js'),
        CHILD_SERVER_COUNT: -1, //要启动的子服务器数，-1表示与主机的CPU核心数相同
        MAX_RECREATE_COUNT: 200, //子服务器最大重启次数，超过此次数后将停止重启子服务器,设置为-1表示不限制
        STOP_TIMEOUT: 5*1000  //在停止集群服务器开始后，等待多少毫秒后强制终止集群进程
    },
    SERVER: {
        SSL: {
            IS_SSL: true,
            PRIVATE_KEY: '/home/openssl/private.pem',
            CERTIFICATE: '/home/openssl/file.crt',
            PFX: '/home/openssl/214078385830857.pfx',
            PASSWORD: '/home/openssl/pfx-password.txt',
            PORT: 443
        },
        DOMAIN: 'www.dreamboat.xyz',
        LISTEN_PORT: 80,
        STOP_TIMEOUT: 5*1000, //在停止服务器开始后等待多少毫秒，强制终止服务器进程
        SERVICE_DIR: path.join(APP_ROOT_DIR,'lib/service'),
        HOME_SERVICE: 'home',
        VIEW_ENGINE: require('ejs').renderFile, //View模板文件扩展名使用EXPRESS_OPTIONS的'views engine'
        //Express选项配置，可配置项参考http://expressjs.com/api.html#app-settings
        EXPRESS_OPTIONS: {
            'trust proxy': true,
            'view engine': 'ejs',
            'view cache': true,
            'views': path.join(APP_ROOT_DIR, 'views')
        },

        ASSETS: {
            FAVICON: path.join(APP_ROOT_DIR, 'public/favicon.ico'),
            PREFIX: '',
            DIR: path.join(APP_ROOT_DIR, 'public'),
            OPTIONS: {
                maxAge: 24*60*60*1000//公共资源在浏览器端的缓存毫秒数，超时后会重新向服务器请求获取新资源
            }
        },

        JWT: {
            secret: 'boating secret',
            exp: 60*60*1000
        }
    },

    MYSQL: {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: 'mysqlboating',
        database: 'bunnko'
    }

    /*MONGO_DB: {
        ENABLED: false,
        URL: 'mongodb://boating:boating@localhost:27017/test',
        OPTIONS: {
            //先用默认就行
        }
    }*/
};
