/* Note: ObjInit uses functions from Common/Utils/*.js */

function objInit(Obj){
	
	var modelMatrix  = mat4(); // modelling matrix
	var normalMatrix = mat3(); // normal transformation matrix

	var vBuffer = gl.createBuffer(); // buffer for vertex positions
	var iBuffer = gl.createBuffer(); // buffer for indices
	var nBuffer = gl.createBuffer(); // buffer for normals
	
	var	normalsPresent = (Obj.normals   != undefined);
	if(!normalsPresent){ computeNormals();}
	
	var	trianglesPresent  = (Obj.triangles != undefined);		
	if(!trianglesPresent) createTriangles();
	
	var Attributes = ["vPosition", "vNormal"];
	var Uniforms   = ["M", "N", "Ka", "Kd", "Ks", "shininess"];
	var Loc = getLocations(Attributes, Uniforms);

	sendBufferData(); // Send data to buffers. 
	
/*----- Attach data and functions to Obj -----*/

	if(Obj.material == undefined){ 
		// Set default material
		Obj.material = {	
			Ka: vec3(1.0, 1.0, 1.0),
			Kd: vec3(Math.random(), Math.random(), Math.random()),
			Ks: vec3(0.4, 0.4, 0.4),
			shininess: 500*Math.random() 
		};
	}
	 
	Obj.setModelMatrix = function(m){ 
		modelMatrix = m; 
		normalMatrix = normalTransformationMatrix(m);
	}

	Obj.getModelMatrix = function(){return modelMatrix;}

	Obj.getNormalTransformationMatrix = function(){return normalMatrix;}

	Obj.draw = function(){
		
		Loc.enableAttributes(); // enable attributes 

		// set attribute pointers
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.vertexAttribPointer(Loc.vPosition, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
		gl.vertexAttribPointer(Loc.vNormal, 3, gl.FLOAT, false, 0, 0);
		
		// Set material uniforms 
		gl.uniform3fv(Loc.Ka, flatten(Obj.material.Ka)); 
		gl.uniform3fv(Loc.Kd, flatten(Obj.material.Kd)); 
		gl.uniform3fv(Loc.Ks, flatten(Obj.material.Ks)); 
		gl.uniform1f(Loc.shininess, Obj.material.shininess); 
	
		// Set modelling and normal transformation matrices
	    gl.uniformMatrix4fv(Loc.M, gl.FALSE, flatten(modelMatrix)); 
	    gl.uniformMatrix3fv(Loc.N, gl.FALSE, flatten(normalMatrix));

		// Draw
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
		gl.drawElements(gl.TRIANGLES, 3*Obj.triangles.length, gl.UNSIGNED_SHORT, 0);

		Loc.disableAttributes(); // disable attributes
	}


	
/*----- Helper functions defined below -----*/

	function sendBufferData(){
		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(Obj.positions), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatten(Obj.triangles)),gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(Obj.normals), gl.STATIC_DRAW);		
	}

	function createTriangles(){
		// create triangles array if not present 
		// Obj.triangles = [[0,1,2], [3,4,5], ...] 
		Obj.triangles = [];
		for(var i = 0; i<Obj.positions.length/3; ++i){
			Obj.triangles[i] = [3*i, 3*i+1, 3*i+2];
		}
	}

	function computeNormals(){
		// Go over each triangle and compute the normals.
		// The normal at a vertex is the weighted sum of the 
		// normals of adjacent triangles. The weight of a 
		// triangle is proportional to its area. 

		Obj.normals = [];
		var pos = Obj.positions;
		var nor = Obj.normals;
		var tri = Obj.triangles;
		var i, j;
		for(i = 0; i < pos.length; ++i){
			nor[i] = vec3(0, 0, 0);
		}
		for(i = 0; i < tri.length; ++i ){
			var t = tri[i];
			var v = [];
			for(j =0; j<3; ++j){
				v[j] = vec3(pos[t[j]]);
			}
			var v01 = subtract(v[1],v[0]);
			var v12 = subtract(v[2],v[1]);
			var n = cross(v01, v12); 
			// Note: we don't normalize n. The length of n is
			// proportional to the area of the triangle t.
			
			for(j =0; j<3; ++j){
				nor[t[j]] = add(nor[t[j]], n);
			}
		}
		for(i = 0; i < pos.length; ++i){
			nor[i] = normalize(nor[i]); 
		}
	}

}



