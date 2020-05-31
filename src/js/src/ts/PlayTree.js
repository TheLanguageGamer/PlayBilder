"use strict";
class PlayTree {
    // static addRotatedTree180_deprecated(from : PlayRule, to : PlayRule, seen : Set<number>) {
    // 	for (let child of from.children) {
    // 		if (seen.has(child.rule.index)) {
    // 			continue;
    // 		}
    // 		seen.add(child.rule.index);
    // 		let rotated = PlayRule.createRotation180(child.rule);
    // 		to.children.push({
    // 			rule : rotated,
    // 			edgeType : child.edgeType
    // 		});
    // 		PlayTree.addRotatedTree180(child.rule, rotated, seen);
    // 	}
    // }
    // static addRotatedTree270_deprecated(from : PlayRule, to : PlayRule, seen : Set<number>) {
    // 	for (let child of from.children) {
    // 		if (seen.has(child.rule.index)) {
    // 			continue;
    // 		}
    // 		seen.add(child.rule.index);
    // 		let rotated = PlayRule.createRotation270(child.rule);
    // 		to.children.push({
    // 			rule : rotated,
    // 			edgeType : child.edgeType
    // 		});
    // 		PlayTree.addRotatedTree270(child.rule, rotated, seen);
    // 	}
    // }
    constructor(rootEditRule, edges, editRules, data, gridSize) {
        this.playRulesByIndex = new Map();
        //this.root = new PlayRule(rootEditRule, data, gridSize, true);
        this.root = PlayRule.fromBoardData(rootEditRule, data, gridSize, true);
        this.addChildren(this.root, edges, editRules, data, gridSize);
    }
    addChildren(parent, edges, editRules, data, gridSize) {
        for (let edge of edges) {
            if (edge.isEnabled()
                //&& !edge.isLoop()
                && edge.tailRuleIndex == parent.index) {
                let childEditRule = editRules.get(edge.headRuleIndex);
                let childPlayRule = this.playRulesByIndex.get(edge.headRuleIndex);
                if (childEditRule && !childPlayRule) {
                    //let childPlayRule = new PlayRule(childEditRule, data, gridSize, false);
                    childPlayRule = PlayRule.fromBoardData(childEditRule, data, gridSize, false /*,
                    edge.type*/);
                    this.playRulesByIndex.set(edge.headRuleIndex, childPlayRule);
                    parent.children.push({
                        rule: childPlayRule,
                        edgeType: edge.type
                    });
                    this.addChildren(childPlayRule, edges, editRules, data, gridSize);
                }
                else {
                    parent.children.push({
                        rule: childPlayRule,
                        edgeType: edge.type
                    });
                }
            }
        }
    }
    // static addRotatedTree90_deprecated(from : PlayRule, to : PlayRule, seen : Map<number, Set<number>>) {
    // 	for (let child of from.children) {
    // 		let x = seen.get(child.rule.index);
    // 		if (x && x.has(from.index)) {
    // 			continue;
    // 		}
    // 		if (!x) {
    // 			x = new Set<number>();
    // 			seen.set(child.rule.index, x);
    // 		}
    // 		x.add(from.index);
    // 		let rotated = PlayRule.createRotation90(child.rule);
    // 		//let childPlayRule = this.playRulesByIndex.get(edge.headRuleIndex);
    // 		to.children.push({
    // 			rule : rotated,
    // 			edgeType : child.edgeType
    // 		});
    // 		PlayTree.addRotatedTree90(child.rule, rotated, seen);
    // 	}
    // }
    static addRotatedTree90(playRulesByIndex, from, to) {
        for (let child of from.children) {
            let rotated = playRulesByIndex.get(child.rule.index);
            let shouldAddChildren = false;
            if (!rotated) {
                rotated = PlayRule.createRotation90(child.rule);
                playRulesByIndex.set(child.rule.index, rotated);
                shouldAddChildren = true;
            }
            to.children.push({
                rule: rotated,
                edgeType: child.edgeType
            });
            if (shouldAddChildren) {
                PlayTree.addRotatedTree90(playRulesByIndex, child.rule, rotated);
            }
        }
    }
    static addRotatedTree180(playRulesByIndex, from, to) {
        for (let child of from.children) {
            let rotated = playRulesByIndex.get(child.rule.index);
            let shouldAddChildren = false;
            if (!rotated) {
                rotated = PlayRule.createRotation180(child.rule);
                playRulesByIndex.set(child.rule.index, rotated);
                shouldAddChildren = true;
            }
            to.children.push({
                rule: rotated,
                edgeType: child.edgeType
            });
            if (shouldAddChildren) {
                PlayTree.addRotatedTree180(playRulesByIndex, child.rule, rotated);
            }
        }
    }
    static addRotatedTree270(playRulesByIndex, from, to) {
        for (let child of from.children) {
            let rotated = playRulesByIndex.get(child.rule.index);
            let shouldAddChildren = false;
            if (!rotated) {
                rotated = PlayRule.createRotation270(child.rule);
                playRulesByIndex.set(child.rule.index, rotated);
                shouldAddChildren = true;
            }
            to.children.push({
                rule: rotated,
                edgeType: child.edgeType
            });
            if (shouldAddChildren) {
                PlayTree.addRotatedTree270(playRulesByIndex, child.rule, rotated);
            }
        }
    }
}
//# sourceMappingURL=PlayTree.js.map