!function ($) {

  "use strict";

  var FOUNDATION_VERSION = '6.3.0';

  // Global Foundation object
  // This is attached to the window, or used as a module for AMD/Browserify
  var Foundation = {
    version: FOUNDATION_VERSION,

    /**
     * Stores initialized plugins.
     */
    _plugins: {},

    /**
     * Stores generated unique ids for plugin instances
     */
    _uuids: [],

    /**
     * Returns a boolean for RTL support
     */
    rtl: function () {
      return $('html').attr('dir') === 'rtl';
    },
    /**
     * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
     * @param {Object} plugin - The constructor of the plugin.
     */
    plugin: function (plugin, name) {
      // Object key to use when adding to global Foundation object
      // Examples: Foundation.Reveal, Foundation.OffCanvas
      var className = name || functionName(plugin);
      // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
      // Examples: data-reveal, data-off-canvas
      var attrName = hyphenate(className);

      // Add to the Foundation object and the plugins list (for reflowing)
      this._plugins[attrName] = this[className] = plugin;
    },
    /**
     * @function
     * Populates the _uuids array with pointers to each individual plugin instance.
     * Adds the `zfPlugin` data-attribute to programmatically created plugins to allow use of $(selector).foundation(method) calls.
     * Also fires the initialization event for each plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @param {String} name - the name of the plugin, passed as a camelCased string.
     * @fires Plugin#init
     */
    registerPlugin: function (plugin, name) {
      var pluginName = name ? hyphenate(name) : functionName(plugin.constructor).toLowerCase();
      plugin.uuid = this.GetYoDigits(6, pluginName);

      if (!plugin.$element.attr(`data-${ pluginName }`)) {
        plugin.$element.attr(`data-${ pluginName }`, plugin.uuid);
      }
      if (!plugin.$element.data('zfPlugin')) {
        plugin.$element.data('zfPlugin', plugin);
      }
      /**
       * Fires when the plugin has initialized.
       * @event Plugin#init
       */
      plugin.$element.trigger(`init.zf.${ pluginName }`);

      this._uuids.push(plugin.uuid);

      return;
    },
    /**
     * @function
     * Removes the plugins uuid from the _uuids array.
     * Removes the zfPlugin data attribute, as well as the data-plugin-name attribute.
     * Also fires the destroyed event for the plugin, consolidating repetitive code.
     * @param {Object} plugin - an instance of a plugin, usually `this` in context.
     * @fires Plugin#destroyed
     */
    unregisterPlugin: function (plugin) {
      var pluginName = hyphenate(functionName(plugin.$element.data('zfPlugin').constructor));

      this._uuids.splice(this._uuids.indexOf(plugin.uuid), 1);
      plugin.$element.removeAttr(`data-${ pluginName }`).removeData('zfPlugin')
      /**
       * Fires when the plugin has been destroyed.
       * @event Plugin#destroyed
       */
      .trigger(`destroyed.zf.${ pluginName }`);
      for (var prop in plugin) {
        plugin[prop] = null; //clean up script to prep for garbage collection.
      }
      return;
    },

    /**
     * @function
     * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
     * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
     * @default If no argument is passed, reflow all currently active plugins.
     */
    reInit: function (plugins) {
      var isJQ = plugins instanceof $;
      try {
        if (isJQ) {
          plugins.each(function () {
            $(this).data('zfPlugin')._init();
          });
        } else {
          var type = typeof plugins,
              _this = this,
              fns = {
            'object': function (plgs) {
              plgs.forEach(function (p) {
                p = hyphenate(p);
                $('[data-' + p + ']').foundation('_init');
              });
            },
            'string': function () {
              plugins = hyphenate(plugins);
              $('[data-' + plugins + ']').foundation('_init');
            },
            'undefined': function () {
              this['object'](Object.keys(_this._plugins));
            }
          };
          fns[type](plugins);
        }
      } catch (err) {
        console.error(err);
      } finally {
        return plugins;
      }
    },

    /**
     * returns a random base-36 uid with namespacing
     * @function
     * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
     * @param {String} namespace - name of plugin to be incorporated in uid, optional.
     * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
     * @returns {String} - unique id
     */
    GetYoDigits: function (length, namespace) {
      length = length || 6;
      return Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length)).toString(36).slice(1) + (namespace ? `-${ namespace }` : '');
    },
    /**
     * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
     * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
     * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
     */
    reflow: function (elem, plugins) {

      // If plugins is undefined, just grab everything
      if (typeof plugins === 'undefined') {
        plugins = Object.keys(this._plugins);
      }
      // If plugins is a string, convert it to an array with one item
      else if (typeof plugins === 'string') {
          plugins = [plugins];
        }

      var _this = this;

      // Iterate through each plugin
      $.each(plugins, function (i, name) {
        // Get the current plugin
        var plugin = _this._plugins[name];

        // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
        var $elem = $(elem).find('[data-' + name + ']').addBack('[data-' + name + ']');

        // For each plugin found, initialize it
        $elem.each(function () {
          var $el = $(this),
              opts = {};
          // Don't double-dip on plugins
          if ($el.data('zfPlugin')) {
            console.warn("Tried to initialize " + name + " on an element that already has a Foundation plugin.");
            return;
          }

          if ($el.attr('data-options')) {
            var thing = $el.attr('data-options').split(';').forEach(function (e, i) {
              var opt = e.split(':').map(function (el) {
                return el.trim();
              });
              if (opt[0]) opts[opt[0]] = parseValue(opt[1]);
            });
          }
          try {
            $el.data('zfPlugin', new plugin($(this), opts));
          } catch (er) {
            console.error(er);
          } finally {
            return;
          }
        });
      });
    },
    getFnName: functionName,
    transitionend: function ($elem) {
      var transitions = {
        'transition': 'transitionend',
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'otransitionend'
      };
      var elem = document.createElement('div'),
          end;

      for (var t in transitions) {
        if (typeof elem.style[t] !== 'undefined') {
          end = transitions[t];
        }
      }
      if (end) {
        return end;
      } else {
        end = setTimeout(function () {
          $elem.triggerHandler('transitionend', [$elem]);
        }, 1);
        return 'transitionend';
      }
    }
  };

  Foundation.util = {
    /**
     * Function for applying a debounce effect to a function call.
     * @function
     * @param {Function} func - Function to be called at end of timeout.
     * @param {Number} delay - Time in ms to delay the call of `func`.
     * @returns function
     */
    throttle: function (func, delay) {
      var timer = null;

      return function () {
        var context = this,
            args = arguments;

        if (timer === null) {
          timer = setTimeout(function () {
            func.apply(context, args);
            timer = null;
          }, delay);
        }
      };
    }
  };

  // TODO: consider not making this a jQuery function
  // TODO: need way to reflow vs. re-initialize
  /**
   * The Foundation jQuery method.
   * @param {String|Array} method - An action to perform on the current jQuery object.
   */
  var foundation = function (method) {
    var type = typeof method,
        $meta = $('meta.foundation-mq'),
        $noJS = $('.no-js');

    if (!$meta.length) {
      $('<meta class="foundation-mq">').appendTo(document.head);
    }
    if ($noJS.length) {
      $noJS.removeClass('no-js');
    }

    if (type === 'undefined') {
      //needs to initialize the Foundation object, or an individual plugin.
      Foundation.MediaQuery._init();
      Foundation.reflow(this);
    } else if (type === 'string') {
      //an individual method to invoke on a plugin or group of plugins
      var args = Array.prototype.slice.call(arguments, 1); //collect all the arguments, if necessary
      var plugClass = this.data('zfPlugin'); //determine the class of plugin

      if (plugClass !== undefined && plugClass[method] !== undefined) {
        //make sure both the class and method exist
        if (this.length === 1) {
          //if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
        } else {
          this.each(function (i, el) {
            //otherwise loop through the jQuery collection and invoke the method on each
            plugClass[method].apply($(el).data('zfPlugin'), args);
          });
        }
      } else {
        //error for no class or no method
        throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
      }
    } else {
      //error for invalid argument type
      throw new TypeError(`We're sorry, ${ type } is not a valid parameter. You must use a string representing the method you wish to invoke.`);
    }
    return this;
  };

  window.Foundation = Foundation;
  $.fn.foundation = foundation;

  // Polyfill for requestAnimationFrame
  (function () {
    if (!Date.now || !window.Date.now) window.Date.now = Date.now = function () {
      return new Date().getTime();
    };

    var vendors = ['webkit', 'moz'];
    for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
    }
    if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
      var lastTime = 0;
      window.requestAnimationFrame = function (callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function () {
          callback(lastTime = nextTime);
        }, nextTime - now);
      };
      window.cancelAnimationFrame = clearTimeout;
    }
    /**
     * Polyfill for performance.now, required by rAF
     */
    if (!window.performance || !window.performance.now) {
      window.performance = {
        start: Date.now(),
        now: function () {
          return Date.now() - this.start;
        }
      };
    }
  })();
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
        return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      if (this.prototype) {
        // native functions don't have a prototype
        fNOP.prototype = this.prototype;
      }
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  // Polyfill to get the name of a function in IE9
  function functionName(fn) {
    if (Function.prototype.name === undefined) {
      var funcNameRegex = /function\s([^(]{1,})\(/;
      var results = funcNameRegex.exec(fn.toString());
      return results && results.length > 1 ? results[1].trim() : "";
    } else if (fn.prototype === undefined) {
      return fn.constructor.name;
    } else {
      return fn.prototype.constructor.name;
    }
  }
  function parseValue(str) {
    if ('true' === str) return true;else if ('false' === str) return false;else if (!isNaN(str * 1)) return parseFloat(str);
    return str;
  }
  // Convert PascalCase to kebab-case
  // Thank you: http://stackoverflow.com/a/8955580
  function hyphenate(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
}(jQuery);
;'use strict';

!function ($) {

  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };

  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  function ImNotTouchingYou(element, parent, lrOnly, tbOnly) {
    var eleDims = GetDimensions(element),
        top,
        bottom,
        left,
        right;

    if (parent) {
      var parDims = GetDimensions(parent);

      bottom = eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top;
      top = eleDims.offset.top >= parDims.offset.top;
      left = eleDims.offset.left >= parDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= parDims.width + parDims.offset.left;
    } else {
      bottom = eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top;
      top = eleDims.offset.top >= eleDims.windowDims.offset.top;
      left = eleDims.offset.left >= eleDims.windowDims.offset.left;
      right = eleDims.offset.left + eleDims.width <= eleDims.windowDims.width;
    }

    var allDirs = [bottom, top, left, right];

    if (lrOnly) {
      return left === right === true;
    }

    if (tbOnly) {
      return top === bottom === true;
    }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  function GetDimensions(elem, test) {
    elem = elem.length ? elem[0] : elem;

    if (elem === window || elem === document) {
      throw new Error("I'm sorry, Dave. I'm afraid I can't do that.");
    }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  }

  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  function GetOffsets(element, anchor, position, vOffset, hOffset, isOverflow) {
    var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;

    switch (position) {
      case 'top':
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : $anchorDims.offset.left + $anchorDims.width / 2 - $eleDims.width / 2,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: $anchorDims.offset.top + $anchorDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'center':
        return {
          left: $eleDims.windowDims.offset.left + $eleDims.windowDims.width / 2 - $eleDims.width / 2,
          top: $eleDims.windowDims.offset.top + $eleDims.windowDims.height / 2 - $eleDims.height / 2
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      case 'left bottom':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'right bottom':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset - $eleDims.width,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      default:
        return {
          left: Foundation.rtl() ? $anchorDims.offset.left - $eleDims.width + $anchorDims.width : $anchorDims.offset.left + hOffset,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  }
}(jQuery);
;/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/

'use strict';

!function ($) {

  const keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  var commands = {};

  var Keyboard = {
    keys: getKeyCodes(keyCodes),

    /**
     * Parses the (keyboard) event and returns a String that represents its key
     * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
     * @param {Event} event - the event generated by the event handler
     * @return String key - String that represents the key pressed
     */
    parseKey(event) {
      var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();

      // Remove un-printable characters, e.g. for `fromCharCode` calls for CTRL only events
      key = key.replace(/\W+/, '');

      if (event.shiftKey) key = `SHIFT_${ key }`;
      if (event.ctrlKey) key = `CTRL_${ key }`;
      if (event.altKey) key = `ALT_${ key }`;

      // Remove trailing underscore, in case only modifiers were used (e.g. only `CTRL_ALT`)
      key = key.replace(/_$/, '');

      return key;
    },

    /**
     * Handles the given (keyboard) event
     * @param {Event} event - the event generated by the event handler
     * @param {String} component - Foundation component's name, e.g. Slider or Reveal
     * @param {Objects} functions - collection of functions that are to be executed
     */
    handleKey(event, component, functions) {
      var commandList = commands[component],
          keyCode = this.parseKey(event),
          cmds,
          command,
          fn;

      if (!commandList) return console.warn('Component not defined!');

      if (typeof commandList.ltr === 'undefined') {
        // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
      } else {
        // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);else cmds = $.extend({}, commandList.rtl, commandList.ltr);
      }
      command = cmds[keyCode];

      fn = functions[command];
      if (fn && typeof fn === 'function') {
        // execute function  if exists
        var returnValue = fn.apply();
        if (functions.handled || typeof functions.handled === 'function') {
          // execute function when event was handled
          functions.handled(returnValue);
        }
      } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') {
          // execute function when event was not handled
          functions.unhandled();
        }
      }
    },

    /**
     * Finds all focusable elements within the given `$element`
     * @param {jQuery} $element - jQuery object to search within
     * @return {jQuery} $focusable - all focusable elements within `$element`
     */
    findFocusable($element) {
      if (!$element) {
        return false;
      }
      return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function () {
        if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) {
          return false;
        } //only have visible elements and those that have a tabindex greater or equal 0
        return true;
      });
    },

    /**
     * Returns the component name name
     * @param {Object} component - Foundation component, e.g. Slider or Reveal
     * @return String componentName
     */

    register(componentName, cmds) {
      commands[componentName] = cmds;
    },

    /**
     * Traps the focus in the given element.
     * @param  {jQuery} $element  jQuery object to trap the foucs into.
     */
    trapFocus($element) {
      var $focusable = Foundation.Keyboard.findFocusable($element),
          $firstFocusable = $focusable.eq(0),
          $lastFocusable = $focusable.eq(-1);

      $element.on('keydown.zf.trapfocus', function (event) {
        if (event.target === $lastFocusable[0] && Foundation.Keyboard.parseKey(event) === 'TAB') {
          event.preventDefault();
          $firstFocusable.focus();
        } else if (event.target === $firstFocusable[0] && Foundation.Keyboard.parseKey(event) === 'SHIFT_TAB') {
          event.preventDefault();
          $lastFocusable.focus();
        }
      });
    },
    /**
     * Releases the trapped focus from the given element.
     * @param  {jQuery} $element  jQuery object to release the focus for.
     */
    releaseFocus($element) {
      $element.off('keydown.zf.trapfocus');
    }
  };

  /*
   * Constants for easier comparing.
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   */
  function getKeyCodes(kcs) {
    var k = {};
    for (var kc in kcs) k[kcs[kc]] = kcs[kc];
    return k;
  }

  Foundation.Keyboard = Keyboard;
}(jQuery);
;'use strict';

!function ($) {

  // Default set of media queries
  const defaultQueries = {
    'default': 'only screen',
    landscape: 'only screen and (orientation: landscape)',
    portrait: 'only screen and (orientation: portrait)',
    retina: 'only screen and (-webkit-min-device-pixel-ratio: 2),' + 'only screen and (min--moz-device-pixel-ratio: 2),' + 'only screen and (-o-min-device-pixel-ratio: 2/1),' + 'only screen and (min-device-pixel-ratio: 2),' + 'only screen and (min-resolution: 192dpi),' + 'only screen and (min-resolution: 2dppx)'
  };

  var MediaQuery = {
    queries: [],

    current: '',

    /**
     * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
     * @function
     * @private
     */
    _init() {
      var self = this;
      var extractedStyles = $('.foundation-mq').css('font-family');
      var namedQueries;

      namedQueries = parseStyleToObject(extractedStyles);

      for (var key in namedQueries) {
        if (namedQueries.hasOwnProperty(key)) {
          self.queries.push({
            name: key,
            value: `only screen and (min-width: ${ namedQueries[key] })`
          });
        }
      }

      this.current = this._getCurrentSize();

      this._watcher();
    },

    /**
     * Checks if the screen is at least as wide as a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
     */
    atLeast(size) {
      var query = this.get(size);

      if (query) {
        return window.matchMedia(query).matches;
      }

      return false;
    },

    /**
     * Checks if the screen matches to a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to check, either 'small only' or 'small'. Omitting 'only' falls back to using atLeast() method.
     * @returns {Boolean} `true` if the breakpoint matches, `false` if it does not.
     */
    is(size) {
      size = size.trim().split(' ');
      if (size.length > 1 && size[1] === 'only') {
        if (size[0] === this._getCurrentSize()) return true;
      } else {
        return this.atLeast(size[0]);
      }
      return false;
    },

    /**
     * Gets the media query of a breakpoint.
     * @function
     * @param {String} size - Name of the breakpoint to get.
     * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
     */
    get(size) {
      for (var i in this.queries) {
        if (this.queries.hasOwnProperty(i)) {
          var query = this.queries[i];
          if (size === query.name) return query.value;
        }
      }

      return null;
    },

    /**
     * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
     * @function
     * @private
     * @returns {String} Name of the current breakpoint.
     */
    _getCurrentSize() {
      var matched;

      for (var i = 0; i < this.queries.length; i++) {
        var query = this.queries[i];

        if (window.matchMedia(query.value).matches) {
          matched = query;
        }
      }

      if (typeof matched === 'object') {
        return matched.name;
      } else {
        return matched;
      }
    },

    /**
     * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
     * @function
     * @private
     */
    _watcher() {
      $(window).on('resize.zf.mediaquery', () => {
        var newSize = this._getCurrentSize(),
            currentSize = this.current;

        if (newSize !== currentSize) {
          // Change the current media query
          this.current = newSize;

          // Broadcast the media query change on the window
          $(window).trigger('changed.zf.mediaquery', [newSize, currentSize]);
        }
      });
    }
  };

  Foundation.MediaQuery = MediaQuery;

  // matchMedia() polyfill - Test a CSS media type/query in JS.
  // Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
  window.matchMedia || (window.matchMedia = function () {
    'use strict';

    // For browsers that support matchMedium api such as IE 9 and webkit

    var styleMedia = window.styleMedia || window.media;

    // For those that don't support matchMedium
    if (!styleMedia) {
      var style = document.createElement('style'),
          script = document.getElementsByTagName('script')[0],
          info = null;

      style.type = 'text/css';
      style.id = 'matchmediajs-test';

      script && script.parentNode && script.parentNode.insertBefore(style, script);

      // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
      info = 'getComputedStyle' in window && window.getComputedStyle(style, null) || style.currentStyle;

      styleMedia = {
        matchMedium(media) {
          var text = `@media ${ media }{ #matchmediajs-test { width: 1px; } }`;

          // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
          if (style.styleSheet) {
            style.styleSheet.cssText = text;
          } else {
            style.textContent = text;
          }

          // Test if media query is true or false
          return info.width === '1px';
        }
      };
    }

    return function (media) {
      return {
        matches: styleMedia.matchMedium(media || 'all'),
        media: media || 'all'
      };
    };
  }());

  // Thank you: https://github.com/sindresorhus/query-string
  function parseStyleToObject(str) {
    var styleObject = {};

    if (typeof str !== 'string') {
      return styleObject;
    }

    str = str.trim().slice(1, -1); // browsers re-quote string style values

    if (!str) {
      return styleObject;
    }

    styleObject = str.split('&').reduce(function (ret, param) {
      var parts = param.replace(/\+/g, ' ').split('=');
      var key = parts[0];
      var val = parts[1];
      key = decodeURIComponent(key);

      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});

    return styleObject;
  }

  Foundation.MediaQuery = MediaQuery;
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Motion module.
   * @module foundation.motion
   */

  const initClasses = ['mui-enter', 'mui-leave'];
  const activeClasses = ['mui-enter-active', 'mui-leave-active'];

  const Motion = {
    animateIn: function (element, animation, cb) {
      animate(true, element, animation, cb);
    },

    animateOut: function (element, animation, cb) {
      animate(false, element, animation, cb);
    }
  };

  function Move(duration, elem, fn) {
    var anim,
        prog,
        start = null;
    // console.log('called');

    if (duration === 0) {
      fn.apply(elem);
      elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      return;
    }

    function move(ts) {
      if (!start) start = ts;
      // console.log(start, ts);
      prog = ts - start;
      fn.apply(elem);

      if (prog < duration) {
        anim = window.requestAnimationFrame(move, elem);
      } else {
        window.cancelAnimationFrame(anim);
        elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
      }
    }
    anim = window.requestAnimationFrame(move);
  }

  /**
   * Animates an element in or out using a CSS transition class.
   * @function
   * @private
   * @param {Boolean} isIn - Defines if the animation is in or out.
   * @param {Object} element - jQuery or HTML object to animate.
   * @param {String} animation - CSS class to use.
   * @param {Function} cb - Callback to run when animation is finished.
   */
  function animate(isIn, element, animation, cb) {
    element = $(element).eq(0);

    if (!element.length) return;

    var initClass = isIn ? initClasses[0] : initClasses[1];
    var activeClass = isIn ? activeClasses[0] : activeClasses[1];

    // Set up the animation
    reset();

    element.addClass(animation).css('transition', 'none');

    requestAnimationFrame(() => {
      element.addClass(initClass);
      if (isIn) element.show();
    });

    // Start the animation
    requestAnimationFrame(() => {
      element[0].offsetWidth;
      element.css('transition', '').addClass(activeClass);
    });

    // Clean up the animation when it finishes
    element.one(Foundation.transitionend(element), finish);

    // Hides the element (for out animations), resets the element, and runs a callback
    function finish() {
      if (!isIn) element.hide();
      reset();
      if (cb) cb.apply(element);
    }

    // Resets transitions and removes motion-specific classes
    function reset() {
      element[0].style.transitionDuration = 0;
      element.removeClass(`${ initClass } ${ activeClass } ${ animation }`);
    }
  }

  Foundation.Move = Move;
  Foundation.Motion = Motion;
}(jQuery);
;'use strict';

!function ($) {

  const Nest = {
    Feather(menu, type = 'zf') {
      menu.attr('role', 'menubar');

      var items = menu.find('li').attr({ 'role': 'menuitem' }),
          subMenuClass = `is-${ type }-submenu`,
          subItemClass = `${ subMenuClass }-item`,
          hasSubClass = `is-${ type }-submenu-parent`;

      items.each(function () {
        var $item = $(this),
            $sub = $item.children('ul');

        if ($sub.length) {
          $item.addClass(hasSubClass).attr({
            'aria-haspopup': true,
            'aria-label': $item.children('a:first').text()
          });
          // Note:  Drilldowns behave differently in how they hide, and so need
          // additional attributes.  We should look if this possibly over-generalized
          // utility (Nest) is appropriate when we rework menus in 6.4
          if (type === 'drilldown') {
            $item.attr({ 'aria-expanded': false });
          }

          $sub.addClass(`submenu ${ subMenuClass }`).attr({
            'data-submenu': '',
            'role': 'menu'
          });
          if (type === 'drilldown') {
            $sub.attr({ 'aria-hidden': true });
          }
        }

        if ($item.parent('[data-submenu]').length) {
          $item.addClass(`is-submenu-item ${ subItemClass }`);
        }
      });

      return;
    },

    Burn(menu, type) {
      var //items = menu.find('li'),
      subMenuClass = `is-${ type }-submenu`,
          subItemClass = `${ subMenuClass }-item`,
          hasSubClass = `is-${ type }-submenu-parent`;

      menu.find('>li, .menu, .menu > li').removeClass(`${ subMenuClass } ${ subItemClass } ${ hasSubClass } is-submenu-item submenu is-active`).removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };

  Foundation.Nest = Nest;
}(jQuery);
;'use strict';

!function ($) {

  function Timer(elem, options, cb) {
    var _this = this,
        duration = options.duration,
        //options is an object for easily adding features later.
    nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.isPaused = false;

    this.restart = function () {
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function () {
      this.isPaused = false;
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function () {
        if (options.infinite) {
          _this.restart(); //rerun the timer.
        }
        if (cb && typeof cb === 'function') {
          cb();
        }
      }, remain);
      elem.trigger(`timerstart.zf.${ nameSpace }`);
    };

    this.pause = function () {
      this.isPaused = true;
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger(`timerpaused.zf.${ nameSpace }`);
    };
  }

  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  function onImagesLoaded(images, callback) {
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    images.each(function () {
      // Check if image is loaded
      if (this.complete || this.readyState === 4 || this.readyState === 'complete') {
        singleImageLoaded();
      }
      // Force load the image
      else {
          // fix for IE. See https://css-tricks.com/snippets/jquery/fixing-load-in-ie-for-cached-images/
          var src = $(this).attr('src');
          $(this).attr('src', src + '?' + new Date().getTime());
          $(this).one('load', function () {
            singleImageLoaded();
          });
        }
    });

    function singleImageLoaded() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    }
  }

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery);
;//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function ($) {

	$.spotSwipe = {
		version: '1.0.0',
		enabled: 'ontouchstart' in document.documentElement,
		preventDefault: false,
		moveThreshold: 75,
		timeThreshold: 200
	};

	var startPosX,
	    startPosY,
	    startTime,
	    elapsedTime,
	    isMoving = false;

	function onTouchEnd() {
		//  alert(this);
		this.removeEventListener('touchmove', onTouchMove);
		this.removeEventListener('touchend', onTouchEnd);
		isMoving = false;
	}

	function onTouchMove(e) {
		if ($.spotSwipe.preventDefault) {
			e.preventDefault();
		}
		if (isMoving) {
			var x = e.touches[0].pageX;
			var y = e.touches[0].pageY;
			var dx = startPosX - x;
			var dy = startPosY - y;
			var dir;
			elapsedTime = new Date().getTime() - startTime;
			if (Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
				dir = dx > 0 ? 'left' : 'right';
			}
			// else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
			//   dir = dy > 0 ? 'down' : 'up';
			// }
			if (dir) {
				e.preventDefault();
				onTouchEnd.call(this);
				$(this).trigger('swipe', dir).trigger(`swipe${ dir }`);
			}
		}
	}

	function onTouchStart(e) {
		if (e.touches.length == 1) {
			startPosX = e.touches[0].pageX;
			startPosY = e.touches[0].pageY;
			isMoving = true;
			startTime = new Date().getTime();
			this.addEventListener('touchmove', onTouchMove, false);
			this.addEventListener('touchend', onTouchEnd, false);
		}
	}

	function init() {
		this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
	}

	function teardown() {
		this.removeEventListener('touchstart', onTouchStart);
	}

	$.event.special.swipe = { setup: init };

	$.each(['left', 'up', 'down', 'right'], function () {
		$.event.special[`swipe${ this }`] = { setup: function () {
				$(this).on('swipe', $.noop);
			} };
	});
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function ($) {
	$.fn.addTouch = function () {
		this.each(function (i, el) {
			$(el).bind('touchstart touchmove touchend touchcancel', function () {
				//we pass the original event object because the jQuery event
				//object is normalized to w3c specs and does not provide the TouchList
				handleTouch(event);
			});
		});

		var handleTouch = function (event) {
			var touches = event.changedTouches,
			    first = touches[0],
			    eventTypes = {
				touchstart: 'mousedown',
				touchmove: 'mousemove',
				touchend: 'mouseup'
			},
			    type = eventTypes[event.type],
			    simulatedEvent;

			if ('MouseEvent' in window && typeof window.MouseEvent === 'function') {
				simulatedEvent = new window.MouseEvent(type, {
					'bubbles': true,
					'cancelable': true,
					'screenX': first.screenX,
					'screenY': first.screenY,
					'clientX': first.clientX,
					'clientY': first.clientY
				});
			} else {
				simulatedEvent = document.createEvent('MouseEvent');
				simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0 /*left*/, null);
			}
			first.target.dispatchEvent(simulatedEvent);
		};
	};
}(jQuery);

//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/
;'use strict';

!function ($) {

  const MutationObserver = function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i = 0; i < prefixes.length; i++) {
      if (`${ prefixes[i] }MutationObserver` in window) {
        return window[`${ prefixes[i] }MutationObserver`];
      }
    }
    return false;
  }();

  const triggers = (el, type) => {
    el.data(type).split(' ').forEach(id => {
      $(`#${ id }`)[type === 'close' ? 'trigger' : 'triggerHandler'](`${ type }.zf.trigger`, [el]);
    });
  };
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function () {
    triggers($(this), 'open');
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function () {
    let id = $(this).data('close');
    if (id) {
      triggers($(this), 'close');
    } else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function () {
    let id = $(this).data('toggle');
    if (id) {
      triggers($(this), 'toggle');
    } else {
      $(this).trigger('toggle.zf.trigger');
    }
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function (e) {
    e.stopPropagation();
    let animation = $(this).data('closable');

    if (animation !== '') {
      Foundation.Motion.animateOut($(this), animation, function () {
        $(this).trigger('closed.zf');
      });
    } else {
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  $(document).on('focus.zf.trigger blur.zf.trigger', '[data-toggle-focus]', function () {
    let id = $(this).data('toggle-focus');
    $(`#${ id }`).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).on('load', () => {
    checkListeners();
  });

  function checkListeners() {
    eventsListener();
    resizeListener();
    scrollListener();
    mutateListener();
    closemeListener();
  }

  //******** only fires this function once on load, if there's something to watch ********
  function closemeListener(pluginName) {
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if (pluginName) {
      if (typeof pluginName === 'string') {
        plugNames.push(pluginName);
      } else if (typeof pluginName === 'object' && typeof pluginName[0] === 'string') {
        plugNames.concat(pluginName);
      } else {
        console.error('Plugin names must be strings');
      }
    }
    if (yetiBoxes.length) {
      let listeners = plugNames.map(name => {
        return `closeme.zf.${ name }`;
      }).join(' ');

      $(window).off(listeners).on(listeners, function (e, pluginId) {
        let plugin = e.namespace.split('.')[0];
        let plugins = $(`[data-${ plugin }]`).not(`[data-yeti-box="${ pluginId }"]`);

        plugins.each(function () {
          let _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  }

  function resizeListener(debounce) {
    let timer,
        $nodes = $('[data-resize]');
    if ($nodes.length) {
      $(window).off('resize.zf.trigger').on('resize.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10); //default time to emit resize event
      });
    }
  }

  function scrollListener(debounce) {
    let timer,
        $nodes = $('[data-scroll]');
    if ($nodes.length) {
      $(window).off('scroll.zf.trigger').on('scroll.zf.trigger', function (e) {
        if (timer) {
          clearTimeout(timer);
        }

        timer = setTimeout(function () {

          if (!MutationObserver) {
            //fallback for IE 9
            $nodes.each(function () {
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10); //default time to emit scroll event
      });
    }
  }

  function mutateListener(debounce) {
    let $nodes = $('[data-mutate]');
    if ($nodes.length && MutationObserver) {
      //trigger all listening elements and signal a mutate event
      //no IE 9 or 10
      $nodes.each(function () {
        $(this).triggerHandler('mutateme.zf.trigger');
      });
    }
  }

  function eventsListener() {
    if (!MutationObserver) {
      return false;
    }
    let nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function (mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);

      //trigger the event handler for the element depending on type
      switch (mutationRecordsList[0].type) {

        case "attributes":
          if ($target.attr("data-events") === "scroll" && mutationRecordsList[0].attributeName === "data-events") {
            $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
          }
          if ($target.attr("data-events") === "resize" && mutationRecordsList[0].attributeName === "data-events") {
            $target.triggerHandler('resizeme.zf.trigger', [$target]);
          }
          if (mutationRecordsList[0].attributeName === "style") {
            $target.closest("[data-mutate]").attr("data-events", "mutate");
            $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
          }
          break;

        case "childList":
          $target.closest("[data-mutate]").attr("data-events", "mutate");
          $target.closest("[data-mutate]").triggerHandler('mutateme.zf.trigger', [$target.closest("[data-mutate]")]);
          break;

        default:
          return false;
        //nothing
      }
    };

    if (nodes.length) {
      //for each element that needs to listen for resizing, scrolling, or mutation add a single observer
      for (var i = 0; i <= nodes.length - 1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: true, characterData: false, subtree: true, attributeFilter: ["data-events", "style"] });
      }
    }
  }

  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;
}(jQuery);

// function domMutationObserver(debounce) {
//   // !!! This is coming soon and needs more work; not active  !!! //
//   var timer,
//   nodes = document.querySelectorAll('[data-mutate]');
//   //
//   if (nodes.length) {
//     // var MutationObserver = (function () {
//     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
//     //   for (var i=0; i < prefixes.length; i++) {
//     //     if (prefixes[i] + 'MutationObserver' in window) {
//     //       return window[prefixes[i] + 'MutationObserver'];
//     //     }
//     //   }
//     //   return false;
//     // }());
//
//
//     //for the body, we need to listen for all changes effecting the style and class attributes
//     var bodyObserver = new MutationObserver(bodyMutation);
//     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
//
//
//     //body callback
//     function bodyMutation(mutate) {
//       //trigger all listening elements and signal a mutation event
//       if (timer) { clearTimeout(timer); }
//
//       timer = setTimeout(function() {
//         bodyObserver.disconnect();
//         $('[data-mutate]').attr('data-events',"mutate");
//       }, debounce || 150);
//     }
//   }
// }
;'use strict';

!function ($) {

  /**
   * Abide module.
   * @module foundation.abide
   */

  class Abide {
    /**
     * Creates a new instance of Abide.
     * @class
     * @fires Abide#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options = {}) {
      this.$element = element;
      this.options = $.extend({}, Abide.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Abide');
    }

    /**
     * Initializes the Abide plugin and calls functions to get Abide functioning on load.
     * @private
     */
    _init() {
      this.$inputs = this.$element.find('input, textarea, select');

      this._events();
    }

    /**
     * Initializes events for Abide.
     * @private
     */
    _events() {
      this.$element.off('.abide').on('reset.zf.abide', () => {
        this.resetForm();
      }).on('submit.zf.abide', () => {
        return this.validateForm();
      });

      if (this.options.validateOn === 'fieldChange') {
        this.$inputs.off('change.zf.abide').on('change.zf.abide', e => {
          this.validateInput($(e.target));
        });
      }

      if (this.options.liveValidate) {
        this.$inputs.off('input.zf.abide').on('input.zf.abide', e => {
          this.validateInput($(e.target));
        });
      }

      if (this.options.validateOnBlur) {
        this.$inputs.off('blur.zf.abide').on('blur.zf.abide', e => {
          this.validateInput($(e.target));
        });
      }
    }

    /**
     * Calls necessary functions to update Abide upon DOM change
     * @private
     */
    _reflow() {
      this._init();
    }

    /**
     * Checks whether or not a form element has the required attribute and if it's checked or not
     * @param {Object} element - jQuery object to check for required attribute
     * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
     */
    requiredCheck($el) {
      if (!$el.attr('required')) return true;

      var isGood = true;

      switch ($el[0].type) {
        case 'checkbox':
          isGood = $el[0].checked;
          break;

        case 'select':
        case 'select-one':
        case 'select-multiple':
          var opt = $el.find('option:selected');
          if (!opt.length || !opt.val()) isGood = false;
          break;

        default:
          if (!$el.val() || !$el.val().length) isGood = false;
      }

      return isGood;
    }

    /**
     * Based on $el, get the first element with selector in this order:
     * 1. The element's direct sibling('s).
     * 3. The element's parent's children.
     *
     * This allows for multiple form errors per input, though if none are found, no form errors will be shown.
     *
     * @param {Object} $el - jQuery object to use as reference to find the form error selector.
     * @returns {Object} jQuery object with the selector.
     */
    findFormError($el) {
      var $error = $el.siblings(this.options.formErrorSelector);

      if (!$error.length) {
        $error = $el.parent().find(this.options.formErrorSelector);
      }

      return $error;
    }

    /**
     * Get the first element in this order:
     * 2. The <label> with the attribute `[for="someInputId"]`
     * 3. The `.closest()` <label>
     *
     * @param {Object} $el - jQuery object to check for required attribute
     * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
     */
    findLabel($el) {
      var id = $el[0].id;
      var $label = this.$element.find(`label[for="${ id }"]`);

      if (!$label.length) {
        return $el.closest('label');
      }

      return $label;
    }

    /**
     * Get the set of labels associated with a set of radio els in this order
     * 2. The <label> with the attribute `[for="someInputId"]`
     * 3. The `.closest()` <label>
     *
     * @param {Object} $el - jQuery object to check for required attribute
     * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
     */
    findRadioLabels($els) {
      var labels = $els.map((i, el) => {
        var id = el.id;
        var $label = this.$element.find(`label[for="${ id }"]`);

        if (!$label.length) {
          $label = $(el).closest('label');
        }
        return $label[0];
      });

      return $(labels);
    }

    /**
     * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
     * @param {Object} $el - jQuery object to add the class to
     */
    addErrorClasses($el) {
      var $label = this.findLabel($el);
      var $formError = this.findFormError($el);

      if ($label.length) {
        $label.addClass(this.options.labelErrorClass);
      }

      if ($formError.length) {
        $formError.addClass(this.options.formErrorClass);
      }

      $el.addClass(this.options.inputErrorClass).attr('data-invalid', '');
    }

    /**
     * Remove CSS error classes etc from an entire radio button group
     * @param {String} groupName - A string that specifies the name of a radio button group
     *
     */

    removeRadioErrorClasses(groupName) {
      var $els = this.$element.find(`:radio[name="${ groupName }"]`);
      var $labels = this.findRadioLabels($els);
      var $formErrors = this.findFormError($els);

      if ($labels.length) {
        $labels.removeClass(this.options.labelErrorClass);
      }

      if ($formErrors.length) {
        $formErrors.removeClass(this.options.formErrorClass);
      }

      $els.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
    }

    /**
     * Removes CSS error class as specified by the Abide settings from the label, input, and the form
     * @param {Object} $el - jQuery object to remove the class from
     */
    removeErrorClasses($el) {
      // radios need to clear all of the els
      if ($el[0].type == 'radio') {
        return this.removeRadioErrorClasses($el.attr('name'));
      }

      var $label = this.findLabel($el);
      var $formError = this.findFormError($el);

      if ($label.length) {
        $label.removeClass(this.options.labelErrorClass);
      }

      if ($formError.length) {
        $formError.removeClass(this.options.formErrorClass);
      }

      $el.removeClass(this.options.inputErrorClass).removeAttr('data-invalid');
    }

    /**
     * Goes through a form to find inputs and proceeds to validate them in ways specific to their type
     * @fires Abide#invalid
     * @fires Abide#valid
     * @param {Object} element - jQuery object to validate, should be an HTML input
     * @returns {Boolean} goodToGo - If the input is valid or not.
     */
    validateInput($el) {
      var clearRequire = this.requiredCheck($el),
          validated = false,
          customValidator = true,
          validator = $el.attr('data-validator'),
          equalTo = true;

      // don't validate ignored inputs or hidden inputs
      if ($el.is('[data-abide-ignore]') || $el.is('[type="hidden"]')) {
        return true;
      }

      switch ($el[0].type) {
        case 'radio':
          validated = this.validateRadio($el.attr('name'));
          break;

        case 'checkbox':
          validated = clearRequire;
          break;

        case 'select':
        case 'select-one':
        case 'select-multiple':
          validated = clearRequire;
          break;

        default:
          validated = this.validateText($el);
      }

      if (validator) {
        customValidator = this.matchValidation($el, validator, $el.attr('required'));
      }

      if ($el.attr('data-equalto')) {
        equalTo = this.options.validators.equalTo($el);
      }

      var goodToGo = [clearRequire, validated, customValidator, equalTo].indexOf(false) === -1;
      var message = (goodToGo ? 'valid' : 'invalid') + '.zf.abide';

      if (goodToGo) {
        // Re-validate inputs that depend on this one with equalto
        const dependentElements = this.$element.find(`[data-equalto="${ $el.attr('id') }"]`);
        if (dependentElements.length) {
          let _this = this;
          dependentElements.each(function () {
            if ($(this).val()) {
              _this.validateInput($(this));
            }
          });
        }
      }

      this[goodToGo ? 'removeErrorClasses' : 'addErrorClasses']($el);

      /**
       * Fires when the input is done checking for validation. Event trigger is either `valid.zf.abide` or `invalid.zf.abide`
       * Trigger includes the DOM element of the input.
       * @event Abide#valid
       * @event Abide#invalid
       */
      $el.trigger(message, [$el]);

      return goodToGo;
    }

    /**
     * Goes through a form and if there are any invalid inputs, it will display the form error element
     * @returns {Boolean} noError - true if no errors were detected...
     * @fires Abide#formvalid
     * @fires Abide#forminvalid
     */
    validateForm() {
      var acc = [];
      var _this = this;

      this.$inputs.each(function () {
        acc.push(_this.validateInput($(this)));
      });

      var noError = acc.indexOf(false) === -1;

      this.$element.find('[data-abide-error]').css('display', noError ? 'none' : 'block');

      /**
       * Fires when the form is finished validating. Event trigger is either `formvalid.zf.abide` or `forminvalid.zf.abide`.
       * Trigger includes the element of the form.
       * @event Abide#formvalid
       * @event Abide#forminvalid
       */
      this.$element.trigger((noError ? 'formvalid' : 'forminvalid') + '.zf.abide', [this.$element]);

      return noError;
    }

    /**
     * Determines whether or a not a text input is valid based on the pattern specified in the attribute. If no matching pattern is found, returns true.
     * @param {Object} $el - jQuery object to validate, should be a text input HTML element
     * @param {String} pattern - string value of one of the RegEx patterns in Abide.options.patterns
     * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
     */
    validateText($el, pattern) {
      // A pattern can be passed to this function, or it will be infered from the input's "pattern" attribute, or it's "type" attribute
      pattern = pattern || $el.attr('pattern') || $el.attr('type');
      var inputText = $el.val();
      var valid = false;

      if (inputText.length) {
        // If the pattern attribute on the element is in Abide's list of patterns, then test that regexp
        if (this.options.patterns.hasOwnProperty(pattern)) {
          valid = this.options.patterns[pattern].test(inputText);
        }
        // If the pattern name isn't also the type attribute of the field, then test it as a regexp
        else if (pattern !== $el.attr('type')) {
            valid = new RegExp(pattern).test(inputText);
          } else {
            valid = true;
          }
      }
      // An empty field is valid if it's not required
      else if (!$el.prop('required')) {
          valid = true;
        }

      return valid;
    }

    /**
     * Determines whether or a not a radio input is valid based on whether or not it is required and selected. Although the function targets a single `<input>`, it validates by checking the `required` and `checked` properties of all radio buttons in its group.
     * @param {String} groupName - A string that specifies the name of a radio button group
     * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
     */
    validateRadio(groupName) {
      // If at least one radio in the group has the `required` attribute, the group is considered required
      // Per W3C spec, all radio buttons in a group should have `required`, but we're being nice
      var $group = this.$element.find(`:radio[name="${ groupName }"]`);
      var valid = false,
          required = false;

      // For the group to be required, at least one radio needs to be required
      $group.each((i, e) => {
        if ($(e).attr('required')) {
          required = true;
        }
      });
      if (!required) valid = true;

      if (!valid) {
        // For the group to be valid, at least one radio needs to be checked
        $group.each((i, e) => {
          if ($(e).prop('checked')) {
            valid = true;
          }
        });
      };

      return valid;
    }

    /**
     * Determines if a selected input passes a custom validation function. Multiple validations can be used, if passed to the element with `data-validator="foo bar baz"` in a space separated listed.
     * @param {Object} $el - jQuery input element.
     * @param {String} validators - a string of function names matching functions in the Abide.options.validators object.
     * @param {Boolean} required - self explanatory?
     * @returns {Boolean} - true if validations passed.
     */
    matchValidation($el, validators, required) {
      required = required ? true : false;

      var clear = validators.split(' ').map(v => {
        return this.options.validators[v]($el, required, $el.parent());
      });
      return clear.indexOf(false) === -1;
    }

    /**
     * Resets form inputs and styles
     * @fires Abide#formreset
     */
    resetForm() {
      var $form = this.$element,
          opts = this.options;

      $(`.${ opts.labelErrorClass }`, $form).not('small').removeClass(opts.labelErrorClass);
      $(`.${ opts.inputErrorClass }`, $form).not('small').removeClass(opts.inputErrorClass);
      $(`${ opts.formErrorSelector }.${ opts.formErrorClass }`).removeClass(opts.formErrorClass);
      $form.find('[data-abide-error]').css('display', 'none');
      $(':input', $form).not(':button, :submit, :reset, :hidden, :radio, :checkbox, [data-abide-ignore]').val('').removeAttr('data-invalid');
      $(':input:radio', $form).not('[data-abide-ignore]').prop('checked', false).removeAttr('data-invalid');
      $(':input:checkbox', $form).not('[data-abide-ignore]').prop('checked', false).removeAttr('data-invalid');
      /**
       * Fires when the form has been reset.
       * @event Abide#formreset
       */
      $form.trigger('formreset.zf.abide', [$form]);
    }

    /**
     * Destroys an instance of Abide.
     * Removes error styles and classes from elements, without resetting their values.
     */
    destroy() {
      var _this = this;
      this.$element.off('.abide').find('[data-abide-error]').css('display', 'none');

      this.$inputs.off('.abide').each(function () {
        _this.removeErrorClasses($(this));
      });

      Foundation.unregisterPlugin(this);
    }
  }

  /**
   * Default settings for plugin
   */
  Abide.defaults = {
    /**
     * The default event to validate inputs. Checkboxes and radios validate immediately.
     * Remove or change this value for manual validation.
     * @option
     * @example 'fieldChange'
     */
    validateOn: 'fieldChange',

    /**
     * Class to be applied to input labels on failed validation.
     * @option
     * @example 'is-invalid-label'
     */
    labelErrorClass: 'is-invalid-label',

    /**
     * Class to be applied to inputs on failed validation.
     * @option
     * @example 'is-invalid-input'
     */
    inputErrorClass: 'is-invalid-input',

    /**
     * Class selector to use to target Form Errors for show/hide.
     * @option
     * @example '.form-error'
     */
    formErrorSelector: '.form-error',

    /**
     * Class added to Form Errors on failed validation.
     * @option
     * @example 'is-visible'
     */
    formErrorClass: 'is-visible',

    /**
     * Set to true to validate text inputs on any value change.
     * @option
     * @example false
     */
    liveValidate: false,

    /**
     * Set to true to validate inputs on blur.
     * @option
     * @example false
     */
    validateOnBlur: false,

    patterns: {
      alpha: /^[a-zA-Z]+$/,
      alpha_numeric: /^[a-zA-Z0-9]+$/,
      integer: /^[-+]?\d+$/,
      number: /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv: /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url: /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime: /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date: /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time: /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO: /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year: /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year: /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color: /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },

    /**
     * Optional validation functions to be used. `equalTo` being the only default included function.
     * Functions should return only a boolean if the input is valid or not. Functions are given the following arguments:
     * el : The jQuery element to validate.
     * required : Boolean value of the required attribute be present or not.
     * parent : The direct parent of the input.
     * @option
     */
    validators: {
      equalTo: function (el, required, parent) {
        return $(`#${ el.attr('data-equalto') }`).val() === el.val();
      }
    }
  };

  // Window exports
  Foundation.plugin(Abide, 'Abide');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Accordion module.
   * @module foundation.accordion
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   */

  class Accordion {
    /**
     * Creates a new instance of an accordion.
     * @class
     * @fires Accordion#init
     * @param {jQuery} element - jQuery object to make into an accordion.
     * @param {Object} options - a plain object with settings to override the default options.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Accordion');
      Foundation.Keyboard.register('Accordion', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_DOWN': 'next',
        'ARROW_UP': 'previous'
      });
    }

    /**
     * Initializes the accordion by animating the preset active pane(s).
     * @private
     */
    _init() {
      this.$element.attr('role', 'tablist');
      this.$tabs = this.$element.children('[data-accordion-item]');

      this.$tabs.each(function (idx, el) {
        var $el = $(el),
            $content = $el.children('[data-tab-content]'),
            id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
            linkId = el.id || `${ id }-label`;

        $el.find('a:first').attr({
          'aria-controls': id,
          'role': 'tab',
          'id': linkId,
          'aria-expanded': false,
          'aria-selected': false
        });

        $content.attr({ 'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id });
      });
      var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
      if ($initActive.length) {
        this.down($initActive, true);
      }
      this._events();
    }

    /**
     * Adds event handlers for items within the accordion.
     * @private
     */
    _events() {
      var _this = this;

      this.$tabs.each(function () {
        var $elem = $(this);
        var $tabContent = $elem.children('[data-tab-content]');
        if ($tabContent.length) {
          $elem.children('a').off('click.zf.accordion keydown.zf.accordion').on('click.zf.accordion', function (e) {
            e.preventDefault();
            _this.toggle($tabContent);
          }).on('keydown.zf.accordion', function (e) {
            Foundation.Keyboard.handleKey(e, 'Accordion', {
              toggle: function () {
                _this.toggle($tabContent);
              },
              next: function () {
                var $a = $elem.next().find('a').focus();
                if (!_this.options.multiExpand) {
                  $a.trigger('click.zf.accordion');
                }
              },
              previous: function () {
                var $a = $elem.prev().find('a').focus();
                if (!_this.options.multiExpand) {
                  $a.trigger('click.zf.accordion');
                }
              },
              handled: function () {
                e.preventDefault();
                e.stopPropagation();
              }
            });
          });
        }
      });
    }

    /**
     * Toggles the selected content pane's open/close state.
     * @param {jQuery} $target - jQuery object of the pane to toggle (`.accordion-content`).
     * @function
     */
    toggle($target) {
      if ($target.parent().hasClass('is-active')) {
        this.up($target);
      } else {
        this.down($target);
      }
    }

    /**
     * Opens the accordion tab defined by `$target`.
     * @param {jQuery} $target - Accordion pane to open (`.accordion-content`).
     * @param {Boolean} firstTime - flag to determine if reflow should happen.
     * @fires Accordion#down
     * @function
     */
    down($target, firstTime) {
      $target.attr('aria-hidden', false).parent('[data-tab-content]').addBack().parent().addClass('is-active');

      if (!this.options.multiExpand && !firstTime) {
        var $currentActive = this.$element.children('.is-active').children('[data-tab-content]');
        if ($currentActive.length) {
          this.up($currentActive.not($target));
        }
      }

      $target.slideDown(this.options.slideSpeed, () => {
        /**
         * Fires when the tab is done opening.
         * @event Accordion#down
         */
        this.$element.trigger('down.zf.accordion', [$target]);
      });

      $(`#${ $target.attr('aria-labelledby') }`).attr({
        'aria-expanded': true,
        'aria-selected': true
      });
    }

    /**
     * Closes the tab defined by `$target`.
     * @param {jQuery} $target - Accordion tab to close (`.accordion-content`).
     * @fires Accordion#up
     * @function
     */
    up($target) {
      var $aunts = $target.parent().siblings(),
          _this = this;

      if (!this.options.allowAllClosed && !$aunts.hasClass('is-active') || !$target.parent().hasClass('is-active')) {
        return;
      }

      // Foundation.Move(this.options.slideSpeed, $target, function(){
      $target.slideUp(_this.options.slideSpeed, function () {
        /**
         * Fires when the tab is done collapsing up.
         * @event Accordion#up
         */
        _this.$element.trigger('up.zf.accordion', [$target]);
      });
      // });

      $target.attr('aria-hidden', true).parent().removeClass('is-active');

      $(`#${ $target.attr('aria-labelledby') }`).attr({
        'aria-expanded': false,
        'aria-selected': false
      });
    }

    /**
     * Destroys an instance of an accordion.
     * @fires Accordion#destroyed
     * @function
     */
    destroy() {
      this.$element.find('[data-tab-content]').stop(true).slideUp(0).css('display', '');
      this.$element.find('a').off('.zf.accordion');

      Foundation.unregisterPlugin(this);
    }
  }

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @example false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @example false
     */
    allowAllClosed: false
  };

  // Window exports
  Foundation.plugin(Accordion, 'Accordion');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * AccordionMenu module.
   * @module foundation.accordionMenu
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  class AccordionMenu {
    /**
     * Creates a new instance of an accordion menu.
     * @class
     * @fires AccordionMenu#init
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'accordion');

      this._init();

      Foundation.registerPlugin(this, 'AccordionMenu');
      Foundation.Keyboard.register('AccordionMenu', {
        'ENTER': 'toggle',
        'SPACE': 'toggle',
        'ARROW_RIGHT': 'open',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'close',
        'ESCAPE': 'closeAll'
      });
    }

    /**
     * Initializes the accordion menu by hiding all nested menus.
     * @private
     */
    _init() {
      this.$element.find('[data-submenu]').not('.is-active').slideUp(0); //.find('a').css('padding-left', '1rem');
      this.$element.attr({
        'role': 'menu',
        'aria-multiselectable': this.options.multiOpen
      });

      this.$menuLinks = this.$element.find('.is-accordion-submenu-parent');
      this.$menuLinks.each(function () {
        var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
            $elem = $(this),
            $sub = $elem.children('[data-submenu]'),
            subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
            isActive = $sub.hasClass('is-active');
        $elem.attr({
          'aria-controls': subId,
          'aria-expanded': isActive,
          'role': 'menuitem',
          'id': linkId
        });
        $sub.attr({
          'aria-labelledby': linkId,
          'aria-hidden': !isActive,
          'role': 'menu',
          'id': subId
        });
      });
      var initPanes = this.$element.find('.is-active');
      if (initPanes.length) {
        var _this = this;
        initPanes.each(function () {
          _this.down($(this));
        });
      }
      this._events();
    }

    /**
     * Adds event handlers for items within the menu.
     * @private
     */
    _events() {
      var _this = this;

      this.$element.find('li').each(function () {
        var $submenu = $(this).children('[data-submenu]');

        if ($submenu.length) {
          $(this).children('a').off('click.zf.accordionMenu').on('click.zf.accordionMenu', function (e) {
            e.preventDefault();

            _this.toggle($submenu);
          });
        }
      }).on('keydown.zf.accordionmenu', function (e) {
        var $element = $(this),
            $elements = $element.parent('ul').children('li'),
            $prevElement,
            $nextElement,
            $target = $element.children('[data-submenu]');

        $elements.each(function (i) {
          if ($(this).is($element)) {
            $prevElement = $elements.eq(Math.max(0, i - 1)).find('a').first();
            $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1)).find('a').first();

            if ($(this).children('[data-submenu]:visible').length) {
              // has open sub menu
              $nextElement = $element.find('li:first-child').find('a').first();
            }
            if ($(this).is(':first-child')) {
              // is first element of sub menu
              $prevElement = $element.parents('li').first().find('a').first();
            } else if ($prevElement.parents('li').first().children('[data-submenu]:visible').length) {
              // if previous element has open sub menu
              $prevElement = $prevElement.parents('li').find('li:last-child').find('a').first();
            }
            if ($(this).is(':last-child')) {
              // is last element of sub menu
              $nextElement = $element.parents('li').first().next('li').find('a').first();
            }

            return;
          }
        });

        Foundation.Keyboard.handleKey(e, 'AccordionMenu', {
          open: function () {
            if ($target.is(':hidden')) {
              _this.down($target);
              $target.find('li').first().find('a').first().focus();
            }
          },
          close: function () {
            if ($target.length && !$target.is(':hidden')) {
              // close active sub of this item
              _this.up($target);
            } else if ($element.parent('[data-submenu]').length) {
              // close currently open sub
              _this.up($element.parent('[data-submenu]'));
              $element.parents('li').first().find('a').first().focus();
            }
          },
          up: function () {
            $prevElement.focus();
            return true;
          },
          down: function () {
            $nextElement.focus();
            return true;
          },
          toggle: function () {
            if ($element.children('[data-submenu]').length) {
              _this.toggle($element.children('[data-submenu]'));
            }
          },
          closeAll: function () {
            _this.hideAll();
          },
          handled: function (preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
            e.stopImmediatePropagation();
          }
        });
      }); //.attr('tabindex', 0);
    }

    /**
     * Closes all panes of the menu.
     * @function
     */
    hideAll() {
      this.up(this.$element.find('[data-submenu]'));
    }

    /**
     * Opens all panes of the menu.
     * @function
     */
    showAll() {
      this.down(this.$element.find('[data-submenu]'));
    }

    /**
     * Toggles the open/close state of a submenu.
     * @function
     * @param {jQuery} $target - the submenu to toggle
     */
    toggle($target) {
      if (!$target.is(':animated')) {
        if (!$target.is(':hidden')) {
          this.up($target);
        } else {
          this.down($target);
        }
      }
    }

    /**
     * Opens the sub-menu defined by `$target`.
     * @param {jQuery} $target - Sub-menu to open.
     * @fires AccordionMenu#down
     */
    down($target) {
      var _this = this;

      if (!this.options.multiOpen) {
        this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
      }

      $target.addClass('is-active').attr({ 'aria-hidden': false }).parent('.is-accordion-submenu-parent').attr({ 'aria-expanded': true });

      //Foundation.Move(this.options.slideSpeed, $target, function() {
      $target.slideDown(_this.options.slideSpeed, function () {
        /**
         * Fires when the menu is done opening.
         * @event AccordionMenu#down
         */
        _this.$element.trigger('down.zf.accordionMenu', [$target]);
      });
      //});
    }

    /**
     * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
     * @param {jQuery} $target - Sub-menu to close.
     * @fires AccordionMenu#up
     */
    up($target) {
      var _this = this;
      //Foundation.Move(this.options.slideSpeed, $target, function(){
      $target.slideUp(_this.options.slideSpeed, function () {
        /**
         * Fires when the menu is done collapsing up.
         * @event AccordionMenu#up
         */
        _this.$element.trigger('up.zf.accordionMenu', [$target]);
      });
      //});

      var $menus = $target.find('[data-submenu]').slideUp(0).addBack().attr('aria-hidden', true);

      $menus.parent('.is-accordion-submenu-parent').attr('aria-expanded', false);
    }

    /**
     * Destroys an instance of accordion menu.
     * @fires AccordionMenu#destroyed
     */
    destroy() {
      this.$element.find('[data-submenu]').slideDown(0).css('display', '');
      this.$element.find('a').off('click.zf.accordionMenu');

      Foundation.Nest.Burn(this.$element, 'accordion');
      Foundation.unregisterPlugin(this);
    }
  }

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @example true
     */
    multiOpen: true
  };

  // Window exports
  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Drilldown module.
   * @module foundation.drilldown
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.nest
   */

  class Drilldown {
    /**
     * Creates a new instance of a drilldown menu.
     * @class
     * @param {jQuery} element - jQuery object to make into an accordion menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Drilldown.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'drilldown');

      this._init();

      Foundation.registerPlugin(this, 'Drilldown');
      Foundation.Keyboard.register('Drilldown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close',
        'TAB': 'down',
        'SHIFT_TAB': 'up'
      });
    }

    /**
     * Initializes the drilldown by creating jQuery collections of elements
     * @private
     */
    _init() {
      this.$submenuAnchors = this.$element.find('li.is-drilldown-submenu-parent').children('a');
      this.$submenus = this.$submenuAnchors.parent('li').children('[data-submenu]');
      this.$menuItems = this.$element.find('li').not('.js-drilldown-back').attr('role', 'menuitem').find('a');
      this.$element.attr('data-mutate', this.$element.attr('data-drilldown') || Foundation.GetYoDigits(6, 'drilldown'));

      this._prepareMenu();
      this._registerEvents();

      this._keyboardEvents();
    }

    /**
     * prepares drilldown menu by setting attributes to links and elements
     * sets a min height to prevent content jumping
     * wraps the element if not already wrapped
     * @private
     * @function
     */
    _prepareMenu() {
      var _this = this;
      // if(!this.options.holdOpen){
      //   this._menuLinkEvents();
      // }
      this.$submenuAnchors.each(function () {
        var $link = $(this);
        var $sub = $link.parent();
        if (_this.options.parentLink) {
          $link.clone().prependTo($sub.children('[data-submenu]')).wrap('<li class="is-submenu-parent-item is-submenu-item is-drilldown-submenu-item" role="menu-item"></li>');
        }
        $link.data('savedHref', $link.attr('href')).removeAttr('href').attr('tabindex', 0);
        $link.children('[data-submenu]').attr({
          'aria-hidden': true,
          'tabindex': 0,
          'role': 'menu'
        });
        _this._events($link);
      });
      this.$submenus.each(function () {
        var $menu = $(this),
            $back = $menu.find('.js-drilldown-back');
        if (!$back.length) {
          switch (_this.options.backButtonPosition) {
            case "bottom":
              $menu.append(_this.options.backButton);
              break;
            case "top":
              $menu.prepend(_this.options.backButton);
              break;
            default:
              console.error("Unsupported backButtonPosition value '" + _this.options.backButtonPosition + "'");
          }
        }
        _this._back($menu);
      });

      if (!this.options.autoHeight) {
        this.$submenus.addClass('drilldown-submenu-cover-previous');
      }

      if (!this.$element.parent().hasClass('is-drilldown')) {
        this.$wrapper = $(this.options.wrapper).addClass('is-drilldown');
        if (this.options.animateHeight) this.$wrapper.addClass('animate-height');
        this.$wrapper = this.$element.wrap(this.$wrapper).parent().css(this._getMaxDims());
      }
    }

    _resize() {
      this.$wrapper.css({ 'max-width': 'none', 'min-height': 'none' });
      // _getMaxDims has side effects (boo) but calling it should update all other necessary heights & widths
      this.$wrapper.css(this._getMaxDims());
    }

    /**
     * Adds event handlers to elements in the menu.
     * @function
     * @private
     * @param {jQuery} $elem - the current menu item to add handlers to.
     */
    _events($elem) {
      var _this = this;

      $elem.off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
        if ($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }

        // if(e.target !== e.currentTarget.firstElementChild){
        //   return false;
        // }
        _this._show($elem.parent('li'));

        if (_this.options.closeOnClick) {
          var $body = $('body');
          $body.off('.zf.drilldown').on('click.zf.drilldown', function (e) {
            if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target)) {
              return;
            }
            e.preventDefault();
            _this._hideAll();
            $body.off('.zf.drilldown');
          });
        }
      });
      this.$element.on('mutateme.zf.trigger', this._resize.bind(this));
    }

    /**
     * Adds event handlers to the menu element.
     * @function
     * @private
     */
    _registerEvents() {
      if (this.options.scrollTop) {
        this._bindHandler = this._scrollTop.bind(this);
        this.$element.on('open.zf.drilldown hide.zf.drilldown closed.zf.drilldown', this._bindHandler);
      }
    }

    /**
     * Scroll to Top of Element or data-scroll-top-element
     * @function
     * @fires Drilldown#scrollme
     */
    _scrollTop() {
      var _this = this;
      var $scrollTopElement = _this.options.scrollTopElement != '' ? $(_this.options.scrollTopElement) : _this.$element,
          scrollPos = parseInt($scrollTopElement.offset().top + _this.options.scrollTopOffset);
      $('html, body').stop(true).animate({ scrollTop: scrollPos }, _this.options.animationDuration, _this.options.animationEasing, function () {
        /**
          * Fires after the menu has scrolled
          * @event Drilldown#scrollme
          */
        if (this === $('html')[0]) _this.$element.trigger('scrollme.zf.drilldown');
      });
    }

    /**
     * Adds keydown event listener to `li`'s in the menu.
     * @private
     */
    _keyboardEvents() {
      var _this = this;

      this.$menuItems.add(this.$element.find('.js-drilldown-back > a, .is-submenu-parent-item > a')).on('keydown.zf.drilldown', function (e) {
        var $element = $(this),
            $elements = $element.parent('li').parent('ul').children('li').children('a'),
            $prevElement,
            $nextElement;

        $elements.each(function (i) {
          if ($(this).is($element)) {
            $prevElement = $elements.eq(Math.max(0, i - 1));
            $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
            return;
          }
        });

        Foundation.Keyboard.handleKey(e, 'Drilldown', {
          next: function () {
            if ($element.is(_this.$submenuAnchors)) {
              _this._show($element.parent('li'));
              $element.parent('li').one(Foundation.transitionend($element), function () {
                $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
              });
              return true;
            }
          },
          previous: function () {
            _this._hide($element.parent('li').parent('ul'));
            $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
              setTimeout(function () {
                $element.parent('li').parent('ul').parent('li').children('a').first().focus();
              }, 1);
            });
            return true;
          },
          up: function () {
            $prevElement.focus();
            return true;
          },
          down: function () {
            $nextElement.focus();
            return true;
          },
          close: function () {
            _this._back();
            //_this.$menuItems.first().focus(); // focus to first element
          },
          open: function () {
            if (!$element.is(_this.$menuItems)) {
              // not menu item means back button
              _this._hide($element.parent('li').parent('ul'));
              $element.parent('li').parent('ul').one(Foundation.transitionend($element), function () {
                setTimeout(function () {
                  $element.parent('li').parent('ul').parent('li').children('a').first().focus();
                }, 1);
              });
              return true;
            } else if ($element.is(_this.$submenuAnchors)) {
              _this._show($element.parent('li'));
              $element.parent('li').one(Foundation.transitionend($element), function () {
                $element.parent('li').find('ul li a').filter(_this.$menuItems).first().focus();
              });
              return true;
            }
          },
          handled: function (preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
            e.stopImmediatePropagation();
          }
        });
      }); // end keyboardAccess
    }

    /**
     * Closes all open elements, and returns to root menu.
     * @function
     * @fires Drilldown#closed
     */
    _hideAll() {
      var $elem = this.$element.find('.is-drilldown-submenu.is-active').addClass('is-closing');
      if (this.options.autoHeight) this.$wrapper.css({ height: $elem.parent().closest('ul').data('calcHeight') });
      $elem.one(Foundation.transitionend($elem), function (e) {
        $elem.removeClass('is-active is-closing');
      });
      /**
       * Fires when the menu is fully closed.
       * @event Drilldown#closed
       */
      this.$element.trigger('closed.zf.drilldown');
    }

    /**
     * Adds event listener for each `back` button, and closes open menus.
     * @function
     * @fires Drilldown#back
     * @param {jQuery} $elem - the current sub-menu to add `back` event.
     */
    _back($elem) {
      var _this = this;
      $elem.off('click.zf.drilldown');
      $elem.children('.js-drilldown-back').on('click.zf.drilldown', function (e) {
        e.stopImmediatePropagation();
        // console.log('mouseup on back');
        _this._hide($elem);

        // If there is a parent submenu, call show
        let parentSubMenu = $elem.parent('li').parent('ul').parent('li');
        if (parentSubMenu.length) {
          _this._show(parentSubMenu);
        }
      });
    }

    /**
     * Adds event listener to menu items w/o submenus to close open menus on click.
     * @function
     * @private
     */
    _menuLinkEvents() {
      var _this = this;
      this.$menuItems.not('.is-drilldown-submenu-parent').off('click.zf.drilldown').on('click.zf.drilldown', function (e) {
        // e.stopImmediatePropagation();
        setTimeout(function () {
          _this._hideAll();
        }, 0);
      });
    }

    /**
     * Opens a submenu.
     * @function
     * @fires Drilldown#open
     * @param {jQuery} $elem - the current element with a submenu to open, i.e. the `li` tag.
     */
    _show($elem) {
      if (this.options.autoHeight) this.$wrapper.css({ height: $elem.children('[data-submenu]').data('calcHeight') });
      $elem.attr('aria-expanded', true);
      $elem.children('[data-submenu]').addClass('is-active').attr('aria-hidden', false);
      /**
       * Fires when the submenu has opened.
       * @event Drilldown#open
       */
      this.$element.trigger('open.zf.drilldown', [$elem]);
    }

    /**
     * Hides a submenu
     * @function
     * @fires Drilldown#hide
     * @param {jQuery} $elem - the current sub-menu to hide, i.e. the `ul` tag.
     */
    _hide($elem) {
      if (this.options.autoHeight) this.$wrapper.css({ height: $elem.parent().closest('ul').data('calcHeight') });
      var _this = this;
      $elem.parent('li').attr('aria-expanded', false);
      $elem.attr('aria-hidden', true).addClass('is-closing');
      $elem.addClass('is-closing').one(Foundation.transitionend($elem), function () {
        $elem.removeClass('is-active is-closing');
        $elem.blur();
      });
      /**
       * Fires when the submenu has closed.
       * @event Drilldown#hide
       */
      $elem.trigger('hide.zf.drilldown', [$elem]);
    }

    /**
     * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
     * Prevents content jumping.
     * @function
     * @private
     */
    _getMaxDims() {
      var maxHeight = 0,
          result = {},
          _this = this;
      this.$submenus.add(this.$element).each(function () {
        var numOfElems = $(this).children('li').length;
        var height = Foundation.Box.GetDimensions(this).height;
        maxHeight = height > maxHeight ? height : maxHeight;
        if (_this.options.autoHeight) {
          $(this).data('calcHeight', height);
          if (!$(this).hasClass('is-drilldown-submenu')) result['height'] = height;
        }
      });

      if (!this.options.autoHeight) result['min-height'] = `${ maxHeight }px`;

      result['max-width'] = `${ this.$element[0].getBoundingClientRect().width }px`;

      return result;
    }

    /**
     * Destroys the Drilldown Menu
     * @function
     */
    destroy() {
      if (this.options.scrollTop) this.$element.off('.zf.drilldown', this._bindHandler);
      this._hideAll();
      this.$element.off('mutateme.zf.trigger');
      Foundation.Nest.Burn(this.$element, 'drilldown');
      this.$element.unwrap().find('.js-drilldown-back, .is-submenu-parent-item').remove().end().find('.is-active, .is-closing, .is-drilldown-submenu').removeClass('is-active is-closing is-drilldown-submenu').end().find('[data-submenu]').removeAttr('aria-hidden tabindex role');
      this.$submenuAnchors.each(function () {
        $(this).off('.zf.drilldown');
      });

      this.$submenus.removeClass('drilldown-submenu-cover-previous');

      this.$element.find('a').each(function () {
        var $link = $(this);
        $link.removeAttr('tabindex');
        if ($link.data('savedHref')) {
          $link.attr('href', $link.data('savedHref')).removeData('savedHref');
        } else {
          return;
        }
      });
      Foundation.unregisterPlugin(this);
    }
  }

  Drilldown.defaults = {
    /**
     * Markup used for JS generated back button. Prepended  or appended (see backButtonPosition) to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\li><\a>Back<\/a><\/li>'
     */
    backButton: '<li class="js-drilldown-back"><a tabindex="0">Back</a></li>',
    /**
     * Position the back button either at the top or bottom of drilldown submenus.
     * @option
     * @example bottom
     */
    backButtonPosition: 'top',
    /**
     * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\div class="is-drilldown"><\/div>'
     */
    wrapper: '<div></div>',
    /**
     * Adds the parent link to the submenu.
     * @option
     * @example false
     */
    parentLink: false,
    /**
     * Allow the menu to return to root list on body click.
     * @option
     * @example false
     */
    closeOnClick: false,
    /**
     * Allow the menu to auto adjust height.
     * @option
     * @example false
     */
    autoHeight: false,
    /**
     * Animate the auto adjust height.
     * @option
     * @example false
     */
    animateHeight: false,
    /**
     * Scroll to the top of the menu after opening a submenu or navigating back using the menu back button
     * @option
     * @example false
     */
    scrollTop: false,
    /**
     * String jquery selector (for example 'body') of element to take offset().top from, if empty string the drilldown menu offset().top is taken
     * @option
     * @example ''
     */
    scrollTopElement: '',
    /**
     * ScrollTop offset
     * @option
     * @example 100
     */
    scrollTopOffset: 0,
    /**
     * Scroll animation duration
     * @option
     * @example 500
     */
    animationDuration: 500,
    /**
     * Scroll animation easing
     * @option
     * @example 'swing'
     */
    animationEasing: 'swing'
    // holdOpen: false
  };

  // Window exports
  Foundation.plugin(Drilldown, 'Drilldown');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Dropdown module.
   * @module foundation.dropdown
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   */

  class Dropdown {
    /**
     * Creates a new instance of a dropdown.
     * @class
     * @param {jQuery} element - jQuery object to make into a dropdown.
     *        Object should be of the dropdown panel, rather than its anchor.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Dropdown');
      Foundation.Keyboard.register('Dropdown', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
     * @function
     * @private
     */
    _init() {
      var $id = this.$element.attr('id');

      this.$anchor = $(`[data-toggle="${ $id }"]`).length ? $(`[data-toggle="${ $id }"]`) : $(`[data-open="${ $id }"]`);
      this.$anchor.attr({
        'aria-controls': $id,
        'data-is-focus': false,
        'data-yeti-box': $id,
        'aria-haspopup': true,
        'aria-expanded': false

      });

      if (this.options.parentClass) {
        this.$parent = this.$element.parents('.' + this.options.parentClass);
      } else {
        this.$parent = null;
      }
      this.options.positionClass = this.getPositionClass();
      this.counter = 4;
      this.usedPositions = [];
      this.$element.attr({
        'aria-hidden': 'true',
        'data-yeti-box': $id,
        'data-resize': $id,
        'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
      });
      this._events();
    }

    /**
     * Helper function to determine current orientation of dropdown pane.
     * @function
     * @returns {String} position - string value of a position class.
     */
    getPositionClass() {
      var verticalPosition = this.$element[0].className.match(/(top|left|right|bottom)/g);
      verticalPosition = verticalPosition ? verticalPosition[0] : '';
      var horizontalPosition = /float-(\S+)/.exec(this.$anchor[0].className);
      horizontalPosition = horizontalPosition ? horizontalPosition[1] : '';
      var position = horizontalPosition ? horizontalPosition + ' ' + verticalPosition : verticalPosition;

      return position;
    }

    /**
     * Adjusts the dropdown panes orientation by adding/removing positioning classes.
     * @function
     * @private
     * @param {String} position - position class to remove.
     */
    _reposition(position) {
      this.usedPositions.push(position ? position : 'bottom');
      //default, try switching to opposite side
      if (!position && this.usedPositions.indexOf('top') < 0) {
        this.$element.addClass('top');
      } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
        this.$element.removeClass(position);
      } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
        this.$element.removeClass(position).addClass('right');
      } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
        this.$element.removeClass(position).addClass('left');
      }

      //if default change didn't work, try bottom or left first
      else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
          this.$element.addClass('left');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
          this.$element.removeClass(position).addClass('left');
        } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
          this.$element.removeClass(position);
        }
        //if nothing cleared, set to bottom
        else {
            this.$element.removeClass(position);
          }
      this.classChanged = true;
      this.counter--;
    }

    /**
     * Sets the position and orientation of the dropdown pane, checks for collisions.
     * Recursively calls itself if a collision is detected, with a new position class.
     * @function
     * @private
     */
    _setPosition() {
      if (this.$anchor.attr('aria-expanded') === 'false') {
        return false;
      }
      var position = this.getPositionClass(),
          $eleDims = Foundation.Box.GetDimensions(this.$element),
          $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
          _this = this,
          direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
          param = direction === 'top' ? 'height' : 'width',
          offset = param === 'height' ? this.options.vOffset : this.options.hOffset;

      if ($eleDims.width >= $eleDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.$element, this.$parent)) {
        var newWidth = $eleDims.windowDims.width,
            parentHOffset = 0;
        if (this.$parent) {
          var $parentDims = Foundation.Box.GetDimensions(this.$parent),
              parentHOffset = $parentDims.offset.left;
          if ($parentDims.width < newWidth) {
            newWidth = $parentDims.width;
          }
        }

        this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset + parentHOffset, true)).css({
          'width': newWidth - this.options.hOffset * 2,
          'height': 'auto'
        });
        this.classChanged = true;
        return false;
      }

      this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

      while (!Foundation.Box.ImNotTouchingYou(this.$element, this.$parent, true) && this.counter) {
        this._reposition(position);
        this._setPosition();
      }
    }

    /**
     * Adds event listeners to the element utilizing the triggers utility library.
     * @function
     * @private
     */
    _events() {
      var _this = this;
      this.$element.on({
        'open.zf.trigger': this.open.bind(this),
        'close.zf.trigger': this.close.bind(this),
        'toggle.zf.trigger': this.toggle.bind(this),
        'resizeme.zf.trigger': this._setPosition.bind(this)
      });

      if (this.options.hover) {
        this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
          var bodyData = $('body').data();
          if (typeof bodyData.whatinput === 'undefined' || bodyData.whatinput === 'mouse') {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }
        }).on('mouseleave.zf.dropdown', function () {
          clearTimeout(_this.timeout);
          _this.timeout = setTimeout(function () {
            _this.close();
            _this.$anchor.data('hover', false);
          }, _this.options.hoverDelay);
        });
        if (this.options.hoverPane) {
          this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown').on('mouseenter.zf.dropdown', function () {
            clearTimeout(_this.timeout);
          }).on('mouseleave.zf.dropdown', function () {
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function () {
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
        }
      }
      this.$anchor.add(this.$element).on('keydown.zf.dropdown', function (e) {

        var $target = $(this),
            visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

        Foundation.Keyboard.handleKey(e, 'Dropdown', {
          open: function () {
            if ($target.is(_this.$anchor)) {
              _this.open();
              _this.$element.attr('tabindex', -1).focus();
              e.preventDefault();
            }
          },
          close: function () {
            _this.close();
            _this.$anchor.focus();
          }
        });
      });
    }

    /**
     * Adds an event handler to the body to close any dropdowns on a click.
     * @function
     * @private
     */
    _addBodyHandler() {
      var $body = $(document.body).not(this.$element),
          _this = this;
      $body.off('click.zf.dropdown').on('click.zf.dropdown', function (e) {
        if (_this.$anchor.is(e.target) || _this.$anchor.find(e.target).length) {
          return;
        }
        if (_this.$element.find(e.target).length) {
          return;
        }
        _this.close();
        $body.off('click.zf.dropdown');
      });
    }

    /**
     * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
     * @function
     * @fires Dropdown#closeme
     * @fires Dropdown#show
     */
    open() {
      // var _this = this;
      /**
       * Fires to close other open dropdowns
       * @event Dropdown#closeme
       */
      this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
      this.$anchor.addClass('hover').attr({ 'aria-expanded': true });
      // this.$element/*.show()*/;
      this._setPosition();
      this.$element.addClass('is-open').attr({ 'aria-hidden': false });

      if (this.options.autoFocus) {
        var $focusable = Foundation.Keyboard.findFocusable(this.$element);
        if ($focusable.length) {
          $focusable.eq(0).focus();
        }
      }

      if (this.options.closeOnClick) {
        this._addBodyHandler();
      }

      if (this.options.trapFocus) {
        Foundation.Keyboard.trapFocus(this.$element);
      }

      /**
       * Fires once the dropdown is visible.
       * @event Dropdown#show
       */
      this.$element.trigger('show.zf.dropdown', [this.$element]);
    }

    /**
     * Closes the open dropdown pane.
     * @function
     * @fires Dropdown#hide
     */
    close() {
      if (!this.$element.hasClass('is-open')) {
        return false;
      }
      this.$element.removeClass('is-open').attr({ 'aria-hidden': true });

      this.$anchor.removeClass('hover').attr('aria-expanded', false);

      if (this.classChanged) {
        var curPositionClass = this.getPositionClass();
        if (curPositionClass) {
          this.$element.removeClass(curPositionClass);
        }
        this.$element.addClass(this.options.positionClass)
        /*.hide()*/.css({ height: '', width: '' });
        this.classChanged = false;
        this.counter = 4;
        this.usedPositions.length = 0;
      }
      this.$element.trigger('hide.zf.dropdown', [this.$element]);

      if (this.options.trapFocus) {
        Foundation.Keyboard.releaseFocus(this.$element);
      }
    }

    /**
     * Toggles the dropdown pane's visibility.
     * @function
     */
    toggle() {
      if (this.$element.hasClass('is-open')) {
        if (this.$anchor.data('hover')) return;
        this.close();
      } else {
        this.open();
      }
    }

    /**
     * Destroys the dropdown.
     * @function
     */
    destroy() {
      this.$element.off('.zf.trigger').hide();
      this.$anchor.off('.zf.dropdown');

      Foundation.unregisterPlugin(this);
    }
  }

  Dropdown.defaults = {
    /**
     * Class that designates bounding container of Dropdown (Default: window)
     * @option
     * @example 'dropdown-parent'
     */
    parentClass: null,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false,
    /**
     * Allows a click on the body to close the dropdown.
     * @option
     * @example false
     */
    closeOnClick: false
  };

  // Window exports
  Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * DropdownMenu module.
   * @module foundation.dropdown-menu
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.nest
   */

  class DropdownMenu {
    /**
     * Creates a new instance of DropdownMenu.
     * @class
     * @fires DropdownMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

      Foundation.Nest.Feather(this.$element, 'dropdown');
      this._init();

      Foundation.registerPlugin(this, 'DropdownMenu');
      Foundation.Keyboard.register('DropdownMenu', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'up',
        'ARROW_DOWN': 'down',
        'ARROW_LEFT': 'previous',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the plugin, and calls _prepareMenu
     * @private
     * @function
     */
    _init() {
      var subs = this.$element.find('li.is-dropdown-submenu-parent');
      this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

      this.$menuItems = this.$element.find('[role="menuitem"]');
      this.$tabs = this.$element.children('[role="menuitem"]');
      this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

      if (this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right' || Foundation.rtl() || this.$element.parents('.top-bar-right').is('*')) {
        this.options.alignment = 'right';
        subs.addClass('opens-left');
      } else {
        subs.addClass('opens-right');
      }
      this.changed = false;
      this._events();
    }

    _isVertical() {
      return this.$tabs.css('display') === 'block';
    }

    /**
     * Adds event listeners to elements within the menu
     * @private
     * @function
     */
    _events() {
      var _this = this,
          hasTouch = 'ontouchstart' in window || typeof window.ontouchstart !== 'undefined',
          parClass = 'is-dropdown-submenu-parent';

      // used for onClick and in the keyboard handlers
      var handleClickFn = function (e) {
        var $elem = $(e.target).parentsUntil('ul', `.${ parClass }`),
            hasSub = $elem.hasClass(parClass),
            hasClicked = $elem.attr('data-is-click') === 'true',
            $sub = $elem.children('.is-dropdown-submenu');

        if (hasSub) {
          if (hasClicked) {
            if (!_this.options.closeOnClick || !_this.options.clickOpen && !hasTouch || _this.options.forceFollow && hasTouch) {
              return;
            } else {
              e.stopImmediatePropagation();
              e.preventDefault();
              _this._hide($elem);
            }
          } else {
            e.preventDefault();
            e.stopImmediatePropagation();
            _this._show($sub);
            $elem.add($elem.parentsUntil(_this.$element, `.${ parClass }`)).attr('data-is-click', true);
          }
        }
      };

      if (this.options.clickOpen || hasTouch) {
        this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', handleClickFn);
      }

      // Handle Leaf element Clicks
      if (_this.options.closeOnClickInside) {
        this.$menuItems.on('click.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
          var $elem = $(this),
              hasSub = $elem.hasClass(parClass);
          if (!hasSub) {
            _this._hide();
          }
        });
      }

      if (!this.options.disableHover) {
        this.$menuItems.on('mouseenter.zf.dropdownmenu', function (e) {
          var $elem = $(this),
              hasSub = $elem.hasClass(parClass);

          if (hasSub) {
            clearTimeout($elem.data('_delay'));
            $elem.data('_delay', setTimeout(function () {
              _this._show($elem.children('.is-dropdown-submenu'));
            }, _this.options.hoverDelay));
          }
        }).on('mouseleave.zf.dropdownmenu', function (e) {
          var $elem = $(this),
              hasSub = $elem.hasClass(parClass);
          if (hasSub && _this.options.autoclose) {
            if ($elem.attr('data-is-click') === 'true' && _this.options.clickOpen) {
              return false;
            }

            clearTimeout($elem.data('_delay'));
            $elem.data('_delay', setTimeout(function () {
              _this._hide($elem);
            }, _this.options.closingTime));
          }
        });
      }
      this.$menuItems.on('keydown.zf.dropdownmenu', function (e) {
        var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
            isTab = _this.$tabs.index($element) > -1,
            $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
            $prevElement,
            $nextElement;

        $elements.each(function (i) {
          if ($(this).is($element)) {
            $prevElement = $elements.eq(i - 1);
            $nextElement = $elements.eq(i + 1);
            return;
          }
        });

        var nextSibling = function () {
          if (!$element.is(':last-child')) {
            $nextElement.children('a:first').focus();
            e.preventDefault();
          }
        },
            prevSibling = function () {
          $prevElement.children('a:first').focus();
          e.preventDefault();
        },
            openSub = function () {
          var $sub = $element.children('ul.is-dropdown-submenu');
          if ($sub.length) {
            _this._show($sub);
            $element.find('li > a:first').focus();
            e.preventDefault();
          } else {
            return;
          }
        },
            closeSub = function () {
          //if ($element.is(':first-child')) {
          var close = $element.parent('ul').parent('li');
          close.children('a:first').focus();
          _this._hide(close);
          e.preventDefault();
          //}
        };
        var functions = {
          open: openSub,
          close: function () {
            _this._hide(_this.$element);
            _this.$menuItems.find('a:first').focus(); // focus to first element
            e.preventDefault();
          },
          handled: function () {
            e.stopImmediatePropagation();
          }
        };

        if (isTab) {
          if (_this._isVertical()) {
            // vertical menu
            if (Foundation.rtl()) {
              // right aligned
              $.extend(functions, {
                down: nextSibling,
                up: prevSibling,
                next: closeSub,
                previous: openSub
              });
            } else {
              // left aligned
              $.extend(functions, {
                down: nextSibling,
                up: prevSibling,
                next: openSub,
                previous: closeSub
              });
            }
          } else {
            // horizontal menu
            if (Foundation.rtl()) {
              // right aligned
              $.extend(functions, {
                next: prevSibling,
                previous: nextSibling,
                down: openSub,
                up: closeSub
              });
            } else {
              // left aligned
              $.extend(functions, {
                next: nextSibling,
                previous: prevSibling,
                down: openSub,
                up: closeSub
              });
            }
          }
        } else {
          // not tabs -> one sub
          if (Foundation.rtl()) {
            // right aligned
            $.extend(functions, {
              next: closeSub,
              previous: openSub,
              down: nextSibling,
              up: prevSibling
            });
          } else {
            // left aligned
            $.extend(functions, {
              next: openSub,
              previous: closeSub,
              down: nextSibling,
              up: prevSibling
            });
          }
        }
        Foundation.Keyboard.handleKey(e, 'DropdownMenu', functions);
      });
    }

    /**
     * Adds an event handler to the body to close any dropdowns on a click.
     * @function
     * @private
     */
    _addBodyHandler() {
      var $body = $(document.body),
          _this = this;
      $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu').on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function (e) {
        var $link = _this.$element.find(e.target);
        if ($link.length) {
          return;
        }

        _this._hide();
        $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
      });
    }

    /**
     * Opens a dropdown pane, and checks for collisions first.
     * @param {jQuery} $sub - ul element that is a submenu to show
     * @function
     * @private
     * @fires DropdownMenu#show
     */
    _show($sub) {
      var idx = this.$tabs.index(this.$tabs.filter(function (i, el) {
        return $(el).find($sub).length > 0;
      }));
      var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
      this._hide($sibs, idx);
      $sub.css('visibility', 'hidden').addClass('js-dropdown-active').parent('li.is-dropdown-submenu-parent').addClass('is-active');
      var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
      if (!clear) {
        var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
            $parentLi = $sub.parent('.is-dropdown-submenu-parent');
        $parentLi.removeClass(`opens${ oldClass }`).addClass(`opens-${ this.options.alignment }`);
        clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
        if (!clear) {
          $parentLi.removeClass(`opens-${ this.options.alignment }`).addClass('opens-inner');
        }
        this.changed = true;
      }
      $sub.css('visibility', '');
      if (this.options.closeOnClick) {
        this._addBodyHandler();
      }
      /**
       * Fires when the new dropdown pane is visible.
       * @event DropdownMenu#show
       */
      this.$element.trigger('show.zf.dropdownmenu', [$sub]);
    }

    /**
     * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
     * @function
     * @param {jQuery} $elem - element with a submenu to hide
     * @param {Number} idx - index of the $tabs collection to hide
     * @private
     */
    _hide($elem, idx) {
      var $toClose;
      if ($elem && $elem.length) {
        $toClose = $elem;
      } else if (idx !== undefined) {
        $toClose = this.$tabs.not(function (i, el) {
          return i === idx;
        });
      } else {
        $toClose = this.$element;
      }
      var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

      if (somethingToClose) {
        $toClose.find('li.is-active').add($toClose).attr({
          'data-is-click': false
        }).removeClass('is-active');

        $toClose.find('ul.js-dropdown-active').removeClass('js-dropdown-active');

        if (this.changed || $toClose.find('opens-inner').length) {
          var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
          $toClose.find('li.is-dropdown-submenu-parent').add($toClose).removeClass(`opens-inner opens-${ this.options.alignment }`).addClass(`opens-${ oldClass }`);
          this.changed = false;
        }
        /**
         * Fires when the open menus are closed.
         * @event DropdownMenu#hide
         */
        this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
      }
    }

    /**
     * Destroys the plugin.
     * @function
     */
    destroy() {
      this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click').removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
      $(document.body).off('.zf.dropdownmenu');
      Foundation.Nest.Burn(this.$element, 'dropdown');
      Foundation.unregisterPlugin(this);
    }
  }

  /**
   * Default settings for plugin
   */
  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allow clicks on leaf anchor links to close any open submenus.
     * @option
     * @example true
     */
    closeOnClickInside: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };

  // Window exports
  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Equalizer module.
   * @module foundation.equalizer
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader if equalizer contains images
   */

  class Equalizer {
    /**
     * Creates a new instance of Equalizer.
     * @class
     * @fires Equalizer#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Equalizer.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Equalizer');
    }

    /**
     * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
     * @private
     */
    _init() {
      var eqId = this.$element.attr('data-equalizer') || '';
      var $watched = this.$element.find(`[data-equalizer-watch="${ eqId }"]`);

      this.$watched = $watched.length ? $watched : this.$element.find('[data-equalizer-watch]');
      this.$element.attr('data-resize', eqId || Foundation.GetYoDigits(6, 'eq'));
      this.$element.attr('data-mutate', eqId || Foundation.GetYoDigits(6, 'eq'));

      this.hasNested = this.$element.find('[data-equalizer]').length > 0;
      this.isNested = this.$element.parentsUntil(document.body, '[data-equalizer]').length > 0;
      this.isOn = false;
      this._bindHandler = {
        onResizeMeBound: this._onResizeMe.bind(this),
        onPostEqualizedBound: this._onPostEqualized.bind(this)
      };

      var imgs = this.$element.find('img');
      var tooSmall;
      if (this.options.equalizeOn) {
        tooSmall = this._checkMQ();
        $(window).on('changed.zf.mediaquery', this._checkMQ.bind(this));
      } else {
        this._events();
      }
      if (tooSmall !== undefined && tooSmall === false || tooSmall === undefined) {
        if (imgs.length) {
          Foundation.onImagesLoaded(imgs, this._reflow.bind(this));
        } else {
          this._reflow();
        }
      }
    }

    /**
     * Removes event listeners if the breakpoint is too small.
     * @private
     */
    _pauseEvents() {
      this.isOn = false;
      this.$element.off({
        '.zf.equalizer': this._bindHandler.onPostEqualizedBound,
        'resizeme.zf.trigger': this._bindHandler.onResizeMeBound,
        'mutateme.zf.trigger': this._bindHandler.onResizeMeBound
      });
    }

    /**
     * function to handle $elements resizeme.zf.trigger, with bound this on _bindHandler.onResizeMeBound
     * @private
     */
    _onResizeMe(e) {
      this._reflow();
    }

    /**
     * function to handle $elements postequalized.zf.equalizer, with bound this on _bindHandler.onPostEqualizedBound
     * @private
     */
    _onPostEqualized(e) {
      if (e.target !== this.$element[0]) {
        this._reflow();
      }
    }

    /**
     * Initializes events for Equalizer.
     * @private
     */
    _events() {
      var _this = this;
      this._pauseEvents();
      if (this.hasNested) {
        this.$element.on('postequalized.zf.equalizer', this._bindHandler.onPostEqualizedBound);
      } else {
        this.$element.on('resizeme.zf.trigger', this._bindHandler.onResizeMeBound);
        this.$element.on('mutateme.zf.trigger', this._bindHandler.onResizeMeBound);
      }
      this.isOn = true;
    }

    /**
     * Checks the current breakpoint to the minimum required size.
     * @private
     */
    _checkMQ() {
      var tooSmall = !Foundation.MediaQuery.is(this.options.equalizeOn);
      if (tooSmall) {
        if (this.isOn) {
          this._pauseEvents();
          this.$watched.css('height', 'auto');
        }
      } else {
        if (!this.isOn) {
          this._events();
        }
      }
      return tooSmall;
    }

    /**
     * A noop version for the plugin
     * @private
     */
    _killswitch() {
      return;
    }

    /**
     * Calls necessary functions to update Equalizer upon DOM change
     * @private
     */
    _reflow() {
      if (!this.options.equalizeOnStack) {
        if (this._isStacked()) {
          this.$watched.css('height', 'auto');
          return false;
        }
      }
      if (this.options.equalizeByRow) {
        this.getHeightsByRow(this.applyHeightByRow.bind(this));
      } else {
        this.getHeights(this.applyHeight.bind(this));
      }
    }

    /**
     * Manually determines if the first 2 elements are *NOT* stacked.
     * @private
     */
    _isStacked() {
      if (!this.$watched[0] || !this.$watched[1]) {
        return true;
      }
      return this.$watched[0].getBoundingClientRect().top !== this.$watched[1].getBoundingClientRect().top;
    }

    /**
     * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
     * @param {Function} cb - A non-optional callback to return the heights array to.
     * @returns {Array} heights - An array of heights of children within Equalizer container
     */
    getHeights(cb) {
      var heights = [];
      for (var i = 0, len = this.$watched.length; i < len; i++) {
        this.$watched[i].style.height = 'auto';
        heights.push(this.$watched[i].offsetHeight);
      }
      cb(heights);
    }

    /**
     * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
     * @param {Function} cb - A non-optional callback to return the heights array to.
     * @returns {Array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
     */
    getHeightsByRow(cb) {
      var lastElTopOffset = this.$watched.length ? this.$watched.first().offset().top : 0,
          groups = [],
          group = 0;
      //group by Row
      groups[group] = [];
      for (var i = 0, len = this.$watched.length; i < len; i++) {
        this.$watched[i].style.height = 'auto';
        //maybe could use this.$watched[i].offsetTop
        var elOffsetTop = $(this.$watched[i]).offset().top;
        if (elOffsetTop != lastElTopOffset) {
          group++;
          groups[group] = [];
          lastElTopOffset = elOffsetTop;
        }
        groups[group].push([this.$watched[i], this.$watched[i].offsetHeight]);
      }

      for (var j = 0, ln = groups.length; j < ln; j++) {
        var heights = $(groups[j]).map(function () {
          return this[1];
        }).get();
        var max = Math.max.apply(null, heights);
        groups[j].push(max);
      }
      cb(groups);
    }

    /**
     * Changes the CSS height property of each child in an Equalizer parent to match the tallest
     * @param {array} heights - An array of heights of children within Equalizer container
     * @fires Equalizer#preequalized
     * @fires Equalizer#postequalized
     */
    applyHeight(heights) {
      var max = Math.max.apply(null, heights);
      /**
       * Fires before the heights are applied
       * @event Equalizer#preequalized
       */
      this.$element.trigger('preequalized.zf.equalizer');

      this.$watched.css('height', max);

      /**
       * Fires when the heights have been applied
       * @event Equalizer#postequalized
       */
      this.$element.trigger('postequalized.zf.equalizer');
    }

    /**
     * Changes the CSS height property of each child in an Equalizer parent to match the tallest by row
     * @param {array} groups - An array of heights of children within Equalizer container grouped by row with element,height and max as last child
     * @fires Equalizer#preequalized
     * @fires Equalizer#preequalizedrow
     * @fires Equalizer#postequalizedrow
     * @fires Equalizer#postequalized
     */
    applyHeightByRow(groups) {
      /**
       * Fires before the heights are applied
       */
      this.$element.trigger('preequalized.zf.equalizer');
      for (var i = 0, len = groups.length; i < len; i++) {
        var groupsILength = groups[i].length,
            max = groups[i][groupsILength - 1];
        if (groupsILength <= 2) {
          $(groups[i][0][0]).css({ 'height': 'auto' });
          continue;
        }
        /**
          * Fires before the heights per row are applied
          * @event Equalizer#preequalizedrow
          */
        this.$element.trigger('preequalizedrow.zf.equalizer');
        for (var j = 0, lenJ = groupsILength - 1; j < lenJ; j++) {
          $(groups[i][j][0]).css({ 'height': max });
        }
        /**
          * Fires when the heights per row have been applied
          * @event Equalizer#postequalizedrow
          */
        this.$element.trigger('postequalizedrow.zf.equalizer');
      }
      /**
       * Fires when the heights have been applied
       */
      this.$element.trigger('postequalized.zf.equalizer');
    }

    /**
     * Destroys an instance of Equalizer.
     * @function
     */
    destroy() {
      this._pauseEvents();
      this.$watched.css('height', 'auto');

      Foundation.unregisterPlugin(this);
    }
  }

  /**
   * Default settings for plugin
   */
  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: false,
    /**
     * Enable height equalization row by row.
     * @option
     * @example false
     */
    equalizeByRow: false,
    /**
     * String representing the minimum breakpoint size the plugin should equalize heights on.
     * @option
     * @example 'medium'
     */
    equalizeOn: ''
  };

  // Window exports
  Foundation.plugin(Equalizer, 'Equalizer');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Interchange module.
   * @module foundation.interchange
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.timerAndImageLoader
   */

  class Interchange {
    /**
     * Creates a new instance of Interchange.
     * @class
     * @fires Interchange#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Interchange.defaults, options);
      this.rules = [];
      this.currentPath = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Interchange');
    }

    /**
     * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
     * @function
     * @private
     */
    _init() {
      this._addBreakpoints();
      this._generateRules();
      this._reflow();
    }

    /**
     * Initializes events for Interchange.
     * @function
     * @private
     */
    _events() {
      $(window).on('resize.zf.interchange', Foundation.util.throttle(() => {
        this._reflow();
      }, 50));
    }

    /**
     * Calls necessary functions to update Interchange upon DOM change
     * @function
     * @private
     */
    _reflow() {
      var match;

      // Iterate through each rule, but only save the last match
      for (var i in this.rules) {
        if (this.rules.hasOwnProperty(i)) {
          var rule = this.rules[i];
          if (window.matchMedia(rule.query).matches) {
            match = rule;
          }
        }
      }

      if (match) {
        this.replace(match.path);
      }
    }

    /**
     * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
     * @function
     * @private
     */
    _addBreakpoints() {
      for (var i in Foundation.MediaQuery.queries) {
        if (Foundation.MediaQuery.queries.hasOwnProperty(i)) {
          var query = Foundation.MediaQuery.queries[i];
          Interchange.SPECIAL_QUERIES[query.name] = query.value;
        }
      }
    }

    /**
     * Checks the Interchange element for the provided media query + content pairings
     * @function
     * @private
     * @param {Object} element - jQuery object that is an Interchange instance
     * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
     */
    _generateRules(element) {
      var rulesList = [];
      var rules;

      if (this.options.rules) {
        rules = this.options.rules;
      } else {
        rules = this.$element.data('interchange').match(/\[.*?\]/g);
      }

      for (var i in rules) {
        if (rules.hasOwnProperty(i)) {
          var rule = rules[i].slice(1, -1).split(', ');
          var path = rule.slice(0, -1).join('');
          var query = rule[rule.length - 1];

          if (Interchange.SPECIAL_QUERIES[query]) {
            query = Interchange.SPECIAL_QUERIES[query];
          }

          rulesList.push({
            path: path,
            query: query
          });
        }
      }

      this.rules = rulesList;
    }

    /**
     * Update the `src` property of an image, or change the HTML of a container, to the specified path.
     * @function
     * @param {String} path - Path to the image or HTML partial.
     * @fires Interchange#replaced
     */
    replace(path) {
      if (this.currentPath === path) return;

      var _this = this,
          trigger = 'replaced.zf.interchange';

      // Replacing images
      if (this.$element[0].nodeName === 'IMG') {
        this.$element.attr('src', path).on('load', function () {
          _this.currentPath = path;
        }).trigger(trigger);
      }
      // Replacing background images
      else if (path.match(/\.(gif|jpg|jpeg|png|svg|tiff)([?#].*)?/i)) {
          this.$element.css({ 'background-image': 'url(' + path + ')' }).trigger(trigger);
        }
        // Replacing HTML
        else {
            $.get(path, function (response) {
              _this.$element.html(response).trigger(trigger);
              $(response).foundation();
              _this.currentPath = path;
            });
          }

      /**
       * Fires when content in an Interchange element is done being loaded.
       * @event Interchange#replaced
       */
      // this.$element.trigger('replaced.zf.interchange');
    }

    /**
     * Destroys an instance of interchange.
     * @function
     */
    destroy() {
      //TODO this.
    }
  }

  /**
   * Default settings for plugin
   */
  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  // Window exports
  Foundation.plugin(Interchange, 'Interchange');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Magellan module.
   * @module foundation.magellan
   */

  class Magellan {
    /**
     * Creates a new instance of Magellan.
     * @class
     * @fires Magellan#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Magellan.defaults, this.$element.data(), options);

      this._init();
      this.calcPoints();

      Foundation.registerPlugin(this, 'Magellan');
    }

    /**
     * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
     * @private
     */
    _init() {
      var id = this.$element[0].id || Foundation.GetYoDigits(6, 'magellan');
      var _this = this;
      this.$targets = $('[data-magellan-target]');
      this.$links = this.$element.find('a');
      this.$element.attr({
        'data-resize': id,
        'data-scroll': id,
        'id': id
      });
      this.$active = $();
      this.scrollPos = parseInt(window.pageYOffset, 10);

      this._events();
    }

    /**
     * Calculates an array of pixel values that are the demarcation lines between locations on the page.
     * Can be invoked if new elements are added or the size of a location changes.
     * @function
     */
    calcPoints() {
      var _this = this,
          body = document.body,
          html = document.documentElement;

      this.points = [];
      this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
      this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

      this.$targets.each(function () {
        var $tar = $(this),
            pt = Math.round($tar.offset().top - _this.options.threshold);
        $tar.targetPoint = pt;
        _this.points.push(pt);
      });
    }

    /**
     * Initializes events for Magellan.
     * @private
     */
    _events() {
      var _this = this,
          $body = $('html, body'),
          opts = {
        duration: _this.options.animationDuration,
        easing: _this.options.animationEasing
      };
      $(window).one('load', function () {
        if (_this.options.deepLinking) {
          if (location.hash) {
            _this.scrollToLoc(location.hash);
          }
        }
        _this.calcPoints();
        _this._updateActive();
      });

      this.$element.on({
        'resizeme.zf.trigger': this.reflow.bind(this),
        'scrollme.zf.trigger': this._updateActive.bind(this)
      }).on('click.zf.magellan', 'a[href^="#"]', function (e) {
        e.preventDefault();
        var arrival = this.getAttribute('href');
        _this.scrollToLoc(arrival);
      });
      $(window).on('popstate', function (e) {
        if (_this.options.deepLinking) {
          _this.scrollToLoc(window.location.hash);
        }
      });
    }

    /**
     * Function to scroll to a given location on the page.
     * @param {String} loc - a properly formatted jQuery id selector. Example: '#foo'
     * @function
     */
    scrollToLoc(loc) {
      // Do nothing if target does not exist to prevent errors
      if (!$(loc).length) {
        return false;
      }
      this._inTransition = true;
      var _this = this,
          scrollPos = Math.round($(loc).offset().top - this.options.threshold / 2 - this.options.barOffset);

      $('html, body').stop(true).animate({ scrollTop: scrollPos }, this.options.animationDuration, this.options.animationEasing, function () {
        _this._inTransition = false;_this._updateActive();
      });
    }

    /**
     * Calls necessary functions to update Magellan upon DOM change
     * @function
     */
    reflow() {
      this.calcPoints();
      this._updateActive();
    }

    /**
     * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
     * @private
     * @function
     * @fires Magellan#update
     */
    _updateActive() /*evt, elem, scrollPos*/{
      if (this._inTransition) {
        return;
      }
      var winPos = /*scrollPos ||*/parseInt(window.pageYOffset, 10),
          curIdx;

      if (winPos + this.winHeight === this.docHeight) {
        curIdx = this.points.length - 1;
      } else if (winPos < this.points[0]) {
        curIdx = undefined;
      } else {
        var isDown = this.scrollPos < winPos,
            _this = this,
            curVisible = this.points.filter(function (p, i) {
          return isDown ? p - _this.options.barOffset <= winPos : p - _this.options.barOffset - _this.options.threshold <= winPos;
        });
        curIdx = curVisible.length ? curVisible.length - 1 : 0;
      }

      this.$active.removeClass(this.options.activeClass);
      this.$active = this.$links.filter('[href="#' + this.$targets.eq(curIdx).data('magellan-target') + '"]').addClass(this.options.activeClass);

      if (this.options.deepLinking) {
        var hash = "";
        if (curIdx != undefined) {
          hash = this.$active[0].getAttribute('href');
        }
        if (hash !== window.location.hash) {
          if (window.history.pushState) {
            window.history.pushState(null, null, hash);
          } else {
            window.location.hash = hash;
          }
        }
      }

      this.scrollPos = winPos;
      /**
       * Fires when magellan is finished updating to the new active element.
       * @event Magellan#update
       */
      this.$element.trigger('update.zf.magellan', [this.$active]);
    }

    /**
     * Destroys an instance of Magellan and resets the url of the window.
     * @function
     */
    destroy() {
      this.$element.off('.zf.trigger .zf.magellan').find(`.${ this.options.activeClass }`).removeClass(this.options.activeClass);

      if (this.options.deepLinking) {
        var hash = this.$active[0].getAttribute('href');
        window.location.hash.replace(hash, '');
      }

      Foundation.unregisterPlugin(this);
    }
  }

  /**
   * Default settings for plugin
   */
  Magellan.defaults = {
    /**
     * Amount of time, in ms, the animated scrolling should take between locations.
     * @option
     * @example 500
     */
    animationDuration: 500,
    /**
     * Animation style to use when scrolling between locations.
     * @option
     * @example 'ease-in-out'
     */
    animationEasing: 'linear',
    /**
     * Number of pixels to use as a marker for location changes.
     * @option
     * @example 50
     */
    threshold: 50,
    /**
     * Class applied to the active locations link on the magellan container.
     * @option
     * @example 'active'
     */
    activeClass: 'active',
    /**
     * Allows the script to manipulate the url of the current page, and if supported, alter the history.
     * @option
     * @example true
     */
    deepLinking: false,
    /**
     * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
     * @option
     * @example 25
     */
    barOffset: 0
  };

  // Window exports
  Foundation.plugin(Magellan, 'Magellan');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * OffCanvas module.
   * @module foundation.offcanvas
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   * @requires foundation.util.motion
   */

  class OffCanvas {
    /**
     * Creates a new instance of an off-canvas wrapper.
     * @class
     * @fires OffCanvas#init
     * @param {Object} element - jQuery object to initialize.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
      this.$lastTrigger = $();
      this.$triggers = $();

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'OffCanvas');
      Foundation.Keyboard.register('OffCanvas', {
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
     * @function
     * @private
     */
    _init() {
      var id = this.$element.attr('id');

      this.$element.attr('aria-hidden', 'true');

      this.$element.addClass(`is-transition-${ this.options.transition }`);

      // Find triggers that affect this element and add aria-expanded to them
      this.$triggers = $(document).find('[data-open="' + id + '"], [data-close="' + id + '"], [data-toggle="' + id + '"]').attr('aria-expanded', 'false').attr('aria-controls', id);

      // Add an overlay over the content if necessary
      if (this.options.contentOverlay === true) {
        var overlay = document.createElement('div');
        var overlayPosition = $(this.$element).css("position") === 'fixed' ? 'is-overlay-fixed' : 'is-overlay-absolute';
        overlay.setAttribute('class', 'js-off-canvas-overlay ' + overlayPosition);
        this.$overlay = $(overlay);
        if (overlayPosition === 'is-overlay-fixed') {
          $('body').append(this.$overlay);
        } else {
          this.$element.siblings('[data-off-canvas-content]').append(this.$overlay);
        }
      }

      this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

      if (this.options.isRevealed === true) {
        this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
        this._setMQChecker();
      }
      if (!this.options.transitionTime === true) {
        this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas]')[0]).transitionDuration) * 1000;
      }
    }

    /**
     * Adds event handlers to the off-canvas wrapper and the exit overlay.
     * @function
     * @private
     */
    _events() {
      this.$element.off('.zf.trigger .zf.offcanvas').on({
        'open.zf.trigger': this.open.bind(this),
        'close.zf.trigger': this.close.bind(this),
        'toggle.zf.trigger': this.toggle.bind(this),
        'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
      });

      if (this.options.closeOnClick === true) {
        var $target = this.options.contentOverlay ? this.$overlay : $('[data-off-canvas-content]');
        $target.on({ 'click.zf.offcanvas': this.close.bind(this) });
      }
    }

    /**
     * Applies event listener for elements that will reveal at certain breakpoints.
     * @private
     */
    _setMQChecker() {
      var _this = this;

      $(window).on('changed.zf.mediaquery', function () {
        if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
          _this.reveal(true);
        } else {
          _this.reveal(false);
        }
      }).one('load.zf.offcanvas', function () {
        if (Foundation.MediaQuery.atLeast(_this.options.revealOn)) {
          _this.reveal(true);
        }
      });
    }

    /**
     * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
     * @param {Boolean} isRevealed - true if element should be revealed.
     * @function
     */
    reveal(isRevealed) {
      var $closer = this.$element.find('[data-close]');
      if (isRevealed) {
        this.close();
        this.isRevealed = true;
        this.$element.attr('aria-hidden', 'false');
        this.$element.off('open.zf.trigger toggle.zf.trigger');
        if ($closer.length) {
          $closer.hide();
        }
      } else {
        this.isRevealed = false;
        this.$element.attr('aria-hidden', 'true');
        this.$element.on({
          'open.zf.trigger': this.open.bind(this),
          'toggle.zf.trigger': this.toggle.bind(this)
        });
        if ($closer.length) {
          $closer.show();
        }
      }
    }

    /**
     * Stops scrolling of the body when offcanvas is open on mobile Safari and other troublesome browsers.
     * @private
     */
    _stopScrolling(event) {
      return false;
    }

    /**
     * Opens the off-canvas menu.
     * @function
     * @param {Object} event - Event object passed from listener.
     * @param {jQuery} trigger - element that triggered the off-canvas to open.
     * @fires OffCanvas#opened
     */
    open(event, trigger) {
      if (this.$element.hasClass('is-open') || this.isRevealed) {
        return;
      }
      var _this = this;

      if (trigger) {
        this.$lastTrigger = trigger;
      }

      if (this.options.forceTo === 'top') {
        window.scrollTo(0, 0);
      } else if (this.options.forceTo === 'bottom') {
        window.scrollTo(0, document.body.scrollHeight);
      }

      /**
       * Fires when the off-canvas menu opens.
       * @event OffCanvas#opened
       */
      _this.$element.addClass('is-open');

      this.$triggers.attr('aria-expanded', 'true');
      this.$element.attr('aria-hidden', 'false').trigger('opened.zf.offcanvas');

      // If `contentScroll` is set to false, add class and disable scrolling on touch devices.
      if (this.options.contentScroll === false) {
        $('body').addClass('is-off-canvas-open').on('touchmove', this._stopScrolling);
      }

      if (this.options.contentOverlay === true) {
        this.$overlay.addClass('is-visible');
      }

      if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
        this.$overlay.addClass('is-closable');
      }

      if (this.options.autoFocus === true) {
        this.$element.one(Foundation.transitionend(this.$element), function () {
          _this.$element.find('a, button').eq(0).focus();
        });
      }

      if (this.options.trapFocus === true) {
        this.$element.siblings('[data-off-canvas-content]').attr('tabindex', '-1');
        Foundation.Keyboard.trapFocus(this.$element);
      }
    }

    /**
     * Closes the off-canvas menu.
     * @function
     * @param {Function} cb - optional cb to fire after closure.
     * @fires OffCanvas#closed
     */
    close(cb) {
      if (!this.$element.hasClass('is-open') || this.isRevealed) {
        return;
      }

      var _this = this;

      _this.$element.removeClass('is-open');

      this.$element.attr('aria-hidden', 'true')
      /**
       * Fires when the off-canvas menu opens.
       * @event OffCanvas#closed
       */
      .trigger('closed.zf.offcanvas');

      // If `contentScroll` is set to false, remove class and re-enable scrolling on touch devices.
      if (this.options.contentScroll === false) {
        $('body').removeClass('is-off-canvas-open').off('touchmove', this._stopScrolling);
      }

      if (this.options.contentOverlay === true) {
        this.$overlay.removeClass('is-visible');
      }

      if (this.options.closeOnClick === true && this.options.contentOverlay === true) {
        this.$overlay.removeClass('is-closable');
      }

      this.$triggers.attr('aria-expanded', 'false');

      if (this.options.trapFocus === true) {
        this.$element.siblings('[data-off-canvas-content]').removeAttr('tabindex');
        Foundation.Keyboard.releaseFocus(this.$element);
      }
    }

    /**
     * Toggles the off-canvas menu open or closed.
     * @function
     * @param {Object} event - Event object passed from listener.
     * @param {jQuery} trigger - element that triggered the off-canvas to open.
     */
    toggle(event, trigger) {
      if (this.$element.hasClass('is-open')) {
        this.close(event, trigger);
      } else {
        this.open(event, trigger);
      }
    }

    /**
     * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
     * @function
     * @private
     */
    _handleKeyboard(e) {
      Foundation.Keyboard.handleKey(e, 'OffCanvas', {
        close: () => {
          this.close();
          this.$lastTrigger.focus();
          return true;
        },
        handled: () => {
          e.stopPropagation();
          e.preventDefault();
        }
      });
    }

    /**
     * Destroys the offcanvas plugin.
     * @function
     */
    destroy() {
      this.close();
      this.$element.off('.zf.trigger .zf.offcanvas');
      this.$overlay.off('.zf.offcanvas');

      Foundation.unregisterPlugin(this);
    }
  }

  OffCanvas.defaults = {
    /**
     * Allow the user to click outside of the menu to close it.
     * @option
     * @example true
     */
    closeOnClick: true,

    /**
     * Adds an overlay on top of `[data-off-canvas-content]`.
     * @option
     * @example true
     */
    contentOverlay: true,

    /**
     * Enable/disable scrolling of the main content when an off canvas panel is open.
     * @option
     * @example true
     */
    contentScroll: true,

    /**
     * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
     * @option
     * @example 500
     */
    transitionTime: 0,

    /**
     * Type of transition for the offcanvas menu. Options are 'push', 'detached' or 'slide'.
     * @option
     * @example push
     */
    transition: 'push',

    /**
     * Force the page to scroll to top or bottom on open.
     * @option
     * @example top
     */
    forceTo: null,

    /**
     * Allow the offcanvas to remain open for certain breakpoints.
     * @option
     * @example false
     */
    isRevealed: false,

    /**
     * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class with the `revealClass` option.
     * @option
     * @example reveal-for-large
     */
    revealOn: null,

    /**
     * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
     * @option
     * @example true
     */
    autoFocus: true,

    /**
     * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
     * @option
     * TODO improve the regex testing for this.
     * @example reveal-for-large
     */
    revealClass: 'reveal-for-',

    /**
     * Triggers optional focus trapping when opening an offcanvas. Sets tabindex of [data-off-canvas-content] to -1 for accessibility purposes.
     * @option
     * @example true
     */
    trapFocus: false
  };

  // Window exports
  Foundation.plugin(OffCanvas, 'OffCanvas');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Orbit module.
   * @module foundation.orbit
   * @requires foundation.util.keyboard
   * @requires foundation.util.motion
   * @requires foundation.util.timerAndImageLoader
   * @requires foundation.util.touch
   */

  class Orbit {
    /**
    * Creates a new instance of an orbit carousel.
    * @class
    * @param {jQuery} element - jQuery object to make into an Orbit Carousel.
    * @param {Object} options - Overrides to the default plugin settings.
    */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Orbit.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Orbit');
      Foundation.Keyboard.register('Orbit', {
        'ltr': {
          'ARROW_RIGHT': 'next',
          'ARROW_LEFT': 'previous'
        },
        'rtl': {
          'ARROW_LEFT': 'next',
          'ARROW_RIGHT': 'previous'
        }
      });
    }

    /**
    * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
    * @function
    * @private
    */
    _init() {
      // @TODO: consider discussion on PR #9278 about DOM pollution by changeSlide
      this._reset();

      this.$wrapper = this.$element.find(`.${ this.options.containerClass }`);
      this.$slides = this.$element.find(`.${ this.options.slideClass }`);

      var $images = this.$element.find('img'),
          initActive = this.$slides.filter('.is-active'),
          id = this.$element[0].id || Foundation.GetYoDigits(6, 'orbit');

      this.$element.attr({
        'data-resize': id,
        'id': id
      });

      if (!initActive.length) {
        this.$slides.eq(0).addClass('is-active');
      }

      if (!this.options.useMUI) {
        this.$slides.addClass('no-motionui');
      }

      if ($images.length) {
        Foundation.onImagesLoaded($images, this._prepareForOrbit.bind(this));
      } else {
        this._prepareForOrbit(); //hehe
      }

      if (this.options.bullets) {
        this._loadBullets();
      }

      this._events();

      if (this.options.autoPlay && this.$slides.length > 1) {
        this.geoSync();
      }

      if (this.options.accessible) {
        // allow wrapper to be focusable to enable arrow navigation
        this.$wrapper.attr('tabindex', 0);
      }
    }

    /**
    * Creates a jQuery collection of bullets, if they are being used.
    * @function
    * @private
    */
    _loadBullets() {
      this.$bullets = this.$element.find(`.${ this.options.boxOfBullets }`).find('button');
    }

    /**
    * Sets a `timer` object on the orbit, and starts the counter for the next slide.
    * @function
    */
    geoSync() {
      var _this = this;
      this.timer = new Foundation.Timer(this.$element, {
        duration: this.options.timerDelay,
        infinite: false
      }, function () {
        _this.changeSlide(true);
      });
      this.timer.start();
    }

    /**
    * Sets wrapper and slide heights for the orbit.
    * @function
    * @private
    */
    _prepareForOrbit() {
      var _this = this;
      this._setWrapperHeight();
    }

    /**
    * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
    * @function
    * @private
    * @param {Function} cb - a callback function to fire when complete.
    */
    _setWrapperHeight(cb) {
      //rewrite this to `for` loop
      var max = 0,
          temp,
          counter = 0,
          _this = this;

      this.$slides.each(function () {
        temp = this.getBoundingClientRect().height;
        $(this).attr('data-slide', counter);

        if (_this.$slides.filter('.is-active')[0] !== _this.$slides.eq(counter)[0]) {
          //if not the active slide, set css position and display property
          $(this).css({ 'position': 'relative', 'display': 'none' });
        }
        max = temp > max ? temp : max;
        counter++;
      });

      if (counter === this.$slides.length) {
        this.$wrapper.css({ 'height': max }); //only change the wrapper height property once.
        if (cb) {
          cb(max);
        } //fire callback with max height dimension.
      }
    }

    /**
    * Sets the max-height of each slide.
    * @function
    * @private
    */
    _setSlideHeight(height) {
      this.$slides.each(function () {
        $(this).css('max-height', height);
      });
    }

    /**
    * Adds event listeners to basically everything within the element.
    * @function
    * @private
    */
    _events() {
      var _this = this;

      //***************************************
      //**Now using custom event - thanks to:**
      //**      Yohai Ararat of Toronto      **
      //***************************************
      //
      this.$element.off('.resizeme.zf.trigger').on({
        'resizeme.zf.trigger': this._prepareForOrbit.bind(this)
      });
      if (this.$slides.length > 1) {

        if (this.options.swipe) {
          this.$slides.off('swipeleft.zf.orbit swiperight.zf.orbit').on('swipeleft.zf.orbit', function (e) {
            e.preventDefault();
            _this.changeSlide(true);
          }).on('swiperight.zf.orbit', function (e) {
            e.preventDefault();
            _this.changeSlide(false);
          });
        }
        //***************************************

        if (this.options.autoPlay) {
          this.$slides.on('click.zf.orbit', function () {
            _this.$element.data('clickedOn', _this.$element.data('clickedOn') ? false : true);
            _this.timer[_this.$element.data('clickedOn') ? 'pause' : 'start']();
          });

          if (this.options.pauseOnHover) {
            this.$element.on('mouseenter.zf.orbit', function () {
              _this.timer.pause();
            }).on('mouseleave.zf.orbit', function () {
              if (!_this.$element.data('clickedOn')) {
                _this.timer.start();
              }
            });
          }
        }

        if (this.options.navButtons) {
          var $controls = this.$element.find(`.${ this.options.nextClass }, .${ this.options.prevClass }`);
          $controls.attr('tabindex', 0)
          //also need to handle enter/return and spacebar key presses
          .on('click.zf.orbit touchend.zf.orbit', function (e) {
            e.preventDefault();
            _this.changeSlide($(this).hasClass(_this.options.nextClass));
          });
        }

        if (this.options.bullets) {
          this.$bullets.on('click.zf.orbit touchend.zf.orbit', function () {
            if (/is-active/g.test(this.className)) {
              return false;
            } //if this is active, kick out of function.
            var idx = $(this).data('slide'),
                ltr = idx > _this.$slides.filter('.is-active').data('slide'),
                $slide = _this.$slides.eq(idx);

            _this.changeSlide(ltr, $slide, idx);
          });
        }

        if (this.options.accessible) {
          this.$wrapper.add(this.$bullets).on('keydown.zf.orbit', function (e) {
            // handle keyboard event with keyboard util
            Foundation.Keyboard.handleKey(e, 'Orbit', {
              next: function () {
                _this.changeSlide(true);
              },
              previous: function () {
                _this.changeSlide(false);
              },
              handled: function () {
                // if bullet is focused, make sure focus moves
                if ($(e.target).is(_this.$bullets)) {
                  _this.$bullets.filter('.is-active').focus();
                }
              }
            });
          });
        }
      }
    }

    /**
     * Resets Orbit so it can be reinitialized
     */
    _reset() {
      // Don't do anything if there are no slides (first run)
      if (typeof this.$slides == 'undefined') {
        return;
      }

      if (this.$slides.length > 1) {
        // Remove old events
        this.$element.off('.zf.orbit').find('*').off('.zf.orbit');

        // Restart timer if autoPlay is enabled
        if (this.options.autoPlay) {
          this.timer.restart();
        }

        // Reset all sliddes
        this.$slides.each(function (el) {
          $(el).removeClass('is-active is-active is-in').removeAttr('aria-live').hide();
        });

        // Show the first slide
        this.$slides.first().addClass('is-active').show();

        // Triggers when the slide has finished animating
        this.$element.trigger('slidechange.zf.orbit', [this.$slides.first()]);

        // Select first bullet if bullets are present
        if (this.options.bullets) {
          this._updateBullets(0);
        }
      }
    }

    /**
    * Changes the current slide to a new one.
    * @function
    * @param {Boolean} isLTR - flag if the slide should move left to right.
    * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
    * @param {Number} idx - the index of the new slide in its collection, if one chosen.
    * @fires Orbit#slidechange
    */
    changeSlide(isLTR, chosenSlide, idx) {
      if (!this.$slides) {
        return;
      } // Don't freak out if we're in the middle of cleanup
      var $curSlide = this.$slides.filter('.is-active').eq(0);

      if (/mui/g.test($curSlide[0].className)) {
        return false;
      } //if the slide is currently animating, kick out of the function

      var $firstSlide = this.$slides.first(),
          $lastSlide = this.$slides.last(),
          dirIn = isLTR ? 'Right' : 'Left',
          dirOut = isLTR ? 'Left' : 'Right',
          _this = this,
          $newSlide;

      if (!chosenSlide) {
        //most of the time, this will be auto played or clicked from the navButtons.
        $newSlide = isLTR ? //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
        this.options.infiniteWrap ? $curSlide.next(`.${ this.options.slideClass }`).length ? $curSlide.next(`.${ this.options.slideClass }`) : $firstSlide : $curSlide.next(`.${ this.options.slideClass }`) : //pick next slide if moving left to right
        this.options.infiniteWrap ? $curSlide.prev(`.${ this.options.slideClass }`).length ? $curSlide.prev(`.${ this.options.slideClass }`) : $lastSlide : $curSlide.prev(`.${ this.options.slideClass }`); //pick prev slide if moving right to left
      } else {
        $newSlide = chosenSlide;
      }

      if ($newSlide.length) {
        /**
        * Triggers before the next slide starts animating in and only if a next slide has been found.
        * @event Orbit#beforeslidechange
        */
        this.$element.trigger('beforeslidechange.zf.orbit', [$curSlide, $newSlide]);

        if (this.options.bullets) {
          idx = idx || this.$slides.index($newSlide); //grab index to update bullets
          this._updateBullets(idx);
        }

        if (this.options.useMUI && !this.$element.is(':hidden')) {
          Foundation.Motion.animateIn($newSlide.addClass('is-active').css({ 'position': 'absolute', 'top': 0 }), this.options[`animInFrom${ dirIn }`], function () {
            $newSlide.css({ 'position': 'relative', 'display': 'block' }).attr('aria-live', 'polite');
          });

          Foundation.Motion.animateOut($curSlide.removeClass('is-active'), this.options[`animOutTo${ dirOut }`], function () {
            $curSlide.removeAttr('aria-live');
            if (_this.options.autoPlay && !_this.timer.isPaused) {
              _this.timer.restart();
            }
            //do stuff?
          });
        } else {
          $curSlide.removeClass('is-active is-in').removeAttr('aria-live').hide();
          $newSlide.addClass('is-active is-in').attr('aria-live', 'polite').show();
          if (this.options.autoPlay && !this.timer.isPaused) {
            this.timer.restart();
          }
        }
        /**
        * Triggers when the slide has finished animating in.
        * @event Orbit#slidechange
        */
        this.$element.trigger('slidechange.zf.orbit', [$newSlide]);
      }
    }

    /**
    * Updates the active state of the bullets, if displayed.
    * @function
    * @private
    * @param {Number} idx - the index of the current slide.
    */
    _updateBullets(idx) {
      var $oldBullet = this.$element.find(`.${ this.options.boxOfBullets }`).find('.is-active').removeClass('is-active').blur(),
          span = $oldBullet.find('span:last').detach(),
          $newBullet = this.$bullets.eq(idx).addClass('is-active').append(span);
    }

    /**
    * Destroys the carousel and hides the element.
    * @function
    */
    destroy() {
      this.$element.off('.zf.orbit').find('*').off('.zf.orbit').end().hide();
      Foundation.unregisterPlugin(this);
    }
  }

  Orbit.defaults = {
    /**
    * Tells the JS to look for and loadBullets.
    * @option
    * @example true
    */
    bullets: true,
    /**
    * Tells the JS to apply event listeners to nav buttons
    * @option
    * @example true
    */
    navButtons: true,
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-right'
    */
    animInFromRight: 'slide-in-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-right'
    */
    animOutToRight: 'slide-out-right',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-in-left'
    *
    */
    animInFromLeft: 'slide-in-left',
    /**
    * motion-ui animation class to apply
    * @option
    * @example 'slide-out-left'
    */
    animOutToLeft: 'slide-out-left',
    /**
    * Allows Orbit to automatically animate on page load.
    * @option
    * @example true
    */
    autoPlay: true,
    /**
    * Amount of time, in ms, between slide transitions
    * @option
    * @example 5000
    */
    timerDelay: 5000,
    /**
    * Allows Orbit to infinitely loop through the slides
    * @option
    * @example true
    */
    infiniteWrap: true,
    /**
    * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
    * @option
    * @example true
    */
    swipe: true,
    /**
    * Allows the timing function to pause animation on hover.
    * @option
    * @example true
    */
    pauseOnHover: true,
    /**
    * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
    * @option
    * @example true
    */
    accessible: true,
    /**
    * Class applied to the container of Orbit
    * @option
    * @example 'orbit-container'
    */
    containerClass: 'orbit-container',
    /**
    * Class applied to individual slides.
    * @option
    * @example 'orbit-slide'
    */
    slideClass: 'orbit-slide',
    /**
    * Class applied to the bullet container. You're welcome.
    * @option
    * @example 'orbit-bullets'
    */
    boxOfBullets: 'orbit-bullets',
    /**
    * Class applied to the `next` navigation button.
    * @option
    * @example 'orbit-next'
    */
    nextClass: 'orbit-next',
    /**
    * Class applied to the `previous` navigation button.
    * @option
    * @example 'orbit-previous'
    */
    prevClass: 'orbit-previous',
    /**
    * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatability.
    * @option
    * @example true
    */
    useMUI: true
  };

  // Window exports
  Foundation.plugin(Orbit, 'Orbit');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * ResponsiveMenu module.
   * @module foundation.responsiveMenu
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.accordionMenu
   * @requires foundation.util.drilldown
   * @requires foundation.util.dropdown-menu
   */

  class ResponsiveMenu {
    /**
     * Creates a new instance of a responsive menu.
     * @class
     * @fires ResponsiveMenu#init
     * @param {jQuery} element - jQuery object to make into a dropdown menu.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = $(element);
      this.rules = this.$element.data('responsive-menu');
      this.currentMq = null;
      this.currentPlugin = null;

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveMenu');
    }

    /**
     * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
     * @function
     * @private
     */
    _init() {
      // The first time an Interchange plugin is initialized, this.rules is converted from a string of "classes" to an object of rules
      if (typeof this.rules === 'string') {
        let rulesTree = {};

        // Parse rules from "classes" pulled from data attribute
        let rules = this.rules.split(' ');

        // Iterate through every rule found
        for (let i = 0; i < rules.length; i++) {
          let rule = rules[i].split('-');
          let ruleSize = rule.length > 1 ? rule[0] : 'small';
          let rulePlugin = rule.length > 1 ? rule[1] : rule[0];

          if (MenuPlugins[rulePlugin] !== null) {
            rulesTree[ruleSize] = MenuPlugins[rulePlugin];
          }
        }

        this.rules = rulesTree;
      }

      if (!$.isEmptyObject(this.rules)) {
        this._checkMediaQueries();
      }
      // Add data-mutate since children may need it.
      this.$element.attr('data-mutate', this.$element.attr('data-mutate') || Foundation.GetYoDigits(6, 'responsive-menu'));
    }

    /**
     * Initializes events for the Menu.
     * @function
     * @private
     */
    _events() {
      var _this = this;

      $(window).on('changed.zf.mediaquery', function () {
        _this._checkMediaQueries();
      });
      // $(window).on('resize.zf.ResponsiveMenu', function() {
      //   _this._checkMediaQueries();
      // });
    }

    /**
     * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
     * @function
     * @private
     */
    _checkMediaQueries() {
      var matchedMq,
          _this = this;
      // Iterate through each rule and find the last matching rule
      $.each(this.rules, function (key) {
        if (Foundation.MediaQuery.atLeast(key)) {
          matchedMq = key;
        }
      });

      // No match? No dice
      if (!matchedMq) return;

      // Plugin already initialized? We good
      if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

      // Remove existing plugin-specific CSS classes
      $.each(MenuPlugins, function (key, value) {
        _this.$element.removeClass(value.cssClass);
      });

      // Add the CSS class for the new plugin
      this.$element.addClass(this.rules[matchedMq].cssClass);

      // Create an instance of the new plugin
      if (this.currentPlugin) this.currentPlugin.destroy();
      this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
    }

    /**
     * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
     * @function
     */
    destroy() {
      this.currentPlugin.destroy();
      $(window).off('.zf.ResponsiveMenu');
      Foundation.unregisterPlugin(this);
    }
  }

  ResponsiveMenu.defaults = {};

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // Window exports
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * ResponsiveToggle module.
   * @module foundation.responsiveToggle
   * @requires foundation.util.mediaQuery
   */

  class ResponsiveToggle {
    /**
     * Creates a new instance of Tab Bar.
     * @class
     * @fires ResponsiveToggle#init
     * @param {jQuery} element - jQuery object to attach tab bar functionality to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = $(element);
      this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'ResponsiveToggle');
    }

    /**
     * Initializes the tab bar by finding the target element, toggling element, and running update().
     * @function
     * @private
     */
    _init() {
      var targetID = this.$element.data('responsive-toggle');
      if (!targetID) {
        console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
      }

      this.$targetMenu = $(`#${ targetID }`);
      this.$toggler = this.$element.find('[data-toggle]');
      this.options = $.extend({}, this.options, this.$targetMenu.data());

      // If they were set, parse the animation classes
      if (this.options.animate) {
        let input = this.options.animate.split(' ');

        this.animationIn = input[0];
        this.animationOut = input[1] || null;
      }

      this._update();
    }

    /**
     * Adds necessary event handlers for the tab bar to work.
     * @function
     * @private
     */
    _events() {
      var _this = this;

      this._updateMqHandler = this._update.bind(this);

      $(window).on('changed.zf.mediaquery', this._updateMqHandler);

      this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
    }

    /**
     * Checks the current media query to determine if the tab bar should be visible or hidden.
     * @function
     * @private
     */
    _update() {
      // Mobile
      if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
        this.$element.show();
        this.$targetMenu.hide();
      }

      // Desktop
      else {
          this.$element.hide();
          this.$targetMenu.show();
        }
    }

    /**
     * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
     * @function
     * @fires ResponsiveToggle#toggled
     */
    toggleMenu() {
      if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
        if (this.options.animate) {
          if (this.$targetMenu.is(':hidden')) {
            Foundation.Motion.animateIn(this.$targetMenu, this.animationIn, () => {
              /**
               * Fires when the element attached to the tab bar toggles.
               * @event ResponsiveToggle#toggled
               */
              this.$element.trigger('toggled.zf.responsiveToggle');
              this.$targetMenu.find('[data-mutate]').triggerHandler('mutateme.zf.trigger');
            });
          } else {
            Foundation.Motion.animateOut(this.$targetMenu, this.animationOut, () => {
              /**
               * Fires when the element attached to the tab bar toggles.
               * @event ResponsiveToggle#toggled
               */
              this.$element.trigger('toggled.zf.responsiveToggle');
            });
          }
        } else {
          this.$targetMenu.toggle(0);
          this.$targetMenu.find('[data-mutate]').trigger('mutateme.zf.trigger');

          /**
           * Fires when the element attached to the tab bar toggles.
           * @event ResponsiveToggle#toggled
           */
          this.$element.trigger('toggled.zf.responsiveToggle');
        }
      }
    }

    destroy() {
      this.$element.off('.zf.responsiveToggle');
      this.$toggler.off('.zf.responsiveToggle');

      $(window).off('changed.zf.mediaquery', this._updateMqHandler);

      Foundation.unregisterPlugin(this);
    }
  }

  ResponsiveToggle.defaults = {
    /**
     * The breakpoint after which the menu is always shown, and the tab bar is hidden.
     * @option
     * @example 'medium'
     */
    hideFor: 'medium',

    /**
     * To decide if the toggle should be animated or not.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Reveal module.
   * @module foundation.reveal
   * @requires foundation.util.keyboard
   * @requires foundation.util.box
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.motion if using animations
   */

  class Reveal {
    /**
     * Creates a new instance of Reveal.
     * @class
     * @param {jQuery} element - jQuery object to use for the modal.
     * @param {Object} options - optional parameters.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
      this._init();

      Foundation.registerPlugin(this, 'Reveal');
      Foundation.Keyboard.register('Reveal', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ESCAPE': 'close'
      });
    }

    /**
     * Initializes the modal by adding the overlay and close buttons, (if selected).
     * @private
     */
    _init() {
      this.id = this.$element.attr('id');
      this.isActive = false;
      this.cached = { mq: Foundation.MediaQuery.current };
      this.isMobile = mobileSniff();

      this.$anchor = $(`[data-open="${ this.id }"]`).length ? $(`[data-open="${ this.id }"]`) : $(`[data-toggle="${ this.id }"]`);
      this.$anchor.attr({
        'aria-controls': this.id,
        'aria-haspopup': true,
        'tabindex': 0
      });

      if (this.options.fullScreen || this.$element.hasClass('full')) {
        this.options.fullScreen = true;
        this.options.overlay = false;
      }
      if (this.options.overlay && !this.$overlay) {
        this.$overlay = this._makeOverlay(this.id);
      }

      this.$element.attr({
        'role': 'dialog',
        'aria-hidden': true,
        'data-yeti-box': this.id,
        'data-resize': this.id
      });

      if (this.$overlay) {
        this.$element.detach().appendTo(this.$overlay);
      } else {
        this.$element.detach().appendTo($(this.options.appendTo));
        this.$element.addClass('without-overlay');
      }
      this._events();
      if (this.options.deepLink && window.location.hash === `#${ this.id }`) {
        $(window).one('load.zf.reveal', this.open.bind(this));
      }
    }

    /**
     * Creates an overlay div to display behind the modal.
     * @private
     */
    _makeOverlay() {
      return $('<div></div>').addClass('reveal-overlay').appendTo(this.options.appendTo);
    }

    /**
     * Updates position of modal
     * TODO:  Figure out if we actually need to cache these values or if it doesn't matter
     * @private
     */
    _updatePosition() {
      var width = this.$element.outerWidth();
      var outerWidth = $(window).width();
      var height = this.$element.outerHeight();
      var outerHeight = $(window).height();
      var left, top;
      if (this.options.hOffset === 'auto') {
        left = parseInt((outerWidth - width) / 2, 10);
      } else {
        left = parseInt(this.options.hOffset, 10);
      }
      if (this.options.vOffset === 'auto') {
        if (height > outerHeight) {
          top = parseInt(Math.min(100, outerHeight / 10), 10);
        } else {
          top = parseInt((outerHeight - height) / 4, 10);
        }
      } else {
        top = parseInt(this.options.vOffset, 10);
      }
      this.$element.css({ top: top + 'px' });
      // only worry about left if we don't have an overlay or we havea  horizontal offset,
      // otherwise we're perfectly in the middle
      if (!this.$overlay || this.options.hOffset !== 'auto') {
        this.$element.css({ left: left + 'px' });
        this.$element.css({ margin: '0px' });
      }
    }

    /**
     * Adds event handlers for the modal.
     * @private
     */
    _events() {
      var _this = this;

      this.$element.on({
        'open.zf.trigger': this.open.bind(this),
        'close.zf.trigger': (event, $element) => {
          if (event.target === _this.$element[0] || $(event.target).parents('[data-closable]')[0] === $element) {
            // only close reveal when it's explicitly called
            return this.close.apply(this);
          }
        },
        'toggle.zf.trigger': this.toggle.bind(this),
        'resizeme.zf.trigger': function () {
          _this._updatePosition();
        }
      });

      if (this.$anchor.length) {
        this.$anchor.on('keydown.zf.reveal', function (e) {
          if (e.which === 13 || e.which === 32) {
            e.stopPropagation();
            e.preventDefault();
            _this.open();
          }
        });
      }

      if (this.options.closeOnClick && this.options.overlay) {
        this.$overlay.off('.zf.reveal').on('click.zf.reveal', function (e) {
          if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target) || !$.contains(document, e.target)) {
            return;
          }
          _this.close();
        });
      }
      if (this.options.deepLink) {
        $(window).on(`popstate.zf.reveal:${ this.id }`, this._handleState.bind(this));
      }
    }

    /**
     * Handles modal methods on back/forward button clicks or any other event that triggers popstate.
     * @private
     */
    _handleState(e) {
      if (window.location.hash === '#' + this.id && !this.isActive) {
        this.open();
      } else {
        this.close();
      }
    }

    /**
     * Opens the modal controlled by `this.$anchor`, and closes all others by default.
     * @function
     * @fires Reveal#closeme
     * @fires Reveal#open
     */
    open() {
      if (this.options.deepLink) {
        var hash = `#${ this.id }`;

        if (window.history.pushState) {
          window.history.pushState(null, null, hash);
        } else {
          window.location.hash = hash;
        }
      }

      this.isActive = true;

      // Make elements invisible, but remove display: none so we can get size and positioning
      this.$element.css({ 'visibility': 'hidden' }).show().scrollTop(0);
      if (this.options.overlay) {
        this.$overlay.css({ 'visibility': 'hidden' }).show();
      }

      this._updatePosition();

      this.$element.hide().css({ 'visibility': '' });

      if (this.$overlay) {
        this.$overlay.css({ 'visibility': '' }).hide();
        if (this.$element.hasClass('fast')) {
          this.$overlay.addClass('fast');
        } else if (this.$element.hasClass('slow')) {
          this.$overlay.addClass('slow');
        }
      }

      if (!this.options.multipleOpened) {
        /**
         * Fires immediately before the modal opens.
         * Closes any other modals that are currently open
         * @event Reveal#closeme
         */
        this.$element.trigger('closeme.zf.reveal', this.id);
      }

      var _this = this;

      function addRevealOpenClasses() {
        if (_this.isMobile) {
          if (!_this.originalScrollPos) {
            _this.originalScrollPos = window.pageYOffset;
          }
          $('html, body').addClass('is-reveal-open');
        } else {
          $('body').addClass('is-reveal-open');
        }
      }
      // Motion UI method of reveal
      if (this.options.animationIn) {
        function afterAnimation() {
          _this.$element.attr({
            'aria-hidden': false,
            'tabindex': -1
          }).focus();
          addRevealOpenClasses();
          Foundation.Keyboard.trapFocus(_this.$element);
        }
        if (this.options.overlay) {
          Foundation.Motion.animateIn(this.$overlay, 'fade-in');
        }
        Foundation.Motion.animateIn(this.$element, this.options.animationIn, () => {
          if (this.$element) {
            // protect against object having been removed
            this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);
            afterAnimation();
          }
        });
      }
      // jQuery method of reveal
      else {
          if (this.options.overlay) {
            this.$overlay.show(0);
          }
          this.$element.show(this.options.showDelay);
        }

      // handle accessibility
      this.$element.attr({
        'aria-hidden': false,
        'tabindex': -1
      }).focus();
      Foundation.Keyboard.trapFocus(this.$element);

      /**
       * Fires when the modal has successfully opened.
       * @event Reveal#open
       */
      this.$element.trigger('open.zf.reveal');

      addRevealOpenClasses();

      setTimeout(() => {
        this._extraHandlers();
      }, 0);
    }

    /**
     * Adds extra event handlers for the body and window if necessary.
     * @private
     */
    _extraHandlers() {
      var _this = this;
      if (!this.$element) {
        return;
      } // If we're in the middle of cleanup, don't freak out
      this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

      if (!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen) {
        $('body').on('click.zf.reveal', function (e) {
          if (e.target === _this.$element[0] || $.contains(_this.$element[0], e.target) || !$.contains(document, e.target)) {
            return;
          }
          _this.close();
        });
      }

      if (this.options.closeOnEsc) {
        $(window).on('keydown.zf.reveal', function (e) {
          Foundation.Keyboard.handleKey(e, 'Reveal', {
            close: function () {
              if (_this.options.closeOnEsc) {
                _this.close();
                _this.$anchor.focus();
              }
            }
          });
        });
      }

      // lock focus within modal while tabbing
      this.$element.on('keydown.zf.reveal', function (e) {
        var $target = $(this);
        // handle keyboard event with keyboard util
        Foundation.Keyboard.handleKey(e, 'Reveal', {
          open: function () {
            if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
              setTimeout(function () {
                // set focus back to anchor if close button has been activated
                _this.$anchor.focus();
              }, 1);
            } else if ($target.is(_this.focusableElements)) {
              // dont't trigger if acual element has focus (i.e. inputs, links, ...)
              _this.open();
            }
          },
          close: function () {
            if (_this.options.closeOnEsc) {
              _this.close();
              _this.$anchor.focus();
            }
          },
          handled: function (preventDefault) {
            if (preventDefault) {
              e.preventDefault();
            }
          }
        });
      });
    }

    /**
     * Closes the modal.
     * @function
     * @fires Reveal#closed
     */
    close() {
      if (!this.isActive || !this.$element.is(':visible')) {
        return false;
      }
      var _this = this;

      // Motion UI method of hiding
      if (this.options.animationOut) {
        if (this.options.overlay) {
          Foundation.Motion.animateOut(this.$overlay, 'fade-out', finishUp);
        } else {
          finishUp();
        }

        Foundation.Motion.animateOut(this.$element, this.options.animationOut);
      }
      // jQuery method of hiding
      else {
          if (this.options.overlay) {
            this.$overlay.hide(0, finishUp);
          } else {
            finishUp();
          }

          this.$element.hide(this.options.hideDelay);
        }

      // Conditionals to remove extra event listeners added on open
      if (this.options.closeOnEsc) {
        $(window).off('keydown.zf.reveal');
      }

      if (!this.options.overlay && this.options.closeOnClick) {
        $('body').off('click.zf.reveal');
      }

      this.$element.off('keydown.zf.reveal');

      function finishUp() {
        if (_this.isMobile) {
          $('html, body').removeClass('is-reveal-open');
          if (_this.originalScrollPos) {
            $('body').scrollTop(_this.originalScrollPos);
            _this.originalScrollPos = null;
          }
        } else {
          $('body').removeClass('is-reveal-open');
        }

        Foundation.Keyboard.releaseFocus(_this.$element);

        _this.$element.attr('aria-hidden', true);

        /**
        * Fires when the modal is done closing.
        * @event Reveal#closed
        */
        _this.$element.trigger('closed.zf.reveal');
      }

      /**
      * Resets the modal content
      * This prevents a running video to keep going in the background
      */
      if (this.options.resetOnClose) {
        this.$element.html(this.$element.html());
      }

      this.isActive = false;
      if (_this.options.deepLink) {
        if (window.history.replaceState) {
          window.history.replaceState('', document.title, window.location.href.replace(`#${ this.id }`, ''));
        } else {
          window.location.hash = '';
        }
      }
    }

    /**
     * Toggles the open/closed state of a modal.
     * @function
     */
    toggle() {
      if (this.isActive) {
        this.close();
      } else {
        this.open();
      }
    }

    /**
     * Destroys an instance of a modal.
     * @function
     */
    destroy() {
      if (this.options.overlay) {
        this.$element.appendTo($(this.options.appendTo)); // move $element outside of $overlay to prevent error unregisterPlugin()
        this.$overlay.hide().off().remove();
      }
      this.$element.hide().off();
      this.$anchor.off('.zf');
      $(window).off(`.zf.reveal:${ this.id }`);

      Foundation.unregisterPlugin(this);
    }
  }

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example auto
     */
    vOffset: 'auto',
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example auto
     */
    hOffset: 'auto',
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api, otherwise, videos will continue to play in the background.
     * @option
     * @example false
     */
    resetOnClose: false,
    /**
     * Allows the modal to alter the url on open/close, and allows the use of the `back` button to close modals. ALSO, allows a modal to auto-maniacally open on page load IF the hash === the modal's user-set id.
     * @option
     * @example false
     */
    deepLink: false,
    /**
    * Allows the modal to append to custom div.
    * @option
    * @example false
    */
    appendTo: "body"

  };

  // Window exports
  Foundation.plugin(Reveal, 'Reveal');

  function iPhoneSniff() {
    return (/iP(ad|hone|od).*OS/.test(window.navigator.userAgent)
    );
  }

  function androidSniff() {
    return (/Android/.test(window.navigator.userAgent)
    );
  }

  function mobileSniff() {
    return iPhoneSniff() || androidSniff();
  }
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Slider module.
   * @module foundation.slider
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   * @requires foundation.util.keyboard
   * @requires foundation.util.touch
   */

  class Slider {
    /**
     * Creates a new instance of a slider control.
     * @class
     * @param {jQuery} element - jQuery object to make into a slider control.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Slider.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Slider');
      Foundation.Keyboard.register('Slider', {
        'ltr': {
          'ARROW_RIGHT': 'increase',
          'ARROW_UP': 'increase',
          'ARROW_DOWN': 'decrease',
          'ARROW_LEFT': 'decrease',
          'SHIFT_ARROW_RIGHT': 'increase_fast',
          'SHIFT_ARROW_UP': 'increase_fast',
          'SHIFT_ARROW_DOWN': 'decrease_fast',
          'SHIFT_ARROW_LEFT': 'decrease_fast'
        },
        'rtl': {
          'ARROW_LEFT': 'increase',
          'ARROW_RIGHT': 'decrease',
          'SHIFT_ARROW_LEFT': 'increase_fast',
          'SHIFT_ARROW_RIGHT': 'decrease_fast'
        }
      });
    }

    /**
     * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
     * @function
     * @private
     */
    _init() {
      this.inputs = this.$element.find('input');
      this.handles = this.$element.find('[data-slider-handle]');

      this.$handle = this.handles.eq(0);
      this.$input = this.inputs.length ? this.inputs.eq(0) : $(`#${ this.$handle.attr('aria-controls') }`);
      this.$fill = this.$element.find('[data-slider-fill]').css(this.options.vertical ? 'height' : 'width', 0);

      var isDbl = false,
          _this = this;
      if (this.options.disabled || this.$element.hasClass(this.options.disabledClass)) {
        this.options.disabled = true;
        this.$element.addClass(this.options.disabledClass);
      }
      if (!this.inputs.length) {
        this.inputs = $().add(this.$input);
        this.options.binding = true;
      }

      this._setInitAttr(0);

      if (this.handles[1]) {
        this.options.doubleSided = true;
        this.$handle2 = this.handles.eq(1);
        this.$input2 = this.inputs.length > 1 ? this.inputs.eq(1) : $(`#${ this.$handle2.attr('aria-controls') }`);

        if (!this.inputs[1]) {
          this.inputs = this.inputs.add(this.$input2);
        }
        isDbl = true;

        // this.$handle.triggerHandler('click.zf.slider');
        this._setInitAttr(1);
      }

      // Set handle positions
      this.setHandles();

      this._events();
    }

    setHandles() {
      if (this.handles[1]) {
        this._setHandlePos(this.$handle, this.inputs.eq(0).val(), true, () => {
          this._setHandlePos(this.$handle2, this.inputs.eq(1).val(), true);
        });
      } else {
        this._setHandlePos(this.$handle, this.inputs.eq(0).val(), true);
      }
    }

    _reflow() {
      this.setHandles();
    }
    /**
    * @function
    * @private
    * @param {Number} value - floating point (the value) to be transformed using to a relative position on the slider (the inverse of _value)
    */
    _pctOfBar(value) {
      var pctOfBar = percent(value - this.options.start, this.options.end - this.options.start);

      switch (this.options.positionValueFunction) {
        case "pow":
          pctOfBar = this._logTransform(pctOfBar);
          break;
        case "log":
          pctOfBar = this._powTransform(pctOfBar);
          break;
      }

      return pctOfBar.toFixed(2);
    }

    /**
    * @function
    * @private
    * @param {Number} pctOfBar - floating point, the relative position of the slider (typically between 0-1) to be transformed to a value
    */
    _value(pctOfBar) {
      switch (this.options.positionValueFunction) {
        case "pow":
          pctOfBar = this._powTransform(pctOfBar);
          break;
        case "log":
          pctOfBar = this._logTransform(pctOfBar);
          break;
      }
      var value = (this.options.end - this.options.start) * pctOfBar + this.options.start;

      return value;
    }

    /**
    * @function
    * @private
    * @param {Number} value - floating point (typically between 0-1) to be transformed using the log function
    */
    _logTransform(value) {
      return baseLog(this.options.nonLinearBase, value * (this.options.nonLinearBase - 1) + 1);
    }

    /**
    * @function
    * @private
    * @param {Number} value - floating point (typically between 0-1) to be transformed using the power function
    */
    _powTransform(value) {
      return (Math.pow(this.options.nonLinearBase, value) - 1) / (this.options.nonLinearBase - 1);
    }

    /**
     * Sets the position of the selected handle and fill bar.
     * @function
     * @private
     * @param {jQuery} $hndl - the selected handle to move.
     * @param {Number} location - floating point between the start and end values of the slider bar.
     * @param {Function} cb - callback function to fire on completion.
     * @fires Slider#moved
     * @fires Slider#changed
     */
    _setHandlePos($hndl, location, noInvert, cb) {
      // don't move if the slider has been disabled since its initialization
      if (this.$element.hasClass(this.options.disabledClass)) {
        return;
      }
      //might need to alter that slightly for bars that will have odd number selections.
      location = parseFloat(location); //on input change events, convert string to number...grumble.

      // prevent slider from running out of bounds, if value exceeds the limits set through options, override the value to min/max
      if (location < this.options.start) {
        location = this.options.start;
      } else if (location > this.options.end) {
        location = this.options.end;
      }

      var isDbl = this.options.doubleSided;

      if (isDbl) {
        //this block is to prevent 2 handles from crossing eachother. Could/should be improved.
        if (this.handles.index($hndl) === 0) {
          var h2Val = parseFloat(this.$handle2.attr('aria-valuenow'));
          location = location >= h2Val ? h2Val - this.options.step : location;
        } else {
          var h1Val = parseFloat(this.$handle.attr('aria-valuenow'));
          location = location <= h1Val ? h1Val + this.options.step : location;
        }
      }

      //this is for single-handled vertical sliders, it adjusts the value to account for the slider being "upside-down"
      //for click and drag events, it's weird due to the scale(-1, 1) css property
      if (this.options.vertical && !noInvert) {
        location = this.options.end - location;
      }

      var _this = this,
          vert = this.options.vertical,
          hOrW = vert ? 'height' : 'width',
          lOrT = vert ? 'top' : 'left',
          handleDim = $hndl[0].getBoundingClientRect()[hOrW],
          elemDim = this.$element[0].getBoundingClientRect()[hOrW],

      //percentage of bar min/max value based on click or drag point
      pctOfBar = this._pctOfBar(location),

      //number of actual pixels to shift the handle, based on the percentage obtained above
      pxToMove = (elemDim - handleDim) * pctOfBar,

      //percentage of bar to shift the handle
      movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal);
      //fixing the decimal value for the location number, is passed to other methods as a fixed floating-point value
      location = parseFloat(location.toFixed(this.options.decimal));
      // declare empty object for css adjustments, only used with 2 handled-sliders
      var css = {};

      this._setValues($hndl, location);

      // TODO update to calculate based on values set to respective inputs??
      if (isDbl) {
        var isLeftHndl = this.handles.index($hndl) === 0,

        //empty variable, will be used for min-height/width for fill bar
        dim,

        //percentage w/h of the handle compared to the slider bar
        handlePct = ~~(percent(handleDim, elemDim) * 100);
        //if left handle, the math is slightly different than if it's the right handle, and the left/top property needs to be changed for the fill bar
        if (isLeftHndl) {
          //left or top percentage value to apply to the fill bar.
          css[lOrT] = `${ movement }%`;
          //calculate the new min-height/width for the fill bar.
          dim = parseFloat(this.$handle2[0].style[lOrT]) - movement + handlePct;
          //this callback is necessary to prevent errors and allow the proper placement and initialization of a 2-handled slider
          //plus, it means we don't care if 'dim' isNaN on init, it won't be in the future.
          if (cb && typeof cb === 'function') {
            cb();
          } //this is only needed for the initialization of 2 handled sliders
        } else {
          //just caching the value of the left/bottom handle's left/top property
          var handlePos = parseFloat(this.$handle[0].style[lOrT]);
          //calculate the new min-height/width for the fill bar. Use isNaN to prevent false positives for numbers <= 0
          //based on the percentage of movement of the handle being manipulated, less the opposing handle's left/top position, plus the percentage w/h of the handle itself
          dim = movement - (isNaN(handlePos) ? (this.options.initialStart - this.options.start) / ((this.options.end - this.options.start) / 100) : handlePos) + handlePct;
        }
        // assign the min-height/width to our css object
        css[`min-${ hOrW }`] = `${ dim }%`;
      }

      this.$element.one('finished.zf.animate', function () {
        /**
         * Fires when the handle is done moving.
         * @event Slider#moved
         */
        _this.$element.trigger('moved.zf.slider', [$hndl]);
      });

      //because we don't know exactly how the handle will be moved, check the amount of time it should take to move.
      var moveTime = this.$element.data('dragging') ? 1000 / 60 : this.options.moveTime;

      Foundation.Move(moveTime, $hndl, function () {
        // adjusting the left/top property of the handle, based on the percentage calculated above
        // if movement isNaN, that is because the slider is hidden and we cannot determine handle width,
        // fall back to next best guess.
        if (isNaN(movement)) {
          $hndl.css(lOrT, `${ pctOfBar * 100 }%`);
        } else {
          $hndl.css(lOrT, `${ movement }%`);
        }

        if (!_this.options.doubleSided) {
          //if single-handled, a simple method to expand the fill bar
          _this.$fill.css(hOrW, `${ pctOfBar * 100 }%`);
        } else {
          //otherwise, use the css object we created above
          _this.$fill.css(css);
        }
      });

      /**
       * Fires when the value has not been change for a given time.
       * @event Slider#changed
       */
      clearTimeout(_this.timeout);
      _this.timeout = setTimeout(function () {
        _this.$element.trigger('changed.zf.slider', [$hndl]);
      }, _this.options.changedDelay);
    }

    /**
     * Sets the initial attribute for the slider element.
     * @function
     * @private
     * @param {Number} idx - index of the current handle/input to use.
     */
    _setInitAttr(idx) {
      var initVal = idx === 0 ? this.options.initialStart : this.options.initialEnd;
      var id = this.inputs.eq(idx).attr('id') || Foundation.GetYoDigits(6, 'slider');
      this.inputs.eq(idx).attr({
        'id': id,
        'max': this.options.end,
        'min': this.options.start,
        'step': this.options.step
      });
      this.inputs.eq(idx).val(initVal);
      this.handles.eq(idx).attr({
        'role': 'slider',
        'aria-controls': id,
        'aria-valuemax': this.options.end,
        'aria-valuemin': this.options.start,
        'aria-valuenow': initVal,
        'aria-orientation': this.options.vertical ? 'vertical' : 'horizontal',
        'tabindex': 0
      });
    }

    /**
     * Sets the input and `aria-valuenow` values for the slider element.
     * @function
     * @private
     * @param {jQuery} $handle - the currently selected handle.
     * @param {Number} val - floating point of the new value.
     */
    _setValues($handle, val) {
      var idx = this.options.doubleSided ? this.handles.index($handle) : 0;
      this.inputs.eq(idx).val(val);
      $handle.attr('aria-valuenow', val);
    }

    /**
     * Handles events on the slider element.
     * Calculates the new location of the current handle.
     * If there are two handles and the bar was clicked, it determines which handle to move.
     * @function
     * @private
     * @param {Object} e - the `event` object passed from the listener.
     * @param {jQuery} $handle - the current handle to calculate for, if selected.
     * @param {Number} val - floating point number for the new value of the slider.
     * TODO clean this up, there's a lot of repeated code between this and the _setHandlePos fn.
     */
    _handleEvent(e, $handle, val) {
      var value, hasVal;
      if (!val) {
        //click or drag events
        e.preventDefault();
        var _this = this,
            vertical = this.options.vertical,
            param = vertical ? 'height' : 'width',
            direction = vertical ? 'top' : 'left',
            eventOffset = vertical ? e.pageY : e.pageX,
            halfOfHandle = this.$handle[0].getBoundingClientRect()[param] / 2,
            barDim = this.$element[0].getBoundingClientRect()[param],
            windowScroll = vertical ? $(window).scrollTop() : $(window).scrollLeft();

        var elemOffset = this.$element.offset()[direction];

        // touch events emulated by the touch util give position relative to screen, add window.scroll to event coordinates...
        // best way to guess this is simulated is if clientY == pageY
        if (e.clientY === e.pageY) {
          eventOffset = eventOffset + windowScroll;
        }
        var eventFromBar = eventOffset - elemOffset;
        var barXY;
        if (eventFromBar < 0) {
          barXY = 0;
        } else if (eventFromBar > barDim) {
          barXY = barDim;
        } else {
          barXY = eventFromBar;
        }
        var offsetPct = percent(barXY, barDim);

        value = this._value(offsetPct);

        // turn everything around for RTL, yay math!
        if (Foundation.rtl() && !this.options.vertical) {
          value = this.options.end - value;
        }

        value = _this._adjustValue(null, value);
        //boolean flag for the setHandlePos fn, specifically for vertical sliders
        hasVal = false;

        if (!$handle) {
          //figure out which handle it is, pass it to the next function.
          var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
              secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
          $handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
        }
      } else {
        //change event on input
        value = this._adjustValue(null, val);
        hasVal = true;
      }

      this._setHandlePos($handle, value, hasVal);
    }

    /**
     * Adjustes value for handle in regard to step value. returns adjusted value
     * @function
     * @private
     * @param {jQuery} $handle - the selected handle.
     * @param {Number} value - value to adjust. used if $handle is falsy
     */
    _adjustValue($handle, value) {
      var val,
          step = this.options.step,
          div = parseFloat(step / 2),
          left,
          prev_val,
          next_val;
      if (!!$handle) {
        val = parseFloat($handle.attr('aria-valuenow'));
      } else {
        val = value;
      }
      left = val % step;
      prev_val = val - left;
      next_val = prev_val + step;
      if (left === 0) {
        return val;
      }
      val = val >= prev_val + div ? next_val : prev_val;
      return val;
    }

    /**
     * Adds event listeners to the slider elements.
     * @function
     * @private
     */
    _events() {
      this._eventsForHandle(this.$handle);
      if (this.handles[1]) {
        this._eventsForHandle(this.$handle2);
      }
    }

    /**
     * Adds event listeners a particular handle
     * @function
     * @private
     * @param {jQuery} $handle - the current handle to apply listeners to.
     */
    _eventsForHandle($handle) {
      var _this = this,
          curHandle,
          timer;

      this.inputs.off('change.zf.slider').on('change.zf.slider', function (e) {
        var idx = _this.inputs.index($(this));
        _this._handleEvent(e, _this.handles.eq(idx), $(this).val());
      });

      if (this.options.clickSelect) {
        this.$element.off('click.zf.slider').on('click.zf.slider', function (e) {
          if (_this.$element.data('dragging')) {
            return false;
          }

          if (!$(e.target).is('[data-slider-handle]')) {
            if (_this.options.doubleSided) {
              _this._handleEvent(e);
            } else {
              _this._handleEvent(e, _this.$handle);
            }
          }
        });
      }

      if (this.options.draggable) {
        this.handles.addTouch();

        var $body = $('body');
        $handle.off('mousedown.zf.slider').on('mousedown.zf.slider', function (e) {
          $handle.addClass('is-dragging');
          _this.$fill.addClass('is-dragging'); //
          _this.$element.data('dragging', true);

          curHandle = $(e.currentTarget);

          $body.on('mousemove.zf.slider', function (e) {
            e.preventDefault();
            _this._handleEvent(e, curHandle);
          }).on('mouseup.zf.slider', function (e) {
            _this._handleEvent(e, curHandle);

            $handle.removeClass('is-dragging');
            _this.$fill.removeClass('is-dragging');
            _this.$element.data('dragging', false);

            $body.off('mousemove.zf.slider mouseup.zf.slider');
          });
        })
        // prevent events triggered by touch
        .on('selectstart.zf.slider touchmove.zf.slider', function (e) {
          e.preventDefault();
        });
      }

      $handle.off('keydown.zf.slider').on('keydown.zf.slider', function (e) {
        var _$handle = $(this),
            idx = _this.options.doubleSided ? _this.handles.index(_$handle) : 0,
            oldValue = parseFloat(_this.inputs.eq(idx).val()),
            newValue;

        // handle keyboard event with keyboard util
        Foundation.Keyboard.handleKey(e, 'Slider', {
          decrease: function () {
            newValue = oldValue - _this.options.step;
          },
          increase: function () {
            newValue = oldValue + _this.options.step;
          },
          decrease_fast: function () {
            newValue = oldValue - _this.options.step * 10;
          },
          increase_fast: function () {
            newValue = oldValue + _this.options.step * 10;
          },
          handled: function () {
            // only set handle pos when event was handled specially
            e.preventDefault();
            _this._setHandlePos(_$handle, newValue, true);
          }
        });
        /*if (newValue) { // if pressed key has special function, update value
          e.preventDefault();
          _this._setHandlePos(_$handle, newValue);
        }*/
      });
    }

    /**
     * Destroys the slider plugin.
     */
    destroy() {
      this.handles.off('.zf.slider');
      this.inputs.off('.zf.slider');
      this.$element.off('.zf.slider');

      clearTimeout(this.timeout);

      Foundation.unregisterPlugin(this);
    }
  }

  Slider.defaults = {
    /**
     * Minimum value for the slider scale.
     * @option
     * @example 0
     */
    start: 0,
    /**
     * Maximum value for the slider scale.
     * @option
     * @example 100
     */
    end: 100,
    /**
     * Minimum value change per change event.
     * @option
     * @example 1
     */
    step: 1,
    /**
     * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
     * @option
     * @example 0
     */
    initialStart: 0,
    /**
     * Value at which the right handle/second input should be set to on initialization.
     * @option
     * @example 100
     */
    initialEnd: 100,
    /**
     * Allows the input to be located outside the container and visible. Set to by the JS
     * @option
     * @example false
     */
    binding: false,
    /**
     * Allows the user to click/tap on the slider bar to select a value.
     * @option
     * @example true
     */
    clickSelect: true,
    /**
     * Set to true and use the `vertical` class to change alignment to vertical.
     * @option
     * @example false
     */
    vertical: false,
    /**
     * Allows the user to drag the slider handle(s) to select a value.
     * @option
     * @example true
     */
    draggable: true,
    /**
     * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
     * @option
     * @example false
     */
    disabled: false,
    /**
     * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
     * @option
     * @example false
     */
    doubleSided: false,
    /**
     * Potential future feature.
     */
    // steps: 100,
    /**
     * Number of decimal places the plugin should go to for floating point precision.
     * @option
     * @example 2
     */
    decimal: 2,
    /**
     * Time delay for dragged elements.
     */
    // dragDelay: 0,
    /**
     * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
     * @option
     * @example 200
     */
    moveTime: 200, //update this if changing the transition time in the sass
    /**
     * Class applied to disabled sliders.
     * @option
     * @example 'disabled'
     */
    disabledClass: 'disabled',
    /**
     * Will invert the default layout for a vertical<span data-tooltip title="who would do this???"> </span>slider.
     * @option
     * @example false
     */
    invertVertical: false,
    /**
     * Milliseconds before the `changed.zf-slider` event is triggered after value change.
     * @option
     * @example 500
     */
    changedDelay: 500,
    /**
    * Basevalue for non-linear sliders
    * @option
    * @example 5
    */
    nonLinearBase: 5,
    /**
    * Basevalue for non-linear sliders, possible values are: 'linear', 'pow' & 'log'. Pow and Log use the nonLinearBase setting.
    * @option
    * @example 'linear'
    */
    positionValueFunction: 'linear'
  };

  function percent(frac, num) {
    return frac / num;
  }
  function absPosition($handle, dir, clickPos, param) {
    return Math.abs($handle.position()[dir] + $handle[param]() / 2 - clickPos);
  }
  function baseLog(base, value) {
    return Math.log(value) / Math.log(base);
  }

  // Window exports
  Foundation.plugin(Slider, 'Slider');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Sticky module.
   * @module foundation.sticky
   * @requires foundation.util.triggers
   * @requires foundation.util.mediaQuery
   */

  class Sticky {
    /**
     * Creates a new instance of a sticky thing.
     * @class
     * @param {jQuery} element - jQuery object to make sticky.
     * @param {Object} options - options object passed when creating the element programmatically.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Sticky.defaults, this.$element.data(), options);

      this._init();

      Foundation.registerPlugin(this, 'Sticky');
    }

    /**
     * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
     * @function
     * @private
     */
    _init() {
      var $parent = this.$element.parent('[data-sticky-container]'),
          id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
          _this = this;

      if (!$parent.length) {
        this.wasWrapped = true;
      }
      this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
      this.$container.addClass(this.options.containerClass);

      this.$element.addClass(this.options.stickyClass).attr({ 'data-resize': id });

      this.scrollCount = this.options.checkEvery;
      this.isStuck = false;
      $(window).one('load.zf.sticky', function () {
        //We calculate the container height to have correct values for anchor points offset calculation.
        _this.containerHeight = _this.$element.css("display") == "none" ? 0 : _this.$element[0].getBoundingClientRect().height;
        _this.$container.css('height', _this.containerHeight);
        _this.elemHeight = _this.containerHeight;
        if (_this.options.anchor !== '') {
          _this.$anchor = $('#' + _this.options.anchor);
        } else {
          _this._parsePoints();
        }

        _this._setSizes(function () {
          var scroll = window.pageYOffset;
          _this._calc(false, scroll);
          //Unstick the element will ensure that proper classes are set.
          if (!_this.isStuck) {
            _this._removeSticky(scroll >= _this.topPoint ? false : true);
          }
        });
        _this._events(id.split('-').reverse().join('-'));
      });
    }

    /**
     * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
     * @function
     * @private
     */
    _parsePoints() {
      var top = this.options.topAnchor == "" ? 1 : this.options.topAnchor,
          btm = this.options.btmAnchor == "" ? document.documentElement.scrollHeight : this.options.btmAnchor,
          pts = [top, btm],
          breaks = {};
      for (var i = 0, len = pts.length; i < len && pts[i]; i++) {
        var pt;
        if (typeof pts[i] === 'number') {
          pt = pts[i];
        } else {
          var place = pts[i].split(':'),
              anchor = $(`#${ place[0] }`);

          pt = anchor.offset().top;
          if (place[1] && place[1].toLowerCase() === 'bottom') {
            pt += anchor[0].getBoundingClientRect().height;
          }
        }
        breaks[i] = pt;
      }

      this.points = breaks;
      return;
    }

    /**
     * Adds event handlers for the scrolling element.
     * @private
     * @param {String} id - psuedo-random id for unique scroll event listener.
     */
    _events(id) {
      var _this = this,
          scrollListener = this.scrollListener = `scroll.zf.${ id }`;
      if (this.isOn) {
        return;
      }
      if (this.canStick) {
        this.isOn = true;
        $(window).off(scrollListener).on(scrollListener, function (e) {
          if (_this.scrollCount === 0) {
            _this.scrollCount = _this.options.checkEvery;
            _this._setSizes(function () {
              _this._calc(false, window.pageYOffset);
            });
          } else {
            _this.scrollCount--;
            _this._calc(false, window.pageYOffset);
          }
        });
      }

      this.$element.off('resizeme.zf.trigger').on('resizeme.zf.trigger', function (e, el) {
        _this._setSizes(function () {
          _this._calc(false);
          if (_this.canStick) {
            if (!_this.isOn) {
              _this._events(id);
            }
          } else if (_this.isOn) {
            _this._pauseListeners(scrollListener);
          }
        });
      });
    }

    /**
     * Removes event handlers for scroll and change events on anchor.
     * @fires Sticky#pause
     * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
     */
    _pauseListeners(scrollListener) {
      this.isOn = false;
      $(window).off(scrollListener);

      /**
       * Fires when the plugin is paused due to resize event shrinking the view.
       * @event Sticky#pause
       * @private
       */
      this.$element.trigger('pause.zf.sticky');
    }

    /**
     * Called on every `scroll` event and on `_init`
     * fires functions based on booleans and cached values
     * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
     * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
     */
    _calc(checkSizes, scroll) {
      if (checkSizes) {
        this._setSizes();
      }

      if (!this.canStick) {
        if (this.isStuck) {
          this._removeSticky(true);
        }
        return false;
      }

      if (!scroll) {
        scroll = window.pageYOffset;
      }

      if (scroll >= this.topPoint) {
        if (scroll <= this.bottomPoint) {
          if (!this.isStuck) {
            this._setSticky();
          }
        } else {
          if (this.isStuck) {
            this._removeSticky(false);
          }
        }
      } else {
        if (this.isStuck) {
          this._removeSticky(true);
        }
      }
    }

    /**
     * Causes the $element to become stuck.
     * Adds `position: fixed;`, and helper classes.
     * @fires Sticky#stuckto
     * @function
     * @private
     */
    _setSticky() {
      var _this = this,
          stickTo = this.options.stickTo,
          mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
          notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
          css = {};

      css[mrgn] = `${ this.options[mrgn] }em`;
      css[stickTo] = 0;
      css[notStuckTo] = 'auto';
      this.isStuck = true;
      this.$element.removeClass(`is-anchored is-at-${ notStuckTo }`).addClass(`is-stuck is-at-${ stickTo }`).css(css)
      /**
       * Fires when the $element has become `position: fixed;`
       * Namespaced to `top` or `bottom`, e.g. `sticky.zf.stuckto:top`
       * @event Sticky#stuckto
       */
      .trigger(`sticky.zf.stuckto:${ stickTo }`);
      this.$element.on("transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd", function () {
        _this._setSizes();
      });
    }

    /**
     * Causes the $element to become unstuck.
     * Removes `position: fixed;`, and helper classes.
     * Adds other helper classes.
     * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
     * @fires Sticky#unstuckfrom
     * @private
     */
    _removeSticky(isTop) {
      var stickTo = this.options.stickTo,
          stickToTop = stickTo === 'top',
          css = {},
          anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
          mrgn = stickToTop ? 'marginTop' : 'marginBottom',
          notStuckTo = stickToTop ? 'bottom' : 'top',
          topOrBottom = isTop ? 'top' : 'bottom';

      css[mrgn] = 0;

      css['bottom'] = 'auto';
      if (isTop) {
        css['top'] = 0;
      } else {
        css['top'] = anchorPt;
      }

      this.isStuck = false;
      this.$element.removeClass(`is-stuck is-at-${ stickTo }`).addClass(`is-anchored is-at-${ topOrBottom }`).css(css)
      /**
       * Fires when the $element has become anchored.
       * Namespaced to `top` or `bottom`, e.g. `sticky.zf.unstuckfrom:bottom`
       * @event Sticky#unstuckfrom
       */
      .trigger(`sticky.zf.unstuckfrom:${ topOrBottom }`);
    }

    /**
     * Sets the $element and $container sizes for plugin.
     * Calls `_setBreakPoints`.
     * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
     * @private
     */
    _setSizes(cb) {
      this.canStick = Foundation.MediaQuery.is(this.options.stickyOn);
      if (!this.canStick) {
        if (cb && typeof cb === 'function') {
          cb();
        }
      }
      var _this = this,
          newElemWidth = this.$container[0].getBoundingClientRect().width,
          comp = window.getComputedStyle(this.$container[0]),
          pdngl = parseInt(comp['padding-left'], 10),
          pdngr = parseInt(comp['padding-right'], 10);

      if (this.$anchor && this.$anchor.length) {
        this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
      } else {
        this._parsePoints();
      }

      this.$element.css({
        'max-width': `${ newElemWidth - pdngl - pdngr }px`
      });

      var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
      if (this.$element.css("display") == "none") {
        newContainerHeight = 0;
      }
      this.containerHeight = newContainerHeight;
      this.$container.css({
        height: newContainerHeight
      });
      this.elemHeight = newContainerHeight;

      if (!this.isStuck) {
        if (this.$element.hasClass('is-at-bottom')) {
          var anchorPt = (this.points ? this.points[1] - this.$container.offset().top : this.anchorHeight) - this.elemHeight;
          this.$element.css('top', anchorPt);
        }
      }

      this._setBreakPoints(newContainerHeight, function () {
        if (cb && typeof cb === 'function') {
          cb();
        }
      });
    }

    /**
     * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
     * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
     * @param {Function} cb - optional callback function to be called on completion.
     * @private
     */
    _setBreakPoints(elemHeight, cb) {
      if (!this.canStick) {
        if (cb && typeof cb === 'function') {
          cb();
        } else {
          return false;
        }
      }
      var mTop = emCalc(this.options.marginTop),
          mBtm = emCalc(this.options.marginBottom),
          topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
          bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,

      // topPoint = this.$anchor.offset().top || this.points[0],
      // bottomPoint = topPoint + this.anchorHeight || this.points[1],
      winHeight = window.innerHeight;

      if (this.options.stickTo === 'top') {
        topPoint -= mTop;
        bottomPoint -= elemHeight + mTop;
      } else if (this.options.stickTo === 'bottom') {
        topPoint -= winHeight - (elemHeight + mBtm);
        bottomPoint -= winHeight - mBtm;
      } else {
        //this would be the stickTo: both option... tricky
      }

      this.topPoint = topPoint;
      this.bottomPoint = bottomPoint;

      if (cb && typeof cb === 'function') {
        cb();
      }
    }

    /**
     * Destroys the current sticky element.
     * Resets the element to the top position first.
     * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
     * @function
     */
    destroy() {
      this._removeSticky(true);

      this.$element.removeClass(`${ this.options.stickyClass } is-anchored is-at-top`).css({
        height: '',
        top: '',
        bottom: '',
        'max-width': ''
      }).off('resizeme.zf.trigger');
      if (this.$anchor && this.$anchor.length) {
        this.$anchor.off('change.zf.sticky');
      }
      $(window).off(this.scrollListener);

      if (this.wasWrapped) {
        this.$element.unwrap();
      } else {
        this.$container.removeClass(this.options.containerClass).css({
          height: ''
        });
      }
      Foundation.unregisterPlugin(this);
    }
  }

  Sticky.defaults = {
    /**
     * Customizable container template. Add your own classes for styling and sizing.
     * @option
     * @example '&lt;div data-sticky-container class="small-6 columns"&gt;&lt;/div&gt;'
     */
    container: '<div data-sticky-container></div>',
    /**
     * Location in the view the element sticks to.
     * @option
     * @example 'top'
     */
    stickTo: 'top',
    /**
     * If anchored to a single element, the id of that element.
     * @option
     * @example 'exampleId'
     */
    anchor: '',
    /**
     * If using more than one element as anchor points, the id of the top anchor.
     * @option
     * @example 'exampleId:top'
     */
    topAnchor: '',
    /**
     * If using more than one element as anchor points, the id of the bottom anchor.
     * @option
     * @example 'exampleId:bottom'
     */
    btmAnchor: '',
    /**
     * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginTop: 1,
    /**
     * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginBottom: 1,
    /**
     * Breakpoint string that is the minimum screen size an element should become sticky.
     * @option
     * @example 'medium'
     */
    stickyOn: 'medium',
    /**
     * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
     * @option
     * @example 'sticky'
     */
    stickyClass: 'sticky',
    /**
     * Class applied to sticky container. Foundation defaults to `sticky-container`.
     * @option
     * @example 'sticky-container'
     */
    containerClass: 'sticky-container',
    /**
     * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
     * @option
     * @example 50
     */
    checkEvery: -1
  };

  /**
   * Helper function to calculate em values
   * @param Number {em} - number of em's to calculate into pixels
   */
  function emCalc(em) {
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }

  // Window exports
  Foundation.plugin(Sticky, 'Sticky');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Tabs module.
   * @module foundation.tabs
   * @requires foundation.util.keyboard
   * @requires foundation.util.timerAndImageLoader if tabs contain images
   */

  class Tabs {
    /**
     * Creates a new instance of tabs.
     * @class
     * @fires Tabs#init
     * @param {jQuery} element - jQuery object to make into tabs.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Tabs.defaults, this.$element.data(), options);

      this._init();
      Foundation.registerPlugin(this, 'Tabs');
      Foundation.Keyboard.register('Tabs', {
        'ENTER': 'open',
        'SPACE': 'open',
        'ARROW_RIGHT': 'next',
        'ARROW_UP': 'previous',
        'ARROW_DOWN': 'next',
        'ARROW_LEFT': 'previous'
        // 'TAB': 'next',
        // 'SHIFT_TAB': 'previous'
      });
    }

    /**
     * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
     * @private
     */
    _init() {
      var _this = this;

      this.$element.attr({ 'role': 'tablist' });
      this.$tabTitles = this.$element.find(`.${ this.options.linkClass }`);
      this.$tabContent = $(`[data-tabs-content="${ this.$element[0].id }"]`);

      this.$tabTitles.each(function () {
        var $elem = $(this),
            $link = $elem.find('a'),
            isActive = $elem.hasClass(`${ _this.options.linkActiveClass }`),
            hash = $link[0].hash.slice(1),
            linkId = $link[0].id ? $link[0].id : `${ hash }-label`,
            $tabContent = $(`#${ hash }`);

        $elem.attr({ 'role': 'presentation' });

        $link.attr({
          'role': 'tab',
          'aria-controls': hash,
          'aria-selected': isActive,
          'id': linkId
        });

        $tabContent.attr({
          'role': 'tabpanel',
          'aria-hidden': !isActive,
          'aria-labelledby': linkId
        });

        if (isActive && _this.options.autoFocus) {
          $(window).load(function () {
            $('html, body').animate({ scrollTop: $elem.offset().top }, _this.options.deepLinkSmudgeDelay, () => {
              $link.focus();
            });
          });
        }

        //use browser to open a tab, if it exists in this tabset
        if (_this.options.deepLink) {
          var anchor = window.location.hash;
          //need a hash and a relevant anchor in this tabset
          if (anchor.length) {
            var $link = $elem.find('[href="' + anchor + '"]');
            if ($link.length) {
              _this.selectTab($(anchor));

              //roll up a little to show the titles
              if (_this.options.deepLinkSmudge) {
                $(window).load(function () {
                  var offset = $elem.offset();
                  $('html, body').animate({ scrollTop: offset.top }, _this.options.deepLinkSmudgeDelay);
                });
              }

              /**
                * Fires when the zplugin has deeplinked at pageload
                * @event Tabs#deeplink
                */
              $elem.trigger('deeplink.zf.tabs', [$link, $(anchor)]);
            }
          }
        }
      });

      if (this.options.matchHeight) {
        var $images = this.$tabContent.find('img');

        if ($images.length) {
          Foundation.onImagesLoaded($images, this._setHeight.bind(this));
        } else {
          this._setHeight();
        }
      }

      this._events();
    }

    /**
     * Adds event handlers for items within the tabs.
     * @private
     */
    _events() {
      this._addKeyHandler();
      this._addClickHandler();
      this._setHeightMqHandler = null;

      if (this.options.matchHeight) {
        this._setHeightMqHandler = this._setHeight.bind(this);

        $(window).on('changed.zf.mediaquery', this._setHeightMqHandler);
      }
    }

    /**
     * Adds click handlers for items within the tabs.
     * @private
     */
    _addClickHandler() {
      var _this = this;

      this.$element.off('click.zf.tabs').on('click.zf.tabs', `.${ this.options.linkClass }`, function (e) {
        e.preventDefault();
        e.stopPropagation();
        _this._handleTabChange($(this));
      });
    }

    /**
     * Adds keyboard event handlers for items within the tabs.
     * @private
     */
    _addKeyHandler() {
      var _this = this;

      this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function (e) {
        if (e.which === 9) return;

        var $element = $(this),
            $elements = $element.parent('ul').children('li'),
            $prevElement,
            $nextElement;

        $elements.each(function (i) {
          if ($(this).is($element)) {
            if (_this.options.wrapOnKeys) {
              $prevElement = i === 0 ? $elements.last() : $elements.eq(i - 1);
              $nextElement = i === $elements.length - 1 ? $elements.first() : $elements.eq(i + 1);
            } else {
              $prevElement = $elements.eq(Math.max(0, i - 1));
              $nextElement = $elements.eq(Math.min(i + 1, $elements.length - 1));
            }
            return;
          }
        });

        // handle keyboard event with keyboard util
        Foundation.Keyboard.handleKey(e, 'Tabs', {
          open: function () {
            $element.find('[role="tab"]').focus();
            _this._handleTabChange($element);
          },
          previous: function () {
            $prevElement.find('[role="tab"]').focus();
            _this._handleTabChange($prevElement);
          },
          next: function () {
            $nextElement.find('[role="tab"]').focus();
            _this._handleTabChange($nextElement);
          },
          handled: function () {
            e.stopPropagation();
            e.preventDefault();
          }
        });
      });
    }

    /**
     * Opens the tab `$targetContent` defined by `$target`. Collapses active tab.
     * @param {jQuery} $target - Tab to open.
     * @fires Tabs#change
     * @function
     */
    _handleTabChange($target) {

      /**
       * Check for active class on target. Collapse if exists.
       */
      if ($target.hasClass(`${ this.options.linkActiveClass }`)) {
        if (this.options.activeCollapse) {
          this._collapseTab($target);

          /**
           * Fires when the zplugin has successfully collapsed tabs.
           * @event Tabs#collapse
           */
          this.$element.trigger('collapse.zf.tabs', [$target]);
        }
        return;
      }

      var $oldTab = this.$element.find(`.${ this.options.linkClass }.${ this.options.linkActiveClass }`),
          $tabLink = $target.find('[role="tab"]'),
          hash = $tabLink[0].hash,
          $targetContent = this.$tabContent.find(hash);

      //close old tab
      this._collapseTab($oldTab);

      //open new tab
      this._openTab($target);

      //either replace or update browser history
      if (this.options.deepLink) {
        var anchor = $target.find('a').attr('href');

        if (this.options.updateHistory) {
          history.pushState({}, '', anchor);
        } else {
          history.replaceState({}, '', anchor);
        }
      }

      /**
       * Fires when the plugin has successfully changed tabs.
       * @event Tabs#change
       */
      this.$element.trigger('change.zf.tabs', [$target, $targetContent]);

      //fire to children a mutation event
      $targetContent.find("[data-mutate]").trigger("mutateme.zf.trigger");
    }

    /**
     * Opens the tab `$targetContent` defined by `$target`.
     * @param {jQuery} $target - Tab to Open.
     * @function
     */
    _openTab($target) {
      var $tabLink = $target.find('[role="tab"]'),
          hash = $tabLink[0].hash,
          $targetContent = this.$tabContent.find(hash);

      $target.addClass(`${ this.options.linkActiveClass }`);

      $tabLink.attr({ 'aria-selected': 'true' });

      $targetContent.addClass(`${ this.options.panelActiveClass }`).attr({ 'aria-hidden': 'false' });
    }

    /**
     * Collapses `$targetContent` defined by `$target`.
     * @param {jQuery} $target - Tab to Open.
     * @function
     */
    _collapseTab($target) {
      var $target_anchor = $target.removeClass(`${ this.options.linkActiveClass }`).find('[role="tab"]').attr({ 'aria-selected': 'false' });

      $(`#${ $target_anchor.attr('aria-controls') }`).removeClass(`${ this.options.panelActiveClass }`).attr({ 'aria-hidden': 'true' });
    }

    /**
     * Public method for selecting a content pane to display.
     * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
     * @function
     */
    selectTab(elem) {
      var idStr;

      if (typeof elem === 'object') {
        idStr = elem[0].id;
      } else {
        idStr = elem;
      }

      if (idStr.indexOf('#') < 0) {
        idStr = `#${ idStr }`;
      }

      var $target = this.$tabTitles.find(`[href="${ idStr }"]`).parent(`.${ this.options.linkClass }`);

      this._handleTabChange($target);
    }
    /**
     * Sets the height of each panel to the height of the tallest panel.
     * If enabled in options, gets called on media query change.
     * If loading content via external source, can be called directly or with _reflow.
     * @function
     * @private
     */
    _setHeight() {
      var max = 0;
      this.$tabContent.find(`.${ this.options.panelClass }`).css('height', '').each(function () {
        var panel = $(this),
            isActive = panel.hasClass(`${ this.options.panelActiveClass }`);

        if (!isActive) {
          panel.css({ 'visibility': 'hidden', 'display': 'block' });
        }

        var temp = this.getBoundingClientRect().height;

        if (!isActive) {
          panel.css({
            'visibility': '',
            'display': ''
          });
        }

        max = temp > max ? temp : max;
      }).css('height', `${ max }px`);
    }

    /**
     * Destroys an instance of an tabs.
     * @fires Tabs#destroyed
     */
    destroy() {
      this.$element.find(`.${ this.options.linkClass }`).off('.zf.tabs').hide().end().find(`.${ this.options.panelClass }`).hide();

      if (this.options.matchHeight) {
        if (this._setHeightMqHandler != null) {
          $(window).off('changed.zf.mediaquery', this._setHeightMqHandler);
        }
      }

      Foundation.unregisterPlugin(this);
    }
  }

  Tabs.defaults = {
    /**
     * Allows the window to scroll to content of pane specified by hash anchor
     * @option
     * @example false
     */
    deepLink: false,

    /**
     * Adjust the deep link scroll to make sure the top of the tab panel is visible
     * @option
     * @example false
     */
    deepLinkSmudge: false,

    /**
     * Animation time (ms) for the deep link adjustment
     * @option
     * @example 300
     */
    deepLinkSmudgeDelay: 300,

    /**
     * Update the browser history with the open tab
     * @option
     * @example false
     */
    updateHistory: false,

    /**
     * Allows the window to scroll to content of active pane on load if set to true.
     * Not recommended if more than one tab panel per page.
     * @option
     * @example false
     */
    autoFocus: false,

    /**
     * Allows keyboard input to 'wrap' around the tab links.
     * @option
     * @example true
     */
    wrapOnKeys: true,

    /**
     * Allows the tab content panes to match heights if set to true.
     * @option
     * @example false
     */
    matchHeight: false,

    /**
     * Allows active tabs to collapse when clicked.
     * @option
     * @example false
     */
    activeCollapse: false,

    /**
     * Class applied to `li`'s in tab link list.
     * @option
     * @example 'tabs-title'
     */
    linkClass: 'tabs-title',

    /**
     * Class applied to the active `li` in tab link list.
     * @option
     * @example 'is-active'
     */
    linkActiveClass: 'is-active',

    /**
     * Class applied to the content containers.
     * @option
     * @example 'tabs-panel'
     */
    panelClass: 'tabs-panel',

    /**
     * Class applied to the active content container.
     * @option
     * @example 'is-active'
     */
    panelActiveClass: 'is-active'
  };

  // Window exports
  Foundation.plugin(Tabs, 'Tabs');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Toggler module.
   * @module foundation.toggler
   * @requires foundation.util.motion
   * @requires foundation.util.triggers
   */

  class Toggler {
    /**
     * Creates a new instance of Toggler.
     * @class
     * @fires Toggler#init
     * @param {Object} element - jQuery object to add the trigger to.
     * @param {Object} options - Overrides to the default plugin settings.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Toggler.defaults, element.data(), options);
      this.className = '';

      this._init();
      this._events();

      Foundation.registerPlugin(this, 'Toggler');
    }

    /**
     * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
     * @function
     * @private
     */
    _init() {
      var input;
      // Parse animation classes if they were set
      if (this.options.animate) {
        input = this.options.animate.split(' ');

        this.animationIn = input[0];
        this.animationOut = input[1] || null;
      }
      // Otherwise, parse toggle class
      else {
          input = this.$element.data('toggler');
          // Allow for a . at the beginning of the string
          this.className = input[0] === '.' ? input.slice(1) : input;
        }

      // Add ARIA attributes to triggers
      var id = this.$element[0].id;
      $(`[data-open="${ id }"], [data-close="${ id }"], [data-toggle="${ id }"]`).attr('aria-controls', id);
      // If the target is hidden, add aria-hidden
      this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
    }

    /**
     * Initializes events for the toggle trigger.
     * @function
     * @private
     */
    _events() {
      this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
    }

    /**
     * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
     * @function
     * @fires Toggler#on
     * @fires Toggler#off
     */
    toggle() {
      this[this.options.animate ? '_toggleAnimate' : '_toggleClass']();
    }

    _toggleClass() {
      this.$element.toggleClass(this.className);

      var isOn = this.$element.hasClass(this.className);
      if (isOn) {
        /**
         * Fires if the target element has the class after a toggle.
         * @event Toggler#on
         */
        this.$element.trigger('on.zf.toggler');
      } else {
        /**
         * Fires if the target element does not have the class after a toggle.
         * @event Toggler#off
         */
        this.$element.trigger('off.zf.toggler');
      }

      this._updateARIA(isOn);
      this.$element.find('[data-mutate]').trigger('mutateme.zf.trigger');
    }

    _toggleAnimate() {
      var _this = this;

      if (this.$element.is(':hidden')) {
        Foundation.Motion.animateIn(this.$element, this.animationIn, function () {
          _this._updateARIA(true);
          this.trigger('on.zf.toggler');
          this.find('[data-mutate]').trigger('mutateme.zf.trigger');
        });
      } else {
        Foundation.Motion.animateOut(this.$element, this.animationOut, function () {
          _this._updateARIA(false);
          this.trigger('off.zf.toggler');
          this.find('[data-mutate]').trigger('mutateme.zf.trigger');
        });
      }
    }

    _updateARIA(isOn) {
      this.$element.attr('aria-expanded', isOn ? true : false);
    }

    /**
     * Destroys the instance of Toggler on the element.
     * @function
     */
    destroy() {
      this.$element.off('.zf.toggler');
      Foundation.unregisterPlugin(this);
    }
  }

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  // Window exports
  Foundation.plugin(Toggler, 'Toggler');
}(jQuery);
;'use strict';

!function ($) {

  /**
   * Tooltip module.
   * @module foundation.tooltip
   * @requires foundation.util.box
   * @requires foundation.util.mediaQuery
   * @requires foundation.util.triggers
   */

  class Tooltip {
    /**
     * Creates a new instance of a Tooltip.
     * @class
     * @fires Tooltip#init
     * @param {jQuery} element - jQuery object to attach a tooltip to.
     * @param {Object} options - object to extend the default configuration.
     */
    constructor(element, options) {
      this.$element = element;
      this.options = $.extend({}, Tooltip.defaults, this.$element.data(), options);

      this.isActive = false;
      this.isClick = false;
      this._init();

      Foundation.registerPlugin(this, 'Tooltip');
    }

    /**
     * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
     * @private
     */
    _init() {
      var elemId = this.$element.attr('aria-describedby') || Foundation.GetYoDigits(6, 'tooltip');

      this.options.positionClass = this.options.positionClass || this._getPositionClass(this.$element);
      this.options.tipText = this.options.tipText || this.$element.attr('title');
      this.template = this.options.template ? $(this.options.template) : this._buildTemplate(elemId);

      if (this.options.allowHtml) {
        this.template.appendTo(document.body).html(this.options.tipText).hide();
      } else {
        this.template.appendTo(document.body).text(this.options.tipText).hide();
      }

      this.$element.attr({
        'title': '',
        'aria-describedby': elemId,
        'data-yeti-box': elemId,
        'data-toggle': elemId,
        'data-resize': elemId
      }).addClass(this.options.triggerClass);

      //helper variables to track movement on collisions
      this.usedPositions = [];
      this.counter = 4;
      this.classChanged = false;

      this._events();
    }

    /**
     * Grabs the current positioning class, if present, and returns the value or an empty string.
     * @private
     */
    _getPositionClass(element) {
      if (!element) {
        return '';
      }
      // var position = element.attr('class').match(/top|left|right/g);
      var position = element[0].className.match(/\b(top|left|right)\b/g);
      position = position ? position[0] : '';
      return position;
    }
    /**
     * builds the tooltip element, adds attributes, and returns the template.
     * @private
     */
    _buildTemplate(id) {
      var templateClasses = `${ this.options.tooltipClass } ${ this.options.positionClass } ${ this.options.templateClasses }`.trim();
      var $template = $('<div></div>').addClass(templateClasses).attr({
        'role': 'tooltip',
        'aria-hidden': true,
        'data-is-active': false,
        'data-is-focus': false,
        'id': id
      });
      return $template;
    }

    /**
     * Function that gets called if a collision event is detected.
     * @param {String} position - positioning class to try
     * @private
     */
    _reposition(position) {
      this.usedPositions.push(position ? position : 'bottom');

      //default, try switching to opposite side
      if (!position && this.usedPositions.indexOf('top') < 0) {
        this.template.addClass('top');
      } else if (position === 'top' && this.usedPositions.indexOf('bottom') < 0) {
        this.template.removeClass(position);
      } else if (position === 'left' && this.usedPositions.indexOf('right') < 0) {
        this.template.removeClass(position).addClass('right');
      } else if (position === 'right' && this.usedPositions.indexOf('left') < 0) {
        this.template.removeClass(position).addClass('left');
      }

      //if default change didn't work, try bottom or left first
      else if (!position && this.usedPositions.indexOf('top') > -1 && this.usedPositions.indexOf('left') < 0) {
          this.template.addClass('left');
        } else if (position === 'top' && this.usedPositions.indexOf('bottom') > -1 && this.usedPositions.indexOf('left') < 0) {
          this.template.removeClass(position).addClass('left');
        } else if (position === 'left' && this.usedPositions.indexOf('right') > -1 && this.usedPositions.indexOf('bottom') < 0) {
          this.template.removeClass(position);
        } else if (position === 'right' && this.usedPositions.indexOf('left') > -1 && this.usedPositions.indexOf('bottom') < 0) {
          this.template.removeClass(position);
        }
        //if nothing cleared, set to bottom
        else {
            this.template.removeClass(position);
          }
      this.classChanged = true;
      this.counter--;
    }

    /**
     * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
     * if the tooltip is larger than the screen width, default to full width - any user selected margin
     * @private
     */
    _setPosition() {
      var position = this._getPositionClass(this.template),
          $tipDims = Foundation.Box.GetDimensions(this.template),
          $anchorDims = Foundation.Box.GetDimensions(this.$element),
          direction = position === 'left' ? 'left' : position === 'right' ? 'left' : 'top',
          param = direction === 'top' ? 'height' : 'width',
          offset = param === 'height' ? this.options.vOffset : this.options.hOffset,
          _this = this;

      if ($tipDims.width >= $tipDims.windowDims.width || !this.counter && !Foundation.Box.ImNotTouchingYou(this.template)) {
        this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
          // this.$element.offset(Foundation.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
          'width': $anchorDims.windowDims.width - this.options.hOffset * 2,
          'height': 'auto'
        });
        return false;
      }

      this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center ' + (position || 'bottom'), this.options.vOffset, this.options.hOffset));

      while (!Foundation.Box.ImNotTouchingYou(this.template) && this.counter) {
        this._reposition(position);
        this._setPosition();
      }
    }

    /**
     * reveals the tooltip, and fires an event to close any other open tooltips on the page
     * @fires Tooltip#closeme
     * @fires Tooltip#show
     * @function
     */
    show() {
      if (this.options.showOn !== 'all' && !Foundation.MediaQuery.is(this.options.showOn)) {
        // console.error('The screen is too small to display this tooltip');
        return false;
      }

      var _this = this;
      this.template.css('visibility', 'hidden').show();
      this._setPosition();

      /**
       * Fires to close all other open tooltips on the page
       * @event Closeme#tooltip
       */
      this.$element.trigger('closeme.zf.tooltip', this.template.attr('id'));

      this.template.attr({
        'data-is-active': true,
        'aria-hidden': false
      });
      _this.isActive = true;
      // console.log(this.template);
      this.template.stop().hide().css('visibility', '').fadeIn(this.options.fadeInDuration, function () {
        //maybe do stuff?
      });
      /**
       * Fires when the tooltip is shown
       * @event Tooltip#show
       */
      this.$element.trigger('show.zf.tooltip');
    }

    /**
     * Hides the current tooltip, and resets the positioning class if it was changed due to collision
     * @fires Tooltip#hide
     * @function
     */
    hide() {
      // console.log('hiding', this.$element.data('yeti-box'));
      var _this = this;
      this.template.stop().attr({
        'aria-hidden': true,
        'data-is-active': false
      }).fadeOut(this.options.fadeOutDuration, function () {
        _this.isActive = false;
        _this.isClick = false;
        if (_this.classChanged) {
          _this.template.removeClass(_this._getPositionClass(_this.template)).addClass(_this.options.positionClass);

          _this.usedPositions = [];
          _this.counter = 4;
          _this.classChanged = false;
        }
      });
      /**
       * fires when the tooltip is hidden
       * @event Tooltip#hide
       */
      this.$element.trigger('hide.zf.tooltip');
    }

    /**
     * adds event listeners for the tooltip and its anchor
     * TODO combine some of the listeners like focus and mouseenter, etc.
     * @private
     */
    _events() {
      var _this = this;
      var $template = this.template;
      var isFocus = false;

      if (!this.options.disableHover) {

        this.$element.on('mouseenter.zf.tooltip', function (e) {
          if (!_this.isActive) {
            _this.timeout = setTimeout(function () {
              _this.show();
            }, _this.options.hoverDelay);
          }
        }).on('mouseleave.zf.tooltip', function (e) {
          clearTimeout(_this.timeout);
          if (!isFocus || _this.isClick && !_this.options.clickOpen) {
            _this.hide();
          }
        });
      }

      if (this.options.clickOpen) {
        this.$element.on('mousedown.zf.tooltip', function (e) {
          e.stopImmediatePropagation();
          if (_this.isClick) {
            //_this.hide();
            // _this.isClick = false;
          } else {
            _this.isClick = true;
            if ((_this.options.disableHover || !_this.$element.attr('tabindex')) && !_this.isActive) {
              _this.show();
            }
          }
        });
      } else {
        this.$element.on('mousedown.zf.tooltip', function (e) {
          e.stopImmediatePropagation();
          _this.isClick = true;
        });
      }

      if (!this.options.disableForTouch) {
        this.$element.on('tap.zf.tooltip touchend.zf.tooltip', function (e) {
          _this.isActive ? _this.hide() : _this.show();
        });
      }

      this.$element.on({
        // 'toggle.zf.trigger': this.toggle.bind(this),
        // 'close.zf.trigger': this.hide.bind(this)
        'close.zf.trigger': this.hide.bind(this)
      });

      this.$element.on('focus.zf.tooltip', function (e) {
        isFocus = true;
        if (_this.isClick) {
          // If we're not showing open on clicks, we need to pretend a click-launched focus isn't
          // a real focus, otherwise on hover and come back we get bad behavior
          if (!_this.options.clickOpen) {
            isFocus = false;
          }
          return false;
        } else {
          _this.show();
        }
      }).on('focusout.zf.tooltip', function (e) {
        isFocus = false;
        _this.isClick = false;
        _this.hide();
      }).on('resizeme.zf.trigger', function () {
        if (_this.isActive) {
          _this._setPosition();
        }
      });
    }

    /**
     * adds a toggle method, in addition to the static show() & hide() functions
     * @function
     */
    toggle() {
      if (this.isActive) {
        this.hide();
      } else {
        this.show();
      }
    }

    /**
     * Destroys an instance of tooltip, removes template element from the view.
     * @function
     */
    destroy() {
      this.$element.attr('title', this.template.text()).off('.zf.trigger .zf.tooltip').removeClass('has-tip top right left').removeAttr('aria-describedby aria-haspopup data-disable-hover data-resize data-toggle data-tooltip data-yeti-box');

      this.template.remove();

      Foundation.unregisterPlugin(this);
    }
  }

  Tooltip.defaults = {
    disableForTouch: false,
    /**
     * Time, in ms, before a tooltip should open on hover.
     * @option
     * @example 200
     */
    hoverDelay: 200,
    /**
     * Time, in ms, a tooltip should take to fade into view.
     * @option
     * @example 150
     */
    fadeInDuration: 150,
    /**
     * Time, in ms, a tooltip should take to fade out of view.
     * @option
     * @example 150
     */
    fadeOutDuration: 150,
    /**
     * Disables hover events from opening the tooltip if set to true
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Optional addtional classes to apply to the tooltip template on init.
     * @option
     * @example 'my-cool-tip-class'
     */
    templateClasses: '',
    /**
     * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
     * @option
     * @example 'tooltip'
     */
    tooltipClass: 'tooltip',
    /**
     * Class applied to the tooltip anchor element.
     * @option
     * @example 'has-tip'
     */
    triggerClass: 'has-tip',
    /**
     * Minimum breakpoint size at which to open the tooltip.
     * @option
     * @example 'small'
     */
    showOn: 'small',
    /**
     * Custom template to be used to generate markup for tooltip.
     * @option
     * @example '&lt;div class="tooltip"&gt;&lt;/div&gt;'
     */
    template: '',
    /**
     * Text displayed in the tooltip template on open.
     * @option
     * @example 'Some cool space fact here.'
     */
    tipText: '',
    touchCloseText: 'Tap to close.',
    /**
     * Allows the tooltip to remain open if triggered with a click or touch event.
     * @option
     * @example true
     */
    clickOpen: true,
    /**
     * Additional positioning classes, set by the JS
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Distance, in pixels, the template should push away from the anchor on the Y axis.
     * @option
     * @example 10
     */
    vOffset: 10,
    /**
     * Distance, in pixels, the template should push away from the anchor on the X axis, if aligned to a side.
     * @option
     * @example 12
     */
    hOffset: 12,
    /**
    * Allow HTML in tooltip. Warning: If you are loading user-generated content into tooltips,
    * allowing HTML may open yourself up to XSS attacks.
    * @option
    * @example false
    */
    allowHtml: false
  };

  /**
   * TODO utilize resize event trigger
   */

  // Window exports
  Foundation.plugin(Tooltip, 'Tooltip');
}(jQuery);
;'use strict';

// Polyfill for requestAnimationFrame

(function () {
  if (!Date.now) Date.now = function () {
    return new Date().getTime();
  };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
    var vp = vendors[i];
    window.requestAnimationFrame = window[vp + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vp + 'CancelAnimationFrame'] || window[vp + 'CancelRequestAnimationFrame'];
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent) || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function (callback) {
      var now = Date.now();
      var nextTime = Math.max(lastTime + 16, now);
      return setTimeout(function () {
        callback(lastTime = nextTime);
      }, nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
})();

var initClasses = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

// Find the right "transitionend" event for this browser
var endEvent = function () {
  var transitions = {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'transitionend',
    'OTransition': 'otransitionend'
  };
  var elem = window.document.createElement('div');

  for (var t in transitions) {
    if (typeof elem.style[t] !== 'undefined') {
      return transitions[t];
    }
  }

  return null;
}();

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  if (endEvent === null) {
    isIn ? element.show() : element.hide();
    cb();
    return;
  }

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation);
  element.css('transition', 'none');
  requestAnimationFrame(function () {
    element.addClass(initClass);
    if (isIn) element.show();
  });

  // Start the animation
  requestAnimationFrame(function () {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });

  // Clean up the animation when it finishes
  element.one('transitionend', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var MotionUI = {
  animateIn: function (element, animation, cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function (element, animation, cb) {
    animate(false, element, animation, cb);
  }
};
;jQuery(document).foundation();
;// Joyride demo
$('#start-jr').on('click', function () {
  $(document).foundation('joyride', 'start');
});
;
;$(document).ready(function () {
    var videos = $('iframe[src*="vimeo.com"], iframe[src*="youtube.com"]');

    videos.each(function () {
        var el = $(this);
        el.wrap('<div class="responsive-embed widescreen"/>');
    });
});
;var onScroll = function (container, theclass, amount) {
	var wrap = $(container);
	$(window).scroll(function () {
		if ($(document).scrollTop() > amount) {
			wrap.addClass(theclass);
		} else {
			wrap.removeClass(theclass);
		}
	});
};

onScroll('.main-nav-container', 'set-nav-position', 1);

$('.call').click(function () {
	$('.burger').toggleClass('thex');
	$('body').toggleClass('stop-scrolling');
});

$('.lang').click(function () {
	if ($('.open')) {
		$('.main-nav-container').addClass('anti-transparent-background-2000');
	} else {
		$('.main-nav-container').removeClass('anti-transparent-background-2000');
	}
});

$('.is-accordion-submenu-parent').click(function () {
	// $('body').toggleClass('stop-scrolling');
});

$('.is-dropdown-submenu-parent').mouseover(function () {
	$('.first-sub').addClass('menu-animation');
});

$(".chosen-select").chosen({ disable_search_threshold: 10 });

//
// var elem = $('.dropdown');
//
// Foundation.Motion.animateIn(elem, animationClass [, callback]);
// Foundation.Motion.animateOut(elem, animationClass [, callback]);
;
$(window).bind(' load resize orientationChange ', function () {
  var footer = $("#footer-container");
  var pos = footer.position();
  var height = $(window).height();
  height = height - pos.top;
  height = height - footer.height() - 1;

  function stickyFooter() {
    footer.css({
      'margin-top': height + 'px'
    });
  }

  if (height > 0) {
    stickyFooter();
  }
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5ib3guanMiLCJmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsImZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJmb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsImZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwiZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwiZm91bmRhdGlvbi5hYmlkZS5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uLmpzIiwiZm91bmRhdGlvbi5hY2NvcmRpb25NZW51LmpzIiwiZm91bmRhdGlvbi5kcmlsbGRvd24uanMiLCJmb3VuZGF0aW9uLmRyb3Bkb3duLmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bk1lbnUuanMiLCJmb3VuZGF0aW9uLmVxdWFsaXplci5qcyIsImZvdW5kYXRpb24uaW50ZXJjaGFuZ2UuanMiLCJmb3VuZGF0aW9uLm1hZ2VsbGFuLmpzIiwiZm91bmRhdGlvbi5vZmZjYW52YXMuanMiLCJmb3VuZGF0aW9uLm9yYml0LmpzIiwiZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudS5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZVRvZ2dsZS5qcyIsImZvdW5kYXRpb24ucmV2ZWFsLmpzIiwiZm91bmRhdGlvbi5zbGlkZXIuanMiLCJmb3VuZGF0aW9uLnN0aWNreS5qcyIsImZvdW5kYXRpb24udGFicy5qcyIsImZvdW5kYXRpb24udG9nZ2xlci5qcyIsImZvdW5kYXRpb24udG9vbHRpcC5qcyIsIm1vdGlvbi11aS5qcyIsImluaXQtZm91bmRhdGlvbi5qcyIsImpveXJpZGUtZGVtby5qcyIsIm9mZkNhbnZhcy5qcyIsInJlc3BvbnNpdmUtdmlkZW8uanMiLCJzY3JpcHRzLmpzIiwic3RpY2t5Zm9vdGVyLmpzIl0sIm5hbWVzIjpbIiQiLCJGT1VOREFUSU9OX1ZFUlNJT04iLCJGb3VuZGF0aW9uIiwidmVyc2lvbiIsIl9wbHVnaW5zIiwiX3V1aWRzIiwicnRsIiwiYXR0ciIsInBsdWdpbiIsIm5hbWUiLCJjbGFzc05hbWUiLCJmdW5jdGlvbk5hbWUiLCJhdHRyTmFtZSIsImh5cGhlbmF0ZSIsInJlZ2lzdGVyUGx1Z2luIiwicGx1Z2luTmFtZSIsImNvbnN0cnVjdG9yIiwidG9Mb3dlckNhc2UiLCJ1dWlkIiwiR2V0WW9EaWdpdHMiLCIkZWxlbWVudCIsImRhdGEiLCJ0cmlnZ2VyIiwicHVzaCIsInVucmVnaXN0ZXJQbHVnaW4iLCJzcGxpY2UiLCJpbmRleE9mIiwicmVtb3ZlQXR0ciIsInJlbW92ZURhdGEiLCJwcm9wIiwicmVJbml0IiwicGx1Z2lucyIsImlzSlEiLCJlYWNoIiwiX2luaXQiLCJ0eXBlIiwiX3RoaXMiLCJmbnMiLCJwbGdzIiwiZm9yRWFjaCIsInAiLCJmb3VuZGF0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImxlbmd0aCIsIm5hbWVzcGFjZSIsIk1hdGgiLCJyb3VuZCIsInBvdyIsInJhbmRvbSIsInRvU3RyaW5nIiwic2xpY2UiLCJyZWZsb3ciLCJlbGVtIiwiaSIsIiRlbGVtIiwiZmluZCIsImFkZEJhY2siLCIkZWwiLCJvcHRzIiwid2FybiIsInRoaW5nIiwic3BsaXQiLCJlIiwib3B0IiwibWFwIiwiZWwiLCJ0cmltIiwicGFyc2VWYWx1ZSIsImVyIiwiZ2V0Rm5OYW1lIiwidHJhbnNpdGlvbmVuZCIsInRyYW5zaXRpb25zIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiZW5kIiwidCIsInN0eWxlIiwic2V0VGltZW91dCIsInRyaWdnZXJIYW5kbGVyIiwidXRpbCIsInRocm90dGxlIiwiZnVuYyIsImRlbGF5IiwidGltZXIiLCJjb250ZXh0IiwiYXJncyIsImFyZ3VtZW50cyIsImFwcGx5IiwibWV0aG9kIiwiJG1ldGEiLCIkbm9KUyIsImFwcGVuZFRvIiwiaGVhZCIsInJlbW92ZUNsYXNzIiwiTWVkaWFRdWVyeSIsIkFycmF5IiwicHJvdG90eXBlIiwiY2FsbCIsInBsdWdDbGFzcyIsInVuZGVmaW5lZCIsIlJlZmVyZW5jZUVycm9yIiwiVHlwZUVycm9yIiwid2luZG93IiwiZm4iLCJEYXRlIiwibm93IiwiZ2V0VGltZSIsInZlbmRvcnMiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ2cCIsImNhbmNlbEFuaW1hdGlvbkZyYW1lIiwidGVzdCIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImxhc3RUaW1lIiwiY2FsbGJhY2siLCJuZXh0VGltZSIsIm1heCIsImNsZWFyVGltZW91dCIsInBlcmZvcm1hbmNlIiwic3RhcnQiLCJGdW5jdGlvbiIsImJpbmQiLCJvVGhpcyIsImFBcmdzIiwiZlRvQmluZCIsImZOT1AiLCJmQm91bmQiLCJjb25jYXQiLCJmdW5jTmFtZVJlZ2V4IiwicmVzdWx0cyIsImV4ZWMiLCJzdHIiLCJpc05hTiIsInBhcnNlRmxvYXQiLCJyZXBsYWNlIiwialF1ZXJ5IiwiQm94IiwiSW1Ob3RUb3VjaGluZ1lvdSIsIkdldERpbWVuc2lvbnMiLCJHZXRPZmZzZXRzIiwiZWxlbWVudCIsInBhcmVudCIsImxyT25seSIsInRiT25seSIsImVsZURpbXMiLCJ0b3AiLCJib3R0b20iLCJsZWZ0IiwicmlnaHQiLCJwYXJEaW1zIiwib2Zmc2V0IiwiaGVpZ2h0Iiwid2lkdGgiLCJ3aW5kb3dEaW1zIiwiYWxsRGlycyIsIkVycm9yIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInBhclJlY3QiLCJwYXJlbnROb2RlIiwid2luUmVjdCIsImJvZHkiLCJ3aW5ZIiwicGFnZVlPZmZzZXQiLCJ3aW5YIiwicGFnZVhPZmZzZXQiLCJwYXJlbnREaW1zIiwiYW5jaG9yIiwicG9zaXRpb24iLCJ2T2Zmc2V0IiwiaE9mZnNldCIsImlzT3ZlcmZsb3ciLCIkZWxlRGltcyIsIiRhbmNob3JEaW1zIiwia2V5Q29kZXMiLCJjb21tYW5kcyIsIktleWJvYXJkIiwiZ2V0S2V5Q29kZXMiLCJwYXJzZUtleSIsImV2ZW50Iiwia2V5Iiwid2hpY2giLCJrZXlDb2RlIiwiU3RyaW5nIiwiZnJvbUNoYXJDb2RlIiwidG9VcHBlckNhc2UiLCJzaGlmdEtleSIsImN0cmxLZXkiLCJhbHRLZXkiLCJoYW5kbGVLZXkiLCJjb21wb25lbnQiLCJmdW5jdGlvbnMiLCJjb21tYW5kTGlzdCIsImNtZHMiLCJjb21tYW5kIiwibHRyIiwiZXh0ZW5kIiwicmV0dXJuVmFsdWUiLCJoYW5kbGVkIiwidW5oYW5kbGVkIiwiZmluZEZvY3VzYWJsZSIsImZpbHRlciIsImlzIiwicmVnaXN0ZXIiLCJjb21wb25lbnROYW1lIiwidHJhcEZvY3VzIiwiJGZvY3VzYWJsZSIsIiRmaXJzdEZvY3VzYWJsZSIsImVxIiwiJGxhc3RGb2N1c2FibGUiLCJvbiIsInRhcmdldCIsInByZXZlbnREZWZhdWx0IiwiZm9jdXMiLCJyZWxlYXNlRm9jdXMiLCJvZmYiLCJrY3MiLCJrIiwia2MiLCJkZWZhdWx0UXVlcmllcyIsImxhbmRzY2FwZSIsInBvcnRyYWl0IiwicmV0aW5hIiwicXVlcmllcyIsImN1cnJlbnQiLCJzZWxmIiwiZXh0cmFjdGVkU3R5bGVzIiwiY3NzIiwibmFtZWRRdWVyaWVzIiwicGFyc2VTdHlsZVRvT2JqZWN0IiwiaGFzT3duUHJvcGVydHkiLCJ2YWx1ZSIsIl9nZXRDdXJyZW50U2l6ZSIsIl93YXRjaGVyIiwiYXRMZWFzdCIsInNpemUiLCJxdWVyeSIsImdldCIsIm1hdGNoTWVkaWEiLCJtYXRjaGVzIiwibWF0Y2hlZCIsIm5ld1NpemUiLCJjdXJyZW50U2l6ZSIsInN0eWxlTWVkaWEiLCJtZWRpYSIsInNjcmlwdCIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwiaW5mbyIsImlkIiwiaW5zZXJ0QmVmb3JlIiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImN1cnJlbnRTdHlsZSIsIm1hdGNoTWVkaXVtIiwidGV4dCIsInN0eWxlU2hlZXQiLCJjc3NUZXh0IiwidGV4dENvbnRlbnQiLCJzdHlsZU9iamVjdCIsInJlZHVjZSIsInJldCIsInBhcmFtIiwicGFydHMiLCJ2YWwiLCJkZWNvZGVVUklDb21wb25lbnQiLCJpc0FycmF5IiwiaW5pdENsYXNzZXMiLCJhY3RpdmVDbGFzc2VzIiwiTW90aW9uIiwiYW5pbWF0ZUluIiwiYW5pbWF0aW9uIiwiY2IiLCJhbmltYXRlIiwiYW5pbWF0ZU91dCIsIk1vdmUiLCJkdXJhdGlvbiIsImFuaW0iLCJwcm9nIiwibW92ZSIsInRzIiwiaXNJbiIsImluaXRDbGFzcyIsImFjdGl2ZUNsYXNzIiwicmVzZXQiLCJhZGRDbGFzcyIsInNob3ciLCJvZmZzZXRXaWR0aCIsIm9uZSIsImZpbmlzaCIsImhpZGUiLCJ0cmFuc2l0aW9uRHVyYXRpb24iLCJOZXN0IiwiRmVhdGhlciIsIm1lbnUiLCJpdGVtcyIsInN1Yk1lbnVDbGFzcyIsInN1Ykl0ZW1DbGFzcyIsImhhc1N1YkNsYXNzIiwiJGl0ZW0iLCIkc3ViIiwiY2hpbGRyZW4iLCJCdXJuIiwiVGltZXIiLCJvcHRpb25zIiwibmFtZVNwYWNlIiwicmVtYWluIiwiaXNQYXVzZWQiLCJyZXN0YXJ0IiwiaW5maW5pdGUiLCJwYXVzZSIsIm9uSW1hZ2VzTG9hZGVkIiwiaW1hZ2VzIiwidW5sb2FkZWQiLCJjb21wbGV0ZSIsInJlYWR5U3RhdGUiLCJzaW5nbGVJbWFnZUxvYWRlZCIsInNyYyIsInNwb3RTd2lwZSIsImVuYWJsZWQiLCJkb2N1bWVudEVsZW1lbnQiLCJtb3ZlVGhyZXNob2xkIiwidGltZVRocmVzaG9sZCIsInN0YXJ0UG9zWCIsInN0YXJ0UG9zWSIsInN0YXJ0VGltZSIsImVsYXBzZWRUaW1lIiwiaXNNb3ZpbmciLCJvblRvdWNoRW5kIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIm9uVG91Y2hNb3ZlIiwieCIsInRvdWNoZXMiLCJwYWdlWCIsInkiLCJwYWdlWSIsImR4IiwiZHkiLCJkaXIiLCJhYnMiLCJvblRvdWNoU3RhcnQiLCJhZGRFdmVudExpc3RlbmVyIiwiaW5pdCIsInRlYXJkb3duIiwic3BlY2lhbCIsInN3aXBlIiwic2V0dXAiLCJub29wIiwiYWRkVG91Y2giLCJoYW5kbGVUb3VjaCIsImNoYW5nZWRUb3VjaGVzIiwiZmlyc3QiLCJldmVudFR5cGVzIiwidG91Y2hzdGFydCIsInRvdWNobW92ZSIsInRvdWNoZW5kIiwic2ltdWxhdGVkRXZlbnQiLCJNb3VzZUV2ZW50Iiwic2NyZWVuWCIsInNjcmVlblkiLCJjbGllbnRYIiwiY2xpZW50WSIsImNyZWF0ZUV2ZW50IiwiaW5pdE1vdXNlRXZlbnQiLCJkaXNwYXRjaEV2ZW50IiwiTXV0YXRpb25PYnNlcnZlciIsInByZWZpeGVzIiwidHJpZ2dlcnMiLCJzdG9wUHJvcGFnYXRpb24iLCJmYWRlT3V0IiwiY2hlY2tMaXN0ZW5lcnMiLCJldmVudHNMaXN0ZW5lciIsInJlc2l6ZUxpc3RlbmVyIiwic2Nyb2xsTGlzdGVuZXIiLCJtdXRhdGVMaXN0ZW5lciIsImNsb3NlbWVMaXN0ZW5lciIsInlldGlCb3hlcyIsInBsdWdOYW1lcyIsImxpc3RlbmVycyIsImpvaW4iLCJwbHVnaW5JZCIsIm5vdCIsImRlYm91bmNlIiwiJG5vZGVzIiwibm9kZXMiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiIsIm11dGF0aW9uUmVjb3Jkc0xpc3QiLCIkdGFyZ2V0IiwiYXR0cmlidXRlTmFtZSIsImNsb3Nlc3QiLCJlbGVtZW50T2JzZXJ2ZXIiLCJvYnNlcnZlIiwiYXR0cmlidXRlcyIsImNoaWxkTGlzdCIsImNoYXJhY3RlckRhdGEiLCJzdWJ0cmVlIiwiYXR0cmlidXRlRmlsdGVyIiwiSUhlYXJZb3UiLCJBYmlkZSIsImRlZmF1bHRzIiwiJGlucHV0cyIsIl9ldmVudHMiLCJyZXNldEZvcm0iLCJ2YWxpZGF0ZUZvcm0iLCJ2YWxpZGF0ZU9uIiwidmFsaWRhdGVJbnB1dCIsImxpdmVWYWxpZGF0ZSIsInZhbGlkYXRlT25CbHVyIiwiX3JlZmxvdyIsInJlcXVpcmVkQ2hlY2siLCJpc0dvb2QiLCJjaGVja2VkIiwiZmluZEZvcm1FcnJvciIsIiRlcnJvciIsInNpYmxpbmdzIiwiZm9ybUVycm9yU2VsZWN0b3IiLCJmaW5kTGFiZWwiLCIkbGFiZWwiLCJmaW5kUmFkaW9MYWJlbHMiLCIkZWxzIiwibGFiZWxzIiwiYWRkRXJyb3JDbGFzc2VzIiwiJGZvcm1FcnJvciIsImxhYmVsRXJyb3JDbGFzcyIsImZvcm1FcnJvckNsYXNzIiwiaW5wdXRFcnJvckNsYXNzIiwicmVtb3ZlUmFkaW9FcnJvckNsYXNzZXMiLCJncm91cE5hbWUiLCIkbGFiZWxzIiwiJGZvcm1FcnJvcnMiLCJyZW1vdmVFcnJvckNsYXNzZXMiLCJjbGVhclJlcXVpcmUiLCJ2YWxpZGF0ZWQiLCJjdXN0b21WYWxpZGF0b3IiLCJ2YWxpZGF0b3IiLCJlcXVhbFRvIiwidmFsaWRhdGVSYWRpbyIsInZhbGlkYXRlVGV4dCIsIm1hdGNoVmFsaWRhdGlvbiIsInZhbGlkYXRvcnMiLCJnb29kVG9HbyIsIm1lc3NhZ2UiLCJkZXBlbmRlbnRFbGVtZW50cyIsImFjYyIsIm5vRXJyb3IiLCJwYXR0ZXJuIiwiaW5wdXRUZXh0IiwidmFsaWQiLCJwYXR0ZXJucyIsIlJlZ0V4cCIsIiRncm91cCIsInJlcXVpcmVkIiwiY2xlYXIiLCJ2IiwiJGZvcm0iLCJkZXN0cm95IiwiYWxwaGEiLCJhbHBoYV9udW1lcmljIiwiaW50ZWdlciIsIm51bWJlciIsImNhcmQiLCJjdnYiLCJlbWFpbCIsInVybCIsImRvbWFpbiIsImRhdGV0aW1lIiwiZGF0ZSIsInRpbWUiLCJkYXRlSVNPIiwibW9udGhfZGF5X3llYXIiLCJkYXlfbW9udGhfeWVhciIsImNvbG9yIiwiQWNjb3JkaW9uIiwiJHRhYnMiLCJpZHgiLCIkY29udGVudCIsImxpbmtJZCIsIiRpbml0QWN0aXZlIiwiZG93biIsIiR0YWJDb250ZW50IiwidG9nZ2xlIiwibmV4dCIsIiRhIiwibXVsdGlFeHBhbmQiLCJwcmV2aW91cyIsInByZXYiLCJoYXNDbGFzcyIsInVwIiwiZmlyc3RUaW1lIiwiJGN1cnJlbnRBY3RpdmUiLCJzbGlkZURvd24iLCJzbGlkZVNwZWVkIiwiJGF1bnRzIiwiYWxsb3dBbGxDbG9zZWQiLCJzbGlkZVVwIiwic3RvcCIsIkFjY29yZGlvbk1lbnUiLCJtdWx0aU9wZW4iLCIkbWVudUxpbmtzIiwic3ViSWQiLCJpc0FjdGl2ZSIsImluaXRQYW5lcyIsIiRzdWJtZW51IiwiJGVsZW1lbnRzIiwiJHByZXZFbGVtZW50IiwiJG5leHRFbGVtZW50IiwibWluIiwicGFyZW50cyIsIm9wZW4iLCJjbG9zZSIsImNsb3NlQWxsIiwiaGlkZUFsbCIsInN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiIsInNob3dBbGwiLCJwYXJlbnRzVW50aWwiLCJhZGQiLCIkbWVudXMiLCJEcmlsbGRvd24iLCIkc3VibWVudUFuY2hvcnMiLCIkc3VibWVudXMiLCIkbWVudUl0ZW1zIiwiX3ByZXBhcmVNZW51IiwiX3JlZ2lzdGVyRXZlbnRzIiwiX2tleWJvYXJkRXZlbnRzIiwiJGxpbmsiLCJwYXJlbnRMaW5rIiwiY2xvbmUiLCJwcmVwZW5kVG8iLCJ3cmFwIiwiJG1lbnUiLCIkYmFjayIsImJhY2tCdXR0b25Qb3NpdGlvbiIsImFwcGVuZCIsImJhY2tCdXR0b24iLCJwcmVwZW5kIiwiX2JhY2siLCJhdXRvSGVpZ2h0IiwiJHdyYXBwZXIiLCJ3cmFwcGVyIiwiYW5pbWF0ZUhlaWdodCIsIl9nZXRNYXhEaW1zIiwiX3Jlc2l6ZSIsIl9zaG93IiwiY2xvc2VPbkNsaWNrIiwiJGJvZHkiLCJjb250YWlucyIsIl9oaWRlQWxsIiwic2Nyb2xsVG9wIiwiX2JpbmRIYW5kbGVyIiwiX3Njcm9sbFRvcCIsIiRzY3JvbGxUb3BFbGVtZW50Iiwic2Nyb2xsVG9wRWxlbWVudCIsInNjcm9sbFBvcyIsInBhcnNlSW50Iiwic2Nyb2xsVG9wT2Zmc2V0IiwiYW5pbWF0aW9uRHVyYXRpb24iLCJhbmltYXRpb25FYXNpbmciLCJfaGlkZSIsInBhcmVudFN1Yk1lbnUiLCJfbWVudUxpbmtFdmVudHMiLCJibHVyIiwibWF4SGVpZ2h0IiwicmVzdWx0IiwibnVtT2ZFbGVtcyIsInVud3JhcCIsInJlbW92ZSIsIkRyb3Bkb3duIiwiJGlkIiwiJGFuY2hvciIsInBhcmVudENsYXNzIiwiJHBhcmVudCIsInBvc2l0aW9uQ2xhc3MiLCJnZXRQb3NpdGlvbkNsYXNzIiwiY291bnRlciIsInVzZWRQb3NpdGlvbnMiLCJ2ZXJ0aWNhbFBvc2l0aW9uIiwibWF0Y2giLCJob3Jpem9udGFsUG9zaXRpb24iLCJfcmVwb3NpdGlvbiIsImNsYXNzQ2hhbmdlZCIsIl9zZXRQb3NpdGlvbiIsImRpcmVjdGlvbiIsIm5ld1dpZHRoIiwicGFyZW50SE9mZnNldCIsIiRwYXJlbnREaW1zIiwiaG92ZXIiLCJib2R5RGF0YSIsIndoYXRpbnB1dCIsInRpbWVvdXQiLCJob3ZlckRlbGF5IiwiaG92ZXJQYW5lIiwidmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzIiwiX2FkZEJvZHlIYW5kbGVyIiwiYXV0b0ZvY3VzIiwiY3VyUG9zaXRpb25DbGFzcyIsIkRyb3Bkb3duTWVudSIsInN1YnMiLCJ2ZXJ0aWNhbENsYXNzIiwicmlnaHRDbGFzcyIsImFsaWdubWVudCIsImNoYW5nZWQiLCJfaXNWZXJ0aWNhbCIsImhhc1RvdWNoIiwib250b3VjaHN0YXJ0IiwicGFyQ2xhc3MiLCJoYW5kbGVDbGlja0ZuIiwiaGFzU3ViIiwiaGFzQ2xpY2tlZCIsImNsaWNrT3BlbiIsImZvcmNlRm9sbG93IiwiY2xvc2VPbkNsaWNrSW5zaWRlIiwiZGlzYWJsZUhvdmVyIiwiYXV0b2Nsb3NlIiwiY2xvc2luZ1RpbWUiLCJpc1RhYiIsImluZGV4IiwibmV4dFNpYmxpbmciLCJwcmV2U2libGluZyIsIm9wZW5TdWIiLCJjbG9zZVN1YiIsIiRzaWJzIiwib2xkQ2xhc3MiLCIkcGFyZW50TGkiLCIkdG9DbG9zZSIsInNvbWV0aGluZ1RvQ2xvc2UiLCJFcXVhbGl6ZXIiLCJlcUlkIiwiJHdhdGNoZWQiLCJoYXNOZXN0ZWQiLCJpc05lc3RlZCIsImlzT24iLCJvblJlc2l6ZU1lQm91bmQiLCJfb25SZXNpemVNZSIsIm9uUG9zdEVxdWFsaXplZEJvdW5kIiwiX29uUG9zdEVxdWFsaXplZCIsImltZ3MiLCJ0b29TbWFsbCIsImVxdWFsaXplT24iLCJfY2hlY2tNUSIsIl9wYXVzZUV2ZW50cyIsIl9raWxsc3dpdGNoIiwiZXF1YWxpemVPblN0YWNrIiwiX2lzU3RhY2tlZCIsImVxdWFsaXplQnlSb3ciLCJnZXRIZWlnaHRzQnlSb3ciLCJhcHBseUhlaWdodEJ5Um93IiwiZ2V0SGVpZ2h0cyIsImFwcGx5SGVpZ2h0IiwiaGVpZ2h0cyIsImxlbiIsIm9mZnNldEhlaWdodCIsImxhc3RFbFRvcE9mZnNldCIsImdyb3VwcyIsImdyb3VwIiwiZWxPZmZzZXRUb3AiLCJqIiwibG4iLCJncm91cHNJTGVuZ3RoIiwibGVuSiIsIkludGVyY2hhbmdlIiwicnVsZXMiLCJjdXJyZW50UGF0aCIsIl9hZGRCcmVha3BvaW50cyIsIl9nZW5lcmF0ZVJ1bGVzIiwicnVsZSIsInBhdGgiLCJTUEVDSUFMX1FVRVJJRVMiLCJydWxlc0xpc3QiLCJub2RlTmFtZSIsInJlc3BvbnNlIiwiaHRtbCIsIk1hZ2VsbGFuIiwiY2FsY1BvaW50cyIsIiR0YXJnZXRzIiwiJGxpbmtzIiwiJGFjdGl2ZSIsInBvaW50cyIsIndpbkhlaWdodCIsImlubmVySGVpZ2h0IiwiY2xpZW50SGVpZ2h0IiwiZG9jSGVpZ2h0Iiwic2Nyb2xsSGVpZ2h0IiwiJHRhciIsInB0IiwidGhyZXNob2xkIiwidGFyZ2V0UG9pbnQiLCJlYXNpbmciLCJkZWVwTGlua2luZyIsImxvY2F0aW9uIiwiaGFzaCIsInNjcm9sbFRvTG9jIiwiX3VwZGF0ZUFjdGl2ZSIsImFycml2YWwiLCJnZXRBdHRyaWJ1dGUiLCJsb2MiLCJfaW5UcmFuc2l0aW9uIiwiYmFyT2Zmc2V0Iiwid2luUG9zIiwiY3VySWR4IiwiaXNEb3duIiwiY3VyVmlzaWJsZSIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJPZmZDYW52YXMiLCIkbGFzdFRyaWdnZXIiLCIkdHJpZ2dlcnMiLCJ0cmFuc2l0aW9uIiwiY29udGVudE92ZXJsYXkiLCJvdmVybGF5Iiwib3ZlcmxheVBvc2l0aW9uIiwic2V0QXR0cmlidXRlIiwiJG92ZXJsYXkiLCJpc1JldmVhbGVkIiwicmV2ZWFsQ2xhc3MiLCJyZXZlYWxPbiIsIl9zZXRNUUNoZWNrZXIiLCJ0cmFuc2l0aW9uVGltZSIsIl9oYW5kbGVLZXlib2FyZCIsInJldmVhbCIsIiRjbG9zZXIiLCJfc3RvcFNjcm9sbGluZyIsImZvcmNlVG8iLCJzY3JvbGxUbyIsImNvbnRlbnRTY3JvbGwiLCJPcmJpdCIsIl9yZXNldCIsImNvbnRhaW5lckNsYXNzIiwiJHNsaWRlcyIsInNsaWRlQ2xhc3MiLCIkaW1hZ2VzIiwiaW5pdEFjdGl2ZSIsInVzZU1VSSIsIl9wcmVwYXJlRm9yT3JiaXQiLCJidWxsZXRzIiwiX2xvYWRCdWxsZXRzIiwiYXV0b1BsYXkiLCJnZW9TeW5jIiwiYWNjZXNzaWJsZSIsIiRidWxsZXRzIiwiYm94T2ZCdWxsZXRzIiwidGltZXJEZWxheSIsImNoYW5nZVNsaWRlIiwiX3NldFdyYXBwZXJIZWlnaHQiLCJ0ZW1wIiwiX3NldFNsaWRlSGVpZ2h0IiwicGF1c2VPbkhvdmVyIiwibmF2QnV0dG9ucyIsIiRjb250cm9scyIsIm5leHRDbGFzcyIsInByZXZDbGFzcyIsIiRzbGlkZSIsIl91cGRhdGVCdWxsZXRzIiwiaXNMVFIiLCJjaG9zZW5TbGlkZSIsIiRjdXJTbGlkZSIsIiRmaXJzdFNsaWRlIiwiJGxhc3RTbGlkZSIsImxhc3QiLCJkaXJJbiIsImRpck91dCIsIiRuZXdTbGlkZSIsImluZmluaXRlV3JhcCIsIiRvbGRCdWxsZXQiLCJzcGFuIiwiZGV0YWNoIiwiJG5ld0J1bGxldCIsImFuaW1JbkZyb21SaWdodCIsImFuaW1PdXRUb1JpZ2h0IiwiYW5pbUluRnJvbUxlZnQiLCJhbmltT3V0VG9MZWZ0IiwiUmVzcG9uc2l2ZU1lbnUiLCJjdXJyZW50TXEiLCJjdXJyZW50UGx1Z2luIiwicnVsZXNUcmVlIiwicnVsZVNpemUiLCJydWxlUGx1Z2luIiwiTWVudVBsdWdpbnMiLCJpc0VtcHR5T2JqZWN0IiwiX2NoZWNrTWVkaWFRdWVyaWVzIiwibWF0Y2hlZE1xIiwiY3NzQ2xhc3MiLCJkcm9wZG93biIsImRyaWxsZG93biIsImFjY29yZGlvbiIsIlJlc3BvbnNpdmVUb2dnbGUiLCJ0YXJnZXRJRCIsIiR0YXJnZXRNZW51IiwiJHRvZ2dsZXIiLCJpbnB1dCIsImFuaW1hdGlvbkluIiwiYW5pbWF0aW9uT3V0IiwiX3VwZGF0ZSIsIl91cGRhdGVNcUhhbmRsZXIiLCJ0b2dnbGVNZW51IiwiaGlkZUZvciIsIlJldmVhbCIsImNhY2hlZCIsIm1xIiwiaXNNb2JpbGUiLCJtb2JpbGVTbmlmZiIsImZ1bGxTY3JlZW4iLCJfbWFrZU92ZXJsYXkiLCJkZWVwTGluayIsIl91cGRhdGVQb3NpdGlvbiIsIm91dGVyV2lkdGgiLCJvdXRlckhlaWdodCIsIm1hcmdpbiIsIl9oYW5kbGVTdGF0ZSIsIm11bHRpcGxlT3BlbmVkIiwiYWRkUmV2ZWFsT3BlbkNsYXNzZXMiLCJvcmlnaW5hbFNjcm9sbFBvcyIsImFmdGVyQW5pbWF0aW9uIiwiZm9jdXNhYmxlRWxlbWVudHMiLCJzaG93RGVsYXkiLCJfZXh0cmFIYW5kbGVycyIsImNsb3NlT25Fc2MiLCJmaW5pc2hVcCIsImhpZGVEZWxheSIsInJlc2V0T25DbG9zZSIsInJlcGxhY2VTdGF0ZSIsInRpdGxlIiwiaHJlZiIsImJ0bU9mZnNldFBjdCIsImlQaG9uZVNuaWZmIiwiYW5kcm9pZFNuaWZmIiwiU2xpZGVyIiwiaW5wdXRzIiwiaGFuZGxlcyIsIiRoYW5kbGUiLCIkaW5wdXQiLCIkZmlsbCIsInZlcnRpY2FsIiwiaXNEYmwiLCJkaXNhYmxlZCIsImRpc2FibGVkQ2xhc3MiLCJiaW5kaW5nIiwiX3NldEluaXRBdHRyIiwiZG91YmxlU2lkZWQiLCIkaGFuZGxlMiIsIiRpbnB1dDIiLCJzZXRIYW5kbGVzIiwiX3NldEhhbmRsZVBvcyIsIl9wY3RPZkJhciIsInBjdE9mQmFyIiwicGVyY2VudCIsInBvc2l0aW9uVmFsdWVGdW5jdGlvbiIsIl9sb2dUcmFuc2Zvcm0iLCJfcG93VHJhbnNmb3JtIiwidG9GaXhlZCIsIl92YWx1ZSIsImJhc2VMb2ciLCJub25MaW5lYXJCYXNlIiwiJGhuZGwiLCJub0ludmVydCIsImgyVmFsIiwic3RlcCIsImgxVmFsIiwidmVydCIsImhPclciLCJsT3JUIiwiaGFuZGxlRGltIiwiZWxlbURpbSIsInB4VG9Nb3ZlIiwibW92ZW1lbnQiLCJkZWNpbWFsIiwiX3NldFZhbHVlcyIsImlzTGVmdEhuZGwiLCJkaW0iLCJoYW5kbGVQY3QiLCJoYW5kbGVQb3MiLCJpbml0aWFsU3RhcnQiLCJtb3ZlVGltZSIsImNoYW5nZWREZWxheSIsImluaXRWYWwiLCJpbml0aWFsRW5kIiwiX2hhbmRsZUV2ZW50IiwiaGFzVmFsIiwiZXZlbnRPZmZzZXQiLCJoYWxmT2ZIYW5kbGUiLCJiYXJEaW0iLCJ3aW5kb3dTY3JvbGwiLCJzY3JvbGxMZWZ0IiwiZWxlbU9mZnNldCIsImV2ZW50RnJvbUJhciIsImJhclhZIiwib2Zmc2V0UGN0IiwiX2FkanVzdFZhbHVlIiwiZmlyc3RIbmRsUG9zIiwiYWJzUG9zaXRpb24iLCJzZWNuZEhuZGxQb3MiLCJkaXYiLCJwcmV2X3ZhbCIsIm5leHRfdmFsIiwiX2V2ZW50c0ZvckhhbmRsZSIsImN1ckhhbmRsZSIsImNsaWNrU2VsZWN0IiwiZHJhZ2dhYmxlIiwiY3VycmVudFRhcmdldCIsIl8kaGFuZGxlIiwib2xkVmFsdWUiLCJuZXdWYWx1ZSIsImRlY3JlYXNlIiwiaW5jcmVhc2UiLCJkZWNyZWFzZV9mYXN0IiwiaW5jcmVhc2VfZmFzdCIsImludmVydFZlcnRpY2FsIiwiZnJhYyIsIm51bSIsImNsaWNrUG9zIiwiYmFzZSIsImxvZyIsIlN0aWNreSIsIndhc1dyYXBwZWQiLCIkY29udGFpbmVyIiwiY29udGFpbmVyIiwid3JhcElubmVyIiwic3RpY2t5Q2xhc3MiLCJzY3JvbGxDb3VudCIsImNoZWNrRXZlcnkiLCJpc1N0dWNrIiwiY29udGFpbmVySGVpZ2h0IiwiZWxlbUhlaWdodCIsIl9wYXJzZVBvaW50cyIsIl9zZXRTaXplcyIsInNjcm9sbCIsIl9jYWxjIiwiX3JlbW92ZVN0aWNreSIsInRvcFBvaW50IiwicmV2ZXJzZSIsInRvcEFuY2hvciIsImJ0bSIsImJ0bUFuY2hvciIsInB0cyIsImJyZWFrcyIsInBsYWNlIiwiY2FuU3RpY2siLCJfcGF1c2VMaXN0ZW5lcnMiLCJjaGVja1NpemVzIiwiYm90dG9tUG9pbnQiLCJfc2V0U3RpY2t5Iiwic3RpY2tUbyIsIm1yZ24iLCJub3RTdHVja1RvIiwiaXNUb3AiLCJzdGlja1RvVG9wIiwiYW5jaG9yUHQiLCJhbmNob3JIZWlnaHQiLCJ0b3BPckJvdHRvbSIsInN0aWNreU9uIiwibmV3RWxlbVdpZHRoIiwiY29tcCIsInBkbmdsIiwicGRuZ3IiLCJuZXdDb250YWluZXJIZWlnaHQiLCJfc2V0QnJlYWtQb2ludHMiLCJtVG9wIiwiZW1DYWxjIiwibWFyZ2luVG9wIiwibUJ0bSIsIm1hcmdpbkJvdHRvbSIsImVtIiwiZm9udFNpemUiLCJUYWJzIiwiJHRhYlRpdGxlcyIsImxpbmtDbGFzcyIsImxpbmtBY3RpdmVDbGFzcyIsImxvYWQiLCJkZWVwTGlua1NtdWRnZURlbGF5Iiwic2VsZWN0VGFiIiwiZGVlcExpbmtTbXVkZ2UiLCJtYXRjaEhlaWdodCIsIl9zZXRIZWlnaHQiLCJfYWRkS2V5SGFuZGxlciIsIl9hZGRDbGlja0hhbmRsZXIiLCJfc2V0SGVpZ2h0TXFIYW5kbGVyIiwiX2hhbmRsZVRhYkNoYW5nZSIsIndyYXBPbktleXMiLCJhY3RpdmVDb2xsYXBzZSIsIl9jb2xsYXBzZVRhYiIsIiRvbGRUYWIiLCIkdGFiTGluayIsIiR0YXJnZXRDb250ZW50IiwiX29wZW5UYWIiLCJ1cGRhdGVIaXN0b3J5IiwicGFuZWxBY3RpdmVDbGFzcyIsIiR0YXJnZXRfYW5jaG9yIiwiaWRTdHIiLCJwYW5lbENsYXNzIiwicGFuZWwiLCJUb2dnbGVyIiwiX3RvZ2dsZUNsYXNzIiwidG9nZ2xlQ2xhc3MiLCJfdXBkYXRlQVJJQSIsIl90b2dnbGVBbmltYXRlIiwiVG9vbHRpcCIsImlzQ2xpY2siLCJlbGVtSWQiLCJfZ2V0UG9zaXRpb25DbGFzcyIsInRpcFRleHQiLCJ0ZW1wbGF0ZSIsIl9idWlsZFRlbXBsYXRlIiwiYWxsb3dIdG1sIiwidHJpZ2dlckNsYXNzIiwidGVtcGxhdGVDbGFzc2VzIiwidG9vbHRpcENsYXNzIiwiJHRlbXBsYXRlIiwiJHRpcERpbXMiLCJzaG93T24iLCJmYWRlSW4iLCJmYWRlSW5EdXJhdGlvbiIsImZhZGVPdXREdXJhdGlvbiIsImlzRm9jdXMiLCJkaXNhYmxlRm9yVG91Y2giLCJ0b3VjaENsb3NlVGV4dCIsImVuZEV2ZW50IiwiTW90aW9uVUkiLCJyZWFkeSIsInZpZGVvcyIsIm9uU2Nyb2xsIiwidGhlY2xhc3MiLCJhbW91bnQiLCJjbGljayIsIm1vdXNlb3ZlciIsImNob3NlbiIsImRpc2FibGVfc2VhcmNoX3RocmVzaG9sZCIsImZvb3RlciIsInBvcyIsInN0aWNreUZvb3RlciJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxVQUFTQSxDQUFULEVBQVk7O0FBRWI7O0FBRUEsTUFBSUMscUJBQXFCLE9BQXpCOztBQUVBO0FBQ0E7QUFDQSxNQUFJQyxhQUFhO0FBQ2ZDLGFBQVNGLGtCQURNOztBQUdmOzs7QUFHQUcsY0FBVSxFQU5LOztBQVFmOzs7QUFHQUMsWUFBUSxFQVhPOztBQWFmOzs7QUFHQUMsU0FBSyxZQUFVO0FBQ2IsYUFBT04sRUFBRSxNQUFGLEVBQVVPLElBQVYsQ0FBZSxLQUFmLE1BQTBCLEtBQWpDO0FBQ0QsS0FsQmM7QUFtQmY7Ozs7QUFJQUMsWUFBUSxVQUFTQSxNQUFULEVBQWlCQyxJQUFqQixFQUF1QjtBQUM3QjtBQUNBO0FBQ0EsVUFBSUMsWUFBYUQsUUFBUUUsYUFBYUgsTUFBYixDQUF6QjtBQUNBO0FBQ0E7QUFDQSxVQUFJSSxXQUFZQyxVQUFVSCxTQUFWLENBQWhCOztBQUVBO0FBQ0EsV0FBS04sUUFBTCxDQUFjUSxRQUFkLElBQTBCLEtBQUtGLFNBQUwsSUFBa0JGLE1BQTVDO0FBQ0QsS0FqQ2M7QUFrQ2Y7Ozs7Ozs7OztBQVNBTSxvQkFBZ0IsVUFBU04sTUFB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QzFCLEtBQUdqZ0MsRUFBRSxPQUFGLENBQUgsRUFBYztBQUNiQSxJQUFFLHFCQUFGLEVBQXlCZ1MsUUFBekIsQ0FBa0Msa0NBQWxDO0FBQ0EsRUFGRCxNQUVNO0FBQ0xoUyxJQUFFLHFCQUFGLEVBQXlCaUcsV0FBekIsQ0FBcUMsa0NBQXJDO0FBQ0E7QUFFRCxDQVBEOztBQVNBakcsRUFBRSw4QkFBRixFQUFrQ2lnQyxLQUFsQyxDQUF3QyxZQUFVO0FBQ2pEO0FBQ0EsQ0FGRDs7QUFJQWpnQyxFQUFFLDZCQUFGLEVBQWlDa2dDLFNBQWpDLENBQTJDLFlBQVU7QUFDcERsZ0MsR0FBRSxZQUFGLEVBQWdCZ1MsUUFBaEIsQ0FBeUIsZ0JBQXpCO0FBQ0EsQ0FGRDs7QUFJQWhTLEVBQUUsZ0JBQUYsRUFBb0JtZ0MsTUFBcEIsQ0FBMkIsRUFBQ0MsMEJBQTBCLEVBQTNCLEVBQTNCOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBcGdDLEVBQUUwRyxNQUFGLEVBQVVvQixJQUFWLENBQWUsaUNBQWYsRUFBa0QsWUFBWTtBQUMzRCxNQUFJdTRCLFNBQVNyZ0MsRUFBRSxtQkFBRixDQUFiO0FBQ0EsTUFBSXNnQyxNQUFNRCxPQUFPeDFCLFFBQVAsRUFBVjtBQUNBLE1BQUlqQixTQUFTNUosRUFBRTBHLE1BQUYsRUFBVWtELE1BQVYsRUFBYjtBQUNBQSxXQUFTQSxTQUFTMDJCLElBQUloM0IsR0FBdEI7QUFDQU0sV0FBU0EsU0FBU3kyQixPQUFPejJCLE1BQVAsRUFBVCxHQUEwQixDQUFuQzs7QUFFQSxXQUFTMjJCLFlBQVQsR0FBd0I7QUFDdEJGLFdBQU83eEIsR0FBUCxDQUFXO0FBQ1Asb0JBQWM1RSxTQUFTO0FBRGhCLEtBQVg7QUFHRDs7QUFFRCxNQUFJQSxTQUFTLENBQWIsRUFBZ0I7QUFDZDIyQjtBQUNEO0FBQ0gsQ0FoQkQiLCJmaWxlIjoiZm91bmRhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiFmdW5jdGlvbigkKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgRk9VTkRBVElPTl9WRVJTSU9OID0gJzYuMy4wJztcblxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4vLyBUaGlzIGlzIGF0dGFjaGVkIHRvIHRoZSB3aW5kb3csIG9yIHVzZWQgYXMgYSBtb2R1bGUgZm9yIEFNRC9Ccm93c2VyaWZ5XG52YXIgRm91bmRhdGlvbiA9IHtcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxuXG4gIC8qKlxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cbiAgICovXG4gIF9wbHVnaW5zOiB7fSxcblxuICAvKipcbiAgICogU3RvcmVzIGdlbmVyYXRlZCB1bmlxdWUgaWRzIGZvciBwbHVnaW4gaW5zdGFuY2VzXG4gICAqL1xuICBfdXVpZHM6IFtdLFxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3IgUlRMIHN1cHBvcnRcbiAgICovXG4gIHJ0bDogZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gJCgnaHRtbCcpLmF0dHIoJ2RpcicpID09PSAncnRsJztcbiAgfSxcbiAgLyoqXG4gICAqIERlZmluZXMgYSBGb3VuZGF0aW9uIHBsdWdpbiwgYWRkaW5nIGl0IHRvIHRoZSBgRm91bmRhdGlvbmAgbmFtZXNwYWNlIGFuZCB0aGUgbGlzdCBvZiBwbHVnaW5zIHRvIGluaXRpYWxpemUgd2hlbiByZWZsb3dpbmcuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBUaGUgY29uc3RydWN0b3Igb2YgdGhlIHBsdWdpbi5cbiAgICovXG4gIHBsdWdpbjogZnVuY3Rpb24ocGx1Z2luLCBuYW1lKSB7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBhZGRpbmcgdG8gZ2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XG4gICAgLy8gRXhhbXBsZXM6IEZvdW5kYXRpb24uUmV2ZWFsLCBGb3VuZGF0aW9uLk9mZkNhbnZhc1xuICAgIHZhciBjbGFzc05hbWUgPSAobmFtZSB8fCBmdW5jdGlvbk5hbWUocGx1Z2luKSk7XG4gICAgLy8gT2JqZWN0IGtleSB0byB1c2Ugd2hlbiBzdG9yaW5nIHRoZSBwbHVnaW4sIGFsc28gdXNlZCB0byBjcmVhdGUgdGhlIGlkZW50aWZ5aW5nIGRhdGEgYXR0cmlidXRlIGZvciB0aGUgcGx1Z2luXG4gICAgLy8gRXhhbXBsZXM6IGRhdGEtcmV2ZWFsLCBkYXRhLW9mZi1jYW52YXNcbiAgICB2YXIgYXR0ck5hbWUgID0gaHlwaGVuYXRlKGNsYXNzTmFtZSk7XG5cbiAgICAvLyBBZGQgdG8gdGhlIEZvdW5kYXRpb24gb2JqZWN0IGFuZCB0aGUgcGx1Z2lucyBsaXN0IChmb3IgcmVmbG93aW5nKVxuICAgIHRoaXMuX3BsdWdpbnNbYXR0ck5hbWVdID0gdGhpc1tjbGFzc05hbWVdID0gcGx1Z2luO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFBvcHVsYXRlcyB0aGUgX3V1aWRzIGFycmF5IHdpdGggcG9pbnRlcnMgdG8gZWFjaCBpbmRpdmlkdWFsIHBsdWdpbiBpbnN0YW5jZS5cbiAgICogQWRkcyB0aGUgYHpmUGx1Z2luYCBkYXRhLWF0dHJpYnV0ZSB0byBwcm9ncmFtbWF0aWNhbGx5IGNyZWF0ZWQgcGx1Z2lucyB0byBhbGxvdyB1c2Ugb2YgJChzZWxlY3RvcikuZm91bmRhdGlvbihtZXRob2QpIGNhbGxzLlxuICAgKiBBbHNvIGZpcmVzIHRoZSBpbml0aWFsaXphdGlvbiBldmVudCBmb3IgZWFjaCBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZXRpdGl2ZSBjb2RlLlxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gdGhlIG5hbWUgb2YgdGhlIHBsdWdpbiwgcGFzc2VkIGFzIGEgY2FtZWxDYXNlZCBzdHJpbmcuXG4gICAqIEBmaXJlcyBQbHVnaW4jaW5pdFxuICAgKi9cbiAgcmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbiwgbmFtZSl7XG4gICAgdmFyIHBsdWdpbk5hbWUgPSBuYW1lID8gaHlwaGVuYXRlKG5hbWUpIDogZnVuY3Rpb25OYW1lKHBsdWdpbi5jb25zdHJ1Y3RvcikudG9Mb3dlckNhc2UoKTtcbiAgICBwbHVnaW4udXVpZCA9IHRoaXMuR2V0WW9EaWdpdHMoNiwgcGx1Z2luTmFtZSk7XG5cbiAgICBpZighcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApKXsgcGx1Z2luLiRlbGVtZW50LmF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWAsIHBsdWdpbi51dWlkKTsgfVxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuZGF0YSgnemZQbHVnaW4nKSl7IHBsdWdpbi4kZWxlbWVudC5kYXRhKCd6ZlBsdWdpbicsIHBsdWdpbik7IH1cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGluaXRpYWxpemVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jaW5pdFxuICAgICAgICAgICAqL1xuICAgIHBsdWdpbi4kZWxlbWVudC50cmlnZ2VyKGBpbml0LnpmLiR7cGx1Z2luTmFtZX1gKTtcblxuICAgIHRoaXMuX3V1aWRzLnB1c2gocGx1Z2luLnV1aWQpO1xuXG4gICAgcmV0dXJuO1xuICB9LFxuICAvKipcbiAgICogQGZ1bmN0aW9uXG4gICAqIFJlbW92ZXMgdGhlIHBsdWdpbnMgdXVpZCBmcm9tIHRoZSBfdXVpZHMgYXJyYXkuXG4gICAqIFJlbW92ZXMgdGhlIHpmUGx1Z2luIGRhdGEgYXR0cmlidXRlLCBhcyB3ZWxsIGFzIHRoZSBkYXRhLXBsdWdpbi1uYW1lIGF0dHJpYnV0ZS5cbiAgICogQWxzbyBmaXJlcyB0aGUgZGVzdHJveWVkIGV2ZW50IGZvciB0aGUgcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGV0aXRpdmUgY29kZS5cbiAgICogQHBhcmFtIHtPYmplY3R9IHBsdWdpbiAtIGFuIGluc3RhbmNlIG9mIGEgcGx1Z2luLCB1c3VhbGx5IGB0aGlzYCBpbiBjb250ZXh0LlxuICAgKiBAZmlyZXMgUGx1Z2luI2Rlc3Ryb3llZFxuICAgKi9cbiAgdW5yZWdpc3RlclBsdWdpbjogZnVuY3Rpb24ocGx1Z2luKXtcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGh5cGhlbmF0ZShmdW5jdGlvbk5hbWUocGx1Z2luLiRlbGVtZW50LmRhdGEoJ3pmUGx1Z2luJykuY29uc3RydWN0b3IpKTtcblxuICAgIHRoaXMuX3V1aWRzLnNwbGljZSh0aGlzLl91dWlkcy5pbmRleE9mKHBsdWdpbi51dWlkKSwgMSk7XG4gICAgcGx1Z2luLiRlbGVtZW50LnJlbW92ZUF0dHIoYGRhdGEtJHtwbHVnaW5OYW1lfWApLnJlbW92ZURhdGEoJ3pmUGx1Z2luJylcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGJlZW4gZGVzdHJveWVkLlxuICAgICAgICAgICAqIEBldmVudCBQbHVnaW4jZGVzdHJveWVkXG4gICAgICAgICAgICovXG4gICAgICAgICAgLnRyaWdnZXIoYGRlc3Ryb3llZC56Zi4ke3BsdWdpbk5hbWV9YCk7XG4gICAgZm9yKHZhciBwcm9wIGluIHBsdWdpbil7XG4gICAgICBwbHVnaW5bcHJvcF0gPSBudWxsOy8vY2xlYW4gdXAgc2NyaXB0IHRvIHByZXAgZm9yIGdhcmJhZ2UgY29sbGVjdGlvbi5cbiAgICB9XG4gICAgcmV0dXJuO1xuICB9LFxuXG4gIC8qKlxuICAgKiBAZnVuY3Rpb25cbiAgICogQ2F1c2VzIG9uZSBvciBtb3JlIGFjdGl2ZSBwbHVnaW5zIHRvIHJlLWluaXRpYWxpemUsIHJlc2V0dGluZyBldmVudCBsaXN0ZW5lcnMsIHJlY2FsY3VsYXRpbmcgcG9zaXRpb25zLCBldGMuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwbHVnaW5zIC0gb3B0aW9uYWwgc3RyaW5nIG9mIGFuIGluZGl2aWR1YWwgcGx1Z2luIGtleSwgYXR0YWluZWQgYnkgY2FsbGluZyBgJChlbGVtZW50KS5kYXRhKCdwbHVnaW5OYW1lJylgLCBvciBzdHJpbmcgb2YgYSBwbHVnaW4gY2xhc3MgaS5lLiBgJ2Ryb3Bkb3duJ2BcbiAgICogQGRlZmF1bHQgSWYgbm8gYXJndW1lbnQgaXMgcGFzc2VkLCByZWZsb3cgYWxsIGN1cnJlbnRseSBhY3RpdmUgcGx1Z2lucy5cbiAgICovXG4gICByZUluaXQ6IGZ1bmN0aW9uKHBsdWdpbnMpe1xuICAgICB2YXIgaXNKUSA9IHBsdWdpbnMgaW5zdGFuY2VvZiAkO1xuICAgICB0cnl7XG4gICAgICAgaWYoaXNKUSl7XG4gICAgICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgJCh0aGlzKS5kYXRhKCd6ZlBsdWdpbicpLl9pbml0KCk7XG4gICAgICAgICB9KTtcbiAgICAgICB9ZWxzZXtcbiAgICAgICAgIHZhciB0eXBlID0gdHlwZW9mIHBsdWdpbnMsXG4gICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgICBmbnMgPSB7XG4gICAgICAgICAgICdvYmplY3QnOiBmdW5jdGlvbihwbGdzKXtcbiAgICAgICAgICAgICBwbGdzLmZvckVhY2goZnVuY3Rpb24ocCl7XG4gICAgICAgICAgICAgICBwID0gaHlwaGVuYXRlKHApO1xuICAgICAgICAgICAgICAgJCgnW2RhdGEtJysgcCArJ10nKS5mb3VuZGF0aW9uKCdfaW5pdCcpO1xuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICB9LFxuICAgICAgICAgICAnc3RyaW5nJzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICBwbHVnaW5zID0gaHlwaGVuYXRlKHBsdWdpbnMpO1xuICAgICAgICAgICAgICQoJ1tkYXRhLScrIHBsdWdpbnMgKyddJykuZm91bmRhdGlvbignX2luaXQnKTtcbiAgICAgICAgICAgfSxcbiAgICAgICAgICAgJ3VuZGVmaW5lZCc6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgdGhpc1snb2JqZWN0J10oT2JqZWN0LmtleXMoX3RoaXMuX3BsdWdpbnMpKTtcbiAgICAgICAgICAgfVxuICAgICAgICAgfTtcbiAgICAgICAgIGZuc1t0eXBlXShwbHVnaW5zKTtcbiAgICAgICB9XG4gICAgIH1jYXRjaChlcnIpe1xuICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgfWZpbmFsbHl7XG4gICAgICAgcmV0dXJuIHBsdWdpbnM7XG4gICAgIH1cbiAgIH0sXG5cbiAgLyoqXG4gICAqIHJldHVybnMgYSByYW5kb20gYmFzZS0zNiB1aWQgd2l0aCBuYW1lc3BhY2luZ1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCAtIG51bWJlciBvZiByYW5kb20gYmFzZS0zNiBkaWdpdHMgZGVzaXJlZC4gSW5jcmVhc2UgZm9yIG1vcmUgcmFuZG9tIHN0cmluZ3MuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lc3BhY2UgLSBuYW1lIG9mIHBsdWdpbiB0byBiZSBpbmNvcnBvcmF0ZWQgaW4gdWlkLCBvcHRpb25hbC5cbiAgICogQGRlZmF1bHQge1N0cmluZ30gJycgLSBpZiBubyBwbHVnaW4gbmFtZSBpcyBwcm92aWRlZCwgbm90aGluZyBpcyBhcHBlbmRlZCB0byB0aGUgdWlkLlxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSAtIHVuaXF1ZSBpZFxuICAgKi9cbiAgR2V0WW9EaWdpdHM6IGZ1bmN0aW9uKGxlbmd0aCwgbmFtZXNwYWNlKXtcbiAgICBsZW5ndGggPSBsZW5ndGggfHwgNjtcbiAgICByZXR1cm4gTWF0aC5yb3VuZCgoTWF0aC5wb3coMzYsIGxlbmd0aCArIDEpIC0gTWF0aC5yYW5kb20oKSAqIE1hdGgucG93KDM2LCBsZW5ndGgpKSkudG9TdHJpbmcoMzYpLnNsaWNlKDEpICsgKG5hbWVzcGFjZSA/IGAtJHtuYW1lc3BhY2V9YCA6ICcnKTtcbiAgfSxcbiAgLyoqXG4gICAqIEluaXRpYWxpemUgcGx1Z2lucyBvbiBhbnkgZWxlbWVudHMgd2l0aGluIGBlbGVtYCAoYW5kIGBlbGVtYCBpdHNlbGYpIHRoYXQgYXJlbid0IGFscmVhZHkgaW5pdGlhbGl6ZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtIC0galF1ZXJ5IG9iamVjdCBjb250YWluaW5nIHRoZSBlbGVtZW50IHRvIGNoZWNrIGluc2lkZS4gQWxzbyBjaGVja3MgdGhlIGVsZW1lbnQgaXRzZWxmLCB1bmxlc3MgaXQncyB0aGUgYGRvY3VtZW50YCBvYmplY3QuXG4gICAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBwbHVnaW5zIC0gQSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZS4gTGVhdmUgdGhpcyBvdXQgdG8gaW5pdGlhbGl6ZSBldmVyeXRoaW5nLlxuICAgKi9cbiAgcmVmbG93OiBmdW5jdGlvbihlbGVtLCBwbHVnaW5zKSB7XG5cbiAgICAvLyBJZiBwbHVnaW5zIGlzIHVuZGVmaW5lZCwganVzdCBncmFiIGV2ZXJ5dGhpbmdcbiAgICBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBwbHVnaW5zID0gT2JqZWN0LmtleXModGhpcy5fcGx1Z2lucyk7XG4gICAgfVxuICAgIC8vIElmIHBsdWdpbnMgaXMgYSBzdHJpbmcsIGNvbnZlcnQgaXQgdG8gYW4gYXJyYXkgd2l0aCBvbmUgaXRlbVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwbHVnaW5zID09PSAnc3RyaW5nJykge1xuICAgICAgcGx1Z2lucyA9IFtwbHVnaW5zXTtcbiAgICB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGVhY2ggcGx1Z2luXG4gICAgJC5lYWNoKHBsdWdpbnMsIGZ1bmN0aW9uKGksIG5hbWUpIHtcbiAgICAgIC8vIEdldCB0aGUgY3VycmVudCBwbHVnaW5cbiAgICAgIHZhciBwbHVnaW4gPSBfdGhpcy5fcGx1Z2luc1tuYW1lXTtcblxuICAgICAgLy8gTG9jYWxpemUgdGhlIHNlYXJjaCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIGVsZW0sIGFzIHdlbGwgYXMgZWxlbSBpdHNlbGYsIHVubGVzcyBlbGVtID09PSBkb2N1bWVudFxuICAgICAgdmFyICRlbGVtID0gJChlbGVtKS5maW5kKCdbZGF0YS0nK25hbWUrJ10nKS5hZGRCYWNrKCdbZGF0YS0nK25hbWUrJ10nKTtcblxuICAgICAgLy8gRm9yIGVhY2ggcGx1Z2luIGZvdW5kLCBpbml0aWFsaXplIGl0XG4gICAgICAkZWxlbS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgJGVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgLy8gRG9uJ3QgZG91YmxlLWRpcCBvbiBwbHVnaW5zXG4gICAgICAgIGlmICgkZWwuZGF0YSgnemZQbHVnaW4nKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIlRyaWVkIHRvIGluaXRpYWxpemUgXCIrbmFtZStcIiBvbiBhbiBlbGVtZW50IHRoYXQgYWxyZWFkeSBoYXMgYSBGb3VuZGF0aW9uIHBsdWdpbi5cIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpKXtcbiAgICAgICAgICB2YXIgdGhpbmcgPSAkZWwuYXR0cignZGF0YS1vcHRpb25zJykuc3BsaXQoJzsnKS5mb3JFYWNoKGZ1bmN0aW9uKGUsIGkpe1xuICAgICAgICAgICAgdmFyIG9wdCA9IGUuc3BsaXQoJzonKS5tYXAoZnVuY3Rpb24oZWwpeyByZXR1cm4gZWwudHJpbSgpOyB9KTtcbiAgICAgICAgICAgIGlmKG9wdFswXSkgb3B0c1tvcHRbMF1dID0gcGFyc2VWYWx1ZShvcHRbMV0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRyeXtcbiAgICAgICAgICAkZWwuZGF0YSgnemZQbHVnaW4nLCBuZXcgcGx1Z2luKCQodGhpcyksIG9wdHMpKTtcbiAgICAgICAgfWNhdGNoKGVyKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVyKTtcbiAgICAgICAgfWZpbmFsbHl7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcbiAgZ2V0Rm5OYW1lOiBmdW5jdGlvbk5hbWUsXG4gIHRyYW5zaXRpb25lbmQ6IGZ1bmN0aW9uKCRlbGVtKXtcbiAgICB2YXIgdHJhbnNpdGlvbnMgPSB7XG4gICAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICAgJ01velRyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXG4gICAgfTtcbiAgICB2YXIgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLFxuICAgICAgICBlbmQ7XG5cbiAgICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKXtcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpe1xuICAgICAgICBlbmQgPSB0cmFuc2l0aW9uc1t0XTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZW5kKXtcbiAgICAgIHJldHVybiBlbmQ7XG4gICAgfWVsc2V7XG4gICAgICBlbmQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICRlbGVtLnRyaWdnZXJIYW5kbGVyKCd0cmFuc2l0aW9uZW5kJywgWyRlbGVtXSk7XG4gICAgICB9LCAxKTtcbiAgICAgIHJldHVybiAndHJhbnNpdGlvbmVuZCc7XG4gICAgfVxuICB9XG59O1xuXG5Gb3VuZGF0aW9uLnV0aWwgPSB7XG4gIC8qKlxuICAgKiBGdW5jdGlvbiBmb3IgYXBwbHlpbmcgYSBkZWJvdW5jZSBlZmZlY3QgdG8gYSBmdW5jdGlvbiBjYWxsLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhdCBlbmQgb2YgdGltZW91dC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IC0gVGltZSBpbiBtcyB0byBkZWxheSB0aGUgY2FsbCBvZiBgZnVuY2AuXG4gICAqIEByZXR1cm5zIGZ1bmN0aW9uXG4gICAqL1xuICB0aHJvdHRsZTogZnVuY3Rpb24gKGZ1bmMsIGRlbGF5KSB7XG4gICAgdmFyIHRpbWVyID0gbnVsbDtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY29udGV4dCA9IHRoaXMsIGFyZ3MgPSBhcmd1bWVudHM7XG5cbiAgICAgIGlmICh0aW1lciA9PT0gbnVsbCkge1xuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufTtcblxuLy8gVE9ETzogY29uc2lkZXIgbm90IG1ha2luZyB0aGlzIGEgalF1ZXJ5IGZ1bmN0aW9uXG4vLyBUT0RPOiBuZWVkIHdheSB0byByZWZsb3cgdnMuIHJlLWluaXRpYWxpemVcbi8qKlxuICogVGhlIEZvdW5kYXRpb24galF1ZXJ5IG1ldGhvZC5cbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBtZXRob2QgLSBBbiBhY3Rpb24gdG8gcGVyZm9ybSBvbiB0aGUgY3VycmVudCBqUXVlcnkgb2JqZWN0LlxuICovXG52YXIgZm91bmRhdGlvbiA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiBtZXRob2QsXG4gICAgICAkbWV0YSA9ICQoJ21ldGEuZm91bmRhdGlvbi1tcScpLFxuICAgICAgJG5vSlMgPSAkKCcubm8tanMnKTtcblxuICBpZighJG1ldGEubGVuZ3RoKXtcbiAgICAkKCc8bWV0YSBjbGFzcz1cImZvdW5kYXRpb24tbXFcIj4nKS5hcHBlbmRUbyhkb2N1bWVudC5oZWFkKTtcbiAgfVxuICBpZigkbm9KUy5sZW5ndGgpe1xuICAgICRub0pTLnJlbW92ZUNsYXNzKCduby1qcycpO1xuICB9XG5cbiAgaWYodHlwZSA9PT0gJ3VuZGVmaW5lZCcpey8vbmVlZHMgdG8gaW5pdGlhbGl6ZSB0aGUgRm91bmRhdGlvbiBvYmplY3QsIG9yIGFuIGluZGl2aWR1YWwgcGx1Z2luLlxuICAgIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5faW5pdCgpO1xuICAgIEZvdW5kYXRpb24ucmVmbG93KHRoaXMpO1xuICB9ZWxzZSBpZih0eXBlID09PSAnc3RyaW5nJyl7Ly9hbiBpbmRpdmlkdWFsIG1ldGhvZCB0byBpbnZva2Ugb24gYSBwbHVnaW4gb3IgZ3JvdXAgb2YgcGx1Z2luc1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsvL2NvbGxlY3QgYWxsIHRoZSBhcmd1bWVudHMsIGlmIG5lY2Vzc2FyeVxuICAgIHZhciBwbHVnQ2xhc3MgPSB0aGlzLmRhdGEoJ3pmUGx1Z2luJyk7Ly9kZXRlcm1pbmUgdGhlIGNsYXNzIG9mIHBsdWdpblxuXG4gICAgaWYocGx1Z0NsYXNzICE9PSB1bmRlZmluZWQgJiYgcGx1Z0NsYXNzW21ldGhvZF0gIT09IHVuZGVmaW5lZCl7Ly9tYWtlIHN1cmUgYm90aCB0aGUgY2xhc3MgYW5kIG1ldGhvZCBleGlzdFxuICAgICAgaWYodGhpcy5sZW5ndGggPT09IDEpey8vaWYgdGhlcmUncyBvbmx5IG9uZSwgY2FsbCBpdCBkaXJlY3RseS5cbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseShwbHVnQ2xhc3MsIGFyZ3MpO1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuZWFjaChmdW5jdGlvbihpLCBlbCl7Ly9vdGhlcndpc2UgbG9vcCB0aHJvdWdoIHRoZSBqUXVlcnkgY29sbGVjdGlvbiBhbmQgaW52b2tlIHRoZSBtZXRob2Qgb24gZWFjaFxuICAgICAgICAgIHBsdWdDbGFzc1ttZXRob2RdLmFwcGx5KCQoZWwpLmRhdGEoJ3pmUGx1Z2luJyksIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9ZWxzZXsvL2Vycm9yIGZvciBubyBjbGFzcyBvciBubyBtZXRob2RcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIldlJ3JlIHNvcnJ5LCAnXCIgKyBtZXRob2QgKyBcIicgaXMgbm90IGFuIGF2YWlsYWJsZSBtZXRob2QgZm9yIFwiICsgKHBsdWdDbGFzcyA/IGZ1bmN0aW9uTmFtZShwbHVnQ2xhc3MpIDogJ3RoaXMgZWxlbWVudCcpICsgJy4nKTtcbiAgICB9XG4gIH1lbHNley8vZXJyb3IgZm9yIGludmFsaWQgYXJndW1lbnQgdHlwZVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFdlJ3JlIHNvcnJ5LCAke3R5cGV9IGlzIG5vdCBhIHZhbGlkIHBhcmFtZXRlci4gWW91IG11c3QgdXNlIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgbWV0aG9kIHlvdSB3aXNoIHRvIGludm9rZS5gKTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn07XG5cbndpbmRvdy5Gb3VuZGF0aW9uID0gRm91bmRhdGlvbjtcbiQuZm4uZm91bmRhdGlvbiA9IGZvdW5kYXRpb247XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdyB8fCAhd2luZG93LkRhdGUubm93KVxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcblxuICB2YXIgdmVuZG9ycyA9IFsnd2Via2l0JywgJ21veiddO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcbiAgICAgIHZhciB2cCA9IHZlbmRvcnNbaV07XG4gICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZwKydSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHx8IHdpbmRvd1t2cCsnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10pO1xuICB9XG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXG4gICAgfHwgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIXdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgIHZhciBsYXN0VGltZSA9IDA7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgbmV4dFRpbWUgPSBNYXRoLm1heChsYXN0VGltZSArIDE2LCBub3cpO1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG5leHRUaW1lIC0gbm93KTtcbiAgICB9O1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcbiAgfVxuICAvKipcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXG4gICAqL1xuICBpZighd2luZG93LnBlcmZvcm1hbmNlIHx8ICF3aW5kb3cucGVyZm9ybWFuY2Uubm93KXtcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XG4gICAgICBzdGFydDogRGF0ZS5ub3coKSxcbiAgICAgIG5vdzogZnVuY3Rpb24oKXsgcmV0dXJuIERhdGUubm93KCkgLSB0aGlzLnN0YXJ0OyB9XG4gICAgfTtcbiAgfVxufSkoKTtcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbihvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZScpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyAgID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXG4gICAgICAgIGZOT1AgICAgPSBmdW5jdGlvbigpIHt9LFxuICAgICAgICBmQm91bmQgID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcbiAgICAgIC8vIG5hdGl2ZSBmdW5jdGlvbnMgZG9uJ3QgaGF2ZSBhIHByb3RvdHlwZVxuICAgICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICB9XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XG5mdW5jdGlvbiBmdW5jdGlvbk5hbWUoZm4pIHtcbiAgaWYgKEZ1bmN0aW9uLnByb3RvdHlwZS5uYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xuICAgIHZhciByZXN1bHRzID0gKGZ1bmNOYW1lUmVnZXgpLmV4ZWMoKGZuKS50b1N0cmluZygpKTtcbiAgICByZXR1cm4gKHJlc3VsdHMgJiYgcmVzdWx0cy5sZW5ndGggPiAxKSA/IHJlc3VsdHNbMV0udHJpbSgpIDogXCJcIjtcbiAgfVxuICBlbHNlIGlmIChmbi5wcm90b3R5cGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmbi5jb25zdHJ1Y3Rvci5uYW1lO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiBmbi5wcm90b3R5cGUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuZnVuY3Rpb24gcGFyc2VWYWx1ZShzdHIpe1xuICBpZiAoJ3RydWUnID09PSBzdHIpIHJldHVybiB0cnVlO1xuICBlbHNlIGlmICgnZmFsc2UnID09PSBzdHIpIHJldHVybiBmYWxzZTtcbiAgZWxzZSBpZiAoIWlzTmFOKHN0ciAqIDEpKSByZXR1cm4gcGFyc2VGbG9hdChzdHIpO1xuICByZXR1cm4gc3RyO1xufVxuLy8gQ29udmVydCBQYXNjYWxDYXNlIHRvIGtlYmFiLWNhc2Vcbi8vIFRoYW5rIHlvdTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvODk1NTU4MFxuZnVuY3Rpb24gaHlwaGVuYXRlKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbYS16XSkoW0EtWl0pL2csICckMS0kMicpLnRvTG93ZXJDYXNlKCk7XG59XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuRm91bmRhdGlvbi5Cb3ggPSB7XG4gIEltTm90VG91Y2hpbmdZb3U6IEltTm90VG91Y2hpbmdZb3UsXG4gIEdldERpbWVuc2lvbnM6IEdldERpbWVuc2lvbnMsXG4gIEdldE9mZnNldHM6IEdldE9mZnNldHNcbn1cblxuLyoqXG4gKiBDb21wYXJlcyB0aGUgZGltZW5zaW9ucyBvZiBhbiBlbGVtZW50IHRvIGEgY29udGFpbmVyIGFuZCBkZXRlcm1pbmVzIGNvbGxpc2lvbiBldmVudHMgd2l0aCBjb250YWluZXIuXG4gKiBAZnVuY3Rpb25cbiAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB0ZXN0IGZvciBjb2xsaXNpb25zLlxuICogQHBhcmFtIHtqUXVlcnl9IHBhcmVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIGJvdW5kaW5nIGNvbnRhaW5lci5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gbHJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgbGVmdCBhbmQgcmlnaHQgdmFsdWVzIG9ubHkuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRiT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIHRvcCBhbmQgYm90dG9tIHZhbHVlcyBvbmx5LlxuICogQGRlZmF1bHQgaWYgbm8gcGFyZW50IG9iamVjdCBwYXNzZWQsIGRldGVjdHMgY29sbGlzaW9ucyB3aXRoIGB3aW5kb3dgLlxuICogQHJldHVybnMge0Jvb2xlYW59IC0gdHJ1ZSBpZiBjb2xsaXNpb24gZnJlZSwgZmFsc2UgaWYgYSBjb2xsaXNpb24gaW4gYW55IGRpcmVjdGlvbi5cbiAqL1xuZnVuY3Rpb24gSW1Ob3RUb3VjaGluZ1lvdShlbGVtZW50LCBwYXJlbnQsIGxyT25seSwgdGJPbmx5KSB7XG4gIHZhciBlbGVEaW1zID0gR2V0RGltZW5zaW9ucyhlbGVtZW50KSxcbiAgICAgIHRvcCwgYm90dG9tLCBsZWZ0LCByaWdodDtcblxuICBpZiAocGFyZW50KSB7XG4gICAgdmFyIHBhckRpbXMgPSBHZXREaW1lbnNpb25zKHBhcmVudCk7XG5cbiAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gcGFyRGltcy5oZWlnaHQgKyBwYXJEaW1zLm9mZnNldC50b3ApO1xuICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gcGFyRGltcy5vZmZzZXQudG9wKTtcbiAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBwYXJEaW1zLm9mZnNldC5sZWZ0KTtcbiAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gcGFyRGltcy53aWR0aCArIHBhckRpbXMub2Zmc2V0LmxlZnQpO1xuICB9XG4gIGVsc2Uge1xuICAgIGJvdHRvbSA9IChlbGVEaW1zLm9mZnNldC50b3AgKyBlbGVEaW1zLmhlaWdodCA8PSBlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0ICsgZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xuICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xuICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCk7XG4gICAgcmlnaHQgID0gKGVsZURpbXMub2Zmc2V0LmxlZnQgKyBlbGVEaW1zLndpZHRoIDw9IGVsZURpbXMud2luZG93RGltcy53aWR0aCk7XG4gIH1cblxuICB2YXIgYWxsRGlycyA9IFtib3R0b20sIHRvcCwgbGVmdCwgcmlnaHRdO1xuXG4gIGlmIChsck9ubHkpIHtcbiAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgPT09IHRydWU7XG4gIH1cblxuICBpZiAodGJPbmx5KSB7XG4gICAgcmV0dXJuIHRvcCA9PT0gYm90dG9tID09PSB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGFsbERpcnMuaW5kZXhPZihmYWxzZSkgPT09IC0xO1xufTtcblxuLyoqXG4gKiBVc2VzIG5hdGl2ZSBtZXRob2RzIHRvIHJldHVybiBhbiBvYmplY3Qgb2YgZGltZW5zaW9uIHZhbHVlcy5cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnkgfHwgSFRNTH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3Qgb3IgRE9NIGVsZW1lbnQgZm9yIHdoaWNoIHRvIGdldCB0aGUgZGltZW5zaW9ucy4gQ2FuIGJlIGFueSBlbGVtZW50IG90aGVyIHRoYXQgZG9jdW1lbnQgb3Igd2luZG93LlxuICogQHJldHVybnMge09iamVjdH0gLSBuZXN0ZWQgb2JqZWN0IG9mIGludGVnZXIgcGl4ZWwgdmFsdWVzXG4gKiBUT0RPIC0gaWYgZWxlbWVudCBpcyB3aW5kb3csIHJldHVybiBvbmx5IHRob3NlIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gR2V0RGltZW5zaW9ucyhlbGVtLCB0ZXN0KXtcbiAgZWxlbSA9IGVsZW0ubGVuZ3RoID8gZWxlbVswXSA6IGVsZW07XG5cbiAgaWYgKGVsZW0gPT09IHdpbmRvdyB8fCBlbGVtID09PSBkb2N1bWVudCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkknbSBzb3JyeSwgRGF2ZS4gSSdtIGFmcmFpZCBJIGNhbid0IGRvIHRoYXQuXCIpO1xuICB9XG5cbiAgdmFyIHJlY3QgPSBlbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgcGFyUmVjdCA9IGVsZW0ucGFyZW50Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgIHdpblJlY3QgPSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgd2luWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcbiAgICAgIHdpblggPSB3aW5kb3cucGFnZVhPZmZzZXQ7XG5cbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogcmVjdC53aWR0aCxcbiAgICBoZWlnaHQ6IHJlY3QuaGVpZ2h0LFxuICAgIG9mZnNldDoge1xuICAgICAgdG9wOiByZWN0LnRvcCArIHdpblksXG4gICAgICBsZWZ0OiByZWN0LmxlZnQgKyB3aW5YXG4gICAgfSxcbiAgICBwYXJlbnREaW1zOiB7XG4gICAgICB3aWR0aDogcGFyUmVjdC53aWR0aCxcbiAgICAgIGhlaWdodDogcGFyUmVjdC5oZWlnaHQsXG4gICAgICBvZmZzZXQ6IHtcbiAgICAgICAgdG9wOiBwYXJSZWN0LnRvcCArIHdpblksXG4gICAgICAgIGxlZnQ6IHBhclJlY3QubGVmdCArIHdpblhcbiAgICAgIH1cbiAgICB9LFxuICAgIHdpbmRvd0RpbXM6IHtcbiAgICAgIHdpZHRoOiB3aW5SZWN0LndpZHRoLFxuICAgICAgaGVpZ2h0OiB3aW5SZWN0LmhlaWdodCxcbiAgICAgIG9mZnNldDoge1xuICAgICAgICB0b3A6IHdpblksXG4gICAgICAgIGxlZnQ6IHdpblhcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBvZiB0b3AgYW5kIGxlZnQgaW50ZWdlciBwaXhlbCB2YWx1ZXMgZm9yIGR5bmFtaWNhbGx5IHJlbmRlcmVkIGVsZW1lbnRzLFxuICogc3VjaCBhczogVG9vbHRpcCwgUmV2ZWFsLCBhbmQgRHJvcGRvd25cbiAqIEBmdW5jdGlvblxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IGZvciB0aGUgZWxlbWVudCBiZWluZyBwb3NpdGlvbmVkLlxuICogQHBhcmFtIHtqUXVlcnl9IGFuY2hvciAtIGpRdWVyeSBvYmplY3QgZm9yIHRoZSBlbGVtZW50J3MgYW5jaG9yIHBvaW50LlxuICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gYSBzdHJpbmcgcmVsYXRpbmcgdG8gdGhlIGRlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQsIHJlbGF0aXZlIHRvIGl0J3MgYW5jaG9yXG4gKiBAcGFyYW0ge051bWJlcn0gdk9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCB2ZXJ0aWNhbCBzZXBhcmF0aW9uIGJldHdlZW4gYW5jaG9yIGFuZCBlbGVtZW50LlxuICogQHBhcmFtIHtOdW1iZXJ9IGhPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgaG9yaXpvbnRhbCBzZXBhcmF0aW9uIGJldHdlZW4gYW5jaG9yIGFuZCBlbGVtZW50LlxuICogQHBhcmFtIHtCb29sZWFufSBpc092ZXJmbG93IC0gaWYgYSBjb2xsaXNpb24gZXZlbnQgaXMgZGV0ZWN0ZWQsIHNldHMgdG8gdHJ1ZSB0byBkZWZhdWx0IHRoZSBlbGVtZW50IHRvIGZ1bGwgd2lkdGggLSBhbnkgZGVzaXJlZCBvZmZzZXQuXG4gKiBUT0RPIGFsdGVyL3Jld3JpdGUgdG8gd29yayB3aXRoIGBlbWAgdmFsdWVzIGFzIHdlbGwvaW5zdGVhZCBvZiBwaXhlbHNcbiAqL1xuZnVuY3Rpb24gR2V0T2Zmc2V0cyhlbGVtZW50LCBhbmNob3IsIHBvc2l0aW9uLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KSB7XG4gIHZhciAkZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXG4gICAgICAkYW5jaG9yRGltcyA9IGFuY2hvciA/IEdldERpbWVuc2lvbnMoYW5jaG9yKSA6IG51bGw7XG5cbiAgc3dpdGNoIChwb3NpdGlvbikge1xuICAgIGNhc2UgJ3RvcCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoRm91bmRhdGlvbi5ydGwoKSA/ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gJGVsZURpbXMud2lkdGggKyAkYW5jaG9yRGltcy53aWR0aCA6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gKCRlbGVEaW1zLmhlaWdodCArIHZPZmZzZXQpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdsZWZ0JzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRhbmNob3JEaW1zLm9mZnNldC5sZWZ0IC0gKCRlbGVEaW1zLndpZHRoICsgaE9mZnNldCksXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAncmlnaHQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAkYW5jaG9yRGltcy53aWR0aCArIGhPZmZzZXQsXG4gICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIHRvcCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wIC0gKCRlbGVEaW1zLmhlaWdodCArIHZPZmZzZXQpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXIgYm90dG9tJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IGlzT3ZlcmZsb3cgPyBoT2Zmc2V0IDogKCgkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICgkYW5jaG9yRGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpKSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnY2VudGVyIGxlZnQnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAoJGVsZURpbXMud2lkdGggKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2NlbnRlciByaWdodCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCArIDEsXG4gICAgICAgIHRvcDogKCRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAoJGFuY2hvckRpbXMuaGVpZ2h0IC8gMikpIC0gKCRlbGVEaW1zLmhlaWdodCAvIDIpXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdjZW50ZXInOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGVmdDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQgKyAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAvIDIpKSAtICgkZWxlRGltcy53aWR0aCAvIDIpLFxuICAgICAgICB0b3A6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3AgKyAoJGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JldmVhbCc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAoJGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICRlbGVEaW1zLndpZHRoKSAvIDIsXG4gICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgdk9mZnNldFxuICAgICAgfVxuICAgIGNhc2UgJ3JldmVhbCBmdWxsJzpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6ICRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQsXG4gICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wXG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdsZWZ0IGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3JpZ2h0IGJvdHRvbSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCAtICRlbGVEaW1zLndpZHRoLFxuICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XG4gICAgICB9O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxlZnQ6IChGb3VuZGF0aW9uLnJ0bCgpID8gJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgLSAkZWxlRGltcy53aWR0aCArICRhbmNob3JEaW1zLndpZHRoIDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyBoT2Zmc2V0KSxcbiAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgJGFuY2hvckRpbXMuaGVpZ2h0ICsgdk9mZnNldFxuICAgICAgfVxuICB9XG59XG5cbn0oalF1ZXJ5KTtcbiIsIi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcbiAqIFBsZWFzZSB0aGFuayBNYXJpdXMgb24gR2l0SHViIC9vd2xiZXJ0eiAqXG4gKiBvciB0aGUgd2ViIGh0dHA6Ly93d3cubWFyaXVzb2xiZXJ0ei5kZS8gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuY29uc3Qga2V5Q29kZXMgPSB7XG4gIDk6ICdUQUInLFxuICAxMzogJ0VOVEVSJyxcbiAgMjc6ICdFU0NBUEUnLFxuICAzMjogJ1NQQUNFJyxcbiAgMzc6ICdBUlJPV19MRUZUJyxcbiAgMzg6ICdBUlJPV19VUCcsXG4gIDM5OiAnQVJST1dfUklHSFQnLFxuICA0MDogJ0FSUk9XX0RPV04nXG59XG5cbnZhciBjb21tYW5kcyA9IHt9XG5cbnZhciBLZXlib2FyZCA9IHtcbiAga2V5czogZ2V0S2V5Q29kZXMoa2V5Q29kZXMpLFxuXG4gIC8qKlxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcbiAgICogQ2FuIGJlIHVzZWQgbGlrZSBGb3VuZGF0aW9uLnBhcnNlS2V5KGV2ZW50KSA9PT0gRm91bmRhdGlvbi5rZXlzLlNQQUNFXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxuICAgKi9cbiAgcGFyc2VLZXkoZXZlbnQpIHtcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcblxuICAgIC8vIFJlbW92ZSB1bi1wcmludGFibGUgY2hhcmFjdGVycywgZS5nLiBmb3IgYGZyb21DaGFyQ29kZWAgY2FsbHMgZm9yIENUUkwgb25seSBldmVudHNcbiAgICBrZXkgPSBrZXkucmVwbGFjZSgvXFxXKy8sICcnKTtcblxuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gYFNISUZUXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmN0cmxLZXkpIGtleSA9IGBDVFJMXyR7a2V5fWA7XG4gICAgaWYgKGV2ZW50LmFsdEtleSkga2V5ID0gYEFMVF8ke2tleX1gO1xuXG4gICAgLy8gUmVtb3ZlIHRyYWlsaW5nIHVuZGVyc2NvcmUsIGluIGNhc2Ugb25seSBtb2RpZmllcnMgd2VyZSB1c2VkIChlLmcuIG9ubHkgYENUUkxfQUxUYClcbiAgICBrZXkgPSBrZXkucmVwbGFjZSgvXyQvLCAnJyk7XG5cbiAgICByZXR1cm4ga2V5O1xuICB9LFxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSBnaXZlbiAoa2V5Ym9hcmQpIGV2ZW50XG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxuICAgKiBAcGFyYW0ge1N0cmluZ30gY29tcG9uZW50IC0gRm91bmRhdGlvbiBjb21wb25lbnQncyBuYW1lLCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHBhcmFtIHtPYmplY3RzfSBmdW5jdGlvbnMgLSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBleGVjdXRlZFxuICAgKi9cbiAgaGFuZGxlS2V5KGV2ZW50LCBjb21wb25lbnQsIGZ1bmN0aW9ucykge1xuICAgIHZhciBjb21tYW5kTGlzdCA9IGNvbW1hbmRzW2NvbXBvbmVudF0sXG4gICAgICBrZXlDb2RlID0gdGhpcy5wYXJzZUtleShldmVudCksXG4gICAgICBjbWRzLFxuICAgICAgY29tbWFuZCxcbiAgICAgIGZuO1xuXG4gICAgaWYgKCFjb21tYW5kTGlzdCkgcmV0dXJuIGNvbnNvbGUud2FybignQ29tcG9uZW50IG5vdCBkZWZpbmVkIScpO1xuXG4gICAgaWYgKHR5cGVvZiBjb21tYW5kTGlzdC5sdHIgPT09ICd1bmRlZmluZWQnKSB7IC8vIHRoaXMgY29tcG9uZW50IGRvZXMgbm90IGRpZmZlcmVudGlhdGUgYmV0d2VlbiBsdHIgYW5kIHJ0bFxuICAgICAgICBjbWRzID0gY29tbWFuZExpc3Q7IC8vIHVzZSBwbGFpbiBsaXN0XG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXG4gICAgICAgIGlmIChGb3VuZGF0aW9uLnJ0bCgpKSBjbWRzID0gJC5leHRlbmQoe30sIGNvbW1hbmRMaXN0Lmx0ciwgY29tbWFuZExpc3QucnRsKTtcblxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xuICAgIH1cbiAgICBjb21tYW5kID0gY21kc1trZXlDb2RlXTtcblxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xuICAgIGlmIChmbiAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHsgLy8gZXhlY3V0ZSBmdW5jdGlvbiAgaWYgZXhpc3RzXG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSBmbi5hcHBseSgpO1xuICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMuaGFuZGxlZChyZXR1cm5WYWx1ZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcbiAgICAgICAgICBmdW5jdGlvbnMudW5oYW5kbGVkKCk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHNlYXJjaCB3aXRoaW5cbiAgICogQHJldHVybiB7alF1ZXJ5fSAkZm9jdXNhYmxlIC0gYWxsIGZvY3VzYWJsZSBlbGVtZW50cyB3aXRoaW4gYCRlbGVtZW50YFxuICAgKi9cbiAgZmluZEZvY3VzYWJsZSgkZWxlbWVudCkge1xuICAgIGlmKCEkZWxlbWVudCkge3JldHVybiBmYWxzZTsgfVxuICAgIHJldHVybiAkZWxlbWVudC5maW5kKCdhW2hyZWZdLCBhcmVhW2hyZWZdLCBpbnB1dDpub3QoW2Rpc2FibGVkXSksIHNlbGVjdDpub3QoW2Rpc2FibGVkXSksIHRleHRhcmVhOm5vdChbZGlzYWJsZWRdKSwgYnV0dG9uOm5vdChbZGlzYWJsZWRdKSwgaWZyYW1lLCBvYmplY3QsIGVtYmVkLCAqW3RhYmluZGV4XSwgKltjb250ZW50ZWRpdGFibGVdJykuZmlsdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvbXBvbmVudCBuYW1lIG5hbWVcbiAgICogQHBhcmFtIHtPYmplY3R9IGNvbXBvbmVudCAtIEZvdW5kYXRpb24gY29tcG9uZW50LCBlLmcuIFNsaWRlciBvciBSZXZlYWxcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxuICAgKi9cblxuICByZWdpc3Rlcihjb21wb25lbnROYW1lLCBjbWRzKSB7XG4gICAgY29tbWFuZHNbY29tcG9uZW50TmFtZV0gPSBjbWRzO1xuICB9LCAgXG5cbiAgLyoqXG4gICAqIFRyYXBzIHRoZSBmb2N1cyBpbiB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtICB7alF1ZXJ5fSAkZWxlbWVudCAgalF1ZXJ5IG9iamVjdCB0byB0cmFwIHRoZSBmb3VjcyBpbnRvLlxuICAgKi9cbiAgdHJhcEZvY3VzKCRlbGVtZW50KSB7XG4gICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUoJGVsZW1lbnQpLFxuICAgICAgICAkZmlyc3RGb2N1c2FibGUgPSAkZm9jdXNhYmxlLmVxKDApLFxuICAgICAgICAkbGFzdEZvY3VzYWJsZSA9ICRmb2N1c2FibGUuZXEoLTEpO1xuXG4gICAgJGVsZW1lbnQub24oJ2tleWRvd24uemYudHJhcGZvY3VzJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC50YXJnZXQgPT09ICRsYXN0Rm9jdXNhYmxlWzBdICYmIEZvdW5kYXRpb24uS2V5Ym9hcmQucGFyc2VLZXkoZXZlbnQpID09PSAnVEFCJykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkZmlyc3RGb2N1c2FibGUuZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGV2ZW50LnRhcmdldCA9PT0gJGZpcnN0Rm9jdXNhYmxlWzBdICYmIEZvdW5kYXRpb24uS2V5Ym9hcmQucGFyc2VLZXkoZXZlbnQpID09PSAnU0hJRlRfVEFCJykge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAkbGFzdEZvY3VzYWJsZS5mb2N1cygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICAvKipcbiAgICogUmVsZWFzZXMgdGhlIHRyYXBwZWQgZm9jdXMgZnJvbSB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAgICogQHBhcmFtICB7alF1ZXJ5fSAkZWxlbWVudCAgalF1ZXJ5IG9iamVjdCB0byByZWxlYXNlIHRoZSBmb2N1cyBmb3IuXG4gICAqL1xuICByZWxlYXNlRm9jdXMoJGVsZW1lbnQpIHtcbiAgICAkZWxlbWVudC5vZmYoJ2tleWRvd24uemYudHJhcGZvY3VzJyk7XG4gIH1cbn1cblxuLypcbiAqIENvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZy5cbiAqIENhbiBiZSB1c2VkIGxpa2UgRm91bmRhdGlvbi5wYXJzZUtleShldmVudCkgPT09IEZvdW5kYXRpb24ua2V5cy5TUEFDRVxuICovXG5mdW5jdGlvbiBnZXRLZXlDb2RlcyhrY3MpIHtcbiAgdmFyIGsgPSB7fTtcbiAgZm9yICh2YXIga2MgaW4ga2NzKSBrW2tjc1trY11dID0ga2NzW2tjXTtcbiAgcmV0dXJuIGs7XG59XG5cbkZvdW5kYXRpb24uS2V5Ym9hcmQgPSBLZXlib2FyZDtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vLyBEZWZhdWx0IHNldCBvZiBtZWRpYSBxdWVyaWVzXG5jb25zdCBkZWZhdWx0UXVlcmllcyA9IHtcbiAgJ2RlZmF1bHQnIDogJ29ubHkgc2NyZWVuJyxcbiAgbGFuZHNjYXBlIDogJ29ubHkgc2NyZWVuIGFuZCAob3JpZW50YXRpb246IGxhbmRzY2FwZSknLFxuICBwb3J0cmFpdCA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICByZXRpbmEgOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwnICtcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xufTtcblxudmFyIE1lZGlhUXVlcnkgPSB7XG4gIHF1ZXJpZXM6IFtdLFxuXG4gIGN1cnJlbnQ6ICcnLFxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbWVkaWEgcXVlcnkgaGVscGVyLCBieSBleHRyYWN0aW5nIHRoZSBicmVha3BvaW50IGxpc3QgZnJvbSB0aGUgQ1NTIGFuZCBhY3RpdmF0aW5nIHRoZSBicmVha3BvaW50IHdhdGNoZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBleHRyYWN0ZWRTdHlsZXMgPSAkKCcuZm91bmRhdGlvbi1tcScpLmNzcygnZm9udC1mYW1pbHknKTtcbiAgICB2YXIgbmFtZWRRdWVyaWVzO1xuXG4gICAgbmFtZWRRdWVyaWVzID0gcGFyc2VTdHlsZVRvT2JqZWN0KGV4dHJhY3RlZFN0eWxlcyk7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gbmFtZWRRdWVyaWVzKSB7XG4gICAgICBpZihuYW1lZFF1ZXJpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBzZWxmLnF1ZXJpZXMucHVzaCh7XG4gICAgICAgICAgbmFtZToga2V5LFxuICAgICAgICAgIHZhbHVlOiBgb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICR7bmFtZWRRdWVyaWVzW2tleV19KWBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jdXJyZW50ID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKTtcblxuICAgIHRoaXMuX3dhdGNoZXIoKTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzY3JlZW4gaXMgYXQgbGVhc3QgYXMgd2lkZSBhcyBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2suXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIGJyZWFrcG9pbnQgbWF0Y2hlcywgYGZhbHNlYCBpZiBpdCdzIHNtYWxsZXIuXG4gICAqL1xuICBhdExlYXN0KHNpemUpIHtcbiAgICB2YXIgcXVlcnkgPSB0aGlzLmdldChzaXplKTtcblxuICAgIGlmIChxdWVyeSkge1xuICAgICAgcmV0dXJuIHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5KS5tYXRjaGVzO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBzY3JlZW4gbWF0Y2hlcyB0byBhIGJyZWFrcG9pbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gY2hlY2ssIGVpdGhlciAnc21hbGwgb25seScgb3IgJ3NtYWxsJy4gT21pdHRpbmcgJ29ubHknIGZhbGxzIGJhY2sgdG8gdXNpbmcgYXRMZWFzdCgpIG1ldGhvZC5cbiAgICogQHJldHVybnMge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgYnJlYWtwb2ludCBtYXRjaGVzLCBgZmFsc2VgIGlmIGl0IGRvZXMgbm90LlxuICAgKi9cbiAgaXMoc2l6ZSkge1xuICAgIHNpemUgPSBzaXplLnRyaW0oKS5zcGxpdCgnICcpO1xuICAgIGlmKHNpemUubGVuZ3RoID4gMSAmJiBzaXplWzFdID09PSAnb25seScpIHtcbiAgICAgIGlmKHNpemVbMF0gPT09IHRoaXMuX2dldEN1cnJlbnRTaXplKCkpIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5hdExlYXN0KHNpemVbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBnZXQuXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxuICAgKi9cbiAgZ2V0KHNpemUpIHtcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucXVlcmllcykge1xuICAgICAgaWYodGhpcy5xdWVyaWVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcbiAgICAgICAgaWYgKHNpemUgPT09IHF1ZXJ5Lm5hbWUpIHJldHVybiBxdWVyeS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogR2V0cyB0aGUgY3VycmVudCBicmVha3BvaW50IG5hbWUgYnkgdGVzdGluZyBldmVyeSBicmVha3BvaW50IGFuZCByZXR1cm5pbmcgdGhlIGxhc3Qgb25lIHRvIG1hdGNoICh0aGUgYmlnZ2VzdCBvbmUpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHJldHVybnMge1N0cmluZ30gTmFtZSBvZiB0aGUgY3VycmVudCBicmVha3BvaW50LlxuICAgKi9cbiAgX2dldEN1cnJlbnRTaXplKCkge1xuICAgIHZhciBtYXRjaGVkO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcblxuICAgICAgaWYgKHdpbmRvdy5tYXRjaE1lZGlhKHF1ZXJ5LnZhbHVlKS5tYXRjaGVzKSB7XG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG1hdGNoZWQgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlcyB0aGUgYnJlYWtwb2ludCB3YXRjaGVyLCB3aGljaCBmaXJlcyBhbiBldmVudCBvbiB0aGUgd2luZG93IHdoZW5ldmVyIHRoZSBicmVha3BvaW50IGNoYW5nZXMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3dhdGNoZXIoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsICgpID0+IHtcbiAgICAgIHZhciBuZXdTaXplID0gdGhpcy5fZ2V0Q3VycmVudFNpemUoKSwgY3VycmVudFNpemUgPSB0aGlzLmN1cnJlbnQ7XG5cbiAgICAgIGlmIChuZXdTaXplICE9PSBjdXJyZW50U2l6ZSkge1xuICAgICAgICAvLyBDaGFuZ2UgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnlcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gbmV3U2l6ZTtcblxuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XG4gICAgICAgICQod2luZG93KS50cmlnZ2VyKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBbbmV3U2l6ZSwgY3VycmVudFNpemVdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxuLy8gQXV0aG9ycyAmIGNvcHlyaWdodCAoYykgMjAxMjogU2NvdHQgSmVobCwgUGF1bCBJcmlzaCwgTmljaG9sYXMgWmFrYXMsIERhdmlkIEtuaWdodC4gRHVhbCBNSVQvQlNEIGxpY2Vuc2VcbndpbmRvdy5tYXRjaE1lZGlhIHx8ICh3aW5kb3cubWF0Y2hNZWRpYSA9IGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRm9yIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBtYXRjaE1lZGl1bSBhcGkgc3VjaCBhcyBJRSA5IGFuZCB3ZWJraXRcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcblxuICAvLyBGb3IgdGhvc2UgdGhhdCBkb24ndCBzdXBwb3J0IG1hdGNoTWVkaXVtXG4gIGlmICghc3R5bGVNZWRpYSkge1xuICAgIHZhciBzdHlsZSAgID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKSxcbiAgICBzY3JpcHQgICAgICA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdzY3JpcHQnKVswXSxcbiAgICBpbmZvICAgICAgICA9IG51bGw7XG5cbiAgICBzdHlsZS50eXBlICA9ICd0ZXh0L2Nzcyc7XG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xuXG4gICAgc2NyaXB0ICYmIHNjcmlwdC5wYXJlbnROb2RlICYmIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcblxuICAgIC8vICdzdHlsZS5jdXJyZW50U3R5bGUnIGlzIHVzZWQgYnkgSUUgPD0gOCBhbmQgJ3dpbmRvdy5nZXRDb21wdXRlZFN0eWxlJyBmb3IgYWxsIG90aGVyIGJyb3dzZXJzXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xuXG4gICAgc3R5bGVNZWRpYSA9IHtcbiAgICAgIG1hdGNoTWVkaXVtKG1lZGlhKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gYEBtZWRpYSAke21lZGlhfXsgI21hdGNobWVkaWFqcy10ZXN0IHsgd2lkdGg6IDFweDsgfSB9YDtcblxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcbiAgICAgICAgaWYgKHN0eWxlLnN0eWxlU2hlZXQpIHtcbiAgICAgICAgICBzdHlsZS5zdHlsZVNoZWV0LmNzc1RleHQgPSB0ZXh0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gdGV4dDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRlc3QgaWYgbWVkaWEgcXVlcnkgaXMgdHJ1ZSBvciBmYWxzZVxuICAgICAgICByZXR1cm4gaW5mby53aWR0aCA9PT0gJzFweCc7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG1hdGNoZXM6IHN0eWxlTWVkaWEubWF0Y2hNZWRpdW0obWVkaWEgfHwgJ2FsbCcpLFxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXG4gICAgfTtcbiAgfVxufSgpKTtcblxuLy8gVGhhbmsgeW91OiBodHRwczovL2dpdGh1Yi5jb20vc2luZHJlc29yaHVzL3F1ZXJ5LXN0cmluZ1xuZnVuY3Rpb24gcGFyc2VTdHlsZVRvT2JqZWN0KHN0cikge1xuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcblxuICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XG4gIH1cblxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xuXG4gIGlmICghc3RyKSB7XG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xuICB9XG5cbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xuICAgIHZhciBwYXJ0cyA9IHBhcmFtLnJlcGxhY2UoL1xcKy9nLCAnICcpLnNwbGl0KCc9Jyk7XG4gICAgdmFyIGtleSA9IHBhcnRzWzBdO1xuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcbiAgICBrZXkgPSBkZWNvZGVVUklDb21wb25lbnQoa2V5KTtcblxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XG4gICAgLy8gaHR0cDovL3czLm9yZy9UUi8yMDEyL1dELXVybC0yMDEyMDUyNC8jY29sbGVjdC11cmwtcGFyYW1ldGVyc1xuICAgIHZhbCA9IHZhbCA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpO1xuXG4gICAgaWYgKCFyZXQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0W2tleV0gPSB2YWw7XG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xuICAgICAgcmV0W2tleV0ucHVzaCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSwge30pO1xuXG4gIHJldHVybiBzdHlsZU9iamVjdDtcbn1cblxuRm91bmRhdGlvbi5NZWRpYVF1ZXJ5ID0gTWVkaWFRdWVyeTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIE1vdGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubW90aW9uXG4gKi9cblxuY29uc3QgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xuY29uc3QgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbmNvbnN0IE1vdGlvbiA9IHtcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZSh0cnVlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfSxcblxuICBhbmltYXRlT3V0OiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gICAgYW5pbWF0ZShmYWxzZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XG4gIH1cbn1cblxuZnVuY3Rpb24gTW92ZShkdXJhdGlvbiwgZWxlbSwgZm4pe1xuICB2YXIgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsO1xuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XG5cbiAgaWYgKGR1cmF0aW9uID09PSAwKSB7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG4gICAgZWxlbS50cmlnZ2VyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKS50cmlnZ2VySGFuZGxlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZSh0cyl7XG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHRzO1xuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XG4gICAgcHJvZyA9IHRzIC0gc3RhcnQ7XG4gICAgZm4uYXBwbHkoZWxlbSk7XG5cbiAgICBpZihwcm9nIDwgZHVyYXRpb24peyBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlLCBlbGVtKTsgfVxuICAgIGVsc2V7XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XG4gICAgICBlbGVtLnRyaWdnZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pLnRyaWdnZXJIYW5kbGVyKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgW2VsZW1dKTtcbiAgICB9XG4gIH1cbiAgYW5pbSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobW92ZSk7XG59XG5cbi8qKlxuICogQW5pbWF0ZXMgYW4gZWxlbWVudCBpbiBvciBvdXQgdXNpbmcgYSBDU1MgdHJhbnNpdGlvbiBjbGFzcy5cbiAqIEBmdW5jdGlvblxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNJbiAtIERlZmluZXMgaWYgdGhlIGFuaW1hdGlvbiBpcyBpbiBvciBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvciBIVE1MIG9iamVjdCB0byBhbmltYXRlLlxuICogQHBhcmFtIHtTdHJpbmd9IGFuaW1hdGlvbiAtIENTUyBjbGFzcyB0byB1c2UuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIHRvIHJ1biB3aGVuIGFuaW1hdGlvbiBpcyBmaW5pc2hlZC5cbiAqL1xuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XG4gIHZhciBhY3RpdmVDbGFzcyA9IGlzSW4gPyBhY3RpdmVDbGFzc2VzWzBdIDogYWN0aXZlQ2xhc3Nlc1sxXTtcblxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxuICByZXNldCgpO1xuXG4gIGVsZW1lbnRcbiAgICAuYWRkQ2xhc3MoYW5pbWF0aW9uKVxuICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XG4gICAgZWxlbWVudFxuICAgICAgLmNzcygndHJhbnNpdGlvbicsICcnKVxuICAgICAgLmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZChlbGVtZW50KSwgZmluaXNoKTtcblxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICBpZiAoIWlzSW4pIGVsZW1lbnQuaGlkZSgpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcbiAgfVxuXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhgJHtpbml0Q2xhc3N9ICR7YWN0aXZlQ2xhc3N9ICR7YW5pbWF0aW9ufWApO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTW92ZSA9IE1vdmU7XG5Gb3VuZGF0aW9uLk1vdGlvbiA9IE1vdGlvbjtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG5jb25zdCBOZXN0ID0ge1xuICBGZWF0aGVyKG1lbnUsIHR5cGUgPSAnemYnKSB7XG4gICAgbWVudS5hdHRyKCdyb2xlJywgJ21lbnViYXInKTtcblxuICAgIHZhciBpdGVtcyA9IG1lbnUuZmluZCgnbGknKS5hdHRyKHsncm9sZSc6ICdtZW51aXRlbSd9KSxcbiAgICAgICAgc3ViTWVudUNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudWAsXG4gICAgICAgIHN1Ykl0ZW1DbGFzcyA9IGAke3N1Yk1lbnVDbGFzc30taXRlbWAsXG4gICAgICAgIGhhc1N1YkNsYXNzID0gYGlzLSR7dHlwZX0tc3VibWVudS1wYXJlbnRgO1xuXG4gICAgaXRlbXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuXG4gICAgICBpZiAoJHN1Yi5sZW5ndGgpIHtcbiAgICAgICAgJGl0ZW1cbiAgICAgICAgICAuYWRkQ2xhc3MoaGFzU3ViQ2xhc3MpXG4gICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxuICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIC8vIE5vdGU6ICBEcmlsbGRvd25zIGJlaGF2ZSBkaWZmZXJlbnRseSBpbiBob3cgdGhleSBoaWRlLCBhbmQgc28gbmVlZFxuICAgICAgICAgIC8vIGFkZGl0aW9uYWwgYXR0cmlidXRlcy4gIFdlIHNob3VsZCBsb29rIGlmIHRoaXMgcG9zc2libHkgb3Zlci1nZW5lcmFsaXplZFxuICAgICAgICAgIC8vIHV0aWxpdHkgKE5lc3QpIGlzIGFwcHJvcHJpYXRlIHdoZW4gd2UgcmV3b3JrIG1lbnVzIGluIDYuNFxuICAgICAgICAgIGlmKHR5cGUgPT09ICdkcmlsbGRvd24nKSB7XG4gICAgICAgICAgICAkaXRlbS5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IGZhbHNlfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICRzdWJcbiAgICAgICAgICAuYWRkQ2xhc3MoYHN1Ym1lbnUgJHtzdWJNZW51Q2xhc3N9YClcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xuICAgICAgICAgIH0pO1xuICAgICAgICBpZih0eXBlID09PSAnZHJpbGxkb3duJykge1xuICAgICAgICAgICRzdWIuYXR0cih7J2FyaWEtaGlkZGVuJzogdHJ1ZX0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgkaXRlbS5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XG4gICAgICAgICRpdGVtLmFkZENsYXNzKGBpcy1zdWJtZW51LWl0ZW0gJHtzdWJJdGVtQ2xhc3N9YCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm47XG4gIH0sXG5cbiAgQnVybihtZW51LCB0eXBlKSB7XG4gICAgdmFyIC8vaXRlbXMgPSBtZW51LmZpbmQoJ2xpJyksXG4gICAgICAgIHN1Yk1lbnVDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnVgLFxuICAgICAgICBzdWJJdGVtQ2xhc3MgPSBgJHtzdWJNZW51Q2xhc3N9LWl0ZW1gLFxuICAgICAgICBoYXNTdWJDbGFzcyA9IGBpcy0ke3R5cGV9LXN1Ym1lbnUtcGFyZW50YDtcblxuICAgIG1lbnVcbiAgICAgIC5maW5kKCc+bGksIC5tZW51LCAubWVudSA+IGxpJylcbiAgICAgIC5yZW1vdmVDbGFzcyhgJHtzdWJNZW51Q2xhc3N9ICR7c3ViSXRlbUNsYXNzfSAke2hhc1N1YkNsYXNzfSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudSBpcy1hY3RpdmVgKVxuICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpLmNzcygnZGlzcGxheScsICcnKTtcblxuICAgIC8vIGNvbnNvbGUubG9nKCAgICAgIG1lbnUuZmluZCgnLicgKyBzdWJNZW51Q2xhc3MgKyAnLCAuJyArIHN1Ykl0ZW1DbGFzcyArICcsIC5oYXMtc3VibWVudSwgLmlzLXN1Ym1lbnUtaXRlbSwgLnN1Ym1lbnUsIFtkYXRhLXN1Ym1lbnVdJylcbiAgICAvLyAgICAgICAgICAgLnJlbW92ZUNsYXNzKHN1Yk1lbnVDbGFzcyArICcgJyArIHN1Ykl0ZW1DbGFzcyArICcgaGFzLXN1Ym1lbnUgaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUnKVxuICAgIC8vICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykpO1xuICAgIC8vIGl0ZW1zLmVhY2goZnVuY3Rpb24oKXtcbiAgICAvLyAgIHZhciAkaXRlbSA9ICQodGhpcyksXG4gICAgLy8gICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xuICAgIC8vICAgaWYoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCl7XG4gICAgLy8gICAgICRpdGVtLnJlbW92ZUNsYXNzKCdpcy1zdWJtZW51LWl0ZW0gJyArIHN1Ykl0ZW1DbGFzcyk7XG4gICAgLy8gICB9XG4gICAgLy8gICBpZigkc3ViLmxlbmd0aCl7XG4gICAgLy8gICAgICRpdGVtLnJlbW92ZUNsYXNzKCdoYXMtc3VibWVudScpO1xuICAgIC8vICAgICAkc3ViLnJlbW92ZUNsYXNzKCdzdWJtZW51ICcgKyBzdWJNZW51Q2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpO1xuICAgIC8vICAgfVxuICAgIC8vIH0pO1xuICB9XG59XG5cbkZvdW5kYXRpb24uTmVzdCA9IE5lc3Q7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuZnVuY3Rpb24gVGltZXIoZWxlbSwgb3B0aW9ucywgY2IpIHtcbiAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgIGR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbiwvL29wdGlvbnMgaXMgYW4gb2JqZWN0IGZvciBlYXNpbHkgYWRkaW5nIGZlYXR1cmVzIGxhdGVyLlxuICAgICAgbmFtZVNwYWNlID0gT2JqZWN0LmtleXMoZWxlbS5kYXRhKCkpWzBdIHx8ICd0aW1lcicsXG4gICAgICByZW1haW4gPSAtMSxcbiAgICAgIHN0YXJ0LFxuICAgICAgdGltZXI7XG5cbiAgdGhpcy5pc1BhdXNlZCA9IGZhbHNlO1xuXG4gIHRoaXMucmVzdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHJlbWFpbiA9IC0xO1xuICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgdGhpcy5zdGFydCgpO1xuICB9XG5cbiAgdGhpcy5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSBmYWxzZTtcbiAgICAvLyBpZighZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIHJlbWFpbiA9IHJlbWFpbiA8PSAwID8gZHVyYXRpb24gOiByZW1haW47XG4gICAgZWxlbS5kYXRhKCdwYXVzZWQnLCBmYWxzZSk7XG4gICAgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgaWYob3B0aW9ucy5pbmZpbml0ZSl7XG4gICAgICAgIF90aGlzLnJlc3RhcnQoKTsvL3JlcnVuIHRoZSB0aW1lci5cbiAgICAgIH1cbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICAgIH0sIHJlbWFpbik7XG4gICAgZWxlbS50cmlnZ2VyKGB0aW1lcnN0YXJ0LnpmLiR7bmFtZVNwYWNlfWApO1xuICB9XG5cbiAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaXNQYXVzZWQgPSB0cnVlO1xuICAgIC8vaWYoZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cbiAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgIGVsZW0uZGF0YSgncGF1c2VkJywgdHJ1ZSk7XG4gICAgdmFyIGVuZCA9IERhdGUubm93KCk7XG4gICAgcmVtYWluID0gcmVtYWluIC0gKGVuZCAtIHN0YXJ0KTtcbiAgICBlbGVtLnRyaWdnZXIoYHRpbWVycGF1c2VkLnpmLiR7bmFtZVNwYWNlfWApO1xuICB9XG59XG5cbi8qKlxuICogUnVucyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gaW1hZ2VzIGFyZSBmdWxseSBsb2FkZWQuXG4gKiBAcGFyYW0ge09iamVjdH0gaW1hZ2VzIC0gSW1hZ2UocykgdG8gY2hlY2sgaWYgbG9hZGVkLlxuICogQHBhcmFtIHtGdW5jfSBjYWxsYmFjayAtIEZ1bmN0aW9uIHRvIGV4ZWN1dGUgd2hlbiBpbWFnZSBpcyBmdWxseSBsb2FkZWQuXG4gKi9cbmZ1bmN0aW9uIG9uSW1hZ2VzTG9hZGVkKGltYWdlcywgY2FsbGJhY2spe1xuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICB1bmxvYWRlZCA9IGltYWdlcy5sZW5ndGg7XG5cbiAgaWYgKHVubG9hZGVkID09PSAwKSB7XG4gICAgY2FsbGJhY2soKTtcbiAgfVxuXG4gIGltYWdlcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgIC8vIENoZWNrIGlmIGltYWdlIGlzIGxvYWRlZFxuICAgIGlmICh0aGlzLmNvbXBsZXRlIHx8ICh0aGlzLnJlYWR5U3RhdGUgPT09IDQpIHx8ICh0aGlzLnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpKSB7XG4gICAgICBzaW5nbGVJbWFnZUxvYWRlZCgpO1xuICAgIH1cbiAgICAvLyBGb3JjZSBsb2FkIHRoZSBpbWFnZVxuICAgIGVsc2Uge1xuICAgICAgLy8gZml4IGZvciBJRS4gU2VlIGh0dHBzOi8vY3NzLXRyaWNrcy5jb20vc25pcHBldHMvanF1ZXJ5L2ZpeGluZy1sb2FkLWluLWllLWZvci1jYWNoZWQtaW1hZ2VzL1xuICAgICAgdmFyIHNyYyA9ICQodGhpcykuYXR0cignc3JjJyk7XG4gICAgICAkKHRoaXMpLmF0dHIoJ3NyYycsIHNyYyArICc/JyArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSkpO1xuICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2luZ2xlSW1hZ2VMb2FkZWQoKSB7XG4gICAgdW5sb2FkZWQtLTtcbiAgICBpZiAodW5sb2FkZWQgPT09IDApIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbkZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcbkZvdW5kYXRpb24ub25JbWFnZXNMb2FkZWQgPSBvbkltYWdlc0xvYWRlZDtcblxufShqUXVlcnkpO1xuIiwiLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxuLy8qKkRvbmUgYnkgWW9oYWkgQXJhcmF0ICoqKioqKioqKioqKioqKioqKioqKioqKioqKlxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuKGZ1bmN0aW9uKCQpIHtcblxuICAkLnNwb3RTd2lwZSA9IHtcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxuICAgIGVuYWJsZWQ6ICdvbnRvdWNoc3RhcnQnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICBwcmV2ZW50RGVmYXVsdDogZmFsc2UsXG4gICAgbW92ZVRocmVzaG9sZDogNzUsXG4gICAgdGltZVRocmVzaG9sZDogMjAwXG4gIH07XG5cbiAgdmFyICAgc3RhcnRQb3NYLFxuICAgICAgICBzdGFydFBvc1ksXG4gICAgICAgIHN0YXJ0VGltZSxcbiAgICAgICAgZWxhcHNlZFRpbWUsXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gb25Ub3VjaEVuZCgpIHtcbiAgICAvLyAgYWxlcnQodGhpcyk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCBvblRvdWNoTW92ZSk7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uVG91Y2hFbmQpO1xuICAgIGlzTW92aW5nID0gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XG4gICAgaWYgKCQuc3BvdFN3aXBlLnByZXZlbnREZWZhdWx0KSB7IGUucHJldmVudERlZmF1bHQoKTsgfVxuICAgIGlmKGlzTW92aW5nKSB7XG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgIHZhciB5ID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgdmFyIGR4ID0gc3RhcnRQb3NYIC0geDtcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XG4gICAgICB2YXIgZGlyO1xuICAgICAgZWxhcHNlZFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZTtcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcbiAgICAgICAgZGlyID0gZHggPiAwID8gJ2xlZnQnIDogJ3JpZ2h0JztcbiAgICAgIH1cbiAgICAgIC8vIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xuICAgICAgLy8gICBkaXIgPSBkeSA+IDAgPyAnZG93bicgOiAndXAnO1xuICAgICAgLy8gfVxuICAgICAgaWYoZGlyKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIoJ3N3aXBlJywgZGlyKS50cmlnZ2VyKGBzd2lwZSR7ZGlyfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XG4gICAgaWYgKGUudG91Y2hlcy5sZW5ndGggPT0gMSkge1xuICAgICAgc3RhcnRQb3NYID0gZS50b3VjaGVzWzBdLnBhZ2VYO1xuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xuICAgICAgaXNNb3ZpbmcgPSB0cnVlO1xuICAgICAgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgb25Ub3VjaEVuZCwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XG4gICAgdGhpcy5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Ub3VjaFN0YXJ0KTtcbiAgfVxuXG4gICQuZXZlbnQuc3BlY2lhbC5zd2lwZSA9IHsgc2V0dXA6IGluaXQgfTtcblxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xuICAgICQuZXZlbnQuc3BlY2lhbFtgc3dpcGUke3RoaXN9YF0gPSB7IHNldHVwOiBmdW5jdGlvbigpe1xuICAgICAgJCh0aGlzKS5vbignc3dpcGUnLCAkLm5vb3ApO1xuICAgIH0gfTtcbiAgfSk7XG59KShqUXVlcnkpO1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAqIE1ldGhvZCBmb3IgYWRkaW5nIHBzdWVkbyBkcmFnIGV2ZW50cyB0byBlbGVtZW50cyAqXG4gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuIWZ1bmN0aW9uKCQpe1xuICAkLmZuLmFkZFRvdWNoID0gZnVuY3Rpb24oKXtcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oaSxlbCl7XG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcbiAgICAgICAgLy93ZSBwYXNzIHRoZSBvcmlnaW5hbCBldmVudCBvYmplY3QgYmVjYXVzZSB0aGUgalF1ZXJ5IGV2ZW50XG4gICAgICAgIC8vb2JqZWN0IGlzIG5vcm1hbGl6ZWQgdG8gdzNjIHNwZWNzIGFuZCBkb2VzIG5vdCBwcm92aWRlIHRoZSBUb3VjaExpc3RcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGFuZGxlVG91Y2ggPSBmdW5jdGlvbihldmVudCl7XG4gICAgICB2YXIgdG91Y2hlcyA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzLFxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcbiAgICAgICAgICBldmVudFR5cGVzID0ge1xuICAgICAgICAgICAgdG91Y2hzdGFydDogJ21vdXNlZG93bicsXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxuICAgICAgICAgICAgdG91Y2hlbmQ6ICdtb3VzZXVwJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV0sXG4gICAgICAgICAgc2ltdWxhdGVkRXZlbnRcbiAgICAgICAgO1xuXG4gICAgICBpZignTW91c2VFdmVudCcgaW4gd2luZG93ICYmIHR5cGVvZiB3aW5kb3cuTW91c2VFdmVudCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IG5ldyB3aW5kb3cuTW91c2VFdmVudCh0eXBlLCB7XG4gICAgICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgICAgICdjYW5jZWxhYmxlJzogdHJ1ZSxcbiAgICAgICAgICAnc2NyZWVuWCc6IGZpcnN0LnNjcmVlblgsXG4gICAgICAgICAgJ3NjcmVlblknOiBmaXJzdC5zY3JlZW5ZLFxuICAgICAgICAgICdjbGllbnRYJzogZmlyc3QuY2xpZW50WCxcbiAgICAgICAgICAnY2xpZW50WSc6IGZpcnN0LmNsaWVudFlcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzaW11bGF0ZWRFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50Jyk7XG4gICAgICAgIHNpbXVsYXRlZEV2ZW50LmluaXRNb3VzZUV2ZW50KHR5cGUsIHRydWUsIHRydWUsIHdpbmRvdywgMSwgZmlyc3Quc2NyZWVuWCwgZmlyc3Quc2NyZWVuWSwgZmlyc3QuY2xpZW50WCwgZmlyc3QuY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAvKmxlZnQqLywgbnVsbCk7XG4gICAgICB9XG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XG4gICAgfTtcbiAgfTtcbn0oalF1ZXJ5KTtcblxuXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbi8vKipGcm9tIHRoZSBqUXVlcnkgTW9iaWxlIExpYnJhcnkqKlxuLy8qKm5lZWQgdG8gcmVjcmVhdGUgZnVuY3Rpb25hbGl0eSoqXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xuXG5cdHZhciAkZG9jdW1lbnQgPSAkKCBkb2N1bWVudCApLFxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXG5cdFx0dG91Y2hTdGFydEV2ZW50ID0gJ3RvdWNoc3RhcnQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoc3RhcnRcIiA6IFwibW91c2Vkb3duXCIsXG5cdFx0dG91Y2hTdG9wRXZlbnQgPSAndG91Y2hlbmQnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNoZW5kXCIgOiBcIm1vdXNldXBcIixcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcblxuXHQvLyBzZXR1cCBuZXcgZXZlbnQgc2hvcnRjdXRzXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcblx0XHRcInN3aXBlIHN3aXBlbGVmdCBzd2lwZXJpZ2h0XCIgKS5zcGxpdCggXCIgXCIgKSwgZnVuY3Rpb24oIGksIG5hbWUgKSB7XG5cblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XG5cdFx0XHRyZXR1cm4gZm4gPyB0aGlzLmJpbmQoIG5hbWUsIGZuICkgOiB0aGlzLnRyaWdnZXIoIG5hbWUgKTtcblx0XHR9O1xuXG5cdFx0Ly8galF1ZXJ5IDwgMS44XG5cdFx0aWYgKCAkLmF0dHJGbiApIHtcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xuXHRcdH1cblx0fSk7XG5cblx0ZnVuY3Rpb24gdHJpZ2dlckN1c3RvbUV2ZW50KCBvYmosIGV2ZW50VHlwZSwgZXZlbnQsIGJ1YmJsZSApIHtcblx0XHR2YXIgb3JpZ2luYWxUeXBlID0gZXZlbnQudHlwZTtcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xuXHRcdGlmICggYnViYmxlICkge1xuXHRcdFx0JC5ldmVudC50cmlnZ2VyKCBldmVudCwgdW5kZWZpbmVkLCBvYmogKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0JC5ldmVudC5kaXNwYXRjaC5jYWxsKCBvYmosIGV2ZW50ICk7XG5cdFx0fVxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XG5cdH1cblxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxuXG5cdC8vIEFsc28gaGFuZGxlcyBzd2lwZWxlZnQsIHN3aXBlcmlnaHRcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xuXG5cdFx0Ly8gTW9yZSB0aGFuIHRoaXMgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQsIGFuZCB3ZSB3aWxsIHN1cHByZXNzIHNjcm9sbGluZy5cblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcblxuXHRcdC8vIE1vcmUgdGltZSB0aGFuIHRoaXMsIGFuZCBpdCBpc24ndCBhIHN3aXBlLlxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxuXG5cdFx0Ly8gU3dpcGUgaG9yaXpvbnRhbCBkaXNwbGFjZW1lbnQgbXVzdCBiZSBtb3JlIHRoYW4gdGhpcy5cblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxuXG5cdFx0Ly8gU3dpcGUgdmVydGljYWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbGVzcyB0aGFuIHRoaXMuXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXG5cblx0XHRnZXRMb2NhdGlvbjogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcblx0XHRcdFx0d2luUGFnZVkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXG5cdFx0XHRcdHggPSBldmVudC5jbGllbnRYLFxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcblxuXHRcdFx0aWYgKCBldmVudC5wYWdlWSA9PT0gMCAmJiBNYXRoLmZsb29yKCB5ICkgPiBNYXRoLmZsb29yKCBldmVudC5wYWdlWSApIHx8XG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gaU9TNCBjbGllbnRYL2NsaWVudFkgaGF2ZSB0aGUgdmFsdWUgdGhhdCBzaG91bGQgaGF2ZSBiZWVuXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXG5cdFx0XHRcdHggPSB4IC0gd2luUGFnZVg7XG5cdFx0XHRcdHkgPSB5IC0gd2luUGFnZVk7XG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XG5cblx0XHRcdFx0Ly8gU29tZSBBbmRyb2lkIGJyb3dzZXJzIGhhdmUgdG90YWxseSBib2d1cyB2YWx1ZXMgZm9yIGNsaWVudFgvWVxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcblx0XHRcdFx0Ly8gc2hvdWxkIG5ldmVyIGJlIHNtYWxsZXIgdGhhbiBwYWdlWC9wYWdlWSBtaW51cyBwYWdlIHNjcm9sbFxuXHRcdFx0XHR4ID0gZXZlbnQucGFnZVggLSB3aW5QYWdlWDtcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IHgsXG5cdFx0XHRcdHk6IHlcblx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHR2YXIgZGF0YSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlcyA/XG5cdFx0XHRcdFx0ZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzWyAwIF0gOiBldmVudCxcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHR0aW1lOiAoIG5ldyBEYXRlKCkgKS5nZXRUaW1lKCksXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxuXHRcdFx0XHRcdFx0b3JpZ2luOiAkKCBldmVudC50YXJnZXQgKVxuXHRcdFx0XHRcdH07XG5cdFx0fSxcblxuXHRcdHN0b3A6IGZ1bmN0aW9uKCBldmVudCApIHtcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cblx0XHRcdFx0XHRldmVudC5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbIDAgXSA6IGV2ZW50LFxuXHRcdFx0XHRsb2NhdGlvbiA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5nZXRMb2NhdGlvbiggZGF0YSApO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdHRpbWU6ICggbmV3IERhdGUoKSApLmdldFRpbWUoKSxcblx0XHRcdFx0XHRcdGNvb3JkczogWyBsb2NhdGlvbi54LCBsb2NhdGlvbi55IF1cblx0XHRcdFx0XHR9O1xuXHRcdH0sXG5cblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xuXHRcdFx0aWYgKCBzdG9wLnRpbWUgLSBzdGFydC50aW1lIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLmR1cmF0aW9uVGhyZXNob2xkICYmXG5cdFx0XHRcdE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5ob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQgJiZcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XG5cdFx0XHRcdHZhciBkaXJlY3Rpb24gPSBzdGFydC5jb29yZHNbMF0gPiBzdG9wLmNvb3Jkc1sgMCBdID8gXCJzd2lwZWxlZnRcIiA6IFwic3dpcGVyaWdodFwiO1xuXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgZGlyZWN0aW9uLCQuRXZlbnQoIGRpcmVjdGlvbiwgeyB0YXJnZXQ6IG9yaWdUYXJnZXQsIHN3aXBlc3RhcnQ6IHN0YXJ0LCBzd2lwZXN0b3A6IHN0b3AgfSApLCB0cnVlICk7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0fSxcblxuXHRcdC8vIFRoaXMgc2VydmVzIGFzIGEgZmxhZyB0byBlbnN1cmUgdGhhdCBhdCBtb3N0IG9uZSBzd2lwZSBldmVudCBldmVudCBpc1xuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcblx0XHRldmVudEluUHJvZ3Jlc3M6IGZhbHNlLFxuXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGV2ZW50cyxcblx0XHRcdFx0dGhpc09iamVjdCA9IHRoaXMsXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxuXHRcdFx0XHRjb250ZXh0ID0ge307XG5cblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggIWV2ZW50cyApIHtcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcblx0XHRcdFx0JC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiwgZXZlbnRzICk7XG5cdFx0XHR9XG5cdFx0XHRldmVudHMubGVuZ3RoKys7XG5cdFx0XHRldmVudHMuc3dpcGUgPSBjb250ZXh0O1xuXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xuXG5cdFx0XHRcdC8vIEJhaWwgaWYgd2UncmUgYWxyZWFkeSB3b3JraW5nIG9uIGEgc3dpcGUgZXZlbnRcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcblxuXHRcdFx0XHR2YXIgc3RvcCxcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcblx0XHRcdFx0XHRvcmlnVGFyZ2V0ID0gZXZlbnQudGFyZ2V0LFxuXHRcdFx0XHRcdGVtaXR0ZWQgPSBmYWxzZTtcblxuXHRcdFx0XHRjb250ZXh0Lm1vdmUgPSBmdW5jdGlvbiggZXZlbnQgKSB7XG5cdFx0XHRcdFx0aWYgKCAhc3RhcnQgfHwgZXZlbnQuaXNEZWZhdWx0UHJldmVudGVkKCkgKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xuXHRcdFx0XHRcdGlmICggIWVtaXR0ZWQgKSB7XG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gJC5ldmVudC5zcGVjaWFsLnN3aXBlLmhhbmRsZVN3aXBlKCBzdGFydCwgc3RvcCwgdGhpc09iamVjdCwgb3JpZ1RhcmdldCApO1xuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xuXG5cdFx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXG5cdFx0XHRcdFx0aWYgKCBNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuc2Nyb2xsU3VwcmVzc2lvblRocmVzaG9sZCApIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9IHRydWU7XG5cblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxuXHRcdFx0XHRcdFx0JC5ldmVudC5zcGVjaWFsLnN3aXBlLmV2ZW50SW5Qcm9ncmVzcyA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxuXHRcdFx0XHRcdC5vbmUoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdH07XG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0fSxcblxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBldmVudHMsIGNvbnRleHQ7XG5cblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcblx0XHRcdGlmICggZXZlbnRzICkge1xuXHRcdFx0XHRjb250ZXh0ID0gZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xuXHRcdFx0XHRldmVudHMubGVuZ3RoLS07XG5cdFx0XHRcdGlmICggZXZlbnRzLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKCBjb250ZXh0ICkge1xuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RhcnQgKSB7XG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCBjb250ZXh0Lm1vdmUgKSB7XG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICggY29udGV4dC5zdG9wICkge1xuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0JC5lYWNoKHtcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxuXHRcdHN3aXBlcmlnaHQ6IFwic3dpcGUucmlnaHRcIlxuXHR9LCBmdW5jdGlvbiggZXZlbnQsIHNvdXJjZUV2ZW50ICkge1xuXG5cdFx0JC5ldmVudC5zcGVjaWFsWyBldmVudCBdID0ge1xuXHRcdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xuXHRcdFx0fSxcblx0XHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcblx0XHRcdH1cblx0XHR9O1xuXHR9KTtcbn0pKCBqUXVlcnksIHRoaXMgKTtcbiovXG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbmNvbnN0IE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcbiAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoYCR7cHJlZml4ZXNbaV19TXV0YXRpb25PYnNlcnZlcmAgaW4gd2luZG93KSB7XG4gICAgICByZXR1cm4gd2luZG93W2Ake3ByZWZpeGVzW2ldfU11dGF0aW9uT2JzZXJ2ZXJgXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufSgpKTtcblxuY29uc3QgdHJpZ2dlcnMgPSAoZWwsIHR5cGUpID0+IHtcbiAgZWwuZGF0YSh0eXBlKS5zcGxpdCgnICcpLmZvckVhY2goaWQgPT4ge1xuICAgICQoYCMke2lkfWApWyB0eXBlID09PSAnY2xvc2UnID8gJ3RyaWdnZXInIDogJ3RyaWdnZXJIYW5kbGVyJ10oYCR7dHlwZX0uemYudHJpZ2dlcmAsIFtlbF0pO1xuICB9KTtcbn07XG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtb3Blbl0nLCBmdW5jdGlvbigpIHtcbiAgdHJpZ2dlcnMoJCh0aGlzKSwgJ29wZW4nKTtcbn0pO1xuXG4vLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuLy8gSWYgdXNlZCB3aXRob3V0IGEgdmFsdWUgb24gW2RhdGEtY2xvc2VdLCB0aGUgZXZlbnQgd2lsbCBidWJibGUsIGFsbG93aW5nIGl0IHRvIGNsb3NlIGEgcGFyZW50IGNvbXBvbmVudC5cbiQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLWNsb3NlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XG4gIGlmIChpZCkge1xuICAgIHRyaWdnZXJzKCQodGhpcyksICdjbG9zZScpO1xuICB9XG4gIGVsc2Uge1xuICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS10b2dnbGVdIHdpbGwgdG9nZ2xlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxuJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZScpO1xuICBpZiAoaWQpIHtcbiAgICB0cmlnZ2VycygkKHRoaXMpLCAndG9nZ2xlJyk7XG4gIH0gZWxzZSB7XG4gICAgJCh0aGlzKS50cmlnZ2VyKCd0b2dnbGUuemYudHJpZ2dlcicpO1xuICB9XG59KTtcblxuLy8gRWxlbWVudHMgd2l0aCBbZGF0YS1jbG9zYWJsZV0gd2lsbCByZXNwb25kIHRvIGNsb3NlLnpmLnRyaWdnZXIgZXZlbnRzLlxuJChkb2N1bWVudCkub24oJ2Nsb3NlLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2FibGVdJywgZnVuY3Rpb24oZSl7XG4gIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGxldCBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJyk7XG5cbiAgaWYoYW5pbWF0aW9uICE9PSAnJyl7XG4gICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgJCh0aGlzKS50cmlnZ2VyKCdjbG9zZWQuemYnKTtcbiAgICB9KTtcbiAgfWVsc2V7XG4gICAgJCh0aGlzKS5mYWRlT3V0KCkudHJpZ2dlcignY2xvc2VkLnpmJyk7XG4gIH1cbn0pO1xuXG4kKGRvY3VtZW50KS5vbignZm9jdXMuemYudHJpZ2dlciBibHVyLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlLWZvY3VzXScsIGZ1bmN0aW9uKCkge1xuICBsZXQgaWQgPSAkKHRoaXMpLmRhdGEoJ3RvZ2dsZS1mb2N1cycpO1xuICAkKGAjJHtpZH1gKS50cmlnZ2VySGFuZGxlcigndG9nZ2xlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xufSk7XG5cbi8qKlxuKiBGaXJlcyBvbmNlIGFmdGVyIGFsbCBvdGhlciBzY3JpcHRzIGhhdmUgbG9hZGVkXG4qIEBmdW5jdGlvblxuKiBAcHJpdmF0ZVxuKi9cbiQod2luZG93KS5vbignbG9hZCcsICgpID0+IHtcbiAgY2hlY2tMaXN0ZW5lcnMoKTtcbn0pO1xuXG5mdW5jdGlvbiBjaGVja0xpc3RlbmVycygpIHtcbiAgZXZlbnRzTGlzdGVuZXIoKTtcbiAgcmVzaXplTGlzdGVuZXIoKTtcbiAgc2Nyb2xsTGlzdGVuZXIoKTtcbiAgbXV0YXRlTGlzdGVuZXIoKTtcbiAgY2xvc2VtZUxpc3RlbmVyKCk7XG59XG5cbi8vKioqKioqKiogb25seSBmaXJlcyB0aGlzIGZ1bmN0aW9uIG9uY2Ugb24gbG9hZCwgaWYgdGhlcmUncyBzb21ldGhpbmcgdG8gd2F0Y2ggKioqKioqKipcbmZ1bmN0aW9uIGNsb3NlbWVMaXN0ZW5lcihwbHVnaW5OYW1lKSB7XG4gIHZhciB5ZXRpQm94ZXMgPSAkKCdbZGF0YS15ZXRpLWJveF0nKSxcbiAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcblxuICBpZihwbHVnaW5OYW1lKXtcbiAgICBpZih0eXBlb2YgcGx1Z2luTmFtZSA9PT0gJ3N0cmluZycpe1xuICAgICAgcGx1Z05hbWVzLnB1c2gocGx1Z2luTmFtZSk7XG4gICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XG4gICAgICBwbHVnTmFtZXMuY29uY2F0KHBsdWdpbk5hbWUpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgfVxuICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcbiAgICBsZXQgbGlzdGVuZXJzID0gcGx1Z05hbWVzLm1hcCgobmFtZSkgPT4ge1xuICAgICAgcmV0dXJuIGBjbG9zZW1lLnpmLiR7bmFtZX1gO1xuICAgIH0pLmpvaW4oJyAnKTtcblxuICAgICQod2luZG93KS5vZmYobGlzdGVuZXJzKS5vbihsaXN0ZW5lcnMsIGZ1bmN0aW9uKGUsIHBsdWdpbklkKXtcbiAgICAgIGxldCBwbHVnaW4gPSBlLm5hbWVzcGFjZS5zcGxpdCgnLicpWzBdO1xuICAgICAgbGV0IHBsdWdpbnMgPSAkKGBbZGF0YS0ke3BsdWdpbn1dYCkubm90KGBbZGF0YS15ZXRpLWJveD1cIiR7cGx1Z2luSWR9XCJdYCk7XG5cbiAgICAgIHBsdWdpbnMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBsZXQgX3RoaXMgPSAkKHRoaXMpO1xuXG4gICAgICAgIF90aGlzLnRyaWdnZXJIYW5kbGVyKCdjbG9zZS56Zi50cmlnZ2VyJywgW190aGlzXSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNpemVMaXN0ZW5lcihkZWJvdW5jZSl7XG4gIGxldCB0aW1lcixcbiAgICAgICRub2RlcyA9ICQoJ1tkYXRhLXJlc2l6ZV0nKTtcbiAgaWYoJG5vZGVzLmxlbmd0aCl7XG4gICAgJCh3aW5kb3cpLm9mZigncmVzaXplLnpmLnRyaWdnZXInKVxuICAgIC5vbigncmVzaXplLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuXG4gICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxuICAgICAgICAgICRub2Rlcy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkKHRoaXMpLnRyaWdnZXJIYW5kbGVyKCdyZXNpemVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIHJlc2l6ZSBldmVudFxuICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcbiAgICAgIH0sIGRlYm91bmNlIHx8IDEwKTsvL2RlZmF1bHQgdGltZSB0byBlbWl0IHJlc2l6ZSBldmVudFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNjcm9sbExpc3RlbmVyKGRlYm91bmNlKXtcbiAgbGV0IHRpbWVyLFxuICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICBpZigkbm9kZXMubGVuZ3RoKXtcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYudHJpZ2dlcicpXG4gICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xuICAgICAgaWYodGltZXIpeyBjbGVhclRpbWVvdXQodGltZXIpOyB9XG5cbiAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXG4gICAgICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsvL2ZhbGxiYWNrIGZvciBJRSA5XG4gICAgICAgICAgJG5vZGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XG4gICAgICAgICRub2Rlcy5hdHRyKCdkYXRhLWV2ZW50cycsIFwic2Nyb2xsXCIpO1xuICAgICAgfSwgZGVib3VuY2UgfHwgMTApOy8vZGVmYXVsdCB0aW1lIHRvIGVtaXQgc2Nyb2xsIGV2ZW50XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbXV0YXRlTGlzdGVuZXIoZGVib3VuY2UpIHtcbiAgICBsZXQgJG5vZGVzID0gJCgnW2RhdGEtbXV0YXRlXScpO1xuICAgIGlmICgkbm9kZXMubGVuZ3RoICYmIE11dGF0aW9uT2JzZXJ2ZXIpe1xuXHRcdFx0Ly90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0ZSBldmVudFxuICAgICAgLy9ubyBJRSA5IG9yIDEwXG5cdFx0XHQkbm9kZXMuZWFjaChmdW5jdGlvbiAoKSB7XG5cdFx0XHQgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcblx0XHRcdH0pO1xuICAgIH1cbiB9XG5cbmZ1bmN0aW9uIGV2ZW50c0xpc3RlbmVyKCkge1xuICBpZighTXV0YXRpb25PYnNlcnZlcil7IHJldHVybiBmYWxzZTsgfVxuICBsZXQgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZXNpemVdLCBbZGF0YS1zY3JvbGxdLCBbZGF0YS1tdXRhdGVdJyk7XG5cbiAgLy9lbGVtZW50IGNhbGxiYWNrXG4gIHZhciBsaXN0ZW5pbmdFbGVtZW50c011dGF0aW9uID0gZnVuY3Rpb24gKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcbiAgICAgIHZhciAkdGFyZ2V0ID0gJChtdXRhdGlvblJlY29yZHNMaXN0WzBdLnRhcmdldCk7XG5cblx0ICAvL3RyaWdnZXIgdGhlIGV2ZW50IGhhbmRsZXIgZm9yIHRoZSBlbGVtZW50IGRlcGVuZGluZyBvbiB0eXBlXG4gICAgICBzd2l0Y2ggKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udHlwZSkge1xuXG4gICAgICAgIGNhc2UgXCJhdHRyaWJ1dGVzXCI6XG4gICAgICAgICAgaWYgKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpID09PSBcInNjcm9sbFwiICYmIG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJkYXRhLWV2ZW50c1wiKSB7XG5cdFx0ICBcdCR0YXJnZXQudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInLCBbJHRhcmdldCwgd2luZG93LnBhZ2VZT2Zmc2V0XSk7XG5cdFx0ICB9XG5cdFx0ICBpZiAoJHRhcmdldC5hdHRyKFwiZGF0YS1ldmVudHNcIikgPT09IFwicmVzaXplXCIgJiYgbXV0YXRpb25SZWNvcmRzTGlzdFswXS5hdHRyaWJ1dGVOYW1lID09PSBcImRhdGEtZXZlbnRzXCIpIHtcblx0XHQgIFx0JHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XG5cdFx0ICAgfVxuXHRcdCAgaWYgKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0uYXR0cmlidXRlTmFtZSA9PT0gXCJzdHlsZVwiKSB7XG5cdFx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikuYXR0cihcImRhdGEtZXZlbnRzXCIsXCJtdXRhdGVcIik7XG5cdFx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKV0pO1xuXHRcdCAgfVxuXHRcdCAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcImNoaWxkTGlzdFwiOlxuXHRcdCAgJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKS5hdHRyKFwiZGF0YS1ldmVudHNcIixcIm11dGF0ZVwiKTtcblx0XHQgICR0YXJnZXQuY2xvc2VzdChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlckhhbmRsZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInLCBbJHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtbXV0YXRlXVwiKV0pO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAvL25vdGhpbmdcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuICAgICAgLy9mb3IgZWFjaCBlbGVtZW50IHRoYXQgbmVlZHMgdG8gbGlzdGVuIGZvciByZXNpemluZywgc2Nyb2xsaW5nLCBvciBtdXRhdGlvbiBhZGQgYSBzaW5nbGUgb2JzZXJ2ZXJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICB2YXIgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XG4gICAgICAgIGVsZW1lbnRPYnNlcnZlci5vYnNlcnZlKG5vZGVzW2ldLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUsIGF0dHJpYnV0ZUZpbHRlcjogW1wiZGF0YS1ldmVudHNcIiwgXCJzdHlsZVwiXSB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFtQSF1cbi8vIEZvdW5kYXRpb24uQ2hlY2tXYXRjaGVycyA9IGNoZWNrV2F0Y2hlcnM7XG5Gb3VuZGF0aW9uLklIZWFyWW91ID0gY2hlY2tMaXN0ZW5lcnM7XG4vLyBGb3VuZGF0aW9uLklTZWVZb3UgPSBzY3JvbGxMaXN0ZW5lcjtcbi8vIEZvdW5kYXRpb24uSUZlZWxZb3UgPSBjbG9zZW1lTGlzdGVuZXI7XG5cbn0oalF1ZXJ5KTtcblxuLy8gZnVuY3Rpb24gZG9tTXV0YXRpb25PYnNlcnZlcihkZWJvdW5jZSkge1xuLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cbi8vICAgdmFyIHRpbWVyLFxuLy8gICBub2RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ1tkYXRhLW11dGF0ZV0nKTtcbi8vICAgLy9cbi8vICAgaWYgKG5vZGVzLmxlbmd0aCkge1xuLy8gICAgIC8vIHZhciBNdXRhdGlvbk9ic2VydmVyID0gKGZ1bmN0aW9uICgpIHtcbi8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xuLy8gICAgIC8vICAgZm9yICh2YXIgaT0wOyBpIDwgcHJlZml4ZXMubGVuZ3RoOyBpKyspIHtcbi8vICAgICAvLyAgICAgaWYgKHByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInIGluIHdpbmRvdykge1xuLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xuLy8gICAgIC8vICAgICB9XG4vLyAgICAgLy8gICB9XG4vLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XG4vLyAgICAgLy8gfSgpKTtcbi8vXG4vL1xuLy8gICAgIC8vZm9yIHRoZSBib2R5LCB3ZSBuZWVkIHRvIGxpc3RlbiBmb3IgYWxsIGNoYW5nZXMgZWZmZWN0aW5nIHRoZSBzdHlsZSBhbmQgY2xhc3MgYXR0cmlidXRlc1xuLy8gICAgIHZhciBib2R5T2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihib2R5TXV0YXRpb24pO1xuLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xuLy9cbi8vXG4vLyAgICAgLy9ib2R5IGNhbGxiYWNrXG4vLyAgICAgZnVuY3Rpb24gYm9keU11dGF0aW9uKG11dGF0ZSkge1xuLy8gICAgICAgLy90cmlnZ2VyIGFsbCBsaXN0ZW5pbmcgZWxlbWVudHMgYW5kIHNpZ25hbCBhIG11dGF0aW9uIGV2ZW50XG4vLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxuLy9cbi8vICAgICAgIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbi8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbi8vICAgICAgICAgJCgnW2RhdGEtbXV0YXRlXScpLmF0dHIoJ2RhdGEtZXZlbnRzJyxcIm11dGF0ZVwiKTtcbi8vICAgICAgIH0sIGRlYm91bmNlIHx8IDE1MCk7XG4vLyAgICAgfVxuLy8gICB9XG4vLyB9XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogQWJpZGUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFiaWRlXG4gKi9cblxuY2xhc3MgQWJpZGUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBBYmlkZS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBBYmlkZSNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgQWJpZGUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FiaWRlJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEFiaWRlIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBBYmlkZSBmdW5jdGlvbmluZyBvbiBsb2FkLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy4kaW5wdXRzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbnB1dCwgdGV4dGFyZWEsIHNlbGVjdCcpO1xuXG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBBYmlkZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy5hYmlkZScpXG4gICAgICAub24oJ3Jlc2V0LnpmLmFiaWRlJywgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlc2V0Rm9ybSgpO1xuICAgICAgfSlcbiAgICAgIC5vbignc3VibWl0LnpmLmFiaWRlJywgKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZUZvcm0oKTtcbiAgICAgIH0pO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy52YWxpZGF0ZU9uID09PSAnZmllbGRDaGFuZ2UnKSB7XG4gICAgICB0aGlzLiRpbnB1dHNcbiAgICAgICAgLm9mZignY2hhbmdlLnpmLmFiaWRlJylcbiAgICAgICAgLm9uKCdjaGFuZ2UuemYuYWJpZGUnLCAoZSkgPT4ge1xuICAgICAgICAgIHRoaXMudmFsaWRhdGVJbnB1dCgkKGUudGFyZ2V0KSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMubGl2ZVZhbGlkYXRlKSB7XG4gICAgICB0aGlzLiRpbnB1dHNcbiAgICAgICAgLm9mZignaW5wdXQuemYuYWJpZGUnKVxuICAgICAgICAub24oJ2lucHV0LnpmLmFiaWRlJywgKGUpID0+IHtcbiAgICAgICAgICB0aGlzLnZhbGlkYXRlSW5wdXQoJChlLnRhcmdldCkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnZhbGlkYXRlT25CbHVyKSB7XG4gICAgICB0aGlzLiRpbnB1dHNcbiAgICAgICAgLm9mZignYmx1ci56Zi5hYmlkZScpXG4gICAgICAgIC5vbignYmx1ci56Zi5hYmlkZScsIChlKSA9PiB7XG4gICAgICAgICAgdGhpcy52YWxpZGF0ZUlucHV0KCQoZS50YXJnZXQpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIEFiaWRlIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICB0aGlzLl9pbml0KCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IGEgZm9ybSBlbGVtZW50IGhhcyB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGFuZCBpZiBpdCdzIGNoZWNrZWQgb3Igbm90XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcbiAgICovXG4gIHJlcXVpcmVkQ2hlY2soJGVsKSB7XG4gICAgaWYgKCEkZWwuYXR0cigncmVxdWlyZWQnKSkgcmV0dXJuIHRydWU7XG5cbiAgICB2YXIgaXNHb29kID0gdHJ1ZTtcblxuICAgIHN3aXRjaCAoJGVsWzBdLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgaXNHb29kID0gJGVsWzBdLmNoZWNrZWQ7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgY2FzZSAnc2VsZWN0LW9uZSc6XG4gICAgICBjYXNlICdzZWxlY3QtbXVsdGlwbGUnOlxuICAgICAgICB2YXIgb3B0ID0gJGVsLmZpbmQoJ29wdGlvbjpzZWxlY3RlZCcpO1xuICAgICAgICBpZiAoIW9wdC5sZW5ndGggfHwgIW9wdC52YWwoKSkgaXNHb29kID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZighJGVsLnZhbCgpIHx8ICEkZWwudmFsKCkubGVuZ3RoKSBpc0dvb2QgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gaXNHb29kO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhc2VkIG9uICRlbCwgZ2V0IHRoZSBmaXJzdCBlbGVtZW50IHdpdGggc2VsZWN0b3IgaW4gdGhpcyBvcmRlcjpcbiAgICogMS4gVGhlIGVsZW1lbnQncyBkaXJlY3Qgc2libGluZygncykuXG4gICAqIDMuIFRoZSBlbGVtZW50J3MgcGFyZW50J3MgY2hpbGRyZW4uXG4gICAqXG4gICAqIFRoaXMgYWxsb3dzIGZvciBtdWx0aXBsZSBmb3JtIGVycm9ycyBwZXIgaW5wdXQsIHRob3VnaCBpZiBub25lIGFyZSBmb3VuZCwgbm8gZm9ybSBlcnJvcnMgd2lsbCBiZSBzaG93bi5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIHJlZmVyZW5jZSB0byBmaW5kIHRoZSBmb3JtIGVycm9yIHNlbGVjdG9yLlxuICAgKiBAcmV0dXJucyB7T2JqZWN0fSBqUXVlcnkgb2JqZWN0IHdpdGggdGhlIHNlbGVjdG9yLlxuICAgKi9cbiAgZmluZEZvcm1FcnJvcigkZWwpIHtcbiAgICB2YXIgJGVycm9yID0gJGVsLnNpYmxpbmdzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JTZWxlY3Rvcik7XG5cbiAgICBpZiAoISRlcnJvci5sZW5ndGgpIHtcbiAgICAgICRlcnJvciA9ICRlbC5wYXJlbnQoKS5maW5kKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JTZWxlY3Rvcik7XG4gICAgfVxuXG4gICAgcmV0dXJuICRlcnJvcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhpcyBvcmRlcjpcbiAgICogMi4gVGhlIDxsYWJlbD4gd2l0aCB0aGUgYXR0cmlidXRlIGBbZm9yPVwic29tZUlucHV0SWRcIl1gXG4gICAqIDMuIFRoZSBgLmNsb3Nlc3QoKWAgPGxhYmVsPlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXR0cmlidXRlIGlzIGNoZWNrZWQgb3IgZW1wdHlcbiAgICovXG4gIGZpbmRMYWJlbCgkZWwpIHtcbiAgICB2YXIgaWQgPSAkZWxbMF0uaWQ7XG4gICAgdmFyICRsYWJlbCA9IHRoaXMuJGVsZW1lbnQuZmluZChgbGFiZWxbZm9yPVwiJHtpZH1cIl1gKTtcblxuICAgIGlmICghJGxhYmVsLmxlbmd0aCkge1xuICAgICAgcmV0dXJuICRlbC5jbG9zZXN0KCdsYWJlbCcpO1xuICAgIH1cblxuICAgIHJldHVybiAkbGFiZWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBzZXQgb2YgbGFiZWxzIGFzc29jaWF0ZWQgd2l0aCBhIHNldCBvZiByYWRpbyBlbHMgaW4gdGhpcyBvcmRlclxuICAgKiAyLiBUaGUgPGxhYmVsPiB3aXRoIHRoZSBhdHRyaWJ1dGUgYFtmb3I9XCJzb21lSW5wdXRJZFwiXWBcbiAgICogMy4gVGhlIGAuY2xvc2VzdCgpYCA8bGFiZWw+XG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGNoZWNrIGZvciByZXF1aXJlZCBhdHRyaWJ1dGVcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxuICAgKi9cbiAgZmluZFJhZGlvTGFiZWxzKCRlbHMpIHtcbiAgICB2YXIgbGFiZWxzID0gJGVscy5tYXAoKGksIGVsKSA9PiB7XG4gICAgICB2YXIgaWQgPSBlbC5pZDtcbiAgICAgIHZhciAkbGFiZWwgPSB0aGlzLiRlbGVtZW50LmZpbmQoYGxhYmVsW2Zvcj1cIiR7aWR9XCJdYCk7XG5cbiAgICAgIGlmICghJGxhYmVsLmxlbmd0aCkge1xuICAgICAgICAkbGFiZWwgPSAkKGVsKS5jbG9zZXN0KCdsYWJlbCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICRsYWJlbFswXTtcbiAgICB9KTtcblxuICAgIHJldHVybiAkKGxhYmVscyk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0aGUgQ1NTIGVycm9yIGNsYXNzIGFzIHNwZWNpZmllZCBieSB0aGUgQWJpZGUgc2V0dGluZ3MgdG8gdGhlIGxhYmVsLCBpbnB1dCwgYW5kIHRoZSBmb3JtXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgY2xhc3MgdG9cbiAgICovXG4gIGFkZEVycm9yQ2xhc3NlcygkZWwpIHtcbiAgICB2YXIgJGxhYmVsID0gdGhpcy5maW5kTGFiZWwoJGVsKTtcbiAgICB2YXIgJGZvcm1FcnJvciA9IHRoaXMuZmluZEZvcm1FcnJvcigkZWwpO1xuXG4gICAgaWYgKCRsYWJlbC5sZW5ndGgpIHtcbiAgICAgICRsYWJlbC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICBpZiAoJGZvcm1FcnJvci5sZW5ndGgpIHtcbiAgICAgICRmb3JtRXJyb3IuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmZvcm1FcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICAkZWwuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykuYXR0cignZGF0YS1pbnZhbGlkJywgJycpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBDU1MgZXJyb3IgY2xhc3NlcyBldGMgZnJvbSBhbiBlbnRpcmUgcmFkaW8gYnV0dG9uIGdyb3VwXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBncm91cE5hbWUgLSBBIHN0cmluZyB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSBvZiBhIHJhZGlvIGJ1dHRvbiBncm91cFxuICAgKlxuICAgKi9cblxuICByZW1vdmVSYWRpb0Vycm9yQ2xhc3Nlcyhncm91cE5hbWUpIHtcbiAgICB2YXIgJGVscyA9IHRoaXMuJGVsZW1lbnQuZmluZChgOnJhZGlvW25hbWU9XCIke2dyb3VwTmFtZX1cIl1gKTtcbiAgICB2YXIgJGxhYmVscyA9IHRoaXMuZmluZFJhZGlvTGFiZWxzKCRlbHMpO1xuICAgIHZhciAkZm9ybUVycm9ycyA9IHRoaXMuZmluZEZvcm1FcnJvcigkZWxzKTtcblxuICAgIGlmICgkbGFiZWxzLmxlbmd0aCkge1xuICAgICAgJGxhYmVscy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcbiAgICB9XG5cbiAgICBpZiAoJGZvcm1FcnJvcnMubGVuZ3RoKSB7XG4gICAgICAkZm9ybUVycm9ycy5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuZm9ybUVycm9yQ2xhc3MpO1xuICAgIH1cblxuICAgICRlbHMucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmlucHV0RXJyb3JDbGFzcykucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIENTUyBlcnJvciBjbGFzcyBhcyBzcGVjaWZpZWQgYnkgdGhlIEFiaWRlIHNldHRpbmdzIGZyb20gdGhlIGxhYmVsLCBpbnB1dCwgYW5kIHRoZSBmb3JtXG4gICAqIEBwYXJhbSB7T2JqZWN0fSAkZWwgLSBqUXVlcnkgb2JqZWN0IHRvIHJlbW92ZSB0aGUgY2xhc3MgZnJvbVxuICAgKi9cbiAgcmVtb3ZlRXJyb3JDbGFzc2VzKCRlbCkge1xuICAgIC8vIHJhZGlvcyBuZWVkIHRvIGNsZWFyIGFsbCBvZiB0aGUgZWxzXG4gICAgaWYoJGVsWzBdLnR5cGUgPT0gJ3JhZGlvJykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlUmFkaW9FcnJvckNsYXNzZXMoJGVsLmF0dHIoJ25hbWUnKSk7XG4gICAgfVxuXG4gICAgdmFyICRsYWJlbCA9IHRoaXMuZmluZExhYmVsKCRlbCk7XG4gICAgdmFyICRmb3JtRXJyb3IgPSB0aGlzLmZpbmRGb3JtRXJyb3IoJGVsKTtcblxuICAgIGlmICgkbGFiZWwubGVuZ3RoKSB7XG4gICAgICAkbGFiZWwucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgaWYgKCRmb3JtRXJyb3IubGVuZ3RoKSB7XG4gICAgICAkZm9ybUVycm9yLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XG4gICAgfVxuXG4gICAgJGVsLnJlbW92ZUNsYXNzKHRoaXMub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdvZXMgdGhyb3VnaCBhIGZvcm0gdG8gZmluZCBpbnB1dHMgYW5kIHByb2NlZWRzIHRvIHZhbGlkYXRlIHRoZW0gaW4gd2F5cyBzcGVjaWZpYyB0byB0aGVpciB0eXBlXG4gICAqIEBmaXJlcyBBYmlkZSNpbnZhbGlkXG4gICAqIEBmaXJlcyBBYmlkZSN2YWxpZFxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdmFsaWRhdGUsIHNob3VsZCBiZSBhbiBIVE1MIGlucHV0XG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBnb29kVG9HbyAtIElmIHRoZSBpbnB1dCBpcyB2YWxpZCBvciBub3QuXG4gICAqL1xuICB2YWxpZGF0ZUlucHV0KCRlbCkge1xuICAgIHZhciBjbGVhclJlcXVpcmUgPSB0aGlzLnJlcXVpcmVkQ2hlY2soJGVsKSxcbiAgICAgICAgdmFsaWRhdGVkID0gZmFsc2UsXG4gICAgICAgIGN1c3RvbVZhbGlkYXRvciA9IHRydWUsXG4gICAgICAgIHZhbGlkYXRvciA9ICRlbC5hdHRyKCdkYXRhLXZhbGlkYXRvcicpLFxuICAgICAgICBlcXVhbFRvID0gdHJ1ZTtcblxuICAgIC8vIGRvbid0IHZhbGlkYXRlIGlnbm9yZWQgaW5wdXRzIG9yIGhpZGRlbiBpbnB1dHNcbiAgICBpZiAoJGVsLmlzKCdbZGF0YS1hYmlkZS1pZ25vcmVdJykgfHwgJGVsLmlzKCdbdHlwZT1cImhpZGRlblwiXScpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKCRlbFswXS50eXBlKSB7XG4gICAgICBjYXNlICdyYWRpbyc6XG4gICAgICAgIHZhbGlkYXRlZCA9IHRoaXMudmFsaWRhdGVSYWRpbygkZWwuYXR0cignbmFtZScpKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgdmFsaWRhdGVkID0gY2xlYXJSZXF1aXJlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAnc2VsZWN0JzpcbiAgICAgIGNhc2UgJ3NlbGVjdC1vbmUnOlxuICAgICAgY2FzZSAnc2VsZWN0LW11bHRpcGxlJzpcbiAgICAgICAgdmFsaWRhdGVkID0gY2xlYXJSZXF1aXJlO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdmFsaWRhdGVkID0gdGhpcy52YWxpZGF0ZVRleHQoJGVsKTtcbiAgICB9XG5cbiAgICBpZiAodmFsaWRhdG9yKSB7XG4gICAgICBjdXN0b21WYWxpZGF0b3IgPSB0aGlzLm1hdGNoVmFsaWRhdGlvbigkZWwsIHZhbGlkYXRvciwgJGVsLmF0dHIoJ3JlcXVpcmVkJykpO1xuICAgIH1cblxuICAgIGlmICgkZWwuYXR0cignZGF0YS1lcXVhbHRvJykpIHtcbiAgICAgIGVxdWFsVG8gPSB0aGlzLm9wdGlvbnMudmFsaWRhdG9ycy5lcXVhbFRvKCRlbCk7XG4gICAgfVxuXG5cbiAgICB2YXIgZ29vZFRvR28gPSBbY2xlYXJSZXF1aXJlLCB2YWxpZGF0ZWQsIGN1c3RvbVZhbGlkYXRvciwgZXF1YWxUb10uaW5kZXhPZihmYWxzZSkgPT09IC0xO1xuICAgIHZhciBtZXNzYWdlID0gKGdvb2RUb0dvID8gJ3ZhbGlkJyA6ICdpbnZhbGlkJykgKyAnLnpmLmFiaWRlJztcblxuICAgIGlmIChnb29kVG9Hbykge1xuICAgICAgLy8gUmUtdmFsaWRhdGUgaW5wdXRzIHRoYXQgZGVwZW5kIG9uIHRoaXMgb25lIHdpdGggZXF1YWx0b1xuICAgICAgY29uc3QgZGVwZW5kZW50RWxlbWVudHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYFtkYXRhLWVxdWFsdG89XCIkeyRlbC5hdHRyKCdpZCcpfVwiXWApO1xuICAgICAgaWYgKGRlcGVuZGVudEVsZW1lbnRzLmxlbmd0aCkge1xuICAgICAgICBsZXQgX3RoaXMgPSB0aGlzO1xuICAgICAgICBkZXBlbmRlbnRFbGVtZW50cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpKSB7XG4gICAgICAgICAgICBfdGhpcy52YWxpZGF0ZUlucHV0KCQodGhpcykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpc1tnb29kVG9HbyA/ICdyZW1vdmVFcnJvckNsYXNzZXMnIDogJ2FkZEVycm9yQ2xhc3NlcyddKCRlbCk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBpbnB1dCBpcyBkb25lIGNoZWNraW5nIGZvciB2YWxpZGF0aW9uLiBFdmVudCB0cmlnZ2VyIGlzIGVpdGhlciBgdmFsaWQuemYuYWJpZGVgIG9yIGBpbnZhbGlkLnpmLmFiaWRlYFxuICAgICAqIFRyaWdnZXIgaW5jbHVkZXMgdGhlIERPTSBlbGVtZW50IG9mIHRoZSBpbnB1dC5cbiAgICAgKiBAZXZlbnQgQWJpZGUjdmFsaWRcbiAgICAgKiBAZXZlbnQgQWJpZGUjaW52YWxpZFxuICAgICAqL1xuICAgICRlbC50cmlnZ2VyKG1lc3NhZ2UsIFskZWxdKTtcblxuICAgIHJldHVybiBnb29kVG9HbztcbiAgfVxuXG4gIC8qKlxuICAgKiBHb2VzIHRocm91Z2ggYSBmb3JtIGFuZCBpZiB0aGVyZSBhcmUgYW55IGludmFsaWQgaW5wdXRzLCBpdCB3aWxsIGRpc3BsYXkgdGhlIGZvcm0gZXJyb3IgZWxlbWVudFxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gbm9FcnJvciAtIHRydWUgaWYgbm8gZXJyb3JzIHdlcmUgZGV0ZWN0ZWQuLi5cbiAgICogQGZpcmVzIEFiaWRlI2Zvcm12YWxpZFxuICAgKiBAZmlyZXMgQWJpZGUjZm9ybWludmFsaWRcbiAgICovXG4gIHZhbGlkYXRlRm9ybSgpIHtcbiAgICB2YXIgYWNjID0gW107XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGlucHV0cy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgYWNjLnB1c2goX3RoaXMudmFsaWRhdGVJbnB1dCgkKHRoaXMpKSk7XG4gICAgfSk7XG5cbiAgICB2YXIgbm9FcnJvciA9IGFjYy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XG5cbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLWFiaWRlLWVycm9yXScpLmNzcygnZGlzcGxheScsIChub0Vycm9yID8gJ25vbmUnIDogJ2Jsb2NrJykpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgZm9ybSBpcyBmaW5pc2hlZCB2YWxpZGF0aW5nLiBFdmVudCB0cmlnZ2VyIGlzIGVpdGhlciBgZm9ybXZhbGlkLnpmLmFiaWRlYCBvciBgZm9ybWludmFsaWQuemYuYWJpZGVgLlxuICAgICAqIFRyaWdnZXIgaW5jbHVkZXMgdGhlIGVsZW1lbnQgb2YgdGhlIGZvcm0uXG4gICAgICogQGV2ZW50IEFiaWRlI2Zvcm12YWxpZFxuICAgICAqIEBldmVudCBBYmlkZSNmb3JtaW52YWxpZFxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigobm9FcnJvciA/ICdmb3JtdmFsaWQnIDogJ2Zvcm1pbnZhbGlkJykgKyAnLnpmLmFiaWRlJywgW3RoaXMuJGVsZW1lbnRdKTtcblxuICAgIHJldHVybiBub0Vycm9yO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgd2hldGhlciBvciBhIG5vdCBhIHRleHQgaW5wdXQgaXMgdmFsaWQgYmFzZWQgb24gdGhlIHBhdHRlcm4gc3BlY2lmaWVkIGluIHRoZSBhdHRyaWJ1dGUuIElmIG5vIG1hdGNoaW5nIHBhdHRlcm4gaXMgZm91bmQsIHJldHVybnMgdHJ1ZS5cbiAgICogQHBhcmFtIHtPYmplY3R9ICRlbCAtIGpRdWVyeSBvYmplY3QgdG8gdmFsaWRhdGUsIHNob3VsZCBiZSBhIHRleHQgaW5wdXQgSFRNTCBlbGVtZW50XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXR0ZXJuIC0gc3RyaW5nIHZhbHVlIG9mIG9uZSBvZiB0aGUgUmVnRXggcGF0dGVybnMgaW4gQWJpZGUub3B0aW9ucy5wYXR0ZXJuc1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IHRoZSBpbnB1dCB2YWx1ZSBtYXRjaGVzIHRoZSBwYXR0ZXJuIHNwZWNpZmllZFxuICAgKi9cbiAgdmFsaWRhdGVUZXh0KCRlbCwgcGF0dGVybikge1xuICAgIC8vIEEgcGF0dGVybiBjYW4gYmUgcGFzc2VkIHRvIHRoaXMgZnVuY3Rpb24sIG9yIGl0IHdpbGwgYmUgaW5mZXJlZCBmcm9tIHRoZSBpbnB1dCdzIFwicGF0dGVyblwiIGF0dHJpYnV0ZSwgb3IgaXQncyBcInR5cGVcIiBhdHRyaWJ1dGVcbiAgICBwYXR0ZXJuID0gKHBhdHRlcm4gfHwgJGVsLmF0dHIoJ3BhdHRlcm4nKSB8fCAkZWwuYXR0cigndHlwZScpKTtcbiAgICB2YXIgaW5wdXRUZXh0ID0gJGVsLnZhbCgpO1xuICAgIHZhciB2YWxpZCA9IGZhbHNlO1xuXG4gICAgaWYgKGlucHV0VGV4dC5sZW5ndGgpIHtcbiAgICAgIC8vIElmIHRoZSBwYXR0ZXJuIGF0dHJpYnV0ZSBvbiB0aGUgZWxlbWVudCBpcyBpbiBBYmlkZSdzIGxpc3Qgb2YgcGF0dGVybnMsIHRoZW4gdGVzdCB0aGF0IHJlZ2V4cFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXR0ZXJucy5oYXNPd25Qcm9wZXJ0eShwYXR0ZXJuKSkge1xuICAgICAgICB2YWxpZCA9IHRoaXMub3B0aW9ucy5wYXR0ZXJuc1twYXR0ZXJuXS50ZXN0KGlucHV0VGV4dCk7XG4gICAgICB9XG4gICAgICAvLyBJZiB0aGUgcGF0dGVybiBuYW1lIGlzbid0IGFsc28gdGhlIHR5cGUgYXR0cmlidXRlIG9mIHRoZSBmaWVsZCwgdGhlbiB0ZXN0IGl0IGFzIGEgcmVnZXhwXG4gICAgICBlbHNlIGlmIChwYXR0ZXJuICE9PSAkZWwuYXR0cigndHlwZScpKSB7XG4gICAgICAgIHZhbGlkID0gbmV3IFJlZ0V4cChwYXR0ZXJuKS50ZXN0KGlucHV0VGV4dCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFsaWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBBbiBlbXB0eSBmaWVsZCBpcyB2YWxpZCBpZiBpdCdzIG5vdCByZXF1aXJlZFxuICAgIGVsc2UgaWYgKCEkZWwucHJvcCgncmVxdWlyZWQnKSkge1xuICAgICAgdmFsaWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB2YWxpZDtcbiAgIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIGEgbm90IGEgcmFkaW8gaW5wdXQgaXMgdmFsaWQgYmFzZWQgb24gd2hldGhlciBvciBub3QgaXQgaXMgcmVxdWlyZWQgYW5kIHNlbGVjdGVkLiBBbHRob3VnaCB0aGUgZnVuY3Rpb24gdGFyZ2V0cyBhIHNpbmdsZSBgPGlucHV0PmAsIGl0IHZhbGlkYXRlcyBieSBjaGVja2luZyB0aGUgYHJlcXVpcmVkYCBhbmQgYGNoZWNrZWRgIHByb3BlcnRpZXMgb2YgYWxsIHJhZGlvIGJ1dHRvbnMgaW4gaXRzIGdyb3VwLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZ3JvdXBOYW1lIC0gQSBzdHJpbmcgdGhhdCBzcGVjaWZpZXMgdGhlIG5hbWUgb2YgYSByYWRpbyBidXR0b24gZ3JvdXBcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdCBsZWFzdCBvbmUgcmFkaW8gaW5wdXQgaGFzIGJlZW4gc2VsZWN0ZWQgKGlmIGl0J3MgcmVxdWlyZWQpXG4gICAqL1xuICB2YWxpZGF0ZVJhZGlvKGdyb3VwTmFtZSkge1xuICAgIC8vIElmIGF0IGxlYXN0IG9uZSByYWRpbyBpbiB0aGUgZ3JvdXAgaGFzIHRoZSBgcmVxdWlyZWRgIGF0dHJpYnV0ZSwgdGhlIGdyb3VwIGlzIGNvbnNpZGVyZWQgcmVxdWlyZWRcbiAgICAvLyBQZXIgVzNDIHNwZWMsIGFsbCByYWRpbyBidXR0b25zIGluIGEgZ3JvdXAgc2hvdWxkIGhhdmUgYHJlcXVpcmVkYCwgYnV0IHdlJ3JlIGJlaW5nIG5pY2VcbiAgICB2YXIgJGdyb3VwID0gdGhpcy4kZWxlbWVudC5maW5kKGA6cmFkaW9bbmFtZT1cIiR7Z3JvdXBOYW1lfVwiXWApO1xuICAgIHZhciB2YWxpZCA9IGZhbHNlLCByZXF1aXJlZCA9IGZhbHNlO1xuXG4gICAgLy8gRm9yIHRoZSBncm91cCB0byBiZSByZXF1aXJlZCwgYXQgbGVhc3Qgb25lIHJhZGlvIG5lZWRzIHRvIGJlIHJlcXVpcmVkXG4gICAgJGdyb3VwLmVhY2goKGksIGUpID0+IHtcbiAgICAgIGlmICgkKGUpLmF0dHIoJ3JlcXVpcmVkJykpIHtcbiAgICAgICAgcmVxdWlyZWQgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmKCFyZXF1aXJlZCkgdmFsaWQ9dHJ1ZTtcblxuICAgIGlmICghdmFsaWQpIHtcbiAgICAgIC8vIEZvciB0aGUgZ3JvdXAgdG8gYmUgdmFsaWQsIGF0IGxlYXN0IG9uZSByYWRpbyBuZWVkcyB0byBiZSBjaGVja2VkXG4gICAgICAkZ3JvdXAuZWFjaCgoaSwgZSkgPT4ge1xuICAgICAgICBpZiAoJChlKS5wcm9wKCdjaGVja2VkJykpIHtcbiAgICAgICAgICB2YWxpZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gdmFsaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiBhIHNlbGVjdGVkIGlucHV0IHBhc3NlcyBhIGN1c3RvbSB2YWxpZGF0aW9uIGZ1bmN0aW9uLiBNdWx0aXBsZSB2YWxpZGF0aW9ucyBjYW4gYmUgdXNlZCwgaWYgcGFzc2VkIHRvIHRoZSBlbGVtZW50IHdpdGggYGRhdGEtdmFsaWRhdG9yPVwiZm9vIGJhciBiYXpcImAgaW4gYSBzcGFjZSBzZXBhcmF0ZWQgbGlzdGVkLlxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVsIC0galF1ZXJ5IGlucHV0IGVsZW1lbnQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB2YWxpZGF0b3JzIC0gYSBzdHJpbmcgb2YgZnVuY3Rpb24gbmFtZXMgbWF0Y2hpbmcgZnVuY3Rpb25zIGluIHRoZSBBYmlkZS5vcHRpb25zLnZhbGlkYXRvcnMgb2JqZWN0LlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHJlcXVpcmVkIC0gc2VsZiBleHBsYW5hdG9yeT9cbiAgICogQHJldHVybnMge0Jvb2xlYW59IC0gdHJ1ZSBpZiB2YWxpZGF0aW9ucyBwYXNzZWQuXG4gICAqL1xuICBtYXRjaFZhbGlkYXRpb24oJGVsLCB2YWxpZGF0b3JzLCByZXF1aXJlZCkge1xuICAgIHJlcXVpcmVkID0gcmVxdWlyZWQgPyB0cnVlIDogZmFsc2U7XG5cbiAgICB2YXIgY2xlYXIgPSB2YWxpZGF0b3JzLnNwbGl0KCcgJykubWFwKCh2KSA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5vcHRpb25zLnZhbGlkYXRvcnNbdl0oJGVsLCByZXF1aXJlZCwgJGVsLnBhcmVudCgpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gY2xlYXIuaW5kZXhPZihmYWxzZSkgPT09IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0cyBmb3JtIGlucHV0cyBhbmQgc3R5bGVzXG4gICAqIEBmaXJlcyBBYmlkZSNmb3JtcmVzZXRcbiAgICovXG4gIHJlc2V0Rm9ybSgpIHtcbiAgICB2YXIgJGZvcm0gPSB0aGlzLiRlbGVtZW50LFxuICAgICAgICBvcHRzID0gdGhpcy5vcHRpb25zO1xuXG4gICAgJChgLiR7b3B0cy5sYWJlbEVycm9yQ2xhc3N9YCwgJGZvcm0pLm5vdCgnc21hbGwnKS5yZW1vdmVDbGFzcyhvcHRzLmxhYmVsRXJyb3JDbGFzcyk7XG4gICAgJChgLiR7b3B0cy5pbnB1dEVycm9yQ2xhc3N9YCwgJGZvcm0pLm5vdCgnc21hbGwnKS5yZW1vdmVDbGFzcyhvcHRzLmlucHV0RXJyb3JDbGFzcyk7XG4gICAgJChgJHtvcHRzLmZvcm1FcnJvclNlbGVjdG9yfS4ke29wdHMuZm9ybUVycm9yQ2xhc3N9YCkucmVtb3ZlQ2xhc3Mob3B0cy5mb3JtRXJyb3JDbGFzcyk7XG4gICAgJGZvcm0uZmluZCgnW2RhdGEtYWJpZGUtZXJyb3JdJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAkKCc6aW5wdXQnLCAkZm9ybSkubm90KCc6YnV0dG9uLCA6c3VibWl0LCA6cmVzZXQsIDpoaWRkZW4sIDpyYWRpbywgOmNoZWNrYm94LCBbZGF0YS1hYmlkZS1pZ25vcmVdJykudmFsKCcnKS5yZW1vdmVBdHRyKCdkYXRhLWludmFsaWQnKTtcbiAgICAkKCc6aW5wdXQ6cmFkaW8nLCAkZm9ybSkubm90KCdbZGF0YS1hYmlkZS1pZ25vcmVdJykucHJvcCgnY2hlY2tlZCcsZmFsc2UpLnJlbW92ZUF0dHIoJ2RhdGEtaW52YWxpZCcpO1xuICAgICQoJzppbnB1dDpjaGVja2JveCcsICRmb3JtKS5ub3QoJ1tkYXRhLWFiaWRlLWlnbm9yZV0nKS5wcm9wKCdjaGVja2VkJyxmYWxzZSkucmVtb3ZlQXR0cignZGF0YS1pbnZhbGlkJyk7XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgZm9ybSBoYXMgYmVlbiByZXNldC5cbiAgICAgKiBAZXZlbnQgQWJpZGUjZm9ybXJlc2V0XG4gICAgICovXG4gICAgJGZvcm0udHJpZ2dlcignZm9ybXJlc2V0LnpmLmFiaWRlJywgWyRmb3JtXSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgQWJpZGUuXG4gICAqIFJlbW92ZXMgZXJyb3Igc3R5bGVzIGFuZCBjbGFzc2VzIGZyb20gZWxlbWVudHMsIHdpdGhvdXQgcmVzZXR0aW5nIHRoZWlyIHZhbHVlcy5cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAub2ZmKCcuYWJpZGUnKVxuICAgICAgLmZpbmQoJ1tkYXRhLWFiaWRlLWVycm9yXScpXG4gICAgICAgIC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuXG4gICAgdGhpcy4kaW5wdXRzXG4gICAgICAub2ZmKCcuYWJpZGUnKVxuICAgICAgLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLnJlbW92ZUVycm9yQ2xhc3NlcygkKHRoaXMpKTtcbiAgICAgIH0pO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbi8qKlxuICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXG4gKi9cbkFiaWRlLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogVGhlIGRlZmF1bHQgZXZlbnQgdG8gdmFsaWRhdGUgaW5wdXRzLiBDaGVja2JveGVzIGFuZCByYWRpb3MgdmFsaWRhdGUgaW1tZWRpYXRlbHkuXG4gICAqIFJlbW92ZSBvciBjaGFuZ2UgdGhpcyB2YWx1ZSBmb3IgbWFudWFsIHZhbGlkYXRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2ZpZWxkQ2hhbmdlJ1xuICAgKi9cbiAgdmFsaWRhdGVPbjogJ2ZpZWxkQ2hhbmdlJyxcblxuICAvKipcbiAgICogQ2xhc3MgdG8gYmUgYXBwbGllZCB0byBpbnB1dCBsYWJlbHMgb24gZmFpbGVkIHZhbGlkYXRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2lzLWludmFsaWQtbGFiZWwnXG4gICAqL1xuICBsYWJlbEVycm9yQ2xhc3M6ICdpcy1pbnZhbGlkLWxhYmVsJyxcblxuICAvKipcbiAgICogQ2xhc3MgdG8gYmUgYXBwbGllZCB0byBpbnB1dHMgb24gZmFpbGVkIHZhbGlkYXRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2lzLWludmFsaWQtaW5wdXQnXG4gICAqL1xuICBpbnB1dEVycm9yQ2xhc3M6ICdpcy1pbnZhbGlkLWlucHV0JyxcblxuICAvKipcbiAgICogQ2xhc3Mgc2VsZWN0b3IgdG8gdXNlIHRvIHRhcmdldCBGb3JtIEVycm9ycyBmb3Igc2hvdy9oaWRlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICcuZm9ybS1lcnJvcidcbiAgICovXG4gIGZvcm1FcnJvclNlbGVjdG9yOiAnLmZvcm0tZXJyb3InLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBhZGRlZCB0byBGb3JtIEVycm9ycyBvbiBmYWlsZWQgdmFsaWRhdGlvbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnaXMtdmlzaWJsZSdcbiAgICovXG4gIGZvcm1FcnJvckNsYXNzOiAnaXMtdmlzaWJsZScsXG5cbiAgLyoqXG4gICAqIFNldCB0byB0cnVlIHRvIHZhbGlkYXRlIHRleHQgaW5wdXRzIG9uIGFueSB2YWx1ZSBjaGFuZ2UuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGxpdmVWYWxpZGF0ZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIFNldCB0byB0cnVlIHRvIHZhbGlkYXRlIGlucHV0cyBvbiBibHVyLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICB2YWxpZGF0ZU9uQmx1cjogZmFsc2UsXG5cbiAgcGF0dGVybnM6IHtcbiAgICBhbHBoYSA6IC9eW2EtekEtWl0rJC8sXG4gICAgYWxwaGFfbnVtZXJpYyA6IC9eW2EtekEtWjAtOV0rJC8sXG4gICAgaW50ZWdlciA6IC9eWy0rXT9cXGQrJC8sXG4gICAgbnVtYmVyIDogL15bLStdP1xcZCooPzpbXFwuXFwsXVxcZCspPyQvLFxuXG4gICAgLy8gYW1leCwgdmlzYSwgZGluZXJzXG4gICAgY2FyZCA6IC9eKD86NFswLTldezEyfSg/OlswLTldezN9KT98NVsxLTVdWzAtOV17MTR9fDYoPzowMTF8NVswLTldWzAtOV0pWzAtOV17MTJ9fDNbNDddWzAtOV17MTN9fDMoPzowWzAtNV18WzY4XVswLTldKVswLTldezExfXwoPzoyMTMxfDE4MDB8MzVcXGR7M30pXFxkezExfSkkLyxcbiAgICBjdnYgOiAvXihbMC05XSl7Myw0fSQvLFxuXG4gICAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2Uvc3RhdGVzLW9mLXRoZS10eXBlLWF0dHJpYnV0ZS5odG1sI3ZhbGlkLWUtbWFpbC1hZGRyZXNzXG4gICAgZW1haWwgOiAvXlthLXpBLVowLTkuISMkJSYnKitcXC89P15fYHt8fX4tXStAW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KD86XFwuW2EtekEtWjAtOV0oPzpbYS16QS1aMC05LV17MCw2MX1bYS16QS1aMC05XSk/KSskLyxcblxuICAgIHVybCA6IC9eKGh0dHBzP3xmdHB8ZmlsZXxzc2gpOlxcL1xcLygoKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6KSpAKT8oKChcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSkpfCgoKFthLXpBLVpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4pKygoW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKihbYS16QS1aXXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKVxcLj8pKDpcXGQqKT8pKFxcLygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkrKFxcLygoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKSopKik/KT8oXFw/KCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxbXFx1RTAwMC1cXHVGOEZGXXxcXC98XFw/KSopPyhcXCMoKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApfFxcL3xcXD8pKik/JC8sXG4gICAgLy8gYWJjLmRlXG4gICAgZG9tYWluIDogL14oW2EtekEtWjAtOV0oW2EtekEtWjAtOVxcLV17MCw2MX1bYS16QS1aMC05XSk/XFwuKStbYS16QS1aXXsyLDh9JC8sXG5cbiAgICBkYXRldGltZSA6IC9eKFswLTJdWzAtOV17M30pXFwtKFswLTFdWzAtOV0pXFwtKFswLTNdWzAtOV0pVChbMC01XVswLTldKVxcOihbMC01XVswLTldKVxcOihbMC01XVswLTldKShafChbXFwtXFwrXShbMC0xXVswLTldKVxcOjAwKSkkLyxcbiAgICAvLyBZWVlZLU1NLUREXG4gICAgZGF0ZSA6IC8oPzoxOXwyMClbMC05XXsyfS0oPzooPzowWzEtOV18MVswLTJdKS0oPzowWzEtOV18MVswLTldfDJbMC05XSl8KD86KD8hMDIpKD86MFsxLTldfDFbMC0yXSktKD86MzApKXwoPzooPzowWzEzNTc4XXwxWzAyXSktMzEpKSQvLFxuICAgIC8vIEhIOk1NOlNTXG4gICAgdGltZSA6IC9eKDBbMC05XXwxWzAtOV18MlswLTNdKSg6WzAtNV1bMC05XSl7Mn0kLyxcbiAgICBkYXRlSVNPIDogL15cXGR7NH1bXFwvXFwtXVxcZHsxLDJ9W1xcL1xcLV1cXGR7MSwyfSQvLFxuICAgIC8vIE1NL0REL1lZWVlcbiAgICBtb250aF9kYXlfeWVhciA6IC9eKDBbMS05XXwxWzAxMl0pWy0gXFwvLl0oMFsxLTldfFsxMl1bMC05XXwzWzAxXSlbLSBcXC8uXVxcZHs0fSQvLFxuICAgIC8vIEREL01NL1lZWVlcbiAgICBkYXlfbW9udGhfeWVhciA6IC9eKDBbMS05XXxbMTJdWzAtOV18M1swMV0pWy0gXFwvLl0oMFsxLTldfDFbMDEyXSlbLSBcXC8uXVxcZHs0fSQvLFxuXG4gICAgLy8gI0ZGRiBvciAjRkZGRkZGXG4gICAgY29sb3IgOiAvXiM/KFthLWZBLUYwLTldezZ9fFthLWZBLUYwLTldezN9KSQvXG4gIH0sXG5cbiAgLyoqXG4gICAqIE9wdGlvbmFsIHZhbGlkYXRpb24gZnVuY3Rpb25zIHRvIGJlIHVzZWQuIGBlcXVhbFRvYCBiZWluZyB0aGUgb25seSBkZWZhdWx0IGluY2x1ZGVkIGZ1bmN0aW9uLlxuICAgKiBGdW5jdGlvbnMgc2hvdWxkIHJldHVybiBvbmx5IGEgYm9vbGVhbiBpZiB0aGUgaW5wdXQgaXMgdmFsaWQgb3Igbm90LiBGdW5jdGlvbnMgYXJlIGdpdmVuIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgKiBlbCA6IFRoZSBqUXVlcnkgZWxlbWVudCB0byB2YWxpZGF0ZS5cbiAgICogcmVxdWlyZWQgOiBCb29sZWFuIHZhbHVlIG9mIHRoZSByZXF1aXJlZCBhdHRyaWJ1dGUgYmUgcHJlc2VudCBvciBub3QuXG4gICAqIHBhcmVudCA6IFRoZSBkaXJlY3QgcGFyZW50IG9mIHRoZSBpbnB1dC5cbiAgICogQG9wdGlvblxuICAgKi9cbiAgdmFsaWRhdG9yczoge1xuICAgIGVxdWFsVG86IGZ1bmN0aW9uIChlbCwgcmVxdWlyZWQsIHBhcmVudCkge1xuICAgICAgcmV0dXJuICQoYCMke2VsLmF0dHIoJ2RhdGEtZXF1YWx0bycpfWApLnZhbCgpID09PSBlbC52YWwoKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKEFiaWRlLCAnQWJpZGUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEFjY29yZGlvbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uYWNjb3JkaW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICovXG5cbmNsYXNzIEFjY29yZGlvbiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbi5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBBY2NvcmRpb24jaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbi5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBhIHBsYWluIG9iamVjdCB3aXRoIHNldHRpbmdzIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9wdGlvbnMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFjY29yZGlvbi5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnQWNjb3JkaW9uJyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignQWNjb3JkaW9uJywge1xuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX1VQJzogJ3ByZXZpb3VzJ1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gYnkgYW5pbWF0aW5nIHRoZSBwcmVzZXQgYWN0aXZlIHBhbmUocykuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ3JvbGUnLCAndGFibGlzdCcpO1xuICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1hY2NvcmRpb24taXRlbV0nKTtcblxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbihpZHgsIGVsKSB7XG4gICAgICB2YXIgJGVsID0gJChlbCksXG4gICAgICAgICAgJGNvbnRlbnQgPSAkZWwuY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpLFxuICAgICAgICAgIGlkID0gJGNvbnRlbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjb3JkaW9uJyksXG4gICAgICAgICAgbGlua0lkID0gZWwuaWQgfHwgYCR7aWR9LWxhYmVsYDtcblxuICAgICAgJGVsLmZpbmQoJ2E6Zmlyc3QnKS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBpZCxcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgJ2lkJzogbGlua0lkLFxuICAgICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgJGNvbnRlbnQuYXR0cih7J3JvbGUnOiAndGFicGFuZWwnLCAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkLCAnYXJpYS1oaWRkZW4nOiB0cnVlLCAnaWQnOiBpZH0pO1xuICAgIH0pO1xuICAgIHZhciAkaW5pdEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcbiAgICBpZigkaW5pdEFjdGl2ZS5sZW5ndGgpe1xuICAgICAgdGhpcy5kb3duKCRpbml0QWN0aXZlLCB0cnVlKTtcbiAgICB9XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBhY2NvcmRpb24uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICB0aGlzLiR0YWJzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgJGVsZW0gPSAkKHRoaXMpO1xuICAgICAgdmFyICR0YWJDb250ZW50ID0gJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xuICAgICAgaWYgKCR0YWJDb250ZW50Lmxlbmd0aCkge1xuICAgICAgICAkZWxlbS5jaGlsZHJlbignYScpLm9mZignY2xpY2suemYuYWNjb3JkaW9uIGtleWRvd24uemYuYWNjb3JkaW9uJylcbiAgICAgICAgICAgICAgIC5vbignY2xpY2suemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy50b2dnbGUoJHRhYkNvbnRlbnQpO1xuICAgICAgICB9KS5vbigna2V5ZG93bi56Zi5hY2NvcmRpb24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uJywge1xuICAgICAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCR0YWJDb250ZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgdmFyICRhID0gJGVsZW0ubmV4dCgpLmZpbmQoJ2EnKS5mb2N1cygpO1xuICAgICAgICAgICAgICBpZiAoIV90aGlzLm9wdGlvbnMubXVsdGlFeHBhbmQpIHtcbiAgICAgICAgICAgICAgICAkYS50cmlnZ2VyKCdjbGljay56Zi5hY2NvcmRpb24nKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB2YXIgJGEgPSAkZWxlbS5wcmV2KCkuZmluZCgnYScpLmZvY3VzKCk7XG4gICAgICAgICAgICAgIGlmICghX3RoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCkge1xuICAgICAgICAgICAgICAgICRhLnRyaWdnZXIoJ2NsaWNrLnpmLmFjY29yZGlvbicpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBzZWxlY3RlZCBjb250ZW50IHBhbmUncyBvcGVuL2Nsb3NlIHN0YXRlLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIGpRdWVyeSBvYmplY3Qgb2YgdGhlIHBhbmUgdG8gdG9nZ2xlIChgLmFjY29yZGlvbi1jb250ZW50YCkuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgdG9nZ2xlKCR0YXJnZXQpIHtcbiAgICBpZigkdGFyZ2V0LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgdGhpcy51cCgkdGFyZ2V0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgYWNjb3JkaW9uIHRhYiBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBBY2NvcmRpb24gcGFuZSB0byBvcGVuIChgLmFjY29yZGlvbi1jb250ZW50YCkuXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZmlyc3RUaW1lIC0gZmxhZyB0byBkZXRlcm1pbmUgaWYgcmVmbG93IHNob3VsZCBoYXBwZW4uXG4gICAqIEBmaXJlcyBBY2NvcmRpb24jZG93blxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRvd24oJHRhcmdldCwgZmlyc3RUaW1lKSB7XG4gICAgJHRhcmdldFxuICAgICAgLmF0dHIoJ2FyaWEtaGlkZGVuJywgZmFsc2UpXG4gICAgICAucGFyZW50KCdbZGF0YS10YWItY29udGVudF0nKVxuICAgICAgLmFkZEJhY2soKVxuICAgICAgLnBhcmVudCgpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kICYmICFmaXJzdFRpbWUpIHtcbiAgICAgIHZhciAkY3VycmVudEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1hY3RpdmUnKS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XG4gICAgICBpZiAoJGN1cnJlbnRBY3RpdmUubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMudXAoJGN1cnJlbnRBY3RpdmUubm90KCR0YXJnZXQpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAkdGFyZ2V0LnNsaWRlRG93bih0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgKCkgPT4ge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyB3aGVuIHRoZSB0YWIgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICogQGV2ZW50IEFjY29yZGlvbiNkb3duXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZG93bi56Zi5hY2NvcmRpb24nLCBbJHRhcmdldF0pO1xuICAgIH0pO1xuXG4gICAgJChgIyR7JHRhcmdldC5hdHRyKCdhcmlhLWxhYmVsbGVkYnknKX1gKS5hdHRyKHtcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogdHJ1ZSxcbiAgICAgICdhcmlhLXNlbGVjdGVkJzogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgdGFiIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiB0YWIgdG8gY2xvc2UgKGAuYWNjb3JkaW9uLWNvbnRlbnRgKS5cbiAgICogQGZpcmVzIEFjY29yZGlvbiN1cFxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHVwKCR0YXJnZXQpIHtcbiAgICB2YXIgJGF1bnRzID0gJHRhcmdldC5wYXJlbnQoKS5zaWJsaW5ncygpLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZigoIXRoaXMub3B0aW9ucy5hbGxvd0FsbENsb3NlZCAmJiAhJGF1bnRzLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkgfHwgISR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gRm91bmRhdGlvbi5Nb3ZlKHRoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCAkdGFyZ2V0LCBmdW5jdGlvbigpe1xuICAgICAgJHRhcmdldC5zbGlkZVVwKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgdGFiIGlzIGRvbmUgY29sbGFwc2luZyB1cC5cbiAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbiN1cFxuICAgICAgICAgKi9cbiAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcigndXAuemYuYWNjb3JkaW9uJywgWyR0YXJnZXRdKTtcbiAgICAgIH0pO1xuICAgIC8vIH0pO1xuXG4gICAgJHRhcmdldC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpXG4gICAgICAgICAgIC5wYXJlbnQoKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAkKGAjJHskdGFyZ2V0LmF0dHIoJ2FyaWEtbGFiZWxsZWRieScpfWApLmF0dHIoe1xuICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlLFxuICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXG4gICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXG4gICAqIEBmaXJlcyBBY2NvcmRpb24jZGVzdHJveWVkXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXRhYi1jb250ZW50XScpLnN0b3AodHJ1ZSkuc2xpZGVVcCgwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCcuemYuYWNjb3JkaW9uJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuQWNjb3JkaW9uLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gYW5pbWF0ZSB0aGUgb3BlbmluZyBvZiBhbiBhY2NvcmRpb24gcGFuZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gaGF2ZSBtdWx0aXBsZSBvcGVuIHBhbmVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBtdWx0aUV4cGFuZDogZmFsc2UsXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgYWNjb3JkaW9uIHRvIGNsb3NlIGFsbCBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYWxsb3dBbGxDbG9zZWQ6IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uLCAnQWNjb3JkaW9uJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5hY2NvcmRpb25NZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgQWNjb3JkaW9uTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEFjY29yZGlvbk1lbnUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFjY29yZGlvbk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdhY2NvcmRpb24nKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0FjY29yZGlvbk1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ3RvZ2dsZScsXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2VBbGwnXG4gICAgfSk7XG4gIH1cblxuXG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBhY2NvcmRpb24gbWVudSBieSBoaWRpbmcgYWxsIG5lc3RlZCBtZW51cy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5ub3QoJy5pcy1hY3RpdmUnKS5zbGlkZVVwKDApOy8vLmZpbmQoJ2EnKS5jc3MoJ3BhZGRpbmctbGVmdCcsICcxcmVtJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICdyb2xlJzogJ21lbnUnLFxuICAgICAgJ2FyaWEtbXVsdGlzZWxlY3RhYmxlJzogdGhpcy5vcHRpb25zLm11bHRpT3BlblxuICAgIH0pO1xuXG4gICAgdGhpcy4kbWVudUxpbmtzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWNjb3JkaW9uLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kbWVudUxpbmtzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciBsaW5rSWQgPSB0aGlzLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51LWxpbmsnKSxcbiAgICAgICAgICAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxuICAgICAgICAgIHN1YklkID0gJHN1YlswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2MtbWVudScpLFxuICAgICAgICAgIGlzQWN0aXZlID0gJHN1Yi5oYXNDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAkZWxlbS5hdHRyKHtcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBzdWJJZCxcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBpc0FjdGl2ZSxcbiAgICAgICAgJ3JvbGUnOiAnbWVudWl0ZW0nLFxuICAgICAgICAnaWQnOiBsaW5rSWRcbiAgICAgIH0pO1xuICAgICAgJHN1Yi5hdHRyKHtcbiAgICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IGxpbmtJZCxcbiAgICAgICAgJ2FyaWEtaGlkZGVuJzogIWlzQWN0aXZlLFxuICAgICAgICAncm9sZSc6ICdtZW51JyxcbiAgICAgICAgJ2lkJzogc3ViSWRcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHZhciBpbml0UGFuZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKTtcbiAgICBpZihpbml0UGFuZXMubGVuZ3RoKXtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICBpbml0UGFuZXMuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICBfdGhpcy5kb3duKCQodGhpcykpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHRoaXMuX2V2ZW50cygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgbWVudS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnbGknKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgdmFyICRzdWJtZW51ID0gJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcblxuICAgICAgaWYgKCRzdWJtZW51Lmxlbmd0aCkge1xuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jykub24oJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgX3RoaXMudG9nZ2xlKCRzdWJtZW51KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkub24oJ2tleWRvd24uemYuYWNjb3JkaW9ubWVudScsIGZ1bmN0aW9uKGUpe1xuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcbiAgICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudCxcbiAgICAgICAgICAkdGFyZ2V0ID0gJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJyk7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpLmZpbmQoJ2EnKS5maXJzdCgpO1xuXG4gICAgICAgICAgaWYgKCQodGhpcykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdOnZpc2libGUnKS5sZW5ndGgpIHsgLy8gaGFzIG9wZW4gc3ViIG1lbnVcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50LmZpbmQoJ2xpOmZpcnN0LWNoaWxkJykuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCc6Zmlyc3QtY2hpbGQnKSkgeyAvLyBpcyBmaXJzdCBlbGVtZW50IG9mIHN1YiBtZW51XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCk7XG4gICAgICAgICAgfSBlbHNlIGlmICgkcHJldkVsZW1lbnQucGFyZW50cygnbGknKS5maXJzdCgpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XTp2aXNpYmxlJykubGVuZ3RoKSB7IC8vIGlmIHByZXZpb3VzIGVsZW1lbnQgaGFzIG9wZW4gc3ViIG1lbnVcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRwcmV2RWxlbWVudC5wYXJlbnRzKCdsaScpLmZpbmQoJ2xpOmxhc3QtY2hpbGQnKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCQodGhpcykuaXMoJzpsYXN0LWNoaWxkJykpIHsgLy8gaXMgbGFzdCBlbGVtZW50IG9mIHN1YiBtZW51XG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkubmV4dCgnbGknKS5maW5kKCdhJykuZmlyc3QoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnQWNjb3JkaW9uTWVudScsIHtcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgICAgICAgICR0YXJnZXQuZmluZCgnbGknKS5maXJzdCgpLmZpbmQoJ2EnKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCR0YXJnZXQubGVuZ3RoICYmICEkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHsgLy8gY2xvc2UgYWN0aXZlIHN1YiBvZiB0aGlzIGl0ZW1cbiAgICAgICAgICAgIF90aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoJGVsZW1lbnQucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkgeyAvLyBjbG9zZSBjdXJyZW50bHkgb3BlbiBzdWJcbiAgICAgICAgICAgIF90aGlzLnVwKCRlbGVtZW50LnBhcmVudCgnW2RhdGEtc3VibWVudV0nKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZmluZCgnYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJG5leHRFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaWYgKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCkge1xuICAgICAgICAgICAgX3RoaXMudG9nZ2xlKCRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlQWxsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5oaWRlQWxsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pOy8vLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIGFsbCBwYW5lcyBvZiB0aGUgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBoaWRlQWxsKCkge1xuICAgIHRoaXMudXAodGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyBhbGwgcGFuZXMgb2YgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgc2hvd0FsbCgpIHtcbiAgICB0aGlzLmRvd24odGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlIHN0YXRlIG9mIGEgc3VibWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0gdGhlIHN1Ym1lbnUgdG8gdG9nZ2xlXG4gICAqL1xuICB0b2dnbGUoJHRhcmdldCl7XG4gICAgaWYoISR0YXJnZXQuaXMoJzphbmltYXRlZCcpKSB7XG4gICAgICBpZiAoISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICB0aGlzLnVwKCR0YXJnZXQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHRoaXMuZG93bigkdGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIG9wZW4uXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rvd25cbiAgICovXG4gIGRvd24oJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpT3Blbikge1xuICAgICAgdGhpcy51cCh0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5ub3QoJHRhcmdldC5wYXJlbnRzVW50aWwodGhpcy4kZWxlbWVudCkuYWRkKCR0YXJnZXQpKSk7XG4gICAgfVxuXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KVxuICAgICAgLnBhcmVudCgnLmlzLWFjY29yZGlvbi1zdWJtZW51LXBhcmVudCcpLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuXG4gICAgICAvL0ZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICR0YXJnZXQuc2xpZGVEb3duKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIC8qKlxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZG9uZSBvcGVuaW5nLlxuICAgICAgICAgICAqIEBldmVudCBBY2NvcmRpb25NZW51I2Rvd25cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdkb3duLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgICB9KTtcbiAgICAgIC8vfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2VzIHRoZSBzdWItbWVudSBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC4gQWxsIHN1Yi1tZW51cyBpbnNpZGUgdGhlIHRhcmdldCB3aWxsIGJlIGNsb3NlZCBhcyB3ZWxsLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFN1Yi1tZW51IHRvIGNsb3NlLlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSN1cFxuICAgKi9cbiAgdXAoJHRhcmdldCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLy9Gb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XG4gICAgICAkdGFyZ2V0LnNsaWRlVXAoX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBtZW51IGlzIGRvbmUgY29sbGFwc2luZyB1cC5cbiAgICAgICAgICogQGV2ZW50IEFjY29yZGlvbk1lbnUjdXBcbiAgICAgICAgICovXG4gICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xuICAgICAgfSk7XG4gICAgLy99KTtcblxuICAgIHZhciAkbWVudXMgPSAkdGFyZ2V0LmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykuc2xpZGVVcCgwKS5hZGRCYWNrKCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgICRtZW51cy5wYXJlbnQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFjY29yZGlvbiBtZW51LlxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSNkZXN0cm95ZWRcbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlRG93bigwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25NZW51Jyk7XG5cbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cbkFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGEgc3VibWVudSBpbiBtcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAyNTBcbiAgICovXG4gIHNsaWRlU3BlZWQ6IDI1MCxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGhhdmUgbXVsdGlwbGUgb3BlbiBwYW5lcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBtdWx0aU9wZW46IHRydWVcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihBY2NvcmRpb25NZW51LCAnQWNjb3JkaW9uTWVudScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJpbGxkb3duIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcmlsbGRvd25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcbiAqL1xuXG5jbGFzcyBEcmlsbGRvd24ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyaWxsZG93biBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24gbWVudS5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcmlsbGRvd24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIEZvdW5kYXRpb24uTmVzdC5GZWF0aGVyKHRoaXMuJGVsZW1lbnQsICdkcmlsbGRvd24nKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ0RyaWxsZG93bicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0RyaWxsZG93bicsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXG4gICAgICAnQVJST1dfRE9XTic6ICdkb3duJyxcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxuICAgICAgJ1RBQic6ICdkb3duJyxcbiAgICAgICdTSElGVF9UQUInOiAndXAnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGRyaWxsZG93biBieSBjcmVhdGluZyBqUXVlcnkgY29sbGVjdGlvbnMgb2YgZWxlbWVudHNcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuJHN1Ym1lbnVBbmNob3JzID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaS5pcy1kcmlsbGRvd24tc3VibWVudS1wYXJlbnQnKS5jaGlsZHJlbignYScpO1xuICAgIHRoaXMuJHN1Ym1lbnVzID0gdGhpcy4kc3VibWVudUFuY2hvcnMucGFyZW50KCdsaScpLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xuICAgIHRoaXMuJG1lbnVJdGVtcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGknKS5ub3QoJy5qcy1kcmlsbGRvd24tYmFjaycpLmF0dHIoJ3JvbGUnLCAnbWVudWl0ZW0nKS5maW5kKCdhJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLW11dGF0ZScsICh0aGlzLiRlbGVtZW50LmF0dHIoJ2RhdGEtZHJpbGxkb3duJykgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnZHJpbGxkb3duJykpKTtcblxuICAgIHRoaXMuX3ByZXBhcmVNZW51KCk7XG4gICAgdGhpcy5fcmVnaXN0ZXJFdmVudHMoKTtcblxuICAgIHRoaXMuX2tleWJvYXJkRXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogcHJlcGFyZXMgZHJpbGxkb3duIG1lbnUgYnkgc2V0dGluZyBhdHRyaWJ1dGVzIHRvIGxpbmtzIGFuZCBlbGVtZW50c1xuICAgKiBzZXRzIGEgbWluIGhlaWdodCB0byBwcmV2ZW50IGNvbnRlbnQganVtcGluZ1xuICAgKiB3cmFwcyB0aGUgZWxlbWVudCBpZiBub3QgYWxyZWFkeSB3cmFwcGVkXG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX3ByZXBhcmVNZW51KCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgLy8gaWYoIXRoaXMub3B0aW9ucy5ob2xkT3Blbil7XG4gICAgLy8gICB0aGlzLl9tZW51TGlua0V2ZW50cygpO1xuICAgIC8vIH1cbiAgICB0aGlzLiRzdWJtZW51QW5jaG9ycy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xuICAgICAgdmFyICRzdWIgPSAkbGluay5wYXJlbnQoKTtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMucGFyZW50TGluayl7XG4gICAgICAgICRsaW5rLmNsb25lKCkucHJlcGVuZFRvKCRzdWIuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykpLndyYXAoJzxsaSBjbGFzcz1cImlzLXN1Ym1lbnUtcGFyZW50LWl0ZW0gaXMtc3VibWVudS1pdGVtIGlzLWRyaWxsZG93bi1zdWJtZW51LWl0ZW1cIiByb2xlPVwibWVudS1pdGVtXCI+PC9saT4nKTtcbiAgICAgIH1cbiAgICAgICRsaW5rLmRhdGEoJ3NhdmVkSHJlZicsICRsaW5rLmF0dHIoJ2hyZWYnKSkucmVtb3ZlQXR0cignaHJlZicpLmF0dHIoJ3RhYmluZGV4JywgMCk7XG4gICAgICAkbGluay5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKVxuICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAgICAgICAndGFiaW5kZXgnOiAwLFxuICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcbiAgICAgICAgICB9KTtcbiAgICAgIF90aGlzLl9ldmVudHMoJGxpbmspO1xuICAgIH0pO1xuICAgIHRoaXMuJHN1Ym1lbnVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciAkbWVudSA9ICQodGhpcyksXG4gICAgICAgICAgJGJhY2sgPSAkbWVudS5maW5kKCcuanMtZHJpbGxkb3duLWJhY2snKTtcbiAgICAgIGlmKCEkYmFjay5sZW5ndGgpe1xuICAgICAgICBzd2l0Y2ggKF90aGlzLm9wdGlvbnMuYmFja0J1dHRvblBvc2l0aW9uKSB7XG4gICAgICAgICAgY2FzZSBcImJvdHRvbVwiOlxuICAgICAgICAgICAgJG1lbnUuYXBwZW5kKF90aGlzLm9wdGlvbnMuYmFja0J1dHRvbik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidG9wXCI6XG4gICAgICAgICAgICAkbWVudS5wcmVwZW5kKF90aGlzLm9wdGlvbnMuYmFja0J1dHRvbik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuc3VwcG9ydGVkIGJhY2tCdXR0b25Qb3NpdGlvbiB2YWx1ZSAnXCIgKyBfdGhpcy5vcHRpb25zLmJhY2tCdXR0b25Qb3NpdGlvbiArIFwiJ1wiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgX3RoaXMuX2JhY2soJG1lbnUpO1xuICAgIH0pO1xuXG4gICAgaWYoIXRoaXMub3B0aW9ucy5hdXRvSGVpZ2h0KSB7XG4gICAgICB0aGlzLiRzdWJtZW51cy5hZGRDbGFzcygnZHJpbGxkb3duLXN1Ym1lbnUtY292ZXItcHJldmlvdXMnKTtcbiAgICB9XG5cbiAgICBpZighdGhpcy4kZWxlbWVudC5wYXJlbnQoKS5oYXNDbGFzcygnaXMtZHJpbGxkb3duJykpe1xuICAgICAgdGhpcy4kd3JhcHBlciA9ICQodGhpcy5vcHRpb25zLndyYXBwZXIpLmFkZENsYXNzKCdpcy1kcmlsbGRvd24nKTtcbiAgICAgIGlmKHRoaXMub3B0aW9ucy5hbmltYXRlSGVpZ2h0KSB0aGlzLiR3cmFwcGVyLmFkZENsYXNzKCdhbmltYXRlLWhlaWdodCcpO1xuICAgICAgdGhpcy4kd3JhcHBlciA9IHRoaXMuJGVsZW1lbnQud3JhcCh0aGlzLiR3cmFwcGVyKS5wYXJlbnQoKS5jc3ModGhpcy5fZ2V0TWF4RGltcygpKTtcbiAgICB9XG4gIH1cblxuICBfcmVzaXplKCkge1xuICAgIHRoaXMuJHdyYXBwZXIuY3NzKHsnbWF4LXdpZHRoJzogJ25vbmUnLCAnbWluLWhlaWdodCc6ICdub25lJ30pO1xuICAgIC8vIF9nZXRNYXhEaW1zIGhhcyBzaWRlIGVmZmVjdHMgKGJvbykgYnV0IGNhbGxpbmcgaXQgc2hvdWxkIHVwZGF0ZSBhbGwgb3RoZXIgbmVjZXNzYXJ5IGhlaWdodHMgJiB3aWR0aHNcbiAgICB0aGlzLiR3cmFwcGVyLmNzcyh0aGlzLl9nZXRNYXhEaW1zKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgdG8gZWxlbWVudHMgaW4gdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBtZW51IGl0ZW0gdG8gYWRkIGhhbmRsZXJzIHRvLlxuICAgKi9cbiAgX2V2ZW50cygkZWxlbSkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkZWxlbS5vZmYoJ2NsaWNrLnpmLmRyaWxsZG93bicpXG4gICAgLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgIGlmKCQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnbGknKS5oYXNDbGFzcygnaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50Jykpe1xuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIGlmKGUudGFyZ2V0ICE9PSBlLmN1cnJlbnRUYXJnZXQuZmlyc3RFbGVtZW50Q2hpbGQpe1xuICAgICAgLy8gICByZXR1cm4gZmFsc2U7XG4gICAgICAvLyB9XG4gICAgICBfdGhpcy5fc2hvdygkZWxlbS5wYXJlbnQoJ2xpJykpO1xuXG4gICAgICBpZihfdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayl7XG4gICAgICAgIHZhciAkYm9keSA9ICQoJ2JvZHknKTtcbiAgICAgICAgJGJvZHkub2ZmKCcuemYuZHJpbGxkb3duJykub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICAgIGlmIChlLnRhcmdldCA9PT0gX3RoaXMuJGVsZW1lbnRbMF0gfHwgJC5jb250YWlucyhfdGhpcy4kZWxlbWVudFswXSwgZS50YXJnZXQpKSB7IHJldHVybjsgfVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy5faGlkZUFsbCgpO1xuICAgICAgICAgICRib2R5Lm9mZignLnpmLmRyaWxsZG93bicpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblx0ICB0aGlzLiRlbGVtZW50Lm9uKCdtdXRhdGVtZS56Zi50cmlnZ2VyJywgdGhpcy5fcmVzaXplLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIG1lbnUgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVnaXN0ZXJFdmVudHMoKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLnNjcm9sbFRvcCl7XG4gICAgICB0aGlzLl9iaW5kSGFuZGxlciA9IHRoaXMuX3Njcm9sbFRvcC5iaW5kKHRoaXMpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbignb3Blbi56Zi5kcmlsbGRvd24gaGlkZS56Zi5kcmlsbGRvd24gY2xvc2VkLnpmLmRyaWxsZG93bicsdGhpcy5fYmluZEhhbmRsZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTY3JvbGwgdG8gVG9wIG9mIEVsZW1lbnQgb3IgZGF0YS1zY3JvbGwtdG9wLWVsZW1lbnRcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jc2Nyb2xsbWVcbiAgICovXG4gIF9zY3JvbGxUb3AoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgJHNjcm9sbFRvcEVsZW1lbnQgPSBfdGhpcy5vcHRpb25zLnNjcm9sbFRvcEVsZW1lbnQhPScnPyQoX3RoaXMub3B0aW9ucy5zY3JvbGxUb3BFbGVtZW50KTpfdGhpcy4kZWxlbWVudCxcbiAgICAgICAgc2Nyb2xsUG9zID0gcGFyc2VJbnQoJHNjcm9sbFRvcEVsZW1lbnQub2Zmc2V0KCkudG9wK190aGlzLm9wdGlvbnMuc2Nyb2xsVG9wT2Zmc2V0KTtcbiAgICAkKCdodG1sLCBib2R5Jykuc3RvcCh0cnVlKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiBzY3JvbGxQb3MgfSwgX3RoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbiwgX3RoaXMub3B0aW9ucy5hbmltYXRpb25FYXNpbmcsZnVuY3Rpb24oKXtcbiAgICAgIC8qKlxuICAgICAgICAqIEZpcmVzIGFmdGVyIHRoZSBtZW51IGhhcyBzY3JvbGxlZFxuICAgICAgICAqIEBldmVudCBEcmlsbGRvd24jc2Nyb2xsbWVcbiAgICAgICAgKi9cbiAgICAgIGlmKHRoaXM9PT0kKCdodG1sJylbMF0pX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignc2Nyb2xsbWUuemYuZHJpbGxkb3duJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBrZXlkb3duIGV2ZW50IGxpc3RlbmVyIHRvIGBsaWAncyBpbiB0aGUgbWVudS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9rZXlib2FyZEV2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kbWVudUl0ZW1zLmFkZCh0aGlzLiRlbGVtZW50LmZpbmQoJy5qcy1kcmlsbGRvd24tYmFjayA+IGEsIC5pcy1zdWJtZW51LXBhcmVudC1pdGVtID4gYScpKS5vbigna2V5ZG93bi56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQodGhpcyksXG4gICAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKS5jaGlsZHJlbignbGknKS5jaGlsZHJlbignYScpLFxuICAgICAgICAgICRwcmV2RWxlbWVudCxcbiAgICAgICAgICAkbmV4dEVsZW1lbnQ7XG5cbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICAgICAgaWYgKCQodGhpcykuaXMoJGVsZW1lbnQpKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpO1xuICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcmlsbGRvd24nLCB7XG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbWVudC5wYXJlbnQoJ2xpJykpO1xuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykuZmluZCgndWwgbGkgYScpLmZpbHRlcihfdGhpcy4kbWVudUl0ZW1zKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykpO1xuICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbWVudCksIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKS5jaGlsZHJlbignYScpLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICAgIH0sIDEpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICB1cDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50LmZvY3VzKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGRvd246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5mb2N1cygpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBjbG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3RoaXMuX2JhY2soKTtcbiAgICAgICAgICAvL190aGlzLiRtZW51SXRlbXMuZmlyc3QoKS5mb2N1cygpOyAvLyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICghJGVsZW1lbnQuaXMoX3RoaXMuJG1lbnVJdGVtcykpIHsgLy8gbm90IG1lbnUgaXRlbSBtZWFucyBiYWNrIGJ1dHRvblxuICAgICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW1lbnQucGFyZW50KCdsaScpLnBhcmVudCgndWwnKSk7XG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgnbGknKS5wYXJlbnQoJ3VsJykucGFyZW50KCdsaScpLmNoaWxkcmVuKCdhJykuZmlyc3QoKS5mb2N1cygpO1xuICAgICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XG4gICAgICAgICAgICBfdGhpcy5fc2hvdygkZWxlbWVudC5wYXJlbnQoJ2xpJykpO1xuICAgICAgICAgICAgJGVsZW1lbnQucGFyZW50KCdsaScpLm9uZShGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAkZWxlbWVudC5wYXJlbnQoJ2xpJykuZmluZCgndWwgbGkgYScpLmZpbHRlcihfdGhpcy4kbWVudUl0ZW1zKS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24ocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7IC8vIGVuZCBrZXlib2FyZEFjY2Vzc1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyBhbGwgb3BlbiBlbGVtZW50cywgYW5kIHJldHVybnMgdG8gcm9vdCBtZW51LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyaWxsZG93biNjbG9zZWRcbiAgICovXG4gIF9oaWRlQWxsKCkge1xuICAgIHZhciAkZWxlbSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWRyaWxsZG93bi1zdWJtZW51LmlzLWFjdGl2ZScpLmFkZENsYXNzKCdpcy1jbG9zaW5nJyk7XG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9IZWlnaHQpIHRoaXMuJHdyYXBwZXIuY3NzKHtoZWlnaHQ6JGVsZW0ucGFyZW50KCkuY2xvc2VzdCgndWwnKS5kYXRhKCdjYWxjSGVpZ2h0Jyl9KTtcbiAgICAkZWxlbS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtKSwgZnVuY3Rpb24oZSl7XG4gICAgICAkZWxlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlIGlzLWNsb3NpbmcnKTtcbiAgICB9KTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG1lbnUgaXMgZnVsbHkgY2xvc2VkLlxuICAgICAgICAgKiBAZXZlbnQgRHJpbGxkb3duI2Nsb3NlZFxuICAgICAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlZC56Zi5kcmlsbGRvd24nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVyIGZvciBlYWNoIGBiYWNrYCBidXR0b24sIGFuZCBjbG9zZXMgb3BlbiBtZW51cy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jYmFja1xuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBzdWItbWVudSB0byBhZGQgYGJhY2tgIGV2ZW50LlxuICAgKi9cbiAgX2JhY2soJGVsZW0pIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICRlbGVtLm9mZignY2xpY2suemYuZHJpbGxkb3duJyk7XG4gICAgJGVsZW0uY2hpbGRyZW4oJy5qcy1kcmlsbGRvd24tYmFjaycpXG4gICAgICAub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAvLyBjb25zb2xlLmxvZygnbW91c2V1cCBvbiBiYWNrJyk7XG4gICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcblxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBhIHBhcmVudCBzdWJtZW51LCBjYWxsIHNob3dcbiAgICAgICAgbGV0IHBhcmVudFN1Yk1lbnUgPSAkZWxlbS5wYXJlbnQoJ2xpJykucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKTtcbiAgICAgICAgaWYgKHBhcmVudFN1Yk1lbnUubGVuZ3RoKSB7XG4gICAgICAgICAgX3RoaXMuX3Nob3cocGFyZW50U3ViTWVudSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXIgdG8gbWVudSBpdGVtcyB3L28gc3VibWVudXMgdG8gY2xvc2Ugb3BlbiBtZW51cyBvbiBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbWVudUxpbmtFdmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLiRtZW51SXRlbXMubm90KCcuaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50JylcbiAgICAgICAgLm9mZignY2xpY2suemYuZHJpbGxkb3duJylcbiAgICAgICAgLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICAvLyBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIF90aGlzLl9oaWRlQWxsKCk7XG4gICAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyBhIHN1Ym1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgRHJpbGxkb3duI29wZW5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBvcGVuLCBpLmUuIHRoZSBgbGlgIHRhZy5cbiAgICovXG4gIF9zaG93KCRlbGVtKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9IZWlnaHQpIHRoaXMuJHdyYXBwZXIuY3NzKHtoZWlnaHQ6JGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykuZGF0YSgnY2FsY0hlaWdodCcpfSk7XG4gICAgJGVsZW0uYXR0cignYXJpYS1leHBhbmRlZCcsIHRydWUpO1xuICAgICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKS5hdHRyKCdhcmlhLWhpZGRlbicsIGZhbHNlKTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzdWJtZW51IGhhcyBvcGVuZWQuXG4gICAgICogQGV2ZW50IERyaWxsZG93biNvcGVuXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvcGVuLnpmLmRyaWxsZG93bicsIFskZWxlbV0pO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIaWRlcyBhIHN1Ym1lbnVcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jaGlkZVxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBzdWItbWVudSB0byBoaWRlLCBpLmUuIHRoZSBgdWxgIHRhZy5cbiAgICovXG4gIF9oaWRlKCRlbGVtKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9IZWlnaHQpIHRoaXMuJHdyYXBwZXIuY3NzKHtoZWlnaHQ6JGVsZW0ucGFyZW50KCkuY2xvc2VzdCgndWwnKS5kYXRhKCdjYWxjSGVpZ2h0Jyl9KTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICRlbGVtLnBhcmVudCgnbGknKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgZmFsc2UpO1xuICAgICRlbGVtLmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSkuYWRkQ2xhc3MoJ2lzLWNsb3NpbmcnKVxuICAgICRlbGVtLmFkZENsYXNzKCdpcy1jbG9zaW5nJylcbiAgICAgICAgIC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtKSwgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nJyk7XG4gICAgICAgICAgICRlbGVtLmJsdXIoKTtcbiAgICAgICAgIH0pO1xuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHN1Ym1lbnUgaGFzIGNsb3NlZC5cbiAgICAgKiBAZXZlbnQgRHJpbGxkb3duI2hpZGVcbiAgICAgKi9cbiAgICAkZWxlbS50cmlnZ2VyKCdoaWRlLnpmLmRyaWxsZG93bicsIFskZWxlbV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIG5lc3RlZCBtZW51cyB0byBjYWxjdWxhdGUgdGhlIG1pbi1oZWlnaHQsIGFuZCBtYXgtd2lkdGggZm9yIHRoZSBtZW51LlxuICAgKiBQcmV2ZW50cyBjb250ZW50IGp1bXBpbmcuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2dldE1heERpbXMoKSB7XG4gICAgdmFyICBtYXhIZWlnaHQgPSAwLCByZXN1bHQgPSB7fSwgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJHN1Ym1lbnVzLmFkZCh0aGlzLiRlbGVtZW50KS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgbnVtT2ZFbGVtcyA9ICQodGhpcykuY2hpbGRyZW4oJ2xpJykubGVuZ3RoO1xuICAgICAgdmFyIGhlaWdodCA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcykuaGVpZ2h0O1xuICAgICAgbWF4SGVpZ2h0ID0gaGVpZ2h0ID4gbWF4SGVpZ2h0ID8gaGVpZ2h0IDogbWF4SGVpZ2h0O1xuICAgICAgaWYoX3RoaXMub3B0aW9ucy5hdXRvSGVpZ2h0KSB7XG4gICAgICAgICQodGhpcykuZGF0YSgnY2FsY0hlaWdodCcsaGVpZ2h0KTtcbiAgICAgICAgaWYgKCEkKHRoaXMpLmhhc0NsYXNzKCdpcy1kcmlsbGRvd24tc3VibWVudScpKSByZXN1bHRbJ2hlaWdodCddID0gaGVpZ2h0O1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYoIXRoaXMub3B0aW9ucy5hdXRvSGVpZ2h0KSByZXN1bHRbJ21pbi1oZWlnaHQnXSA9IGAke21heEhlaWdodH1weGA7XG5cbiAgICByZXN1bHRbJ21heC13aWR0aCddID0gYCR7dGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aH1weGA7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBEcmlsbGRvd24gTWVudVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLnNjcm9sbFRvcCkgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5kcmlsbGRvd24nLHRoaXMuX2JpbmRIYW5kbGVyKTtcbiAgICB0aGlzLl9oaWRlQWxsKCk7XG5cdCAgdGhpcy4kZWxlbWVudC5vZmYoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJpbGxkb3duJyk7XG4gICAgdGhpcy4kZWxlbWVudC51bndyYXAoKVxuICAgICAgICAgICAgICAgICAuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrLCAuaXMtc3VibWVudS1wYXJlbnQtaXRlbScpLnJlbW92ZSgpXG4gICAgICAgICAgICAgICAgIC5lbmQoKS5maW5kKCcuaXMtYWN0aXZlLCAuaXMtY2xvc2luZywgLmlzLWRyaWxsZG93bi1zdWJtZW51JykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nIGlzLWRyaWxsZG93bi1zdWJtZW51JylcbiAgICAgICAgICAgICAgICAgLmVuZCgpLmZpbmQoJ1tkYXRhLXN1Ym1lbnVdJykucmVtb3ZlQXR0cignYXJpYS1oaWRkZW4gdGFiaW5kZXggcm9sZScpO1xuICAgIHRoaXMuJHN1Ym1lbnVBbmNob3JzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLm9mZignLnpmLmRyaWxsZG93bicpO1xuICAgIH0pO1xuXG4gICAgdGhpcy4kc3VibWVudXMucmVtb3ZlQ2xhc3MoJ2RyaWxsZG93bi1zdWJtZW51LWNvdmVyLXByZXZpb3VzJyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJGxpbmsgPSAkKHRoaXMpO1xuICAgICAgJGxpbmsucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgIGlmKCRsaW5rLmRhdGEoJ3NhdmVkSHJlZicpKXtcbiAgICAgICAgJGxpbmsuYXR0cignaHJlZicsICRsaW5rLmRhdGEoJ3NhdmVkSHJlZicpKS5yZW1vdmVEYXRhKCdzYXZlZEhyZWYnKTtcbiAgICAgIH1lbHNleyByZXR1cm47IH1cbiAgICB9KTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH07XG59XG5cbkRyaWxsZG93bi5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIE1hcmt1cCB1c2VkIGZvciBKUyBnZW5lcmF0ZWQgYmFjayBidXR0b24uIFByZXBlbmRlZCAgb3IgYXBwZW5kZWQgKHNlZSBiYWNrQnV0dG9uUG9zaXRpb24pIHRvIHN1Ym1lbnUgbGlzdHMgYW5kIGRlbGV0ZWQgb24gYGRlc3Ryb3lgIG1ldGhvZCwgJ2pzLWRyaWxsZG93bi1iYWNrJyBjbGFzcyByZXF1aXJlZC4gUmVtb3ZlIHRoZSBiYWNrc2xhc2ggKGBcXGApIGlmIGNvcHkgYW5kIHBhc3RpbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJzxcXGxpPjxcXGE+QmFjazxcXC9hPjxcXC9saT4nXG4gICAqL1xuICBiYWNrQnV0dG9uOiAnPGxpIGNsYXNzPVwianMtZHJpbGxkb3duLWJhY2tcIj48YSB0YWJpbmRleD1cIjBcIj5CYWNrPC9hPjwvbGk+JyxcbiAgLyoqXG4gICAqIFBvc2l0aW9uIHRoZSBiYWNrIGJ1dHRvbiBlaXRoZXIgYXQgdGhlIHRvcCBvciBib3R0b20gb2YgZHJpbGxkb3duIHN1Ym1lbnVzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGJvdHRvbVxuICAgKi9cbiAgYmFja0J1dHRvblBvc2l0aW9uOiAndG9wJyxcbiAgLyoqXG4gICAqIE1hcmt1cCB1c2VkIHRvIHdyYXAgZHJpbGxkb3duIG1lbnUuIFVzZSBhIGNsYXNzIG5hbWUgZm9yIGluZGVwZW5kZW50IHN0eWxpbmc7IHRoZSBKUyBhcHBsaWVkIGNsYXNzOiBgaXMtZHJpbGxkb3duYCBpcyByZXF1aXJlZC4gUmVtb3ZlIHRoZSBiYWNrc2xhc2ggKGBcXGApIGlmIGNvcHkgYW5kIHBhc3RpbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJzxcXGRpdiBjbGFzcz1cImlzLWRyaWxsZG93blwiPjxcXC9kaXY+J1xuICAgKi9cbiAgd3JhcHBlcjogJzxkaXY+PC9kaXY+JyxcbiAgLyoqXG4gICAqIEFkZHMgdGhlIHBhcmVudCBsaW5rIHRvIHRoZSBzdWJtZW51LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBwYXJlbnRMaW5rOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIHJldHVybiB0byByb290IGxpc3Qgb24gYm9keSBjbGljay5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBtZW51IHRvIGF1dG8gYWRqdXN0IGhlaWdodC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYXV0b0hlaWdodDogZmFsc2UsXG4gIC8qKlxuICAgKiBBbmltYXRlIHRoZSBhdXRvIGFkanVzdCBoZWlnaHQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGFuaW1hdGVIZWlnaHQ6IGZhbHNlLFxuICAvKipcbiAgICogU2Nyb2xsIHRvIHRoZSB0b3Agb2YgdGhlIG1lbnUgYWZ0ZXIgb3BlbmluZyBhIHN1Ym1lbnUgb3IgbmF2aWdhdGluZyBiYWNrIHVzaW5nIHRoZSBtZW51IGJhY2sgYnV0dG9uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIHNjcm9sbFRvcDogZmFsc2UsXG4gIC8qKlxuICAgKiBTdHJpbmcganF1ZXJ5IHNlbGVjdG9yIChmb3IgZXhhbXBsZSAnYm9keScpIG9mIGVsZW1lbnQgdG8gdGFrZSBvZmZzZXQoKS50b3AgZnJvbSwgaWYgZW1wdHkgc3RyaW5nIHRoZSBkcmlsbGRvd24gbWVudSBvZmZzZXQoKS50b3AgaXMgdGFrZW5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnJ1xuICAgKi9cbiAgc2Nyb2xsVG9wRWxlbWVudDogJycsXG4gIC8qKlxuICAgKiBTY3JvbGxUb3Agb2Zmc2V0XG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTAwXG4gICAqL1xuICBzY3JvbGxUb3BPZmZzZXQ6IDAsXG4gIC8qKlxuICAgKiBTY3JvbGwgYW5pbWF0aW9uIGR1cmF0aW9uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTAwXG4gICAqL1xuICBhbmltYXRpb25EdXJhdGlvbjogNTAwLFxuICAvKipcbiAgICogU2Nyb2xsIGFuaW1hdGlvbiBlYXNpbmdcbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc3dpbmcnXG4gICAqL1xuICBhbmltYXRpb25FYXNpbmc6ICdzd2luZydcbiAgLy8gaG9sZE9wZW46IGZhbHNlXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJpbGxkb3duLCAnRHJpbGxkb3duJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBEcm9wZG93biBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZHJvcGRvd25cbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKi9cblxuY2xhc3MgRHJvcGRvd24ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIGRyb3Bkb3duLlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duLlxuICAgKiAgICAgICAgT2JqZWN0IHNob3VsZCBiZSBvZiB0aGUgZHJvcGRvd24gcGFuZWwsIHJhdGhlciB0aGFuIGl0cyBhbmNob3IuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdEcm9wZG93bicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duJywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xuXG4gICAgdGhpcy4kYW5jaG9yID0gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkubGVuZ3RoID8gJChgW2RhdGEtdG9nZ2xlPVwiJHskaWR9XCJdYCkgOiAkKGBbZGF0YS1vcGVuPVwiJHskaWR9XCJdYCk7XG4gICAgdGhpcy4kYW5jaG9yLmF0dHIoe1xuICAgICAgJ2FyaWEtY29udHJvbHMnOiAkaWQsXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXG4gICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlXG5cbiAgICB9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5wYXJlbnRDbGFzcyl7XG4gICAgICB0aGlzLiRwYXJlbnQgPSB0aGlzLiRlbGVtZW50LnBhcmVudHMoJy4nICsgdGhpcy5vcHRpb25zLnBhcmVudENsYXNzKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuJHBhcmVudCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XG4gICAgdGhpcy5jb3VudGVyID0gNDtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ2FyaWEtaGlkZGVuJzogJ3RydWUnLFxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXG4gICAgICAnZGF0YS1yZXNpemUnOiAkaWQsXG4gICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogdGhpcy4kYW5jaG9yWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2RkLWFuY2hvcicpXG4gICAgfSk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH1cblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGRldGVybWluZSBjdXJyZW50IG9yaWVudGF0aW9uIG9mIGRyb3Bkb3duIHBhbmUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBwb3NpdGlvbiAtIHN0cmluZyB2YWx1ZSBvZiBhIHBvc2l0aW9uIGNsYXNzLlxuICAgKi9cbiAgZ2V0UG9zaXRpb25DbGFzcygpIHtcbiAgICB2YXIgdmVydGljYWxQb3NpdGlvbiA9IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8odG9wfGxlZnR8cmlnaHR8Ym90dG9tKS9nKTtcbiAgICAgICAgdmVydGljYWxQb3NpdGlvbiA9IHZlcnRpY2FsUG9zaXRpb24gPyB2ZXJ0aWNhbFBvc2l0aW9uWzBdIDogJyc7XG4gICAgdmFyIGhvcml6b250YWxQb3NpdGlvbiA9IC9mbG9hdC0oXFxTKykvLmV4ZWModGhpcy4kYW5jaG9yWzBdLmNsYXNzTmFtZSk7XG4gICAgICAgIGhvcml6b250YWxQb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvblsxXSA6ICcnO1xuICAgIHZhciBwb3NpdGlvbiA9IGhvcml6b250YWxQb3NpdGlvbiA/IGhvcml6b250YWxQb3NpdGlvbiArICcgJyArIHZlcnRpY2FsUG9zaXRpb24gOiB2ZXJ0aWNhbFBvc2l0aW9uO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkanVzdHMgdGhlIGRyb3Bkb3duIHBhbmVzIG9yaWVudGF0aW9uIGJ5IGFkZGluZy9yZW1vdmluZyBwb3NpdGlvbmluZyBjbGFzc2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb24gY2xhc3MgdG8gcmVtb3ZlLlxuICAgKi9cbiAgX3JlcG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMucHVzaChwb3NpdGlvbiA/IHBvc2l0aW9uIDogJ2JvdHRvbScpO1xuICAgIC8vZGVmYXVsdCwgdHJ5IHN3aXRjaGluZyB0byBvcHBvc2l0ZSBzaWRlXG4gICAgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd0b3AnKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3RvcCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1cblxuICAgIC8vaWYgZGVmYXVsdCBjaGFuZ2UgZGlkbid0IHdvcmssIHRyeSBib3R0b20gb3IgbGVmdCBmaXJzdFxuICAgIGVsc2UgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICd0b3AnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xuICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhwb3NpdGlvbik7XG4gICAgfVxuICAgIC8vaWYgbm90aGluZyBjbGVhcmVkLCBzZXQgdG8gYm90dG9tXG4gICAgZWxzZXtcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy5jb3VudGVyLS07XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgcG9zaXRpb24gYW5kIG9yaWVudGF0aW9uIG9mIHRoZSBkcm9wZG93biBwYW5lLCBjaGVja3MgZm9yIGNvbGxpc2lvbnMuXG4gICAqIFJlY3Vyc2l2ZWx5IGNhbGxzIGl0c2VsZiBpZiBhIGNvbGxpc2lvbiBpcyBkZXRlY3RlZCwgd2l0aCBhIG5ldyBwb3NpdGlvbiBjbGFzcy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0UG9zaXRpb24oKSB7XG4gICAgaWYodGhpcy4kYW5jaG9yLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ2ZhbHNlJyl7IHJldHVybiBmYWxzZTsgfVxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpLFxuICAgICAgICAkZWxlRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kZWxlbWVudCksXG4gICAgICAgICRhbmNob3JEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRhbmNob3IpLFxuICAgICAgICBfdGhpcyA9IHRoaXMsXG4gICAgICAgIGRpcmVjdGlvbiA9IChwb3NpdGlvbiA9PT0gJ2xlZnQnID8gJ2xlZnQnIDogKChwb3NpdGlvbiA9PT0gJ3JpZ2h0JykgPyAnbGVmdCcgOiAndG9wJykpLFxuICAgICAgICBwYXJhbSA9IChkaXJlY3Rpb24gPT09ICd0b3AnKSA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgb2Zmc2V0ID0gKHBhcmFtID09PSAnaGVpZ2h0JykgPyB0aGlzLm9wdGlvbnMudk9mZnNldCA6IHRoaXMub3B0aW9ucy5oT2Zmc2V0O1xuXG4gICAgaWYoKCRlbGVEaW1zLndpZHRoID49ICRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgpIHx8ICghdGhpcy5jb3VudGVyICYmICFGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KHRoaXMuJGVsZW1lbnQsIHRoaXMuJHBhcmVudCkpKXtcbiAgICAgIHZhciBuZXdXaWR0aCA9ICRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGgsXG4gICAgICAgICAgcGFyZW50SE9mZnNldCA9IDA7XG4gICAgICBpZih0aGlzLiRwYXJlbnQpe1xuICAgICAgICB2YXIgJHBhcmVudERpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJHBhcmVudCksXG4gICAgICAgICAgICBwYXJlbnRIT2Zmc2V0ID0gJHBhcmVudERpbXMub2Zmc2V0LmxlZnQ7XG4gICAgICAgIGlmICgkcGFyZW50RGltcy53aWR0aCA8IG5ld1dpZHRoKXtcbiAgICAgICAgICBuZXdXaWR0aCA9ICRwYXJlbnREaW1zLndpZHRoO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuJGVsZW1lbnQub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy4kZWxlbWVudCwgdGhpcy4kYW5jaG9yLCAnY2VudGVyIGJvdHRvbScsIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCArIHBhcmVudEhPZmZzZXQsIHRydWUpKS5jc3Moe1xuICAgICAgICAnd2lkdGgnOiBuZXdXaWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xuXG4gICAgd2hpbGUoIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCwgdGhpcy4kcGFyZW50LCB0cnVlKSAmJiB0aGlzLmNvdW50ZXIpe1xuICAgICAgdGhpcy5fcmVwb3NpdGlvbihwb3NpdGlvbik7XG4gICAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byB0aGUgZWxlbWVudCB1dGlsaXppbmcgdGhlIHRyaWdnZXJzIHV0aWxpdHkgbGlicmFyeS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IHRoaXMuX3NldFBvc2l0aW9uLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5ob3Zlcil7XG4gICAgICB0aGlzLiRhbmNob3Iub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxuICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGJvZHlEYXRhID0gJCgnYm9keScpLmRhdGEoKTtcbiAgICAgICAgaWYodHlwZW9mKGJvZHlEYXRhLndoYXRpbnB1dCkgPT09ICd1bmRlZmluZWQnIHx8IGJvZHlEYXRhLndoYXRpbnB1dCA9PT0gJ21vdXNlJykge1xuICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIHRydWUpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XG4gICAgICAgIH1cbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIGZhbHNlKTtcbiAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgIH0pO1xuICAgICAgaWYodGhpcy5vcHRpb25zLmhvdmVyUGFuZSl7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxuICAgICAgICAgICAgLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KF90aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xuICAgICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuJGFuY2hvci5hZGQodGhpcy4kZWxlbWVudCkub24oJ2tleWRvd24uemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKSB7XG5cbiAgICAgIHZhciAkdGFyZ2V0ID0gJCh0aGlzKSxcbiAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcblxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgJ0Ryb3Bkb3duJywge1xuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoJHRhcmdldC5pcyhfdGhpcy4kYW5jaG9yKSkge1xuICAgICAgICAgICAgX3RoaXMub3BlbigpO1xuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgIHZhciAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSkubm90KHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICAkYm9keS5vZmYoJ2NsaWNrLnpmLmRyb3Bkb3duJylcbiAgICAgICAgICAub24oJ2NsaWNrLnpmLmRyb3Bkb3duJywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgICBpZihfdGhpcy4kYW5jaG9yLmlzKGUudGFyZ2V0KSB8fCBfdGhpcy4kYW5jaG9yLmZpbmQoZS50YXJnZXQpLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICRib2R5Lm9mZignY2xpY2suemYuZHJvcGRvd24nKTtcbiAgICAgICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgZHJvcGRvd24gcGFuZSwgYW5kIGZpcmVzIGEgYnViYmxpbmcgZXZlbnQgdG8gY2xvc2Ugb3RoZXIgZHJvcGRvd25zLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyb3Bkb3duI2Nsb3NlbWVcbiAgICogQGZpcmVzIERyb3Bkb3duI3Nob3dcbiAgICovXG4gIG9wZW4oKSB7XG4gICAgLy8gdmFyIF90aGlzID0gdGhpcztcbiAgICAvKipcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBvdGhlciBvcGVuIGRyb3Bkb3duc1xuICAgICAqIEBldmVudCBEcm9wZG93biNjbG9zZW1lXG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLmRyb3Bkb3duJywgdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpKTtcbiAgICB0aGlzLiRhbmNob3IuYWRkQ2xhc3MoJ2hvdmVyJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogdHJ1ZX0pO1xuICAgIC8vIHRoaXMuJGVsZW1lbnQvKi5zaG93KCkqLztcbiAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xuICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5hdXRvRm9jdXMpe1xuICAgICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XG4gICAgICBpZigkZm9jdXNhYmxlLmxlbmd0aCl7XG4gICAgICAgICRmb2N1c2FibGUuZXEoMCkuZm9jdXMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZih0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy50cmFwRm9jdXMpIHtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQudHJhcEZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZpcmVzIG9uY2UgdGhlIGRyb3Bkb3duIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duI3Nob3dcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Nob3cuemYuZHJvcGRvd24nLCBbdGhpcy4kZWxlbWVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgb3BlbiBkcm9wZG93biBwYW5lLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIERyb3Bkb3duI2hpZGVcbiAgICovXG4gIGNsb3NlKCkge1xuICAgIGlmKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKCdpcy1vcGVuJylcbiAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcblxuICAgIHRoaXMuJGFuY2hvci5yZW1vdmVDbGFzcygnaG92ZXInKVxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcblxuICAgIGlmKHRoaXMuY2xhc3NDaGFuZ2VkKXtcbiAgICAgIHZhciBjdXJQb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XG4gICAgICBpZihjdXJQb3NpdGlvbkNsYXNzKXtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyhjdXJQb3NpdGlvbkNsYXNzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MpXG4gICAgICAgICAgLyouaGlkZSgpKi8uY3NzKHtoZWlnaHQ6ICcnLCB3aWR0aDogJyd9KTtcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XG4gICAgICB0aGlzLmNvdW50ZXIgPSA0O1xuICAgICAgdGhpcy51c2VkUG9zaXRpb25zLmxlbmd0aCA9IDA7XG4gICAgfVxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykge1xuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWxlYXNlRm9jdXModGhpcy4kZWxlbWVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGRyb3Bkb3duIHBhbmUncyB2aXNpYmlsaXR5LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xuICAgICAgaWYodGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJykpIHJldHVybjtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgZHJvcGRvd24uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXInKS5oaWRlKCk7XG4gICAgdGhpcy4kYW5jaG9yLm9mZignLnpmLmRyb3Bkb3duJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuRHJvcGRvd24uZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBDbGFzcyB0aGF0IGRlc2lnbmF0ZXMgYm91bmRpbmcgY29udGFpbmVyIG9mIERyb3Bkb3duIChEZWZhdWx0OiB3aW5kb3cpXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2Ryb3Bkb3duLXBhcmVudCdcbiAgICovXG4gIHBhcmVudENsYXNzOiBudWxsLFxuICAvKipcbiAgICogQW1vdW50IG9mIHRpbWUgdG8gZGVsYXkgb3BlbmluZyBhIHN1Ym1lbnUgb24gaG92ZXIgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMjUwXG4gICAqL1xuICBob3ZlckRlbGF5OiAyNTAsXG4gIC8qKlxuICAgKiBBbGxvdyBzdWJtZW51cyB0byBvcGVuIG9uIGhvdmVyIGV2ZW50c1xuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBob3ZlcjogZmFsc2UsXG4gIC8qKlxuICAgKiBEb24ndCBjbG9zZSBkcm9wZG93biB3aGVuIGhvdmVyaW5nIG92ZXIgZHJvcGRvd24gcGFuZVxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGhvdmVyUGFuZTogZmFsc2UsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIGJldHdlZW4gdGhlIGRyb3Bkb3duIHBhbmUgYW5kIHRoZSB0cmlnZ2VyaW5nIGVsZW1lbnQgb24gb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxXG4gICAqL1xuICB2T2Zmc2V0OiAxLFxuICAvKipcbiAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgaE9mZnNldDogMSxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gYWRqdXN0IG9wZW4gcG9zaXRpb24uIEpTIHdpbGwgdGVzdCBhbmQgZmlsbCB0aGlzIGluLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0b3AnXG4gICAqL1xuICBwb3NpdGlvbkNsYXNzOiAnJyxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gdHJhcCBmb2N1cyB0byB0aGUgZHJvcGRvd24gcGFuZSBpZiBvcGVuZWQgd2l0aCBrZXlib2FyZCBjb21tYW5kcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgdHJhcEZvY3VzOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93IHRoZSBwbHVnaW4gdG8gc2V0IGZvY3VzIHRvIHRoZSBmaXJzdCBmb2N1c2FibGUgZWxlbWVudCB3aXRoaW4gdGhlIHBhbmUsIHJlZ2FyZGxlc3Mgb2YgbWV0aG9kIG9mIG9wZW5pbmcuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgYXV0b0ZvY3VzOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyBhIGNsaWNrIG9uIHRoZSBib2R5IHRvIGNsb3NlIHRoZSBkcm9wZG93bi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrOiBmYWxzZVxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRHJvcGRvd24sICdEcm9wZG93bicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogRHJvcGRvd25NZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93bi1tZW51XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmJveFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XG4gKi9cblxuY2xhc3MgRHJvcGRvd25NZW51IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRHJvcGRvd25NZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duTWVudS5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XG4gICAgdGhpcy5faW5pdCgpO1xuXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzLCAnRHJvcGRvd25NZW51Jyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignRHJvcGRvd25NZW51Jywge1xuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnLFxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luLCBhbmQgY2FsbHMgX3ByZXBhcmVNZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIHN1YnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XG4gICAgdGhpcy4kZWxlbWVudC5jaGlsZHJlbignLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3MoJ2ZpcnN0LXN1YicpO1xuXG4gICAgdGhpcy4kbWVudUl0ZW1zID0gdGhpcy4kZWxlbWVudC5maW5kKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XG4gICAgdGhpcy4kdGFicyA9IHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcbiAgICB0aGlzLiR0YWJzLmZpbmQoJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKS5hZGRDbGFzcyh0aGlzLm9wdGlvbnMudmVydGljYWxDbGFzcyk7XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMucmlnaHRDbGFzcykgfHwgdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ3JpZ2h0JyB8fCBGb3VuZGF0aW9uLnJ0bCgpIHx8IHRoaXMuJGVsZW1lbnQucGFyZW50cygnLnRvcC1iYXItcmlnaHQnKS5pcygnKicpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID0gJ3JpZ2h0JztcbiAgICAgIHN1YnMuYWRkQ2xhc3MoJ29wZW5zLWxlZnQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3Vicy5hZGRDbGFzcygnb3BlbnMtcmlnaHQnKTtcbiAgICB9XG4gICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG4gIH07XG5cbiAgX2lzVmVydGljYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHRhYnMuY3NzKCdkaXNwbGF5JykgPT09ICdibG9jayc7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gZWxlbWVudHMgd2l0aGluIHRoZSBtZW51XG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBoYXNUb3VjaCA9ICdvbnRvdWNoc3RhcnQnIGluIHdpbmRvdyB8fCAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgIT09ICd1bmRlZmluZWQnKSxcbiAgICAgICAgcGFyQ2xhc3MgPSAnaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnO1xuXG4gICAgLy8gdXNlZCBmb3Igb25DbGljayBhbmQgaW4gdGhlIGtleWJvYXJkIGhhbmRsZXJzXG4gICAgdmFyIGhhbmRsZUNsaWNrRm4gPSBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJGVsZW0gPSAkKGUudGFyZ2V0KS5wYXJlbnRzVW50aWwoJ3VsJywgYC4ke3BhckNsYXNzfWApLFxuICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcbiAgICAgICAgICBoYXNDbGlja2VkID0gJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScsXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpO1xuXG4gICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgIGlmIChoYXNDbGlja2VkKSB7XG4gICAgICAgICAgaWYgKCFfdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayB8fCAoIV90aGlzLm9wdGlvbnMuY2xpY2tPcGVuICYmICFoYXNUb3VjaCkgfHwgKF90aGlzLm9wdGlvbnMuZm9yY2VGb2xsb3cgJiYgaGFzVG91Y2gpKSB7IHJldHVybjsgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW0uYWRkKCRlbGVtLnBhcmVudHNVbnRpbChfdGhpcy4kZWxlbWVudCwgYC4ke3BhckNsYXNzfWApKS5hdHRyKCdkYXRhLWlzLWNsaWNrJywgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja09wZW4gfHwgaGFzVG91Y2gpIHtcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignY2xpY2suemYuZHJvcGRvd25tZW51IHRvdWNoc3RhcnQuemYuZHJvcGRvd25tZW51JywgaGFuZGxlQ2xpY2tGbik7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIExlYWYgZWxlbWVudCBDbGlja3NcbiAgICBpZihfdGhpcy5vcHRpb25zLmNsb3NlT25DbGlja0luc2lkZSl7XG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ2NsaWNrLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG4gICAgICAgIGlmKCFoYXNTdWIpe1xuICAgICAgICAgIF90aGlzLl9oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcikge1xuICAgICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyICRlbGVtID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcblxuICAgICAgICBpZiAoaGFzU3ViKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KCRlbGVtLmRhdGEoJ19kZWxheScpKTtcbiAgICAgICAgICAkZWxlbS5kYXRhKCdfZGVsYXknLCBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSkpO1xuICAgICAgICB9XG4gICAgICB9KS5vbignbW91c2VsZWF2ZS56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgICBoYXNTdWIgPSAkZWxlbS5oYXNDbGFzcyhwYXJDbGFzcyk7XG4gICAgICAgIGlmIChoYXNTdWIgJiYgX3RoaXMub3B0aW9ucy5hdXRvY2xvc2UpIHtcbiAgICAgICAgICBpZiAoJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScgJiYgX3RoaXMub3B0aW9ucy5jbGlja09wZW4pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgICBjbGVhclRpbWVvdXQoJGVsZW0uZGF0YSgnX2RlbGF5JykpO1xuICAgICAgICAgICRlbGVtLmRhdGEoJ19kZWxheScsIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5jbG9zaW5nVGltZSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy4kbWVudUl0ZW1zLm9uKCdrZXlkb3duLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxuICAgICAgICAgIGlzVGFiID0gX3RoaXMuJHRhYnMuaW5kZXgoJGVsZW1lbnQpID4gLTEsXG4gICAgICAgICAgJGVsZW1lbnRzID0gaXNUYWIgPyBfdGhpcy4kdGFicyA6ICRlbGVtZW50LnNpYmxpbmdzKCdsaScpLmFkZCgkZWxlbWVudCksXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxuICAgICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaS0xKTtcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2YXIgbmV4dFNpYmxpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5jaGlsZHJlbignYTpmaXJzdCcpLmZvY3VzKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICB9LCBwcmV2U2libGluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkcHJldkVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciAkc3ViID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3VsLmlzLWRyb3Bkb3duLXN1Ym1lbnUnKTtcbiAgICAgICAgaWYgKCRzdWIubGVuZ3RoKSB7XG4gICAgICAgICAgX3RoaXMuX3Nob3coJHN1Yik7XG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH0gZWxzZSB7IHJldHVybjsgfVxuICAgICAgfSwgY2xvc2VTdWIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9pZiAoJGVsZW1lbnQuaXMoJzpmaXJzdC1jaGlsZCcpKSB7XG4gICAgICAgIHZhciBjbG9zZSA9ICRlbGVtZW50LnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJyk7XG4gICAgICAgIGNsb3NlLmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcbiAgICAgICAgX3RoaXMuX2hpZGUoY2xvc2UpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIC8vfVxuICAgICAgfTtcbiAgICAgIHZhciBmdW5jdGlvbnMgPSB7XG4gICAgICAgIG9wZW46IG9wZW5TdWIsXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy5faGlkZShfdGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgX3RoaXMuJG1lbnVJdGVtcy5maW5kKCdhOmZpcnN0JykuZm9jdXMoKTsgLy8gZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgaWYgKGlzVGFiKSB7XG4gICAgICAgIGlmIChfdGhpcy5faXNWZXJ0aWNhbCgpKSB7IC8vIHZlcnRpY2FsIG1lbnVcbiAgICAgICAgICBpZiAoRm91bmRhdGlvbi5ydGwoKSkgeyAvLyByaWdodCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2UgeyAvLyBsZWZ0IGFsaWduZWRcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcbiAgICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxuICAgICAgICAgICAgICBwcmV2aW91czogY2xvc2VTdWJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgLy8gaG9yaXpvbnRhbCBtZW51XG4gICAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XG4gICAgICAgICAgICAgIG5leHQ6IHByZXZTaWJsaW5nLFxuICAgICAgICAgICAgICBwcmV2aW91czogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIGRvd246IG9wZW5TdWIsXG4gICAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHsgLy8gbGVmdCBhbGlnbmVkXG4gICAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcbiAgICAgICAgICAgICAgbmV4dDogbmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBwcmV2U2libGluZyxcbiAgICAgICAgICAgICAgZG93bjogb3BlblN1YixcbiAgICAgICAgICAgICAgdXA6IGNsb3NlU3ViXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7IC8vIG5vdCB0YWJzIC0+IG9uZSBzdWJcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIHsgLy8gcmlnaHQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXG4gICAgICAgICAgICBwcmV2aW91czogb3BlblN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IC8vIGxlZnQgYWxpZ25lZFxuICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcbiAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YixcbiAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdEcm9wZG93bk1lbnUnLCBmdW5jdGlvbnMpO1xuXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhbiBldmVudCBoYW5kbGVyIHRvIHRoZSBib2R5IHRvIGNsb3NlIGFueSBkcm9wZG93bnMgb24gYSBjbGljay5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfYWRkQm9keUhhbmRsZXIoKSB7XG4gICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KSxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuICAgICRib2R5Lm9mZignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JylcbiAgICAgICAgIC5vbignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICB2YXIgJGxpbmsgPSBfdGhpcy4kZWxlbWVudC5maW5kKGUudGFyZ2V0KTtcbiAgICAgICAgICAgaWYgKCRsaW5rLmxlbmd0aCkgeyByZXR1cm47IH1cblxuICAgICAgICAgICBfdGhpcy5faGlkZSgpO1xuICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpO1xuICAgICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgYSBkcm9wZG93biBwYW5lLCBhbmQgY2hlY2tzIGZvciBjb2xsaXNpb25zIGZpcnN0LlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHN1YiAtIHVsIGVsZW1lbnQgdGhhdCBpcyBhIHN1Ym1lbnUgdG8gc2hvd1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQGZpcmVzIERyb3Bkb3duTWVudSNzaG93XG4gICAqL1xuICBfc2hvdygkc3ViKSB7XG4gICAgdmFyIGlkeCA9IHRoaXMuJHRhYnMuaW5kZXgodGhpcy4kdGFicy5maWx0ZXIoZnVuY3Rpb24oaSwgZWwpIHtcbiAgICAgIHJldHVybiAkKGVsKS5maW5kKCRzdWIpLmxlbmd0aCA+IDA7XG4gICAgfSkpO1xuICAgIHZhciAkc2licyA9ICRzdWIucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLnNpYmxpbmdzKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xuICAgIHRoaXMuX2hpZGUoJHNpYnMsIGlkeCk7XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJykuYWRkQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpXG4gICAgICAgIC5wYXJlbnQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIHZhciBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgaWYgKCFjbGVhcikge1xuICAgICAgdmFyIG9sZENsYXNzID0gdGhpcy5vcHRpb25zLmFsaWdubWVudCA9PT0gJ2xlZnQnID8gJy1yaWdodCcgOiAnLWxlZnQnLFxuICAgICAgICAgICRwYXJlbnRMaSA9ICRzdWIucGFyZW50KCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcbiAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMke29sZENsYXNzfWApLmFkZENsYXNzKGBvcGVucy0ke3RoaXMub3B0aW9ucy5hbGlnbm1lbnR9YCk7XG4gICAgICBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XG4gICAgICBpZiAoIWNsZWFyKSB7XG4gICAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcyhgb3BlbnMtJHt0aGlzLm9wdGlvbnMuYWxpZ25tZW50fWApLmFkZENsYXNzKCdvcGVucy1pbm5lcicpO1xuICAgICAgfVxuICAgICAgdGhpcy5jaGFuZ2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spIHsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG5ldyBkcm9wZG93biBwYW5lIGlzIHZpc2libGUuXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XG4gICAgICovXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzaG93LnpmLmRyb3Bkb3dubWVudScsIFskc3ViXSk7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gZWxlbWVudCB3aXRoIGEgc3VibWVudSB0byBoaWRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaGlkZSgkZWxlbSwgaWR4KSB7XG4gICAgdmFyICR0b0Nsb3NlO1xuICAgIGlmICgkZWxlbSAmJiAkZWxlbS5sZW5ndGgpIHtcbiAgICAgICR0b0Nsb3NlID0gJGVsZW07XG4gICAgfSBlbHNlIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiR0YWJzLm5vdChmdW5jdGlvbihpLCBlbCkge1xuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgJHRvQ2xvc2UgPSB0aGlzLiRlbGVtZW50O1xuICAgIH1cbiAgICB2YXIgc29tZXRoaW5nVG9DbG9zZSA9ICR0b0Nsb3NlLmhhc0NsYXNzKCdpcy1hY3RpdmUnKSB8fCAkdG9DbG9zZS5maW5kKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMDtcblxuICAgIGlmIChzb21ldGhpbmdUb0Nsb3NlKSB7XG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xuICAgICAgICAnZGF0YS1pcy1jbGljayc6IGZhbHNlXG4gICAgICB9KS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG5cbiAgICAgICR0b0Nsb3NlLmZpbmQoJ3VsLmpzLWRyb3Bkb3duLWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKTtcblxuICAgICAgaWYgKHRoaXMuY2hhbmdlZCB8fCAkdG9DbG9zZS5maW5kKCdvcGVucy1pbm5lcicpLmxlbmd0aCkge1xuICAgICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmFkZCgkdG9DbG9zZSlcbiAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoYG9wZW5zLWlubmVyIG9wZW5zLSR7dGhpcy5vcHRpb25zLmFsaWdubWVudH1gKVxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcyhgb3BlbnMtJHtvbGRDbGFzc31gKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9wZW4gbWVudXMgYXJlIGNsb3NlZC5cbiAgICAgICAqIEBldmVudCBEcm9wZG93bk1lbnUjaGlkZVxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYuZHJvcGRvd25tZW51JywgWyR0b0Nsb3NlXSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBwbHVnaW4uXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRtZW51SXRlbXMub2ZmKCcuemYuZHJvcGRvd25tZW51JykucmVtb3ZlQXR0cignZGF0YS1pcy1jbGljaycpXG4gICAgICAgIC5yZW1vdmVDbGFzcygnaXMtcmlnaHQtYXJyb3cgaXMtbGVmdC1hcnJvdyBpcy1kb3duLWFycm93IG9wZW5zLXJpZ2h0IG9wZW5zLWxlZnQgb3BlbnMtaW5uZXInKTtcbiAgICAkKGRvY3VtZW50LmJvZHkpLm9mZignLnpmLmRyb3Bkb3dubWVudScpO1xuICAgIEZvdW5kYXRpb24uTmVzdC5CdXJuKHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5Ecm9wZG93bk1lbnUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBEaXNhbGxvd3MgaG92ZXIgZXZlbnRzIGZyb20gb3BlbmluZyBzdWJtZW51c1xuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkaXNhYmxlSG92ZXI6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3cgYSBzdWJtZW51IHRvIGF1dG9tYXRpY2FsbHkgY2xvc2Ugb24gYSBtb3VzZWxlYXZlIGV2ZW50LCBpZiBub3QgY2xpY2tlZCBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGF1dG9jbG9zZTogdHJ1ZSxcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwXG4gICAqL1xuICBob3ZlckRlbGF5OiA1MCxcbiAgLyoqXG4gICAqIEFsbG93IGEgc3VibWVudSB0byBvcGVuL3JlbWFpbiBvcGVuIG9uIHBhcmVudCBjbGljayBldmVudC4gQWxsb3dzIGN1cnNvciB0byBtb3ZlIGF3YXkgZnJvbSBtZW51LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsaWNrT3BlbjogZmFsc2UsXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBjbG9zaW5nIGEgc3VibWVudSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgNTAwXG4gICAqL1xuXG4gIGNsb3NpbmdUaW1lOiA1MDAsXG4gIC8qKlxuICAgKiBQb3NpdGlvbiBvZiB0aGUgbWVudSByZWxhdGl2ZSB0byB3aGF0IGRpcmVjdGlvbiB0aGUgc3VibWVudXMgc2hvdWxkIG9wZW4uIEhhbmRsZWQgYnkgSlMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2xlZnQnXG4gICAqL1xuICBhbGlnbm1lbnQ6ICdsZWZ0JyxcbiAgLyoqXG4gICAqIEFsbG93IGNsaWNrcyBvbiB0aGUgYm9keSB0byBjbG9zZSBhbnkgb3BlbiBzdWJtZW51cy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvdyBjbGlja3Mgb24gbGVhZiBhbmNob3IgbGlua3MgdG8gY2xvc2UgYW55IG9wZW4gc3VibWVudXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xvc2VPbkNsaWNrSW5zaWRlOiB0cnVlLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB2ZXJ0aWNhbCBvcmllbnRlZCBtZW51cywgRm91bmRhdGlvbiBkZWZhdWx0IGlzIGB2ZXJ0aWNhbGAuIFVwZGF0ZSB0aGlzIGlmIHVzaW5nIHlvdXIgb3duIGNsYXNzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd2ZXJ0aWNhbCdcbiAgICovXG4gIHZlcnRpY2FsQ2xhc3M6ICd2ZXJ0aWNhbCcsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHJpZ2h0LXNpZGUgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgYWxpZ24tcmlnaHRgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnYWxpZ24tcmlnaHQnXG4gICAqL1xuICByaWdodENsYXNzOiAnYWxpZ24tcmlnaHQnLFxuICAvKipcbiAgICogQm9vbGVhbiB0byBmb3JjZSBvdmVyaWRlIHRoZSBjbGlja2luZyBvZiBsaW5rcyB0byBwZXJmb3JtIGRlZmF1bHQgYWN0aW9uLCBvbiBzZWNvbmQgdG91Y2ggZXZlbnQgZm9yIG1vYmlsZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZm9yY2VGb2xsb3c6IHRydWVcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93bk1lbnUsICdEcm9wZG93bk1lbnUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIEVxdWFsaXplciBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uZXF1YWxpemVyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1lZGlhUXVlcnlcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudGltZXJBbmRJbWFnZUxvYWRlciBpZiBlcXVhbGl6ZXIgY29udGFpbnMgaW1hZ2VzXG4gKi9cblxuY2xhc3MgRXF1YWxpemVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIEVxdWFsaXplciNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpe1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgRXF1YWxpemVyLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdFcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgRXF1YWxpemVyIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBlcUlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLWVxdWFsaXplcicpIHx8ICcnO1xuICAgIHZhciAkd2F0Y2hlZCA9IHRoaXMuJGVsZW1lbnQuZmluZChgW2RhdGEtZXF1YWxpemVyLXdhdGNoPVwiJHtlcUlkfVwiXWApO1xuXG4gICAgdGhpcy4kd2F0Y2hlZCA9ICR3YXRjaGVkLmxlbmd0aCA/ICR3YXRjaGVkIDogdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXItd2F0Y2hdJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLXJlc2l6ZScsIChlcUlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2VxJykpKTtcblx0dGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLW11dGF0ZScsIChlcUlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2VxJykpKTtcblxuICAgIHRoaXMuaGFzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1lcXVhbGl6ZXJdJykubGVuZ3RoID4gMDtcbiAgICB0aGlzLmlzTmVzdGVkID0gdGhpcy4kZWxlbWVudC5wYXJlbnRzVW50aWwoZG9jdW1lbnQuYm9keSwgJ1tkYXRhLWVxdWFsaXplcl0nKS5sZW5ndGggPiAwO1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgIHRoaXMuX2JpbmRIYW5kbGVyID0ge1xuICAgICAgb25SZXNpemVNZUJvdW5kOiB0aGlzLl9vblJlc2l6ZU1lLmJpbmQodGhpcyksXG4gICAgICBvblBvc3RFcXVhbGl6ZWRCb3VuZDogdGhpcy5fb25Qb3N0RXF1YWxpemVkLmJpbmQodGhpcylcbiAgICB9O1xuXG4gICAgdmFyIGltZ3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2ltZycpO1xuICAgIHZhciB0b29TbWFsbDtcbiAgICBpZih0aGlzLm9wdGlvbnMuZXF1YWxpemVPbil7XG4gICAgICB0b29TbWFsbCA9IHRoaXMuX2NoZWNrTVEoKTtcbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fY2hlY2tNUS5iaW5kKHRoaXMpKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuX2V2ZW50cygpO1xuICAgIH1cbiAgICBpZigodG9vU21hbGwgIT09IHVuZGVmaW5lZCAmJiB0b29TbWFsbCA9PT0gZmFsc2UpIHx8IHRvb1NtYWxsID09PSB1bmRlZmluZWQpe1xuICAgICAgaWYoaW1ncy5sZW5ndGgpe1xuICAgICAgICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkKGltZ3MsIHRoaXMuX3JlZmxvdy5iaW5kKHRoaXMpKTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLl9yZWZsb3coKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMgaWYgdGhlIGJyZWFrcG9pbnQgaXMgdG9vIHNtYWxsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3BhdXNlRXZlbnRzKCkge1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKHtcbiAgICAgICcuemYuZXF1YWxpemVyJzogdGhpcy5fYmluZEhhbmRsZXIub25Qb3N0RXF1YWxpemVkQm91bmQsXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IHRoaXMuX2JpbmRIYW5kbGVyLm9uUmVzaXplTWVCb3VuZCxcblx0ICAnbXV0YXRlbWUuemYudHJpZ2dlcic6IHRoaXMuX2JpbmRIYW5kbGVyLm9uUmVzaXplTWVCb3VuZFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIGZ1bmN0aW9uIHRvIGhhbmRsZSAkZWxlbWVudHMgcmVzaXplbWUuemYudHJpZ2dlciwgd2l0aCBib3VuZCB0aGlzIG9uIF9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmRcbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9vblJlc2l6ZU1lKGUpIHtcbiAgICB0aGlzLl9yZWZsb3coKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBmdW5jdGlvbiB0byBoYW5kbGUgJGVsZW1lbnRzIHBvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyLCB3aXRoIGJvdW5kIHRoaXMgb24gX2JpbmRIYW5kbGVyLm9uUG9zdEVxdWFsaXplZEJvdW5kXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfb25Qb3N0RXF1YWxpemVkKGUpIHtcbiAgICBpZihlLnRhcmdldCAhPT0gdGhpcy4kZWxlbWVudFswXSl7IHRoaXMuX3JlZmxvdygpOyB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBFcXVhbGl6ZXIuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcbiAgICBpZih0aGlzLmhhc05lc3RlZCl7XG4gICAgICB0aGlzLiRlbGVtZW50Lm9uKCdwb3N0ZXF1YWxpemVkLnpmLmVxdWFsaXplcicsIHRoaXMuX2JpbmRIYW5kbGVyLm9uUG9zdEVxdWFsaXplZEJvdW5kKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCB0aGlzLl9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmQpO1xuXHQgIHRoaXMuJGVsZW1lbnQub24oJ211dGF0ZW1lLnpmLnRyaWdnZXInLCB0aGlzLl9iaW5kSGFuZGxlci5vblJlc2l6ZU1lQm91bmQpO1xuICAgIH1cbiAgICB0aGlzLmlzT24gPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBicmVha3BvaW50IHRvIHRoZSBtaW5pbXVtIHJlcXVpcmVkIHNpemUuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfY2hlY2tNUSgpIHtcbiAgICB2YXIgdG9vU21hbGwgPSAhRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmlzKHRoaXMub3B0aW9ucy5lcXVhbGl6ZU9uKTtcbiAgICBpZih0b29TbWFsbCl7XG4gICAgICBpZih0aGlzLmlzT24pe1xuICAgICAgICB0aGlzLl9wYXVzZUV2ZW50cygpO1xuICAgICAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIGlmKCF0aGlzLmlzT24pe1xuICAgICAgICB0aGlzLl9ldmVudHMoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvb1NtYWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEEgbm9vcCB2ZXJzaW9uIGZvciB0aGUgcGx1Z2luXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfa2lsbHN3aXRjaCgpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgRXF1YWxpemVyIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3JlZmxvdygpIHtcbiAgICBpZighdGhpcy5vcHRpb25zLmVxdWFsaXplT25TdGFjayl7XG4gICAgICBpZih0aGlzLl9pc1N0YWNrZWQoKSl7XG4gICAgICAgIHRoaXMuJHdhdGNoZWQuY3NzKCdoZWlnaHQnLCAnYXV0bycpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZXF1YWxpemVCeVJvdykge1xuICAgICAgdGhpcy5nZXRIZWlnaHRzQnlSb3codGhpcy5hcHBseUhlaWdodEJ5Um93LmJpbmQodGhpcykpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5nZXRIZWlnaHRzKHRoaXMuYXBwbHlIZWlnaHQuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGRldGVybWluZXMgaWYgdGhlIGZpcnN0IDIgZWxlbWVudHMgYXJlICpOT1QqIHN0YWNrZWQuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaXNTdGFja2VkKCkge1xuICAgIGlmICghdGhpcy4kd2F0Y2hlZFswXSB8fCAhdGhpcy4kd2F0Y2hlZFsxXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiR3YXRjaGVkWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCAhPT0gdGhpcy4kd2F0Y2hlZFsxXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XG4gIH1cblxuICAvKipcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBBIG5vbi1vcHRpb25hbCBjYWxsYmFjayB0byByZXR1cm4gdGhlIGhlaWdodHMgYXJyYXkgdG8uXG4gICAqIEByZXR1cm5zIHtBcnJheX0gaGVpZ2h0cyAtIEFuIGFycmF5IG9mIGhlaWdodHMgb2YgY2hpbGRyZW4gd2l0aGluIEVxdWFsaXplciBjb250YWluZXJcbiAgICovXG4gIGdldEhlaWdodHMoY2IpIHtcbiAgICB2YXIgaGVpZ2h0cyA9IFtdO1xuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuJHdhdGNoZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgdGhpcy4kd2F0Y2hlZFtpXS5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICBoZWlnaHRzLnB1c2godGhpcy4kd2F0Y2hlZFtpXS5vZmZzZXRIZWlnaHQpO1xuICAgIH1cbiAgICBjYihoZWlnaHRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kcyB0aGUgb3V0ZXIgaGVpZ2h0cyBvZiBjaGlsZHJlbiBjb250YWluZWQgd2l0aGluIGFuIEVxdWFsaXplciBwYXJlbnQgYW5kIHJldHVybnMgdGhlbSBpbiBhbiBhcnJheVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIEEgbm9uLW9wdGlvbmFsIGNhbGxiYWNrIHRvIHJldHVybiB0aGUgaGVpZ2h0cyBhcnJheSB0by5cbiAgICogQHJldHVybnMge0FycmF5fSBncm91cHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyIGdyb3VwZWQgYnkgcm93IHdpdGggZWxlbWVudCxoZWlnaHQgYW5kIG1heCBhcyBsYXN0IGNoaWxkXG4gICAqL1xuICBnZXRIZWlnaHRzQnlSb3coY2IpIHtcbiAgICB2YXIgbGFzdEVsVG9wT2Zmc2V0ID0gKHRoaXMuJHdhdGNoZWQubGVuZ3RoID8gdGhpcy4kd2F0Y2hlZC5maXJzdCgpLm9mZnNldCgpLnRvcCA6IDApLFxuICAgICAgICBncm91cHMgPSBbXSxcbiAgICAgICAgZ3JvdXAgPSAwO1xuICAgIC8vZ3JvdXAgYnkgUm93XG4gICAgZ3JvdXBzW2dyb3VwXSA9IFtdO1xuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuJHdhdGNoZWQubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xuICAgICAgdGhpcy4kd2F0Y2hlZFtpXS5zdHlsZS5oZWlnaHQgPSAnYXV0byc7XG4gICAgICAvL21heWJlIGNvdWxkIHVzZSB0aGlzLiR3YXRjaGVkW2ldLm9mZnNldFRvcFxuICAgICAgdmFyIGVsT2Zmc2V0VG9wID0gJCh0aGlzLiR3YXRjaGVkW2ldKS5vZmZzZXQoKS50b3A7XG4gICAgICBpZiAoZWxPZmZzZXRUb3AhPWxhc3RFbFRvcE9mZnNldCkge1xuICAgICAgICBncm91cCsrO1xuICAgICAgICBncm91cHNbZ3JvdXBdID0gW107XG4gICAgICAgIGxhc3RFbFRvcE9mZnNldD1lbE9mZnNldFRvcDtcbiAgICAgIH1cbiAgICAgIGdyb3Vwc1tncm91cF0ucHVzaChbdGhpcy4kd2F0Y2hlZFtpXSx0aGlzLiR3YXRjaGVkW2ldLm9mZnNldEhlaWdodF0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIGogPSAwLCBsbiA9IGdyb3Vwcy5sZW5ndGg7IGogPCBsbjsgaisrKSB7XG4gICAgICB2YXIgaGVpZ2h0cyA9ICQoZ3JvdXBzW2pdKS5tYXAoZnVuY3Rpb24oKXsgcmV0dXJuIHRoaXNbMV07IH0pLmdldCgpO1xuICAgICAgdmFyIG1heCAgICAgICAgID0gTWF0aC5tYXguYXBwbHkobnVsbCwgaGVpZ2h0cyk7XG4gICAgICBncm91cHNbal0ucHVzaChtYXgpO1xuICAgIH1cbiAgICBjYihncm91cHMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZXMgdGhlIENTUyBoZWlnaHQgcHJvcGVydHkgb2YgZWFjaCBjaGlsZCBpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IHRvIG1hdGNoIHRoZSB0YWxsZXN0XG4gICAqIEBwYXJhbSB7YXJyYXl9IGhlaWdodHMgLSBBbiBhcnJheSBvZiBoZWlnaHRzIG9mIGNoaWxkcmVuIHdpdGhpbiBFcXVhbGl6ZXIgY29udGFpbmVyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlZXF1YWxpemVkXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcG9zdGVxdWFsaXplZFxuICAgKi9cbiAgYXBwbHlIZWlnaHQoaGVpZ2h0cykge1xuICAgIHZhciBtYXggPSBNYXRoLm1heC5hcHBseShudWxsLCBoZWlnaHRzKTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyBiZWZvcmUgdGhlIGhlaWdodHMgYXJlIGFwcGxpZWRcbiAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuXG4gICAgdGhpcy4kd2F0Y2hlZC5jc3MoJ2hlaWdodCcsIG1heCk7XG5cbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIGhhdmUgYmVlbiBhcHBsaWVkXG4gICAgICogQGV2ZW50IEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXG4gICAgICovXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZC56Zi5lcXVhbGl6ZXInKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2VzIHRoZSBDU1MgaGVpZ2h0IHByb3BlcnR5IG9mIGVhY2ggY2hpbGQgaW4gYW4gRXF1YWxpemVyIHBhcmVudCB0byBtYXRjaCB0aGUgdGFsbGVzdCBieSByb3dcbiAgICogQHBhcmFtIHthcnJheX0gZ3JvdXBzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lciBncm91cGVkIGJ5IHJvdyB3aXRoIGVsZW1lbnQsaGVpZ2h0IGFuZCBtYXggYXMgbGFzdCBjaGlsZFxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZFxuICAgKiBAZmlyZXMgRXF1YWxpemVyI3ByZWVxdWFsaXplZHJvd1xuICAgKiBAZmlyZXMgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRyb3dcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0ZXF1YWxpemVkXG4gICAqL1xuICBhcHBseUhlaWdodEJ5Um93KGdyb3Vwcykge1xuICAgIC8qKlxuICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBhcmUgYXBwbGllZFxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkLnpmLmVxdWFsaXplcicpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBncm91cHMubGVuZ3RoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICB2YXIgZ3JvdXBzSUxlbmd0aCA9IGdyb3Vwc1tpXS5sZW5ndGgsXG4gICAgICAgICAgbWF4ID0gZ3JvdXBzW2ldW2dyb3Vwc0lMZW5ndGggLSAxXTtcbiAgICAgIGlmIChncm91cHNJTGVuZ3RoPD0yKSB7XG4gICAgICAgICQoZ3JvdXBzW2ldWzBdWzBdKS5jc3MoeydoZWlnaHQnOidhdXRvJ30pO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIC8qKlxuICAgICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBwZXIgcm93IGFyZSBhcHBsaWVkXG4gICAgICAgICogQGV2ZW50IEVxdWFsaXplciNwcmVlcXVhbGl6ZWRyb3dcbiAgICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncHJlZXF1YWxpemVkcm93LnpmLmVxdWFsaXplcicpO1xuICAgICAgZm9yICh2YXIgaiA9IDAsIGxlbkogPSAoZ3JvdXBzSUxlbmd0aC0xKTsgaiA8IGxlbkogOyBqKyspIHtcbiAgICAgICAgJChncm91cHNbaV1bal1bMF0pLmNzcyh7J2hlaWdodCc6bWF4fSk7XG4gICAgICB9XG4gICAgICAvKipcbiAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBoZWlnaHRzIHBlciByb3cgaGF2ZSBiZWVuIGFwcGxpZWRcbiAgICAgICAgKiBAZXZlbnQgRXF1YWxpemVyI3Bvc3RlcXVhbGl6ZWRyb3dcbiAgICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigncG9zdGVxdWFsaXplZHJvdy56Zi5lcXVhbGl6ZXInKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgaGVpZ2h0cyBoYXZlIGJlZW4gYXBwbGllZFxuICAgICAqL1xuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3Bvc3RlcXVhbGl6ZWQuemYuZXF1YWxpemVyJyk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5fcGF1c2VFdmVudHMoKTtcbiAgICB0aGlzLiR3YXRjaGVkLmNzcygnaGVpZ2h0JywgJ2F1dG8nKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5FcXVhbGl6ZXIuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBFbmFibGUgaGVpZ2h0IGVxdWFsaXphdGlvbiB3aGVuIHN0YWNrZWQgb24gc21hbGxlciBzY3JlZW5zLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGVxdWFsaXplT25TdGFjazogZmFsc2UsXG4gIC8qKlxuICAgKiBFbmFibGUgaGVpZ2h0IGVxdWFsaXphdGlvbiByb3cgYnkgcm93LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBlcXVhbGl6ZUJ5Um93OiBmYWxzZSxcbiAgLyoqXG4gICAqIFN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1pbmltdW0gYnJlYWtwb2ludCBzaXplIHRoZSBwbHVnaW4gc2hvdWxkIGVxdWFsaXplIGhlaWdodHMgb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIGVxdWFsaXplT246ICcnXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oRXF1YWxpemVyLCAnRXF1YWxpemVyJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBJbnRlcmNoYW5nZSBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uaW50ZXJjaGFuZ2VcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyXG4gKi9cblxuY2xhc3MgSW50ZXJjaGFuZ2Uge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBJbnRlcmNoYW5nZS5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgSW50ZXJjaGFuZ2UuZGVmYXVsdHMsIG9wdGlvbnMpO1xuICAgIHRoaXMucnVsZXMgPSBbXTtcbiAgICB0aGlzLmN1cnJlbnRQYXRoID0gJyc7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdJbnRlcmNoYW5nZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHRoZSBJbnRlcmNoYW5nZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgaW50ZXJjaGFuZ2UgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB0aGlzLl9hZGRCcmVha3BvaW50cygpO1xuICAgIHRoaXMuX2dlbmVyYXRlUnVsZXMoKTtcbiAgICB0aGlzLl9yZWZsb3coKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEludGVyY2hhbmdlLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYuaW50ZXJjaGFuZ2UnLCBGb3VuZGF0aW9uLnV0aWwudGhyb3R0bGUoKCkgPT4ge1xuICAgICAgdGhpcy5fcmVmbG93KCk7XG4gICAgfSwgNTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBuZWNlc3NhcnkgZnVuY3Rpb25zIHRvIHVwZGF0ZSBJbnRlcmNoYW5nZSB1cG9uIERPTSBjaGFuZ2VcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVmbG93KCkge1xuICAgIHZhciBtYXRjaDtcblxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUsIGJ1dCBvbmx5IHNhdmUgdGhlIGxhc3QgbWF0Y2hcbiAgICBmb3IgKHZhciBpIGluIHRoaXMucnVsZXMpIHtcbiAgICAgIGlmKHRoaXMucnVsZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgdmFyIHJ1bGUgPSB0aGlzLnJ1bGVzW2ldO1xuICAgICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocnVsZS5xdWVyeSkubWF0Y2hlcykge1xuICAgICAgICAgIG1hdGNoID0gcnVsZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgdGhpcy5yZXBsYWNlKG1hdGNoLnBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBGb3VuZGF0aW9uIGJyZWFrcG9pbnRzIGFuZCBhZGRzIHRoZW0gdG8gdGhlIEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFUyBvYmplY3QuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEJyZWFrcG9pbnRzKCkge1xuICAgIGZvciAodmFyIGkgaW4gRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LnF1ZXJpZXMpIHtcbiAgICAgIGlmIChGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICB2YXIgcXVlcnkgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllc1tpXTtcbiAgICAgICAgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5Lm5hbWVdID0gcXVlcnkudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgSW50ZXJjaGFuZ2UgZWxlbWVudCBmb3IgdGhlIHByb3ZpZGVkIG1lZGlhIHF1ZXJ5ICsgY29udGVudCBwYWlyaW5nc1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRoYXQgaXMgYW4gSW50ZXJjaGFuZ2UgaW5zdGFuY2VcbiAgICogQHJldHVybnMge0FycmF5fSBzY2VuYXJpb3MgLSBBcnJheSBvZiBvYmplY3RzIHRoYXQgaGF2ZSAnbXEnIGFuZCAncGF0aCcga2V5cyB3aXRoIGNvcnJlc3BvbmRpbmcga2V5c1xuICAgKi9cbiAgX2dlbmVyYXRlUnVsZXMoZWxlbWVudCkge1xuICAgIHZhciBydWxlc0xpc3QgPSBbXTtcbiAgICB2YXIgcnVsZXM7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1bGVzKSB7XG4gICAgICBydWxlcyA9IHRoaXMub3B0aW9ucy5ydWxlcztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBydWxlcyA9IHRoaXMuJGVsZW1lbnQuZGF0YSgnaW50ZXJjaGFuZ2UnKS5tYXRjaCgvXFxbLio/XFxdL2cpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgaW4gcnVsZXMpIHtcbiAgICAgIGlmKHJ1bGVzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgIHZhciBydWxlID0gcnVsZXNbaV0uc2xpY2UoMSwgLTEpLnNwbGl0KCcsICcpO1xuICAgICAgICB2YXIgcGF0aCA9IHJ1bGUuc2xpY2UoMCwgLTEpLmpvaW4oJycpO1xuICAgICAgICB2YXIgcXVlcnkgPSBydWxlW3J1bGUubGVuZ3RoIC0gMV07XG5cbiAgICAgICAgaWYgKEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV0pIHtcbiAgICAgICAgICBxdWVyeSA9IEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV07XG4gICAgICAgIH1cblxuICAgICAgICBydWxlc0xpc3QucHVzaCh7XG4gICAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgICBxdWVyeTogcXVlcnlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzTGlzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGBzcmNgIHByb3BlcnR5IG9mIGFuIGltYWdlLCBvciBjaGFuZ2UgdGhlIEhUTUwgb2YgYSBjb250YWluZXIsIHRvIHRoZSBzcGVjaWZpZWQgcGF0aC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gUGF0aCB0byB0aGUgaW1hZ2Ugb3IgSFRNTCBwYXJ0aWFsLlxuICAgKiBAZmlyZXMgSW50ZXJjaGFuZ2UjcmVwbGFjZWRcbiAgICovXG4gIHJlcGxhY2UocGF0aCkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRQYXRoID09PSBwYXRoKSByZXR1cm47XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICB0cmlnZ2VyID0gJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJztcblxuICAgIC8vIFJlcGxhY2luZyBpbWFnZXNcbiAgICBpZiAodGhpcy4kZWxlbWVudFswXS5ub2RlTmFtZSA9PT0gJ0lNRycpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignc3JjJywgcGF0aCkub24oJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xuICAgICAgfSlcbiAgICAgIC50cmlnZ2VyKHRyaWdnZXIpO1xuICAgIH1cbiAgICAvLyBSZXBsYWNpbmcgYmFja2dyb3VuZCBpbWFnZXNcbiAgICBlbHNlIGlmIChwYXRoLm1hdGNoKC9cXC4oZ2lmfGpwZ3xqcGVnfHBuZ3xzdmd8dGlmZikoWz8jXS4qKT8vaSkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHsgJ2JhY2tncm91bmQtaW1hZ2UnOiAndXJsKCcrcGF0aCsnKScgfSlcbiAgICAgICAgICAudHJpZ2dlcih0cmlnZ2VyKTtcbiAgICB9XG4gICAgLy8gUmVwbGFjaW5nIEhUTUxcbiAgICBlbHNlIHtcbiAgICAgICQuZ2V0KHBhdGgsIGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIF90aGlzLiRlbGVtZW50Lmh0bWwocmVzcG9uc2UpXG4gICAgICAgICAgICAgLnRyaWdnZXIodHJpZ2dlcik7XG4gICAgICAgICQocmVzcG9uc2UpLmZvdW5kYXRpb24oKTtcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiBjb250ZW50IGluIGFuIEludGVyY2hhbmdlIGVsZW1lbnQgaXMgZG9uZSBiZWluZyBsb2FkZWQuXG4gICAgICogQGV2ZW50IEludGVyY2hhbmdlI3JlcGxhY2VkXG4gICAgICovXG4gICAgLy8gdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdyZXBsYWNlZC56Zi5pbnRlcmNoYW5nZScpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGludGVyY2hhbmdlLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgLy9UT0RPIHRoaXMuXG4gIH1cbn1cblxuLyoqXG4gKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cbiAqL1xuSW50ZXJjaGFuZ2UuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBSdWxlcyB0byBiZSBhcHBsaWVkIHRvIEludGVyY2hhbmdlIGVsZW1lbnRzLiBTZXQgd2l0aCB0aGUgYGRhdGEtaW50ZXJjaGFuZ2VgIGFycmF5IG5vdGF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqL1xuICBydWxlczogbnVsbFxufTtcblxuSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTID0ge1xuICAnbGFuZHNjYXBlJzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcbiAgJ3BvcnRyYWl0JzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxuICAncmV0aW5hJzogJ29ubHkgc2NyZWVuIGFuZCAoLXdlYmtpdC1taW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKC1vLW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIvMSksIG9ubHkgc2NyZWVuIGFuZCAobWluLWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksIG9ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDJkcHB4KSdcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihJbnRlcmNoYW5nZSwgJ0ludGVyY2hhbmdlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBNYWdlbGxhbiBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubWFnZWxsYW5cbiAqL1xuXG5jbGFzcyBNYWdlbGxhbiB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIE1hZ2VsbGFuLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIE1hZ2VsbGFuI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgTWFnZWxsYW4uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLmNhbGNQb2ludHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ01hZ2VsbGFuJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1hZ2VsbGFuIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBlcXVhbGl6ZXIgZnVuY3Rpb25pbmcgb24gbG9hZC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnbWFnZWxsYW4nKTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMuJHRhcmdldHMgPSAkKCdbZGF0YS1tYWdlbGxhbi10YXJnZXRdJyk7XG4gICAgdGhpcy4kbGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKTtcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgJ2RhdGEtcmVzaXplJzogaWQsXG4gICAgICAnZGF0YS1zY3JvbGwnOiBpZCxcbiAgICAgICdpZCc6IGlkXG4gICAgfSk7XG4gICAgdGhpcy4kYWN0aXZlID0gJCgpO1xuICAgIHRoaXMuc2Nyb2xsUG9zID0gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0LCAxMCk7XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIGFuIGFycmF5IG9mIHBpeGVsIHZhbHVlcyB0aGF0IGFyZSB0aGUgZGVtYXJjYXRpb24gbGluZXMgYmV0d2VlbiBsb2NhdGlvbnMgb24gdGhlIHBhZ2UuXG4gICAqIENhbiBiZSBpbnZva2VkIGlmIG5ldyBlbGVtZW50cyBhcmUgYWRkZWQgb3IgdGhlIHNpemUgb2YgYSBsb2NhdGlvbiBjaGFuZ2VzLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGNhbGNQb2ludHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcyxcbiAgICAgICAgYm9keSA9IGRvY3VtZW50LmJvZHksXG4gICAgICAgIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICB0aGlzLnBvaW50cyA9IFtdO1xuICAgIHRoaXMud2luSGVpZ2h0ID0gTWF0aC5yb3VuZChNYXRoLm1heCh3aW5kb3cuaW5uZXJIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0KSk7XG4gICAgdGhpcy5kb2NIZWlnaHQgPSBNYXRoLnJvdW5kKE1hdGgubWF4KGJvZHkuc2Nyb2xsSGVpZ2h0LCBib2R5Lm9mZnNldEhlaWdodCwgaHRtbC5jbGllbnRIZWlnaHQsIGh0bWwuc2Nyb2xsSGVpZ2h0LCBodG1sLm9mZnNldEhlaWdodCkpO1xuXG4gICAgdGhpcy4kdGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgJHRhciA9ICQodGhpcyksXG4gICAgICAgICAgcHQgPSBNYXRoLnJvdW5kKCR0YXIub2Zmc2V0KCkudG9wIC0gX3RoaXMub3B0aW9ucy50aHJlc2hvbGQpO1xuICAgICAgJHRhci50YXJnZXRQb2ludCA9IHB0O1xuICAgICAgX3RoaXMucG9pbnRzLnB1c2gocHQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgTWFnZWxsYW4uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgICRib2R5ID0gJCgnaHRtbCwgYm9keScpLFxuICAgICAgICBvcHRzID0ge1xuICAgICAgICAgIGR1cmF0aW9uOiBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgIGVhc2luZzogICBfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkVhc2luZ1xuICAgICAgICB9O1xuICAgICQod2luZG93KS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpe1xuICAgICAgaWYoX3RoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XG4gICAgICAgIGlmKGxvY2F0aW9uLmhhc2gpe1xuICAgICAgICAgIF90aGlzLnNjcm9sbFRvTG9jKGxvY2F0aW9uLmhhc2gpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBfdGhpcy5jYWxjUG9pbnRzKCk7XG4gICAgICBfdGhpcy5fdXBkYXRlQWN0aXZlKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLiRlbGVtZW50Lm9uKHtcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5yZWZsb3cuYmluZCh0aGlzKSxcbiAgICAgICdzY3JvbGxtZS56Zi50cmlnZ2VyJzogdGhpcy5fdXBkYXRlQWN0aXZlLmJpbmQodGhpcylcbiAgICB9KS5vbignY2xpY2suemYubWFnZWxsYW4nLCAnYVtocmVmXj1cIiNcIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFycml2YWwgICA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgICAgIF90aGlzLnNjcm9sbFRvTG9jKGFycml2YWwpO1xuICAgICAgfSk7XG4gICAgJCh3aW5kb3cpLm9uKCdwb3BzdGF0ZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuZGVlcExpbmtpbmcpIHtcbiAgICAgICAgX3RoaXMuc2Nyb2xsVG9Mb2Mod2luZG93LmxvY2F0aW9uLmhhc2gpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZ1bmN0aW9uIHRvIHNjcm9sbCB0byBhIGdpdmVuIGxvY2F0aW9uIG9uIHRoZSBwYWdlLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gbG9jIC0gYSBwcm9wZXJseSBmb3JtYXR0ZWQgalF1ZXJ5IGlkIHNlbGVjdG9yLiBFeGFtcGxlOiAnI2ZvbydcbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBzY3JvbGxUb0xvYyhsb2MpIHtcbiAgICAvLyBEbyBub3RoaW5nIGlmIHRhcmdldCBkb2VzIG5vdCBleGlzdCB0byBwcmV2ZW50IGVycm9yc1xuICAgIGlmICghJChsb2MpLmxlbmd0aCkge3JldHVybiBmYWxzZTt9XG4gICAgdGhpcy5faW5UcmFuc2l0aW9uID0gdHJ1ZTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBzY3JvbGxQb3MgPSBNYXRoLnJvdW5kKCQobG9jKS5vZmZzZXQoKS50b3AgLSB0aGlzLm9wdGlvbnMudGhyZXNob2xkIC8gMiAtIHRoaXMub3B0aW9ucy5iYXJPZmZzZXQpO1xuXG4gICAgJCgnaHRtbCwgYm9keScpLnN0b3AodHJ1ZSkuYW5pbWF0ZShcbiAgICAgIHsgc2Nyb2xsVG9wOiBzY3JvbGxQb3MgfSxcbiAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgIHRoaXMub3B0aW9ucy5hbmltYXRpb25FYXNpbmcsXG4gICAgICBmdW5jdGlvbigpIHtfdGhpcy5faW5UcmFuc2l0aW9uID0gZmFsc2U7IF90aGlzLl91cGRhdGVBY3RpdmUoKX1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIE1hZ2VsbGFuIHVwb24gRE9NIGNoYW5nZVxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHJlZmxvdygpIHtcbiAgICB0aGlzLmNhbGNQb2ludHMoKTtcbiAgICB0aGlzLl91cGRhdGVBY3RpdmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSB2aXNpYmlsaXR5IG9mIGFuIGFjdGl2ZSBsb2NhdGlvbiBsaW5rLCBhbmQgdXBkYXRlcyB0aGUgdXJsIGhhc2ggZm9yIHRoZSBwYWdlLCBpZiBkZWVwTGlua2luZyBlbmFibGVkLlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIE1hZ2VsbGFuI3VwZGF0ZVxuICAgKi9cbiAgX3VwZGF0ZUFjdGl2ZSgvKmV2dCwgZWxlbSwgc2Nyb2xsUG9zKi8pIHtcbiAgICBpZih0aGlzLl9pblRyYW5zaXRpb24pIHtyZXR1cm47fVxuICAgIHZhciB3aW5Qb3MgPSAvKnNjcm9sbFBvcyB8fCovIHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCwgMTApLFxuICAgICAgICBjdXJJZHg7XG5cbiAgICBpZih3aW5Qb3MgKyB0aGlzLndpbkhlaWdodCA9PT0gdGhpcy5kb2NIZWlnaHQpeyBjdXJJZHggPSB0aGlzLnBvaW50cy5sZW5ndGggLSAxOyB9XG4gICAgZWxzZSBpZih3aW5Qb3MgPCB0aGlzLnBvaW50c1swXSl7IGN1cklkeCA9IHVuZGVmaW5lZDsgfVxuICAgIGVsc2V7XG4gICAgICB2YXIgaXNEb3duID0gdGhpcy5zY3JvbGxQb3MgPCB3aW5Qb3MsXG4gICAgICAgICAgX3RoaXMgPSB0aGlzLFxuICAgICAgICAgIGN1clZpc2libGUgPSB0aGlzLnBvaW50cy5maWx0ZXIoZnVuY3Rpb24ocCwgaSl7XG4gICAgICAgICAgICByZXR1cm4gaXNEb3duID8gcCAtIF90aGlzLm9wdGlvbnMuYmFyT2Zmc2V0IDw9IHdpblBvcyA6IHAgLSBfdGhpcy5vcHRpb25zLmJhck9mZnNldCAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkIDw9IHdpblBvcztcbiAgICAgICAgICB9KTtcbiAgICAgIGN1cklkeCA9IGN1clZpc2libGUubGVuZ3RoID8gY3VyVmlzaWJsZS5sZW5ndGggLSAxIDogMDtcbiAgICB9XG5cbiAgICB0aGlzLiRhY3RpdmUucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcbiAgICB0aGlzLiRhY3RpdmUgPSB0aGlzLiRsaW5rcy5maWx0ZXIoJ1tocmVmPVwiIycgKyB0aGlzLiR0YXJnZXRzLmVxKGN1cklkeCkuZGF0YSgnbWFnZWxsYW4tdGFyZ2V0JykgKyAnXCJdJykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XG4gICAgICB2YXIgaGFzaCA9IFwiXCI7XG4gICAgICBpZihjdXJJZHggIT0gdW5kZWZpbmVkKXtcbiAgICAgICAgaGFzaCA9IHRoaXMuJGFjdGl2ZVswXS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgIH1cbiAgICAgIGlmKGhhc2ggIT09IHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG4gICAgICAgIGlmKHdpbmRvdy5oaXN0b3J5LnB1c2hTdGF0ZSl7XG4gICAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9IGhhc2g7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLnNjcm9sbFBvcyA9IHdpblBvcztcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIG1hZ2VsbGFuIGlzIGZpbmlzaGVkIHVwZGF0aW5nIHRvIHRoZSBuZXcgYWN0aXZlIGVsZW1lbnQuXG4gICAgICogQGV2ZW50IE1hZ2VsbGFuI3VwZGF0ZVxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndXBkYXRlLnpmLm1hZ2VsbGFuJywgW3RoaXMuJGFjdGl2ZV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIE1hZ2VsbGFuIGFuZCByZXNldHMgdGhlIHVybCBvZiB0aGUgd2luZG93LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5tYWdlbGxhbicpXG4gICAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3N9YCkucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XG4gICAgICB2YXIgaGFzaCA9IHRoaXMuJGFjdGl2ZVswXS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoLnJlcGxhY2UoaGFzaCwgJycpO1xuICAgIH1cblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG4vKipcbiAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxuICovXG5NYWdlbGxhbi5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFtb3VudCBvZiB0aW1lLCBpbiBtcywgdGhlIGFuaW1hdGVkIHNjcm9sbGluZyBzaG91bGQgdGFrZSBiZXR3ZWVuIGxvY2F0aW9ucy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MDBcbiAgICovXG4gIGFuaW1hdGlvbkR1cmF0aW9uOiA1MDAsXG4gIC8qKlxuICAgKiBBbmltYXRpb24gc3R5bGUgdG8gdXNlIHdoZW4gc2Nyb2xsaW5nIGJldHdlZW4gbG9jYXRpb25zLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdlYXNlLWluLW91dCdcbiAgICovXG4gIGFuaW1hdGlvbkVhc2luZzogJ2xpbmVhcicsXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIHVzZSBhcyBhIG1hcmtlciBmb3IgbG9jYXRpb24gY2hhbmdlcy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MFxuICAgKi9cbiAgdGhyZXNob2xkOiA1MCxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGFjdGl2ZSBsb2NhdGlvbnMgbGluayBvbiB0aGUgbWFnZWxsYW4gY29udGFpbmVyLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdhY3RpdmUnXG4gICAqL1xuICBhY3RpdmVDbGFzczogJ2FjdGl2ZScsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIHNjcmlwdCB0byBtYW5pcHVsYXRlIHRoZSB1cmwgb2YgdGhlIGN1cnJlbnQgcGFnZSwgYW5kIGlmIHN1cHBvcnRlZCwgYWx0ZXIgdGhlIGhpc3RvcnkuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgZGVlcExpbmtpbmc6IGZhbHNlLFxuICAvKipcbiAgICogTnVtYmVyIG9mIHBpeGVscyB0byBvZmZzZXQgdGhlIHNjcm9sbCBvZiB0aGUgcGFnZSBvbiBpdGVtIGNsaWNrIGlmIHVzaW5nIGEgc3RpY2t5IG5hdiBiYXIuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMjVcbiAgICovXG4gIGJhck9mZnNldDogMFxufVxuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oTWFnZWxsYW4sICdNYWdlbGxhbicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogT2ZmQ2FudmFzIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5vZmZjYW52YXNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cbiAqL1xuXG5jbGFzcyBPZmZDYW52YXMge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT2ZmQ2FudmFzLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG4gICAgdGhpcy4kbGFzdFRyaWdnZXIgPSAkKCk7XG4gICAgdGhpcy4kdHJpZ2dlcnMgPSAkKCk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdPZmZDYW52YXMnKVxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ09mZkNhbnZhcycsIHtcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnXG4gICAgfSk7XG5cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyhgaXMtdHJhbnNpdGlvbi0ke3RoaXMub3B0aW9ucy50cmFuc2l0aW9ufWApO1xuXG4gICAgLy8gRmluZCB0cmlnZ2VycyB0aGF0IGFmZmVjdCB0aGlzIGVsZW1lbnQgYW5kIGFkZCBhcmlhLWV4cGFuZGVkIHRvIHRoZW1cbiAgICB0aGlzLiR0cmlnZ2VycyA9ICQoZG9jdW1lbnQpXG4gICAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXG4gICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcblxuICAgIC8vIEFkZCBhbiBvdmVybGF5IG92ZXIgdGhlIGNvbnRlbnQgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdmFyIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgIHZhciBvdmVybGF5UG9zaXRpb24gPSAkKHRoaXMuJGVsZW1lbnQpLmNzcyhcInBvc2l0aW9uXCIpID09PSAnZml4ZWQnID8gJ2lzLW92ZXJsYXktZml4ZWQnIDogJ2lzLW92ZXJsYXktYWJzb2x1dGUnO1xuICAgICAgb3ZlcmxheS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2pzLW9mZi1jYW52YXMtb3ZlcmxheSAnICsgb3ZlcmxheVBvc2l0aW9uKTtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSAkKG92ZXJsYXkpO1xuICAgICAgaWYob3ZlcmxheVBvc2l0aW9uID09PSAnaXMtb3ZlcmxheS1maXhlZCcpIHtcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLiRvdmVybGF5KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuc2libGluZ3MoJ1tkYXRhLW9mZi1jYW52YXMtY29udGVudF0nKS5hcHBlbmQodGhpcy4kb3ZlcmxheSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPSB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCB8fCBuZXcgUmVnRXhwKHRoaXMub3B0aW9ucy5yZXZlYWxDbGFzcywgJ2cnKS50ZXN0KHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnJldmVhbE9uID0gdGhpcy5vcHRpb25zLnJldmVhbE9uIHx8IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8ocmV2ZWFsLWZvci1tZWRpdW18cmV2ZWFsLWZvci1sYXJnZSkvZylbMF0uc3BsaXQoJy0nKVsyXTtcbiAgICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lID0gcGFyc2VGbG9hdCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSgkKCdbZGF0YS1vZmYtY2FudmFzXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5vZmZjYW52YXMnKS5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuY2xvc2UuYmluZCh0aGlzKSxcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXG4gICAgICAna2V5ZG93bi56Zi5vZmZjYW52YXMnOiB0aGlzLl9oYW5kbGVLZXlib2FyZC5iaW5kKHRoaXMpXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayA9PT0gdHJ1ZSkge1xuICAgICAgdmFyICR0YXJnZXQgPSB0aGlzLm9wdGlvbnMuY29udGVudE92ZXJsYXkgPyB0aGlzLiRvdmVybGF5IDogJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpO1xuICAgICAgJHRhcmdldC5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBcHBsaWVzIGV2ZW50IGxpc3RlbmVyIGZvciBlbGVtZW50cyB0aGF0IHdpbGwgcmV2ZWFsIGF0IGNlcnRhaW4gYnJlYWtwb2ludHMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0TVFDaGVja2VyKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF90aGlzLnJldmVhbChmYWxzZSk7XG4gICAgICB9XG4gICAgfSkub25lKCdsb2FkLnpmLm9mZmNhbnZhcycsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKSB7XG4gICAgICAgIF90aGlzLnJldmVhbCh0cnVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIHRoZSByZXZlYWxpbmcvaGlkaW5nIHRoZSBvZmYtY2FudmFzIGF0IGJyZWFrcG9pbnRzLCBub3QgdGhlIHNhbWUgYXMgb3Blbi5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1JldmVhbGVkIC0gdHJ1ZSBpZiBlbGVtZW50IHNob3VsZCBiZSByZXZlYWxlZC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICByZXZlYWwoaXNSZXZlYWxlZCkge1xuICAgIHZhciAkY2xvc2VyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1jbG9zZV0nKTtcbiAgICBpZiAoaXNSZXZlYWxlZCkge1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgdGhpcy5pc1JldmVhbGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdvcGVuLnpmLnRyaWdnZXIgdG9nZ2xlLnpmLnRyaWdnZXInKTtcbiAgICAgIGlmICgkY2xvc2VyLmxlbmd0aCkgeyAkY2xvc2VyLmhpZGUoKTsgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmlzUmV2ZWFsZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcbiAgICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKVxuICAgICAgfSk7XG4gICAgICBpZiAoJGNsb3Nlci5sZW5ndGgpIHtcbiAgICAgICAgJGNsb3Nlci5zaG93KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFN0b3BzIHNjcm9sbGluZyBvZiB0aGUgYm9keSB3aGVuIG9mZmNhbnZhcyBpcyBvcGVuIG9uIG1vYmlsZSBTYWZhcmkgYW5kIG90aGVyIHRyb3VibGVzb21lIGJyb3dzZXJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3N0b3BTY3JvbGxpbmcoZXZlbnQpIHtcbiAgXHRyZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXG4gICAqIEBmaXJlcyBPZmZDYW52YXMjb3BlbmVkXG4gICAqL1xuICBvcGVuKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICh0cmlnZ2VyKSB7XG4gICAgICB0aGlzLiRsYXN0VHJpZ2dlciA9IHRyaWdnZXI7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5mb3JjZVRvID09PSAndG9wJykge1xuICAgICAgd2luZG93LnNjcm9sbFRvKDAsIDApO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLmZvcmNlVG8gPT09ICdib3R0b20nKSB7XG4gICAgICB3aW5kb3cuc2Nyb2xsVG8oMCxkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW5zLlxuICAgICAqIEBldmVudCBPZmZDYW52YXMjb3BlbmVkXG4gICAgICovXG4gICAgX3RoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxuXG4gICAgdGhpcy4kdHJpZ2dlcnMuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpXG4gICAgICAgIC50cmlnZ2VyKCdvcGVuZWQuemYub2ZmY2FudmFzJyk7XG5cbiAgICAvLyBJZiBgY29udGVudFNjcm9sbGAgaXMgc2V0IHRvIGZhbHNlLCBhZGQgY2xhc3MgYW5kIGRpc2FibGUgc2Nyb2xsaW5nIG9uIHRvdWNoIGRldmljZXMuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50U2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4nKS5vbigndG91Y2htb3ZlJywgdGhpcy5fc3RvcFNjcm9sbGluZyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5hZGRDbGFzcygnaXMtdmlzaWJsZScpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrID09PSB0cnVlICYmIHRoaXMub3B0aW9ucy5jb250ZW50T3ZlcmxheSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kb3ZlcmxheS5hZGRDbGFzcygnaXMtY2xvc2FibGUnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9Gb2N1cyA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKHRoaXMuJGVsZW1lbnQpLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQuZmluZCgnYSwgYnV0dG9uJykuZXEoMCkuZm9jdXMoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykuYXR0cigndGFiaW5kZXgnLCAnLTEnKTtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQudHJhcEZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZXMgdGhlIG9mZi1jYW52YXMgbWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gb3B0aW9uYWwgY2IgdG8gZmlyZSBhZnRlciBjbG9zdXJlLlxuICAgKiBAZmlyZXMgT2ZmQ2FudmFzI2Nsb3NlZFxuICAgKi9cbiAgY2xvc2UoY2IpIHtcbiAgICBpZiAoIXRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSB8fCB0aGlzLmlzUmV2ZWFsZWQpIHsgcmV0dXJuOyB9XG5cbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpXG4gICAgICAvKipcbiAgICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cbiAgICAgICAqIEBldmVudCBPZmZDYW52YXMjY2xvc2VkXG4gICAgICAgKi9cbiAgICAgICAgLnRyaWdnZXIoJ2Nsb3NlZC56Zi5vZmZjYW52YXMnKTtcblxuICAgIC8vIElmIGBjb250ZW50U2Nyb2xsYCBpcyBzZXQgdG8gZmFsc2UsIHJlbW92ZSBjbGFzcyBhbmQgcmUtZW5hYmxlIHNjcm9sbGluZyBvbiB0b3VjaCBkZXZpY2VzLlxuICAgIGlmICh0aGlzLm9wdGlvbnMuY29udGVudFNjcm9sbCA9PT0gZmFsc2UpIHtcbiAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnaXMtb2ZmLWNhbnZhcy1vcGVuJykub2ZmKCd0b3VjaG1vdmUnLCB0aGlzLl9zdG9wU2Nyb2xsaW5nKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgPT09IHRydWUgJiYgdGhpcy5vcHRpb25zLmNvbnRlbnRPdmVybGF5ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRvdmVybGF5LnJlbW92ZUNsYXNzKCdpcy1jbG9zYWJsZScpO1xuICAgIH1cblxuICAgIHRoaXMuJHRyaWdnZXJzLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzID09PSB0cnVlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNpYmxpbmdzKCdbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdJykucmVtb3ZlQXR0cigndGFiaW5kZXgnKTtcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVsZWFzZUZvY3VzKHRoaXMuJGVsZW1lbnQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbiBvciBjbG9zZWQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcGFyYW0ge09iamVjdH0gZXZlbnQgLSBFdmVudCBvYmplY3QgcGFzc2VkIGZyb20gbGlzdGVuZXIuXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSB0cmlnZ2VyIC0gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgb2ZmLWNhbnZhcyB0byBvcGVuLlxuICAgKi9cbiAgdG9nZ2xlKGV2ZW50LCB0cmlnZ2VyKSB7XG4gICAgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgdGhpcy5jbG9zZShldmVudCwgdHJpZ2dlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKGV2ZW50LCB0cmlnZ2VyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBrZXlib2FyZCBpbnB1dCB3aGVuIGRldGVjdGVkLiBXaGVuIHRoZSBlc2NhcGUga2V5IGlzIHByZXNzZWQsIHRoZSBvZmYtY2FudmFzIG1lbnUgY2xvc2VzLCBhbmQgZm9jdXMgaXMgcmVzdG9yZWQgdG8gdGhlIGVsZW1lbnQgdGhhdCBvcGVuZWQgdGhlIG1lbnUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2hhbmRsZUtleWJvYXJkKGUpIHtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnT2ZmQ2FudmFzJywge1xuICAgICAgY2xvc2U6ICgpID0+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0sXG4gICAgICBoYW5kbGVkOiAoKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgb2ZmY2FudmFzIHBsdWdpbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRyaWdnZXIgLnpmLm9mZmNhbnZhcycpO1xuICAgIHRoaXMuJG92ZXJsYXkub2ZmKCcuemYub2ZmY2FudmFzJyk7XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuT2ZmQ2FudmFzLmRlZmF1bHRzID0ge1xuICAvKipcbiAgICogQWxsb3cgdGhlIHVzZXIgdG8gY2xpY2sgb3V0c2lkZSBvZiB0aGUgbWVudSB0byBjbG9zZSBpdC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbG9zZU9uQ2xpY2s6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFkZHMgYW4gb3ZlcmxheSBvbiB0b3Agb2YgYFtkYXRhLW9mZi1jYW52YXMtY29udGVudF1gLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNvbnRlbnRPdmVybGF5OiB0cnVlLFxuXG4gIC8qKlxuICAgKiBFbmFibGUvZGlzYWJsZSBzY3JvbGxpbmcgb2YgdGhlIG1haW4gY29udGVudCB3aGVuIGFuIG9mZiBjYW52YXMgcGFuZWwgaXMgb3Blbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjb250ZW50U2Nyb2xsOiB0cnVlLFxuXG4gIC8qKlxuICAgKiBBbW91bnQgb2YgdGltZSBpbiBtcyB0aGUgb3BlbiBhbmQgY2xvc2UgdHJhbnNpdGlvbiByZXF1aXJlcy4gSWYgbm9uZSBzZWxlY3RlZCwgcHVsbHMgZnJvbSBib2R5IHN0eWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cbiAgdHJhbnNpdGlvblRpbWU6IDAsXG5cbiAgLyoqXG4gICAqIFR5cGUgb2YgdHJhbnNpdGlvbiBmb3IgdGhlIG9mZmNhbnZhcyBtZW51LiBPcHRpb25zIGFyZSAncHVzaCcsICdkZXRhY2hlZCcgb3IgJ3NsaWRlJy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBwdXNoXG4gICAqL1xuICB0cmFuc2l0aW9uOiAncHVzaCcsXG5cbiAgLyoqXG4gICAqIEZvcmNlIHRoZSBwYWdlIHRvIHNjcm9sbCB0byB0b3Agb3IgYm90dG9tIG9uIG9wZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdG9wXG4gICAqL1xuICBmb3JjZVRvOiBudWxsLFxuXG4gIC8qKlxuICAgKiBBbGxvdyB0aGUgb2ZmY2FudmFzIHRvIHJlbWFpbiBvcGVuIGZvciBjZXJ0YWluIGJyZWFrcG9pbnRzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBpc1JldmVhbGVkOiBmYWxzZSxcblxuICAvKipcbiAgICogQnJlYWtwb2ludCBhdCB3aGljaCB0byByZXZlYWwuIEpTIHdpbGwgdXNlIGEgUmVnRXhwIHRvIHRhcmdldCBzdGFuZGFyZCBjbGFzc2VzLCBpZiBjaGFuZ2luZyBjbGFzc25hbWVzLCBwYXNzIHlvdXIgY2xhc3Mgd2l0aCB0aGUgYHJldmVhbENsYXNzYCBvcHRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgcmV2ZWFsLWZvci1sYXJnZVxuICAgKi9cbiAgcmV2ZWFsT246IG51bGwsXG5cbiAgLyoqXG4gICAqIEZvcmNlIGZvY3VzIHRvIHRoZSBvZmZjYW52YXMgb24gb3Blbi4gSWYgdHJ1ZSwgd2lsbCBmb2N1cyB0aGUgb3BlbmluZyB0cmlnZ2VyIG9uIGNsb3NlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGF1dG9Gb2N1czogdHJ1ZSxcblxuICAvKipcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXG4gICAqIEBvcHRpb25cbiAgICogVE9ETyBpbXByb3ZlIHRoZSByZWdleCB0ZXN0aW5nIGZvciB0aGlzLlxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXG4gICAqL1xuICByZXZlYWxDbGFzczogJ3JldmVhbC1mb3ItJyxcblxuICAvKipcbiAgICogVHJpZ2dlcnMgb3B0aW9uYWwgZm9jdXMgdHJhcHBpbmcgd2hlbiBvcGVuaW5nIGFuIG9mZmNhbnZhcy4gU2V0cyB0YWJpbmRleCBvZiBbZGF0YS1vZmYtY2FudmFzLWNvbnRlbnRdIHRvIC0xIGZvciBhY2Nlc3NpYmlsaXR5IHB1cnBvc2VzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIHRyYXBGb2N1czogZmFsc2Vcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKE9mZkNhbnZhcywgJ09mZkNhbnZhcycpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogT3JiaXQgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm9yYml0XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRvdWNoXG4gKi9cblxuY2xhc3MgT3JiaXQge1xuICAvKipcbiAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIG9yYml0IGNhcm91c2VsLlxuICAqIEBjbGFzc1xuICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYW4gT3JiaXQgQ2Fyb3VzZWwuXG4gICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKXtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgT3JiaXQuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ09yYml0Jyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignT3JiaXQnLCB7XG4gICAgICAnbHRyJzoge1xuICAgICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXG4gICAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJ1xuICAgICAgfSxcbiAgICAgICdydGwnOiB7XG4gICAgICAgICdBUlJPV19MRUZUJzogJ25leHQnLFxuICAgICAgICAnQVJST1dfUklHSFQnOiAncHJldmlvdXMnXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IGNyZWF0aW5nIGpRdWVyeSBjb2xsZWN0aW9ucywgc2V0dGluZyBhdHRyaWJ1dGVzLCBhbmQgc3RhcnRpbmcgdGhlIGFuaW1hdGlvbi5cbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqL1xuICBfaW5pdCgpIHtcbiAgICAvLyBAVE9ETzogY29uc2lkZXIgZGlzY3Vzc2lvbiBvbiBQUiAjOTI3OCBhYm91dCBET00gcG9sbHV0aW9uIGJ5IGNoYW5nZVNsaWRlXG4gICAgdGhpcy5fcmVzZXQoKTtcblxuICAgIHRoaXMuJHdyYXBwZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5jb250YWluZXJDbGFzc31gKTtcbiAgICB0aGlzLiRzbGlkZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApO1xuXG4gICAgdmFyICRpbWFnZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2ltZycpLFxuICAgICAgICBpbml0QWN0aXZlID0gdGhpcy4kc2xpZGVzLmZpbHRlcignLmlzLWFjdGl2ZScpLFxuICAgICAgICBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnb3JiaXQnKTtcblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XG4gICAgICAnZGF0YS1yZXNpemUnOiBpZCxcbiAgICAgICdpZCc6IGlkXG4gICAgfSk7XG5cbiAgICBpZiAoIWluaXRBY3RpdmUubGVuZ3RoKSB7XG4gICAgICB0aGlzLiRzbGlkZXMuZXEoMCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLnVzZU1VSSkge1xuICAgICAgdGhpcy4kc2xpZGVzLmFkZENsYXNzKCduby1tb3Rpb251aScpO1xuICAgIH1cblxuICAgIGlmICgkaW1hZ2VzLmxlbmd0aCkge1xuICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCB0aGlzLl9wcmVwYXJlRm9yT3JiaXQuYmluZCh0aGlzKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3ByZXBhcmVGb3JPcmJpdCgpOy8vaGVoZVxuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xuICAgICAgdGhpcy5fbG9hZEJ1bGxldHMoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1BsYXkgJiYgdGhpcy4kc2xpZGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRoaXMuZ2VvU3luYygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYWNjZXNzaWJsZSkgeyAvLyBhbGxvdyB3cmFwcGVyIHRvIGJlIGZvY3VzYWJsZSB0byBlbmFibGUgYXJyb3cgbmF2aWdhdGlvblxuICAgICAgdGhpcy4kd3JhcHBlci5hdHRyKCd0YWJpbmRleCcsIDApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIENyZWF0ZXMgYSBqUXVlcnkgY29sbGVjdGlvbiBvZiBidWxsZXRzLCBpZiB0aGV5IGFyZSBiZWluZyB1c2VkLlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICovXG4gIF9sb2FkQnVsbGV0cygpIHtcbiAgICB0aGlzLiRidWxsZXRzID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYm94T2ZCdWxsZXRzfWApLmZpbmQoJ2J1dHRvbicpO1xuICB9XG5cbiAgLyoqXG4gICogU2V0cyBhIGB0aW1lcmAgb2JqZWN0IG9uIHRoZSBvcmJpdCwgYW5kIHN0YXJ0cyB0aGUgY291bnRlciBmb3IgdGhlIG5leHQgc2xpZGUuXG4gICogQGZ1bmN0aW9uXG4gICovXG4gIGdlb1N5bmMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLnRpbWVyID0gbmV3IEZvdW5kYXRpb24uVGltZXIoXG4gICAgICB0aGlzLiRlbGVtZW50LFxuICAgICAge1xuICAgICAgICBkdXJhdGlvbjogdGhpcy5vcHRpb25zLnRpbWVyRGVsYXksXG4gICAgICAgIGluZmluaXRlOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcbiAgICAgIH0pO1xuICAgIHRoaXMudGltZXIuc3RhcnQoKTtcbiAgfVxuXG4gIC8qKlxuICAqIFNldHMgd3JhcHBlciBhbmQgc2xpZGUgaGVpZ2h0cyBmb3IgdGhlIG9yYml0LlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICovXG4gIF9wcmVwYXJlRm9yT3JiaXQoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLl9zZXRXcmFwcGVySGVpZ2h0KCk7XG4gIH1cblxuICAvKipcbiAgKiBDYWx1bGF0ZXMgdGhlIGhlaWdodCBvZiBlYWNoIHNsaWRlIGluIHRoZSBjb2xsZWN0aW9uLCBhbmQgdXNlcyB0aGUgdGFsbGVzdCBvbmUgZm9yIHRoZSB3cmFwcGVyIGhlaWdodC5cbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiIC0gYSBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIHdoZW4gY29tcGxldGUuXG4gICovXG4gIF9zZXRXcmFwcGVySGVpZ2h0KGNiKSB7Ly9yZXdyaXRlIHRoaXMgdG8gYGZvcmAgbG9vcFxuICAgIHZhciBtYXggPSAwLCB0ZW1wLCBjb3VudGVyID0gMCwgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICB0ZW1wID0gdGhpcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQ7XG4gICAgICAkKHRoaXMpLmF0dHIoJ2RhdGEtc2xpZGUnLCBjb3VudGVyKTtcblxuICAgICAgaWYgKF90aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJylbMF0gIT09IF90aGlzLiRzbGlkZXMuZXEoY291bnRlcilbMF0pIHsvL2lmIG5vdCB0aGUgYWN0aXZlIHNsaWRlLCBzZXQgY3NzIHBvc2l0aW9uIGFuZCBkaXNwbGF5IHByb3BlcnR5XG4gICAgICAgICQodGhpcykuY3NzKHsncG9zaXRpb24nOiAncmVsYXRpdmUnLCAnZGlzcGxheSc6ICdub25lJ30pO1xuICAgICAgfVxuICAgICAgbWF4ID0gdGVtcCA+IG1heCA/IHRlbXAgOiBtYXg7XG4gICAgICBjb3VudGVyKys7XG4gICAgfSk7XG5cbiAgICBpZiAoY291bnRlciA9PT0gdGhpcy4kc2xpZGVzLmxlbmd0aCkge1xuICAgICAgdGhpcy4kd3JhcHBlci5jc3MoeydoZWlnaHQnOiBtYXh9KTsgLy9vbmx5IGNoYW5nZSB0aGUgd3JhcHBlciBoZWlnaHQgcHJvcGVydHkgb25jZS5cbiAgICAgIGlmKGNiKSB7Y2IobWF4KTt9IC8vZmlyZSBjYWxsYmFjayB3aXRoIG1heCBoZWlnaHQgZGltZW5zaW9uLlxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIFNldHMgdGhlIG1heC1oZWlnaHQgb2YgZWFjaCBzbGlkZS5cbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqL1xuICBfc2V0U2xpZGVIZWlnaHQoaGVpZ2h0KSB7XG4gICAgdGhpcy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAkKHRoaXMpLmNzcygnbWF4LWhlaWdodCcsIGhlaWdodCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyB0byBiYXNpY2FsbHkgZXZlcnl0aGluZyB3aXRoaW4gdGhlIGVsZW1lbnQuXG4gICogQGZ1bmN0aW9uXG4gICogQHByaXZhdGVcbiAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAvLyoqTm93IHVzaW5nIGN1c3RvbSBldmVudCAtIHRoYW5rcyB0bzoqKlxuICAgIC8vKiogICAgICBZb2hhaSBBcmFyYXQgb2YgVG9yb250byAgICAgICoqXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAvL1xuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcucmVzaXplbWUuemYudHJpZ2dlcicpLm9uKHtcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5fcHJlcGFyZUZvck9yYml0LmJpbmQodGhpcylcbiAgICB9KVxuICAgIGlmICh0aGlzLiRzbGlkZXMubGVuZ3RoID4gMSkge1xuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnN3aXBlKSB7XG4gICAgICAgIHRoaXMuJHNsaWRlcy5vZmYoJ3N3aXBlbGVmdC56Zi5vcmJpdCBzd2lwZXJpZ2h0LnpmLm9yYml0JylcbiAgICAgICAgLm9uKCdzd2lwZWxlZnQuemYub3JiaXQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUodHJ1ZSk7XG4gICAgICAgIH0pLm9uKCdzd2lwZXJpZ2h0LnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QbGF5KSB7XG4gICAgICAgIHRoaXMuJHNsaWRlcy5vbignY2xpY2suemYub3JiaXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICBfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nLCBfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSA/IGZhbHNlIDogdHJ1ZSk7XG4gICAgICAgICAgX3RoaXMudGltZXJbX3RoaXMuJGVsZW1lbnQuZGF0YSgnY2xpY2tlZE9uJykgPyAncGF1c2UnIDogJ3N0YXJ0J10oKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXVzZU9uSG92ZXIpIHtcbiAgICAgICAgICB0aGlzLiRlbGVtZW50Lm9uKCdtb3VzZWVudGVyLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy50aW1lci5wYXVzZSgpO1xuICAgICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLm9yYml0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIV90aGlzLiRlbGVtZW50LmRhdGEoJ2NsaWNrZWRPbicpKSB7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVyLnN0YXJ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5uYXZCdXR0b25zKSB7XG4gICAgICAgIHZhciAkY29udHJvbHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoYC4ke3RoaXMub3B0aW9ucy5uZXh0Q2xhc3N9LCAuJHt0aGlzLm9wdGlvbnMucHJldkNsYXNzfWApO1xuICAgICAgICAkY29udHJvbHMuYXR0cigndGFiaW5kZXgnLCAwKVxuICAgICAgICAvL2Fsc28gbmVlZCB0byBoYW5kbGUgZW50ZXIvcmV0dXJuIGFuZCBzcGFjZWJhciBrZXkgcHJlc3Nlc1xuICAgICAgICAub24oJ2NsaWNrLnpmLm9yYml0IHRvdWNoZW5kLnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XG5cdCAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKCQodGhpcykuaGFzQ2xhc3MoX3RoaXMub3B0aW9ucy5uZXh0Q2xhc3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuYnVsbGV0cykge1xuICAgICAgICB0aGlzLiRidWxsZXRzLm9uKCdjbGljay56Zi5vcmJpdCB0b3VjaGVuZC56Zi5vcmJpdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGlmICgvaXMtYWN0aXZlL2cudGVzdCh0aGlzLmNsYXNzTmFtZSkpIHsgcmV0dXJuIGZhbHNlOyB9Ly9pZiB0aGlzIGlzIGFjdGl2ZSwga2ljayBvdXQgb2YgZnVuY3Rpb24uXG4gICAgICAgICAgdmFyIGlkeCA9ICQodGhpcykuZGF0YSgnc2xpZGUnKSxcbiAgICAgICAgICBsdHIgPSBpZHggPiBfdGhpcy4kc2xpZGVzLmZpbHRlcignLmlzLWFjdGl2ZScpLmRhdGEoJ3NsaWRlJyksXG4gICAgICAgICAgJHNsaWRlID0gX3RoaXMuJHNsaWRlcy5lcShpZHgpO1xuXG4gICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUobHRyLCAkc2xpZGUsIGlkeCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmFjY2Vzc2libGUpIHtcbiAgICAgICAgdGhpcy4kd3JhcHBlci5hZGQodGhpcy4kYnVsbGV0cykub24oJ2tleWRvd24uemYub3JiaXQnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgLy8gaGFuZGxlIGtleWJvYXJkIGV2ZW50IHdpdGgga2V5Ym9hcmQgdXRpbFxuICAgICAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsICdPcmJpdCcsIHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGZhbHNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHsgLy8gaWYgYnVsbGV0IGlzIGZvY3VzZWQsIG1ha2Ugc3VyZSBmb2N1cyBtb3Zlc1xuICAgICAgICAgICAgICBpZiAoJChlLnRhcmdldCkuaXMoX3RoaXMuJGJ1bGxldHMpKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuJGJ1bGxldHMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzZXRzIE9yYml0IHNvIGl0IGNhbiBiZSByZWluaXRpYWxpemVkXG4gICAqL1xuICBfcmVzZXQoKSB7XG4gICAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgdGhlcmUgYXJlIG5vIHNsaWRlcyAoZmlyc3QgcnVuKVxuICAgIGlmICh0eXBlb2YgdGhpcy4kc2xpZGVzID09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuJHNsaWRlcy5sZW5ndGggPiAxKSB7XG4gICAgICAvLyBSZW1vdmUgb2xkIGV2ZW50c1xuICAgICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5vcmJpdCcpLmZpbmQoJyonKS5vZmYoJy56Zi5vcmJpdCcpXG5cbiAgICAgIC8vIFJlc3RhcnQgdGltZXIgaWYgYXV0b1BsYXkgaXMgZW5hYmxlZFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUGxheSkge1xuICAgICAgICB0aGlzLnRpbWVyLnJlc3RhcnQoKTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVzZXQgYWxsIHNsaWRkZXNcbiAgICAgIHRoaXMuJHNsaWRlcy5lYWNoKGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICQoZWwpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtYWN0aXZlIGlzLWluJylcbiAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1saXZlJylcbiAgICAgICAgICAuaGlkZSgpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFNob3cgdGhlIGZpcnN0IHNsaWRlXG4gICAgICB0aGlzLiRzbGlkZXMuZmlyc3QoKS5hZGRDbGFzcygnaXMtYWN0aXZlJykuc2hvdygpO1xuXG4gICAgICAvLyBUcmlnZ2VycyB3aGVuIHRoZSBzbGlkZSBoYXMgZmluaXNoZWQgYW5pbWF0aW5nXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3NsaWRlY2hhbmdlLnpmLm9yYml0JywgW3RoaXMuJHNsaWRlcy5maXJzdCgpXSk7XG5cbiAgICAgIC8vIFNlbGVjdCBmaXJzdCBidWxsZXQgaWYgYnVsbGV0cyBhcmUgcHJlc2VudFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5idWxsZXRzKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZUJ1bGxldHMoMCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogQ2hhbmdlcyB0aGUgY3VycmVudCBzbGlkZSB0byBhIG5ldyBvbmUuXG4gICogQGZ1bmN0aW9uXG4gICogQHBhcmFtIHtCb29sZWFufSBpc0xUUiAtIGZsYWcgaWYgdGhlIHNsaWRlIHNob3VsZCBtb3ZlIGxlZnQgdG8gcmlnaHQuXG4gICogQHBhcmFtIHtqUXVlcnl9IGNob3NlblNsaWRlIC0gdGhlIGpRdWVyeSBlbGVtZW50IG9mIHRoZSBzbGlkZSB0byBzaG93IG5leHQsIGlmIG9uZSBpcyBzZWxlY3RlZC5cbiAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gdGhlIGluZGV4IG9mIHRoZSBuZXcgc2xpZGUgaW4gaXRzIGNvbGxlY3Rpb24sIGlmIG9uZSBjaG9zZW4uXG4gICogQGZpcmVzIE9yYml0I3NsaWRlY2hhbmdlXG4gICovXG4gIGNoYW5nZVNsaWRlKGlzTFRSLCBjaG9zZW5TbGlkZSwgaWR4KSB7XG4gICAgaWYgKCF0aGlzLiRzbGlkZXMpIHtyZXR1cm47IH0gLy8gRG9uJ3QgZnJlYWsgb3V0IGlmIHdlJ3JlIGluIHRoZSBtaWRkbGUgb2YgY2xlYW51cFxuICAgIHZhciAkY3VyU2xpZGUgPSB0aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZXEoMCk7XG5cbiAgICBpZiAoL211aS9nLnRlc3QoJGN1clNsaWRlWzBdLmNsYXNzTmFtZSkpIHsgcmV0dXJuIGZhbHNlOyB9IC8vaWYgdGhlIHNsaWRlIGlzIGN1cnJlbnRseSBhbmltYXRpbmcsIGtpY2sgb3V0IG9mIHRoZSBmdW5jdGlvblxuXG4gICAgdmFyICRmaXJzdFNsaWRlID0gdGhpcy4kc2xpZGVzLmZpcnN0KCksXG4gICAgJGxhc3RTbGlkZSA9IHRoaXMuJHNsaWRlcy5sYXN0KCksXG4gICAgZGlySW4gPSBpc0xUUiA/ICdSaWdodCcgOiAnTGVmdCcsXG4gICAgZGlyT3V0ID0gaXNMVFIgPyAnTGVmdCcgOiAnUmlnaHQnLFxuICAgIF90aGlzID0gdGhpcyxcbiAgICAkbmV3U2xpZGU7XG5cbiAgICBpZiAoIWNob3NlblNsaWRlKSB7IC8vbW9zdCBvZiB0aGUgdGltZSwgdGhpcyB3aWxsIGJlIGF1dG8gcGxheWVkIG9yIGNsaWNrZWQgZnJvbSB0aGUgbmF2QnV0dG9ucy5cbiAgICAgICRuZXdTbGlkZSA9IGlzTFRSID8gLy9pZiB3cmFwcGluZyBlbmFibGVkLCBjaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYSBgbmV4dGAgb3IgYHByZXZgIHNpYmxpbmcsIGlmIG5vdCwgc2VsZWN0IHRoZSBmaXJzdCBvciBsYXN0IHNsaWRlIHRvIGZpbGwgaW4uIGlmIHdyYXBwaW5nIG5vdCBlbmFibGVkLCBhdHRlbXB0IHRvIHNlbGVjdCBgbmV4dGAgb3IgYHByZXZgLCBpZiB0aGVyZSdzIG5vdGhpbmcgdGhlcmUsIHRoZSBmdW5jdGlvbiB3aWxsIGtpY2sgb3V0IG9uIG5leHQgc3RlcC4gQ1JBWlkgTkVTVEVEIFRFUk5BUklFUyEhISEhXG4gICAgICAodGhpcy5vcHRpb25zLmluZmluaXRlV3JhcCA/ICRjdXJTbGlkZS5uZXh0KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKS5sZW5ndGggPyAkY3VyU2xpZGUubmV4dChgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkgOiAkZmlyc3RTbGlkZSA6ICRjdXJTbGlkZS5uZXh0KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKSkvL3BpY2sgbmV4dCBzbGlkZSBpZiBtb3ZpbmcgbGVmdCB0byByaWdodFxuICAgICAgOlxuICAgICAgKHRoaXMub3B0aW9ucy5pbmZpbml0ZVdyYXAgPyAkY3VyU2xpZGUucHJldihgLiR7dGhpcy5vcHRpb25zLnNsaWRlQ2xhc3N9YCkubGVuZ3RoID8gJGN1clNsaWRlLnByZXYoYC4ke3RoaXMub3B0aW9ucy5zbGlkZUNsYXNzfWApIDogJGxhc3RTbGlkZSA6ICRjdXJTbGlkZS5wcmV2KGAuJHt0aGlzLm9wdGlvbnMuc2xpZGVDbGFzc31gKSk7Ly9waWNrIHByZXYgc2xpZGUgaWYgbW92aW5nIHJpZ2h0IHRvIGxlZnRcbiAgICB9IGVsc2Uge1xuICAgICAgJG5ld1NsaWRlID0gY2hvc2VuU2xpZGU7XG4gICAgfVxuXG4gICAgaWYgKCRuZXdTbGlkZS5sZW5ndGgpIHtcbiAgICAgIC8qKlxuICAgICAgKiBUcmlnZ2VycyBiZWZvcmUgdGhlIG5leHQgc2xpZGUgc3RhcnRzIGFuaW1hdGluZyBpbiBhbmQgb25seSBpZiBhIG5leHQgc2xpZGUgaGFzIGJlZW4gZm91bmQuXG4gICAgICAqIEBldmVudCBPcmJpdCNiZWZvcmVzbGlkZWNoYW5nZVxuICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignYmVmb3Jlc2xpZGVjaGFuZ2UuemYub3JiaXQnLCBbJGN1clNsaWRlLCAkbmV3U2xpZGVdKTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5idWxsZXRzKSB7XG4gICAgICAgIGlkeCA9IGlkeCB8fCB0aGlzLiRzbGlkZXMuaW5kZXgoJG5ld1NsaWRlKTsgLy9ncmFiIGluZGV4IHRvIHVwZGF0ZSBidWxsZXRzXG4gICAgICAgIHRoaXMuX3VwZGF0ZUJ1bGxldHMoaWR4KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy51c2VNVUkgJiYgIXRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4oXG4gICAgICAgICAgJG5ld1NsaWRlLmFkZENsYXNzKCdpcy1hY3RpdmUnKS5jc3Moeydwb3NpdGlvbic6ICdhYnNvbHV0ZScsICd0b3AnOiAwfSksXG4gICAgICAgICAgdGhpcy5vcHRpb25zW2BhbmltSW5Gcm9tJHtkaXJJbn1gXSxcbiAgICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgJG5ld1NsaWRlLmNzcyh7J3Bvc2l0aW9uJzogJ3JlbGF0aXZlJywgJ2Rpc3BsYXknOiAnYmxvY2snfSlcbiAgICAgICAgICAgIC5hdHRyKCdhcmlhLWxpdmUnLCAncG9saXRlJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoXG4gICAgICAgICAgJGN1clNsaWRlLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKSxcbiAgICAgICAgICB0aGlzLm9wdGlvbnNbYGFuaW1PdXRUbyR7ZGlyT3V0fWBdLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAkY3VyU2xpZGUucmVtb3ZlQXR0cignYXJpYS1saXZlJyk7XG4gICAgICAgICAgICBpZihfdGhpcy5vcHRpb25zLmF1dG9QbGF5ICYmICFfdGhpcy50aW1lci5pc1BhdXNlZCl7XG4gICAgICAgICAgICAgIF90aGlzLnRpbWVyLnJlc3RhcnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vZG8gc3R1ZmY/XG4gICAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAkY3VyU2xpZGUucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1pbicpLnJlbW92ZUF0dHIoJ2FyaWEtbGl2ZScpLmhpZGUoKTtcbiAgICAgICAgJG5ld1NsaWRlLmFkZENsYXNzKCdpcy1hY3RpdmUgaXMtaW4nKS5hdHRyKCdhcmlhLWxpdmUnLCAncG9saXRlJykuc2hvdygpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9QbGF5ICYmICF0aGlzLnRpbWVyLmlzUGF1c2VkKSB7XG4gICAgICAgICAgdGhpcy50aW1lci5yZXN0YXJ0KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAvKipcbiAgICAqIFRyaWdnZXJzIHdoZW4gdGhlIHNsaWRlIGhhcyBmaW5pc2hlZCBhbmltYXRpbmcgaW4uXG4gICAgKiBAZXZlbnQgT3JiaXQjc2xpZGVjaGFuZ2VcbiAgICAqL1xuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdzbGlkZWNoYW5nZS56Zi5vcmJpdCcsIFskbmV3U2xpZGVdKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgKiBVcGRhdGVzIHRoZSBhY3RpdmUgc3RhdGUgb2YgdGhlIGJ1bGxldHMsIGlmIGRpc3BsYXllZC5cbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgc2xpZGUuXG4gICovXG4gIF91cGRhdGVCdWxsZXRzKGlkeCkge1xuICAgIHZhciAkb2xkQnVsbGV0ID0gdGhpcy4kZWxlbWVudC5maW5kKGAuJHt0aGlzLm9wdGlvbnMuYm94T2ZCdWxsZXRzfWApXG4gICAgLmZpbmQoJy5pcy1hY3RpdmUnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJykuYmx1cigpLFxuICAgIHNwYW4gPSAkb2xkQnVsbGV0LmZpbmQoJ3NwYW46bGFzdCcpLmRldGFjaCgpLFxuICAgICRuZXdCdWxsZXQgPSB0aGlzLiRidWxsZXRzLmVxKGlkeCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpLmFwcGVuZChzcGFuKTtcbiAgfVxuXG4gIC8qKlxuICAqIERlc3Ryb3lzIHRoZSBjYXJvdXNlbCBhbmQgaGlkZXMgdGhlIGVsZW1lbnQuXG4gICogQGZ1bmN0aW9uXG4gICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5vcmJpdCcpLmZpbmQoJyonKS5vZmYoJy56Zi5vcmJpdCcpLmVuZCgpLmhpZGUoKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuT3JiaXQuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAqIFRlbGxzIHRoZSBKUyB0byBsb29rIGZvciBhbmQgbG9hZEJ1bGxldHMuXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlIHRydWVcbiAgKi9cbiAgYnVsbGV0czogdHJ1ZSxcbiAgLyoqXG4gICogVGVsbHMgdGhlIEpTIHRvIGFwcGx5IGV2ZW50IGxpc3RlbmVycyB0byBuYXYgYnV0dG9uc1xuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSB0cnVlXG4gICovXG4gIG5hdkJ1dHRvbnM6IHRydWUsXG4gIC8qKlxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ3NsaWRlLWluLXJpZ2h0J1xuICAqL1xuICBhbmltSW5Gcm9tUmlnaHQ6ICdzbGlkZS1pbi1yaWdodCcsXG4gIC8qKlxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ3NsaWRlLW91dC1yaWdodCdcbiAgKi9cbiAgYW5pbU91dFRvUmlnaHQ6ICdzbGlkZS1vdXQtcmlnaHQnLFxuICAvKipcbiAgKiBtb3Rpb24tdWkgYW5pbWF0aW9uIGNsYXNzIHRvIGFwcGx5XG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlICdzbGlkZS1pbi1sZWZ0J1xuICAqXG4gICovXG4gIGFuaW1JbkZyb21MZWZ0OiAnc2xpZGUtaW4tbGVmdCcsXG4gIC8qKlxuICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ3NsaWRlLW91dC1sZWZ0J1xuICAqL1xuICBhbmltT3V0VG9MZWZ0OiAnc2xpZGUtb3V0LWxlZnQnLFxuICAvKipcbiAgKiBBbGxvd3MgT3JiaXQgdG8gYXV0b21hdGljYWxseSBhbmltYXRlIG9uIHBhZ2UgbG9hZC5cbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgdHJ1ZVxuICAqL1xuICBhdXRvUGxheTogdHJ1ZSxcbiAgLyoqXG4gICogQW1vdW50IG9mIHRpbWUsIGluIG1zLCBiZXR3ZWVuIHNsaWRlIHRyYW5zaXRpb25zXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlIDUwMDBcbiAgKi9cbiAgdGltZXJEZWxheTogNTAwMCxcbiAgLyoqXG4gICogQWxsb3dzIE9yYml0IHRvIGluZmluaXRlbHkgbG9vcCB0aHJvdWdoIHRoZSBzbGlkZXNcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgdHJ1ZVxuICAqL1xuICBpbmZpbml0ZVdyYXA6IHRydWUsXG4gIC8qKlxuICAqIEFsbG93cyB0aGUgT3JiaXQgc2xpZGVzIHRvIGJpbmQgdG8gc3dpcGUgZXZlbnRzIGZvciBtb2JpbGUsIHJlcXVpcmVzIGFuIGFkZGl0aW9uYWwgdXRpbCBsaWJyYXJ5XG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlIHRydWVcbiAgKi9cbiAgc3dpcGU6IHRydWUsXG4gIC8qKlxuICAqIEFsbG93cyB0aGUgdGltaW5nIGZ1bmN0aW9uIHRvIHBhdXNlIGFuaW1hdGlvbiBvbiBob3Zlci5cbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgdHJ1ZVxuICAqL1xuICBwYXVzZU9uSG92ZXI6IHRydWUsXG4gIC8qKlxuICAqIEFsbG93cyBPcmJpdCB0byBiaW5kIGtleWJvYXJkIGV2ZW50cyB0byB0aGUgc2xpZGVyLCB0byBhbmltYXRlIGZyYW1lcyB3aXRoIGFycm93IGtleXNcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgdHJ1ZVxuICAqL1xuICBhY2Nlc3NpYmxlOiB0cnVlLFxuICAvKipcbiAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBjb250YWluZXIgb2YgT3JiaXRcbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ29yYml0LWNvbnRhaW5lcidcbiAgKi9cbiAgY29udGFpbmVyQ2xhc3M6ICdvcmJpdC1jb250YWluZXInLFxuICAvKipcbiAgKiBDbGFzcyBhcHBsaWVkIHRvIGluZGl2aWR1YWwgc2xpZGVzLlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnb3JiaXQtc2xpZGUnXG4gICovXG4gIHNsaWRlQ2xhc3M6ICdvcmJpdC1zbGlkZScsXG4gIC8qKlxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGJ1bGxldCBjb250YWluZXIuIFlvdSdyZSB3ZWxjb21lLlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnb3JiaXQtYnVsbGV0cydcbiAgKi9cbiAgYm94T2ZCdWxsZXRzOiAnb3JiaXQtYnVsbGV0cycsXG4gIC8qKlxuICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGBuZXh0YCBuYXZpZ2F0aW9uIGJ1dHRvbi5cbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ29yYml0LW5leHQnXG4gICovXG4gIG5leHRDbGFzczogJ29yYml0LW5leHQnLFxuICAvKipcbiAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBgcHJldmlvdXNgIG5hdmlnYXRpb24gYnV0dG9uLlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSAnb3JiaXQtcHJldmlvdXMnXG4gICovXG4gIHByZXZDbGFzczogJ29yYml0LXByZXZpb3VzJyxcbiAgLyoqXG4gICogQm9vbGVhbiB0byBmbGFnIHRoZSBqcyB0byB1c2UgbW90aW9uIHVpIGNsYXNzZXMgb3Igbm90LiBEZWZhdWx0IHRvIHRydWUgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5LlxuICAqIEBvcHRpb25cbiAgKiBAZXhhbXBsZSB0cnVlXG4gICovXG4gIHVzZU1VSTogdHJ1ZVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKE9yYml0LCAnT3JiaXQnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJlc3BvbnNpdmVNZW51IG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmFjY29yZGlvbk1lbnVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuZHJpbGxkb3duXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyb3Bkb3duLW1lbnVcbiAqL1xuXG5jbGFzcyBSZXNwb25zaXZlTWVudSB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgcmVzcG9uc2l2ZSBtZW51LlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVNZW51I2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhIGRyb3Bkb3duIG1lbnUuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcbiAgICB0aGlzLnJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdyZXNwb25zaXZlLW1lbnUnKTtcbiAgICB0aGlzLmN1cnJlbnRNcSA9IG51bGw7XG4gICAgdGhpcy5jdXJyZW50UGx1Z2luID0gbnVsbDtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICB0aGlzLl9ldmVudHMoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Jlc3BvbnNpdmVNZW51Jyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1lbnUgYnkgcGFyc2luZyB0aGUgY2xhc3NlcyBmcm9tIHRoZSAnZGF0YS1SZXNwb25zaXZlTWVudScgYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIC8vIFRoZSBmaXJzdCB0aW1lIGFuIEludGVyY2hhbmdlIHBsdWdpbiBpcyBpbml0aWFsaXplZCwgdGhpcy5ydWxlcyBpcyBjb252ZXJ0ZWQgZnJvbSBhIHN0cmluZyBvZiBcImNsYXNzZXNcIiB0byBhbiBvYmplY3Qgb2YgcnVsZXNcbiAgICBpZiAodHlwZW9mIHRoaXMucnVsZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBsZXQgcnVsZXNUcmVlID0ge307XG5cbiAgICAgIC8vIFBhcnNlIHJ1bGVzIGZyb20gXCJjbGFzc2VzXCIgcHVsbGVkIGZyb20gZGF0YSBhdHRyaWJ1dGVcbiAgICAgIGxldCBydWxlcyA9IHRoaXMucnVsZXMuc3BsaXQoJyAnKTtcblxuICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IHJ1bGUgZm91bmRcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IHJ1bGUgPSBydWxlc1tpXS5zcGxpdCgnLScpO1xuICAgICAgICBsZXQgcnVsZVNpemUgPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzBdIDogJ3NtYWxsJztcbiAgICAgICAgbGV0IHJ1bGVQbHVnaW4gPSBydWxlLmxlbmd0aCA+IDEgPyBydWxlWzFdIDogcnVsZVswXTtcblxuICAgICAgICBpZiAoTWVudVBsdWdpbnNbcnVsZVBsdWdpbl0gIT09IG51bGwpIHtcbiAgICAgICAgICBydWxlc1RyZWVbcnVsZVNpemVdID0gTWVudVBsdWdpbnNbcnVsZVBsdWdpbl07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5ydWxlcyA9IHJ1bGVzVHJlZTtcbiAgICB9XG5cbiAgICBpZiAoISQuaXNFbXB0eU9iamVjdCh0aGlzLnJ1bGVzKSkge1xuICAgICAgdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcbiAgICB9XG4gICAgLy8gQWRkIGRhdGEtbXV0YXRlIHNpbmNlIGNoaWxkcmVuIG1heSBuZWVkIGl0LlxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1tdXRhdGUnLCAodGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLW11dGF0ZScpIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3Jlc3BvbnNpdmUtbWVudScpKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgTWVudS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XG4gICAgfSk7XG4gICAgLy8gJCh3aW5kb3cpLm9uKCdyZXNpemUuemYuUmVzcG9uc2l2ZU1lbnUnLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xuICAgIC8vIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyB0aGUgY3VycmVudCBzY3JlZW4gd2lkdGggYWdhaW5zdCBhdmFpbGFibGUgbWVkaWEgcXVlcmllcy4gSWYgdGhlIG1lZGlhIHF1ZXJ5IGhhcyBjaGFuZ2VkLCBhbmQgdGhlIHBsdWdpbiBuZWVkZWQgaGFzIGNoYW5nZWQsIHRoZSBwbHVnaW5zIHdpbGwgc3dhcCBvdXQuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2NoZWNrTWVkaWFRdWVyaWVzKCkge1xuICAgIHZhciBtYXRjaGVkTXEsIF90aGlzID0gdGhpcztcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBydWxlIGFuZCBmaW5kIHRoZSBsYXN0IG1hdGNoaW5nIHJ1bGVcbiAgICAkLmVhY2godGhpcy5ydWxlcywgZnVuY3Rpb24oa2V5KSB7XG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3Qoa2V5KSkge1xuICAgICAgICBtYXRjaGVkTXEgPSBrZXk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBObyBtYXRjaD8gTm8gZGljZVxuICAgIGlmICghbWF0Y2hlZE1xKSByZXR1cm47XG5cbiAgICAvLyBQbHVnaW4gYWxyZWFkeSBpbml0aWFsaXplZD8gV2UgZ29vZFxuICAgIGlmICh0aGlzLmN1cnJlbnRQbHVnaW4gaW5zdGFuY2VvZiB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKSByZXR1cm47XG5cbiAgICAvLyBSZW1vdmUgZXhpc3RpbmcgcGx1Z2luLXNwZWNpZmljIENTUyBjbGFzc2VzXG4gICAgJC5lYWNoKE1lbnVQbHVnaW5zLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XG4gICAgICBfdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyh2YWx1ZS5jc3NDbGFzcyk7XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdGhlIENTUyBjbGFzcyBmb3IgdGhlIG5ldyBwbHVnaW5cbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMucnVsZXNbbWF0Y2hlZE1xXS5jc3NDbGFzcyk7XG5cbiAgICAvLyBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIG5ldyBwbHVnaW5cbiAgICBpZiAodGhpcy5jdXJyZW50UGx1Z2luKSB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG5ldyB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKHRoaXMuJGVsZW1lbnQsIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIGN1cnJlbnQgcGx1Z2luIG9uIHRoaXMgZWxlbWVudCwgYXMgd2VsbCBhcyB0aGUgd2luZG93IHJlc2l6ZSBoYW5kbGVyIHRoYXQgc3dpdGNoZXMgdGhlIHBsdWdpbnMgb3V0LlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcbiAgICAkKHdpbmRvdykub2ZmKCcuemYuUmVzcG9uc2l2ZU1lbnUnKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuUmVzcG9uc2l2ZU1lbnUuZGVmYXVsdHMgPSB7fTtcblxuLy8gVGhlIHBsdWdpbiBtYXRjaGVzIHRoZSBwbHVnaW4gY2xhc3NlcyB3aXRoIHRoZXNlIHBsdWdpbiBpbnN0YW5jZXMuXG52YXIgTWVudVBsdWdpbnMgPSB7XG4gIGRyb3Bkb3duOiB7XG4gICAgY3NzQ2xhc3M6ICdkcm9wZG93bicsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcm9wZG93bi1tZW51J10gfHwgbnVsbFxuICB9LFxuIGRyaWxsZG93bjoge1xuICAgIGNzc0NsYXNzOiAnZHJpbGxkb3duJyxcbiAgICBwbHVnaW46IEZvdW5kYXRpb24uX3BsdWdpbnNbJ2RyaWxsZG93biddIHx8IG51bGxcbiAgfSxcbiAgYWNjb3JkaW9uOiB7XG4gICAgY3NzQ2xhc3M6ICdhY2NvcmRpb24tbWVudScsXG4gICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydhY2NvcmRpb24tbWVudSddIHx8IG51bGxcbiAgfVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVNZW51LCAnUmVzcG9uc2l2ZU1lbnUnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFJlc3BvbnNpdmVUb2dnbGUgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGVcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICovXG5cbmNsYXNzIFJlc3BvbnNpdmVUb2dnbGUge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBUYWIgQmFyLlxuICAgKiBAY2xhc3NcbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjaW5pdFxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYXR0YWNoIHRhYiBiYXIgZnVuY3Rpb25hbGl0eSB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXNwb25zaXZlVG9nZ2xlJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYiBiYXIgYnkgZmluZGluZyB0aGUgdGFyZ2V0IGVsZW1lbnQsIHRvZ2dsaW5nIGVsZW1lbnQsIGFuZCBydW5uaW5nIHVwZGF0ZSgpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciB0YXJnZXRJRCA9IHRoaXMuJGVsZW1lbnQuZGF0YSgncmVzcG9uc2l2ZS10b2dnbGUnKTtcbiAgICBpZiAoIXRhcmdldElEKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdZb3VyIHRhYiBiYXIgbmVlZHMgYW4gSUQgb2YgYSBNZW51IGFzIHRoZSB2YWx1ZSBvZiBkYXRhLXRhYi1iYXIuJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kdGFyZ2V0TWVudSA9ICQoYCMke3RhcmdldElEfWApO1xuICAgIHRoaXMuJHRvZ2dsZXIgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXRvZ2dsZV0nKTtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCB0aGlzLiR0YXJnZXRNZW51LmRhdGEoKSk7XG5cbiAgICAvLyBJZiB0aGV5IHdlcmUgc2V0LCBwYXJzZSB0aGUgYW5pbWF0aW9uIGNsYXNzZXNcbiAgICBpZih0aGlzLm9wdGlvbnMuYW5pbWF0ZSkge1xuICAgICAgbGV0IGlucHV0ID0gdGhpcy5vcHRpb25zLmFuaW1hdGUuc3BsaXQoJyAnKTtcblxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xuICAgICAgdGhpcy5hbmltYXRpb25PdXQgPSBpbnB1dFsxXSB8fCBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgbmVjZXNzYXJ5IGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgdGFiIGJhciB0byB3b3JrLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuX3VwZGF0ZU1xSGFuZGxlciA9IHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuXG4gICAgdGhpcy4kdG9nZ2xlci5vbignY2xpY2suemYucmVzcG9uc2l2ZVRvZ2dsZScsIHRoaXMudG9nZ2xlTWVudS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIHRoZSB0YWIgYmFyIHNob3VsZCBiZSB2aXNpYmxlIG9yIGhpZGRlbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfdXBkYXRlKCkge1xuICAgIC8vIE1vYmlsZVxuICAgIGlmICghRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QodGhpcy5vcHRpb25zLmhpZGVGb3IpKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LnNob3coKTtcbiAgICAgIHRoaXMuJHRhcmdldE1lbnUuaGlkZSgpO1xuICAgIH1cblxuICAgIC8vIERlc2t0b3BcbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpO1xuICAgICAgdGhpcy4kdGFyZ2V0TWVudS5zaG93KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRvZ2dsZXMgdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIuIFRoZSB0b2dnbGUgb25seSBoYXBwZW5zIGlmIHRoZSBzY3JlZW4gaXMgc21hbGwgZW5vdWdoIHRvIGFsbG93IGl0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJlc3BvbnNpdmVUb2dnbGUjdG9nZ2xlZFxuICAgKi9cbiAgdG9nZ2xlTWVudSgpIHtcbiAgICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xuICAgICAgaWYodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcbiAgICAgICAgaWYgKHRoaXMuJHRhcmdldE1lbnUuaXMoJzpoaWRkZW4nKSkge1xuICAgICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiR0YXJnZXRNZW51LCB0aGlzLmFuaW1hdGlvbkluLCAoKSA9PiB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIGVsZW1lbnQgYXR0YWNoZWQgdG8gdGhlIHRhYiBiYXIgdG9nZ2xlcy5cbiAgICAgICAgICAgICAqIEBldmVudCBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCd0b2dnbGVkLnpmLnJlc3BvbnNpdmVUb2dnbGUnKTtcbiAgICAgICAgICAgIHRoaXMuJHRhcmdldE1lbnUuZmluZCgnW2RhdGEtbXV0YXRlXScpLnRyaWdnZXJIYW5kbGVyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiR0YXJnZXRNZW51LCB0aGlzLmFuaW1hdGlvbk91dCwgKCkgPT4ge1xuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgICAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLiR0YXJnZXRNZW51LnRvZ2dsZSgwKTtcbiAgICAgICAgdGhpcy4kdGFyZ2V0TWVudS5maW5kKCdbZGF0YS1tdXRhdGVdJykudHJpZ2dlcignbXV0YXRlbWUuemYudHJpZ2dlcicpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXG4gICAgICAgICAqIEBldmVudCBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG4gICAgdGhpcy4kdG9nZ2xlci5vZmYoJy56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XG5cbiAgICAkKHdpbmRvdykub2ZmKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl91cGRhdGVNcUhhbmRsZXIpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblJlc3BvbnNpdmVUb2dnbGUuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ21lZGl1bSdcbiAgICovXG4gIGhpZGVGb3I6ICdtZWRpdW0nLFxuXG4gIC8qKlxuICAgKiBUbyBkZWNpZGUgaWYgdGhlIHRvZ2dsZSBzaG91bGQgYmUgYW5pbWF0ZWQgb3Igbm90LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhbmltYXRlOiBmYWxzZVxufTtcblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFJlc3BvbnNpdmVUb2dnbGUsICdSZXNwb25zaXZlVG9nZ2xlJyk7XG5cbn0oalF1ZXJ5KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBSZXZlYWwgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJldmVhbFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb24gaWYgdXNpbmcgYW5pbWF0aW9uc1xuICovXG5cbmNsYXNzIFJldmVhbCB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFJldmVhbC5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB1c2UgZm9yIHRoZSBtb2RhbC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvcHRpb25hbCBwYXJhbWV0ZXJzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXZlYWwuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdSZXZlYWwnKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdSZXZlYWwnLCB7XG4gICAgICAnRU5URVInOiAnb3BlbicsXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXG4gICAgICAnRVNDQVBFJzogJ2Nsb3NlJyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbW9kYWwgYnkgYWRkaW5nIHRoZSBvdmVybGF5IGFuZCBjbG9zZSBidXR0b25zLCAoaWYgc2VsZWN0ZWQpLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdGhpcy5pZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignaWQnKTtcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgdGhpcy5jYWNoZWQgPSB7bXE6IEZvdW5kYXRpb24uTWVkaWFRdWVyeS5jdXJyZW50fTtcbiAgICB0aGlzLmlzTW9iaWxlID0gbW9iaWxlU25pZmYoKTtcblxuICAgIHRoaXMuJGFuY2hvciA9ICQoYFtkYXRhLW9wZW49XCIke3RoaXMuaWR9XCJdYCkubGVuZ3RoID8gJChgW2RhdGEtb3Blbj1cIiR7dGhpcy5pZH1cIl1gKSA6ICQoYFtkYXRhLXRvZ2dsZT1cIiR7dGhpcy5pZH1cIl1gKTtcbiAgICB0aGlzLiRhbmNob3IuYXR0cih7XG4gICAgICAnYXJpYS1jb250cm9scyc6IHRoaXMuaWQsXG4gICAgICAnYXJpYS1oYXNwb3B1cCc6IHRydWUsXG4gICAgICAndGFiaW5kZXgnOiAwXG4gICAgfSk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZnVsbCcpKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbiA9IHRydWU7XG4gICAgICB0aGlzLm9wdGlvbnMub3ZlcmxheSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgIXRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkgPSB0aGlzLl9tYWtlT3ZlcmxheSh0aGlzLmlkKTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xuICAgICAgICAncm9sZSc6ICdkaWFsb2cnLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxuICAgICAgICAnZGF0YS15ZXRpLWJveCc6IHRoaXMuaWQsXG4gICAgICAgICdkYXRhLXJlc2l6ZSc6IHRoaXMuaWRcbiAgICB9KTtcblxuICAgIGlmKHRoaXMuJG92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8odGhpcy4kb3ZlcmxheSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQuZGV0YWNoKCkuYXBwZW5kVG8oJCh0aGlzLm9wdGlvbnMuYXBwZW5kVG8pKTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ3dpdGhvdXQtb3ZlcmxheScpO1xuICAgIH1cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rICYmIHdpbmRvdy5sb2NhdGlvbi5oYXNoID09PSAoIGAjJHt0aGlzLmlkfWApKSB7XG4gICAgICAkKHdpbmRvdykub25lKCdsb2FkLnpmLnJldmVhbCcsIHRoaXMub3Blbi5iaW5kKHRoaXMpKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhbiBvdmVybGF5IGRpdiB0byBkaXNwbGF5IGJlaGluZCB0aGUgbW9kYWwuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfbWFrZU92ZXJsYXkoKSB7XG4gICAgcmV0dXJuICQoJzxkaXY+PC9kaXY+JylcbiAgICAgIC5hZGRDbGFzcygncmV2ZWFsLW92ZXJsYXknKVxuICAgICAgLmFwcGVuZFRvKHRoaXMub3B0aW9ucy5hcHBlbmRUbyk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlcyBwb3NpdGlvbiBvZiBtb2RhbFxuICAgKiBUT0RPOiAgRmlndXJlIG91dCBpZiB3ZSBhY3R1YWxseSBuZWVkIHRvIGNhY2hlIHRoZXNlIHZhbHVlcyBvciBpZiBpdCBkb2Vzbid0IG1hdHRlclxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3VwZGF0ZVBvc2l0aW9uKCkge1xuICAgIHZhciB3aWR0aCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJXaWR0aCgpO1xuICAgIHZhciBvdXRlcldpZHRoID0gJCh3aW5kb3cpLndpZHRoKCk7XG4gICAgdmFyIGhlaWdodCA9IHRoaXMuJGVsZW1lbnQub3V0ZXJIZWlnaHQoKTtcbiAgICB2YXIgb3V0ZXJIZWlnaHQgPSAkKHdpbmRvdykuaGVpZ2h0KCk7XG4gICAgdmFyIGxlZnQsIHRvcDtcbiAgICBpZiAodGhpcy5vcHRpb25zLmhPZmZzZXQgPT09ICdhdXRvJykge1xuICAgICAgbGVmdCA9IHBhcnNlSW50KChvdXRlcldpZHRoIC0gd2lkdGgpIC8gMiwgMTApO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZWZ0ID0gcGFyc2VJbnQodGhpcy5vcHRpb25zLmhPZmZzZXQsIDEwKTtcbiAgICB9XG4gICAgaWYgKHRoaXMub3B0aW9ucy52T2Zmc2V0ID09PSAnYXV0bycpIHtcbiAgICAgIGlmIChoZWlnaHQgPiBvdXRlckhlaWdodCkge1xuICAgICAgICB0b3AgPSBwYXJzZUludChNYXRoLm1pbigxMDAsIG91dGVySGVpZ2h0IC8gMTApLCAxMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b3AgPSBwYXJzZUludCgob3V0ZXJIZWlnaHQgLSBoZWlnaHQpIC8gNCwgMTApO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0b3AgPSBwYXJzZUludCh0aGlzLm9wdGlvbnMudk9mZnNldCwgMTApO1xuICAgIH1cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7dG9wOiB0b3AgKyAncHgnfSk7XG4gICAgLy8gb25seSB3b3JyeSBhYm91dCBsZWZ0IGlmIHdlIGRvbid0IGhhdmUgYW4gb3ZlcmxheSBvciB3ZSBoYXZlYSAgaG9yaXpvbnRhbCBvZmZzZXQsXG4gICAgLy8gb3RoZXJ3aXNlIHdlJ3JlIHBlcmZlY3RseSBpbiB0aGUgbWlkZGxlXG4gICAgaWYoIXRoaXMuJG92ZXJsYXkgfHwgKHRoaXMub3B0aW9ucy5oT2Zmc2V0ICE9PSAnYXV0bycpKSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7bGVmdDogbGVmdCArICdweCd9KTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKHttYXJnaW46ICcwcHgnfSk7XG4gICAgfVxuXG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgdGhlIG1vZGFsLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudC5vbih7XG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXG4gICAgICAnY2xvc2UuemYudHJpZ2dlcic6IChldmVudCwgJGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKChldmVudC50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdKSB8fFxuICAgICAgICAgICAgKCQoZXZlbnQudGFyZ2V0KS5wYXJlbnRzKCdbZGF0YS1jbG9zYWJsZV0nKVswXSA9PT0gJGVsZW1lbnQpKSB7IC8vIG9ubHkgY2xvc2UgcmV2ZWFsIHdoZW4gaXQncyBleHBsaWNpdGx5IGNhbGxlZFxuICAgICAgICAgIHJldHVybiB0aGlzLmNsb3NlLmFwcGx5KHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuJGFuY2hvci5vbigna2V5ZG93bi56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChlLndoaWNoID09PSAxMyB8fCBlLndoaWNoID09PSAzMikge1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIF90aGlzLm9wZW4oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2sgJiYgdGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgIHRoaXMuJG92ZXJsYXkub2ZmKCcuemYucmV2ZWFsJykub24oJ2NsaWNrLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKGUudGFyZ2V0ID09PSBfdGhpcy4kZWxlbWVudFswXSB8fFxuICAgICAgICAgICQuY29udGFpbnMoX3RoaXMuJGVsZW1lbnRbMF0sIGUudGFyZ2V0KSB8fFxuICAgICAgICAgICAgISQuY29udGFpbnMoZG9jdW1lbnQsIGUudGFyZ2V0KSkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAkKHdpbmRvdykub24oYHBvcHN0YXRlLnpmLnJldmVhbDoke3RoaXMuaWR9YCwgdGhpcy5faGFuZGxlU3RhdGUuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgbW9kYWwgbWV0aG9kcyBvbiBiYWNrL2ZvcndhcmQgYnV0dG9uIGNsaWNrcyBvciBhbnkgb3RoZXIgZXZlbnQgdGhhdCB0cmlnZ2VycyBwb3BzdGF0ZS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9oYW5kbGVTdGF0ZShlKSB7XG4gICAgaWYod2luZG93LmxvY2F0aW9uLmhhc2ggPT09ICggJyMnICsgdGhpcy5pZCkgJiYgIXRoaXMuaXNBY3RpdmUpeyB0aGlzLm9wZW4oKTsgfVxuICAgIGVsc2V7IHRoaXMuY2xvc2UoKTsgfVxuICB9XG5cblxuICAvKipcbiAgICogT3BlbnMgdGhlIG1vZGFsIGNvbnRyb2xsZWQgYnkgYHRoaXMuJGFuY2hvcmAsIGFuZCBjbG9zZXMgYWxsIG90aGVycyBieSBkZWZhdWx0LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQGZpcmVzIFJldmVhbCNjbG9zZW1lXG4gICAqIEBmaXJlcyBSZXZlYWwjb3BlblxuICAgKi9cbiAgb3BlbigpIHtcbiAgICBpZiAodGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICB2YXIgaGFzaCA9IGAjJHt0aGlzLmlkfWA7XG5cbiAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIGhhc2gpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xuXG4gICAgLy8gTWFrZSBlbGVtZW50cyBpbnZpc2libGUsIGJ1dCByZW1vdmUgZGlzcGxheTogbm9uZSBzbyB3ZSBjYW4gZ2V0IHNpemUgYW5kIHBvc2l0aW9uaW5nXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgICAuY3NzKHsgJ3Zpc2liaWxpdHknOiAnaGlkZGVuJyB9KVxuICAgICAgICAuc2hvdygpXG4gICAgICAgIC5zY3JvbGxUb3AoMCk7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJ30pLnNob3coKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmhpZGUoKVxuICAgICAgLmNzcyh7ICd2aXNpYmlsaXR5JzogJycgfSk7XG5cbiAgICBpZih0aGlzLiRvdmVybGF5KSB7XG4gICAgICB0aGlzLiRvdmVybGF5LmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pLmhpZGUoKTtcbiAgICAgIGlmKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ2Zhc3QnKSkge1xuICAgICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdmYXN0Jyk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3MoJ3Nsb3cnKSkge1xuICAgICAgICB0aGlzLiRvdmVybGF5LmFkZENsYXNzKCdzbG93Jyk7XG4gICAgICB9XG4gICAgfVxuXG5cbiAgICBpZiAoIXRoaXMub3B0aW9ucy5tdWx0aXBsZU9wZW5lZCkge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIG1vZGFsIG9wZW5zLlxuICAgICAgICogQ2xvc2VzIGFueSBvdGhlciBtb2RhbHMgdGhhdCBhcmUgY3VycmVudGx5IG9wZW5cbiAgICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VtZVxuICAgICAgICovXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Nsb3NlbWUuemYucmV2ZWFsJywgdGhpcy5pZCk7XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGFkZFJldmVhbE9wZW5DbGFzc2VzKCkge1xuICAgICAgaWYgKF90aGlzLmlzTW9iaWxlKSB7XG4gICAgICAgIGlmKCFfdGhpcy5vcmlnaW5hbFNjcm9sbFBvcykge1xuICAgICAgICAgIF90aGlzLm9yaWdpbmFsU2Nyb2xsUG9zID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xuICAgICAgICB9XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIE1vdGlvbiBVSSBtZXRob2Qgb2YgcmV2ZWFsXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbmltYXRpb25Jbikge1xuICAgICAgZnVuY3Rpb24gYWZ0ZXJBbmltYXRpb24oKXtcbiAgICAgICAgX3RoaXMuJGVsZW1lbnRcbiAgICAgICAgICAuYXR0cih7XG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgICAgICd0YWJpbmRleCc6IC0xXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuZm9jdXMoKTtcbiAgICAgICAgYWRkUmV2ZWFsT3BlbkNsYXNzZXMoKTtcbiAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC50cmFwRm9jdXMoX3RoaXMuJGVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRvdmVybGF5LCAnZmFkZS1pbicpO1xuICAgICAgfVxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZUluKHRoaXMuJGVsZW1lbnQsIHRoaXMub3B0aW9ucy5hbmltYXRpb25JbiwgKCkgPT4ge1xuICAgICAgICBpZih0aGlzLiRlbGVtZW50KSB7IC8vIHByb3RlY3QgYWdhaW5zdCBvYmplY3QgaGF2aW5nIGJlZW4gcmVtb3ZlZFxuICAgICAgICAgIHRoaXMuZm9jdXNhYmxlRWxlbWVudHMgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgYWZ0ZXJBbmltYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIGpRdWVyeSBtZXRob2Qgb2YgcmV2ZWFsXG4gICAgZWxzZSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgdGhpcy4kb3ZlcmxheS5zaG93KDApO1xuICAgICAgfVxuICAgICAgdGhpcy4kZWxlbWVudC5zaG93KHRoaXMub3B0aW9ucy5zaG93RGVsYXkpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBhY2Nlc3NpYmlsaXR5XG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLmF0dHIoe1xuICAgICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZSxcbiAgICAgICAgJ3RhYmluZGV4JzogLTFcbiAgICAgIH0pXG4gICAgICAuZm9jdXMoKTtcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnRyYXBGb2N1cyh0aGlzLiRlbGVtZW50KTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG1vZGFsIGhhcyBzdWNjZXNzZnVsbHkgb3BlbmVkLlxuICAgICAqIEBldmVudCBSZXZlYWwjb3BlblxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb3Blbi56Zi5yZXZlYWwnKTtcblxuICAgIGFkZFJldmVhbE9wZW5DbGFzc2VzKCk7XG5cbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRoaXMuX2V4dHJhSGFuZGxlcnMoKTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV4dHJhIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgYm9keSBhbmQgd2luZG93IGlmIG5lY2Vzc2FyeS5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9leHRyYUhhbmRsZXJzKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgaWYoIXRoaXMuJGVsZW1lbnQpIHsgcmV0dXJuOyB9IC8vIElmIHdlJ3JlIGluIHRoZSBtaWRkbGUgb2YgY2xlYW51cCwgZG9uJ3QgZnJlYWsgb3V0XG4gICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiAhdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4pIHtcbiAgICAgICQoJ2JvZHknKS5vbignY2xpY2suemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoZS50YXJnZXQgPT09IF90aGlzLiRlbGVtZW50WzBdIHx8XG4gICAgICAgICAgJC5jb250YWlucyhfdGhpcy4kZWxlbWVudFswXSwgZS50YXJnZXQpIHx8XG4gICAgICAgICAgICAhJC5jb250YWlucyhkb2N1bWVudCwgZS50YXJnZXQpKSB7IHJldHVybjsgfVxuICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAkKHdpbmRvdykub24oJ2tleWRvd24uemYucmV2ZWFsJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnUmV2ZWFsJywge1xuICAgICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmNsb3NlT25Fc2MpIHtcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBsb2NrIGZvY3VzIHdpdGhpbiBtb2RhbCB3aGlsZSB0YWJiaW5nXG4gICAgdGhpcy4kZWxlbWVudC5vbigna2V5ZG93bi56Zi5yZXZlYWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICB2YXIgJHRhcmdldCA9ICQodGhpcyk7XG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnUmV2ZWFsJywge1xuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJykpKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyAvLyBzZXQgZm9jdXMgYmFjayB0byBhbmNob3IgaWYgY2xvc2UgYnV0dG9uIGhhcyBiZWVuIGFjdGl2YXRlZFxuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmZvY3VzKCk7XG4gICAgICAgICAgICB9LCAxKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKCR0YXJnZXQuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMpKSB7IC8vIGRvbnQndCB0cmlnZ2VyIGlmIGFjdWFsIGVsZW1lbnQgaGFzIGZvY3VzIChpLmUuIGlucHV0cywgbGlua3MsIC4uLilcbiAgICAgICAgICAgIF90aGlzLm9wZW4oKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24ocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlcyB0aGUgbW9kYWwuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAZmlyZXMgUmV2ZWFsI2Nsb3NlZFxuICAgKi9cbiAgY2xvc2UoKSB7XG4gICAgaWYgKCF0aGlzLmlzQWN0aXZlIHx8ICF0aGlzLiRlbGVtZW50LmlzKCc6dmlzaWJsZScpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBNb3Rpb24gVUkgbWV0aG9kIG9mIGhpZGluZ1xuICAgIGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uT3V0KSB7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLm92ZXJsYXkpIHtcbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRvdmVybGF5LCAnZmFkZS1vdXQnLCBmaW5pc2hVcCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZmluaXNoVXAoKTtcbiAgICAgIH1cblxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uT3V0KTtcbiAgICB9XG4gICAgLy8galF1ZXJ5IG1ldGhvZCBvZiBoaWRpbmdcbiAgICBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICB0aGlzLiRvdmVybGF5LmhpZGUoMCwgZmluaXNoVXApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGZpbmlzaFVwKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZSh0aGlzLm9wdGlvbnMuaGlkZURlbGF5KTtcbiAgICB9XG5cbiAgICAvLyBDb25kaXRpb25hbHMgdG8gcmVtb3ZlIGV4dHJhIGV2ZW50IGxpc3RlbmVycyBhZGRlZCBvbiBvcGVuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XG4gICAgICAkKHdpbmRvdykub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljaykge1xuICAgICAgJCgnYm9keScpLm9mZignY2xpY2suemYucmV2ZWFsJyk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ2tleWRvd24uemYucmV2ZWFsJyk7XG5cbiAgICBmdW5jdGlvbiBmaW5pc2hVcCgpIHtcbiAgICAgIGlmIChfdGhpcy5pc01vYmlsZSkge1xuICAgICAgICAkKCdodG1sLCBib2R5JykucmVtb3ZlQ2xhc3MoJ2lzLXJldmVhbC1vcGVuJyk7XG4gICAgICAgIGlmKF90aGlzLm9yaWdpbmFsU2Nyb2xsUG9zKSB7XG4gICAgICAgICAgJCgnYm9keScpLnNjcm9sbFRvcChfdGhpcy5vcmlnaW5hbFNjcm9sbFBvcyk7XG4gICAgICAgICAgX3RoaXMub3JpZ2luYWxTY3JvbGxQb3MgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdpcy1yZXZlYWwtb3BlbicpO1xuICAgICAgfVxuXG5cbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVsZWFzZUZvY3VzKF90aGlzLiRlbGVtZW50KTtcblxuICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKTtcblxuICAgICAgLyoqXG4gICAgICAqIEZpcmVzIHdoZW4gdGhlIG1vZGFsIGlzIGRvbmUgY2xvc2luZy5cbiAgICAgICogQGV2ZW50IFJldmVhbCNjbG9zZWRcbiAgICAgICovXG4gICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZWQuemYucmV2ZWFsJyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgKiBSZXNldHMgdGhlIG1vZGFsIGNvbnRlbnRcbiAgICAqIFRoaXMgcHJldmVudHMgYSBydW5uaW5nIHZpZGVvIHRvIGtlZXAgZ29pbmcgaW4gdGhlIGJhY2tncm91bmRcbiAgICAqL1xuICAgIGlmICh0aGlzLm9wdGlvbnMucmVzZXRPbkNsb3NlKSB7XG4gICAgICB0aGlzLiRlbGVtZW50Lmh0bWwodGhpcy4kZWxlbWVudC5odG1sKCkpO1xuICAgIH1cblxuICAgIHRoaXMuaXNBY3RpdmUgPSBmYWxzZTtcbiAgICAgaWYgKF90aGlzLm9wdGlvbnMuZGVlcExpbmspIHtcbiAgICAgICBpZiAod2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKSB7XG4gICAgICAgICB3aW5kb3cuaGlzdG9yeS5yZXBsYWNlU3RhdGUoJycsIGRvY3VtZW50LnRpdGxlLCB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKGAjJHt0aGlzLmlkfWAsICcnKSk7XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyc7XG4gICAgICAgfVxuICAgICB9XG4gIH1cblxuICAvKipcbiAgICogVG9nZ2xlcyB0aGUgb3Blbi9jbG9zZWQgc3RhdGUgb2YgYSBtb2RhbC5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICB0b2dnbGUoKSB7XG4gICAgaWYgKHRoaXMuaXNBY3RpdmUpIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVuKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhIG1vZGFsLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICB0aGlzLiRlbGVtZW50LmFwcGVuZFRvKCQodGhpcy5vcHRpb25zLmFwcGVuZFRvKSk7IC8vIG1vdmUgJGVsZW1lbnQgb3V0c2lkZSBvZiAkb3ZlcmxheSB0byBwcmV2ZW50IGVycm9yIHVucmVnaXN0ZXJQbHVnaW4oKVxuICAgICAgdGhpcy4kb3ZlcmxheS5oaWRlKCkub2ZmKCkucmVtb3ZlKCk7XG4gICAgfVxuICAgIHRoaXMuJGVsZW1lbnQuaGlkZSgpLm9mZigpO1xuICAgIHRoaXMuJGFuY2hvci5vZmYoJy56ZicpO1xuICAgICQod2luZG93KS5vZmYoYC56Zi5yZXZlYWw6JHt0aGlzLmlkfWApO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9O1xufVxuXG5SZXZlYWwuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBNb3Rpb24tVUkgY2xhc3MgdG8gdXNlIGZvciBhbmltYXRlZCBlbGVtZW50cy4gSWYgbm9uZSB1c2VkLCBkZWZhdWx0cyB0byBzaW1wbGUgc2hvdy9oaWRlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdzbGlkZS1pbi1sZWZ0J1xuICAgKi9cbiAgYW5pbWF0aW9uSW46ICcnLFxuICAvKipcbiAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnc2xpZGUtb3V0LXJpZ2h0J1xuICAgKi9cbiAgYW5pbWF0aW9uT3V0OiAnJyxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCB0byBkZWxheSB0aGUgb3BlbmluZyBvZiBhIG1vZGFsIGFmdGVyIGEgY2xpY2sgaWYgbm8gYW5pbWF0aW9uIHVzZWQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTBcbiAgICovXG4gIHNob3dEZWxheTogMCxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCB0byBkZWxheSB0aGUgY2xvc2luZyBvZiBhIG1vZGFsIGFmdGVyIGEgY2xpY2sgaWYgbm8gYW5pbWF0aW9uIHVzZWQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTBcbiAgICovXG4gIGhpZGVEZWxheTogMCxcbiAgLyoqXG4gICAqIEFsbG93cyBhIGNsaWNrIG9uIHRoZSBib2R5L292ZXJsYXkgdG8gY2xvc2UgdGhlIG1vZGFsLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25DbGljazogdHJ1ZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gY2xvc2UgaWYgdGhlIHVzZXIgcHJlc3NlcyB0aGUgYEVTQ0FQRWAga2V5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIGNsb3NlT25Fc2M6IHRydWUsXG4gIC8qKlxuICAgKiBJZiB0cnVlLCBhbGxvd3MgbXVsdGlwbGUgbW9kYWxzIHRvIGJlIGRpc3BsYXllZCBhdCBvbmNlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBtdWx0aXBsZU9wZW5lZDogZmFsc2UsXG4gIC8qKlxuICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggZG93biBmcm9tIHRoZSB0b3Agb2YgdGhlIHNjcmVlbi5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBhdXRvXG4gICAqL1xuICB2T2Zmc2V0OiAnYXV0bycsXG4gIC8qKlxuICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggaW4gZnJvbSB0aGUgc2lkZSBvZiB0aGUgc2NyZWVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGF1dG9cbiAgICovXG4gIGhPZmZzZXQ6ICdhdXRvJyxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYmUgZnVsbHNjcmVlbiwgY29tcGxldGVseSBibG9ja2luZyBvdXQgdGhlIHJlc3Qgb2YgdGhlIHZpZXcuIEpTIGNoZWNrcyBmb3IgdGhpcyBhcyB3ZWxsLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBmdWxsU2NyZWVuOiBmYWxzZSxcbiAgLyoqXG4gICAqIFBlcmNlbnRhZ2Ugb2Ygc2NyZWVuIGhlaWdodCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggdXAgZnJvbSB0aGUgYm90dG9tIG9mIHRoZSB2aWV3LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwXG4gICAqL1xuICBidG1PZmZzZXRQY3Q6IDEwLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSBtb2RhbCB0byBnZW5lcmF0ZSBhbiBvdmVybGF5IGRpdiwgd2hpY2ggd2lsbCBjb3ZlciB0aGUgdmlldyB3aGVuIG1vZGFsIG9wZW5zLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIG92ZXJsYXk6IHRydWUsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIHJlbW92ZSBhbmQgcmVpbmplY3QgbWFya3VwIG9uIGNsb3NlLiBTaG91bGQgYmUgdHJ1ZSBpZiB1c2luZyB2aWRlbyBlbGVtZW50cyB3L28gdXNpbmcgcHJvdmlkZXIncyBhcGksIG90aGVyd2lzZSwgdmlkZW9zIHdpbGwgY29udGludWUgdG8gcGxheSBpbiB0aGUgYmFja2dyb3VuZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgcmVzZXRPbkNsb3NlOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYWx0ZXIgdGhlIHVybCBvbiBvcGVuL2Nsb3NlLCBhbmQgYWxsb3dzIHRoZSB1c2Ugb2YgdGhlIGBiYWNrYCBidXR0b24gdG8gY2xvc2UgbW9kYWxzLiBBTFNPLCBhbGxvd3MgYSBtb2RhbCB0byBhdXRvLW1hbmlhY2FsbHkgb3BlbiBvbiBwYWdlIGxvYWQgSUYgdGhlIGhhc2ggPT09IHRoZSBtb2RhbCdzIHVzZXItc2V0IGlkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkZWVwTGluazogZmFsc2UsXG4gICAgLyoqXG4gICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gYXBwZW5kIHRvIGN1c3RvbSBkaXYuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGFwcGVuZFRvOiBcImJvZHlcIlxuXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XG5cbmZ1bmN0aW9uIGlQaG9uZVNuaWZmKCkge1xuICByZXR1cm4gL2lQKGFkfGhvbmV8b2QpLipPUy8udGVzdCh3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudCk7XG59XG5cbmZ1bmN0aW9uIGFuZHJvaWRTbmlmZigpIHtcbiAgcmV0dXJuIC9BbmRyb2lkLy50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KTtcbn1cblxuZnVuY3Rpb24gbW9iaWxlU25pZmYoKSB7XG4gIHJldHVybiBpUGhvbmVTbmlmZigpIHx8IGFuZHJvaWRTbmlmZigpO1xufVxuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogU2xpZGVyIG1vZHVsZS5cbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5zbGlkZXJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRvdWNoXG4gKi9cblxuY2xhc3MgU2xpZGVyIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBzbGlkZXIgY29udHJvbC5cbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBzbGlkZXIgY29udHJvbC5cbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZWxlbWVudCwgb3B0aW9ucykge1xuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBTbGlkZXIuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1NsaWRlcicpO1xuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1NsaWRlcicsIHtcbiAgICAgICdsdHInOiB7XG4gICAgICAgICdBUlJPV19SSUdIVCc6ICdpbmNyZWFzZScsXG4gICAgICAgICdBUlJPV19VUCc6ICdpbmNyZWFzZScsXG4gICAgICAgICdBUlJPV19ET1dOJzogJ2RlY3JlYXNlJyxcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnZGVjcmVhc2UnLFxuICAgICAgICAnU0hJRlRfQVJST1dfUklHSFQnOiAnaW5jcmVhc2VfZmFzdCcsXG4gICAgICAgICdTSElGVF9BUlJPV19VUCc6ICdpbmNyZWFzZV9mYXN0JyxcbiAgICAgICAgJ1NISUZUX0FSUk9XX0RPV04nOiAnZGVjcmVhc2VfZmFzdCcsXG4gICAgICAgICdTSElGVF9BUlJPV19MRUZUJzogJ2RlY3JlYXNlX2Zhc3QnXG4gICAgICB9LFxuICAgICAgJ3J0bCc6IHtcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnaW5jcmVhc2UnLFxuICAgICAgICAnQVJST1dfUklHSFQnOiAnZGVjcmVhc2UnLFxuICAgICAgICAnU0hJRlRfQVJST1dfTEVGVCc6ICdpbmNyZWFzZV9mYXN0JyxcbiAgICAgICAgJ1NISUZUX0FSUk9XX1JJR0hUJzogJ2RlY3JlYXNlX2Zhc3QnXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlsaXplcyB0aGUgcGx1Z2luIGJ5IHJlYWRpbmcvc2V0dGluZyBhdHRyaWJ1dGVzLCBjcmVhdGluZyBjb2xsZWN0aW9ucyBhbmQgc2V0dGluZyB0aGUgaW5pdGlhbCBwb3NpdGlvbiBvZiB0aGUgaGFuZGxlKHMpLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHRoaXMuaW5wdXRzID0gdGhpcy4kZWxlbWVudC5maW5kKCdpbnB1dCcpO1xuICAgIHRoaXMuaGFuZGxlcyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtc2xpZGVyLWhhbmRsZV0nKTtcblxuICAgIHRoaXMuJGhhbmRsZSA9IHRoaXMuaGFuZGxlcy5lcSgwKTtcbiAgICB0aGlzLiRpbnB1dCA9IHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzLmVxKDApIDogJChgIyR7dGhpcy4kaGFuZGxlLmF0dHIoJ2FyaWEtY29udHJvbHMnKX1gKTtcbiAgICB0aGlzLiRmaWxsID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zbGlkZXItZmlsbF0nKS5jc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsID8gJ2hlaWdodCcgOiAnd2lkdGgnLCAwKTtcblxuICAgIHZhciBpc0RibCA9IGZhbHNlLFxuICAgICAgICBfdGhpcyA9IHRoaXM7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5kaXNhYmxlZCB8fCB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5kaXNhYmxlZENsYXNzKSkge1xuICAgICAgdGhpcy5vcHRpb25zLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmRpc2FibGVkQ2xhc3MpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaW5wdXRzLmxlbmd0aCkge1xuICAgICAgdGhpcy5pbnB1dHMgPSAkKCkuYWRkKHRoaXMuJGlucHV0KTtcbiAgICAgIHRoaXMub3B0aW9ucy5iaW5kaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9zZXRJbml0QXR0cigwKTtcblxuICAgIGlmICh0aGlzLmhhbmRsZXNbMV0pIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kb3VibGVTaWRlZCA9IHRydWU7XG4gICAgICB0aGlzLiRoYW5kbGUyID0gdGhpcy5oYW5kbGVzLmVxKDEpO1xuICAgICAgdGhpcy4kaW5wdXQyID0gdGhpcy5pbnB1dHMubGVuZ3RoID4gMSA/IHRoaXMuaW5wdXRzLmVxKDEpIDogJChgIyR7dGhpcy4kaGFuZGxlMi5hdHRyKCdhcmlhLWNvbnRyb2xzJyl9YCk7XG5cbiAgICAgIGlmICghdGhpcy5pbnB1dHNbMV0pIHtcbiAgICAgICAgdGhpcy5pbnB1dHMgPSB0aGlzLmlucHV0cy5hZGQodGhpcy4kaW5wdXQyKTtcbiAgICAgIH1cbiAgICAgIGlzRGJsID0gdHJ1ZTtcblxuICAgICAgLy8gdGhpcy4kaGFuZGxlLnRyaWdnZXJIYW5kbGVyKCdjbGljay56Zi5zbGlkZXInKTtcbiAgICAgIHRoaXMuX3NldEluaXRBdHRyKDEpO1xuICAgIH1cblxuICAgIC8vIFNldCBoYW5kbGUgcG9zaXRpb25zXG4gICAgdGhpcy5zZXRIYW5kbGVzKCk7XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIHNldEhhbmRsZXMoKSB7XG4gICAgaWYodGhpcy5oYW5kbGVzWzFdKSB7XG4gICAgICB0aGlzLl9zZXRIYW5kbGVQb3ModGhpcy4kaGFuZGxlLCB0aGlzLmlucHV0cy5lcSgwKS52YWwoKSwgdHJ1ZSwgKCkgPT4ge1xuICAgICAgICB0aGlzLl9zZXRIYW5kbGVQb3ModGhpcy4kaGFuZGxlMiwgdGhpcy5pbnB1dHMuZXEoMSkudmFsKCksIHRydWUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3NldEhhbmRsZVBvcyh0aGlzLiRoYW5kbGUsIHRoaXMuaW5wdXRzLmVxKDApLnZhbCgpLCB0cnVlKTtcbiAgICB9XG4gIH1cblxuICBfcmVmbG93KCkge1xuICAgIHRoaXMuc2V0SGFuZGxlcygpO1xuICB9XG4gIC8qKlxuICAqIEBmdW5jdGlvblxuICAqIEBwcml2YXRlXG4gICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIC0gZmxvYXRpbmcgcG9pbnQgKHRoZSB2YWx1ZSkgdG8gYmUgdHJhbnNmb3JtZWQgdXNpbmcgdG8gYSByZWxhdGl2ZSBwb3NpdGlvbiBvbiB0aGUgc2xpZGVyICh0aGUgaW52ZXJzZSBvZiBfdmFsdWUpXG4gICovXG4gIF9wY3RPZkJhcih2YWx1ZSkge1xuICAgIHZhciBwY3RPZkJhciA9IHBlcmNlbnQodmFsdWUgLSB0aGlzLm9wdGlvbnMuc3RhcnQsIHRoaXMub3B0aW9ucy5lbmQgLSB0aGlzLm9wdGlvbnMuc3RhcnQpXG5cbiAgICBzd2l0Y2godGhpcy5vcHRpb25zLnBvc2l0aW9uVmFsdWVGdW5jdGlvbikge1xuICAgIGNhc2UgXCJwb3dcIjpcbiAgICAgIHBjdE9mQmFyID0gdGhpcy5fbG9nVHJhbnNmb3JtKHBjdE9mQmFyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJsb2dcIjpcbiAgICAgIHBjdE9mQmFyID0gdGhpcy5fcG93VHJhbnNmb3JtKHBjdE9mQmFyKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiBwY3RPZkJhci50b0ZpeGVkKDIpXG4gIH1cblxuICAvKipcbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqIEBwYXJhbSB7TnVtYmVyfSBwY3RPZkJhciAtIGZsb2F0aW5nIHBvaW50LCB0aGUgcmVsYXRpdmUgcG9zaXRpb24gb2YgdGhlIHNsaWRlciAodHlwaWNhbGx5IGJldHdlZW4gMC0xKSB0byBiZSB0cmFuc2Zvcm1lZCB0byBhIHZhbHVlXG4gICovXG4gIF92YWx1ZShwY3RPZkJhcikge1xuICAgIHN3aXRjaCh0aGlzLm9wdGlvbnMucG9zaXRpb25WYWx1ZUZ1bmN0aW9uKSB7XG4gICAgY2FzZSBcInBvd1wiOlxuICAgICAgcGN0T2ZCYXIgPSB0aGlzLl9wb3dUcmFuc2Zvcm0ocGN0T2ZCYXIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImxvZ1wiOlxuICAgICAgcGN0T2ZCYXIgPSB0aGlzLl9sb2dUcmFuc2Zvcm0ocGN0T2ZCYXIpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciB2YWx1ZSA9ICh0aGlzLm9wdGlvbnMuZW5kIC0gdGhpcy5vcHRpb25zLnN0YXJ0KSAqIHBjdE9mQmFyICsgdGhpcy5vcHRpb25zLnN0YXJ0O1xuXG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICAvKipcbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSAtIGZsb2F0aW5nIHBvaW50ICh0eXBpY2FsbHkgYmV0d2VlbiAwLTEpIHRvIGJlIHRyYW5zZm9ybWVkIHVzaW5nIHRoZSBsb2cgZnVuY3Rpb25cbiAgKi9cbiAgX2xvZ1RyYW5zZm9ybSh2YWx1ZSkge1xuICAgIHJldHVybiBiYXNlTG9nKHRoaXMub3B0aW9ucy5ub25MaW5lYXJCYXNlLCAoKHZhbHVlKih0aGlzLm9wdGlvbnMubm9uTGluZWFyQmFzZS0xKSkrMSkpXG4gIH1cblxuICAvKipcbiAgKiBAZnVuY3Rpb25cbiAgKiBAcHJpdmF0ZVxuICAqIEBwYXJhbSB7TnVtYmVyfSB2YWx1ZSAtIGZsb2F0aW5nIHBvaW50ICh0eXBpY2FsbHkgYmV0d2VlbiAwLTEpIHRvIGJlIHRyYW5zZm9ybWVkIHVzaW5nIHRoZSBwb3dlciBmdW5jdGlvblxuICAqL1xuICBfcG93VHJhbnNmb3JtKHZhbHVlKSB7XG4gICAgcmV0dXJuIChNYXRoLnBvdyh0aGlzLm9wdGlvbnMubm9uTGluZWFyQmFzZSwgdmFsdWUpIC0gMSkgLyAodGhpcy5vcHRpb25zLm5vbkxpbmVhckJhc2UgLSAxKVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBzZWxlY3RlZCBoYW5kbGUgYW5kIGZpbGwgYmFyLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRobmRsIC0gdGhlIHNlbGVjdGVkIGhhbmRsZSB0byBtb3ZlLlxuICAgKiBAcGFyYW0ge051bWJlcn0gbG9jYXRpb24gLSBmbG9hdGluZyBwb2ludCBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHZhbHVlcyBvZiB0aGUgc2xpZGVyIGJhci5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIG9uIGNvbXBsZXRpb24uXG4gICAqIEBmaXJlcyBTbGlkZXIjbW92ZWRcbiAgICogQGZpcmVzIFNsaWRlciNjaGFuZ2VkXG4gICAqL1xuICBfc2V0SGFuZGxlUG9zKCRobmRsLCBsb2NhdGlvbiwgbm9JbnZlcnQsIGNiKSB7XG4gICAgLy8gZG9uJ3QgbW92ZSBpZiB0aGUgc2xpZGVyIGhhcyBiZWVuIGRpc2FibGVkIHNpbmNlIGl0cyBpbml0aWFsaXphdGlvblxuICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMub3B0aW9ucy5kaXNhYmxlZENsYXNzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvL21pZ2h0IG5lZWQgdG8gYWx0ZXIgdGhhdCBzbGlnaHRseSBmb3IgYmFycyB0aGF0IHdpbGwgaGF2ZSBvZGQgbnVtYmVyIHNlbGVjdGlvbnMuXG4gICAgbG9jYXRpb24gPSBwYXJzZUZsb2F0KGxvY2F0aW9uKTsvL29uIGlucHV0IGNoYW5nZSBldmVudHMsIGNvbnZlcnQgc3RyaW5nIHRvIG51bWJlci4uLmdydW1ibGUuXG5cbiAgICAvLyBwcmV2ZW50IHNsaWRlciBmcm9tIHJ1bm5pbmcgb3V0IG9mIGJvdW5kcywgaWYgdmFsdWUgZXhjZWVkcyB0aGUgbGltaXRzIHNldCB0aHJvdWdoIG9wdGlvbnMsIG92ZXJyaWRlIHRoZSB2YWx1ZSB0byBtaW4vbWF4XG4gICAgaWYgKGxvY2F0aW9uIDwgdGhpcy5vcHRpb25zLnN0YXJ0KSB7IGxvY2F0aW9uID0gdGhpcy5vcHRpb25zLnN0YXJ0OyB9XG4gICAgZWxzZSBpZiAobG9jYXRpb24gPiB0aGlzLm9wdGlvbnMuZW5kKSB7IGxvY2F0aW9uID0gdGhpcy5vcHRpb25zLmVuZDsgfVxuXG4gICAgdmFyIGlzRGJsID0gdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkO1xuXG4gICAgaWYgKGlzRGJsKSB7IC8vdGhpcyBibG9jayBpcyB0byBwcmV2ZW50IDIgaGFuZGxlcyBmcm9tIGNyb3NzaW5nIGVhY2hvdGhlci4gQ291bGQvc2hvdWxkIGJlIGltcHJvdmVkLlxuICAgICAgaWYgKHRoaXMuaGFuZGxlcy5pbmRleCgkaG5kbCkgPT09IDApIHtcbiAgICAgICAgdmFyIGgyVmFsID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGUyLmF0dHIoJ2FyaWEtdmFsdWVub3cnKSk7XG4gICAgICAgIGxvY2F0aW9uID0gbG9jYXRpb24gPj0gaDJWYWwgPyBoMlZhbCAtIHRoaXMub3B0aW9ucy5zdGVwIDogbG9jYXRpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaDFWYWwgPSBwYXJzZUZsb2F0KHRoaXMuJGhhbmRsZS5hdHRyKCdhcmlhLXZhbHVlbm93JykpO1xuICAgICAgICBsb2NhdGlvbiA9IGxvY2F0aW9uIDw9IGgxVmFsID8gaDFWYWwgKyB0aGlzLm9wdGlvbnMuc3RlcCA6IGxvY2F0aW9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vdGhpcyBpcyBmb3Igc2luZ2xlLWhhbmRsZWQgdmVydGljYWwgc2xpZGVycywgaXQgYWRqdXN0cyB0aGUgdmFsdWUgdG8gYWNjb3VudCBmb3IgdGhlIHNsaWRlciBiZWluZyBcInVwc2lkZS1kb3duXCJcbiAgICAvL2ZvciBjbGljayBhbmQgZHJhZyBldmVudHMsIGl0J3Mgd2VpcmQgZHVlIHRvIHRoZSBzY2FsZSgtMSwgMSkgY3NzIHByb3BlcnR5XG4gICAgaWYgKHRoaXMub3B0aW9ucy52ZXJ0aWNhbCAmJiAhbm9JbnZlcnQpIHtcbiAgICAgIGxvY2F0aW9uID0gdGhpcy5vcHRpb25zLmVuZCAtIGxvY2F0aW9uO1xuICAgIH1cblxuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIHZlcnQgPSB0aGlzLm9wdGlvbnMudmVydGljYWwsXG4gICAgICAgIGhPclcgPSB2ZXJ0ID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxuICAgICAgICBsT3JUID0gdmVydCA/ICd0b3AnIDogJ2xlZnQnLFxuICAgICAgICBoYW5kbGVEaW0gPSAkaG5kbFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtoT3JXXSxcbiAgICAgICAgZWxlbURpbSA9IHRoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbaE9yV10sXG4gICAgICAgIC8vcGVyY2VudGFnZSBvZiBiYXIgbWluL21heCB2YWx1ZSBiYXNlZCBvbiBjbGljayBvciBkcmFnIHBvaW50XG4gICAgICAgIHBjdE9mQmFyID0gdGhpcy5fcGN0T2ZCYXIobG9jYXRpb24pLFxuICAgICAgICAvL251bWJlciBvZiBhY3R1YWwgcGl4ZWxzIHRvIHNoaWZ0IHRoZSBoYW5kbGUsIGJhc2VkIG9uIHRoZSBwZXJjZW50YWdlIG9idGFpbmVkIGFib3ZlXG4gICAgICAgIHB4VG9Nb3ZlID0gKGVsZW1EaW0gLSBoYW5kbGVEaW0pICogcGN0T2ZCYXIsXG4gICAgICAgIC8vcGVyY2VudGFnZSBvZiBiYXIgdG8gc2hpZnQgdGhlIGhhbmRsZVxuICAgICAgICBtb3ZlbWVudCA9IChwZXJjZW50KHB4VG9Nb3ZlLCBlbGVtRGltKSAqIDEwMCkudG9GaXhlZCh0aGlzLm9wdGlvbnMuZGVjaW1hbCk7XG4gICAgICAgIC8vZml4aW5nIHRoZSBkZWNpbWFsIHZhbHVlIGZvciB0aGUgbG9jYXRpb24gbnVtYmVyLCBpcyBwYXNzZWQgdG8gb3RoZXIgbWV0aG9kcyBhcyBhIGZpeGVkIGZsb2F0aW5nLXBvaW50IHZhbHVlXG4gICAgICAgIGxvY2F0aW9uID0gcGFyc2VGbG9hdChsb2NhdGlvbi50b0ZpeGVkKHRoaXMub3B0aW9ucy5kZWNpbWFsKSk7XG4gICAgICAgIC8vIGRlY2xhcmUgZW1wdHkgb2JqZWN0IGZvciBjc3MgYWRqdXN0bWVudHMsIG9ubHkgdXNlZCB3aXRoIDIgaGFuZGxlZC1zbGlkZXJzXG4gICAgdmFyIGNzcyA9IHt9O1xuXG4gICAgdGhpcy5fc2V0VmFsdWVzKCRobmRsLCBsb2NhdGlvbik7XG5cbiAgICAvLyBUT0RPIHVwZGF0ZSB0byBjYWxjdWxhdGUgYmFzZWQgb24gdmFsdWVzIHNldCB0byByZXNwZWN0aXZlIGlucHV0cz8/XG4gICAgaWYgKGlzRGJsKSB7XG4gICAgICB2YXIgaXNMZWZ0SG5kbCA9IHRoaXMuaGFuZGxlcy5pbmRleCgkaG5kbCkgPT09IDAsXG4gICAgICAgICAgLy9lbXB0eSB2YXJpYWJsZSwgd2lsbCBiZSB1c2VkIGZvciBtaW4taGVpZ2h0L3dpZHRoIGZvciBmaWxsIGJhclxuICAgICAgICAgIGRpbSxcbiAgICAgICAgICAvL3BlcmNlbnRhZ2Ugdy9oIG9mIHRoZSBoYW5kbGUgY29tcGFyZWQgdG8gdGhlIHNsaWRlciBiYXJcbiAgICAgICAgICBoYW5kbGVQY3QgPSAgfn4ocGVyY2VudChoYW5kbGVEaW0sIGVsZW1EaW0pICogMTAwKTtcbiAgICAgIC8vaWYgbGVmdCBoYW5kbGUsIHRoZSBtYXRoIGlzIHNsaWdodGx5IGRpZmZlcmVudCB0aGFuIGlmIGl0J3MgdGhlIHJpZ2h0IGhhbmRsZSwgYW5kIHRoZSBsZWZ0L3RvcCBwcm9wZXJ0eSBuZWVkcyB0byBiZSBjaGFuZ2VkIGZvciB0aGUgZmlsbCBiYXJcbiAgICAgIGlmIChpc0xlZnRIbmRsKSB7XG4gICAgICAgIC8vbGVmdCBvciB0b3AgcGVyY2VudGFnZSB2YWx1ZSB0byBhcHBseSB0byB0aGUgZmlsbCBiYXIuXG4gICAgICAgIGNzc1tsT3JUXSA9IGAke21vdmVtZW50fSVgO1xuICAgICAgICAvL2NhbGN1bGF0ZSB0aGUgbmV3IG1pbi1oZWlnaHQvd2lkdGggZm9yIHRoZSBmaWxsIGJhci5cbiAgICAgICAgZGltID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGUyWzBdLnN0eWxlW2xPclRdKSAtIG1vdmVtZW50ICsgaGFuZGxlUGN0O1xuICAgICAgICAvL3RoaXMgY2FsbGJhY2sgaXMgbmVjZXNzYXJ5IHRvIHByZXZlbnQgZXJyb3JzIGFuZCBhbGxvdyB0aGUgcHJvcGVyIHBsYWNlbWVudCBhbmQgaW5pdGlhbGl6YXRpb24gb2YgYSAyLWhhbmRsZWQgc2xpZGVyXG4gICAgICAgIC8vcGx1cywgaXQgbWVhbnMgd2UgZG9uJ3QgY2FyZSBpZiAnZGltJyBpc05hTiBvbiBpbml0LCBpdCB3b24ndCBiZSBpbiB0aGUgZnV0dXJlLlxuICAgICAgICBpZiAoY2IgJiYgdHlwZW9mIGNiID09PSAnZnVuY3Rpb24nKSB7IGNiKCk7IH0vL3RoaXMgaXMgb25seSBuZWVkZWQgZm9yIHRoZSBpbml0aWFsaXphdGlvbiBvZiAyIGhhbmRsZWQgc2xpZGVyc1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9qdXN0IGNhY2hpbmcgdGhlIHZhbHVlIG9mIHRoZSBsZWZ0L2JvdHRvbSBoYW5kbGUncyBsZWZ0L3RvcCBwcm9wZXJ0eVxuICAgICAgICB2YXIgaGFuZGxlUG9zID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGVbMF0uc3R5bGVbbE9yVF0pO1xuICAgICAgICAvL2NhbGN1bGF0ZSB0aGUgbmV3IG1pbi1oZWlnaHQvd2lkdGggZm9yIHRoZSBmaWxsIGJhci4gVXNlIGlzTmFOIHRvIHByZXZlbnQgZmFsc2UgcG9zaXRpdmVzIGZvciBudW1iZXJzIDw9IDBcbiAgICAgICAgLy9iYXNlZCBvbiB0aGUgcGVyY2VudGFnZSBvZiBtb3ZlbWVudCBvZiB0aGUgaGFuZGxlIGJlaW5nIG1hbmlwdWxhdGVkLCBsZXNzIHRoZSBvcHBvc2luZyBoYW5kbGUncyBsZWZ0L3RvcCBwb3NpdGlvbiwgcGx1cyB0aGUgcGVyY2VudGFnZSB3L2ggb2YgdGhlIGhhbmRsZSBpdHNlbGZcbiAgICAgICAgZGltID0gbW92ZW1lbnQgLSAoaXNOYU4oaGFuZGxlUG9zKSA/ICh0aGlzLm9wdGlvbnMuaW5pdGlhbFN0YXJ0IC0gdGhpcy5vcHRpb25zLnN0YXJ0KS8oKHRoaXMub3B0aW9ucy5lbmQtdGhpcy5vcHRpb25zLnN0YXJ0KS8xMDApIDogaGFuZGxlUG9zKSArIGhhbmRsZVBjdDtcbiAgICAgIH1cbiAgICAgIC8vIGFzc2lnbiB0aGUgbWluLWhlaWdodC93aWR0aCB0byBvdXIgY3NzIG9iamVjdFxuICAgICAgY3NzW2BtaW4tJHtoT3JXfWBdID0gYCR7ZGltfSVgO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub25lKCdmaW5pc2hlZC56Zi5hbmltYXRlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBoYW5kbGUgaXMgZG9uZSBtb3ZpbmcuXG4gICAgICAgICAgICAgICAgICAgICAqIEBldmVudCBTbGlkZXIjbW92ZWRcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ21vdmVkLnpmLnNsaWRlcicsIFskaG5kbF0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgLy9iZWNhdXNlIHdlIGRvbid0IGtub3cgZXhhY3RseSBob3cgdGhlIGhhbmRsZSB3aWxsIGJlIG1vdmVkLCBjaGVjayB0aGUgYW1vdW50IG9mIHRpbWUgaXQgc2hvdWxkIHRha2UgdG8gbW92ZS5cbiAgICB2YXIgbW92ZVRpbWUgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJykgPyAxMDAwLzYwIDogdGhpcy5vcHRpb25zLm1vdmVUaW1lO1xuXG4gICAgRm91bmRhdGlvbi5Nb3ZlKG1vdmVUaW1lLCAkaG5kbCwgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBhZGp1c3RpbmcgdGhlIGxlZnQvdG9wIHByb3BlcnR5IG9mIHRoZSBoYW5kbGUsIGJhc2VkIG9uIHRoZSBwZXJjZW50YWdlIGNhbGN1bGF0ZWQgYWJvdmVcbiAgICAgIC8vIGlmIG1vdmVtZW50IGlzTmFOLCB0aGF0IGlzIGJlY2F1c2UgdGhlIHNsaWRlciBpcyBoaWRkZW4gYW5kIHdlIGNhbm5vdCBkZXRlcm1pbmUgaGFuZGxlIHdpZHRoLFxuICAgICAgLy8gZmFsbCBiYWNrIHRvIG5leHQgYmVzdCBndWVzcy5cbiAgICAgIGlmIChpc05hTihtb3ZlbWVudCkpIHtcbiAgICAgICAgJGhuZGwuY3NzKGxPclQsIGAke3BjdE9mQmFyICogMTAwfSVgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAkaG5kbC5jc3MobE9yVCwgYCR7bW92ZW1lbnR9JWApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIV90aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQpIHtcbiAgICAgICAgLy9pZiBzaW5nbGUtaGFuZGxlZCwgYSBzaW1wbGUgbWV0aG9kIHRvIGV4cGFuZCB0aGUgZmlsbCBiYXJcbiAgICAgICAgX3RoaXMuJGZpbGwuY3NzKGhPclcsIGAke3BjdE9mQmFyICogMTAwfSVgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vb3RoZXJ3aXNlLCB1c2UgdGhlIGNzcyBvYmplY3Qgd2UgY3JlYXRlZCBhYm92ZVxuICAgICAgICBfdGhpcy4kZmlsbC5jc3MoY3NzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgdmFsdWUgaGFzIG5vdCBiZWVuIGNoYW5nZSBmb3IgYSBnaXZlbiB0aW1lLlxuICAgICAqIEBldmVudCBTbGlkZXIjY2hhbmdlZFxuICAgICAqL1xuICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcbiAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlZC56Zi5zbGlkZXInLCBbJGhuZGxdKTtcbiAgICB9LCBfdGhpcy5vcHRpb25zLmNoYW5nZWREZWxheSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgaW5pdGlhbCBhdHRyaWJ1dGUgZm9yIHRoZSBzbGlkZXIgZWxlbWVudC5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgY3VycmVudCBoYW5kbGUvaW5wdXQgdG8gdXNlLlxuICAgKi9cbiAgX3NldEluaXRBdHRyKGlkeCkge1xuICAgIHZhciBpbml0VmFsID0gKGlkeCA9PT0gMCA/IHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQgOiB0aGlzLm9wdGlvbnMuaW5pdGlhbEVuZClcbiAgICB2YXIgaWQgPSB0aGlzLmlucHV0cy5lcShpZHgpLmF0dHIoJ2lkJykgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnc2xpZGVyJyk7XG4gICAgdGhpcy5pbnB1dHMuZXEoaWR4KS5hdHRyKHtcbiAgICAgICdpZCc6IGlkLFxuICAgICAgJ21heCc6IHRoaXMub3B0aW9ucy5lbmQsXG4gICAgICAnbWluJzogdGhpcy5vcHRpb25zLnN0YXJ0LFxuICAgICAgJ3N0ZXAnOiB0aGlzLm9wdGlvbnMuc3RlcFxuICAgIH0pO1xuICAgIHRoaXMuaW5wdXRzLmVxKGlkeCkudmFsKGluaXRWYWwpO1xuICAgIHRoaXMuaGFuZGxlcy5lcShpZHgpLmF0dHIoe1xuICAgICAgJ3JvbGUnOiAnc2xpZGVyJyxcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogaWQsXG4gICAgICAnYXJpYS12YWx1ZW1heCc6IHRoaXMub3B0aW9ucy5lbmQsXG4gICAgICAnYXJpYS12YWx1ZW1pbic6IHRoaXMub3B0aW9ucy5zdGFydCxcbiAgICAgICdhcmlhLXZhbHVlbm93JzogaW5pdFZhbCxcbiAgICAgICdhcmlhLW9yaWVudGF0aW9uJzogdGhpcy5vcHRpb25zLnZlcnRpY2FsID8gJ3ZlcnRpY2FsJyA6ICdob3Jpem9udGFsJyxcbiAgICAgICd0YWJpbmRleCc6IDBcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBpbnB1dCBhbmQgYGFyaWEtdmFsdWVub3dgIHZhbHVlcyBmb3IgdGhlIHNsaWRlciBlbGVtZW50LlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRoYW5kbGUgLSB0aGUgY3VycmVudGx5IHNlbGVjdGVkIGhhbmRsZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbCAtIGZsb2F0aW5nIHBvaW50IG9mIHRoZSBuZXcgdmFsdWUuXG4gICAqL1xuICBfc2V0VmFsdWVzKCRoYW5kbGUsIHZhbCkge1xuICAgIHZhciBpZHggPSB0aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQgPyB0aGlzLmhhbmRsZXMuaW5kZXgoJGhhbmRsZSkgOiAwO1xuICAgIHRoaXMuaW5wdXRzLmVxKGlkeCkudmFsKHZhbCk7XG4gICAgJGhhbmRsZS5hdHRyKCdhcmlhLXZhbHVlbm93JywgdmFsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGV2ZW50cyBvbiB0aGUgc2xpZGVyIGVsZW1lbnQuXG4gICAqIENhbGN1bGF0ZXMgdGhlIG5ldyBsb2NhdGlvbiBvZiB0aGUgY3VycmVudCBoYW5kbGUuXG4gICAqIElmIHRoZXJlIGFyZSB0d28gaGFuZGxlcyBhbmQgdGhlIGJhciB3YXMgY2xpY2tlZCwgaXQgZGV0ZXJtaW5lcyB3aGljaCBoYW5kbGUgdG8gbW92ZS5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlIC0gdGhlIGBldmVudGAgb2JqZWN0IHBhc3NlZCBmcm9tIHRoZSBsaXN0ZW5lci5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICRoYW5kbGUgLSB0aGUgY3VycmVudCBoYW5kbGUgdG8gY2FsY3VsYXRlIGZvciwgaWYgc2VsZWN0ZWQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBmbG9hdGluZyBwb2ludCBudW1iZXIgZm9yIHRoZSBuZXcgdmFsdWUgb2YgdGhlIHNsaWRlci5cbiAgICogVE9ETyBjbGVhbiB0aGlzIHVwLCB0aGVyZSdzIGEgbG90IG9mIHJlcGVhdGVkIGNvZGUgYmV0d2VlbiB0aGlzIGFuZCB0aGUgX3NldEhhbmRsZVBvcyBmbi5cbiAgICovXG4gIF9oYW5kbGVFdmVudChlLCAkaGFuZGxlLCB2YWwpIHtcbiAgICB2YXIgdmFsdWUsIGhhc1ZhbDtcbiAgICBpZiAoIXZhbCkgey8vY2xpY2sgb3IgZHJhZyBldmVudHNcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgICAgdmVydGljYWwgPSB0aGlzLm9wdGlvbnMudmVydGljYWwsXG4gICAgICAgICAgcGFyYW0gPSB2ZXJ0aWNhbCA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcbiAgICAgICAgICBkaXJlY3Rpb24gPSB2ZXJ0aWNhbCA/ICd0b3AnIDogJ2xlZnQnLFxuICAgICAgICAgIGV2ZW50T2Zmc2V0ID0gdmVydGljYWwgPyBlLnBhZ2VZIDogZS5wYWdlWCxcbiAgICAgICAgICBoYWxmT2ZIYW5kbGUgPSB0aGlzLiRoYW5kbGVbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbcGFyYW1dIC8gMixcbiAgICAgICAgICBiYXJEaW0gPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW3BhcmFtXSxcbiAgICAgICAgICB3aW5kb3dTY3JvbGwgPSB2ZXJ0aWNhbCA/ICQod2luZG93KS5zY3JvbGxUb3AoKSA6ICQod2luZG93KS5zY3JvbGxMZWZ0KCk7XG5cblxuICAgICAgdmFyIGVsZW1PZmZzZXQgPSB0aGlzLiRlbGVtZW50Lm9mZnNldCgpW2RpcmVjdGlvbl07XG5cbiAgICAgIC8vIHRvdWNoIGV2ZW50cyBlbXVsYXRlZCBieSB0aGUgdG91Y2ggdXRpbCBnaXZlIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHNjcmVlbiwgYWRkIHdpbmRvdy5zY3JvbGwgdG8gZXZlbnQgY29vcmRpbmF0ZXMuLi5cbiAgICAgIC8vIGJlc3Qgd2F5IHRvIGd1ZXNzIHRoaXMgaXMgc2ltdWxhdGVkIGlzIGlmIGNsaWVudFkgPT0gcGFnZVlcbiAgICAgIGlmIChlLmNsaWVudFkgPT09IGUucGFnZVkpIHsgZXZlbnRPZmZzZXQgPSBldmVudE9mZnNldCArIHdpbmRvd1Njcm9sbDsgfVxuICAgICAgdmFyIGV2ZW50RnJvbUJhciA9IGV2ZW50T2Zmc2V0IC0gZWxlbU9mZnNldDtcbiAgICAgIHZhciBiYXJYWTtcbiAgICAgIGlmIChldmVudEZyb21CYXIgPCAwKSB7XG4gICAgICAgIGJhclhZID0gMDtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnRGcm9tQmFyID4gYmFyRGltKSB7XG4gICAgICAgIGJhclhZID0gYmFyRGltO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFyWFkgPSBldmVudEZyb21CYXI7XG4gICAgICB9XG4gICAgICB2YXIgb2Zmc2V0UGN0ID0gcGVyY2VudChiYXJYWSwgYmFyRGltKTtcblxuICAgICAgdmFsdWUgPSB0aGlzLl92YWx1ZShvZmZzZXRQY3QpO1xuXG4gICAgICAvLyB0dXJuIGV2ZXJ5dGhpbmcgYXJvdW5kIGZvciBSVEwsIHlheSBtYXRoIVxuICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkgJiYgIXRoaXMub3B0aW9ucy52ZXJ0aWNhbCkge3ZhbHVlID0gdGhpcy5vcHRpb25zLmVuZCAtIHZhbHVlO31cblxuICAgICAgdmFsdWUgPSBfdGhpcy5fYWRqdXN0VmFsdWUobnVsbCwgdmFsdWUpO1xuICAgICAgLy9ib29sZWFuIGZsYWcgZm9yIHRoZSBzZXRIYW5kbGVQb3MgZm4sIHNwZWNpZmljYWxseSBmb3IgdmVydGljYWwgc2xpZGVyc1xuICAgICAgaGFzVmFsID0gZmFsc2U7XG5cbiAgICAgIGlmICghJGhhbmRsZSkgey8vZmlndXJlIG91dCB3aGljaCBoYW5kbGUgaXQgaXMsIHBhc3MgaXQgdG8gdGhlIG5leHQgZnVuY3Rpb24uXG4gICAgICAgIHZhciBmaXJzdEhuZGxQb3MgPSBhYnNQb3NpdGlvbih0aGlzLiRoYW5kbGUsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKSxcbiAgICAgICAgICAgIHNlY25kSG5kbFBvcyA9IGFic1Bvc2l0aW9uKHRoaXMuJGhhbmRsZTIsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKTtcbiAgICAgICAgICAgICRoYW5kbGUgPSBmaXJzdEhuZGxQb3MgPD0gc2VjbmRIbmRsUG9zID8gdGhpcy4kaGFuZGxlIDogdGhpcy4kaGFuZGxlMjtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7Ly9jaGFuZ2UgZXZlbnQgb24gaW5wdXRcbiAgICAgIHZhbHVlID0gdGhpcy5fYWRqdXN0VmFsdWUobnVsbCwgdmFsKTtcbiAgICAgIGhhc1ZhbCA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0SGFuZGxlUG9zKCRoYW5kbGUsIHZhbHVlLCBoYXNWYWwpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkanVzdGVzIHZhbHVlIGZvciBoYW5kbGUgaW4gcmVnYXJkIHRvIHN0ZXAgdmFsdWUuIHJldHVybnMgYWRqdXN0ZWQgdmFsdWVcbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIHNlbGVjdGVkIGhhbmRsZS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIC0gdmFsdWUgdG8gYWRqdXN0LiB1c2VkIGlmICRoYW5kbGUgaXMgZmFsc3lcbiAgICovXG4gIF9hZGp1c3RWYWx1ZSgkaGFuZGxlLCB2YWx1ZSkge1xuICAgIHZhciB2YWwsXG4gICAgICBzdGVwID0gdGhpcy5vcHRpb25zLnN0ZXAsXG4gICAgICBkaXYgPSBwYXJzZUZsb2F0KHN0ZXAvMiksXG4gICAgICBsZWZ0LCBwcmV2X3ZhbCwgbmV4dF92YWw7XG4gICAgaWYgKCEhJGhhbmRsZSkge1xuICAgICAgdmFsID0gcGFyc2VGbG9hdCgkaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsID0gdmFsdWU7XG4gICAgfVxuICAgIGxlZnQgPSB2YWwgJSBzdGVwO1xuICAgIHByZXZfdmFsID0gdmFsIC0gbGVmdDtcbiAgICBuZXh0X3ZhbCA9IHByZXZfdmFsICsgc3RlcDtcbiAgICBpZiAobGVmdCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgdmFsID0gdmFsID49IHByZXZfdmFsICsgZGl2ID8gbmV4dF92YWwgOiBwcmV2X3ZhbDtcbiAgICByZXR1cm4gdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzbGlkZXIgZWxlbWVudHMuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLl9ldmVudHNGb3JIYW5kbGUodGhpcy4kaGFuZGxlKTtcbiAgICBpZih0aGlzLmhhbmRsZXNbMV0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c0ZvckhhbmRsZSh0aGlzLiRoYW5kbGUyKTtcbiAgICB9XG4gIH1cblxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGxpc3RlbmVycyBhIHBhcnRpY3VsYXIgaGFuZGxlXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhhbmRsZSAtIHRoZSBjdXJyZW50IGhhbmRsZSB0byBhcHBseSBsaXN0ZW5lcnMgdG8uXG4gICAqL1xuICBfZXZlbnRzRm9ySGFuZGxlKCRoYW5kbGUpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBjdXJIYW5kbGUsXG4gICAgICAgIHRpbWVyO1xuXG4gICAgICB0aGlzLmlucHV0cy5vZmYoJ2NoYW5nZS56Zi5zbGlkZXInKS5vbignY2hhbmdlLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGlkeCA9IF90aGlzLmlucHV0cy5pbmRleCgkKHRoaXMpKTtcbiAgICAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGUsIF90aGlzLmhhbmRsZXMuZXEoaWR4KSwgJCh0aGlzKS52YWwoKSk7XG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbGlja1NlbGVjdCkge1xuICAgICAgICB0aGlzLiRlbGVtZW50Lm9mZignY2xpY2suemYuc2xpZGVyJykub24oJ2NsaWNrLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZGF0YSgnZHJhZ2dpbmcnKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgICAgICAgIGlmICghJChlLnRhcmdldCkuaXMoJ1tkYXRhLXNsaWRlci1oYW5kbGVdJykpIHtcbiAgICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkKSB7XG4gICAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBfdGhpcy4kaGFuZGxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5kcmFnZ2FibGUpIHtcbiAgICAgIHRoaXMuaGFuZGxlcy5hZGRUb3VjaCgpO1xuXG4gICAgICB2YXIgJGJvZHkgPSAkKCdib2R5Jyk7XG4gICAgICAkaGFuZGxlXG4gICAgICAgIC5vZmYoJ21vdXNlZG93bi56Zi5zbGlkZXInKVxuICAgICAgICAub24oJ21vdXNlZG93bi56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgJGhhbmRsZS5hZGRDbGFzcygnaXMtZHJhZ2dpbmcnKTtcbiAgICAgICAgICBfdGhpcy4kZmlsbC5hZGRDbGFzcygnaXMtZHJhZ2dpbmcnKTsvL1xuICAgICAgICAgIF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJywgdHJ1ZSk7XG5cbiAgICAgICAgICBjdXJIYW5kbGUgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cbiAgICAgICAgICAkYm9keS5vbignbW91c2Vtb3ZlLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBjdXJIYW5kbGUpO1xuXG4gICAgICAgICAgfSkub24oJ21vdXNldXAuemYuc2xpZGVyJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGUsIGN1ckhhbmRsZSk7XG5cbiAgICAgICAgICAgICRoYW5kbGUucmVtb3ZlQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XG4gICAgICAgICAgICBfdGhpcy4kZmlsbC5yZW1vdmVDbGFzcygnaXMtZHJhZ2dpbmcnKTtcbiAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJywgZmFsc2UpO1xuXG4gICAgICAgICAgICAkYm9keS5vZmYoJ21vdXNlbW92ZS56Zi5zbGlkZXIgbW91c2V1cC56Zi5zbGlkZXInKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAvLyBwcmV2ZW50IGV2ZW50cyB0cmlnZ2VyZWQgYnkgdG91Y2hcbiAgICAgIC5vbignc2VsZWN0c3RhcnQuemYuc2xpZGVyIHRvdWNobW92ZS56Zi5zbGlkZXInLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgICRoYW5kbGUub2ZmKCdrZXlkb3duLnpmLnNsaWRlcicpLm9uKCdrZXlkb3duLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgIHZhciBfJGhhbmRsZSA9ICQodGhpcyksXG4gICAgICAgICAgaWR4ID0gX3RoaXMub3B0aW9ucy5kb3VibGVTaWRlZCA/IF90aGlzLmhhbmRsZXMuaW5kZXgoXyRoYW5kbGUpIDogMCxcbiAgICAgICAgICBvbGRWYWx1ZSA9IHBhcnNlRmxvYXQoX3RoaXMuaW5wdXRzLmVxKGlkeCkudmFsKCkpLFxuICAgICAgICAgIG5ld1ZhbHVlO1xuXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnU2xpZGVyJywge1xuICAgICAgICBkZWNyZWFzZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSAtIF90aGlzLm9wdGlvbnMuc3RlcDtcbiAgICAgICAgfSxcbiAgICAgICAgaW5jcmVhc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgKyBfdGhpcy5vcHRpb25zLnN0ZXA7XG4gICAgICAgIH0sXG4gICAgICAgIGRlY3JlYXNlX2Zhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgLSBfdGhpcy5vcHRpb25zLnN0ZXAgKiAxMDtcbiAgICAgICAgfSxcbiAgICAgICAgaW5jcmVhc2VfZmFzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSArIF90aGlzLm9wdGlvbnMuc3RlcCAqIDEwO1xuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHsgLy8gb25seSBzZXQgaGFuZGxlIHBvcyB3aGVuIGV2ZW50IHdhcyBoYW5kbGVkIHNwZWNpYWxseVxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBfdGhpcy5fc2V0SGFuZGxlUG9zKF8kaGFuZGxlLCBuZXdWYWx1ZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLyppZiAobmV3VmFsdWUpIHsgLy8gaWYgcHJlc3NlZCBrZXkgaGFzIHNwZWNpYWwgZnVuY3Rpb24sIHVwZGF0ZSB2YWx1ZVxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoXyRoYW5kbGUsIG5ld1ZhbHVlKTtcbiAgICAgIH0qL1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIHRoZSBzbGlkZXIgcGx1Z2luLlxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLmhhbmRsZXMub2ZmKCcuemYuc2xpZGVyJyk7XG4gICAgdGhpcy5pbnB1dHMub2ZmKCcuemYuc2xpZGVyJyk7XG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi5zbGlkZXInKTtcblxuICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xuICB9XG59XG5cblNsaWRlci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIE1pbmltdW0gdmFsdWUgZm9yIHRoZSBzbGlkZXIgc2NhbGUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMFxuICAgKi9cbiAgc3RhcnQ6IDAsXG4gIC8qKlxuICAgKiBNYXhpbXVtIHZhbHVlIGZvciB0aGUgc2xpZGVyIHNjYWxlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEwMFxuICAgKi9cbiAgZW5kOiAxMDAsXG4gIC8qKlxuICAgKiBNaW5pbXVtIHZhbHVlIGNoYW5nZSBwZXIgY2hhbmdlIGV2ZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIHN0ZXA6IDEsXG4gIC8qKlxuICAgKiBWYWx1ZSBhdCB3aGljaCB0aGUgaGFuZGxlL2lucHV0ICoobGVmdCBoYW5kbGUvZmlyc3QgaW5wdXQpKiBzaG91bGQgYmUgc2V0IHRvIG9uIGluaXRpYWxpemF0aW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDBcbiAgICovXG4gIGluaXRpYWxTdGFydDogMCxcbiAgLyoqXG4gICAqIFZhbHVlIGF0IHdoaWNoIHRoZSByaWdodCBoYW5kbGUvc2Vjb25kIGlucHV0IHNob3VsZCBiZSBzZXQgdG8gb24gaW5pdGlhbGl6YXRpb24uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTAwXG4gICAqL1xuICBpbml0aWFsRW5kOiAxMDAsXG4gIC8qKlxuICAgKiBBbGxvd3MgdGhlIGlucHV0IHRvIGJlIGxvY2F0ZWQgb3V0c2lkZSB0aGUgY29udGFpbmVyIGFuZCB2aXNpYmxlLiBTZXQgdG8gYnkgdGhlIEpTXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGJpbmRpbmc6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSB1c2VyIHRvIGNsaWNrL3RhcCBvbiB0aGUgc2xpZGVyIGJhciB0byBzZWxlY3QgYSB2YWx1ZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSB0cnVlXG4gICAqL1xuICBjbGlja1NlbGVjdDogdHJ1ZSxcbiAgLyoqXG4gICAqIFNldCB0byB0cnVlIGFuZCB1c2UgdGhlIGB2ZXJ0aWNhbGAgY2xhc3MgdG8gY2hhbmdlIGFsaWdubWVudCB0byB2ZXJ0aWNhbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgdmVydGljYWw6IGZhbHNlLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSB1c2VyIHRvIGRyYWcgdGhlIHNsaWRlciBoYW5kbGUocykgdG8gc2VsZWN0IGEgdmFsdWUuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgZHJhZ2dhYmxlOiB0cnVlLFxuICAvKipcbiAgICogRGlzYWJsZXMgdGhlIHNsaWRlciBhbmQgcHJldmVudHMgZXZlbnQgbGlzdGVuZXJzIGZyb20gYmVpbmcgYXBwbGllZC4gRG91YmxlIGNoZWNrZWQgYnkgSlMgd2l0aCBgZGlzYWJsZWRDbGFzc2AuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGRpc2FibGVkOiBmYWxzZSxcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgdXNlIG9mIHR3byBoYW5kbGVzLiBEb3VibGUgY2hlY2tlZCBieSB0aGUgSlMuIENoYW5nZXMgc29tZSBsb2dpYyBoYW5kbGluZy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgZG91YmxlU2lkZWQ6IGZhbHNlLFxuICAvKipcbiAgICogUG90ZW50aWFsIGZ1dHVyZSBmZWF0dXJlLlxuICAgKi9cbiAgLy8gc3RlcHM6IDEwMCxcbiAgLyoqXG4gICAqIE51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyB0aGUgcGx1Z2luIHNob3VsZCBnbyB0byBmb3IgZmxvYXRpbmcgcG9pbnQgcHJlY2lzaW9uLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDJcbiAgICovXG4gIGRlY2ltYWw6IDIsXG4gIC8qKlxuICAgKiBUaW1lIGRlbGF5IGZvciBkcmFnZ2VkIGVsZW1lbnRzLlxuICAgKi9cbiAgLy8gZHJhZ0RlbGF5OiAwLFxuICAvKipcbiAgICogVGltZSwgaW4gbXMsIHRvIGFuaW1hdGUgdGhlIG1vdmVtZW50IG9mIGEgc2xpZGVyIGhhbmRsZSBpZiB1c2VyIGNsaWNrcy90YXBzIG9uIHRoZSBiYXIuIE5lZWRzIHRvIGJlIG1hbnVhbGx5IHNldCBpZiB1cGRhdGluZyB0aGUgdHJhbnNpdGlvbiB0aW1lIGluIHRoZSBTYXNzIHNldHRpbmdzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDIwMFxuICAgKi9cbiAgbW92ZVRpbWU6IDIwMCwvL3VwZGF0ZSB0aGlzIGlmIGNoYW5naW5nIHRoZSB0cmFuc2l0aW9uIHRpbWUgaW4gdGhlIHNhc3NcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gZGlzYWJsZWQgc2xpZGVycy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZGlzYWJsZWQnXG4gICAqL1xuICBkaXNhYmxlZENsYXNzOiAnZGlzYWJsZWQnLFxuICAvKipcbiAgICogV2lsbCBpbnZlcnQgdGhlIGRlZmF1bHQgbGF5b3V0IGZvciBhIHZlcnRpY2FsPHNwYW4gZGF0YS10b29sdGlwIHRpdGxlPVwid2hvIHdvdWxkIGRvIHRoaXM/Pz9cIj4gPC9zcGFuPnNsaWRlci5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgaW52ZXJ0VmVydGljYWw6IGZhbHNlLFxuICAvKipcbiAgICogTWlsbGlzZWNvbmRzIGJlZm9yZSB0aGUgYGNoYW5nZWQuemYtc2xpZGVyYCBldmVudCBpcyB0cmlnZ2VyZWQgYWZ0ZXIgdmFsdWUgY2hhbmdlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDUwMFxuICAgKi9cbiAgY2hhbmdlZERlbGF5OiA1MDAsXG4gIC8qKlxuICAqIEJhc2V2YWx1ZSBmb3Igbm9uLWxpbmVhciBzbGlkZXJzXG4gICogQG9wdGlvblxuICAqIEBleGFtcGxlIDVcbiAgKi9cbiAgbm9uTGluZWFyQmFzZTogNSxcbiAgLyoqXG4gICogQmFzZXZhbHVlIGZvciBub24tbGluZWFyIHNsaWRlcnMsIHBvc3NpYmxlIHZhbHVlcyBhcmU6ICdsaW5lYXInLCAncG93JyAmICdsb2cnLiBQb3cgYW5kIExvZyB1c2UgdGhlIG5vbkxpbmVhckJhc2Ugc2V0dGluZy5cbiAgKiBAb3B0aW9uXG4gICogQGV4YW1wbGUgJ2xpbmVhcidcbiAgKi9cbiAgcG9zaXRpb25WYWx1ZUZ1bmN0aW9uOiAnbGluZWFyJyxcbn07XG5cbmZ1bmN0aW9uIHBlcmNlbnQoZnJhYywgbnVtKSB7XG4gIHJldHVybiAoZnJhYyAvIG51bSk7XG59XG5mdW5jdGlvbiBhYnNQb3NpdGlvbigkaGFuZGxlLCBkaXIsIGNsaWNrUG9zLCBwYXJhbSkge1xuICByZXR1cm4gTWF0aC5hYnMoKCRoYW5kbGUucG9zaXRpb24oKVtkaXJdICsgKCRoYW5kbGVbcGFyYW1dKCkgLyAyKSkgLSBjbGlja1Bvcyk7XG59XG5mdW5jdGlvbiBiYXNlTG9nKGJhc2UsIHZhbHVlKSB7XG4gIHJldHVybiBNYXRoLmxvZyh2YWx1ZSkvTWF0aC5sb2coYmFzZSlcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFNsaWRlciwgJ1NsaWRlcicpO1xuXG59KGpRdWVyeSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuIWZ1bmN0aW9uKCQpIHtcblxuLyoqXG4gKiBTdGlja3kgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnN0aWNreVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XG4gKi9cblxuY2xhc3MgU3RpY2t5IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBzdGlja3kgdGhpbmcuXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBzdGlja3kuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gb3B0aW9ucyBvYmplY3QgcGFzc2VkIHdoZW4gY3JlYXRpbmcgdGhlIGVsZW1lbnQgcHJvZ3JhbW1hdGljYWxseS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgU3RpY2t5LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XG5cbiAgICB0aGlzLl9pbml0KCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdTdGlja3knKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgc3RpY2t5IGVsZW1lbnQgYnkgYWRkaW5nIGNsYXNzZXMsIGdldHRpbmcvc2V0dGluZyBkaW1lbnNpb25zLCBicmVha3BvaW50cyBhbmQgYXR0cmlidXRlc1xuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9pbml0KCkge1xuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN0aWNreS1jb250YWluZXJdJyksXG4gICAgICAgIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdzdGlja3knKSxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKCEkcGFyZW50Lmxlbmd0aCkge1xuICAgICAgdGhpcy53YXNXcmFwcGVkID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy4kY29udGFpbmVyID0gJHBhcmVudC5sZW5ndGggPyAkcGFyZW50IDogJCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKS53cmFwSW5uZXIodGhpcy4kZWxlbWVudCk7XG4gICAgdGhpcy4kY29udGFpbmVyLmFkZENsYXNzKHRoaXMub3B0aW9ucy5jb250YWluZXJDbGFzcyk7XG5cbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5zdGlja3lDbGFzcylcbiAgICAgICAgICAgICAgICAgLmF0dHIoeydkYXRhLXJlc2l6ZSc6IGlkfSk7XG5cbiAgICB0aGlzLnNjcm9sbENvdW50ID0gdGhpcy5vcHRpb25zLmNoZWNrRXZlcnk7XG4gICAgdGhpcy5pc1N0dWNrID0gZmFsc2U7XG4gICAgJCh3aW5kb3cpLm9uZSgnbG9hZC56Zi5zdGlja3knLCBmdW5jdGlvbigpe1xuICAgICAgLy9XZSBjYWxjdWxhdGUgdGhlIGNvbnRhaW5lciBoZWlnaHQgdG8gaGF2ZSBjb3JyZWN0IHZhbHVlcyBmb3IgYW5jaG9yIHBvaW50cyBvZmZzZXQgY2FsY3VsYXRpb24uXG4gICAgICBfdGhpcy5jb250YWluZXJIZWlnaHQgPSBfdGhpcy4kZWxlbWVudC5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiID8gMCA6IF90aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgIF90aGlzLiRjb250YWluZXIuY3NzKCdoZWlnaHQnLCBfdGhpcy5jb250YWluZXJIZWlnaHQpO1xuICAgICAgX3RoaXMuZWxlbUhlaWdodCA9IF90aGlzLmNvbnRhaW5lckhlaWdodDtcbiAgICAgIGlmKF90aGlzLm9wdGlvbnMuYW5jaG9yICE9PSAnJyl7XG4gICAgICAgIF90aGlzLiRhbmNob3IgPSAkKCcjJyArIF90aGlzLm9wdGlvbnMuYW5jaG9yKTtcbiAgICAgIH1lbHNle1xuICAgICAgICBfdGhpcy5fcGFyc2VQb2ludHMoKTtcbiAgICAgIH1cblxuICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBzY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG4gICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCBzY3JvbGwpO1xuICAgICAgICAvL1Vuc3RpY2sgdGhlIGVsZW1lbnQgd2lsbCBlbnN1cmUgdGhhdCBwcm9wZXIgY2xhc3NlcyBhcmUgc2V0LlxuICAgICAgICBpZiAoIV90aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgICBfdGhpcy5fcmVtb3ZlU3RpY2t5KChzY3JvbGwgPj0gX3RoaXMudG9wUG9pbnQpID8gZmFsc2UgOiB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBfdGhpcy5fZXZlbnRzKGlkLnNwbGl0KCctJykucmV2ZXJzZSgpLmpvaW4oJy0nKSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSWYgdXNpbmcgbXVsdGlwbGUgZWxlbWVudHMgYXMgYW5jaG9ycywgY2FsY3VsYXRlcyB0aGUgdG9wIGFuZCBib3R0b20gcGl4ZWwgdmFsdWVzIHRoZSBzdGlja3kgdGhpbmcgc2hvdWxkIHN0aWNrIGFuZCB1bnN0aWNrIG9uLlxuICAgKiBAZnVuY3Rpb25cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9wYXJzZVBvaW50cygpIHtcbiAgICB2YXIgdG9wID0gdGhpcy5vcHRpb25zLnRvcEFuY2hvciA9PSBcIlwiID8gMSA6IHRoaXMub3B0aW9ucy50b3BBbmNob3IsXG4gICAgICAgIGJ0bSA9IHRoaXMub3B0aW9ucy5idG1BbmNob3I9PSBcIlwiID8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbEhlaWdodCA6IHRoaXMub3B0aW9ucy5idG1BbmNob3IsXG4gICAgICAgIHB0cyA9IFt0b3AsIGJ0bV0sXG4gICAgICAgIGJyZWFrcyA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwdHMubGVuZ3RoOyBpIDwgbGVuICYmIHB0c1tpXTsgaSsrKSB7XG4gICAgICB2YXIgcHQ7XG4gICAgICBpZiAodHlwZW9mIHB0c1tpXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcHQgPSBwdHNbaV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcGxhY2UgPSBwdHNbaV0uc3BsaXQoJzonKSxcbiAgICAgICAgICAgIGFuY2hvciA9ICQoYCMke3BsYWNlWzBdfWApO1xuXG4gICAgICAgIHB0ID0gYW5jaG9yLm9mZnNldCgpLnRvcDtcbiAgICAgICAgaWYgKHBsYWNlWzFdICYmIHBsYWNlWzFdLnRvTG93ZXJDYXNlKCkgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgcHQgKz0gYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWtzW2ldID0gcHQ7XG4gICAgfVxuXG5cbiAgICB0aGlzLnBvaW50cyA9IGJyZWFrcztcbiAgICByZXR1cm47XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgdGhlIHNjcm9sbGluZyBlbGVtZW50LlxuICAgKiBAcHJpdmF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBwc3VlZG8tcmFuZG9tIGlkIGZvciB1bmlxdWUgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyLlxuICAgKi9cbiAgX2V2ZW50cyhpZCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXMsXG4gICAgICAgIHNjcm9sbExpc3RlbmVyID0gdGhpcy5zY3JvbGxMaXN0ZW5lciA9IGBzY3JvbGwuemYuJHtpZH1gO1xuICAgIGlmICh0aGlzLmlzT24pIHsgcmV0dXJuOyB9XG4gICAgaWYgKHRoaXMuY2FuU3RpY2spIHtcbiAgICAgIHRoaXMuaXNPbiA9IHRydWU7XG4gICAgICAkKHdpbmRvdykub2ZmKHNjcm9sbExpc3RlbmVyKVxuICAgICAgICAgICAgICAgLm9uKHNjcm9sbExpc3RlbmVyLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgIGlmIChfdGhpcy5zY3JvbGxDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50ID0gX3RoaXMub3B0aW9ucy5jaGVja0V2ZXJ5O1xuICAgICAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgIF90aGlzLl9jYWxjKGZhbHNlLCB3aW5kb3cucGFnZVlPZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50LS07XG4gICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UsIHdpbmRvdy5wYWdlWU9mZnNldCk7XG4gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKVxuICAgICAgICAgICAgICAgICAub24oJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInLCBmdW5jdGlvbihlLCBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIGlmIChfdGhpcy5jYW5TdGljaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghX3RoaXMuaXNPbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2V2ZW50cyhpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKF90aGlzLmlzT24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXJzIGZvciBzY3JvbGwgYW5kIGNoYW5nZSBldmVudHMgb24gYW5jaG9yLlxuICAgKiBAZmlyZXMgU3RpY2t5I3BhdXNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzY3JvbGxMaXN0ZW5lciAtIHVuaXF1ZSwgbmFtZXNwYWNlZCBzY3JvbGwgbGlzdGVuZXIgYXR0YWNoZWQgdG8gYHdpbmRvd2BcbiAgICovXG4gIF9wYXVzZUxpc3RlbmVycyhzY3JvbGxMaXN0ZW5lcikge1xuICAgIHRoaXMuaXNPbiA9IGZhbHNlO1xuICAgICQod2luZG93KS5vZmYoc2Nyb2xsTGlzdGVuZXIpO1xuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGlzIHBhdXNlZCBkdWUgdG8gcmVzaXplIGV2ZW50IHNocmlua2luZyB0aGUgdmlldy5cbiAgICAgKiBAZXZlbnQgU3RpY2t5I3BhdXNlXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdwYXVzZS56Zi5zdGlja3knKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgb24gZXZlcnkgYHNjcm9sbGAgZXZlbnQgYW5kIG9uIGBfaW5pdGBcbiAgICogZmlyZXMgZnVuY3Rpb25zIGJhc2VkIG9uIGJvb2xlYW5zIGFuZCBjYWNoZWQgdmFsdWVzXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2hlY2tTaXplcyAtIHRydWUgaWYgcGx1Z2luIHNob3VsZCByZWNhbGN1bGF0ZSBzaXplcyBhbmQgYnJlYWtwb2ludHMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBzY3JvbGwgLSBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiBwYXNzZWQgZnJvbSBzY3JvbGwgZXZlbnQgY2IgZnVuY3Rpb24uIElmIG5vdCBwYXNzZWQsIGRlZmF1bHRzIHRvIGB3aW5kb3cucGFnZVlPZmZzZXRgLlxuICAgKi9cbiAgX2NhbGMoY2hlY2tTaXplcywgc2Nyb2xsKSB7XG4gICAgaWYgKGNoZWNrU2l6ZXMpIHsgdGhpcy5fc2V0U2l6ZXMoKTsgfVxuXG4gICAgaWYgKCF0aGlzLmNhblN0aWNrKSB7XG4gICAgICBpZiAodGhpcy5pc1N0dWNrKSB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreSh0cnVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoIXNjcm9sbCkgeyBzY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQ7IH1cblxuICAgIGlmIChzY3JvbGwgPj0gdGhpcy50b3BQb2ludCkge1xuICAgICAgaWYgKHNjcm9sbCA8PSB0aGlzLmJvdHRvbVBvaW50KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1N0dWNrKSB7XG4gICAgICAgICAgdGhpcy5fc2V0U3RpY2t5KCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3koZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmlzU3R1Y2spIHtcbiAgICAgICAgdGhpcy5fcmVtb3ZlU3RpY2t5KHRydWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYXVzZXMgdGhlICRlbGVtZW50IHRvIGJlY29tZSBzdHVjay5cbiAgICogQWRkcyBgcG9zaXRpb246IGZpeGVkO2AsIGFuZCBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQGZpcmVzIFN0aWNreSNzdHVja3RvXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFN0aWNreSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBzdGlja1RvID0gdGhpcy5vcHRpb25zLnN0aWNrVG8sXG4gICAgICAgIG1yZ24gPSBzdGlja1RvID09PSAndG9wJyA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXG4gICAgICAgIG5vdFN0dWNrVG8gPSBzdGlja1RvID09PSAndG9wJyA/ICdib3R0b20nIDogJ3RvcCcsXG4gICAgICAgIGNzcyA9IHt9O1xuXG4gICAgY3NzW21yZ25dID0gYCR7dGhpcy5vcHRpb25zW21yZ25dfWVtYDtcbiAgICBjc3Nbc3RpY2tUb10gPSAwO1xuICAgIGNzc1tub3RTdHVja1RvXSA9ICdhdXRvJztcbiAgICB0aGlzLmlzU3R1Y2sgPSB0cnVlO1xuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoYGlzLWFuY2hvcmVkIGlzLWF0LSR7bm90U3R1Y2tUb31gKVxuICAgICAgICAgICAgICAgICAuYWRkQ2xhc3MoYGlzLXN0dWNrIGlzLWF0LSR7c3RpY2tUb31gKVxuICAgICAgICAgICAgICAgICAuY3NzKGNzcylcbiAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYHBvc2l0aW9uOiBmaXhlZDtgXG4gICAgICAgICAgICAgICAgICAqIE5hbWVzcGFjZWQgdG8gYHRvcGAgb3IgYGJvdHRvbWAsIGUuZy4gYHN0aWNreS56Zi5zdHVja3RvOnRvcGBcbiAgICAgICAgICAgICAgICAgICogQGV2ZW50IFN0aWNreSNzdHVja3RvXG4gICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAudHJpZ2dlcihgc3RpY2t5LnpmLnN0dWNrdG86JHtzdGlja1RvfWApO1xuICAgIHRoaXMuJGVsZW1lbnQub24oXCJ0cmFuc2l0aW9uZW5kIHdlYmtpdFRyYW5zaXRpb25FbmQgb1RyYW5zaXRpb25FbmQgb3RyYW5zaXRpb25lbmQgTVNUcmFuc2l0aW9uRW5kXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgX3RoaXMuX3NldFNpemVzKCk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2F1c2VzIHRoZSAkZWxlbWVudCB0byBiZWNvbWUgdW5zdHVjay5cbiAgICogUmVtb3ZlcyBgcG9zaXRpb246IGZpeGVkO2AsIGFuZCBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQWRkcyBvdGhlciBoZWxwZXIgY2xhc3Nlcy5cbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1RvcCAtIHRlbGxzIHRoZSBmdW5jdGlvbiBpZiB0aGUgJGVsZW1lbnQgc2hvdWxkIGFuY2hvciB0byB0aGUgdG9wIG9yIGJvdHRvbSBvZiBpdHMgJGFuY2hvciBlbGVtZW50LlxuICAgKiBAZmlyZXMgU3RpY2t5I3Vuc3R1Y2tmcm9tXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVtb3ZlU3RpY2t5KGlzVG9wKSB7XG4gICAgdmFyIHN0aWNrVG8gPSB0aGlzLm9wdGlvbnMuc3RpY2tUbyxcbiAgICAgICAgc3RpY2tUb1RvcCA9IHN0aWNrVG8gPT09ICd0b3AnLFxuICAgICAgICBjc3MgPSB7fSxcbiAgICAgICAgYW5jaG9yUHQgPSAodGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1sxXSAtIHRoaXMucG9pbnRzWzBdIDogdGhpcy5hbmNob3JIZWlnaHQpIC0gdGhpcy5lbGVtSGVpZ2h0LFxuICAgICAgICBtcmduID0gc3RpY2tUb1RvcCA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXG4gICAgICAgIG5vdFN0dWNrVG8gPSBzdGlja1RvVG9wID8gJ2JvdHRvbScgOiAndG9wJyxcbiAgICAgICAgdG9wT3JCb3R0b20gPSBpc1RvcCA/ICd0b3AnIDogJ2JvdHRvbSc7XG5cbiAgICBjc3NbbXJnbl0gPSAwO1xuXG4gICAgY3NzWydib3R0b20nXSA9ICdhdXRvJztcbiAgICBpZihpc1RvcCkge1xuICAgICAgY3NzWyd0b3AnXSA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNzc1sndG9wJ10gPSBhbmNob3JQdDtcbiAgICB9XG5cbiAgICB0aGlzLmlzU3R1Y2sgPSBmYWxzZTtcbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGBpcy1zdHVjayBpcy1hdC0ke3N0aWNrVG99YClcbiAgICAgICAgICAgICAgICAgLmFkZENsYXNzKGBpcy1hbmNob3JlZCBpcy1hdC0ke3RvcE9yQm90dG9tfWApXG4gICAgICAgICAgICAgICAgIC5jc3MoY3NzKVxuICAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgJGVsZW1lbnQgaGFzIGJlY29tZSBhbmNob3JlZC5cbiAgICAgICAgICAgICAgICAgICogTmFtZXNwYWNlZCB0byBgdG9wYCBvciBgYm90dG9tYCwgZS5nLiBgc3RpY2t5LnpmLnVuc3R1Y2tmcm9tOmJvdHRvbWBcbiAgICAgICAgICAgICAgICAgICogQGV2ZW50IFN0aWNreSN1bnN0dWNrZnJvbVxuICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgLnRyaWdnZXIoYHN0aWNreS56Zi51bnN0dWNrZnJvbToke3RvcE9yQm90dG9tfWApO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlICRlbGVtZW50IGFuZCAkY29udGFpbmVyIHNpemVzIGZvciBwbHVnaW4uXG4gICAqIENhbGxzIGBfc2V0QnJlYWtQb2ludHNgLlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIG9wdGlvbmFsIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGZpcmUgb24gY29tcGxldGlvbiBvZiBgX3NldEJyZWFrUG9pbnRzYC5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRTaXplcyhjYikge1xuICAgIHRoaXMuY2FuU3RpY2sgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuaXModGhpcy5vcHRpb25zLnN0aWNreU9uKTtcbiAgICBpZiAoIXRoaXMuY2FuU3RpY2spIHtcbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICAgIH1cbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxuICAgICAgICBuZXdFbGVtV2lkdGggPSB0aGlzLiRjb250YWluZXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGgsXG4gICAgICAgIGNvbXAgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLiRjb250YWluZXJbMF0pLFxuICAgICAgICBwZG5nbCA9IHBhcnNlSW50KGNvbXBbJ3BhZGRpbmctbGVmdCddLCAxMCksXG4gICAgICAgIHBkbmdyID0gcGFyc2VJbnQoY29tcFsncGFkZGluZy1yaWdodCddLCAxMCk7XG5cbiAgICBpZiAodGhpcy4kYW5jaG9yICYmIHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuYW5jaG9ySGVpZ2h0ID0gdGhpcy4kYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcGFyc2VQb2ludHMoKTtcbiAgICB9XG5cbiAgICB0aGlzLiRlbGVtZW50LmNzcyh7XG4gICAgICAnbWF4LXdpZHRoJzogYCR7bmV3RWxlbVdpZHRoIC0gcGRuZ2wgLSBwZG5ncn1weGBcbiAgICB9KTtcblxuICAgIHZhciBuZXdDb250YWluZXJIZWlnaHQgPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCB8fCB0aGlzLmNvbnRhaW5lckhlaWdodDtcbiAgICBpZiAodGhpcy4kZWxlbWVudC5jc3MoXCJkaXNwbGF5XCIpID09IFwibm9uZVwiKSB7XG4gICAgICBuZXdDb250YWluZXJIZWlnaHQgPSAwO1xuICAgIH1cbiAgICB0aGlzLmNvbnRhaW5lckhlaWdodCA9IG5ld0NvbnRhaW5lckhlaWdodDtcbiAgICB0aGlzLiRjb250YWluZXIuY3NzKHtcbiAgICAgIGhlaWdodDogbmV3Q29udGFpbmVySGVpZ2h0XG4gICAgfSk7XG4gICAgdGhpcy5lbGVtSGVpZ2h0ID0gbmV3Q29udGFpbmVySGVpZ2h0O1xuXG4gICAgaWYgKCF0aGlzLmlzU3R1Y2spIHtcbiAgICAgIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1hdC1ib3R0b20nKSkge1xuICAgICAgICB2YXIgYW5jaG9yUHQgPSAodGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1sxXSAtIHRoaXMuJGNvbnRhaW5lci5vZmZzZXQoKS50b3AgOiB0aGlzLmFuY2hvckhlaWdodCkgLSB0aGlzLmVsZW1IZWlnaHQ7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQuY3NzKCd0b3AnLCBhbmNob3JQdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0QnJlYWtQb2ludHMobmV3Q29udGFpbmVySGVpZ2h0LCBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHsgY2IoKTsgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIHVwcGVyIGFuZCBsb3dlciBicmVha3BvaW50cyBmb3IgdGhlIGVsZW1lbnQgdG8gYmVjb21lIHN0aWNreS91bnN0aWNreS5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IGVsZW1IZWlnaHQgLSBweCB2YWx1ZSBmb3Igc3RpY2t5LiRlbGVtZW50IGhlaWdodCwgY2FsY3VsYXRlZCBieSBgX3NldFNpemVzYC5cbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gY29tcGxldGlvbi5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9zZXRCcmVha1BvaW50cyhlbGVtSGVpZ2h0LCBjYikge1xuICAgIGlmICghdGhpcy5jYW5TdGljaykge1xuICAgICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgeyBjYigpOyB9XG4gICAgICBlbHNlIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgfVxuICAgIHZhciBtVG9wID0gZW1DYWxjKHRoaXMub3B0aW9ucy5tYXJnaW5Ub3ApLFxuICAgICAgICBtQnRtID0gZW1DYWxjKHRoaXMub3B0aW9ucy5tYXJnaW5Cb3R0b20pLFxuICAgICAgICB0b3BQb2ludCA9IHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMF0gOiB0aGlzLiRhbmNob3Iub2Zmc2V0KCkudG9wLFxuICAgICAgICBib3R0b21Qb2ludCA9IHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMV0gOiB0b3BQb2ludCArIHRoaXMuYW5jaG9ySGVpZ2h0LFxuICAgICAgICAvLyB0b3BQb2ludCA9IHRoaXMuJGFuY2hvci5vZmZzZXQoKS50b3AgfHwgdGhpcy5wb2ludHNbMF0sXG4gICAgICAgIC8vIGJvdHRvbVBvaW50ID0gdG9wUG9pbnQgKyB0aGlzLmFuY2hvckhlaWdodCB8fCB0aGlzLnBvaW50c1sxXSxcbiAgICAgICAgd2luSGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdGlja1RvID09PSAndG9wJykge1xuICAgICAgdG9wUG9pbnQgLT0gbVRvcDtcbiAgICAgIGJvdHRvbVBvaW50IC09IChlbGVtSGVpZ2h0ICsgbVRvcCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc3RpY2tUbyA9PT0gJ2JvdHRvbScpIHtcbiAgICAgIHRvcFBvaW50IC09ICh3aW5IZWlnaHQgLSAoZWxlbUhlaWdodCArIG1CdG0pKTtcbiAgICAgIGJvdHRvbVBvaW50IC09ICh3aW5IZWlnaHQgLSBtQnRtKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy90aGlzIHdvdWxkIGJlIHRoZSBzdGlja1RvOiBib3RoIG9wdGlvbi4uLiB0cmlja3lcbiAgICB9XG5cbiAgICB0aGlzLnRvcFBvaW50ID0gdG9wUG9pbnQ7XG4gICAgdGhpcy5ib3R0b21Qb2ludCA9IGJvdHRvbVBvaW50O1xuXG4gICAgaWYgKGNiICYmIHR5cGVvZiBjYiA9PT0gJ2Z1bmN0aW9uJykgeyBjYigpOyB9XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGN1cnJlbnQgc3RpY2t5IGVsZW1lbnQuXG4gICAqIFJlc2V0cyB0aGUgZWxlbWVudCB0byB0aGUgdG9wIHBvc2l0aW9uIGZpcnN0LlxuICAgKiBSZW1vdmVzIGV2ZW50IGxpc3RlbmVycywgSlMtYWRkZWQgY3NzIHByb3BlcnRpZXMgYW5kIGNsYXNzZXMsIGFuZCB1bndyYXBzIHRoZSAkZWxlbWVudCBpZiB0aGUgSlMgYWRkZWQgdGhlICRjb250YWluZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XG5cbiAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKGAke3RoaXMub3B0aW9ucy5zdGlja3lDbGFzc30gaXMtYW5jaG9yZWQgaXMtYXQtdG9wYClcbiAgICAgICAgICAgICAgICAgLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnJyxcbiAgICAgICAgICAgICAgICAgICB0b3A6ICcnLFxuICAgICAgICAgICAgICAgICAgIGJvdHRvbTogJycsXG4gICAgICAgICAgICAgICAgICAgJ21heC13aWR0aCc6ICcnXG4gICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgIC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcbiAgICBpZiAodGhpcy4kYW5jaG9yICYmIHRoaXMuJGFuY2hvci5sZW5ndGgpIHtcbiAgICAgIHRoaXMuJGFuY2hvci5vZmYoJ2NoYW5nZS56Zi5zdGlja3knKTtcbiAgICB9XG4gICAgJCh3aW5kb3cpLm9mZih0aGlzLnNjcm9sbExpc3RlbmVyKTtcblxuICAgIGlmICh0aGlzLndhc1dyYXBwZWQpIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQudW53cmFwKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGNvbnRhaW5lci5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuY29udGFpbmVyQ2xhc3MpXG4gICAgICAgICAgICAgICAgICAgICAuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5TdGlja3kuZGVmYXVsdHMgPSB7XG4gIC8qKlxuICAgKiBDdXN0b21pemFibGUgY29udGFpbmVyIHRlbXBsYXRlLiBBZGQgeW91ciBvd24gY2xhc3NlcyBmb3Igc3R5bGluZyBhbmQgc2l6aW5nLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICcmbHQ7ZGl2IGRhdGEtc3RpY2t5LWNvbnRhaW5lciBjbGFzcz1cInNtYWxsLTYgY29sdW1uc1wiJmd0OyZsdDsvZGl2Jmd0OydcbiAgICovXG4gIGNvbnRhaW5lcjogJzxkaXYgZGF0YS1zdGlja3ktY29udGFpbmVyPjwvZGl2PicsXG4gIC8qKlxuICAgKiBMb2NhdGlvbiBpbiB0aGUgdmlldyB0aGUgZWxlbWVudCBzdGlja3MgdG8uXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RvcCdcbiAgICovXG4gIHN0aWNrVG86ICd0b3AnLFxuICAvKipcbiAgICogSWYgYW5jaG9yZWQgdG8gYSBzaW5nbGUgZWxlbWVudCwgdGhlIGlkIG9mIHRoYXQgZWxlbWVudC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkJ1xuICAgKi9cbiAgYW5jaG9yOiAnJyxcbiAgLyoqXG4gICAqIElmIHVzaW5nIG1vcmUgdGhhbiBvbmUgZWxlbWVudCBhcyBhbmNob3IgcG9pbnRzLCB0aGUgaWQgb2YgdGhlIHRvcCBhbmNob3IuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2V4YW1wbGVJZDp0b3AnXG4gICAqL1xuICB0b3BBbmNob3I6ICcnLFxuICAvKipcbiAgICogSWYgdXNpbmcgbW9yZSB0aGFuIG9uZSBlbGVtZW50IGFzIGFuY2hvciBwb2ludHMsIHRoZSBpZCBvZiB0aGUgYm90dG9tIGFuY2hvci5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkOmJvdHRvbSdcbiAgICovXG4gIGJ0bUFuY2hvcjogJycsXG4gIC8qKlxuICAgKiBNYXJnaW4sIGluIGBlbWAncyB0byBhcHBseSB0byB0aGUgdG9wIG9mIHRoZSBlbGVtZW50IHdoZW4gaXQgYmVjb21lcyBzdGlja3kuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMVxuICAgKi9cbiAgbWFyZ2luVG9wOiAxLFxuICAvKipcbiAgICogTWFyZ2luLCBpbiBgZW1gJ3MgdG8gYXBwbHkgdG8gdGhlIGJvdHRvbSBvZiB0aGUgZWxlbWVudCB3aGVuIGl0IGJlY29tZXMgc3RpY2t5LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDFcbiAgICovXG4gIG1hcmdpbkJvdHRvbTogMSxcbiAgLyoqXG4gICAqIEJyZWFrcG9pbnQgc3RyaW5nIHRoYXQgaXMgdGhlIG1pbmltdW0gc2NyZWVuIHNpemUgYW4gZWxlbWVudCBzaG91bGQgYmVjb21lIHN0aWNreS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xuICAgKi9cbiAgc3RpY2t5T246ICdtZWRpdW0nLFxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byBzdGlja3kgZWxlbWVudCwgYW5kIHJlbW92ZWQgb24gZGVzdHJ1Y3Rpb24uIEZvdW5kYXRpb24gZGVmYXVsdHMgdG8gYHN0aWNreWAuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3N0aWNreSdcbiAgICovXG4gIHN0aWNreUNsYXNzOiAnc3RpY2t5JyxcbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gc3RpY2t5IGNvbnRhaW5lci4gRm91bmRhdGlvbiBkZWZhdWx0cyB0byBgc3RpY2t5LWNvbnRhaW5lcmAuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3N0aWNreS1jb250YWluZXInXG4gICAqL1xuICBjb250YWluZXJDbGFzczogJ3N0aWNreS1jb250YWluZXInLFxuICAvKipcbiAgICogTnVtYmVyIG9mIHNjcm9sbCBldmVudHMgYmV0d2VlbiB0aGUgcGx1Z2luJ3MgcmVjYWxjdWxhdGluZyBzdGlja3kgcG9pbnRzLiBTZXR0aW5nIGl0IHRvIGAwYCB3aWxsIGNhdXNlIGl0IHRvIHJlY2FsYyBldmVyeSBzY3JvbGwgZXZlbnQsIHNldHRpbmcgaXQgdG8gYC0xYCB3aWxsIHByZXZlbnQgcmVjYWxjIG9uIHNjcm9sbC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSA1MFxuICAgKi9cbiAgY2hlY2tFdmVyeTogLTFcbn07XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGNhbGN1bGF0ZSBlbSB2YWx1ZXNcbiAqIEBwYXJhbSBOdW1iZXIge2VtfSAtIG51bWJlciBvZiBlbSdzIHRvIGNhbGN1bGF0ZSBpbnRvIHBpeGVsc1xuICovXG5mdW5jdGlvbiBlbUNhbGMoZW0pIHtcbiAgcmV0dXJuIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHksIG51bGwpLmZvbnRTaXplLCAxMCkgKiBlbTtcbn1cblxuLy8gV2luZG93IGV4cG9ydHNcbkZvdW5kYXRpb24ucGx1Z2luKFN0aWNreSwgJ1N0aWNreScpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogVGFicyBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udGFic1xuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyIGlmIHRhYnMgY29udGFpbiBpbWFnZXNcbiAqL1xuXG5jbGFzcyBUYWJzIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGFicy5cbiAgICogQGNsYXNzXG4gICAqIEBmaXJlcyBUYWJzI2luaXRcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byB0YWJzLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihlbGVtZW50LCBvcHRpb25zKSB7XG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRhYnMuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcblxuICAgIHRoaXMuX2luaXQoKTtcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUYWJzJyk7XG4gICAgRm91bmRhdGlvbi5LZXlib2FyZC5yZWdpc3RlcignVGFicycsIHtcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcbiAgICAgICdBUlJPV19VUCc6ICdwcmV2aW91cycsXG4gICAgICAnQVJST1dfRE9XTic6ICduZXh0JyxcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJ1xuICAgICAgLy8gJ1RBQic6ICduZXh0JyxcbiAgICAgIC8vICdTSElGVF9UQUInOiAncHJldmlvdXMnXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHRhYnMgYnkgc2hvd2luZyBhbmQgZm9jdXNpbmcgKGlmIGF1dG9Gb2N1cz10cnVlKSB0aGUgcHJlc2V0IGFjdGl2ZSB0YWIuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfaW5pdCgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHsncm9sZSc6ICd0YWJsaXN0J30pO1xuICAgIHRoaXMuJHRhYlRpdGxlcyA9IHRoaXMuJGVsZW1lbnQuZmluZChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gKTtcbiAgICB0aGlzLiR0YWJDb250ZW50ID0gJChgW2RhdGEtdGFicy1jb250ZW50PVwiJHt0aGlzLiRlbGVtZW50WzBdLmlkfVwiXWApO1xuXG4gICAgdGhpcy4kdGFiVGl0bGVzLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXG4gICAgICAgICAgJGxpbmsgPSAkZWxlbS5maW5kKCdhJyksXG4gICAgICAgICAgaXNBY3RpdmUgPSAkZWxlbS5oYXNDbGFzcyhgJHtfdGhpcy5vcHRpb25zLmxpbmtBY3RpdmVDbGFzc31gKSxcbiAgICAgICAgICBoYXNoID0gJGxpbmtbMF0uaGFzaC5zbGljZSgxKSxcbiAgICAgICAgICBsaW5rSWQgPSAkbGlua1swXS5pZCA/ICRsaW5rWzBdLmlkIDogYCR7aGFzaH0tbGFiZWxgLFxuICAgICAgICAgICR0YWJDb250ZW50ID0gJChgIyR7aGFzaH1gKTtcblxuICAgICAgJGVsZW0uYXR0cih7J3JvbGUnOiAncHJlc2VudGF0aW9uJ30pO1xuXG4gICAgICAkbGluay5hdHRyKHtcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBoYXNoLFxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGlzQWN0aXZlLFxuICAgICAgICAnaWQnOiBsaW5rSWRcbiAgICAgIH0pO1xuXG4gICAgICAkdGFiQ29udGVudC5hdHRyKHtcbiAgICAgICAgJ3JvbGUnOiAndGFicGFuZWwnLFxuICAgICAgICAnYXJpYS1oaWRkZW4nOiAhaXNBY3RpdmUsXG4gICAgICAgICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWRcbiAgICAgIH0pO1xuXG4gICAgICBpZihpc0FjdGl2ZSAmJiBfdGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XG4gICAgICAgICQod2luZG93KS5sb2FkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHsgc2Nyb2xsVG9wOiAkZWxlbS5vZmZzZXQoKS50b3AgfSwgX3RoaXMub3B0aW9ucy5kZWVwTGlua1NtdWRnZURlbGF5LCAoKSA9PiB7XG4gICAgICAgICAgICAkbGluay5mb2N1cygpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy91c2UgYnJvd3NlciB0byBvcGVuIGEgdGFiLCBpZiBpdCBleGlzdHMgaW4gdGhpcyB0YWJzZXRcbiAgICAgIGlmIChfdGhpcy5vcHRpb25zLmRlZXBMaW5rKSB7XG4gICAgICAgIHZhciBhbmNob3IgPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgICAgLy9uZWVkIGEgaGFzaCBhbmQgYSByZWxldmFudCBhbmNob3IgaW4gdGhpcyB0YWJzZXRcbiAgICAgICAgaWYoYW5jaG9yLmxlbmd0aCkge1xuICAgICAgICAgIHZhciAkbGluayA9ICRlbGVtLmZpbmQoJ1tocmVmPVwiJythbmNob3IrJ1wiXScpO1xuICAgICAgICAgIGlmICgkbGluay5sZW5ndGgpIHtcbiAgICAgICAgICAgIF90aGlzLnNlbGVjdFRhYigkKGFuY2hvcikpO1xuXG4gICAgICAgICAgICAvL3JvbGwgdXAgYSBsaXR0bGUgdG8gc2hvdyB0aGUgdGl0bGVzXG4gICAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy5kZWVwTGlua1NtdWRnZSkge1xuICAgICAgICAgICAgICAkKHdpbmRvdykubG9hZChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gJGVsZW0ub2Zmc2V0KCk7XG4gICAgICAgICAgICAgICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoeyBzY3JvbGxUb3A6IG9mZnNldC50b3AgfSwgX3RoaXMub3B0aW9ucy5kZWVwTGlua1NtdWRnZURlbGF5KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHpwbHVnaW4gaGFzIGRlZXBsaW5rZWQgYXQgcGFnZWxvYWRcbiAgICAgICAgICAgICAgKiBAZXZlbnQgVGFicyNkZWVwbGlua1xuICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICRlbGVtLnRyaWdnZXIoJ2RlZXBsaW5rLnpmLnRhYnMnLCBbJGxpbmssICQoYW5jaG9yKV0pO1xuICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmKHRoaXMub3B0aW9ucy5tYXRjaEhlaWdodCkge1xuICAgICAgdmFyICRpbWFnZXMgPSB0aGlzLiR0YWJDb250ZW50LmZpbmQoJ2ltZycpO1xuXG4gICAgICBpZiAoJGltYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCB0aGlzLl9zZXRIZWlnaHQuYmluZCh0aGlzKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9zZXRIZWlnaHQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIHRhYnMuXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfZXZlbnRzKCkge1xuICAgIHRoaXMuX2FkZEtleUhhbmRsZXIoKTtcbiAgICB0aGlzLl9hZGRDbGlja0hhbmRsZXIoKTtcbiAgICB0aGlzLl9zZXRIZWlnaHRNcUhhbmRsZXIgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tYXRjaEhlaWdodCkge1xuICAgICAgdGhpcy5fc2V0SGVpZ2h0TXFIYW5kbGVyID0gdGhpcy5fc2V0SGVpZ2h0LmJpbmQodGhpcyk7XG5cbiAgICAgICQod2luZG93KS5vbignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fc2V0SGVpZ2h0TXFIYW5kbGVyKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBjbGljayBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZENsaWNrSGFuZGxlcigpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9mZignY2xpY2suemYudGFicycpXG4gICAgICAub24oJ2NsaWNrLnpmLnRhYnMnLCBgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCQodGhpcykpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBrZXlib2FyZCBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2FkZEtleUhhbmRsZXIoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHRoaXMuJHRhYlRpdGxlcy5vZmYoJ2tleWRvd24uemYudGFicycpLm9uKCdrZXlkb3duLnpmLnRhYnMnLCBmdW5jdGlvbihlKXtcbiAgICAgIGlmIChlLndoaWNoID09PSA5KSByZXR1cm47XG5cblxuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcbiAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLFxuICAgICAgICAkcHJldkVsZW1lbnQsXG4gICAgICAgICRuZXh0RWxlbWVudDtcblxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcbiAgICAgICAgICBpZiAoX3RoaXMub3B0aW9ucy53cmFwT25LZXlzKSB7XG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSBpID09PSAwID8gJGVsZW1lbnRzLmxhc3QoKSA6ICRlbGVtZW50cy5lcShpLTEpO1xuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gaSA9PT0gJGVsZW1lbnRzLmxlbmd0aCAtMSA/ICRlbGVtZW50cy5maXJzdCgpIDogJGVsZW1lbnRzLmVxKGkrMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1heCgwLCBpLTEpKTtcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXG4gICAgICBGb3VuZGF0aW9uLktleWJvYXJkLmhhbmRsZUtleShlLCAnVGFicycsIHtcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKS5mb2N1cygpO1xuICAgICAgICAgIF90aGlzLl9oYW5kbGVUYWJDaGFuZ2UoJGVsZW1lbnQpO1xuICAgICAgICB9LFxuICAgICAgICBwcmV2aW91czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgJHByZXZFbGVtZW50LmZpbmQoJ1tyb2xlPVwidGFiXCJdJykuZm9jdXMoKTtcbiAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCRwcmV2RWxlbWVudCk7XG4gICAgICAgIH0sXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICRuZXh0RWxlbWVudC5maW5kKCdbcm9sZT1cInRhYlwiXScpLmZvY3VzKCk7XG4gICAgICAgICAgX3RoaXMuX2hhbmRsZVRhYkNoYW5nZSgkbmV4dEVsZW1lbnQpO1xuICAgICAgICB9LFxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHRhYiBgJHRhcmdldENvbnRlbnRgIGRlZmluZWQgYnkgYCR0YXJnZXRgLiBDb2xsYXBzZXMgYWN0aXZlIHRhYi5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBUYWIgdG8gb3Blbi5cbiAgICogQGZpcmVzIFRhYnMjY2hhbmdlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgX2hhbmRsZVRhYkNoYW5nZSgkdGFyZ2V0KSB7XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBmb3IgYWN0aXZlIGNsYXNzIG9uIHRhcmdldC4gQ29sbGFwc2UgaWYgZXhpc3RzLlxuICAgICAqL1xuICAgIGlmICgkdGFyZ2V0Lmhhc0NsYXNzKGAke3RoaXMub3B0aW9ucy5saW5rQWN0aXZlQ2xhc3N9YCkpIHtcbiAgICAgICAgaWYodGhpcy5vcHRpb25zLmFjdGl2ZUNvbGxhcHNlKSB7XG4gICAgICAgICAgICB0aGlzLl9jb2xsYXBzZVRhYigkdGFyZ2V0KTtcblxuICAgICAgICAgICAvKipcbiAgICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgenBsdWdpbiBoYXMgc3VjY2Vzc2Z1bGx5IGNvbGxhcHNlZCB0YWJzLlxuICAgICAgICAgICAgKiBAZXZlbnQgVGFicyNjb2xsYXBzZVxuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY29sbGFwc2UuemYudGFicycsIFskdGFyZ2V0XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciAkb2xkVGFiID0gdGhpcy4kZWxlbWVudC5cbiAgICAgICAgICBmaW5kKGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfS4ke3RoaXMub3B0aW9ucy5saW5rQWN0aXZlQ2xhc3N9YCksXG4gICAgICAgICAgJHRhYkxpbmsgPSAkdGFyZ2V0LmZpbmQoJ1tyb2xlPVwidGFiXCJdJyksXG4gICAgICAgICAgaGFzaCA9ICR0YWJMaW5rWzBdLmhhc2gsXG4gICAgICAgICAgJHRhcmdldENvbnRlbnQgPSB0aGlzLiR0YWJDb250ZW50LmZpbmQoaGFzaCk7XG5cbiAgICAvL2Nsb3NlIG9sZCB0YWJcbiAgICB0aGlzLl9jb2xsYXBzZVRhYigkb2xkVGFiKTtcblxuICAgIC8vb3BlbiBuZXcgdGFiXG4gICAgdGhpcy5fb3BlblRhYigkdGFyZ2V0KTtcblxuICAgIC8vZWl0aGVyIHJlcGxhY2Ugb3IgdXBkYXRlIGJyb3dzZXIgaGlzdG9yeVxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVlcExpbmspIHtcbiAgICAgIHZhciBhbmNob3IgPSAkdGFyZ2V0LmZpbmQoJ2EnKS5hdHRyKCdocmVmJyk7XG5cbiAgICAgIGlmICh0aGlzLm9wdGlvbnMudXBkYXRlSGlzdG9yeSkge1xuICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZSh7fSwgJycsIGFuY2hvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsIGFuY2hvcik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGhhcyBzdWNjZXNzZnVsbHkgY2hhbmdlZCB0YWJzLlxuICAgICAqIEBldmVudCBUYWJzI2NoYW5nZVxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2hhbmdlLnpmLnRhYnMnLCBbJHRhcmdldCwgJHRhcmdldENvbnRlbnRdKTtcblxuICAgIC8vZmlyZSB0byBjaGlsZHJlbiBhIG11dGF0aW9uIGV2ZW50XG4gICAgJHRhcmdldENvbnRlbnQuZmluZChcIltkYXRhLW11dGF0ZV1cIikudHJpZ2dlcihcIm11dGF0ZW1lLnpmLnRyaWdnZXJcIik7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHRhYiBgJHRhcmdldENvbnRlbnRgIGRlZmluZWQgYnkgYCR0YXJnZXRgLlxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIFRhYiB0byBPcGVuLlxuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIF9vcGVuVGFiKCR0YXJnZXQpIHtcbiAgICAgIHZhciAkdGFiTGluayA9ICR0YXJnZXQuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKSxcbiAgICAgICAgICBoYXNoID0gJHRhYkxpbmtbMF0uaGFzaCxcbiAgICAgICAgICAkdGFyZ2V0Q29udGVudCA9IHRoaXMuJHRhYkNvbnRlbnQuZmluZChoYXNoKTtcblxuICAgICAgJHRhcmdldC5hZGRDbGFzcyhgJHt0aGlzLm9wdGlvbnMubGlua0FjdGl2ZUNsYXNzfWApO1xuXG4gICAgICAkdGFiTGluay5hdHRyKHsnYXJpYS1zZWxlY3RlZCc6ICd0cnVlJ30pO1xuXG4gICAgICAkdGFyZ2V0Q29udGVudFxuICAgICAgICAuYWRkQ2xhc3MoYCR7dGhpcy5vcHRpb25zLnBhbmVsQWN0aXZlQ2xhc3N9YClcbiAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6ICdmYWxzZSd9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb2xsYXBzZXMgYCR0YXJnZXRDb250ZW50YCBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBUYWIgdG8gT3Blbi5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBfY29sbGFwc2VUYWIoJHRhcmdldCkge1xuICAgIHZhciAkdGFyZ2V0X2FuY2hvciA9ICR0YXJnZXRcbiAgICAgIC5yZW1vdmVDbGFzcyhgJHt0aGlzLm9wdGlvbnMubGlua0FjdGl2ZUNsYXNzfWApXG4gICAgICAuZmluZCgnW3JvbGU9XCJ0YWJcIl0nKVxuICAgICAgLmF0dHIoeyAnYXJpYS1zZWxlY3RlZCc6ICdmYWxzZScgfSk7XG5cbiAgICAkKGAjJHskdGFyZ2V0X2FuY2hvci5hdHRyKCdhcmlhLWNvbnRyb2xzJyl9YClcbiAgICAgIC5yZW1vdmVDbGFzcyhgJHt0aGlzLm9wdGlvbnMucGFuZWxBY3RpdmVDbGFzc31gKVxuICAgICAgLmF0dHIoeyAnYXJpYS1oaWRkZW4nOiAndHJ1ZScgfSk7XG4gIH1cblxuICAvKipcbiAgICogUHVibGljIG1ldGhvZCBmb3Igc2VsZWN0aW5nIGEgY29udGVudCBwYW5lIHRvIGRpc3BsYXkuXG4gICAqIEBwYXJhbSB7alF1ZXJ5IHwgU3RyaW5nfSBlbGVtIC0galF1ZXJ5IG9iamVjdCBvciBzdHJpbmcgb2YgdGhlIGlkIG9mIHRoZSBwYW5lIHRvIGRpc3BsYXkuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgc2VsZWN0VGFiKGVsZW0pIHtcbiAgICB2YXIgaWRTdHI7XG5cbiAgICBpZiAodHlwZW9mIGVsZW0gPT09ICdvYmplY3QnKSB7XG4gICAgICBpZFN0ciA9IGVsZW1bMF0uaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlkU3RyID0gZWxlbTtcbiAgICB9XG5cbiAgICBpZiAoaWRTdHIuaW5kZXhPZignIycpIDwgMCkge1xuICAgICAgaWRTdHIgPSBgIyR7aWRTdHJ9YDtcbiAgICB9XG5cbiAgICB2YXIgJHRhcmdldCA9IHRoaXMuJHRhYlRpdGxlcy5maW5kKGBbaHJlZj1cIiR7aWRTdHJ9XCJdYCkucGFyZW50KGAuJHt0aGlzLm9wdGlvbnMubGlua0NsYXNzfWApO1xuXG4gICAgdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCR0YXJnZXQpO1xuICB9O1xuICAvKipcbiAgICogU2V0cyB0aGUgaGVpZ2h0IG9mIGVhY2ggcGFuZWwgdG8gdGhlIGhlaWdodCBvZiB0aGUgdGFsbGVzdCBwYW5lbC5cbiAgICogSWYgZW5hYmxlZCBpbiBvcHRpb25zLCBnZXRzIGNhbGxlZCBvbiBtZWRpYSBxdWVyeSBjaGFuZ2UuXG4gICAqIElmIGxvYWRpbmcgY29udGVudCB2aWEgZXh0ZXJuYWwgc291cmNlLCBjYW4gYmUgY2FsbGVkIGRpcmVjdGx5IG9yIHdpdGggX3JlZmxvdy5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfc2V0SGVpZ2h0KCkge1xuICAgIHZhciBtYXggPSAwO1xuICAgIHRoaXMuJHRhYkNvbnRlbnRcbiAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMucGFuZWxDbGFzc31gKVxuICAgICAgLmNzcygnaGVpZ2h0JywgJycpXG4gICAgICAuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBhbmVsID0gJCh0aGlzKSxcbiAgICAgICAgICAgIGlzQWN0aXZlID0gcGFuZWwuaGFzQ2xhc3MoYCR7dGhpcy5vcHRpb25zLnBhbmVsQWN0aXZlQ2xhc3N9YCk7XG5cbiAgICAgICAgaWYgKCFpc0FjdGl2ZSkge1xuICAgICAgICAgIHBhbmVsLmNzcyh7J3Zpc2liaWxpdHknOiAnaGlkZGVuJywgJ2Rpc3BsYXknOiAnYmxvY2snfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGVtcCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xuXG4gICAgICAgIGlmICghaXNBY3RpdmUpIHtcbiAgICAgICAgICBwYW5lbC5jc3Moe1xuICAgICAgICAgICAgJ3Zpc2liaWxpdHknOiAnJyxcbiAgICAgICAgICAgICdkaXNwbGF5JzogJydcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIG1heCA9IHRlbXAgPiBtYXggPyB0ZW1wIDogbWF4O1xuICAgICAgfSlcbiAgICAgIC5jc3MoJ2hlaWdodCcsIGAke21heH1weGApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIHRhYnMuXG4gICAqIEBmaXJlcyBUYWJzI2Rlc3Ryb3llZFxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50XG4gICAgICAuZmluZChgLiR7dGhpcy5vcHRpb25zLmxpbmtDbGFzc31gKVxuICAgICAgLm9mZignLnpmLnRhYnMnKS5oaWRlKCkuZW5kKClcbiAgICAgIC5maW5kKGAuJHt0aGlzLm9wdGlvbnMucGFuZWxDbGFzc31gKVxuICAgICAgLmhpZGUoKTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMubWF0Y2hIZWlnaHQpIHtcbiAgICAgIGlmICh0aGlzLl9zZXRIZWlnaHRNcUhhbmRsZXIgIT0gbnVsbCkge1xuICAgICAgICAgJCh3aW5kb3cpLm9mZignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5JywgdGhpcy5fc2V0SGVpZ2h0TXFIYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuVGFicy5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgd2luZG93IHRvIHNjcm9sbCB0byBjb250ZW50IG9mIHBhbmUgc3BlY2lmaWVkIGJ5IGhhc2ggYW5jaG9yXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgZmFsc2VcbiAgICovXG4gIGRlZXBMaW5rOiBmYWxzZSxcblxuICAvKipcbiAgICogQWRqdXN0IHRoZSBkZWVwIGxpbmsgc2Nyb2xsIHRvIG1ha2Ugc3VyZSB0aGUgdG9wIG9mIHRoZSB0YWIgcGFuZWwgaXMgdmlzaWJsZVxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkZWVwTGlua1NtdWRnZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIEFuaW1hdGlvbiB0aW1lIChtcykgZm9yIHRoZSBkZWVwIGxpbmsgYWRqdXN0bWVudFxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDMwMFxuICAgKi9cbiAgZGVlcExpbmtTbXVkZ2VEZWxheTogMzAwLFxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIGJyb3dzZXIgaGlzdG9yeSB3aXRoIHRoZSBvcGVuIHRhYlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICB1cGRhdGVIaXN0b3J5OiBmYWxzZSxcblxuICAvKipcbiAgICogQWxsb3dzIHRoZSB3aW5kb3cgdG8gc2Nyb2xsIHRvIGNvbnRlbnQgb2YgYWN0aXZlIHBhbmUgb24gbG9hZCBpZiBzZXQgdG8gdHJ1ZS5cbiAgICogTm90IHJlY29tbWVuZGVkIGlmIG1vcmUgdGhhbiBvbmUgdGFiIHBhbmVsIHBlciBwYWdlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhdXRvRm9jdXM6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBBbGxvd3Mga2V5Ym9hcmQgaW5wdXQgdG8gJ3dyYXAnIGFyb3VuZCB0aGUgdGFiIGxpbmtzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIHRydWVcbiAgICovXG4gIHdyYXBPbktleXM6IHRydWUsXG5cbiAgLyoqXG4gICAqIEFsbG93cyB0aGUgdGFiIGNvbnRlbnQgcGFuZXMgdG8gbWF0Y2ggaGVpZ2h0cyBpZiBzZXQgdG8gdHJ1ZS5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgbWF0Y2hIZWlnaHQ6IGZhbHNlLFxuXG4gIC8qKlxuICAgKiBBbGxvd3MgYWN0aXZlIHRhYnMgdG8gY29sbGFwc2Ugd2hlbiBjbGlja2VkLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhY3RpdmVDb2xsYXBzZTogZmFsc2UsXG5cbiAgLyoqXG4gICAqIENsYXNzIGFwcGxpZWQgdG8gYGxpYCdzIGluIHRhYiBsaW5rIGxpc3QuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RhYnMtdGl0bGUnXG4gICAqL1xuICBsaW5rQ2xhc3M6ICd0YWJzLXRpdGxlJyxcblxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYWN0aXZlIGBsaWAgaW4gdGFiIGxpbmsgbGlzdC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnaXMtYWN0aXZlJ1xuICAgKi9cbiAgbGlua0FjdGl2ZUNsYXNzOiAnaXMtYWN0aXZlJyxcblxuICAvKipcbiAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgY29udGVudCBjb250YWluZXJzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0YWJzLXBhbmVsJ1xuICAgKi9cbiAgcGFuZWxDbGFzczogJ3RhYnMtcGFuZWwnLFxuXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBhY3RpdmUgY29udGVudCBjb250YWluZXIuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ2lzLWFjdGl2ZSdcbiAgICovXG4gIHBhbmVsQWN0aXZlQ2xhc3M6ICdpcy1hY3RpdmUnXG59O1xuXG4vLyBXaW5kb3cgZXhwb3J0c1xuRm91bmRhdGlvbi5wbHVnaW4oVGFicywgJ1RhYnMnKTtcblxufShqUXVlcnkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4hZnVuY3Rpb24oJCkge1xuXG4vKipcbiAqIFRvZ2dsZXIgbW9kdWxlLlxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRvZ2dsZXJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzXG4gKi9cblxuY2xhc3MgVG9nZ2xlciB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRvZ2dsZXIuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgVG9nZ2xlciNpbml0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVG9nZ2xlci5kZWZhdWx0cywgZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuICAgIHRoaXMuY2xhc3NOYW1lID0gJyc7XG5cbiAgICB0aGlzLl9pbml0KCk7XG4gICAgdGhpcy5fZXZlbnRzKCk7XG5cbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMsICdUb2dnbGVyJyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgdGhlIFRvZ2dsZXIgcGx1Z2luIGJ5IHBhcnNpbmcgdGhlIHRvZ2dsZSBjbGFzcyBmcm9tIGRhdGEtdG9nZ2xlciwgb3IgYW5pbWF0aW9uIGNsYXNzZXMgZnJvbSBkYXRhLWFuaW1hdGUuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGlucHV0O1xuICAgIC8vIFBhcnNlIGFuaW1hdGlvbiBjbGFzc2VzIGlmIHRoZXkgd2VyZSBzZXRcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcbiAgICAgIGlucHV0ID0gdGhpcy5vcHRpb25zLmFuaW1hdGUuc3BsaXQoJyAnKTtcblxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xuICAgICAgdGhpcy5hbmltYXRpb25PdXQgPSBpbnB1dFsxXSB8fCBudWxsO1xuICAgIH1cbiAgICAvLyBPdGhlcndpc2UsIHBhcnNlIHRvZ2dsZSBjbGFzc1xuICAgIGVsc2Uge1xuICAgICAgaW5wdXQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3RvZ2dsZXInKTtcbiAgICAgIC8vIEFsbG93IGZvciBhIC4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXG4gICAgICB0aGlzLmNsYXNzTmFtZSA9IGlucHV0WzBdID09PSAnLicgPyBpbnB1dC5zbGljZSgxKSA6IGlucHV0O1xuICAgIH1cblxuICAgIC8vIEFkZCBBUklBIGF0dHJpYnV0ZXMgdG8gdHJpZ2dlcnNcbiAgICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkO1xuICAgICQoYFtkYXRhLW9wZW49XCIke2lkfVwiXSwgW2RhdGEtY2xvc2U9XCIke2lkfVwiXSwgW2RhdGEtdG9nZ2xlPVwiJHtpZH1cIl1gKVxuICAgICAgLmF0dHIoJ2FyaWEtY29udHJvbHMnLCBpZCk7XG4gICAgLy8gSWYgdGhlIHRhcmdldCBpcyBoaWRkZW4sIGFkZCBhcmlhLWhpZGRlblxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSA/IGZhbHNlIDogdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgdG9nZ2xlIHRyaWdnZXIuXG4gICAqIEBmdW5jdGlvblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2V2ZW50cygpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZigndG9nZ2xlLnpmLnRyaWdnZXInKS5vbigndG9nZ2xlLnpmLnRyaWdnZXInLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUb2dnbGVzIHRoZSB0YXJnZXQgY2xhc3Mgb24gdGhlIHRhcmdldCBlbGVtZW50LiBBbiBldmVudCBpcyBmaXJlZCBmcm9tIHRoZSBvcmlnaW5hbCB0cmlnZ2VyIGRlcGVuZGluZyBvbiBpZiB0aGUgcmVzdWx0YW50IHN0YXRlIHdhcyBcIm9uXCIgb3IgXCJvZmZcIi5cbiAgICogQGZ1bmN0aW9uXG4gICAqIEBmaXJlcyBUb2dnbGVyI29uXG4gICAqIEBmaXJlcyBUb2dnbGVyI29mZlxuICAgKi9cbiAgdG9nZ2xlKCkge1xuICAgIHRoaXNbIHRoaXMub3B0aW9ucy5hbmltYXRlID8gJ190b2dnbGVBbmltYXRlJyA6ICdfdG9nZ2xlQ2xhc3MnXSgpO1xuICB9XG5cbiAgX3RvZ2dsZUNsYXNzKCkge1xuICAgIHRoaXMuJGVsZW1lbnQudG9nZ2xlQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xuXG4gICAgdmFyIGlzT24gPSB0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKHRoaXMuY2xhc3NOYW1lKTtcbiAgICBpZiAoaXNPbikge1xuICAgICAgLyoqXG4gICAgICAgKiBGaXJlcyBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaGFzIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cbiAgICAgICAqIEBldmVudCBUb2dnbGVyI29uXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb24uemYudG9nZ2xlcicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIC8qKlxuICAgICAgICogRmlyZXMgaWYgdGhlIHRhcmdldCBlbGVtZW50IGRvZXMgbm90IGhhdmUgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb2ZmXG4gICAgICAgKi9cbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignb2ZmLnpmLnRvZ2dsZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVBUklBKGlzT24pO1xuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtbXV0YXRlXScpLnRyaWdnZXIoJ211dGF0ZW1lLnpmLnRyaWdnZXInKTtcbiAgfVxuXG4gIF90b2dnbGVBbmltYXRlKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBpZiAodGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpKSB7XG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4odGhpcy4kZWxlbWVudCwgdGhpcy5hbmltYXRpb25JbiwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKHRydWUpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ29uLnpmLnRvZ2dsZXInKTtcbiAgICAgICAgdGhpcy5maW5kKCdbZGF0YS1tdXRhdGVdJykudHJpZ2dlcignbXV0YXRlbWUuemYudHJpZ2dlcicpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbk91dCwgZnVuY3Rpb24oKSB7XG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKGZhbHNlKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xuICAgICAgICB0aGlzLmZpbmQoJ1tkYXRhLW11dGF0ZV0nKS50cmlnZ2VyKCdtdXRhdGVtZS56Zi50cmlnZ2VyJyk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQVJJQShpc09uKSB7XG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWV4cGFuZGVkJywgaXNPbiA/IHRydWUgOiBmYWxzZSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIGluc3RhbmNlIG9mIFRvZ2dsZXIgb24gdGhlIGVsZW1lbnQuXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnRvZ2dsZXInKTtcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XG4gIH1cbn1cblxuVG9nZ2xlci5kZWZhdWx0cyA9IHtcbiAgLyoqXG4gICAqIFRlbGxzIHRoZSBwbHVnaW4gaWYgdGhlIGVsZW1lbnQgc2hvdWxkIGFuaW1hdGVkIHdoZW4gdG9nZ2xlZC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSBmYWxzZVxuICAgKi9cbiAgYW5pbWF0ZTogZmFsc2Vcbn07XG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihUb2dnbGVyLCAnVG9nZ2xlcicpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbiFmdW5jdGlvbigkKSB7XG5cbi8qKlxuICogVG9vbHRpcCBtb2R1bGUuXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9vbHRpcFxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xuICovXG5cbmNsYXNzIFRvb2x0aXAge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIFRvb2x0aXAuXG4gICAqIEBjbGFzc1xuICAgKiBAZmlyZXMgVG9vbHRpcCNpbml0XG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhdHRhY2ggYSB0b29sdGlwIHRvLlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9iamVjdCB0byBleHRlbmQgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVG9vbHRpcC5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMuaXNDbGljayA9IGZhbHNlO1xuICAgIHRoaXMuX2luaXQoKTtcblxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcywgJ1Rvb2x0aXAnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyB0aGUgdG9vbHRpcCBieSBzZXR0aW5nIHRoZSBjcmVhdGluZyB0aGUgdGlwIGVsZW1lbnQsIGFkZGluZyBpdCdzIHRleHQsIHNldHRpbmcgcHJpdmF0ZSB2YXJpYWJsZXMgYW5kIHNldHRpbmcgYXR0cmlidXRlcyBvbiB0aGUgYW5jaG9yLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2luaXQoKSB7XG4gICAgdmFyIGVsZW1JZCA9IHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1kZXNjcmliZWRieScpIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3Rvb2x0aXAnKTtcblxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzID0gdGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MgfHwgdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyh0aGlzLiRlbGVtZW50KTtcbiAgICB0aGlzLm9wdGlvbnMudGlwVGV4dCA9IHRoaXMub3B0aW9ucy50aXBUZXh0IHx8IHRoaXMuJGVsZW1lbnQuYXR0cigndGl0bGUnKTtcbiAgICB0aGlzLnRlbXBsYXRlID0gdGhpcy5vcHRpb25zLnRlbXBsYXRlID8gJCh0aGlzLm9wdGlvbnMudGVtcGxhdGUpIDogdGhpcy5fYnVpbGRUZW1wbGF0ZShlbGVtSWQpO1xuXG4gICAgaWYgKHRoaXMub3B0aW9ucy5hbGxvd0h0bWwpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUuYXBwZW5kVG8oZG9jdW1lbnQuYm9keSlcbiAgICAgICAgLmh0bWwodGhpcy5vcHRpb25zLnRpcFRleHQpXG4gICAgICAgIC5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGVtcGxhdGUuYXBwZW5kVG8oZG9jdW1lbnQuYm9keSlcbiAgICAgICAgLnRleHQodGhpcy5vcHRpb25zLnRpcFRleHQpXG4gICAgICAgIC5oaWRlKCk7XG4gICAgfVxuXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcbiAgICAgICd0aXRsZSc6ICcnLFxuICAgICAgJ2FyaWEtZGVzY3JpYmVkYnknOiBlbGVtSWQsXG4gICAgICAnZGF0YS15ZXRpLWJveCc6IGVsZW1JZCxcbiAgICAgICdkYXRhLXRvZ2dsZSc6IGVsZW1JZCxcbiAgICAgICdkYXRhLXJlc2l6ZSc6IGVsZW1JZFxuICAgIH0pLmFkZENsYXNzKHRoaXMub3B0aW9ucy50cmlnZ2VyQ2xhc3MpO1xuXG4gICAgLy9oZWxwZXIgdmFyaWFibGVzIHRvIHRyYWNrIG1vdmVtZW50IG9uIGNvbGxpc2lvbnNcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcbiAgICB0aGlzLmNvdW50ZXIgPSA0O1xuICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9ldmVudHMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHcmFicyB0aGUgY3VycmVudCBwb3NpdGlvbmluZyBjbGFzcywgaWYgcHJlc2VudCwgYW5kIHJldHVybnMgdGhlIHZhbHVlIG9yIGFuIGVtcHR5IHN0cmluZy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9nZXRQb3NpdGlvbkNsYXNzKGVsZW1lbnQpIHtcbiAgICBpZiAoIWVsZW1lbnQpIHsgcmV0dXJuICcnOyB9XG4gICAgLy8gdmFyIHBvc2l0aW9uID0gZWxlbWVudC5hdHRyKCdjbGFzcycpLm1hdGNoKC90b3B8bGVmdHxyaWdodC9nKTtcbiAgICB2YXIgcG9zaXRpb24gPSBlbGVtZW50WzBdLmNsYXNzTmFtZS5tYXRjaCgvXFxiKHRvcHxsZWZ0fHJpZ2h0KVxcYi9nKTtcbiAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiA/IHBvc2l0aW9uWzBdIDogJyc7XG4gICAgcmV0dXJuIHBvc2l0aW9uO1xuICB9O1xuICAvKipcbiAgICogYnVpbGRzIHRoZSB0b29sdGlwIGVsZW1lbnQsIGFkZHMgYXR0cmlidXRlcywgYW5kIHJldHVybnMgdGhlIHRlbXBsYXRlLlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX2J1aWxkVGVtcGxhdGUoaWQpIHtcbiAgICB2YXIgdGVtcGxhdGVDbGFzc2VzID0gKGAke3RoaXMub3B0aW9ucy50b29sdGlwQ2xhc3N9ICR7dGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3N9ICR7dGhpcy5vcHRpb25zLnRlbXBsYXRlQ2xhc3Nlc31gKS50cmltKCk7XG4gICAgdmFyICR0ZW1wbGF0ZSA9ICAkKCc8ZGl2PjwvZGl2PicpLmFkZENsYXNzKHRlbXBsYXRlQ2xhc3NlcykuYXR0cih7XG4gICAgICAncm9sZSc6ICd0b29sdGlwJyxcbiAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiBmYWxzZSxcbiAgICAgICdkYXRhLWlzLWZvY3VzJzogZmFsc2UsXG4gICAgICAnaWQnOiBpZFxuICAgIH0pO1xuICAgIHJldHVybiAkdGVtcGxhdGU7XG4gIH1cblxuICAvKipcbiAgICogRnVuY3Rpb24gdGhhdCBnZXRzIGNhbGxlZCBpZiBhIGNvbGxpc2lvbiBldmVudCBpcyBkZXRlY3RlZC5cbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb25pbmcgY2xhc3MgdG8gdHJ5XG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBfcmVwb3NpdGlvbihwb3NpdGlvbikge1xuICAgIHRoaXMudXNlZFBvc2l0aW9ucy5wdXNoKHBvc2l0aW9uID8gcG9zaXRpb24gOiAnYm90dG9tJyk7XG5cbiAgICAvL2RlZmF1bHQsIHRyeSBzd2l0Y2hpbmcgdG8gb3Bwb3NpdGUgc2lkZVxuICAgIGlmICghcG9zaXRpb24gJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCd0b3AnKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLmFkZENsYXNzKCd0b3AnKTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdsZWZ0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3JpZ2h0JykgPCAwKSkge1xuICAgICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmVDbGFzcyhwb3NpdGlvbilcbiAgICAgICAgICAuYWRkQ2xhc3MoJ3JpZ2h0Jyk7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ3JpZ2h0JyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2xlZnQnKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxuICAgICAgICAgIC5hZGRDbGFzcygnbGVmdCcpO1xuICAgIH1cblxuICAgIC8vaWYgZGVmYXVsdCBjaGFuZ2UgZGlkbid0IHdvcmssIHRyeSBib3R0b20gb3IgbGVmdCBmaXJzdFxuICAgIGVsc2UgaWYgKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUuYWRkQ2xhc3MoJ2xlZnQnKTtcbiAgICB9IGVsc2UgaWYgKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XG4gICAgfSBlbHNlIGlmIChwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH0gZWxzZSBpZiAocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdib3R0b20nKSA8IDApKSB7XG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xuICAgIH1cbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XG4gICAgdGhpcy5jb3VudGVyLS07XG4gIH1cblxuICAvKipcbiAgICogc2V0cyB0aGUgcG9zaXRpb24gY2xhc3Mgb2YgYW4gZWxlbWVudCBhbmQgcmVjdXJzaXZlbHkgY2FsbHMgaXRzZWxmIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlIHBvc3NpYmxlIHBvc2l0aW9ucyB0byBhdHRlbXB0LCBvciB0aGUgdG9vbHRpcCBlbGVtZW50IGlzIG5vIGxvbmdlciBjb2xsaWRpbmcuXG4gICAqIGlmIHRoZSB0b29sdGlwIGlzIGxhcmdlciB0aGFuIHRoZSBzY3JlZW4gd2lkdGgsIGRlZmF1bHQgdG8gZnVsbCB3aWR0aCAtIGFueSB1c2VyIHNlbGVjdGVkIG1hcmdpblxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgX3NldFBvc2l0aW9uKCkge1xuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX2dldFBvc2l0aW9uQ2xhc3ModGhpcy50ZW1wbGF0ZSksXG4gICAgICAgICR0aXBEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLnRlbXBsYXRlKSxcbiAgICAgICAgJGFuY2hvckRpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMuJGVsZW1lbnQpLFxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXG4gICAgICAgIG9mZnNldCA9IChwYXJhbSA9PT0gJ2hlaWdodCcpID8gdGhpcy5vcHRpb25zLnZPZmZzZXQgOiB0aGlzLm9wdGlvbnMuaE9mZnNldCxcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xuXG4gICAgaWYgKCgkdGlwRGltcy53aWR0aCA+PSAkdGlwRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSkpIHtcbiAgICAgIHRoaXMudGVtcGxhdGUub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy50ZW1wbGF0ZSwgdGhpcy4kZWxlbWVudCwgJ2NlbnRlciBib3R0b20nLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQsIHRydWUpKS5jc3Moe1xuICAgICAgLy8gdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcbiAgICAgICAgJ3dpZHRoJzogJGFuY2hvckRpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpLFxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0aGlzLnRlbXBsYXRlLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsJ2NlbnRlciAnICsgKHBvc2l0aW9uIHx8ICdib3R0b20nKSwgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0KSk7XG5cbiAgICB3aGlsZSghRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSAmJiB0aGlzLmNvdW50ZXIpIHtcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogcmV2ZWFscyB0aGUgdG9vbHRpcCwgYW5kIGZpcmVzIGFuIGV2ZW50IHRvIGNsb3NlIGFueSBvdGhlciBvcGVuIHRvb2x0aXBzIG9uIHRoZSBwYWdlXG4gICAqIEBmaXJlcyBUb29sdGlwI2Nsb3NlbWVcbiAgICogQGZpcmVzIFRvb2x0aXAjc2hvd1xuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHNob3coKSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zaG93T24gIT09ICdhbGwnICYmICFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuaXModGhpcy5vcHRpb25zLnNob3dPbikpIHtcbiAgICAgIC8vIGNvbnNvbGUuZXJyb3IoJ1RoZSBzY3JlZW4gaXMgdG9vIHNtYWxsIHRvIGRpc3BsYXkgdGhpcyB0b29sdGlwJyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLnRlbXBsYXRlLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKS5zaG93KCk7XG4gICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcblxuICAgIC8qKlxuICAgICAqIEZpcmVzIHRvIGNsb3NlIGFsbCBvdGhlciBvcGVuIHRvb2x0aXBzIG9uIHRoZSBwYWdlXG4gICAgICogQGV2ZW50IENsb3NlbWUjdG9vbHRpcFxuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VtZS56Zi50b29sdGlwJywgdGhpcy50ZW1wbGF0ZS5hdHRyKCdpZCcpKTtcblxuXG4gICAgdGhpcy50ZW1wbGF0ZS5hdHRyKHtcbiAgICAgICdkYXRhLWlzLWFjdGl2ZSc6IHRydWUsXG4gICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZVxuICAgIH0pO1xuICAgIF90aGlzLmlzQWN0aXZlID0gdHJ1ZTtcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnRlbXBsYXRlKTtcbiAgICB0aGlzLnRlbXBsYXRlLnN0b3AoKS5oaWRlKCkuY3NzKCd2aXNpYmlsaXR5JywgJycpLmZhZGVJbih0aGlzLm9wdGlvbnMuZmFkZUluRHVyYXRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgLy9tYXliZSBkbyBzdHVmZj9cbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSB0b29sdGlwIGlzIHNob3duXG4gICAgICogQGV2ZW50IFRvb2x0aXAjc2hvd1xuICAgICAqL1xuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi50b29sdGlwJyk7XG4gIH1cblxuICAvKipcbiAgICogSGlkZXMgdGhlIGN1cnJlbnQgdG9vbHRpcCwgYW5kIHJlc2V0cyB0aGUgcG9zaXRpb25pbmcgY2xhc3MgaWYgaXQgd2FzIGNoYW5nZWQgZHVlIHRvIGNvbGxpc2lvblxuICAgKiBAZmlyZXMgVG9vbHRpcCNoaWRlXG4gICAqIEBmdW5jdGlvblxuICAgKi9cbiAgaGlkZSgpIHtcbiAgICAvLyBjb25zb2xlLmxvZygnaGlkaW5nJywgdGhpcy4kZWxlbWVudC5kYXRhKCd5ZXRpLWJveCcpKTtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgIHRoaXMudGVtcGxhdGUuc3RvcCgpLmF0dHIoe1xuICAgICAgJ2FyaWEtaGlkZGVuJzogdHJ1ZSxcbiAgICAgICdkYXRhLWlzLWFjdGl2ZSc6IGZhbHNlXG4gICAgfSkuZmFkZU91dCh0aGlzLm9wdGlvbnMuZmFkZU91dER1cmF0aW9uLCBmdW5jdGlvbigpIHtcbiAgICAgIF90aGlzLmlzQWN0aXZlID0gZmFsc2U7XG4gICAgICBfdGhpcy5pc0NsaWNrID0gZmFsc2U7XG4gICAgICBpZiAoX3RoaXMuY2xhc3NDaGFuZ2VkKSB7XG4gICAgICAgIF90aGlzLnRlbXBsYXRlXG4gICAgICAgICAgICAgLnJlbW92ZUNsYXNzKF90aGlzLl9nZXRQb3NpdGlvbkNsYXNzKF90aGlzLnRlbXBsYXRlKSlcbiAgICAgICAgICAgICAuYWRkQ2xhc3MoX3RoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKTtcblxuICAgICAgIF90aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcbiAgICAgICBfdGhpcy5jb3VudGVyID0gNDtcbiAgICAgICBfdGhpcy5jbGFzc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvKipcbiAgICAgKiBmaXJlcyB3aGVuIHRoZSB0b29sdGlwIGlzIGhpZGRlblxuICAgICAqIEBldmVudCBUb29sdGlwI2hpZGVcbiAgICAgKi9cbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2hpZGUuemYudG9vbHRpcCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIGFkZHMgZXZlbnQgbGlzdGVuZXJzIGZvciB0aGUgdG9vbHRpcCBhbmQgaXRzIGFuY2hvclxuICAgKiBUT0RPIGNvbWJpbmUgc29tZSBvZiB0aGUgbGlzdGVuZXJzIGxpa2UgZm9jdXMgYW5kIG1vdXNlZW50ZXIsIGV0Yy5cbiAgICogQHByaXZhdGVcbiAgICovXG4gIF9ldmVudHMoKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB2YXIgJHRlbXBsYXRlID0gdGhpcy50ZW1wbGF0ZTtcbiAgICB2YXIgaXNGb2N1cyA9IGZhbHNlO1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuZGlzYWJsZUhvdmVyKSB7XG5cbiAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbignbW91c2VlbnRlci56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIV90aGlzLmlzQWN0aXZlKSB7XG4gICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5zaG93KCk7XG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5vbignbW91c2VsZWF2ZS56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XG4gICAgICAgIGlmICghaXNGb2N1cyB8fCAoX3RoaXMuaXNDbGljayAmJiAhX3RoaXMub3B0aW9ucy5jbGlja09wZW4pKSB7XG4gICAgICAgICAgX3RoaXMuaGlkZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLmNsaWNrT3Blbikge1xuICAgICAgdGhpcy4kZWxlbWVudC5vbignbW91c2Vkb3duLnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGlmIChfdGhpcy5pc0NsaWNrKSB7XG4gICAgICAgICAgLy9fdGhpcy5oaWRlKCk7XG4gICAgICAgICAgLy8gX3RoaXMuaXNDbGljayA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIF90aGlzLmlzQ2xpY2sgPSB0cnVlO1xuICAgICAgICAgIGlmICgoX3RoaXMub3B0aW9ucy5kaXNhYmxlSG92ZXIgfHwgIV90aGlzLiRlbGVtZW50LmF0dHIoJ3RhYmluZGV4JykpICYmICFfdGhpcy5pc0FjdGl2ZSkge1xuICAgICAgICAgICAgX3RoaXMuc2hvdygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ21vdXNlZG93bi56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICBfdGhpcy5pc0NsaWNrID0gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5vcHRpb25zLmRpc2FibGVGb3JUb3VjaCkge1xuICAgICAgdGhpcy4kZWxlbWVudFxuICAgICAgLm9uKCd0YXAuemYudG9vbHRpcCB0b3VjaGVuZC56Zi50b29sdGlwJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBfdGhpcy5pc0FjdGl2ZSA/IF90aGlzLmhpZGUoKSA6IF90aGlzLnNob3coKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xuICAgICAgLy8gJ3RvZ2dsZS56Zi50cmlnZ2VyJzogdGhpcy50b2dnbGUuYmluZCh0aGlzKSxcbiAgICAgIC8vICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5oaWRlLmJpbmQodGhpcylcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5oaWRlLmJpbmQodGhpcylcbiAgICB9KTtcblxuICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgIC5vbignZm9jdXMuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaXNGb2N1cyA9IHRydWU7XG4gICAgICAgIGlmIChfdGhpcy5pc0NsaWNrKSB7XG4gICAgICAgICAgLy8gSWYgd2UncmUgbm90IHNob3dpbmcgb3BlbiBvbiBjbGlja3MsIHdlIG5lZWQgdG8gcHJldGVuZCBhIGNsaWNrLWxhdW5jaGVkIGZvY3VzIGlzbid0XG4gICAgICAgICAgLy8gYSByZWFsIGZvY3VzLCBvdGhlcndpc2Ugb24gaG92ZXIgYW5kIGNvbWUgYmFjayB3ZSBnZXQgYmFkIGJlaGF2aW9yXG4gICAgICAgICAgaWYoIV90aGlzLm9wdGlvbnMuY2xpY2tPcGVuKSB7IGlzRm9jdXMgPSBmYWxzZTsgfVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBfdGhpcy5zaG93KCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC5vbignZm9jdXNvdXQuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaXNGb2N1cyA9IGZhbHNlO1xuICAgICAgICBfdGhpcy5pc0NsaWNrID0gZmFsc2U7XG4gICAgICAgIF90aGlzLmhpZGUoKTtcbiAgICAgIH0pXG5cbiAgICAgIC5vbigncmVzaXplbWUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoX3RoaXMuaXNBY3RpdmUpIHtcbiAgICAgICAgICBfdGhpcy5fc2V0UG9zaXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogYWRkcyBhIHRvZ2dsZSBtZXRob2QsIGluIGFkZGl0aW9uIHRvIHRoZSBzdGF0aWMgc2hvdygpICYgaGlkZSgpIGZ1bmN0aW9uc1xuICAgKiBAZnVuY3Rpb25cbiAgICovXG4gIHRvZ2dsZSgpIHtcbiAgICBpZiAodGhpcy5pc0FjdGl2ZSkge1xuICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvdygpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiB0b29sdGlwLCByZW1vdmVzIHRlbXBsYXRlIGVsZW1lbnQgZnJvbSB0aGUgdmlldy5cbiAgICogQGZ1bmN0aW9uXG4gICAqL1xuICBkZXN0cm95KCkge1xuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigndGl0bGUnLCB0aGlzLnRlbXBsYXRlLnRleHQoKSlcbiAgICAgICAgICAgICAgICAgLm9mZignLnpmLnRyaWdnZXIgLnpmLnRvb2x0aXAnKVxuICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MoJ2hhcy10aXAgdG9wIHJpZ2h0IGxlZnQnKVxuICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1kZXNjcmliZWRieSBhcmlhLWhhc3BvcHVwIGRhdGEtZGlzYWJsZS1ob3ZlciBkYXRhLXJlc2l6ZSBkYXRhLXRvZ2dsZSBkYXRhLXRvb2x0aXAgZGF0YS15ZXRpLWJveCcpO1xuXG4gICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmUoKTtcblxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcbiAgfVxufVxuXG5Ub29sdGlwLmRlZmF1bHRzID0ge1xuICBkaXNhYmxlRm9yVG91Y2g6IGZhbHNlLFxuICAvKipcbiAgICogVGltZSwgaW4gbXMsIGJlZm9yZSBhIHRvb2x0aXAgc2hvdWxkIG9wZW4gb24gaG92ZXIuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMjAwXG4gICAqL1xuICBob3ZlckRlbGF5OiAyMDAsXG4gIC8qKlxuICAgKiBUaW1lLCBpbiBtcywgYSB0b29sdGlwIHNob3VsZCB0YWtlIHRvIGZhZGUgaW50byB2aWV3LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDE1MFxuICAgKi9cbiAgZmFkZUluRHVyYXRpb246IDE1MCxcbiAgLyoqXG4gICAqIFRpbWUsIGluIG1zLCBhIHRvb2x0aXAgc2hvdWxkIHRha2UgdG8gZmFkZSBvdXQgb2Ygdmlldy5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAxNTBcbiAgICovXG4gIGZhZGVPdXREdXJhdGlvbjogMTUwLFxuICAvKipcbiAgICogRGlzYWJsZXMgaG92ZXIgZXZlbnRzIGZyb20gb3BlbmluZyB0aGUgdG9vbHRpcCBpZiBzZXQgdG8gdHJ1ZVxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBkaXNhYmxlSG92ZXI6IGZhbHNlLFxuICAvKipcbiAgICogT3B0aW9uYWwgYWRkdGlvbmFsIGNsYXNzZXMgdG8gYXBwbHkgdG8gdGhlIHRvb2x0aXAgdGVtcGxhdGUgb24gaW5pdC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnbXktY29vbC10aXAtY2xhc3MnXG4gICAqL1xuICB0ZW1wbGF0ZUNsYXNzZXM6ICcnLFxuICAvKipcbiAgICogTm9uLW9wdGlvbmFsIGNsYXNzIGFkZGVkIHRvIHRvb2x0aXAgdGVtcGxhdGVzLiBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgJ3Rvb2x0aXAnLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICd0b29sdGlwJ1xuICAgKi9cbiAgdG9vbHRpcENsYXNzOiAndG9vbHRpcCcsXG4gIC8qKlxuICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSB0b29sdGlwIGFuY2hvciBlbGVtZW50LlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdoYXMtdGlwJ1xuICAgKi9cbiAgdHJpZ2dlckNsYXNzOiAnaGFzLXRpcCcsXG4gIC8qKlxuICAgKiBNaW5pbXVtIGJyZWFrcG9pbnQgc2l6ZSBhdCB3aGljaCB0byBvcGVuIHRoZSB0b29sdGlwLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdzbWFsbCdcbiAgICovXG4gIHNob3dPbjogJ3NtYWxsJyxcbiAgLyoqXG4gICAqIEN1c3RvbSB0ZW1wbGF0ZSB0byBiZSB1c2VkIHRvIGdlbmVyYXRlIG1hcmt1cCBmb3IgdG9vbHRpcC5cbiAgICogQG9wdGlvblxuICAgKiBAZXhhbXBsZSAnJmx0O2RpdiBjbGFzcz1cInRvb2x0aXBcIiZndDsmbHQ7L2RpdiZndDsnXG4gICAqL1xuICB0ZW1wbGF0ZTogJycsXG4gIC8qKlxuICAgKiBUZXh0IGRpc3BsYXllZCBpbiB0aGUgdG9vbHRpcCB0ZW1wbGF0ZSBvbiBvcGVuLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlICdTb21lIGNvb2wgc3BhY2UgZmFjdCBoZXJlLidcbiAgICovXG4gIHRpcFRleHQ6ICcnLFxuICB0b3VjaENsb3NlVGV4dDogJ1RhcCB0byBjbG9zZS4nLFxuICAvKipcbiAgICogQWxsb3dzIHRoZSB0b29sdGlwIHRvIHJlbWFpbiBvcGVuIGlmIHRyaWdnZXJlZCB3aXRoIGEgY2xpY2sgb3IgdG91Y2ggZXZlbnQuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgdHJ1ZVxuICAgKi9cbiAgY2xpY2tPcGVuOiB0cnVlLFxuICAvKipcbiAgICogQWRkaXRpb25hbCBwb3NpdGlvbmluZyBjbGFzc2VzLCBzZXQgYnkgdGhlIEpTXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgJ3RvcCdcbiAgICovXG4gIHBvc2l0aW9uQ2xhc3M6ICcnLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBZIGF4aXMuXG4gICAqIEBvcHRpb25cbiAgICogQGV4YW1wbGUgMTBcbiAgICovXG4gIHZPZmZzZXQ6IDEwLFxuICAvKipcbiAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIHRlbXBsYXRlIHNob3VsZCBwdXNoIGF3YXkgZnJvbSB0aGUgYW5jaG9yIG9uIHRoZSBYIGF4aXMsIGlmIGFsaWduZWQgdG8gYSBzaWRlLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIDEyXG4gICAqL1xuICBoT2Zmc2V0OiAxMixcbiAgICAvKipcbiAgICogQWxsb3cgSFRNTCBpbiB0b29sdGlwLiBXYXJuaW5nOiBJZiB5b3UgYXJlIGxvYWRpbmcgdXNlci1nZW5lcmF0ZWQgY29udGVudCBpbnRvIHRvb2x0aXBzLFxuICAgKiBhbGxvd2luZyBIVE1MIG1heSBvcGVuIHlvdXJzZWxmIHVwIHRvIFhTUyBhdHRhY2tzLlxuICAgKiBAb3B0aW9uXG4gICAqIEBleGFtcGxlIGZhbHNlXG4gICAqL1xuICBhbGxvd0h0bWw6IGZhbHNlXG59O1xuXG4vKipcbiAqIFRPRE8gdXRpbGl6ZSByZXNpemUgZXZlbnQgdHJpZ2dlclxuICovXG5cbi8vIFdpbmRvdyBleHBvcnRzXG5Gb3VuZGF0aW9uLnBsdWdpbihUb29sdGlwLCAnVG9vbHRpcCcpO1xuXG59KGpRdWVyeSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcbihmdW5jdGlvbigpIHtcbiAgaWYgKCFEYXRlLm5vdylcbiAgICBEYXRlLm5vdyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7IH07XG5cbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKytpKSB7XG4gICAgICB2YXIgdnAgPSB2ZW5kb3JzW2ldO1xuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSAod2luZG93W3ZwKydDYW5jZWxBbmltYXRpb25GcmFtZSddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCB3aW5kb3dbdnArJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddKTtcbiAgfVxuICBpZiAoL2lQKGFkfGhvbmV8b2QpLipPUyA2Ly50ZXN0KHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KVxuICAgIHx8ICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8ICF3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUpIHtcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGxhc3RUaW1lID0gbmV4dFRpbWUpOyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICBuZXh0VGltZSAtIG5vdyk7XG4gICAgfTtcbiAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG4gIH1cbn0pKCk7XG5cbnZhciBpbml0Q2xhc3NlcyAgID0gWydtdWktZW50ZXInLCAnbXVpLWxlYXZlJ107XG52YXIgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XG5cbi8vIEZpbmQgdGhlIHJpZ2h0IFwidHJhbnNpdGlvbmVuZFwiIGV2ZW50IGZvciB0aGlzIGJyb3dzZXJcbnZhciBlbmRFdmVudCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIHRyYW5zaXRpb25zID0ge1xuICAgICd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdPVHJhbnNpdGlvbic6ICdvdHJhbnNpdGlvbmVuZCdcbiAgfVxuICB2YXIgZWxlbSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBmb3IgKHZhciB0IGluIHRyYW5zaXRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtLnN0eWxlW3RdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHRyYW5zaXRpb25zW3RdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufSkoKTtcblxuZnVuY3Rpb24gYW5pbWF0ZShpc0luLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKSB7XG4gIGVsZW1lbnQgPSAkKGVsZW1lbnQpLmVxKDApO1xuXG4gIGlmICghZWxlbWVudC5sZW5ndGgpIHJldHVybjtcblxuICBpZiAoZW5kRXZlbnQgPT09IG51bGwpIHtcbiAgICBpc0luID8gZWxlbWVudC5zaG93KCkgOiBlbGVtZW50LmhpZGUoKTtcbiAgICBjYigpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBpbml0Q2xhc3MgPSBpc0luID8gaW5pdENsYXNzZXNbMF0gOiBpbml0Q2xhc3Nlc1sxXTtcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xuXG4gIC8vIFNldCB1cCB0aGUgYW5pbWF0aW9uXG4gIHJlc2V0KCk7XG4gIGVsZW1lbnQuYWRkQ2xhc3MoYW5pbWF0aW9uKTtcbiAgZWxlbWVudC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgZWxlbWVudC5hZGRDbGFzcyhpbml0Q2xhc3MpO1xuICAgIGlmIChpc0luKSBlbGVtZW50LnNob3coKTtcbiAgfSk7XG5cbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgZWxlbWVudFswXS5vZmZzZXRXaWR0aDtcbiAgICBlbGVtZW50LmNzcygndHJhbnNpdGlvbicsICcnKTtcbiAgICBlbGVtZW50LmFkZENsYXNzKGFjdGl2ZUNsYXNzKTtcbiAgfSk7XG5cbiAgLy8gQ2xlYW4gdXAgdGhlIGFuaW1hdGlvbiB3aGVuIGl0IGZpbmlzaGVzXG4gIGVsZW1lbnQub25lKCd0cmFuc2l0aW9uZW5kJywgZmluaXNoKTtcblxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXG4gIGZ1bmN0aW9uIGZpbmlzaCgpIHtcbiAgICBpZiAoIWlzSW4pIGVsZW1lbnQuaGlkZSgpO1xuICAgIHJlc2V0KCk7XG4gICAgaWYgKGNiKSBjYi5hcHBseShlbGVtZW50KTtcbiAgfVxuXG4gIC8vIFJlc2V0cyB0cmFuc2l0aW9ucyBhbmQgcmVtb3ZlcyBtb3Rpb24tc3BlY2lmaWMgY2xhc3Nlc1xuICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XG4gICAgZWxlbWVudC5yZW1vdmVDbGFzcyhpbml0Q2xhc3MgKyAnICcgKyBhY3RpdmVDbGFzcyArICcgJyArIGFuaW1hdGlvbik7XG4gIH1cbn1cblxudmFyIE1vdGlvblVJID0ge1xuICBhbmltYXRlSW46IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKHRydWUsIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpO1xuICB9LFxuXG4gIGFuaW1hdGVPdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcbiAgfVxufVxuIiwialF1ZXJ5KGRvY3VtZW50KS5mb3VuZGF0aW9uKCk7XG4iLCIvLyBKb3lyaWRlIGRlbW9cbiQoJyNzdGFydC1qcicpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAkKGRvY3VtZW50KS5mb3VuZGF0aW9uKCdqb3lyaWRlJywnc3RhcnQnKTtcbn0pOyIsIiIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdmlkZW9zID0gJCgnaWZyYW1lW3NyYyo9XCJ2aW1lby5jb21cIl0sIGlmcmFtZVtzcmMqPVwieW91dHViZS5jb21cIl0nKTtcblxuICAgIHZpZGVvcy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVsID0gJCh0aGlzKTtcbiAgICAgICAgZWwud3JhcCgnPGRpdiBjbGFzcz1cInJlc3BvbnNpdmUtZW1iZWQgd2lkZXNjcmVlblwiLz4nKTtcbiAgICB9KTtcbn0pO1xuIiwidmFyIG9uU2Nyb2xsID0gZnVuY3Rpb24oY29udGFpbmVyLCB0aGVjbGFzcywgYW1vdW50KSB7XG5cdFx0dmFyIHdyYXAgPSAkKGNvbnRhaW5lcik7XG5cdFx0JCh3aW5kb3cpLnNjcm9sbChmdW5jdGlvbigpe1xuXHRcdFx0aWYgKCQoZG9jdW1lbnQpLnNjcm9sbFRvcCgpID4gYW1vdW50KSB7XG5cdFx0XHRcdHdyYXAuYWRkQ2xhc3ModGhlY2xhc3MpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdCAgd3JhcC5yZW1vdmVDbGFzcyh0aGVjbGFzcyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cbm9uU2Nyb2xsKCcubWFpbi1uYXYtY29udGFpbmVyJywnc2V0LW5hdi1wb3NpdGlvbicsIDEgKTtcblxuXG4kKCcuY2FsbCcpLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdCQoJy5idXJnZXInKS50b2dnbGVDbGFzcygndGhleCcpO1xuXHQkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ3N0b3Atc2Nyb2xsaW5nJyk7XG59KTtcblxuJCgnLmxhbmcnKS5jbGljayhmdW5jdGlvbigpe1xuXHRpZigkKCcub3BlbicpKXtcblx0XHQkKCcubWFpbi1uYXYtY29udGFpbmVyJykuYWRkQ2xhc3MoJ2FudGktdHJhbnNwYXJlbnQtYmFja2dyb3VuZC0yMDAwJyk7XG5cdH1lbHNlIHtcblx0XHQkKCcubWFpbi1uYXYtY29udGFpbmVyJykucmVtb3ZlQ2xhc3MoJ2FudGktdHJhbnNwYXJlbnQtYmFja2dyb3VuZC0yMDAwJyk7XG5cdH1cblxufSk7XG5cbiQoJy5pcy1hY2NvcmRpb24tc3VibWVudS1wYXJlbnQnKS5jbGljayhmdW5jdGlvbigpe1xuXHQvLyAkKCdib2R5JykudG9nZ2xlQ2xhc3MoJ3N0b3Atc2Nyb2xsaW5nJyk7XG59KTtcblxuJCgnLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykubW91c2VvdmVyKGZ1bmN0aW9uKCl7XG5cdCQoJy5maXJzdC1zdWInKS5hZGRDbGFzcygnbWVudS1hbmltYXRpb24nKTtcbn0pO1xuXG4kKFwiLmNob3Nlbi1zZWxlY3RcIikuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwfSk7XG5cbi8vXG4vLyB2YXIgZWxlbSA9ICQoJy5kcm9wZG93bicpO1xuLy9cbi8vIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbihlbGVtLCBhbmltYXRpb25DbGFzcyBbLCBjYWxsYmFja10pO1xuLy8gRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dChlbGVtLCBhbmltYXRpb25DbGFzcyBbLCBjYWxsYmFja10pO1xuIiwiXG4kKHdpbmRvdykuYmluZCgnIGxvYWQgcmVzaXplIG9yaWVudGF0aW9uQ2hhbmdlICcsIGZ1bmN0aW9uICgpIHtcbiAgIHZhciBmb290ZXIgPSAkKFwiI2Zvb3Rlci1jb250YWluZXJcIik7XG4gICB2YXIgcG9zID0gZm9vdGVyLnBvc2l0aW9uKCk7XG4gICB2YXIgaGVpZ2h0ID0gJCh3aW5kb3cpLmhlaWdodCgpO1xuICAgaGVpZ2h0ID0gaGVpZ2h0IC0gcG9zLnRvcDtcbiAgIGhlaWdodCA9IGhlaWdodCAtIGZvb3Rlci5oZWlnaHQoKSAtMTtcblxuICAgZnVuY3Rpb24gc3RpY2t5Rm9vdGVyKCkge1xuICAgICBmb290ZXIuY3NzKHtcbiAgICAgICAgICdtYXJnaW4tdG9wJzogaGVpZ2h0ICsgJ3B4J1xuICAgICB9KTtcbiAgIH1cblxuICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgc3RpY2t5Rm9vdGVyKCk7XG4gICB9XG59KTtcbiJdfQ==
