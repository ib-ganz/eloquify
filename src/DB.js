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
}

module.exports = { DB, Aggregate };