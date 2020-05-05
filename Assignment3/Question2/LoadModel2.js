"use strict";

// global variables
var gl, canvas, program;

var camera; 	// camera object
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var obj1, obj2, obj3,obj4,obj5;

var mobius;


window.onload = function init() {
	// Set up WebGL
	canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL( canvas );
	if(!gl){alert("WebGL setup failed!");}

	// set clear color 
	// gl.clearColor(0.8, 0.8, 0.8, 1.0);
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
	var eye = vec3(4,1,2);
	var at = vec3(0, 1 ,0);
	var up = vec3(0,1,0);
	camera.lookAt(eye,at,up);
	camera.setPerspective(90,1,0.1,10);
	camera.allowMovement();
	console.log("Movement has been allowed");


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









	// set up scene	
	
	// obj1 = teapot;
	// obj1.diffuseMap = "Textures/oldmetal.jpg";
	

	

	var m, s;
	// objInit(obj1);
	// s = 1.3;
	// m = mult(rotateY(40), scalem(s,s,s));
	// m = mult(translate(2.2,0.75,0.2), m);
	// obj1.setModelMatrix(m);



	obj3 = square;
	obj3.diffuseMap = "Textures/brick.gif";
	objInit(obj3);
	m = rotateX(90);
	s = 4;
	m = mult(scalem(s,s,s), m);
	obj3.setModelMatrix(m);

	var mobius_center = vec3(0,0,0);
	var radius = 5;
	mobius = makeMobius(mobius_center,radius);
	
	console.log(mobius);
	obj4 = mobius;
	objInit(obj4);




	obj5 = teapot;
	obj5.diffuseMap = "Textures/porcelain.jpg"
	objInit(obj5);
	var m_2 = resizeModel(obj5,1)
	m_2 = mult(translate(0,.5,0), m_2);
	obj5.setModelMatrix(m_2)
	obj4.setModelMatrix(m_2);
	console.log(obj5);



	

	
	requestAnimationFrame(render);

};

function render(now){
	
	requestAnimationFrame(render);
	
	var TB = trackballWorldMatrix(trackball, camera);
	gl.uniformMatrix4fv(Locations.TB, gl.FALSE, flatten(TB));

	var TBN = normalTransformationMatrix(TB); 
	gl.uniformMatrix3fv(Locations.TBN, gl.FALSE, flatten(TBN));
	
	var VP = camera.getMatrix(); 
	gl.uniformMatrix4fv(Locations.VP, gl.FALSE, flatten(VP));	

	var cameraPosition = camera.getFrame().e;
	gl.uniform3fv(Locations.cameraPosition, flatten(cameraPosition));





	// var m = mult(translate(0,0.01,0), scalem(0.02, 0.02, 0.02));
	// obj2.setModelMatrix(m);	
	// obj2.draw();
	
	// m = mult(translate(2,0.01,0), scalem(0.02,0.02,0.02));
	// obj2.setModelMatrix(m);	
	// obj2.draw();

	obj3.draw();
	obj5.draw();
	obj4.draw();
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


function makeMobius(center,radius){
	var mobius_points = []
	var mobius_triangles =[]
	var centerx = center[0]
	var centery = center[1]
	mobius_points.push(center);
	let totalPoints=10;
	for (let i = 0; i <= totalPoints; i++) {
		let angle= 2 * Math.PI * i / totalPoints;
		let x = centerx + radius * Math.cos(angle);
		let y = centery + radius * Math.sin(angle);
		let z = center[2]
		mobius_points.push([x,y,z]);
	 }

	 for (let i = 1; i <mobius_points.length-2; i++) {
		 //make traingles from center to two points in circumference of circle
		 let traingle = [i,0,i+1]
		 mobius_triangles.push(traingle)
	 }
	 console.log(mobius_points)
	 console.log(mobius_triangles)

	 var mymobius = {
		 positions:[mobius_points],
		 textCoords : [mobius_points],
		 triangles:[mobius_triangles],
	 }
	 return mymobius;

}

var square_jsjsj = {
	positions : [
		[-1, -1, 0],
		[1, -1, 0],
		[1, 1, 0],
		[-1, 1, 0],
	],
	texCoords : [
		[0, 0],
		[1, 0],
		[1, 1],
		[0, 1],
	],
	triangles : [
		[0, 1, 2],
		[0, 2, 3],
	],
}