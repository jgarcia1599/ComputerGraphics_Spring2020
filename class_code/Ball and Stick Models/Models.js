function pendulum(){
	var points = { 
			a: {position: [0.5,0.5]},
			b: {position: [0.4, 0.4]},
			c: {position: [0.6, 0.4], oldPosition: [0.0, 0.5]},
			d: {position: [0.5, 0.7], oldPosition: [0.0, 0.0]},
			e: {position: [0.5, 0.9], oldPosition: [0.5, 1.0], pinned: true}
		};
	
	var links = [ 
			{start: "a", end: "b"},
			{start: "b", end: "c"},
			{start: "c", end: "a"},
			{start: "a", end: "d"},
			{start: "d", end: "e"}
		];

    function init(){
    	addMousePicking(points);
    }
	

	return { points: points, links: links, init: init };
}

function gridModel(m, n){
	// m and n should be >= 2
	var vec = vec3;
	var dx = 0.5/(m-1);
	var dy = 0.5/(n-1);
	var dt = 1/60;

	var points = {};
	var links = [];

	for(var i = 0; i < m; ++i){
		for(var j = 0; j < n; ++j){
			var pos = vec(i*dx + 0.25,  1-j*dy, 0);
			var vel = vec(4*Math.random(), 0.1 , 4*Math.random());
			points[[i,j]] = { 
				position: pos,
				oldPosition: add(pos, scale(dt, vel))
			    //oldPosition: vec(i*dx + 0.25 + 0.1*Math.random(),  1-j*dy, 0.1*Math.random())
			};

			if(i != m-1) links.push( {start: [i,j], end: [i+1, j]} );
			if(j != n-1) links.push( {start: [i,j], end: [i, j+1]} );
		}
		//points[[i,0]].pinned = true;
	}
	points[[0,0]].pinned = true; 
	points[[m-1, 0]].pinned = true;
	points[[m/2, 0]].pinned = true;


    function init(){
    	addMousePicking(points);
    }
	

	return {points: points, links: links, init: init};
}

function addMousePicking(points){
	var closest;
	var tracking = false;

	function mousePos(event){
		// assumes [0,1]x[0,1] coordinates
		var x = event.offsetX/canvas.width;
		var y = 1-event.offsetY/canvas.height;
		return vec2(x,y);	
	}


	window.addEventListener("mousedown",  
		function(event){
			//console.log("down");
			tracking = true;
			closest = undefined;
			var max = 0.2;
			var q = mousePos(event);
			for(var id in points){
				var p = points[id];
				if(p.pinned) continue;
				var d = distance(q, vec2(p.position[0], p.position[1]))
				if(d < max){ max = d; closest = p; }
			}
		}
	);

	window.addEventListener("mouseup", 
		function(event){
			if(closest!=undefined){
				closest.pinned = false;
			}
			tracking = false;
		}
	);
	window.addEventListener("mousemove", 
		function(event){
			if(tracking && closest!=undefined){
				q = mousePos(event);
				closest.position[0] = q[0];
				closest.position[1] = q[1];
				closest.oldPosition[0] = q[0];
				closest.oldPosition[1] = q[1];
				closest.pinned = true;
			}
		}
	);
}


/* some utility functions */


function rand(){
	return 2*Math.random()-1;
}

function randvec(){
	return vec(rand(), rand(), rand());
}

function distance(p,q){ return length(subtract(p,q)); }

