var $img = $('<img/>').attr({
  'id': 'cursor',
  'src': 'skin1.gif'
});

$(document).on('touchmove', function (e) {
  
  
  var touch1 = e.originalEvent.touches["0"];
  var touch2 = e.originalEvent.touches["1"];
  
  $img.css({
    top: (touch1.clientY+touch2.clientY)/2  - 25,
    left:  (touch1.clientX+touch2.clientX)/2 - 25,
    display: 'block'
  });
  
});

$img.appendTo('body');