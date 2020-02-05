function shuffle(a : any[]) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class PlayRule {
	children : PlayRule[] = [];
	rotations : PlayRule[] = [];
	index : number;
	isStartSymbol : boolean = false;
	incomingEdgeType : EdgeType;
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

	match(boardData : number[][][], boardBuffer : number[][][], gridSize : Size, startI : number, startJ : number) {
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

	process(boardData : number[][][], boardBuffer : number[][][], gridSize : Size) {
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

	constructor(index : number, isStartSymbol : boolean, incomingEdgeType : EdgeType) {
		this.index = index;
		this.isStartSymbol = isStartSymbol;
		this.incomingEdgeType = incomingEdgeType;
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
		isStartSymbol : boolean,
		incomingEdgeType : EdgeType) {

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
	static createRotation90(other : PlayRule) {
		let playRule = new PlayRule(other.index, other.isStartSymbol, other.incomingEdgeType);
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
		return playRule;
	}

	static createRotation180(other : PlayRule) {
		let playRule = new PlayRule(other.index, other.isStartSymbol, other.incomingEdgeType);
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
		return playRule;
	}

	static createRotation270(other : PlayRule) {
		let playRule = new PlayRule(other.index, other.isStartSymbol, other.incomingEdgeType);
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
		return playRule;
	}
}