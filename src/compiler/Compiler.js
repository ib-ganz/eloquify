const DataProvider = require('../builder/data/DataProvider')
const { Query, Model, Execution } = require('../builder/data/constraint-type')
const { valueMapper, containsAggregate, filterColumns } = require('../util/helpers')
const { compileSelect } = require('../compiler/select')
const { compileWhere } = require('../compiler/where')
const { getConfig } = require('../database/config')

class Compiler {

    static SELECT = 0
    static HARD_SELECT = 1
    static CREATE = 2
    static UPDATE = 3
    static DELETE = 4
    static NEXT_ID = 5

    /**
     * @param {QB} builder
     */
    static newInstance(builder) {
        const driver = getConfig().driver

        if (driver === undefined) {
            throw new Error('Driver not set')
        }
        if (driver !== 'pg' && driver !== 'my-sql') {
            throw new Error('Unsupported driver name. Supported drivers: pg, my-sql')
        }

        return new Compiler(builder, builder.dataProvider)
    }

    builder
    dataProvider
    query

    constructor(builder, dataProvider) {
        this.driver = getConfig().driver
        this.builder = builder
        this.dataProvider = dataProvider
    }

    getData(key, constraintType = DataProvider.QUERY) {
        return this.dataProvider.getConstraint(constraintType, key)
    }

    #select() {

        const selection = this.getData(Query.SELECT)
        const tableName = this.builder.getTableName()
        const as = this.getData(Query.AS)
        const asOrTbl = as || tableName
        const join = this.getData(Query.JOIN)
        const where = this.getData(Query.WHERE)
        const compiledWhere = compileWhere(this.builder, asOrTbl, where).trim()
        const groupBy = this.getData(Query.GROUP_BY)
        const orderBy = this.getData(Query.ORDER_BY)
        const limit = this.getData(Query.LIMIT)

        let q = '';

        q += `SELECT ${compileSelect(selection)} `
        q += `FROM ${tableName} ${as ? `AS ${as} ` : ''}`
        q += join.length ? `${join.join('')} ` : ''
        q += compiledWhere ? `WHERE ${compiledWhere} ` : ''
        q += groupBy.length ? `GROUP BY ${groupBy.join(', ')} ` : ''
        q += containsAggregate(selection) ? '' : orderBy || `ORDER BY ${asOrTbl}.id ASC `
        q += limit

        return q
    }

    #insert() {
        const tableName = this.builder.getTableName()
        const cols = this.getData(Model.COLUMNS, DataProvider.MODEL)
        // const createNextId = this.getData(Execution.CREATE_NEXT_ID, DataProvider.EXECUTION)
        const createData = this.getData(Execution.CREATE, DataProvider.EXECUTION)
        let create = Array.isArray(createData) ? createData[0] : createData

        if (cols && cols.length)
            create = filterColumns(create, cols)

        const k = Object
            .keys(create)
            .join(', ')

        const mapToV = v => Object
            .values(v)
            .map(valueMapper)
            .join(', ')

        const values = () => Array.isArray(createData) ?
            createData.map(v => `(${mapToV(v)})`).join(', ') :
            `(${mapToV(createData)})`

        const ret = this.driver === 'pg' ? ' RETURNING *' : ''

        return `INSERT INTO ${tableName} (${k}) VALUES ${values()}${ret}`;
    }

    #update() {
        const tableName = this.builder.getTableName()
        const as = this.getData(Query.AS)
        const asOrTbl = as || tableName
        const cols = this.getData(Model.COLUMNS, DataProvider.MODEL)
        const where = this.getData(Query.WHERE)
        let update = this.getData(Execution.UPDATE, DataProvider.EXECUTION)

        if (cols && cols.length)
            update = filterColumns(update, cols)

        let q = `UPDATE ${tableName} SET `

        let con = [];
        for (const [key, value] of Object.entries(update)) {
            if (typeof value === 'function')
                con.push(`${key} = ${value()}`)
            else
                con.push(`${key} = ${valueMapper(value)}`)
        }
        q += con.join(', ')

        if (where.length) {
            const w = compileWhere(this.builder, asOrTbl, where)
            q += ` WHERE ${w} `
        }

        return q
    }
    ////// TODO: pindah compiler

    #delete() {
        const tableName = this.builder.getTableName()
        const as = this.getData(Query.AS)
        const asOrTbl = as || tableName
        const where = this.getData(Query.WHERE)

        let q = ''
        // if (this.getData(Model.SOFT_DELETE, DataProvider.MODEL))
        //     q = `UPDATE ${tableName} SET deleted_at = NOW() `
        // else
            q = `DELETE FROM ${tableName} `

        if (where.length)
            q += `WHERE ${compileWhere(this.builder, asOrTbl, where)}`

        return q
    }

    compile(action = Compiler.SELECT) {
        if (action === Compiler.HARD_SELECT) {
            return this.#select()
        }
        else if (action === Compiler.SELECT) {
            if (this.getData(Model.SOFT_DELETE, DataProvider.MODEL)) {
                if (this.getData(Query.WITH_TRASHED)) {
                    //
                }
                else if (this.getData(Query.ONLY_TRASHED)) {
                    this.builder.whereNotNull('deleted_at')
                }
                else {
                    this.builder.whereNull('deleted_at')
                }
            }
            return this.#select()
        }
        else if (action === Compiler.CREATE) {
            return this.#insert()
        }
        else if (action === Compiler.UPDATE) {
            if (this.getData(Model.SOFT_DELETE, DataProvider.MODEL)) {
                if (this.getData(Query.WITH_TRASHED)) {
                    //
                }
                else if (this.getData(Query.ONLY_TRASHED)) {
                    this.builder.whereNotNull('deleted_at')
                }
                else {
                    this.builder.whereNull('deleted_at')
                }
            }
            return this.#update()
        }
        else if (action === Compiler.DELETE) {
            return this.#delete()
        }
        else if (action === Compiler.NEXT_ID) {
            this.builder
                .builder()
                .select('id')
                .orderBy('id', 'DESC')
            return this.compile(Compiler.HARD_SELECT)
        }
    }
}

module.exports = Compiler