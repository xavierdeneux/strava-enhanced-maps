const allMaps = [
	{
		id: "geoportail",
		name: "IGN Satelite",
		tileUrl: "https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}",
	},
	{
		id: "ign-classic",
		name: "IGN Classique",
		tileUrl: "https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
	},
	{
		id: "ign",
		name: "IGN",
		tileUrl: "https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}",
	},
	{
		id: "igntopo",
		name: "IGN Topo",
		tileUrl: "https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&style=PCI%20vecteur&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}"
	},
	{
		id: "openstreetmap",
		name: "OpenStreetMap",
		tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
	},
	{
		id: "opencyclemap",
		name: "OpenCycleMap",
		tileUrl: "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png"
	},
	{
		id: "transport",
		name: "Transport",
		tileUrl: "https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png"
	},
	{
		id: "outdoors",
		name: "Outdoors",
		tileUrl: "https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png"
	}
];

var allTileLayers = {};
allMaps.forEach((map)=>{
	allTileLayers[map.id] =  L.tileLayer(map.tileUrl, {attribution: "Map: <a href='http://www.opencyclemap.org/'>Andy Allan</a>"});
})

function getLayer(mapId){
	let mapConfig = allMaps.filter((map)=>{
		// console.log('x', map)
		return map.id === mapId;
	})[0];

	return L.tileLayer(mapConfig.tileUrl, {attribution: "Map: <a href='http://www.opencyclemap.org/'>Andy Allan</a>"});
}

var maps_ = [], numMaps = 2;
for(var i=0;i<numMaps;i++){
	maps_.push(i)
}
var maps = [];


var routeBuilderOpts = jQuery('#view-options li.map-style div.switches');

if (routeBuilderOpts.length) {
	const defaultOpacity = 50;
	var opacity = localStorage.getItem('opacity') || defaultOpacity;

	var $ = jQuery;
	var mapCanvas = $('#map-canvas');

	var currentStravaFirstMap = localStorage.getItem('currentStravaFirstMap') || allMaps[0].id;
	var currentStravaSecondMap = localStorage.getItem('currentStravaSecondMap');
	if(!currentStravaSecondMap || currentStravaSecondMap == 'undefined'){
		currentStravaSecondMap = allMaps[1].id;
	}

	var once = true;

	Strava.Routes.MapViewOptionsView.prototype.setMapStyle = function(t){
		var map = this.map;
		let mapInstance = map.instance;

		mapInstance.eachLayer(function (layer) {
			mapInstance.removeLayer(layer);
		});

		setTimeout(()=>{
			map.addLayer(allTileLayers[currentStravaFirstMap]);
			maps[0] = mapInstance;
			mapCanvas.css({'zIndex': 1,'opacity': defaultOpacity/100});
		},500)

		createSecondMap(map);
		createSelects();

		return map.setLayer(t);
	};

	function createSecondMap(firstMap){
		setTimeout(()=>{
			var center = firstMap.instance.getCenter();
			var zoom = firstMap.instance.getZoom();

			// On créé la 2eme map
			var div = document.createElement('div');
			div.id = 'secondMap';
			document.querySelector('#route-container').append(div)
			var map = L.map('secondMap').setView([center.lat, center.lng], zoom);
			L.control.layers(allTileLayers).addTo(map);

			if(currentStravaSecondMap){
				allTileLayers[currentStravaSecondMap].addTo(map);
			}
			maps[0].on("viewreset", reset);
			maps[0].on("drag", reset);
			maps[1] = map;
		},2000)
	};

	function changeOpacity(e){
		setOpacity(+e.target.value);
	}

	function setOpacity(newOpacity){
		opacity = newOpacity;
		$('#opacityValue').html(newOpacity);
		mapCanvas.css({'opacity': opacity/100});
		localStorage.setItem('opacity', opacity);
	}

	function reset(e){
		maps[1].setView(maps[0].getCenter(), maps[0].getZoom());
	}


	routeBuilderOpts.children()[1].click();
	routeBuilderOpts.css({display: 'block', position: 'relative'});

	function createSelects(){
		var selectFirstMap = $('<select name="firstMap" id="firstMapSelect" onChange="onChangeFirstMap()"></select>');
		var selectSecondMap = $('<select name="secondMap" id="secondMapSelect" onChange="onChangeSecondMap()"><option value=""></option></select>');
		allMaps.forEach(l => {
			let optionFirstSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
			let optionSecondSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
			if(l.id === currentStravaFirstMap){
				optionFirstSelect.attr('selected', 'selected');
			}
			if(l.id === currentStravaSecondMap){
				optionSecondSelect.attr('selected', 'selected');
			}

			selectFirstMap.append(optionFirstSelect);
			selectSecondMap.append(optionSecondSelect);
		});
		$('.map-style .label').remove();
		$('.map-style .switches')
			.html('')
			.append('<div class="label">Carte premier plan</div>')
			.append(selectFirstMap)

		$('#view-options .map-style')
			.append('<div class="label">Carte second plan</div>')
			.append(selectSecondMap)
			.append($('<span id="opacity"><span class="label">Opacité (<span id="opacityValue">'+opacity+'</span>%)</span><div id="opacitySlider"><input type="range" value="'+opacity+'" max="100" min="0" step="1" onChange="changeOpacity(event)" class="slider"></div></span>'));

	}

	function onChangeFirstMap(){
		setFirstMap($('#firstMapSelect').val());
		maps[0].eachLayer(function (layer) {
			maps[0].removeLayer(layer);
		});

		maps[0].addLayer(getLayer(currentStravaFirstMap));
	}

	function onChangeSecondMap(){
		let secondMapVal = $('#secondMapSelect').val();
		maps[1].eachLayer(function (layer) {
			maps[1].removeLayer(layer);
		});

		if(secondMapVal){
			$('#opacity').show();
			setSecondMap(secondMapVal);

			maps[1].addLayer(getLayer(currentStravaSecondMap));
		}else{
			$('#opacity').hide();
			localStorage.removeItem('currentStravaSecondMap');
			setOpacity(100);
		}
	}

	function setFirstMap(map){
		localStorage.setItem('currentStravaFirstMap', map);
		currentStravaFirstMap = map;
	}

	function setSecondMap(map){
		console.log('savesecondmap', map)
		localStorage.setItem('currentStravaSecondMap', map);
		currentStravaSecondMap = map;
	}
}