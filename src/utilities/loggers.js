const {Pool} = require('pg')
let config = require("../../config.json");
const axios = require('axios');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const connectionString = config.SQLALCHEMY_DATABASE_URI
const pool = new Pool({connectionString: connectionString})

async function splitNChars(txt, num) {
    var result = [];
    for (var i = 0; i < txt.length; i += num) {
      result.push(txt.substr(i, num));
    }
    return result;
}




async function logErrors(errorID,solverID,message) {
    try {
        console.log(errorID,solverID,message)
        // i used this to send to a message queue that sent to my discord

    } catch(error) {
        console.log(error.stack)
    }
    
}

async function logTaskErrors(errorID,solverID,taskID,userApiKey,botApiKey,message) {
    try {  
        console.log(errorID,solverID,taskID,userApiKey,botApiKey,message)
        // i used this to send to a message queue that sent to my discord

    } catch(error) {
        console.log(error)
    }
}

module.exports = {
    logErrors:logErrors,
    logTaskErrors:logTaskErrors
}

