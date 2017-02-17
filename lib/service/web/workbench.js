/**
 * Created by Boating on 2017/2/17.
 */

function workbench(req, res, next){
    var view = 'workbench';
    var data = {
        lockUpdateInterval: gobj.WorkConfig.LOCK_UPDATE_INTERVAL,
        user: req.session.user.user
    };
    res.render(view, data);
}

exports.mapping = [
    ['get', '/', workbench]
];