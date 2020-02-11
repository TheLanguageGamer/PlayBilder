"use strict";
class PlayBoard {
    constructor(edges, editRules, data, gridSize, interval) {
        this.lastTimeStep = 0;
        this.gameStepInterval = interval;
        let computerEditRule = editRules.get(InputState.Computer);
        //asser computerEditRule is not undefined
        this.gameStepPlayTree = new PlayTree(computerEditRule, edges, editRules, data, gridSize);
        let leftEditRule = editRules.get(InputState.Left);
        //assert leftEditRule is not undefined
        this.leftPlayTree = new PlayTree(leftEditRule, edges, editRules, data, gridSize);
        let rightEditRule = editRules.get(InputState.Right);
        //assert rightEditRule is not undefined
        this.rightPlayTree = new PlayTree(rightEditRule, edges, editRules, data, gridSize);
        let upEditRule = editRules.get(InputState.Up);
        //assert upEditRule is not undefined
        this.upPlayTree = new PlayTree(upEditRule, edges, editRules, data, gridSize);
        let downEditRule = editRules.get(InputState.Down);
        //assert downEditRule is not undefined
        this.downPlayTree = new PlayTree(downEditRule, edges, editRules, data, gridSize);
        if (leftEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.leftPlayTree.root, this.upPlayTree.root);
            PlayTree.addRotatedTree180(this.leftPlayTree.root, this.rightPlayTree.root);
            PlayTree.addRotatedTree270(this.leftPlayTree.root, this.downPlayTree.root);
        }
        if (rightEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.rightPlayTree.root, this.downPlayTree.root);
            PlayTree.addRotatedTree180(this.rightPlayTree.root, this.leftPlayTree.root);
            PlayTree.addRotatedTree270(this.rightPlayTree.root, this.upPlayTree.root);
        }
        if (downEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.downPlayTree.root, this.leftPlayTree.root);
            PlayTree.addRotatedTree180(this.downPlayTree.root, this.upPlayTree.root);
            PlayTree.addRotatedTree270(this.downPlayTree.root, this.rightPlayTree.root);
        }
        if (upEditRule.includeRotations) {
            PlayTree.addRotatedTree90(this.upPlayTree.root, this.rightPlayTree.root);
            PlayTree.addRotatedTree180(this.upPlayTree.root, this.downPlayTree.root);
            PlayTree.addRotatedTree270(this.upPlayTree.root, this.leftPlayTree.root);
        }
        console.log("did construct PlayBoard");
    }
    onUpdate(timeMS, boardData, boardBuffer, gridSize) {
        let delta = timeMS - this.lastTimeStep;
        if (delta >= this.gameStepInterval) {
            this.lastTimeStep = timeMS;
            this.gameStepPlayTree.root.process(boardData, boardBuffer, gridSize);
            return true;
        }
        return false;
    }
    onKeyDown(e, boardData, boardBuffer, gridSize) {
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
    onRight(boardData, boardBuffer, gridSize) {
        console.log("onRight");
        this.rightPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
    onLeft(boardData, boardBuffer, gridSize) {
        console.log("onLeft");
        this.leftPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
    onUp(boardData, boardBuffer, gridSize) {
        console.log("onUp");
        this.upPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
    onDown(boardData, boardBuffer, gridSize) {
        console.log("onDown");
        this.downPlayTree.root.process(boardData, boardBuffer, gridSize);
    }
}
//# sourceMappingURL=PlayBoard.js.map