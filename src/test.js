const 
 RpcClient   = require('divid-rpc'), 
 config      = require('./config')

const rpc = new RpcClient(config.config)

let blockList = []
let transactionArray = []
let addressArray = []
let returnArray = []
let count = 0
getAllBlocks = () => {
    rpc.getBlockCount((err, res) => {
        if (err) {
            console.log(err)
        }
        blockHeight = res.result
        batchCall = () => {
            for (let i = 0; i < blockHeight; i++) {
                rpc.getBlockHash(i)
            } 
        }
        rpc.batch(batchCall, (err, hashes) => {
            if (err) {
                console.error(err)
            }
            blockList = hashes
            getTransactionsByBlock()
        })
    })
}
getAllBlocks()

getTransactionsByBlock = () => {
    console.log('blockList.length',blockList.length)
    blockList.forEach(blockHash => {
        batchCall = () => {
            rpc.getBlock(blockHash.result)
        }
        rpc.batch(batchCall, (err, txinfo) => {
            if (err) {
                console.log('transaction block err:',err)
            }
            if (txinfo !== undefined) {
                let txHash = txinfo[0].result.tx
                transactionArray.push(txHash)
                if (transactionArray.length === blockList.length -1) {
                    getAddressesFromTx() 
                }
            }
        })
    })
}

getAddressesFromTx = () => {
    transactionArray.forEach(transaction => {
           
        batchCall = () => {
            rpc.getRawTransaction(transaction, 1)
        }
        rpc.batch(batchCall, (err, transactionInfo) => {
            if (err) {
                console.log(err)
            }
            if (transactionInfo !== undefined) {
                count++  
                console.log(count)   
                let txInfo = transactionInfo[0].result
                if (txInfo !== null) {
                    txInfo.vout.forEach(output => {
                        if (output !== undefined) {
                            let addressInfo = output.scriptPubKey.addresses
                            addressArray.push(addressInfo)
                            if (addressArray.length == count - 1) {
                                getBalanceFromAddress()
                            }
                        }
                    })
                }
            }
            
        })
        
    })
}

getBalanceFromAddress = () => {
    addressArray.forEach(address => {
        let queryAddress = address[0]
        let balanceObj = {
            addresses: [queryAddress]
        }
        batchCall = () => {
            rpc.getAddressBalance(balanceObj)
        }
        rpc.batch(batchCall, (err, balance) => {
            if (err) {
                // console.log(err)
            }
            if (balance !== undefined) {
                resObject = 
                {
                    'query_address': queryAddress,
                    'balance': balance[0].result
                }
                returnArray.push(resObject)
                if (returnArray.length == addressArray.length) {
                    returnObject()
                }
            }
        })
    })
}

returnObject = () => {
    console.log(returnArray)
}