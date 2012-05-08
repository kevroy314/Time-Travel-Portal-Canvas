//Game state object which forms a circular chain with Portal and PlayerCharacter objects
//Represents the state of the game at a given time 't'
function GameState(currentTime, currentUpdateCount, currentPlayerState, currentObjectStates){
	this.pc = currentPlayerState; //Current state of PlayerCharacter variable
	this.objList = currentObjectStates; //Current state of array of deterministic objects with time-stepped update function
	this.t = currentTime; //Time of current state
	this.updateCount = currentUpdateCount;
	this.clone = function(){
		var clonedGameState = new GameState();
		if(this.pc!=null)
			clonedGameState.pc = this.pc.clone(); //WARNING: IF PC IS SELF REFERENTIAL THIS WILL CAUSE AN INFINITE LOOP!
		if(this.objList!=null)
			clonedGameState.objList = this.objList.clone();
		clonedGameState.t = this.currentTime;
		clonedGameState.updateCount = this.updateCount;
		return clonedGameState;
	}
}

//Function which loads a game state, adjusts the appropriate timers to allow for state to be loaded while
//travelling forward or backwards in time.
function LoadGameState(GameState){
	if(GameState.pc!=null)
		pc = GameState.pc.clone(); //Load the player state
	if(GameState.testObjs!=null)
		testObjs = GameState.testObjs.clone(); //Clone the test objects
	updateCount = GameState.updateCount; //Load the update count
	timeTravelCumulative+=(currentTime-GameState.t); //Adjust the cumulative time travel amount relative to the game state
	currentTime = getTimeTravelAdjustedTime(); //Set a new current time relative to the amount time travelled
	nextRenderTime = currentTime+1; //Tell the render to render next
}

