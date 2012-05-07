window.onload = Initialize; //When we load the window, call the Initialize function

var startTime; //Time offset from start of application (everything absolute time variable references to this)
var timeTravelOffset; //The amount of time the player has time travelled via portal or continous
var timeTravelEventStartTime; //The start time of a continuous time travel event (reset to 0 by portal time travel)
var timeIsForward; //Boolean representing if time is going forward or reverse

var renderInterval; //Number of ticks we skip to keep a pace
var maxRenderSkips; //Number of frames we're allowed to skip rendering
	
var nextRenderTime; //Next render tick
var renderSkipsCount; //Number of times we update before rendering for given iteration
var totalRenderSkipsCount;
var currentTime; //Current simulation time
var updateCount;

var canvas; //The primary canvas element (the space where things are rendered)
var context; //The primary context element (for drawing)
var hasBeenDragged; //Boolean representing if the window has been dragged (prevents auto-centering on window resize when true)

var keyStates; //Boolean array representing the state of the keyboard

var pc; //PlayerCharacter object representing the player (forms circular chain with Portal and GameState objects
var testObjs; //Array of deterministic objects with time-stepped update function
var numTestObjs; //Number of object to be populated into the testObjs array on initialization

var inputStack; //The stack containing all user actions

//This function initializes all the game variables and starts the game loop.
function Initialize(){
	timeIsForward = true; //We go forward in time by default
	canvas = document.getElementById("mainCanvas")
	canvas.ondrag = CanvasDragEvent; //Drag event for the canvas
	context = canvas.getContext("2d");
	hasBeenDragged = false; //Canvas hasn't been dragged by default
	keyStates = new Array();
	
	//Canvas position is fixed and centered
	canvas.style.position = "fixed";
	canvas.style.top = (window.innerHeight-canvas.height)/2;
	canvas.style.left = (window.innerWidth-canvas.width)/2;

	inputStack = new Array();
	
	pc = new PlayerCharacter(canvas.width/2,canvas.height/2); //Player starts in the middle
	pc.X-=pc.width/2;
	pc.Y-=pc.height/2;
	
	testObjs = new Array();
	numTestObjs = 3000; //Number of test objects to be populated at the beginning
	for(var i = 0; i < numTestObjs; i++) //Random position in the canvas and random velocity between -5 and 5
		testObjs[i] = new TestProjectile(Math.round(Math.random()*canvas.width),Math.round(Math.random()*canvas.height),Math.round(Math.random()*10-5),Math.round(Math.random()*10-5));
	
	updateCount=0;
	startTime = (new Date).getTime(); //This is our reference time
	continuousTimeTravelStop = 0; //We can't travel before time 0
	timeTravelOffset = 0; //No time travel has happened yet
	renderInterval = 33; //1000ms/30 ticks per second
	maxRenderSkips = 5; //This number can be changed to allow more updates between renders (
	nextRenderTime = 0; //Represents when we're going to render again
	totalRenderSkipsCount = 0;
	
	InitiatlizeReportCanvas();
	
	GameLoop(); //Start the game!
	ReportCanvasLoop();
}

function Draw(){
	//Draw the background and border
	context.fillStyle = "#000000";
	context.fillRect(0,0,canvas.width,canvas.height);
	context.strokeStyle = "#FFFFFF";
	context.strokeRect(0,0,canvas.width,canvas.height);
	
	//Draw the test objects
	for(var i = 0; i < numTestObjs; i++)
		testObjs[i].draw(context);
	
	//Draw the player
	pc.draw(context);
	
	//Overlay some stats
	context.fillStyle = "#FFFFFF";
	context.fillText("Current Time: "+ currentTime,10,10);
}

//The Update function takes a time step and updates the positions of the objects as well as the player.
function Update(dt){
	if(timeIsForward) updateCount++;
	else updateCount--;
	HandleKeyEvents(); //First handle any user input
	for(var i = 0; i < numTestObjs; i++) //Update each test object
		testObjs[i].update(currentTime,dt,[pc]);
}

//Calculates the relative time given the amount we've time travelled total and the reference time
function getCurrentTime(){
	return (new Date).getTime()-startTime;
}
function getTimeTravelAdjustedTime(){
	return getCurrentTime() - timeTravelOffset;
}
//The time forward game loop function
function GameLoop(){
	renderSkipsCount = 0; //Reset the loop counter
	currentTime = getTimeTravelAdjustedTime(); //Set the current time to our relative time
	
	while(currentTime>nextRenderTime&&renderSkipsCount<maxRenderSkips){ //Loop until the next tick or the maximum number of frames
		Update(1); //Update the game state
		nextRenderTime+=renderInterval;
		renderSkipsCount++; //Iterate renderSkipsCount
	}
	totalRenderSkipsCount+=renderSkipsCount;
	currentTime = getTimeTravelAdjustedTime(); //Update the current time to our relative time
	
	Draw(); //Render the scene
	if(timeIsForward) //If we're going forward in time, repeat the GameLoop
		setTimeout(GameLoop,renderInterval); //30ms is approximately 33 fps
	else if(!timeIsForward) //If we're going backward in time
	{
		//Register the time of the time travel event
		timeTravelEventStartTime = getTimeTravelAdjustedTime();
		//Start the ReverseGameLoop
		setTimeout(ReverseGameLoop,renderInterval);
	}
}

//The time backwards game loop function, similar to forward but with a different current time calculation
function ReverseGameLoop(){
	currentTime = timeTravelEventStartTime-(getTimeTravelAdjustedTime()-timeTravelEventStartTime);
	if(updateCount>0){
		renderSkipsCount = 0; //Reset the loop counter
		currentTime = timeTravelEventStartTime-(getTimeTravelAdjustedTime()-timeTravelEventStartTime); //Set the current time
		while(currentTime<nextRenderTime&&renderSkipsCount<maxRenderSkips){
			Update(-1);
			while(inputStack.length>0&&inputStack[inputStack.length-1][1]>nextRenderTime){
				var eventToProcess = inputStack.pop();
				if(eventToProcess[0] == InputStackEventType.PlayerMovementEvent){
					pc.move(-eventToProcess[2],-eventToProcess[3]);
				}
				else if (eventToProcess[0] == InputStackEventType.PlayerActionEvent){
					jQuery.extend(true, pc, eventToProcess[2].pc);
				}
			}
			nextRenderTime-=renderInterval;
			renderSkipsCount++;
		}
		totalRenderSkipsCount-=renderSkipsCount;
	}
	else{ //If we've hit the stop time, copy the stop state and adjust the offset
		timeTravelOffset+=(-currentTime);
	}
	currentTime = timeTravelEventStartTime-(getTimeTravelAdjustedTime()-timeTravelEventStartTime);
	Draw();
	if(timeIsForward){
		timeTravelOffset += (timeTravelEventStartTime-currentTime)*2; //This is times two because when you're continuously time travelling backwards, time is still passing forwards
		nextRenderTime = currentTime+1;
		Update(-1);
		setTimeout(GameLoop,renderInterval);
	}
	else if(!timeIsForward){
		setTimeout(ReverseGameLoop,renderInterval);
	}
}