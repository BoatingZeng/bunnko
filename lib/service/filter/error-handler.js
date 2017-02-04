/**
 * Created by Boating on 2017/2/4.
 */

var logger = gobj.Logger('error-handler.js');

exports.serverErrorHandler = function(err, req, res, next){
    logger.error('服务器内部错误', err);
    res.statusCode(500).json({msg: '500服务器内部错误'});
};

exports.notFoundErrorHandler = function(req, res, next){
    logger.warn('找不到请求的资源，URL：'+req.url);
    res.statusCode(404).json({msg: '404 Not Found'});
};