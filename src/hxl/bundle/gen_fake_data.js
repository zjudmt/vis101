function Bundle(container, w, h) {
	var div = d3.select(container)
		.style("width", w)
		.style("height", h)
		.style("position", "absolute");
	var svg = this.svg = div.append("svg:svg")
		.attr("width", w)
		.attr("height", w)
		.append("svg:g")
		.attr("transform", "translate(" + 300 + "," + 300 + ")");

	var cluster = this.cluster = d3.layout.cluster()
		.size([360, 240])
		.sort(function(a, b) {
			return d3.ascending(a.name, b.name);
		});

	var bundle = this.bundle = d3.layout.bundle();
	var line = this.line = d3.svg.line.radial()
		.interpolate("bundle")
		.tension(.85)
		.radius(function(d) {
			return d.y;
		})
		.angle(function(d) {
			return d.x / 180 * Math.PI;
		});
}

Bundle.prototype.set_data = function(graph) {
	var that = this;
	var nodes = that.cluster.nodes(graph.nodes[0]);
	var splines = that.bundle(graph.links);
	that.link = that.svg.selectAll("path.link")
		.data(graph.links)
		.enter().append("svg:path")
		.attr("class", function(d) {
			return "link source-" + d.source.name + " target-" + d.target.name;
		})
		.attr("d", function(d, i) {
			return that.line(splines[i]);
		});

	that.node = that.svg.selectAll("g.node")
		.data(nodes.filter(function(n) {
			return !n.children;
		}))
		.enter().append("svg:g")
		.attr("class", "node")
		.attr("id", function(d) {
			return "node-" + d.key;
		})
		.attr("transform", function(d) {
			return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
		})
		.append("svg:text")
		.attr("dx", function(d) {
			return d.x < 180 ? 8 : -8;
		})
		.attr("dy", ".31em")
		.attr("text-anchor", function(d) {
			return d.x < 180 ? "start" : "end";
		})
		.attr("transform", function(d) {
			return d.x < 180 ? null : "rotate(180)";
		})
		.text(function(d) {
			return d.name;
		})
		.on("mouseover", mouseovered)
		.on("mouseout", mouseouted);

	function mouseovered(d) {
		that.node
			.each(function(n) {
				n.target = n.source = false;
			});

		that.link
			.classed("link--target", function(l) {
				if (l.target.name === d.name) {
					return l.source.source = true;
				}
			})
			.classed("link--source", function(l) {
				if (l.source.name === d.name) {
					return l.target.target = true;
				}
			})
			.filter(function(l) {
				return l.target === d || l.source === d;
			})
			.each(function() {
				this.parentNode.appendChild(this);
			});

		that.node
			.classed("node--target", function(n) {
				return n.target;
			})
			.classed("node--source", function(n) {
				return n.source;
			});
	}

	function mouseouted(d) {
		that.link
			.classed("link--target", false)
			.classed("link--source", false);

		that.node
			.classed("node--target", false)
			.classed("node--source", false);
	}
};

var random_int = function (max) {
	return Math.floor(Math.random() * max);
};

var gen_fake_data = function (size, group) {
	var nodes = [];
	var links = [];

	var root = {
		name: "root",
		children: []
	};
	nodes.push(root);

	for (var i = 0; i < group; i ++) {
		var np = {
			name: "parent " + i,
			group: i,
			parent: root,
			children: []
		};
		nodes.push(np);
		root.children.push(np);
	}
	
	for (var i = 0; i < size; i ++) {
		var g = random_int(group);
		var nd = {
			name: "node " + i,
			group: g,
			parent: nodes[g + 1]
		};
		nodes.push(nd);
		nodes[g + 1].children.push(nd);
	}
	for (var i = 0; i < Math.log2(size) * size; i ++) {
		var s = random_int(size) + group + 1;
		var e = s;
		while (e == s) {
			e = random_int(size) + group + 1;
		}
		links.push({
			source: nodes[s],
			target: nodes[e]
		});
	}
	return {
		nodes: nodes,
		links: links
	};
};

var bundle = new Bundle("#bundle", 800, 800);

bundle.set_data(gen_fake_data(100, 10));