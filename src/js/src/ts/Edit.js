"use strict";
class Edit {
    constructor() {
        this.type = EditType.NoOpt;
    }
}
class CellEdit extends Edit {
    constructor(obj) {
        super();
        this.type = EditType.CellEdit;
        this.i = obj.i;
        this.j = obj.j;
        this.cellData = obj.cellData;
    }
}
class RuleMove extends Edit {
    constructor(obj) {
        super();
        this.type = EditType.RuleMove;
        this.deltaI = obj.deltaI;
        this.deltaJ = obj.deltaJ;
        this.ruleIndex = obj.ruleIndex;
    }
}
//# sourceMappingURL=Edit.js.map