var express = require('express')
  , everyauth = require('everyauth')
  , conf = require('./conf')
  , socialdb = require('./socialdb');

var PORT = 8080;
var usersById = {};
var nextUserId = 0;
var usersByFbId = {};

everyauth.debug = true;


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
});

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/process', function (req, res) {
	socialdb.processIncoming();
	res.render('processed');
});

app.get('/photo/:id', function (req, res) {
	var image = socialdb.getImage(req.params.id, 
	function(result){
		res.render('imageDetails', {locals:{image:result}});
	});
});

app.get('/list', function (req, res) {
	var images = socialdb.getImages(req.user.facebook.id, 
	function(result){
		res.render('imageList', {locals:{images:result}});
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
