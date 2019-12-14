interface ButtonController {	
	onClick : (e : MouseEvent) => void;
}

class Button implements Component {

	layout : Layout;
	children : Component[];
	controller : ButtonController;

	background : Rectangle;
	foreground : Rectangle;

	constructor(
		layout : Layout,
		controller : ButtonController) {
		this.layout = layout;
		this.controller = controller;

		this.background = new Rectangle(
			new Layout(0, 0, 0, 0, 1, 1, 0, 0));
		this.background.fillColor = Constants.Colors.White;

		this.foreground = new Rectangle(
			new Layout(0, 0, 3, -3, 1, 1, 0, 0));
		this.foreground.fillColor = Constants.Colors.White;

		this.children = [this.background, this.foreground];
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {}
}