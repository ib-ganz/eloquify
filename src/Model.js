const QueryBuilder = require('./QueryBuilder');
const { checkJoinArg } = require('./helpers');

class Model extends QueryBuilder {

    static instance() {
        return new this;
    }

    static builder() {
        return this.instance().builder();
    }

    static with(...withs) {
        return this.instance().with(...withs);
    }

    static as(arg) {
        return this.instance().as(arg);
    }

    static select(...s) {
        return this.instance().select(...s);
    }

    static join(arg) {
        let v = arg;
        if (arguments.length === 1)
            v =`JOIN ${arguments[0]} `
        if (arguments.length === 2)
            v =`JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} `
        else if (arguments.length === 3)
            v =`JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} = ${arguments[2]} `
        else if (arguments.length === 4)
            v =`JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} ${arguments[2]} ${arguments[3]} `

        return this.instance()._addJoin(v);
    }

    static when(bool, fun, fun1 = '') {
        return this.instance().when(bool, fun, fun1);
    }

    static whereRaw(str) {
        return this.instance().whereRaw(str);
    }

    static where(where) {
        return this.instance().where(where);
    }

    static whereNot(where) {
        return this.instance().whereNot(where);
    }

    static whereIn(col, arr) {
        return this.instance().whereIn(col, arr);
    }

    static whereLike(col, like) {
        return this.instance().whereLike(col, like);
    }

    static whereNull(col) {
        return this.instance().whereNull(col);
    }

    static whereNotNull(col) {
        return this.instance().whereNotNull(col);
    }

    static has(has, operator, num) {
        return this.instance().has(has, operator, num);
    }

    static whereHas(has, func, operator, num) {
        return this.instance().whereHas(has, func, operator, num);
    }

    static groupBy(...arg) {
        return this.instance().groupBy(...arg);
    }

    static orderBy(col, sort = 'ASC') {
        return this.instance().orderBy(col, sort);
    }

    static randomize() {
        return this.instance().randomize();
    }

    static limit(limit, offset = 0) {
        return this.instance().limit(limit, offset);
    }

    static async all() {
        return await this.instance().all();
    }

    static async get() {
        return await this.instance().get();
    }

    static async first() {
        return await this.instance().first();
    }

    static async find(id) {
        return await this.instance().find(id);
    }

    static async create(obj) {
        return await this.instance().create(obj);
    }

    static async update(obj, where) {
        return await this.instance().update(obj, where);
    }

    static async delete(where) {
        const mappedWhere = typeof where === 'object' ? where : { id: where }
        return await this.instance().delete(mappedWhere);
    }
}

module.exports = Model;