// "use strict";

// import { equal } from "assert";

// global variables
var gl, canvas, program;
var vBuffer, cBuffer;


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

			// Load data into a buffer
			var s = 0.3;
			var a = vec3(-s,-s,-s);
			var b = vec3(s,-s,-s);
			var c = vec3(s,s,-s);
			var d = vec3(-s,s,-s);		
			var e = vec3(0,0,2*s);
			var vertices = [a,b,e,b,c,e,c,d,e,d,a,e,a,b,c,a,c,d];

			var R = vec3(1,0,0);
			var G = vec3(0,1,0);
			var B = vec3(0,0,1);
			var X = vec3(0.0,0.5,0.5); 
			var Y = vec3(0.5, 0, 0.5);
			var colors = [R,R,R,G,G,G,B,B,B,X,X,X,Y,Y,Y,Y,Y,Y];

			vBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);		

			cBuffer = gl.createBuffer();
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

			setupVirtualTrackball(); // set up virtual trackball

			requestAnimationFrame(render);

};

function render(now){
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	//draw pyramid
	gl.drawArrays(gl.TRIANGLES,0,18);
}

function setupVirtualTrackball(){

	var lastVector, tracking = false;

	var u_vtM = gl.getUniformLocation(program,"vtM");
	var vtM = mat4(); // initialize 
	gl.uniformMatrix4fv(u_vtM, gl.FALSE, flatten(vtM)); 

	var u_vtScale = gl.getUniformLocation(program,"vtScale");
	var vtScale = 1; //initialize scale
	gl.uniform1f(u_vtScale, vtScale);

	function getMouseDirectionVector(event){
	  var r = 1.5;
	  var x = -1+2*event.offsetX/canvas.width;
	  var y = -1+2*(canvas.height- event.offsetY)/canvas.height;
	  var z = Math.sqrt(r*r-x*x-y*y);
	  return normalize(vec3(x,y,z));
	}

	//set event handlers
	
	canvas.onmousedown = function mousedown(event){
	  lastVector = getMouseDirectionVector(event);
	  tracking = true;
	}

	canvas.onmouseup = function mouseup(){
		tracking = false;
	}

	canvas.onmousemove = function mousemove(event){ 
		if(tracking && event.buttons===1){
			// console.log(event);
			// console.log(event.screenX);
			// console.log(event.screenY);
			var p1 = lastVector;
			var p2 = getMouseDirectionVector(event);
			
			if(equal(p1,p2)==false){
				//Compute axis of rotation
				var v = normalize(cross(p1,p2),false);
				var theta = Math.asin(length(cross(p1,p2)));
				var M = rot(v,theta);
				vtM = mult(M, vtM);
				gl.uniformMatrix4fv(u_vtM, gl.FALSE, flatten(vtM));

				//Update p1
				for (var i=0;i<p1.length;i++){
					p1[i] = p2[i];
				}

			}
			//calculate angle between p1 and p2

			

			
			
			console.log(vtM);



			// rot_matrix = Rx



			// console.log("P2: ",p2[0]);
			// console.log("P1: ",p1[0]);
			// write your code here
		}
	}

	canvas.onwheel = function wheel(event){
		vtScale*=(1 - event.deltaY/500);
		gl.uniform1f(u_vtScale, vtScale);
		if(vtSscale > 5) vtScale = 5; 	 // max scale
		if(vtScale < 0.2) vtScale = 0.2; // min scale
	}

}

// The rotation functions below are corrected versions of
// rotateX, rotateY and rotateZ in MV.js in which some
// terms in rotateX and rotateY have incorrect signs.
// Also, we use radians instead of degrees.

function Rx(theta) {
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var rx = mat4( 1.0,  0.0,  0.0, 0.0,
		0.0,  c,  -s, 0.0,
		0.0, s,  c, 0.0,
		0.0,  0.0,  0.0, 1.0 );
	return rx;
  }
  function Ry(theta) {
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var ry = mat4( c, 0.0, s, 0.0,
		0.0, 1.0,  0.0, 0.0,
		-s, 0.0,  c, 0.0,
		0.0, 0.0,  0.0, 1.0 );
	return ry;
  }
  function Rz(theta) {
	var c = Math.cos(theta);
	var s = Math.sin(theta);
	var rz = mat4( c, -s, 0.0, 0.0,
		s,  c, 0.0, 0.0,
		0.0,  0.0, 1.0, 0.0,
		0.0,  0.0, 0.0, 1.0 );
	return rz;
  }
  
  function rot(v, psi) { 
	  // psi is in radians
	  var a = v[0], b = v[1], c = v[2];
	  
	  // compute theta and phi components 
	  // of the spherical coordinate of v
	  var s = Math.sqrt(a * a + b * b);
	  var theta = Math.atan2(s, c);
	  var phi = Math.atan2(b, a);
	  
	  return matProd(Rz(phi),Ry(theta),Rz(psi),Ry(-theta),Rz(-phi));
  }
  
  function matProd(){
	  var M = arguments[0];
	  for(var i=1; i<arguments.length; ++i){
		  M = mult(M,arguments[i]);
	  }
	  return M;
  }
  
  function degrees(x){
	  return 180*x/Math.PI;
  }

