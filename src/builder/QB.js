const Compiler = require('../compiler/Compiler')
const DataProvider = require('./data/DataProvider')
const Producer = require('../reader/Producer')
const QueryExecutor = require('../executor/QueryExecutor')
const Writer = require('../writer/Writer')
const RelationClass = require('./Relation')
const { Model, Query, Relation, Execution, Selection } = require('./data/constraint-type')
const { hasMaker, whereHasMaker, withMaker, joinMaker } = require('./component/common')
const { whereMaker, whereRawMaker, whereNotMaker, whereInMaker, whereLikeMaker, whereNotLikeMaker, whereNullMaker, whereNotNullMaker } = require('./component/where')
const { camelToSnakeCase } = require('../util/helpers')
const { addHiddenProperty } = require('../util/helpers')
const logger = require('../util/logger')
const { getConfig } = require('../database/config')

class QB {

    constructor() {
        addHiddenProperty(this, '_ELOQUIFY_OBJECT_STATE_', 'initialized')
        addHiddenProperty(this, 'dataProvider', DataProvider.newInstance())
        this.setExecutionConstraint(Execution.COMPILER, Compiler.newInstance(this))
        this.setExecutionConstraint(Execution.QUERY_EXECUTOR, QueryExecutor.newInstance(this))
        this.init()
    }

    init() { }

    newInstance() {
        return new this.constructor
    }

    getModelConstraint(key) {
        return this.dataProvider.getConstraint(DataProvider.MODEL, key)
    }
    getExecutionConstraint(key) {
        return this.dataProvider.getConstraint(DataProvider.EXECUTION, key)
    }
    getQueryConstraint(key) {
        return this.dataProvider.getConstraint(DataProvider.QUERY, key)
    }
    getRelationConstraint(key) {
        return this.dataProvider.getConstraint(DataProvider.RELATION, key)
    }

    setModelConstraint(key, value) {
        this.dataProvider.setConstraint(DataProvider.MODEL, key, value)
    }
    setQueryConstraint(key, value) {
        this.dataProvider.setConstraint(DataProvider.QUERY, key, value)
    }
    setRelationConstraint(key, value) {
        this.dataProvider.setConstraint(DataProvider.RELATION, key, value)
    }
    setExecutionConstraint(key, value) {
        this.dataProvider.setConstraint(DataProvider.EXECUTION, key, value)
    }

    // --------- Model Constraint ---------

    setTable(table_name) {
        this.setModelConstraint(Model.TABLE_NAME, table_name)
    }
    softDelete() {
        this.setModelConstraint(Model.SOFT_DELETE, true)
    }
    setKey(key) {
        this.setModelConstraint(Model.PRIMARY_KEY, key)
    }
    setColumns(columns) {
        this.setModelConstraint(Model.COLUMNS, columns)
    }
    setHidden(hidden_columns) {
        this.setModelConstraint(Model.HIDDEN, hidden_columns)
    }

    // --------- Query Constraint ---------

