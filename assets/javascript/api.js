
var categories = "http://localhost:8888/west/wp-json/wp/v2/categories?per_page=50";
var bikeToursHttp = "http://localhost:8888/west/wp-json/wp/v2/bike_tours?per_page=50";
var customTest = "http://localhost:8888/west/wp-json/wp/v2/custom_api";
var media = "http://localhost:8888/west/wp-json/wp/v2/media?per_page=50";
var category = [];
$.getJSON(categories, function(result){
category = result;
// console.log(category);
});

var mediaObj =[];
$.getJSON(media, function(result){
mediaObj = result;
});
// JSONgetter is a way for multiple custom post calls from the wp rest
var JSONgetter = function(http, resultname){
  $.getJSON(http, function(resultname){



    $.each(resultname, function(i, field){
      //  console.log(field);
      var activety = field.acf.activety.toLowerCase();
      var season = field.acf.season.toLowerCase();
      var cardIcon = activety;
      if (cardIcon == "animal life") {
        cardIcon = "animal-life";
      }
      var iconClass = activety;
    

      var bigCard =
        "<div id='' class='card-large' role='article'> \
           <a href='"+field.link+"'> \
             <div class='image' style='background-image:url("+field.acf.img.sizes.large+");'> \
                <img src='' alt=''/> \
             </div> \
             <div class='icon' style='background-image:url(/west/wp-content/themes/foundationPressGit/assets/images/icons/catIcons/"+cardIcon+".svg);' > \
             </div> \
             <p class='cat-string'> "+activety+" / "+season+" </p> \
             <header class='card-content article-header'> \
               <h2 class='entry-title single-title' itemprop='headline'>"+field.title.rendered+"</h2> \
                 "+field.excerpt.rendered+" \
             </header> \
             <button type='button' class='readMoreBtn'>Read more</button> \
          </a> \
        </div>";
        if (field.acf.is_popular) {
            $("#big-cards").append(bigCard);
        }

      var card =
       "<div class='small-12 medium-6 large-4 xlarge-3'>\
          <div id='' class='card' role='article' >\
            <a href='"+field.link+"'>\
              <div class='image' style='background-image:url("+field.acf.img.sizes.medium+");'>\
               <img src='' alt='' />\
             </div>\
              <div class='icon icon-"+iconClass+"' style='background-image:url(/west/wp-content/themes/foundationPressGit/assets/images/icons/catIcons/"+cardIcon+".svg);' ></div> \
              <p class='cat-string'> "+activety+" / "+season+" </p>\
              <header class='card-content article-header'>\
                <h2 class='entry-title single-title' itemprop='headline'>"+field.title.rendered+"</h2>\
                 "+field.excerpt.rendered+" \
              </header>\
              <button type='button' class='bookBtn'>Book</button>\
            </a>\
          </div>\
        </div>";


     $("#cards").append(card);

     var option = "<option value='"+field.title.rendered+" "+field.acf.activety+"'><p>"+field.title.rendered+"</p>   <p>"+field.acf.activety+"</p></option>";

       $('#activities-search').append(option);


     });

  });
};
// setTimeout("JSONgetter(bikeToursHttp, 'bikeObject')",200);
JSONgetter(bikeToursHttp, 'bikeObject');


// JSONgetter(customTest, 'test');
