(function(){
	if(document.getElementsByClassName('leaflet-container').length){
		var s = document.createElement("script");
		s.src = chrome.runtime.getURL('enhancedMaps.js');
		s.type = 'text/javascript';
		document.body.appendChild(s);
	}
})();
