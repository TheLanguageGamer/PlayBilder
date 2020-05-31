
function download(data : string, filename : string, type : string) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

let kTopbarBottomPadding = 20 + 25;

interface EndStateOverlayController {
	onNext : () => void,
}

class EndStateOverlay {

	background : Rectangle;
	title : TextBox;
	button : Button;

	constructor(controller : EndStateOverlayController) {
		let _this = this;
		let backgroundLayout = new Layout(
			0, 0, 0, 0,
			1, 1, 0, 0
		);
		let background = new Rectangle(backgroundLayout);
		background.fillColor = Constants.Colors.White;

		let titleLayout = new Layout(
			0.5, 0.5, 0, 0,
			0.75, 0.5, 0, 0
		);
		titleLayout.anchor.x = 0.5;
		titleLayout.anchor.y = 0.5;
		let title = new TextBox(titleLayout, "Hey that's nice, good job!");
		title.setFontSize(20);
		title.fillStyle = Constants.Colors.Black;

		let buttonLayout = new Layout(
			0.5, 0.5, 0, 0,
			0, 0, 50, 50
		);
		buttonLayout.anchor.x = 0.5;
		buttonLayout.anchor.y = 0.0;
		let button = new Button(
			buttonLayout,
			{
				onClick(e : MouseEvent) {
					console.log("button clicked!");
					controller.onNext();
					_this.hide();
					return true;
				}
			},
		);
		button.togglePaths = [PlaybilderPaths.InputState["Right"]];

		background.children = [];
		background.children.push(title);
		background.children.push(button);

		this.background = background;
		this.title = title;
		this.button = button;
	}

	show() {
		this.background.layout.visible = true;
	}

	hide() {
		this.background.layout.visible = false;
	}
}

class Playbilder {
	game : Game;
	board : Board;
	palette : Component;
	paletteHorizontalLabels : Component[];
	paletteVerticalLabels : Component[];
	selectedRect : Component;
	toolRect : Component;
	toolbar : Component;
	downloadButton : Component;
	uploadButton : Component;
	trashButton : Component;
	playButton : Button;
	addLevelButton : Component;
	levelSelect : Select;
	endStateOverlay : EndStateOverlay;
	gameSettingsGui : GameSettingsGUI;

	getTitle() {
		return this.gameSettingsGui.title.getText();
	}

	load(archive : any) {

		let info = document.getElementById('info')
		if (archive.info && info) {
			info.innerHTML = archive.info;
		}
		if (archive.gameStepInterval) {
			this.gameSettingsGui.interval.setText(archive.gameStepInterval.toString());
		}
		if (archive.settings) {
			if (archive.settings.title) {
				this.gameSettingsGui.title.setText(archive.settings.title);
			}
		}
		this.board.load(archive);
		if (archive.levels) {
			this.levelSelect.options.length = 0;
			while (this.board.levels.length > this.levelSelect.options.length) {	
				this.levelSelect.options.push({
					label : "Level " + (this.levelSelect.options.length+1),
					id : this.levelSelect.options.length,
				});
			}
		}
		this.levelSelect.selectedIndex = this.board.levelIndex;
		this.screenDidResize(getGameScreenSize(), this.game.contentProvider);
	}

