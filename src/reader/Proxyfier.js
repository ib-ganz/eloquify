const { relate } = require('./relation')

class Proxyfier {
    static proxy(v) {
        return new Proxy(v, {
            get: (target, key) => {

                const reserved = [
                    'constructor', 'init', 'newInstance',
                    'getModelConstraint',
                    'getExecutionConstraint',
                    'getQueryConstraint',
                    'getRelationConstraint',
                    'setModelConstraint',
                    'setQueryConstraint',
                    'setRelationConstraint',
                    'setExecutionConstraint',

                    'setTable',
                    'softDelete',
                    'setKey',
                    'setColumns',
                    'setHidden',

                    'as',
                    'select',
                    'join',
                    'leftJoin',
                    'rightJoin',
                    'where',
                    'orWhere',
                    'whereOr',
                    'orWhereOr',
                    'whereRaw',
                    'orWhereRaw',
                    'whereNot',
                    'orWhereNot',
                    'whereNotOr',
                    'orWhereNotOr',
                    'whereLike',
                    'orWhereLike',
                    'whereLikeOr',
                    'orWhereLikeOr',
                    'whereNotLike',
                    'orWhereNotLike',
                    'whereNotLikeOr',
                    'orWhereNotLikeOr',
                    'whereIn',
                    'orWhereIn',
                    'whereNotIn',
                    'orWhereNotIn',
                    'whereNull',
                    'orWhereNull',
                    'whereNotNull',
                    'orWhereNotNull',
                    'groupBy',
                    'limit',
                    'orderBy',
                    'asc',
                    'desc',
                    'randomize',
                    'has',
                    'orHas',
                    'whereHas',
                    'orWhereHas',
                    'with',
                    'withTrashed',
                    'onlyTrashed',

                    'hasOne',
                    'hasMany',
                    'belongsTo',

                    'logQuery',
                    'logQueryThread',
                    'when',
                    'getTableName',
                    'getAsOrTableName',
                    'builder',
                    'query',
                    'emptyLimit',

                    'nextId',
                    'first',
                    'find',
                    'all',
                    'get',
                    'exists',
                    'trashed',

                    'create',
                    'update',
                    'delete',
                    'save',
                    'restore',
                    'forceDelete',

                    'stored'
                ]

                if (!reserved.includes(key) && typeof target[key] === 'function') {
                    return new Promise(async (resolve) => {
                        await relate(target, [target], key)
                        resolve(target[key])
                    })
                }
                return target[key]
            }
        })
    }
}

module.exports = Proxyfier