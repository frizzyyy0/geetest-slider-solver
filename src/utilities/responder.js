"use strict";

class Responder {
    constructor () {
        return 
    }

    async respond(status, message, code) {
        this.message = message
        this.code = code
        this.status = status
        return {"code": code, "status": status, "message":message}
    }

    async respond_data(status, message,data,code) {
        this.message = message
        this.code = code
        this.status = status
        this.data = data
        return {"code": code, "status": status, "message":message, "data":data}
    }

}