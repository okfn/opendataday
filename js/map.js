var url = 'https://raw.githubusercontent.com/okfn/opendataday/master/databags/events-2021.json';
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

function truncate(str, n){
  return (str.length > n) ? str.substr(0, n-1) + '…' : str;
}

function isWorkingUrl(url) {
  return new RegExp('^' + 'http').test(url);
}

function getLink(url) {
  return '<a href="' + url + '">' + url + '</a>';
}

function getDescription(event) {
  var htmlStr = '<strong>Event:</strong> ' + event.event_name;

  if (isWorkingUrl(event.url)) {
    htmlStr += '<br><strong>URL:</strong> ' + getLink(event.url);
  }

  var date = event.event_date ? new Date(event.event_date).toDateString() : '';
  if (date) {
    htmlStr += '<br><strong>Date:</strong> ' + date;
  }

  if (event.event_time) {
    htmlStr += '<br><strong>Time:</strong> ' + event.event_time;
    if (event.timezone) {
      htmlStr += ' (' + event.timezone + ')';
    }
  }

  if (event.online) {

    htmlStr += '<br><strong>Location:</strong> Online';
    if (event.world_region_text) {
      htmlStr += ' (' + event.world_region_text + ')';
    }

    if (isWorkingUrl(event.online_event_url)) {
      htmlStr += '<br><strong>Online Event:</strong> ' + getLink(event.online_event_url);
    }

  } else {
    if (event.place) {
      htmlStr += '<br><strong>Location:</strong> ' + event.place;
      if (event.country) {
        htmlStr += ', ' + event.country;
      }
      if (event.world_region_text) {
        htmlStr += ' (' + event.world_region_text + ')';
      }
    }
  }

  return htmlStr;
}

map.addControl(new mapboxgl.NavigationControl(), 'top-left');

map.on('load', function() {
  $.getJSON(url).done(function(data) {
    var events = data.events || [];
    var geojson = {
      type: 'FeatureCollection',
      features: []
    };

    events.forEach(function(event) {
      try {
        var lat = Number(event.latitude)
        var lng = Number(event.longitude)
        var title = truncate(event.event_name, 20)
      } catch (error) {
        console.error(error)
        console.log('Error processing event "' + event.event_name + '"')
      }

      if (lng && lat && title) {
        geojson.features.push({
          type: 'Feature',
          properties: {
            title: title,
            icon: "marker",  // https://labs.mapbox.com/maki-icons/
            description: getDescription(event)
          },
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        });
      }
    });

    $("#event-number").text(events.length);


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
        "text-size": 15,
        "text-field": "{title}",
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 0.6],
        "text-anchor": "top"
      },
      "paint": {
        "text-color": "#333"
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
