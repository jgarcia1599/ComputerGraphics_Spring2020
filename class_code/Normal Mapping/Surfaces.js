"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj;

var flag = 1;

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
	var Uniforms = ["flag", "TB", "TBN", "VP", "cameraPosition",  
			  "Ia", "Id", "Is", "lightPosition"];

	Locations = getLocations(Attributes, Uniforms); // defined in Utils.js


	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	camera = Camera(); // Camera() is defined in Camera.js
	var eye = vec3(0, -5.0 , 2.0);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,0,1);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,20);
	
	obj = knotTube();
	//obj = board();
	//obj = earth();
	//obj = donut();
	//obj = vase();
	//bj = conic();

	obj.material = {	
		Ka: vec3(1.0, 1.0, 1.0),
		Kd: vec3(Math.random(), Math.random(), Math.random()),
		Ks: vec3(0.4, 0.4, 0.4),
		shininess: 500 
	};
	
	objInit(obj);	// objInit(...) is defined in Object.js

	// set light source
	var Light = {
		position: vec3(-1,-5,3),
		Ia: vec3(0.2, 0.2, 0.2),
		Id: vec3(0.8,0.8,0.8),
		Is: vec3(0.4,0.4,0.4)
	};

	gl.uniform3fv( Locations.lightPosition, flatten(Light.position) );
	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );

	var btn = document.getElementById("btn");
	btn.onclick = function(){flag *= -1;};

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

	gl.uniform1i(Locations.flag,flag);
	obj.draw();
}

function board(){

	function fpos(s,t){
		return scale (4, vec3(2*s-1, 2*t-1, 0));
	}

	var obj = parametricSurface({fpos: fpos});
	obj.diffuseMap = "Textures/wood-diffuse.jpg";
	obj.normalMap = "Textures/wood-normal.jpg";

	return obj;
}

function earth(){
	var obj = parametricSurface({fpos: sphere});
	obj.diffuseMap = "Textures/earth-diffuse.jpg";
	obj.normalMap = "Textures/earth-normal.jpg";
	return obj;
}


function donut(){
	function ftex(s,t){ return vec2(5*s, 3*t); }
	var obj = parametricSurface({fpos: torus, ftex: ftex});
	obj.diffuseMap = "Textures/donut.png";
	obj.normalMap = "Textures/brick2-normal.jpg";
	return obj;
}


function vase(){

	function fpos(s,t){
		t = 2*t-1;
		var rv = vec4(1.3, -0.9, 0.2, 0.3);
		var vt = vec4(t*t*t, t*t, t, 1);
		var r = dot(rv, vt) + 1;
		s *= 2*Math.PI;
		return vec3(r*Math.cos(s), r*Math.sin(s), 3*t);
	}

	var obj = parametricSurface({fpos: fpos});
	obj.diffuseMap = "Textures/ceramic-diffuse.jpg";
	obj.normalMap = "Textures/brick2-normal.jpg";
	return obj;
}

function conic(){
	var obj = parametricSurface({fpos: cone});
	obj.diffuseMap = "Textures/gold-diffuse.jpg";
	obj.normalMap = "Textures/brick-normal.jpg";
	return obj;
}

function knotTube(){
	var obj = parametricSurface({fpos: knot, size: [500, 100]});
	obj.diffuseMap = "Textures/ceramic-diffuse.jpg";
	obj.normalMap = "Textures/ceramic-normal.jpg";
	return obj;
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

function cone(s,t){
	var r = 3*(1-t);
	s *= 2*Math.PI; 
	return vec3(r*Math.cos(s), r*Math.sin(s), 3*t);
}


function knot(s,t){
/* Knots from http://paulbourke.net/geometry/knots/ */

	var beta = Math.PI*s; 		// beta  \in [0,PI] 
	var alpha = 2*Math.PI*t;	// alpha \in [0,2*PI]
	var delta = 0.001;
	var tr = 0.3; // tube radius 

	function xyz(r, theta, phi){
		/*  Note the difference in notation: theta and phi 
   			are different from what we used in class. 	*/
		return vec3( r*Math.cos(phi)*Math.cos(theta),
					 r*Math.cos(phi)*Math.sin(theta),
					 r*Math.sin(phi) );
	}

	function knot4(beta){
		var r = 0.8 + 1.6*Math.sin(6*beta);
		var theta = 2*beta;
		var phi = 0.6*Math.PI*Math.sin(12*beta);
		return xyz(r, theta, phi);
	}

	function knot5(beta){
		beta  += 0.2;
		var r = 2 + 0.6 * Math.sin(0.5*Math.PI + 6*beta)
		var theta = 4*beta;
		var phi = 0.2*Math.PI*Math.sin(6*beta);
		return xyz(r, theta, phi);
	}

	function tor(beta){
		return xyz(3, 2*beta, 0);
	}

	var f = knot5;
	
	var p = f(beta);
	var dp = subtract(f(beta + delta), p);
	var xx = normalize(clone(p));
	var yy = cross(xx, normalize(dp));
	var v = add( scale(tr*Math.cos(alpha), xx),  
				 scale(tr*Math.sin(alpha), yy)	);

	//return add(p, scale(0.9*tr, xx));
	return add(p, v);
}


function parametricSurface(params){ 
	var m, n;
	
	if(params == undefined){ params = {}; }

	if(params.size == undefined){
		m = n = 100;
	}
	else{
		m = params.size[0];
		n = params.size[1]; // Required: m, n >= 1
	}

	var ftex = params.ftex;
	var fpos = params.fpos;

	if(ftex == undefined){ ftex = vec2; }
	if(fpos == undefined){ fpos = vec3; }

	var i,j, idx;

	var G = {
		size: [m, n],
		fpos: params.fpos,
		ftex: params.ftex,
		positions: [],
		triangles: [],
		texCoords:[]
	};

	for(i=0; i<=m; ++i){
		for(j=0; j<=n; ++j){
			let s = i/m; let t = j/n;
			G.positions.push( fpos(s, t) );
			G.texCoords.push( ftex(s, t) );
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

