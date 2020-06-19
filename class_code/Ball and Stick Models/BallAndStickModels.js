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


    //model = makeBSModel(pendulum(), 2);
    model = makeBSModel(gridModel(30,30), 3);
    model.init();

    requestAnimationFrame(render);
};


function render(now){
  requestAnimationFrame(render);
  gl.clear(gl.COLOR_BUFFER_BIT);
  model.draw(now);
}


function makeBSModel(model, d = 3){ // d: dimension

  var vec = (d==2)? vec2: vec3; 

  var C = { // constants 
    restitution: 0.99,
    gravity: vec(0.0, -0.001),
    drag: 0.999
  };

  var pointsToDraw = []; // ids of points to draw
  var linksToDraw = [];  // indices of links to draw

  var pBuffer = gl.createBuffer(); // positions buffer
  var lBuffer = gl.createBuffer(); // links buffer 

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);

  if(model == undefined) { 
    model = {points: {}, links: [] } 
  };
  var points = model.points;
  var links = model.links;
  
  for(var id in points) prepPoint(points[id]);
  for(var i=0; i<links.length; ++i) prepLink(links[i]);
  
  model.addPoint = addPoint;
  model.getPoint = getPoint;
  model.addLink = addLink;
  model.setConstant = setConstant;
  model.draw = draw;

  return model;


  /* Function definitions */

  function prepPoint(p){
      p.position = vec(p.position);
      p.oldPosition = (p.oldPosition==undefined)? p.position: vec(p.oldPosition);
      if(!p.invisible) pointsToDraw.push(p);
  }

  function prepLink(l){
      l.length = distance(points[l.start].position, points[l.end].position);
      if(!l.invisible) linksToDraw.push(l); 
  }

  function addPoint(id, p){ prepPoint(p); points[id] = p; } 

  function getPoint(id){ return points[id]; }

  function addLink(l){ prepLink(l); links.push(l);}

  function setConstant(name, value){ C[name] = value; }

  function distance(p,q){ return length(subtract(p,q)); }


  function draw(now){

    update(now);

    // draw points 
    var pointsdata = [];
    for(var i = 0; i < pointsToDraw.length; ++i){
      pointsdata.push(pointsToDraw[i].position);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsdata), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, d, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, pointsdata.length);

    // draw links 
    var linksdata = [];
    for(var i = 0; i < linksToDraw.length; ++i){
      var l = linksToDraw[i];
      linksdata.push(points[l.start].position, points[l.end].position);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, lBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(linksdata), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, d, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, linksdata.length);
  }


  function update(now){
    var lastTime, leftOverTime, steps;
    var timePerFrame = 16; // milliseconds

    if(lastTime == undefined){
      steps = 1;
      leftOverTime = 0;
    }
    else{
      var dt = (now - lastTime);
      steps = Math.floor((dt + leftOverTime)/timePerFrame); 
      leftOverTime = dt - steps*timePerFrame;
    }

    lastTime = now;

    for(var i = 0; i < steps; ++i){
      updatePositions();
       /* We loop through the constrains multiple times since we process one constraint at a time 
          and applying one constaint messes up the others. Looping multiple times reduces the error.*/
      for(var j = 0; j < 10; ++j){
        applyLinkConstraints();
        applyBoxContraints();   // it is important to do this after applying link constraints
      }
    }
  }

  function updatePositions(){
    for(var id in points){
      var p = points[id];
      if(!p.pinned){
        var v = subtract(p.position, p.oldPosition);
        v = scale(C.drag, add(v, C.gravity)); // velocity
        p.oldPosition = p.position; // current position becomes old position
        p.position = add(p.position, v); // update position
      }
    }
  }


  function applyBoxContraints(){
    var margin = vec3(0.005,0.005, 0.005);
    var box = {L: vec3(0,0,0), U: vec3(1,1,1)};     // defined by lower and upper corners
    box.L = add(box.L, margin); box.U = subtract(box.U, margin);   // use margins
    
    for(var id in points){
      var p = points[id];
      var v = scale(C.drag, subtract(p.position, p.oldPosition));  // velocity 

      // Constrain positions to be in the box
      var r = [], s = [], pos = p.position, oldPos = p.oldPosition;
      for(var j=0; j<d; ++j){
        r[j] = Math.min(Math.max(pos[j], box.L[j]), box.U[j]);
        s[j] = (r[j] == pos[j])? 0: 1; // indicates where r and pos differ
        pos[j] = r[j];
        oldPos[j] += s[j]*(pos[j]-oldPos[j] + C.restitution*v[j]);
      }
    }
  }


  function applyLinkConstraints(){
    for(var i=0; i< links.length; ++i){
      var l = links[i];
      var start = points[l.start], end = points[l.end];

      var t = (1 - l.length/distance(start.position,end.position));
      var v = scale(t, subtract(end.position, start.position));

      if(!start.pinned && !end.pinned){
        var u = scale(0.5, v);
        end.position = subtract(end.position, u);
        start.position = add(start.position, u);
      } 
      else if(start.pinned && !end.pinned){
            end.position = subtract(end.position, v);
      } 
      else if(!start.pinned && end.pinned){
            start.position = add(start.position, v);
      }
    }
  }
 
}
