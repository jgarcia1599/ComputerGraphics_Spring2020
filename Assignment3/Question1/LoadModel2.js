"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj1, obj2, obj3,obj4,obj5;

var square = {
	positions : [
		[-1, -1, 0],
		[1, -1, 0],
		[1, 1, 0],
		[-1, 1, 0],
	],
	texCoords : [
// +Z face of cube.jpg
		[(1/3), (1/2)],
		[(1/3), (3/4)],
		[(2/3), (3/4)],
		[(2/3), (1/2)],
	],
	triangles : [
		[0, 1, 2],
		[0, 2, 3],
	],
}
//    +y
// -x +z +x 
//    -y
//    -z
// [0, 0, 0],
// [1, 1, 0],
// [1, 0, 0],
// [0, 1, 0],
// [0, 1, 1],
// [0, 0, 1],
// [1, 1, 1],
// [1, 0, 1], = 

var l =1;
var A,B,C,D,E,F,G,H;
var text_to_cube = {
	"a_1":[(1/4), 0],
	"b_1":[(1/2), 0],
	"c_1":[(1/2), (1/3)],
	"d_1":[(1/4), (1/3)],
	"e_1":[(1/4), (1)],
	"f_1":[(1/2), (1)],
	"g_1":[(1/2),(2/3)],
	"h_1":[(1/4),(2/3)],

	"a_2":[0, (1/3)],
	"b_2":[(3/4), (1/3)],
	"c_2":[(1/2), (1/3)],
	"d_2":[(0.25), (1/3)],
	"e_2":[0, (2/3)],
	"f_2":[(3/4), (2/3)],
	"g_2":[(1/2),(2/3)],
	"h_2":[(1/4),(2/3)],

	"a_3":[1, (1/3)],
	"b_3":[(3/4), (1/3)],
	"c_3":[(1/2), (1/3)],
	"d_3":[(1/4), (1/3)],
	"e_3":[(1), (2/3)],
	"f_3":[(3/4), (2/3)],
	"g_3":[(1/2),(2/3)],
	"h_3":[(1/4),(2/3)],


}

console.log(text_to_cube["d"])
A = [0,0,0]
B = [1,0,0]
C =[1,1,0]
D =[0,1,0]
E =[0,0,1]
F = [1,0,1]
G =[1,1,1]
H = [0,1,1]



