const { Relation, Execution } = require('../builder/data/constraint-type')
const logger = require('../util/logger')

const relate = async (parentModel, parentResults, singleWith) => {

    const str = async (singleStringWith = singleWith, func) => {
        const relations = singleStringWith.split('.')
        let pm = parentModel
        let pr = parentResults
        for (const [i, relationString] of relations.entries()) {
            if (!pr)
                break

            const relationName = relationString.split(':')[0]
            if (typeof parentModel[relationName] === 'function') {
                const f = func ? func[relationName] : null
                const res = await getChildren(pm, relationName, relationString, pr, f)

                connect(pm, pr, relationName, res)
                pr = res

                const isShowQueryThread = pm.getExecutionConstraint(Execution.SHOW_QUERY_THREAD)
                if (res.length) {
                    pm = res[0].newInstance()
                    pm.setExecutionConstraint(Execution.SHOW_QUERY_THREAD, isShowQueryThread)
                }
            }
            else {
                if (i === relations.length - 1)
                    pr.forEach(v => { delete v.dataProvider })

                logger.errorLog(`Relation '${relationName}' doesn't exist on ${pm.constructor.name} class`)

                break;
            }
        }
    }

    if (typeof singleWith === 'object') {
        const k = Object.keys(singleWith)[0]
        const v = Object.values(singleWith)[0]
        if (typeof v === "function") {
            const name = k.split('.')[k.split('.').length - 1].split(':')[0]
            await str(k, { [name] : v })
        }
        else {
            await str(k, v)
        }
    }
    else {
        await str()
    }
}

const connect = (parentModel, parentResults, relationName, children) => {
    const childModel = parentModel[relationName]()
    const relation = childModel.getRelationConstraint(Relation.PARENT)

    parentResults.forEach(v => {

        if (relation.type === 'belongs_to')
            v[relationName] = children.length ? children.find(c => c[relation.owner_key] === v[relation.foreign_key]) ?? {} : {}

        if (relation.type === 'has_one')
            v[relationName] = children.length ? children.find(c => c[relation.foreign_key] === v[relation.local_key]) ?? {} : {}

        if (relation.type === 'has_many')
            v[relationName] = children.length ? children.filter(c => c[relation.foreign_key] === v[relation.local_key]) : []
    })
}

const getChildren = async (parentModel, relationName, relationString, parentResults, func) => {
    if (parentResults.length === 0) {
        return []
    }

    const childModel = parentModel[relationName]()
    const relation = childModel.getRelationConstraint(Relation.PARENT)

    const key = relation.type === 'belongs_to' ? relation.foreign_key : relation.local_key
    if (!parentResults[0][key]) {
        const name = relation.type === 'belongs_to' ? 'foreign_key' : 'local_key'
        logger.errorLog(`${parentModel.constructor.name} needs '${key ?? name}' field to get ${childModel.constructor.name}`)
        return []
    }

    const parentIds = relation.type === 'belongs_to' ?
        [...new Set(parentResults.map(v => v[relation.foreign_key]))] :
        parentResults.map(v => v[relation.local_key])

    const selections = relationString.split(':').length > 1 ? relationString.split(':')[1].replace('{', '').replace('}', '') : ''
    if (func) func(childModel)

    return await childModel
        .when(selections, q => q.select(selections))
        .when(
            relation.type === 'belongs_to',
            q => q.whereIn(relation.owner_key, parentIds),
            q => q.whereIn(relation.foreign_key, parentIds)
        )
        .when(parentModel.getExecutionConstraint(Execution.SHOW_QUERY_THREAD), q => q.logQuery())
        .get()
}

module.exports = {
    relate
}