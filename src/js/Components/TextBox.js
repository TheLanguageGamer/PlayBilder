"use strict";
class TextBox {
    constructor(layout, text) {
        this.text = "";
        this.lines = [];
        this.font = "20px monospace";
        this.fontSize = 12;
        this.fileStyle = Constants.Colors.LightGrey;
        if (text) {
            this.setText(text);
        }
        this.setFontSize(this.fontSize);
        this.layout = layout;
    }
    setFontSize(fontSize) {
        this.fontSize = fontSize;
        this.font = fontSize.toString() + "px monospace";
    }
    setText(text) {
        let tokens = text.split(" ");
        this.lines = tokens;
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        for (let i = 0; i < this.lines.length; ++i) {
            let line = this.lines[i];
            ctx.beginPath();
            ctx.lineWidth = 2.0;
            ctx.font = this.font;
            ctx.fillStyle = this.fileStyle;
            ctx.fillText(line, this.layout.computed.position.x, this.layout.computed.position.y - this.fontSize * 0.6 + i * this.fontSize * 1.2);
        }
    }
}
//# sourceMappingURL=TextBox.js.map