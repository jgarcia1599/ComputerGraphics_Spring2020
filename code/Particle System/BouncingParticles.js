"use strict";
var gl, program; // global variable

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
	
    var P = [];
    for(var i = 0; i<10; ++i){
      P.push({position: randvec2(), velocity: randvec2(), color: randcolor()});
    }

    var ps = particleSystem(P);
    ps.animate();
};

function randvec2(){
  return vec2(2*Math.random()-1, 2*Math.random()-1);
}

function randcolor(){
  return vec3(Math.random(), Math.random(), Math.random());
}



function particleSystem(particles){
    var prevTime = 0; // previous time

    // create buffers
    var posBuffer = gl.createBuffer(); // positions buffer

    // get locations of attributes and enable them
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);

    // create an object and return it
    return { particles: particles, animate: animate };

	/* Function definitions */

	function animate(){
    	requestAnimationFrame(draw);
    }

    function draw(currTime){
      if(prevTime!= 0){
      	var dt = 0.001*(currTime - prevTime); // seconds
      	updatePositions(dt);
   	  }

	  prevTime = currTime; 
   	  updateBuffers();

   	  gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS,0,particles.length);
      requestAnimationFrame(draw);
    }


    // function to update the buffers
    function updateBuffers(){
      var  pos = [];
      for(var i = 0; i<particles.length; ++i){
      	pos.push(particles[i].position);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(pos), gl.STATIC_DRAW);
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    }

    function updatePositions(dt){
    	for(var i=0; i<particles.length; ++i){
    		var p = particles[i];
    		p.position = add(p.position, scale(dt, p.velocity));
    		for (var j = 0 ; j < 2; ++j){
    			if(p.position[j] > 1){
    				p.position[j] = 2- p.position[j];
    				p.velocity[j] *= -1;
    			}
    			else if(p.position[j] < -1){
    				p.position[j] = -2 - p.position[j];
    				p.velocity[j] *=-1;
    			}
    		}
    	}
    }

}



