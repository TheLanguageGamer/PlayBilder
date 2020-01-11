interface Size {
	width : number
	height : number
}

interface Pos {
	x : number
	y : number
}

interface Box {
	size : Size
	position : Pos
}

enum RelativeLayout {
	None = 0,
	StackVertical,
	StackHorizontal,
}

function boxContainsPoint(box : Box, x : number, y : number) {
	return x >= box.position.x
		&& y >= box.position.y
		&& x < box.position.x + box.size.width
		&& y < box.position.y + box.size.height;
}

function calculateDistance(pos1 : Pos, pos2 : Pos) {
	return Math.sqrt(
		(pos1.x - pos2.x)*(pos1.x - pos2.x) + (pos1.y - pos2.y)*(pos1.y - pos2.y)
	);
}

function averagePosition(pos1 : Pos, pos2 : Pos) {
	return {
		x : (pos1.x + pos2.x)/2,
		y : (pos1.y + pos2.y)/2,
	};
}

function dotProduct(pos1 : Pos, pos2 : Pos) {
	return pos1.x*pos2.x + pos1.y*pos2.y;
}

function minimumDistanceToLineSegment(p : Pos, l1 : Pos, l2 : Pos) {
	let length = calculateDistance(l1, l2);
	if (length < 0.1) {
		return calculateDistance(p, l1);
	}
	let dp = dotProduct(
		{
			x : p.x - l1.x,
			y : p.y - l1.y,
		},
		{
			x : l2.x - l1.x,
			y : l2.y - l1.y,
		}
	);
	let t = dp / (length*length);
	t = Math.max(0, Math.min(1, t));
	let projection = {
		x : l1.x + t * (l2.x - l1.x),
		y : l1.y + t * (l2.y - l1.y),
	};
	return calculateDistance(p, projection);
}

class Layout {
	relativeLayout : RelativeLayout = RelativeLayout.None;
	relative : Box = {size : {width: 0, height: 0}, position : {x: 0, y: 0}};
	offset : Box = {size : {width: 0, height: 0}, position : {x: 0, y: 0}};
	anchor : Pos = {x : 0, y : 0};
	aspect : number = 1.0;
	fixedAspect : boolean = false;
	visible : boolean = true;
	computed : Box = {size : {width: 0, height: 0}, position : {x: 0, y: 0}};

	doLayout(parent : Box) {
		this.doLayoutInternal(
			parent,
			parent.position.x,
			parent.position.y
		);
	}

	private doLayoutInternal(parent : Box, xInset : number, yInset : number) {
		//parent size: 734, 715 position: 0, 0
		let relative = this.relative;
		//size: 0.71, 0.91 position: 0.5, 0.5
		let offset = this.offset;
		//size: -40, -40 position: 0, 10
		let newWidth = relative.size.width*parent.size.width + offset.size.width;
		//newWidth: 484
		let newHeight = relative.size.height*parent.size.height + offset.size.height;
		//newHeight: 610

		this.computed.size = {width : newWidth, height : newHeight};

		if (this.fixedAspect) {
			//aspect = width/height;
			let aspectWidth = newHeight*this.aspect;
			let aspectHeight = newWidth/this.aspect;
			if (aspectWidth < newWidth) {
				this.computed.size = {width : aspectWidth, height : newHeight};
				//aspectWidth/newHeight = newHeight*0.5/newHeight
			} else {
				this.computed.size = {width : newWidth, height : aspectHeight};
			}
		} else {
			this.aspect = newWidth / newHeight;
		}
		//computed size: 479, 610
		let newX = xInset //0
					+ parent.size.width*relative.position.x //734*0.5
					- this.anchor.x*this.computed.size.width //0.5*479
					+ offset.position.x; //0
		//newX: 127
		let newY = yInset
					+ parent.size.height*relative.position.y
					- this.anchor.y*this.computed.size.height
					+ offset.position.y;

		this.computed.position = {x : newX, y : newY};
	}
    private doLayoutRecursiveInternal(
    	parent : Box,
    	xInset : number,
    	yInset : number,
    	components? : Component[]) {

    	this.doLayoutInternal(parent, xInset, yInset);
    	if (components) {
    		var childXInset = this.computed.position.x;
    		var childYInset = this.computed.position.y;
	    	for (var component of components) {
	    		component.layout.doLayoutRecursiveInternal(
	    			this.computed,
	    			childXInset,
	    			childYInset,
	    			component.children
	    		);
	    		if (this.relativeLayout == RelativeLayout.StackVertical) {
	    			childYInset = component.layout.bottom();
	    		} else if (this.relativeLayout == RelativeLayout.StackHorizontal) {
	    			childXInset = component.layout.right();
	    		}
	    	}
	    }
    }
    doLayoutRecursive(parent : Box, components? : Component[]) {
    	//assert: not RelativeLayout.StackVertical, RelativeLayout.StackHorizontal
    	this.doLayoutRecursiveInternal(
    		parent,
    		parent.position.x,
    		parent.position.y,
    		components
    	);
    }
	containsPosition(x : number, y : number) {
		return x >= this.computed.position.x
			&& y >= this.computed.position.y
			&& x <= this.computed.position.x + this.computed.size.width
			&& y <= this.computed.position.y + this.computed.size.height;
	}
	right() {
		return this.computed.position.x + this.computed.size.width;
	}
	bottom() {
		return this.computed.position.y + this.computed.size.height;
	}
	setUpperLeft(x : number, y : number) {
		this.offset.position.x = x;
		this.offset.position.y = y;
	}
	setLowerRight(x : number, y : number) {
		this.offset.size.width = 1 + x - this.offset.position.x;
		this.offset.size.height = 1 + y - this.offset.position.y;
	}
	getUpperLeftX() {
		return this.computed.position.x;
	}
	getUpperLeftY() {
		return this.computed.position.y;
	}
	getLowerRightX() {
		return this.computed.position.x + this.computed.size.width;
	}
	getLowerRightY() {
		return this.computed.position.y + this.computed.size.height;
	}
	constructor(
		relX : number, relY : number,
		offX : number, offY : number,
		relWidth : number, relHeight : number,
		offWidth : number, offHeight : number) {
		this.relative = {
			size : {width: relWidth, height: relHeight},
			position : {x: relX, y: relY}
		};
		this.offset = {
			size : {width: offWidth, height: offHeight},
			position : {x: offX, y: offY}
		};
	}
}