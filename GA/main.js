'use strict';

// --- SETUP ---
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

// --- CONVEX HULL ---
// GRAHAM SCAN
let convexHullPoints = [];
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

function calculateConvexHull() {
	convexHullPoints = grahamScan(points);
}

// --- VORONOI ---
const screenBounds = [-15, -15, 15, 15];
const cellPolygons = [];
let voronoi;

function generateVoronoi() {
	graph.clear();
	points.forEach((el) => {
		graph.addNode(el);
	});

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
			// If edge already exists
			if (graph.edges.some((el) => el.isEqual(i, neighborId))) continue;

			graph.addEdge(i, neighborId);
		}
	}
}

// A*
let aStarPoints = [];
const selectedVertices = [];
const distanceToSelect = 0.5;

// 8 directions movement
function diagonalDistance(nodeA, nodeB) {
	const pA = nodeA.point;
	const pB = nodeB.point;

	return Math.max(Math.abs(pB.x - pA.x), Math.abs(pB.y - pA.y));
}

// L1 distance - 4 directions movement
function manhattanDistance(nodeA, nodeB) {
	const pA = nodeA.point;
	const pB = nodeB.point;

	return Math.abs(pB.x - pA.x) + Math.abs(pB.y - pA.y);
}

// L2 distance - movement in all directions
function euclidianDistance(nodeA, nodeB) {
	return nodeA.point.distance(nodeB.point);
}

const distanceHeuristic = euclidianDistance;

function computeAStar(graph, selectedPoints) {
	const [startPointIdx, endPointIdx] = selectedPoints;
	const startNode = graph.nodes[startPointIdx];
	const goalNode = graph.nodes[endPointIdx];

	const openList = [];
	const closedList = [];

	// Add start node to open list
	openList.push(startNode);

	while (openList.length > 0) {
		let currentNodeIdx = 0;
		let currentNode = openList[0];

		// Get node with least F
		for (let i = 1; i < openList.length; i++) {
			if (openList[i].f < currentNode.f) {
				currentNode = openList[i];
				currentNodeIdx = i;
			}
		}

		let currentNodeInGraph = graph.nodes.findIndex((el) =>
			el.isEqual(currentNode)
		);

		// Move current node from open list to closed list
		openList.splice(currentNodeIdx, 1);
		closedList.push(currentNode);

		// Check if reached the goal
		if (currentNode.point.isEqual(goalNode.point)) {
			const path = []; // Array of GraphNode indexes (graph.nodes)
			let current = currentNode;
			while (current !== null) {
				path.push(graph.nodes.findIndex((el) => el.isEqual(current)));
				current = current.parent;
			}
			return path.reverse();
		}

		// Create all children nodes
		const childrenNodes = [];
		const currentNodeEdges = graph.edges.filter(
			(el) =>
				el.nodes[0] === currentNodeInGraph || el.nodes[1] === currentNodeInGraph
		);

		for (let i = 0; i < currentNodeEdges.length; i++) {
			const checkingEdge = currentNodeEdges[i];
			const checkingNodeIdx = checkingEdge.nodes.find(
				(el) => el !== currentNodeInGraph
			);
			const checkingNode = graph.nodes[checkingNodeIdx];

			const newNode = new GraphNode(checkingNode.point);
			newNode.parent = currentNode;
			newNode.g = checkingEdge.distance + currentNode.g;

			childrenNodes.push(newNode);
		}

		// Compute values for children and add to open list
		for (let i = 0; i < childrenNodes.length; i++) {
			const currentChild = childrenNodes[i];

			// Skip node if it's already in the closed list
			if (closedList.some((el) => el.isEqual(currentChild))) continue;

			// Compute h and f
			currentChild.h = distanceHeuristic(currentChild, goalNode);
			currentChild.f = currentChild.g + currentChild.h;

			// Skip child if it's already in the open list and the other G is higher
			const childIdxInOpenList = openList.findIndex((el) =>
				el.isEqual(currentChild)
			);

			if (childIdxInOpenList !== -1) {
				if (currentChild.g > graph.nodes[childIdxInOpenList].g) continue;
			}

			// Add child to open list
			openList.push(currentChild);
		}
	}

	throw new Error("Couldn't find a path for the A*!");
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
let drawAStar = true;

function clear() {
	background(31);
}

function setup() {
	const canvasContainer = document.getElementById('canvas-container');
	const aspectRatio = 600 / 800;
	const canvas = createCanvas(
		canvasContainer.clientWidth,
		canvasContainer.clientWidth * aspectRatio
	);
	canvas.parent('canvas-container');

	frameRate(60);

	background(31);

	screenSize = new Vec2(width, height);
	screenCenter = new Vec2(width / 2, height / 2);
	screenPosition = screenCenter;

	xScale = width / Math.abs(screenBounds[0]);
	yScale = height / Math.abs(screenBounds[2]);
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
			const [pA, pB] = [points[edge.nodes[0]], points[edge.nodes[1]]];

			line(
				pA.x * xScale,
				pA.y * yScale * -1,
				pB.x * xScale,
				pB.y * yScale * -1
			);
		}
	}

	// A*
	if (drawAStar) {
		stroke(222, 222, 128);

		// Selected vertices
		for (let idx = 0; idx < selectedVertices.length; idx++) {
			const currentPoint = points[selectedVertices[idx]];
			ellipse(
				currentPoint.x * xScale,
				currentPoint.y * yScale * -1,
				pointRadius * 2
			);
		}

		strokeWeight(3);
		for (let idx = 0; idx < aStarPoints.length - 1; idx++) {
			const nextIdx = idx + 1 >= aStarPoints.length ? 0 : idx + 1;
			const currentPoint = points[aStarPoints[idx]];
			const nextPoint = points[aStarPoints[nextIdx]];

			line(
				currentPoint.x * xScale,
				currentPoint.y * yScale * -1,
				nextPoint.x * xScale,
				nextPoint.y * yScale * -1
			);
		}
	}
}

