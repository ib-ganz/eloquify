const { valueMapper } = require('../../util/helpers')
const logger = require('../../util/logger')

const whereRawMaker = (arg, bool = 'AND') => {
    if (typeof arg === 'string')
        return {
            '-': {
                opt: 'raw',
                value: arg,
                bool
            }
        }
    else {
        logger.errorLog(`${bool === 'AND' ? `'whereRaw'` : `'orWhereRaw'` } accept only string, ${typeof arg} given. Returning nothing...`)
    }
}

const whereMaker = (model, bool, nestedBool, ...arg) => {
    let r = []

    if (arg.length === 1) {
        if (typeof arg[0] === 'object') {
            const nestedModel = model.newInstance()
            for (const [key, value] of Object.entries(arg[0])) {
                if (nestedBool === 'AND')
                    nestedModel.when(
                        Array.isArray(value),
                        q => q.where(key, value[0], value[1]),
                        q => q.where(key, value)
                    )
                else
                    nestedModel.when(
                        Array.isArray(value),
                        q => q.orWhere(key, value[0], value[1]),
                        q => q.orWhere(key, value)
                    )
            }
            r.push({
                '-': {
                    opt: 'nested',
                    value: nestedModel,
                    bool
                }
            })
        }
        else if (typeof arg[0] === 'function') {
            const nestedModel = model.newInstance()
            arg[0](nestedModel)
            r.push({
                '-': {
                    opt: 'nested',
                    value: nestedModel,
                    bool
                }
            })
        }
    }
    else if (arg.length === 2) {
        r.push({
            [arg[0]]: {
                opt: 'equals',
                value: valueMapper(arg[1]),
                bool
            }
        })
    }
    else if (arg.length >= 3) {
        r.push({
            [arg[0]]: {
                opt: 'operator',
                operator: arg[1],
                value: valueMapper(arg[2]),
                bool
            }
        })
    }

    return r
}

const whereNotMaker = (model, bool, nestedBool, ...arg) => {
    let r = []

    if (arg.length === 1) {
        if (typeof arg[0] === 'object') {
            const nestedModel = model.newInstance()
            for (const [key, value] of Object.entries(arg[0])) {
                if (nestedBool === 'AND')
                    nestedModel.whereNot(key, value)
                else
                    nestedModel.orWhereNot(key, value)
            }
            r.push({
                '-': {
                    opt: 'nested',
                    value: nestedModel,
                    bool
                }
            })
        }
    }
    else if (arg.length >= 2) {
        r.push({
            [arg[0]]: {
                opt: 'not',
                value: valueMapper(arg[1]),
                bool
            }
        })
    }

    return r
}

const whereLikeMaker = (model, bool, nestedBool, ...arg) => {
    let r = []

    if (arg.length === 1) {
        if (typeof arg[0] === 'object') {
            const nestedModel = model.newInstance()
            for (const [key, value] of Object.entries(arg[0])) {
                if (nestedBool === 'AND')
                    nestedModel.whereLike(key, value)
                else
                    nestedModel.orWhereLike(key, value)
            }
            r.push({
                '-': {
                    opt: 'nested',
                    value: nestedModel,
                    bool
                }
            })
        }
    }
    else if (arg.length >= 2) {
        r.push({
            [arg[0]]: {
                opt: 'like',
                value: `'${arg[1]}'`,
                bool
            }
        })
    }

    return r
}

const whereNotLikeMaker = (model, bool, nestedBool, ...arg) => {
    let r = []

    if (arg.length === 1) {
        if (typeof arg[0] === 'object') {
            const nestedModel = model.newInstance()
            for (const [key, value] of Object.entries(arg[0])) {
                if (nestedBool === 'AND')
                    nestedModel.whereNotLike(key, value)
                else
                    nestedModel.orWhereNotLike(key, value)
            }
            r.push({
                '-': {
                    opt: 'nested',
                    value: nestedModel,
                    bool
                }
            })
        }
    }
    else if (arg.length >= 2) {
        r.push({
            [arg[0]]: {
                opt: 'not_like',
                value: `'${arg[1]}'`,
                bool
            }
        })
    }

    return r
}

const whereInMaker = (col, positive, arr, bool = 'AND') => {
    if (typeof col !== 'string' || !Array.isArray(arr)) {
        logger.errorLog(`${bool === 'AND' ? `'whereIn'` : `'orWhereIn'` } function signature is (string, array), (${typeof col}, ${typeof arr}) given. Returning nothing...`)
        return
    }
    return {
        [col]: {
            opt: positive ? 'in' : 'not_in',
            value: `(${arr.join()})`,
            bool
        }
    }
}

const whereNullMaker = (col, bool = 'AND') => {
    if (Array.isArray(col)) {
        return col.map(v => ({
            [v]: {
                opt: 'isnull',
                value: `null`,
                bool
            }
        }))
    }

    return {
        [col]: {
            opt: 'isnull',
            value: `null`,
            bool
        }
    }
}

const whereNotNullMaker = (col, bool = 'AND') => {
    if (Array.isArray(col)) {
        return col.map(v => ({
            [v]: {
                opt: 'isnotnull',
                value: `null`,
                bool
            }
        }))
    }

    return {
        [col]: {
            opt: 'isnotnull',
            value: `null`,
            bool
        }
    }
}

module.exports = {
    whereMaker,
    whereRawMaker,
    whereNotMaker,
    whereInMaker,
    whereLikeMaker,
    whereNotLikeMaker,
    whereNullMaker,
    whereNotNullMaker
}