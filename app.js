'use strict';

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var gm = require('gm');
require('gm-base64');
var fs = require('fs-extra');

var dir = __dirname;
var temp = dir + '/temp/';

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true, limit: '150mb'}));
app.use(bodyParser.json({limit: '150mb'}));

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
        next();
    });

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router





// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

// START THE PRECESSOR
// http://localhost:8080/gm/v1/start
// Start the beast ========================================
var beastObj = {
    state: 0,
    action: 0,
    originalb64: undefined,
    originalPath: undefined,
    originalFileExt: undefined,
    originFilePath: undefined,
    originalDetails: undefined,
    lastFilePath: undefined,
    lastB64: undefined,
    lastDetails: undefined
}

var gmImg = undefined;

// You need to pass an image in base64 codec in the body of the request
router.post('/start', function(req, res) {
    var request = req;

    var imgBuffer = req.body.b64;
    var filePath = req.body.filePath;
    
    var fileExt = fileExtension(filePath);

    fs.writeFile(temp + 'original.' + fileExt[0], imgBuffer, 'base64', function(err) {
      
        if (err){
            console.log(err);
        } else {
            fs.writeFile(temp + 'last.' + fileExt[0], imgBuffer, 'base64', function(err) {

                if (err){
                    console.log(err);
                } else {
                    gmImg = gm(temp + 'last.' + fileExt[0]);

                    gmImg.identify(function(err, value){
                        if (err) {
                            console.log(this.outname + 'created ::' + arguments[3]);
                            res.json({ error: this.outname + '::::' + arguments[3] });  
                        } else {
                            var valueRsp = value;  

                            gmImg.toBase64('bmp', function(err, base64){
                                if (err) {
                                    console.log(this.outname + ' :::: ' + arguments[3]);
                                    res.json({ error: this.outname + ' :::: ' + arguments[3] });  
                                } else {
                                    beastObj = {
                                        state: 1,
                                        action: 0,
                                        originalb64: base64,
                                        originalPath: temp + 'original.' + fileExt[0],
                                        originalFileExt: fileExt[0],
                                        originFilePath: filePath,
                                        originalDetails: valueRsp,
                                        lastFilePath: temp + 'last.' + fileExt[0],
                                        lastB64: base64,
                                        lastDetails: valueRsp
                                    }

                                    res.json({ success: "Safe Bro!!! The beast is up and running!!", 
                                                beastState: beastObj 
                                    }); 
                                }
                            });
                        }
                    });
                } 
            });
        } 
    });
});


// GM API
// ==================================================================

// Blur ================================================================
router.post('/blur/:radius/:sigma', function(req, res) {
    
    if(checkBeastState()) {
        
        gm(beastObj.lastFilePath).blur(req.params.radius, req.params.sigma)
        .toBase64('bmp', function(err, base64){
            if (err) {
                // console.dir(arguments)
                console.log(this.outname + ' :::: ' + arguments[3]);
                res.json({ error: this.outname + ' :::: ' + arguments[3] });  
            } else {
                beastObj.lastB64 = base64;
                res.json({ success: "Blur Applied", b64: base64 }); 
            }
          });
    } else {
        res.json({ error: "Sorry Bro!!! Your beast is not started yet!!"}); 
    }

    // var request = req;

    // // Fallo solo se stato non e gia iniziato
    // // started = 0;
    // // console.log(req.body.b64);
    // var imgBuffer = req.body.b64;
    
    // console.log(req.body.filePath);
    // var filePath = req.body.filePath;
    // var fileExt = fileExtension(filePath);

    // console.log(fileExt[0]);

    // fs.writeFile(temp + 'original.' + fileExt, imgBuffer, 'base64', function(err) {
      
    //     if (err){
    //         console.log(err);
    //     } else {
    //         gm(temp + 'original.' + fileExt)
    //         .blur(req.params.radius, req.params.sigma)
    //         .toBase64('bmp', function(err, base64){
    //             if (err) {
    //                 // console.dir(arguments)
    //                 console.log(this.outname + ' :::: ' + arguments[3]);
    //                 res.json({ error: this.outname + ' :::: ' + arguments[3] });  
    //             } else {
    //                 res.json({ success: "Safe Bro :-) Everything went smooth!!", base64: base64 }); 
    //             }
    //           });
    //     } 
    // });

    // var parts = filePath.split("/");
    // var filename = parts[parts.length - 1]; 

    // console.log(filename);
    // copyFile(filePath, temp + filename);

    
        // .write(temp + 'created/' + filename, function(err){
        //     if (err) {
        //     	// console.dir(arguments)
        //     	console.log(this.outname + ' :::: ' + arguments[3]);
        //     	res.json({ error: this.outname + ' :::: ' + arguments[3] });  
        //     } else {
        //     	res.json({ success: "Safe Bro :-) Everything went smooth!!", data: request.params }); 
        //     }
        // })

    // TODO: 
    // Save temporay file
    // Send back for preview if success
    // Save step in database

});

