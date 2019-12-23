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

class Layout {
	relative : Box = {size : {width: 0, height: 0}, position : {x: 0, y: 0}};
	offset : Box = {size : {width: 0, height: 0}, position : {x: 0, y: 0}};
	anchor : Pos = {x : 0, y : 0};
	aspect : number = 1.0;
	fixedAspect : boolean = false;
	visible : boolean = true;
	computed : Box = {size : {width: 0, height: 0}, position : {x: 0, y: 0}};
	doLayout(parent : Box) {
		let relative = this.relative;
		let offset = this.offset;
		let newWidth = relative.size.width*parent.size.width + offset.size.width;
		let newHeight = relative.size.height*parent.size.height + offset.size.height;

		this.computed.size = {width : newWidth, height : newHeight};

		if (this.fixedAspect) {
			let aspectWidth = newHeight*this.aspect;
			let aspectHeight = newWidth/this.aspect;
			if (aspectWidth < newWidth) {
				this.computed.size = {width : aspectWidth, height : newHeight};
			} else {
				this.computed.size = {width : newWidth, height : aspectHeight};
			}
		} else {
			this.aspect = newWidth / newHeight;
		}

		let newX = parent.position.x
					+ parent.size.width*relative.position.x
					- this.anchor.x*this.computed.size.width
					+ offset.position.x;
		let newY = parent.position.y
					+ parent.size.height*relative.position.y
					- this.anchor.y*this.computed.size.height
					+ offset.position.y;

		this.computed.position = {x : newX, y : newY};
	}
    doLayoutRecursive(parent : Box, components? : Component[]) {
    	this.doLayout(parent);
    	if (components) {
	    	for (let component of components) {
	    		component.layout.doLayoutRecursive(this.computed, component.children);
	    	}
	    }
    }
	containsPosition(x : number, y : number) {
		return x >= this.computed.position.x
			&& y >= this.computed.position.y
			&& x <= this.computed.position.x + this.computed.size.width
			&& y <= this.computed.position.y + this.computed.size.height;
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