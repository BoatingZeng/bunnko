/**
 * Created by Boating on 2017/1/11.
 * 这个文件放各种工具
 */

var _ = require('underscore');
var mysql = require('mysql');
var util = {};
/**
 *
 * @param table  {String}
 * @param where  {Object}
 * @param fields {Array} 字段数组
 * @param orderBy {Object} 形式：{field: 'asc'}或{field: 'desc'}
 * @param limit
 */
util.sqlSelect = function(table, where, fields, orderBy, limit){
    var sql = ['select'];
    var fieldsStr = fields && fields.length > 0 ? fields.join(',') : '*';
    sql.push(fieldsStr);
    sql.push('from');
    sql.push(mysql.escapeId(table));

    if(where){
        where = sqlWhere(where);
        sql.push('where');
        sql.push(where);
    }

    if(orderBy){
        sql.push('order by');
        for(var f in orderBy){
            if(!orderBy.hasOwnProperty(f)) continue;
            sql.push(f);
            sql.push(orderBy[f]);
            sql.push(',');
        }
        sql.pop(); //去掉最后一个逗号
    }

    if(limit){
        sql.push('limit');
        sql.push(limit);
    }

    return sql.join(' ');
};

/**
 * 生成sql insert 语句，插入单个记录，如果要插入多个，就用多条语句好了
 * @param table {String} 表名
 * @param item {Object} 要插入的项， 单个
 * @return {String} sql语句
 */
util.sqlInsert = function(table, item){
    var tem = 'insert into ?? (??) values (?);';
    var fields = [];
    var values = [];
    for(var field in item){
        if(!item.hasOwnProperty(field)) continue;
        fields.push(field);
        values.push(item[field]);
    }
    return mysql.format(tem, [table, fields, values]);
};


/**
 * 获取update语句
 * @param table
 * @param item
 * @param where
 * @return {String} sql语句
 */
util.sqlUpdate = function(table, item, where){
    var tem = 'update ?? set ? where ';
    return mysql.format(tem, [table, item]) + sqlWhere(where);
};

/**
 *
 * @param table
 * @param where
 */
util.sqlDelete = function(table, where){
    var tem = 'delete from ?? where ';
    return mysql.format(tem, [table]) + sqlWhere(where);
};

/**
 * 只做最简单的and和=逻辑
 * @param where
 */
function sqlWhere(where){
    if(_.isString(where)) return where;
    var logic = 'and';
    var symble = '=';
    var objArray = objectToArray(where);
    if(objArray.length == 0) return '';

    var sql = [];
    var params = [];
    var fields = objArray[0];
    var values = objArray[1];

    for(var i=0; i<fields.length; i++){
        sql.push('??'+symble+'?');
        sql.push(logic);
        params.push(fields[i]);
        params.push(values[i]);
    }
    sql.pop(); //去掉最后的logic符号
    return mysql.format(sql.join(' '), params);
}

//对象转换为[[keys], [values]]
function objectToArray(obj){
    if(!obj) return [];
    var keys = [];
    var values = [];
    for(var k in obj){
        if(!obj.hasOwnProperty(k)) continue;
        var v = obj[k];
        if(!_.isUndefined(v)){
            keys.push(k);
            values.push(v);
        }
    }
    return keys.length == 0 ? [] : [keys, values];
}

module.exports = util;