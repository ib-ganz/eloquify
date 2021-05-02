const { getConfig } = require("./config")
const mysql = require('mysql')

let pool = null

module.exports = {
    query: (query, callback) => {
        const config = getConfig()

        if (Object.keys(config).length === 0)
            throw new Error('db config not set')

        config.dateStrings = true

        if (pool === null) {
            pool = mysql.createPool({
                connectionLimit: 10,
                host: config.host,
                user: config.user,
                database: config.database,
                password: config.password,
                dateStrings: true
            })
        }

        pool.query(query, function (error, results, fields) {
            callback(error, results)
        })
    }
}