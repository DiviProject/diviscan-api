const
    RpcClient = require('divid-rpc'),
    config = require('../config'),
    _ = require('lodash'),
    CoinGecko = require('coingecko-api'),
    rp = require('request-promise'),
    keys = require('../../keys')

module.exports = (app) => {

    const rpc = new RpcClient(config.config)
    const CoinGeckoClient = new CoinGecko()

    app.use(function (req, res, next) {
        let ip = req.headers['cf-connecting-ip']
        console.log({ time: Date.now(), ip })
        next()
    })

    // Ping server
    app.get('/ping', (req, res) => {
        res.json('pong')
    })

    // Current block count
    app.get('/blockcount', (req, res) => {
        rpc.getBlockCount((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({ 'error': 'Invalid transaction' })
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
                    res.json({ 'error': 'Invalid transaction' })
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
                    res.json({ 'error': 'Invalid transaction' })
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
                    res.json({ 'error': 'Invalid transaction' })
                }
            } else {
                res.json(response.result)
            }
        })
    })

    app.get('/connectioncount', (req, res) => {
        rpc.getConnectionCount((err, response) => {
            if (err) {
                console.log(err)
                if (err.code === -5) {
                    res.json({ 'error': 'Invalid transaction' })
                }
            } else {
                res.json(response)
            }
        })
    })

    app.get('/masternodes', (req, res) => {
        batchCall = () => {
            rpc.listMasternodes()
        }

        getAllFigures = (masternodes) => {
            var tierCounts = {
                copper: 0,
                silver: 0,
                gold: 0,
                diamond: 0,
                platinum: 0
            };
            var rewards = [];
            for(var m = 0; m < masternodes.length; m++){
                let node = masternodes[m];
                
                if(node.tier){
                    let tier = node.tier.toLowerCase();

                    if(tierCounts[tier] || tierCounts[tier] === 0){

                        tierCounts[tier] ++;

                    }
                }

                let balanceInfo = rpc.getAddressBalance({ "addresses": [node.addr] });
                if(balanceInfo && balanceInfo.result){
                    rewards[m] = ({
                        address: node.addr,
                        amountReceived: balanceInfo.result.received,
                        balance: balanceInfo.result.balance,
                        layer: node.tier
                    })
                }
            }
            renderData(masternodes, tierCounts, rewards);
        }
        
        renderData = (masternodeArray, masternodeTierCounts, rewardArr) => {
            res.json({
                num_masternodes: masternodeArray.length,
                'layers': masternodeTierCounts,
                uniqRewards,
                masternode_list: masternodeArray
            })
        }
        
        rpc.batch(batchCall, (err, mns) => {
            if (err) throw err

            getAllFigures(mns[0].result)
        })
    })

    app.get('/masternode/:address', (req, res) => {
        let address = req.params.address
        batchCall = () => {
            rpc.listMasternodes()
        }

        rpc.batch(batchCall, (err, mns) => {
            if (err) throw err

            const masternodes = mns[0].result

            // Find specific masternode
            const masternode = masternodes.find(masternode => masternode.addr === address)

            // Not found?
            if (!masternode) {
                return res.json("Sorry that address does not exist")
            }

            // Send reply
            return res.json(masternode)
        })
    })

    app.get('/masternode/:address', (req, res) => {
        let address = req.params.address
        batchCall = () => {
            rpc.listMasternodes()
        }

        rpc.batch(batchCall, (err, mns) => {
            if (err) throw err

            const masternodes = mns[0].result

            // Find specific masternode
            const masternode = masternodes.find(masternode => masternode.addr === address)

            // Not found?
            if (!masternode) {
                return res.json("Sorry that address does not exist")
            }

            // Send reply
            return res.json(masternode)
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

    app.get('/address-deltas/:address', (req, res) => {
        const reqAddress = req.params.address
        const addressObj = {
            "addresses": [reqAddress]
        }

        batchCall = () => {
            rpc.getAddressDeltas(addressObj)
        }

        rpc.batch(batchCall, (err, txs) => {
            if (err) throw err
            res.json(txs)
        })

    })

    // When the client calls the url get all information for the address in question
    app.get('/address/:address', (req, res) => {
        // The txidArray will be used to store all of the transaction IDs
        let txidArray = []
        // We will push the tx info into this array so we don't resend the headers, causing a network error
        let transactionInfo = []
        let reqAddress = req.params.address
        let addressObj = {
            "addresses": [reqAddress],
            "start": 0,
            "end": 10000000000000000000
        }
        let balanceObj = {
            "addresses": [reqAddress]
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
                    transaction_info: transactionInfo[0],
                    balance_info: balance[0]
                })
            })
        }
    })

    // Get the last 10 blocks minted
    app.get('/latest-blocks', (req, res) => {
        let blockInfo = []
        let blockArray = []
        let step = 0
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
                let currentBlock = blockHash.result.hash
                let prevBlock = blockHash.result.previousblockhash
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
                res.json({ 'error': err })
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
                res.json({ 'error': err })
            } else {
                rpc.getBlock(response.result, (err, ret) => {
                    if (err) {
                        res.json({ 'error': err })
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
                console.log('list transactions error:', err)
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
                        if (uniqAddress != undefined) {
                            let newBalanceObj = {
                                "addresses": [uniqAddress]
                            }
                            rpc.getAddressBalance(newBalanceObj, (err, resp) => {
                                if (err) {
                                    console.log('get address balance error:', err)
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
            let data = await CoinGeckoClient.coins.fetch('divi')
            const usd = data.data.market_data.current_price.usd
            const btc = data.data.market_data.current_price.btc
            res.json({
                usd: usd,
                btc: `${btc * 100000000} sats`
            })
        } catch (err) {
            console.error(err)
        }

    })
}
