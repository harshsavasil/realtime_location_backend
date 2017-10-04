var url = "mongodb://localhost:27017/realtime_location";

var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
// var ObjectID = mongodb.ObjectID;

var collectionName = "central_location";

var app = express();
app.use(bodyParser.json());

function handleError(res, reason, message, code) {
    console.log("ERROR: " + reason);
    res.status(code || 500).json({"error": message});
  }
  
// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;


// Connect to the database before starting the application server.
mongodb.MongoClient.connect(url, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

app.post("/api/pushLocation", function(req, res) {
    user_id = req.body.user_id;
    arrayOfLocations = req.body.locations;
    if(user_id && arrayOfLocations) { 
        db.collection(collectionName).findOne({'user_id' : user_id},function(err,result){
            if(err) {
                handleError(res, err.message, "couldn't find user.");
            }
            else {
                if(result) {
                    old_locations = result.locations || [];
                    updated_locations = old_locations.concat(arrayOfLocations);
                    db.collection(collectionName).updateOne({'user_id' : user_id},{ $set: { locations: updated_locations} },function(err,res){
                        if(err) throw err;
                    })
                }
                else {
                    db.collection(collectionName).insertOne({ user_id: user_id, locations: arrayOfLocations},function(err,res){
                        if(err) throw err;
                    })
                }
            }
        })
        res.status(200).json({
            status: 1,
            message: 'new doc created.'
        })
    }
    else {
        res.status(200).json({
            status: -1,
            message: 'user_id or location array not recieved.'
        })
    }
});