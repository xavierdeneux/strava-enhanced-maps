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

function tileLayer(l) {
	l.opts = l.opts || {};
	l.opts.maxZoom = l.opts.maxZoom || 20;
	var r = L.tileLayer(l.tileUrl, l.opts);
	if (l.overlay) {
		var o = L.tileLayer(l.overlay.url, l.overlay.opts);
		r = L.layerGroup([r, o]);
	}
	return r;
}

function addLayers(map) {
	map.layers.runbikehike = map.createLayer("run-bike-hike");
	allMaps.forEach(l => map.layers[l.id] = tileLayer(l));
}

var maps_ = [], numMaps = 2;
for(var i=0;i<numMaps;i++){
	maps_.push(i)
}
var maps = [];
// var maps = maps_.map(showMap);

// function showMap(d){
//     //initial view
//     var map = L.map('map'+d).setView([51, 11], 5);
//     var data_attrib = " | Data: <a href='http://www.openstreetmap.org/'>&copy; OpenStreetMap </a>contributers | <a href='http://d3js.org/'>D3.js</a>"
//     var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: "Map: <a href='http://www.openstreetmap.org/'>&copy; OpenStreetMap </a>contributers" + data_attrib}).addTo(map);
//     var esri = L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}.png', {attribution: "Map: <a href='http://www.arcgis.com/home/item.html?id=c4ec722a1cd34cf0a23904aadf8923a0'>ArcGIS - World Physical Map</a>" + data_attrib});
//     var stamen1 = L.tileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: "Map: <a href='http://maps.stamen.com/#toner/12/37.7706/-122.3782'>Stamen Design</a>" + data_attrib});
//     var stamen2 = L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', {attribution: "Map: <a href='http://maps.stamen.com/#watercolor/12/37.7706/-122.3782'>Stamen Design</a>" + data_attrib});
//     var cycle = L.tileLayer('http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png', {attribution: "Map: <a href='http://www.opencyclemap.org/'>Andy Allan</a>" + data_attrib});
//     var hike = L.tileLayer('http://toolserver.org/tiles/hikebike/{z}/{x}/{y}.png', {attribution: "Map: <a href='http://hikebikemap.de/'>Hike&BikeMap</a>" + data_attrib});

//     //add the favored layers to an JSON-object
//     var baseLayers = {"Stamen_Toner": stamen1,"Stamen_Watercolor": stamen2, "OpenStreetMap":osm, "World Physical Map":esri, "OpenCycleMap":cycle, "Hike&BikeMap":hike};
//     //add the layer-JSON-object to a layer-control AND add it to the map
//     L.control.layers(baseLayers).addTo(map);
//     //add the automatic map-view-updating to the corresponding events
//     map.on("viewreset", reset);
//     map.on("drag", reset);
//     return map;
//   }
//   function reset(e){
//     var current = this._container.id.replace('map','');
//     maps_.forEach(function(d){
//       if(d!=current){
//         maps[d].setView(maps[current].getCenter(), maps[current].getZoom())
//       }
//     });
//   }


var $ = jQuery;

var routeBuilderOpts = jQuery('#view-options li.map-style div.switches');
var mapCanvas = $('#map-canvas');

if (routeBuilderOpts.length) {
	var once = true;
	console.log('Strava.Routes', Strava.Routes.MapViewOptionsView)
	Strava.Routes.MapViewOptionsView.prototype.setMapStyle = function(t){
		var map = this.map;

		if (once) {
			once = false;
			addLayers(map);
		}


		createSecondMap(map);
		localStorage.setItem('currentStravaMap', t);
		return map.setLayer(t);
	};

	var createSecondMap = function(firstMap){

		setTimeout(()=>{
			var center = firstMap.instance.getCenter();
			var zoom = firstMap.instance.getZoom();
			// console.log('xxxx', firstMap);
			var div = document.createElement('div');
			div.id = 'secondmap';
			div.innerHTML = 'secondmap';
			div.style.position = 'absolute';
			div.style.top = '50px';
			div.style.right = '0px';
			div.style.left = '0px';
			div.style.bottom = '0px';
			document.querySelector('#route-container').append(div)
			var map = L.map('secondmap').setView([center.lat, center.lng], zoom);

			L.control.layers(allTileLayers).addTo(map);
			console.log('allTileLayers',allTileLayers)
			allTileLayers["ign-classic"].addTo(map);

			$('#view-options .map-style').append(
				$('<span class="label">Opacité (<span id="opacityValue">50</span>%)</span><div id="opacitySlider"><input type="range" value="50" max="100" min="0" step="1" onChange="test(event)" class="slider"></div>')
			);
			maps[0] = firstMap.instance;
			maps[1] = map;


			firstMap.instance.on("viewreset", reset);
			firstMap.instance.on("drag", reset);
			mapCanvas.css({'zIndex': 1,'opacity':0.5});

			console.log('maps', maps);
		},2000)
	};

	function test(e){
		let opacity = +e.target.value;
		console.log('opacity', opacity);
		$('#opacityValue').html(opacity);
		mapCanvas.css({'opacity':opacity/100});
	}
	function reset(e){
		console.log('test', maps[0].getCenter());

		maps[1].setView(maps[0].getCenter(), maps[0].getZoom())
		// var current = this._container.id.replace('map','');
		// maps_.forEach(function(d){
		// 	if(d!=current){
		// 	maps[d].setView(maps[current].getCenter(), maps[current].getZoom())
		// 	}
		// });
	}
	var currentStravaMap = localStorage.getItem('currentStravaMap');

	routeBuilderOpts.css({display: 'block', position: 'relative'});
	allMaps.forEach(l =>
		routeBuilderOpts.append(
			jQuery("<div class='button btn-xs' tabindex='0'>").data("value", l.id).text(l.name)
		)
	);

	jQuery(".switches").css({
		'width':'225px',
		'whiteSpace' : 'normal'
	});
	jQuery('.switches .button').css({
		'display' : 'inline-block',
		'margin' : '3px',
		'float' : 'initial',
		'width' : 'auto'
	})
	routeBuilderOpts.children().css({display: 'inline-block', margin: '3px'});

	if (currentStravaMap) {
		routeBuilderOpts.children().filter((_, e) => jQuery(e).data("value") === currentStravaMap).click();
	}
}