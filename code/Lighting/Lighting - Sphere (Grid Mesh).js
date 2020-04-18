"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var sphere; 

var Locations;  // object containing location ids of shader variables 

window.onload = function init() {
	// Set up WebGL
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL( canvas );
	if(!gl){alert("WebGL setup failed!");}

	// set clear color 
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	//Enable depth test
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clearDepth(1.0);

	// Load shaders and initialize attribute buffers
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	var Attributes = [];
	var Uniforms = ["VP", "TB", "TBN", "cameraPosition", "Ia", "Id", "Is", "lightPosition"];
	Locations = getLocations(Attributes, Uniforms);

	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	camera = Camera(); 			// defined in Camera.js
	var eye = vec3(0,0, 3);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10);

	sphere = Sphere(6);

	objInit(sphere);// defined in Object.js
	sphere.setModelMatrix(scalem(2,1,2));

	// set light source
	var Light = {
		position: vec3(-5,10,20),
		Ia: vec3(0.2, 0.2, 0.2),
		Id: vec3(1,1,1),
		Is: vec3(0.8,0.8,0.8)
	};

	gl.uniform3fv( Locations.lightPosition, flatten(Light.position) );
	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );

	var shading = 3.0; // flat: 1.0, Gouraud: 2.0, Phong: 3.0
	gl.uniform1f(gl.getUniformLocation(program, "shading"), shading);

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

	sphere.draw();

}

//-------------------------- CREATE SPHERE ----------------------------------- 
function Sphere(){

	var S = { 	positions: [],
				normals: [],
				triangles: [],
			};
			
	var N = 100;   	 // # latitudes (including poles)
	var M = 2*N-1;   // # longitudes 
	
	/* We create an array of size N x (M+1).
	   The first and the last longitude lines have the
	   same positions but we distinguish between them
	   since they have different texture coordinates. */
	  
	  

	// for unit sphere with center (0,0,0), normal = position
	S.normals = S.positions; 
	
	var i, j;
	// fill positions array
	for(i=0; i < N; ++i){ 
		for(j=0; j <= M; ++j){ /* Note the <= */
			S.positions[index(i,j)] = pos(i,j);
		}
	}

	for(i = 0; i < N-1; ++i){ 
		for(j=0; j < M; ++j){
			S.triangles.push( vec3(index(i,j), index(i+1,j), index(i+1,j+1)) );
			S.triangles.push( vec3(index(i,j), index(i+1, j+1), index(i,j+1)) );	
		}
	}
	
	function index(i,j){
		return i*(M+1) + j;
	}

	function pos(i, j){
		var theta = i*Math.PI/(N-1);
		var phi = 2*j*Math.PI/M;
		return vec3(Math.sin(theta)*Math.cos(phi), 
					Math.sin(theta)*Math.sin(phi), 
					Math.cos(theta));
	}
	
	return S;
}


