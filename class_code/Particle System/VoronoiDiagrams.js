"use strict";
var gl, program; // global variable
var ut;
var particles;
const N = 20;

window.onload = function init(){
	  //Set  up WebGL
    var canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {alert( "WebGL isn't available" );}

    // Set viewport and clear canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
	
	//Enable depth test
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL); // lower depth is closer (left handed system) 
	gl.clearDepth(1.0);  	// set depth value to max depth initially 

    // Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

	  ut = gl.getUniformLocation(program, "t");

    particles = Particles();
    for(var i = 0; i<N; ++i){
      particles.add(randvec2(), randvec2());
    } 

	  requestAnimationFrame(render);
};

function render(now){
	requestAnimationFrame(render);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform1f(ut,0.001*now);
	particles.draw();
}

function Particles(){
    var P=[], V=[]; // positions and velocities arrays
    var numParticles = 0; // number of particles

    // function to add a particle
    function addParticle(position, velocity){
      P.push(position); V.push(velocity);
      numParticles++; 
    }

	var cone = Cone();
	
	var pos = gl.getUniformLocation(program, "pos");
	var vel = gl.getUniformLocation(program, "vel");
	
	// function to draw the particles
    function drawParticles(){
	  for(var i = 0; i<P.length; ++i){
		  gl.uniform2fv(pos, flatten(P[i]));
		  gl.uniform2fv(vel, flatten(V[i]));
		  cone.draw();
	  }
    }

    // create a particles object and return it
    particles = { add: addParticle,
				  draw: drawParticles };

    return particles;
}

function randvec2(){
  return vec2(2*Math.random()-1, 2*Math.random()-1);
}

function Cone(){
	var i;
	var n = 100;
	var vertices = [vec3(0,0,-1)];
	var r = Math.sqrt(8);
	for(i = 0; i < n; ++i){
		var theta = 2*Math.PI*i/n;
		vertices.push(vec3(r*Math.cos(theta), r*Math.sin(theta), 1.0));
	}
	var indices = [0, 1, n];
	for(i=1; i<n; ++i){
		indices.push(0, i+1, i);
	}
	
	var vbuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);
	
	var ibuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
	
	function drawCone(){
		gl.drawElements(gl.TRIANGLES, 3*n, gl.UNSIGNED_BYTE, 0);
	}
	
	return { draw: drawCone };
}

