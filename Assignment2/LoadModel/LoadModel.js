"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj1, obj2;

window.onload = function init() {
	// Set up WebGL
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL( canvas );
	if(!gl){alert("WebGL setup failed!");}

	// set clear color 
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	//Enable depth test
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); // since WebGL uses left handed
	gl.clearDepth(1.0); 	 // coordinate system

	// Load shaders and initialize attribute buffers
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	// Get Locations of attributes and Locations
	var Attributes = [];
	var Uniforms = ["VP", "TB", "TBN", "cameraPosition", "Ia", "Id", "Is", "lightPosition"];

	Locations = getLocations(Attributes, Uniforms); // defined in Utils.js
 
	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	camera = Camera(canvas); // Camera(...) is defined in Camera.js
	var eye = vec3(4,1,2);
	var at = vec3(0, 1 ,0);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10);


	// set light source
	var Light = {
		position: vec3(4,4,4),
		Ia: vec3(0.1, 0.1, 0.1),
		Id: vec3(1.0,1.0,1.0),
		Is: vec3(0.8,0.8,0.8)
	};

	gl.uniform3fv( Locations.lightPosition, flatten(Light.position) );
	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );


	// obj1 = teapot;
	// objInit(obj1);
	// var m = resizeModel(obj1, 1);
	// obj1.setModelMatrix(m);
	// requestAnimationFrame(render);

	obj2 = bunny;
	objInit(obj2);
	var m = resizeModel(obj2, 1);
	obj2.setModelMatrix(m);
	requestAnimationFrame(render);

};

function render(now){
	
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var TB = trackballWorldMatrix(trackball, camera);
	gl.uniformMatrix4fv(Locations.TB, gl.FALSE, flatten(TB));

	var TBN = normalTransformationMatrix(TB);  // defined in Common/Utils.js
	gl.uniformMatrix3fv(Locations.TBN, gl.FALSE, flatten(TBN));
	
	var VP = camera.getMatrix(); 
	gl.uniformMatrix4fv(Locations.VP, gl.FALSE, flatten(VP));	

	var cameraPosition = camera.getFrame().e;
	gl.uniform3fv(Locations.cameraPosition, flatten(cameraPosition));

	//obj1.draw(); //draw teapot
	obj2.draw(); //draw bunny

}
function computeCentroid(obj){
	var vertices = new Array(0,0,0);
	var centroid = new Array(3);

	for (var i = 0; i < obj.positions.length; i++){
		vertices[0] += obj.positions[i][0];
		vertices[1] += obj.positions[i][1];
		vertices[2] += obj.positions[i][2];
	}
	for (var i = 0; i < centroid.length; i++){
		centroid[i] = vertices[i]/obj.positions.length;
	}
	return centroid;
}

function computeAlpha(obj, centroid, s){
	var vertices = new Array(Math.abs(obj.positions[0][0] - centroid[0]), 
							 Math.abs(obj.positions[0][1] - centroid[1]), 
							 Math.abs(obj.positions[0][2] - centroid[2]));
	for (var i = 0; i < obj.positions.length; i++){
		vertices[0] = Math.max(Math.abs(obj.positions[i][0] - centroid[0]), vertices[0]);
		vertices[1] = Math.max(Math.abs(obj.positions[i][1] - centroid[1]), vertices[1]);
		vertices[2] = Math.max(Math.abs(obj.positions[i][2] - centroid[2]), vertices[2]);
	}
	var alpha = Math.min(s/vertices[0], Math.min(s/vertices[1], s/vertices[2]));
	return alpha;
}

function resizeModel(obj, s) {
	var centroid = computeCentroid(obj);
	var alpha = computeAlpha(obj, centroid, s);
	var m = mult(scalem(alpha, alpha, alpha), translate(centroid[0]*(-1.0), centroid[1]*(-1.0), centroid[2]*(-1.0)));
	return m;
}