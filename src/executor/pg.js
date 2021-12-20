const db = require('../database/pg')
const logger = require('../util/logger')

function execute(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, res) => {
            if (err) {
                logger.errorLog(err)
                resolve([])
            }
            else {
                resolve(res.rows)
            }
        }).catch(e => {
            logger.errorLog(e)
            resolve([])
        })
    })
}

function executeCallback(query, err_, res_, params = []) {
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

function executeRaw(query, params = []) {
    return new Promise((resolve, reject) => {
        db.query(query, params, (err, res) => {
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
        }).catch(e => {
            logger.errorLog(e)
            resolve({
                success: false,
                error: e.message
            })
        })
    })
}

module.exports = {
    execute,
    executeCallback,
    executeRaw
}