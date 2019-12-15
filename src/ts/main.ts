
class PlayRule {
	children : PlayRule[] = [];
	index : number;

	constructor(editRule : EditRule) {
		this.index = editRule.index;
	}
}

class PlayTree {

	root : PlayRule;

	addChildren(
		parent : PlayRule,
		edges : Edge[],
		editRules : Map<number, EditRule>) {

		for (let edge of edges) {
			if (edge.tailRuleIndex == parent.index) {
				let childEditRule = editRules.get(edge.headRuleIndex);
				if (childEditRule) {
					let childPlayRule = new PlayRule(childEditRule);
					parent.children.push(childPlayRule)
					this.addChildren(childPlayRule, edges, editRules);
				}
			}
		}
	}

	constructor(
		rootEditRule : EditRule,
		edges : Edge[],
		editRules : Map<number, EditRule>) {

		this.root = new PlayRule(rootEditRule);
		this.addChildren(this.root, edges, editRules);
	}
}

class PlayBoard {

	gameStepPlayTree : PlayTree;

	onUpdate(timeMS : DOMHighResTimeStamp) {
		
	}

	constructor(
		edges : Edge[],
		editRules : Map<number, EditRule>) {

		let computerEditRule = editRules.get(InputState.Computer) as EditRule;
		//asser computerEditRule is not undefined
		this.gameStepPlayTree = new PlayTree(computerEditRule, edges, editRules);
	}
}

enum BoardState {
	Play = 0,
	Edit,
};

class Board {

	grid : Grid;
	data : number[][][];
	editBoard : EditBoard;
	playBoard : PlayBoard;

	state : BoardState = BoardState.Edit;

	toggleState() {
		console.log("toggleState");
		if (this.state == BoardState.Play) {
			this.state = BoardState.Edit;
		} else {
			this.state = BoardState.Play;
		}
	}

	isEditing() {
		return this.state == BoardState.Edit;
	}

	onUpdate(timeMS : DOMHighResTimeStamp) {
		if (this.state == BoardState.Play) {
			this.playBoard.onUpdate(timeMS);
		}
	}

	constructor (gridSize : Size) {
		this.editBoard = new EditBoard();
		this.playBoard = new PlayBoard(this.editBoard.edges, this.editBoard.rules);

		this.data = new Array();
		for (let i = 0; i < gridSize.width; ++i) {
			this.data.push(new Array());
			for (let j = 0; j < gridSize.height; ++j) {
				this.data[i].push([-1, -1, -1, -1]);
			}
		}

		let gridLayout = new Layout(0.5, 0.5, 0, 10, 1.0, 20/21, -40, -40);
		gridLayout.anchor = {x: 0.5, y: 0.5*20/21};
		gridLayout.aspect = gridSize.width/gridSize.height;
		gridLayout.fixedAspect = true;
		let _this = this;
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
			size: {width: window.innerWidth, height: window.innerHeight},
		});
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
		this.debugRules();
	}
}

class Playbilder {
	game : Game;

	constructor (container : HTMLElement, boardSize : Size) {

		let board = new Board(boardSize);
		let tileSize = board.grid.computeTileSize();
		board.grid.tileSize = tileSize;

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
			board.editBoard.editTool = i;
			toolRect.layout.offset.position.x = i*tileSize;
			toolRect.layout.offset.position.y = j*tileSize;
			toolRect.layout.doLayout(toolbarLayout.computed);
			toolCoord = {i : i, j : j};
			selectedRect.layout.visible = board.editBoard.editTool == Tool.Pencil;
		}

		function setSelectedFromPalette(i : number, j : number) {
			setToolFromToolbar(0, 0);
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
						return [ImagePaths.Reals[j]];
					} else if (i == 1) {
						return [ImagePaths.Ideas[j]];
					} else {
						return [ImagePaths.Futures[j]];
					}
				},
				onClick(i : number, j : number) {
					setSelectedFromPalette(i, j);
				},
			}
		);

		palette.children = [];
		palette.children.push(selectedRect);

		for (let i = 0; i < 10; ++i) {
			let labelLayout = new Layout(
				0, 0, -20, i*tileSize + 20,
				0, 0, tileSize, tileSize
			);
			let label = new TextLabel(labelLayout, i.toString());
			palette.children.push(label);
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
				0, 0, (i+0.5)*tileSize, -5,
				0, 0, tileSize, tileSize
			);
			let label = new TextLabel(labelLayout, text);
			palette.children.push(label);
		}

		const tools : string[][] = [
			["Pencil"], ["Eraser"], ["Move"],
			["Select"], ["RulePad"], ["EdgeAlways"],
			["EdgeIfMatched"], ["EdgeIfNotMatched"], ["EdgeParallel"],
		];

		let topbarBottomPadding = 20;
		let toolbarLayout = new Layout(
			0, 0, 0, -topbarBottomPadding,
			0, 0, tileSize*9, tileSize*1
		);
		toolbarLayout.anchor = {x: 0.0, y: 1.0};

		let toolbar = new Grid(
			{width: 9, height: 1},
			toolbarLayout,
			{
				populate(i : number, j : number) {
					return [ImagePaths.Tools[tools[i][j]]];
				},
				onClick(i : number, j : number) {
					setToolFromToolbar(i, j);
				},
			}
		);
		toolbar.children = [];
		toolbar.children.push(toolRect);

		let playButtonLayout = new Layout(
			1, 0, 0, -topbarBottomPadding,
			0, 0, tileSize, tileSize
		);
		playButtonLayout.anchor = {x : 1.0, y : 1.0};
		let playButton = new Button(
			playButtonLayout,
			{
				onClick(e : MouseEvent) {
					board.toggleState();
					return true;
				}
			},
		);
		playButton.children.push();

		this.game = new Game(
			container,
			{
		    	onKeyDown(e : KeyboardEvent) {
		    		console.log("onKeyDown", e.key, e.ctrlKey, e.metaKey);
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
		    	},
		    	onUpdate(timeMS : DOMHighResTimeStamp) {
		    		board.onUpdate(timeMS);
		    	},
    		}	
    	);
		this.game.components.push(board.grid);
		board.grid.children = [];
		board.grid.children.push(palette);
		board.grid.children.push(toolbar);
		board.grid.children.push(playButton);
		this.game.doLayout();

		board.editBoard.components = this.game.components;
		board.setupInputStates();
    }
}

var $container = document.getElementById('container')!;
var $playBilder = new Playbilder($container, {width: 20, height: 20});
$playBilder.game.start();