var templateUrl = themeUrl.templateUrl;
var isEnglish = themeUrl.isEnglish;
// console.log(isEnglish);


var rootUrl = window.location.origin;
if (rootUrl === "http://localhost:3000" || rootUrl === "http://localhost:8888") {
  rootUrl = rootUrl + "/westtours/";
} else {
  rootUrl = window.location.origin;
}