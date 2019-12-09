"use strict";
class ContentProvider {
    constructor() {
        this.images = {};
    }
    getImage(path) {
        if (!(path in this.images)) {
            this.images[path] = new Image();
            this.images[path].src = path;
        }
        return this.images[path];
    }
}
//# sourceMappingURL=ContentProvider.js.map