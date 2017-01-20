
var categories = "http://localhost:8888/west/wp-json/wp/v2/categories?per_page=50";
var bikeToursHttp = "http://localhost:8888/west/wp-json/wp/v2/bike_tours";
var customTest = "http://localhost:8888/west/wp-json/wp/v2/custom_api";
var category = [];
$.getJSON(categories, function(result){
  category=result;
  });

var JSONgetter = function(http, resultname){
  $.getJSON(http, function(resultname){
    var cat;
    var obj = resultname[0];
    var objSepperated = obj;
    var catName;
    // console.log(category);

    for (var i = 0; i < category.length; i++) {
      catArr = category[i];
      // console.log(catArr.name)
      //  console.log(catArr.id);
      //  console.log(objSepperated.id);
        if(objSepperated.id == catArr.id) {
          catName = catArr.name;
          // console.log(catName);
        }


      }

    // console.log(category);
         $.each(resultname, function(i, field){
           console.log(field);
           if (catArr == field.categoryfksodflw) {
             test = catArr.name;
             console.log(test);
           }
             var bigCard =
             "<div class='small-12 medium-12 large-6'> \
                 <div id='' class='card-large' role='article'> \
                   <a href=''> \
                     <div class='image' style='background-image:url("+field.acf.img.sizes.large+");'> \
                        <img src='' alt=''/> \
                     </div> \
                     <div class='icon' > \
                     </div> \
                     <p class='cat-string'> \
                    </p> \
                     <header class='card-content article-header'> \
                       <h2 class='entry-title single-title' itemprop='headline'><?php the_title(); ?></h2> \
                       <?php the_excerpt(); ?> \
                     </header> \
                       <button type='button' class='readMoreBtn'>Read more</button> \
                   </a> \
                 </div> \
               </div>";
              //  console.log(field);
               if(field.acf.is_popular) {
                 $("#big-cards").append(bigCard);
               }
         });
     });

};

var bikeObject = JSONgetter(bikeToursHttp, 'bikeObject');

// JSONgetter(customTest, 'test');
