class ContentProvider {
	private images : Record<string, HTMLImageElement> = {};
	getImage(path : string) {
		if (!(path in this.images)) {
			this.images[path] = new Image();
			this.images[path].src = path;
		}
		return this.images[path];
	}
}