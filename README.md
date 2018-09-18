# Diviscan APIs

A RESTful API for making RPC calls to the Divi blockchain. Used for the diviscan block explorer.

# Usage

All endpoints can be retrieved by accessing 'https://api.diviscan.io' or you can host your own using this library.

# Custom hosting

Fork this repository and `npm install` all dependencies.

Download the [Divi blockchain](https://github.com/divicoin/divi) for your operating system

You will need a full Divi node running on the server where these APIs are hosted in order for the configuration to speak to the daemon.

Example config.js:
```javascript
config: {
        protocol: 'http',
        user: keys.user, 
        pass: keys.pass,
        host: '127.0.0.1',
        port: '51473'
    }
```
In the root directory create a file titled `keys.js`

Example keys.js
```javascript
module.exports = {
    user: 'RandomName',
    pass: 'SuperSecretRandomPasswordChangeOrBePwned'
}
```

# Endpoints

**GET Requests**

| Endpoint          | Params                    | Response  
| --------          | ------                    | --------                          	|
| `/accountaddress` | `account`                 | address of account                	|
| `/address/`		| `address`					| transaction, balance, and delta info	|
| `/addrsbyaccount` | `account`                 | all addresses of specified account	|
| `/balance`        | `account`                 | get balance of account            	|
| `/block/`         | `hash`                    | block object                      	|
| `/blockcount`     |                           | number of blocks                  	|
| `/connectioncount`|                           | number of active peers            	|  	
| `/getaccount`     | `address`                 | account name                      	|
| `/getreceived/`   | `address`                 | amount received                   	|
| `/info`           |                           | info object                       	|
| `/listreceived`   |                           | wallet tx object                  	|
| `/masternodes`	| 							| number of masternodes, masternode list|
| `/newaddress/`    | `account name`            | new address                       	|
| `/recent`         |                           | active and previous block information |
| `/sendfrom/`      | `from`, `to`, `amount`    | transaction id   						|
| `/tx/`            | `txid`                    | tx object                         	|


# Todos
- Raw transactions
- Masternode details (awaiting release)

