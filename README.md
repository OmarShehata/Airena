# Airena
Write &amp; edit AI code on the fly to fight in the arena!

This was an experiment that won 1st place at CarlHacks 2016. You can read more about that [here](http://devpost.com/software/airena).

**Current status**: Code is still messy and with a couple of bugs. Trying to clean it up and document it.

### What is it?

It's a very basic multiplayer space shooter. Turn right/left with arrow keys. Up to thrust. Space to shoot a giant laser. 

![Gameplay](http://i.imgur.com/Umh1XM2.gif)

At any point in the game, you can open up the console to write an AI bot that will control your player in real time!

![AI Control](http://i.imgur.com/QFCeb4A.gif)

### How to run
The game is written in [NodeJS](https://nodejs.org/en/), so make sure you have that installed. 
* Clone/download this repository 
* Run `npm install` to install dependencies 
* Run `node airena.js` to initiate the server
* Open http://localhost:5000 in your browser
* Open another tab to see the multiplayer in action! 
### Vision
I'd love to decouple the "code and run" mechanic from the game itself, so it can be used as a module to drop in in any other game or simulation.

The reason I do this is because I think the process of writing a piece of awesome or elegant code is usually obscured, especially for beginners. Watching people play this game would be **highlighting rather than hiding** the act of writing code. 

### Contributing 

I welcome any and all contributions! Feel free to fork this repository or do whatever you like. If you have ideas or suggestions, feel free to open an issue! 

My (rough) current to do:
* Clean up and document the code
* Create save slots for code in-game
* Create more interesting AI examples to run in the game as examples
* Decouple the code running mechanic from the actual game

### Project Setup 
All of the server logic and the code that runs the Javascript code in a sandbox is in **airena.js**. The client side game logic is in **src/init.js**

This project uses [CreateJS](http://createjs.com/) for canvas rendering, and [CodeMirror](https://codemirror.net/) for the in-game code editor.