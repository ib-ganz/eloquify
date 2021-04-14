const db = require('./database');

class QueryExecutor {

    constructor(objModel) {
        this.model = objModel;
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
        const d = r.map(v => this.map(v));
        return d;
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

    execute(query, params = []) {
        console.log(query);
        return new Promise((resolve, reject) => {
            db.query(query, params, (err, res) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    resolve(res.rows);
                }
            }).catch(e => {
                console.log(e);
                resolve([]);
            })
        })
    }

    executeCallback(query, err_, res_, params = []) {
        console.log(query);
        try {
            db.query(query, params, (err, res) => {
                if (err) {
                    err_(err)
                }
                else {
                    res_(res)
                }
            })
        }
        catch (e) {
            err_(e)
        }
    }
}

module.exports = QueryExecutor;