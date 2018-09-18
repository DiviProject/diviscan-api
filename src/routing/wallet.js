const 
    RpcClient   = require('divid-rpc'), 
    config      = require('../config')

module.exports = (app) => {
    const rpc = new RpcClient(config.config)

    /** WALLET FUNCTIONS */

    // Get's the account name of specified address
    app.get('/getaccount/:addr', (req, res) => {
        let address = req.params.addr
        rpc.getAccount(address, (err, response) => {
            if (err) {
                res.json({'Error': 'err'})
            } else {
                res.json(response)
            }
        })
    })

    // Get address of specified account
    app.get('/accountaddress/:acct', (req, res) => {
        let account = req.params.acct
        rpc.getAccountAddress(account, (err, response) => {
            if (err) {
                res.json(err)
            } else {
                res.json(response)
            }
        })
    })

    // Get all addresses of specified account
    app.get('/addrsbyaccount/:acct', (req, res) => {
        let account = req.params.acct
        rpc.getAddressesByAccount(account, (err, response) => {
            if (err) {
                res.json(err)
            } else {
                res.json(response)
            }
        })
    })

    // Create new address
    app.get('/newaddress/:accountname', (req, res) => {
        let name = req.params.accountname
        rpc.getNewAddress(name, (err, response) => {
            if (err) {
                res.json(err)
            } else {
                res.json(response)
            }
        })
    })


    /** WALLET INFORMATION */

    // Get balance of account
    app.get('/balance/:acct', (req, res) => {
        let account = req.params.acct
        rpc.getBalance(account, (err, response) => {
            if (err) {
                res.json(err)
            } else {
                res.json(response)
            }
        })
    })

    // Get total amount received by a single address
    app.get('/getreceived/:addr', (req, res) => {
        let addr = req.params.addr
        rpc.getReceivedByAddress(addr, (err, response) => {
            if (err) {
                console.log(err)
                if (err.code === 5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response)
            }
        })
    })

    // List received transactions by current wallet
    app.get('/listreceived', (req, res) => {
        rpc.listReceivedByAddress((err, response) => {
            if(err) {
                console.log(err)
            } else {
                res.json(response)
            }
        })
    })

}