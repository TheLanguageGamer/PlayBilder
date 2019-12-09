class TextLabel {
	
	layout : Layout;
	children? : Component[];
	text : string = "";
	font : string = "20px monospace";

	constructor(layout : Layout, text? : string) {
		if (text) {
			this.text = text;
		}
		this.layout = layout;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		ctx.beginPath();
		ctx.lineWidth = 2.0;
		ctx.font = this.font;
		ctx.fillStyle = "#ACACAC";
		ctx.fillText(
			this.text,
			this.layout.computed.position.x,
			this.layout.computed.position.y
		);
	}
}