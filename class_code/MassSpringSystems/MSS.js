"use strict";
var gl, program; // global variable
var vec = vec3;

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
	
	var m = 20, n = 20;
    var mss =  gridModel(m,n); //massSpringSystem();
    mss.getPoint([m-1,n-1]).vel = vec3(2, -1, 2);

    mss.animate();
   
};


function massSpringSystem(){
	var points = {}; 
	var springs = {};
	var P = []; // points
	var S = []; // springs
	var segments = []; // segments to draw
    var prevTime; // previous time
    var leftOverTime = 0; // unsimulated time from previous iteration
    var dt = 1/60; // time per frame (seconds)

    // create buffers
    var posBuffer = gl.createBuffer(); // positions buffer
    var ibuffer = gl.createBuffer();

    // get locations of attributes and enable them
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);

    // create an object and return it
    var mss = {  gravity: vec(0, -1, 0),
				 drag: 0.005,
				 addPoint: addPoint, 
				 getPoint: getPoint,             
				 addSpring: addSpring,
				 getSpring: getSpring,
				 animate: animate  };
             
    return mss;

	/* Function definitions */
	function addPoint(id, p){ points[String(id)] = p; }

    function getPoint(id){ return points[String(id)]; }

	function addSpring(a, b, s){
		s.a = String(a);
		s.b = String(b);
		springs[s.a+"-"+s.b] = s; 
    }

    function getSpring(a, b){
    	return springs[String(a) + "-" + String(b)];
    }

	function animate(){
        
        // do some initial processing of the data
        var idx = 0;
		for(let id in points){
			var p = points[id];
			p.idx = idx;
			P.push(p);
			idx++;
		}
        
        for(let id in springs){
        	var s = springs[id];
        	s.a = points[s.a];
		    s.b = points[s.b];
			if(s.rest == undefined){
				s.rest = length(subtract(s.a.pos, s.b.pos));
			}
			S.push(s);
			segments.push([s.a.idx, s.b.idx]);
		}

    	requestAnimationFrame(draw);
    }

    function draw(now){

    	updateState(0.001*now); 

		// update buffers 
		var  pos = [];
		for(let i =0; i<P.length; ++i){
			 var p = P[i]; 
			 pos.push(p.pos); 
	    }


        gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(pos), gl.STATIC_DRAW);
		gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.POINTS,0, pos.length);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(segments)), gl.STATIC_DRAW);
	    gl.drawElements(gl.LINES, 2*segments.length, gl.UNSIGNED_SHORT, 0);

        document.getElementById("time").innerHTML = Math.round(0.001*now);

        requestAnimationFrame(draw);
    }


    function updateState(currTime){

    	if(prevTime == undefined){
    		prevTime = currTime; //seconds
    		return;
    	}

		var t = (currTime - prevTime); // seconds
		var steps = Math.floor((t + leftOverTime)/dt); 
		leftOverTime = t - steps*dt;
		prevTime = currTime; 

		for(let z = 0; z < steps; ++z){

			// initialize all accelerations 
			for(let i in P){
				var p = P[i];
				p.acc = mss.gravity; 
			}

			// apply spring forces
			for(let i in S){
				var s = S[i];
				var a = s.a;
				var b = s.b;
				var v = subtract(a.pos, b.pos);
				var l = length(v);
				if(l!=0){
					var f = scale(s.ks*(1 - s.rest/l), v);
					a.acc = subtract(a.acc, scale(1/a.m, f));
					b.acc = add(b.acc, scale(1/b.m, f));
				}
			}

			for(let i in P){							
				
				var p = P[i];

                if(!p.pinned){
                	//p.pos = add(p.pos, scale(dt, p.vel));
					p.vel = scale(1-mss.drag, add(p.vel, scale(dt, p.acc))); 
					p.pos = add(p.pos, scale(dt, p.vel));
                }
			}

        }
    }

}



