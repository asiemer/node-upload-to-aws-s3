const AWS = require('aws-sdk')
const async = require('async')
const bucketName = "affiniti-network-assure"
const path = require('path')
const fs = require('fs')

let pathParams, image, imageName;

AWS.config.loadFromPath('config.json')

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  
    res.writeHead(200, {
        "Content-Type": "text/html"
    });
    res.write(
        '<form action="/s3/upload" method="post" enctype="multipart/form-data">' +
        '<input type="file" name="file">' +
        '<input type="submit" value="Upload">' +
        '</form>'
    );
    res.end();

});

router.post('/upload', function(req, res, next) {
	if(!req.files) {
		return res.status(400).send('No files were uploaded.');
	}

	let file = req.files.file;
	//.mv() to move the file to the file system

	//if we want to keep a local copy of what is uploaded
	//not needed though if we just pass the form post through to S3
	// file.mv(file.name, function(err){
	// 	if(err)
	// 		return res.status(500), send(err);

	// 	console.log('file uploaded successfully to server (not s3)');
	// });

	//image and imageName are used in the functions below
	image = file.data;
    imageName = req.files.file.name;

    async.series([
        createMainBucket,
        createItemObject
        ], (err, result) => {
        if(err) return res.send(err)
        else return res.json({message: "Successfully uploaded"}) 
    })
})


const s3 = new AWS.S3({region: 'us-west-2'})
const createMainBucket = (callback) => {
	// Create the parameters for calling createBucket
	const bucketParams = {
	   Bucket : bucketName
	};                    
	s3.headBucket(bucketParams, function(err, data) {
	   if (err) {
	   	console.log("ErrorHeadBucket", err)
	      	s3.createBucket(bucketParams, function(err, data) {
			   if (err) {
			   	console.log("Error", err)
			      callback(err, null)
			   } else {
			      callback(null, data)
			   }
			});
	   } else {
	      callback(null, data)
	   }
	})                             
}

const createItemObject = (callback) => {
  console.log(image);
  console.log(imageName);

  const params = { 
        Bucket: bucketName, 
        Key: `${imageName}`, 
        ACL: 'public-read',
        Body:image
    };

	s3.putObject(params, function (err, data) {
		if (err) {
	    	console.log("Error uploading image: ", err);
	    	callback(err, null)
	    } else {
	    	console.log("Successfully uploaded image on S3", data);
	    	callback(null, data)
	    }
	})  
}


module.exports = router;