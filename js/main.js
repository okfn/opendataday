jQuery(document).ready(function($){

  // run test on initial page load
  checkSize();
  // run test on resize of the window
  $(window).resize(checkSize);

  function checkSize(){
    // smoothscroll
    $('.main-nav a, .banner a').smoothScroll({
      offset: -90,
      preventDefault: false
    });
  }
});
