function gridModel(m, n){
	var mss = massSpringSystem();
	var dx = 1, dy = 1;
	if(m > 1) { dx = 0.9/(m-1); }
	if(n > 1) { dy = 0.9/(n-1); }
	var ks = 14*n;
	mss.drag = 0.001; //0.01;
	mss.gravity = vec(0.0, -0.3, 0);
	var w = 1;

	for(var i = 0; i < m; ++i){
		for(var j = 0; j < n; ++j){
			mss.addPoint([i,j], {m:w, pos: vec( (i+0.5-m/2)*dx,  1-j*dy, 0), vel:vec()});
			if(i != m-1) mss.addSpring([i,j], [i+1, j], {ks:ks} );
			if(j != n-1) mss.addSpring([i,j], [i, j+1], {ks:ks} );
		}
		mss.getPoint([i,0]).pinned = true;
	}

	return mss;
}


