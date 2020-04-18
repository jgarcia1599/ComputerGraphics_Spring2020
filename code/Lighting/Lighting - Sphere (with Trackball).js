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

function Sphere(n){
	// n is the number of times to 
	// subdivide the faces recursively.

	var S = { 	positions: [],
		 	  	normals: [], 
		 	};

	var s2 = Math.sqrt(2);
	var s6 = Math.sqrt(6);

	var va = vec3(0,0,1);
	var vb = vec3(0, 2*s2/3, -1/3);
	var vc = vec3(-s6/3, -s2/3, -1/3);
	var vd = vec3(s6/3, -s2/3, -1/3);

	tetrahedron(va, vb, vc, vd, n);


	function tetrahedron(a,b,c,d,n){
		divideTriangle(d,c,b,n);
		divideTriangle(a,b,c,n);
		divideTriangle(a,d,b,n);
		divideTriangle(a,c,d,n);
	}

	function divideTriangle(a,b,c,n){
		if(n>0){
			var ab = normalize(mix(a,b,0.5));
			var ac = normalize(mix(a,c,0.5));
			var bc = normalize(mix(b,c,0.5));

			n--;

			divideTriangle(a,ab,ac,n);
			divideTriangle(ab,b,bc,n);
			divideTriangle(bc,c,ac,n);
			divideTriangle(ab,bc,ac,n);
		}
		else{
			triangle(a,b,c);
		}
	}

	function triangle(a,b,c){
		var norm = normalize(cross(subtract(b,a),
		                     subtract(c,a)));
		S.positions.push(a,b,c);
		S.normals.push(norm, norm, norm);
		//S.normals.push(a,b,c);
	}


	return S;
}
