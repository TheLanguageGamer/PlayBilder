
const ImagePaths = {
	Reals : [
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
	Ideas : [
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
	Futures : [
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
	Tools : <Record<string, string>> {
		"Pencil" : "images/tools/icons8-pencil-64.png",
		"Eraser" : "images/tools/icons8-eraser-64.png",
		"Move" : "images/tools/icons8-move-100.png",
		"Select" : "images/tools/icons8-one-finger-96.png",
		"RulePad" : "images/tools/toolRulePad.png",
		"EdgeAlways" : "images/tools/toolEdgeAlways.png",
		"EdgeIfMatched" : "images/tools/toolEdgeIfMatched.png",
		"EdgeIfNotMatched" : "images/tools/toolEdgeIfNotMatched.png",
		"EdgeParallel" : "images/tools/toolEdgeParallel.png",
	},
	InputState : <Record<string, string>> {
		"Computer" : "images/state/icons8-computer-80.png",
		"Left" : "images/state/icons8-left-96.png",
		"Right" : "images/state/icons8-right-96.png",
		"Up" : "images/state/icons8-up-96.png",
		"Down" : "images/state/icons8-down-arrow-96.png",
	},
	Icons : <Record<string, string>> {
		"Play" : "images/icons/icons8-play-100.png",
		"Pause" : "images/icons/icons8-pause-100.png",
		"Checkmark" : "images/icons/icons8-checkmark-104.png",
	},
};

enum InputState {
	Computer = 0,
	Left,
	Right,
	Up,
	Down,
	__Length,
}

enum Tool {
	Pencil = 0,
	Eraser,
	Move,
	Select,
	RulePad,
	EdgeAlways,
	EdgeIfMatched,
	EdgeIfNotMatched,
	EdgeParallel,
}

enum Modality {
	Real = 0,
	Idea = 1,
	Future = 2,
}

enum Direction {
	Left = 0,
	Right = 1,
	Down = 2,
	Up = 3,
}

class EditRule {
	index : number;
	size : number = 0;
	line : Line = new Line();
	boundaryEdges : Set<string> = new Set();
	boundaryPoints : Set<string> = new Set();
	dirtyBoundaries : boolean = true;
	includeRotations : boolean = false;
	private _reachable : boolean = false;
	constructor(index : number) {
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
	setReachable(value : boolean) {
		this.line.color = value ? Constants.Colors.Black : Constants.Colors.Grey;
		this._reachable = value;
	}
}

enum EdgeType {
	None = 0,
	Always = 1,
	IfMatched = 2,
	IfNotMatched = 3,
	Parallel = 4,
}

class Edge {
	type : EdgeType = EdgeType.Always;
	tailRuleIndex : number;
	headRuleIndex : number = -1;
	arrow : Arrow = new Arrow();
	constructor(obj : {tailRuleIndex : number, fromTool : Tool}) {
		this.tailRuleIndex = obj.tailRuleIndex;
		if (obj.fromTool == Tool.EdgeAlways) {
			this.setEdgeType(EdgeType.Always);
		} else if (obj.fromTool == Tool.EdgeIfMatched) {
			this.setEdgeType(EdgeType.IfMatched);
		} else if (obj.fromTool == Tool.EdgeIfNotMatched) {
			this.setEdgeType(EdgeType.IfNotMatched);
		} else if (obj.fromTool == Tool.EdgeParallel) {
			this.setEdgeType(EdgeType.Parallel);
		}
	}
	setEdgeType(type : EdgeType) {
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
	findClosestPoint(pos : Pos, rule : EditRule, grid : Grid) {
		let ret = {x : 0, y : 0};
		let minDistance1 = -1;
		let minDistance2 = -1;
		let bestPos1 = {x : 0, y : 0};
		let bestPos2 = {x : 0, y : 0};
		for (let sideJson of rule.boundaryEdges) {
			let side = JSON.parse(sideJson);
			let firstPos = grid.getPositionForCoordinate(side[0], side[1]);
			let secondPos = grid.getPositionForCoordinate(side[2], side[3]);
			let distance1 = calculateDistance(pos, firstPos);
			let distance2 = calculateDistance(pos, secondPos);
			let average = (distance1 + distance2)/2;
			if (minDistance1 < 0 || average < (minDistance1 + minDistance2)/2) {
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

enum EditType {
	NoOpt = 0,
	CellEdit = 1,
	RuleMove = 2,
}

class Edit {
	type : EditType = EditType.NoOpt;
}

class CellEdit extends Edit {
	type : EditType = EditType.CellEdit
	i : number
	j : number
	cellData : number[]
	constructor(obj : {i : number, j : number, cellData : number[]}) {
		super();
		this.i = obj.i;
		this.j = obj.j;
		this.cellData = obj.cellData;
	}
}

class RuleMove extends Edit {
	type : EditType = EditType.RuleMove
	deltaI : number
	deltaJ : number
	ruleIndex : number
	constructor(obj : {deltaI : number, deltaJ : number, ruleIndex : number}) {
		super();
		this.deltaI = obj.deltaI;
		this.deltaJ = obj.deltaJ;
		this.ruleIndex = obj.ruleIndex;
	}
}

class RuleOptionsGUI {
	rootComponent : Component;
	rotationsCheckbox : Checkbox;
	rule? : EditRule;

	constructor() {
		let ruleOptionsLayout = new Layout(1, 0, 10, 0, 0, 0, 100, 200);
		let ruleOptions = new Rectangle(ruleOptionsLayout);
		ruleOptions.lineWidth = 1;

		let rotationsCheckboxLayout = new Layout(0, 0, 5, 5, 0, 0, 12, 12);
		let _this = this;
		this.rotationsCheckbox = new Checkbox(
			rotationsCheckboxLayout,
			{
				onValueChanged(value : boolean) {
					if (_this.rule) {
						_this.rule.includeRotations = value;
					}
				}
			}
		);
		ruleOptions.children = [];
		ruleOptions.children.push(this.rotationsCheckbox);

		let rotationsLabelLayout = new Layout(0, 0, 22, 22, 0, 0, 0, 0);
		let rotationsLabel = new TextBox(rotationsLabelLayout, "Include Rotations");
		rotationsLabel.setFontSize(12);
		rotationsLabel.fileStyle = Constants.Colors.Black;
		ruleOptions.children.push(rotationsLabel);

		this.rootComponent = ruleOptions;
		this.hide();
	}

	hide() {
		this.rootComponent.layout.visible = false;
	}

	show(rule : EditRule) {
		this.rule = rule;
		this.rootComponent.layout.visible = true;
		this.rotationsCheckbox.value = this.rule.includeRotations;
	}
}

class EditBoard {

	components : Component[] = [];
	ruleOptions : RuleOptionsGUI = new RuleOptionsGUI();

	editTool : Tool = Tool.Pencil;
	editModality : Modality = Modality.Real;
	editBlockType : number = 0;

	selectedRule? : EditRule;
	selectedEdge? : Edge;

	isMoving : boolean = false;
	movingRuleIndex : number = -1;
	movingLastCoordinate : Pos = {x : 0, y : 0};
	movingStartCoordinate : Pos = {x : 0, y : 0};

	isAddingEdge : boolean = false;
	edge? : Edge;
	edges : Edge[] = new Array();

	rules : Map<number, EditRule> = new Map();
	maxRuleIndex : number = 0;

	edits : Edit[] = [];

	findAdjacentRule(i : number, j : number,
		data : number[][][], gridSize : Size) {
		let rule = -1;
		let count = 0;
		//left
		if (i > 0) {
			let other = data[i-1][j][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//up
		if (j > 0) {
			let other = data[i][j-1][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//right
		if (i < gridSize.width-1) {
			let other = data[i+1][j][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//down
		if (j < gridSize.height-1) {
			let other = data[i][j+1][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//upper left
		if (i > 0 && j > 0) {
			let other = data[i-1][j-1][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//uper right
		if (i < gridSize.width-1 && j > 0) {
			let other = data[i+1][j-1][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//lower left
		if (i > 0 && j < gridSize.height-1) {
			let other = data[i-1][j+1][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		//lower right
		if (i < gridSize.width-1 && j < gridSize.height-1) {
			let other = data[i+1][j+1][3];
			if (other > -1) {
				count += rule != other ? 1 : 0;
				rule = other;
			}
		}
		return {
			rule : rule,
			count : count,
		};
	}

	hasRule(i : number, j : number, ruleIndex : number,
		data : number[][][], gridSize : Size) {
		if (i < 0 || j < 0 || i >= gridSize.width || j >= gridSize.height) {
			return false;
		}
		return data[i][j][3] == ruleIndex;
	}

	needsEdgeToRight(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return !this.hasRule(i, j-1, rule.index, data, gridSize)
				&& this.hasRule(i, j, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i+1, j]));
	}

	advanceRight(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (this.needsEdgeToRight(rule, i, j, data, grid.gridSize)) {
			//move right
			rule.line.points.push(grid.getPositionForCoordinate(i+1, j));
			rule.boundaryEdges.add(JSON.stringify([i, j, i+1, j]));
			return true;
		}
		return false;
	}

	needsEdgeToUp(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return this.hasRule(i, j-1, rule.index, data, gridSize)
				&& !this.hasRule(i-1, j-1, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i, j-1]));
	}

	advanceUp(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (this.needsEdgeToUp(rule, i, j, data, grid.gridSize)) {
			//move up
			rule.line.points.push(grid.getPositionForCoordinate(i, j-1));
			rule.boundaryEdges.add(JSON.stringify([i, j, i, j-1]));
			return true;
		}
		return false;
	}

	needsEdgeToLeft(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return this.hasRule(i-1, j-1, rule.index, data, gridSize)
				&& !this.hasRule(i-1, j, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i-1, j]));
	}

	advanceLeft(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (this.needsEdgeToLeft(rule, i, j, data, grid.gridSize)) {
			//move left
			rule.line.points.push(grid.getPositionForCoordinate(i-1, j));
			rule.boundaryEdges.add(JSON.stringify([i, j, i-1, j]));
			return true;
		}
		return false;
	}

	needsEdgeToDown(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return this.hasRule(i-1, j, rule.index, data, gridSize)
				&& !this.hasRule(i, j, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i, j+1]));
	}

	advanceDown(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (this.needsEdgeToDown(rule, i, j, data, grid.gridSize)) {
			//move down
			rule.line.points.push(grid.getPositionForCoordinate(i, j+1));
			rule.boundaryEdges.add(JSON.stringify([i, j, i, j+1]));
			return true;
		}
		return false;
	}

	advanceBoundary(direction : Direction, rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {

		if (direction == Direction.Up || direction == Direction.Left) {
			if (this.advanceDown(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Down, rule, i, j+1, data, grid);
			} else if (this.advanceLeft(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Left, rule, i-1, j, data, grid);
			} else if (this.advanceRight(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Right, rule, i+1, j, data, grid);
			} else if (this.advanceUp(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Up, rule, i, j-1, data, grid);
			}
		} else {
			if (this.advanceRight(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Right, rule, i+1, j, data, grid);
			} else if (this.advanceUp(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Up, rule, i, j-1, data, grid);
			} else if (this.advanceDown(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Down, rule, i, j+1, data, grid);
			} else if (this.advanceLeft(rule, i, j, data, grid)) {
				this.advanceBoundary(Direction.Left, rule, i-1, j, data, grid);
			}
		}
	}

	calculateBoundaries(data : number[][][], grid : Grid) {
		this.rules.forEach(function(rule : EditRule) {
			rule.size = 0;
			if (rule.dirtyBoundaries) {
				rule.boundaryEdges.clear();
				rule.line.points.length = 0;
				rule.dirtyBoundaries = false;
			}
		});
		for (let i = 0; i < grid.gridSize.width; ++i) {
			for (let j = 0; j < grid.gridSize.height; ++j) {
				let ruleIndex = data[i][j][3];
				let rule = this.rules.get(ruleIndex);
				if (rule) {
					rule.size += 1;
					if (this.needsEdgeToRight(rule, i, j, data, grid.gridSize)) {
						let pos = grid.getPositionForCoordinate(i, j);
						rule.line.points.push({x : pos.x, y : pos.y, isMove : true});
						this.advanceBoundary(Direction.Right, rule, i, j, data, grid);
					}
				}
			}
		}
	}

	visitRuleIndex(i : number, j : number,
		countIndex : number, maskIndex : number,
		data : number[][][], gridSize : Size) {
		if (i < 0 || j < 0 || i >= gridSize.width || j >= gridSize.height) {
			return;
		}
		if (data[i][j][3] == countIndex) {
			data[i][j][3] = maskIndex;
			this.visitRuleIndex(i-1, j-1, countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i  , j-1, countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i+1, j-1, countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i-1, j  , countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i+1, j  , countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i-1, j+1, countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i  , j+1, countIndex, maskIndex, data, gridSize);
			this.visitRuleIndex(i+1, j+1, countIndex, maskIndex, data, gridSize);
		}
	}

	isConnected(rule : EditRule, data : number[][][], gridSize : Size) {
		let finished = false;
		let maskIndex = -2;
		for (let i = 0; i < gridSize.width && !finished; ++i) {
			for (let j = 0; j < gridSize.height && !finished; ++j) {
				let otherIndex = data[i][j][3];
				if (otherIndex == rule.index) {
					finished = true;
					this.visitRuleIndex(i, j, rule.index, maskIndex, data, gridSize);
				}
			}
		}

		//count
		let count = 0;
		for (let i = 0; i < gridSize.width; ++i) {
			for (let j = 0; j < gridSize.height; ++j) {
				let otherIndex = data[i][j][3];
				if (otherIndex == maskIndex) {
					count += 1;
					data[i][j][3] = rule.index;
				}
			}
		}

		return rule.size == count;
	}

	doesntBlockRuleIndex(ruleIndex : number, i : number, j : number,
		data : number[][][], grid : Grid) {

		return !grid.isValidCoordinate(i, j)
				|| data[i][j][3] == ruleIndex
				|| data[i][j][3] == -1;
	}

	canHaveRuleIndex(ruleIndex : number, i : number, j : number,
		data : number[][][], grid : Grid) {

		return grid.isValidCoordinate(i, j)
				&& data[i][j][0] < 0
				&& this.doesntBlockRuleIndex(ruleIndex, i-1, j-1, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i-0, j-1, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i+1, j-1, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i-1, j+0, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i-0, j+0, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i+1, j+0, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i-1, j+1, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i-0, j+1, data, grid)
				&& this.doesntBlockRuleIndex(ruleIndex, i+1, j+1, data, grid);
	}

	canMoveRuleIndex(ruleIndex : number, deltaI : number, deltaJ : number,
		data : number[][][], grid : Grid) {

		let ret = true;
		for (let i = 0; i < grid.gridSize.width; ++i) {
			for (let j = 0; j < grid.gridSize.height; ++j) {
				let otherIndex = data[i][j][3];
				if (otherIndex == ruleIndex) {
					ret = ret && this.canHaveRuleIndex(ruleIndex, i + deltaI, j + deltaJ, data, grid);
				}
			}
		}
		return ret;
	}

	doMoveRuleIndex(ruleIndex : number, deltaI : number, deltaJ : number,
		data : number[][][], grid : Grid) {

		if (deltaI <= 0 && deltaJ <= 0) {
			for (let i = 0; i < grid.gridSize.width; ++i) {
				for (let j = 0; j < grid.gridSize.height; ++j) {
					let otherIndex = data[i][j][3];
					if (otherIndex == ruleIndex) {
						this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
					}
				}
			}
		} else if (deltaI >= 0 && deltaJ >= 0) {
			for (let i = grid.gridSize.width-1; i >= 0; --i) {
				for (let j = grid.gridSize.height-1; j >= 0; --j) {
					let otherIndex = data[i][j][3];
					if (otherIndex == ruleIndex) {
						this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
					}
				}
			}
		} else if (deltaI <= 0 && deltaJ >= 0) {
			for (let i = 0; i < grid.gridSize.width; ++i) {
				for (let j = grid.gridSize.height-1; j >= 0; --j) {
					let otherIndex = data[i][j][3];
					if (otherIndex == ruleIndex) {
						this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
					}
				}
			}
		} else if (deltaI >= 0 && deltaJ <= 0) {
			for (let i = grid.gridSize.width-1; i >= 0; --i) {
				for (let j = grid.gridSize.height-1; j >= 0; --j) {
					let otherIndex = data[i][j][3];
					if (otherIndex == ruleIndex) {
						this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
					}
				}
			}
		}
	}

	canDrawRule(i : number, j : number, data : number[][][], gridSize : Size) {
		return this.findAdjacentRule(i, j, data, gridSize).count <= 1;
	}

	rulePad(i : number, j : number, data : number[][][], grid : Grid) {
		let realType = data[i][j][0];
		let ruleIndex = data[i][j][3];

		if (ruleIndex <= -1 && realType <= -1) {
			let adjacencies = this.findAdjacentRule(i, j, data, grid.gridSize);
			if (adjacencies.count > 1) {
				//TODO: can't join rules
				return -1;
			}
			let newRuleIndex = adjacencies.rule;
			if (newRuleIndex >= 0 && newRuleIndex < InputState.__Length) {
				//error, can't extend rule for input states
				return -1;
			}
			if (newRuleIndex <= -1) {
				newRuleIndex = this.maxRuleIndex;
				this.maxRuleIndex += 1;
				let rule = new EditRule(newRuleIndex);
				this.components.push(rule.line);
				this.rules.set(newRuleIndex, rule);
			}
			console.log("ruleIndex", newRuleIndex, adjacencies.count);
			this.edits.push(new CellEdit({
				i : i,
				j : j,
				cellData : data[i][j].slice(0),
			}));
			this.setCell(
				i,
				j,
				data[i][j][0],
				data[i][j][1],
				data[i][j][2],
				newRuleIndex,
				data,
				grid);
			
			let rule = this.rules.get(newRuleIndex);
			if (rule) {
				rule.dirtyBoundaries = true;
				this.calculateBoundaries(data, grid);
				this.respositionEdgesForRule(rule, grid);
				this.selectRuleIndex(newRuleIndex);
			}
			return newRuleIndex;
		}
		if (ruleIndex > -1) {
			this.selectRuleIndex(ruleIndex);
		}
		return ruleIndex;
	}

	erase(i : number, j : number, data : number[][][], grid : Grid) {
		let ruleIndex = data[i][j][3];
		if (ruleIndex >= 0 && ruleIndex < InputState.__Length) {
			//error, can't input state rules
			return;
		}
		if (data[i][j][0] != -1
			|| data[i][j][1] != -1
			|| data[i][j][2] != -1
			|| data[i][j][3] != -1) {

			this.edits.push(new CellEdit({
				i : i,
				j : j,
				cellData : data[i][j].slice(0),
			}));
		}

		let rule = this.rules.get(ruleIndex);

		//update model
		data[i][j][0] = -1;
		data[i][j][1] = -1;
		data[i][j][2] = -1;
		data[i][j][3] = -1;

		//update view
		grid.grid[i][j][0] = "";
		grid.grid[i][j][1] = "";

		if (rule) {
			rule.dirtyBoundaries = true;
			this.calculateBoundaries(data, grid);
			if (rule.size == 0) {
				rule.disable();
			} else if (!this.isConnected(rule, data, grid.gridSize)) {
				this.undo(data, grid);
			}
			if (rule.isEnabled()) {
				this.respositionEdgesForRule(rule, grid);
			} else {
				this.disableEdgesForRule(rule);
				this.calculateReachability();
			}
		}
	}

	pencil(i : number, j : number, data : number[][][], grid : Grid) {
		let editModality = this.editModality;
		let editBlockType = this.editBlockType;

		let realType = data[i][j][0];
		let ideaType = data[i][j][1];
		let futureType = data[i][j][2];
		let ruleIndex = data[i][j][3];

		//assert !(realType > -1 && (futureType > -1 || ideaType > -1))
		//assert !hasRulePad || (ideaType == -1 && futureType == -1)

		let newRealType : number = realType;
		let newIdeaType : number = ideaType;
		let newFutureType : number = futureType;
		let newRuleIndex : number = ruleIndex;

		if (ruleIndex >= 0 && ruleIndex < InputState.__Length) {
			//error, can't change input state rules
			return;
		} else if (editModality != Modality.Real
			&& !this.canDrawRule(i, j, data, grid.gridSize)) {
			//error
			return;
		} else if (ruleIndex > -1 && editModality == Modality.Real) {
			//error
			return;
		} else if (editModality == Modality.Real && realType == editBlockType) {
			//erase
			this.unselectSelectedObject();
			newRealType = -1;
		} else if (editModality == Modality.Idea && ideaType == editBlockType) {
			//erase
			newIdeaType = -1;
		} else if (editModality == Modality.Future && futureType == editBlockType) {
			//erase
			newFutureType = -1;
		} else if (editModality == Modality.Real) {
			this.unselectSelectedObject();
			newRealType = editBlockType;
		} else if (editModality == Modality.Idea) {
			newIdeaType = editBlockType;
			newRuleIndex = this.rulePad(i, j, data, grid);
		} else if (editModality == Modality.Future) {
			newFutureType = editBlockType;
			newRuleIndex = this.rulePad(i, j, data, grid);
		}

		this.edits.push(new CellEdit({
			i : i,
			j : j,
			cellData : data[i][j].slice(0),
		}));
		this.setCell(
			i,
			j,
			newRealType,
			newIdeaType,
			newFutureType,
			newRuleIndex,
			data,
			grid);
	}

	undoCellEdit(cellEdit : CellEdit, data : number[][][], grid : Grid) {
		let currentRuleIndex = data[cellEdit.i][cellEdit.j][3];
		let ruleChanged = cellEdit.cellData[3] != currentRuleIndex;
		this.setCell(
			cellEdit.i,
			cellEdit.j,
			cellEdit.cellData[0],
			cellEdit.cellData[1],
			cellEdit.cellData[2],
			cellEdit.cellData[3],
			data,
			grid
		)
		if (ruleChanged) {
			let rule = this.rules.get(cellEdit.cellData[3]) || this.rules.get(currentRuleIndex);
			if (rule) {
				rule.dirtyBoundaries = true;
				this.calculateBoundaries(data, grid);
				if (rule.size == 0) {
					rule.disable();
					this.disableEdgesForRule(rule);
				} else {
					rule.enable();
					this.respositionEdgesForRule(rule, grid);
				}
			}
		}
	}

	undoRuleMove(ruleMove : RuleMove, data : number[][][], grid : Grid) {
		this.doMoveRuleIndex(ruleMove.ruleIndex, ruleMove.deltaI, ruleMove.deltaJ, data, grid);
		let rule = this.rules.get(ruleMove.ruleIndex);
		if (rule) {
			rule.dirtyBoundaries = true;
			this.calculateBoundaries(data, grid);
			this.respositionEdgesForRule(rule, grid);
		}
	}

	undo(data : number[][][], grid : Grid) {
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
					let cellEdit = edit as CellEdit;
					this.undoCellEdit(cellEdit, data, grid);
					break;
				}
				case EditType.RuleMove: {
					let ruleMove = edit as RuleMove;
					this.undoRuleMove(ruleMove, data, grid);
					break;
				}
			}
		}
	}

	setGridCell(
		i : number,
		j : number,
		realType : number,
		ideaType : number,
		futureType : number,
		rulePad : number,
		grid : Grid ) {

		//set grid cell path
		if (rulePad >= 0 && rulePad < InputState.__Length) {
			grid.grid[i][j][0] = ImagePaths.InputState[InputState[rulePad]];
			grid.grid[i][j][1] = "";
		} else if (realType > -1) {
			grid.grid[i][j][0] = ImagePaths.Reals[realType];
		} else if (ideaType > -1 && futureType > -1) {
			grid.grid[i][j][0] = ImagePaths.Ideas[ideaType];
			grid.grid[i][j][1] = ImagePaths.Futures[futureType];
		} else if (ideaType > -1) {
			grid.grid[i][j][0] = "";
			grid.grid[i][j][1] = ImagePaths.Ideas[ideaType];
		} else if (futureType > -1) {
			grid.grid[i][j][0] = ImagePaths.Futures[futureType];
			grid.grid[i][j][1] = "";
		} else {
			grid.grid[i][j][0] = "";
			grid.grid[i][j][1] = "";
		}
	}

	setCell(
		i : number,
		j : number,
		realType : number,
		ideaType : number,
		futureType : number,
		rulePad : number,
		data : number[][][],
		grid : Grid) {

		data[i][j][0] = realType;
		data[i][j][1] = ideaType;
		data[i][j][2] = futureType;
		data[i][j][3] = rulePad;

		this.setGridCell(i, j, realType, ideaType, futureType, rulePad, grid);
	}

	swapCells(i1 : number, j1 : number, i2 : number, j2 : number,
		data : number[][][], grid : Grid) {

		let temp0 = data[i1][j1][0];
		let temp1 = data[i1][j1][1];
		let temp2 = data[i1][j1][2];
		let temp3 = data[i1][j1][3];

		this.setCell(
			i1,
			j1,
			data[i2][j2][0],
			data[i2][j2][1],
			data[i2][j2][2],
			data[i2][j2][3], data, grid);
		this.setCell(i2, j2, temp0, temp1, temp2, temp3, data, grid);
	}

	onSelect(i : number, j : number, data : number[][][], grid : Grid) {
		switch (this.editTool) {
			case Tool.Pencil: {
				this.pencil(i, j, data, grid);
				break;
			}
			case Tool.Eraser: {
				this.erase(i, j, data, grid);
				break;
			}
			case Tool.RulePad: {
				this.rulePad(i, j, data, grid);
				break;
			}
			default: {
				break;
			}
		}
	}

	selectRuleIndex(ruleIndex : number) {
		this.unselectSelectedObject();
		let rule = this.rules.get(ruleIndex);
		if (rule) {
			this.ruleOptions.show(rule);
			rule.line.lineDashSpeed = -0.333;
			this.selectedRule = rule;
		}
		//else, panic!
	}

	unselectSelectedObject() {
		if (this.selectedRule) {
			this.ruleOptions.hide();
			this.selectedRule.line.lineDashSpeed = 0;
			this.selectedRule = undefined;
		}
		if (this.selectedEdge) {
			this.selectedEdge.arrow.lineWidth = 3;
			this.selectedEdge.arrow.headMargin = 6;
			this.selectedEdge = undefined;
		}
	}

	selectEdge(edge : Edge) {
		edge.arrow.lineWidth = 5;
		edge.arrow.headMargin = 10;
		this.selectedEdge = edge;
	}

	findEdgeToSelect(e : MouseEvent) : undefined | Edge {
		let returnEdge = undefined;
		let minDistance = 6;
		for (let edge of this.edges) {
			let distance = minimumDistanceToLineSegment(
				{x : e.offsetX, y : e.offsetY},
				edge.arrow.from,
				edge.arrow.to
			);
			if (distance < minDistance) {
				minDistance = distance;
				returnEdge = edge;
			}
		}
		return returnEdge;
	}

	onMouseDown(i : number, j : number, e : MouseEvent,
		data : number[][][], grid : Grid) {
		switch (this.editTool) {
			case Tool.Move: {
				let ruleIndex = data[i][j][3];
				if (ruleIndex > -1) {
					this.isMoving = true;
					this.movingRuleIndex = ruleIndex;
					this.movingStartCoordinate.x = i;
					this.movingStartCoordinate.y = j;
					this.movingLastCoordinate.x = i;
					this.movingLastCoordinate.y = j;
					this.selectRuleIndex(ruleIndex);
				} else {
					this.unselectSelectedObject();
				}
				break;
			}
			case Tool.EdgeAlways:
			case Tool.EdgeIfMatched:
			case Tool.EdgeIfNotMatched:
			case Tool.EdgeParallel: {
				let ruleIndex = data[i][j][3];
				let rule = this.rules.get(ruleIndex);
				if (ruleIndex > -1 && rule) {
					this.isAddingEdge = true;
					let edge = new Edge({
						tailRuleIndex : ruleIndex,
						fromTool : this.editTool,
					});
					edge.arrow.to.x = e.offsetX;
					edge.arrow.to.y = e.offsetY;
					edge.arrow.from = edge.findClosestPoint(
						edge.arrow.to,
						rule,
						grid
					);
					this.edge = edge;
					this.components.push(edge.arrow);
				}
				break;
			}
			case Tool.Select: {
				this.unselectSelectedObject();
				let edge = this.findEdgeToSelect(e);
				let ruleIndex = data[i][j][3];
				if (edge) {
					this.selectEdge(edge);
				} else if (ruleIndex > -1) {
					this.selectRuleIndex(ruleIndex);
				}
				break;
			}
			default: {
				break;
			}
		}
	}

	onMouseMove(e : MouseEvent, data : number[][][], grid : Grid) {
		if (this.isMoving) {
			let currentI = grid.getCoordinateForXPosition(e.offsetX);
			let currentJ = grid.getCoordinateForYPosition(e.offsetY);
			let deltaI = currentI - this.movingLastCoordinate.x;
			let deltaJ = currentJ - this.movingLastCoordinate.y;
			if (deltaI == 0 && deltaJ == 0) {
				//do nothing
			} else if (this.canMoveRuleIndex(this.movingRuleIndex, deltaI, deltaJ, data, grid)) {
				this.doMoveRuleIndex(this.movingRuleIndex, deltaI, deltaJ, data, grid);
				this.movingLastCoordinate.x = currentI;
				this.movingLastCoordinate.y = currentJ;
				let rule = this.rules.get(this.movingRuleIndex);
				if (rule) {
					rule.dirtyBoundaries = true;
					this.calculateBoundaries(data, grid);
					this.respositionEdgesForRule(rule, grid);
				}
			} else {
				//error, can't move rule here
			}
		} else if (this.isAddingEdge) {
			if (this.edge) {
				let rule = this.rules.get(this.edge.tailRuleIndex);
				if (rule) {
					this.edge.arrow.to.x = e.offsetX;
					this.edge.arrow.to.y = e.offsetY;
					this.edge.arrow.from = this.edge.findClosestPoint(
						this.edge.arrow.to,
						rule,
						grid
					);
				}
			}
		}
	}

	disableEdgesForRule(rule : EditRule) {
		for (let edge of this.edges) {
			if (edge.tailRuleIndex == rule.index
				|| edge.headRuleIndex == rule.index) {
				edge.disable();
			}
		}
	}

	respositionEdgesForRule(rule : EditRule, grid : Grid) {
		for (let edge of this.edges) {
			//TODO recalculate both arrow from and to if either tail or head index matches
			if (edge.tailRuleIndex == rule.index) {
				edge.arrow.from = edge.findClosestPoint(
					edge.arrow.to,
					rule,
					grid
				);
				let other = this.rules.get(edge.headRuleIndex);
				if (other) {
					edge.arrow.to = edge.findClosestPoint(
						edge.arrow.from,
						other,
						grid
					);
				}
			}
			if (edge.headRuleIndex == rule.index) {
				edge.arrow.to = edge.findClosestPoint(
					edge.arrow.from,
					rule,
					grid
				);
				let other = this.rules.get(edge.tailRuleIndex);
				if (other) {
					edge.arrow.from = edge.findClosestPoint(
						edge.arrow.to,
						other,
						grid
					);
				}
			}
		}
	}

	isRuleGraphCyclic_VisitRule(rule : EditRule, visited : boolean[], recStack : boolean[]) {
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
					} else if (recStack[neighbor.index]) {
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
		let shouldVisit : EditRule[] = [];
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

	canConnect(edge : Edge, rule : EditRule) {
		if (rule.index < InputState.__Length) {
			//error, can't connect input states
			return false;
		}
		for (let other of this.edges) {
			if (other.tailRuleIndex == edge.tailRuleIndex
				&& other.headRuleIndex == rule.index) {
				//error: Any two rules can only connected by a single side
				return false;
			}
		}
		return true;
	}

	onMouseUp(i : number, j : number, data : number[][][], grid : Grid) {

		if (this.isMoving) {
			let deltaI = this.movingLastCoordinate.x - this.movingStartCoordinate.x;
			let deltaJ = this.movingLastCoordinate.y - this.movingStartCoordinate.y;

			if (deltaI != 0 || deltaJ != 0) {
				this.edits.push(new RuleMove({
					deltaI : -deltaI,
					deltaJ : -deltaJ,
					ruleIndex : this.movingRuleIndex,
				}));
			}

			this.isMoving = false;
			this.movingRuleIndex = -1;
			this.movingStartCoordinate.x = 0;
			this.movingStartCoordinate.y = 0;
			this.movingLastCoordinate.x = 0;
			this.movingLastCoordinate.y = 0;
		} else if (this.isAddingEdge) {
			this.isAddingEdge = false;
			if (this.edge) {
				let ruleIndex = data[i][j][3];
				let rule = this.rules.get(ruleIndex);
				if (ruleIndex > -1
					&& rule
					&& this.canConnect(this.edge, rule)) {
					this.edge.arrow.to = this.edge.findClosestPoint(
						this.edge.arrow.from,
						rule,
						grid
					);
					this.edge.headRuleIndex = ruleIndex;
					this.edges.push(this.edge);
					if (this.isRuleGraphCyclic()) {
						//error: Edge makes rules graph cyclic
						this.edge.disable();
					} else {
						this.calculateReachability();
					}
				} else {
					this.edge.disable();
				}
			}
		}
	}
}