"use strict";
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
var Rotate;
(function (Rotate) {
    Rotate[Rotate["Rotate_90"] = 0] = "Rotate_90";
    Rotate[Rotate["Rotate_180"] = 1] = "Rotate_180";
    Rotate[Rotate["Rotate_270"] = 2] = "Rotate_270";
})(Rotate || (Rotate = {}));
class PlayRule {
    constructor(index, isStartSymbol, incomingEdgeType) {
        this.children = [];
        this.rotations = [];
        this.isStartSymbol = false;
        this.size = { width: 0, height: 0 };
        this.data = new Array();
        this.index = index;
        this.isStartSymbol = isStartSymbol;
        this.incomingEdgeType = incomingEdgeType;
    }
    apply(boardData, boardBuffer, gridSize, startI, startJ) {
        for (let i = 0; i < this.size.width; ++i) {
            for (let j = 0; j < this.size.height; ++j) {
                let boardI = startI + i;
                let boardJ = startJ + j;
                let currentType = this.data[i][j][1];
                let nextType = this.data[i][j][2];
                if (nextType == -2) {
                    continue;
                }
                boardBuffer[boardI][boardJ][0] = nextType;
                if (currentType != nextType) {
                    boardData[boardI][boardJ][0] = -2;
                }
            }
        }
    }
    match(boardData, boardBuffer, gridSize, startI, startJ) {
        if (startI + this.size.width > gridSize.width
            || startJ + this.size.height > gridSize.height) {
            return false;
        }
        let matched = true;
        for (let i = 0; i < this.size.width && matched; ++i) {
            for (let j = 0; j < this.size.height && matched; ++j) {
                let boardI = startI + i;
                let boardJ = startJ + j;
                let ruleIdeaType = this.data[i][j][1];
                let boardRealType = boardData[boardI][boardJ][0];
                matched = matched && (ruleIdeaType == -2 || ruleIdeaType == boardRealType);
            }
        }
        return matched;
    }
    process(boardData, boardBuffer, gridSize) {
        let didMatch = false;
        if (!this.isStartSymbol) {
            for (let i = 0; i < gridSize.width; ++i) {
                for (let j = 0; j < gridSize.height; ++j) {
                    if (this.match(boardData, boardBuffer, gridSize, i, j)) {
                        this.apply(boardData, boardBuffer, gridSize, i, j);
                        didMatch = true;
                    }
                }
            }
        }
        for (let rotation of this.rotations) {
            rotation.process(boardData, boardBuffer, gridSize);
        }
        shuffle(this.children);
        for (let child of this.children) {
            if ((child.incomingEdgeType == EdgeType.IfMatched && didMatch)
                || (child.incomingEdgeType == EdgeType.IfNotMatched && !didMatch)
                || (child.incomingEdgeType == EdgeType.Always)
                || (child.incomingEdgeType == EdgeType.Parallel)) {
                child.process(boardData, boardBuffer, gridSize);
            }
        }
    }
    static getEditRuleBoundingBox(index, data, gridSize) {
        let minPosition = { x: gridSize.width, y: gridSize.height };
        let maxPosition = { x: -1, y: -1 };
        for (let i = 0; i < gridSize.width; ++i) {
            for (let j = 0; j < gridSize.height; ++j) {
                let otherIndex = data[i][j][3];
                if (otherIndex == index) {
                    minPosition.x = Math.min(minPosition.x, i);
                    minPosition.y = Math.min(minPosition.y, j);
                    maxPosition.x = Math.max(maxPosition.x, i);
                    maxPosition.y = Math.max(maxPosition.y, j);
                }
            }
        }
        return {
            position: {
                x: minPosition.x,
                y: minPosition.y,
            },
            size: {
                width: maxPosition.x - minPosition.x + 1,
                height: maxPosition.y - minPosition.y + 1,
            },
        };
    }
    static fromBoardData(editRule, data, gridSize, isStartSymbol, incomingEdgeType) {
        let playRule = new PlayRule(editRule.index, isStartSymbol, incomingEdgeType);
        let box = this.getEditRuleBoundingBox(playRule.index, data, gridSize);
        playRule.size = box.size;
        console.log("BoundingBox:", box);
        for (let i = 0; i < box.size.width; ++i) {
            playRule.data.push(new Array());
            for (let j = 0; j < box.size.height; ++j) {
                let tuple = data[box.position.x + i][box.position.y + j];
                let ideaType = tuple[3] == playRule.index ? tuple[1] : -2;
                let futureType = tuple[3] == playRule.index ? tuple[2] : -2;
                playRule.data[i].push([
                    -1,
                    ideaType,
                    futureType,
                    -1,
                ]);
            }
        }
        if (editRule.includeRotations) {
            let playRule90 = this.createRotation270(playRule);
            let playRule180 = this.createRotation270(playRule90);
            let playRule270 = this.createRotation270(playRule180);
            playRule.rotations = [playRule90, playRule180, playRule270];
        }
        return playRule;
    }
    /*
    
    1, 2, 3
    4, 5, 6
    7, 8, 9
    
    Swap columns and rows:
    1, 4, 7
    2, 5, 8
    3, 6, 9
    
    Vertical reflection:
    3, 6, 9
    2, 5, 8
    1, 4, 7
    
    Horizontal reflection:
    7, 4, 1
    8, 5, 2
    9, 6, 3
    
    180 degree rotation, don't swap column and rows, reflect both horizontal and vertical:
    9, 8, 7
    6, 5, 4
    3, 2, 1
    
    */
    static createRotation90(other) {
        let playRule = new PlayRule(other.index, other.isStartSymbol, other.incomingEdgeType);
        playRule.size = {
            width: other.size.height,
            height: other.size.width
        };
        for (let j = 0; j < other.size.height; ++j) {
            playRule.data.push(new Array());
            for (let i = 0; i < other.size.width; ++i) {
                playRule.data[j].push([-1, -1, -1, -1]);
            }
        }
        for (let j = 0; j < other.size.height; ++j) {
            for (let i = 0; i < other.size.width; ++i) {
                playRule.data[other.size.height - j - 1][i] = other.data[i][j].slice(0);
            }
        }
        return playRule;
    }
    static createRotation180(other) {
        let playRule = new PlayRule(other.index, other.isStartSymbol, other.incomingEdgeType);
        playRule.size = {
            width: other.size.width,
            height: other.size.height
        };
        for (let i = 0; i < other.size.width; ++i) {
            playRule.data.push(new Array());
            for (let j = 0; j < other.size.height; ++j) {
                playRule.data[i].push([-1, -1, -1, -1]);
            }
        }
        for (let j = 0; j < other.size.height; ++j) {
            for (let i = 0; i < other.size.width; ++i) {
                playRule.data[other.size.width - i - 1][other.size.height - j - 1] = other.data[i][j].slice(0);
            }
        }
        return playRule;
    }
    static createRotation270(other) {
        let playRule = new PlayRule(other.index, other.isStartSymbol, other.incomingEdgeType);
        playRule.size = {
            width: other.size.height,
            height: other.size.width
        };
        for (let j = 0; j < other.size.height; ++j) {
            playRule.data.push(new Array());
            for (let i = 0; i < other.size.width; ++i) {
                playRule.data[j].push([-1, -1, -1, -1]);
            }
        }
        for (let j = 0; j < other.size.height; ++j) {
            for (let i = 0; i < other.size.width; ++i) {
                playRule.data[j][other.size.width - i - 1] = other.data[i][j].slice(0);
            }
        }
        return playRule;
    }
}
class PlayTree {
    constructor(rootEditRule, edges, editRules, data, gridSize) {
        //this.root = new PlayRule(rootEditRule, data, gridSize, true);
        this.root = PlayRule.fromBoardData(rootEditRule, data, gridSize, true, EdgeType.None);
        this.addChildren(this.root, edges, editRules, data, gridSize);
    }
    addChildren(parent, edges, editRules, data, gridSize) {
        for (let edge of edges) {
            if (edge.isEnabled() && edge.tailRuleIndex == parent.index) {
                let childEditRule = editRules.get(edge.headRuleIndex);
                if (childEditRule) {
                    //let childPlayRule = new PlayRule(childEditRule, data, gridSize, false);
                    let childPlayRule = PlayRule.fromBoardData(childEditRule, data, gridSize, false, edge.type);
                    parent.children.push(childPlayRule);
                    this.addChildren(childPlayRule, edges, editRules, data, gridSize);
                }
            }
        }
    }
    static addRotatedTree90(from, to) {
        for (let child of from.children) {
            let rotated = PlayRule.createRotation90(child);
            to.children.push(rotated);
            this.addRotatedTree90(child, rotated);
        }
    }
    static addRotatedTree180(from, to) {
        for (let child of from.children) {
            let rotated = PlayRule.createRotation180(child);
            to.children.push(rotated);
            this.addRotatedTree180(child, rotated);
        }
    }
    static addRotatedTree270(from, to) {
        for (let child of from.children) {
            let rotated = PlayRule.createRotation270(child);
            to.children.push(rotated);
            this.addRotatedTree270(child, rotated);
        }
    }
}
class PlayBoard {
    constructor(edges, editRules, data, gridSize, interval) {
        this.lastTimeStep = 0;
        this.gameStepInterval = interval;
        let computerEditRule = editRules.get(InputState.Computer);
        //asser computerEditRule is not undefined
        this.gameStepPlayTree = new PlayTree(computerEditRule, edges, editRules, data, gridSize);
        let leftEditRule = editRules.get(InputState.Left);
        //assert leftEditRule is not undefined
        this.leftPlayTree = new PlayTree(leftEditRule, edges, editRules, data, gridSize);
        let rightEditRule = editRules.get(InputState.Right);
        //assert rightEditRule is not undefined
        this.rightPlayTree = new PlayTree(rightEditRule, edges, editRules, data, gridSize);
        let upEditRule = editRules.get(InputState.Up);
        //assert upEditRule is not undefined
        this.upPlayTree = new PlayTree(upEditRule, edges, editRules, data, gridSize);
        let downEditRule = editRules.get(InputState.Down);
        //assert downEditRule is not undefined
        this.downPlayTree = new PlayTree(downEditRule, edges, editRules, data, gridSize);
        if (leftEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.leftPlayTree.root, this.upPlayTree.root);
            PlayTree.addRotatedTree180(this.leftPlayTree.root, this.rightPlayTree.root);
            PlayTree.addRotatedTree270(this.leftPlayTree.root, this.downPlayTree.root);
        }
        if (rightEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.rightPlayTree.root, this.downPlayTree.root);
            PlayTree.addRotatedTree180(this.rightPlayTree.root, this.leftPlayTree.root);
            PlayTree.addRotatedTree270(this.rightPlayTree.root, this.upPlayTree.root);
        }
        if (downEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.downPlayTree.root, this.leftPlayTree.root);
            PlayTree.addRotatedTree180(this.downPlayTree.root, this.upPlayTree.root);
            PlayTree.addRotatedTree270(this.downPlayTree.root, this.rightPlayTree.root);
        }
        if (upEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.upPlayTree.root, this.rightPlayTree.root);
            PlayTree.addRotatedTree180(this.upPlayTree.root, this.downPlayTree.root);
            PlayTree.addRotatedTree270(this.upPlayTree.root, this.leftPlayTree.root);
        }
    }
    onUpdate(timeMS, boardData, boardBuffer, gridSize) {
        let delta = timeMS - this.lastTimeStep;
        if (delta >= this.gameStepInterval) {
            this.lastTimeStep = timeMS;
            this.gameStepPlayTree.root.process(boardData, boardBuffer, gridSize);
            return true;
        }
        return false;
    }
    onKeyDown(e, boardData, boardBuffer, gridSize) {
        if (e.keyCode == 38 || e.key == 'w') {
            this.onUp(boardData, boardBuffer, gridSize);
            return true;
        }
        else if (e.keyCode == 40 || e.key == 's') {
            this.onDown(boardData, boardBuffer, gridSize);
            return true;
        }
        else if (e.keyCode == 37 || e.key == 'a') {
            this.onLeft(boardData, boardBuffer, gridSize);
            return true;
        }
        else if (e.keyCode == 39 || e.key == 'd') {
            this.onRight(boardData, boardBuffer, gridSize);
            return true;
        }
        return false;
    }
    onRight(boardData, boardBuffer, gridSize) {
        console.log("onRight");
        this.rightPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
    onLeft(boardData, boardBuffer, gridSize) {
        console.log("onLeft");
        this.leftPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
    onUp(boardData, boardBuffer, gridSize) {
        console.log("onUp");
        this.upPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
    onDown(boardData, boardBuffer, gridSize) {
        console.log("onDown");
        this.downPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
}
var BoardState;
(function (BoardState) {
    BoardState[BoardState["Play"] = 0] = "Play";
    BoardState[BoardState["Edit"] = 1] = "Edit";
})(BoardState || (BoardState = {}));
;
class Board {
    constructor(gridSize, screenSize) {
        this.gameStepInterval = 500;
        this.needsLayout = false;
        this.state = BoardState.Edit;
        let _this = this;
        this.gameSettingsGui = new GameSettingsGUI(gridSize, {
            onIntervalChanged(interval) {
                console.log("New interval:", interval);
                _this.gameStepInterval = interval;
            },
            onWidthChanged(width) {
                if (_this.grid && _this.grid.gridSize.width != width) {
                    let newSize = {
                        width: width,
                        height: _this.grid.gridSize.height,
                    };
                    _this.resizeGrid(newSize);
                }
            },
            onHeightChanged(height) {
                if (_this.grid && _this.grid.gridSize.height != height) {
                    let newSize = {
                        width: _this.grid.gridSize.width,
                        height: height,
                    };
                    _this.resizeGrid(newSize);
                }
            },
        });
        this.editBoard = new EditBoard({
            onObjectSelected() {
                _this.gameSettingsGui.hide();
            },
            onObjectUnselected() {
                _this.gameSettingsGui.show();
            }
        });
        this.saved = new Array();
        for (let i = 0; i < gridSize.width; ++i) {
            this.saved.push(new Array());
            for (let j = 0; j < gridSize.height; ++j) {
                this.saved[i].push([-1, -1, -1, -1]);
            }
        }
        this.data = new Array();
        for (let i = 0; i < gridSize.width; ++i) {
            this.data.push(new Array());
            for (let j = 0; j < gridSize.height; ++j) {
                this.data[i].push([-1, -1, -1, -1]);
            }
        }
        this.buffer = new Array();
        for (let i = 0; i < gridSize.width; ++i) {
            this.buffer.push(new Array());
            for (let j = 0; j < gridSize.height; ++j) {
                this.buffer[i].push([-1, -1, -1, -1]);
            }
        }
        let widthRelative = gridSize.width / (gridSize.width + 6);
        let heightRelative = gridSize.height / (gridSize.height + 2);
        let gridLayout = new Layout(widthRelative / 2, 2 / gridSize.height, 0, 10, widthRelative, heightRelative, -kGameSettingsWidth, -40);
        gridLayout.anchor = { x: widthRelative / 2, y: 0.0 };
        gridLayout.aspect = (gridSize.width) / (gridSize.height);
        gridLayout.fixedAspect = true;
        this.grid = new Grid({ width: gridSize.width, height: gridSize.height }, gridLayout, {
            populate(i, j) {
                return ["", "",];
            },
            onSelect(i, j) {
                if (_this.isEditing()) {
                    _this.editBoard.onSelect(i, j, _this.data, _this.grid);
                }
            },
            onMouseDown(i, j, e) {
                if (_this.isEditing()) {
                    _this.editBoard.onMouseDown(i, j, e, _this.data, _this.grid);
                }
            },
            onMouseMove(i, j, e) {
                if (_this.isEditing()) {
                    _this.editBoard.onMouseMove(e, _this.data, _this.grid);
                }
            },
            onMouseUp(i, j, e) {
                if (_this.isEditing()) {
                    _this.editBoard.onMouseUp(i, j, _this.data, _this.grid);
                }
            },
        });
        this.grid.layout.doLayout({
            position: { x: 0, y: 0 },
            size: { width: screenSize.width, height: screenSize.height },
        });
        this.grid.children = [];
        this.grid.children.push(this.gameSettingsGui.rootComponent);
    }
    dataToB64(data, gridSize) {
        let stuffSize = gridSize.width * gridSize.height * 4;
        let stuff = [];
        for (let index = 0; index < stuffSize; ++index) {
            let k = Math.floor(index / (gridSize.width * gridSize.height));
            let indexOffset = index - k * gridSize.width * gridSize.height;
            let i = indexOffset % gridSize.width;
            let j = Math.floor(indexOffset / gridSize.width);
            stuff.push(data[i][j][k]);
        }
        let bytes = new Uint8Array(stuff);
        var binary = '';
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        let bytesB64 = window.btoa(binary);
        return bytesB64;
    }
    b64ToData(bytesB64, data, gridSize) {
        let binary = window.atob(bytesB64);
        let bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; ++i) {
            bytes[i] = binary.charCodeAt(i);
        }
        //assert - binary.length == gridSize.width*gridSize.height*4
        for (let index = 0; index < binary.length; ++index) {
            let k = Math.floor(index / (gridSize.width * gridSize.height));
            let indexOffset = index - k * gridSize.width * gridSize.height;
            let i = indexOffset % gridSize.width;
            let j = Math.floor(indexOffset / gridSize.width);
            let byte = bytes[index];
            data[i][j][k] = byte == 255 ? -1 : byte;
        }
        console.log(bytesB64);
        console.log("\n\n\n");
        console.log(binary);
        console.log("\n\n\n");
        console.log(bytes);
        console.log("\n\n\n");
        console.log(data);
        console.log("\n\n\n");
    }
    asURL() {
        let bytesB64 = this.dataToB64(this.data, this.grid.gridSize);
        this.b64ToData(bytesB64, this.data, this.grid.gridSize);
        let alwaysStr = "";
        let matchesStr = "";
        let notMatchesStr = "";
        let parallelStr = "";
        for (let edge of this.editBoard.edges) {
            if (edge.headRuleIndex >= 0 && edge.tailRuleIndex >= 0) {
                switch (edge.type) {
                    case EdgeType.Always: {
                        alwaysStr += edge.tailRuleIndex + "," + edge.headRuleIndex + ",";
                        break;
                    }
                    case EdgeType.IfMatched: {
                        matchesStr += edge.tailRuleIndex + "," + edge.headRuleIndex + ",";
                        break;
                    }
                    case EdgeType.IfNotMatched: {
                        notMatchesStr += edge.tailRuleIndex + "," + edge.headRuleIndex + ",";
                        break;
                    }
                    case EdgeType.Parallel: {
                        parallelStr += edge.tailRuleIndex + "," + edge.headRuleIndex + ",";
                        break;
                    }
                }
            }
        }
        let rotations = [];
        for (let element of this.editBoard.rules) {
            let rule = element[1];
            while (rule.index >= rotations.length) {
                rotations.push(0);
            }
            if (rule.includeRotations) {
                rotations[rule.index] = 1;
            }
        }
        let rotationsStr = rotations.join(",");
        let ret = "?";
        ret += "w=" + this.grid.gridSize.width;
        ret += "&";
        ret += "h=" + this.grid.gridSize.height;
        ret += "&";
        ret += "data=" + bytesB64;
        ret += "&";
        ret += "always=" + alwaysStr;
        ret += "&";
        ret += "matches=" + matchesStr;
        ret += "&";
        ret += "notMatches=" + notMatchesStr;
        ret += "&";
        ret += "parallel=" + parallelStr;
        ret += "&";
        ret += "rotations=" + rotationsStr;
        ret += "&";
        ret += "interval=" + this.gameStepInterval;
        return ret;
    }
    getTitle() {
        return this.gameSettingsGui.title.getText();
    }
    copyData(from, to) {
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                to[i][j][0] = from[i][j][0];
                to[i][j][1] = from[i][j][1];
                to[i][j][2] = from[i][j][2];
                to[i][j][3] = from[i][j][3];
            }
        }
    }
    toggleState() {
        if (this.state == BoardState.Play) {
            this.copyData(this.saved, this.data);
            this.applyRealDataToGrid();
            this.state = BoardState.Edit;
        }
        else {
            this.copyData(this.data, this.saved);
            this.editBoard.unselectSelectedObject();
            this.playBoard = new PlayBoard(this.editBoard.edges, this.editBoard.rules, this.data, this.grid.gridSize, this.gameStepInterval);
            this.state = BoardState.Play;
        }
    }
    isEditing() {
        return this.state == BoardState.Edit;
    }
    applyRealDataToGrid() {
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                this.editBoard.setGridCell(i, j, this.data[i][j][0], this.data[i][j][1], this.data[i][j][2], this.data[i][j][3], this.grid);
            }
        }
    }
    onUpdate(timeMS) {
        if (this.state == BoardState.Play && this.playBoard) {
            this.copyData(this.data, this.buffer);
            if (this.playBoard.onUpdate(timeMS, this.data, this.buffer, this.grid.gridSize)) {
                this.copyData(this.buffer, this.data);
                this.applyRealDataToGrid();
            }
        }
    }
    onKeyDown(e) {
        if (this.state == BoardState.Play && this.playBoard) {
            this.copyData(this.data, this.buffer);
            if (this.playBoard.onKeyDown(e, this.data, this.buffer, this.grid.gridSize)) {
                this.copyData(this.buffer, this.data);
                this.applyRealDataToGrid();
            }
        }
        else if (this.state == BoardState.Edit) {
            this.editBoard.onKeyDown(e);
        }
    }
    resizeGrid(newSize) {
        let actualSize = {
            width: this.data.length,
            height: this.data[0].length,
        };
        for (let i = 0; i < newSize.width; ++i) {
            if (i >= actualSize.width) {
                this.saved.push(new Array());
                this.data.push(new Array());
                this.buffer.push(new Array());
            }
            for (let j = 0; j < newSize.height; ++j) {
                if (i >= actualSize.width || j >= actualSize.height) {
                    this.saved[i].push([-1, -1, -1, -1]);
                    this.data[i].push([-1, -1, -1, -1]);
                    this.buffer[i].push([-1, -1, -1, -1]);
                }
            }
        }
        this.grid.resizeGrid(newSize);
        this.needsLayout = true;
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
    setupInputStates() {
        this.editBoard.rulePad(1, 1, this.data, this.grid);
        this.grid.grid[1][1][0] = PlaybilderPaths.InputState["Computer"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 3, this.data, this.grid);
        this.grid.grid[1][3][0] = PlaybilderPaths.InputState["Left"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 5, this.data, this.grid);
        this.grid.grid[1][5][0] = PlaybilderPaths.InputState["Right"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 7, this.data, this.grid);
        this.grid.grid[1][7][0] = PlaybilderPaths.InputState["Up"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 9, this.data, this.grid);
        this.grid.grid[1][9][0] = PlaybilderPaths.InputState["Down"];
        this.editBoard.edits.pop();
        this.editBoard.calculateReachability();
        this.editBoard.unselectSelectedObject();
        this.debugRules();
    }
    loadB64Data(b64Data, components) {
        this.b64ToData(b64Data, this.data, this.grid.gridSize);
        this.applyRealDataToGrid();
        for (let i = 0; i < this.grid.gridSize.width; ++i) {
            for (let j = 0; j < this.grid.gridSize.height; ++j) {
                let ruleIndex = this.data[i][j][3];
                if (ruleIndex < 0) {
                    continue;
                }
                this.editBoard.maxRuleIndex = Math.max(ruleIndex + 1, this.editBoard.maxRuleIndex);
                let rule = this.editBoard.rules.get(ruleIndex);
                if (!rule) {
                    let newRule = new EditRule(ruleIndex, this.grid.layout);
                    components.push(newRule.line);
                    this.editBoard.rules.set(ruleIndex, newRule);
                    newRule.dirtyBoundaries = true;
                    this.editBoard.calculateBoundaries(this.data, this.grid);
                    this.editBoard.respositionEdgesForRule(newRule, this.grid);
                }
            }
        }
        this.editBoard.calculateReachability();
    }
    load(archive) {
        if (archive.gameStepInterval) {
            this.gameStepInterval = archive.gameStepInterval;
            this.gameSettingsGui.interval.setText(this.gameStepInterval.toString());
        }
        if (archive.settings) {
            if (archive.settings.title) {
                this.gameSettingsGui.title.setText(archive.settings.title);
            }
        }
        if (archive.data) {
            this.data = archive.data;
            this.applyRealDataToGrid();
        }
        else {
            this.setupInputStates();
        }
        if (archive.edges && archive.rules) {
            for (let edgeArchive of archive.edges) {
                let edge = new Edge({
                    tailRuleIndex: edgeArchive.tailRuleIndex,
                    fromTool: Tool.EdgeAlways,
                    parentLayout: this.grid.layout,
                });
                edge.load(edgeArchive);
                this.editBoard.components.push(edge.arrow);
                this.editBoard.edges.push(edge);
            }
            for (let ruleArchive of archive.rules) {
                this.editBoard.maxRuleIndex = Math.max(ruleArchive.index + 1, this.editBoard.maxRuleIndex);
                let rule = new EditRule(ruleArchive.index, this.grid.layout);
                this.editBoard.components.push(rule.line);
                this.editBoard.rules.set(ruleArchive.index, rule);
                rule.dirtyBoundaries = true;
                this.editBoard.calculateBoundaries(this.data, this.grid);
                this.editBoard.respositionEdgesForRule(rule, this.grid);
                if (rule) {
                    rule.load(ruleArchive);
                }
            }
            this.editBoard.calculateReachability();
        }
    }
    didResize(screenSize) {
        for (let element of this.editBoard.rules) {
            let rule = element[1];
            rule.line.layout.doLayout(this.grid.layout.computed);
            rule.dirtyBoundaries = true;
            this.editBoard.respositionEdgesForRule(rule, this.grid);
        }
        this.editBoard.calculateBoundaries(this.data, this.grid);
        for (let edge of this.editBoard.edges) {
            edge.arrow.layout.doLayout(this.grid.layout.computed);
        }
    }
    loadEdgesString(edgesString, type, components) {
        let edgesParts = edgesString.split(",");
        for (let i = 0; i < edgesParts.length; i += 2) {
            console.log("edge", edgesParts[i], "to", edgesParts[i + 1]);
            let tailPart = edgesParts[i];
            let headPart = edgesParts[i + 1];
            if (tailPart && headPart) {
                let tailRuleIndex = parseInt(tailPart);
                let headRuleIndex = parseInt(headPart);
                let edge = new Edge({
                    tailRuleIndex: tailRuleIndex,
                    fromTool: type,
                    parentLayout: this.grid.layout,
                });
                edge.headRuleIndex = headRuleIndex;
                components.push(edge.arrow);
                this.editBoard.edges.push(edge);
            }
        }
    }
    save() {
        let rules = [];
        for (let element of this.editBoard.rules) {
            let rule = element[1];
            rules.push(rule.save());
        }
        let edges = [];
        for (let edge of this.editBoard.edges) {
            edges.push(edge.save());
        }
        return {
            width: this.grid.gridSize.width,
            height: this.grid.gridSize.height,
            data: this.data,
            rules: rules,
            edges: edges,
            gameStepInterval: this.gameStepInterval,
            settings: this.gameSettingsGui.save(),
        };
    }
    setComponents(components) {
        this.editBoard.setComponents(components);
        this.editBoard.gridLayout = this.grid.layout;
    }
}
let kGameSettingsWidth = 150;
class GameSettingsGUI {
    constructor(gridSize, controller) {
        let fontSize = 18;
        let rootLayout = new Layout(1, 0, 10, 0, 0, 0, kGameSettingsWidth, 200);
        this.rootComponent = new Rectangle(rootLayout);
        this.rootComponent.lineWidth = 1;
        this.rootComponent.layout.relativeLayout = RelativeLayout.StackVertical;
        let titleLayout = new Layout(0, 0, 5, 5, 1, 0, 0, 20);
        let title = new TextInput(titleLayout, {}, "My Game");
        title.placeholderText = "Untitled";
        title.setFontSize(fontSize);
        title.setMaxTextLength((kGameSettingsWidth - 10) / (fontSize * 0.6));
        this.rootComponent.children = [];
        this.rootComponent.children.push(title);
        this.interval = this.addField({
            onTextChanged(newText) {
                let interval = parseInt(newText) || 0;
                controller.onIntervalChanged(interval);
            },
            labelText: "Interval (ms):",
            defaultValue: "200",
            maxTextLength: 4,
        });
        this.width = this.addField({
            onTextChanged(newText) {
                let width = parseInt(newText) || 5;
                width = Math.max(width, 5);
                controller.onWidthChanged(width);
                console.log("width:", newText);
            },
            labelText: "Width:",
            defaultValue: gridSize.width.toString(),
            maxTextLength: 2,
        });
        this.height = this.addField({
            onTextChanged(newText) {
                let height = parseInt(newText) || 5;
                height = Math.max(height, 5);
                controller.onHeightChanged(height);
                console.log("height:", newText);
            },
            labelText: "Height:",
            defaultValue: gridSize.height.toString(),
            maxTextLength: 2,
        });
        this.title = title;
    }
    addField(obj) {
        let labelLayout = new Layout(0, 0, 5, 5, 0.7, 0, 0, 14);
        let label = new TextLabel(labelLayout, obj.labelText);
        label.setFontSize(12);
        label.fillStyle = Constants.Colors.Black;
        let layout = new Layout(1, 0, 5, 0, 1, 0, 0, 14);
        let textInput = new TextInput(layout, obj, obj.defaultValue);
        textInput.placeholderText = "0";
        textInput.setFontSize(12);
        textInput.setMaxTextLength(obj.maxTextLength);
        textInput.textInputType = TextInputType.Integer;
        label.children = [];
        label.children.push(textInput);
        if (this.rootComponent.children) {
            this.rootComponent.children.push(label);
        }
        return textInput;
    }
    hide() {
        this.rootComponent.layout.visible = false;
    }
    show() {
        this.rootComponent.layout.visible = true;
    }
    save() {
        return {
            title: this.title.getText(),
        };
    }
    load(obj) {
        this.title.setText(obj.title);
    }
}
function download(data, filename, type) {
    var file = new Blob([data], { type: type });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"), url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}
let kTopbarBottomPadding = 20;
class Playbilder {
    constructor(container, boardSize, archive) {
        let _this = this;
        let screenSize = getGameScreenSize();
        let board = new Board(boardSize, screenSize);
        let tileSize = board.grid.computeTileSize();
        console.log("PlayBilder constructor tileSize", tileSize);
        let paletteLayout = new Layout(0, 0, -20, tileSize, 0, 0, tileSize * 3, tileSize * 12);
        let selectedRectLayout = new Layout(0, 0, 0, 0, 0, 0, tileSize, tileSize);
        let selectedRect = new Rectangle(selectedRectLayout);
        let selectedCoord = { i: 0, j: 0 };
        let toolRectLayout = new Layout(0, 0, 0, 0, 0, 0, tileSize, tileSize);
        let toolRect = new Rectangle(toolRectLayout);
        let toolCoord = { i: 0, j: 0 };
        function setToolFromToolbar(i, j) {
            if (i != board.editBoard.editTool && i != Tool.Move) {
                board.editBoard.unselectSelectedObject();
            }
            let tileSize = board.grid.computeTileSize();
            board.editBoard.editTool = i;
            toolRect.layout.offset.position.x = i * tileSize;
            toolRect.layout.offset.position.y = j * tileSize;
            toolRect.layout.doLayout(toolbarLayout.computed);
            toolCoord = { i: i, j: j };
            selectedRect.layout.visible = board.editBoard.editTool == Tool.Pencil;
        }
        function setSelectedFromPalette(i, j) {
            setToolFromToolbar(0, 0);
            let tileSize = board.grid.computeTileSize();
            board.editBoard.editModality = i;
            board.editBoard.editBlockType = j;
            selectedRect.layout.offset.position.x = i * tileSize;
            selectedRect.layout.offset.position.y = j * tileSize;
            selectedRect.layout.doLayout(paletteLayout.computed);
            selectedCoord = { i: i, j: j };
        }
        paletteLayout.anchor = { x: 1.0, y: 0.0 };
        let palette = new Grid({ width: 3, height: 12 }, paletteLayout, {
            populate(i, j) {
                if (i == 0) {
                    return [PlaybilderPaths.Reals[j]];
                }
                else if (i == 1) {
                    return [PlaybilderPaths.Ideas[j]];
                }
                else {
                    return [PlaybilderPaths.Futures[j]];
                }
            },
            onClick(i, j) {
                setSelectedFromPalette(i, j);
            },
        });
        palette.children = [];
        palette.children.push(selectedRect);
        this.paletteHorizontalLabels = [];
        this.paletteVerticalLabels = [];
        for (let i = 0; i < 10; ++i) {
            let labelLayout = new Layout(0, 0, -20, i * tileSize + 0, 0, 0, tileSize, tileSize);
            let label = new TextLabel(labelLayout, i.toString());
            palette.children.push(label);
            this.paletteHorizontalLabels.push(label);
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
            let labelLayout = new Layout(0, 0, i * tileSize, -20, 0, 0, tileSize, tileSize);
            let label = new TextLabel(labelLayout, text);
            palette.children.push(label);
            this.paletteVerticalLabels.push(label);
        }
        const tools = [
            ["Pencil"], ["Eraser"], ["Move"],
            ["Select"], ["RulePad"], ["EdgeAlways"],
            ["EdgeIfMatched"], ["EdgeIfNotMatched"], ["EdgeParallel"],
        ];
        let toolbarLayout = new Layout(0, 0, 0, -kTopbarBottomPadding, 0, 0, tileSize * 9, tileSize * 1);
        toolbarLayout.anchor = { x: 0.0, y: 1.0 };
        let toolbar = new Grid({ width: 9, height: 1 }, toolbarLayout, {
            populate(i, j) {
                switch (j) {
                    // case Tool.EdgeAlways: {
                    // 	let tool = j as Tool;
                    // 	return this.createStampForEdgeTool(tool);
                    // }
                    default: {
                        return [PlaybilderPaths.Tools[tools[i][j]]];
                    }
                }
            },
            onClick(i, j) {
                setToolFromToolbar(i, j);
            },
        });
        toolbar.children = [];
        toolbar.children.push(toolRect);
        let downloadButtonLayout = new Layout(1, 0, 0, -kTopbarBottomPadding, 0, 0, tileSize, tileSize);
        downloadButtonLayout.anchor = { x: 1.0, y: 1.0 };
        let downloadButton = new Button(downloadButtonLayout, {
            onClick(e) {
                console.log("download ...");
                let archive = JSON.stringify(board.save(), null, '\t');
                console.log(archive);
                download(archive, board.getTitle(), "application/json");
                return true;
            }
        });
        downloadButton.togglePaths = [ImagePaths.Icons["Download"]];
        let playButtonLayout = new Layout(1, 0, -tileSize * 1.75, -kTopbarBottomPadding, 0, 0, tileSize, tileSize);
        playButtonLayout.anchor = { x: 1.0, y: 1.0 };
        let playButton = new Button(playButtonLayout, {
            onClick(e) {
                let url = board.asURL();
                console.log(url);
                board.toggleState();
                if (board.state == BoardState.Play) {
                }
                return true;
            }
        });
        playButton.togglePaths = [ImagePaths.Icons["Play"], ImagePaths.Icons["Pause"]];
        this.game = new Game(container, {
            onKeyDown(e) {
                console.log("onKeyDown", e.key, e.ctrlKey, e.metaKey);
                if (board.state == BoardState.Edit) {
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
                        if (board.state == BoardState.Edit) {
                            board.editBoard.undo(board.data, board.grid);
                        }
                    }
                }
                board.onKeyDown(e);
            },
            onUpdate(timeMS) {
                board.onUpdate(timeMS);
            },
            willResize(screenSize, cp) {
            },
            didResize(screenSize, cp) {
                _this.didResize(screenSize, cp);
            },
            needsLayout() {
                let ret = board.needsLayout;
                board.needsLayout = false;
                return ret;
            },
        });
        this.game.components.push(board.grid);
        if (board.grid.children) {
            board.grid.children.push(palette);
            board.grid.children.push(toolbar);
            board.grid.children.push(playButton);
            board.grid.children.push(downloadButton);
            board.grid.children.push(board.editBoard.ruleOptions.rootComponent);
        }
        board.setComponents(this.game.components);
        this.game.doLayout();
        board.load(archive);
        this.palette = palette;
        this.selectedRect = selectedRect;
        this.toolRect = toolRect;
        this.toolbar = toolbar;
        this.downloadButton = downloadButton;
        this.playButton = playButton;
        this.board = board;
    }
    loadStateFromGetParams(getParams, board) {
        let b64Data = getParams.get("data");
        let alwaysString = getParams.get("always");
        let matchesString = getParams.get("matches");
        let notMatchesString = getParams.get("notMatches");
        let parallelString = getParams.get("parallel");
        let rotationsStr = getParams.get("rotations");
        if (b64Data) {
            board.loadB64Data(b64Data, this.game.components);
            if (alwaysString) {
                board.loadEdgesString(alwaysString, Tool.EdgeAlways, this.game.components);
            }
            if (matchesString) {
                board.loadEdgesString(matchesString, Tool.EdgeIfMatched, this.game.components);
            }
            if (notMatchesString) {
                board.loadEdgesString(notMatchesString, Tool.EdgeIfNotMatched, this.game.components);
            }
            if (parallelString) {
                board.loadEdgesString(parallelString, Tool.EdgeParallel, this.game.components);
            }
            board.editBoard.calculateReachability();
            for (let element of board.editBoard.rules) {
                let rule = element[1];
                if (rule.isEnabled()) {
                    board.editBoard.respositionEdgesForRule(rule, board.grid);
                }
            }
        }
        else {
            board.setupInputStates();
        }
        if (rotationsStr) {
            let rotationsParts = rotationsStr.split(",");
            for (let i = 0; i < rotationsParts.length; ++i) {
                let rotationPart = rotationsParts[i];
                let rotation = parseInt(rotationPart);
                if (rotation == 1) {
                    let rule = board.editBoard.rules.get(i);
                    if (rule) {
                        rule.includeRotations = true;
                    }
                }
            }
        }
    }
    createStampForEdgeTool(tool) {
        return "";
    }
    didResize(screenSize, cp) {
        cp.clear();
        let tileSize = this.board.grid.computeTileSize();
        this.board.didResize(screenSize);
        this.palette.layout.offset = {
            position: {
                x: -20,
                y: tileSize,
            },
            size: {
                width: tileSize * 3,
                height: tileSize * 12,
            },
        };
        this.selectedRect.layout.offset.size = {
            width: tileSize,
            height: tileSize,
        };
        this.toolRect.layout.offset.size = {
            width: tileSize,
            height: tileSize,
        };
        this.toolbar.layout.offset = {
            position: {
                x: 0,
                y: -kTopbarBottomPadding,
            },
            size: {
                width: tileSize * 9,
                height: tileSize * 1,
            },
        };
        this.downloadButton.layout.offset = {
            position: {
                x: 0,
                y: -kTopbarBottomPadding,
            },
            size: {
                width: tileSize,
                height: tileSize,
            },
        };
        this.playButton.layout.offset = {
            position: {
                x: -tileSize * 1.75,
                y: -kTopbarBottomPadding,
            },
            size: {
                width: tileSize,
                height: tileSize,
            },
        };
        for (let i = 0; i < this.paletteHorizontalLabels.length; ++i) {
            let label = this.paletteHorizontalLabels[i];
            label.layout.offset = {
                position: {
                    x: -20,
                    y: i * tileSize,
                },
                size: {
                    width: tileSize,
                    height: tileSize,
                },
            };
        }
        for (let i = 0; i < this.paletteVerticalLabels.length; ++i) {
            let label = this.paletteVerticalLabels[i];
            label.layout.offset = {
                position: {
                    x: i * tileSize,
                    y: -20,
                },
                size: {
                    width: tileSize,
                    height: tileSize,
                },
            };
        }
    }
}
function getUrlVars() {
    let vars = new Map();
    let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars.set(key, value);
        return "";
    });
    return vars;
}
let getParams = getUrlVars();
let archive = {};
let example = getParams.get("example");
if (example == "LogicGates") {
    archive = Example_LogicGates;
}
else if (example == "AGoodSnowmanIsHardToBuild") {
    archive = Example_AGoodSnowmanIsHardToBuild;
}
else if (example == "Rule30") {
    archive = Example_Rule30;
}
else if (example == "Tetris") {
    archive = Example_Tetris;
}
else if (example == "Sokoban") {
    archive = Example_Sokoban;
}
else if (example == "LangtonsAnt") {
    archive = Example_LangtonsAnt;
}
let wParam = getParams.get("w");
let hParam = getParams.get("h");
let width = wParam ? parseInt(wParam) : 20;
let height = hParam ? parseInt(hParam) : 20;
if (archive && archive.width) {
    width = archive.width;
}
if (archive && archive.height) {
    height = archive.height;
}
console.log("width:", width, "height:", height);
let $container = document.getElementById('container');
let $playBilder = new Playbilder($container, { width: width, height: height }, archive);
$playBilder.game.start();
//# sourceMappingURL=main.js.map