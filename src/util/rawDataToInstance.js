const { Model } = require('../builder/data/constraint-type')

const addHiddenProperty = (obj, propKey, propValue) => {
    Object.defineProperty(obj, propKey, {
        value: propValue,
        enumerable: false,
        writable: true
    })
}

module.exports = (rawData, instance) => {
    let model = instance.newInstance()
    const hidden = model.getModelConstraint(Model.HIDDEN)

    for (const [key, value] of Object.entries(rawData)) {
        if (!hidden.includes(key)) {
            model[key] = value
        }
    }

    addHiddenProperty(model, '_ELOQUIFY_OBJECT_STATE_', 'generated')
    addHiddenProperty(model, 'stored', () => Object.keys(rawData).length > 0)

    return model
}
