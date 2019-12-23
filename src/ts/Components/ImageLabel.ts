class ImageLabel implements Component {

	layout : Layout;
	children? : Component[];
	path : string;

	constructor(layout : Layout, path : string) {
		this.layout = layout;
		this.path = path;
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {
		
		ctx.drawImage(
			cp.getImage(this.path),
			this.layout.computed.position.x,
			this.layout.computed.position.y,
			this.layout.computed.size.width,
			this.layout.computed.size.height,
		);
	}
}