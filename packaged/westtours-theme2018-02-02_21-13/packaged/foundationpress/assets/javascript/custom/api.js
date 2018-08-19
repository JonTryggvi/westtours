
var rootUrl = window.location.origin;
var categories = rootUrl+"/wp-json/wp/v2/categories?per_page=50";
var bikeToursHttp = rootUrl+"/wp-json/wp/v2/tour_post_type?per_page=50";
var customTest = rootUrl+"/wp-json/wp/v2/custom_api";
var media = rootUrl+"/wp-json/wp/v2/media?per_page=50";
var category = [];
console.log(rootUrl);
function shuffle (array) {
  var i = 0;
  var j = 0;
  var temp = null;

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1));
    temp = array[i];
    array[i] = array[j];
    array[j] = temp;
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
       $.each(popular, function(i, popular){
         var activety = popular.acf.activety.toLowerCase();
         var season = popular.acf.season.toLowerCase();
         var cardIcon = activety;
         if (cardIcon == "animal life") {
           cardIcon = "animal-life";
         }
        //  console.log('pop');
         var iconClass = activety;

         var StrippedStringBig = popular.excerpt.rendered.replace(/(<([^>]+)>)/ig,"");
         var shorterTextBig = StrippedStringBig.substr(0, 112) + "...";

         var bigCard = "<div id='' class='card-large' role='article'><a href='"+popular.link+"'><div class='image' style='background-image:url("+popular.acf.img.sizes.large+");'><img src='' alt=''/></div><div class='icon' style='background-image:url("+rootUrl+"/wp-content/themes/foundationpress/assets/images/icons/catIcons/"+cardIcon+".svg);' ></div><p class='cat-string'> "+activety+" / "+season+" </p><header class='card-content article-header'><h2 class='entry-title single-title' itemprop='headline'>"+popular.title.rendered+"</h2><p>"+shorterTextBig+"</p></header><button type='button' class='readMoreBtn'>Read more</button></a></div>";

           if (popular.acf.is_popular) {
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

         var smallerH2;
        //  if (card.title.rendered.length > 21) {
        //     smallerH2 = 'smallerH2';
        //  }else{
        //    smallerH2 = '';
        //  }
         function getWords(parameter) {
              return parameter.split(/\s+/).slice(0,3).join(" ")+"..";
          }
         var cardHeading = card.title.rendered;
         getWords(cardHeading);

         var StrippedString = card.excerpt.rendered.replace(/(<([^>]+)>)/ig,"");
         var shorterText = StrippedString.substr(0, 52) + "...";
         var smallCard = "<div class='small-12 medium-6 large-4 xlarge-3 card-container hidden'><div  class='card' role='article' ><a href='"+card.link+"'><div class='image' style='background-image:url("+card.acf.img.sizes.medium+");'><img src='' alt='' /></div><div class='icon icon-"+iconClass+"' style='background-image:url("+rootUrl+"/wp-content/themes/foundationpress/assets/images/icons/catIcons/"+cardIcon+".svg);' ></div><p class='cat-string'> "+activety+" / "+season+" </p><header class='card-content article-header'><h2 class='entry-title single-title "+smallerH2+"' itemprop='headline'>"+getWords(cardHeading)+"</h2>"+card.excerpt.rendered+"</header><button type='button' class='bookBtn'>Book</button></a></div></div>";


        $("#cards").append(smallCard);


       });
  });
};
// setTimeout("JSONgetter(bikeToursHttp, 'bikeObject')",200);
JSONgetter(bikeToursHttp, 'bikeObject');
function loadMore(){
        $("#cards .hidden").slice(0,4).removeClass("hidden");
    }
setTimeout(function() { loadMore(); }, 1500);
$(".show-more").on("click",loadMore);

// JSONgetter(customTest, 'test');
