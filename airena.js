var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
const vm = require('vm');
const util = require('util')
var gameloop = require('node-gameloop');

app.set('port', (process.env.PORT || 5000));

var idArray = [];
var codeArray = {};
var sockets = {}
var playerInfo = {}

/////////////Tell Socket.io to accept connections
io.on('connection', function(socket){
  //A new user has connected! Inform everyone else
  socket.broadcast.emit('new-user',socket.id)
  //Tell this user how many players there are
  socket.emit('initial-users',{idArray:idArray,own_id:socket.id})
  idArray.push(socket.id);
  sockets[socket.id] = socket;
  console.log("Hello user!")//This will output on the server side
  //Register new player
  playerInfo[socket.id] = {x:0,y:0,rotation:0,health:1}

  socket.on('disconnect', function(){
    console.log('user disconnected');
    delete playerInfo[socket.id];
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
    if(playerInfo[msg.player_id] == undefined) return;//Make sure this player actually exists here
    socket.broadcast.emit('update-position', msg);
    //Save position info
    playerInfo[msg.player_id].x = msg.x;
    playerInfo[msg.player_id].y = msg.y;
    playerInfo[msg.player_id].rotation = msg.rot;
  });

  //If the servers gets code, save it and keep running it
  socket.on('code-change',function(msg){
    if(codeArray[msg.id] == undefined){
      codeArray[msg.id] = {code:"",sandbox:{'saved':{}}}
      codeArray[msg.id].context = vm.createContext(codeArray[msg.id].sandbox);
    }
    codeArray[msg.id].code = msg.savedCode;
    try {
      codeArray[msg.id].sandbox = {'saved':{}}
      codeArray[msg.id].sandbox.enemyArray = []
      //Construct enemyArray 
      for(var key in playerInfo){
        if(key == msg.id){
          codeArray[msg.id].sandbox.player = playerInfo[key]
        } else {
          codeArray[msg.id].sandbox.enemyArray.push(playerInfo[key])
        }
      }
      codeArray[msg.id].context = vm.createContext(codeArray[msg.id].sandbox);
      codeArray[msg.id].script = new vm.Script(msg.savedCode+"\ndoStep(player,enemyArray,saved);");
      var output = codeArray[msg.id].script.runInContext(codeArray[msg.id].context);
      var keys = output[0]
      //console.log(util.inspect(sandbox));
      io.emit("key-press",{keyMap:keys,id:msg.id})
    } catch(e){
      socket.emit("syntax-error",{errorText:String(e)})
    }
    
    
  })

});

function RunAICode(id){
  try {
    var output = codeArray[id].script.runInContext(codeArray[id].context);
    var keys = output[0]
    //console.log(util.inspect(sandbox));
    io.emit("key-press",{keyMap:keys,id:id})
  } catch (e){
    sockets[id].emit("syntax-error",{errorText:String(e)})
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
