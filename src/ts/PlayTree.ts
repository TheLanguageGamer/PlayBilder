
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

	static addRotatedTree90(
		playRulesByIndex : Map<number, PlayRule>,
		from : PlayRule,
		to : PlayRule) {
		
		for (let child of from.children) {
			let rotated = playRulesByIndex.get(child.rule.index);
			let shouldAddChildren = false;
			if (!rotated) {
				rotated = PlayRule.createRotation90(child.rule);
				playRulesByIndex.set(child.rule.index, rotated);
				shouldAddChildren = true;
			}
			to.children.push({
				rule : rotated,
				edgeType : child.edgeType
			});
			if (shouldAddChildren) {
				PlayTree.addRotatedTree90(playRulesByIndex, child.rule, rotated);
			}
		}
	}

	static addRotatedTree180(
		playRulesByIndex : Map<number, PlayRule>,
		from : PlayRule,
		to : PlayRule) {
		
		for (let child of from.children) {
			let rotated = playRulesByIndex.get(child.rule.index);
			let shouldAddChildren = false;
			if (!rotated) {
				rotated = PlayRule.createRotation180(child.rule);
				playRulesByIndex.set(child.rule.index, rotated);
				shouldAddChildren = true;
			}
			to.children.push({
				rule : rotated,
				edgeType : child.edgeType
			});
			if (shouldAddChildren) {
				PlayTree.addRotatedTree180(playRulesByIndex, child.rule, rotated);
			}
		}
	}

	static addRotatedTree270(
		playRulesByIndex : Map<number, PlayRule>,
		from : PlayRule,
		to : PlayRule) {
		
		for (let child of from.children) {
			let rotated = playRulesByIndex.get(child.rule.index);
			let shouldAddChildren = false;
			if (!rotated) {
				rotated = PlayRule.createRotation270(child.rule);
				playRulesByIndex.set(child.rule.index, rotated);
				shouldAddChildren = true;
			}
			to.children.push({
				rule : rotated,
				edgeType : child.edgeType
			});
			if (shouldAddChildren) {
				PlayTree.addRotatedTree270(playRulesByIndex, child.rule, rotated);
			}
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