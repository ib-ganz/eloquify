const recursiveChildren = require('./Recursive')
const { classModelToTable } = require("../util/helpers")
const { Query, Execution } = require('../builder/data/constraint-type')
const { relate } = require('./relation')
const Proxyfier = require('./Proxyfier')

class Producer {

    static async produce(model) {
        return await this.produce_v2(model)
    }

    static async produce_v2(model) {
        if (model.getExecutionConstraint(Execution.SELECTION) === 'single') {
            model.limit(1)
        }

        let res = await this.produceModel(
            model.getExecutionConstraint(Execution.QUERY_EXECUTOR),
            model.getExecutionConstraint(Execution.COMPILER).compile(),
            model.getExecutionConstraint(Execution.SELECTION),
            model.getExecutionConstraint(Execution.SHOW_QUERY) || model.getExecutionConstraint(Execution.SHOW_QUERY_THREAD),
        )

        if (res.length) {
            for (const w of model.getQueryConstraint(Query.WITH)) { // model.getWith() = ['a.b', {'c': q=>q}]; w = 'a.b', {'c': q=>q}
                await relate(model, res, w)
            }
        }

        res = res.map(v => this.proxify(v))

        if (model.getExecutionConstraint(Execution.SELECTION) === 'single')
            return res[0]
        else
            return res
    }

    static async produce_v1(model) {
        let res = await this.produceModel(model.getExecutor(), model.getQuery(), model.getSelection())
        if (res.length) {
            for (const w of model.getWith()) { // model.getWith() = ['a.b', {'c': q=>q}]; w = 'a.b', {'c': q=>q}
                for (const r of res) {
                    await recursiveChildren(r, 0, w)
                }
            }
        }

        res = res.map(v => this.proxify(v))

        if (model.getSelection() === 'single')
            return res[0]
        else
            return res
    }

    static async produceModel(executor, query, selection, showQuery = false) {
        if (selection === 'single') {
            return await executor.find(query, showQuery)
        }
        else {
            return await executor.get(query, showQuery)
        }
    }
    
    static proxify(v) {
        return Proxyfier.proxy(v)
    }

    static proxify_v1(v) {
        delete v.dataProvider
        return new Proxy(v, {
            get: (target, key) => {
                if (target[key] !== undefined) {
                    return target[key]
                }

                const relationship = target.getRelation().find(v => Object.keys(v)[0] === key)

                if (relationship) {
                    const relation = relationship[key]
                    const tbl = classModelToTable(relation.model)
                    const childModel = new relation.model()
                    const executor = childModel.getExecutor()
                    const q = childModel
                        .where({ [`${tbl}.${relation.foreign_key}`]: target[relation.local_key] })
                        .getQuery()

                    if (relation.relation === 'single')
                        return new Promise(async (resolve) => {
                            const res = await executor.find(q)
                            const value = res[0] ?? null
                            target[key] = value
                            resolve(value)
                        })
                    else
                        return new Promise(async (resolve) => {
                            const res = await executor.get(q)
                            target[key] = res
                            resolve(res)
                        })
                }

                return undefined
            }
        })
    }
}

module.exports = Producer