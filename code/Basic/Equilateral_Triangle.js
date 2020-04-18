"use strict";

// global variables
var gl; 
var vertices, vBuffer;

window.onload = function init() {
			// Set up WebGL
			var canvas = document.getElementById("gl-canvas");
			gl = WebGLUtils.setupWebGL( canvas );
			if(!gl){alert("WebGL setup failed!");}
			
			// Clear canvas
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			gl.clear(gl.COLOR_BUFFER_BIT);
			
			// Load shaders and initialize attribute buffers
			var program = initShaders( gl, "vertex-shader", "fragment-shader" );
			gl.useProgram( program );
			
			// Load data into a buffer
			vertices = [];
			var r =0.7;
			for(var t = 0; t <  2*Math.PI; t+=2*Math.PI/3){
				vertices.push(r*Math.cos(t), r*Math.sin(t));
			}
			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
			
			// Do shader plumbing
			var vPosition = gl.getAttribLocation(program, "vPosition");
			gl.enableVertexAttribArray(vPosition);
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

			// Draw
			gl.drawArrays(gl.TRIANGLES,0,3); 
			
};
