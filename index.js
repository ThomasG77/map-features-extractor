module.exports.commons = {};
module.exports.leaflet = {};
module.exports.ol3 = {};
module.exports.google = {};

module.exports.commons.exportAsFile = exportAsFile;
module.exports.leaflet.geojsonify = geojsonifyL;
module.exports.ol3.mapGetCenter = mapGetCenterOl3;
module.exports.ol3.reprojectPoint = reprojectPointOl3;
module.exports.ol3.getMapExtent = getMapExtentOl3;
module.exports.ol3.getReprojectedExtent = getReprojectedExtentOl3;
module.exports.google.geojsonify = geojsonifyFromDataG;
module.exports.google.geojsonifyFromMarkers = geojsonifyFromMarkersG;
module.exports.google.geojsonifyFromPolyline = geojsonifyFromPolylineG;
module.exports.google.getBounds = getBoundsG;
module.exports.google.getCenter = getCenterG;

/**
   Commons
**/

/**
    Is a given variable an object?
    Excerpt from Underscore library
 **/
function isObject(obj) {
  'use strict';
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
}

/**
    Extend a given object with all the properties in passed-in object(s).
    Excerpt from Underscore library
 **/
function extend(obj) {
  'use strict';
  if (!isObject(obj)) {
    return obj;
  }
  var source;
  var prop;
  for (var i = 1, length = arguments.length; i < length; i++) {
    source = arguments[i];
    for (prop in source) {
      if (source.hasOwnProperty(prop)) {
        obj[prop] = source[prop];
      }
    }
  }
  return obj;
}

/**
   Check if script tag with the same src already present.
   Do not deal with //, http, https difference
   Use Array.prototype.some from es5 >> IE9+ or you will need a Shim
   https://github.com/es-shims/es5-shim
 **/
function isScriptAlreadyPresent(url) {
  'use strict';
  var scripts = Array.prototype.slice.call(document.scripts);
  return scripts.some(function(el) {
    return el.src && el.src !== undefined && el.src === url;
  });
}

/**
  Append script and use a callback if required to execute immediately a function after
  Credits mainly to https://github.com/bgrins/devtools-snippets/blob/master/snippets/jquerify/jquerify.js
 **/
function appendScript(url, callback) {
  'use strict';
  var s = document.createElement('script');
  s.setAttribute('src', url);
  s.addEventListener('load', function() {
    console.log('Script loaded!');
    if (typeof callback === 'function') {
      callback();
    }
  });
  document.body.appendChild(s);
}

function generateBlob(string, opts) {
  'use strict';
  var options = opts || {};
  if (options.type === undefined) {
    options.type = 'text/plain;charset=utf-8';
  }
  if (options.file === undefined) {
    options.file = 'content.geojson';
  }
  var blob = new Blob([string], {type: options.type});
  console.log(options.file);
  saveAs(blob, options.file);
}

function exportAsFile(array, fileName, extension) {
  'use strict';
  var url = 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.0.0/' +
            'FileSaver.min.js';
  var toExecute = function(arrayOfString, fileName, extension) {
    return function() {
      arrayOfString.forEach(function(el, i) {
        //console.log(el);
        generateBlob(el, {file: fileName + i + '.' + extension});
      });
    };
  };
  var config = toExecute(array, fileName, extension);
  if (!isScriptAlreadyPresent(url)) {
    appendScript(url, config);
  } else {
    config();
  }
}

/**
   Leaflet part
**/
function geojsonifyL(map) {
  'use strict';
  var layers = map._layers;
  var geoJsonLayers = [];
  for (var layer in layers) {
    if (layers[layer]._layers !== undefined) {
      geoJsonLayers.push(layers[layer].toGeoJSON());
    }
  }
  return geoJsonLayers;
}

/**
 OpenLayers 3
 **/

function mapGetCenterOl3(map) {
  'use strict';
  return map.getView().getCenter();
}

function reprojectPointOl3(coordinates, epsgInput, epsgOutput) {
  'use strict';
  return ol.proj.transform(coordinates, epsgInput, epsgOutput);
}

function getMapExtentOl3(map) {
  'use strict';
  return map.getView().calculateExtent(map.getSize());
}
function getReprojectedExtentOl3(map, epsgOutput) {
  'use strict';
  var view = map.getView();
  if (view.getProjection().getCode() === epsgOutput) {
    console.log('Nothing to do, input and output projections are the same!');
    return;
  }
  var transformer = ol.proj.getTransform(view.getProjection().getCode(),
                                         epsgOutput);
  return ol.extent.applyTransform(view.calculateExtent(map.getSize()),
                                  transformer);
}
/*
console.log('Original projection ' + map.getView().getProjection().getCode(), mapGetCenterOl3(map));
var newProjection = 'EPSG:4326';
console.log('Reprojected projection ' + newProjection, reprojectPointOl3(mapGetCenterOl3(map), 'EPSG:3857', newProjection));

console.log('Original extent ' + map.getView().getProjection().getCode(), ' ', getMapExtent(map));

var epsgOutput = 'EPSG:3857';
console.log('Projected extent ' + epsgOutput, ' ', getReprojectedExtentOl3(map, epsgOutput));

exportAsFile(geojsonifyL(map), 'layer_', 'geojson');

isScriptAlreadyPresent('http://your_script_url.tld/your_lib.js');
*/

/**
  Google Maps V3
 **/
function geojsonifyFromDataG(map) {
  'use strict';
  var newData = '';
  map.data.toGeoJson(function(o) {
    newData = o;
  });
  return newData;
}

function createPointFeatureFromMarkerG(lat, lng, opts) {
  'use strict';
  var options = {};
  if (opts !== undefined) {
    options = opts;
  }
  return {'type': 'Feature',
    'geometry': {
      'type': 'Point',
      'coordinates': [lat, lng]
    },
    'properties': options
  };
}

function createPolylineFeatureFromPathG(path, opts) {
  'use strict';
  var options = {};
  if (opts !== undefined) {
    options = opts;
  }
  return {'type': 'Feature',
    'geometry': {
      'type': 'Line',
      'coordinates': path
    },
    'properties': options
  };
}

/**
  markers is an array of google.maps.Marker objects
 **/
function geojsonifyFromMarkersG(markers) {
  'use strict';
  var featureCollection = {
    'type': 'FeatureCollection',
    'features': []
  };
  markers.forEach(function(marker) {
    var feature = createPointFeatureFromMarkerG(marker.getPosition().lat(),
                                           marker.getPosition().lng(),
                                          {'title': marker.getTitle()});
    featureCollection.features.push(feature);
  });
  return featureCollection;
}

/**
  markers is an array of google.maps.Marker objects
 **/
function geojsonifyFromPolylineG(polylines) {
  'use strict';
  var featureCollection = {
    'type': 'FeatureCollection',
    'features': []
  };

  polylines.forEach(function(poly) {
    var path = [];
    poly.getPath().getArray().forEach(function(coord) {
      path.push([coord.lat(), coord.lng()]);
    });
    var feature = createPolylineFeatureFromPathG(path);
    featureCollection.features.push(feature);
  });
  return featureCollection;
}

function getBoundsG(map) {
  'use strict';
  var bounds = map.getBounds();
  return [
    bounds.getNorthEast().lat(),
    bounds.getNorthEast().lng(),
    bounds.getSouthWest().lat(),
    bounds.getSouthWest().lng()
  ];
}

function getCenterG(map) {
  'use strict';
  var center = map.getCenter();
  return [
    center.lat(),
    center.lng()
  ];
}

/*
console.log(getBoundsG(markers[0].getMap()));

console.log(geojsonifyFromMarkersG(markers));
*/
