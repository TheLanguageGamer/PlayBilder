"use strict";
class Container {
    constructor() {
        this.children = [];
        this.layout = new Layout(0, 0, 0, 0, 1, 1, 0, 0);
    }
    render(ctx, cp) {
        if (this.children.length > 0 && this.children[0].layout.visible) {
            console.log("r");
        }
    }
}
//# sourceMappingURL=Container.js.map