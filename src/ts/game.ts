
var DEBUG_LAYOUT = false;

interface GameController {
	onKeyDown? : (e : KeyboardEvent) => void;
	onUpdate? : (now : DOMHighResTimeStamp) => void;
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
		window.addEventListener("focus", function(event) {
			_this.start();
		});
		window.addEventListener("blur", function(event) {
			_this.stop();
		})
		function update(timeMS : DOMHighResTimeStamp) {
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
			if (_this.controller.onKeyDown) {
				_this.controller.onKeyDown(e)
			}
		});
	}
	doLayoutRecursive(components : Component[], parent : Box) {
		for (let component of components) {
			component.layout.doLayout(parent);
			if (component.children) {
				this.doLayoutRecursive(component.children, component.layout.computed);
			}
		}

	}
	doLayout() {
		let screenSize = getGameScreenSize();
		let box = {
			position: {x:0, y:0},
			size: {width: screenSize.width, height: screenSize.height},
		};
		for (let component of this.components) {
			component.layout.doLayout(box);
			if (component.children) {
				this.doLayoutRecursive(component.children, component.layout.computed);
			}
		}
	}
	renderRecursive(components : Component[]) {
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
				component.render(this.context, this.contentProvider);
				if (component.children) {
					this.renderRecursive(component.children);
				}
			}
		}

	}
	clickRecursive(components : Component[], e : MouseEvent) {
		for (let component of components) {
			if (component.onClick
				&& component.layout.containsPosition(e.offsetX, e.offsetY)
				&& component.onClick(e))
			{
				break;
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
		let _this = this;
		function update(timeMS : DOMHighResTimeStamp) {
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
		update(performance.now());
	}
}