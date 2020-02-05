
class PlayTree {

	root : PlayRule;

	addChildren(
		parent : PlayRule,
		edges : Edge[],
		editRules : Map<number, EditRule>,
		data : number[][][],
		gridSize : Size) {

		for (let edge of edges) {
			if (edge.isEnabled() && edge.tailRuleIndex == parent.index) {
				let childEditRule = editRules.get(edge.headRuleIndex);
				if (childEditRule) {
					//let childPlayRule = new PlayRule(childEditRule, data, gridSize, false);
					let childPlayRule = PlayRule.fromBoardData(
						childEditRule,
						data,
						gridSize,
						false,
						edge.type
					);
					parent.children.push(childPlayRule)
					this.addChildren(childPlayRule, edges, editRules, data, gridSize);
				}
			}
		}
	}

	static addRotatedTree90(from : PlayRule, to : PlayRule) {
		for (let child of from.children) {
			let rotated = PlayRule.createRotation90(child);
			to.children.push(rotated);
			this.addRotatedTree90(child, rotated);
		}
	}

	static addRotatedTree180(from : PlayRule, to : PlayRule) {
		for (let child of from.children) {
			let rotated = PlayRule.createRotation180(child);
			to.children.push(rotated);
			this.addRotatedTree180(child, rotated);
		}
	}

	static addRotatedTree270(from : PlayRule, to : PlayRule) {
		for (let child of from.children) {
			let rotated = PlayRule.createRotation270(child);
			to.children.push(rotated);
			this.addRotatedTree270(child, rotated);
		}
	}

	constructor(
		rootEditRule : EditRule,
		edges : Edge[],
		editRules : Map<number, EditRule>,
		data : number[][][],
		gridSize : Size) {

		//this.root = new PlayRule(rootEditRule, data, gridSize, true);
		this.root = PlayRule.fromBoardData(rootEditRule, data, gridSize, true, EdgeType.None);
		this.addChildren(this.root, edges, editRules, data, gridSize);
	}
}