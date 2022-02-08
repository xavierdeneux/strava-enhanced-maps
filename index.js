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

		if(document.location.href.startsWith('https://www.strava.com/routes/')){
			let jquery = document.createElement("script");
			jquery.src = chrome.runtime.getURL("lib/jquery-3.5.1.min.js");
			jquery.type = "text/javascript";
			jquery.onload = () => scriptIsLoaded();
			document.body.appendChild(jquery);

			let jqueryUi = document.createElement("script");
			jqueryUi.src = chrome.runtime.getURL("lib/jquery-ui-1.3.1.min.js");
			jqueryUi.type = "text/javascript";
			jqueryUi.onload = () => scriptIsLoaded();
			document.body.appendChild(jqueryUi);

			var jqueryUiStyle = document.createElement('link');
			jqueryUiStyle.rel = 'stylesheet';
			jqueryUiStyle.type = 'text/css';
			jqueryUiStyle.media = 'screen';
			jqueryUiStyle.href = chrome.runtime.getURL("lib/jquery-ui-1.3.1.min.css");
			document.body.appendChild(jqueryUiStyle);

			// let arrive = document.createElement('script');
			// arrive.src = chrome.runtime.getURL('lib/arrive.min.js');
			// arrive.type = 'text/javascript';
			// arrive.onload = () => scriptIsLoaded();
			// document.body.appendChild(arrive);


			var styles = document.createElement('link');
			styles.rel = 'stylesheet';
			styles.type = 'text/css';
			styles.media = 'screen';
			styles.href = chrome.runtime.getURL("style.css");
			document.body.appendChild(styles);
		}
})();
