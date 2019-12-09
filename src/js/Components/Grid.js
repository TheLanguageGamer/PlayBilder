"use strict";
class Grid {
    constructor(gridSize, layout, controller = {}) {
        this.tileSize = 0;
        this.downAt = { x: -1, y: -1 };
        this.layout = layout;
        this.controller = controller;
        this.gridSize = gridSize;
        this.grid = new Array();
        for (let i = 0; i < this.gridSize.width; ++i) {
            this.grid.push(new Array());
            for (let j = 0; j < this.gridSize.height; ++j) {
                this.grid[i].push();
                if (this.controller.populate) {
                    this.grid[i][j] = this.controller.populate(i, j);
                }
            }
        }
    }
    computeTileSize() {
        return Math.floor(Math.min(this.layout.computed.size.width / this.gridSize.width, this.layout.computed.size.height / this.gridSize.height));
    }
    render(ctx, cp) {
        this.tileSize = this.computeTileSize();
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 1.0;
        ctx.setLineDash([]);
        ctx.strokeStyle = "#9D9D9D";
        for (let i = 0; i <= this.gridSize.width; ++i) {
            ctx.moveTo(this.layout.computed.position.x + i * this.tileSize, this.layout.computed.position.y);
            ctx.lineTo(this.layout.computed.position.x + i * this.tileSize, this.layout.computed.position.y + this.gridSize.height * this.tileSize);
        }
        for (let i = 0; i <= this.gridSize.height; ++i) {
            ctx.moveTo(this.layout.computed.position.x, this.layout.computed.position.y + i * this.tileSize);
            ctx.lineTo(this.layout.computed.position.x + this.gridSize.width * this.tileSize, this.layout.computed.position.y + i * this.tileSize);
        }
        for (let j = 0; j < this.gridSize.height; ++j) {
            for (let i = 0; i < this.gridSize.width; ++i) {
                for (let path of this.grid[i][j]) {
                    if (path && path.length > 0) {
                        ctx.drawImage(cp.getImage(path), this.layout.computed.position.x + i * this.tileSize, this.layout.computed.position.y + j * this.tileSize, this.tileSize, this.tileSize);
                    }
                }
            }
        }
        ctx.stroke();
    }
    getCoordinateForXPosition(x) {
        return Math.floor((x - this.layout.computed.position.x) / this.tileSize);
    }
    getCoordinateForYPosition(y) {
        return Math.floor((y - this.layout.computed.position.y) / this.tileSize);
    }
    getPositionForCoordinate(i, j) {
        return {
            x: i * this.tileSize + this.layout.computed.position.x,
            y: j * this.tileSize + this.layout.computed.position.y,
        };
    }
    isValidCoordinate(i, j) {
        return i >= 0 && j >= 0 && i < this.gridSize.width && j < this.gridSize.height;
    }
    onClick(e) {
        if (!this.controller.onClick) {
            return false;
        }
        const x = this.getCoordinateForXPosition(e.clientX);
        const y = this.getCoordinateForYPosition(e.clientY);
        if (x < 0
            || y < 0
            || x >= this.gridSize.width
            || y >= this.gridSize.height) {
            return false;
        }
        this.controller.onClick(x, y);
        return true;
    }
    onMouseDown(e) {
        if (!this.controller.onMouseDown && !this.controller.onSelect) {
            return false;
        }
        const x = this.getCoordinateForXPosition(e.clientX);
        const y = this.getCoordinateForYPosition(e.clientY);
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
    onMouseMove(e) {
        if ((!this.controller.onMouseMove && !this.controller.onSelect)
            || this.downAt.x == -1) {
            return false;
        }
        const x = this.getCoordinateForXPosition(e.clientX);
        const y = this.getCoordinateForYPosition(e.clientY);
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
    onMouseUp(e) {
        this.downAt.x = -1;
        this.downAt.y = -1;
        if (!this.controller.onMouseUp) {
            return false;
        }
        const x = this.getCoordinateForXPosition(e.clientX);
        const y = this.getCoordinateForYPosition(e.clientY);
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
//# sourceMappingURL=Grid.js.map