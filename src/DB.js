const QueryExecutor = require('./executor/QueryExecutor')

class Aggregate {
    constructor(fun, arg) {
        this.fun = fun;
        this.arg = arg;
    }
}

class DB {
    static count(arg = '*') {
        return new Aggregate('COUNT', arg);
    }
    static sum(arg) {
        return new Aggregate('SUM', arg);
    }
    static min(arg) {
        return new Aggregate('MIN', arg);
    }
    static max(arg) {
        return new Aggregate('MAX', arg);
    }
    static avg(arg) {
        return new Aggregate('AVG', arg);
    }

    static raw(query) {
        return () => query
    }

    static async select(query) {
        const executor = new QueryExecutor()
        return await executor.execute(query, false)
    }
    static async execute(query) {
        const executor = new QueryExecutor()
        return await executor.executeRaw(query, false)
    }
}

module.exports = { DB, Aggregate };