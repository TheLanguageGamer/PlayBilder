function componentToHex(c : number) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r : number, g : number, b : number) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

interface Segment {
	x : number
	y : number
	isMove? : boolean
}

class Line {
	
	layout : Layout;
	children? : Component[];

	points : Segment[] = new Array();
	lineDash : number[] = [];
	lineDashOffset : number = 0;
	lineDashSpeed : number = 0;
	color : string = Constants.Colors.Black;

	constructor() {
		this.layout = new Layout(0, 0, 0, 0, 0, 0, 0, 0);
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		ctx.beginPath();
		ctx.lineWidth = 2.0;
		ctx.strokeStyle = this.color;
		ctx.setLineDash(this.lineDash);
		this.lineDashOffset += this.lineDashSpeed;
		ctx.lineDashOffset = this.lineDashOffset;
		for (let i = 0; i < this.points.length; ++i) {
			let point = this.points[i];
			if (point.isMove) {
				ctx.moveTo(
					this.layout.computed.position.x + point.x,
					this.layout.computed.position.y + point.y
				);
			} else {
				//ctx.beginPath();
				//ctx.moveTo(this.points[i-1].x, this.points[i-1].y);
				//ctx.strokeStyle = rgbToHex(256 - i*24, i*24, i*24);
				ctx.lineTo(
					this.layout.computed.position.x + point.x,
					this.layout.computed.position.y + point.y
				);
				//ctx.stroke();
			}
		}
		ctx.stroke();
	}
}