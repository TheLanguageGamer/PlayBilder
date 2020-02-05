"use strict";
class RuleOptionsGUI {
    constructor() {
        let ruleOptionsLayout = new Layout(1, 0, 10, 0, 0, 0, 100, 200);
        let ruleOptions = new Rectangle(ruleOptionsLayout);
        ruleOptions.lineWidth = 1;
        let rotationsCheckboxLayout = new Layout(0, 0, 5, 5, 0, 0, 12, 12);
        let _this = this;
        this.rotationsCheckbox = new Checkbox(rotationsCheckboxLayout, {
            onValueChanged(value) {
                if (_this.rule) {
                    _this.rule.includeRotations = value;
                }
            }
        });
        ruleOptions.children = [];
        ruleOptions.children.push(this.rotationsCheckbox);
        let rotationsLabelLayout = new Layout(0, 0, 22, 5, 1, 0, 0, 0);
        let rotationsLabel = new TextBox(rotationsLabelLayout, "Include Rotations");
        rotationsLabel.setFontSize(12);
        rotationsLabel.fillStyle = Constants.Colors.Black;
        ruleOptions.children.push(rotationsLabel);
        this.rootComponent = ruleOptions;
        this.hide();
    }
    hide() {
        this.rootComponent.layout.visible = false;
    }
    show(rule) {
        this.rule = rule;
        this.rootComponent.layout.visible = true;
        this.rotationsCheckbox.value = this.rule.includeRotations;
    }
}
//# sourceMappingURL=RuleOptionsGUI.js.map