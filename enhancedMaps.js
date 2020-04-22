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

		opacity = +localStorage.getItem('opacity') || 50;
		currentStravaFirstMap = localStorage.getItem('currentStravaFirstMap');
		currentStravaSecondMap = localStorage.getItem('currentStravaSecondMap');

		constructor(){
			this.allMaps.forEach((map)=>{
				this.allTileLayers[map.id] =  L.tileLayer(map.tileUrl, {attribution: ""});
			});

			this.checkLocalStorageValues();
		}

		checkLocalStorageValues(){
			if(!this.currentStravaFirstMap || this.currentStravaFirstMap == 'undefined' || !this.allTileLayers[this.currentStravaFirstMap]){
				this.setFirstMap(this.allMaps[0].id);
			}

			if(!this.currentStravaSecondMap || this.currentStravaSecondMap == 'undefined' || !this.allTileLayers[this.currentStravaSecondMap]){
				this.setSecondMap(this.allMaps[1].id);
			}

			if(!this.opacity || this.opacity < 0 || this.opacity > 100){
				this.setOpacity(50);
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

			this.createSelects();
			this.onChangeMap();
			this.updateDisplayOpacity();
		}

		changeOpacity(e){
			this.setOpacity(e.target.value);
			this.updateDisplayOpacity();
		}

		setOpacity(opacity){
			this.opacity = opacity;
			localStorage.setItem('opacity', opacity );
		}

		updateDisplayOpacity(){
			$('#opacityValue').html(this.opacity);
			$('#map-canvas .leaflet-layer').css('opacity', 1);
			$('#map-canvas .leaflet-layer:last-child()').css('opacity', this.opacity/100);
		}

		createSelects(){
			let selectFirstMap = $('<select name="firstMap" id="firstMapSelect"></select>');
			selectFirstMap.on('change', this.onChangeMap.bind(this));
			let selectSecondMap = $('<select name="secondMap" id="secondMapSelect"><option value=""></option></select>');
			selectSecondMap.on('change', this.onChangeMap.bind(this));

			this.allMaps.forEach(l => {
				let optionFirstSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
				let optionSecondSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
				if(l.id === this.currentStravaFirstMap){
					optionFirstSelect.attr('selected', 'selected');
				}
				if(l.id === this.currentStravaSecondMap){
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

			let opacityInput = $('<input type="range" value="'+this.opacity+'" max="100" min="0" step="1" class="slider">');
			opacityInput.on('change', {event}, this.changeOpacity.bind(this));
			$('#view-options .map-style')
				.append('<div class="label">Carte second plan</div>')
				.append(selectSecondMap)
				.append($('<span id="opacity"><span class="label">Opacité (<span id="opacityValue">'+this.opacity+'</span>%)</span><div id="opacitySlider">')
				.append(opacityInput)
				.append('</div></span>'));
		}

		setFirstMap(map){
			localStorage.setItem('currentStravaFirstMap', map);
			this.currentStravaFirstMap = map;
		}

		setSecondMap(map){
			localStorage.setItem('currentStravaSecondMap', map);
			this.currentStravaSecondMap = map;
		}

		onChangeMap(){
			this.setFirstMap($('#firstMapSelect').val());
			let secondMapVal = $('#secondMapSelect').val();

			this.mainMap.setLayer(this.currentStravaFirstMap);

			if(secondMapVal){
				this.maps[0].addLayer(
					this.getLayer(secondMapVal)
				);
			}

			this.updateDisplayOpacity();
		}

		addLayers(map) {
			map.layers.runbikehike = map.createLayer("run-bike-hike");

			for(var id in this.allTileLayers){
				map.layers[id] = this.allTileLayers[id];
			}
		}
	}

	var enhancedMap = new EnhancedMaps();

	Strava.Routes.MapViewOptionsView.prototype.setMapStyle = function(t){
 		var map = this.map;

		setTimeout(()=>{
			enhancedMap.setMap(this.map);
		},500)

		return map.setLayer(t);
	};

	routeBuilderOpts.children()[1].click();
}