

class EditRule {
	index : number;
	include90Rotation : boolean = false;
	include180Rotation : boolean = false;
	include270Rotation : boolean = false;

	size : number = 0;
	line : Line = new Line();
	boundaryEdges : Set<string> = new Set();
	boundaryPoints : Set<string> = new Set();
	dirtyBoundaries : boolean = true;
	title : string;
	private _reachable : boolean = false;
	constructor(index : number, parentLayout : Layout) {
		this.index = index;
		this.line.color = Constants.Colors.Grey;
		this.line.lineDash = [7, 3];
		this.line.layout.doLayout(parentLayout.computed);
		this.title = "Rule " + String(index);
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
	save() {
		return {
			index : this.index,
			include90Rotation : this.include90Rotation,
			include180Rotation : this.include180Rotation,
			include270Rotation : this.include270Rotation,
		};
	}
	load(obj : {
		index : number,
		includeRotations? : boolean,
		include90Rotation? : boolean,
		include180Rotation? : boolean,
		include270Rotation? : boolean,
	}) {
		this.index = obj.index;
		if (obj.includeRotations !== undefined) {
			this.include90Rotation = obj.includeRotations;
			this.include180Rotation = obj.includeRotations;
			this.include270Rotation = obj.includeRotations;
		}
		if (obj.include90Rotation !== undefined) {
			this.include90Rotation = obj.include90Rotation;
		}
		if (obj.include180Rotation !== undefined) {
			this.include180Rotation = obj.include180Rotation;
		}
		if (obj.include270Rotation !== undefined) {
			this.include270Rotation = obj.include270Rotation;
		}
	}
	unselect() {
		this.line.lineDashSpeed = 0;
	}

	static hasRule(i : number, j : number, ruleIndex : number,
		data : number[][][], gridSize : Size) {
		if (i < 0 || j < 0 || i >= gridSize.width || j >= gridSize.height) {
			return false;
		}
		return data[i][j][3] == ruleIndex;
	}

	static needsEdgeToRight(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return !EditRule.hasRule(i, j-1, rule.index, data, gridSize)
				&& EditRule.hasRule(i, j, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i+1, j]));
	}

	static advanceRight(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (EditRule.needsEdgeToRight(rule, i, j, data, grid.gridSize)) {
			//move right
			rule.line.points.push(grid.getPositionForCoordinate(i+1, j));
			rule.boundaryEdges.add(JSON.stringify([i, j, i+1, j]));
			return true;
		}
		return false;
	}

	static needsEdgeToUp(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return EditRule.hasRule(i, j-1, rule.index, data, gridSize)
				&& !EditRule.hasRule(i-1, j-1, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i, j-1]));
	}

	static advanceUp(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (EditRule.needsEdgeToUp(rule, i, j, data, grid.gridSize)) {
			//move up
			rule.line.points.push(grid.getPositionForCoordinate(i, j-1));
			rule.boundaryEdges.add(JSON.stringify([i, j, i, j-1]));
			return true;
		}
		return false;
	}

	static needsEdgeToLeft(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return EditRule.hasRule(i-1, j-1, rule.index, data, gridSize)
				&& !EditRule.hasRule(i-1, j, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i-1, j]));
	}

	static advanceLeft(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (EditRule.needsEdgeToLeft(rule, i, j, data, grid.gridSize)) {
			//move left
			rule.line.points.push(grid.getPositionForCoordinate(i-1, j));
			rule.boundaryEdges.add(JSON.stringify([i, j, i-1, j]));
			return true;
		}
		return false;
	}

	static needsEdgeToDown(rule : EditRule, i : number, j : number,
		data : number[][][], gridSize : Size) {
		return EditRule.hasRule(i-1, j, rule.index, data, gridSize)
				&& !EditRule.hasRule(i, j, rule.index, data, gridSize)
				&& !rule.boundaryEdges.has(JSON.stringify([i, j, i, j+1]));
	}

	static advanceDown(rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {
		if (EditRule.needsEdgeToDown(rule, i, j, data, grid.gridSize)) {
			//move down
			rule.line.points.push(grid.getPositionForCoordinate(i, j+1));
			rule.boundaryEdges.add(JSON.stringify([i, j, i, j+1]));
			return true;
		}
		return false;
	}

	static advanceBoundary(direction : Direction, rule : EditRule, i : number, j : number,
		data : number[][][], grid : Grid) {

		if (direction == Direction.Up || direction == Direction.Left) {
			if (EditRule.advanceDown(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Down, rule, i, j+1, data, grid);
			} else if (EditRule.advanceLeft(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Left, rule, i-1, j, data, grid);
			} else if (EditRule.advanceRight(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Right, rule, i+1, j, data, grid);
			} else if (EditRule.advanceUp(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Up, rule, i, j-1, data, grid);
			}
		} else {
			if (EditRule.advanceRight(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Right, rule, i+1, j, data, grid);
			} else if (EditRule.advanceUp(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Up, rule, i, j-1, data, grid);
			} else if (EditRule.advanceDown(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Down, rule, i, j+1, data, grid);
			} else if (EditRule.advanceLeft(rule, i, j, data, grid)) {
				EditRule.advanceBoundary(Direction.Left, rule, i-1, j, data, grid);
			}
		}
	}

	static findAdjacentRule(i : number, j : number,
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
}