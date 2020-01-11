class TextLabel {
	
	layout : Layout;
	children? : Component[];
	text : string = "";
	private font : string = "20px monospace";
	private fontSize : number = 12;
	fillStyle : string = Constants.Colors.LightGrey;

	constructor(layout : Layout, text? : string) {
		if (text) {
			this.text = text;
		}
		this.setFontSize(this.fontSize);
		this.layout = layout;
	}

	setFontSize(fontSize : number) {
		this.fontSize = fontSize;
		this.font = fontSize.toString() + "px monospace";
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		ctx.beginPath();
		ctx.lineWidth = 2.0;
		ctx.font = this.font;
		ctx.fillStyle = this.fillStyle;
		ctx.fillText(
			this.text,
			this.layout.computed.position.x,
			this.layout.computed.position.y + this.fontSize*0.75
		);
	}
}