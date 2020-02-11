
class PlayTree {

	root : PlayRule;
	playRulesByIndex : Map<number, PlayRule> = new Map();

	addChildren(
		parent : PlayRule,
		edges : Edge[],
		editRules : Map<number, EditRule>,
		data : number[][][],
		gridSize : Size) {

		for (let edge of edges) {
			if (edge.isEnabled()
				//&& !edge.isLoop()
				&& edge.tailRuleIndex == parent.index) {
				let childEditRule = editRules.get(edge.headRuleIndex);
				let childPlayRule = this.playRulesByIndex.get(edge.headRuleIndex);
				if (childEditRule && !childPlayRule) {
					//let childPlayRule = new PlayRule(childEditRule, data, gridSize, false);
					childPlayRule = PlayRule.fromBoardData(
						childEditRule,
						data,
						gridSize,
						false/*,
						edge.type*/
					);
					this.playRulesByIndex.set(edge.headRuleIndex, childPlayRule);
					parent.children.push({
						rule : childPlayRule,
						edgeType : edge.type
					});
					this.addChildren(childPlayRule, edges, editRules, data, gridSize);
				} else {
					parent.children.push({
						rule : childPlayRule as PlayRule,
						edgeType : edge.type
					});
				}
			}
		}
	}

	static addRotatedTree90(from : PlayRule, to : PlayRule) {
		for (let child of from.children) {
			let rotated = PlayRule.createRotation90(child.rule);
			to.children.push({
				rule : rotated,
				edgeType : child.edgeType
			});
			this.addRotatedTree90(child.rule, rotated);
		}
	}

	static addRotatedTree180(from : PlayRule, to : PlayRule) {
		for (let child of from.children) {
			let rotated = PlayRule.createRotation180(child.rule);
			to.children.push({
				rule : rotated,
				edgeType : child.edgeType
			});
			this.addRotatedTree180(child.rule, rotated);
		}
	}

	static addRotatedTree270(from : PlayRule, to : PlayRule) {
		for (let child of from.children) {
			let rotated = PlayRule.createRotation270(child.rule);
			to.children.push({
				rule : rotated,
				edgeType : child.edgeType
			});
			this.addRotatedTree270(child.rule, rotated);
		}
	}

	constructor(
		rootEditRule : EditRule,
		edges : Edge[],
		editRules : Map<number, EditRule>,
		data : number[][][],
		gridSize : Size) {

		//this.root = new PlayRule(rootEditRule, data, gridSize, true);
		this.root = PlayRule.fromBoardData(rootEditRule, data, gridSize, true);
		this.addChildren(this.root, edges, editRules, data, gridSize);
	}
}