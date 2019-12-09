"use strict";
class Rectangle {
    constructor(layout) {
        this.layout = layout;
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = "#0C0C0C";
        ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.layout.computed.size.height);
        ctx.stroke();
    }
}
//# sourceMappingURL=Rectangle.js.map