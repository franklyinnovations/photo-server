$(function() {
    
    var loadCarousel = function(data) {
        for (var i=0, n=data.length; i<n; i++){
            var image = $('<img>').attr("src", "/images/" + data[i].path + "." + data[i].ext);
            var item = $('<div>').attr("class","item");
            var caption = $('<div>').attr("class","carousel-caption");
            var title = $('<h4>').text(data[i].title);
            var desc = $('<p>').text(data[i].description);
            caption.append(title).append(desc);
            item.append(image).append(caption);
            $('.carousel-inner').append(item);
        }
    };
    
    $.get("/api/photo", function(data, textStatus, jqXHR) {
        loadCarousel(data);
        $('.carousel').carousel();
    });
    
   //  $('.carousel-inner')
});