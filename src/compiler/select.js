const { Aggregate } = require('../DB')

const compileSelect = (selection) => {
    if (selection.length === 0)
        return '*';

    const r = selection.map(v => {
        if (typeof v === 'object' && v instanceof Aggregate)
            return `${v.fun}(${v.arg})`;
        return [...new Set(v.split(','))].map(v => v.trim()).join(',');
    }).join(',');

    return [...new Set(r.split(','))].map(v => v.trim()).join(', ');
}

module.exports = { compileSelect }