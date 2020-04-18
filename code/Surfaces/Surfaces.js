"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj;

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
	var Uniforms = ["time", "TB", "TBN", "VP", "cameraPosition",  
			  "Ia", "Id", "Is", "lightPosition"];

	Locations = getLocations(Attributes, Uniforms); // defined in Utils.js


	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	camera = Camera(); // Camera() is defined in Camera.js
	var eye = vec3(0, 2.0 , 5.0);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10);
	
	obj = parametricSurface(torus, 100, 100);
	//obj = parametricSurface(sphere, 100, 100);	
	//obj = parametricSurface(cubicSurfaceOfRevolution, 100, 100);
	objInit(obj);	// objInit(...) is defined in Object.js
	obj.setModelMatrix(rotateX(90));

	// set light source
	var Light = {
		position: vec3(-1,3,5),
		Ia: vec3(0.2, 0.2, 0.2),
		Id: vec3(0.8,0.8,0.8),
		Is: vec3(0.2,0.2,0.2)
	};

	gl.uniform3fv( Locations.lightPosition, flatten(Light.position) );
	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );

	requestAnimationFrame(render);
};



function render(now){
	
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var time = now/1000;
	gl.uniform1f(Locations.time, time);
	
	var TB = trackballWorldMatrix(trackball,camera);
	gl.uniformMatrix4fv(Locations.TB, gl.FALSE, flatten(TB));

	var TBN = normalTransformationMatrix(TB);
	gl.uniformMatrix3fv(Locations.TBN, gl.FALSE, flatten(TBN));

	var VP = camera.getMatrix(); 
	gl.uniformMatrix4fv(Locations.VP, gl.FALSE, flatten(VP));	

	var cameraPosition = camera.getFrame().e;
	gl.uniform3fv(Locations.cameraPosition, flatten(cameraPosition));

	obj.draw();
}


function parametricSurface(f, m, n){
	// Required: m, n >= 1
	// Returns an (m+1) x (n+1) grid with positions defined by f(s,t) where s,t \in [0,1]

	var i,j, idx;

	var G = {
		size: [m, n],
		f: f,
		positions: [],
		triangles: [],
		texCoords:[]
	};

	for(i=0; i<=m; ++i){
		for(j=0; j<=n; ++j){
			G.positions.push( f(i/m, j/n) );
			G.texCoords.push(i/m, j/n);
		}
	}

	for(i=0; i<m; ++i){
		for(j=0; j<n; ++j){
			idx = (n+1)*i + j;
			G.triangles.push([idx, idx+n+1, idx+n+2], [idx, idx+n+2, idx+1]);
		}
	}

	return G;
}



function torus(s,t){
		var R = 3, r = 1;
		s*=2*Math.PI; t*=2*Math.PI;
		var u = vec3(Math.cos(s), Math.sin(s), 0);
		var v = vec3(0,0,1);
		var w = add(scale(Math.cos(t), u), scale(Math.sin(t), v));
		return  add(scale(R,u), scale(r,w)) ;
}

function sphere(s,t){
	var r = 3;
	s=2*s*Math.PI; 
	t=(1-t)*Math.PI;
	return vec3( r*Math.cos(s)*Math.sin(t), 
				 r*Math.sin(s)*Math.sin(t), 
				 r*Math.cos(t));
}

function cubicSurfaceOfRevolution(s,t){
	t = 2*t-1;
	var rv = vec4(1.3, -0.9, 0.2, 0.3);
	var vt = vec4(t*t*t, t*t, t, 1);
	var r = dot(rv, vt) + 1;
	s *= 2*Math.PI;
	return vec3(r*Math.cos(s), r*Math.sin(s), 3*t);
}

