const db = require('../database/my-sql')
const logger = require('../util/logger')

function execute(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, (err, res) => {
            if (err) {
                logger.errorLog(err)
                resolve([])
            }
            else {
                resolve(res)
            }
        })
    })
}

function executeCallback(query, err_, res_, params = []) {
    try {
        db.query(query, (err, res) => {
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

function executeRaw(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, (err, res) => {
            if (err) {
                logger.errorLog(err)
                resolve({
                    success: false,
                    error: err.message
                })
            }
            else {
                resolve({ success: true })
            }
        })
    })
}

module.exports = {
    execute,
    executeCallback,
    executeRaw
}