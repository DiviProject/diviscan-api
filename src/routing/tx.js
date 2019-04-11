const 
 RpcClient   = require('divid-rpc'), 
 config      = require('../config')

module.exports = (app) => {
    const rpc = new RpcClient(config.config)
    /** TRANSACTIONAL APIS */

    // Send from account in wallet
    app.get('/send/:to/:amount', (req, res) => {
        let params      = req.params,
            toAddress   = params.to,
            amount      = params.amount
        rpc.sendToAddress(toAddress, amount, (err, response) => {
            if (err) {
                res.json(err)
            } else {
                res.json(response)
            }
        })
    })
}