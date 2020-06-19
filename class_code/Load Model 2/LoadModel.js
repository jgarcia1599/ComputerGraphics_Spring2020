"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj1, obj2, obj3;

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


	// set up scene	
	
	// obj1 = teapot;
	// obj1.diffuseMap = "Textures/oldmetal.jpg";
	

	obj1 = rabbit;

	// set material
	obj1.material = {	
		Ka: vec3(0.0, 0.0, 0.0),
		Kd: vec3(Math.random(), Math.random(), Math.random()),
		Ks: vec3(0.01, 0.01, 0.01),
		shininess: 1 
	};
	
	obj1.diffuseMap = "Rabbit/rabbitDiffuse.jpg";
	obj1.normalMap = "Rabbit/rabbitNormal.jpg";

	var m, s;
	objInit(obj1);
	s = 1.3;
	m = mult(rotateY(40), scalem(s,s,s));
	m = mult(translate(2.2,0.75,0.2), m);
	obj1.setModelMatrix(m);

	obj2 = office_chair;
	obj2.diffuseMap = "Textures/office_chair_diffuse.jpg";
	objInit(obj2);

	obj3 = square;
	obj3.diffuseMap = "Textures/floor.gif";
	objInit(obj3);
	m = rotateX(90);
	s = 4;
	m = mult(scalem(s,s,s), m);
	obj3.setModelMatrix(m);
	

	
	requestAnimationFrame(render);

};

function render(now){
	
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var TB = trackballWorldMatrix(trackball, camera);
	gl.uniformMatrix4fv(Locations.TB, gl.FALSE, flatten(TB));

	var TBN = normalTransformationMatrix(TB); 
	gl.uniformMatrix3fv(Locations.TBN, gl.FALSE, flatten(TBN));
	
	var VP = camera.getMatrix(); 
	gl.uniformMatrix4fv(Locations.VP, gl.FALSE, flatten(VP));	

	var cameraPosition = camera.getFrame().e;
	gl.uniform3fv(Locations.cameraPosition, flatten(cameraPosition));

	obj1.draw();

	var m = mult(translate(0,0.01,0), scalem(0.02, 0.02, 0.02));
	obj2.setModelMatrix(m);	
	obj2.draw();
	
	m = mult(translate(2,0.01,0), scalem(0.02,0.02,0.02));
	obj2.setModelMatrix(m);	
	obj2.draw();

	obj3.draw();
}

