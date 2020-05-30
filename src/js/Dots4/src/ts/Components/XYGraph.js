"use strict";
class XYGraph {
    constructor(layout, f) {
        this.xAxisRange = { start: -5, end: 5 };
        this.yAxisRange = { start: -5, end: 5 };
        this.axisLineWidth = 2;
        this.axisHeadMargin = 5;
        this.color = Constants.Colors.Black;
        this.layout = layout;
        this.f = f;
    }
    renderArrow(ctx, cp, _from, _to) {
        var headlen = Math.floor(this.axisLineWidth / 2);
        let computedFromX = this.layout.computed.position.x + _from.x;
        let computedFromY = this.layout.computed.position.y + _from.y;
        let computedToX = this.layout.computed.position.x + _to.x;
        let computedToY = this.layout.computed.position.y + _to.y;
        var angle = Math.atan2(computedToY - computedFromY, computedToX - computedFromX);
        var oAngle = angle + Math.PI;
        var to = {
            x: computedToX - this.axisHeadMargin * Math.cos(angle),
            y: computedToY - this.axisHeadMargin * Math.sin(angle),
        };
        var from = {
            x: computedFromX - this.axisHeadMargin * Math.cos(oAngle),
            y: computedFromY - this.axisHeadMargin * Math.sin(oAngle),
        };
        ctx.strokeStyle = Constants.Colors.DarkGrey;
        ctx.lineWidth = this.axisLineWidth;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(from.x - headlen * Math.cos(oAngle - Math.PI / 7), from.y - headlen * Math.sin(oAngle - Math.PI / 7));
        ctx.lineTo(from.x - headlen * Math.cos(oAngle + Math.PI / 7), from.y - headlen * Math.sin(oAngle + Math.PI / 7));
        ctx.lineTo(from.x, from.y);
        ctx.lineTo(from.x - headlen * Math.cos(oAngle - Math.PI / 7), from.y - headlen * Math.sin(oAngle - Math.PI / 7));
        ctx.moveTo(from.x, from.y);
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
    render(ctx, cp) {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = Constants.Colors.VeryVeryLightGrey;
        ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.layout.computed.size.height);
        ctx.clip();
        ctx.fill();
        let yAxisZero = this.layout.computed.size.height
            * this.yAxisRange.end
            / (this.yAxisRange.end - this.yAxisRange.start);
        let xAxisZero = this.layout.computed.size.width
            * Math.abs(this.xAxisRange.start)
            / (this.xAxisRange.end - this.xAxisRange.start);
        ctx.beginPath();
        ctx.strokeStyle = Constants.Colors.Grey;
        ctx.lineWidth = 1;
        let xTick = Math.round(this.xAxisRange.start + 1);
        while (xTick <= this.xAxisRange.end - 1) {
            let i = 0.5 + Math.round(this.layout.computed.position.x
                + this.layout.computed.size.width
                    * (xTick - this.xAxisRange.start)
                    / (this.xAxisRange.end - this.xAxisRange.start));
            ctx.moveTo(i, yAxisZero - 3 + this.layout.computed.position.y);
            ctx.lineTo(i, yAxisZero + 3 + this.layout.computed.position.y);
            xTick += 1;
        }
        let yTick = Math.round(this.yAxisRange.start + 1);
        while (yTick <= this.yAxisRange.end - 1) {
            let j = 0.5 + Math.round(this.layout.computed.position.y
                + this.layout.computed.size.height
                    * (yTick - this.yAxisRange.start)
                    / (this.yAxisRange.end - this.yAxisRange.start));
            ctx.moveTo(xAxisZero - 3 + this.layout.computed.position.x, j);
            ctx.lineTo(xAxisZero + 3 + this.layout.computed.position.x, j);
            yTick += 1;
        }
        ctx.stroke();
        this.renderArrow(ctx, cp, {
            x: 0,
            y: yAxisZero,
        }, {
            x: this.layout.computed.size.width,
            y: yAxisZero,
        });
        this.renderArrow(ctx, cp, {
            x: xAxisZero,
            y: 0,
        }, {
            x: xAxisZero,
            y: this.layout.computed.size.height,
        });
        let f = this.f;
        ctx.strokeStyle = Constants.Colors.Black;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let lastJ = 0;
        for (let i = this.layout.computed.position.x; i < this.layout.computed.position.x + this.layout.computed.size.width; ++i) {
            let x = this.xAxisRange.start
                + ((i - this.layout.computed.position.x) / this.layout.computed.size.width)
                    * (this.xAxisRange.end - this.xAxisRange.start);
            let y = f(x);
            let j = this.layout.computed.position.y
                + this.layout.computed.size.height
                - (y - this.yAxisRange.start)
                    * this.layout.computed.size.height
                    / (this.yAxisRange.end - this.xAxisRange.start);
            if (j == NaN) {
            }
            else if (i == 0
                || lastJ == NaN
                || ((lastJ < this.layout.computed.position.y
                    || lastJ > this.layout.computed.position.y + this.layout.computed.size.height)
                    && (j < this.layout.computed.position.y
                        || j > this.layout.computed.position.y + this.layout.computed.size.height))) {
                ctx.moveTo(i, j);
            }
            else {
                ctx.lineTo(i, j);
            }
            lastJ = j;
        }
        ctx.stroke();
        ctx.restore();
    }
}
//# sourceMappingURL=XYGraph.js.map