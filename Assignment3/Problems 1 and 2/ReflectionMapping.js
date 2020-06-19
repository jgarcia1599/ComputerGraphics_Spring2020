"use strict";

// global variables
var gl, canvas, program;

var camera, cam1, cam2; // cameras
var trackball; 	// virtual trackball 

var Locations;  // object containing location ids of shader variables 

var car, pot, mob, sky;

var flag = 1;

var last_t=0;
var last_time=0;
var R = 6.0;

var Light;

var cubemap = "Textures/cubemap.jpg";

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
	var Uniforms = ["reflectivity", "flag","id", "TB", "TBN", "VP", "cameraPosition",  
			          "Ia", "Id", "Is", "lightPosition"];

	Locations = getLocations(Attributes, Uniforms); // defined in Utils.js


	// set up virtual trackball
	trackball = Trackball(canvas);

	// set up Camera
	cam1 = Camera(); // outside camera 
	var eye = vec3(0, 0, 8);
	var at = vec3(0, 0 ,0);
	var up = vec3(0,1,0);
	cam1.lookAt(eye,at,up);
	cam1.setPerspective(90,1,0.1,30);
	cam1.allowMovement();

    cam2 = Camera(); // driver seat camera
	cam2.setPerspective(120,1,0.1,30);

	pot = tpot();
	sky = skybox();
	mob = mobius(R, 1);
	car = f1();


	// set light source
    Light = {
		Ia: vec3(0.2, 0.2, 0.2),
		Id: vec3(0.8,0.8,0.8),
		Is: vec3(0.4,0.4,0.4)
	};

	gl.uniform3fv( Locations.Ia, flatten(Light.Ia) );
	gl.uniform3fv( Locations.Id, flatten(Light.Id) );
	gl.uniform3fv( Locations.Is, flatten(Light.Is) );

	var btn = document.getElementById("btn");
	btn.onclick = function(){flag *= -1;};

	requestAnimationFrame(render);
};



function render(now){
	
	requestAnimationFrame(render);

    gl.uniform1f(Locations.reflectivity,document.getElementById("reflectivity").value);
	var speed = 0.0003*document.getElementById("speed").value;
    var t = last_t + (now - last_time)*speed;
    t -= Math.floor(t);
    last_time = now; 
    last_t = t;

    var phi = 2*Math.PI*t;
    var theta = 2*phi;
	var cp = Math.cos(phi);
	var sp = Math.sin(phi);
	var ct = Math.cos(theta);
	var st = Math.sin(theta);
	var u = vec3(ct, st, 0);
	var v = vec3(-st, ct, 0);
	var w = vec3(0, 0, 1);
	var up = add(scale(-sp,u), scale(cp,w));

    var m = rotateY(degrees(phi));
	m = mult(translate(R,0,0), m);
	m = mult(rotateZ(degrees(theta)), m);
	m = mult(translate(scale(0.04,up)), m);

	car.setModelMatrix(m);

	if(flag == 1){ // outside camera 
		camera = cam1;
		Light.position = vec3(0, 2, 7);
	}
	else{ // driver seat camera 
		var eye = add(scale(R, u), scale(0.4,up));
		eye = add(eye, scale(0.15,v));
        var at = add(eye, v);
	    cam2.lookAt(eye, at, up);
	    camera = cam2;
	    Light.position = add(add(eye, scale(0.5,up)), scale(-0.5,v));
	}

	gl.uniform3fv(Locations.lightPosition, flatten(Light.position) );

	
	var TB = trackballWorldMatrix(trackball,camera);
	gl.uniformMatrix4fv(Locations.TB, gl.FALSE, flatten(TB));

	var TBN = normalTransformationMatrix(TB);
	gl.uniformMatrix3fv(Locations.TBN, gl.FALSE, flatten(TBN));

	var VP = camera.getMatrix(); 
	gl.uniformMatrix4fv(Locations.VP, gl.FALSE, flatten(VP));	

	var cameraPosition = camera.getFrame().e;
	gl.uniform3fv(Locations.cameraPosition, flatten(cameraPosition));	

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.uniform1i(Locations.id, 1);
	sky.draw(cameraPosition);

	gl.uniform1i(Locations.id, 2);
	pot.draw();

	gl.uniform1i(Locations.id, 3);
	mob.draw();

    gl.uniform1i(Locations.id, 4);
    car.draw();	
}


