/**
 * Created by Boating on 2017/2/2.
 */

var workspace = function(req, res, next){
    var view = 'workspace';
    var data = {
        lockUpdateInterval: gobj.WorkConfig.LOCK_UPDATE_INTERVAL,
        user: req.session.user.user
    };
    res.render(view, data);
};
exports.mapping = [
    ['get', '/', workspace]
];