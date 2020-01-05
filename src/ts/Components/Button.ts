interface ButtonController {
	onClick : (e : MouseEvent) => boolean;
}

class Button implements Component {

	layout : Layout;
	children : Component[];
	controller : ButtonController;
	onClick : (e : MouseEvent) => InputResponse;
	onMouseDown : (e : MouseEvent) => boolean;
	onMouseOut : (e : MouseEvent) => void;

	background : Rectangle;
	foreground : Rectangle;
	imageLabel? : ImageLabel;
	togglePaths? : string[];
	toggleIndex : number = 0;

	setImagePath(path : string) {
		if (!this.imageLabel) {
			this.imageLabel = new ImageLabel(new Layout(0, 0, 0, 0, 1, 1, 0, 0), path);
			this.foreground.children = this.foreground.children ? this.foreground.children : [];
			this.foreground.children.push(this.imageLabel);
			this.imageLabel.layout.doLayout(this.foreground.layout.computed);
		}
		this.imageLabel.path = path;
	}

	constructor(
		layout : Layout,
		controller : ButtonController) {
		this.layout = layout;
		this.controller = controller;
		this.onClick = function(e : MouseEvent) {
			this.foreground.layout.offset.position.x = 3;
			this.foreground.layout.offset.position.y = -3;
			this.foreground.layout.doLayoutRecursive(this.layout.computed, this.foreground.children);
			this.controller.onClick(e);
			if (this.togglePaths) {
				this.toggleIndex = (this.toggleIndex + 1) % this.togglePaths.length;
			}
			return InputResponse.Sunk;
		}
		this.onMouseDown = function(e : MouseEvent) {
			this.foreground.layout.offset.position.x = 1;
			this.foreground.layout.offset.position.y = -1;
			this.foreground.layout.doLayoutRecursive(this.layout.computed, this.foreground.children);
			return true;
		}
		this.onMouseOut = function(e : MouseEvent) {
			this.foreground.layout.offset.position.x = 3;
			this.foreground.layout.offset.position.y = -3;
			this.foreground.layout.doLayoutRecursive(this.layout.computed, this.foreground.children);
		}

		this.background = new Rectangle(
			new Layout(0, 0, 0, 0, 1, 1, 0, 0));
		this.background.fillColor = Constants.Colors.White;

		this.foreground = new Rectangle(
			new Layout(0, 0, 3, -3, 1, 1, 0, 0));
		this.foreground.fillColor = Constants.Colors.White;

		this.children = [this.background, this.foreground];
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		if (this.togglePaths) {
			this.setImagePath(this.togglePaths[this.toggleIndex]);
		}
	}
}