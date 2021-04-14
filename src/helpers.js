const { DB } = require("./DB");
const { Aggregate } = require('./DB');

const filterColumns = (cols, allowed) => {
    return Object.keys(cols)
        .filter(key => allowed.includes(key))
        .reduce((obj, key) => {
            obj[key] = cols[key];
            return obj;
        }, {});
}

const valueMapper = (v) => {
    if (typeof v === 'string') {
        return v.startsWith("'") && v.endsWith("'") ? v : `'${v}'`;
    }
    if (typeof v === 'number') {
        return `${v}`;
    }
    if (typeof v === 'boolean') {
        return `${v}`;
    }
    return `${v}`;
}

const getWhereFromHas = (model, value) => {
    let q = '';
    const { relName, outerTable, func, operator, num } = value;
    const relationships = model.getRelation();
    const relationship = relationships.find(v => Object.keys(v)[0] === relName);
    if (relationship) {
        const relation = relationship[relName];
        const tbl = classModelToTable(relation.model);
        const childModel = new relation.model();
        const query = childModel
            .whereRaw(`${tbl}.${relation.foreign_key} = ${outerTable}.${relation.local_key}`)
            .when(func, q => { func(q) })

        if (operator && num) {
            q = `(${query.select(DB.count()).getQuery()}) ${operator} ${num}`
        }
        else {
            q = `EXISTS ( ${query.getQuery()})`
        }
    }
    return q
}

const whereMapper = (model, tbl, wheres) => {
    const setKey = (tbl, key) => key.includes('.') ? key : `${tbl}.${key}`;

    let w = [];
    wheres.forEach(where => {
        for (const [key, value] of Object.entries(where)) {
            const col = setKey(tbl, key)
            if (value && typeof value === 'object') {
                if (value.opt === 'raw')
                    w.push(value.value);
                else if (value.opt === 'equals')
                    w.push(`${col} = ${value.value}`);
                else if (value.opt === 'in')
                    w.push(`${col} IN ${value.value}`);
                else if (value.opt === 'like')
                    w.push(`${col} LIKE ${value.value}`);
                else if (value.opt === 'not')
                    w.push(`${col} != ${value.value}`);
                else if (value.opt === 'isnull')
                    w.push(`${col} IS NULL`);
                else if (value.opt === 'isnotnull')
                    w.push(`${col} IS NOT NULL`);
                else if (value.opt === 'has')
                    w.push(getWhereFromHas(model, value.value))
            }
            else
                w.push(`${col} = ${valueMapper(value)}`);
        }
    })
    return w.filter(v => v.trim()).join(' AND ');
}

const camelToSnakeCase = str => str.replace(/(?:^|\.?)([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "");

const classModelToTable = model => {
    return new model().getTable() || camelToSnakeCase(model.name);
}

const containsAggregate = q => {
    for(const v of q) {
        if (typeof v === 'object' && v instanceof Aggregate) {
            return true;
        }
    }
    return false;
}

const buildSelect = s => {
    if (s.length === 0)
        return '*';

    const r = s.map(v => {
        if (typeof v === 'object' && v instanceof Aggregate)
            return `${v.fun}(${v.arg})`;
        return [...new Set(v.split(','))].map(v => v.trim()).join(',');
    }).join(',');

    return [...new Set(r.split(','))].map(v => v.trim()).join(', ');
}

const checkJoinArg = o => {
    if (typeof o === 'object')
        return `${o.getTable() || camelToSnakeCase(o.constructor.name)} AS ${o.getAs()}`
    else
        return o;
}

module.exports = {
    filterColumns,
    valueMapper,
    whereMapper,
    camelToSnakeCase,
    classModelToTable,
    containsAggregate,
    buildSelect,
    checkJoinArg,
}