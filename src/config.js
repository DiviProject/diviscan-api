keys = require('../keys');
module.exports =  {
    config: {
        protocol: 'http',
        user: keys.user,
        pass: keys.pass,
        host: '127.0.0.1',
        port: '51473',
        disableAgent: true
    }
}