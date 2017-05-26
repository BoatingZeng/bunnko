/**
 * Created by Boating on 2017/1/31.
 */

var logger = gobj.Logger('workbench.js');
var fs = require('fs');
var path = require('path');
var async = require('async');
var dataPath = gobj.WorkConfig.BOOK_JSON.path;

function getList(req, res, next){
    var sql = gobj.util.sqlSelect('t_book');
    gobj.sqlStore.query(sql, function(err, rows){
        if(err) return next(err);
        res.json(rows);
    });
}

function getBookDetail(req, res, next){
    var book = req.params.book;
    var bookPath = path.join(dataPath, book);
    if(!fs.existsSync(bookPath)){
        var s = {
            msg: gobj.format('目录[%s]不存在', book)
        };
        return res.status(404).json(s);
    }
    fs.readdir(bookPath, function(err, files){
        if(err) return next(err);
        var list = [];
        for(var i=0; i<files.length; i++){
            var name = files[i];
            var indexStr = name.substring(0,name.indexOf('.json'));
            var index = parseInt(indexStr);
            list[index] = indexStr;
        }
        res.json(list);
    });
}

function getPage(req, res, next){
    var book = req.params.book;
    var page = req.params.page;
    var bookPath = path.join(dataPath, book);
    var pagePath = path.join(bookPath, page+'.json');
    if(!fs.existsSync(pagePath)){
        var s = {
            msg: gobj.format('书[%s]的[%s]页不存在', book, page)
        };
        return res.status(404).json(s);
    }
    fs.readFile(pagePath, 'utf8', function(err, data){
        if(err) return next(err);
        res.json(JSON.parse(data));
    });
}

function createBook(req, res, next){
    var data = req.body;
    var isbn = data.isbn;
    var bookPath = path.join(dataPath, isbn);
    //logger.debug(bookPath);
    if(fs.existsSync(bookPath)){
        var s = {
            msg: gobj.format('书籍目录[%s]已存在', isbn)
        };
        return res.status(409).json(s);
    }
    async.series([
        function(cb){
            fs.mkdir(bookPath,cb);
        },
        function(cb){
            var sql = gobj.util.sqlInsert('t_book', data);
            gobj.sqlStore.query(sql, function(err){
                if(err){
                    logger.error('创建书籍时插入数据库失败，删除目录：'+isbn);
                    fs.rmdirSync(bookPath);
                }
                cb(err);
            });
        }
    ], function(err){
        if(err) return next(err);
        var s = {
            msg: '创建书籍成功'
        };
        res.json(s);
    });
}

function updatePage(req, res, next){
    var book = req.params.book;
    var page = req.params.page;
    var data = req.body;
    var bookPath = path.join(dataPath, book);
    if(!fs.existsSync(bookPath)){
        var s = {
            msg: gobj.format('目录[%s]不存在', book)
        };
        return res.status(404).json(s);
    }
    var pagePath = path.join(bookPath, page+'.json');
    var str = JSON.stringify(data, null, 2);
    var user = req.jwtData.username;
    var now = new Date();
    var where = {
        user: user,
        isbn: book,
        page: page,
        expired_time: {$gt: now}
    };
    var sql = gobj.util.sqlSelect('t_lock', where);
    logger.debug(sql);
    gobj.sqlStore.query(sql, function(err, rows){
        if(err) return next(err);
        if(!rows || rows.length == 0){
            return res.status(409).json({msg: '状态冲突。你不是当前编辑者。或者你打开了多个编辑器。'});
        }
        fs.writeFile(pagePath, str, function(err){
            if(err) return next(err);
            var s = {
                msg: gobj.format('更新书[%s]的[%s]页成功', book, page)
            };
            res.json(s);
        });
    });
}

function createPage(req, res, next){
    var book = req.params.book;
    var bookPath = path.join(dataPath, book);
    var tem = [
        {
            o: '',
            t: ''
        }
    ];
    if(!fs.existsSync(bookPath)){
        var s = {
            msg: gobj.format('目录[%s]不存在', book)
        };
        return res.status(404).json(s);
    }
    fs.readdir(bookPath, function(err, files){
        if(err) return next(err);
        var list = [];
        for(var i=0; i<files.length; i++){
            var name = files[i];
            var indexStr = name.substring(0,name.indexOf('.json'));
            var index = parseInt(indexStr);
            list[index] = indexStr;
        }
        var page = list.length;
        var pagePath = path.join(bookPath, page+'.json');
        var str = JSON.stringify(tem, null, 2);
        fs.writeFile(pagePath, str, function(err){
            if(err) return next(err);
            var s = {
                msg: gobj.format('创建书[%s]的[%s]页成功', book, page)
            };
            res.json(s);
        });
    });
}

//查询有没有当前编辑者，如果有，获取当前编辑者的名字。没有，则你成为当前编辑者。
function updateLock(req, res, next){
    var data = req.body;
    var isbn = data.isbn;
    var page = data.page;
    async.series([
        function(cb){
            var now = new Date();
            var where = {
                isbn: isbn,
                page: page,
                expired_time: {$gt: now}
            };
            var fields = ['user'];
            var orderBy = {expired_time: 'asc'};
            var sql = gobj.util.sqlSelect('t_lock', where, fields, orderBy);
            logger.debug(sql);
            gobj.sqlStore.query(sql, function(err, rows){
                if(err) return cb(err);
                var d = {
                    currentEditor: ''
                };
                if(!rows || rows.length == 0){
                    return cb(null, d);
                }
                if(rows.length > 1) logger.warn('锁状态冲突，冲突数：'+rows.length);
                d.currentEditor = rows[0].user;
                cb(null, d);
            });
        }
    ],function(err, result){
        if(err) return next(err);
        var d = result[0];
        var user = req.jwtData.username;
        var currentEditor = d.currentEditor;
        if(currentEditor && currentEditor != user) return res.json(d);
        var where = {
            user: user
        };
        var expired_time = (new Date()).getTime() + gobj.WorkConfig.LOCK_EXPIRED_TIME;
        var example = {
            isbn: isbn,
            page: page,
            expired_time: new Date(expired_time)
        };
        var sql = gobj.util.sqlUpdate('t_lock', example, where);
        //logger.debug(sql);
        gobj.sqlStore.query(sql, function(err){
            if(err) return next(err);
            var d = {
                currentEditor: user
            };
            res.json(d);
        });
    });
}

exports.mapping = [
    ['get', '/', getList],
    ['post', '/', createBook],
    ['get', '/:book', getBookDetail],
    ['get', '/:book/:page', getPage],
    ['post', '/:book/page', createPage],
    ['put', '/:book/:page', updatePage],
    ['post', '/updateLock', updateLock]
];