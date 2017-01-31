// var url = "https://spreadsheets.google.com/feeds/list/1Iqq1OrJFK1-3LCdWNZf3HlofWI_DV7A2V3vI2VNtsLE/4/public/full?alt=json"
var url = "https://spreadsheets.google.com/feeds/list/1cV43fuzwy2q2ZKDWrHVS6XR4O8B01eLevh4PD6nCENE/4/public/full?alt=json"

mapboxgl.accessToken = 'pk.eyJ1Ijoib2tmbiIsImEiOiJjaXlrOW5yczgwMDEzMnlwaWd2ZzF6MDQ3In0.2UJlkR69zbu4-3YRJJgN5w';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [0,0],
  zoom: 1.2,
  scrollZoom: false
});

map.addControl(new mapboxgl.NavigationControl());

mapboxgl.util.getJSON(url, function(err, data) {
  var geojson = {
    type: 'FeatureCollection',
    features: []
  };

  data.feed.entry.forEach(function(d) {
    var lng, lat;

    lat = d['gsx$latitude']['$t'];
    lng = d['gsx$longitude']['$t'];

    geojson.features.push({
      type: 'Feature',
      properties: {
        title: d.title.$t,
        icon: "monument",
        description: 'Program: ' + d['gsx$program']['$t'] + '<br>' + 'URL: ' + d['gsx$url']['$t'] + '<br>' + 'Organizers: ' + d['gsx$organizers']['$t']
      },
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    });
  });

  map.addLayer({
    "id": "points",
    "interactive": true,
    "type": "symbol",
    "source": {
      "type": "geojson",
      "data": geojson
    },
    "layout": {
      "icon-image": "{icon}-15",
      "text-size": 11,
      "text-field": "{title}",
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-offset": [0, 0.6],
      "text-anchor": "top"
    },
    "paint": {
      "text-color": "#fff",
      "text-halo-color": "#000",
      "text-halo-width": 1

    }
  });
  map.on('click', function (e) {
    var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });

    if (!features.length) {
      return;
    }

    var feature = features[0];

    var popup = new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(feature.properties.description)
        .addTo(map);
  });

});
