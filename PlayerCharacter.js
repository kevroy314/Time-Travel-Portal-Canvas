function PlayerCharacter(startX, startY, spriteImagePath, inPortalImagePath, outPortalImagePath){
	this.X = startX;
	this.Y = startY;
	this.XVel = 2;
	this.YVel = 2;
	this.image = new Image();
	this.image.src = spriteImagePath;
	this.inPortal = null;
	this.outPortal = null;
	this.inPortalImagePath = inPortalImagePath;
	this.outPortalImagePath = outPortalImagePath;
	this.immuneToPortal = 0; //0 if immune to no portals, 1 if immune to in portal, 2 if immune to out portal
	this.draw = function(ctx){
		if(this.inPortal!=null)
			this.inPortal.draw(ctx);
		if(this.outPortal!=null)
			this.outPortal.draw(ctx);
		ctx.drawImage(this.image,this.X,this.Y);
	}
	this.move = function(xOffset,yOffset){
		var newX = this.X+xOffset;
		var newY = this.Y+yOffset;
		var overlapInPortal = null;
		var overlapOutPortal = null;
		if(this.inPortal!=null){
			var overlapInPortalArea = this.areaOfOverlap(this.inPortal.X,this.inPortal.Y,
									  this.inPortal.X+this.inPortal.image.width,this.inPortal.Y+this.inPortal.image.height,
									  newX,newY,
									  newX+this.image.width,newY+this.image.height);
			var overlapInPortalBoolean = this.doRectanglesOverlap(this.inPortal.X,this.inPortal.Y,
									  this.inPortal.X+this.inPortal.image.width,this.inPortal.Y+this.inPortal.image.height,
									  newX,newY,
									  newX+this.image.width,newY+this.image.height);
			overlapInPortal = overlapInPortalArea>this.image.width*this.image.height/2&&overlapInPortalBoolean;
			if(overlapInPortal){
				if(this.immuneToPortal!=1&&this.outPortal!=null){
					this.X = this.outPortal.X;
					this.Y = this.outPortal.Y;
					this.immuneToPortal = 2;
					return true;
				}
			}
		}
		if(this.outPortal!=null){
			var overlapOutPortalArea = this.areaOfOverlap(this.outPortal.X,this.outPortal.Y,
									   this.outPortal.X+this.outPortal.image.width,this.outPortal.Y+this.outPortal.image.height,
									   newX,newY,
									   newX+this.image.width,newY+this.image.height);
			var overlapOutPortalBoolean = this.doRectanglesOverlap(this.outPortal.X,this.outPortal.Y,
									   this.outPortal.X+this.outPortal.image.width,this.outPortal.Y+this.outPortal.image.height,
									   newX,newY,
									   newX+this.image.width,newY+this.image.height);
			overlapOutPortal = overlapOutPortalArea>this.image.width*this.image.height/2&&overlapOutPortalBoolean;
			if(overlapOutPortal){
				if(this.immuneToPortal!=2&&this.inPortal!=null){
					this.X = this.inPortal.X;
					this.Y = this.inPortal.Y;
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
	this.createInPortal = function(startTime){
		this.inPortal = new InPortal(this.X,this.Y,startTime,this.inPortalImagePath);
		this.immuneToPortal = 1;
		this.outPortal = null;
		return true;
	}
	this.createOutPortal = function(){
		if(this.inPortal!=null&&!(this.doRectanglesOverlap(this.inPortal.X,this.inPortal.Y,
								  this.inPortal.X+this.inPortal.image.width,this.inPortal.Y+this.inPortal.image.height,
								  this.X,this.Y,
								  this.X+this.inPortal.image.width,this.Y+this.inPortal.image.height))){
			this.outPortal = new OutPortal(this.X,this.Y,this.inPortal,this.outPortalImagePath);
			this.immuneToPortal = 2;
			return true;
		}
		else
			return false;
	}
	this.doRectanglesOverlap = function(p1x1,p1y1,p1x2,p1y2,p2x1,p2y1,p2x2,p2y2){
		return (p1x1<p2x2&&p1x2>p2x1&&p1y1<p2y2&&p1y2>p2y1);
	}
	this.areaOfOverlap = function(p1x1,p1y1,p1x2,p1y2,p2x1,p2y1,p2x2,p2y2){
		return (Math.max(p1x1,p2x1)-Math.min(p1x2,p2x2))*(Math.max(p1y1,p2y1)-Math.min(p1y2,p2y2));
	}
}

function InPortal(xPos, yPos, startTime, spriteImagePath){
	this.X = xPos;
	this.Y = yPos;
	this.t = startTime;
	this.image = new Image();
	this.image.src = spriteImagePath;
	this.draw = function(ctx){
		ctx.drawImage(this.image,this.X,this.Y);
	}
}

function OutPortal(xPos, yPos, inPortalRef, spriteImagePath){
	this.X = xPos;
	this.Y = yPos;
	this.inPortal = inPortalRef;
	this.image = new Image();
	this.image.src = spriteImagePath;
	this.draw = function(ctx){
		ctx.drawImage(this.image,this.X,this.Y);
	}
}