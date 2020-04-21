var routeBuilderOpts = jQuery('#view-options li.map-style div.switches');
if (routeBuilderOpts.length) {
	var $ = jQuery;

	class EnhancedMaps {
		allMaps = [
			{
				id: "geoportail",
				name: "IGN Satellite",
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

		allTileLayers = {};
		maps = [];
		mainMap;

		opacity = localStorage.getItem('opacity') || 50;
		mapCanvas = $('#map-canvas');

		currentStravaFirstMap = localStorage.getItem('currentStravaFirstMap');
		currentStravaSecondMap = localStorage.getItem('currentStravaSecondMap');

		constructor(){
			this.allMaps.forEach((map)=>{
				this.allTileLayers[map.id] =  L.tileLayer(map.tileUrl, {attribution: ""});
			});

			if(!this.currentStravaFirstMap || this.currentStravaFirstMap == 'undefined'){
				this.currentStravaFirstMap = this.allMaps[0].id;
			}

			if(!this.currentStravaSecondMap || this.currentStravaSecondMap == 'undefined'){
				this.currentStravaSecondMap = this.allMaps[1].id;
			}
		}

		getLayer(mapId){
			let mapConfig = this.allMaps.filter((map)=>{
				return map.id === mapId;
			})[0];

			return L.tileLayer(mapConfig.tileUrl, {attribution: ""});
		}

		setMap(firstMap){
			this.mainMap = firstMap;
			this.addLayers(firstMap);
			this.maps[0] = firstMap.instance;
			//firstMap.addLayer(this.allTileLayers[this.currentStravaFirstMap]);
			//this.mapCanvas.css('opacity', this.opacity/100);
			//this.createSecondMap(firstMap);
			this.createSelects();
		}

		createSecondMap(){
			setTimeout(()=>{
				let firstMap = this.maps[0];
				let center = firstMap.getCenter();
				let zoom = firstMap.getZoom();

				// On créé la 2eme map
				let div = document.createElement('div');
				div.id = 'secondMap';
				document.querySelector('#route-container').append(div)
				let map = L.map('secondMap').setView([center.lat, center.lng], zoom);
				L.control.layers(this.allTileLayers).addTo(map);

				if(this.currentStravaSecondMap){
					this.allTileLayers[this.currentStravaSecondMap].addTo(map);
				}
				firstMap.on("viewreset", this.reset.bind(this));
				firstMap.on("drag", this.reset.bind(this));
				this.maps[1] = map;
			}, 2000)
		};

		changeOpacity(e){
			this.setOpacity(+e.target.value);
		}

		setOpacity(opacity){
			this.opacity = opacity;
			$('#opacityValue').html(opacity);
			this.mapCanvas.css({'opacity': opacity/100});
			localStorage.setItem('opacity', opacity);
		}

		reset(e){
			this.maps[1].setView(this.maps[0].getCenter(), this.maps[0].getZoom());
		}

		createSelects(){
			let selectFirstMap = $('<select name="firstMap" id="firstMapSelect"></select>');
			selectFirstMap.on('change', this.onChangeFirstMap.bind(this));
			//let selectSecondMap = $('<select name="secondMap" id="secondMapSelect"><option value=""></option></select>');
			//selectSecondMap.on('change', this.onChangeSecondMap.bind(this));

			this.allMaps.forEach(l => {
				let optionFirstSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
				//let optionSecondSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
				if(l.id === this.currentStravaFirstMap){
					optionFirstSelect.attr('selected', 'selected');
				}
				// if(l.id === this.currentStravaSecondMap){
				// 	optionSecondSelect.attr('selected', 'selected');
				// }

				selectFirstMap.append(optionFirstSelect);
				//selectSecondMap.append(optionSecondSelect);
			});
			$('.map-style .label').remove();
			$('.map-style .switches')

				.append('<div class="label">Carte premier plan</div>')
				.append(selectFirstMap)

			// let opacityInput = $('<input type="range" value="'+this.opacity+'" max="100" min="0" step="1" class="slider">');
			// opacityInput.on('change', {event}, this.changeOpacity.bind(this));
			// $('#view-options .map-style')
			// 	.append('<div class="label">Carte second plan</div>')
			// 	.append(selectSecondMap)
			// 	.append($('<span id="opacity"><span class="label">Opacité (<span id="opacityValue">'+this.opacity+'</span>%)</span><div id="opacitySlider">')
			// 	.append(opacityInput)
			// 	.append('</div></span>'));

		}

		setFirstMap(map){
			localStorage.setItem('currentStravaFirstMap', map);
			this.currentStravaFirstMap = map;
		}

		setSecondMap(map){
			localStorage.setItem('currentStravaSecondMap', map);
			this.currentStravaSecondMap = map;
		}

		onChangeFirstMap(){
			// Strava.Routes.MapViewOptionsView.prototype.setMapStyle($('#firstMapSelect').val())
			// this.setFirstMap($('#firstMapSelect').val());
			// Strava.Routes.MapViewOptionsView.setMapStyle($('#firstMapSelect').val());
			console.log('this.mainMap', this.mainMap)
			this.mainMap.setLayer($('#firstMapSelect').val())
			// console.log('this.maps[0]', this.maps[0])
			// this.maps[0].eachLayer((layer) => {
			// 	this.maps[0].removeLayer(layer);
			// });

			// this.maps[0].addLayer(this.getLayer(this.currentStravaFirstMap));
		}

		onChangeSecondMap(){
			let secondMapVal = $('#secondMapSelect').val();
			// this.maps[1].eachLayer((layer) => {
			// 	this.maps[1].removeLayer(layer);
			// });

			if(secondMapVal){
				$('#opacity').show();
				this.setSecondMap(secondMapVal);
				this.maps[1].addLayer(this.getLayer(this.currentStravaSecondMap));
			}else{
				$('#opacity').hide();
				localStorage.removeItem('currentStravaSecondMap');
				this.setOpacity(100);
			}
		}

		addLayers(map) {
			map.layers.runbikehike = map.createLayer("run-bike-hike");

			// this.allTileLayers.forEach(id=>{
			// 	map.layers[id] = this.allTileLayers[id];
			// });
			for(var id in this.allTileLayers){
				map.layers[id] = this.allTileLayers[id];
			}
		}
	}

	var enhancedMap = new EnhancedMaps();
	let firstTimeCall = true;
	var savedMap;
	Strava.Routes.MapViewOptionsView.prototype.setMapStyle = function(t){
		if(!savedMap){
			savedMap = this.map;
		}
		console.log('set layer', t, this)
 		var map = this.map;
// 		let mapInstance = map.instance;
// console.log('??', t, mapInstance);
// 		if(firstTimeCall){
		// mapInstance.eachLayer(function (layer) {
		// 	mapInstance.removeLayer(layer);
		// });
		if(firstTimeCall){
			setTimeout(()=>{
				enhancedMap.setMap(this.map);
			},500);
			firstTimeCall = false;
		}

		return map.setLayer(t);
	};

	routeBuilderOpts.children()[1].click();
}