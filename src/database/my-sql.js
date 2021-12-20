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
                dateStrings: true,
                typeCast: function castField( field, useDefaultTypeCasting ) {
                    if ( ( field.type === "BIT" ) && ( field.length === 1 ) ) {
                        let bytes = field.buffer();
                        return( bytes[ 0 ] === 1 );
                    }
                    return( useDefaultTypeCasting() );
                }
            })
        }

        pool.query(query, function (error, results, fields) {
            callback(error, results)
        })
    }
}