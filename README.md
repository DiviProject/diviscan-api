# Diviscan APIs

A RESTful API for making RPC calls to the Divi blockchain. Used for the diviscan block explorer.

# Usage

All endpoints can be retrieved by accessing 'https://api.diviscan.io' or you can host your own using this library.

# Custom hosting

1. Fork this repository and `npm install` all dependencies.

2. Download the [Divi blockchain](https://github.com/divicoin/divi) for your operating system

3. You will need a full Divi node running on the server where these APIs are hosted in order for the configuration to speak to the daemon.

Example config.js:
```javascript
module.exports = {
    config: {
        protocol: 'http',
        user: keys.user, 
        pass: keys.pass,
        host: '127.0.0.1',
        port: '51473'
    }
}
```
4. In the root directory create a file titled `keys.js`

Example keys.js
```javascript
module.exports = {
    user: 'RandomName',
    pass: 'SuperSecretRandomPasswordChangeOrBePwned'
}
```

5. Run `./divid -reindex -addressindex` on startup. 

**NOTE:** You can also add `addressindex=1` to your `divi.conf` file to achieve the same effect. You should always `-reindex` the node on startup regardless.

6. Start the API server with `npm start`

# Endpoints

Node specific endpoints will only return data based on the node where the API is being hosted. 

**GET Requests**

| Endpoint              | Params                    | Response                                          | Node Specific     |  
| --------              | ------                    | --------                          	            | --------          |
| `/accountaddress/`    | `account`                 | address of account                	            | true              |
| `/account-details/`   | `account` (optional)      | list addresses and balances based on account name | true              |
| `/address/`		    | `address`					| transaction, balance, and delta info	            | false             |
| `/address_utxos/`     | `address`                 | all UTXOs from an address	                        | false             |
| `/addrsbyaccount/`    | `account`                 | all addresses of specified account	            | true              |
| `/balance/`           | `account`                 | get balance of account            	            | true              |
| `/block/`             | `hash`                    | block object                      	            | false             |
| `/blockcount`         |                           | number of blocks                  	            | false             |
| `/connectioncount`    |                           | number of active peers            	            | true              |
| `/decode-raw-tx/`     | `hex`                     | decoded raw transaction details                   | false             |
| `/getaccount/`        | `address`                 | account name                      	            | true              |
| `/getreceived/`       | `address`                 | amount received                   	            | true              |
| `/info`               |                           | info object                       	            | false             |
| `/listreceived`       |                           | wallet tx object                  	            | true              |
| `/masternodes`	    | 							| number of masternodes, masternode list            | false             |
| `/newaddress/`        | `account name`            | new address                       	            | true              |
| `/recent`             |                           | active and previous block information             | false             |
| `/sendfrom/`          | `from`, `to`, `amount`    | transaction id   						            | true              |
| `/tx/`                | `txid`                    | tx object                         	            | false             |

