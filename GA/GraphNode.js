'use strict';

function GraphNode(point) {
	this.point = point;

	this.f = 0;
	this.g = 0;
	this.h = 0;

	this.parent = null;
}

GraphNode.prototype.isEqual = function (other) {
	return this.point.isEqual(other.point);
};