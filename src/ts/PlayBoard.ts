
interface PlayBoardProcessState {
	didProcess : boolean,
	isWinning : boolean;
}

class PlayBoard {

	gameStepPlayTree : PlayTree;
	leftPlayTree : PlayTree;
	rightPlayTree : PlayTree;
	upPlayTree : PlayTree;
	downPlayTree : PlayTree;
	lastTimeStep : DOMHighResTimeStamp = 0;
	gameStepInterval : DOMHighResTimeStamp;

	onUpdate(
		timeMS : DOMHighResTimeStamp,
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {

		let delta : DOMHighResTimeStamp = timeMS - this.lastTimeStep;
		if (delta >= this.gameStepInterval) {
			this.lastTimeStep = timeMS;
			let winning = this.gameStepPlayTree.root.process(
				boardData, boardBuffer, gridSize
			);
			return {
				didProcess : true,
				isWinning : winning,
			};
		}
		return {
			didProcess : false,
			isWinning : false,
		};
	}

	onKeyDown(
		e : KeyboardEvent,
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {

		let isWinning = false;
		let didProcess = false;
	    if (e.keyCode == 38 || e.key == 'w') {
	        isWinning = this.onUp(boardData, boardBuffer, gridSize);
	        didProcess = true;
	    }
	    else if (e.keyCode == 40 || e.key == 's') {
	    	isWinning = this.onDown(boardData, boardBuffer, gridSize);
	    	didProcess = true;
	    }
	    else if (e.keyCode == 37 || e.key == 'a') {
	    	isWinning = this.onLeft(boardData, boardBuffer, gridSize);
	        didProcess = true;
	    }
	    else if (e.keyCode == 39 || e.key == 'd') {
	    	isWinning = this.onRight(boardData, boardBuffer, gridSize);
	        didProcess = true;
	    }
	    return {
	    	isWinning : isWinning,
	    	didProcess : didProcess,
	    };
	}

	onRight(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onRight");
		return this.rightPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	onLeft(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onLeft");
		return this.leftPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	onUp(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onUp");
		return this.upPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	onDown(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onDown");
		return this.downPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	constructor(
		edges : Edge[],
		editRules : Map<number, EditRule>,
		data : number[][][],
		gridSize : Size,
		interval : DOMHighResTimeStamp) {

		this.gameStepInterval = interval;
		let computerEditRule = editRules.get(InputState.Computer) as EditRule;
		//assert computerEditRule is not undefined
		this.gameStepPlayTree = new PlayTree(
			computerEditRule,
			edges,
			editRules,
			data,
			gridSize
		);

		let leftEditRule = editRules.get(InputState.Left) as EditRule;
		//assert leftEditRule is not undefined
		this.leftPlayTree = new PlayTree(
			leftEditRule,
			edges,
			editRules,
			data,
			gridSize
		);

		let rightEditRule = editRules.get(InputState.Right) as EditRule;
		//assert rightEditRule is not undefined
		this.rightPlayTree = new PlayTree(
			rightEditRule,
			edges,
			editRules,
			data,
			gridSize
		);

		let upEditRule = editRules.get(InputState.Up) as EditRule;
		//assert upEditRule is not undefined
		this.upPlayTree = new PlayTree(
			upEditRule,
			edges,
			editRules,
			data,
			gridSize
		);

		let downEditRule = editRules.get(InputState.Down) as EditRule;
		//assert downEditRule is not undefined
		this.downPlayTree = new PlayTree(
			downEditRule,
			edges,
			editRules,
			data,
			gridSize
		);

		if (leftEditRule.include90Rotation) {
			PlayTree.addRotatedTree90(
				this.upPlayTree.playRulesByIndex,
				this.leftPlayTree.root,
				this.upPlayTree.root
			);
		}
		if (leftEditRule.include180Rotation) {
			PlayTree.addRotatedTree180(
				this.rightPlayTree.playRulesByIndex,
				this.leftPlayTree.root,
				this.rightPlayTree.root
			);
		}
		if (leftEditRule.include270Rotation) {
			PlayTree.addRotatedTree270(
				this.downPlayTree.playRulesByIndex,
				this.leftPlayTree.root,
				this.downPlayTree.root
			);
		}

		if (rightEditRule.include90Rotation) {
			PlayTree.addRotatedTree90(
				this.downPlayTree.playRulesByIndex,
				this.rightPlayTree.root,
				this.downPlayTree.root
			);
		}
		if (rightEditRule.include180Rotation) {
			PlayTree.addRotatedTree180(
				this.leftPlayTree.playRulesByIndex,
				this.rightPlayTree.root,
				this.leftPlayTree.root
			);
		}
		if (rightEditRule.include270Rotation) {
			PlayTree.addRotatedTree270(
				this.upPlayTree.playRulesByIndex,
				this.rightPlayTree.root,
				this.upPlayTree.root
			);
		}

		if (downEditRule.include90Rotation) {
			PlayTree.addRotatedTree90(
				this.leftPlayTree.playRulesByIndex,
				this.downPlayTree.root,
				this.leftPlayTree.root
			);
		}
		if (downEditRule.include180Rotation) {
			PlayTree.addRotatedTree180(
				this.upPlayTree.playRulesByIndex,
				this.downPlayTree.root,
				this.upPlayTree.root
			);
		}
		if (downEditRule.include270Rotation) {
			PlayTree.addRotatedTree270(
				this.rightPlayTree.playRulesByIndex,
				this.downPlayTree.root,
				this.rightPlayTree.root
			);
		}

		if (upEditRule.include90Rotation) {
			PlayTree.addRotatedTree90(
				this.rightPlayTree.playRulesByIndex,
				this.upPlayTree.root,
				this.rightPlayTree.root
			);
		}
		if (upEditRule.include180Rotation) {
			PlayTree.addRotatedTree180(
				this.downPlayTree.playRulesByIndex,
				this.upPlayTree.root,
				this.downPlayTree.root
			);
		}
		if (upEditRule.include270Rotation) {
			PlayTree.addRotatedTree270(
				this.leftPlayTree.playRulesByIndex,
				this.upPlayTree.root,
				this.leftPlayTree.root
			);
		}
		console.log("did construct PlayBoard");
	}
}