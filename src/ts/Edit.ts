class Edit {
	type : EditType = EditType.NoOpt;
}

class CellEdit extends Edit {
	type : EditType = EditType.CellEdit
	i : number
	j : number
	cellData : number[]
	constructor(obj : {i : number, j : number, cellData : number[]}) {
		super();
		this.i = obj.i;
		this.j = obj.j;
		this.cellData = obj.cellData;
	}
}

class RuleMove extends Edit {
	type : EditType = EditType.RuleMove
	deltaI : number
	deltaJ : number
	ruleIndex : number
	constructor(obj : {deltaI : number, deltaJ : number, ruleIndex : number}) {
		super();
		this.deltaI = obj.deltaI;
		this.deltaJ = obj.deltaJ;
		this.ruleIndex = obj.ruleIndex;
	}
}