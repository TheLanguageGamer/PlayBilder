interface GridController {
	populate? : (i : number, j : number) => string[];	
	onClick? : (i : number, j : number) => void;
	onMouseDown? : (i : number, j : number, e : MouseEvent) => void;
	onMouseMove? : (i : number, j : number, e : MouseEvent) => void;
	onMouseUp? : (i : number, j : number, e : MouseEvent) => void;
	onSelect? : (i : number, j : number) => void;
}

class Grid implements Component {
	gridSize : Size;
	grid : string[][][];
	controller : GridController;
	tileSize : number = 0;
	downAt : Pos = {x : -1, y : -1};
	color = Constants.Colors.VeryLightGrey;

	layout : Layout;
	children? : Component[]

	constructor (
		gridSize : Size,
		layout : Layout,
		controller : GridController = {}) {

		this.layout = layout;
		this.controller = controller;
		this.gridSize = gridSize;
		this.grid = new Array();
		for (let i = 0; i < this.gridSize.width; ++i) {
			this.grid.push(new Array());
			for (let j = 0; j < this.gridSize.height; ++j) {
				this.grid[i].push();
				if (this.controller.populate)
				{
					this.grid[i][j] = this.controller.populate(i, j);
				}
			}
		}
	}
	// doPopulate(cp : ContentProvider) {
	// 	let tileSize = this.computeTileSize();
	// 	for (let i = 0; i < this.gridSize.width; ++i) {
	// 		for (let j = 0; j < this.gridSize.height; ++j) {
	// 		}
	// 	}
	// }
	computeTileSize() {
		return Math.floor(Math.min(
			this.layout.computed.size.width / this.gridSize.width,
			this.layout.computed.size.height / this.gridSize.height,
		));
	}
	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		this.tileSize = this.computeTileSize();
		if (!this.layout.visible) {
			return;
		}
		ctx.beginPath();
		ctx.lineWidth = 1.0;
		ctx.setLineDash([])
		ctx.strokeStyle = this.color;
		for (let i = 0; i <= this.gridSize.width; ++i) {
			ctx.moveTo(
				this.layout.computed.position.x + i*this.tileSize,
				this.layout.computed.position.y
			);
			ctx.lineTo(
				this.layout.computed.position.x + i*this.tileSize,
				this.layout.computed.position.y + this.gridSize.height*this.tileSize
			);
		}
		for (let i = 0; i <= this.gridSize.height; ++i) {
			ctx.moveTo(
				this.layout.computed.position.x,
				this.layout.computed.position.y + i*this.tileSize
			);
			ctx.lineTo(
				this.layout.computed.position.x + this.gridSize.width*this.tileSize,
				this.layout.computed.position.y + i*this.tileSize
			);
		}
		for (let j = 0; j < this.gridSize.height; ++j) {
			for (let i = 0; i < this.gridSize.width; ++i) {
				for (let path of this.grid[i][j]) {
					if (path && path.length > 0) {
						cp.blitImage(
							ctx,
							cp.createImageBlit(path, {width : this.tileSize, height : this.tileSize}),
							this.layout.computed.position.x + i*this.tileSize,
							this.layout.computed.position.y + j*this.tileSize
						);
					}
				}
			}
		}
		ctx.stroke();
	}

	getCoordinateForXPosition(x : number) {
		return Math.floor((x - this.layout.computed.position.x) / this.tileSize);
	}
	getCoordinateForYPosition(y : number) {
		return Math.floor((y - this.layout.computed.position.y) / this.tileSize);
	}
	getPositionForCoordinate(i : number, j : number) {
		return {
			x : i * this.tileSize + this.layout.computed.position.x,
			y : j * this.tileSize + this.layout.computed.position.y,
		};
	}
	isValidCoordinate(i : number, j : number) {
		return i >= 0 && j >= 0 && i < this.gridSize.width && j < this.gridSize.height;
	}
	onClick(e : MouseEvent) {
		if (!this.controller.onClick) {
			return false;
		}
		const x = this.getCoordinateForXPosition(e.offsetX);
		const y = this.getCoordinateForYPosition(e.offsetY);
		if (x < 0
			|| y < 0
			|| x >= this.gridSize.width
			|| y >= this.gridSize.height) {
			return false;
		}
		this.controller.onClick(x, y);
		return true;
	}
	onMouseDown(e : MouseEvent) {
		if (!this.controller.onMouseDown && !this.controller.onSelect) {
			return false;
		}
		const x = this.getCoordinateForXPosition(e.offsetX);
		const y = this.getCoordinateForYPosition(e.offsetY);
		if (x < 0
			|| y < 0
			|| x >= this.gridSize.width
			|| y >= this.gridSize.height) {
			return false;
		}
		if (this.controller.onMouseDown) {
			this.controller.onMouseDown(x, y, e);
		}
		if (this.controller.onSelect) {
			this.controller.onSelect(x, y);
		}
		this.downAt.x = x;
		this.downAt.y = y;
		return true;
	}
	onMouseMove(e : MouseEvent) {
		if ((!this.controller.onMouseMove && !this.controller.onSelect)
			|| this.downAt.x == -1) {
			return false;
		}
		const x = this.getCoordinateForXPosition(e.offsetX);
		const y = this.getCoordinateForYPosition(e.offsetY);
		if (x < 0
			|| y < 0
			|| x >= this.gridSize.width
			|| y >= this.gridSize.height) {
			return false;
		}
		if (this.controller.onMouseMove) {
			this.controller.onMouseMove(x, y, e);
		}
		if (this.controller.onSelect
			&& (this.downAt.x != x || this.downAt.y != y)) {
			this.controller.onSelect(x, y);
		}
		this.downAt.x = x;
		this.downAt.y = y;
		return true;
	}
	onMouseUp(e : MouseEvent) {
		this.downAt.x = -1;
		this.downAt.y = -1;
		if (!this.controller.onMouseUp) {
			return false;
		}
		const x = this.getCoordinateForXPosition(e.offsetX);
		const y = this.getCoordinateForYPosition(e.offsetY);
		if (x < 0
			|| y < 0
			|| x >= this.gridSize.width
			|| y >= this.gridSize.height) {
			return false;
		}
		this.controller.onMouseUp(x, y, e);
		return true;
	}
}