var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
const vm = require('vm');
const util = require('util')
var gameloop = require('node-gameloop');

app.set('port', (process.env.PORT || 5000));

var games = {};
var gameroom = function() {
  this.idArray = [];
  this.codeArray = {};
  this.sockets = {};
  this.playerInfo = {};

  var self = this;

  this.RunAICode = function(id){
    try {
      var output = self.codeArray[id].script.runInContext(self.codeArray[id].context);
      var keys = output[0];
      io.emit("key-press",{keyMap:keys,id:id})
    } catch (e){
      self.sockets[id].emit("syntax-error",{errorText:String(e)})
    }
  }

  var fps = 60;
  this.game = gameloop.setGameLoop(function(delta) {
    //Keep running the code we have
    for(var key in self.codeArray){
      self.RunAICode(key)
    }
  }, 1000 / fps);

}

/////////////Tell Socket.io to accept connections
io.on('connection', function(socket){

  socket.on('join-game', function(msg) {
    var game;

    if ( games[msg.gameid] === undefined ) {
      games[msg.gameid] = new gameroom(); // create a game if needed
    }
    game = games[msg.gameid];
    socket.join(msg.gameid, function() { // join the room for the given game
      socket.gameid = msg.gameid;
      //A new user has connected! Inform everyone else
      socket.broadcast.to(socket.gameid).emit('new-user',socket.id)
      //Tell this user how many players there are
      socket.emit('initial-users',{idArray:game.idArray,own_id:socket.id})
      game.idArray.push(socket.id);
      game.sockets[socket.id] = socket;
      console.log("Hello user!")//This will output on the server side
      //Register new player
      game.playerInfo[socket.id] = {x:0,y:0,rotation:0,health:1}
    });
  });

  socket.on('disconnect', function(){
    var game = games[socket.gameid];
    if (game === undefined) { // don't care about disconnections not associated with an open game
      return;
    }
    console.log('user disconnected');
    delete game.playerInfo[socket.id];
    for(var i=0;i<game.idArray.length;i++){
      if(game.idArray[i] == socket.id) {
        game.idArray.splice(i,1);
        socket.broadcast.to(socket.gameid).emit('remove-user',socket.id)
        break;
      }
    }
    if (game.idArray.length == 0){  // no players left, shut the game down
      delete games[socket.gameid];
      console.log('Shutting down game with id '+socket.gameid);
      return;
    }
  });


  //If the server gets a 'update-position' message, tell everyone
  socket.on('update-position', function(msg){
    var game = games[socket.gameid];
    if(game === undefined) {
      return;
    }
    if(game.playerInfo[msg.player_id] == undefined) return; //Make sure this player actually exists here
    socket.broadcast.to(socket.gameid).emit('update-position', msg);
    //Save position info
    game.playerInfo[msg.player_id].x = msg.x;
    game.playerInfo[msg.player_id].y = msg.y;
    game.playerInfo[msg.player_id].rotation = msg.rot;
  });

  //Tell everyone when a health update occurs
  socket.on('update-health', function(msg){
    socket.broadcast.to(socket.gameid).emit('update-health', msg);
  })
  //Tell everyone when someone shoots
  socket.on('shoot', function(msg){
    socket.broadcast.to(socket.gameid).emit('shoot', msg);
  })


  //If the servers gets code, save it and keep running it
  socket.on('code-change',function(msg){
    var game = games[socket.gameid];
    if ( game === undefined ) { return; }
    if( typeof(game.codeArray[msg.id]) === "undefined"){
      var code = {code:"",sandbox:{'saved':{}}};
      code.context = vm.createContext(code.sandbox);
      game.codeArray[msg.id] = code;
    }
    game.codeArray[msg.id].code = msg.savedCode;
    try {
      game.codeArray[msg.id].sandbox = {'saved':{}}
      game.codeArray[msg.id].sandbox.enemyArray = []
      //Construct enemyArray
      for(var key in game.playerInfo){
        if(key == msg.id){
          game.codeArray[msg.id].sandbox.player = game.playerInfo[key]
        } else {
          game.codeArray[msg.id].sandbox.enemyArray.push(game.playerInfo[key])
        }
      }
      game.codeArray[msg.id].context = vm.createContext(game.codeArray[msg.id].sandbox);
      game.codeArray[msg.id].script = new vm.Script(msg.savedCode+"\ndoStep(player,enemyArray,saved);");
      var output = game.codeArray[msg.id].script.runInContext(game.codeArray[msg.id].context);
      var keys = output[0]
      //console.log(util.inspect(sandbox));
      io.to(socket.gameid).emit("key-press",{keyMap:keys,id:msg.id})
    } catch(e){
      socket.emit("syntax-error",{errorText:String(e)})
    }


  })

});



///////////////Start the server and such
app.get('/', function(req, res){
  var roomid = Math.random().toString(36).substr(2,5);
  res.redirect('/'+roomid); // bounce landing page to a random room
});
app.get('/[a-z0-9]+$', function(req,res){
  res.sendFile(__dirname + '/index.html');
});


//Make static files available
app.use("/src",express.static(path.join(__dirname, 'src')));
app.use("/src/lib",express.static(path.join(__dirname, 'src/lib')));

//If you're running locally, you can now open localhost:8080 in a web browser and see it running!
http.listen(app.get('port'), function(){
  console.log('listening on port',app.get('port'));
});
