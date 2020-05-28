(function(){
		let scriptsToLoad = 2;
		let scriptLoaded = 0;

		scriptIsLoaded = () => {
			scriptLoaded++;
			if(scriptLoaded === scriptsToLoad){
				var s = document.createElement("script");
				s.src = chrome.runtime.getURL('enhancedMaps.js');
				s.type = 'text/javascript';
				document.body.appendChild(s);
			}
		}

		if(document.location.href === "https://www.strava.com/routes/new?v2=true"){
			let jquery = document.createElement("script");
			jquery.src = chrome.runtime.getURL("lib/jquery-3.5.1.min.js");
			jquery.type = "text/javascript";
			jquery.onload = () => scriptIsLoaded();
			document.body.appendChild(jquery);

			let arrive = document.createElement('script');
			arrive.src = chrome.runtime.getURL('lib/arrive.min.js');
			arrive.type = 'text/javascript';
			arrive.onload = () => scriptIsLoaded();
			document.body.appendChild(arrive);


			var styles = document.createElement('link');
			styles.rel = 'stylesheet';
			styles.type = 'text/css';
			styles.media = 'screen';
			styles.href = chrome.runtime.getURL("style.css");
			document.body.appendChild(styles);
		}

})();
