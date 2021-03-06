"use strict";

// global variables
var gl, canvas; 
var ut; // for time

var tb, uTB;

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
    
    // Set up buffers and attributes
	var s = 1.0;
	var a = vec2(-s,-s);
	var b = vec2(s, -s);
	var c = vec2(s,s);
	var d = vec2(-s,s);

	var vertices = [a,b,c,d];
	var indices = [0,1,2,0,2,3];

	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);	

	// set up index buffer
	var ibuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
	
	ut = gl.getUniformLocation(program, "t");

    // set up virtual trackball
	tb = Trackball(canvas);
	uTB = gl.getUniformLocation(program, "TB");

	requestAnimationFrame(render);

};

function render(now){
	//Draw
	gl.uniform1f(ut,now*0.001);
    var TB = tb.getMatrix();
    gl.uniformMatrix4fv(uTB, gl.FALSE, flatten(inverse4(TB)));
    gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0); 
	requestAnimationFrame(render);
}


