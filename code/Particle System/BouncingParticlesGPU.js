"use strict";
var gl, program; // global variable
var ut;
var particles;
const N = 10;

window.onload = function init(){
	  //Set  up WebGL
    var canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {alert( "WebGL isn't available" );}

    // Set viewport and clear canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

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

function Particles(){
    var P=[], V=[]; // positions and velocities arrays
    var numParticles = 0; // number of particles

    // create buffers
    var posBuffer = gl.createBuffer(); // positions buffer
    var velBuffer = gl.createBuffer(); // velocities buffer

    // get locations of attributes and enable them
    var position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    var velocity = gl.getAttribLocation(program, "velocity");
    gl.enableVertexAttribArray(velocity);

    // use a flag to indicate if the buffers need to be updated
    var updateRequired = false;

    // function to add a particle
    function addParticle(position, velocity){
      P.push(position); V.push(velocity);
      numParticles++; updateRequired = true;
    }

    // function to update the buffers
    function updateBuffers(){
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(P), gl.STATIC_DRAW);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, velBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(V), gl.STATIC_DRAW);
      gl.vertexAttribPointer(velocity, 2, gl.FLOAT, false, 0, 0);

      updateRequired = false;
    }

    // function to draw the particles
    function drawParticles(){
      if(updateRequired) updateBuffers();
      gl.drawArrays(gl.POINTS,0,numParticles);
    }

    // create a particles object and return it
    particles = { add: addParticle, draw: drawParticles };

    return particles;
}

function randvec2(){
  return vec2(2*Math.random()-1, 2*Math.random()-1);
}

function render(now){
	requestAnimationFrame(render);
	//Draw
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform1f(ut,0.001*now);
  particles.draw();
}
