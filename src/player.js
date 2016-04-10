//Player class
//For creating a player object that can be moved and controlled either through code or keyboard
var PlayerObject = function(stage_ref,color) {
    color = color || "blue";
	//Private variables
    var health = 1;
    var innerColorMap = {'blue':"#69C5FF",'red':"#FF5E81"}
    var outerColorMap = {'blue':"#169FF5",'red':"#FF194B"}
    var tipColorMap = {'blue':'#169FF5','red':'#FF194B'}
    var innerColor = innerColorMap[color];
    var outerColor = outerColorMap[color];
    var tipColor = tipColorMap[color]
    var stage;
    var shapeObj;
    var rotationAcc = 0;
    var rotationSpeed = 2;
    var rotationDamping = 0.8;
    var thrustSpeed = 1.5;
    var thrustDamping = 0.93;
    var thrustAcc = 0;
    var hurtDelay = 0;
    var frozen = 0;

    var self = {};

    //initialize player
    stage = stage_ref;
    shapeObj = new createjs.Shape();
    shapeObj.graphics.setStrokeStyle(3).beginStroke(outerColor).drawPolyStar( 0,0,  30,  3,  0,  30 ).endStroke()
    stage.addChild(shapeObj);
    self.shape = shapeObj;
    



    self.destroy = function(){
        stage.removeChild(shapeObj)
    }

    function rotate(dir){
        if(frozen > 0) return;
        //The faster you're moving, the slower you can rotate
        var extraFactor = 1-(thrustAcc / 30);
        rotationAcc += (rotationSpeed + rotationSpeed*extraFactor)* dir;
    }
    self.rotateRight = function(){
        rotate(1)
    }
    self.rotateLeft = function(){
        rotate(-1)
    }

    self.bump = function(vx,vy){
        thrustAcc = thrustSpeed * 2;
        shapeObj.rotation = Math.atan2(vy,vx) * (180/Math.PI)+90;
    }
    self.freeze = function(time){
        frozen = time;
    }

    self.update = function(){
        frozen --;
        hurtDelay--; 
        if(frozen > 0 || health <= 0) {
            rotationAcc = 0;
            thrustAcc = 0;
            return;
        }
        rotationAcc *= rotationDamping;
        shapeObj.rotation += rotationAcc;
        thrustAcc *= thrustDamping;

        var angle = (shapeObj.rotation-90)*(Math.PI/180)
        shapeObj.x += Math.cos(angle) * thrustAcc;
        shapeObj.y += Math.sin(angle) * thrustAcc;     

          
    }

    self.thrust = function(){
        if(frozen > 0) return;
        thrustAcc += thrustSpeed;

    }


	//Define our methods. 
	self.setHealth = function(num){
        if(hurtDelay > 0 || num < 0) return;
        hurtDelay = 60;
        health = num;
        shapeObj.graphics.clear()

        var radius = 28;
        var yOff = 0;
        var rightCorner = {x:radius,y:radius/2+yOff};
        var height = radius*health;
        var width = radius-height;
        var top1 = {x:width,y:-height*1.5+radius/2+yOff};
        var top2 = {x:-width,y:-height*1.5+radius/2+yOff};

        var leftCorner = {x:-radius,y:radius/2};
        shapeObj.graphics.beginFill(innerColor).mt(rightCorner.x,rightCorner.y).lt(top1.x,top1.y).lt(top2.x,top2.y).lt(leftCorner.x,leftCorner.y).endFill()
        shapeObj.graphics.setStrokeStyle(3).beginStroke(outerColor).drawPolyStar( 0,0,  30,  3,  0,  30 ).endStroke()
        //Draw tip
        var tip = {x:0,y:-radius-6}
        rightCorner = {x:8,y:-radius+10}
        leftCorner = {x:-8,y:-radius+10}
        shapeObj.graphics.beginFill(tipColor).mt(rightCorner.x,rightCorner.y).lt(tip.x,tip.y).lt(leftCorner.x,leftCorner.y).endFill()
        self.health = health;
    }
    self.setHealth(health)
    self.health = health;
	
    return self;
};