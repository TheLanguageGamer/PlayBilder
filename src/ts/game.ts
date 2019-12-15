
interface GameController {
	onKeyDown? : (e : KeyboardEvent) => void;
	onUpdate? : (now : DOMHighResTimeStamp) => void;
}

class Game {
	viewport : HTMLCanvasElement;
	context : CanvasRenderingContext2D;
	contentProvider : ContentProvider
	_stopped : boolean = true;
	components : Component[] = new Array();
	controller  : GameController;

	constructor (
		container : HTMLElement,
		controller  : GameController) {

		this.controller = controller;
		this.viewport = document.createElement("canvas");
		this.context = this.viewport.getContext('2d')!;
		container.insertBefore(this.viewport, container.firstChild);
		
		this.viewport.width = window.innerWidth;
    	this.viewport.height = window.innerHeight;

    	this.contentProvider = new ContentProvider();
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
    	let box = {
    		position: {x:0, y:0},
    		size: {width: window.innerWidth, height: window.innerHeight},
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
    			component.render(this.context, this.contentProvider);
    		}
    		if (component.children) {
	    		this.renderRecursive(component.children);
	    	}
    	}

    }
    clickRecursive(components : Component[], e : MouseEvent) {
    	for (let component of components) {
    		if (component.onClick
    			&& component.layout.containsPosition(e.clientX, e.clientY)
    			&& component.onClick(e))
    		{
    			break;
    		}
    		if (component.children) {
	    		this.clickRecursive(component.children, e);
	    	}
    	}

    }
    stop() { this._stopped = true; }
    start() {
    	console.assert(this._stopped);
    	this._stopped = false;
    	var _this = this;
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
        	for (var component of _this.components) {
        		if (component.onMouseDown) {
	        		component.onMouseDown(e);
	        	}
        	}
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
        update(performance.now());
    }
}