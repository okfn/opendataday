jQuery(document).ready(function($){

  // add stuck class to nav
  var sticky = new Waypoint.Sticky({
    element: $('.main-nav')[0]
  })

  // run test on initial page load
  checkSize();
  // run test on resize of the window
  $(window).resize(checkSize);

  function checkSize(){

    // smoothscroll
    if ($(".menu").css("display") == "none" ){
      $('.main-nav a, .banner a').smoothScroll({
        offset: -20,
        preventDefault: false
      });
    }
    else {
      $('.main-nav a, .banner a').smoothScroll({
        offset: -90,
        preventDefault: false
      });
    }

  }


  //external links
  $('a[rel*=external]').click( function() {
    window.open(this.href);
    return false;
  });

});
