"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj, obj1, obj2;

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
	var eye = vec3(0, -8.0 , 4.0);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,0,1);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,20);
	
	obj = mobius(5, 1);
	//obj = torus(4,1);
	//obj = sphere(4);
	//obj = cubicSurfaceOfRevolution();

	// set light source
	var Light = {
		position: vec3(-1,-5,4),
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
			G.positions.push(f(i/m, j/n));
			G.texCoords.push([i/m, j/n]);
		}
	}

	for(i=0; i<m; ++i){
		for(j=0; j<n; ++j){
			idx = (n+1)*i + j;
			G.triangles.push([idx, idx+n+1, idx+n+2], [idx, idx+n+2, idx+1]);
			//G.triangles.push([idx, idx+n+2, idx+n+1], [idx+1, idx+n+2, idx]);
		}
	}

	return G;
}


function torus(R, r){
	var obj = parametricSurface(f, 100, 100);
	objInit(obj);
    return obj;

	function f(s,t){
			s*=2*Math.PI; t*=2*Math.PI;
			var u = vec3(Math.cos(s), Math.sin(s), 0);
			var v = vec3(0,0,1);
			var w = add(scale(Math.cos(t), u), scale(Math.sin(t), v));
			return  add(scale(R,u), scale(r,w)) ;
	}
}

function sphere(r){
	var obj = parametricSurface(f, 100, 100);
	objInit(obj);
    return obj;

	function f(s,t){
		s=2*s*Math.PI; 
		t=(1-t)*Math.PI;
		return vec3( r*Math.cos(s)*Math.sin(t), 
					 r*Math.sin(s)*Math.sin(t), 
					 r*Math.cos(t));
	}
}

function cubicSurfaceOfRevolution(){
	var obj = parametricSurface(f, 100, 100);
	objInit(obj);
    return obj;

	function f(s,t){
		t = 2*t-1;
		var rv = vec4(1.3, -0.9, 0.2, 0.3);
		var vt = vec4(t*t*t, t*t, t, 1);
		var r = dot(rv, vt) + 1;
		s *= 2*Math.PI;
		var v = vec3(r*Math.cos(s), r*Math.sin(s), 3*t);
		return scale(1.5, v);
	}
}


function mobius(R, d){
	var s ={}, s1, s2;
	
	var h = 0.01;
	s1 = parametricSurface(f, 100, 100);
	h *= -1;
	s2 = parametricSurface(f, 100, 100);

	objInit(s1);
	objInit(s2);
	s2.material = s1.material;
    
    s.draw = function(){ s1.draw(); s2.draw(); }

    return s;

   /* --- Helper functions below ---*/

	function f(s,t){
		var phi = Math.PI*s;
		var theta = 2*phi;
		var u = vec3(Math.cos(theta), Math.sin(theta), 0);
		var v = vec3(0, 0, 1);
		var cp = Math.cos(phi); 
		var sp = Math.sin(phi);
		var w = add(scale(cp,u), scale(sp, v));
		var x = add(scale(-sp,u), scale(cp, v));
		var r  = d*Math.sign(h)*(1-2*t);
		return add(add(scale(R,u), scale(r,w)), scale(h,x));
	}
}


