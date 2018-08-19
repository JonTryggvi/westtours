
var rootUrl = window.location.origin;
var templateUrl = themeUrl.templateUrl;
// console.log(templateUrl);
if(rootUrl === "http://localhost:3000" || rootUrl === "http://localhost:8888") {
  rootUrl = rootUrl + "/westtours/";
}else{
  rootUrl = window.location.origin;
}
