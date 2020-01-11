interface TextInputController {
	onTextChanged?: (newText : string) => void;
}

class TextInput {
	
	layout : Layout;
	children? : Component[];
	controller : TextInputController;
	text : string = "";
	placeholderText : string = "";
	private font : string = "20px monospace";
	private fontSize : number = 12;
	private maxTextLength : number = -1;
	fillStyle : string = Constants.Colors.Black;
	placeholderFillStyle : string = Constants.Colors.LightGrey;
	isFocused : boolean = false;
	lastTimeStep : DOMHighResTimeStamp = 0;
	showCursor : boolean = false;
	cursorPosition : number = 0;

	constructor(
		layout : Layout,
		controller : TextInputController,
		text? : string) {

		this.controller = controller;
		if (text) {
			this.text = text;
		}
		this.setFontSize(this.fontSize);
		this.layout = layout;
	}

	focus(e : MouseEvent) {
		let x = e.offsetX - this.layout.computed.position.x;
		let y = e.offsetY - this.layout.computed.position.y;
		this.cursorPosition = Math.max(0, Math.min(
			this.text.length, Math.round(x/(this.fontSize*0.6))));
		console.log(x, this.fontSize*0.6, Math.round(x/(this.fontSize*0.6)));
		this.isFocused = true;
		this.resetCursorBlink();
	}

	onClick(e : MouseEvent) {
		this.focus(e);
		return InputResponse.Focused;
	}

	onMouseDown(e : MouseEvent) {
		this.focus(e);
		return true;
	}

	blur() {
		this.isFocused = false;
	}

	resetCursorBlink() {
		this.lastTimeStep = 0;
		this.showCursor = false;
	}

	onKeyDown(e : KeyboardEvent) {
		if (e.keyCode == 16
			|| e.keyCode == 17
			|| e.keyCode == 18
			|| e.keyCode == 20
			|| (e.keyCode >= 112 && e.keyCode <= 123)
			|| e.keyCode == 91
			|| e.keyCode == 13
			|| e.keyCode == 27
			|| e.keyCode == 38
			|| e.keyCode == 40) {
			//ignore
		} else if (e.keyCode == 37) {
			this.cursorPosition = Math.max(this.cursorPosition-1, 0);
			this.resetCursorBlink();
		} else if (e.keyCode == 39) {
			this.cursorPosition = Math.min(this.cursorPosition+1, this.text.length);
			this.resetCursorBlink();
		} else if (e.keyCode == 46 || e.keyCode == 8) {
			if (this.cursorPosition > 0) {
				this.text = this.text.substring(0, this.cursorPosition-1)
					+ this.text.substring(this.cursorPosition, this.text.length);
				this.cursorPosition -= 1;
				this.resetCursorBlink();
			}
		} else {
			this.text = this.text.substring(0, this.cursorPosition)
				+ e.key
				+ this.text.substring(this.cursorPosition, this.text.length);
			this.cursorPosition += e.key.length;
			this.resetCursorBlink();
		}
		console.log(e.key, "new text:", this.text);
		this.clipText();
	}

	clipText() {
		if (this.maxTextLength > -1
			&& this.text.length > this.maxTextLength) {
			this.text = this.text.substring(0, this.maxTextLength);
			this.cursorPosition = Math.min(this.text.length, this.cursorPosition);
		}
	}

	setFontSize(fontSize : number) {
		this.fontSize = fontSize;
		this.font = fontSize.toString() + "px monospace";
	}

	setMaxTextLength(maxTextLength : number) {
		this.maxTextLength = Math.floor(maxTextLength);
		this.clipText();
	}

	render(
		ctx : CanvasRenderingContext2D,
		cp : ContentProvider,
		timeMS : DOMHighResTimeStamp) {

		if (!this.layout.visible) {
			return;
		}

		let showPlaceholder = this.text.length == 0
							&& this.placeholderText.length > 0
							&& !this.isFocused;

		ctx.beginPath();
		ctx.lineWidth = 2.0;
		ctx.font = this.font;
		ctx.fillStyle = showPlaceholder ? this.placeholderFillStyle : this.fillStyle;
		if (showPlaceholder) {
			ctx.fillText(
				this.placeholderText,
				this.layout.computed.position.x,
				this.layout.computed.position.y + this.fontSize*0.75
			);
		} else {
			ctx.fillText(
				this.text,
				this.layout.computed.position.x,
				this.layout.computed.position.y + this.fontSize*0.75
			);
		}
		if (this.isFocused) {
			let delta : DOMHighResTimeStamp = timeMS - this.lastTimeStep;
			if (delta > Constants.CursorInterval) {
				this.lastTimeStep = timeMS;
				this.showCursor = !this.showCursor;

			}
			if (this.showCursor) {
				ctx.moveTo(
					this.layout.computed.position.x+this.fontSize*0.6*this.cursorPosition,
					this.layout.computed.position.y
				);
				ctx.lineTo(
					this.layout.computed.position.x+this.fontSize*0.6*this.cursorPosition,
					this.layout.computed.position.y+this.fontSize
				);
				ctx.stroke();
			}
		}
	}
}