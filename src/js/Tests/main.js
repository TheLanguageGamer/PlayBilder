"use strict";
let $loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
class TestBootstrapper {
    constructor(container) {
        this.game = new Game(container, {});
        let rectLayout1 = new Layout(0, 0, 20, 20, 0, 0, 300, 300);
        let rect1 = new Rectangle(rectLayout1);
        let textLayout1 = new Layout(0, 0, 5, 5, 1, 1, -10, -10);
        let textBox1 = new TextBox(textLayout1, $loremIpsum);
        textBox1.fillStyle = Constants.Colors.Black;
        rect1.children = [];
        rect1.children.push(textBox1);
        this.game.components.push(rect1);
        let rectLayout2 = new Layout(0, 0, 320, 20, 0, 0, 300, 500);
        let rect2 = new Rectangle(rectLayout2);
        let textLayout2 = new Layout(0, 0, 5, 5, 1, 1, -10, -10);
        let textBox2 = new TextBox(textLayout2, $loremIpsum);
        textBox2.fillStyle = Constants.Colors.Black;
        textBox2.setFontSize(18);
        rect2.children = [];
        rect2.children.push(textBox2);
        this.game.components.push(rect2);
        this.game.doLayout();
    }
}
let $testContainer = document.getElementById('container');
let testBootstrapper = new TestBootstrapper($testContainer);
testBootstrapper.game.start();
//# sourceMappingURL=main.js.map