"use strict";

function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}

class EnhancedMaps {
    constructor() {
        _defineProperty(this, "allMaps", [{
            id: "geoportail",
            name: "IGN Satellite",
            tileUrl : "https://wxs.ign.fr/pratique/geoportail/wmts?&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}"
        }, {
            id: "ign-classic",
            name: "IGN Classique",
            tileUrl: "https://strava.xavierdeneux.fr/geoportail/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
        },
        {
            id:"scan25-tour",
            name: "Scan 25 touristique",
            tileUrl:"https://strava.xavierdeneux.fr/geoportail/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
        },
        {
            id: "openstreetmap",
            name: "OpenStreetMap",
            tileUrl: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
        },
        {
            id: "opencyclemap",
            name: "Thunderforest Cycle",
            tileUrl: "https://strava.xavierdeneux.fr/thunderforest/cycle/{z}/{x}/{y}.png"
        },
        {
            id: "outdoors",
            name: "Thunderforest Outdoors",
            tileUrl: "https://strava.xavierdeneux.fr/thunderforest/outdoors/{z}/{x}/{y}.png"
        },
        {
            id:"landscape",
            name:"Thunderforest Landscape",
            tileUrl:"https://strava.xavierdeneux.fr/thunderforest/landscape/{z}/{x}/{y}.png"
        },
        {
            id: "transport",
            name: "Thunderforest Transport",
            tileUrl: "https://strava.xavierdeneux.fr/thunderforest/transport/{z}/{x}/{y}.png"
        },
        {
            id: "igntopo",
            name: "IGN Topo",
            tileUrl: "https://wxs.ign.fr/essentiels/geoportail/wmts?layer=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&style=PCI%20vecteur&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}"
        }]);

        _defineProperty(this, "reactInstance", void 0);

        _defineProperty(this, "mapInstance", void 0);

        _defineProperty(this, "opacity", +localStorage.getItem('opacity'));

        _defineProperty(this, "currentStravaFirstMap", localStorage.getItem('currentStravaFirstMap'));

        _defineProperty(this, "currentStravaSecondMap", localStorage.getItem('currentStravaSecondMap'));

        _defineProperty(this, "useExtension", localStorage.getItem('useExtension') === "true");

        _defineProperty(this, "originalLayers", []);
    }

    findReact(dom, traverseUp = 0) {
        const key = Object.keys(dom).find(key => key.startsWith("__reactInternalInstance$"));
        const domFiber = dom[key];
        if (domFiber == null) return null; // react 16+

        const GetCompFiber = fiber => {
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
            if (got) return got;
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
            attribution: ''
        };
        return s;
    }

    layerFromLeaflet(id, firstOrSecondMap) {
        const l = this.allMaps.find(map => map.id == id);
        const before = this.mapInstance.getLayer("global-heatmap") ? "global-heatmap" : "z-index-1";
        const map = this.mapInstance;
        if (!map.getSource(id)) map.addSource(id, this.sourceFromLeaflet(l));
        if (map.getLayer(firstOrSecondMap)) map.removeLayer(firstOrSecondMap);
        map.addLayer({
            id: firstOrSecondMap,
            type: "raster",
            source: id
        }, before);
    }

    resetLayers() {
        this.mapInstance.getStyle().layers.filter(l => l.source == "composite").map(l => l.id).forEach(l => this.mapInstance.removeLayer(l));
    }

    setFirstMap(id) {
        if (!id && !this.allMaps.find(map => map.id == id)) return;
        localStorage.currentStravaFirstMap = id;
        this.resetLayers();
        this.layerFromLeaflet(id, "primary");
    }

    setSecondMap(id) {
        if (!id && !this.allMaps.find(map => map.id == id)) return;
        localStorage.currentStravaSecondMap = id;
        this.resetLayers();
        this.layerFromLeaflet(id, "secondary");
        this.onOpacityChange();
    }

