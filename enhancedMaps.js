"use strict";
const extensionVersion = "2.5.0";
const localStorageItemName = "popup-strava-enhanced-maps-" + extensionVersion;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

class EnhancedMaps {
  constructor() {
    _defineProperty(this, "allMaps", [
      {
        id: "geoportail",
        name: "IGN Satellite",
        tileUrl: "https://data.geopf.fr/wmts?layer=ORTHOIMAGERY.ORTHOPHOTOS&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
      },
      {
        id: "ign-classic",
        name: "IGN Classique",
        tileUrl:
          "https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}"
        },
      {
        id: "scan25-tour",
        name: "Scan 25 touristique",
        tileUrl:
        "https://data.geopf.fr/private/wmts?apikey=ign_scan_ws&layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
      },
      {
        id: 'ign-topo',
        name: 'IGN Topo',
        tileUrl:
        "https://data.geopf.fr/private/wmts?apikey=ign_scan_ws&layer=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix={z}&TileCol={x}&TileRow={y}"
      },
      {
        id: "openstreetmap",
        name: "OpenStreetMap",
        tileUrl: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      },
      {
        id: "cycleosm",
        name: "Cycle OSM",
        tileUrl: "https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
      },
      {
        id: "cycleosm-lite",
        name: "Cycle OSM Lite",
        tileUrl: "https://a.tile-cyclosm.openstreetmap.fr/cyclosm-lite/{z}/{x}/{y}.png",
      },
      {
        id: "swiss-topo",
        name: "Swisstopo",
        tileUrl:
          "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
      },
      {
        id: "opencyclemap",
        name: "Thunderforest Cycle",
        tileUrl:
          "https://strava.xavierdeneux.fr/thunderforest/cycle/{z}/{x}/{y}.png",
      },
      {
        id: "outdoors",
        name: "Thunderforest Outdoors",
        tileUrl:
          "https://strava.xavierdeneux.fr/thunderforest/outdoors/{z}/{x}/{y}.png",
      },
      {
        id: "landscape",
        name: "Thunderforest Landscape",
        tileUrl:
          "https://strava.xavierdeneux.fr/thunderforest/landscape/{z}/{x}/{y}.png",
      },
      {
        id: "transport",
        name: "Thunderforest Transport",
        tileUrl:
          "https://strava.xavierdeneux.fr/thunderforest/transport/{z}/{x}/{y}.png",
      }
    ]);

    _defineProperty(this, "reactInstance", void 0);

    _defineProperty(this, "mapInstance", void 0);

    _defineProperty(this, "opacity", +localStorage.getItem("opacity"));

    _defineProperty(
      this,
      "currentStravaFirstMap",
      localStorage.getItem("currentStravaFirstMap")
    );

    _defineProperty(
      this,
      "currentStravaSecondMap",
      localStorage.getItem("currentStravaSecondMap")
    );

    _defineProperty(
      this,
      "useExtension",
      localStorage.getItem("useExtension") === "true"
    );

    _defineProperty(this, "originalLayers", []);
  }

