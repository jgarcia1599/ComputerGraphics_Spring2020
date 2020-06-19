"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj1, obj2;

var flag = 1; // to enable or disable normal mapping

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
	var Uniforms = ["flag","VP", "TB", "TBN", "cameraPosition", "Ia", "Id", "Is", "lightPosition"];

	Locations = getLocations(Attributes, Uniforms); // defined in Utils.js
 
	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	camera = Camera(); // Camera() is defined in Camera.js
	var eye = vec3(0,0,2);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10);


	// set light source
	var Light = {
		position: vec3(0,3,5),
		Ia: vec3(0.3, 0.3, 0.3),
		Id: vec3(1,1,1),
		Is: vec3(1,1,1)
	};

	gl.uniform3fv( Locations.lightPosition, flatten(Light.position) );
	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );


	// set up scene	

	obj1 = Sphere();
	obj1.diffuseMap = "Textures/earth-diffuse.jpg";
	obj1.normalMap = "Textures/earth-normal.jpg";
	objInit(obj1);
	obj1.setModelMatrix(rotateX(90));


	obj2 = Square();
	obj2.diffuseMap = "Textures/brick-diffuse.jpg";
	obj2.normalMap = "Textures/brick-normal.jpg";
	objInit(obj2);
	var m = mult(scalem(2,2,2),rotateX(90));
	m = mult(translate(0,-1,0), m);
	obj2.setModelMatrix(m);

	var btn = document.getElementById("btn");
	btn.onclick = function(){flag *= -1;};

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

	gl.uniform1i(Locations.flag,flag);

	obj1.draw();

	TB = mat4();
	gl.uniformMatrix4fv(Locations.TB, gl.FALSE, flatten(TB));

	TBN = mat3();
	gl.uniformMatrix3fv(Locations.TBN, gl.FALSE, flatten(TBN));

	obj2.draw();
}



//-------------------------- CREATE SPHERE ----------------------------------- 
function Sphere(){

	var S = { 	positions: [],
				normals: [],
				triangles: [],
				texCoords: [],
				material: {	Ka: vec3(0.1, 0.1, 0.1),
							Kd: vec3(0.7, 0.1, 0.6),
							Ks: vec3(0.1, 0.1, 0.1),
							shininess: 1
				}
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
			var idx = index(i,j);
			S.positions[idx] = pos(i,j);
			S.texCoords[idx] = tex(i,j);
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

	function tex(i,j){
		return vec2(j/M, 1-i/(N-1));
	}
	
	return S;
}





//-------------------------- CREATE SQUARE ----------------------------------- 

function Square(){
// create sphere with texture coordinates
	var a = vec3(-1,-1,0);
	var b = vec3(1,-1,0);
	var c = vec3(1,1,0);
	var d = vec3(-1,1,0);
	var n = vec3(0,0,1);
	var ta = vec2(0,0);
	var tb = vec2(1,0);
	var tc = vec2(1,1);
	var td = vec2(0,1);

	var S = {	positions: [a,b,c,d],
		 	  	normals:   [n,n,n,n], 
		 	  	texCoords: [ta,tb,tc,td],
		 	  	triangles: [[0,1,2],[0,2,3]],
		 	  	material: {	
							Ka: vec3(0.2, 0.2, 0.2),
							Kd: vec3(0.0, 1.0, 0.5),
							Ks: vec3(0.0, 0.0, 0.0),
		 	  				shininess: 10
		 	  	}
	};

	return S;
}
