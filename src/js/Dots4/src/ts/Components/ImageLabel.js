"use strict";
class ImageLabel {
    constructor(layout, path) {
        this.layout = layout;
        this.path = path;
    }
    render(ctx, cp) {
        ctx.drawImage(cp.getImage(this.path), this.layout.computed.position.x, this.layout.computed.position.y, this.layout.computed.size.width, this.layout.computed.size.height);
    }
}
//# sourceMappingURL=ImageLabel.js.map