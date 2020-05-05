"use strict";

// global variables
var gl, program, canvas;
var camera, trackball;
var Locations;
var scene;

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

			
			// lighting details are hard-coded in the shaders

			// set up trackball
			trackball = Trackball(canvas);
							
			// set up Camera 
			camera = Camera();
			var eye = vec3(0,0.4, 0.2);
			var at = vec3(0, 0 ,0);
			var up = vec3(0,1,0);
			camera.lookAt(eye, at, up);
			camera.setPerspective(90,1,0.1,10);

			//set up scene
			scene = Scene();

			requestAnimationFrame(render);
};


function Scene(){


			// Get Locations of attributes and Locations
			var Attributes = ["vPosition", "vNormal", "vColor"];
			var Uniforms = ["M", "VP", "N", "TB", "TBN", "cameraPosition"];
			Locations = getLocations(Attributes, Uniforms); // defined in Utils.js	
			Locations.enableAttributes();

			var scene = {}; // Object to be returned

			var cubeModelMatrix

			var vertices = [];
			var colors = [];
			var normals = [];

			var R = vec3(1,0,0);
			var G = vec3(0,1,0);
			var B = vec3(0,0,1);
			var X = vec3(1,0.1,0);


			var dv = []; // stores all distinct vertices
			// Put cube vertices in dv
			var i,j;
			for(i=0; i< 8; ++i){
				var v = vec3();
				for(j = 0; j <3; ++j){
					v[j] = (i>>j) & 1;
				}
				dv.push(v);
			}
			dv.push( vec3(-1,0,-1), vec3(1,0,-1), vec3(-1,0,1),  vec3(1,0,1) );
             
			var quad = function (a,b,c,d, col){
				vertices.push(dv[a],dv[b],dv[c],dv[a],dv[c],dv[d]);
				colors.push(col,col,col,col,col,col);

				var u = subtract(dv[b], dv[a]);
				var v = subtract(dv[d], dv[a]);
				var n = normalize(cross(u,v));
				normals.push(n,n,n,n,n,n);

			}
			// quads for the cube
			quad(1,0,2,3,B);  quad(4,5,7,6,B); 
			quad(5,1,3,7,R); quad(0,4,6,2,R);
			quad(6,7,3,2,G); quad(0,1,5,4,G);

			var s = 0.2;
			cubeModelMatrix = mult(scalem(s,s,s), translate(-0.5,0,-0.5));
			//cubeModelMatrix = mult(translate(0,-0.3,0), cubeModelMatrix);


			
			// set up buffers
			var vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
			

			var cBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);


			var nBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

						
			// Do shader plumbing
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.vertexAttribPointer(Locations.vPosition, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			gl.vertexAttribPointer(Locations.vColor, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
			gl.vertexAttribPointer(Locations.vNormal, 3, gl.FLOAT, false, 0, 0);


			scene.draw = function(now){

				var M, N;
				M = cubeModelMatrix;
				N = normalTransformationMatrix(M);

				gl.uniformMatrix4fv(Locations.M, gl.FALSE, flatten(M));
				gl.uniformMatrix3fv(Locations.N, gl.FALSE, flatten(N));
				gl.drawArrays(gl.TRIANGLES, 0, 36);

			};

			return scene;

}

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

	scene.draw(now);
}



