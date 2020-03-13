// Canvas
const canvas = document.getElementById("the-canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "#000";
ctx.fillRect(0, 0, 10, 10);

// Algorithm

function Vec2(x, y){
	this.x = x;
	this.y = y;
}

function Vec3(x, y, z){
	this.x = x;
	this.y = y;
	this.z = z;
}

function fillColor(matrix, startCoordinate, newColor){
	
	const originalValue = matrix[startCoordinate.x][startCoordinate.y];
	const matrixSize = matrix.length;
	const s = matrixSize - 1;
	
	function setPixel(color){
		ctx.fillStyle = `rgba(${color.x},${color.y},${color.z},255)`;
		ctx.fillRect( x, y, 1, 1 );
	}
	
	function checkCoordinate(coordinate){
		if(matrix[coordinate.x][coordinate.y] !== originalValue){
			return;
		}
		else{
			matrix[coordinate.x][coordinate.y] = newColor;
			if(startCoordinate.x >= 1) {checkCoordinate(new Vec2(coordinate.x-1, coordinate.y+0))} // Left
			if(startCoordinate.y >= 1) {checkCoordinate(new Vec2(coordinate.x+0, coordinate.y-1))} // Top
			if(startCoordinate.x <= s) {checkCoordinate(new Vec2(coordinate.x+1, coordinate.y+0))} // Right
			if(startCoordinate.y <= s) {checkCoordinate(new Vec2(coordinate.x+0, coordinate.y+1))} // Down
		}
	}
	
	//checkCoordinate(startCoordinate);
	
	console.log("Matrix", matrix);
	console.log("Start coordinate", startCoordinate);
	console.log("New Color", newColor);
}

// Execution
const matrixSize = 10;
const matrix = new Array(matrixSize).fill(new Array(matrixSize).fill(0));
const startCoordinate = new Vec2(5, 5);
const newColor = new Vec3(255, 0, 0);

// Fill with circle

fillColor(matrix, startCoordinate, newColor);