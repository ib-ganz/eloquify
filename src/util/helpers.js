const { DB } = require("../DB")
const { Aggregate } = require('../DB')
const { Model, Query, Relation } = require('../builder/data/constraint-type')
const logger = require('./logger')

const addHiddenProperty = (obj, propKey, propValue) => {
    Object.defineProperty(obj, propKey, {
        value: propValue,
        enumerable: false,
        writable: true
    })
}

const filterColumns = (cols, allowed) => {
    return Object.keys(cols)
        .filter(key => allowed.includes(key))
        .reduce((obj, key) => {
            obj[key] = cols[key]
            return obj
        }, {})
}

const valueMapper = (v) => {
    if (typeof v === 'string') {
        return v.startsWith("'") && v.endsWith("'") ? v : `'${v}'`
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
        return `${v}`
    }
    return `${v}`
}

const getWhereFromHas = (withBool, model, value) => {
    let q = undefined
    const { relName, outerTable, func, operator, num, bool } = value
    if (typeof model[relName] === 'function') {
        const childModel = model[relName]()
        const relation = childModel.getRelationConstraint(Relation.PARENT)
        const tbl = childModel.getTableName()
        const query = childModel
            .when(
                relation.type === 'belongs_to',
                q => q.whereRaw(`${tbl}.${relation.owner_key} = ${outerTable}.${relation.foreign_key}`),
                q => q.whereRaw(`${tbl}.${relation.foreign_key} = ${outerTable}.${relation.local_key}`)
            )
            .when(func, q => { func(q) })

        const b = withBool ? `${bool} ` : ''

        if (operator && num) {
            q = `${b}(${query.select(DB.count()).query().trim()}) ${operator} ${num}`
        }
        else {
            q = `${b}EXISTS (${query.query().trim()})`
        }
    }
    else {
        logger.errorLog(`Relation '${relName}' doesn't exist on ${model.constructor.name} class`)
    }
    return q
}

const whereMapper = (model, tbl, wheres) => {
    const setKey = (tbl, key) => key.includes('.') ? key : `${tbl}.${key}`

    let w = []
    wheres.forEach((where, i) => {
        const withBool = i > 0
        for (const [key, value] of Object.entries(where)) {
            const col = setKey(tbl, key)
            const bool = withBool ? `${value.bool} ` : ''

            if (value && typeof value === 'object') {
                if (value.opt === 'raw')
                    w.push(`${bool}${value.value}`)
                else if (value.opt === 'equals')
                    w.push(`${bool}${col} = ${value.value}`)
                else if (value.opt === 'in')
                    w.push(`${bool}${col} IN ${value.value}`)
                else if (value.opt === 'like')
                    w.push(`${bool}${col} LIKE ${value.value}`)
                else if (value.opt === 'not')
                    w.push(`${bool}${col} != ${value.value}`)
                else if (value.opt === 'isnull')
                    w.push(`${bool}${col} IS NULL`)
                else if (value.opt === 'isnotnull')
                    w.push(`${bool}${col} IS NOT NULL`)
                else if (value.opt === 'has') {
                    const where = getWhereFromHas(withBool, model, value.value)
                    if (where !== undefined) w.push(where)
                }
            }
            else
                w.push(`${col} = ${valueMapper(value)}`)
        }
    })
    return w.filter(v => v.trim()).join(' ')
}

const camelToSnakeCase = str => str.replace(/(?:^|\.?)([A-Z])/g, function (x,y){return "_" + y.toLowerCase()}).replace(/^_/, "")

const classModelToTable = model => {
    return new model().getTable() || camelToSnakeCase(model.name)
}

const containsAggregate = q => {
    for(const v of q) {
        if (typeof v === 'object' && v instanceof Aggregate) {
            return true
        }
    }
    return false
}

const buildSelect = s => {
    if (s.length === 0)
        return '*'

    const r = s.map(v => {
        if (typeof v === 'object' && v instanceof Aggregate)
            return `${v.fun}(${v.arg})`
        return [...new Set(v.split(','))].map(v => v.trim()).join(',')
    }).join(',')

    return [...new Set(r.split(','))].map(v => v.trim()).join(', ')
}

const checkJoinArg = o => {
    if (typeof o === 'object') {
        const tbl = (typeof o.getTable === 'function' ? o.getTable() : o.getTableName()) || camelToSnakeCase(o.constructor.name)
        return `${tbl} AS ${o.getQueryConstraint(Query.AS)}`
    }
    else
        return o
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
    addHiddenProperty,
}