var mycube = {
	positions : [
		A,//1
		B,//2
		C,//3
		D,//4
		E,//5
		F,//6
		G,//7
		H,//8


		A,//9
		B,//10
		C,//11
		D,//12
		E,//13
		F,//14
		G,//15
		H,//16


		A,//17
		B,//18
		C,//19
		D,//20
		E,//21
		F,//22
		G,//23
		H//24
	],
	texCoords : [ 
	text_to_cube["a_1"],	
	text_to_cube["b_1"],
	text_to_cube["c_1"],
	text_to_cube["d_1"],
	text_to_cube["e_1"],
	text_to_cube["f_1"],
	text_to_cube["g_1"],
	text_to_cube["h_1"],
	text_to_cube["a_2"],	
	text_to_cube["b_2"],
	text_to_cube["c_2"],
	text_to_cube["d_2"],
	text_to_cube["e_2"],
	text_to_cube["f_2"],
	text_to_cube["g_2"],
	text_to_cube["h_2"],
	text_to_cube["a_3"],	
	text_to_cube["b_3"],
	text_to_cube["c_3"],
	text_to_cube["d_3"],
	text_to_cube["e_3"],
	text_to_cube["f_3"],
	text_to_cube["g_3"],
	text_to_cube["h_3"],

	],

	triangles : [
//Bottom Face
		[0, 1, 2],
		[0,2,3],
	//Up Face
		[6,5,4],
		[4,7,6],
		//Left Face
		[12,8,11],
		[12,11,15],

		//Right Face
		[9,13,14],
		[9,14,10],
		//Back Face
		[11,10,14],
		[11,14,15],

		//Front Face
		[20,21,17],
		[20,17,16],

	],
}
var finalm_3

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

	// Get Locations of attributes and Locations
	var Attributes = [];
	var Uniforms = ["VP", "TB", "TBN", "cameraPosition", "Ia", "Id", "Is", "lightPosition"];

	Locations = getLocations(Attributes, Uniforms); // defined in Utils.js
 
	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	camera = Camera(canvas); // Camera(...) is defined in Camera.js
	var eye = vec3(0,0,0);
	var at = vec3(0, 1 ,-30);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10);
	camera.allowMovement();
	console.log("Movement has been allowed");
	console.log("update");


	// set light source
	var Light = {
		position: vec3(4,4,4),
		Ia: vec3(0.1, 0.1, 0.1),
		Id: vec3(1.0,1.0,1.0),
		Is: vec3(0.8,0.8,0.8)
	};

	gl.uniform3fv( Locations.lightPosition, flatten(Light.position) );
	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );
	

	

	var m, s;
	// objInit(obj1);
	// s = 1.3;
	// m = mult(rotateY(40), scalem(s,s,s));
	// m = mult(translate(2.2,0.75,0.2), m);
	// obj1.setModelMatrix(m);



	obj3 = square;
	obj3.diffuseMap = "Textures/cube.jpg";
	objInit(obj3);
	m = rotateX(90);
	s = 4;
	m = mult(scalem(s,s,s), m);
	obj3.setModelMatrix(m);

	obj4 = mycube;
	obj4.diffuseMap = "Textures/cubemap.jpg";
	obj4.material = {
		Ka: vec3(0.1, 0.1, 0.1),
		Kd: vec3(0.1, 0.1, 0.1),
		Ks: vec3(0.1, 0.1, 0.1),
	 	shininess: 10

	}
	objInit(obj4);
	var m_3 = resizeModel(obj4,20)
	finalm_3 = mult(rotateX(450),m_3);
	obj4.setModelMatrix(finalm_3);
	console.log("Okay here is the cube")
	console.log(obj4);



	obj5 = teapot;
	obj5.diffuseMap = "Textures/cube.jpg"
	objInit(obj5);
	var m_2 = resizeModel(obj5,1)
	m_2 = mult(translate(0,0,2), m_2);
	obj5.setModelMatrix(m_2)
	console.log(obj5);
	

	
	requestAnimationFrame(render);

};

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

	console.log(cameraPosition)
	gl.depthMask(false);
	obj4.setModelMatrix(mult(translate(cameraPosition),finalm_3));
	gl.uniform1f(Locations.cube, 1.0);
	obj4.draw();
	gl.depthMask(true);
	// var m = mult(translate(0,0.01,0), scalem(0.02, 0.02, 0.02));
	// obj2.setModelMatrix(m);	
	// obj2.draw();
	
	// m = mult(translate(2,0.01,0), scalem(0.02,0.02,0.02));
	// obj2.setModelMatrix(m);	
	// obj2.draw();

	obj3.draw();
	// obj4.draw();
	obj5.draw();


}

function computeCentroid(obj){
	var vertices = new Array(0,0,0);
	var centroid = new Array(3);

	for (var i = 0; i < obj.positions.length; i++){
		vertices[0] += obj.positions[i][0];
		vertices[1] += obj.positions[i][1];
		vertices[2] += obj.positions[i][2];
	}
	for (var i = 0; i < centroid.length; i++){
		centroid[i] = vertices[i]/obj.positions.length;
	}
	return centroid;
}

function computeAlpha(obj, centroid, s){
	var vertices = new Array(Math.abs(obj.positions[0][0] - centroid[0]), 
							 Math.abs(obj.positions[0][1] - centroid[1]), 
							 Math.abs(obj.positions[0][2] - centroid[2]));
	for (var i = 0; i < obj.positions.length; i++){
		vertices[0] = Math.max(Math.abs(obj.positions[i][0] - centroid[0]), vertices[0]);
		vertices[1] = Math.max(Math.abs(obj.positions[i][1] - centroid[1]), vertices[1]);
		vertices[2] = Math.max(Math.abs(obj.positions[i][2] - centroid[2]), vertices[2]);
	}
	var alpha = Math.min(s/vertices[0], Math.min(s/vertices[1], s/vertices[2]));
	return alpha;
}

function resizeModel(obj, s) {
	var centroid = computeCentroid(obj);
	var alpha = computeAlpha(obj, centroid, s);
	var m = mult(scalem(alpha, alpha, alpha), translate(centroid[0]*(-1.0), centroid[1]*(-1.0), centroid[2]*(-1.0)));
	return m;
}