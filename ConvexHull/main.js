'use strict';

// Helper
const random101 = () => Math.random() * 2 - 1;
function getMedianPoint(points) {
	let medianX = 0,
		medianY = 0;
	for (const point of points) {
		medianX += point.x;
		medianY += point.y;
	}
	medianX /= points.length;
	medianY /= points.length;
	return new Vec2(medianX, medianY);
}

// ccw > 0: counter-clockwise; ccw < 0: clockwise; ccw = 0: collinear
function ccw(p1, p2, p3) {
	return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
}

function side(a, b, c) {
	const v = (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y);
	return Math.sign(v);
}

function distancePointToLine(edgeP1, edgeP2, point) {
	return (
		Math.abs(
			(edgeP2.y - edgeP1.y) * point.x -
				(edgeP2.x - edgeP1.x) * point.y +
				edgeP2.x * edgeP1.y -
				edgeP2.y * edgeP1.x
		) /
		Math.sqrt(
			Math.pow(edgeP2.y - edgeP1.y, 2) + Math.pow(edgeP2.x - edgeP1.x, 2)
		)
	);
}

function furthestPointFromEdge(points, edge) {
	const [p1, p2] = edge;
	let maxDistancePoint = points[0];
	let maxDistance = Number.MIN_SAFE_INTEGER;

	for (let point of points) {
		const distance = distancePointToLine(p1, p2, point);

		if (distance > maxDistance) {
			maxDistancePoint = point;
			maxDistance = distance;
		}
	}

	return maxDistancePoint;
}

// Vector2 class
const RAD = 180.0 / Math.PI;
function Vec2(x, y) {
	this.x = x;
	this.y = y;
}
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

// Points sample
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
	new Vec2(11.5, -4),
];

const test = samplePoints.slice(0, 7);
const testN = test.splice(3, 1);
testN[0].isInsidePolygon(test);

// Random points
const randomPointsSampleLength = 100;
const randomPointsSampleAmplitude = 10;
function generateRandomPoints(size, amplitude) {
	return new Array(size)
		.fill(0)
		.map((el) => new Vec2(random101() * amplitude, random101() * amplitude));
}

let points = samplePoints;
const sortedArrayByX = points.sort((a, b) => a.x - b.x);

