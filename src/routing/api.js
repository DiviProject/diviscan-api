const bitcore = require('bitcore-divi');
const RpcClient = require('divid-rpc');
const keys = require('../../keys');

module.exports = (app) => {

    const config = {
        protocol: 'http',
        user: keys.user,
        pass: keys.pass,
        host: '127.0.0.1',
        port: '51473'
    }
    
    const rpc = new RpcClient(config);

    app.get('/blockcount', (req, res) => {
        rpc.getBlockCount((err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            }
        })
    })
    
}