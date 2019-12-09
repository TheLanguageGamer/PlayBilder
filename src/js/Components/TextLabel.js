"use strict";
class TextLabel {
    constructor(layout, text) {
        this.text = "";
        this.font = "20px monospace";
        if (text) {
            this.text = text;
        }
        this.layout = layout;
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.font = this.font;
        ctx.fillStyle = "#ACACAC";
        ctx.fillText(this.text, this.layout.computed.position.x, this.layout.computed.position.y);
    }
}
//# sourceMappingURL=TextLabel.js.map