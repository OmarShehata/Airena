var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var idArray = [];

/////////////Tell Socket.io to accept connections
io.on('connection', function(socket){
  //A new user has connected! Inform everyone else
  socket.broadcast.emit('new-user',socket.id)
  //Tell this user how many players there are
  socket.emit('initial-users',{idArray:idArray,own_id:socket.id})
  idArray.push(socket.id);
  console.log("Hello user!")//This will output on the server side

  socket.on('disconnect', function(){
    console.log('user disconnected');
    for(var i=0;i<idArray.length;i++){
    	if(idArray[i] == socket.id) {
    		idArray.splice(i,1);
    		socket.broadcast.emit('remove-user',socket.id)
    		break;
    	}
    }
  });


  //If the server gets a 'update-position' message, tell everyone
  socket.on('update-position', function(msg){
    socket.broadcast.emit('update-position', msg);
  });
});


///////////////Start the server and such
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


//Make static files available
app.use("/src",express.static(path.join(__dirname, 'src')));

//If you're running locally, you can now open localhost:8080 in a web browser and see it running!
http.listen(8080, function(){
  console.log('listening on *:8080');
});
