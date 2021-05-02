const my_sql = require('./my-sql')
const pg = require('./pg')
const { getConfig } = require('../database/config')

class QueryExecutor {

    constructor(objModel) {
        this.model = objModel;
        this.driver = getConfig().driver

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
        this.model.data = data;
        const target = this.model;
        const handler = {
            get: function (target, prop, receiver) {
                return target.data[prop] || null;
            },
            set: function(target, prop, value) {
                target.data[prop] = value;
                return true;
            }
        }

        return new Proxy(target, handler);
    }

    map(data) {
        let model = this.model.newInstance();
        const hidden = model.getHidden();

        for (const [key, value] of Object.entries(data)) {
            if (!hidden.includes(key))
                model[key] = value;
        }

        model.stored = () => Object.keys(data).length > 0;

        return model;
    }

    async find(query) {
        const r = await this.execute(query);
        if (r && r.length) {
            return [this.map(r[0])];
        }
        else {
            return [this.map({})];
        }
    }

    async get(query, params = []) {
        const r = await this.execute(query);
        return r.map(v => this.map(v));
    }

    async nextId(query) {
        const r = await this.execute(query);
        if (r && r.length) {
            const id = r[0].id;
            return parseInt(id) + 1;
        }
        else {
            return 1;
        }
    }

    async execute(query, params = []) {
        console.log(query);
        return await this.executor.execute(query, params)
    }

    async executeRaw(query, params = []) {
        console.log(query);
        return await this.executor.executeRaw(query, params)
    }

    executeCallback(query, err_, res_, params = []) {
        console.log(query);
        this.executor.executeCallback(query, err_, res_, params)
    }
}

module.exports = QueryExecutor;