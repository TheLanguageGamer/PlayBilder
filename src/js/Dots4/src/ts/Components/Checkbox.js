"use strict";
class Checkbox {
    constructor(layout, controller) {
        this.value = false;
        this.layout = layout;
        this.onClick = function (e) {
            this.value = !this.value;
            controller.onValueChanged(this.value);
            return InputResponse.Sunk;
        };
    }
    render(ctx, cp) {
        let thickness = 1;
        let radius = 3;
        let x = this.layout.computed.position.x;
        let y = this.layout.computed.position.y;
        let width = this.layout.computed.size.width;
        let height = this.layout.computed.size.height;
        ctx.beginPath();
        ctx.lineWidth = thickness;
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = Constants.Colors.White;
        ctx.fill();
        ctx.strokeStyle = Constants.Colors.Black;
        ctx.stroke();
        if (this.value) {
            let image = cp.getImage(ImagePaths.Icons["Checkmark"]);
            ctx.drawImage(image, x, y, width, height);
        }
    }
}
//# sourceMappingURL=Checkbox.js.map