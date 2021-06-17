const { checkJoinArg } = require('../../util/helpers')

const hasMaker = (model, has, operator, num, bool = 'AND') => {
    return {
        '-': {
            opt: 'has',
            value: {
                relName: has,
                outerTable: model.getAsOrTableName(),
                operator,
                num,
                bool
            }
        }
    }
}

const whereHasMaker = (model, has, func, operator, num, bool = 'AND') => {
    return {
        '-': {
            opt: 'has',
            value: {
                relName: has,
                outerTable: model.getAsOrTableName(),
                func,
                operator,
                num,
                bool
            }
        }
    }
}

const withMaker = (...w) => {
    let res = []

    if (typeof w === 'string')
        res.push(w)
    else
        w.forEach(v => res.push(v))

    res = [...new Set(res)]

    return res
}

const joinMaker = (type, ...arg) => {
    let join = ''

    if (arg.length === 1)
        join = `JOIN ${arg[0]} `
    else if (arg.length === 2)
        join = `JOIN ${checkJoinArg(arg[0])} ON ${arg[1]} `
    else if (arg.length === 3)
        join = `JOIN ${checkJoinArg(arg[0])} ON ${arg[1]} = ${arg[2]} `
    else if (arg.length === 4)
        join = `JOIN ${checkJoinArg(arg[0])} ON ${arg[1]} ${arg[2]} ${arg[3]} `

    const typify = join => {
        if (join === '')
            return ''
        if (type.toLowerCase() === 'default')
            return join
        else
            return `${type.toUpperCase()} ${join}`
    }

    return typify(join)
}

module.exports = {
    hasMaker,
    whereHasMaker,
    withMaker,
    joinMaker
}