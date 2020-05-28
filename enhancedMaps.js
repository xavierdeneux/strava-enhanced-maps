// var routeBuilderExist = $('#ftue-map-settings');
console.log('enhancedMaps', document.arrive)

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
			tileUrl: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
		},
		{
			id: "opencyclemap",
			name: "OpenCycleMap",
			tileUrl: "https://a.tile.thunderforest.com/cycle/{z}/{x}/{y}.png"
		},
		{
			id: "transport",
			name: "Transport",
			tileUrl: "https://a.tile.thunderforest.com/transport/{z}/{x}/{y}.png"
		},
		{
			id: "outdoors",
			name: "Outdoors",
			tileUrl: "https://a.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png"
		}
	];

	reactInstance;
	mapInstance;
	opacity = +localStorage.getItem('opacity');
	currentStravaFirstMap = localStorage.getItem('currentStravaFirstMap');
	currentStravaSecondMap = localStorage.getItem('currentStravaSecondMap');
	originalLayers = [];

	findReact(dom, traverseUp = 0) {
		const key = Object.keys(dom).find(key=>key.startsWith("__reactInternalInstance$"));
		const domFiber = dom[key];

		if (domFiber == null) return null;

		// react 16+
		const GetCompFiber = fiber=>{
			let parentFiber = fiber.return;
			while (typeof parentFiber.type == "string") {
				parentFiber = parentFiber.return;
			}
			return parentFiber;
		};
		let compFiber = GetCompFiber(domFiber);
		for (let i = 0; i < traverseUp; i++) {
			compFiber = GetCompFiber(compFiber);
		}

		return compFiber;
	}


	sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async wait(what) {
		for (let tries = 0, delay = 100; tries < 60; ++tries, delay = Math.min(delay * 2, 1000)) {
			const got = what();
			if (got)
				return got;

			await this.sleep(delay);
		}

		throw new Error(`timeout ${what}`);
	}


	sourceFromLeaflet(l) {
		const s = {
			type: "raster",
			tiles: [l.tileUrl],
			minzoom: l.opts && l.opts.minZoom ? l.opts.minZoom : 0,
			maxzoom: l.opts && l.opts.maxNativeZoom ? l.opts.maxNativeZoom : l.opts && l.opts.maxZoom ? l.opts.maxZoom : 18,
			tileSize: 256,
			attribution: '',
		};
		return s;
	}

	layerFromLeaflet(id, firstOrSecondMap) {
		const l = this.allMaps.find((map)=>map.id==id)
		const before = this.mapInstance.getLayer("global-heatmap") ? "global-heatmap" : "z-index-1";
		const map = this.mapInstance;

		if (!map.getSource(id))
			map.addSource(id, this.sourceFromLeaflet(l));
		if (map.getLayer(firstOrSecondMap))
			map.removeLayer(firstOrSecondMap);
		map.addLayer({id: firstOrSecondMap, type: "raster", source: id}, before);
	}


	resetLayers(){
		this.mapInstance.getStyle().layers.filter(l => l.source == "composite").map(l => l.id).forEach(l => this.mapInstance.removeLayer(l));
	}

	setFirstMap(id){
		if (!id && !this.allMaps.find((map)=>map.id==id))
			return;
		localStorage.currentStravaFirstMap = id;
		this.resetLayers();
		this.layerFromLeaflet(id, "primary");
	}

	setSecondMap(id){
		console.log('id', id)
		if (!id && !this.allMaps.find((map)=>map.id==id))
			return;
		localStorage.currentStravaSecondMap = id;
		this.resetLayers();
		this.layerFromLeaflet(id, "secondary");
		this.onOpacityChange();
	}


	onChangeMap(){
		setTimeout(() => {
			if($('#firstMapSelect').val()){
				this.setFirstMap($('#firstMapSelect').val());

				if($('#secondMapSelect').val()){
					$('#opacity').show();
					this.setSecondMap($('#secondMapSelect').val());
				}else{
					$('#opacity').hide();
				}
			}else{
				$('#secondMapSelect').val('');
				$('#opacity').hide();
			}
		});
	}

	onOpacityChange(){
		let opacityInput = $('#opacity input').val();
		let opacity = opacityInput ? parseFloat(opacityInput) : null;

		if($('#secondMapSelect').val()){
			if(typeof(opacity)==='number'){
				this.opacity = opacity/100;
				localStorage.setItem('opacity', opacity );
				this.mapInstance.setPaintProperty(
					'secondary',
					'raster-opacity',
					this.opacity
				);
				$('#opacityValue').html(opacity);
				$('#opacity input').val(opacity);
			}
		}
	}

	getFirstMap(){
		return localStorage.currentStravaFirstMap || '';
	}

	getSecondMap(){
		return localStorage.currentStravaSecondMap || '';
	}

	drawUI(){
		let node = $('<div class="Sidebar--section--r_mne" id="strava-enhanced-maps"><h4 class="text-callout text-demi mt-0 mb-0">Strava Enhanced Maps</h4><div id="mapSelects"></div></div>');
		let selectFirstMap = $('<select name="firstMap" id="firstMapSelect"><option value=""></option></select>');
		selectFirstMap.on('change', this.onChangeMap.bind(this));
		let selectSecondMap = $('<select name="secondMap" id="secondMapSelect"><option value=""></option></select>');
		selectSecondMap.on('change', this.onChangeMap.bind(this));

		$('#main>div:nth-child(2)').prepend(node)
		$('#mapSelects').append('<div><span>1<sup>er</sup> plan</span></div>');
		$('#mapSelects div:first').append(selectFirstMap);
		$('#mapSelects').append('<div><span>2<sup>nd</sup> plan</span></div>');
		$('#mapSelects div:nth-child(2)').append(selectSecondMap);

		let opacityInput = $('<input type="range" max="100" value="'+this.opacity+'" min="0" step="1" class="slider">');
		opacityInput.on('change', {event}, this.onOpacityChange.bind(this));

		$('#strava-enhanced-maps').append(
			$('<div id="opacity"><span class="label">Opacité (<span id="opacityValue"></span>%)</span><div id="opacitySlider"></div></div>')
		);

		$('#opacitySlider').append(opacityInput);
		if(!this.currentStravaSecondMap){
			$('#opacity').hide();
		}

		this.allMaps.forEach(l => {
			let optionFirstSelect = $('<option value="'+l.id+'">'+l.name+'</option>');
			let optionSecondSelect = $('<option value="'+l.id+'">'+l.name+'</option>');

			if(l.id === this.currentStravaFirstMap){
				optionFirstSelect.attr('selected', 'selected');
			}
			if(l.id === this.currentStravaSecondMap){
				optionSecondSelect.attr('selected', 'selected');
			}

			$('#firstMapSelect').append(optionFirstSelect);
			$('#secondMapSelect').append(optionSecondSelect);
		});

		// let button = $('<button type="button">Test</button>');
		// button.on('click', this.test.bind(this));
		// $('#main>div:nth-child(2)').append(button)
	}

	checkLocalStorageValues(){
		if(!this.currentStravaFirstMap || this.currentStravaFirstMap == 'undefined'){
			this.currentStravaFirstMap = this.allMaps[2].id;
		}

		if(!this.opacity || this.opacity < 0 || this.opacity > 100){
			this.opacity = 50;
		}
	}

	async init(){
		this.reactInstance = this.findReact(document.getElementsByClassName('mapboxgl-map')[0]);
		this.checkLocalStorageValues();

		await this.wait(() => {
			this.reactInstance.return.memoizedProps.mapboxRef((m) => (this.mapInstance = m, m));
				return this.mapInstance;
			}
		);

		this.originalLayers = this.mapInstance.getStyle().layers;
		this.drawUI();

		setTimeout(()=>{
			this.onChangeMap();
		},1000)
	}
}

document.arrive(".mapboxgl-map", {onceOnly: false, existing: true}, function () {
	var enhancedMap = new EnhancedMaps();
	enhancedMap.init();
});