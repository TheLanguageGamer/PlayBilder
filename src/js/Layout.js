"use strict";
function calculateDistance(pos1, pos2) {
    return Math.sqrt((pos1.x - pos2.x) * (pos1.x - pos2.x) + (pos1.y - pos2.y) * (pos1.y - pos2.y));
}
function averagePosition(pos1, pos2) {
    return {
        x: (pos1.x + pos2.x) / 2,
        y: (pos1.y + pos2.y) / 2,
    };
}
class Layout {
    constructor(relX, relY, offX, offY, relWidth, relHeight, offWidth, offHeight) {
        this.relative = { size: { width: 0, height: 0 }, position: { x: 0, y: 0 } };
        this.offset = { size: { width: 0, height: 0 }, position: { x: 0, y: 0 } };
        this.anchor = { x: 0, y: 0 };
        this.aspect = 1.0;
        this.fixedAspect = false;
        this.visible = true;
        this.computed = { size: { width: 0, height: 0 }, position: { x: 0, y: 0 } };
        this.relative = {
            size: { width: relWidth, height: relHeight },
            position: { x: relX, y: relY }
        };
        this.offset = {
            size: { width: offWidth, height: offHeight },
            position: { x: offX, y: offY }
        };
    }
    doLayout(parent) {
        let relative = this.relative;
        let offset = this.offset;
        let newWidth = relative.size.width * parent.size.width + offset.size.width;
        let newHeight = relative.size.height * parent.size.height + offset.size.height;
        this.computed.size = { width: newWidth, height: newHeight };
        if (this.fixedAspect) {
            let aspectWidth = newHeight * this.aspect;
            let aspectHeight = newWidth / this.aspect;
            if (aspectWidth < newWidth) {
                this.computed.size = { width: aspectWidth, height: newHeight };
            }
            else {
                this.computed.size = { width: newWidth, height: aspectHeight };
            }
        }
        else {
            this.aspect = newWidth / newHeight;
        }
        let newX = parent.position.x
            + parent.size.width * relative.position.x
            - this.anchor.x * this.computed.size.width
            + offset.position.x;
        let newY = parent.position.y
            + parent.size.height * relative.position.y
            - this.anchor.y * this.computed.size.height
            + offset.position.y;
        this.computed.position = { x: newX, y: newY };
    }
}
//# sourceMappingURL=Layout.js.map