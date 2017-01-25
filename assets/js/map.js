jQuery(function($) {
  var url = 'https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=1gcNAa7BAZjbe8NWeldqjVHfgglE2FPHRytsE_16bcMM';
  var dataset = new recline.Model.Dataset({
    url: url,
    backend: 'gdocs'
  });
  var map = new recline.View.Map({
    el: $('.map'),
    model: dataset,
    state: { cluster: false }
  });
  map.render();
  dataset.fetch()
    .done(function() {
      var recordCount = dataset.recordCount;
      $('.js-num-events').text(recordCount);
      dataset.query({size: recordCount})
        .done(function() {
          dataset.records.each(function(record) {
            //geocode place name if the latitude and longitude fields are not filled in
            //TODO cache result?
            if (record.get('latitude')=='' && record.get('place')) {
              var geocodeurl = 'http://open.mapquestapi.com/nominatim/v1/search?format=json&q=' + encodeURIComponent(record.get('place'));
              $.getJSON(geocodeurl, function(data) {
                record.set({
                  latitude: data[0].lat,
                  longitude: data[0].lon
                });
              });
            }

            // var eventurl = record.get('url');
            // TODO sanity check on URL?
            // linkify urls
            // record.set({url: "<a href=\"" + eventurl + "\">" + eventurl + "</a>"});
          });
        });
      $('.loading').hide();
    })
    ;
});
