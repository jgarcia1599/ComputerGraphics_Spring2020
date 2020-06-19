function Camera(){

	var Mcam = mat4(); // camera matrix 
	var P = mat4();    // projection matrix
	
	var camFrame = { // camera frame
			e: vec3(0,0,0), // camera location
			u: vec3(1,0,0), // unit vector to "right"
			v: vec3(0,1,0), // unit vector in "up" direction
			w: vec3(0,0,1)  // unit vector opposite "gaze" direction
	};			
	

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
			
			allowMovement: function(){
				// add event handlers for moving the camera
				addEventHandlers(); 
			}

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

		window.addEventListener('keydown', handlekeydown);
		
		function handlekeydown(e){	
			var u, v, w;
			var k = e.key;
			var f = camFrame;
			var c = Math.cos(theta);
			var s = Math.sin(theta);
			var d = delta;
			
			if(k =="ArrowRight" || k == "ArrowDown"){s *= -1;}
			if(k == "ArrowLeft" || k== "ArrowDown" || k == "a"){d*=-1};

			
			if(k == "ArrowUp" || k == "ArrowDown"){
				if(!e.ctrlKey){
					f.e = add(f.e, scale(d,f.v));
				}
				else{
					v = add(scale(c,f.v), scale(s,f.w));
					w =  add(scale(-s,f.v), scale(c,f.w));
					f.v = v; f.w = w;
				}
				Mcam = cameraMatrix(f.e, f.u, f.v, f.w);
			}
			else if(k == "ArrowLeft" || k == "ArrowRight"){
				if(!e.ctrlKey){
					f.e = add(f.e, scale(d,f.u));
				}
				else{
					w = add(scale(c,f.w), scale(s,f.u));
					u = add(scale(-s,f.w), scale(c,f.u));
					f.w = w; f.u = u;
				}
				Mcam = cameraMatrix(f.e, f.u, f.v, f.w);
			}
			else if(k == "a" || k == "z"){
				f.e = add(f.e, scale(d,f.w));
				Mcam = cameraMatrix(f.e, f.u, f.v, f.w);
			}			
		}	
	}

	return Cam;

}