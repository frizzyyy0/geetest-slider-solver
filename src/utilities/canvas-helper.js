const { createCanvas, loadImage } = require('canvas')
const fs = require("fs")

var He = function () {
    var e = "6_11_7_10_4_12_3_1_0_5_2_9_8".split("_");
    var t = [];
    var r;
    for (var n = 0, i = 52; n < i; n++) {
      r = parseInt(e[parseInt(n % 26 / 2)]) * 2 + n % 2;
      if (!(parseInt(n / 2) % 2)) {
        r += n % 2 ? -1 : 1;
      }
      r += n < 26 ? 26 : 0;
      t.push(r);
    }
    return t;
}()



function ProcessImage(image) {
    //console.log(Date.now(),"Creating canvas")
    const canvas = createCanvas(260, 160)
    //console.log(Date.now(),"Created canvas")
    const ctx = canvas.getContext('2d')
    //console.log(Date.now(),"Set canvas level")
    const canvas2 = createCanvas(image.width, image.height)
    //console.log(Date.now(),"Creating canvas 2")
    const ctx2 = canvas2.getContext('2d')
    //console.log(Date.now(),"Set canvas level 2")
    ctx2.drawImage(image, 0, 0)
    //console.log(Date.now(),"Drew image")
  
    height = 160
    var s = image.height / 2;
    //console.log(Date.now(),"Divided height")

    //console.log(Date.now(),"Starting iteration")
    var u = 10;
    for (var _ = 0; _ < 52; _ = _ + 1) {
      var c = He[_] % 26 * 12 + 1;
      var f = He[_] > 25 ? s : 0;
      
      var l = ctx2.getImageData(c, f, u, s);
      ctx.putImageData(l, _ % 26 * 10, _ > 25 ? s : 0);
    }
    //console.log(Date.now(),"Finished iteration")
    
    const buffer = canvas.toBuffer('image/png')
    //ImageBuffers.push(buffer)
    return buffer
}


async function GrabImage(url, url1) {

    // Draw cat with lime helmet
    //var hrstart = process.hrtime()
    const ImageBuffers = []

    var image = await loadImage(url)
    //console.log(Date.now(), "loaded image 1 ")
    var buf = ProcessImage(image)
    //console.log(Date.now(), "processed image 1")
    // ImageBuffers.push(buf)
    //fs.writeFileSync('./image1.png', buf)

    image2 = await loadImage(url1)
    //console.log(Date.now(), "loaded image 2 ")
    var buf2 = ProcessImage(image2)
    //console.log(Date.now(), "processed image 2")
    // ImageBuffers.push(buf2)
    //fs.writeFileSync('./image2.png', buf2)

    //hrend = process.hrtime(hrstart)
    return [buf,buf2]
}





module.exports.GrabImage = GrabImage
