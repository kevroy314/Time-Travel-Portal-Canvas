function Simulation(width, height, numTestObjects, speed){
	this.width; //The width of the simulation area
	this.height; //The height of the simulation area
	
	this.speed = speed;
	
	this.startTime; //Time offset from start of application (everything absolute time variable references to this)
	this.currentTime; //Current simulation time
	this.timeTravelCumulative; //The amount of time the player has time travelled via portal or continous
	this.timeTravelEventStartTime; //The start time of a continuous time travel event (reset to 0 by portal time travel)
	this.timeIsForward; //Boolean representing if time is going forward or reverse

	this.renderInterval; //Number of ticks we skip to keep a pace
	this.maxRenderSkips; //Number of frames we're allowed to skip rendering	
	this.nextRenderTime; //Next render tick
	this.renderSkipsCount; //Number of times we update before rendering for given iteration
	this.updateCount;

	this.eventStack; //Stack of events the user has executed
	
	this.stateRegistry;
	
	this.pc; //PlayerCharacter object representing the player (forms circular chain with Portal and GameState objects
	this.projectiles; //Array of deterministic objects with time-stepped update function
	
	this.Initialize = function(width, height, numTestObjects){
		this.width = width;
		this.height = height;
		
		this.startTime = (new Date).getTime(); //This is our reference time
		this.currentTime = this.startTime; //Irrelevant
		this.timeTravelCumulative = 0; //No time travel has happened yet
		this.timeTravelEventStartTime = 0; //Irrelevant
		this.timeIsForward = true; //We go forward in time by default
		
		//Magic#
		this.renderInterval = 33; //1000ms/30 ticks per second
		//Magic#
		this.maxRenderSkips = 5; //This number can be changed to allow more updates between renders
		this.nextRenderTime = 0; //Represents when we're going to render again
		this.renderSkipsCount = 0; //Irrelevant
		this.updateCount = 0;
		
		this.eventStack = new Array();
		
		this.stateRegistry = new GameStateRegistry();
		
		//Magic#
		this.pc = new PlayerCharacter(width/2, height/2, "#FFFFFF", this); //Player starts in the middle
		this.pc.X-=this.pc.width/2;
		this.pc.Y-=this.pc.height/2;
		
		this.projectiles = new ProjectileManager(numTestObjects,0,0,width,height,-5,-5,5,5);
	}
	
	//Automatically Initialize
	if(width!=undefined&&height!=undefined&&numTestObjects!=undefined)
		this.Initialize(width,height,numTestObjects);
	else
		this.Initialize(100,100,10); //Magic#
	
	this.render = function(ctx){
		//Draw the test objects
		this.projectiles.render(ctx);
		
		//Draw the player
		this.pc.render(ctx);
		
		//Overlay some stats
		ctx.fillStyle = "#FFFFFF"; //Magic#
		ctx.fillText("Current Time: "+ this.currentTime,10,10); //Magic#
	}
	
	this.update = function(dt,keys){
		this.stateRegistry.removeStatesLaterThan(sim.getTimeTravelAdjustedTime()); //Remove states later than current to clean up
		if(this.updateCount==0&&dt<0) return;
	
		if(dt>0){
			this.updateCount+=dt;
			this.handleKeyEvents(keys); //First handle any user input
		}
		else if(dt<0){
			if(this.updateCount==0)
				return;
			else
				this.updateCount+=dt;
		}
		this.projectiles.update(this.currentTime,dt,[this.pc]);
		
	}
	
	//Calculates the relative time given the amount we've time travelled total and the reference time
	this.getTimeSinceSimulationStart = function(){
		return (new Date).getTime()-this.startTime;
	}
	
	this.getTimeTravelAdjustedTime = function(){
		return this.getTimeSinceSimulationStart() - this.timeTravelCumulative;
	}
	
	//Function which loads a game state, adjusts the appropriate timers to allow for state to be loaded while
	//travelling forward or backwards in time.
	this.loadGameState = function(registryIndex){
		if(this.stateRegistry.gameStates[registryIndex].pc!=null)
			this.pc = this.stateRegistry.gameStates[registryIndex].pc; //Load the player state
		if(this.stateRegistry.gameStates[registryIndex].projectiles!=null)
			this.projectiles = this.stateRegistry.gameStates[registryIndex].projectiles; //Clone the test objects
		this.updateCount = this.stateRegistry.gameStates[registryIndex].updateCount; //Load the update count
		this.timeTravelCumulative+=(this.currentTime-this.stateRegistry.gameStates[registryIndex].t); //Adjust the cumulative time travel amount relative to the game state
		this.currentTime = this.getTimeTravelAdjustedTime(); //Set a new current time relative to the amount time travelled
		this.nextRenderTime = this.currentTime+1; //Tell the render to render next
	}

	this.characterMoveEvent = function(dx,dy){
		var timeTravelLocation = this.pc.move(dx,dy,this.timeIsForward);
		if(timeTravelLocation != -1)
			this.loadGameState(timeTravelLocation);
		
		this.pc.inputStack.push({movementEventType: InputStackEventType.PlayerMovementEvent,
								 currentTime: this.currentTime,
								 dx: dx,dy: dy});
	}
	
	//This function handles key events which trigger while a key is depressed.
	this.handleKeyEvents = function(keys){
		if(keys[37]){ //Left Key
			var dx = -this.pc.SuggestedXVel; //enforce suggested speed
			if(this.pc.X+dx<0) dx=0; //enforce boundry
			var dy = 0;
			
			this.characterMoveEvent(dx,dy);
		}
		if(keys[38]){ //Up Key
			var dx = 0;
			var dy = -this.pc.SuggestedYVel; //enforce suggested speed
			if(this.pc.Y+dy<0) dy=0; //enforce boundry
			
			this.characterMoveEvent(dx,dy);
		}
		if(keys[39]){ //Right Key
			var dx = this.pc.SuggestedXVel; //enforce suggested speed
			if(this.pc.X+dx+this.pc.width>canvas.width) dx=0; //enforce boundry
			var dy = 0;
			
			this.characterMoveEvent(dx,dy);
		}
		if(keys[40]){ //Down Key
			var dx = 0;
			var dy = this.pc.SuggestedYVel; //enforce suggested speed
			if(this.pc.Y+dy+this.pc.height>canvas.height) dy=0; //enforce boundry
			
			this.characterMoveEvent(dx,dy);
		}
		if(keys[49]){ //1 key
			var gs0 = new GameState(this.currentTime,this.updateCount,this.pc.clone(),this.projectiles.clone()); //Record the current game state
			
			var stateIndex = this.stateRegistry.addGameState(gs0);
			
			this.pc.createInPortal(stateIndex);
			
			this.pc.inputStack.push({movementEventType: InputStackEventType.PlayerActionEvent,
									 currentTime: this.currentTime,
									 stateIndex: stateIndex});
		}
		if(keys[50]){ //2 key
			var gs0 = new GameState(this.currentTime,this.updateCount,this.pc.clone(),this.projectiles.clone()); //Record the current game state
			
			var stateIndex = this.stateRegistry.addGameState(gs0);
			
			this.pc.createOutPortal(stateIndex);
			
			this.pc.inputStack.push({movementEventType: InputStackEventType.PlayerActionEvent,
									 currentTime: this.currentTime,
									 stateIndex: stateIndex});
		}
	}
}

