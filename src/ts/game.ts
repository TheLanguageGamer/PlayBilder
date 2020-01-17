
var DEBUG_LAYOUT = false;

interface GameController {
	onKeyDown? : (e : KeyboardEvent) => void;
	onUpdate? : (now : DOMHighResTimeStamp) => void;
	willResize? : (screenSize : Size, cp : ContentProvider) => void;
	didResize? : (screenSize : Size, cp : ContentProvider) => void;
	needsLayout? : () => boolean;
}

function getGameScreenSize() {
	let info = document.getElementById("info");
	let leftPadding = info ? info.clientWidth + 5 : 5;
	return {
		width : window.innerWidth - leftPadding,
		height : window.innerHeight - 15,
	};
}

class Game {
	private viewport : HTMLCanvasElement;
	private context : CanvasRenderingContext2D;
	private contentProvider : ContentProvider
	private _stopped : boolean = true;
	private controller  : GameController;
	private mouseDownComponent? : Component;
	private focusedComponent? : Component;
	components : Component[] = new Array();

	constructor (
		container : HTMLElement,
		controller  : GameController) {

		this.controller = controller;
		this.viewport = document.createElement("canvas");
		this.context = this.viewport.getContext('2d')!;
		container.insertBefore(this.viewport, container.firstChild);
		
		let screenSize = getGameScreenSize();
		this.viewport.width = screenSize.width;
		this.viewport.height = screenSize.height;

		if (DEBUG_LAYOUT) {
			this.viewport.style.backgroundColor = "red";
		}

		this.contentProvider = new ContentProvider();

		var _this = this;
		function update(timeMS : DOMHighResTimeStamp) {
			window.requestAnimationFrame(update);
			if (_this._stopped
				&& !_this.contentProvider.needsRender) {
				return;
			}
			if (_this.controller.needsLayout
				&& _this.controller.needsLayout()) {
				_this.doLayout();
				if (_this.controller.didResize) {
					_this.controller.didResize(screenSize, _this.contentProvider);
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
		window.addEventListener("focus", function(event) {
			_this.start();
		});
		window.addEventListener("blur", function(event) {
			_this.stop();
		});
		window.addEventListener("resize", function(event) {
			let screenSize = getGameScreenSize();
			_this.viewport.width = screenSize.width;
			_this.viewport.height = screenSize.height;
			_this.context = _this.viewport.getContext('2d')!;
			if (_this.controller.willResize) {
				_this.controller.willResize(screenSize, _this.contentProvider);
			}
			_this.doLayout();
			if (_this.controller.didResize) {
				_this.controller.didResize(screenSize, _this.contentProvider);
			}
			_this.context.clearRect(0, 0, _this.viewport.width, _this.viewport.height);
			_this.renderRecursive(_this.components, performance.now());
			console.log("resize", screenSize.width, screenSize.height);
		});
		window.addEventListener('click', function(e: MouseEvent) {
			if (_this._stopped) {
				return;
			}
			_this.clickRecursive(_this.components, e);
		});
		window.addEventListener('mousedown', function(e: MouseEvent) {
			if (_this._stopped) {
				return;
			}
			if (_this.focusedComponent && _this.focusedComponent.blur) {
				_this.focusedComponent.blur();
			}
			_this.focusedComponent = undefined;
			_this.mouseDownRecursive(_this.components, e);
		});
		window.addEventListener('mouseup', function(e: MouseEvent) {
			if (_this._stopped) {
				return;
			}
			for (var component of _this.components) {
				if (component.onMouseUp) {
					component.onMouseUp(e);
				}
			}
		});
		window.addEventListener('mousemove', function(e: MouseEvent) {
			if (_this._stopped) {
				return;
			}
			if (_this.mouseDownComponent
				&& _this.mouseDownComponent.onMouseOut
				&& !_this.mouseDownComponent.layout.containsPosition(e.offsetX, e.offsetY))
			{
				_this.mouseDownComponent.onMouseOut(e);
				_this.mouseDownComponent = undefined;
			}
			for (var component of _this.components) {
				if (component.onMouseMove) {
					component.onMouseMove(e);
				}
			}
		});
		window.addEventListener('keydown', function(e: KeyboardEvent) {
			if (_this._stopped) {
				return;
			}
			if (_this.focusedComponent && _this.focusedComponent.onKeyDown) {
				_this.focusedComponent.onKeyDown(e);
			} else if (_this.controller.onKeyDown) {
				_this.controller.onKeyDown(e)
			}
		});
	}
	doLayout() {
		let screenSize = getGameScreenSize();
		let box = {
			position: {x:0, y:0},
			size: {width: screenSize.width, height: screenSize.height},
		};
		for (let component of this.components) {
			component.layout.doLayoutRecursive(box, component.children);
		}
	}
	renderRecursive(components : Component[], timeMS : DOMHighResTimeStamp) {
		for (let component of components) {
			if (component.layout.visible) {
				if (DEBUG_LAYOUT) {
					this.context.beginPath();
					this.context.setLineDash([]);
					this.context.rect(
						component.layout.computed.position.x,
						component.layout.computed.position.y,
						component.layout.computed.size.width,
						component.layout.computed.size.height
					);
					this.context.stroke();
				}
				component.render(this.context, this.contentProvider, timeMS);
				if (component.children) {
					this.renderRecursive(component.children, timeMS);
				}
			}
		}

	}
	clickRecursive(components : Component[], e : MouseEvent) {
		for (let component of components) {
			if (component.onClick
				&& component.layout.containsPosition(e.offsetX, e.offsetY))
			{
				let response = component.onClick(e);
				if (response == InputResponse.Sunk) {
					break;
				} else if (response == InputResponse.Focused) {
					this.focusedComponent = component;
					break;
				}
			}
			if (component.children) {
				this.clickRecursive(component.children, e);
			}
		}

	}
	mouseDownRecursive(components : Component[], e : MouseEvent) {
		for (let component of components) {
			if (component.onMouseDown
				&& component.layout.containsPosition(e.offsetX, e.offsetY)
				&& component.onMouseDown(e))
			{
				this.mouseDownComponent = component;
				this.focusedComponent = component;
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