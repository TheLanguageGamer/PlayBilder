"use strict";
var DEBUG_LAYOUT = false;
function getGameScreenSize() {
    let info = document.getElementById("info");
    let leftPadding = info ? info.clientWidth + 5 : 5;
    return {
        width: window.innerWidth - leftPadding,
        height: window.innerHeight - 15,
    };
}
class Game {
    constructor(container, controller) {
        this._stopped = true;
        this.components = new Array();
        this.controller = controller;
        this.viewport = document.createElement("canvas");
        this.context = this.viewport.getContext('2d');
        container.insertBefore(this.viewport, container.firstChild);
        let screenSize = getGameScreenSize();
        this.viewport.width = screenSize.width;
        this.viewport.height = screenSize.height;
        if (DEBUG_LAYOUT) {
            this.viewport.style.backgroundColor = "red";
        }
        this.contentProvider = new ContentProvider();
        var _this = this;
        function update(timeMS) {
            window.requestAnimationFrame(update);
            if (_this._stopped
                && !_this.contentProvider.needsRender) {
                return;
            }
            if (_this.controller.needsLayout
                && _this.controller.needsLayout()) {
                _this.doLayout();
                if (_this.controller.screenDidResize) {
                    _this.controller.screenDidResize(screenSize, _this.contentProvider);
                }
            }
            if (_this.controller.onUpdate) {
                _this.controller.onUpdate(timeMS);
            }
            _this.context.clearRect(0, 0, _this.viewport.width, _this.viewport.height);
            _this.renderRecursive(_this.components, timeMS);
            _this.contentProvider.needsRender = false;
        }
        update(performance.now());
        window.addEventListener("focus", function (event) {
            _this.start();
        });
        window.addEventListener("blur", function (event) {
            _this.stop();
        });
        window.addEventListener("resize", function (event) {
            let screenSize = getGameScreenSize();
            _this.viewport.width = screenSize.width;
            _this.viewport.height = screenSize.height;
            _this.context = _this.viewport.getContext('2d');
            if (_this.controller.screenWillResize) {
                _this.controller.screenWillResize(screenSize, _this.contentProvider);
            }
            _this.doLayout();
            if (_this.controller.screenDidResize) {
                _this.controller.screenDidResize(screenSize, _this.contentProvider);
            }
            _this.context.clearRect(0, 0, _this.viewport.width, _this.viewport.height);
            _this.renderRecursive(_this.components, performance.now());
            console.log("resize", screenSize.width, screenSize.height);
        });
        window.addEventListener('click', function (e) {
            if (_this._stopped) {
                return;
            }
            console.log("click");
            _this.clickRecursive(_this.components, e);
        });
        window.addEventListener('mousedown', function (e) {
            if (_this._stopped) {
                return;
            }
            console.log("mousedown");
            if (_this.focusedComponent
                && _this.focusedComponent.blur
                && !_this.focusedComponent.layout.containsPosition(e.offsetX, e.offsetY)) {
                _this.focusedComponent.blur();
            } /*else if(_this.focusedComponent
                && _this.focusedComponent.layout.containsPosition(e.offsetX, e.offsetY)) {
                    return;
            }*/
            _this.focusedComponent = undefined;
            _this.mouseDownRecursive(_this.components, e);
        });
        window.addEventListener('mouseup', function (e) {
            if (_this._stopped) {
                return;
            }
            _this.mouseDownComponent = undefined;
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
                && _this.mouseDownComponent.layout.isDraggable) {
                _this.mouseDownComponent.layout.offset.position.x += e.movementX;
                _this.mouseDownComponent.layout.offset.position.y += e.movementY;
                if (_this.mouseDownComponent.clamp) {
                    _this.mouseDownComponent.clamp();
                }
                _this.mouseDownComponent.layout.doLayoutRecursive(ZeroBox, _this.mouseDownComponent);
            }
            if (_this.mouseDownComponent
                && _this.mouseDownComponent.onMouseOut
                && !_this.mouseDownComponent.layout.containsPosition(e.offsetX, e.offsetY)) {
                _this.mouseDownComponent.onMouseOut(e);
                _this.mouseDownComponent = undefined;
            }
            for (var component of _this.components) {
                if (component.onMouseMove) {
                    if (component.layout.containsPosition(e.offsetX, e.offsetY)) {
                        component.onMouseMove(e);
                    }
                    else if (component.onMouseOut) {
                        component.onMouseOut(e);
                    }
                }
            }
        });
        window.addEventListener('keydown', function (e) {
            if (_this._stopped) {
                return;
            }
            if (_this.focusedComponent && _this.focusedComponent.onKeyDown) {
                if (_this.focusedComponent.onKeyDown(e)) {
                    e.preventDefault();
                }
            }
            else if (_this.controller.onKeyDown) {
                if (_this.controller.onKeyDown(e)) {
                    e.preventDefault();
                }
            }
        });
    }
    doLayout() {
        let screenSize = getGameScreenSize();
        let box = {
            position: { x: 0, y: 0 },
            size: { width: screenSize.width, height: screenSize.height },
        };
        for (let component of this.components) {
            component.layout.doLayoutRecursive(box, component);
        }
    }
    renderRecursive(components, timeMS) {
        for (let component of components) {
            if (component.layout.visible) {
                if (DEBUG_LAYOUT) {
                    this.context.beginPath();
                    this.context.setLineDash([]);
                    this.context.rect(component.layout.computed.position.x, component.layout.computed.position.y, component.layout.computed.size.width, component.layout.computed.size.height);
                    this.context.stroke();
                }
                component.render(this.context, this.contentProvider, timeMS);
                if (component.children) {
                    this.renderRecursive(component.children, timeMS);
                }
            }
        }
    }
    clickRecursive(components, e) {
        for (let component of components) {
            if (!component.layout.visible) {
                continue;
            }
            if (component.onClick
                && component.layout.containsPosition(e.offsetX, e.offsetY)) {
                let response = component.onClick(e);
                if (response == InputResponse.Sunk) {
                    break;
                }
                else if (response == InputResponse.Focused) {
                    this.focusedComponent = component;
                    break;
                }
            }
            if (component.children) {
                this.clickRecursive(component.children, e);
            }
        }
    }
    mouseDownRecursive(components, e) {
        for (let component of components) {
            if (!component.layout.visible) {
                continue;
            }
            if (component.children) {
                if (this.mouseDownRecursive(component.children, e)) {
                    return true;
                }
            }
            if (component.layout.containsPosition(e.offsetX, e.offsetY)
                && ((component.onMouseDown && component.onMouseDown(e))
                    || component.layout.isDraggable)) {
                this.mouseDownComponent = component;
                this.focusedComponent = component;
                return true;
            }
        }
        return false;
    }
    stop() { this._stopped = true; }
    start() {
        console.assert(this._stopped);
        this._stopped = false;
        // let _this = this;
        // function update(timeMS : DOMHighResTimeStamp) {
        // 	if (_this._stopped) {
        // 		return;
        // 	}
        // 	window.requestAnimationFrame(update);
        // 	if (_this.controller.onUpdate) {
        // 		_this.controller.onUpdate(timeMS);
        // 	}
        // 	_this.context.clearRect(0, 0, _this.viewport.width, _this.viewport.height);
        // 	_this.renderRecursive(_this.components, timeMS);
        // }
        // update(performance.now());
    }
}
//# sourceMappingURL=Game.js.map