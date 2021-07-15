"use strict";
const fs = require('fs');
const { cv } = require('opencv-wasm')
const Jimp = require('jimp')
const pixelmatch = require('pixelmatch')
const axios = require('axios-https-proxy-fix');
const uuid4 = require("uuid4");
const express = require('express');
const tough = require('tough-cookie');
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const { logErrors, logTaskErrors } = require("./loggers.js");
var config = require("../../config.json");
var { generateMouse } = require("./mouse.js")
const { f } = require("./encryptor_help.js");
const {GrabImage} = require("./canvas-helper.js")
const { Q, U, SCAg, nQfq} = require("./helper_functions.js")
const {Ujyo, ee, TcAx} = require("./slide_encryption.js");
const app = express();
const {Crypto} = require("@peculiar/webcrypto");
const NodeRSA = require('node-rsa');
const key = new NodeRSA();

key.setOptions({
    environment: 'browser',
    encryptionScheme: 'pkcs1'
})

class Solver {
    constructor (solverID,proxy) {
        try {
            // current information
            this.currentUrl = null;
            this.solverID = solverID;

            // current solving task information
            this.taskID = null;
            this.siteUrl = null;
            this.flaggedIPs = [];


            this.interceptingRequests = false;
            // browser information
            this.page = null;
            this.browser = null;
            this.page_source = null;
            this.cookies = null;
            this.headers = null;

        } catch(error) {
            console.log(`[TIME: ${Date.now()}] - [LEVEL: ERROR] - [CONTENT: ${error.stack}]`)
            logErrors(uuid4(),this.solverID,error.stack)
            return "Failed to initialize Solver", error
        }
    }

    async getStatus() {
        return this.currentActivity.toString();
    }

    async getRandomCoor(min,max){
        return Math.ceil(
            Math.random() * (max - min) + min
        )
    }
    
    async getRandomItem(myArray) {
        return myArray[Math.floor(Math.random()*myArray.length)]
    }

