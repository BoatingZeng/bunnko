/**
 * Created by Boating on 2017/2/27.
 */

var logger = gobj.Logger('bookshelf.js');
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

exports.mapping = [
    ['get', '/', getList],
    ['get', '/:book', getBookDetail],
    ['get', '/:book/:page', getPage]
];