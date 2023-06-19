 module.exports = function(req, res, next) {
    if (req.secure) {
		// Already https; don't do anything special.
		console.log(" ----------------- ");
        next();
    } 
	else {
		// skipped the redirect as we will be using only API
        // Redirect to https.
		console.log(req.headers.host+"req.headers.host");
		if(req.isSocket){
			res.redirect('wss://' + req.headers.host +req.url);
		}
		else{
			res.redirect('https://' + req.headers.host+ req.url);
		}
    }
}; 