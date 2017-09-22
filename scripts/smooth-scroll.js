'use strict';var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {return typeof obj;} : function (obj) {return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;}; /*!
                                                                                                                                                                                                                                                                                        * smooth-scroll v12.1.5: Animate scrolling to anchor links
                                                                                                                                                                                                                                                                                        * (c) 2017 Chris Ferdinandi
                                                                                                                                                                                                                                                                                        * MIT License
                                                                                                                                                                                                                                                                                        * http://github.com/cferdinandi/smooth-scroll
                                                                                                                                                                                                                                                                                        */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], function () {
			return factory(root);
		});
	} else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
		module.exports = factory(root);
	} else {
		root.SmoothScroll = factory(root);
	}
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : undefined, function (window) {

	'use strict';

	//
	// Feature Test
	//

	var supports =
	'querySelector' in document &&
	'addEventListener' in window &&
	'requestAnimationFrame' in window &&
	'closest' in window.Element.prototype;


	//
	// Default settings
	//

	var defaults = {
		// Selectors
		ignore: '[data-scroll-ignore]',
		header: null,

		// Speed & Easing
		speed: 500,
		offset: 0,
		easing: 'easeInOutCubic',
		customEasing: null,

		// Callback API
		before: function before() {},
		after: function after() {} };



	//
	// Utility Methods
	//

	/**
  * Merge two or more objects. Returns a new object.
  * @param {Object}   objects  The objects to merge together
  * @returns {Object}          Merged values of defaults and options
  */
	var extend = function extend() {

		// Variables
		var extended = {};
		var deep = false;
		var i = 0;
		var length = arguments.length;

		// Merge the object into the extended object
		var merge = function merge(obj) {
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					extended[prop] = obj[prop];
				}
			}
		};

		// Loop through each object and conduct a merge
		for (; i < length; i++) {
			var obj = arguments[i];
			merge(obj);
		}

		return extended;

	};

	/**
     * Get the height of an element.
     * @param  {Node} elem The element to get the height of
     * @return {Number}    The element's height in pixels
     */
	var getHeight = function getHeight(elem) {
		return parseInt(window.getComputedStyle(elem).height, 10);
	};

	/**
     * Escape special characters for use with querySelector
     * @param {String} id The anchor ID to escape
     * @author Mathias Bynens
     * @link https://github.com/mathiasbynens/CSS.escape
     */
	var escapeCharacters = function escapeCharacters(id) {

		// Remove leading hash
		if (id.charAt(0) === '#') {
			id = id.substr(1);
		}

		var string = String(id);
		var length = string.length;
		var index = -1;
		var codeUnit;
		var result = '';
		var firstCodeUnit = string.charCodeAt(0);
		while (++index < length) {
			codeUnit = string.charCodeAt(index);
			// Note: there’s no need to special-case astral symbols, surrogate
			// pairs, or lone surrogates.

			// If the character is NULL (U+0000), then throw an
			// `InvalidCharacterError` exception and terminate these steps.
			if (codeUnit === 0x0000) {
				throw new InvalidCharacterError(
				'Invalid character: the input contains U+0000.');

			}

			if (
			// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
			// U+007F, […]
			codeUnit >= 0x0001 && codeUnit <= 0x001F || codeUnit == 0x007F ||
			// If the character is the first character and is in the range [0-9]
			// (U+0030 to U+0039), […]
			index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
			// If the character is the second character and is in the range [0-9]
			// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]

			index === 1 &&
			codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
			firstCodeUnit === 0x002D)

			{
				// http://dev.w3.org/csswg/cssom/#escape-a-character-as-code-point
				result += '\\' + codeUnit.toString(16) + ' ';
				continue;
			}

			// If the character is not handled by one of the above rules and is
			// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
			// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
			// U+005A), or [a-z] (U+0061 to U+007A), […]
			if (
			codeUnit >= 0x0080 ||
			codeUnit === 0x002D ||
			codeUnit === 0x005F ||
			codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
			codeUnit >= 0x0041 && codeUnit <= 0x005A ||
			codeUnit >= 0x0061 && codeUnit <= 0x007A)
			{
				// the character itself
				result += string.charAt(index);
				continue;
			}

			// Otherwise, the escaped character.
			// http://dev.w3.org/csswg/cssom/#escape-a-character
			result += '\\' + string.charAt(index);

		}

		return '#' + result;

	};

	/**
     * Calculate the easing pattern
     * @link https://gist.github.com/gre/1650294
     * @param {String} type Easing pattern
     * @param {Number} time Time animation should take to complete
     * @returns {Number}
     */
	var easingPattern = function easingPattern(settings, time) {
		var pattern;

		// Default Easing Patterns
		if (settings.easing === 'easeInQuad') pattern = time * time; // accelerating from zero velocity
		if (settings.easing === 'easeOutQuad') pattern = time * (2 - time); // decelerating to zero velocity
		if (settings.easing === 'easeInOutQuad') pattern = time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time; // acceleration until halfway, then deceleration
		if (settings.easing === 'easeInCubic') pattern = time * time * time; // accelerating from zero velocity
		if (settings.easing === 'easeOutCubic') pattern = --time * time * time + 1; // decelerating to zero velocity
		if (settings.easing === 'easeInOutCubic') pattern = time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * (2 * time - 2) + 1; // acceleration until halfway, then deceleration
		if (settings.easing === 'easeInQuart') pattern = time * time * time * time; // accelerating from zero velocity
		if (settings.easing === 'easeOutQuart') pattern = 1 - --time * time * time * time; // decelerating to zero velocity
		if (settings.easing === 'easeInOutQuart') pattern = time < 0.5 ? 8 * time * time * time * time : 1 - 8 * --time * time * time * time; // acceleration until halfway, then deceleration
		if (settings.easing === 'easeInQuint') pattern = time * time * time * time * time; // accelerating from zero velocity
		if (settings.easing === 'easeOutQuint') pattern = 1 + --time * time * time * time * time; // decelerating to zero velocity
		if (settings.easing === 'easeInOutQuint') pattern = time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * --time * time * time * time * time; // acceleration until halfway, then deceleration

		// Custom Easing Patterns
		if (!!settings.customEasing) pattern = settings.customEasing(time);

		return pattern || time; // no easing, no acceleration
	};

	/**
     * Determine the document's height
     * @returns {Number}
     */
	var getDocumentHeight = function getDocumentHeight() {
		return Math.max(
		document.body.scrollHeight, document.documentElement.scrollHeight,
		document.body.offsetHeight, document.documentElement.offsetHeight,
		document.body.clientHeight, document.documentElement.clientHeight);

	};

	/**
     * Calculate how far to scroll
     * @param {Element} anchor The anchor element to scroll to
     * @param {Number} headerHeight Height of a fixed header, if any
     * @param {Number} offset Number of pixels by which to offset scroll
     * @returns {Number}
     */
	var getEndLocation = function getEndLocation(anchor, headerHeight, offset) {
		var location = 0;
		if (anchor.offsetParent) {
			do {
				location += anchor.offsetTop;
				anchor = anchor.offsetParent;
			} while (anchor);
		}
		location = Math.max(location - headerHeight - offset, 0);
		return location;
	};

	/**
     * Get the height of the fixed header
     * @param  {Node}   header The header
     * @return {Number}        The height of the header
     */
	var getHeaderHeight = function getHeaderHeight(header) {
		return !header ? 0 : getHeight(header) + header.offsetTop;
	};

	/**
     * Bring the anchored element into focus
     * @param {Node}     anchor      The anchor element
     * @param {Number}   endLocation The end location to scroll to
     * @param {Boolean}  isNum       If true, scroll is to a position rather than an element
     */
	var adjustFocus = function adjustFocus(anchor, endLocation, isNum) {

		// Don't run if scrolling to a number on the page
		if (isNum) return;

		// Otherwise, bring anchor element into focus
		anchor.focus();
		if (document.activeElement.id !== anchor.id) {
			anchor.setAttribute('tabindex', '-1');
			anchor.focus();
			anchor.style.outline = 'none';
		}
		window.scrollTo(0, endLocation);

	};

	/**
     * Check to see if user prefers reduced motion
     * @param  {Object} settings Script settings
     */
	var reduceMotion = function reduceMotion(settings) {
		if ('matchMedia' in window && window.matchMedia('(prefers-reduced-motion)').matches) {
			return true;
		}
		return false;
	};


	//
	// SmoothScroll Constructor
	//

	var SmoothScroll = function SmoothScroll(selector, options) {

		//
		// Variables
		//

		var smoothScroll = {}; // Object for public APIs
		var settings, anchor, toggle, fixedHeader, headerHeight, eventTimeout, animationInterval;


		//
		// Methods
		//

		/**
   * Cancel a scroll-in-progress
   */
		smoothScroll.cancelScroll = function () {
			// clearInterval(animationInterval);
			cancelAnimationFrame(animationInterval);
		};

		/**
      * Start/stop the scrolling animation
      * @param {Node|Number} anchor  The element or position to scroll to
      * @param {Element}     toggle  The element that toggled the scroll event
      * @param {Object}      options
      */
		smoothScroll.animateScroll = function (anchor, toggle, options) {

			// Local settings
			var animateSettings = extend(settings || defaults, options || {}); // Merge user options with defaults

			// Selectors and variables
			var isNum = Object.prototype.toString.call(anchor) === '[object Number]' ? true : false;
			var anchorElem = isNum || !anchor.tagName ? null : anchor;
			if (!isNum && !anchorElem) return;
			var startLocation = window.pageYOffset; // Current location on the page
			if (animateSettings.header && !fixedHeader) {
				// Get the fixed header if not already set
				fixedHeader = document.querySelector(animateSettings.header);
			}
			if (!headerHeight) {
				// Get the height of a fixed header if one exists and not already set
				headerHeight = getHeaderHeight(fixedHeader);
			}
			var endLocation = isNum ? anchor : getEndLocation(anchorElem, headerHeight, parseInt(typeof animateSettings.offset === 'function' ? animateSettings.offset() : animateSettings.offset, 10)); // Location to scroll to
			var distance = endLocation - startLocation; // distance to travel
			var documentHeight = getDocumentHeight();
			var timeLapsed = 0;
			var start, percentage, position;

			/**
                                     * Stop the scroll animation when it reaches its target (or the bottom/top of page)
                                     * @param {Number} position Current position on the page
                                     * @param {Number} endLocation Scroll to location
                                     * @param {Number} animationInterval How much to scroll on this loop
                                     */
			var stopAnimateScroll = function stopAnimateScroll(position, endLocation) {

				// Get the current location
				var currentLocation = window.pageYOffset;

				// Check if the end location has been reached yet (or we've hit the end of the document)
				if (position == endLocation || currentLocation == endLocation || (startLocation < endLocation && window.innerHeight + currentLocation) >= documentHeight) {

					// Clear the animation timer
					smoothScroll.cancelScroll();

					// Bring the anchored element into focus
					adjustFocus(anchor, endLocation, isNum);

					// Run callback after animation complete
					animateSettings.after(anchor, toggle);

					// Reset start
					start = null;

					return true;

				}
			};

			/**
       * Loop scrolling animation
       */
			var loopAnimateScroll = function loopAnimateScroll(timestamp) {
				if (!start) {start = timestamp;}
				timeLapsed += timestamp - start;
				percentage = timeLapsed / parseInt(animateSettings.speed, 10);
				percentage = percentage > 1 ? 1 : percentage;
				position = startLocation + distance * easingPattern(animateSettings, percentage);
				window.scrollTo(0, Math.floor(position));
				if (!stopAnimateScroll(position, endLocation)) {
					window.requestAnimationFrame(loopAnimateScroll);
					start = timestamp;
				}
			};

			/**
       * Reset position to fix weird iOS bug
       * @link https://github.com/cferdinandi/smooth-scroll/issues/45
       */
			if (window.pageYOffset === 0) {
				window.scrollTo(0, 0);
			}

			// Run callback before animation starts
			animateSettings.before(anchor, toggle);

			// Start scrolling animation
			smoothScroll.cancelScroll();
			window.requestAnimationFrame(loopAnimateScroll);


		};

		/**
      * Handle has change event
      */
		var hashChangeHandler = function hashChangeHandler(event) {

			// Only run if there's an anchor element to scroll to
			if (!anchor) return;

			// Reset the anchor element's ID
			anchor.id = anchor.getAttribute('data-scroll-id');

			// Scroll to the anchored content
			smoothScroll.animateScroll(anchor, toggle);

			// Reset anchor and toggle
			anchor = null;
			toggle = null;

		};

		/**
      * If smooth scroll element clicked, animate scroll
      */
		var clickHandler = function clickHandler(event) {

			// Don't run if the user prefers reduced motion
			if (reduceMotion(settings)) return;

			// Don't run if right-click or command/control + click
			if (event.button !== 0 || event.metaKey || event.ctrlKey) return;

			// Check if a smooth scroll link was clicked
			toggle = event.target.closest(selector);
			if (!toggle || toggle.tagName.toLowerCase() !== 'a' || event.target.closest(settings.ignore)) return;

			// Only run if link is an anchor and points to the current page
			if (toggle.hostname !== window.location.hostname || toggle.pathname !== window.location.pathname || !/#/.test(toggle.href)) return;

			// Get the sanitized hash
			var hash;
			try {
				hash = escapeCharacters(decodeURIComponent(toggle.hash));
			} catch (e) {
				hash = escapeCharacters(toggle.hash);
			}

			// If the hash is empty, scroll to the top of the page
			if (hash === '#') {

				// Prevent default link behavior
				event.preventDefault();

				// Set the anchored element
				anchor = document.body;

				// Save or create the ID as a data attribute and remove it (prevents scroll jump)
				var id = anchor.id ? anchor.id : 'smooth-scroll-top';
				anchor.setAttribute('data-scroll-id', id);
				anchor.id = '';

				// If no hash change event will happen, fire manually
				// Otherwise, update the hash
				if (window.location.hash.substring(1) === id) {
					hashChangeHandler();
				} else {
					window.location.hash = id;
				}

				return;

			}

			// Get the anchored element
			anchor = document.querySelector(hash);

			// If anchored element exists, save the ID as a data attribute and remove it (prevents scroll jump)
			if (!anchor) return;
			anchor.setAttribute('data-scroll-id', anchor.id);
			anchor.id = '';

			// If no hash change event will happen, fire manually
			if (toggle.hash === window.location.hash) {
				event.preventDefault();
				hashChangeHandler();
			}

		};

		/**
      * On window scroll and resize, only run events at a rate of 15fps for better performance
      */
		var resizeThrottler = function resizeThrottler(event) {
			if (!eventTimeout) {
				eventTimeout = setTimeout(function () {
					eventTimeout = null; // Reset timeout
					headerHeight = getHeaderHeight(fixedHeader); // Get the height of a fixed header if one exists
				}, 66);
			}
		};

		/**
      * Destroy the current initialization.
      */
		smoothScroll.destroy = function () {

			// If plugin isn't already initialized, stop
			if (!settings) return;

			// Remove event listeners
			document.removeEventListener('click', clickHandler, false);
			window.removeEventListener('resize', resizeThrottler, false);

			// Cancel any scrolls-in-progress
			smoothScroll.cancelScroll();

			// Reset variables
			settings = null;
			anchor = null;
			toggle = null;
			fixedHeader = null;
			headerHeight = null;
			eventTimeout = null;
			animationInterval = null;
		};

		/**
      * Initialize Smooth Scroll
      * @param {Object} options User settings
      */
		smoothScroll.init = function (options) {

			// feature test
			if (!supports) return;

			// Destroy any existing initializations
			smoothScroll.destroy();

			// Selectors and variables
			settings = extend(defaults, options || {}); // Merge user options with defaults
			fixedHeader = settings.header ? document.querySelector(settings.header) : null; // Get the fixed header
			headerHeight = getHeaderHeight(fixedHeader);

			// When a toggle is clicked, run the click handler
			document.addEventListener('click', clickHandler, false);

			// Listen for hash changes
			window.addEventListener('hashchange', hashChangeHandler, false);

			// If window is resized and there's a fixed header, recalculate its size
			if (fixedHeader) {
				window.addEventListener('resize', resizeThrottler, false);
			}

		};


		//
		// Initialize plugin
		//

		smoothScroll.init(options);


		//
		// Public APIs
		//

		return smoothScroll;

	};

	return SmoothScroll;

});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNtb290aC1zY3JvbGwuanMiXSwibmFtZXMiOlsicm9vdCIsImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJleHBvcnRzIiwibW9kdWxlIiwiU21vb3RoU2Nyb2xsIiwiZ2xvYmFsIiwid2luZG93Iiwic3VwcG9ydHMiLCJkb2N1bWVudCIsIkVsZW1lbnQiLCJwcm90b3R5cGUiLCJkZWZhdWx0cyIsImlnbm9yZSIsImhlYWRlciIsInNwZWVkIiwib2Zmc2V0IiwiZWFzaW5nIiwiY3VzdG9tRWFzaW5nIiwiYmVmb3JlIiwiYWZ0ZXIiLCJleHRlbmQiLCJleHRlbmRlZCIsImRlZXAiLCJpIiwibGVuZ3RoIiwiYXJndW1lbnRzIiwibWVyZ2UiLCJvYmoiLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJnZXRIZWlnaHQiLCJlbGVtIiwicGFyc2VJbnQiLCJnZXRDb21wdXRlZFN0eWxlIiwiaGVpZ2h0IiwiZXNjYXBlQ2hhcmFjdGVycyIsImlkIiwiY2hhckF0Iiwic3Vic3RyIiwic3RyaW5nIiwiU3RyaW5nIiwiaW5kZXgiLCJjb2RlVW5pdCIsInJlc3VsdCIsImZpcnN0Q29kZVVuaXQiLCJjaGFyQ29kZUF0IiwiSW52YWxpZENoYXJhY3RlckVycm9yIiwidG9TdHJpbmciLCJlYXNpbmdQYXR0ZXJuIiwic2V0dGluZ3MiLCJ0aW1lIiwicGF0dGVybiIsImdldERvY3VtZW50SGVpZ2h0IiwiTWF0aCIsIm1heCIsImJvZHkiLCJzY3JvbGxIZWlnaHQiLCJkb2N1bWVudEVsZW1lbnQiLCJvZmZzZXRIZWlnaHQiLCJjbGllbnRIZWlnaHQiLCJnZXRFbmRMb2NhdGlvbiIsImFuY2hvciIsImhlYWRlckhlaWdodCIsImxvY2F0aW9uIiwib2Zmc2V0UGFyZW50Iiwib2Zmc2V0VG9wIiwiZ2V0SGVhZGVySGVpZ2h0IiwiYWRqdXN0Rm9jdXMiLCJlbmRMb2NhdGlvbiIsImlzTnVtIiwiZm9jdXMiLCJhY3RpdmVFbGVtZW50Iiwic2V0QXR0cmlidXRlIiwic3R5bGUiLCJvdXRsaW5lIiwic2Nyb2xsVG8iLCJyZWR1Y2VNb3Rpb24iLCJtYXRjaE1lZGlhIiwibWF0Y2hlcyIsInNlbGVjdG9yIiwib3B0aW9ucyIsInNtb290aFNjcm9sbCIsInRvZ2dsZSIsImZpeGVkSGVhZGVyIiwiZXZlbnRUaW1lb3V0IiwiYW5pbWF0aW9uSW50ZXJ2YWwiLCJjYW5jZWxTY3JvbGwiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsImFuaW1hdGVTY3JvbGwiLCJhbmltYXRlU2V0dGluZ3MiLCJPYmplY3QiLCJjYWxsIiwiYW5jaG9yRWxlbSIsInRhZ05hbWUiLCJzdGFydExvY2F0aW9uIiwicGFnZVlPZmZzZXQiLCJxdWVyeVNlbGVjdG9yIiwiZGlzdGFuY2UiLCJkb2N1bWVudEhlaWdodCIsInRpbWVMYXBzZWQiLCJzdGFydCIsInBlcmNlbnRhZ2UiLCJwb3NpdGlvbiIsInN0b3BBbmltYXRlU2Nyb2xsIiwiY3VycmVudExvY2F0aW9uIiwiaW5uZXJIZWlnaHQiLCJsb29wQW5pbWF0ZVNjcm9sbCIsInRpbWVzdGFtcCIsImZsb29yIiwicmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwiaGFzaENoYW5nZUhhbmRsZXIiLCJldmVudCIsImdldEF0dHJpYnV0ZSIsImNsaWNrSGFuZGxlciIsImJ1dHRvbiIsIm1ldGFLZXkiLCJjdHJsS2V5IiwidGFyZ2V0IiwiY2xvc2VzdCIsInRvTG93ZXJDYXNlIiwiaG9zdG5hbWUiLCJwYXRobmFtZSIsInRlc3QiLCJocmVmIiwiaGFzaCIsImRlY29kZVVSSUNvbXBvbmVudCIsImUiLCJwcmV2ZW50RGVmYXVsdCIsInN1YnN0cmluZyIsInJlc2l6ZVRocm90dGxlciIsInNldFRpbWVvdXQiLCJkZXN0cm95IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImluaXQiLCJhZGRFdmVudExpc3RlbmVyIl0sIm1hcHBpbmdzIjoidVJBQUE7Ozs7Ozs7QUFPQSxDQUFDLFVBQVVBLElBQVYsRUFBZ0JDLE9BQWhCLEVBQXlCO0FBQ3pCLEtBQUssT0FBT0MsTUFBUCxLQUFrQixVQUFsQixJ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QTtBQUNBO0FBQ0E7O0FBRUEsU0FBT0MsWUFBUDs7QUFFQSxFQTlSRDs7QUFnU0EsUUFBTzdFLFlBQVA7O0FBRUEsQ0F4akJEIiwiZmlsZSI6InNtb290aC1zY3JvbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIHNtb290aC1zY3JvbGwgdjEyLjEuNTogQW5pbWF0ZSBzY3JvbGxpbmcgdG8gYW5jaG9yIGxpbmtzXG4gKiAoYykgMjAxNyBDaHJpcyBGZXJkaW5hbmRpXG4gKiBNSVQgTGljZW5zZVxuICogaHR0cDovL2dpdGh1Yi5jb20vY2ZlcmRpbmFuZGkvc21vb3RoLXNjcm9sbFxuICovXG5cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHRpZiAoIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCApIHtcblx0XHRkZWZpbmUoW10sIChmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gZmFjdG9yeShyb290KTtcblx0XHR9KSk7XG5cdH0gZWxzZSBpZiAoIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyApIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3Rvcnkocm9vdCk7XG5cdH0gZWxzZSB7XG5cdFx0cm9vdC5TbW9vdGhTY3JvbGwgPSBmYWN0b3J5KHJvb3QpO1xuXHR9XG59KSh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDogdGhpcywgKGZ1bmN0aW9uICh3aW5kb3cpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0Ly9cblx0Ly8gRmVhdHVyZSBUZXN0XG5cdC8vXG5cblx0dmFyIHN1cHBvcnRzID1cblx0XHQncXVlcnlTZWxlY3RvcicgaW4gZG9jdW1lbnQgJiZcblx0XHQnYWRkRXZlbnRMaXN0ZW5lcicgaW4gd2luZG93ICYmXG5cdFx0J3JlcXVlc3RBbmltYXRpb25GcmFtZScgaW4gd2luZG93ICYmXG5cdFx0J2Nsb3Nlc3QnIGluIHdpbmRvdy5FbGVtZW50LnByb3RvdHlwZTtcblxuXG5cdC8vXG5cdC8vIERlZmF1bHQgc2V0dGluZ3Ncblx0Ly9cblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Ly8gU2VsZWN0b3JzXG5cdFx0aWdub3JlOiAnW2RhdGEtc2Nyb2xsLWlnbm9yZV0nLFxuXHRcdGhlYWRlcjogbnVsbCxcblxuXHRcdC8vIFNwZWVkICYgRWFzaW5nXG5cdFx0c3BlZWQ6IDUwMCxcblx0XHRvZmZzZXQ6IDAsXG5cdFx0ZWFzaW5nOiAnZWFzZUluT3V0Q3ViaWMnLFxuXHRcdGN1c3RvbUVhc2luZzogbnVsbCxcblxuXHRcdC8vIENhbGxiYWNrIEFQSVxuXHRcdGJlZm9yZTogZnVuY3Rpb24gKCkge30sXG5cdFx0YWZ0ZXI6IGZ1bmN0aW9uICgpIHt9XG5cdH07XG5cblxuXHQvL1xuXHQvLyBVdGlsaXR5IE1ldGhvZHNcblx0Ly9cblxuXHQvKipcblx0ICogTWVyZ2UgdHdvIG9yIG1vcmUgb2JqZWN0cy4gUmV0dXJucyBhIG5ldyBvYmplY3QuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSAgIG9iamVjdHMgIFRoZSBvYmplY3RzIHRvIG1lcmdlIHRvZ2V0aGVyXG5cdCAqIEByZXR1cm5zIHtPYmplY3R9ICAgICAgICAgIE1lcmdlZCB2YWx1ZXMgb2YgZGVmYXVsdHMgYW5kIG9wdGlvbnNcblx0ICovXG5cdHZhciBleHRlbmQgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyBWYXJpYWJsZXNcblx0XHR2YXIgZXh0ZW5kZWQgPSB7fTtcblx0XHR2YXIgZGVlcCA9IGZhbHNlO1xuXHRcdHZhciBpID0gMDtcblx0XHR2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdC8vIE1lcmdlIHRoZSBvYmplY3QgaW50byB0aGUgZXh0ZW5kZWQgb2JqZWN0XG5cdFx0dmFyIG1lcmdlID0gZnVuY3Rpb24gKG9iaikge1xuXHRcdFx0Zm9yICh2YXIgcHJvcCBpbiBvYmopIHtcblx0XHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuXHRcdFx0XHRcdGV4dGVuZGVkW3Byb3BdID0gb2JqW3Byb3BdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdC8vIExvb3AgdGhyb3VnaCBlYWNoIG9iamVjdCBhbmQgY29uZHVjdCBhIG1lcmdlXG5cdFx0Zm9yICggOyBpIDwgbGVuZ3RoOyBpKysgKSB7XG5cdFx0XHR2YXIgb2JqID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0bWVyZ2Uob2JqKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZXh0ZW5kZWQ7XG5cblx0fTtcblxuXHQvKipcblx0ICogR2V0IHRoZSBoZWlnaHQgb2YgYW4gZWxlbWVudC5cblx0ICogQHBhcmFtICB7Tm9kZX0gZWxlbSBUaGUgZWxlbWVudCB0byBnZXQgdGhlIGhlaWdodCBvZlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgIFRoZSBlbGVtZW50J3MgaGVpZ2h0IGluIHBpeGVsc1xuXHQgKi9cblx0dmFyIGdldEhlaWdodCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pLmhlaWdodCwgMTApO1xuXHR9O1xuXG5cdC8qKlxuXHQgKiBFc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIGZvciB1c2Ugd2l0aCBxdWVyeVNlbGVjdG9yXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpZCBUaGUgYW5jaG9yIElEIHRvIGVzY2FwZVxuXHQgKiBAYXV0aG9yIE1hdGhpYXMgQnluZW5zXG5cdCAqIEBsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXRoaWFzYnluZW5zL0NTUy5lc2NhcGVcblx0ICovXG5cdHZhciBlc2NhcGVDaGFyYWN0ZXJzID0gZnVuY3Rpb24gKGlkKSB7XG5cblx0XHQvLyBSZW1vdmUgbGVhZGluZyBoYXNoXG5cdFx0aWYgKGlkLmNoYXJBdCgwKSA9PT0gJyMnKSB7XG5cdFx0XHRpZCA9IGlkLnN1YnN0cigxKTtcblx0XHR9XG5cblx0XHR2YXIgc3RyaW5nID0gU3RyaW5nKGlkKTtcblx0XHR2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcblx0XHR2YXIgaW5kZXggPSAtMTtcblx0XHR2YXIgY29kZVVuaXQ7XG5cdFx0dmFyIHJlc3VsdCA9ICcnO1xuXHRcdHZhciBmaXJzdENvZGVVbml0ID0gc3RyaW5nLmNoYXJDb2RlQXQoMCk7XG5cdFx0d2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcblx0XHRcdGNvZGVVbml0ID0gc3RyaW5nLmNoYXJDb2RlQXQoaW5kZXgpO1xuXHRcdFx0Ly8gTm90ZTogdGhlcmXigJlzIG5vIG5lZWQgdG8gc3BlY2lhbC1jYXNlIGFzdHJhbCBzeW1ib2xzLCBzdXJyb2dhdGVcblx0XHRcdC8vIHBhaXJzLCBvciBsb25lIHN1cnJvZ2F0ZXMuXG5cblx0XHRcdC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgTlVMTCAoVSswMDAwKSwgdGhlbiB0aHJvdyBhblxuXHRcdFx0Ly8gYEludmFsaWRDaGFyYWN0ZXJFcnJvcmAgZXhjZXB0aW9uIGFuZCB0ZXJtaW5hdGUgdGhlc2Ugc3RlcHMuXG5cdFx0XHRpZiAoY29kZVVuaXQgPT09IDB4MDAwMCkge1xuXHRcdFx0XHR0aHJvdyBuZXcgSW52YWxpZENoYXJhY3RlckVycm9yKFxuXHRcdFx0XHRcdCdJbnZhbGlkIGNoYXJhY3RlcjogdGhlIGlucHV0IGNvbnRhaW5zIFUrMDAwMC4nXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChcblx0XHRcdFx0Ly8gSWYgdGhlIGNoYXJhY3RlciBpcyBpbiB0aGUgcmFuZ2UgW1xcMS1cXDFGXSAoVSswMDAxIHRvIFUrMDAxRikgb3IgaXNcblx0XHRcdFx0Ly8gVSswMDdGLCBb4oCmXVxuXHRcdFx0XHQoY29kZVVuaXQgPj0gMHgwMDAxICYmIGNvZGVVbml0IDw9IDB4MDAxRikgfHwgY29kZVVuaXQgPT0gMHgwMDdGIHx8XG5cdFx0XHRcdC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgdGhlIGZpcnN0IGNoYXJhY3RlciBhbmQgaXMgaW4gdGhlIHJhbmdlIFswLTldXG5cdFx0XHRcdC8vIChVKzAwMzAgdG8gVSswMDM5KSwgW+KApl1cblx0XHRcdFx0KGluZGV4ID09PSAwICYmIGNvZGVVbml0ID49IDB4MDAzMCAmJiBjb2RlVW5pdCA8PSAweDAwMzkpIHx8XG5cdFx0XHRcdC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgdGhlIHNlY29uZCBjaGFyYWN0ZXIgYW5kIGlzIGluIHRoZSByYW5nZSBbMC05XVxuXHRcdFx0XHQvLyAoVSswMDMwIHRvIFUrMDAzOSkgYW5kIHRoZSBmaXJzdCBjaGFyYWN0ZXIgaXMgYSBgLWAgKFUrMDAyRCksIFvigKZdXG5cdFx0XHRcdChcblx0XHRcdFx0XHRpbmRleCA9PT0gMSAmJlxuXHRcdFx0XHRcdGNvZGVVbml0ID49IDB4MDAzMCAmJiBjb2RlVW5pdCA8PSAweDAwMzkgJiZcblx0XHRcdFx0XHRmaXJzdENvZGVVbml0ID09PSAweDAwMkRcblx0XHRcdFx0KVxuXHRcdFx0KSB7XG5cdFx0XHRcdC8vIGh0dHA6Ly9kZXYudzMub3JnL2Nzc3dnL2Nzc29tLyNlc2NhcGUtYS1jaGFyYWN0ZXItYXMtY29kZS1wb2ludFxuXHRcdFx0XHRyZXN1bHQgKz0gJ1xcXFwnICsgY29kZVVuaXQudG9TdHJpbmcoMTYpICsgJyAnO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgdGhlIGNoYXJhY3RlciBpcyBub3QgaGFuZGxlZCBieSBvbmUgb2YgdGhlIGFib3ZlIHJ1bGVzIGFuZCBpc1xuXHRcdFx0Ly8gZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFUrMDA4MCwgaXMgYC1gIChVKzAwMkQpIG9yIGBfYCAoVSswMDVGKSwgb3Jcblx0XHRcdC8vIGlzIGluIG9uZSBvZiB0aGUgcmFuZ2VzIFswLTldIChVKzAwMzAgdG8gVSswMDM5KSwgW0EtWl0gKFUrMDA0MSB0b1xuXHRcdFx0Ly8gVSswMDVBKSwgb3IgW2Etel0gKFUrMDA2MSB0byBVKzAwN0EpLCBb4oCmXVxuXHRcdFx0aWYgKFxuXHRcdFx0XHRjb2RlVW5pdCA+PSAweDAwODAgfHxcblx0XHRcdFx0Y29kZVVuaXQgPT09IDB4MDAyRCB8fFxuXHRcdFx0XHRjb2RlVW5pdCA9PT0gMHgwMDVGIHx8XG5cdFx0XHRcdGNvZGVVbml0ID49IDB4MDAzMCAmJiBjb2RlVW5pdCA8PSAweDAwMzkgfHxcblx0XHRcdFx0Y29kZVVuaXQgPj0gMHgwMDQxICYmIGNvZGVVbml0IDw9IDB4MDA1QSB8fFxuXHRcdFx0XHRjb2RlVW5pdCA+PSAweDAwNjEgJiYgY29kZVVuaXQgPD0gMHgwMDdBXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gdGhlIGNoYXJhY3RlciBpdHNlbGZcblx0XHRcdFx0cmVzdWx0ICs9IHN0cmluZy5jaGFyQXQoaW5kZXgpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gT3RoZXJ3aXNlLCB0aGUgZXNjYXBlZCBjaGFyYWN0ZXIuXG5cdFx0XHQvLyBodHRwOi8vZGV2LnczLm9yZy9jc3N3Zy9jc3NvbS8jZXNjYXBlLWEtY2hhcmFjdGVyXG5cdFx0XHRyZXN1bHQgKz0gJ1xcXFwnICsgc3RyaW5nLmNoYXJBdChpbmRleCk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gJyMnICsgcmVzdWx0O1xuXG5cdH07XG5cblx0LyoqXG5cdCAqIENhbGN1bGF0ZSB0aGUgZWFzaW5nIHBhdHRlcm5cblx0ICogQGxpbmsgaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ3JlLzE2NTAyOTRcblx0ICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgRWFzaW5nIHBhdHRlcm5cblx0ICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgVGltZSBhbmltYXRpb24gc2hvdWxkIHRha2UgdG8gY29tcGxldGVcblx0ICogQHJldHVybnMge051bWJlcn1cblx0ICovXG5cdHZhciBlYXNpbmdQYXR0ZXJuID0gZnVuY3Rpb24gKHNldHRpbmdzLCB0aW1lKSB7XG5cdFx0dmFyIHBhdHRlcm47XG5cblx0XHQvLyBEZWZhdWx0IEVhc2luZyBQYXR0ZXJuc1xuXHRcdGlmIChzZXR0aW5ncy5lYXNpbmcgPT09ICdlYXNlSW5RdWFkJykgcGF0dGVybiA9IHRpbWUgKiB0aW1lOyAvLyBhY2NlbGVyYXRpbmcgZnJvbSB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKHNldHRpbmdzLmVhc2luZyA9PT0gJ2Vhc2VPdXRRdWFkJykgcGF0dGVybiA9IHRpbWUgKiAoMiAtIHRpbWUpOyAvLyBkZWNlbGVyYXRpbmcgdG8gemVybyB2ZWxvY2l0eVxuXHRcdGlmIChzZXR0aW5ncy5lYXNpbmcgPT09ICdlYXNlSW5PdXRRdWFkJykgcGF0dGVybiA9IHRpbWUgPCAwLjUgPyAyICogdGltZSAqIHRpbWUgOiAtMSArICg0IC0gMiAqIHRpbWUpICogdGltZTsgLy8gYWNjZWxlcmF0aW9uIHVudGlsIGhhbGZ3YXksIHRoZW4gZGVjZWxlcmF0aW9uXG5cdFx0aWYgKHNldHRpbmdzLmVhc2luZyA9PT0gJ2Vhc2VJbkN1YmljJykgcGF0dGVybiA9IHRpbWUgKiB0aW1lICogdGltZTsgLy8gYWNjZWxlcmF0aW5nIGZyb20gemVybyB2ZWxvY2l0eVxuXHRcdGlmIChzZXR0aW5ncy5lYXNpbmcgPT09ICdlYXNlT3V0Q3ViaWMnKSBwYXR0ZXJuID0gKC0tdGltZSkgKiB0aW1lICogdGltZSArIDE7IC8vIGRlY2VsZXJhdGluZyB0byB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKHNldHRpbmdzLmVhc2luZyA9PT0gJ2Vhc2VJbk91dEN1YmljJykgcGF0dGVybiA9IHRpbWUgPCAwLjUgPyA0ICogdGltZSAqIHRpbWUgKiB0aW1lIDogKHRpbWUgLSAxKSAqICgyICogdGltZSAtIDIpICogKDIgKiB0aW1lIC0gMikgKyAxOyAvLyBhY2NlbGVyYXRpb24gdW50aWwgaGFsZndheSwgdGhlbiBkZWNlbGVyYXRpb25cblx0XHRpZiAoc2V0dGluZ3MuZWFzaW5nID09PSAnZWFzZUluUXVhcnQnKSBwYXR0ZXJuID0gdGltZSAqIHRpbWUgKiB0aW1lICogdGltZTsgLy8gYWNjZWxlcmF0aW5nIGZyb20gemVybyB2ZWxvY2l0eVxuXHRcdGlmIChzZXR0aW5ncy5lYXNpbmcgPT09ICdlYXNlT3V0UXVhcnQnKSBwYXR0ZXJuID0gMSAtICgtLXRpbWUpICogdGltZSAqIHRpbWUgKiB0aW1lOyAvLyBkZWNlbGVyYXRpbmcgdG8gemVybyB2ZWxvY2l0eVxuXHRcdGlmIChzZXR0aW5ncy5lYXNpbmcgPT09ICdlYXNlSW5PdXRRdWFydCcpIHBhdHRlcm4gPSB0aW1lIDwgMC41ID8gOCAqIHRpbWUgKiB0aW1lICogdGltZSAqIHRpbWUgOiAxIC0gOCAqICgtLXRpbWUpICogdGltZSAqIHRpbWUgKiB0aW1lOyAvLyBhY2NlbGVyYXRpb24gdW50aWwgaGFsZndheSwgdGhlbiBkZWNlbGVyYXRpb25cblx0XHRpZiAoc2V0dGluZ3MuZWFzaW5nID09PSAnZWFzZUluUXVpbnQnKSBwYXR0ZXJuID0gdGltZSAqIHRpbWUgKiB0aW1lICogdGltZSAqIHRpbWU7IC8vIGFjY2VsZXJhdGluZyBmcm9tIHplcm8gdmVsb2NpdHlcblx0XHRpZiAoc2V0dGluZ3MuZWFzaW5nID09PSAnZWFzZU91dFF1aW50JykgcGF0dGVybiA9IDEgKyAoLS10aW1lKSAqIHRpbWUgKiB0aW1lICogdGltZSAqIHRpbWU7IC8vIGRlY2VsZXJhdGluZyB0byB6ZXJvIHZlbG9jaXR5XG5cdFx0aWYgKHNldHRpbmdzLmVhc2luZyA9PT0gJ2Vhc2VJbk91dFF1aW50JykgcGF0dGVybiA9IHRpbWUgPCAwLjUgPyAxNiAqIHRpbWUgKiB0aW1lICogdGltZSAqIHRpbWUgKiB0aW1lIDogMSArIDE2ICogKC0tdGltZSkgKiB0aW1lICogdGltZSAqIHRpbWUgKiB0aW1lOyAvLyBhY2NlbGVyYXRpb24gdW50aWwgaGFsZndheSwgdGhlbiBkZWNlbGVyYXRpb25cblxuXHRcdC8vIEN1c3RvbSBFYXNpbmcgUGF0dGVybnNcblx0XHRpZiAoISFzZXR0aW5ncy5jdXN0b21FYXNpbmcpIHBhdHRlcm4gPSBzZXR0aW5ncy5jdXN0b21FYXNpbmcodGltZSk7XG5cblx0XHRyZXR1cm4gcGF0dGVybiB8fCB0aW1lOyAvLyBubyBlYXNpbmcsIG5vIGFjY2VsZXJhdGlvblxuXHR9O1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgdGhlIGRvY3VtZW50J3MgaGVpZ2h0XG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9XG5cdCAqL1xuXHR2YXIgZ2V0RG9jdW1lbnRIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIE1hdGgubWF4KFxuXHRcdFx0ZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQsIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxIZWlnaHQsXG5cdFx0XHRkb2N1bWVudC5ib2R5Lm9mZnNldEhlaWdodCwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodCxcblx0XHRcdGRvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0LCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG5cdFx0KTtcblx0fTtcblxuXHQvKipcblx0ICogQ2FsY3VsYXRlIGhvdyBmYXIgdG8gc2Nyb2xsXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gYW5jaG9yIFRoZSBhbmNob3IgZWxlbWVudCB0byBzY3JvbGwgdG9cblx0ICogQHBhcmFtIHtOdW1iZXJ9IGhlYWRlckhlaWdodCBIZWlnaHQgb2YgYSBmaXhlZCBoZWFkZXIsIGlmIGFueVxuXHQgKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBwaXhlbHMgYnkgd2hpY2ggdG8gb2Zmc2V0IHNjcm9sbFxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfVxuXHQgKi9cblx0dmFyIGdldEVuZExvY2F0aW9uID0gZnVuY3Rpb24gKGFuY2hvciwgaGVhZGVySGVpZ2h0LCBvZmZzZXQpIHtcblx0XHR2YXIgbG9jYXRpb24gPSAwO1xuXHRcdGlmIChhbmNob3Iub2Zmc2V0UGFyZW50KSB7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGxvY2F0aW9uICs9IGFuY2hvci5vZmZzZXRUb3A7XG5cdFx0XHRcdGFuY2hvciA9IGFuY2hvci5vZmZzZXRQYXJlbnQ7XG5cdFx0XHR9IHdoaWxlIChhbmNob3IpO1xuXHRcdH1cblx0XHRsb2NhdGlvbiA9IE1hdGgubWF4KGxvY2F0aW9uIC0gaGVhZGVySGVpZ2h0IC0gb2Zmc2V0LCAwKTtcblx0XHRyZXR1cm4gbG9jYXRpb247XG5cdH07XG5cblx0LyoqXG5cdCAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXhlZCBoZWFkZXJcblx0ICogQHBhcmFtICB7Tm9kZX0gICBoZWFkZXIgVGhlIGhlYWRlclxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9ICAgICAgICBUaGUgaGVpZ2h0IG9mIHRoZSBoZWFkZXJcblx0ICovXG5cdHZhciBnZXRIZWFkZXJIZWlnaHQgPSBmdW5jdGlvbiAoaGVhZGVyKSB7XG5cdFx0cmV0dXJuICFoZWFkZXIgPyAwIDogKGdldEhlaWdodChoZWFkZXIpICsgaGVhZGVyLm9mZnNldFRvcCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEJyaW5nIHRoZSBhbmNob3JlZCBlbGVtZW50IGludG8gZm9jdXNcblx0ICogQHBhcmFtIHtOb2RlfSAgICAgYW5jaG9yICAgICAgVGhlIGFuY2hvciBlbGVtZW50XG5cdCAqIEBwYXJhbSB7TnVtYmVyfSAgIGVuZExvY2F0aW9uIFRoZSBlbmQgbG9jYXRpb24gdG8gc2Nyb2xsIHRvXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gIGlzTnVtICAgICAgIElmIHRydWUsIHNjcm9sbCBpcyB0byBhIHBvc2l0aW9uIHJhdGhlciB0aGFuIGFuIGVsZW1lbnRcblx0ICovXG5cdHZhciBhZGp1c3RGb2N1cyA9IGZ1bmN0aW9uIChhbmNob3IsIGVuZExvY2F0aW9uLCBpc051bSkge1xuXG5cdFx0Ly8gRG9uJ3QgcnVuIGlmIHNjcm9sbGluZyB0byBhIG51bWJlciBvbiB0aGUgcGFnZVxuXHRcdGlmIChpc051bSkgcmV0dXJuO1xuXG5cdFx0Ly8gT3RoZXJ3aXNlLCBicmluZyBhbmNob3IgZWxlbWVudCBpbnRvIGZvY3VzXG5cdFx0YW5jaG9yLmZvY3VzKCk7XG5cdFx0aWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuaWQgIT09IGFuY2hvci5pZCkge1xuXHRcdFx0YW5jaG9yLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnLTEnKTtcblx0XHRcdGFuY2hvci5mb2N1cygpO1xuXHRcdFx0YW5jaG9yLnN0eWxlLm91dGxpbmUgPSAnbm9uZSc7XG5cdFx0fVxuXHRcdHdpbmRvdy5zY3JvbGxUbygwICwgZW5kTG9jYXRpb24pO1xuXG5cdH07XG5cblx0LyoqXG5cdCAqIENoZWNrIHRvIHNlZSBpZiB1c2VyIHByZWZlcnMgcmVkdWNlZCBtb3Rpb25cblx0ICogQHBhcmFtICB7T2JqZWN0fSBzZXR0aW5ncyBTY3JpcHQgc2V0dGluZ3Ncblx0ICovXG5cdHZhciByZWR1Y2VNb3Rpb24gPSBmdW5jdGlvbiAoc2V0dGluZ3MpIHtcblx0XHRpZiAoJ21hdGNoTWVkaWEnIGluIHdpbmRvdyAmJiB3aW5kb3cubWF0Y2hNZWRpYSgnKHByZWZlcnMtcmVkdWNlZC1tb3Rpb24pJykubWF0Y2hlcykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8vXG5cdC8vIFNtb290aFNjcm9sbCBDb25zdHJ1Y3RvclxuXHQvL1xuXG5cdHZhciBTbW9vdGhTY3JvbGwgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcblxuXHRcdC8vXG5cdFx0Ly8gVmFyaWFibGVzXG5cdFx0Ly9cblxuXHRcdHZhciBzbW9vdGhTY3JvbGwgPSB7fTsgLy8gT2JqZWN0IGZvciBwdWJsaWMgQVBJc1xuXHRcdHZhciBzZXR0aW5ncywgYW5jaG9yLCB0b2dnbGUsIGZpeGVkSGVhZGVyLCBoZWFkZXJIZWlnaHQsIGV2ZW50VGltZW91dCwgYW5pbWF0aW9uSW50ZXJ2YWw7XG5cblxuXHRcdC8vXG5cdFx0Ly8gTWV0aG9kc1xuXHRcdC8vXG5cblx0XHQvKipcblx0XHQgKiBDYW5jZWwgYSBzY3JvbGwtaW4tcHJvZ3Jlc3Ncblx0XHQgKi9cblx0XHRzbW9vdGhTY3JvbGwuY2FuY2VsU2Nyb2xsID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0Ly8gY2xlYXJJbnRlcnZhbChhbmltYXRpb25JbnRlcnZhbCk7XG5cdFx0XHRjYW5jZWxBbmltYXRpb25GcmFtZShhbmltYXRpb25JbnRlcnZhbCk7XG5cdFx0fTtcblxuXHRcdC8qKlxuXHRcdCAqIFN0YXJ0L3N0b3AgdGhlIHNjcm9sbGluZyBhbmltYXRpb25cblx0XHQgKiBAcGFyYW0ge05vZGV8TnVtYmVyfSBhbmNob3IgIFRoZSBlbGVtZW50IG9yIHBvc2l0aW9uIHRvIHNjcm9sbCB0b1xuXHRcdCAqIEBwYXJhbSB7RWxlbWVudH0gICAgIHRvZ2dsZSAgVGhlIGVsZW1lbnQgdGhhdCB0b2dnbGVkIHRoZSBzY3JvbGwgZXZlbnRcblx0XHQgKiBAcGFyYW0ge09iamVjdH0gICAgICBvcHRpb25zXG5cdFx0ICovXG5cdFx0c21vb3RoU2Nyb2xsLmFuaW1hdGVTY3JvbGwgPSBmdW5jdGlvbiAoYW5jaG9yLCB0b2dnbGUsIG9wdGlvbnMpIHtcblxuXHRcdFx0Ly8gTG9jYWwgc2V0dGluZ3Ncblx0XHRcdHZhciBhbmltYXRlU2V0dGluZ3MgPSBleHRlbmQoc2V0dGluZ3MgfHwgZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pOyAvLyBNZXJnZSB1c2VyIG9wdGlvbnMgd2l0aCBkZWZhdWx0c1xuXG5cdFx0XHQvLyBTZWxlY3RvcnMgYW5kIHZhcmlhYmxlc1xuXHRcdFx0dmFyIGlzTnVtID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFuY2hvcikgPT09ICdbb2JqZWN0IE51bWJlcl0nID8gdHJ1ZSA6IGZhbHNlO1xuXHRcdFx0dmFyIGFuY2hvckVsZW0gPSBpc051bSB8fCAhYW5jaG9yLnRhZ05hbWUgPyBudWxsIDogYW5jaG9yO1xuXHRcdFx0aWYgKCFpc051bSAmJiAhYW5jaG9yRWxlbSkgcmV0dXJuO1xuXHRcdFx0dmFyIHN0YXJ0TG9jYXRpb24gPSB3aW5kb3cucGFnZVlPZmZzZXQ7IC8vIEN1cnJlbnQgbG9jYXRpb24gb24gdGhlIHBhZ2Vcblx0XHRcdGlmIChhbmltYXRlU2V0dGluZ3MuaGVhZGVyICYmICFmaXhlZEhlYWRlcikge1xuXHRcdFx0XHQvLyBHZXQgdGhlIGZpeGVkIGhlYWRlciBpZiBub3QgYWxyZWFkeSBzZXRcblx0XHRcdFx0Zml4ZWRIZWFkZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCBhbmltYXRlU2V0dGluZ3MuaGVhZGVyICk7XG5cdFx0XHR9XG5cdFx0XHRpZiAoIWhlYWRlckhlaWdodCkge1xuXHRcdFx0XHQvLyBHZXQgdGhlIGhlaWdodCBvZiBhIGZpeGVkIGhlYWRlciBpZiBvbmUgZXhpc3RzIGFuZCBub3QgYWxyZWFkeSBzZXRcblx0XHRcdFx0aGVhZGVySGVpZ2h0ID0gZ2V0SGVhZGVySGVpZ2h0KGZpeGVkSGVhZGVyKTtcblx0XHRcdH1cblx0XHRcdHZhciBlbmRMb2NhdGlvbiA9IGlzTnVtID8gYW5jaG9yIDogZ2V0RW5kTG9jYXRpb24oYW5jaG9yRWxlbSwgaGVhZGVySGVpZ2h0LCBwYXJzZUludCgodHlwZW9mIGFuaW1hdGVTZXR0aW5ncy5vZmZzZXQgPT09ICdmdW5jdGlvbicgPyBhbmltYXRlU2V0dGluZ3Mub2Zmc2V0KCkgOiBhbmltYXRlU2V0dGluZ3Mub2Zmc2V0KSwgMTApKTsgLy8gTG9jYXRpb24gdG8gc2Nyb2xsIHRvXG5cdFx0XHR2YXIgZGlzdGFuY2UgPSBlbmRMb2NhdGlvbiAtIHN0YXJ0TG9jYXRpb247IC8vIGRpc3RhbmNlIHRvIHRyYXZlbFxuXHRcdFx0dmFyIGRvY3VtZW50SGVpZ2h0ID0gZ2V0RG9jdW1lbnRIZWlnaHQoKTtcblx0XHRcdHZhciB0aW1lTGFwc2VkID0gMDtcblx0XHRcdHZhciBzdGFydCwgcGVyY2VudGFnZSwgcG9zaXRpb247XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogU3RvcCB0aGUgc2Nyb2xsIGFuaW1hdGlvbiB3aGVuIGl0IHJlYWNoZXMgaXRzIHRhcmdldCAob3IgdGhlIGJvdHRvbS90b3Agb2YgcGFnZSlcblx0XHRcdCAqIEBwYXJhbSB7TnVtYmVyfSBwb3NpdGlvbiBDdXJyZW50IHBvc2l0aW9uIG9uIHRoZSBwYWdlXG5cdFx0XHQgKiBAcGFyYW0ge051bWJlcn0gZW5kTG9jYXRpb24gU2Nyb2xsIHRvIGxvY2F0aW9uXG5cdFx0XHQgKiBAcGFyYW0ge051bWJlcn0gYW5pbWF0aW9uSW50ZXJ2YWwgSG93IG11Y2ggdG8gc2Nyb2xsIG9uIHRoaXMgbG9vcFxuXHRcdFx0ICovXG5cdFx0XHR2YXIgc3RvcEFuaW1hdGVTY3JvbGwgPSBmdW5jdGlvbiAocG9zaXRpb24sIGVuZExvY2F0aW9uKSB7XG5cblx0XHRcdFx0Ly8gR2V0IHRoZSBjdXJyZW50IGxvY2F0aW9uXG5cdFx0XHRcdHZhciBjdXJyZW50TG9jYXRpb24gPSB3aW5kb3cucGFnZVlPZmZzZXQ7XG5cblx0XHRcdFx0Ly8gQ2hlY2sgaWYgdGhlIGVuZCBsb2NhdGlvbiBoYXMgYmVlbiByZWFjaGVkIHlldCAob3Igd2UndmUgaGl0IHRoZSBlbmQgb2YgdGhlIGRvY3VtZW50KVxuXHRcdFx0XHRpZiAoIHBvc2l0aW9uID09IGVuZExvY2F0aW9uIHx8IGN1cnJlbnRMb2NhdGlvbiA9PSBlbmRMb2NhdGlvbiB8fCAoKHN0YXJ0TG9jYXRpb24gPCBlbmRMb2NhdGlvbiAmJiB3aW5kb3cuaW5uZXJIZWlnaHQgKyBjdXJyZW50TG9jYXRpb24pID49IGRvY3VtZW50SGVpZ2h0ICkpIHtcblxuXHRcdFx0XHRcdC8vIENsZWFyIHRoZSBhbmltYXRpb24gdGltZXJcblx0XHRcdFx0XHRzbW9vdGhTY3JvbGwuY2FuY2VsU2Nyb2xsKCk7XG5cblx0XHRcdFx0XHQvLyBCcmluZyB0aGUgYW5jaG9yZWQgZWxlbWVudCBpbnRvIGZvY3VzXG5cdFx0XHRcdFx0YWRqdXN0Rm9jdXMoYW5jaG9yLCBlbmRMb2NhdGlvbiwgaXNOdW0pO1xuXG5cdFx0XHRcdFx0Ly8gUnVuIGNhbGxiYWNrIGFmdGVyIGFuaW1hdGlvbiBjb21wbGV0ZVxuXHRcdFx0XHRcdGFuaW1hdGVTZXR0aW5ncy5hZnRlcihhbmNob3IsIHRvZ2dsZSk7XG5cblx0XHRcdFx0XHQvLyBSZXNldCBzdGFydFxuXHRcdFx0XHRcdHN0YXJ0ID0gbnVsbDtcblxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogTG9vcCBzY3JvbGxpbmcgYW5pbWF0aW9uXG5cdFx0XHQgKi9cblx0XHRcdHZhciBsb29wQW5pbWF0ZVNjcm9sbCA9IGZ1bmN0aW9uICh0aW1lc3RhbXApIHtcblx0XHRcdFx0aWYgKCFzdGFydCkgeyBzdGFydCA9IHRpbWVzdGFtcDsgfVxuXHRcdFx0XHR0aW1lTGFwc2VkICs9IHRpbWVzdGFtcCAtIHN0YXJ0O1xuXHRcdFx0XHRwZXJjZW50YWdlID0gKHRpbWVMYXBzZWQgLyBwYXJzZUludChhbmltYXRlU2V0dGluZ3Muc3BlZWQsIDEwKSk7XG5cdFx0XHRcdHBlcmNlbnRhZ2UgPSAocGVyY2VudGFnZSA+IDEpID8gMSA6IHBlcmNlbnRhZ2U7XG5cdFx0XHRcdHBvc2l0aW9uID0gc3RhcnRMb2NhdGlvbiArIChkaXN0YW5jZSAqIGVhc2luZ1BhdHRlcm4oYW5pbWF0ZVNldHRpbmdzLCBwZXJjZW50YWdlKSk7XG5cdFx0XHRcdHdpbmRvdy5zY3JvbGxUbygwLCBNYXRoLmZsb29yKHBvc2l0aW9uKSk7XG5cdFx0XHRcdGlmICghc3RvcEFuaW1hdGVTY3JvbGwocG9zaXRpb24sIGVuZExvY2F0aW9uKSkge1xuXHRcdFx0XHRcdHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUobG9vcEFuaW1hdGVTY3JvbGwpO1xuXHRcdFx0XHRcdHN0YXJ0ID0gdGltZXN0YW1wO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIFJlc2V0IHBvc2l0aW9uIHRvIGZpeCB3ZWlyZCBpT1MgYnVnXG5cdFx0XHQgKiBAbGluayBodHRwczovL2dpdGh1Yi5jb20vY2ZlcmRpbmFuZGkvc21vb3RoLXNjcm9sbC9pc3N1ZXMvNDVcblx0XHRcdCAqL1xuXHRcdFx0aWYgKHdpbmRvdy5wYWdlWU9mZnNldCA9PT0gMCkge1xuXHRcdFx0XHR3aW5kb3cuc2Nyb2xsVG8oIDAsIDAgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUnVuIGNhbGxiYWNrIGJlZm9yZSBhbmltYXRpb24gc3RhcnRzXG5cdFx0XHRhbmltYXRlU2V0dGluZ3MuYmVmb3JlKGFuY2hvciwgdG9nZ2xlKTtcblxuXHRcdFx0Ly8gU3RhcnQgc2Nyb2xsaW5nIGFuaW1hdGlvblxuXHRcdFx0c21vb3RoU2Nyb2xsLmNhbmNlbFNjcm9sbCgpO1xuXHRcdFx0d2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wQW5pbWF0ZVNjcm9sbCk7XG5cblxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBIYW5kbGUgaGFzIGNoYW5nZSBldmVudFxuXHRcdCAqL1xuXHRcdHZhciBoYXNoQ2hhbmdlSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xuXG5cdFx0XHQvLyBPbmx5IHJ1biBpZiB0aGVyZSdzIGFuIGFuY2hvciBlbGVtZW50IHRvIHNjcm9sbCB0b1xuXHRcdFx0aWYgKCFhbmNob3IpIHJldHVybjtcblxuXHRcdFx0Ly8gUmVzZXQgdGhlIGFuY2hvciBlbGVtZW50J3MgSURcblx0XHRcdGFuY2hvci5pZCA9IGFuY2hvci5nZXRBdHRyaWJ1dGUoJ2RhdGEtc2Nyb2xsLWlkJyk7XG5cblx0XHRcdC8vIFNjcm9sbCB0byB0aGUgYW5jaG9yZWQgY29udGVudFxuXHRcdFx0c21vb3RoU2Nyb2xsLmFuaW1hdGVTY3JvbGwoYW5jaG9yLCB0b2dnbGUpO1xuXG5cdFx0XHQvLyBSZXNldCBhbmNob3IgYW5kIHRvZ2dsZVxuXHRcdFx0YW5jaG9yID0gbnVsbDtcblx0XHRcdHRvZ2dsZSA9IG51bGw7XG5cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogSWYgc21vb3RoIHNjcm9sbCBlbGVtZW50IGNsaWNrZWQsIGFuaW1hdGUgc2Nyb2xsXG5cdFx0ICovXG5cdFx0dmFyIGNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xuXG5cdFx0XHQvLyBEb24ndCBydW4gaWYgdGhlIHVzZXIgcHJlZmVycyByZWR1Y2VkIG1vdGlvblxuXHRcdFx0aWYgKHJlZHVjZU1vdGlvbihzZXR0aW5ncykpIHJldHVybjtcblxuXHRcdFx0Ly8gRG9uJ3QgcnVuIGlmIHJpZ2h0LWNsaWNrIG9yIGNvbW1hbmQvY29udHJvbCArIGNsaWNrXG5cdFx0XHRpZiAoZXZlbnQuYnV0dG9uICE9PSAwIHx8IGV2ZW50Lm1ldGFLZXkgfHwgZXZlbnQuY3RybEtleSkgcmV0dXJuO1xuXG5cdFx0XHQvLyBDaGVjayBpZiBhIHNtb290aCBzY3JvbGwgbGluayB3YXMgY2xpY2tlZFxuXHRcdFx0dG9nZ2xlID0gZXZlbnQudGFyZ2V0LmNsb3Nlc3Qoc2VsZWN0b3IpO1xuXHRcdFx0aWYgKCF0b2dnbGUgfHwgdG9nZ2xlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSAhPT0gJ2EnIHx8IGV2ZW50LnRhcmdldC5jbG9zZXN0KHNldHRpbmdzLmlnbm9yZSkpIHJldHVybjtcblxuXHRcdFx0Ly8gT25seSBydW4gaWYgbGluayBpcyBhbiBhbmNob3IgYW5kIHBvaW50cyB0byB0aGUgY3VycmVudCBwYWdlXG5cdFx0XHRpZiAodG9nZ2xlLmhvc3RuYW1lICE9PSB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgfHwgdG9nZ2xlLnBhdGhuYW1lICE9PSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgfHwgIS8jLy50ZXN0KHRvZ2dsZS5ocmVmKSkgcmV0dXJuO1xuXG5cdFx0XHQvLyBHZXQgdGhlIHNhbml0aXplZCBoYXNoXG5cdFx0XHR2YXIgaGFzaDtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGhhc2ggPSBlc2NhcGVDaGFyYWN0ZXJzKGRlY29kZVVSSUNvbXBvbmVudCh0b2dnbGUuaGFzaCkpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdGhhc2ggPSBlc2NhcGVDaGFyYWN0ZXJzKHRvZ2dsZS5oYXNoKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gSWYgdGhlIGhhc2ggaXMgZW1wdHksIHNjcm9sbCB0byB0aGUgdG9wIG9mIHRoZSBwYWdlXG5cdFx0XHRpZiAoaGFzaCA9PT0gJyMnKSB7XG5cblx0XHRcdFx0Ly8gUHJldmVudCBkZWZhdWx0IGxpbmsgYmVoYXZpb3Jcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0XHQvLyBTZXQgdGhlIGFuY2hvcmVkIGVsZW1lbnRcblx0XHRcdFx0YW5jaG9yID0gZG9jdW1lbnQuYm9keTtcblxuXHRcdFx0XHQvLyBTYXZlIG9yIGNyZWF0ZSB0aGUgSUQgYXMgYSBkYXRhIGF0dHJpYnV0ZSBhbmQgcmVtb3ZlIGl0IChwcmV2ZW50cyBzY3JvbGwganVtcClcblx0XHRcdFx0dmFyIGlkID0gYW5jaG9yLmlkID8gYW5jaG9yLmlkIDogJ3Ntb290aC1zY3JvbGwtdG9wJztcblx0XHRcdFx0YW5jaG9yLnNldEF0dHJpYnV0ZSgnZGF0YS1zY3JvbGwtaWQnLCBpZCk7XG5cdFx0XHRcdGFuY2hvci5pZCA9ICcnO1xuXG5cdFx0XHRcdC8vIElmIG5vIGhhc2ggY2hhbmdlIGV2ZW50IHdpbGwgaGFwcGVuLCBmaXJlIG1hbnVhbGx5XG5cdFx0XHRcdC8vIE90aGVyd2lzZSwgdXBkYXRlIHRoZSBoYXNoXG5cdFx0XHRcdGlmICh3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkgPT09IGlkKSB7XG5cdFx0XHRcdFx0aGFzaENoYW5nZUhhbmRsZXIoKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR3aW5kb3cubG9jYXRpb24uaGFzaCA9IGlkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHR9XG5cblx0XHRcdC8vIEdldCB0aGUgYW5jaG9yZWQgZWxlbWVudFxuXHRcdFx0YW5jaG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihoYXNoKTtcblxuXHRcdFx0Ly8gSWYgYW5jaG9yZWQgZWxlbWVudCBleGlzdHMsIHNhdmUgdGhlIElEIGFzIGEgZGF0YSBhdHRyaWJ1dGUgYW5kIHJlbW92ZSBpdCAocHJldmVudHMgc2Nyb2xsIGp1bXApXG5cdFx0XHRpZiAoIWFuY2hvcikgcmV0dXJuO1xuXHRcdFx0YW5jaG9yLnNldEF0dHJpYnV0ZSgnZGF0YS1zY3JvbGwtaWQnLCBhbmNob3IuaWQpO1xuXHRcdFx0YW5jaG9yLmlkID0gJyc7XG5cblx0XHRcdC8vIElmIG5vIGhhc2ggY2hhbmdlIGV2ZW50IHdpbGwgaGFwcGVuLCBmaXJlIG1hbnVhbGx5XG5cdFx0XHRpZiAodG9nZ2xlLmhhc2ggPT09IHdpbmRvdy5sb2NhdGlvbi5oYXNoKSB7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdGhhc2hDaGFuZ2VIYW5kbGVyKCk7XG5cdFx0XHR9XG5cblx0XHR9O1xuXG5cdFx0LyoqXG5cdFx0ICogT24gd2luZG93IHNjcm9sbCBhbmQgcmVzaXplLCBvbmx5IHJ1biBldmVudHMgYXQgYSByYXRlIG9mIDE1ZnBzIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2Vcblx0XHQgKi9cblx0XHR2YXIgcmVzaXplVGhyb3R0bGVyID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0XHRpZiAoIWV2ZW50VGltZW91dCkge1xuXHRcdFx0XHRldmVudFRpbWVvdXQgPSBzZXRUaW1lb3V0KChmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRldmVudFRpbWVvdXQgPSBudWxsOyAvLyBSZXNldCB0aW1lb3V0XG5cdFx0XHRcdFx0aGVhZGVySGVpZ2h0ID0gZ2V0SGVhZGVySGVpZ2h0KGZpeGVkSGVhZGVyKTsgLy8gR2V0IHRoZSBoZWlnaHQgb2YgYSBmaXhlZCBoZWFkZXIgaWYgb25lIGV4aXN0c1xuXHRcdFx0XHR9KSwgNjYpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBEZXN0cm95IHRoZSBjdXJyZW50IGluaXRpYWxpemF0aW9uLlxuXHRcdCAqL1xuXHRcdHNtb290aFNjcm9sbC5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0XHQvLyBJZiBwbHVnaW4gaXNuJ3QgYWxyZWFkeSBpbml0aWFsaXplZCwgc3RvcFxuXHRcdFx0aWYgKCFzZXR0aW5ncykgcmV0dXJuO1xuXG5cdFx0XHQvLyBSZW1vdmUgZXZlbnQgbGlzdGVuZXJzXG5cdFx0XHRkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlciwgZmFsc2UpO1xuXHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHJlc2l6ZVRocm90dGxlciwgZmFsc2UpO1xuXG5cdFx0XHQvLyBDYW5jZWwgYW55IHNjcm9sbHMtaW4tcHJvZ3Jlc3Ncblx0XHRcdHNtb290aFNjcm9sbC5jYW5jZWxTY3JvbGwoKTtcblxuXHRcdFx0Ly8gUmVzZXQgdmFyaWFibGVzXG5cdFx0XHRzZXR0aW5ncyA9IG51bGw7XG5cdFx0XHRhbmNob3IgPSBudWxsO1xuXHRcdFx0dG9nZ2xlID0gbnVsbDtcblx0XHRcdGZpeGVkSGVhZGVyID0gbnVsbDtcblx0XHRcdGhlYWRlckhlaWdodCA9IG51bGw7XG5cdFx0XHRldmVudFRpbWVvdXQgPSBudWxsO1xuXHRcdFx0YW5pbWF0aW9uSW50ZXJ2YWwgPSBudWxsO1xuXHRcdH07XG5cblx0XHQvKipcblx0XHQgKiBJbml0aWFsaXplIFNtb290aCBTY3JvbGxcblx0XHQgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBVc2VyIHNldHRpbmdzXG5cdFx0ICovXG5cdFx0c21vb3RoU2Nyb2xsLmluaXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXG5cdFx0XHQvLyBmZWF0dXJlIHRlc3Rcblx0XHRcdGlmICghc3VwcG9ydHMpIHJldHVybjtcblxuXHRcdFx0Ly8gRGVzdHJveSBhbnkgZXhpc3RpbmcgaW5pdGlhbGl6YXRpb25zXG5cdFx0XHRzbW9vdGhTY3JvbGwuZGVzdHJveSgpO1xuXG5cdFx0XHQvLyBTZWxlY3RvcnMgYW5kIHZhcmlhYmxlc1xuXHRcdFx0c2V0dGluZ3MgPSBleHRlbmQoZGVmYXVsdHMsIG9wdGlvbnMgfHwge30pOyAvLyBNZXJnZSB1c2VyIG9wdGlvbnMgd2l0aCBkZWZhdWx0c1xuXHRcdFx0Zml4ZWRIZWFkZXIgPSBzZXR0aW5ncy5oZWFkZXIgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNldHRpbmdzLmhlYWRlcikgOiBudWxsOyAvLyBHZXQgdGhlIGZpeGVkIGhlYWRlclxuXHRcdFx0aGVhZGVySGVpZ2h0ID0gZ2V0SGVhZGVySGVpZ2h0KGZpeGVkSGVhZGVyKTtcblxuXHRcdFx0Ly8gV2hlbiBhIHRvZ2dsZSBpcyBjbGlja2VkLCBydW4gdGhlIGNsaWNrIGhhbmRsZXJcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyLCBmYWxzZSk7XG5cblx0XHRcdC8vIExpc3RlbiBmb3IgaGFzaCBjaGFuZ2VzXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIGhhc2hDaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG5cblx0XHRcdC8vIElmIHdpbmRvdyBpcyByZXNpemVkIGFuZCB0aGVyZSdzIGEgZml4ZWQgaGVhZGVyLCByZWNhbGN1bGF0ZSBpdHMgc2l6ZVxuXHRcdFx0aWYgKGZpeGVkSGVhZGVyKSB7XG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCByZXNpemVUaHJvdHRsZXIsIGZhbHNlKTtcblx0XHRcdH1cblxuXHRcdH07XG5cblxuXHRcdC8vXG5cdFx0Ly8gSW5pdGlhbGl6ZSBwbHVnaW5cblx0XHQvL1xuXG5cdFx0c21vb3RoU2Nyb2xsLmluaXQob3B0aW9ucyk7XG5cblxuXHRcdC8vXG5cdFx0Ly8gUHVibGljIEFQSXNcblx0XHQvL1xuXG5cdFx0cmV0dXJuIHNtb290aFNjcm9sbDtcblxuXHR9O1xuXG5cdHJldHVybiBTbW9vdGhTY3JvbGw7XG5cbn0pKTsiXX0=
