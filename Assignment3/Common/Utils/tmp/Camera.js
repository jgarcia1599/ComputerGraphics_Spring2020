function Camera(){

	var Mcam = mat4(); // camera matrix 
	var P = mat4();    // projection matrix
	
	var camFrame = { // camera frame
			e: vec3(0,0,0), // camera location
			u: vec3(1,0,0), // unit vector to "right"
			v: vec3(0,1,0), // unit vector in "up" direction
			w: vec3(0,0,1)  // unit vector opposite "gaze" direction
	};			
	
	addEventHandlers(); // add event handler for moving the camera

	var Cam = { /* object to be returned */
		 	
		 	lookAt: function (eye, at, up) {
				// set camFrame and Mcam 
				// ...
		 	},

		 	setPerspective: function(fovy, aspect, near, far){
				// set the projection matrix P 
				// ...
			},

			setOrthographic: function (r,l,t,b,n,f){
				// set the projection matrix P 
				// ...
			},
			
			getCameraTransformationMatrix(){
				return Mcam;
			},
			
			getProjectionMatrix(){
				return P;
			},

			getMatrix: function(){
				// combines camera transformation and projection
				return mult(P,Mcam);
			},
			
			getFrame: function (){
				// returns camera frame (e, u, v, w)
				return camFrame;
			}

	};

	/* Helper functions */
	
	function addEventHandlers(){
		// ...
	}
	
	// ... 

	return Cam;
}