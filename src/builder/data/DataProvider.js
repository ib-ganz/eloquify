const data = require('./data')
const util = require('util')

class DataProvider {

    static MODEL = 0
    static QUERY = 1
    static RELATION = 2
    static EXECUTION = 3

    static newInstance() {
        const d = JSON.parse(JSON.stringify(data))
        return new DataProvider(d)
    }

    constructor(data) {
        this.data = data
    }

    getConstraintByType(constraint_type) {
        if (constraint_type === DataProvider.MODEL)
            return this.data.model_constraint
        else if (constraint_type === DataProvider.QUERY)
            return this.data.query_constraint
        else if (constraint_type === DataProvider.RELATION)
            return this.data.relation_constraint
        else if (constraint_type === DataProvider.EXECUTION)
            return this.data.execution
        else
            return null
    }

    setConstraint(constraint_type, key, value) {
        let constraint = this.getConstraintByType(constraint_type)

        if (Array.isArray(constraint[key])) {
            if (Array.isArray(value))
                constraint[key] = [...constraint[key], ...value]
            else
                constraint[key].push(value)
        }
        else
            constraint[key] = value
    }

    getConstraint(constraint_type, key) {
        let constraint = this.getConstraintByType(constraint_type)
        return constraint[key]
    }

    resetConstraint() {
        this.data = JSON.parse(JSON.stringify(data))
    }
}

module.exports = DataProvider