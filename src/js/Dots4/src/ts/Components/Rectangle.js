"use strict";
class Rectangle {
    constructor(layout) {
        this.strokeColor = Constants.Colors.Black;
        this.lineWidth = 2;
        this.lineDash = [];
        this.lineDashOffset = 0;
        this.lineDashSpeed = 0;
        this.layout = layout;
    }
    render(ctx, cp) {
        ctx.beginPath();
        ctx.setLineDash(this.lineDash);
        this.lineDashOffset += this.lineDashSpeed;
        ctx.lineDashOffset = this.lineDashOffset;
        ctx.lineWidth = this.lineWidth;
        if (this.strokeColor) {
            ctx.strokeStyle = this.strokeColor;
        }
        if (this.fillColor) {
            ctx.fillStyle = this.fillColor;
        }
        ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.layout.computed.size.height);
        if (this.strokeColor) {
            ctx.stroke();
        }
        if (this.fillColor) {
            ctx.fill();
        }
    }
}
//# sourceMappingURL=Rectangle.js.map