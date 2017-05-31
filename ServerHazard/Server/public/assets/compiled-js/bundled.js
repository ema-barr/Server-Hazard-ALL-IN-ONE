(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
			}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];return s(n ? n : e);
			}, l, l.exports, e, t, n, r);
		}return n[o].exports;
	}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
		(function (global) {
			(function (global, factory) {
				typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.DeepDiff = factory();
			})(this, function () {
				'use strict';

				var $scope;
				var conflict;
				var conflictResolution = [];
				if (typeof global === 'object' && global) {
					$scope = global;
				} else if (typeof window !== 'undefined') {
					$scope = window;
				} else {
					$scope = {};
				}
				conflict = $scope.DeepDiff;
				if (conflict) {
					conflictResolution.push(function () {
						if ('undefined' !== typeof conflict && $scope.DeepDiff === accumulateDiff) {
							$scope.DeepDiff = conflict;
							conflict = undefined;
						}
					});
				}

				// nodejs compatible on server side and in the browser.
				function inherits(ctor, superCtor) {
					ctor.super_ = superCtor;
					ctor.prototype = Object.create(superCtor.prototype, {
						constructor: {
							value: ctor,
							enumerable: false,
							writable: true,
							configurable: true
						}
					});
				}

				function Diff(kind, path) {
					Object.defineProperty(this, 'kind', {
						value: kind,
						enumerable: true
					});
					if (path && path.length) {
						Object.defineProperty(this, 'path', {
							value: path,
							enumerable: true
						});
					}
				}

				function DiffEdit(path, origin, value) {
					DiffEdit.super_.call(this, 'E', path);
					Object.defineProperty(this, 'lhs', {
						value: origin,
						enumerable: true
					});
					Object.defineProperty(this, 'rhs', {
						value: value,
						enumerable: true
					});
				}
				inherits(DiffEdit, Diff);

				function DiffNew(path, value) {
					DiffNew.super_.call(this, 'N', path);
					Object.defineProperty(this, 'rhs', {
						value: value,
						enumerable: true
					});
				}
				inherits(DiffNew, Diff);

				function DiffDeleted(path, value) {
					DiffDeleted.super_.call(this, 'D', path);
					Object.defineProperty(this, 'lhs', {
						value: value,
						enumerable: true
					});
				}
				inherits(DiffDeleted, Diff);

				function DiffArray(path, index, item) {
					DiffArray.super_.call(this, 'A', path);
					Object.defineProperty(this, 'index', {
						value: index,
						enumerable: true
					});
					Object.defineProperty(this, 'item', {
						value: item,
						enumerable: true
					});
				}
				inherits(DiffArray, Diff);

				function arrayRemove(arr, from, to) {
					var rest = arr.slice((to || from) + 1 || arr.length);
					arr.length = from < 0 ? arr.length + from : from;
					arr.push.apply(arr, rest);
					return arr;
				}

				function realTypeOf(subject) {
					var type = typeof subject;
					if (type !== 'object') {
						return type;
					}

					if (subject === Math) {
						return 'math';
					} else if (subject === null) {
						return 'null';
					} else if (Array.isArray(subject)) {
						return 'array';
					} else if (Object.prototype.toString.call(subject) === '[object Date]') {
						return 'date';
					} else if (typeof subject.toString === 'function' && /^\/.*\//.test(subject.toString())) {
						return 'regexp';
					}
					return 'object';
				}

				function deepDiff(lhs, rhs, changes, prefilter, path, key, stack) {
					path = path || [];
					stack = stack || [];
					var currentPath = path.slice(0);
					if (typeof key !== 'undefined') {
						if (prefilter) {
							if (typeof prefilter === 'function' && prefilter(currentPath, key)) {
								return;
							} else if (typeof prefilter === 'object') {
								if (prefilter.prefilter && prefilter.prefilter(currentPath, key)) {
									return;
								}
								if (prefilter.normalize) {
									var alt = prefilter.normalize(currentPath, key, lhs, rhs);
									if (alt) {
										lhs = alt[0];
										rhs = alt[1];
									}
								}
							}
						}
						currentPath.push(key);
					}

					// Use string comparison for regexes
					if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
						lhs = lhs.toString();
						rhs = rhs.toString();
					}

					var ltype = typeof lhs;
					var rtype = typeof rhs;

					var ldefined = ltype !== 'undefined' || stack && stack[stack.length - 1].lhs && stack[stack.length - 1].lhs.hasOwnProperty(key);
					var rdefined = rtype !== 'undefined' || stack && stack[stack.length - 1].rhs && stack[stack.length - 1].rhs.hasOwnProperty(key);

					if (!ldefined && rdefined) {
						changes(new DiffNew(currentPath, rhs));
					} else if (!rdefined && ldefined) {
						changes(new DiffDeleted(currentPath, lhs));
					} else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
						changes(new DiffEdit(currentPath, lhs, rhs));
					} else if (realTypeOf(lhs) === 'date' && lhs - rhs !== 0) {
						changes(new DiffEdit(currentPath, lhs, rhs));
					} else if (ltype === 'object' && lhs !== null && rhs !== null) {
						if (!stack.filter(function (x) {
							return x.lhs === lhs;
						}).length) {
							stack.push({ lhs: lhs, rhs: rhs });
							if (Array.isArray(lhs)) {
								var i,
								    len = lhs.length;
								for (i = 0; i < lhs.length; i++) {
									if (i >= rhs.length) {
										changes(new DiffArray(currentPath, i, new DiffDeleted(undefined, lhs[i])));
									} else {
										deepDiff(lhs[i], rhs[i], changes, prefilter, currentPath, i, stack);
									}
								}
								while (i < rhs.length) {
									changes(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i++])));
								}
							} else {
								var akeys = Object.keys(lhs);
								var pkeys = Object.keys(rhs);
								akeys.forEach(function (k, i) {
									var other = pkeys.indexOf(k);
									if (other >= 0) {
										deepDiff(lhs[k], rhs[k], changes, prefilter, currentPath, k, stack);
										pkeys = arrayRemove(pkeys, other);
									} else {
										deepDiff(lhs[k], undefined, changes, prefilter, currentPath, k, stack);
									}
								});
								pkeys.forEach(function (k) {
									deepDiff(undefined, rhs[k], changes, prefilter, currentPath, k, stack);
								});
							}
							stack.length = stack.length - 1;
						} else if (lhs !== rhs) {
							// lhs is contains a cycle at this element and it differs from rhs
							changes(new DiffEdit(currentPath, lhs, rhs));
						}
					} else if (lhs !== rhs) {
						if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs))) {
							changes(new DiffEdit(currentPath, lhs, rhs));
						}
					}
				}

				function accumulateDiff(lhs, rhs, prefilter, accum) {
					accum = accum || [];
					deepDiff(lhs, rhs, function (diff) {
						if (diff) {
							accum.push(diff);
						}
					}, prefilter);
					return accum.length ? accum : undefined;
				}

				function applyArrayChange(arr, index, change) {
					if (change.path && change.path.length) {
						var it = arr[index],
						    i,
						    u = change.path.length - 1;
						for (i = 0; i < u; i++) {
							it = it[change.path[i]];
						}
						switch (change.kind) {
							case 'A':
								applyArrayChange(it[change.path[i]], change.index, change.item);
								break;
							case 'D':
								delete it[change.path[i]];
								break;
							case 'E':
							case 'N':
								it[change.path[i]] = change.rhs;
								break;
						}
					} else {
						switch (change.kind) {
							case 'A':
								applyArrayChange(arr[index], change.index, change.item);
								break;
							case 'D':
								arr = arrayRemove(arr, index);
								break;
							case 'E':
							case 'N':
								arr[index] = change.rhs;
								break;
						}
					}
					return arr;
				}

				function applyChange(target, source, change) {
					if (target && source && change && change.kind) {
						var it = target,
						    i = -1,
						    last = change.path ? change.path.length - 1 : 0;
						while (++i < last) {
							if (typeof it[change.path[i]] === 'undefined') {
								it[change.path[i]] = typeof change.path[i] === 'number' ? [] : {};
							}
							it = it[change.path[i]];
						}
						switch (change.kind) {
							case 'A':
								applyArrayChange(change.path ? it[change.path[i]] : it, change.index, change.item);
								break;
							case 'D':
								delete it[change.path[i]];
								break;
							case 'E':
							case 'N':
								it[change.path[i]] = change.rhs;
								break;
						}
					}
				}

				function revertArrayChange(arr, index, change) {
					if (change.path && change.path.length) {
						// the structure of the object at the index has changed...
						var it = arr[index],
						    i,
						    u = change.path.length - 1;
						for (i = 0; i < u; i++) {
							it = it[change.path[i]];
						}
						switch (change.kind) {
							case 'A':
								revertArrayChange(it[change.path[i]], change.index, change.item);
								break;
							case 'D':
								it[change.path[i]] = change.lhs;
								break;
							case 'E':
								it[change.path[i]] = change.lhs;
								break;
							case 'N':
								delete it[change.path[i]];
								break;
						}
					} else {
						// the array item is different...
						switch (change.kind) {
							case 'A':
								revertArrayChange(arr[index], change.index, change.item);
								break;
							case 'D':
								arr[index] = change.lhs;
								break;
							case 'E':
								arr[index] = change.lhs;
								break;
							case 'N':
								arr = arrayRemove(arr, index);
								break;
						}
					}
					return arr;
				}

				function revertChange(target, source, change) {
					if (target && source && change && change.kind) {
						var it = target,
						    i,
						    u;
						u = change.path.length - 1;
						for (i = 0; i < u; i++) {
							if (typeof it[change.path[i]] === 'undefined') {
								it[change.path[i]] = {};
							}
							it = it[change.path[i]];
						}
						switch (change.kind) {
							case 'A':
								// Array was modified...
								// it will be an array...
								revertArrayChange(it[change.path[i]], change.index, change.item);
								break;
							case 'D':
								// Item was deleted...
								it[change.path[i]] = change.lhs;
								break;
							case 'E':
								// Item was edited...
								it[change.path[i]] = change.lhs;
								break;
							case 'N':
								// Item is new...
								delete it[change.path[i]];
								break;
						}
					}
				}

				function applyDiff(target, source, filter) {
					if (target && source) {
						var onChange = function (change) {
							if (!filter || filter(target, source, change)) {
								applyChange(target, source, change);
							}
						};
						deepDiff(target, source, onChange);
					}
				}

				Object.defineProperties(accumulateDiff, {

					diff: {
						value: accumulateDiff,
						enumerable: true
					},
					observableDiff: {
						value: deepDiff,
						enumerable: true
					},
					applyDiff: {
						value: applyDiff,
						enumerable: true
					},
					applyChange: {
						value: applyChange,
						enumerable: true
					},
					revertChange: {
						value: revertChange,
						enumerable: true
					},
					isConflict: {
						value: function () {
							return 'undefined' !== typeof conflict;
						},
						enumerable: true
					},
					noConflict: {
						value: function () {
							if (conflictResolution) {
								conflictResolution.forEach(function (it) {
									it();
								});
								conflictResolution = null;
							}
							return accumulateDiff;
						},
						enumerable: true
					}
				});

				return accumulateDiff;
			});
		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
	}, {}], 2: [function (require, module, exports) {
		/*!
   * jQuery Mousewheel 3.1.13
   *
   * Copyright jQuery Foundation and other contributors
   * Released under the MIT license
   * http://jquery.org/license
   */

		(function (factory) {
			if (typeof define === 'function' && define.amd) {
				// AMD. Register as an anonymous module.
				define(['jquery'], factory);
			} else if (typeof exports === 'object') {
				// Node/CommonJS style for Browserify
				module.exports = factory;
			} else {
				// Browser globals
				factory(jQuery);
			}
		})(function ($) {

			var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
			    toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
			    slice = Array.prototype.slice,
			    nullLowestDeltaTimeout,
			    lowestDelta;

			if ($.event.fixHooks) {
				for (var i = toFix.length; i;) {
					$.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
				}
			}

			var special = $.event.special.mousewheel = {
				version: '3.1.12',

				setup: function () {
					if (this.addEventListener) {
						for (var i = toBind.length; i;) {
							this.addEventListener(toBind[--i], handler, false);
						}
					} else {
						this.onmousewheel = handler;
					}
					// Store the line height and page height for this particular element
					$.data(this, 'mousewheel-line-height', special.getLineHeight(this));
					$.data(this, 'mousewheel-page-height', special.getPageHeight(this));
				},

				teardown: function () {
					if (this.removeEventListener) {
						for (var i = toBind.length; i;) {
							this.removeEventListener(toBind[--i], handler, false);
						}
					} else {
						this.onmousewheel = null;
					}
					// Clean up the data we added to the element
					$.removeData(this, 'mousewheel-line-height');
					$.removeData(this, 'mousewheel-page-height');
				},

				getLineHeight: function (elem) {
					var $elem = $(elem),
					    $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();
					if (!$parent.length) {
						$parent = $('body');
					}
					return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
				},

				getPageHeight: function (elem) {
					return $(elem).height();
				},

				settings: {
					adjustOldDeltas: true, // see shouldAdjustOldDeltas() below
					normalizeOffset: true // calls getBoundingClientRect for each event
				}
			};

			$.fn.extend({
				mousewheel: function (fn) {
					return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
				},

				unmousewheel: function (fn) {
					return this.unbind('mousewheel', fn);
				}
			});

			function handler(event) {
				var orgEvent = event || window.event,
				    args = slice.call(arguments, 1),
				    delta = 0,
				    deltaX = 0,
				    deltaY = 0,
				    absDelta = 0,
				    offsetX = 0,
				    offsetY = 0;
				event = $.event.fix(orgEvent);
				event.type = 'mousewheel';

				// Old school scrollwheel delta
				if ('detail' in orgEvent) {
					deltaY = orgEvent.detail * -1;
				}
				if ('wheelDelta' in orgEvent) {
					deltaY = orgEvent.wheelDelta;
				}
				if ('wheelDeltaY' in orgEvent) {
					deltaY = orgEvent.wheelDeltaY;
				}
				if ('wheelDeltaX' in orgEvent) {
					deltaX = orgEvent.wheelDeltaX * -1;
				}

				// Firefox < 17 horizontal scrolling related to DOMMouseScroll event
				if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
					deltaX = deltaY * -1;
					deltaY = 0;
				}

				// Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
				delta = deltaY === 0 ? deltaX : deltaY;

				// New school wheel delta (wheel event)
				if ('deltaY' in orgEvent) {
					deltaY = orgEvent.deltaY * -1;
					delta = deltaY;
				}
				if ('deltaX' in orgEvent) {
					deltaX = orgEvent.deltaX;
					if (deltaY === 0) {
						delta = deltaX * -1;
					}
				}

				// No change actually happened, no reason to go any further
				if (deltaY === 0 && deltaX === 0) {
					return;
				}

				// Need to convert lines and pages to pixels if we aren't already in pixels
				// There are three delta modes:
				//   * deltaMode 0 is by pixels, nothing to do
				//   * deltaMode 1 is by lines
				//   * deltaMode 2 is by pages
				if (orgEvent.deltaMode === 1) {
					var lineHeight = $.data(this, 'mousewheel-line-height');
					delta *= lineHeight;
					deltaY *= lineHeight;
					deltaX *= lineHeight;
				} else if (orgEvent.deltaMode === 2) {
					var pageHeight = $.data(this, 'mousewheel-page-height');
					delta *= pageHeight;
					deltaY *= pageHeight;
					deltaX *= pageHeight;
				}

				// Store lowest absolute delta to normalize the delta values
				absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

				if (!lowestDelta || absDelta < lowestDelta) {
					lowestDelta = absDelta;

					// Adjust older deltas if necessary
					if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
						lowestDelta /= 40;
					}
				}

				// Adjust older deltas if necessary
				if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
					// Divide all the things by 40!
					delta /= 40;
					deltaX /= 40;
					deltaY /= 40;
				}

				// Get a whole, normalized value for the deltas
				delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
				deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
				deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta);

				// Normalise offsetX and offsetY properties
				if (special.settings.normalizeOffset && this.getBoundingClientRect) {
					var boundingRect = this.getBoundingClientRect();
					offsetX = event.clientX - boundingRect.left;
					offsetY = event.clientY - boundingRect.top;
				}

				// Add information to the event object
				event.deltaX = deltaX;
				event.deltaY = deltaY;
				event.deltaFactor = lowestDelta;
				event.offsetX = offsetX;
				event.offsetY = offsetY;
				// Go ahead and set deltaMode to 0 since we converted to pixels
				// Although this is a little odd since we overwrite the deltaX/Y
				// properties with normalized deltas.
				event.deltaMode = 0;

				// Add event and delta to the front of the arguments
				args.unshift(event, delta, deltaX, deltaY);

				// Clearout lowestDelta after sometime to better
				// handle multiple device types that give different
				// a different lowestDelta
				// Ex: trackpad = 3 and mouse wheel = 120
				if (nullLowestDeltaTimeout) {
					clearTimeout(nullLowestDeltaTimeout);
				}
				nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);

				return ($.event.dispatch || $.event.handle).apply(this, args);
			}

			function nullLowestDelta() {
				lowestDelta = null;
			}

			function shouldAdjustOldDeltas(orgEvent, absDelta) {
				// If this is an older event and the delta is divisable by 120,
				// then we are assuming that the browser is treating this as an
				// older mouse wheel event and that we should divide the deltas
				// by 40 to try and get a more usable deltaFactor.
				// Side note, this actually impacts the reported scroll distance
				// in older browsers and can cause scrolling to be slower than native.
				// Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
				return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
			}
		});
	}, {}], 3: [function (require, module, exports) {
		/*!
   * jQuery JavaScript Library v3.2.1
   * https://jquery.com/
   *
   * Includes Sizzle.js
   * https://sizzlejs.com/
   *
   * Copyright JS Foundation and other contributors
   * Released under the MIT license
   * https://jquery.org/license
   *
   * Date: 2017-03-20T18:59Z
   */
		(function (global, factory) {

			"use strict";

			if (typeof module === "object" && typeof module.exports === "object") {

				// For CommonJS and CommonJS-like environments where a proper `window`
				// is present, execute the factory and get jQuery.
				// For environments that do not have a `window` with a `document`
				// (such as Node.js), expose a factory as module.exports.
				// This accentuates the need for the creation of a real `window`.
				// e.g. var jQuery = require("jquery")(window);
				// See ticket #14549 for more info.
				module.exports = global.document ? factory(global, true) : function (w) {
					if (!w.document) {
						throw new Error("jQuery requires a window with a document");
					}
					return factory(w);
				};
			} else {
				factory(global);
			}

			// Pass this if window is not defined yet
		})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {

			// Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
			// throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
			// arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
			// enough that all such attempts are guarded in a try block.
			"use strict";

			var arr = [];

			var document = window.document;

			var getProto = Object.getPrototypeOf;

			var slice = arr.slice;

			var concat = arr.concat;

			var push = arr.push;

			var indexOf = arr.indexOf;

			var class2type = {};

			var toString = class2type.toString;

			var hasOwn = class2type.hasOwnProperty;

			var fnToString = hasOwn.toString;

			var ObjectFunctionString = fnToString.call(Object);

			var support = {};

			function DOMEval(code, doc) {
				doc = doc || document;

				var script = doc.createElement("script");

				script.text = code;
				doc.head.appendChild(script).parentNode.removeChild(script);
			}
			/* global Symbol */
			// Defining this global in .eslintrc.json would create a danger of using the global
			// unguarded in another place, it seems safer to define global only for this module


			var version = "3.2.1",


			// Define a local copy of jQuery
			jQuery = function (selector, context) {

				// The jQuery object is actually just the init constructor 'enhanced'
				// Need init if jQuery is called (just allow error to be thrown if not included)
				return new jQuery.fn.init(selector, context);
			},


			// Support: Android <=4.0 only
			// Make sure we trim BOM and NBSP
			rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,


			// Matches dashed string for camelizing
			rmsPrefix = /^-ms-/,
			    rdashAlpha = /-([a-z])/g,


			// Used by jQuery.camelCase as callback to replace()
			fcamelCase = function (all, letter) {
				return letter.toUpperCase();
			};

			jQuery.fn = jQuery.prototype = {

				// The current version of jQuery being used
				jquery: version,

				constructor: jQuery,

				// The default length of a jQuery object is 0
				length: 0,

				toArray: function () {
					return slice.call(this);
				},

				// Get the Nth element in the matched element set OR
				// Get the whole matched element set as a clean array
				get: function (num) {

					// Return all the elements in a clean array
					if (num == null) {
						return slice.call(this);
					}

					// Return just the one element from the set
					return num < 0 ? this[num + this.length] : this[num];
				},

				// Take an array of elements and push it onto the stack
				// (returning the new matched element set)
				pushStack: function (elems) {

					// Build a new jQuery matched element set
					var ret = jQuery.merge(this.constructor(), elems);

					// Add the old object onto the stack (as a reference)
					ret.prevObject = this;

					// Return the newly-formed element set
					return ret;
				},

				// Execute a callback for every element in the matched set.
				each: function (callback) {
					return jQuery.each(this, callback);
				},

				map: function (callback) {
					return this.pushStack(jQuery.map(this, function (elem, i) {
						return callback.call(elem, i, elem);
					}));
				},

				slice: function () {
					return this.pushStack(slice.apply(this, arguments));
				},

				first: function () {
					return this.eq(0);
				},

				last: function () {
					return this.eq(-1);
				},

				eq: function (i) {
					var len = this.length,
					    j = +i + (i < 0 ? len : 0);
					return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
				},

				end: function () {
					return this.prevObject || this.constructor();
				},

				// For internal use only.
				// Behaves like an Array's method, not like a jQuery method.
				push: push,
				sort: arr.sort,
				splice: arr.splice
			};

			jQuery.extend = jQuery.fn.extend = function () {
				var options,
				    name,
				    src,
				    copy,
				    copyIsArray,
				    clone,
				    target = arguments[0] || {},
				    i = 1,
				    length = arguments.length,
				    deep = false;

				// Handle a deep copy situation
				if (typeof target === "boolean") {
					deep = target;

					// Skip the boolean and the target
					target = arguments[i] || {};
					i++;
				}

				// Handle case when target is a string or something (possible in deep copy)
				if (typeof target !== "object" && !jQuery.isFunction(target)) {
					target = {};
				}

				// Extend jQuery itself if only one argument is passed
				if (i === length) {
					target = this;
					i--;
				}

				for (; i < length; i++) {

					// Only deal with non-null/undefined values
					if ((options = arguments[i]) != null) {

						// Extend the base object
						for (name in options) {
							src = target[name];
							copy = options[name];

							// Prevent never-ending loop
							if (target === copy) {
								continue;
							}

							// Recurse if we're merging plain objects or arrays
							if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

								if (copyIsArray) {
									copyIsArray = false;
									clone = src && Array.isArray(src) ? src : [];
								} else {
									clone = src && jQuery.isPlainObject(src) ? src : {};
								}

								// Never move original objects, clone them
								target[name] = jQuery.extend(deep, clone, copy);

								// Don't bring in undefined values
							} else if (copy !== undefined) {
								target[name] = copy;
							}
						}
					}
				}

				// Return the modified object
				return target;
			};

			jQuery.extend({

				// Unique for each copy of jQuery on the page
				expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),

				// Assume jQuery is ready without the ready module
				isReady: true,

				error: function (msg) {
					throw new Error(msg);
				},

				noop: function () {},

				isFunction: function (obj) {
					return jQuery.type(obj) === "function";
				},

				isWindow: function (obj) {
					return obj != null && obj === obj.window;
				},

				isNumeric: function (obj) {

					// As of jQuery 3.0, isNumeric is limited to
					// strings and numbers (primitives or objects)
					// that can be coerced to finite numbers (gh-2662)
					var type = jQuery.type(obj);
					return (type === "number" || type === "string") &&

					// parseFloat NaNs numeric-cast false positives ("")
					// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
					// subtraction forces infinities to NaN
					!isNaN(obj - parseFloat(obj));
				},

				isPlainObject: function (obj) {
					var proto, Ctor;

					// Detect obvious negatives
					// Use toString instead of jQuery.type to catch host objects
					if (!obj || toString.call(obj) !== "[object Object]") {
						return false;
					}

					proto = getProto(obj);

					// Objects with no prototype (e.g., `Object.create( null )`) are plain
					if (!proto) {
						return true;
					}

					// Objects with prototype are plain iff they were constructed by a global Object function
					Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
					return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
				},

				isEmptyObject: function (obj) {

					/* eslint-disable no-unused-vars */
					// See https://github.com/eslint/eslint/issues/6125
					var name;

					for (name in obj) {
						return false;
					}
					return true;
				},

				type: function (obj) {
					if (obj == null) {
						return obj + "";
					}

					// Support: Android <=2.3 only (functionish RegExp)
					return typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj;
				},

				// Evaluates a script in a global context
				globalEval: function (code) {
					DOMEval(code);
				},

				// Convert dashed to camelCase; used by the css and data modules
				// Support: IE <=9 - 11, Edge 12 - 13
				// Microsoft forgot to hump their vendor prefix (#9572)
				camelCase: function (string) {
					return string.replace(rmsPrefix, "ms-").replace(rdashAlpha, fcamelCase);
				},

				each: function (obj, callback) {
					var length,
					    i = 0;

					if (isArrayLike(obj)) {
						length = obj.length;
						for (; i < length; i++) {
							if (callback.call(obj[i], i, obj[i]) === false) {
								break;
							}
						}
					} else {
						for (i in obj) {
							if (callback.call(obj[i], i, obj[i]) === false) {
								break;
							}
						}
					}

					return obj;
				},

				// Support: Android <=4.0 only
				trim: function (text) {
					return text == null ? "" : (text + "").replace(rtrim, "");
				},

				// results is for internal usage only
				makeArray: function (arr, results) {
					var ret = results || [];

					if (arr != null) {
						if (isArrayLike(Object(arr))) {
							jQuery.merge(ret, typeof arr === "string" ? [arr] : arr);
						} else {
							push.call(ret, arr);
						}
					}

					return ret;
				},

				inArray: function (elem, arr, i) {
					return arr == null ? -1 : indexOf.call(arr, elem, i);
				},

				// Support: Android <=4.0 only, PhantomJS 1 only
				// push.apply(_, arraylike) throws on ancient WebKit
				merge: function (first, second) {
					var len = +second.length,
					    j = 0,
					    i = first.length;

					for (; j < len; j++) {
						first[i++] = second[j];
					}

					first.length = i;

					return first;
				},

				grep: function (elems, callback, invert) {
					var callbackInverse,
					    matches = [],
					    i = 0,
					    length = elems.length,
					    callbackExpect = !invert;

					// Go through the array, only saving the items
					// that pass the validator function
					for (; i < length; i++) {
						callbackInverse = !callback(elems[i], i);
						if (callbackInverse !== callbackExpect) {
							matches.push(elems[i]);
						}
					}

					return matches;
				},

				// arg is for internal usage only
				map: function (elems, callback, arg) {
					var length,
					    value,
					    i = 0,
					    ret = [];

					// Go through the array, translating each of the items to their new values
					if (isArrayLike(elems)) {
						length = elems.length;
						for (; i < length; i++) {
							value = callback(elems[i], i, arg);

							if (value != null) {
								ret.push(value);
							}
						}

						// Go through every key on the object,
					} else {
						for (i in elems) {
							value = callback(elems[i], i, arg);

							if (value != null) {
								ret.push(value);
							}
						}
					}

					// Flatten any nested arrays
					return concat.apply([], ret);
				},

				// A global GUID counter for objects
				guid: 1,

				// Bind a function to a context, optionally partially applying any
				// arguments.
				proxy: function (fn, context) {
					var tmp, args, proxy;

					if (typeof context === "string") {
						tmp = fn[context];
						context = fn;
						fn = tmp;
					}

					// Quick check to determine if target is callable, in the spec
					// this throws a TypeError, but we will just return undefined.
					if (!jQuery.isFunction(fn)) {
						return undefined;
					}

					// Simulated bind
					args = slice.call(arguments, 2);
					proxy = function () {
						return fn.apply(context || this, args.concat(slice.call(arguments)));
					};

					// Set the guid of unique handler to the same of original handler, so it can be removed
					proxy.guid = fn.guid = fn.guid || jQuery.guid++;

					return proxy;
				},

				now: Date.now,

				// jQuery.support is not used in Core but other projects attach their
				// properties to it so it needs to exist.
				support: support
			});

			if (typeof Symbol === "function") {
				jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
			}

			// Populate the class2type map
			jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "), function (i, name) {
				class2type["[object " + name + "]"] = name.toLowerCase();
			});

			function isArrayLike(obj) {

				// Support: real iOS 8.2 only (not reproducible in simulator)
				// `in` check used to prevent JIT error (gh-2145)
				// hasOwn isn't used here due to false negatives
				// regarding Nodelist length in IE
				var length = !!obj && "length" in obj && obj.length,
				    type = jQuery.type(obj);

				if (type === "function" || jQuery.isWindow(obj)) {
					return false;
				}

				return type === "array" || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
			}
			var Sizzle =
			/*!
    * Sizzle CSS Selector Engine v2.3.3
    * https://sizzlejs.com/
    *
    * Copyright jQuery Foundation and other contributors
    * Released under the MIT license
    * http://jquery.org/license
    *
    * Date: 2016-08-08
    */
			function (window) {

				var i,
				    support,
				    Expr,
				    getText,
				    isXML,
				    tokenize,
				    compile,
				    select,
				    outermostContext,
				    sortInput,
				    hasDuplicate,


				// Local document vars
				setDocument,
				    document,
				    docElem,
				    documentIsHTML,
				    rbuggyQSA,
				    rbuggyMatches,
				    matches,
				    contains,


				// Instance-specific data
				expando = "sizzle" + 1 * new Date(),
				    preferredDoc = window.document,
				    dirruns = 0,
				    done = 0,
				    classCache = createCache(),
				    tokenCache = createCache(),
				    compilerCache = createCache(),
				    sortOrder = function (a, b) {
					if (a === b) {
						hasDuplicate = true;
					}
					return 0;
				},


				// Instance methods
				hasOwn = {}.hasOwnProperty,
				    arr = [],
				    pop = arr.pop,
				    push_native = arr.push,
				    push = arr.push,
				    slice = arr.slice,

				// Use a stripped-down indexOf as it's faster than native
				// https://jsperf.com/thor-indexof-vs-for/5
				indexOf = function (list, elem) {
					var i = 0,
					    len = list.length;
					for (; i < len; i++) {
						if (list[i] === elem) {
							return i;
						}
					}
					return -1;
				},
				    booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",


				// Regular expressions

				// http://www.w3.org/TR/css3-selectors/#whitespace
				whitespace = "[\\x20\\t\\r\\n\\f]",


				// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
				identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",


				// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
				attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
				// Operator (capture 2)
				"*([*^$|!~]?=)" + whitespace +
				// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
				"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace + "*\\]",
				    pseudos = ":(" + identifier + ")(?:\\((" +
				// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
				// 1. quoted (capture 3; capture 4 or capture 5)
				"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
				// 2. simple (capture 6)
				"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
				// 3. anything else (capture 2)
				".*" + ")\\)|)",


				// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
				rwhitespace = new RegExp(whitespace + "+", "g"),
				    rtrim = new RegExp("^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g"),
				    rcomma = new RegExp("^" + whitespace + "*," + whitespace + "*"),
				    rcombinators = new RegExp("^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*"),
				    rattributeQuotes = new RegExp("=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g"),
				    rpseudo = new RegExp(pseudos),
				    ridentifier = new RegExp("^" + identifier + "$"),
				    matchExpr = {
					"ID": new RegExp("^#(" + identifier + ")"),
					"CLASS": new RegExp("^\\.(" + identifier + ")"),
					"TAG": new RegExp("^(" + identifier + "|[*])"),
					"ATTR": new RegExp("^" + attributes),
					"PSEUDO": new RegExp("^" + pseudos),
					"CHILD": new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace + "*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace + "*(\\d+)|))" + whitespace + "*\\)|)", "i"),
					"bool": new RegExp("^(?:" + booleans + ")$", "i"),
					// For use in libraries implementing .is()
					// We use this for POS matching in `select`
					"needsContext": new RegExp("^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
				},
				    rinputs = /^(?:input|select|textarea|button)$/i,
				    rheader = /^h\d$/i,
				    rnative = /^[^{]+\{\s*\[native \w/,


				// Easily-parseable/retrievable ID or TAG or CLASS selectors
				rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
				    rsibling = /[+~]/,


				// CSS escapes
				// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
				runescape = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig"),
				    funescape = function (_, escaped, escapedWhitespace) {
					var high = "0x" + escaped - 0x10000;
					// NaN means non-codepoint
					// Support: Firefox<24
					// Workaround erroneous numeric interpretation of +"0x"
					return high !== high || escapedWhitespace ? escaped : high < 0 ?
					// BMP codepoint
					String.fromCharCode(high + 0x10000) :
					// Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
				},


				// CSS string/identifier serialization
				// https://drafts.csswg.org/cssom/#common-serializing-idioms
				rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
				    fcssescape = function (ch, asCodePoint) {
					if (asCodePoint) {

						// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
						if (ch === "\0") {
							return "\uFFFD";
						}

						// Control characters and (dependent upon position) numbers get escaped as code points
						return ch.slice(0, -1) + "\\" + ch.charCodeAt(ch.length - 1).toString(16) + " ";
					}

					// Other potentially-special ASCII characters get backslash-escaped
					return "\\" + ch;
				},


				// Used for iframes
				// See setDocument()
				// Removing the function wrapper causes a "Permission Denied"
				// error in IE
				unloadHandler = function () {
					setDocument();
				},
				    disabledAncestor = addCombinator(function (elem) {
					return elem.disabled === true && ("form" in elem || "label" in elem);
				}, { dir: "parentNode", next: "legend" });

				// Optimize for push.apply( _, NodeList )
				try {
					push.apply(arr = slice.call(preferredDoc.childNodes), preferredDoc.childNodes);
					// Support: Android<4.0
					// Detect silently failing push.apply
					arr[preferredDoc.childNodes.length].nodeType;
				} catch (e) {
					push = { apply: arr.length ?

						// Leverage slice if possible
						function (target, els) {
							push_native.apply(target, slice.call(els));
						} :

						// Support: IE<9
						// Otherwise append directly
						function (target, els) {
							var j = target.length,
							    i = 0;
							// Can't trust NodeList.length
							while (target[j++] = els[i++]) {}
							target.length = j - 1;
						}
					};
				}

				function Sizzle(selector, context, results, seed) {
					var m,
					    i,
					    elem,
					    nid,
					    match,
					    groups,
					    newSelector,
					    newContext = context && context.ownerDocument,


					// nodeType defaults to 9, since context defaults to document
					nodeType = context ? context.nodeType : 9;

					results = results || [];

					// Return early from calls with invalid selector or context
					if (typeof selector !== "string" || !selector || nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {

						return results;
					}

					// Try to shortcut find operations (as opposed to filters) in HTML documents
					if (!seed) {

						if ((context ? context.ownerDocument || context : preferredDoc) !== document) {
							setDocument(context);
						}
						context = context || document;

						if (documentIsHTML) {

							// If the selector is sufficiently simple, try using a "get*By*" DOM method
							// (excepting DocumentFragment context, where the methods don't exist)
							if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {

								// ID selector
								if (m = match[1]) {

									// Document context
									if (nodeType === 9) {
										if (elem = context.getElementById(m)) {

											// Support: IE, Opera, Webkit
											// TODO: identify versions
											// getElementById can match elements by name instead of ID
											if (elem.id === m) {
												results.push(elem);
												return results;
											}
										} else {
											return results;
										}

										// Element context
									} else {

										// Support: IE, Opera, Webkit
										// TODO: identify versions
										// getElementById can match elements by name instead of ID
										if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {

											results.push(elem);
											return results;
										}
									}

									// Type selector
								} else if (match[2]) {
									push.apply(results, context.getElementsByTagName(selector));
									return results;

									// Class selector
								} else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {

									push.apply(results, context.getElementsByClassName(m));
									return results;
								}
							}

							// Take advantage of querySelectorAll
							if (support.qsa && !compilerCache[selector + " "] && (!rbuggyQSA || !rbuggyQSA.test(selector))) {

								if (nodeType !== 1) {
									newContext = context;
									newSelector = selector;

									// qSA looks outside Element context, which is not what we want
									// Thanks to Andrew Dupont for this workaround technique
									// Support: IE <=8
									// Exclude object elements
								} else if (context.nodeName.toLowerCase() !== "object") {

									// Capture the context ID, setting it first if necessary
									if (nid = context.getAttribute("id")) {
										nid = nid.replace(rcssescape, fcssescape);
									} else {
										context.setAttribute("id", nid = expando);
									}

									// Prefix every selector in the list
									groups = tokenize(selector);
									i = groups.length;
									while (i--) {
										groups[i] = "#" + nid + " " + toSelector(groups[i]);
									}
									newSelector = groups.join(",");

									// Expand context for sibling selectors
									newContext = rsibling.test(selector) && testContext(context.parentNode) || context;
								}

								if (newSelector) {
									try {
										push.apply(results, newContext.querySelectorAll(newSelector));
										return results;
									} catch (qsaError) {} finally {
										if (nid === expando) {
											context.removeAttribute("id");
										}
									}
								}
							}
						}
					}

					// All others
					return select(selector.replace(rtrim, "$1"), context, results, seed);
				}

				/**
     * Create key-value caches of limited size
     * @returns {function(string, object)} Returns the Object data after storing it on itself with
     *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
     *	deleting the oldest entry
     */
				function createCache() {
					var keys = [];

					function cache(key, value) {
						// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
						if (keys.push(key + " ") > Expr.cacheLength) {
							// Only keep the most recent entries
							delete cache[keys.shift()];
						}
						return cache[key + " "] = value;
					}
					return cache;
				}

				/**
     * Mark a function for special use by Sizzle
     * @param {Function} fn The function to mark
     */
				function markFunction(fn) {
					fn[expando] = true;
					return fn;
				}

				/**
     * Support testing using an element
     * @param {Function} fn Passed the created element and returns a boolean result
     */
				function assert(fn) {
					var el = document.createElement("fieldset");

					try {
						return !!fn(el);
					} catch (e) {
						return false;
					} finally {
						// Remove from its parent by default
						if (el.parentNode) {
							el.parentNode.removeChild(el);
						}
						// release memory in IE
						el = null;
					}
				}

				/**
     * Adds the same handler for all of the specified attrs
     * @param {String} attrs Pipe-separated list of attributes
     * @param {Function} handler The method that will be applied
     */
				function addHandle(attrs, handler) {
					var arr = attrs.split("|"),
					    i = arr.length;

					while (i--) {
						Expr.attrHandle[arr[i]] = handler;
					}
				}

				/**
     * Checks document order of two siblings
     * @param {Element} a
     * @param {Element} b
     * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
     */
				function siblingCheck(a, b) {
					var cur = b && a,
					    diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex;

					// Use IE sourceIndex if available on both nodes
					if (diff) {
						return diff;
					}

					// Check if b follows a
					if (cur) {
						while (cur = cur.nextSibling) {
							if (cur === b) {
								return -1;
							}
						}
					}

					return a ? 1 : -1;
				}

				/**
     * Returns a function to use in pseudos for input types
     * @param {String} type
     */
				function createInputPseudo(type) {
					return function (elem) {
						var name = elem.nodeName.toLowerCase();
						return name === "input" && elem.type === type;
					};
				}

				/**
     * Returns a function to use in pseudos for buttons
     * @param {String} type
     */
				function createButtonPseudo(type) {
					return function (elem) {
						var name = elem.nodeName.toLowerCase();
						return (name === "input" || name === "button") && elem.type === type;
					};
				}

				/**
     * Returns a function to use in pseudos for :enabled/:disabled
     * @param {Boolean} disabled true for :disabled; false for :enabled
     */
				function createDisabledPseudo(disabled) {

					// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
					return function (elem) {

						// Only certain elements can match :enabled or :disabled
						// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
						// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
						if ("form" in elem) {

							// Check for inherited disabledness on relevant non-disabled elements:
							// * listed form-associated elements in a disabled fieldset
							//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
							//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
							// * option elements in a disabled optgroup
							//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
							// All such elements have a "form" property.
							if (elem.parentNode && elem.disabled === false) {

								// Option elements defer to a parent optgroup if present
								if ("label" in elem) {
									if ("label" in elem.parentNode) {
										return elem.parentNode.disabled === disabled;
									} else {
										return elem.disabled === disabled;
									}
								}

								// Support: IE 6 - 11
								// Use the isDisabled shortcut property to check for disabled fieldset ancestors
								return elem.isDisabled === disabled ||

								// Where there is no isDisabled, check manually
								/* jshint -W018 */
								elem.isDisabled !== !disabled && disabledAncestor(elem) === disabled;
							}

							return elem.disabled === disabled;

							// Try to winnow out elements that can't be disabled before trusting the disabled property.
							// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
							// even exist on them, let alone have a boolean value.
						} else if ("label" in elem) {
							return elem.disabled === disabled;
						}

						// Remaining elements are neither :enabled nor :disabled
						return false;
					};
				}

				/**
     * Returns a function to use in pseudos for positionals
     * @param {Function} fn
     */
				function createPositionalPseudo(fn) {
					return markFunction(function (argument) {
						argument = +argument;
						return markFunction(function (seed, matches) {
							var j,
							    matchIndexes = fn([], seed.length, argument),
							    i = matchIndexes.length;

							// Match elements found at the specified indexes
							while (i--) {
								if (seed[j = matchIndexes[i]]) {
									seed[j] = !(matches[j] = seed[j]);
								}
							}
						});
					});
				}

				/**
     * Checks a node for validity as a Sizzle context
     * @param {Element|Object=} context
     * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
     */
				function testContext(context) {
					return context && typeof context.getElementsByTagName !== "undefined" && context;
				}

				// Expose support vars for convenience
				support = Sizzle.support = {};

				/**
     * Detects XML nodes
     * @param {Element|Object} elem An element or a document
     * @returns {Boolean} True iff elem is a non-HTML XML node
     */
				isXML = Sizzle.isXML = function (elem) {
					// documentElement is verified for cases where it doesn't yet exist
					// (such as loading iframes in IE - #4833)
					var documentElement = elem && (elem.ownerDocument || elem).documentElement;
					return documentElement ? documentElement.nodeName !== "HTML" : false;
				};

				/**
     * Sets document-related variables once based on the current document
     * @param {Element|Object} [doc] An element or document object to use to set the document
     * @returns {Object} Returns the current document
     */
				setDocument = Sizzle.setDocument = function (node) {
					var hasCompare,
					    subWindow,
					    doc = node ? node.ownerDocument || node : preferredDoc;

					// Return early if doc is invalid or already selected
					if (doc === document || doc.nodeType !== 9 || !doc.documentElement) {
						return document;
					}

					// Update global variables
					document = doc;
					docElem = document.documentElement;
					documentIsHTML = !isXML(document);

					// Support: IE 9-11, Edge
					// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
					if (preferredDoc !== document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {

						// Support: IE 11, Edge
						if (subWindow.addEventListener) {
							subWindow.addEventListener("unload", unloadHandler, false);

							// Support: IE 9 - 10 only
						} else if (subWindow.attachEvent) {
							subWindow.attachEvent("onunload", unloadHandler);
						}
					}

					/* Attributes
     ---------------------------------------------------------------------- */

					// Support: IE<8
					// Verify that getAttribute really returns attributes and not properties
					// (excepting IE8 booleans)
					support.attributes = assert(function (el) {
						el.className = "i";
						return !el.getAttribute("className");
					});

					/* getElement(s)By*
     ---------------------------------------------------------------------- */

					// Check if getElementsByTagName("*") returns only elements
					support.getElementsByTagName = assert(function (el) {
						el.appendChild(document.createComment(""));
						return !el.getElementsByTagName("*").length;
					});

					// Support: IE<9
					support.getElementsByClassName = rnative.test(document.getElementsByClassName);

					// Support: IE<10
					// Check if getElementById returns elements by name
					// The broken getElementById methods don't pick up programmatically-set names,
					// so use a roundabout getElementsByName test
					support.getById = assert(function (el) {
						docElem.appendChild(el).id = expando;
						return !document.getElementsByName || !document.getElementsByName(expando).length;
					});

					// ID filter and find
					if (support.getById) {
						Expr.filter["ID"] = function (id) {
							var attrId = id.replace(runescape, funescape);
							return function (elem) {
								return elem.getAttribute("id") === attrId;
							};
						};
						Expr.find["ID"] = function (id, context) {
							if (typeof context.getElementById !== "undefined" && documentIsHTML) {
								var elem = context.getElementById(id);
								return elem ? [elem] : [];
							}
						};
					} else {
						Expr.filter["ID"] = function (id) {
							var attrId = id.replace(runescape, funescape);
							return function (elem) {
								var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
								return node && node.value === attrId;
							};
						};

						// Support: IE 6 - 7 only
						// getElementById is not reliable as a find shortcut
						Expr.find["ID"] = function (id, context) {
							if (typeof context.getElementById !== "undefined" && documentIsHTML) {
								var node,
								    i,
								    elems,
								    elem = context.getElementById(id);

								if (elem) {

									// Verify the id attribute
									node = elem.getAttributeNode("id");
									if (node && node.value === id) {
										return [elem];
									}

									// Fall back on getElementsByName
									elems = context.getElementsByName(id);
									i = 0;
									while (elem = elems[i++]) {
										node = elem.getAttributeNode("id");
										if (node && node.value === id) {
											return [elem];
										}
									}
								}

								return [];
							}
						};
					}

					// Tag
					Expr.find["TAG"] = support.getElementsByTagName ? function (tag, context) {
						if (typeof context.getElementsByTagName !== "undefined") {
							return context.getElementsByTagName(tag);

							// DocumentFragment nodes don't have gEBTN
						} else if (support.qsa) {
							return context.querySelectorAll(tag);
						}
					} : function (tag, context) {
						var elem,
						    tmp = [],
						    i = 0,

						// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
						results = context.getElementsByTagName(tag);

						// Filter out possible comments
						if (tag === "*") {
							while (elem = results[i++]) {
								if (elem.nodeType === 1) {
									tmp.push(elem);
								}
							}

							return tmp;
						}
						return results;
					};

					// Class
					Expr.find["CLASS"] = support.getElementsByClassName && function (className, context) {
						if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
							return context.getElementsByClassName(className);
						}
					};

					/* QSA/matchesSelector
     ---------------------------------------------------------------------- */

					// QSA and matchesSelector support

					// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
					rbuggyMatches = [];

					// qSa(:focus) reports false when true (Chrome 21)
					// We allow this because of a bug in IE8/9 that throws an error
					// whenever `document.activeElement` is accessed on an iframe
					// So, we allow :focus to pass through QSA all the time to avoid the IE error
					// See https://bugs.jquery.com/ticket/13378
					rbuggyQSA = [];

					if (support.qsa = rnative.test(document.querySelectorAll)) {
						// Build QSA regex
						// Regex strategy adopted from Diego Perini
						assert(function (el) {
							// Select is set to empty string on purpose
							// This is to test IE's treatment of not explicitly
							// setting a boolean content attribute,
							// since its presence should be enough
							// https://bugs.jquery.com/ticket/12359
							docElem.appendChild(el).innerHTML = "<a id='" + expando + "'></a>" + "<select id='" + expando + "-\r\\' msallowcapture=''>" + "<option selected=''></option></select>";

							// Support: IE8, Opera 11-12.16
							// Nothing should be selected when empty strings follow ^= or $= or *=
							// The test attribute must be unknown in Opera but "safe" for WinRT
							// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
							if (el.querySelectorAll("[msallowcapture^='']").length) {
								rbuggyQSA.push("[*^$]=" + whitespace + "*(?:''|\"\")");
							}

							// Support: IE8
							// Boolean attributes and "value" are not treated correctly
							if (!el.querySelectorAll("[selected]").length) {
								rbuggyQSA.push("\\[" + whitespace + "*(?:value|" + booleans + ")");
							}

							// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
							if (!el.querySelectorAll("[id~=" + expando + "-]").length) {
								rbuggyQSA.push("~=");
							}

							// Webkit/Opera - :checked should return selected option elements
							// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
							// IE8 throws error here and will not see later tests
							if (!el.querySelectorAll(":checked").length) {
								rbuggyQSA.push(":checked");
							}

							// Support: Safari 8+, iOS 8+
							// https://bugs.webkit.org/show_bug.cgi?id=136851
							// In-page `selector#id sibling-combinator selector` fails
							if (!el.querySelectorAll("a#" + expando + "+*").length) {
								rbuggyQSA.push(".#.+[+~]");
							}
						});

						assert(function (el) {
							el.innerHTML = "<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>";

							// Support: Windows 8 Native Apps
							// The type and name attributes are restricted during .innerHTML assignment
							var input = document.createElement("input");
							input.setAttribute("type", "hidden");
							el.appendChild(input).setAttribute("name", "D");

							// Support: IE8
							// Enforce case-sensitivity of name attribute
							if (el.querySelectorAll("[name=d]").length) {
								rbuggyQSA.push("name" + whitespace + "*[*^$|!~]?=");
							}

							// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
							// IE8 throws error here and will not see later tests
							if (el.querySelectorAll(":enabled").length !== 2) {
								rbuggyQSA.push(":enabled", ":disabled");
							}

							// Support: IE9-11+
							// IE's :disabled selector does not pick up the children of disabled fieldsets
							docElem.appendChild(el).disabled = true;
							if (el.querySelectorAll(":disabled").length !== 2) {
								rbuggyQSA.push(":enabled", ":disabled");
							}

							// Opera 10-11 does not throw on post-comma invalid pseudos
							el.querySelectorAll("*,:x");
							rbuggyQSA.push(",.*:");
						});
					}

					if (support.matchesSelector = rnative.test(matches = docElem.matches || docElem.webkitMatchesSelector || docElem.mozMatchesSelector || docElem.oMatchesSelector || docElem.msMatchesSelector)) {

						assert(function (el) {
							// Check to see if it's possible to do matchesSelector
							// on a disconnected node (IE 9)
							support.disconnectedMatch = matches.call(el, "*");

							// This should fail with an exception
							// Gecko does not error, returns false instead
							matches.call(el, "[s!='']:x");
							rbuggyMatches.push("!=", pseudos);
						});
					}

					rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join("|"));
					rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join("|"));

					/* Contains
     ---------------------------------------------------------------------- */
					hasCompare = rnative.test(docElem.compareDocumentPosition);

					// Element contains another
					// Purposefully self-exclusive
					// As in, an element does not contain itself
					contains = hasCompare || rnative.test(docElem.contains) ? function (a, b) {
						var adown = a.nodeType === 9 ? a.documentElement : a,
						    bup = b && b.parentNode;
						return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
					} : function (a, b) {
						if (b) {
							while (b = b.parentNode) {
								if (b === a) {
									return true;
								}
							}
						}
						return false;
					};

					/* Sorting
     ---------------------------------------------------------------------- */

					// Document order sorting
					sortOrder = hasCompare ? function (a, b) {

						// Flag for duplicate removal
						if (a === b) {
							hasDuplicate = true;
							return 0;
						}

						// Sort on method existence if only one input has compareDocumentPosition
						var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
						if (compare) {
							return compare;
						}

						// Calculate position if both inputs belong to the same document
						compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) :

						// Otherwise we know they are disconnected
						1;

						// Disconnected nodes
						if (compare & 1 || !support.sortDetached && b.compareDocumentPosition(a) === compare) {

							// Choose the first element that is related to our preferred document
							if (a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a)) {
								return -1;
							}
							if (b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b)) {
								return 1;
							}

							// Maintain original order
							return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
						}

						return compare & 4 ? -1 : 1;
					} : function (a, b) {
						// Exit early if the nodes are identical
						if (a === b) {
							hasDuplicate = true;
							return 0;
						}

						var cur,
						    i = 0,
						    aup = a.parentNode,
						    bup = b.parentNode,
						    ap = [a],
						    bp = [b];

						// Parentless nodes are either documents or disconnected
						if (!aup || !bup) {
							return a === document ? -1 : b === document ? 1 : aup ? -1 : bup ? 1 : sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;

							// If the nodes are siblings, we can do a quick check
						} else if (aup === bup) {
							return siblingCheck(a, b);
						}

						// Otherwise we need full lists of their ancestors for comparison
						cur = a;
						while (cur = cur.parentNode) {
							ap.unshift(cur);
						}
						cur = b;
						while (cur = cur.parentNode) {
							bp.unshift(cur);
						}

						// Walk down the tree looking for a discrepancy
						while (ap[i] === bp[i]) {
							i++;
						}

						return i ?
						// Do a sibling check if the nodes have a common ancestor
						siblingCheck(ap[i], bp[i]) :

						// Otherwise nodes in our document sort first
						ap[i] === preferredDoc ? -1 : bp[i] === preferredDoc ? 1 : 0;
					};

					return document;
				};

				Sizzle.matches = function (expr, elements) {
					return Sizzle(expr, null, null, elements);
				};

				Sizzle.matchesSelector = function (elem, expr) {
					// Set document vars if needed
					if ((elem.ownerDocument || elem) !== document) {
						setDocument(elem);
					}

					// Make sure that attribute selectors are quoted
					expr = expr.replace(rattributeQuotes, "='$1']");

					if (support.matchesSelector && documentIsHTML && !compilerCache[expr + " "] && (!rbuggyMatches || !rbuggyMatches.test(expr)) && (!rbuggyQSA || !rbuggyQSA.test(expr))) {

						try {
							var ret = matches.call(elem, expr);

							// IE 9's matchesSelector returns false on disconnected nodes
							if (ret || support.disconnectedMatch ||
							// As well, disconnected nodes are said to be in a document
							// fragment in IE 9
							elem.document && elem.document.nodeType !== 11) {
								return ret;
							}
						} catch (e) {}
					}

					return Sizzle(expr, document, null, [elem]).length > 0;
				};

				Sizzle.contains = function (context, elem) {
					// Set document vars if needed
					if ((context.ownerDocument || context) !== document) {
						setDocument(context);
					}
					return contains(context, elem);
				};

				Sizzle.attr = function (elem, name) {
					// Set document vars if needed
					if ((elem.ownerDocument || elem) !== document) {
						setDocument(elem);
					}

					var fn = Expr.attrHandle[name.toLowerCase()],

					// Don't get fooled by Object.prototype properties (jQuery #13807)
					val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;

					return val !== undefined ? val : support.attributes || !documentIsHTML ? elem.getAttribute(name) : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
				};

				Sizzle.escape = function (sel) {
					return (sel + "").replace(rcssescape, fcssescape);
				};

				Sizzle.error = function (msg) {
					throw new Error("Syntax error, unrecognized expression: " + msg);
				};

				/**
     * Document sorting and removing duplicates
     * @param {ArrayLike} results
     */
				Sizzle.uniqueSort = function (results) {
					var elem,
					    duplicates = [],
					    j = 0,
					    i = 0;

					// Unless we *know* we can detect duplicates, assume their presence
					hasDuplicate = !support.detectDuplicates;
					sortInput = !support.sortStable && results.slice(0);
					results.sort(sortOrder);

					if (hasDuplicate) {
						while (elem = results[i++]) {
							if (elem === results[i]) {
								j = duplicates.push(i);
							}
						}
						while (j--) {
							results.splice(duplicates[j], 1);
						}
					}

					// Clear input after sorting to release objects
					// See https://github.com/jquery/sizzle/pull/225
					sortInput = null;

					return results;
				};

				/**
     * Utility function for retrieving the text value of an array of DOM nodes
     * @param {Array|Element} elem
     */
				getText = Sizzle.getText = function (elem) {
					var node,
					    ret = "",
					    i = 0,
					    nodeType = elem.nodeType;

					if (!nodeType) {
						// If no nodeType, this is expected to be an array
						while (node = elem[i++]) {
							// Do not traverse comment nodes
							ret += getText(node);
						}
					} else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
						// Use textContent for elements
						// innerText usage removed for consistency of new lines (jQuery #11153)
						if (typeof elem.textContent === "string") {
							return elem.textContent;
						} else {
							// Traverse its children
							for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
								ret += getText(elem);
							}
						}
					} else if (nodeType === 3 || nodeType === 4) {
						return elem.nodeValue;
					}
					// Do not include comment or processing instruction nodes

					return ret;
				};

				Expr = Sizzle.selectors = {

					// Can be adjusted by the user
					cacheLength: 50,

					createPseudo: markFunction,

					match: matchExpr,

					attrHandle: {},

					find: {},

					relative: {
						">": { dir: "parentNode", first: true },
						" ": { dir: "parentNode" },
						"+": { dir: "previousSibling", first: true },
						"~": { dir: "previousSibling" }
					},

					preFilter: {
						"ATTR": function (match) {
							match[1] = match[1].replace(runescape, funescape);

							// Move the given value to match[3] whether quoted or unquoted
							match[3] = (match[3] || match[4] || match[5] || "").replace(runescape, funescape);

							if (match[2] === "~=") {
								match[3] = " " + match[3] + " ";
							}

							return match.slice(0, 4);
						},

						"CHILD": function (match) {
							/* matches from matchExpr["CHILD"]
       	1 type (only|nth|...)
       	2 what (child|of-type)
       	3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
       	4 xn-component of xn+y argument ([+-]?\d*n|)
       	5 sign of xn-component
       	6 x of xn-component
       	7 sign of y-component
       	8 y of y-component
       */
							match[1] = match[1].toLowerCase();

							if (match[1].slice(0, 3) === "nth") {
								// nth-* requires argument
								if (!match[3]) {
									Sizzle.error(match[0]);
								}

								// numeric x and y parameters for Expr.filter.CHILD
								// remember that false/true cast respectively to 0/1
								match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === "even" || match[3] === "odd"));
								match[5] = +(match[7] + match[8] || match[3] === "odd");

								// other types prohibit arguments
							} else if (match[3]) {
								Sizzle.error(match[0]);
							}

							return match;
						},

						"PSEUDO": function (match) {
							var excess,
							    unquoted = !match[6] && match[2];

							if (matchExpr["CHILD"].test(match[0])) {
								return null;
							}

							// Accept quoted arguments as-is
							if (match[3]) {
								match[2] = match[4] || match[5] || "";

								// Strip excess characters from unquoted arguments
							} else if (unquoted && rpseudo.test(unquoted) && (
							// Get excess from tokenize (recursively)
							excess = tokenize(unquoted, true)) && (
							// advance to the next closing parenthesis
							excess = unquoted.indexOf(")", unquoted.length - excess) - unquoted.length)) {

								// excess is a negative index
								match[0] = match[0].slice(0, excess);
								match[2] = unquoted.slice(0, excess);
							}

							// Return only captures needed by the pseudo filter method (type and argument)
							return match.slice(0, 3);
						}
					},

					filter: {

						"TAG": function (nodeNameSelector) {
							var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
							return nodeNameSelector === "*" ? function () {
								return true;
							} : function (elem) {
								return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
							};
						},

						"CLASS": function (className) {
							var pattern = classCache[className + " "];

							return pattern || (pattern = new RegExp("(^|" + whitespace + ")" + className + "(" + whitespace + "|$)")) && classCache(className, function (elem) {
								return pattern.test(typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "");
							});
						},

						"ATTR": function (name, operator, check) {
							return function (elem) {
								var result = Sizzle.attr(elem, name);

								if (result == null) {
									return operator === "!=";
								}
								if (!operator) {
									return true;
								}

								result += "";

								return operator === "=" ? result === check : operator === "!=" ? result !== check : operator === "^=" ? check && result.indexOf(check) === 0 : operator === "*=" ? check && result.indexOf(check) > -1 : operator === "$=" ? check && result.slice(-check.length) === check : operator === "~=" ? (" " + result.replace(rwhitespace, " ") + " ").indexOf(check) > -1 : operator === "|=" ? result === check || result.slice(0, check.length + 1) === check + "-" : false;
							};
						},

						"CHILD": function (type, what, argument, first, last) {
							var simple = type.slice(0, 3) !== "nth",
							    forward = type.slice(-4) !== "last",
							    ofType = what === "of-type";

							return first === 1 && last === 0 ?

							// Shortcut for :nth-*(n)
							function (elem) {
								return !!elem.parentNode;
							} : function (elem, context, xml) {
								var cache,
								    uniqueCache,
								    outerCache,
								    node,
								    nodeIndex,
								    start,
								    dir = simple !== forward ? "nextSibling" : "previousSibling",
								    parent = elem.parentNode,
								    name = ofType && elem.nodeName.toLowerCase(),
								    useCache = !xml && !ofType,
								    diff = false;

								if (parent) {

									// :(first|last|only)-(child|of-type)
									if (simple) {
										while (dir) {
											node = elem;
											while (node = node[dir]) {
												if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {

													return false;
												}
											}
											// Reverse direction for :only-* (if we haven't yet done so)
											start = dir = type === "only" && !start && "nextSibling";
										}
										return true;
									}

									start = [forward ? parent.firstChild : parent.lastChild];

									// non-xml :nth-child(...) stores cache data on `parent`
									if (forward && useCache) {

										// Seek `elem` from a previously-cached index

										// ...in a gzip-friendly way
										node = parent;
										outerCache = node[expando] || (node[expando] = {});

										// Support: IE <9 only
										// Defend against cloned attroperties (jQuery gh-1709)
										uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});

										cache = uniqueCache[type] || [];
										nodeIndex = cache[0] === dirruns && cache[1];
										diff = nodeIndex && cache[2];
										node = nodeIndex && parent.childNodes[nodeIndex];

										while (node = ++nodeIndex && node && node[dir] || (

										// Fallback to seeking `elem` from the start
										diff = nodeIndex = 0) || start.pop()) {

											// When found, cache indexes on `parent` and break
											if (node.nodeType === 1 && ++diff && node === elem) {
												uniqueCache[type] = [dirruns, nodeIndex, diff];
												break;
											}
										}
									} else {
										// Use previously-cached element index if available
										if (useCache) {
											// ...in a gzip-friendly way
											node = elem;
											outerCache = node[expando] || (node[expando] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});

											cache = uniqueCache[type] || [];
											nodeIndex = cache[0] === dirruns && cache[1];
											diff = nodeIndex;
										}

										// xml :nth-child(...)
										// or :nth-last-child(...) or :nth(-last)?-of-type(...)
										if (diff === false) {
											// Use the same loop as above to seek `elem` from the start
											while (node = ++nodeIndex && node && node[dir] || (diff = nodeIndex = 0) || start.pop()) {

												if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {

													// Cache the index of each encountered element
													if (useCache) {
														outerCache = node[expando] || (node[expando] = {});

														// Support: IE <9 only
														// Defend against cloned attroperties (jQuery gh-1709)
														uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});

														uniqueCache[type] = [dirruns, diff];
													}

													if (node === elem) {
														break;
													}
												}
											}
										}
									}

									// Incorporate the offset, then check against cycle size
									diff -= last;
									return diff === first || diff % first === 0 && diff / first >= 0;
								}
							};
						},

						"PSEUDO": function (pseudo, argument) {
							// pseudo-class names are case-insensitive
							// http://www.w3.org/TR/selectors/#pseudo-classes
							// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
							// Remember that setFilters inherits from pseudos
							var args,
							    fn = Expr.pseudos[pseudo] || Expr.setFilters[pseudo.toLowerCase()] || Sizzle.error("unsupported pseudo: " + pseudo);

							// The user may use createPseudo to indicate that
							// arguments are needed to create the filter function
							// just as Sizzle does
							if (fn[expando]) {
								return fn(argument);
							}

							// But maintain support for old signatures
							if (fn.length > 1) {
								args = [pseudo, pseudo, "", argument];
								return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase()) ? markFunction(function (seed, matches) {
									var idx,
									    matched = fn(seed, argument),
									    i = matched.length;
									while (i--) {
										idx = indexOf(seed, matched[i]);
										seed[idx] = !(matches[idx] = matched[i]);
									}
								}) : function (elem) {
									return fn(elem, 0, args);
								};
							}

							return fn;
						}
					},

					pseudos: {
						// Potentially complex pseudos
						"not": markFunction(function (selector) {
							// Trim the selector passed to compile
							// to avoid treating leading and trailing
							// spaces as combinators
							var input = [],
							    results = [],
							    matcher = compile(selector.replace(rtrim, "$1"));

							return matcher[expando] ? markFunction(function (seed, matches, context, xml) {
								var elem,
								    unmatched = matcher(seed, null, xml, []),
								    i = seed.length;

								// Match elements unmatched by `matcher`
								while (i--) {
									if (elem = unmatched[i]) {
										seed[i] = !(matches[i] = elem);
									}
								}
							}) : function (elem, context, xml) {
								input[0] = elem;
								matcher(input, null, xml, results);
								// Don't keep the element (issue #299)
								input[0] = null;
								return !results.pop();
							};
						}),

						"has": markFunction(function (selector) {
							return function (elem) {
								return Sizzle(selector, elem).length > 0;
							};
						}),

						"contains": markFunction(function (text) {
							text = text.replace(runescape, funescape);
							return function (elem) {
								return (elem.textContent || elem.innerText || getText(elem)).indexOf(text) > -1;
							};
						}),

						// "Whether an element is represented by a :lang() selector
						// is based solely on the element's language value
						// being equal to the identifier C,
						// or beginning with the identifier C immediately followed by "-".
						// The matching of C against the element's language value is performed case-insensitively.
						// The identifier C does not have to be a valid language name."
						// http://www.w3.org/TR/selectors/#lang-pseudo
						"lang": markFunction(function (lang) {
							// lang value must be a valid identifier
							if (!ridentifier.test(lang || "")) {
								Sizzle.error("unsupported lang: " + lang);
							}
							lang = lang.replace(runescape, funescape).toLowerCase();
							return function (elem) {
								var elemLang;
								do {
									if (elemLang = documentIsHTML ? elem.lang : elem.getAttribute("xml:lang") || elem.getAttribute("lang")) {

										elemLang = elemLang.toLowerCase();
										return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
									}
								} while ((elem = elem.parentNode) && elem.nodeType === 1);
								return false;
							};
						}),

						// Miscellaneous
						"target": function (elem) {
							var hash = window.location && window.location.hash;
							return hash && hash.slice(1) === elem.id;
						},

						"root": function (elem) {
							return elem === docElem;
						},

						"focus": function (elem) {
							return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
						},

						// Boolean properties
						"enabled": createDisabledPseudo(false),
						"disabled": createDisabledPseudo(true),

						"checked": function (elem) {
							// In CSS3, :checked should return both checked and selected elements
							// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
							var nodeName = elem.nodeName.toLowerCase();
							return nodeName === "input" && !!elem.checked || nodeName === "option" && !!elem.selected;
						},

						"selected": function (elem) {
							// Accessing this property makes selected-by-default
							// options in Safari work properly
							if (elem.parentNode) {
								elem.parentNode.selectedIndex;
							}

							return elem.selected === true;
						},

						// Contents
						"empty": function (elem) {
							// http://www.w3.org/TR/selectors/#empty-pseudo
							// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
							//   but not by others (comment: 8; processing instruction: 7; etc.)
							// nodeType < 6 works because attributes (2) do not appear as children
							for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
								if (elem.nodeType < 6) {
									return false;
								}
							}
							return true;
						},

						"parent": function (elem) {
							return !Expr.pseudos["empty"](elem);
						},

						// Element/input types
						"header": function (elem) {
							return rheader.test(elem.nodeName);
						},

						"input": function (elem) {
							return rinputs.test(elem.nodeName);
						},

						"button": function (elem) {
							var name = elem.nodeName.toLowerCase();
							return name === "input" && elem.type === "button" || name === "button";
						},

						"text": function (elem) {
							var attr;
							return elem.nodeName.toLowerCase() === "input" && elem.type === "text" && (

							// Support: IE<8
							// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
							(attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text");
						},

						// Position-in-collection
						"first": createPositionalPseudo(function () {
							return [0];
						}),

						"last": createPositionalPseudo(function (matchIndexes, length) {
							return [length - 1];
						}),

						"eq": createPositionalPseudo(function (matchIndexes, length, argument) {
							return [argument < 0 ? argument + length : argument];
						}),

						"even": createPositionalPseudo(function (matchIndexes, length) {
							var i = 0;
							for (; i < length; i += 2) {
								matchIndexes.push(i);
							}
							return matchIndexes;
						}),

						"odd": createPositionalPseudo(function (matchIndexes, length) {
							var i = 1;
							for (; i < length; i += 2) {
								matchIndexes.push(i);
							}
							return matchIndexes;
						}),

						"lt": createPositionalPseudo(function (matchIndexes, length, argument) {
							var i = argument < 0 ? argument + length : argument;
							for (; --i >= 0;) {
								matchIndexes.push(i);
							}
							return matchIndexes;
						}),

						"gt": createPositionalPseudo(function (matchIndexes, length, argument) {
							var i = argument < 0 ? argument + length : argument;
							for (; ++i < length;) {
								matchIndexes.push(i);
							}
							return matchIndexes;
						})
					}
				};

				Expr.pseudos["nth"] = Expr.pseudos["eq"];

				// Add button/input type pseudos
				for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
					Expr.pseudos[i] = createInputPseudo(i);
				}
				for (i in { submit: true, reset: true }) {
					Expr.pseudos[i] = createButtonPseudo(i);
				}

				// Easy API for creating new setFilters
				function setFilters() {}
				setFilters.prototype = Expr.filters = Expr.pseudos;
				Expr.setFilters = new setFilters();

				tokenize = Sizzle.tokenize = function (selector, parseOnly) {
					var matched,
					    match,
					    tokens,
					    type,
					    soFar,
					    groups,
					    preFilters,
					    cached = tokenCache[selector + " "];

					if (cached) {
						return parseOnly ? 0 : cached.slice(0);
					}

					soFar = selector;
					groups = [];
					preFilters = Expr.preFilter;

					while (soFar) {

						// Comma and first run
						if (!matched || (match = rcomma.exec(soFar))) {
							if (match) {
								// Don't consume trailing commas as valid
								soFar = soFar.slice(match[0].length) || soFar;
							}
							groups.push(tokens = []);
						}

						matched = false;

						// Combinators
						if (match = rcombinators.exec(soFar)) {
							matched = match.shift();
							tokens.push({
								value: matched,
								// Cast descendant combinators to space
								type: match[0].replace(rtrim, " ")
							});
							soFar = soFar.slice(matched.length);
						}

						// Filters
						for (type in Expr.filter) {
							if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
								matched = match.shift();
								tokens.push({
									value: matched,
									type: type,
									matches: match
								});
								soFar = soFar.slice(matched.length);
							}
						}

						if (!matched) {
							break;
						}
					}

					// Return the length of the invalid excess
					// if we're just parsing
					// Otherwise, throw an error or return tokens
					return parseOnly ? soFar.length : soFar ? Sizzle.error(selector) :
					// Cache the tokens
					tokenCache(selector, groups).slice(0);
				};

				function toSelector(tokens) {
					var i = 0,
					    len = tokens.length,
					    selector = "";
					for (; i < len; i++) {
						selector += tokens[i].value;
					}
					return selector;
				}

				function addCombinator(matcher, combinator, base) {
					var dir = combinator.dir,
					    skip = combinator.next,
					    key = skip || dir,
					    checkNonElements = base && key === "parentNode",
					    doneName = done++;

					return combinator.first ?
					// Check against closest ancestor/preceding element
					function (elem, context, xml) {
						while (elem = elem[dir]) {
							if (elem.nodeType === 1 || checkNonElements) {
								return matcher(elem, context, xml);
							}
						}
						return false;
					} :

					// Check against all ancestor/preceding elements
					function (elem, context, xml) {
						var oldCache,
						    uniqueCache,
						    outerCache,
						    newCache = [dirruns, doneName];

						// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
						if (xml) {
							while (elem = elem[dir]) {
								if (elem.nodeType === 1 || checkNonElements) {
									if (matcher(elem, context, xml)) {
										return true;
									}
								}
							}
						} else {
							while (elem = elem[dir]) {
								if (elem.nodeType === 1 || checkNonElements) {
									outerCache = elem[expando] || (elem[expando] = {});

									// Support: IE <9 only
									// Defend against cloned attroperties (jQuery gh-1709)
									uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});

									if (skip && skip === elem.nodeName.toLowerCase()) {
										elem = elem[dir] || elem;
									} else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {

										// Assign to newCache so results back-propagate to previous elements
										return newCache[2] = oldCache[2];
									} else {
										// Reuse newcache so results back-propagate to previous elements
										uniqueCache[key] = newCache;

										// A match means we're done; a fail means we have to keep checking
										if (newCache[2] = matcher(elem, context, xml)) {
											return true;
										}
									}
								}
							}
						}
						return false;
					};
				}

				function elementMatcher(matchers) {
					return matchers.length > 1 ? function (elem, context, xml) {
						var i = matchers.length;
						while (i--) {
							if (!matchers[i](elem, context, xml)) {
								return false;
							}
						}
						return true;
					} : matchers[0];
				}

				function multipleContexts(selector, contexts, results) {
					var i = 0,
					    len = contexts.length;
					for (; i < len; i++) {
						Sizzle(selector, contexts[i], results);
					}
					return results;
				}

				function condense(unmatched, map, filter, context, xml) {
					var elem,
					    newUnmatched = [],
					    i = 0,
					    len = unmatched.length,
					    mapped = map != null;

					for (; i < len; i++) {
						if (elem = unmatched[i]) {
							if (!filter || filter(elem, context, xml)) {
								newUnmatched.push(elem);
								if (mapped) {
									map.push(i);
								}
							}
						}
					}

					return newUnmatched;
				}

				function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
					if (postFilter && !postFilter[expando]) {
						postFilter = setMatcher(postFilter);
					}
					if (postFinder && !postFinder[expando]) {
						postFinder = setMatcher(postFinder, postSelector);
					}
					return markFunction(function (seed, results, context, xml) {
						var temp,
						    i,
						    elem,
						    preMap = [],
						    postMap = [],
						    preexisting = results.length,


						// Get initial elements from seed or context
						elems = seed || multipleContexts(selector || "*", context.nodeType ? [context] : context, []),


						// Prefilter to get matcher input, preserving a map for seed-results synchronization
						matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
						    matcherOut = matcher ?
						// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
						postFinder || (seed ? preFilter : preexisting || postFilter) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results : matcherIn;

						// Find primary matches
						if (matcher) {
							matcher(matcherIn, matcherOut, context, xml);
						}

						// Apply postFilter
						if (postFilter) {
							temp = condense(matcherOut, postMap);
							postFilter(temp, [], context, xml);

							// Un-match failing elements by moving them back to matcherIn
							i = temp.length;
							while (i--) {
								if (elem = temp[i]) {
									matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
								}
							}
						}

						if (seed) {
							if (postFinder || preFilter) {
								if (postFinder) {
									// Get the final matcherOut by condensing this intermediate into postFinder contexts
									temp = [];
									i = matcherOut.length;
									while (i--) {
										if (elem = matcherOut[i]) {
											// Restore matcherIn since elem is not yet a final match
											temp.push(matcherIn[i] = elem);
										}
									}
									postFinder(null, matcherOut = [], temp, xml);
								}

								// Move matched elements from seed to results to keep them synchronized
								i = matcherOut.length;
								while (i--) {
									if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {

										seed[temp] = !(results[temp] = elem);
									}
								}
							}

							// Add elements to results, through postFinder if defined
						} else {
							matcherOut = condense(matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut);
							if (postFinder) {
								postFinder(null, results, matcherOut, xml);
							} else {
								push.apply(results, matcherOut);
							}
						}
					});
				}

				function matcherFromTokens(tokens) {
					var checkContext,
					    matcher,
					    j,
					    len = tokens.length,
					    leadingRelative = Expr.relative[tokens[0].type],
					    implicitRelative = leadingRelative || Expr.relative[" "],
					    i = leadingRelative ? 1 : 0,


					// The foundational matcher ensures that elements are reachable from top-level context(s)
					matchContext = addCombinator(function (elem) {
						return elem === checkContext;
					}, implicitRelative, true),
					    matchAnyContext = addCombinator(function (elem) {
						return indexOf(checkContext, elem) > -1;
					}, implicitRelative, true),
					    matchers = [function (elem, context, xml) {
						var ret = !leadingRelative && (xml || context !== outermostContext) || ((checkContext = context).nodeType ? matchContext(elem, context, xml) : matchAnyContext(elem, context, xml));
						// Avoid hanging onto element (issue #299)
						checkContext = null;
						return ret;
					}];

					for (; i < len; i++) {
						if (matcher = Expr.relative[tokens[i].type]) {
							matchers = [addCombinator(elementMatcher(matchers), matcher)];
						} else {
							matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches);

							// Return special upon seeing a positional matcher
							if (matcher[expando]) {
								// Find the next relative operator (if any) for proper handling
								j = ++i;
								for (; j < len; j++) {
									if (Expr.relative[tokens[j].type]) {
										break;
									}
								}
								return setMatcher(i > 1 && elementMatcher(matchers), i > 1 && toSelector(
								// If the preceding token was a descendant combinator, insert an implicit any-element `*`
								tokens.slice(0, i - 1).concat({ value: tokens[i - 2].type === " " ? "*" : "" })).replace(rtrim, "$1"), matcher, i < j && matcherFromTokens(tokens.slice(i, j)), j < len && matcherFromTokens(tokens = tokens.slice(j)), j < len && toSelector(tokens));
							}
							matchers.push(matcher);
						}
					}

					return elementMatcher(matchers);
				}

				function matcherFromGroupMatchers(elementMatchers, setMatchers) {
					var bySet = setMatchers.length > 0,
					    byElement = elementMatchers.length > 0,
					    superMatcher = function (seed, context, xml, results, outermost) {
						var elem,
						    j,
						    matcher,
						    matchedCount = 0,
						    i = "0",
						    unmatched = seed && [],
						    setMatched = [],
						    contextBackup = outermostContext,

						// We must always have either seed elements or outermost context
						elems = seed || byElement && Expr.find["TAG"]("*", outermost),

						// Use integer dirruns iff this is the outermost matcher
						dirrunsUnique = dirruns += contextBackup == null ? 1 : Math.random() || 0.1,
						    len = elems.length;

						if (outermost) {
							outermostContext = context === document || context || outermost;
						}

						// Add elements passing elementMatchers directly to results
						// Support: IE<9, Safari
						// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
						for (; i !== len && (elem = elems[i]) != null; i++) {
							if (byElement && elem) {
								j = 0;
								if (!context && elem.ownerDocument !== document) {
									setDocument(elem);
									xml = !documentIsHTML;
								}
								while (matcher = elementMatchers[j++]) {
									if (matcher(elem, context || document, xml)) {
										results.push(elem);
										break;
									}
								}
								if (outermost) {
									dirruns = dirrunsUnique;
								}
							}

							// Track unmatched elements for set filters
							if (bySet) {
								// They will have gone through all possible matchers
								if (elem = !matcher && elem) {
									matchedCount--;
								}

								// Lengthen the array for every element, matched or not
								if (seed) {
									unmatched.push(elem);
								}
							}
						}

						// `i` is now the count of elements visited above, and adding it to `matchedCount`
						// makes the latter nonnegative.
						matchedCount += i;

						// Apply set filters to unmatched elements
						// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
						// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
						// no element matchers and no seed.
						// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
						// case, which will result in a "00" `matchedCount` that differs from `i` but is also
						// numerically zero.
						if (bySet && i !== matchedCount) {
							j = 0;
							while (matcher = setMatchers[j++]) {
								matcher(unmatched, setMatched, context, xml);
							}

							if (seed) {
								// Reintegrate element matches to eliminate the need for sorting
								if (matchedCount > 0) {
									while (i--) {
										if (!(unmatched[i] || setMatched[i])) {
											setMatched[i] = pop.call(results);
										}
									}
								}

								// Discard index placeholder values to get only actual matches
								setMatched = condense(setMatched);
							}

							// Add matches to results
							push.apply(results, setMatched);

							// Seedless set matches succeeding multiple successful matchers stipulate sorting
							if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {

								Sizzle.uniqueSort(results);
							}
						}

						// Override manipulation of globals by nested matchers
						if (outermost) {
							dirruns = dirrunsUnique;
							outermostContext = contextBackup;
						}

						return unmatched;
					};

					return bySet ? markFunction(superMatcher) : superMatcher;
				}

				compile = Sizzle.compile = function (selector, match /* Internal Use Only */) {
					var i,
					    setMatchers = [],
					    elementMatchers = [],
					    cached = compilerCache[selector + " "];

					if (!cached) {
						// Generate a function of recursive functions that can be used to check each element
						if (!match) {
							match = tokenize(selector);
						}
						i = match.length;
						while (i--) {
							cached = matcherFromTokens(match[i]);
							if (cached[expando]) {
								setMatchers.push(cached);
							} else {
								elementMatchers.push(cached);
							}
						}

						// Cache the compiled function
						cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers));

						// Save selector and tokenization
						cached.selector = selector;
					}
					return cached;
				};

				/**
     * A low-level selection function that works with Sizzle's compiled
     *  selector functions
     * @param {String|Function} selector A selector or a pre-compiled
     *  selector function built with Sizzle.compile
     * @param {Element} context
     * @param {Array} [results]
     * @param {Array} [seed] A set of elements to match against
     */
				select = Sizzle.select = function (selector, context, results, seed) {
					var i,
					    tokens,
					    token,
					    type,
					    find,
					    compiled = typeof selector === "function" && selector,
					    match = !seed && tokenize(selector = compiled.selector || selector);

					results = results || [];

					// Try to minimize operations if there is only one selector in the list and no seed
					// (the latter of which guarantees us context)
					if (match.length === 1) {

						// Reduce context if the leading compound selector is an ID
						tokens = match[0] = match[0].slice(0);
						if (tokens.length > 2 && (token = tokens[0]).type === "ID" && context.nodeType === 9 && documentIsHTML && Expr.relative[tokens[1].type]) {

							context = (Expr.find["ID"](token.matches[0].replace(runescape, funescape), context) || [])[0];
							if (!context) {
								return results;

								// Precompiled matchers will still verify ancestry, so step up a level
							} else if (compiled) {
								context = context.parentNode;
							}

							selector = selector.slice(tokens.shift().value.length);
						}

						// Fetch a seed set for right-to-left matching
						i = matchExpr["needsContext"].test(selector) ? 0 : tokens.length;
						while (i--) {
							token = tokens[i];

							// Abort if we hit a combinator
							if (Expr.relative[type = token.type]) {
								break;
							}
							if (find = Expr.find[type]) {
								// Search, expanding context for leading sibling combinators
								if (seed = find(token.matches[0].replace(runescape, funescape), rsibling.test(tokens[0].type) && testContext(context.parentNode) || context)) {

									// If seed is empty or no tokens remain, we can return early
									tokens.splice(i, 1);
									selector = seed.length && toSelector(tokens);
									if (!selector) {
										push.apply(results, seed);
										return results;
									}

									break;
								}
							}
						}
					}

					// Compile and execute a filtering function if one is not provided
					// Provide `match` to avoid retokenization if we modified the selector above
					(compiled || compile(selector, match))(seed, context, !documentIsHTML, results, !context || rsibling.test(selector) && testContext(context.parentNode) || context);
					return results;
				};

				// One-time assignments

				// Sort stability
				support.sortStable = expando.split("").sort(sortOrder).join("") === expando;

				// Support: Chrome 14-35+
				// Always assume duplicates if they aren't passed to the comparison function
				support.detectDuplicates = !!hasDuplicate;

				// Initialize against the default document
				setDocument();

				// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
				// Detached nodes confoundingly follow *each other*
				support.sortDetached = assert(function (el) {
					// Should return 1, but returns 4 (following)
					return el.compareDocumentPosition(document.createElement("fieldset")) & 1;
				});

				// Support: IE<8
				// Prevent attribute/property "interpolation"
				// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
				if (!assert(function (el) {
					el.innerHTML = "<a href='#'></a>";
					return el.firstChild.getAttribute("href") === "#";
				})) {
					addHandle("type|href|height|width", function (elem, name, isXML) {
						if (!isXML) {
							return elem.getAttribute(name, name.toLowerCase() === "type" ? 1 : 2);
						}
					});
				}

				// Support: IE<9
				// Use defaultValue in place of getAttribute("value")
				if (!support.attributes || !assert(function (el) {
					el.innerHTML = "<input/>";
					el.firstChild.setAttribute("value", "");
					return el.firstChild.getAttribute("value") === "";
				})) {
					addHandle("value", function (elem, name, isXML) {
						if (!isXML && elem.nodeName.toLowerCase() === "input") {
							return elem.defaultValue;
						}
					});
				}

				// Support: IE<9
				// Use getAttributeNode to fetch booleans when getAttribute lies
				if (!assert(function (el) {
					return el.getAttribute("disabled") == null;
				})) {
					addHandle(booleans, function (elem, name, isXML) {
						var val;
						if (!isXML) {
							return elem[name] === true ? name.toLowerCase() : (val = elem.getAttributeNode(name)) && val.specified ? val.value : null;
						}
					});
				}

				return Sizzle;
			}(window);

			jQuery.find = Sizzle;
			jQuery.expr = Sizzle.selectors;

			// Deprecated
			jQuery.expr[":"] = jQuery.expr.pseudos;
			jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
			jQuery.text = Sizzle.getText;
			jQuery.isXMLDoc = Sizzle.isXML;
			jQuery.contains = Sizzle.contains;
			jQuery.escapeSelector = Sizzle.escape;

			var dir = function (elem, dir, until) {
				var matched = [],
				    truncate = until !== undefined;

				while ((elem = elem[dir]) && elem.nodeType !== 9) {
					if (elem.nodeType === 1) {
						if (truncate && jQuery(elem).is(until)) {
							break;
						}
						matched.push(elem);
					}
				}
				return matched;
			};

			var siblings = function (n, elem) {
				var matched = [];

				for (; n; n = n.nextSibling) {
					if (n.nodeType === 1 && n !== elem) {
						matched.push(n);
					}
				}

				return matched;
			};

			var rneedsContext = jQuery.expr.match.needsContext;

			function nodeName(elem, name) {

				return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
			};
			var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;

			var risSimple = /^.[^:#\[\.,]*$/;

			// Implement the identical functionality for filter and not
			function winnow(elements, qualifier, not) {
				if (jQuery.isFunction(qualifier)) {
					return jQuery.grep(elements, function (elem, i) {
						return !!qualifier.call(elem, i, elem) !== not;
					});
				}

				// Single element
				if (qualifier.nodeType) {
					return jQuery.grep(elements, function (elem) {
						return elem === qualifier !== not;
					});
				}

				// Arraylike of elements (jQuery, arguments, Array)
				if (typeof qualifier !== "string") {
					return jQuery.grep(elements, function (elem) {
						return indexOf.call(qualifier, elem) > -1 !== not;
					});
				}

				// Simple selector that can be filtered directly, removing non-Elements
				if (risSimple.test(qualifier)) {
					return jQuery.filter(qualifier, elements, not);
				}

				// Complex selector, compare the two sets, removing non-Elements
				qualifier = jQuery.filter(qualifier, elements);
				return jQuery.grep(elements, function (elem) {
					return indexOf.call(qualifier, elem) > -1 !== not && elem.nodeType === 1;
				});
			}

			jQuery.filter = function (expr, elems, not) {
				var elem = elems[0];

				if (not) {
					expr = ":not(" + expr + ")";
				}

				if (elems.length === 1 && elem.nodeType === 1) {
					return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
				}

				return jQuery.find.matches(expr, jQuery.grep(elems, function (elem) {
					return elem.nodeType === 1;
				}));
			};

			jQuery.fn.extend({
				find: function (selector) {
					var i,
					    ret,
					    len = this.length,
					    self = this;

					if (typeof selector !== "string") {
						return this.pushStack(jQuery(selector).filter(function () {
							for (i = 0; i < len; i++) {
								if (jQuery.contains(self[i], this)) {
									return true;
								}
							}
						}));
					}

					ret = this.pushStack([]);

					for (i = 0; i < len; i++) {
						jQuery.find(selector, self[i], ret);
					}

					return len > 1 ? jQuery.uniqueSort(ret) : ret;
				},
				filter: function (selector) {
					return this.pushStack(winnow(this, selector || [], false));
				},
				not: function (selector) {
					return this.pushStack(winnow(this, selector || [], true));
				},
				is: function (selector) {
					return !!winnow(this,

					// If this is a positional/relative selector, check membership in the returned set
					// so $("p:first").is("p:last") won't return true for a doc with two "p".
					typeof selector === "string" && rneedsContext.test(selector) ? jQuery(selector) : selector || [], false).length;
				}
			});

			// Initialize a jQuery object


			// A central reference to the root jQuery(document)
			var rootjQuery,


			// A simple way to check for HTML strings
			// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
			// Strict HTML recognition (#11290: must start with <)
			// Shortcut simple #id case for speed
			rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
			    init = jQuery.fn.init = function (selector, context, root) {
				var match, elem;

				// HANDLE: $(""), $(null), $(undefined), $(false)
				if (!selector) {
					return this;
				}

				// Method init() accepts an alternate rootjQuery
				// so migrate can support jQuery.sub (gh-2101)
				root = root || rootjQuery;

				// Handle HTML strings
				if (typeof selector === "string") {
					if (selector[0] === "<" && selector[selector.length - 1] === ">" && selector.length >= 3) {

						// Assume that strings that start and end with <> are HTML and skip the regex check
						match = [null, selector, null];
					} else {
						match = rquickExpr.exec(selector);
					}

					// Match html or make sure no context is specified for #id
					if (match && (match[1] || !context)) {

						// HANDLE: $(html) -> $(array)
						if (match[1]) {
							context = context instanceof jQuery ? context[0] : context;

							// Option to run scripts is true for back-compat
							// Intentionally let the error be thrown if parseHTML is not present
							jQuery.merge(this, jQuery.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));

							// HANDLE: $(html, props)
							if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
								for (match in context) {

									// Properties of context are called as methods if possible
									if (jQuery.isFunction(this[match])) {
										this[match](context[match]);

										// ...and otherwise set as attributes
									} else {
										this.attr(match, context[match]);
									}
								}
							}

							return this;

							// HANDLE: $(#id)
						} else {
							elem = document.getElementById(match[2]);

							if (elem) {

								// Inject the element directly into the jQuery object
								this[0] = elem;
								this.length = 1;
							}
							return this;
						}

						// HANDLE: $(expr, $(...))
					} else if (!context || context.jquery) {
						return (context || root).find(selector);

						// HANDLE: $(expr, context)
						// (which is just equivalent to: $(context).find(expr)
					} else {
						return this.constructor(context).find(selector);
					}

					// HANDLE: $(DOMElement)
				} else if (selector.nodeType) {
					this[0] = selector;
					this.length = 1;
					return this;

					// HANDLE: $(function)
					// Shortcut for document ready
				} else if (jQuery.isFunction(selector)) {
					return root.ready !== undefined ? root.ready(selector) :

					// Execute immediately if ready is not present
					selector(jQuery);
				}

				return jQuery.makeArray(selector, this);
			};

			// Give the init function the jQuery prototype for later instantiation
			init.prototype = jQuery.fn;

			// Initialize central reference
			rootjQuery = jQuery(document);

			var rparentsprev = /^(?:parents|prev(?:Until|All))/,


			// Methods guaranteed to produce a unique set when starting from a unique set
			guaranteedUnique = {
				children: true,
				contents: true,
				next: true,
				prev: true
			};

			jQuery.fn.extend({
				has: function (target) {
					var targets = jQuery(target, this),
					    l = targets.length;

					return this.filter(function () {
						var i = 0;
						for (; i < l; i++) {
							if (jQuery.contains(this, targets[i])) {
								return true;
							}
						}
					});
				},

				closest: function (selectors, context) {
					var cur,
					    i = 0,
					    l = this.length,
					    matched = [],
					    targets = typeof selectors !== "string" && jQuery(selectors);

					// Positional selectors never match, since there's no _selection_ context
					if (!rneedsContext.test(selectors)) {
						for (; i < l; i++) {
							for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {

								// Always skip document fragments
								if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 :

								// Don't pass non-elements to Sizzle
								cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))) {

									matched.push(cur);
									break;
								}
							}
						}
					}

					return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
				},

				// Determine the position of an element within the set
				index: function (elem) {

					// No argument, return index in parent
					if (!elem) {
						return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
					}

					// Index in selector
					if (typeof elem === "string") {
						return indexOf.call(jQuery(elem), this[0]);
					}

					// Locate the position of the desired element
					return indexOf.call(this,

					// If it receives a jQuery object, the first element is used
					elem.jquery ? elem[0] : elem);
				},

				add: function (selector, context) {
					return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))));
				},

				addBack: function (selector) {
					return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
				}
			});

			function sibling(cur, dir) {
				while ((cur = cur[dir]) && cur.nodeType !== 1) {}
				return cur;
			}

			jQuery.each({
				parent: function (elem) {
					var parent = elem.parentNode;
					return parent && parent.nodeType !== 11 ? parent : null;
				},
				parents: function (elem) {
					return dir(elem, "parentNode");
				},
				parentsUntil: function (elem, i, until) {
					return dir(elem, "parentNode", until);
				},
				next: function (elem) {
					return sibling(elem, "nextSibling");
				},
				prev: function (elem) {
					return sibling(elem, "previousSibling");
				},
				nextAll: function (elem) {
					return dir(elem, "nextSibling");
				},
				prevAll: function (elem) {
					return dir(elem, "previousSibling");
				},
				nextUntil: function (elem, i, until) {
					return dir(elem, "nextSibling", until);
				},
				prevUntil: function (elem, i, until) {
					return dir(elem, "previousSibling", until);
				},
				siblings: function (elem) {
					return siblings((elem.parentNode || {}).firstChild, elem);
				},
				children: function (elem) {
					return siblings(elem.firstChild);
				},
				contents: function (elem) {
					if (nodeName(elem, "iframe")) {
						return elem.contentDocument;
					}

					// Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
					// Treat the template element as a regular one in browsers that
					// don't support it.
					if (nodeName(elem, "template")) {
						elem = elem.content || elem;
					}

					return jQuery.merge([], elem.childNodes);
				}
			}, function (name, fn) {
				jQuery.fn[name] = function (until, selector) {
					var matched = jQuery.map(this, fn, until);

					if (name.slice(-5) !== "Until") {
						selector = until;
					}

					if (selector && typeof selector === "string") {
						matched = jQuery.filter(selector, matched);
					}

					if (this.length > 1) {

						// Remove duplicates
						if (!guaranteedUnique[name]) {
							jQuery.uniqueSort(matched);
						}

						// Reverse order for parents* and prev-derivatives
						if (rparentsprev.test(name)) {
							matched.reverse();
						}
					}

					return this.pushStack(matched);
				};
			});
			var rnothtmlwhite = /[^\x20\t\r\n\f]+/g;

			// Convert String-formatted options into Object-formatted ones
			function createOptions(options) {
				var object = {};
				jQuery.each(options.match(rnothtmlwhite) || [], function (_, flag) {
					object[flag] = true;
				});
				return object;
			}

			/*
    * Create a callback list using the following parameters:
    *
    *	options: an optional list of space-separated options that will change how
    *			the callback list behaves or a more traditional option object
    *
    * By default a callback list will act like an event callback list and can be
    * "fired" multiple times.
    *
    * Possible options:
    *
    *	once:			will ensure the callback list can only be fired once (like a Deferred)
    *
    *	memory:			will keep track of previous values and will call any callback added
    *					after the list has been fired right away with the latest "memorized"
    *					values (like a Deferred)
    *
    *	unique:			will ensure a callback can only be added once (no duplicate in the list)
    *
    *	stopOnFalse:	interrupt callings when a callback returns false
    *
    */
			jQuery.Callbacks = function (options) {

				// Convert options from String-formatted to Object-formatted if needed
				// (we check in cache first)
				options = typeof options === "string" ? createOptions(options) : jQuery.extend({}, options);

				var // Flag to know if list is currently firing
				firing,


				// Last fire value for non-forgettable lists
				memory,


				// Flag to know if list was already fired
				fired,


				// Flag to prevent firing
				locked,


				// Actual callback list
				list = [],


				// Queue of execution data for repeatable lists
				queue = [],


				// Index of currently firing callback (modified by add/remove as needed)
				firingIndex = -1,


				// Fire callbacks
				fire = function () {

					// Enforce single-firing
					locked = locked || options.once;

					// Execute callbacks for all pending executions,
					// respecting firingIndex overrides and runtime changes
					fired = firing = true;
					for (; queue.length; firingIndex = -1) {
						memory = queue.shift();
						while (++firingIndex < list.length) {

							// Run callback and check for early termination
							if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {

								// Jump to end and forget the data so .add doesn't re-fire
								firingIndex = list.length;
								memory = false;
							}
						}
					}

					// Forget the data if we're done with it
					if (!options.memory) {
						memory = false;
					}

					firing = false;

					// Clean up if we're done firing for good
					if (locked) {

						// Keep an empty list if we have data for future add calls
						if (memory) {
							list = [];

							// Otherwise, this object is spent
						} else {
							list = "";
						}
					}
				},


				// Actual Callbacks object
				self = {

					// Add a callback or a collection of callbacks to the list
					add: function () {
						if (list) {

							// If we have memory from a past run, we should fire after adding
							if (memory && !firing) {
								firingIndex = list.length - 1;
								queue.push(memory);
							}

							(function add(args) {
								jQuery.each(args, function (_, arg) {
									if (jQuery.isFunction(arg)) {
										if (!options.unique || !self.has(arg)) {
											list.push(arg);
										}
									} else if (arg && arg.length && jQuery.type(arg) !== "string") {

										// Inspect recursively
										add(arg);
									}
								});
							})(arguments);

							if (memory && !firing) {
								fire();
							}
						}
						return this;
					},

					// Remove a callback from the list
					remove: function () {
						jQuery.each(arguments, function (_, arg) {
							var index;
							while ((index = jQuery.inArray(arg, list, index)) > -1) {
								list.splice(index, 1);

								// Handle firing indexes
								if (index <= firingIndex) {
									firingIndex--;
								}
							}
						});
						return this;
					},

					// Check if a given callback is in the list.
					// If no argument is given, return whether or not list has callbacks attached.
					has: function (fn) {
						return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
					},

					// Remove all callbacks from the list
					empty: function () {
						if (list) {
							list = [];
						}
						return this;
					},

					// Disable .fire and .add
					// Abort any current/pending executions
					// Clear all callbacks and values
					disable: function () {
						locked = queue = [];
						list = memory = "";
						return this;
					},
					disabled: function () {
						return !list;
					},

					// Disable .fire
					// Also disable .add unless we have memory (since it would have no effect)
					// Abort any pending executions
					lock: function () {
						locked = queue = [];
						if (!memory && !firing) {
							list = memory = "";
						}
						return this;
					},
					locked: function () {
						return !!locked;
					},

					// Call all callbacks with the given context and arguments
					fireWith: function (context, args) {
						if (!locked) {
							args = args || [];
							args = [context, args.slice ? args.slice() : args];
							queue.push(args);
							if (!firing) {
								fire();
							}
						}
						return this;
					},

					// Call all the callbacks with the given arguments
					fire: function () {
						self.fireWith(this, arguments);
						return this;
					},

					// To know if the callbacks have already been called at least once
					fired: function () {
						return !!fired;
					}
				};

				return self;
			};

			function Identity(v) {
				return v;
			}
			function Thrower(ex) {
				throw ex;
			}

			function adoptValue(value, resolve, reject, noValue) {
				var method;

				try {

					// Check for promise aspect first to privilege synchronous behavior
					if (value && jQuery.isFunction(method = value.promise)) {
						method.call(value).done(resolve).fail(reject);

						// Other thenables
					} else if (value && jQuery.isFunction(method = value.then)) {
						method.call(value, resolve, reject);

						// Other non-thenables
					} else {

						// Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
						// * false: [ value ].slice( 0 ) => resolve( value )
						// * true: [ value ].slice( 1 ) => resolve()
						resolve.apply(undefined, [value].slice(noValue));
					}

					// For Promises/A+, convert exceptions into rejections
					// Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
					// Deferred#then to conditionally suppress rejection.
				} catch (value) {

					// Support: Android 4.0 only
					// Strict mode functions invoked without .call/.apply get global-object context
					reject.apply(undefined, [value]);
				}
			}

			jQuery.extend({

				Deferred: function (func) {
					var tuples = [

					// action, add listener, callbacks,
					// ... .then handlers, argument index, [final state]
					["notify", "progress", jQuery.Callbacks("memory"), jQuery.Callbacks("memory"), 2], ["resolve", "done", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 0, "resolved"], ["reject", "fail", jQuery.Callbacks("once memory"), jQuery.Callbacks("once memory"), 1, "rejected"]],
					    state = "pending",
					    promise = {
						state: function () {
							return state;
						},
						always: function () {
							deferred.done(arguments).fail(arguments);
							return this;
						},
						"catch": function (fn) {
							return promise.then(null, fn);
						},

						// Keep pipe for back-compat
						pipe: function () /* fnDone, fnFail, fnProgress */{
							var fns = arguments;

							return jQuery.Deferred(function (newDefer) {
								jQuery.each(tuples, function (i, tuple) {

									// Map tuples (progress, done, fail) to arguments (done, fail, progress)
									var fn = jQuery.isFunction(fns[tuple[4]]) && fns[tuple[4]];

									// deferred.progress(function() { bind to newDefer or newDefer.notify })
									// deferred.done(function() { bind to newDefer or newDefer.resolve })
									// deferred.fail(function() { bind to newDefer or newDefer.reject })
									deferred[tuple[1]](function () {
										var returned = fn && fn.apply(this, arguments);
										if (returned && jQuery.isFunction(returned.promise)) {
											returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
										} else {
											newDefer[tuple[0] + "With"](this, fn ? [returned] : arguments);
										}
									});
								});
								fns = null;
							}).promise();
						},
						then: function (onFulfilled, onRejected, onProgress) {
							var maxDepth = 0;
							function resolve(depth, deferred, handler, special) {
								return function () {
									var that = this,
									    args = arguments,
									    mightThrow = function () {
										var returned, then;

										// Support: Promises/A+ section 2.3.3.3.3
										// https://promisesaplus.com/#point-59
										// Ignore double-resolution attempts
										if (depth < maxDepth) {
											return;
										}

										returned = handler.apply(that, args);

										// Support: Promises/A+ section 2.3.1
										// https://promisesaplus.com/#point-48
										if (returned === deferred.promise()) {
											throw new TypeError("Thenable self-resolution");
										}

										// Support: Promises/A+ sections 2.3.3.1, 3.5
										// https://promisesaplus.com/#point-54
										// https://promisesaplus.com/#point-75
										// Retrieve `then` only once
										then = returned && (

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										typeof returned === "object" || typeof returned === "function") && returned.then;

										// Handle a returned thenable
										if (jQuery.isFunction(then)) {

											// Special processors (notify) just wait for resolution
											if (special) {
												then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special));

												// Normal processors (resolve) also hook into progress
											} else {

												// ...and disregard older resolution values
												maxDepth++;

												then.call(returned, resolve(maxDepth, deferred, Identity, special), resolve(maxDepth, deferred, Thrower, special), resolve(maxDepth, deferred, Identity, deferred.notifyWith));
											}

											// Handle all other returned values
										} else {

											// Only substitute handlers pass on context
											// and multiple values (non-spec behavior)
											if (handler !== Identity) {
												that = undefined;
												args = [returned];
											}

											// Process the value(s)
											// Default process is resolve
											(special || deferred.resolveWith)(that, args);
										}
									},


									// Only normal processors (resolve) catch and reject exceptions
									process = special ? mightThrow : function () {
										try {
											mightThrow();
										} catch (e) {

											if (jQuery.Deferred.exceptionHook) {
												jQuery.Deferred.exceptionHook(e, process.stackTrace);
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if (depth + 1 >= maxDepth) {

												// Only substitute handlers pass on context
												// and multiple values (non-spec behavior)
												if (handler !== Thrower) {
													that = undefined;
													args = [e];
												}

												deferred.rejectWith(that, args);
											}
										}
									};

									// Support: Promises/A+ section 2.3.3.3.1
									// https://promisesaplus.com/#point-57
									// Re-resolve promises immediately to dodge false rejection from
									// subsequent errors
									if (depth) {
										process();
									} else {

										// Call an optional hook to record the stack, in case of exception
										// since it's otherwise lost when execution goes async
										if (jQuery.Deferred.getStackHook) {
											process.stackTrace = jQuery.Deferred.getStackHook();
										}
										window.setTimeout(process);
									}
								};
							}

							return jQuery.Deferred(function (newDefer) {

								// progress_handlers.add( ... )
								tuples[0][3].add(resolve(0, newDefer, jQuery.isFunction(onProgress) ? onProgress : Identity, newDefer.notifyWith));

								// fulfilled_handlers.add( ... )
								tuples[1][3].add(resolve(0, newDefer, jQuery.isFunction(onFulfilled) ? onFulfilled : Identity));

								// rejected_handlers.add( ... )
								tuples[2][3].add(resolve(0, newDefer, jQuery.isFunction(onRejected) ? onRejected : Thrower));
							}).promise();
						},

						// Get a promise for this deferred
						// If obj is provided, the promise aspect is added to the object
						promise: function (obj) {
							return obj != null ? jQuery.extend(obj, promise) : promise;
						}
					},
					    deferred = {};

					// Add list-specific methods
					jQuery.each(tuples, function (i, tuple) {
						var list = tuple[2],
						    stateString = tuple[5];

						// promise.progress = list.add
						// promise.done = list.add
						// promise.fail = list.add
						promise[tuple[1]] = list.add;

						// Handle state
						if (stateString) {
							list.add(function () {

								// state = "resolved" (i.e., fulfilled)
								// state = "rejected"
								state = stateString;
							},

							// rejected_callbacks.disable
							// fulfilled_callbacks.disable
							tuples[3 - i][2].disable,

							// progress_callbacks.lock
							tuples[0][2].lock);
						}

						// progress_handlers.fire
						// fulfilled_handlers.fire
						// rejected_handlers.fire
						list.add(tuple[3].fire);

						// deferred.notify = function() { deferred.notifyWith(...) }
						// deferred.resolve = function() { deferred.resolveWith(...) }
						// deferred.reject = function() { deferred.rejectWith(...) }
						deferred[tuple[0]] = function () {
							deferred[tuple[0] + "With"](this === deferred ? undefined : this, arguments);
							return this;
						};

						// deferred.notifyWith = list.fireWith
						// deferred.resolveWith = list.fireWith
						// deferred.rejectWith = list.fireWith
						deferred[tuple[0] + "With"] = list.fireWith;
					});

					// Make the deferred a promise
					promise.promise(deferred);

					// Call given func if any
					if (func) {
						func.call(deferred, deferred);
					}

					// All done!
					return deferred;
				},

				// Deferred helper
				when: function (singleValue) {
					var

					// count of uncompleted subordinates
					remaining = arguments.length,


					// count of unprocessed arguments
					i = remaining,


					// subordinate fulfillment data
					resolveContexts = Array(i),
					    resolveValues = slice.call(arguments),


					// the master Deferred
					master = jQuery.Deferred(),


					// subordinate callback factory
					updateFunc = function (i) {
						return function (value) {
							resolveContexts[i] = this;
							resolveValues[i] = arguments.length > 1 ? slice.call(arguments) : value;
							if (! --remaining) {
								master.resolveWith(resolveContexts, resolveValues);
							}
						};
					};

					// Single- and empty arguments are adopted like Promise.resolve
					if (remaining <= 1) {
						adoptValue(singleValue, master.done(updateFunc(i)).resolve, master.reject, !remaining);

						// Use .then() to unwrap secondary thenables (cf. gh-3000)
						if (master.state() === "pending" || jQuery.isFunction(resolveValues[i] && resolveValues[i].then)) {

							return master.then();
						}
					}

					// Multiple arguments are aggregated like Promise.all array elements
					while (i--) {
						adoptValue(resolveValues[i], updateFunc(i), master.reject);
					}

					return master.promise();
				}
			});

			// These usually indicate a programmer mistake during development,
			// warn about them ASAP rather than swallowing them by default.
			var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

			jQuery.Deferred.exceptionHook = function (error, stack) {

				// Support: IE 8 - 9 only
				// Console exists when dev tools are open, which can happen at any time
				if (window.console && window.console.warn && error && rerrorNames.test(error.name)) {
					window.console.warn("jQuery.Deferred exception: " + error.message, error.stack, stack);
				}
			};

			jQuery.readyException = function (error) {
				window.setTimeout(function () {
					throw error;
				});
			};

			// The deferred used on DOM ready
			var readyList = jQuery.Deferred();

			jQuery.fn.ready = function (fn) {

				readyList.then(fn)

				// Wrap jQuery.readyException in a function so that the lookup
				// happens at the time of error handling instead of callback
				// registration.
				.catch(function (error) {
					jQuery.readyException(error);
				});

				return this;
			};

			jQuery.extend({

				// Is the DOM ready to be used? Set to true once it occurs.
				isReady: false,

				// A counter to track how many items to wait for before
				// the ready event fires. See #6781
				readyWait: 1,

				// Handle when the DOM is ready
				ready: function (wait) {

					// Abort if there are pending holds or we're already ready
					if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
						return;
					}

					// Remember that the DOM is ready
					jQuery.isReady = true;

					// If a normal DOM Ready event fired, decrement, and wait if need be
					if (wait !== true && --jQuery.readyWait > 0) {
						return;
					}

					// If there are functions bound, to execute
					readyList.resolveWith(document, [jQuery]);
				}
			});

			jQuery.ready.then = readyList.then;

			// The ready event handler and self cleanup method
			function completed() {
				document.removeEventListener("DOMContentLoaded", completed);
				window.removeEventListener("load", completed);
				jQuery.ready();
			}

			// Catch cases where $(document).ready() is called
			// after the browser event has already occurred.
			// Support: IE <=9 - 10 only
			// Older IE sometimes signals "interactive" too soon
			if (document.readyState === "complete" || document.readyState !== "loading" && !document.documentElement.doScroll) {

				// Handle it asynchronously to allow scripts the opportunity to delay ready
				window.setTimeout(jQuery.ready);
			} else {

				// Use the handy event callback
				document.addEventListener("DOMContentLoaded", completed);

				// A fallback to window.onload, that will always work
				window.addEventListener("load", completed);
			}

			// Multifunctional method to get and set values of a collection
			// The value/s can optionally be executed if it's a function
			var access = function (elems, fn, key, value, chainable, emptyGet, raw) {
				var i = 0,
				    len = elems.length,
				    bulk = key == null;

				// Sets many values
				if (jQuery.type(key) === "object") {
					chainable = true;
					for (i in key) {
						access(elems, fn, i, key[i], true, emptyGet, raw);
					}

					// Sets one value
				} else if (value !== undefined) {
					chainable = true;

					if (!jQuery.isFunction(value)) {
						raw = true;
					}

					if (bulk) {

						// Bulk operations run against the entire set
						if (raw) {
							fn.call(elems, value);
							fn = null;

							// ...except when executing function values
						} else {
							bulk = fn;
							fn = function (elem, key, value) {
								return bulk.call(jQuery(elem), value);
							};
						}
					}

					if (fn) {
						for (; i < len; i++) {
							fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
						}
					}
				}

				if (chainable) {
					return elems;
				}

				// Gets
				if (bulk) {
					return fn.call(elems);
				}

				return len ? fn(elems[0], key) : emptyGet;
			};
			var acceptData = function (owner) {

				// Accepts only:
				//  - Node
				//    - Node.ELEMENT_NODE
				//    - Node.DOCUMENT_NODE
				//  - Object
				//    - Any
				return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
			};

			function Data() {
				this.expando = jQuery.expando + Data.uid++;
			}

			Data.uid = 1;

			Data.prototype = {

				cache: function (owner) {

					// Check if the owner object already has a cache
					var value = owner[this.expando];

					// If not, create one
					if (!value) {
						value = {};

						// We can accept data for non-element nodes in modern browsers,
						// but we should not, see #8335.
						// Always return an empty object.
						if (acceptData(owner)) {

							// If it is a node unlikely to be stringify-ed or looped over
							// use plain assignment
							if (owner.nodeType) {
								owner[this.expando] = value;

								// Otherwise secure it in a non-enumerable property
								// configurable must be true to allow the property to be
								// deleted when data is removed
							} else {
								Object.defineProperty(owner, this.expando, {
									value: value,
									configurable: true
								});
							}
						}
					}

					return value;
				},
				set: function (owner, data, value) {
					var prop,
					    cache = this.cache(owner);

					// Handle: [ owner, key, value ] args
					// Always use camelCase key (gh-2257)
					if (typeof data === "string") {
						cache[jQuery.camelCase(data)] = value;

						// Handle: [ owner, { properties } ] args
					} else {

						// Copy the properties one-by-one to the cache object
						for (prop in data) {
							cache[jQuery.camelCase(prop)] = data[prop];
						}
					}
					return cache;
				},
				get: function (owner, key) {
					return key === undefined ? this.cache(owner) :

					// Always use camelCase key (gh-2257)
					owner[this.expando] && owner[this.expando][jQuery.camelCase(key)];
				},
				access: function (owner, key, value) {

					// In cases where either:
					//
					//   1. No key was specified
					//   2. A string key was specified, but no value provided
					//
					// Take the "read" path and allow the get method to determine
					// which value to return, respectively either:
					//
					//   1. The entire cache object
					//   2. The data stored at the key
					//
					if (key === undefined || key && typeof key === "string" && value === undefined) {

						return this.get(owner, key);
					}

					// When the key is not a string, or both a key and value
					// are specified, set or extend (existing objects) with either:
					//
					//   1. An object of properties
					//   2. A key and value
					//
					this.set(owner, key, value);

					// Since the "set" path can have two possible entry points
					// return the expected data based on which path was taken[*]
					return value !== undefined ? value : key;
				},
				remove: function (owner, key) {
					var i,
					    cache = owner[this.expando];

					if (cache === undefined) {
						return;
					}

					if (key !== undefined) {

						// Support array or space separated string of keys
						if (Array.isArray(key)) {

							// If key is an array of keys...
							// We always set camelCase keys, so remove that.
							key = key.map(jQuery.camelCase);
						} else {
							key = jQuery.camelCase(key);

							// If a key with the spaces exists, use it.
							// Otherwise, create an array by matching non-whitespace
							key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
						}

						i = key.length;

						while (i--) {
							delete cache[key[i]];
						}
					}

					// Remove the expando if there's no more data
					if (key === undefined || jQuery.isEmptyObject(cache)) {

						// Support: Chrome <=35 - 45
						// Webkit & Blink performance suffers when deleting properties
						// from DOM nodes, so set to undefined instead
						// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
						if (owner.nodeType) {
							owner[this.expando] = undefined;
						} else {
							delete owner[this.expando];
						}
					}
				},
				hasData: function (owner) {
					var cache = owner[this.expando];
					return cache !== undefined && !jQuery.isEmptyObject(cache);
				}
			};
			var dataPriv = new Data();

			var dataUser = new Data();

			//	Implementation Summary
			//
			//	1. Enforce API surface and semantic compatibility with 1.9.x branch
			//	2. Improve the module's maintainability by reducing the storage
			//		paths to a single mechanism.
			//	3. Use the same single mechanism to support "private" and "user" data.
			//	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
			//	5. Avoid exposing implementation details on user objects (eg. expando properties)
			//	6. Provide a clear path for implementation upgrade to WeakMap in 2014

			var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
			    rmultiDash = /[A-Z]/g;

			function getData(data) {
				if (data === "true") {
					return true;
				}

				if (data === "false") {
					return false;
				}

				if (data === "null") {
					return null;
				}

				// Only convert to a number if it doesn't change the string
				if (data === +data + "") {
					return +data;
				}

				if (rbrace.test(data)) {
					return JSON.parse(data);
				}

				return data;
			}

			function dataAttr(elem, key, data) {
				var name;

				// If nothing was found internally, try to fetch any
				// data from the HTML5 data-* attribute
				if (data === undefined && elem.nodeType === 1) {
					name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
					data = elem.getAttribute(name);

					if (typeof data === "string") {
						try {
							data = getData(data);
						} catch (e) {}

						// Make sure we set the data so it isn't changed later
						dataUser.set(elem, key, data);
					} else {
						data = undefined;
					}
				}
				return data;
			}

			jQuery.extend({
				hasData: function (elem) {
					return dataUser.hasData(elem) || dataPriv.hasData(elem);
				},

				data: function (elem, name, data) {
					return dataUser.access(elem, name, data);
				},

				removeData: function (elem, name) {
					dataUser.remove(elem, name);
				},

				// TODO: Now that all calls to _data and _removeData have been replaced
				// with direct calls to dataPriv methods, these can be deprecated.
				_data: function (elem, name, data) {
					return dataPriv.access(elem, name, data);
				},

				_removeData: function (elem, name) {
					dataPriv.remove(elem, name);
				}
			});

			jQuery.fn.extend({
				data: function (key, value) {
					var i,
					    name,
					    data,
					    elem = this[0],
					    attrs = elem && elem.attributes;

					// Gets all values
					if (key === undefined) {
						if (this.length) {
							data = dataUser.get(elem);

							if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
								i = attrs.length;
								while (i--) {

									// Support: IE 11 only
									// The attrs elements can be null (#14894)
									if (attrs[i]) {
										name = attrs[i].name;
										if (name.indexOf("data-") === 0) {
											name = jQuery.camelCase(name.slice(5));
											dataAttr(elem, name, data[name]);
										}
									}
								}
								dataPriv.set(elem, "hasDataAttrs", true);
							}
						}

						return data;
					}

					// Sets multiple values
					if (typeof key === "object") {
						return this.each(function () {
							dataUser.set(this, key);
						});
					}

					return access(this, function (value) {
						var data;

						// The calling jQuery object (element matches) is not empty
						// (and therefore has an element appears at this[ 0 ]) and the
						// `value` parameter was not undefined. An empty jQuery object
						// will result in `undefined` for elem = this[ 0 ] which will
						// throw an exception if an attempt to read a data cache is made.
						if (elem && value === undefined) {

							// Attempt to get data from the cache
							// The key will always be camelCased in Data
							data = dataUser.get(elem, key);
							if (data !== undefined) {
								return data;
							}

							// Attempt to "discover" the data in
							// HTML5 custom data-* attrs
							data = dataAttr(elem, key);
							if (data !== undefined) {
								return data;
							}

							// We tried really hard, but the data doesn't exist.
							return;
						}

						// Set the data...
						this.each(function () {

							// We always store the camelCased key
							dataUser.set(this, key, value);
						});
					}, null, value, arguments.length > 1, null, true);
				},

				removeData: function (key) {
					return this.each(function () {
						dataUser.remove(this, key);
					});
				}
			});

			jQuery.extend({
				queue: function (elem, type, data) {
					var queue;

					if (elem) {
						type = (type || "fx") + "queue";
						queue = dataPriv.get(elem, type);

						// Speed up dequeue by getting out quickly if this is just a lookup
						if (data) {
							if (!queue || Array.isArray(data)) {
								queue = dataPriv.access(elem, type, jQuery.makeArray(data));
							} else {
								queue.push(data);
							}
						}
						return queue || [];
					}
				},

				dequeue: function (elem, type) {
					type = type || "fx";

					var queue = jQuery.queue(elem, type),
					    startLength = queue.length,
					    fn = queue.shift(),
					    hooks = jQuery._queueHooks(elem, type),
					    next = function () {
						jQuery.dequeue(elem, type);
					};

					// If the fx queue is dequeued, always remove the progress sentinel
					if (fn === "inprogress") {
						fn = queue.shift();
						startLength--;
					}

					if (fn) {

						// Add a progress sentinel to prevent the fx queue from being
						// automatically dequeued
						if (type === "fx") {
							queue.unshift("inprogress");
						}

						// Clear up the last queue stop function
						delete hooks.stop;
						fn.call(elem, next, hooks);
					}

					if (!startLength && hooks) {
						hooks.empty.fire();
					}
				},

				// Not public - generate a queueHooks object, or return the current one
				_queueHooks: function (elem, type) {
					var key = type + "queueHooks";
					return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
						empty: jQuery.Callbacks("once memory").add(function () {
							dataPriv.remove(elem, [type + "queue", key]);
						})
					});
				}
			});

			jQuery.fn.extend({
				queue: function (type, data) {
					var setter = 2;

					if (typeof type !== "string") {
						data = type;
						type = "fx";
						setter--;
					}

					if (arguments.length < setter) {
						return jQuery.queue(this[0], type);
					}

					return data === undefined ? this : this.each(function () {
						var queue = jQuery.queue(this, type, data);

						// Ensure a hooks for this queue
						jQuery._queueHooks(this, type);

						if (type === "fx" && queue[0] !== "inprogress") {
							jQuery.dequeue(this, type);
						}
					});
				},
				dequeue: function (type) {
					return this.each(function () {
						jQuery.dequeue(this, type);
					});
				},
				clearQueue: function (type) {
					return this.queue(type || "fx", []);
				},

				// Get a promise resolved when queues of a certain type
				// are emptied (fx is the type by default)
				promise: function (type, obj) {
					var tmp,
					    count = 1,
					    defer = jQuery.Deferred(),
					    elements = this,
					    i = this.length,
					    resolve = function () {
						if (! --count) {
							defer.resolveWith(elements, [elements]);
						}
					};

					if (typeof type !== "string") {
						obj = type;
						type = undefined;
					}
					type = type || "fx";

					while (i--) {
						tmp = dataPriv.get(elements[i], type + "queueHooks");
						if (tmp && tmp.empty) {
							count++;
							tmp.empty.add(resolve);
						}
					}
					resolve();
					return defer.promise(obj);
				}
			});
			var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;

			var rcssNum = new RegExp("^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i");

			var cssExpand = ["Top", "Right", "Bottom", "Left"];

			var isHiddenWithinTree = function (elem, el) {

				// isHiddenWithinTree might be called from jQuery#filter function;
				// in that case, element will be second argument
				elem = el || elem;

				// Inline style trumps all
				return elem.style.display === "none" || elem.style.display === "" &&

				// Otherwise, check computed style
				// Support: Firefox <=43 - 45
				// Disconnected elements can have computed display: none, so first confirm that elem is
				// in the document.
				jQuery.contains(elem.ownerDocument, elem) && jQuery.css(elem, "display") === "none";
			};

			var swap = function (elem, options, callback, args) {
				var ret,
				    name,
				    old = {};

				// Remember the old values, and insert the new ones
				for (name in options) {
					old[name] = elem.style[name];
					elem.style[name] = options[name];
				}

				ret = callback.apply(elem, args || []);

				// Revert the old values
				for (name in options) {
					elem.style[name] = old[name];
				}

				return ret;
			};

			function adjustCSS(elem, prop, valueParts, tween) {
				var adjusted,
				    scale = 1,
				    maxIterations = 20,
				    currentValue = tween ? function () {
					return tween.cur();
				} : function () {
					return jQuery.css(elem, prop, "");
				},
				    initial = currentValue(),
				    unit = valueParts && valueParts[3] || (jQuery.cssNumber[prop] ? "" : "px"),


				// Starting value computation is required for potential unit mismatches
				initialInUnit = (jQuery.cssNumber[prop] || unit !== "px" && +initial) && rcssNum.exec(jQuery.css(elem, prop));

				if (initialInUnit && initialInUnit[3] !== unit) {

					// Trust units reported by jQuery.css
					unit = unit || initialInUnit[3];

					// Make sure we update the tween properties later on
					valueParts = valueParts || [];

					// Iteratively approximate from a nonzero starting point
					initialInUnit = +initial || 1;

					do {

						// If previous iteration zeroed out, double until we get *something*.
						// Use string for doubling so we don't accidentally see scale as unchanged below
						scale = scale || ".5";

						// Adjust and apply
						initialInUnit = initialInUnit / scale;
						jQuery.style(elem, prop, initialInUnit + unit);

						// Update scale, tolerating zero or NaN from tween.cur()
						// Break the loop if scale is unchanged or perfect, or if we've just had enough.
					} while (scale !== (scale = currentValue() / initial) && scale !== 1 && --maxIterations);
				}

				if (valueParts) {
					initialInUnit = +initialInUnit || +initial || 0;

					// Apply relative offset (+=/-=) if specified
					adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
					if (tween) {
						tween.unit = unit;
						tween.start = initialInUnit;
						tween.end = adjusted;
					}
				}
				return adjusted;
			}

			var defaultDisplayMap = {};

			function getDefaultDisplay(elem) {
				var temp,
				    doc = elem.ownerDocument,
				    nodeName = elem.nodeName,
				    display = defaultDisplayMap[nodeName];

				if (display) {
					return display;
				}

				temp = doc.body.appendChild(doc.createElement(nodeName));
				display = jQuery.css(temp, "display");

				temp.parentNode.removeChild(temp);

				if (display === "none") {
					display = "block";
				}
				defaultDisplayMap[nodeName] = display;

				return display;
			}

			function showHide(elements, show) {
				var display,
				    elem,
				    values = [],
				    index = 0,
				    length = elements.length;

				// Determine new display value for elements that need to change
				for (; index < length; index++) {
					elem = elements[index];
					if (!elem.style) {
						continue;
					}

					display = elem.style.display;
					if (show) {

						// Since we force visibility upon cascade-hidden elements, an immediate (and slow)
						// check is required in this first loop unless we have a nonempty display value (either
						// inline or about-to-be-restored)
						if (display === "none") {
							values[index] = dataPriv.get(elem, "display") || null;
							if (!values[index]) {
								elem.style.display = "";
							}
						}
						if (elem.style.display === "" && isHiddenWithinTree(elem)) {
							values[index] = getDefaultDisplay(elem);
						}
					} else {
						if (display !== "none") {
							values[index] = "none";

							// Remember what we're overwriting
							dataPriv.set(elem, "display", display);
						}
					}
				}

				// Set the display of the elements in a second loop to avoid constant reflow
				for (index = 0; index < length; index++) {
					if (values[index] != null) {
						elements[index].style.display = values[index];
					}
				}

				return elements;
			}

			jQuery.fn.extend({
				show: function () {
					return showHide(this, true);
				},
				hide: function () {
					return showHide(this);
				},
				toggle: function (state) {
					if (typeof state === "boolean") {
						return state ? this.show() : this.hide();
					}

					return this.each(function () {
						if (isHiddenWithinTree(this)) {
							jQuery(this).show();
						} else {
							jQuery(this).hide();
						}
					});
				}
			});
			var rcheckableType = /^(?:checkbox|radio)$/i;

			var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i;

			var rscriptType = /^$|\/(?:java|ecma)script/i;

			// We have to close these tags to support XHTML (#13200)
			var wrapMap = {

				// Support: IE <=9 only
				option: [1, "<select multiple='multiple'>", "</select>"],

				// XHTML parsers do not magically insert elements in the
				// same way that tag soup parsers do. So we cannot shorten
				// this by omitting <tbody> or other required elements.
				thead: [1, "<table>", "</table>"],
				col: [2, "<table><colgroup>", "</colgroup></table>"],
				tr: [2, "<table><tbody>", "</tbody></table>"],
				td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],

				_default: [0, "", ""]
			};

			// Support: IE <=9 only
			wrapMap.optgroup = wrapMap.option;

			wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
			wrapMap.th = wrapMap.td;

			function getAll(context, tag) {

				// Support: IE <=9 - 11 only
				// Use typeof to avoid zero-argument method invocation on host objects (#15151)
				var ret;

				if (typeof context.getElementsByTagName !== "undefined") {
					ret = context.getElementsByTagName(tag || "*");
				} else if (typeof context.querySelectorAll !== "undefined") {
					ret = context.querySelectorAll(tag || "*");
				} else {
					ret = [];
				}

				if (tag === undefined || tag && nodeName(context, tag)) {
					return jQuery.merge([context], ret);
				}

				return ret;
			}

			// Mark scripts as having already been evaluated
			function setGlobalEval(elems, refElements) {
				var i = 0,
				    l = elems.length;

				for (; i < l; i++) {
					dataPriv.set(elems[i], "globalEval", !refElements || dataPriv.get(refElements[i], "globalEval"));
				}
			}

			var rhtml = /<|&#?\w+;/;

			function buildFragment(elems, context, scripts, selection, ignored) {
				var elem,
				    tmp,
				    tag,
				    wrap,
				    contains,
				    j,
				    fragment = context.createDocumentFragment(),
				    nodes = [],
				    i = 0,
				    l = elems.length;

				for (; i < l; i++) {
					elem = elems[i];

					if (elem || elem === 0) {

						// Add nodes directly
						if (jQuery.type(elem) === "object") {

							// Support: Android <=4.0 only, PhantomJS 1 only
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge(nodes, elem.nodeType ? [elem] : elem);

							// Convert non-html into a text node
						} else if (!rhtml.test(elem)) {
							nodes.push(context.createTextNode(elem));

							// Convert html into DOM nodes
						} else {
							tmp = tmp || fragment.appendChild(context.createElement("div"));

							// Deserialize a standard representation
							tag = (rtagName.exec(elem) || ["", ""])[1].toLowerCase();
							wrap = wrapMap[tag] || wrapMap._default;
							tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2];

							// Descend through wrappers to the right content
							j = wrap[0];
							while (j--) {
								tmp = tmp.lastChild;
							}

							// Support: Android <=4.0 only, PhantomJS 1 only
							// push.apply(_, arraylike) throws on ancient WebKit
							jQuery.merge(nodes, tmp.childNodes);

							// Remember the top-level container
							tmp = fragment.firstChild;

							// Ensure the created nodes are orphaned (#12392)
							tmp.textContent = "";
						}
					}
				}

				// Remove wrapper from fragment
				fragment.textContent = "";

				i = 0;
				while (elem = nodes[i++]) {

					// Skip elements already in the context collection (trac-4087)
					if (selection && jQuery.inArray(elem, selection) > -1) {
						if (ignored) {
							ignored.push(elem);
						}
						continue;
					}

					contains = jQuery.contains(elem.ownerDocument, elem);

					// Append to fragment
					tmp = getAll(fragment.appendChild(elem), "script");

					// Preserve script evaluation history
					if (contains) {
						setGlobalEval(tmp);
					}

					// Capture executables
					if (scripts) {
						j = 0;
						while (elem = tmp[j++]) {
							if (rscriptType.test(elem.type || "")) {
								scripts.push(elem);
							}
						}
					}
				}

				return fragment;
			}

			(function () {
				var fragment = document.createDocumentFragment(),
				    div = fragment.appendChild(document.createElement("div")),
				    input = document.createElement("input");

				// Support: Android 4.0 - 4.3 only
				// Check state lost if the name is set (#11217)
				// Support: Windows Web Apps (WWA)
				// `name` and `type` must use .setAttribute for WWA (#14901)
				input.setAttribute("type", "radio");
				input.setAttribute("checked", "checked");
				input.setAttribute("name", "t");

				div.appendChild(input);

				// Support: Android <=4.1 only
				// Older WebKit doesn't clone checked state correctly in fragments
				support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;

				// Support: IE <=11 only
				// Make sure textarea (and checkbox) defaultValue is properly cloned
				div.innerHTML = "<textarea>x</textarea>";
				support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
			})();
			var documentElement = document.documentElement;

			var rkeyEvent = /^key/,
			    rmouseEvent = /^(?:mouse|pointer|contextmenu|drag|drop)|click/,
			    rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

			function returnTrue() {
				return true;
			}

			function returnFalse() {
				return false;
			}

			// Support: IE <=9 only
			// See #13393 for more info
			function safeActiveElement() {
				try {
					return document.activeElement;
				} catch (err) {}
			}

			function on(elem, types, selector, data, fn, one) {
				var origFn, type;

				// Types can be a map of types/handlers
				if (typeof types === "object") {

					// ( types-Object, selector, data )
					if (typeof selector !== "string") {

						// ( types-Object, data )
						data = data || selector;
						selector = undefined;
					}
					for (type in types) {
						on(elem, type, selector, data, types[type], one);
					}
					return elem;
				}

				if (data == null && fn == null) {

					// ( types, fn )
					fn = selector;
					data = selector = undefined;
				} else if (fn == null) {
					if (typeof selector === "string") {

						// ( types, selector, fn )
						fn = data;
						data = undefined;
					} else {

						// ( types, data, fn )
						fn = data;
						data = selector;
						selector = undefined;
					}
				}
				if (fn === false) {
					fn = returnFalse;
				} else if (!fn) {
					return elem;
				}

				if (one === 1) {
					origFn = fn;
					fn = function (event) {

						// Can use an empty set, since event contains the info
						jQuery().off(event);
						return origFn.apply(this, arguments);
					};

					// Use same guid so caller can remove using origFn
					fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
				}
				return elem.each(function () {
					jQuery.event.add(this, types, fn, data, selector);
				});
			}

			/*
    * Helper functions for managing events -- not part of the public interface.
    * Props to Dean Edwards' addEvent library for many of the ideas.
    */
			jQuery.event = {

				global: {},

				add: function (elem, types, handler, data, selector) {

					var handleObjIn,
					    eventHandle,
					    tmp,
					    events,
					    t,
					    handleObj,
					    special,
					    handlers,
					    type,
					    namespaces,
					    origType,
					    elemData = dataPriv.get(elem);

					// Don't attach events to noData or text/comment nodes (but allow plain objects)
					if (!elemData) {
						return;
					}

					// Caller can pass in an object of custom data in lieu of the handler
					if (handler.handler) {
						handleObjIn = handler;
						handler = handleObjIn.handler;
						selector = handleObjIn.selector;
					}

					// Ensure that invalid selectors throw exceptions at attach time
					// Evaluate against documentElement in case elem is a non-element node (e.g., document)
					if (selector) {
						jQuery.find.matchesSelector(documentElement, selector);
					}

					// Make sure that the handler has a unique ID, used to find/remove it later
					if (!handler.guid) {
						handler.guid = jQuery.guid++;
					}

					// Init the element's event structure and main handler, if this is the first
					if (!(events = elemData.events)) {
						events = elemData.events = {};
					}
					if (!(eventHandle = elemData.handle)) {
						eventHandle = elemData.handle = function (e) {

							// Discard the second event of a jQuery.event.trigger() and
							// when an event is called after a page has unloaded
							return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ? jQuery.event.dispatch.apply(elem, arguments) : undefined;
						};
					}

					// Handle multiple events separated by a space
					types = (types || "").match(rnothtmlwhite) || [""];
					t = types.length;
					while (t--) {
						tmp = rtypenamespace.exec(types[t]) || [];
						type = origType = tmp[1];
						namespaces = (tmp[2] || "").split(".").sort();

						// There *must* be a type, no attaching namespace-only handlers
						if (!type) {
							continue;
						}

						// If event changes its type, use the special event handlers for the changed type
						special = jQuery.event.special[type] || {};

						// If selector defined, determine special event api type, otherwise given type
						type = (selector ? special.delegateType : special.bindType) || type;

						// Update special based on newly reset type
						special = jQuery.event.special[type] || {};

						// handleObj is passed to all event handlers
						handleObj = jQuery.extend({
							type: type,
							origType: origType,
							data: data,
							handler: handler,
							guid: handler.guid,
							selector: selector,
							needsContext: selector && jQuery.expr.match.needsContext.test(selector),
							namespace: namespaces.join(".")
						}, handleObjIn);

						// Init the event handler queue if we're the first
						if (!(handlers = events[type])) {
							handlers = events[type] = [];
							handlers.delegateCount = 0;

							// Only use addEventListener if the special events handler returns false
							if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {

								if (elem.addEventListener) {
									elem.addEventListener(type, eventHandle);
								}
							}
						}

						if (special.add) {
							special.add.call(elem, handleObj);

							if (!handleObj.handler.guid) {
								handleObj.handler.guid = handler.guid;
							}
						}

						// Add to the element's handler list, delegates in front
						if (selector) {
							handlers.splice(handlers.delegateCount++, 0, handleObj);
						} else {
							handlers.push(handleObj);
						}

						// Keep track of which events have ever been used, for event optimization
						jQuery.event.global[type] = true;
					}
				},

				// Detach an event or set of events from an element
				remove: function (elem, types, handler, selector, mappedTypes) {

					var j,
					    origCount,
					    tmp,
					    events,
					    t,
					    handleObj,
					    special,
					    handlers,
					    type,
					    namespaces,
					    origType,
					    elemData = dataPriv.hasData(elem) && dataPriv.get(elem);

					if (!elemData || !(events = elemData.events)) {
						return;
					}

					// Once for each type.namespace in types; type may be omitted
					types = (types || "").match(rnothtmlwhite) || [""];
					t = types.length;
					while (t--) {
						tmp = rtypenamespace.exec(types[t]) || [];
						type = origType = tmp[1];
						namespaces = (tmp[2] || "").split(".").sort();

						// Unbind all events (on this namespace, if provided) for the element
						if (!type) {
							for (type in events) {
								jQuery.event.remove(elem, type + types[t], handler, selector, true);
							}
							continue;
						}

						special = jQuery.event.special[type] || {};
						type = (selector ? special.delegateType : special.bindType) || type;
						handlers = events[type] || [];
						tmp = tmp[2] && new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");

						// Remove matching events
						origCount = j = handlers.length;
						while (j--) {
							handleObj = handlers[j];

							if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) && (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
								handlers.splice(j, 1);

								if (handleObj.selector) {
									handlers.delegateCount--;
								}
								if (special.remove) {
									special.remove.call(elem, handleObj);
								}
							}
						}

						// Remove generic event handler if we removed something and no more handlers exist
						// (avoids potential for endless recursion during removal of special event handlers)
						if (origCount && !handlers.length) {
							if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {

								jQuery.removeEvent(elem, type, elemData.handle);
							}

							delete events[type];
						}
					}

					// Remove data and the expando if it's no longer used
					if (jQuery.isEmptyObject(events)) {
						dataPriv.remove(elem, "handle events");
					}
				},

				dispatch: function (nativeEvent) {

					// Make a writable jQuery.Event from the native event object
					var event = jQuery.event.fix(nativeEvent);

					var i,
					    j,
					    ret,
					    matched,
					    handleObj,
					    handlerQueue,
					    args = new Array(arguments.length),
					    handlers = (dataPriv.get(this, "events") || {})[event.type] || [],
					    special = jQuery.event.special[event.type] || {};

					// Use the fix-ed jQuery.Event rather than the (read-only) native event
					args[0] = event;

					for (i = 1; i < arguments.length; i++) {
						args[i] = arguments[i];
					}

					event.delegateTarget = this;

					// Call the preDispatch hook for the mapped type, and let it bail if desired
					if (special.preDispatch && special.preDispatch.call(this, event) === false) {
						return;
					}

					// Determine handlers
					handlerQueue = jQuery.event.handlers.call(this, event, handlers);

					// Run delegates first; they may want to stop propagation beneath us
					i = 0;
					while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
						event.currentTarget = matched.elem;

						j = 0;
						while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {

							// Triggered event must either 1) have no namespace, or 2) have namespace(s)
							// a subset or equal to those in the bound event (both can have no namespace).
							if (!event.rnamespace || event.rnamespace.test(handleObj.namespace)) {

								event.handleObj = handleObj;
								event.data = handleObj.data;

								ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);

								if (ret !== undefined) {
									if ((event.result = ret) === false) {
										event.preventDefault();
										event.stopPropagation();
									}
								}
							}
						}
					}

					// Call the postDispatch hook for the mapped type
					if (special.postDispatch) {
						special.postDispatch.call(this, event);
					}

					return event.result;
				},

				handlers: function (event, handlers) {
					var i,
					    handleObj,
					    sel,
					    matchedHandlers,
					    matchedSelectors,
					    handlerQueue = [],
					    delegateCount = handlers.delegateCount,
					    cur = event.target;

					// Find delegate handlers
					if (delegateCount &&

					// Support: IE <=9
					// Black-hole SVG <use> instance trees (trac-13180)
					cur.nodeType &&

					// Support: Firefox <=42
					// Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
					// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
					// Support: IE 11 only
					// ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
					!(event.type === "click" && event.button >= 1)) {

						for (; cur !== this; cur = cur.parentNode || this) {

							// Don't check non-elements (#13208)
							// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
							if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
								matchedHandlers = [];
								matchedSelectors = {};
								for (i = 0; i < delegateCount; i++) {
									handleObj = handlers[i];

									// Don't conflict with Object.prototype properties (#13203)
									sel = handleObj.selector + " ";

									if (matchedSelectors[sel] === undefined) {
										matchedSelectors[sel] = handleObj.needsContext ? jQuery(sel, this).index(cur) > -1 : jQuery.find(sel, this, null, [cur]).length;
									}
									if (matchedSelectors[sel]) {
										matchedHandlers.push(handleObj);
									}
								}
								if (matchedHandlers.length) {
									handlerQueue.push({ elem: cur, handlers: matchedHandlers });
								}
							}
						}
					}

					// Add the remaining (directly-bound) handlers
					cur = this;
					if (delegateCount < handlers.length) {
						handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
					}

					return handlerQueue;
				},

				addProp: function (name, hook) {
					Object.defineProperty(jQuery.Event.prototype, name, {
						enumerable: true,
						configurable: true,

						get: jQuery.isFunction(hook) ? function () {
							if (this.originalEvent) {
								return hook(this.originalEvent);
							}
						} : function () {
							if (this.originalEvent) {
								return this.originalEvent[name];
							}
						},

						set: function (value) {
							Object.defineProperty(this, name, {
								enumerable: true,
								configurable: true,
								writable: true,
								value: value
							});
						}
					});
				},

				fix: function (originalEvent) {
					return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
				},

				special: {
					load: {

						// Prevent triggered image.load events from bubbling to window.load
						noBubble: true
					},
					focus: {

						// Fire native event if possible so blur/focus sequence is correct
						trigger: function () {
							if (this !== safeActiveElement() && this.focus) {
								this.focus();
								return false;
							}
						},
						delegateType: "focusin"
					},
					blur: {
						trigger: function () {
							if (this === safeActiveElement() && this.blur) {
								this.blur();
								return false;
							}
						},
						delegateType: "focusout"
					},
					click: {

						// For checkbox, fire native event so checked state will be right
						trigger: function () {
							if (this.type === "checkbox" && this.click && nodeName(this, "input")) {
								this.click();
								return false;
							}
						},

						// For cross-browser consistency, don't fire native .click() on links
						_default: function (event) {
							return nodeName(event.target, "a");
						}
					},

					beforeunload: {
						postDispatch: function (event) {

							// Support: Firefox 20+
							// Firefox doesn't alert if the returnValue field is not set.
							if (event.result !== undefined && event.originalEvent) {
								event.originalEvent.returnValue = event.result;
							}
						}
					}
				}
			};

			jQuery.removeEvent = function (elem, type, handle) {

				// This "if" is needed for plain objects
				if (elem.removeEventListener) {
					elem.removeEventListener(type, handle);
				}
			};

			jQuery.Event = function (src, props) {

				// Allow instantiation without the 'new' keyword
				if (!(this instanceof jQuery.Event)) {
					return new jQuery.Event(src, props);
				}

				// Event object
				if (src && src.type) {
					this.originalEvent = src;
					this.type = src.type;

					// Events bubbling up the document may have been marked as prevented
					// by a handler lower down the tree; reflect the correct value.
					this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined &&

					// Support: Android <=2.3 only
					src.returnValue === false ? returnTrue : returnFalse;

					// Create target properties
					// Support: Safari <=6 - 7 only
					// Target should not be a text node (#504, #13143)
					this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;

					this.currentTarget = src.currentTarget;
					this.relatedTarget = src.relatedTarget;

					// Event type
				} else {
					this.type = src;
				}

				// Put explicitly provided properties onto the event object
				if (props) {
					jQuery.extend(this, props);
				}

				// Create a timestamp if incoming event doesn't have one
				this.timeStamp = src && src.timeStamp || jQuery.now();

				// Mark it as fixed
				this[jQuery.expando] = true;
			};

			// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
			// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
			jQuery.Event.prototype = {
				constructor: jQuery.Event,
				isDefaultPrevented: returnFalse,
				isPropagationStopped: returnFalse,
				isImmediatePropagationStopped: returnFalse,
				isSimulated: false,

				preventDefault: function () {
					var e = this.originalEvent;

					this.isDefaultPrevented = returnTrue;

					if (e && !this.isSimulated) {
						e.preventDefault();
					}
				},
				stopPropagation: function () {
					var e = this.originalEvent;

					this.isPropagationStopped = returnTrue;

					if (e && !this.isSimulated) {
						e.stopPropagation();
					}
				},
				stopImmediatePropagation: function () {
					var e = this.originalEvent;

					this.isImmediatePropagationStopped = returnTrue;

					if (e && !this.isSimulated) {
						e.stopImmediatePropagation();
					}

					this.stopPropagation();
				}
			};

			// Includes all common event props including KeyEvent and MouseEvent specific props
			jQuery.each({
				altKey: true,
				bubbles: true,
				cancelable: true,
				changedTouches: true,
				ctrlKey: true,
				detail: true,
				eventPhase: true,
				metaKey: true,
				pageX: true,
				pageY: true,
				shiftKey: true,
				view: true,
				"char": true,
				charCode: true,
				key: true,
				keyCode: true,
				button: true,
				buttons: true,
				clientX: true,
				clientY: true,
				offsetX: true,
				offsetY: true,
				pointerId: true,
				pointerType: true,
				screenX: true,
				screenY: true,
				targetTouches: true,
				toElement: true,
				touches: true,

				which: function (event) {
					var button = event.button;

					// Add which for key events
					if (event.which == null && rkeyEvent.test(event.type)) {
						return event.charCode != null ? event.charCode : event.keyCode;
					}

					// Add which for click: 1 === left; 2 === middle; 3 === right
					if (!event.which && button !== undefined && rmouseEvent.test(event.type)) {
						if (button & 1) {
							return 1;
						}

						if (button & 2) {
							return 3;
						}

						if (button & 4) {
							return 2;
						}

						return 0;
					}

					return event.which;
				}
			}, jQuery.event.addProp);

			// Create mouseenter/leave events using mouseover/out and event-time checks
			// so that event delegation works in jQuery.
			// Do the same for pointerenter/pointerleave and pointerover/pointerout
			//
			// Support: Safari 7 only
			// Safari sends mouseenter too often; see:
			// https://bugs.chromium.org/p/chromium/issues/detail?id=470258
			// for the description of the bug (it existed in older Chrome versions as well).
			jQuery.each({
				mouseenter: "mouseover",
				mouseleave: "mouseout",
				pointerenter: "pointerover",
				pointerleave: "pointerout"
			}, function (orig, fix) {
				jQuery.event.special[orig] = {
					delegateType: fix,
					bindType: fix,

					handle: function (event) {
						var ret,
						    target = this,
						    related = event.relatedTarget,
						    handleObj = event.handleObj;

						// For mouseenter/leave call the handler if related is outside the target.
						// NB: No relatedTarget if the mouse left/entered the browser window
						if (!related || related !== target && !jQuery.contains(target, related)) {
							event.type = handleObj.origType;
							ret = handleObj.handler.apply(this, arguments);
							event.type = fix;
						}
						return ret;
					}
				};
			});

			jQuery.fn.extend({

				on: function (types, selector, data, fn) {
					return on(this, types, selector, data, fn);
				},
				one: function (types, selector, data, fn) {
					return on(this, types, selector, data, fn, 1);
				},
				off: function (types, selector, fn) {
					var handleObj, type;
					if (types && types.preventDefault && types.handleObj) {

						// ( event )  dispatched jQuery.Event
						handleObj = types.handleObj;
						jQuery(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
						return this;
					}
					if (typeof types === "object") {

						// ( types-object [, selector] )
						for (type in types) {
							this.off(type, selector, types[type]);
						}
						return this;
					}
					if (selector === false || typeof selector === "function") {

						// ( types [, fn] )
						fn = selector;
						selector = undefined;
					}
					if (fn === false) {
						fn = returnFalse;
					}
					return this.each(function () {
						jQuery.event.remove(this, types, fn, selector);
					});
				}
			});

			var

			/* eslint-disable max-len */

			// See https://github.com/eslint/eslint/issues/3229
			rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,


			/* eslint-enable */

			// Support: IE <=10 - 11, Edge 12 - 13
			// In IE/Edge using regex groups here causes severe slowdowns.
			// See https://connect.microsoft.com/IE/feedback/details/1736512/
			rnoInnerhtml = /<script|<style|<link/i,


			// checked="checked" or checked
			rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
			    rscriptTypeMasked = /^true\/(.*)/,
			    rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g;

			// Prefer a tbody over its parent table for containing new rows
			function manipulationTarget(elem, content) {
				if (nodeName(elem, "table") && nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {

					return jQuery(">tbody", elem)[0] || elem;
				}

				return elem;
			}

			// Replace/restore the type attribute of script elements for safe DOM manipulation
			function disableScript(elem) {
				elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
				return elem;
			}
			function restoreScript(elem) {
				var match = rscriptTypeMasked.exec(elem.type);

				if (match) {
					elem.type = match[1];
				} else {
					elem.removeAttribute("type");
				}

				return elem;
			}

			function cloneCopyEvent(src, dest) {
				var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

				if (dest.nodeType !== 1) {
					return;
				}

				// 1. Copy private data: events, handlers, etc.
				if (dataPriv.hasData(src)) {
					pdataOld = dataPriv.access(src);
					pdataCur = dataPriv.set(dest, pdataOld);
					events = pdataOld.events;

					if (events) {
						delete pdataCur.handle;
						pdataCur.events = {};

						for (type in events) {
							for (i = 0, l = events[type].length; i < l; i++) {
								jQuery.event.add(dest, type, events[type][i]);
							}
						}
					}
				}

				// 2. Copy user data
				if (dataUser.hasData(src)) {
					udataOld = dataUser.access(src);
					udataCur = jQuery.extend({}, udataOld);

					dataUser.set(dest, udataCur);
				}
			}

			// Fix IE bugs, see support tests
			function fixInput(src, dest) {
				var nodeName = dest.nodeName.toLowerCase();

				// Fails to persist the checked state of a cloned checkbox or radio button.
				if (nodeName === "input" && rcheckableType.test(src.type)) {
					dest.checked = src.checked;

					// Fails to return the selected option to the default selected state when cloning options
				} else if (nodeName === "input" || nodeName === "textarea") {
					dest.defaultValue = src.defaultValue;
				}
			}

			function domManip(collection, args, callback, ignored) {

				// Flatten any nested arrays
				args = concat.apply([], args);

				var fragment,
				    first,
				    scripts,
				    hasScripts,
				    node,
				    doc,
				    i = 0,
				    l = collection.length,
				    iNoClone = l - 1,
				    value = args[0],
				    isFunction = jQuery.isFunction(value);

				// We can't cloneNode fragments that contain checked, in WebKit
				if (isFunction || l > 1 && typeof value === "string" && !support.checkClone && rchecked.test(value)) {
					return collection.each(function (index) {
						var self = collection.eq(index);
						if (isFunction) {
							args[0] = value.call(this, index, self.html());
						}
						domManip(self, args, callback, ignored);
					});
				}

				if (l) {
					fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
					first = fragment.firstChild;

					if (fragment.childNodes.length === 1) {
						fragment = first;
					}

					// Require either new content or an interest in ignored elements to invoke the callback
					if (first || ignored) {
						scripts = jQuery.map(getAll(fragment, "script"), disableScript);
						hasScripts = scripts.length;

						// Use the original fragment for the last item
						// instead of the first because it can end up
						// being emptied incorrectly in certain situations (#8070).
						for (; i < l; i++) {
							node = fragment;

							if (i !== iNoClone) {
								node = jQuery.clone(node, true, true);

								// Keep references to cloned scripts for later restoration
								if (hasScripts) {

									// Support: Android <=4.0 only, PhantomJS 1 only
									// push.apply(_, arraylike) throws on ancient WebKit
									jQuery.merge(scripts, getAll(node, "script"));
								}
							}

							callback.call(collection[i], node, i);
						}

						if (hasScripts) {
							doc = scripts[scripts.length - 1].ownerDocument;

							// Reenable scripts
							jQuery.map(scripts, restoreScript);

							// Evaluate executable scripts on first document insertion
							for (i = 0; i < hasScripts; i++) {
								node = scripts[i];
								if (rscriptType.test(node.type || "") && !dataPriv.access(node, "globalEval") && jQuery.contains(doc, node)) {

									if (node.src) {

										// Optional AJAX dependency, but won't run scripts if not present
										if (jQuery._evalUrl) {
											jQuery._evalUrl(node.src);
										}
									} else {
										DOMEval(node.textContent.replace(rcleanScript, ""), doc);
									}
								}
							}
						}
					}
				}

				return collection;
			}

			function remove(elem, selector, keepData) {
				var node,
				    nodes = selector ? jQuery.filter(selector, elem) : elem,
				    i = 0;

				for (; (node = nodes[i]) != null; i++) {
					if (!keepData && node.nodeType === 1) {
						jQuery.cleanData(getAll(node));
					}

					if (node.parentNode) {
						if (keepData && jQuery.contains(node.ownerDocument, node)) {
							setGlobalEval(getAll(node, "script"));
						}
						node.parentNode.removeChild(node);
					}
				}

				return elem;
			}

			jQuery.extend({
				htmlPrefilter: function (html) {
					return html.replace(rxhtmlTag, "<$1></$2>");
				},

				clone: function (elem, dataAndEvents, deepDataAndEvents) {
					var i,
					    l,
					    srcElements,
					    destElements,
					    clone = elem.cloneNode(true),
					    inPage = jQuery.contains(elem.ownerDocument, elem);

					// Fix IE cloning issues
					if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {

						// We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
						destElements = getAll(clone);
						srcElements = getAll(elem);

						for (i = 0, l = srcElements.length; i < l; i++) {
							fixInput(srcElements[i], destElements[i]);
						}
					}

					// Copy the events from the original to the clone
					if (dataAndEvents) {
						if (deepDataAndEvents) {
							srcElements = srcElements || getAll(elem);
							destElements = destElements || getAll(clone);

							for (i = 0, l = srcElements.length; i < l; i++) {
								cloneCopyEvent(srcElements[i], destElements[i]);
							}
						} else {
							cloneCopyEvent(elem, clone);
						}
					}

					// Preserve script evaluation history
					destElements = getAll(clone, "script");
					if (destElements.length > 0) {
						setGlobalEval(destElements, !inPage && getAll(elem, "script"));
					}

					// Return the cloned set
					return clone;
				},

				cleanData: function (elems) {
					var data,
					    elem,
					    type,
					    special = jQuery.event.special,
					    i = 0;

					for (; (elem = elems[i]) !== undefined; i++) {
						if (acceptData(elem)) {
							if (data = elem[dataPriv.expando]) {
								if (data.events) {
									for (type in data.events) {
										if (special[type]) {
											jQuery.event.remove(elem, type);

											// This is a shortcut to avoid jQuery.event.remove's overhead
										} else {
											jQuery.removeEvent(elem, type, data.handle);
										}
									}
								}

								// Support: Chrome <=35 - 45+
								// Assign undefined instead of using delete, see Data#remove
								elem[dataPriv.expando] = undefined;
							}
							if (elem[dataUser.expando]) {

								// Support: Chrome <=35 - 45+
								// Assign undefined instead of using delete, see Data#remove
								elem[dataUser.expando] = undefined;
							}
						}
					}
				}
			});

			jQuery.fn.extend({
				detach: function (selector) {
					return remove(this, selector, true);
				},

				remove: function (selector) {
					return remove(this, selector);
				},

				text: function (value) {
					return access(this, function (value) {
						return value === undefined ? jQuery.text(this) : this.empty().each(function () {
							if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
								this.textContent = value;
							}
						});
					}, null, value, arguments.length);
				},

				append: function () {
					return domManip(this, arguments, function (elem) {
						if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
							var target = manipulationTarget(this, elem);
							target.appendChild(elem);
						}
					});
				},

				prepend: function () {
					return domManip(this, arguments, function (elem) {
						if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
							var target = manipulationTarget(this, elem);
							target.insertBefore(elem, target.firstChild);
						}
					});
				},

				before: function () {
					return domManip(this, arguments, function (elem) {
						if (this.parentNode) {
							this.parentNode.insertBefore(elem, this);
						}
					});
				},

				after: function () {
					return domManip(this, arguments, function (elem) {
						if (this.parentNode) {
							this.parentNode.insertBefore(elem, this.nextSibling);
						}
					});
				},

				empty: function () {
					var elem,
					    i = 0;

					for (; (elem = this[i]) != null; i++) {
						if (elem.nodeType === 1) {

							// Prevent memory leaks
							jQuery.cleanData(getAll(elem, false));

							// Remove any remaining nodes
							elem.textContent = "";
						}
					}

					return this;
				},

				clone: function (dataAndEvents, deepDataAndEvents) {
					dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
					deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

					return this.map(function () {
						return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
					});
				},

				html: function (value) {
					return access(this, function (value) {
						var elem = this[0] || {},
						    i = 0,
						    l = this.length;

						if (value === undefined && elem.nodeType === 1) {
							return elem.innerHTML;
						}

						// See if we can take a shortcut and just use innerHTML
						if (typeof value === "string" && !rnoInnerhtml.test(value) && !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {

							value = jQuery.htmlPrefilter(value);

							try {
								for (; i < l; i++) {
									elem = this[i] || {};

									// Remove element nodes and prevent memory leaks
									if (elem.nodeType === 1) {
										jQuery.cleanData(getAll(elem, false));
										elem.innerHTML = value;
									}
								}

								elem = 0;

								// If using innerHTML throws an exception, use the fallback method
							} catch (e) {}
						}

						if (elem) {
							this.empty().append(value);
						}
					}, null, value, arguments.length);
				},

				replaceWith: function () {
					var ignored = [];

					// Make the changes, replacing each non-ignored context element with the new content
					return domManip(this, arguments, function (elem) {
						var parent = this.parentNode;

						if (jQuery.inArray(this, ignored) < 0) {
							jQuery.cleanData(getAll(this));
							if (parent) {
								parent.replaceChild(elem, this);
							}
						}

						// Force callback invocation
					}, ignored);
				}
			});

			jQuery.each({
				appendTo: "append",
				prependTo: "prepend",
				insertBefore: "before",
				insertAfter: "after",
				replaceAll: "replaceWith"
			}, function (name, original) {
				jQuery.fn[name] = function (selector) {
					var elems,
					    ret = [],
					    insert = jQuery(selector),
					    last = insert.length - 1,
					    i = 0;

					for (; i <= last; i++) {
						elems = i === last ? this : this.clone(true);
						jQuery(insert[i])[original](elems);

						// Support: Android <=4.0 only, PhantomJS 1 only
						// .get() because push.apply(_, arraylike) throws on ancient WebKit
						push.apply(ret, elems.get());
					}

					return this.pushStack(ret);
				};
			});
			var rmargin = /^margin/;

			var rnumnonpx = new RegExp("^(" + pnum + ")(?!px)[a-z%]+$", "i");

			var getStyles = function (elem) {

				// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
				// IE throws on elements created in popups
				// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
				var view = elem.ownerDocument.defaultView;

				if (!view || !view.opener) {
					view = window;
				}

				return view.getComputedStyle(elem);
			};

			(function () {

				// Executing both pixelPosition & boxSizingReliable tests require only one layout
				// so they're executed at the same time to save the second computation.
				function computeStyleTests() {

					// This is a singleton, we need to execute it only once
					if (!div) {
						return;
					}

					div.style.cssText = "box-sizing:border-box;" + "position:relative;display:block;" + "margin:auto;border:1px;padding:1px;" + "top:1%;width:50%";
					div.innerHTML = "";
					documentElement.appendChild(container);

					var divStyle = window.getComputedStyle(div);
					pixelPositionVal = divStyle.top !== "1%";

					// Support: Android 4.0 - 4.3 only, Firefox <=3 - 44
					reliableMarginLeftVal = divStyle.marginLeft === "2px";
					boxSizingReliableVal = divStyle.width === "4px";

					// Support: Android 4.0 - 4.3 only
					// Some styles come back with percentage values, even though they shouldn't
					div.style.marginRight = "50%";
					pixelMarginRightVal = divStyle.marginRight === "4px";

					documentElement.removeChild(container);

					// Nullify the div so it wouldn't be stored in the memory and
					// it will also be a sign that checks already performed
					div = null;
				}

				var pixelPositionVal,
				    boxSizingReliableVal,
				    pixelMarginRightVal,
				    reliableMarginLeftVal,
				    container = document.createElement("div"),
				    div = document.createElement("div");

				// Finish early in limited (non-browser) environments
				if (!div.style) {
					return;
				}

				// Support: IE <=9 - 11 only
				// Style of cloned element affects source element cloned (#8908)
				div.style.backgroundClip = "content-box";
				div.cloneNode(true).style.backgroundClip = "";
				support.clearCloneStyle = div.style.backgroundClip === "content-box";

				container.style.cssText = "border:0;width:8px;height:0;top:0;left:-9999px;" + "padding:0;margin-top:1px;position:absolute";
				container.appendChild(div);

				jQuery.extend(support, {
					pixelPosition: function () {
						computeStyleTests();
						return pixelPositionVal;
					},
					boxSizingReliable: function () {
						computeStyleTests();
						return boxSizingReliableVal;
					},
					pixelMarginRight: function () {
						computeStyleTests();
						return pixelMarginRightVal;
					},
					reliableMarginLeft: function () {
						computeStyleTests();
						return reliableMarginLeftVal;
					}
				});
			})();

			function curCSS(elem, name, computed) {
				var width,
				    minWidth,
				    maxWidth,
				    ret,


				// Support: Firefox 51+
				// Retrieving style before computed somehow
				// fixes an issue with getting wrong values
				// on detached elements
				style = elem.style;

				computed = computed || getStyles(elem);

				// getPropertyValue is needed for:
				//   .css('filter') (IE 9 only, #12537)
				//   .css('--customProperty) (#3144)
				if (computed) {
					ret = computed.getPropertyValue(name) || computed[name];

					if (ret === "" && !jQuery.contains(elem.ownerDocument, elem)) {
						ret = jQuery.style(elem, name);
					}

					// A tribute to the "awesome hack by Dean Edwards"
					// Android Browser returns percentage for some values,
					// but width seems to be reliably pixels.
					// This is against the CSSOM draft spec:
					// https://drafts.csswg.org/cssom/#resolved-values
					if (!support.pixelMarginRight() && rnumnonpx.test(ret) && rmargin.test(name)) {

						// Remember the original values
						width = style.width;
						minWidth = style.minWidth;
						maxWidth = style.maxWidth;

						// Put in the new values to get a computed value out
						style.minWidth = style.maxWidth = style.width = ret;
						ret = computed.width;

						// Revert the changed values
						style.width = width;
						style.minWidth = minWidth;
						style.maxWidth = maxWidth;
					}
				}

				return ret !== undefined ?

				// Support: IE <=9 - 11 only
				// IE returns zIndex value as an integer.
				ret + "" : ret;
			}

			function addGetHookIf(conditionFn, hookFn) {

				// Define the hook, we'll check on the first run if it's really needed.
				return {
					get: function () {
						if (conditionFn()) {

							// Hook not needed (or it's not possible to use it due
							// to missing dependency), remove it.
							delete this.get;
							return;
						}

						// Hook needed; redefine it so that the support test is not executed again.
						return (this.get = hookFn).apply(this, arguments);
					}
				};
			}

			var

			// Swappable if display is none or starts with table
			// except "table", "table-cell", or "table-caption"
			// See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
			rdisplayswap = /^(none|table(?!-c[ea]).+)/,
			    rcustomProp = /^--/,
			    cssShow = { position: "absolute", visibility: "hidden", display: "block" },
			    cssNormalTransform = {
				letterSpacing: "0",
				fontWeight: "400"
			},
			    cssPrefixes = ["Webkit", "Moz", "ms"],
			    emptyStyle = document.createElement("div").style;

			// Return a css property mapped to a potentially vendor prefixed property
			function vendorPropName(name) {

				// Shortcut for names that are not vendor prefixed
				if (name in emptyStyle) {
					return name;
				}

				// Check for vendor prefixed names
				var capName = name[0].toUpperCase() + name.slice(1),
				    i = cssPrefixes.length;

				while (i--) {
					name = cssPrefixes[i] + capName;
					if (name in emptyStyle) {
						return name;
					}
				}
			}

			// Return a property mapped along what jQuery.cssProps suggests or to
			// a vendor prefixed property.
			function finalPropName(name) {
				var ret = jQuery.cssProps[name];
				if (!ret) {
					ret = jQuery.cssProps[name] = vendorPropName(name) || name;
				}
				return ret;
			}

			function setPositiveNumber(elem, value, subtract) {

				// Any relative (+/-) values have already been
				// normalized at this point
				var matches = rcssNum.exec(value);
				return matches ?

				// Guard against undefined "subtract", e.g., when used as in cssHooks
				Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") : value;
			}

			function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles) {
				var i,
				    val = 0;

				// If we already have the right measurement, avoid augmentation
				if (extra === (isBorderBox ? "border" : "content")) {
					i = 4;

					// Otherwise initialize for horizontal or vertical properties
				} else {
					i = name === "width" ? 1 : 0;
				}

				for (; i < 4; i += 2) {

					// Both box models exclude margin, so add it if we want it
					if (extra === "margin") {
						val += jQuery.css(elem, extra + cssExpand[i], true, styles);
					}

					if (isBorderBox) {

						// border-box includes padding, so remove it if we want content
						if (extra === "content") {
							val -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
						}

						// At this point, extra isn't border nor margin, so remove border
						if (extra !== "margin") {
							val -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
						}
					} else {

						// At this point, extra isn't content, so add padding
						val += jQuery.css(elem, "padding" + cssExpand[i], true, styles);

						// At this point, extra isn't content nor padding, so add border
						if (extra !== "padding") {
							val += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
						}
					}
				}

				return val;
			}

			function getWidthOrHeight(elem, name, extra) {

				// Start with computed style
				var valueIsBorderBox,
				    styles = getStyles(elem),
				    val = curCSS(elem, name, styles),
				    isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";

				// Computed unit is not pixels. Stop here and return.
				if (rnumnonpx.test(val)) {
					return val;
				}

				// Check for style in case a browser which returns unreliable values
				// for getComputedStyle silently falls back to the reliable elem.style
				valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === elem.style[name]);

				// Fall back to offsetWidth/Height when value is "auto"
				// This happens for inline elements with no explicit setting (gh-3571)
				if (val === "auto") {
					val = elem["offset" + name[0].toUpperCase() + name.slice(1)];
				}

				// Normalize "", auto, and prepare for extra
				val = parseFloat(val) || 0;

				// Use the active box-sizing model to add/subtract irrelevant styles
				return val + augmentWidthOrHeight(elem, name, extra || (isBorderBox ? "border" : "content"), valueIsBorderBox, styles) + "px";
			}

			jQuery.extend({

				// Add in style property hooks for overriding the default
				// behavior of getting and setting a style property
				cssHooks: {
					opacity: {
						get: function (elem, computed) {
							if (computed) {

								// We should always get a number back from opacity
								var ret = curCSS(elem, "opacity");
								return ret === "" ? "1" : ret;
							}
						}
					}
				},

				// Don't automatically add "px" to these possibly-unitless properties
				cssNumber: {
					"animationIterationCount": true,
					"columnCount": true,
					"fillOpacity": true,
					"flexGrow": true,
					"flexShrink": true,
					"fontWeight": true,
					"lineHeight": true,
					"opacity": true,
					"order": true,
					"orphans": true,
					"widows": true,
					"zIndex": true,
					"zoom": true
				},

				// Add in properties whose names you wish to fix before
				// setting or getting the value
				cssProps: {
					"float": "cssFloat"
				},

				// Get and set the style property on a DOM Node
				style: function (elem, name, value, extra) {

					// Don't set styles on text and comment nodes
					if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
						return;
					}

					// Make sure that we're working with the right name
					var ret,
					    type,
					    hooks,
					    origName = jQuery.camelCase(name),
					    isCustomProp = rcustomProp.test(name),
					    style = elem.style;

					// Make sure that we're working with the right name. We don't
					// want to query the value if it is a CSS custom property
					// since they are user-defined.
					if (!isCustomProp) {
						name = finalPropName(origName);
					}

					// Gets hook for the prefixed version, then unprefixed version
					hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];

					// Check if we're setting a value
					if (value !== undefined) {
						type = typeof value;

						// Convert "+=" or "-=" to relative numbers (#7345)
						if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
							value = adjustCSS(elem, name, ret);

							// Fixes bug #9237
							type = "number";
						}

						// Make sure that null and NaN values aren't set (#7116)
						if (value == null || value !== value) {
							return;
						}

						// If a number was passed in, add the unit (except for certain CSS properties)
						if (type === "number") {
							value += ret && ret[3] || (jQuery.cssNumber[origName] ? "" : "px");
						}

						// background-* props affect original clone's values
						if (!support.clearCloneStyle && value === "" && name.indexOf("background") === 0) {
							style[name] = "inherit";
						}

						// If a hook was provided, use that value, otherwise just set the specified value
						if (!hooks || !("set" in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {

							if (isCustomProp) {
								style.setProperty(name, value);
							} else {
								style[name] = value;
							}
						}
					} else {

						// If a hook was provided get the non-computed value from there
						if (hooks && "get" in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {

							return ret;
						}

						// Otherwise just get the value from the style object
						return style[name];
					}
				},

				css: function (elem, name, extra, styles) {
					var val,
					    num,
					    hooks,
					    origName = jQuery.camelCase(name),
					    isCustomProp = rcustomProp.test(name);

					// Make sure that we're working with the right name. We don't
					// want to modify the value if it is a CSS custom property
					// since they are user-defined.
					if (!isCustomProp) {
						name = finalPropName(origName);
					}

					// Try prefixed name followed by the unprefixed name
					hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];

					// If a hook was provided get the computed value from there
					if (hooks && "get" in hooks) {
						val = hooks.get(elem, true, extra);
					}

					// Otherwise, if a way to get the computed value exists, use that
					if (val === undefined) {
						val = curCSS(elem, name, styles);
					}

					// Convert "normal" to computed value
					if (val === "normal" && name in cssNormalTransform) {
						val = cssNormalTransform[name];
					}

					// Make numeric if forced or a qualifier was provided and val looks numeric
					if (extra === "" || extra) {
						num = parseFloat(val);
						return extra === true || isFinite(num) ? num || 0 : val;
					}

					return val;
				}
			});

			jQuery.each(["height", "width"], function (i, name) {
				jQuery.cssHooks[name] = {
					get: function (elem, computed, extra) {
						if (computed) {

							// Certain elements can have dimension info if we invisibly show them
							// but it must have a current display style that would benefit
							return rdisplayswap.test(jQuery.css(elem, "display")) && (

							// Support: Safari 8+
							// Table columns in Safari have non-zero offsetWidth & zero
							// getBoundingClientRect().width unless display is changed.
							// Support: IE <=11 only
							// Running getBoundingClientRect on a disconnected node
							// in IE throws an error.
							!elem.getClientRects().length || !elem.getBoundingClientRect().width) ? swap(elem, cssShow, function () {
								return getWidthOrHeight(elem, name, extra);
							}) : getWidthOrHeight(elem, name, extra);
						}
					},

					set: function (elem, value, extra) {
						var matches,
						    styles = extra && getStyles(elem),
						    subtract = extra && augmentWidthOrHeight(elem, name, extra, jQuery.css(elem, "boxSizing", false, styles) === "border-box", styles);

						// Convert to pixels if value adjustment is needed
						if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || "px") !== "px") {

							elem.style[name] = value;
							value = jQuery.css(elem, name);
						}

						return setPositiveNumber(elem, value, subtract);
					}
				};
			});

			jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function (elem, computed) {
				if (computed) {
					return (parseFloat(curCSS(elem, "marginLeft")) || elem.getBoundingClientRect().left - swap(elem, { marginLeft: 0 }, function () {
						return elem.getBoundingClientRect().left;
					})) + "px";
				}
			});

			// These hooks are used by animate to expand properties
			jQuery.each({
				margin: "",
				padding: "",
				border: "Width"
			}, function (prefix, suffix) {
				jQuery.cssHooks[prefix + suffix] = {
					expand: function (value) {
						var i = 0,
						    expanded = {},


						// Assumes a single number if not a string
						parts = typeof value === "string" ? value.split(" ") : [value];

						for (; i < 4; i++) {
							expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
						}

						return expanded;
					}
				};

				if (!rmargin.test(prefix)) {
					jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
				}
			});

			jQuery.fn.extend({
				css: function (name, value) {
					return access(this, function (elem, name, value) {
						var styles,
						    len,
						    map = {},
						    i = 0;

						if (Array.isArray(name)) {
							styles = getStyles(elem);
							len = name.length;

							for (; i < len; i++) {
								map[name[i]] = jQuery.css(elem, name[i], false, styles);
							}

							return map;
						}

						return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
					}, name, value, arguments.length > 1);
				}
			});

			function Tween(elem, options, prop, end, easing) {
				return new Tween.prototype.init(elem, options, prop, end, easing);
			}
			jQuery.Tween = Tween;

			Tween.prototype = {
				constructor: Tween,
				init: function (elem, options, prop, end, easing, unit) {
					this.elem = elem;
					this.prop = prop;
					this.easing = easing || jQuery.easing._default;
					this.options = options;
					this.start = this.now = this.cur();
					this.end = end;
					this.unit = unit || (jQuery.cssNumber[prop] ? "" : "px");
				},
				cur: function () {
					var hooks = Tween.propHooks[this.prop];

					return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
				},
				run: function (percent) {
					var eased,
					    hooks = Tween.propHooks[this.prop];

					if (this.options.duration) {
						this.pos = eased = jQuery.easing[this.easing](percent, this.options.duration * percent, 0, 1, this.options.duration);
					} else {
						this.pos = eased = percent;
					}
					this.now = (this.end - this.start) * eased + this.start;

					if (this.options.step) {
						this.options.step.call(this.elem, this.now, this);
					}

					if (hooks && hooks.set) {
						hooks.set(this);
					} else {
						Tween.propHooks._default.set(this);
					}
					return this;
				}
			};

			Tween.prototype.init.prototype = Tween.prototype;

			Tween.propHooks = {
				_default: {
					get: function (tween) {
						var result;

						// Use a property on the element directly when it is not a DOM element,
						// or when there is no matching style property that exists.
						if (tween.elem.nodeType !== 1 || tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null) {
							return tween.elem[tween.prop];
						}

						// Passing an empty string as a 3rd parameter to .css will automatically
						// attempt a parseFloat and fallback to a string if the parse fails.
						// Simple values such as "10px" are parsed to Float;
						// complex values such as "rotate(1rad)" are returned as-is.
						result = jQuery.css(tween.elem, tween.prop, "");

						// Empty strings, null, undefined and "auto" are converted to 0.
						return !result || result === "auto" ? 0 : result;
					},
					set: function (tween) {

						// Use step hook for back compat.
						// Use cssHook if its there.
						// Use .style if available and use plain properties where available.
						if (jQuery.fx.step[tween.prop]) {
							jQuery.fx.step[tween.prop](tween);
						} else if (tween.elem.nodeType === 1 && (tween.elem.style[jQuery.cssProps[tween.prop]] != null || jQuery.cssHooks[tween.prop])) {
							jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
						} else {
							tween.elem[tween.prop] = tween.now;
						}
					}
				}
			};

			// Support: IE <=9 only
			// Panic based approach to setting things on disconnected nodes
			Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
				set: function (tween) {
					if (tween.elem.nodeType && tween.elem.parentNode) {
						tween.elem[tween.prop] = tween.now;
					}
				}
			};

			jQuery.easing = {
				linear: function (p) {
					return p;
				},
				swing: function (p) {
					return 0.5 - Math.cos(p * Math.PI) / 2;
				},
				_default: "swing"
			};

			jQuery.fx = Tween.prototype.init;

			// Back compat <1.8 extension point
			jQuery.fx.step = {};

			var fxNow,
			    inProgress,
			    rfxtypes = /^(?:toggle|show|hide)$/,
			    rrun = /queueHooks$/;

			function schedule() {
				if (inProgress) {
					if (document.hidden === false && window.requestAnimationFrame) {
						window.requestAnimationFrame(schedule);
					} else {
						window.setTimeout(schedule, jQuery.fx.interval);
					}

					jQuery.fx.tick();
				}
			}

			// Animations created synchronously will run synchronously
			function createFxNow() {
				window.setTimeout(function () {
					fxNow = undefined;
				});
				return fxNow = jQuery.now();
			}

			// Generate parameters to create a standard animation
			function genFx(type, includeWidth) {
				var which,
				    i = 0,
				    attrs = { height: type };

				// If we include width, step value is 1 to do all cssExpand values,
				// otherwise step value is 2 to skip over Left and Right
				includeWidth = includeWidth ? 1 : 0;
				for (; i < 4; i += 2 - includeWidth) {
					which = cssExpand[i];
					attrs["margin" + which] = attrs["padding" + which] = type;
				}

				if (includeWidth) {
					attrs.opacity = attrs.width = type;
				}

				return attrs;
			}

			function createTween(value, prop, animation) {
				var tween,
				    collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]),
				    index = 0,
				    length = collection.length;
				for (; index < length; index++) {
					if (tween = collection[index].call(animation, prop, value)) {

						// We're done with this property
						return tween;
					}
				}
			}

			function defaultPrefilter(elem, props, opts) {
				var prop,
				    value,
				    toggle,
				    hooks,
				    oldfire,
				    propTween,
				    restoreDisplay,
				    display,
				    isBox = "width" in props || "height" in props,
				    anim = this,
				    orig = {},
				    style = elem.style,
				    hidden = elem.nodeType && isHiddenWithinTree(elem),
				    dataShow = dataPriv.get(elem, "fxshow");

				// Queue-skipping animations hijack the fx hooks
				if (!opts.queue) {
					hooks = jQuery._queueHooks(elem, "fx");
					if (hooks.unqueued == null) {
						hooks.unqueued = 0;
						oldfire = hooks.empty.fire;
						hooks.empty.fire = function () {
							if (!hooks.unqueued) {
								oldfire();
							}
						};
					}
					hooks.unqueued++;

					anim.always(function () {

						// Ensure the complete handler is called before this completes
						anim.always(function () {
							hooks.unqueued--;
							if (!jQuery.queue(elem, "fx").length) {
								hooks.empty.fire();
							}
						});
					});
				}

				// Detect show/hide animations
				for (prop in props) {
					value = props[prop];
					if (rfxtypes.test(value)) {
						delete props[prop];
						toggle = toggle || value === "toggle";
						if (value === (hidden ? "hide" : "show")) {

							// Pretend to be hidden if this is a "show" and
							// there is still data from a stopped show/hide
							if (value === "show" && dataShow && dataShow[prop] !== undefined) {
								hidden = true;

								// Ignore all other no-op show/hide data
							} else {
								continue;
							}
						}
						orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
					}
				}

				// Bail out if this is a no-op like .hide().hide()
				propTween = !jQuery.isEmptyObject(props);
				if (!propTween && jQuery.isEmptyObject(orig)) {
					return;
				}

				// Restrict "overflow" and "display" styles during box animations
				if (isBox && elem.nodeType === 1) {

					// Support: IE <=9 - 11, Edge 12 - 13
					// Record all 3 overflow attributes because IE does not infer the shorthand
					// from identically-valued overflowX and overflowY
					opts.overflow = [style.overflow, style.overflowX, style.overflowY];

					// Identify a display type, preferring old show/hide data over the CSS cascade
					restoreDisplay = dataShow && dataShow.display;
					if (restoreDisplay == null) {
						restoreDisplay = dataPriv.get(elem, "display");
					}
					display = jQuery.css(elem, "display");
					if (display === "none") {
						if (restoreDisplay) {
							display = restoreDisplay;
						} else {

							// Get nonempty value(s) by temporarily forcing visibility
							showHide([elem], true);
							restoreDisplay = elem.style.display || restoreDisplay;
							display = jQuery.css(elem, "display");
							showHide([elem]);
						}
					}

					// Animate inline elements as inline-block
					if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
						if (jQuery.css(elem, "float") === "none") {

							// Restore the original display value at the end of pure show/hide animations
							if (!propTween) {
								anim.done(function () {
									style.display = restoreDisplay;
								});
								if (restoreDisplay == null) {
									display = style.display;
									restoreDisplay = display === "none" ? "" : display;
								}
							}
							style.display = "inline-block";
						}
					}
				}

				if (opts.overflow) {
					style.overflow = "hidden";
					anim.always(function () {
						style.overflow = opts.overflow[0];
						style.overflowX = opts.overflow[1];
						style.overflowY = opts.overflow[2];
					});
				}

				// Implement show/hide animations
				propTween = false;
				for (prop in orig) {

					// General show/hide setup for this element animation
					if (!propTween) {
						if (dataShow) {
							if ("hidden" in dataShow) {
								hidden = dataShow.hidden;
							}
						} else {
							dataShow = dataPriv.access(elem, "fxshow", { display: restoreDisplay });
						}

						// Store hidden/visible for toggle so `.stop().toggle()` "reverses"
						if (toggle) {
							dataShow.hidden = !hidden;
						}

						// Show elements before animating them
						if (hidden) {
							showHide([elem], true);
						}

						/* eslint-disable no-loop-func */

						anim.done(function () {

							/* eslint-enable no-loop-func */

							// The final step of a "hide" animation is actually hiding the element
							if (!hidden) {
								showHide([elem]);
							}
							dataPriv.remove(elem, "fxshow");
							for (prop in orig) {
								jQuery.style(elem, prop, orig[prop]);
							}
						});
					}

					// Per-property setup
					propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
					if (!(prop in dataShow)) {
						dataShow[prop] = propTween.start;
						if (hidden) {
							propTween.end = propTween.start;
							propTween.start = 0;
						}
					}
				}
			}

			function propFilter(props, specialEasing) {
				var index, name, easing, value, hooks;

				// camelCase, specialEasing and expand cssHook pass
				for (index in props) {
					name = jQuery.camelCase(index);
					easing = specialEasing[name];
					value = props[index];
					if (Array.isArray(value)) {
						easing = value[1];
						value = props[index] = value[0];
					}

					if (index !== name) {
						props[name] = value;
						delete props[index];
					}

					hooks = jQuery.cssHooks[name];
					if (hooks && "expand" in hooks) {
						value = hooks.expand(value);
						delete props[name];

						// Not quite $.extend, this won't overwrite existing keys.
						// Reusing 'index' because we have the correct "name"
						for (index in value) {
							if (!(index in props)) {
								props[index] = value[index];
								specialEasing[index] = easing;
							}
						}
					} else {
						specialEasing[name] = easing;
					}
				}
			}

			function Animation(elem, properties, options) {
				var result,
				    stopped,
				    index = 0,
				    length = Animation.prefilters.length,
				    deferred = jQuery.Deferred().always(function () {

					// Don't match elem in the :animated selector
					delete tick.elem;
				}),
				    tick = function () {
					if (stopped) {
						return false;
					}
					var currentTime = fxNow || createFxNow(),
					    remaining = Math.max(0, animation.startTime + animation.duration - currentTime),


					// Support: Android 2.3 only
					// Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (#12497)
					temp = remaining / animation.duration || 0,
					    percent = 1 - temp,
					    index = 0,
					    length = animation.tweens.length;

					for (; index < length; index++) {
						animation.tweens[index].run(percent);
					}

					deferred.notifyWith(elem, [animation, percent, remaining]);

					// If there's more to do, yield
					if (percent < 1 && length) {
						return remaining;
					}

					// If this was an empty animation, synthesize a final progress notification
					if (!length) {
						deferred.notifyWith(elem, [animation, 1, 0]);
					}

					// Resolve the animation and report its conclusion
					deferred.resolveWith(elem, [animation]);
					return false;
				},
				    animation = deferred.promise({
					elem: elem,
					props: jQuery.extend({}, properties),
					opts: jQuery.extend(true, {
						specialEasing: {},
						easing: jQuery.easing._default
					}, options),
					originalProperties: properties,
					originalOptions: options,
					startTime: fxNow || createFxNow(),
					duration: options.duration,
					tweens: [],
					createTween: function (prop, end) {
						var tween = jQuery.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
						animation.tweens.push(tween);
						return tween;
					},
					stop: function (gotoEnd) {
						var index = 0,


						// If we are going to the end, we want to run all the tweens
						// otherwise we skip this part
						length = gotoEnd ? animation.tweens.length : 0;
						if (stopped) {
							return this;
						}
						stopped = true;
						for (; index < length; index++) {
							animation.tweens[index].run(1);
						}

						// Resolve when we played the last frame; otherwise, reject
						if (gotoEnd) {
							deferred.notifyWith(elem, [animation, 1, 0]);
							deferred.resolveWith(elem, [animation, gotoEnd]);
						} else {
							deferred.rejectWith(elem, [animation, gotoEnd]);
						}
						return this;
					}
				}),
				    props = animation.props;

				propFilter(props, animation.opts.specialEasing);

				for (; index < length; index++) {
					result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
					if (result) {
						if (jQuery.isFunction(result.stop)) {
							jQuery._queueHooks(animation.elem, animation.opts.queue).stop = jQuery.proxy(result.stop, result);
						}
						return result;
					}
				}

				jQuery.map(props, createTween, animation);

				if (jQuery.isFunction(animation.opts.start)) {
					animation.opts.start.call(elem, animation);
				}

				// Attach callbacks from options
				animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);

				jQuery.fx.timer(jQuery.extend(tick, {
					elem: elem,
					anim: animation,
					queue: animation.opts.queue
				}));

				return animation;
			}

			jQuery.Animation = jQuery.extend(Animation, {

				tweeners: {
					"*": [function (prop, value) {
						var tween = this.createTween(prop, value);
						adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
						return tween;
					}]
				},

				tweener: function (props, callback) {
					if (jQuery.isFunction(props)) {
						callback = props;
						props = ["*"];
					} else {
						props = props.match(rnothtmlwhite);
					}

					var prop,
					    index = 0,
					    length = props.length;

					for (; index < length; index++) {
						prop = props[index];
						Animation.tweeners[prop] = Animation.tweeners[prop] || [];
						Animation.tweeners[prop].unshift(callback);
					}
				},

				prefilters: [defaultPrefilter],

				prefilter: function (callback, prepend) {
					if (prepend) {
						Animation.prefilters.unshift(callback);
					} else {
						Animation.prefilters.push(callback);
					}
				}
			});

			jQuery.speed = function (speed, easing, fn) {
				var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
					complete: fn || !fn && easing || jQuery.isFunction(speed) && speed,
					duration: speed,
					easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
				};

				// Go to the end state if fx are off
				if (jQuery.fx.off) {
					opt.duration = 0;
				} else {
					if (typeof opt.duration !== "number") {
						if (opt.duration in jQuery.fx.speeds) {
							opt.duration = jQuery.fx.speeds[opt.duration];
						} else {
							opt.duration = jQuery.fx.speeds._default;
						}
					}
				}

				// Normalize opt.queue - true/undefined/null -> "fx"
				if (opt.queue == null || opt.queue === true) {
					opt.queue = "fx";
				}

				// Queueing
				opt.old = opt.complete;

				opt.complete = function () {
					if (jQuery.isFunction(opt.old)) {
						opt.old.call(this);
					}

					if (opt.queue) {
						jQuery.dequeue(this, opt.queue);
					}
				};

				return opt;
			};

			jQuery.fn.extend({
				fadeTo: function (speed, to, easing, callback) {

					// Show any hidden elements after setting opacity to 0
					return this.filter(isHiddenWithinTree).css("opacity", 0).show()

					// Animate to the value specified
					.end().animate({ opacity: to }, speed, easing, callback);
				},
				animate: function (prop, speed, easing, callback) {
					var empty = jQuery.isEmptyObject(prop),
					    optall = jQuery.speed(speed, easing, callback),
					    doAnimation = function () {

						// Operate on a copy of prop so per-property easing won't be lost
						var anim = Animation(this, jQuery.extend({}, prop), optall);

						// Empty animations, or finishing resolves immediately
						if (empty || dataPriv.get(this, "finish")) {
							anim.stop(true);
						}
					};
					doAnimation.finish = doAnimation;

					return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
				},
				stop: function (type, clearQueue, gotoEnd) {
					var stopQueue = function (hooks) {
						var stop = hooks.stop;
						delete hooks.stop;
						stop(gotoEnd);
					};

					if (typeof type !== "string") {
						gotoEnd = clearQueue;
						clearQueue = type;
						type = undefined;
					}
					if (clearQueue && type !== false) {
						this.queue(type || "fx", []);
					}

					return this.each(function () {
						var dequeue = true,
						    index = type != null && type + "queueHooks",
						    timers = jQuery.timers,
						    data = dataPriv.get(this);

						if (index) {
							if (data[index] && data[index].stop) {
								stopQueue(data[index]);
							}
						} else {
							for (index in data) {
								if (data[index] && data[index].stop && rrun.test(index)) {
									stopQueue(data[index]);
								}
							}
						}

						for (index = timers.length; index--;) {
							if (timers[index].elem === this && (type == null || timers[index].queue === type)) {

								timers[index].anim.stop(gotoEnd);
								dequeue = false;
								timers.splice(index, 1);
							}
						}

						// Start the next in the queue if the last step wasn't forced.
						// Timers currently will call their complete callbacks, which
						// will dequeue but only if they were gotoEnd.
						if (dequeue || !gotoEnd) {
							jQuery.dequeue(this, type);
						}
					});
				},
				finish: function (type) {
					if (type !== false) {
						type = type || "fx";
					}
					return this.each(function () {
						var index,
						    data = dataPriv.get(this),
						    queue = data[type + "queue"],
						    hooks = data[type + "queueHooks"],
						    timers = jQuery.timers,
						    length = queue ? queue.length : 0;

						// Enable finishing flag on private data
						data.finish = true;

						// Empty the queue first
						jQuery.queue(this, type, []);

						if (hooks && hooks.stop) {
							hooks.stop.call(this, true);
						}

						// Look for any active animations, and finish them
						for (index = timers.length; index--;) {
							if (timers[index].elem === this && timers[index].queue === type) {
								timers[index].anim.stop(true);
								timers.splice(index, 1);
							}
						}

						// Look for any animations in the old queue and finish them
						for (index = 0; index < length; index++) {
							if (queue[index] && queue[index].finish) {
								queue[index].finish.call(this);
							}
						}

						// Turn off finishing flag
						delete data.finish;
					});
				}
			});

			jQuery.each(["toggle", "show", "hide"], function (i, name) {
				var cssFn = jQuery.fn[name];
				jQuery.fn[name] = function (speed, easing, callback) {
					return speed == null || typeof speed === "boolean" ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
				};
			});

			// Generate shortcuts for custom animations
			jQuery.each({
				slideDown: genFx("show"),
				slideUp: genFx("hide"),
				slideToggle: genFx("toggle"),
				fadeIn: { opacity: "show" },
				fadeOut: { opacity: "hide" },
				fadeToggle: { opacity: "toggle" }
			}, function (name, props) {
				jQuery.fn[name] = function (speed, easing, callback) {
					return this.animate(props, speed, easing, callback);
				};
			});

			jQuery.timers = [];
			jQuery.fx.tick = function () {
				var timer,
				    i = 0,
				    timers = jQuery.timers;

				fxNow = jQuery.now();

				for (; i < timers.length; i++) {
					timer = timers[i];

					// Run the timer and safely remove it when done (allowing for external removal)
					if (!timer() && timers[i] === timer) {
						timers.splice(i--, 1);
					}
				}

				if (!timers.length) {
					jQuery.fx.stop();
				}
				fxNow = undefined;
			};

			jQuery.fx.timer = function (timer) {
				jQuery.timers.push(timer);
				jQuery.fx.start();
			};

			jQuery.fx.interval = 13;
			jQuery.fx.start = function () {
				if (inProgress) {
					return;
				}

				inProgress = true;
				schedule();
			};

			jQuery.fx.stop = function () {
				inProgress = null;
			};

			jQuery.fx.speeds = {
				slow: 600,
				fast: 200,

				// Default speed
				_default: 400
			};

			// Based off of the plugin by Clint Helfers, with permission.
			// https://web.archive.org/web/20100324014747/http://blindsignals.com/index.php/2009/07/jquery-delay/
			jQuery.fn.delay = function (time, type) {
				time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
				type = type || "fx";

				return this.queue(type, function (next, hooks) {
					var timeout = window.setTimeout(next, time);
					hooks.stop = function () {
						window.clearTimeout(timeout);
					};
				});
			};

			(function () {
				var input = document.createElement("input"),
				    select = document.createElement("select"),
				    opt = select.appendChild(document.createElement("option"));

				input.type = "checkbox";

				// Support: Android <=4.3 only
				// Default value for a checkbox should be "on"
				support.checkOn = input.value !== "";

				// Support: IE <=11 only
				// Must access selectedIndex to make default options select
				support.optSelected = opt.selected;

				// Support: IE <=11 only
				// An input loses its value after becoming a radio
				input = document.createElement("input");
				input.value = "t";
				input.type = "radio";
				support.radioValue = input.value === "t";
			})();

			var boolHook,
			    attrHandle = jQuery.expr.attrHandle;

			jQuery.fn.extend({
				attr: function (name, value) {
					return access(this, jQuery.attr, name, value, arguments.length > 1);
				},

				removeAttr: function (name) {
					return this.each(function () {
						jQuery.removeAttr(this, name);
					});
				}
			});

			jQuery.extend({
				attr: function (elem, name, value) {
					var ret,
					    hooks,
					    nType = elem.nodeType;

					// Don't get/set attributes on text, comment and attribute nodes
					if (nType === 3 || nType === 8 || nType === 2) {
						return;
					}

					// Fallback to prop when attributes are not supported
					if (typeof elem.getAttribute === "undefined") {
						return jQuery.prop(elem, name, value);
					}

					// Attribute hooks are determined by the lowercase version
					// Grab necessary hook if one is defined
					if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
						hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
					}

					if (value !== undefined) {
						if (value === null) {
							jQuery.removeAttr(elem, name);
							return;
						}

						if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
							return ret;
						}

						elem.setAttribute(name, value + "");
						return value;
					}

					if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
						return ret;
					}

					ret = jQuery.find.attr(elem, name);

					// Non-existent attributes return null, we normalize to undefined
					return ret == null ? undefined : ret;
				},

				attrHooks: {
					type: {
						set: function (elem, value) {
							if (!support.radioValue && value === "radio" && nodeName(elem, "input")) {
								var val = elem.value;
								elem.setAttribute("type", value);
								if (val) {
									elem.value = val;
								}
								return value;
							}
						}
					}
				},

				removeAttr: function (elem, value) {
					var name,
					    i = 0,


					// Attribute names can contain non-HTML whitespace characters
					// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
					attrNames = value && value.match(rnothtmlwhite);

					if (attrNames && elem.nodeType === 1) {
						while (name = attrNames[i++]) {
							elem.removeAttribute(name);
						}
					}
				}
			});

			// Hooks for boolean attributes
			boolHook = {
				set: function (elem, value, name) {
					if (value === false) {

						// Remove boolean attributes when set to false
						jQuery.removeAttr(elem, name);
					} else {
						elem.setAttribute(name, name);
					}
					return name;
				}
			};

			jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function (i, name) {
				var getter = attrHandle[name] || jQuery.find.attr;

				attrHandle[name] = function (elem, name, isXML) {
					var ret,
					    handle,
					    lowercaseName = name.toLowerCase();

					if (!isXML) {

						// Avoid an infinite loop by temporarily removing this function from the getter
						handle = attrHandle[lowercaseName];
						attrHandle[lowercaseName] = ret;
						ret = getter(elem, name, isXML) != null ? lowercaseName : null;
						attrHandle[lowercaseName] = handle;
					}
					return ret;
				};
			});

			var rfocusable = /^(?:input|select|textarea|button)$/i,
			    rclickable = /^(?:a|area)$/i;

			jQuery.fn.extend({
				prop: function (name, value) {
					return access(this, jQuery.prop, name, value, arguments.length > 1);
				},

				removeProp: function (name) {
					return this.each(function () {
						delete this[jQuery.propFix[name] || name];
					});
				}
			});

			jQuery.extend({
				prop: function (elem, name, value) {
					var ret,
					    hooks,
					    nType = elem.nodeType;

					// Don't get/set properties on text, comment and attribute nodes
					if (nType === 3 || nType === 8 || nType === 2) {
						return;
					}

					if (nType !== 1 || !jQuery.isXMLDoc(elem)) {

						// Fix name and attach hooks
						name = jQuery.propFix[name] || name;
						hooks = jQuery.propHooks[name];
					}

					if (value !== undefined) {
						if (hooks && "set" in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
							return ret;
						}

						return elem[name] = value;
					}

					if (hooks && "get" in hooks && (ret = hooks.get(elem, name)) !== null) {
						return ret;
					}

					return elem[name];
				},

				propHooks: {
					tabIndex: {
						get: function (elem) {

							// Support: IE <=9 - 11 only
							// elem.tabIndex doesn't always return the
							// correct value when it hasn't been explicitly set
							// https://web.archive.org/web/20141116233347/http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
							// Use proper attribute retrieval(#12072)
							var tabindex = jQuery.find.attr(elem, "tabindex");

							if (tabindex) {
								return parseInt(tabindex, 10);
							}

							if (rfocusable.test(elem.nodeName) || rclickable.test(elem.nodeName) && elem.href) {
								return 0;
							}

							return -1;
						}
					}
				},

				propFix: {
					"for": "htmlFor",
					"class": "className"
				}
			});

			// Support: IE <=11 only
			// Accessing the selectedIndex property
			// forces the browser to respect setting selected
			// on the option
			// The getter ensures a default option is selected
			// when in an optgroup
			// eslint rule "no-unused-expressions" is disabled for this code
			// since it considers such accessions noop
			if (!support.optSelected) {
				jQuery.propHooks.selected = {
					get: function (elem) {

						/* eslint no-unused-expressions: "off" */

						var parent = elem.parentNode;
						if (parent && parent.parentNode) {
							parent.parentNode.selectedIndex;
						}
						return null;
					},
					set: function (elem) {

						/* eslint no-unused-expressions: "off" */

						var parent = elem.parentNode;
						if (parent) {
							parent.selectedIndex;

							if (parent.parentNode) {
								parent.parentNode.selectedIndex;
							}
						}
					}
				};
			}

			jQuery.each(["tabIndex", "readOnly", "maxLength", "cellSpacing", "cellPadding", "rowSpan", "colSpan", "useMap", "frameBorder", "contentEditable"], function () {
				jQuery.propFix[this.toLowerCase()] = this;
			});

			// Strip and collapse whitespace according to HTML spec
			// https://html.spec.whatwg.org/multipage/infrastructure.html#strip-and-collapse-whitespace
			function stripAndCollapse(value) {
				var tokens = value.match(rnothtmlwhite) || [];
				return tokens.join(" ");
			}

			function getClass(elem) {
				return elem.getAttribute && elem.getAttribute("class") || "";
			}

			jQuery.fn.extend({
				addClass: function (value) {
					var classes,
					    elem,
					    cur,
					    curValue,
					    clazz,
					    j,
					    finalValue,
					    i = 0;

					if (jQuery.isFunction(value)) {
						return this.each(function (j) {
							jQuery(this).addClass(value.call(this, j, getClass(this)));
						});
					}

					if (typeof value === "string" && value) {
						classes = value.match(rnothtmlwhite) || [];

						while (elem = this[i++]) {
							curValue = getClass(elem);
							cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";

							if (cur) {
								j = 0;
								while (clazz = classes[j++]) {
									if (cur.indexOf(" " + clazz + " ") < 0) {
										cur += clazz + " ";
									}
								}

								// Only assign if different to avoid unneeded rendering.
								finalValue = stripAndCollapse(cur);
								if (curValue !== finalValue) {
									elem.setAttribute("class", finalValue);
								}
							}
						}
					}

					return this;
				},

				removeClass: function (value) {
					var classes,
					    elem,
					    cur,
					    curValue,
					    clazz,
					    j,
					    finalValue,
					    i = 0;

					if (jQuery.isFunction(value)) {
						return this.each(function (j) {
							jQuery(this).removeClass(value.call(this, j, getClass(this)));
						});
					}

					if (!arguments.length) {
						return this.attr("class", "");
					}

					if (typeof value === "string" && value) {
						classes = value.match(rnothtmlwhite) || [];

						while (elem = this[i++]) {
							curValue = getClass(elem);

							// This expression is here for better compressibility (see addClass)
							cur = elem.nodeType === 1 && " " + stripAndCollapse(curValue) + " ";

							if (cur) {
								j = 0;
								while (clazz = classes[j++]) {

									// Remove *all* instances
									while (cur.indexOf(" " + clazz + " ") > -1) {
										cur = cur.replace(" " + clazz + " ", " ");
									}
								}

								// Only assign if different to avoid unneeded rendering.
								finalValue = stripAndCollapse(cur);
								if (curValue !== finalValue) {
									elem.setAttribute("class", finalValue);
								}
							}
						}
					}

					return this;
				},

				toggleClass: function (value, stateVal) {
					var type = typeof value;

					if (typeof stateVal === "boolean" && type === "string") {
						return stateVal ? this.addClass(value) : this.removeClass(value);
					}

					if (jQuery.isFunction(value)) {
						return this.each(function (i) {
							jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal);
						});
					}

					return this.each(function () {
						var className, i, self, classNames;

						if (type === "string") {

							// Toggle individual class names
							i = 0;
							self = jQuery(this);
							classNames = value.match(rnothtmlwhite) || [];

							while (className = classNames[i++]) {

								// Check each className given, space separated list
								if (self.hasClass(className)) {
									self.removeClass(className);
								} else {
									self.addClass(className);
								}
							}

							// Toggle whole class name
						} else if (value === undefined || type === "boolean") {
							className = getClass(this);
							if (className) {

								// Store className if set
								dataPriv.set(this, "__className__", className);
							}

							// If the element has a class name or if we're passed `false`,
							// then remove the whole classname (if there was one, the above saved it).
							// Otherwise bring back whatever was previously saved (if anything),
							// falling back to the empty string if nothing was stored.
							if (this.setAttribute) {
								this.setAttribute("class", className || value === false ? "" : dataPriv.get(this, "__className__") || "");
							}
						}
					});
				},

				hasClass: function (selector) {
					var className,
					    elem,
					    i = 0;

					className = " " + selector + " ";
					while (elem = this[i++]) {
						if (elem.nodeType === 1 && (" " + stripAndCollapse(getClass(elem)) + " ").indexOf(className) > -1) {
							return true;
						}
					}

					return false;
				}
			});

			var rreturn = /\r/g;

			jQuery.fn.extend({
				val: function (value) {
					var hooks,
					    ret,
					    isFunction,
					    elem = this[0];

					if (!arguments.length) {
						if (elem) {
							hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];

							if (hooks && "get" in hooks && (ret = hooks.get(elem, "value")) !== undefined) {
								return ret;
							}

							ret = elem.value;

							// Handle most common string cases
							if (typeof ret === "string") {
								return ret.replace(rreturn, "");
							}

							// Handle cases where value is null/undef or number
							return ret == null ? "" : ret;
						}

						return;
					}

					isFunction = jQuery.isFunction(value);

					return this.each(function (i) {
						var val;

						if (this.nodeType !== 1) {
							return;
						}

						if (isFunction) {
							val = value.call(this, i, jQuery(this).val());
						} else {
							val = value;
						}

						// Treat null/undefined as ""; convert numbers to string
						if (val == null) {
							val = "";
						} else if (typeof val === "number") {
							val += "";
						} else if (Array.isArray(val)) {
							val = jQuery.map(val, function (value) {
								return value == null ? "" : value + "";
							});
						}

						hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()];

						// If set returns undefined, fall back to normal setting
						if (!hooks || !("set" in hooks) || hooks.set(this, val, "value") === undefined) {
							this.value = val;
						}
					});
				}
			});

			jQuery.extend({
				valHooks: {
					option: {
						get: function (elem) {

							var val = jQuery.find.attr(elem, "value");
							return val != null ? val :

							// Support: IE <=10 - 11 only
							// option.text throws exceptions (#14686, #14858)
							// Strip and collapse whitespace
							// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
							stripAndCollapse(jQuery.text(elem));
						}
					},
					select: {
						get: function (elem) {
							var value,
							    option,
							    i,
							    options = elem.options,
							    index = elem.selectedIndex,
							    one = elem.type === "select-one",
							    values = one ? null : [],
							    max = one ? index + 1 : options.length;

							if (index < 0) {
								i = max;
							} else {
								i = one ? index : 0;
							}

							// Loop through all the selected options
							for (; i < max; i++) {
								option = options[i];

								// Support: IE <=9 only
								// IE8-9 doesn't update selected after form reset (#2551)
								if ((option.selected || i === index) &&

								// Don't return options that are disabled or in a disabled optgroup
								!option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, "optgroup"))) {

									// Get the specific value for the option
									value = jQuery(option).val();

									// We don't need an array for one selects
									if (one) {
										return value;
									}

									// Multi-Selects return an array
									values.push(value);
								}
							}

							return values;
						},

						set: function (elem, value) {
							var optionSet,
							    option,
							    options = elem.options,
							    values = jQuery.makeArray(value),
							    i = options.length;

							while (i--) {
								option = options[i];

								/* eslint-disable no-cond-assign */

								if (option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1) {
									optionSet = true;
								}

								/* eslint-enable no-cond-assign */
							}

							// Force browsers to behave consistently when non-matching value is set
							if (!optionSet) {
								elem.selectedIndex = -1;
							}
							return values;
						}
					}
				}
			});

			// Radios and checkboxes getter/setter
			jQuery.each(["radio", "checkbox"], function () {
				jQuery.valHooks[this] = {
					set: function (elem, value) {
						if (Array.isArray(value)) {
							return elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1;
						}
					}
				};
				if (!support.checkOn) {
					jQuery.valHooks[this].get = function (elem) {
						return elem.getAttribute("value") === null ? "on" : elem.value;
					};
				}
			});

			// Return jQuery for attributes-only inclusion


			var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/;

			jQuery.extend(jQuery.event, {

				trigger: function (event, data, elem, onlyHandlers) {

					var i,
					    cur,
					    tmp,
					    bubbleType,
					    ontype,
					    handle,
					    special,
					    eventPath = [elem || document],
					    type = hasOwn.call(event, "type") ? event.type : event,
					    namespaces = hasOwn.call(event, "namespace") ? event.namespace.split(".") : [];

					cur = tmp = elem = elem || document;

					// Don't do events on text and comment nodes
					if (elem.nodeType === 3 || elem.nodeType === 8) {
						return;
					}

					// focus/blur morphs to focusin/out; ensure we're not firing them right now
					if (rfocusMorph.test(type + jQuery.event.triggered)) {
						return;
					}

					if (type.indexOf(".") > -1) {

						// Namespaced trigger; create a regexp to match event type in handle()
						namespaces = type.split(".");
						type = namespaces.shift();
						namespaces.sort();
					}
					ontype = type.indexOf(":") < 0 && "on" + type;

					// Caller can pass in a jQuery.Event object, Object, or just an event type string
					event = event[jQuery.expando] ? event : new jQuery.Event(type, typeof event === "object" && event);

					// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
					event.isTrigger = onlyHandlers ? 2 : 3;
					event.namespace = namespaces.join(".");
					event.rnamespace = event.namespace ? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;

					// Clean up the event in case it is being reused
					event.result = undefined;
					if (!event.target) {
						event.target = elem;
					}

					// Clone any incoming data and prepend the event, creating the handler arg list
					data = data == null ? [event] : jQuery.makeArray(data, [event]);

					// Allow special events to draw outside the lines
					special = jQuery.event.special[type] || {};
					if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
						return;
					}

					// Determine event propagation path in advance, per W3C events spec (#9951)
					// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
					if (!onlyHandlers && !special.noBubble && !jQuery.isWindow(elem)) {

						bubbleType = special.delegateType || type;
						if (!rfocusMorph.test(bubbleType + type)) {
							cur = cur.parentNode;
						}
						for (; cur; cur = cur.parentNode) {
							eventPath.push(cur);
							tmp = cur;
						}

						// Only add window if we got to document (e.g., not plain obj or detached DOM)
						if (tmp === (elem.ownerDocument || document)) {
							eventPath.push(tmp.defaultView || tmp.parentWindow || window);
						}
					}

					// Fire handlers on the event path
					i = 0;
					while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {

						event.type = i > 1 ? bubbleType : special.bindType || type;

						// jQuery handler
						handle = (dataPriv.get(cur, "events") || {})[event.type] && dataPriv.get(cur, "handle");
						if (handle) {
							handle.apply(cur, data);
						}

						// Native handler
						handle = ontype && cur[ontype];
						if (handle && handle.apply && acceptData(cur)) {
							event.result = handle.apply(cur, data);
							if (event.result === false) {
								event.preventDefault();
							}
						}
					}
					event.type = type;

					// If nobody prevented the default action, do it now
					if (!onlyHandlers && !event.isDefaultPrevented()) {

						if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {

							// Call a native DOM method on the target with the same name as the event.
							// Don't do default actions on window, that's where global variables be (#6170)
							if (ontype && jQuery.isFunction(elem[type]) && !jQuery.isWindow(elem)) {

								// Don't re-trigger an onFOO event when we call its FOO() method
								tmp = elem[ontype];

								if (tmp) {
									elem[ontype] = null;
								}

								// Prevent re-triggering of the same event, since we already bubbled it above
								jQuery.event.triggered = type;
								elem[type]();
								jQuery.event.triggered = undefined;

								if (tmp) {
									elem[ontype] = tmp;
								}
							}
						}
					}

					return event.result;
				},

				// Piggyback on a donor event to simulate a different one
				// Used only for `focus(in | out)` events
				simulate: function (type, elem, event) {
					var e = jQuery.extend(new jQuery.Event(), event, {
						type: type,
						isSimulated: true
					});

					jQuery.event.trigger(e, null, elem);
				}

			});

			jQuery.fn.extend({

				trigger: function (type, data) {
					return this.each(function () {
						jQuery.event.trigger(type, data, this);
					});
				},
				triggerHandler: function (type, data) {
					var elem = this[0];
					if (elem) {
						return jQuery.event.trigger(type, data, elem, true);
					}
				}
			});

			jQuery.each(("blur focus focusin focusout resize scroll click dblclick " + "mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " + "change select submit keydown keypress keyup contextmenu").split(" "), function (i, name) {

				// Handle event binding
				jQuery.fn[name] = function (data, fn) {
					return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
				};
			});

			jQuery.fn.extend({
				hover: function (fnOver, fnOut) {
					return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
				}
			});

			support.focusin = "onfocusin" in window;

			// Support: Firefox <=44
			// Firefox doesn't have focus(in | out) events
			// Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
			//
			// Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
			// focus(in | out) events fire after focus & blur events,
			// which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
			// Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857
			if (!support.focusin) {
				jQuery.each({ focus: "focusin", blur: "focusout" }, function (orig, fix) {

					// Attach a single capturing handler on the document while someone wants focusin/focusout
					var handler = function (event) {
						jQuery.event.simulate(fix, event.target, jQuery.event.fix(event));
					};

					jQuery.event.special[fix] = {
						setup: function () {
							var doc = this.ownerDocument || this,
							    attaches = dataPriv.access(doc, fix);

							if (!attaches) {
								doc.addEventListener(orig, handler, true);
							}
							dataPriv.access(doc, fix, (attaches || 0) + 1);
						},
						teardown: function () {
							var doc = this.ownerDocument || this,
							    attaches = dataPriv.access(doc, fix) - 1;

							if (!attaches) {
								doc.removeEventListener(orig, handler, true);
								dataPriv.remove(doc, fix);
							} else {
								dataPriv.access(doc, fix, attaches);
							}
						}
					};
				});
			}
			var location = window.location;

			var nonce = jQuery.now();

			var rquery = /\?/;

			// Cross-browser xml parsing
			jQuery.parseXML = function (data) {
				var xml;
				if (!data || typeof data !== "string") {
					return null;
				}

				// Support: IE 9 - 11 only
				// IE throws on parseFromString with invalid input.
				try {
					xml = new window.DOMParser().parseFromString(data, "text/xml");
				} catch (e) {
					xml = undefined;
				}

				if (!xml || xml.getElementsByTagName("parsererror").length) {
					jQuery.error("Invalid XML: " + data);
				}
				return xml;
			};

			var rbracket = /\[\]$/,
			    rCRLF = /\r?\n/g,
			    rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
			    rsubmittable = /^(?:input|select|textarea|keygen)/i;

			function buildParams(prefix, obj, traditional, add) {
				var name;

				if (Array.isArray(obj)) {

					// Serialize array item.
					jQuery.each(obj, function (i, v) {
						if (traditional || rbracket.test(prefix)) {

							// Treat each array item as a scalar.
							add(prefix, v);
						} else {

							// Item is non-scalar (array or object), encode its numeric index.
							buildParams(prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]", v, traditional, add);
						}
					});
				} else if (!traditional && jQuery.type(obj) === "object") {

					// Serialize object item.
					for (name in obj) {
						buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
					}
				} else {

					// Serialize scalar item.
					add(prefix, obj);
				}
			}

			// Serialize an array of form elements or a set of
			// key/values into a query string
			jQuery.param = function (a, traditional) {
				var prefix,
				    s = [],
				    add = function (key, valueOrFunction) {

					// If value is a function, invoke it and use its return value
					var value = jQuery.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;

					s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
				};

				// If an array was passed in, assume that it is an array of form elements.
				if (Array.isArray(a) || a.jquery && !jQuery.isPlainObject(a)) {

					// Serialize the form elements
					jQuery.each(a, function () {
						add(this.name, this.value);
					});
				} else {

					// If traditional, encode the "old" way (the way 1.3.2 or older
					// did it), otherwise encode params recursively.
					for (prefix in a) {
						buildParams(prefix, a[prefix], traditional, add);
					}
				}

				// Return the resulting serialization
				return s.join("&");
			};

			jQuery.fn.extend({
				serialize: function () {
					return jQuery.param(this.serializeArray());
				},
				serializeArray: function () {
					return this.map(function () {

						// Can add propHook for "elements" to filter or add form elements
						var elements = jQuery.prop(this, "elements");
						return elements ? jQuery.makeArray(elements) : this;
					}).filter(function () {
						var type = this.type;

						// Use .is( ":disabled" ) so that fieldset[disabled] works
						return this.name && !jQuery(this).is(":disabled") && rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) && (this.checked || !rcheckableType.test(type));
					}).map(function (i, elem) {
						var val = jQuery(this).val();

						if (val == null) {
							return null;
						}

						if (Array.isArray(val)) {
							return jQuery.map(val, function (val) {
								return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
							});
						}

						return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
					}).get();
				}
			});

			var r20 = /%20/g,
			    rhash = /#.*$/,
			    rantiCache = /([?&])_=[^&]*/,
			    rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,


			// #7653, #8125, #8152: local protocol detection
			rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
			    rnoContent = /^(?:GET|HEAD)$/,
			    rprotocol = /^\/\//,


			/* Prefilters
    * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
    * 2) These are called:
    *    - BEFORE asking for a transport
    *    - AFTER param serialization (s.data is a string if s.processData is true)
    * 3) key is the dataType
    * 4) the catchall symbol "*" can be used
    * 5) execution will start with transport dataType and THEN continue down to "*" if needed
    */
			prefilters = {},


			/* Transports bindings
    * 1) key is the dataType
    * 2) the catchall symbol "*" can be used
    * 3) selection will start with transport dataType and THEN go to "*" if needed
    */
			transports = {},


			// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
			allTypes = "*/".concat("*"),


			// Anchor tag for parsing the document origin
			originAnchor = document.createElement("a");
			originAnchor.href = location.href;

			// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
			function addToPrefiltersOrTransports(structure) {

				// dataTypeExpression is optional and defaults to "*"
				return function (dataTypeExpression, func) {

					if (typeof dataTypeExpression !== "string") {
						func = dataTypeExpression;
						dataTypeExpression = "*";
					}

					var dataType,
					    i = 0,
					    dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];

					if (jQuery.isFunction(func)) {

						// For each dataType in the dataTypeExpression
						while (dataType = dataTypes[i++]) {

							// Prepend if requested
							if (dataType[0] === "+") {
								dataType = dataType.slice(1) || "*";
								(structure[dataType] = structure[dataType] || []).unshift(func);

								// Otherwise append
							} else {
								(structure[dataType] = structure[dataType] || []).push(func);
							}
						}
					}
				};
			}

			// Base inspection function for prefilters and transports
			function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {

				var inspected = {},
				    seekingTransport = structure === transports;

				function inspect(dataType) {
					var selected;
					inspected[dataType] = true;
					jQuery.each(structure[dataType] || [], function (_, prefilterOrFactory) {
						var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
						if (typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[dataTypeOrTransport]) {

							options.dataTypes.unshift(dataTypeOrTransport);
							inspect(dataTypeOrTransport);
							return false;
						} else if (seekingTransport) {
							return !(selected = dataTypeOrTransport);
						}
					});
					return selected;
				}

				return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
			}

			// A special extend for ajax options
			// that takes "flat" options (not to be deep extended)
			// Fixes #9887
			function ajaxExtend(target, src) {
				var key,
				    deep,
				    flatOptions = jQuery.ajaxSettings.flatOptions || {};

				for (key in src) {
					if (src[key] !== undefined) {
						(flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
					}
				}
				if (deep) {
					jQuery.extend(true, target, deep);
				}

				return target;
			}

			/* Handles responses to an ajax request:
    * - finds the right dataType (mediates between content-type and expected dataType)
    * - returns the corresponding response
    */
			function ajaxHandleResponses(s, jqXHR, responses) {

				var ct,
				    type,
				    finalDataType,
				    firstDataType,
				    contents = s.contents,
				    dataTypes = s.dataTypes;

				// Remove auto dataType and get content-type in the process
				while (dataTypes[0] === "*") {
					dataTypes.shift();
					if (ct === undefined) {
						ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
					}
				}

				// Check if we're dealing with a known content-type
				if (ct) {
					for (type in contents) {
						if (contents[type] && contents[type].test(ct)) {
							dataTypes.unshift(type);
							break;
						}
					}
				}

				// Check to see if we have a response for the expected dataType
				if (dataTypes[0] in responses) {
					finalDataType = dataTypes[0];
				} else {

					// Try convertible dataTypes
					for (type in responses) {
						if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
							finalDataType = type;
							break;
						}
						if (!firstDataType) {
							firstDataType = type;
						}
					}

					// Or just use first one
					finalDataType = finalDataType || firstDataType;
				}

				// If we found a dataType
				// We add the dataType to the list if needed
				// and return the corresponding response
				if (finalDataType) {
					if (finalDataType !== dataTypes[0]) {
						dataTypes.unshift(finalDataType);
					}
					return responses[finalDataType];
				}
			}

			/* Chain conversions given the request and the original response
    * Also sets the responseXXX fields on the jqXHR instance
    */
			function ajaxConvert(s, response, jqXHR, isSuccess) {
				var conv2,
				    current,
				    conv,
				    tmp,
				    prev,
				    converters = {},


				// Work with a copy of dataTypes in case we need to modify it for conversion
				dataTypes = s.dataTypes.slice();

				// Create converters map with lowercased keys
				if (dataTypes[1]) {
					for (conv in s.converters) {
						converters[conv.toLowerCase()] = s.converters[conv];
					}
				}

				current = dataTypes.shift();

				// Convert to each sequential dataType
				while (current) {

					if (s.responseFields[current]) {
						jqXHR[s.responseFields[current]] = response;
					}

					// Apply the dataFilter if provided
					if (!prev && isSuccess && s.dataFilter) {
						response = s.dataFilter(response, s.dataType);
					}

					prev = current;
					current = dataTypes.shift();

					if (current) {

						// There's only work to do if current dataType is non-auto
						if (current === "*") {

							current = prev;

							// Convert response if prev dataType is non-auto and differs from current
						} else if (prev !== "*" && prev !== current) {

							// Seek a direct converter
							conv = converters[prev + " " + current] || converters["* " + current];

							// If none found, seek a pair
							if (!conv) {
								for (conv2 in converters) {

									// If conv2 outputs current
									tmp = conv2.split(" ");
									if (tmp[1] === current) {

										// If prev can be converted to accepted input
										conv = converters[prev + " " + tmp[0]] || converters["* " + tmp[0]];
										if (conv) {

											// Condense equivalence converters
											if (conv === true) {
												conv = converters[conv2];

												// Otherwise, insert the intermediate dataType
											} else if (converters[conv2] !== true) {
												current = tmp[0];
												dataTypes.unshift(tmp[1]);
											}
											break;
										}
									}
								}
							}

							// Apply converter (if not an equivalence)
							if (conv !== true) {

								// Unless errors are allowed to bubble, catch and return them
								if (conv && s.throws) {
									response = conv(response);
								} else {
									try {
										response = conv(response);
									} catch (e) {
										return {
											state: "parsererror",
											error: conv ? e : "No conversion from " + prev + " to " + current
										};
									}
								}
							}
						}
					}
				}

				return { state: "success", data: response };
			}

			jQuery.extend({

				// Counter for holding the number of active queries
				active: 0,

				// Last-Modified header cache for next request
				lastModified: {},
				etag: {},

				ajaxSettings: {
					url: location.href,
					type: "GET",
					isLocal: rlocalProtocol.test(location.protocol),
					global: true,
					processData: true,
					async: true,
					contentType: "application/x-www-form-urlencoded; charset=UTF-8",

					/*
     timeout: 0,
     data: null,
     dataType: null,
     username: null,
     password: null,
     cache: null,
     throws: false,
     traditional: false,
     headers: {},
     */

					accepts: {
						"*": allTypes,
						text: "text/plain",
						html: "text/html",
						xml: "application/xml, text/xml",
						json: "application/json, text/javascript"
					},

					contents: {
						xml: /\bxml\b/,
						html: /\bhtml/,
						json: /\bjson\b/
					},

					responseFields: {
						xml: "responseXML",
						text: "responseText",
						json: "responseJSON"
					},

					// Data converters
					// Keys separate source (or catchall "*") and destination types with a single space
					converters: {

						// Convert anything to text
						"* text": String,

						// Text to html (true = no transformation)
						"text html": true,

						// Evaluate text as a json expression
						"text json": JSON.parse,

						// Parse text as xml
						"text xml": jQuery.parseXML
					},

					// For options that shouldn't be deep extended:
					// you can add your own custom options here if
					// and when you create one that shouldn't be
					// deep extended (see ajaxExtend)
					flatOptions: {
						url: true,
						context: true
					}
				},

				// Creates a full fledged settings object into target
				// with both ajaxSettings and settings fields.
				// If target is omitted, writes into ajaxSettings.
				ajaxSetup: function (target, settings) {
					return settings ?

					// Building a settings object
					ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) :

					// Extending ajaxSettings
					ajaxExtend(jQuery.ajaxSettings, target);
				},

				ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
				ajaxTransport: addToPrefiltersOrTransports(transports),

				// Main method
				ajax: function (url, options) {

					// If url is an object, simulate pre-1.5 signature
					if (typeof url === "object") {
						options = url;
						url = undefined;
					}

					// Force options to be an object
					options = options || {};

					var transport,


					// URL without anti-cache param
					cacheURL,


					// Response headers
					responseHeadersString,
					    responseHeaders,


					// timeout handle
					timeoutTimer,


					// Url cleanup var
					urlAnchor,


					// Request state (becomes false upon send and true upon completion)
					completed,


					// To know if global events are to be dispatched
					fireGlobals,


					// Loop variable
					i,


					// uncached part of the url
					uncached,


					// Create the final options object
					s = jQuery.ajaxSetup({}, options),


					// Callbacks context
					callbackContext = s.context || s,


					// Context for global events is callbackContext if it is a DOM node or jQuery collection
					globalEventContext = s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event,


					// Deferreds
					deferred = jQuery.Deferred(),
					    completeDeferred = jQuery.Callbacks("once memory"),


					// Status-dependent callbacks
					statusCode = s.statusCode || {},


					// Headers (they are sent all at once)
					requestHeaders = {},
					    requestHeadersNames = {},


					// Default abort message
					strAbort = "canceled",


					// Fake xhr
					jqXHR = {
						readyState: 0,

						// Builds headers hashtable if needed
						getResponseHeader: function (key) {
							var match;
							if (completed) {
								if (!responseHeaders) {
									responseHeaders = {};
									while (match = rheaders.exec(responseHeadersString)) {
										responseHeaders[match[1].toLowerCase()] = match[2];
									}
								}
								match = responseHeaders[key.toLowerCase()];
							}
							return match == null ? null : match;
						},

						// Raw string
						getAllResponseHeaders: function () {
							return completed ? responseHeadersString : null;
						},

						// Caches the header
						setRequestHeader: function (name, value) {
							if (completed == null) {
								name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
								requestHeaders[name] = value;
							}
							return this;
						},

						// Overrides response content-type header
						overrideMimeType: function (type) {
							if (completed == null) {
								s.mimeType = type;
							}
							return this;
						},

						// Status-dependent callbacks
						statusCode: function (map) {
							var code;
							if (map) {
								if (completed) {

									// Execute the appropriate callbacks
									jqXHR.always(map[jqXHR.status]);
								} else {

									// Lazy-add the new callbacks in a way that preserves old ones
									for (code in map) {
										statusCode[code] = [statusCode[code], map[code]];
									}
								}
							}
							return this;
						},

						// Cancel the request
						abort: function (statusText) {
							var finalText = statusText || strAbort;
							if (transport) {
								transport.abort(finalText);
							}
							done(0, finalText);
							return this;
						}
					};

					// Attach deferreds
					deferred.promise(jqXHR);

					// Add protocol if not provided (prefilters might expect it)
					// Handle falsy url in the settings object (#10093: consistency with old signature)
					// We also use the url parameter if available
					s.url = ((url || s.url || location.href) + "").replace(rprotocol, location.protocol + "//");

					// Alias method option to type as per ticket #12004
					s.type = options.method || options.type || s.method || s.type;

					// Extract dataTypes list
					s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];

					// A cross-domain request is in order when the origin doesn't match the current origin.
					if (s.crossDomain == null) {
						urlAnchor = document.createElement("a");

						// Support: IE <=8 - 11, Edge 12 - 13
						// IE throws exception on accessing the href property if url is malformed,
						// e.g. http://example.com:80x/
						try {
							urlAnchor.href = s.url;

							// Support: IE <=8 - 11 only
							// Anchor's host property isn't correctly set when s.url is relative
							urlAnchor.href = urlAnchor.href;
							s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
						} catch (e) {

							// If there is an error parsing the URL, assume it is crossDomain,
							// it can be rejected by the transport if it is invalid
							s.crossDomain = true;
						}
					}

					// Convert data if not already a string
					if (s.data && s.processData && typeof s.data !== "string") {
						s.data = jQuery.param(s.data, s.traditional);
					}

					// Apply prefilters
					inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);

					// If request was aborted inside a prefilter, stop there
					if (completed) {
						return jqXHR;
					}

					// We can fire global events as of now if asked to
					// Don't fire events if jQuery.event is undefined in an AMD-usage scenario (#15118)
					fireGlobals = jQuery.event && s.global;

					// Watch for a new set of requests
					if (fireGlobals && jQuery.active++ === 0) {
						jQuery.event.trigger("ajaxStart");
					}

					// Uppercase the type
					s.type = s.type.toUpperCase();

					// Determine if request has content
					s.hasContent = !rnoContent.test(s.type);

					// Save the URL in case we're toying with the If-Modified-Since
					// and/or If-None-Match header later on
					// Remove hash to simplify url manipulation
					cacheURL = s.url.replace(rhash, "");

					// More options handling for requests with no content
					if (!s.hasContent) {

						// Remember the hash so we can put it back
						uncached = s.url.slice(cacheURL.length);

						// If data is available, append data to url
						if (s.data) {
							cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;

							// #9682: remove data so that it's not used in an eventual retry
							delete s.data;
						}

						// Add or update anti-cache param if needed
						if (s.cache === false) {
							cacheURL = cacheURL.replace(rantiCache, "$1");
							uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce++ + uncached;
						}

						// Put hash and anti-cache on the URL that will be requested (gh-1732)
						s.url = cacheURL + uncached;

						// Change '%20' to '+' if this is encoded form body content (gh-2658)
					} else if (s.data && s.processData && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
						s.data = s.data.replace(r20, "+");
					}

					// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
					if (s.ifModified) {
						if (jQuery.lastModified[cacheURL]) {
							jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
						}
						if (jQuery.etag[cacheURL]) {
							jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
						}
					}

					// Set the correct header, if data is being sent
					if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
						jqXHR.setRequestHeader("Content-Type", s.contentType);
					}

					// Set the Accepts header for the server, depending on the dataType
					jqXHR.setRequestHeader("Accept", s.dataTypes[0] && s.accepts[s.dataTypes[0]] ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") : s.accepts["*"]);

					// Check for headers option
					for (i in s.headers) {
						jqXHR.setRequestHeader(i, s.headers[i]);
					}

					// Allow custom headers/mimetypes and early abort
					if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) {

						// Abort if not done already and return
						return jqXHR.abort();
					}

					// Aborting is no longer a cancellation
					strAbort = "abort";

					// Install callbacks on deferreds
					completeDeferred.add(s.complete);
					jqXHR.done(s.success);
					jqXHR.fail(s.error);

					// Get transport
					transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);

					// If no transport, we auto-abort
					if (!transport) {
						done(-1, "No Transport");
					} else {
						jqXHR.readyState = 1;

						// Send global event
						if (fireGlobals) {
							globalEventContext.trigger("ajaxSend", [jqXHR, s]);
						}

						// If request was aborted inside ajaxSend, stop there
						if (completed) {
							return jqXHR;
						}

						// Timeout
						if (s.async && s.timeout > 0) {
							timeoutTimer = window.setTimeout(function () {
								jqXHR.abort("timeout");
							}, s.timeout);
						}

						try {
							completed = false;
							transport.send(requestHeaders, done);
						} catch (e) {

							// Rethrow post-completion exceptions
							if (completed) {
								throw e;
							}

							// Propagate others as results
							done(-1, e);
						}
					}

					// Callback for when everything is done
					function done(status, nativeStatusText, responses, headers) {
						var isSuccess,
						    success,
						    error,
						    response,
						    modified,
						    statusText = nativeStatusText;

						// Ignore repeat invocations
						if (completed) {
							return;
						}

						completed = true;

						// Clear timeout if it exists
						if (timeoutTimer) {
							window.clearTimeout(timeoutTimer);
						}

						// Dereference transport for early garbage collection
						// (no matter how long the jqXHR object will be used)
						transport = undefined;

						// Cache response headers
						responseHeadersString = headers || "";

						// Set readyState
						jqXHR.readyState = status > 0 ? 4 : 0;

						// Determine if successful
						isSuccess = status >= 200 && status < 300 || status === 304;

						// Get response data
						if (responses) {
							response = ajaxHandleResponses(s, jqXHR, responses);
						}

						// Convert no matter what (that way responseXXX fields are always set)
						response = ajaxConvert(s, response, jqXHR, isSuccess);

						// If successful, handle type chaining
						if (isSuccess) {

							// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
							if (s.ifModified) {
								modified = jqXHR.getResponseHeader("Last-Modified");
								if (modified) {
									jQuery.lastModified[cacheURL] = modified;
								}
								modified = jqXHR.getResponseHeader("etag");
								if (modified) {
									jQuery.etag[cacheURL] = modified;
								}
							}

							// if no content
							if (status === 204 || s.type === "HEAD") {
								statusText = "nocontent";

								// if not modified
							} else if (status === 304) {
								statusText = "notmodified";

								// If we have data, let's convert it
							} else {
								statusText = response.state;
								success = response.data;
								error = response.error;
								isSuccess = !error;
							}
						} else {

							// Extract error from statusText and normalize for non-aborts
							error = statusText;
							if (status || !statusText) {
								statusText = "error";
								if (status < 0) {
									status = 0;
								}
							}
						}

						// Set data for the fake xhr object
						jqXHR.status = status;
						jqXHR.statusText = (nativeStatusText || statusText) + "";

						// Success/Error
						if (isSuccess) {
							deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
						} else {
							deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
						}

						// Status-dependent callbacks
						jqXHR.statusCode(statusCode);
						statusCode = undefined;

						if (fireGlobals) {
							globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError", [jqXHR, s, isSuccess ? success : error]);
						}

						// Complete
						completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);

						if (fireGlobals) {
							globalEventContext.trigger("ajaxComplete", [jqXHR, s]);

							// Handle the global AJAX counter
							if (! --jQuery.active) {
								jQuery.event.trigger("ajaxStop");
							}
						}
					}

					return jqXHR;
				},

				getJSON: function (url, data, callback) {
					return jQuery.get(url, data, callback, "json");
				},

				getScript: function (url, callback) {
					return jQuery.get(url, undefined, callback, "script");
				}
			});

			jQuery.each(["get", "post"], function (i, method) {
				jQuery[method] = function (url, data, callback, type) {

					// Shift arguments if data argument was omitted
					if (jQuery.isFunction(data)) {
						type = type || callback;
						callback = data;
						data = undefined;
					}

					// The url can be an options object (which then must have .url)
					return jQuery.ajax(jQuery.extend({
						url: url,
						type: method,
						dataType: type,
						data: data,
						success: callback
					}, jQuery.isPlainObject(url) && url));
				};
			});

			jQuery._evalUrl = function (url) {
				return jQuery.ajax({
					url: url,

					// Make this explicit, since user can override this through ajaxSetup (#11264)
					type: "GET",
					dataType: "script",
					cache: true,
					async: false,
					global: false,
					"throws": true
				});
			};

			jQuery.fn.extend({
				wrapAll: function (html) {
					var wrap;

					if (this[0]) {
						if (jQuery.isFunction(html)) {
							html = html.call(this[0]);
						}

						// The elements to wrap the target around
						wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);

						if (this[0].parentNode) {
							wrap.insertBefore(this[0]);
						}

						wrap.map(function () {
							var elem = this;

							while (elem.firstElementChild) {
								elem = elem.firstElementChild;
							}

							return elem;
						}).append(this);
					}

					return this;
				},

				wrapInner: function (html) {
					if (jQuery.isFunction(html)) {
						return this.each(function (i) {
							jQuery(this).wrapInner(html.call(this, i));
						});
					}

					return this.each(function () {
						var self = jQuery(this),
						    contents = self.contents();

						if (contents.length) {
							contents.wrapAll(html);
						} else {
							self.append(html);
						}
					});
				},

				wrap: function (html) {
					var isFunction = jQuery.isFunction(html);

					return this.each(function (i) {
						jQuery(this).wrapAll(isFunction ? html.call(this, i) : html);
					});
				},

				unwrap: function (selector) {
					this.parent(selector).not("body").each(function () {
						jQuery(this).replaceWith(this.childNodes);
					});
					return this;
				}
			});

			jQuery.expr.pseudos.hidden = function (elem) {
				return !jQuery.expr.pseudos.visible(elem);
			};
			jQuery.expr.pseudos.visible = function (elem) {
				return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
			};

			jQuery.ajaxSettings.xhr = function () {
				try {
					return new window.XMLHttpRequest();
				} catch (e) {}
			};

			var xhrSuccessStatus = {

				// File protocol always yields status code 0, assume 200
				0: 200,

				// Support: IE <=9 only
				// #1450: sometimes IE returns 1223 when it should be 204
				1223: 204
			},
			    xhrSupported = jQuery.ajaxSettings.xhr();

			support.cors = !!xhrSupported && "withCredentials" in xhrSupported;
			support.ajax = xhrSupported = !!xhrSupported;

			jQuery.ajaxTransport(function (options) {
				var callback, errorCallback;

				// Cross domain only allowed if supported through XMLHttpRequest
				if (support.cors || xhrSupported && !options.crossDomain) {
					return {
						send: function (headers, complete) {
							var i,
							    xhr = options.xhr();

							xhr.open(options.type, options.url, options.async, options.username, options.password);

							// Apply custom fields if provided
							if (options.xhrFields) {
								for (i in options.xhrFields) {
									xhr[i] = options.xhrFields[i];
								}
							}

							// Override mime type if needed
							if (options.mimeType && xhr.overrideMimeType) {
								xhr.overrideMimeType(options.mimeType);
							}

							// X-Requested-With header
							// For cross-domain requests, seeing as conditions for a preflight are
							// akin to a jigsaw puzzle, we simply never set it to be sure.
							// (it can always be set on a per-request basis or even using ajaxSetup)
							// For same-domain requests, won't change header if already provided.
							if (!options.crossDomain && !headers["X-Requested-With"]) {
								headers["X-Requested-With"] = "XMLHttpRequest";
							}

							// Set headers
							for (i in headers) {
								xhr.setRequestHeader(i, headers[i]);
							}

							// Callback
							callback = function (type) {
								return function () {
									if (callback) {
										callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.onreadystatechange = null;

										if (type === "abort") {
											xhr.abort();
										} else if (type === "error") {

											// Support: IE <=9 only
											// On a manual native abort, IE9 throws
											// errors on any property access that is not readyState
											if (typeof xhr.status !== "number") {
												complete(0, "error");
											} else {
												complete(

												// File: protocol always yields status 0; see #8605, #14207
												xhr.status, xhr.statusText);
											}
										} else {
											complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText,

											// Support: IE <=9 only
											// IE9 has no XHR2 but throws on binary (trac-11426)
											// For XHR2 non-text, let the caller handle it (gh-2498)
											(xhr.responseType || "text") !== "text" || typeof xhr.responseText !== "string" ? { binary: xhr.response } : { text: xhr.responseText }, xhr.getAllResponseHeaders());
										}
									}
								};
							};

							// Listen to events
							xhr.onload = callback();
							errorCallback = xhr.onerror = callback("error");

							// Support: IE 9 only
							// Use onreadystatechange to replace onabort
							// to handle uncaught aborts
							if (xhr.onabort !== undefined) {
								xhr.onabort = errorCallback;
							} else {
								xhr.onreadystatechange = function () {

									// Check readyState before timeout as it changes
									if (xhr.readyState === 4) {

										// Allow onerror to be called first,
										// but that will not handle a native abort
										// Also, save errorCallback to a variable
										// as xhr.onerror cannot be accessed
										window.setTimeout(function () {
											if (callback) {
												errorCallback();
											}
										});
									}
								};
							}

							// Create the abort callback
							callback = callback("abort");

							try {

								// Do send the request (this may raise an exception)
								xhr.send(options.hasContent && options.data || null);
							} catch (e) {

								// #14683: Only rethrow if this hasn't been notified as an error yet
								if (callback) {
									throw e;
								}
							}
						},

						abort: function () {
							if (callback) {
								callback();
							}
						}
					};
				}
			});

			// Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)
			jQuery.ajaxPrefilter(function (s) {
				if (s.crossDomain) {
					s.contents.script = false;
				}
			});

			// Install script dataType
			jQuery.ajaxSetup({
				accepts: {
					script: "text/javascript, application/javascript, " + "application/ecmascript, application/x-ecmascript"
				},
				contents: {
					script: /\b(?:java|ecma)script\b/
				},
				converters: {
					"text script": function (text) {
						jQuery.globalEval(text);
						return text;
					}
				}
			});

			// Handle cache's special case and crossDomain
			jQuery.ajaxPrefilter("script", function (s) {
				if (s.cache === undefined) {
					s.cache = false;
				}
				if (s.crossDomain) {
					s.type = "GET";
				}
			});

			// Bind script tag hack transport
			jQuery.ajaxTransport("script", function (s) {

				// This transport only deals with cross domain requests
				if (s.crossDomain) {
					var script, callback;
					return {
						send: function (_, complete) {
							script = jQuery("<script>").prop({
								charset: s.scriptCharset,
								src: s.url
							}).on("load error", callback = function (evt) {
								script.remove();
								callback = null;
								if (evt) {
									complete(evt.type === "error" ? 404 : 200, evt.type);
								}
							});

							// Use native DOM manipulation to avoid our domManip AJAX trickery
							document.head.appendChild(script[0]);
						},
						abort: function () {
							if (callback) {
								callback();
							}
						}
					};
				}
			});

			var oldCallbacks = [],
			    rjsonp = /(=)\?(?=&|$)|\?\?/;

			// Default jsonp settings
			jQuery.ajaxSetup({
				jsonp: "callback",
				jsonpCallback: function () {
					var callback = oldCallbacks.pop() || jQuery.expando + "_" + nonce++;
					this[callback] = true;
					return callback;
				}
			});

			// Detect, normalize options and install callbacks for jsonp requests
			jQuery.ajaxPrefilter("json jsonp", function (s, originalSettings, jqXHR) {

				var callbackName,
				    overwritten,
				    responseContainer,
				    jsonProp = s.jsonp !== false && (rjsonp.test(s.url) ? "url" : typeof s.data === "string" && (s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0 && rjsonp.test(s.data) && "data");

				// Handle iff the expected data type is "jsonp" or we have a parameter to set
				if (jsonProp || s.dataTypes[0] === "jsonp") {

					// Get callback name, remembering preexisting value associated with it
					callbackName = s.jsonpCallback = jQuery.isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;

					// Insert callback into url or form data
					if (jsonProp) {
						s[jsonProp] = s[jsonProp].replace(rjsonp, "$1" + callbackName);
					} else if (s.jsonp !== false) {
						s.url += (rquery.test(s.url) ? "&" : "?") + s.jsonp + "=" + callbackName;
					}

					// Use data converter to retrieve json after script execution
					s.converters["script json"] = function () {
						if (!responseContainer) {
							jQuery.error(callbackName + " was not called");
						}
						return responseContainer[0];
					};

					// Force json dataType
					s.dataTypes[0] = "json";

					// Install callback
					overwritten = window[callbackName];
					window[callbackName] = function () {
						responseContainer = arguments;
					};

					// Clean-up function (fires after converters)
					jqXHR.always(function () {

						// If previous value didn't exist - remove it
						if (overwritten === undefined) {
							jQuery(window).removeProp(callbackName);

							// Otherwise restore preexisting value
						} else {
							window[callbackName] = overwritten;
						}

						// Save back as free
						if (s[callbackName]) {

							// Make sure that re-using the options doesn't screw things around
							s.jsonpCallback = originalSettings.jsonpCallback;

							// Save the callback name for future use
							oldCallbacks.push(callbackName);
						}

						// Call if it was a function and we have a response
						if (responseContainer && jQuery.isFunction(overwritten)) {
							overwritten(responseContainer[0]);
						}

						responseContainer = overwritten = undefined;
					});

					// Delegate to script
					return "script";
				}
			});

			// Support: Safari 8 only
			// In Safari 8 documents created via document.implementation.createHTMLDocument
			// collapse sibling forms: the second one becomes a child of the first one.
			// Because of that, this security measure has to be disabled in Safari 8.
			// https://bugs.webkit.org/show_bug.cgi?id=137337
			support.createHTMLDocument = function () {
				var body = document.implementation.createHTMLDocument("").body;
				body.innerHTML = "<form></form><form></form>";
				return body.childNodes.length === 2;
			}();

			// Argument "data" should be string of html
			// context (optional): If specified, the fragment will be created in this context,
			// defaults to document
			// keepScripts (optional): If true, will include scripts passed in the html string
			jQuery.parseHTML = function (data, context, keepScripts) {
				if (typeof data !== "string") {
					return [];
				}
				if (typeof context === "boolean") {
					keepScripts = context;
					context = false;
				}

				var base, parsed, scripts;

				if (!context) {

					// Stop scripts or inline event handlers from being executed immediately
					// by using document.implementation
					if (support.createHTMLDocument) {
						context = document.implementation.createHTMLDocument("");

						// Set the base href for the created document
						// so any parsed elements with URLs
						// are based on the document's URL (gh-2965)
						base = context.createElement("base");
						base.href = document.location.href;
						context.head.appendChild(base);
					} else {
						context = document;
					}
				}

				parsed = rsingleTag.exec(data);
				scripts = !keepScripts && [];

				// Single tag
				if (parsed) {
					return [context.createElement(parsed[1])];
				}

				parsed = buildFragment([data], context, scripts);

				if (scripts && scripts.length) {
					jQuery(scripts).remove();
				}

				return jQuery.merge([], parsed.childNodes);
			};

			/**
    * Load a url into a page
    */
			jQuery.fn.load = function (url, params, callback) {
				var selector,
				    type,
				    response,
				    self = this,
				    off = url.indexOf(" ");

				if (off > -1) {
					selector = stripAndCollapse(url.slice(off));
					url = url.slice(0, off);
				}

				// If it's a function
				if (jQuery.isFunction(params)) {

					// We assume that it's the callback
					callback = params;
					params = undefined;

					// Otherwise, build a param string
				} else if (params && typeof params === "object") {
					type = "POST";
				}

				// If we have elements to modify, make the request
				if (self.length > 0) {
					jQuery.ajax({
						url: url,

						// If "type" variable is undefined, then "GET" method will be used.
						// Make value of this field explicit since
						// user can override it through ajaxSetup method
						type: type || "GET",
						dataType: "html",
						data: params
					}).done(function (responseText) {

						// Save response for use in complete callback
						response = arguments;

						self.html(selector ?

						// If a selector was specified, locate the right elements in a dummy div
						// Exclude scripts to avoid IE 'Permission Denied' errors
						jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) :

						// Otherwise use the full result
						responseText);

						// If the request succeeds, this function gets "data", "status", "jqXHR"
						// but they are ignored because response was set above.
						// If it fails, this function gets "jqXHR", "status", "error"
					}).always(callback && function (jqXHR, status) {
						self.each(function () {
							callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
						});
					});
				}

				return this;
			};

			// Attach a bunch of functions for handling common AJAX events
			jQuery.each(["ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend"], function (i, type) {
				jQuery.fn[type] = function (fn) {
					return this.on(type, fn);
				};
			});

			jQuery.expr.pseudos.animated = function (elem) {
				return jQuery.grep(jQuery.timers, function (fn) {
					return elem === fn.elem;
				}).length;
			};

			jQuery.offset = {
				setOffset: function (elem, options, i) {
					var curPosition,
					    curLeft,
					    curCSSTop,
					    curTop,
					    curOffset,
					    curCSSLeft,
					    calculatePosition,
					    position = jQuery.css(elem, "position"),
					    curElem = jQuery(elem),
					    props = {};

					// Set position first, in-case top/left are set even on static elem
					if (position === "static") {
						elem.style.position = "relative";
					}

					curOffset = curElem.offset();
					curCSSTop = jQuery.css(elem, "top");
					curCSSLeft = jQuery.css(elem, "left");
					calculatePosition = (position === "absolute" || position === "fixed") && (curCSSTop + curCSSLeft).indexOf("auto") > -1;

					// Need to be able to calculate position if either
					// top or left is auto and position is either absolute or fixed
					if (calculatePosition) {
						curPosition = curElem.position();
						curTop = curPosition.top;
						curLeft = curPosition.left;
					} else {
						curTop = parseFloat(curCSSTop) || 0;
						curLeft = parseFloat(curCSSLeft) || 0;
					}

					if (jQuery.isFunction(options)) {

						// Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
						options = options.call(elem, i, jQuery.extend({}, curOffset));
					}

					if (options.top != null) {
						props.top = options.top - curOffset.top + curTop;
					}
					if (options.left != null) {
						props.left = options.left - curOffset.left + curLeft;
					}

					if ("using" in options) {
						options.using.call(elem, props);
					} else {
						curElem.css(props);
					}
				}
			};

			jQuery.fn.extend({
				offset: function (options) {

					// Preserve chaining for setter
					if (arguments.length) {
						return options === undefined ? this : this.each(function (i) {
							jQuery.offset.setOffset(this, options, i);
						});
					}

					var doc,
					    docElem,
					    rect,
					    win,
					    elem = this[0];

					if (!elem) {
						return;
					}

					// Return zeros for disconnected and hidden (display: none) elements (gh-2310)
					// Support: IE <=11 only
					// Running getBoundingClientRect on a
					// disconnected node in IE throws an error
					if (!elem.getClientRects().length) {
						return { top: 0, left: 0 };
					}

					rect = elem.getBoundingClientRect();

					doc = elem.ownerDocument;
					docElem = doc.documentElement;
					win = doc.defaultView;

					return {
						top: rect.top + win.pageYOffset - docElem.clientTop,
						left: rect.left + win.pageXOffset - docElem.clientLeft
					};
				},

				position: function () {
					if (!this[0]) {
						return;
					}

					var offsetParent,
					    offset,
					    elem = this[0],
					    parentOffset = { top: 0, left: 0 };

					// Fixed elements are offset from window (parentOffset = {top:0, left: 0},
					// because it is its only offset parent
					if (jQuery.css(elem, "position") === "fixed") {

						// Assume getBoundingClientRect is there when computed position is fixed
						offset = elem.getBoundingClientRect();
					} else {

						// Get *real* offsetParent
						offsetParent = this.offsetParent();

						// Get correct offsets
						offset = this.offset();
						if (!nodeName(offsetParent[0], "html")) {
							parentOffset = offsetParent.offset();
						}

						// Add offsetParent borders
						parentOffset = {
							top: parentOffset.top + jQuery.css(offsetParent[0], "borderTopWidth", true),
							left: parentOffset.left + jQuery.css(offsetParent[0], "borderLeftWidth", true)
						};
					}

					// Subtract parent offsets and element margins
					return {
						top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
						left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
					};
				},

				// This method will return documentElement in the following cases:
				// 1) For the element inside the iframe without offsetParent, this method will return
				//    documentElement of the parent window
				// 2) For the hidden or detached element
				// 3) For body or html element, i.e. in case of the html node - it will return itself
				//
				// but those exceptions were never presented as a real life use-cases
				// and might be considered as more preferable results.
				//
				// This logic, however, is not guaranteed and can change at any point in the future
				offsetParent: function () {
					return this.map(function () {
						var offsetParent = this.offsetParent;

						while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
							offsetParent = offsetParent.offsetParent;
						}

						return offsetParent || documentElement;
					});
				}
			});

			// Create scrollLeft and scrollTop methods
			jQuery.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (method, prop) {
				var top = "pageYOffset" === prop;

				jQuery.fn[method] = function (val) {
					return access(this, function (elem, method, val) {

						// Coalesce documents and windows
						var win;
						if (jQuery.isWindow(elem)) {
							win = elem;
						} else if (elem.nodeType === 9) {
							win = elem.defaultView;
						}

						if (val === undefined) {
							return win ? win[prop] : elem[method];
						}

						if (win) {
							win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset);
						} else {
							elem[method] = val;
						}
					}, method, val, arguments.length);
				};
			});

			// Support: Safari <=7 - 9.1, Chrome <=37 - 49
			// Add the top/left cssHooks using jQuery.fn.position
			// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
			// Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
			// getComputedStyle returns percent when specified for top/left/bottom/right;
			// rather than make the css module depend on the offset module, just check for it here
			jQuery.each(["top", "left"], function (i, prop) {
				jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function (elem, computed) {
					if (computed) {
						computed = curCSS(elem, prop);

						// If curCSS returns percentage, fallback to offset
						return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + "px" : computed;
					}
				});
			});

			// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
			jQuery.each({ Height: "height", Width: "width" }, function (name, type) {
				jQuery.each({ padding: "inner" + name, content: type, "": "outer" + name }, function (defaultExtra, funcName) {

					// Margin is only for outerHeight, outerWidth
					jQuery.fn[funcName] = function (margin, value) {
						var chainable = arguments.length && (defaultExtra || typeof margin !== "boolean"),
						    extra = defaultExtra || (margin === true || value === true ? "margin" : "border");

						return access(this, function (elem, type, value) {
							var doc;

							if (jQuery.isWindow(elem)) {

								// $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
								return funcName.indexOf("outer") === 0 ? elem["inner" + name] : elem.document.documentElement["client" + name];
							}

							// Get document width or height
							if (elem.nodeType === 9) {
								doc = elem.documentElement;

								// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
								// whichever is greatest
								return Math.max(elem.body["scroll" + name], doc["scroll" + name], elem.body["offset" + name], doc["offset" + name], doc["client" + name]);
							}

							return value === undefined ?

							// Get width or height on the element, requesting but not forcing parseFloat
							jQuery.css(elem, type, extra) :

							// Set width or height on the element
							jQuery.style(elem, type, value, extra);
						}, type, chainable ? margin : undefined, chainable);
					};
				});
			});

			jQuery.fn.extend({

				bind: function (types, data, fn) {
					return this.on(types, null, data, fn);
				},
				unbind: function (types, fn) {
					return this.off(types, null, fn);
				},

				delegate: function (selector, types, data, fn) {
					return this.on(types, selector, data, fn);
				},
				undelegate: function (selector, types, fn) {

					// ( namespace ) or ( selector, types [, fn] )
					return arguments.length === 1 ? this.off(selector, "**") : this.off(types, selector || "**", fn);
				}
			});

			jQuery.holdReady = function (hold) {
				if (hold) {
					jQuery.readyWait++;
				} else {
					jQuery.ready(true);
				}
			};
			jQuery.isArray = Array.isArray;
			jQuery.parseJSON = JSON.parse;
			jQuery.nodeName = nodeName;

			// Register as a named AMD module, since jQuery can be concatenated with other
			// files that may use define, but not via a proper concatenation script that
			// understands anonymous AMD modules. A named AMD is safest and most robust
			// way to register. Lowercase jquery is used because AMD module names are
			// derived from file names, and jQuery is normally delivered in a lowercase
			// file name. Do this after creating the global so that if an AMD module wants
			// to call noConflict to hide this version of jQuery, it will work.

			// Note that for maximum portability, libraries that are not jQuery should
			// declare themselves as anonymous modules, and avoid setting a global if an
			// AMD loader is present. jQuery is a special case. For more information, see
			// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

			if (typeof define === "function" && define.amd) {
				define("jquery", [], function () {
					return jQuery;
				});
			}

			var

			// Map over jQuery in case of overwrite
			_jQuery = window.jQuery,


			// Map over the $ in case of overwrite
			_$ = window.$;

			jQuery.noConflict = function (deep) {
				if (window.$ === jQuery) {
					window.$ = _$;
				}

				if (deep && window.jQuery === jQuery) {
					window.jQuery = _jQuery;
				}

				return jQuery;
			};

			// Expose jQuery and $ identifiers, even in AMD
			// (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
			// and CommonJS for browser emulators (#13566)
			if (!noGlobal) {
				window.jQuery = window.$ = jQuery;
			}

			return jQuery;
		});
	}, {}], 4: [function (require, module, exports) {
		!function t(e, r) {
			"object" == typeof exports && "object" == typeof module ? module.exports = r() : "function" == typeof define && define.amd ? define([], r) : "object" == typeof exports ? exports.Raphael = r() : e.Raphael = r();
		}(this, function () {
			return function (t) {
				function e(i) {
					if (r[i]) return r[i].exports;var n = r[i] = { exports: {}, id: i, loaded: !1 };return t[i].call(n.exports, n, n.exports, e), n.loaded = !0, n.exports;
				}var r = {};return e.m = t, e.c = r, e.p = "", e(0);
			}([function (t, e, r) {
				var i, n;i = [r(1), r(3), r(4)], n = function (t) {
					return t;
				}.apply(e, i), !(void 0 !== n && (t.exports = n));
			}, function (t, e, r) {
				var i, n;i = [r(2)], n = function (t) {
					function e(r) {
						if (e.is(r, "function")) return w ? r() : t.on("raphael.DOMload", r);if (e.is(r, Q)) return e._engine.create[z](e, r.splice(0, 3 + e.is(r[0], $))).add(r);var i = Array.prototype.slice.call(arguments, 0);if (e.is(i[i.length - 1], "function")) {
							var n = i.pop();return w ? n.call(e._engine.create[z](e, i)) : t.on("raphael.DOMload", function () {
								n.call(e._engine.create[z](e, i));
							});
						}return e._engine.create[z](e, arguments);
					}function r(t) {
						if ("function" == typeof t || Object(t) !== t) return t;var e = new t.constructor();for (var i in t) t[A](i) && (e[i] = r(t[i]));return e;
					}function i(t, e) {
						for (var r = 0, i = t.length; r < i; r++) if (t[r] === e) return t.push(t.splice(r, 1)[0]);
					}function n(t, e, r) {
						function n() {
							var a = Array.prototype.slice.call(arguments, 0),
							    s = a.join("␀"),
							    o = n.cache = n.cache || {},
							    l = n.count = n.count || [];return o[A](s) ? (i(l, s), r ? r(o[s]) : o[s]) : (l.length >= 1e3 && delete o[l.shift()], l.push(s), o[s] = t[z](e, a), r ? r(o[s]) : o[s]);
						}return n;
					}function a() {
						return this.hex;
					}function s(t, e) {
						for (var r = [], i = 0, n = t.length; n - 2 * !e > i; i += 2) {
							var a = [{ x: +t[i - 2], y: +t[i - 1] }, { x: +t[i], y: +t[i + 1] }, { x: +t[i + 2], y: +t[i + 3] }, { x: +t[i + 4], y: +t[i + 5] }];e ? i ? n - 4 == i ? a[3] = { x: +t[0], y: +t[1] } : n - 2 == i && (a[2] = { x: +t[0], y: +t[1] }, a[3] = { x: +t[2], y: +t[3] }) : a[0] = { x: +t[n - 2], y: +t[n - 1] } : n - 4 == i ? a[3] = a[2] : i || (a[0] = { x: +t[i], y: +t[i + 1] }), r.push(["C", (-a[0].x + 6 * a[1].x + a[2].x) / 6, (-a[0].y + 6 * a[1].y + a[2].y) / 6, (a[1].x + 6 * a[2].x - a[3].x) / 6, (a[1].y + 6 * a[2].y - a[3].y) / 6, a[2].x, a[2].y]);
						}return r;
					}function o(t, e, r, i, n) {
						var a = -3 * e + 9 * r - 9 * i + 3 * n,
						    s = t * a + 6 * e - 12 * r + 6 * i;return t * s - 3 * e + 3 * r;
					}function l(t, e, r, i, n, a, s, l, h) {
						null == h && (h = 1), h = h > 1 ? 1 : h < 0 ? 0 : h;for (var u = h / 2, c = 12, f = [-.1252, .1252, -.3678, .3678, -.5873, .5873, -.7699, .7699, -.9041, .9041, -.9816, .9816], p = [.2491, .2491, .2335, .2335, .2032, .2032, .1601, .1601, .1069, .1069, .0472, .0472], d = 0, g = 0; g < c; g++) {
							var v = u * f[g] + u,
							    x = o(v, t, r, n, s),
							    y = o(v, e, i, a, l),
							    m = x * x + y * y;d += p[g] * Y.sqrt(m);
						}return u * d;
					}function h(t, e, r, i, n, a, s, o, h) {
						if (!(h < 0 || l(t, e, r, i, n, a, s, o) < h)) {
							var u = 1,
							    c = u / 2,
							    f = u - c,
							    p,
							    d = .01;for (p = l(t, e, r, i, n, a, s, o, f); H(p - h) > d;) c /= 2, f += (p < h ? 1 : -1) * c, p = l(t, e, r, i, n, a, s, o, f);return f;
						}
					}function u(t, e, r, i, n, a, s, o) {
						if (!(W(t, r) < G(n, s) || G(t, r) > W(n, s) || W(e, i) < G(a, o) || G(e, i) > W(a, o))) {
							var l = (t * i - e * r) * (n - s) - (t - r) * (n * o - a * s),
							    h = (t * i - e * r) * (a - o) - (e - i) * (n * o - a * s),
							    u = (t - r) * (a - o) - (e - i) * (n - s);if (u) {
								var c = l / u,
								    f = h / u,
								    p = +c.toFixed(2),
								    d = +f.toFixed(2);if (!(p < +G(t, r).toFixed(2) || p > +W(t, r).toFixed(2) || p < +G(n, s).toFixed(2) || p > +W(n, s).toFixed(2) || d < +G(e, i).toFixed(2) || d > +W(e, i).toFixed(2) || d < +G(a, o).toFixed(2) || d > +W(a, o).toFixed(2))) return { x: c, y: f };
							}
						}
					}function c(t, e) {
						return p(t, e);
					}function f(t, e) {
						return p(t, e, 1);
					}function p(t, r, i) {
						var n = e.bezierBBox(t),
						    a = e.bezierBBox(r);if (!e.isBBoxIntersect(n, a)) return i ? 0 : [];for (var s = l.apply(0, t), o = l.apply(0, r), h = W(~~(s / 5), 1), c = W(~~(o / 5), 1), f = [], p = [], d = {}, g = i ? 0 : [], v = 0; v < h + 1; v++) {
							var x = e.findDotsAtSegment.apply(e, t.concat(v / h));f.push({ x: x.x, y: x.y, t: v / h });
						}for (v = 0; v < c + 1; v++) x = e.findDotsAtSegment.apply(e, r.concat(v / c)), p.push({ x: x.x, y: x.y, t: v / c });for (v = 0; v < h; v++) for (var y = 0; y < c; y++) {
							var m = f[v],
							    b = f[v + 1],
							    _ = p[y],
							    w = p[y + 1],
							    k = H(b.x - m.x) < .001 ? "y" : "x",
							    B = H(w.x - _.x) < .001 ? "y" : "x",
							    C = u(m.x, m.y, b.x, b.y, _.x, _.y, w.x, w.y);if (C) {
								if (d[C.x.toFixed(4)] == C.y.toFixed(4)) continue;d[C.x.toFixed(4)] = C.y.toFixed(4);var S = m.t + H((C[k] - m[k]) / (b[k] - m[k])) * (b.t - m.t),
								    A = _.t + H((C[B] - _[B]) / (w[B] - _[B])) * (w.t - _.t);S >= 0 && S <= 1.001 && A >= 0 && A <= 1.001 && (i ? g++ : g.push({ x: C.x, y: C.y, t1: G(S, 1), t2: G(A, 1) }));
							}
						}return g;
					}function d(t, r, i) {
						t = e._path2curve(t), r = e._path2curve(r);for (var n, a, s, o, l, h, u, c, f, d, g = i ? 0 : [], v = 0, x = t.length; v < x; v++) {
							var y = t[v];if ("M" == y[0]) n = l = y[1], a = h = y[2];else {
								"C" == y[0] ? (f = [n, a].concat(y.slice(1)), n = f[6], a = f[7]) : (f = [n, a, n, a, l, h, l, h], n = l, a = h);for (var m = 0, b = r.length; m < b; m++) {
									var _ = r[m];if ("M" == _[0]) s = u = _[1], o = c = _[2];else {
										"C" == _[0] ? (d = [s, o].concat(_.slice(1)), s = d[6], o = d[7]) : (d = [s, o, s, o, u, c, u, c], s = u, o = c);var w = p(f, d, i);if (i) g += w;else {
											for (var k = 0, B = w.length; k < B; k++) w[k].segment1 = v, w[k].segment2 = m, w[k].bez1 = f, w[k].bez2 = d;g = g.concat(w);
										}
									}
								}
							}
						}return g;
					}function g(t, e, r, i, n, a) {
						null != t ? (this.a = +t, this.b = +e, this.c = +r, this.d = +i, this.e = +n, this.f = +a) : (this.a = 1, this.b = 0, this.c = 0, this.d = 1, this.e = 0, this.f = 0);
					}function v() {
						return this.x + j + this.y;
					}function x() {
						return this.x + j + this.y + j + this.width + " × " + this.height;
					}function y(t, e, r, i, n, a) {
						function s(t) {
							return ((c * t + u) * t + h) * t;
						}function o(t, e) {
							var r = l(t, e);return ((d * r + p) * r + f) * r;
						}function l(t, e) {
							var r, i, n, a, o, l;for (n = t, l = 0; l < 8; l++) {
								if (a = s(n) - t, H(a) < e) return n;if (o = (3 * c * n + 2 * u) * n + h, H(o) < 1e-6) break;n -= a / o;
							}if (r = 0, i = 1, n = t, n < r) return r;if (n > i) return i;for (; r < i;) {
								if (a = s(n), H(a - t) < e) return n;t > a ? r = n : i = n, n = (i - r) / 2 + r;
							}return n;
						}var h = 3 * e,
						    u = 3 * (i - e) - h,
						    c = 1 - h - u,
						    f = 3 * r,
						    p = 3 * (n - r) - f,
						    d = 1 - f - p;return o(t, 1 / (200 * a));
					}function m(t, e) {
						var r = [],
						    i = {};if (this.ms = e, this.times = 1, t) {
							for (var n in t) t[A](n) && (i[ht(n)] = t[n], r.push(ht(n)));r.sort(Bt);
						}this.anim = i, this.top = r[r.length - 1], this.percents = r;
					}function b(r, i, n, a, s, o) {
						n = ht(n);var l,
						    h,
						    u,
						    c = [],
						    f,
						    p,
						    d,
						    v = r.ms,
						    x = {},
						    m = {},
						    b = {};if (a) for (w = 0, B = Ee.length; w < B; w++) {
							var _ = Ee[w];if (_.el.id == i.id && _.anim == r) {
								_.percent != n ? (Ee.splice(w, 1), u = 1) : h = _, i.attr(_.totalOrigin);break;
							}
						} else a = +m;for (var w = 0, B = r.percents.length; w < B; w++) {
							if (r.percents[w] == n || r.percents[w] > a * r.top) {
								n = r.percents[w], p = r.percents[w - 1] || 0, v = v / r.top * (n - p), f = r.percents[w + 1], l = r.anim[n];break;
							}a && i.attr(r.anim[r.percents[w]]);
						}if (l) {
							if (h) h.initstatus = a, h.start = new Date() - h.ms * a;else {
								for (var C in l) if (l[A](C) && (pt[A](C) || i.paper.customAttributes[A](C))) switch (x[C] = i.attr(C), null == x[C] && (x[C] = ft[C]), m[C] = l[C], pt[C]) {case $:
										b[C] = (m[C] - x[C]) / v;break;case "colour":
										x[C] = e.getRGB(x[C]);var S = e.getRGB(m[C]);b[C] = { r: (S.r - x[C].r) / v, g: (S.g - x[C].g) / v, b: (S.b - x[C].b) / v };break;case "path":
										var T = Qt(x[C], m[C]),
										    E = T[1];for (x[C] = T[0], b[C] = [], w = 0, B = x[C].length; w < B; w++) {
											b[C][w] = [0];for (var M = 1, N = x[C][w].length; M < N; M++) b[C][w][M] = (E[w][M] - x[C][w][M]) / v;
										}break;case "transform":
										var L = i._,
										    z = le(L[C], m[C]);if (z) for (x[C] = z.from, m[C] = z.to, b[C] = [], b[C].real = !0, w = 0, B = x[C].length; w < B; w++) for (b[C][w] = [x[C][w][0]], M = 1, N = x[C][w].length; M < N; M++) b[C][w][M] = (m[C][w][M] - x[C][w][M]) / v;else {
											var F = i.matrix || new g(),
											    R = { _: { transform: L.transform }, getBBox: function () {
													return i.getBBox(1);
												} };x[C] = [F.a, F.b, F.c, F.d, F.e, F.f], se(R, m[C]), m[C] = R._.transform, b[C] = [(R.matrix.a - F.a) / v, (R.matrix.b - F.b) / v, (R.matrix.c - F.c) / v, (R.matrix.d - F.d) / v, (R.matrix.e - F.e) / v, (R.matrix.f - F.f) / v];
										}break;case "csv":
										var j = I(l[C])[q](k),
										    D = I(x[C])[q](k);if ("clip-rect" == C) for (x[C] = D, b[C] = [], w = D.length; w--;) b[C][w] = (j[w] - x[C][w]) / v;m[C] = j;break;default:
										for (j = [][P](l[C]), D = [][P](x[C]), b[C] = [], w = i.paper.customAttributes[C].length; w--;) b[C][w] = ((j[w] || 0) - (D[w] || 0)) / v;}var V = l.easing,
								    O = e.easing_formulas[V];if (!O) if (O = I(V).match(st), O && 5 == O.length) {
									var Y = O;O = function (t) {
										return y(t, +Y[1], +Y[2], +Y[3], +Y[4], v);
									};
								} else O = St;if (d = l.start || r.start || +new Date(), _ = { anim: r, percent: n, timestamp: d, start: d + (r.del || 0), status: 0, initstatus: a || 0, stop: !1, ms: v, easing: O, from: x, diff: b, to: m, el: i, callback: l.callback, prev: p, next: f, repeat: o || r.times, origin: i.attr(), totalOrigin: s }, Ee.push(_), a && !h && !u && (_.stop = !0, _.start = new Date() - v * a, 1 == Ee.length)) return Ne();u && (_.start = new Date() - _.ms * a), 1 == Ee.length && Me(Ne);
							}t("raphael.anim.start." + i.id, i, r);
						}
					}function _(t) {
						for (var e = 0; e < Ee.length; e++) Ee[e].el.paper == t && Ee.splice(e--, 1);
					}e.version = "2.2.0", e.eve = t;var w,
					    k = /[, ]+/,
					    B = { circle: 1, rect: 1, path: 1, ellipse: 1, text: 1, image: 1 },
					    C = /\{(\d+)\}/g,
					    S = "prototype",
					    A = "hasOwnProperty",
					    T = { doc: document, win: window },
					    E = { was: Object.prototype[A].call(T.win, "Raphael"), is: T.win.Raphael },
					    M = function () {
						this.ca = this.customAttributes = {};
					},
					    N,
					    L = "appendChild",
					    z = "apply",
					    P = "concat",
					    F = "ontouchstart" in T.win || T.win.DocumentTouch && T.doc instanceof DocumentTouch,
					    R = "",
					    j = " ",
					    I = String,
					    q = "split",
					    D = "click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[q](j),
					    V = { mousedown: "touchstart", mousemove: "touchmove", mouseup: "touchend" },
					    O = I.prototype.toLowerCase,
					    Y = Math,
					    W = Y.max,
					    G = Y.min,
					    H = Y.abs,
					    X = Y.pow,
					    U = Y.PI,
					    $ = "number",
					    Z = "string",
					    Q = "array",
					    J = "toString",
					    K = "fill",
					    tt = Object.prototype.toString,
					    et = {},
					    rt = "push",
					    it = e._ISURL = /^url\(['"]?(.+?)['"]?\)$/i,
					    nt = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
					    at = { NaN: 1, Infinity: 1, "-Infinity": 1 },
					    st = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
					    ot = Y.round,
					    lt = "setAttribute",
					    ht = parseFloat,
					    ut = parseInt,
					    ct = I.prototype.toUpperCase,
					    ft = e._availableAttrs = { "arrow-end": "none", "arrow-start": "none", blur: 0, "clip-rect": "0 0 1e9 1e9", cursor: "default", cx: 0, cy: 0, fill: "#fff", "fill-opacity": 1, font: '10px "Arial"', "font-family": '"Arial"', "font-size": "10", "font-style": "normal", "font-weight": 400, gradient: 0, height: 0, href: "http://raphaeljs.com/", "letter-spacing": 0, opacity: 1, path: "M0,0", r: 0, rx: 0, ry: 0, src: "", stroke: "#000", "stroke-dasharray": "", "stroke-linecap": "butt", "stroke-linejoin": "butt", "stroke-miterlimit": 0, "stroke-opacity": 1, "stroke-width": 1, target: "_blank", "text-anchor": "middle", title: "Raphael", transform: "", width: 0, x: 0, y: 0, "class": "" },
					    pt = e._availableAnimAttrs = { blur: $, "clip-rect": "csv", cx: $, cy: $, fill: "colour", "fill-opacity": $, "font-size": $, height: $, opacity: $, path: "path", r: $, rx: $, ry: $, stroke: "colour", "stroke-opacity": $, "stroke-width": $, transform: "transform", width: $, x: $, y: $ },
					    dt = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]/g,
					    gt = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,
					    vt = { hs: 1, rg: 1 },
					    xt = /,?([achlmqrstvxz]),?/gi,
					    yt = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/gi,
					    mt = /([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/gi,
					    bt = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/gi,
					    _t = e._radial_gradient = /^r(?:\(([^,]+?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*([^\)]+?)\))?/,
					    wt = {},
					    kt = function (t, e) {
						return t.key - e.key;
					},
					    Bt = function (t, e) {
						return ht(t) - ht(e);
					},
					    Ct = function () {},
					    St = function (t) {
						return t;
					},
					    At = e._rectPath = function (t, e, r, i, n) {
						return n ? [["M", t + n, e], ["l", r - 2 * n, 0], ["a", n, n, 0, 0, 1, n, n], ["l", 0, i - 2 * n], ["a", n, n, 0, 0, 1, -n, n], ["l", 2 * n - r, 0], ["a", n, n, 0, 0, 1, -n, -n], ["l", 0, 2 * n - i], ["a", n, n, 0, 0, 1, n, -n], ["z"]] : [["M", t, e], ["l", r, 0], ["l", 0, i], ["l", -r, 0], ["z"]];
					},
					    Tt = function (t, e, r, i) {
						return null == i && (i = r), [["M", t, e], ["m", 0, -i], ["a", r, i, 0, 1, 1, 0, 2 * i], ["a", r, i, 0, 1, 1, 0, -2 * i], ["z"]];
					},
					    Et = e._getPath = { path: function (t) {
							return t.attr("path");
						}, circle: function (t) {
							var e = t.attrs;return Tt(e.cx, e.cy, e.r);
						}, ellipse: function (t) {
							var e = t.attrs;return Tt(e.cx, e.cy, e.rx, e.ry);
						}, rect: function (t) {
							var e = t.attrs;return At(e.x, e.y, e.width, e.height, e.r);
						}, image: function (t) {
							var e = t.attrs;return At(e.x, e.y, e.width, e.height);
						}, text: function (t) {
							var e = t._getBBox();return At(e.x, e.y, e.width, e.height);
						}, set: function (t) {
							var e = t._getBBox();return At(e.x, e.y, e.width, e.height);
						} },
					    Mt = e.mapPath = function (t, e) {
						if (!e) return t;var r, i, n, a, s, o, l;for (t = Qt(t), n = 0, s = t.length; n < s; n++) for (l = t[n], a = 1, o = l.length; a < o; a += 2) r = e.x(l[a], l[a + 1]), i = e.y(l[a], l[a + 1]), l[a] = r, l[a + 1] = i;return t;
					};if (e._g = T, e.type = T.win.SVGAngle || T.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML", "VML" == e.type) {
						var Nt = T.doc.createElement("div"),
						    Lt;if (Nt.innerHTML = '<v:shape adj="1"/>', Lt = Nt.firstChild, Lt.style.behavior = "url(#default#VML)", !Lt || "object" != typeof Lt.adj) return e.type = R;Nt = null;
					}e.svg = !(e.vml = "VML" == e.type), e._Paper = M, e.fn = N = M.prototype = e.prototype, e._id = 0, e.is = function (t, e) {
						return e = O.call(e), "finite" == e ? !at[A](+t) : "array" == e ? t instanceof Array : "null" == e && null === t || e == typeof t && null !== t || "object" == e && t === Object(t) || "array" == e && Array.isArray && Array.isArray(t) || tt.call(t).slice(8, -1).toLowerCase() == e;
					}, e.angle = function (t, r, i, n, a, s) {
						if (null == a) {
							var o = t - i,
							    l = r - n;return o || l ? (180 + 180 * Y.atan2(-l, -o) / U + 360) % 360 : 0;
						}return e.angle(t, r, a, s) - e.angle(i, n, a, s);
					}, e.rad = function (t) {
						return t % 360 * U / 180;
					}, e.deg = function (t) {
						return Math.round(180 * t / U % 360 * 1e3) / 1e3;
					}, e.snapTo = function (t, r, i) {
						if (i = e.is(i, "finite") ? i : 10, e.is(t, Q)) {
							for (var n = t.length; n--;) if (H(t[n] - r) <= i) return t[n];
						} else {
							t = +t;var a = r % t;if (a < i) return r - a;if (a > t - i) return r - a + t;
						}return r;
					};var zt = e.createUUID = function (t, e) {
						return function () {
							return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(t, e).toUpperCase();
						};
					}(/[xy]/g, function (t) {
						var e = 16 * Y.random() | 0,
						    r = "x" == t ? e : 3 & e | 8;return r.toString(16);
					});e.setWindow = function (r) {
						t("raphael.setWindow", e, T.win, r), T.win = r, T.doc = T.win.document, e._engine.initWin && e._engine.initWin(T.win);
					};var Pt = function (t) {
						if (e.vml) {
							var r = /^\s+|\s+$/g,
							    i;try {
								var a = new ActiveXObject("htmlfile");a.write("<body>"), a.close(), i = a.body;
							} catch (s) {
								i = createPopup().document.body;
							}var o = i.createTextRange();Pt = n(function (t) {
								try {
									i.style.color = I(t).replace(r, R);var e = o.queryCommandValue("ForeColor");return e = (255 & e) << 16 | 65280 & e | (16711680 & e) >>> 16, "#" + ("000000" + e.toString(16)).slice(-6);
								} catch (n) {
									return "none";
								}
							});
						} else {
							var l = T.doc.createElement("i");l.title = "Raphaël Colour Picker", l.style.display = "none", T.doc.body.appendChild(l), Pt = n(function (t) {
								return l.style.color = t, T.doc.defaultView.getComputedStyle(l, R).getPropertyValue("color");
							});
						}return Pt(t);
					},
					    Ft = function () {
						return "hsb(" + [this.h, this.s, this.b] + ")";
					},
					    Rt = function () {
						return "hsl(" + [this.h, this.s, this.l] + ")";
					},
					    jt = function () {
						return this.hex;
					},
					    It = function (t, r, i) {
						if (null == r && e.is(t, "object") && "r" in t && "g" in t && "b" in t && (i = t.b, r = t.g, t = t.r), null == r && e.is(t, Z)) {
							var n = e.getRGB(t);t = n.r, r = n.g, i = n.b;
						}return (t > 1 || r > 1 || i > 1) && (t /= 255, r /= 255, i /= 255), [t, r, i];
					},
					    qt = function (t, r, i, n) {
						t *= 255, r *= 255, i *= 255;var a = { r: t, g: r, b: i, hex: e.rgb(t, r, i), toString: jt };return e.is(n, "finite") && (a.opacity = n), a;
					};e.color = function (t) {
						var r;return e.is(t, "object") && "h" in t && "s" in t && "b" in t ? (r = e.hsb2rgb(t), t.r = r.r, t.g = r.g, t.b = r.b, t.hex = r.hex) : e.is(t, "object") && "h" in t && "s" in t && "l" in t ? (r = e.hsl2rgb(t), t.r = r.r, t.g = r.g, t.b = r.b, t.hex = r.hex) : (e.is(t, "string") && (t = e.getRGB(t)), e.is(t, "object") && "r" in t && "g" in t && "b" in t ? (r = e.rgb2hsl(t), t.h = r.h, t.s = r.s, t.l = r.l, r = e.rgb2hsb(t), t.v = r.b) : (t = { hex: "none" }, t.r = t.g = t.b = t.h = t.s = t.v = t.l = -1)), t.toString = jt, t;
					}, e.hsb2rgb = function (t, e, r, i) {
						this.is(t, "object") && "h" in t && "s" in t && "b" in t && (r = t.b, e = t.s, i = t.o, t = t.h), t *= 360;var n, a, s, o, l;return t = t % 360 / 60, l = r * e, o = l * (1 - H(t % 2 - 1)), n = a = s = r - l, t = ~~t, n += [l, o, 0, 0, o, l][t], a += [o, l, l, o, 0, 0][t], s += [0, 0, o, l, l, o][t], qt(n, a, s, i);
					}, e.hsl2rgb = function (t, e, r, i) {
						this.is(t, "object") && "h" in t && "s" in t && "l" in t && (r = t.l, e = t.s, t = t.h), (t > 1 || e > 1 || r > 1) && (t /= 360, e /= 100, r /= 100), t *= 360;var n, a, s, o, l;return t = t % 360 / 60, l = 2 * e * (r < .5 ? r : 1 - r), o = l * (1 - H(t % 2 - 1)), n = a = s = r - l / 2, t = ~~t, n += [l, o, 0, 0, o, l][t], a += [o, l, l, o, 0, 0][t], s += [0, 0, o, l, l, o][t], qt(n, a, s, i);
					}, e.rgb2hsb = function (t, e, r) {
						r = It(t, e, r), t = r[0], e = r[1], r = r[2];var i, n, a, s;return a = W(t, e, r), s = a - G(t, e, r), i = 0 == s ? null : a == t ? (e - r) / s : a == e ? (r - t) / s + 2 : (t - e) / s + 4, i = (i + 360) % 6 * 60 / 360, n = 0 == s ? 0 : s / a, { h: i, s: n, b: a, toString: Ft };
					}, e.rgb2hsl = function (t, e, r) {
						r = It(t, e, r), t = r[0], e = r[1], r = r[2];var i, n, a, s, o, l;return s = W(t, e, r), o = G(t, e, r), l = s - o, i = 0 == l ? null : s == t ? (e - r) / l : s == e ? (r - t) / l + 2 : (t - e) / l + 4, i = (i + 360) % 6 * 60 / 360, a = (s + o) / 2, n = 0 == l ? 0 : a < .5 ? l / (2 * a) : l / (2 - 2 * a), { h: i, s: n, l: a, toString: Rt };
					}, e._path2string = function () {
						return this.join(",").replace(xt, "$1");
					};var Dt = e._preload = function (t, e) {
						var r = T.doc.createElement("img");r.style.cssText = "position:absolute;left:-9999em;top:-9999em", r.onload = function () {
							e.call(this), this.onload = null, T.doc.body.removeChild(this);
						}, r.onerror = function () {
							T.doc.body.removeChild(this);
						}, T.doc.body.appendChild(r), r.src = t;
					};e.getRGB = n(function (t) {
						if (!t || (t = I(t)).indexOf("-") + 1) return { r: -1, g: -1, b: -1, hex: "none", error: 1, toString: a };if ("none" == t) return { r: -1, g: -1, b: -1, hex: "none", toString: a };!(vt[A](t.toLowerCase().substring(0, 2)) || "#" == t.charAt()) && (t = Pt(t));var r,
						    i,
						    n,
						    s,
						    o,
						    l,
						    h,
						    u = t.match(nt);return u ? (u[2] && (s = ut(u[2].substring(5), 16), n = ut(u[2].substring(3, 5), 16), i = ut(u[2].substring(1, 3), 16)), u[3] && (s = ut((l = u[3].charAt(3)) + l, 16), n = ut((l = u[3].charAt(2)) + l, 16), i = ut((l = u[3].charAt(1)) + l, 16)), u[4] && (h = u[4][q](gt), i = ht(h[0]), "%" == h[0].slice(-1) && (i *= 2.55), n = ht(h[1]), "%" == h[1].slice(-1) && (n *= 2.55), s = ht(h[2]), "%" == h[2].slice(-1) && (s *= 2.55), "rgba" == u[1].toLowerCase().slice(0, 4) && (o = ht(h[3])), h[3] && "%" == h[3].slice(-1) && (o /= 100)), u[5] ? (h = u[5][q](gt), i = ht(h[0]), "%" == h[0].slice(-1) && (i *= 2.55), n = ht(h[1]), "%" == h[1].slice(-1) && (n *= 2.55), s = ht(h[2]), "%" == h[2].slice(-1) && (s *= 2.55), ("deg" == h[0].slice(-3) || "°" == h[0].slice(-1)) && (i /= 360), "hsba" == u[1].toLowerCase().slice(0, 4) && (o = ht(h[3])), h[3] && "%" == h[3].slice(-1) && (o /= 100), e.hsb2rgb(i, n, s, o)) : u[6] ? (h = u[6][q](gt), i = ht(h[0]), "%" == h[0].slice(-1) && (i *= 2.55), n = ht(h[1]), "%" == h[1].slice(-1) && (n *= 2.55), s = ht(h[2]), "%" == h[2].slice(-1) && (s *= 2.55), ("deg" == h[0].slice(-3) || "°" == h[0].slice(-1)) && (i /= 360), "hsla" == u[1].toLowerCase().slice(0, 4) && (o = ht(h[3])), h[3] && "%" == h[3].slice(-1) && (o /= 100), e.hsl2rgb(i, n, s, o)) : (u = { r: i, g: n, b: s, toString: a }, u.hex = "#" + (16777216 | s | n << 8 | i << 16).toString(16).slice(1), e.is(o, "finite") && (u.opacity = o), u)) : { r: -1, g: -1, b: -1, hex: "none", error: 1, toString: a };
					}, e), e.hsb = n(function (t, r, i) {
						return e.hsb2rgb(t, r, i).hex;
					}), e.hsl = n(function (t, r, i) {
						return e.hsl2rgb(t, r, i).hex;
					}), e.rgb = n(function (t, e, r) {
						function i(t) {
							return t + .5 | 0;
						}return "#" + (16777216 | i(r) | i(e) << 8 | i(t) << 16).toString(16).slice(1);
					}), e.getColor = function (t) {
						var e = this.getColor.start = this.getColor.start || { h: 0, s: 1, b: t || .75 },
						    r = this.hsb2rgb(e.h, e.s, e.b);return e.h += .075, e.h > 1 && (e.h = 0, e.s -= .2, e.s <= 0 && (this.getColor.start = { h: 0, s: 1, b: e.b })), r.hex;
					}, e.getColor.reset = function () {
						delete this.start;
					}, e.parsePathString = function (t) {
						if (!t) return null;var r = Vt(t);if (r.arr) return Yt(r.arr);var i = { a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0 },
						    n = [];return e.is(t, Q) && e.is(t[0], Q) && (n = Yt(t)), n.length || I(t).replace(yt, function (t, e, r) {
							var a = [],
							    s = e.toLowerCase();if (r.replace(bt, function (t, e) {
								e && a.push(+e);
							}), "m" == s && a.length > 2 && (n.push([e][P](a.splice(0, 2))), s = "l", e = "m" == e ? "l" : "L"), "r" == s) n.push([e][P](a));else for (; a.length >= i[s] && (n.push([e][P](a.splice(0, i[s]))), i[s]););
						}), n.toString = e._path2string, r.arr = Yt(n), n;
					}, e.parseTransformString = n(function (t) {
						if (!t) return null;var r = { r: 3, s: 4, t: 2, m: 6 },
						    i = [];return e.is(t, Q) && e.is(t[0], Q) && (i = Yt(t)), i.length || I(t).replace(mt, function (t, e, r) {
							var n = [],
							    a = O.call(e);r.replace(bt, function (t, e) {
								e && n.push(+e);
							}), i.push([e][P](n));
						}), i.toString = e._path2string, i;
					});var Vt = function (t) {
						var e = Vt.ps = Vt.ps || {};return e[t] ? e[t].sleep = 100 : e[t] = { sleep: 100 }, setTimeout(function () {
							for (var r in e) e[A](r) && r != t && (e[r].sleep--, !e[r].sleep && delete e[r]);
						}), e[t];
					};e.findDotsAtSegment = function (t, e, r, i, n, a, s, o, l) {
						var h = 1 - l,
						    u = X(h, 3),
						    c = X(h, 2),
						    f = l * l,
						    p = f * l,
						    d = u * t + 3 * c * l * r + 3 * h * l * l * n + p * s,
						    g = u * e + 3 * c * l * i + 3 * h * l * l * a + p * o,
						    v = t + 2 * l * (r - t) + f * (n - 2 * r + t),
						    x = e + 2 * l * (i - e) + f * (a - 2 * i + e),
						    y = r + 2 * l * (n - r) + f * (s - 2 * n + r),
						    m = i + 2 * l * (a - i) + f * (o - 2 * a + i),
						    b = h * t + l * r,
						    _ = h * e + l * i,
						    w = h * n + l * s,
						    k = h * a + l * o,
						    B = 90 - 180 * Y.atan2(v - y, x - m) / U;return (v > y || x < m) && (B += 180), { x: d, y: g, m: { x: v, y: x }, n: { x: y, y: m }, start: { x: b, y: _ }, end: { x: w, y: k }, alpha: B };
					}, e.bezierBBox = function (t, r, i, n, a, s, o, l) {
						e.is(t, "array") || (t = [t, r, i, n, a, s, o, l]);var h = Zt.apply(null, t);return { x: h.min.x, y: h.min.y, x2: h.max.x, y2: h.max.y, width: h.max.x - h.min.x, height: h.max.y - h.min.y };
					}, e.isPointInsideBBox = function (t, e, r) {
						return e >= t.x && e <= t.x2 && r >= t.y && r <= t.y2;
					}, e.isBBoxIntersect = function (t, r) {
						var i = e.isPointInsideBBox;return i(r, t.x, t.y) || i(r, t.x2, t.y) || i(r, t.x, t.y2) || i(r, t.x2, t.y2) || i(t, r.x, r.y) || i(t, r.x2, r.y) || i(t, r.x, r.y2) || i(t, r.x2, r.y2) || (t.x < r.x2 && t.x > r.x || r.x < t.x2 && r.x > t.x) && (t.y < r.y2 && t.y > r.y || r.y < t.y2 && r.y > t.y);
					}, e.pathIntersection = function (t, e) {
						return d(t, e);
					}, e.pathIntersectionNumber = function (t, e) {
						return d(t, e, 1);
					}, e.isPointInsidePath = function (t, r, i) {
						var n = e.pathBBox(t);return e.isPointInsideBBox(n, r, i) && d(t, [["M", r, i], ["H", n.x2 + 10]], 1) % 2 == 1;
					}, e._removedFactory = function (e) {
						return function () {
							t("raphael.log", null, "Raphaël: you are calling to method “" + e + "” of removed object", e);
						};
					};var Ot = e.pathBBox = function (t) {
						var e = Vt(t);if (e.bbox) return r(e.bbox);if (!t) return { x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0 };t = Qt(t);for (var i = 0, n = 0, a = [], s = [], o, l = 0, h = t.length; l < h; l++) if (o = t[l], "M" == o[0]) i = o[1], n = o[2], a.push(i), s.push(n);else {
							var u = Zt(i, n, o[1], o[2], o[3], o[4], o[5], o[6]);a = a[P](u.min.x, u.max.x), s = s[P](u.min.y, u.max.y), i = o[5], n = o[6];
						}var c = G[z](0, a),
						    f = G[z](0, s),
						    p = W[z](0, a),
						    d = W[z](0, s),
						    g = p - c,
						    v = d - f,
						    x = { x: c, y: f, x2: p, y2: d, width: g, height: v, cx: c + g / 2, cy: f + v / 2 };return e.bbox = r(x), x;
					},
					    Yt = function (t) {
						var i = r(t);return i.toString = e._path2string, i;
					},
					    Wt = e._pathToRelative = function (t) {
						var r = Vt(t);if (r.rel) return Yt(r.rel);e.is(t, Q) && e.is(t && t[0], Q) || (t = e.parsePathString(t));var i = [],
						    n = 0,
						    a = 0,
						    s = 0,
						    o = 0,
						    l = 0;"M" == t[0][0] && (n = t[0][1], a = t[0][2], s = n, o = a, l++, i.push(["M", n, a]));for (var h = l, u = t.length; h < u; h++) {
							var c = i[h] = [],
							    f = t[h];if (f[0] != O.call(f[0])) switch (c[0] = O.call(f[0]), c[0]) {case "a":
									c[1] = f[1], c[2] = f[2], c[3] = f[3], c[4] = f[4], c[5] = f[5], c[6] = +(f[6] - n).toFixed(3), c[7] = +(f[7] - a).toFixed(3);break;case "v":
									c[1] = +(f[1] - a).toFixed(3);break;case "m":
									s = f[1], o = f[2];default:
									for (var p = 1, d = f.length; p < d; p++) c[p] = +(f[p] - (p % 2 ? n : a)).toFixed(3);} else {
								c = i[h] = [], "m" == f[0] && (s = f[1] + n, o = f[2] + a);for (var g = 0, v = f.length; g < v; g++) i[h][g] = f[g];
							}var x = i[h].length;switch (i[h][0]) {case "z":
									n = s, a = o;break;case "h":
									n += +i[h][x - 1];break;case "v":
									a += +i[h][x - 1];break;default:
									n += +i[h][x - 2], a += +i[h][x - 1];}
						}return i.toString = e._path2string, r.rel = Yt(i), i;
					},
					    Gt = e._pathToAbsolute = function (t) {
						var r = Vt(t);if (r.abs) return Yt(r.abs);if (e.is(t, Q) && e.is(t && t[0], Q) || (t = e.parsePathString(t)), !t || !t.length) return [["M", 0, 0]];var i = [],
						    n = 0,
						    a = 0,
						    o = 0,
						    l = 0,
						    h = 0;"M" == t[0][0] && (n = +t[0][1], a = +t[0][2], o = n, l = a, h++, i[0] = ["M", n, a]);for (var u = 3 == t.length && "M" == t[0][0] && "R" == t[1][0].toUpperCase() && "Z" == t[2][0].toUpperCase(), c, f, p = h, d = t.length; p < d; p++) {
							if (i.push(c = []), f = t[p], f[0] != ct.call(f[0])) switch (c[0] = ct.call(f[0]), c[0]) {case "A":
									c[1] = f[1], c[2] = f[2], c[3] = f[3], c[4] = f[4], c[5] = f[5], c[6] = +(f[6] + n), c[7] = +(f[7] + a);break;case "V":
									c[1] = +f[1] + a;break;case "H":
									c[1] = +f[1] + n;break;case "R":
									for (var g = [n, a][P](f.slice(1)), v = 2, x = g.length; v < x; v++) g[v] = +g[v] + n, g[++v] = +g[v] + a;i.pop(), i = i[P](s(g, u));break;case "M":
									o = +f[1] + n, l = +f[2] + a;default:
									for (v = 1, x = f.length; v < x; v++) c[v] = +f[v] + (v % 2 ? n : a);} else if ("R" == f[0]) g = [n, a][P](f.slice(1)), i.pop(), i = i[P](s(g, u)), c = ["R"][P](f.slice(-2));else for (var y = 0, m = f.length; y < m; y++) c[y] = f[y];switch (c[0]) {case "Z":
									n = o, a = l;break;case "H":
									n = c[1];break;case "V":
									a = c[1];break;case "M":
									o = c[c.length - 2], l = c[c.length - 1];default:
									n = c[c.length - 2], a = c[c.length - 1];}
						}return i.toString = e._path2string, r.abs = Yt(i), i;
					},
					    Ht = function (t, e, r, i) {
						return [t, e, r, i, r, i];
					},
					    Xt = function (t, e, r, i, n, a) {
						var s = 1 / 3,
						    o = 2 / 3;return [s * t + o * r, s * e + o * i, s * n + o * r, s * a + o * i, n, a];
					},
					    Ut = function (t, e, r, i, a, s, o, l, h, u) {
						var c = 120 * U / 180,
						    f = U / 180 * (+a || 0),
						    p = [],
						    d,
						    g = n(function (t, e, r) {
							var i = t * Y.cos(r) - e * Y.sin(r),
							    n = t * Y.sin(r) + e * Y.cos(r);return { x: i, y: n };
						});if (u) S = u[0], A = u[1], B = u[2], C = u[3];else {
							d = g(t, e, -f), t = d.x, e = d.y, d = g(l, h, -f), l = d.x, h = d.y;var v = Y.cos(U / 180 * a),
							    x = Y.sin(U / 180 * a),
							    y = (t - l) / 2,
							    m = (e - h) / 2,
							    b = y * y / (r * r) + m * m / (i * i);b > 1 && (b = Y.sqrt(b), r = b * r, i = b * i);var _ = r * r,
							    w = i * i,
							    k = (s == o ? -1 : 1) * Y.sqrt(H((_ * w - _ * m * m - w * y * y) / (_ * m * m + w * y * y))),
							    B = k * r * m / i + (t + l) / 2,
							    C = k * -i * y / r + (e + h) / 2,
							    S = Y.asin(((e - C) / i).toFixed(9)),
							    A = Y.asin(((h - C) / i).toFixed(9));S = t < B ? U - S : S, A = l < B ? U - A : A, S < 0 && (S = 2 * U + S), A < 0 && (A = 2 * U + A), o && S > A && (S -= 2 * U), !o && A > S && (A -= 2 * U);
						}var T = A - S;if (H(T) > c) {
							var E = A,
							    M = l,
							    N = h;A = S + c * (o && A > S ? 1 : -1), l = B + r * Y.cos(A), h = C + i * Y.sin(A), p = Ut(l, h, r, i, a, 0, o, M, N, [A, E, B, C]);
						}T = A - S;var L = Y.cos(S),
						    z = Y.sin(S),
						    F = Y.cos(A),
						    R = Y.sin(A),
						    j = Y.tan(T / 4),
						    I = 4 / 3 * r * j,
						    D = 4 / 3 * i * j,
						    V = [t, e],
						    O = [t + I * z, e - D * L],
						    W = [l + I * R, h - D * F],
						    G = [l, h];if (O[0] = 2 * V[0] - O[0], O[1] = 2 * V[1] - O[1], u) return [O, W, G][P](p);p = [O, W, G][P](p).join()[q](",");for (var X = [], $ = 0, Z = p.length; $ < Z; $++) X[$] = $ % 2 ? g(p[$ - 1], p[$], f).y : g(p[$], p[$ + 1], f).x;return X;
					},
					    $t = function (t, e, r, i, n, a, s, o, l) {
						var h = 1 - l;return { x: X(h, 3) * t + 3 * X(h, 2) * l * r + 3 * h * l * l * n + X(l, 3) * s, y: X(h, 3) * e + 3 * X(h, 2) * l * i + 3 * h * l * l * a + X(l, 3) * o };
					},
					    Zt = n(function (t, e, r, i, n, a, s, o) {
						var l = n - 2 * r + t - (s - 2 * n + r),
						    h = 2 * (r - t) - 2 * (n - r),
						    u = t - r,
						    c = (-h + Y.sqrt(h * h - 4 * l * u)) / 2 / l,
						    f = (-h - Y.sqrt(h * h - 4 * l * u)) / 2 / l,
						    p = [e, o],
						    d = [t, s],
						    g;return H(c) > "1e12" && (c = .5), H(f) > "1e12" && (f = .5), c > 0 && c < 1 && (g = $t(t, e, r, i, n, a, s, o, c), d.push(g.x), p.push(g.y)), f > 0 && f < 1 && (g = $t(t, e, r, i, n, a, s, o, f), d.push(g.x), p.push(g.y)), l = a - 2 * i + e - (o - 2 * a + i), h = 2 * (i - e) - 2 * (a - i), u = e - i, c = (-h + Y.sqrt(h * h - 4 * l * u)) / 2 / l, f = (-h - Y.sqrt(h * h - 4 * l * u)) / 2 / l, H(c) > "1e12" && (c = .5), H(f) > "1e12" && (f = .5), c > 0 && c < 1 && (g = $t(t, e, r, i, n, a, s, o, c), d.push(g.x), p.push(g.y)), f > 0 && f < 1 && (g = $t(t, e, r, i, n, a, s, o, f), d.push(g.x), p.push(g.y)), { min: { x: G[z](0, d), y: G[z](0, p) }, max: { x: W[z](0, d), y: W[z](0, p) } };
					}),
					    Qt = e._path2curve = n(function (t, e) {
						var r = !e && Vt(t);if (!e && r.curve) return Yt(r.curve);for (var i = Gt(t), n = e && Gt(e), a = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null }, s = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null }, o = function (t, e, r) {
							var i,
							    n,
							    a = { T: 1, Q: 1 };if (!t) return ["C", e.x, e.y, e.x, e.y, e.x, e.y];switch (!(t[0] in a) && (e.qx = e.qy = null), t[0]) {case "M":
									e.X = t[1], e.Y = t[2];break;case "A":
									t = ["C"][P](Ut[z](0, [e.x, e.y][P](t.slice(1))));break;case "S":
									"C" == r || "S" == r ? (i = 2 * e.x - e.bx, n = 2 * e.y - e.by) : (i = e.x, n = e.y), t = ["C", i, n][P](t.slice(1));break;case "T":
									"Q" == r || "T" == r ? (e.qx = 2 * e.x - e.qx, e.qy = 2 * e.y - e.qy) : (e.qx = e.x, e.qy = e.y), t = ["C"][P](Xt(e.x, e.y, e.qx, e.qy, t[1], t[2]));break;case "Q":
									e.qx = t[1], e.qy = t[2], t = ["C"][P](Xt(e.x, e.y, t[1], t[2], t[3], t[4]));break;case "L":
									t = ["C"][P](Ht(e.x, e.y, t[1], t[2]));break;case "H":
									t = ["C"][P](Ht(e.x, e.y, t[1], e.y));break;case "V":
									t = ["C"][P](Ht(e.x, e.y, e.x, t[1]));break;case "Z":
									t = ["C"][P](Ht(e.x, e.y, e.X, e.Y));}return t;
						}, l = function (t, e) {
							if (t[e].length > 7) {
								t[e].shift();for (var r = t[e]; r.length;) u[e] = "A", n && (c[e] = "A"), t.splice(e++, 0, ["C"][P](r.splice(0, 6)));t.splice(e, 1), g = W(i.length, n && n.length || 0);
							}
						}, h = function (t, e, r, a, s) {
							t && e && "M" == t[s][0] && "M" != e[s][0] && (e.splice(s, 0, ["M", a.x, a.y]), r.bx = 0, r.by = 0, r.x = t[s][1], r.y = t[s][2], g = W(i.length, n && n.length || 0));
						}, u = [], c = [], f = "", p = "", d = 0, g = W(i.length, n && n.length || 0); d < g; d++) {
							i[d] && (f = i[d][0]), "C" != f && (u[d] = f, d && (p = u[d - 1])), i[d] = o(i[d], a, p), "A" != u[d] && "C" == f && (u[d] = "C"), l(i, d), n && (n[d] && (f = n[d][0]), "C" != f && (c[d] = f, d && (p = c[d - 1])), n[d] = o(n[d], s, p), "A" != c[d] && "C" == f && (c[d] = "C"), l(n, d)), h(i, n, a, s, d), h(n, i, s, a, d);var v = i[d],
							    x = n && n[d],
							    y = v.length,
							    m = n && x.length;a.x = v[y - 2], a.y = v[y - 1], a.bx = ht(v[y - 4]) || a.x, a.by = ht(v[y - 3]) || a.y, s.bx = n && (ht(x[m - 4]) || s.x), s.by = n && (ht(x[m - 3]) || s.y), s.x = n && x[m - 2], s.y = n && x[m - 1];
						}return n || (r.curve = Yt(i)), n ? [i, n] : i;
					}, null, Yt),
					    Jt = e._parseDots = n(function (t) {
						for (var r = [], i = 0, n = t.length; i < n; i++) {
							var a = {},
							    s = t[i].match(/^([^:]*):?([\d\.]*)/);if (a.color = e.getRGB(s[1]), a.color.error) return null;a.opacity = a.color.opacity, a.color = a.color.hex, s[2] && (a.offset = s[2] + "%"), r.push(a);
						}for (i = 1, n = r.length - 1; i < n; i++) if (!r[i].offset) {
							for (var o = ht(r[i - 1].offset || 0), l = 0, h = i + 1; h < n; h++) if (r[h].offset) {
								l = r[h].offset;break;
							}l || (l = 100, h = n), l = ht(l);for (var u = (l - o) / (h - i + 1); i < h; i++) o += u, r[i].offset = o + "%";
						}return r;
					}),
					    Kt = e._tear = function (t, e) {
						t == e.top && (e.top = t.prev), t == e.bottom && (e.bottom = t.next), t.next && (t.next.prev = t.prev), t.prev && (t.prev.next = t.next);
					},
					    te = e._tofront = function (t, e) {
						e.top !== t && (Kt(t, e), t.next = null, t.prev = e.top, e.top.next = t, e.top = t);
					},
					    ee = e._toback = function (t, e) {
						e.bottom !== t && (Kt(t, e), t.next = e.bottom, t.prev = null, e.bottom.prev = t, e.bottom = t);
					},
					    re = e._insertafter = function (t, e, r) {
						Kt(t, r), e == r.top && (r.top = t), e.next && (e.next.prev = t), t.next = e.next, t.prev = e, e.next = t;
					},
					    ie = e._insertbefore = function (t, e, r) {
						Kt(t, r), e == r.bottom && (r.bottom = t), e.prev && (e.prev.next = t), t.prev = e.prev, e.prev = t, t.next = e;
					},
					    ne = e.toMatrix = function (t, e) {
						var r = Ot(t),
						    i = { _: { transform: R }, getBBox: function () {
								return r;
							} };return se(i, e), i.matrix;
					},
					    ae = e.transformPath = function (t, e) {
						return Mt(t, ne(t, e));
					},
					    se = e._extractTransform = function (t, r) {
						if (null == r) return t._.transform;r = I(r).replace(/\.{3}|\u2026/g, t._.transform || R);var i = e.parseTransformString(r),
						    n = 0,
						    a = 0,
						    s = 0,
						    o = 1,
						    l = 1,
						    h = t._,
						    u = new g();if (h.transform = i || [], i) for (var c = 0, f = i.length; c < f; c++) {
							var p = i[c],
							    d = p.length,
							    v = I(p[0]).toLowerCase(),
							    x = p[0] != v,
							    y = x ? u.invert() : 0,
							    m,
							    b,
							    _,
							    w,
							    k;"t" == v && 3 == d ? x ? (m = y.x(0, 0), b = y.y(0, 0), _ = y.x(p[1], p[2]), w = y.y(p[1], p[2]), u.translate(_ - m, w - b)) : u.translate(p[1], p[2]) : "r" == v ? 2 == d ? (k = k || t.getBBox(1), u.rotate(p[1], k.x + k.width / 2, k.y + k.height / 2), n += p[1]) : 4 == d && (x ? (_ = y.x(p[2], p[3]), w = y.y(p[2], p[3]), u.rotate(p[1], _, w)) : u.rotate(p[1], p[2], p[3]), n += p[1]) : "s" == v ? 2 == d || 3 == d ? (k = k || t.getBBox(1), u.scale(p[1], p[d - 1], k.x + k.width / 2, k.y + k.height / 2), o *= p[1], l *= p[d - 1]) : 5 == d && (x ? (_ = y.x(p[3], p[4]), w = y.y(p[3], p[4]), u.scale(p[1], p[2], _, w)) : u.scale(p[1], p[2], p[3], p[4]), o *= p[1], l *= p[2]) : "m" == v && 7 == d && u.add(p[1], p[2], p[3], p[4], p[5], p[6]), h.dirtyT = 1, t.matrix = u;
						}t.matrix = u, h.sx = o, h.sy = l, h.deg = n, h.dx = a = u.e, h.dy = s = u.f, 1 == o && 1 == l && !n && h.bbox ? (h.bbox.x += +a, h.bbox.y += +s) : h.dirtyT = 1;
					},
					    oe = function (t) {
						var e = t[0];switch (e.toLowerCase()) {case "t":
								return [e, 0, 0];case "m":
								return [e, 1, 0, 0, 1, 0, 0];case "r":
								return 4 == t.length ? [e, 0, t[2], t[3]] : [e, 0];case "s":
								return 5 == t.length ? [e, 1, 1, t[3], t[4]] : 3 == t.length ? [e, 1, 1] : [e, 1];}
					},
					    le = e._equaliseTransform = function (t, r) {
						r = I(r).replace(/\.{3}|\u2026/g, t), t = e.parseTransformString(t) || [], r = e.parseTransformString(r) || [];for (var i = W(t.length, r.length), n = [], a = [], s = 0, o, l, h, u; s < i; s++) {
							if (h = t[s] || oe(r[s]), u = r[s] || oe(h), h[0] != u[0] || "r" == h[0].toLowerCase() && (h[2] != u[2] || h[3] != u[3]) || "s" == h[0].toLowerCase() && (h[3] != u[3] || h[4] != u[4])) return;for (n[s] = [], a[s] = [], o = 0, l = W(h.length, u.length); o < l; o++) o in h && (n[s][o] = h[o]), o in u && (a[s][o] = u[o]);
						}return { from: n, to: a };
					};e._getContainer = function (t, r, i, n) {
						var a;if (a = null != n || e.is(t, "object") ? t : T.doc.getElementById(t), null != a) return a.tagName ? null == r ? { container: a, width: a.style.pixelWidth || a.offsetWidth, height: a.style.pixelHeight || a.offsetHeight } : { container: a, width: r, height: i } : { container: 1, x: t, y: r, width: i, height: n };
					}, e.pathToRelative = Wt, e._engine = {}, e.path2curve = Qt, e.matrix = function (t, e, r, i, n, a) {
						return new g(t, e, r, i, n, a);
					}, function (t) {
						function r(t) {
							return t[0] * t[0] + t[1] * t[1];
						}function i(t) {
							var e = Y.sqrt(r(t));t[0] && (t[0] /= e), t[1] && (t[1] /= e);
						}t.add = function (t, e, r, i, n, a) {
							var s = [[], [], []],
							    o = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
							    l = [[t, r, n], [e, i, a], [0, 0, 1]],
							    h,
							    u,
							    c,
							    f;for (t && t instanceof g && (l = [[t.a, t.c, t.e], [t.b, t.d, t.f], [0, 0, 1]]), h = 0; h < 3; h++) for (u = 0; u < 3; u++) {
								for (f = 0, c = 0; c < 3; c++) f += o[h][c] * l[c][u];s[h][u] = f;
							}this.a = s[0][0], this.b = s[1][0], this.c = s[0][1], this.d = s[1][1], this.e = s[0][2], this.f = s[1][2];
						}, t.invert = function () {
							var t = this,
							    e = t.a * t.d - t.b * t.c;return new g(t.d / e, -t.b / e, -t.c / e, t.a / e, (t.c * t.f - t.d * t.e) / e, (t.b * t.e - t.a * t.f) / e);
						}, t.clone = function () {
							return new g(this.a, this.b, this.c, this.d, this.e, this.f);
						}, t.translate = function (t, e) {
							this.add(1, 0, 0, 1, t, e);
						}, t.scale = function (t, e, r, i) {
							null == e && (e = t), (r || i) && this.add(1, 0, 0, 1, r, i), this.add(t, 0, 0, e, 0, 0), (r || i) && this.add(1, 0, 0, 1, -r, -i);
						}, t.rotate = function (t, r, i) {
							t = e.rad(t), r = r || 0, i = i || 0;var n = +Y.cos(t).toFixed(9),
							    a = +Y.sin(t).toFixed(9);this.add(n, a, -a, n, r, i), this.add(1, 0, 0, 1, -r, -i);
						}, t.x = function (t, e) {
							return t * this.a + e * this.c + this.e;
						}, t.y = function (t, e) {
							return t * this.b + e * this.d + this.f;
						}, t.get = function (t) {
							return +this[I.fromCharCode(97 + t)].toFixed(4);
						}, t.toString = function () {
							return e.svg ? "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")" : [this.get(0), this.get(2), this.get(1), this.get(3), 0, 0].join();
						}, t.toFilter = function () {
							return "progid:DXImageTransform.Microsoft.Matrix(M11=" + this.get(0) + ", M12=" + this.get(2) + ", M21=" + this.get(1) + ", M22=" + this.get(3) + ", Dx=" + this.get(4) + ", Dy=" + this.get(5) + ", sizingmethod='auto expand')";
						}, t.offset = function () {
							return [this.e.toFixed(4), this.f.toFixed(4)];
						}, t.split = function () {
							var t = {};t.dx = this.e, t.dy = this.f;var n = [[this.a, this.c], [this.b, this.d]];t.scalex = Y.sqrt(r(n[0])), i(n[0]), t.shear = n[0][0] * n[1][0] + n[0][1] * n[1][1], n[1] = [n[1][0] - n[0][0] * t.shear, n[1][1] - n[0][1] * t.shear], t.scaley = Y.sqrt(r(n[1])), i(n[1]), t.shear /= t.scaley;var a = -n[0][1],
							    s = n[1][1];return s < 0 ? (t.rotate = e.deg(Y.acos(s)), a < 0 && (t.rotate = 360 - t.rotate)) : t.rotate = e.deg(Y.asin(a)), t.isSimple = !(+t.shear.toFixed(9) || t.scalex.toFixed(9) != t.scaley.toFixed(9) && t.rotate), t.isSuperSimple = !+t.shear.toFixed(9) && t.scalex.toFixed(9) == t.scaley.toFixed(9) && !t.rotate, t.noRotation = !+t.shear.toFixed(9) && !t.rotate, t;
						}, t.toTransformString = function (t) {
							var e = t || this[q]();return e.isSimple ? (e.scalex = +e.scalex.toFixed(4), e.scaley = +e.scaley.toFixed(4), e.rotate = +e.rotate.toFixed(4), (e.dx || e.dy ? "t" + [e.dx, e.dy] : R) + (1 != e.scalex || 1 != e.scaley ? "s" + [e.scalex, e.scaley, 0, 0] : R) + (e.rotate ? "r" + [e.rotate, 0, 0] : R)) : "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
						};
					}(g.prototype);for (var he = function () {
						this.returnValue = !1;
					}, ue = function () {
						return this.originalEvent.preventDefault();
					}, ce = function () {
						this.cancelBubble = !0;
					}, fe = function () {
						return this.originalEvent.stopPropagation();
					}, pe = function (t) {
						var e = T.doc.documentElement.scrollTop || T.doc.body.scrollTop,
						    r = T.doc.documentElement.scrollLeft || T.doc.body.scrollLeft;return { x: t.clientX + r, y: t.clientY + e };
					}, de = function () {
						return T.doc.addEventListener ? function (t, e, r, i) {
							var n = function (t) {
								var e = pe(t);return r.call(i, t, e.x, e.y);
							};if (t.addEventListener(e, n, !1), F && V[e]) {
								var a = function (e) {
									for (var n = pe(e), a = e, s = 0, o = e.targetTouches && e.targetTouches.length; s < o; s++) if (e.targetTouches[s].target == t) {
										e = e.targetTouches[s], e.originalEvent = a, e.preventDefault = ue, e.stopPropagation = fe;break;
									}return r.call(i, e, n.x, n.y);
								};t.addEventListener(V[e], a, !1);
							}return function () {
								return t.removeEventListener(e, n, !1), F && V[e] && t.removeEventListener(V[e], a, !1), !0;
							};
						} : T.doc.attachEvent ? function (t, e, r, i) {
							var n = function (t) {
								t = t || T.win.event;var e = T.doc.documentElement.scrollTop || T.doc.body.scrollTop,
								    n = T.doc.documentElement.scrollLeft || T.doc.body.scrollLeft,
								    a = t.clientX + n,
								    s = t.clientY + e;return t.preventDefault = t.preventDefault || he, t.stopPropagation = t.stopPropagation || ce, r.call(i, t, a, s);
							};t.attachEvent("on" + e, n);var a = function () {
								return t.detachEvent("on" + e, n), !0;
							};return a;
						} : void 0;
					}(), ge = [], ve = function (e) {
						for (var r = e.clientX, i = e.clientY, n = T.doc.documentElement.scrollTop || T.doc.body.scrollTop, a = T.doc.documentElement.scrollLeft || T.doc.body.scrollLeft, s, o = ge.length; o--;) {
							if (s = ge[o], F && e.touches) {
								for (var l = e.touches.length, h; l--;) if (h = e.touches[l], h.identifier == s.el._drag.id) {
									r = h.clientX, i = h.clientY, (e.originalEvent ? e.originalEvent : e).preventDefault();break;
								}
							} else e.preventDefault();var u = s.el.node,
							    c,
							    f = u.nextSibling,
							    p = u.parentNode,
							    d = u.style.display;T.win.opera && p.removeChild(u), u.style.display = "none", c = s.el.paper.getElementByPoint(r, i), u.style.display = d, T.win.opera && (f ? p.insertBefore(u, f) : p.appendChild(u)), c && t("raphael.drag.over." + s.el.id, s.el, c), r += a, i += n, t("raphael.drag.move." + s.el.id, s.move_scope || s.el, r - s.el._drag.x, i - s.el._drag.y, r, i, e);
						}
					}, xe = function (r) {
						e.unmousemove(ve).unmouseup(xe);for (var i = ge.length, n; i--;) n = ge[i], n.el._drag = {}, t("raphael.drag.end." + n.el.id, n.end_scope || n.start_scope || n.move_scope || n.el, r);ge = [];
					}, ye = e.el = {}, me = D.length; me--;) !function (t) {
						e[t] = ye[t] = function (r, i) {
							return e.is(r, "function") && (this.events = this.events || [], this.events.push({ name: t, f: r, unbind: de(this.shape || this.node || T.doc, t, r, i || this) })), this;
						}, e["un" + t] = ye["un" + t] = function (r) {
							for (var i = this.events || [], n = i.length; n--;) i[n].name != t || !e.is(r, "undefined") && i[n].f != r || (i[n].unbind(), i.splice(n, 1), !i.length && delete this.events);return this;
						};
					}(D[me]);ye.data = function (r, i) {
						var n = wt[this.id] = wt[this.id] || {};if (0 == arguments.length) return n;if (1 == arguments.length) {
							if (e.is(r, "object")) {
								for (var a in r) r[A](a) && this.data(a, r[a]);return this;
							}return t("raphael.data.get." + this.id, this, n[r], r), n[r];
						}return n[r] = i, t("raphael.data.set." + this.id, this, i, r), this;
					}, ye.removeData = function (t) {
						return null == t ? wt[this.id] = {} : wt[this.id] && delete wt[this.id][t], this;
					}, ye.getData = function () {
						return r(wt[this.id] || {});
					}, ye.hover = function (t, e, r, i) {
						return this.mouseover(t, r).mouseout(e, i || r);
					}, ye.unhover = function (t, e) {
						return this.unmouseover(t).unmouseout(e);
					};var be = [];ye.drag = function (r, i, n, a, s, o) {
						function l(l) {
							(l.originalEvent || l).preventDefault();var h = l.clientX,
							    u = l.clientY,
							    c = T.doc.documentElement.scrollTop || T.doc.body.scrollTop,
							    f = T.doc.documentElement.scrollLeft || T.doc.body.scrollLeft;if (this._drag.id = l.identifier, F && l.touches) for (var p = l.touches.length, d; p--;) if (d = l.touches[p], this._drag.id = d.identifier, d.identifier == this._drag.id) {
								h = d.clientX, u = d.clientY;break;
							}this._drag.x = h + f, this._drag.y = u + c, !ge.length && e.mousemove(ve).mouseup(xe), ge.push({ el: this, move_scope: a, start_scope: s, end_scope: o }), i && t.on("raphael.drag.start." + this.id, i), r && t.on("raphael.drag.move." + this.id, r), n && t.on("raphael.drag.end." + this.id, n), t("raphael.drag.start." + this.id, s || a || this, l.clientX + f, l.clientY + c, l);
						}return this._drag = {}, be.push({ el: this, start: l }), this.mousedown(l), this;
					}, ye.onDragOver = function (e) {
						e ? t.on("raphael.drag.over." + this.id, e) : t.unbind("raphael.drag.over." + this.id);
					}, ye.undrag = function () {
						for (var r = be.length; r--;) be[r].el == this && (this.unmousedown(be[r].start), be.splice(r, 1), t.unbind("raphael.drag.*." + this.id));!be.length && e.unmousemove(ve).unmouseup(xe), ge = [];
					}, N.circle = function (t, r, i) {
						var n = e._engine.circle(this, t || 0, r || 0, i || 0);return this.__set__ && this.__set__.push(n), n;
					}, N.rect = function (t, r, i, n, a) {
						var s = e._engine.rect(this, t || 0, r || 0, i || 0, n || 0, a || 0);return this.__set__ && this.__set__.push(s), s;
					}, N.ellipse = function (t, r, i, n) {
						var a = e._engine.ellipse(this, t || 0, r || 0, i || 0, n || 0);return this.__set__ && this.__set__.push(a), a;
					}, N.path = function (t) {
						t && !e.is(t, Z) && !e.is(t[0], Q) && (t += R);var r = e._engine.path(e.format[z](e, arguments), this);return this.__set__ && this.__set__.push(r), r;
					}, N.image = function (t, r, i, n, a) {
						var s = e._engine.image(this, t || "about:blank", r || 0, i || 0, n || 0, a || 0);return this.__set__ && this.__set__.push(s), s;
					}, N.text = function (t, r, i) {
						var n = e._engine.text(this, t || 0, r || 0, I(i));return this.__set__ && this.__set__.push(n), n;
					}, N.set = function (t) {
						!e.is(t, "array") && (t = Array.prototype.splice.call(arguments, 0, arguments.length));var r = new ze(t);return this.__set__ && this.__set__.push(r), r.paper = this, r.type = "set", r;
					}, N.setStart = function (t) {
						this.__set__ = t || this.set();
					}, N.setFinish = function (t) {
						var e = this.__set__;return delete this.__set__, e;
					}, N.getSize = function () {
						var t = this.canvas.parentNode;return { width: t.offsetWidth, height: t.offsetHeight };
					}, N.setSize = function (t, r) {
						return e._engine.setSize.call(this, t, r);
					}, N.setViewBox = function (t, r, i, n, a) {
						return e._engine.setViewBox.call(this, t, r, i, n, a);
					}, N.top = N.bottom = null, N.raphael = e;var _e = function (t) {
						var e = t.getBoundingClientRect(),
						    r = t.ownerDocument,
						    i = r.body,
						    n = r.documentElement,
						    a = n.clientTop || i.clientTop || 0,
						    s = n.clientLeft || i.clientLeft || 0,
						    o = e.top + (T.win.pageYOffset || n.scrollTop || i.scrollTop) - a,
						    l = e.left + (T.win.pageXOffset || n.scrollLeft || i.scrollLeft) - s;return { y: o, x: l };
					};N.getElementByPoint = function (t, e) {
						var r = this,
						    i = r.canvas,
						    n = T.doc.elementFromPoint(t, e);if (T.win.opera && "svg" == n.tagName) {
							var a = _e(i),
							    s = i.createSVGRect();s.x = t - a.x, s.y = e - a.y, s.width = s.height = 1;var o = i.getIntersectionList(s, null);o.length && (n = o[o.length - 1]);
						}if (!n) return null;for (; n.parentNode && n != i.parentNode && !n.raphael;) n = n.parentNode;return n == r.canvas.parentNode && (n = i), n = n && n.raphael ? r.getById(n.raphaelid) : null;
					}, N.getElementsByBBox = function (t) {
						var r = this.set();return this.forEach(function (i) {
							e.isBBoxIntersect(i.getBBox(), t) && r.push(i);
						}), r;
					}, N.getById = function (t) {
						for (var e = this.bottom; e;) {
							if (e.id == t) return e;e = e.next;
						}return null;
					}, N.forEach = function (t, e) {
						for (var r = this.bottom; r;) {
							if (t.call(e, r) === !1) return this;r = r.next;
						}return this;
					}, N.getElementsByPoint = function (t, e) {
						var r = this.set();return this.forEach(function (i) {
							i.isPointInside(t, e) && r.push(i);
						}), r;
					}, ye.isPointInside = function (t, r) {
						var i = this.realPath = Et[this.type](this);return this.attr("transform") && this.attr("transform").length && (i = e.transformPath(i, this.attr("transform"))), e.isPointInsidePath(i, t, r);
					}, ye.getBBox = function (t) {
						if (this.removed) return {};var e = this._;return t ? (!e.dirty && e.bboxwt || (this.realPath = Et[this.type](this), e.bboxwt = Ot(this.realPath), e.bboxwt.toString = x, e.dirty = 0), e.bboxwt) : ((e.dirty || e.dirtyT || !e.bbox) && (!e.dirty && this.realPath || (e.bboxwt = 0, this.realPath = Et[this.type](this)), e.bbox = Ot(Mt(this.realPath, this.matrix)), e.bbox.toString = x, e.dirty = e.dirtyT = 0), e.bbox);
					}, ye.clone = function () {
						if (this.removed) return null;var t = this.paper[this.type]().attr(this.attr());return this.__set__ && this.__set__.push(t), t;
					}, ye.glow = function (t) {
						if ("text" == this.type) return null;t = t || {};var e = { width: (t.width || 10) + (+this.attr("stroke-width") || 1), fill: t.fill || !1, opacity: null == t.opacity ? .5 : t.opacity, offsetx: t.offsetx || 0, offsety: t.offsety || 0, color: t.color || "#000" },
						    r = e.width / 2,
						    i = this.paper,
						    n = i.set(),
						    a = this.realPath || Et[this.type](this);a = this.matrix ? Mt(a, this.matrix) : a;for (var s = 1; s < r + 1; s++) n.push(i.path(a).attr({ stroke: e.color, fill: e.fill ? e.color : "none", "stroke-linejoin": "round", "stroke-linecap": "round", "stroke-width": +(e.width / r * s).toFixed(3), opacity: +(e.opacity / r).toFixed(3) }));return n.insertBefore(this).translate(e.offsetx, e.offsety);
					};var we = {},
					    ke = function (t, r, i, n, a, s, o, u, c) {
						return null == c ? l(t, r, i, n, a, s, o, u) : e.findDotsAtSegment(t, r, i, n, a, s, o, u, h(t, r, i, n, a, s, o, u, c));
					},
					    Be = function (t, r) {
						return function (i, n, a) {
							i = Qt(i);for (var s, o, l, h, u = "", c = {}, f, p = 0, d = 0, g = i.length; d < g; d++) {
								if (l = i[d], "M" == l[0]) s = +l[1], o = +l[2];else {
									if (h = ke(s, o, l[1], l[2], l[3], l[4], l[5], l[6]), p + h > n) {
										if (r && !c.start) {
											if (f = ke(s, o, l[1], l[2], l[3], l[4], l[5], l[6], n - p), u += ["C" + f.start.x, f.start.y, f.m.x, f.m.y, f.x, f.y], a) return u;c.start = u, u = ["M" + f.x, f.y + "C" + f.n.x, f.n.y, f.end.x, f.end.y, l[5], l[6]].join(), p += h, s = +l[5], o = +l[6];continue;
										}if (!t && !r) return f = ke(s, o, l[1], l[2], l[3], l[4], l[5], l[6], n - p), { x: f.x, y: f.y, alpha: f.alpha };
									}p += h, s = +l[5], o = +l[6];
								}u += l.shift() + l;
							}return c.end = u, f = t ? p : r ? c : e.findDotsAtSegment(s, o, l[0], l[1], l[2], l[3], l[4], l[5], 1), f.alpha && (f = { x: f.x, y: f.y, alpha: f.alpha }), f;
						};
					},
					    Ce = Be(1),
					    Se = Be(),
					    Ae = Be(0, 1);e.getTotalLength = Ce, e.getPointAtLength = Se, e.getSubpath = function (t, e, r) {
						if (this.getTotalLength(t) - r < 1e-6) return Ae(t, e).end;var i = Ae(t, r, 1);return e ? Ae(i, e).end : i;
					}, ye.getTotalLength = function () {
						var t = this.getPath();if (t) return this.node.getTotalLength ? this.node.getTotalLength() : Ce(t);
					}, ye.getPointAtLength = function (t) {
						var e = this.getPath();if (e) return Se(e, t);
					}, ye.getPath = function () {
						var t,
						    r = e._getPath[this.type];if ("text" != this.type && "set" != this.type) return r && (t = r(this)), t;
					}, ye.getSubpath = function (t, r) {
						var i = this.getPath();if (i) return e.getSubpath(i, t, r);
					};var Te = e.easing_formulas = { linear: function (t) {
							return t;
						}, "<": function (t) {
							return X(t, 1.7);
						}, ">": function (t) {
							return X(t, .48);
						}, "<>": function (t) {
							var e = .48 - t / 1.04,
							    r = Y.sqrt(.1734 + e * e),
							    i = r - e,
							    n = X(H(i), 1 / 3) * (i < 0 ? -1 : 1),
							    a = -r - e,
							    s = X(H(a), 1 / 3) * (a < 0 ? -1 : 1),
							    o = n + s + .5;return 3 * (1 - o) * o * o + o * o * o;
						}, backIn: function (t) {
							var e = 1.70158;return t * t * ((e + 1) * t - e);
						}, backOut: function (t) {
							t -= 1;var e = 1.70158;return t * t * ((e + 1) * t + e) + 1;
						}, elastic: function (t) {
							return t == !!t ? t : X(2, -10 * t) * Y.sin((t - .075) * (2 * U) / .3) + 1;
						}, bounce: function (t) {
							var e = 7.5625,
							    r = 2.75,
							    i;return t < 1 / r ? i = e * t * t : t < 2 / r ? (t -= 1.5 / r, i = e * t * t + .75) : t < 2.5 / r ? (t -= 2.25 / r, i = e * t * t + .9375) : (t -= 2.625 / r, i = e * t * t + .984375), i;
						} };Te.easeIn = Te["ease-in"] = Te["<"], Te.easeOut = Te["ease-out"] = Te[">"], Te.easeInOut = Te["ease-in-out"] = Te["<>"], Te["back-in"] = Te.backIn, Te["back-out"] = Te.backOut;var Ee = [],
					    Me = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (t) {
						setTimeout(t, 16);
					},
					    Ne = function () {
						for (var r = +new Date(), i = 0; i < Ee.length; i++) {
							var n = Ee[i];if (!n.el.removed && !n.paused) {
								var a = r - n.start,
								    s = n.ms,
								    o = n.easing,
								    l = n.from,
								    h = n.diff,
								    u = n.to,
								    c = n.t,
								    f = n.el,
								    p = {},
								    d,
								    g = {},
								    v;if (n.initstatus ? (a = (n.initstatus * n.anim.top - n.prev) / (n.percent - n.prev) * s, n.status = n.initstatus, delete n.initstatus, n.stop && Ee.splice(i--, 1)) : n.status = (n.prev + (n.percent - n.prev) * (a / s)) / n.anim.top, !(a < 0)) if (a < s) {
									var x = o(a / s);for (var y in l) if (l[A](y)) {
										switch (pt[y]) {case $:
												d = +l[y] + x * s * h[y];break;case "colour":
												d = "rgb(" + [Le(ot(l[y].r + x * s * h[y].r)), Le(ot(l[y].g + x * s * h[y].g)), Le(ot(l[y].b + x * s * h[y].b))].join(",") + ")";break;case "path":
												d = [];for (var m = 0, _ = l[y].length; m < _; m++) {
													d[m] = [l[y][m][0]];for (var w = 1, k = l[y][m].length; w < k; w++) d[m][w] = +l[y][m][w] + x * s * h[y][m][w];d[m] = d[m].join(j);
												}d = d.join(j);break;case "transform":
												if (h[y].real) for (d = [], m = 0, _ = l[y].length; m < _; m++) for (d[m] = [l[y][m][0]], w = 1, k = l[y][m].length; w < k; w++) d[m][w] = l[y][m][w] + x * s * h[y][m][w];else {
													var B = function (t) {
														return +l[y][t] + x * s * h[y][t];
													};d = [["m", B(0), B(1), B(2), B(3), B(4), B(5)]];
												}break;case "csv":
												if ("clip-rect" == y) for (d = [], m = 4; m--;) d[m] = +l[y][m] + x * s * h[y][m];break;default:
												var C = [][P](l[y]);for (d = [], m = f.paper.customAttributes[y].length; m--;) d[m] = +C[m] + x * s * h[y][m];}p[y] = d;
									}f.attr(p), function (e, r, i) {
										setTimeout(function () {
											t("raphael.anim.frame." + e, r, i);
										});
									}(f.id, f, n.anim);
								} else {
									if (function (r, i, n) {
										setTimeout(function () {
											t("raphael.anim.frame." + i.id, i, n), t("raphael.anim.finish." + i.id, i, n), e.is(r, "function") && r.call(i);
										});
									}(n.callback, f, n.anim), f.attr(u), Ee.splice(i--, 1), n.repeat > 1 && !n.next) {
										for (v in u) u[A](v) && (g[v] = n.totalOrigin[v]);n.el.attr(g), b(n.anim, n.el, n.anim.percents[0], null, n.totalOrigin, n.repeat - 1);
									}n.next && !n.stop && b(n.anim, n.el, n.next, null, n.totalOrigin, n.repeat);
								}
							}
						}Ee.length && Me(Ne);
					},
					    Le = function (t) {
						return t > 255 ? 255 : t < 0 ? 0 : t;
					};ye.animateWith = function (t, r, i, n, a, s) {
						var o = this;if (o.removed) return s && s.call(o), o;var l = i instanceof m ? i : e.animation(i, n, a, s),
						    h,
						    u;b(l, o, l.percents[0], null, o.attr());for (var c = 0, f = Ee.length; c < f; c++) if (Ee[c].anim == r && Ee[c].el == t) {
							Ee[f - 1].start = Ee[c].start;break;
						}return o;
					}, ye.onAnimation = function (e) {
						return e ? t.on("raphael.anim.frame." + this.id, e) : t.unbind("raphael.anim.frame." + this.id), this;
					}, m.prototype.delay = function (t) {
						var e = new m(this.anim, this.ms);return e.times = this.times, e.del = +t || 0, e;
					}, m.prototype.repeat = function (t) {
						var e = new m(this.anim, this.ms);return e.del = this.del, e.times = Y.floor(W(t, 0)) || 1, e;
					}, e.animation = function (t, r, i, n) {
						if (t instanceof m) return t;!e.is(i, "function") && i || (n = n || i || null, i = null), t = Object(t), r = +r || 0;var a = {},
						    s,
						    o;for (o in t) t[A](o) && ht(o) != o && ht(o) + "%" != o && (s = !0, a[o] = t[o]);if (s) return i && (a.easing = i), n && (a.callback = n), new m({ 100: a }, r);if (n) {
							var l = 0;for (var h in t) {
								var u = ut(h);t[A](h) && u > l && (l = u);
							}l += "%", !t[l].callback && (t[l].callback = n);
						}return new m(t, r);
					}, ye.animate = function (t, r, i, n) {
						var a = this;if (a.removed) return n && n.call(a), a;var s = t instanceof m ? t : e.animation(t, r, i, n);return b(s, a, s.percents[0], null, a.attr()), a;
					}, ye.setTime = function (t, e) {
						return t && null != e && this.status(t, G(e, t.ms) / t.ms), this;
					}, ye.status = function (t, e) {
						var r = [],
						    i = 0,
						    n,
						    a;if (null != e) return b(t, this, -1, G(e, 1)), this;for (n = Ee.length; i < n; i++) if (a = Ee[i], a.el.id == this.id && (!t || a.anim == t)) {
							if (t) return a.status;r.push({ anim: a.anim, status: a.status });
						}return t ? 0 : r;
					}, ye.pause = function (e) {
						for (var r = 0; r < Ee.length; r++) Ee[r].el.id != this.id || e && Ee[r].anim != e || t("raphael.anim.pause." + this.id, this, Ee[r].anim) !== !1 && (Ee[r].paused = !0);return this;
					}, ye.resume = function (e) {
						for (var r = 0; r < Ee.length; r++) if (Ee[r].el.id == this.id && (!e || Ee[r].anim == e)) {
							var i = Ee[r];t("raphael.anim.resume." + this.id, this, i.anim) !== !1 && (delete i.paused, this.status(i.anim, i.status));
						}return this;
					}, ye.stop = function (e) {
						for (var r = 0; r < Ee.length; r++) Ee[r].el.id != this.id || e && Ee[r].anim != e || t("raphael.anim.stop." + this.id, this, Ee[r].anim) !== !1 && Ee.splice(r--, 1);return this;
					}, t.on("raphael.remove", _), t.on("raphael.clear", _), ye.toString = function () {
						return "Raphaël’s object";
					};var ze = function (t) {
						if (this.items = [], this.length = 0, this.type = "set", t) for (var e = 0, r = t.length; e < r; e++) !t[e] || t[e].constructor != ye.constructor && t[e].constructor != ze || (this[this.items.length] = this.items[this.items.length] = t[e], this.length++);
					},
					    Pe = ze.prototype;Pe.push = function () {
						for (var t, e, r = 0, i = arguments.length; r < i; r++) t = arguments[r], !t || t.constructor != ye.constructor && t.constructor != ze || (e = this.items.length, this[e] = this.items[e] = t, this.length++);return this;
					}, Pe.pop = function () {
						return this.length && delete this[this.length--], this.items.pop();
					}, Pe.forEach = function (t, e) {
						for (var r = 0, i = this.items.length; r < i; r++) if (t.call(e, this.items[r], r) === !1) return this;return this;
					};for (var Fe in ye) ye[A](Fe) && (Pe[Fe] = function (t) {
						return function () {
							var e = arguments;return this.forEach(function (r) {
								r[t][z](r, e);
							});
						};
					}(Fe));return Pe.attr = function (t, r) {
						if (t && e.is(t, Q) && e.is(t[0], "object")) for (var i = 0, n = t.length; i < n; i++) this.items[i].attr(t[i]);else for (var a = 0, s = this.items.length; a < s; a++) this.items[a].attr(t, r);return this;
					}, Pe.clear = function () {
						for (; this.length;) this.pop();
					}, Pe.splice = function (t, e, r) {
						t = t < 0 ? W(this.length + t, 0) : t, e = W(0, G(this.length - t, e));var i = [],
						    n = [],
						    a = [],
						    s;for (s = 2; s < arguments.length; s++) a.push(arguments[s]);for (s = 0; s < e; s++) n.push(this[t + s]);for (; s < this.length - t; s++) i.push(this[t + s]);var o = a.length;for (s = 0; s < o + i.length; s++) this.items[t + s] = this[t + s] = s < o ? a[s] : i[s - o];for (s = this.items.length = this.length -= e - o; this[s];) delete this[s++];return new ze(n);
					}, Pe.exclude = function (t) {
						for (var e = 0, r = this.length; e < r; e++) if (this[e] == t) return this.splice(e, 1), !0;
					}, Pe.animate = function (t, r, i, n) {
						(e.is(i, "function") || !i) && (n = i || null);var a = this.items.length,
						    s = a,
						    o,
						    l = this,
						    h;if (!a) return this;n && (h = function () {
							! --a && n.call(l);
						}), i = e.is(i, Z) ? i : h;var u = e.animation(t, r, i, h);for (o = this.items[--s].animate(u); s--;) this.items[s] && !this.items[s].removed && this.items[s].animateWith(o, u, u), this.items[s] && !this.items[s].removed || a--;return this;
					}, Pe.insertAfter = function (t) {
						for (var e = this.items.length; e--;) this.items[e].insertAfter(t);return this;
					}, Pe.getBBox = function () {
						for (var t = [], e = [], r = [], i = [], n = this.items.length; n--;) if (!this.items[n].removed) {
							var a = this.items[n].getBBox();t.push(a.x), e.push(a.y), r.push(a.x + a.width), i.push(a.y + a.height);
						}return t = G[z](0, t), e = G[z](0, e), r = W[z](0, r), i = W[z](0, i), { x: t, y: e, x2: r, y2: i, width: r - t, height: i - e };
					}, Pe.clone = function (t) {
						t = this.paper.set();for (var e = 0, r = this.items.length; e < r; e++) t.push(this.items[e].clone());return t;
					}, Pe.toString = function () {
						return "Raphaël‘s set";
					}, Pe.glow = function (t) {
						var e = this.paper.set();return this.forEach(function (r, i) {
							var n = r.glow(t);null != n && n.forEach(function (t, r) {
								e.push(t);
							});
						}), e;
					}, Pe.isPointInside = function (t, e) {
						var r = !1;return this.forEach(function (i) {
							if (i.isPointInside(t, e)) return r = !0, !1;
						}), r;
					}, e.registerFont = function (t) {
						if (!t.face) return t;this.fonts = this.fonts || {};var e = { w: t.w, face: {}, glyphs: {} },
						    r = t.face["font-family"];for (var i in t.face) t.face[A](i) && (e.face[i] = t.face[i]);if (this.fonts[r] ? this.fonts[r].push(e) : this.fonts[r] = [e], !t.svg) {
							e.face["units-per-em"] = ut(t.face["units-per-em"], 10);for (var n in t.glyphs) if (t.glyphs[A](n)) {
								var a = t.glyphs[n];if (e.glyphs[n] = { w: a.w, k: {}, d: a.d && "M" + a.d.replace(/[mlcxtrv]/g, function (t) {
										return { l: "L", c: "C", x: "z", t: "m", r: "l", v: "c" }[t] || "M";
									}) + "z" }, a.k) for (var s in a.k) a[A](s) && (e.glyphs[n].k[s] = a.k[s]);
							}
						}return t;
					}, N.getFont = function (t, r, i, n) {
						if (n = n || "normal", i = i || "normal", r = +r || { normal: 400, bold: 700, lighter: 300, bolder: 800 }[r] || 400, e.fonts) {
							var a = e.fonts[t];if (!a) {
								var s = new RegExp("(^|\\s)" + t.replace(/[^\w\d\s+!~.:_-]/g, R) + "(\\s|$)", "i");for (var o in e.fonts) if (e.fonts[A](o) && s.test(o)) {
									a = e.fonts[o];break;
								}
							}var l;if (a) for (var h = 0, u = a.length; h < u && (l = a[h], l.face["font-weight"] != r || l.face["font-style"] != i && l.face["font-style"] || l.face["font-stretch"] != n); h++);return l;
						}
					}, N.print = function (t, r, i, n, a, s, o, l) {
						s = s || "middle", o = W(G(o || 0, 1), -1), l = W(G(l || 1, 3), 1);var h = I(i)[q](R),
						    u = 0,
						    c = 0,
						    f = R,
						    p;if (e.is(n, "string") && (n = this.getFont(n)), n) {
							p = (a || 16) / n.face["units-per-em"];for (var d = n.face.bbox[q](k), g = +d[0], v = d[3] - d[1], x = 0, y = +d[1] + ("baseline" == s ? v + +n.face.descent : v / 2), m = 0, b = h.length; m < b; m++) {
								if ("\n" == h[m]) u = 0, w = 0, c = 0, x += v * l;else {
									var _ = c && n.glyphs[h[m - 1]] || {},
									    w = n.glyphs[h[m]];u += c ? (_.w || n.w) + (_.k && _.k[h[m]] || 0) + n.w * o : 0, c = 1;
								}w && w.d && (f += e.transformPath(w.d, ["t", u * p, x * p, "s", p, p, g, y, "t", (t - g) / p, (r - y) / p]));
							}
						}return this.path(f).attr({ fill: "#000", stroke: "none" });
					}, N.add = function (t) {
						if (e.is(t, "array")) for (var r = this.set(), i = 0, n = t.length, a; i < n; i++) a = t[i] || {}, B[A](a.type) && r.push(this[a.type]().attr(a));return r;
					}, e.format = function (t, r) {
						var i = e.is(r, Q) ? [0][P](r) : arguments;return t && e.is(t, Z) && i.length - 1 && (t = t.replace(C, function (t, e) {
							return null == i[++e] ? R : i[e];
						})), t || R;
					}, e.fullfill = function () {
						var t = /\{([^\}]+)\}/g,
						    e = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,
						    r = function (t, r, i) {
							var n = i;return r.replace(e, function (t, e, r, i, a) {
								e = e || i, n && (e in n && (n = n[e]), "function" == typeof n && a && (n = n()));
							}), n = (null == n || n == i ? t : n) + "";
						};return function (e, i) {
							return String(e).replace(t, function (t, e) {
								return r(t, e, i);
							});
						};
					}(), e.ninja = function () {
						if (E.was) T.win.Raphael = E.is;else {
							window.Raphael = void 0;try {
								delete window.Raphael;
							} catch (t) {}
						}return e;
					}, e.st = Pe, t.on("raphael.DOMload", function () {
						w = !0;
					}), function (t, r, i) {
						function n() {
							/in/.test(t.readyState) ? setTimeout(n, 9) : e.eve("raphael.DOMload");
						}null == t.readyState && t.addEventListener && (t.addEventListener(r, i = function () {
							t.removeEventListener(r, i, !1), t.readyState = "complete";
						}, !1), t.readyState = "loading"), n();
					}(document, "DOMContentLoaded"), e;
				}.apply(e, i), !(void 0 !== n && (t.exports = n));
			}, function (t, e, r) {
				var i, n;!function (r) {
					var a = "0.5.0",
					    s = "hasOwnProperty",
					    o = /[\.\/]/,
					    l = /\s*,\s*/,
					    h = "*",
					    u = function () {},
					    c = function (t, e) {
						return t - e;
					},
					    f,
					    p,
					    d = { n: {} },
					    g = function () {
						for (var t = 0, e = this.length; t < e; t++) if ("undefined" != typeof this[t]) return this[t];
					},
					    v = function () {
						for (var t = this.length; --t;) if ("undefined" != typeof this[t]) return this[t];
					},
					    x = Object.prototype.toString,
					    y = String,
					    m = Array.isArray || function (t) {
						return t instanceof Array || "[object Array]" == x.call(t);
					};eve = function (t, e) {
						var r = d,
						    i = p,
						    n = Array.prototype.slice.call(arguments, 2),
						    a = eve.listeners(t),
						    s = 0,
						    o = !1,
						    l,
						    h = [],
						    u = {},
						    x = [],
						    y = f,
						    m = [];x.firstDefined = g, x.lastDefined = v, f = t, p = 0;for (var b = 0, _ = a.length; b < _; b++) "zIndex" in a[b] && (h.push(a[b].zIndex), a[b].zIndex < 0 && (u[a[b].zIndex] = a[b]));for (h.sort(c); h[s] < 0;) if (l = u[h[s++]], x.push(l.apply(e, n)), p) return p = i, x;for (b = 0; b < _; b++) if (l = a[b], "zIndex" in l) {
							if (l.zIndex == h[s]) {
								if (x.push(l.apply(e, n)), p) break;do if (s++, l = u[h[s]], l && x.push(l.apply(e, n)), p) break; while (l);
							} else u[l.zIndex] = l;
						} else if (x.push(l.apply(e, n)), p) break;return p = i, f = y, x;
					}, eve._events = d, eve.listeners = function (t) {
						var e = m(t) ? t : t.split(o),
						    r = d,
						    i,
						    n,
						    a,
						    s,
						    l,
						    u,
						    c,
						    f,
						    p = [r],
						    g = [];for (s = 0, l = e.length; s < l; s++) {
							for (f = [], u = 0, c = p.length; u < c; u++) for (r = p[u].n, n = [r[e[s]], r[h]], a = 2; a--;) i = n[a], i && (f.push(i), g = g.concat(i.f || []));p = f;
						}return g;
					}, eve.separator = function (t) {
						t ? (t = y(t).replace(/(?=[\.\^\]\[\-])/g, "\\"), t = "[" + t + "]", o = new RegExp(t)) : o = /[\.\/]/;
					}, eve.on = function (t, e) {
						if ("function" != typeof e) return function () {};for (var r = m(t) ? m(t[0]) ? t : [t] : y(t).split(l), i = 0, n = r.length; i < n; i++) !function (t) {
							for (var r = m(t) ? t : y(t).split(o), i = d, n, a = 0, s = r.length; a < s; a++) i = i.n, i = i.hasOwnProperty(r[a]) && i[r[a]] || (i[r[a]] = { n: {} });for (i.f = i.f || [], a = 0, s = i.f.length; a < s; a++) if (i.f[a] == e) {
								n = !0;break;
							}!n && i.f.push(e);
						}(r[i]);return function (t) {
							+t == +t && (e.zIndex = +t);
						};
					}, eve.f = function (t) {
						var e = [].slice.call(arguments, 1);return function () {
							eve.apply(null, [t, null].concat(e).concat([].slice.call(arguments, 0)));
						};
					}, eve.stop = function () {
						p = 1;
					}, eve.nt = function (t) {
						var e = m(f) ? f.join(".") : f;return t ? new RegExp("(?:\\.|\\/|^)" + t + "(?:\\.|\\/|$)").test(e) : e;
					}, eve.nts = function () {
						return m(f) ? f : f.split(o);
					}, eve.off = eve.unbind = function (t, e) {
						if (!t) return void (eve._events = d = { n: {} });var r = m(t) ? m(t[0]) ? t : [t] : y(t).split(l);if (r.length > 1) for (var i = 0, n = r.length; i < n; i++) eve.off(r[i], e);else {
							r = m(t) ? t : y(t).split(o);var a,
							    u,
							    c,
							    i,
							    n,
							    f,
							    p,
							    g = [d];for (i = 0, n = r.length; i < n; i++) for (f = 0; f < g.length; f += c.length - 2) {
								if (c = [f, 1], a = g[f].n, r[i] != h) a[r[i]] && c.push(a[r[i]]);else for (u in a) a[s](u) && c.push(a[u]);g.splice.apply(g, c);
							}for (i = 0, n = g.length; i < n; i++) for (a = g[i]; a.n;) {
								if (e) {
									if (a.f) {
										for (f = 0, p = a.f.length; f < p; f++) if (a.f[f] == e) {
											a.f.splice(f, 1);break;
										}!a.f.length && delete a.f;
									}for (u in a.n) if (a.n[s](u) && a.n[u].f) {
										var v = a.n[u].f;for (f = 0, p = v.length; f < p; f++) if (v[f] == e) {
											v.splice(f, 1);break;
										}!v.length && delete a.n[u].f;
									}
								} else {
									delete a.f;for (u in a.n) a.n[s](u) && a.n[u].f && delete a.n[u].f;
								}a = a.n;
							}
						}
					}, eve.once = function (t, e) {
						var r = function () {
							return eve.off(t, r), e.apply(this, arguments);
						};return eve.on(t, r);
					}, eve.version = a, eve.toString = function () {
						return "You are running Eve " + a;
					}, "undefined" != typeof t && t.exports ? t.exports = eve : (i = [], n = function () {
						return eve;
					}.apply(e, i), !(void 0 !== n && (t.exports = n)));
				}(this);
			}, function (t, e, r) {
				var i, n;i = [r(1)], n = function (t) {
					if (!t || t.svg) {
						var e = "hasOwnProperty",
						    r = String,
						    i = parseFloat,
						    n = parseInt,
						    a = Math,
						    s = a.max,
						    o = a.abs,
						    l = a.pow,
						    h = /[, ]+/,
						    u = t.eve,
						    c = "",
						    f = " ",
						    p = "http://www.w3.org/1999/xlink",
						    d = { block: "M5,0 0,2.5 5,5z", classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z", diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z", open: "M6,1 1,3.5 6,6", oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z" },
						    g = {};t.toString = function () {
							return "Your browser supports SVG.\nYou are running Raphaël " + this.version;
						};var v = function (i, n) {
							if (n) {
								"string" == typeof i && (i = v(i));for (var a in n) n[e](a) && ("xlink:" == a.substring(0, 6) ? i.setAttributeNS(p, a.substring(6), r(n[a])) : i.setAttribute(a, r(n[a])));
							} else i = t._g.doc.createElementNS("http://www.w3.org/2000/svg", i), i.style && (i.style.webkitTapHighlightColor = "rgba(0,0,0,0)");return i;
						},
						    x = function (e, n) {
							var h = "linear",
							    u = e.id + n,
							    f = .5,
							    p = .5,
							    d = e.node,
							    g = e.paper,
							    x = d.style,
							    y = t._g.doc.getElementById(u);if (!y) {
								if (n = r(n).replace(t._radial_gradient, function (t, e, r) {
									if (h = "radial", e && r) {
										f = i(e), p = i(r);var n = 2 * (p > .5) - 1;l(f - .5, 2) + l(p - .5, 2) > .25 && (p = a.sqrt(.25 - l(f - .5, 2)) * n + .5) && .5 != p && (p = p.toFixed(5) - 1e-5 * n);
									}return c;
								}), n = n.split(/\s*\-\s*/), "linear" == h) {
									var b = n.shift();if (b = -i(b), isNaN(b)) return null;var _ = [0, 0, a.cos(t.rad(b)), a.sin(t.rad(b))],
									    w = 1 / (s(o(_[2]), o(_[3])) || 1);_[2] *= w, _[3] *= w, _[2] < 0 && (_[0] = -_[2], _[2] = 0), _[3] < 0 && (_[1] = -_[3], _[3] = 0);
								}var k = t._parseDots(n);if (!k) return null;if (u = u.replace(/[\(\)\s,\xb0#]/g, "_"), e.gradient && u != e.gradient.id && (g.defs.removeChild(e.gradient), delete e.gradient), !e.gradient) {
									y = v(h + "Gradient", { id: u }), e.gradient = y, v(y, "radial" == h ? { fx: f, fy: p } : { x1: _[0], y1: _[1], x2: _[2], y2: _[3], gradientTransform: e.matrix.invert() }), g.defs.appendChild(y);for (var B = 0, C = k.length; B < C; B++) y.appendChild(v("stop", { offset: k[B].offset ? k[B].offset : B ? "100%" : "0%", "stop-color": k[B].color || "#fff", "stop-opacity": isFinite(k[B].opacity) ? k[B].opacity : 1 }));
								}
							}return v(d, { fill: m(u), opacity: 1, "fill-opacity": 1 }), x.fill = c, x.opacity = 1, x.fillOpacity = 1, 1;
						},
						    y = function () {
							var t = document.documentMode;return t && (9 === t || 10 === t);
						},
						    m = function (t) {
							if (y()) return "url('#" + t + "')";var e = document.location,
							    r = e.protocol + "//" + e.host + e.pathname + e.search;return "url('" + r + "#" + t + "')";
						},
						    b = function (t) {
							var e = t.getBBox(1);v(t.pattern, { patternTransform: t.matrix.invert() + " translate(" + e.x + "," + e.y + ")" });
						},
						    _ = function (i, n, a) {
							if ("path" == i.type) {
								for (var s = r(n).toLowerCase().split("-"), o = i.paper, l = a ? "end" : "start", h = i.node, u = i.attrs, f = u["stroke-width"], p = s.length, x = "classic", y, m, b, _, w, k = 3, B = 3, C = 5; p--;) switch (s[p]) {case "block":case "classic":case "oval":case "diamond":case "open":case "none":
										x = s[p];break;case "wide":
										B = 5;break;case "narrow":
										B = 2;break;case "long":
										k = 5;break;case "short":
										k = 2;}if ("open" == x ? (k += 2, B += 2, C += 2, b = 1, _ = a ? 4 : 1, w = { fill: "none", stroke: u.stroke }) : (_ = b = k / 2, w = { fill: u.stroke, stroke: "none" }), i._.arrows ? a ? (i._.arrows.endPath && g[i._.arrows.endPath]--, i._.arrows.endMarker && g[i._.arrows.endMarker]--) : (i._.arrows.startPath && g[i._.arrows.startPath]--, i._.arrows.startMarker && g[i._.arrows.startMarker]--) : i._.arrows = {}, "none" != x) {
									var S = "raphael-marker-" + x,
									    A = "raphael-marker-" + l + x + k + B + "-obj" + i.id;t._g.doc.getElementById(S) ? g[S]++ : (o.defs.appendChild(v(v("path"), { "stroke-linecap": "round", d: d[x], id: S })), g[S] = 1);var T = t._g.doc.getElementById(A),
									    E;T ? (g[A]++, E = T.getElementsByTagName("use")[0]) : (T = v(v("marker"), { id: A, markerHeight: B, markerWidth: k, orient: "auto", refX: _, refY: B / 2 }), E = v(v("use"), { "xlink:href": "#" + S, transform: (a ? "rotate(180 " + k / 2 + " " + B / 2 + ") " : c) + "scale(" + k / C + "," + B / C + ")", "stroke-width": (1 / ((k / C + B / C) / 2)).toFixed(4) }), T.appendChild(E), o.defs.appendChild(T), g[A] = 1), v(E, w);var M = b * ("diamond" != x && "oval" != x);a ? (y = i._.arrows.startdx * f || 0, m = t.getTotalLength(u.path) - M * f) : (y = M * f, m = t.getTotalLength(u.path) - (i._.arrows.enddx * f || 0)), w = {}, w["marker-" + l] = "url(#" + A + ")", (m || y) && (w.d = t.getSubpath(u.path, y, m)), v(h, w), i._.arrows[l + "Path"] = S, i._.arrows[l + "Marker"] = A, i._.arrows[l + "dx"] = M, i._.arrows[l + "Type"] = x, i._.arrows[l + "String"] = n;
								} else a ? (y = i._.arrows.startdx * f || 0, m = t.getTotalLength(u.path) - y) : (y = 0, m = t.getTotalLength(u.path) - (i._.arrows.enddx * f || 0)), i._.arrows[l + "Path"] && v(h, { d: t.getSubpath(u.path, y, m) }), delete i._.arrows[l + "Path"], delete i._.arrows[l + "Marker"], delete i._.arrows[l + "dx"], delete i._.arrows[l + "Type"], delete i._.arrows[l + "String"];for (w in g) if (g[e](w) && !g[w]) {
									var N = t._g.doc.getElementById(w);N && N.parentNode.removeChild(N);
								}
							}
						},
						    w = { "-": [3, 1], ".": [1, 1], "-.": [3, 1, 1, 1], "-..": [3, 1, 1, 1, 1, 1], ". ": [1, 3], "- ": [4, 3], "--": [8, 3], "- .": [4, 3, 1, 3], "--.": [8, 3, 1, 3], "--..": [8, 3, 1, 3, 1, 3] },
						    k = function (t, e, i) {
							if (e = w[r(e).toLowerCase()]) {
								for (var n = t.attrs["stroke-width"] || "1", a = { round: n, square: n, butt: 0 }[t.attrs["stroke-linecap"] || i["stroke-linecap"]] || 0, s = [], o = e.length; o--;) s[o] = e[o] * n + (o % 2 ? 1 : -1) * a;v(t.node, { "stroke-dasharray": s.join(",") });
							} else v(t.node, { "stroke-dasharray": "none" });
						},
						    B = function (i, a) {
							var l = i.node,
							    u = i.attrs,
							    f = l.style.visibility;l.style.visibility = "hidden";for (var d in a) if (a[e](d)) {
								if (!t._availableAttrs[e](d)) continue;var g = a[d];switch (u[d] = g, d) {case "blur":
										i.blur(g);break;case "title":
										var y = l.getElementsByTagName("title");if (y.length && (y = y[0])) y.firstChild.nodeValue = g;else {
											y = v("title");var m = t._g.doc.createTextNode(g);y.appendChild(m), l.appendChild(y);
										}break;case "href":case "target":
										var w = l.parentNode;if ("a" != w.tagName.toLowerCase()) {
											var B = v("a");w.insertBefore(B, l), B.appendChild(l), w = B;
										}"target" == d ? w.setAttributeNS(p, "show", "blank" == g ? "new" : g) : w.setAttributeNS(p, d, g);break;case "cursor":
										l.style.cursor = g;break;case "transform":
										i.transform(g);break;case "arrow-start":
										_(i, g);break;case "arrow-end":
										_(i, g, 1);break;case "clip-rect":
										var C = r(g).split(h);if (4 == C.length) {
											i.clip && i.clip.parentNode.parentNode.removeChild(i.clip.parentNode);var A = v("clipPath"),
											    T = v("rect");A.id = t.createUUID(), v(T, { x: C[0], y: C[1], width: C[2], height: C[3] }), A.appendChild(T), i.paper.defs.appendChild(A), v(l, { "clip-path": "url(#" + A.id + ")" }), i.clip = T;
										}if (!g) {
											var E = l.getAttribute("clip-path");if (E) {
												var M = t._g.doc.getElementById(E.replace(/(^url\(#|\)$)/g, c));M && M.parentNode.removeChild(M), v(l, { "clip-path": c }), delete i.clip;
											}
										}break;case "path":
										"path" == i.type && (v(l, { d: g ? u.path = t._pathToAbsolute(g) : "M0,0" }), i._.dirty = 1, i._.arrows && ("startString" in i._.arrows && _(i, i._.arrows.startString), "endString" in i._.arrows && _(i, i._.arrows.endString, 1)));break;case "width":
										if (l.setAttribute(d, g), i._.dirty = 1, !u.fx) break;d = "x", g = u.x;case "x":
										u.fx && (g = -u.x - (u.width || 0));case "rx":
										if ("rx" == d && "rect" == i.type) break;case "cx":
										l.setAttribute(d, g), i.pattern && b(i), i._.dirty = 1;break;case "height":
										if (l.setAttribute(d, g), i._.dirty = 1, !u.fy) break;d = "y", g = u.y;case "y":
										u.fy && (g = -u.y - (u.height || 0));case "ry":
										if ("ry" == d && "rect" == i.type) break;case "cy":
										l.setAttribute(d, g), i.pattern && b(i), i._.dirty = 1;break;case "r":
										"rect" == i.type ? v(l, { rx: g, ry: g }) : l.setAttribute(d, g), i._.dirty = 1;break;case "src":
										"image" == i.type && l.setAttributeNS(p, "href", g);break;case "stroke-width":
										1 == i._.sx && 1 == i._.sy || (g /= s(o(i._.sx), o(i._.sy)) || 1), l.setAttribute(d, g), u["stroke-dasharray"] && k(i, u["stroke-dasharray"], a), i._.arrows && ("startString" in i._.arrows && _(i, i._.arrows.startString), "endString" in i._.arrows && _(i, i._.arrows.endString, 1));break;case "stroke-dasharray":
										k(i, g, a);break;case "fill":
										var N = r(g).match(t._ISURL);if (N) {
											A = v("pattern");var L = v("image");A.id = t.createUUID(), v(A, { x: 0, y: 0, patternUnits: "userSpaceOnUse", height: 1, width: 1 }), v(L, { x: 0, y: 0, "xlink:href": N[1] }), A.appendChild(L), function (e) {
												t._preload(N[1], function () {
													var t = this.offsetWidth,
													    r = this.offsetHeight;v(e, { width: t, height: r }), v(L, { width: t, height: r });
												});
											}(A), i.paper.defs.appendChild(A), v(l, { fill: "url(#" + A.id + ")" }), i.pattern = A, i.pattern && b(i);break;
										}var z = t.getRGB(g);if (z.error) {
											if (("circle" == i.type || "ellipse" == i.type || "r" != r(g).charAt()) && x(i, g)) {
												if ("opacity" in u || "fill-opacity" in u) {
													var P = t._g.doc.getElementById(l.getAttribute("fill").replace(/^url\(#|\)$/g, c));if (P) {
														var F = P.getElementsByTagName("stop");v(F[F.length - 1], { "stop-opacity": ("opacity" in u ? u.opacity : 1) * ("fill-opacity" in u ? u["fill-opacity"] : 1) });
													}
												}u.gradient = g, u.fill = "none";break;
											}
										} else delete a.gradient, delete u.gradient, !t.is(u.opacity, "undefined") && t.is(a.opacity, "undefined") && v(l, { opacity: u.opacity }), !t.is(u["fill-opacity"], "undefined") && t.is(a["fill-opacity"], "undefined") && v(l, { "fill-opacity": u["fill-opacity"] });z[e]("opacity") && v(l, { "fill-opacity": z.opacity > 1 ? z.opacity / 100 : z.opacity });case "stroke":
										z = t.getRGB(g), l.setAttribute(d, z.hex), "stroke" == d && z[e]("opacity") && v(l, { "stroke-opacity": z.opacity > 1 ? z.opacity / 100 : z.opacity }), "stroke" == d && i._.arrows && ("startString" in i._.arrows && _(i, i._.arrows.startString), "endString" in i._.arrows && _(i, i._.arrows.endString, 1));break;case "gradient":
										("circle" == i.type || "ellipse" == i.type || "r" != r(g).charAt()) && x(i, g);break;case "opacity":
										u.gradient && !u[e]("stroke-opacity") && v(l, { "stroke-opacity": g > 1 ? g / 100 : g });case "fill-opacity":
										if (u.gradient) {
											P = t._g.doc.getElementById(l.getAttribute("fill").replace(/^url\(#|\)$/g, c)), P && (F = P.getElementsByTagName("stop"), v(F[F.length - 1], { "stop-opacity": g }));break;
										}default:
										"font-size" == d && (g = n(g, 10) + "px");var R = d.replace(/(\-.)/g, function (t) {
											return t.substring(1).toUpperCase();
										});l.style[R] = g, i._.dirty = 1, l.setAttribute(d, g);}
							}S(i, a), l.style.visibility = f;
						},
						    C = 1.2,
						    S = function (i, a) {
							if ("text" == i.type && (a[e]("text") || a[e]("font") || a[e]("font-size") || a[e]("x") || a[e]("y"))) {
								var s = i.attrs,
								    o = i.node,
								    l = o.firstChild ? n(t._g.doc.defaultView.getComputedStyle(o.firstChild, c).getPropertyValue("font-size"), 10) : 10;if (a[e]("text")) {
									for (s.text = a.text; o.firstChild;) o.removeChild(o.firstChild);for (var h = r(a.text).split("\n"), u = [], f, p = 0, d = h.length; p < d; p++) f = v("tspan"), p && v(f, { dy: l * C, x: s.x }), f.appendChild(t._g.doc.createTextNode(h[p])), o.appendChild(f), u[p] = f;
								} else for (u = o.getElementsByTagName("tspan"), p = 0, d = u.length; p < d; p++) p ? v(u[p], { dy: l * C, x: s.x }) : v(u[0], { dy: 0 });v(o, { x: s.x, y: s.y }), i._.dirty = 1;var g = i._getBBox(),
								    x = s.y - (g.y + g.height / 2);x && t.is(x, "finite") && v(u[0], { dy: x });
							}
						},
						    A = function (t) {
							return t.parentNode && "a" === t.parentNode.tagName.toLowerCase() ? t.parentNode : t;
						},
						    T = function (e, r) {
							function i() {
								return ("0000" + (Math.random() * Math.pow(36, 5) << 0).toString(36)).slice(-5);
							}var n = 0,
							    a = 0;this[0] = this.node = e, e.raphael = !0, this.id = i(), e.raphaelid = this.id, this.matrix = t.matrix(), this.realPath = null, this.paper = r, this.attrs = this.attrs || {}, this._ = { transform: [], sx: 1, sy: 1, deg: 0, dx: 0, dy: 0, dirty: 1 }, !r.bottom && (r.bottom = this), this.prev = r.top, r.top && (r.top.next = this), r.top = this, this.next = null;
						},
						    E = t.el;T.prototype = E, E.constructor = T, t._engine.path = function (t, e) {
							var r = v("path");e.canvas && e.canvas.appendChild(r);var i = new T(r, e);return i.type = "path", B(i, { fill: "none", stroke: "#000", path: t }), i;
						}, E.rotate = function (t, e, n) {
							if (this.removed) return this;if (t = r(t).split(h), t.length - 1 && (e = i(t[1]), n = i(t[2])), t = i(t[0]), null == n && (e = n), null == e || null == n) {
								var a = this.getBBox(1);e = a.x + a.width / 2, n = a.y + a.height / 2;
							}return this.transform(this._.transform.concat([["r", t, e, n]])), this;
						}, E.scale = function (t, e, n, a) {
							if (this.removed) return this;if (t = r(t).split(h), t.length - 1 && (e = i(t[1]), n = i(t[2]), a = i(t[3])), t = i(t[0]), null == e && (e = t), null == a && (n = a), null == n || null == a) var s = this.getBBox(1);return n = null == n ? s.x + s.width / 2 : n, a = null == a ? s.y + s.height / 2 : a, this.transform(this._.transform.concat([["s", t, e, n, a]])), this;
						}, E.translate = function (t, e) {
							return this.removed ? this : (t = r(t).split(h), t.length - 1 && (e = i(t[1])), t = i(t[0]) || 0, e = +e || 0, this.transform(this._.transform.concat([["t", t, e]])), this);
						}, E.transform = function (r) {
							var i = this._;if (null == r) return i.transform;if (t._extractTransform(this, r), this.clip && v(this.clip, { transform: this.matrix.invert() }), this.pattern && b(this), this.node && v(this.node, { transform: this.matrix }), 1 != i.sx || 1 != i.sy) {
								var n = this.attrs[e]("stroke-width") ? this.attrs["stroke-width"] : 1;this.attr({ "stroke-width": n });
							}return this;
						}, E.hide = function () {
							return this.removed || (this.node.style.display = "none"), this;
						}, E.show = function () {
							return this.removed || (this.node.style.display = ""), this;
						}, E.remove = function () {
							var e = A(this.node);if (!this.removed && e.parentNode) {
								var r = this.paper;r.__set__ && r.__set__.exclude(this), u.unbind("raphael.*.*." + this.id), this.gradient && r.defs.removeChild(this.gradient), t._tear(this, r), e.parentNode.removeChild(e), this.removeData();for (var i in this) this[i] = "function" == typeof this[i] ? t._removedFactory(i) : null;this.removed = !0;
							}
						}, E._getBBox = function () {
							if ("none" == this.node.style.display) {
								this.show();var t = !0;
							}var e = !1,
							    r;this.paper.canvas.parentElement ? r = this.paper.canvas.parentElement.style : this.paper.canvas.parentNode && (r = this.paper.canvas.parentNode.style), r && "none" == r.display && (e = !0, r.display = "");var i = {};try {
								i = this.node.getBBox();
							} catch (n) {
								i = { x: this.node.clientLeft, y: this.node.clientTop, width: this.node.clientWidth, height: this.node.clientHeight };
							} finally {
								i = i || {}, e && (r.display = "none");
							}return t && this.hide(), i;
						}, E.attr = function (r, i) {
							if (this.removed) return this;if (null == r) {
								var n = {};for (var a in this.attrs) this.attrs[e](a) && (n[a] = this.attrs[a]);return n.gradient && "none" == n.fill && (n.fill = n.gradient) && delete n.gradient, n.transform = this._.transform, n;
							}if (null == i && t.is(r, "string")) {
								if ("fill" == r && "none" == this.attrs.fill && this.attrs.gradient) return this.attrs.gradient;if ("transform" == r) return this._.transform;for (var s = r.split(h), o = {}, l = 0, c = s.length; l < c; l++) r = s[l], r in this.attrs ? o[r] = this.attrs[r] : t.is(this.paper.customAttributes[r], "function") ? o[r] = this.paper.customAttributes[r].def : o[r] = t._availableAttrs[r];return c - 1 ? o : o[s[0]];
							}if (null == i && t.is(r, "array")) {
								for (o = {}, l = 0, c = r.length; l < c; l++) o[r[l]] = this.attr(r[l]);return o;
							}if (null != i) {
								var f = {};f[r] = i;
							} else null != r && t.is(r, "object") && (f = r);for (var p in f) u("raphael.attr." + p + "." + this.id, this, f[p]);for (p in this.paper.customAttributes) if (this.paper.customAttributes[e](p) && f[e](p) && t.is(this.paper.customAttributes[p], "function")) {
								var d = this.paper.customAttributes[p].apply(this, [].concat(f[p]));this.attrs[p] = f[p];for (var g in d) d[e](g) && (f[g] = d[g]);
							}return B(this, f), this;
						}, E.toFront = function () {
							if (this.removed) return this;var e = A(this.node);e.parentNode.appendChild(e);var r = this.paper;return r.top != this && t._tofront(this, r), this;
						}, E.toBack = function () {
							if (this.removed) return this;var e = A(this.node),
							    r = e.parentNode;r.insertBefore(e, r.firstChild), t._toback(this, this.paper);var i = this.paper;return this;
						}, E.insertAfter = function (e) {
							if (this.removed || !e) return this;var r = A(this.node),
							    i = A(e.node || e[e.length - 1].node);return i.nextSibling ? i.parentNode.insertBefore(r, i.nextSibling) : i.parentNode.appendChild(r), t._insertafter(this, e, this.paper), this;
						}, E.insertBefore = function (e) {
							if (this.removed || !e) return this;var r = A(this.node),
							    i = A(e.node || e[0].node);return i.parentNode.insertBefore(r, i), t._insertbefore(this, e, this.paper), this;
						}, E.blur = function (e) {
							var r = this;if (0 !== +e) {
								var i = v("filter"),
								    n = v("feGaussianBlur");r.attrs.blur = e, i.id = t.createUUID(), v(n, { stdDeviation: +e || 1.5 }), i.appendChild(n), r.paper.defs.appendChild(i), r._blur = i, v(r.node, { filter: "url(#" + i.id + ")" });
							} else r._blur && (r._blur.parentNode.removeChild(r._blur), delete r._blur, delete r.attrs.blur), r.node.removeAttribute("filter");return r;
						}, t._engine.circle = function (t, e, r, i) {
							var n = v("circle");t.canvas && t.canvas.appendChild(n);var a = new T(n, t);return a.attrs = { cx: e, cy: r, r: i, fill: "none", stroke: "#000" }, a.type = "circle", v(n, a.attrs), a;
						}, t._engine.rect = function (t, e, r, i, n, a) {
							var s = v("rect");t.canvas && t.canvas.appendChild(s);var o = new T(s, t);return o.attrs = { x: e, y: r, width: i, height: n, rx: a || 0, ry: a || 0, fill: "none", stroke: "#000" }, o.type = "rect", v(s, o.attrs), o;
						}, t._engine.ellipse = function (t, e, r, i, n) {
							var a = v("ellipse");t.canvas && t.canvas.appendChild(a);var s = new T(a, t);return s.attrs = { cx: e, cy: r, rx: i, ry: n, fill: "none", stroke: "#000" }, s.type = "ellipse", v(a, s.attrs), s;
						}, t._engine.image = function (t, e, r, i, n, a) {
							var s = v("image");v(s, { x: r, y: i, width: n, height: a, preserveAspectRatio: "none" }), s.setAttributeNS(p, "href", e), t.canvas && t.canvas.appendChild(s);var o = new T(s, t);return o.attrs = { x: r, y: i, width: n, height: a, src: e }, o.type = "image", o;
						}, t._engine.text = function (e, r, i, n) {
							var a = v("text");e.canvas && e.canvas.appendChild(a);var s = new T(a, e);return s.attrs = { x: r, y: i, "text-anchor": "middle", text: n, "font-family": t._availableAttrs["font-family"], "font-size": t._availableAttrs["font-size"], stroke: "none", fill: "#000" }, s.type = "text", B(s, s.attrs), s;
						}, t._engine.setSize = function (t, e) {
							return this.width = t || this.width, this.height = e || this.height, this.canvas.setAttribute("width", this.width), this.canvas.setAttribute("height", this.height), this._viewBox && this.setViewBox.apply(this, this._viewBox), this;
						}, t._engine.create = function () {
							var e = t._getContainer.apply(0, arguments),
							    r = e && e.container,
							    i = e.x,
							    n = e.y,
							    a = e.width,
							    s = e.height;if (!r) throw new Error("SVG container not found.");var o = v("svg"),
							    l = "overflow:hidden;",
							    h;return i = i || 0, n = n || 0, a = a || 512, s = s || 342, v(o, { height: s, version: 1.1, width: a, xmlns: "http://www.w3.org/2000/svg", "xmlns:xlink": "http://www.w3.org/1999/xlink" }), 1 == r ? (o.style.cssText = l + "position:absolute;left:" + i + "px;top:" + n + "px", t._g.doc.body.appendChild(o), h = 1) : (o.style.cssText = l + "position:relative", r.firstChild ? r.insertBefore(o, r.firstChild) : r.appendChild(o)), r = new t._Paper(), r.width = a, r.height = s, r.canvas = o, r.clear(), r._left = r._top = 0, h && (r.renderfix = function () {}), r.renderfix(), r;
						}, t._engine.setViewBox = function (t, e, r, i, n) {
							u("raphael.setViewBox", this, this._viewBox, [t, e, r, i, n]);var a = this.getSize(),
							    o = s(r / a.width, i / a.height),
							    l = this.top,
							    h = n ? "xMidYMid meet" : "xMinYMin",
							    c,
							    p;for (null == t ? (this._vbSize && (o = 1), delete this._vbSize, c = "0 0 " + this.width + f + this.height) : (this._vbSize = o, c = t + f + e + f + r + f + i), v(this.canvas, { viewBox: c, preserveAspectRatio: h }); o && l;) p = "stroke-width" in l.attrs ? l.attrs["stroke-width"] : 1, l.attr({ "stroke-width": p }), l._.dirty = 1, l._.dirtyT = 1, l = l.prev;return this._viewBox = [t, e, r, i, !!n], this;
						}, t.prototype.renderfix = function () {
							var t = this.canvas,
							    e = t.style,
							    r;try {
								r = t.getScreenCTM() || t.createSVGMatrix();
							} catch (i) {
								r = t.createSVGMatrix();
							}var n = -r.e % 1,
							    a = -r.f % 1;(n || a) && (n && (this._left = (this._left + n) % 1, e.left = this._left + "px"), a && (this._top = (this._top + a) % 1, e.top = this._top + "px"));
						}, t.prototype.clear = function () {
							t.eve("raphael.clear", this);for (var e = this.canvas; e.firstChild;) e.removeChild(e.firstChild);this.bottom = this.top = null, (this.desc = v("desc")).appendChild(t._g.doc.createTextNode("Created with Raphaël " + t.version)), e.appendChild(this.desc), e.appendChild(this.defs = v("defs"));
						}, t.prototype.remove = function () {
							u("raphael.remove", this), this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);for (var e in this) this[e] = "function" == typeof this[e] ? t._removedFactory(e) : null;
						};var M = t.st;for (var N in E) E[e](N) && !M[e](N) && (M[N] = function (t) {
							return function () {
								var e = arguments;return this.forEach(function (r) {
									r[t].apply(r, e);
								});
							};
						}(N));
					}
				}.apply(e, i), !(void 0 !== n && (t.exports = n));
			}, function (t, e, r) {
				var i, n;i = [r(1)], n = function (t) {
					if (!t || t.vml) {
						var e = "hasOwnProperty",
						    r = String,
						    i = parseFloat,
						    n = Math,
						    a = n.round,
						    s = n.max,
						    o = n.min,
						    l = n.abs,
						    h = "fill",
						    u = /[, ]+/,
						    c = t.eve,
						    f = " progid:DXImageTransform.Microsoft",
						    p = " ",
						    d = "",
						    g = { M: "m", L: "l", C: "c", Z: "x", m: "t", l: "r", c: "v", z: "x" },
						    v = /([clmz]),?([^clmz]*)/gi,
						    x = / progid:\S+Blur\([^\)]+\)/g,
						    y = /-?[^,\s-]+/g,
						    m = "position:absolute;left:0;top:0;width:1px;height:1px;behavior:url(#default#VML)",
						    b = 21600,
						    _ = { path: 1, rect: 1, image: 1 },
						    w = { circle: 1, ellipse: 1 },
						    k = function (e) {
							var i = /[ahqstv]/gi,
							    n = t._pathToAbsolute;if (r(e).match(i) && (n = t._path2curve), i = /[clmz]/g, n == t._pathToAbsolute && !r(e).match(i)) {
								var s = r(e).replace(v, function (t, e, r) {
									var i = [],
									    n = "m" == e.toLowerCase(),
									    s = g[e];return r.replace(y, function (t) {
										n && 2 == i.length && (s += i + g["m" == e ? "l" : "L"], i = []), i.push(a(t * b));
									}), s + i;
								});return s;
							}var o = n(e),
							    l,
							    h;s = [];for (var u = 0, c = o.length; u < c; u++) {
								l = o[u], h = o[u][0].toLowerCase(), "z" == h && (h = "x");for (var f = 1, x = l.length; f < x; f++) h += a(l[f] * b) + (f != x - 1 ? "," : d);s.push(h);
							}return s.join(p);
						},
						    B = function (e, r, i) {
							var n = t.matrix();return n.rotate(-e, .5, .5), { dx: n.x(r, i), dy: n.y(r, i) };
						},
						    C = function (t, e, r, i, n, a) {
							var s = t._,
							    o = t.matrix,
							    u = s.fillpos,
							    c = t.node,
							    f = c.style,
							    d = 1,
							    g = "",
							    v,
							    x = b / e,
							    y = b / r;if (f.visibility = "hidden", e && r) {
								if (c.coordsize = l(x) + p + l(y), f.rotation = a * (e * r < 0 ? -1 : 1), a) {
									var m = B(a, i, n);i = m.dx, n = m.dy;
								}if (e < 0 && (g += "x"), r < 0 && (g += " y") && (d = -1), f.flip = g, c.coordorigin = i * -x + p + n * -y, u || s.fillsize) {
									var _ = c.getElementsByTagName(h);_ = _ && _[0], c.removeChild(_), u && (m = B(a, o.x(u[0], u[1]), o.y(u[0], u[1])), _.position = m.dx * d + p + m.dy * d), s.fillsize && (_.size = s.fillsize[0] * l(e) + p + s.fillsize[1] * l(r)), c.appendChild(_);
								}f.visibility = "visible";
							}
						};t.toString = function () {
							return "Your browser doesn’t support SVG. Falling down to VML.\nYou are running Raphaël " + this.version;
						};var S = function (t, e, i) {
							for (var n = r(e).toLowerCase().split("-"), a = i ? "end" : "start", s = n.length, o = "classic", l = "medium", h = "medium"; s--;) switch (n[s]) {case "block":case "classic":case "oval":case "diamond":case "open":case "none":
									o = n[s];break;case "wide":case "narrow":
									h = n[s];break;case "long":case "short":
									l = n[s];}var u = t.node.getElementsByTagName("stroke")[0];u[a + "arrow"] = o, u[a + "arrowlength"] = l, u[a + "arrowwidth"] = h;
						},
						    A = function (n, l) {
							n.attrs = n.attrs || {};var c = n.node,
							    f = n.attrs,
							    g = c.style,
							    v,
							    x = _[n.type] && (l.x != f.x || l.y != f.y || l.width != f.width || l.height != f.height || l.cx != f.cx || l.cy != f.cy || l.rx != f.rx || l.ry != f.ry || l.r != f.r),
							    y = w[n.type] && (f.cx != l.cx || f.cy != l.cy || f.r != l.r || f.rx != l.rx || f.ry != l.ry),
							    m = n;for (var B in l) l[e](B) && (f[B] = l[B]);if (x && (f.path = t._getPath[n.type](n), n._.dirty = 1), l.href && (c.href = l.href), l.title && (c.title = l.title), l.target && (c.target = l.target), l.cursor && (g.cursor = l.cursor), "blur" in l && n.blur(l.blur), (l.path && "path" == n.type || x) && (c.path = k(~r(f.path).toLowerCase().indexOf("r") ? t._pathToAbsolute(f.path) : f.path), n._.dirty = 1, "image" == n.type && (n._.fillpos = [f.x, f.y], n._.fillsize = [f.width, f.height], C(n, 1, 1, 0, 0, 0))), "transform" in l && n.transform(l.transform), y) {
								var A = +f.cx,
								    E = +f.cy,
								    M = +f.rx || +f.r || 0,
								    L = +f.ry || +f.r || 0;c.path = t.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x", a((A - M) * b), a((E - L) * b), a((A + M) * b), a((E + L) * b), a(A * b)), n._.dirty = 1;
							}if ("clip-rect" in l) {
								var z = r(l["clip-rect"]).split(u);if (4 == z.length) {
									z[2] = +z[2] + +z[0], z[3] = +z[3] + +z[1];var P = c.clipRect || t._g.doc.createElement("div"),
									    F = P.style;F.clip = t.format("rect({1}px {2}px {3}px {0}px)", z), c.clipRect || (F.position = "absolute", F.top = 0, F.left = 0, F.width = n.paper.width + "px", F.height = n.paper.height + "px", c.parentNode.insertBefore(P, c), P.appendChild(c), c.clipRect = P);
								}l["clip-rect"] || c.clipRect && (c.clipRect.style.clip = "auto");
							}if (n.textpath) {
								var R = n.textpath.style;l.font && (R.font = l.font), l["font-family"] && (R.fontFamily = '"' + l["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g, d) + '"'), l["font-size"] && (R.fontSize = l["font-size"]), l["font-weight"] && (R.fontWeight = l["font-weight"]), l["font-style"] && (R.fontStyle = l["font-style"]);
							}if ("arrow-start" in l && S(m, l["arrow-start"]), "arrow-end" in l && S(m, l["arrow-end"], 1), null != l.opacity || null != l.fill || null != l.src || null != l.stroke || null != l["stroke-width"] || null != l["stroke-opacity"] || null != l["fill-opacity"] || null != l["stroke-dasharray"] || null != l["stroke-miterlimit"] || null != l["stroke-linejoin"] || null != l["stroke-linecap"]) {
								var j = c.getElementsByTagName(h),
								    I = !1;if (j = j && j[0], !j && (I = j = N(h)), "image" == n.type && l.src && (j.src = l.src), l.fill && (j.on = !0), null != j.on && "none" != l.fill && null !== l.fill || (j.on = !1), j.on && l.fill) {
									var q = r(l.fill).match(t._ISURL);if (q) {
										j.parentNode == c && c.removeChild(j), j.rotate = !0, j.src = q[1], j.type = "tile";var D = n.getBBox(1);j.position = D.x + p + D.y, n._.fillpos = [D.x, D.y], t._preload(q[1], function () {
											n._.fillsize = [this.offsetWidth, this.offsetHeight];
										});
									} else j.color = t.getRGB(l.fill).hex, j.src = d, j.type = "solid", t.getRGB(l.fill).error && (m.type in { circle: 1, ellipse: 1 } || "r" != r(l.fill).charAt()) && T(m, l.fill, j) && (f.fill = "none", f.gradient = l.fill, j.rotate = !1);
								}if ("fill-opacity" in l || "opacity" in l) {
									var V = ((+f["fill-opacity"] + 1 || 2) - 1) * ((+f.opacity + 1 || 2) - 1) * ((+t.getRGB(l.fill).o + 1 || 2) - 1);V = o(s(V, 0), 1), j.opacity = V, j.src && (j.color = "none");
								}c.appendChild(j);var O = c.getElementsByTagName("stroke") && c.getElementsByTagName("stroke")[0],
								    Y = !1;!O && (Y = O = N("stroke")), (l.stroke && "none" != l.stroke || l["stroke-width"] || null != l["stroke-opacity"] || l["stroke-dasharray"] || l["stroke-miterlimit"] || l["stroke-linejoin"] || l["stroke-linecap"]) && (O.on = !0), ("none" == l.stroke || null === l.stroke || null == O.on || 0 == l.stroke || 0 == l["stroke-width"]) && (O.on = !1);var W = t.getRGB(l.stroke);O.on && l.stroke && (O.color = W.hex), V = ((+f["stroke-opacity"] + 1 || 2) - 1) * ((+f.opacity + 1 || 2) - 1) * ((+W.o + 1 || 2) - 1);var G = .75 * (i(l["stroke-width"]) || 1);if (V = o(s(V, 0), 1), null == l["stroke-width"] && (G = f["stroke-width"]), l["stroke-width"] && (O.weight = G), G && G < 1 && (V *= G) && (O.weight = 1), O.opacity = V, l["stroke-linejoin"] && (O.joinstyle = l["stroke-linejoin"] || "miter"), O.miterlimit = l["stroke-miterlimit"] || 8, l["stroke-linecap"] && (O.endcap = "butt" == l["stroke-linecap"] ? "flat" : "square" == l["stroke-linecap"] ? "square" : "round"), "stroke-dasharray" in l) {
									var H = { "-": "shortdash", ".": "shortdot", "-.": "shortdashdot", "-..": "shortdashdotdot", ". ": "dot", "- ": "dash", "--": "longdash", "- .": "dashdot", "--.": "longdashdot", "--..": "longdashdotdot" };O.dashstyle = H[e](l["stroke-dasharray"]) ? H[l["stroke-dasharray"]] : d;
								}Y && c.appendChild(O);
							}if ("text" == m.type) {
								m.paper.canvas.style.display = d;var X = m.paper.span,
								    U = 100,
								    $ = f.font && f.font.match(/\d+(?:\.\d*)?(?=px)/);g = X.style, f.font && (g.font = f.font), f["font-family"] && (g.fontFamily = f["font-family"]), f["font-weight"] && (g.fontWeight = f["font-weight"]), f["font-style"] && (g.fontStyle = f["font-style"]), $ = i(f["font-size"] || $ && $[0]) || 10, g.fontSize = $ * U + "px", m.textpath.string && (X.innerHTML = r(m.textpath.string).replace(/</g, "&#60;").replace(/&/g, "&#38;").replace(/\n/g, "<br>"));var Z = X.getBoundingClientRect();m.W = f.w = (Z.right - Z.left) / U, m.H = f.h = (Z.bottom - Z.top) / U, m.X = f.x, m.Y = f.y + m.H / 2, ("x" in l || "y" in l) && (m.path.v = t.format("m{0},{1}l{2},{1}", a(f.x * b), a(f.y * b), a(f.x * b) + 1));for (var Q = ["x", "y", "text", "font", "font-family", "font-weight", "font-style", "font-size"], J = 0, K = Q.length; J < K; J++) if (Q[J] in l) {
									m._.dirty = 1;break;
								}switch (f["text-anchor"]) {case "start":
										m.textpath.style["v-text-align"] = "left", m.bbx = m.W / 2;break;case "end":
										m.textpath.style["v-text-align"] = "right", m.bbx = -m.W / 2;break;default:
										m.textpath.style["v-text-align"] = "center", m.bbx = 0;}m.textpath.style["v-text-kern"] = !0;
							}
						},
						    T = function (e, a, s) {
							e.attrs = e.attrs || {};var o = e.attrs,
							    l = Math.pow,
							    h,
							    u,
							    c = "linear",
							    f = ".5 .5";if (e.attrs.gradient = a, a = r(a).replace(t._radial_gradient, function (t, e, r) {
								return c = "radial", e && r && (e = i(e), r = i(r), l(e - .5, 2) + l(r - .5, 2) > .25 && (r = n.sqrt(.25 - l(e - .5, 2)) * (2 * (r > .5) - 1) + .5), f = e + p + r), d;
							}), a = a.split(/\s*\-\s*/), "linear" == c) {
								var g = a.shift();if (g = -i(g), isNaN(g)) return null;
							}var v = t._parseDots(a);if (!v) return null;if (e = e.shape || e.node, v.length) {
								e.removeChild(s), s.on = !0, s.method = "none", s.color = v[0].color, s.color2 = v[v.length - 1].color;for (var x = [], y = 0, m = v.length; y < m; y++) v[y].offset && x.push(v[y].offset + p + v[y].color);s.colors = x.length ? x.join() : "0% " + s.color, "radial" == c ? (s.type = "gradientTitle", s.focus = "100%", s.focussize = "0 0", s.focusposition = f, s.angle = 0) : (s.type = "gradient", s.angle = (270 - g) % 360), e.appendChild(s);
							}return 1;
						},
						    E = function (e, r) {
							this[0] = this.node = e, e.raphael = !0, this.id = t._oid++, e.raphaelid = this.id, this.X = 0, this.Y = 0, this.attrs = {}, this.paper = r, this.matrix = t.matrix(), this._ = { transform: [], sx: 1, sy: 1, dx: 0, dy: 0, deg: 0, dirty: 1, dirtyT: 1 }, !r.bottom && (r.bottom = this), this.prev = r.top, r.top && (r.top.next = this), r.top = this, this.next = null;
						},
						    M = t.el;E.prototype = M, M.constructor = E, M.transform = function (e) {
							if (null == e) return this._.transform;var i = this.paper._viewBoxShift,
							    n = i ? "s" + [i.scale, i.scale] + "-1-1t" + [i.dx, i.dy] : d,
							    a;i && (a = e = r(e).replace(/\.{3}|\u2026/g, this._.transform || d)), t._extractTransform(this, n + e);var s = this.matrix.clone(),
							    o = this.skew,
							    l = this.node,
							    h,
							    u = ~r(this.attrs.fill).indexOf("-"),
							    c = !r(this.attrs.fill).indexOf("url(");if (s.translate(1, 1), c || u || "image" == this.type) {
								if (o.matrix = "1 0 0 1", o.offset = "0 0", h = s.split(), u && h.noRotation || !h.isSimple) {
									l.style.filter = s.toFilter();var f = this.getBBox(),
									    g = this.getBBox(1),
									    v = f.x - g.x,
									    x = f.y - g.y;l.coordorigin = v * -b + p + x * -b, C(this, 1, 1, v, x, 0);
								} else l.style.filter = d, C(this, h.scalex, h.scaley, h.dx, h.dy, h.rotate);
							} else l.style.filter = d, o.matrix = r(s), o.offset = s.offset();return null !== a && (this._.transform = a, t._extractTransform(this, a)), this;
						}, M.rotate = function (t, e, n) {
							if (this.removed) return this;if (null != t) {
								if (t = r(t).split(u), t.length - 1 && (e = i(t[1]), n = i(t[2])), t = i(t[0]), null == n && (e = n), null == e || null == n) {
									var a = this.getBBox(1);e = a.x + a.width / 2, n = a.y + a.height / 2;
								}return this._.dirtyT = 1, this.transform(this._.transform.concat([["r", t, e, n]])), this;
							}
						}, M.translate = function (t, e) {
							return this.removed ? this : (t = r(t).split(u), t.length - 1 && (e = i(t[1])), t = i(t[0]) || 0, e = +e || 0, this._.bbox && (this._.bbox.x += t, this._.bbox.y += e), this.transform(this._.transform.concat([["t", t, e]])), this);
						}, M.scale = function (t, e, n, a) {
							if (this.removed) return this;if (t = r(t).split(u), t.length - 1 && (e = i(t[1]), n = i(t[2]), a = i(t[3]), isNaN(n) && (n = null), isNaN(a) && (a = null)), t = i(t[0]), null == e && (e = t), null == a && (n = a), null == n || null == a) var s = this.getBBox(1);return n = null == n ? s.x + s.width / 2 : n, a = null == a ? s.y + s.height / 2 : a, this.transform(this._.transform.concat([["s", t, e, n, a]])), this._.dirtyT = 1, this;
						}, M.hide = function () {
							return !this.removed && (this.node.style.display = "none"), this;
						}, M.show = function () {
							return !this.removed && (this.node.style.display = d), this;
						}, M.auxGetBBox = t.el.getBBox, M.getBBox = function () {
							var t = this.auxGetBBox();if (this.paper && this.paper._viewBoxShift) {
								var e = {},
								    r = 1 / this.paper._viewBoxShift.scale;return e.x = t.x - this.paper._viewBoxShift.dx, e.x *= r, e.y = t.y - this.paper._viewBoxShift.dy, e.y *= r, e.width = t.width * r, e.height = t.height * r, e.x2 = e.x + e.width, e.y2 = e.y + e.height, e;
							}return t;
						}, M._getBBox = function () {
							return this.removed ? {} : { x: this.X + (this.bbx || 0) - this.W / 2, y: this.Y - this.H, width: this.W, height: this.H };
						}, M.remove = function () {
							if (!this.removed && this.node.parentNode) {
								this.paper.__set__ && this.paper.__set__.exclude(this), t.eve.unbind("raphael.*.*." + this.id), t._tear(this, this.paper), this.node.parentNode.removeChild(this.node), this.shape && this.shape.parentNode.removeChild(this.shape);for (var e in this) this[e] = "function" == typeof this[e] ? t._removedFactory(e) : null;this.removed = !0;
							}
						}, M.attr = function (r, i) {
							if (this.removed) return this;if (null == r) {
								var n = {};for (var a in this.attrs) this.attrs[e](a) && (n[a] = this.attrs[a]);return n.gradient && "none" == n.fill && (n.fill = n.gradient) && delete n.gradient, n.transform = this._.transform, n;
							}if (null == i && t.is(r, "string")) {
								if (r == h && "none" == this.attrs.fill && this.attrs.gradient) return this.attrs.gradient;for (var s = r.split(u), o = {}, l = 0, f = s.length; l < f; l++) r = s[l], r in this.attrs ? o[r] = this.attrs[r] : t.is(this.paper.customAttributes[r], "function") ? o[r] = this.paper.customAttributes[r].def : o[r] = t._availableAttrs[r];return f - 1 ? o : o[s[0]];
							}if (this.attrs && null == i && t.is(r, "array")) {
								for (o = {}, l = 0, f = r.length; l < f; l++) o[r[l]] = this.attr(r[l]);return o;
							}var p;null != i && (p = {}, p[r] = i), null == i && t.is(r, "object") && (p = r);for (var d in p) c("raphael.attr." + d + "." + this.id, this, p[d]);if (p) {
								for (d in this.paper.customAttributes) if (this.paper.customAttributes[e](d) && p[e](d) && t.is(this.paper.customAttributes[d], "function")) {
									var g = this.paper.customAttributes[d].apply(this, [].concat(p[d]));this.attrs[d] = p[d];for (var v in g) g[e](v) && (p[v] = g[v]);
								}p.text && "text" == this.type && (this.textpath.string = p.text), A(this, p);
							}return this;
						}, M.toFront = function () {
							return !this.removed && this.node.parentNode.appendChild(this.node), this.paper && this.paper.top != this && t._tofront(this, this.paper), this;
						}, M.toBack = function () {
							return this.removed ? this : (this.node.parentNode.firstChild != this.node && (this.node.parentNode.insertBefore(this.node, this.node.parentNode.firstChild), t._toback(this, this.paper)), this);
						}, M.insertAfter = function (e) {
							return this.removed ? this : (e.constructor == t.st.constructor && (e = e[e.length - 1]), e.node.nextSibling ? e.node.parentNode.insertBefore(this.node, e.node.nextSibling) : e.node.parentNode.appendChild(this.node), t._insertafter(this, e, this.paper), this);
						}, M.insertBefore = function (e) {
							return this.removed ? this : (e.constructor == t.st.constructor && (e = e[0]), e.node.parentNode.insertBefore(this.node, e.node), t._insertbefore(this, e, this.paper), this);
						}, M.blur = function (e) {
							var r = this.node.runtimeStyle,
							    i = r.filter;return i = i.replace(x, d), 0 !== +e ? (this.attrs.blur = e, r.filter = i + p + f + ".Blur(pixelradius=" + (+e || 1.5) + ")", r.margin = t.format("-{0}px 0 0 -{0}px", a(+e || 1.5))) : (r.filter = i, r.margin = 0, delete this.attrs.blur), this;
						}, t._engine.path = function (t, e) {
							var r = N("shape");r.style.cssText = m, r.coordsize = b + p + b, r.coordorigin = e.coordorigin;var i = new E(r, e),
							    n = { fill: "none", stroke: "#000" };t && (n.path = t), i.type = "path", i.path = [], i.Path = d, A(i, n), e.canvas && e.canvas.appendChild(r);var a = N("skew");return a.on = !0, r.appendChild(a), i.skew = a, i.transform(d), i;
						}, t._engine.rect = function (e, r, i, n, a, s) {
							var o = t._rectPath(r, i, n, a, s),
							    l = e.path(o),
							    h = l.attrs;return l.X = h.x = r, l.Y = h.y = i, l.W = h.width = n, l.H = h.height = a, h.r = s, h.path = o, l.type = "rect", l;
						}, t._engine.ellipse = function (t, e, r, i, n) {
							var a = t.path(),
							    s = a.attrs;return a.X = e - i, a.Y = r - n, a.W = 2 * i, a.H = 2 * n, a.type = "ellipse", A(a, { cx: e, cy: r, rx: i, ry: n }), a;
						}, t._engine.circle = function (t, e, r, i) {
							var n = t.path(),
							    a = n.attrs;return n.X = e - i, n.Y = r - i, n.W = n.H = 2 * i, n.type = "circle", A(n, { cx: e, cy: r, r: i }), n;
						}, t._engine.image = function (e, r, i, n, a, s) {
							var o = t._rectPath(i, n, a, s),
							    l = e.path(o).attr({ stroke: "none" }),
							    u = l.attrs,
							    c = l.node,
							    f = c.getElementsByTagName(h)[0];return u.src = r, l.X = u.x = i, l.Y = u.y = n, l.W = u.width = a, l.H = u.height = s, u.path = o, l.type = "image", f.parentNode == c && c.removeChild(f), f.rotate = !0, f.src = r, f.type = "tile", l._.fillpos = [i, n], l._.fillsize = [a, s], c.appendChild(f), C(l, 1, 1, 0, 0, 0), l;
						}, t._engine.text = function (e, i, n, s) {
							var o = N("shape"),
							    l = N("path"),
							    h = N("textpath");i = i || 0, n = n || 0, s = s || "", l.v = t.format("m{0},{1}l{2},{1}", a(i * b), a(n * b), a(i * b) + 1), l.textpathok = !0, h.string = r(s), h.on = !0, o.style.cssText = m, o.coordsize = b + p + b, o.coordorigin = "0 0";var u = new E(o, e),
							    c = { fill: "#000", stroke: "none", font: t._availableAttrs.font, text: s };u.shape = o, u.path = l, u.textpath = h, u.type = "text", u.attrs.text = r(s), u.attrs.x = i, u.attrs.y = n, u.attrs.w = 1, u.attrs.h = 1, A(u, c), o.appendChild(h), o.appendChild(l), e.canvas.appendChild(o);var f = N("skew");return f.on = !0, o.appendChild(f), u.skew = f, u.transform(d), u;
						}, t._engine.setSize = function (e, r) {
							var i = this.canvas.style;return this.width = e, this.height = r, e == +e && (e += "px"), r == +r && (r += "px"), i.width = e, i.height = r, i.clip = "rect(0 " + e + " " + r + " 0)", this._viewBox && t._engine.setViewBox.apply(this, this._viewBox), this;
						}, t._engine.setViewBox = function (e, r, i, n, a) {
							t.eve("raphael.setViewBox", this, this._viewBox, [e, r, i, n, a]);var s = this.getSize(),
							    o = s.width,
							    l = s.height,
							    h,
							    u;return a && (h = l / n, u = o / i, i * h < o && (e -= (o - i * h) / 2 / h), n * u < l && (r -= (l - n * u) / 2 / u)), this._viewBox = [e, r, i, n, !!a], this._viewBoxShift = { dx: -e, dy: -r, scale: s }, this.forEach(function (t) {
								t.transform("...");
							}), this;
						};var N;t._engine.initWin = function (t) {
							var e = t.document;e.styleSheets.length < 31 ? e.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)") : e.styleSheets[0].addRule(".rvml", "behavior:url(#default#VML)");try {
								!e.namespaces.rvml && e.namespaces.add("rvml", "urn:schemas-microsoft-com:vml"), N = function (t) {
									return e.createElement("<rvml:" + t + ' class="rvml">');
								};
							} catch (r) {
								N = function (t) {
									return e.createElement("<" + t + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
								};
							}
						}, t._engine.initWin(t._g.win), t._engine.create = function () {
							var e = t._getContainer.apply(0, arguments),
							    r = e.container,
							    i = e.height,
							    n,
							    a = e.width,
							    s = e.x,
							    o = e.y;if (!r) throw new Error("VML container not found.");var l = new t._Paper(),
							    h = l.canvas = t._g.doc.createElement("div"),
							    u = h.style;return s = s || 0, o = o || 0, a = a || 512, i = i || 342, l.width = a, l.height = i, a == +a && (a += "px"), i == +i && (i += "px"), l.coordsize = 1e3 * b + p + 1e3 * b, l.coordorigin = "0 0", l.span = t._g.doc.createElement("span"), l.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;", h.appendChild(l.span), u.cssText = t.format("top:0;left:0;width:{0};height:{1};display:inline-block;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden", a, i), 1 == r ? (t._g.doc.body.appendChild(h), u.left = s + "px", u.top = o + "px", u.position = "absolute") : r.firstChild ? r.insertBefore(h, r.firstChild) : r.appendChild(h), l.renderfix = function () {}, l;
						}, t.prototype.clear = function () {
							t.eve("raphael.clear", this), this.canvas.innerHTML = d, this.span = t._g.doc.createElement("span"), this.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;", this.canvas.appendChild(this.span), this.bottom = this.top = null;
						}, t.prototype.remove = function () {
							t.eve("raphael.remove", this), this.canvas.parentNode.removeChild(this.canvas);for (var e in this) this[e] = "function" == typeof this[e] ? t._removedFactory(e) : null;return !0;
						};var L = t.st;for (var z in M) M[e](z) && !L[e](z) && (L[z] = function (t) {
							return function () {
								var e = arguments;return this.forEach(function (r) {
									r[t].apply(r, e);
								});
							};
						}(z));
					}
				}.apply(e, i), !(void 0 !== n && (t.exports = n));
			}]);
		});
	}, {}], 5: [function (require, module, exports) {
		"use strict";

		/*var defaultSize = 3; //Dimensione indicatore città
  var plotType = "rounded"; //Tipo indicatore città
  var defaultStroke = 1; //Spessore linea di collegamento
  var defaultFactor = -0.15; //Curvatura linea di collegamento [- verso l'alto, + verso il basso]
  */

		module.exports = {
			//Gioco
			'MAX_LEVEL': 9,
			'LANGUAGE': 'it', //ISO 639-2 https://www.loc.gov/standards/iso639-2/php/code_list.php

			//Mappa - Area
			'DEFAULT_AREA_STROKE': "#7C7C7C", //Colore confini
			'DEFAULT_AREA_STROKE_WIDTH': 0.2, //Spessore confini

			'MAP_H': 180,
			'MAP_W': 360,

			//Mappa - Plot
			'DEFAULT_PLOT_SIZE': 3, //Dimensione indicatore città
			'DEFAULT_PLOT_TYPE': "rounded", //Tipo indicatore città
			'DEFAULT_PLOT_STROKE': 1, //Spessore linea di collegamento
			'DEFAULT_PLOT_FACTOR': -0.15, //Curvatura linea di collegamento [- verso l'alto, + verso il basso]
			'DEFAULT_PLOT_ICON': './assets/img/icon.png',
			'DEFAULT_PLOT_ICON_WIDTH': 4,
			'DEFAULT_PLOT_ICON_HEIGHT': 4,

			//Modal
			'MODAL_ID': '#myModal',
			'MODAL_TITLE_ID': '#modal-message-title',
			'MODAL_TEXT_ID': '#modal-message-text',
			'MODAL_BUTTONS_ID': '#modal-buttons',
			'MODAL_CLASS': 'modal-primary',

			//LEGENDA
			'LEGEND_MODE': 'horizontal',
			'LEGEND': [{ color: "#5BCA09", value: '0,1', text: 'Livello 1' }, { color: "#B5EC03", value: '2,3', text: 'Livello 2' }, { color: "#FF9C01", value: '2,3', text: 'Livello 3' }, { color: "#FE2701", value: '6,20', text: 'Livello 4' }],

			//IDs
			'PROGRESS_BAR_ID': '#progressinf',
			'PROGRESS_BALLS_ID': '#progress',
			'LOG_AREA_ID': '#log-area',
			'MAP_CONTAINER': '.map-container',
			'TURN_LOCATION': '#turnTitle',
			'TURN_GROUP_LOCATION': '#whoisplaying',
			'RESOURCES_LOCATION': '#resources-left',

			//Altro
			'PROGRESS_BALLS_STEP': 1,
			'RESOURCES_ICON': 'fa fa-tint',
			'DEBUG': true
		};
	}, {}], 6: [function (require, module, exports) {
		window.$ = window.jQuery = require('jquery');
		var jquerysvg = require('./lib/jquery.svg.min.js');
		var jquerysvganim = require('./lib/jquery.svganim.js');
		var l = require('./lang/Lang.js');
		var config = require('./Config.js');
		var lang = l[config['LANGUAGE']];
		var ModalDialog = require('./utils/ModalDialog.js');
		var MapUtils = require('./utils/MapUtils.js');
		var Utils = require('./utils/Utils.js');
		var PawnManager = require('./PawnManager.js');
		/**
   * Classe responsabile delle modifiche grafiche alla dashboard.
   */
		class Dashboard {
			/**
    * Costruttore. Inizializzo le variabili, imposto gli indicatori di contagio e mostro il modal in attesa dell'avvio dal server.
    * @return NA
    */
			constructor() {
				this.modal = new ModalDialog();
				this.map = new MapUtils();
				this.utils = new Utils();
				this.PawnMan = new PawnManager();
			}

			/*TEST DA RIMUOVERE*/

			testBasic() {
				this.setProgress(30);
				this.setLevel(+1);
				this.changeResources('gatti', 100);
				this.updateTurn('Mario');
			}
			test() {
				var self = this;
				var updatedOptions = { 'areas': {}, 'plots': {} };
				var vars = [];
				vars['Risorsa 1'] = 50;
				vars['Risorsa 2'] = 40;
				console.log(self.utils.__buildTooltip('Canada', vars));
				updatedOptions.areas['America2'] = {
					value: 3
				};
				updatedOptions.plots['canada'] = {
					type: 'image',
					url: './assets/img/icon.png',
					width: 8,
					height: 8,
					latitude: 70,
					longitude: 50,
					tooltip: self.utils.__buildTooltip('Canada', vars)
				};
				this.map.UpdateMap(updatedOptions, {}, {});
				this.map.MovePlayer('canada', 'usa');
			}

			/**
    * [initDashboard description]
    * @return {NA} 
    */
			initDashboard() {
				var self = this;
				$(document).ready(function () {
					//document.addEventListener("DOMContentLoaded", function(event) { 
					for (var i = 0; i < config['MAX_LEVEL']; i++) {
						$(config['PROGRESS_BALLS_ID']).append('<li id="layer' + (i + 1) + '" class="ball"></li>');
					}
					//self.showModal(lang['gamestart'],lang['oktostart']);
				});
			}

			initMap(a, p, l) {
				var self = this;
				$(".map-container").mapael({
					map: {
						name: "hazard_map",
						defaultArea: {
							attrs: {
								stroke: "#7C7C7C",
								"stroke-width": 0.2
							}
						}
					},
					//QUI DEFINISCO I COLORI DELLE AREE
					areas: a,
					legend: {
						area: {
							display: true,
							title: "Livello Infezione",
							mode: "horizontal",
							slices: [{
								max: 1,
								attrs: {
									fill: "#5BCA09"
								},
								label: "Livello 1"
							}, {
								min: 2,
								max: 3,
								attrs: {
									fill: "#B5EC03"
								},
								label: "Livello 2"
							}, {
								min: 4,
								max: 5,
								attrs: {
									fill: "#FF9C01"
								},
								label: "Livello 3"
							}, {
								min: 6,
								attrs: {
									fill: "#FE2701"
								},
								label: "Livello 4"
							}]
						}
					},
					//QUI DEFINISCO LE CITTA'
					plots: p,
					links: l
				});
			}

			/**
    * Imposta o sposta una pedina
    * @param {Object} group    [Identificatore di gruppo e colore]
    * @param {String} location [Stringa che identifica univocamente una zona di destinazione]
    * @param {Object} position [Posizione x,y sulla mappa, l'oggetto ha due proprietà: top e left]
    */
			setPawn(group, location, position) {
				position = this.utils.getRealCoords(position);
				this.PawnMan.movePawn(group, location, position);
			}

			/**
    * Imposta un HQ per un gruppo contrassegnato dal colore color
    * @param {[type]} location [description]
    * @param {[type]} color    [description]
    */
			setHQ(location, color) {
				$('#hq-left').append(`<li>
        <div class="input-color">
            <span>` + location + `</span>
            <div class="color-box" style="background-color: ` + color + `;"></div>
        </div>
    	</li>`);
			}

			/**
    * Imposta la legenda dei colori dei gruppi
    * @param {[type]} name  [description]
    * @param {[type]} color [description]
    */
			setGroupLegend(name, color) {
				$('#groups-left').append(`<li>
        <div class="input-color">
            <span>` + name + `</span>
            <div class="color-box" style="background-color: ` + color + `;"></div>
        </div>
    	</li>`);
			}

			/**
    * Aggiorna il tooltip in caso di eliminazione o modifica di una emergenza
    * @param  {String} area      [ID Univoco dell'area]
    * @param  {Object} emergency [Emergenze dell'area]
    * @return {NA}
    */
			updateEmergenciesTooltip(area, emergency) {
				$('#' + area + '-tooltiplist').replaceWith(this.utils.__buildTooltip(area, emergency));
			}

			chooseCardPopup(cardID) {
				this.modal.selectCard(cardID);
				this.hideModal(3000);
			}

			setActions(current, max) {
				$('#actions').html('Azioni Disponibili: ' + current + '/' + max);
			}

			/**
    * Imposta il valore della progress bar
    * @param {int} value "Valore della progress bar [0-100]"
    */
			setProgress(value) {
				$(config['PROGRESS_BAR_ID']).removeClass('progress-bar-success');
				$(config['PROGRESS_BAR_ID']).removeClass('progress-bar-warning');
				$(config['PROGRESS_BAR_ID']).removeClass('progress-bar-danger');
				if (value < 30) {
					var progressClass = 'progress-bar-success';
				} else if (value >= 30 && value <= 60) {
					var progressClass = 'progress-bar-warning';
				} else {
					var progressClass = 'progress-bar-danger';
				}
				$(config['PROGRESS_BAR_ID']).attr('aria-valuenow', value).css('width', value + '%');
				$(config['PROGRESS_BAR_ID']).addClass(progressClass);
				$(config['PROGRESS_BAR_ID']).html(value + '%');
			}

			/**
    * Imposta il livello di contagio, assegna un colore e visualizza il tutto.
    * I sottogruppi di diverso colore sono calcolati in automatico.
    * @param {int} value [Valore positivo indica un aumento, negativo una diminuzione. Per aumentare o diminuire di più di uno step chiamare più volte la funzione]
    */
			setLevel(value) {
				var current = parseInt($(config['PROGRESS_BALLS_ID']).attr('current'));
				if (value > 0) {
					if (current == config['MAX_LEVEL']) return;
					var currentLevelType = Math.ceil((current + 1) / 3);
					if (currentLevelType == 1 || current == 0) {
						var levelClass = 'ball-ok';
					} else if (currentLevelType == 2) {
						var levelClass = 'ball-warning';
					} else {
						var levelClass = 'ball-danger';
					}
					$('#layer' + (current + 1)).addClass(levelClass);
					current = current + 1;
					$(config['PROGRESS_BALLS_ID']).attr('current', current);
				} else {
					if (current == 0) return;
					var currentLevelType = Math.ceil(current / 3);
					if (currentLevelType == 1 || current == 0) {
						var levelClass = 'ball-ok';
					} else if (currentLevelType == 2) {
						var levelClass = 'ball-warning';
					} else {
						var levelClass = 'ball-danger';
					}
					$('#layer' + current).removeClass(levelClass);
					current = current - 1;
					$(config['PROGRESS_BALLS_ID']).attr('current', current);
				}
			}

			/**
    * Modifica le risorse visualizzate per l'area corrente
    * @param  {String} resource [Identificatore univoco della risorsa]
    * @param  {String} quantity [Quantità della risorsa]
    * @return NA       
    */
			changeResources(resource, quantity) {
				var item = $(config['RESOURCES_LOCATION']).find('#' + resource);
				if (item.length) {
					item.html(quantity);
				} else {
					$(config['RESOURCES_LOCATION']).append('<li><i class="' + config['RESOURCES_ICON'] + '" id="' + resource + '" aria-hidden="true" title="' + resource.capitalizeFirstLetter() + '"></i>' + resource.capitalizeFirstLetter() + ' : ' + quantity + '</li>');
				}
			}

			/**
    * Scrive un log
    * @param {String} type [Tipo di messaggio da mostrare, uno tra {DANGER, INFO, WARNING}]
    * @param {String} text [Testo del messaggio da mostrare]
    */

			addLog(type, text) {
				var d = new Date();
				var time = d.getHours() + ":" + d.getMinutes();
				var timestamp = d.getTime();
				switch (type.toUpperCase()) {
					case "DANGER":
						var class1 = "fa fa-exclamation-triangle";
						var color = "#DE2203";
						$(config['LOG_AREA_ID']).prepend("<p id='" + timestamp + "'><font class=\"text-muted\">[" + time + "] (" + lang['turn'] + " " + $('#turnTitle').attr('turn') + "): </font><i class='" + class1 + "' style='color:" + color + ";' aria-hidden='true'></i> " + text + "</p><hr class='style3'/>");
						break;
					case "INFO":
						var class1 = "fa fa-flag";
						var color = "#337AB7";
						$(config['LOG_AREA_ID']).prepend("<p id='" + timestamp + "'><font class=\"text-muted\">[" + time + "] (" + lang['turn'] + " " + $('#turnTitle').attr('turn') + "): </font><i class='" + class1 + "' style='color:" + color + ";' aria-hidden='true'></i> " + text + "</p><hr class='style3'/>");
						break;
					case "WARNING":
						var class1 = "fa fa-exclamation";
						var color = '#FEA500';
						$(config['LOG_AREA_ID']).prepend("<p id='" + timestamp + "'><font class=\"text-muted\">[" + time + "] (" + lang['turn'] + " " + $('#turnTitle').attr('turn') + "): </font><i class='" + class1 + "' style='color:" + color + ";' aria-hidden='true'></i> " + text + "</p><hr class='style3'/>");
						break;
				}

				/*Blink new log*/
				$('#' + timestamp).css('background-color', color);
				$('#' + timestamp).fadeTo(300, 0.3, function () {
					$(this).fadeTo(500, 1.0);
					$('#' + timestamp).css('background-color', 'transparent');
				});
			}

			/**
    * Passa al turno successivo, aumenta il numero visualizzato
    * @param {String} [who] [Nome del gruppo]
    * @return NA
    */
			updateTurn(who = null) {
				var turn = parseInt($(config['TURN_LOCATION']).attr('turn'));
				turn = turn + 1;
				$(config['TURN_LOCATION']).attr('turn', turn);
				$(config['TURN_LOCATION']).html(lang['turn'] + " " + turn);
				this.addLog('INFO', lang['turn_start'] + ' ' + turn);
				if (who) $(config['TURN_GROUP_LOCATION']).html(who);
			}

			/**
    * Mostra il modal, se è necessario modificarne il contenuto senza eliminarlo utilizzare updateModal(). Un solo modal alla volta è permesso.
    * TODO: Permettere la visualizzazione di un contenuto più significativo del semplice testo 
    * @param  {String} title   [Intestazione del modal]
    * @param  {String} content [Contenuto del modal]
    * @param  {String} clazz   [Classe css del modal, di default è utilizzato modal-primary]
    * @return NA
    */
			showModal(title, content, clazz) {
				if (this.modal.isVisible()) modal.hide();

				this.modal.setup(clazz);
				this.modal.setTitle(title);
				this.modal.setContent(content);
				this.modal.show();
			}

			/**
    * Nascondi il modal dopo {time} millisecondi
    * @param  {int} time [Tempo in millisecondi prima che il modal venga nascosto] 
    * @return NA
    */
			hideModal(time = 5000) {
				var self = this;
				setTimeout(function () {
					self.modal.hide();
				}, time);
			}

			/**
    * Blocca un collegamento (tratteggio)
    * @param {String} link [ID Univoco del collegamento]
    * @param {Boolean} enabled [True se il link è attraversabile, false altrimenti]
    * @param {Integer} time [Tempo in millisecondi prima che il link venga ricreato, default: 500]
    */
			CloseLink(link, enabled = true, time = 500) {
				var linkedPlots = link.split('.');
				var strokeStyle = enabled ? '-' : '--';
				var self = this;

				this.RemoveLink(link);

				setTimeout(function () {
					this.AddLink(linkedPlots[0], linkedPlots[1], strokeStyle);
				}, time);
			}

		}

		module.exports = Dashboard;
	}, { "./Config.js": 5, "./PawnManager.js": 9, "./lang/Lang.js": 10, "./lib/jquery.svg.min.js": 11, "./lib/jquery.svganim.js": 12, "./utils/MapUtils.js": 16, "./utils/ModalDialog.js": 17, "./utils/Utils.js": 18, "jquery": 3 }], 7: [function (require, module, exports) {
		window.$ = window.jQuery = require('jquery');
		var Raphael = require('raphael');
		require('jquery-mousewheel');
		var io = require('./lib/socket.io.min.js');
		var l = require('./lang/Lang.js');
		var config = require('./Config.js');
		var lang = l[config['LANGUAGE']];
		var ModalDialog = require('./utils/ModalDialog.js');
		var Utils = require('./utils/Utils.js');
		var MapUtils = require('./utils/MapUtils.js');
		var Dashboard = require('./Dashboard.js');
		var ParserXML = require('./lib/xml2json.min.js');
		var GameState = require('./utils/GameState.js');

		/**
   * @class Classe principale dell'applicazione
   * WARN: Non utilizzare JQuery nel costruttore
   */
		class HazardDashboard {

			/**
    * Inizializza le classi e imposta i socket in ascolto
    * @return NA
    */
			constructor() {

				String.prototype.capitalizeFirstLetter = function () {
					return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
				};

				Number.prototype.inRange = function (a, b) {
					return a < b ? this >= a && this <= b : this >= b && this <= a;
				};

				this.areas = {};
				this.plots = {};
				this.links = {};
				this.pawns = {};
				// Inizializzazione variabili di gioco
				this.cards = {};
				this.endGame = {};
				this.groups = {};
				this.locale = {};
				this.locations = {};
				this.resources = {};
				this.setup = {};
				this.strongholdinfos = {};
				this.turns = {};

				this.hazard = new Dashboard();
				this.parsing = new ParserXML();
				this.gameState = GameState;
				this.utils = new Utils();

				var self = this;
				//var socket = io.connect();
				var socket = io();

				console.log(socket);
				socket.on('welcome', function (data) {
					console.log(data);
					socket.emit('init_dashboard', data);
					self.gameStart('./strutturaxml.xml');
				});

				socket.on('update', function (data) {
					if (typeof data != `undefined`) {
						self.handleState(data);
						console.log(data);
					}
				});

				socket.on('popupMessage', function (data) {});

				socket.on('closePopup', function (data) {
					self.hazard.hideModal();
				});

				socket.on('chooseProductionCard', function (data) {
					if (typef(data) != `undefined` && typeof data.cardID != `undefined`) self.hazard.chooseCardPopup(data.cardID);
				});

				socket.on('init', function (data) {
					self.gameStart();
				});

				/*socket.on('parsingXML',function(data){
    	self.parseXML('test.xml',[self.hazard.initMap,self.placePawnsCallback]);	// DA RIVEDERE
    });*/

				socket.on('connection_error', function () {
					console.log("Waiting for connection ...");
				});
			}

			/**
    * Avvia il gioco eliminando la finestra modal
    * @return NA
    */
			gameStart(e) {
				var self = this;
				this.hazard.initDashboard();
				this.hazard.hideModal(3000);
				//this.hazard.updateTurn();
				//this.hazard.addLog('INFO',lang['gamestartstext']);
				var dummyStateCallback = this.initDummyState.bind(this);
				this.parseXML(e, [this.hazard.initMap, this.placePawnsCallback, dummyStateCallback]);
				if (config['DEBUG']) {
					$('#debug').show();
					$('#debug-confirm').click(function () {
						self.handleState($('#debug-text').val());
					});
				}
				//this.initDummyState();
			}

			/**
    * Avvisa che la partita è conclusa con un modal
    * @return NA
    */
			gameOver() {
				this.hazard.addLog('DANGER', lang['gameover']);
				this.hazard.showModal(lang['gameover'], lang['gameovertext'], 'modal-danger');
			}

			/**
    * Funzione di callback per posizionare le pedine, costruire la legenda e inserire gli HQ
    * @param  {[type]} groups [description]
    * @param  {[type]} plots  [description]
    * @param  {[type]} hazard [description]
    * @param  {[type]} utils  [description]
    * @return {[type]}        [description]
    */
			placePawnsCallback(groups, plots, areas, hazard, utils) {
				for (var key in groups) {
					var group = groups[key];
					hazard.setGroupLegend(key, group.color);
					for (var h in group.hq) {
						hazard.setHQ(utils.getDisplayedName(areas[group.hq[h]]), group.color);
					}
					if (group.type == 'actionGroup') {
						var position = {
							'top': plots[group.startingPoint + '-plot'].longitude,
							'left': plots[group.startingPoint + '-plot'].latitude
						};
						var groupObj = {};
						groupObj[key] = group.color;
						hazard.setPawn(groupObj, group.startingPoint, position);
					}
				}
			}

			initDummyState() {
				var dummyString = `{"state":{"gameState":{"currentState":"GAME_ACTIVE",
	 						"gameMap":{"locations":[],"pawns":[]},"blockades":[],"emergencies":[],
	 						"maxEmergencyLevel":5,"numOfProductionCards":1,"currentStrongholdCost":5,"contagionRatios":[]},
	 						"currentTurn":{"type":"Dummy","group":{"name":"Dummy","resources":[]},"numActions":0,"maxNumActions":0}},"response": { "success": "true", "logString": "` + lang['gamestartstext'] + `" }}`;
				var dummyState = JSON.parse(dummyString);
				for (var id in this.areas) {
					var l = {};
					l['name'] = id;
					l['locationID'] = 'it.uniba.hazard.engine.map.Location_' + id;
					l['emergencyLevels'] = [];
					for (var em in this.areas[id].emergencies) {
						var e = {};
						e['emergency'] = em;
						e['level'] = this.areas[id].emergencies[em];
						l['emergencyLevels'].push(e);
					}
					dummyState.state.gameState.gameMap.locations.push(l);
				}

				for (var g in this.groups) {
					var pawn = {};
					pawn['pawnID'] = 'it.uniba.hazard.engine.pawns.' + this.groups[g].type + '_' + g;
					pawn['type'] = this.groups[g].type;
					pawn['location'] = this.groups[g].startingPoint;
					pawn['group'] = g;
					dummyState.state.gameState.gameMap.pawns.push(pawn);
				}
				this.gameState.setState(dummyState.state);
				console.log('Dummy State: ' + JSON.stringify(dummyState));
			}

			/**
    * Esegue il parsing del file XML di configurazione
    * @return {NA}
    */
			parseXML(path, callback) {
				var self = this;
				// Load the xml file using ajax 
				$.ajax({
					type: "GET",
					url: path,
					dataType: "text",
					success: function (xml) {
						// Parsing
						var json = self.parsing.xml_str2json(xml);
						var dummyState = {};

						if (typeof json == 'undefined') return;

						//ciclo le l'xml di setup gioco
						self.cards = json.xml.game.cards;
						self.endGame = json.xml.game.endGame;
						//self.groups = json.xml.game.groups;
						self.locale = json.xml.game.locale;
						self.locations = json.xml.game.map.area.location;

						for (var j = 0; j < self.locations.length; j++) {
							self.areas[self.locations[j].name] = {};
							self.areas[self.locations[j].name].name = self.locations[j].name;
							self.areas[self.locations[j].name].emergencies = {};
							self.areas[self.locations[j].name].value = 1;

							self.plots[self.locations[j].name + '-plot'] = {};
							self.plots[self.locations[j].name + '-plot'].type = config['DEFAULT_PLOT_TYPE'];
							self.plots[self.locations[j].name + '-plot'].size = config['DEFAULT_PLOT_SIZE'];
							self.plots[self.locations[j].name + '-plot'].latitude = self.locations[j].latitude;
							self.plots[self.locations[j].name + '-plot'].longitude = self.locations[j].longitude;

							for (var em in json.xml.game.emergencies.emergency) self.setEmergency(self.locations[j].name, json.xml.game.emergencies.emergency[em].name, 0);

							self.plots[self.locations[j].name + '-plot'].tooltip = {};
							self.areas[self.locations[j].name].visualName = self.locations[j].visualName;

							var showedName = self.utils.getDisplayedName(self.areas[self.locations[j].name]);

							self.plots[self.locations[j].name + '-plot'].tooltip.content = self.utils.__buildTooltip(showedName, self.areas[self.locations[j].name].emergencies); //CREAZIONE TOOLTIPS

							self.plots[self.locations[j].name + '-plot'].tooltip.offset = {};

							if (typeof self.locations[j].offsetLeft != 'undefined') {
								self.plots[self.locations[j].name + '-plot'].tooltip.offset.left = parseInt(self.locations[j].offsetLeft);
							} else if (typeof self.locations[j].offsetTop != 'undefined') {
								self.plots[self.locations[j].name + '-plot'].tooltip.offset.top = parseInt(self.locations[j].offsetTop);
							}
							self.plots[self.locations[j].name + '-plot'].tooltip.persistent = true;
							self.plots[self.locations[j].name + '-plot'].text = self.locations[j].name;

							if (typeof self.locations[j].neighborhood.neighbor == 'string') {
								var link = self.utils.getLinkIdentifier(self.locations[j].neighborhood.neighbor, self.locations[j].name);
								if (typeof self.links[link] == 'undefined') {
									self.links[link] = {};
									self.links[link].factor = config['DEFAULT_PLOT_FACTOR'];
									self.links[link].between = self.utils.getPlotsByLink(link);
									self.links[link].attrs = {};
									self.links[link].attrs['stroke-width'] = config['DEFAULT_PLOT_STROKE'];
									self.links[link].attrs['stroke-linecap'] = "round";
								}
							} else if (typeof self.locations[j].neighborhood.neighbor != 'undefined' && typeof self.locations[j].neighborhood.neighbor == 'array') {
								for (var neigh in self.locations[j].neighborhood.neighbor) {
									//var neigh = self.locations[j].neighborhood.neighbor[i];
									var link = self.utils.getLinkIdentifier(neigh, self.locations[j].name);
									if (typeof self.links[link] == 'undefined') {
										self.links[link] = {};
										self.links[link].factor = config['DEFAULT_PLOT_FACTOR'];
										self.links[link].between = self.utils.getPlotsByLink(link);
										self.links[link].attrs = {};
										self.links[link].attrs['stroke-width'] = config['DEFAULT_PLOT_STROKE'];
										self.links[link].attrs['stroke-linecap'] = "round";
									}
								}
							}

							self.resources = json.xml.game.resources;
							self.setup = json.xml.game.setup;
							self.strongholdinfos = json.xml.game.strongholdinfos;
							self.turns = json.xml.game.turns;
						}

						for (var key in json.xml.game.groups) {
							if (json.xml.game.groups.hasOwnProperty(key)) {
								for (var i = 0; i < json.xml.game.groups[key].length; i++) {
									var keyName = json.xml.game.groups[key][i]['name'];
									self.groups[keyName] = {};
									self.groups[keyName].type = key;
									if (key == 'actionGroup') {
										self.groups[keyName].hq = [];
										self.groups[keyName].startingPoint = json.xml.game.groups[key][i].startingPoint;
										self.groups[keyName].location = json.xml.game.groups[key][i].startingPoint;
										for (var j = 0; j < json.xml.game.groups[key][i]['headquarters'].headquarter.length; j++) {
											self.groups[keyName].hq.push(json.xml.game.groups[key][i]['headquarters']['headquarter'][j]);
										}
										var groupColor = self.utils.getRandomColor();
										self.groups[keyName].color = groupColor.rgb;
									}
								}
							}
						}

						callback[0](self.areas, self.plots, self.links);
						callback[1](self.groups, self.plots, self.areas, self.hazard, self.utils);
						callback[2]();
					},
					error: function (exception) {
						console.log('Exeption:' + exception);
					}
				});
			}

			/*createEmergency(locationID,emergency,level){
   	this.areas[locationID].emergencies[emergency] =  level;
   }*/

			eliminateEmergency(locationID, area) {
				this.areas[locationID].emergencies[emergency] = -1;
				this.hazard.updateEmergenciesTooltip(locationID, this.areas[locationID].emergencies);
			}

			setEmergency(locationID, emergency, level) {
				var initialization = typeof this.areas[locationID].emergencies[emergency] == 'undefined';
				this.areas[locationID].emergencies[emergency] = level;
				if (!initialization) this.hazard.updateEmergenciesTooltip(locationID, this.areas[locationID].emergencies);
			}

			handleState(data) {
				if (typeof data == 'string') {
					console.warn('Parameter data is a string, parsing as JSON Object');
					data = JSON.parse(data);
				}

				var response = data.response;
				var data = data.state;

				var diff = this.gameState.setState(data);
				if (diff.length == 0) return;

				var status = data.gameState.currentState;
				var success = response.success;
				var logString = response.logString;

				//for (var i = 0; i < diff.length; i++) {
				if (diff['currentState'] == 'GAME_ACTIVE') {} else if (diff['currentState'] == 'GAME_VICTORY') {
					/* Conclude il gioco con la vittoria dei giocatori */
					this.gameVictory();
				} else if (diff['currentState'] == 'GAME_LOSS') {
					this.gameOver();
				}
				if (diff['locations']) {
					var loc = diff['locations'];
					for (var j = 0; j < loc.length; j++) {
						for (var k = 0; k < loc[j].emergencyLevels.length; k++) {
							if (loc[j].emergencyLevels[k].level == 1) {
								/*Crea una nuova malattia nella nazione tramite createEmergency(LOCATIONID,NOMEEMERGENZA,LIVELLOEMERGENZA) */
								this.setEmergency(loc[j].name, loc[j].emergencyLevels[k].emergency, loc[j].emergencyLevels[k].level);
							} else if (loc[j].emergencyLevels[k].level == -1) {
								/*La malattia è stata curata, quindi va eliminata dalla mappa tramite eliminateEmergency(LOCATIONID,NOMEEMERGENZA) */
								this.eliminateEmergency(loc[j].name, loc[j].emergencyLevels[k].emergency);
							} else {
								/*Il livello malattia è stato modificato tramite modificateEmergencyLevel(LOCATIONID,NOMEEMERGENZA,LIVELLOEMERGENZA) */
								this.setEmergency(loc[j].name, loc[j].emergencyLevels[k].emergency, loc[j].emergencyLevels[k].level);
							}
						}
					}
				}

				if (diff['pawns']) {
					var pawns = diff['pawns'];
					for (var j = 0; j < pawns.length; j++) {
						/* Muove la pedina tramite movePawns(IDPEDINA,LOCAZIONESUCCESSIVA) */
						if (this.groups[pawns[j].group].location != pawns[j].location) {
							/** Si è spostata la pedina pawnID del gruppo pawns[j].group in posizione pawns[j].location */
							this.groups[pawns[j].group].location = pawns[j].location; //Aggiorno la posizione corrente della pedina del grupp
							var position = {
								"top": this.plots[pawns[j].location + '-plot'].latitude,
								"left": this.plots[pawns[j].location + '-plot'].longitude

							};

							var group = {};
							group[pawns[j].group] = this.groups[pawns[j].group].color;
							this.hazard.setPawn(group, pawns[j].location, position);
						}
					}
				}

				if (diff['blockades']) {
					for (blockade in diff['blockades']) {
						var link = this.utils.getLinkIdentifier(blockade[0], blockade[1]);
						if (typeof this.links[link] == `undefined`) throw new Error('Undefined type for blockade');else this.hazard.CloseLink(link);
					}
				}

				if (diff['emergencies']) {}
				if (diff['maxEmergencyLevel']) {}
				if (diff['numOfProductionCards']) {}

				if (diff['contagionRatios']) {
					this.hazard.setProgress(diff.contagionRatios[0].contagionRatio);
				}

				if (diff['type'] == 'ActionTurn') {
					/*COMUNICA CHE INIZIA IL TURNO AZIONE*/
					let l = lang['currentlyPlaying'] + lang['actionGroup'];
					this.hazard.addLog("INFO", logString);
					this.hazard.updateTurn(lang['actionGroup']);
				} else if (diff['type'] == 'EmergencyTurn') {
					/*COMUNICA CHE INIZIA IL TURNO EMERGENZA*/
					let l = lang['currentlyPlaying'] + lang['emergencyGroup'];
					this.hazard.addLog("INFO", l);
					this.hazard.updateTurn(lang['emergencyGroup']);
				} else if (diff['type'] == 'EventTurn') {
					/*COMUNICA CHE INIZIA IL TURNO EVENTI*/
					let l = lang['currentlyPlaying'] + lang['eventGroup'];
					this.hazard.addLog("INFO", l);
					this.hazard.updateTurn(lang['eventGroup']);
				} else if (diff['type'] == 'ProductionGroup') {
					/*COMUNICA CHE INIZIA IL TURNO PRODUZIONE*/
					let l = lang['currentlyPlaying'] + lang['productionGroup'];
					this.hazard.addLog("INFO", l);
					this.hazard.updateTurn(lang['productionGroup']);
				}
				if (diff['group']) {
					var group = diff['group'];
					for (var j = 0; j < group.resources.length; j++) {
						/* Cambia le risorse presenti nella schermata del giocatore  tramite changeResources(risorsa,numero)*/
						this.hazard.changeResources(group.resources[j].resource, group.resources[j].quantity);
					}
				}

				if (diff['numActions'] || diff['maxNumActions']) {
					this.hazard.setActions(diff['numActions'], diff['maxNumActions']);
				}

				this.hazard.addLog("INFO", logString);
			}

			//}

		}

		var main = new HazardDashboard();

		module.exports = main;
	}, { "./Config.js": 5, "./Dashboard.js": 6, "./lang/Lang.js": 10, "./lib/socket.io.min.js": 13, "./lib/xml2json.min.js": 14, "./utils/GameState.js": 15, "./utils/MapUtils.js": 16, "./utils/ModalDialog.js": 17, "./utils/Utils.js": 18, "jquery": 3, "jquery-mousewheel": 2, "raphael": 4 }], 8: [function (require, module, exports) {
		var config = require('./Config.js');

		class Pawn {
			constructor(idx, pos = {}, literal = null) {
				this.position = {};
				if (pos != {} && literal != null) this.setPosition(pos, literal);
				this.id = idx;
				this.groups = new Array();
				this.__dirty = false;
				this.__initialized = false;
				this.__svg = '';
				this.svgObject = null;
				this.DEFAULT_PAWN_SIZE = {};
				this.DEFAULT_PAWN_SIZE.H = '18px';
				this.DEFAULT_PAWN_SIZE.W = '15px';
				this.DEFAULT_ANIM_DURATION = 2000;
				this.promise = null;
			}

			getPosition() {
				return this.position;
			}
			setPosition(pos = null, literal = null, animate = false) {
				var self = this;
				if (pos != null) {
					this.position.top = pos.top;
					this.position.left = pos.left;
				}

				if (literal != null) this.literalPosition = literal;

				if (!animate) {
					$("#" + this.id).css({
						top: this.position.top,
						left: this.position.left
					});
				} else {
					this.promise = $("#" + this.id).animate({
						top: this.position.top,
						left: this.position.left
					}, self.DEFAULT_ANIM_DURATION).promise();
				}
			}

			addGroup(group) {
				var key = Object.keys(group)[0];
				this.groups[key] = group[key];
				return this.getGroupsNumber();
			}

			removeGroup(group) {
				try {
					var key = Object.keys(group)[0];
					delete this.groups[key];
					return this.getGroupsNumber();
				} catch (err) {
					console.log('removeGroup Error: ' + err);
					return -1;
				}
			}

			groupInPawn(group) {
				var key = Object.keys(group)[0];
				if ($.inArray(key, Object.keys(this.groups)) > -1) return true;
				return false;
			}

			sameLocation(location) {
				return this.literalPosition == location;
			}

			getGroupsNumber() {
				return Object.keys(this.groups).length;
			}

			getLiteral() {
				return this.literal;
			}

			getGroups() {
				return this.groups;
			}

			getGroupByNum(num) {
				var keys = Object.keys(this.groups);
				return this.groups[keys[num]];
			}

			merge(newGroups) {
				if (typeof this.groups == 'object') Object.assign(this.groups, newGroups);else this.groups.concat(newGroups);
			}

			clear() {
				this.svgObject.clear();
			}

			draw(parent = config['MAP_CONTAINER']) {
				var self = this;
				this.__svg = './' + 'player-' + this.getGroupsNumber().toString() + '.svg';
				if (!this.__initialized) {
					$(parent).append('<div id="' + this.id + '"></div>');
					$('#' + this.id).svg();
					$('#' + this.id).css({ 'position': 'absolute' });
					$('#' + this.id).css({ 'width': this.DEFAULT_PAWN_SIZE.W, 'height': this.DEFAULT_PAWN_SIZE.H });
					this.__initialized = true;
				} else {
					this.clear();
				}

				$('#' + this.id).children().fadeOut();
				this.svgObject = $('#' + this.id).svg('get');
				var callback = this.__updateDesign.bind(this);
				this.svgObject.load(this.__svg, { addTo: true, onLoad: callback, changeSize: true });
				//$($('#'+this.id+'> *')).animate({svgHeight: self.DEFAULT_PAWN_SIZE.H, svgWidth : self.DEFAULT_PAWN_SIZE.W}, 400);
				$('#' + this.id).children().fadeIn();
			}

			__updateDesign() {
				for (var i = 0; i < this.getGroupsNumber(); i++) {
					$('#' + this.id + ' > * > * > #c' + (i + 1).toString()).css({ 'fill': this.getGroupByNum(i) });
				}
			}
		}

		module.exports = Pawn;
	}, { "./Config.js": 5 }], 9: [function (require, module, exports) {
		var Pawn = require('./Pawn.js');
		var config = require('./Config.js');

		class PawnManager {
			constructor() {
				this.pawns = new Array();
			}

			findPawnByGroup(groupID) {
				for (var pIndex in this.pawns) {
					//var pawn = $.extend(new Pawn(),this.pawns[pIndex]);
					if (this.pawns[pIndex].groupInPawn(groupID)) {
						return this.pawns[pIndex];
					}
				}
				return -1;
			}

			movePawn(group, to, position) {
				var done = false;

				//Controllo che la posizione "to" non sia occupata da un'altra pedina
				for (var pIndex in this.pawns) {
					//var pawn = $.extend(new Pawn(),this.pawns[pIndex]);
					if (this.pawns[pIndex].sameLocation(to)) {
						this.__detectAndSolveCollisions(this.pawns[pIndex], group, to, position);
						done = true;
						break;
					}
				}

				//Se la posizione "to" è libera, controllo che la pedina da spostare contenga un solo gruppo o più gruppi
				if (!done) {
					var newPawn = this.findPawnByGroup(group);
					if (typeof newPawn == 'object') {
						// Esiste già una pedina, è necessario spostare il gruppo
						if (newPawn.getGroupsNumber() == 1) {
							//La pedina da spostare contiene un solo gruppo, la sposto semplicemente
							newPawn.setPosition(position, to, true);
						} else {

							//La pedina da spostare contiene più di un gruppo, è necessario dividerla in due pedine
							var secondPawn = this.createEmptyPawn(); //Creo una nuova pedina vuota
							secondPawn.addGroup(group); //Inserisco il gruppo sulla nuova pedina
							secondPawn.draw(); //Disegno la pedina sulla mappa
							secondPawn.setPosition(newPawn.getPosition(), to); //Posiziono la seconda pedina sulla prima
							secondPawn.setPosition(position, to, true);
							newPawn.removeGroup(group);
							newPawn.draw();
						}
					} else {
						//La pedina non esiste e deve essere ancora creata
						var newPawn = this.createEmptyPawn();
						newPawn.addGroup(group);
						newPawn.draw();
						newPawn.setPosition(position, to, false);
						//newPawn.animate();
					}
				}
			}

			/**
    * [__detectAndSolveCollisions description]
    * @param  {[type]} pawn        [description]
    * @param  {[type]} groupAway   [ID Univoco del gruppo che si sposterà]
    * @param  {[type]} destination [description]
    * @param  {[type]} position    [description]
    * @return {[type]}             [description]
    */
			__detectAndSolveCollisions(pawn, groupAway, destination, position) {
				var self = this;
				var oldPawn = this.findPawnByGroup(groupAway); // --> Se -1, non esiste alcuna pedina che contenga il gruppo groupAway, non devo quindi modificare alcuna pedina già esistente
				if (oldPawn != -1) {
					//pawn.setPosition(position,destination);
					var groupsLeft = oldPawn.removeGroup(groupAway);
					if (groupsLeft == 0) {
						//La pedina non ha più gruppi
						oldPawn.setPosition(pawn.getPosition(), destination, true);

						$.when(self.promise).then(function () {
							self.promise = null;
							self.animationCallback(pawn, oldPawn, groupAway);
						});

						/*oldPawn.clear();
      var self = this;
      self.oldPawn = {};
      delete(self.oldPawn);*/
					} else {
						//La pedina ha ancora qualche gruppo ma è necessario aggiornare il design
						oldPawn.draw();

						//Creo una pedina vuota temporeanea da utilizzare per l'animazione
						var animationPawn = this.createEmptyPawn();
						animationPawn.addGroup(groupAway);
						animationPawn.draw();
						animationPawn.setPosition(pawn.getPosition(), destination);
						//animationPawn.clear();
						animationPawn.setPosition(position, destination, true);
						$.when(self.promise).then(function () {
							self.promise = null;
							self.animationCallback(pawn, animationPawn, groupAway);
							self.animationPawn = {};
							delete self.animationPawn;
						});

						/*var self = this;
      self.animationPawn = {};
      delete(self.animationPawn);*/
					}
				} else {
					//Provo ad unire le pedine
					var groups = pawn.getGroups();
					pawn.merge(groupAway);
					pawn.draw();
				}

				this.promise = null;
			}

			animationCallback(pawn, oldPawn, groupAway) {
				oldPawn.clear();
				var groups = pawn.getGroups();
				pawn.merge(groupAway);
				pawn.draw();
				var self = this;
				self.oldPawn = {};
				delete self.oldPawn;
			}

			createEmptyPawn() {
				var id = performance.now().toString();
				id = id.replace('.', '-'); //JQuery SVG non funzione se l'attributo id contiene dei "."
				var pawn = new Pawn('svg-' + id);
				this.pawns.push(pawn);
				return pawn;
			}

			__pawnsCollide(p1, literal) {
				return p1.getLiteral() == literal;
			}

		}
		module.exports = PawnManager;
	}, { "./Config.js": 5, "./Pawn.js": 8 }], 10: [function (require, module, exports) {
		"use strict";

		module.exports = {
			'it': {
				'restart': 'Ricomincia',
				'wait': 'Attendi ...',
				'loading': 'Caricamento in Corso',
				'turn_start': 'Inizia il turno',
				'turn': 'Turno',
				'gamestart': 'Inizia il gioco',
				'oktostart': 'Premi OK per iniziare la partita',
				'gameover': 'Game Over',
				'gamestartstext': 'Inizia la Partita',
				'gameovertext': 'La malattia ha preso il sopravvento',
				'gamestatus': 'Status di Gioco',
				'zone': 'Zona: ',

				//Gruppi
				'productionGroup': 'Gruppo Produzione',
				'eventGroup': 'Gruppo Evento',
				'emergencyGroup': 'Gruppo Emergenza',
				'actionGroup': 'Gruppo Azione',

				//Turni
				'currentlyPlaying': 'Inizia il turno del ',

				'legendTitle': 'Livello Infezione'
			}
		};
	}, {}], 11: [function (require, module, exports) {
		/* http://keith-wood.name/svg.html
     SVG for jQuery v1.5.0.
     Written by Keith Wood (kbwood{at}iinet.com.au) August 2007.
     Available under the MIT (http://keith-wood.name/licence.html) license. 
     Please attribute the author if you use it. */
		(function ($) {
			function SVGManager() {
				this._settings = [];this._extensions = [];this.regional = [];this.regional[''] = { errorLoadingText: 'Error loading' };this.local = this.regional[''];this._uuid = new Date().getTime();this._ie = !!window.ActiveXObject;
			}$.extend(SVGManager.prototype, { markerClassName: 'hasSVG', propertyName: 'svgwrapper', svgNS: 'http://www.w3.org/2000/svg', xlinkNS: 'http://www.w3.org/1999/xlink', _wrapperClass: SVGWrapper, _attrNames: { class_: 'class', in_: 'in', alignmentBaseline: 'alignment-baseline', baselineShift: 'baseline-shift', clipPath: 'clip-path', clipRule: 'clip-rule', colorInterpolation: 'color-interpolation', colorInterpolationFilters: 'color-interpolation-filters', colorRendering: 'color-rendering', dominantBaseline: 'dominant-baseline', enableBackground: 'enable-background', fillOpacity: 'fill-opacity', fillRule: 'fill-rule', floodColor: 'flood-color', floodOpacity: 'flood-opacity', fontFamily: 'font-family', fontSize: 'font-size', fontSizeAdjust: 'font-size-adjust', fontStretch: 'font-stretch', fontStyle: 'font-style', fontVariant: 'font-variant', fontWeight: 'font-weight', glyphOrientationHorizontal: 'glyph-orientation-horizontal', glyphOrientationVertical: 'glyph-orientation-vertical', horizAdvX: 'horiz-adv-x', horizOriginX: 'horiz-origin-x', imageRendering: 'image-rendering', letterSpacing: 'letter-spacing', lightingColor: 'lighting-color', markerEnd: 'marker-end', markerMid: 'marker-mid', markerStart: 'marker-start', stopColor: 'stop-color', stopOpacity: 'stop-opacity', strikethroughPosition: 'strikethrough-position', strikethroughThickness: 'strikethrough-thickness', strokeDashArray: 'stroke-dasharray', strokeDashOffset: 'stroke-dashoffset', strokeLineCap: 'stroke-linecap', strokeLineJoin: 'stroke-linejoin', strokeMiterLimit: 'stroke-miterlimit', strokeOpacity: 'stroke-opacity', strokeWidth: 'stroke-width', textAnchor: 'text-anchor', textDecoration: 'text-decoration', textRendering: 'text-rendering', underlinePosition: 'underline-position', underlineThickness: 'underline-thickness', vertAdvY: 'vert-adv-y', vertOriginY: 'vert-origin-y', wordSpacing: 'word-spacing', writingMode: 'writing-mode' }, _attachSVG: function (a, b) {
					var c = a.namespaceURI === this.svgNS ? a : null;var a = c ? null : a;if ($(a || c).hasClass(this.markerClassName)) {
						return;
					}if (typeof b === 'string') {
						b = { loadURL: b };
					} else if (typeof b === 'function') {
						b = { onLoad: b };
					}$(a || c).addClass(this.markerClassName);try {
						if (!c) {
							c = document.createElementNS(this.svgNS, 'svg');c.setAttribute('version', '1.1');if (a.clientWidth > 0) {
								c.setAttribute('width', a.clientWidth);
							}if (a.clientHeight > 0) {
								c.setAttribute('height', a.clientHeight);
							}a.appendChild(c);
						}this._afterLoad(a, c, b || {});
					} catch (e) {
						$(a).html('<p>SVG is not supported natively on this browser</p>');
					}
				}, _afterLoad: function (a, b, c) {
					var c = c || this._settings[a.id];this._settings[a ? a.id : ''] = null;var d = new this._wrapperClass(b, a);$.data(a || b, $.svg.propertyName, d);try {
						if (c.loadURL) {
							d.load(c.loadURL, c);
						}if (c.settings) {
							d.configure(c.settings);
						}if (c.onLoad && !c.loadURL) {
							c.onLoad.apply(a || b, [d]);
						}
					} catch (e) {
						alert(e);
					}
				}, _getSVG: function (a) {
					return $(a).data(this.propertyName);
				}, _destroySVG: function (a) {
					a = $(a);if (!a.hasClass(this.markerClassName)) {
						return;
					}a.removeClass(this.markerClassName).removeData(this.propertyName);if (a[0].namespaceURI !== this.svgNS) {
						a.empty();
					}
				}, addExtension: function (a, b) {
					this._extensions.push([a, b]);
				}, isSVGElem: function (a) {
					return a.nodeType === 1 && a.namespaceURI === $.svg.svgNS;
				} });function SVGWrapper(a, b) {
				this._svg = a;this._container = b;for (var i = 0; i < $.svg._extensions.length; i++) {
					var c = $.svg._extensions[i];this[c[0]] = new c[1](this);
				}
			}$.extend(SVGWrapper.prototype, { width: function () {
					return this._container ? this._container.clientWidth : this._svg.width;
				}, height: function () {
					return this._container ? this._container.clientHeight : this._svg.height;
				}, root: function () {
					return this._svg;
				}, configure: function (a, b, c) {
					if (!a.nodeName) {
						c = b;b = a;a = this._svg;
					}if (c) {
						for (var i = a.attributes.length - 1; i >= 0; i--) {
							var d = a.attributes.item(i);if (!(d.nodeName === 'onload' || d.nodeName === 'version' || d.nodeName.substring(0, 5) === 'xmlns')) {
								a.attributes.removeNamedItem(d.nodeName);
							}
						}
					}for (var e in b) {
						a.setAttribute($.svg._attrNames[e] || e, b[e]);
					}return this;
				}, getElementById: function (a) {
					return this._svg.ownerDocument.getElementById(a);
				}, change: function (a, b) {
					if (a) {
						for (var c in b) {
							if (b[c] == null) {
								a.removeAttribute($.svg._attrNames[c] || c);
							} else {
								a.setAttribute($.svg._attrNames[c] || c, b[c]);
							}
						}
					}return this;
				}, _args: function (b, c, d) {
					c.splice(0, 0, 'parent');c.splice(c.length, 0, 'settings');var e = {};var f = 0;if (b[0] != null && b[0].jquery) {
						b[0] = b[0][0];
					}if (b[0] != null && !(typeof b[0] === 'object' && b[0].nodeName)) {
						e['parent'] = null;f = 1;
					}for (var i = 0; i < b.length; i++) {
						e[c[i + f]] = b[i];
					}if (d) {
						$.each(d, function (i, a) {
							if (typeof e[a] === 'object') {
								e.settings = e[a];e[a] = null;
							}
						});
					}return e;
				}, title: function (a, b, c) {
					var d = this._args(arguments, ['text']);var e = this._makeNode(d.parent, 'title', d.settings || {});e.appendChild(this._svg.ownerDocument.createTextNode(d.text));return e;
				}, describe: function (a, b, c) {
					var d = this._args(arguments, ['text']);var e = this._makeNode(d.parent, 'desc', d.settings || {});e.appendChild(this._svg.ownerDocument.createTextNode(d.text));return e;
				}, defs: function (a, b, c) {
					var d = this._args(arguments, ['id'], ['id']);return this._makeNode(d.parent, 'defs', $.extend(d.id ? { id: d.id } : {}, d.settings || {}));
				}, symbol: function (a, b, c, d, e, f, g) {
					var h = this._args(arguments, ['id', 'x1', 'y1', 'width', 'height']);return this._makeNode(h.parent, 'symbol', $.extend({ id: h.id, viewBox: h.x1 + ' ' + h.y1 + ' ' + h.width + ' ' + h.height }, h.settings || {}));
				}, marker: function (a, b, c, d, e, f, g, h) {
					var i = this._args(arguments, ['id', 'refX', 'refY', 'mWidth', 'mHeight', 'orient'], ['orient']);return this._makeNode(i.parent, 'marker', $.extend({ id: i.id, refX: i.refX, refY: i.refY, markerWidth: i.mWidth, markerHeight: i.mHeight, orient: i.orient || 'auto' }, i.settings || {}));
				}, style: function (a, b, c) {
					var d = this._args(arguments, ['styles']);var e = this._makeNode(d.parent, 'style', $.extend({ type: 'text/css' }, d.settings || {}));e.appendChild(this._svg.ownerDocument.createTextNode(d.styles));return e;
				}, script: function (a, b, c, d) {
					var e = this._args(arguments, ['script', 'type'], ['type']);var f = this._makeNode(e.parent, 'script', $.extend({ type: e.type || 'text/javascript' }, e.settings || {}));f.appendChild(this._svg.ownerDocument.createTextNode(e.script));if ($.svg._ie) {
						$.globalEval(e.script);
					}return f;
				}, linearGradient: function (a, b, c, d, e, f, g, h) {
					var i = this._args(arguments, ['id', 'stops', 'x1', 'y1', 'x2', 'y2'], ['x1']);var j = $.extend({ id: i.id }, i.x1 != null ? { x1: i.x1, y1: i.y1, x2: i.x2, y2: i.y2 } : {});return this._gradient(i.parent, 'linearGradient', $.extend(j, i.settings || {}), i.stops);
				}, radialGradient: function (a, b, c, d, e, r, f, g, h) {
					var i = this._args(arguments, ['id', 'stops', 'cx', 'cy', 'r', 'fx', 'fy'], ['cx']);var j = $.extend({ id: i.id }, i.cx != null ? { cx: i.cx, cy: i.cy, r: i.r, fx: i.fx, fy: i.fy } : {});return this._gradient(i.parent, 'radialGradient', $.extend(j, i.settings || {}), i.stops);
				}, _gradient: function (a, b, c, d) {
					var e = this._makeNode(a, b, c);for (var i = 0; i < d.length; i++) {
						var f = d[i];this._makeNode(e, 'stop', $.extend({ offset: f[0], stopColor: f[1] }, f[2] != null ? { stopOpacity: f[2] } : {}));
					}return e;
				}, pattern: function (a, b, x, y, c, d, e, f, g, h, i) {
					var j = this._args(arguments, ['id', 'x', 'y', 'width', 'height', 'vx', 'vy', 'vwidth', 'vheight'], ['vx']);var k = $.extend({ id: j.id, x: j.x, y: j.y, width: j.width, height: j.height }, j.vx != null ? { viewBox: j.vx + ' ' + j.vy + ' ' + j.vwidth + ' ' + j.vheight } : {});return this._makeNode(j.parent, 'pattern', $.extend(k, j.settings || {}));
				}, clipPath: function (a, b, c, d) {
					var e = this._args(arguments, ['id', 'units']);e.units = e.units || 'userSpaceOnUse';return this._makeNode(e.parent, 'clipPath', $.extend({ id: e.id, clipPathUnits: e.units }, e.settings || {}));
				}, mask: function (a, b, x, y, c, d, e) {
					var f = this._args(arguments, ['id', 'x', 'y', 'width', 'height']);return this._makeNode(f.parent, 'mask', $.extend({ id: f.id, x: f.x, y: f.y, width: f.width, height: f.height }, f.settings || {}));
				}, createPath: function () {
					return new SVGPath();
				}, createText: function () {
					return new SVGText();
				}, svg: function (a, x, y, b, c, d, e, f, g, h) {
					var i = this._args(arguments, ['x', 'y', 'width', 'height', 'vx', 'vy', 'vwidth', 'vheight'], ['vx']);var j = $.extend({ x: i.x, y: i.y, width: i.width, height: i.height }, i.vx != null ? { viewBox: i.vx + ' ' + i.vy + ' ' + i.vwidth + ' ' + i.vheight } : {});return this._makeNode(i.parent, 'svg', $.extend(j, i.settings || {}));
				}, group: function (a, b, c) {
					var d = this._args(arguments, ['id'], ['id']);return this._makeNode(d.parent, 'g', $.extend({ id: d.id }, d.settings || {}));
				}, use: function (a, x, y, b, c, d, e) {
					var f = this._args(arguments, ['x', 'y', 'width', 'height', 'ref']);if (typeof f.x === 'string') {
						f.ref = f.x;f.settings = f.y;f.x = f.y = f.width = f.height = null;
					}var g = this._makeNode(f.parent, 'use', $.extend({ x: f.x, y: f.y, width: f.width, height: f.height }, f.settings || {}));g.setAttributeNS($.svg.xlinkNS, 'href', f.ref);return g;
				}, link: function (a, b, c) {
					var d = this._args(arguments, ['ref']);var e = this._makeNode(d.parent, 'a', d.settings);e.setAttributeNS($.svg.xlinkNS, 'href', d.ref);return e;
				}, image: function (a, x, y, b, c, d, e) {
					var f = this._args(arguments, ['x', 'y', 'width', 'height', 'ref']);var g = this._makeNode(f.parent, 'image', $.extend({ x: f.x, y: f.y, width: f.width, height: f.height }, f.settings || {}));g.setAttributeNS($.svg.xlinkNS, 'href', f.ref);return g;
				}, path: function (a, b, c) {
					var d = this._args(arguments, ['path']);return this._makeNode(d.parent, 'path', $.extend({ d: d.path.path ? d.path.path() : d.path }, d.settings || {}));
				}, rect: function (a, x, y, b, c, d, e, f) {
					var g = this._args(arguments, ['x', 'y', 'width', 'height', 'rx', 'ry'], ['rx']);return this._makeNode(g.parent, 'rect', $.extend({ x: g.x, y: g.y, width: g.width, height: g.height }, g.rx ? { rx: g.rx, ry: g.ry } : {}, g.settings || {}));
				}, circle: function (a, b, c, r, d) {
					var e = this._args(arguments, ['cx', 'cy', 'r']);return this._makeNode(e.parent, 'circle', $.extend({ cx: e.cx, cy: e.cy, r: e.r }, e.settings || {}));
				}, ellipse: function (a, b, c, d, e, f) {
					var g = this._args(arguments, ['cx', 'cy', 'rx', 'ry']);return this._makeNode(g.parent, 'ellipse', $.extend({ cx: g.cx, cy: g.cy, rx: g.rx, ry: g.ry }, g.settings || {}));
				}, line: function (a, b, c, d, e, f) {
					var g = this._args(arguments, ['x1', 'y1', 'x2', 'y2']);return this._makeNode(g.parent, 'line', $.extend({ x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 }, g.settings || {}));
				}, polyline: function (a, b, c) {
					var d = this._args(arguments, ['points']);return this._poly(d.parent, 'polyline', d.points, d.settings);
				}, polygon: function (a, b, c) {
					var d = this._args(arguments, ['points']);return this._poly(d.parent, 'polygon', d.points, d.settings);
				}, _poly: function (a, b, c, d) {
					var e = '';for (var i = 0; i < c.length; i++) {
						e += c[i].join() + ' ';
					}return this._makeNode(a, b, $.extend({ points: $.trim(e) }, d || {}));
				}, text: function (a, x, y, b, c) {
					var d = this._args(arguments, ['x', 'y', 'value']);if (typeof d.x === 'string' && arguments.length < 4) {
						d.value = d.x;d.settings = d.y;d.x = d.y = null;
					}return this._text(d.parent, 'text', d.value, $.extend({ x: d.x && $.isArray(d.x) ? d.x.join(' ') : d.x, y: d.y && $.isArray(d.y) ? d.y.join(' ') : d.y }, d.settings || {}));
				}, textpath: function (a, b, c, d) {
					var e = this._args(arguments, ['path', 'value']);var f = this._text(e.parent, 'textPath', e.value, e.settings || {});f.setAttributeNS($.svg.xlinkNS, 'href', e.path);return f;
				}, _text: function (a, b, c, d) {
					var e = this._makeNode(a, b, d);if (typeof c === 'string') {
						e.appendChild(e.ownerDocument.createTextNode(c));
					} else {
						for (var i = 0; i < c._parts.length; i++) {
							var f = c._parts[i];if (f[0] === 'tspan') {
								var g = this._makeNode(e, f[0], f[2]);g.appendChild(e.ownerDocument.createTextNode(f[1]));e.appendChild(g);
							} else if (f[0] === 'tref') {
								var g = this._makeNode(e, f[0], f[2]);g.setAttributeNS($.svg.xlinkNS, 'href', f[1]);e.appendChild(g);
							} else if (f[0] === 'textpath') {
								var h = $.extend({}, f[2]);h.href = null;var g = this._makeNode(e, f[0], h);g.setAttributeNS($.svg.xlinkNS, 'href', f[2].href);g.appendChild(e.ownerDocument.createTextNode(f[1]));e.appendChild(g);
							} else {
								e.appendChild(e.ownerDocument.createTextNode(f[1]));
							}
						}
					}return e;
				}, other: function (a, b, c) {
					var d = this._args(arguments, ['name']);return this._makeNode(d.parent, d.name, d.settings || {});
				}, _makeNode: function (a, b, c) {
					a = a || this._svg;var d = this._svg.ownerDocument.createElementNS($.svg.svgNS, b);for (var b in c) {
						var e = c[b];if (e != null && (typeof e !== 'string' || e !== '')) {
							d.setAttribute($.svg._attrNames[b] || b, e);
						}
					}a.appendChild(d);return d;
				}, add: function (b, c) {
					var d = this._args(arguments.length === 1 ? [null, b] : arguments, ['node']);var f = this;d.parent = d.parent || this._svg;d.node = d.node.jquery ? d.node : $(d.node);try {
						d.parent.appendChild(d.node.cloneNode(true));
					} catch (e) {
						d.node.each(function () {
							var a = f._cloneAsSVG(this);if (a) {
								d.parent.appendChild(a);
							}
						});
					}return this;
				}, clone: function (b, c) {
					var d = this;var e = this._args(arguments.length === 1 ? [null, b] : arguments, ['node']);e.parent = e.parent || this._svg;e.node = e.node.jquery ? e.node : $(e.node);var f = [];e.node.each(function () {
						var a = d._cloneAsSVG(this);if (a) {
							a.id = '';e.parent.appendChild(a);f.push(a);
						}
					});return f;
				}, _cloneAsSVG: function (a) {
					var b = null;if (a.nodeType === 1) {
						b = this._svg.ownerDocument.createElementNS($.svg.svgNS, this._checkName(a.nodeName));for (var i = 0; i < a.attributes.length; i++) {
							var c = a.attributes.item(i);if (c.nodeName !== 'xmlns' && c.nodeValue) {
								if (c.prefix === 'xlink') {
									b.setAttributeNS($.svg.xlinkNS, c.localName || c.baseName, c.nodeValue);
								} else {
									b.setAttribute(this._checkName(c.nodeName), c.nodeValue);
								}
							}
						}for (var i = 0; i < a.childNodes.length; i++) {
							var d = this._cloneAsSVG(a.childNodes[i]);if (d) {
								b.appendChild(d);
							}
						}
					} else if (a.nodeType === 3) {
						if ($.trim(a.nodeValue)) {
							b = this._svg.ownerDocument.createTextNode(a.nodeValue);
						}
					} else if (a.nodeType === 4) {
						if ($.trim(a.nodeValue)) {
							try {
								b = this._svg.ownerDocument.createCDATASection(a.nodeValue);
							} catch (e) {
								b = this._svg.ownerDocument.createTextNode(a.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
							}
						}
					}return b;
				}, _checkName: function (a) {
					a = a.substring(0, 1) >= 'A' && a.substring(0, 1) <= 'Z' ? a.toLowerCase() : a;return a.substring(0, 4) === 'svg:' ? a.substring(4) : a;
				}, load: function (l, m) {
					m = typeof m === 'boolean' ? { addTo: m } : typeof m === 'function' ? { onLoad: m } : typeof m === 'string' ? { parent: m } : typeof m === 'object' && m.nodeName ? { parent: m } : typeof m === 'object' && m.jquery ? { parent: m } : m || {};if (!m.parent && !m.addTo) {
						this.clear(false);
					}var n = [this._svg.getAttribute('width'), this._svg.getAttribute('height')];var o = this;var p = function (a) {
						a = $.svg.local.errorLoadingText + ': ' + a;if (m.onLoad) {
							m.onLoad.apply(o._container || o._svg, [o, a]);
						} else {
							o.text(null, 10, 20, a);
						}
					};var q = function (a) {
						var b = new ActiveXObject('Microsoft.XMLDOM');b.validateOnParse = false;b.resolveExternals = false;b.async = false;b.loadXML(a);if (b.parseError.errorCode !== 0) {
							p(b.parseError.reason);return null;
						}return b;
					};var r = function (b) {
						if (!b) {
							return;
						}if (b.documentElement.nodeName !== 'svg') {
							var c = b.getElementsByTagName('parsererror');var d = c.length ? c[0].getElementsByTagName('div') : [];p(!c.length ? '???' : (d.length ? d[0] : c[0]).firstChild.nodeValue);return;
						}var f = m.parent ? $(m.parent)[0] : o._svg;var g = {};for (var i = 0; i < b.documentElement.attributes.length; i++) {
							var h = b.documentElement.attributes.item(i);if (!(h.nodeName === 'version' || h.nodeName.substring(0, 5) === 'xmlns')) {
								g[h.nodeName] = h.nodeValue;
							}
						}o.configure(f, g, !m.parent);var j = b.documentElement.childNodes;for (var i = 0; i < j.length; i++) {
							try {
								f.appendChild(o._svg.ownerDocument.importNode(j[i], true));if (j[i].nodeName === 'script') {
									$.globalEval(j[i].textContent);
								}
							} catch (e) {
								o.add(f, j[i]);
							}
						}if (!m.keepRelativeLinks && l.match('/')) {
							var k = l.replace(/\/[^\/]*$/, '/');$('*', f).each(function () {
								var a = $(this).attr('xlink:href');if (a && !a.match(/(^[a-z][-a-z0-9+.]*:.*$)|(^\/.*$)|(^#.*$)/i)) {
									$(this).attr('xlink:href', k + a);
								}
							});
						}if (!m.changeSize) {
							o.configure(f, { width: n[0], height: n[1] });
						}if (m.onLoad) {
							m.onLoad.apply(o._container || o._svg, [o]);
						}
					};if (l.match('<svg')) {
						try {
							r(new DOMParser().parseFromString(l, 'text/xml'));
						} catch (e) {
							p(e);
						}
					} else {
						$.ajax({ url: l, dataType: 'xml', success: function (a) {
								r(a);
							}, error: function (a, b, c) {
								p(b + (c ? ' ' + c.message : ''));
							} });
					}return this;
				}, remove: function (a) {
					a = a.jquery ? a[0] : a;a.parentNode.removeChild(a);return this;
				}, clear: function (a) {
					if (a) {
						this.configure({}, true);
					}while (this._svg.firstChild) {
						this._svg.removeChild(this._svg.firstChild);
					}return this;
				}, toSVG: function (a) {
					a = a || this._svg;return typeof XMLSerializer === 'undefined' ? this._toSVG(a) : new XMLSerializer().serializeToString(a);
				}, _toSVG: function (a) {
					var b = '';if (!a) {
						return b;
					}if (a.nodeType === 3) {
						b = a.nodeValue;
					} else if (a.nodeType === 4) {
						b = '<![CDATA[' + a.nodeValue + ']]>';
					} else {
						b = '<' + a.nodeName;if (a.attributes) {
							for (var i = 0; i < a.attributes.length; i++) {
								var c = a.attributes.item(i);if (!($.trim(c.nodeValue) === '' || c.nodeValue.match(/^\[object/) || c.nodeValue.match(/^function/))) {
									b += ' ' + (c.namespaceURI === $.svg.xlinkNS ? 'xlink:' : '') + c.nodeName + '="' + c.nodeValue + '"';
								}
							}
						}if (a.firstChild) {
							b += '>';var d = a.firstChild;while (d) {
								b += this._toSVG(d);d = d.nextSibling;
							}b += '</' + a.nodeName + '>';
						} else {
							b += '/>';
						}
					}return b;
				} });function SVGPath() {
				this._path = '';
			}$.extend(SVGPath.prototype, { reset: function () {
					this._path = '';return this;
				}, move: function (x, y, a) {
					a = $.isArray(x) ? y : a;return this._coords(a ? 'm' : 'M', x, y);
				}, line: function (x, y, a) {
					a = $.isArray(x) ? y : a;return this._coords(a ? 'l' : 'L', x, y);
				}, horiz: function (x, a) {
					this._path += (a ? 'h' : 'H') + ($.isArray(x) ? x.join(' ') : x);return this;
				}, vert: function (y, a) {
					this._path += (a ? 'v' : 'V') + ($.isArray(y) ? y.join(' ') : y);return this;
				}, curveC: function (a, b, c, d, x, y, e) {
					e = $.isArray(a) ? b : e;return this._coords(e ? 'c' : 'C', a, b, c, d, x, y);
				}, smoothC: function (a, b, x, y, c) {
					c = $.isArray(a) ? b : c;return this._coords(c ? 's' : 'S', a, b, x, y);
				}, curveQ: function (a, b, x, y, c) {
					c = $.isArray(a) ? b : c;return this._coords(c ? 'q' : 'Q', a, b, x, y);
				}, smoothQ: function (x, y, a) {
					a = $.isArray(x) ? y : a;return this._coords(a ? 't' : 'T', x, y);
				}, _coords: function (a, b, c, d, e, f, g) {
					if ($.isArray(b)) {
						for (var i = 0; i < b.length; i++) {
							var h = b[i];this._path += (i === 0 ? a : ' ') + h[0] + ',' + h[1] + (h.length < 4 ? '' : ' ' + h[2] + ',' + h[3] + (h.length < 6 ? '' : ' ' + h[4] + ',' + h[5]));
						}
					} else {
						this._path += a + b + ',' + c + (d == null ? '' : ' ' + d + ',' + e + (f == null ? '' : ' ' + f + ',' + g));
					}return this;
				}, arc: function (a, b, c, d, e, x, y, f) {
					f = $.isArray(a) ? b : f;this._path += f ? 'a' : 'A';if ($.isArray(a)) {
						for (var i = 0; i < a.length; i++) {
							var g = a[i];this._path += (i === 0 ? '' : ' ') + g[0] + ',' + g[1] + ' ' + g[2] + ' ' + (g[3] ? '1' : '0') + ',' + (g[4] ? '1' : '0') + ' ' + g[5] + ',' + g[6];
						}
					} else {
						this._path += a + ',' + b + ' ' + c + ' ' + (d ? '1' : '0') + ',' + (e ? '1' : '0') + ' ' + x + ',' + y;
					}return this;
				}, close: function () {
					this._path += 'z';return this;
				}, path: function () {
					return this._path;
				} });SVGPath.prototype.moveTo = SVGPath.prototype.move;SVGPath.prototype.lineTo = SVGPath.prototype.line;SVGPath.prototype.horizTo = SVGPath.prototype.horiz;SVGPath.prototype.vertTo = SVGPath.prototype.vert;SVGPath.prototype.curveCTo = SVGPath.prototype.curveC;SVGPath.prototype.smoothCTo = SVGPath.prototype.smoothC;SVGPath.prototype.curveQTo = SVGPath.prototype.curveQ;SVGPath.prototype.smoothQTo = SVGPath.prototype.smoothQ;SVGPath.prototype.arcTo = SVGPath.prototype.arc;function SVGText() {
				this._parts = [];
			}$.extend(SVGText.prototype, { reset: function () {
					this._parts = [];return this;
				}, string: function (a) {
					this._parts.push(['text', a]);return this;
				}, span: function (a, b) {
					this._parts.push(['tspan', a, b]);return this;
				}, ref: function (a, b) {
					this._parts.push(['tref', a, b]);return this;
				}, path: function (a, b, c) {
					this._parts.push(['textpath', b, $.extend({ href: a }, c || {})]);return this;
				} });$.fn.svg = function (a) {
				var b = Array.prototype.slice.call(arguments, 1);if (typeof a === 'string' && a === 'get') {
					return $.svg['_' + a + 'SVG'].apply($.svg, [this[0]].concat(b));
				}return this.each(function () {
					if (typeof a === 'string') {
						$.svg['_' + a + 'SVG'].apply($.svg, [this].concat(b));
					} else {
						$.svg._attachSVG(this, a || {});
					}
				});
			};$.svg = new SVGManager();
		})(jQuery);
	}, {}], 12: [function (require, module, exports) {
		/* http://keith-wood.name/svg.html
     SVG attribute animations for jQuery v1.5.0.
     Written by Keith Wood (kbwood{at}iinet.com.au) June 2008.
     Available under the MIT (http://keith-wood.name/licence.html) license. 
     Please attribute the author if you use it. */

		(function ($) {
			// Hide scope, no $ conflict

			var jQueryNew = parseInt($.fn.jquery, 10) > 1 || parseInt($.fn.jquery.substring(2), 10) > 5;

			// Enable animation for all of these SVG numeric attributes -
			// named as svg-* or svg* (with first character upper case)
			$.each(['x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'stroke-width', 'strokeWidth', 'opacity', 'fill-opacity', 'fillOpacity', 'stroke-opacity', 'strokeOpacity', 'stroke-dashoffset', 'strokeDashOffset', 'font-size', 'fontSize', 'font-weight', 'fontWeight', 'letter-spacing', 'letterSpacing', 'word-spacing', 'wordSpacing'], function (i, attrName) {
				var ccName = attrName.charAt(0).toUpperCase() + attrName.substr(1);
				if ($.cssProps) {
					$.cssProps['svg' + ccName] = $.cssProps['svg-' + attrName] = attrName;
				}
				$.fx.step['svg' + ccName] = $.fx.step['svg-' + attrName] = function (fx) {
					var realAttrName = $.svg._attrNames[attrName] || attrName;
					var attr = fx.elem.attributes.getNamedItem(realAttrName);
					if (!fx.set) {
						fx.start = attr ? parseFloat(attr.nodeValue) : 0;
						var offset = jQueryNew ? '' : fx.options.curAnim['svg' + ccName] || fx.options.curAnim['svg-' + attrName];
						if (/^[+-]=/.exec(offset)) {
							fx.end = fx.start + parseFloat(offset.replace(/=/, ''));
						}
						$(fx.elem).css(realAttrName, '');
						fx.set = true;
					}
					var value = fx.pos * (fx.end - fx.start) + fx.start + (fx.unit === '%' ? '%' : '');
					attr ? attr.nodeValue = value : fx.elem.setAttribute(realAttrName, value);
				};
			});

			// Enable animation for the SVG strokeDashArray attribute
			$.fx.step['svgStrokeDashArray'] = $.fx.step['svg-strokeDashArray'] = $.fx.step['svgStroke-dasharray'] = $.fx.step['svg-stroke-dasharray'] = function (fx) {
				var attr = fx.elem.attributes.getNamedItem('stroke-dasharray');
				if (!fx.set) {
					fx.start = parseDashArray(attr ? attr.nodeValue : '');
					var offset = jQueryNew ? fx.end : fx.options.curAnim['svgStrokeDashArray'] || fx.options.curAnim['svg-strokeDashArray'] || fx.options.curAnim['svgStroke-dasharray'] || fx.options.curAnim['svg-stroke-dasharray'];
					fx.end = parseDashArray(offset);
					if (/^[+-]=/.exec(offset)) {
						offset = offset.split(/[, ]+/);
						if (offset.length % 2 === 1) {
							// Must have an even number
							var len = offset.length;
							for (var i = 0; i < len; i++) {
								// So repeat
								offset.push(offset[i]);
							}
						}
						for (var i = 0; i < offset.length; i++) {
							if (/^[+-]=/.exec(offset[i])) {
								fx.end[i] = fx.start[i] + parseFloat(offset[i].replace(/=/, ''));
							}
						}
					}
					fx.set = true;
				}
				var value = $.map(fx.start, function (n, i) {
					return fx.pos * (fx.end[i] - n) + n;
				}).join(',');
				attr ? attr.nodeValue = value : fx.elem.setAttribute('stroke-dasharray', value);
			};

			/** Parse a strokeDashArray definition: dash, gap, ...
   	@private
   	@param value {string} The definition.
   	@return {number[]} The extracted values. */
			function parseDashArray(value) {
				var dashArray = value.split(/[, ]+/);
				for (var i = 0; i < dashArray.length; i++) {
					dashArray[i] = parseFloat(dashArray[i]);
					if (isNaN(dashArray[i])) {
						dashArray[i] = 0;
					}
				}
				if (dashArray.length % 2 === 1) {
					// Must have an even number
					var len = dashArray.length;
					for (var i = 0; i < len; i++) {
						// So repeat
						dashArray.push(dashArray[i]);
					}
				}
				return dashArray;
			}

			// Enable animation for the SVG viewBox attribute
			$.fx.step['svgViewBox'] = $.fx.step['svg-viewBox'] = function (fx) {
				var attr = fx.elem.attributes.getNamedItem('viewBox');
				if (!fx.set) {
					fx.start = parseViewBox(attr ? attr.nodeValue : '');
					var offset = jQueryNew ? fx.end : fx.options.curAnim['svgViewBox'] || fx.options.curAnim['svg-viewBox'];
					fx.end = parseViewBox(offset);
					if (/^[+-]=/.exec(offset)) {
						offset = offset.split(/[, ]+/);
						while (offset.length < 4) {
							offset.push('0');
						}
						for (var i = 0; i < 4; i++) {
							if (/^[+-]=/.exec(offset[i])) {
								fx.end[i] = fx.start[i] + parseFloat(offset[i].replace(/=/, ''));
							}
						}
					}
					fx.set = true;
				}
				var value = $.map(fx.start, function (n, i) {
					return fx.pos * (fx.end[i] - n) + n;
				}).join(' ');
				attr ? attr.nodeValue = value : fx.elem.setAttribute('viewBox', value);
			};

			/** Parse a viewBox definition: x, y, width, height.
   	@private
   	@param value {string} The definition.
   	@return {number[]} The extracted values. */
			function parseViewBox(value) {
				var viewBox = value.split(/[, ]+/);
				for (var i = 0; i < viewBox.length; i++) {
					viewBox[i] = parseFloat(viewBox[i]);
					if (isNaN(viewBox[i])) {
						viewBox[i] = 0;
					}
				}
				while (viewBox.length < 4) {
					viewBox.push(0);
				}
				return viewBox;
			}

			// Enable animation for the SVG transform attribute
			$.fx.step['svgTransform'] = $.fx.step['svg-transform'] = function (fx) {
				var attr = fx.elem.attributes.getNamedItem('transform');
				if (!fx.set) {
					fx.start = parseTransform(attr ? attr.nodeValue : '');
					fx.end = parseTransform(fx.end, fx.start);
					fx.set = true;
				}
				var transform = '';
				for (var i = 0; i < fx.end.order.length; i++) {
					switch (fx.end.order.charAt(i)) {
						case 't':
							transform += ' translate(' + (fx.pos * (fx.end.translateX - fx.start.translateX) + fx.start.translateX) + ',' + (fx.pos * (fx.end.translateY - fx.start.translateY) + fx.start.translateY) + ')';
							break;
						case 's':
							transform += ' scale(' + (fx.pos * (fx.end.scaleX - fx.start.scaleX) + fx.start.scaleX) + ',' + (fx.pos * (fx.end.scaleY - fx.start.scaleY) + fx.start.scaleY) + ')';
							break;
						case 'r':
							transform += ' rotate(' + (fx.pos * (fx.end.rotateA - fx.start.rotateA) + fx.start.rotateA) + ',' + (fx.pos * (fx.end.rotateX - fx.start.rotateX) + fx.start.rotateX) + ',' + (fx.pos * (fx.end.rotateY - fx.start.rotateY) + fx.start.rotateY) + ')';
							break;
						case 'x':
							transform += ' skewX(' + (fx.pos * (fx.end.skewX - fx.start.skewX) + fx.start.skewX) + ')';
						case 'y':
							transform += ' skewY(' + (fx.pos * (fx.end.skewY - fx.start.skewY) + fx.start.skewY) + ')';
							break;
						case 'm':
							var matrix = '';
							for (var j = 0; j < 6; j++) {
								matrix += ',' + (fx.pos * (fx.end.matrix[j] - fx.start.matrix[j]) + fx.start.matrix[j]);
							}
							transform += ' matrix(' + matrix.substr(1) + ')';
							break;
					}
				}
				attr ? attr.nodeValue = transform : fx.elem.setAttribute('transform', transform);
			};

			/** Decode a transform string and extract component values.
   	@private
   	@param value {string} The transform string to parse.
   	@param original {object} The settings from the original node.
   	@return {object} The combined transformation attributes. */
			function parseTransform(value, original) {
				value = value || '';
				if (typeof value === 'object') {
					value = value.nodeValue;
				}
				var transform = $.extend({ translateX: 0, translateY: 0, scaleX: 0, scaleY: 0,
					rotateA: 0, rotateX: 0, rotateY: 0, skewX: 0, skewY: 0, matrix: [0, 0, 0, 0, 0, 0] }, original || {});
				transform.order = '';
				var pattern = /([a-zA-Z]+)\(\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*(?:[\s,]\s*([+-]?[\d\.]+)\s*[\s,]\s*([+-]?[\d\.]+)\s*[\s,]\s*([+-]?[\d\.]+)\s*)?)?)?\)/g;
				var result = pattern.exec(value);
				while (result) {
					switch (result[1]) {
						case 'translate':
							transform.order += 't';
							transform.translateX = parseFloat(result[2]);
							transform.translateY = result[3] ? parseFloat(result[3]) : 0;
							break;
						case 'scale':
							transform.order += 's';
							transform.scaleX = parseFloat(result[2]);
							transform.scaleY = result[3] ? parseFloat(result[3]) : transform.scaleX;
							break;
						case 'rotate':
							transform.order += 'r';
							transform.rotateA = parseFloat(result[2]);
							transform.rotateX = result[3] ? parseFloat(result[3]) : 0;
							transform.rotateY = result[4] ? parseFloat(result[4]) : 0;
							break;
						case 'skewX':
							transform.order += 'x';
							transform.skewX = parseFloat(result[2]);
							break;
						case 'skewY':
							transform.order += 'y';
							transform.skewY = parseFloat(result[2]);
							break;
						case 'matrix':
							transform.order += 'm';
							transform.matrix = [parseFloat(result[2]), parseFloat(result[3]), parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6]), parseFloat(result[7])];
							break;
					}
					result = pattern.exec(value);
				}
				if (transform.order === 'm' && Math.abs(transform.matrix[0]) === Math.abs(transform.matrix[3]) && transform.matrix[1] !== 0 && Math.abs(transform.matrix[1]) === Math.abs(transform.matrix[2])) {
					// Simple rotate about origin and translate
					var angle = Math.acos(transform.matrix[0]) * 180 / Math.PI;
					angle = transform.matrix[1] < 0 ? 360 - angle : angle;
					transform.order = 'rt';
					transform.rotateA = angle;
					transform.rotateX = transform.rotateY = 0;
					transform.translateX = transform.matrix[4];
					transform.translateY = transform.matrix[5];
				}
				return transform;
			}

			// Enable animation for all of these SVG colour properties - based on jquery.color.js
			$.each(['fill', 'stroke'], function (i, attrName) {
				var ccName = attrName.charAt(0).toUpperCase() + attrName.substr(1);
				$.fx.step['svg' + ccName] = $.fx.step['svg-' + attrName] = function (fx) {
					if (!fx.set) {
						fx.start = $.svg._getColour(fx.elem, attrName);
						var toNone = fx.end === 'none';
						fx.end = toNone ? $.svg._getColour(fx.elem.parentNode, attrName) : $.svg._getRGB(fx.end);
						fx.end[3] = toNone;
						$(fx.elem).css(attrName, '');
						fx.set = true;
					}
					var colour = 'rgb(' + [Math.min(Math.max(parseInt(fx.pos * (fx.end[0] - fx.start[0]) + fx.start[0], 10), 0), 255), Math.min(Math.max(parseInt(fx.pos * (fx.end[1] - fx.start[1]) + fx.start[1], 10), 0), 255), Math.min(Math.max(parseInt(fx.pos * (fx.end[2] - fx.start[2]) + fx.start[2], 10), 0), 255)].join(',') + ')';
					colour = fx.end[3] && fx.state === 1 ? 'none' : colour;
					var attr = fx.elem.attributes.getNamedItem(attrName);
					attr ? attr.nodeValue = colour : fx.elem.setAttribute(attrName, colour);
				};
			});

			/** Find this attribute value somewhere up the node hierarchy.
   	@private
   	@param elem {SVGElement} The starting element to find the attribute.
   	@param attr {string} The attribute name.
   	@return {number[]} RGB components for the attribute colour. */
			$.svg._getColour = function (elem, attr) {
				elem = $(elem);
				var colour;
				do {
					colour = elem.attr(attr) || elem.css(attr);
					// Keep going until we find an element that has colour, or exit SVG
					if (colour !== '' && colour !== 'none' || elem.hasClass($.svg.markerClassName)) {
						break;
					}
				} while (elem = elem.parent());
				return $.svg._getRGB(colour);
			};

			/** Parse strings looking for common colour formats.
   	@private
   	@param colour {string} Colour description to parse.
   	@return {number[]} RGB components of this colour. */
			$.svg._getRGB = function (colour) {
				var result;
				// Check if we're already dealing with an array of colors
				if (colour && colour.constructor === Array) {
					return colour.length === 3 || colour.length === 4 ? colour : colours['none'];
				}
				// Look for rgb(num,num,num)
				if (result = /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/.exec(colour)) {
					return [parseInt(result[1], 10), parseInt(result[2], 10), parseInt(result[3], 10)];
				}
				// Look for rgb(num%,num%,num%)
				if (result = /^rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)$/.exec(colour)) {
					return [parseFloat(result[1]) * 2.55, parseFloat(result[2]) * 2.55, parseFloat(result[3]) * 2.55];
				}
				// Look for #a0b1c2
				if (result = /^#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/.exec(colour)) {
					return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
				}
				// Look for #abc
				if (result = /^#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])$/.exec(colour)) {
					return [parseInt(result[1] + result[1], 16), parseInt(result[2] + result[2], 16), parseInt(result[3] + result[3], 16)];
				}
				// Otherwise, we're most likely dealing with a named color
				return colours[$.trim(colour).toLowerCase()] || colours['none'];
			};

			// The SVG named colours
			var colours = {
				'': [255, 255, 255, 1],
				none: [255, 255, 255, 1],
				aliceblue: [240, 248, 255],
				antiquewhite: [250, 235, 215],
				aqua: [0, 255, 255],
				aquamarine: [127, 255, 212],
				azure: [240, 255, 255],
				beige: [245, 245, 220],
				bisque: [255, 228, 196],
				black: [0, 0, 0],
				blanchedalmond: [255, 235, 205],
				blue: [0, 0, 255],
				blueviolet: [138, 43, 226],
				brown: [165, 42, 42],
				burlywood: [222, 184, 135],
				cadetblue: [95, 158, 160],
				chartreuse: [127, 255, 0],
				chocolate: [210, 105, 30],
				coral: [255, 127, 80],
				cornflowerblue: [100, 149, 237],
				cornsilk: [255, 248, 220],
				crimson: [220, 20, 60],
				cyan: [0, 255, 255],
				darkblue: [0, 0, 139],
				darkcyan: [0, 139, 139],
				darkgoldenrod: [184, 134, 11],
				darkgray: [169, 169, 169],
				darkgreen: [0, 100, 0],
				darkgrey: [169, 169, 169],
				darkkhaki: [189, 183, 107],
				darkmagenta: [139, 0, 139],
				darkolivegreen: [85, 107, 47],
				darkorange: [255, 140, 0],
				darkorchid: [153, 50, 204],
				darkred: [139, 0, 0],
				darksalmon: [233, 150, 122],
				darkseagreen: [143, 188, 143],
				darkslateblue: [72, 61, 139],
				darkslategray: [47, 79, 79],
				darkslategrey: [47, 79, 79],
				darkturquoise: [0, 206, 209],
				darkviolet: [148, 0, 211],
				deeppink: [255, 20, 147],
				deepskyblue: [0, 191, 255],
				dimgray: [105, 105, 105],
				dimgrey: [105, 105, 105],
				dodgerblue: [30, 144, 255],
				firebrick: [178, 34, 34],
				floralwhite: [255, 250, 240],
				forestgreen: [34, 139, 34],
				fuchsia: [255, 0, 255],
				gainsboro: [220, 220, 220],
				ghostwhite: [248, 248, 255],
				gold: [255, 215, 0],
				goldenrod: [218, 165, 32],
				gray: [128, 128, 128],
				grey: [128, 128, 128],
				green: [0, 128, 0],
				greenyellow: [173, 255, 47],
				honeydew: [240, 255, 240],
				hotpink: [255, 105, 180],
				indianred: [205, 92, 92],
				indigo: [75, 0, 130],
				ivory: [255, 255, 240],
				khaki: [240, 230, 140],
				lavender: [230, 230, 250],
				lavenderblush: [255, 240, 245],
				lawngreen: [124, 252, 0],
				lemonchiffon: [255, 250, 205],
				lightblue: [173, 216, 230],
				lightcoral: [240, 128, 128],
				lightcyan: [224, 255, 255],
				lightgoldenrodyellow: [250, 250, 210],
				lightgray: [211, 211, 211],
				lightgreen: [144, 238, 144],
				lightgrey: [211, 211, 211],
				lightpink: [255, 182, 193],
				lightsalmon: [255, 160, 122],
				lightseagreen: [32, 178, 170],
				lightskyblue: [135, 206, 250],
				lightslategray: [119, 136, 153],
				lightslategrey: [119, 136, 153],
				lightsteelblue: [176, 196, 222],
				lightyellow: [255, 255, 224],
				lime: [0, 255, 0],
				limegreen: [50, 205, 50],
				linen: [250, 240, 230],
				magenta: [255, 0, 255],
				maroon: [128, 0, 0],
				mediumaquamarine: [102, 205, 170],
				mediumblue: [0, 0, 205],
				mediumorchid: [186, 85, 211],
				mediumpurple: [147, 112, 219],
				mediumseagreen: [60, 179, 113],
				mediumslateblue: [123, 104, 238],
				mediumspringgreen: [0, 250, 154],
				mediumturquoise: [72, 209, 204],
				mediumvioletred: [199, 21, 133],
				midnightblue: [25, 25, 112],
				mintcream: [245, 255, 250],
				mistyrose: [255, 228, 225],
				moccasin: [255, 228, 181],
				navajowhite: [255, 222, 173],
				navy: [0, 0, 128],
				oldlace: [253, 245, 230],
				olive: [128, 128, 0],
				olivedrab: [107, 142, 35],
				orange: [255, 165, 0],
				orangered: [255, 69, 0],
				orchid: [218, 112, 214],
				palegoldenrod: [238, 232, 170],
				palegreen: [152, 251, 152],
				paleturquoise: [175, 238, 238],
				palevioletred: [219, 112, 147],
				papayawhip: [255, 239, 213],
				peachpuff: [255, 218, 185],
				peru: [205, 133, 63],
				pink: [255, 192, 203],
				plum: [221, 160, 221],
				powderblue: [176, 224, 230],
				purple: [128, 0, 128],
				red: [255, 0, 0],
				rosybrown: [188, 143, 143],
				royalblue: [65, 105, 225],
				saddlebrown: [139, 69, 19],
				salmon: [250, 128, 114],
				sandybrown: [244, 164, 96],
				seagreen: [46, 139, 87],
				seashell: [255, 245, 238],
				sienna: [160, 82, 45],
				silver: [192, 192, 192],
				skyblue: [135, 206, 235],
				slateblue: [106, 90, 205],
				slategray: [112, 128, 144],
				slategrey: [112, 128, 144],
				snow: [255, 250, 250],
				springgreen: [0, 255, 127],
				steelblue: [70, 130, 180],
				tan: [210, 180, 140],
				teal: [0, 128, 128],
				thistle: [216, 191, 216],
				tomato: [255, 99, 71],
				turquoise: [64, 224, 208],
				violet: [238, 130, 238],
				wheat: [245, 222, 179],
				white: [255, 255, 255],
				whitesmoke: [245, 245, 245],
				yellow: [255, 255, 0],
				yellowgreen: [154, 205, 50]
			};
		})(jQuery);
	}, {}], 13: [function (require, module, exports) {
		(function (global) {
			(function (f) {
				if (typeof exports === "object" && typeof module !== "undefined") {
					module.exports = f();
				} else if (typeof define === "function" && define.amd) {
					define([], f);
				} else {
					var g;if (typeof window !== "undefined") {
						g = window;
					} else if (typeof global !== "undefined") {
						g = global;
					} else if (typeof self !== "undefined") {
						g = self;
					} else {
						g = this;
					}g.io = f();
				}
			})(function () {
				var define, module, exports;return function e(t, n, r) {
					function s(o, u) {
						if (!n[o]) {
							if (!t[o]) {
								var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw f.code = "MODULE_NOT_FOUND", f;
							}var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
								var n = t[o][1][e];return s(n ? n : e);
							}, l, l.exports, e, t, n, r);
						}return n[o].exports;
					}var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
				}({ 1: [function (_dereq_, module, exports) {
						module.exports = _dereq_("./lib/");
					}, { "./lib/": 2 }], 2: [function (_dereq_, module, exports) {
						module.exports = _dereq_("./socket");module.exports.parser = _dereq_("engine.io-parser");
					}, { "./socket": 3, "engine.io-parser": 19 }], 3: [function (_dereq_, module, exports) {
						(function (global) {
							var transports = _dereq_("./transports");var Emitter = _dereq_("component-emitter");var debug = _dereq_("debug")("engine.io-client:socket");var index = _dereq_("indexof");var parser = _dereq_("engine.io-parser");var parseuri = _dereq_("parseuri");var parsejson = _dereq_("parsejson");var parseqs = _dereq_("parseqs");module.exports = Socket;function noop() {}function Socket(uri, opts) {
								if (!(this instanceof Socket)) return new Socket(uri, opts);opts = opts || {};if (uri && "object" == typeof uri) {
									opts = uri;uri = null;
								}if (uri) {
									uri = parseuri(uri);opts.hostname = uri.host;opts.secure = uri.protocol == "https" || uri.protocol == "wss";opts.port = uri.port;if (uri.query) opts.query = uri.query;
								} else if (opts.host) {
									opts.hostname = parseuri(opts.host).host;
								}this.secure = null != opts.secure ? opts.secure : global.location && "https:" == location.protocol;if (opts.hostname && !opts.port) {
									opts.port = this.secure ? "443" : "80";
								}this.agent = opts.agent || false;this.hostname = opts.hostname || (global.location ? location.hostname : "localhost");this.port = opts.port || (global.location && location.port ? location.port : this.secure ? 443 : 80);this.query = opts.query || {};if ("string" == typeof this.query) this.query = parseqs.decode(this.query);this.upgrade = false !== opts.upgrade;this.path = (opts.path || "/engine.io").replace(/\/$/, "") + "/";this.forceJSONP = !!opts.forceJSONP;this.jsonp = false !== opts.jsonp;this.forceBase64 = !!opts.forceBase64;this.enablesXDR = !!opts.enablesXDR;this.timestampParam = opts.timestampParam || "t";this.timestampRequests = opts.timestampRequests;this.transports = opts.transports || ["polling", "websocket"];this.readyState = "";this.writeBuffer = [];this.policyPort = opts.policyPort || 843;this.rememberUpgrade = opts.rememberUpgrade || false;this.binaryType = null;this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;this.perMessageDeflate = false !== opts.perMessageDeflate ? opts.perMessageDeflate || {} : false;if (true === this.perMessageDeflate) this.perMessageDeflate = {};if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
									this.perMessageDeflate.threshold = 1024;
								}this.pfx = opts.pfx || null;this.key = opts.key || null;this.passphrase = opts.passphrase || null;this.cert = opts.cert || null;this.ca = opts.ca || null;this.ciphers = opts.ciphers || null;this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? null : opts.rejectUnauthorized;var freeGlobal = typeof global == "object" && global;if (freeGlobal.global === freeGlobal) {
									if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
										this.extraHeaders = opts.extraHeaders;
									}
								}this.open();
							}Socket.priorWebsocketSuccess = false;Emitter(Socket.prototype);Socket.protocol = parser.protocol;Socket.Socket = Socket;Socket.Transport = _dereq_("./transport");Socket.transports = _dereq_("./transports");Socket.parser = _dereq_("engine.io-parser");Socket.prototype.createTransport = function (name) {
								debug('creating transport "%s"', name);var query = clone(this.query);query.EIO = parser.protocol;query.transport = name;if (this.id) query.sid = this.id;var transport = new transports[name]({ agent: this.agent, hostname: this.hostname, port: this.port, secure: this.secure, path: this.path, query: query, forceJSONP: this.forceJSONP, jsonp: this.jsonp, forceBase64: this.forceBase64, enablesXDR: this.enablesXDR, timestampRequests: this.timestampRequests, timestampParam: this.timestampParam, policyPort: this.policyPort, socket: this, pfx: this.pfx, key: this.key, passphrase: this.passphrase, cert: this.cert, ca: this.ca, ciphers: this.ciphers, rejectUnauthorized: this.rejectUnauthorized, perMessageDeflate: this.perMessageDeflate, extraHeaders: this.extraHeaders });return transport;
							};function clone(obj) {
								var o = {};for (var i in obj) {
									if (obj.hasOwnProperty(i)) {
										o[i] = obj[i];
									}
								}return o;
							}Socket.prototype.open = function () {
								var transport;if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") != -1) {
									transport = "websocket";
								} else if (0 === this.transports.length) {
									var self = this;setTimeout(function () {
										self.emit("error", "No transports available");
									}, 0);return;
								} else {
									transport = this.transports[0];
								}this.readyState = "opening";try {
									transport = this.createTransport(transport);
								} catch (e) {
									this.transports.shift();this.open();return;
								}transport.open();this.setTransport(transport);
							};Socket.prototype.setTransport = function (transport) {
								debug("setting transport %s", transport.name);var self = this;if (this.transport) {
									debug("clearing existing transport %s", this.transport.name);this.transport.removeAllListeners();
								}this.transport = transport;transport.on("drain", function () {
									self.onDrain();
								}).on("packet", function (packet) {
									self.onPacket(packet);
								}).on("error", function (e) {
									self.onError(e);
								}).on("close", function () {
									self.onClose("transport close");
								});
							};Socket.prototype.probe = function (name) {
								debug('probing transport "%s"', name);var transport = this.createTransport(name, { probe: 1 }),
								    failed = false,
								    self = this;Socket.priorWebsocketSuccess = false;function onTransportOpen() {
									if (self.onlyBinaryUpgrades) {
										var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;failed = failed || upgradeLosesBinary;
									}if (failed) return;debug('probe transport "%s" opened', name);transport.send([{ type: "ping", data: "probe" }]);transport.once("packet", function (msg) {
										if (failed) return;if ("pong" == msg.type && "probe" == msg.data) {
											debug('probe transport "%s" pong', name);self.upgrading = true;self.emit("upgrading", transport);if (!transport) return;Socket.priorWebsocketSuccess = "websocket" == transport.name;debug('pausing current transport "%s"', self.transport.name);self.transport.pause(function () {
												if (failed) return;if ("closed" == self.readyState) return;debug("changing transport and sending upgrade packet");cleanup();self.setTransport(transport);transport.send([{ type: "upgrade" }]);self.emit("upgrade", transport);transport = null;self.upgrading = false;self.flush();
											});
										} else {
											debug('probe transport "%s" failed', name);var err = new Error("probe error");err.transport = transport.name;self.emit("upgradeError", err);
										}
									});
								}function freezeTransport() {
									if (failed) return;failed = true;cleanup();transport.close();transport = null;
								}function onerror(err) {
									var error = new Error("probe error: " + err);error.transport = transport.name;freezeTransport();debug('probe transport "%s" failed because of error: %s', name, err);self.emit("upgradeError", error);
								}function onTransportClose() {
									onerror("transport closed");
								}function onclose() {
									onerror("socket closed");
								}function onupgrade(to) {
									if (transport && to.name != transport.name) {
										debug('"%s" works - aborting "%s"', to.name, transport.name);freezeTransport();
									}
								}function cleanup() {
									transport.removeListener("open", onTransportOpen);transport.removeListener("error", onerror);transport.removeListener("close", onTransportClose);self.removeListener("close", onclose);self.removeListener("upgrading", onupgrade);
								}transport.once("open", onTransportOpen);transport.once("error", onerror);transport.once("close", onTransportClose);this.once("close", onclose);this.once("upgrading", onupgrade);transport.open();
							};Socket.prototype.onOpen = function () {
								debug("socket open");this.readyState = "open";Socket.priorWebsocketSuccess = "websocket" == this.transport.name;this.emit("open");this.flush();if ("open" == this.readyState && this.upgrade && this.transport.pause) {
									debug("starting upgrade probes");for (var i = 0, l = this.upgrades.length; i < l; i++) {
										this.probe(this.upgrades[i]);
									}
								}
							};Socket.prototype.onPacket = function (packet) {
								if ("opening" == this.readyState || "open" == this.readyState) {
									debug('socket receive: type "%s", data "%s"', packet.type, packet.data);this.emit("packet", packet);this.emit("heartbeat");switch (packet.type) {case "open":
											this.onHandshake(parsejson(packet.data));break;case "pong":
											this.setPing();this.emit("pong");break;case "error":
											var err = new Error("server error");err.code = packet.data;this.onError(err);break;case "message":
											this.emit("data", packet.data);this.emit("message", packet.data);break;}
								} else {
									debug('packet received with socket readyState "%s"', this.readyState);
								}
							};Socket.prototype.onHandshake = function (data) {
								this.emit("handshake", data);this.id = data.sid;this.transport.query.sid = data.sid;this.upgrades = this.filterUpgrades(data.upgrades);this.pingInterval = data.pingInterval;this.pingTimeout = data.pingTimeout;this.onOpen();if ("closed" == this.readyState) return;this.setPing();this.removeListener("heartbeat", this.onHeartbeat);this.on("heartbeat", this.onHeartbeat);
							};Socket.prototype.onHeartbeat = function (timeout) {
								clearTimeout(this.pingTimeoutTimer);var self = this;self.pingTimeoutTimer = setTimeout(function () {
									if ("closed" == self.readyState) return;self.onClose("ping timeout");
								}, timeout || self.pingInterval + self.pingTimeout);
							};Socket.prototype.setPing = function () {
								var self = this;clearTimeout(self.pingIntervalTimer);self.pingIntervalTimer = setTimeout(function () {
									debug("writing ping packet - expecting pong within %sms", self.pingTimeout);self.ping();self.onHeartbeat(self.pingTimeout);
								}, self.pingInterval);
							};Socket.prototype.ping = function () {
								var self = this;this.sendPacket("ping", function () {
									self.emit("ping");
								});
							};Socket.prototype.onDrain = function () {
								this.writeBuffer.splice(0, this.prevBufferLen);this.prevBufferLen = 0;if (0 === this.writeBuffer.length) {
									this.emit("drain");
								} else {
									this.flush();
								}
							};Socket.prototype.flush = function () {
								if ("closed" != this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
									debug("flushing %d packets in socket", this.writeBuffer.length);this.transport.send(this.writeBuffer);this.prevBufferLen = this.writeBuffer.length;this.emit("flush");
								}
							};Socket.prototype.write = Socket.prototype.send = function (msg, options, fn) {
								this.sendPacket("message", msg, options, fn);return this;
							};Socket.prototype.sendPacket = function (type, data, options, fn) {
								if ("function" == typeof data) {
									fn = data;data = undefined;
								}if ("function" == typeof options) {
									fn = options;options = null;
								}if ("closing" == this.readyState || "closed" == this.readyState) {
									return;
								}options = options || {};options.compress = false !== options.compress;var packet = { type: type, data: data, options: options };this.emit("packetCreate", packet);this.writeBuffer.push(packet);if (fn) this.once("flush", fn);this.flush();
							};Socket.prototype.close = function () {
								if ("opening" == this.readyState || "open" == this.readyState) {
									this.readyState = "closing";var self = this;if (this.writeBuffer.length) {
										this.once("drain", function () {
											if (this.upgrading) {
												waitForUpgrade();
											} else {
												close();
											}
										});
									} else if (this.upgrading) {
										waitForUpgrade();
									} else {
										close();
									}
								}function close() {
									self.onClose("forced close");debug("socket closing - telling transport to close");self.transport.close();
								}function cleanupAndClose() {
									self.removeListener("upgrade", cleanupAndClose);self.removeListener("upgradeError", cleanupAndClose);close();
								}function waitForUpgrade() {
									self.once("upgrade", cleanupAndClose);self.once("upgradeError", cleanupAndClose);
								}return this;
							};Socket.prototype.onError = function (err) {
								debug("socket error %j", err);Socket.priorWebsocketSuccess = false;this.emit("error", err);this.onClose("transport error", err);
							};Socket.prototype.onClose = function (reason, desc) {
								if ("opening" == this.readyState || "open" == this.readyState || "closing" == this.readyState) {
									debug('socket close with reason: "%s"', reason);var self = this;clearTimeout(this.pingIntervalTimer);clearTimeout(this.pingTimeoutTimer);this.transport.removeAllListeners("close");this.transport.close();this.transport.removeAllListeners();this.readyState = "closed";this.id = null;this.emit("close", reason, desc);self.writeBuffer = [];self.prevBufferLen = 0;
								}
							};Socket.prototype.filterUpgrades = function (upgrades) {
								var filteredUpgrades = [];for (var i = 0, j = upgrades.length; i < j; i++) {
									if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
								}return filteredUpgrades;
							};
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "./transport": 4, "./transports": 5, "component-emitter": 15, debug: 17, "engine.io-parser": 19, indexof: 23, parsejson: 26, parseqs: 27, parseuri: 28 }], 4: [function (_dereq_, module, exports) {
						var parser = _dereq_("engine.io-parser");var Emitter = _dereq_("component-emitter");module.exports = Transport;function Transport(opts) {
							this.path = opts.path;this.hostname = opts.hostname;this.port = opts.port;this.secure = opts.secure;this.query = opts.query;this.timestampParam = opts.timestampParam;this.timestampRequests = opts.timestampRequests;this.readyState = "";this.agent = opts.agent || false;this.socket = opts.socket;this.enablesXDR = opts.enablesXDR;this.pfx = opts.pfx;this.key = opts.key;this.passphrase = opts.passphrase;this.cert = opts.cert;this.ca = opts.ca;this.ciphers = opts.ciphers;this.rejectUnauthorized = opts.rejectUnauthorized;this.extraHeaders = opts.extraHeaders;
						}Emitter(Transport.prototype);Transport.prototype.onError = function (msg, desc) {
							var err = new Error(msg);err.type = "TransportError";err.description = desc;this.emit("error", err);return this;
						};Transport.prototype.open = function () {
							if ("closed" == this.readyState || "" == this.readyState) {
								this.readyState = "opening";this.doOpen();
							}return this;
						};Transport.prototype.close = function () {
							if ("opening" == this.readyState || "open" == this.readyState) {
								this.doClose();this.onClose();
							}return this;
						};Transport.prototype.send = function (packets) {
							if ("open" == this.readyState) {
								this.write(packets);
							} else {
								throw new Error("Transport not open");
							}
						};Transport.prototype.onOpen = function () {
							this.readyState = "open";this.writable = true;this.emit("open");
						};Transport.prototype.onData = function (data) {
							var packet = parser.decodePacket(data, this.socket.binaryType);this.onPacket(packet);
						};Transport.prototype.onPacket = function (packet) {
							this.emit("packet", packet);
						};Transport.prototype.onClose = function () {
							this.readyState = "closed";this.emit("close");
						};
					}, { "component-emitter": 15, "engine.io-parser": 19 }], 5: [function (_dereq_, module, exports) {
						(function (global) {
							var XMLHttpRequest = _dereq_("xmlhttprequest-ssl");var XHR = _dereq_("./polling-xhr");var JSONP = _dereq_("./polling-jsonp");var websocket = _dereq_("./websocket");exports.polling = polling;exports.websocket = websocket;function polling(opts) {
								var xhr;var xd = false;var xs = false;var jsonp = false !== opts.jsonp;if (global.location) {
									var isSSL = "https:" == location.protocol;var port = location.port;if (!port) {
										port = isSSL ? 443 : 80;
									}xd = opts.hostname != location.hostname || port != opts.port;xs = opts.secure != isSSL;
								}opts.xdomain = xd;opts.xscheme = xs;xhr = new XMLHttpRequest(opts);if ("open" in xhr && !opts.forceJSONP) {
									return new XHR(opts);
								} else {
									if (!jsonp) throw new Error("JSONP disabled");return new JSONP(opts);
								}
							}
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "./polling-jsonp": 6, "./polling-xhr": 7, "./websocket": 9, "xmlhttprequest-ssl": 10 }], 6: [function (_dereq_, module, exports) {
						(function (global) {
							var Polling = _dereq_("./polling");var inherit = _dereq_("component-inherit");module.exports = JSONPPolling;var rNewline = /\n/g;var rEscapedNewline = /\\n/g;var callbacks;var index = 0;function empty() {}function JSONPPolling(opts) {
								Polling.call(this, opts);this.query = this.query || {};if (!callbacks) {
									if (!global.___eio) global.___eio = [];callbacks = global.___eio;
								}this.index = callbacks.length;var self = this;callbacks.push(function (msg) {
									self.onData(msg);
								});this.query.j = this.index;if (global.document && global.addEventListener) {
									global.addEventListener("beforeunload", function () {
										if (self.script) self.script.onerror = empty;
									}, false);
								}
							}inherit(JSONPPolling, Polling);JSONPPolling.prototype.supportsBinary = false;JSONPPolling.prototype.doClose = function () {
								if (this.script) {
									this.script.parentNode.removeChild(this.script);this.script = null;
								}if (this.form) {
									this.form.parentNode.removeChild(this.form);this.form = null;this.iframe = null;
								}Polling.prototype.doClose.call(this);
							};JSONPPolling.prototype.doPoll = function () {
								var self = this;var script = document.createElement("script");if (this.script) {
									this.script.parentNode.removeChild(this.script);this.script = null;
								}script.async = true;script.src = this.uri();script.onerror = function (e) {
									self.onError("jsonp poll error", e);
								};var insertAt = document.getElementsByTagName("script")[0];if (insertAt) {
									insertAt.parentNode.insertBefore(script, insertAt);
								} else {
									(document.head || document.body).appendChild(script);
								}this.script = script;var isUAgecko = "undefined" != typeof navigator && /gecko/i.test(navigator.userAgent);if (isUAgecko) {
									setTimeout(function () {
										var iframe = document.createElement("iframe");document.body.appendChild(iframe);document.body.removeChild(iframe);
									}, 100);
								}
							};JSONPPolling.prototype.doWrite = function (data, fn) {
								var self = this;if (!this.form) {
									var form = document.createElement("form");var area = document.createElement("textarea");var id = this.iframeId = "eio_iframe_" + this.index;var iframe;form.className = "socketio";form.style.position = "absolute";form.style.top = "-1000px";form.style.left = "-1000px";form.target = id;form.method = "POST";form.setAttribute("accept-charset", "utf-8");area.name = "d";form.appendChild(area);document.body.appendChild(form);this.form = form;this.area = area;
								}this.form.action = this.uri();function complete() {
									initIframe();fn();
								}function initIframe() {
									if (self.iframe) {
										try {
											self.form.removeChild(self.iframe);
										} catch (e) {
											self.onError("jsonp polling iframe removal error", e);
										}
									}try {
										var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';iframe = document.createElement(html);
									} catch (e) {
										iframe = document.createElement("iframe");iframe.name = self.iframeId;iframe.src = "javascript:0";
									}iframe.id = self.iframeId;self.form.appendChild(iframe);self.iframe = iframe;
								}initIframe();data = data.replace(rEscapedNewline, "\\\n");this.area.value = data.replace(rNewline, "\\n");try {
									this.form.submit();
								} catch (e) {}if (this.iframe.attachEvent) {
									this.iframe.onreadystatechange = function () {
										if (self.iframe.readyState == "complete") {
											complete();
										}
									};
								} else {
									this.iframe.onload = complete;
								}
							};
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "./polling": 8, "component-inherit": 16 }], 7: [function (_dereq_, module, exports) {
						(function (global) {
							var XMLHttpRequest = _dereq_("xmlhttprequest-ssl");var Polling = _dereq_("./polling");var Emitter = _dereq_("component-emitter");var inherit = _dereq_("component-inherit");var debug = _dereq_("debug")("engine.io-client:polling-xhr");module.exports = XHR;module.exports.Request = Request;function empty() {}function XHR(opts) {
								Polling.call(this, opts);if (global.location) {
									var isSSL = "https:" == location.protocol;var port = location.port;if (!port) {
										port = isSSL ? 443 : 80;
									}this.xd = opts.hostname != global.location.hostname || port != opts.port;this.xs = opts.secure != isSSL;
								} else {
									this.extraHeaders = opts.extraHeaders;
								}
							}inherit(XHR, Polling);XHR.prototype.supportsBinary = true;XHR.prototype.request = function (opts) {
								opts = opts || {};opts.uri = this.uri();opts.xd = this.xd;opts.xs = this.xs;opts.agent = this.agent || false;opts.supportsBinary = this.supportsBinary;opts.enablesXDR = this.enablesXDR;opts.pfx = this.pfx;opts.key = this.key;opts.passphrase = this.passphrase;opts.cert = this.cert;opts.ca = this.ca;opts.ciphers = this.ciphers;opts.rejectUnauthorized = this.rejectUnauthorized;opts.extraHeaders = this.extraHeaders;return new Request(opts);
							};XHR.prototype.doWrite = function (data, fn) {
								var isBinary = typeof data !== "string" && data !== undefined;var req = this.request({ method: "POST", data: data, isBinary: isBinary });var self = this;req.on("success", fn);req.on("error", function (err) {
									self.onError("xhr post error", err);
								});this.sendXhr = req;
							};XHR.prototype.doPoll = function () {
								debug("xhr poll");var req = this.request();var self = this;req.on("data", function (data) {
									self.onData(data);
								});req.on("error", function (err) {
									self.onError("xhr poll error", err);
								});this.pollXhr = req;
							};function Request(opts) {
								this.method = opts.method || "GET";this.uri = opts.uri;this.xd = !!opts.xd;this.xs = !!opts.xs;this.async = false !== opts.async;this.data = undefined != opts.data ? opts.data : null;this.agent = opts.agent;this.isBinary = opts.isBinary;this.supportsBinary = opts.supportsBinary;this.enablesXDR = opts.enablesXDR;this.pfx = opts.pfx;this.key = opts.key;this.passphrase = opts.passphrase;this.cert = opts.cert;this.ca = opts.ca;this.ciphers = opts.ciphers;this.rejectUnauthorized = opts.rejectUnauthorized;this.extraHeaders = opts.extraHeaders;this.create();
							}Emitter(Request.prototype);Request.prototype.create = function () {
								var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };opts.pfx = this.pfx;opts.key = this.key;opts.passphrase = this.passphrase;opts.cert = this.cert;opts.ca = this.ca;opts.ciphers = this.ciphers;opts.rejectUnauthorized = this.rejectUnauthorized;var xhr = this.xhr = new XMLHttpRequest(opts);var self = this;try {
									debug("xhr open %s: %s", this.method, this.uri);xhr.open(this.method, this.uri, this.async);try {
										if (this.extraHeaders) {
											xhr.setDisableHeaderCheck(true);for (var i in this.extraHeaders) {
												if (this.extraHeaders.hasOwnProperty(i)) {
													xhr.setRequestHeader(i, this.extraHeaders[i]);
												}
											}
										}
									} catch (e) {}if (this.supportsBinary) {
										xhr.responseType = "arraybuffer";
									}if ("POST" == this.method) {
										try {
											if (this.isBinary) {
												xhr.setRequestHeader("Content-type", "application/octet-stream");
											} else {
												xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
											}
										} catch (e) {}
									}if ("withCredentials" in xhr) {
										xhr.withCredentials = true;
									}if (this.hasXDR()) {
										xhr.onload = function () {
											self.onLoad();
										};xhr.onerror = function () {
											self.onError(xhr.responseText);
										};
									} else {
										xhr.onreadystatechange = function () {
											if (4 != xhr.readyState) return;if (200 == xhr.status || 1223 == xhr.status) {
												self.onLoad();
											} else {
												setTimeout(function () {
													self.onError(xhr.status);
												}, 0);
											}
										};
									}debug("xhr data %s", this.data);xhr.send(this.data);
								} catch (e) {
									setTimeout(function () {
										self.onError(e);
									}, 0);return;
								}if (global.document) {
									this.index = Request.requestsCount++;Request.requests[this.index] = this;
								}
							};Request.prototype.onSuccess = function () {
								this.emit("success");this.cleanup();
							};Request.prototype.onData = function (data) {
								this.emit("data", data);this.onSuccess();
							};Request.prototype.onError = function (err) {
								this.emit("error", err);this.cleanup(true);
							};Request.prototype.cleanup = function (fromError) {
								if ("undefined" == typeof this.xhr || null === this.xhr) {
									return;
								}if (this.hasXDR()) {
									this.xhr.onload = this.xhr.onerror = empty;
								} else {
									this.xhr.onreadystatechange = empty;
								}if (fromError) {
									try {
										this.xhr.abort();
									} catch (e) {}
								}if (global.document) {
									delete Request.requests[this.index];
								}this.xhr = null;
							};Request.prototype.onLoad = function () {
								var data;try {
									var contentType;try {
										contentType = this.xhr.getResponseHeader("Content-Type").split(";")[0];
									} catch (e) {}if (contentType === "application/octet-stream") {
										data = this.xhr.response;
									} else {
										if (!this.supportsBinary) {
											data = this.xhr.responseText;
										} else {
											try {
												data = String.fromCharCode.apply(null, new Uint8Array(this.xhr.response));
											} catch (e) {
												var ui8Arr = new Uint8Array(this.xhr.response);var dataArray = [];for (var idx = 0, length = ui8Arr.length; idx < length; idx++) {
													dataArray.push(ui8Arr[idx]);
												}data = String.fromCharCode.apply(null, dataArray);
											}
										}
									}
								} catch (e) {
									this.onError(e);
								}if (null != data) {
									this.onData(data);
								}
							};Request.prototype.hasXDR = function () {
								return "undefined" !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
							};Request.prototype.abort = function () {
								this.cleanup();
							};if (global.document) {
								Request.requestsCount = 0;Request.requests = {};if (global.attachEvent) {
									global.attachEvent("onunload", unloadHandler);
								} else if (global.addEventListener) {
									global.addEventListener("beforeunload", unloadHandler, false);
								}
							}function unloadHandler() {
								for (var i in Request.requests) {
									if (Request.requests.hasOwnProperty(i)) {
										Request.requests[i].abort();
									}
								}
							}
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "./polling": 8, "component-emitter": 15, "component-inherit": 16, debug: 17, "xmlhttprequest-ssl": 10 }], 8: [function (_dereq_, module, exports) {
						var Transport = _dereq_("../transport");var parseqs = _dereq_("parseqs");var parser = _dereq_("engine.io-parser");var inherit = _dereq_("component-inherit");var yeast = _dereq_("yeast");var debug = _dereq_("debug")("engine.io-client:polling");module.exports = Polling;var hasXHR2 = function () {
							var XMLHttpRequest = _dereq_("xmlhttprequest-ssl");var xhr = new XMLHttpRequest({ xdomain: false });return null != xhr.responseType;
						}();function Polling(opts) {
							var forceBase64 = opts && opts.forceBase64;if (!hasXHR2 || forceBase64) {
								this.supportsBinary = false;
							}Transport.call(this, opts);
						}inherit(Polling, Transport);Polling.prototype.name = "polling";Polling.prototype.doOpen = function () {
							this.poll();
						};Polling.prototype.pause = function (onPause) {
							var pending = 0;var self = this;this.readyState = "pausing";function pause() {
								debug("paused");self.readyState = "paused";onPause();
							}if (this.polling || !this.writable) {
								var total = 0;if (this.polling) {
									debug("we are currently polling - waiting to pause");total++;this.once("pollComplete", function () {
										debug("pre-pause polling complete");--total || pause();
									});
								}if (!this.writable) {
									debug("we are currently writing - waiting to pause");total++;this.once("drain", function () {
										debug("pre-pause writing complete");--total || pause();
									});
								}
							} else {
								pause();
							}
						};Polling.prototype.poll = function () {
							debug("polling");this.polling = true;this.doPoll();this.emit("poll");
						};Polling.prototype.onData = function (data) {
							var self = this;debug("polling got data %s", data);var callback = function (packet, index, total) {
								if ("opening" == self.readyState) {
									self.onOpen();
								}if ("close" == packet.type) {
									self.onClose();return false;
								}self.onPacket(packet);
							};parser.decodePayload(data, this.socket.binaryType, callback);if ("closed" != this.readyState) {
								this.polling = false;this.emit("pollComplete");if ("open" == this.readyState) {
									this.poll();
								} else {
									debug('ignoring poll - transport state "%s"', this.readyState);
								}
							}
						};Polling.prototype.doClose = function () {
							var self = this;function close() {
								debug("writing close packet");self.write([{ type: "close" }]);
							}if ("open" == this.readyState) {
								debug("transport open - closing");close();
							} else {
								debug("transport not open - deferring close");this.once("open", close);
							}
						};Polling.prototype.write = function (packets) {
							var self = this;this.writable = false;var callbackfn = function () {
								self.writable = true;self.emit("drain");
							};var self = this;parser.encodePayload(packets, this.supportsBinary, function (data) {
								self.doWrite(data, callbackfn);
							});
						};Polling.prototype.uri = function () {
							var query = this.query || {};var schema = this.secure ? "https" : "http";var port = "";if (false !== this.timestampRequests) {
								query[this.timestampParam] = yeast();
							}if (!this.supportsBinary && !query.sid) {
								query.b64 = 1;
							}query = parseqs.encode(query);if (this.port && ("https" == schema && this.port != 443 || "http" == schema && this.port != 80)) {
								port = ":" + this.port;
							}if (query.length) {
								query = "?" + query;
							}var ipv6 = this.hostname.indexOf(":") !== -1;return schema + "://" + (ipv6 ? "[" + this.hostname + "]" : this.hostname) + port + this.path + query;
						};
					}, { "../transport": 4, "component-inherit": 16, debug: 17, "engine.io-parser": 19, parseqs: 27, "xmlhttprequest-ssl": 10, yeast: 30 }], 9: [function (_dereq_, module, exports) {
						(function (global) {
							var Transport = _dereq_("../transport");var parser = _dereq_("engine.io-parser");var parseqs = _dereq_("parseqs");var inherit = _dereq_("component-inherit");var yeast = _dereq_("yeast");var debug = _dereq_("debug")("engine.io-client:websocket");var BrowserWebSocket = global.WebSocket || global.MozWebSocket;var WebSocket = BrowserWebSocket;if (!WebSocket && typeof window === "undefined") {
								try {
									WebSocket = _dereq_("ws");
								} catch (e) {}
							}module.exports = WS;function WS(opts) {
								var forceBase64 = opts && opts.forceBase64;if (forceBase64) {
									this.supportsBinary = false;
								}this.perMessageDeflate = opts.perMessageDeflate;Transport.call(this, opts);
							}inherit(WS, Transport);WS.prototype.name = "websocket";WS.prototype.supportsBinary = true;WS.prototype.doOpen = function () {
								if (!this.check()) {
									return;
								}var self = this;var uri = this.uri();var protocols = void 0;var opts = { agent: this.agent, perMessageDeflate: this.perMessageDeflate };opts.pfx = this.pfx;opts.key = this.key;opts.passphrase = this.passphrase;opts.cert = this.cert;opts.ca = this.ca;opts.ciphers = this.ciphers;opts.rejectUnauthorized = this.rejectUnauthorized;if (this.extraHeaders) {
									opts.headers = this.extraHeaders;
								}this.ws = BrowserWebSocket ? new WebSocket(uri) : new WebSocket(uri, protocols, opts);if (this.ws.binaryType === undefined) {
									this.supportsBinary = false;
								}if (this.ws.supports && this.ws.supports.binary) {
									this.supportsBinary = true;this.ws.binaryType = "buffer";
								} else {
									this.ws.binaryType = "arraybuffer";
								}this.addEventListeners();
							};WS.prototype.addEventListeners = function () {
								var self = this;this.ws.onopen = function () {
									self.onOpen();
								};this.ws.onclose = function () {
									self.onClose();
								};this.ws.onmessage = function (ev) {
									self.onData(ev.data);
								};this.ws.onerror = function (e) {
									self.onError("websocket error", e);
								};
							};if ("undefined" != typeof navigator && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
								WS.prototype.onData = function (data) {
									var self = this;setTimeout(function () {
										Transport.prototype.onData.call(self, data);
									}, 0);
								};
							}WS.prototype.write = function (packets) {
								var self = this;this.writable = false;var total = packets.length;for (var i = 0, l = total; i < l; i++) {
									(function (packet) {
										parser.encodePacket(packet, self.supportsBinary, function (data) {
											if (!BrowserWebSocket) {
												var opts = {};if (packet.options) {
													opts.compress = packet.options.compress;
												}if (self.perMessageDeflate) {
													var len = "string" == typeof data ? global.Buffer.byteLength(data) : data.length;if (len < self.perMessageDeflate.threshold) {
														opts.compress = false;
													}
												}
											}try {
												if (BrowserWebSocket) {
													self.ws.send(data);
												} else {
													self.ws.send(data, opts);
												}
											} catch (e) {
												debug("websocket closed before onclose event");
											}--total || done();
										});
									})(packets[i]);
								}function done() {
									self.emit("flush");setTimeout(function () {
										self.writable = true;self.emit("drain");
									}, 0);
								}
							};WS.prototype.onClose = function () {
								Transport.prototype.onClose.call(this);
							};WS.prototype.doClose = function () {
								if (typeof this.ws !== "undefined") {
									this.ws.close();
								}
							};WS.prototype.uri = function () {
								var query = this.query || {};var schema = this.secure ? "wss" : "ws";var port = "";if (this.port && ("wss" == schema && this.port != 443 || "ws" == schema && this.port != 80)) {
									port = ":" + this.port;
								}if (this.timestampRequests) {
									query[this.timestampParam] = yeast();
								}if (!this.supportsBinary) {
									query.b64 = 1;
								}query = parseqs.encode(query);if (query.length) {
									query = "?" + query;
								}var ipv6 = this.hostname.indexOf(":") !== -1;return schema + "://" + (ipv6 ? "[" + this.hostname + "]" : this.hostname) + port + this.path + query;
							};WS.prototype.check = function () {
								return !!WebSocket && !("__initialize" in WebSocket && this.name === WS.prototype.name);
							};
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "../transport": 4, "component-inherit": 16, debug: 17, "engine.io-parser": 19, parseqs: 27, ws: undefined, yeast: 30 }], 10: [function (_dereq_, module, exports) {
						var hasCORS = _dereq_("has-cors");module.exports = function (opts) {
							var xdomain = opts.xdomain;var xscheme = opts.xscheme;var enablesXDR = opts.enablesXDR;try {
								if ("undefined" != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
									return new XMLHttpRequest();
								}
							} catch (e) {}try {
								if ("undefined" != typeof XDomainRequest && !xscheme && enablesXDR) {
									return new XDomainRequest();
								}
							} catch (e) {}if (!xdomain) {
								try {
									return new ActiveXObject("Microsoft.XMLHTTP");
								} catch (e) {}
							}
						};
					}, { "has-cors": 22 }], 11: [function (_dereq_, module, exports) {
						module.exports = after;function after(count, callback, err_cb) {
							var bail = false;err_cb = err_cb || noop;proxy.count = count;return count === 0 ? callback() : proxy;function proxy(err, result) {
								if (proxy.count <= 0) {
									throw new Error("after called too many times");
								}--proxy.count;if (err) {
									bail = true;callback(err);callback = err_cb;
								} else if (proxy.count === 0 && !bail) {
									callback(null, result);
								}
							}
						}function noop() {}
					}, {}], 12: [function (_dereq_, module, exports) {
						module.exports = function (arraybuffer, start, end) {
							var bytes = arraybuffer.byteLength;start = start || 0;end = end || bytes;if (arraybuffer.slice) {
								return arraybuffer.slice(start, end);
							}if (start < 0) {
								start += bytes;
							}if (end < 0) {
								end += bytes;
							}if (end > bytes) {
								end = bytes;
							}if (start >= bytes || start >= end || bytes === 0) {
								return new ArrayBuffer(0);
							}var abv = new Uint8Array(arraybuffer);var result = new Uint8Array(end - start);for (var i = start, ii = 0; i < end; i++, ii++) {
								result[ii] = abv[i];
							}return result.buffer;
						};
					}, {}], 13: [function (_dereq_, module, exports) {
						(function (chars) {
							"use strict";
							exports.encode = function (arraybuffer) {
								var bytes = new Uint8Array(arraybuffer),
								    i,
								    len = bytes.length,
								    base64 = "";for (i = 0; i < len; i += 3) {
									base64 += chars[bytes[i] >> 2];
									base64 += chars[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];base64 += chars[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];base64 += chars[bytes[i + 2] & 63];
								}if (len % 3 === 2) {
									base64 = base64.substring(0, base64.length - 1) + "=";
								} else if (len % 3 === 1) {
									base64 = base64.substring(0, base64.length - 2) + "==";
								}return base64;
							};exports.decode = function (base64) {
								var bufferLength = base64.length * .75,
								    len = base64.length,
								    i,
								    p = 0,
								    encoded1,
								    encoded2,
								    encoded3,
								    encoded4;if (base64[base64.length - 1] === "=") {
									bufferLength--;if (base64[base64.length - 2] === "=") {
										bufferLength--;
									}
								}var arraybuffer = new ArrayBuffer(bufferLength),
								    bytes = new Uint8Array(arraybuffer);for (i = 0; i < len; i += 4) {
									encoded1 = chars.indexOf(base64[i]);encoded2 = chars.indexOf(base64[i + 1]);encoded3 = chars.indexOf(base64[i + 2]);encoded4 = chars.indexOf(base64[i + 3]);bytes[p++] = encoded1 << 2 | encoded2 >> 4;bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
								}return arraybuffer;
							};
						})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
					}, {}], 14: [function (_dereq_, module, exports) {
						(function (global) {
							var BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MSBlobBuilder || global.MozBlobBuilder;var blobSupported = function () {
								try {
									var a = new Blob(["hi"]);return a.size === 2;
								} catch (e) {
									return false;
								}
							}();var blobSupportsArrayBufferView = blobSupported && function () {
								try {
									var b = new Blob([new Uint8Array([1, 2])]);return b.size === 2;
								} catch (e) {
									return false;
								}
							}();var blobBuilderSupported = BlobBuilder && BlobBuilder.prototype.append && BlobBuilder.prototype.getBlob;function mapArrayBufferViews(ary) {
								for (var i = 0; i < ary.length; i++) {
									var chunk = ary[i];if (chunk.buffer instanceof ArrayBuffer) {
										var buf = chunk.buffer;if (chunk.byteLength !== buf.byteLength) {
											var copy = new Uint8Array(chunk.byteLength);copy.set(new Uint8Array(buf, chunk.byteOffset, chunk.byteLength));buf = copy.buffer;
										}ary[i] = buf;
									}
								}
							}function BlobBuilderConstructor(ary, options) {
								options = options || {};var bb = new BlobBuilder();mapArrayBufferViews(ary);for (var i = 0; i < ary.length; i++) {
									bb.append(ary[i]);
								}return options.type ? bb.getBlob(options.type) : bb.getBlob();
							}function BlobConstructor(ary, options) {
								mapArrayBufferViews(ary);return new Blob(ary, options || {});
							}module.exports = function () {
								if (blobSupported) {
									return blobSupportsArrayBufferView ? global.Blob : BlobConstructor;
								} else if (blobBuilderSupported) {
									return BlobBuilderConstructor;
								} else {
									return undefined;
								}
							}();
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, {}], 15: [function (_dereq_, module, exports) {
						module.exports = Emitter;function Emitter(obj) {
							if (obj) return mixin(obj);
						}function mixin(obj) {
							for (var key in Emitter.prototype) {
								obj[key] = Emitter.prototype[key];
							}return obj;
						}Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
							this._callbacks = this._callbacks || {};(this._callbacks[event] = this._callbacks[event] || []).push(fn);return this;
						};Emitter.prototype.once = function (event, fn) {
							var self = this;this._callbacks = this._callbacks || {};function on() {
								self.off(event, on);fn.apply(this, arguments);
							}on.fn = fn;this.on(event, on);return this;
						};Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
							this._callbacks = this._callbacks || {};if (0 == arguments.length) {
								this._callbacks = {};return this;
							}var callbacks = this._callbacks[event];if (!callbacks) return this;if (1 == arguments.length) {
								delete this._callbacks[event];return this;
							}var cb;for (var i = 0; i < callbacks.length; i++) {
								cb = callbacks[i];if (cb === fn || cb.fn === fn) {
									callbacks.splice(i, 1);break;
								}
							}return this;
						};Emitter.prototype.emit = function (event) {
							this._callbacks = this._callbacks || {};var args = [].slice.call(arguments, 1),
							    callbacks = this._callbacks[event];if (callbacks) {
								callbacks = callbacks.slice(0);for (var i = 0, len = callbacks.length; i < len; ++i) {
									callbacks[i].apply(this, args);
								}
							}return this;
						};Emitter.prototype.listeners = function (event) {
							this._callbacks = this._callbacks || {};return this._callbacks[event] || [];
						};Emitter.prototype.hasListeners = function (event) {
							return !!this.listeners(event).length;
						};
					}, {}], 16: [function (_dereq_, module, exports) {
						module.exports = function (a, b) {
							var fn = function () {};fn.prototype = b.prototype;a.prototype = new fn();a.prototype.constructor = a;
						};
					}, {}], 17: [function (_dereq_, module, exports) {
						exports = module.exports = _dereq_("./debug");exports.log = log;exports.formatArgs = formatArgs;exports.save = save;exports.load = load;exports.useColors = useColors;exports.storage = "undefined" != typeof chrome && "undefined" != typeof chrome.storage ? chrome.storage.local : localstorage();exports.colors = ["lightseagreen", "forestgreen", "goldenrod", "dodgerblue", "darkorchid", "crimson"];function useColors() {
							return "WebkitAppearance" in document.documentElement.style || window.console && (console.firebug || console.exception && console.table) || navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31;
						}exports.formatters.j = function (v) {
							return JSON.stringify(v);
						};function formatArgs() {
							var args = arguments;var useColors = this.useColors;args[0] = (useColors ? "%c" : "") + this.namespace + (useColors ? " %c" : " ") + args[0] + (useColors ? "%c " : " ") + "+" + exports.humanize(this.diff);if (!useColors) return args;var c = "color: " + this.color;args = [args[0], c, "color: inherit"].concat(Array.prototype.slice.call(args, 1));var index = 0;var lastC = 0;args[0].replace(/%[a-z%]/g, function (match) {
								if ("%%" === match) return;index++;if ("%c" === match) {
									lastC = index;
								}
							});args.splice(lastC, 0, c);return args;
						}function log() {
							return "object" === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
						}function save(namespaces) {
							try {
								if (null == namespaces) {
									exports.storage.removeItem("debug");
								} else {
									exports.storage.debug = namespaces;
								}
							} catch (e) {}
						}function load() {
							var r;try {
								r = exports.storage.debug;
							} catch (e) {}return r;
						}exports.enable(load());function localstorage() {
							try {
								return window.localStorage;
							} catch (e) {}
						}
					}, { "./debug": 18 }], 18: [function (_dereq_, module, exports) {
						exports = module.exports = debug;exports.coerce = coerce;exports.disable = disable;exports.enable = enable;exports.enabled = enabled;exports.humanize = _dereq_("ms");exports.names = [];exports.skips = [];exports.formatters = {};var prevColor = 0;var prevTime;function selectColor() {
							return exports.colors[prevColor++ % exports.colors.length];
						}function debug(namespace) {
							function disabled() {}disabled.enabled = false;function enabled() {
								var self = enabled;var curr = +new Date();var ms = curr - (prevTime || curr);self.diff = ms;self.prev = prevTime;self.curr = curr;prevTime = curr;if (null == self.useColors) self.useColors = exports.useColors();if (null == self.color && self.useColors) self.color = selectColor();var args = Array.prototype.slice.call(arguments);args[0] = exports.coerce(args[0]);if ("string" !== typeof args[0]) {
									args = ["%o"].concat(args);
								}var index = 0;args[0] = args[0].replace(/%([a-z%])/g, function (match, format) {
									if (match === "%%") return match;index++;var formatter = exports.formatters[format];if ("function" === typeof formatter) {
										var val = args[index];match = formatter.call(self, val);args.splice(index, 1);index--;
									}return match;
								});if ("function" === typeof exports.formatArgs) {
									args = exports.formatArgs.apply(self, args);
								}var logFn = enabled.log || exports.log || console.log.bind(console);logFn.apply(self, args);
							}enabled.enabled = true;var fn = exports.enabled(namespace) ? enabled : disabled;fn.namespace = namespace;return fn;
						}function enable(namespaces) {
							exports.save(namespaces);var split = (namespaces || "").split(/[\s,]+/);var len = split.length;for (var i = 0; i < len; i++) {
								if (!split[i]) continue;namespaces = split[i].replace(/\*/g, ".*?");if (namespaces[0] === "-") {
									exports.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
								} else {
									exports.names.push(new RegExp("^" + namespaces + "$"));
								}
							}
						}function disable() {
							exports.enable("");
						}function enabled(name) {
							var i, len;for (i = 0, len = exports.skips.length; i < len; i++) {
								if (exports.skips[i].test(name)) {
									return false;
								}
							}for (i = 0, len = exports.names.length; i < len; i++) {
								if (exports.names[i].test(name)) {
									return true;
								}
							}return false;
						}function coerce(val) {
							if (val instanceof Error) return val.stack || val.message;return val;
						}
					}, { ms: 25 }], 19: [function (_dereq_, module, exports) {
						(function (global) {
							var keys = _dereq_("./keys");var hasBinary = _dereq_("has-binary");var sliceBuffer = _dereq_("arraybuffer.slice");var base64encoder = _dereq_("base64-arraybuffer");var after = _dereq_("after");var utf8 = _dereq_("utf8");var isAndroid = navigator.userAgent.match(/Android/i);var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);var dontSendBlobs = isAndroid || isPhantomJS;exports.protocol = 3;var packets = exports.packets = { open: 0, close: 1, ping: 2, pong: 3, message: 4, upgrade: 5, noop: 6 };var packetslist = keys(packets);var err = { type: "error", data: "parser error" };var Blob = _dereq_("blob");exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
								if ("function" == typeof supportsBinary) {
									callback = supportsBinary;supportsBinary = false;
								}if ("function" == typeof utf8encode) {
									callback = utf8encode;utf8encode = null;
								}var data = packet.data === undefined ? undefined : packet.data.buffer || packet.data;if (global.ArrayBuffer && data instanceof ArrayBuffer) {
									return encodeArrayBuffer(packet, supportsBinary, callback);
								} else if (Blob && data instanceof global.Blob) {
									return encodeBlob(packet, supportsBinary, callback);
								}if (data && data.base64) {
									return encodeBase64Object(packet, callback);
								}var encoded = packets[packet.type];if (undefined !== packet.data) {
									encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
								}return callback("" + encoded);
							};function encodeBase64Object(packet, callback) {
								var message = "b" + exports.packets[packet.type] + packet.data.data;return callback(message);
							}function encodeArrayBuffer(packet, supportsBinary, callback) {
								if (!supportsBinary) {
									return exports.encodeBase64Packet(packet, callback);
								}var data = packet.data;var contentArray = new Uint8Array(data);var resultBuffer = new Uint8Array(1 + data.byteLength);resultBuffer[0] = packets[packet.type];for (var i = 0; i < contentArray.length; i++) {
									resultBuffer[i + 1] = contentArray[i];
								}return callback(resultBuffer.buffer);
							}function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
								if (!supportsBinary) {
									return exports.encodeBase64Packet(packet, callback);
								}var fr = new FileReader();fr.onload = function () {
									packet.data = fr.result;exports.encodePacket(packet, supportsBinary, true, callback);
								};return fr.readAsArrayBuffer(packet.data);
							}function encodeBlob(packet, supportsBinary, callback) {
								if (!supportsBinary) {
									return exports.encodeBase64Packet(packet, callback);
								}if (dontSendBlobs) {
									return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
								}var length = new Uint8Array(1);length[0] = packets[packet.type];var blob = new Blob([length.buffer, packet.data]);return callback(blob);
							}exports.encodeBase64Packet = function (packet, callback) {
								var message = "b" + exports.packets[packet.type];if (Blob && packet.data instanceof global.Blob) {
									var fr = new FileReader();fr.onload = function () {
										var b64 = fr.result.split(",")[1];callback(message + b64);
									};return fr.readAsDataURL(packet.data);
								}var b64data;try {
									b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
								} catch (e) {
									var typed = new Uint8Array(packet.data);var basic = new Array(typed.length);for (var i = 0; i < typed.length; i++) {
										basic[i] = typed[i];
									}b64data = String.fromCharCode.apply(null, basic);
								}message += global.btoa(b64data);return callback(message);
							};exports.decodePacket = function (data, binaryType, utf8decode) {
								if (typeof data == "string" || data === undefined) {
									if (data.charAt(0) == "b") {
										return exports.decodeBase64Packet(data.substr(1), binaryType);
									}if (utf8decode) {
										try {
											data = utf8.decode(data);
										} catch (e) {
											return err;
										}
									}var type = data.charAt(0);if (Number(type) != type || !packetslist[type]) {
										return err;
									}if (data.length > 1) {
										return { type: packetslist[type], data: data.substring(1) };
									} else {
										return { type: packetslist[type] };
									}
								}var asArray = new Uint8Array(data);var type = asArray[0];var rest = sliceBuffer(data, 1);if (Blob && binaryType === "blob") {
									rest = new Blob([rest]);
								}return { type: packetslist[type], data: rest };
							};exports.decodeBase64Packet = function (msg, binaryType) {
								var type = packetslist[msg.charAt(0)];if (!global.ArrayBuffer) {
									return { type: type, data: { base64: true, data: msg.substr(1) } };
								}var data = base64encoder.decode(msg.substr(1));if (binaryType === "blob" && Blob) {
									data = new Blob([data]);
								}return { type: type, data: data };
							};exports.encodePayload = function (packets, supportsBinary, callback) {
								if (typeof supportsBinary == "function") {
									callback = supportsBinary;supportsBinary = null;
								}var isBinary = hasBinary(packets);if (supportsBinary && isBinary) {
									if (Blob && !dontSendBlobs) {
										return exports.encodePayloadAsBlob(packets, callback);
									}return exports.encodePayloadAsArrayBuffer(packets, callback);
								}if (!packets.length) {
									return callback("0:");
								}function setLengthHeader(message) {
									return message.length + ":" + message;
								}function encodeOne(packet, doneCallback) {
									exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function (message) {
										doneCallback(null, setLengthHeader(message));
									});
								}map(packets, encodeOne, function (err, results) {
									return callback(results.join(""));
								});
							};function map(ary, each, done) {
								var result = new Array(ary.length);var next = after(ary.length, done);var eachWithIndex = function (i, el, cb) {
									each(el, function (error, msg) {
										result[i] = msg;cb(error, result);
									});
								};for (var i = 0; i < ary.length; i++) {
									eachWithIndex(i, ary[i], next);
								}
							}exports.decodePayload = function (data, binaryType, callback) {
								if (typeof data != "string") {
									return exports.decodePayloadAsBinary(data, binaryType, callback);
								}if (typeof binaryType === "function") {
									callback = binaryType;binaryType = null;
								}var packet;if (data == "") {
									return callback(err, 0, 1);
								}var length = "",
								    n,
								    msg;for (var i = 0, l = data.length; i < l; i++) {
									var chr = data.charAt(i);if (":" != chr) {
										length += chr;
									} else {
										if ("" == length || length != (n = Number(length))) {
											return callback(err, 0, 1);
										}msg = data.substr(i + 1, n);if (length != msg.length) {
											return callback(err, 0, 1);
										}if (msg.length) {
											packet = exports.decodePacket(msg, binaryType, true);if (err.type == packet.type && err.data == packet.data) {
												return callback(err, 0, 1);
											}var ret = callback(packet, i + n, l);if (false === ret) return;
										}i += n;length = "";
									}
								}if (length != "") {
									return callback(err, 0, 1);
								}
							};exports.encodePayloadAsArrayBuffer = function (packets, callback) {
								if (!packets.length) {
									return callback(new ArrayBuffer(0));
								}function encodeOne(packet, doneCallback) {
									exports.encodePacket(packet, true, true, function (data) {
										return doneCallback(null, data);
									});
								}map(packets, encodeOne, function (err, encodedPackets) {
									var totalLength = encodedPackets.reduce(function (acc, p) {
										var len;if (typeof p === "string") {
											len = p.length;
										} else {
											len = p.byteLength;
										}return acc + len.toString().length + len + 2;
									}, 0);var resultArray = new Uint8Array(totalLength);var bufferIndex = 0;encodedPackets.forEach(function (p) {
										var isString = typeof p === "string";var ab = p;if (isString) {
											var view = new Uint8Array(p.length);for (var i = 0; i < p.length; i++) {
												view[i] = p.charCodeAt(i);
											}ab = view.buffer;
										}if (isString) {
											resultArray[bufferIndex++] = 0;
										} else {
											resultArray[bufferIndex++] = 1;
										}var lenStr = ab.byteLength.toString();for (var i = 0; i < lenStr.length; i++) {
											resultArray[bufferIndex++] = parseInt(lenStr[i]);
										}resultArray[bufferIndex++] = 255;var view = new Uint8Array(ab);for (var i = 0; i < view.length; i++) {
											resultArray[bufferIndex++] = view[i];
										}
									});return callback(resultArray.buffer);
								});
							};exports.encodePayloadAsBlob = function (packets, callback) {
								function encodeOne(packet, doneCallback) {
									exports.encodePacket(packet, true, true, function (encoded) {
										var binaryIdentifier = new Uint8Array(1);binaryIdentifier[0] = 1;if (typeof encoded === "string") {
											var view = new Uint8Array(encoded.length);for (var i = 0; i < encoded.length; i++) {
												view[i] = encoded.charCodeAt(i);
											}encoded = view.buffer;binaryIdentifier[0] = 0;
										}var len = encoded instanceof ArrayBuffer ? encoded.byteLength : encoded.size;var lenStr = len.toString();var lengthAry = new Uint8Array(lenStr.length + 1);for (var i = 0; i < lenStr.length; i++) {
											lengthAry[i] = parseInt(lenStr[i]);
										}lengthAry[lenStr.length] = 255;if (Blob) {
											var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);doneCallback(null, blob);
										}
									});
								}map(packets, encodeOne, function (err, results) {
									return callback(new Blob(results));
								});
							};exports.decodePayloadAsBinary = function (data, binaryType, callback) {
								if (typeof binaryType === "function") {
									callback = binaryType;binaryType = null;
								}var bufferTail = data;var buffers = [];var numberTooLong = false;while (bufferTail.byteLength > 0) {
									var tailArray = new Uint8Array(bufferTail);var isString = tailArray[0] === 0;var msgLength = "";for (var i = 1;; i++) {
										if (tailArray[i] == 255) break;if (msgLength.length > 310) {
											numberTooLong = true;break;
										}msgLength += tailArray[i];
									}if (numberTooLong) return callback(err, 0, 1);bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);msgLength = parseInt(msgLength);var msg = sliceBuffer(bufferTail, 0, msgLength);if (isString) {
										try {
											msg = String.fromCharCode.apply(null, new Uint8Array(msg));
										} catch (e) {
											var typed = new Uint8Array(msg);msg = "";for (var i = 0; i < typed.length; i++) {
												msg += String.fromCharCode(typed[i]);
											}
										}
									}buffers.push(msg);bufferTail = sliceBuffer(bufferTail, msgLength);
								}var total = buffers.length;buffers.forEach(function (buffer, i) {
									callback(exports.decodePacket(buffer, binaryType, true), i, total);
								});
							};
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "./keys": 20, after: 11, "arraybuffer.slice": 12, "base64-arraybuffer": 13, blob: 14, "has-binary": 21, utf8: 29 }], 20: [function (_dereq_, module, exports) {
						module.exports = Object.keys || function keys(obj) {
							var arr = [];var has = Object.prototype.hasOwnProperty;for (var i in obj) {
								if (has.call(obj, i)) {
									arr.push(i);
								}
							}return arr;
						};
					}, {}], 21: [function (_dereq_, module, exports) {
						(function (global) {
							var isArray = _dereq_("isarray");module.exports = hasBinary;function hasBinary(data) {
								function _hasBinary(obj) {
									if (!obj) return false;if (global.Buffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer || global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
										return true;
									}if (isArray(obj)) {
										for (var i = 0; i < obj.length; i++) {
											if (_hasBinary(obj[i])) {
												return true;
											}
										}
									} else if (obj && "object" == typeof obj) {
										if (obj.toJSON) {
											obj = obj.toJSON();
										}for (var key in obj) {
											if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
												return true;
											}
										}
									}return false;
								}return _hasBinary(data);
							}
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { isarray: 24 }], 22: [function (_dereq_, module, exports) {
						try {
							module.exports = typeof XMLHttpRequest !== "undefined" && "withCredentials" in new XMLHttpRequest();
						} catch (err) {
							module.exports = false;
						}
					}, {}], 23: [function (_dereq_, module, exports) {
						var indexOf = [].indexOf;module.exports = function (arr, obj) {
							if (indexOf) return arr.indexOf(obj);for (var i = 0; i < arr.length; ++i) {
								if (arr[i] === obj) return i;
							}return -1;
						};
					}, {}], 24: [function (_dereq_, module, exports) {
						module.exports = Array.isArray || function (arr) {
							return Object.prototype.toString.call(arr) == "[object Array]";
						};
					}, {}], 25: [function (_dereq_, module, exports) {
						var s = 1e3;var m = s * 60;var h = m * 60;var d = h * 24;var y = d * 365.25;module.exports = function (val, options) {
							options = options || {};if ("string" == typeof val) return parse(val);return options.long ? long(val) : short(val);
						};function parse(str) {
							str = "" + str;if (str.length > 1e4) return;var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);if (!match) return;var n = parseFloat(match[1]);var type = (match[2] || "ms").toLowerCase();switch (type) {case "years":case "year":case "yrs":case "yr":case "y":
									return n * y;case "days":case "day":case "d":
									return n * d;case "hours":case "hour":case "hrs":case "hr":case "h":
									return n * h;case "minutes":case "minute":case "mins":case "min":case "m":
									return n * m;case "seconds":case "second":case "secs":case "sec":case "s":
									return n * s;case "milliseconds":case "millisecond":case "msecs":case "msec":case "ms":
									return n;}
						}function short(ms) {
							if (ms >= d) return Math.round(ms / d) + "d";if (ms >= h) return Math.round(ms / h) + "h";if (ms >= m) return Math.round(ms / m) + "m";if (ms >= s) return Math.round(ms / s) + "s";return ms + "ms";
						}function long(ms) {
							return plural(ms, d, "day") || plural(ms, h, "hour") || plural(ms, m, "minute") || plural(ms, s, "second") || ms + " ms";
						}function plural(ms, n, name) {
							if (ms < n) return;if (ms < n * 1.5) return Math.floor(ms / n) + " " + name;return Math.ceil(ms / n) + " " + name + "s";
						}
					}, {}], 26: [function (_dereq_, module, exports) {
						(function (global) {
							var rvalidchars = /^[\],:{}\s]*$/;var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;var rtrimLeft = /^\s+/;var rtrimRight = /\s+$/;module.exports = function parsejson(data) {
								if ("string" != typeof data || !data) {
									return null;
								}data = data.replace(rtrimLeft, "").replace(rtrimRight, "");if (global.JSON && JSON.parse) {
									return JSON.parse(data);
								}if (rvalidchars.test(data.replace(rvalidescape, "@").replace(rvalidtokens, "]").replace(rvalidbraces, ""))) {
									return new Function("return " + data)();
								}
							};
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, {}], 27: [function (_dereq_, module, exports) {
						exports.encode = function (obj) {
							var str = "";for (var i in obj) {
								if (obj.hasOwnProperty(i)) {
									if (str.length) str += "&";str += encodeURIComponent(i) + "=" + encodeURIComponent(obj[i]);
								}
							}return str;
						};exports.decode = function (qs) {
							var qry = {};var pairs = qs.split("&");for (var i = 0, l = pairs.length; i < l; i++) {
								var pair = pairs[i].split("=");qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
							}return qry;
						};
					}, {}], 28: [function (_dereq_, module, exports) {
						var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;var parts = ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"];module.exports = function parseuri(str) {
							var src = str,
							    b = str.indexOf("["),
							    e = str.indexOf("]");if (b != -1 && e != -1) {
								str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ";") + str.substring(e, str.length);
							}var m = re.exec(str || ""),
							    uri = {},
							    i = 14;while (i--) {
								uri[parts[i]] = m[i] || "";
							}if (b != -1 && e != -1) {
								uri.source = src;uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ":");uri.authority = uri.authority.replace("[", "").replace("]", "").replace(/;/g, ":");uri.ipv6uri = true;
							}return uri;
						};
					}, {}], 29: [function (_dereq_, module, exports) {
						(function (global) {
							(function (root) {
								var freeExports = typeof exports == "object" && exports;var freeModule = typeof module == "object" && module && module.exports == freeExports && module;var freeGlobal = typeof global == "object" && global;if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
									root = freeGlobal;
								}var stringFromCharCode = String.fromCharCode;function ucs2decode(string) {
									var output = [];var counter = 0;var length = string.length;var value;var extra;while (counter < length) {
										value = string.charCodeAt(counter++);if (value >= 55296 && value <= 56319 && counter < length) {
											extra = string.charCodeAt(counter++);if ((extra & 64512) == 56320) {
												output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
											} else {
												output.push(value);counter--;
											}
										} else {
											output.push(value);
										}
									}return output;
								}function ucs2encode(array) {
									var length = array.length;var index = -1;var value;var output = "";while (++index < length) {
										value = array[index];if (value > 65535) {
											value -= 65536;output += stringFromCharCode(value >>> 10 & 1023 | 55296);value = 56320 | value & 1023;
										}output += stringFromCharCode(value);
									}return output;
								}function checkScalarValue(codePoint) {
									if (codePoint >= 55296 && codePoint <= 57343) {
										throw Error("Lone surrogate U+" + codePoint.toString(16).toUpperCase() + " is not a scalar value");
									}
								}function createByte(codePoint, shift) {
									return stringFromCharCode(codePoint >> shift & 63 | 128);
								}function encodeCodePoint(codePoint) {
									if ((codePoint & 4294967168) == 0) {
										return stringFromCharCode(codePoint);
									}var symbol = "";if ((codePoint & 4294965248) == 0) {
										symbol = stringFromCharCode(codePoint >> 6 & 31 | 192);
									} else if ((codePoint & 4294901760) == 0) {
										checkScalarValue(codePoint);symbol = stringFromCharCode(codePoint >> 12 & 15 | 224);symbol += createByte(codePoint, 6);
									} else if ((codePoint & 4292870144) == 0) {
										symbol = stringFromCharCode(codePoint >> 18 & 7 | 240);symbol += createByte(codePoint, 12);symbol += createByte(codePoint, 6);
									}symbol += stringFromCharCode(codePoint & 63 | 128);return symbol;
								}function utf8encode(string) {
									var codePoints = ucs2decode(string);var length = codePoints.length;var index = -1;var codePoint;var byteString = "";while (++index < length) {
										codePoint = codePoints[index];byteString += encodeCodePoint(codePoint);
									}return byteString;
								}function readContinuationByte() {
									if (byteIndex >= byteCount) {
										throw Error("Invalid byte index");
									}var continuationByte = byteArray[byteIndex] & 255;byteIndex++;if ((continuationByte & 192) == 128) {
										return continuationByte & 63;
									}throw Error("Invalid continuation byte");
								}function decodeSymbol() {
									var byte1;var byte2;var byte3;var byte4;var codePoint;if (byteIndex > byteCount) {
										throw Error("Invalid byte index");
									}if (byteIndex == byteCount) {
										return false;
									}byte1 = byteArray[byteIndex] & 255;byteIndex++;if ((byte1 & 128) == 0) {
										return byte1;
									}if ((byte1 & 224) == 192) {
										var byte2 = readContinuationByte();codePoint = (byte1 & 31) << 6 | byte2;if (codePoint >= 128) {
											return codePoint;
										} else {
											throw Error("Invalid continuation byte");
										}
									}if ((byte1 & 240) == 224) {
										byte2 = readContinuationByte();byte3 = readContinuationByte();codePoint = (byte1 & 15) << 12 | byte2 << 6 | byte3;if (codePoint >= 2048) {
											checkScalarValue(codePoint);return codePoint;
										} else {
											throw Error("Invalid continuation byte");
										}
									}if ((byte1 & 248) == 240) {
										byte2 = readContinuationByte();byte3 = readContinuationByte();byte4 = readContinuationByte();codePoint = (byte1 & 15) << 18 | byte2 << 12 | byte3 << 6 | byte4;if (codePoint >= 65536 && codePoint <= 1114111) {
											return codePoint;
										}
									}throw Error("Invalid UTF-8 detected");
								}var byteArray;var byteCount;var byteIndex;function utf8decode(byteString) {
									byteArray = ucs2decode(byteString);byteCount = byteArray.length;byteIndex = 0;var codePoints = [];var tmp;while ((tmp = decodeSymbol()) !== false) {
										codePoints.push(tmp);
									}return ucs2encode(codePoints);
								}var utf8 = { version: "2.0.0", encode: utf8encode, decode: utf8decode };if (typeof define == "function" && typeof define.amd == "object" && define.amd) {
									define(function () {
										return utf8;
									});
								} else if (freeExports && !freeExports.nodeType) {
									if (freeModule) {
										freeModule.exports = utf8;
									} else {
										var object = {};var hasOwnProperty = object.hasOwnProperty;for (var key in utf8) {
											hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
										}
									}
								} else {
									root.utf8 = utf8;
								}
							})(this);
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, {}], 30: [function (_dereq_, module, exports) {
						"use strict";
						var alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split(""),
						    length = 64,
						    map = {},
						    seed = 0,
						    i = 0,
						    prev;function encode(num) {
							var encoded = "";do {
								encoded = alphabet[num % length] + encoded;num = Math.floor(num / length);
							} while (num > 0);return encoded;
						}function decode(str) {
							var decoded = 0;for (i = 0; i < str.length; i++) {
								decoded = decoded * length + map[str.charAt(i)];
							}return decoded;
						}function yeast() {
							var now = encode(+new Date());if (now !== prev) return seed = 0, prev = now;return now + "." + encode(seed++);
						}for (; i < length; i++) map[alphabet[i]] = i;yeast.encode = encode;yeast.decode = decode;module.exports = yeast;
					}, {}], 31: [function (_dereq_, module, exports) {
						var url = _dereq_("./url");var parser = _dereq_("socket.io-parser");var Manager = _dereq_("./manager");var debug = _dereq_("debug")("socket.io-client");module.exports = exports = lookup;var cache = exports.managers = {};function lookup(uri, opts) {
							if (typeof uri == "object") {
								opts = uri;uri = undefined;
							}opts = opts || {};var parsed = url(uri);var source = parsed.source;var id = parsed.id;var path = parsed.path;var sameNamespace = cache[id] && path in cache[id].nsps;var newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;var io;if (newConnection) {
								debug("ignoring socket cache for %s", source);io = Manager(source, opts);
							} else {
								if (!cache[id]) {
									debug("new io instance for %s", source);cache[id] = Manager(source, opts);
								}io = cache[id];
							}return io.socket(parsed.path);
						}exports.protocol = parser.protocol;exports.connect = lookup;exports.Manager = _dereq_("./manager");exports.Socket = _dereq_("./socket");
					}, { "./manager": 32, "./socket": 34, "./url": 35, debug: 39, "socket.io-parser": 47 }], 32: [function (_dereq_, module, exports) {
						var eio = _dereq_("engine.io-client");var Socket = _dereq_("./socket");var Emitter = _dereq_("component-emitter");var parser = _dereq_("socket.io-parser");var on = _dereq_("./on");var bind = _dereq_("component-bind");var debug = _dereq_("debug")("socket.io-client:manager");var indexOf = _dereq_("indexof");var Backoff = _dereq_("backo2");var has = Object.prototype.hasOwnProperty;module.exports = Manager;function Manager(uri, opts) {
							if (!(this instanceof Manager)) return new Manager(uri, opts);if (uri && "object" == typeof uri) {
								opts = uri;uri = undefined;
							}opts = opts || {};opts.path = opts.path || "/socket.io";this.nsps = {};this.subs = [];this.opts = opts;this.reconnection(opts.reconnection !== false);this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);this.reconnectionDelay(opts.reconnectionDelay || 1e3);this.reconnectionDelayMax(opts.reconnectionDelayMax || 5e3);this.randomizationFactor(opts.randomizationFactor || .5);this.backoff = new Backoff({ min: this.reconnectionDelay(), max: this.reconnectionDelayMax(), jitter: this.randomizationFactor() });this.timeout(null == opts.timeout ? 2e4 : opts.timeout);this.readyState = "closed";this.uri = uri;this.connecting = [];this.lastPing = null;this.encoding = false;this.packetBuffer = [];this.encoder = new parser.Encoder();this.decoder = new parser.Decoder();this.autoConnect = opts.autoConnect !== false;if (this.autoConnect) this.open();
						}Manager.prototype.emitAll = function () {
							this.emit.apply(this, arguments);for (var nsp in this.nsps) {
								if (has.call(this.nsps, nsp)) {
									this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
								}
							}
						};Manager.prototype.updateSocketIds = function () {
							for (var nsp in this.nsps) {
								if (has.call(this.nsps, nsp)) {
									this.nsps[nsp].id = this.engine.id;
								}
							}
						};Emitter(Manager.prototype);Manager.prototype.reconnection = function (v) {
							if (!arguments.length) return this._reconnection;this._reconnection = !!v;return this;
						};Manager.prototype.reconnectionAttempts = function (v) {
							if (!arguments.length) return this._reconnectionAttempts;this._reconnectionAttempts = v;return this;
						};Manager.prototype.reconnectionDelay = function (v) {
							if (!arguments.length) return this._reconnectionDelay;this._reconnectionDelay = v;this.backoff && this.backoff.setMin(v);return this;
						};Manager.prototype.randomizationFactor = function (v) {
							if (!arguments.length) return this._randomizationFactor;this._randomizationFactor = v;this.backoff && this.backoff.setJitter(v);return this;
						};Manager.prototype.reconnectionDelayMax = function (v) {
							if (!arguments.length) return this._reconnectionDelayMax;this._reconnectionDelayMax = v;this.backoff && this.backoff.setMax(v);return this;
						};Manager.prototype.timeout = function (v) {
							if (!arguments.length) return this._timeout;this._timeout = v;return this;
						};Manager.prototype.maybeReconnectOnOpen = function () {
							if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
								this.reconnect();
							}
						};Manager.prototype.open = Manager.prototype.connect = function (fn) {
							debug("readyState %s", this.readyState);if (~this.readyState.indexOf("open")) return this;debug("opening %s", this.uri);this.engine = eio(this.uri, this.opts);var socket = this.engine;var self = this;this.readyState = "opening";this.skipReconnect = false;var openSub = on(socket, "open", function () {
								self.onopen();fn && fn();
							});var errorSub = on(socket, "error", function (data) {
								debug("connect_error");self.cleanup();self.readyState = "closed";self.emitAll("connect_error", data);if (fn) {
									var err = new Error("Connection error");err.data = data;fn(err);
								} else {
									self.maybeReconnectOnOpen();
								}
							});if (false !== this._timeout) {
								var timeout = this._timeout;debug("connect attempt will timeout after %d", timeout);var timer = setTimeout(function () {
									debug("connect attempt timed out after %d", timeout);openSub.destroy();socket.close();socket.emit("error", "timeout");self.emitAll("connect_timeout", timeout);
								}, timeout);this.subs.push({ destroy: function () {
										clearTimeout(timer);
									} });
							}this.subs.push(openSub);this.subs.push(errorSub);return this;
						};Manager.prototype.onopen = function () {
							debug("open");this.cleanup();this.readyState = "open";this.emit("open");var socket = this.engine;this.subs.push(on(socket, "data", bind(this, "ondata")));this.subs.push(on(socket, "ping", bind(this, "onping")));this.subs.push(on(socket, "pong", bind(this, "onpong")));this.subs.push(on(socket, "error", bind(this, "onerror")));this.subs.push(on(socket, "close", bind(this, "onclose")));this.subs.push(on(this.decoder, "decoded", bind(this, "ondecoded")));
						};Manager.prototype.onping = function () {
							this.lastPing = new Date();this.emitAll("ping");
						};Manager.prototype.onpong = function () {
							this.emitAll("pong", new Date() - this.lastPing);
						};Manager.prototype.ondata = function (data) {
							this.decoder.add(data);
						};Manager.prototype.ondecoded = function (packet) {
							this.emit("packet", packet);
						};Manager.prototype.onerror = function (err) {
							debug("error", err);this.emitAll("error", err);
						};Manager.prototype.socket = function (nsp) {
							var socket = this.nsps[nsp];if (!socket) {
								socket = new Socket(this, nsp);this.nsps[nsp] = socket;var self = this;socket.on("connecting", onConnecting);
								socket.on("connect", function () {
									socket.id = self.engine.id;
								});if (this.autoConnect) {
									onConnecting();
								}
							}function onConnecting() {
								if (!~indexOf(self.connecting, socket)) {
									self.connecting.push(socket);
								}
							}return socket;
						};Manager.prototype.destroy = function (socket) {
							var index = indexOf(this.connecting, socket);if (~index) this.connecting.splice(index, 1);if (this.connecting.length) return;this.close();
						};Manager.prototype.packet = function (packet) {
							debug("writing packet %j", packet);var self = this;if (!self.encoding) {
								self.encoding = true;this.encoder.encode(packet, function (encodedPackets) {
									for (var i = 0; i < encodedPackets.length; i++) {
										self.engine.write(encodedPackets[i], packet.options);
									}self.encoding = false;self.processPacketQueue();
								});
							} else {
								self.packetBuffer.push(packet);
							}
						};Manager.prototype.processPacketQueue = function () {
							if (this.packetBuffer.length > 0 && !this.encoding) {
								var pack = this.packetBuffer.shift();this.packet(pack);
							}
						};Manager.prototype.cleanup = function () {
							debug("cleanup");var sub;while (sub = this.subs.shift()) sub.destroy();this.packetBuffer = [];this.encoding = false;this.lastPing = null;this.decoder.destroy();
						};Manager.prototype.close = Manager.prototype.disconnect = function () {
							debug("disconnect");this.skipReconnect = true;this.reconnecting = false;if ("opening" == this.readyState) {
								this.cleanup();
							}this.backoff.reset();this.readyState = "closed";if (this.engine) this.engine.close();
						};Manager.prototype.onclose = function (reason) {
							debug("onclose");this.cleanup();this.backoff.reset();this.readyState = "closed";this.emit("close", reason);if (this._reconnection && !this.skipReconnect) {
								this.reconnect();
							}
						};Manager.prototype.reconnect = function () {
							if (this.reconnecting || this.skipReconnect) return this;var self = this;if (this.backoff.attempts >= this._reconnectionAttempts) {
								debug("reconnect failed");this.backoff.reset();this.emitAll("reconnect_failed");this.reconnecting = false;
							} else {
								var delay = this.backoff.duration();debug("will wait %dms before reconnect attempt", delay);this.reconnecting = true;var timer = setTimeout(function () {
									if (self.skipReconnect) return;debug("attempting reconnect");self.emitAll("reconnect_attempt", self.backoff.attempts);self.emitAll("reconnecting", self.backoff.attempts);if (self.skipReconnect) return;self.open(function (err) {
										if (err) {
											debug("reconnect attempt error");self.reconnecting = false;self.reconnect();self.emitAll("reconnect_error", err.data);
										} else {
											debug("reconnect success");self.onreconnect();
										}
									});
								}, delay);this.subs.push({ destroy: function () {
										clearTimeout(timer);
									} });
							}
						};Manager.prototype.onreconnect = function () {
							var attempt = this.backoff.attempts;this.reconnecting = false;this.backoff.reset();this.updateSocketIds();this.emitAll("reconnect", attempt);
						};
					}, { "./on": 33, "./socket": 34, backo2: 36, "component-bind": 37, "component-emitter": 38, debug: 39, "engine.io-client": 1, indexof: 42, "socket.io-parser": 47 }], 33: [function (_dereq_, module, exports) {
						module.exports = on;function on(obj, ev, fn) {
							obj.on(ev, fn);return { destroy: function () {
									obj.removeListener(ev, fn);
								} };
						}
					}, {}], 34: [function (_dereq_, module, exports) {
						var parser = _dereq_("socket.io-parser");var Emitter = _dereq_("component-emitter");var toArray = _dereq_("to-array");var on = _dereq_("./on");var bind = _dereq_("component-bind");var debug = _dereq_("debug")("socket.io-client:socket");var hasBin = _dereq_("has-binary");module.exports = exports = Socket;var events = { connect: 1, connect_error: 1, connect_timeout: 1, connecting: 1, disconnect: 1, error: 1, reconnect: 1, reconnect_attempt: 1, reconnect_failed: 1, reconnect_error: 1, reconnecting: 1, ping: 1, pong: 1 };var emit = Emitter.prototype.emit;function Socket(io, nsp) {
							this.io = io;this.nsp = nsp;this.json = this;this.ids = 0;this.acks = {};this.receiveBuffer = [];this.sendBuffer = [];this.connected = false;this.disconnected = true;if (this.io.autoConnect) this.open();
						}Emitter(Socket.prototype);Socket.prototype.subEvents = function () {
							if (this.subs) return;var io = this.io;this.subs = [on(io, "open", bind(this, "onopen")), on(io, "packet", bind(this, "onpacket")), on(io, "close", bind(this, "onclose"))];
						};Socket.prototype.open = Socket.prototype.connect = function () {
							if (this.connected) return this;this.subEvents();this.io.open();if ("open" == this.io.readyState) this.onopen();this.emit("connecting");return this;
						};Socket.prototype.send = function () {
							var args = toArray(arguments);args.unshift("message");this.emit.apply(this, args);return this;
						};Socket.prototype.emit = function (ev) {
							if (events.hasOwnProperty(ev)) {
								emit.apply(this, arguments);return this;
							}var args = toArray(arguments);var parserType = parser.EVENT;if (hasBin(args)) {
								parserType = parser.BINARY_EVENT;
							}var packet = { type: parserType, data: args };packet.options = {};packet.options.compress = !this.flags || false !== this.flags.compress;if ("function" == typeof args[args.length - 1]) {
								debug("emitting packet with ack id %d", this.ids);this.acks[this.ids] = args.pop();packet.id = this.ids++;
							}if (this.connected) {
								this.packet(packet);
							} else {
								this.sendBuffer.push(packet);
							}delete this.flags;return this;
						};Socket.prototype.packet = function (packet) {
							packet.nsp = this.nsp;this.io.packet(packet);
						};Socket.prototype.onopen = function () {
							debug("transport is open - connecting");if ("/" != this.nsp) {
								this.packet({ type: parser.CONNECT });
							}
						};Socket.prototype.onclose = function (reason) {
							debug("close (%s)", reason);this.connected = false;this.disconnected = true;delete this.id;this.emit("disconnect", reason);
						};Socket.prototype.onpacket = function (packet) {
							if (packet.nsp != this.nsp) return;switch (packet.type) {case parser.CONNECT:
									this.onconnect();break;case parser.EVENT:
									this.onevent(packet);break;case parser.BINARY_EVENT:
									this.onevent(packet);break;case parser.ACK:
									this.onack(packet);break;case parser.BINARY_ACK:
									this.onack(packet);break;case parser.DISCONNECT:
									this.ondisconnect();break;case parser.ERROR:
									this.emit("error", packet.data);break;}
						};Socket.prototype.onevent = function (packet) {
							var args = packet.data || [];debug("emitting event %j", args);if (null != packet.id) {
								debug("attaching ack callback to event");args.push(this.ack(packet.id));
							}if (this.connected) {
								emit.apply(this, args);
							} else {
								this.receiveBuffer.push(args);
							}
						};Socket.prototype.ack = function (id) {
							var self = this;var sent = false;return function () {
								if (sent) return;sent = true;var args = toArray(arguments);debug("sending ack %j", args);var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;self.packet({ type: type, id: id, data: args });
							};
						};Socket.prototype.onack = function (packet) {
							var ack = this.acks[packet.id];if ("function" == typeof ack) {
								debug("calling ack %s with %j", packet.id, packet.data);ack.apply(this, packet.data);delete this.acks[packet.id];
							} else {
								debug("bad ack %s", packet.id);
							}
						};Socket.prototype.onconnect = function () {
							this.connected = true;this.disconnected = false;this.emit("connect");this.emitBuffered();
						};Socket.prototype.emitBuffered = function () {
							var i;for (i = 0; i < this.receiveBuffer.length; i++) {
								emit.apply(this, this.receiveBuffer[i]);
							}this.receiveBuffer = [];for (i = 0; i < this.sendBuffer.length; i++) {
								this.packet(this.sendBuffer[i]);
							}this.sendBuffer = [];
						};Socket.prototype.ondisconnect = function () {
							debug("server disconnect (%s)", this.nsp);this.destroy();this.onclose("io server disconnect");
						};Socket.prototype.destroy = function () {
							if (this.subs) {
								for (var i = 0; i < this.subs.length; i++) {
									this.subs[i].destroy();
								}this.subs = null;
							}this.io.destroy(this);
						};Socket.prototype.close = Socket.prototype.disconnect = function () {
							if (this.connected) {
								debug("performing disconnect (%s)", this.nsp);this.packet({ type: parser.DISCONNECT });
							}this.destroy();if (this.connected) {
								this.onclose("io client disconnect");
							}return this;
						};Socket.prototype.compress = function (compress) {
							this.flags = this.flags || {};this.flags.compress = compress;return this;
						};
					}, { "./on": 33, "component-bind": 37, "component-emitter": 38, debug: 39, "has-binary": 41, "socket.io-parser": 47, "to-array": 51 }], 35: [function (_dereq_, module, exports) {
						(function (global) {
							var parseuri = _dereq_("parseuri");var debug = _dereq_("debug")("socket.io-client:url");module.exports = url;function url(uri, loc) {
								var obj = uri;var loc = loc || global.location;if (null == uri) uri = loc.protocol + "//" + loc.host;if ("string" == typeof uri) {
									if ("/" == uri.charAt(0)) {
										if ("/" == uri.charAt(1)) {
											uri = loc.protocol + uri;
										} else {
											uri = loc.host + uri;
										}
									}if (!/^(https?|wss?):\/\//.test(uri)) {
										debug("protocol-less url %s", uri);if ("undefined" != typeof loc) {
											uri = loc.protocol + "//" + uri;
										} else {
											uri = "https://" + uri;
										}
									}debug("parse %s", uri);obj = parseuri(uri);
								}if (!obj.port) {
									if (/^(http|ws)$/.test(obj.protocol)) {
										obj.port = "80";
									} else if (/^(http|ws)s$/.test(obj.protocol)) {
										obj.port = "443";
									}
								}obj.path = obj.path || "/";var ipv6 = obj.host.indexOf(":") !== -1;var host = ipv6 ? "[" + obj.host + "]" : obj.host;obj.id = obj.protocol + "://" + host + ":" + obj.port;obj.href = obj.protocol + "://" + host + (loc && loc.port == obj.port ? "" : ":" + obj.port);return obj;
							}
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { debug: 39, parseuri: 45 }], 36: [function (_dereq_, module, exports) {
						module.exports = Backoff;function Backoff(opts) {
							opts = opts || {};this.ms = opts.min || 100;this.max = opts.max || 1e4;this.factor = opts.factor || 2;this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;this.attempts = 0;
						}Backoff.prototype.duration = function () {
							var ms = this.ms * Math.pow(this.factor, this.attempts++);if (this.jitter) {
								var rand = Math.random();var deviation = Math.floor(rand * this.jitter * ms);ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
							}return Math.min(ms, this.max) | 0;
						};Backoff.prototype.reset = function () {
							this.attempts = 0;
						};Backoff.prototype.setMin = function (min) {
							this.ms = min;
						};Backoff.prototype.setMax = function (max) {
							this.max = max;
						};Backoff.prototype.setJitter = function (jitter) {
							this.jitter = jitter;
						};
					}, {}], 37: [function (_dereq_, module, exports) {
						var slice = [].slice;module.exports = function (obj, fn) {
							if ("string" == typeof fn) fn = obj[fn];if ("function" != typeof fn) throw new Error("bind() requires a function");var args = slice.call(arguments, 2);return function () {
								return fn.apply(obj, args.concat(slice.call(arguments)));
							};
						};
					}, {}], 38: [function (_dereq_, module, exports) {
						module.exports = Emitter;function Emitter(obj) {
							if (obj) return mixin(obj);
						}function mixin(obj) {
							for (var key in Emitter.prototype) {
								obj[key] = Emitter.prototype[key];
							}return obj;
						}Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
							this._callbacks = this._callbacks || {};(this._callbacks["$" + event] = this._callbacks["$" + event] || []).push(fn);return this;
						};Emitter.prototype.once = function (event, fn) {
							function on() {
								this.off(event, on);fn.apply(this, arguments);
							}on.fn = fn;this.on(event, on);return this;
						};Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
							this._callbacks = this._callbacks || {};if (0 == arguments.length) {
								this._callbacks = {};return this;
							}var callbacks = this._callbacks["$" + event];if (!callbacks) return this;if (1 == arguments.length) {
								delete this._callbacks["$" + event];return this;
							}var cb;for (var i = 0; i < callbacks.length; i++) {
								cb = callbacks[i];if (cb === fn || cb.fn === fn) {
									callbacks.splice(i, 1);break;
								}
							}return this;
						};Emitter.prototype.emit = function (event) {
							this._callbacks = this._callbacks || {};var args = [].slice.call(arguments, 1),
							    callbacks = this._callbacks["$" + event];if (callbacks) {
								callbacks = callbacks.slice(0);for (var i = 0, len = callbacks.length; i < len; ++i) {
									callbacks[i].apply(this, args);
								}
							}return this;
						};Emitter.prototype.listeners = function (event) {
							this._callbacks = this._callbacks || {};return this._callbacks["$" + event] || [];
						};Emitter.prototype.hasListeners = function (event) {
							return !!this.listeners(event).length;
						};
					}, {}], 39: [function (_dereq_, module, exports) {
						arguments[4][17][0].apply(exports, arguments);
					}, { "./debug": 40, dup: 17 }], 40: [function (_dereq_, module, exports) {
						arguments[4][18][0].apply(exports, arguments);
					}, { dup: 18, ms: 44 }], 41: [function (_dereq_, module, exports) {
						(function (global) {
							var isArray = _dereq_("isarray");module.exports = hasBinary;function hasBinary(data) {
								function _hasBinary(obj) {
									if (!obj) return false;if (global.Buffer && global.Buffer.isBuffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer || global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
										return true;
									}if (isArray(obj)) {
										for (var i = 0; i < obj.length; i++) {
											if (_hasBinary(obj[i])) {
												return true;
											}
										}
									} else if (obj && "object" == typeof obj) {
										if (obj.toJSON && "function" == typeof obj.toJSON) {
											obj = obj.toJSON();
										}for (var key in obj) {
											if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
												return true;
											}
										}
									}return false;
								}return _hasBinary(data);
							}
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { isarray: 43 }], 42: [function (_dereq_, module, exports) {
						arguments[4][23][0].apply(exports, arguments);
					}, { dup: 23 }], 43: [function (_dereq_, module, exports) {
						arguments[4][24][0].apply(exports, arguments);
					}, { dup: 24 }], 44: [function (_dereq_, module, exports) {
						arguments[4][25][0].apply(exports, arguments);
					}, { dup: 25 }], 45: [function (_dereq_, module, exports) {
						arguments[4][28][0].apply(exports, arguments);
					}, { dup: 28 }], 46: [function (_dereq_, module, exports) {
						(function (global) {
							var isArray = _dereq_("isarray");var isBuf = _dereq_("./is-buffer");exports.deconstructPacket = function (packet) {
								var buffers = [];var packetData = packet.data;function _deconstructPacket(data) {
									if (!data) return data;if (isBuf(data)) {
										var placeholder = { _placeholder: true, num: buffers.length };buffers.push(data);return placeholder;
									} else if (isArray(data)) {
										var newData = new Array(data.length);for (var i = 0; i < data.length; i++) {
											newData[i] = _deconstructPacket(data[i]);
										}return newData;
									} else if ("object" == typeof data && !(data instanceof Date)) {
										var newData = {};for (var key in data) {
											newData[key] = _deconstructPacket(data[key]);
										}return newData;
									}return data;
								}var pack = packet;pack.data = _deconstructPacket(packetData);pack.attachments = buffers.length;return { packet: pack, buffers: buffers };
							};exports.reconstructPacket = function (packet, buffers) {
								var curPlaceHolder = 0;function _reconstructPacket(data) {
									if (data && data._placeholder) {
										var buf = buffers[data.num];return buf;
									} else if (isArray(data)) {
										for (var i = 0; i < data.length; i++) {
											data[i] = _reconstructPacket(data[i]);
										}return data;
									} else if (data && "object" == typeof data) {
										for (var key in data) {
											data[key] = _reconstructPacket(data[key]);
										}return data;
									}return data;
								}packet.data = _reconstructPacket(packet.data);packet.attachments = undefined;return packet;
							};exports.removeBlobs = function (data, callback) {
								function _removeBlobs(obj, curKey, containingObject) {
									if (!obj) return obj;if (global.Blob && obj instanceof Blob || global.File && obj instanceof File) {
										pendingBlobs++;var fileReader = new FileReader();fileReader.onload = function () {
											if (containingObject) {
												containingObject[curKey] = this.result;
											} else {
												bloblessData = this.result;
											}if (! --pendingBlobs) {
												callback(bloblessData);
											}
										};fileReader.readAsArrayBuffer(obj);
									} else if (isArray(obj)) {
										for (var i = 0; i < obj.length; i++) {
											_removeBlobs(obj[i], i, obj);
										}
									} else if (obj && "object" == typeof obj && !isBuf(obj)) {
										for (var key in obj) {
											_removeBlobs(obj[key], key, obj);
										}
									}
								}var pendingBlobs = 0;var bloblessData = data;_removeBlobs(bloblessData);if (!pendingBlobs) {
									callback(bloblessData);
								}
							};
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, { "./is-buffer": 48, isarray: 43 }], 47: [function (_dereq_, module, exports) {
						var debug = _dereq_("debug")("socket.io-parser");var json = _dereq_("json3");var isArray = _dereq_("isarray");var Emitter = _dereq_("component-emitter");var binary = _dereq_("./binary");var isBuf = _dereq_("./is-buffer");exports.protocol = 4;exports.types = ["CONNECT", "DISCONNECT", "EVENT", "BINARY_EVENT", "ACK", "BINARY_ACK", "ERROR"];exports.CONNECT = 0;exports.DISCONNECT = 1;exports.EVENT = 2;exports.ACK = 3;exports.ERROR = 4;exports.BINARY_EVENT = 5;exports.BINARY_ACK = 6;exports.Encoder = Encoder;exports.Decoder = Decoder;function Encoder() {}Encoder.prototype.encode = function (obj, callback) {
							debug("encoding packet %j", obj);if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
								encodeAsBinary(obj, callback);
							} else {
								var encoding = encodeAsString(obj);callback([encoding]);
							}
						};function encodeAsString(obj) {
							var str = "";var nsp = false;str += obj.type;if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
								str += obj.attachments;str += "-";
							}if (obj.nsp && "/" != obj.nsp) {
								nsp = true;str += obj.nsp;
							}if (null != obj.id) {
								if (nsp) {
									str += ",";nsp = false;
								}str += obj.id;
							}if (null != obj.data) {
								if (nsp) str += ",";str += json.stringify(obj.data);
							}debug("encoded %j as %s", obj, str);return str;
						}function encodeAsBinary(obj, callback) {
							function writeEncoding(bloblessData) {
								var deconstruction = binary.deconstructPacket(bloblessData);var pack = encodeAsString(deconstruction.packet);var buffers = deconstruction.buffers;buffers.unshift(pack);callback(buffers);
							}binary.removeBlobs(obj, writeEncoding);
						}function Decoder() {
							this.reconstructor = null;
						}Emitter(Decoder.prototype);Decoder.prototype.add = function (obj) {
							var packet;if ("string" == typeof obj) {
								packet = decodeString(obj);if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) {
									this.reconstructor = new BinaryReconstructor(packet);if (this.reconstructor.reconPack.attachments === 0) {
										this.emit("decoded", packet);
									}
								} else {
									this.emit("decoded", packet);
								}
							} else if (isBuf(obj) || obj.base64) {
								if (!this.reconstructor) {
									throw new Error("got binary data when not reconstructing a packet");
								} else {
									packet = this.reconstructor.takeBinaryData(obj);if (packet) {
										this.reconstructor = null;this.emit("decoded", packet);
									}
								}
							} else {
								throw new Error("Unknown type: " + obj);
							}
						};function decodeString(str) {
							var p = {};var i = 0;p.type = Number(str.charAt(0));if (null == exports.types[p.type]) return error();if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
								var buf = "";while (str.charAt(++i) != "-") {
									buf += str.charAt(i);if (i == str.length) break;
								}if (buf != Number(buf) || str.charAt(i) != "-") {
									throw new Error("Illegal attachments");
								}p.attachments = Number(buf);
							}if ("/" == str.charAt(i + 1)) {
								p.nsp = "";while (++i) {
									var c = str.charAt(i);if ("," == c) break;p.nsp += c;if (i == str.length) break;
								}
							} else {
								p.nsp = "/";
							}var next = str.charAt(i + 1);if ("" !== next && Number(next) == next) {
								p.id = "";while (++i) {
									var c = str.charAt(i);if (null == c || Number(c) != c) {
										--i;break;
									}p.id += str.charAt(i);if (i == str.length) break;
								}p.id = Number(p.id);
							}if (str.charAt(++i)) {
								try {
									p.data = json.parse(str.substr(i));
								} catch (e) {
									return error();
								}
							}debug("decoded %s as %j", str, p);return p;
						}Decoder.prototype.destroy = function () {
							if (this.reconstructor) {
								this.reconstructor.finishedReconstruction();
							}
						};function BinaryReconstructor(packet) {
							this.reconPack = packet;this.buffers = [];
						}BinaryReconstructor.prototype.takeBinaryData = function (binData) {
							this.buffers.push(binData);if (this.buffers.length == this.reconPack.attachments) {
								var packet = binary.reconstructPacket(this.reconPack, this.buffers);this.finishedReconstruction();return packet;
							}return null;
						};BinaryReconstructor.prototype.finishedReconstruction = function () {
							this.reconPack = null;this.buffers = [];
						};function error(data) {
							return { type: exports.ERROR, data: "parser error" };
						}
					}, { "./binary": 46, "./is-buffer": 48, "component-emitter": 49, debug: 39, isarray: 43, json3: 50 }], 48: [function (_dereq_, module, exports) {
						(function (global) {
							module.exports = isBuf;function isBuf(obj) {
								return global.Buffer && global.Buffer.isBuffer(obj) || global.ArrayBuffer && obj instanceof ArrayBuffer;
							}
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, {}], 49: [function (_dereq_, module, exports) {
						arguments[4][15][0].apply(exports, arguments);
					}, { dup: 15 }], 50: [function (_dereq_, module, exports) {
						(function (global) {
							(function () {
								var isLoader = typeof define === "function" && define.amd;var objectTypes = { "function": true, object: true };var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;var root = objectTypes[typeof window] && window || this,
								    freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
									root = freeGlobal;
								}function runInContext(context, exports) {
									context || (context = root["Object"]());exports || (exports = root["Object"]());var Number = context["Number"] || root["Number"],
									    String = context["String"] || root["String"],
									    Object = context["Object"] || root["Object"],
									    Date = context["Date"] || root["Date"],
									    SyntaxError = context["SyntaxError"] || root["SyntaxError"],
									    TypeError = context["TypeError"] || root["TypeError"],
									    Math = context["Math"] || root["Math"],
									    nativeJSON = context["JSON"] || root["JSON"];if (typeof nativeJSON == "object" && nativeJSON) {
										exports.stringify = nativeJSON.stringify;exports.parse = nativeJSON.parse;
									}var objectProto = Object.prototype,
									    getClass = objectProto.toString,
									    isProperty,
									    forEach,
									    undef;var isExtended = new Date(-0xc782b5b800cec);try {
										isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 && isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
									} catch (exception) {}function has(name) {
										if (has[name] !== undef) {
											return has[name];
										}var isSupported;if (name == "bug-string-char-index") {
											isSupported = "a"[0] != "a";
										} else if (name == "json") {
											isSupported = has("json-stringify") && has("json-parse");
										} else {
											var value,
											    serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';if (name == "json-stringify") {
												var stringify = exports.stringify,
												    stringifySupported = typeof stringify == "function" && isExtended;if (stringifySupported) {
													(value = function () {
														return 1;
													}).toJSON = value;try {
														stringifySupported = stringify(0) === "0" && stringify(new Number()) === "0" && stringify(new String()) == '""' && stringify(getClass) === undef && stringify(undef) === undef && stringify() === undef && stringify(value) === "1" && stringify([value]) == "[1]" && stringify([undef]) == "[null]" && stringify(null) == "null" && stringify([undef, getClass, null]) == "[null,null,null]" && stringify({ a: [value, true, false, null, "\x00\b\n\f\r	"] }) == serialized && stringify(null, value) === "1" && stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" && stringify(new Date(-864e13)) == '"-271821-04-20T00:00:00.000Z"' && stringify(new Date(864e13)) == '"+275760-09-13T00:00:00.000Z"' && stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' && stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
													} catch (exception) {
														stringifySupported = false;
													}
												}isSupported = stringifySupported;
											}if (name == "json-parse") {
												var parse = exports.parse;if (typeof parse == "function") {
													try {
														if (parse("0") === 0 && !parse(false)) {
															value = parse(serialized);var parseSupported = value["a"].length == 5 && value["a"][0] === 1;if (parseSupported) {
																try {
																	parseSupported = !parse('"	"');
																} catch (exception) {}if (parseSupported) {
																	try {
																		parseSupported = parse("01") !== 1;
																	} catch (exception) {}
																}if (parseSupported) {
																	try {
																		parseSupported = parse("1.") !== 1;
																	} catch (exception) {}
																}
															}
														}
													} catch (exception) {
														parseSupported = false;
													}
												}isSupported = parseSupported;
											}
										}return has[name] = !!isSupported;
									}if (!has("json")) {
										var functionClass = "[object Function]",
										    dateClass = "[object Date]",
										    numberClass = "[object Number]",
										    stringClass = "[object String]",
										    arrayClass = "[object Array]",
										    booleanClass = "[object Boolean]";var charIndexBuggy = has("bug-string-char-index");if (!isExtended) {
											var floor = Math.floor;var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];var getDay = function (year, month) {
												return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
											};
										}if (!(isProperty = objectProto.hasOwnProperty)) {
											isProperty = function (property) {
												var members = {},
												    constructor;if ((members.__proto__ = null, members.__proto__ = { toString: 1 }, members).toString != getClass) {
													isProperty = function (property) {
														var original = this.__proto__,
														    result = property in (this.__proto__ = null, this);this.__proto__ = original;return result;
													};
												} else {
													constructor = members.constructor;isProperty = function (property) {
														var parent = (this.constructor || constructor).prototype;return property in this && !(property in parent && this[property] === parent[property]);
													};
												}members = null;return isProperty.call(this, property);
											};
										}forEach = function (object, callback) {
											var size = 0,
											    Properties,
											    members,
											    property;(Properties = function () {
												this.valueOf = 0;
											}).prototype.valueOf = 0;members = new Properties();for (property in members) {
												if (isProperty.call(members, property)) {
													size++;
												}
											}Properties = members = null;if (!size) {
												members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];forEach = function (object, callback) {
													var isFunction = getClass.call(object) == functionClass,
													    property,
													    length;var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;for (property in object) {
														if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
															callback(property);
														}
													}for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
												};
											} else if (size == 2) {
												forEach = function (object, callback) {
													var members = {},
													    isFunction = getClass.call(object) == functionClass,
													    property;for (property in object) {
														if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
															callback(property);
														}
													}
												};
											} else {
												forEach = function (object, callback) {
													var isFunction = getClass.call(object) == functionClass,
													    property,
													    isConstructor;for (property in object) {
														if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
															callback(property);
														}
													}if (isConstructor || isProperty.call(object, property = "constructor")) {
														callback(property);
													}
												};
											}return forEach(object, callback);
										};if (!has("json-stringify")) {
											var Escapes = { 92: "\\\\", 34: '\\"', 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t" };var leadingZeroes = "000000";var toPaddedString = function (width, value) {
												return (leadingZeroes + (value || 0)).slice(-width);
											};var unicodePrefix = "\\u00";var quote = function (value) {
												var result = '"',
												    index = 0,
												    length = value.length,
												    useCharIndex = !charIndexBuggy || length > 10;var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);for (; index < length; index++) {
													var charCode = value.charCodeAt(index);switch (charCode) {case 8:case 9:case 10:case 12:case 13:case 34:case 92:
															result += Escapes[charCode];break;default:
															if (charCode < 32) {
																result += unicodePrefix + toPaddedString(2, charCode.toString(16));break;
															}result += useCharIndex ? symbols[index] : value.charAt(index);}
												}return result + '"';
											};var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
												var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;try {
													value = object[property];
												} catch (exception) {}if (typeof value == "object" && value) {
													className = getClass.call(value);if (className == dateClass && !isProperty.call(value, "toJSON")) {
														if (value > -1 / 0 && value < 1 / 0) {
															if (getDay) {
																date = floor(value / 864e5);for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);date = 1 + date - getDay(year, month);time = (value % 864e5 + 864e5) % 864e5;hours = floor(time / 36e5) % 24;minutes = floor(time / 6e4) % 60;seconds = floor(time / 1e3) % 60;milliseconds = time % 1e3;
															} else {
																year = value.getUTCFullYear();month = value.getUTCMonth();date = value.getUTCDate();hours = value.getUTCHours();minutes = value.getUTCMinutes();seconds = value.getUTCSeconds();milliseconds = value.getUTCMilliseconds();
															}value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) + "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) + "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) + "." + toPaddedString(3, milliseconds) + "Z";
														} else {
															value = null;
														}
													} else if (typeof value.toJSON == "function" && (className != numberClass && className != stringClass && className != arrayClass || isProperty.call(value, "toJSON"))) {
														value = value.toJSON(property);
													}
												}if (callback) {
													value = callback.call(object, property, value);
												}if (value === null) {
													return "null";
												}className = getClass.call(value);if (className == booleanClass) {
													return "" + value;
												} else if (className == numberClass) {
													return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
												} else if (className == stringClass) {
													return quote("" + value);
												}if (typeof value == "object") {
													for (length = stack.length; length--;) {
														if (stack[length] === value) {
															throw TypeError();
														}
													}stack.push(value);results = [];prefix = indentation;indentation += whitespace;if (className == arrayClass) {
														for (index = 0, length = value.length; index < length; index++) {
															element = serialize(index, value, callback, properties, whitespace, indentation, stack);results.push(element === undef ? "null" : element);
														}result = results.length ? whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : "[" + results.join(",") + "]" : "[]";
													} else {
														forEach(properties || value, function (property) {
															var element = serialize(property, value, callback, properties, whitespace, indentation, stack);if (element !== undef) {
																results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
															}
														});result = results.length ? whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : "{" + results.join(",") + "}" : "{}";
													}stack.pop();return result;
												}
											};exports.stringify = function (source, filter, width) {
												var whitespace, callback, properties, className;if (objectTypes[typeof filter] && filter) {
													if ((className = getClass.call(filter)) == functionClass) {
														callback = filter;
													} else if (className == arrayClass) {
														properties = {};for (var index = 0, length = filter.length, value; index < length; value = filter[index++], (className = getClass.call(value), className == stringClass || className == numberClass) && (properties[value] = 1));
													}
												}if (width) {
													if ((className = getClass.call(width)) == numberClass) {
														if ((width -= width % 1) > 0) {
															for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
														}
													} else if (className == stringClass) {
														whitespace = width.length <= 10 ? width : width.slice(0, 10);
													}
												}return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
											};
										}if (!has("json-parse")) {
											var fromCharCode = String.fromCharCode;var Unescapes = { 92: "\\", 34: '"', 47: "/", 98: "\b", 116: "	", 110: "\n", 102: "\f", 114: "\r" };var Index, Source;var abort = function () {
												Index = Source = null;throw SyntaxError();
											};var lex = function () {
												var source = Source,
												    length = source.length,
												    value,
												    begin,
												    position,
												    isSigned,
												    charCode;while (Index < length) {
													charCode = source.charCodeAt(Index);switch (charCode) {case 9:case 10:case 13:case 32:
															Index++;break;case 123:case 125:case 91:case 93:case 58:case 44:
															value = charIndexBuggy ? source.charAt(Index) : source[Index];Index++;return value;case 34:
															for (value = "@", Index++; Index < length;) {
																charCode = source.charCodeAt(Index);if (charCode < 32) {
																	abort();
																} else if (charCode == 92) {
																	charCode = source.charCodeAt(++Index);switch (charCode) {case 92:case 34:case 47:case 98:case 116:case 110:case 102:case 114:
																			value += Unescapes[charCode];Index++;break;case 117:
																			begin = ++Index;for (position = Index + 4; Index < position; Index++) {
																				charCode = source.charCodeAt(Index);if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
																					abort();
																				}
																			}value += fromCharCode("0x" + source.slice(begin, Index));break;default:
																			abort();}
																} else {
																	if (charCode == 34) {
																		break;
																	}charCode = source.charCodeAt(Index);begin = Index;while (charCode >= 32 && charCode != 92 && charCode != 34) {
																		charCode = source.charCodeAt(++Index);
																	}value += source.slice(begin, Index);
																}
															}if (source.charCodeAt(Index) == 34) {
																Index++;return value;
															}abort();default:
															begin = Index;if (charCode == 45) {
																isSigned = true;charCode = source.charCodeAt(++Index);
															}if (charCode >= 48 && charCode <= 57) {
																if (charCode == 48 && (charCode = source.charCodeAt(Index + 1), charCode >= 48 && charCode <= 57)) {
																	abort();
																}isSigned = false;for (; Index < length && (charCode = source.charCodeAt(Index), charCode >= 48 && charCode <= 57); Index++);if (source.charCodeAt(Index) == 46) {
																	position = ++Index;for (; position < length && (charCode = source.charCodeAt(position), charCode >= 48 && charCode <= 57); position++);if (position == Index) {
																		abort();
																	}Index = position;
																}charCode = source.charCodeAt(Index);if (charCode == 101 || charCode == 69) {
																	charCode = source.charCodeAt(++Index);if (charCode == 43 || charCode == 45) {
																		Index++;
																	}for (position = Index; position < length && (charCode = source.charCodeAt(position), charCode >= 48 && charCode <= 57); position++);if (position == Index) {
																		abort();
																	}Index = position;
																}return +source.slice(begin, Index);
															}if (isSigned) {
																abort();
															}if (source.slice(Index, Index + 4) == "true") {
																Index += 4;return true;
															} else if (source.slice(Index, Index + 5) == "false") {
																Index += 5;return false;
															} else if (source.slice(Index, Index + 4) == "null") {
																Index += 4;return null;
															}abort();}
												}return "$";
											};var get = function (value) {
												var results, hasMembers;if (value == "$") {
													abort();
												}if (typeof value == "string") {
													if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
														return value.slice(1);
													}if (value == "[") {
														results = [];for (;; hasMembers || (hasMembers = true)) {
															value = lex();if (value == "]") {
																break;
															}if (hasMembers) {
																if (value == ",") {
																	value = lex();if (value == "]") {
																		abort();
																	}
																} else {
																	abort();
																}
															}if (value == ",") {
																abort();
															}results.push(get(value));
														}return results;
													} else if (value == "{") {
														results = {};for (;; hasMembers || (hasMembers = true)) {
															value = lex();if (value == "}") {
																break;
															}if (hasMembers) {
																if (value == ",") {
																	value = lex();if (value == "}") {
																		abort();
																	}
																} else {
																	abort();
																}
															}if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
																abort();
															}results[value.slice(1)] = get(lex());
														}return results;
													}abort();
												}return value;
											};var update = function (source, property, callback) {
												var element = walk(source, property, callback);if (element === undef) {
													delete source[property];
												} else {
													source[property] = element;
												}
											};var walk = function (source, property, callback) {
												var value = source[property],
												    length;if (typeof value == "object" && value) {
													if (getClass.call(value) == arrayClass) {
														for (length = value.length; length--;) {
															update(value, length, callback);
														}
													} else {
														forEach(value, function (property) {
															update(value, property, callback);
														});
													}
												}return callback.call(source, property, value);
											};exports.parse = function (source, callback) {
												var result, value;Index = 0;Source = "" + source;result = get(lex());if (lex() != "$") {
													abort();
												}Index = Source = null;return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
											};
										}
									}exports["runInContext"] = runInContext;return exports;
								}if (freeExports && !isLoader) {
									runInContext(root, freeExports);
								} else {
									var nativeJSON = root.JSON,
									    previousJSON = root["JSON3"],
									    isRestored = false;var JSON3 = runInContext(root, root["JSON3"] = { noConflict: function () {
											if (!isRestored) {
												isRestored = true;root.JSON = nativeJSON;root["JSON3"] = previousJSON;nativeJSON = previousJSON = null;
											}return JSON3;
										} });root.JSON = { parse: JSON3.parse, stringify: JSON3.stringify };
								}if (isLoader) {
									define(function () {
										return JSON3;
									});
								}
							}).call(this);
						}).call(this, typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
					}, {}], 51: [function (_dereq_, module, exports) {
						module.exports = toArray;function toArray(list, index) {
							var array = [];index = index || 0;for (var i = index || 0; i < list.length; i++) {
								array[i - index] = list[i];
							}return array;
						}
					}, {}] }, {}, [31])(31);
			});
		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
	}, {}], 14: [function (require, module, exports) {
		(function (a, b) {
			if (typeof define === "function" && define.amd) {
				define([], b);
			} else {
				if (typeof exports === "object") {
					module.exports = b();
				} else {
					a.X2JS = b();
				}
			}
		})(this, function () {
			return function (z) {
				var t = "1.2.0";z = z || {};i();u();function i() {
					if (z.escapeMode === undefined) {
						z.escapeMode = true;
					}z.attributePrefix = z.attributePrefix || "_";z.arrayAccessForm = z.arrayAccessForm || "none";z.emptyNodeForm = z.emptyNodeForm || "text";if (z.enableToStringFunc === undefined) {
						z.enableToStringFunc = true;
					}z.arrayAccessFormPaths = z.arrayAccessFormPaths || [];if (z.skipEmptyTextNodesForObj === undefined) {
						z.skipEmptyTextNodesForObj = true;
					}if (z.stripWhitespaces === undefined) {
						z.stripWhitespaces = true;
					}z.datetimeAccessFormPaths = z.datetimeAccessFormPaths || [];if (z.useDoubleQuotes === undefined) {
						z.useDoubleQuotes = false;
					}z.xmlElementsFilter = z.xmlElementsFilter || [];z.jsonPropertiesFilter = z.jsonPropertiesFilter || [];if (z.keepCData === undefined) {
						z.keepCData = false;
					}
				}var h = { ELEMENT_NODE: 1, TEXT_NODE: 3, CDATA_SECTION_NODE: 4, COMMENT_NODE: 8, DOCUMENT_NODE: 9 };function u() {}function x(B) {
					var C = B.localName;if (C == null) {
						C = B.baseName;
					}if (C == null || C == "") {
						C = B.nodeName;
					}return C;
				}function r(B) {
					return B.prefix;
				}function s(B) {
					if (typeof B == "string") {
						return B.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
					} else {
						return B;
					}
				}function k(B) {
					return B.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
				}function w(C, F, D, E) {
					var B = 0;for (; B < C.length; B++) {
						var G = C[B];if (typeof G === "string") {
							if (G == E) {
								break;
							}
						} else {
							if (G instanceof RegExp) {
								if (G.test(E)) {
									break;
								}
							} else {
								if (typeof G === "function") {
									if (G(F, D, E)) {
										break;
									}
								}
							}
						}
					}return B != C.length;
				}function n(D, B, C) {
					switch (z.arrayAccessForm) {case "property":
							if (!(D[B] instanceof Array)) {
								D[B + "_asArray"] = [D[B]];
							} else {
								D[B + "_asArray"] = D[B];
							}break;}if (!(D[B] instanceof Array) && z.arrayAccessFormPaths.length > 0) {
						if (w(z.arrayAccessFormPaths, D, B, C)) {
							D[B] = [D[B]];
						}
					}
				}function a(G) {
					var E = G.split(/[-T:+Z]/g);var F = new Date(E[0], E[1] - 1, E[2]);var D = E[5].split(".");F.setHours(E[3], E[4], D[0]);if (D.length > 1) {
						F.setMilliseconds(D[1]);
					}if (E[6] && E[7]) {
						var C = E[6] * 60 + Number(E[7]);var B = /\d\d-\d\d:\d\d$/.test(G) ? "-" : "+";C = 0 + (B == "-" ? -1 * C : C);F.setMinutes(F.getMinutes() - C - F.getTimezoneOffset());
					} else {
						if (G.indexOf("Z", G.length - 1) !== -1) {
							F = new Date(Date.UTC(F.getFullYear(), F.getMonth(), F.getDate(), F.getHours(), F.getMinutes(), F.getSeconds(), F.getMilliseconds()));
						}
					}return F;
				}function q(D, B, C) {
					if (z.datetimeAccessFormPaths.length > 0) {
						var E = C.split(".#")[0];if (w(z.datetimeAccessFormPaths, D, B, E)) {
							return a(D);
						} else {
							return D;
						}
					} else {
						return D;
					}
				}function b(E, C, B, D) {
					if (C == h.ELEMENT_NODE && z.xmlElementsFilter.length > 0) {
						return w(z.xmlElementsFilter, E, B, D);
					} else {
						return true;
					}
				}function A(D, J) {
					if (D.nodeType == h.DOCUMENT_NODE) {
						var K = new Object();var B = D.childNodes;for (var L = 0; L < B.length; L++) {
							var C = B.item(L);if (C.nodeType == h.ELEMENT_NODE) {
								var I = x(C);K[I] = A(C, I);
							}
						}return K;
					} else {
						if (D.nodeType == h.ELEMENT_NODE) {
							var K = new Object();K.__cnt = 0;var B = D.childNodes;for (var L = 0; L < B.length; L++) {
								var C = B.item(L);var I = x(C);if (C.nodeType != h.COMMENT_NODE) {
									var H = J + "." + I;if (b(K, C.nodeType, I, H)) {
										K.__cnt++;if (K[I] == null) {
											K[I] = A(C, H);n(K, I, H);
										} else {
											if (K[I] != null) {
												if (!(K[I] instanceof Array)) {
													K[I] = [K[I]];n(K, I, H);
												}
											}K[I][K[I].length] = A(C, H);
										}
									}
								}
							}for (var E = 0; E < D.attributes.length; E++) {
								var F = D.attributes.item(E);K.__cnt++;K[z.attributePrefix + F.name] = F.value;
							}var G = r(D);if (G != null && G != "") {
								K.__cnt++;K.__prefix = G;
							}if (K["#text"] != null) {
								K.__text = K["#text"];if (K.__text instanceof Array) {
									K.__text = K.__text.join("\n");
								}if (z.stripWhitespaces) {
									K.__text = K.__text.trim();
								}delete K["#text"];if (z.arrayAccessForm == "property") {
									delete K["#text_asArray"];
								}K.__text = q(K.__text, I, J + "." + I);
							}if (K["#cdata-section"] != null) {
								K.__cdata = K["#cdata-section"];delete K["#cdata-section"];if (z.arrayAccessForm == "property") {
									delete K["#cdata-section_asArray"];
								}
							}if (K.__cnt == 0 && z.emptyNodeForm == "text") {
								K = "";
							} else {
								if (K.__cnt == 1 && K.__text != null) {
									K = K.__text;
								} else {
									if (K.__cnt == 1 && K.__cdata != null && !z.keepCData) {
										K = K.__cdata;
									} else {
										if (K.__cnt > 1 && K.__text != null && z.skipEmptyTextNodesForObj) {
											if (z.stripWhitespaces && K.__text == "" || K.__text.trim() == "") {
												delete K.__text;
											}
										}
									}
								}
							}delete K.__cnt;if (z.enableToStringFunc && (K.__text != null || K.__cdata != null)) {
								K.toString = function () {
									return (this.__text != null ? this.__text : "") + (this.__cdata != null ? this.__cdata : "");
								};
							}return K;
						} else {
							if (D.nodeType == h.TEXT_NODE || D.nodeType == h.CDATA_SECTION_NODE) {
								return D.nodeValue;
							}
						}
					}
				}function o(I, F, H, C) {
					var E = "<" + (I != null && I.__prefix != null ? I.__prefix + ":" : "") + F;if (H != null) {
						for (var G = 0; G < H.length; G++) {
							var D = H[G];var B = I[D];if (z.escapeMode) {
								B = s(B);
							}E += " " + D.substr(z.attributePrefix.length) + "=";if (z.useDoubleQuotes) {
								E += '"' + B + '"';
							} else {
								E += "'" + B + "'";
							}
						}
					}if (!C) {
						E += ">";
					} else {
						E += "/>";
					}return E;
				}function j(C, B) {
					return "</" + (C.__prefix != null ? C.__prefix + ":" : "") + B + ">";
				}function v(C, B) {
					return C.indexOf(B, C.length - B.length) !== -1;
				}function y(C, B) {
					if (z.arrayAccessForm == "property" && v(B.toString(), "_asArray") || B.toString().indexOf(z.attributePrefix) == 0 || B.toString().indexOf("__") == 0 || C[B] instanceof Function) {
						return true;
					} else {
						return false;
					}
				}function m(D) {
					var C = 0;if (D instanceof Object) {
						for (var B in D) {
							if (y(D, B)) {
								continue;
							}C++;
						}
					}return C;
				}function l(D, B, C) {
					return z.jsonPropertiesFilter.length == 0 || C == "" || w(z.jsonPropertiesFilter, D, B, C);
				}function c(D) {
					var C = [];if (D instanceof Object) {
						for (var B in D) {
							if (B.toString().indexOf("__") == -1 && B.toString().indexOf(z.attributePrefix) == 0) {
								C.push(B);
							}
						}
					}return C;
				}function g(C) {
					var B = "";if (C.__cdata != null) {
						B += "<![CDATA[" + C.__cdata + "]]>";
					}if (C.__text != null) {
						if (z.escapeMode) {
							B += s(C.__text);
						} else {
							B += C.__text;
						}
					}return B;
				}function d(C) {
					var B = "";if (C instanceof Object) {
						B += g(C);
					} else {
						if (C != null) {
							if (z.escapeMode) {
								B += s(C);
							} else {
								B += C;
							}
						}
					}return B;
				}function p(C, B) {
					if (C === "") {
						return B;
					} else {
						return C + "." + B;
					}
				}function f(D, G, F, E) {
					var B = "";if (D.length == 0) {
						B += o(D, G, F, true);
					} else {
						for (var C = 0; C < D.length; C++) {
							B += o(D[C], G, c(D[C]), false);B += e(D[C], p(E, G));B += j(D[C], G);
						}
					}return B;
				}function e(I, H) {
					var B = "";var F = m(I);if (F > 0) {
						for (var E in I) {
							if (y(I, E) || H != "" && !l(I, E, p(H, E))) {
								continue;
							}var D = I[E];var G = c(D);if (D == null || D == undefined) {
								B += o(D, E, G, true);
							} else {
								if (D instanceof Object) {
									if (D instanceof Array) {
										B += f(D, E, G, H);
									} else {
										if (D instanceof Date) {
											B += o(D, E, G, false);B += D.toISOString();B += j(D, E);
										} else {
											var C = m(D);if (C > 0 || D.__text != null || D.__cdata != null) {
												B += o(D, E, G, false);B += e(D, p(H, E));B += j(D, E);
											} else {
												B += o(D, E, G, true);
											}
										}
									}
								} else {
									B += o(D, E, G, false);B += d(D);B += j(D, E);
								}
							}
						}
					}B += d(I);return B;
				}this.parseXmlString = function (D) {
					var F = window.ActiveXObject || "ActiveXObject" in window;if (D === undefined) {
						return null;
					}var E;if (window.DOMParser) {
						var G = new window.DOMParser();var B = null;if (!F) {
							try {
								B = G.parseFromString("INVALID", "text/xml").getElementsByTagName("parsererror")[0].namespaceURI;
							} catch (C) {
								B = null;
							}
						}try {
							E = G.parseFromString(D, "text/xml");if (B != null && E.getElementsByTagNameNS(B, "parsererror").length > 0) {
								E = null;
							}
						} catch (C) {
							E = null;
						}
					} else {
						if (D.indexOf("<?") == 0) {
							D = D.substr(D.indexOf("?>") + 2);
						}E = new ActiveXObject("Microsoft.XMLDOM");E.async = "false";E.loadXML(D);
					}return E;
				};this.asArray = function (B) {
					if (B === undefined || B == null) {
						return [];
					} else {
						if (B instanceof Array) {
							return B;
						} else {
							return [B];
						}
					}
				};this.toXmlDateTime = function (B) {
					if (B instanceof Date) {
						return B.toISOString();
					} else {
						if (typeof B === "number") {
							return new Date(B).toISOString();
						} else {
							return null;
						}
					}
				};this.asDateTime = function (B) {
					if (typeof B == "string") {
						return a(B);
					} else {
						return B;
					}
				};this.xml2json = function (B) {
					return A(B);
				};this.xml_str2json = function (B) {
					var C = this.parseXmlString(B);if (C != null) {
						return this.xml2json(C);
					} else {
						return null;
					}
				};this.json2xml_str = function (B) {
					return e(B, "");
				};this.json2xml = function (C) {
					var B = this.json2xml_str(C);return this.parseXmlString(B);
				};this.getVersion = function () {
					return t;
				};
			};
		});
	}, {}], 15: [function (require, module, exports) {
		var diff = require('deep-diff');

		class GameState {
			constructor(state = null) {
				if (state == null) this.initialized = false;else this.initialized = true;
				this.state = state;
			}

			/**
    * [setState description]
    * @param {Object} newState [Nu]
    */
			setState(newState) {
				if (typeof newState != 'object' || newState == null || newState.gameState == null) throw new Error('Invalid state, ignoring update');

				if (this.initialized) {
					var diffs = this.__getDifferences(newState);
				} else {
					this.initialized = true;
				}
				this.state = newState;
				var simpleDiffsObject = this.__analyzeDifferences(diffs);
				return simpleDiffsObject;
			}

			/**
    * Utilizza la libreria deep-diff per cercare le differenze tra due stati
    * @private method
    * @param  {Object} newState [Stato da confrontare con l'ultimo stato salvato]
    * @return {Object}          [Differenze ottenute da deep-diff]
    */
			__getDifferences(newState) {
				return diff(newState, this.state);
			}

			__analyzeDifferences(diffs) {
				if (diffs == null) return [];
				var changes = {};
				var base = 1;
				for (var i = 0; i < diffs.length; i++) {
					if (diffs[i].kind == "E") {
						var path = diffs[i].path.join('.');

						if (diffs[i].path[base - 1] == 'gameState') {

							switch (diffs[i].path[base]) {
								case 'currentState':
									//E' cambiato lo stato di gioco
									changes['currentState'] = this.state.gameState.currentState;
									break;
								case 'gameMap':
									if (diffs[i].path[base + 1] == "locations") {
										changes['locations'] = [];
										for (var j = 0; j < this.state.gameState.gameMap.locations.length; j++) {
											if (j == diffs[i].path[base + 2]) {
												changes['locations'].push(this.state.gameState.gameMap.locations[i]);
											}
										}
									} else {
										changes['pawns'] = this.state.gameState.gameMap.pawns;
									}
									break;
								case 'blockades':
									changes['blockades'] = this.state.gameState.blockades;
									break;
								case 'emergencies':
									changes['emergencies'] = this.state.gameState.emergencies;
									break;
								case 'maxEmergencyLevel':
									changes['maxEmergencyLevel'] = this.state.gameState.maxEmergencyLevel;
									break;
								case 'numOfProductionCards':
									changes['numOfProductionCards'] = this.state.gameState.numOfProductionCards;
									break;
								case 'contagionRatios':
									changes['contagionRatios'] = this.state.gameState.contagionRatios;
									break;
							}
						} else {
							switch (diffs[i].path[base]) {
								case 'group':
									changes['type'] = this.state.currentTurn.type;
									changes['group'] = this.state.currentTurn.group.name;
									changes['resources'] = this.state.currentTurn.group.resources;
									break;
								case 'numActions':
								case 'maxNumActions':
									changes['numActions'] = this.state.currentTurn.numActions;
									changes['maxNumActions'] = this.state.currentTurn.maxNumActions;
									break;
							}
						}
					}
				}
				return changes;
			}

		}

		var state = new GameState(null);

		module.exports = state;

		/**var s1 = '{\"gameState\":{\"currentState\":\"GAME_ACTIVE\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"bari\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
  var s2 = '{\"gameState\":{\"currentState\":\"GAME_VICTORY\",\"gameMap\":{\"locations\":[{\"name\":\"bari\",\"locationID\":\"it.uniba.hazard.engine.map.Location_bari\",\"emergencyLevels\":[{\"emergency\":\"malattia\",\"level\":0}]}],\"pawns\":[{\"pawnID\":\"it.uniba.hazard.engine.pawns.ActionPawn_test\",\"type\":\"ActionPawn\",\"group\":\"test\",\"location\":\"roma\"}]},\"blockades\":[],\"emergencies\":[{\"name\":\"malattia\",\"resourceNeeded\":\"it.uniba.hazard.engine.main.Resource_risorsa\",\"objectID\":\"it.uniba.hazard.engine.main.Emergency_malattia\",\"generalHazardIndicator\":{\"steps\":[1,2],\"currentStepIndex\":0}}],\"maxEmergencyLevel\":5,\"numOfProductionCards\":1,\"currentStrongholdCost\":5,\"contagionRatios\":[{\"emergency\":\"malattia\",\"contagionRatio\":0.0}]},\"currentTurn\":{\"type\":\"ActionTurn\",\"group\":{\"name\":\"test\",\"resources\":[{\"resource\": \"risorsa\",\"quantity\": 5}]},\"numActions\":0,\"maxNumActions\":5}}';
  
  state.setState(JSON.parse(s1));
  console.log(state.setState(JSON.parse(s2)));**/
	}, { "deep-diff": 1 }], 16: [function (require, module, exports) {
		var l = require('../lang/Lang.js');
		var config = require('../Config.js');
		var lang = l[config['LANGUAGE']];

		/**
   * Funzioni per l'interazione con la mappa
   */
		class MapUtils {
			constructor() {}

			/**
    * Triggera l'evento "update" per l'aggiornamento della mappa. Ref: https://www.vincentbroute.fr/mapael/#update-map-data
    * @param {Object} updatedOptions [Object that contains the options to update for existing plots, areas or legends. If you want to send some areas, links or points to the front of the map, you can additionnaly pass the option 'toFront: true' for these elements.]
    * @param {Object} newPlots       [New plots to add to the map.]
    * @param {Object} deletedPlots   [Plots to delete from the map (array, or "all" to remove all plots).]
    */
			UpdateMap(updatedOptions, newPlots, deletedPlots) {

				updatedOptions ? updatedOptions : {};
				newPlots ? newPlots : {};
				deletedPlots ? deletedPlots : {};

				$(config['MAP_CONTAINER']).trigger('update', [{
					mapOptions: updatedOptions,
					newPlots: newPlots,
					deletePlotKeys: deletedPlots,
					animDuration: 1000
				}]);
			}

			/**
    * Elimina un collegamento identificato da *link*
    * @param {String} link     [ID Univoco del collegamento da eliminare]
    * @param {Number} duration [Durata dell'animazione in ms, default: 500]
    */
			RemoveLink(link, duration = 500) {
				var self = this;
				$(config['MAP_CONTAINER']).trigger('update'[{
					deleteLinkKeys: self.link,
					animDuration: self.duration
				}]);
			}

			/**
    * Aggiunge un collegamento da *from* a *to* con stile *style*
    * @param {String} from  [ID Univoco del plot di partenza]
    * @param {String} to    [ID Univoco del plot di arrivo]
    * @param {String} style [Attributo stroke-dasharray @https://www.vincentbroute.fr/mapael/raphael-js-documentation/index.html#Element.attr]
    * @param {Integer} duration [Durata dell'animazione in ms, default: 500]
    */
			AddLink(from, to, style, duration = 500) {
				var self = this;
				$(config['MAP_CONTAINER']).trigger('update'[{
					newLinks: {
						link: {
							factor: config['DEFAULT_PLOT_FACTOR'],
							between: [self.from, self.to],
							attrs: {
								'stroke-width': config['DEFAULT_PLOT_STROKE'],
								'stroke-dasharray': self.style
							}
						}
					},
					animDuration: self.duration
				}]);
			}

			/**
    * Triggera l'evento "playermove" per spostare l'icona dell'utente da fromv a tov
    * @param {String} fromv [ID univoco del plot relativo all'area di partenza (Plot)]
    * @param {String} tov   [ID univoco del plot relativo all'area di arrivo (Plot)]
    */
			MovePlayer(fromv, tov) {
				var movement = {
					from: fromv,
					to: tov
				};

				this.__removePlayer(movement.from);
				$(config['MAP_CONTAINER']).trigger('playermove', [{
					movementOptions: movement
				}]);
				this.__setPlayer(movement.to);
			}

			/**
    * Imposta l'icona utilizzata per il plot a quella di default
    * @param  {String} plot [ID univoco del plot]
    * @return NA
    */
			__removePlayer(plot) {
				var updatedOptions = { 'plots': {} };
				updatedOptions.plots[plot] = {
					type: config['DEFAULT_PLOT_TYPE'],
					size: config['DEFAULT_PLOT_SIZE']
				};
				this.UpdateMap(updatedOptions);
			}

			/**
    * Imposta l'icona utilizzata per il plot a quella del giocatore da muovere
    * @param  {String} plot [ID univoco del plot]
    * @return NA
    */
			__setPlayer(plot) {
				var updatedOptions = { 'plots': {} };
				updatedOptions.plots[plot] = {
					type: 'image',
					url: config['DEFAULT_PLOT_ICON'],
					width: config['DEFAULT_PLOT_ICON_WIDTH'],
					height: config['DEFAULT_PLOT_ICON_HEIGHT']
				};
				this.UpdateMap(updatedOptions);
			}
		}

		module.exports = MapUtils;
	}, { "../Config.js": 5, "../lang/Lang.js": 10 }], 17: [function (require, module, exports) {
		var l = require('../lang/Lang.js');
		var config = require('../Config.js');
		var lang = l[config['LANGUAGE']];

		/**
   * @class [Finestra Modale]
   */
		class ModalDialog {
			constructor() {
				this.visible = false;
			}

			/**
    * Imposto il modal
    * @param  {String} modalClass [Classe del modal], Ref: https://www.w3schools.com/bootstrap/bootstrap_modal.asp
    * @return NA
    */
			setup(modalClass = config['MODAL_CLASS']) {
				$(config['MODAL_BUTTONS_ID']).empty();
				$(config['MODAL_BUTTONS_ID']).append('<button type="button" id="start-game-button" disabled=true class="btn btn-default" data-dismiss="modal"><i class="fa fa-spinner fa-spin fa-2x"></i></button>');
				$(config['MODAL_ID']).removeClass();
				$(config['MODAL_ID']).addClass('modal fade ' + modalClass);
			}

			/**
    * Imposto intestazione del modal
    * @param {String} title [Testo di intestazione]
    */
			setTitle(title) {
				$(config['MODAL_TITLE_ID']).html(title);
			}

			/**
    * Imposto il contenuto del modal (Testo)
    * @param {String} content [Testo da visualizzare]
    */
			setContent(content) {
				$(config['MODAL_TEXT_ID']).html(content);
			}

			/**
    * Imposto il contenuto del modal (Carte)
    * @param {Object} cards [Oggetto contenente le carte]
    */
			setContentCards(cards) {
				this.cards = cards;
				var html = `<div class="row">`;
				var cols = Math.floor(12 / cards.length);
				for (card in cards) {
					html += `<div class="col-md-${cols} col-xl-${cols}">`;
					html += `<img src="${card.src}" id="${card.name}"/>`;
					html += `</div>`;
				}
				html += '</div>';
				this.setContent(html);
			}

			/**
    * Seleziono la carta scelta
    * @param {int} id [Carta selezionata]
    */
			selectCard(id) {
				for (card in cards) {
					if (card.name != id) {
						$(card.name).addClass('animate zoomOut');
					}
				}
				$(id).addClass('animate pulse');
			}

			show() {
				$(config['MODAL_ID']).modal("show");
				this.visible = true;
			}

			hide() {
				$(config['MODAL_ID']).modal("hide");
				this.visible = false;
			}

			/**
    * @private
    * @return {Boolean} [True se è visibile il popup, falso altrimenti]
    */
			isVisible() {
				return this.visible;
			}
		}

		module.exports = ModalDialog;
	}, { "../Config.js": 5, "../lang/Lang.js": 10 }], 18: [function (require, module, exports) {
		var l = require('../lang/Lang.js');
		var config = require('../Config.js');
		var lang = l[config['LANGUAGE']];

		/**
   * Funzioni di supporto alla dashboard
   */

		class Utils {
			/**
    * Crea il tag contenente il testo da visualizzare in un tooltip sulla mappa
    * @param  {String} name [Nome della zona per la quale si sta creando il tooltip]
    * @param  {String []} vars [Array delle risorse, la chiave contiene il nome della risorsa e il campo contiene la quantità]
    * @return NA
    */
			__buildTooltip(name, vars) {
				var content_text = `<ul class="tooltip-list" id="` + name + `-tooltiplist">`;
				content_text += `<li><span style=\"font-weight:bold;\">` + lang['zone'] + `</span>` + name + `</li>`;

				for (var key in vars) {
					if (vars[key] == -1) continue;
					var i = this.getIndexByValue(vars[key]);
					content_text += `
							<li><div class="float-wrapper">
							<span>` + key + ` :</span>
							<div id="` + key + `-` + name + `" style="background-color:` + config['LEGEND'][i].color + `"></div>
							</li></div>`;
				}
				content_text += `</ul>`;
				//var tooltip = {content: content_text}
				return content_text;
			}

			getDisplayedName(area) {
				if (typeof area.visualName == 'string') {
					return area.visualName;
				} else {
					return area.name;
				}
			}

			getRealCoords(position) {
				//Adatto all'effettiva dimensione della mappa sullo schermo
				var viewPort = {};
				viewPort.left = $(config['MAP_CONTAINER'] + ' > .map > svg').width();
				viewPort.top = $(config['MAP_CONTAINER'] + ' > .map > svg').height();
				position.left = viewPort.left * position.left / config['MAP_W'];
				position.top = (config['MAP_H'] - position.top) * viewPort.top / config['MAP_H'] + $(config['PROGRESS_BALLS_ID']).height();
				return position;
			}

			/**
    * Ottiene un colore casuale tra quelli predefiniti (JQuery.colors)
    * @return {Object} [Oggetto contenente il nome e il codice hex del colore]
    */
			getRandomColor() {
				var Colors = {};
				Colors.names = {
					aqua: "#00ffff",
					azure: "#f0ffff",
					beige: "#f5f5dc",
					black: "#000000",
					blue: "#0000ff",
					brown: "#a52a2a",
					cyan: "#00ffff",
					darkblue: "#00008b",
					darkcyan: "#008b8b",
					darkgrey: "#a9a9a9",
					darkgreen: "#006400",
					darkkhaki: "#bdb76b",
					darkmagenta: "#8b008b",
					darkolivegreen: "#556b2f",
					darkorange: "#ff8c00",
					darkorchid: "#9932cc",
					darkred: "#8b0000",
					darksalmon: "#e9967a",
					darkviolet: "#9400d3",
					fuchsia: "#ff00ff",
					gold: "#ffd700",
					green: "#008000",
					indigo: "#4b0082",
					khaki: "#f0e68c",
					lightblue: "#add8e6",
					lightcyan: "#e0ffff",
					lightgreen: "#90ee90",
					lightgrey: "#d3d3d3",
					lightpink: "#ffb6c1",
					lightyellow: "#ffffe0",
					lime: "#00ff00",
					magenta: "#ff00ff",
					maroon: "#800000",
					navy: "#000080",
					olive: "#808000",
					orange: "#ffa500",
					pink: "#ffc0cb",
					purple: "#800080",
					violet: "#800080",
					red: "#ff0000",
					silver: "#c0c0c0",
					white: "#ffffff",
					yellow: "#ffff00"
				};
				Colors.random = function () {
					var result;
					var count = 0;
					for (var prop in this.names) if (Math.random() < 1 / ++count) result = prop;
					return { name: result, rgb: this.names[result] };
				};

				return Colors.random();
			}

			/**
    * Restituisce l'indice contenente la configurazione da considerare a partire dal dato livello dell'emergenza
    * @param  {Number} value [Valore gravità dell'emergenza]
    * @return {Number}       [Indice da utilizzare in config['LEGEND']]
    */
			getIndexByValue(value) {

				if (typeof value != 'number') {
					value = parseInt(value);
				}

				for (var i = 0; i < config['LEGEND'].length; i++) {
					if (value.inRange(this.getValues(config['LEGEND'][i].value, true)[0], this.getValues(config['LEGEND'][i].value, true)[1])) {
						return i;
					}
				}
				throw new Error(`
			Cant find correct index with value: ${value}
			Last index: ${i}
			First parameter for inRange: ${this.getValues(config['LEGEND'][i].value, true)[0]}
			Second parameter for inRange: ${this.getValues(config['LEGEND'][i].value, true)[1]}
			`);
			}

			/**
    * Restituisce un array contenente i valori minimi e massimi di contagio per un determinato livello
    * @param  {String} value [Stringa del tipo '1,2' nel formato 'ValoreMinimo,ValoreMassimo']
    * @param  {Boolean} [numeric] [Se vero, l'array di Stringhe è convertito in array di Numeri]
    * @return {Array}       [Array contenente i due valori min e max]
    */
			getValues(value, numeric = false) {
				let v = value.split(',');
				if (numeric) {
					for (var i = 0; i < v.length; i++) {
						v[i] = parseInt(v[i]);
					}
				}
				return v;
			}

			/**
    * Crea l'identificatore univoco di un link a partire dagli identificatori delle aree collegate
    * @param  {String} a [Identificatore univoco della prima area]
    * @param  {String} b [Identificatore univoco della seconda area]
    * @return {String}   [Identificatore univoco del link tra `a` e `b`, posizionati in ordine alfabetico e separati da `-`, Es: `canada-usa`]
    */
			getLinkIdentifier(a, b) {
				var link = a < b ? a + '-' + b : b + '-' + a;
				return link;
			}

			/**
    * Ottiene gli identificatori dei plot che compongono gli estremi di un link a partire dall'identificatore univoco del link
    * @param  {String} link [Identificatore univoco di un link]
    * @return {String[]}      [Array contenente gli identificatori dei due plot che compongono il link]
    */
			getPlotsByLink(link) {
				return [link.split('-')[0] + '-plot', link.split('-')[1] + '-plot'];
			}

		}

		module.exports = Utils;
	}, { "../Config.js": 5, "../lang/Lang.js": 10 }] }, {}, [7]);