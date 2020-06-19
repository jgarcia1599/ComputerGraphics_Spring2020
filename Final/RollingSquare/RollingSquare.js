"use strict";
var gl; // global variable
var ut, uc, timeSlider;
var ibuffer1, ibuffer2, ibuffer3;

window.onload = function init(){
	//Set  up WebGL
    var canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {alert( "WebGL isn't available" );}
    
    // Set viewport and clear canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.92, 0.92, 0.92, 1.0 );
  
    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // Set up buffers and attributes

	var s = 0.1;
	var vertices = [[0,0], [1,0], [1,1], [0,1], 
					[-5,0], [5,0], [0,-5], [0,5],
					[1,s], [1,-s], [2,s], [2,-s], 
					[3,s], [3,-s], [4,s],[4,-s] ];
	
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);	
	
	ibuffer1 = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer1);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0,1,2,0,2,3]), gl.STATIC_DRAW);
	
	ibuffer2 = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer2);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
				  new Uint8Array([0,1,1,2,2,3,3,0,4,5,6,7,8,9,10,11,12,13,14,15]),
				  gl.STATIC_DRAW);
	
	ibuffer3 = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer3);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array([0]), gl.STATIC_DRAW);
	
	ut = gl.getUniformLocation(program, "t");
	uc = gl.getUniformLocation(program, "color");
	timeSlider = document.getElementById("time");
	
	requestAnimationFrame(render); 
}; 

function render(){
	requestAnimationFrame(render);

    gl.clear(gl.COLOR_BUFFER_BIT);
	
	gl.uniform1f(ut, -1);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer2);
	gl.uniform4f(uc, 0.5, 0.5, 0.5, 1.0); // axes color
	gl.drawElements(gl.LINES, 12, gl.UNSIGNED_BYTE, 8);

	gl.uniform1f(ut, timeSlider.value); // set time

	// draw square
	gl.uniform4f(uc, 1.0, 0.95, 0.8, 1.0); // square color
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer1);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

	// draw square boundary
	gl.uniform4f(uc, 0.0, 0.0, 0.0, 1.0); // edges color
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer2);
	gl.drawElements(gl.LINES, 8, gl.UNSIGNED_BYTE, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer3);
	gl.drawElements(gl.POINTS, 1, gl.UNSIGNED_BYTE, 0);
	

	
}

