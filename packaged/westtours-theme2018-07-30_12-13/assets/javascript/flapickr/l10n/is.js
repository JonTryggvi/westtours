/* flatpickr v4.2.3, @license MIT */
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.da = {})));
}(this, (function(exports) {
  'use strict';

  var fp = typeof window !== "undefined" && window.flatpickr !== undefined ?
    window.flatpickr : {
      l10ns: {},
    };
  var Icelandic = {
    weekdays: {
      shorthand: ["su", "má", "þr", "mi", "fi", "fs", "la"],
      longhand: [
        "sunnudagur",
        "mánudagur",
        "þriðjudagur",
        "miðvikudagur",
        "fimmtudagur",
        "föstudagur",
        "laugardagur",
      ],
    },
    months: {
      shorthand: [
        "jan",
        "feb",
        "mar",
        "apr",
        "maí",
        "jún",
        "júl",
        "ág",
        "sept",
        "okt",
        "nóv",
        "des",
      ],
      longhand: [
        "janúar",
        "febrúar",
        "mars",
        "apríl",
        "maí",
        "júni",
        "júli",
        "águst",
        "september",
        "október",
        "nóvember",
        "desember",
      ],
    },
    ordinal: function() {
      return ".";
    },
    firstDayOfWeek: 1,
    rangeSeparator: " - ",
    weekAbbreviation: "vika",
  };
  fp.l10ns.is = Icelandic;
  var is = fp.l10ns;

  exports.Iclandic = Icelandic;
  exports['default'] = is;

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

})));