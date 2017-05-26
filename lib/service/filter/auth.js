/**
 * Created by Boating on 2017/2/2.
 */
var jwt = require('jsonwebtoken');
var jwtconfig = gobj.AppConfig.SERVER.JWT;

var logger = gobj.Logger('auth');

module.exports = function(req, res, next){
    res.set('access-control-expose-headers', 'Authorization');
    if(req.path == '/') return res.redirect('/home.html');
    if(req.path.indexOf('/public') == 0 || req.path.indexOf('/api/v1/public') == 0) return next();
    var isAuth = false;
    var token = req.get('Authorization');
    if(token){
        token = token.split(/Bearer\:?\s?/i);
        token = token[token.length > 1 ? 1 : 0].trim();
        try {
            var data = jwt.verify(token, jwtconfig.secret);
        } catch(e) {
            logger.warn('用户携带非法token进入');
        }
        logger.debug(data);
        if(data && data.username && data.exp && (data.exp > (new Date()).getTime())){
            var newdata = {
                username: data.username,
                exp: (new Date()).getTime() + jwtconfig.exp
            };
            req.jwtData = newdata;
            var newtoken = jwt.sign(newdata, jwtconfig.secret);
            newtoken = 'Bearer ' + newtoken;
            res.set('Authorization', newtoken);
            isAuth = true;
        }
    }
    if(isAuth){
        next();
    } else {
        var resdata = {
            msg: '无访问权限'
        };
        res.status(401).json(resdata);
    }
};