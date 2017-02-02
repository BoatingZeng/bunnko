/**
 * Created by Boating on 2017/1/30.
 * 对mongoDB中书的数据进行访问。一本书就是一个collection。
 * collection中的一个document就是一个句子(或片段)，用index关键字标识。
 * index从1开始。
 */

var _ = require('underscore');
var logger = gobj.Logger('books-store.js');
var bookStore = {};
/**
 *
 * @param book {String} ISBN书号，或者其他唯一标识
 * @param range {Array} 范围。[1,1]表示第一句。[2,5]表示2至5句。
 * @param cb {Function} fn(err, docs)
 */
bookStore.findSentence= function(book, range, cb){
    if(!book || !_.isString(book)){
        return cb('书名参数不合法，需要String');
    }
    if(!range || !_.isArray(range) || range.length != 2 || !_.isNumber(range[0]) || !_.isNumber(range[1]) || range[0] > range[1]){
        return cb('index字段范围参数不合法');
    }
    gobj.mongodb.query(function(err, conn){
        if(err) {
            logger.error('获取mongoDB连接错误', err);
            return cb(err);
        }
        var col = conn.collection(book);
        var filter = {
            index: {$gte: range[0], $lte: range[1]}
        };
        col.find(filter).toArray(function(err, docs){
            if(err) logger.error('获取docs错误', err);
            cb(err, docs);
        });
    });
};

module.exports = bookStore;