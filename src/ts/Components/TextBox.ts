class TextBox {
	
	layout : Layout;
	children? : Component[];
	private text : string = "";
	private dirty : boolean = true;
	private lines : string[] = [];
	private font : string = "20px monospace";
	private fontSize : number = 12;
	fillStyle : string = Constants.Colors.LightGrey;

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
		this.dirty = true;
	}

	setText(text : string) {
		if (text != this.text) {
			this.text = text;
			this.dirty = true;
		}
	}

	calculateLines() {
		let availableWidth = this.layout.computed.size.width;
		let characterWidth = this.fontSize*0.6;
		let maxCharactersPerLine = Math.floor(availableWidth/characterWidth);
		let lineStart = 0;
		let lastSpacePosition = -1;

		for (let i = 0; i < this.text.length; ++i) {
			if (this.text[i] == " ") {
				lastSpacePosition = i;
			}
			if (i-lineStart >= maxCharactersPerLine) {
				let lineEnd = lastSpacePosition >= lineStart ? lastSpacePosition : i;
				let line = this.text.substring(lineStart, lineEnd);
				this.lines.push(line);
				lineStart = lineEnd+1;
			}
		}
		if (lineStart < this.text.length) {
			let line = this.text.substring(lineStart, this.text.length);
			this.lines.push(line);
		}
		this.dirty = false;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (!this.layout.visible) {
			return;
		}
		if (this.dirty) {
			this.calculateLines();
		}
		for (let i = 0; i < this.lines.length; ++i) {
			let line = this.lines[i];
			ctx.beginPath();
			ctx.lineWidth = 2.0;
			ctx.font = this.font;
			ctx.fillStyle = this.fillStyle;
			ctx.fillText(
				line,
				this.layout.computed.position.x,
				this.layout.computed.position.y + this.fontSize*0.75 + i*this.fontSize*1.2
			);
		}
	}
}