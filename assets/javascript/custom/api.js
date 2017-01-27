
var categories = "http://localhost:8888/west/wp-json/wp/v2/categories?per_page=50";
var bikeToursHttp = "http://localhost:8888/west/wp-json/wp/v2/bike_tours?per_page=50";
var customTest = "http://localhost:8888/west/wp-json/wp/v2/custom_api";
var media = "http://localhost:8888/west/wp-json/wp/v2/media?per_page=50";
var category = [];
function shuffle (array) {
  var i = 0
    , j = 0
    , temp = null

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}
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
    var popular = [];
    var smallCards = [];
    $.each(resultname, function(i, field){
      if (field.acf.is_popular) {
        popular.push(field);
      }
      smallCards.push(field);
      //  console.log(field);

     var option = "<option value='"+field.title.rendered+" "+field.acf.activety+"'><p>"+field.title.rendered+"</p>   <p>"+field.acf.activety+"</p></option>";

     $('#activities-search').append(option);

     });

     shuffle(popular);
       $.each(popular, function(i, pop){
         var activety = pop.acf.activety.toLowerCase();
         var season = pop.acf.season.toLowerCase();
         var cardIcon = activety;
         if (cardIcon == "animal life") {
           cardIcon = "animal-life";
         }
         console.log('pop');
         var iconClass = activety;
         var bigCard =
           "<div id='' class='card-large' role='article'> \
              <a href='"+pop.link+"'> \
                <div class='image' style='background-image:url("+pop.acf.img.sizes.large+");'> \
                   <img src='' alt=''/> \
                </div> \
                <div class='icon' style='background-image:url(/west/wp-content/themes/foundationPressGit/assets/images/icons/catIcons/"+cardIcon+".svg);' > \
                </div> \
                <p class='cat-string'> "+activety+" / "+season+" </p> \
                <header class='card-content article-header'> \
                  <h2 class='entry-title single-title' itemprop='headline'>"+pop.title.rendered+"</h2> \
                    "+pop.excerpt.rendered+" \
                </header> \
                <button type='button' class='readMoreBtn'>Read more</button> \
             </a> \
           </div>";
           if (pop.acf.is_popular) {
               $("#big-cards").append(bigCard);
           }

              return i < 1;
       });
       shuffle(smallCards);
       $.each(smallCards, function(i, card){
         var activety = card.acf.activety.toLowerCase();
         var season = card.acf.season.toLowerCase();
         var cardIcon = activety;
         if (cardIcon == "animal life") {
           cardIcon = "animal-life";
         }
         var iconClass = activety;
         var card =
          "<div class='small-12 medium-6 large-4 xlarge-3'>\
             <div id='' class='card' role='article' >\
               <a href='"+card.link+"'>\
                 <div class='image' style='background-image:url("+card.acf.img.sizes.medium+");'>\
                  <img src='' alt='' />\
                </div>\
                 <div class='icon icon-"+iconClass+"' style='background-image:url(/west/wp-content/themes/foundationPressGit/assets/images/icons/catIcons/"+cardIcon+".svg);' ></div> \
                 <p class='cat-string'> "+activety+" / "+season+" </p>\
                 <header class='card-content article-header'>\
                   <h2 class='entry-title single-title' itemprop='headline'>"+card.title.rendered+"</h2>\
                    "+card.excerpt.rendered+" \
                 </header>\
                 <button type='button' class='bookBtn'>Book</button>\
               </a>\
             </div>\
           </div>";


        $("#cards").append(card);


       });
  });
};
// setTimeout("JSONgetter(bikeToursHttp, 'bikeObject')",200);
JSONgetter(bikeToursHttp, 'bikeObject');


// JSONgetter(customTest, 'test');