//Object which represents the player
//Contains position, suggested velocity (real velocity is determined by the user, color, portal references
//and a series of functions. The move function performs the moves while checking for the portal collisions;
//this function is complex looking because it checks to make sure the portals exist, allows for an overlap
//which is not precise but requires only 50% of the character to be on the portal. It also performs a basic
//hysteresis effect preventing the character from immediately reentering portals until they have left the
//portal's area.
//It has a draw function which draws the portals then it's self.
//It has a function to create each portal which enforces the rules requiring the in portal to be created first.
//It has two helper functions which help determine if (and how much) a rectangle overlaps with another rectangle.
//The function tracks portal immunity for both portals allowing bi-directional travel at if required later.
var InputStackEventType = { PlayerMovementEvent:0, PlayerActionEvent:1 };
function PlayerCharacter(startX, startY, startColor){
	this.X = startX;
	this.Y = startY;
	this.width = 10;
	this.height = 10;
	this.SuggestedXVel = 4;
	this.SuggestedYVel = 4;
	this.color = startColor;
	this.inPortal = null;
	this.outPortal = null;
	this.visible = true;
	this.inputStack = new Array(); //The stack containing all user actions
	this.move = function(XVel,YVel){ //FLAG
		var newX = this.X+XVel;
		var newY = this.Y+YVel;
		var overlapInPortal = null;
		var overlapOutPortal = null;
		if(this.inPortal!=null){
			var overlapInPortalArea = this.areaOfOverlap(this.inPortal.X,this.inPortal.Y,
									  this.inPortal.X+this.inPortal.width,this.inPortal.Y+this.inPortal.height,
									  newX,newY,
									  newX+this.width,newY+this.height);
			var overlapInPortalBoolean = doRectanglesOverlap(this.inPortal.X,this.inPortal.Y,
									  this.inPortal.X+this.inPortal.width,this.inPortal.Y+this.inPortal.height,
									  newX,newY,
									  newX+this.width,newY+this.height);
			overlapInPortal = overlapInPortalArea>this.width*this.height/2&&overlapInPortalBoolean;
			if(overlapInPortal){
				if(this.immuneToPortal!=1&&this.outPortal!=null){
					this.immuneToPortal = 2;
					return true;
				}
			}
		}
		if(this.outPortal!=null){
			var overlapOutPortalArea = this.areaOfOverlap(this.outPortal.X,this.outPortal.Y,
									   this.outPortal.X+this.outPortal.width,this.outPortal.Y+this.outPortal.height,
									   newX,newY,
									   newX+this.width,newY+this.height);
			var overlapOutPortalBoolean = doRectanglesOverlap(this.outPortal.X,this.outPortal.Y,
									   this.outPortal.X+this.outPortal.width,this.outPortal.Y+this.outPortal.height,
									   newX,newY,
									   newX+this.width,newY+this.height);
			overlapOutPortal = overlapOutPortalArea>this.width*this.height/2&&overlapOutPortalBoolean;
			if(overlapOutPortal){
				if(this.immuneToPortal!=2&&this.inPortal!=null){
					if(timeIsForward)
						LoadGameState(this.inPortal.GameState);
					this.immuneToPortal = 1;
					return true;
				}
			}
		}
		if((this.immuneToPortal==1&&!overlapInPortal)||(this.immuneToPortal==2&&!overlapOutPortal))
			this.immuneToPortal = 0;
		this.X = newX;
		this.Y = newY;
		return false;
	}
	this.draw = function(ctx){
		if(this.visible){
			if(this.inPortal!=null){
				this.inPortal.draw(ctx);
			}
			if(this.outPortal!=null){
				this.outPortal.draw(ctx);
			}
			ctx.fillStyle = this.color;
			ctx.fillRect(this.X,this.Y,this.width,this.height);
		}
	}
	this.createInPortal = function(GameState){
		this.outPortal = null;
		this.inPortal = new Portal(GameState,this.X,this.Y,"#0000FF");
		this.inPortal.X = this.inPortal.X-this.inPortal.width/2+this.width/2;
		this.inPortal.Y = this.inPortal.Y-this.inPortal.height/2+this.height/2;
		this.immuneToPortal = 1;
		return true;
	}
	this.createOutPortal = function(){
		if(this.inPortal!=null&&!(doRectanglesOverlap(this.inPortal.X,this.inPortal.Y,
								  this.inPortal.X+this.inPortal.width,this.inPortal.Y+this.inPortal.height,
								  this.X,this.Y,
								  this.X+this.inPortal.width,this.Y+this.inPortal.height))){
			this.outPortal = new Portal(null,this.X,this.Y,"#FF0000");
			this.outPortal.X = this.outPortal.X-this.outPortal.width/2+this.width/2;
			this.outPortal.Y = this.outPortal.Y-this.outPortal.height/2+this.height/2;
			this.immuneToPortal = 2;
			return true;
		}
		return false;
		
	}
	this.areaOfOverlap = function(p1x1,p1y1,p1x2,p1y2,p2x1,p2y1,p2x2,p2y2){
		return (Math.max(p1x1,p2x1)-Math.min(p1x2,p2x2))*(Math.max(p1y1,p2y1)-Math.min(p1y2,p2y2));
	}
	this.clone = function(){
		var clonedPlayerCharacter = new PlayerCharacter();
		clonedPlayerCharacter.X = this.X;
		clonedPlayerCharacter.Y = this.Y;
		clonedPlayerCharacter.width = this.width;
		clonedPlayerCharacter.height = this.height;
		clonedPlayerCharacter.SuggestedXVel = this.SuggestedXVel;
		clonedPlayerCharacter.SuggestedYVel = this.SuggestedYVel;
		clonedPlayerCharacter.color = this.color;
		if(this.inPortal!=null)
			clonedPlayerCharacter.inPortal = this.inPortal.clone(); //WARNING: WATCH FOR SELF REFERENCING PORTALS!
		if(this.outPortal!=null)
			clonedPlayerCharacter.outPortal = this.inPortal.clone(); //WARNING: WATCH FOR SELF REFERENCING PORTALS!
		clonedPlayerCharacter.visible = this.visible;
		clonedPlayerCharacter.inputStack = new Array(); //The stack containing all user actions
		for(var i = 0; i < this.inputStack.length;i++)
			clonedPlayerCharacter.inputStack[i] = this.inputStack[i];
		return clonedPlayerCharacter;
	}
}

function doRectanglesOverlap(p1x1,p1y1,p1x2,p1y2,p2x1,p2y1,p2x2,p2y2){
		return (p1x1<p2x2&&p1x2>p2x1&&p1y1<p2y2&&p1y2>p2y1);
}

