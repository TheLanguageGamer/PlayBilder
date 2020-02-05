"use strict";
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
        let downloadButtonLayout = new Layout(1, 0, -tileSize * 1.75 * 2, -kTopbarBottomPadding, 0, 0, tileSize, tileSize);
        downloadButtonLayout.anchor = { x: 1.0, y: 1.0 };
        let downloadButton = new Button(downloadButtonLayout, {
            onClick(e) {
                console.log("download ...");
                let archive = JSON.stringify(board.save(), null, '\t');
                console.log(archive);
                download(archive, board.getTitle() + ".json", "application/json");
                return true;
            }
        });
        downloadButton.togglePaths = [ImagePaths.Icons["Download"]];
        let uploadButtonLayout = new Layout(1, 0, -tileSize * 1.75 * 1, -kTopbarBottomPadding, 0, 0, tileSize, tileSize);
        uploadButtonLayout.anchor = { x: 1.0, y: 1.0 };
        let uploadButton = new Button(uploadButtonLayout, {
            onClick(e) {
                let $upload = document.getElementById('upload');
                $upload.click();
                return true;
            }
        });
        uploadButton.togglePaths = [ImagePaths.Icons["Upload"]];
        let trashButtonLayout = new Layout(1, 0, -tileSize * 1.75 * 0, -kTopbarBottomPadding, 0, 0, tileSize, tileSize);
        trashButtonLayout.anchor = { x: 1.0, y: 1.0 };
        let trashButton = new Button(trashButtonLayout, {
            onClick(e) {
                console.log("trash it!");
                board.clear();
                return true;
            }
        });
        trashButton.togglePaths = [ImagePaths.Icons["Trash"]];
        let playButtonLayout = new Layout(1, 0, -tileSize * 1.75 * 3, -kTopbarBottomPadding, 0, 0, tileSize, tileSize);
        playButtonLayout.anchor = { x: 1.0, y: 1.0 };
        let playButton = new Button(playButtonLayout, {
            onClick(e) {
                board.toggleState();
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
            board.grid.children.push(uploadButton);
            board.grid.children.push(trashButton);
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
        this.uploadButton = uploadButton;
        this.trashButton = trashButton;
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
        this.trashButton.layout.offset = {
            position: {
                x: -tileSize * 1.75 * 0,
                y: -kTopbarBottomPadding,
            },
            size: {
                width: tileSize,
                height: tileSize,
            },
        };
        this.uploadButton.layout.offset = {
            position: {
                x: -tileSize * 1.75 * 1,
                y: -kTopbarBottomPadding,
            },
            size: {
                width: tileSize,
                height: tileSize,
            },
        };
        this.downloadButton.layout.offset = {
            position: {
                x: -tileSize * 1.75 * 2,
                y: -kTopbarBottomPadding,
            },
            size: {
                width: tileSize,
                height: tileSize,
            },
        };
        this.playButton.layout.offset = {
            position: {
                x: -tileSize * 1.75 * 3,
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
else {
    // let archiveString = localStorage.getItem("archive");
    // if (archiveString) {
    // 	archive = JSON.parse(archiveString);
    // }
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
let inputElement = document.getElementById("upload");
inputElement.addEventListener("change", handleFiles, false);
function handleFiles(e) {
    console.log("handleFiles", e);
    console.log(e.target);
    let files = e.target.files;
    console.log(files);
    if (files && files.length > 0) {
        let reader = new FileReader();
        reader.onload = function (event) {
            if (event.target && event.target.result) {
                var obj = JSON.parse(event.target.result);
                console.log("reader has read:", obj);
                $playBilder.board.load(obj);
            }
        };
        reader.readAsText(files[0]);
    }
}
window.addEventListener('beforeunload', function (e) {
    console.log("beforeunload");
    let archive = JSON.stringify($playBilder.board.save(), null, '\t');
    localStorage.setItem("archive", archive);
});
//# sourceMappingURL=main.js.map