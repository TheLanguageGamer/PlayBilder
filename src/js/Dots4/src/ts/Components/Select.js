"use strict";
class Select {
    constructor(layout, options, controller) {
        this.selectedIndex = 0;
        this.highlightColor = Constants.Colors.VeryLightGrey;
        this.backgroundColor = Constants.Colors.White;
        this.borderColor = Constants.Colors.Black;
        this.borderWidth = 2;
        this.font = "14px monospace";
        this.fontSize = 14;
        this.padding = 8;
        this.expanded = false;
        this.labelHeight = 5;
        this.layout = layout;
        this.options = options;
        this.controller = controller;
        console.assert(this.options.length > 0);
    }
    didLayout() {
        this.labelHeight = this.layout.computed.size.height;
        if (this.expanded) {
            this.layout.computed.size.height = this.labelHeight * (this.options.length + 1);
        }
    }
    setFontSize(fontSize) {
        this.fontSize = fontSize;
        this.font = fontSize.toString() + "px monospace";
    }
    drawTriangle(ctx, isUp) {
        //draw triangle
        let triangleWidth = 16;
        let heightOffset = isUp
            ? this.labelHeight / 2 + triangleWidth / 4
            : this.labelHeight / 2 - triangleWidth / 4;
        //	move to upper right
        ctx.moveTo(this.layout.computed.position.x
            + this.layout.computed.size.width
            - triangleWidth
            - this.padding, this.layout.computed.position.y
            + heightOffset);
        //	horizontal line
        ctx.lineTo(this.layout.computed.position.x
            + this.layout.computed.size.width
            //- triangleWidth
            - this.padding, this.layout.computed.position.y
            + heightOffset);
        //	bottom corner
        ctx.lineTo(this.layout.computed.position.x
            + this.layout.computed.size.width
            - triangleWidth / 2
            - this.padding, this.layout.computed.position.y
            + heightOffset
            + (isUp ? -triangleWidth / 2 : triangleWidth / 2));
        //	back to start
        ctx.lineTo(this.layout.computed.position.x
            + this.layout.computed.size.width
            - triangleWidth
            - this.padding - 1, this.layout.computed.position.y
            + heightOffset);
    }
    render(ctx, cp) {
        if (!this.layout.visible) {
            return;
        }
        let labelCount = this.expanded ? this.options.length + 1 : 1;
        if (this.expanded) {
            ctx.beginPath();
            ctx.fillStyle = this.backgroundColor;
            ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.labelHeight * labelCount);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = this.highlightColor;
            ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y
                + this.labelHeight * (this.selectedIndex + 1), this.layout.computed.size.width, this.labelHeight);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.font = this.font;
        ctx.setLineDash([]);
        ctx.lineWidth = this.borderWidth;
        ctx.strokeStyle = this.borderColor;
        ctx.fillStyle = Constants.Colors.Black;
        ctx.rect(this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.labelHeight * labelCount);
        for (let i = 0; i < labelCount; ++i) {
            if (i > 0) {
                ctx.moveTo(this.layout.computed.position.x, this.layout.computed.position.y + this.labelHeight * i);
                ctx.lineTo(this.layout.computed.position.x + this.layout.computed.size.width, this.layout.computed.position.y + this.labelHeight * i);
            }
            let index = i == 0 ? this.selectedIndex : i - 1;
            ctx.fillText(this.options[index].label, this.layout.computed.position.x + this.padding, this.layout.computed.position.y + this.padding
                + this.labelHeight * i
                + this.fontSize * 0.75);
        }
        this.drawTriangle(ctx, this.expanded);
        ctx.stroke();
    }
    toggleExpansion() {
        this.expanded = !this.expanded;
        if (this.expanded) {
            this.layout.computed.size.height = this.labelHeight * (this.options.length + 1);
        }
        else {
            this.layout.computed.size.height = this.labelHeight;
        }
    }
    onMouseDown(e) {
        return true;
    }
    onClick(e) {
        console.log("click Select", e.offsetY);
        if (e.offsetY <= this.layout.computed.position.y + this.labelHeight) {
            this.toggleExpansion();
        }
        else {
            let offset = e.offsetY - this.layout.computed.position.y - this.labelHeight;
            this.selectedIndex = Math.floor(offset / this.labelHeight);
            this.controller.onSelectionChanged(this.selectedIndex, this.options[this.selectedIndex]);
            this.toggleExpansion();
        }
        return InputResponse.Focused;
    }
    blur() {
        if (this.expanded) {
            this.toggleExpansion();
        }
    }
}
//# sourceMappingURL=Select.js.map