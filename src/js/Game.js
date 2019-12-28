"use strict";
class Game {
    constructor(container, controller) {
        this._stopped = true;
        this.components = new Array();
        this.controller = controller;
        this.viewport = document.createElement("canvas");
        this.context = this.viewport.getContext('2d');
        container.insertBefore(this.viewport, container.firstChild);
        let info = document.getElementById("info");
        let topPadding = info ? info.clientHeight + 5 : 5;
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight - topPadding;
        this.contentProvider = new ContentProvider();
    }
    doLayoutRecursive(components, parent) {
        for (let component of components) {
            component.layout.doLayout(parent);
            if (component.children) {
                this.doLayoutRecursive(component.children, component.layout.computed);
            }
        }
    }
    doLayout() {
        let box = {
            position: { x: 0, y: 0 },
            size: { width: window.innerWidth, height: window.innerHeight },
        };
        for (let component of this.components) {
            component.layout.doLayout(box);
            if (component.children) {
                this.doLayoutRecursive(component.children, component.layout.computed);
            }
        }
    }
    renderRecursive(components) {
        for (let component of components) {
            if (component.layout.visible) {
                component.render(this.context, this.contentProvider);
                if (component.children) {
                    this.renderRecursive(component.children);
                }
            }
        }
    }
    clickRecursive(components, e) {
        for (let component of components) {
            if (component.onClick
                && component.layout.containsPosition(e.offsetX, e.offsetY)
                && component.onClick(e)) {
                break;
            }
            if (component.children) {
                this.clickRecursive(component.children, e);
            }
        }
    }
    mouseDownRecursive(components, e) {
        for (let component of components) {
            if (component.onMouseDown
                && component.layout.containsPosition(e.offsetX, e.offsetY)
                && component.onMouseDown(e)) {
                this.mouseDownComponent = component;
                break;
            }
            if (component.children) {
                this.mouseDownRecursive(component.children, e);
            }
        }
    }
    stop() { this._stopped = true; }
    start() {
        console.assert(this._stopped);
        this._stopped = false;
        var _this = this;
        function update(timeMS) {
            if (_this._stopped) {
                return;
            }
            window.requestAnimationFrame(update);
            if (_this.controller.onUpdate) {
                _this.controller.onUpdate(timeMS);
            }
            _this.context.clearRect(0, 0, _this.viewport.width, _this.viewport.height);
            _this.renderRecursive(_this.components);
        }
        window.addEventListener('click', function (e) {
            if (_this._stopped) {
                return;
            }
            _this.clickRecursive(_this.components, e);
        });
        window.addEventListener('mousedown', function (e) {
            if (_this._stopped) {
                return;
            }
            _this.mouseDownRecursive(_this.components, e);
        });
        window.addEventListener('mouseup', function (e) {
            if (_this._stopped) {
                return;
            }
            for (var component of _this.components) {
                if (component.onMouseUp) {
                    component.onMouseUp(e);
                }
            }
        });
        window.addEventListener('mousemove', function (e) {
            if (_this._stopped) {
                return;
            }
            if (_this.mouseDownComponent
                && _this.mouseDownComponent.onMouseOut
                && !_this.mouseDownComponent.layout.containsPosition(e.offsetX, e.offsetY)) {
                _this.mouseDownComponent.onMouseOut(e);
                _this.mouseDownComponent = undefined;
            }
            for (var component of _this.components) {
                if (component.onMouseMove) {
                    component.onMouseMove(e);
                }
            }
        });
        window.addEventListener('keydown', function (e) {
            if (_this._stopped) {
                return;
            }
            if (_this.controller.onKeyDown) {
                _this.controller.onKeyDown(e);
            }
        });
        update(performance.now());
    }
}
//# sourceMappingURL=Game.js.map