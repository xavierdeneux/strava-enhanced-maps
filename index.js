(function(){
	if(document.getElementsByClassName('leaflet-container').length){
		var s = document.createElement("script");
		s.src = chrome.runtime.getURL('enhancedMaps.js');
		s.type = 'text/javascript';
		document.body.appendChild(s);

		var styles = document.createElement('link');
		styles.rel = 'stylesheet';
		styles.type = 'text/css';
		styles.media = 'screen';
		styles.href = chrome.runtime.getURL("style.css");
		document.body.appendChild(styles);
	}
})();
