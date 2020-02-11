"use strict";
var EdgeType;
(function (EdgeType) {
    EdgeType[EdgeType["None"] = 0] = "None";
    EdgeType[EdgeType["Always"] = 1] = "Always";
    EdgeType[EdgeType["IfMatched"] = 2] = "IfMatched";
    EdgeType[EdgeType["IfNotMatched"] = 3] = "IfNotMatched";
    EdgeType[EdgeType["Parallel"] = 4] = "Parallel";
})(EdgeType || (EdgeType = {}));
class Edge {
    constructor(obj) {
        this.type = EdgeType.Always;
        this.headRuleIndex = -1;
        this.arrow = new Arrow();
        this.tailRuleIndex = obj.tailRuleIndex;
        if (obj.fromTool == Tool.EdgeAlways) {
            this.setEdgeType(EdgeType.Always);
        }
        else if (obj.fromTool == Tool.EdgeIfMatched) {
            this.setEdgeType(EdgeType.IfMatched);
        }
        else if (obj.fromTool == Tool.EdgeIfNotMatched) {
            this.setEdgeType(EdgeType.IfNotMatched);
        }
        else if (obj.fromTool == Tool.EdgeParallel) {
            this.setEdgeType(EdgeType.Parallel);
        }
        this.arrow.layout.doLayout(obj.parentLayout.computed);
    }
    save() {
        return {
            tailRuleIndex: this.tailRuleIndex,
            headRuleIndex: this.headRuleIndex,
            type: this.type,
        };
    }
    load(archive) {
        if (archive.tailRuleIndex) {
            this.tailRuleIndex = archive.tailRuleIndex;
        }
        if (archive.headRuleIndex) {
            this.headRuleIndex = archive.headRuleIndex;
        }
        if (archive.type) {
            this.setEdgeType(archive.type);
        }
    }
    setEdgeType(type) {
        this.type = type;
        switch (type) {
            case EdgeType.Always: {
                this.arrow.color = Constants.Colors.Black;
                break;
            }
            case EdgeType.IfMatched: {
                this.arrow.color = Constants.Colors.Green.NCS;
                break;
            }
            case EdgeType.IfNotMatched: {
                this.arrow.color = Constants.Colors.Red.NCS;
                break;
            }
            case EdgeType.Parallel: {
                this.arrow.color = Constants.Colors.Blue.NCS;
                break;
            }
        }
    }
    disable() {
        this.tailRuleIndex = -1;
        this.headRuleIndex = -1;
        this.arrow.layout.visible = false;
    }
    enable() {
        this.arrow.layout.visible = true;
    }
    isEnabled() {
        return this.arrow.layout.visible;
    }
    positionLoop(rule, data, grid) {
        for (let i = 0; i < grid.gridSize.width; ++i) {
            for (let j = 0; j < grid.gridSize.height; ++j) {
                let ruleIndex = data[i][j][3];
                if (rule.index == ruleIndex) {
                    this.arrow.from = grid.getPositionForCoordinate(i, j);
                    this.arrow.to = grid.getPositionForCoordinate(i + 1, j);
                    this.arrow.to.x += 5;
                    return;
                }
            }
        }
    }
    findClosestPoint(pos, rule, grid) {
        let ret = { x: 0, y: 0 };
        let minDistance1 = -1;
        let minDistance2 = -1;
        let bestPos1 = { x: 0, y: 0 };
        let bestPos2 = { x: 0, y: 0 };
        for (let sideJson of rule.boundaryEdges) {
            let side = JSON.parse(sideJson);
            let firstPos = grid.getPositionForCoordinate(side[0], side[1]);
            let secondPos = grid.getPositionForCoordinate(side[2], side[3]);
            let distance1 = calculateDistance(pos, firstPos);
            let distance2 = calculateDistance(pos, secondPos);
            let average = (distance1 + distance2) / 2;
            if (minDistance1 < 0 || average < (minDistance1 + minDistance2) / 2) {
                minDistance1 = distance1;
                minDistance2 = distance2;
                bestPos1 = firstPos;
                bestPos2 = secondPos;
            }
        }
        let testPos = averagePosition(bestPos1, bestPos2);
        let testDistance = calculateDistance(pos, testPos);
        let bestPos = minDistance1 < minDistance2 ? bestPos1 : bestPos2;
        let bestDistance = Math.min(minDistance1, minDistance2);
        let otherPos = minDistance1 < minDistance2 ? bestPos2 : bestPos1;
        while (testDistance < bestDistance) {
            let temp = testPos;
            testPos = averagePosition(testPos, bestPos);
            bestPos = temp;
            bestDistance = testDistance;
            testDistance = calculateDistance(pos, testPos);
        }
        return bestPos;
    }
    unselect() {
        this.arrow.lineWidth = 3;
        this.arrow.headMargin = 6;
    }
    select() {
        this.arrow.lineWidth = 5;
        this.arrow.headMargin = 10;
    }
    distanceTo(x, y) {
        return minimumDistanceToLineSegment({
            x: x - this.arrow.layout.computed.position.x,
            y: y - this.arrow.layout.computed.position.y,
        }, this.arrow.from, this.arrow.to);
    }
    positionMovingArrow(offsetX, offsetY, rule, grid) {
        this.arrow.to.x = offsetX - this.arrow.layout.computed.position.x;
        this.arrow.to.y = offsetY - this.arrow.layout.computed.position.y;
        this.arrow.from = this.findClosestPoint(this.arrow.to, rule, grid);
    }
    isLoop() {
        return this.headRuleIndex == this.tailRuleIndex;
    }
    finalizeArrowPosition(rule, data, grid) {
        if (this.isLoop()) {
            this.positionLoop(rule, data, grid);
        }
        else {
            this.arrow.to = this.findClosestPoint(this.arrow.from, rule, grid);
        }
    }
    repositionBasedOnTailMove(rule1, rule2, data, grid) {
        if (this.isLoop()) {
            this.positionLoop(rule1, data, grid);
        }
        else {
            this.arrow.from = this.findClosestPoint(this.arrow.to, rule1, grid);
            if (rule2) {
                this.arrow.to = this.findClosestPoint(this.arrow.from, rule2, grid);
            }
        }
    }
    repositionBasedOnHeadMove(rule1, rule2, data, grid) {
        if (this.isLoop()) {
            this.positionLoop(rule1, data, grid);
        }
        else {
            this.arrow.to = this.findClosestPoint(this.arrow.from, rule1, grid);
            if (rule2) {
                this.arrow.from = this.findClosestPoint(this.arrow.to, rule2, grid);
            }
        }
    }
}
//# sourceMappingURL=Edge.js.map