    onChangeMap() {
        setTimeout(() => {
            if ($('#firstMapSelect').val()) {
                this.setFirstMap($('#firstMapSelect').val());

                if ($('#secondMapSelect').val()) {
                    $('#opacity').show();
                    this.setSecondMap($('#secondMapSelect').val());
                } else {
                    $('#opacity').hide();
                }
            } else {
                $('#secondMapSelect').val('');
                $('#opacity').hide();
            }
        });
    }

    onOpacityChange() {
        let opacityInput = $('#opacity input').val();
        let opacity = opacityInput ? parseFloat(opacityInput) : null;

        if ($('#secondMapSelect').val()) {
            if (typeof opacity === 'number') {
                this.opacity = opacity / 100;
                localStorage.setItem('opacity', opacity);
                this.mapInstance.setPaintProperty('secondary', 'raster-opacity', this.opacity);
                $('#opacityValue').html(opacity);
                $('#opacity input').val(opacity);
            }
        }
    }

    getFirstMap() {
        return localStorage.currentStravaFirstMap || '';
    }

    getSecondMap() {
        return localStorage.currentStravaSecondMap || '';
    }

    drawUI() {
        let helpBtn = $('<button type="button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M7.5 0A7.5 7.5 0 1015 7.5 7.51 7.51 0 007.5 0zm0 14A6.5 6.5 0 1114 7.5 6.5 6.5 0 017.5 14z"></path><path d="M7.5 4a2.14 2.14 0 00-2.07 2h1A1.16 1.16 0 017.5 5a1.16 1.16 0 011.07 1c0 .58-.29.81-.76 1.13A1.39 1.39 0 007 8.25V9h1v-.75A1.55 1.55 0 018.37 8a2.22 2.22 0 001.2-2A2.14 2.14 0 007.5 4z"></path><circle cx="7.5" cy="10.75" r="0.75"></circle></svg></button>');
        $('#strava-enhanced-maps').remove();
        let node = $('<div class="Sidebar--section--r_mne" id="strava-enhanced-maps"><h4 class="text-callout text-demi mt-0 mb-0" id="strava-enhanced-maps-title">Strava Enhanced Maps '+$(helpBtn).html()+'</h4><div id="mapSelects"></div></div>');
        let selectFirstMap = $('<select name="firstMap" id="firstMapSelect"><option value=""></option></select>');
        selectFirstMap.on('change', this.onChangeMap.bind(this));
        let selectSecondMap = $('<select name="secondMap" id="secondMapSelect"><option value=""></option></select>');
        selectSecondMap.on('change', this.onChangeMap.bind(this));
        let resetMap = $('<span class="reset-map">Revenir à la carto originale strava</span>');
        resetMap.on('click', this.backToOriginalMap.bind(this));
        let useExtension = $('<span class="useExtension">Utiliser de nouveau l\'extension</span>');
        useExtension.on('click', function () {
            localStorage.setItem('useExtension', false);
            this.useExtension = false;
            this.init(this);
        }.bind(this));
        $('#main>div:nth-child(2)').prepend(node);

        if (!this.useExtension) {
            $('#strava-enhanced-maps').append(useExtension);
            return;
        }

        $('#mapSelects').append('<div><span>1<sup>er</sup> plan</span></div>');
        $('#mapSelects div:first').append(selectFirstMap);
        $('#mapSelects').append('<div><span>2<sup>nd</sup> plan</span></div>');
        $('#mapSelects div:nth-child(2)').append(selectSecondMap);
        let opacityInput = $('<input type="range" max="100" value="' + this.opacity + '" min="0" step="1" class="slider">');
        opacityInput.on('change', {
            event
        }, this.onOpacityChange.bind(this));
        $('#strava-enhanced-maps').append($('<div id="opacity"><span class="label">Opacité (<span id="opacityValue"></span>%)</span><div id="opacitySlider"></div></div>'));

        if (this.useExtension) {
            $('#strava-enhanced-maps').append(resetMap);
        }

        $('#opacitySlider').append(opacityInput);

        if (!this.currentStravaSecondMap) {
            $('#opacity').hide();
        }

        this.allMaps.forEach(l => {
            let optionFirstSelect = $('<option value="' + l.id + '">' + l.name + '</option>');
            let optionSecondSelect = $('<option value="' + l.id + '">' + l.name + '</option>');

            if (l.id === this.currentStravaFirstMap) {
                optionFirstSelect.attr('selected', 'selected');
            }

            if (l.id === this.currentStravaSecondMap) {
                optionSecondSelect.attr('selected', 'selected');
            }

            $('#firstMapSelect').append(optionFirstSelect);
            $('#secondMapSelect').append(optionSecondSelect);
        });
    }

