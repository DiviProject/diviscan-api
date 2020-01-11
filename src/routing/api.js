const 
    RpcClient   = require('divid-rpc'), 
    config      = require('../config'),
    _           = require('lodash'),
    CoinGecko   = require('coingecko-api'),
    rp          = require('request-promise'),
    keys        = require('../../keys')

module.exports = (app) => {
    
    const rpc               = new RpcClient(config.config)
    const CoinGeckoClient   = new CoinGecko()

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
        // Start all tiers at 0
        let 
            copper          = 0,
            silver          = 0,
            gold            = 0,
            platinum        = 0,
            diamond         = 0
        // We will have two arrays for storing rewards and masternode info
        let rewardArr       = []
        let masternodeArray = []

        batchCall = () => {
            rpc.listMasternodes()
        }
        /** Gets the initial data about masternodes using a batchCall to optimize request speed
         * @function
         */
        getMasternodes = () => {
            // The batch function takes a callback function  that returns an error and masternode info
            rpc.batch(batchCall, (err, mns) => {
                if (err) throw err
                // Set masternodeArray equal to the result at the 0th index
                masternodeArray = mns[0].result
                // Call getTierFigures to determine how many nodes of each type exist in the network
                getTierFigures()
            })
        }
        getMasternodes()

        /** Get's the number of nodes of each type that exist in the network
         * @function
         */
        getTierFigures = () => {
            // Loop over the masternodeArray, mapping each tier
            masternodeArray.map(tiers => {
                // to a variable layer
                let layer = tiers.tier
                // Using a switch/case statement, we can easily iterate and set each node layer's equivalent value
                // If the layer matches, increment the number of nodes of that type by 1
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
            // Once all the tiers have been numbered, call getNodeBalances to find further info about each node
            getNodeBalances()
        }

        /** Get's balances for each node individually based on their address 
         * @function
         */
        getNodeBalances = () => {
            batchCall = () => {
                // For every masternode we will find the address and
                for (let a in masternodeArray) {
                    // call the getAddressBalance rpc function for each of the addresses
                    rpc.getAddressBalance({"addresses": [masternodeArray[a].addr]})
                }
            }
            // Once the batch is created, call the function and use the callback function to return the data
            rpc.batch(batchCall, (err, balanceInfo) => {
                if (err) throw err
                // Once again, for every masternode in the array
                for (let a in masternodeArray) {
                    // We will push the object containing relevant data to the rewardArr array
                    rewardArr.push({
                        address         : masternodeArray[a].addr,
                        amountReceived  : balanceInfo[0].result.received,
                        balance         : balanceInfo[0].result.balance,
                        layer           : masternodeArray[a].tier
                    })
                }
                // Once all the data has been pushed to the array, we can render the JSON to the client
                renderData()
            })
        }

        /** Renders the collective data to the client in JSON format
         * @function
         */
        renderData = () => {
            // First weed out any duplicates and redefine the array of rewards as uniqRewards
            let uniqRewards = _.uniq(rewardArr)
            // Then return the JSON to the client
            res.json({
                num_masternodes: masternodeArray.length,
                'layers': {
                    'copper'    : copper,
                    'silver'    : silver,
                    'gold'      : gold,
                    'platinum'  : platinum,
                    'diamond'   : diamond
                },
                uniqRewards,
                masternode_list : masternodeArray
            })
        }
    })

    app.get('/masternode/:address', (req, res) => {
        let address = req.params.address
        batchCall = () => {
            rpc.listMasternodes()
        }

        rpc.batch(batchCall, (err, mns) => {
            if (err) throw err
            for (let i = 0; i < mns[0].result.length; i++) {
                console.log(mns[0].result[i].addr);
		if (mns[0].result[i].addr === address) {
                    return res.json(mns[0].result[i])
                }
            }
        })
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

    // When the client calls the url get all information for the address in question
    app.get('/address/:address', (req, res) => {
        // The txidArray will be used to store all of the transaction IDs
        let txidArray       = []
        // We will push the tx info into this array so we don't resend the headers, causing a network error
        let transactionInfo = []
        let reqAddress      = req.params.address
        let addressObj      = {
            "addresses"     : [reqAddress],
            "start"         : 0,
            "end"           : 10000000000000000000
        }
        let balanceObj      = {
            "addresses"     : [reqAddress]
        }
        
        /** Gets all the transaction IDs from a specified address 
         * @function
         */
        getAddressTransactionIds = () => {
            batchCall = () => {
                // Call address txid rpc function
                rpc.getAddressTxids(addressObj)
            }
            // Using the batch function's callback method
            rpc.batch(batchCall, (err, txs) => {
                if (err) throw err
                // Redefine txidArray as an array of transactions
                txidArray = txs[0].result
                // Call getAddressTransactions to get raw transaction data from txids
                getAddressTransactions()
            })
        }
        getAddressTransactionIds()
        
        /** Get's transaction info from raw transaction data
         * @function
         */
        getAddressTransactions = () => {
            // Set transactionId to a blank array to begin
            transactionId = ''
            batchCall = () => {
                // For all the transactions in txidArray
                for (let tx in txidArray) {
                    // set transactionId to the txid at the index of the transaction
                    transactionId = txidArray[tx]
                    // then call the getRawTransaction rpc function on the txid with 1 as the second argument, 
                    // so that verbose JSON data is returned
                    rpc.getRawTransaction(transactionId, 1)
                }
            }
            // Using the batch's callback method
            rpc.batch(batchCall, (err, result) => {
                if (err) throw err
                // we can push the resulting data into the transactionInfo array
                transactionInfo.push(result)
                // Call getBalance so we can also return balance information to the client
                getBalance()
            })
        }
        
        /** Get's the balance of the requested address
         * @function
         */
        getBalance = () => {
            batchCall = () => {
                // Call the getAddressBalance rpc method on the balanceObj defined above
                rpc.getAddressBalance(balanceObj)
            }
            // Using the batch's callback method
            rpc.batch(batchCall, (err, balance) => {
                if (err) throw err
                // We can simply return all of the collective data
                res.json({
                    transaction_info    : transactionInfo[0], 
                    balance_info        : balance[0]
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

    app.get('/price', async (err, res) => {
        try {
            let data    = await CoinGeckoClient.coins.fetch('divi')
            const usd   = data.data.market_data.current_price.usd
            const btc   = data.data.market_data.current_price.btc 
            res.json({
                usd: usd,
                btc: `${btc * 100000000} sats`
            })
        } catch (err) {
            console.error(err)
        }
        
    })
}
