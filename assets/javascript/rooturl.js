var templateUrl = themeUrl.templateUrl;
var isEnglish = themeUrl.isEnglish;
// console.log(isEnglish);


var rootUrl = window.location.origin;
if (rootUrl === "http://localhost:3000" || rootUrl === "http://localhost:8888" || rootUrl === "http://localhost") {
  rootUrl = rootUrl + "/westtours/";
} else {
  rootUrl = window.location.origin;
}

// console.log(rootUrl);

function isDescendant(parent, child) {
  var node = child.parentNode;
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function IsJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}