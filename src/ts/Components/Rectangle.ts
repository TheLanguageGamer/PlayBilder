class Rectangle {
	
	layout : Layout;
	children? : Component[];

	strokeColor? : string = Constants.Colors.Black;
	fillColor? : string;
	lineWidth : number = 2;
	lineDash : number[] = [];
	lineDashOffset : number = 0;
	lineDashSpeed : number = 0;

	constructor(layout : Layout) {
		this.layout = layout;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		ctx.beginPath();
		ctx.setLineDash(this.lineDash);
		this.lineDashOffset += this.lineDashSpeed;
		ctx.lineDashOffset = this.lineDashOffset;
		ctx.lineWidth = this.lineWidth;
		if (this.strokeColor) {
			ctx.strokeStyle = this.strokeColor;
		}
		if (this.fillColor) {
			ctx.fillStyle = this.fillColor;
		}
		ctx.rect(
			this.layout.computed.position.x,
			this.layout.computed.position.y,
			this.layout.computed.size.width,
			this.layout.computed.size.height
		);
		if (this.strokeColor) {
			ctx.stroke();
		}
		if (this.fillColor) {
			ctx.fill();
		}
	}
}