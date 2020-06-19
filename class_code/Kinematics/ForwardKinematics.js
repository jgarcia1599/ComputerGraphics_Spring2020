"use strict";
var gl, program, canvas; // global variables
var model;


window.onload = function init(){
	//Set  up WebGL
    canvas = document.getElementById( "gl-canvas" );
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) {alert( "WebGL isn't available" );}

    // Set viewport and clear canvas
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    function a(t){
      return 40*Math.sin(t)-90;
    }

    function b(t){
      return  -120 + 70*Math.sin(t);
    }
    
    function c(t){
      return 40*Math.sin(t+3.5)-90;
    }

    function d(t){
      return  -120 + 70*Math.sin(t+3.5);
    }

    model = makeFKModel(vec2(0,0));
    model.add("a", null, 0.35, a );
    model.add("b", "a", 0.35, b );
    model.add("c", null, 0.35, c );
    model.add("d", "c", 0.35, d );

    requestAnimationFrame(render);
};

function makeFKModel(rootPosition){

  var d = 2;
  var vec = d==2? vec2 : vec3;
  var idx = 0;

  var flag = false;

  var indices = [];
  var pBuffer = gl.createBuffer();
  var iBuffer = gl.createBuffer();

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);

  var P = {}; // points

  var root = {
      position: rootPosition,
      index: 0
  };

  return {
      root: root,
      add: addPoint,
      draw: draw
  };

  /* Function definitions below */
  
  function addPoint(id, parent, distance, angle){
     var p = {
        parent: (parent? P[parent]: root),
        distance: distance,
        angle: angle, 
        index : ++idx
      };

      P[id] = p;
      indices.push(p.index, p.parent.index);
      flag = true; // need to updated iBuffer
  }


  function update(t){
    // Update positions and if required indices.
    var positions = [root.position];

    for(var k in P){
        var p = P[k];
        var q = p.parent;
        var theta = p.angle(t)*Math.PI/180;
        var dv = vec( p.distance*Math.cos(theta), 
                      p.distance*Math.sin(theta) );
        p.position = add(q.position, dv);
        positions.push(p.position);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, d, gl.FLOAT, false, 0, 0);

    if(flag){
      	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);
		flag = false; // iBuffer is updated
    }
  }

  function draw(t){
    update(t);
    gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_BYTE, 0);
  }

}

function render(now){
  requestAnimationFrame(render);
  gl.clear(gl.COLOR_BUFFER_BIT);
  model.draw(now/1000);
}


