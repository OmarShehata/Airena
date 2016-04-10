var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
const vm = require('vm');
var gameloop = require('node-gameloop');


app.set('port', (process.env.PORT || 5000));

var idArray = [];
var codeArray = {};

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

  //If the servers gets code, save it and keep running it
  socket.on('code-change',function(msg){
    if(codeArray[msg.id] == undefined){
      codeArray[msg.id] = {code:"",context:{}}
      codeArray[msg.id].context = vm.createContext({});
    }
    codeArray[msg.id].code = msg.savedCode;
    try {
      codeArray[msg.id].script = new vm.Script(msg.savedCode+"\ndoStep({},[],{});");
      var output = codeArray[msg.id].script.runInThisContext();
      var keys = output[0]
      io.emit("key-press",{keyMap:keys,id:id})
    } catch(e){

    }
    
    
  })

});

function RunAICode(id){
  try {
    var output = codeArray[id].script.runInThisContext();
    var keys = output[0]
    io.emit("key-press",{keyMap:keys,id:id})
  } catch (e){

  }
}

var fps = 60;
gameloop.setGameLoop(function(delta) {
  //Keep running the code we have
  for(var key in codeArray){
    RunAICode(key)
  }
}, 1000 / fps);


///////////////Start the server and such
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


//Make static files available
app.use("/src",express.static(path.join(__dirname, 'src')));
app.use("/src/lib",express.static(path.join(__dirname, 'src/lib')));

//If you're running locally, you can now open localhost:8080 in a web browser and see it running!
http.listen(app.get('port'), function(){
  console.log('listening on port',app.get('port'));
});
