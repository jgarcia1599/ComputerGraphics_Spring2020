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

    var L = [];
    for(var i = 0; i< 10; ++i) L.push(0.1);
    model = IKChain(L, vec2(0.5, 0));

    addEventHandlers();

    requestAnimationFrame(render);
};

function render(now){
  requestAnimationFrame(render);
  gl.clear(gl.COLOR_BUFFER_BIT);
  //randomMove(now);
  model.draw();
}

function randomMove(now){
  var t = now/1000;
  var a = 2*Math.random()-1;
  var b = 2*Math.random()-1;
  var v = vec2(a,b);
  model.move(vec2(0.01*a, 0.02*b*Math.sin(t)));
}


function IKChain(L, head){
  var indices = [];
  var positions = [];
  var pBuffer = gl.createBuffer();
  var iBuffer = gl.createBuffer();
  var updateReqd = true;
  var pinned = false;
  var N = L.length;

  positions.push(head);
  indices.push(0);
  var pos = head;
  for(var i = 0; i < N; ++i ){
      var pos = add(pos, vec2(-L[i],0));
      positions.push(pos);
      indices.push(i+1);
  }

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

  return { draw: draw, reach: reach, move: move, pin: pin};

  /* Function definitions below */

  function draw(t){
    if(updateReqd) {
      gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
      gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
      updateReqd = false;
    }
    gl.drawElements(gl.LINE_STRIP, indices.length, gl.UNSIGNED_BYTE, 0);
  }


  function reachFwd(v){
    positions[0] = v; 
    for(var i = 1; i <= N; ++i){
      var u = subtract(v, positions[i]);
      u = scale(L[i-1]/length(u), u);
      v = subtract(v, u);
      positions[i] = v; 
    }
    updateReqd = true;
  }

  function reachRev(v){
    positions[N] = v;
    for(var i = N-1; i >= 0; --i){
      var u = subtract(v, positions[i]);
      u = scale(L[i]/length(u), u);
      v = subtract(v, u);
      positions[i] = v; 
    }
    updateReqd = true;
  }

  function pin(b){
    pinned = b;
  }

  function reach(v){
    var tail = positions[N];
    reachFwd(v);
    if(pinned) reachRev(tail);
  }

  function move(dv){
    reach(add(positions[0], dv));
  }
}



function addEventHandlers(){

    var follow = false;
    var pinned = false;

    canvas.addEventListener("mousemove", mv);
    canvas.addEventListener("mouseup", mu);
    canvas.addEventListener("mousedown", md);
    window.addEventListener('keydown', kd);
    
    function kd(event){
      if(event.keyCode == 32){//space
        pinned = !pinned;
        model.pin(pinned);
      }
    }


    function mv(){
      if(follow) {
        model.reach(mousePos(event));
      }
    }

    function mu(){ follow = false; }

    function md(){ follow = true;  model.reach(mousePos(event)); }

    function mousePos(event){
      var x = -1+2*event.offsetX/canvas.width;
      var y = -1+2*(canvas.height- event.offsetY)/canvas.height;
      return vec2(x,y);
    }
}


