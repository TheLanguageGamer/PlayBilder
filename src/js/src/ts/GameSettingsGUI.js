"use strict";
let kGameSettingsWidth = 150;
class GameSettingsGUI {
    constructor(gridSize, controller) {
        let _this = this;
        let fontSize = 18;
        let container = new Container();
        container.layout = new Layout(1, 0, 10, 0, 0, 1, kGameSettingsWidth, 0);
        container.layout.relativeLayout = RelativeLayout.StackVertical;
        //Main game settings
        let gameRootLayout = new Layout(0, 0, 0, 0, 1, 0, 0, 120);
        let gameRootComponent = new Rectangle(gameRootLayout);
        gameRootComponent.lineWidth = 1;
        gameRootComponent.layout.relativeLayout = RelativeLayout.StackVertical;
        let titleLayout = new Layout(0, 0, 5, 5, 1, 0, 0, 20);
        let title = new TextInput(titleLayout, {}, "My Game");
        title.placeholderText = "Untitled";
        title.setFontSize(fontSize);
        title.setMaxTextLength((kGameSettingsWidth - 10) / (fontSize * 0.6));
        gameRootComponent.children = [];
        gameRootComponent.children.push(title);
        this.interval = this.addField({
            onTextChanged(newText) {
                let interval = parseInt(newText) || 0;
                controller.onIntervalChanged(interval);
            },
            labelText: "Interval (ms):",
            defaultValue: "200",
            maxTextLength: 4,
            children: gameRootComponent.children,
        });
        this.width = this.addField({
            onTextChanged(newText) {
                let width = parseInt(newText) || 5;
                width = Math.max(width, 15);
                controller.onWidthChanged(width);
                console.log("width:", newText);
            },
            labelText: "Width:",
            defaultValue: gridSize.width.toString(),
            maxTextLength: 2,
            children: gameRootComponent.children,
        });
        this.height = this.addField({
            onTextChanged(newText) {
                let height = parseInt(newText) || 5;
                height = Math.max(height, 15);
                controller.onHeightChanged(height);
                console.log("height:", newText);
            },
            labelText: "Height:",
            defaultValue: gridSize.height.toString(),
            maxTextLength: 2,
            children: gameRootComponent.children,
        });
        this.title = title;
        container.children.push(gameRootComponent);
        //Level settings
        let levelRootLayout = new Layout(0, 0, 0, 10, 0, 0, kGameSettingsWidth, 50);
        let levelRootComponent = new Rectangle(levelRootLayout);
        levelRootComponent.lineWidth = 1;
        levelRootComponent.layout.relativeLayout = RelativeLayout.StackVertical;
        let levelTitleLayout = new Layout(0, 0, 5, 5, 1, 0, 0, 20);
        let levelTitle = new TextInput(levelTitleLayout, {
            onTextChanged(newText) {
                controller.onLevelTitleChanged(newText);
            },
        }, "Level 1");
        levelTitle.placeholderText = "Untitled";
        levelTitle.setFontSize(fontSize);
        levelTitle.setMaxTextLength((kGameSettingsWidth - 10) / (fontSize * 0.6));
        let deleteButtonLayout = new Layout(0, 0, 5, 5, 1, 0, 0, 20);
        let deleteButton = new TextButton(deleteButtonLayout, {
            onClick(e) {
                controller.deleteLevel();
                return true;
            },
        }, "delete");
        levelRootComponent.children = [];
        levelRootComponent.children.push(levelTitle);
        levelRootComponent.children.push(deleteButton);
        container.children.push(levelRootComponent);
        //Rule settings
        let ruleOptionsLayout = new Layout(0, 0, 0, 10, 0, 0, kGameSettingsWidth, 125);
        let ruleOptions = new Rectangle(ruleOptionsLayout);
        ruleOptions.lineWidth = 1;
        ruleOptions.layout.relativeLayout = RelativeLayout.StackVertical;
        let ruleTitleLayout = new Layout(0, 0, 5, 5, 1, 0, 0, 20);
        let ruleTitle = new TextInput(ruleTitleLayout, {
            onTextChanged(newText) {
                controller.onRuleTitleChanged(newText);
            },
        }, "Rule 0");
        ruleTitle.placeholderText = "Untitled";
        ruleTitle.setFontSize(fontSize);
        ruleTitle.setMaxTextLength((kGameSettingsWidth - 10) / (fontSize * 0.6));
        ruleOptions.children = [];
        ruleOptions.children.push(ruleTitle);
        this.rotationsCheckbox = this.addCheckbox({
            onValueChanged(value) {
                if (_this.rule) {
                    _this.rule.include90Rotation = value;
                    _this.rule.include180Rotation = value;
                    _this.rule.include270Rotation = value;
                    _this.rotations90.value = value;
                    _this.rotations180.value = value;
                    _this.rotations270.value = value;
                }
            },
            labelText: "Include Rotations",
            leftMargin: 0,
            children: ruleOptions.children,
        });
        this.rotations90 = this.addCheckbox({
            onValueChanged(value) {
                if (_this.rule) {
                    _this.rule.include90Rotation = value;
                }
            },
            labelText: "90° rotation",
            leftMargin: 20,
            children: ruleOptions.children,
        });
        this.rotations180 = this.addCheckbox({
            onValueChanged(value) {
                if (_this.rule) {
                    _this.rule.include180Rotation = value;
                }
            },
            labelText: "180° rotation",
            leftMargin: 20,
            children: ruleOptions.children,
        });
        this.rotations270 = this.addCheckbox({
            onValueChanged(value) {
                if (_this.rule) {
                    _this.rule.include270Rotation = value;
                }
            },
            labelText: "270° rotation",
            leftMargin: 20,
            children: ruleOptions.children,
        });
        container.children.push(ruleOptions);
        this.rootComponent = container;
        this.levelTitle = levelTitle;
        this.deleteLevelButton = deleteButton;
        this.ruleOptions = ruleOptions;
        this.ruleTitle = ruleTitle;
        this.hideRuleOptions();
    }
    addField(obj) {
        let labelLayout = new Layout(0, 0, 5, 5, 0.7, 0, 0, 14);
        let label = new TextLabel(labelLayout, obj.labelText);
        label.setFontSize(12);
        label.fillStyle = Constants.Colors.Black;
        let layout = new Layout(1, 0, 5, 0, 1, 0, 0, 14);
        let textInput = new TextInput(layout, obj, obj.defaultValue);
        textInput.placeholderText = "0";
        textInput.setFontSize(12);
        textInput.setMaxTextLength(obj.maxTextLength);
        textInput.textInputType = TextInputType.Integer;
        label.children = [];
        label.children.push(textInput);
        obj.children.push(label);
        return textInput;
    }
    addCheckbox(obj) {
        let checkboxLayout = new Layout(0, 0, -17, 0, 0, 0, 12, 12);
        let checkbox = new Checkbox(checkboxLayout, {
            onValueChanged(value) {
                obj.onValueChanged(value);
            }
        });
        let labelLayout = new Layout(0, 0, 22 + obj.leftMargin, 8, 1, 0, 0, 15);
        let label = new TextBox(labelLayout, obj.labelText);
        label.setFontSize(12);
        label.fillStyle = Constants.Colors.Black;
        label.children = [];
        label.children.push(checkbox);
        obj.children.push(label);
        return checkbox;
    }
    setLevel(option, canDelete) {
        this.levelTitle.setText(option.label);
        this.deleteLevelButton.disabled = !canDelete;
    }
    setEditRule(rule) {
        this.rule = rule;
        this.ruleOptions.layout.visible = true;
        this.ruleTitle.setText(rule.title);
        this.rotations90.value = this.rule.include90Rotation;
        this.rotations180.value = this.rule.include180Rotation;
        this.rotations270.value = this.rule.include270Rotation;
        this.rotationsCheckbox.value =
            this.rule.include90Rotation
                && this.rule.include180Rotation
                && this.rule.include270Rotation;
    }
    hideRuleOptions() {
        this.ruleOptions.layout.visible = false;
    }
    hide() {
        this.rootComponent.layout.visible = false;
    }
    show() {
        this.rootComponent.layout.visible = true;
    }
    save() {
        return {
            title: this.title.getText(),
        };
    }
    load(obj) {
        this.title.setText(obj.title);
    }
}
//# sourceMappingURL=GameSettingsGUI.js.map