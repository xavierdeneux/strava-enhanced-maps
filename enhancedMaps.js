const release = {
  version: "2.6.0",
  date: "29 juin 2026",
  changes: [
    "Rétablissement de l'extension qui était HS depuis une mise à jour chez Strava.",
    "Suppression des fonds de carte Thunderforest (compte suspendu)",
    "Ajout de nouveaux fonds de carte IGN (IGN Scan 50 (1950), IGN Randonnée hivernale) et OpenTopoMap",
  ],
};

const localStorageItemName = "popup-strava-enhanced-maps-" + release.version;

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
        tileUrl:
          "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image%2Fjpeg&TILEMATRIXSET=PM_0_19&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      },
      {
        id: "ign-classic",
        name: "IGN Classique",
        tileUrl:
          "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image%2Fpng&TILEMATRIXSET=PM_0_19&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      },
      {
        id: "openstreetmap",
        name: "OpenStreetMap",
        tileUrl: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
      },
      {
        id: "opentopomap",
        name: "OpenTopoMap",
        tileUrl: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
      },
      {
        id: "ign-scan50",
        name: "IGN Scan 50 (1950)",
        tileUrl:
          "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950&STYLE=normal&FORMAT=image%2Fjpeg&TILEMATRIXSET=PM_3_15&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        opts: { minZoom: 3, maxZoom: 15 },
      },
      {
        id: "ign-rando",
        name: "IGN Randonnée hivernale (overlay)",
        tileUrl:
          "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=TRACES.RANDO.HIVERNALE&STYLE=normal&FORMAT=image%2Fpng&TILEMATRIXSET=PM_6_16&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        opts: { minZoom: 6, maxZoom: 16, sparse: true },
      },
      {
        id: "waymarked-cycling",
        name: "Waymarked Cycling (overlay)",
        tileUrl: "https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png",
      },
      {
        id: "waymarked-hiking",
        name: "Waymarked Hiking (overlay)",
        tileUrl: "https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png",
      },
      {
        id: "cycleosm",
        name: "Cycle OSM",
        tileUrl:
          "https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
      },
      {
        id: "cycleosm-lite",
        name: "Cycle OSM Lite",
        tileUrl:
          "https://a.tile-cyclosm.openstreetmap.fr/cyclosm-lite/{z}/{x}/{y}.png",
      },
      {
        id: "swiss-topo",
        name: "Swisstopo",
        tileUrl:
          "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
      },
    ]);

    _defineProperty(this, "reactInstance", void 0);

    _defineProperty(this, "mapInstance", void 0);

    _defineProperty(this, "opacity", +localStorage.getItem("opacity"));

    _defineProperty(
      this,
      "currentStravaFirstMap",
      localStorage.getItem("currentStravaFirstMap"),
    );

    _defineProperty(
      this,
      "currentStravaSecondMap",
      localStorage.getItem("currentStravaSecondMap"),
    );

    _defineProperty(
      this,
      "useExtension",
      localStorage.getItem("useExtension") === "true",
    );

    _defineProperty(this, "originalLayers", []);
  }

  findReact(dom) {
    const key = Object.keys(dom).find((key) => key.startsWith("__reactFiber$"));
    return dom[key].return;
  }

  findMapInstance(fiber) {
    // Strava >= 2025: l'instance Mapbox est dans memoizedState (index 1)
    let state = fiber.memoizedState;
    let i = 0;
    while (state) {
      const val = state.memoizedState;
      if (
        val &&
        typeof val.getStyle === "function" &&
        typeof val.addLayer === "function"
      ) {
        return val;
      }
      state = state.next;
      i++;
      if (i > 20) break;
    }
    return null;
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
      // Les couches sparse (ex: TRACES.RANDO.HIVERNALE) retournent 404
      // sur les tuiles vides. On tolère ces erreurs silencieusement.
      ...(l.opts && l.opts.sparse ? { scheme: "xyz" } : {}),
    };
    return s;
  }

  layerFromLeaflet(id, firstOrSecondMap) {
    const l = this.allMaps.find((map) => map.id == id);
    const map = this.mapInstance;
    if (!map.getSource(id)) map.addSource(id, this.sourceFromLeaflet(l));
    if (map.getLayer(firstOrSecondMap)) map.removeLayer(firstOrSecondMap);
    // Insérer avant "background" s'il existe, sinon en dernier
    const layers = map.getStyle().layers;
    const before = layers.find((l) => l.id === "background")?.id ?? undefined;
    map.addLayer(
      {
        id: firstOrSecondMap,
        type: "raster",
        source: id,
      },
      before,
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
    if (!id || !this.allMaps.find((map) => map.id == id)) return;
    localStorage.currentStravaFirstMap = id;
    this.resetLayers();
    this.layerFromLeaflet(id, "primary");
  }

  setSecondMap(id) {
    if (!id || !this.allMaps.find((map) => map.id == id)) return;
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
    if (this.getItem("#secondMapSelect").value) {
      if (typeof opacity === "number") {
        this.opacity = opacity / 100;
        localStorage.setItem("opacity", opacity);
        setTimeout(() => {
          this.mapInstance.setPaintProperty(
            "secondary",
            "raster-opacity",
            this.opacity,
          );
        });
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
      "[class^='RoutePreferenceSidebar_section']",
    ).className;
    let node = document.createElement("div");
    node.className = containerClassName;
    node.id = "strava-enhanced-maps";

    const h4className = document.querySelector(
      "[class^='RoutePreferenceSidebar_section'] h4",
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
        localStorage.setItem("useExtension", true);
        this.useExtension = true;
        this.init(this);
      }.bind(this),
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
      this.currentStravaFirstMap = "ign-topo";
    }

    if (!this.opacity || this.opacity < 0 || this.opacity > 100) {
      this.opacity = 50;
    }

    // N'activer l'extension par défaut que si la clé n'a jamais été définie.
    // Si l'user a explicitement choisi de ne pas l'utiliser, on respecte son choix.
    if (localStorage.getItem("useExtension") === null) {
      localStorage.setItem("useExtension", true);
      this.useExtension = true;
    }
  }

  backToOriginalMap() {
    ["primary", "secondary"].forEach((id) => {
      if (this.mapInstance.getLayer(id)) this.mapInstance.removeLayer(id);
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
        <h1>Strava Enhanced Maps ${release.version}</h1>
        <h2>${release.date}</h2>
        <p>Merci d'utiliser Strava Enhanced Maps!
        <br /><br />
        <ul>
          ${release.changes.map((change) => `<li>${change}</li>`).join("")}
        </ul>
        <br />
        Vous avez été nombreux à me signaler que l'extension ne fonctionnait plus depuis une mise à jour de Strava. 
        <br />Étant le seul mainteneur et le faisant à titre bénévole, il ne m'est pas toujours facile de dégager du temps pour maintenir l'extension. Mais j'ai enfin pu corriger le problème et vous proposer une nouvelle version.
        Si vous souhaitez soutenir les développements de l'extension qui est gratuite, vous pouvez faire un don sur <strong><a href="https://paypal.me/xavierdeneux" target="_blank">https://paypal.me/xavierdeneux</a></strong>
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
      },
    );

    // open modal
    modal.open();
  }

  async init() {
    this.reactInstance = this.findReact(
      document.querySelector(".mapboxgl-map"),
    );
    this.checkLocalStorageValues();

    await this.wait(() => {
      this.mapInstance = this.findMapInstance(this.reactInstance);
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

const waitIsReady = () => {
  setTimeout(function () {
    if (!isReady) {
      if (document.querySelector(".mapboxgl-map")?.children.length >= 1) {
        isReady = true;
        var enhancedMap = new EnhancedMaps();
        enhancedMap.init();
      } else {
        waitIsReady();
      }
    }
  }, 1000);
};

// Gère la navigation SPA : si l'utilisateur quitte puis revient sur /maps/create
// sans rechargement de page, on réinitialise l'extension
const observer = new MutationObserver(() => {
  const onCreatePage = document.location.href.startsWith(
    "https://www.strava.com/maps/create",
  );
  if (onCreatePage && !document.getElementById("strava-enhanced-maps")) {
    isReady = false;
    waitIsReady();
  }
});
observer.observe(document.querySelector("title") || document.head, {
  subtree: true,
  childList: true,
  characterData: true,
});

waitIsReady();
