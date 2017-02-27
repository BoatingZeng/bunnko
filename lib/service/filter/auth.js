/**
 * Created by Boating on 2017/2/2.
 */

var logger = gobj.Logger('auth');
module.exports = function(req, res, next){
    if(req.path == '/') return res.redirect('/home.html');
    if(req.path.indexOf('/public') == 0 || req.path.indexOf('/api/v1/public') == 0) return next();
    var s = req.session;
    if(s && s.user){
        return next();
    }
    if(req.xhr){
        var data = {
            msg: '无访问权限'
        };
        res.status(401).json(data);
    } else {
        res.redirect('/user.html');
    }
};