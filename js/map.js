var url = 'https://raw.githubusercontent.com/okfn/opendataday/master/databags/events-2025.json';

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
      var features = map.queryRenderedFeatures(e.point, { layers: ['points'] });
      if (!features.length) {
        return;
      }
      var feature = features[0];
      var descriptions = features.map(function (f) { return f.properties.description; });
      // create a leaflet popup whit descriptions as HTML

      var popup = L.popup()
        .setLatLng([e.lngLat.lat, e.lngLat.lng]).setContent(descriptions.join('<br><br>')).openOn(map);
    });
  });

});

map.setView([0, 0], 2);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

  var date = event.event_date ? new Date(event.event_date).toDateString() : '';
  if (date) {
    htmlStr += '<br><strong>Date:</strong> ' + date;
  }

  if (isWorkingUrl(event.url)) {
    htmlStr += '<br><strong>URL:</strong> ' + getLink(event.url);
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

