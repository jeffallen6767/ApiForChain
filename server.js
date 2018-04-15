var
  chain = require('chain'),
  express = require('express'),
  cors = require('cors'),
  path = require('path'),
  dir = __dirname,
  args = process.argv.slice(),
  staticPath = './public',
  sendMessage = function(data) {
    process.send({
      type: 'process:msg',
      data: data
    });
  },
  sendJson = function(res, data) {
    var 
      dataType = typeof data,
      dataIsObject = dataType === "object";
    res.send(
      JSON.stringify(
        dataIsObject
          ? data 
          : {
              "error": "data not an object",
              "data": data,
              "type": dataType
            }
      )
    );
  },
  loadAccounts = function(callback) {
    return chain.wallet.loadAccounts(callback);
  },
  unlockAccount = function(account, callback) {
    return callback(
      chain.wallet.unlock(account)
    );
  },
  inst = null,
  start = function(ctx, callback) {
    var 
      app = express(),
      port = ctx.port,
      staticPath = path.join(dir, ctx.publicFolder),
      indexPath = path.join(staticPath, ctx.indexFile),
      cbk = typeof callback === 'function' ? callback : function() {
        console.log('Server listening on port ' + port);
      };
    
    app.use(express.json());
    
    app.use(cors());
    
    app.use(
      express.static(staticPath)
    );
    
    app.get('/', function(req, res) {
      res.sendFile(indexPath);
    });
    
    app.get('/loadAccounts', function(req, res) {
      loadAccounts(function(data) {
        sendJson(res, {
          "accounts": data
        });
      });
    });
    
    app.post('/unlockAccount', function(req, res) {
      var 
        account = req.body;
      unlockAccount(account, function(data) {
        sendJson(res, account);
      });
    });
    
    serverApi.inst = app.listen(port, cbk);

    return serverApi.inst;
  },
  serverApi = {
    'inst': inst,
    'start': start
  };

module.exports = serverApi;

// if we're called from the cli in the proper manner, start-up
if (args.length > 3) {
  if (args[2] === "-s") {
    if (args[3] === "start") {
      if (args.length > 5) {
        if (args[4] === "-p") {
          port = args[5] - 0;
        }
        serverApi.start({
          "port": port,
          "publicFolder": "public",
          "indexFile": "index.html"
        }, function() {
          sendMessage({
            topic: 'server-ready',
            success: true,
            packet: args
          });
        });
      }
    }
  }
}