router.post('/crop/:width/:height/:x/:y', function(req, res) {
    
    if(checkBeastState()) {
        
        gm(beastObj.lastFilePath).crop(req.params.width, req.params.height, req.params.x, req.params.y)
        .toBase64('bmp', function(err, base64){
            if (err) {
                // console.dir(arguments)
                console.log(this.outname + ' :::: ' + arguments[3]);
                res.json({ error: this.outname + ' :::: ' + arguments[3] });  
            } else {
                beastObj.lastB64 = base64;
                res.json({ success: "Crop Applied", b64: base64 }); 
            }
          });
    } else {
        res.json({ error: "Sorry Bro!!! Your beast is not started yet!!"}); 
    }

    
    
    
    // gm(dir + '/images/test.png')
    //     .crop(req.params.width, req.params.height, req.params.x, req.params.y)
    //     .write(dir + '/images/created/test.png', function(err){
    //         if (err) {
    //             // console.dir(arguments)
    //             console.log(this.outname + 'created ::' + arguments[3]);
    //             res.json({ error: this.outname + 'created ::' + arguments[3] });  
    //         } else {
    //             res.json({ success: "Safe Bro :-) Everything went smooth!!", data: request.params }); 
    //         }
    //     })
});

// Save ========================================================
router.post('/save/:action', function(req, res) {
    //:action = saveproject, saveaction
    if(checkBeastState()) {
        
        switch(req.params.action) {
            case 'saveaction':
                var imgBuffer = beastObj.lastB64;
                var filePath = beastObj.lastFilePath;
                
                var fileExt = fileExtension(filePath);
                
                fs.writeFile(temp + 'last.' + fileExt[0], imgBuffer, 'base64', function(err) {

                    if (err){
                        console.log(err);
                    } else {
                        gmImg = gm(temp + 'last.' + fileExt[0]);

                        gmImg.identify(function(err, value){
                            if (err) {
                                console.log(this.outname + 'created ::' + arguments[3]);
                                res.json({ error: this.outname + '::::' + arguments[3] });  
                            } else {
                                var valueRsp = value;  

                                gmImg.toBase64('bmp', function(err, base64){
                                    if (err) {
                                        console.log(this.outname + ' :::: ' + arguments[3]);
                                        res.json({ error: this.outname + ' :::: ' + arguments[3] });  
                                    } else {
                                        var action = beastObj.action + 1;

                                        beastObj.action = action;
                                        beastObj.lastFilePath = temp + 'last.' + fileExt[0];
                                        beastObj.lastB64 = base64;
                                        beastObj.lastDetails = valueRsp;

                                        res.json({ success: "Safe Bro!!! Action Saved!!", 
                                                    beastState: beastObj 
                                        }); 
                                    }
                                });
                            }
                        });
                    }
                });
            break;

            case 'reset' :
                var imgBuffer = beastObj.originalb64;
                var filePath = beastObj.originFilePath;
                
                var fileExt = fileExtension(filePath);
                
                fs.writeFile(temp + 'last.' + fileExt[0], imgBuffer, 'base64', function(err) {

                    if (err){
                        console.log(err);
                    } else {
                        gmImg = gm(temp + 'last.' + fileExt[0]);

                        gmImg.identify(function(err, value){
                            if (err) {
                                console.log(this.outname + 'created ::' + arguments[3]);
                                res.json({ error: this.outname + '::::' + arguments[3] });  
                            } else {
                                var valueRsp = value;  

                                gmImg.toBase64('bmp', function(err, base64){
                                    if (err) {
                                        console.log(this.outname + ' :::: ' + arguments[3]);
                                        res.json({ error: this.outname + ' :::: ' + arguments[3] });  
                                    } else {

                                        beastObj.action = 0;
                                        beastObj.lastFilePath = temp + 'last.' + fileExt[0];
                                        beastObj.lastB64 = base64;
                                        beastObj.lastDetails = valueRsp;

                                        res.json({ success: "Safe Bro!!! Image Reset!!", 
                                                    beastState: beastObj 
                                        }); 
                                    }
                                });
                            }
                        });
                    }
                });
            break; 
        }

    } else {
        res.json({ error: "Sorry Bro!!! Your beast is not started yet!!"}); 
    }
});