    async sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };



    async updateCaptchaTask(user_api_key,company_api_key,taskID,captchaUrl,api_server,siteKey,challengeID,cookies,headers) {
        try {
            this.user_api_key = user_api_key;
            this.company_api_key = company_api_key;
            this.taskID = taskID;
            this.captchaUrl = captchaUrl;
            this.api_server = api_server
            this.siteKey = siteKey;
            this.challengeID = challengeID;
            this.cookies = cookies;
            this.headers = headers;
            console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Updated solver task information!]`)

            return true
        } catch (error) {
            console.log(`[TIME: ${Date.now()}] - [LEVEL: ERROR] - [CONTENT: ${error.stack}]`)
            logErrors(uuid4(),this.solverID,error.stack)
        }
    }


    async change_proxy(proxy) {
        try {
            let proxy_split = proxy.replace("//","").split(":")
            if(proxy_split.length >= 4) {
                let ip = proxy_split[1]
                let port = proxy_split[2]
                let user = proxy_split[3]
                let password = proxy_split[4]
                let proxy_formatted = {
                    host: ip,
                    port: port,
                    auth: {
                      username: user,
                      password: password
                    }
                };

                this.proxy = proxy_formatted
                return true
            } else {
                if(proxy == "") {} else {
                    throw new Error("Invalid proxy. Only User:Pass proxies are currently supported")
                }
            }
        } catch(error) {
            console.log(`[TIME: ${Date.now()}] - [LEVEL: ERROR] - [CONTENT: ${error.stack}]`)
            logErrors(uuid4(),this.solverID,error.stack)
        }

    }

    
    async get_puzzle_position(originalImage, captchaImage) {
        try {
            const {width,height} = originalImage.bitmap
            const diffImage = new Jimp(width, height)
            const diffOptions = {
                includeAA: true,
                threshold: 0.2
            }
            pixelmatch(originalImage.bitmap.data, captchaImage.bitmap.data, diffImage.bitmap.data, width, height, diffOptions)

            let srcImage = await Jimp.read(diffImage)
            let src = cv.matFromImageData(srcImage.bitmap)
    
            let dst = new cv.Mat()
            let kernel = cv.Mat.ones(5, 5, cv.CV_8UC1)
            let anchor = new cv.Point(-1, -1)
    
            cv.threshold(src, dst, 127, 255, cv.THRESH_BINARY)
            cv.erode(dst, dst, kernel, anchor, 1)
            cv.dilate(dst, dst, kernel, anchor, 1)
            cv.erode(dst, dst, kernel, anchor, 1)
            cv.dilate(dst, dst, kernel, anchor, 1)
    
            let modified = new Jimp({
                width: dst.cols,
                height: dst.rows,
                data: Buffer.from(dst.data)
            })

            let x_points = []
            let modified_buffer = await modified.getBufferAsync(Jimp.MIME_PNG);

            let outputImage = await Jimp.read(modified_buffer)
            for (let x = 0; x < outputImage.bitmap.width; x++) {
                for (let y = 0; y < outputImage.bitmap.height; y++) {
                    let pixel = outputImage.getPixelColor(x, y)
                    pixel = await Jimp.intToRGBA(pixel);
                    if (pixel.r >= 248 && pixel.g <= 5 && pixel.b <= 10) {
                        x_points.push(x)
                    }
                }
            }

            let min = Math.min.apply(Math, x_points);
            let max = Math.max.apply(Math, x_points);
            let center = min + ((max - min) / 2)
            return center - 27
    
        } catch (error) {
            //console.log(`[TIME: ${Date.now()}] - [LEVEL: ERROR] - [CONTENT: ${error.stack}]`)
            logTaskErrors(uuid4(), this.solverID, this.taskID, this.user_api_key, this.company_api_key, error.stack)
        }
    }

    async solve() {
        try {
            let done = false
            this.initial = true;
            while(done == false) {
                this.startTime = Date.now()
                this.currentActivity = "Solving GeeTest...";
                let cookieJar = new tough.CookieJar();

                // for(let i=0; i < this.cookies.length;i++) {
                //     let names = Object.keys(this.cookies[i])
                //     let values = Object.values(this.cookies[i])
                //     for(let j=0; j < names.length;j++) {
                //         cookieJar.setCookie(`${names[j]}=${values[j]};`,this.captchaUrl,{"ignoreError":true},(error) => {
                //             if(error) {
                //                 console.log(error.stack)
                //             }
                //         })
                //     }
                // }
                
                if(this.proxy === undefined || this.proxy == null) {
                    this.proxy = false
                }

                let startTime = Date.now()
                let geetest_init = null;
                if(this.initial != true) {
                    console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Sending request to get new challenge]`)
                    cookieJar = new tough.CookieJar();
                    let resp = await axios.get(this.captchaUrl, {
                        headers: this.headers,
                        jar: cookieJar,
                        withCredentials: true,
                        proxy: this.proxy
                    })
                    geetest_init = resp.data.split("initGeetest({")[1].split("}, handlerEmbed);")[0]
                    this.api_server = geetest_init.split("api_server: ")[1].split(",")[0].replace(/\n/g, "").replace(/'/g, "").replace(/\\/g, "")
                    this.siteKey = geetest_init.split("gt: ")[1].split(",")[0].replace(/\n/g, "").replace(/'/g, "").replace(/\\/g, "")
                    this.challengeID = geetest_init.split("challenge: ")[1].split(",")[0].replace(/\n/g, "").replace(/'/g, "").replace(/\\/g, "")

                }

                let params = {
                    "gt": this.siteKey,
                    "challenge": this.challengeID,
                    "lang": "en",
                    "type": "web",
                    "pt": "0",
                    "callback": `geetest_${Date.now()}`
                }


                // console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Sent captcha loading request ${this.challengeID}]`)

                params = {
                    "gt": this.siteKey,
                    "challenge": this.challengeID,
                    "lang": "en-us",
                    "pt": "0",
                    "client_type": "web",
                    "w": "",
                    "callback": `geetest_${Date.now()}`
                }

                let resp = await axios.get(`https://api-na.geetest.com/ajax.php`,{
                    headers: this.headers,
                    params: params,
                    //jar: cookieJar,
                    withCredentials: true,
                    proxy: this.proxy
                });

                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Sent captcha click request - ${resp.data}]`)
                //console.log(resp)
                params = {
                    "is_next": "true",
                    "type": "slide3",
                    "gt": this.siteKey,
                    "challenge": this.challengeID,
                    "lang": "en",
                    "https": "false",
                    "protocol": "https://",
                    "offline": "0",
                    "product": "embed",
                    "api_server": this.api_server,
                    "isPC": "true",
                    "width": "100%",
                    "callback": `geetest_${Date.now()}`
                }
        
                let response = await axios.get(`https://${this.api_server}/get.php`, {
                    headers: this.headers,
                    params: params,
                    jar: cookieJar,
                    withCredentials: true,
                    proxy: this.proxy
                })
                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Got captcha image information]`)
                //console.log(response)
                let data = JSON.parse(response.data.split("(")[1].split(")")[0])
                this.challengeID = data['challenge']
                let c_value = data['c']
                let s_value = data['s']
                let image_1 = `http://static.geetest.com/${data['fullbg']}`
                let image_2 = `http://static.geetest.com/${data['bg']}`


                let images = await GrabImage(image_1, image_2)
                let start_time = Date.now();
                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Cleaned images]`)

                let originalImage = await Jimp.read(images[0])
                let captchaImage = await Jimp.read(images[1])
                let center = await this.get_puzzle_position(originalImage, captchaImage)
                
                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Got position of puzzle piece]`)

                let ep = {}
                let mouse = await generateMouse(center)
                let touch_events = mouse[0]
                let passtime = mouse[1]
                
                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Generated mouse movements]`)

                let scag = await SCAg(touch_events)
                var aa = await nQfq(scag, c_value, s_value);
                let userresponse = await U(Math.floor(center - 1), this.challengeID)
                
                let payload = {
                    "lang": "en-us",
                    "userresponse": userresponse,
                    "passtime": passtime,
                    "imgload": (Date.now() - start_time) + await this.getRandomCoor(100,400),
                    "aa": aa,
                    "ep": ep,
                    "rp": await Q(this.sitekey + this.challengeID['slice'](0, 32) + passtime)
                }

                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Generated initial payload information]`)


                var a = TcAx();
                var s = ee['encrypt'](JSON.stringify(payload), Ujyo());
                var u = f.TTNF(s);
                
                var _ = {
                    "gt": this.siteKey,
                    "challenge": this.challengeID,
                    "lang": "en",
                    "pt": "0",
                    "client_type": "web",
                    "w": u + a
                };

                console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Finished and encrypted payload]`)

                response = await axios.get(`https://${this.api_server}/ajax.php`, {
                    headers: this.headers,
                    params: _,
                    jar: cookieJar,
                    withCredentials: true,
                    proxy: this.proxy
                })

                console.log(response)
                let success = response.data.split("(")[1].split(")")[0]
                console.log(success)
                if(JSON.parse(success)['message'].toString() == "success"){
                    success = JSON.parse(success)
                    console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Successfully solved captcha]`)

                    let token_ = success['validate']
                    done = true
     
                    return `token=${token_}|challengeID=${this.challengeID}`
                    
                } else {
                    this.initial = false;
                    console.log(`[TIME: ${Date.now()}] - [LEVEL: INFO] - [CONTENT: Failed to solve captcha]`)
                }
            }
        } catch (error) {
            console.log(error)
            // console.log(error.data)
            // console.log(error.response)
            //await this.update_task_status_failed()
            this.initial = false;
            //console.log(`[TIME: ${Date.now()}] - [LEVEL: ERROR] - [CONTENT: ${error.stack}]`)
            //logTaskErrors(uuid4(),this.solverID,this.taskID,this.user_api_key,this.company_api_key,error.stack)
        }
    }
};



module.exports.Solver = Solver;
