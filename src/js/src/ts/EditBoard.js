"use strict";
var InputState;
(function (InputState) {
    InputState[InputState["Computer"] = 0] = "Computer";
    InputState[InputState["Left"] = 1] = "Left";
    InputState[InputState["Right"] = 2] = "Right";
    InputState[InputState["Up"] = 3] = "Up";
    InputState[InputState["Down"] = 4] = "Down";
    InputState[InputState["Win"] = 5] = "Win";
    InputState[InputState["__Length"] = 6] = "__Length";
})(InputState || (InputState = {}));
var Tool;
(function (Tool) {
    Tool[Tool["Pencil"] = 0] = "Pencil";
    Tool[Tool["Eraser"] = 1] = "Eraser";
    Tool[Tool["Move"] = 2] = "Move";
    Tool[Tool["Select"] = 3] = "Select";
    Tool[Tool["RulePad"] = 4] = "RulePad";
    Tool[Tool["EdgeAlways"] = 5] = "EdgeAlways";
    Tool[Tool["EdgeIfMatched"] = 6] = "EdgeIfMatched";
    Tool[Tool["EdgeIfNotMatched"] = 7] = "EdgeIfNotMatched";
    Tool[Tool["EdgeParallel"] = 8] = "EdgeParallel";
})(Tool || (Tool = {}));
var Modality;
(function (Modality) {
    Modality[Modality["Real"] = 0] = "Real";
    Modality[Modality["Idea"] = 1] = "Idea";
    Modality[Modality["Future"] = 2] = "Future";
})(Modality || (Modality = {}));
var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Right"] = 1] = "Right";
    Direction[Direction["Down"] = 2] = "Down";
    Direction[Direction["Up"] = 3] = "Up";
})(Direction || (Direction = {}));
var EditType;
(function (EditType) {
    EditType[EditType["NoOpt"] = 0] = "NoOpt";
    EditType[EditType["CellEdit"] = 1] = "CellEdit";
    EditType[EditType["RuleMove"] = 2] = "RuleMove";
})(EditType || (EditType = {}));
var UserFeedbackState;
(function (UserFeedbackState) {
    UserFeedbackState[UserFeedbackState["None"] = 0] = "None";
    UserFeedbackState[UserFeedbackState["Info"] = 1] = "Info";
    UserFeedbackState[UserFeedbackState["Warning"] = 2] = "Warning";
    UserFeedbackState[UserFeedbackState["Error"] = 3] = "Error";
})(UserFeedbackState || (UserFeedbackState = {}));
class EditBoard {
    constructor(controller) {
        this.components = [];
        this.gridLayout = new Layout(0, 0, 0, 0, 0, 0, 0, 0);
        this.ruleOptions = new RuleOptionsGUI();
        this.editTool = Tool.Pencil;
        this.editModality = Modality.Real;
        this.editBlockType = 0;
        this.isMovingRule = false;
        this.movingRuleIndex = -1;
        this.movingLastCoordinate = { x: 0, y: 0 };
        this.movingStartCoordinate = { x: 0, y: 0 };
        this.isSelectingReal = false;
        this.realSelectionRectangle = new Rectangle(new Layout(0, 0, 0, 0, 0, 0, 0, 0));
        this.isMovingRealSelection = false;
        this.isAddingEdge = false;
        this.edges = new Array();
        this.rules = new Map();
        this.maxRuleIndex = 0;
        this.edits = [];
        this.controller = controller;
    }
    setComponents(components) {
        this.components = components;
        this.components.push(this.realSelectionRectangle);
        this.realSelectionRectangle.layout.visible = false;
        this.realSelectionRectangle.strokeColor = Constants.Colors.Blue.Pure;
        this.realSelectionRectangle.lineDash = [2, 2];
    }
    calculateBoundaries(data, grid) {
        this.rules.forEach(function (rule) {
            rule.size = 0;
            if (rule.dirtyBoundaries) {
                rule.boundaryEdges.clear();
                rule.line.points.length = 0;
                rule.dirtyBoundaries = false;
            }
        });
        for (let i = 0; i < grid.gridSize.width; ++i) {
            for (let j = 0; j < grid.gridSize.height; ++j) {
                let ruleIndex = data[i][j][3];
                let rule = this.rules.get(ruleIndex);
                if (rule) {
                    rule.size += 1;
                    if (EditRule.needsEdgeToRight(rule, i, j, data, grid.gridSize)) {
                        let pos = grid.getPositionForCoordinate(i, j);
                        rule.line.points.push({ x: pos.x, y: pos.y, isMove: true });
                        EditRule.advanceBoundary(Direction.Right, rule, i, j, data, grid);
                    }
                }
            }
        }
    }
    visitRuleIndex(i, j, countIndex, maskIndex, data, gridSize) {
        if (i < 0 || j < 0 || i >= gridSize.width || j >= gridSize.height) {
            return;
        }
        if (data[i][j][3] == countIndex) {
            data[i][j][3] = maskIndex;
            this.visitRuleIndex(i - 1, j - 1, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i, j - 1, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i + 1, j - 1, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i - 1, j, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i + 1, j, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i - 1, j + 1, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i, j + 1, countIndex, maskIndex, data, gridSize);
            this.visitRuleIndex(i + 1, j + 1, countIndex, maskIndex, data, gridSize);
        }
    }
    isConnected(rule, data, gridSize) {
        let finished = false;
        let maskIndex = -2;
        for (let i = 0; i < gridSize.width && !finished; ++i) {
            for (let j = 0; j < gridSize.height && !finished; ++j) {
                let otherIndex = data[i][j][3];
                if (otherIndex == rule.index) {
                    finished = true;
                    this.visitRuleIndex(i, j, rule.index, maskIndex, data, gridSize);
                }
            }
        }
        //count
        let count = 0;
        for (let i = 0; i < gridSize.width; ++i) {
            for (let j = 0; j < gridSize.height; ++j) {
                let otherIndex = data[i][j][3];
                if (otherIndex == maskIndex) {
                    count += 1;
                    data[i][j][3] = rule.index;
                }
            }
        }
        return rule.size == count;
    }
    doesntBlockRuleIndex(ruleIndex, i, j, data, grid) {
        return !grid.isValidCoordinate(i, j)
            || data[i][j][3] == ruleIndex
            || data[i][j][3] == -1;
    }
    canHaveRuleIndex(ruleIndex, i, j, data, grid) {
        return grid.isValidCoordinate(i, j)
            && data[i][j][0] < 0
            && this.doesntBlockRuleIndex(ruleIndex, i - 1, j - 1, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i - 0, j - 1, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i + 1, j - 1, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i - 1, j + 0, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i - 0, j + 0, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i + 1, j + 0, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i - 1, j + 1, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i - 0, j + 1, data, grid)
            && this.doesntBlockRuleIndex(ruleIndex, i + 1, j + 1, data, grid);
    }
    canMoveRuleIndex(ruleIndex, deltaI, deltaJ, data, grid) {
        let ret = true;
        for (let i = 0; i < grid.gridSize.width; ++i) {
            for (let j = 0; j < grid.gridSize.height; ++j) {
                let otherIndex = data[i][j][3];
                if (otherIndex == ruleIndex) {
                    ret = ret && this.canHaveRuleIndex(ruleIndex, i + deltaI, j + deltaJ, data, grid);
                }
            }
        }
        return ret;
    }
    canMoveRealSelection(selection, deltaI, deltaJ, data, grid) {
        let ret = true;
        for (let i = selection.position.x; i < selection.position.x + selection.size.width; ++i) {
            for (let j = selection.position.y; j < selection.position.y + selection.size.height; ++j) {
                let movedI = i + deltaI;
                let movedJ = j + deltaJ;
                ret = ret && grid.isValidCoordinate(movedI, movedJ);
                if (!boxContainsPoint(selection, movedI, movedJ)) {
                    ret = ret
                        && data[movedI][movedJ][0] < 0
                        && data[movedI][movedJ][3] < 0;
                }
            }
        }
        console.log("canMoveRealSelection", ret);
        return ret;
    }
    doMoveRealSelection(selection, deltaI, deltaJ, data, grid) {
        console.log("guess we can move", deltaI, deltaJ);
        if (deltaI <= 0 && deltaJ <= 0) {
            for (let i = selection.position.x; i < selection.position.x + selection.size.width; ++i) {
                for (let j = selection.position.y; j < selection.position.y + selection.size.height; ++j) {
                    let movedI = i + deltaI;
                    let movedJ = j + deltaJ;
                    this.setCell(movedI, movedJ, data[i][j][0], data[movedI][movedJ][1], data[movedI][movedJ][2], data[movedI][movedJ][3], data, grid);
                    this.setCell(i, j, -1, data[i][j][1], data[i][j][2], data[i][j][3], data, grid);
                }
            }
        }
        else if (deltaI >= 0 && deltaJ >= 0) {
            for (let i = selection.position.x + selection.size.width - 1; i >= selection.position.x; --i) {
                for (let j = selection.position.y + selection.size.height - 1; j >= selection.position.y; --j) {
                    let movedI = i + deltaI;
                    let movedJ = j + deltaJ;
                    this.setCell(movedI, movedJ, data[i][j][0], data[movedI][movedJ][1], data[movedI][movedJ][2], data[movedI][movedJ][3], data, grid);
                    this.setCell(i, j, -1, data[i][j][1], data[i][j][2], data[i][j][3], data, grid);
                }
            }
        }
        else if (deltaI >= 0 && deltaJ <= 0) {
            for (let i = selection.position.x + selection.size.width - 1; i >= selection.position.x; --i) {
                for (let j = selection.position.y; j < selection.position.y + selection.size.height; ++j) {
                    let movedI = i + deltaI;
                    let movedJ = j + deltaJ;
                    this.setCell(movedI, movedJ, data[i][j][0], data[movedI][movedJ][1], data[movedI][movedJ][2], data[movedI][movedJ][3], data, grid);
                    this.setCell(i, j, -1, data[i][j][1], data[i][j][2], data[i][j][3], data, grid);
                }
            }
        }
        else if (deltaI <= 0 && deltaJ >= 0) {
            for (let i = selection.position.x; i < selection.position.x + selection.size.width; ++i) {
                for (let j = selection.position.y + selection.size.height - 1; j >= selection.position.y; --j) {
                    let movedI = i + deltaI;
                    let movedJ = j + deltaJ;
                    this.setCell(movedI, movedJ, data[i][j][0], data[movedI][movedJ][1], data[movedI][movedJ][2], data[movedI][movedJ][3], data, grid);
                    this.setCell(i, j, -1, data[i][j][1], data[i][j][2], data[i][j][3], data, grid);
                }
            }
        }
        selection.position.x += deltaI;
        selection.position.y += deltaJ;
        grid.setLayoutToBox(this.realSelectionRectangle.layout, selection);
        this.realSelectionRectangle.layout.doLayout(this.gridLayout.computed);
        //debug
        for (let i = selection.position.x; i < selection.position.x + selection.size.width; ++i) {
            for (let j = selection.position.y; j < selection.position.y + selection.size.height; ++j) {
                console.log(data[i][j][0]);
            }
        }
    }
    doMoveRuleIndex(ruleIndex, deltaI, deltaJ, data, grid) {
        if (deltaI <= 0 && deltaJ <= 0) {
            for (let i = 0; i < grid.gridSize.width; ++i) {
                for (let j = 0; j < grid.gridSize.height; ++j) {
                    let otherIndex = data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
                    }
                }
            }
        }
        else if (deltaI >= 0 && deltaJ >= 0) {
            for (let i = grid.gridSize.width - 1; i >= 0; --i) {
                for (let j = grid.gridSize.height - 1; j >= 0; --j) {
                    let otherIndex = data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
                    }
                }
            }
        }
        else if (deltaI <= 0 && deltaJ >= 0) {
            for (let i = 0; i < grid.gridSize.width; ++i) {
                for (let j = grid.gridSize.height - 1; j >= 0; --j) {
                    let otherIndex = data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
                    }
                }
            }
        }
        else if (deltaI >= 0 && deltaJ <= 0) {
            for (let i = grid.gridSize.width - 1; i >= 0; --i) {
                for (let j = grid.gridSize.height - 1; j >= 0; --j) {
                    let otherIndex = data[i][j][3];
                    if (otherIndex == ruleIndex) {
                        this.swapCells(i, j, i + deltaI, j + deltaJ, data, grid);
                    }
                }
            }
        }
    }
    canDrawRule(i, j, data, gridSize) {
        return EditRule.findAdjacentRule(i, j, data, gridSize).count <= 1;
    }
    rulePad(i, j, data, grid) {
        let realType = data[i][j][0];
        let ruleIndex = data[i][j][3];
        if (ruleIndex <= -1 && realType <= -1) {
            let adjacencies = EditRule.findAdjacentRule(i, j, data, grid.gridSize);
            if (adjacencies.count > 1) {
                this.controller.onUserFeedback({
                    state: UserFeedbackState.Warning,
                    message: "Warning: Rules can't be joined.",
                });
                return -1;
            }
            let newRuleIndex = adjacencies.rule;
            if (newRuleIndex >= 0 && newRuleIndex < InputState.__Length) {
                this.controller.onUserFeedback({
                    state: UserFeedbackState.Warning,
                    message: "Warning: Built-in rules can't be extended.",
                });
                return -1;
            }
            if (newRuleIndex <= -1) {
                newRuleIndex = this.maxRuleIndex;
                this.maxRuleIndex += 1;
                let rule = new EditRule(newRuleIndex, this.gridLayout);
                this.components.push(rule.line);
                this.rules.set(newRuleIndex, rule);
            }
            console.log("ruleIndex", newRuleIndex, adjacencies.count);
            this.edits.push(new CellEdit({
                i: i,
                j: j,
                cellData: data[i][j].slice(0),
            }));
            this.setCell(i, j, data[i][j][0], data[i][j][1], data[i][j][2], newRuleIndex, data, grid);
            let rule = this.rules.get(newRuleIndex);
            if (rule) {
                rule.dirtyBoundaries = true;
                this.calculateBoundaries(data, grid);
                this.respositionEdgesForRule(rule, data, grid);
                this.selectRuleIndex(newRuleIndex);
            }
            return newRuleIndex;
        }
        if (ruleIndex > -1) {
            this.selectRuleIndex(ruleIndex);
        }
        return ruleIndex;
    }
    erase(i, j, data, grid) {
        let ruleIndex = data[i][j][3];
        if (ruleIndex >= 0 && ruleIndex < InputState.__Length) {
            this.controller.onUserFeedback({
                state: UserFeedbackState.Warning,
                message: "Warning: Can't erase built-in rules.",
            });
            return;
        }
        if (data[i][j][0] != -1
            || data[i][j][1] != -1
            || data[i][j][2] != -1
            || data[i][j][3] != -1) {
            this.edits.push(new CellEdit({
                i: i,
                j: j,
                cellData: data[i][j].slice(0),
            }));
        }
        let rule = this.rules.get(ruleIndex);
        //update model
        data[i][j][0] = -1;
        data[i][j][1] = -1;
        data[i][j][2] = -1;
        data[i][j][3] = -1;
        //update view
        grid.grid[i][j][0] = "";
        grid.grid[i][j][1] = "";
        if (rule) {
            rule.dirtyBoundaries = true;
            this.calculateBoundaries(data, grid);
            if (rule.size == 0) {
                rule.disable();
            }
            else if (!this.isConnected(rule, data, grid.gridSize)) {
                this.undo(data, grid);
            }
            if (rule.isEnabled()) {
                this.respositionEdgesForRule(rule, data, grid);
            }
            else {
                this.disableEdgesForRule(rule);
                this.calculateReachability();
            }
        }
    }
    pencil(i, j, data, grid) {
        let editModality = this.editModality;
        let editBlockType = this.editBlockType;
        let realType = data[i][j][0];
        let ideaType = data[i][j][1];
        let futureType = data[i][j][2];
        let ruleIndex = data[i][j][3];
        //assert !(realType > -1 && (futureType > -1 || ideaType > -1))
        //assert !hasRulePad || (ideaType == -1 && futureType == -1)
        let newRealType = realType;
        let newIdeaType = ideaType;
        let newFutureType = futureType;
        let newRuleIndex = ruleIndex;
        if (ruleIndex >= 0 && ruleIndex < InputState.__Length) {
            this.controller.onUserFeedback({
                state: UserFeedbackState.Warning,
                message: "Warning: Built-in rules can't be changed.",
            });
            return;
        }
        else if (editModality != Modality.Real
            && !this.canDrawRule(i, j, data, grid.gridSize)) {
            this.controller.onUserFeedback({
                state: UserFeedbackState.Warning,
                message: "Warning: Can't add real blocks to rules.",
            });
            return;
        }
        else if (ruleIndex > -1 && editModality == Modality.Real) {
            this.controller.onUserFeedback({
                state: UserFeedbackState.Warning,
                message: "Warning: Can't add rules on top of real blocks.",
            });
            return;
        }
        else if (editModality == Modality.Real && realType == editBlockType) {
            //erase
            this.unselectSelectedObject();
            newRealType = -1;
        }
        else if (editModality == Modality.Idea && ideaType == editBlockType) {
            //erase
            newIdeaType = -1;
        }
        else if (editModality == Modality.Future && futureType == editBlockType) {
            //erase
            newFutureType = -1;
        }
        else if (editModality == Modality.Real) {
            this.unselectSelectedObject();
            newRealType = editBlockType;
        }
        else if (editModality == Modality.Idea) {
            newIdeaType = editBlockType;
            newRuleIndex = this.rulePad(i, j, data, grid);
        }
        else if (editModality == Modality.Future) {
            newFutureType = editBlockType;
            newRuleIndex = this.rulePad(i, j, data, grid);
        }
        this.edits.push(new CellEdit({
            i: i,
            j: j,
            cellData: data[i][j].slice(0),
        }));
        this.setCell(i, j, newRealType, newIdeaType, newFutureType, newRuleIndex, data, grid);
    }
    undoCellEdit(cellEdit, data, grid) {
        let currentRuleIndex = data[cellEdit.i][cellEdit.j][3];
        let ruleChanged = cellEdit.cellData[3] != currentRuleIndex;
        this.setCell(cellEdit.i, cellEdit.j, cellEdit.cellData[0], cellEdit.cellData[1], cellEdit.cellData[2], cellEdit.cellData[3], data, grid);
        if (ruleChanged) {
            let rule = this.rules.get(cellEdit.cellData[3]) || this.rules.get(currentRuleIndex);
            if (rule) {
                rule.dirtyBoundaries = true;
                this.calculateBoundaries(data, grid);
                if (rule.size == 0) {
                    rule.disable();
                    this.disableEdgesForRule(rule);
                }
                else {
                    rule.enable();
                    this.respositionEdgesForRule(rule, data, grid);
                }
            }
        }
    }
    undoRuleMove(ruleMove, data, grid) {
        this.doMoveRuleIndex(ruleMove.ruleIndex, ruleMove.deltaI, ruleMove.deltaJ, data, grid);
        let rule = this.rules.get(ruleMove.ruleIndex);
        if (rule) {
            rule.dirtyBoundaries = true;
            this.calculateBoundaries(data, grid);
            this.respositionEdgesForRule(rule, data, grid);
        }
    }
    undo(data, grid) {
        if (this.edits.length == 0) {
            return;
        }
        let edit = this.edits.pop();
        if (edit) {
            switch (edit.type) {
                case EditType.NoOpt: {
                    break;
                }
                case EditType.CellEdit: {
                    let cellEdit = edit;
                    this.undoCellEdit(cellEdit, data, grid);
                    break;
                }
                case EditType.RuleMove: {
                    let ruleMove = edit;
                    this.undoRuleMove(ruleMove, data, grid);
                    break;
                }
            }
        }
    }
    //only updates grid, not data
    setGridCell(i, j, realType, ideaType, futureType, rulePad, grid) {
        //set grid cell path
        if (rulePad >= 0 && rulePad < InputState.__Length) {
            grid.grid[i][j][0] = PlaybilderPaths.InputState[InputState[rulePad]];
            grid.grid[i][j][1] = "";
        }
        else if (realType > -1) {
            grid.grid[i][j][0] = PlaybilderPaths.Reals[realType];
        }
        else if (ideaType > -1 && futureType > -1) {
            grid.grid[i][j][0] = PlaybilderPaths.FutureIdeas[futureType][ideaType];
            grid.grid[i][j][1] = "";
        }
        else if (ideaType > -1) {
            grid.grid[i][j][0] = PlaybilderPaths.Ideas[ideaType];
            ;
            grid.grid[i][j][1] = "";
        }
        else if (futureType > -1) {
            grid.grid[i][j][0] = PlaybilderPaths.Futures[futureType];
            grid.grid[i][j][1] = "";
        }
        else {
            grid.grid[i][j][0] = "";
            grid.grid[i][j][1] = "";
        }
    }
    setCell(i, j, realType, ideaType, futureType, rulePad, data, grid) {
        data[i][j][0] = realType;
        data[i][j][1] = ideaType;
        data[i][j][2] = futureType;
        data[i][j][3] = rulePad;
        this.setGridCell(i, j, realType, ideaType, futureType, rulePad, grid);
    }
    swapCells(i1, j1, i2, j2, data, grid) {
        let temp0 = data[i1][j1][0];
        let temp1 = data[i1][j1][1];
        let temp2 = data[i1][j1][2];
        let temp3 = data[i1][j1][3];
        this.setCell(i1, j1, data[i2][j2][0], data[i2][j2][1], data[i2][j2][2], data[i2][j2][3], data, grid);
        this.setCell(i2, j2, temp0, temp1, temp2, temp3, data, grid);
    }
    onSelect(i, j, data, grid) {
        this.controller.onUserFeedback({
            state: UserFeedbackState.None,
            message: "",
        });
        switch (this.editTool) {
            case Tool.Pencil: {
                this.pencil(i, j, data, grid);
                break;
            }
            case Tool.Eraser: {
                this.erase(i, j, data, grid);
                break;
            }
            case Tool.RulePad: {
                this.rulePad(i, j, data, grid);
                break;
            }
            default: {
                break;
            }
        }
    }
    selectRuleIndex(ruleIndex) {
        this.unselectSelectedObject();
        let rule = this.rules.get(ruleIndex);
        if (rule) {
            this.ruleOptions.show(rule);
            rule.line.lineDashSpeed = -0.333;
            this.selectedRule = rule;
        }
        //else, panic!
        this.controller.onObjectSelected();
    }
    unselectSelectedObject() {
        if (this.selectedRule) {
            this.ruleOptions.hide();
            this.selectedRule.unselect();
            this.selectedRule = undefined;
        }
        if (this.selectedEdge) {
            this.selectedEdge.unselect();
            this.selectedEdge = undefined;
        }
        if (this.realSelectionRectangle.layout.visible) {
            this.realSelectionBox = undefined;
            this.realSelectionRectangle.layout.visible = false;
            this.realSelectionRectangle.lineDashSpeed = 0;
        }
        this.controller.onObjectUnselected();
    }
    selectEdge(edge) {
        edge.select();
        this.selectedEdge = edge;
        this.controller.onObjectSelected();
    }
    findEdgeToSelect(e) {
        let returnEdge = undefined;
        let minDistance = 6;
        for (let edge of this.edges) {
            if (edge.isEnabled()) {
                let distance = edge.distanceTo(e.offsetX, e.offsetY);
                if (distance < minDistance) {
                    minDistance = distance;
                    returnEdge = edge;
                }
            }
        }
        return returnEdge;
    }
    onMouseDown(i, j, e, data, grid) {
        switch (this.editTool) {
            case Tool.Move: {
                let ruleIndex = data[i][j][3];
                if (ruleIndex > -1) {
                    this.isMovingRule = true;
                    this.movingRuleIndex = ruleIndex;
                    this.movingStartCoordinate.x = i;
                    this.movingStartCoordinate.y = j;
                    this.movingLastCoordinate.x = i;
                    this.movingLastCoordinate.y = j;
                    this.selectRuleIndex(ruleIndex);
                }
                else if (this.realSelectionBox
                    && grid.coordinateBoxContainsPosition(this.realSelectionBox, e.offsetX, e.offsetY)) {
                    console.log("will move real selection box");
                    this.isMovingRealSelection = true;
                    this.movingStartCoordinate.x = i;
                    this.movingStartCoordinate.y = j;
                    this.movingLastCoordinate.x = i;
                    this.movingLastCoordinate.y = j;
                }
                break;
            }
            case Tool.EdgeAlways:
            case Tool.EdgeIfMatched:
            case Tool.EdgeIfNotMatched:
            case Tool.EdgeParallel: {
                let ruleIndex = data[i][j][3];
                let rule = this.rules.get(ruleIndex);
                if (ruleIndex > -1 && rule) {
                    this.isAddingEdge = true;
                    let edge = new Edge({
                        tailRuleIndex: ruleIndex,
                        fromTool: this.editTool,
                        parentLayout: this.gridLayout,
                    });
                    edge.positionMovingArrow(e.offsetX, e.offsetY, rule, grid);
                    this.edge = edge;
                    this.components.push(edge.arrow);
                }
                break;
            }
            case Tool.Select: {
                this.unselectSelectedObject();
                let edge = this.findEdgeToSelect(e);
                let ruleIndex = data[i][j][3];
                if (edge) {
                    this.selectEdge(edge);
                }
                else if (ruleIndex > -1) {
                    this.selectRuleIndex(ruleIndex);
                }
                else {
                    this.isSelectingReal = true;
                    this.realSelectionRectangle.layout.visible = true;
                    this.realSelectionRectangle.layout.setUpperLeft(e.offsetX - this.gridLayout.computed.position.x, e.offsetY - this.gridLayout.computed.position.y);
                    this.realSelectionRectangle.layout.setLowerRight(e.offsetX - this.gridLayout.computed.position.x, e.offsetY - this.gridLayout.computed.position.y);
                    this.realSelectionRectangle.layout.doLayout(this.gridLayout.computed);
                }
                break;
            }
            default: {
                break;
            }
        }
    }
    onMouseMove(e, data, grid) {
        if (this.isMovingRule) {
            let currentI = grid.getCoordinateForXPosition(e.offsetX);
            let currentJ = grid.getCoordinateForYPosition(e.offsetY);
            let deltaI = currentI - this.movingLastCoordinate.x;
            let deltaJ = currentJ - this.movingLastCoordinate.y;
            if (deltaI == 0 && deltaJ == 0) {
                //do nothing
            }
            else if (this.canMoveRuleIndex(this.movingRuleIndex, deltaI, deltaJ, data, grid)) {
                this.doMoveRuleIndex(this.movingRuleIndex, deltaI, deltaJ, data, grid);
                this.movingLastCoordinate.x = currentI;
                this.movingLastCoordinate.y = currentJ;
                let rule = this.rules.get(this.movingRuleIndex);
                if (rule) {
                    rule.dirtyBoundaries = true;
                    this.calculateBoundaries(data, grid);
                    this.respositionEdgesForRule(rule, data, grid);
                }
            }
            else {
                //error, can't move rule here
            }
        }
        else if (this.isMovingRealSelection) {
            let currentI = grid.getCoordinateForXPosition(e.offsetX);
            let currentJ = grid.getCoordinateForYPosition(e.offsetY);
            let deltaI = currentI - this.movingLastCoordinate.x;
            let deltaJ = currentJ - this.movingLastCoordinate.y;
            if (deltaI == 0 && deltaJ == 0) {
                //do nothing
            }
            else if (this.realSelectionBox
                && this.canMoveRealSelection(this.realSelectionBox, deltaI, deltaJ, data, grid)) {
                this.doMoveRealSelection(this.realSelectionBox, deltaI, deltaJ, data, grid);
                this.movingLastCoordinate.x = currentI;
                this.movingLastCoordinate.y = currentJ;
            }
            else {
                //error, can't move rule here
            }
        }
        else if (this.isSelectingReal) {
            this.realSelectionRectangle.layout.setLowerRight(e.offsetX - this.gridLayout.computed.position.x, e.offsetY - this.gridLayout.computed.position.y);
            this.realSelectionRectangle.layout.doLayout(this.gridLayout.computed);
        }
        else if (this.isAddingEdge) {
            if (this.edge) {
                let rule = this.rules.get(this.edge.tailRuleIndex);
                if (rule) {
                    this.edge.positionMovingArrow(e.offsetX, e.offsetY, rule, grid);
                }
            }
        }
    }
    disableEdgesForRule(rule) {
        for (let edge of this.edges) {
            if (edge.tailRuleIndex == rule.index
                || edge.headRuleIndex == rule.index) {
                edge.disable();
            }
        }
    }
    respositionEdgesForRule(rule, data, grid) {
        for (let edge of this.edges) {
            //TODO recalculate both arrow from and to if either tail or head index matches
            if (edge.tailRuleIndex == rule.index) {
                let other = this.rules.get(edge.headRuleIndex);
                edge.repositionBasedOnTailMove(rule, other, data, grid);
            }
            if (edge.headRuleIndex == rule.index) {
                let other = this.rules.get(edge.tailRuleIndex);
                edge.repositionBasedOnHeadMove(rule, other, data, grid);
            }
        }
    }
    isRuleGraphCyclic_VisitRule(rule, visited, recStack) {
        visited[rule.index] = true;
        recStack[rule.index] = true;
        for (let edge of this.edges) {
            if (edge.headRuleIndex == rule.index && !edge.isLoop()) {
                let neighbor = this.rules.get(edge.tailRuleIndex);
                if (neighbor) {
                    if (!visited[neighbor.index]) {
                        if (this.isRuleGraphCyclic_VisitRule(neighbor, visited, recStack)) {
                            return true;
                        }
                    }
                    else if (recStack[neighbor.index]) {
                        return true;
                    }
                }
            }
        }
        recStack[rule.index] = false;
        return false;
    }
    isRuleGraphCyclic() {
        let visited = new Array(this.maxRuleIndex).fill(false);
        let recStack = new Array(this.maxRuleIndex).fill(false);
        for (let element of this.rules) {
            let rule = element[1];
            if (rule.isEnabled() && !visited[rule.index]) {
                if (this.isRuleGraphCyclic_VisitRule(rule, visited, recStack)) {
                    return true;
                }
            }
        }
        return false;
    }
    calculateReachability() {
        let visited = new Array(this.maxRuleIndex).fill(false);
        let shouldVisit = [];
        for (let element of this.rules) {
            let rule = element[1];
            if (rule.index < InputState.Win && rule.index >= 0) {
                shouldVisit.push(rule);
            }
        }
        while (shouldVisit.length > 0) {
            let rule = shouldVisit.pop();
            if (rule) {
                visited[rule.index] = true;
                for (let edge of this.edges) {
                    if (edge.tailRuleIndex == rule.index) {
                        let neighbor = this.rules.get(edge.headRuleIndex);
                        if (neighbor && !visited[neighbor.index]) {
                            shouldVisit.push(neighbor);
                        }
                    }
                }
            }
        }
        for (let i = 0; i < visited.length; ++i) {
            let rule = this.rules.get(i);
            if (rule) {
                rule.setReachable(visited[i]);
            }
        }
    }
    canConnect(edge, rule) {
        if (rule.index < InputState.Win) {
            this.controller.onUserFeedback({
                state: UserFeedbackState.Error,
                message: "Error: Input rules can only have outgoing arrows.",
            });
            return false;
        }
        for (let other of this.edges) {
            if (other.tailRuleIndex == edge.tailRuleIndex
                && other.headRuleIndex == rule.index) {
                this.controller.onUserFeedback({
                    state: UserFeedbackState.Error,
                    message: "Error: These rules are already connected.",
                });
                return false;
            }
        }
        return true;
    }
    onMouseUp(i, j, data, grid) {
        if (this.isMovingRule) {
            let deltaI = this.movingLastCoordinate.x - this.movingStartCoordinate.x;
            let deltaJ = this.movingLastCoordinate.y - this.movingStartCoordinate.y;
            if (deltaI != 0 || deltaJ != 0) {
                this.edits.push(new RuleMove({
                    deltaI: -deltaI,
                    deltaJ: -deltaJ,
                    ruleIndex: this.movingRuleIndex,
                }));
            }
            this.isMovingRule = false;
            this.movingRuleIndex = -1;
            this.movingStartCoordinate.x = 0;
            this.movingStartCoordinate.y = 0;
            this.movingLastCoordinate.x = 0;
            this.movingLastCoordinate.y = 0;
        }
        else if (this.isMovingRealSelection) {
            this.isMovingRealSelection = false;
            this.movingStartCoordinate.x = 0;
            this.movingStartCoordinate.y = 0;
            this.movingLastCoordinate.x = 0;
            this.movingLastCoordinate.y = 0;
        }
        else if (this.isSelectingReal) {
            this.isSelectingReal = false;
            let layout = this.realSelectionRectangle.layout;
            let tileSize = grid.computeTileSize();
            if (tileSize >= Math.abs(layout.computed.size.width)
                || tileSize >= Math.abs(layout.computed.size.height)) {
                this.unselectSelectedObject();
            }
            else {
                this.realSelectionBox = grid.clipRectangleToCoordinates(layout);
                if (this.realSelectionBox.size.width != 0
                    && this.realSelectionBox.size.height != 0) {
                    this.realSelectionRectangle.lineDashSpeed = -0.333;
                    this.realSelectionRectangle.layout.doLayout(this.gridLayout.computed);
                }
                else {
                    this.unselectSelectedObject();
                }
            }
        }
        else if (this.isAddingEdge) {
            this.isAddingEdge = false;
            if (this.edge) {
                let ruleIndex = data[i][j][3];
                let rule = this.rules.get(ruleIndex);
                if (ruleIndex > -1
                    && rule
                    && this.canConnect(this.edge, rule)) {
                    this.edge.headRuleIndex = ruleIndex;
                    this.edge.finalizeArrowPosition(rule, data, grid);
                    if (this.edge.isLoop()) {
                        this.edge.arrow.arced = true;
                    }
                    this.edges.push(this.edge);
                    if (this.isRuleGraphCyclic()
                        && !this.isLoopException(this.edge)) {
                        this.controller.onUserFeedback({
                            state: UserFeedbackState.Error,
                            message: "Error: This edge would make the rule graph cyclic.",
                        });
                        this.edge.disable();
                    }
                    else {
                        this.calculateReachability();
                    }
                }
                else {
                    this.edge.disable();
                }
            }
        }
    }
    isLoopException(edge) {
        return edge.type == EdgeType.IfMatched
            && edge.headRuleIndex >= InputState.__Length
            && edge.isLoop();
    }
    onKeyDown(e) {
        if (e.keyCode == 46 || e.keyCode == 8) {
            if (this.selectedEdge) {
                let edge = this.selectedEdge;
                this.unselectSelectedObject();
                edge.disable();
                this.calculateReachability();
            }
            return true;
        }
        return false;
    }
}
//# sourceMappingURL=EditBoard.js.map