router.get('/resize/:width?/:height?/:constraint?', function(req, res) {
    var request = req;
    console.log(req.params);
    var response = res;
    
    if (req.params.width == 'null') {
        req.params.width = null
    }

    gm(dir + '/images/test.png')
        .resize(req.params.width, req.params.height, req.params.constraint)
        .write(dir + '/images/created/test.png', function(err){
            if (err) {
                // console.dir(arguments)
                console.log(this.outname + 'created ::' + arguments[3]);
                res.json({ error: this.outname + 'created ::' + arguments[3] });  
            } else {
                res.json({ success: "Safe Bro :-) Everything went smooth!!", data: request.params }); 
            }
        })
});

router.get('/size', function(req, res) {
    gm(dir + '/images/test.png').size(function(err, value){
  		if (err) {
            	// console.dir(arguments)
            	console.log(this.outname + 'created ::' + arguments[3]);
            	res.json({ error: this.outname + '::::' + arguments[3] });  
            } else {
            	res.json({ size: value });  
            }
	})
});


// Getters ================================================================
// http://localhost:8080/gm/v1/getters/(identify,format, etc...)
router.post('/getters/:function', function(req, res) {

    if(checkBeastState()) {
        gmImg[req.params.function](function(err, value){
            if (err) {
                    console.log(this.outname + 'created ::' + arguments[3]);
                    res.json({ error: this.outname + '::::' + arguments[3] });  
                } else {
                    var valueRsp = value;  

                    beastObj.lastDetails = valueRsp;
                    
                    res.json({ success: "Safe Bro!!! Check the lastDetails in beastState!!", 
                            beastState: beastObj 
                    }); 
                }
        })
    } else {
        res.json({ error: "Sorry Bro!!! Your beast is not started yet!!"}); 
    }

});

router.get('/thumb/:width?/:height?/:outName?/:quality?', function(req, res) {
    var request = req;
    var response = res;
    
    if (req.params.width == 'null') {
        req.params.width = null
    }

    gm(dir + '/images/test.png')
    .thumb(req.params.width, req.params.height, dir + '/images/thumbs/' + req.params.outName, req.params.quality, callback)
    function callback(err, stdout, stderr, command){
        if (err) {
            // console.dir(arguments)
            console.log(stdout);
            console.log(this.outname + 'created ::' + arguments[3]);
            res.json({ error: this.outname + 'created ::' + arguments[3] });  
        } else {
            res.json({ 
                success: "Safe Bro :-) Everything went smooth!!", 
                data: request.params,
            }); 
        }
    }
});



// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/gm/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);


// STATIC FUNCTIONS
// =========================================

function checkBeastState(){
    return beastObj.state;
}

function copyFile(path, newPath){
    fs.copy(path, newPath, function (err) {
      if (err) return console.error(err)
      console.log("success!")
    });

    try {
      fs.copySync(path, newPath)
      console.log("success!")
    } catch (err) {
      console.error(err)
    }
}

function fileExtension(filename){
    return (/[.]/.exec(filename)) ? /[^.]+$/.exec(filename) : undefined;
}
