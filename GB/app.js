const vertShaderText = `
precision mediump float;

attribute vec3 vertPosition;
attribute vec2 vertTexCoord;

varying vec2 fragTexCoord;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

void main() {
	fragTexCoord = vertTexCoord;
	gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);
}
`;

const fragShaderText = `
precision mediump float;

varying vec2 fragTexCoord;

uniform sampler2D sampler;

void main() {
	gl_FragColor = texture2D(sampler, vec2(fragTexCoord.x, 1.0 - fragTexCoord.y));
}
`;

const groundFragShaderText = `
precision mediump float;

varying vec2 fragTexCoord;

uniform sampler2D sampler;

void main() {
	gl_FragColor = texture2D(sampler, fragTexCoord);
}
`;

const { mat4 } = glMatrix;
const { toRadian } = glMatrix.glMatrix;

const init = function () {
	const canvas = document.getElementById('game-surface');
	const gl = canvas.getContext('webgl', {alpha: false});

	if (!gl) {
		console.log('WebGL not supported, falling back on experimental.');
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Your browser does not support WebGL');
	}

	//
	// Init
	//
	gl.enable(gl.DEPTH_TEST);

	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND)

	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

	//
	// Shaders
	//
	const vertShader = gl.createShader(gl.VERTEX_SHADER);
	const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	const groundFragShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertShader, vertShaderText);
	gl.shaderSource(fragShader, fragShaderText);
	gl.shaderSource(groundFragShader, groundFragShaderText);

	gl.compileShader(vertShader);
	if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
		console.error(
			'ERROR compiling vertex shader!',
			gl.getShaderInfoLog(vertShader)
		);
		return;
	}

	gl.compileShader(fragShader);
	if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
		console.error(
			'ERROR compiling fragment shader!',
			gl.getShaderInfoLog(fragShader)
		);
		return;
	}

	gl.compileShader(groundFragShader);
	if (!gl.getShaderParameter(groundFragShader, gl.COMPILE_STATUS)) {
		console.error(
			'ERROR compiling ground fragment shader!',
			gl.getShaderInfoLog(groundFragShader)
		);
		return;
	}

	const program = gl.createProgram();
	gl.attachShader(program, vertShader);
	gl.attachShader(program, fragShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}

	gl.validateProgram(program); // Validating - Apparently it's expensive
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating program!', gl.getProgramInfoLog(program));
		return;
	}

	const groundProgram = gl.createProgram();
	gl.attachShader(groundProgram, vertShader);
	gl.attachShader(groundProgram, groundFragShader);
	gl.linkProgram(groundProgram);
	if (!gl.getProgramParameter(groundProgram, gl.LINK_STATUS)) {
		console.error('ERROR linking ground program!', gl.getProgramInfoLog(groundProgram));
		return;
	}

	gl.validateProgram(groundProgram);
	if (!gl.getProgramParameter(groundProgram, gl.VALIDATE_STATUS)) {
		console.error('ERROR validating ground program!', gl.getProgramInfoLog(groundProgram));
		return;
	}

	//
	// Create buffer
	//
	const quadVertices =
		// X		Y			Z		 U  V
		[
			-0.5, -0.5, 0.0, 0, 0,
			-0.5,	+0.5, 0.0, 0,	1,
			+0.5,	+0.5, 0.0, 1,	1,

			+0.5,	+0.5, 0.0, 1,	1,
			+0.5, -0.5, 0.0, 1, 0,
			-0.5,	-0.5, 0.0, 0,	0,
		];

	const quadVAO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, quadVAO);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(quadVertices),
		gl.STATIC_DRAW
	);

	const positionAttribLoc = gl.getAttribLocation(program, 'vertPosition');
	const texCoordAttribLoc = gl.getAttribLocation(program, 'vertTexCoord');

	gl.vertexAttribPointer(
		positionAttribLoc, 									// Attribute location
		3, 																	// Number of elements
		gl.FLOAT, 													// Type
		gl.FALSE, 													// Normalized
		5 * Float32Array.BYTES_PER_ELEMENT, // Size of element
		0 // Stride
	);
	gl.enableVertexAttribArray(positionAttribLoc);

	gl.vertexAttribPointer(
		texCoordAttribLoc, 									// Attribute location
		2, 																	// Number of elements
		gl.FLOAT, 													// Type
		gl.FALSE, 													// Normalized
		5 * Float32Array.BYTES_PER_ELEMENT, // Size of element
		3 * Float32Array.BYTES_PER_ELEMENT 	// Stride
	);
	gl.enableVertexAttribArray(texCoordAttribLoc);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	//
	// Create texture
	//
	gl.useProgram(groundProgram);
	const grassTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, grassTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('grass-image')
		);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.useProgram(null);

	gl.useProgram(program);
	const treeTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, treeTexture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
		gl.UNSIGNED_BYTE,
		document.getElementById('tree-image')
		);
	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.useProgram(null);

	//
	// Program Locations
	//
	const identityMatrix = new Float32Array(16);
	mat4.identity(identityMatrix);

	const worldMatrix = new Float32Array(16);
	const viewMatrix = new Float32Array(16);
	const projMatrix = new Float32Array(16);
	const billboardMatrix = new Float32Array(16);

	mat4.identity(worldMatrix);
	mat4.lookAt(
		viewMatrix,
		[0, 1, -2], // Eye
		[0, 0, 0], // Center
		[0, 1, 0] // Up
	);
	mat4.perspective(
		projMatrix,
		toRadian(45), // FovY
		canvas.width / canvas.height, // Aspect Ratio
		0.1, // Near
		100 // Far
	);
	mat4.identity(billboardMatrix);

	gl.useProgram(program);

	const matWorldUniformLoc = gl.getUniformLocation(program, 'mWorld');
	const matViewUniformLoc = gl.getUniformLocation(program, 'mView');
	const matProjUniformLoc = gl.getUniformLocation(program, 'mProj');

	gl.uniformMatrix4fv(matWorldUniformLoc, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLoc, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLoc, gl.FALSE, projMatrix);

	gl.useProgram(groundProgram);

	const matWorldUniformLocGround = gl.getUniformLocation(groundProgram, 'mWorld');
	const matViewUniformLocGround = gl.getUniformLocation(groundProgram, 'mView');
	const matProjUniformLocGround = gl.getUniformLocation(groundProgram, 'mProj');

	gl.uniformMatrix4fv(matWorldUniformLocGround, gl.FALSE, worldMatrix);
	gl.uniformMatrix4fv(matViewUniformLocGround, gl.FALSE, viewMatrix);
	gl.uniformMatrix4fv(matProjUniformLocGround, gl.FALSE, projMatrix);

	gl.useProgram(null);

	//
	// Main render loop
	//
	const TAU = Math.PI * 2;
	let angle = toRadian(90);

	const loop = function () {

		angle = (performance.now() / 1000 / 6) * TAU;
		mat4.rotate(worldMatrix, identityMatrix, toRadian(90), [1, 0, 0]);
		mat4.rotate(worldMatrix, worldMatrix, angle, [0, 0, 1]);
		mat4.scale(worldMatrix, worldMatrix, [1.5, 1.5, 0]);

		gl.useProgram(groundProgram);
		gl.uniformMatrix4fv(matWorldUniformLocGround, gl.FALSE, worldMatrix);
		
		gl.clearColor(0.75, 0.85, 0.8, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT);

		// Grass
		gl.bindTexture(gl.TEXTURE_2D, grassTexture);
		gl.activeTexture(gl.TEXTURE0);

		gl.bindBuffer(gl.ARRAY_BUFFER, quadVAO);
		gl.drawArrays(gl.TRIANGLES, 0, quadVertices.length);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		// Billboard
		gl.useProgram(program);

		mat4.translate(billboardMatrix, identityMatrix, [0, 0.35, 0]);
		gl.uniformMatrix4fv(matWorldUniformLoc, gl.FALSE, billboardMatrix);

		gl.bindTexture(gl.TEXTURE_2D, treeTexture);
		gl.activeTexture(gl.TEXTURE0);

		gl.bindBuffer(gl.ARRAY_BUFFER, quadVAO);
		gl.drawArrays(gl.TRIANGLES, 0, quadVertices.length);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		gl.useProgram(null);

		requestAnimationFrame(loop);
	};
	gl.useProgram(program);
	requestAnimationFrame(loop);

};

init();