    as(as) {
        this.setQueryConstraint(Query.AS, as)
        return this
    }
    select(...select) {
        this.setQueryConstraint(Query.SELECT, ...select)
        return this
    }
    join(...arg) {
        this.setQueryConstraint(Query.JOIN, joinMaker('default', ...arg))
        return this
    }
    leftJoin(...arg) {
        this.setQueryConstraint(Query.JOIN, joinMaker('left', ...arg))
        return this
    }
    rightJoin(...arg) {
        this.setQueryConstraint(Query.JOIN, joinMaker('right', ...arg))
        return this
    }
    where(...arg) {
        this.setQueryConstraint(Query.WHERE, whereMaker(this, 'AND', 'AND', ...arg))
        return this
    }
    orWhere(...arg) {
        this.setQueryConstraint(Query.WHERE, whereMaker(this, 'OR', 'AND', ...arg))
        return this
    }
    whereOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereMaker(this, 'AND', 'OR', ...arg))
        return this
    }
    orWhereOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereMaker(this, 'OR', 'OR', ...arg))
        return this
    }
    whereRaw(str) {
        this.setQueryConstraint(Query.WHERE, whereRawMaker(str))
        return this
    }
    orWhereRaw(str) {
        this.setQueryConstraint(Query.WHERE, whereRawMaker(str, 'OR'))
        return this
    }
    whereNot(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotMaker(this, 'AND', 'AND', ...arg))
        return this
    }
    orWhereNot(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotMaker(this, 'OR', 'AND', ...arg))
        return this
    }
    whereNotOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotMaker(this, 'AND', 'OR', ...arg))
        return this
    }
    orWhereNotOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotMaker(this, 'OR', 'OR', ...arg))
        return this
    }

    whereLike(...arg) {
        this.setQueryConstraint(Query.WHERE, whereLikeMaker(this, 'AND', 'AND', ...arg))
        return this
    }
    orWhereLike(...arg) {
        this.setQueryConstraint(Query.WHERE, whereLikeMaker(this, 'OR', 'AND', ...arg))
        return this
    }
    whereLikeOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereLikeMaker(this, 'AND', 'OR', ...arg))
        return this
    }
    orWhereLikeOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereLikeMaker(this, 'OR', 'OR', ...arg))
        return this
    }

    whereNotLike(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotLikeMaker(this, 'AND', 'AND', ...arg))
        return this
    }
    orWhereNotLike(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotLikeMaker(this, 'OR', 'AND', ...arg))
        return this
    }
    whereNotLikeOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotLikeMaker(this, 'AND', 'OR', ...arg))
        return this
    }
    orWhereNotLikeOr(...arg) {
        this.setQueryConstraint(Query.WHERE, whereNotLikeMaker(this, 'OR', 'OR', ...arg))
        return this
    }

    whereIn(col, arr) {
        this.setQueryConstraint(Query.WHERE, whereInMaker(col, true, arr))
        return this
    }
    orWhereIn(col, arr) {
        this.setQueryConstraint(Query.WHERE, whereInMaker(col, true, arr, 'OR'))
        return this
    }
    whereNotIn(col, arr) {
        this.setQueryConstraint(Query.WHERE, whereInMaker(col, false, arr))
        return this
    }
    orWhereNotIn(col, arr) {
        this.setQueryConstraint(Query.WHERE, whereInMaker(col, false, arr, 'OR'))
        return this
    }

    whereNull(col) {
        this.setQueryConstraint(Query.WHERE, whereNullMaker(col))
        return this
    }
    orWhereNull(col) {
        this.setQueryConstraint(Query.WHERE, whereNullMaker(col, 'OR'))
        return this
    }
    whereNotNull(col) {
        this.setQueryConstraint(Query.WHERE, whereNotNullMaker(col))
        return this
    }
    orWhereNotNull(col) {
        this.setQueryConstraint(Query.WHERE, whereNotNullMaker(col, 'OR'))
        return this
    }

    groupBy(...arg) {
        this.setQueryConstraint(Query.GROUP_BY, ...arg)
        return this
    }
    limit(limit, offset = 0) {
        this.setQueryConstraint(Query.LIMIT, `LIMIT ${limit} OFFSET ${offset} `)
        return this
    }
    orderBy(col, sort = 'ASC') {
        this.setQueryConstraint(Query.ORDER_BY, `ORDER BY ${col} ${sort} `)
        return this
    }
    asc(col = 'id') {
        this.setQueryConstraint(Query.ORDER_BY, `ORDER BY ${col} ASC `)
        return this
    }
    desc(col = 'id') {
        this.setQueryConstraint(Query.ORDER_BY, `ORDER BY ${col} DESC `)
        return this
    }
    randomize() {
        const config = getConfig()
        const driver = config.driver

        if (driver === undefined) {
            throw new Error('Driver not set')
        }
        if (driver !== 'pg' && driver !== 'my-sql') {
            throw new Error('Unsupported driver name. Supported drivers: pg, my-sql')
        }

        this.setQueryConstraint(Query.ORDER_BY, `ORDER BY ${driver === 'pg' ? 'RANDOM()' : 'RAND()'} `)
        return this
    }

    has(has, operator, num) {
        this.setQueryConstraint(Query.WHERE, hasMaker(this, has, operator, num))
        return this
    }
    orHas(has, operator, num) {
        this.setQueryConstraint(Query.WHERE, hasMaker(this, has, operator, num, 'OR'))
        return this
    }
    whereHas(has, func, operator, num) {
        this.setQueryConstraint(Query.WHERE, whereHasMaker(this, has, func, operator, num))
        return this
    }
    orWhereHas(has, func, operator, num) {
        this.setQueryConstraint(Query.WHERE, whereHasMaker(this, has, func, operator, num, 'OR'))
        return this
    }
    with(...w) {
        this.setQueryConstraint(Query.WITH, withMaker(...w))
        return this
    }

    withTrashed() {
        this.setQueryConstraint(Query.WITH_TRASHED, true)
        return this
    }
    onlyTrashed() {
        this.setQueryConstraint(Query.ONLY_TRASHED, true)
        return this
    }

    // --------- Relation Constraint ---------

    hasOne(model, foreign_key = `${this.getTableName()}_id`, local_key = `id`) {
        const relation = { model, foreign_key, local_key, type: 'has_one' }
        this.setRelationConstraint(Relation.CHILDREN, relation)

        let child = new model
        child.setRelationConstraint(Relation.PARENT, relation)

        return child
        // return new RelationClass(relation, child)
    }
    hasMany(model, foreign_key = `${this.getTableName()}_id`, local_key = `id`) {
        const relation = { model, foreign_key, local_key, type: 'has_many' }
        this.setRelationConstraint(Relation.CHILDREN, relation)

        let child = new model
        child.setRelationConstraint(Relation.PARENT, relation)

        return child
        // return new RelationClass(relation, child)
    }
    belongsTo(model, foreign_key = null, owner_key = `id`) {
        const relation = {
            model, foreign_key: foreign_key ?? `${model.instance().getTableName()}_id`, owner_key, type: 'belongs_to'
        }
        this.setRelationConstraint(Relation.CHILDREN, relation)

        let child = new model
        child.setRelationConstraint(Relation.PARENT, relation)

        return child
        // return new RelationClass(relation, child)
    }

    // --------- Utility Functions ---------

    logQuery() {
        this.setExecutionConstraint(Execution.SHOW_QUERY, true)
        return this
    }
    logQueryThread() {
        this.setExecutionConstraint(Execution.SHOW_QUERY_THREAD, true)
        return this
    }
    when(bool, fun, fun1) {
        if (bool)
            fun(this)
        else if (fun1)
            fun1(this)

        return this
    }
    getTableName() {
        return this.getModelConstraint(Model.TABLE_NAME) || camelToSnakeCase(this.constructor.name)
    }
    getAsOrTableName() {
        return this.getQueryConstraint(Query.AS) || this.getModelConstraint(Model.TABLE_NAME) || camelToSnakeCase(this.constructor.name)
    }
    builder() {
        this.dataProvider.resetConstraint()
        this.setExecutionConstraint(Execution.COMPILER, Compiler.newInstance(this))
        this.setExecutionConstraint(Execution.QUERY_EXECUTOR, QueryExecutor.newInstance(this))
        return this
    }
    query() {
        return this.getExecutionConstraint(Execution.COMPILER).compile()
    }
    emptyLimit() {
        this.setQueryConstraint(Query.LIMIT, '')
        return this
    }

    // --------- Executor Functions ---------

    async nextId() {
        const query = this
            .getExecutionConstraint(Execution.COMPILER)
            .compile(Compiler.NEXT_ID)
        return await this
            .getExecutionConstraint(Execution.QUERY_EXECUTOR)
            .nextId(query)
    }
    async first() {
        this.setExecutionConstraint(Execution.SELECTION, Selection.SINGLE)
        return await Producer.produce(this)
    }
    async find(id) {
        this.setExecutionConstraint(Execution.SELECTION, Selection.SINGLE)
        this.where({ id: id })
        return await Producer.produce(this)
    }
    async all() {
        this.setExecutionConstraint(Execution.SELECTION, Selection.MULTIPLE)
        return await Producer.produce(this)
    }
    async get() {
        this.setExecutionConstraint(Execution.SELECTION, Selection.MULTIPLE)
        return await Producer.produce(this)
    }
    async exists() {
        const query = this
            .getExecutionConstraint(Execution.COMPILER)
            .compile()
        const r = await this
            .getExecutionConstraint(Execution.QUERY_EXECUTOR)
            .get(query)

        return !!r && r.length > 0
    }
    trashed() {
        return !!this.deleted_at
    }

    // --------- Writer Functions ---------

    async create(data) {
        return Writer.create(this, data)
    }
    async update(data, where = null) {
        return Writer.update(this, data, where)
    }
    async delete(where = 0) {
        if (this._ELOQUIFY_OBJECT_STATE_ === 'generated' && this.id === undefined) {
            logger.errorLog(`${this.constructor.name} is not stored`)
            return false
        }

        if (this.getModelConstraint(Model.SOFT_DELETE))
            return Writer.softDelete(this, where)
        else
            return Writer.delete(this, where)
    }
    async forceDelete(where = 0) {
        if (!this.getModelConstraint(Model.SOFT_DELETE))
            logger.infoLog(`${this.constructor.name} model is not set to be soft-deleted, but it's requested to be force-deleted. Deleting model...`)

        return Writer.forceDelete(this, where)
    }
    async save() {
        if (this._ELOQUIFY_OBJECT_STATE_ === 'generated') {
            if (this.id) {
                return this.update(this)
            }
            else {
                logger.errorLog(`${this.constructor.name} is not stored`)
                return false
            }
        }
        else {
            return this.create(this)
        }
    }
    async restore() {
        await this.update({ deleted_at: null })
        this.deleted_at = null
        return true
    }
}

module.exports = QB