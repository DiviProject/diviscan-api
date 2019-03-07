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

    // Information about a specific block
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
        let rewardArr = []
        let masternodeArray = []

        batchCall = () => {
            rpc.listMasternodes()
        }
        getMasternodes = () => {
            rpc.batch(batchCall, (err, mns) => {
                if (err) throw err
                masternodeArray = mns[0].result
                getTierFigures()
            })
        }
        getMasternodes()
        getTierFigures = () => {
            masternodeArray.map(tiers => {
                let layer = tiers.tier
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
            getNodeBalances()
        }
        getNodeBalances = () => {
            batchCall = () => {
                for (let a in masternodeArray) {
                    rpc.getAddressBalance({"addresses": [masternodeArray[a].addr]})
                }
            }
            rpc.batch(batchCall, (err, balanceInfo) => {
                if (err) throw err
                for (let a in masternodeArray) {
                    rewardArr.push({
                        address: masternodeArray[a].addr,
                        amountReceived: balanceInfo[0].result.received,
                        balance: balanceInfo[0].result.balance,
                        layer: masternodeArray[a].tier
                    })
                }
                renderData()
            })
        }

        renderData = () => {
            let uniqRewards = _.uniq(rewardArr)
            res.json({
                num_masternodes: masternodeArray.length,
                'layers': {
                    'copper': copper,
                    'silver': silver,
                    'gold': gold,
                    'platinum': platinum,
                    'diamond': diamond
                },
                uniqRewards,
                masternode_list: masternodeArray
            })
        }
    })

    // Return only rewards by masternodes
    app.get('/masternode-rewards', (req, res) => {
        let rewardArr = []
        let count = 0
        rpc.listMasternodes((err, response) => {
            if (err) {
                console.log(err)
            } else {
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
                            let address = mn.addr
                            rewardArr.push({
                                address: address,
                                amountReceived: amountReceived / 100000000,
                                layer: layer
                            })
                            if (count == response.result.length) {
                                let uniqRewards = _.uniq(rewardArr)
                                res.json({
                                    uniqRewards
                                })
                                rewardArr = []
                            } 
                        }
                    })                                     
                })
                
            }
        })
    })

    // when the client calls the url get all information for the address in question
    app.get('/address/:address', (req, res) => {
        let txidArray       = []
        // we will push the tx info into this array so we don't resend the headers, causing a network error
        let transactionInfo = []
        // create addresstxid object from params
        let reqAddress      = req.params.address
        let addressObj      = {
            "addresses":    [reqAddress],
            "start":        0,
            "end":          10000000000000000000
        }
        let balanceObj      = {
            "addresses":    [reqAddress]
        }
        
        // call address txid rpc function
        getAddressTransactionIds = () => {
            batchCall = () => {
                rpc.getAddressTxids(addressObj)
            }
            rpc.batch(batchCall, (err, txs) => {
                if (err) throw err
                txidArray = txs[0].result
                getAddressTransactions()
            })
        }
        getAddressTransactionIds()
        
        getAddressTransactions = () => {
            transactionId = ''
            batchCall = () => {
                for (let tx in txidArray) {
                    transactionId = txidArray[tx]
                    rpc.getRawTransaction(transactionId, 1)
                }
            }
            rpc.batch(batchCall, (err, result) => {
                if (err) throw err
                transactionInfo.push(result)
                getBalance()
            })
        }

        getBalance = () => {
            batchCall = () => {
                rpc.getAddressBalance(balanceObj)
            }
            rpc.batch(batchCall, (err, balance) => {
                if (err) throw err
                res.json({
                    transaction_info: transactionInfo[0], 
                    balance_info: balance[0]
                })
            })
        }
    })

    // Get the last 10 blocks minted
    app.get('/latest-blocks', (req, res) => {
        let blockInfo   = []
        let blockArray  = []
        let step        = 0
        // First, get the latest block (best block hash)
        getLatestBlock = () => {
            batchCall = () => {
                rpc.getBestBlockHash()
            }
            rpc.batch(batchCall, (err, hash) => {
                if (err) throw err
                // From the returned hash data, gather up to 10 previous hashes
                gatherHashes(hash[0].result)
            })
        }
        getLatestBlock()

        /** Gathers all hashes of the 9 previous blocks and adds them to an array
         * @function
         * @param hash = A block hash, 
         * in this case, the hash returned from the getLatestBlock method
         * */
        gatherHashes = (hash) => {
            // Using the hash passed as an argument, call getBlock to get the info
            // getBlock takes a callback argument that returns 
            // either an error or info about the block
            rpc.getBlock(hash, (err, blockHash) => {
                if (err) throw err
                // Define the current and next blocks using the resulting hash's info
                let currentBlock    = blockHash.result.hash
                let prevBlock       = blockHash.result.previousblockhash 
                // Push both into the blockArray
                blockArray.push(currentBlock)
                blockArray.push(prevBlock)
                // If the step variable has not reached 10, call getPreviousBlocks
                if (step < 10) {
                    // Passing the prevBlock variable as an argument
                    getPreviousBlocks(prevBlock)
                } else {
                // If the step variable is at 10, redefine the blockArray so that it only 
                // contains unique values
                    blockArray = _.uniq(blockArray)
                // Then, loop through each item in the array, 
                    blockArray.forEach(block => {
                        // calling getBlockInfo each time
                        getBlockInfo(block)
                    })
                }
            })
        }

        /** Uses recursion from the above method to move previous block hashes into the blockArray
         * @function
         * @param hash = the previous block hash, returned from the previous gatherHashes invocation
         * This is a recursive function invoked by the gatherHashes method
         */
        getPreviousBlocks = (hash) => {
            // Increment the step to avoid an infinite loop in the gatherHashes method
            step++
            // Call gather hashes with the hash param
            gatherHashes(hash)
        }

        /** Returns all information about a block using the hash
         * @function
         * @param hash = the block hash, taken from the blockArray
         * This function is looped over in the gatherHashes method 
         */
        getBlockInfo = (hash) => {
            // Get information from each hash
            rpc.getBlock(hash, (err, info) => {
                if (err) throw err
                // Push information into the blockInfo array
                blockInfo.push(info.result)
                // If both arrays have the same length,
                if (blockArray.length === blockInfo.length) { 
                    // Return the JSON to the client
                    renderInfo()
                }
            })
        }

        /** Renders all returned data into JSON for use on the client side
         * @function
         */
        renderInfo = () => {
            res.json(blockInfo)
        }
    })

    // Get address utxos
    app.get('/address_utxos/:address', (req, res) => {
        let addr = req.params.address
        rpc.getAddressUtxos(addr, (err, result) => {
            if (err) {
                res.json({'error': err})
            } else {
                res.json(result)
            }
        })
    })

    // Get block information based on index (i.e. 10020)
    app.get('/blockheight/:index', (req, res) => {
        let blockHeight = req.params.index
        rpc.getBlockHash(blockHeight, (err, response) => {
            if (err) {
                res.json({'error': err})
            } else {
                rpc.getBlock(response.result, (err, ret) => {
                    if (err) {
                        res.json({'error': err})
                    } else {
                        res.json(ret.result)
                    }
                })
            }
        })
    })

    // Decode raw transaction
    app.get('/decode-raw-tx/:hex', (req, res) => {
        let hex = req.params.hex
        rpc.decodeRawTransaction(hex, (err, response) => {
            if (err) {
                res.json(err)
            } else {
                res.json(response.result)
            }
        })
    })

    // Get account details based on account name
    app.get('/account-details/:account?', (req, res) => {
        let count = 0
        let step = 0
        let account = req.params.account ? req.params.account : ''
        rpc.listTransactions(account, 10000000, (err, response) => {
            if (err) {
                console.log('list transactions error:',err)
            } else {
                let list = response.result
                let addresses = []
                let balanceArray = []
                list.forEach(transaction => {
                    addresses.push(transaction.address)
                    count++
                })
                if (count == addresses.length) {
                    let uniqAddresses = _.uniq(addresses)
                    uniqAddresses.forEach(uniqAddress => {
                        if (uniqAddress != undefined ) {
                            let newBalanceObj = {
                                "addresses": [uniqAddress]
                            }
                            rpc.getAddressBalance(newBalanceObj, (err, resp) => {
                                if (err) {
                                    console.log('get address balance error:',err)
                                } else {
                                    balanceArray.push({
                                        'address': uniqAddress,
                                        'balance': resp.result.balance / 100000000
                                    })
                                    step++
                                    if (step === uniqAddresses.length - 1) {
                                        res.json(balanceArray)
                                    }
                                }
                            })
                        }
                    })
                }
            }
        })
    })
}