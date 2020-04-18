"use strict";

// global variables
var gl, canvas; 
var ut; // for time
var N = 5000; 

window.onload = function init(){
	//Set  up WebGL
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {alert( "WebGL isn't available" );}
    
    // Set viewport and clear canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
	var positions = [];
	for(let i = 0; i<=N; ++i){ positions.push(i/N); }

	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

	var vx = gl.getAttribLocation(program, "vx");
	gl.vertexAttribPointer(vx, 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vx);	

	ut = gl.getUniformLocation(program, "t");

	requestAnimationFrame(render);

};

function render(now){
	gl.uniform1f(ut, now*0.001);
	gl.clear(gl.COLOR_BUFFER_BIT)
	gl.drawArrays(gl.LINE_STRIP, 0, N+1); 
	requestAnimationFrame(render);
}


