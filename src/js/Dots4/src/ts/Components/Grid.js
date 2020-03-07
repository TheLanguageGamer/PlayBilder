"use strict";
class Grid {
    constructor(gridSize, layout, controller = {}) {
        this.downAt = { x: -1, y: -1 };
        this.color = Constants.Colors.VeryLightGrey;
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
    resizeGrid(newSize) {
        let actualSize = {
            width: this.grid.length,
            height: this.grid[0].length,
        };
        for (let i = 0; i < newSize.width; ++i) {
            if (i >= actualSize.width) {
                this.grid.push(new Array());
            }
            for (let j = 0; j < newSize.height; ++j) {
                if (i >= actualSize.width || j >= actualSize.height) {
                    this.grid[i].push();
                    if (this.controller.populate) {
                        this.grid[i][j] = this.controller.populate(i, j);
                    }
                }
            }
        }
        this.gridSize = newSize;
    }
    computeTileSize() {
        let ret = Math.floor(Math.min(this.layout.computed.size.width / this.gridSize.width, this.layout.computed.size.height / this.gridSize.height));
        return ret;
    }
    render(ctx, cp) {
        let tileSize = this.computeTileSize();
        if (!this.layout.visible) {
            return;
        }
        ctx.beginPath();
        ctx.lineWidth = 1.0;
        ctx.setLineDash([]);
        ctx.strokeStyle = this.color;
        for (let i = 0; i <= this.gridSize.width; ++i) {
            ctx.moveTo(this.layout.computed.position.x + i * tileSize, this.layout.computed.position.y);
            ctx.lineTo(this.layout.computed.position.x + i * tileSize, this.layout.computed.position.y + this.gridSize.height * tileSize);
        }
        for (let i = 0; i <= this.gridSize.height; ++i) {
            ctx.moveTo(this.layout.computed.position.x, this.layout.computed.position.y + i * tileSize);
            ctx.lineTo(this.layout.computed.position.x + this.gridSize.width * tileSize, this.layout.computed.position.y + i * tileSize);
        }
        for (let j = 0; j < this.gridSize.height; ++j) {
            for (let i = 0; i < this.gridSize.width; ++i) {
                for (let path of this.grid[i][j]) {
                    if (path && path.length > 0) {
                        cp.blitImage(ctx, cp.createImageBlit(path, { width: tileSize, height: tileSize }), this.layout.computed.position.x + i * tileSize, this.layout.computed.position.y + j * tileSize);
                    }
                }
            }
        }
        ctx.stroke();
    }
    getCoordinateForXPosition(x) {
        return Math.floor((x - this.layout.computed.position.x) / this.computeTileSize());
    }
    getCoordinateForYPosition(y) {
        return Math.floor((y - this.layout.computed.position.y) / this.computeTileSize());
    }
    getPositionForCoordinate(i, j) {
        return {
            x: i * this.computeTileSize(),
            y: j * this.computeTileSize(),
        };
    }
    coordinateBoxContainsPosition(box, x, y) {
        let i = this.getCoordinateForXPosition(x);
        let j = this.getCoordinateForYPosition(y);
        return i >= box.position.x
            && j >= box.position.y
            && i < box.position.x + box.size.width
            && j < box.position.y + box.size.height;
    }
    setLayoutToBox(layout, box) {
        let ul = this.getPositionForCoordinate(box.position.x, box.position.y);
        let lr = this.getPositionForCoordinate(box.position.x + box.size.width, box.position.y + box.size.height);
        layout.setUpperLeft(ul.x, ul.y);
        layout.setLowerRight(lr.x, lr.y);
    }
    clipRectangleToCoordinates(layout, fudgeFactor) {
        let tileSize = this.computeTileSize();
        let ulX = layout.getUpperLeftX();
        let ulY = layout.getUpperLeftY();
        let lrX = layout.getLowerRightX();
        let lrY = layout.getLowerRightY();
        if (lrX > ulX) {
            ulX -= tileSize * fudgeFactor;
            lrX += tileSize * fudgeFactor;
        }
        else {
            ulX += tileSize * fudgeFactor;
            lrX -= tileSize * fudgeFactor;
        }
        if (lrY > ulY) {
            ulY -= tileSize * fudgeFactor;
            lrY += tileSize * fudgeFactor;
        }
        else {
            ulY += tileSize * fudgeFactor;
            lrY -= tileSize * fudgeFactor;
        }
        let ulI = this.getCoordinateForXPosition(ulX);
        let ulJ = this.getCoordinateForYPosition(ulY);
        let lrI = this.getCoordinateForXPosition(lrX);
        let lrJ = this.getCoordinateForYPosition(lrY);
        if (lrX > ulX) {
            ulI += 1;
        }
        else {
            lrI += 1;
        }
        if (lrY > ulY) {
            ulJ += 1;
        }
        else {
            lrJ += 1;
        }
        let newUL = this.getPositionForCoordinate(ulI, ulJ);
        let newUR = this.getPositionForCoordinate(lrI, lrJ);
        layout.setUpperLeft(newUL.x, newUL.y);
        layout.setLowerRight(newUR.x, newUR.y);
        return {
            position: {
                x: Math.min(ulI, lrI),
                y: Math.min(ulJ, lrJ),
            },
            size: {
                width: Math.abs(ulI - lrI),
                height: Math.abs(ulJ - lrJ),
            },
        };
    }
    isValidCoordinate(i, j) {
        return i >= 0 && j >= 0 && i < this.gridSize.width && j < this.gridSize.height;
    }
    onClick(e) {
        if (!this.controller.onClick) {
            return InputResponse.Ignored;
        }
        const x = this.getCoordinateForXPosition(e.offsetX);
        const y = this.getCoordinateForYPosition(e.offsetY);
        if (x < 0
            || y < 0
            || x >= this.gridSize.width
            || y >= this.gridSize.height) {
            return InputResponse.Ignored;
        }
        this.controller.onClick(x, y);
        return InputResponse.Sunk;
    }
    onMouseDown(e) {
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
    onMouseMove(e) {
        if ((!this.controller.onMouseMove && !this.controller.onSelect)
            || this.downAt.x == -1) {
            return false;
        }
        const x = this.getCoordinateForXPosition(e.offsetX);
        const y = this.getCoordinateForYPosition(e.offsetY);
        if (this.controller.onMouseMove) {
            this.controller.onMouseMove(x, y, e);
        }
        if (x < 0
            || y < 0
            || x >= this.gridSize.width
            || y >= this.gridSize.height) {
            return false;
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
        const x = this.getCoordinateForXPosition(e.offsetX);
        const y = this.getCoordinateForYPosition(e.offsetY);
        this.controller.onMouseUp(x, y, e);
        return true;
    }
}
//# sourceMappingURL=Grid.js.map