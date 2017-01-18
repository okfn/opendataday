jQuery(document).ready(function($){

  // add stuck class to nav
  var sticky = new Waypoint.Sticky({
    element: $('.main-nav')[0]
  })

  // smoothscroll
  smoothScroll.init({
    offset: 100
  });

});
