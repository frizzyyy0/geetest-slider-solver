var express = require('express');
const app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var crypto = require('crypto');
var config = require("../../config.json");
const {logErrors} = require("../utilities/loggers.js");
const {Solver} = require("../utilities/solverClass.js");
const uuid4 = require('uuid4');
const axios = require('axios');
let solver = null;
let done = false;

router.use(bodyParser.urlencoded({extended: true}))
router.use(bodyParser.json())

async function token_required(req, res, next) {
    try {
        let data = req.body
        if(data.solverID != config.solverID) {
            throw Error("Request was not encrypted with correct data")
        }
        req.data = data;
        return next();
        
    } catch(error) {
        let eventID = uuid4();
        logErrors(eventID,config.solverID,error.stack)

        res.status(400)
        return res.json({
            "eventID":eventID,
            "status": "error",
            "message":`Unable to decrypt communication - ${error.stack}`,
            "data":{
                "solverID":config.solverID,
            },
            "code":400
        });
    }
}



router.get('/version', token_required, async function(req, res) {
    try {
        solverID = config.solverID;
        version = config.version;
        let eventID = uuid4();
        res.status(200)
        return res.json({
            "eventID":eventID,
            "status": "success",
            "message":`Got solver version`,
            "data":{
                "solverID":solverID,
                "version":version
            },
            "code":200
        });

    } catch(error) {
        let eventID = uuid4();
        logErrors(eventID,config.solverID,error.stack)

        res.status(400)
        return res.json({
            "eventID":eventID,
            "status": "error",
            "message":`An error occured while attempting to load this respource - ${error.stack}`,
            "data":{
                "solverID":config.solverID,
            },
            "code":400
        });
    }
});



router.post('/create-solver', token_required, async function(req, res) {
    try {
        let proxy = req.body.proxy;
        let solverID = req.body.solverID;

        config.proxy = proxy;
        config.solverID = solverID;

        solver = new Solver(solverID,proxy);

        let eventID = uuid4();
        res.status(200)
        return res.json({
            "eventID":eventID,
            "status": "success",
            "message":`Created Solver`,
            "data":{
                "solverID":config.solverID,
            },
            "code":200
        });

    } catch(error) {
        let eventID = uuid4();
        logErrors(eventID,config.solverID,error.stack)

        res.status(400)
        return res.json({
            "eventID":eventID,
            "status": "error",
            "message":`An error occured while attempting to load this respource - ${error.stack}`,
            "data":{
                "solverID":config.solverID,
            },
            "code":400
        });
    }
});

router.post('/change-proxy', token_required, async function(req, res) {
    try {
        let proxy = req.body.proxy;
        let solverID = req.body.solverID;

        config.proxy = proxy;
        config.solverID = solverID;

        await solver.change_proxy(proxy);
        await solver.startActivity(0);
        let eventID = uuid4();
        res.status(200)
        return res.json({
            "eventID":eventID,
            "status": "success",
            "message":`Changed Browser Proxy`,
            "data":{
                "solverID":config.solverID,
            },
            "code":200
        });

    } catch(error) {
        let eventID = uuid4();
        logErrors(eventID,config.solverID,error.stack)

        res.status(400)
        return res.json({
            "eventID":eventID,
            "status": "error",
            "message":`An error occured while attempting to load this respource - ${error.stack}`,
            "data":{
                "solverID":config.solverID,
            },
            "code":400
        });
    }
});


router.post('/solve',token_required, async function(req, res) {
    try {
        let user_api_key = req.body.user_api_key;
        let company_api_key = req.body.bot_api_key;
        let site_key = req.body.captchaSiteKey
        let task_id = req.body.taskID;
        let api_server = req.body.api_server;
        let site_url = req.body.captchaUrl;
        let challengeID = req.body.challengeID
        let cookies = req.body.cookies
        let headers = req.body.headers
        let proxy = req.body.proxy
        let solverID = uuid4();

        solver = new Solver(solverID,proxy);
        if(proxy != "" && proxy != null && proxy != "N/A" && solver.proxy != proxy) {
            console.log("Changing",proxy)
            await solver.change_proxy(proxy);
        } else{
            console.log("Req",proxy,solver.proxy)
        }


        await solver.updateCaptchaTask(user_api_key,company_api_key,task_id,site_url,api_server,site_key,challengeID,cookies,headers)
        let token = await solver.solve();

        delete solver;
        
        let eventID = uuid4();
        res.status(200)
        return res.json({
            "eventID":eventID,
            "status": "success",
            "message":`Started solving`,
            "data":{
                "solverID":solverID,
                "token":token
            },
            "code":200
        });
    } catch(error) {
        console.log(error.stack)
        let eventID = uuid4();
        logErrors(eventID,config.solverID,error.stack)

        res.status(400)
        return res.json({
            "eventID":eventID,
            "status": "error",
            "message":`An error occured while attempting to load this respource - ${error.stack}`,
            "data":{
                "solverID":config.solverID,
                
            },
            "code":400
        });
    }
});

router.get('/get-status',token_required, async function(req, res) {
    try {
        let status = await solver.getStatus();
        let eventID = uuid4();
        res.status(200)
        return res.json({
            "eventID":eventID,
            "status": "success",
            "message":`Recieved Solver status`,
            "data":{
                "status":status,
                "solverID":config.solverID,
                
            },
            "code":200
        });

    } catch(error) {
        let eventID = uuid4();
        logErrors(eventID,config.solverID,error.stack)

        res.status(400)
        return res.json({
            "eventID":eventID,
            "status": "error",
            "message":`An error occured while attempting to load this respource - ${error.stack}`,
            "data":{
                "solverID":config.solverID,
                
            },
            "code":400
        });
    }
});


module.exports = router;