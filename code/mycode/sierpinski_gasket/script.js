// var p= new Float32Array([x,y]);
// p[0]=x;
// p[1]=y;

// //using mv.js
// var a =vec2(1.0,2.0);
// var b = vec2(3.0,4.0);
// var c = add(a,b);

// The following code generates 5000 points starting with the vertices of a triangle that lies in the plane z = 0:
var gl;
var points;

var numPoints = 5000;

window.onload = function myFunction(){
  var canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // First, initialize the corners of our gasket with three points.

  var vertices = [
    vec2( -1, -1 ),
    vec2(  0,  1 ),
    vec2(  1, -1 )
  ];

  // Specify a starting point p for our iterations
  // p must lie inside any set of three vertices
  var u = scale(0.5, add(vertices[0], vertices[1]));
  var v = scale(0.5, add(vertices[0], vertices[2]));
  var p = scale(0.5, add(u, v));

  // And, add our initial point into our array of points
  points = [ p ];

  // Compute new points
  // Each new point is located midway between
  // last point and a randomly chosen vertex
  for ( var i = 0; points.length < numPoints; ++i ) {
    var j = Math.floor(Math.random() * 3);
    p = add( points[i], vertices[j] );
    p = scale( 0.5, p );
    points.push( p );
  }

  //
  //  Configure WebGL
  //
  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

  //  Load shaders and initialize attribute buffers
  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  //Create buffer object to send data with
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // gl.ARRAY_BUFFER indicates that the data in the buffer is vertex attribute data
  gl.bufferData(gl.ARRAY_BUFFER,flatten(points),gl.STATIC_DRAW);
  // gl.STATICDRAW means that we are displaying the data once

  // Associate out shader variables with our data buffer

  var vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  render();

}

// For a typical application, we can think of the code as consisting of three principal actions: 
// initialization, generation of the geometry, and rendering of the geometry.


function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
    // To displayb the points
    gl.drawArrays(gl.POINTS, 0, numPoints);
}

//GLSL ES code for the vertex shader
// attribute vec4 vPosition;
// void main() {
//   gl_Position = vPosition;
// }

//GLSL ES  code for the fragment shader, the one responsible for colors
// precision mediump float;
// void main() {
//   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
// }