	loadStateFromGetParams(getParams : Map<string, string>, board : Board) {

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
					board.editBoard.respositionEdgesForRule(rule, board.data, board.grid);
				}
			}
		} else {
			board.setupInputStates();
		}

		if (rotationsStr) {
			let rotationsParts : string[] = rotationsStr.split(",");
			for (let i = 0; i < rotationsParts.length; ++i) {
				let rotationPart = rotationsParts[i];
				let rotation = parseInt(rotationPart);
				if (rotation == 1) {
					let rule = board.editBoard.rules.get(i);
					if (rule) {
						//TODO fixme
						//rule.includeRotations = true;
					}
				}
			}
		}
	}

	createStampForEdgeTool(tool : Tool) {
		return "";
	}

	screenDidResize(screenSize : Size, cp : ContentProvider) {
		cp.clear();
		let tileSize = this.board.grid.computeTileSize();
		this.board.screenDidResize(screenSize);

		this.palette.layout.offset = {
			position : {
				x : -20,
				y : tileSize,
			},
			size : {
				width : tileSize*3,
				height : tileSize*12,
			},
		};
		this.selectedRect.layout.offset.size = {
			width : tileSize,
			height : tileSize,
		};
		this.toolRect.layout.offset.size = {
			width : tileSize,
			height : tileSize,
		};

		this.toolbar.layout.offset = {
			position : {
				x : -tileSize*3,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : tileSize*9,
				height : tileSize*1,
			},
		};

		this.trashButton.layout.offset = {
			position : {
				x : -tileSize*1.75*0 + kGameSettingsWidth,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : tileSize,
				height : tileSize,
			},
		};

		this.uploadButton.layout.offset = {
			position : {
				x : -tileSize*1.75*1 + kGameSettingsWidth,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : tileSize,
				height : tileSize,
			},
		};

		this.downloadButton.layout.offset = {
			position : {
				x : -tileSize*1.75*2 + kGameSettingsWidth,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : tileSize,
				height : tileSize,
			},
		};
		this.playButton.layout.offset = {
			position : {
				x : -tileSize*1.75*3 + kGameSettingsWidth,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : tileSize,
				height : tileSize,
			},
		};
		this.addLevelButton.layout.offset = {
			position : {
				x : tileSize*7 + 150 + 15,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : tileSize,
				height : tileSize,
			},
		};
		this.levelSelect.layout.offset = {
			position : {
				x : tileSize*7,
				y : -kTopbarBottomPadding,
			},
			size : {
				width : 150,
				height : 30,
			},
		};

		for (let i = 0; i < this.paletteHorizontalLabels.length; ++i) {
			let label = this.paletteHorizontalLabels[i];
			label.layout.offset = {
				position : {
					x : -20,
					y : i*tileSize,
				},
				size : {
					width : tileSize,
					height : tileSize,
				},
			};
		}
		for (let i = 0; i < this.paletteVerticalLabels.length; ++i) {
			let label = this.paletteVerticalLabels[i];
			label.layout.offset = {
				position : {
					x : i*tileSize,
					y : -20,
				},
				size : {
					width : tileSize,
					height : tileSize,
				},
			};
		}
	}

	constructor (
		container : HTMLElement,
		boardSize : Size,
		archive : any) {

		let _this = this;

		let infobarLayout = new Layout(
			-0.15, 0,
			0, -kTopbarBottomPadding + 40,
			1.15, 0,
			kGameSettingsWidth, 25
		);
		infobarLayout.anchor = {x: 0.0, y: 1.0};
		let infobar = new Rectangle(infobarLayout);
		infobar.strokeColor = Constants.Colors.Yellow.Safety;
		infobar.fillColor = Constants.Colors.Yellow.Light;

        let infobarLabelLayout = new Layout(
        	0, 0.5, 10, 7,
        	1.0, 1.0, -10, 0
        );
        infobarLabelLayout.anchor = {x: 0.0, y: 0.5};
        let infobarLabel = new TextLabel(infobarLabelLayout, "Warning: Be careful about doing that!");
        infobarLabel.setFontSize(14);
        infobarLabel.fillStyle = Constants.Colors.Black;

        infobar.children = [];
        infobar.children.push(infobarLabel);

        function setUserFeedback(feedback : UserFeedback) {
			if (feedback.state == UserFeedbackState.None) {
				infobarLayout.visible = false;
			} else {
				infobarLayout.visible = true;
				infobarLabel.text = feedback.message;
				if (feedback.state == UserFeedbackState.Warning) {
					infobar.strokeColor = Constants.Colors.Yellow.Safety;
					infobar.fillColor = Constants.Colors.Yellow.Light;
				} else if (feedback.state == UserFeedbackState.Error) {
					infobar.strokeColor = Constants.Colors.Red.Imperial;
					infobar.fillColor = Constants.Colors.Red.Light;
				} else {
					infobar.strokeColor = Constants.Colors.DarkGrey;
					infobar.fillColor = Constants.Colors.VeryLightGrey;
				}
			}
        }

        function clearFeedback() {
			setUserFeedback({
				state : UserFeedbackState.None,
				message : "",
			});
        }
        clearFeedback();

		let screenSize = getGameScreenSize();
		let board = new Board(
			boardSize,
			screenSize,
			{
				onUserFeedback(feedback : UserFeedback) {
					setUserFeedback(feedback);
				},
				onWinning() {
					_this.endStateOverlay.show();
				},
				onObjectSelected(editRule? : EditRule) {
					if (editRule) {
						_this.gameSettingsGui.setEditRule(editRule);
					}
				},
				onObjectUnselected() {
					_this.gameSettingsGui.hideRuleOptions();
				},
			}
		);
		let tileSize = board.grid.computeTileSize();
		console.log("PlayBilder constructor tileSize", tileSize);

		let endStateOverlay = new EndStateOverlay({
			onNext() {
				if (board.levelIndex + 1 < board.levels.length) {
					board.jumpToLevel(board.levelIndex + 1);
					_this.levelSelect.selectedIndex = board.levelIndex;
				} else {
					board.toggleState();
					_this.levelSelect.selectedIndex = board.levelIndex;
					_this.playButton.toggleIndex = 0;
				}
			}
		});
		endStateOverlay.hide();

		let paletteLayout = new Layout(
			0, 0, -20, tileSize,
			0, 0, tileSize*3, tileSize*12
		);

		let selectedRectLayout = new Layout(0, 0, 0, 0, 0, 0, tileSize, tileSize);
		let selectedRect = new Rectangle(selectedRectLayout);
		let selectedCoord = {i : 0, j : 0};

		let toolRectLayout = new Layout(0, 0, 0, 0, 0, 0, tileSize, tileSize);
		let toolRect = new Rectangle(toolRectLayout);
		let toolCoord = {i : 0, j : 0};
		function setToolFromToolbar(i : number, j : number) {
			clearFeedback();
			if (i != board.editBoard.editTool && i != Tool.Move) {
				board.editBoard.unselectSelectedObject();
			}
			let tileSize = board.grid.computeTileSize();
			board.editBoard.editTool = i;
			toolRect.layout.offset.position.x = i*tileSize;
			toolRect.layout.offset.position.y = j*tileSize;
			toolRect.layout.doLayout(toolbarLayout.computed);
			toolCoord = {i : i, j : j};
			selectedRect.layout.visible = board.editBoard.editTool == Tool.Pencil;
				// Pencil = 0,
				// Eraser = 1,
				// Move = 2,
				// Select,
				// RulePad,
				// EdgeAlways,
				// EdgeIfMatched,
				// EdgeIfNotMatched,
				// EdgeParallel,
			if (board.editBoard.editTool == Tool.EdgeAlways) {
				setUserFeedback({
					state : UserFeedbackState.Info,
					message : "Black arrows will always be followed.",
				});
			} else if (board.editBoard.editTool == Tool.EdgeIfMatched) {
				setUserFeedback({
					state : UserFeedbackState.Info,
					message : "Green arrows are only followed if the previous rule was matched.",
				});
			} else if (board.editBoard.editTool == Tool.EdgeIfNotMatched) {
				setUserFeedback({
					state : UserFeedbackState.Info,
					message : "Red arrows are only followed if the previous rule was NOT matched.",
				});
			} else if (board.editBoard.editTool == Tool.EdgeParallel) {
				setUserFeedback({
					state : UserFeedbackState.Info,
					message : "For each rule, one blue arrow is randomly followed.",
				});
			}
		}

		function setSelectedFromPalette(i : number, j : number) {
			setToolFromToolbar(0, 0);
			let tileSize = board.grid.computeTileSize();
			board.editBoard.editModality = i;
			board.editBoard.editBlockType = j;
			selectedRect.layout.offset.position.x = i*tileSize;
			selectedRect.layout.offset.position.y = j*tileSize;
			selectedRect.layout.doLayout(paletteLayout.computed);
			selectedCoord = {i : i, j : j};
		}

		paletteLayout.anchor = {x: 1.0, y: 0.0};
		let palette = new Grid(
			{width: 3, height: 12},
			paletteLayout,
			{
				populate(i : number, j : number) {
					if (i == 0) {
						return [PlaybilderPaths.Reals[j]];
					} else if (i == 1) {
						return [PlaybilderPaths.Ideas[j]];
					} else {
						return [PlaybilderPaths.Futures[j]];
					}
				},
				onClick(i : number, j : number) {
					setSelectedFromPalette(i, j);
				},
			}
		);

		palette.children = [];
		palette.children.push(selectedRect);
		this.paletteHorizontalLabels = [];
		this.paletteVerticalLabels = [];
		for (let i = 0; i < 10; ++i) {
			let labelLayout = new Layout(
				0, 0, -20, i*tileSize + 0,
				0, 0, tileSize, tileSize
			);
			let label = new TextLabel(labelLayout, i.toString());
			palette.children.push(label);
			this.paletteHorizontalLabels.push(label);
		}
		for (let i = 0; i < 3; ++i) {	
			let text = "";
			if (i == 0) {
				text = "b";
			} else if (i == 1) {
				text = "i";
			} else if (i == 2) {
				text = "f";
			}
			let labelLayout = new Layout(
				0, 0, i*tileSize, -20,
				0, 0, tileSize, tileSize
			);
			let label = new TextLabel(labelLayout, text);
			palette.children.push(label);
			this.paletteVerticalLabels.push(label);
		}

		const tools : string[][] = [
			["Pencil"], ["Eraser"], ["Move"],
			["Select"], ["RulePad"], ["EdgeAlways"],
			["EdgeIfMatched"], ["EdgeIfNotMatched"], ["EdgeParallel"],
		];

		let levelOptions = [
			{
				label : "Level 1",
				id : 0,
			},
		];

		let gameSettingsGui = new GameSettingsGUI(boardSize, {
			onIntervalChanged(interval : number) {
				console.log("New interval:", interval);
				board.gameStepInterval = interval;
			},
			onWidthChanged(width : number) {
				if (board.grid && board.grid.gridSize.width != width) {
					let newSize = {
						width : width,
						height : board.grid.gridSize.height,
					};
					board.resizeGrid(newSize);
					_this.screenDidResize(getGameScreenSize(), _this.game.contentProvider);
				}
			},
			onHeightChanged(height : number) {
				if (board.grid && board.grid.gridSize.height != height) {
					let newSize = {
						width : board.grid.gridSize.width,
						height : height,
					};
					board.resizeGrid(newSize);
					_this.screenDidResize(getGameScreenSize(), _this.game.contentProvider);
				}
			},
			onLevelTitleChanged(title : string) {
				levelOptions[board.levelIndex].label = title;
			},
			onRuleTitleChanged(title : string) {
				if (board.editBoard.selectedRule) {
					board.editBoard.selectedRule.title = title;
				}
			},
			deleteLevel() {
				console.log("delete level!");
				console.assert(levelOptions.length > 0);
				levelOptions.splice(board.levelIndex, 1);
				board.levels.splice(board.levelIndex, 1);
				let newLevelIndex = board.levelIndex > 0 ? board.levelIndex - 1 : 0;
				board.jumpToLevel(newLevelIndex);
				gameSettingsGui.setLevel(
					levelOptions[newLevelIndex],
					levelOptions.length > 1
				);
				_this.levelSelect.selectedIndex = newLevelIndex;
			},
		});
		gameSettingsGui.setLevel(levelOptions[0], levelOptions.length > 1);

		let levelSelectLayout = new Layout(
			0, 0,
			tileSize*7, -kTopbarBottomPadding,
			0, 0,
			150, 30
		);
		levelSelectLayout.anchor = {x: 0.0, y: 1.0};

		let levelSelect = new Select(
			levelSelectLayout,
			levelOptions, {
			onSelectionChanged(index : number, option : Option) {
				console.log("Selected!", index, option.label);
				board.setLevelWhileEditing(index);
				gameSettingsGui.setLevel(option, levelOptions.length > 1);
			},
		});

		let addLevelLayout = new Layout(
			0, 0,
			tileSize*7 + 150 + 15, -kTopbarBottomPadding,
			0, 0,
			tileSize, tileSize
		);
		addLevelLayout.anchor = {x : 0.0, y : 1.0};
		let addLevel = new Button(
			addLevelLayout,
			{
				onClick(e : MouseEvent) {
					console.log("add level!")
					levelSelect.options.push({
						label : "Level " + (levelSelect.options.length+1),
						id : levelSelect.options.length,
					});
					levelSelect.selectedIndex = levelSelect.options.length - 1;
					board.createLevel(board.grid.gridSize);
					board.setLevelWhileEditing(levelSelect.selectedIndex);
					gameSettingsGui.setLevel(
						levelOptions[levelSelect.selectedIndex],
						levelOptions.length > 1
					);
					return true;
				}
			},
		);
		addLevel.togglePaths = [ImagePaths.Icons["Plus"]];

		let toolbarLayout = new Layout(
			0, 0, -tileSize*3, -kTopbarBottomPadding,
			0, 0, tileSize*9, tileSize*1
		);
		toolbarLayout.anchor = {x: 0.0, y: 1.0};

		let toolbar = new Grid(
			{width: 9, height: 1},
			toolbarLayout,
			{
				populate(i : number, j : number) {
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
				onClick(i : number, j : number) {
					setToolFromToolbar(i, j);
				},
			}
		);
		toolbar.children = [];
		toolbar.children.push(toolRect);

		let downloadButtonLayout = new Layout(
			1, 0, -tileSize*1.75*2 + kGameSettingsWidth, -kTopbarBottomPadding,
			0, 0, tileSize, tileSize
		);
		downloadButtonLayout.anchor = {x : 1.0, y : 1.0};
		let downloadButton = new Button(
			downloadButtonLayout,
			{
				onClick(e : MouseEvent) {
					console.log("download ...");
					clearFeedback();
					let archive = JSON.stringify(
						board.save(_this.gameSettingsGui.save()),
						null,
						'\t'
					);
					console.log(archive);
					download(archive, _this.getTitle() + ".json", "application/json");
					return true;
				}
			},
		);
		downloadButton.togglePaths = [ImagePaths.Icons["Download"]];

		let uploadButtonLayout = new Layout(
			1, 0, -tileSize*1.75*1 + kGameSettingsWidth, -kTopbarBottomPadding,
			0, 0, tileSize, tileSize
		);
		uploadButtonLayout.anchor = {x : 1.0, y : 1.0};
		let uploadButton = new Button(
			uploadButtonLayout,
			{
				onClick(e : MouseEvent) {
					clearFeedback();
					let $upload = document.getElementById('upload') as HTMLElement;
					$upload.click();
					return true;
				}
			},
		);
		uploadButton.togglePaths = [ImagePaths.Icons["Upload"]];

		let trashButtonLayout = new Layout(
			1, 0, -tileSize*1.75*0 + kGameSettingsWidth, -kTopbarBottomPadding,
			0, 0, tileSize, tileSize
		);
		trashButtonLayout.anchor = {x : 1.0, y : 1.0};
		let trashButton = new Button(
			trashButtonLayout,
			{
				onClick(e : MouseEvent) {
					clearFeedback();
					console.log("trash it!")
					board.clear();
					return true;
				}
			},
		);
		trashButton.togglePaths = [ImagePaths.Icons["Trash"]];

		let playButtonLayout = new Layout(
			1, 0, -tileSize*1.75*3 + kGameSettingsWidth, -kTopbarBottomPadding,
			0, 0, tileSize, tileSize
		);
		playButtonLayout.anchor = {x : 1.0, y : 1.0};
		let playButton = new Button(
			playButtonLayout,
			{
				onClick(e : MouseEvent) {
					clearFeedback();
					board.toggleState();
					_this.levelSelect.selectedIndex = board.levelIndex;
					endStateOverlay.hide();
					return true;
				}
			},
		);
		playButton.togglePaths = [ImagePaths.Icons["Play"], ImagePaths.Icons["Pause"]];

		this.game = new Game(
			container,
			{
		    	onKeyDown(e : KeyboardEvent) {
		    		console.log("onKeyDown", e.key, e.ctrlKey, e.metaKey);
		    		if (board.state == BoardState.Edit) {
			    		let asNumber = parseInt(e.key);
			    		if (!isNaN(asNumber)) {
			    			setSelectedFromPalette(selectedCoord.i, asNumber);
			    		} else if (e.key == "b") {
			    			setSelectedFromPalette(0, selectedCoord.j);
			    		} else if (e.key == "i") {
			    			setSelectedFromPalette(1, selectedCoord.j);
			    		} else if (e.key == "f") {
			    			setSelectedFromPalette(2, selectedCoord.j);
			    		} else if((e.ctrlKey || e.metaKey) && e.key == "z") {
			    			if (board.state == BoardState.Edit) {
				    			board.editBoard.undo(board.data, board.grid);
				    		}
			    		}
			    	}
			    	return board.onKeyDown(e);
		    	},
		    	onUpdate(timeMS : DOMHighResTimeStamp) {
		    		board.onUpdate(timeMS);
		    	},
		    	screenWillResize(screenSize : Size, cp : ContentProvider) {

		    	},
		    	screenDidResize(screenSize : Size, cp : ContentProvider) {
		    		_this.screenDidResize(screenSize, cp);
		    	},
		    	needsLayout() {
		    		let ret = board.needsLayout;
		    		board.needsLayout = false;
		    		return ret;
		    	},
    		}	
    	);

    	let gridOverlay = new Container();
		this.game.components.push(board.grid);
		if (board.grid.children) {
			board.grid.children.push(palette);
			board.grid.children.push(toolbar);
			board.grid.children.push(playButton);
			board.grid.children.push(downloadButton);
			board.grid.children.push(uploadButton);
			board.grid.children.push(trashButton);
			board.grid.children.push(infobar);
			board.grid.children.push(gridOverlay);
			board.grid.children.push(endStateOverlay.background);
			board.grid.children.push(gameSettingsGui.rootComponent);
			board.grid.children.push(levelSelect);
			board.grid.children.push(addLevel);
		}

		board.setComponents(gridOverlay.children);
		this.game.doLayout();

		this.palette = palette;
		this.selectedRect = selectedRect;
		this.toolRect = toolRect;
		this.toolbar = toolbar;
		this.downloadButton = downloadButton;
		this.uploadButton = uploadButton;
		this.trashButton = trashButton;
		this.playButton = playButton;
		this.addLevelButton = addLevel;
		this.board = board;
		this.levelSelect = levelSelect;
		this.endStateOverlay = endStateOverlay;
		this.gameSettingsGui = gameSettingsGui;
		
		this.load(archive);
    }
}

