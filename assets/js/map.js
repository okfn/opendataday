var url = 'https://spreadsheets.google.com/feeds/list/1cV43fuzwy2q2ZKDWrHVS6XR4O8B01eLevh4PD6nCENE/1/public/full?alt=json';
mapboxgl.accessToken = 'pk.eyJ1Ijoib2tmbiIsImEiOiJjaXlrOW5yczgwMDEzMnlwaWd2ZzF6MDQ3In0.2UJlkR69zbu4-3YRJJgN5w';

var clusterRadius = 50,
    clusterMaxZoom = 14; // Max zoom to cluster points on

var map = new mapboxgl.Map({
  container: 'map-container',
  style: 'mapbox://styles/mapbox/bright-v9',
  zoom: 1,
  center: [0,0],
  scrollZoom: false
});

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

map.on('load', function() {
  $.getJSON(url).done(function(data) {
    var entry = data.feed.entry || [];
    var geojson = {
      type: 'FeatureCollection',
      features: []
    };

    entry.forEach(function(d) {
      try {
        var lat = Number(d.gsx$latitude.$t)
        var lng = Number(d.gsx$longitude.$t)
        var title = d.title.$t.split(",")[0]
        var event = d.gsx$eventname.$t
        var organisers = d.gsx$organisers.$t
        var isworkingurl = new RegExp('^' + 'http').test(d.gsx$url.$t)
        var url = isworkingurl ? '<a href="' + d.gsx$url.$t + '">' + d.gsx$url.$t + '</a>' : 'TBD'
      } catch (error) {
        console.error(error)
        console.log('Error processing event submitted at "' + d.title.$t + '"')
      }
      if (lng && lat && title && event && organisers) {
        geojson.features.push({
          type: 'Feature',
          properties: {
            title: title,
            icon: "circle",
            description: '<strong>Event:</strong> ' + event + '<br><strong>URL:</strong> ' + url + '<br><strong>Organisers:</strong> ' + organisers
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        });
      }
    });

    $("#event-number").text(entry.length);


    map.addSource("events", {
      "type": "geojson",
      "data": geojson,
      cluster: true,
      clusterRadius: clusterRadius,
      clusterMaxZoom: clusterMaxZoom
    });

    map.addLayer({
      "id": "points",
      "interactive": true,
      "type": "symbol",
      "source": "events",
      "filter": ["!",["has", "point_count"]],
      "layout": {
        "icon-allow-overlap": true,
        "text-allow-overlap": true,
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

    map.addLayer({
      "id": "clusters",
      "type": "circle",
      "source": "events",
      "filter": ["has", "point_count"],
      "paint": {
        "circle-color": [
          "step",
          ["get", "point_count"],
          '#0086FF',     // blue
          10, '#FF4900', // red from count 10 up
          20, '#FFB900'  // yellow from count 20 up
        ],
        "circle-radius": 18
      }
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

    map.on('mousemove', 'points', function(e) {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'points', function(e) {
      map.getCanvas().style.cursor = '';
    });
    map.on('mousemove', 'clusters', function(e) {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', function(e) {
      map.getCanvas().style.cursor = '';
    });

    map.on('click', function (e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ['points', 'clusters'] });
      if (!features.length) {
        return;
      }
      var feature = features[0];

      if (!feature.properties.cluster) {
        var descriptions = features.map(function (f) { return f.properties.description; });
        var popup = new mapboxgl.Popup()
            .setLngLat(features.length == 1 ? features[0].geometry.coordinates : e.lngLat)
            .setHTML(descriptions.join('<br><br>'))
            .addTo(map);
      } else {
        // We need to expand a cluster
        var oldZoom = map.getZoom();

        map.getSource('events').getClusterExpansionZoom(feature.properties.cluster_id, function (error, expansionZoom) {
          if (error) {
            throw error;
          }

          if (expansionZoom <= clusterMaxZoom) {
            map.flyTo({center: feature.geometry.coordinates, zoom: expansionZoom });
          } else {
            // If we ran out of clustering levels, zoom to fit the individual points
            map.getSource('events').getClusterLeaves(feature.properties.cluster_id, 9999, 0, function(error, features) {
              if (error) {
                throw error;
              }

              var bounds = pointsToBounds(features);
              var oldCenter = map.getCenter();

              // Perform a test fit to calculate prospective center and zoom
              map.fitBounds(bounds, {
                animate: false,
                padding: {
                  top:    $('#map-container').height()*0.1 + $('.main-nav').height(),
                  bottom: $('#map-container').height()*0.2,
                  left:   $('#map-container').width()*0.2,
                  right:  $('#map-container').width()*0.2
                }
              });
              var newCenter = map.getCenter();
              var newZoom = map.getZoom();

              // Make sure we stay past the clustering levels
              newZoom = Math.max(newZoom, clusterMaxZoom + 1);

              // Animate from old view to new view
              map.jumpTo({center: oldCenter, zoom: oldZoom});
              map.flyTo({center: newCenter, zoom: newZoom});
            });
          }
        });
      }
    });
  });

});

function pointsToBounds(points) {
  return points.reduce(
    function(bounds, point) {
      return bounds.extend(point.geometry.coordinates);
    },
    new mapboxgl.LngLatBounds(
      points[0].geometry.coordinates,
      points[0].geometry.coordinates
    )
  );
}