function incrementalHull(points) {
	const sortedArray = points.sort((a, b) => a.x - b.x);
	const hull = [sortedArray[0], sortedArray[1], sortedArray[2]]; // Hull starts as first 3 points

	function removeInternalPoints() {
		let i = 0;
		while (i !== hull.length) {
			const newArray = [...hull];
			newArray.splice(i, 1);
			const isInside = hull[i].isInsidePolygon(newArray);
			if (isInside) {
				hull.splice(i, 1);
				continue;
			} else {
				i++;
			}
		}
	}

	for (let i = 3; i < sortedArray.length; i++) {
		if (i === 6) {
			console.log('Should remove one point now!');
		}
		const isPointInside = sortedArray[i].isInsidePolygon(hull);
		if (!isPointInside) {
			hull.push(sortedArray[i]);
			removeInternalPoints();
		}
	}

	return hull;
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

function grahamScan(points) {
	if (points.length <= 2) {
		throw new Error('Trying to create a hull from insufficient points.');
	}

	// 3 points is a hull
	if (points.length === 3) {
		points.push(points[0]);
		return points;
	}

	// Actually computing hull
	const hull = [];

	// Find min y point
	const minYPoint = findMinYPoint(points);
	hull.push(minYPoint);

	const pointsWithoutPivot = [...points];
	pointsWithoutPivot.splice(points.indexOf(minYPoint), 1);

	// Sort points by angle between x axis and vector minYPoint -> checkingPoint
	const xAxis = new Vec2(1, 0);
	const sortedPoints = pointsWithoutPivot.sort(
		(a, b) => xAxis.angle(minYPoint.to(a)) > xAxis.angle(minYPoint.to(b))
	);

	let currentIdx = 0;
	while (currentIdx < sortedPoints.length) {
		const currentPoint = sortedPoints[currentIdx];

		hull.push(currentPoint);

		const lastHullEdge = [hull[hull.length - 2], hull[hull.length - 1]];

		const nextPointIdx =
			currentIdx + 1 < sortedPoints.length ? currentIdx + 1 : 0;
		const nextPoint = sortedPoints[nextPointIdx];

		if (side(lastHullEdge[0], lastHullEdge[1], nextPoint) === 1) {
			hull.pop(); // Removing the current pivot
			hull.pop(); // Removing last pivot since it will be added when the function loops
			sortedPoints.splice(currentIdx, 1);
			currentIdx--;
		} else {
			currentIdx++;
		}
	}

	return hull;
}

function findMinMaxXPoints(points) {
	let minPoint = points[0];
	let maxPoint = points[0];

	for (let point of points) {
		if (point.x < minPoint.x) {
			minPoint = point;
		} else if (point.x > maxPoint.x) {
			maxPoint = point;
		}
	}

	return [minPoint, maxPoint];
}

function quickHull(points) {
	if (points.length <= 2) {
		throw new Error('Trying to create a hull from insufficient points.');
	}

	// 3 points is a hull
	if (points.length === 3) {
		points.push(points[0]);
		return points;
	}

	// Actually computing hull
	const minMaxPoints = findMinMaxXPoints(points);
	const hull = [minMaxPoints[0], minMaxPoints[1]];

	// Recursive step
	function quickHullStep(edge, points) {
		const maxDistancePoint = furthestPointFromEdge(points, edge);

		const edgeIdxA = hull.indexOf(edge[0]);
		hull.splice(edgeIdxA + 1, 0, maxDistancePoint);

		// Remove points inside triangle
		const triangle = [edge[0], edge[1], maxDistancePoint];
		const remainingPoints = [...points].filter(
			(el) =>
				!el.isInside(triangle[0], triangle[1], triangle[2]) &&
				triangle.indexOf(el) === -1
		);

		if (remainingPoints.length === 0) {
			return;
		}

		const pointsAP = [...remainingPoints].filter(
			(el) => ccw(edge[0], maxDistancePoint, el) > 0
		);
		const pointsPB = [...remainingPoints].filter(
			(el) => ccw(maxDistancePoint, edge[1], el) > 0
		);

		if (pointsAP.length > 0)
			quickHullStep([edge[0], maxDistancePoint], pointsAP);
		if (pointsPB.length > 0)
			quickHullStep([maxDistancePoint, edge[1]], pointsPB);
	}

	const pointsAB = [...points].filter(
		(el) => ccw(minMaxPoints[0], minMaxPoints[1], el) > 0
	);
	const pointsBA = [...points].filter(
		(el) => ccw(minMaxPoints[0], minMaxPoints[1], el) < 0
	);

	quickHullStep(minMaxPoints, pointsAB);
	quickHullStep(minMaxPoints.reverse(), pointsBA);

	// Closing loop
	hull.push(hull[0]);

	return hull;
}

const convexHullAlgorithms = {
	// incrementalHull, // Not working as expected
	grahamScan,
	quickHull,
};

const convexHullStrategy = convexHullAlgorithms.grahamScan;

let convexHullPoints = undefined;

function calculateConvexHull() {
	convexHullPoints = convexHullStrategy(points);
}

// Drawing
const pointRadius = 10;

// Defined as undefined because the value has to be filled inside the setup function
let screenCenter;
let xScale, yScale;
let screenPosition;
let zoom = 1;

calculateConvexHull();

function clear() {
	background(31);
}

function setup() {
	const canvas = createCanvas(800, 600);
	canvas.parent('canvas-container');

	frameRate(60);

	background(31);

	screenCenter = new Vec2(width / 2, height / 2);
	screenPosition = screenCenter;
	// Using scaling to ensure every point is visible on screen
	const xMagnitude =
		sortedArrayByX[sortedArrayByX.length - 1].x - sortedArrayByX[0].x;
	const yMagnitude = (() => {
		let min = Number.MAX_SAFE_INTEGER;
		let max = Number.MIN_SAFE_INTEGER;
		for (const point of sortedArrayByX) {
			if (point.y < min) {
				min = point.y;
			}
			if (point.y > max) {
				max = point.y;
			}
		}
		return max - min;
	})();
	xScale = (width - pointRadius * 4) / xMagnitude;
	yScale = (height - pointRadius * 4) / yMagnitude;
}

const drawConvexHull = true;

function draw() {
	background(31);
	translate(screenPosition.x, screenPosition.y);
	scale(zoom);

	// Drawing points
	stroke(222);
	strokeWeight(1);

	fill(255, 255, 255, 128);
	for (let idx = 0; idx < points.length; idx++) {
		const currentPoint = points[idx];

		ellipse(currentPoint.x * xScale, currentPoint.y * yScale * -1, pointRadius);
	}

	// Drawing lines
	if (!drawConvexHull) return;
	stroke(222, 128, 128);
	for (let idx = 0; idx < convexHullPoints.length; idx++) {
		const nextIdx = idx + 1 >= convexHullPoints.length ? 0 : idx + 1;
		const currentPoint = convexHullPoints[idx];
		const nextPoint = convexHullPoints[nextIdx];

		ellipse(currentPoint.x * xScale, currentPoint.y * yScale * -1, pointRadius);
		line(
			currentPoint.x * xScale,
			currentPoint.y * yScale * -1,
			nextPoint.x * xScale,
			nextPoint.y * yScale * -1
		);
	}
}

// Setting button callbacks
const sampleButton = document.getElementById('button-sample');
const randomizeButton = document.getElementById('button-randomize');

const randomizeSlider = document.getElementById('random-points-range');
const randomizeText = document.getElementById('random-points-value');
randomizeSlider.oninput = function () {
	randomizeText.innerHTML = `Random points quantity: ${randomizeSlider.value}`;
};
randomizeSlider.oninput(); // Calling callback once to set it up

function useSampleData() {
	zoom = 1;
	screenPosition = screenCenter;

	points = samplePoints;
	calculateConvexHull();
}
sampleButton.onclick = useSampleData;

function useRandomizedData() {
	zoom = 1;
	screenPosition = screenCenter;

	points = generateRandomPoints(
		Number(randomizeSlider.value),
		randomPointsSampleAmplitude
	);
	calculateConvexHull();
}
randomizeButton.onclick = useRandomizedData;

// Movement and zoom
const mouseSensitivity = 0.1;
const zoomSensitivity = 0.005;
const zoomMin = 0.5,
	zoomMax = 5;
function mouseWheel(event) {
	zoom -= zoomSensitivity * event.delta;
	zoom = constrain(zoom, zoomMin, zoomMax);
	return false;
}

// Mouse drag
let xOffset = 0;
let yOffset = 0;
let isDragginScreen = false;
function mousePressed() {
	xOffset = mouseX - screenPosition.x;
	yOffset = mouseY - screenPosition.y;
}

function mouseDragged() {
	screenPosition.x = mouseX - xOffset;
	screenPosition.y = mouseY - yOffset;
}