function getUrlVars() {
    let vars : Map<string, string> = new Map();
    let parts = window.location.href.replace(
    	/[?&]+([^=&]+)=([^&]*)/gi,
    	function(m: string,key: string, value: string) {
        	vars.set(key, value);
        	return "";
    	}
    );
    return vars;
}

let getParams = getUrlVars();
let archive : any = {};
let example = getParams.get("example");
if (example == "LogicGates") {
	archive = Example_LogicGates;
} else if (example == "AGoodSnowmanIsHardToBuild") {
	archive = Example_AGoodSnowmanIsHardToBuild;
} else if (example == "Rule30") {
	archive = Example_Rule30;
} else if (example == "Tetris") {
	archive = Example_Tetris;
} else if (example == "Sokoban") {
	archive = Example_Sokoban;
} else if (example == "LangtonsAnt") {
	archive = Example_LangtonsAnt;
} else if (example == "WangTiles") {
	archive = Example_WangTiles;
} else {
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

let $container = document.getElementById('container')!;
let $playBilder = new Playbilder(
	$container,
	{width: width, height: height},
	archive
);
$playBilder.game.start();

let inputElement = document.getElementById("upload") as HTMLInputElement;
inputElement.addEventListener("change", handleFiles, false);
function handleFiles(e: Event) {
	console.log("handleFiles", e);
	console.log(e.target);
	let files = (e.target as HTMLInputElement).files;
	console.log(files);
	if (files && files.length > 0) {
		let reader = new FileReader();
		reader.onload = function (event) {
			if (event.target && event.target.result) {
				var obj = JSON.parse(event.target.result as string);
				console.log("reader has read:", obj);
				$playBilder.load(obj);
			}
		};
		reader.readAsText(files[0]);
	}
}

window.addEventListener('beforeunload', function (e) {
    console.log("beforeunload");
    let archive = JSON.stringify(
    	$playBilder.board.save($playBilder.gameSettingsGui.save()),
    	null,
    	'\t'
    );
    localStorage.setItem("archive", archive);
});
