/**
 * Created by Boating on 2017/1/10.
 */

var logger = gobj.Logger('service/index.js');

var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var express = require('express');

var ServerConfig = gobj.AppConfig.SERVER;
var auth = require('./filter/auth.js');

exports.routes = function() {
    logger.verbose('注册API接口服务中间件：/api');
    var apiRouter = express.Router();
    apiRouter.use(auth);
    // 注册 /lib/service/api目录的接口路由
    registerService(apiRouter, path.join(ServerConfig.SERVICE_DIR, 'api'));

    logger.verbose('注册WEB路由服务中间件');
    var webRouter = express.Router();
    webRouter.use(auth);
    registerService(webRouter, path.join(ServerConfig.SERVICE_DIR, 'web'));

    return express.Router()
        .use('/api', apiRouter)
        .use(webRouter);
};

/** 注册路由服务,默认注册'lib/service'目录下所有module */
var registerService = function(router, serviceDir) {
    var fileInfos = getAllJSFileInfos(serviceDir);

    var isAllRegistered = true;
    for(var i= 0,len=fileInfos.length; i<len; i++) {
        var fileInfo = fileInfos[i];

        var m = require(fileInfo.filePath);
        if(!m) continue;

        var rootUrl = '/' + fileInfo.fileName;
        logger.verbose("注册服务类：" + rootUrl);

        // 使用mapping注册监听器
        var mappings = m.mapping;
        if(_.isObject(m) && mappings && _.isArray(mappings)) {
            for(var j=0; j<mappings.length; j++) {
                var mp = mappings[j];
                var method = mp[0];
                var url = mp[1];

                if(!method || !url)
                    continue;

                var bSuccess = true;
                var arrayFn = [];
                // 把fn函数添加到数组里(运用了递归)
                var addFnToArray = function(element) {
                    if(_.isArray(element)) {
                        for(var key in element) {
                            addFnToArray(element[key]);
                        }
                    } else if(_.isFunction(element)) {
                        arrayFn.push(element);
                    } else {
                        bSuccess = false;
                    }
                };
                for(var k=2; k<mp.length; k++) {
                    // 遍历mapping数组的2到结束所有元素,再递归把里面所有的函数添加到arrayFn数组里
                    var element = mp[k];
                    addFnToArray(element);
                }

                if(url == '/') {
                    url = '';
                } else if(url.indexOf('/')!=0) {
                    url = '/' + url;
                }
                if(fileInfo.fileName != ServerConfig.HOME_SERVICE) {
                    url = rootUrl + url;
                } else if(url == '') {
                    url = '/';
                }

                if(!bSuccess || arrayFn.length == 0) {
                    logger.error(gobj.format('注册服务"%s","%s"失败,请检查对应的路由函数代码', method, url));
                    isAllRegistered = false;
                    continue;
                }

                logger.verbose(gobj.format('注册服务"%s","%s"', method, url));
                router[method](url,arrayFn);
            }
        }
    }

    if(!isAllRegistered) {
        logger.error('警告,部分路由服务注册失败,请检查相关的路由函数代码');
    }
};

/**
 * 获取指定目录下所有js文件信息，此方法支持递归查找子目录
 * 但排除.svn文件夹
 * @param dir 当前查找目录
 * @param root 遍历的根目录
 * @returns {Array} 查找目录的所有文件信息数组
 */
var getAllJSFileInfos = function(dir, root) {
    if(!root) {
        // 未指定root根目录参数的,表示当前查找目录即为根目录
        root = dir;
    }
    var beginPos = root.length + 1;

    var fileInfos = [];
    var fileNames = fs.readdirSync(dir);
    fileNames.forEach(function(fileName) {
        if (!fileName || fileName.charAt(0) === ".") {
            // 以点开头的文件或目录多为软件自动生成的隐藏文件或目录(如.svn、.git、.idea),无需遍历,过滤掉
            return;
        }

        var sub = dir + '/' + fileName;
        var stat = fs.lstatSync(sub);

        if (stat.isDirectory()) {
            // 目录
            var subFileInfos = getAllJSFileInfos(sub, root);
            // 越深层的文件信息越靠前,所以这里是subFildInfos吞并fileInfos,而不是fileInfos吞并subFileInfos
            fileInfos = subFileInfos.concat(fileInfos);
        } else if (stat.isFile()) {
            // 文件
            var index = sub.lastIndexOf(".js");
            if(index != -1) {
                // js脚本文件
                var fileInfo = {};
                fileInfo.fileName = sub.substring(beginPos, index);
                fileInfo.filePath = path.join(dir, fileName);
                fileInfos.push(fileInfo);
            }
        }
    });
    return fileInfos;
};