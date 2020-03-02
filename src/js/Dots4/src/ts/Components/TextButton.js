"use strict";
class TextButton {
    constructor(layout, controller, text) {
        this.text = "";
        this.font = "12px monospace";
        this.fontSize = 12;
        this.fillStyle = Constants.Colors.Blue.NCS;
        this.disabledFillStyle = Constants.Colors.Grey;
        this.disabled = false;
        if (text) {
            this.text = text;
        }
        this.setFontSize(this.fontSize);
        this.layout = layout;
        this.controller = controller;
    }
    disable() {
        this.disabled = true;
    }
    enable() {
        this.disabled = false;
    }
    onClick(e) {
        if (!this.disabled) {
            this.controller.onClick(e);
            return InputResponse.Sunk;
        }
        return InputResponse.Ignored;
    }
    setFontSize(fontSize) {
        this.fontSize = fontSize;
        this.font = fontSize.toString() + "px monospace";
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.font = this.font;
        ctx.fillStyle = this.disabled ? this.disabledFillStyle : this.fillStyle;
        ctx.fillText(this.text, this.layout.computed.position.x, this.layout.computed.position.y + this.fontSize * 0.75);
    }
}
//# sourceMappingURL=TextButton.js.map