  findReact(dom) {
    const key = Object.keys(dom).find((key) => key.startsWith("__reactFiber$"));
    return dom[key].return;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async wait(what) {
    for (
      let tries = 0, delay = 100;
      tries < 60;
      ++tries, delay = Math.min(delay * 2, 1000)
    ) {
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
      maxzoom:
        l.opts && l.opts.maxNativeZoom
          ? l.opts.maxNativeZoom
          : l.opts && l.opts.maxZoom
          ? l.opts.maxZoom
          : 18,
      tileSize: 256,
      attribution: "",
    };
    return s;
  }

  layerFromLeaflet(id, firstOrSecondMap) {
    const l = this.allMaps.find((map) => map.id == id);
    const before = this.mapInstance.getLayer("global-heatmap")
      ? "global-heatmap"
      : "z-index-1";
    const map = this.mapInstance;
    if (!map.getSource(id)) map.addSource(id, this.sourceFromLeaflet(l));
    if (map.getLayer(firstOrSecondMap)) map.removeLayer(firstOrSecondMap);
    map.addLayer(
      {
        id: firstOrSecondMap,
        type: "raster",
        source: id,
      },
      before
    );
  }

  resetLayers() {
    this.mapInstance
      .getStyle()
      .layers.filter((l) => l.source == "composite")
      .map((l) => l.id)
      .forEach((l) => this.mapInstance.removeLayer(l));
  }

  setFirstMap(id) {
    if (!id && !this.allMaps.find((map) => map.id == id)) return;
    localStorage.currentStravaFirstMap = id;
    this.resetLayers();
    this.layerFromLeaflet(id, "primary");
  }

  setSecondMap(id) {
    if (!id && !this.allMaps.find((map) => map.id == id)) return;
    localStorage.currentStravaSecondMap = id;
    this.resetLayers();
    this.layerFromLeaflet(id, "secondary");
    this.onOpacityChange();
  }

  onChangeMap() {
    setTimeout(() => {
      const firstMap = this.getItem("#firstMapSelect").value;
      const secondMap = this.getItem("#secondMapSelect").value;
      if (firstMap) {
        this.setFirstMap(firstMap);
        this.setSecondMap(firstMap);

        if (secondMap) {
          this.showItem("#opacity");
          this.setSecondMap(secondMap);
        } else {
          this.hideItem("#opacity");
        }
      } else {
        this.setItem("#secondMapSelect", "");
        this.hideItem("#opacity");
      }
    });
  }

  getItem(selector) {
    return document.querySelector(selector);
  }

  setItem(selector, value) {
    document.querySelector(selector).value = value;
  }

  showItem(selector) {
    document.querySelector(selector).style.display = "block";
  }
  hideItem(selector) {
    document.querySelector(selector).style.display = "none";
  }

  onOpacityChange() {
    let opacityInput = document.querySelector("#opacity input").value;
    let opacity = opacityInput ? parseFloat(opacityInput) : null;
    console.log("onchange opacity", opacity);
    if (this.getItem("#secondMapSelect").value) {
      if (typeof opacity === "number") {
        this.opacity = opacity / 100;
        localStorage.setItem("opacity", opacity);
        setTimeout(() => {
          this.mapInstance.setPaintProperty(
            "secondary",
            "raster-opacity",
            this.opacity
          );
        });
        console.log("this mapinstance", this.mapInstance);
        document.getElementById("opacityValue").innerHTML = opacity;
        this.setItem("#opacity input", opacity);
      }
    }
  }

  getFirstMap() {
    return localStorage.currentStravaFirstMap || "";
  }

  getSecondMap() {
    return localStorage.currentStravaSecondMap || "";
  }

  drawUI() {
    const helpBtn = `<button type="button" class="help-btn" title="Aide"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><path d="M7.5 0A7.5 7.5 0 1015 7.5 7.51 7.51 0 007.5 0zm0 14A6.5 6.5 0 1114 7.5 6.5 6.5 0 017.5 14z"></path><path d="M7.5 4a2.14 2.14 0 00-2.07 2h1A1.16 1.16 0 017.5 5a1.16 1.16 0 011.07 1c0 .58-.29.81-.76 1.13A1.39 1.39 0 007 8.25V9h1v-.75A1.55 1.55 0 018.37 8a2.22 2.22 0 001.2-2A2.14 2.14 0 007.5 4z"></path><circle cx="7.5" cy="10.75" r="0.75"></circle></svg></button>`;

    const stravaEnhancedMaps = document.getElementById("strava-enhanced-maps");
    if (stravaEnhancedMaps) {
      stravaEnhancedMaps.remove();
    }

    const containerClassName = document.querySelector(
      "[class^='RoutePreferenceSidebar_section']"
    ).className;

    let node = document.createElement("div");
    node.className = containerClassName;
    node.id = "strava-enhanced-maps";

    const h4className = document.querySelector(
      "[class^='RoutePreferenceSidebar_sectionHeader']"
    ).className;

    node.innerHTML = `<h4 class="${h4className}" id="strava-enhanced-maps-title">Strava Enhanced Maps ${helpBtn}</h4><div id="mapSelects"></div>`;

    let selectFirstMap = document.createElement("select");
    selectFirstMap.name = "firstMap";
    selectFirstMap.id = "firstMapSelect";
    selectFirstMap.innerHTML = '<option value=""></option>';
    selectFirstMap.addEventListener("change", this.onChangeMap.bind(this));

    let selectSecondMap = document.createElement("select");
    selectSecondMap.name = "secondMap";
    selectSecondMap.id = "secondMapSelect";
    selectSecondMap.innerHTML = '<option value=""></option>';
    selectSecondMap.addEventListener("change", this.onChangeMap.bind(this));

    let resetMap = document.createElement("span");
    resetMap.className = "reset-map";
    resetMap.textContent = "Revenir à la carto originale strava";
    resetMap.addEventListener("click", this.backToOriginalMap.bind(this));

    let useExtension = document.createElement("span");
    useExtension.className = "useExtension";
    useExtension.textContent = "Utiliser de nouveau l'extension";
    useExtension.addEventListener(
      "click",
      function () {
        localStorage.setItem("useExtension", false);
        this.useExtension = false;
        this.init(this);
      }.bind(this)
    );

    document.querySelector("[class^='Sidebar_content']").prepend(node);

    if (!this.useExtension) {
      document.getElementById("strava-enhanced-maps").appendChild(useExtension);
      return;
    }

    let mapSelects = document.getElementById("mapSelects");
    let firstMapDiv = document.createElement("div");
    firstMapDiv.innerHTML = "<span>1<sup>er</sup> plan</span>";
    firstMapDiv.appendChild(selectFirstMap);
    mapSelects.appendChild(firstMapDiv);

    let secondMapDiv = document.createElement("div");
    secondMapDiv.innerHTML = "<span>2<sup>nd</sup> plan</span>";
    secondMapDiv.appendChild(selectSecondMap);
    mapSelects.appendChild(secondMapDiv);

    let opacityInput = document.createElement("input");
    opacityInput.type = "range";
    opacityInput.max = "100";
    opacityInput.value = this.opacity;
    opacityInput.min = "0";
    opacityInput.step = "1";
    opacityInput.className = "slider";
    opacityInput.addEventListener("change", this.onOpacityChange.bind(this));
    console.log("x");
    let opacityDiv = document.createElement("div");
    opacityDiv.id = "opacity";
    opacityDiv.innerHTML =
      '<span class="label">Opacité (<span id="opacityValue"></span>%)</span><div id="opacitySlider"></div>';
    opacityDiv.querySelector("#opacitySlider").appendChild(opacityInput);

    document.getElementById("strava-enhanced-maps").appendChild(opacityDiv);

    if (this.useExtension) {
      document.getElementById("strava-enhanced-maps").appendChild(resetMap);
    }

    if (!this.currentStravaSecondMap) {
      opacityDiv.style.display = "none";
    }

    this.allMaps.forEach((l) => {
      let optionFirstSelect = document.createElement("option");
      optionFirstSelect.value = l.id;
      optionFirstSelect.textContent = l.name;

      let optionSecondSelect = document.createElement("option");
      optionSecondSelect.value = l.id;
      optionSecondSelect.textContent = l.name;

      if (l.id === this.currentStravaFirstMap) {
        optionFirstSelect.selected = true;
      }

      if (l.id === this.currentStravaSecondMap) {
        optionSecondSelect.selected = true;
      }

      selectFirstMap.appendChild(optionFirstSelect);
      selectSecondMap.appendChild(optionSecondSelect);
    });
  }

  checkLocalStorageValues() {
    if (
      !this.currentStravaFirstMap ||
      this.currentStravaFirstMap == "undefined"
    ) {
      this.currentStravaFirstMap = this.allMaps[3].id;
    }

    if (!this.opacity || this.opacity < 0 || this.opacity > 100) {
      this.opacity = 50;
    }

    if (!this.useExtension) {
      localStorage.setItem("useExtension", true);
      this.useExtension = true;
    }
  }

  backToOriginalMap() {
    this.mapInstance
      .getStyle()
      .layers.filter((l) => true)
      .map((l) => l.id)
      .forEach((l) => this.mapInstance.removeLayer(l));
    this.originalLayers.forEach((originalLayer) => {
      this.mapInstance.addLayer(originalLayer);
    });
    localStorage.setItem("useExtension", false);
    this.useExtension = false;
    this.drawUI();
  }

  showModal() {
    const modal = new tingle.modal({
      footer: true,
      stickyFooter: false,
      closeMethods: ["overlay", "button"],
    });

    // set content
    modal.setContent(`
      <div>
        <h1>Strava Enhanced Maps 2.5.0</h1>
        <h2>Août 2025</h2>
        <p>Merci d'utiliser Strava Enhanced Maps!
        <br /><br />
        <ul>
          <li>Ajout de nouveaux fonds de carte: Swisstopo, Cycle OSM et Cycle OSM Lite.</li>
          <li>Rétablissement des fonds de carte IGN Satellite et IGN Classique qui étaient HS depuis la mise à jour chez IGN.</li>
          <li>Pour ce qui est des fonds carte Thunderforest, il se peut qu'ils ne fonctionnent pas toujours car leur usage est assez limité en version gratuite. Si ils vous intéressent vraiment, contactez-moi pour que l'on en discute.</li>
        </ul>
        <br />
        Si vous souhaitez soutenir les développements de l'extension qui est gratuite (contrairement à mon abonnement qui me permet de vous offrir cette extension 😁), vous pouvez faire un don sur <strong><a href="https://paypal.me/xavierdeneux" target="_blank">https://paypal.me/xavierdeneux</a></strong>
        <br /><br />
        Pour tout soucis ou toute idée, n'hésitez pas à me contacter à l'adresse x.deneux at gmail.com<br /><br />
        Merci et bonnes sorties!
        <br /><br />
        Xavier</p>
      </div>
    `);

    modal.addFooterBtn(
      "Fermer",
      "tingle-btn tingle-btn--pull-right",
      function () {
        modal.close();
      }
    );

    // open modal
    modal.open();
  }

  async init() {
    this.reactInstance = this.findReact(
      document.querySelector(".mapboxgl-map")
    );
    this.checkLocalStorageValues();

    await this.wait(() => {
      this.reactInstance.memoizedProps.mapboxRef(
        (m) => ((this.mapInstance = m), m)
      );
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

    if (!localStorage.getItem(localStorageItemName)) {
      this.showModal();
      localStorage.setItem(localStorageItemName, "true");
    }

    document
      .getElementById("strava-enhanced-maps-title")
      .addEventListener("click", () => {
        this.showModal();
      });
  }
}

let isReady = false;
let waitIsReady = () => {
  setTimeout(function () {
    if (!isReady) {
      if (
        document.querySelector(".mapboxgl-canvas-container").children.length > 1
      ) {
        isReady = true;
        var enhancedMap = new EnhancedMaps();
        enhancedMap.init();
      } else {
        waitIsReady();
      }
    }
  }, 1000);
};
waitIsReady();
