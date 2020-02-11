
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
			this.gameStepPlayTree.root.process(boardData, boardBuffer, gridSize);
			return true;
		}
		return false;
	}

	onKeyDown(
		e : KeyboardEvent,
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
	    if (e.keyCode == 38 || e.key == 'w') {
	        this.onUp(boardData, boardBuffer, gridSize);
	        return true;
	    }
	    else if (e.keyCode == 40 || e.key == 's') {
	    	this.onDown(boardData, boardBuffer, gridSize);
	        return true;
	    }
	    else if (e.keyCode == 37 || e.key == 'a') {
	    	this.onLeft(boardData, boardBuffer, gridSize);
	        return true;
	    }
	    else if (e.keyCode == 39 || e.key == 'd') {
	    	this.onRight(boardData, boardBuffer, gridSize);
	        return true;
	    }
	    return false;
	}

	onRight(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onRight");
		this.rightPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	onLeft(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onLeft");
		this.leftPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	onUp(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onUp");
		this.upPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	onDown(
		boardData : number[][][],
		boardBuffer : number[][][],
		gridSize : Size) {
		console.log("onDown");
		this.downPlayTree.root.process(boardData, boardBuffer, gridSize);
	}

	constructor(
		edges : Edge[],
		editRules : Map<number, EditRule>,
		data : number[][][],
		gridSize : Size,
		interval : DOMHighResTimeStamp) {

		this.gameStepInterval = interval;
		let computerEditRule = editRules.get(InputState.Computer) as EditRule;
		//asser computerEditRule is not undefined
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

		if (leftEditRule.includeRotations) {
			PlayTree.addRotatedTree90(
				this.leftPlayTree.root,
				this.upPlayTree.root
			);
			PlayTree.addRotatedTree180(
				this.leftPlayTree.root,
				this.rightPlayTree.root
			);
			PlayTree.addRotatedTree270(
				this.leftPlayTree.root,
				this.downPlayTree.root
			);
		}

		if (rightEditRule.includeRotations) {
			PlayTree.addRotatedTree90(
				this.rightPlayTree.root,
				this.downPlayTree.root
			);
			PlayTree.addRotatedTree180(
				this.rightPlayTree.root,
				this.leftPlayTree.root
			);
			PlayTree.addRotatedTree270(
				this.rightPlayTree.root,
				this.upPlayTree.root
			);
		}

		if (downEditRule.includeRotations) {
			PlayTree.addRotatedTree90(
				this.downPlayTree.root,
				this.leftPlayTree.root
			);
			PlayTree.addRotatedTree180(
				this.downPlayTree.root,
				this.upPlayTree.root
			);
			PlayTree.addRotatedTree270(
				this.downPlayTree.root,
				this.rightPlayTree.root
			);
		}

		if (upEditRule.includeRotations) {
			PlayTree.addRotatedTree90(
				this.upPlayTree.root,
				this.rightPlayTree.root
			);
			PlayTree.addRotatedTree180(
				this.upPlayTree.root,
				this.downPlayTree.root
			);
			PlayTree.addRotatedTree270(
				this.upPlayTree.root,
				this.leftPlayTree.root
			);
		}
		console.log("did construct PlayBoard");
	}
}