const util = require('util')

const errorLog = (str) => {
    console.log('\x1b[1mEloquify:\x1b[22m\x1b[31m', str ,'\x1b[0m')
}

const successLog = (str) => {
    console.log('\x1b[1mEloquify:\x1b[22m\x1b[32m', str ,'\x1b[0m')
}

const infoLog = (str) => {
    console.log('\x1b[1mEloquify:\x1b[22m\x1b[36m', str ,'\x1b[0m')
}

const fullLog = (arg) => {
    console.log(util.inspect(arg, {showHidden: false, depth: null}))
}

module.exports = {
    errorLog,
    successLog,
    infoLog,
    fullLog
}