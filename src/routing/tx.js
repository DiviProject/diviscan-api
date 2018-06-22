const 
 RpcClient   = require('divid-rpc'), 
 config      = require('../config');

module.exports = (app) => {
    const rpc = new RpcClient(config.config);
    /** TRANSACTIONAL APIS */

    // Send from account in wallet
    app.get('/sendfrom/:from/:to/:amount', (req, res) => {
        let params      = req.params,
            fromAccount = params.from,
            toAccount   = params.to,
            amount      = params.amount;
        rpc.sendFrom(fromAccount, toAccount, amount, (err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -6) {
                    res.json({'error': 'Account has insufficient funds'})
                }
            } else {
                res.json(response);
            };
        });
    });
}