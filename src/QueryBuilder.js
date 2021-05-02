const QueryExecutor = require('./executor/QueryExecutor');
const { filterColumns, valueMapper, containsAggregate, buildSelect, camelToSnakeCase, checkJoinArg, whereMapper } = require('./helpers');
const Producer = require('./Producer');

class QueryBuilder {

    #tbl;
    #primary_key;
    #cols;
    #soft_delete = false;
    #hidden = [];
    #queryExecutor;
    #query = '';
    #params = [];
    #selection = 'single';

    #_query = '';
    #_as = '';
    #_select = [];
    #_join = [];
    #_where = [];
    #_groupBy = [];
    #_orderBy = '';
    #_limit = '';
    #_create = {};
    #_create_next_id = 0;
    #_update = {};

    #_relation = [];
    #_with = [];

    constructor() {
        this.#queryExecutor = new QueryExecutor(this);
        this.init()
    }

    init() { }

    softDelete() {
        this.#soft_delete = true
    }

    setTable(tbl) {
        this.#tbl = tbl;
    }
    getTable() {
        return this.#tbl;
    }
    setKey(key) {
        this.#primary_key = key;
    }
    getKey() {
        return this.#primary_key;
    }
    setColumns(cols) {
        this.#cols = cols;
    }
    setHidden(cols) {
        this.#hidden = cols;
    }
    getHidden() {
        return this.#hidden;
    }
    newInstance() {
        return new this.constructor;
    }

    setRelation(arr) {
        this.#_relation = arr;
    }

    getRelation() {
        return this.#_relation;
    }

    hasOne(model, foreign_key, local_key) {
        return { relation: 'single', model, foreign_key, local_key }
    }

    hasMany(model, foreign_key, local_key) {
        return { relation: 'multiple', model, foreign_key, local_key }
    }

