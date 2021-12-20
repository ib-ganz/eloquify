let config = {}

const dbConfig = conf => {
    config = conf
    return (req, res, next) => {
        next()
    }
}

const getConfig = () => config

module.exports = {
    dbConfig,
    getConfig
}