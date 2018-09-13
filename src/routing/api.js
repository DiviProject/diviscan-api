const 
    RpcClient   = require('divid-rpc'), 
    config      = require('../config'),
    _           = require('lodash')

module.exports = (app) => {
    
    const rpc = new RpcClient(config.config);

    // Current block count
    app.get('/blockcount', (req, res) => {
        rpc.getBlockCount((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response);
            };
        });
    });

    app.get('/block/:hash', (req, res) => {
        let hash = req.params.hash;
        rpc.getBlock(hash, (err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response);
            };
        });
    });

    // Verbose info about the ecosystem
    app.get('/info', (req, res) => {
        rpc.getInfo((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response);
            };
        });
    });

    // Check transaction details 
    app.get('/tx/:txid', (req, res) => {
        let txid = req.params.txid;
        rpc.getRawTransaction(txid, (err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                rpc.decodeRawTransaction(response.result, (err, response) => {
                    if (err) {
                        console.log(err)
                    } else {
                        res.json(response);
                    }
                })
            };
        });
    });

    // Get latest blocks
    app.get('/recent', (req, res) => {
        rpc.getChainTips((err, response) => {
            res.json(response);
        });
    });

    // Get total number of connected peers
    app.get('/connectioncount', (req, res) => {
        rpc.getConnectionCount((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response);
            };
        });
    });

    // Get masternode information
    app.get('/masternodes', (req, res) => {
        rpc.listMasternodes((err, response) => {
            if (err) {
                console.log(err)
            } else {
                res.json({
                    'num_masternodes': response.result.length,
                    'masternode_list': response.result
                })
            }
        })
    })

    // when the client calls the url get all information for the address in question
    app.get('/address/:address', (req, res) => {
        // create addresstxid object from params
        let reqAddress = req.params.address
        let addressObj = {
            "addresses": [reqAddress],
            "start": 0,
            "end": 10000000000000000000
        }
        let balanceObj = {
            "addresses": [reqAddress]
        }
        // we will push the tx info into this array so we don't resend the headers, causing a network error
        let transactionInfo = []
        // set count so we can check if the loop has completed later on 
        let count = 0
        // call address txid rpc function
        rpc.getAddressTxids(addressObj, (err, result) => {
            if (err) { console.log('txid err:',err) }
            else {
                // set up an array to check against the count
                let txidArray = []
                // take each result from getaddresstxids 
                result.result.forEach(txid => {
                    // push the txids into the txid array from above
                    txidArray.push(txid);
                    // call getrawtransaction on each txid
                    rpc.getRawTransaction(txid, (err, ret) => {
                        if (err) {
                            console.log('raw tx err:',err)
                        } else {
                            // decode each raw transaction
                            rpc.decodeRawTransaction(ret.result, (err, response) => {
                                if (err) {
                                    console.log('decode raw err:',err)
                                } else {
                                    // push each transaction response into the transaction info array
                                    transactionInfo.push(response)
                                    // check if the count is equal to the length of the txid array minus one (because arrays start at 0)
                                    if (count === txidArray.length - 1) {
                                        // Get address balance 
                                        rpc.getAddressBalance(balanceObj, (err, ret) => {
                                            if (err) {
                                                console.log(err)
                                            } else {
                                                // send the object to the client
                                                res.json({
                                                    transaction_info: transactionInfo, 
                                                    balance_info: ret.result})
                                            }
                                        })
                                    }
                                }
                                // increment the count each time
                                count++
                            })
                        }
                    })
                })
            }
        })
    })

    /** TODO FUNCTIONS */
    // app.get('/blockheight', (req, res) => {
    //     rpc.getnetworkhashps((err, response) => {
    //         if (err) {
    //             throw new Error('Error')
    //         } else {
    //             res.json(response);
    //         };
    //     });
    // });
    
}