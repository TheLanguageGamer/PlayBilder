class TextBox {
	
	layout : Layout;
	children? : Component[];
	private text : string = "";
	private lines : string[] = [];
	private font : string = "20px monospace";
	private fontSize : number = 12;
	fileStyle : string = Constants.Colors.LightGrey;

	constructor(layout : Layout, text? : string) {
		if (text) {
			this.setText(text);
		}
		this.setFontSize(this.fontSize);
		this.layout = layout;
	}

	setFontSize(fontSize : number) {
		this.fontSize = fontSize;
		this.font = fontSize.toString() + "px monospace";
	}

	setText(text : string) {
		let tokens = text.split(" ");
		this.lines = tokens;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		for (let i = 0; i < this.lines.length; ++i) {
			let line = this.lines[i];
			ctx.beginPath();
			ctx.lineWidth = 2.0;
			ctx.font = this.font;
			ctx.fillStyle = this.fileStyle;
			ctx.fillText(
				line,
				this.layout.computed.position.x,
				this.layout.computed.position.y - this.fontSize*0.6 + i*this.fontSize*1.2
			);
		}
	}
}