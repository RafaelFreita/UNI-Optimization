// Helper
const random101 = () => Math.random() * 2 - 1;

// Vector2 class
function Vec2(x, y) {
	this.x = x;
	this.y = y;
}
Vec2.prototype.distance = function(other) {
	return Math.sqrt(
		Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
	);
};

// Points
const samplePoints = [
	new Vec2(-13, 0.5),
	new Vec2(-10.5, -11.5),
	new Vec2(-10, 9),
	new Vec2(-4.5, -2),
	new Vec2(-1, 8.5),
	new Vec2(0.5, 6),
	new Vec2(0.5, -12),
	new Vec2(2, 12.5),
	new Vec2(3.5, 11),
	new Vec2(5.5, 3),
	new Vec2(5.5, -7),
	new Vec2(5, 11.5),
	new Vec2(6.5, 3.2),
	new Vec2(7, -10),
	new Vec2(9, -5),
	new Vec2(11.5, -4)
];

const randomPointsSampleLength = 100;
const randomPoints = new Array(randomPointsSampleLength)
	.fill(0)
	.map(el => new Vec2(random101() * 10, random101() * 10));

const points = randomPoints;

//const sortingAlgorithm = mergeSort;
//const sortedArray = sortingAlgorithm(points);

const sortedArray = points.sort((a, b) => a.x - b.x);

const xMagnitude = sortedArray[sortedArray.length - 1].x - sortedArray[0].x;
const yMagnitude = (() => {
	let min = Number.MAX_SAFE_INTEGER;
	let max = Number.MIN_SAFE_INTEGER;
	for (const point of sortedArray) {
		if (point.y < min) {
			min = point.y;
		}
		if (point.y > max) {
			max = point.y;
		}
	}
	return max - min;
})();

const closestPointsForDummies = function(points) {
	const n = points.length;
	let idxP1, idxP2;
	let minDist = Number.MAX_SAFE_INTEGER;
	let currentDist = undefined;

	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			currentDist = points[i].distance(points[j]);
			if (currentDist < minDist) {
				idxP1 = i;
				idxP2 = j;
				minDist = currentDist;
			}
		}
	}

	return [idxP1, idxP2];
};

const closestPointsStrategy = closestPointsForDummies;

const closestPoints = closestPointsStrategy(sortedArray);

let screenCenter;
const pointRadius = 5;
let xScale, yScale;

function setup() {
	createCanvas(600, 600);
	background(31);
	frameRate(30);
	noLoop();
	noStroke();

	screenCenter = new Vec2(width / 2, height / 2);
	// Using scaling to ensure every point is visible on screen
	xScale = (width - pointRadius * 2) / xMagnitude;
	yScale = (height - pointRadius * 2) / yMagnitude;
}

function draw() {
	for (let idx = 0; idx < points.length; idx++) {
		const currentPoint = points[idx];

		fill(255);
		if (idx === closestPoints[0] || idx === closestPoints[1]) {
			fill(255, 0, 0);
		}

		ellipse(
			currentPoint.x * xScale + screenCenter.x,
			currentPoint.y * yScale + screenCenter.y,
			pointRadius
		);
	}
}
