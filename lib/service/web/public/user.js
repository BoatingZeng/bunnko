/**
 * Created by Boating on 2017/2/2.
 */
var jwt = require('jsonwebtoken');
var logger = gobj.Logger('user.js');
var jwtconfig = gobj.AppConfig.SERVER.JWT;

function login(req, res, next){
    var user = req.body.username || req.body.user;
    var psw = req.body.password || req.body.psw;
    var where = {
        user: user,
        psw: psw
    };
    var sql = gobj.util.sqlSelect('t_user', where);
    gobj.sqlStore.query(sql, function(err, rows){
        if(err){
            logger.error('登录出错', err);
            return res.sendStatus(403);
        }
        if(!rows || rows.length == 0){
            return res.sendStatus(403);
        }
        var data = {
            username: rows[0].user,
            exp: (new Date()).getTime() + jwtconfig.exp
        };
        var token = jwt.sign(data, jwtconfig.secret);
        token = 'Bearer ' + token;
        res.set('Authorization', token);
        res.sendStatus(200);
    });
}

function register(req, res, next){
    var data = req.body;
    if(!data.user || !data.psw) {
        var s = {
            msg: '没有用户名或密码'
        };
        return res.status(403).json(s);
    }
    var sql1 = gobj.util.sqlInsert('t_user', data);
    var e = {
        user: data.user,
        expired_time: new Date()
    };
    var sql2 = gobj.util.sqlInsert('t_lock',e);
    var sqls = [sql1, sql2];
    gobj.sqlStore.batchQuery(sqls, function(err){
        if(err) {
            logger.error('注册错误', err);
            res.sendStatus(403);
        } else {
            res.sendStatus(200);
        }
    });
}

exports.mapping = [
    ['post', '/login', login],
    ['post', '/register', register]
];