// --- INTERFACE ---
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

function clearAStar() {
	aStarPoints.clear();
	selectedVertices.clear();
}

function resetUI() {
	isDragginScreen = true;
	zoom = zoomMin;
	screenPosition = screenCenter;

	clearAStar();
}

function useSampleData() {
	resetUI();

	points = [...samplePoints];
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

Array.prototype.clear = function () {
	this.length = 0;
};

confirmButton.onclick = function () {
	if (!isDragginScreen) {
		points = uniqueArrayOfPoints(points);

		calculateConvexHull();
		generateVoronoi();

		confirmButton.innerText = 'Reset Points';
	} else {
		resetUI();

		zoom = 1;

		points.clear();
		convexHullPoints.clear();
		cellPolygons.clear();
		graph.clear();

		confirmButton.innerText = 'Confirm Points';
	}

	isDragginScreen = !isDragginScreen;
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
const zoomMin = 0.5;
const zoomMax = 5;

// Mouse drag
let xOffset = 0;
let yOffset = 0;
let isDragginScreen = false;

function screenToWorld(point) {
	return new Vec2(
		((point.x - screenCenter.x) / screenSize.x) * screenBounds[2] * (1 / zoom),
		((point.y - screenCenter.y) / screenSize.y) * screenBounds[0] * (1 / zoom)
	);
}

function selectPoint(selectionPoint) {
	const selectedPoint = graph.nodes.findIndex(
		(el) => selectionPoint.distance(el.point) <= distanceToSelect
	);

	if (selectedPoint === -1) return false;
	if (selectedVertices.some((el) => el === selectedPoint)) return false; // Only add if point has not been added

	selectedVertices.push(selectedPoint);
	if (selectedVertices.length > 2) selectedVertices.shift();

	if (selectedVertices.length === 2) {
		aStarPoints = computeAStar(graph, selectedVertices);
	}
}

function isMouseOutsideCanvas(mouseX, mouseY) {
	if (mouseX < 0 || mouseX > screenSize.x) return true;
	if (mouseY < 0 || mouseY > screenSize.y) return true;
	return false;
}

// --- p5JS CALLBACKS ---
function mouseWheel(event) {
	if (isMouseOutsideCanvas(mouseX, mouseY)) return true;

	// Mouse inside screen
	if (
		mouseX >= 0 &&
		mouseX <= screenSize.x &&
		mouseY >= 0 &&
		mouseY <= screenSize.y
	) {
		if (isDragginScreen) {
			zoom -= zoomSensitivity * event.delta;
			zoom = constrain(zoom, zoomMin, zoomMax);
		}
		return false;
	}

	return true;
}

function mousePressed() {
	if (isMouseOutsideCanvas(mouseX, mouseY)) return true;

	if (mouseButton === 'left' || mouseButton === 0) {
		if (isDragginScreen) {
			xOffset = mouseX - screenPosition.x;
			yOffset = mouseY - screenPosition.y;
		} else {
			points.push(screenToWorld(new Vec2(mouseX, mouseY)));
		}
	} else if (mouseButton === 'center') {
		const mouseToWorld = screenToWorld(new Vec2(mouseX, mouseY));
		selectPoint(mouseToWorld);
	}

	return false;
}

function doubleClicked() {
	const mouseToWorld = screenToWorld(new Vec2(mouseX, mouseY));
	selectPoint(mouseToWorld);
}

function mouseDragged() {
	if (mouseButton !== 'left' || mouseButton === 0) return false;

	if (isDragginScreen) {
		if (isMouseOutsideCanvas(mouseX, mouseY)) return true;

		screenPosition.x = mouseX - xOffset;
		screenPosition.y = mouseY - yOffset;
	}
}
