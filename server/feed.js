var mongoose = require('mongoose');
    
var Schema = mongoose.Schema, 
    ObjectId = Schema.ObjectId;

var Comment = new Schema({
    title     : {type: String, default: ""},
    body      : {type: String, default: ""},
    date      : {type: Date, default: Date.now}
});

var NewsFeed = new Schema({
    fbid      : String,
    title     : {type: String, default: "Untitled"},
    body      : {type: String, default: ""},
    status    : {type: String, default: "incoming"},
    comments  : [Comment],
    date      : {type: Date, default: Date.now}
});


var NewsFeedDB = function(){
    console.log("Initialized NewsFeed.");
    this.db = mongoose.createConnection('mongodb://localhost/test');
    this.NewsFeedModel = this.db.model('NewsFeed', NewsFeed);
};

NewsFeedDB.prototype.getNewsFeed = function(request, callback) {
    var result = null;
    var query = {fbid:request.user.facebook.id};
    if (request.params.id)
        query._id = request.params.id;
    this.NewsFeedModel.find(query, function(err,docs){
        if (err) {
            console.log(err);
            return;
        }
        if (callback && typeof callback ==='function') {
            callback(docs);
        }
    });
};

NewsFeedDB.prototype.save = function(doc) {
    var instance = new this.NewsFeedModel(doc);
    instance.save();
};

NewsFeedDB.prototype.close = function(){
    this.db.close(function() {
        console.log("DB Closed.");
    });
};

var feed = new NewsFeedDB();
module.exports = feed;
