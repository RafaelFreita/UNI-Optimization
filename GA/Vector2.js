'use strict';

function Vec2(x, y) {
	this.x = x;
	this.y = y;
}

Vec2.prototype.isEqual = function (other) {
	return this.x === other.x && this.y === other.y;
};

Vec2.prototype.to = function (other) {
	return new Vec2(other.x - this.x, other.y - this.y);
};

Vec2.prototype.distance = function (other) {
	return Math.sqrt(
		Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
	);
};

Vec2.prototype.polarAngle = function () {
	return Math.atan(this.y / this.x);
};

Vec2.prototype.dotProduct = function (other) {
	return this.x * other.x + this.y * other.y;
};

Vec2.prototype.norm = function () {
	return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vec2.prototype.angle = function (other) {
	const dot = this.dotProduct(other);
	return Math.acos(dot / (this.norm() * other.norm())) * RAD;
};

Vec2.prototype.isInside = function (a, b, c) {
	const d1 = side(a, b, this);
	const d2 = side(b, c, this);
	const d3 = side(c, a, this);
	return d1 === d2 && d2 === d3;
};

Vec2.prototype.isInsidePolygon = function (points) {
	let angle = 0;
	for (let i = 0; i < points.length; i++) {
		const j = i + 1 >= points.length ? 0 : i + 1;
		const newVec = new Vec2(points[i].x - this.x, points[i].y - this.y);
		const nextVec = new Vec2(points[j].x - this.x, points[j].y - this.y);
		const newAngle = newVec.angle(nextVec);
		angle += newAngle;
	}
	return Math.round(angle) === 360;
};

function side(a, b, c) {
	const v = (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y);
	return Math.sign(v);
}

function findMinYPoint(points) {
	let minPoint = points[0];
	for (let point of points) {
		if (point.y < minPoint.y) {
			minPoint = point;
		}
	}
	return minPoint;
}