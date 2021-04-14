const recursiveChildren = require('./Recursive');
const { classModelToTable } = require("./helpers");

class Producer {

    static async produce(model) {
        let res = await this.produceModel(model.getExecutor(), model.getQuery(), model.getSelection());
        if (res.length) {
            for (const w of model.getWith()) { // model.getWith() = ['a.b', {'c': q=>q}]; w = 'a.b', {'c': q=>q}
                for (const model of res) {
                    await recursiveChildren(model, 0, w);
                }
            }
        }

        res = res.map(v => {
            return new Proxy(v, {
                get: (target, key) => {
                    if (target[key]) {
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
                            .getQuery();

                        if (relation.relation === 'single')
                            return new Promise(async (resolve, reject) => {
                                const res = await executor.find(q)
                                resolve(res[0] ?? null)
                            });
                        else
                            return executor.get(q);
                    }
                    return undefined
                }
            })
        })

        if (model.getSelection() === 'single')
            return res[0];
        else
            return res;
    }

    static async produceModel(executor, query, selection) {
        if (selection === 'single') {
            return await executor.find(query);
        }
        else {
            return await executor.get(query);
        }
    }
}

module.exports = Producer;