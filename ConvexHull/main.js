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
	new Vec2(11.5, -4)
];

// Random points
const randomPointsSampleLength = 100;
const randomPointsSampleAmplitude = 10;
function generateRandomPoints(size, amplitude) {
	return new Array(size)
		.fill(0)
		.map(el => new Vec2(random101() * amplitude, random101() * amplitude));
}

let points = samplePoints;
let sortedArray = points.sort((a, b) => a.x - b.x);

function quickHull(points){

}

const convexHullStrategy = quickHull;

let closestPoints = undefined;
let pointsDistance = undefined;

function calculateConvexHull() {
	sortedArray = points.sort((a, b) => a.x - b.x);
	const closestPointsResult = convexHullStrategy(sortedArray);
	closestPoints = closestPointsResult.points;
	pointsDistance = closestPointsResult.distance;
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
	xScale = (width - pointRadius * 4) / xMagnitude;
	yScale = (height - pointRadius * 4) / yMagnitude;
}

function draw() {
	background(31);
	translate(screenPosition.x, screenPosition.y);
	scale(zoom);

	// Drawing points
	stroke(222);
	strokeWeight(1);

	for (let idx = 0; idx < points.length; idx++) {
		const currentPoint = points[idx];

		fill(255, 255, 255, 128);
		ellipse(currentPoint.x * xScale, currentPoint.y * yScale, pointRadius);
	}
}

// Setting button callbacks
const sampleButton = document.getElementById('button-sample');
const randomizeButton = document.getElementById('button-randomize');

const randomizeSlider = document.getElementById('random-points-range');
const randomizeText = document.getElementById('random-points-value');
randomizeSlider.oninput = function() {
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
const zoomSensitivity = 0.0005;
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
