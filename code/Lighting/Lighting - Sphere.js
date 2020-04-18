"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object

var sphere; 

window.onload = function init() {
	// Set up WebGL
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL( canvas );
	if(!gl){alert("WebGL setup failed!");}

	// Set clear color 
	gl.clearColor(0.0, 0.0, 0.0, 1.0);

	//Enable depth test
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);
	gl.clearDepth(1.0);

	// Load shaders and initialize attribute buffers
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	var Attributes = ["vPosition", "vNormal"];
	var Uniforms = ["VP", "M", "N", "cameraPosition",  "lightPosition",
					"Ia", "Id", "Is", "Ka", "Kd", "Ks", "shininess"];

	// getLocations(...) is defined in Common/Utils/Utils.js
	var Loc = getLocations(Attributes, Uniforms); 

	// Set up camera
	camera = Camera(); 	// defined in Camera.js
	var eye = vec3(0,0, 3);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10); 
	gl.uniformMatrix4fv(Loc.VP, gl.FALSE, flatten(camera.getMatrix()));
	gl.uniform3fv(Loc.cameraPosition, flatten(camera.getFrame().e));

	// Set light source
	var light = {
		position: vec3(-5,10,20),
		Ia: vec3(0.2, 0.2, 0.2),
		Id: vec3(1,1,1),
		Is: vec3(0.8,0.8,0.8)
	};

	gl.uniform3fv( Loc.lightPosition, flatten(light.position) );
	gl.uniform3fv( Loc.Ia, flatten(light.Ia) );
	gl.uniform3fv( Loc.Id, flatten(light.Id) );
	gl.uniform3fv( Loc.Is, flatten(light.Is) );

	// set up model
	sphere = Sphere(6);

	Loc.enableAttributes();

	var vBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere.positions), gl.STATIC_DRAW);
	gl.vertexAttribPointer(Loc.vPosition, 3, gl.FLOAT, false, 0, 0);

	var nBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(sphere.normals), gl.STATIC_DRAW);
	gl.vertexAttribPointer(Loc.vNormal, 3, gl.FLOAT, false, 0, 0)

	var material = {	
			Ka: vec3(1.0, 1.0, 1.0),
			Kd: vec3(Math.random(), Math.random(), Math.random()),
			Ks: vec3(0.4, 0.4, 0.4),
			shininess: 500*Math.random() 
	};

	gl.uniform3fv(Loc.Ka, flatten(material.Ka));
	gl.uniform3fv(Loc.Kd, flatten(material.Kd));
	gl.uniform3fv(Loc.Ks, flatten(material.Ks));
	gl.uniform1f(Loc.shininess, material.shininess); 

	// scalem(...) and normalMatrix(...) are defined in MV.js
	var M = scalem(2,1,2); 			// modeling matrix
	var N = normalMatrix(M, true);	// normal transormation matrix
	
	// Note: M is a 4x4 matrix and N is 3x3
	gl.uniformMatrix4fv(Loc.M, gl.FALSE, flatten(M)); 
	gl.uniformMatrix3fv(Loc.N, gl.FALSE, flatten(N));

	var shading = 3.0; // flat: 1.0, Gouraud: 2.0, Phong: 3.0
	gl.uniform1f(gl.getUniformLocation(program, "shading"), shading);

	requestAnimationFrame(render);
};

function render(now){
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, sphere.positions.length);
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

