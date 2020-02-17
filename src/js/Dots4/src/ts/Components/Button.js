"use strict";
class Button {
    constructor(layout, controller) {
        this.toggleIndex = 0;
        this.layout = layout;
        this.controller = controller;
        this.onClick = function (e) {
            this.foreground.layout.offset.position.x = 3;
            this.foreground.layout.offset.position.y = -3;
            this.foreground.layout.doLayoutRecursive(this.layout.computed, this.foreground);
            this.controller.onClick(e);
            if (this.togglePaths) {
                this.toggleIndex = (this.toggleIndex + 1) % this.togglePaths.length;
            }
            return InputResponse.Sunk;
        };
        this.onMouseDown = function (e) {
            this.foreground.layout.offset.position.x = 1;
            this.foreground.layout.offset.position.y = -1;
            this.foreground.layout.doLayoutRecursive(this.layout.computed, this.foreground);
            return true;
        };
        this.onMouseOut = function (e) {
            this.foreground.layout.offset.position.x = 3;
            this.foreground.layout.offset.position.y = -3;
            this.foreground.layout.doLayoutRecursive(this.layout.computed, this.foreground);
        };
        this.background = new Rectangle(new Layout(0, 0, 0, 0, 1, 1, 0, 0));
        this.background.fillColor = Constants.Colors.White;
        this.foreground = new Rectangle(new Layout(0, 0, 3, -3, 1, 1, 0, 0));
        this.foreground.fillColor = Constants.Colors.White;
        this.children = [this.background, this.foreground];
    }
    setImagePath(path) {
        if (!this.imageLabel) {
            this.imageLabel = new ImageLabel(new Layout(0, 0, 0, 0, 1, 1, 0, 0), path);
            this.foreground.children = this.foreground.children ? this.foreground.children : [];
            this.foreground.children.push(this.imageLabel);
            this.imageLabel.layout.doLayout(this.foreground.layout.computed);
        }
        this.imageLabel.path = path;
    }
    render(ctx, cp) {
        if (this.togglePaths) {
            this.setImagePath(this.togglePaths[this.toggleIndex]);
        }
    }
}
//# sourceMappingURL=Button.js.map