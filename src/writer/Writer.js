const Compiler = require('../compiler/Compiler')
const { Execution, Query, Model } = require('../builder/data/constraint-type')
const rawDataToInstance = require('../util/rawDataToInstance')
const { DB } = require('../DB')
const { getConfig } = require('../database/config')
const logger = require('../util/logger')

class Writer {

    static async create(model, data) {
        const isCallingSave = data instanceof model.constructor

        // const id = await model.nextId()
        // const key = data.id ?? id

        // if (model.id === undefined)
        //     model.setExecutionConstraint(Execution.CREATE_NEXT_ID, id)
        // else {
        //     model.setExecutionConstraint(Execution.CREATE_NEXT_ID, valueMapper(model.id))
        //     delete model.id
        // }

        model.setExecutionConstraint(Execution.CREATE, data)

        const query = model
            .getExecutionConstraint(Execution.COMPILER)
            .compile(Compiler.CREATE)

        const executor = model.getExecutionConstraint(Execution.QUERY_EXECUTOR)

        return new Promise((resolve, reject) => {
            const onError = e => {
                logger.errorLog(e.message)
                resolve(isCallingSave ? false : null)
            }

            const onSuccess = async r => {
                const driver = getConfig().driver

                let returnData

                if (driver === 'pg') {
                    returnData = Array.isArray(data) ?
                        r.rows.map(v => rawDataToInstance(v, model)) :
                        rawDataToInstance(r.rows[0], model)

                    if (isCallingSave)
                        model.id = returnData.id
                }
                else {
                    returnData = Array.isArray(data) ?
                        rawDataToInstance({id: r.insertId, ...data[0]}, model) :
                        rawDataToInstance({id: r.insertId, ...data}, model)

                    if (isCallingSave)
                        model.id = returnData.id
                }

                resolve(isCallingSave ? true : returnData)
            }

            executor.executeCallback(query, onError, onSuccess)
        })
    }

    static async update(model, data = {}, where = null) {
        const isCallingSave = data instanceof model.constructor

        const modelsWhere = model.getQueryConstraint(Query.WHERE)
        let isSingle = false

        if (where != null && typeof where === 'object') {
            isSingle = false
            model.where(where)
        }
        else if (where != null) {
            isSingle = true
            model.where({ id: where })
        }
        else if (model.id) {
            return new Promise(async (resolve, reject) => {
                for (const k in data) {
                    model[k] = data[k]
                }

                const newModel = await model
                    .newInstance()
                    .where({ id: model.id })
                    .update(model)

                if (newModel.length === 0) {
                    reject('something went wrong')
                }
                else {
                    for (const k in newModel[0]) {
                        model[k] = newModel[0][k]
                    }
                    resolve(newModel)
                }
            })
        }
        else if (modelsWhere.length) {
            isSingle = false
        }

        model.setExecutionConstraint(Execution.UPDATE, data)

        const compiler = model.getExecutionConstraint(Execution.COMPILER)
        const executor = model.getExecutionConstraint(Execution.QUERY_EXECUTOR)
        const query = compiler.compile(Compiler.UPDATE)

        return new Promise((res, rej) => {
            const onError = err => {
                logger.errorLog(`${err.message}; Generated query: "${query}"`)
                res(isCallingSave ? false : null)
            }

            const onSuccess = async success => {
                if (isSingle) {
                    const newModel = await model.builder().find(model.id ?? where)
                    for (const k in newModel) {
                        model[k] = newModel[k]
                    }
                    res(isCallingSave ? true : newModel)
                }
                else {
                    if (modelsWhere) {
                        res(isCallingSave ? true : await executor.get(compiler.compile()))
                    }
                    else {
                        model.builder().where(where)
                        res(isCallingSave ? true : await executor.get(compiler.compile()))
                    }
                }
            }

            executor.executeCallback(query, onError, onSuccess)
        })
    }

    static async delete(model, where = 0) {

        const modelsWhere = model.getQueryConstraint(Query.WHERE)
        const compiler = model.getExecutionConstraint(Execution.COMPILER)
        const executor = model.getExecutionConstraint(Execution.QUERY_EXECUTOR)

        return new Promise(async (resolve, reject) => {
            try {
                let query

                if (where) {
                    model.where(typeof where === 'object' ? where : { id: where })
                    query = compiler.compile(Compiler.DELETE)
                }
                else if (model.id) {
                    await model.newInstance().where({ id: model.id }).delete()
                    return resolve(true)
                }
                else if (modelsWhere.length) {
                    query = compiler.compile(Compiler.DELETE)
                }
                else {
                    logger.errorLog(`${model.constructor.name} model doesn't exist. Deleting nothing...`)
                    return resolve(false)
                }

                const onError = e => {
                    logger.errorLog(e.message)
                    resolve(false)
                }

                executor.executeCallback(query, onError, async res_ => { resolve(true) });
            }
            catch (e) {
                logger.errorLog(e.message)
                resolve(false)
            }
        })
    }

    static async forceDelete(model, where = 0) {

        const modelsWhere = model.getQueryConstraint(Query.WHERE)
        const compiler = model.getExecutionConstraint(Execution.COMPILER)
        const executor = model.getExecutionConstraint(Execution.QUERY_EXECUTOR)

        return new Promise(async (resolve, reject) => {
            try {
                let query

                if (model.id) {
                    where = { id: model.id }
                }

                if (where) {
                    model.where(typeof where === 'object' ? where : { id: where })
                    query = compiler.compile(Compiler.DELETE)
                }
                else if (modelsWhere.length) {
                    query = compiler.compile(Compiler.DELETE)
                }
                else {
                    logger.errorLog(`${model.constructor.name} model doesn't exist. Deleting nothing...`)
                    return resolve(false)
                }

                const onError = e => {
                    logger.errorLog(e.message)
                    resolve(false)
                }

                executor.executeCallback(query, onError, async res_ => { resolve(true) });
            }
            catch (e) {
                logger.errorLog(e.message)
                resolve(false)
            }
        })
    }

    static async softDelete(model, where = 0) {
        model
            .when(where !== 0, q => q.where(typeof where === 'object' ? where : { id: where }))
            .setExecutionConstraint(Execution.UPDATE, { deleted_at: DB.raw('NOW()') })

        const compiler = model.getExecutionConstraint(Execution.COMPILER)
        const executor = model.getExecutionConstraint(Execution.QUERY_EXECUTOR)
        const query = compiler.compile(Compiler.UPDATE)

        return new Promise((res, rej) => {
            const onError = err => {
                logger.errorLog(err.message)
                res(false)
            }

            const onSuccess = async res_ => {
                res(true)
            }

            executor.executeCallback(query, onError, onSuccess)
        })
    }
}

module.exports = Writer