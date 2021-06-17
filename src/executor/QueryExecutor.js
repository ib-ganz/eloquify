const my_sql = require('./my-sql')
const pg = require('./pg')
const { getConfig } = require('../database/config')
const logger = require('../util/logger')
const rawDataToInstance = require('../util/rawDataToInstance')

class QueryExecutor {

    static newInstance(objModel) {
        return new QueryExecutor(objModel)
    }

    constructor(objModel) {
        this.model = objModel

        const config = getConfig()
        this.driver = config.driver
        this.query_log = config.query_log ?? false

        if (this.driver === undefined) {
            throw new Error('Driver not set')
        }
        if (this.driver !== 'pg' && this.driver !== 'my-sql') {
            throw new Error('Unsupported driver name. Supported drivers: pg, my-sql')
        }

        if (this.driver === 'pg') {
            this.executor = pg
        }
        else if (this.driver === 'my-sql') {
            this.executor = my_sql
        }
    }

    proxy = () => {
        this.model.data = data
        const target = this.model
        const handler = {
            get: function (target, prop, receiver) {
                return target.data[prop] || null
            },
            set: function(target, prop, value) {
                target.data[prop] = value
                return true
            }
        }

        return new Proxy(target, handler)
    }

    map(data) {
        return rawDataToInstance(data, this.model)
    }

    async find(query, showLog = false) {
        const r = await this.execute(query, showLog)
        if (r && r.length) {
            return [this.map(r[0])]
        }
        else {
            return [this.map({})]
        }
    }

    async get(query, showLog = false) {
        const r = await this.execute(query, showLog)
        return r.map(v => this.map(v))
    }

    async nextId(query) {
        const r = await this.execute(query, false)
        if (r && r.length) {
            const id = r[0].id
            return parseInt(id) + 1
        }
        else {
            return 1
        }
    }

    async execute(query, showLog = false) {
        if (this.query_log || showLog)
            logger.infoLog(query)
        return this.executor.execute(query)
    }

    async executeRaw(query, showLog = false) {
        if (this.query_log || showLog)
            logger.infoLog(query)
        return this.executor.executeRaw(query)
    }

    executeCallback(query, err_, res_, showLog = false) {
        if (this.query_log || showLog)
            logger.infoLog(query)
        this.executor.executeCallback(query, err_, res_)
    }
}

module.exports = QueryExecutor