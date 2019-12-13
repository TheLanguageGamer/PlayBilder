"use strict";
class Game {
    constructor(container, controller) {
        this._stopped = true;
        this.components = new Array();
        this.controller = controller;
        this.viewport = document.createElement("canvas");
        this.context = this.viewport.getContext('2d');
        container.insertBefore(this.viewport, container.firstChild);
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight;
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
            }
            if (component.children) {
                this.renderRecursive(component.children);
            }
        }
    }
    clickRecursive(components, e) {
        for (let component of components) {
            if (component.onClick && component.onClick(e)) {
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
        function update() {
            if (_this._stopped) {
                return;
            }
            window.requestAnimationFrame(update);
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
            for (var component of _this.components) {
                if (component.onMouseDown) {
                    component.onMouseDown(e);
                }
            }
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
        update();
    }
}
const ImagePaths = {
    Reals: [
        "images/real/real01FF70.png",
        "images/real/real2ECC40.png",
        "images/real/real3D9970.png",
        "images/real/real7FDBFF.png",
        "images/real/real39CCCC.png",
        "images/real/real0074D9.png",
        "images/real/real85144b.png",
        "images/real/realB10DC9.png",
        "images/real/realF012BE.png",
        "images/real/realFF851B.png",
        "images/real/realFF4136.png",
        "images/real/realFFDC00.png",
    ],
    Ideas: [
        "images/idea/idea01FF70.png",
        "images/idea/idea2ECC40.png",
        "images/idea/idea3D9970.png",
        "images/idea/idea7FDBFF.png",
        "images/idea/idea39CCCC.png",
        "images/idea/idea0074D9.png",
        "images/idea/idea85144b.png",
        "images/idea/ideaB10DC9.png",
        "images/idea/ideaF012BE.png",
        "images/idea/ideaFF851B.png",
        "images/idea/ideaFF4136.png",
        "images/idea/ideaFFDC00.png",
    ],
    Futures: [
        "images/future/future01FF70.png",
        "images/future/future2ECC40.png",
        "images/future/future3D9970.png",
        "images/future/future7FDBFF.png",
        "images/future/future39CCCC.png",
        "images/future/future0074D9.png",
        "images/future/future85144b.png",
        "images/future/futureB10DC9.png",
        "images/future/futureF012BE.png",
        "images/future/futureFF851B.png",
        "images/future/futureFF4136.png",
        "images/future/futureFFDC00.png",
    ],
    Tools: {
        "Pencil": "images/tools/icons8-pencil-64.png",
        "Eraser": "images/tools/icons8-eraser-64.png",
        "Move": "images/tools/icons8-move-100.png",
        "Select": "images/tools/icons8-one-finger-96.png",
        "RulePad": "images/tools/toolRulePad.png",
        "EdgeAlways": "images/tools/toolEdgeAlways.png",
        "EdgeIfMatched": "images/tools/toolEdgeIfMatched.png",
        "EdgeIfNotMatched": "images/tools/toolEdgeIfNotMatched.png",
        "EdgeParallel": "images/tools/toolEdgeParallel.png",
    },
    InputState: {
        "Computer": "images/state/icons8-computer-80.png",
        "Left": "images/state/icons8-left-96.png",
        "Right": "images/state/icons8-right-96.png",
        "Up": "images/state/icons8-up-96.png",
        "Down": "images/state/icons8-down-arrow-96.png",
    },
};
var InputState;
(function (InputState) {
    InputState[InputState["Computer"] = 0] = "Computer";
    InputState[InputState["Left"] = 1] = "Left";
    InputState[InputState["Right"] = 2] = "Right";
    InputState[InputState["Up"] = 3] = "Up";
    InputState[InputState["Down"] = 4] = "Down";
    InputState[InputState["__Length"] = 5] = "__Length";
})(InputState || (InputState = {}));
var Tool;
(function (Tool) {
    Tool[Tool["Pencil"] = 0] = "Pencil";
    Tool[Tool["Eraser"] = 1] = "Eraser";
    Tool[Tool["Move"] = 2] = "Move";
    Tool[Tool["Select"] = 3] = "Select";
    Tool[Tool["RulePad"] = 4] = "RulePad";
    Tool[Tool["EdgeAlways"] = 5] = "EdgeAlways";
    Tool[Tool["EdgeIfMatched"] = 6] = "EdgeIfMatched";
    Tool[Tool["EdgeIfNotMatched"] = 7] = "EdgeIfNotMatched";
    Tool[Tool["EdgeParallel"] = 8] = "EdgeParallel";
})(Tool || (Tool = {}));
var Modality;
(function (Modality) {
    Modality[Modality["Real"] = 0] = "Real";
    Modality[Modality["Idea"] = 1] = "Idea";
    Modality[Modality["Future"] = 2] = "Future";
})(Modality || (Modality = {}));
var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Down"] = 2] = "Down";
    Direction[Direction["Up"] = 3] = "Up";
})(Direction || (Direction = {}));
class Rule {
    constructor(index) {
        this.size = 0;
        this.line = new Line();
        this.boundaryEdges = new Set();
        this.boundaryPoints = new Set();
        this.dirtyBoundaries = true;
        this._reachable = false;
        this.index = index;
        this.line.color = Constants.Colors.Grey;
        this.line.lineDash = [7, 3];
    }
    disable() {
        this.line.points.length = 0;
        this.dirtyBoundaries = true;
        this.boundaryEdges.clear();
        this.line.layout.visible = false;
    }
    enable() {
        this.line.layout.visible = true;
    }
    isEnabled() {
        return this.line.layout.visible;
    }
    isReachable() {
        return true;
    }
    setReachable(value) {
        this.line.color = value ? Constants.Colors.Black : Constants.Colors.Grey;
        this._reachable = value;
    }
}
class Edge {
    constructor(obj) {
        this.headRuleIndex = -1;
        this.arrow = new Arrow();
        this.tailRuleIndex = obj.tailRuleIndex;
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
}
var EditType;
(function (EditType) {
    EditType[EditType["NoOpt"] = 0] = "NoOpt";
    EditType[EditType["CellEdit"] = 1] = "CellEdit";
    EditType[EditType["RuleMove"] = 2] = "RuleMove";
})(EditType || (EditType = {}));
class Edit {
    constructor() {
        this.type = EditType.NoOpt;
    }
}
class CellEdit extends Edit {
    constructor(obj) {
        super();
        this.type = EditType.CellEdit;
        this.i = obj.i;
        this.j = obj.j;
        this.cellData = obj.cellData;
    }
}
class RuleMove extends Edit {
    constructor(obj) {
        super();
        this.type = EditType.RuleMove;
        this.deltaI = obj.deltaI;
        this.deltaJ = obj.deltaJ;
        this.ruleIndex = obj.ruleIndex;
    }
}
class Board {
    constructor(gridSize) {
        this.components = [];
        this.editTool = Tool.Pencil;
        this.editModality = Modality.Real;
        this.editBlockType = 0;
        this.isMoving = false;
        this.movingRuleIndex = -1;
        this.movingLastCoordinate = { x: 0, y: 0 };
        this.movingStartCoordinate = { x: 0, y: 0 };
        this.isAddingEdge = false;
        this.edges = new Array();
        this.rules = new Map();
        this.maxRuleIndex = 0;
        this.edits = [];
        this.data = new Array();
        for (let i = 0; i < gridSize.width; ++i) {
            this.data.push(new Array());
            for (let j = 0; j < gridSize.height; ++j) {
                this.data[i].push([-1, -1, -1, -1]);
            }
        }
        let gridLayout = new Layout(0.5, 0.5, 0, 10, 1.0, 20 / 21, -40, -40);
        gridLayout.anchor = { x: 0.5, y: 0.5 * 20 / 21 };
        gridLayout.aspect = gridSize.width / gridSize.height;
        gridLayout.fixedAspect = true;
        let _this = this;
        this.grid = new Grid({ width: gridSize.width, height: gridSize.height }, gridLayout, {
            populate(i, j) {
                return ["", "",];
            },
            onSelect(i, j) {
                _this.onSelect(i, j);
            },
            onMouseDown(i, j, e) {
                _this.onMouseDown(i, j, e);
            },
            onMouseMove(i, j, e) {
                _this.onMouseMove(e);
            },
            onMouseUp(i, j, e) {
                _this.onMouseUp(i, j);
            },
        });
        this.grid.layout.doLayout({
            position: { x: 0, y: 0 },
            size: { width: window.innerWidth, height: window.innerHeight },
        });
    }
    findAdjacentRule(i, j) {
        let rule = -1;
        let count = 0;
        //left
        if (i > 0) {
            let other = this.data[i - 1][j][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //up
        if (j > 0) {
            let other = this.data[i][j - 1][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //right
        if (i < this.grid.gridSize.width - 1) {
            let other = this.data[i + 1][j][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //down
        if (j < this.grid.gridSize.height - 1) {
            let other = this.data[i][j + 1][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //upper left
        if (i > 0 && j > 0) {
            let other = this.data[i - 1][j - 1][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //uper right
        if (i < this.grid.gridSize.width - 1 && j > 0) {
            let other = this.data[i + 1][j - 1][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //lower left
        if (i > 0 && j < this.grid.gridSize.height - 1) {
            let other = this.data[i - 1][j + 1][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        //lower right
        if (i < this.grid.gridSize.width - 1 && j < this.grid.gridSize.height - 1) {
            let other = this.data[i + 1][j + 1][3];
            if (other > -1) {
                count += rule != other ? 1 : 0;
                rule = other;
            }
        }
        return {
            rule: rule,
            count: count,
        };
    }
    hasRule(i, j, ruleIndex) {
        if (i < 0 || j < 0 || i >= this.grid.gridSize.width || j >= this.grid.gridSize.height) {
            return false;
        }
        return this.data[i][j][3] == ruleIndex;
    }
    needsEdgeToRight(rule, i, j) {
        return !this.hasRule(i, j - 1, rule.index)
            && this.hasRule(i, j, rule.index)
            && !rule.boundaryEdges.has(JSON.stringify([i, j, i + 1, j]));
    }
    advanceRight(rule, i, j) {
        if (this.needsEdgeToRight(rule, i, j)) {
            //move right
            rule.line.points.push(this.grid.getPositionForCoordinate(i + 1, j));
            rule.boundaryEdges.add(JSON.stringify([i, j, i + 1, j]));
            return true;
        }
        return false;
    }
    needsEdgeToUp(rule, i, j) {
        return this.hasRule(i, j - 1, rule.index)
            && !this.hasRule(i - 1, j - 1, rule.index)
            && !rule.boundaryEdges.has(JSON.stringify([i, j, i, j - 1]));
    }
    advanceUp(rule, i, j) {
        if (this.needsEdgeToUp(rule, i, j)) {
            //move up
            rule.line.points.push(this.grid.getPositionForCoordinate(i, j - 1));
            rule.boundaryEdges.add(JSON.stringify([i, j, i, j - 1]));
            return true;
        }
        return false;
    }
    needsEdgeToLeft(rule, i, j) {
        return this.hasRule(i - 1, j - 1, rule.index)
            && !this.hasRule(i - 1, j, rule.index)
            && !rule.boundaryEdges.has(JSON.stringify([i, j, i - 1, j]));
    }
    advanceLeft(rule, i, j) {
        if (this.needsEdgeToLeft(rule, i, j)) {
            //move left
            rule.line.points.push(this.grid.getPositionForCoordinate(i - 1, j));
            rule.boundaryEdges.add(JSON.stringify([i, j, i - 1, j]));
            return true;
        }
        return false;
    }
    needsEdgeToDown(rule, i, j) {
        return this.hasRule(i - 1, j, rule.index)
            && !this.hasRule(i, j, rule.index)
            && !rule.boundaryEdges.has(JSON.stringify([i, j, i, j + 1]));
    }
    advanceDown(rule, i, j) {
        if (this.needsEdgeToDown(rule, i, j)) {
            //move down
            rule.line.points.push(this.grid.getPositionForCoordinate(i, j + 1));
            rule.boundaryEdges.add(JSON.stringify([i, j, i, j + 1]));
            return true;
        }
        return false;
    }
    advanceBoundary(direction, rule, i, j) {
        if (direction == Direction.Up || direction == Direction.Left) {
            if (this.advanceDown(rule, i, j)) {
                this.advanceBoundary(Direction.Down, rule, i, j + 1);
            }
            else if (this.advanceLeft(rule, i, j)) {
                this.advanceBoundary(Direction.Left, rule, i - 1, j);
            }
            else if (this.advanceRight(rule, i, j)) {
                this.advanceBoundary(Direction.Right, rule, i + 1, j);
            }
            else if (this.advanceUp(rule, i, j)) {
                this.advanceBoundary(Direction.Up, rule, i, j - 1);
            }
        }
        else {
            if (this.advanceRight(rule, i, j)) {
                this.advanceBoundary(Direction.Right, rule, i + 1, j);
            }
            else if (this.advanceUp(rule, i, j)) {
                this.advanceBoundary(Direction.Up, rule, i, j - 1);
            }
            else if (this.advanceDown(rule, i, j)) {
                this.advanceBoundary(Direction.Down, rule, i, j + 1);
            }
            else if (this.advanceLeft(rule, i, j)) {
                this.advanceBoundary(Direction.Left, rule, i - 1, j);
            }
        }
    }
    calculateBoundaries() {
        this.rules.forEach(function (rule) {
            rule.size = 0;
            if (rule.dirtyBoundaries) {
                rule.boundaryEdges.clear();
                rule.line.points.length = 0;
                rule.dirtyBoundaries = false;
            }
        });
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                let ruleIndex = this.data[i][j][3];
                let rule = this.rules.get(ruleIndex);
                if (rule) {
                    rule.size += 1;
                    if (this.needsEdgeToRight(rule, i, j)) {
                        let pos = this.grid.getPositionForCoordinate(i, j);
                        rule.line.points.push({ x: pos.x, y: pos.y, isMove: true });
                        this.advanceBoundary(Direction.Right, rule, i, j);
                    }
                }
            }
        }
    }
    visitRuleIndex(i, j, countIndex, maskIndex) {
        if (i < 0 || j < 0 || i >= this.grid.gridSize.width || j >= this.grid.gridSize.height) {
            return;
        }
        if (this.data[i][j][3] == countIndex) {
            this.data[i][j][3] = maskIndex;
            this.visitRuleIndex(i - 1, j - 1, countIndex, maskIndex);
            this.visitRuleIndex(i, j - 1, countIndex, maskIndex);
            this.visitRuleIndex(i + 1, j - 1, countIndex, maskIndex);
            this.visitRuleIndex(i - 1, j, countIndex, maskIndex);
            this.visitRuleIndex(i + 1, j, countIndex, maskIndex);
            this.visitRuleIndex(i - 1, j + 1, countIndex, maskIndex);
            this.visitRuleIndex(i, j + 1, countIndex, maskIndex);
            this.visitRuleIndex(i + 1, j + 1, countIndex, maskIndex);
        }
    }
    isConnected(rule) {
        let finished = false;
        let maskIndex = -2;
        for (let i = 0; i < this.grid.gridSize.width && !finished; ++i) {
            for (let j = 0; j < this.grid.gridSize.height && !finished; ++j) {
                let otherIndex = this.data[i][j][3];
                if (otherIndex == rule.index) {
                    finished = true;
                    this.visitRuleIndex(i, j, rule.index, maskIndex);
                }
            }
        }
        //count
        let count = 0;
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                let otherIndex = this.data[i][j][3];
                if (otherIndex == maskIndex) {
                    count += 1;
                    this.data[i][j][3] = rule.index;
                }
            }
        }
        return rule.size == count;
    }
    doesntBlockRuleIndex(ruleIndex, i, j) {
        return !this.grid.isValidCoordinate(i, j)
            || this.data[i][j][3] == ruleIndex
            || this.data[i][j][3] == -1;
    }
    canHaveRuleIndex(ruleIndex, i, j) {
        return this.grid.isValidCoordinate(i, j)
            && this.data[i][j][0] < 0
            && this.doesntBlockRuleIndex(ruleIndex, i - 1, j - 1)
            && this.doesntBlockRuleIndex(ruleIndex, i - 0, j - 1)
            && this.doesntBlockRuleIndex(ruleIndex, i + 1, j - 1)
            && this.doesntBlockRuleIndex(ruleIndex, i - 1, j + 0)
            && this.doesntBlockRuleIndex(ruleIndex, i - 0, j + 0)
            && this.doesntBlockRuleIndex(ruleIndex, i + 1, j + 0)
            && this.doesntBlockRuleIndex(ruleIndex, i - 1, j + 1)
            && this.doesntBlockRuleIndex(ruleIndex, i - 0, j + 1)
            && this.doesntBlockRuleIndex(ruleIndex, i + 1, j + 1);
    }
    canMoveRuleIndex(ruleIndex, deltaI, deltaJ) {
        let ret = true;
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                let otherIndex = this.data[i][j][3];
                if (otherIndex == ruleIndex) {
                    ret = ret && this.canHaveRuleIndex(ruleIndex, i + deltaI, j + deltaJ);
                }
            }
        }
        return ret;
    }
    doMoveRuleIndex(ruleIndex, deltaI, deltaJ) {
        if (deltaI <= 0 && deltaJ <= 0) {
            for (let i = 0; i < this.grid.gridSize.width; ++i) {
                for (let j = 0; j < this.grid.gridSize.height; ++j) {
                    let otherIndex = this.data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ);
                    }
                }
            }
        }
        else if (deltaI >= 0 && deltaJ >= 0) {
            for (let i = this.grid.gridSize.width - 1; i >= 0; --i) {
                for (let j = this.grid.gridSize.height - 1; j >= 0; --j) {
                    let otherIndex = this.data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ);
                    }
                }
            }
        }
        else if (deltaI <= 0 && deltaJ >= 0) {
            for (let i = 0; i < this.grid.gridSize.width; ++i) {
                for (let j = this.grid.gridSize.height - 1; j >= 0; --j) {
                    let otherIndex = this.data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ);
                    }
                }
            }
        }
        else if (deltaI >= 0 && deltaJ <= 0) {
            for (let i = this.grid.gridSize.width - 1; i >= 0; --i) {
                for (let j = this.grid.gridSize.height - 1; j >= 0; --j) {
                    let otherIndex = this.data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ);
                    }
                }
            }
        }
    }
    canDrawRule(i, j) {
        return this.findAdjacentRule(i, j).count <= 1;
    }
    rulePad(i, j) {
        let realType = this.data[i][j][0];
        let rulePad = this.data[i][j][3];
        if (rulePad <= -1 && realType <= -1) {
            let adjacencies = this.findAdjacentRule(i, j);
            if (adjacencies.count > 1) {
                //TODO: can't join rules
                return -1;
            }
            let newRulePad = adjacencies.rule;
            if (newRulePad >= 0 && newRulePad < InputState.__Length) {
                //error, can't extend rule for input states
                return -1;
            }
            if (newRulePad <= -1) {
                newRulePad = this.maxRuleIndex;
                this.maxRuleIndex += 1;
                let rule = new Rule(newRulePad);
                this.components.push(rule.line);
                this.rules.set(newRulePad, rule);
            }
            console.log("rulePad", newRulePad, adjacencies.count);
            this.edits.push(new CellEdit({
                i: i,
                j: j,
                cellData: this.data[i][j].slice(0),
            }));
            this.setCell(i, j, this.data[i][j][0], this.data[i][j][1], this.data[i][j][2], newRulePad);
            let rule = this.rules.get(newRulePad);
            if (rule) {
                rule.dirtyBoundaries = true;
                this.calculateBoundaries();
                this.respositionEdgesForRule(rule);
            }
            return newRulePad;
        }
        return rulePad;
    }
    debugRules() {
        let output = "";
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            output += "\n";
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                output += this.data[i][j][3] + " ";
            }
        }
        console.log("Rules:", output);
    }
    erase(i, j) {
        let ruleIndex = this.data[i][j][3];
        if (ruleIndex >= 0 && ruleIndex < InputState.__Length) {
            //error, can't input state rules
            return;
        }
        if (this.data[i][j][0] != -1
            || this.data[i][j][1] != -1
            || this.data[i][j][2] != -1
            || this.data[i][j][3] != -1) {
            this.edits.push(new CellEdit({
                i: i,
                j: j,
                cellData: this.data[i][j].slice(0),
            }));
        }
        let rule = this.rules.get(ruleIndex);
        //update model
        this.data[i][j][0] = -1;
        this.data[i][j][1] = -1;
        this.data[i][j][2] = -1;
        this.data[i][j][3] = -1;
        //update view
        this.grid.grid[i][j][0] = "";
        this.grid.grid[i][j][1] = "";
        if (rule) {
            rule.dirtyBoundaries = true;
            this.calculateBoundaries();
            if (rule.size == 0) {
                rule.disable();
            }
            else if (!this.isConnected(rule)) {
                this.undo();
            }
            if (rule.isEnabled()) {
                this.respositionEdgesForRule(rule);
            }
            else {
                this.disableEdgesForRule(rule);
                this.calculateReachability();
            }
        }
    }
    pencil(i, j) {
        let editModality = this.editModality;
        let editBlockType = this.editBlockType;
        let realType = this.data[i][j][0];
        let ideaType = this.data[i][j][1];
        let futureType = this.data[i][j][2];
        let rulePad = this.data[i][j][3];
        //assert !(realType > -1 && (futureType > -1 || ideaType > -1))
        //assert !hasRulePad || (ideaType == -1 && futureType == -1)
        let newRealType = realType;
        let newIdeaType = ideaType;
        let newFutureType = futureType;
        let newRulePad = rulePad;
        if (rulePad >= 0 && rulePad < InputState.__Length) {
            //error, can't change input state rules
            return;
        }
        else if (editModality != Modality.Real && !this.canDrawRule(i, j)) {
            //error
            return;
        }
        else if (rulePad > -1 && editModality == Modality.Real) {
            //error
            return;
        }
        else if (editModality == Modality.Real && realType == editBlockType) {
            //erase
            newRealType = -1;
        }
        else if (editModality == Modality.Idea && ideaType == editBlockType) {
            //erase
            newIdeaType = -1;
        }
        else if (editModality == Modality.Future && futureType == editBlockType) {
            //erase
            newFutureType = -1;
        }
        else if (editModality == Modality.Real) {
            newRealType = editBlockType;
        }
        else if (editModality == Modality.Idea) {
            newIdeaType = editBlockType;
            newRulePad = this.rulePad(i, j);
        }
        else if (editModality == Modality.Future) {
            newFutureType = editBlockType;
            newRulePad = this.rulePad(i, j);
        }
        this.edits.push(new CellEdit({
            i: i,
            j: j,
            cellData: this.data[i][j].slice(0),
        }));
        this.setCell(i, j, newRealType, newIdeaType, newFutureType, newRulePad);
    }
    undoCellEdit(cellEdit) {
        let currentRuleIndex = this.data[cellEdit.i][cellEdit.j][3];
        let ruleChanged = cellEdit.cellData[3] != currentRuleIndex;
        this.setCell(cellEdit.i, cellEdit.j, cellEdit.cellData[0], cellEdit.cellData[1], cellEdit.cellData[2], cellEdit.cellData[3]);
        if (ruleChanged) {
            let rule = this.rules.get(cellEdit.cellData[3]) || this.rules.get(currentRuleIndex);
            if (rule) {
                rule.dirtyBoundaries = true;
                this.calculateBoundaries();
                if (rule.size == 0) {
                    rule.disable();
                }
                else {
                    rule.enable();
                }
            }
        }
    }
    undoRuleMove(ruleMove) {
        this.doMoveRuleIndex(ruleMove.ruleIndex, ruleMove.deltaI, ruleMove.deltaJ);
        let rule = this.rules.get(ruleMove.ruleIndex);
        if (rule) {
            rule.dirtyBoundaries = true;
            this.calculateBoundaries();
            this.respositionEdgesForRule(rule);
        }
    }
    undo() {
        if (this.edits.length == 0) {
            return;
        }
        let edit = this.edits.pop();
        if (edit) {
            switch (edit.type) {
                case EditType.NoOpt: {
                    break;
                }
                case EditType.CellEdit: {
                    let cellEdit = edit;
                    this.undoCellEdit(cellEdit);
                    break;
                }
                case EditType.RuleMove: {
                    let ruleMove = edit;
                    this.undoRuleMove(ruleMove);
                    break;
                }
            }
        }
    }
    setCell(i, j, realType, ideaType, futureType, rulePad) {
        this.data[i][j][0] = realType;
        this.data[i][j][1] = ideaType;
        this.data[i][j][2] = futureType;
        this.data[i][j][3] = rulePad;
        //set grid cell path
        if (rulePad >= 0 && rulePad < InputState.__Length) {
            this.grid.grid[i][j][0] = ImagePaths.InputState[InputState[rulePad]];
            this.grid.grid[i][j][1] = "";
        }
        else if (realType > -1) {
            this.grid.grid[i][j][0] = ImagePaths.Reals[realType];
        }
        else if (ideaType > -1 && futureType > -1) {
            this.grid.grid[i][j][0] = ImagePaths.Ideas[ideaType];
            this.grid.grid[i][j][1] = ImagePaths.Futures[futureType];
        }
        else if (ideaType > -1) {
            this.grid.grid[i][j][0] = "";
            this.grid.grid[i][j][1] = ImagePaths.Ideas[ideaType];
        }
        else if (futureType > -1) {
            this.grid.grid[i][j][0] = ImagePaths.Futures[futureType];
            this.grid.grid[i][j][1] = "";
        }
        else {
            this.grid.grid[i][j][0] = "";
            this.grid.grid[i][j][1] = "";
        }
    }
    swapCells(i1, j1, i2, j2) {
        let temp0 = this.data[i1][j1][0];
        let temp1 = this.data[i1][j1][1];
        let temp2 = this.data[i1][j1][2];
        let temp3 = this.data[i1][j1][3];
        this.setCell(i1, j1, this.data[i2][j2][0], this.data[i2][j2][1], this.data[i2][j2][2], this.data[i2][j2][3]);
        this.setCell(i2, j2, temp0, temp1, temp2, temp3);
    }
    onSelect(i, j) {
        switch (this.editTool) {
            case Tool.Pencil: {
                this.pencil(i, j);
                break;
            }
            case Tool.Eraser: {
                this.erase(i, j);
                break;
            }
            case Tool.RulePad: {
                this.rulePad(i, j);
                break;
            }
            default: {
                break;
            }
        }
    }
    onMouseDown(i, j, e) {
        switch (this.editTool) {
            case Tool.Move: {
                let ruleIndex = this.data[i][j][3];
                if (ruleIndex > -1) {
                    this.isMoving = true;
                    this.movingRuleIndex = ruleIndex;
                    this.movingStartCoordinate.x = i;
                    this.movingStartCoordinate.y = j;
                    this.movingLastCoordinate.x = i;
                    this.movingLastCoordinate.y = j;
                }
                break;
            }
            case Tool.EdgeAlways: {
                let ruleIndex = this.data[i][j][3];
                let rule = this.rules.get(ruleIndex);
                if (ruleIndex > -1 && rule) {
                    this.isAddingEdge = true;
                    let edge = new Edge({ tailRuleIndex: ruleIndex });
                    edge.arrow.to.x = e.clientX;
                    edge.arrow.to.y = e.clientY;
                    edge.arrow.from = edge.findClosestPoint(edge.arrow.to, rule, this.grid);
                    this.edge = edge;
                    this.components.push(edge.arrow);
                }
                break;
            }
            default: {
                break;
            }
        }
    }
    onMouseMove(e) {
        if (this.isMoving) {
            let currentI = this.grid.getCoordinateForXPosition(e.clientX);
            let currentJ = this.grid.getCoordinateForYPosition(e.clientY);
            let deltaI = currentI - this.movingLastCoordinate.x;
            let deltaJ = currentJ - this.movingLastCoordinate.y;
            if (deltaI == 0 && deltaJ == 0) {
                //do nothing
            }
            else if (this.canMoveRuleIndex(this.movingRuleIndex, deltaI, deltaJ)) {
                this.doMoveRuleIndex(this.movingRuleIndex, deltaI, deltaJ);
                this.movingLastCoordinate.x = currentI;
                this.movingLastCoordinate.y = currentJ;
                let rule = this.rules.get(this.movingRuleIndex);
                if (rule) {
                    rule.dirtyBoundaries = true;
                    this.calculateBoundaries();
                    this.respositionEdgesForRule(rule);
                }
            }
            else {
                //error, can't move rule here
            }
        }
        else if (this.isAddingEdge) {
            if (this.edge) {
                let rule = this.rules.get(this.edge.tailRuleIndex);
                if (rule) {
                    this.edge.arrow.to.x = e.clientX;
                    this.edge.arrow.to.y = e.clientY;
                    this.edge.arrow.from = this.edge.findClosestPoint(this.edge.arrow.to, rule, this.grid);
                }
            }
        }
    }
    disableEdgesForRule(rule) {
        for (let edge of this.edges) {
            if (edge.tailRuleIndex == rule.index
                || edge.headRuleIndex == rule.index) {
                edge.disable();
            }
        }
    }
    respositionEdgesForRule(rule) {
        for (let edge of this.edges) {
            //TODO recalculate both arrow from and to if either tail or head index matches
            if (edge.tailRuleIndex == rule.index) {
                edge.arrow.from = edge.findClosestPoint(edge.arrow.to, rule, this.grid);
                let other = this.rules.get(edge.headRuleIndex);
                if (other) {
                    edge.arrow.to = edge.findClosestPoint(edge.arrow.from, other, this.grid);
                }
            }
            if (edge.headRuleIndex == rule.index) {
                edge.arrow.to = edge.findClosestPoint(edge.arrow.from, rule, this.grid);
                let other = this.rules.get(edge.tailRuleIndex);
                if (other) {
                    edge.arrow.from = edge.findClosestPoint(edge.arrow.to, other, this.grid);
                }
            }
        }
    }
    isRuleGraphCyclic_VisitRule(rule, visited, recStack) {
        visited[rule.index] = true;
        recStack[rule.index] = true;
        for (let edge of this.edges) {
            if (edge.headRuleIndex == rule.index) {
                let neighbor = this.rules.get(edge.tailRuleIndex);
                if (neighbor) {
                    if (!visited[neighbor.index]) {
                        if (this.isRuleGraphCyclic_VisitRule(neighbor, visited, recStack)) {
                            return true;
                        }
                    }
                    else if (recStack[neighbor.index]) {
                        return true;
                    }
                }
            }
        }
        recStack[rule.index] = false;
        return false;
    }
    isRuleGraphCyclic() {
        let visited = new Array(this.maxRuleIndex).fill(false);
        let recStack = new Array(this.maxRuleIndex).fill(false);
        for (let element of this.rules) {
            let rule = element[1];
            if (rule.isEnabled() && !visited[rule.index]) {
                if (this.isRuleGraphCyclic_VisitRule(rule, visited, recStack)) {
                    return true;
                }
            }
        }
        return false;
    }
    calculateReachability() {
        let visited = new Array(this.maxRuleIndex).fill(false);
        let shouldVisit = [];
        for (let element of this.rules) {
            let rule = element[1];
            if (rule.index < InputState.__Length && rule.index >= 0) {
                shouldVisit.push(rule);
            }
        }
        while (shouldVisit.length > 0) {
            let rule = shouldVisit.pop();
            if (rule) {
                visited[rule.index] = true;
                for (let edge of this.edges) {
                    if (edge.tailRuleIndex == rule.index) {
                        let neighbor = this.rules.get(edge.headRuleIndex);
                        if (neighbor && !visited[neighbor.index]) {
                            shouldVisit.push(neighbor);
                        }
                    }
                }
            }
        }
        for (let i = 0; i < visited.length; ++i) {
            let rule = this.rules.get(i);
            if (rule) {
                rule.setReachable(visited[i]);
            }
        }
    }
    canConnect(edge, rule) {
        for (let other of this.edges) {
            if (other.tailRuleIndex == edge.tailRuleIndex
                && other.headRuleIndex == rule.index) {
                //error: Any two rules can only connected by a single side
                return false;
            }
        }
        return true;
    }
    onMouseUp(i, j) {
        if (this.isMoving) {
            let deltaI = this.movingLastCoordinate.x - this.movingStartCoordinate.x;
            let deltaJ = this.movingLastCoordinate.y - this.movingStartCoordinate.y;
            if (deltaI != 0 || deltaJ != 0) {
                this.edits.push(new RuleMove({
                    deltaI: -deltaI,
                    deltaJ: -deltaJ,
                    ruleIndex: this.movingRuleIndex,
                }));
            }
            this.isMoving = false;
            this.movingRuleIndex = -1;
            this.movingStartCoordinate.x = 0;
            this.movingStartCoordinate.y = 0;
            this.movingLastCoordinate.x = 0;
            this.movingLastCoordinate.y = 0;
        }
        else if (this.isAddingEdge) {
            this.isAddingEdge = false;
            if (this.edge) {
                let ruleIndex = this.data[i][j][3];
                let rule = this.rules.get(ruleIndex);
                if (ruleIndex > -1
                    && rule
                    && this.canConnect(this.edge, rule)) {
                    this.edge.arrow.to = this.edge.findClosestPoint(this.edge.arrow.from, rule, this.grid);
                    this.edge.headRuleIndex = ruleIndex;
                    this.edges.push(this.edge);
                    if (this.isRuleGraphCyclic()) {
                        //error: Edge makes rules graph cyclic
                        this.edge.disable();
                    }
                    else {
                        this.calculateReachability();
                    }
                }
                else {
                    this.edge.disable();
                }
            }
        }
    }
    setupInputStates() {
        this.rulePad(1, 1);
        this.grid.grid[1][1][0] = ImagePaths.InputState["Computer"];
        this.edits.pop();
        this.rulePad(1, 3);
        this.grid.grid[1][3][0] = ImagePaths.InputState["Left"];
        this.edits.pop();
        this.rulePad(1, 5);
        this.grid.grid[1][5][0] = ImagePaths.InputState["Right"];
        this.edits.pop();
        this.rulePad(1, 7);
        this.grid.grid[1][7][0] = ImagePaths.InputState["Up"];
        this.edits.pop();
        this.rulePad(1, 9);
        this.grid.grid[1][9][0] = ImagePaths.InputState["Down"];
        this.edits.pop();
        this.calculateReachability();
        this.debugRules();
    }
}
class Playbilder {
    constructor(container, boardSize) {
        let board = new Board(boardSize);
        let tileSize = board.grid.computeTileSize();
        board.grid.tileSize = tileSize;
        let paletteLayout = new Layout(0, 0, -20, tileSize, 0, 0, tileSize * 3, tileSize * 12);
        let selectedRectLayout = new Layout(0, 0, 0, 0, 0, 0, tileSize, tileSize);
        let selectedRect = new Rectangle(selectedRectLayout);
        let selectedCoord = { i: 0, j: 0 };
        let toolRectLayout = new Layout(0, 0, 0, 0, 0, 0, tileSize, tileSize);
        let toolRect = new Rectangle(toolRectLayout);
        let toolCoord = { i: 0, j: 0 };
        function setToolFromToolbar(i, j) {
            board.editTool = i;
            toolRect.layout.offset.position.x = i * tileSize;
            toolRect.layout.offset.position.y = j * tileSize;
            toolRect.layout.doLayout(toolbarLayout.computed);
            toolCoord = { i: i, j: j };
            selectedRect.layout.visible = board.editTool == Tool.Pencil;
        }
        function setSelectedFromPalette(i, j) {
            setToolFromToolbar(0, 0);
            board.editModality = i;
            board.editBlockType = j;
            selectedRect.layout.offset.position.x = i * tileSize;
            selectedRect.layout.offset.position.y = j * tileSize;
            selectedRect.layout.doLayout(paletteLayout.computed);
            selectedCoord = { i: i, j: j };
        }
        paletteLayout.anchor = { x: 1.0, y: 0.0 };
        let palette = new Grid({ width: 3, height: 12 }, paletteLayout, {
            populate(i, j) {
                if (i == 0) {
                    return [ImagePaths.Reals[j]];
                }
                else if (i == 1) {
                    return [ImagePaths.Ideas[j]];
                }
                else {
                    return [ImagePaths.Futures[j]];
                }
            },
            onClick(i, j) {
                setSelectedFromPalette(i, j);
            },
        });
        palette.children = [];
        palette.children.push(selectedRect);
        for (let i = 0; i < 10; ++i) {
            let labelLayout = new Layout(0, 0, -20, i * tileSize + 20, 0, 0, tileSize, tileSize);
            let label = new TextLabel(labelLayout, i.toString());
            palette.children.push(label);
        }
        for (let i = 0; i < 3; ++i) {
            let text = "";
            if (i == 0) {
                text = "b";
            }
            else if (i == 1) {
                text = "i";
            }
            else if (i == 2) {
                text = "f";
            }
            let labelLayout = new Layout(0, 0, (i + 0.5) * tileSize, -5, 0, 0, tileSize, tileSize);
            let label = new TextLabel(labelLayout, text);
            palette.children.push(label);
        }
        const tools = [
            ["Pencil"], ["Eraser"], ["Move"],
            ["Select"], ["RulePad"], ["EdgeAlways"],
            ["EdgeIfMatched"], ["EdgeIfNotMatched"], ["EdgeParallel"],
        ];
        let toolbarLayout = new Layout(0, 0, 0, -20, 0, 0, tileSize * 9, tileSize * 1);
        toolbarLayout.anchor = { x: 0.0, y: 1.0 };
        let toolbar = new Grid({ width: 9, height: 1 }, toolbarLayout, {
            populate(i, j) {
                return [ImagePaths.Tools[tools[i][j]]];
            },
            onClick(i, j) {
                setToolFromToolbar(i, j);
            },
        });
        toolbar.children = [];
        toolbar.children.push(toolRect);
        this.game = new Game(container, {
            onKeyDown(e) {
                console.log("onKeyDown", e.key, e.ctrlKey, e.metaKey);
                let asNumber = parseInt(e.key);
                if (!isNaN(asNumber)) {
                    setSelectedFromPalette(selectedCoord.i, asNumber);
                }
                else if (e.key == "b") {
                    setSelectedFromPalette(0, selectedCoord.j);
                }
                else if (e.key == "i") {
                    setSelectedFromPalette(1, selectedCoord.j);
                }
                else if (e.key == "f") {
                    setSelectedFromPalette(2, selectedCoord.j);
                }
                else if ((e.ctrlKey || e.metaKey) && e.key == "z") {
                    board.undo();
                }
            }
        });
        this.game.components.push(board.grid);
        board.grid.children = [];
        board.grid.children.push(palette);
        board.grid.children.push(toolbar);
        this.game.doLayout();
        board.components = this.game.components;
        board.setupInputStates();
    }
}
var $container = document.getElementById('container');
var $playBilder = new Playbilder($container, { width: 20, height: 20 });
$playBilder.game.start();
//# sourceMappingURL=game.js.map