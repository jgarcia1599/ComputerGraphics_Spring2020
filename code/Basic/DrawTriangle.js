"use strict";
var gl; // global variable
var ut;

window.onload = function init() {
			// Set up WebGL
			var canvas = document.getElementById("gl-canvas");
			gl = WebGLUtils.setupWebGL( canvas );
			if(!gl){alert("WebGL setup failed!");}
			
			// Clear canvas
			gl.clearColor(0.0, 1.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			
			// Load shaders and initialize attribute buffers
			var program = initShaders( gl, "vertex-shader", "fragment-shader" );
			gl.useProgram( program );
			
			// Load data into a buffer
			var vertices = [ -0.2, -0.2, 0.2, -0.2, -0.2, 0.2, -0.2, 0.2, 0.2, -0.2, 0.2, 0.2];
			// var vertices_1=[1, 1, -1, 1, 0, 0];
			// var vertives_2=[0, 0, -1, -1, 1, -1];
			// var vBuffer_1= gl.createBuffer();
			// var vBuffer_2=gl.createBuffer();
			var vBuffer = gl.createBuffer();//createbuffer in gpu, reference to it in variable
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

			//vbuffer_1
			// gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_1);
			// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_1), gl.STATIC_DRAW);

			//vbuffer_2
			// gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_2);
			// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices_2), gl.STATIC_DRAW);
			
			// Do shader plumbing
			var vPosition = gl.getAttribLocation(program, "vPosition");
			gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);//z i by default 0
			gl.enableVertexAttribArray(vPosition);


			ut=gl.getUniformLocation(program,"t");
			requestAnimationFrame(render);
			
			//Draw a triangle
			gl.drawArrays(gl.TRIANGLES,0,3); // note that the last argument is 3, not 1, always the number of vertices not the number of triangles
};

function render(now){
	var t= now/1000;
	requestAnimationFrame(render);
	gl.uniform1f(ut,t);

	gl.drawArrays(gl.TRIANGLES,0,3);

}