    has(has, operator, num) {
        this.#_where.push({
            '-': {
                opt: 'has',
                value: {
                    relName: has,
                    outerTable: this.getAsOrTableName(),
                    operator,
                    num
                }
            }
        });
        return this;
    }

    whereHas(has, func, operator, num) {
        this.#_where.push({
            '-': {
                opt: 'has',
                value: {
                    relName: has,
                    outerTable: this.getAsOrTableName(),
                    func,
                    operator,
                    num
                }
            }
        });
        return this;
    }

    with(...w) {
        if (typeof w === 'string')
            this.#_with.push(w);
        else
            w.forEach(v => this.#_with.push(v));

        this.#_with = [...new Set(this.#_with)];

        return this;
    }

    getAs() {
        return this.#_as;
    }
    getWith() {
        return this.#_with;
    }
    getExecutor() {
        return this.#queryExecutor;
    }
    #executor() {
        return this.#queryExecutor;
    }

    #setWhere(where) {
        if (where) {
            if (typeof where !== 'object') {
                this.#_where.push({ id: where });
            }
            else {
                this.#_where.push(where);
            }
        }
        return this;
    }
    #setCreate(obj, id) {
        if (obj.id === undefined) {
            this.#_create_next_id = id;
        }
        else {
            this.#_create_next_id = valueMapper(obj.id);
            delete obj.id;
        }

        this.#_create = obj;
        return this;
    }
    #setUpdate(obj) {
        this.#_update = obj;
        return this;
    }

    builder() {
        this.#query = '';
        this.#_query = '';
        this.#_as = '';
        this.#_select = [];
        this.#_join = [];
        this.#_where = [];
        this.#_groupBy = [];
        this.#_orderBy = '';
        this.#_limit = '';
        this.#_create = {};
        this.#_create_next_id = 0;
        this.#_update = {};

        this.#_relation = [];
        this.#_with = [];
        return this;
    }
    select(...select) {
        this.#_select = [...this.#_select, ...select];
        return this;
    }
    as(as) {
        this.#_as = as;
        return this;
    }
    getAsOrTableName() {
        this.#tbl = this.#tbl || camelToSnakeCase(this.constructor.name);
        return this.#_as || this.#tbl;
    }
    _addJoin(arg) {
        this.#_join.push(arg)
        return this;
    }
    join(arg) {
        if (arguments.length === 1)
            this._addJoin(`JOIN ${arguments[0]} `);
        else if (arguments.length === 2)
            this._addJoin(`JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} `)
        else if (arguments.length === 3)
            this._addJoin(`JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} = ${arguments[2]} `)
        else if (arguments.length === 4)
            this._addJoin(`JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} ${arguments[2]} ${arguments[3]} `)

        return this;
    }
    leftJoin(arg) {
        if (arguments.length === 1)
            this._addJoin(`LEFT JOIN ${arguments[0]} `);
        else if (arguments.length === 2)
            this._addJoin(`LEFT JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} `)
        else if (arguments.length === 3)
            this._addJoin(`LEFT JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} = ${arguments[2]} `)
        else if (arguments.length === 4)
            this._addJoin(`LEFT JOIN ${checkJoinArg(arguments[0])} ON ${arguments[1]} ${arguments[2]} ${arguments[3]} `)

        return this;
    }
    when(bool, fun, fun1) {
        if (bool)
            fun(this);
        else if (fun1)
            fun1(this);

        return this;
    }
    whereRaw(str) {
        this.#_where.push({
            '-': {
                opt: 'raw',
                value: str
            }
        });
        return this;
    }
    where(obj) {
        for (const [key, value] of Object.entries(obj)) {
            this.#_where.push({
                [key]: {
                    opt: 'equals',
                    value: valueMapper(value)
                }
            });
        }
        return this;
    }
    whereNot(obj) {
        for (const [key, value] of Object.entries(obj)) {
            this.#_where.push({
                [key]: {
                    opt: 'not',
                    value: valueMapper(value)
                }
            });
        }
        return this;
    }
    whereIn(col, arr) {
        this.#_where.push({
            [col]: {
                opt: 'in',
                value: `(${arr.join()})`
            }
        })
        return this;
    }
    whereLike(col, like) {
        if (typeof col === 'object') {
            for (const [key, value] of Object.entries(col)) {
                this.#_where.push({
                    [key]: {
                        opt: 'like',
                        value: `'${value}'`
                    }
                });
            }
        }
        else if (typeof col === 'string') {
            this.#_where.push({
                [col]: {
                    opt: 'like',
                    value: `'${like}'`
                }
            })
        }
        return this;
    }
    whereNull(col) {
        this.#_where.push({
            [col]: {
                opt: 'isnull',
                value: `null`
            }
        })
        return this;
    }
    whereNotNull(col) {
        this.#_where.push({
            [col]: {
                opt: 'isnotnull',
                value: `null`
            }
        })
        return this;
    }
    groupBy(...arg) {
        this.#_groupBy.push(...arg);
        return this;
    }
    limit(limit, offset = 0) {
        this.#_limit = `LIMIT ${limit} OFFSET ${offset} `;
        return this;
    }
    orderBy(col, sort = 'ASC') {
        this.#_orderBy = `ORDER BY ${col} ${sort} `;
        return this;
    }
    randomize() {
        this.#_orderBy = `ORDER BY RANDOM()`;
        return this;
    }

    raw(q, params = []) {
        this.#query = q;
        this.#params = params;
        return this;
    }

    // EXECUTOR
    async nextId() {
        return await this.builder()
            .select('id')
            .orderBy('id', 'DESC')
            .#build('hard-select').#executor().nextId(this.#query);
    }
    async first() {
        this.#selection = 'single';
        return await Producer.produce(this);
    }
    async find(id) {
        this.#selection = 'single';
        this.where({ id: id });
        return await Producer.produce(this);
    }
    async all() {
        this.#selection = 'multiple';
        return await Producer.produce(this);
    }
    async get() {
        this.#selection = 'multiple';
        return await Producer.produce(this);
    }
    async exists() {
        const r = await this.#build().#exec();
        return r && r.length;
    }
    getQuery() {
        return this.#build().#query;
    }
    getSelection() {
        return this.#selection;
    }

    // WRITER
    async create(obj) {
        const id = await this.nextId();
        const key = obj.id === undefined ? id : obj.id;
        return new Promise((res, rej) => {
            this.#setCreate(obj, id)
                .#build('create')
                .#executor()
                .executeCallback(this.#query, e => { rej(e) }, async r => {
                    const newModel = await this.builder().find(valueMapper(key))
                    for (const k in newModel) {
                        this[k] = newModel[k]
                    }
                    res(newModel)
                });
        })
    }
    async update(obj, where = null) {
        let isSingle = false;

        if (where != null && typeof where === 'object') {
            isSingle = false
            this.#setWhere(where)
        }
        else if (where != null) {
            isSingle = true
            this.#setWhere({ id: where })
        }
        else if (this.id) {
            return new Promise(async (resolve, reject) => {
                const newModel = await this.newInstance().where({ id: this.id }).update(obj)
                if (newModel.length === 0) {
                    reject('something went wrong')
                }
                else {
                    for (const k in newModel[0]) {
                        this[k] = newModel[0][k]
                    }
                    resolve(newModel)
                }
            })
        }
        else if (this.#_where.length) {
            isSingle = false
        }

        return new Promise((res, rej) => {
            this.#setUpdate(obj)
                .#build('update')
                .#executor()
                .executeCallback(this.#query, err => { rej(err) }, async res_ => {
                    if (isSingle) {
                        const newModel = await this.builder().find(this.id ?? where)
                        for (const k in newModel) {
                            this[k] = newModel[k]
                        }
                        res(newModel)
                    }
                    else {
                        if (this.#_where)
                            res(await this.#build('select').#exec())
                        else
                            res(await this.builder().#setWhere(where).#build('select').#exec())
                    }
                });
        })
    }
    async delete(where = 0) {
        return new Promise(async (resolve, reject) => {
            try {
                let executor;
                if (where) {
                    executor = this.#setWhere(typeof where === 'object' ? where : { id: where }).#build('delete').#executor();
                }
                else if (this.id) {
                    const r = await this.newInstance().where({ id: this.id }).delete()
                    resolve(r)
                }
                else if (this.#_where.length) {
                    executor = this.#build('delete').#executor();
                }
                else {
                    return reject(false)
                }
                executor.executeCallback(this.#query, err => { reject(err) }, async res_ => { resolve(true) });
            }
            catch (e) {
                reject(e)
            }
        })
    }
    async save() {
        if (this.id)
            return await this.update(this);
        else
            return await this.create(this);
    }

    #exec() {
        return this.#executor().get(this.#query);
    }

    #build(action = 'select') {
        this.#tbl = this.#tbl || camelToSnakeCase(this.constructor.name);
        const asOrTbl = this.#_as || this.#tbl;
        const select = () => {
            let q = '';

            q += `SELECT ${buildSelect(this.#_select)} `;
            q += `FROM ${this.#tbl} ${this.#_as ? `AS ${this.#_as} ` : ''}`;
            q += this.#_join.length ? `${this.#_join.join('')} ` : '';
            q += this.#_where.length ? `WHERE ${whereMapper(this, asOrTbl, this.#_where)} ` : '';
            q += this.#_groupBy.length ? `GROUP BY ${this.#_groupBy.join(', ')} ` : '';
            q += containsAggregate(this.#_select) ? '' : this.#_orderBy || `ORDER BY ${asOrTbl}.id ASC `;
            q += this.#_limit;

            this.#query = q;
        }

        if (action === 'hard-select') {
            select()
        }
        else if (action === 'select') {
            if (this.#soft_delete)
                this.whereNull('deleted_at')
            select()
        }
        else if (action === 'create') {
            if (this.#cols && this.#cols.length)
                this.#_create = filterColumns(this.#_create, this.#cols)

            const k = Object.keys(this.#_create).join();
            const v = Object.values(this.#_create)
                .map(valueMapper)
                .join(', ');
            const id = this.#_create_next_id;

            this.#query = `INSERT INTO ${this.#tbl} (id, ${k}) VALUES (${id}, ${v})`;
        }
        else if (action === 'update') {
            if (this.#cols && this.#cols.length)
                this.#_update = filterColumns(this.#_update, this.#cols)

            let q = `UPDATE ${this.#tbl} SET `;

            let con = [];
            for (const [key, value] of Object.entries(this.#_update)) {
                if (typeof value !== 'function')
                    con.push(`${key} = ${valueMapper(value)}`);
            }
            q += con.join(', ');

            if (this.#_where.length) {
                const w = whereMapper(this, asOrTbl, this.#_where);
                q += ` WHERE ${w} `;
            }

            this.#query = q;
        }
        else if (action === 'delete') {
            let q = `DELETE FROM ${this.#tbl} `;
            if (this.#soft_delete)
                q = `UPDATE ${this.#tbl} SET deleted_at = NOW() `;

            if (this.#_where.length) {
                const w = whereMapper(this, asOrTbl, this.#_where);
                q += ` WHERE ${w} `;
            }

            this.#query = q;
        }

        return this;
    }
}

module.exports = QueryBuilder;