

enum BoardState {
	Play = 0,
	Edit,
};

interface BoardController {
	onUserFeedback : (feedback : UserFeedback) => void;
	onWinning : () => void;
	onObjectSelected : (editRule? : EditRule) => void;
	onObjectUnselected : () => void;
}

function positiveModulo(m : number, n : number) {
	return ((m % n) + n) % n;
}

class CircularBuffer<T> {
	rootIndex : number = 0;
	currentIndex : number = 0;
	content : T[] = new Array();

	canPop() {
		return this.currentIndex != this.rootIndex;
	}

	pop() {
		console.assert(this.canPop());
		this.currentIndex = positiveModulo(this.currentIndex - 1, this.content.length);
		return this.content[this.currentIndex]; 
	}

	push() {
		this.currentIndex = positiveModulo(this.currentIndex + 1, this.content.length);
		if (this.currentIndex == this.rootIndex) {
			this.rootIndex = positiveModulo(this.rootIndex + 1, this.content.length);
		}
	}

	current() {
		return this.content[this.currentIndex];
	}

	reset() {
		this.rootIndex = 0;
		this.currentIndex = 0;
	}
}

class Board {

	controller : BoardController;
	grid : Grid;
	saved : number[][][];
	data : number[][][];
	buffer : number[][][];
	history? : CircularBuffer<number[][][]>;
	editBoard : EditBoard;
	playBoard? : PlayBoard;
	gameStepInterval : DOMHighResTimeStamp = 500;
	needsLayout = false;

	levels : number[][][];
	levelIndex : number = 0;
	startedLevelIndex : number = 0;

	state : BoardState = BoardState.Edit;

	dataToB64(data : number[][][], gridSize : Size) {
		
		let stuffSize = gridSize.width*gridSize.height*4;
		let stuff = [];
		for (let index = 0; index < stuffSize; ++index) {
			let k = Math.floor(index/(gridSize.width*gridSize.height));
			let indexOffset = index - k*gridSize.width*gridSize.height;
			let i = indexOffset%gridSize.width;
			let j = Math.floor(indexOffset/gridSize.width);
			stuff.push(data[i][j][k]);
		}

		let bytes = new Uint8Array(stuff);
	    var binary = '';
	    var len = bytes.byteLength;
	    for (var i = 0; i < len; i++) {
	        binary += String.fromCharCode( bytes[ i ] );
	    }
	    let bytesB64 = window.btoa(binary);

	    return bytesB64;
	}

	b64ToData(bytesB64 : string, data : number[][][], gridSize : Size) {
		let binary = window.atob(bytesB64);
		let bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; ++i) {
			bytes[i] = binary.charCodeAt(i);
		}

		//assert - binary.length == gridSize.width*gridSize.height*4

