//Set up events
window.onkeydown = OnKeyDownEvent; //When we press a key down, call the KeyDownEvent function (sets keyStates flags)
window.onkeyup = OnKeyUpEvent; //When we release a key, call the KeyUpEvent function (resets keyStates flags)
window.onresize = OnWindowResizeEvent; //When we resize the window, call the WindowResizeEvent function

//This function handles the key being pressed down. It modifies the keyStates array and watches for continuous
//time travel requests (this is performed via a "dead man's switch" which must be held to continue travelling
//back in time). It blocks the keyboard events from being passed along to the browser.
function OnKeyDownEvent(e){
	if(e.keyCode==192) //	`/~ Key
		sim.timeIsForward = false;
	keyStates[e.keyCode] = true;
	if(e.keyCode==17||e.keyCode==82) return true;
	return false;
}

//This function handles the key being released.
function OnKeyUpEvent(e){
	if(e.keyCode==192) //	`/~ Key
		sim.timeIsForward = true;
	keyStates[e.keyCode] = false;
	return false;
}

//Reinitialize the simulation if resized
function OnWindowResizeEvent(){
	Initialize();
}