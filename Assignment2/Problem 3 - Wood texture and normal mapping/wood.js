"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj1, obj2;
var image1, image2;

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


	obj1 = square;
	objInit(obj1);
	var m = resizeModel(obj1, 1);
	obj1.setModelMatrix(m);
	requestAnimationFrame(render);

	// Load images
	//TEXTURE maps to unit 0
	var texture = gl.createTexture();
	var mySampler = gl.getUniformLocation(program, "mySampler");

	image1 = new Image();
	image1.onload = function(){
		console.log("debug");
		gl.activeTexture(gl.TEXTURE0); 			 // enable texture unit 0
 		gl.bindTexture(gl.TEXTURE_2D, texture);  // bind texture object to target
 		gl.uniform1i(mySampler, 0); 		 // connect sampler to texture unit 0

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip image's y axis
 		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image1);
 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		// gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_BYTE,0); 
	};
	image1.src = "wood-diffuse.jpg";

		//TEXTURE maps to unit 0
	var texture1 = gl.createTexture();
	var normalMap = gl.getUniformLocation(program, "normalMap");

	image2 = new Image();
	image2.onload = function(){
		console.log("debug");
		gl.activeTexture(gl.TEXTURE1); 			 // enable texture unit 1
 		gl.bindTexture(gl.TEXTURE_2D, texture1);  // bind texture object to target
 		gl.uniform1i(normalMap, 1); 		 // connect sampler to texture unit 1

		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip image's y axis
 		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2);
 		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

		// gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_BYTE,0); 
	};
	image2.src = "wood-normal.jpg";

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

	obj1.draw();

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