"use strict";

// global variables
var gl; 
var time; 
var M, uM;

window.onload = function init() {
			// Set up WebGL
			var canvas = document.getElementById("gl-canvas");
			gl = WebGLUtils.setupWebGL( canvas );
			if(!gl){alert("WebGL setup failed!");}
			
			// set clear color 
			gl.clearColor(0.0, 0.0, 0.0, 1.0);
			
			//Enable depth test
			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LEQUAL); // lower depth is closer (left handed system) 
			gl.clearDepth(1.0);      // set depth value to max depth initially 
					
			
			// Load shaders and initialize attribute buffers
			var program = initShaders( gl, "vertex-shader", "fragment-shader" );
			gl.useProgram( program );
			
			// Load data into a buffer
			var s = 0.4;
			var a = vec3(-s,-s,-s);
			var b = vec3(s,-s,-s);
			var c = vec3(s,s,-s);
			var d = vec3(-s,s,-s);		
			var e = vec3(0,0,10*s);
			var vertices = [a,b,e,b,c,e,c,d,e,d,a,e,a,b,c,a,c,d];

			var R = vec3(1,0,0);
			var G = vec3(0,1,0);
			var B = vec3(0,0,1);
			var X = vec3(0.0,0.5,0.5); 
			var Y = vec3(0.5, 0, 0.5);
			var colors = [R,R,R,G,G,G,B,B,B,X,X,X,Y,Y,Y,Y,Y,Y];

			var vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

			var cBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);			
						
			// Do shader plumbing
			var vPosition = gl.getAttribLocation(program, "vPosition");
			gl.enableVertexAttribArray(vPosition);

			var vColor = gl.getAttribLocation(program,"vColor");
			gl.enableVertexAttribArray(vColor);

			gl.bindBuffer(gl.ARRAY_BUFFER,vBuffer);
			gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
			
			gl.bindBuffer(gl.ARRAY_BUFFER,cBuffer);
			gl.vertexAttribPointer(vColor, 3, gl.FLOAT, false, 0, 0);

			time = gl.getUniformLocation(program,"time");
			uM = gl.getUniformLocation(program, "M");

			var eye = vec3(0,5, 6);
			var at = vec3(0, 0 ,0);
			var up = vec3(0,1,0);
			var Mcam = cameraMatrix(eye,at,up);
			var P = perspectiveMatrix(30,1,0.1,20);
			//P = orthoProjMatrix(2,-2,2,-2,-0.1,-20);
			M = mult(P, Mcam);

			gl.uniformMatrix4fv(uM, gl.FALSE, flatten(M));

			requestAnimationFrame(render);

};


function render(now){
	requestAnimationFrame(render);
	gl.uniform1f(time,0.0007*now);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES,0,18);
}

function cameraMatrix(eye, at, up){
  var w = normalize(subtract(eye,at));
  var u = normalize(cross(up, w));
  var v = cross(w,u);
  return mat4( vec4(u, -dot(u,eye)),
  			vec4(v, -dot(v,eye)),
  			vec4(w, -dot(w,eye)),
  			vec4(0,0,0,1)
  		);
}

function orthoProjMatrix(r,l,t,b,n,f){ // n and f should be -ve

	return mat4(2/(r-l), 0, 0, -(r+l)/(r-l),
				0, 2/(t-b), 0, -(t+b)/(t-b),
				0, 0, 2/(n-f), -(n+f)/(n-f),
				0, 0, 0, 1);
	
}

function perspProjectionMatrix(r,l,t,b,n,f){ // n and f should be -ve
   
	return mat4(-2*n/(r-l), 0, (r+l)/(r-l), 0,
				0, -2*n/(t-b),(t+b)/(t-b), 0,
				0, 0, -(n+f)/(n-f), 2*f*n/(n-f),
				0, 0, -1, 0 );
}

function perspectiveMatrix(fovy, aspect, near, far ){ // near and far are +ve
	var t = near*Math.tan(radians(fovy/2));
	var r = t*aspect;
	return perspProjectionMatrix(r,-r, t,-t, -near, -far);
}