function parametricSurface(params){ 
	var m, n;
	
	if(params == undefined){ params = {}; }

	if(params.size == undefined){
		m = n = 100;
	}
	else{
		m = params.size[0];
		n = params.size[1]; // Required: m, n >= 1
	}

	var ftex = params.ftex;
	var fpos = params.fpos;

	if(ftex == undefined){ ftex = vec2; }
	if(fpos == undefined){ fpos = vec3; }

	var i,j, idx;

	var G = {
		size: [m, n],
		fpos: params.fpos,
		ftex: params.ftex,
		positions: [],
		triangles: [],
		texCoords:[]
	};

	for(i=0; i<=m; ++i){
		for(j=0; j<=n; ++j){
			let s = i/m; let t = j/n;
			G.positions.push( fpos(s, t) );
			G.texCoords.push( ftex(s, t) );
		}
	}

	for(i=0; i<m; ++i){
		for(j=0; j<n; ++j){
			idx = (n+1)*i + j;
			G.triangles.push([idx, idx+n+1, idx+n+2], [idx, idx+n+2, idx+1]);
		}
	}

	return G;
}

function mobius(R, d){
	var s ={}, s1, s2;
	
	var h = 0.01;
	s1 = parametricSurface({fpos:f, ftex: g, size:[100, 100]});
	h *= -1;
	s2 = parametricSurface({fpos:f, ftex: g, size:[100, 100]});

	s1.diffuseMap = "Textures/road_texture.jpg";
	s2.diffuseMap = s1.diffuseMap;
	s1.normalMap = "Textures/wood-normal.jpg";
    s2.normalMap = s1.normalMap;
    
    objInit(s1);
	objInit(s2);

	s1.material.shininess = 50;
	s2.material = s1.material;

    s.draw = function(){ 
        s1.draw(); 
        s2.draw();
    };

    s.setModelMatrix = function(m){
    	s1.setModelMatrix(m);
    	s2.setModelMatrix(m);
    };

    s.getModelMatrix = s1.getModelMatrix();

    return s;

   /* --- Helper functions below ---*/

	function f(s,t){
		var phi = Math.PI*s;
		var theta = 2*phi;
		var u = vec3(Math.cos(theta), Math.sin(theta), 0);
		var v = vec3(0, 0, 1);
		var cp = Math.cos(phi); 
		var sp = Math.sin(phi);
		var w = add(scale(cp,u), scale(sp, v));
		var x = add(scale(-sp,u), scale(cp, v));
		var r  = d*Math.sign(h)*(1-2*t);
		return add(add(scale(R,u), scale(r,w)), scale(h,x));
	}

	function g(s,t){
		let s1 = 2*Math.PI*(R/d)*s;
		return vec2(s1 - Math.floor(s1), t);
	}
}


function tpot(){
	var obj = teapot;
	obj.diffuseMap = cubemap;
	obj.normalMap = "Textures/gold-diffuse.jpg"; // we don't use this as normalMap
	objInit(obj);
	var s = 0.06;
	obj.setModelMatrix(scalem(s,s,s));
	return obj;
}

function skybox(){
	var obj = skyboxcube;
	obj.diffuseMap = cubemap;
	obj.normalMap = ""; // dummy

    /* Move texture coordinates inwards to avoid edges */
    var eps = 0.002;
    var vals = [0, 1/4, 1/3, 1/2, 2/3, 1];
    for(let i in obj.texCoords){
      for(let j = 0; j<2; ++j){
      	 for(let k in vals){
      	 	let v = vals[k]; 
        	if( Math.abs(obj.texCoords[i][j] - v)<eps){
        		if(v<0.4) obj.texCoords[i][j] = v + eps;
        		else obj.texCoords[i][j] = v - eps;
        	}
         }
      }
    }


	objInit(obj);
	
	var old_draw = obj.draw;

	obj.draw = function(cameraPosition){
		var s = 10;
		var m = scalem(s,s,s);
		m = mult(translate(cameraPosition), m);
		obj.setModelMatrix(m);
		gl.depthMask(false); // disable writing to depth buffer
		old_draw();
		gl.depthMask(true);  // enable writing to depth buffer
	}

	return obj;
}


function f1(){
	var obj = formula1;
	var mm;

    obj.diffuseMap = "Textures/car_diffuse.png";
    obj.normalMap = "Textures/car_normal.png";
	objInit(obj);
	var s = 0.004;
	var M = scalem(s,s,s);
	M = mult(rotateX(-90), M);
	M = mult(rotateZ(-90), M);
		
	var set_mm = obj.setModelMatrix;
	obj.setModelMatrix = function(m){
		mm = m;
        set_mm(mult(m,M));
	};

	obj.getModelMatrix = function(){
		return mm;
	};

	return obj;
}
