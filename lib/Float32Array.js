/**
 * Float32Array compatible library
 *
 * Borrow from Google Closure Library
 * http://code.google.com/p/closure-library/source/browse/trunk/closure/goog/vec/float32array.js?r=1926
 * Modified by Liang Zhang
 * liang@ccs.neu.edu
 */

!!function(){

	if(this.Float32Array) return false;

	var Float32Array = {};

	/**
	 * Constructs a new Float32Array. The new array is initialized to all zeros.
	 *
	 * @param {goog.vec.Float32Array|Array|ArrayBuffer|number} p0
	 *     The length of the array, or an array to initialize the contents of the
	 *     new Float32Array.
	 * @constructor
	 */
	Float32Array = function(p0) {
	  this.length = p0.length || p0;
	  for (var i = 0; i < this.length; i++) {
	    this[i] = p0[i] || 0;
	  }
	};


	/**
	 * The number of bytes in an element (as defined by the Typed Array
	 * specification).
	 *
	 * @type {number}
	 */
	Float32Array.BYTES_PER_ELEMENT = 4;


	/**
	 * The number of bytes in an element (as defined by the Typed Array
	 * specification).
	 *
	 * @type {number}
	 */
	Float32Array.prototype.BYTES_PER_ELEMENT = 4;


	/**
	 * Sets elements of the array.
	 * @param {Array.<number>|Float32Array} values The array of values.
	 * @param {number=} opt_offset The offset in this array to start.
	 */
	Float32Array.prototype.set = function(values, opt_offset) {
	  opt_offset = opt_offset || 0;
	  for (var i = 0; i < values.length && opt_offset + i < this.length; i++) {
	    this[opt_offset + i] = values[i];
	  }
	};


	/**
	 * Creates a string representation of this array.
	 * @return {string} The string version of this array.
	 * @override
	 */
	Float32Array.prototype.toString = Array.prototype.join;

	if(!this.Int32Array) this.Int32Array = Float32Array;

	return this.Float32Array = Float32Array;
}();