//Game state object which forms a circular chain with Portal and PlayerCharacter objects
//Represents the state of the game at a given time 't'
function GameState(currentTime, currentUpdateCount, currentPlayerState, currentObjectStates){
	this.pc = currentPlayerState; //Current state of PlayerCharacter variable
	this.projectiles = currentObjectStates; //Current state of array of deterministic objects with time-stepped update function
	this.t = currentTime; //Time of current state
	this.updateCount = currentUpdateCount;
	this.clone = function(){
		var clonedGameState = new GameState();
		if(this.pc!=null)
			clonedGameState.pc = this.pc.clone(); //WARNING: IF PC IS SELF REFERENTIAL THIS WILL CAUSE AN INFINITE LOOP!
		if(this.projectiles!=null)
			clonedGameState.projectiles = this.projectiles.clone();
		clonedGameState.t = this.t;
		clonedGameState.updateCount = this.updateCount;
		return clonedGameState;
	}
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
var PortalImmunityType = {NoImmunity: 0, InPortalImmunity: 1, OutPortalImmunity: 2};
function PlayerCharacter(startX, startY, startColor){
	this.X = startX;
	this.Y = startY;
	this.width = 10; //Magic#
	this.height = 10; //Magic#
	this.SuggestedXVel = 4; //Magic#
	this.SuggestedYVel = 4; //Magic#
	this.color = startColor;
	this.inPortalColor = "#0000FF"; //Magic#
	this.outPortalColor = "#FF0000"; //Magic#
	this.inPortal = null;
	this.outPortal = null;
	this.visible = true;
	this.inputStack = new Array(); //The stack containing all user actions
	this.move = function(XVel,YVel,timeTravelIsAllowed){ //FLAG
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
				if(this.immuneToPortal!=PortalImmunityType.InPortalImmunity&&this.outPortal!=null){
					this.immuneToPortal = PortalImmunityType.OutPortalImmunity;
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
				if(this.immuneToPortal!=PortalImmunityType.OutPortalImmunity&&this.inPortal!=null){
					if(timeTravelIsAllowed)
						return this.inPortal.GameStateRegistryIndex;
					this.immuneToPortal = PortalImmunityType.InPortalImmunity;
				}
			}
		}
		if((this.immuneToPortal==PortalImmunityType.InPortalImmunity&&!overlapInPortal)||(this.immuneToPortal==PortalImmunityType.OutPortalImmunity&&!overlapOutPortal))
			this.immuneToPortal = PortalImmunityType.NoImmunity;
		this.X = newX;
		this.Y = newY;
		return -1; //No time travel!
	}
	this.render = function(ctx){
		if(this.visible){
			if(this.inPortal!=null){
				this.inPortal.render(ctx);
			}
			if(this.outPortal!=null){
				this.outPortal.render(ctx);
			}
			ctx.fillStyle = this.color;
			ctx.fillRect(this.X,this.Y,this.width,this.height);
		}
	}
	this.createInPortal = function(gameStateRegistryIndex){
		this.outPortal = null;
		this.inPortal = new Portal(gameStateRegistryIndex,this.X,this.Y,this.inPortalColor);
		this.inPortal.X = this.inPortal.X-this.inPortal.width/2+this.width/2;
		this.inPortal.Y = this.inPortal.Y-this.inPortal.height/2+this.height/2;
		this.immuneToPortal = PortalImmunityType.InPortalImmunity;
		return true;
	}
	this.createOutPortal = function(gameStateRegistryIndex){
		if(this.inPortal!=null&&!(doRectanglesOverlap(this.inPortal.X,this.inPortal.Y,
								  this.inPortal.X+this.inPortal.width,this.inPortal.Y+this.inPortal.height,
								  this.X,this.Y,
								  this.X+this.inPortal.width,this.Y+this.inPortal.height))){
			this.outPortal = new Portal(gameStateRegistryIndex,this.X,this.Y,this.outPortalColor);
			this.outPortal.X = this.outPortal.X-this.outPortal.width/2+this.width/2;
			this.outPortal.Y = this.outPortal.Y-this.outPortal.height/2+this.height/2;
			this.immuneToPortal = PortalImmunityType.OutPortalImmunity;
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
			clonedPlayerCharacter.outPortal = this.outPortal.clone(); //WARNING: WATCH FOR SELF REFERENCING PORTALS!
		clonedPlayerCharacter.visible = this.visible;
		clonedPlayerCharacter.inputStack = new Array(); //The stack containing all user actions
		for(var i = 0; i < this.inputStack.length;i++)
			clonedPlayerCharacter.inputStack[i] = this.inputStack[i];
		return clonedPlayerCharacter;
	}
}

//This object forms a circular group with PlayerCharacter and GameState. It contains basic information about
//a portal. The portal has a position and a color (although this could be replaced by an image later). It
//contains the state of the game upon it's creation as well as a function for drawing.
function Portal(gameStateRegistryIndex,XPos,YPos,Color){
	this.X = XPos;
	this.Y = YPos;
	this.width = 12; //Magic#
	this.height = 19; //Magic#
	this.GameStateRegistryIndex = gameStateRegistryIndex;
	this.color = Color;
	this.render = function(ctx){
		ctx.fillStyle = this.color;
		drawEllipse(ctx,this.X,this.Y,this.width,this.height);
	}
	this.clone = function(){
		var clonedPortal = new Portal();
		clonedPortal.X = this.X;
		clonedPortal.Y = this.Y;
		clonedPortal.width = this.width;
		clonedPortal.height = this.height;
		clonedPortal.GameStateRegistryIndex = this.GameStateRegistryIndex;
		clonedPortal.color = this.color;
		return clonedPortal;
	}
}

function ProjectileManager(numProjectiles,minX,minY,maxX,maxY,minXVel,minYVel,maxXVel,maxYVel){
	this.projectiles = new Array();
	this.randomize = function(numProjectiles,minX,minY,maxX,maxY,minXVel,minYVel,maxXVel,maxYVel){
		for(var i = 0; i < numProjectiles;i++)
			this.projectiles[i] = new TestProjectile(randInt(minX,maxX),randInt(minY,maxY),randInt(minXVel,maxXVel),randInt(minYVel,maxYVel));
	}
	
	if(numProjectiles!=undefined&&minX!=undefined&&minY!=undefined&&maxX!=undefined&&maxY!=undefined&&minXVel!=undefined&&minYVel!=undefined&&maxXVel!=undefined&&maxYVel!=undefined)
		this.randomize(numProjectiles,minX,minY,maxX,maxY,minXVel,minYVel,maxXVel,maxYVel);
	else
		this.randomize(10,0,0,100,100,-1,-1,1,1); //Magic#
	
	this.update = function(t,dt,collisionObjects){
		for(var i = 0; i < this.projectiles.length;i++)
			this.projectiles[i].update(t,dt,collisionObjects);
	}
	this.render = function(context){
		for(var i = 0; i < this.projectiles.length;i++)
			this.projectiles[i].render(context);
	}
	this.clone = function(){
		var clonedProjectileManager = new ProjectileManager();
		clonedProjectileManager.projectiles = new Array();
		for(var i = 0; i < this.projectiles.length; i++)
			if(this.projectiles[i]!=null)
				clonedProjectileManager.projectiles[i] = this.projectiles[i].clone();
		return clonedProjectileManager;
	}
}

//This object represents a simple deterministic time-stepped test projectile. It contains it's position, size,
//velocity, boundry information (prevents projectiles from leaving a specific area) and color. It also contains
// a function for updating and a function for drawing.
function TestProjectile(startX, startY, xVel, yVel){
	this.X = startX;
	this.Y = startY;
	this.width = 3; //Magic#
	this.height = 3; //Magic#
	this.XVel = xVel;
	this.YVel = yVel;
	this.MinX = 0;
	this.MinY = 0;
	this.MaxX = canvas.width;
	this.MaxY = canvas.height;
	this.color = "#FF0000"; //Magic#
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
	this.render = function(ctx){
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
		return clonedTestProjectile;
	}
}

function GameStateRegistry(){
	this.gameStates = new Array();
	this.addGameState = function(gameState){
		var index = this.gameStates.length;
		this.gameStates[index] = gameState;
		return index;
	}
	this.getGameState = function(index){
		return this.gameStates[index];
	}
	this.removeGameState = function(index){
		return this.gameStates.splice(index,1)[0];
	}
	this.removeStatesLaterThan = function(time){
		for(var i = this.gameStates.length-1;i>=0;i--)
			if(this.gameStates[i].t > time)
				this.gameStates.splice(i,1);
	}
	this.getGameStateCount = function(){
		return this.gameStates.length;
	}
}