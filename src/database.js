const { getConfig } = require("./config");
const { Pool, types } = require('pg');

const TYPE_TIMESTAMP = 1114
const TYPE_TIMESTAMPTZ = 1184
const TYPE_DATESTAMP = 1082
const customParse = v => v.split('.')[0]

types.setTypeParser(TYPE_TIMESTAMP, customParse)
types.setTypeParser(TYPE_TIMESTAMPTZ, customParse)
types.setTypeParser(TYPE_DATESTAMP, customParse)

let pool = null

module.exports = {
    query: async (text, params, callback) => {
        const config = getConfig()

        if (Object.keys(config).length === 0)
            throw new Error('db config not set')

        if (pool === null)
            pool = new Pool(config)

        return pool.query(text, params, callback)
    },
}