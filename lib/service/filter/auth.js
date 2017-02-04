/**
 * Created by Boating on 2017/2/2.
 */

var logger = gobj.Logger('auth');
module.exports = function(req, res, next){
    var s = req.session;
    if(s && s.user){
        return next();
    }
    if(req.path.indexOf('user') != -1) return next();
    if(req.xhr){
        var data = {
            msg: '无访问权限'
        };
        res.status(401).json(data);
    } else {
        res.redirect('/user.html');
    }
};