"use strict";
var gl, ut, uMM; // global variables

var trackball; 	// virtual trackball 

window.onload = function init(){
	//Set  up WebGL
    var canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {alert( "WebGL isn't available" );}
    
    // Set viewport 
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );


    // Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    // set up virtual trackball
	trackball = Trackball(canvas);
  
    // Set up buffers and attributes
	var s = 1.0;
	var vertices = [-s, -s, s, -s, s, s, -s, -s, s, s, -s, s];
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);	
	ut = gl.getUniformLocation(program, "t");
	uMM = gl.getUniformLocation(program, "MM");

	var diffuseMapTexture = newTexture("billiard_ball_texture.jpg");
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, diffuseMapTexture);
	var loc = gl.getUniformLocation(program, "diffuseMapSampler");
	gl.uniform1i(loc, 0);

    var uAA = gl.getUniformLocation(program, "antialias");
    var antialias = 1;
    gl.uniform1i(uAA, antialias);
	document.getElementById("btn").onclick = function(){
		antialias *= -1;
		gl.uniform1i(uAA, antialias);
    };

    var unx = gl.getUniformLocation(program, "nx");
    gl.uniform1i(unx, canvas.width);
    var uny = gl.getUniformLocation(program, "ny");
    gl.uniform1i(uny, canvas.height);

	requestAnimationFrame(render);
}; 


function render(now){
	requestAnimationFrame(render);
	gl.uniform1f(ut, now*0.001);	 // set time (in seconds)
	gl.uniformMatrix4fv(uMM, gl.FALSE, flatten(inverse4(trackball.getMatrix())));
	gl.clear(gl.COLOR_BUFFER_BIT);	 // clear screen
	gl.drawArrays(gl.TRIANGLES,0,6); // draw  
}





