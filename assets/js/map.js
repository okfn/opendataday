var url = 'https://raw.githubusercontent.com/okfn/opendataday/master/databags/events-2024.json';

var map = L.map('map');
// on load map event

map.on('load', function () {
  $.getJSON(url).done(function (data) {
    var events = data.events || [];
    var geojson = {
      type: 'FeatureCollection',
      features: []
    };

    events.forEach(function (event) {
      var lat, lng, title;
      try {
        lat = Number(event.latitude);
        lng = Number(event.longitude);
        title = truncate(event.event_name, 20);
      } catch (error) {
        console.error(error);
        console.log('Error processing event "' + event.event_name + '"');
      }

      if (lng && lat && title) {

        // add it to the map
        let marker = L.marker([lat, lng]).addTo(map);
        // set up a description for on mouse over
        marker.bindPopup(getDescription(event));

        geojson.features.push({
          type: 'Feature',
          properties: {
            title: title,
            icon: "marker",
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

    map.on('click', function (e) {
      var features = map.queryRenderedFeatures(e.point, { layers: ['points', 'clusters'] });
      if (!features.length) {
        return;
      }
      var feature = features[0];

      if (!feature.properties.cluster) {
        var descriptions = features.map(function (f) { return f.properties.description; });
        // create a leaflet popup whit descriptions as HTML

        var popup = L.popup()
          .setLatLng([e.lngLat.lat, e.lngLat.lng]).setContent(descriptions.join('<br><br>')).openOn(map);
      } else {
        // We need to expand a cluster
        var oldZoom = map.getZoom();

        map.getSource('events').getClusterExpansionZoom(feature.properties.cluster_id, function (error, expansionZoom) {
          if (error) {
            throw error;
          }

          if (expansionZoom <= clusterMaxZoom) {
            map.flyTo({ center: feature.geometry.coordinates, zoom: expansionZoom });
          } else {
            // If we ran out of clustering levels, zoom to fit the individual points
            map.getSource('events').getClusterLeaves(feature.properties.cluster_id, 9999, 0, function (error, features) {
              if (error) {
                throw error;
              }

              var bounds = pointsToBounds(features);
              var oldCenter = map.getCenter();

              // Perform a test fit to calculate prospective center and zoom
              map.fitBounds(bounds, {
                animate: false,
                padding: {
                  top: $('#map-container').height() * 0.1 + $('.main-nav').height(),
                  bottom: $('#map-container').height() * 0.2,
                  left: $('#map-container').width() * 0.2,
                  right: $('#map-container').width() * 0.2
                }
              });
              var newCenter = map.getCenter();
              var newZoom = map.getZoom();

              // Make sure we stay past the clustering levels
              newZoom = Math.max(newZoom, clusterMaxZoom + 1);

              // Animate from old view to new view
              map.jumpTo({ center: oldCenter, zoom: oldZoom });
              map.flyTo({ center: newCenter, zoom: newZoom });
            });
          }
        });
      }
    });
  });

});

map.setView([0, 0], 4);

var attr = '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>' +
  '&copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> ' +
  '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> ' +
  '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'

  L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}@2x.jpg', {
    attribution: attr
}).addTo(map);

function truncate(str, n) {
  return (str.length > n) ? str.substr(0, n - 1) + '…' : str;
}

function isWorkingUrl(url) {
  return new RegExp('^' + 'http').test(url);
}

function getLink(url) {
  return '<a href="' + url + '" target="_blank">' + url + '</a>';
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
    if (event.country) {
      htmlStr += ', ' + event.country;
    }
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

// Add control to map
L.control.scale().addTo(map);
L.control.zoom({ position: 'topright' }).addTo(map);