//This object forms a circular group with PlayerCharacter and GameState. It contains basic information about
//a portal. The portal has a position and a color (although this could be replaced by an image later). It
//contains the state of the game upon it's creation as well as a function for drawing.
function Portal(GameState,XPos,YPos,Color){
	this.X = XPos;
	this.Y = YPos;
	this.width = 12;
	this.height = 19;
	this.GameState = GameState;
	this.color = Color;
	this.draw = function(ctx){
		ctx.fillStyle = this.color;
		drawEllipse(ctx,this.X,this.Y,this.width,this.height);
	}
	this.clone = function(){
		var clonedPortal = new Portal();
		clonedPortal.X = this.X;
		clonedPortal.Y = this.y;
		clonedPortal.width = this.width;
		clonedPortal.height = this.height;
		if(this.GameState!=null)
			clonedPortal.GameState = this.GameState.clone(); //WARNING: WATCH FOR SELF REFERENCING PORTALS!
		clonedPortal.color = this.color;
	}
}

//This helper function performs a fill ellipse function
function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848;
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
  ctx.fill();
}

function randInt(min,max){
	return Math.round((Math.random()*(max-min))+min);
}

function ProjectileManager(){
	this.projectiles = new Array();
	this.randomize = function(numProjectiles,minX,minY,maxX,maxY,minXVel,minYVel,maxXVel,maxYVel){
		for(var i = 0; i < numProjectiles;i++)
			this.projectiles[i] = new TestProjectile(randInt(minX,maxX),randInt(minY,maxY),randInt(minXVel,maxXVel),randInt(minYVel,maxYVel));
	}
	this.update = function(t,dt,collisionObjects){
		for(var i = 0; i < this.projectiles.length;i++)
			this.projectiles[i].update(t,dt,collisionObjects);
	}
	this.draw = function(context){
		for(var i = 0; i < this.projectiles.length;i++)
			this.projectiles[i].draw(context);
	}
	this.clone = function(){
		var clonedProjectileManager = new ProjectileManager();
		clonedProjectileManager.projectiles = new Array();
		for(var i = 0; i < this.projectiles.length; i++)
			if(this.projectiles[i]!=null)
				clonedProjectileManager.projectiles[i] = this.projectiles[i].clone();
	}
}

//This object represents a simple deterministic time-stepped test projectile. It contains it's position, size,
//velocity, boundry information (prevents projectiles from leaving a specific area) and color. It also contains
// a function for updating and a function for drawing.
function TestProjectile(startX, startY, xVel, yVel){
	this.X = startX;
	this.Y = startY;
	this.width = 3;
	this.height = 3;
	this.XVel = xVel;
	this.YVel = yVel;
	this.MinX = 0;
	this.MinY = 0;
	this.MaxX = canvas.width;
	this.MaxY = canvas.height;
	this.color = "#FF0000";
	this.update = function(t,dt,collisionObjects){
		var newX = this.X+this.XVel*dt;
		var newY = this.Y+this.YVel*dt;
		
		if(newX+this.width>this.MaxX||newX<this.MinX)
			this.XVel*=-1;
		if(newY+this.height>this.MaxY||newY<this.MinY)
			this.YVel*=-1;
			
		if(collisionObjects.length!=0){
			for(var i = 0; i < collisionObjects.length;i++){
				if(doRectanglesOverlap(this.X,this.Y,this.X+this.width,this.Y+this.height,
									   collisionObjects[i].X,collisionObjects[i].Y,
									   collisionObjects[i].X+collisionObjects[i].width,collisionObjects[i].Y+collisionObjects[i].height)){
					if(this.Y+this.height>collisionObjects[i].Y&&this.Y<collisionObjects[i].Y+collisionObjects[i].height){
						this.YVel*=-1;
					}
					if(this.X+this.width>collisionObjects[i].X&&this.X<collisionObjects[i].X+collisionObjects[i].width){
						this.XVel*=-1;
					}
				}
			}
		}
		this.X = this.X+this.XVel*dt;
		this.Y = this.Y+this.YVel*dt;
	}
	this.draw = function(ctx){
		ctx.fillStyle = this.color;
		ctx.fillRect(this.X,this.Y,this.width,this.height);
	}
	this.clone = function(){
		var clonedTestProjectile = new TestProjectile();
		clonedTestProjectile.X = this.X;
		clonedTestProjectile.Y = this.Y;
		clonedTestProjectile.width = this.width;
		clonedTestProjectile.height = this.height;
		clonedTestProjectile.XVel = this.XVel;
		clonedTestProjectile.YVel = this.YVel;
		clonedTestProjectile.MinX = this.MinX;
		clonedTestProjectile.MinY = this.MinY;
		clonedTestProjectile.MaxX = this.MaxX;
		clonedTestProjectile.MaxY = this.MaxY;
		clonedTestProjectile.color = this.color;
	}
}