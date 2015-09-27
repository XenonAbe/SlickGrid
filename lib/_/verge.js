/*!
 * verge 1.9.1+201509042202
 * https://github.com/ryanve/verge
 * MIT License 2013 Ryan Van Etten
 */

/*global define, module */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.verge = factory();
    }
}(this, function () {
  'use strict';

  var xports = {},
      win = typeof window != 'undefined' && window,
      doc = typeof document != 'undefined' && document,
      docElem = doc && doc.documentElement,
      matchMedia = win.matchMedia || win.msMatchMedia;
      
  /** 
   * Test if a media query is active. Like Modernizr.mq
   * @since 1.6.0
   * @return {boolean}
   */  
  xports.mq = matchMedia ? function(q) {
    return !!matchMedia.call(win, q).matches;
  } : function() {
    return false;
  };

  /** 
   * Account for potential presence of user-agent scrollbar: return the scrollbar width.
   * @since 1.9.2
   * @return {number}
   */  
  xports.scrollbarW = function() {
    // Including presence of user-agent scrollbar, if available
    document.body.style.overflow = 'hidden';
    var w = document.body.clientWidth;
    document.body.style.overflow = 'scroll';
    w -= document.body.clientWidth;
    if (!w) {
      w = document.body.offsetWidth - document.body.clientWidth;
    }
    document.body.style.overflow = '';
    return w;
  };
  
  xports.viewportW = function() {
    var a = docElem.clientWidth, 
        b = win.innerWidth + xports.scrollbarW();
    return a < b ? b : a;
  };
  
  xports.viewportH = function() {
    var a = docElem.clientHeight, 
        b = win.innerHeight;
    return a < b ? b : a;
  };
  
  /** 
   * Normalized matchMedia
   * @since 1.6.0
   * @return {MediaQueryList|Object}
   */ 
  xports.matchMedia = matchMedia ? function() {
    // matchMedia must be bound to window
    return matchMedia.apply(win, arguments);
  } : function() {
    // Gracefully degrade to plain object
    return {};
  };

  /**
   * @since 1.8.0
   * @return {{width:number, height:number}}
   */
  xports.viewport = function () {
    return {
      width: xports.viewportW(), 
      height: xports.viewportH()
    };
  };
  
  /** 
   * Cross-browser window.scrollX
   * @since 1.0.0
   * @return {number}
   */
  xports.scrollX = function() {
    return win.pageXOffset || docElem.scrollLeft; 
  };

  /** 
   * Cross-browser window.scrollY
   * @since 1.0.0
   * @return {number}
   */
  xports.scrollY = function() {
    return win.pageYOffset || docElem.scrollTop; 
  };

  /**
   * @param {{top:number, right:number, bottom:number, left:number}} coords
   * @param {number=} cushion adjustment
   * @return {Object}
   */
  function calibrate(coords, cushion) {
    var o = {};
    cushion = +cushion || 0;
    
    o.right = coords.right + cushion;
    o.left = coords.left - cushion;
    o.width = o.right - o.left;
    o.bottom = coords.bottom + cushion;
    o.top = coords.top - cushion;
    o.height = o.bottom - o.top;

    return o;
  }

  /**
   * Cross-browser element.getBoundingClientRect plus optional cushion.
   * Coords are relative to the top-left corner of the viewport.
   * @since 1.0.0
   * @param {Element|Object} el element or stack (uses first item)
   * @param {number=} cushion +/- pixel adjustment amount
   * @return {Object|boolean}
   */
  xports.rectangle = function(el, cushion) {
    el = el && !el.nodeType ? el[0] : el;
    if (!el || 1 !== el.nodeType) { return false; }
    return calibrate(el.getBoundingClientRect(), cushion);
  };

  /**
   * Get the viewport aspect ratio (or the aspect ratio of an object or element)
   * @since 1.7.0
   * @param {(Element|Object)=} o optional object with width/height props or methods
   * @return {number}
   * @link http://w3.org/TR/css3-mediaqueries/#orientation
   */
  xports.aspect = function (o) {
    o = null == o ? xports.viewport() : 1 === o.nodeType ? xports.rectangle(o) : o;         // jshint ignore:line
    var h = o.height, 
        w = o.width;

    h = typeof h == 'function' ? h.call(o) : h;
    w = typeof w == 'function' ? w.call(o) : w;
    return w/h;
  };

  /**
   * Test if an element is in the same x-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports.inX = function(el, cushion) {
    var r = xports.rectangle(el, cushion);
    return !!r && r.right >= 0 && r.left <= xports.viewportW();
  };

  /**
   * Test if an element is in the same y-axis section as the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports.inY = function(el, cushion) {
    var r = xports.rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.top <= xports.viewportH();
  };

  /**
   * Test if an element is in the viewport.
   * @since 1.0.0
   * @param {Element|Object} el
   * @param {number=} cushion
   * @return {boolean}
   */
  xports.inViewport = function(el, cushion) {
    // Equiv to `inX(el, cushion) && inY(el, cushion)` but just manually do both 
    // to avoid calling rectangle() twice. It gzips just as small like this.
    var r = xports.rectangle(el, cushion);
    return !!r && r.bottom >= 0 && r.right >= 0 && r.top <= xports.viewportH() && r.left <= xports.viewportW();
  };

  return xports;
}));
