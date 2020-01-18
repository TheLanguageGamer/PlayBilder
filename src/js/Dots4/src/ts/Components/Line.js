"use strict";
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
class Line {
    constructor() {
        this.points = new Array();
        this.lineDash = [];
        this.lineDashOffset = 0;
        this.lineDashSpeed = 0;
        this.color = Constants.Colors.Black;
        this.layout = new Layout(0, 0, 0, 0, 0, 0, 0, 0);
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = this.color;
        ctx.setLineDash(this.lineDash);
        this.lineDashOffset += this.lineDashSpeed;
        ctx.lineDashOffset = this.lineDashOffset;
        for (let i = 0; i < this.points.length; ++i) {
            let point = this.points[i];
            if (point.isMove) {
                ctx.moveTo(this.layout.computed.position.x + point.x, this.layout.computed.position.y + point.y);
            }
            else {
                //ctx.beginPath();
                //ctx.moveTo(this.points[i-1].x, this.points[i-1].y);
                //ctx.strokeStyle = rgbToHex(256 - i*24, i*24, i*24);
                ctx.lineTo(this.layout.computed.position.x + point.x, this.layout.computed.position.y + point.y);
                //ctx.stroke();
            }
        }
        ctx.stroke();
    }
}
//# sourceMappingURL=Line.js.map