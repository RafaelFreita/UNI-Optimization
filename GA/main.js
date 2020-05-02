'use strict';

// Helper
const random101 = () => Math.random() * 2 - 1;

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

function Graph() {
	this.nodes = [];
	this.edges = [];
}
Graph.prototype.clear = function () {
	this.nodes.length = 0;
	this.edges.length = 0;
};
Graph.prototype.addEdge = function (id1, id2) {
	this.edges.push([id1, id2]);
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

// Random points
const randomPointsSampleLength = 100;
const randomPointsSampleAmplitude = 10;
function generateRandomPoints(size, amplitude) {
	return new Array(size)
		.fill(0)
		.map((el) => new Vec2(random101() * amplitude, random101() * amplitude));
}

let points = [];
const graph = new Graph();
const sortedArrayByX = samplePoints.sort((a, b) => a.x - b.x);

// GRAHAM SCAN
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
	const sortedPoints = pointsWithoutPivot.sort((a, b) =>
		xAxis.angle(minYPoint.to(a)) > xAxis.angle(minYPoint.to(b)) ? 1 : -1
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

let convexHullPoints = [];
function calculateConvexHull() {
	convexHullPoints = grahamScan(points);
}

// VORONOI
// Generating voronoi
const screenBounds = [-15, -15, 15, 15];
const cellPolygons = [];
let voronoi;

function generateVoronoi() {
	graph.clear();
	graph.nodes = points;

	const delaunay = d3.Delaunay.from(points.map((el) => [el.x, el.y]));
	voronoi = delaunay.voronoi(screenBounds);

	// Extracting cell polygons for render
	const cellPolygonsGenerator = voronoi.cellPolygons();

	cellPolygons.length = 0;
	for (let polygon of cellPolygonsGenerator) {
		cellPolygons.push(polygon.map((el) => new Vec2(el[0], el[1])));
	}

	// Getting neighbors
	for (let i = 0; i < points.length; i++) {
		const neighborsGenerator = voronoi.neighbors(i);

		for (let neighborId of neighborsGenerator) {
			graph.addEdge(i, neighborId);
		}
	}
}

// Drawing
const pointRadius = 10;

// Defined as undefined because the value has to be filled inside the setup function
let screenCenter;
let screenSize;
let xScale, yScale;
let screenPosition;
let zoom = 1;

// Render options
let drawConvexHull = true;
let drawVoronoiDiagram = false;
let drawGraph = false;

// Setting up everything
//calculateConvexHull();
//generateVoronoi(samplePoints);

function clear() {
	background(31);
}

function setup() {
	const canvas = createCanvas(800, 600);
	canvas.parent('canvas-container');

	frameRate(60);

	background(31);

	screenSize = new Vec2(width, height);
	screenCenter = new Vec2(width / 2, height / 2);
	screenPosition = screenCenter;

	xScale = width / screenBounds[0];
	yScale = height / screenBounds[2];
}

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
	if (drawConvexHull) {
		stroke(222, 128, 128);
		for (let idx = 0; idx < convexHullPoints.length; idx++) {
			const nextIdx = idx + 1 >= convexHullPoints.length ? 0 : idx + 1;
			const currentPoint = convexHullPoints[idx];
			const nextPoint = convexHullPoints[nextIdx];

			ellipse(
				currentPoint.x * xScale,
				currentPoint.y * yScale * -1,
				pointRadius
			);
			line(
				currentPoint.x * xScale,
				currentPoint.y * yScale * -1,
				nextPoint.x * xScale,
				nextPoint.y * yScale * -1
			);
		}
	}

	// Voronoi
	if (drawVoronoiDiagram) {
		stroke(128, 222, 128);
		for (const polygon of cellPolygons) {
			for (let idx = 0; idx < polygon.length; idx++) {
				const nextIdx = idx + 1 >= polygon.length ? 0 : idx + 1;
				const currentPoint = polygon[idx];
				const nextPoint = polygon[nextIdx];

				line(
					currentPoint.x * xScale,
					currentPoint.y * yScale * -1,
					nextPoint.x * xScale,
					nextPoint.y * yScale * -1
				);
			}
		}
	}

	// Graph
	if (drawGraph) {
		stroke(128, 128, 222);
		for (const edge of graph.edges) {
			const [pA, pB] = [points[edge[0]], points[edge[1]]];

			line(
				pA.x * xScale,
				pA.y * yScale * -1,
				pB.x * xScale,
				pB.y * yScale * -1
			);
		}
	}
}

// Setting button callbacks
const sampleButton = document.getElementById('button-sample');
const randomizeButton = document.getElementById('button-randomize');
const confirmButton = document.getElementById('button-confirm');
const voronoiButton = document.getElementById('button-voronoi');
const graphButton = document.getElementById('button-graph');
const hullButton = document.getElementById('button-hull');

const randomizeSlider = document.getElementById('random-points-range');
const randomizeText = document.getElementById('random-points-value');
randomizeSlider.oninput = function () {
	randomizeText.innerHTML = `Random points quantity: ${randomizeSlider.value}`;
};
randomizeSlider.oninput(); // Calling callback once to set it up

function resetUI() {
	isDragginScreen = true;
	zoom = 1;
	screenPosition = screenCenter;
}

function useSampleData() {
	resetUI();

	points = samplePoints;
	calculateConvexHull();
	generateVoronoi();
}
sampleButton.onclick = useSampleData;

function useRandomizedData() {
	resetUI();

	points = generateRandomPoints(
		Number(randomizeSlider.value),
		randomPointsSampleAmplitude
	);

	calculateConvexHull();
	generateVoronoi();
}
randomizeButton.onclick = useRandomizedData;

function uniqueArrayOfPoints(arr) {
	return arr.filter(
		(point, index, self) =>
			self.findIndex((t) => t.x === point.x && t.y === point.y) === index
	);
}

confirmButton.onclick = function () {
	isDragginScreen = true;

	points = uniqueArrayOfPoints(points);

	calculateConvexHull();
	generateVoronoi();
};

hullButton.onclick = function () {
	drawConvexHull = !drawConvexHull;
};

graphButton.onclick = function () {
	drawGraph = !drawGraph;
};

voronoiButton.onclick = function () {
	drawVoronoiDiagram = !drawVoronoiDiagram;
};

// Movement and zoom
const mouseSensitivity = 0.1;
const zoomSensitivity = 0.005;
const zoomMin = 0.5,
	zoomMax = 5;
function mouseWheel(event) {
	if (isDragginScreen) {
		zoom -= zoomSensitivity * event.delta;
		zoom = constrain(zoom, zoomMin, zoomMax);
	}
	return false;
}

// Mouse drag
let xOffset = 0;
let yOffset = 0;
let isDragginScreen = false;
function mousePressed() {
	if (isDragginScreen) {
		xOffset = mouseX - screenPosition.x;
		yOffset = mouseY - screenPosition.y;
	} else {
		if (mouseX < 0 || mouseX > screenSize.x) return;
		if (mouseY < 0 || mouseY > screenSize.y) return;

		const newX = ((mouseX - screenCenter.x) / screenSize.x) * screenBounds[0];
		const newY = ((mouseY - screenCenter.y) / screenSize.y) * -screenBounds[2];

		points.push(new Vec2(newX, newY));
	}
}

function mouseDragged() {
	if (isDragginScreen) {
		screenPosition.x = mouseX - xOffset;
		screenPosition.y = mouseY - yOffset;
	}
}
