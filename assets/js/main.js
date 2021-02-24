jQuery(document).ready(function($){

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
});
