(function () {
  let scriptsToLoad = 1;
  let scriptLoaded = 0;

  scriptIsLoaded = () => {
    scriptLoaded++;
    if (scriptLoaded === scriptsToLoad) {
      var s = document.createElement("script");
      s.src = chrome.runtime.getURL("enhancedMaps.js");
      s.type = "text/javascript";
      document.body.appendChild(s);
    }
  };

  if (
    document.location.href.startsWith("https://www.strava.com/maps/create/")
  ) {
    let tingle = document.createElement("script");
    tingle.src = chrome.runtime.getURL("lib/tingle.min.js");
    tingle.type = "text/javascript";
    tingle.onload = () => scriptIsLoaded();
    document.body.appendChild(tingle);

    var tingleStyle = document.createElement("link");
    tingleStyle.rel = "stylesheet";
    tingleStyle.type = "text/css";
    tingleStyle.media = "screen";
    tingleStyle.href = chrome.runtime.getURL("lib/tingle.min.css");
    document.body.appendChild(tingleStyle);

    var styles = document.createElement("link");
    styles.rel = "stylesheet";
    styles.type = "text/css";
    styles.media = "screen";
    styles.href = chrome.runtime.getURL("style.css");
    document.body.appendChild(styles);
  }
})();
