"use strict";
class Arrow {
    constructor() {
        this.from = { x: 0, y: 0 };
        this.to = { x: 0, y: 0 };
        this.lineWidth = 4;
        this.headMargin = 8;
        this.layout = new Layout(0, 0, 0, 0, 0, 0, 0, 0);
    }
    render(ctx, cp) {
        var headlen = Math.floor(this.lineWidth / 2);
        var angle = Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x);
        var to = {
            x: this.to.x - this.headMargin * Math.cos(angle),
            y: this.to.y - this.headMargin * Math.sin(angle),
        };
        ctx.strokeStyle = "#131313";
        ctx.lineWidth = this.lineWidth;
        ctx.fillStyle = "#131313";
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(this.from.x, this.from.y, this.lineWidth * 0.5, 0, 2 * Math.PI);
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 7), to.y - headlen * Math.sin(angle - Math.PI / 7));
        ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 7), to.y - headlen * Math.sin(angle + Math.PI / 7));
        ctx.lineTo(to.x, to.y);
        ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 7), to.y - headlen * Math.sin(angle - Math.PI / 7));
        ctx.stroke();
        ctx.fill();
    }
}
//# sourceMappingURL=Arrow.js.map