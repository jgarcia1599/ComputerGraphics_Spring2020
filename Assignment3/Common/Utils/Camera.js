function Camera(){

	var Mcam = mat4(); // camera matrix 
	var P = mat4();    // projection matrix
	var camFrame = { // camera frame
			e: vec3(0,0,0), // camera location
			u: vec3(1,0,0), // unit vector to "right"
			v: vec3(0,1,0), // unit vector in "up" direction
			w: vec3(0,0,1)  // unit vector opposite "gaze" direction
	};			
	
	addEventHandlers();

	var Cam = { /* object to be returned */
		 	
		 	lookAt: function (eye, at, up) {
				// set camFrame and Mcam 
				var w = normalize(subtract(eye,at));
				var u = normalize(cross(up, w));
				var v = cross(w,u);
				camFrame = {e: eye, u: u, v: v, w: w};
				Mcam = cameraMatrix(eye, u, v, w); 
		 	},

		 	setPerspective: function(fovy, aspect, near, far){
				// set the projection matrix P 
				P = perspectiveMatrix(fovy, aspect, near, far );
			},

			setOrthographic: function (r,l,t,b,n,f){
				// set the projection matrix P 
				P = orthoProjMatrix(r,l,t,b,n,f);
			},
			
			getCameraTransformationMatrix: function(){
				return Mcam;
			},
			
			getProjectionMatrix: function(){
				return P;
			},

			getMatrix: function(){
				// combines camera transformation and projection
				return mult(P,Mcam);
			},
			
			getFrame: function (){
				// returns camera frame (e, u, v, w)
				return camFrame;
			},
			
			allowMovement: addEventHandlers
	};

	function cameraMatrix(eye,u,v,w){
	    return mat4( vec4(u, -dot(u,eye)),
				vec4(v, -dot(v,eye)),
				vec4(w, -dot(w,eye)),
				vec4(0,0,0,1) );
	}

	function orthoProjMatrix(r,l,t,b,n,f){ // n > f

		return mat4(2/(r-l), 0, 0, -(r+l)/(r-l),
					0, 2/(t-b), 0, -(t+b)/(t-b),
					0, 0, 2/(n-f), -(n+f)/(n-f),
					0, 0, 0, 1);

	}

	function perspProjectionMatrix(r,l,t,b,n,f){ // 0 > n > f

		return mat4(-2*n/(r-l), 0, (r+l)/(r-l), 0,
					0, -2*n/(t-b),(t+b)/(t-b), 0,
					0, 0, -(n+f)/(n-f), 2*f*n/(n-f),
					0, 0, -1, 0 );
	}

	function perspectiveMatrix(fovy, aspect, near, far ){ // far > near > 0
		var t = near*Math.tan(radians(fovy/2));
		var r = t*aspect;
		return perspProjectionMatrix(r,-r, t,-t, -near, -far);
	}

	function addEventHandlers(){
		var delta = 0.05;
		var theta = 0.05;
		var c = Math.cos(theta); 
		var s = Math.sin(theta);
		window.addEventListener('keydown', handlekeydown);

		function handlekeydown(e){	
			var k = e.key;
			var ctrl = e.ctrlKey;
			var m = null;

			// add your code here 
			// e.g. if (ctrl && k == "ArrowRight") { ... }
			if (ctrl && k == "ArrowDown"){
				// rotate right
				m = Ry(theta);
			}
			else if (ctrl && k == "ArrowUp"){
				// rotate left
				m = Ry(theta* (-1.0));
			}
			else if (!ctrl){
				switch(k){
					case "ArrowLeft":
				        // Left pressed
				        m = translate(delta, 0, 0);
				        break;
				    case "ArrowRight":
				        // Right pressed
				        m = translate(-1.0*delta, 0, 0);
				        break;
				    case "ArrowUp":
				        // Up pressed
				        m = translate(0, -1.0*delta, 0);
				        break;
				    case "ArrowDown":
				        // Down pressed
				        m = translate(0, delta, 0);
				        break;
				    case "a":
				    	// forward towards the object
				    	m = translate(0, 0, delta);
				    	break;
				    case "z":
				    	// backward 
				    	m = translate(0, 0, -1.0*delta);
				    	break;
				    default:
				    	m = null; 
				    	break;
				}
			}
			if (m != null){
				Mcam = mult(m, Mcam);
				var inverseMcam = inverse(Mcam);
				camFrame.u = normalize(vec3(inverseMcam[0][0], inverseMcam[1][0], inverseMcam[2][0]));
				camFrame.v = normalize(vec3(inverseMcam[0][1], inverseMcam[1][1], inverseMcam[2][1]));
				camFrame.w = normalize(vec3(inverseMcam[0][2], inverseMcam[1][2], inverseMcam[2][2]));
				camFrame.e = vec3(inverseMcam[0][3], inverseMcam[1][3], inverseMcam[2][3]);
				// console.log("after:");
				// console.log(camFrame);
			}
		}	
	}
	
	return Cam;
}

function Ry(theta) {
  var c = Math.cos(theta);
  var s = Math.sin(theta);
  var ry = mat4( c, 0.0, s, 0.0,
      0.0, 1.0,  0.0, 0.0,
      -s, 0.0,  c, 0.0,
      0.0, 0.0,  0.0, 1.0 );
  return ry;
}
