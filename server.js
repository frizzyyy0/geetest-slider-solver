var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const geetest_solvers_api = require('./src/blueprint/Solvers.js');
const http = require('http');
const httpServer = http.Server(app);
const io = require('socket.io')(httpServer);
//Routes
app.use("/api/v1/geetest/solvers",geetest_solvers_api);

//app.get('/', (req, res)=>{res.send('200 OK');})

const server = app.listen(8000,function() {
    console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT] - Created Solver Server. Listening on port: 8000`);//server.address().port}`);
});
