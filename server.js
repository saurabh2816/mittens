var express = require('express');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient; //Retrieve
var ObjectId = require('mongodb').ObjectId;
var app = express();
var db = null;
var bcrypt = require('bcryptjs');
var jwt = require('jwt-simple');
var moment = require('moment');

var JWT_SECRET = 'saurabh';

// Connect to the db
MongoClient.connect("mongodb://saurabh:saurabh@cluster0-shard-00-00.ksg2h.mongodb.net:27017,cluster0-shard-00-01.ksg2h.mongodb.net:27017,cluster0-shard-00-02.ksg2h.mongodb.net:27017/<dbname>?ssl=true&replicaSet=atlas-3dlq4x-shard-0&authSource=admin&retryWrites=true&w=majority", function(err, dbconn) {
  if(!err) {
    console.log("We are connected");
    db = dbconn;
  }
  else {
    console.log("nahi hua benchod connect!!");
  }
});

app.use(bodyParser.json()); // for parsing application/json, you have to include to res.send json
app.use(express.static('public'))

app.get('/meows', function(req, res, next){
    db.collection('meows', function(err, meowsCollection) {
        meowsCollection.find().toArray(function(err, meows){
          return res.json(meows);  //can do res.send but see evernote in MEAN notebook for why json was used
        });
    });
});

app.post('/meows', function(req, res, next){     //next to check for the databse error

  console.log(moment().format("dddd, MMMM Do YYYY, h:mm:ss a"));

  var token = req.headers['authorization'];
  var user = jwt.decode(token, JWT_SECRET);     //identifies tweet to a user who was given a token on login


  db.collection('meows', function(err, meowsCollection) {

      var newMeow = {
        text: req.body.newMeow,
        user: user._id,   // new meows will also have a user ID associated with them, so now we know which user tweeted that tweet
        username: user.username,
        date: moment().format("h:mma, D MMM YYYY")
      };

      meowsCollection.insert(newMeow, {w:1}, function(err, meows){
        return res.send();
      });
  });
});


app.put('/meows/remove', function(req, res, next){

  var token = req.headers.authorization;
  var user = jwt.decode(token, JWT_SECRET);     //identifies tweet to a user who was given a token on login

  db.collection('meows', function(err, meowsCollection) { //collections are like tables in sql database
      var meowId = req.body.meow._id;
      meowsCollection.remove({_id: ObjectId(meowId), user: user._id}, {w:1}, function(err, meows){
        return res.send();
      });
  });

});

app.post('/users', function(req, res, next){
  db.collection('users', function(err, usersCollection) {  //defining a collecction

    bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
        // Store hash in your password DB.
        var newUser = {
          username : req.body.username,
          password : hash
        }

      usersCollection.insert(newUser, {w:1}, function(err){ //since req.body is an object we can directly add it
          return res.send();
        });
      });
    });
  });
});


app.put('/users/signin', function(req, res, next){
  db.collection('users', function(err, usersCollection) {

  usersCollection.findOne({username: req.body.username}, function(err, user){
    bcrypt.compare(req.body.password, user.password, function(err, result) {
        // result === true
        if(result) {
          var token = jwt.encode(user, JWT_SECRET);  // encode
          return res.json({token: token});
        }
        else {
          return res.status(400).send();
        }
      });
    });
  });
});

app.listen(3000, function () {
  // var d = Date().toString().substring(4,Date().toString().length );
  var d= moment().format("h:mma, D MMM YYYY");
  console.log(d)
})
