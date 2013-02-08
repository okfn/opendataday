jQuery(function($) {
  var url = 'https://docs.google.com/a/okfn.org/spreadsheet/ccc?key=0AqR8dXc6Ji4JdFNQRExkVjI3Q3RtRVZuU1hXRmhlTVE#gid=0';
  var dataset = new recline.Model.Dataset({
    url: url,
    backend: 'gdocs'
  });
  var map = new recline.View.Map({
    el: $('.map'),
    model: dataset
  });
  map.render();
  dataset.fetch()
    .done(function() {
      dataset.records.each(function(record) {
        if (record.get('latitude')=='' && record.get('place')) {
          var url = 'http://open.mapquestapi.com/search?format=json&q=' + encodeURIComponent(record.get('place'));
          console.log(url);
          $.getJSON(url, function(data) {
            console.log(data);
            record.set({
              latitude: data[0].lat,
              longitude: data[0].lon
            });
          });
        }
      });

      $('.loading').hide();
    })
    ;
});

