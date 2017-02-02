var url = "https://spreadsheets.google.com/feeds/list/1cV43fuzwy2q2ZKDWrHVS6XR4O8B01eLevh4PD6nCENE/4/public/full?alt=json"
mapboxgl.accessToken = 'pk.eyJ1Ijoib2tmbiIsImEiOiJjaXlrOW5yczgwMDEzMnlwaWd2ZzF6MDQ3In0.2UJlkR69zbu4-3YRJJgN5w';

var map = new mapboxgl.Map({
  container: 'map-container',
  style: 'mapbox://styles/mapbox/streets-v9',
  center: [0,0],
  zoom: 1.3,
  minZoom: 1.3,
  scrollZoom: false
});

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

map.on('load', function() {
  mapboxgl.util.getJSON(url, function(err, data) {
    var geojson = {
      type: 'FeatureCollection',
      features: []
    };

    data.feed.entry.forEach(function(d) {
      var lng, lat;
      lat = d['gsx$latitude']['$t'];
      lng = d['gsx$longitude']['$t'];
      workingurl = new RegExp('^' + 'http').test(d['gsx$url']['$t']);
      url = workingurl ? '<a href="' + d['gsx$url']['$t'] + '">' + d['gsx$url']['$t'] + '</a>' : 'TBD'
      geojson.features.push({
        type: 'Feature',
        properties: {
          title: d.title.$t,
          icon: "triangle-stroked",
          description: '<strong>Program:</strong> ' + d['gsx$program']['$t'] + '<br><strong>URL:</strong> ' + url + '<br><strong>Organizers:</strong> ' + d['gsx$organizers']['$t']
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
        "icon-color": "#fff",
        "text-color": "#fff",
        "text-halo-color": "#000",
        "text-halo-width": 1
      }
    });
  });
});

map.on('click', function (e) {
  var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
  if (!features.length) {
    return;
  } else {
    var feature = features[0];
    var popup = new mapboxgl.Popup()
        .setLngLat(feature.geometry.coordinates)
        .setHTML(feature.properties.description)
        .addTo(map);
  }
});
