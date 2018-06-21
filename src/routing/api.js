const 
    bitcore     = require('bitcore-divi'), 
    RpcClient   = require('divid-rpc'), 
    config      = require('../config');

module.exports = (app) => {
    
    const rpc = new RpcClient(config.config);

    // Current block count
    app.get('/blockcount', (req, res) => {
        rpc.getBlockCount((err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            };
        });
    });

    app.get('/block/:hash', (req, res) => {
        let hash = req.params.hash;
        rpc.getBlock(hash, (err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            };
        });
    });

    // Verbose info about the ecosystem
    app.get('/info', (req, res) => {
        rpc.getInfo((err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            };
        });
    });

    // Check transaction details 
    app.get('/tx/:txid', (req, res) => {
        let txid = req.params.txid;
        rpc.getTransaction(txid, (err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            };
        });
    });

    // Get latest blocks
    app.get('/recent', (req, res) => {
        rpc.getChainTips((err, response) => {
            res.json(response);
        });
    });

    // Get total amount received by address
    app.get('/received/:addr', (req, res) => {
        let addr = req.params.addr;
        rpc.getReceivedByAddress(addr, (err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            };
        });
    });

    // Get total number of connected peers
    app.get('/connectioncount', (req, res) => {
        rpc.getConnectionCount((err, response) => {
            if (err) {
                console.log(err);
            } else {
                res.json(response);
            };
        });
    });

    /** TODO FUNCTIONS */
    // app.get('/blockheight', (req, res) => {
    //     rpc.getnetworkhashps((err, response) => {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             res.json(response);
    //         };
    //     });
    // });
    
}