const { Model, Query, Relation, Execution } = require('./constraint-type')

module.exports = {

    model_constraint: {
        [Model.TABLE_NAME]: '',
        [Model.PRIMARY_KEY]: '',
        [Model.COLUMNS]: [],
        [Model.HIDDEN]: [],
        [Model.SOFT_DELETE]: false,
    },

    query_constraint: {
        [Query.AS]: '',
        [Query.SELECT]: [],
        [Query.JOIN]: [],
        [Query.WHERE]: [],
        [Query.GROUP_BY]: [],
        [Query.ORDER_BY]: '',
        [Query.LIMIT]: '',
        [Query.WITH]: [],
        [Query.WITH_TRASHED]: false,
        [Query.ONLY_TRASHED]: false,
    },

    relation_constraint: {
        [Relation.CHILDREN]: [],
        [Relation.PARENT]: {},
    },

    execution: {
        [Execution.COMPILER]: null,
        [Execution.QUERY_EXECUTOR]: null,

        [Execution.QUERY]: '',
        [Execution.SELECTION]: 'single',
        [Execution.SHOW_QUERY]: false,
        [Execution.SHOW_QUERY_THREAD]: false,

        [Execution.CREATE]: {},
        [Execution.CREATE_NEXT_ID]: {},
        [Execution.UPDATE]: {},
    }
}