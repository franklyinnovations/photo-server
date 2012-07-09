var mongoose = require('mongoose'),
	easyimg = require('easyimage'),
	fs = require('fs');
	
var Schema = mongoose.Schema, 
	ObjectId = Schema.ObjectId;

var ImagePost = new Schema({
	path	  : String,
	type      : String,
	size	  : Number,
	fbid      : String,
	ext       : String,
	width     : Number,
	height    : Number,
	title     : {type: String, default: ""},
	description : {type: String, default: ""},
	status	  : {type: String, default: "incoming"},
	date      : {type: Date, default: Date.now}
});

var SocialDB = function(){
	console.log("Initialized SocialDB.");
		
	this.publicPath = __dirname + "/public/images";
	this.thumbnailPath = __dirname + "/public/thumb";
	this.uploadPath = "/tmp/test";
	this.thWidth = 200;
	this.thHeight = 200;
	this.width = 1024;
	this.height = 768;
	
	this.db = mongoose.createConnection('mongodb://localhost/test');
	this.ImagePostModel = this.db.model('ImagePost', ImagePost);
};

SocialDB.prototype.saveImages = function(images, user, title, description) {
	console.log("saveImages");
	if (images.length > 1) {
		for (var i=0; i<images.length; i++) {
			this.saveImagePost(images[i],user, title, description);
		}
	} else {
		this.saveImagePost(imagess, user, title, description);
	}
};

SocialDB.prototype.saveImagePost = function(image, user, title, description) {
	console.log("file: " + image.path + " : " + image.type + " : " + image.size);
	var instance = new this.ImagePostModel({
	    title: title,
	    description: description,
		type: image.type,
		size: image.size,
		path: image.path,
		fbid: user.id
	});
	instance.save();
};

SocialDB.prototype.getImage = function(id, callback) {
	var result = null;
	this.ImagePostModel.find({status:"live", _id:id }, function(err,doc){
		if (err) {
			console.log(err);
			return;
		}
		if (callback && typeof callback ==='function') {
			callback(doc);
		}
	});
};

SocialDB.prototype.getImages = function(userID, callback) {
	var result = null;
	this.ImagePostModel.find({status:"live", fbid:userID }, function(err,docs){
		if (err) {
			console.log(err);
			return;
		}
		if (callback && typeof callback ==='function') {
			callback(docs);
		}
	});
};

SocialDB.prototype.processIncoming = function() {
	this.ImagePostModel.find({status:"incoming"}, socialdb.processImages);
};

SocialDB.prototype.processImages = function(err, docs) {
	if (err) {
		console.log(err);
		return;
	}
	if (docs && docs.length) {
		for (var i=0; i<docs.length; i++) {
			var doc = docs[i];
			var fileType = doc.type;
			if (fileType && fileType.indexOf('image') != -1) {
				socialdb.processImage(doc);
			}
		}
	}
};

SocialDB.prototype.getImageExtension = function(type) {
	var imageType = type.match(/(image)\/(\w+)/);
	var ext = imageType[2];
	ext = ext.replace("jpeg","jpg");
	return (ext)?ext:"jpg";
};

SocialDB.prototype.getImageName = function(doc) {
	return doc.path+"."+socialdb.getImageExtension(doc.type);
};

SocialDB.prototype.processImage = function(doc) {
	var tmpFilename = socialdb.getImageName(doc);
	fs.rename(doc.path, tmpFilename, function(err) {
		if(err) {
			console.log("error:", err)
			throw err;
		}
		easyimg.info(tmpFilename, function(err, stdout, stderr) {
			if(err) {
				console.log("error:", err)
				throw err;			
			}
			var thumbnail = tmpFilename.replace(socialdb.uploadPath, socialdb.thumbnailPath);
			var webImage = tmpFilename.replace(socialdb.uploadPath, socialdb.publicPath);
			
			doc.width = stdout.width;
			doc.height = stdout.height;
			socialdb.createThumbnail(tmpFilename,thumbnail, doc, socialdb.updateImage);
			socialdb.createWebImage(tmpFilename, webImage, doc);
		});
	});
};

SocialDB.prototype.createWebImage = function(source, destination, doc, callback) {
	easyimg.rescrop({
		src : source,
		dst : destination,
		width : socialdb.width,
		x : 0,
		y : 0
	}, function(err, image) {
		if(err) {
			throw err;
		} else {
			console.log("webImage created: destination");
		}
		
	});
};


SocialDB.prototype.createThumbnail = function(source, destination, doc, callback) {
	easyimg.rescrop({
		src : source,
		dst : destination,
		width : socialdb.thWidth,
		height : socialdb.thHeight,
		fill : true,
		x : 0,
		y : 0
	}, function(err, image) {
		if(err)
			throw err;
		if (callback && typeof callback ==='function') {
			callback(doc);
		}
	});
};


SocialDB.prototype.updateImage = function(doc) {
	var filename = doc.path.replace(socialdb.uploadPath+"/","");
	var ext = socialdb.getImageExtension(doc.type);
	var update = {
		path: filename,
	 	width: doc.width,
	 	height: doc.height,
	 	ext: ext,
	 	status: "live",
	 };
	 socialdb.ImagePostModel.update({ _id: doc._id }, update, function (err) {
		if (err) {
			throw err;
		} else {
			console.log("db updated: "+doc._id);
		}
	 });
	
};

SocialDB.prototype.close = function(){
	this.db.close(function() {
		console.log("DB Closed.");
	});
};

var socialdb = new SocialDB();

module.exports = socialdb;
