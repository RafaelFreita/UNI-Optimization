'use strict';

function Edge(nodes, distance = 1) {
	this.nodes = nodes; // Indexes
	this.distance = distance;
}

Edge.prototype.isEqual = function (idxA, idxB) {
	const [nA, nB] = this.nodes;
	return (nA === idxA && nB === idxB) || (nA === idxB && nB === idxA);
};