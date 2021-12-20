const { Query, Relation } = require('../builder/data/constraint-type')
const { DB } = require("../DB")
const logger = require('../util/logger')

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
    const b = withBool ? `${bool} ` : ''

    if (typeof model[relName] === 'function') {
        const childModel = model[relName]()
        const relation = childModel.getRelationConstraint(Relation.PARENT)
        const tbl = childModel.getTableName()
        const query = childModel
            .emptyLimit()
            .when(
                relation.type === 'belongs_to',
                q => q.whereRaw(`${tbl}.${relation.owner_key} = ${outerTable}.${relation.foreign_key}`),
                q => q.whereRaw(`${tbl}.${relation.foreign_key} = ${outerTable}.${relation.local_key}`)
            )
            .when(func, q => { func(q) })

        if (operator && num) {
            q = `${b}(${query.select(DB.count()).query().trim()}) ${operator} ${num}`
        }
        else {
            q = `${b}EXISTS (${query.query().trim()})`
        }
    }
    else {
        const name = !!func ? `whereHas(${relName})` : `has(${relName})`
        logger.errorLog(`Relation '${relName}' doesn't exist on ${model.constructor.name} class. Returning falsy condition from '${name}'...`)
        q = `${b}false`
    }
    return q
}

const compileWhere = (model, tbl, wheres) => {

    const setKey = (tbl, key) => key.includes('.') ? key : `${tbl}.${key}`

    let w = []
    wheres.forEach((where, i) => {
        if (where) {
            const withBool = i > 0
            for (const [key, value] of Object.entries(where)) {
                const col = setKey(tbl, key)
                const bool = withBool ? `${value.bool} ` : ''

                if (value && typeof value === 'object') {
                    if (value.opt === 'raw')
                        w.push(`${bool}${value.value}`)
                    else if (value.opt === 'equals')
                        w.push(`${bool}${col} = ${value.value}`)
                    else if (value.opt === 'not')
                        w.push(`${bool}${col} != ${value.value}`)
                    else if (value.opt === 'operator')
                        w.push(`${bool}${col} ${value.operator} ${value.value}`)
                    else if (value.opt === 'like')
                        w.push(`${bool}${col} LIKE ${value.value}`)
                    else if (value.opt === 'not_like')
                        w.push(`${bool}${col} NOT LIKE ${value.value}`)
                    else if (value.opt === 'in')
                        w.push(`${bool}${col} IN ${value.value}`)
                    else if (value.opt === 'not_in')
                        w.push(`${bool}${col} NOT IN ${value.value}`)
                    else if (value.opt === 'isnull')
                        w.push(`${bool}${col} IS NULL`)
                    else if (value.opt === 'isnotnull')
                        w.push(`${bool}${col} IS NOT NULL`)
                    else if (value.opt === 'has') {
                        const where = getWhereFromHas(withBool, model, value.value)
                        if (where !== undefined) w.push(where)
                    }
                    else if (value.opt === 'nested') {
                        const model = value.value
                        const nestedWhere = compileWhere(model, model.getAsOrTableName(), model.getQueryConstraint(Query.WHERE))
                        w.push(`${bool}(${nestedWhere})`)
                    }
                }
                else
                    w.push(`${col} = ${valueMapper(value)}`)
            }
        }
    })
    return w.filter(v => v.trim()).join(' ')
}

module.exports = { compileWhere }