var express = require('express')
  , everyauth = require('everyauth')
  , conf = require('./conf')
  , socialdb = require('./socialdb')
  , feed = require('./feed')
;

var PORT = 80;
var usersById = {};
var nextUserId = 0;
var usersByFbId = {};

everyauth.debug = false;

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

function getFeed(req, res) {
  feed.getNewsFeed(req, function(result){
    res.render('form', {locals:{newsfeed:result}});
  });
};

function mergeStruct(source, override) {
    if (!source) return;
    var copy = {};
    for (var key in source) {
        copy[key] = source[key];
    }
    
    for (var key in override) {
        copy[key] = override[key];
    }
    
    console.log(copy);
    return copy;
}

everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });

everyauth
  .facebook
    .appId(conf.fb.appId)
    .appSecret(conf.fb.appSecret)
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
      return usersByFbId[fbUserMetadata.id] ||
        (usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
    })
    .redirectPath('/');

var app = express.createServer(
    express.bodyParser({uploadDir:'/tmp/test'})
  , express.static(__dirname + "/public")
  , express.favicon()
  , express.cookieParser()
  , express.session({ secret: 'boybastos'})
  , everyauth.middleware()
);


app.configure( function () {
  app.set('view engine', 'jade');
  app.set('views', __dirname + '/views');
  app.set('view options', {config: conf.app})
});

app.all("/",function(req,res,next){
    console.log("all() ...");
    next();
});

app.get('/', function (req, res) {
  console.log("get: /");
  res.render('home');
});

app.get('/feed', getFeed);
app.get('/feed/:id', getFeed);
app.post('/feed', function (req, res) {
    feed.save({
        title: req.body.title, 
        body: req.body.body,
        fbid: req.user.facebook.id
    });
    res.render('processForm');
});

app.get('/profile', function (req, res) {
  res.render('fbinfo');
});

app.get('/process', function (req, res) {
	socialdb.processIncoming();
	res.render('processed');
});

app.get('/list', function (req, res) {
    var images = socialdb.getImages(req.user.facebook.id, 
    function(result){
        res.render('imageList', 
        {locals:{images:result}});
    });
});

app.get('/photo/:id', function (req, res) {
	var image = socialdb.getImage(req.params.id, 
	function(result){
	    
	    var override = {
	        og_image: conf.app.host + "/images/" + result[0].path +"."+ result[0].ext,
	        og_url: conf.app.host + "/photo/" + result[0].path
	    };
	    
		res.render('imageDetails', {
		    locals:{
                image: result,
                config: mergeStruct(conf.app, override)
		}});
	});
});

app.get('/upload', function (req, res) {
  res.render('upload');
});

// multi-file upload
app.post('/upload', function (req, res) {
    var files = req.files.uploads;
    if (req.user.facebook){
        if (files instanceof Array) {
	  	    socialdb.saveImages(files, req.user.facebook);
		} else {
			socialdb.saveImagePost(files, req.user.facebook);
		}
    } else {
    	console.log("not logged in")
    }
    res.render('home');
});


app.listen(PORT);
console.log('Go to http://localhost:'+PORT);
console.log('path: ',__dirname);
module.exports = app;
