var url = "https://spreadsheets.google.com/feeds/list/1cV43fuzwy2q2ZKDWrHVS6XR4O8B01eLevh4PD6nCENE/4/public/full?alt=json";
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
      var lat = d.gsx$latitude.$t,
          lng = d.gsx$longitude.$t,
          title = d.title.$t.split(",")[0],
          program = d.gsx$program.$t,
          organizers = d.gsx$organizers.$t,
          isworkingurl = new RegExp('^' + 'http').test(d.gsx$url.$t);
      var url = isworkingurl ? '<a href="' + d.gsx$url.$t + '">' + d.gsx$url.$t + '</a>' : 'TBD';

      if (lng && lat && title && organizers) {
        geojson.features.push({
          type: 'Feature',
          properties: {
            title: title,
            icon: "triangle",
            description: '<strong>Program:</strong> ' + program + '<br><strong>URL:</strong> ' + url + '<br><strong>Organizers:</strong> ' + organizers
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        });
      }
    });

    $("#event-number").text(data.feed.entry.length);

    map.addSource("events", {
      "type": "geojson",
      "data": geojson,
      cluster: true,
      clusterMaxZoom: 14 // Max zoom to cluster points on
    });

    map.addLayer({
      "id": "points",
      "interactive": true,
      "type": "symbol",
      "source": "events",
      "filter": ["!has", "point_count"],
      "layout": {
        "icon-image": "{icon}-15",
        "text-size": 12,
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

    var layers = [
      [4, '#FF4900'], //red
      [2, '#0086FF'], //blue
      [0, '#FFB900'] //yellow
    ];

    layers.forEach(function (layer, i) {
      map.addLayer({
        "id": "cluster-" + i,
        "type": "circle",
        "source": "events",
        "paint": {
          "circle-color": layer[1],
          "circle-radius": 18
        },
        "filter": i === 0 ?
          [">=", "point_count", layer[0]] :
          ["all",
           [">=", "point_count", layer[0]],
           ["<", "point_count", layers[i - 1][0]]]
      });
    });

    map.addLayer({
      "id": "cluster-count",
      "type": "symbol",
      "source": "events",
      "layout": {
        "icon-allow-overlap": true,
        "text-allow-overlap": true,
        "text-field": "{point_count}",
        "text-font": [
          "DIN Offc Pro Medium",
          "Arial Unicode MS Bold"
        ],
        "text-size": 14
      },
      "paint": {
        "text-color": "#fff"
      }
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
  });
});