		for (let index = 0; index < binary.length; ++index) {
			let k = Math.floor(index/(gridSize.width*gridSize.height));
			let indexOffset = index - k*gridSize.width*gridSize.height;
			let i = indexOffset%gridSize.width;
			let j = Math.floor(indexOffset/gridSize.width);
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

		let rotations : number[] = [];
		for (let element of this.editBoard.rules) {
			let rule = element[1];
			while (rule.index >= rotations.length) {
				rotations.push(0);
			}
			//TODO, below is broken, no more "includeRotations"
			// if (rule.includeRotations) {
			// 	rotations[rule.index] = 1;
			// }
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

	copyData(from : number[][][], to : number[][][]) {
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
			this.levelIndex = this.startedLevelIndex;
			this.copyData(this.saved, this.data);
			this.applyRealDataToGrid();
			this.state = BoardState.Edit;
		} else {
			this.startedLevelIndex = this.levelIndex;
			this.copyData(this.data, this.saved);
			if (this.history) {
				this.copyData(this.data, this.history.current());
			}
			this.editBoard.unselectSelectedObject();
			this.playBoard = new PlayBoard(
				this.editBoard.edges,
				this.editBoard.rules,
				this.data,
				this.grid.gridSize,
				this.gameStepInterval
			);
			this.state = BoardState.Play;
		}
	}

	isEditing() {
		return this.state == BoardState.Edit;
	}

	applyRealDataToGrid() {
		for (let i = 0; i < this.grid.gridSize.width; ++i) {
			for (let j = 0; j < this.grid.gridSize.height; ++j) {
				this.editBoard.setGridCell(
					i,
					j,
					this.data[i][j][0],
					this.data[i][j][1],
					this.data[i][j][2],
					this.data[i][j][3],
					this.grid
				);
			}
		}
	}

	onUpdate(timeMS : DOMHighResTimeStamp) {
		if (this.state == BoardState.Play && this.playBoard) {
			this.copyData(this.data, this.buffer);
			let processState = this.playBoard.onUpdate(
				timeMS,
				this.data,
				this.buffer,
				this.grid.gridSize);
			if (processState.didProcess) {
				this.copyData(this.buffer, this.data);
				this.applyRealDataToGrid();
				if (processState.isWinning) {
					this.controller.onWinning();
				}
			}
		}
	}

	onKeyDown(e : KeyboardEvent) {
		if (this.state == BoardState.Play && this.playBoard) {
			this.copyData(this.data, this.buffer);
			let processState = this.playBoard.onKeyDown(
					e,
					this.data,
					this.buffer,
					this.grid.gridSize);
			if (processState.didProcess) {
				this.copyData(this.buffer, this.data);
				this.applyRealDataToGrid();
				if (processState.isWinning) {
					this.controller.onWinning();
				}
				if (this.history) {
					this.history.push();
					this.copyData(this.data, this.history.current());
				}
				return true;
			} else if (e.key == 'r') {
    			this.jumpToLevel(this.levelIndex);
    			return true;
    		} else if (e.key == 'z' && this.history && this.history.canPop()) {
    			let newData = this.history.pop();
    			this.copyData(newData, this.data);
    			this.applyRealDataToGrid();
    			return true;
    		}
		} else if (this.state == BoardState.Edit) {
			return this.editBoard.onKeyDown(e);
		}
		return false;
	}

	resizeGrid(newSize : Size) {
		let actualSize = {
			width : this.data.length,
			height : this.data[0].length,
		};
		for (let i = 0; i < newSize.width; ++i) {
			if (i >= actualSize.width) {
				this.saved.push(new Array());
				this.data.push(new Array());
				this.buffer.push(new Array());
				for (let k = 0; k < this.levels.length; ++k) {
					this.levels[k].push(new Array());
				}
			}
			for (let j = 0; j < newSize.height; ++j) {
				if (i >= actualSize.width || j >= actualSize.height) {
					this.saved[i].push([-1, -1, -1, -1]);
					this.data[i].push([-1, -1, -1, -1]);
					this.buffer[i].push([-1, -1, -1, -1]);
					for (let k = 0; k < this.levels.length; ++k) {
						this.levels[k][i].push(-1);
					}
				}
			}
		}
		this.grid.resizeGrid(newSize);
		this.needsLayout = true;
	}

	createLevel(gridSize : Size) {
		let level : number[][] = new Array();
		for (let i = 0; i < gridSize.width; ++i) {
			level.push(new Array());
			for (let j = 0; j < gridSize.height; ++j) {
				level[i].push(-1);
			}
		}
		this.levels.push(level);
	}

	setLevelWhileEditing(index : number) {
		console.assert(index >= 0 && index < this.levels.length);
		let currentLevel = this.levels[this.levelIndex];
		let newLevel = this.levels[index];
		for (let i = 0; i < this.grid.gridSize.width; ++i) {
			for (let j = 0; j < this.grid.gridSize.height; ++j) {
				currentLevel[i][j] = this.data[i][j][0];
				this.data[i][j][0] = newLevel[i][j];
			}
		}
		this.applyRealDataToGrid();
		this.levelIndex = index;
	}

	jumpToLevel(index : number) {
		console.assert(index >= 0 && index < this.levels.length);
		let newLevel = this.levels[index];
		for (let i = 0; i < this.grid.gridSize.width; ++i) {
			for (let j = 0; j < this.grid.gridSize.height; ++j) {
				this.data[i][j][0] = newLevel[i][j];
			}
		}
		this.applyRealDataToGrid();
		this.levelIndex = index;
		if (this.history) {
			this.history.reset();
			this.copyData(this.data, this.history.current());
		}
	}

	constructor (
		gridSize : Size,
		window : Box,
		screenSize : Size,
		controller : BoardController) {

		this.controller = controller;
		let _this = this;

		this.editBoard = new EditBoard({
			onObjectSelected(editRule? : EditRule) {
				_this.controller.onObjectSelected(editRule);
			},
			onObjectUnselected() {
				_this.controller.onObjectUnselected();
			},
			onUserFeedback(feedback : UserFeedback) {
				controller.onUserFeedback(feedback);
			},
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

		this.levels = new Array();
		this.createLevel(gridSize);

		let widthRelative = window.size.width/(window.size.width + 6);
		let heightRelative = window.size.height/(window.size.height + 2);
		let gridLayout = new Layout(
			widthRelative/2, 2/window.size.height, 0, 10 + 20,
			widthRelative, heightRelative, -kGameSettingsWidth, -40 - 10);
		gridLayout.anchor = {x: widthRelative/2, y: 0.0};
		gridLayout.aspect = (window.size.width)/(window.size.height);
		gridLayout.fixedAspect = true;

		this.grid = new Grid(
			{width: gridSize.width, height: gridSize.height},
			gridLayout,
			{
				populate(i : number, j : number) {
					return ["", "",];
				},
				onSelect(i : number, j : number) {
					if (_this.isEditing()) {
						_this.editBoard.onSelect(i, j, _this.data, _this.grid);
					}
				},
				onMouseDown(i : number, j : number, e : MouseEvent) {
					if (_this.isEditing()) {
						_this.editBoard.onMouseDown(i, j, e, _this.data, _this.grid);
					}
				},
				onMouseMove(i : number, j : number, e : MouseEvent) {
					if (_this.isEditing()) {
						_this.editBoard.onMouseMove(i, j, e, _this.data, _this.grid);
					}
				},
				onMouseUp(i : number, j : number, e : MouseEvent) {
					if (_this.isEditing()) {
						_this.editBoard.onMouseUp(i, j, _this.data, _this.grid);
					}
				},
			}
		);
		this.grid.layout.doLayout({
			position: {x:0, y:0},
			size: {width: screenSize.width, height: screenSize.height},
		});
		this.grid.children = [];
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
		this.editBoard.rulePad(this.grid.gridSize.width-2, 1, this.data, this.grid);
		this.grid.grid[this.grid.gridSize.width-2][1][0] = PlaybilderPaths.InputState["Win"];
		this.editBoard.edits.pop();
		this.editBoard.calculateReachability();
		this.editBoard.unselectSelectedObject();
		this.debugRules();
	}

	loadB64Data(b64Data : string, components : Component[]) {

		this.b64ToData(b64Data, this.data, this.grid.gridSize);
		this.applyRealDataToGrid();
		for (let i = 0; i < this.grid.gridSize.width; ++i) {
			for (let j = 0; j < this.grid.gridSize.height; ++j) {

				let ruleIndex = this.data[i][j][3];
				if (ruleIndex < 0) {
					continue;
				}
				this.editBoard.maxRuleIndex = Math.max(ruleIndex+1, this.editBoard.maxRuleIndex);
				let rule = this.editBoard.rules.get(ruleIndex);
				if (!rule) {
					let newRule = new EditRule(ruleIndex, this.grid.layout);
					components.push(newRule.line);
					this.editBoard.rules.set(ruleIndex, newRule);
					newRule.dirtyBoundaries = true;
					this.editBoard.calculateBoundaries(this.data, this.grid);
					this.editBoard.respositionEdgesForRule(newRule, this.data, this.grid);
				}
			}
		}
		this.editBoard.calculateReachability();
	}
	clear(includingDefaultRules : boolean = false) {
		//clear grid
		for (let i = 0; i < this.data.length; ++i) {
			for (let j = 0; j < this.data[0].length; ++j) {
				if (this.data[i][j][3] >= InputState.__Length
					|| this.data[i][j][3] < 0) {
					this.data[i][j] = [-1, -1, -1, -1];
				}
				if (this.saved[i][j][3] >= InputState.__Length
					|| this.saved[i][j][3] < 0) {
					this.saved[i][j] = [-1, -1, -1, -1];
				}
				if (this.buffer[i][j][3] >= InputState.__Length
					|| this.buffer[i][j][3] < 0) {
					this.buffer[i][j] = [-1, -1, -1, -1];
				}
			}
		}
		this.applyRealDataToGrid()
		
		this.editBoard.components.length = 0;
		this.editBoard.setComponents(this.editBoard.components);
		for (let element of this.editBoard.rules) {
			let rule = element[1];
			if (rule.index >= InputState.__Length || includingDefaultRules) {
				rule.disable();
			} else {
				this.editBoard.components.push(rule.line);
			}
		}
		this.editBoard.maxRuleIndex = includingDefaultRules ? 0 : InputState.__Length;

		this.editBoard.edges = new Array();
		this.editBoard.edge = undefined;
		this.editBoard.isAddingEdge = false;

		this.editBoard.selectedRule = undefined;
		this.editBoard.selectedEdge = undefined;

		this.editBoard.isMovingRule = false;
		this.editBoard.movingRuleIndex = -1;
		this.editBoard.movingLastCoordinate = {x : 0, y : 0};
		this.editBoard.movingStartCoordinate = {x : 0, y : 0};

		this.editBoard.isSelectingReal = false;
		this.editBoard.realSelectionBox = undefined;
		this.editBoard.isMovingRealSelection = false;
	}
	load(archive : any) {
		this.clear(true);
		if (archive.gameStepInterval) {
			this.gameStepInterval = archive.gameStepInterval;
		}
		if (archive.levels) {
			this.levels = archive.levels;
		}
		if (archive.data) {
			this.resizeGrid({
				width : archive.data.length,
				height : archive.data.length > 0 ? archive.data[0].length : 0,
			});
			this.data = archive.data;
			this.applyRealDataToGrid();
		} else {
			this.setupInputStates();
		}
		if (archive.levelIndex != undefined) {
			this.jumpToLevel(archive.levelIndex);
		}
		if (archive.edges && archive.rules) {
			for (let edgeArchive of archive.edges) {
				let edge = new Edge({
					tailRuleIndex : edgeArchive.tailRuleIndex,
					fromTool : Tool.EdgeAlways,
					parentLayout : this.grid.layout,
				});
				edge.load(edgeArchive);
				this.editBoard.components.push(edge.arrow);
				this.editBoard.edges.push(edge);
			}
			for (let ruleArchive of archive.rules) {
				this.editBoard.maxRuleIndex = Math.max(
					ruleArchive.index+1,
					this.editBoard.maxRuleIndex
				);
				let rule = new EditRule(ruleArchive.index, this.grid.layout);
				this.editBoard.components.push(rule.line);
				this.editBoard.rules.set(ruleArchive.index, rule);
				rule.dirtyBoundaries = true;
				this.editBoard.calculateBoundaries(this.data, this.grid);
				this.editBoard.respositionEdgesForRule(rule, this.data, this.grid);
				if (rule) {
					rule.load(ruleArchive);
				}
			}
			this.editBoard.calculateReachability();
		}
	}
	screenDidResize(screenSize : Size) {
		for (let element of this.editBoard.rules) {
			let rule = element[1];
			rule.line.layout.doLayout(this.grid.layout.computed);
			rule.dirtyBoundaries = true;
			this.editBoard.respositionEdgesForRule(rule, this.data, this.grid);
		}
		this.editBoard.calculateBoundaries(this.data, this.grid);
		for (let edge of this.editBoard.edges) {
			edge.arrow.layout.doLayout(this.grid.layout.computed);
		}
	}
	loadEdgesString(edgesString : string, type : Tool, components : Component[]) {
		let edgesParts = edgesString.split(",");
		for (let i = 0; i < edgesParts.length; i += 2) {
			console.log("edge", edgesParts[i], "to", edgesParts[i+1]);
			let tailPart = edgesParts[i];
			let headPart = edgesParts[i+1];
			if (tailPart && headPart) {
				let tailRuleIndex = parseInt(tailPart);
				let headRuleIndex = parseInt(headPart);	
				let edge = new Edge({
					tailRuleIndex : tailRuleIndex,
					fromTool : type,
					parentLayout : this.grid.layout,
				});
				edge.headRuleIndex = headRuleIndex;
				components.push(edge.arrow);
				this.editBoard.edges.push(edge);
			}
		}
	}
	save(settings : any) {
		let rules = [];
		for (let element of this.editBoard.rules) {
			let rule = element[1];
			rules.push(rule.save());
		}
		let edges = [];
		for (let edge of this.editBoard.edges) {
			edges.push(edge.save());
		}
		this.setLevelWhileEditing(this.levelIndex);
		return {
			width : this.grid.gridSize.width,
			height : this.grid.gridSize.height,
			data : this.data,
			levels : this.levels,
			levelIndex : this.levelIndex,
			rules : rules,
			edges : edges,
			gameStepInterval : this.gameStepInterval,
			settings : settings,
		};
	}
	setComponents(components : Component[]) {
		this.editBoard.setComponents(components);
		this.editBoard.gridLayout = this.grid.layout;
		console.assert(this.grid.children != undefined);
	}
}