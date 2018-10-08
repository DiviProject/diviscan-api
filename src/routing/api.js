const 
    RpcClient   = require('divid-rpc'), 
    config      = require('../config'),
    _           = require('lodash')

module.exports = (app) => {
    
    const rpc = new RpcClient(config.config)

    // Current block count
    app.get('/blockcount', (req, res) => {
        rpc.getBlockCount((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response)
            }
        })
    })

    app.get('/block/:hash', (req, res) => {
        let hash = req.params.hash
        rpc.getBlock(hash, (err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response)
            }
        })
    })

    // Verbose info about the ecosystem
    app.get('/info', (req, res) => {
        rpc.getInfo((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response)
            }
        })
    })

    // Check transaction details 
    app.get('/tx/:txid', (req, res) => {
        let txid = req.params.txid
        rpc.getRawTransaction(txid, 1, (err, response) => {
            if (err) {
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response.result)
            }
        })
    })

    // Get latest blocks
    app.get('/recent', (req, res) => {
        rpc.getChainTips((err, response) => {
            if (err) {
                res.json({'error': err})
            } else { 
                response.result.forEach(hash => {
                    if (hash.status === 'active') {
                        rpc.getBlock(hash.hash, (err, ret) => {
                            if (err) {
                                res.json({'error': err})
                            } else {
                                rpc.getBlock(ret.result.previousblockhash, (err, resp) => {
                                    if (err) {
                                        res.json({'error': err})
                                    } else {
                                        res.json({
                                            'active_block': ret.result,
                                            'previous_block': resp.result
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })

    // Get total number of connected peers
    app.get('/connectioncount', (req, res) => {
        rpc.getConnectionCount((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({'error': 'Invalid transaction'})
                }
            } else {
                res.json(response)
            }
        })
    })

    // Get masternode information
    app.get('/masternodes', (req, res) => {
        let 
            copper = 0,
            silver = 0,
            gold = 0,
            platinum = 0,
            diamond = 0
        rpc.listMasternodes((err, response) => {
            if (err) {
                console.log(err)
            } else {
                response.result.forEach(tier => {
                    let layer = tier.tier
                    switch (layer) {
                        case 'COPPER':
                            copper++
                            break
                        case 'SILVER':
                            silver++
                            break
                        case 'GOLD':
                            gold++
                            break
                        case 'PLATINUM':
                            platinum++
                            break
                        case 'DIAMOND':
                            diamond++
                            break
                    }
                })
                res.json({
                    'num_masternodes': response.result.length,
                    'layers': {
                        'copper': copper,
                        'silver': silver,
                        'gold': gold,
                        'platinum': platinum,
                        'diamond': diamond
                    },
                    'masternode_list': response.result
                })
            }
        })
    })

    app.get('/masternode-rewards', (req, res) => {
        let rewardArr = []
        let count = 0
        rpc.listMasternodes((err, response) => {
            if (err) {
                console.log(err)
            } else {
                console.log(response.result.length)
                response.result.forEach(mn => {
                    let balanceObj = {
                        "addresses": [mn.addr]
                    }
                    rpc.getAddressBalance(balanceObj, (err, ret) => {
                        count++  
                        if (err) {
                            console.log(err)
                        } else {
                            let amountReceived = ret.result.received
                            let layer = mn.tier
                            rewardArr.push({
                                amountReceived: amountReceived / 100000000,
                                layer: layer
                            })
                            if (count == response.result.length) {
                                res.json({
                                    rewardArr
                                })
                            } 
                        }
                    })                                     
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
                    txidArray.push(txid)
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
                                                rpc.getAddressDeltas(balanceObj, (err, r) => {
                                                    if (err) { console.log(err) }
                                                    else {
                                                        // send the object to the client
                                                        res.json({
                                                            transaction_info: transactionInfo, 
                                                            balance_info: ret.result,
                                                            deltas: r.result
                                                        })
                                                    }
                                                })
                                                
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

    // Last 10 blocks
    app.get('/latest-blocks', (req, res) => {
        let blockArray = []
        let blockInfo = []
        rpc.getBestBlockHash((err, ret) => {
            if (err) {
                res.json({'error': err})
            } else {
                rpc.getBlock(ret.result, (err, bestblock) => {
                    if (err) {
                        res.json({'error': err})
                    } else {
                        blockArray.push(bestblock.result.hash)
                        rpc.getBlock(bestblock.result.previousblockhash, (err, blocktwo) => {
                            if (err) {
                                res.json({'error': err})
                            } else {
                                blockArray.push(blocktwo.result.hash)
                                rpc.getBlock(blocktwo.result.previousblockhash, (err, blockthree) => {
                                    if (err) {
                                        res.json({'error': err})
                                    } else {
                                        blockArray.push(blockthree.result.hash)
                                        rpc.getBlock(blockthree.result.previousblockhash, (err, blockfour) => {
                                            if (err) {
                                                res.json({'error': err})
                                            } else {
                                                blockArray.push(blockfour.result.hash)
                                                rpc.getBlock(blockfour.result.previousblockhash, (err, blockfive) => {
                                                    if (err) {
                                                        res.json({'error': err})
                                                    } else {
                                                        blockArray.push(blockfive.result.hash)
                                                        for (let i = 0; i < blockArray.length; i++) {
                                                            rpc.getBlock(blockArray[i], (err, finalres) => {
                                                                if (err) {
                                                                    res.json({'error': err})
                                                                } else {
                                                                    blockInfo.push(finalres.result)
                                                                    if (blockInfo.length === blockArray.length) {
                                                                        res.json(blockInfo)
                                                                    }
                                                                }
                                                            })
                                                        }
                                                        
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })
}