    checkLocalStorageValues() {
        if (!this.currentStravaFirstMap || this.currentStravaFirstMap == 'undefined') {
            this.currentStravaFirstMap = this.allMaps[3].id;
        }

        if (!this.opacity || this.opacity < 0 || this.opacity > 100) {
            this.opacity = 50;
        }

        if (!this.useExtension) {
            localStorage.setItem('useExtension', true);
            this.useExtension = true;
        }
    }

    backToOriginalMap() {
        this.mapInstance.getStyle().layers.filter(l => true).map(l => l.id).forEach(l => this.mapInstance.removeLayer(l));
        this.originalLayers.forEach(originalLayer => {
            this.mapInstance.addLayer(originalLayer);
        });
        localStorage.setItem('useExtension', false);
        this.useExtension = false;
        this.drawUI();
    }

    showModal() {
        $('body').append(`<div id="dialog" title="Strava Enhanced Maps 2.2.2">
            <p>Merci d\'utiliser Strava Enhanced Maps!
            <br /><br />
            Je viens de livrer une nouvelle version qui répare les carte IGN cassées depuis quelques jours.
            <br /><br />
            J\'en ai profité pour ajouter quelques nouveaux fonds de carte et acheter une clé d'API chez Thunderforest pour que vous ne voyez plus le message "API Key required" sur certains fonds de carte. <br />
            Fonds de carte ajoutés:<ul>
            <li>Scan 25 touristique, fournie par IGN pour afficher les points d'interêt touristiques</li>
            <li>Thunderforest Landscape</li>
            </ul>Si vous avez des idées d\'amélioration ou des bugs à me faire remonter, n\'hésitez pas à me contacter sur <a href="mailto:x.deneux@gmail.com" target="_blank">x.deneux@gmail.com</a> ou via twitter <a href="https://twitter.com/xavierdeneux" target="_blank">@xavierdeneux</a>
            <br /><br />
            Si vous souhaitez soutenir les développements de l'extension vous pouvez faire un don sur <strong><a href="https://paypal.me/xavierdeneux" target="_blank">https://paypal.me/xavierdeneux</a></strong>
            <br /><br />
            Merci et bonnes sorties!
            <br /><br />
            Xavier</p></div>`);

        $( function() {
            $( "#dialog" ).dialog({
                width: 600,
            });
        });
    }

    async init() {
        this.reactInstance = this.findReact(document.getElementsByClassName('mapboxgl-map')[0]);
        this.checkLocalStorageValues();
        await this.wait(() => {
            this.reactInstance.return.memoizedProps.mapboxRef(m => (this.mapInstance = m, m));
            return this.mapInstance;
        });
        this.originalLayers = this.mapInstance.getStyle().layers;
        this.drawUI();

        if (!this.useExtension) {
            return;
        }

        setTimeout(() => {
            this.onChangeMap();
        }, 1000);

        if(!localStorage.getItem('popup-strava-enhanced-maps-2.2.2')){
            this.showModal();
            localStorage.setItem('popup-strava-enhanced-maps-2.2.2','true');
        }

        $('#strava-enhanced-maps-title').click(()=>{
            this.showModal();
        })
    }

}

let isReady = false;
let waitIsReady = () => {
    setTimeout(function() {
        if (!isReady) {
          if($('.mapboxgl-canvas-container').children().length>1){
              isReady = true;
              var enhancedMap = new EnhancedMaps();
              enhancedMap.init();
          }else{
            waitIsReady();
          }
        }
      }, 1000)
}
waitIsReady();