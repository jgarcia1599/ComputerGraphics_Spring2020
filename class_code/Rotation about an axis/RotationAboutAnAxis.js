"use strict";

// global variables
var gl; 
var uM, uID;
var vBuffer, cBuffer;

window.onload = function init() {
			// Set up WebGL
			var canvas = document.getElementById("gl-canvas");
			gl = WebGLUtils.setupWebGL( canvas );
			if(!gl){alert("WebGL setup failed!");}
			
			// set clear color 
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			
			//Enable depth test
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LESS);
			gl.clearDepth(1.0);
			
			// Load shaders and initialize attribute buffers
			var program = initShaders( gl, "vertex-shader", "fragment-shader" );
			gl.useProgram( program );


			// set rotation axis and angle of rotation
			var vx = document.getElementById("vx");
			var vy = document.getElementById("vy");
			var vz = document.getElementById("vz");
			var angle = document.getElementById("angle");
			vx.onchange = vy.onchange = vz.onchange = angle.oninput = handler;
		
			
			// Load data into a buffer
			var s = 0.3;
			var a = vec3(-s,-s,s);
			var b = vec3(s,-s,s);
			var c = vec3(s,s,s);
			var d = vec3(-s,s,s);		
			var e = vec3(0,0,0);
			var s1 = vec3(-1,0,0);
			var s2 = vec3(1,0,0);
			var vertices = [a,b,e,b,c,e,c,d,e,d,a,e,a,b,c,a,c,d,s1,s2];

			var R = vec3(1,0,0);
			var G = vec3(0,1,0);
			var B = vec3(0,0,1);
			var X = vec3(0.0,0.5,0.5); 
			var Y = vec3(0.5, 0, 0.5);
			var Z = vec3(0.2, 0.3, 0.5);
			var colors = [R,R,R,G,G,G,B,B,B,X,X,X,Y,Y,Y,Y,Y,Y,Z,Z];


			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
			

			cBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

						
			// Do shader plumbing
			var vPosition = gl.getAttribLocation(program, "vPosition");
			gl.enableVertexAttribArray(vPosition);

			var vColor = gl.getAttribLocation(program,"vColor");
			gl.enableVertexAttribArray(vColor);

			gl.bindBuffer(gl.ARRAY_BUFFER,vBuffer);
			gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
			gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

			uM = gl.getUniformLocation(program,"M");
			uID = gl.getUniformLocation(program,"ID");

			gl.uniformMatrix4fv(uM, gl.FALSE, flatten(mat4())); // initialize M

			requestAnimationFrame(render);

};


function render(now){
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//draw pyramid
	gl.uniform1i(uID,1);
	gl.drawArrays(gl.TRIANGLES,0,18);

	//draw rotation axis
	gl.uniform1i(uID,2);
	gl.drawArrays(gl.LINES,18,2);
}

function handler(){
	// Get v and psi
	var v = vec3(parseFloat(vx.value), parseFloat(vy.value), parseFloat(vz.value));
	var psi = radians(parseFloat(angle.value));

	// Compute the rotation matrix
	var M = rot(v, psi);

	// Send matrix to the shaders
	gl.uniformMatrix4fv(uM, gl.FALSE, flatten(M));

	// Modify data for drawing the axis
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	var w = [-v[0], -v[1], -v[2]];
	gl.bufferSubData(gl.ARRAY_BUFFER,18*sizeof['vec3'],flatten([v,w]));
}

// The rotation functions below are corrected versions of
// rotateX, rotateY and rotateZ in MV.js in which some
// terms in rotateX and rotateY have incorrect signs.
// Also, we use radians instead of degrees.

function Rx(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  var rx = mat4( 1.0,  0.0,  0.0, 0.0,
      0.0,  c,  -s, 0.0,
      0.0, s,  c, 0.0,
      0.0,  0.0,  0.0, 1.0 );
  return rx;
}
function Ry(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  var ry = mat4( c, 0.0, s, 0.0,
      0.0, 1.0,  0.0, 0.0,
      -s, 0.0,  c, 0.0,
      0.0, 0.0,  0.0, 1.0 );
  return ry;
}
function Rz(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  var rz = mat4( c, -s, 0.0, 0.0,
      s,  c, 0.0, 0.0,
      0.0,  0.0, 1.0, 0.0,
      0.0,  0.0, 0.0, 1.0 );
  return rz;
}

function rot(v, psi) { 
	// psi is in radians
	var a = v[0], b = v[1], c = v[2];
	
	// compute theta and phi components 
	// of the spherical coordinate of v
	var s = Math.sqrt(a * a + b * b);
	var theta = Math.atan2(s, c);
	var phi = Math.atan2(b, a);
	
	return matProd(Rz(phi),Ry(theta),Rz(psi),Ry(-theta),Rz(-phi));
}

function matProd(){
	var M = arguments[0];
	for(var i=1; i<arguments.length; ++i){
		M = mult(M,arguments[i]);
	}
	return M;
}

function degrees(x){
	return 180*x/Math.PI;
}