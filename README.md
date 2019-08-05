# Diviscan APIs

A RESTful API for making RPC calls to the Divi blockchain. Used for the diviscan block explorer.

# Motivation

The Divi Project ecosystem is a robust network of technologies. Interfacing directly with the blockchain can be challenging and inaccessible for even seasoned developers. Although libraries like [divid-rpc](https://github.com/Divicoin/divid-rpc) exist for interfacing with the blockchain via Javascript, there are few other programmatic ways to develop with Divi.

Other limitations, such as package dependencies may limit developers from exercising the full feature set offered by `divid-rpc`. 

Furthermore, the `divid-rpc` library still requires the developer to parse the results into usable data after creating methods that function as a developer or user intends.

For this reason, this library of server-side API endpoints was created to allow any request framework to make calls to the public blockchain with ease. Results are easily consumable and provide enough data for a variety of applications to be created. 

# Usage

All endpoints can be retrieved by accessing 'https://api.diviscan.io' or you can host your own using this library.

These endpoints will remain publicly accessible as long as they are not abused. If they are spammed or used for malicious purposes, custom hosting will be required for usage.

# Technologies used

* NodeJS
* ExpressJS
* NPM

# Custom hosting

1. Fork this repository and `npm install` all dependencies.

2. Download the [Divi blockchain](https://github.com/Divicoin/Divi/releases/tag/1.0.3-CLI) for your operating system or feel free to [compile from source](https://github.com/divicoin/divi)

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
| `/price`              |                           | current price of DIVI in USD and BTC              | false             |
| `/sendfrom/`          | `from`, `to`, `amount`    | transaction id   						            | true              |
| `/tx/`                | `txid`                    | tx object                         	            | false             |


# Use cases

If you'd like your app listed here, just reach out to info@diviproject.org with the subject line: Diviscan API Application

This API is currently being used by:

* [Diviscan](https://diviscan.io) - [@99darwin](https://github.com/99darwin)
* [Divi Lottery Timer](https://oriz.bubbleapps.io/) - [@hirscr](https://github.com/Hirscr)
* [Divi Stats](https://slater.bubbleapps.io/) - [@hirscr](https://github.com/Hirscr)