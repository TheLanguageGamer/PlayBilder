class Arrow {
	layout : Layout;
	children? : Component[];

	from : Pos = {x : 0, y : 0};
	to : Pos = {x : 0, y : 0};
	lineWidth : number = 4;

	constructor() {
		this.layout = new Layout(0, 0, 0, 0, 0, 0, 0, 0);
	}

	render(ctx : CanvasRenderingContext2D, cp : ContentProvider) {

        var headlen = Math.floor(this.lineWidth/2);

        var angle = Math.atan2(
        	this.to.y-this.from.y,
        	this.to.x-this.from.x
        );

        ctx.strokeStyle = "#131313";
        ctx.lineWidth = this.lineWidth;
        ctx.fillStyle = "#131313";
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(this.from.x, this.from.y);
        ctx.lineTo(this.to.x, this.to.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.to.x, this.to.y);
        ctx.lineTo(
        	this.to.x-headlen*Math.cos(angle-Math.PI/7),
        	this.to.y-headlen*Math.sin(angle-Math.PI/7)
        );

        ctx.lineTo(
        	this.to.x-headlen*Math.cos(angle+Math.PI/7),
        	this.to.y-headlen*Math.sin(angle+Math.PI/7)
        );

        ctx.lineTo(this.to.x, this.to.y);
        ctx.lineTo(
        	this.to.x-headlen*Math.cos(angle-Math.PI/7),
        	this.to.y-headlen*Math.sin(angle-Math.PI/7)
        );

        ctx.stroke();
        ctx.fill();
    }
 }


