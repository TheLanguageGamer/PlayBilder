def generate(prepend, color):
	with open(prepend + ".svg") as f:
		original = f.read()
		new = original.replace("white", color)
		path = prepend + color[1:] + ".svg"
		print("\"" + path + "\",")
		with open(path, 'w') as g:
			g.write(new)

def generateFutureIdeas(prepend, color1, color2):
	with open(prepend + ".svg") as f:
		original = f.read()
		new = original.replace("red", color1)
		new = new.replace("blue", color2)
		path = prepend + color1[1:] + "AND" + color2[1:] + ".svg"
		print("\"" + path + "\",")
		with open(path, 'w') as g:
			g.write(new)

def run(colors):
	for color in colors:
		generate("images/real/realV2", color)
	for color in colors:
		generate("images/future/futureV2", color)
	for color in colors:
		generate("images/idea/ideaV2", color)
	for color1 in colors:
		print("[")
		for color2 in colors:
			generateFutureIdeas("images/futureIdeas/futureIdea", color1, color2)
		print("],")

if __name__ == "__main__":
	run(["#8ED2C9", "#00AAA0", "#FF7A5A", "#FFB85F", "#2C5F2D", "#ED2B33", "#D85A7F", "#195190", "#A2A2A1", "#603F83", "#2BAE66", "#2D2926"])