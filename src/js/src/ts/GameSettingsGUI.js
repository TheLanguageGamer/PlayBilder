"use strict";
let kGameSettingsWidth = 150;
class GameSettingsGUI {
    constructor(gridSize, controller) {
        let fontSize = 18;
        let rootLayout = new Layout(1, 0, 10, 0, 0, 0, kGameSettingsWidth, 200);
        this.rootComponent = new Rectangle(rootLayout);
        this.rootComponent.lineWidth = 1;
        this.rootComponent.layout.relativeLayout = RelativeLayout.StackVertical;
        let titleLayout = new Layout(0, 0, 5, 5, 1, 0, 0, 20);
        let title = new TextInput(titleLayout, {}, "My Game");
        title.placeholderText = "Untitled";
        title.setFontSize(fontSize);
        title.setMaxTextLength((kGameSettingsWidth - 10) / (fontSize * 0.6));
        this.rootComponent.children = [];
        this.rootComponent.children.push(title);
        this.interval = this.addField({
            onTextChanged(newText) {
                let interval = parseInt(newText) || 0;
                controller.onIntervalChanged(interval);
            },
            labelText: "Interval (ms):",
            defaultValue: "200",
            maxTextLength: 4,
        });
        this.width = this.addField({
            onTextChanged(newText) {
                let width = parseInt(newText) || 5;
                width = Math.max(width, 5);
                controller.onWidthChanged(width);
                console.log("width:", newText);
            },
            labelText: "Width:",
            defaultValue: gridSize.width.toString(),
            maxTextLength: 2,
        });
        this.height = this.addField({
            onTextChanged(newText) {
                let height = parseInt(newText) || 5;
                height = Math.max(height, 5);
                controller.onHeightChanged(height);
                console.log("height:", newText);
            },
            labelText: "Height:",
            defaultValue: gridSize.height.toString(),
            maxTextLength: 2,
        });
        this.title = title;
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
        if (this.rootComponent.children) {
            this.rootComponent.children.push(label);
        }
        return textInput;
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