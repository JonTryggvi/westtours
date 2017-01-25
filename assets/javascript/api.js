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
// JSONgetter is a way for multiple custom post calls from the wp rest API
var JSONgetter = function(http, resultname){
  $.getJSON(http, function(resultname){

    $( function() {
        var cache = {};
        $( "#project" ).autocomplete({
          minLength: 2,
          source: function( request, response ) {
            var term = request.term;
            if ( term in cache ) {
              response( cache[ term ] );
              return;
            }

            $.getJSON( bikeToursHttp, request, function( data, status, xhr ) {
              cache[ term ] = data[0].title.rendered;
              response( data );
              console.log(data);
            });
          }
        });
      } );
    // $( function() {
    // var projects = resultname;
    //
    //
    // $( "#project" ).autocomplete({
    // minLength: 0,
    // source: projects,
    // focus: function( event, ui ) {
    //   $( "#project" ).val( ui.item.acf.activety  );
    //   return false;
    // },
    // select: function( event, ui ) {
    //   $( "#project" ).val( ui.item.rendered );
    //   $( "#project-id" ).val(  ui.item.acf.activety );
    //   $( "#project-description" ).html( ui.item.acf.activety );
    //   // $( "#project-icon" ).attr( "src", "images/" + ui.item.icon );
    //
    //   return false;
    // }
    // })
    // .autocomplete( "instance" )._renderItem = function( ul, item ) {
    // return $( "<li>" )
    //   .append( "<p class='ui-title' style='display:inline-flex;'>" + item.title.rendered + "</p> <p class='ui-activety' style='display:inline-flex;'>" + item.acf.activety + "</p>" )
    //   .appendTo( ul );
    // };
    // } );

    $.each(resultname, function(i, field){
      //  console.log(field);
      var activety = field.acf.activety.toLowerCase();
      var season = field.acf.season.toLowerCase();
      var cardIcon = activety;
      if (cardIcon == "animal life") {
        cardIcon = "animal-life";
      }
      var iconClass = activety;
      var postObject = field;

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

      var card =
       "<div class='small-12 medium-6 large-4 xlarge-3'>\
          <div id='' class='card' role='article' >\
            <a href=''>\
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

      if (field.acf.is_popular) {
          $("#big-cards").append(bigCard);
      }
     $("#cards").append(card);


     });
  });
};
// setTimeout("JSONgetter(bikeToursHttp, 'bikeObject')",200);
JSONgetter(bikeToursHttp, 'bikeObject');


// JSONgetter(customTest, 'test');
