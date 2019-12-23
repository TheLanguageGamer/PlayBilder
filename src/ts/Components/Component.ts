interface Component {
	render : (ctx : CanvasRenderingContext2D, cp : ContentProvider) => void;
	onClick? : (e : MouseEvent) => boolean;
	onMouseDown? : (e : MouseEvent) => boolean;
	onMouseUp? : (e : MouseEvent) => boolean;
	onMouseMove? : (e : MouseEvent) => boolean;
	onMouseOut? : (e : MouseEvent) => void;

	layout : Layout
	children? : Component[]
}