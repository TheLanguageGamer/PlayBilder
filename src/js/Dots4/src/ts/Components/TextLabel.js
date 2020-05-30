"use strict";
class TextLabel {
    constructor(layout, text) {
        this.text = "";
        this.font = "20px monospace";
        this.fontSize = 12;
        this.fillStyle = Constants.Colors.LightGrey;
        if (text) {
            this.text = text;
        }
        this.setFontSize(this.fontSize);
        this.layout = layout;
    }
    setFontSize(fontSize) {
        this.fontSize = fontSize;
        this.font = fontSize.toString() + "px monospace";
    }
    getFontSize() {
        return this.fontSize;
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.font = this.font;
        ctx.fillStyle = this.fillStyle;
        ctx.fillText(this.text, this.layout.computed.position.x, this.layout.computed.position.y + this.fontSize * 0.75);
    }
}
//# sourceMappingURL=TextLabel.js.map