const allMaps = [
	{
		id: "geoportail",
		name: "IGN Satelite",
		tileUrl: "https://wxs.ign.fr/an7nvfzojv5wa96dsga5nk8w/geoportail/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}",
	},
	{
		id: "ign",
		name: "IGN Classique",
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

Strava.Maps.Mapbox.Base.mapIds.runbikehike_id = "mapbox.run-bike-hike";

var routeBuilderOpts = jQuery('#view-options li.map-style div.switches');
if (routeBuilderOpts.length) {
	var once = true;
	Strava.Routes.MapViewOptionsView.prototype.setMapStyle = function(t){
		var map = this.map;

		if (once) {
			once = false;
			addLayers(map);
		}

		localStorage.currentStravaMap = t;
		return map.setLayer(t);
	};

	var currentStravaMap = localStorage.currentStravaMap;


	routeBuilderOpts.css({display: 'block', position: 'relative'});
	allMaps.forEach(l =>
		routeBuilderOpts.append(
			jQuery("<div class='button btn-xs' tabindex='0'>").data("value", l.id).text(l.name)
		)
	);
	routeBuilderOpts.children().css({display: 'block', width: '100%'});

	if (currentStravaMap) {
		routeBuilderOpts.children().filter((_, e) => jQuery(e).data("value") === currentStravaMap).click();
	}
}