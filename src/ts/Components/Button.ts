interface ButtonController {	
	onClick : (e : MouseEvent) => boolean;
}

class Button implements Component {

	layout : Layout;
	children : Component[];
	controller : ButtonController;
	onClick : (e : MouseEvent) => boolean;

	background : Rectangle;
	foreground : Rectangle;

	constructor(
		layout : Layout,
		controller : ButtonController) {
		this.layout = layout;
		this.controller = controller;
		this.onClick = this.controller.onClick;

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