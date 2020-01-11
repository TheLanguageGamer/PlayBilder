"use strict";
var DEBUG_CONTENT_PROVIDER = false;
class ContentProvider {
    constructor() {
        this.images = {};
        this.boxes = [];
        this.blits = new Map();
        this.padding = 5;
        this.offset = { x: 0, y: 0 };
        this.viewport = document.createElement("canvas");
        this.context = this.viewport.getContext('2d');
        this.viewport.width = 512;
        this.viewport.height = 512;
        this.context.clearRect(0, 0, 512, 512);
        if (DEBUG_CONTENT_PROVIDER) {
            let container = document.getElementById('debug');
            container.insertBefore(this.viewport, container.firstChild);
        }
    }
    getImage(path) {
        if (!(path in this.images)) {
            this.images[path] = new Image();
            this.images[path].src = path;
        }
        return this.images[path];
    }
    createImageBlit(path, size) {
        let preexisting = this.blits.get(path);
        if (preexisting) {
            return preexisting;
        }
        let image = this.getImage(path);
        if (this.offset.x + size.width + this.padding >= this.viewport.width) {
            this.offset.x = this.padding;
            this.offset.y += size.height + this.padding;
        }
        let box = {
            position: {
                x: this.offset.x,
                y: this.offset.y,
            },
            size: {
                width: size.width,
                height: size.height,
            },
        };
        let index = this.boxes.length;
        this.boxes.push(box);
        this.offset.x += this.padding + size.width;
        let ctx = this.context;
        image.addEventListener("load", function () {
            ctx.drawImage(image, box.position.x, box.position.y, size.width, size.height);
        }, false);
        this.blits.set(path, index);
        return index;
    }
    blitImage(otherCtx, index, x, y) {
        let box = this.boxes[index];
        let data = this.context.getImageData(box.position.x, box.position.y, box.size.width, box.size.height);
        otherCtx.putImageData(data, x, y);
    }
}
//# sourceMappingURL=ContentProvider.js.map