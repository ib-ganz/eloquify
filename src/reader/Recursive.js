const { classModelToTable } = require('../util/helpers')

async function recursiveChildren(model, index, relStr) {
    let relArray
    let relName = ''
    let selections = ''
    let fun = null

    if (typeof relStr === 'object') {
        fun = Object.values(relStr)[0]
        relArray = []
        const sp = Object.keys(relStr)[0].split(':')
        relName = sp[0]
        if (sp[1]) selections = sp[1]
    }
    else {
        relArray = relStr.split('.')
        const sp = relArray[index].split(':')
        relName = sp[0]
        if (sp[1]) selections = sp[1]
    }

    const relationships = model.getRelation()
    const relationship = relationships.find(v => Object.keys(v)[0] === relName)

    if (relationship) {
        const relation = relationship[relName]
        const tbl = classModelToTable(relation.model)
        const childModel = new relation.model()
        const query = childModel
            .when(selections, q => {
                q.select(selections)
            })
            .when(fun, q => { fun(q) })
            .when(childModel.getAs(), q => {
                const key = `${childModel.getAs()}.${relation.foreign_key}`
                const val = model[relation.local_key]

                q.where({ [key]: val })
            }, q => {
                const key = `${tbl}.${relation.foreign_key}`
                const val = model[relation.local_key]

                q.where({ [key]: val })
            })
            .getQuery()

        const children = await produceModel(childModel.getExecutor(), query, relation.relation)
        if (children.length) {
            for (const w of childModel.getWith()) { // model.getWith() = ['a.b', {'c': q=>q}] w = 'a.b', {'c': q=>q}
                for (const model of children) {
                    await recursiveChildren(model, 0, w)
                }
            }

            if (relation.relation === 'single') {
                model[relName] = children[0]
                if (index < relArray.length - 1) {
                    await recursiveChildren(children[0], index + 1, relStr)
                }
            }
            else {
                model[relName] = children
                if (index < relArray.length - 1) {
                    for (const child of children) {
                        await recursiveChildren(child, index + 1, relStr)
                    }
                }
            }
        }
        else {
            if (relation.relation === 'single')
                model[relName] = {}
            else
                model[relName] = []
        }
    }
    else {
        console.error(`Relation ${relName} does not exist`)
    }
}

produceModel = async (executor, query, selection) => {
    if (selection === 'single') {
        return await executor.find(query)
    }
    else {
        return await executor.get(query)
    }
}

module.exports = recursiveChildren