class Rectangle {
	
	layout : Layout;
	children? : Component[];


	constructor(layout : Layout) {
		this.layout = layout;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		ctx.beginPath();
		ctx.lineWidth = 2.0;
		ctx.strokeStyle = "#0C0C0C";
		ctx.rect(
			this.layout.computed.position.x,
			this.layout.computed.position.y,
			this.layout.computed.size.width,
			this.layout.computed.size.height
		);
		ctx.stroke();
	}
}