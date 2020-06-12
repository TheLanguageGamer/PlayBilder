function shuffle(a : any[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function shufflePlayConnections(a : PlayConnection[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        if (a[i].edgeType == EdgeType.Parallel
        	&& a[j].edgeType == EdgeType.Parallel) {
	        [a[i], a[j]] = [a[j], a[i]];
		}
    }
    return a;
}

interface PlayConnection {
	rule : PlayRule,
	edgeType : EdgeType,
}

class PlayRule {
	children : PlayConnection[] = [];
	rotations : PlayRule[] = [];
	index : number;
	isStartSymbol : boolean = false;
	size : Size = {width : 0, height : 0};
	data : number[][][] = new Array();

	apply(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size,
		startI : number,
		startJ : number) {
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

	match(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size,
		startI : number,
		startJ : number) {

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

	processContent(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {

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
		return didMatch;
	}

	process(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) : boolean {

		if (this.index == InputState.Win) {
			return true;
		}
		let winning = false;
		let didMatch = this.processContent(boardData, boardBuffer, gridSize);

		for (let rotation of this.rotations) {
			if (didMatch) {
				break;
			}
			didMatch = rotation.processContent(boardData, boardBuffer, gridSize);
		}

		if (didMatch) {
			for (let i = 0; i < gridSize.width; ++i) {
				for (let j = 0; j < gridSize.height; ++j) {
					boardData[i][j][0] = boardBuffer[i][j][0];
				}
			}
		}

		shufflePlayConnections(this.children);

		let didFollowBlue = false;
		for (let child of this.children) {
			if ((child.edgeType == EdgeType.IfMatched && didMatch)
				|| (child.edgeType == EdgeType.IfNotMatched && !didMatch)
				|| (child.edgeType == EdgeType.Always)
				|| (child.edgeType == EdgeType.Parallel && !didFollowBlue)) {

				winning = winning || child.rule.process(boardData, boardBuffer, gridSize);
				didFollowBlue = didFollowBlue || child.edgeType == EdgeType.Parallel;
			}
		}
		return winning;
	}

	constructor(index : number, isStartSymbol : boolean) {
		this.index = index;
		this.isStartSymbol = isStartSymbol;
	}

	static getEditRuleBoundingBox(index : number, data : number[][][], gridSize : Size) {
		let minPosition = {x : gridSize.width, y : gridSize.height};
		let maxPosition = {x : -1, y : -1};

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
			position : {
				x : minPosition.x,
				y : minPosition.y,
			},
			size : {
				width : maxPosition.x - minPosition.x + 1,
				height : maxPosition.y - minPosition.y + 1,
			},
		};
	}

	static fromBoardData(
		editRule : EditRule,
		data : number[][][],
		gridSize : Size,
		isStartSymbol : boolean) {

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
				playRule.data[i].push(
					[
						-1,
						ideaType,
						futureType,
						-1,
					]
				);
			}
		}

		if (editRule.include90Rotation) {
			let playRule90 = this.createRotation90(playRule);
			playRule.rotations.push(playRule90);
		}
		if (editRule.include180Rotation) {
			let playRule180 = this.createRotation180(playRule);
			playRule.rotations.push(playRule180);
		}
		if (editRule.include270Rotation) {
			let playRule270 = this.createRotation270(playRule);
			playRule.rotations.push(playRule270);
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
	static createRotation90(other : PlayRule) {
		let playRule = new PlayRule(other.index, other.isStartSymbol);
		playRule.size = {
			width : other.size.height,
			height : other.size.width
		};
		for (let j = 0; j < other.size.height; ++j) {
			playRule.data.push(new Array());
			for (let i = 0; i < other.size.width; ++i) {
				playRule.data[j].push([-1, -1, -1, -1]);
			}
		}
		for (let j = 0; j < other.size.height; ++j) {
			for (let i = 0; i < other.size.width; ++i) {
				playRule.data[other.size.height-j-1][i] = other.data[i][j].slice(0);
			}
		}
		for (let otherRotation of other.rotations) {
			let rotation = PlayRule.createRotation90(otherRotation);
			playRule.rotations.push(rotation);
		}
		return playRule;
	}

	static createRotation180(other : PlayRule) {
		let playRule = new PlayRule(other.index, other.isStartSymbol);
		playRule.size = {
			width : other.size.width,
			height : other.size.height
		};
		for (let i = 0; i < other.size.width; ++i) {
			playRule.data.push(new Array());
			for (let j = 0; j < other.size.height; ++j) {
				playRule.data[i].push([-1, -1, -1, -1]);
			}
		}
		for (let j = 0; j < other.size.height; ++j) {
			for (let i = 0; i < other.size.width; ++i) {
				playRule.data[other.size.width-i-1][other.size.height-j-1] = other.data[i][j].slice(0);
			}
		}
		for (let otherRotation of other.rotations) {
			let rotation = PlayRule.createRotation180(otherRotation);
			playRule.rotations.push(rotation);
		}
		return playRule;
	}

	static createRotation270(other : PlayRule) {
		let playRule = new PlayRule(other.index, other.isStartSymbol);
		playRule.size = {
			width : other.size.height,
			height : other.size.width
		};
		for (let j = 0; j < other.size.height; ++j) {
			playRule.data.push(new Array());
			for (let i = 0; i < other.size.width; ++i) {
				playRule.data[j].push([-1, -1, -1, -1]);
			}
		}
		for (let j = 0; j < other.size.height; ++j) {
			for (let i = 0; i < other.size.width; ++i) {
				playRule.data[j][other.size.width-i-1] = other.data[i][j].slice(0);
			}
		}
		for (let otherRotation of other.rotations) {
			let rotation = PlayRule.createRotation270(otherRotation);
			playRule.rotations.push(rotation);
		}
		return playRule;
	}
}