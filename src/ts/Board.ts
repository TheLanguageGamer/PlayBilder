

enum BoardState {
	Play = 0,
	Edit,
};

class Board {

	grid : Grid;
	saved : number[][][];
	data : number[][][];
	buffer : number[][][];
	editBoard : EditBoard;
	playBoard? : PlayBoard;
	gameStepInterval : DOMHighResTimeStamp = 500;
	gameSettingsGui : GameSettingsGUI;
	needsLayout = false;

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
			this.copyData(this.saved, this.data);
			this.applyRealDataToGrid();
			this.state = BoardState.Edit;
		} else {
			this.copyData(this.data, this.saved);
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
			if (this.playBoard.onUpdate(
				timeMS,
				this.data,
				this.buffer,
				this.grid.gridSize)) {
				this.copyData(this.buffer, this.data);
				this.applyRealDataToGrid();
			}
		}
	}

	onKeyDown(e : KeyboardEvent) {
		if (this.state == BoardState.Play && this.playBoard) {
			this.copyData(this.data, this.buffer);
			if (this.playBoard.onKeyDown(
					e,
					this.data,
					this.buffer,
					this.grid.gridSize)) {
				this.copyData(this.buffer, this.data);
				this.applyRealDataToGrid();
			}
		} else if (this.state == BoardState.Edit) {
			this.editBoard.onKeyDown(e);
		}
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

	constructor (gridSize : Size, screenSize : Size) {

		let _this = this;
		this.gameSettingsGui = new GameSettingsGUI(gridSize, {
			onIntervalChanged(interval : number) {
				console.log("New interval:", interval);
				_this.gameStepInterval = interval;
			},
			onWidthChanged(width : number) {
				if (_this.grid && _this.grid.gridSize.width != width) {
					let newSize = {
						width : width,
						height : _this.grid.gridSize.height,
					};
					_this.resizeGrid(newSize);
				}
			},
			onHeightChanged(height : number) {
				if (_this.grid && _this.grid.gridSize.height != height) {
					let newSize = {
						width : _this.grid.gridSize.width,
						height : height,
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

		let widthRelative = gridSize.width/(gridSize.width + 6);
		let heightRelative = gridSize.height/(gridSize.height + 2);
		let gridLayout = new Layout(widthRelative/2, 2/gridSize.height, 0, 10,
			widthRelative,
			heightRelative, -kGameSettingsWidth, -40);
		gridLayout.anchor = {x: widthRelative/2, y: 0.0};
		gridLayout.aspect = (gridSize.width)/(gridSize.height);
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
						_this.editBoard.onMouseMove(e, _this.data, _this.grid);
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
		this.grid.children.push(this.gameSettingsGui.rootComponent);
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
					this.editBoard.respositionEdgesForRule(newRule, this.grid);
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
		this.editBoard.realSelectionRectangle = new Rectangle(new Layout(0, 0, 0, 0, 0, 0, 0, 0));
		this.editBoard.realSelectionBox = undefined;
		this.editBoard.isMovingRealSelection = false;
	}
	load(archive : any) {
		this.clear(true);
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
		} else {
			this.setupInputStates();
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
				this.editBoard.respositionEdgesForRule(rule, this.grid);
				if (rule) {
					rule.load(ruleArchive);
				}
			}
			this.editBoard.calculateReachability();
		}
	}
	didResize(screenSize : Size) {
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
			width : this.grid.gridSize.width,
			height : this.grid.gridSize.height,
			data : this.data,
			rules : rules,
			edges : edges,
			gameStepInterval : this.gameStepInterval,
			settings : this.gameSettingsGui.save(),
		};
	}
	setComponents(components : Component[]) {
		this.editBoard.setComponents(components);
		this.editBoard.gridLayout = this.grid.layout;
	}
}