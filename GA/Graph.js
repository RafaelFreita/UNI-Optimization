'use strict';

function Graph() {
	this.nodes = [];
	this.edges = [];
}

Graph.prototype.clear = function () {
	this.nodes.length = 0;
	this.edges.length = 0;
};

Graph.prototype.addNode = function (point) {
	this.nodes.push(new GraphNode(point));
};

Graph.prototype.addEdge = function (id1, id2) {
	this.edges.push(
		new Edge([id1, id2], this.nodes[id1].point.distance(this.nodes[id2].point))
	);
};