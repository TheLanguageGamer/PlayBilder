"use strict";
class PlayRule {
    constructor(index, isStartSymbol) {
        this.children = [];
        this.rotations = [];
        this.isStartSymbol = false;
        this.size = { width: 0, height: 0 };
        this.data = new Array();
        this.index = index;
        this.isStartSymbol = isStartSymbol;
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
        if (!this.isStartSymbol) {
            for (let i = 0; i < gridSize.width; ++i) {
                for (let j = 0; j < gridSize.height; ++j) {
                    if (this.match(boardData, boardBuffer, gridSize, i, j)) {
                        this.apply(boardData, boardBuffer, gridSize, i, j);
                    }
                }
            }
        }
        for (let rotation of this.rotations) {
            rotation.process(boardData, boardBuffer, gridSize);
        }
        for (let child of this.children) {
            child.process(boardData, boardBuffer, gridSize);
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
    static fromBoardData(editRule, data, gridSize, isStartSymbol) {
        let playRule = new PlayRule(editRule.index, isStartSymbol);
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
            let playRule90 = this.createRotation(playRule);
            let playRule180 = this.createRotation(playRule90);
            let playRule270 = this.createRotation(playRule180);
            playRule.rotations = [playRule90, playRule180, playRule270];
        }
        return playRule;
    }
    static createRotation(other) {
        let playRule = new PlayRule(other.index, other.isStartSymbol);
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
        this.root = PlayRule.fromBoardData(rootEditRule, data, gridSize, true);
        this.addChildren(this.root, edges, editRules, data, gridSize);
    }
    addChildren(parent, edges, editRules, data, gridSize) {
        for (let edge of edges) {
            if (edge.tailRuleIndex == parent.index) {
                let childEditRule = editRules.get(edge.headRuleIndex);
                if (childEditRule) {
                    //let childPlayRule = new PlayRule(childEditRule, data, gridSize, false);
                    let childPlayRule = PlayRule.fromBoardData(childEditRule, data, gridSize, false);
                    parent.children.push(childPlayRule);
                    this.addChildren(childPlayRule, edges, editRules, data, gridSize);
                }
            }
        }
    }
}
class PlayBoard {
    constructor(edges, editRules, data, gridSize) {
        this.lastTimeStep = 0;
        this.gameStepInterval = 250;
        let computerEditRule = editRules.get(InputState.Computer);
        //asser computerEditRule is not undefined
        this.gameStepPlayTree = new PlayTree(computerEditRule, edges, editRules, data, gridSize);
        let leftEditRule = editRules.get(InputState.Left);
        //asser leftEditRule is not undefined
        this.leftPlayTree = new PlayTree(leftEditRule, edges, editRules, data, gridSize);
        let rightEditRule = editRules.get(InputState.Right);
        //asser rightEditRule is not undefined
        this.rightPlayTree = new PlayTree(rightEditRule, edges, editRules, data, gridSize);
        let upEditRule = editRules.get(InputState.Up);
        //asser upEditRule is not undefined
        this.upPlayTree = new PlayTree(upEditRule, edges, editRules, data, gridSize);
        let downEditRule = editRules.get(InputState.Down);
        //asser downEditRule is not undefined
        this.downPlayTree = new PlayTree(downEditRule, edges, editRules, data, gridSize);
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
    constructor(gridSize) {
        this.state = BoardState.Edit;
        this.editBoard = new EditBoard();
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
            size: { width: window.innerWidth, height: window.innerHeight },
        });
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
        let edgesStr = "";
        for (let edge of this.editBoard.edges) {
            if (edge.headRuleIndex >= 0 && edge.tailRuleIndex >= 0) {
                edgesStr += edge.tailRuleIndex + "," + edge.headRuleIndex + ",";
            }
        }
        let ret = "?";
        ret += "w=" + this.grid.gridSize.width;
        ret += "&";
        ret += "h=" + this.grid.gridSize.height;
        ret += "&";
        ret += "data=" + bytesB64;
        ret += "&";
        ret += "edges=" + edgesStr;
        return ret;
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
            this.editBoard.unselectSelectedRule();
            this.playBoard = new PlayBoard(this.editBoard.edges, this.editBoard.rules, this.data, this.grid.gridSize);
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
        this.grid.grid[1][1][0] = ImagePaths.InputState["Computer"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 3, this.data, this.grid);
        this.grid.grid[1][3][0] = ImagePaths.InputState["Left"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 5, this.data, this.grid);
        this.grid.grid[1][5][0] = ImagePaths.InputState["Right"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 7, this.data, this.grid);
        this.grid.grid[1][7][0] = ImagePaths.InputState["Up"];
        this.editBoard.edits.pop();
        this.editBoard.rulePad(1, 9, this.data, this.grid);
        this.grid.grid[1][9][0] = ImagePaths.InputState["Down"];
        this.editBoard.edits.pop();
        this.editBoard.calculateReachability();
        this.editBoard.unselectSelectedRule();
        this.debugRules();
    }
    loadB64Data(b64Data) {
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
                    let newRule = new EditRule(ruleIndex);
                    this.editBoard.components.push(newRule.line);
                    this.editBoard.rules.set(ruleIndex, newRule);
                    newRule.dirtyBoundaries = true;
                    this.editBoard.calculateBoundaries(this.data, this.grid);
                    this.editBoard.respositionEdgesForRule(newRule, this.grid);
                }
            }
        }
        this.editBoard.calculateReachability();
    }
    loadEdgesString(edgesString) {
        let edgesParts = edgesString.split(",");
        for (let i = 0; i < edgesParts.length; i += 2) {
            console.log("edge", edgesParts[i], "to", edgesParts[i + 1]);
            let tailPart = edgesParts[i];
            let headPart = edgesParts[i + 1];
            if (tailPart && headPart) {
                let tailRuleIndex = parseInt(tailPart);
                let headRuleIndex = parseInt(headPart);
                let edge = new Edge({ tailRuleIndex: tailRuleIndex });
                edge.headRuleIndex = headRuleIndex;
                this.editBoard.components.push(edge.arrow);
                this.editBoard.edges.push(edge);
            }
        }
        this.editBoard.calculateReachability();
        for (let element of this.editBoard.rules) {
            let rule = element[1];
            if (rule.isEnabled()) {
                this.editBoard.respositionEdgesForRule(rule, this.grid);
            }
        }
    }
}
class Playbilder {
    constructor(container, boardSize, b64Data, edgesString) {
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
            if (i != board.editBoard.editTool) {
                board.editBoard.unselectSelectedRule();
            }
            board.editBoard.editTool = i;
            toolRect.layout.offset.position.x = i * tileSize;
            toolRect.layout.offset.position.y = j * tileSize;
            toolRect.layout.doLayout(toolbarLayout.computed);
            toolCoord = { i: i, j: j };
            selectedRect.layout.visible = board.editBoard.editTool == Tool.Pencil;
        }
        function setSelectedFromPalette(i, j) {
            setToolFromToolbar(0, 0);
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
        let topbarBottomPadding = 20;
        let toolbarLayout = new Layout(0, 0, 0, -topbarBottomPadding, 0, 0, tileSize * 9, tileSize * 1);
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
        let playButtonLayout = new Layout(1, 0, 0, -topbarBottomPadding, 0, 0, tileSize, tileSize);
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
                else {
                    board.onKeyDown(e);
                }
            },
            onUpdate(timeMS) {
                board.onUpdate(timeMS);
            },
        });
        this.game.components.push(board.grid);
        board.grid.children = [];
        board.grid.children.push(palette);
        board.grid.children.push(toolbar);
        board.grid.children.push(playButton);
        board.grid.children.push(board.editBoard.ruleOptions.rootComponent);
        this.game.doLayout();
        board.editBoard.components = this.game.components;
        board.setupInputStates();
        if (b64Data) {
            board.loadB64Data(b64Data);
            if (edgesString) {
                board.loadEdgesString(edgesString);
            }
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
let wParam = getParams.get("w");
let hParam = getParams.get("h");
let b64Data = getParams.get("data");
let edgesString = getParams.get("edges");
let width = wParam ? parseInt(wParam) : 20;
let height = hParam ? parseInt(hParam) : 20;
console.log("width:", width, "height:", height);
let $container = document.getElementById('container');
let $playBilder = new Playbilder($container, { width: width, height: height }, b64Data, edgesString);
$playBilder.game.start();
//# sourceMappingURL=main.js.map