// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    // assert(type != 'array');
    // return value;
// Revert to old version. By Liang
    if (type == 'number') {
      return value;
    }
    if (!type) { // return type is void
      return value
    }
    var i=0;
    return type.map(function(arg) {
      return fromC(HEAP32[(value/4)+(i++)], arg);
    })
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 16072;
var _stdout;
var _stderr;
var _stdout = _stdout=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,10,2,2,2,2,11,12,2,2,16,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,14,13,15,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,4,5,6,7,8,9,0,0,0,0,0,0,0,14,1,2,12,15,23,13,7,8,3,16,17,9,10,11,18,19,20,37,38,21,22,21,22,29,22,39,31,24,25,26,27,28,30,41,32,33,34,42,43,35,36,0,0,0,13,0,0,0,3,4,11,18,19,20,8,9,13,14,15,7,10,20,0,8,9,13,14,15,5,6,4,19,19,19,19,19,11,4,12,3,3,3,3,3,20,20,20,21,12,16,20,0,0,0,0,0,2,1,3,1,1,3,3,5,3,3,3,3,3,3,3,3,3,3,3,1,3,0,0,0,17,18,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,0,0,251,251,21,253,251,0,0,0,254,255,252,254,4,2,17,1,1,1,1,1,13,29,15,251,32,33,34,37,38,254,254,35,251,251,251,251,251,254,251,251,251,251,251,251,251,19,251,17,22,251,254,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,4,5,6,40,0,0,0,0,5,4,0,0,0,2,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4,12,13,9,10,11,0,3,19,17,18,14,15,16,6,7,20,0,8,0,21,0,0,0,0,3,3,4,7,0,4,10,8,9,11,8,9,13,14,15,13,14,15,21,22,5,6,5,6,11,6,29,12,7,8,9,10,11,4,12,3,3,3,16,42,3,3,255,255,255,10,0,0,0,0,0,0,0,0,0,0,1,0,0,0,7,0,0,0,25,0,0,0,81,0,0,0,241,0,0,0,161,2,0,0,1,7,0,0,1,18,0,0,1,45,0,0,1,110,0,0,255,255,255,255,0,0,0,0,0,0,0,0,7,0,0,0,25,0,0,0,81,0,0,0,241,0,0,0,161,2,0,0,1,7,0,0,1,18,0,0,1,45,0,0,1,110,0,0,255,255,255,255,0,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,38,3,0,0,0,0,0,0,1,0,0,0,0,0,0,0,168,1,0,0,0,0,0,0,180,0,0,0,0,0,0,0,96,21,0,0,206,2,0,0,128,20,0,0,204,2,0,0,128,19,0,0,202,2,0,0,56,17,0,0,200,2,0,0,160,16,0,0,198,2,0,0,80,36,0,0,52,0,0,0,74,2,0,0,0,0,0,0,144,1,0,0,32,3,0,0,64,6,0,0,128,12,0,0,128,37,0,0,128,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,1,0,0,192,3,0,0,128,7,0,0,0,15,0,0,0,45,0,0,0,135,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,78,1,0,0,68,1,0,0,244,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,2,0,0,2,3,0,0,136,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,1,0,0,104,1,0,0,226,0,0,0,0,0,0,0,51,178,71,210,241,168,90,158,27,152,250,15,128,9,203,157,43,15,32,116,68,208,118,165,223,90,240,233,245,191,56,21,191,139,129,89,216,88,158,207,50,224,252,9,63,102,28,106,138,231,22,81,250,224,179,105,101,214,146,109,152,190,168,208,52,183,105,246,104,27,172,65,241,35,4,99,138,107,141,75,215,109,196,194,125,116,128,86,143,62,112,67,210,3,97,59,63,235,229,73,193,180,218,203,35,142,152,156,11,238,123,116,41,227,17,145,90,27,3,159,185,113,202,236,248,78,254,42,237,199,33,132,241,175,137,172,243,13,217,174,1,79,215,45,19,106,144,20,169,63,135,117,119,248,131,255,201,160,40,80,29,196,180,17,196,219,174,124,167,208,114,134,9,193,167,72,159,229,32,131,95,61,11,188,134,8,163,117,40,209,224,249,128,117,175,65,77,185,155,35,129,60,122,198,110,189,238,116,60,181,2,188,73,164,126,114,6,40,138,107,218,176,83,88,244,50,224,189,133,72,35,206,69,97,13,50,63,5,204,72,210,196,219,0,151,35,90,213,111,155,5,225,209,5,62,28,100,124,101,9,97,182,124,208,52,46,152,110,119,215,209,109,113,16,237,237,101,253,157,215,206,221,22,248,228,241,250,182,116,16,119,28,189,53,24,49,247,82,249,24,80,3,244,248,84,211,206,78,43,193,138,124,77,153,169,49,71,119,212,79,35,122,34,220,223,253,250,109,72,231,150,103,79,99,111,12,29,250,146,249,201,112,246,76,49,253,125,6,165,225,163,167,223,217,215,140,52,203,44,151,86,33,200,103,168,246,72,213,33,236,92,4,251,11,36,243,167,86,246,222,197,8,222,67,47,249,209,218,107,197,38,55,154,241,9,20,71,209,47,148,156,116,38,185,184,49,220,173,105,216,208,83,254,82,186,209,140,223,34,103,116,90,217,34,42,181,193,125,213,111,236,29,77,135,98,114,201,93,114,10,61,25,168,230,90,131,82,160,40,217,154,220,144,187,158,229,255,169,219,112,157,116,18,214,140,99,90,90,55,236,134,96,9,151,87,42,58,234,73,20,6,60,142,188,102,6,144,47,209,79,231,251,17,185,53,107,8,80,51,248,157,151,30,239,157,178,138,115,220,15,220,162,93,48,150,118,172,157,66,245,59,129,65,140,46,224,115,128,205,60,248,190,90,169,80,123,98,88,238,5,206,158,130,0,140,149,161,140,226,162,78,190,115,187,147,66,35,123,111,101,216,22,115,65,207,215,103,68,59,230,0,34,200,80,144,16,71,190,76,129,168,212,177,54,5,147,175,54,179,39,131,48,68,115,205,235,39,222,56,167,153,195,16,90,29,55,66,65,40,133,161,100,178,232,49,11,185,87,16,100,59,54,252,106,83,217,138,16,52,162,77,157,89,145,45,12,31,26,138,28,186,102,12,49,112,16,170,135,255,50,200,218,34,52,67,10,18,88,241,122,208,155,141,45,233,37,90,153,172,108,50,37,219,132,67,163,204,33,132,76,236,21,3,79,158,100,232,41,111,45,115,167,227,211,148,46,64,163,152,125,116,77,124,57,222,180,157,101,154,78,125,116,53,132,219,217,233,219,89,70,197,109,62,49,220,4,209,41,186,108,34,159,176,24,47,69,104,80,188,208,153,162,76,132,78,41,43,120,123,235,226,74,248,117,196,164,17,19,168,112,204,139,62,75,186,212,32,126,201,51,202,171,96,41,190,87,25,180,249,68,70,119,86,46,122,117,235,114,232,192,44,16,185,50,127,176,89,189,218,208,107,173,133,186,103,6,226,243,129,125,215,152,71,250,122,25,172,233,142,81,162,229,12,225,42,44,207,1,61,175,163,211,101,253,221,22,248,50,146,102,1,163,80,28,81,145,61,185,244,211,84,147,208,121,125,132,198,46,254,213,16,6,123,31,165,144,107,250,65,144,135,197,94,192,125,46,50,31,63,66,219,61,98,239,128,50,193,73,146,78,113,152,173,228,182,199,102,132,49,196,18,243,55,7,63,0,60,77,31,31,204,154,109,146,28,95,113,167,95,8,162,131,90,24,157,21,170,249,50,1,11,11,67,122,142,249,190,189,158,205,41,203,144,1,182,63,217,16,151,77,138,59,65,90,166,102,111,118,62,228,65,60,190,119,100,99,104,185,77,153,54,203,135,162,70,104,247,119,126,86,216,141,23,54,242,177,230,189,100,220,239,182,36,3,149,130,71,63,5,66,28,229,155,192,98,215,66,9,127,44,249,53,97,236,125,54,131,217,227,110,138,247,170,219,71,44,93,38,92,191,180,142,215,50,178,51,119,126,19,176,167,57,60,55,118,46,43,141,1,15,81,199,50,224,249,80,219,221,31,123,174,42,76,114,49,203,14,177,184,209,163,204,16,207,11,127,189,187,84,66,151,59,249,227,155,3,5,35,34,14,18,83,154,59,47,26,151,189,221,15,30,86,24,1,19,142,121,10,205,58,11,158,21,159,108,219,162,208,18,245,40,58,140,158,174,132,33,238,47,236,81,0,79,247,50,36,234,102,170,176,136,141,18,85,56,58,216,247,130,142,174,77,214,152,220,63,65,211,11,95,29,190,68,114,120,142,180,199,83,48,71,45,32,46,137,67,42,31,15,186,149,72,77,82,177,188,16,46,129,45,55,76,205,80,62,92,46,204,97,207,171,9,23,147,252,174,179,129,94,64,233,57,140,16,254,127,248,63,187,79,80,228,171,6,30,245,91,127,253,205,227,164,111,108,15,219,39,18,154,21,85,237,159,59,127,111,11,210,131,204,233,251,25,102,133,100,175,184,82,191,176,6,112,157,198,91,22,113,238,74,50,174,44,127,210,41,134,32,76,121,226,92,68,116,204,21,41,120,134,104,206,212,124,174,137,50,151,242,222,83,237,247,133,65,0,36,183,136,17,220,9,60,182,170,227,188,74,147,117,106,153,227,103,178,191,241,13,0,226,165,59,25,119,25,62,250,246,20,158,23,152,226,237,30,6,11,31,105,172,120,79,184,22,83,193,193,214,58,255,255,131,115,69,11,18,214,140,81,62,15,160,5,117,210,183,213,215,204,94,76,190,208,44,224,242,233,88,85,240,187,137,12,39,98,217,163,178,210,50,40,151,184,103,246,84,101,85,212,31,240,210,249,174,63,30,250,238,225,194,82,49,31,69,229,41,151,132,126,122,182,189,218,126,94,191,84,113,194,49,248,227,23,26,95,254,10,20,157,71,28,116,146,206,171,207,72,119,228,187,156,127,229,62,156,57,76,125,176,226,188,33,204,177,8,119,105,107,42,218,88,22,219,112,35,72,25,100,110,82,189,197,172,204,36,143,134,245,176,29,202,146,164,173,76,84,62,68,63,233,213,164,196,112,214,10,240,224,134,60,233,26,101,144,254,163,50,229,221,223,88,100,166,81,113,125,171,95,119,46,14,153,159,16,201,159,213,150,141,76,241,206,115,233,136,78,199,192,45,113,2,53,23,244,4,162,20,89,46,251,178,244,89,131,252,135,2,67,3,188,128,89,37,179,246,212,120,65,199,35,145,217,241,7,204,60,56,125,99,192,172,72,165,99,8,133,172,252,166,240,239,19,42,177,237,46,175,80,39,231,65,66,179,198,224,70,43,162,93,224,89,85,99,172,64,234,210,192,152,170,16,151,100,9,25,43,84,44,17,12,4,133,44,208,231,104,168,136,1,38,110,144,211,150,245,122,93,187,195,55,169,42,122,50,80,209,223,59,174,128,103,216,156,95,219,176,102,210,139,18,175,68,119,176,177,99,180,201,41,150,88,110,188,13,227,105,85,15,136,22,110,158,32,12,165,236,157,87,122,152,2,87,234,211,190,170,120,166,211,13,3,221,112,93,156,253,12,153,142,161,146,25,6,116,245,125,10,111,127,154,175,76,19,228,186,245,112,181,167,220,35,205,143,120,77,71,120,240,199,161,125,247,188,104,213,113,144,161,126,98,252,119,75,0,174,203,75,181,102,172,218,242,126,48,172,213,220,48,247,189,185,167,151,90,80,211,31,136,157,204,150,183,173,2,210,161,148,127,93,83,151,192,32,236,49,152,122,136,177,105,80,71,193,243,58,247,166,103,224,228,113,222,105,165,70,48,228,173,210,199,98,7,111,244,118,8,245,66,5,81,83,62,28,116,3,36,34,80,83,96,77,229,216,26,171,68,60,70,43,151,52,157,168,191,116,224,104,215,215,220,5,230,55,223,27,61,225,33,196,81,80,190,87,224,185,76,161,23,183,67,12,115,161,190,56,150,185,109,243,213,181,234,217,96,233,211,136,19,107,182,211,182,236,131,139,190,189,197,175,41,46,236,113,77,118,67,79,143,75,0,220,29,194,127,101,63,166,48,129,103,130,172,53,245,219,88,252,148,165,188,134,38,148,123,101,155,189,97,155,15,74,79,24,255,68,47,10,225,56,38,6,145,97,54,118,36,94,55,209,6,113,240,2,40,198,0,31,29,189,178,220,192,124,9,73,99,237,78,178,19,220,153,196,153,151,106,61,126,215,104,59,119,20,183,79,122,150,177,207,238,53,184,16,81,42,148,175,240,226,165,222,9,157,39,93,37,32,75,211,113,87,228,158,8,225,11,51,111,36,229,174,124,143,18,71,6,211,238,251,202,117,40,112,79,185,102,54,149,237,180,117,25,93,113,18,248,90,37,32,190,19,89,70,25,133,49,83,128,48,192,70,157,236,54,124,2,188,136,65,248,42,128,27,20,194,74,30,43,192,119,97,211,4,215,233,80,252,218,121,206,57,0,10,126,145,244,11,122,239,209,216,139,169,210,77,66,25,31,223,57,148,70,247,42,196,62,232,219,173,13,31,34,133,144,62,86,69,82,236,149,144,37,123,136,119,100,96,228,138,26,183,67,189,86,25,84,187,157,207,102,115,55,23,142,238,201,39,167,181,231,179,118,80,202,186,112,252,117,91,19,206,163,26,233,196,17,25,52,240,63,12,67,83,36,8,107,136,183,184,181,107,84,18,226,51,86,180,147,241,127,97,9,91,80,255,95,33,241,126,217,72,171,121,100,53,196,221,169,110,70,39,53,13,67,206,245,162,179,161,38,178,60,234,41,19,194,124,51,122,61,225,204,181,91,59,62,86,143,142,78,83,201,153,19,86,146,99,89,225,37,49,240,176,91,100,134,69,71,24,55,31,209,171,234,148,221,126,249,65,155,163,229,227,226,116,199,113,244,150,114,80,59,19,96,89,148,196,82,120,145,38,91,63,116,119,248,163,158,248,122,90,40,63,218,23,109,81,217,233,213,193,193,252,40,134,97,228,71,16,8,4,95,219,228,216,22,4,56,220,226,51,73,140,83,77,7,149,45,3,176,177,234,2,129,204,67,18,100,113,106,235,214,152,69,201,254,144,69,67,145,160,125,3,171,111,77,156,244,112,14,91,191,5,127,175,122,146,97,15,148,161,111,117,224,254,159,54,21,248,59,37,0,92,47,118,185,242,204,60,235,74,134,243,105,16,185,231,164,251,101,38,51,112,14,129,202,107,88,128,171,133,47,43,75,174,18,7,18,157,203,234,232,190,18,17,106,119,174,1,0,0,212,1,0,0,240,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,48,49,50,51,52,53,54,55,56,57,43,47,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,62,127,127,127,63,52,53,54,55,56,57,58,59,60,61,127,127,127,64,127,127,127,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,127,127,127,127,127,127,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,127,127,127,127,127,144,0,0,0,212,0,0,0,58,2,0,0,0,0,0,0,64,1,0,0,32,0,0,0,10,3,0,0,0,0,0,0,99,97,110,110,111,116,32,100,101,99,114,121,112,116,44,32,97,116,116,114,105,98,117,116,101,115,32,105,110,32,107,101,121,32,100,111,32,110,111,116,32,115,97,116,105,115,102,121,32,112,111,108,105,99,121,10,0,0,0,0,0,0,0,0,99,111,101,102,102,37,100,0,101,0,0,0,0,0,0,0,110,113,114,0,0,0,0,0,108,0,0,0,0,0,0,0,103,0,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,117,110,115,97,116,105,115,102,105,97,98,108,101,32,111,112,101,114,97,116,111,114,32,34,37,100,111,102,34,32,40,111,110,108,121,32,37,100,32,111,112,101,114,97,110,100,115,41,10,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,34,37,115,34,58,32,101,109,112,116,121,32,112,111,108,105,99,121,10,0,0,0,0,0,0,0,110,113,114,0,0,0,0,0,115,105,103,110,48,0,0,0,104,107,0,0,0,0,0,0,110,0,0,0,0,0,0,0,102,0,0,0,0,0,0,0,93,0,0,0,0,0,0,0,103,109,112,58,32,111,118,101,114,102,108,111,119,32,105,110,32,109,112,122,32,116,121,112,101,10,0,0,0,0,0,0,37,115,37,115,10,0,0,0,80,111,108,121,110,111,109,105,97,108,32,114,105,110,103,32,111,118,101,114,32,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,116,114,105,118,105,97,108,108,121,32,115,97,116,105,115,102,105,101,100,32,111,112,101,114,97,116,111,114,32,34,37,100,111,102,34,10,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,34,37,115,34,58,32,101,120,116,114,97,32,116,111,107,101,110,115,32,108,101,102,116,32,111,110,32,115,116,97,99,107,10,0,116,121,112,101,32,97,10,113,32,56,55,56,48,55,49,48,55,57,57,54,54,51,51,49,50,53,50,50,52,51,55,55,56,49,57,56,52,55,53,52,48,52,57,56,49,53,56,48,54,56,56,51,49,57,57,52,49,52,50,48,56,50,49,49,48,50,56,54,53,51,51,57,57,50,54,54,52,55,53,54,51,48,56,56,48,50,50,50,57,53,55,48,55,56,54,50,53,49,55,57,52,50,50,54,54,50,50,50,49,52,50,51,49,53,53,56,53,56,55,54,57,53,56,50,51,49,55,52,53,57,50,55,55,55,49,51,51,54,55,51,49,55,52,56,49,51,50,52,57,50,53,49,50,57,57,57,56,50,50,52,55,57,49,10,104,32,49,50,48,49,54,48,49,50,50,54,52,56,57,49,49,52,54,48,55,57,51,56,56,56,50,49,51,54,54,55,52,48,53,51,52,50,48,52,56,48,50,57,53,52,52,48,49,50,53,49,51,49,49,56,50,50,57,49,57,54,49,53,49,51,49,48,52,55,50,48,55,50,56,57,51,53,57,55,48,52,53,51,49,49,48,50,56,52,52,56,48,50,49,56,51,57,48,54,53,51,55,55,56,54,55,55,54,10,114,32,55,51,48,55,53,48,56,49,56,54,54,53,52,53,49,54,50,49,51,54,49,49,49,57,50,52,53,53,55,49,53,48,52,57,48,49,52,48,53,57,55,54,53,53,57,54,49,55,10,101,120,112,50,32,49,53,57,10,101,120,112,49,32,49,48,55,10,115,105,103,110,49,32,49,10,115,105,103,110,48,32,49,10,0,104,107,0,0,0,0,0,0,115,105,103,110,49,0,0,0,110,107,0,0,0,0,0,0,112,0,0,0,0,0,0,0,101,0,0,0,0,0,0,0,44,32,0,0,0,0,0,0,101,114,114,111,114,58,32,0,93,0,0,0,0,0,0,0,108,111,110,103,32,100,111,117,98,108,101,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,110,111,32,109,111,114,101,32,116,104,97,110,32,54,52,32,98,105,116,115,32,97,108,108,111,119,101,100,32,34,37,108,108,117,98,37,108,108,117,34,10,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,34,37,115,34,58,32,115,116,97,99,107,32,117,110,100,101,114,102,108,111,119,32,97,116,32,34,37,115,34,10,0,0,0,0,110,107,0,0,0,0,0,0,102,0,0,0,0,0,0,0,101,120,112,49,0,0,0,0,107,0,0,0,0,0,0,0,115,105,103,110,48,0,0,0,100,0,0,0,0,0,0,0,91,0,0,0,0,0,0,0,119,97,114,110,105,110,103,58,32,0,0,0,0,0,0,0,44,32,0,0,0,0,0,0,69,37,99,37,48,50,108,100,0,0,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,122,101,114,111,45,108,101,110,103,116,104,32,105,110,116,101,103,101,114,32,34,37,108,108,117,98,37,108,108,117,34,10,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,34,37,115,34,58,32,105,100,101,110,116,105,116,121,32,111,112,101,114,97,116,111,114,32,34,37,115,34,10,0,0,0,0,0,98,0,0,0,0,0,0,0,113,117,97,100,95,116,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,0,0,0,97,108,112,104,97,49,0,0,101,120,112,50,0,0,0,0,98,0,0,0,0,0,0,0,115,105,103,110,49,0,0,0,97,0,0,0,0,0,0,0,79,0,0,0,0,0,0,0,67,108,101,97,110,117,112,58,32,112,111,112,112,105,110,103,0,0,0,0,0,0,0,0,71,70,40,37,90,100,41,44,32,71,77,80,32,119,114,97,112,112,101,100,0,0,0,0,91,0,0,0,0,0,0,0,110,108,32,61,61,32,48,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,0,0,32,0,0,0,0,0,0,0,113,0,0,0,0,0,0,0,48,120,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,34,37,115,34,58,32,117,110,115,97,116,105,115,102,105,97,98,108,101,32,111,112,101,114,97,116,111,114,32,34,37,115,34,10,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,0,0,101,37,99,37,48,50,108,100,0,0,0,0,0,0,0,0,71,70,40,37,90,100,41,58,32,77,111,110,116,103,111,109,101,114,121,32,114,101,112,114,101,115,101,110,116,97,116,105,111,110,0,0,0,0,0,0,113,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,108,111,110,103,32,108,111,110,103,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,97,108,112,104,97,48,0,0,98,0,0,0,0,0,0,0,97,0,0,0,0,0,0,0,101,120,112,49,0,0,0,0,114,101,100,99,95,110,46,99,0,0,0,0,0,0,0,0,116,121,112,101,0,0,0,0,109,117,108,116,105,122,32,104,97,115,32,116,111,111,32,102,101,119,32,99,111,101,102,102,105,99,105,101,110,116,115,0,102,97,116,97,108,58,32,0,113,0,0,0,0,0,0,0,67,108,101,97,110,117,112,58,32,100,105,115,99,97,114,100,105,110,103,32,108,111,111,107,97,104,101,97,100,0,0,0,69,120,116,101,110,115,105,111,110,44,32,112,111,108,121,32,61,32,37,66,44,32,98,97,115,101,32,102,105,101,108,100,32,61,32,0,0,0,0,0,110,112,114,105,109,101,50,32,60,32,110,0,0,0,0,0,93,0,0,0,0,0,0,0,109,117,95,100,105,118,95,113,114,46,99,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,34,37,115,34,58,32,116,114,105,118,105,97,108,108,121,32,115,97,116,105,115,102,105,101,100,32,111,112,101,114,97,116,111,114,32,34,37,115,34,10,0,0,85,110,115,117,112,112,111,114,116,101,100,32,114,97,110,100,111,109,32,115,101,101,100,105,110,103,32,109,111,100,101,46,10,0,0,0,0,0,0,0,113,0,0,0,0,0,0,0,115,98,112,105,49,95,100,105,118,97,112,112,114,95,113,46,99,0,0,0,0,0,0,0,68,101,108,101,116,105,110,103,0,0,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,97,116,116,114,105,98,117,116,101,32,34,37,115,34,10,40,110,111,116,101,32,116,104,97,116,32,110,117,109,101,114,105,99,97,108,32,97,116,116,114,105,98,117,116,101,115,32,97,114,101,32,117,110,115,105,103,110,101,100,32,105,110,116,101,103,101,114,115,41,10,0,0,0,0,114,0,0,0,0,0,0,0,48,88,0,0,0,0,0,0,100,111,112,114,110,116,46,99,0,0,0,0,0,0,0,0,98,101,116,97,0,0,0,0,97,0,0,0,0,0,0,0,32,37,115,32,61,32,37,108,108,117,32,0,0,0,0,0,114,0,0,0,0,0,0,0,113,0,0,0,0,0,0,0,101,120,112,50,0,0,0,0,109,105,115,115,105,110,103,32,112,97,114,97,109,58,32,96,37,115,39,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,97,116,116,114,105,98,117,116,101,32,34,37,115,34,58,32,118,97,108,117,101,32,37,108,108,117,32,116,111,111,32,98,105,103,32,102,111,114,32,37,100,32,98,105,116,115,10,0,0,0,114,110,32,61,61,32,100,110,0,0,0,0,0,0,0,0,116,121,112,101,32,37,115,10,0,0,0,0,0,0,0,0,98,97,100,32,109,117,108,116,105,122,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,97,116,116,114,105,98,117,116,101,32,34,37,115,34,58,32,54,52,32,98,105,116,115,32,105,115,32,116,104,101,32,109,97,120,105,109,117,109,32,97,108,108,111,119,101,100,10,0,0,0,40,110,32,38,32,40,75,50,32,45,32,49,41,41,32,61,61,32,48,0,0,0,0,0,109,101,109,111,114,121,32,101,120,104,97,117,115,116,101,100,0,0,0,0,0,0,0,0,100,105,118,105,115,105,111,110,32,98,121,32,122,101,114,111,0,0,0,0,0,0,0,0,71,78,85,32,77,80,58,32,67,97,110,110,111,116,32,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,40,115,105,122,101,61,37,108,117,41,10,0,0,0,0,0,0,44,32,0,0,0,0,0,0,32,37,115,32,61,32,37,108,108,117,32,35,32,37,117,32,0,0,0,0,0,0,0,0,37,115,32,37,100,111,102,37,100,0,0,0,0,0,0,0,37,115,32,37,115,0,0,0,37,100,111,102,37,100,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,37,115,10,0,0,0,0,0,0,0,101,114,114,111,114,32,105,110,105,116,105,97,108,105,122,105,110,103,32,112,97,105,114,105,110,103,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,0,0,0,0,115,121,110,116,97,120,32,101,114,114,111,114,32,97,116,32,34,37,99,37,115,34,10,0,73,110,105,116,32,114,97,110,100,111,109,32,115,101,101,100,32,119,105,116,104,32,84,73,77,69,46,10,0,0,0,0,111,102,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,0,0,0,0,111,114,0,0,0,0,0,0,104,0,0,0,0,0,0,0,48,0,0,0,0,0,0,0,48,120,0,0,0,0,0,0,80,37,99,37,108,100,0,0,98,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,97,110,100,0,0,0,0,0,99,120,32,62,61,32,99,121,0,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,116,100,105,118,95,113,114,46,99,0,0,0,0,0,0,0,104,0,0,0,0,0,0,0,101,108,108,105,112,116,105,99,32,99,117,114,118,101,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,103,99,100,101,120,116,95,108,101,104,109,101,114,46,99,0,80,104,105,40,41,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,102,111,114,32,116,104,105,115,32,112,97,105,114,105,110,103,32,116,121,112,101,32,121,101,116,33,10,0,0,0,0,0,0,0,110,50,112,91,113,110,93,32,62,61,32,99,121,50,0,0,118,97,114,105,97,98,108,101,45,108,101,110,103,116,104,0,98,112,91,48,93,32,62,32,48,0,0,0,0,0,0,0,109,97,108,108,111,99,40,41,32,101,114,114,111,114,0,0,37,108,108,117,0,0,0,0,110,112,114,105,109,101,32,60,32,112,108,0,0,0,0,0,99,111,117,108,100,32,110,111,116,32,111,112,101,110,32,47,100,101,118,47,117,114,97,110,100,111,109,44,32,117,115,105,110,103,32,100,101,116,101,114,109,105,110,105,115,116,105,99,32,114,97,110,100,111,109,32,110,117,109,98,101,114,32,103,101,110,101,114,97,116,111,114,0,0,0,0,0,0,0,0,102,105,101,108,100,32,37,112,32,104,97,115,32,110,111,32,99,108,101,97,114,32,102,117,110,99,116,105,111,110,0,0,37,115,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,0,0,0,0,69,114,114,111,114,58,32,112,111,112,112,105,110,103,0,0,71,78,85,32,77,80,32,97,115,115,101,114,116,105,111,110,32,102,97,105,108,101,100,58,32,37,115,10,0,0,0,0,91,0,0,0,0,0,0,0,60,62,0,0,0,0,0,0,115,101,116,95,115,116,114,46,99,0,0,0,0,0,0,0,40,41,44,61,35,0,0,0,103,101,116,95,115,116,114,46,99,0,0,0,0,0,0,0,37,115,95,102,108,101,120,105,110,116,95,37,115,37,100,37,115,0,0,0,0,0,0,0,37,37,115,95,101,120,112,105,110,116,37,48,50,100,95,37,37,115,37,37,100,37,37,115,0,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,109,117,108,95,102,102,116,46,99,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,116,114,105,118,105,97,108,108,121,32,115,97,116,105,115,102,105,101,100,32,105,110,116,101,103,101,114,32,99,111,109,112,97,114,105,115,111,110,32,37,115,32,60,32,37,108,108,117,10,40,97,110,121,32,37,100,45,98,105,116,32,110,117,109,98,101,114,32,119,105,108,108,32,115,97,116,105,115,102,121,41,10,0,0,0,0,0,0,0,0,47,100,101,118,47,117,114,97,110,100,111,109,0,0,0,0,114,98,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,117,110,115,97,116,105,115,102,105,97,98,108,101,32,105,110,116,101,103,101,114,32,99,111,109,112,97,114,105,115,111,110,32,37,115,32,60,32,48,10,40,97,108,108,32,110,117,109,101,114,105,99,97,108,32,97,116,116,114,105,98,117,116,101,115,32,97,114,101,32,117,110,115,105,103,110,101,100,41,10,0,0,37,90,100,0,0,0,0,0,73,110,105,116,32,114,97,110,100,111,109,32,115,101,101,100,32,119,105,116,104,32,90,69,82,79,46,32,70,79,82,32,68,69,66,85,71,32,79,78,76,89,33,33,33,10,0,0,109,105,108,108,101,114,45,97,102,102,105,110,101,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,97,0,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,117,110,115,97,116,105,115,102,105,97,98,108,101,32,105,110,116,101,103,101,114,32,99,111,109,112,97,114,105,115,111,110,32,37,115,32,62,32,37,108,108,117,10,40,37,100,45,98,105,116,115,32,97,114,101,32,105,110,115,117,102,102,105,99,105,101,110,116,32,116,111,32,115,97,116,105,115,102,121,41,10,0,110,0,0,0,0,0,0,0,48,88,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,0,0,0,0,112,37,99,37,108,100,0,0,37,90,100,0,0,0,0,0,114,0,0,0,0,0,0,0,115,104,105,112,115,101,121,45,115,116,97,110,103,101,0,0,109,105,108,108,101,114,0,0,115,104,105,112,115,101,121,45,115,116,97,110,103,101,0,0,50,32,42,32,110,32,62,32,114,110,0,0,0,0,0,0,114,0,0,0,0,0,0,0,32,9,13,10,60,47,62,0,71,78,85,32,77,80,58,32,67,97,110,110,111,116,32,114,101,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,32,40,111,108,100,95,115,105,122,101,61,37,108,117,32,110,101,119,95,115,105,122,101,61,37,108,117,41,10,0,0,0,37,115,95,108,116,95,50,94,37,48,50,100,0,0,0,0,99,121,32,61,61,32,48,0,110,0,0,0,0,0,0,0,110,112,91,49,93,32,61,61,32,110,49,0,0,0,0,0,109,105,108,108,101,114,45,97,102,102,105,110,101,0,0,0,115,104,105,112,115,101,121,45,115,116,97,110,103,101,0,0,109,101,116,104,111,100,0,0,114,0,0,0,0,0,0,0,109,105,108,108,101,114,45,97,102,102,105,110,101,0,0,0,37,115,32,0,0,0,0,0,32,9,13,10,0,0,0,0,37,115,95,103,101,95,50,94,37,48,50,100,0,0,0,0,114,111,111,116,115,32,111,102,32,117,110,105,116,121,44,32,111,114,100,101,114,32,37,90,100,44,32,0,0,0,0,0,109,105,108,108,101,114,0,0,109,105,108,108,101,114,45,97,102,102,105,110,101,0,0,0,107,32,109,117,115,116,32,98,101,32,101,118,101,110,0,0,113,120,110,32,61,61,32,48,0,0,0,0,0,0,0,0,109,105,108,108,101,114,0,0,44,32,98,105,116,115,32,112,101,114,32,99,111,111,114,100,32,61,32,37,100,0,0,0,117,110,107,110,111,119,110,32,112,97,105,114,105,110,103,32,116,121,112,101,0,0,0,0,97,112,91,48,93,32,62,32,48,0,0,0,0,0,0,0,71,70,40,37,90,100,41,58,32,122,101,114,111,32,102,108,97,103,32,43,32,109,112,110,0,0,0,0,0,0,0,0,100,105,111,117,120,88,101,69,102,70,103,71,97,65,99,115,112,110,109,90,0,0,0,0,114,101,97,108,108,111,99,40,41,32,101,114,114,111,114,0,112,111,119,116,97,98,95,109,101,109,95,112,116,114,32,60,32,112,111,119,116,97,98,95,109,101,109,32,43,32,40,40,117,110,41,32,43,32,51,50,41,0,0,0,0,0,0,0,37,115,95,101,120,112,105,110,116,37,48,50,100,95,37,108,108,117,0,0,0,0,0,0,112,111,119,116,97,98,95,109,101,109,95,112,116,114,32,60,32,112,111,119,116,97,98,95,109,101,109,32,43,32,40,40,117,110,41,32,43,32,50,32,42,32,51,50,41,0,0,0,95,95,103,109,112,110,95,102,102,116,95,110,101,120,116,95,115,105,122,101,32,40,112,108,44,32,107,41,32,61,61,32,112,108,0,0,0,0,0,0,114,98,0,0,0,0,0,0,101,114,114,111,114,32,114,101,97,100,105,110,103,32,115,111,117,114,99,101,32,111,102,32,114,97,110,100,111,109,32,98,105,116,115,0,0,0,0,0,37,115,58,0,0,0,0,0,109,101,116,104,111,100,0,0,117,110,107,110,111,119,110,32,102,105,101,108,100,32,37,112,44,32,111,114,100,101,114,32,61,32,37,90,100,0,0,0,109,105,108,108,101,114,0,0,100,0,0,0,0,0,0,0,109,101,116,104,111,100,0,0,37,100,58,32,0,0,0,0,98,97,100,32,112,97,105,114,105,110,103,32,112,97,114,97,109,101,116,101,114,115,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,69,114,114,111,114,58,32,100,105,115,99,97,114,100,105,110,103,0,0,0,0,0,0,0,101,120,116,101,110,115,105,111,110,32,120,94,50,32,43,32,37,66,44,32,98,97,115,101,32,102,105,101,108,100,58,32,0,0,0,0,0,0,0,0,37,115,95,102,108,101,120,105,110,116,95,37,108,108,117,0,103,0,0,0,0,0,0,0,109,101,116,104,111,100,0,0,99,111,101,102,102,37,100,0,97,49,0,0,0,0,0,0,101,114,114,111,114,32,112,97,114,115,105,110,103,32,112,111,108,105,99,121,58,32,105,100,101,110,116,105,116,121,32,111,112,101,114,97,116,111,114,32,34,37,100,111,102,34,32,40,111,110,108,121,32,111,110,101,32,111,112,101,114,97,110,100,41,10,0,0,0,0,0,0,97,49,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,0,0,0,0,101,120,116,101,110,115,105,111,110,32,120,94,50,32,43,32,49,44,32,98,97,115,101,32,102,105,101,108,100,58,32,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,2,3,3,4,4,4,4,5,5,5,5,5,5,5,5,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,255,255,255,255,255,255,255,31,1,0,0,0,0,0,0,0,20,0,0,0,193,156,132,161,71,3,184,50,145,27,212,207,36,60,86,59,16,0,0,0,255,255,255,127,255,255,255,63,2,0,0,0,0,0,0,0,13,0,0,0,164,209,64,110,37,60,77,74,149,115,194,72,132,38,92,194,12,0,0,0,27,201,8,99,71,3,184,82,0,16,191,129,182,209,27,249,11,0,0,0,235,100,48,91,253,217,213,89,151,156,219,117,203,162,7,22,10,0,0,0,85,85,85,85,255,255,255,95,3,0,0,0,0,0,0,0,10,0,0,0,96,78,194,80,142,6,112,101,145,27,212,207,36,60,86,59,9,0,0,0,66,77,16,77,37,60,77,106,0,202,154,59,130,190,224,18,9,0,0,0,7,39,0,74,240,169,179,110,43,109,139,140,4,222,76,210].concat([8,0,0,0,13,206,104,71,71,3,184,114,0,0,161,25,181,154,163,63,8,0,0,0,227,83,46,69,142,0,106,118,33,16,159,48,95,172,248,80,8,0,0,0,251,255,60,67,253,217,213,121,0,193,246,87,30,59,132,116,8,0,0,0,17,119,134,65,109,63,5,125,129,155,194,152,194,38,3,173,8,0,0,0,255,255,255,63,255,255,255,127,4,0,0,0,0,0,0,0,7,0,0,0,253,106,161,62,223,126,204,130,113,69,117,24,189,182,240,78,7,0,0,0,141,89,100,61,142,6,112,133,128,188,125,36,161,72,252,192,7,0,0,0,48,194,67,60,174,5,239,135,123,102,71,53,66,137,131,51,7,0,0,0,66,154,59,59,37,60,77,138,0,64,75,76,171,41,127,173,7,0,0,0,240,152,72,58,68,221,141,140,29,110,90,107,21,61,60,49,7,0,0,0,19,11,104,57,240,169,179,142,128,225,172,148,224,169,204,184,7,0,0,0,183,178,151,56,0,5,193,144,103,131,241,202,233,109,237,66,6,0,0,0,209,174,213,55,71,3,184,146,0,0,100,11,11,14,152,103,6,0,0,0,210,104,32,55,75,120,154,148,81,74,141,14,18,152,121,25,6,0,0,0,126,134,118,54,142,0,106,150,64,174,105,18,150,83,232,188,6,0,0,0,235,222,214,53,213,9,40,152,73,145,23,23,169,3,193,98,6,0,0,0,214,113,64,53,253,217,213,153,0,16,185,28,67,61,53,29,6,0,0,0,197,96,178,52,143,148,116,155,153,72,116,35,234,236,29,206,6,0,0,0,134,233,43,52,109,63,5,157,64,168,115,43,17,197,15,121,6,0,0,0,185,97,172,51,179,198,136,158,65,59,230,52,160,101,184,53,6,0,0,0,51,51,51,51,255,255,255,159,5,0,0,0,0,0,0,0,6,0,0,0,1,217,191,50,55,173,107,161,193,60,250,76,179,209,174,169,6,0,0,0,246,220,81,50,223,126,204,162,64,216,19,92,41,194,223,99,6,0,0,0,159,213,232,49,35,22,35,164,25,181,145,109,48,238,15,43,6,0,0,0,141,100,132,49,142,6,112,165,0,16,191,129,182,209,27,249,6,0,0,0,232,52,36,49,139,215,179,166,201,224,237,152,169,195,137,172,6,0,0,0,52,250,199,48,174,5,239,167,64,62,119,179,254,50,44,109,6,0,0,0,76,111,111,48,213,3,34,169,209,196,187,209,201,7,121,56,6,0,0,0,127,85,26,48,37,60,77,170,0,0,36,244,11,122,111,12,5,0,0,0,209,115,200,47,230,16,113,171,73,211,231,6,84,129,146,40,5,0,0,0,82,150,121,47,68,221,141,172,160,48,202,7,157,98,232,6,5,0,0,0,143,141,45,47,251,245,163,173,187,43,195,8,160,220,115,211,5,0,0,0,22,46,228,46,240,169,179,174,0,108,212,9,149,120,177,160,5,0,0,0,9,80,157,46,180,66,189,175,253,172,255,10,165,17,104,116,5,0,0,0,192,206,88,46,0,5,193,176,224,190,70,12,15,80,166,77,5,0,0,0,116,136,22,46,30,49,191,177,239,134,171,13,130,53,162,43,5,0,0,0,247,93,214,45,71,3,184,178,0,0,48,15,136,10,178,13,5,0,0,0,117,50,152,45,250,179,171,179,241,58,214,16,228,92,141,230,5,0,0,0,56,235,91,45,75,120,154,180,32,95,160,18,157,253,205,183,5,0,0,0,121,111,33,45,38,130,132,181,227,170,144,20,51,57,88,142,5,0,0,0,46,168,232,44,142,0,106,182,0,116,169,22,234,195,124,105,5,0,0,0,234,127,177,44,214,31,75,183,37,40,237,24,108,202,165,72,5,0,0,0,176,226,123,44,213,9,40,184,96,77,94,27,22,219,82,43,5,0,0,0,219,189,71,44,21,230,0,185,151,130,255,29,166,134,21,17,5,0,0,0,252,255,20,44,253,217,213,185,0,128,211,32,54,43,29,243,5,0,0,0,195,152,227,43,245,8,167,186,153,23,221,35,25,109,215,200,5,0,0,0,231,120,179,43,143,148,116,187,160,53,31,39,180,30,203,162,5,0,0,0,16,146,132,43,162,156,62,188,11,225,156,42,195,62,124,128,5,0,0,0,199,214,86,43,109,63,5,189,0,60,89,46,191,200,126,97,5,0,0,0,96,58,42,43,171,153,200,189,77,132,87,50,190,108,116,69,5,0,0,0,241,176,254,42,179,198,136,190,224,19,155,54,115,162,10,44,5,0,0,0,60,47,212,42,139,224,69,191,63,97,39,59,5,8,249,20,5,0,0,0,170,170,170,42,255,255,255,191,6,0,0,0,0,0,0,0,5,0,0,0,58,25,130,42,180,60,183,192,65,161,40,69,41,8,207,217,5,0,0,0,118,113,90,42,55,173,107,193,32,20,165,74,65,72,252,182,5,0,0,0,110,170,51,42,19,103,29,194,51,70,121,80,203,84,48,151,5,0,0,0,170,187,13,42,223,126,204,194,0,68,169,86,75,190,29,122,5,0,0,0,36,157,232,41,72,8,121,195,117,57,57,93,127,205,127,95,5,0,0,0,64,71,196,41,35,22,35,196,96,114,45,100,132,108,25,71,5,0,0,0,199,178,160,41,120,186,202,196,231,90,138,107,53,54,180,48,5,0,0,0,219,216,125,41,142,6,112,197,0,128,84,115,246,165,31,28,5,0,0,0,249,178,91,41,244,10,19,198,233,143,144,123,74,99,48,9,5,0,0,0,235,58,58,41,139,215,179,198,160,90,67,132,60,74,127,239,5,0,0,0,204,106,25,41,147,123,82,199,91,210,113,141,210,82,85,207,5,0,0,0,251,60,249,40,174,5,239,199,0,12,33,151,142,124,164,177,5,0,0,0,27,172,217,40,237,131,137,200,157,63,86,161,62,180,52,150,5,0,0,0,16,179,186,40,213,3,34,201,224,200,22,172,125,129,211,124,5,0,0,0,248,76,156,40,103,146,184,201,143,39,104,183,97,103,83,101,5,0,0,0,41,117,126,40,37,60,77,202,0,0,80,195,142,88,139,79,5,0,0,0,48,39,97,40,28,13,224,202,145,27,212,207,36,60,86,59,5,0,0,0,201,94,68,40,230,16,113,203,32,105,250,220,84,129,146,40,5,0,0,0,225,23,40,40,177,82,0,204,131,253,200,234,176,191,33,23,5,0,0,0,144,78,12,40,68,221,141,204,0,20,70,249,157,98,232,6,4,0,0,0,27,255,240,39,5,187,25,205,177,132,28,3,124,193,28,73,4,0,0,0,236,37,214,39,251,245,163,205,16,171,66,3,59,216,17,58,4,0,0,0,149,191,187,39,214,151,44,206,33,44,106,3,205,116,224,43,4,0,0,0,200,200,161,39,240,169,179,206,0,16,147,3,231,2,122,30,4,0,0,0,94,62,136,39,80,53,57,207,225,94,189,3,221,14,209,17,4,0,0,0,76,29,111,39,180,66,189,207,16,33,233,3,104,44,217,5,4,0,0,0,168,98,86,39,139,218,63,208,241,94,22,4,178,191,13,245,4,0,0,0,163,11,62,39,0,5,193,208,0,33,69,4,22,19,159,223,4,0,0,0,140,21,38,39,250,201,64,209,209,111,117,4,132,166,82,203,4,0,0,0,201,125,14,39,30,49,191,209,16,84,167,4,151,62,22,184,4,0,0,0,221,65,247,38,212,65,60,210,129,214,218,4,105,242,216,165,4,0,0,0,95,95,224,38,71,3,184,210,0,0,16,5,205,15,139,148,4,0,0,0,254,211,201,38,106,124,50,211,129,217,70,5,21,2,30,132,4,0,0,0,127,157,179,38,250,179,171,211,16,108,127,5,30,59,132,116,4,0,0,0,188,185,157,38,126,176,35,212,209,192,185,5,110,30,177,101,4,0,0,0,161,38,136,38,75,120,154,212,0,225,245,5,35,238,152,87,4,0,0,0,45,226,114,38,135,17,16,213,241,213,51,6,155,185,48,74,4,0,0,0,114,234,93,38,38,130,132,213,16,169,115,6,148,77,110,61,4,0,0,0,147,61,73,38,244,207,247,213,225,99,181,6,176,37,72,49,4,0,0,0,194,217,52,38,142,0,106,214,0,16,249,6,46,95,181,37,4,0,0,0,65,189,32,38,106,25,219,214,33,183,62,7,203,172,173,26,4,0,0,0,98,230,12,38,214,31,75,215,16,99,134,7,162,75,41,16,4,0,0,0,133,83,249,37,249,24,186,215,177,29,208,7,246,248,32,6,4,0,0,0,22,3,230,37,213,9,40,216,0,241,27,8,182,209,27,249,4,0,0,0,144,243,210,37,75,247,148,216,17,231,105,8,42,123,211,230,4,0,0,0,121,35,192,37,21,230,0,217,16,10,186,8,110,255,92,213,4,0,0,0,101,145,173,37,210,218,107,217,65,100,12,9,178,45,173,196,4,0,0,0,243,59,155,37,253,217,213,217,0,0,97,9,207,133,185,180,4,0,0,0,203,33,137,37,243,231,62,218,193,231,183,9,239,43,120,165,4,0,0,0,162,65,119,37,245,8,167,218,16,38,17,10,42,221,223,150,4,0,0,0,55,154,101,37,38,65,14,219,145,197,108,10,9,229,231,136,4,0,0,0,80,42,84,37,143,148,116,219,0,209,202,10,211,19,136,123,4,0,0,0,194,240,66,37,28,7,218,219,49,83,43,11,149,181,184,110,4,0,0,0,100,236,49,37,162,156,62,220,16,87,142,11,219,137,114,98,4,0,0,0,28,28,33,37,220,88,162,220,161,231,243,11,7,188,174,86,4,0,0,0,213,126,16,37,109,63,5,221,0,16,92,12,51,220,102,75,4,0,0,0,131,19,0,37,224,83,103,221,97,219,198,12,163,216,148,64,4,0,0,0,33,217,239,36,171,153,200,221,16,85,52,13,165,247,50,54,4,0,0,0,179,206,223,36,46,20,41,222,113,136,164,13,240,209,59,44,4,0,0,0,67,243,207,36,179,198,136,222,0,129,23,14,95,77,170,34,4,0,0,0,225,69,192,36,113,180,231,222,81,74,141,14,18,152,121,25,4,0,0,0,166,197,176,36,139,224,69,223,16,240,5,15,229,35,165,16,4,0,0,0,176,113,161,36,17,78,163,223,1,126,129,15,55,162,40,8,4,0,0,0,36,73,146,36,255,255,255,223,7,0,0,0,0,0,0,0,4,0,0,0,44,75,131,36,66,249,91,224,1,130,129,16,82,196,78,240,4,0,0,0,249,118,116,36,180,60,183,224,16,16,6,17,74,68,54,225,4,0,0,0,192,203,101,36,29,205,17,225,81,182,141,17,137,149,175,210,4,0,0,0,188,72,87,36,55,173,107,225,0,129,24,18,131,42,180,196,4,0,0,0,47,237,72,36,171,223,196,225,113,124,166,18,245,204,61,183,4,0,0,0,93,184,58,36,19,103,29,226,16,181,55,19,197,152,70,170,4,0,0,0,146,169,44,36,251,69,117,226,97,55,204,19,41,247,200,157,4,0,0,0,27,192,30,36,223,126,204,226,0,16,100,20,48,154,191,145,4,0,0,0,77,251,16,36,45,20,35,227,161,75,255,20,135,120,37,134,4,0,0,0,128,90,3,36,72,8,121,227,16,247,157,21,140,201,245,122,4,0,0,0,16,221,245,35,130,93,206,227,49,31,64,22,160,1,44,112,4,0,0,0,93,130,232,35,35,22,35,228,0,209,229,22,177,206,195,101,4,0,0,0,204,73,219,35,101,52,119,228,145,25,143,23,2,21,185,91,4,0,0,0,196,50,206,35,120,186,202,228,16,6,60,24,35,236,7,82,4,0,0,0,179,60,193,35,126,170,29,229,193,163,236,24,25,156,172,72,4,0,0,0,6,103,180,35,142,6,112,229,0,0,161,25,181,154,163,63,4,0,0,0,50,177,167,35,181,208,193,229,65,40,89,26,18,137,233,54,4,0,0,0,172,26,155,35,244,10,19,230,16,42,21,27,64,49,123,46,4,0,0,0,239,162,142,35,65,183,99,230,17,19,213,27,11,132,85,38,4,0,0,0,118,73,130,35,139,215,179,230,0,241,152,28,234,150,117,30,4,0,0,0,195,13,118,35,179,109,3,231,177,209,96,29,13,162,216,22,4,0,0,0,88,239,105,35,147,123,82,231,16,195,44,30,135,254,123,15,4,0,0,0,187,237,93,35,249,2,161,231,33,211,252,30,146,36,93,8,4,0,0,0,116,8,82,35,174,5,239,231,0,16,209,31,244,169,121,1,4,0,0,0,16,63,70,35,109,133,60,232,225,135,169,32,235,128,158,245,4,0,0,0,27,145,58,35,237,131,137,232,16,73,134,33,219,104,183,232,4,0,0,0,38,254,46,35,217,2,214,232,241,97,103,34,213,214,57,220,4,0,0,0,198,133,35,35,213,3,34,233,0,225,76,35,209,197,33,208,4,0,0,0,142,39,24,35,126,136,109,233,209,212,54,36,55,94,107,196,4,0,0,0,24,227,12,35,103,146,184,233,16,76,37,37,156,243,18,185,4,0,0,0,253,183,1,35,29,35,3,234,129,85,24,38,148,2,21,174,4,0,0,0,217,165,246,34,37,60,77,234,0,0,16,39,177,46,110,163,4,0,0,0,76,172,235,34,254,222,150,234,129,90,12,40,148,64,27,153,4,0,0,0,246,202,224,34,28,13,224,234,16,116,13,41,30,36,25,143,4,0,0,0,121,1,214,34,242,199,40,235,209,91,19,42,183,230,100,133,4,0,0,0,122,79,203,34,230,16,113,235,0,33,30,43,180,181,251,123,4,0,0,0,161,180,192,34,93,233,184,235,241,210,45,44,200,220,218,114,4,0,0,0,149,48,182,34,177,82,0,236,16,129,66,45,152,196,255,105,4,0,0,0,0,195,171,34,57,78,71,236,225,58,92,46,84,241,103,97,4,0,0,0,144,107,161,34,68,221,141,236,0,16,123,47,110,1,17,89,4,0,0,0,241,41,151,34,28,1,212,236,33,16,159,48,95,172,248,80,4,0,0,0,212,253,140,34,5,187,25,237,16,75,200,49,124,193,28,73,4,0,0,0,233,230,130,34,60,12,95,237,177,208,246,50,216,38,123,65,4,0,0,0,227,228,120,34,251,245,163,237,0,177,42,52,59,216,17,58,4,0,0,0,119,247,110,34,116,121,232,237,17,252,99,53,34,230,222,50,4,0,0,0,90,30,101,34,214,151,44,238,16,194,162,54,205,116,224,43,4,0,0,0,68,89,91,34,73,82,112,238,65,19,231,55,88,187,20,37,4,0,0,0,238,167,81,34,240,169,179,238,0,0,49,57,231,2,122,30,4,0,0,0,17,10,72,34,234,159,246,238,193,152,128,58,208,165,14,24,4,0,0,0,105,127,62,34,80,53,57,239,16,238,213,59,221,14,209,17,4,0,0,0,180,7,53,34,57,107,123,239,145,16,49,61,142,184,191,11,4,0,0,0,175,162,43,34,180,66,189,239,0,17,146,62,104,44,217,5,4,0,0,0,25,80,34,34,205,188,254,239,49,0,249,63,76,2,28,0,4,0,0,0,180,15,25,34,139,218,63,240,16,239,101,65,178,191,13,245,4,0,0,0,65,225,15,34,242,156,128,240,161,238,216,66,163,239,48,234,4,0,0,0,131,196,6,34,0,5,193,240,0,16,82,68,22,19,159,223,4,0,0,0,63,185,253,33,177,19,1,241,97,100,209,69,201,192,85,213,4,0,0,0,58,191,244,33,250,201,64,241,16,253,86,71,132,166,82,203,4,0,0,0,57,214,235,33,207,40,128,241,113,235,226,72,31,136,147,193,4,0,0,0,6,254,226,33,30,49,191,241,0,65,117,74,151,62,22,184,4,0,0,0,103,54,218,33,211,227,253,241,81,15,14,76,36,183,216,174,4,0,0,0,40,127,209,33,212,65,60,242,16,104,173,77,105,242,216,165,4,0,0,0,17,216,200,33,5,76,122,242,1,93,83,79,157,3,21,157,4,0,0,0,239,64,192,33,71,3,184,242,0,0,0,81,205,15,139,148,4,0,0,0,143,185,183,33,117,104,245,242,1,99,179,82,29,77,57,140,4,0,0,0,188,65,175,33,106,124,50,243,16,152,109,84,21,2,30,132,4,0,0,0,71,217,166,33,251,63,111,243,81,177,46,86,248,132,55,124,4,0,0,0,253,127,158,33,250,179,171,243,0,193,246,87,30,59,132,116,4,0,0,0,175,53,150,33,55,217,231,243,113,217,197,89,93,152,2,109,4,0,0,0,46,250,141,33,126,176,35,244,16,13,156,91,110,30,177,101,4,0,0,0,76,205,133,33,152,58,95,244,97,110,121,93,100,92,142,94,4,0,0,0,218,174,125,33,75,120,154,244,0,16,94,95,35,238,152,87,4,0,0,0,172,158,117,33,91,106,213,244,161,4,74,97,222,123,207,80,4,0,0,0,150,156,109,33,135,17,16,245,16,95,61,99,155,185,48,74,4,0,0,0,110,168,101,33,140,110,74,245,49,50,56,101,189,102,187,67,4,0,0,0,7,194,93,33,38,130,132,245,0,145,58,103,148,77,110,61,4,0,0,0,57,233,85,33,12,77,190,245,145,142,68,105,238,66,72,55,4,0,0,0,219,29,78,33,244,207,247,245,16,62,86,107,176,37,72,49,4,0,0,0,196,95,70,33,143,11,49,246,193,178,111,109,117,222,108,43,4,0,0,0,205,174,62,33,142,0,106,246,0,0,145,111,46,95,181,37,4,0,0,0,206,10,55,33,158,175,162,246,65,57,186,113,197,162,32,32,4,0,0,0,160,115,47,33,106,25,219,246,16,114,235,115,203,172,173,26,4,0,0,0,32,233,39,33,155,62,19,247,17,190,36,118,31,137,91,21,4,0,0,0,38,107,32,33,214,31,75,247,0,49,102,120,162,75,41,16,4,0,0,0,143,249,24,33,191,189,130,247,177,222,175,122,233,15,22,11,4,0,0,0,54,148,17,33,249,24,186,247,16,219,1,125,246,248,32,6,4,0,0,0,248,58,10,33,33,50,241,247,33,58,92,127,239,48,73,1,4,0,0,0,179,237,2,33,213,9,40,248,0,16,191,129,182,209,27,249,4,0,0,0,68,172,251,32,176,160,94,248,225,112,42,132,199,176,220,239,4,0,0,0,138,118,244,32,75,247,148,248,16,113,158,134,42,123,211,230,4,0,0,0,98,76,237,32,59,14,203,248,241,36,27,137,74,185,254,221,4,0,0,0,174,45,230,32,21,230,0,249,0,161,160,139,110,255,92,213,4,0,0,0,75,26,223,32,109,127,54,249,209,249,46,142,80,237,236,204,4,0,0,0,28,18,216,32,210,218,107,249,16,68,198,144,178,45,173,196,4,0,0,0,0,21,209,32,211,248,160,249,129,148,102,147,249,117,156,188,4,0,0,0,217,34,202,32,253,217,213,249,0,0,16,150,207,133,185,180,4,0,0,0,136,59,195,32,218,126,10,250,129,155,194,152,194,38,3,173,4,0,0,0,241,94,188,32,243,231,62,250,16,124,126,155,239,43,120,165,4,0,0,0,245,140,181,32,208,21,115,250,209,182,67,158,169,113,23,158,4,0,0,0,121,197,174,32,245,8,167,250,0,97,18,161,42,221,223,150,4,0,0,0,94,8,168,32,231,193,218,250,241,143,234,163,65,92,208,143,4,0,0,0,139,85,161,32,38,65,14,251,16,89,204,166,9,229,231,136,4,0,0,0,226,172,154,32,52,135,65,251,225,209,183,169,157,117,37,130,4,0,0,0,73,14,148,32,143,148,116,251,0,16,173,172,211,19,136,123,4,0,0,0,165,121,141,32,179,105,167,251,33,41,172,175,249,204,14,117,4,0,0,0,219,238,134,32,28,7,218,251,16,51,181,178,149,181,184,110,4,0,0,0,210,109,128,32,68,109,12,252,177,67,200,181,35,233,132,104,4,0,0,0,113,246,121,32,162,156,62,252,0,113,229,184,219,137,114,98,4,0,0,0,157,136,115,32,174,149,112,252,17,209,12,188,123,192,128,92,4,0,0,0,62,36,109,32,220,88,162,252,16,122,62,191,7,188,174,86,4,0,0,0,60,201,102,32,160,230,211,252,65,130,122,194,155,177,251,80,4,0,0,0,126,119,96,32,109,63,5,253,0,0,193,197,51,220,102,75,4,0,0,0,237,46,90,32,178,99,54,253,193,9,18,201,124,124,239,69,4,0,0,0,113,239,83,32,224,83,103,253,16,182,109,204,163,216,148,64,4,0,0,0,243,184,77,32,100,16,152,253,145,27,212,207,36,60,86,59,4,0,0,0,92,139,71,32,171,153,200,253,0,81,69,211,165,247,50,54,4,0,0,0,150,102,65,32,32,240,248,253,49,109,193,214,195,96,42,49,4,0,0,0,139,74,59,32,46,20,41,254,16,135,72,218,240,209,59,44,4,0,0,0,37,55,53,32,60,6,89,254,161,181,218,221,69,170,102,39,4,0,0,0,78,44,47,32,179,198,136,254,0,16,120,225,95,77,170,34,4,0,0,0,240,41,41,32,248,85,184,254,97,173,32,229,60,35,6,30,4,0,0,0,248,47,35,32,113,180,231,254,16,165,212,232,18,152,121,25,4,0,0,0,80,62,29,32,129,226,22,255,113,14,148,236,51,28,4,21,4,0,0,0,229,84,23,32,139,224,69,255,0,1,95,240,229,35,165,16,4,0,0,0,161,115,17,32,240,174,116,255,81,148,53,244,73,39,92,12,4,0,0,0,113,154,11,32,17,78,163,255,16,224,23,248,55,162,40,8,4,0,0,0,66,201,5,32,76,190,209,255,1,252,5,252,35,20,10,4,4,0,0,0,255,255,255,31,255,255,255,255,8,0,0,0,0,0,0,0,0,0,0,0,108,0,0,0,118,2,0,0,212,2,0,0,78,0,0,0,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,8,4,1,1,1,1,1,13,9,5,2,2,2,2,2,6,10,14,3,3,3,3,3,7,11,15,4,16,6,18,4,0,12,8,5,17,7,19,5,1,13,9,6,18,4,16,6,10,14,2,7,19,5,17,7,11,15,3,8,10,9,11,8,4,0,12,9,11,8,10,9,5,1,13,10,9,11,8,10,14,2,6,11,8,10,9,11,15,3,7,12,22,24,20,12,8,4,0,13,23,25,21,13,9,5,1,25,21,13,23,14,2,6,10,24,20,12,22,15,3,7,11,16,6,18,4,16,16,16,16,17,7,19,5,17,17,17,17,18,4,16,6,18,22,19,23,19,5,17,7,19,23,18,22,20,12,22,24,20,20,20,20,21,13,23,25,21,21,21,21,22,24,20,12,22,19,23,18,23,25,21,13,23,18,22,19,24,20,12,22,15,3,7,11,25,21,13,23,14,2,6,10,120,1,0,0,0,0,0,0,86,1,0,0,112,1,0,0,144,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,255,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,1,2,3,4,5,6,7,8,9,255,255,255,255,255,255,255,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,255,255,255,255,255,255,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,1,171,205,183,57,163,197,239,241,27,61,167,41,19,53,223,225,139,173,151,25,131,165,207,209,251,29,135,9,243,21,191,193,107,141,119,249,99,133,175,177,219,253,103,233,211,245,159,161,75,109,87,217,67,101,143,145,187,221,71,201,179,213,127,129,43,77,55,185,35,69,111,113,155,189,39,169,147,181,95,97,11,45,23,153,3,37,79,81,123,157,7,137,115,149,63,65,235,13,247,121,227,5,47,49,91,125,231,105,83,117,31,33,203,237,215,89,195,229,15,17,59,93,199,73,51,85,255,92,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,140,2,0,0,18,1,0,0,158,2,0,0,130,2,0,0,140,2,0,0,18,1,0,0,158,2,0,0])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
}
if (!awaitingMemoryInitializer) runPostSets();
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOPNOTSUPP:45,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_NORMAL);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STATIC);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        // TODO: put these low in memory like we used to assert on: assert(Math.max(_stdin, _stdout, _stderr) < 15000); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_DYNAMIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length; // Keep dense
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }
  var _llvm_va_start=undefined;
  function _vfprintf(s, f, va_arg) {
      return _fprintf(s, f, HEAP32[((va_arg)>>2)]);
    }
  function _llvm_va_end() {}
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var ___strtok_state=0;
  function _strtok_r(s, delim, lasts) {
      var skip_leading_delim = 1;
      var spanp;
      var c, sc;
      var tok;
      if (s == 0 && (s = getValue(lasts, 'i8*')) == 0) {
        return 0;
      }
      cont: while (1) {
        c = getValue(s++, 'i8');
        for (spanp = delim; (sc = getValue(spanp++, 'i8')) != 0;) {
          if (c == sc) {
            if (skip_leading_delim) {
              continue cont;
            } else {
              setValue(lasts, s, 'i8*');
              setValue(s - 1, 0, 'i8');
              return s - 1;
            }
          }
        }
        break;
      }
      if (c == 0) {
        setValue(lasts, 0, 'i8*');
        return 0;
      }
      tok = s - 1;
      for (;;) {
        c = getValue(s++, 'i8');
        spanp = delim;
        do {
          if ((sc = getValue(spanp++, 'i8')) == c) {
            if (c == 0) {
              s = 0;
            } else {
              setValue(s - 1, 0, 'i8');
            }
            setValue(lasts, s, 'i8*');
            return tok;
          }
        } while (sc != 0);
      }
      abort('strtok_r error!');
    }function _strtok(s, delim) {
      return _strtok_r(s, delim, ___strtok_state);
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      _memcpy(newStr, ptr, len);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }
  function __isFloat(text) {
      return !!(/^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.exec(text));
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[' '] = 1;
        __scanString.whiteSpace['\t'] = 1;
        __scanString.whiteSpace['\n'] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        // TODO: Support strings like "%5c" etc.
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'c') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          fields++;
          next = get();
          HEAP8[(argPtr)]=next
          formatIndex += 2;
          continue;
        }
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if(format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' || type == 'E') {
            var last = 0;
            next = get();
            while (next > 0) {
              buffer.push(String.fromCharCode(next));
              if (__isFloat(buffer.join(''))) {
                last = buffer.length;
              }
              next = get();
            }
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   (type === 'x' && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if(longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,Math.min(Math.floor((parseInt(text, 10))/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'f':
            case 'e':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex] in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      var get = function() { return HEAP8[(((s)+(index++))|0)]; };
      var unget = function() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var comparator = function(x, y) {
        return Runtime.dynCall('iii', cmp, [x, y]);
      }
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return comparator(base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }
  Module["_strcpy"] = _strcpy;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function _nl_langinfo(item) {
      // char *nl_langinfo(nl_item item);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/nl_langinfo.html
      var result;
      switch (item) {
        case 0:
          result = 'ANSI_X3.4-1968';
          break;
        case 1:
          result = '%a %b %e %H:%M:%S %Y';
          break;
        case 2:
          result = '%m/%d/%y';
          break;
        case 3:
          result = '%H:%M:%S';
          break;
        case 4:
          result = '%I:%M:%S %p';
          break;
        case 5:
          result = 'AM';
          break;
        case 6:
          result = 'PM';
          break;
        case 7:
          result = 'Sunday';
          break;
        case 8:
          result = 'Monday';
          break;
        case 9:
          result = 'Tuesday';
          break;
        case 10:
          result = 'Wednesday';
          break;
        case 11:
          result = 'Thursday';
          break;
        case 12:
          result = 'Friday';
          break;
        case 13:
          result = 'Saturday';
          break;
        case 14:
          result = 'Sun';
          break;
        case 15:
          result = 'Mon';
          break;
        case 16:
          result = 'Tue';
          break;
        case 17:
          result = 'Wed';
          break;
        case 18:
          result = 'Thu';
          break;
        case 19:
          result = 'Fri';
          break;
        case 20:
          result = 'Sat';
          break;
        case 21:
          result = 'January';
          break;
        case 22:
          result = 'February';
          break;
        case 23:
          result = 'March';
          break;
        case 24:
          result = 'April';
          break;
        case 25:
          result = 'May';
          break;
        case 26:
          result = 'June';
          break;
        case 27:
          result = 'July';
          break;
        case 28:
          result = 'August';
          break;
        case 29:
          result = 'September';
          break;
        case 30:
          result = 'October';
          break;
        case 31:
          result = 'November';
          break;
        case 32:
          result = 'December';
          break;
        case 33:
          result = 'Jan';
          break;
        case 34:
          result = 'Feb';
          break;
        case 35:
          result = 'Mar';
          break;
        case 36:
          result = 'Apr';
          break;
        case 37:
          result = 'May';
          break;
        case 38:
          result = 'Jun';
          break;
        case 39:
          result = 'Jul';
          break;
        case 40:
          result = 'Aug';
          break;
        case 41:
          result = 'Sep';
          break;
        case 42:
          result = 'Oct';
          break;
        case 43:
          result = 'Nov';
          break;
        case 44:
          result = 'Dec';
          break;
        case 49:
          result = '';
          break;
        case 50:
          result = '.';
          break;
        case 51:
          result = '';
          break;
        case 52:
          result = '^[yY]';
          break;
        case 53:
          result = '^[nN]';
          break;
        case 56:
          result = '-';
          break;
        case 45:
        case 46:
        case 47:
        case 48:
        default:
          result = '';
          break;
      }
      var me = _nl_langinfo;
      if (!me.ret) me.ret = _malloc(32);
      for (var i = 0; i < result.length; i++) {
        HEAP8[(((me.ret)+(i))|0)]=result.charCodeAt(i)
      }
      HEAP8[(((me.ret)+(i))|0)]=0
      return me.ret;
    }
  var _llvm_expect_i32=undefined;
  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      return Number(FS.streams[stream] && FS.streams[stream].error);
    }
  function _llvm_va_copy(ppdest, ppsrc) {
      HEAP8[(ppdest)]=HEAP8[(ppsrc)];HEAP8[(((ppdest)+(1))|0)]=HEAP8[(((ppsrc)+(1))|0)];HEAP8[(((ppdest)+(2))|0)]=HEAP8[(((ppsrc)+(2))|0)];HEAP8[(((ppdest)+(3))|0)]=HEAP8[(((ppsrc)+(3))|0)];
      /* Alternate implementation that copies the actual DATA; it assumes the va_list is prefixed by its size
      var psrc = IHEAP[ppsrc]-1;
      var num = IHEAP[psrc]; // right before the data, is the number of (flattened) values
      var pdest = _malloc(num+1);
      _memcpy(pdest, psrc, num+1);
      IHEAP[ppdest] = pdest+1;
      */
    }
  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }
  function _llvm_stacksave() {
      var self = _llvm_stacksave;
      if (!self.LLVM_SAVEDSTACKS) {
        self.LLVM_SAVEDSTACKS = [];
      }
      self.LLVM_SAVEDSTACKS.push(Runtime.stackSave());
      return self.LLVM_SAVEDSTACKS.length-1;
    }
  function _llvm_stackrestore(p) {
      var self = _llvm_stacksave;
      var ret = self.LLVM_SAVEDSTACKS[p];
      self.LLVM_SAVEDSTACKS.splice(p, 1);
      Runtime.stackRestore(ret);
    }
  Module["_memcmp"] = _memcmp;
  var _labs=Math.abs;
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function ___errno_location() {
      if (!___setErrNo.ret) {
        ___setErrNo.ret = allocate([0], 'i32', ALLOC_NORMAL);
        HEAP32[((___setErrNo.ret)>>2)]=0
      }
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
___strtok_state = Runtime.staticAlloc(4);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module.dynCall_iiii(index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module.dynCall_viiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module.dynCall_vi(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module.dynCall_vii(index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module.dynCall_ii(index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module.dynCall_viii(index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_v(index) {
  try {
    Module.dynCall_v(index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module.dynCall_viiiiii(index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module.dynCall_iii(index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module.dynCall_iiiiii(index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module.dynCall_viiii(index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm.setThrew(1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env._stdout|0;var p=env._stderr|0;var q=+env.NaN;var r=+env.Infinity;var s=0;var t=0;var u=0;var v=0;var w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0.0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=global.Math.floor;var Q=global.Math.abs;var R=global.Math.sqrt;var S=global.Math.pow;var T=global.Math.cos;var U=global.Math.sin;var V=global.Math.tan;var W=global.Math.acos;var X=global.Math.asin;var Y=global.Math.atan;var Z=global.Math.atan2;var _=global.Math.exp;var $=global.Math.log;var aa=global.Math.ceil;var ab=global.Math.imul;var ac=env.abort;var ad=env.assert;var ae=env.asmPrintInt;var af=env.asmPrintFloat;var ag=env.copyTempDouble;var ah=env.copyTempFloat;var ai=env.min;var aj=env.invoke_iiii;var ak=env.invoke_viiiii;var al=env.invoke_vi;var am=env.invoke_vii;var an=env.invoke_ii;var ao=env.invoke_viii;var ap=env.invoke_v;var aq=env.invoke_viiiiii;var ar=env.invoke_iii;var as=env.invoke_iiiiii;var at=env.invoke_viiii;var au=env._llvm_va_end;var av=env._strncmp;var aw=env._pread;var ax=env._sscanf;var ay=env._snprintf;var az=env._vsnprintf;var aA=env.__scanString;var aB=env._fclose;var aC=env._strtok_r;var aD=env._abort;var aE=env._fprintf;var aF=env._printf;var aG=env._isdigit;var aH=env._close;var aI=env._fopen;var aJ=env.__reallyNegative;var aK=env._nl_langinfo;var aL=env._strchr;var aM=env._fputc;var aN=env._llvm_stackrestore;var aO=env._open;var aP=env._strtok;var aQ=env.___setErrNo;var aR=env._fwrite;var aS=env._llvm_va_copy;var aT=env._qsort;var aU=env._write;var aV=env._fputs;var aW=env._isalpha;var aX=env._exit;var aY=env._sprintf;var aZ=env._strdup;var a_=env._isspace;var a$=env._sysconf;var a0=env._fread;var a1=env._read;var a2=env._asprintf;var a3=env._ferror;var a4=env.__formatString;var a5=env._labs;var a6=env._vfprintf;var a7=env._pwrite;var a8=env.__isFloat;var a9=env._isalnum;var ba=env._fsync;var bb=env._llvm_stacksave;var bc=env.___errno_location;var bd=env._sbrk;var be=env._time;var bf=env._islower;var bg=env.__exit;var bh=env._strcmp;
// EMSCRIPTEN_START_FUNCS
function bt(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function bu(){return i|0}function bv(a){a=a|0;i=a}function bw(a,b){a=a|0;b=b|0;if((s|0)==0){s=a;t=b}}function bx(a){a=a|0;F=a}function by(a){a=a|0;G=a}function bz(a){a=a|0;H=a}function bA(a){a=a|0;I=a}function bB(a){a=a|0;J=a}function bC(a){a=a|0;K=a}function bD(a){a=a|0;L=a}function bE(a){a=a|0;M=a}function bF(a){a=a|0;N=a}function bG(a){a=a|0;O=a}function bH(){var a=0,b=0,d=0,e=0;a=i;i=i+16|0;b=a|0;d=a+8|0;bM(1);cC(b,d);e=uq(8)|0;c[e>>2]=cm(dk(c[b>>2]|0)|0)|0;c[e+4>>2]=cm(dq(c[d>>2]|0)|0)|0;i=a;return e|0}function bI(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+8|0;f=e|0;bM(1);g=dl(cn(a)|0,1)|0;a=dr(g,cn(b)|0,1)|0;c[f>>2]=0;b=aP(d|0,5592)|0;while(1){if((b|0)==0){break}cb(f,b);b=aP(0,5592)|0}b=uq((ca(c[f>>2]|0)|0)+1<<2)|0;d=0;h=c[f>>2]|0;while(1){if((h|0)==0){break}f=d;d=f+1|0;c[b+(f<<2)>>2]=c[h>>2]|0;h=c[h+4>>2]|0}c[b+(d<<2)>>2]=0;d=cm(dt(cK(g,a,b)|0)|0)|0;i=e;return d|0}function bJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=b;bM(1);b=dl(cn(a)|0,1)|0;f=cc(f)|0;a=cZ(b,e|0,f)|0;f=co()|0;dd(f,e|0);e=cm(f)|0;f=cm(dy(a)|0)|0;a=uq(8)|0;c[a>>2]=e;c[a+4>>2]=f;i=d;return a|0}function bK(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;bM(1);f=dl(cn(a)|0,1)|0;a=du(f,cn(b)|0,1)|0;c7(f,a,dz(f,cn(c)|0,1)|0,e|0);c=co()|0;dd(c,e|0);e=cm(c)|0;i=d;return e|0}function bL(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=e;c[f>>2]=b;c[f+4>>2]=0;a6(c[p>>2]|0,a|0,c[e>>2]|0);aX(1);i=d;return}function bM(a){a=a|0;var b=0,d=0;b=i;if((c[318]|0)!=0){i=b;return}d=a;if((d|0)==0){n5(0);aF(7904,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)}else if((d|0)==1){n5(be(0)|0);aF(6864,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)}else{aF(6088,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);aX(1)}c[318]=1;i=b;return}function bN(){var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;i=i+2008|0;f=e|0;g=e+2e3|0;h=0;j=f|0;k=e+400|0;l=200;m=0;n=0;o=0;c[120]=0;c[150]=-2;p=j;q=k;L26:while(1){b[p>>1]=n&65535;if(((j+(l<<1)|0)-2|0)>>>0<=p>>>0){r=((p-j|0)/2&-1)+1|0;if(1e4<=l>>>0){s=27;break}l=l<<1;if(1e4<l>>>0){l=1e4}t=j;u=uq((l*10&-1)+7|0)|0;if((u|0)==0){s=31;break}uK(u|0,j|0,r<<1);j=u;u=u+((((l<<1)+7|0)>>>0)/8>>>0<<3)|0;uK(u|0,k|0,r<<3);k=u;u=u+((((l<<3)+7|0)>>>0)/8>>>0<<3)|0;if((t|0)!=(f|0)){uu(t)}p=(j+(r<<1)|0)-2|0;q=(k+(r<<3)|0)-8|0;if(((j+(l<<1)|0)-2|0)>>>0<=p>>>0){s=39;break}}r=a[n+432|0]|0;L45:do{if((r|0)==-5){s=68;break}else{if((c[150]|0)==-2){c[150]=b3()|0}if((c[150]|0)<=0){h=0;c[150]=0}else{if((c[150]|0)>>>0<=264){v=d[8+(c[150]|0)|0]|0}else{v=2}h=v}r=r+h|0;do{if((r|0)>=0){if(45<(r|0)){break}if((a[r+552|0]|0|0)!=(h|0)){break}r=d[r+280|0]|0;if((r|0)<=0){do{if((r|0)!=0){if((r|0)==-1){break}r=-r|0;s=71;break L45}}while(0);s=99;break L45}if((r|0)==15){s=62;break L26}if((o|0)!=0){o=o-1|0}if((c[150]|0)!=0){c[150]=-2}n=r;t=q+8|0;q=t;u=t;c[u>>2]=c[122]|0;c[u+4>>2]=c[123]|0;break L45}}while(0);s=68;break}}while(0);do{if((s|0)==68){s=0;r=d[n+504|0]|0;if((r|0)==0){s=99;break}else{s=71;break}}}while(0);if((s|0)==71){s=0;m=d[r+376|0]|0;u=g;t=q+(1-m<<3)|0;c[u>>2]=c[t>>2]|0;c[u+4>>2]=c[t+4>>2]|0;t=r;if((t|0)==2){c[332]=c[q>>2]|0}else if((t|0)==3){u=q-16|0;w=q|0;c[g>>2]=bP(c[u>>2]|0,c[u+4>>2]|0,c[w>>2]|0,c[w+4>>2]|0)|0}else if((t|0)==4){w=q|0;c[g>>2]=bQ(c[w>>2]|0,c[w+4>>2]|0)|0}else if((t|0)==5){c[g>>2]=bR(c[q>>2]|0)|0}else if((t|0)==6){c[g>>2]=bS(1,c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==7){c[g>>2]=bS(2,c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==8){w=q-32|0;c[g>>2]=bT(c[w>>2]|0,c[q-8>>2]|0)|0}else if((t|0)==9){c[g>>2]=bU(c[q>>2]|0,c[q-16>>2]|0)|0}else if((t|0)==10){c[g>>2]=bV(c[q>>2]|0,c[q-16>>2]|0)|0}else if((t|0)==11){c[g>>2]=bW(c[q>>2]|0,c[q-16>>2]|0)|0}else if((t|0)==12){c[g>>2]=bX(c[q>>2]|0,c[q-16>>2]|0)|0}else if((t|0)==13){c[g>>2]=bY(c[q>>2]|0,c[q-16>>2]|0)|0}else if((t|0)==14){c[g>>2]=bU(c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==15){c[g>>2]=bW(c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==16){c[g>>2]=bV(c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==17){c[g>>2]=bY(c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==18){c[g>>2]=bX(c[q-16>>2]|0,c[q>>2]|0)|0}else if((t|0)==19){c[g>>2]=c[q-8>>2]|0}else if((t|0)==20){c[g>>2]=cr()|0;cs(c[g>>2]|0,c[q>>2]|0)}else if((t|0)==21){c[g>>2]=c[q-16>>2]|0;cs(c[g>>2]|0,c[q>>2]|0)}q=q+(-m<<3)|0;p=p+(-m<<1)|0;m=0;t=q+8|0;q=t;w=t;t=g;c[w>>2]=c[t>>2]|0;c[w+4>>2]=c[t+4>>2]|0;r=d[r+400|0]|0;n=(a[424+(r-17|0)|0]|0)+(b[p>>1]|0)|0;do{if(0<=(n|0)){if(!((n|0)<=45)){s=97;break}if((a[n+552|0]|0|0)!=(b[p>>1]|0|0)){s=97;break}n=d[n+280|0]|0;break}else{s=97}}while(0);if((s|0)==97){s=0;n=a[496+(r-17|0)|0]|0}}else if((s|0)==99){s=0;if((o|0)==0){c[120]=(c[120]|0)+1|0;bZ(9376)}if((o|0)==3){if((c[150]|0)<=0){if((c[150]|0)==0){s=104;break}}else{bO(9112,h,488);c[150]=-2}}o=3;L128:while(1){r=a[n+432|0]|0;if((r|0)!=-5){r=r+1|0;do{if(0<=(r|0)){if(!((r|0)<=45)){break}if((a[r+552|0]|0|0)!=1){break}r=d[r+280|0]|0;if(0<(r|0)){break L128}}}while(0)}if((p|0)==(j|0)){s=119;break L26}bO(7408,d[n+328|0]|0,q);q=q-8|0;p=p-2|0;n=b[p>>1]|0}if((r|0)==15){s=122;break}t=q+8|0;q=t;w=t;c[w>>2]=c[122]|0;c[w+4>>2]=c[123]|0;n=r}p=p+2|0}do{if((s|0)==27){s=126;break}else if((s|0)==31){s=126;break}else if((s|0)==39){s=125;break}else if((s|0)==62){s=124;break}else if((s|0)==104){s=125;break}else if((s|0)==119){s=125;break}else if((s|0)==122){s=124;break}}while(0);if((s|0)==124){x=0}else if((s|0)==125){x=1}else if((s|0)==126){bZ(6576);x=2}do{if((c[150]|0)!=0){if((c[150]|0)==-2){break}bO(5920,h,488)}}while(0);q=q+(-m<<3)|0;p=p+(-m<<1)|0;while(1){if((p|0)==(j|0)){break}bO(5488,d[328+(b[p>>1]|0)|0]|0,q);q=q-8|0;p=p-2|0}if((j|0)==(f|0)){y=x;i=e;return y|0}uu(j);y=x;i=e;return y|0}function bO(a,b,c){a=a|0;b=b|0;c=c|0;c=a;if((c|0)==0){c=6160}return}function bP(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=f+8|0;c[g>>2]=a;c[g+4>>2]=b;c[h>>2]=d;c[h+4>>2]=e;if((c[h>>2]|0)==0&(c[h+4>>2]|0)==0){e=c[g+4>>2]|0;d=c[h>>2]|0;b=c[h+4>>2]|0;bL(5304,(w=i,i=i+32|0,c[w>>2]=c[g>>2]|0,c[w+8>>2]=e,c[w+16>>2]=d,c[w+24>>2]=b,w)|0)}else{b=c[h+4>>2]|0;d=0;if(b>>>0>d>>>0|b>>>0==d>>>0&(c[h>>2]|0)>>>0>64>>>0){d=c[g+4>>2]|0;b=c[h>>2]|0;e=c[h+4>>2]|0;bL(5096,(w=i,i=i+32|0,c[w>>2]=c[g>>2]|0,c[w+8>>2]=d,c[w+16>>2]=b,c[w+24>>2]=e,w)|0)}}e=uq(16)|0;b=c[g+4>>2]|0;d=e|0;c[d>>2]=c[g>>2]|0;c[d+4>>2]=b;c[e+8>>2]=c[h>>2]|0;i=f;return e|0}function bQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;c[e>>2]=a;c[e+4>>2]=b;b=uq(16)|0;a=c[e+4>>2]|0;f=b|0;c[f>>2]=c[e>>2]|0;c[f+4>>2]=a;c[b+8>>2]=0;i=d;return b|0}function bR(a){a=a|0;var b=0;b=uq(12)|0;c[b>>2]=1;c[b+4>>2]=a;c[b+8>>2]=cr()|0;return b|0}function bS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=uq(12)|0;c[e>>2]=a;c[e+4>>2]=0;c[e+8>>2]=cr()|0;cs(c[e+8>>2]|0,b);cs(c[e+8>>2]|0,d);return e|0}function bT(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((e|0)<1){bL(4488,(w=i,i=i+8|0,c[w>>2]=e,w)|0)}else{if((e|0)>(c[a+4>>2]|0)){b=c[a+4>>2]|0;bL(4264,(w=i,i=i+16|0,c[w>>2]=e,c[w+8>>2]=b,w)|0)}else{if((c[a+4>>2]|0)==1){bL(9224,(w=i,i=i+8|0,c[w>>2]=e,w)|0)}}}b=uq(12)|0;c[b>>2]=e;c[b+4>>2]=0;c[b+8>>2]=a;i=d;return b|0}function bU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=b;if((c[g+8>>2]|0)==0){b=a;h=g|0;j=c[h>>2]|0;k=c[h+4>>2]|0;h=9176;a2(e|0,h|0,(w=i,i=i+24|0,c[w>>2]=b,c[w+8>>2]=j,c[w+16>>2]=k,w)|0);k=bR(c[e>>2]|0)|0;e=k;i=d;return e|0}else{j=a;a=c[g+8>>2]|0;b=g|0;g=c[b>>2]|0;h=c[b+4>>2]|0;b=8784;a2(f|0,b|0,(w=i,i=i+32|0,c[w>>2]=j,c[w+8>>2]=a,c[w+16>>2]=g,c[w+24>>2]=h,w)|0);k=bR(c[f>>2]|0)|0;e=k;i=d;return e|0}return 0}function bV(a,b){a=a|0;b=b|0;return b2(a,0,b)|0}function bW(a,b){a=a|0;b=b|0;return b2(a,1,b)|0}function bX(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=d|0;e=uO(c[a>>2]|0,c[a+4>>2]|0,1,0)|0;c[a>>2]=e;c[a+4>>2]=F;return b2(d,0,b)|0}function bY(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=d|0;e=uO(c[a>>2]|0,c[a+4>>2]|0,-1,-1)|0;c[a>>2]=e;c[a+4>>2]=F;return b2(d,1,b)|0}function bZ(a){a=a|0;var b=0;b=i;bL(6736,(w=i,i=i+8|0,c[w>>2]=a,w)|0);i=b;return}function b_(a){a=a|0;var b=0;b=a;if((c[b+4>>2]|0)!=0){uu(c[b+4>>2]|0)}a=0;while(1){if((a|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}b_(cv(c[b+8>>2]|0,a)|0);a=a+1|0}cu(c[b+8>>2]|0,1);uu(b);return}function b$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=d;d=uq(64-h|0)|0;uI(d|0,0,64-h|0);uI(d|0,120,(64-h|0)-1|0);j=uq(h+1|0)|0;uI(j|0,0,h+1|0);uI(j|0,120,h|0);a2(g|0,b|0,(w=i,i=i+32|0,c[w>>2]=a,c[w+8>>2]=d,c[w+16>>2]=(e<<24>>24!=0^1^1)&1,c[w+24>>2]=j,w)|0);uu(d);uu(j);i=f;return c[g>>2]|0}function b0(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+8|0;j=h|0;k=a;a=b;b=d;d=e;c[j>>2]=f;c[j+4>>2]=g;g=0;while(1){if((k|0)!=0){f=uQ(1,0,g|0)|0;e=F;l=e&c[j+4>>2];m=f&c[j>>2]}else{f=uQ(1,0,g|0)|0;e=F;n=(((f&c[j>>2]|0)!=0|(e&c[j+4>>2]|0)!=0)^1)&1;l=(n|0)<0?-1:0;m=n}if(!((m|0)!=0|(l|0)!=0)){break}g=g+1|0}l=bR(b$(a,b,g,k&255)|0)|0;g=g+1|0;while(1){if((g|0)>=(d|0)){break}if((k|0)!=0){m=uQ(1,0,g|0)|0;n=F;e=(m&c[j>>2]|0)!=0|(n&c[j+4>>2]|0)!=0?2:1;l=bS(e,l,bR(b$(a,b,g,k&255)|0)|0)|0}else{e=uQ(1,0,g|0)|0;n=F;m=(e&c[j>>2]|0)!=0|(n&c[j+4>>2]|0)!=0?1:2;l=bS(m,l,bR(b$(a,b,g,k&255)|0)|0)|0}g=g+1|0}i=h;return l|0}function b1(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;i=i+16|0;g=f|0;h=f+8|0;j=a;a=b;c[g>>2]=d;c[g+4>>2]=e;e=uq(12)|0;c[e+4>>2]=0;c[e+8>>2]=cr()|0;d=2;while(1){if(!((d|0)<=32)){break}do{if((j|0)!=0){b=uQ(1,0,d|0)|0;k=F;l=c[g+4>>2]|0;if(k>>>0>l>>>0|k>>>0==l>>>0&b>>>0>(c[g>>2]|0)>>>0){m=200;break}else{m=198;break}}else{m=198}}while(0);do{if((m|0)==198){m=0;if((j|0)!=0){break}b=uQ(1,0,d|0)|0;l=F;k=c[g+4>>2]|0;if(l>>>0>=k>>>0&(l>>>0>k>>>0|b>>>0>=(c[g>>2]|0)>>>0)){m=200;break}else{break}}}while(0);if((m|0)==200){m=0;b=(j|0)!=0?8488:8360;k=a;l=d;a2(h|0,b|0,(w=i,i=i+16|0,c[w>>2]=k,c[w+8>>2]=l,w)|0);l=c[e+8>>2]|0;cs(l,bR(c[h>>2]|0)|0)}d=d<<1}if((j|0)!=0){n=1}else{n=c[(c[e+8>>2]|0)+4>>2]|0}c[e>>2]=n;if((c[(c[e+8>>2]|0)+4>>2]|0)==0){b_(e);e=0;o=e;i=f;return o|0}if((c[(c[e+8>>2]|0)+4>>2]|0)==1){n=cw(c[e+8>>2]|0,0)|0;b_(e);e=n}o=e;i=f;return o|0}function b2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;do{if((a|0)!=0){d=g|0;h=c[d>>2]|0;j=c[d+4>>2]|0;if((c[g+8>>2]|0)!=0){k=c[g+8>>2]|0}else{k=64}d=uQ(1,0,k|0)|0;l=F;m=uP(d,l,1,0)|0;l=F;if(!(j>>>0>=l>>>0&(j>>>0>l>>>0|h>>>0>=m>>>0))){n=223;break}m=g|0;h=c[m>>2]|0;l=c[m+4>>2]|0;if((c[g+8>>2]|0)!=0){o=c[g+8>>2]|0}else{o=64}bL(8040,(w=i,i=i+32|0,c[w>>2]=b,c[w+8>>2]=h,c[w+16>>2]=l,c[w+24>>2]=o,w)|0);break}else{n=223}}while(0);if((n|0)==223){do{if((a|0)!=0){n=226}else{o=g|0;if(!((c[o>>2]|0)==0&(c[o+4>>2]|0)==0)){n=226;break}bL(7792,(w=i,i=i+8|0,c[w>>2]=b,w)|0);break}}while(0);if((n|0)==226){do{if((a|0)==0){n=g|0;o=c[n>>2]|0;k=c[n+4>>2]|0;if((c[g+8>>2]|0)!=0){p=c[g+8>>2]|0}else{p=64}n=uQ(1,0,p|0)|0;l=F;h=uP(n,l,1,0)|0;l=F;if(!(k>>>0>l>>>0|k>>>0==l>>>0&o>>>0>h>>>0)){break}h=g|0;o=c[h>>2]|0;l=c[h+4>>2]|0;if((c[g+8>>2]|0)!=0){q=c[g+8>>2]|0}else{q=64}bL(7656,(w=i,i=i+32|0,c[w>>2]=b,c[w+8>>2]=o,c[w+16>>2]=l,c[w+24>>2]=q,w)|0)}}while(0)}}if((c[g+8>>2]|0)!=0){q=c[g+8>>2]|0;a2(f|0,7536,(w=i,i=i+8|0,c[w>>2]=q,w)|0)}else{c[f>>2]=aZ(7512)|0}q=a;p=b;l=c[f>>2]|0;if((c[g+8>>2]|0)!=0){r=c[g+8>>2]|0}else{o=g|0;h=c[o+4>>2]|0;k=1;if(h>>>0>=k>>>0&(h>>>0>k>>>0|(c[o>>2]|0)>>>0>=0>>>0)){s=64}else{o=g|0;k=c[o+4>>2]|0;h=0;if(k>>>0>=h>>>0&(k>>>0>h>>>0|(c[o>>2]|0)>>>0>=65536>>>0)){t=32}else{o=g|0;h=c[o+4>>2]|0;k=0;if(h>>>0>=k>>>0&(h>>>0>k>>>0|(c[o>>2]|0)>>>0>=256>>>0)){u=16}else{o=g|0;k=c[o+4>>2]|0;h=0;if(k>>>0>=h>>>0&(k>>>0>h>>>0|(c[o>>2]|0)>>>0>=16>>>0)){v=8}else{o=g|0;h=c[o+4>>2]|0;k=0;v=h>>>0>=k>>>0&(h>>>0>k>>>0|(c[o>>2]|0)>>>0>=4>>>0)?4:2}u=v}t=u}s=t}r=s}s=g|0;t=b0(q,p,l,r,c[s>>2]|0,c[s+4>>2]|0)|0;uu(c[f>>2]|0);if((c[g+8>>2]|0)!=0){x=t;i=e;return x|0}f=g|0;g=b1(a,b,c[f>>2]|0,c[f+4>>2]|0)|0;if((g|0)!=0){t=bS((a|0)!=0?1:2,g,t)|0}x=t;i=e;return x|0}function b3(){var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0;b=i;i=i+40|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=b+32|0;while(1){if((a[c[976]|0]|0|0)!=0){j=c[976]|0;c[976]=j+1|0;k=a[j]|0}else{k=-1}c[d>>2]=k;if((a_(k|0)|0)==0){break}}k=0;if((c[d>>2]|0)==-1){k=0;l=k;i=b;return l|0}if((c[d>>2]|0)==38){k=261}else{if((c[d>>2]|0)==124){k=260}else{do{if((aL(7488,c[d>>2]|0)|0)!=0){m=280}else{if((aL(7464,c[d>>2]|0)|0)!=0){if((a[c[976]|0]|0|0)!=0){n=a[c[976]|0]|0}else{n=-1}if((n|0)!=61){m=280;break}}do{if((c[d>>2]|0)==60){if((a[c[976]|0]|0|0)!=0){o=a[c[976]|0]|0}else{o=-1}if((o|0)!=61){m=290;break}if((a[c[976]|0]|0|0)!=0){j=c[976]|0;c[976]=j+1|0;p=a[j]|0}else{p=-1}k=263;break}else{m=290}}while(0);if((m|0)==290){do{if((c[d>>2]|0)==62){if((a[c[976]|0]|0|0)!=0){q=a[c[976]|0]|0}else{q=-1}if((q|0)!=61){m=299;break}if((a[c[976]|0]|0|0)!=0){p=c[976]|0;c[976]=p+1|0;j=a[p]|0}else{j=-1}k=264;break}else{m=299}}while(0);if((m|0)==299){if((aG(c[d>>2]|0)|0)!=0){j=co()|0;cq(j,d,1);while(1){if((a[c[976]|0]|0|0)!=0){r=a[c[976]|0]|0}else{r=-1}if((aG(r|0)|0)==0){break}if((a[c[976]|0]|0|0)!=0){p=c[976]|0;c[976]=p+1|0;s=a[p]|0}else{s=-1}a[e]=s&255;cq(j,e,1)}a[f]=0;cq(j,f,1);ax(c[j>>2]|0,7224,(w=i,i=i+8|0,c[w>>2]=488,w)|0);cp(j,1);k=259}else{do{if((aW(c[d>>2]|0)|0)!=0){m=312}else{if((c[d>>2]|0)==64){m=312;break}p=c[976]|0;bL(6840,(w=i,i=i+16|0,c[w>>2]=c[d>>2]|0,c[w+8>>2]=p,w)|0);break}}while(0);if((m|0)==312){j=co(7080)|0;cq(j,d,1);while(1){if((a[c[976]|0]|0|0)!=0){t=a[c[976]|0]|0}else{t=-1}do{if((a9(t|0)|0)!=0){u=1}else{if((a[c[976]|0]|0|0)!=0){v=a[c[976]|0]|0}else{v=-1}if((v|0)==95){u=1;break}if((a[c[976]|0]|0|0)!=0){x=a[c[976]|0]|0}else{x=-1}u=(x|0)==64}}while(0);if(!u){break}if((a[c[976]|0]|0|0)!=0){p=c[976]|0;c[976]=p+1|0;y=a[p]|0}else{y=-1}a[g]=y&255;cq(j,g,1)}a[h]=0;cq(j,h,1);if((bh(c[j>>2]|0,7e3)|0)!=0){if((bh(c[j>>2]|0,6944)|0)!=0){if((bh(c[j>>2]|0,6896)|0)!=0){c[122]=c[j>>2]|0;cp(j,0);k=258}else{cp(j,1);k=262}}else{cp(j,1);k=260}}else{cp(j,1);k=261}}}}}break}}while(0);if((m|0)==280){k=c[d>>2]|0}}}l=k;i=b;return l|0}function b4(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=cv(c[d+8>>2]|0,a)|0;if((c[d>>2]|0)==(c[(c[d+8>>2]|0)+4>>2]|0)){e=d|0;c[e>>2]=(c[e>>2]|0)+(c[b>>2]|0)|0;e=d|0;c[e>>2]=(c[e>>2]|0)-1|0}cw(c[d+8>>2]|0,a);a=0;while(1){if((a|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}e=c[d+8>>2]|0;cs(e,cv(c[b+8>>2]|0,a)|0);a=a+1|0}cu(c[b+8>>2]|0,0);uu(b);return}function b5(a){a=a|0;var b=0,d=0;b=a;a=0;while(1){if((a|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}b5(cv(c[b+8>>2]|0,a)|0);a=a+1|0}do{if((c[b>>2]|0)==1){if((c[(c[b+8>>2]|0)+4>>2]|0)==0){break}a=0;while(1){if((a|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}do{if((c[cv(c[b+8>>2]|0,a)>>2]|0)==1){if((c[(c[(cv(c[b+8>>2]|0,a)|0)+8>>2]|0)+4>>2]|0)==0){break}b4(b,a)}}while(0);a=a+1|0}}}while(0);if((c[b>>2]|0)!=(c[(c[b+8>>2]|0)+4>>2]|0)){return}a=0;while(1){if((a|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}d=c[cv(c[b+8>>2]|0,a)>>2]|0;if((d|0)==(c[(c[(cv(c[b+8>>2]|0,a)|0)+8>>2]|0)+4>>2]|0)){b4(b,a)}a=a+1|0}return}function b6(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=c[a>>2]|0;a=c[b>>2]|0;do{if((c[(c[d+8>>2]|0)+4>>2]|0)>0){if((c[(c[a+8>>2]|0)+4>>2]|0)!=0){break}e=-1;f=e;return f|0}}while(0);do{if((c[(c[d+8>>2]|0)+4>>2]|0)==0){if((c[(c[a+8>>2]|0)+4>>2]|0)<=0){break}e=1;f=e;return f|0}}while(0);do{if((c[(c[d+8>>2]|0)+4>>2]|0)==0){if((c[(c[a+8>>2]|0)+4>>2]|0)!=0){break}e=bh(c[d+4>>2]|0,c[a+4>>2]|0)|0;f=e;return f|0}}while(0);e=0;f=e;return f|0}function b7(a){a=a|0;var b=0;b=a;a=0;while(1){if((a|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}b7(cv(c[b+8>>2]|0,a)|0);a=a+1|0}if((c[(c[b+8>>2]|0)+4>>2]|0)<=0){return}aT(c[c[b+8>>2]>>2]|0,c[(c[b+8>>2]|0)+4>>2]|0,4,48);return}function b8(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;i=i+8|0;d=b|0;e=a;if((c[(c[e+8>>2]|0)+4>>2]|0)==0){f=aZ(c[e+4>>2]|0)|0;g=f;i=b;return g|0}a=b8(cv(c[e+8>>2]|0,0)|0)|0;h=1;while(1){if((h|0)>=(c[(c[e+8>>2]|0)+4>>2]|0)){break}j=b8(cv(c[e+8>>2]|0,h)|0)|0;a2(d|0,6720,(w=i,i=i+16|0,c[w>>2]=a,c[w+8>>2]=j,w)|0);uu(a);uu(j);a=c[d>>2]|0;h=h+1|0}h=c[e>>2]|0;j=c[(c[e+8>>2]|0)+4>>2]|0;a2(d|0,6704,(w=i,i=i+24|0,c[w>>2]=a,c[w+8>>2]=h,c[w+16>>2]=j,w)|0);uu(a);f=c[d>>2]|0;g=f;i=b;return g|0}function b9(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[d>>2]|0;return a+ab(c[d+12>>2]|0,b)|0}function ca(a){a=a|0;var b=0,d=0,e=0;b=a;a=0;if((b|0)==0){d=0;e=d;return e|0}a=a+1|0;while(1){if((c[b+4>>2]|0)==0){break}a=a+1|0;b=c[b+4>>2]|0}d=a;e=d;return e|0}function cb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=i;i=i+48|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+32|0;k=d+40|0;l=a;a=b;if((aL(a|0,61)|0)==0){c[l>>2]=cy(c[l>>2]|0,a)|0;i=d;return}b=uq(uJ(a|0)|0)|0;if((ax(a|0,6680,(w=i,i=i+24|0,c[w>>2]=b,c[w+8>>2]=f,c[w+16>>2]=g,w)|0)|0)==3){if((c[g>>2]|0)>64){m=c[f>>2]|0;n=c[f+4>>2]|0;o=c[g>>2]|0;bL(6488,(w=i,i=i+32|0,c[w>>2]=a,c[w+8>>2]=m,c[w+16>>2]=n,c[w+24>>2]=o,w)|0)}o=c[f>>2]|0;n=c[f+4>>2]|0;m=uQ(1,0,c[g>>2]|0)|0;p=F;if(n>>>0>=p>>>0&(n>>>0>p>>>0|o>>>0>=m>>>0)){m=c[f>>2]|0;o=c[f+4>>2]|0;p=c[g>>2]|0;bL(6376,(w=i,i=i+32|0,c[w>>2]=a,c[w+8>>2]=m,c[w+16>>2]=o,c[w+24>>2]=p,w)|0)}a2(e|0,7536,(w=i,i=i+8|0,c[w>>2]=c[g>>2]|0,w)|0);p=0;while(1){if((p|0)>=(c[g>>2]|0)){break}o=c[l>>2]|0;m=c[e>>2]|0;n=uQ(1,0,p|0)|0;q=F;c[l>>2]=cy(o,b$(b,m,p,(((n&c[f>>2]|0)!=0|(q&c[f+4>>2]|0)!=0)^1^1)&1)|0)|0;p=p+1|0}uu(c[e>>2]|0);e=c[g>>2]|0;g=c[f>>2]|0;q=c[f+4>>2]|0;a2(h|0,8784,(w=i,i=i+32|0,c[w>>2]=b,c[w+8>>2]=e,c[w+16>>2]=g,c[w+24>>2]=q,w)|0);c[l>>2]=cy(c[l>>2]|0,c[h>>2]|0)|0}else{if((ax(a|0,6312,(w=i,i=i+16|0,c[w>>2]=b,c[w+8>>2]=f,w)|0)|0)==2){p=2;while(1){if(!((p|0)<=32)){break}h=c[f>>2]|0;q=c[f+4>>2]|0;g=uQ(1,0,p|0)|0;e=F;a2(j|0,(q>>>0<e>>>0|q>>>0==e>>>0&h>>>0<g>>>0?8360:8488)|0,(w=i,i=i+16|0,c[w>>2]=b,c[w+8>>2]=p,w)|0);c[l>>2]=cy(c[l>>2]|0,c[j>>2]|0)|0;p=p<<1}p=0;while(1){if((p|0)>=64){break}j=c[l>>2]|0;g=uQ(1,0,p|0)|0;h=F;c[l>>2]=cy(j,b$(b,7512,p,(((g&c[f>>2]|0)!=0|(h&c[f+4>>2]|0)!=0)^1^1)&1)|0)|0;p=p+1|0}p=c[f>>2]|0;h=c[f+4>>2]|0;a2(k|0,9176,(w=i,i=i+24|0,c[w>>2]=b,c[w+8>>2]=p,c[w+16>>2]=h,w)|0);c[l>>2]=cy(c[l>>2]|0,c[k>>2]|0)|0}else{bL(6176,(w=i,i=i+8|0,c[w>>2]=a,w)|0)}}uu(b);i=d;return}function cc(a){a=a|0;c[976]=a;bN();b5(c[332]|0);b7(c[332]|0);a=b8(c[332]|0)|0;b_(c[332]|0);return a|0}function cd(a){a=a|0;return ce(a,16)|0}function ce(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=uq(16)|0;c[b+12>>2]=d;c[b+4>>2]=0;c[b+8>>2]=a;c[b>>2]=uq(ab(a,d))|0;e=c[b>>2]|0;uI(e|0,0,ab(a,d)|0);return b|0}function cf(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;while(1){if((c[d+8>>2]|0)>=(a|0)){break}b=c[d>>2]|0;e=uq(ab(c[d+8>>2]<<1,c[d+12>>2]|0))|0;uI(e|0,0,ab(c[d+8>>2]<<1,c[d+12>>2]|0)|0);uK(e|0,b|0,ab(c[d+4>>2]|0,c[d+12>>2]|0));uu(b);c[d>>2]=e;c[d+8>>2]=c[d+8>>2]<<1}return}function cg(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;cf(d,(c[d+4>>2]|0)+1|0);a=c[d>>2]|0;e=a+ab(c[d+12>>2]|0,c[d+4>>2]|0)|0;uK(e|0,b|0,c[d+12>>2]|0);b=d+4|0;c[b>>2]=(c[b>>2]|0)+1|0;return}function ch(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=d;cf(e,(c[e+4>>2]|0)+a|0);d=c[e>>2]|0;f=d+ab(c[e+12>>2]|0,c[e+4>>2]|0)|0;uK(f|0,b|0,ab(a,c[e+12>>2]|0));b=e+4|0;c[b>>2]=(c[b>>2]|0)+a|0;return}function ci(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;cf(e,a);b=c[e>>2]|0;f=b+ab(c[e+12>>2]|0,a)|0;uK(f|0,d|0,c[e+12>>2]|0);if((a+1|0)<=(c[e+4>>2]|0)){return}c[e+4>>2]=a+1|0;return}function cj(a,b){a=a|0;b=b|0;var d=0;d=a;if((b|0)!=0){uu(c[d>>2]|0)}uu(d);return}function ck(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;if((a|0)>=(c[d+4>>2]|0)){b=0;e=b;return e|0}else{f=c[d>>2]|0;g=c[f+ab(c[d+12>>2]|0,a)>>2]|0;f=c[d>>2]|0;h=f+ab(c[d+12>>2]|0,a)|0;f=c[d>>2]|0;i=f+ab(c[d+12>>2]|0,a+1|0)|0;uL(h|0,i|0,ab(((c[d+4>>2]|0)-a|0)-1|0,c[d+12>>2]|0)|0);a=d+4|0;c[a>>2]=(c[a>>2]|0)-1|0;a=c[d>>2]|0;i=a+ab(c[d+12>>2]|0,c[d+4>>2]|0)|0;uI(i|0,0,c[d+12>>2]|0);b=g;e=b;return e|0}return 0}function cl(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;if((a|0)<(c[d+4>>2]|0)){b=c[d>>2]|0;e=b+ab(c[d+12>>2]|0,a)|0;uI(e|0,0,ab((c[d+4>>2]|0)-a|0,c[d+12>>2]|0)|0);c[d+4>>2]=a;return}else{cf(d,a);e=c[d>>2]|0;b=e+ab(c[d+12>>2]|0,c[d+4>>2]|0)|0;uI(b|0,0,ab(a-(c[d+4>>2]|0)|0,c[d+12>>2]|0)|0);c[d+4>>2]=a;return}}function cm(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+8|0;d=b|0;e=a;c[d>>2]=0;a=c[e>>2]|0;ul(0,d,a,ab(c[e+4>>2]|0,c[e+12>>2]|0));a=uq(c[d>>2]|0)|0;f=c[e>>2]|0;ul(a,d,f,ab(c[e+4>>2]|0,c[e+12>>2]|0));i=b;return a|0}function cn(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+8|0;d=b|0;e=a;c[d>>2]=0;um(0,d,e,uJ(e|0)|0);a=ce(1,c[d>>2]|0)|0;f=c[a>>2]|0;um(f,d,e,uJ(e|0)|0);c[a+4>>2]=c[d>>2]|0;i=b;return a|0}function co(){return cd(1)|0}function cp(a,b){a=a|0;b=b|0;cj(a,b);return}function cq(a,b,c){a=a|0;b=b|0;c=c|0;ch(a,b,c);return}function cr(){return cd(4)|0}function cs(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+8|0;e=d|0;c[e>>2]=b;cg(a,e);i=d;return}function ct(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+8|0;f=e|0;c[f>>2]=d;ci(a,b,f);i=e;return}function cu(a,b){a=a|0;b=b|0;cj(a,b);return}function cv(a,b){a=a|0;b=b|0;return c[b9(a,b)>>2]|0}function cw(a,b){a=a|0;b=b|0;return ck(a,b)|0}function cx(a,b){a=a|0;b=b|0;cl(a,b);return}function cy(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=uq(8)|0;c[a+4>>2]=0;c[a>>2]=b;if((d|0)==0){e=a;f=e;return f|0}b=d;while(1){if((c[d+4>>2]|0)==0){break}d=c[d+4>>2]|0}c[d+4>>2]=a;e=b;f=e;return f|0}function cz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=e;c[f>>2]=b;c[f+4>>2]=0;az(1016,256,a|0,c[e>>2]|0);i=d;return}function cA(a,b){a=a|0;b=b|0;var c=0,d=0,e=0;c=i;i=i+24|0;d=c|0;e=b;up(e,uJ(e|0)|0,d|0);cB(a,d|0,20);i=c;return}function cB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+132>>2]&1023](e,b,d);return}function cC(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;f=a;a=b;c[f>>2]=uq(544)|0;c[a>>2]=uq(16)|0;b=aZ(4600)|0;c[c[f>>2]>>2]=b;b=(c[f>>2]|0)+4|0;g=c[c[f>>2]>>2]|0;p4(b,g,uJ(c[c[f>>2]>>2]|0)|0);cD((c[f>>2]|0)+512|0,(c[f>>2]|0)+4|0);cD((c[f>>2]|0)+520|0,(c[f>>2]|0)+4|0);cE((c[f>>2]|0)+528|0,(c[f>>2]|0)+4|0);cF((c[f>>2]|0)+536|0,(c[f>>2]|0)+4|0);cG(e|0,(c[f>>2]|0)+4|0);cG(c[a>>2]|0,(c[f>>2]|0)+4|0);cE((c[a>>2]|0)+8|0,(c[f>>2]|0)+4|0);cH(e|0);cH(c[a>>2]|0);cH((c[f>>2]|0)+512|0);cH((c[f>>2]|0)+528|0);cI((c[a>>2]|0)+8|0,(c[f>>2]|0)+528|0,e|0);cI((c[f>>2]|0)+520|0,(c[f>>2]|0)+512|0,c[a>>2]|0);cJ((c[f>>2]|0)+536|0,(c[f>>2]|0)+512|0,(c[a>>2]|0)+8|0,(c[f>>2]|0)+4|0);i=d;return}function cD(a,b){a=a|0;b=b|0;c8(a,c[b+228>>2]|0);return}function cE(a,b){a=a|0;b=b|0;c8(a,c[b+232>>2]|0);return}function cF(a,b){a=a|0;b=b|0;c8(a,b+236|0);return}function cG(a,b){a=a|0;b=b|0;c8(a,b+12|0);return}function cH(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+128>>2]&1023](b);return}function cI(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=d|0;d3(e|0);da(e|0,c);db(a,b,e|0);dU(e|0);i=d;return}function cJ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=b;b=d;d=e;if((c9(a)|0)!=0){cU(f);return}if((c9(b)|0)!=0){cU(f);return}else{bs[c[d+468>>2]&1023](c[f+4>>2]|0,a,b,d);return}}function cK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+80|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+64|0;l=e+72|0;m=a;a=b;b=d;d=uq(12)|0;cE(d|0,m+4|0);cE(f|0,m+4|0);cG(g|0,m+4|0);cG(h|0,m+4|0);c[d+8>>2]=cd(40)|0;cH(g|0);cI(f|0,m+528|0,g|0);cL(d|0,a+8|0,f|0);cM(h|0,a|0);cI(d|0,d|0,h|0);while(1){if((c[b>>2]|0)==0){break}h=b;b=h+4|0;c[j>>2]=c[h>>2]|0;cE(j+4|0,m+4|0);cD(j+12|0,m+4|0);cE(k|0,m+4|0);cG(l|0,m+4|0);cA(k|0,c[j>>2]|0);cH(l|0);cI(k|0,k|0,l|0);cL(j+4|0,f|0,k|0);cI(j+12|0,m+512|0,l|0);cN(k|0);cN(l|0);cg(c[d+8>>2]|0,j)}i=e;return d|0}function cL(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function cM(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function cN(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function cO(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=uq(48)|0;c[b>>2]=a;if((d|0)!=0){e=aZ(d|0)|0}else{e=0}c[b+4>>2]=e;c[b+24>>2]=cr()|0;c[b+28>>2]=0;return b|0}function cP(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=b;b=uq((uJ(g|0)|0)+1|0)|0;uM(b|0,g|0);h=aP(b|0,7568)|0;j=cr()|0;while(1){if((h|0)==0){k=558;break}if((a[h]|0)==0){h=aP(0,7568)|0;continue}if((ax(h|0,6728,(w=i,i=i+16|0,c[w>>2]=e,c[w+8>>2]=f,w)|0)|0)!=2){cs(j,cO(1,h)|0)}else{if((c[e>>2]|0)<1){k=542;break}if((c[e>>2]|0)>(c[f>>2]|0)){k=544;break}if((c[f>>2]|0)==1){k=546;break}if((c[f>>2]|0)>(c[j+4>>2]|0)){k=548;break}l=cO(c[e>>2]|0,0)|0;cx(c[l+24>>2]|0,c[f>>2]|0);m=(c[f>>2]|0)-1|0;while(1){if(!((m|0)>=0)){break}n=c[l+24>>2]|0;ct(n,m,cv(j,(c[j+4>>2]|0)-1|0)|0);cw(j,(c[j+4>>2]|0)-1|0);m=m-1|0}cs(j,l)}h=aP(0,7568)|0}if((k|0)==548){cz(5160,(w=i,i=i+16|0,c[w>>2]=g,c[w+8>>2]=h,w)|0);f=0;e=f;i=d;return e|0}else if((k|0)==558){if((c[j+4>>2]|0)>1){cz(4552,(w=i,i=i+8|0,c[w>>2]=g,w)|0);f=0;e=f;i=d;return e|0}if((c[j+4>>2]|0)<1){cz(4336,(w=i,i=i+8|0,c[w>>2]=g,w)|0);f=0;e=f;i=d;return e|0}uu(b);b=cv(j,0)|0;cu(j,0);f=b;e=f;i=d;return e|0}else if((k|0)==546){cz(5360,(w=i,i=i+16|0,c[w>>2]=g,c[w+8>>2]=h,w)|0);f=0;e=f;i=d;return e|0}else if((k|0)==542){cz(6032,(w=i,i=i+16|0,c[w>>2]=g,c[w+8>>2]=h,w)|0);f=0;e=f;i=d;return e|0}else if((k|0)==544){cz(5616,(w=i,i=i+16|0,c[w>>2]=g,c[w+8>>2]=h,w)|0);f=0;e=f;i=d;return e|0}return 0}function cQ(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=uq(8)|0;c[b>>2]=d;c[b+4>>2]=uq(d+1<<3)|0;d=0;while(1){if((d|0)>=((c[b>>2]|0)+1|0)){break}cR((c[b+4>>2]|0)+(d<<3)|0,a);d=d+1|0}cS(c[b+4>>2]|0,a);d=1;while(1){if((d|0)>=((c[b>>2]|0)+1|0)){break}cH((c[b+4>>2]|0)+(d<<3)|0);d=d+1|0}return b|0}function cR(a,b){a=a|0;b=b|0;c8(a,c[b>>2]|0);return}function cS(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function cT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=a;a=b;b=d;cR(f|0,h);cR(g|0,h);cU(h);cV(g|0);d=0;while(1){if((d|0)>=((c[a>>2]|0)+1|0)){break}cL(f|0,(c[a+4>>2]|0)+(d<<3)|0,g|0);cW(h,h,f|0);cL(g|0,g|0,b);d=d+1|0}cN(f|0);cN(g|0);i=e;return}function cU(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function cV(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function cW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function cX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=b;cG(f|0,a+4|0);cG(g|0,a+4|0);cE(h|0,a+4|0);c[j+28>>2]=cQ((c[j>>2]|0)-1|0,d)|0;if((c[(c[j+24>>2]|0)+4>>2]|0)==0){cD(j+8|0,a+4|0);cE(j+16|0,a+4|0);cA(h|0,c[j+4>>2]|0);cI(j+8|0,a+512|0,c[(c[j+28>>2]|0)+4>>2]|0);cI(j+16|0,h|0,c[(c[j+28>>2]|0)+4>>2]|0);k=f|0;cN(k);l=g|0;cN(l);m=h|0;cN(m);i=e;return}d=0;while(1){if((d|0)>=(c[(c[j+24>>2]|0)+4>>2]|0)){break}cY(f|0,d+1|0);cT(g|0,c[j+28>>2]|0,f|0);cX(cv(c[j+24>>2]|0,d)|0,a,g|0);d=d+1|0}k=f|0;cN(k);l=g|0;cN(l);m=h|0;cN(m);i=e;return}function cY(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function cZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=uq(20)|0;cG(f|0,g+4|0);cF(a,g+4|0);cF(b|0,g+4|0);cD(b+8|0,g+4|0);c[b+16>>2]=cP(d)|0;cH(a);cH(f|0);cI(b|0,g+536|0,f|0);cL(b|0,b|0,a);cI(b+8|0,g+520|0,f|0);cX(c[b+16>>2]|0,g,f|0);i=e;return b|0}function c_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;c[d+32>>2]=0;if((c[(c[d+24>>2]|0)+4>>2]|0)==0){e=0;while(1){if((e|0)>=(c[(c[a+8>>2]|0)+4>>2]|0)){break}b=c[b9(c[a+8>>2]|0,e)>>2]|0;if((bh(b|0,c[d+4>>2]|0)|0)==0){f=607;break}e=e+1|0}if((f|0)==607){c[d+32>>2]=1;c[d+40>>2]=e}return}e=0;while(1){if((e|0)>=(c[(c[d+24>>2]|0)+4>>2]|0)){break}c_(cv(c[d+24>>2]|0,e)|0,a);e=e+1|0}a=0;e=0;while(1){if((e|0)>=(c[(c[d+24>>2]|0)+4>>2]|0)){break}if((c[(cv(c[d+24>>2]|0,e)|0)+32>>2]|0)!=0){a=a+1|0}e=e+1|0}if((a|0)>=(c[d>>2]|0)){c[d+32>>2]=1}return}function c$(a,b){a=a|0;b=b|0;var d=0;d=c[(cv(c[(c[978]|0)+24>>2]|0,c[a>>2]|0)|0)+36>>2]|0;a=c[(cv(c[(c[978]|0)+24>>2]|0,c[b>>2]|0)|0)+36>>2]|0;if((d|0)<(a|0)){b=-1;return b|0}else{b=(d|0)==(a|0)?0:1;return b|0}return 0}function c0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=a;a=b;if((c[(c[f+24>>2]|0)+4>>2]|0)==0){c[f+36>>2]=1;i=d;return}b=0;while(1){if((b|0)>=(c[(c[f+24>>2]|0)+4>>2]|0)){break}if((c[(cv(c[f+24>>2]|0,b)|0)+32>>2]|0)!=0){c0(cv(c[f+24>>2]|0,b)|0,a)}b=b+1|0}a=i;i=i+(c[(c[f+24>>2]|0)+4>>2]<<2)|0;i=i+7>>3<<3;g=a;b=0;while(1){if((b|0)>=(c[(c[f+24>>2]|0)+4>>2]|0)){break}c[g+(b<<2)>>2]=b;b=b+1|0}c[978]=f;aT(g|0,c[(c[f+24>>2]|0)+4>>2]|0,4,328);c[f+44>>2]=cd(4)|0;c[f+36>>2]=0;a=0;b=0;while(1){if((b|0)<(c[(c[f+24>>2]|0)+4>>2]|0)){h=(a|0)<(c[f>>2]|0)}else{h=0}if(!h){break}if((c[(cv(c[f+24>>2]|0,c[g+(b<<2)>>2]|0)|0)+32>>2]|0)!=0){a=a+1|0;j=c[(cv(c[f+24>>2]|0,c[g+(b<<2)>>2]|0)|0)+36>>2]|0;k=f+36|0;c[k>>2]=(c[k>>2]|0)+j|0;c[e>>2]=(c[g+(b<<2)>>2]|0)+1|0;cg(c[f+44>>2]|0,e)}b=b+1|0}i=d;return}function c1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;cR(f|0,g);cV(g);d=0;while(1){if((d|0)>=(c[a+4>>2]|0)){break}h=c[b9(a,d)>>2]|0;if((h|0)!=(b|0)){cY(f|0,-h|0);cL(g,g,f|0);cY(f|0,b-h|0);cM(f|0,f|0);cL(g,g,f|0)}d=d+1|0}cN(f|0);i=e;return}function c2(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;i=i+16|0;h=g|0;j=g+8|0;k=a;a=d;d=f;f=b9(c[e+8>>2]|0,c[a+40>>2]|0)|0;cF(h|0,d+4|0);cF(j|0,d+4|0);cJ(h|0,a+8|0,f+4|0,d+4|0);cJ(j|0,a+16|0,f+12|0,d+4|0);cM(j|0,j|0);cL(h|0,h|0,j|0);cI(h|0,h|0,b);cL(k,k,h|0);cN(h|0);cN(j|0);i=g;return}function c3(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+16|0;h=g|0;j=g+8|0;k=a;a=b;b=d;d=e;e=f;cG(h|0,e+4|0);cG(j|0,e+4|0);f=0;while(1){if((f|0)>=(c[(c[b+44>>2]|0)+4>>2]|0)){break}l=c[b+44>>2]|0;c1(h|0,l,c[b9(c[b+44>>2]|0,f)>>2]|0);cL(j|0,a,h|0);l=c[b+24>>2]|0;c4(k,j|0,cv(l,(c[b9(c[b+44>>2]|0,f)>>2]|0)-1|0)|0,d,e);f=f+1|0}cN(h|0);cN(j|0);i=g;return}function c4(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=b;b=d;d=e;e=f;if((c[(c[b+24>>2]|0)+4>>2]|0)==0){c2(g,a,b,d,e);return}else{c3(g,a,b,d,e);return}}function c5(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;a=d;cG(f|0,a+4|0);cV(f|0);cV(g);c4(g,f|0,b,c,a);cN(f|0);i=e;return}function c6(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=0;f=3;while(1){if(!((f|0)>=0)){break}g=a;h=c[g>>2]|0;c[g>>2]=h+1|0;b=b|(d[(c[e>>2]|0)+h|0]|0)<<(f<<3);f=f-1|0}return b|0}function c7(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;cF(d,h+4|0);cF(g|0,h+4|0);c_(c[b+16>>2]|0,a);if((c[(c[b+16>>2]|0)+32>>2]|0)!=0){c0(c[b+16>>2]|0,a);c5(g|0,c[b+16>>2]|0,a,h);cL(d,b|0,g|0);cJ(g|0,b+8|0,a|0,h+4|0);cM(g|0,g|0);cL(d,d,g|0);g=1;d=g;i=f;return d|0}else{cz(4160,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);g=0;d=g;i=f;return d|0}return 0}function c8(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function c9(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+140>>2]&1023](b)|0}function da(a,b){a=a|0;b=b|0;var d=0;d=b;bl[c[(c[d>>2]|0)+172>>2]&1023](a,d);return}function db(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function dc(b,c){b=b|0;c=c|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=b;b=c;c=3;while(1){if(!((c|0)>=0)){break}a[e]=(b&255<<(c<<3))>>>(c<<3>>>0)&255;cq(f,e,1);c=c-1|0}i=d;return}function dd(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;b=de(a)|0;dc(c,b);d=uq(b)|0;df(d,a);cq(c,d,b);uu(d);return}function de(a){a=a|0;var b=0,d=0;b=a;if((c[(c[b>>2]|0)+164>>2]|0)<0){a=bm[c[(c[b>>2]|0)+160>>2]&1023](b)|0;d=a;return d|0}else{a=c[(c[b>>2]|0)+164>>2]|0;d=a;return d|0}return 0}function df(a,b){a=a|0;b=b|0;var d=0;d=b;return bq[c[(c[d>>2]|0)+152>>2]&1023](a,d)|0}function dg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=c6(e,a)|0;f=uq(b)|0;uK(f|0,(c[e>>2]|0)+(c[a>>2]|0)|0,b);e=a;c[e>>2]=(c[e>>2]|0)+b|0;dh(d,f);uu(f);return}function dh(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+156>>2]&1023](d,b)|0}function di(a,b){a=a|0;b=b|0;var c=0;c=b;cq(a,c,(uJ(c|0)|0)+1|0);return}function dj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+8|0;f=e|0;g=b;b=d;d=co()|0;while(1){h=b;j=c[h>>2]|0;c[h>>2]=j+1|0;a[f]=a[(c[g>>2]|0)+j|0]|0;if((a[f]|0|0)==0){break}if((a[f]|0|0)==-1){break}cq(d,f,1)}a[f]=0;cq(d,f,1);f=uq(c[d+4>>2]|0)|0;uK(f|0,c[d>>2]|0,c[d+4>>2]|0);cp(d,0);i=e;return f|0}function dk(a){a=a|0;var b=0;b=a;a=co()|0;di(a,c[b>>2]|0);dd(a,b+512|0);dd(a,b+520|0);dd(a,b+528|0);dd(a,b+536|0);return a|0}function dl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+8|0;e=d|0;f=a;a=uq(544)|0;c[e>>2]=0;c[a>>2]=dj(f,e)|0;g=c[a>>2]|0;p4(a+4|0,g,uJ(c[a>>2]|0)|0);dm(a+512|0,a+4|0);dm(a+520|0,a+4|0);dn(a+528|0,a+4|0);dp(a+536|0,a+4|0);dg(f,e,a+512|0);dg(f,e,a+520|0);dg(f,e,a+528|0);dg(f,e,a+536|0);if((b|0)==0){h=a;i=d;return h|0}cp(f,1);h=a;i=d;return h|0}function dm(a,b){a=a|0;b=b|0;dA(a,c[b+228>>2]|0);return}function dn(a,b){a=a|0;b=b|0;dA(a,c[b+232>>2]|0);return}function dp(a,b){a=a|0;b=b|0;dA(a,b+236|0);return}function dq(a){a=a|0;var b=0;b=a;a=co()|0;dd(a,b|0);dd(a,b+8|0);return a|0}function dr(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=uq(16)|0;c[f>>2]=0;ds(b|0,g+4|0);dn(b+8|0,g+4|0);dg(a,f,b|0);dg(a,f,b+8|0);if((d|0)==0){h=b;i=e;return h|0}cp(a,1);h=b;i=e;return h|0}function ds(a,b){a=a|0;b=b|0;dA(a,b+12|0);return}function dt(a){a=a|0;var b=0,d=0;b=a;a=co()|0;dd(a,b|0);dc(a,c[(c[b+8>>2]|0)+4>>2]|0);d=0;while(1){if((d|0)>=(c[(c[b+8>>2]|0)+4>>2]|0)){break}di(a,c[b9(c[b+8>>2]|0,d)>>2]|0);dd(a,(b9(c[b+8>>2]|0,d)|0)+4|0);dd(a,(b9(c[b+8>>2]|0,d)|0)+12|0);d=d+1|0}return a|0}function du(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+48|0;f=e|0;g=e+8|0;h=a;a=b;b=d;d=uq(12)|0;c[f>>2]=0;dn(d|0,h+4|0);dg(a,f,d|0);c[d+8>>2]=cd(40)|0;j=c6(a,f)|0;k=0;while(1){if((k|0)>=(j|0)){break}c[g>>2]=dj(a,f)|0;dn(g+4|0,h+4|0);dn(g+12|0,h+4|0);dg(a,f,g+4|0);dg(a,f,g+12|0);cg(c[d+8>>2]|0,g);k=k+1|0}if((b|0)==0){l=d;i=e;return l|0}cp(a,1);l=d;i=e;return l|0}function dv(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;dc(d,c[a>>2]|0);dc(d,c[(c[a+24>>2]|0)+4>>2]|0);if((c[(c[a+24>>2]|0)+4>>2]|0)==0){di(d,c[a+4>>2]|0);dd(d,a+8|0);dd(d,a+16|0);return}b=0;while(1){if((b|0)>=(c[(c[a+24>>2]|0)+4>>2]|0)){break}dv(d,cv(c[a+24>>2]|0,b)|0);b=b+1|0}return}function dw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((a|0)>=0){e=a}else{e=-((a+1|0)-1|0)|0}b=e;c[c[d+12>>2]>>2]=b;e=(b|0)!=0&1;c[d+8>>2]=e;if((a|0)>=0){a=e;b=d;f=b+4|0;c[f>>2]=a;return}else{a=-e|0;b=d;f=b+4|0;c[f>>2]=a;return}}function dx(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;d=uq(48)|0;c[d>>2]=c6(a,b)|0;c[d+4>>2]=0;c[d+24>>2]=cr()|0;f=c6(a,b)|0;if((f|0)==0){c[d+4>>2]=dj(a,b)|0;dm(d+8|0,e+4|0);dm(d+16|0,e+4|0);dg(a,b,d+8|0);dg(a,b,d+16|0);g=d;return g|0}h=0;while(1){if((h|0)>=(f|0)){break}i=c[d+24>>2]|0;cs(i,dx(e,a,b)|0);h=h+1|0}g=d;return g|0}function dy(a){a=a|0;var b=0;b=a;a=co()|0;dd(a,b|0);dd(a,b+8|0);dv(a,c[b+16>>2]|0);return a|0}function dz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=uq(20)|0;c[f>>2]=0;dp(b|0,g+4|0);dm(b+8|0,g+4|0);dg(a,f,b|0);dg(a,f,b+8|0);c[b+16>>2]=dx(g,a,f)|0;if((d|0)==0){h=b;i=e;return h|0}cp(a,1);h=b;i=e;return h|0}function dA(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function dB(b,d){b=b|0;d=d|0;var e=0,f=0;e=i;f=b;b=d;if((f|0)==0){i=e;return}if((a[f|0]|0|0)==0){i=e;return}aE(c[p>>2]|0,8944,(w=i,i=i+8|0,c[w>>2]=f,w)|0);if((b|0)!=-1){f=c[p>>2]|0;d=b;aE(f|0,9016,(w=i,i=i+8|0,c[w>>2]=d,w)|0)}i=e;return}function dC(a,b){a=a|0;b=b|0;uu(a);return}function dD(a,b){a=a|0;b=b|0;var d=0;d=a;a=b+8|0;b=bm[c[4008]&1023](a)|0;c[b+4>>2]=a;c[b>>2]=c[d>>2]|0;c[d>>2]=b;return b+8|0}function dE(a){a=a|0;var b=0;b=a;while(1){if((b|0)==0){break}a=c[b>>2]|0;bl[c[3848]&1023](b,c[b+4>>2]|0);b=a}return}function dF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;dB(a,b);aE(c[p>>2]|0,7424,(w=i,i=i+8|0,c[w>>2]=d,w)|0);aD();i=e;return}function dG(a){a=a|0;c[3854]=c[3854]|a;c[3794]=10/(c[4010]|0)&-1;aD();return}function dH(){dG(2);return}function dI(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a;a=uq(d)|0;if((a|0)==0){e=c[p>>2]|0;f=d;aE(e|0,6624,(w=i,i=i+8|0,c[w>>2]=f,w)|0);aD();return 0;return 0}else{i=b;return a|0}return 0}function dJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=d;d=uw(a,f)|0;if((d|0)==0){a=c[p>>2]|0;g=b;b=f;aE(a|0,8296,(w=i,i=i+16|0,c[w>>2]=g,c[w+8>>2]=b,w)|0);aD();return 0;return 0}else{i=e;return d|0}return 0}function dK(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;j=i;i=i+24|0;k=j|0;l=j+8|0;m=j+16|0;n=b;b=e;e=f;f=g;g=h;h=0;o=c[g+12>>2]|0;if((c[g+4>>2]|0)>=0){p=c[g+4>>2]|0}else{p=-(c[g+4>>2]|0)|0}q=p;p=c[g+8>>2]|0;if((e|0)>=0){r=9304;if((e|0)<=1){e=10}else{do{if((e|0)>36){r=9048;if((e|0)<=62){break}s=0;t=s;i=j;return t|0}}while(0)}}else{e=-e|0;do{if((e|0)<=1){e=10}else{if((e|0)<=36){break}s=0;t=s;i=j;return t|0}}while(0);r=7368}u=c[(10008+(e*20&-1)|0)+4>>2]|0;v=(c[g>>2]|0)-1<<5;w=u&65535;x=u>>>16;u=v&65535;y=v>>>16;v=ab(w,u);z=ab(w,y);w=ab(x,u);u=ab(x,y);z=z+(v>>>16)|0;z=z+w|0;if(z>>>0<w>>>0){u=u+65536|0}w=(u+(z>>>16)|0)+2|0;do{if((f|0)==0){A=835}else{if(f>>>0>w>>>0){A=835;break}else{break}}}while(0);if((A|0)==835){f=w}if((n|0)==0){h=f+2|0;n=bm[c[4008]&1023](f+2|0)|0}if((q|0)==0){c[b>>2]=0;a[n]=0;f=0}else{c[k>>2]=0;if(((((f+64|0)+3|0)>>>0<65536&1|0)!=0&1|0)!=0){w=i;i=i+((f+64|0)+3|0)|0;i=i+7>>3<<3;B=w}else{B=dD(k,(f+64|0)+3|0)|0}w=B;B=c[(10008+(e*20&-1)|0)+8>>2]|0;z=f;u=B&65535;v=B>>>16;B=z&65535;y=z>>>16;z=ab(u,B);x=ab(u,y);u=ab(v,B);B=ab(v,y);x=x+(z>>>16)|0;x=x+u|0;if(x>>>0<u>>>0){B=B+65536|0}u=((B+(x>>>16)<<3>>>0)/32>>>0)+2|0;if((p|0)<=(u|0)){x=c[(10008+(e*20&-1)|0)+4>>2]|0;B=u-p<<5;z=x&65535;y=x>>>16;x=B&65535;v=B>>>16;B=ab(z,x);C=ab(z,v);z=ab(y,x);x=ab(y,v);C=C+(B>>>16)|0;C=C+z|0;if(C>>>0<z>>>0){x=x+65536|0}z=x+(C>>>16)|0;if((q|0)>(u|0)){o=o+(q-u<<2)|0;q=u}if((((u<<1)+2<<2>>>0<65536&1|0)!=0&1|0)!=0){C=i;i=i+((u<<1)+2<<2)|0;i=i+7>>3<<3;D=C}else{D=dD(k,(u<<1)+2<<2)|0}C=D;if((((u<<1)+2<<2>>>0<65536&1|0)!=0&1|0)!=0){D=i;i=i+((u<<1)+2<<2)|0;i=i+7>>3<<3;E=D}else{E=dD(k,(u<<1)+2<<2)|0}D=E;E=dL(C,l,e,z,u,D)|0;if((q|0)>(E|0)){x=D;B=o;v=q;y=C;F=E;e_(x,B,v,y,F)}else{F=D;y=C;v=E;B=o;x=q;e_(F,y,v,B,x)}x=q+E|0;x=x-((c[D+(x-1<<2)>>2]|0)==0&1)|0;B=(q-p|0)-(c[l>>2]|0)|0;if((B|0)<0){if((x|0)!=0){l=x-1|0;v=(D+(-B<<2)|0)+(l<<2)|0;y=D+(l<<2)|0;F=y;y=F-4|0;G=c[F>>2]|0;if((l|0)!=0){while(1){F=v;v=F-4|0;c[F>>2]=G;F=y;y=F-4|0;G=c[F>>2]|0;F=l-1|0;l=F;if((F|0)==0){break}}}l=v;v=l-4|0;c[l>>2]=G}if((-B|0)!=0){G=D;l=-B|0;while(1){v=G;G=v+4|0;c[v>>2]=0;v=l-1|0;l=v;if((v|0)==0){break}}}x=x-B|0;B=0}H=fo(w,e,D+(B<<2)|0,x-B|0)|0;I=H-z|0}else{z=p-u|0;p=c[(10008+(e*20&-1)|0)+4>>2]|0;B=z<<5;l=p&65535;G=p>>>16;p=B&65535;v=B>>>16;B=ab(l,p);y=ab(l,v);l=ab(G,p);p=ab(G,v);y=y+(B>>>16)|0;y=y+l|0;if(y>>>0<l>>>0){p=p+65536|0}l=p+(y>>>16)|0;if((q|0)>(u|0)){o=o+(q-u<<2)|0;q=u}if((((u<<1)+2<<2>>>0<65536&1|0)!=0&1|0)!=0){y=i;i=i+((u<<1)+2<<2)|0;i=i+7>>3<<3;J=y}else{J=dD(k,(u<<1)+2<<2)|0}C=J;if((((u<<1)+2<<2>>>0<65536&1|0)!=0&1|0)!=0){J=i;i=i+((u<<1)+2<<2)|0;i=i+7>>3<<3;K=J}else{K=dD(k,(u<<1)+2<<2)|0}D=K;E=dL(C,m,e,l,u,D)|0;K=u+(z-(c[m>>2]|0)|0)|0;if(((K<<2>>>0<65536&1|0)!=0&1|0)!=0){m=i;i=i+(K<<2)|0;i=i+7>>3<<3;L=m}else{L=dD(k,K<<2)|0}m=L;L=K-q|0;if((L|0)!=0){z=m;u=L;while(1){J=z;z=J+4|0;c[J>>2]=0;J=u-1|0;u=J;if((J|0)==0){break}}}if((q|0)!=0){u=q-1|0;q=m+(L<<2)|0;L=o;o=L;L=o+4|0;z=c[o>>2]|0;if((u|0)!=0){while(1){o=q;q=o+4|0;c[o>>2]=z;o=L;L=o+4|0;z=c[o>>2]|0;o=u-1|0;u=o;if((o|0)==0){break}}}u=q;q=u+4|0;c[u>>2]=z}if(((E<<2>>>0<65536&1|0)!=0&1|0)!=0){z=i;i=i+(E<<2)|0;i=i+7>>3<<3;M=z}else{M=dD(k,E<<2)|0}fF(D,M,0,m,K,C,E);x=(K-E|0)+1|0;x=x-((c[D+(x-1<<2)>>2]|0)==0&1)|0;H=fo(w,e,D,x)|0;I=H+l|0}if(H>>>0>f>>>0){if(((d[w+f|0]|0)<<1|0)>=(e|0)){H=f;l=f-1|0;while(1){x=w+l|0;D=(a[x]|0)+1&255;a[x]=D;if((D&255|0)!=(e|0)){A=943;break}H=H-1|0;if((l|0)==0){A=945;break}l=l-1|0}if((A|0)!=943)if((A|0)==945){a[w|0]=1;H=1;I=I+1|0}}}if(f>>>0>H>>>0){f=H}while(1){if((f|0)!=0){N=(d[w+(f-1|0)|0]|0|0)==0}else{N=0}if(!N){break}f=f-1|0}N=n+((c[g+4>>2]|0)<0&1)|0;H=0;while(1){if(H>>>0>=f>>>0){break}a[N+H|0]=a[r+(d[w+H|0]|0)|0]|0;H=H+1|0}a[N+f|0]=0;c[b>>2]=I;if((c[g+4>>2]|0)<0){a[n|0]=45;f=f+1|0}if((((c[k>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[k>>2]|0)}}if((h|0)!=0){if((h|0)!=(f+1|0)){n=bi[c[3792]&1023](n,h,f+1|0)|0}}s=n;t=s;i=j;return t|0}function dL(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=a;a=b;b=e;e=f;f=g;g=h;h=i;if((e|0)==0){c[i>>2]=1;c[a>>2]=0;j=1;k=j;return k|0}c[i>>2]=b;l=1;m=0;n=0;o=e;if(o>>>0<65536){p=o>>>0<256?1:9}else{p=o>>>0<16777216?17:25}q=p;p=(32-((33-q|0)-(d[9872+(o>>>(q>>>0))|0]|0)|0)|0)-2|0;while(1){if(!((p|0)>=0)){break}fi(g,i+(m<<2)|0,l);l=l<<1;l=l-((c[g+(l-1<<2)>>2]|0)==0&1)|0;n=n<<1;m=0;if((l|0)>(f|0)){n=n+(l-f|0)|0;m=l-f|0;l=f}q=i;i=g;g=q;if((e>>>(p>>>0)&1|0)!=0){q=eK(i,i+(m<<2)|0,l,b)|0;c[i+(l<<2)>>2]=q;l=l+((q|0)!=0&1)|0;m=0}p=p-1|0}if((l|0)>(f|0)){n=n+(l-f|0)|0;i=i+(l-f<<2)|0;l=f}if((h|0)!=(i+(m<<2)|0)){if((l|0)!=0){f=l-1|0;p=h;h=i+(m<<2)|0;m=h;h=m+4|0;i=c[m>>2]|0;if((f|0)!=0){while(1){m=p;p=m+4|0;c[m>>2]=i;m=h;h=m+4|0;i=c[m>>2]|0;m=f-1|0;f=m;if((m|0)==0){break}}}f=p;p=f+4|0;c[f>>2]=i}}c[a>>2]=n;j=l;k=j;return k|0}function dM(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=a;a=b;b=d;d=c[a+4>>2]|0;f=c[b+4>>2]|0;if((d|0)>=0){g=d}else{g=-d|0}h=g;if((f|0)>=0){i=f}else{i=-f|0}g=i;if((h|0)<(g|0)){i=a;a=b;b=i;i=d;d=f;f=i;i=h;h=g;g=i}i=h+1|0;if((((i|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){j=eo(e,i)|0}else{j=c[e+8>>2]|0}k=j;j=c[a+8>>2]|0;a=c[b+8>>2]|0;if((d^f|0)>=0){f=eL(k,j,h,a,g)|0;c[k+(h<<2)>>2]=f;i=h+f|0;if((d|0)<0){i=-i|0}l=i;m=e;n=m+4|0;c[n>>2]=l;return}if((h|0)!=(g|0)){f=k;b=j;o=h;p=a;q=g;eM(f,b,o,p,q);i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=1042;break}i=i-1|0}if((d|0)<0){i=-i|0}}else{if((fw(j,a,h)|0)<0){q=k;p=a;o=j;b=h;eI(q,p,o,b);i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=1053;break}i=i-1|0}if((d|0)>=0){i=-i|0}}else{eI(k,j,a,h);i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=1063;break}i=i-1|0}if((d|0)<0){i=-i|0}}}l=i;m=e;n=m+4|0;c[n>>2]=l;return}function dN(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a;a=b;b=d;d=c[a+4>>2]|0;if((d|0)>=0){f=d}else{f=-d|0}g=f;f=g+1|0;if((((f|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){h=eo(e,f)|0}else{h=c[e+8>>2]|0}i=h;h=c[a+8>>2]|0;if((g|0)==0){c[i>>2]=b;c[e+4>>2]=(b|0)!=0&1;return}if((d|0)>=0){d=eF(i,h,g,b)|0;c[i+(g<<2)>>2]=d;f=g+d|0}else{do{if((g|0)==1){if((c[h>>2]|0)>>>0>=b>>>0){j=1090;break}c[i>>2]=b-(c[h>>2]|0)|0;f=1;break}else{j=1090}}while(0);if((j|0)==1090){j=i;d=h;h=g;a=b;eH(j,d,h,a);f=-(g-((c[i+(g-1<<2)>>2]|0)==0&1)|0)|0}}c[e+4>>2]=f;return}function dO(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=a;a=b;b=d;d=e;e=c[a+4>>2]|0;do{if((e|0)!=0){if((b|0)==0){break}d=d^e;if((e|0)>=0){g=e}else{g=-e|0}e=g;h=c[f+4>>2]|0;if((h|0)==0){if((((e+1|0)>(c[f>>2]|0)&1|0)!=0&1|0)!=0){i=eo(f,e+1|0)|0}else{i=c[f+8>>2]|0}j=i;k=eK(j,c[a+8>>2]|0,e,b)|0;c[j+(e<<2)>>2]=k;e=e+((k|0)!=0&1)|0;if((d|0)>=0){l=e}else{l=-e|0}c[f+4>>2]=l;return}d=d^h;if((h|0)>=0){m=h}else{m=-h|0}n=m;if((n|0)>(e|0)){o=n}else{o=e}p=o;if((((p+1|0)>(c[f>>2]|0)&1|0)!=0&1|0)!=0){q=eo(f,p+1|0)|0}else{q=c[f+8>>2]|0}j=q;r=c[a+8>>2]|0;if((n|0)<(e|0)){s=n}else{s=e}t=s;if((d|0)>=0){k=eN(j,r,t,b)|0;j=j+(t<<2)|0;r=r+(t<<2)|0;u=e-n|0;if((u|0)!=0){if((u|0)>0){v=eK(j,r,u,b)|0}else{u=-u|0;v=0}k=v+(eF(j,j,u,k)|0)|0}c[j+(u<<2)>>2]=k;p=p+((k|0)!=0&1)|0}else{k=eO(j,r,t,b)|0;if((n|0)>=(e|0)){if((n|0)!=(e|0)){k=eH(j+(e<<2)|0,j+(e<<2)|0,n-e|0,k)|0}if((k|0)!=0){c[j+(p<<2)>>2]=-k^-1;t=j;u=j;w=p;while(1){x=u;u=x+4|0;y=t;t=y+4|0;c[y>>2]=c[x>>2]^-1;x=w-1|0;w=x;if((x|0)==0){break}}p=p+1|0;w=j;while(1){t=w;w=t+4|0;u=(c[t>>2]|0)+1|0;c[t>>2]=u;if((u|0)!=0){break}}h=-h|0}}else{w=j;u=j;t=n;while(1){x=u;u=x+4|0;y=w;w=y+4|0;c[y>>2]=c[x>>2]^-1;x=t-1|0;t=x;if((x|0)==0){break}}k=k+(eF(j,j,n,1)|0)|0;k=k-1|0;t=(k|0)==-1&1;k=k+t|0;w=eK(j+(n<<2)|0,r+(n<<2)|0,e-n|0,b)|0;k=w+(eF(j+(n<<2)|0,j+(n<<2)|0,e-n|0,k)|0)|0;c[j+(p<<2)>>2]=k;p=p+((k|0)!=0&1)|0;if((t|0)!=0){t=j+(n<<2)|0;while(1){w=t;t=w+4|0;u=c[w>>2]|0;c[w>>2]=u-1|0;if((u|0)!=0){break}}}h=-h|0}while(1){if((p|0)<=0){break}if((c[j+(p-1<<2)>>2]|0)!=0){t=1172;break}p=p-1|0}}if((h|0)>=0){z=p}else{z=-p|0}c[f+4>>2]=z;return}}while(0);return}function dP(a,b,c){a=a|0;b=b|0;c=c|0;dO(a,b,c,0);return}function dQ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=a;a=b;b=d;d=e;e=c[a+4>>2]|0;if((e|0)>=0){g=e}else{g=-e|0}h=(b>>>0)/32>>>0;i=g-h|0;if((i|0)<=0){c[c[f+8>>2]>>2]=1;do{if((e|0)==0){j=1192}else{if((e^d|0)<0){j=1192;break}k=d;break}}while(0);if((j|0)==1192){k=0}c[f+4>>2]=k;return}if((((i+1|0)>(c[f>>2]|0)&1|0)!=0&1|0)!=0){k=eo(f,i+1|0)|0}else{k=c[f+8>>2]|0}k=c[a+8>>2]|0;a=0;j=(e^d|0)>=0?-1:0;if((j|0)!=0){d=0;while(1){if((d|0)<(h|0)){l=(a|0)==0}else{l=0}if(!l){break}a=c[k+(d<<2)>>2]|0;d=d+1|0}}d=c[f+8>>2]|0;b=(b>>>0)%32;if((b|0)!=0){a=a|j&eQ(d,k+(h<<2)|0,i,b);i=i-((c[d+(i-1<<2)>>2]|0)==0&1)|0}else{if((i|0)!=0){b=i-1|0;j=d;l=k+(h<<2)|0;h=l;l=h+4|0;k=c[h>>2]|0;if((b|0)!=0){while(1){h=j;j=h+4|0;c[h>>2]=k;h=l;l=h+4|0;k=c[h>>2]|0;h=b-1|0;b=h;if((h|0)==0){break}}}b=j;j=b+4|0;c[b>>2]=k}}if((a|0)!=0){if((i|0)!=0){a=eF(d,d,i,1)|0;c[d+(i<<2)>>2]=a;i=i+a|0}else{c[d>>2]=1;i=1}}if((e|0)>=0){m=i}else{m=-i|0}c[f+4>>2]=m;return}function dR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;d=a;a=b;b=c[d+4>>2]|0;e=b-(c[a+4>>2]|0)|0;if((e|0)!=0){f=e;g=f;return g|0}if((b|0)>=0){h=b}else{h=-b|0}e=c[d+8>>2]|0;d=c[a+8>>2]|0;a=0;i=h;while(1){h=i-1|0;i=h;if(!((h|0)>=0)){break}j=c[e+(i<<2)>>2]|0;k=c[d+(i<<2)>>2]|0;if((j|0)!=(k|0)){l=1243;break}}if((l|0)==1243){a=j>>>0>k>>>0?1:-1}if((b|0)>=0){m=a}else{m=-a|0}f=m;g=f;return g|0}function dS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[d+4>>2]|0;if((b|0)==0){e=-((a|0)!=0&1)|0;f=e;return f|0}if((b|0)!=1){e=(b|0)>0?1:-1;f=e;return f|0}b=c[c[d+8>>2]>>2]|0;if(b>>>0>a>>>0){e=1;f=e;return f|0}if(b>>>0<a>>>0){e=-1;f=e;return f|0}else{e=0;f=e;return f|0}return 0}function dT(a,b,c){a=a|0;b=b|0;c=c|0;dQ(a,b,c,-1);return}function dU(a){a=a|0;var b=0;b=a;bl[c[3848]&1023](c[b+8>>2]|0,c[b>>2]<<2);return}function dV(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=a;a=b;b=c[d+4>>2]|0;e=c[d+8>>2]|0;f=(a>>>0)/32>>>0;g=1<<(a>>>0)%32;if((b|0)>=0){if((f|0)<(b|0)){a=c[e+(f<<2)>>2]|0;a=a&(g^-1);c[e+(f<<2)>>2]=a;if((a|0)==0){h=(f|0)==(b-1|0)}else{h=0}if(((h&1|0)!=0&1|0)!=0){while(1){if((f|0)<=0){break}if((c[e+(f-1<<2)>>2]|0)!=0){h=1279;break}f=f-1|0}c[d+4>>2]=f}}return}b=-b|0;h=0;while(1){if((c[e+(h<<2)>>2]|0)!=0){break}h=h+1|0}if((f|0)>(h|0)){if((f|0)<(b|0)){a=e+(f<<2)|0;c[a>>2]=c[a>>2]|g}else{if((((f+1|0)>(c[d>>2]|0)&1|0)!=0&1|0)!=0){i=eo(d,f+1|0)|0}else{i=c[d+8>>2]|0}e=i;c[d+4>>2]=-(f+1|0)|0;if((f-b|0)!=0){i=e+(b<<2)|0;a=f-b|0;while(1){j=i;i=j+4|0;c[j>>2]=0;j=a-1|0;a=j;if((j|0)==0){break}}}c[e+(f<<2)>>2]=g}}else{if((f|0)==(h|0)){c[e+(f<<2)>>2]=((c[e+(f<<2)>>2]|0)-1|g)+1|0;if((c[e+(f<<2)>>2]|0)==0){if((((b+1|0)>(c[d>>2]|0)&1|0)!=0&1|0)!=0){k=eo(d,b+1|0)|0}else{k=c[d+8>>2]|0}e=k;c[e+(b<<2)>>2]=0;k=(e+(f<<2)|0)+4|0;while(1){f=k;k=f+4|0;g=(c[f>>2]|0)+1|0;c[f>>2]=g;if((g|0)!=0){break}}b=b+(c[e+(b<<2)>>2]|0)|0;c[d+4>>2]=-b|0}}}return}function dW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;if((c[a+4>>2]|0)>=0){h=c[a+4>>2]|0}else{h=-(c[a+4>>2]|0)|0}d=h;if((c[b+4>>2]|0)>=0){j=c[b+4>>2]|0}else{j=-(c[b+4>>2]|0)|0}h=j;if((d|0)<(h|0)){c[g+4>>2]=0;i=e;return}j=(d-h|0)+1|0;c[f>>2]=0;do{if((g|0)==(a|0)){k=1334}else{if((g|0)==(b|0)){k=1334;break}if((((j|0)>(c[g>>2]|0)&1|0)!=0&1|0)!=0){l=eo(g,j)|0}else{l=c[g+8>>2]|0}m=l;break}}while(0);if((k|0)==1334){if(((j<<2>>>0<65536&1|0)!=0&1|0)!=0){l=i;i=i+(j<<2)|0;i=i+7>>3<<3;n=l}else{n=dD(f,j<<2)|0}m=n}hC(m,c[a+8>>2]|0,d,c[b+8>>2]|0,h);while(1){if((j|0)<=0){break}if((c[m+(j-1<<2)>>2]|0)!=0){k=1346;break}j=j-1|0}if((m|0)!=(c[g+8>>2]|0)){if((j|0)!=0){k=j-1|0;if((((j|0)>(c[g>>2]|0)&1|0)!=0&1|0)!=0){o=eo(g,j)|0}else{o=c[g+8>>2]|0}h=o;o=m;m=o;o=m+4|0;d=c[m>>2]|0;if((k|0)!=0){while(1){m=h;h=m+4|0;c[m>>2]=d;m=o;o=m+4|0;d=c[m>>2]|0;m=k-1|0;k=m;if((m|0)==0){break}}}k=h;h=k+4|0;c[k>>2]=d}}if((c[a+4>>2]^c[b+4>>2]|0)>=0){p=j}else{p=-j|0}c[g+4>>2]=p;if((((c[f>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[f>>2]|0)}i=e;return}function dX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+24|0;f=e+8|0;g=a;a=b;b=d;if((((b|0)==0&1|0)!=0&1|0)!=0){dH()}if(b>>>0>4294967295){c[f>>2]=2;c[(f|0)+8>>2]=e|0;eq(f|0,b);dW(g,a,f|0);i=e;return}f=c[a+4>>2]|0;if((f|0)==0){c[g+4>>2]=0;i=e;return}if((f|0)>=0){h=f}else{h=-f|0}d=h;if((((d|0)>(c[g>>2]|0)&1|0)!=0&1|0)!=0){j=eo(g,d)|0}else{j=c[g+8>>2]|0}h=j;eR(h,c[a+8>>2]|0,d,b);d=d-((c[h+(d-1<<2)>>2]|0)==0&1)|0;if((f|0)>=0){k=d}else{k=-d|0}c[g+4>>2]=k;i=e;return}function dY(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b+4>>2]|0;if((a|0)==0){d=1;e=d&1;return e|0}if((a|0)==1){f=(c[c[b+8>>2]>>2]|0)>>>0<=4294967295}else{f=0}d=f;e=d&1;return e|0}function dZ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;l=i;i=i+8|0;m=b;b=e;e=f;f=g;g=h;h=j;j=k;if((b|0)==0){b=l|0}k=c[j+4>>2]|0;if((k|0)==0){c[b>>2]=0;n=m;o=n;i=l;return o|0}if((k|0)>=0){p=k}else{p=-k|0}k=p;p=c[j+8>>2]|0;j=(f<<3)-h|0;q=c[p+(k-1<<2)>>2]|0;if(q>>>0<65536){r=q>>>0<256?1:9}else{r=q>>>0<16777216?17:25}s=r;r=(((((k<<5)-((33-s|0)-(d[9872+(q>>>(s>>>0))|0]|0)|0)|0)+j|0)-1|0)>>>0)/(j>>>0)>>>0;c[b>>2]=r;if((m|0)==0){b=c[4008]|0;j=ab(r,f);m=bm[b&1023](j)|0}if((g|0)==0){g=-1}j=((m|0)>>>0)%4;if((h|0)==0){do{if((f|0)==4){if((j|0)!=0){break}do{if((e|0)==-1){if((g|0)!=-1){break}if((r|0)!=0){b=r-1|0;s=m;q=p;t=q;q=t+4|0;u=c[t>>2]|0;if((b|0)!=0){while(1){t=s;s=t+4|0;c[t>>2]=u;t=q;q=t+4|0;u=c[t>>2]|0;t=b-1|0;b=t;if((t|0)==0){break}}}b=s;s=b+4|0;c[b>>2]=u}n=m;o=n;i=l;return o|0}}while(0);do{if((e|0)==1){if((g|0)!=-1){break}b=m;q=r;t=(p+(q<<2)|0)-4|0;v=0;while(1){if((v|0)>=(q|0)){break}c[b>>2]=c[t>>2]|0;b=b+4|0;t=t-4|0;v=v+1|0}n=m;o=n;i=l;return o|0}}while(0);do{if((e|0)==-1){if((g|0)!=1){break}v=m;t=p;b=r;q=0;while(1){if((q|0)>=(b|0)){break}c[v>>2]=(((c[t>>2]<<24)+((c[t>>2]&65280)<<8)|0)+((c[t>>2]|0)>>>8&65280)|0)+((c[t>>2]|0)>>>24)|0;v=v+4|0;t=t+4|0;q=q+1|0}n=m;o=n;i=l;return o|0}}while(0);do{if((e|0)==1){if((g|0)!=1){break}q=m;t=r;v=(p+(t<<2)|0)-4|0;b=0;while(1){if((b|0)>=(t|0)){break}c[q>>2]=(((c[v>>2]<<24)+((c[v>>2]&65280)<<8)|0)+((c[v>>2]|0)>>>8&65280)|0)+((c[v>>2]|0)>>>24)|0;q=q+4|0;v=v-4|0;b=b+1|0}n=m;o=n;i=l;return o|0}}while(0)}}while(0)}j=(f<<3)-h|0;h=(j>>>0)/8>>>0;b=(j>>>0)%8;j=(1<<b)-1|0;if((g|0)>=0){w=f}else{w=-f|0}if((e|0)<0){x=f}else{x=-f|0}v=w+x|0;if((e|0)>=0){y=ab(r-1|0,f)}else{y=0}if((g|0)>=0){z=f-1|0}else{z=0}e=(m+y|0)+z|0;z=p+(k<<2)|0;k=0;y=0;x=0;while(1){if(x>>>0>=r>>>0){break}w=0;while(1){if((w|0)>=(h|0)){break}if((k|0)>=8){a[e]=y&255;y=y>>>8;k=k-8|0}else{if((p|0)==(z|0)){A=0}else{q=p;p=q+4|0;A=c[q>>2]|0}q=A;a[e]=(y|q<<k)&255;y=q>>>((8-k|0)>>>0);k=k+24|0}e=e+(-g|0)|0;w=w+1|0}if((b|0)!=0){if((k|0)>=(b|0)){a[e]=y&j&255;y=y>>>(b>>>0);k=k-b|0}else{if((p|0)==(z|0)){B=0}else{q=p;p=q+4|0;B=c[q>>2]|0}q=B;a[e]=(y|q<<k)&j&255;y=q>>>((b-k|0)>>>0);k=k+(32-b|0)|0}e=e+(-g|0)|0;w=w+1|0}while(1){if(w>>>0>=f>>>0){break}a[e]=0;e=e+(-g|0)|0;w=w+1|0}e=e+v|0;x=x+1|0}n=m;o=n;i=l;return o|0}function d_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;g=i;i=i+64|0;h=g|0;j=g+8|0;k=g+16|0;l=g+32|0;m=g+48|0;n=a;a=b;b=d;d=e;e=f;if((c[d+4>>2]|0)>=0){o=c[d+4>>2]|0}else{o=-(c[d+4>>2]|0)|0}f=o;if((c[e+4>>2]|0)>=0){p=c[e+4>>2]|0}else{p=-(c[e+4>>2]|0)|0}o=p;if((f|0)<(o|0)){p=d;d=e;e=p;p=f;f=o;o=p;p=a;a=b;b=p}if((o|0)==0){if((c[d+4>>2]|0)>=0){q=(f|0)!=0&1}else{q=-1}r=q;if((((f|0)>(c[n>>2]|0)&1|0)!=0&1|0)!=0){s=eo(n,f)|0}else{s=c[n+8>>2]|0}t=s;if((f|0)!=0){s=f-1|0;q=t;p=c[d+8>>2]|0;u=p;p=u+4|0;v=c[u>>2]|0;if((s|0)!=0){while(1){u=q;q=u+4|0;c[u>>2]=v;u=p;p=u+4|0;v=c[u>>2]|0;u=s-1|0;s=u;if((u|0)==0){break}}}s=q;q=s+4|0;c[s>>2]=v}c[n+4>>2]=f;if((b|0)!=0){c[b+4>>2]=0}if((a|0)!=0){c[a+4>>2]=r;c[c[a+8>>2]>>2]=1}i=g;return}c[j>>2]=0;if(((f+o<<2>>>0<65536&1|0)!=0&1|0)!=0){v=i;i=i+(f+o<<2)|0;i=i+7>>3<<3;w=v}else{w=dD(j,f+o<<2)|0}v=w;w=v+(f<<2)|0;if((f|0)!=0){s=f-1|0;q=v;p=c[d+8>>2]|0;u=p;p=u+4|0;x=c[u>>2]|0;if((s|0)!=0){while(1){u=q;q=u+4|0;c[u>>2]=x;u=p;p=u+4|0;x=c[u>>2]|0;u=s-1|0;s=u;if((u|0)==0){break}}}s=q;q=s+4|0;c[s>>2]=x}if((o|0)!=0){x=o-1|0;s=w;q=c[e+8>>2]|0;p=q;q=p+4|0;u=c[p>>2]|0;if((x|0)!=0){while(1){p=s;s=p+4|0;c[p>>2]=u;p=q;q=p+4|0;u=c[p>>2]|0;p=x-1|0;x=p;if((p|0)==0){break}}}x=s;s=x+4|0;c[x>>2]=u}if(((o+(o+1|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){u=i;i=i+(o+(o+1|0)<<2)|0;i=i+7>>3<<3;y=u}else{y=dD(j,o+(o+1|0)<<2)|0}u=y;y=u+(o<<2)|0;x=fy(u,y,h,v,f,w,o)|0;if((c[h>>2]|0)>=0){z=c[h>>2]|0}else{z=-(c[h>>2]|0)|0}r=z;if((c[d+4>>2]|0)>=0){A=c[h>>2]|0}else{A=-(c[h>>2]|0)|0}c[h>>2]=A;if((b|0)!=0){c[l+8>>2]=u;c[l+4>>2]=x;c[m+8>>2]=y;c[m+4>>2]=c[h>>2]|0;A=k|0;c[A>>2]=(r+f|0)+1|0;if((((r+f|0)+1<<2>>>0<65536&1|0)!=0&1|0)!=0){z=i;i=i+((r+f|0)+1<<2)|0;i=i+7>>3<<3;B=z}else{B=dD(j,(r+f|0)+1<<2)|0}c[A+8>>2]=B;d9(k|0,m,d);ew(k|0,l,k|0);dW(b,k|0,e)}if((a|0)!=0){if((((r|0)>(c[a>>2]|0)&1|0)!=0&1|0)!=0){C=eo(a,r)|0}else{C=c[a+8>>2]|0}if((r|0)!=0){e=r-1|0;r=C;C=y;y=C;C=y+4|0;k=c[y>>2]|0;if((e|0)!=0){while(1){y=r;r=y+4|0;c[y>>2]=k;y=C;C=y+4|0;k=c[y>>2]|0;y=e-1|0;e=y;if((y|0)==0){break}}}e=r;r=e+4|0;c[e>>2]=k}c[a+4>>2]=c[h>>2]|0}if((((x|0)>(c[n>>2]|0)&1|0)!=0&1|0)!=0){D=eo(n,x)|0}else{D=c[n+8>>2]|0}t=D;if((x|0)!=0){D=x-1|0;h=t;t=u;u=t;t=u+4|0;a=c[u>>2]|0;if((D|0)!=0){while(1){u=h;h=u+4|0;c[u>>2]=a;u=t;t=u+4|0;a=c[u>>2]|0;u=D-1|0;D=u;if((u|0)==0){break}}}D=h;h=D+4|0;c[D>>2]=a}c[n+4>>2]=x;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=g;return}function d$(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b+4>>2]|0;d=c[c[b+8>>2]>>2]|0;if((a|0)>0){e=d&2147483647;f=e;return f|0}if((a|0)<0){e=-1-(d-1&2147483647)|0;f=e;return f|0}else{e=0;f=e;return f|0}return 0}function d0(a){a=a|0;var b=0;b=a;if((c[b+4>>2]|0)!=0){a=c[c[b+8>>2]>>2]|0;return a|0}else{a=0;return a|0}return 0}function d1(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+8|0;h=g|0;j=b;b=e;e=f;f=c[e+4>>2]|0;k=0;if((b|0)>=0){l=5552;if((b|0)<=1){b=10}else{do{if((b|0)>36){l=7968;if((b|0)<=62){break}m=0;n=m;i=g;return n|0}}while(0)}}else{b=-b|0;do{if((b|0)<=1){b=10}else{if((b|0)<=36){break}m=0;n=m;i=g;return n|0}}while(0);l=6904}if((j|0)==0){if((f|0)>=0){o=f}else{o=-f|0}if((o|0)==0){k=1}else{if((f|0)>=0){p=f}else{p=-f|0}o=c[(c[e+8>>2]|0)+(p-1<<2)>>2]|0;if(o>>>0<65536){q=o>>>0<256?1:9}else{q=o>>>0<16777216?17:25}p=q;if((f|0)>=0){r=f}else{r=-f|0}q=(r<<5)-((33-p|0)-(d[9872+(o>>>(p>>>0))|0]|0)|0)|0;if((b&b-1|0)==0){p=c[(10008+(b*20&-1)|0)+12>>2]|0;k=(((q+p|0)-1|0)>>>0)/(p>>>0)>>>0}else{p=(c[(10008+(b*20&-1)|0)+4>>2]|0)+1|0;o=q;q=p&65535;r=p>>>16;p=o&65535;s=o>>>16;o=ab(q,p);t=ab(q,s);q=ab(r,p);p=ab(r,s);t=t+(o>>>16)|0;t=t+q|0;if(t>>>0<q>>>0){p=p+65536|0}k=(p+(t>>>16)|0)+1|0}}k=k+(((f|0)<0&1)+1|0)|0;j=bm[c[4008]&1023](k)|0}t=j;if((f|0)<0){p=j;j=p+1|0;a[p]=45;f=-f|0}c[h>>2]=0;p=c[e+8>>2]|0;if((b&b-1|0)!=0){if((((f|1)<<2>>>0<65536&1|0)!=0&1|0)!=0){q=i;i=i+((f|1)<<2)|0;i=i+7>>3<<3;u=q}else{u=dD(h,(f|1)<<2)|0}p=u;if((f|0)!=0){u=f-1|0;q=p;o=c[e+8>>2]|0;e=o;o=e+4|0;s=c[e>>2]|0;if((u|0)!=0){while(1){e=q;q=e+4|0;c[e>>2]=s;e=o;o=e+4|0;s=c[e>>2]|0;e=u-1|0;u=e;if((e|0)==0){break}}}u=q;q=u+4|0;c[u>>2]=s}}s=fo(j,b,p,f)|0;f=0;while(1){if(f>>>0>=s>>>0){break}a[j+f|0]=a[l+(a[j+f|0]|0)|0]|0;f=f+1|0}a[j+s|0]=0;if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}if((k|0)!=0){h=(s+1|0)+(j-t|0)|0;if((k|0)!=(h|0)){t=bi[c[3792]&1023](t,k,h)|0}}m=t;n=m;i=g;return n|0}function d2(a,b,e,f,g,h,i){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=a;a=b;b=e;e=f;f=g;g=h;h=i;i=(((ab(a,(e<<3)-g|0)+32|0)-1|0)>>>0)/32>>>0;if((((i|0)>(c[j>>2]|0)&1|0)!=0&1|0)!=0){k=eo(j,i)|0}else{k=c[j+8>>2]|0}l=k;if((f|0)==0){f=-1}L2244:do{if((g|0)==0){k=((h|0)>>>0)%4;do{if((b|0)==-1){if((e|0)!=4){break}if((f|0)!=-1){break}if((k|0)!=0){break}if((a|0)!=0){m=a-1|0;n=l;o=h;p=o;o=p+4|0;q=c[p>>2]|0;if((m|0)!=0){while(1){p=n;n=p+4|0;c[p>>2]=q;p=o;o=p+4|0;q=c[p>>2]|0;p=m-1|0;m=p;if((p|0)==0){break}}}m=n;n=m+4|0;c[m>>2]=q}break L2244}}while(0);do{if((b|0)==-1){if((e|0)!=4){break}if((f|0)!=1){break}if((k|0)!=0){break}m=l;o=h;p=a;r=0;while(1){if((r|0)>=(p|0)){break}c[m>>2]=(((c[o>>2]<<24)+((c[o>>2]&65280)<<8)|0)+((c[o>>2]|0)>>>8&65280)|0)+((c[o>>2]|0)>>>24)|0;m=m+4|0;o=o+4|0;r=r+1|0}break L2244}}while(0);do{if((b|0)==1){if((e|0)!=4){break}if((f|0)!=-1){break}if((k|0)!=0){break}r=l;o=a;m=(h+(o<<2)|0)-4|0;p=0;while(1){if((p|0)>=(o|0)){break}c[r>>2]=c[m>>2]|0;r=r+4|0;m=m-4|0;p=p+1|0}break L2244}}while(0);s=1895;break}else{s=1895}}while(0);if((s|0)==1895){k=(e<<3)-g|0;g=(k>>>0)/8>>>0;p=(k>>>0)%8;m=(1<<p)-1|0;r=((k+7|0)>>>0)/8>>>0;if((f|0)>=0){t=r}else{t=-r|0}if((b|0)<0){u=e}else{u=-e|0}r=t+u|0;if((b|0)>=0){v=ab(a-1|0,e)}else{v=0}if((f|0)>=0){w=e-1|0}else{w=0}e=(h+v|0)+w|0;w=0;v=0;h=0;while(1){if(h>>>0>=a>>>0){break}b=0;while(1){if(b>>>0>=g>>>0){break}x=d[e]|0;e=e+(-f|0)|0;w=w|x<<v;v=v+8|0;if((v|0)>=32){u=l;l=u+4|0;c[u>>2]=w;v=v-32|0;w=x>>>((8-v|0)>>>0)}b=b+1|0}if((p|0)!=0){x=(d[e]|0)&m;e=e+(-f|0)|0;w=w|x<<v;v=v+p|0;if((v|0)>=32){b=l;l=b+4|0;c[b>>2]=w;v=v-32|0;w=x>>>((p-v|0)>>>0)}}e=e+r|0;h=h+1|0}if((v|0)!=0){v=l;l=v+4|0;c[v>>2]=w}}l=c[j+8>>2]|0;while(1){if((i|0)<=0){break}if((c[l+(i-1<<2)>>2]|0)!=0){s=1952;break}i=i-1|0}c[j+4>>2]=i;return}function d3(a){a=a|0;var b=0;b=a;c[b>>2]=1;c[b+8>>2]=bm[c[4008]&1023](4)|0;c[b+4>>2]=0;return}function d4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+40|0;f=e|0;g=e+16|0;h=e+32|0;j=a;a=b;b=d;if((c[a+4>>2]|0)>=0){k=c[a+4>>2]|0}else{k=-(c[a+4>>2]|0)|0}d=k;if((c[b+4>>2]|0)>=0){l=c[b+4>>2]|0}else{l=-(c[b+4>>2]|0)|0}k=l;do{if((d|0)!=0){if((k|0)==1){if((c[c[b+8>>2]>>2]|0)==1){break}}if((d|0)>(k|0)){m=d}else{m=k}l=m+1|0;c[h>>2]=0;n=f|0;c[n>>2]=l;if(((l<<2>>>0<65536&1|0)!=0&1|0)!=0){o=i;i=i+(l<<2)|0;i=i+7>>3<<3;p=o}else{p=dD(h,l<<2)|0}c[n+8>>2]=p;n=g|0;c[n>>2]=l;if(((l<<2>>>0<65536&1|0)!=0&1|0)!=0){o=i;i=i+(l<<2)|0;i=i+7>>3<<3;q=o}else{q=dD(h,l<<2)|0}c[n+8>>2]=q;d_(f|0,g|0,0,a,b);do{if((c[(f|0)+4>>2]|0)==1){if((c[c[(f|0)+8>>2]>>2]|0)!=1){break}if((c[(g|0)+4>>2]|0)<0){if((c[b+4>>2]|0)<0){ew(j,g|0,b)}else{dM(j,g|0,b)}}else{er(j,g|0)}if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}r=1;s=r;i=e;return s|0}}while(0);if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}r=0;s=r;i=e;return s|0}}while(0);r=0;s=r;i=e;return s|0}function d5(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=b;b=c[a+4>>2]|0;if((b|0)>=0){e=b}else{e=-b|0}f=e;if((f|0)>1){g=f}else{g=1}c[d>>2]=g;c[d+8>>2]=bm[c[4008]&1023](c[d>>2]<<2)|0;if((f|0)!=0){g=f-1|0;f=c[d+8>>2]|0;e=c[a+8>>2]|0;a=e;e=a+4|0;h=c[a>>2]|0;if((g|0)!=0){while(1){a=f;f=a+4|0;c[a>>2]=h;a=e;e=a+4|0;h=c[a>>2]|0;a=g-1|0;g=a;if((a|0)==0){break}}}g=f;f=g+4|0;c[g>>2]=h}c[d+4>>2]=b;return}function d6(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=c[g+4>>2]|0;h=c[g+8>>2]|0;g=c[h>>2]|0;j=c[a+4>>2]|0;k=c[a+8>>2]|0;a=c[k>>2]|0;if((j|0)==0){do{if((b|0)==1){l=2033}else{if((b|0)==-1){l=2033;break}else{m=0;break}}}while(0);if((l|0)==2033){m=(g|0)==1}n=m&1;o=n;i=e;return o|0}if((b|0)==0){do{if((j|0)==1){l=2038}else{if((j|0)==-1){l=2038;break}else{p=0;break}}}while(0);if((l|0)==2038){p=(a|0)==1}n=p&1;o=n;i=e;return o|0}if(((g|a)&1|0)==0){n=0;o=n;i=e;return o|0}if((j|0)<0){q=((b|0)<0&1)<<1;j=-j|0}else{q=0}while(1){if((((a|0)==0&1|0)!=0&1|0)==0){break}j=j-1|0;k=k+4|0;a=c[k>>2]|0}p=a;if((((p&255|0)!=0&1|0)!=0&1|0)!=0){r=(d[9872+(p&-p)|0]|0)-2|0}else{m=6;while(1){if((m|0)>=30){break}p=p>>>8;if((((p&255|0)!=0&1|0)!=0&1|0)!=0){l=2064;break}m=m+8|0}r=m+(d[9872+(p&-p)|0]|0)|0}a=a>>>(r>>>0);do{if((j|0)>1){if(r>>>0<=0){break}p=c[k+4>>2]|0;a=a|p<<32-r;do{if((j|0)==2){if((p>>>(r>>>0)|0)!=0){break}j=1}}while(0)}}while(0);if((b|0)<0){q=q^a;b=-b|0}while(1){if((((g|0)==0&1|0)!=0&1|0)==0){break}b=b-1|0;h=h+4|0;g=c[h>>2]|0}if((b|0)<(j|0)){p=h;h=k;k=p;p=b;b=j;j=p;p=g;g=a;a=p;p=a;if((((p&255|0)!=0&1|0)!=0&1|0)!=0){r=(d[9872+(p&-p)|0]|0)-2|0}else{m=6;while(1){if((m|0)>=30){break}p=p>>>8;if((((p&255|0)!=0&1|0)!=0&1|0)!=0){l=2105;break}m=m+8|0}r=m+(d[9872+(p&-p)|0]|0)|0}a=a>>>(r>>>0);do{if((j|0)>1){if(r>>>0<=0){break}p=c[k+4>>2]|0;a=a|p<<32-r;do{if((j|0)==2){if((p>>>(r>>>0)|0)!=0){break}j=1}}while(0)}}while(0);q=q^g&a}if((j|0)==1){q=q^r<<1&(g>>>1^g);if((a|0)==1){n=1-(q&2)|0;o=n;i=e;return o|0}if((b|0)>1){p=h;m=b;l=a;if((m|0)>=10){g=eU(p,m,l)|0}else{q=q^l;g=eX(p,m,l,0)|0}}n=fG(g,a,q)|0;o=n;i=e;return o|0}c[f>>2]=0;if((b|0)>=(j<<1|0)){if(((j+((b-j|0)+1|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){l=i;i=i+(j+((b-j|0)+1|0)<<2)|0;i=i+7>>3<<3;s=l}else{s=dD(f,j+((b-j|0)+1|0)<<2)|0}t=s;u=t+(j<<2)|0}else{if(((j+j<<2>>>0<65536&1|0)!=0&1|0)!=0){s=i;i=i+(j+j<<2)|0;i=i+7>>3<<3;v=s}else{v=dD(f,j+j<<2)|0}t=v;u=t+(j<<2)|0}if((b|0)>(j|0)){fF(u,t,0,h,b,k,j)}else{if((j|0)!=0){b=j-1|0;v=t;s=h;h=s;s=h+4|0;l=c[h>>2]|0;if((b|0)!=0){while(1){h=v;v=h+4|0;c[h>>2]=l;h=s;s=h+4|0;l=c[h>>2]|0;h=b-1|0;b=h;if((h|0)==0){break}}}b=v;v=b+4|0;c[b>>2]=l}}if(r>>>0>0){q=q^r<<1&(g>>>1^g);g=u;l=k;b=j;v=r;eQ(g,l,b,v);j=j-((c[t+(j-1<<2)>>2]|c[u+(j-1<<2)>>2]|0)==0&1)|0}else{if((j|0)!=0){v=j-1|0;b=u;l=k;k=l;l=k+4|0;g=c[k>>2]|0;if((v|0)!=0){while(1){k=b;b=k+4|0;c[k>>2]=g;k=l;l=k+4|0;g=c[k>>2]|0;k=v-1|0;v=k;if((k|0)==0){break}}}v=b;b=v+4|0;c[v>>2]=g}}g=fK(t,u,j,d7(c[t>>2]|0,a,q>>1&1)|0)|0;if((((c[f>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[f>>2]|0)}n=g;o=n;i=e;return o|0}function d7(a,b,c){a=a|0;b=b|0;c=c|0;return(((a&3)<<2)+(b&2)|0)+c|0}function d8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+24|0;f=e|0;g=e+16|0;h=a;a=b;b=d;c[g>>2]=0;if((c[b+4>>2]|0)>=0){j=c[b+4>>2]|0}else{j=-(c[b+4>>2]|0)|0}d=j;if((h|0)==(b|0)){if(((d<<2>>>0<65536&1|0)!=0&1|0)!=0){j=i;i=i+(d<<2)|0;i=i+7>>3<<3;k=j}else{k=dD(g,d<<2)|0}c[(f|0)+8>>2]=k;if((d|0)!=0){k=d-1|0;j=c[(f|0)+8>>2]|0;l=c[b+8>>2]|0;m=l;l=m+4|0;n=c[m>>2]|0;if((k|0)!=0){while(1){m=j;j=m+4|0;c[m>>2]=n;m=l;l=m+4|0;n=c[m>>2]|0;m=k-1|0;k=m;if((m|0)==0){break}}}k=j;j=k+4|0;c[k>>2]=n}}else{c[(f|0)+8>>2]=c[b+8>>2]|0}c[(f|0)+4>>2]=d;b=f|0;eA(h,a,b);if((c[h+4>>2]|0)<0){dM(h,h,b)}if((((c[g>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[g>>2]|0)}i=e;return}function d9(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;d=c[a+4>>2]|0;h=c[b+4>>2]|0;j=d^h;if((d|0)>=0){k=d}else{k=-d|0}d=k;if((h|0)>=0){l=h}else{l=-h|0}h=l;if((d|0)<(h|0)){l=a;a=b;b=l;l=d;d=h;h=l}if((h|0)==0){c[g+4>>2]=0;i=e;return}if((h|0)==1){if((((d+1|0)>(c[g>>2]|0)&1|0)!=0&1|0)!=0){m=eo(g,d+1|0)|0}else{m=c[g+8>>2]|0}n=m;o=eK(n,c[a+8>>2]|0,d,c[c[b+8>>2]>>2]|0)|0;c[n+(d<<2)>>2]=o;d=d+((o|0)!=0&1)|0;if((j|0)>=0){p=d}else{p=-d|0}c[g+4>>2]=p;i=e;return}c[f>>2]=0;p=0;m=c[a+8>>2]|0;a=c[b+8>>2]|0;n=c[g+8>>2]|0;b=d+h|0;if((c[g>>2]|0)<(b|0)){do{if((n|0)==(m|0)){q=2262}else{if((n|0)==(a|0)){q=2262;break}bl[c[3848]&1023](n,c[g>>2]<<2);break}}while(0);if((q|0)==2262){p=n;r=c[g>>2]|0}c[g>>2]=b;n=bm[c[4008]&1023](b<<2)|0;c[g+8>>2]=n}else{if((n|0)==(m|0)){if(((d<<2>>>0<65536&1|0)!=0&1|0)!=0){q=i;i=i+(d<<2)|0;i=i+7>>3<<3;s=q}else{s=dD(f,d<<2)|0}m=s;if((n|0)==(a|0)){a=m}if((d|0)!=0){s=d-1|0;q=m;l=n;k=l;l=k+4|0;t=c[k>>2]|0;if((s|0)!=0){while(1){k=q;q=k+4|0;c[k>>2]=t;k=l;l=k+4|0;t=c[k>>2]|0;k=s-1|0;s=k;if((k|0)==0){break}}}s=q;q=s+4|0;c[s>>2]=t}}else{if((n|0)==(a|0)){if(((h<<2>>>0<65536&1|0)!=0&1|0)!=0){t=i;i=i+(h<<2)|0;i=i+7>>3<<3;u=t}else{u=dD(f,h<<2)|0}a=u;if((h|0)!=0){u=h-1|0;t=a;s=n;q=s;s=q+4|0;l=c[q>>2]|0;if((u|0)!=0){while(1){q=t;t=q+4|0;c[q>>2]=l;q=s;s=q+4|0;l=c[q>>2]|0;q=u-1|0;u=q;if((q|0)==0){break}}}u=t;t=u+4|0;c[u>>2]=l}}}}if((m|0)==(a|0)){fi(n,m,d);o=c[n+(b-1<<2)>>2]|0}else{o=e_(n,m,d,a,h)|0}b=b-((o|0)==0&1)|0;if((j|0)<0){v=-b|0}else{v=b}c[g+4>>2]=v;if((p|0)!=0){bl[c[3848]&1023](p,r<<2)}if((((c[f>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[f>>2]|0)}i=e;return}function ea(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=a;a=b;b=d;if((c[a+4>>2]|0)>=0){f=c[a+4>>2]|0}else{f=-(c[a+4>>2]|0)|0}d=f;f=(b>>>0)/32>>>0;g=d+f|0;if((d|0)==0){g=0}else{if((((g+1|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){h=eo(e,g+1|0)|0}else{h=c[e+8>>2]|0}i=h;h=c[a+8>>2]|0;b=(b>>>0)%32;if((b|0)!=0){j=eP(i+(f<<2)|0,h,d,b)|0;c[i+(g<<2)>>2]=j;g=g+((j|0)!=0&1)|0}else{if((d|0)!=0){j=d-1|0;d=(i+(f<<2)|0)+(j<<2)|0;b=h+(j<<2)|0;h=b;b=h-4|0;k=c[h>>2]|0;if((j|0)!=0){while(1){h=d;d=h-4|0;c[h>>2]=k;h=b;b=h-4|0;k=c[h>>2]|0;h=j-1|0;j=h;if((h|0)==0){break}}}j=d;d=j-4|0;c[j>>2]=k}}if((f|0)!=0){k=i;i=f;while(1){f=k;k=f+4|0;c[f>>2]=0;f=i-1|0;i=f;if((f|0)==0){break}}}}if((c[a+4>>2]|0)>=0){a=g;i=e;k=i+4|0;c[k>>2]=a;return}else{a=-g|0;i=e;k=i+4|0;c[k>>2]=a;return}}function eb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=a;a=b;b=d;d=c[a+4>>2]|0;do{if((d|0)!=0){if((b|0)==0){break}if((d|0)>=0){f=d}else{f=-d|0}g=f;if((b|0)>=0){h=b}else{h=-((b+1|0)-1|0)|0}i=h;if(i>>>0<=4294967295){if((((g+1|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){j=eo(e,g+1|0)|0}else{j=c[e+8>>2]|0}k=j;l=eK(k,c[a+8>>2]|0,g,i)|0;c[k+(g<<2)>>2]=l;g=g+((l|0)!=0&1)|0}if(((d|0)<0&1^(b|0)<0&1|0)!=0){m=-g|0}else{m=g}c[e+4>>2]=m;return}}while(0);c[e+4>>2]=0;return}function ec(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;a=b;b=d;d=c[a+4>>2]|0;do{if((d|0)!=0){if((b|0)==0){break}if((d|0)>=0){f=d}else{f=-d|0}g=f;h=b;if(h>>>0<=4294967295){if((((g+1|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){i=eo(e,g+1|0)|0}else{i=c[e+8>>2]|0}j=i;k=eK(j,c[a+8>>2]|0,g,h)|0;c[j+(g<<2)>>2]=k;g=g+((k|0)!=0&1)|0}if(((d|0)<0&1^b>>>0<0&1|0)!=0){l=-g|0}else{l=g}c[e+4>>2]=l;return}}while(0);c[e+4>>2]=0;return}function ed(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;g=i;i=i+16|0;h=g|0;j=g+8|0;k=a;a=b;b=e;e=f;if((e|0)==0){c[c[k+8>>2]>>2]=1;c[k+4>>2]=1;i=g;return}if((b|0)==0){c[k+4>>2]=0;i=g;return}if((b|0)<0){l=(e&1|0)!=0}else{l=0}f=l&1;if((b|0)>=0){m=b}else{m=-b|0}b=m;m=(c[k+8>>2]|0)==(a|0)&1;l=0;n=c[a>>2]|0;while(1){if((n|0)!=0){break}l=l+e|0;b=b-1|0;o=a+4|0;a=o;n=c[o>>2]|0}o=n;if((((o&255|0)!=0&1|0)!=0&1|0)!=0){p=(d[9872+(o&-o)|0]|0)-2|0}else{q=6;while(1){if((q|0)>=30){break}o=o>>>8;if((((o&255|0)!=0&1|0)!=0&1|0)!=0){r=2433;break}q=q+8|0}p=q+(d[9872+(o&-o)|0]|0)|0}n=n>>>(p>>>0);o=ab(e,p);l=l+((o>>>0)/32>>>0)|0;o=(o>>>0)%32;c[j>>2]=0;q=1;L2978:do{if((b|0)==1){r=2440;break}else{do{if((b|0)==2){s=c[a+4>>2]|0;if((p|0)!=0){n=n|s<<32-p}s=s>>>(p>>>0);if((s|0)==0){b=1;r=2440;break L2978}else{a=h|0;c[h>>2]=n;c[h+4>>2]=s;n=s;break}}else{do{if((m|0)!=0){r=2463}else{if((p|0)!=0){r=2463;break}else{break}}}while(0);if((r|0)==2463){if(((b<<2>>>0<65536&1|0)!=0&1|0)!=0){s=i;i=i+(b<<2)|0;i=i+7>>3<<3;t=s}else{t=dD(j,b<<2)|0}s=t;if((p|0)==0){if((b|0)!=0){u=b-1|0;v=s;w=a;x=w;w=x+4|0;y=c[x>>2]|0;if((u|0)!=0){while(1){x=v;v=x+4|0;c[x>>2]=y;x=w;w=x+4|0;y=c[x>>2]|0;x=u-1|0;u=x;if((x|0)==0){break}}}u=v;v=u+4|0;c[u>>2]=y}}else{eQ(s,a,b,p);b=b-((c[s+(b-1<<2)>>2]|0)==0&1)|0}a=s}n=c[a+(b-1<<2)>>2]|0}}while(0);break}}while(0);if((r|0)==2440){while(1){if(!(n>>>0<=65535)){r=2449;break}if((e&1|0)!=0){q=ab(q,n)}e=e>>>1;if((e|0)==0){r=2447;break}n=ab(n,n)}do{if((o|0)!=0){if((q|0)==1){break}if((q>>>((32-o|0)>>>0)|0)!=0){break}q=q<<o;o=0}}while(0)}p=n;if(p>>>0<65536){z=p>>>0<256?1:9}else{z=p>>>0<16777216?17:25}t=z;z=(33-t|0)-(d[9872+(p>>>(t>>>0))|0]|0)|0;t=((ab((b<<5)-z|0,e)>>>0)/32>>>0)+5|0;if((((t+l|0)>(c[k>>2]|0)&1|0)!=0&1|0)!=0){A=eo(k,t+l|0)|0}else{A=c[k+8>>2]|0}p=A;if((l|0)!=0){A=p;m=l;while(1){h=A;A=h+4|0;c[h>>2]=0;h=m-1|0;m=h;if((h|0)==0){break}}}p=p+(l<<2)|0;if((e|0)==0){c[p>>2]=q;B=1}else{m=t;do{if((b|0)<=1){r=2516}else{if((e&1|0)==0){r=2516;break}else{break}}}while(0);if((r|0)==2516){m=(m|0)/2&-1}if(((m<<2>>>0<65536&1|0)!=0&1|0)!=0){r=i;i=i+(m<<2)|0;i=i+7>>3<<3;C=r}else{C=dD(j,m<<2)|0}m=C;C=e;if(C>>>0<65536){D=C>>>0<256?1:9}else{D=C>>>0<16777216?17:25}r=D;z=(33-r|0)-(d[9872+(C>>>(r>>>0))|0]|0)|0;r=(32-z|0)-2|0;if((b|0)==1){if((r&1|0)==0){z=p;p=m;m=z}c[p>>2]=n;B=1;while(1){if(!((r|0)>=0)){break}fi(m,p,B);B=B<<1;B=B-((c[m+(B-1<<2)>>2]|0)==0&1)|0;z=p;p=m;m=z;if((e&1<<r|0)!=0){z=eK(p,p,B,n)|0;c[p+(B<<2)>>2]=z;B=B+((z|0)!=0&1)|0}r=r-1|0}if((q|0)!=1){n=eK(p,p,B,q)|0;c[p+(B<<2)>>2]=n;B=B+((n|0)!=0&1)|0}}else{n=e;q=0;while(1){q=q^-1771476586>>>((n&31)>>>0);n=n>>>5;if((n|0)==0){break}}if(((q&1^r)&1|0)!=0){q=p;p=m;m=q}if((b|0)!=0){q=b-1|0;n=p;z=a;C=z;z=C+4|0;D=c[C>>2]|0;if((q|0)!=0){while(1){C=n;n=C+4|0;c[C>>2]=D;C=z;z=C+4|0;D=c[C>>2]|0;C=q-1|0;q=C;if((C|0)==0){break}}}q=n;n=q+4|0;c[q>>2]=D}B=b;while(1){if(!((r|0)>=0)){break}fi(m,p,B);B=B<<1;B=B-((c[m+(B-1<<2)>>2]|0)==0&1)|0;D=p;p=m;m=D;if((e&1<<r|0)!=0){B=B+(b-((e_(m,p,B,a,b)|0)==0&1)|0)|0;D=p;p=m;m=D}r=r-1|0}}}if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}if((o|0)!=0){j=eP(p,p,B,o)|0;c[p+(B<<2)>>2]=j;B=B+((j|0)!=0&1)|0}B=B+l|0;if((f|0)!=0){E=-B|0}else{E=B}c[k+4>>2]=E;i=g;return}function ee(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a;a=b;b=c[a+4>>2]|0;if((a|0)==(d|0)){e=b;f=-e|0;g=d;h=g+4|0;c[h>>2]=f;return}if((b|0)>=0){i=b}else{i=-b|0}j=i;if((((j|0)>(c[d>>2]|0)&1|0)!=0&1|0)!=0){k=eo(d,j)|0}else{k=c[d+8>>2]|0}if((j|0)!=0){i=j-1|0;j=k;k=c[a+8>>2]|0;a=k;k=a+4|0;l=c[a>>2]|0;if((i|0)!=0){while(1){a=j;j=a+4|0;c[a>>2]=l;a=k;k=a+4|0;l=c[a>>2]|0;a=i-1|0;i=a;if((a|0)==0){break}}}i=j;j=i+4|0;c[i>>2]=l}e=b;f=-e|0;g=d;h=g+4|0;c[h>>2]=f;return}function ef(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+8|0;h=g|0;j=b;b=e;e=f;f=c[e+4>>2]|0;if((j|0)==0){j=c[o>>2]|0}if((b|0)>=0){k=5056;if((b|0)<=1){b=10}else{do{if((b|0)>36){k=7592;if((b|0)<=62){break}l=0;m=l;i=g;return m|0}}while(0)}}else{b=-b|0;do{if((b|0)<=1){b=10}else{if((b|0)<=36){break}l=0;m=l;i=g;return m|0}}while(0);k=6800}n=0;if((f|0)<0){p=j;aM(45,p|0);f=-f|0;n=1}c[h>>2]=0;p=c[(10008+(b*20&-1)|0)+4>>2]|0;q=f<<5;r=p&65535;s=p>>>16;p=q&65535;t=q>>>16;q=ab(r,p);u=ab(r,t);r=ab(s,p);p=ab(s,t);u=u+(q>>>16)|0;u=u+r|0;if(u>>>0<r>>>0){p=p+65536|0}r=p+(u>>>16)|0;r=r+3|0;if(((r>>>0<65536&1|0)!=0&1|0)!=0){u=i;i=i+r|0;i=i+7>>3<<3;v=u}else{v=dD(h,r)|0}u=v;v=c[e+8>>2]|0;if((b&b-1|0)!=0){if((((f|1)<<2>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+((f|1)<<2)|0;i=i+7>>3<<3;w=p}else{w=dD(h,(f|1)<<2)|0}v=w;if((f|0)!=0){w=f-1|0;p=v;q=c[e+8>>2]|0;e=q;q=e+4|0;t=c[e>>2]|0;if((w|0)!=0){while(1){e=p;p=e+4|0;c[e>>2]=t;e=q;q=e+4|0;t=c[e>>2]|0;e=w-1|0;w=e;if((e|0)==0){break}}}w=p;p=w+4|0;c[w>>2]=t}}r=fo(u,b,v,f)|0;f=0;while(1){if(f>>>0>=r>>>0){break}a[u+f|0]=a[k+(d[u+f|0]|0)|0]|0;f=f+1|0}a[u+r|0]=0;n=n+(aR(u|0,1,r|0,j|0)|0)|0;if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}if((a3(j|0)|0)!=0){x=0}else{x=n}l=x;m=l;i=g;return m|0}function eg(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+4>>2]|0;d=(a|0)<0?-1:0;if((((a|0)>0&1|0)!=0&1|0)==0){e=d;return e|0}d=fv(c[b+8>>2]|0,a)|0;e=d;return e|0}function eh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=b;b=d;d=b;if((d|0)==2){d9(e,a,a);return}else if((d|0)==1){er(e,a);return}else if((d|0)==0){eq(e,1);return}else{ed(e,c[a+8>>2]|0,c[a+4>>2]|0,b);return}}function ei(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=i;i=i+24|0;h=g|0;j=g+16|0;k=a;a=b;b=e;e=f;if((c[e+4>>2]|0)>=0){l=c[e+4>>2]|0}else{l=-(c[e+4>>2]|0)|0}f=l;if((((f|0)==0&1|0)!=0&1|0)!=0){dH()}l=c[e+8>>2]|0;c[j>>2]=0;m=c[b+4>>2]|0;do{if((((m|0)<=0&1|0)!=0&1|0)!=0){if((m|0)==0){if((f|0)!=1){n=1}else{n=(c[l>>2]|0)!=1}c[k+4>>2]=n&1;c[c[k+8>>2]>>2]=1;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=g;return}o=h|0;c[o>>2]=f+1|0;if(((f+1<<2>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+(f+1<<2)|0;i=i+7>>3<<3;q=p}else{q=dD(j,f+1<<2)|0}c[o+8>>2]=q;if(((((d4(h|0,a,e)|0)!=0^1)&1|0)!=0&1|0)!=0){dH()}else{a=h|0;m=-m|0;break}}}while(0);h=m;if((c[a+4>>2]|0)>=0){r=c[a+4>>2]|0}else{r=-(c[a+4>>2]|0)|0}m=r;if((((m|0)==0&1|0)!=0&1|0)!=0){c[k+4>>2]=0;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=g;return}r=c[b+8>>2]|0;if((h|0)==1){s=(c[r>>2]|0)==1}else{s=0}if(((s&1|0)!=0&1|0)!=0){if(((f<<2>>>0<65536&1|0)!=0&1|0)!=0){s=i;i=i+(f<<2)|0;i=i+7>>3<<3;t=s}else{t=dD(j,f<<2)|0}u=t;t=c[a+8>>2]|0;if((m|0)>=(f|0)){if((((m-f|0)+1<<2>>>0<65536&1|0)!=0&1|0)!=0){s=i;i=i+((m-f|0)+1<<2)|0;i=i+7>>3<<3;v=s}else{v=dD(j,(m-f|0)+1<<2)|0}fF(v,u,0,t,m,l,f);w=f;while(1){if((w|0)<=0){break}if((c[u+(w-1<<2)>>2]|0)!=0){x=2785;break}w=w-1|0}do{if((c[a+4>>2]|0)<0){if((w|0)==0){break}eM(u,l,f,u,w);w=f;while(1){if((w|0)<=0){break}if((c[u+(w-1<<2)>>2]|0)!=0){x=2794;break}w=w-1|0}}}while(0)}else{if((c[a+4>>2]|0)<0){v=u;s=l;b=f;q=t;n=m;eM(v,s,b,q,n);w=f;w=w-((c[u+(w-1<<2)>>2]|0)==0&1)|0}else{if((m|0)!=0){n=m-1|0;q=u;b=t;s=b;b=s+4|0;v=c[s>>2]|0;if((n|0)!=0){while(1){s=q;q=s+4|0;c[s>>2]=v;s=b;b=s+4|0;v=c[s>>2]|0;s=n-1|0;n=s;if((s|0)==0){break}}}n=q;q=n+4|0;c[n>>2]=v}w=m}}}else{v=0;while(1){if((((c[l>>2]|0)==0&1|0)!=0&1|0)==0){break}l=l+4|0;v=v+1|0}n=f-v|0;q=0;if((((c[l>>2]|0)>>>0)%2|0)==0){if(((n<<2>>>0<65536&1|0)!=0&1|0)!=0){b=i;i=i+(n<<2)|0;i=i+7>>3<<3;y=b}else{y=dD(j,n<<2)|0}b=y;y=c[l>>2]|0;if((((y&255|0)!=0&1|0)!=0&1|0)!=0){q=(d[9872+(y&-y)|0]|0)-2|0}else{s=6;while(1){if((s|0)>=30){break}y=y>>>8;if((((y&255|0)!=0&1|0)!=0&1|0)!=0){x=2834;break}s=s+8|0}q=s+(d[9872+(y&-y)|0]|0)|0}eQ(b,l,n,q);n=n-((c[b+(n-1<<2)>>2]|0)==0&1)|0;l=b;v=v+1|0}if((v|0)!=0){if((v|0)>(n|0)){z=v}else{z=n}b=g2(z)|0;if((b|0)>(f<<1|0)){A=b}else{A=f<<1}B=(f*3&-1)+A|0}else{A=g2(n)|0;if((A|0)>(f<<1|0)){C=A}else{C=f<<1}B=f+C|0}if(((B<<2>>>0<65536&1|0)!=0&1|0)!=0){C=i;i=i+(B<<2)|0;i=i+7>>3<<3;D=C}else{D=dD(j,B<<2)|0}B=D;u=B;B=B+(f<<2)|0;t=c[a+8>>2]|0;hG(u,t,m,r,h,l,n,B);w=f;if((v|0)!=0){if((m|0)<(v|0)){if(((v<<2>>>0<65536&1|0)!=0&1|0)!=0){D=i;i=i+(v<<2)|0;i=i+7>>3<<3;E=D}else{E=dD(j,v<<2)|0}D=E;if((m|0)!=0){E=m-1|0;C=D;A=t;b=A;A=b+4|0;z=c[b>>2]|0;if((E|0)!=0){while(1){b=C;C=b+4|0;c[b>>2]=z;b=A;A=b+4|0;z=c[b>>2]|0;b=E-1|0;E=b;if((b|0)==0){break}}}E=C;C=E+4|0;c[E>>2]=z}if((v-m|0)!=0){z=D+(m<<2)|0;E=v-m|0;while(1){m=z;z=m+4|0;c[m>>2]=0;m=E-1|0;E=m;if((m|0)==0){break}}}t=D}D=B;do{if((((c[t>>2]|0)>>>0)%2|0)==0){if((h|0)>1){if((v|0)!=0){E=D;z=v;while(1){m=E;E=m+4|0;c[m>>2]=0;m=z-1|0;z=m;if((m|0)==0){break}}}break}if(!(ab(c[r>>2]|0,4627>>((c[t>>2]&7)<<1)&3)>>>0>=((v-((q|0)!=0&1)<<5)+q|0)>>>0)){x=2913;break}if((v|0)!=0){z=D;E=v;while(1){m=z;z=m+4|0;c[m>>2]=0;m=E-1|0;E=m;if((m|0)==0){break}}}break}else{x=2913}}while(0);if((x|0)==2913){hK(D,t,r,h,v,B+(v<<2)|0)}if((n|0)<(v|0)){if(((v<<2>>>0<65536&1|0)!=0&1|0)!=0){h=i;i=i+(v<<2)|0;i=i+7>>3<<3;F=h}else{F=dD(j,v<<2)|0}h=F;if((n|0)!=0){F=n-1|0;t=h;E=l;z=E;E=z+4|0;m=c[z>>2]|0;if((F|0)!=0){while(1){z=t;t=z+4|0;c[z>>2]=m;z=E;E=z+4|0;m=c[z>>2]|0;z=F-1|0;F=z;if((z|0)==0){break}}}F=t;t=F+4|0;c[F>>2]=m}if((v-n|0)!=0){m=h+(n<<2)|0;F=v-n|0;while(1){t=m;m=t+4|0;c[t>>2]=0;t=F-1|0;F=t;if((t|0)==0){break}}}l=h}h=B+(f<<2)|0;g3(h,l,v,B+(f<<1<<2)|0);if((n|0)>(v|0)){G=v}else{G=n}eM(D,D,v,u,G);G=B+(f<<1<<2)|0;gh(G,h,D,v);if((q|0)!=0){D=G+(v-1<<2)|0;c[D>>2]=c[D>>2]&(1<<q)-1}q=B;if((v|0)>(n|0)){B=q;D=G;h=v;F=l;m=n;e_(B,D,h,F,m)}else{m=q;F=l;l=n;h=G;G=v;e_(m,F,l,h,G)}eL(u,q,f,u,n)}while(1){if((w|0)<=0){break}if((c[u+(w-1<<2)>>2]|0)!=0){x=2962;break}w=w-1|0}do{if((c[r>>2]&1|0)!=0){if((c[a+4>>2]|0)>=0){break}if((w|0)==0){break}eM(u,c[e+8>>2]|0,f,u,w);w=f;while(1){if((w|0)<=0){break}if((c[u+(w-1<<2)>>2]|0)!=0){x=2972;break}w=w-1|0}}}while(0)}if((((w|0)>(c[k>>2]|0)&1|0)!=0&1|0)!=0){x=eo(k,w)|0}else{x=c[k+8>>2]|0}c[k+4>>2]=w;if((w|0)!=0){x=w-1|0;w=c[k+8>>2]|0;k=u;u=k;k=u+4|0;f=c[u>>2]|0;if((x|0)!=0){while(1){u=w;w=u+4|0;c[u>>2]=f;u=k;k=u+4|0;f=c[u>>2]|0;u=x-1|0;x=u;if((u|0)==0){break}}}x=w;w=x+4|0;c[x>>2]=f}if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=g;return}function ej(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;g=i;i=i+40|0;h=g|0;j=g+8|0;k=g+16|0;l=g+32|0;m=a;a=b;b=e;e=f;if(b>>>0>=20){c[l>>2]=b;c[(k|0)+8>>2]=l|0;c[(k|0)+4>>2]=(c[l>>2]|0)!=0&1;ei(m,a,k|0,e);i=g;return}k=c[e+8>>2]|0;if((c[e+4>>2]|0)>=0){n=c[e+4>>2]|0}else{n=-(c[e+4>>2]|0)|0}l=n;if((((l|0)==0&1|0)!=0&1|0)!=0){dH()}if((b|0)==0){if((l|0)==1){o=(c[k>>2]|0)==1}else{o=0}c[m+4>>2]=o?0:1;c[c[m+8>>2]>>2]=1;i=g;return}c[j>>2]=0;o=c[k+(l-1<<2)>>2]|0;if(o>>>0<65536){p=o>>>0<256?1:9}else{p=o>>>0<16777216?17:25}n=p;p=(33-n|0)-(d[9872+(o>>>(n>>>0))|0]|0)|0;p=p|0;if((p|0)!=0){if(((l<<2>>>0<65536&1|0)!=0&1|0)!=0){n=i;i=i+(l<<2)|0;i=i+7>>3<<3;q=n}else{q=dD(j,l<<2)|0}n=q;eP(n,k,l,p);k=n}if((l|0)==1){r=0}else{r=c[k+(l-2<<2)>>2]|0}n=r;r=(c[k+(l-1<<2)>>2]|0)>>>16;q=c[k+(l-1<<2)>>2]&65535;o=((c[k+(l-1<<2)>>2]^-1)>>>0)/(r>>>0)>>>0;f=c[k+(l-1<<2)>>2]^-1;s=f-ab(o,r)|0;f=ab(o,q);s=s<<16|65535;if(s>>>0<f>>>0){o=o-1|0;s=s+(c[k+(l-1<<2)>>2]|0)|0;if(s>>>0>=(c[k+(l-1<<2)>>2]|0)>>>0){if(s>>>0<f>>>0){o=o-1|0;s=s+(c[k+(l-1<<2)>>2]|0)|0}}}s=s-f|0;t=(s>>>0)/(r>>>0)>>>0;u=s-ab(t,r)|0;f=ab(t,q);u=u<<16|65535;if(u>>>0<f>>>0){t=t-1|0;u=u+(c[k+(l-1<<2)>>2]|0)|0;if(u>>>0>=(c[k+(l-1<<2)>>2]|0)>>>0){if(u>>>0<f>>>0){t=t-1|0;u=u+(c[k+(l-1<<2)>>2]|0)|0}}}u=u-f|0;f=o<<16|t;t=ab(c[k+(l-1<<2)>>2]|0,f);t=t+n|0;if(t>>>0<n>>>0){f=f-1|0;o=-(t>>>0>=(c[k+(l-1<<2)>>2]|0)>>>0&1)|0;t=t-(c[k+(l-1<<2)>>2]|0)|0;f=f+o|0;t=t-(o&c[k+(l-1<<2)>>2])|0}o=n;u=f;q=o&65535;r=o>>>16;o=u&65535;s=u>>>16;u=ab(q,o);v=ab(q,s);q=ab(r,o);o=ab(r,s);v=v+(u>>>16)|0;v=v+q|0;if(v>>>0<q>>>0){o=o+65536|0}q=o+(v>>>16)|0;o=(v<<16)+(u&65535)|0;t=t+q|0;if(t>>>0<q>>>0){f=f-1|0;if(((t>>>0>=(c[k+(l-1<<2)>>2]|0)>>>0&1|0)!=0&1|0)!=0){do{if(t>>>0>(c[k+(l-1<<2)>>2]|0)>>>0){w=3061}else{if(o>>>0>=n>>>0){w=3061;break}else{break}}}while(0);if((w|0)==3061){f=f-1|0}}}c[h>>2]=f;if((c[a+4>>2]|0)>=0){x=c[a+4>>2]|0}else{x=-(c[a+4>>2]|0)|0}f=x;x=c[a+8>>2]|0;if((f|0)>(l|0)){if(((l<<2>>>0<65536&1|0)!=0&1|0)!=0){n=i;i=i+(l<<2)|0;i=i+7>>3<<3;y=n}else{y=dD(j,l<<2)|0}n=y;el(n,x,f,k,l,h);x=n;f=l;while(1){if((f|0)<=0){break}if((c[x+(f-1<<2)>>2]|0)!=0){w=3076;break}f=f-1|0}}if((f|0)==0){c[m+4>>2]=0;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=g;return}if((((l<<1)+1<<2>>>0<65536&1|0)!=0&1|0)!=0){n=i;i=i+((l<<1)+1<<2)|0;i=i+7>>3<<3;z=n}else{z=dD(j,(l<<1)+1<<2)|0}n=z;if(((l<<2>>>0<65536&1|0)!=0&1|0)!=0){z=i;i=i+(l<<2)|0;i=i+7>>3<<3;A=z}else{A=dD(j,l<<2)|0}z=A;if(((l+1<<2>>>0<65536&1|0)!=0&1|0)!=0){A=i;i=i+(l+1<<2)|0;i=i+7>>3<<3;B=A}else{B=dD(j,l+1<<2)|0}A=B;if((f|0)!=0){B=f-1|0;y=z;o=x;t=o;o=t+4|0;q=c[t>>2]|0;if((B|0)!=0){while(1){t=y;y=t+4|0;c[t>>2]=q;t=o;o=t+4|0;q=c[t>>2]|0;t=B-1|0;B=t;if((t|0)==0){break}}}B=y;y=B+4|0;c[B>>2]=q}q=f;B=b;y=B;if(y>>>0<65536){C=y>>>0<256?1:9}else{C=y>>>0<16777216?17:25}o=C;C=(33-o|0)-(d[9872+(y>>>(o>>>0))|0]|0)|0;B=B<<C<<1;C=31-C|0;if((C|0)==0){do{if((q|0)==(l|0)){if(!((fw(z,k,l)|0)>=0)){break}eI(z,z,k,l)}}while(0)}else{while(1){fi(n,z,q);o=q<<1;o=o-((c[n+(o-1<<2)>>2]|0)==0&1)|0;if((o|0)<(l|0)){if((o|0)!=0){y=o-1|0;t=z;u=n;v=u;u=v+4|0;s=c[v>>2]|0;if((y|0)!=0){while(1){v=t;t=v+4|0;c[v>>2]=s;v=u;u=v+4|0;s=c[v>>2]|0;v=y-1|0;y=v;if((v|0)==0){break}}}y=t;t=y+4|0;c[y>>2]=s}q=o}else{em(n,o,k,l,h,A);if((l|0)!=0){y=l-1|0;u=z;v=n;r=v;v=r+4|0;D=c[r>>2]|0;if((y|0)!=0){while(1){r=u;u=r+4|0;c[r>>2]=D;r=v;v=r+4|0;D=c[r>>2]|0;r=y-1|0;y=r;if((r|0)==0){break}}}y=u;u=y+4|0;c[y>>2]=D}q=l}if((B|0)<0){y=n;v=z;s=q;t=x;r=f;e_(y,v,s,t,r);o=q+f|0;o=o-((c[n+(o-1<<2)>>2]|0)==0&1)|0;if((o|0)<(l|0)){if((o|0)!=0){r=o-1|0;t=z;s=n;v=s;s=v+4|0;y=c[v>>2]|0;if((r|0)!=0){while(1){v=t;t=v+4|0;c[v>>2]=y;v=s;s=v+4|0;y=c[v>>2]|0;v=r-1|0;r=v;if((v|0)==0){break}}}r=t;t=r+4|0;c[r>>2]=y}q=o}else{em(n,o,k,l,h,A);if((l|0)!=0){r=l-1|0;s=z;D=n;u=D;D=u+4|0;v=c[u>>2]|0;if((r|0)!=0){while(1){u=s;s=u+4|0;c[u>>2]=v;u=D;D=u+4|0;v=c[u>>2]|0;u=r-1|0;r=u;if((u|0)==0){break}}}r=s;s=r+4|0;c[r>>2]=v}q=l}}B=B<<1;C=C-1|0;if((C|0)==0){break}}}if((p|0)!=0){C=eP(n,z,q,p)|0;c[n+(q<<2)>>2]=C;q=q+((C|0)!=0&1)|0;if((q|0)<(l|0)){if((q|0)!=0){C=q-1|0;B=z;f=n;x=f;f=x+4|0;r=c[x>>2]|0;if((C|0)!=0){while(1){x=B;B=x+4|0;c[x>>2]=r;x=f;f=x+4|0;r=c[x>>2]|0;x=C-1|0;C=x;if((x|0)==0){break}}}C=B;B=C+4|0;c[C>>2]=r}}else{em(n,q,k,l,h,A);if((l|0)!=0){A=l-1|0;h=z;r=n;n=r;r=n+4|0;C=c[n>>2]|0;if((A|0)!=0){while(1){n=h;h=n+4|0;c[n>>2]=C;n=r;r=n+4|0;C=c[n>>2]|0;n=A-1|0;A=n;if((n|0)==0){break}}}A=h;h=A+4|0;c[A>>2]=C}q=l}eQ(z,z,q,p)}while(1){if((q|0)<=0){break}if((c[z+(q-1<<2)>>2]|0)!=0){w=3245;break}q=q-1|0}do{if((b&1|0)!=0){if((c[a+4>>2]|0)>=0){break}if((q|0)==0){break}k=c[e+8>>2]|0;eM(z,k,l,z,q);q=l;while(1){if((q|0)<=0){break}if((c[z+(q-1<<2)>>2]|0)!=0){w=3255;break}q=q-1|0}}}while(0);if((((q|0)>(c[m>>2]|0)&1|0)!=0&1|0)!=0){w=eo(m,q)|0}else{w=c[m+8>>2]|0}c[m+4>>2]=q;if((q|0)!=0){w=q-1|0;q=c[m+8>>2]|0;m=z;z=m;m=z+4|0;l=c[z>>2]|0;if((w|0)!=0){while(1){z=q;q=z+4|0;c[z>>2]=l;z=m;m=z+4|0;l=c[z>>2]|0;z=w-1|0;w=z;if((z|0)==0){break}}}w=q;q=w+4|0;c[w>>2]=l}if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=g;return}function ek(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=3296;break}if((c[d+(a<<2)>>2]|0)!=0){e=3293;break}a=a-1|0}if((e|0)==3293){a=0;d=a;return d|0}else if((e|0)==3296){a=1;d=a;return d|0}return 0}function el(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;i=i+8|0;j=h|0;k=a;a=d;d=e;e=f;f=g;c[j>>2]=0;if(((a<<2>>>0<65536&1|0)!=0&1|0)!=0){g=i;i=i+(a<<2)|0;i=i+7>>3<<3;l=g}else{l=dD(j,a<<2)|0}g=l;if((((a-e|0)+1<<2>>>0<65536&1|0)!=0&1|0)!=0){l=i;i=i+((a-e|0)+1<<2)|0;i=i+7>>3<<3;m=l}else{m=dD(j,(a-e|0)+1<<2)|0}l=m;if((a|0)!=0){m=a-1|0;n=g;o=b;b=o;o=b+4|0;p=c[b>>2]|0;if((m|0)!=0){while(1){b=n;n=b+4|0;c[b>>2]=p;b=o;o=b+4|0;p=c[b>>2]|0;b=m-1|0;m=b;if((b|0)==0){break}}}m=n;n=m+4|0;c[m>>2]=p}em(g,a,d,e,f,l);if((e|0)!=0){l=e-1|0;e=k;k=g;g=k;k=g+4|0;f=c[g>>2]|0;if((l|0)!=0){while(1){g=e;e=g+4|0;c[g>>2]=f;g=k;k=g+4|0;f=c[g>>2]|0;g=l-1|0;l=g;if((g|0)==0){break}}}l=e;e=l+4|0;c[l>>2]=f}if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=h;return}function em(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+8|0;j=h|0;k=a;a=b;b=d;d=e;e=f;c[j>>2]=0;f=g;if((d|0)==1){c[k>>2]=eS(f,0,k,a,c[b>>2]|0)|0}else{if((d|0)==2){g=f;l=k;m=k;n=a;o=c[b+4>>2]|0;p=c[b>>2]|0;q=c[e>>2]|0;he(g,l,m,n,o,p,q)}else{do{if((d|0)>=50){if(!((a-d|0)>=50)){r=3351;break}do{if((d|0)>=200){if(!((a|0)>=4e3)){r=3355;break}if(+(d|0)*3600.0+ +(a|0)*200.0>+(d|0)*+(a|0)){r=3355;break}q=ho(a,d,0)|0;if(((q<<2>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+(q<<2)|0;i=i+7>>3<<3;s=p}else{s=dD(j,q<<2)|0}hj(f,k,k,a,b,d,s);break}else{r=3355}}while(0);if((r|0)==3355){q=f;p=k;o=a;n=b;m=d;l=e;hi(q,p,o,n,m,l)}break}else{r=3351}}while(0);if((r|0)==3351){r=f;f=k;k=a;a=b;b=d;d=c[e>>2]|0;hf(r,f,k,a,b,d)}}}if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=h;return}function en(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=a;a=b;b=c[e+8>>2]|0;f=c[e+4>>2]|0;if((f|0)>=0){g=f}else{g=-f|0}e=g;g=(b+(e<<2)|0)-4|0;h=(a>>>0)/32>>>0;i=b+(h<<2)|0;if((h|0)>=(e|0)){if((f|0)>=0){j=-1}else{j=a}k=j;l=k;return l|0}L4138:do{if((a|0)==0){m=3387;break}else{n=c[i>>2]|0;L4141:do{if((f|0)>=0){n=n&-1<<(a>>>0)%32;if((n|0)!=0){m=3390;break L4138}if((i|0)!=(g|0)){break}k=-1;l=k;return l|0}else{do{if((ek(b,h)|0)!=0){if((n|0)==0){break L4141}else{n=n-1|0;break}}}while(0);n=n|(1<<(a>>>0)%32)-1;while(1){if((n|0)!=-1){m=3400;break}if((i|0)==(g|0)){break}i=i+4|0;n=c[i>>2]|0}if((m|0)==3400){n=n^-1;m=3401;break L4138}k=e<<5;l=k;return l|0}}while(0);m=3384;break}}while(0);while(1){if((m|0)==3387){m=0;n=c[i>>2]|0;if((n|0)==0){m=3384;continue}m=3390;continue}else if((m|0)==3384){m=0;i=i+4|0;m=3387;continue}else if((m|0)==3390){m=0;m=3401;continue}else if((m|0)==3401){m=0;break}}e=n;if((((e&255|0)!=0&1|0)!=0&1|0)!=0){o=(d[9872+(e&-e)|0]|0)-2|0}else{n=6;while(1){if((n|0)>=30){break}e=e>>>8;if((((e&255|0)!=0&1|0)!=0&1|0)!=0){m=3409;break}n=n+8|0}o=n+(d[9872+(e&-e)|0]|0)|0}k=(((i-b|0)/4&-1)<<5)+o|0;l=k;return l|0}function eo(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=a;a=b;if((a|0)>1){f=a}else{f=1}a=f;if(((a>>>0>134217727&1|0)!=0&1|0)!=0){f=c[p>>2]|0;aE(f|0,4424,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);aD();return 0;return 0}f=bi[c[3792]&1023](c[e+8>>2]|0,c[e>>2]<<2,a<<2)|0;c[e+8>>2]=f;c[e>>2]=a;if((c[e+4>>2]|0)>=0){g=c[e+4>>2]|0}else{g=-(c[e+4>>2]|0)|0}if((g|0)<=(a|0)){h=f;j=h;i=d;return j|0}c[e+4>>2]=0;h=f;j=h;i=d;return j|0}function ep(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((a|0)>=0){e=a}else{e=-((a+1|0)-1|0)|0}b=e;c[c[d+8>>2]>>2]=b;e=(b|0)!=0&1;if((a|0)>=0){a=e;b=d;f=b+4|0;c[f>>2]=a;return}else{a=-e|0;b=d;f=b+4|0;c[f>>2]=a;return}}function eq(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[c[d+8>>2]>>2]=a;c[d+4>>2]=(a|0)!=0&1;return}function er(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=b;b=c[a+4>>2]|0;if((b|0)>=0){e=b}else{e=-b|0}f=e;if((((f|0)>(c[d>>2]|0)&1|0)!=0&1|0)!=0){g=eo(d,f)|0}else{g=c[d+8>>2]|0}if((f|0)!=0){e=f-1|0;f=g;g=c[a+8>>2]|0;a=g;g=a+4|0;h=c[a>>2]|0;if((e|0)!=0){while(1){a=f;f=a+4|0;c[a>>2]=h;a=g;g=a+4|0;h=c[a>>2]|0;a=e-1|0;e=a;if((a|0)==0){break}}}e=f;f=e+4|0;c[e>>2]=h}c[d+4>>2]=b;return}function es(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+8|0;h=g|0;j=b;b=e;e=f;f=15424;do{if((e|0)>36){f=f+224|0;if((e|0)<=62){break}k=-1;l=k;i=g;return l|0}}while(0);while(1){m=b;b=m+1|0;n=d[m]|0;if((a_(n|0)|0)==0){break}}m=0;if((n|0)==45){m=1;o=b;b=o+1|0;n=d[o]|0}if((e|0)==0){p=10}else{p=e}if((d[f+n|0]|0|0)>=(p|0)){k=-1;l=k;i=g;return l|0}if((e|0)==0){e=10;if((n|0)==48){e=8;p=b;b=p+1|0;n=d[p]|0;do{if((n|0)==120){q=3485}else{if((n|0)==88){q=3485;break}do{if((n|0)==98){q=3488}else{if((n|0)==66){q=3488;break}else{break}}}while(0);if((q|0)==3488){e=2;p=b;b=p+1|0;n=d[p]|0}break}}while(0);if((q|0)==3485){e=16;p=b;b=p+1|0;n=d[p]|0}}}while(1){if((n|0)==48){r=1}else{r=(a_(n|0)|0)!=0}if(!r){break}p=b;b=p+1|0;n=d[p]|0}if((n|0)==0){c[j+4>>2]=0;k=0;l=k;i=g;return l|0}c[h>>2]=0;r=uJ(b-1|0)|0;if((((r+1|0)>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+(r+1|0)|0;i=i+7>>3<<3;s=p}else{s=dD(h,r+1|0)|0}p=s;o=s;s=0;while(1){if(s>>>0>=r>>>0){break}if((a_(n|0)|0)==0){t=d[f+n|0]|0;if((t|0)>=(e|0)){q=3506;break}u=o;o=u+1|0;a[u]=t&255}t=b;b=t+1|0;n=d[t]|0;s=s+1|0}if((q|0)==3506){if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}k=-1;l=k;i=g;return l|0}r=o-p|0;o=c[(10008+(e*20&-1)|0)+8>>2]|0;q=r;s=o&65535;n=o>>>16;o=q&65535;b=q>>>16;q=ab(s,o);f=ab(s,b);s=ab(n,o);o=ab(n,b);f=f+(q>>>16)|0;f=f+s|0;if(f>>>0<s>>>0){o=o+65536|0}s=((o+(f>>>16)<<3>>>0)/32>>>0)+2|0;if((((s|0)>(c[j>>2]|0)&1|0)!=0&1|0)!=0){f=eo(j,s)|0}else{f=c[j+8>>2]|0}s=fr(c[j+8>>2]|0,p,r,e)|0;if((m|0)!=0){v=-s|0}else{v=s}c[j+4>>2]=v;if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}k=0;l=k;i=g;return l|0}function et(a){a=a|0;var b=0;b=a;if((c[b+4>>2]|0)>=0){a=c[b+4>>2]|0;return a|0}else{a=-(c[b+4>>2]|0)|0;return a|0}return 0}function eu(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a;a=b;if((c[e+4>>2]|0)>=0){f=c[e+4>>2]|0}else{f=-(c[e+4>>2]|0)|0}if((f|0)==0){g=1}else{if((c[e+4>>2]|0)>=0){h=c[e+4>>2]|0}else{h=-(c[e+4>>2]|0)|0}f=c[(c[e+8>>2]|0)+(h-1<<2)>>2]|0;if(f>>>0<65536){i=f>>>0<256?1:9}else{i=f>>>0<16777216?17:25}h=i;if((c[e+4>>2]|0)>=0){j=c[e+4>>2]|0}else{j=-(c[e+4>>2]|0)|0}e=(j<<5)-((33-h|0)-(d[9872+(f>>>(h>>>0))|0]|0)|0)|0;if((a&a-1|0)==0){h=c[(10008+(a*20&-1)|0)+12>>2]|0;g=(((e+h|0)-1|0)>>>0)/(h>>>0)>>>0}else{h=(c[(10008+(a*20&-1)|0)+4>>2]|0)+1|0;a=e;e=h&65535;f=h>>>16;h=a&65535;j=a>>>16;a=ab(e,h);i=ab(e,j);e=ab(f,h);h=ab(f,j);i=i+(a>>>16)|0;i=i+e|0;if(i>>>0<e>>>0){h=h+65536|0}g=(h+(i>>>16)|0)+1|0}}return g|0}function ev(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;d=a;a=b;b=c[d+4>>2]|0;e=c[d+8>>2]|0;f=(a>>>0)/32>>>0;g=1<<(a>>>0)%32;if((b|0)>=0){if((f|0)<(b|0)){a=e+(f<<2)|0;c[a>>2]=c[a>>2]|g}else{if((((f+1|0)>(c[d>>2]|0)&1|0)!=0&1|0)!=0){h=eo(d,f+1|0)|0}else{h=c[d+8>>2]|0}e=h;c[d+4>>2]=f+1|0;if((f-b|0)!=0){h=e+(b<<2)|0;a=f-b|0;while(1){i=h;h=i+4|0;c[i>>2]=0;i=a-1|0;a=i;if((i|0)==0){break}}}c[e+(f<<2)>>2]=g}return}b=-b|0;a=0;while(1){if((c[e+(a<<2)>>2]|0)!=0){break}a=a+1|0}if((f|0)>(a|0)){if((f|0)<(b|0)){h=c[e+(f<<2)>>2]&(g^-1);c[e+(f<<2)>>2]=h;if((h|0)==0){j=(f|0)==(b-1|0)}else{j=0}if(((j&1|0)!=0&1|0)!=0){while(1){b=b-1|0;if((b|0)>0){k=(c[e+(b-1<<2)>>2]|0)==0}else{k=0}if(!k){break}}c[d+4>>2]=-b|0}}}else{if((f|0)==(a|0)){c[e+(f<<2)>>2]=((c[e+(f<<2)>>2]|0)-1&(g^-1))+1|0}else{a=e+(f<<2)|0;f=c[a>>2]|0;c[a>>2]=f-g|0;if(f>>>0<g>>>0){while(1){g=a+4|0;a=g;f=c[g>>2]|0;c[g>>2]=f-1|0;if((f|0)!=0){break}}}b=b-((c[e+(b-1<<2)>>2]|0)==0&1)|0;c[d+4>>2]=-b|0}}return}function ew(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=a;a=b;b=d;d=c[a+4>>2]|0;f=-(c[b+4>>2]|0)|0;if((d|0)>=0){g=d}else{g=-d|0}h=g;if((f|0)>=0){i=f}else{i=-f|0}g=i;if((h|0)<(g|0)){i=a;a=b;b=i;i=d;d=f;f=i;i=h;h=g;g=i}i=h+1|0;if((((i|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){j=eo(e,i)|0}else{j=c[e+8>>2]|0}k=j;j=c[a+8>>2]|0;a=c[b+8>>2]|0;if((d^f|0)>=0){f=eL(k,j,h,a,g)|0;c[k+(h<<2)>>2]=f;i=h+f|0;if((d|0)<0){i=-i|0}l=i;m=e;n=m+4|0;c[n>>2]=l;return}if((h|0)!=(g|0)){f=k;b=j;o=h;p=a;q=g;eM(f,b,o,p,q);i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=3651;break}i=i-1|0}if((d|0)<0){i=-i|0}}else{if((fw(j,a,h)|0)<0){q=k;p=a;o=j;b=h;eI(q,p,o,b);i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=3662;break}i=i-1|0}if((d|0)>=0){i=-i|0}}else{eI(k,j,a,h);i=h;while(1){if((i|0)<=0){break}if((c[k+(i-1<<2)>>2]|0)!=0){r=3672;break}i=i-1|0}if((d|0)<0){i=-i|0}}}l=i;m=e;n=m+4|0;c[n>>2]=l;return}function ex(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a;a=b;b=d;d=c[a+4>>2]|0;if((d|0)>=0){f=d}else{f=-d|0}g=f;f=g+1|0;if((((f|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){h=eo(e,f)|0}else{h=c[e+8>>2]|0}i=h;h=c[a+8>>2]|0;if((g|0)==0){c[i>>2]=b;c[e+4>>2]=-((b|0)!=0&1)|0;return}if((d|0)<0){d=eF(i,h,g,b)|0;c[i+(g<<2)>>2]=d;f=-(g+d|0)|0}else{do{if((g|0)==1){if((c[h>>2]|0)>>>0>=b>>>0){j=3699;break}c[i>>2]=b-(c[h>>2]|0)|0;f=-1;break}else{j=3699}}while(0);if((j|0)==3699){j=i;d=h;h=g;a=b;eH(j,d,h,a);f=g-((c[i+(g-1<<2)>>2]|0)==0&1)|0}}c[e+4>>2]=f;return}function ey(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=a;a=b;b=d;d=c[a+4>>2]|0;f=(b>>>0)/32>>>0;if((d|0)>=0){g=d}else{g=-d|0}h=g-f|0;if((h|0)<=0){h=0}else{if((((h|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){i=eo(e,h)|0}else{i=c[e+8>>2]|0}g=i;i=(c[a+8>>2]|0)+(f<<2)|0;b=(b>>>0)%32;if((b|0)!=0){f=g;a=i;j=h;k=b;eQ(f,a,j,k);h=h-((c[g+(h-1<<2)>>2]|0)==0&1)|0}else{if((h|0)!=0){k=h-1|0;j=g;g=i;i=g;g=i+4|0;a=c[i>>2]|0;if((k|0)!=0){while(1){i=j;j=i+4|0;c[i>>2]=a;i=g;g=i+4|0;a=c[i>>2]|0;i=k-1|0;k=i;if((i|0)==0){break}}}k=j;j=k+4|0;c[k>>2]=a}}}if((d|0)>=0){d=h;a=e;k=a+4|0;c[k>>2]=d;return}else{d=-h|0;a=e;k=a+4|0;c[k>>2]=d;return}}function ez(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;if((c[a+4>>2]|0)>=0){f=c[a+4>>2]|0}else{f=-(c[a+4>>2]|0)|0}d=f;f=(b>>>0)/32>>>0;g=c[a+8>>2]|0;if((d|0)>(f|0)){h=c[g+(f<<2)>>2]&(1<<(b>>>0)%32)-1;if((h|0)!=0){i=f+1|0;if((((i|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){b=eo(e,i)|0}else{b=c[e+8>>2]|0}c[(c[e+8>>2]|0)+(f<<2)>>2]=h}else{i=f;while(1){if((i|0)<=0){break}if((c[g+(i-1<<2)>>2]|0)!=0){h=3749;break}i=i-1|0}if((((i|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){g=eo(e,i)|0}else{g=c[e+8>>2]|0}f=i}}else{i=d;if((((i|0)>(c[e>>2]|0)&1|0)!=0&1|0)!=0){d=eo(e,i)|0}else{d=c[e+8>>2]|0}f=i}if((e|0)!=(a|0)){if((f|0)!=0){d=f-1|0;f=c[e+8>>2]|0;g=c[a+8>>2]|0;h=g;g=h+4|0;b=c[h>>2]|0;if((d|0)!=0){while(1){h=f;f=h+4|0;c[h>>2]=b;h=g;g=h+4|0;b=c[h>>2]|0;h=d-1|0;d=h;if((h|0)==0){break}}}d=f;f=d+4|0;c[d>>2]=b}}if((c[a+4>>2]|0)>=0){a=i;b=e;d=b+4|0;c[d>>2]=a;return}else{a=-i|0;b=e;d=b+4|0;c[d>>2]=a;return}}function eA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;d=c[a+4>>2]|0;h=c[b+4>>2]|0;if((d|0)>=0){j=d}else{j=-d|0}k=j;if((h|0)>=0){l=h}else{l=-h|0}h=l;l=(k-h|0)+1|0;if((((h|0)==0&1|0)!=0&1|0)!=0){dH()}if((((h|0)>(c[g>>2]|0)&1|0)!=0&1|0)!=0){m=eo(g,h)|0}else{m=c[g+8>>2]|0}j=m;if((l|0)<=0){if((a|0)!=(g|0)){n=c[a+8>>2]|0;if((k|0)!=0){m=k-1|0;o=j;p=n;q=p;p=q+4|0;r=c[q>>2]|0;if((m|0)!=0){while(1){q=o;o=q+4|0;c[q>>2]=r;q=p;p=q+4|0;r=c[q>>2]|0;q=m-1|0;m=q;if((q|0)==0){break}}}m=o;o=m+4|0;c[m>>2]=r}c[g+4>>2]=c[a+4>>2]|0}i=e;return}c[f>>2]=0;if(((l<<2>>>0<65536&1|0)!=0&1|0)!=0){r=i;i=i+(l<<2)|0;i=i+7>>3<<3;s=r}else{s=dD(f,l<<2)|0}l=s;n=c[a+8>>2]|0;a=c[b+8>>2]|0;if((a|0)==(j|0)){if(((h<<2>>>0<65536&1|0)!=0&1|0)!=0){b=i;i=i+(h<<2)|0;i=i+7>>3<<3;t=b}else{t=dD(f,h<<2)|0}b=t;if((h|0)!=0){t=h-1|0;s=b;r=a;m=r;r=m+4|0;o=c[m>>2]|0;if((t|0)!=0){while(1){m=s;s=m+4|0;c[m>>2]=o;m=r;r=m+4|0;o=c[m>>2]|0;m=t-1|0;t=m;if((m|0)==0){break}}}t=s;s=t+4|0;c[t>>2]=o}a=b}if((n|0)==(j|0)){if(((k<<2>>>0<65536&1|0)!=0&1|0)!=0){b=i;i=i+(k<<2)|0;i=i+7>>3<<3;u=b}else{u=dD(f,k<<2)|0}b=u;if((k|0)!=0){u=k-1|0;o=b;t=n;s=t;t=s+4|0;r=c[s>>2]|0;if((u|0)!=0){while(1){s=o;o=s+4|0;c[s>>2]=r;s=t;t=s+4|0;r=c[s>>2]|0;s=u-1|0;u=s;if((s|0)==0){break}}}u=o;o=u+4|0;c[u>>2]=r}n=b}fF(l,j,0,n,k,a,h);while(1){if((h|0)<=0){break}if((c[j+(h-1<<2)>>2]|0)!=0){a=3869;break}h=h-1|0}if((d|0)>=0){v=h}else{v=-h|0}c[g+4>>2]=v;if((((c[f>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[f>>2]|0)}i=e;return}function eB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;a=b;b=c[d+8>>2]|0;e=c[d+4>>2]|0;if((e|0)>=0){f=e}else{f=-e|0}d=(a>>>0)/32>>>0;g=b+(d<<2)|0;if(d>>>0>=f>>>0){h=(e|0)<0&1;i=h;return i|0}f=c[g>>2]|0;if((e|0)<0){f=-f|0;while(1){if((g|0)==(b|0)){break}g=g-4|0;if((c[g>>2]|0)!=0){j=3891;break}}if((j|0)==3891){f=f-1|0}}h=f>>>((a>>>0)%32>>>0)&1;i=h;return i|0}function eC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;if((a|0)>=0){f=a}else{f=-((a+1|0)-1|0)|0}if((a|0)==0){b=1;c[(e|0)+4>>2]=0}else{c[c[(e|0)+8>>2]>>2]=f;c[(e|0)+4>>2]=(a|0)>0?1:-1}c[c[(e+12|0)+8>>2]>>2]=b;c[(e+12|0)+4>>2]=(b|0)!=0&1;return}function eD(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=b;b=d;d=e;do{if((b|0)<=62){if((b|0)<-36){break}e=0;if((f|0)==0){if((b|0)>=0){g=b}else{g=-b|0}h=c[(10008+(g*20&-1)|0)+4>>2]|0;if((c[(d|0)+4>>2]|0)>=0){i=c[(d|0)+4>>2]|0}else{i=-(c[(d|0)+4>>2]|0)|0}j=i+(c[(d+12|0)+4>>2]|0)<<5;k=h&65535;l=h>>>16;h=j&65535;m=j>>>16;j=ab(k,h);n=ab(k,m);k=ab(l,h);h=ab(l,m);n=n+(j>>>16)|0;n=n+k|0;if(n>>>0<k>>>0){h=h+65536|0}e=h+(n>>>16)|0;e=e+6|0;f=bm[c[4008]&1023](e)|0}d1(f,b,d|0);n=uJ(f|0)|0;do{if((c[(d+12|0)+4>>2]|0)==1){if((c[c[(d+12|0)+8>>2]>>2]|0)==1){break}else{o=3924;break}}else{o=3924}}while(0);if((o|0)==3924){h=n;n=h+1|0;a[f+h|0]=47;h=f+n|0;k=b;j=d+12|0;d1(h,k,j);n=n+(uJ(f+n|0)|0)|0}if((e|0)!=0){if((e|0)!=(n+1|0)){f=bi[c[3792]&1023](f,e,n+1|0)|0}}p=f;q=p;return q|0}}while(0);p=0;q=p;return q|0}function eE(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=e;if((c[b+4>>2]|0)>=0){j=c[b+4>>2]|0}else{j=-(c[b+4>>2]|0)|0}e=j;if((((e|0)==0&1|0)!=0&1|0)!=0){dH()}j=(c[b+8>>2]|0)+(e-1<<2)|0;k=(c[j>>2]&(c[j>>2]|0)-1|0)==0&1;if((k|0)!=0){l=c[b+8>>2]|0;while(1){if(l>>>0>=j>>>0){break}if((c[l>>2]|0)!=0){m=3950;break}l=l+4|0}if((m|0)==3950){k=0}}n=c[j>>2]|0;if(n>>>0<65536){o=n>>>0<256?1:9}else{o=n>>>0<16777216?17:25}j=o;o=(33-j|0)-(d[9872+(n>>>(j>>>0))|0]|0)|0;j=((e<<5)-(o|0)|0)-k|0;if((j|0)==0){c[h+4>>2]=0;i=f;return}c[g>>2]=0;l=c[b+8>>2]|0;if((h|0)==(b|0)){if(((e<<2>>>0<65536&1|0)!=0&1|0)!=0){b=i;i=i+(e<<2)|0;i=i+7>>3<<3;p=b}else{p=dD(g,e<<2)|0}b=p;if((e|0)!=0){p=e-1|0;k=b;n=l;q=n;n=q+4|0;r=c[q>>2]|0;if((p|0)!=0){while(1){q=k;k=q+4|0;c[q>>2]=r;q=n;n=q+4|0;r=c[q>>2]|0;q=p-1|0;p=q;if((q|0)==0){break}}}p=k;k=p+4|0;c[p>>2]=r}l=b}if((((e|0)>(c[h>>2]|0)&1|0)!=0&1|0)!=0){s=eo(h,e)|0}else{s=c[h+8>>2]|0}b=s;c[b+(e-1<<2)>>2]=0;o=80;while(1){s=a;bn[c[(c[s+16>>2]|0)+4>>2]&1023](s,b,j);s=0;r=e;while(1){p=r-1|0;r=p;if(!((p|0)>=0)){break}t=c[b+(r<<2)>>2]|0;u=c[l+(r<<2)>>2]|0;if((t|0)!=(u|0)){m=3993;break}}if((m|0)==3993){m=0;s=t>>>0>u>>>0?1:-1}if((s|0)>=0){r=o-1|0;o=r;v=(r|0)!=0}else{v=0}if(!v){break}}if((o|0)==0){o=b;v=b;u=l;l=e;eI(o,v,u,l)}while(1){if((e|0)<=0){break}if((c[b+(e-1<<2)>>2]|0)!=0){m=4006;break}e=e-1|0}c[h+4>>2]=e;if((((c[g>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[g>>2]|0)}i=f;return}function eF(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=c[a>>2]|0;g=e+d|0;c[f>>2]=g;if(g>>>0<d>>>0){h=1;d=1;while(1){if((d|0)>=(b|0)){break}e=c[a+(d<<2)>>2]|0;g=e+1|0;c[f+(d<<2)>>2]=g;d=d+1|0;if(g>>>0>=1){i=4021;break}}if((i|0)==4021){if((a|0)!=(f|0)){i=d;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2]|0;i=i+1|0}}h=0}}else{if((a|0)!=(f|0)){i=1;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2]|0;i=i+1|0}}h=0}return h|0}function eG(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=0;while(1){g=a;a=g+4|0;h=c[g>>2]|0;g=b;b=g+4|0;i=h+(c[g>>2]|0)|0;g=i+e|0;e=i>>>0<h>>>0&1|g>>>0<i>>>0&1;i=f;f=i+4|0;c[i>>2]=g;g=d-1|0;d=g;if((g|0)==0){break}}return e|0}function eH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=c[a>>2]|0;g=e-d|0;c[f>>2]=g;if(e>>>0<d>>>0){h=1;d=1;while(1){if((d|0)>=(b|0)){break}e=c[a+(d<<2)>>2]|0;g=e-1|0;c[f+(d<<2)>>2]=g;d=d+1|0;if(e>>>0>=1){i=4058;break}}if((i|0)==4058){if((a|0)!=(f|0)){i=d;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2]|0;i=i+1|0}}h=0}}else{if((a|0)!=(f|0)){i=1;while(1){if((i|0)>=(b|0)){break}c[f+(i<<2)>>2]=c[a+(i<<2)>>2]|0;i=i+1|0}}h=0}return h|0}function eI(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=0;while(1){g=a;a=g+4|0;h=c[g>>2]|0;g=b;b=g+4|0;i=h-(c[g>>2]|0)|0;g=i-e|0;e=i>>>0>h>>>0&1|g>>>0>i>>>0&1;i=f;f=i+4|0;c[i>>2]=g;g=d-1|0;d=g;if((g|0)==0){break}}return e|0}function eJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=b;b=d;d=0;while(1){f=a;a=f+4|0;g=c[f>>2]|0;f=e;e=f+4|0;c[f>>2]=(-g|0)-d|0;d=d|(g|0)!=0&1;g=b-1|0;b=g;if((g|0)==0){break}}return d|0}function eK(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=0;while(1){g=a;a=g+4|0;h=c[g>>2]|0;g=d;i=h&65535;j=h>>>16;h=g&65535;k=g>>>16;g=ab(i,h);l=ab(i,k);i=ab(j,h);h=ab(j,k);l=l+(g>>>16)|0;l=l+i|0;if(l>>>0<i>>>0){h=h+65536|0}i=(l<<16)+(g&65535)|0;i=i+e|0;e=(i>>>0<e>>>0&1)+(h+(l>>>16)|0)|0;l=f;f=l+4|0;c[l>>2]=i;i=b-1|0;b=i;if((i|0)==0){break}}return e|0}function eL(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=a;a=b;b=d;d=f;L5048:do{if((d|0)!=0){do{if((eG(g,a,e,d)|0)!=0){while(1){if((d|0)>=(b|0)){h=4111;break}f=(c[a+(d<<2)>>2]|0)+1|0;i=d;d=i+1|0;c[g+(i<<2)>>2]=f;if((f|0)!=0){h=4114;break}}if((h|0)==4114){break}else if((h|0)==4111){j=1;break L5048}}}while(0);h=4116;break}else{h=4116}}while(0);if((h|0)==4116){if((g|0)!=(a|0)){h=d;while(1){if((h|0)>=(b|0)){break}c[g+(h<<2)>>2]=c[a+(h<<2)>>2]|0;h=h+1|0}}j=0}return j|0}function eM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=a;a=b;b=d;d=f;L5076:do{if((d|0)!=0){do{if((eI(g,a,e,d)|0)!=0){while(1){if((d|0)>=(b|0)){h=4132;break}f=c[a+(d<<2)>>2]|0;i=d;d=i+1|0;c[g+(i<<2)>>2]=f-1|0;if((f|0)!=0){h=4135;break}}if((h|0)==4135){break}else if((h|0)==4132){j=1;break L5076}}}while(0);h=4137;break}else{h=4137}}while(0);if((h|0)==4137){if((g|0)!=(a|0)){h=d;while(1){if((h|0)>=(b|0)){break}c[g+(h<<2)>>2]=c[a+(h<<2)>>2]|0;h=h+1|0}}j=0}return j|0}function eN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=0;while(1){g=a;a=g+4|0;h=c[g>>2]|0;g=d;i=h&65535;j=h>>>16;h=g&65535;k=g>>>16;g=ab(i,h);l=ab(i,k);i=ab(j,h);h=ab(j,k);l=l+(g>>>16)|0;l=l+i|0;if(l>>>0<i>>>0){h=h+65536|0}i=(l<<16)+(g&65535)|0;i=i+e|0;e=(i>>>0<e>>>0&1)+(h+(l>>>16)|0)|0;l=c[f>>2]|0;i=l+i|0;e=e+(i>>>0<l>>>0&1)|0;l=f;f=l+4|0;c[l>>2]=i;i=b-1|0;b=i;if((i|0)==0){break}}return e|0}function eO(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=0;while(1){g=a;a=g+4|0;h=c[g>>2]|0;g=d;i=h&65535;j=h>>>16;h=g&65535;k=g>>>16;g=ab(i,h);l=ab(i,k);i=ab(j,h);h=ab(j,k);l=l+(g>>>16)|0;l=l+i|0;if(l>>>0<i>>>0){h=h+65536|0}i=(l<<16)+(g&65535)|0;i=i+e|0;e=(i>>>0<e>>>0&1)+(h+(l>>>16)|0)|0;l=c[f>>2]|0;i=l-i|0;e=e+(i>>>0>l>>>0&1)|0;l=f;f=l+4|0;c[l>>2]=i;i=b-1|0;b=i;if((i|0)==0){break}}return e|0}function eP(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=d;d=e;a=a+(b<<2)|0;f=f+(b<<2)|0;e=32-d|0;g=a-4|0;a=g;h=c[g>>2]|0;g=h>>>(e>>>0);i=h<<d;j=b-1|0;while(1){if((j|0)==0){break}b=a-4|0;a=b;h=c[b>>2]|0;b=f-4|0;f=b;c[b>>2]=i|h>>>(e>>>0);i=h<<d;j=j-1|0}j=f-4|0;f=j;c[j>>2]=i;return g|0}function eQ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=e;e=32-b|0;g=a;a=g+4|0;h=c[g>>2]|0;g=h<<e;i=h>>>(b>>>0);j=d-1|0;while(1){if((j|0)==0){break}d=a;a=d+4|0;h=c[d>>2]|0;d=f;f=d+4|0;c[d>>2]=i|h<<e;i=h>>>(b>>>0);j=j-1|0}c[f>>2]=i;return g|0}function eR(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=b;b=e;e=f;f=c[a>>2]|0;if((b|0)==1){c[g>>2]=(f>>>0)/(e>>>0)>>>0;return}if((e&1|0)==0){h=e;if((((h&255|0)!=0&1|0)!=0&1|0)!=0){i=(d[9872+(h&-h)|0]|0)-2|0}else{j=6;while(1){if((j|0)>=30){break}h=h>>>8;if((((h&255|0)!=0&1|0)!=0&1|0)!=0){k=4217;break}j=j+8|0}i=j+(d[9872+(h&-h)|0]|0)|0}e=e>>>(i>>>0)}else{i=0}h=e;j=d[15904+((h>>>0)/2>>>0&127)|0]|0;j=(j<<1)-ab(ab(j,j),h)|0;j=(j<<1)-ab(ab(j,j),h)|0;h=j;e=e<<0;if((i|0)!=0){j=0;k=0;b=b-1|0;while(1){l=c[a+(k+1<<2)>>2]|0;m=f>>>(i>>>0)|l<<32-i;f=l;l=m;n=l-j|0;o=n;j=n>>>0>l>>>0&1;o=ab(o,h);c[g+(k<<2)>>2]=o;l=o;n=e;p=l&65535;q=l>>>16;l=n&65535;r=n>>>16;n=ab(p,l);s=ab(p,r);p=ab(q,l);l=ab(q,r);s=s+(n>>>16)|0;s=s+p|0;if(s>>>0<p>>>0){l=l+65536|0}t=l+(s>>>16)|0;u=(s<<16)+(n&65535)|0;j=j+t|0;k=k+1|0;if((k|0)>=(b|0)){break}}m=f>>>(i>>>0);o=m-j|0;o=ab(o,h);c[g+(k<<2)>>2]=o;return}else{o=ab(f,h);c[g>>2]=o;k=1;j=0;while(1){m=o;i=e;n=m&65535;s=m>>>16;m=i&65535;l=i>>>16;i=ab(n,m);p=ab(n,l);n=ab(s,m);m=ab(s,l);p=p+(i>>>16)|0;p=p+n|0;if(p>>>0<n>>>0){m=m+65536|0}t=m+(p>>>16)|0;u=(p<<16)+(i&65535)|0;j=j+t|0;f=c[a+(k<<2)>>2]|0;i=f;p=i-j|0;o=p;j=p>>>0>i>>>0&1;o=ab(o,h);c[g+(k<<2)>>2]=o;k=k+1|0;if((k|0)>=(b|0)){break}}return}}function eS(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;h=a;a=b;b=e;e=f;f=g;g=0;i=e+a|0;if((i|0)==0){j=0;k=j;return k|0}f=f<<0;h=h+(i-1<<2)|0;if((f&-2147483648|0)==0){if((e|0)!=0){l=c[b+(e-1<<2)>>2]<<0;do{if(l>>>0<f>>>0){g=l>>>0;m=h;h=m-4|0;c[m>>2]=0;i=i-1|0;if((i|0)!=0){e=e-1|0;break}j=g;k=j;return k|0}}while(0)}m=f;if(m>>>0<65536){n=m>>>0<256?1:9}else{n=m>>>0<16777216?17:25}o=n;n=(33-o|0)-(d[9872+(m>>>(o>>>0))|0]|0)|0;f=f<<n;g=g<<n;o=f>>>16;m=f&65535;p=((f^-1)>>>0)/(o>>>0)>>>0;q=(f^-1)-ab(p,o)|0;r=ab(p,m);q=q<<16|65535;if(q>>>0<r>>>0){p=p-1|0;q=q+f|0;if(q>>>0>=f>>>0){if(q>>>0<r>>>0){p=p-1|0;q=q+f|0}}}q=q-r|0;s=(q>>>0)/(o>>>0)>>>0;t=q-ab(s,o)|0;r=ab(s,m);t=t<<16|65535;if(t>>>0<r>>>0){s=s-1|0;t=t+f|0;if(t>>>0>=f>>>0){if(t>>>0<r>>>0){s=s-1|0;t=t+f|0}}}t=t-r|0;r=p<<16|s;if((e|0)!=0){l=c[b+(e-1<<2)>>2]<<0;g=g|l>>>((32-n|0)>>>0);u=e-2|0;while(1){if(!((u|0)>=0)){break}v=c[b+(u<<2)>>2]<<0;s=l<<n|v>>>((32-n|0)>>>0);p=g;t=r;m=p&65535;o=p>>>16;p=t&65535;q=t>>>16;t=ab(m,p);w=ab(m,q);m=ab(o,p);p=ab(o,q);w=w+(t>>>16)|0;w=w+m|0;if(w>>>0<m>>>0){p=p+65536|0}m=p+(w>>>16)|0;p=(w<<16)+(t&65535)|0;t=p+s|0;m=(m+(g+1|0)|0)+(t>>>0<p>>>0&1)|0;p=t;t=s-ab(m,f)|0;s=-(t>>>0>p>>>0&1)|0;m=m+s|0;t=t+(s&f)|0;if(((t>>>0>=f>>>0&1|0)!=0&1|0)!=0){t=t-f|0;m=m+1|0}g=t;c[h>>2]=m;g=g>>>0;h=h-4|0;l=v;u=u-1|0}m=g;t=r;s=m&65535;p=m>>>16;m=t&65535;w=t>>>16;t=ab(s,m);q=ab(s,w);s=ab(p,m);m=ab(p,w);q=q+(t>>>16)|0;q=q+s|0;if(q>>>0<s>>>0){m=m+65536|0}s=m+(q>>>16)|0;m=(q<<16)+(t&65535)|0;t=m+(l<<n)|0;s=(s+(g+1|0)|0)+(t>>>0<m>>>0&1)|0;m=t;t=(l<<n)-ab(s,f)|0;l=-(t>>>0>m>>>0&1)|0;s=s+l|0;t=t+(l&f)|0;if(((t>>>0>=f>>>0&1|0)!=0&1|0)!=0){t=t-f|0;s=s+1|0}g=t;c[h>>2]=s;g=g>>>0;h=h-4|0}u=a-1|0;while(1){if(!((u|0)>=0)){break}s=g;t=r;l=s&65535;m=s>>>16;s=t&65535;q=t>>>16;t=ab(l,s);w=ab(l,q);l=ab(m,s);s=ab(m,q);w=w+(t>>>16)|0;w=w+l|0;if(w>>>0<l>>>0){s=s+65536|0}l=s+(w>>>16)|0;l=l+(g+1|0)|0;s=ab(-l|0,f);q=-(s>>>0>((w<<16)+(t&65535)|0)>>>0&1)|0;l=l+q|0;s=s+(q&f)|0;g=s;c[h>>2]=l;g=g>>>0;h=h-4|0;u=u-1|0}j=g>>>(n>>>0);k=j;return k|0}if((e|0)!=0){g=c[b+(e-1<<2)>>2]<<0;n=g>>>0>=f>>>0&1;r=h;h=r-4|0;c[r>>2]=n;g=g-(f&-n)|0;g=g>>>0;i=i-1|0;e=e-1|0}do{if(!1){if((i|0)>=0){break}u=e-1|0;while(1){if(!((u|0)>=0)){break}v=c[b+(u<<2)>>2]<<0;n=f>>>16;r=f&65535;l=(g>>>0)/(n>>>0)>>>0;s=g-ab(l,n)|0;q=ab(l,r);s=s<<16|v>>>16;if(s>>>0<q>>>0){l=l-1|0;s=s+f|0;if(s>>>0>=f>>>0){if(s>>>0<q>>>0){l=l-1|0;s=s+f|0}}}s=s-q|0;t=(s>>>0)/(n>>>0)>>>0;w=s-ab(t,n)|0;q=ab(t,r);w=w<<16|v&65535;if(w>>>0<q>>>0){t=t-1|0;w=w+f|0;if(w>>>0>=f>>>0){if(w>>>0<q>>>0){t=t-1|0;w=w+f|0}}}w=w-q|0;c[h>>2]=l<<16|t;g=w;g=g>>>0;h=h-4|0;u=u-1|0}u=a-1|0;while(1){if(!((u|0)>=0)){break}w=f>>>16;t=f&65535;l=(g>>>0)/(w>>>0)>>>0;q=g-ab(l,w)|0;r=ab(l,t);q=q<<16;if(q>>>0<r>>>0){l=l-1|0;q=q+f|0;if(q>>>0>=f>>>0){if(q>>>0<r>>>0){l=l-1|0;q=q+f|0}}}q=q-r|0;n=(q>>>0)/(w>>>0)>>>0;s=q-ab(n,w)|0;r=ab(n,t);s=s<<16;if(s>>>0<r>>>0){n=n-1|0;s=s+f|0;if(s>>>0>=f>>>0){if(s>>>0<r>>>0){n=n-1|0;s=s+f|0}}}s=s-r|0;c[h>>2]=l<<16|n;g=s;g=g>>>0;h=h-4|0;u=u-1|0}j=g;k=j;return k|0}}while(0);i=f>>>16;s=f&65535;n=((f^-1)>>>0)/(i>>>0)>>>0;l=(f^-1)-ab(n,i)|0;r=ab(n,s);l=l<<16|65535;if(l>>>0<r>>>0){n=n-1|0;l=l+f|0;if(l>>>0>=f>>>0){if(l>>>0<r>>>0){n=n-1|0;l=l+f|0}}}l=l-r|0;t=(l>>>0)/(i>>>0)>>>0;w=l-ab(t,i)|0;r=ab(t,s);w=w<<16|65535;if(w>>>0<r>>>0){t=t-1|0;w=w+f|0;if(w>>>0>=f>>>0){if(w>>>0<r>>>0){t=t-1|0;w=w+f|0}}}w=w-r|0;r=n<<16|t;u=e-1|0;while(1){if(!((u|0)>=0)){break}v=c[b+(u<<2)>>2]<<0;e=g;t=r;n=e&65535;w=e>>>16;e=t&65535;s=t>>>16;t=ab(n,e);i=ab(n,s);n=ab(w,e);e=ab(w,s);i=i+(t>>>16)|0;i=i+n|0;if(i>>>0<n>>>0){e=e+65536|0}n=e+(i>>>16)|0;e=(i<<16)+(t&65535)|0;t=e+v|0;n=(n+(g+1|0)|0)+(t>>>0<e>>>0&1)|0;e=t;t=v-ab(n,f)|0;i=-(t>>>0>e>>>0&1)|0;n=n+i|0;t=t+(i&f)|0;if(((t>>>0>=f>>>0&1|0)!=0&1|0)!=0){t=t-f|0;n=n+1|0}g=t;c[h>>2]=n;g=g>>>0;h=h-4|0;u=u-1|0}u=a-1|0;while(1){if(!((u|0)>=0)){break}a=g;v=r;b=a&65535;n=a>>>16;a=v&65535;t=v>>>16;v=ab(b,a);i=ab(b,t);b=ab(n,a);a=ab(n,t);i=i+(v>>>16)|0;i=i+b|0;if(i>>>0<b>>>0){a=a+65536|0}b=a+(i>>>16)|0;b=b+(g+1|0)|0;a=ab(-b|0,f);t=-(a>>>0>((i<<16)+(v&65535)|0)>>>0&1)|0;b=b+t|0;a=a+(t&f)|0;g=a;c[h>>2]=b;g=g>>>0;h=h-4|0;u=u-1|0}j=g;k=j;return k|0}function eT(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;b=b+(d-2<<2)|0;f=c[e+4>>2]|0;k=c[e>>2]|0;e=c[b+4>>2]|0;l=c[b>>2]|0;m=0;do{if(e>>>0>=f>>>0){if(e>>>0<=f>>>0){if(!(l>>>0>=k>>>0)){break}}e=(e-f|0)-(l>>>0<k>>>0&1)|0;l=l-k|0;m=1}}while(0);n=f>>>16;o=f&65535;p=((f^-1)>>>0)/(n>>>0)>>>0;q=(f^-1)-ab(p,n)|0;r=ab(p,o);q=q<<16|65535;if(q>>>0<r>>>0){p=p-1|0;q=q+f|0;if(q>>>0>=f>>>0){if(q>>>0<r>>>0){p=p-1|0;q=q+f|0}}}q=q-r|0;s=(q>>>0)/(n>>>0)>>>0;t=q-ab(s,n)|0;r=ab(s,o);t=t<<16|65535;if(t>>>0<r>>>0){s=s-1|0;t=t+f|0;if(t>>>0>=f>>>0){if(t>>>0<r>>>0){s=s-1|0;t=t+f|0}}}t=t-r|0;r=p<<16|s;s=ab(f,r);s=s+k|0;if(s>>>0<k>>>0){r=r-1|0;p=-(s>>>0>=f>>>0&1)|0;s=s-f|0;r=r+p|0;s=s-(p&f)|0}p=k;t=r;o=p&65535;n=p>>>16;p=t&65535;q=t>>>16;t=ab(o,p);u=ab(o,q);o=ab(n,p);p=ab(n,q);u=u+(t>>>16)|0;u=u+o|0;if(u>>>0<o>>>0){p=p+65536|0}o=p+(u>>>16)|0;p=(u<<16)+(t&65535)|0;s=s+o|0;if(s>>>0<o>>>0){r=r-1|0;if(((s>>>0>=f>>>0&1|0)!=0&1|0)!=0){do{if(s>>>0>f>>>0){v=4490}else{if(p>>>0>=k>>>0){v=4490;break}else{break}}}while(0);if((v|0)==4490){r=r-1|0}}}c[h>>2]=r;j=j+(a<<2)|0;r=(d-2|0)-1|0;while(1){if(!((r|0)>=0)){break}d=c[b-4>>2]|0;p=e;s=c[h>>2]|0;o=p&65535;t=p>>>16;p=s&65535;u=s>>>16;s=ab(o,p);q=ab(o,u);o=ab(t,p);p=ab(t,u);q=q+(s>>>16)|0;q=q+o|0;if(q>>>0<o>>>0){p=p+65536|0}o=p+(q>>>16)|0;p=(q<<16)+(s&65535)|0;s=p+l|0;o=(o+e|0)+(s>>>0<p>>>0&1)|0;p=s;e=l-ab(f,o)|0;e=(e-f|0)-(d>>>0<k>>>0&1)|0;l=d-k|0;d=k;s=o;q=d&65535;u=d>>>16;d=s&65535;t=s>>>16;s=ab(q,d);n=ab(q,t);q=ab(u,d);d=ab(u,t);n=n+(s>>>16)|0;n=n+q|0;if(n>>>0<q>>>0){d=d+65536|0}q=(n<<16)+(s&65535)|0;e=(e-(d+(n>>>16)|0)|0)-(l>>>0<q>>>0&1)|0;l=l-q|0;o=o+1|0;q=-(e>>>0>=p>>>0&1)|0;o=o+q|0;p=l+(q&k)|0;e=(e+(q&f)|0)+(p>>>0<l>>>0&1)|0;l=p;if(((e>>>0>=f>>>0&1|0)!=0&1|0)!=0){do{if(e>>>0>f>>>0){v=4516}else{if(l>>>0>=k>>>0){v=4516;break}else{break}}}while(0);if((v|0)==4516){v=0;o=o+1|0;e=(e-f|0)-(l>>>0<k>>>0&1)|0;l=l-k|0}}b=b-4|0;c[j+(r<<2)>>2]=o;r=r-1|0}if((((a|0)!=0&1|0)!=0&1|0)==0){w=e;x=b;y=x+4|0;c[y>>2]=w;z=l;A=b;B=A|0;c[B>>2]=z;C=m;i=g;return C|0}j=j+(-a<<2)|0;r=a-1|0;while(1){if(!((r|0)>=0)){break}a=e;p=c[h>>2]|0;q=a&65535;n=a>>>16;a=p&65535;d=p>>>16;p=ab(q,a);s=ab(q,d);q=ab(n,a);a=ab(n,d);s=s+(p>>>16)|0;s=s+q|0;if(s>>>0<q>>>0){a=a+65536|0}q=a+(s>>>16)|0;a=(s<<16)+(p&65535)|0;p=a+l|0;q=(q+e|0)+(p>>>0<a>>>0&1)|0;a=p;e=l-ab(f,q)|0;e=(e-f|0)-(0<k>>>0&1)|0;l=-k|0;p=k;s=q;d=p&65535;n=p>>>16;p=s&65535;t=s>>>16;s=ab(d,p);u=ab(d,t);d=ab(n,p);p=ab(n,t);u=u+(s>>>16)|0;u=u+d|0;if(u>>>0<d>>>0){p=p+65536|0}d=(u<<16)+(s&65535)|0;e=(e-(p+(u>>>16)|0)|0)-(l>>>0<d>>>0&1)|0;l=l-d|0;q=q+1|0;d=-(e>>>0>=a>>>0&1)|0;q=q+d|0;a=l+(d&k)|0;e=(e+(d&f)|0)+(a>>>0<l>>>0&1)|0;l=a;if(((e>>>0>=f>>>0&1|0)!=0&1|0)!=0){do{if(e>>>0>f>>>0){v=4546}else{if(l>>>0>=k>>>0){v=4546;break}else{break}}}while(0);if((v|0)==4546){v=0;q=q+1|0;e=(e-f|0)-(l>>>0<k>>>0&1)|0;l=l-k|0}}c[j+(r<<2)>>2]=q;r=r-1|0}w=e;x=b;y=x+4|0;c[y>>2]=w;z=l;A=b;B=A|0;c[B>>2]=z;C=m;i=g;return C|0}function eU(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=a;a=b;b=c;if((a|0)==0){e=0;f=e;return f|0}if((((b&-2147483648|0)!=0&1|0)!=0&1|0)!=0){e=eV(d,a,b)|0;f=e;return f|0}else{e=eW(d,a,b)|0;f=e;return f|0}return 0}function eV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=a;a=b;b=d;b=b<<0;d=c[e+(a-1<<2)>>2]<<0;if(d>>>0>=b>>>0){d=d-b|0}d=d>>>0;a=a-1|0;if((a|0)==0){f=d;g=f;return g|0}h=b>>>16;i=b&65535;j=((b^-1)>>>0)/(h>>>0)>>>0;k=(b^-1)-ab(j,h)|0;l=ab(j,i);k=k<<16|65535;if(k>>>0<l>>>0){j=j-1|0;k=k+b|0;if(k>>>0>=b>>>0){if(k>>>0<l>>>0){j=j-1|0;k=k+b|0}}}k=k-l|0;m=(k>>>0)/(h>>>0)>>>0;n=k-ab(m,h)|0;l=ab(m,i);n=n<<16|65535;if(n>>>0<l>>>0){m=m-1|0;n=n+b|0;if(n>>>0>=b>>>0){if(n>>>0<l>>>0){m=m-1|0;n=n+b|0}}}n=n-l|0;l=j<<16|m;m=a-1|0;while(1){if(!((m|0)>=0)){break}a=c[e+(m<<2)>>2]<<0;j=d;n=l;i=j&65535;h=j>>>16;j=n&65535;k=n>>>16;n=ab(i,j);o=ab(i,k);i=ab(h,j);j=ab(h,k);o=o+(n>>>16)|0;o=o+i|0;if(o>>>0<i>>>0){j=j+65536|0}i=j+(o>>>16)|0;j=(o<<16)+(n&65535)|0;n=j+a|0;i=(i+(d+1|0)|0)+(n>>>0<j>>>0&1)|0;j=n;n=a-ab(i,b)|0;n=n+(-(n>>>0>j>>>0&1)&b)|0;if(((n>>>0>=b>>>0&1|0)!=0&1|0)!=0){n=n-b|0}d=n;d=d>>>0;m=m-1|0}f=d;g=f;return g|0}function eW(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=a;a=b;b=e;b=b<<0;e=c[f+(a-1<<2)>>2]<<0;do{if(e>>>0<b>>>0){e=e>>>0;a=a-1|0;if((a|0)!=0){break}g=e;h=g;return h|0}else{e=0}}while(0);i=b;if(i>>>0<65536){j=i>>>0<256?1:9}else{j=i>>>0<16777216?17:25}k=j;j=(33-k|0)-(d[9872+(i>>>(k>>>0))|0]|0)|0;b=b<<j;k=c[f+(a-1<<2)>>2]<<0;e=e<<j|k>>>((32-j|0)>>>0);i=b>>>16;l=b&65535;m=((b^-1)>>>0)/(i>>>0)>>>0;n=(b^-1)-ab(m,i)|0;o=ab(m,l);n=n<<16|65535;if(n>>>0<o>>>0){m=m-1|0;n=n+b|0;if(n>>>0>=b>>>0){if(n>>>0<o>>>0){m=m-1|0;n=n+b|0}}}n=n-o|0;p=(n>>>0)/(i>>>0)>>>0;q=n-ab(p,i)|0;o=ab(p,l);q=q<<16|65535;if(q>>>0<o>>>0){p=p-1|0;q=q+b|0;if(q>>>0>=b>>>0){if(q>>>0<o>>>0){p=p-1|0;q=q+b|0}}}q=q-o|0;o=m<<16|p;p=a-2|0;while(1){if(!((p|0)>=0)){break}a=c[f+(p<<2)>>2]<<0;m=k<<j|a>>>((32-j|0)>>>0);q=e;l=o;i=q&65535;n=q>>>16;q=l&65535;r=l>>>16;l=ab(i,q);s=ab(i,r);i=ab(n,q);q=ab(n,r);s=s+(l>>>16)|0;s=s+i|0;if(s>>>0<i>>>0){q=q+65536|0}i=q+(s>>>16)|0;q=(s<<16)+(l&65535)|0;l=q+m|0;i=(i+(e+1|0)|0)+(l>>>0<q>>>0&1)|0;q=l;l=m-ab(i,b)|0;l=l+(-(l>>>0>q>>>0&1)&b)|0;if(((l>>>0>=b>>>0&1|0)!=0&1|0)!=0){l=l-b|0}e=l;e=e>>>0;k=a;p=p-1|0}p=e;f=o;o=p&65535;a=p>>>16;p=f&65535;l=f>>>16;f=ab(o,p);q=ab(o,l);o=ab(a,p);p=ab(a,l);q=q+(f>>>16)|0;q=q+o|0;if(q>>>0<o>>>0){p=p+65536|0}o=p+(q>>>16)|0;p=(q<<16)+(f&65535)|0;f=p+(k<<j)|0;o=(o+(e+1|0)|0)+(f>>>0<p>>>0&1)|0;p=f;f=(k<<j)-ab(o,b)|0;f=f+(-(f>>>0>p>>>0&1)&b)|0;if(((f>>>0>=b>>>0&1|0)!=0&1|0)!=0){f=f-b|0}e=f;e=e>>>0;g=e>>>(j>>>0);h=g;return h|0}function eX(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=a;a=b;b=e;e=f;if((a|0)==1){h=c[g>>2]|0;if(h>>>0>e>>>0){i=h-e|0;j=(i>>>0)%(b>>>0);if((j|0)!=0){j=b-j|0}}else{i=e-h|0;j=(i>>>0)%(b>>>0)}k=j;l=k;return l|0}f=b;m=d[15904+((f>>>0)/2>>>0&127)|0]|0;m=(m<<1)-ab(ab(m,m),f)|0;m=(m<<1)-ab(ab(m,m),f)|0;f=m;m=b<<0;n=0;while(1){h=c[g+(n<<2)>>2]|0;o=h;p=o-e|0;i=p;e=p>>>0>o>>>0&1;i=ab(i,f);o=i;p=m;q=o&65535;r=o>>>16;o=p&65535;s=p>>>16;p=ab(q,o);t=ab(q,s);q=ab(r,o);o=ab(r,s);t=t+(p>>>16)|0;t=t+q|0;if(t>>>0<q>>>0){o=o+65536|0}j=o+(t>>>16)|0;u=(t<<16)+(p&65535)|0;e=e+j|0;p=n+1|0;n=p;if((p|0)>=(a-1|0)){break}}h=c[g+(n<<2)>>2]|0;if(h>>>0<=b>>>0){i=e-h|0;if(e>>>0<h>>>0){i=i+b|0}v=i}else{b=h;h=b-e|0;i=h;e=h>>>0>b>>>0&1;i=ab(i,f);f=i;i=m;m=f&65535;b=f>>>16;f=i&65535;h=i>>>16;i=ab(m,f);n=ab(m,h);m=ab(b,f);f=ab(b,h);n=n+(i>>>16)|0;n=n+m|0;if(n>>>0<m>>>0){f=f+65536|0}j=f+(n>>>16)|0;u=(n<<16)+(i&65535)|0;e=e+j|0;v=e}k=v;l=k;return l|0}function eY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=d;d=e;a=a+(b<<2)|0;f=f+(b<<2)|0;e=32-d|0;g=a-4|0;a=g;h=c[g>>2]|0;g=h>>>(e>>>0);i=h<<d;j=b-1|0;while(1){if((j|0)==0){break}b=a-4|0;a=b;h=c[b>>2]|0;b=f-4|0;f=b;c[b>>2]=(i|h>>>(e>>>0))^-1;i=h<<d;j=j-1|0}j=f-4|0;f=j;c[j>>2]=i^-1;return g|0}function eZ(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=c[b+(d-1<<2)>>2]|0;j=e<<g;i=i+((d+a|0)-1<<2)|0;L5826:do{if((g|0)==0){k=h;l=k>>>0>=j>>>0&1;if((l|0)!=0){m=k-j|0}else{m=k}k=m;n=i;i=n-4|0;c[n>>2]=l;d=d-1|0;o=d-1|0;while(1){if(!((o|0)>=0)){break}p=c[b+(o<<2)>>2]|0;l=k;n=f;q=l&65535;r=l>>>16;l=n&65535;s=n>>>16;n=ab(q,l);t=ab(q,s);q=ab(r,l);l=ab(r,s);t=t+(n>>>16)|0;t=t+q|0;if(t>>>0<q>>>0){l=l+65536|0}q=l+(t>>>16)|0;l=(t<<16)+(n&65535)|0;n=l+p|0;q=(q+(k+1|0)|0)+(n>>>0<l>>>0&1)|0;l=n;n=p-ab(q,j)|0;t=-(n>>>0>l>>>0&1)|0;q=q+t|0;n=n+(t&j)|0;if(((n>>>0>=j>>>0&1|0)!=0&1|0)!=0){n=n-j|0;q=q+1|0}k=n;c[i>>2]=q;i=i-4|0;o=o-1|0}q=4802;break}else{k=0;do{if(h>>>0<e>>>0){k=h<<g;n=i;i=n-4|0;c[n>>2]=0;d=d-1|0;if((d|0)==0){break L5826}else{break}}}while(0);n=c[b+(d-1<<2)>>2]|0;k=k|n>>>((32-g|0)>>>0);o=d-2|0;while(1){if(!((o|0)>=0)){break}p=c[b+(o<<2)>>2]|0;t=k;l=f;s=t&65535;r=t>>>16;t=l&65535;u=l>>>16;l=ab(s,t);v=ab(s,u);s=ab(r,t);t=ab(r,u);v=v+(l>>>16)|0;v=v+s|0;if(v>>>0<s>>>0){t=t+65536|0}s=t+(v>>>16)|0;t=(v<<16)+(l&65535)|0;l=t+(n<<g|p>>>((32-g|0)>>>0))|0;s=(s+(k+1|0)|0)+(l>>>0<t>>>0&1)|0;t=l;l=(n<<g|p>>>((32-g|0)>>>0))-ab(s,j)|0;v=-(l>>>0>t>>>0&1)|0;s=s+v|0;l=l+(v&j)|0;if(((l>>>0>=j>>>0&1|0)!=0&1|0)!=0){l=l-j|0;s=s+1|0}k=l;c[i>>2]=s;i=i-4|0;n=p;o=o-1|0}s=k;l=f;v=s&65535;t=s>>>16;s=l&65535;u=l>>>16;l=ab(v,s);r=ab(v,u);v=ab(t,s);s=ab(t,u);r=r+(l>>>16)|0;r=r+v|0;if(r>>>0<v>>>0){s=s+65536|0}v=s+(r>>>16)|0;s=(r<<16)+(l&65535)|0;l=s+(n<<g)|0;v=(v+(k+1|0)|0)+(l>>>0<s>>>0&1)|0;s=l;l=(n<<g)-ab(v,j)|0;r=-(l>>>0>s>>>0&1)|0;v=v+r|0;l=l+(r&j)|0;if(((l>>>0>=j>>>0&1|0)!=0&1|0)!=0){l=l-j|0;v=v+1|0}k=l;c[i>>2]=v;i=i-4|0;q=4802;break}}while(0);o=0;while(1){if((o|0)>=(a|0)){break}p=k;b=f;d=p&65535;h=p>>>16;p=b&65535;e=b>>>16;b=ab(d,p);m=ab(d,e);d=ab(h,p);p=ab(h,e);m=m+(b>>>16)|0;m=m+d|0;if(m>>>0<d>>>0){p=p+65536|0}d=p+(m>>>16)|0;d=d+(k+1|0)|0;p=ab(-d|0,j);e=-(p>>>0>((m<<16)+(b&65535)|0)>>>0&1)|0;d=d+e|0;p=p+(e&j)|0;k=p;c[i>>2]=d;i=i-4|0;o=o+1|0}return k>>>(g>>>0)|0}function e_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;g=i;i=i+136|0;h=g|0;j=g+120|0;k=g+128|0;l=a;a=b;b=d;d=e;e=f;if((b|0)==(e|0)){if((a|0)==(d|0)){fi(l,a,b)}else{fh(l,a,d,b)}m=b;n=e;o=m+n|0;p=o-1|0;q=l;r=q+(p<<2)|0;s=c[r>>2]|0;i=g;return s|0}if((e|0)<30){do{if((b|0)<=500){t=4830}else{if((e|0)==1){t=4830;break}fj(l,a,500,d,e);l=l+2e3|0;if((e|0)!=0){f=e-1|0;u=h|0;v=l;w=v;v=w+4|0;x=c[w>>2]|0;if((f|0)!=0){while(1){w=u;u=w+4|0;c[w>>2]=x;w=v;v=w+4|0;x=c[w>>2]|0;w=f-1|0;f=w;if((w|0)==0){break}}}f=u;u=f+4|0;c[f>>2]=x}a=a+2e3|0;b=b-500|0;while(1){if((b|0)<=500){break}fj(l,a,500,d,e);y=eG(l,l,h|0,e)|0;f=l+(e<<2)|0;v=(c[f>>2]|0)+y|0;c[f>>2]=v;if(v>>>0<y>>>0){while(1){v=f+4|0;f=v;w=(c[v>>2]|0)+1|0;c[v>>2]=w;if((w|0)!=0){break}}}l=l+2e3|0;if((e|0)!=0){f=e-1|0;w=h|0;v=l;z=v;v=z+4|0;A=c[z>>2]|0;if((f|0)!=0){while(1){z=w;w=z+4|0;c[z>>2]=A;z=v;v=z+4|0;A=c[z>>2]|0;z=f-1|0;f=z;if((z|0)==0){break}}}f=w;w=f+4|0;c[f>>2]=A}a=a+2e3|0;b=b-500|0}if((b|0)>(e|0)){fj(l,a,b,d,e)}else{fj(l,d,e,a,b)}y=eG(l,l,h|0,e)|0;x=l+(e<<2)|0;u=(c[x>>2]|0)+y|0;c[x>>2]=u;if(u>>>0<y>>>0){while(1){u=x+4|0;x=u;f=(c[u>>2]|0)+1|0;c[u>>2]=f;if((f|0)!=0){break}}}break}}while(0);if((t|0)==4830){fj(l,a,b,d,e)}}else{if((e|0)>=100){do{if((b+e>>1|0)>=3e3){if(!((e*3&-1|0)>=3e3)){t=4961;break}if((b|0)>=(e<<3|0)){c[k>>2]=0;y=dD(k,(e*9&-1)>>1<<2)|0;fn(l,a,e*3&-1,d,e);b=b-(e*3&-1)|0;a=a+((e*3&-1)<<2)|0;l=l+((e*3&-1)<<2)|0;while(1){if(!((b<<1|0)>=(e*7&-1|0))){break}fn(y,a,e*3&-1,d,e);b=b-(e*3&-1)|0;a=a+((e*3&-1)<<2)|0;B=eG(l,l,y,e)|0;if((e*3&-1|0)!=0){h=(e*3&-1)-1|0;x=l+(e<<2)|0;f=y+(e<<2)|0;u=f;f=u+4|0;v=c[u>>2]|0;if((h|0)!=0){while(1){u=x;x=u+4|0;c[u>>2]=v;u=f;f=u+4|0;v=c[u>>2]|0;u=h-1|0;h=u;if((u|0)==0){break}}}h=x;x=h+4|0;c[h>>2]=v}h=l+(e<<2)|0;f=(c[h>>2]|0)+B|0;c[h>>2]=f;if(f>>>0<B>>>0){while(1){f=h+4|0;h=f;A=(c[f>>2]|0)+1|0;c[f>>2]=A;if((A|0)!=0){break}}}l=l+((e*3&-1)<<2)|0}if((b|0)<(e|0)){h=y;v=d;x=e;A=a;f=b;e_(h,v,x,A,f)}else{f=y;A=a;x=b;v=d;h=e;e_(f,A,x,v,h)}B=eG(l,l,y,e)|0;if((b|0)!=0){h=b-1|0;v=l+(e<<2)|0;x=y+(e<<2)|0;A=x;x=A+4|0;f=c[A>>2]|0;if((h|0)!=0){while(1){A=v;v=A+4|0;c[A>>2]=f;A=x;x=A+4|0;f=c[A>>2]|0;A=h-1|0;h=A;if((A|0)==0){break}}}h=v;v=h+4|0;c[h>>2]=f}h=l+(e<<2)|0;x=(c[h>>2]|0)+B|0;c[h>>2]=x;if(x>>>0<B>>>0){while(1){x=h+4|0;h=x;y=(c[x>>2]|0)+1|0;c[x>>2]=y;if((y|0)!=0){break}}}if((((c[k>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[k>>2]|0)}}else{fn(l,a,b,d,e)}break}else{t=4961}}while(0);if((t|0)==4961){do{if((e|0)>=300){if(((b*3&-1)+12|0)>=(e<<2|0)){t=4963;break}c[j>>2]=0;if((e|0)>=350){if((e|0)>=450){if(((e0(b,e)<<2>>>0<65536&1|0)!=0&1|0)!=0){k=e0(b,e)<<2;B=i;i=i+k|0;i=i+7>>3<<3;C=B}else{C=dD(j,e0(b,e)<<2)|0}D=C;gB(l,a,b,d,e,D)}else{if(((e$(b,e)<<2>>>0<65536&1|0)!=0&1|0)!=0){B=e$(b,e)<<2;k=i;i=i+B|0;i=i+7>>3<<3;E=k}else{E=dD(j,e$(b,e)<<2)|0}D=E;gz(l,a,b,d,e,D)}}else{if((((b*3&-1)+32<<2>>>0<65536&1|0)!=0&1|0)!=0){k=i;i=i+((b*3&-1)+32<<2)|0;i=i+7>>3<<3;F=k}else{F=dD(j,(b*3&-1)+32<<2)|0}D=F;gy(l,a,b,d,e,D)}if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}break}else{t=4963}}while(0);if((t|0)==4963){t=i;i=i+((e<<4)+100<<2)|0;i=i+7>>3<<3;j=t;if((b<<1|0)>=(e*5&-1|0)){t=i;i=i+((e*7&-1)>>1<<2)|0;i=i+7>>3<<3;D=t;if((e|0)>=110){gv(l,a,e<<1,d,e,j)}else{gr(l,a,e<<1,d,e,j)}b=b-(e<<1)|0;a=a+(e<<1<<2)|0;l=l+(e<<1<<2)|0;while(1){if(!((b<<1|0)>=(e*5&-1|0))){break}if((e|0)>=110){gv(D,a,e<<1,d,e,j)}else{gr(D,a,e<<1,d,e,j)}b=b-(e<<1)|0;a=a+(e<<1<<2)|0;G=eG(l,l,D,e)|0;if((e<<1|0)!=0){t=(e<<1)-1|0;F=l+(e<<2)|0;E=D+(e<<2)|0;C=E;E=C+4|0;k=c[C>>2]|0;if((t|0)!=0){while(1){C=F;F=C+4|0;c[C>>2]=k;C=E;E=C+4|0;k=c[C>>2]|0;C=t-1|0;t=C;if((C|0)==0){break}}}t=F;F=t+4|0;c[t>>2]=k}t=l+(e<<2)|0;E=(c[t>>2]|0)+G|0;c[t>>2]=E;if(E>>>0<G>>>0){while(1){E=t+4|0;t=E;C=(c[E>>2]|0)+1|0;c[E>>2]=C;if((C|0)!=0){break}}}l=l+(e<<1<<2)|0}if((b|0)<(e|0)){t=D;k=d;F=e;C=a;E=b;e_(t,k,F,C,E)}else{E=D;C=a;F=b;k=d;t=e;e_(E,C,F,k,t)}G=eG(l,l,D,e)|0;if((b|0)!=0){t=b-1|0;k=l+(e<<2)|0;F=D+(e<<2)|0;D=F;F=D+4|0;C=c[D>>2]|0;if((t|0)!=0){while(1){D=k;k=D+4|0;c[D>>2]=C;D=F;F=D+4|0;C=c[D>>2]|0;D=t-1|0;t=D;if((D|0)==0){break}}}t=k;k=t+4|0;c[t>>2]=C}C=l+(e<<2)|0;t=(c[C>>2]|0)+G|0;c[C>>2]=t;if(t>>>0<G>>>0){while(1){G=C+4|0;C=G;t=(c[G>>2]|0)+1|0;c[G>>2]=t;if((t|0)!=0){break}}}}else{if((b*6&-1|0)<(e*7&-1|0)){gs(l,a,b,d,e,j)}else{if((b<<1|0)<(e*3&-1|0)){if((e|0)>=100){gt(l,a,b,d,e,j)}else{gm(l,a,b,d,e,j)}}else{if((b*6&-1|0)<(e*11&-1|0)){if((b<<2|0)<(e*7&-1|0)){if((e|0)>=110){gu(l,a,b,d,e,j)}else{gm(l,a,b,d,e,j)}}else{if((e|0)>=100){gu(l,a,b,d,e,j)}else{gr(l,a,b,d,e,j)}}}else{if((e|0)>=110){gv(l,a,b,d,e,j)}else{gr(l,a,b,d,e,j)}}}}}}}}else{j=i;i=i+((e<<4)+100<<2)|0;i=i+7>>3<<3;C=j;if((b|0)>=(e*3&-1|0)){j=i;i=i+(e<<2<<2)|0;i=i+7>>3<<3;t=j;gr(l,a,e<<1,d,e,C);b=b-(e<<1)|0;a=a+(e<<1<<2)|0;l=l+(e<<1<<2)|0;while(1){if(!((b|0)>=(e*3&-1|0))){break}gr(t,a,e<<1,d,e,C);b=b-(e<<1)|0;a=a+(e<<1<<2)|0;H=eG(l,l,t,e)|0;if((e<<1|0)!=0){j=(e<<1)-1|0;G=l+(e<<2)|0;k=t+(e<<2)|0;F=k;k=F+4|0;D=c[F>>2]|0;if((j|0)!=0){while(1){F=G;G=F+4|0;c[F>>2]=D;F=k;k=F+4|0;D=c[F>>2]|0;F=j-1|0;j=F;if((F|0)==0){break}}}j=G;G=j+4|0;c[j>>2]=D}j=l+(e<<2)|0;k=(c[j>>2]|0)+H|0;c[j>>2]=k;if(k>>>0<H>>>0){while(1){k=j+4|0;j=k;F=(c[k>>2]|0)+1|0;c[k>>2]=F;if((F|0)!=0){break}}}l=l+(e<<1<<2)|0}if((b<<2|0)<(e*5&-1|0)){gl(t,a,b,d,e,C)}else{if((b<<2|0)<(e*7&-1|0)){gm(t,a,b,d,e,C)}else{gr(t,a,b,d,e,C)}}H=eG(l,l,t,e)|0;if((b|0)!=0){j=b-1|0;D=l+(e<<2)|0;G=t+(e<<2)|0;t=G;G=t+4|0;F=c[t>>2]|0;if((j|0)!=0){while(1){t=D;D=t+4|0;c[t>>2]=F;t=G;G=t+4|0;F=c[t>>2]|0;t=j-1|0;j=t;if((t|0)==0){break}}}j=D;D=j+4|0;c[j>>2]=F}F=l+(e<<2)|0;j=(c[F>>2]|0)+H|0;c[F>>2]=j;if(j>>>0<H>>>0){while(1){H=F+4|0;F=H;j=(c[H>>2]|0)+1|0;c[H>>2]=j;if((j|0)!=0){break}}}}else{if((b<<2|0)<(e*5&-1|0)){gl(l,a,b,d,e,C)}else{if((b<<2|0)<(e*7&-1|0)){gm(l,a,b,d,e,C)}else{gr(l,a,b,d,e,C)}}}}}m=b;n=e;o=m+n|0;p=o-1|0;q=l;r=q+(p<<2)|0;s=c[r>>2]|0;i=g;return s|0}function e$(a,b){a=a|0;b=b|0;return((((((a+b|0)>>>0)/10>>>0)+1|0)*6&-1)-350<<1)+1082|0}function e0(a,b){a=a|0;b=b|0;return(((((((a+b|0)>>>0)/14>>>0)+1<<3)*15&-1)>>3)-843|0)+1282|0}function e1(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;c=(c-1>>a)+1|0;return c<<a|0}function e2(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;b=a;while(1){if(((c>>>0)%2|0)==0){d=a>>>0>0}else{d=0}if(!d){break}c=c>>>1;a=a-1|0}return c<<b|0}function e3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=0;while(1){if((c[(864+(a<<6)|0)+(b<<2)>>2]|0)==0){break}if((d|0)<(c[(864+(a<<6)|0)+(b<<2)>>2]|0)){e=5152;break}b=b+1|0}if((e|0)==5152){f=b+4|0;g=f;return g|0}do{if((b|0)!=0){if((d|0)<(c[(864+(a<<6)|0)+(b-1<<2)>>2]<<2|0)){break}f=(b+4|0)+1|0;g=f;return g|0}}while(0);f=b+4|0;g=f;return g|0}function e4(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;c[c[d>>2]>>2]=0;b=1;e=1;while(1){if(!((b|0)<=(a|0))){break}f=c[d+(b<<2)>>2]|0;g=0;while(1){if((g|0)>=(e|0)){break}c[f+(g<<2)>>2]=c[(c[d+(b-1<<2)>>2]|0)+(g<<2)>>2]<<1;c[f+(e+g<<2)>>2]=(c[f+(g<<2)>>2]|0)+1|0;g=g+1|0}b=b+1|0;e=e<<1}return}function e5(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;j=i;i=i+8|0;k=j|0;l=a;a=b;b=d;d=e;e=f;f=g;g=h;if((b|0)==(e|0)){m=(d|0)==(f|0)}else{m=0}h=m&1;if(((((e1(a,g)|0)==(a|0)^1)&1|0)!=0&1|0)!=0){dF(7576,824,8856);return 0}c[k>>2]=0;m=a<<5;if(((g+1<<2>>>0<65536&1|0)!=0&1|0)!=0){n=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;o=n}else{o=dD(k,g+1<<2)|0}n=o;o=0;while(1){if(!((o|0)<=(g|0))){break}if(((1<<o<<2>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+(1<<o<<2)|0;i=i+7>>3<<3;q=p}else{q=dD(k,1<<o<<2)|0}c[n+(o<<2)>>2]=q;o=o+1|0}e4(n,g);o=1<<g;q=m>>g;m=((q-1|0)/32&-1)+1|0;p=e2(32,g)|0;r=ab(((((q<<1)+g|0)+2|0)/(p|0)&-1)+1|0,p);p=(r|0)/32&-1;if((p|0)>=(((h|0)!=0?360:300)|0)){while(1){q=1<<e3(p,h);if((p&q-1|0)==0){break}p=(p+q|0)-1&-q;r=p<<5}}if(((((p|0)<(a|0)^1)&1|0)!=0&1|0)!=0){dF(7576,857,7232);return 0}if(((p+1<<1<<2>>>0<65536&1|0)!=0&1|0)!=0){q=i;i=i+(p+1<<1<<2)|0;i=i+7>>3<<3;s=q}else{s=dD(k,p+1<<1<<2)|0}q=s;s=r>>g;if(((ab(o,p+1|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){r=ab(o,p+1|0)<<2;t=i;i=i+r|0;i=i+7>>3<<3;u=t}else{u=dD(k,ab(o,p+1|0)<<2)|0}t=u;if(((o<<2>>>0<65536&1|0)!=0&1|0)!=0){u=i;i=i+(o<<2)|0;i=i+7>>3<<3;v=u}else{v=dD(k,o<<2)|0}u=v;e6(t,u,o,p,b,d,m,s,q);if((h|0)!=0){d=(ab(m,o-1|0)+p|0)+1|0;if(((d<<2>>>0<65536&1|0)!=0&1|0)!=0){b=i;i=i+(d<<2)|0;i=i+7>>3<<3;w=b}else{w=dD(k,d<<2)|0}x=w;if(((o<<2>>>0<65536&1|0)!=0&1|0)!=0){w=i;i=i+(o<<2)|0;i=i+7>>3<<3;y=w}else{y=dD(k,o<<2)|0}z=y}else{if(((ab(o,p+1|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){y=ab(o,p+1|0)<<2;w=i;i=i+y|0;i=i+7>>3<<3;A=w}else{A=dD(k,ab(o,p+1|0)<<2)|0}x=A;if(((o<<2>>>0<65536&1|0)!=0&1|0)!=0){A=i;i=i+(o<<2)|0;i=i+7>>3<<3;B=A}else{B=dD(k,o<<2)|0}z=B;e6(x,z,o,p,e,f,m,s,q)}f=e7(l,a,g,u,z,t,x,p,m,s,n,q,h)|0;if((((c[k>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[k>>2]|0)}i=j;return f|0}function e6(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;l=i;i=i+8|0;m=l|0;n=a;a=b;b=d;d=e;e=f;f=g;g=h;h=j;j=k;k=ab(b,g);c[m>>2]=0;if((f|0)>(k|0)){o=f-k|0;if(((k+1<<2>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+(k+1<<2)|0;i=i+7>>3<<3;q=p}else{q=dD(m,k+1<<2)|0}p=q;if((o|0)>(k|0)){q=0;r=eI(p,e,e+(k<<2)|0,k)|0;e=e+(k<<1<<2)|0;o=o-k|0;while(1){if((o|0)<=(k|0)){break}if((q|0)!=0){r=r+(eI(p,p,e,k)|0)|0}else{r=r-(eG(p,p,e,k)|0)|0}q=q^1;e=e+(k<<2)|0;o=o-k|0}if((q|0)!=0){r=r+(eM(p,p,k,e,o)|0)|0}else{r=r-(eL(p,p,k,e,o)|0)|0}if((r|0)>=0){r=eF(p,p,k,r)|0}else{r=eH(p,p,k,-r|0)|0}}else{r=eM(p,e,k,e+(k<<2)|0,o)|0;r=eF(p,p,k,r)|0}c[p+(k<<2)>>2]=r;f=k+1|0;e=p}p=0;while(1){if((p|0)>=(b|0)){break}c[a+(p<<2)>>2]=n;if((f|0)>0){do{if((g|0)<=(f|0)){if((p|0)>=(b-1|0)){s=5253;break}t=g;break}else{s=5253}}while(0);if((s|0)==5253){s=0;t=f}k=t;f=f-k|0;if((k|0)!=0){r=k-1|0;o=j;q=e;u=q;q=u+4|0;v=c[u>>2]|0;if((r|0)!=0){while(1){u=o;o=u+4|0;c[u>>2]=v;u=q;q=u+4|0;v=c[u>>2]|0;u=r-1|0;r=u;if((u|0)==0){break}}}r=o;o=r+4|0;c[r>>2]=v}if(((d+1|0)-k|0)!=0){r=j+(k<<2)|0;q=(d+1|0)-k|0;while(1){u=r;r=u+4|0;c[u>>2]=0;u=q-1|0;q=u;if((u|0)==0){break}}}e=e+(g<<2)|0;fe(n,j,ab(p,h),d)}else{if((d+1|0)!=0){q=n;r=d+1|0;while(1){k=q;q=k+4|0;c[k>>2]=0;k=r-1|0;r=k;if((k|0)==0){break}}}}n=n+(d+1<<2)|0;p=p+1|0}if(((((f|0)==0^1)&1|0)!=0&1|0)!=0){dF(7576,699,5544)}if((((c[m>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[m>>2]|0)}i=l;return}function e7(a,b,d,e,f,g,h,i,j,k,l,m,n){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=a;a=b;b=d;d=e;e=f;f=h;h=i;i=j;j=k;k=l;l=m;m=n;n=1<<b;e8(d,n,k+(b<<2)|0,j<<1,h,1,l);if((m|0)==0){e8(e,n,k+(b<<2)|0,j<<1,h,1,l)}if((m|0)!=0){o=d}else{o=e}fa(d,o,h,n);e9(d,n,j<<1,h,l);c[e>>2]=(l+(h<<2)|0)+4|0;fc(c[e>>2]|0,c[d>>2]|0,b,h);o=1;while(1){if((o|0)>=(n|0)){break}c[e+(o<<2)>>2]=c[d+(o-1<<2)>>2]|0;m=c[e+(o<<2)>>2]|0;k=c[d+(o<<2)>>2]|0;fc(m,k,b+ab(n-o|0,j)|0,h);o=o+1|0}if((h+1|0)!=0){j=l;b=h+1|0;while(1){d=j;j=d+4|0;c[d>>2]=0;d=b-1|0;b=d;if((d|0)==0){break}}}b=(ab(i,n-1|0)+h|0)+1|0;j=f;if((b|0)!=0){f=j;d=b;while(1){k=f;f=k+4|0;c[k>>2]=0;k=d-1|0;d=k;if((k|0)==0){break}}}d=0;o=n-1|0;f=ab(i,o)+h|0;k=ab(i,o);while(1){if(!((o|0)>=0)){break}m=j+(k<<2)|0;p=n-o&n-1;if((eG(m,m,c[e+(p<<2)>>2]|0,h+1|0)|0)!=0){d=d+(eF((m+(h<<2)|0)+4|0,(m+(h<<2)|0)+4|0,((b-k|0)-h|0)-1|0,1)|0)|0}c[l+(i<<1<<2)>>2]=o+1|0;if((fw(c[e+(p<<2)>>2]|0,l,h+1|0)|0)>0){d=d-(eH(m,m,b-k|0,1)|0)|0;d=d-(eH(j+(f<<2)|0,j+(f<<2)|0,b-f|0,1)|0)|0}o=o-1|0;f=f-i|0;k=k-i|0}if((d|0)==-1){i=eF((j+(b<<2)|0)+(-a<<2)|0,(j+(b<<2)|0)+(-a<<2)|0,a,1)|0;d=i;if((i|0)!=0){i=((j+(b<<2)|0)+(-a<<2)|0)-4|0;k=((j+(b<<2)|0)+(-a<<2)|0)-4|0;f=a+1|0;eH(i,k,f,1);f=(j+(b<<2)|0)-4|0;k=(j+(b<<2)|0)-4|0;eH(f,k,1,1)}q=g;r=a;s=j;t=b;u=fd(q,r,s,t)|0;return u|0}if((d|0)==1){if((b|0)>=(a<<1|0)){while(1){k=eF((j+(b<<2)|0)+(-(a<<1)<<2)|0,(j+(b<<2)|0)+(-(a<<1)<<2)|0,a<<1,d)|0;d=k;if((k|0)==0){break}}}else{d=eH((j+(b<<2)|0)+(-a<<2)|0,(j+(b<<2)|0)+(-a<<2)|0,a,d)|0}}q=g;r=a;s=j;t=b;u=fd(q,r,s,t)|0;return u|0}function e8(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;if((a|0)!=2){h=c[b>>2]|0;e8(i,a>>1,b-4|0,d<<1,e,f<<1,g);e8(i+(f<<2)|0,a>>1,b-4|0,d<<1,e,f<<1,g);b=0;while(1){if((b|0)>=(a>>1|0)){break}j=c[i+(f<<2)>>2]|0;fe(g,j,ab(c[h>>2]|0,d),e);ff(c[i+(f<<2)>>2]|0,c[i>>2]|0,g,e);fg(c[i>>2]|0,c[i>>2]|0,g,e);b=b+1|0;h=h+8|0;i=i+(f<<1<<2)|0}return}if((e+1|0)!=0){h=(e+1|0)-1|0;b=g;d=c[i>>2]|0;a=d;d=a+4|0;j=c[a>>2]|0;if((h|0)!=0){while(1){a=b;b=a+4|0;c[a>>2]=j;a=d;d=a+4|0;j=c[a>>2]|0;a=h-1|0;h=a;if((a|0)==0){break}}}h=b;b=h+4|0;c[h>>2]=j}eG(c[i>>2]|0,c[i>>2]|0,c[i+(f<<2)>>2]|0,e+1|0);j=eI(c[i+(f<<2)>>2]|0,g,c[i+(f<<2)>>2]|0,e+1|0)|0;if((c[(c[i>>2]|0)+(e<<2)>>2]|0)>>>0>1){g=1-(eH(c[i>>2]|0,c[i>>2]|0,e,(c[(c[i>>2]|0)+(e<<2)>>2]|0)-1|0)|0)|0;c[(c[i>>2]|0)+(e<<2)>>2]=g}if((j|0)!=0){j=eF(c[i+(f<<2)>>2]|0,c[i+(f<<2)>>2]|0,e,(c[(c[i+(f<<2)>>2]|0)+(e<<2)>>2]^-1)+1|0)|0;c[(c[i+(f<<2)>>2]|0)+(e<<2)>>2]=j}return}function e9(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=a;a=b;b=d;d=e;e=f;if((a|0)!=2){f=a>>1;e9(g,f,b<<1,d,e);e9(g+(f<<2)|0,f,b<<1,d,e);a=0;while(1){if((a|0)>=(f|0)){break}h=c[g+(f<<2)>>2]|0;fe(e,h,ab(a,b),d);ff(c[g+(f<<2)>>2]|0,c[g>>2]|0,e,d);fg(c[g>>2]|0,c[g>>2]|0,e,d);a=a+1|0;g=g+4|0}return}if((d+1|0)!=0){a=(d+1|0)-1|0;f=e;b=c[g>>2]|0;h=b;b=h+4|0;i=c[h>>2]|0;if((a|0)!=0){while(1){h=f;f=h+4|0;c[h>>2]=i;h=b;b=h+4|0;i=c[h>>2]|0;h=a-1|0;a=h;if((h|0)==0){break}}}a=f;f=a+4|0;c[a>>2]=i}eG(c[g>>2]|0,c[g>>2]|0,c[g+4>>2]|0,d+1|0);i=eI(c[g+4>>2]|0,e,c[g+4>>2]|0,d+1|0)|0;if((c[(c[g>>2]|0)+(d<<2)>>2]|0)>>>0>1){e=1-(eH(c[g>>2]|0,c[g>>2]|0,d,(c[(c[g>>2]|0)+(d<<2)>>2]|0)-1|0)|0)|0;c[(c[g>>2]|0)+(d<<2)>>2]=e}if((i|0)!=0){i=eF(c[g+4>>2]|0,c[g+4>>2]|0,d,(c[(c[g+4>>2]|0)+(d<<2)>>2]^-1)+1|0)|0;c[(c[g+4>>2]|0)+(d<<2)>>2]=i}return}function fa(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;e=(h|0)==(a|0)&1;c[g>>2]=0;if((b|0)>=(((e|0)!=0?360:300)|0)){j=e3(b,e)|0;k=1<<j;if(((((b&k-1|0)==0^1)&1|0)!=0&1|0)!=0){dF(7576,437,6552)}if((k|0)>32){l=k}else{l=32}m=l;l=b>>j;n=ab(((((b<<5>>j<<1)+j|0)+2|0)+m|0)/(m|0)&-1,m);m=(n|0)/32&-1;if((m|0)>=(((e|0)!=0?360:300)|0)){while(1){o=1<<e3(m,e);if((m&o-1|0)==0){break}m=(m+o|0)-1&-o;n=m<<5}}if(((((m|0)<(b|0)^1)&1|0)!=0&1|0)!=0){dF(7576,459,5992)}o=n>>j;if(((k<<2>>>0<65536&1|0)!=0&1|0)!=0){n=i;i=i+(k<<2)|0;i=i+7>>3<<3;p=n}else{p=dD(g,k<<2)|0}n=p;if(((k<<2>>>0<65536&1|0)!=0&1|0)!=0){p=i;i=i+(k<<2)|0;i=i+7>>3<<3;q=p}else{q=dD(g,k<<2)|0}p=q;if(((m+1<<1<<j<<2>>>0<65536&1|0)!=0&1|0)!=0){q=i;i=i+(m+1<<1<<j<<2)|0;i=i+7>>3<<3;r=q}else{r=dD(g,m+1<<1<<j<<2)|0}q=r;if(((m+1<<1<<2>>>0<65536&1|0)!=0&1|0)!=0){r=i;i=i+(m+1<<1<<2)|0;i=i+7>>3<<3;s=r}else{s=dD(g,m+1<<1<<2)|0}r=s;s=q+(m+1<<j<<2)|0;if(((j+1<<2>>>0<65536&1|0)!=0&1|0)!=0){t=i;i=i+(j+1<<2)|0;i=i+7>>3<<3;u=t}else{u=dD(g,j+1<<2)|0}t=u;u=0;while(1){if(!((u|0)<=(j|0))){break}if(((1<<u<<2>>>0<65536&1|0)!=0&1|0)!=0){v=i;i=i+(1<<u<<2)|0;i=i+7>>3<<3;w=v}else{w=dD(g,1<<u<<2)|0}c[t+(u<<2)>>2]=w;u=u+1|0}e4(t,j);u=0;while(1){if((u|0)>=(d|0)){break}fb(c[h>>2]|0,b);if((e|0)==0){fb(c[a>>2]|0,b)}e6(q,n,k,m,c[h>>2]|0,(l<<j)+1|0,l,o,r);if((e|0)==0){e6(s,p,k,m,c[a>>2]|0,(l<<j)+1|0,l,o,r)}w=e7(c[h>>2]|0,b,j,n,p,q,s,m,l,o,t,r,e)|0;c[(c[h>>2]|0)+(b<<2)>>2]=w;u=u+1|0;h=h+4|0;a=a+4|0}}else{r=b<<1;if(((r<<2>>>0<65536&1|0)!=0&1|0)!=0){t=i;i=i+(r<<2)|0;i=i+7>>3<<3;x=t}else{x=dD(g,r<<2)|0}t=x;x=t+(b<<2)|0;u=0;while(1){if((u|0)>=(d|0)){break}o=h;h=o+4|0;l=c[o>>2]|0;o=a;a=o+4|0;m=c[o>>2]|0;if((e|0)!=0){fi(t,l,b)}else{fh(t,m,l,b)}if((c[l+(b<<2)>>2]|0)!=0){y=eG(x,x,m,b)|0}else{y=0}if((c[m+(b<<2)>>2]|0)!=0){m=eG(x,x,l,b)|0;y=y+(m+(c[l+(b<<2)>>2]|0)|0)|0}if((y|0)!=0){y=eF(t,t,r,y)|0}if((eI(l,t,x,b)|0)!=0){z=(eF(l,l,b,1)|0)!=0}else{z=0}c[l+(b<<2)>>2]=z&1;u=u+1|0}}if((((c[g>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[g>>2]|0)}i=f;return}function fb(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((c[d+(a<<2)>>2]|0)==0){return}b=d;while(1){e=b;b=e+4|0;f=c[e>>2]|0;c[e>>2]=f-1|0;if((f|0)!=0){break}}if((c[d+(a<<2)>>2]|0)==0){if((a|0)!=0){b=d;f=a;while(1){e=b;b=e+4|0;c[e>>2]=0;e=f-1|0;f=e;if((e|0)==0){break}}}c[d+(a<<2)>>2]=1}else{c[d+(a<<2)>>2]=0}return}function fc(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a;a=d;fe(e,b,(a<<1<<5)-c|0,a);fb(e,a);return}function fd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=a;a=b;b=d;d=e;e=d-(a<<1)|0;if((e|0)>0){g=a;h=eG(f,b,b+(a<<1<<2)|0,e)|0;i=eF(f+(e<<2)|0,b+(e<<2)|0,a-e|0,h)|0}else{g=d-a|0;if((a|0)!=0){d=a-1|0;e=f;j=b;k=j;j=k+4|0;l=c[k>>2]|0;if((d|0)!=0){while(1){k=e;e=k+4|0;c[k>>2]=l;k=j;j=k+4|0;l=c[k>>2]|0;k=d-1|0;d=k;if((k|0)==0){break}}}d=e;e=d+4|0;c[d>>2]=l}i=0}h=eI(f,f,b+(a<<2)|0,g)|0;i=i-(eH(f+(g<<2)|0,f+(g<<2)|0,a-g|0,h)|0)|0;if((i|0)>=0){m=i;return m|0}i=eF(f,f,a,1)|0;m=i;return m|0}function fe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a;a=b;b=d;d=e;e=(b>>>0)%32;b=(b>>>0)/32>>>0;if(!(b>>>0>=d>>>0)){if((e|0)!=0){g=f;h=(a+(d<<2)|0)+(-b<<2)|0;i=b+1|0;j=e;eY(g,h,i,j);k=c[f+(b<<2)>>2]^-1;l=eP(f+(b<<2)|0,a,d-b|0,e)|0}else{j=f;i=(a+(d<<2)|0)+(-b<<2)|0;h=b+1|0;while(1){g=i;i=g+4|0;m=j;j=m+4|0;c[m>>2]=c[g>>2]^-1;g=h-1|0;h=g;if((g|0)==0){break}}k=c[a+(d<<2)>>2]|0;if((d-b|0)!=0){h=(d-b|0)-1|0;j=f+(b<<2)|0;i=a;g=i;i=g+4|0;m=c[g>>2]|0;if((h|0)!=0){while(1){g=j;j=g+4|0;c[g>>2]=m;g=i;i=g+4|0;m=c[g>>2]|0;g=h-1|0;h=g;if((g|0)==0){break}}}h=j;j=h+4|0;c[h>>2]=m}l=0}if((b|0)!=0){m=l;l=m-1|0;if((m|0)==0){l=eF(f,f,d,1)|0}l=(eH(f,f,b,l)|0)+1|0}c[f+(d<<2)>>2]=-(eH(f+(b<<2)|0,f+(b<<2)|0,d-b|0,l)|0)|0;m=eH(f+(b<<2)|0,f+(b<<2)|0,d-b|0,k)|0;h=f+(d<<2)|0;c[h>>2]=(c[h>>2]|0)-m|0;if((c[f+(d<<2)>>2]&-2147483648|0)!=0){c[f+(d<<2)>>2]=eF(f,f,d,1)|0}return}b=b-d|0;if((e|0)!=0){m=f;h=(a+(d<<2)|0)+(-b<<2)|0;j=b+1|0;i=e;eP(m,h,j,i);k=c[f+(b<<2)>>2]|0;l=eY(f+(b<<2)|0,a,d-b|0,e)|0}else{if((b|0)!=0){e=b-1|0;i=f;j=(a+(d<<2)|0)+(-b<<2)|0;h=j;j=h+4|0;m=c[h>>2]|0;if((e|0)!=0){while(1){h=i;i=h+4|0;c[h>>2]=m;h=j;j=h+4|0;m=c[h>>2]|0;h=e-1|0;e=h;if((h|0)==0){break}}}e=i;i=e+4|0;c[e>>2]=m}k=c[a+(d<<2)>>2]|0;m=f+(b<<2)|0;e=a;a=d-b|0;while(1){i=e;e=i+4|0;j=m;m=j+4|0;c[j>>2]=c[i>>2]^-1;i=a-1|0;a=i;if((i|0)==0){break}}l=0}c[f+(d<<2)>>2]=0;l=l+1|0;d=f;a=(c[d>>2]|0)+l|0;c[d>>2]=a;if(a>>>0<l>>>0){while(1){a=d+4|0;d=a;m=(c[a>>2]|0)+1|0;c[a>>2]=m;if((m|0)!=0){break}}}k=k+1|0;if((k|0)==0){n=1}else{n=k}l=n;f=(f+(b<<2)|0)+(((k|0)==0&1)<<2)|0;k=f;f=(c[k>>2]|0)+l|0;c[k>>2]=f;if(f>>>0<l>>>0){while(1){l=k+4|0;k=l;f=(c[l>>2]|0)+1|0;c[l>>2]=f;if((f|0)!=0){break}}}return}function ff(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a;a=b;b=d;d=e;e=(c[a+(d<<2)>>2]|0)-(c[b+(d<<2)>>2]|0)|0;g=e-(eI(f,a,b,d)|0)|0;b=-g&-((g&-2147483648|0)!=0&1);c[f+(d<<2)>>2]=b+g|0;g=f;f=(c[g>>2]|0)+b|0;c[g>>2]=f;if(f>>>0<b>>>0){while(1){b=g+4|0;g=b;f=(c[b>>2]|0)+1|0;c[b>>2]=f;if((f|0)!=0){break}}}return}function fg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a;a=b;b=d;d=e;e=(c[a+(d<<2)>>2]|0)+(c[b+(d<<2)>>2]|0)|0;g=e+(eG(f,a,b,d)|0)|0;b=g-1&-((g|0)!=0&1);c[f+(d<<2)>>2]=g-b|0;g=f;f=c[g>>2]|0;c[g>>2]=f-b|0;if(f>>>0<b>>>0){while(1){b=g+4|0;g=b;f=c[b>>2]|0;c[b>>2]=f-1|0;if((f|0)!=0){break}}}return}function fh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+1056|0;g=f|0;h=f+1048|0;j=a;a=b;b=d;d=e;if(!((d|0)>=30)){fj(j,a,d,b,d);i=f;return}if((d|0)>=100){if((d|0)>=300){if((d|0)>=350){if((d|0)>=450){if((d|0)>=3e3){fn(j,a,d,b,d)}else{c[h>>2]=0;if((((((d*15&-1)>>3)-843|0)+1282<<2>>>0<65536&1|0)!=0&1|0)!=0){e=i;i=i+((((d*15&-1)>>3)-843|0)+1282<<2)|0;i=i+7>>3<<3;k=e}else{k=dD(h,(((d*15&-1)>>3)-843|0)+1282<<2)|0}gB(j,a,d,b,d,k);if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}}}else{h=i;i=i+((d-350<<1)+1082<<2)|0;i=i+7>>3<<3;gz(j,a,d,b,d,h)}}else{h=i;i=i+((d*3&-1)+32<<2)|0;i=i+7>>3<<3;gy(j,a,d,b,d,h)}}else{h=i;i=i+((d*3&-1)+32<<2)|0;i=i+7>>3<<3;gs(j,a,d,b,d,h)}}else{gl(j,a,d,b,d,g|0)}i=f;return}function fi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+1216|0;f=e|0;g=e+1208|0;h=a;a=b;b=d;if(!((b|0)>=50)){fm(h,a,b);i=e;return}if((b|0)>=120){if((b|0)>=400){if((b|0)>=350){if((b|0)>=450){if((b|0)>=3600){fn(h,a,b,a,b)}else{c[g>>2]=0;if((((((b*15&-1)>>3)-843|0)+1282<<2>>>0<65536&1|0)!=0&1|0)!=0){d=i;i=i+((((b*15&-1)>>3)-843|0)+1282<<2)|0;i=i+7>>3<<3;j=d}else{j=dD(g,(((b*15&-1)>>3)-843|0)+1282<<2)|0}gC(h,a,b,j);if((((c[g>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[g>>2]|0)}}}else{g=i;i=i+((b-350<<1)+1082<<2)|0;i=i+7>>3<<3;gA(h,a,b,g)}}else{g=i;i=i+((b*3&-1)+32<<2)|0;i=i+7>>3<<3;gH(h,a,b,g)}}else{g=i;i=i+((b*3&-1)+32<<2)|0;i=i+7>>3<<3;gG(h,a,b,g)}}else{gF(h,a,b,f|0)}i=e;return}function fj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=b;b=d;d=e;e=f;c[g+(b<<2)>>2]=eK(g,a,b,c[d>>2]|0)|0;g=g+4|0;d=d+4|0;e=e-1|0;while(1){if(!((e|0)>=1)){break}c[g+(b<<2)>>2]=eN(g,a,b,c[d>>2]|0)|0;g=g+4|0;d=d+4|0;e=e-1|0}return}function fk(a,b){a=a|0;b=b|0;var c=0,d=0;c=a;a=b;if((a|0)>(c>>1|0)){d=a}else{d=0}return(c+3|0)+d|0}function fl(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function fm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+400|0;f=a;a=b;b=d;d=c[a>>2]|0;g=d;h=d<<0;d=g&65535;j=g>>>16;g=h&65535;k=h>>>16;h=ab(d,g);l=ab(d,k);d=ab(j,g);g=ab(j,k);l=l+(h>>>16)|0;l=l+d|0;if(l>>>0<d>>>0){g=g+65536|0}c[f+4>>2]=g+(l>>>16)|0;c[f>>2]=((l<<16)+(h&65535)|0)>>>0;if((b|0)<=1){i=e;return}h=e|0;c[h+(b-1<<2)>>2]=eK(h,a+4|0,b-1|0,c[a>>2]|0)|0;l=2;while(1){if((l|0)>=(b|0)){break}c[h+((b+l|0)-2<<2)>>2]=eN((h+(l<<1<<2)|0)-8|0,a+(l<<2)|0,b-l|0,c[a+(l-1<<2)>>2]|0)|0;l=l+1|0}l=0;while(1){if((l|0)>=(b|0)){break}g=c[a+(l<<2)>>2]|0;d=g;k=g<<0;g=d&65535;j=d>>>16;d=k&65535;m=k>>>16;k=ab(g,d);n=ab(g,m);g=ab(j,d);d=ab(j,m);n=n+(k>>>16)|0;n=n+g|0;if(n>>>0<g>>>0){d=d+65536|0}c[f+((l<<1)+1<<2)>>2]=d+(n>>>16)|0;c[f+(l<<1<<2)>>2]=((n<<16)+(k&65535)|0)>>>0;l=l+1|0}l=eP(h,h,(b<<1)-2|0,1)|0;l=l+(eG(f+4|0,f+4|0,h,(b<<1)-2|0)|0)|0;h=f+((b<<1)-1<<2)|0;c[h>>2]=(c[h>>2]|0)+l|0;i=e;return}function fn(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;c[h>>2]=0;do{if((a|0)==(d|0)){if((b|0)!=(e|0)){k=5785;break}l=hd(b<<1)|0;if(((fk(l,b)<<2>>>0<65536&1|0)!=0&1|0)!=0){f=fk(l,b)<<2;m=i;i=i+f|0;i=i+7>>3<<3;n=m}else{n=dD(h,fk(l,b)<<2)|0}o=n;g9(j,l,a,b,o);break}else{k=5785}}while(0);if((k|0)==5785){l=g8(b+e|0)|0;if(((fl(l,b,e)<<2>>>0<65536&1|0)!=0&1|0)!=0){k=fl(l,b,e)<<2;n=i;i=i+k|0;i=i+7>>3<<3;p=n}else{p=dD(h,fl(l,b,e)<<2)|0}o=p;g5(j,l,a,b,d,e,o)}if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}i=g;return}function fo(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;h=i;i=i+784|0;j=h|0;k=h+8|0;l=h+648|0;m=h+656|0;n=b;b=e;e=f;f=g;if((f|0)==0){a[n|0]=0;o=1;p=o;i=h;return p|0}if((b&b-1|0)==0){g=c[(10008+(b*20&-1)|0)+12>>2]|0;q=n;r=c[e+(f-1<<2)>>2]|0;s=r;if(s>>>0<65536){t=s>>>0<256?1:9}else{t=s>>>0<16777216?17:25}u=t;t=(33-u|0)-(d[9872+(s>>>(u>>>0))|0]|0)|0;u=(f<<5)-t|0;t=(u>>>0)%(g>>>0);if((t|0)!=0){u=u+(g-t|0)|0}t=u-(f-1<<5)|0;u=f-1|0;while(1){t=t-g|0;while(1){if(!((t|0)>=0)){break}s=q;q=s+1|0;a[s]=r>>>(t>>>0)&(1<<g)-1&255;t=t-g|0}u=u-1|0;if((u|0)<0){break}s=r<<-t&(1<<g)-1;r=c[e+(u<<2)>>2]|0;t=t+32|0;v=q;q=v+1|0;a[v]=(s|r>>>(t>>>0))&255}o=q-n|0;p=o;i=h;return p|0}if(!((f|0)>=35)){o=(fp(n,0,e,f,b)|0)-n|0;p=o;i=h;return p|0}c[l>>2]=0;q=dD(l,f+64<<2)|0;t=q;c[j>>2]=c[(10008+(b*20&-1)|0)+12>>2]|0;r=c[10008+(b*20&-1)>>2]|0;u=c[(10008+(b*20&-1)|0)+4>>2]|0;g=f<<5;s=u&65535;v=u>>>16;u=g&65535;w=g>>>16;g=ab(s,u);x=ab(s,w);s=ab(v,u);u=ab(v,w);x=x+(g>>>16)|0;x=x+s|0;if(x>>>0<s>>>0){u=u+65536|0}s=0;g=(((u+(x>>>16)|0)>>>0)/((c[10008+(b*20&-1)>>2]|0)>>>0)>>>0)+1|0;while(1){if((g|0)==1){break}c[m+(s<<2)>>2]=g;s=s+1|0;g=g+1>>1}c[m+(s<<2)>>2]=1;c[k>>2]=j;c[(k|0)+4>>2]=1;c[(k|0)+12>>2]=r;c[(k|0)+16>>2]=b;c[(k|0)+8>>2]=0;c[k+20>>2]=t;t=t+8|0;c[c[k+20>>2]>>2]=c[j>>2]|0;c[(k+20|0)+4>>2]=1;c[(k+20|0)+12>>2]=r;c[(k+20|0)+16>>2]=b;c[(k+20|0)+8>>2]=0;g=1;x=j;u=1;w=0;v=2;while(1){if((v|0)>=(s|0)){break}y=t;t=t+((g<<1)+2<<2)|0;if((((t>>>0<(q+(f+64<<2)|0)>>>0^1)&1|0)!=0&1|0)!=0){z=5828;break}fi(y,x,g);r=r<<1;g=g<<1;g=g-((c[y+(g-1<<2)>>2]|0)==0&1)|0;u=u<<1;if((u+1|0)<(c[m+(s-v<<2)>>2]|0)){r=r+(c[10008+(b*20&-1)>>2]|0)|0;A=eK(y,y,g,c[j>>2]|0)|0;c[y+(g<<2)>>2]=A;g=g+((A|0)!=0&1)|0;u=u+1|0}w=w<<1;while(1){if((c[y>>2]|0)!=0){break}y=y+4|0;g=g-1|0;w=w+1|0}x=y;c[k+(v*20&-1)>>2]=x;c[(k+(v*20&-1)|0)+4>>2]=g;c[(k+(v*20&-1)|0)+12>>2]=r;c[(k+(v*20&-1)|0)+16>>2]=b;c[(k+(v*20&-1)|0)+8>>2]=w;v=v+1|0}if((z|0)==5828){dF(7496,478,8808);return 0}v=1;while(1){if((v|0)>=(s|0)){break}y=c[k+(v*20&-1)>>2]|0;g=c[(k+(v*20&-1)|0)+4>>2]|0;A=eK(y,y,g,c[j>>2]|0)|0;c[y+(g<<2)>>2]=A;g=g+((A|0)!=0&1)|0;if((c[y>>2]|0)==0){c[k+(v*20&-1)>>2]=y+4|0;g=g-1|0;z=(k+(v*20&-1)|0)+8|0;c[z>>2]=(c[z>>2]|0)+1|0}c[(k+(v*20&-1)|0)+4>>2]=g;z=(k+(v*20&-1)|0)+12|0;c[z>>2]=(c[z>>2]|0)+(c[10008+(b*20&-1)>>2]|0)|0;v=v+1|0}b=(fq(n,0,e,f,((k|0)-20|0)+(v*20&-1)|0,dD(l,f+32<<2)|0)|0)-n|0;if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}o=b;p=o;i=h;return p|0}function fp(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+856|0;k=j|0;l=j+712|0;m=b;b=e;e=f;f=g;g=h;if((g|0)==10){if((f|0)!=0){h=f-1|0;n=(l|0)+4|0;o=e;p=o;o=p+4|0;q=c[p>>2]|0;if((h|0)!=0){while(1){p=n;n=p+4|0;c[p>>2]=q;p=o;o=p+4|0;q=c[p>>2]|0;p=h-1|0;h=p;if((p|0)==0){break}}}h=n;n=h+4|0;c[h>>2]=q}r=(k|0)+712|0;while(1){if((f|0)<=1){break}eZ(l|0,1,(l|0)+4|0,f,1e9,316718722,2);f=f-((c[l+(f<<2)>>2]|0)==0&1)|0;q=(c[l>>2]|0)+1<<0;r=r-9|0;h=9;while(1){n=q;o=10;p=n&65535;s=n>>>16;n=o&65535;t=o>>>16;o=ab(p,n);u=ab(p,t);p=ab(s,n);n=ab(s,t);u=u+(o>>>16)|0;u=u+p|0;if(u>>>0<p>>>0){n=n+65536|0}q=(u<<16)+(o&65535)|0;o=r;r=o+1|0;a[o]=n+(u>>>16)&255;u=h-1|0;h=u;if((u|0)==0){break}}r=r-9|0}h=c[l+4>>2]|0;while(1){if((h|0)==0){break}q=(h>>>0)%10;h=(h>>>0)/10>>>0;v=q;q=r-1|0;r=q;a[q]=v&255}}else{q=c[10008+(g*20&-1)>>2]|0;u=c[(10008+(g*20&-1)|0)+12>>2]|0;n=c[(10008+(g*20&-1)|0)+16>>2]|0;o=u;if(o>>>0<65536){w=o>>>0<256?1:9}else{w=o>>>0<16777216?17:25}p=w;w=(33-p|0)-(d[9872+(o>>>(p>>>0))|0]|0)|0;if((f|0)!=0){p=f-1|0;o=(l|0)+4|0;t=e;e=t;t=e+4|0;s=c[e>>2]|0;if((p|0)!=0){while(1){e=o;o=e+4|0;c[e>>2]=s;e=t;t=e+4|0;s=c[e>>2]|0;e=p-1|0;p=e;if((e|0)==0){break}}}p=o;o=p+4|0;c[p>>2]=s}r=(k|0)+712|0;while(1){if((f|0)<=1){break}eZ(l|0,1,(l|0)+4|0,f,u,n,w);f=f-((c[l+(f<<2)>>2]|0)==0&1)|0;s=(c[l>>2]|0)+1<<0;r=r+(-q|0)|0;p=q;while(1){o=s;t=g;e=o&65535;x=o>>>16;o=t&65535;y=t>>>16;t=ab(e,o);z=ab(e,y);e=ab(x,o);o=ab(x,y);z=z+(t>>>16)|0;z=z+e|0;if(z>>>0<e>>>0){o=o+65536|0}s=(z<<16)+(t&65535)|0;t=r;r=t+1|0;a[t]=o+(z>>>16)&255;z=p-1|0;p=z;if((z|0)==0){break}}r=r+(-q|0)|0}h=c[l+4>>2]|0;while(1){if((h|0)==0){break}l=(h>>>0)%(g>>>0);h=(h>>>0)/(g>>>0)>>>0;v=l;l=r-1|0;r=l;a[l]=v&255}}v=((k|0)+712|0)-r|0;while(1){if(v>>>0>=b>>>0){break}k=m;m=k+1|0;a[k]=0;b=b-1|0}while(1){if((v|0)==0){break}b=r;r=b+1|0;k=m;m=k+1|0;a[k]=a[b]|0;v=v-1|0}i=j;return m|0}function fq(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;i=b;b=d;d=e;e=f;f=g;g=h;if(!((e|0)>=18)){if((e|0)!=0){i=fp(i,b,d,e,c[f+16>>2]|0)|0}else{while(1){if((b|0)==0){break}h=i;i=h+1|0;a[h]=0;b=b-1|0}}j=i;return j|0}h=c[f>>2]|0;k=c[f+4>>2]|0;l=c[f+8>>2]|0;do{if((e|0)<(k+l|0)){m=5943}else{if((e|0)==(k+l|0)){if((fw(d+(l<<2)|0,h,e-l|0)|0)<0){m=5943;break}}n=g;o=d;fF(n,o+(l<<2)|0,0,d+(l<<2)|0,e-l|0,h,k);p=(e-l|0)-k|0;p=p+((c[n+(p<<2)>>2]|0)!=0&1)|0;if((b|0)!=0){b=b-(c[f+12>>2]|0)|0}i=fq(i,b,n,p,f-20|0,g+(p<<2)|0)|0;i=fq(i,c[f+12>>2]|0,o,k+l|0,f-20|0,g)|0;break}}while(0);if((m|0)==5943){i=fq(i,b,d,e,f-20|0,g)|0}j=i;return j|0}function fr(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+648|0;h=g|0;j=g+640|0;k=a;a=b;b=e;e=f;if((e&e-1|0)!=0){if(!(b>>>0>=2e3)){l=fs(k,a,b,e)|0;m=l;i=g;return m|0}c[j>>2]=0;f=((b>>>0)/((c[10008+(e*20&-1)>>2]|0)>>>0)>>>0)+1|0;ft(h|0,dD(j,f+32<<2)|0,f,e);n=fx(k,a,b,h|0,dD(j,f+32<<2)|0)|0;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}l=n;m=l;i=g;return m|0}n=c[(10008+(e*20&-1)|0)+12>>2]|0;e=0;j=0;f=0;h=(a+b|0)-1|0;while(1){if(!(h>>>0>=a>>>0)){break}b=d[h]|0;j=j|b<<f;f=f+n|0;if((f|0)>=32){o=e;e=o+1|0;c[k+(o<<2)>>2]=j;f=f-32|0;j=b>>n-f}h=h-1|0}if((j|0)!=0){h=e;e=h+1|0;c[k+(h<<2)>>2]=j}l=e;m=l;i=g;return m|0}function fs(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;g=a;a=b;b=e;e=f;f=c[(10008+(e*20&-1)|0)+12>>2]|0;h=c[10008+(e*20&-1)>>2]|0;i=0;j=h;while(1){if(j>>>0>=b>>>0){break}k=a;a=k+1|0;l=d[k]|0;if((e|0)==10){m=8;while(1){if((m|0)==0){break}k=a;a=k+1|0;l=(l*10&-1)+(d[k]|0)|0;m=m-1|0}}else{m=h-1|0;while(1){if((m|0)==0){break}k=ab(l,e);n=a;a=n+1|0;l=k+(d[n]|0)|0;m=m-1|0}}if((i|0)==0){if((l|0)!=0){c[g>>2]=l;i=1}}else{o=eK(g,g,i,f)|0;o=o+(eF(g,g,i,l)|0)|0;if((o|0)!=0){n=i;i=n+1|0;c[g+(n<<2)>>2]=o}}j=j+h|0}f=e;n=a;a=n+1|0;l=d[n]|0;if((e|0)==10){m=(b-(j-9|0)|0)-1|0;while(1){if((m|0)<=0){break}n=a;a=n+1|0;l=(l*10&-1)+(d[n]|0)|0;f=f*10&-1;m=m-1|0}}else{m=(b-(j-h|0)|0)-1|0;while(1){if((m|0)<=0){break}h=ab(l,e);j=a;a=j+1|0;l=h+(d[j]|0)|0;f=ab(f,e);m=m-1|0}}if((i|0)==0){if((l|0)!=0){c[g>>2]=l;i=1}m=i;return m|0}else{o=eK(g,g,i,f)|0;o=o+(eF(g,g,i,l)|0)|0;if((o|0)!=0){l=i;i=l+1|0;c[g+(l<<2)>>2]=o}m=i;return m|0}return 0}function ft(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=a;a=b;b=e;e=f;f=a;h=c[10008+(e*20&-1)>>2]|0;i=c[(10008+(e*20&-1)|0)+12>>2]|0;j=f;f=f+4|0;k=h;c[j>>2]=i;l=1;m=b-1|0;if(m>>>0<65536){n=m>>>0<256?1:9}else{n=m>>>0<16777216?17:25}o=n;n=(33-o|0)-(d[9872+(m>>>(o>>>0))|0]|0)|0;n=31-n|0;c[g+(n*20&-1)>>2]=j;c[(g+(n*20&-1)|0)+4>>2]=l;c[(g+(n*20&-1)|0)+12>>2]=k;c[(g+(n*20&-1)|0)+16>>2]=e;c[(g+(n*20&-1)|0)+8>>2]=0;o=0;m=n-1|0;while(1){if(!((m|0)>=0)){p=6043;break}n=f;f=f+(l<<1<<2)|0;if((((f>>>0<(a+(b+32<<2)|0)>>>0^1)&1|0)!=0&1|0)!=0){p=6032;break}fi(n,j,l);l=(l<<1)-1|0;l=l+((c[n+(l<<2)>>2]|0)!=0&1)|0;k=k<<1;if((b-1>>m&2|0)==0){eR(n,n,l,i);l=l-((c[n+(l-1<<2)>>2]|0)==0&1)|0;k=k-h|0}o=o<<1;while(1){if((c[n>>2]|0)==0){q=(c[n+4>>2]&(i&-i)-1|0)==0}else{q=0}if(!q){break}n=n+4|0;l=l-1|0;o=o+1|0}j=n;c[g+(m*20&-1)>>2]=j;c[(g+(m*20&-1)|0)+4>>2]=l;c[(g+(m*20&-1)|0)+12>>2]=k;c[(g+(m*20&-1)|0)+16>>2]=e;c[(g+(m*20&-1)|0)+8>>2]=o;m=m-1|0}if((p|0)==6032){dF(7472,167,8736)}else if((p|0)==6043){return}}function fu(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a;a=b;b=d;d=e;e=1;g=0;h=0;i=1;do{if(b>>>0<d>>>0){j=6054;break}else{j=6051;break}}while(0);while(1){if((j|0)==6051){j=0;k=(b>>>0)/(d>>>0)>>>0;b=b-ab(k,d)|0;if((b|0)==0){j=6052;break}e=e-ab(k,h)|0;g=g-ab(k,i)|0;j=6054;continue}else if((j|0)==6054){j=0;k=(d>>>0)/(b>>>0)>>>0;d=d-ab(k,b)|0;if((d|0)==0){j=6055;break}h=h-ab(k,e)|0;i=i-ab(k,g)|0;j=6051;continue}}if((j|0)==6052){c[f>>2]=h;c[a>>2]=i;i=d;d=i;return d|0}else if((j|0)==6055){c[f>>2]=e;c[a>>2]=g;i=b;d=i;return d|0}return 0}function fv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a;a=b;b=0;e=a>>2;while(1){if((e|0)==0){break}f=c[d>>2]|0;f=f-(f>>>1&1431655765)|0;f=(f>>>2&858993459)+(f&858993459)|0;g=c[d+4>>2]|0;g=g-(g>>>1&1431655765)|0;g=(g>>>2&858993459)+(g&858993459)|0;h=f+g|0;h=(h>>>4&252645135)+(h&252645135)|0;g=c[d+8>>2]|0;g=g-(g>>>1&1431655765)|0;g=(g>>>2&858993459)+(g&858993459)|0;i=c[d+12>>2]|0;i=i-(i>>>1&1431655765)|0;i=(i>>>2&858993459)+(i&858993459)|0;j=g+i|0;j=(j>>>4&252645135)+(j&252645135)|0;k=h+j|0;k=(k>>>8)+k|0;k=(k>>>16)+k|0;b=b+(k&255)|0;d=d+16|0;e=e-1|0}a=a&3;if((a|0)==0){l=b;return l|0}k=0;while(1){f=c[d>>2]|0;f=f-(f>>>1&1431655765)|0;f=(f>>>2&858993459)+(f&858993459)|0;f=(f>>>4)+f&252645135;k=k+f|0;d=d+4|0;e=a-1|0;a=e;if((e|0)==0){break}}k=(k>>>8)+k|0;k=(k>>>16)+k|0;b=b+(k&255)|0;l=b;return l|0}function fw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=0;f=d;while(1){d=f-1|0;f=d;if(!((d|0)>=0)){break}g=c[e+(f<<2)>>2]|0;h=c[a+(f<<2)>>2]|0;if((g|0)!=(h|0)){i=6078;break}}if((i|0)==6078){b=g>>>0>h>>>0?1:-1}return b|0}function fx(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=a;a=b;b=d;d=e;e=f;f=c[d+12>>2]|0;if(b>>>0<=f>>>0){if(b>>>0>=750){h=fx(g,a,b,d+20|0,e)|0;i=h;return i|0}else{h=fs(g,a,b,c[d+16>>2]|0)|0;i=h;return i|0}}j=b-f|0;if(j>>>0>=750){k=fx(e,a,j,d+20|0,g)|0}else{k=fs(e,a,j,c[d+16>>2]|0)|0}j=c[d+8>>2]|0;if((k|0)==0){if((((c[d+4>>2]|0)+j|0)+1|0)!=0){l=g;m=((c[d+4>>2]|0)+j|0)+1|0;while(1){n=l;l=n+4|0;c[n>>2]=0;n=m-1|0;m=n;if((n|0)==0){break}}}}else{if((c[d+4>>2]|0)>(k|0)){m=g+(j<<2)|0;l=c[d>>2]|0;n=c[d+4>>2]|0;o=e;p=k;e_(m,l,n,o,p)}else{p=g+(j<<2)|0;o=e;n=k;l=c[d>>2]|0;m=c[d+4>>2]|0;e_(p,o,n,l,m)}if((j|0)!=0){m=g;l=j;while(1){n=m;m=n+4|0;c[n>>2]=0;n=l-1|0;l=n;if((n|0)==0){break}}}}a=(a+b|0)+(-f|0)|0;if(f>>>0>=750){q=fx(e,a,f,d+20|0,((e+(c[d+4>>2]<<2)|0)+(j<<2)|0)+4|0)|0}else{q=fs(e,a,f,c[d+16>>2]|0)|0}if((q|0)!=0){f=eG(g,g,e,q)|0;e=g+(q<<2)|0;q=(c[e>>2]|0)+f|0;c[e>>2]=q;if(q>>>0<f>>>0){while(1){f=e+4|0;e=f;q=(c[f>>2]|0)+1|0;c[f>>2]=q;if((q|0)!=0){break}}}}e=(k+(c[d+4>>2]|0)|0)+j|0;h=e-((c[g+(e-1<<2)>>2]|0)==0&1)|0;i=h;return i|0}function fy(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;j=i;i=i+96|0;k=j|0;l=j+32|0;m=j+40|0;n=j+64|0;o=j+88|0;p=a;a=b;b=d;d=e;e=f;f=g;g=h;h=g+1|0;c[l>>2]=0;q=(g<<2)+3|0;r=(e-g|0)+1|0;if((r|0)>(q|0)){q=r}if((g|0)>=600){s=(g|0)/2&-1;t=(g|0)/3&-1;if((s|0)<(t|0)){u=s}else{u=t}v=u;if((s|0)>(t|0)){w=s}else{w=t}x=(((g-v|0)+1|0)/2&-1)+1<<2;t=f3(g-v|0)|0;v=(w+g|0)-1|0;if((t|0)>(v|0)){y=t}else{y=v}r=x+y|0;if((r|0)>(q|0)){q=r}r=4203;if((r|0)>(q|0)){q=r}q=q+(g+1<<1)|0}if(((q<<2>>>0<65536&1|0)!=0&1|0)!=0){r=i;i=i+(q<<2)|0;i=i+7>>3<<3;z=r}else{z=dD(l,q<<2)|0}q=z;do{if((e|0)>(g|0)){fF(q,d,0,d,e,f,g);if((fz(d,g)|0)==0){break}if((g|0)!=0){z=g-1|0;r=p;y=f;v=y;y=v+4|0;t=c[v>>2]|0;if((z|0)!=0){while(1){v=r;r=v+4|0;c[v>>2]=t;v=y;y=v+4|0;t=c[v>>2]|0;v=z-1|0;z=v;if((v|0)==0){break}}}z=r;r=z+4|0;c[z>>2]=t}c[b>>2]=0;if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=g;B=A;i=j;return B|0}}while(0);if(!((g|0)>=600)){e=fE(p,a,b,d,f,g,q)|0;if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=e;B=A;i=j;return B|0}if((h<<1|0)!=0){e=q;z=h<<1;while(1){y=e;e=y+4|0;c[y>>2]=0;y=z-1|0;z=y;if((y|0)==0){break}}}z=q;q=q+(h<<2)|0;e=q;q=q+(h<<2)|0;c[k>>2]=p;c[k+8>>2]=a;c[k+12>>2]=b;h=(g|0)/2&-1;fP(m,g-h|0,q);y=f5(d+(h<<2)|0,f+(h<<2)|0,g-h|0,m,q+(x<<2)|0)|0;do{if((y|0)>0){g=fV(m,h+y|0,d,f,h,q+(x<<2)|0)|0;if((c[m+4>>2]|0)!=0){v=(c[m+4>>2]|0)-1|0;w=z;s=c[(m+8|0)+8>>2]|0;u=s;s=u+4|0;C=c[u>>2]|0;if((v|0)!=0){while(1){u=w;w=u+4|0;c[u>>2]=C;u=s;s=u+4|0;C=c[u>>2]|0;u=v-1|0;v=u;if((u|0)==0){break}}}v=w;w=v+4|0;c[v>>2]=C}if((c[m+4>>2]|0)!=0){v=(c[m+4>>2]|0)-1|0;s=e;t=c[((m+8|0)+8|0)+4>>2]|0;r=t;t=r+4|0;u=c[r>>2]|0;if((v|0)!=0){while(1){r=s;s=r+4|0;c[r>>2]=u;r=t;t=r+4|0;u=c[r>>2]|0;r=v-1|0;v=r;if((r|0)==0){break}}}v=s;s=v+4|0;c[v>>2]=u}D=c[m+4>>2]|0;while(1){if((c[z+(D-1<<2)>>2]|c[e+(D-1<<2)>>2]|0)!=0){break}D=D-1|0}}else{c[e>>2]=1;c[k+20>>2]=z;c[k+24>>2]=e;c[k+28>>2]=q+(g<<2)|0;c[k+16>>2]=1;g=fC(d,f,g,0,820,k,q)|0;if((g|0)!=0){D=c[k+16>>2]|0;break}if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=c[k+4>>2]|0;B=A;i=j;return B|0}}while(0);while(1){if(!((g|0)>=600)){break}m=(g|0)/3&-1;fP(n,g-m|0,q);h=f5(d+(m<<2)|0,f+(m<<2)|0,g-m|0,n,q+(x<<2)|0)|0;if((h|0)>0){y=q+(x<<2)|0;g=fV(n,m+h|0,d,f,m,y)|0;if((D|0)!=0){m=D-1|0;h=y;u=z;s=u;u=s+4|0;v=c[s>>2]|0;if((m|0)!=0){while(1){s=h;h=s+4|0;c[s>>2]=v;s=u;u=s+4|0;v=c[s>>2]|0;s=m-1|0;m=s;if((s|0)==0){break}}}m=h;h=m+4|0;c[m>>2]=v}D=fA(n,z,y,e,D,y+(D<<2)|0)|0}else{c[k+20>>2]=z;c[k+24>>2]=e;c[k+28>>2]=q+(g<<2)|0;c[k+16>>2]=D;g=fC(d,f,g,0,820,k,q)|0;if((g|0)==0){E=6282;break}D=c[k+16>>2]|0}}if((E|0)==6282){if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=c[k+4>>2]|0;B=A;i=j;return B|0}if((((fw(d,f,g)|0)==0&1|0)!=0&1|0)!=0){if((g|0)!=0){k=g-1|0;n=p;x=d;m=x;x=m+4|0;u=c[m>>2]|0;if((k|0)!=0){while(1){m=n;n=m+4|0;c[m>>2]=u;m=x;x=m+4|0;u=c[m>>2]|0;m=k-1|0;k=m;if((m|0)==0){break}}}k=n;n=k+4|0;c[k>>2]=u}u=0;k=D;while(1){n=k-1|0;k=n;if(!((n|0)>=0)){break}F=c[z+(k<<2)>>2]|0;G=c[e+(k<<2)>>2]|0;if((F|0)!=(G|0)){E=6315;break}}if((E|0)==6315){u=F>>>0>G>>>0?1:-1}if((u|0)<0){while(1){if((D|0)<=0){break}if((c[z+(D-1<<2)>>2]|0)!=0){E=6325;break}D=D-1|0}if((D|0)!=0){u=D-1|0;G=a;F=z;k=F;F=k+4|0;n=c[k>>2]|0;if((u|0)!=0){while(1){k=G;G=k+4|0;c[k>>2]=n;k=F;F=k+4|0;n=c[k>>2]|0;k=u-1|0;u=k;if((k|0)==0){break}}}u=G;G=u+4|0;c[u>>2]=n}c[b>>2]=-D|0}else{while(1){if((c[e+(D-1<<2)>>2]|0)!=0){break}D=D-1|0}if((D|0)!=0){n=D-1|0;u=a;G=e;F=G;G=F+4|0;k=c[F>>2]|0;if((n|0)!=0){while(1){F=u;u=F+4|0;c[F>>2]=k;F=G;G=F+4|0;k=c[F>>2]|0;F=n-1|0;n=F;if((F|0)==0){break}}}n=u;u=n+4|0;c[n>>2]=k}c[b>>2]=D}if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=g;B=A;i=j;return B|0}do{if((((c[z>>2]|0)==0&1|0)!=0&1|0)!=0){if((D|0)!=1){break}k=fE(p,a,b,d,f,g,q)|0;if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=k;B=A;i=j;return B|0}}while(0);k=q;q=q+(g<<2)|0;if((g|0)!=0){n=g-1|0;u=q;G=d;F=G;G=F+4|0;x=c[F>>2]|0;if((n|0)!=0){while(1){F=u;u=F+4|0;c[F>>2]=x;F=G;G=F+4|0;x=c[F>>2]|0;F=n-1|0;n=F;if((F|0)==0){break}}}n=u;u=n+4|0;c[n>>2]=x}if((g|0)!=0){x=g-1|0;n=q+(g<<2)|0;u=f;G=u;u=G+4|0;F=c[G>>2]|0;if((x|0)!=0){while(1){G=n;n=G+4|0;c[G>>2]=F;G=u;u=G+4|0;F=c[G>>2]|0;G=x-1|0;x=G;if((G|0)==0){break}}}x=n;n=x+4|0;c[x>>2]=F}F=fE(p,k,o,q,q+(g<<2)|0,g,q+(g<<1<<2)|0)|0;x=D;while(1){if((x|0)<=0){break}if((c[z+(x-1<<2)>>2]|0)!=0){E=6424;break}x=x-1|0}if((c[o>>2]|0)==0){if((x|0)!=0){n=x-1|0;u=a;G=z;m=G;G=m+4|0;s=c[m>>2]|0;if((n|0)!=0){while(1){m=u;u=m+4|0;c[m>>2]=s;m=G;G=m+4|0;s=c[m>>2]|0;m=n-1|0;n=m;if((m|0)==0){break}}}n=u;u=n+4|0;c[n>>2]=s}c[b>>2]=-x|0;if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=F;B=A;i=j;return B|0}s=q;n=fB(s,d,f,g,p,F,k,c[o>>2]|0,(q+(g<<2)|0)+4|0)|0;if((c[o>>2]|0)>0){H=0}else{c[o>>2]=-(c[o>>2]|0)|0;H=1}g=D;while(1){if((g|0)<=0){break}if((c[e+(g-1<<2)>>2]|0)!=0){E=6459;break}g=g-1|0}if((c[o>>2]|0)<=(g|0)){E=a;q=e;p=g;f=k;d=c[o>>2]|0;e_(E,q,p,f,d)}else{d=a;f=k;k=c[o>>2]|0;p=e;q=g;e_(d,f,k,p,q)}D=g+(c[o>>2]|0)|0;D=D-((c[a+(D-1<<2)>>2]|0)==0&1)|0;if((n|0)>0){if((n|0)<=(x|0)){o=e;q=z;p=x;k=s;f=n;e_(o,q,p,k,f)}else{f=e;k=s;s=n;p=z;z=x;e_(f,k,s,p,z)}g=x+n|0;g=g-((c[e+(g-1<<2)>>2]|0)==0&1)|0;if((g|0)<=(D|0)){I=eL(a,a,D,e,g)|0}else{I=eL(a,e,g,a,D)|0;D=g}c[a+(D<<2)>>2]=I;D=D+((I|0)!=0&1)|0}if((H|0)!=0){J=-D|0}else{J=D}c[b>>2]=J;if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}A=F;B=A;i=j;return B|0}function fz(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=6504;break}if((c[d+(a<<2)>>2]|0)!=0){e=6501;break}a=a-1|0}if((e|0)==6504){a=1;d=a;return d|0}else if((e|0)==6501){a=0;d=a;return d|0}return 0}function fA(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=a;a=b;b=d;d=e;e=f;f=g;if((c[h+4>>2]|0)>=(e|0)){g=f;i=c[h+8>>2]|0;j=c[h+4>>2]|0;k=b;l=e;e_(g,i,j,k,l);l=a;k=c[(h+8|0)+8>>2]|0;j=c[h+4>>2]|0;i=d;g=e;e_(l,k,j,i,g)}else{g=f;i=b;j=e;k=c[h+8>>2]|0;l=c[h+4>>2]|0;e_(g,i,j,k,l);l=a;k=d;j=e;i=c[(h+8|0)+8>>2]|0;g=c[h+4>>2]|0;e_(l,k,j,i,g)}g=eG(a,a,f,e+(c[h+4>>2]|0)|0)|0;if((c[h+4>>2]|0)>=(e|0)){i=f;j=c[((h+8|0)+8|0)+4>>2]|0;k=c[h+4>>2]|0;l=d;m=e;e_(i,j,k,l,m);m=d;l=c[(h+8|0)+4>>2]|0;k=c[h+4>>2]|0;j=b;i=e;e_(m,l,k,j,i)}else{i=f;j=d;k=e;l=c[((h+8|0)+8|0)+4>>2]|0;m=c[h+4>>2]|0;e_(i,j,k,l,m);m=d;l=b;b=e;k=c[(h+8|0)+4>>2]|0;j=c[h+4>>2]|0;e_(m,l,b,k,j)}j=eG(d,d,f,e+(c[h+4>>2]|0)|0)|0;e=e+(c[h+4>>2]|0)|0;if((g|j)>>>0>0){c[a+(e<<2)>>2]=g;c[d+(e<<2)>>2]=j;e=e+1|0;n=e;return n|0}while(1){if((c[a+(e-1<<2)>>2]|c[d+(e-1<<2)>>2]|0)!=0){break}e=e-1|0}n=e;return n|0}function fB(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;if((h|0)>=0){l=h}else{l=-h|0}j=l;l=d;while(1){if((l|0)<=0){break}if((c[a+(l-1<<2)>>2]|0)!=0){m=6540;break}l=l-1|0}if((l|0)>=(j|0)){n=i;o=a;p=l;q=g;r=j;e_(n,o,p,q,r)}else{r=i;q=g;g=j;p=a;a=l;e_(r,q,g,p,a)}j=j+l|0;do{if((h|0)>0){l=i;a=i;p=j;g=e;q=f;eM(l,a,p,g,q);while(1){if((j|0)<=0){break}if((c[i+(j-1<<2)>>2]|0)!=0){m=6553;break}j=j-1|0}if((j|0)!=0){break}s=0;t=s;return t|0}else{eL(i,i,j,e,f);j=j-((c[i+(j-1<<2)>>2]|0)==0&1)|0}}while(0);f=d;while(1){if((f|0)<=0){break}if((c[b+(f-1<<2)>>2]|0)!=0){m=6564;break}f=f-1|0}m=(j+1|0)-f|0;hC(k,i,j,b,f);m=m-((c[k+(m-1<<2)>>2]|0)==0&1)|0;s=m;t=s;return t|0}function fC(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;i=a;a=b;b=e;e=f;f=g;g=h;h=d;d=h;j=h;while(1){if((j|0)<=0){break}if((c[i+(j-1<<2)>>2]|0)!=0){k=6583;break}j=j-1|0}while(1){if((d|0)<=0){break}if((c[a+(d-1<<2)>>2]|0)!=0){k=6590;break}d=d-1|0}h=0;if((j|0)==(d|0)){l=0;m=j;while(1){n=m-1|0;m=n;if(!((n|0)>=0)){break}o=c[i+(m<<2)>>2]|0;p=c[a+(m<<2)>>2]|0;if((o|0)!=(p|0)){k=6598;break}}if((k|0)==6598){l=o>>>0>p>>>0?1:-1}if((((l|0)==0&1|0)!=0&1|0)!=0){if((b|0)==0){bp[e&1023](f,i,j,0,0,-1)}q=0;r=q;return r|0}if((l|0)>0){l=i;i=a;a=l;h=h^1}}else{if((j|0)>(d|0)){l=i;i=a;a=l;l=j;j=d;d=l;h=h^1}}if((j|0)<=(b|0)){if((b|0)==0){bp[e&1023](f,a,d,0,0,h^1)}q=0;r=q;return r|0}eM(a,a,d,i,j);while(1){if((d|0)<=0){break}if((c[a+(d-1<<2)>>2]|0)!=0){k=6628;break}d=d-1|0}if((d|0)<=(b|0)){l=eL(a,i,j,a,d)|0;if(l>>>0>0){c[a+(j<<2)>>2]=l}q=0;r=q;return r|0}do{if((j|0)==(d|0)){l=0;p=j;while(1){o=p-1|0;p=o;if(!((o|0)>=0)){break}s=c[i+(p<<2)>>2]|0;t=c[a+(p<<2)>>2]|0;if((s|0)!=(t|0)){k=6642;break}}if((k|0)==6642){l=s>>>0>t>>>0?1:-1}if((((l|0)==0&1|0)!=0&1|0)!=0){if((b|0)>0){bp[e&1023](f,0,0,9864,1,h)}else{bp[e&1023](f,a,d,0,0,h)}q=0;r=q;return r|0}else{bp[e&1023](f,0,0,9864,1,h);if((l|0)>0){p=i;i=a;a=p;h=h^1}break}}else{bp[e&1023](f,0,0,9864,1,h);if((j|0)>(d|0)){p=i;i=a;a=p;p=j;j=d;d=p;h=h^1}}}while(0);fF(g,a,0,a,d,i,j);t=(d-j|0)+1|0;d=j;while(1){if((d|0)<=0){break}if((c[a+(d-1<<2)>>2]|0)!=0){k=6668;break}d=d-1|0}if((((d|0)<=(b|0)&1|0)!=0&1|0)!=0){if((b|0)==0){bp[e&1023](f,i,j,g,t,h);q=0;r=q;return r|0}if((d|0)>0){b=eL(a,i,j,a,d)|0;if((b|0)!=0){d=j;j=d+1|0;c[a+(d<<2)>>2]=b}}else{if((j|0)!=0){b=j-1|0;d=a;a=i;i=a;a=i+4|0;k=c[i>>2]|0;if((b|0)!=0){while(1){i=d;d=i+4|0;c[i>>2]=k;i=a;a=i+4|0;k=c[i>>2]|0;i=b-1|0;b=i;if((i|0)==0){break}}}b=d;d=b+4|0;c[b>>2]=k}}k=g;while(1){b=k;k=b+4|0;d=c[b>>2]|0;c[b>>2]=d-1|0;if((d|0)!=0){break}}}bp[e&1023](f,0,0,g,t,h);q=j;r=q;return r|0}function fD(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;h=b;b=d;d=e;e=f;f=g;g=a;a=c[g+16>>2]|0;if((h|0)==0){i=c[g+20>>2]|0;j=c[g+24>>2]|0;if((f|0)!=0){k=i;i=j;j=k}e=e-((c[d+(e-1<<2)>>2]|0)==0&1)|0;if((e|0)==1){k=c[d>>2]|0;if((k|0)==1){l=eG(i,i,j,a)|0}else{l=eN(i,j,a,k)|0}}else{k=a;while(1){if((k|0)<=0){break}if((c[j+(k-1<<2)>>2]|0)!=0){m=6789;break}k=k-1|0}if((k|0)==0){return}n=c[g+28>>2]|0;if((e|0)>(k|0)){o=n;p=d;q=e;r=j;s=k;e_(o,p,q,r,s)}else{s=n;r=j;j=k;q=d;d=e;e_(s,r,j,q,d)}k=k+e|0;k=k-((c[n+(k-1<<2)>>2]|0)==0&1)|0;if((k|0)>=(a|0)){l=eL(i,n,k,i,a)|0;a=k}else{l=eL(i,i,a,n,k)|0}}c[i+(a<<2)>>2]=l;c[g+16>>2]=a+(l>>>0>0&1)|0;return}if((b|0)!=0){l=b-1|0;i=c[g>>2]|0;k=h;h=k;k=h+4|0;n=c[h>>2]|0;if((l|0)!=0){while(1){h=i;i=h+4|0;c[h>>2]=n;h=k;k=h+4|0;n=c[h>>2]|0;h=l-1|0;l=h;if((h|0)==0){break}}}l=i;i=l+4|0;c[l>>2]=n}c[g+4>>2]=b;if((f|0)<0){b=0;n=a;while(1){l=n-1|0;n=l;if(!((l|0)>=0)){break}t=c[(c[g+20>>2]|0)+(n<<2)>>2]|0;u=c[(c[g+24>>2]|0)+(n<<2)>>2]|0;if((t|0)!=(u|0)){m=6737;break}}if((m|0)==6737){b=t>>>0>u>>>0?1:-1}f=(b|0)<0&1}if((f|0)!=0){v=c[g+20>>2]|0}else{v=c[g+24>>2]|0}b=v;while(1){if((a|0)<=0){break}if((c[b+(a-1<<2)>>2]|0)!=0){m=6750;break}a=a-1|0}if((a|0)!=0){m=a-1|0;v=c[g+8>>2]|0;u=b;b=u;u=b+4|0;t=c[b>>2]|0;if((m|0)!=0){while(1){b=v;v=b+4|0;c[b>>2]=t;b=u;u=b+4|0;t=c[b>>2]|0;b=m-1|0;m=b;if((b|0)==0){break}}}m=v;v=m+4|0;c[m>>2]=t}if((f|0)!=0){w=-a|0}else{w=a}c[c[g+12>>2]>>2]=w;return}function fE(a,b,e,f,g,h,j){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;k=i;i=i+64|0;l=k|0;m=k+32|0;n=k+48|0;o=k+56|0;p=a;a=b;b=e;e=f;f=g;g=h;h=j;j=g+1|0;if((j*3&-1|0)!=0){q=h;r=j*3&-1;while(1){s=q;q=s+4|0;c[s>>2]=0;s=r-1|0;r=s;if((s|0)==0){break}}}r=h;h=h+(j<<2)|0;q=h;h=h+(j<<2)|0;s=h;h=h+(j<<2)|0;c[q>>2]=1;j=1;c[l>>2]=p;c[l+8>>2]=a;c[l+12>>2]=b;while(1){if(!((g|0)>=2)){break}t=c[e+(g-1<<2)>>2]|c[f+(g-1<<2)>>2];if((t&-2147483648|0)!=0){u=c[e+(g-1<<2)>>2]|0;v=c[e+(g-2<<2)>>2]|0;w=c[f+(g-1<<2)>>2]|0;x=c[f+(g-2<<2)>>2]|0}else{if((g|0)==2){y=t;if(y>>>0<65536){z=y>>>0<256?1:9}else{z=y>>>0<16777216?17:25}A=z;B=(33-A|0)-(d[9872+(y>>>(A>>>0))|0]|0)|0;u=c[e+4>>2]<<B|(c[e>>2]|0)>>>((32-B|0)>>>0);v=c[e>>2]<<B;w=c[f+4>>2]<<B|(c[f>>2]|0)>>>((32-B|0)>>>0);x=c[f>>2]<<B}else{B=t;if(B>>>0<65536){C=B>>>0<256?1:9}else{C=B>>>0<16777216?17:25}t=C;A=(33-t|0)-(d[9872+(B>>>(t>>>0))|0]|0)|0;u=c[e+(g-1<<2)>>2]<<A|(c[e+(g-2<<2)>>2]|0)>>>((32-A|0)>>>0);v=c[e+(g-2<<2)>>2]<<A|(c[e+(g-3<<2)>>2]|0)>>>((32-A|0)>>>0);w=c[f+(g-1<<2)>>2]<<A|(c[f+(g-2<<2)>>2]|0)>>>((32-A|0)>>>0);x=c[f+(g-2<<2)>>2]<<A|(c[f+(g-3<<2)>>2]|0)>>>((32-A|0)>>>0)}}if((fX(u,v,w,x,m)|0)!=0){g=fR(m,h,e,f,g)|0;A=e;e=h;h=A;j=fZ(m,s,r,q,j)|0;A=r;r=s;s=A}else{c[l+20>>2]=r;c[l+24>>2]=q;c[l+28>>2]=s;c[l+16>>2]=j;g=fC(e,f,g,0,820,l,h)|0;if((g|0)==0){D=6842;break}j=c[l+16>>2]|0}}if((D|0)==6842){E=c[l+4>>2]|0;F=E;i=k;return F|0}if(((((c[e>>2]|0)>>>0>0^1)&1|0)!=0&1|0)!=0){dF(7088,239,8648);return 0}if(((((c[f>>2]|0)>>>0>0^1)&1|0)!=0&1|0)!=0){dF(7088,240,7192);return 0}if((c[e>>2]|0)==(c[f>>2]|0)){c[p>>2]=c[e>>2]|0;l=0;g=j;while(1){h=g-1|0;g=h;if(!((h|0)>=0)){break}G=c[r+(g<<2)>>2]|0;H=c[q+(g<<2)>>2]|0;if((G|0)!=(H|0)){D=6858;break}}if((D|0)==6858){l=G>>>0>H>>>0?1:-1}if((l|0)<0){while(1){if((j|0)<=0){break}if((c[r+(j-1<<2)>>2]|0)!=0){D=6868;break}j=j-1|0}if((j|0)!=0){l=j-1|0;H=a;G=r;g=G;G=g+4|0;h=c[g>>2]|0;if((l|0)!=0){while(1){g=H;H=g+4|0;c[g>>2]=h;g=G;G=g+4|0;h=c[g>>2]|0;g=l-1|0;l=g;if((g|0)==0){break}}}l=H;H=l+4|0;c[l>>2]=h}c[b>>2]=-j|0}else{while(1){if((c[q+(j-1<<2)>>2]|0)!=0){break}j=j-1|0}if((j|0)!=0){h=j-1|0;l=a;H=q;G=H;H=G+4|0;g=c[G>>2]|0;if((h|0)!=0){while(1){G=l;l=G+4|0;c[G>>2]=g;G=H;H=G+4|0;g=c[G>>2]|0;G=h-1|0;h=G;if((G|0)==0){break}}}h=l;l=h+4|0;c[h>>2]=g}c[b>>2]=j}E=1;F=E;i=k;return F|0}c[p>>2]=fu(n,o,c[e>>2]|0,c[f>>2]|0)|0;if((c[n>>2]|0)==0){while(1){if((j|0)<=0){break}if((c[r+(j-1<<2)>>2]|0)!=0){D=6923;break}j=j-1|0}if((j|0)!=0){f=j-1|0;e=a;p=r;g=p;p=g+4|0;h=c[g>>2]|0;if((f|0)!=0){while(1){g=e;e=g+4|0;c[g>>2]=h;g=p;p=g+4|0;h=c[g>>2]|0;g=f-1|0;f=g;if((g|0)==0){break}}}f=e;e=f+4|0;c[f>>2]=h}c[b>>2]=-j|0;E=1;F=E;i=k;return F|0}if((c[o>>2]|0)!=0){if((c[n>>2]|0)>0){I=0;c[o>>2]=-(c[o>>2]|0)|0}else{I=1;c[n>>2]=-(c[n>>2]|0)|0}h=eK(a,q,j,c[n>>2]|0)|0;n=eN(a,r,j,c[o>>2]|0)|0;if((h|n)>>>0>0){h=h+n|0;o=j;j=o+1|0;c[a+(o<<2)>>2]=h;if(h>>>0<n>>>0){n=j;j=n+1|0;c[a+(n<<2)>>2]=1}}while(1){if((c[a+(j-1<<2)>>2]|0)!=0){break}j=j-1|0}if((I|0)!=0){J=-j|0}else{J=j}c[b>>2]=J;E=1;F=E;i=k;return F|0}while(1){if((j|0)<=0){break}if((c[q+(j-1<<2)>>2]|0)!=0){D=6951;break}j=j-1|0}if((j|0)!=0){D=j-1|0;J=a;a=q;q=a;a=q+4|0;I=c[q>>2]|0;if((D|0)!=0){while(1){q=J;J=q+4|0;c[q>>2]=I;q=a;a=q+4|0;I=c[q>>2]|0;q=D-1|0;D=q;if((q|0)==0){break}}}D=J;J=D+4|0;c[D>>2]=I}c[b>>2]=j;E=1;F=E;i=k;return F|0}function fF(a,b,e,f,g,h,j){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;k=i;i=i+32|0;l=k|0;m=k+8|0;n=k+16|0;o=k+24|0;p=a;a=b;b=f;f=g;g=h;h=j;if(((((e|0)==0^1)&1|0)!=0&1|0)!=0){dF(7032,40,8576)}e=h;if((e|0)==0){dH()}else if((e|0)==1){c[a>>2]=eS(p,0,b,f,c[g>>2]|0)|0;i=k;return}else if((e|0)==2){c[l>>2]=0;if((c[g+4>>2]&-2147483648|0)==0){e=c[g+4>>2]|0;if(e>>>0<65536){q=e>>>0<256?1:9}else{q=e>>>0<16777216?17:25}j=q;q=(33-j|0)-(d[9872+(e>>>(j>>>0))|0]|0)|0;q=q|0;j=m|0;c[j+4>>2]=c[g+4>>2]<<q|(c[g>>2]|0)>>>((32-q|0)>>>0);c[j>>2]=c[g>>2]<<q;if(((f+1<<2>>>0<65536&1|0)!=0&1|0)!=0){m=i;i=i+(f+1<<2)|0;i=i+7>>3<<3;r=m}else{r=dD(l,f+1<<2)|0}m=r;r=eP(m,b,f,q)|0;c[m+(f<<2)>>2]=r;e=eT(p,0,m,f+((r|0)!=0&1)|0,j)|0;if((r|0)==0){c[p+(f-2<<2)>>2]=e}c[a>>2]=(c[m>>2]|0)>>>(q>>>0)|c[m+4>>2]<<32-q;c[a+4>>2]=(c[m+4>>2]|0)>>>(q>>>0)}else{j=g;if(((f<<2>>>0<65536&1|0)!=0&1|0)!=0){q=i;i=i+(f<<2)|0;i=i+7>>3<<3;s=q}else{s=dD(l,f<<2)|0}m=s;if((f|0)!=0){s=f-1|0;q=m;r=b;t=r;r=t+4|0;u=c[t>>2]|0;if((s|0)!=0){while(1){t=q;q=t+4|0;c[t>>2]=u;t=r;r=t+4|0;u=c[t>>2]|0;t=s-1|0;s=t;if((t|0)==0){break}}}s=q;q=s+4|0;c[s>>2]=u}e=eT(p,0,m,f,j)|0;c[p+(f-2<<2)>>2]=e;c[a>>2]=c[m>>2]|0;c[a+4>>2]=c[m+4>>2]|0}if((((c[l>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[l>>2]|0)}i=k;return}else{c[o>>2]=0;l=(c[b+(f-1<<2)>>2]|0)>>>0>=(c[g+(h-1<<2)>>2]|0)>>>0&1;if((f+l|0)>=(h<<1|0)){c[p+(f-h<<2)>>2]=0;if((c[g+(h-1<<2)>>2]&-2147483648|0)==0){m=c[g+(h-1<<2)>>2]|0;if(m>>>0<65536){v=m>>>0<256?1:9}else{v=m>>>0<16777216?17:25}e=v;w=(33-e|0)-(d[9872+(m>>>(e>>>0))|0]|0)|0;w=w|0;if(((h<<2>>>0<65536&1|0)!=0&1|0)!=0){e=i;i=i+(h<<2)|0;i=i+7>>3<<3;x=e}else{x=dD(o,h<<2)|0}y=x;eP(y,g,h,w);if(((f+1<<2>>>0<65536&1|0)!=0&1|0)!=0){x=i;i=i+(f+1<<2)|0;i=i+7>>3<<3;z=x}else{z=dD(o,f+1<<2)|0}A=z;c[A+(f<<2)>>2]=eP(A,b,f,w)|0;f=f+l|0}else{w=0;y=g;if(((f+1<<2>>>0<65536&1|0)!=0&1|0)!=0){z=i;i=i+(f+1<<2)|0;i=i+7>>3<<3;B=z}else{B=dD(o,f+1<<2)|0}A=B;if((f|0)!=0){B=f-1|0;z=A;x=b;e=x;x=e+4|0;m=c[e>>2]|0;if((B|0)!=0){while(1){e=z;z=e+4|0;c[e>>2]=m;e=x;x=e+4|0;m=c[e>>2]|0;e=B-1|0;B=e;if((e|0)==0){break}}}B=z;z=B+4|0;c[B>>2]=m}c[A+(f<<2)>>2]=0;f=f+l|0}m=(c[y+(h-1<<2)>>2]|0)>>>16;B=c[y+(h-1<<2)>>2]&65535;z=((c[y+(h-1<<2)>>2]^-1)>>>0)/(m>>>0)>>>0;x=c[y+(h-1<<2)>>2]^-1;e=x-ab(z,m)|0;x=ab(z,B);e=e<<16|65535;if(e>>>0<x>>>0){z=z-1|0;e=e+(c[y+(h-1<<2)>>2]|0)|0;if(e>>>0>=(c[y+(h-1<<2)>>2]|0)>>>0){if(e>>>0<x>>>0){z=z-1|0;e=e+(c[y+(h-1<<2)>>2]|0)|0}}}e=e-x|0;v=(e>>>0)/(m>>>0)>>>0;j=e-ab(v,m)|0;x=ab(v,B);j=j<<16|65535;if(j>>>0<x>>>0){v=v-1|0;j=j+(c[y+(h-1<<2)>>2]|0)|0;if(j>>>0>=(c[y+(h-1<<2)>>2]|0)>>>0){if(j>>>0<x>>>0){v=v-1|0;j=j+(c[y+(h-1<<2)>>2]|0)|0}}}j=j-x|0;x=z<<16|v;v=ab(c[y+(h-1<<2)>>2]|0,x);v=v+(c[y+(h-2<<2)>>2]|0)|0;if(v>>>0<(c[y+(h-2<<2)>>2]|0)>>>0){x=x-1|0;z=-(v>>>0>=(c[y+(h-1<<2)>>2]|0)>>>0&1)|0;v=v-(c[y+(h-1<<2)>>2]|0)|0;x=x+z|0;v=v-(z&c[y+(h-1<<2)>>2])|0}z=c[y+(h-2<<2)>>2]|0;j=x;B=z&65535;m=z>>>16;z=j&65535;e=j>>>16;j=ab(B,z);u=ab(B,e);B=ab(m,z);z=ab(m,e);u=u+(j>>>16)|0;u=u+B|0;if(u>>>0<B>>>0){z=z+65536|0}B=z+(u>>>16)|0;z=(u<<16)+(j&65535)|0;v=v+B|0;if(v>>>0<B>>>0){x=x-1|0;if(((v>>>0>=(c[y+(h-1<<2)>>2]|0)>>>0&1|0)!=0&1|0)!=0){do{if(v>>>0>(c[y+(h-1<<2)>>2]|0)>>>0){C=7126}else{if(z>>>0>=(c[y+(h-2<<2)>>2]|0)>>>0){C=7126;break}else{break}}}while(0);if((C|0)==7126){x=x-1|0}}}c[n>>2]=x;if((h|0)>=50){do{if((h|0)>=200){if(!((f|0)>=4e3)){C=7135;break}if(+(h|0)*3600.0+ +(f|0)*200.0>+(h|0)*+(f|0)){C=7135;break}x=ho(f,h,0)|0;if(((x<<2>>>0<65536&1|0)!=0&1|0)!=0){z=i;i=i+(x<<2)|0;i=i+7>>3<<3;D=z}else{D=dD(o,x<<2)|0}hj(p,a,A,f,y,h,D);A=a;break}else{C=7135}}while(0);if((C|0)==7135){D=p;x=A;z=f;v=y;B=h;hi(D,x,z,v,B,n)}}else{hf(p,A,f,y,h,c[n>>2]|0)}if((w|0)!=0){y=a;B=A;v=h;z=w;eQ(y,B,v,z)}else{if((h|0)!=0){z=h-1|0;v=a;B=A;A=B;B=A+4|0;y=c[A>>2]|0;if((z|0)!=0){while(1){A=v;v=A+4|0;c[A>>2]=y;A=B;B=A+4|0;y=c[A>>2]|0;A=z-1|0;z=A;if((A|0)==0){break}}}z=v;v=z+4|0;c[z>>2]=y}}if((((c[o>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[o>>2]|0)}i=k;return}y=f-h|0;c[p+(y<<2)>>2]=0;y=y+l|0;if((y|0)==0){if((h|0)!=0){z=h-1|0;v=a;B=b;A=B;B=A+4|0;w=c[A>>2]|0;if((z|0)!=0){while(1){A=v;v=A+4|0;c[A>>2]=w;A=B;B=A+4|0;w=c[A>>2]|0;A=z-1|0;z=A;if((A|0)==0){break}}}z=v;v=z+4|0;c[z>>2]=w}if((((c[o>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[o>>2]|0)}i=k;return}w=h-y|0;if((c[g+(h-1<<2)>>2]&-2147483648|0)==0){z=c[g+(h-1<<2)>>2]|0;if(z>>>0<65536){E=z>>>0<256?1:9}else{E=z>>>0<16777216?17:25}v=E;F=(33-v|0)-(d[9872+(z>>>(v>>>0))|0]|0)|0;F=F|0;if(((y<<2>>>0<65536&1|0)!=0&1|0)!=0){v=i;i=i+(y<<2)|0;i=i+7>>3<<3;G=v}else{G=dD(o,y<<2)|0}H=G;eP(H,g+(w<<2)|0,y,F);G=H|0;c[G>>2]=c[G>>2]|(c[g+(w-1<<2)>>2]|0)>>>((32-F|0)>>>0);if((((y<<1)+1<<2>>>0<65536&1|0)!=0&1|0)!=0){G=i;i=i+((y<<1)+1<<2)|0;i=i+7>>3<<3;I=G}else{I=dD(o,(y<<1)+1<<2)|0}J=I;K=eP(J,(b+(f<<2)|0)+(-(y<<1)<<2)|0,y<<1,F)|0;if((l|0)!=0){c[J+(y<<1<<2)>>2]=K;J=J+4|0}else{I=J|0;c[I>>2]=c[I>>2]|(c[b+((f-(y<<1)|0)-1<<2)>>2]|0)>>>((32-F|0)>>>0)}}else{F=0;H=g+(w<<2)|0;if((((y<<1)+1<<2>>>0<65536&1|0)!=0&1|0)!=0){I=i;i=i+((y<<1)+1<<2)|0;i=i+7>>3<<3;L=I}else{L=dD(o,(y<<1)+1<<2)|0}J=L;if((y<<1|0)!=0){L=(y<<1)-1|0;I=J;G=(b+(f<<2)|0)+(-(y<<1)<<2)|0;v=G;G=v+4|0;z=c[v>>2]|0;if((L|0)!=0){while(1){v=I;I=v+4|0;c[v>>2]=z;v=G;G=v+4|0;z=c[v>>2]|0;v=L-1|0;L=v;if((v|0)==0){break}}}L=I;I=L+4|0;c[L>>2]=z}if((l|0)!=0){c[J+(y<<1<<2)>>2]=0;J=J+4|0}}if((y|0)==1){l=c[H>>2]<<0>>>16;z=c[H>>2]<<0&65535;L=((c[J+4>>2]|0)>>>0)/(l>>>0)>>>0;I=c[J+4>>2]|0;G=I-ab(L,l)|0;I=ab(L,z);G=G<<16|c[J>>2]<<0>>>16;if(G>>>0<I>>>0){L=L-1|0;G=G+(c[H>>2]<<0)|0;if(G>>>0>=c[H>>2]<<0>>>0){if(G>>>0<I>>>0){L=L-1|0;G=G+(c[H>>2]<<0)|0}}}G=G-I|0;v=(G>>>0)/(l>>>0)>>>0;E=G-ab(v,l)|0;I=ab(v,z);E=E<<16|c[J>>2]<<0&65535;if(E>>>0<I>>>0){v=v-1|0;E=E+(c[H>>2]<<0)|0;if(E>>>0>=c[H>>2]<<0>>>0){if(E>>>0<I>>>0){v=v-1|0;E=E+(c[H>>2]<<0)|0}}}E=E-I|0;c[J>>2]=E>>>0;c[p>>2]=L<<16|v}else{if((y|0)==2){v=p;L=J;E=H;eT(v,0,L,4,E)}else{E=(c[H+(y-1<<2)>>2]|0)>>>16;L=c[H+(y-1<<2)>>2]&65535;v=((c[H+(y-1<<2)>>2]^-1)>>>0)/(E>>>0)>>>0;I=c[H+(y-1<<2)>>2]^-1;z=I-ab(v,E)|0;I=ab(v,L);z=z<<16|65535;if(z>>>0<I>>>0){v=v-1|0;z=z+(c[H+(y-1<<2)>>2]|0)|0;if(z>>>0>=(c[H+(y-1<<2)>>2]|0)>>>0){if(z>>>0<I>>>0){v=v-1|0;z=z+(c[H+(y-1<<2)>>2]|0)|0}}}z=z-I|0;l=(z>>>0)/(E>>>0)>>>0;G=z-ab(l,E)|0;I=ab(l,L);G=G<<16|65535;if(G>>>0<I>>>0){l=l-1|0;G=G+(c[H+(y-1<<2)>>2]|0)|0;if(G>>>0>=(c[H+(y-1<<2)>>2]|0)>>>0){if(G>>>0<I>>>0){l=l-1|0;G=G+(c[H+(y-1<<2)>>2]|0)|0}}}G=G-I|0;I=v<<16|l;l=ab(c[H+(y-1<<2)>>2]|0,I);l=l+(c[H+(y-2<<2)>>2]|0)|0;if(l>>>0<(c[H+(y-2<<2)>>2]|0)>>>0){I=I-1|0;v=-(l>>>0>=(c[H+(y-1<<2)>>2]|0)>>>0&1)|0;l=l-(c[H+(y-1<<2)>>2]|0)|0;I=I+v|0;l=l-(v&c[H+(y-1<<2)>>2])|0}v=c[H+(y-2<<2)>>2]|0;G=I;L=v&65535;E=v>>>16;v=G&65535;z=G>>>16;G=ab(L,v);B=ab(L,z);L=ab(E,v);v=ab(E,z);B=B+(G>>>16)|0;B=B+L|0;if(B>>>0<L>>>0){v=v+65536|0}L=v+(B>>>16)|0;v=(B<<16)+(G&65535)|0;l=l+L|0;if(l>>>0<L>>>0){I=I-1|0;if(((l>>>0>=(c[H+(y-1<<2)>>2]|0)>>>0&1|0)!=0&1|0)!=0){do{if(l>>>0>(c[H+(y-1<<2)>>2]|0)>>>0){C=7283}else{if(v>>>0>=(c[H+(y-2<<2)>>2]|0)>>>0){C=7283;break}else{break}}}while(0);if((C|0)==7283){I=I-1|0}}}c[n>>2]=I;if((y|0)>=50){if((y|0)>=2e3){I=ho(y<<1,y,0)|0;if(((I<<2>>>0<65536&1|0)!=0&1|0)!=0){v=i;i=i+(I<<2)|0;i=i+7>>3<<3;M=v}else{M=dD(o,I<<2)|0}I=a;if((b|0)==(I|0)){I=I+(f-y<<2)|0}hj(p,I,J,y<<1,H,y,M);if((y|0)!=0){M=y-1|0;f=J;v=I;I=v;v=I+4|0;l=c[I>>2]|0;if((M|0)!=0){while(1){I=f;f=I+4|0;c[I>>2]=l;I=v;v=I+4|0;l=c[I>>2]|0;I=M-1|0;M=I;if((I|0)==0){break}}}M=f;f=M+4|0;c[M>>2]=l}}else{hi(p,J,y<<1,H,y,n)}}else{hf(p,J,y<<1,H,y,c[n>>2]|0)}}}n=y;if((w-2|0)<0){N=0}else{N=c[g+(w-2<<2)>>2]|0}l=c[g+(w-1<<2)>>2]<<F|N>>>1>>>(((F^-1)>>>0)%32>>>0);N=c[p+(y-1<<2)>>2]<<0;M=l&65535;f=l>>>16;l=N&65535;v=N>>>16;N=ab(M,l);I=ab(M,v);M=ab(f,l);l=ab(f,v);I=I+(N>>>16)|0;I=I+M|0;if(I>>>0<M>>>0){l=l+65536|0}if((c[J+(y-1<<2)>>2]|0)>>>0<(l+(I>>>16)|0)>>>0){I=p;while(1){l=I;I=l+4|0;M=c[l>>2]|0;c[l>>2]=M-1|0;if((M|0)!=0){break}}I=eG(J,J,H,y)|0;if((I|0)!=0){c[J+(y<<2)>>2]=I;n=n+1|0}}I=0;if((F|0)!=0){H=eP(J,J,n,32-F|0)|0;M=J|0;c[M>>2]=c[M>>2]|c[b+(w-1<<2)>>2]&-1>>>(F>>>0);M=eO(J,p,y,c[g+(w-1<<2)>>2]&-1>>>(F>>>0))|0;if((y|0)!=(n|0)){if(((((c[J+(y<<2)>>2]|0)>>>0>=M>>>0^1)&1|0)!=0&1|0)!=0){dF(7032,332,7160)}F=J+(y<<2)|0;c[F>>2]=(c[F>>2]|0)-M|0}else{c[J+(y<<2)>>2]=H-M|0;I=H>>>0<M>>>0&1;n=n+1|0}w=w-1|0}if(((h<<2>>>0<65536&1|0)!=0&1|0)!=0){M=i;i=i+(h<<2)|0;i=i+7>>3<<3;O=M}else{O=dD(o,h<<2)|0}M=O;do{if((w|0)<(y|0)){if((w|0)!=0){O=M;H=p;F=y;l=g;N=w;e_(O,H,F,l,N);C=7371;break}if((n|0)!=0){N=n-1|0;l=a;F=J;H=F;F=H+4|0;O=c[H>>2]|0;if((N|0)!=0){while(1){H=l;l=H+4|0;c[H>>2]=O;H=F;F=H+4|0;O=c[H>>2]|0;H=N-1|0;N=H;if((H|0)==0){break}}}N=l;l=N+4|0;c[N>>2]=O}if(((((n|0)==(h|0)^1)&1|0)!=0&1|0)!=0){dF(7032,353,6440)}break}else{e_(M,g,w,p,y);C=7371;break}}while(0);if((C|0)==7371){K=eM(J,J,n,M+(w<<2)|0,y)|0;if((h-w|0)!=0){y=(h-w|0)-1|0;C=a+(w<<2)|0;N=J;J=N;N=J+4|0;F=c[J>>2]|0;if((y|0)!=0){while(1){J=C;C=J+4|0;c[J>>2]=F;J=N;N=J+4|0;F=c[J>>2]|0;J=y-1|0;y=J;if((J|0)==0){break}}}y=C;C=y+4|0;c[y>>2]=F}I=I|K;K=eI(a,b,M,w)|0;K=eH(a+(w<<2)|0,a+(w<<2)|0,n,K)|0;I=I|K}if((I|0)!=0){I=p;while(1){p=I;I=p+4|0;K=c[p>>2]|0;c[p>>2]=K-1|0;if((K|0)!=0){break}}eG(a,a,g,h)}if((((c[o>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[o>>2]|0)}i=k;return}}function fG(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=c;if((d|0)==0){e=0;f=e;return f|0}if((d&1|0)==0){c=a>>>1^a;while(1){d=d>>>1;b=b^c;if((d&1|0)!=0){break}}}do{if((d|0)!=1){do{if(d>>>0>=a>>>0){break}else{g=7425;break}}while(0);L9115:while(1){if((g|0)==7425){g=0;b=b^d&a;c=d;d=a;a=c}while(1){c=d-a|0;d=c;if((c|0)==0){break L9115}c=a>>>1^a;while(1){d=d>>>1;b=b^c;if((d&1|0)!=0){break}}if((d|0)==1){g=7443;break L9115}if(!(d>>>0>=a>>>0)){break}}g=7425;continue}if((g|0)==7443){break}e=0;f=e;return f|0}}while(0);e=1-(b&2)|0;f=e;return f|0}function fH(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=a;a=b;b=e;e=c[f>>2]|0;g=c[f+4>>2]|0;f=c[a>>2]|0;h=c[a+4>>2]|0;b=b<<1;do{if((h|0)==0){if((f|0)!=1){break}i=1-(b&2)|0;j=i;return j|0}}while(0);L9154:do{if((e|0)==0){if((g|0)==0){i=0;j=i;return j|0}a=g;if((((a&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(a&-a)|0]|0)-2|0}else{l=6;while(1){if((l|0)>=30){break}a=a>>>8;if((((a&255|0)!=0&1|0)!=0&1|0)!=0){m=7466;break}l=l+8|0}k=l+(d[9872+(a&-a)|0]|0)|0}b=b^k+32<<1&(f^f>>>1);e=f;f=g>>>(k>>>0);if((f|0)!=1){g=h;b=b^e&f;m=7585;break}i=1-(b&2)|0;j=i;return j|0}else{if((e&1|0)==0){n=e;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(n&-n)|0]|0)-2|0}else{o=6;while(1){if((o|0)>=30){break}n=n>>>8;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){m=7481;break}o=o+8|0}k=o+(d[9872+(n&-n)|0]|0)|0}e=g<<32-k|e>>>(k>>>0);g=g>>>(k>>>0);b=b^k<<1&(f^f>>>1)}if((g|0)==0){if(h>>>0<=0){break}b=b^e&f;a=e;e=f;f=a;g=h;m=7585;break}L9204:while(1){if(h>>>0<=0){break}while(1){if(g>>>0<=h>>>0){break}g=(g-h|0)-(e>>>0<f>>>0&1)|0;e=e-f|0;if((e|0)==0){m=7500;break L9204}a=e;if((((a&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(a&-a)|0]|0)-2|0}else{l=6;while(1){if((l|0)>=30){break}a=a>>>8;if((((a&255|0)!=0&1|0)!=0&1|0)!=0){m=7518;break}l=l+8|0}if((m|0)==7518){m=0}k=l+(d[9872+(a&-a)|0]|0)|0}b=b^k<<1&(f^f>>>1);e=g<<32-k|e>>>(k>>>0);g=g>>>(k>>>0)}if((g|0)==(h|0)){m=7525;break}if((g|0)==0){m=7527;break}b=b^e&f;while(1){if(h>>>0<=g>>>0){break}h=(h-g|0)-(f>>>0<e>>>0&1)|0;f=f-e|0;if((f|0)==0){m=7535;break L9204}p=f;if((((p&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(p&-p)|0]|0)-2|0}else{q=6;while(1){if((q|0)>=30){break}p=p>>>8;if((((p&255|0)!=0&1|0)!=0&1|0)!=0){m=7553;break}q=q+8|0}if((m|0)==7553){m=0}k=q+(d[9872+(p&-p)|0]|0)|0}b=b^k<<1&(e^e>>>1);f=h<<32-k|f>>>(k>>>0);h=h>>>(k>>>0)}b=b^e&f;if((g|0)==(h|0)){m=7560;break}}do{if((m|0)==7527){b=b^e&f;n=e;e=f;f=n;g=h;break}else if((m|0)==7535){n=h;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(n&-n)|0]|0)-2|0}else{o=6;while(1){if((o|0)>=30){break}n=n>>>8;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){m=7541;break}o=o+8|0}k=o+(d[9872+(n&-n)|0]|0)|0}b=b^k+32<<1&(e^e>>>1);f=h>>>(k>>>0);b=b^e&f;m=7585;break L9154}else if((m|0)==7525){m=7561;break}else if((m|0)==7560){m=7561;break}else if((m|0)==7500){a=g;if((((a&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(a&-a)|0]|0)-2|0}else{l=6;while(1){if((l|0)>=30){break}a=a>>>8;if((((a&255|0)!=0&1|0)!=0&1|0)!=0){m=7506;break}l=l+8|0}k=l+(d[9872+(a&-a)|0]|0)|0}b=b^k+32<<1&(f^f>>>1);e=f;f=g>>>(k>>>0);g=h;b=b^e&f;m=7585;break L9154}}while(0);if((m|0)==7561){if(e>>>0<f>>>0){n=e;e=f;f=n;b=b^e&f}e=e-f|0;if((e|0)==0){i=0;j=i;return j|0}n=e;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(n&-n)|0]|0)-2|0}else{o=6;while(1){if((o|0)>=30){break}n=n>>>8;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){m=7573;break}o=o+8|0}k=o+(d[9872+(n&-n)|0]|0)|0}b=b^k<<1&(f^f>>>1);e=e>>>(k>>>0);if((e|0)==1){i=1-(b&2)|0;j=i;return j|0}r=e;e=f;f=r;b=b^e&f}m=7585;break}}while(0);do{if((m|0)==7585){if((f|0)==1){i=1-(b&2)|0;j=i;return j|0}while(1){if(g>>>0<=0){m=7618;break}g=g-(e>>>0<f>>>0&1)|0;e=e-f|0;if((e|0)==0){break}h=e;if((((h&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(h&-h)|0]|0)-2|0}else{r=6;while(1){if((r|0)>=30){break}h=h>>>8;if((((h&255|0)!=0&1|0)!=0&1|0)!=0){m=7612;break}r=r+8|0}if((m|0)==7612){m=0}k=r+(d[9872+(h&-h)|0]|0)|0}e=g<<32-k|e>>>(k>>>0);g=g>>>(k>>>0);b=b^k<<1&(f^f>>>1)}if((m|0)==7618){break}if((g|0)==0){i=0;j=i;return j|0}n=g;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){k=(d[9872+(n&-n)|0]|0)-2|0}else{o=6;while(1){if((o|0)>=30){break}n=n>>>8;if((((n&255|0)!=0&1|0)!=0&1|0)!=0){m=7600;break}o=o+8|0}k=o+(d[9872+(n&-n)|0]|0)|0}b=b^k+32<<1&(f^f>>>1);e=g>>>(k>>>0)}}while(0);i=fG(e,f,b)|0;j=i;return j|0}function fI(a){a=a|0;return 1-((a&1)<<1)|0}function fJ(a,b,c){a=a|0;b=b|0;c=c|0;var e=0;e=a;a=d[15184+(((e<<3)+(b<<2)|0)+c|0)|0]|0;e=a;return a|0}function fK(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;g=i;i=i+56|0;h=g|0;j=g+8|0;k=g+16|0;l=g+40|0;m=a;a=b;b=e;c[h>>2]=f;f=b;if((b|0)>=1e3){e=(b<<1|0)/3&-1;n=f3(b-e|0)|0;o=(e+b|0)-1|0;if((n|0)>(o|0)){p=n}else{p=o}o=((((b-e|0)+1|0)/2&-1)+1<<2)+p|0;if((o|0)>(f|0)){f=o}}c[j>>2]=0;if(((f<<2>>>0<65536&1|0)!=0&1|0)!=0){o=i;i=i+(f<<2)|0;i=i+7>>3<<3;q=o}else{q=dD(j,f<<2)|0}f=q;while(1){if(!((b|0)>=1e3)){break}q=(b<<1|0)/3&-1;o=(((b-q|0)+1|0)/2&-1)+1<<2;fP(k,b-q|0,f);p=gc(m+(q<<2)|0,a+(q<<2)|0,b-q|0,k,h,f+(o<<2)|0)|0;if((p|0)>0){b=fV(k,q+p|0,m,a,q,f+(o<<2)|0)|0}else{b=fC(m,a,b,0,6,h,f)|0;if((b|0)==0){r=7668;break}}}if((r|0)==7668){if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}if((c[h>>2]|0)==31){s=0}else{s=fI(c[h>>2]|0)|0}t=s;u=t;i=g;return u|0}while(1){if((b|0)<=2){break}s=c[m+(b-1<<2)>>2]|c[a+(b-1<<2)>>2];if((s&-2147483648|0)!=0){v=c[m+(b-1<<2)>>2]|0;w=c[m+(b-2<<2)>>2]|0;x=c[a+(b-1<<2)>>2]|0;y=c[a+(b-2<<2)>>2]|0}else{k=s;if(k>>>0<65536){z=k>>>0<256?1:9}else{z=k>>>0<16777216?17:25}s=z;o=(33-s|0)-(d[9872+(k>>>(s>>>0))|0]|0)|0;v=c[m+(b-1<<2)>>2]<<o|(c[m+(b-2<<2)>>2]|0)>>>((32-o|0)>>>0);w=c[m+(b-2<<2)>>2]<<o|(c[m+(b-3<<2)>>2]|0)>>>((32-o|0)>>>0);x=c[a+(b-1<<2)>>2]<<o|(c[a+(b-2<<2)>>2]|0)>>>((32-o|0)>>>0);y=c[a+(b-2<<2)>>2]<<o|(c[a+(b-3<<2)>>2]|0)>>>((32-o|0)>>>0)}if((f9(v,w,x,y,l,h)|0)!=0){b=fR(l,f,m,a,b)|0;o=m;m=f;f=o}else{b=fC(m,a,b,0,6,h,f)|0;if((b|0)==0){r=7695;break}}}if((r|0)==7695){if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}if((c[h>>2]|0)==31){A=0}else{A=fI(c[h>>2]|0)|0}t=A;u=t;i=g;return u|0}if((c[h>>2]|0)>>>0>=16){A=m;m=a;a=A}if((b|0)!=1){b=fH(m,a,c[h>>2]&1)|0;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}t=b;u=t;i=g;return u|0}b=c[m>>2]|0;m=c[a>>2]|0;if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}if((m|0)==1){t=1-((c[h>>2]&1)<<1)|0;u=t;i=g;return u|0}else{t=fG(b,m,c[h>>2]<<1)|0;u=t;i=g;return u|0}return 0}function fL(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;f=b;b=e;e=g;g=a;L9491:do{if((f|0)!=0){do{if((d|0)==1){if((c[f>>2]|0)!=1){break}break L9491}}while(0);c[g>>2]=31;return}}while(0);if((b|0)==0){return}c[g>>2]=fJ(c[g>>2]|0,e,c[b>>2]&3)|0;return}function fM(a,b,d,e,f,g,h,i,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;m=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=k;k=l;l=k;k=k+(e+1<<2)|0;n=k;k=k+(j+1<<2)|0;o=k;k=k+((e+j|0)+1<<2)|0;p=k;if((e|0)>=(j|0)){k=o;q=a;r=e;s=h;t=j;e_(k,q,r,s,t)}else{t=o;s=h;r=j;q=a;k=e;e_(t,s,r,q,k)}k=fN(d,d,b,e)|0;if((k|0)!=0){u=fN(a,a,d,e)|0;c[a+(e<<2)>>2]=0}else{c[a+(e<<2)>>2]=eG(a,a,d,e)|0;u=0}if((u|0)!=0){c[l+(e<<2)>>2]=eG(l,a,m,e)|0;v=0}else{if((c[a+(e<<2)>>2]|0)!=0){q=c[a+(e<<2)>>2]|0;c[l+(e<<2)>>2]=q-(eI(l,a,m,e)|0)|0;v=1}else{v=fN(l,m,a,e)|0;c[l+(e<<2)>>2]=0}}if((e|0)>=(j|0)){q=p;r=m;s=e;t=f;w=j;e_(q,r,s,t,w)}else{w=p;t=f;s=j;r=m;q=e;e_(w,t,s,r,q)}c[m+(e+j<<2)>>2]=eG(m,o,p,e+j|0)|0;m=fN(n,i,h,j)|0;h=k^m^1;if((e|0)>=(j|0)){q=p;r=d;s=e;t=n;w=j;e_(q,r,s,t,w)}else{w=p;t=n;s=j;r=d;q=e;e_(w,t,s,r,q)}c[p+(e+j<<2)>>2]=0;if((m|0)!=0){m=fN(n,g,n,j)|0;c[n+(j<<2)>>2]=0}else{c[n+(j<<2)>>2]=eG(n,n,g,j)|0}if((c[n+(j<<2)>>2]|0)!=0){if((e|0)>=(j+1|0)){q=d;r=a;s=e;t=n;w=j+1|0;e_(q,r,s,t,w)}else{w=d;t=n;s=j+1|0;r=a;q=e;e_(w,t,s,r,q)}if((c[a+(e<<2)>>2]|0)!=0){q=d+(e<<2)|0;r=d+(e<<2)|0;s=n;t=j+1|0;eG(q,r,s,t)}}else{if((e+1|0)>=(j|0)){t=d;s=a;r=e+1|0;q=n;w=j;e_(t,s,r,q,w)}else{w=d;q=n;r=j;s=a;t=e+1|0;e_(w,q,r,s,t)}}c[o+(e+j<<2)>>2]=0;if((u^m|0)!=0){k=fN(d,o,d,(e+j|0)+1|0)|0}else{t=d;s=d;r=o;q=(e+j|0)+1|0;eG(t,s,r,q);k=0}if((m|0)!=0){c[n+(j<<2)>>2]=eG(n,n,f,j)|0}else{if((c[n+(j<<2)>>2]|0)!=0){q=eI(n,n,f,j)|0;r=n+(j<<2)|0;c[r>>2]=(c[r>>2]|0)-q|0}else{m=fN(n,n,f,j)|0}}if((e|0)>=(j+1|0)){f=o;q=b;r=e;s=n;t=j+1|0;e_(f,q,r,s,t)}else{t=o;s=n;r=j+1|0;q=b;f=e;e_(t,s,r,q,f)}if((u|0)!=0){u=a;f=b;q=a;r=e;eI(u,f,q,r)}else{r=eG(a,a,b,e)|0;q=a+(e<<2)|0;c[q>>2]=(c[q>>2]|0)+r|0}e=e+1|0;m=fO(b,d,k,o,m,e+j|0)|0;k=fO(d,d,k,p,h,e+j|0)|0;if((e|0)>=(j|0)){h=o;r=l;q=e;f=g;u=j;e_(h,r,q,f,u)}else{u=o;f=g;q=j;r=l;l=e;e_(u,f,q,r,l)}c[n+(j<<2)>>2]=eG(n,i,g,j)|0;if((e|0)>=(j+1|0)){g=p;i=a;l=e;r=n;q=j+1|0;e_(g,i,l,r,q)}else{q=p;r=n;n=j+1|0;l=a;i=e;e_(q,r,n,l,i)}j=j+e|0;fO(a,d,k,o,v,j);if((k|0)!=0){k=d;v=p;o=d;a=j;eG(k,v,o,a)}else{a=d;o=p;v=d;d=j;eI(a,o,v,d)}if((m|0)!=0){m=b;d=p;v=b;o=j;eG(m,d,v,o)}else{o=b;v=p;p=b;b=j;eI(o,v,p,b)}return}function fN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a;a=b;b=d;d=e;e=0;g=d;while(1){h=g-1|0;g=h;if(!((h|0)>=0)){break}i=c[a+(g<<2)>>2]|0;j=c[b+(g<<2)>>2]|0;if((i|0)!=(j|0)){k=7851;break}}if((k|0)==7851){e=i>>>0>j>>>0?1:-1}if((e|0)>=0){e=f;j=a;i=b;k=d;eI(e,j,i,k);k=0;i=k;return i|0}else{j=f;f=b;b=a;a=d;eI(j,f,b,a);k=1;i=k;return i|0}return 0}function fO(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=a;a=b;b=c;c=d;d=f;if((b|0)!=(e|0)){e=b^fN(g,a,c,d);f=e;return f|0}else{h=g;g=a;a=c;c=d;eG(h,g,a,c);e=b;f=e;return f|0}return 0}function fP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=d;d=((b+1|0)/2&-1)+1|0;c[e>>2]=d;c[e+4>>2]=1;if((d<<2|0)!=0){b=a;f=d<<2;while(1){g=b;b=g+4|0;c[g>>2]=0;g=f-1|0;f=g;if((g|0)==0){break}}}c[e+8>>2]=a;c[(e+8|0)+4>>2]=a+(d<<2)|0;c[(e+8|0)+8>>2]=a+(d<<1<<2)|0;c[((e+8|0)+8|0)+4>>2]=a+((d*3&-1)<<2)|0;c[c[((e+8|0)+8|0)+4>>2]>>2]=1;c[c[e+8>>2]>>2]=1;return}function fQ(a,b,d,e,f,g,h,i,j,k,l){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;m=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=k;k=l;do{if((e|0)>=30){if(!((j|0)>=30)){break}fM(m,a,b,d,e,f,g,h,i,j,k);return}}while(0);l=k+(e<<2)|0;n=(l+(e<<2)|0)+(j<<2)|0;o=0;while(1){if(o>>>0>=2){break}if((e|0)!=0){p=e-1|0;q=k;r=m;s=r;r=s+4|0;t=c[s>>2]|0;if((p|0)!=0){while(1){s=q;q=s+4|0;c[s>>2]=t;s=r;r=s+4|0;t=c[s>>2]|0;s=p-1|0;p=s;if((s|0)==0){break}}}p=q;q=p+4|0;c[p>>2]=t}if((e|0)>=(j|0)){p=l;r=m;s=e;u=f;v=j;e_(p,r,s,u,v);v=n;u=a;s=e;r=i;p=j;e_(v,u,s,r,p);p=m;r=a;s=e;u=h;v=j;e_(p,r,s,u,v);v=a;u=k;s=e;r=g;p=j;e_(v,u,s,r,p)}else{p=l;r=f;s=j;u=m;v=e;e_(p,r,s,u,v);v=n;u=i;s=j;r=a;p=e;e_(v,u,s,r,p);p=m;r=h;s=j;u=a;v=e;e_(p,r,s,u,v);v=a;u=g;s=j;r=k;p=e;e_(v,u,s,r,p)}c[m+(e+j<<2)>>2]=eG(m,m,l,e+j|0)|0;c[a+(e+j<<2)>>2]=eG(a,a,n,e+j|0)|0;m=b;a=d;o=o+1|0}return}function fR(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=a;a=b;b=d;d=e;e=f;f=eK(a,b,e,c[((g|0)+8|0)+4>>2]|0)|0;h=eO(a,d,e,c[(g|0)+4>>2]|0)|0;f=eK(d,d,e,c[g>>2]|0)|0;h=eO(d,b,e,c[(g|0)+8>>2]|0)|0;e=e-((c[a+(e-1<<2)>>2]|c[d+(e-1<<2)>>2]|0)==0&1)|0;return e|0}function fS(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;if((b|0)==1){f=c[a>>2]|0;k=eN(c[(j+8|0)+(d<<2)>>2]|0,c[(j+8|0)+(1-d<<2)>>2]|0,c[j+4>>2]|0,f)|0;l=eN(c[((j+8|0)+8|0)+(d<<2)>>2]|0,c[((j+8|0)+8|0)+(1-d<<2)>>2]|0,c[j+4>>2]|0,f)|0;c[(c[(j+8|0)+(d<<2)>>2]|0)+(c[j+4>>2]<<2)>>2]=k;c[(c[((j+8|0)+8|0)+(d<<2)>>2]|0)+(c[j+4>>2]<<2)>>2]=l;f=j+4|0;c[f>>2]=(c[f>>2]|0)+((k|l|0)!=0&1)|0}else{l=c[j+4>>2]|0;while(1){if((l+b|0)<=(c[j+4>>2]|0)){break}if((c[(c[(j+8|0)+(1-d<<2)>>2]|0)+(l-1<<2)>>2]|0)>>>0>0){m=7922;break}if((c[(c[((j+8|0)+8|0)+(1-d<<2)>>2]|0)+(l-1<<2)>>2]|0)>>>0>0){m=7922;break}l=l-1|0}m=0;while(1){if(m>>>0>=2){break}if((b|0)<=(l|0)){k=e;f=c[((j+8|0)+(m<<3)|0)+(1-d<<2)>>2]|0;n=l;o=a;p=b;e_(k,f,n,o,p)}else{p=e;o=a;n=b;f=c[((j+8|0)+(m<<3)|0)+(1-d<<2)>>2]|0;k=l;e_(p,o,n,f,k)}c[h+(m<<2)>>2]=eL(c[((j+8|0)+(m<<3)|0)+(d<<2)>>2]|0,e,l+b|0,c[((j+8|0)+(m<<3)|0)+(d<<2)>>2]|0,c[j+4>>2]|0)|0;m=m+1|0}l=l+b|0;if((c[h>>2]|c[h+4>>2]|0)!=0){c[(c[(j+8|0)+(d<<2)>>2]|0)+(l<<2)>>2]=c[h>>2]|0;c[(c[((j+8|0)+8|0)+(d<<2)>>2]|0)+(l<<2)>>2]=c[h+4>>2]|0;l=l+1|0}else{l=l-((c[(c[(j+8|0)+(d<<2)>>2]|0)+(l-1<<2)>>2]|c[(c[((j+8|0)+8|0)+(d<<2)>>2]|0)+(l-1<<2)>>2]|0)==0&1)|0}c[j+4>>2]=l}i=g;return}function fT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=a;a=b;b=d;if((c[e+4>>2]|0)!=0){d=(c[e+4>>2]|0)-1|0;f=b;g=c[e+8>>2]|0;h=g;g=h+4|0;i=c[h>>2]|0;if((d|0)!=0){while(1){h=f;f=h+4|0;c[h>>2]=i;h=g;g=h+4|0;i=c[h>>2]|0;h=d-1|0;d=h;if((h|0)==0){break}}}d=f;f=d+4|0;c[d>>2]=i}i=fZ(a,c[e+8>>2]|0,b,c[(e+8|0)+4>>2]|0,c[e+4>>2]|0)|0;if((c[e+4>>2]|0)!=0){d=(c[e+4>>2]|0)-1|0;f=b;g=c[(e+8|0)+8>>2]|0;h=g;g=h+4|0;j=c[h>>2]|0;if((d|0)!=0){while(1){h=f;f=h+4|0;c[h>>2]=j;h=g;g=h+4|0;j=c[h>>2]|0;h=d-1|0;d=h;if((h|0)==0){break}}}d=f;f=d+4|0;c[d>>2]=j}j=fZ(a,c[(e+8|0)+8>>2]|0,b,c[((e+8|0)+8|0)+4>>2]|0,c[e+4>>2]|0)|0;if((i|0)>(j|0)){k=i}else{k=j}c[e+4>>2]=k;return}function fU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=b;fQ(c[e+8>>2]|0,c[(e+8|0)+4>>2]|0,c[(e+8|0)+8>>2]|0,c[((e+8|0)+8|0)+4>>2]|0,c[e+4>>2]|0,c[a+8>>2]|0,c[(a+8|0)+4>>2]|0,c[(a+8|0)+8>>2]|0,c[((a+8|0)+8|0)+4>>2]|0,c[a+4>>2]|0,d);d=(c[e+4>>2]|0)+(c[a+4>>2]|0)|0;d=d-((c[(c[e+8>>2]|0)+(d<<2)>>2]|c[(c[(e+8|0)+4>>2]|0)+(d<<2)>>2]|c[(c[(e+8|0)+8>>2]|0)+(d<<2)>>2]|c[(c[((e+8|0)+8|0)+4>>2]|0)+(d<<2)>>2]|0)==0&1)|0;d=d-((c[(c[e+8>>2]|0)+(d<<2)>>2]|c[(c[(e+8|0)+4>>2]|0)+(d<<2)>>2]|c[(c[(e+8|0)+8>>2]|0)+(d<<2)>>2]|c[(c[((e+8|0)+8|0)+4>>2]|0)+(d<<2)>>2]|0)==0&1)|0;d=d-((c[(c[e+8>>2]|0)+(d<<2)>>2]|c[(c[(e+8|0)+4>>2]|0)+(d<<2)>>2]|c[(c[(e+8|0)+8>>2]|0)+(d<<2)>>2]|c[(c[((e+8|0)+8|0)+4>>2]|0)+(d<<2)>>2]|0)==0&1)|0;c[e+4>>2]=d+1|0;return}function fV(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=a;a=b;b=d;d=e;e=f;f=g;g=f;i=(f+(e<<2)|0)+(c[h+4>>2]<<2)|0;if((c[h+4>>2]|0)>=(e|0)){f=g;j=c[((h+8|0)+8|0)+4>>2]|0;k=c[h+4>>2]|0;l=b;m=e;e_(f,j,k,l,m);m=i;l=c[(h+8|0)+8>>2]|0;k=c[h+4>>2]|0;j=b;f=e;e_(m,l,k,j,f)}else{f=g;j=b;k=e;l=c[((h+8|0)+8|0)+4>>2]|0;m=c[h+4>>2]|0;e_(f,j,k,l,m);m=i;l=b;k=e;j=c[(h+8|0)+8>>2]|0;f=c[h+4>>2]|0;e_(m,l,k,j,f)}if((e|0)!=0){f=e-1|0;j=b;k=g;l=k;k=l+4|0;m=c[l>>2]|0;if((f|0)!=0){while(1){l=j;j=l+4|0;c[l>>2]=m;l=k;k=l+4|0;m=c[l>>2]|0;l=f-1|0;f=l;if((l|0)==0){break}}}f=j;j=f+4|0;c[f>>2]=m}m=eL(b+(e<<2)|0,b+(e<<2)|0,a-e|0,g+(e<<2)|0,c[h+4>>2]|0)|0;if((c[h+4>>2]|0)>=(e|0)){f=g;j=c[(h+8|0)+4>>2]|0;k=c[h+4>>2]|0;l=d;n=e;e_(f,j,k,l,n)}else{n=g;l=d;k=e;j=c[(h+8|0)+4>>2]|0;f=c[h+4>>2]|0;e_(n,l,k,j,f)}f=eM(b,b,a,g,e+(c[h+4>>2]|0)|0)|0;m=m-f|0;if((c[h+4>>2]|0)>=(e|0)){j=g;k=c[h+8>>2]|0;l=c[h+4>>2]|0;n=d;o=e;e_(j,k,l,n,o)}else{o=g;n=d;l=e;k=c[h+8>>2]|0;j=c[h+4>>2]|0;e_(o,n,l,k,j)}if((e|0)!=0){j=e-1|0;k=d;l=g;n=l;l=n+4|0;o=c[n>>2]|0;if((j|0)!=0){while(1){n=k;k=n+4|0;c[n>>2]=o;n=l;l=n+4|0;o=c[n>>2]|0;n=j-1|0;j=n;if((n|0)==0){break}}}j=k;k=j+4|0;c[j>>2]=o}o=eL(d+(e<<2)|0,d+(e<<2)|0,a-e|0,g+(e<<2)|0,c[h+4>>2]|0)|0;f=eM(d,d,a,i,e+(c[h+4>>2]|0)|0)|0;o=o-f|0;do{if(m>>>0>0){p=8045}else{if(o>>>0>0){p=8045;break}do{if((c[b+(a-1<<2)>>2]|0)==0){if((c[d+(a-1<<2)>>2]|0)!=0){break}a=a-1|0}}while(0);break}}while(0);if((p|0)==8045){c[b+(a<<2)>>2]=m;c[d+(a<<2)>>2]=o;a=a+1|0}return a|0}function fW(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=a;a=b;b=d;d=e;e=f;f=0;if((a|0)<0){h=1;while(1){if(!((d|0)>=0)){break}d=d<<1|e>>>31;e=e<<1;h=h+1|0}while(1){if((h|0)==0){break}f=f<<1;do{if(a>>>0>d>>>0){i=8063}else{if((a|0)!=(d|0)){break}if(b>>>0>=e>>>0){i=8063;break}else{break}}}while(0);if((i|0)==8063){i=0;a=(a-d|0)-(b>>>0<e>>>0&1)|0;b=b-e|0;f=f|1}e=d<<31|e>>>1;d=d>>>1;h=h-1|0}j=b;k=g;l=k|0;c[l>>2]=j;m=a;n=g;o=n+4|0;c[o>>2]=m;p=f;return p|0}h=0;while(1){if(a>>>0>d>>>0){q=1}else{if((a|0)==(d|0)){r=b>>>0>=e>>>0}else{r=0}q=r}if(!q){break}d=d<<1|e>>>31;e=e<<1;h=h+1|0}while(1){if((h|0)==0){break}e=d<<31|e>>>1;d=d>>>1;f=f<<1;do{if(a>>>0>d>>>0){i=8081}else{if((a|0)!=(d|0)){break}if(b>>>0>=e>>>0){i=8081;break}else{break}}}while(0);if((i|0)==8081){i=0;a=(a-d|0)-(b>>>0<e>>>0&1)|0;b=b-e|0;f=f|1}h=h-1|0}j=b;k=g;l=k|0;c[l>>2]=j;m=a;n=g;o=n+4|0;c[o>>2]=m;p=f;return p|0}function fX(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+32|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=a;a=b;b=d;d=e;e=f;do{if(m>>>0>=2){if(b>>>0<2){break}do{if(m>>>0>b>>>0){n=8095}else{if((m|0)==(b|0)){if(a>>>0>d>>>0){n=8095;break}}b=(b-m|0)-(d>>>0<a>>>0&1)|0;d=d-a|0;if(b>>>0>=2){o=1;p=1;q=1;r=0;break}s=0;t=s;i=g;return t|0}}while(0);do{if((n|0)==8095){m=(m-b|0)-(a>>>0<d>>>0&1)|0;a=a-d|0;if(m>>>0>=2){o=1;r=1;q=1;p=0;break}s=0;t=s;i=g;return t|0}}while(0);do{if(m>>>0<b>>>0){n=8126;break}else{break}}while(0);while(1){if((n|0)==8126){n=0;if((m|0)==(b|0)){n=8129;break}if(b>>>0<65536){n=8131;break}b=(b-m|0)-(d>>>0<a>>>0&1)|0;d=d-a|0;if(b>>>0<2){n=8135;break}if(b>>>0<=m>>>0){q=q+r|0;p=p+o|0}else{u=fW(j|0,b,d,m,a)|0;d=c[j>>2]|0;b=c[j+4>>2]|0;if(b>>>0<2){n=8139;break}u=u+1|0;q=q+ab(u,r)|0;p=p+ab(u,o)|0}}if((m|0)==(b|0)){n=8111;break}if(m>>>0<65536){n=8113;break}m=(m-b|0)-(a>>>0<d>>>0&1)|0;a=a-d|0;if(m>>>0<2){n=8119;break}if(m>>>0<=b>>>0){r=r+q|0;o=o+p|0}else{v=fW(h|0,m,a,b,d)|0;a=c[h>>2]|0;m=c[h+4>>2]|0;if(m>>>0<2){n=8123;break}v=v+1|0;r=r+ab(v,q)|0;o=o+ab(v,p)|0}n=8126;continue}do{if((n|0)==8113){m=(m<<16)+(a>>>16)|0;b=(b<<16)+(d>>>16)|0;n=8143;break}else if((n|0)==8123){r=r+ab(v,q)|0;o=o+ab(v,p)|0;n=8164;break}else if((n|0)==8129){n=8164;break}else if((n|0)==8111){n=8164;break}else if((n|0)==8139){q=q+ab(u,r)|0;p=p+ab(u,o)|0;n=8164;break}else if((n|0)==8119){n=8164;break}else if((n|0)==8131){m=(m<<16)+(a>>>16)|0;b=(b<<16)+(d>>>16)|0;n=8153;break}else if((n|0)==8135){n=8164;break}}while(0);L9982:while(1){L9983:do{if((n|0)==8143){n=0;m=m-b|0;if(m>>>0<131072){break}do{if(m>>>0<=b>>>0){r=r+q|0;o=o+p|0}else{f=fY(k,m,b)|0;m=c[k>>2]|0;if(m>>>0<131072){r=r+ab(f,q)|0;o=o+ab(f,p)|0;break L9983}else{f=f+1|0;r=r+ab(f,q)|0;o=o+ab(f,p)|0;break}}}while(0);n=8153;continue L9982}else if((n|0)==8164){n=0;c[e>>2]=q;c[(e|0)+4>>2]=r;c[(e|0)+8>>2]=p;c[((e|0)+8|0)+4>>2]=o;s=1;break L9982}else if((n|0)==8153){n=0;b=b-m|0;if(b>>>0<131072){break}do{if(b>>>0<=m>>>0){q=q+r|0;p=p+o|0}else{f=fY(l,b,m)|0;b=c[l>>2]|0;if(b>>>0<131072){q=q+ab(f,r)|0;p=p+ab(f,o)|0;break L9983}else{f=f+1|0;q=q+ab(f,r)|0;p=p+ab(f,o)|0;break}}}while(0);n=8143;continue L9982}}while(0);n=8164;continue}t=s;i=g;return t|0}}while(0);s=0;t=s;i=g;return t|0}function fY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;d=0;if((a|0)<0){f=1;while(1){if(!((b|0)>=0)){break}b=b<<1;f=f+1|0}d=0;while(1){if((f|0)==0){break}d=d<<1;if(a>>>0>=b>>>0){a=a-b|0;d=d|1}b=b>>>1;f=f-1|0}f=a;g=e;c[g>>2]=f;h=d;return h|0}else{i=0;while(1){if(!(a>>>0>=b>>>0)){break}b=b<<1;i=i+1|0}d=0;while(1){if((i|0)==0){break}b=b>>>1;d=d<<1;if(a>>>0>=b>>>0){a=a-b|0;d=d|1}i=i-1|0}f=a;g=e;c[g>>2]=f;h=d;return h|0}return 0}function fZ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=a;a=b;b=d;d=e;e=f;f=eK(a,b,e,c[g>>2]|0)|0;f=f+(eN(a,d,e,c[(g|0)+8>>2]|0)|0)|0;h=eK(d,d,e,c[((g|0)+8|0)+4>>2]|0)|0;h=h+(eN(d,b,e,c[(g|0)+4>>2]|0)|0)|0;c[a+(e<<2)>>2]=f;c[d+(e<<2)>>2]=h;e=e+((f|h)>>>0>0&1)|0;return e|0}function f_(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+16|0;k=j|0;l=a;a=b;b=e;e=f;f=g;g=h;h=c[a+(l-1<<2)>>2]|c[b+(l-1<<2)>>2];do{if((l|0)==(e+1|0)){if(h>>>0<4){break}else{m=c[a+(l-1<<2)>>2]|0;n=c[a+(l-2<<2)>>2]|0;o=c[b+(l-1<<2)>>2]|0;p=c[b+(l-2<<2)>>2]|0;q=8212;break}}else{if((h&-2147483648|0)!=0){m=c[a+(l-1<<2)>>2]|0;n=c[a+(l-2<<2)>>2]|0;o=c[b+(l-1<<2)>>2]|0;p=c[b+(l-2<<2)>>2]|0}else{r=h;if(r>>>0<65536){s=r>>>0<256?1:9}else{s=r>>>0<16777216?17:25}t=s;u=(33-t|0)-(d[9872+(r>>>(t>>>0))|0]|0)|0;m=c[a+(l-1<<2)>>2]<<u|(c[a+(l-2<<2)>>2]|0)>>>((32-u|0)>>>0);n=c[a+(l-2<<2)>>2]<<u|(c[a+(l-3<<2)>>2]|0)>>>((32-u|0)>>>0);o=c[b+(l-1<<2)>>2]<<u|(c[b+(l-2<<2)>>2]|0)>>>((32-u|0)>>>0);p=c[b+(l-2<<2)>>2]<<u|(c[b+(l-3<<2)>>2]|0)>>>((32-u|0)>>>0)}q=8212;break}}while(0);do{if((q|0)==8212){if((fX(m,n,o,p,k)|0)==0){break}fT(f,k,g);if((l|0)!=0){s=l-1|0;h=g;u=a;t=u;u=t+4|0;r=c[t>>2]|0;if((s|0)!=0){while(1){t=h;h=t+4|0;c[t>>2]=r;t=u;u=t+4|0;r=c[t>>2]|0;t=s-1|0;s=t;if((t|0)==0){break}}}s=h;h=s+4|0;c[s>>2]=r}v=fR(k,a,g,b,l)|0;w=v;i=j;return w|0}}while(0);v=fC(a,b,l,e,316,f,g)|0;w=v;i=j;return w|0}function f$(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;d=a;a=e;e=f;f=g;while(1){if((e|0)<=0){break}if((c[a+(e-1<<2)>>2]|0)!=0){g=8246;break}e=e-1|0}if((e|0)<=0){return}fS(d,a,e,f,a+(e<<2)|0);return}function f0(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=a;a=b;b=d;d=e;e=f;f=g;do{if((d|0)>=1e3){if((d-e|0)!=0){g=(d-e|0)-1|0;i=f;j=a+(e<<2)|0;k=j;j=k+4|0;l=c[k>>2]|0;if((g|0)!=0){while(1){k=i;i=k+4|0;c[k>>2]=l;k=j;j=k+4|0;l=c[k>>2]|0;k=g-1|0;g=k;if((k|0)==0){break}}}g=i;i=g+4|0;c[g>>2]=l}if((d-e|0)!=0){g=(d-e|0)-1|0;j=(f+(d<<2)|0)+(-e<<2)|0;k=b+(e<<2)|0;m=k;k=m+4|0;n=c[m>>2]|0;if((g|0)!=0){while(1){m=j;j=m+4|0;c[m>>2]=n;m=k;k=m+4|0;n=c[m>>2]|0;m=g-1|0;g=m;if((m|0)==0){break}}}g=j;j=g+4|0;c[g>>2]=n}if((f7(f,(f+(d<<2)|0)+(-e<<2)|0,d-e|0,h,f+(d-e<<1<<2)|0)|0)==0){break}o=f1(h,a,b,d)|0;p=o;return p|0}else{g=f5(a+(e<<2)|0,b+(e<<2)|0,d-e|0,h,f)|0;if((g|0)<=0){break}o=fV(h,e+g|0,a,b,e,f)|0;p=o;return p|0}}while(0);o=0;p=o;return p|0}
function f1(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+24|0;g=f|0;h=f+16|0;j=a;a=b;b=d;d=e;e=d;while(1){if((e|0)<=0){break}if((c[a+(e-1<<2)>>2]|0)!=0){k=8306;break}e=e-1|0}l=d;while(1){if((l|0)<=0){break}if((c[b+(l-1<<2)>>2]|0)!=0){k=8313;break}l=l-1|0}m=0;while(1){if(m>>>0>=2){break}n=0;while(1){if(n>>>0>=2){break}o=c[j+4>>2]|0;while(1){if((o|0)<=0){break}if((c[(c[((j+8|0)+(m<<3)|0)+(n<<2)>>2]|0)+(o-1<<2)>>2]|0)!=0){k=8324;break}o=o-1|0}if((k|0)==8324){k=0}c[(g+(m<<3)|0)+(n<<2)>>2]=o;n=n+1|0}m=m+1|0}c[h>>2]=0;if((c[(g|0)+4>>2]|0)==0){p=f4(b,l,a,e,c[(j+8|0)+8>>2]|0,c[g+8>>2]|0)|0}else{if((c[g+8>>2]|0)==0){p=f4(a,e,b,l,c[(j+8|0)+4>>2]|0,c[(g|0)+4>>2]|0)|0}else{if((e-(c[g>>2]|0)|0)<(l-(c[g+8>>2]|0)|0)){q=e-(c[g>>2]|0)|0}else{q=l-(c[g+8>>2]|0)|0}m=q+1|0;if((e-(c[(g|0)+4>>2]|0)|0)<(l-(c[(g+8|0)+4>>2]|0)|0)){r=e-(c[(g|0)+4>>2]|0)|0}else{r=l-(c[(g+8|0)+4>>2]|0)|0}l=r+1|0;if((m|0)>(l|0)){s=m}else{s=l}p=s;s=g8(p+1|0)|0;if(((f2(s,s,c[j+4>>2]|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){l=f2(s,s,c[j+4>>2]|0)<<2;m=i;i=i+l|0;i=i+7>>3<<3;t=m}else{t=dD(h,f2(s,s,c[j+4>>2]|0)<<2)|0}m=t;if(((s<<2>>>0<65536&1|0)!=0&1|0)!=0){t=i;i=i+(s<<2)|0;i=i+7>>3<<3;u=t}else{u=dD(h,s<<2)|0}t=u;if(((s<<2>>>0<65536&1|0)!=0&1|0)!=0){u=i;i=i+(s<<2)|0;i=i+7>>3<<3;v=u}else{v=dD(h,s<<2)|0}u=v;if((d|0)>(s|0)){w=eL(a,a,s,a+(s<<2)|0,d-s|0)|0;v=a;l=(c[v>>2]|0)+w|0;c[v>>2]=l;if(l>>>0<w>>>0){while(1){l=v+4|0;v=l;r=(c[l>>2]|0)+1|0;c[l>>2]=r;if((r|0)!=0){break}}}w=eL(b,b,s,b+(s<<2)|0,d-s|0)|0;v=b;r=(c[v>>2]|0)+w|0;c[v>>2]=r;if(r>>>0<w>>>0){while(1){r=v+4|0;v=r;l=(c[r>>2]|0)+1|0;c[r>>2]=l;if((l|0)!=0){break}}}d=s}g5(t,s,a,d,c[((j+8|0)+8|0)+4>>2]|0,c[(g+8|0)+4>>2]|0,m);g5(u,s,b,d,c[(j+8|0)+4>>2]|0,c[(g|0)+4>>2]|0,m);if((d+(c[(g+8|0)+4>>2]|0)|0)<(s|0)){if(((s-d|0)-(c[(g+8|0)+4>>2]|0)|0)!=0){v=(t+(d<<2)|0)+(c[(g+8|0)+4>>2]<<2)|0;l=(s-d|0)-(c[(g+8|0)+4>>2]|0)|0;while(1){r=v;v=r+4|0;c[r>>2]=0;r=l-1|0;l=r;if((r|0)==0){break}}}}if((d+(c[(g|0)+4>>2]|0)|0)<(s|0)){if(((s-d|0)-(c[(g|0)+4>>2]|0)|0)!=0){l=(u+(d<<2)|0)+(c[(g|0)+4>>2]<<2)|0;v=(s-d|0)-(c[(g|0)+4>>2]|0)|0;while(1){r=l;l=r+4|0;c[r>>2]=0;r=v-1|0;v=r;if((r|0)==0){break}}}}w=eI(t,t,u,s)|0;v=t;l=c[v>>2]|0;c[v>>2]=l-w|0;if(l>>>0<w>>>0){while(1){l=v+4|0;v=l;r=c[l>>2]|0;c[l>>2]=r-1|0;if((r|0)!=0){break}}}g5(u,s,a,d,c[(j+8|0)+8>>2]|0,c[g+8>>2]|0,m);if((p|0)!=0){v=p-1|0;r=a;l=t;e=l;l=e+4|0;q=c[e>>2]|0;if((v|0)!=0){while(1){e=r;r=e+4|0;c[e>>2]=q;e=l;l=e+4|0;q=c[e>>2]|0;e=v-1|0;v=e;if((e|0)==0){break}}}v=r;r=v+4|0;c[v>>2]=q}g5(t,s,b,d,c[j+8>>2]|0,c[g>>2]|0,m);if((d+(c[g+8>>2]|0)|0)<(s|0)){if(((s-d|0)-(c[g+8>>2]|0)|0)!=0){m=(u+(d<<2)|0)+(c[g+8>>2]<<2)|0;j=(s-d|0)-(c[g+8>>2]|0)|0;while(1){q=m;m=q+4|0;c[q>>2]=0;q=j-1|0;j=q;if((q|0)==0){break}}}}if((d+(c[g>>2]|0)|0)<(s|0)){if(((s-d|0)-(c[g>>2]|0)|0)!=0){j=(t+(d<<2)|0)+(c[g>>2]<<2)|0;m=(s-d|0)-(c[g>>2]|0)|0;while(1){g=j;j=g+4|0;c[g>>2]=0;g=m-1|0;m=g;if((g|0)==0){break}}}}w=eI(t,t,u,s)|0;s=t;u=c[s>>2]|0;c[s>>2]=u-w|0;if(u>>>0<w>>>0){while(1){w=s+4|0;s=w;u=c[w>>2]|0;c[w>>2]=u-1|0;if((u|0)!=0){break}}}if((p|0)!=0){s=p-1|0;u=b;w=t;t=w;w=t+4|0;m=c[t>>2]|0;if((s|0)!=0){while(1){t=u;u=t+4|0;c[t>>2]=m;t=w;w=t+4|0;m=c[t>>2]|0;t=s-1|0;s=t;if((t|0)==0){break}}}s=u;u=s+4|0;c[s>>2]=m}while(1){if((c[a+(p-1<<2)>>2]|c[b+(p-1<<2)>>2]|0)!=0){break}p=p-1|0}}}if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}i=f;return p|0}function f2(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function f3(a){a=a|0;var b=0,c=0,e=0,f=0,g=0;b=a;if(!((b|0)>=400)){c=b;e=c;return e|0}a=(b-1|0)/399&-1;if(a>>>0<65536){f=a>>>0<256?1:9}else{f=a>>>0<16777216?17:25}g=f;c=((((b+3|0)/4&-1)*20&-1)+((32-((33-g|0)-(d[9872+(a>>>(g>>>0))|0]|0)|0)|0)*22&-1)|0)+400|0;e=c;return e|0}function f4(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;i=i+8|0;j=h|0;k=a;a=b;b=e;e=g;c[j>>2]=0;if(((b+e<<2>>>0<65536&1|0)!=0&1|0)!=0){g=i;i=i+(b+e<<2)|0;i=i+7>>3<<3;l=g}else{l=dD(j,b+e<<2)|0}g=l;e_(g,d,b,f,e);if((b+e|0)>(a|0)){e=e-1|0}eM(k,k,a,g,b+e|0);if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}while(1){if((a|0)>(b|0)){m=(c[k+(a-1<<2)>>2]|0)==0}else{m=0}if(!m){break}a=a-1|0}i=h;return a|0}function f5(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+24|0;g=f|0;h=a;a=b;b=c;c=d;d=e;e=((b|0)/2&-1)+1|0;j=0;if((b|0)<=(e|0)){k=0;l=k;i=f;return l|0}if((b|0)>=400){m=((b*3&-1|0)/4&-1)+1|0;n=(b|0)/2&-1;o=f0(c,h,a,b,n,d)|0;if((o|0)!=0){b=o;j=1}while(1){if((b|0)<=(m|0)){break}o=f_(b,h,a,e,c,d)|0;if((o|0)==0){p=8556;break}b=o;j=1}if((p|0)==8556){if((j|0)!=0){q=b}else{q=0}k=q;l=k;i=f;return l|0}if((b|0)>(e+2|0)){n=((e<<1)-b|0)+1|0;q=(((b-n|0)+1|0)/2&-1)+1<<2;fP(g,b-n|0,d);o=f5(h+(n<<2)|0,a+(n<<2)|0,b-n|0,g,d+(q<<2)|0)|0;if((o|0)>0){b=fV(g,n+o|0,h,a,n,d+(q<<2)|0)|0;fU(c,g,d+(q<<2)|0);j=1}}}while(1){o=f_(b,h,a,e,c,d)|0;if((o|0)==0){break}b=o;j=1}if((j|0)!=0){r=b}else{r=0}k=r;l=k;i=f;return l|0}function f6(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=8587;break}if((c[d+(a<<2)>>2]|0)!=0){e=8584;break}a=a-1|0}if((e|0)==8584){a=0;d=a;return d|0}else if((e|0)==8587){a=1;d=a;return d|0}return 0}function f7(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+40|0;h=g|0;j=g+16|0;k=a;a=b;b=d;d=e;e=f;f=0;if((b|0)<=2){l=0;m=l;i=g;return m|0}n=((b|0)/2&-1)+1|0;if((b|0)>=400){o=((b*3&-1|0)/4&-1)+1|0;p=(b|0)/2&-1;q=f0(d,k,a,b,p,e)|0;if((q|0)!=0){b=q;f=1}while(1){if((b|0)<=(o|0)){break}q=f_(b,k,a,n,d,e)|0;if((q|0)==0){r=8645;break}b=q;f=1}if((r|0)==8645){l=f;m=l;i=g;return m|0}do{if((b|0)>(n+2|0)){p=((n<<1)-b|0)+1|0;o=(((b-p|0)+1|0)/2&-1)+1<<2;fP(j,b-p|0,e);if((f7(k+(p<<2)|0,a+(p<<2)|0,b-p|0,j,e+(o<<2)|0)|0)==0){break}fU(d,j,e+(o<<2)|0);l=1;m=l;i=g;return m|0}}while(0);while(1){j=f_(b,k,a,n,d,e)|0;if((j|0)==0){break}b=j;f=1}l=f;m=l;i=g;return m|0}j=0;L10568:while(1){if((b|0)<=2){break}p=f_(b,k,a,n,d,e)|0;if((p|0)==0){r=8607;break}b=p;f=1;if(((b+1<<5)+(j<<1)|0)>>>0<=n<<6>>>0){p=((((n<<1)-b<<5)-(j<<1)|0)>>>0)/32>>>0;L10578:do{if((j|0)==0){do{if((n+1|0)!=(b|0)){if((f6((k+(n<<2)|0)+4|0,(b-n|0)-1|0)|0)!=0){break}if((f6((a+(n<<2)|0)+4|0,(b-n|0)-1|0)|0)!=0){break}j=31;n=n+1|0;break L10578}}while(0);continue L10568}else{j=j-1|0}}while(0);k=k+(p<<2)|0;a=a+(p<<2)|0;b=b-p|0;n=n-p|0}}do{if(j>>>0>0){k=k-4|0;a=a-4|0;c[k>>2]=eQ(k+4|0,k+4|0,b,32-j|0)|0;c[a>>2]=eQ(a+4|0,a+4|0,b,32-j|0)|0;b=b+((c[k+(b<<2)>>2]|c[a+(b<<2)>>2])>>>0>0&1)|0;while(1){if((b|0)<=2){r=8632;break}o=f_(b,k,a,n,d,e)|0;if((o|0)==0){break}b=o}if((r|0)==8632){break}l=1;m=l;i=g;return m|0}}while(0);if((b|0)==2){if((fX(c[k+4>>2]|0,c[k>>2]|0,c[a+4>>2]|0,c[a>>2]|0,h)|0)!=0){fT(d,h,e);f=1}}l=f;m=l;i=g;return m|0}function f8(a,b,c){a=a|0;b=b|0;c=c|0;var e=0;e=a;a=d[15184+(((e<<3)+(b<<2)|0)+c|0)|0]|0;e=a;return a|0}function f9(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=i;i=i+32|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=a;a=b;b=d;d=e;e=f;f=g;g=c[f>>2]|0;do{if(n>>>0>=2){if(b>>>0<2){break}do{if(n>>>0>b>>>0){o=8683}else{if((n|0)==(b|0)){if(a>>>0>d>>>0){o=8683;break}}b=(b-n|0)-(d>>>0<a>>>0&1)|0;d=d-a|0;if(b>>>0>=2){p=1;q=1;r=1;s=0;g=f8(g,0,1)|0;break}t=0;u=t;i=h;return u|0}}while(0);do{if((o|0)==8683){n=(n-b|0)-(a>>>0<d>>>0&1)|0;a=a-d|0;if(n>>>0>=2){p=1;s=1;r=1;q=0;g=f8(g,1,1)|0;break}t=0;u=t;i=h;return u|0}}while(0);do{if(n>>>0<b>>>0){o=8714;break}else{break}}while(0);while(1){if((o|0)==8714){o=0;if((n|0)==(b|0)){o=8717;break}if(b>>>0<65536){o=8719;break}b=(b-n|0)-(d>>>0<a>>>0&1)|0;d=d-a|0;if(b>>>0<2){o=8723;break}if(b>>>0<=n>>>0){r=r+s|0;q=q+p|0;g=f8(g,0,1)|0}else{v=gb(k|0,b,d,n,a)|0;d=c[k>>2]|0;b=c[k+4>>2]|0;if(b>>>0<2){o=8727;break}v=v+1|0;r=r+ab(v,s)|0;q=q+ab(v,p)|0;g=f8(g,0,v&3)|0}}if((n|0)==(b|0)){o=8699;break}if(n>>>0<65536){o=8701;break}n=(n-b|0)-(a>>>0<d>>>0&1)|0;a=a-d|0;if(n>>>0<2){o=8707;break}if(n>>>0<=b>>>0){s=s+r|0;p=p+q|0;g=f8(g,1,1)|0}else{w=gb(j|0,n,a,b,d)|0;a=c[j>>2]|0;n=c[j+4>>2]|0;if(n>>>0<2){o=8711;break}w=w+1|0;s=s+ab(w,r)|0;p=p+ab(w,q)|0;g=f8(g,1,w&3)|0}o=8714;continue}do{if((o|0)==8719){n=(n<<16)+(a>>>16)|0;b=(b<<16)+(d>>>16)|0;o=8743;break}else if((o|0)==8711){s=s+ab(w,r)|0;p=p+ab(w,q)|0;g=f8(g,1,w&3)|0;o=8756;break}else if((o|0)==8699){o=8756;break}else if((o|0)==8717){o=8756;break}else if((o|0)==8723){o=8756;break}else if((o|0)==8707){o=8756;break}else if((o|0)==8727){r=r+ab(v,s)|0;q=q+ab(v,p)|0;g=f8(g,0,v&3)|0;o=8756;break}else if((o|0)==8701){n=(n<<16)+(a>>>16)|0;b=(b<<16)+(d>>>16)|0;o=8731;break}}while(0);L10693:while(1){L10694:do{if((o|0)==8731){o=0;if((n|0)==(b|0)){break}n=n-b|0;if(n>>>0<131072){break}do{if(n>>>0<=b>>>0){s=s+r|0;p=p+q|0;g=f8(g,1,1)|0}else{x=ga(l,n,b)|0;n=c[l>>2]|0;if(n>>>0<131072){s=s+ab(x,r)|0;p=p+ab(x,q)|0;g=f8(g,1,x&3)|0;break L10694}else{x=x+1|0;s=s+ab(x,r)|0;p=p+ab(x,q)|0;g=f8(g,1,x&3)|0;break}}}while(0);o=8743;continue L10693}else if((o|0)==8743){o=0;if((n|0)==(b|0)){break}b=b-n|0;if(b>>>0<131072){break}do{if(b>>>0<=n>>>0){r=r+s|0;q=q+p|0;g=f8(g,0,1)|0}else{x=ga(m,b,n)|0;b=c[m>>2]|0;if(b>>>0<131072){r=r+ab(x,s)|0;q=q+ab(x,p)|0;g=f8(g,0,x&3)|0;break L10694}else{x=x+1|0;r=r+ab(x,s)|0;q=q+ab(x,p)|0;g=f8(g,0,x&3)|0;break}}}while(0);o=8731;continue L10693}else if((o|0)==8756){o=0;c[e>>2]=r;c[(e|0)+4>>2]=s;c[(e|0)+8>>2]=q;c[((e|0)+8|0)+4>>2]=p;c[f>>2]=g;t=1;break L10693}}while(0);o=8756;continue}u=t;i=h;return u|0}}while(0);t=0;u=t;i=h;return u|0}function ga(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;d=0;if((a|0)<0){f=1;while(1){if(!((b|0)>=0)){break}b=b<<1;f=f+1|0}d=0;while(1){if((f|0)==0){break}d=d<<1;if(a>>>0>=b>>>0){a=a-b|0;d=d|1}b=b>>>1;f=f-1|0}f=a;g=e;c[g>>2]=f;h=d;return h|0}else{i=0;while(1){if(!(a>>>0>=b>>>0)){break}b=b<<1;i=i+1|0}d=0;while(1){if((i|0)==0){break}b=b>>>1;d=d<<1;if(a>>>0>=b>>>0){a=a-b|0;d=d|1}i=i-1|0}f=a;g=e;c[g>>2]=f;h=d;return h|0}return 0}function gb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=a;a=b;b=d;d=e;e=f;f=0;if((a|0)<0){h=1;while(1){if(!((d|0)>=0)){break}d=d<<1|e>>>31;e=e<<1;h=h+1|0}while(1){if((h|0)==0){break}f=f<<1;do{if(a>>>0>d>>>0){i=8796}else{if((a|0)!=(d|0)){break}if(b>>>0>=e>>>0){i=8796;break}else{break}}}while(0);if((i|0)==8796){i=0;a=(a-d|0)-(b>>>0<e>>>0&1)|0;b=b-e|0;f=f|1}e=d<<31|e>>>1;d=d>>>1;h=h-1|0}j=b;k=g;l=k|0;c[l>>2]=j;m=a;n=g;o=n+4|0;c[o>>2]=m;p=f;return p|0}h=0;while(1){if(a>>>0>d>>>0){q=1}else{if((a|0)==(d|0)){r=b>>>0>=e>>>0}else{r=0}q=r}if(!q){break}d=d<<1|e>>>31;e=e<<1;h=h+1|0}while(1){if((h|0)==0){break}e=d<<31|e>>>1;d=d>>>1;f=f<<1;do{if(a>>>0>d>>>0){i=8814}else{if((a|0)!=(d|0)){break}if(b>>>0>=e>>>0){i=8814;break}else{break}}}while(0);if((i|0)==8814){i=0;a=(a-d|0)-(b>>>0<e>>>0&1)|0;b=b-e|0;f=f|1}h=h-1|0}j=b;k=g;l=k|0;c[l>>2]=j;m=a;n=g;o=n+4|0;c[o>>2]=m;p=f;return p|0}function gc(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+24|0;h=g|0;j=a;a=b;b=c;c=d;d=e;e=f;f=((b|0)/2&-1)+1|0;k=0;if((b|0)<=(f|0)){l=0;m=l;i=g;return m|0}if((b|0)>=400){n=((b*3&-1|0)/4&-1)+1|0;o=(b|0)/2&-1;p=gc(j+(o<<2)|0,a+(o<<2)|0,b-o|0,c,d,e)|0;if((p|0)>0){b=fV(c,o+p|0,j,a,o,e)|0;k=1}while(1){if((b|0)<=(n|0)){break}p=gf(b,j,a,f,c,d,e)|0;if((p|0)==0){q=8834;break}b=p;k=1}if((q|0)==8834){if((k|0)!=0){r=b}else{r=0}l=r;m=l;i=g;return m|0}if((b|0)>(f+2|0)){o=((f<<1)-b|0)+1|0;r=(((b-o|0)+1|0)/2&-1)+1<<2;fP(h,b-o|0,e);p=gc(j+(o<<2)|0,a+(o<<2)|0,b-o|0,h,d,e+(r<<2)|0)|0;if((p|0)>0){b=fV(h,o+p|0,j,a,o,e+(r<<2)|0)|0;fU(c,h,e+(r<<2)|0);k=1}}}while(1){p=gf(b,j,a,f,c,d,e)|0;if((p|0)==0){break}b=p;k=1}if((k|0)!=0){s=b}else{s=0}l=s;m=l;i=g;return m|0}function gd(a){a=a|0;return a<<1|0}function ge(a,b,c){a=a|0;b=b|0;c=c|0;var e=0;e=a;a=d[15184+(((e<<3)+(b<<2)|0)+c|0)|0]|0;e=a;return a|0}function gf(a,b,e,f,g,h,j){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+24|0;l=k|0;m=k+16|0;n=a;a=b;b=e;e=f;f=g;g=h;h=j;j=c[a+(n-1<<2)>>2]|c[b+(n-1<<2)>>2];do{if((n|0)==(e+1|0)){if(j>>>0<4){break}else{o=c[a+(n-1<<2)>>2]|0;p=c[a+(n-2<<2)>>2]|0;q=c[b+(n-1<<2)>>2]|0;r=c[b+(n-2<<2)>>2]|0;s=8884;break}}else{if((j&-2147483648|0)!=0){o=c[a+(n-1<<2)>>2]|0;p=c[a+(n-2<<2)>>2]|0;q=c[b+(n-1<<2)>>2]|0;r=c[b+(n-2<<2)>>2]|0}else{t=j;if(t>>>0<65536){u=t>>>0<256?1:9}else{u=t>>>0<16777216?17:25}v=u;w=(33-v|0)-(d[9872+(t>>>(v>>>0))|0]|0)|0;o=c[a+(n-1<<2)>>2]<<w|(c[a+(n-2<<2)>>2]|0)>>>((32-w|0)>>>0);p=c[a+(n-2<<2)>>2]<<w|(c[a+(n-3<<2)>>2]|0)>>>((32-w|0)>>>0);q=c[b+(n-1<<2)>>2]<<w|(c[b+(n-2<<2)>>2]|0)>>>((32-w|0)>>>0);r=c[b+(n-2<<2)>>2]<<w|(c[b+(n-3<<2)>>2]|0)>>>((32-w|0)>>>0)}s=8884;break}}while(0);do{if((s|0)==8884){if((f9(o,p,q,r,l,g)|0)==0){break}fT(f,l,h);if((n|0)!=0){u=n-1|0;j=h;w=a;v=w;w=v+4|0;t=c[v>>2]|0;if((u|0)!=0){while(1){v=j;j=v+4|0;c[v>>2]=t;v=w;w=v+4|0;t=c[v>>2]|0;v=u-1|0;u=v;if((v|0)==0){break}}}u=j;j=u+4|0;c[u>>2]=t}x=fR(l,a,h,b,n)|0;y=x;i=k;return y|0}}while(0);c[m>>2]=f;c[m+4>>2]=g;x=fC(a,b,n,e,540,m,h)|0;y=x;i=k;return y|0}function gg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;d=a;a=e;e=f;f=g;while(1){if((e|0)<=0){break}if((c[a+(e-1<<2)>>2]|0)!=0){g=8916;break}e=e-1|0}if((e|0)<=0){return}g=d;fS(c[g>>2]|0,a,e,f,a+(e<<2)|0);e=ge(c[c[g+4>>2]>>2]|0,f,c[a>>2]&3)|0;c[c[g+4>>2]>>2]=e;return}function gh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;if(!((d|0)>=90)){gk(h,a,b,d);i=f;return}c[g>>2]=0;if(((gd(d)<<2>>>0<65536&1|0)!=0&1|0)!=0){e=gd(d)<<2;j=i;i=i+e|0;i=i+7>>3<<3;k=j}else{k=dD(g,gd(d)<<2)|0}j=k;if((d|0)>=3e3){fh(j,a,b,d);if((d|0)!=0){k=d-1|0;e=h;l=j;m=l;l=m+4|0;n=c[m>>2]|0;if((k|0)!=0){while(1){m=e;e=m+4|0;c[m>>2]=n;m=l;l=m+4|0;n=c[m>>2]|0;m=k-1|0;k=m;if((m|0)==0){break}}}k=e;e=k+4|0;c[k>>2]=n}}else{gi(h,a,b,d,j)}if((((c[g>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[g>>2]|0)}i=f;return}function gi(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=a;a=b;b=d;d=e;e=f;if((d|0)>=144){if((d|0)>=387){if((d|0)>=500){h=(d>>>0)/10>>>0}else{h=((d*7&-1)>>>0)/39>>>0}}else{h=((d*9&-1)>>>0)/40>>>0}}else{h=((d*11&-1)>>>0)/36>>>0}f=d-h|0;fh(e,a,b,f);if((f|0)!=0){i=f-1|0;j=g;k=e;l=k;k=l+4|0;m=c[l>>2]|0;if((i|0)!=0){while(1){l=j;j=l+4|0;c[l>>2]=m;l=k;k=l+4|0;m=c[l>>2]|0;l=i-1|0;i=l;if((l|0)==0){break}}}i=j;j=i+4|0;c[i>>2]=m}if((h|0)>=90){gi(e+(d<<2)|0,a+(f<<2)|0,b,h,e+(d<<2)|0)}else{gk(e+(d<<2)|0,a+(f<<2)|0,b,h)}eG(g+(f<<2)|0,e+(f<<2)|0,e+(d<<2)|0,h);if((h|0)>=90){gi(e+(d<<2)|0,a,b+(f<<2)|0,h,e+(d<<2)|0);m=g;i=f;j=m+(i<<2)|0;k=g;l=f;n=k+(l<<2)|0;o=e;p=d;q=o+(p<<2)|0;r=h;s=eG(j,n,q,r)|0;return}else{gk(e+(d<<2)|0,a,b+(f<<2)|0,h);m=g;i=f;j=m+(i<<2)|0;k=g;l=f;n=k+(l<<2)|0;o=e;p=d;q=o+(p<<2)|0;r=h;s=eG(j,n,q,r)|0;return}}function gj(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=9012;break}if((c[d+(a<<2)>>2]|0)!=0){e=9009;break}a=a-1|0}if((e|0)==9009){a=0;d=a;return d|0}else if((e|0)==9012){a=1;d=a;return d|0}return 0}function gk(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=b;b=d;d=e;eK(f,a,d,c[b>>2]|0);e=1;while(1){if((e|0)>=(d|0)){break}eN(f+(e<<2)|0,a,d-e|0,c[b+(e<<2)>>2]|0);e=e+1|0}return}function gl(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=a;a=b;b=d;d=e;e=g;g=b>>1;i=b-g|0;b=f-i|0;f=h;j=h+(i<<2)|0;k=0;if((g|0)==(i|0)){if((fw(a,a+(i<<2)|0,i)|0)<0){l=f;m=a+(i<<2)|0;n=a;o=i;eI(l,m,n,o);k=1}else{o=f;n=a;m=a+(i<<2)|0;l=i;eI(o,n,m,l)}}else{do{if((gj(a+(g<<2)|0,i-g|0)|0)!=0){if((fw(a,a+(i<<2)|0,g)|0)>=0){p=9044;break}eI(f,a+(i<<2)|0,a,g);if((i-g|0)!=0){l=f+(g<<2)|0;m=i-g|0;while(1){n=l;l=n+4|0;c[n>>2]=0;n=m-1|0;m=n;if((n|0)==0){break}}}k=1;break}else{p=9044}}while(0);if((p|0)==9044){m=f;l=a;n=i;o=a+(i<<2)|0;q=g;eM(m,l,n,o,q)}}if((b|0)==(i|0)){if((fw(d,d+(i<<2)|0,i)|0)<0){q=j;o=d+(i<<2)|0;n=d;l=i;eI(q,o,n,l);k=k^1}else{l=j;n=d;o=d+(i<<2)|0;q=i;eI(l,n,o,q)}}else{do{if((gj(d+(b<<2)|0,i-b|0)|0)!=0){if((fw(d,d+(i<<2)|0,b)|0)>=0){p=9063;break}eI(j,d+(i<<2)|0,d,b);if((i-b|0)!=0){q=j+(b<<2)|0;o=i-b|0;while(1){n=q;q=n+4|0;c[n>>2]=0;n=o-1|0;o=n;if((n|0)==0){break}}}k=k^1;break}else{p=9063}}while(0);if((p|0)==9063){p=j;o=d;q=i;n=d+(i<<2)|0;l=b;eM(p,o,q,n,l)}}if((i|0)>=30){gl(e,f,i,j,i,e+(i<<1<<2)|0)}else{fj(e,f,i,j,i)}if((g|0)>(b|0)){if((b|0)>=30){if((g<<2|0)<(b*5&-1|0)){gl(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,b,e+(i<<1<<2)|0)}else{gm(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,b,e+(i<<1<<2)|0)}}else{fj(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,b)}}else{if((g|0)>=30){gl(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,g,e+(i<<1<<2)|0)}else{fj(h+(i<<1<<2)|0,a+(i<<2)|0,g,d+(i<<2)|0,g)}}if((i|0)>=30){gl(h,a,i,d,i,e+(i<<1<<2)|0)}else{fj(h,a,i,d,i)}d=eG(h+(i<<1<<2)|0,h+(i<<2)|0,h+(i<<1<<2)|0,i)|0;a=d+(eG(h+(i<<2)|0,h+(i<<1<<2)|0,h,i)|0)|0;d=d+(eL(h+(i<<1<<2)|0,h+(i<<1<<2)|0,i,(h+(i<<1<<2)|0)+(i<<2)|0,(g+b|0)-i|0)|0)|0;if((k|0)!=0){d=d+(eG(h+(i<<2)|0,h+(i<<2)|0,e,i<<1)|0)|0}else{d=d-(eI(h+(i<<2)|0,h+(i<<2)|0,e,i<<1)|0)|0}e=h+(i<<1<<2)|0;k=(c[e>>2]|0)+a|0;c[e>>2]=k;if(k>>>0<a>>>0){while(1){a=e+4|0;e=a;k=(c[a>>2]|0)+1|0;c[a>>2]=k;if((k|0)!=0){break}}}if(((d>>>0<=2&1|0)!=0&1|0)==0){e=h+((i*3&-1)<<2)|0;while(1){k=e;e=k+4|0;a=c[k>>2]|0;c[k>>2]=a-1|0;if((a|0)!=0){break}}return}e=h+((i*3&-1)<<2)|0;i=(c[e>>2]|0)+d|0;c[e>>2]=i;if(i>>>0<d>>>0){while(1){d=e+4|0;e=d;i=(c[d>>2]|0)+1|0;c[d>>2]=i;if((i|0)!=0){break}}}return}function gm(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=a;a=b;b=d;d=e;e=f;f=g;if((b<<1|0)>=(e*3&-1|0)){i=((b-1|0)>>>0)/3>>>0}else{i=e-1>>1}g=i+1|0;i=b-(g<<1)|0;b=e-g|0;e=eL(h,a,g,a+(g<<1<<2)|0,i)|0;do{if((e|0)==0){if((fw(h,a+(g<<2)|0,g)|0)>=0){j=9137;break}eI(h+(g<<1<<2)|0,a+(g<<2)|0,h,g);k=0;l=1;break}else{j=9137}}while(0);if((j|0)==9137){k=e-(eI(h+(g<<1<<2)|0,h,a+(g<<2)|0,g)|0)|0;l=0}e=e+(eG(h,h,a+(g<<2)|0,g)|0)|0;if((b|0)==(g|0)){m=eG(h+(g<<2)|0,d,d+(g<<2)|0,g)|0;if((fw(d,d+(g<<2)|0,g)|0)<0){n=h+((g*3&-1)<<2)|0;o=d+(g<<2)|0;p=d;q=g;eI(n,o,p,q);l=l^1}else{q=h+((g*3&-1)<<2)|0;p=d;o=d+(g<<2)|0;n=g;eI(q,p,o,n)}}else{m=eL(h+(g<<2)|0,d,g,d+(g<<2)|0,b)|0;do{if((gn(d+(b<<2)|0,g-b|0)|0)!=0){if((fw(d,d+(g<<2)|0,b)|0)>=0){j=9155;break}eI(h+((g*3&-1)<<2)|0,d+(g<<2)|0,d,b);if((g-b|0)!=0){n=(h+((g*3&-1)<<2)|0)+(b<<2)|0;o=g-b|0;while(1){p=n;n=p+4|0;c[p>>2]=0;p=o-1|0;o=p;if((p|0)==0){break}}}l=l^1;break}else{j=9155}}while(0);if((j|0)==9155){j=h+((g*3&-1)<<2)|0;o=d;n=g;p=d+(g<<2)|0;q=b;eM(j,o,n,p,q)}}fh(f,h,h+(g<<2)|0,g);if((e|0)==1){r=m+(eG(f+(g<<2)|0,f+(g<<2)|0,h+(g<<2)|0,g)|0)|0}else{if((e|0)==2){r=(m<<1)+(eN(f+(g<<2)|0,h+(g<<2)|0,g,2)|0)|0}else{r=0}}if((m|0)!=0){r=r+(eG(f+(g<<2)|0,f+(g<<2)|0,h,g)|0)|0}c[f+(g<<1<<2)>>2]=r;fh(h,h+(g<<1<<2)|0,h+((g*3&-1)<<2)|0,g);if((k|0)!=0){k=eG(h+(g<<2)|0,h+(g<<2)|0,h+((g*3&-1)<<2)|0,g)|0}c[h+(g<<1<<2)>>2]=k;if((l|0)!=0){m=f;e=f;q=h;p=(g<<1)+1|0;eI(m,e,q,p);p=f;q=f;e=(g<<1)+1|0;eQ(p,q,e,1)}else{e=f;q=f;p=h;m=(g<<1)+1|0;eG(e,q,p,m);m=f;p=f;q=(g<<1)+1|0;eQ(m,p,q,1)}k=c[h+(g<<1<<2)>>2]|0;r=eG(h+(g<<1<<2)|0,f,f+(g<<2)|0,g)|0;q=f+(g<<2)|0;p=(c[q>>2]|0)+(r+(c[f+(g<<1<<2)>>2]|0)|0)|0;c[q>>2]=p;if(p>>>0<(r+(c[f+(g<<1<<2)>>2]|0)|0)>>>0){while(1){p=q+4|0;q=p;m=(c[p>>2]|0)+1|0;c[p>>2]=m;if((m|0)!=0){break}}}if((l|0)!=0){r=eG(f,f,h,g)|0;k=k+(gp(h+(g<<1<<2)|0,h+(g<<1<<2)|0,h+(g<<2)|0,g,r)|0)|0;l=f+(g<<2)|0;q=(c[l>>2]|0)+k|0;c[l>>2]=q;if(q>>>0<k>>>0){while(1){q=l+4|0;l=q;m=(c[q>>2]|0)+1|0;c[q>>2]=m;if((m|0)!=0){break}}}}else{r=eI(f,f,h,g)|0;k=k+(gq(h+(g<<1<<2)|0,h+(g<<1<<2)|0,h+(g<<2)|0,g,r)|0)|0;l=f+(g<<2)|0;m=c[l>>2]|0;c[l>>2]=m-k|0;if(m>>>0<k>>>0){while(1){m=l+4|0;l=m;q=c[m>>2]|0;c[m>>2]=q-1|0;if((q|0)!=0){break}}}}fh(h,a,d,g);if((i|0)>(b|0)){l=h+((g*3&-1)<<2)|0;q=a+(g<<1<<2)|0;m=i;p=d+(g<<2)|0;e=b;e_(l,q,m,p,e)}else{e=h+((g*3&-1)<<2)|0;p=d+(g<<2)|0;d=b;m=a+(g<<1<<2)|0;a=i;e_(e,p,d,m,a)}r=eI(h+(g<<2)|0,h+(g<<2)|0,h+((g*3&-1)<<2)|0,g)|0;k=(c[f+(g<<1<<2)>>2]|0)+r|0;r=gq(h+(g<<1<<2)|0,h+(g<<1<<2)|0,h,g,r)|0;k=k-(gq(h+((g*3&-1)<<2)|0,f+(g<<2)|0,h+(g<<2)|0,g,r)|0)|0;k=k+(eL(h+(g<<2)|0,h+(g<<2)|0,g*3&-1,f,g)|0)|0;if((((i+b|0)>(g|0)&1|0)!=0&1|0)==0){return}k=k-(eM(h+(g<<1<<2)|0,h+(g<<1<<2)|0,g<<1,h+(g<<2<<2)|0,(i+b|0)-g|0)|0)|0;if((k|0)<0){b=h+(g<<2<<2)|0;i=c[b>>2]|0;c[b>>2]=i-(-k|0)|0;if(i>>>0<(-k|0)>>>0){while(1){i=b+4|0;b=i;f=c[i>>2]|0;c[i>>2]=f-1|0;if((f|0)!=0){break}}}}else{b=h+(g<<2<<2)|0;g=(c[b>>2]|0)+k|0;c[b>>2]=g;if(g>>>0<k>>>0){while(1){k=b+4|0;b=k;g=(c[k>>2]|0)+1|0;c[k>>2]=g;if((g|0)!=0){break}}}}return}function gn(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=9234;break}if((c[d+(a<<2)>>2]|0)!=0){e=9231;break}a=a-1|0}if((e|0)==9231){a=0;d=a;return d|0}else if((e|0)==9234){a=1;d=a;return d|0}return 0}function go(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=9244;break}if((c[d+(a<<2)>>2]|0)!=0){e=9241;break}a=a-1|0}if((e|0)==9244){a=1;d=a;return d|0}else if((e|0)==9241){a=0;d=a;return d|0}return 0}function gp(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eG(f,b,c,a)|0;d=d+(eF(f,f,a,e)|0)|0;return d|0}function gq(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eI(f,b,c,a)|0;d=d+(eH(f,f,a,e)|0)|0;return d|0}function gr(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;if((b|0)>=(e<<1|0)){k=b+3>>2}else{k=e+1>>1}g=k;k=b-(g*3&-1)|0;b=e-g|0;e=0;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;m=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;n=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;o=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;p=l;l=i;i=i+(g<<2)|0;i=i+7>>3<<3;q=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;r=l;l=gI(m,n,a,g,k,j)&1;s=eP(o,a+((g*3&-1)<<2)|0,k,1)|0;s=s+(eG(o,a+(g<<1<<2)|0,o,k)|0)|0;if((k|0)!=(g|0)){s=eF(o+(k<<2)|0,(a+(g<<1<<2)|0)+(k<<2)|0,g-k|0,s)|0}s=(s<<1)+(eP(o,o,g,1)|0)|0;s=s+(eG(o,a+(g<<2)|0,o,g)|0)|0;s=(s<<1)+(eP(o,o,g,1)|0)|0;s=s+(eG(o,a,o,g)|0)|0;c[o+(g<<2)>>2]=s;if((b|0)==(g|0)){c[p+(g<<2)>>2]=eG(p,d,d+(g<<2)|0,g)|0;if((fw(d,d+(g<<2)|0,g)|0)<0){t=q;u=d+(g<<2)|0;v=d;w=g;eI(t,u,v,w);l=l^1}else{w=q;v=d;u=d+(g<<2)|0;t=g;eI(w,v,u,t)}}else{c[p+(g<<2)>>2]=eL(p,d,g,d+(g<<2)|0,b)|0;do{if((go(d+(b<<2)|0,g-b|0)|0)!=0){if((fw(d,d+(g<<2)|0,b)|0)>=0){x=9276;break}eI(q,d+(g<<2)|0,d,b);if((g-b|0)!=0){t=q+(b<<2)|0;u=g-b|0;while(1){v=t;t=v+4|0;c[v>>2]=0;v=u-1|0;u=v;if((v|0)==0){break}}}l=l^1;break}else{x=9276}}while(0);if((x|0)==9276){x=q;u=d;t=g;v=d+(g<<2)|0;w=b;eM(x,u,t,v,w)}}eL(r,p,g+1|0,d+(g<<2)|0,b);fh(f,n,q,g);s=0;if((c[n+(g<<2)>>2]|0)!=0){s=eG(f+(g<<2)|0,f+(g<<2)|0,q,g)|0}c[f+(g<<1<<2)>>2]=s;fh((f+(g<<1<<2)|0)+4|0,o,r,g+1|0);if((k|0)>(b|0)){r=j+(g<<2<<2)|0;o=a+((g*3&-1)<<2)|0;q=k;n=d+(g<<2)|0;w=b;e_(r,o,q,n,w)}else{w=j+(g<<2<<2)|0;n=d+(g<<2)|0;q=b;o=a+((g*3&-1)<<2)|0;r=k;e_(w,n,q,o,r)}r=c[j+(g<<2<<2)>>2]|0;fh(j+(g<<1<<2)|0,m,p,g);if((c[m+(g<<2)>>2]|0)==1){o=c[p+(g<<2)>>2]|0;s=o+(eG((j+(g<<1<<2)|0)+(g<<2)|0,(j+(g<<1<<2)|0)+(g<<2)|0,p,g)|0)|0}else{if((c[m+(g<<2)>>2]|0)==2){o=c[p+(g<<2)>>2]<<1;s=o+(eN((j+(g<<1<<2)|0)+(g<<2)|0,p,g,2)|0)|0}else{if((c[m+(g<<2)>>2]|0)==3){o=(c[p+(g<<2)>>2]|0)*3&-1;s=o+(eN((j+(g<<1<<2)|0)+(g<<2)|0,p,g,3)|0)|0}else{s=0}}}if((c[p+(g<<2)>>2]|0)!=0){s=s+(eG((j+(g<<1<<2)|0)+(g<<2)|0,(j+(g<<1<<2)|0)+(g<<2)|0,m,g)|0)|0}c[(j+(g<<1<<2)|0)+(g<<1<<2)>>2]=s;fh(j,a,d,g);gP(j,(f+(g<<1<<2)|0)+4|0,f,g,k+b|0,l,r);if((((e|0)!=0&1|0)!=0&1|0)!=0){dE(e)}i=h;return}function gs(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=a;a=b;b=d;d=e;e=g;g=((b+2|0)>>>0)/3>>>0;i=b-(g<<1)|0;b=f-(g<<1)|0;f=(e+(g<<2<<2)|0)+16|0;j=(e+(g<<1<<2)|0)+8|0;k=(h+(g<<2)|0)+4|0;l=h;m=(e+((g*3&-1)<<2)|0)+12|0;n=(h+(g<<1<<2)|0)+8|0;o=e;p=0;q=eL(o,a,g,a+(g<<1<<2)|0,i)|0;c[f+(g<<2)>>2]=q+(eG(f,o,a+(g<<2)|0,g)|0)|0;do{if((q|0)==0){if((fw(o,a+(g<<2)|0,g)|0)>=0){r=9326;break}eI(j,a+(g<<2)|0,o,g);c[j+(g<<2)>>2]=0;p=1;break}else{r=9326}}while(0);if((r|0)==9326){q=q-(eI(j,o,a+(g<<2)|0,g)|0)|0;c[j+(g<<2)>>2]=q}q=eG(k,a+(g<<1<<2)|0,f,i)|0;if((i|0)!=(g|0)){q=eF(k+(i<<2)|0,f+(i<<2)|0,g-i|0,q)|0}q=q+(c[f+(g<<2)>>2]|0)|0;q=(q<<1)+(eP(k,k,g,1)|0)|0;q=q-(eI(k,k,a,g)|0)|0;c[k+(g<<2)>>2]=q;q=eL(o,d,g,d+(g<<1<<2)|0,b)|0;c[l+(g<<2)>>2]=q+(eG(l,o,d+(g<<2)|0,g)|0)|0;do{if((q|0)==0){if((fw(o,d+(g<<2)|0,g)|0)>=0){r=9332;break}eI(m,d+(g<<2)|0,o,g);c[m+(g<<2)>>2]=0;p=p^1;break}else{r=9332}}while(0);if((r|0)==9332){q=q-(eI(m,o,d+(g<<2)|0,g)|0)|0;c[m+(g<<2)>>2]=q}q=eG(n,l,d+(g<<1<<2)|0,b)|0;if((b|0)!=(g|0)){q=eF(n+(b<<2)|0,l+(b<<2)|0,g-b|0,q)|0}q=q+(c[l+(g<<2)>>2]|0)|0;q=(q<<1)+(eP(n,n,g,1)|0)|0;q=q-(eI(n,n,d,g)|0)|0;c[n+(g<<2)>>2]=q;if((g+1|0)>=100){gs(e,j,g+1|0,m,g+1|0,(e+((g*5&-1)<<2)|0)+20|0)}else{gl(e,j,g+1|0,m,g+1|0,(e+((g*5&-1)<<2)|0)+20|0)}if((g+1|0)>=100){gs((e+(g<<1<<2)|0)+4|0,k,g+1|0,n,g+1|0,(e+((g*5&-1)<<2)|0)+20|0)}else{gl((e+(g<<1<<2)|0)+4|0,k,g+1|0,n,g+1|0,(e+((g*5&-1)<<2)|0)+20|0)}if((i|0)>(b|0)){n=h+(g<<2<<2)|0;k=a+(g<<1<<2)|0;m=i;j=d+(g<<1<<2)|0;o=b;e_(n,k,m,j,o)}else{if((i|0)>=100){gs(h+(g<<2<<2)|0,a+(g<<1<<2)|0,i,d+(g<<1<<2)|0,i,(e+((g*5&-1)<<2)|0)+20|0)}else{gl(h+(g<<2<<2)|0,a+(g<<1<<2)|0,i,d+(g<<1<<2)|0,i,(e+((g*5&-1)<<2)|0)+20|0)}}o=c[h+(g<<2<<2)>>2]|0;q=c[(h+(g<<2<<2)|0)+4>>2]|0;if((g+1|0)>=100){gs(h+(g<<1<<2)|0,f,g+1|0,l,g+1|0,(e+((g*5&-1)<<2)|0)+20|0)}else{gl(h+(g<<1<<2)|0,f,g+1|0,l,g+1|0,(e+((g*5&-1)<<2)|0)+20|0)}c[(h+(g<<2<<2)|0)+4>>2]=q;if((g|0)>=100){gs(h,a,g,d,g,(e+((g*5&-1)<<2)|0)+20|0)}else{gl(h,a,g,d,g,(e+((g*5&-1)<<2)|0)+20|0)}gP(h,(e+(g<<1<<2)|0)+4|0,e,g,i+b|0,p,o);return}function gt(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;h=a;a=b;b=d;d=e;e=f;f=g;if((b*3&-1|0)>=(e<<2|0)){i=b-1>>2}else{i=((e-1|0)>>>0)/3>>>0}g=i+1|0;i=b-(g*3&-1)|0;b=e-(g<<1)|0;e=2&gJ((h+((g*3&-1)<<2)|0)+12|0,(f+(g<<2<<2)|0)+16|0,a,g,i,(f+((g*3&-1)<<2)|0)+12|0);c[((f+(g<<1<<2)|0)+8|0)+(g<<2)>>2]=eP((f+(g<<1<<2)|0)+8|0,d+(g<<2)|0,g,1)|0;j=eP(f,d+(g<<1<<2)|0,b,2)|0;j=j+(eG(f,f,d,b)|0)|0;if((b|0)!=(g|0)){j=eF(f+(b<<2)|0,d+(b<<2)|0,g-b|0,j)|0}c[f+(g<<2)>>2]=j;eG((h+(g<<1<<2)|0)+8|0,f,(f+(g<<1<<2)|0)+8|0,g+1|0);if((fw(f,(f+(g<<1<<2)|0)+8|0,g+1|0)|0)<0){j=(h+(g<<2)|0)+4|0;k=(f+(g<<1<<2)|0)+8|0;l=f;m=g+1|0;eI(j,k,l,m);e=e^2}else{m=(h+(g<<2)|0)+4|0;l=f;k=(f+(g<<1<<2)|0)+8|0;j=g+1|0;eI(m,l,k,j)}e=e^1&gI((h+(g<<2<<2)|0)+16|0,(f+((g*3&-1)<<2)|0)+12|0,a,g,i,f);c[((f+(g<<1<<2)|0)+8|0)+(g<<2)>>2]=eL((f+(g<<1<<2)|0)+8|0,d,g,d+(g<<1<<2)|0,b)|0;j=c[((f+(g<<1<<2)|0)+8|0)+(g<<2)>>2]|0;c[h+(g<<2)>>2]=j+(eG(h,(f+(g<<1<<2)|0)+8|0,d+(g<<2)|0,g)|0)|0;do{if((c[((f+(g<<1<<2)|0)+8|0)+(g<<2)>>2]|0)==0){if((fw((f+(g<<1<<2)|0)+8|0,d+(g<<2)|0,g)|0)>=0){n=18;break}eI((f+(g<<1<<2)|0)+8|0,d+(g<<2)|0,(f+(g<<1<<2)|0)+8|0,g);e=e^1;break}else{n=18}}while(0);if((n|0)==18){n=eI((f+(g<<1<<2)|0)+8|0,(f+(g<<1<<2)|0)+8|0,d+(g<<2)|0,g)|0;j=((f+(g<<1<<2)|0)+8|0)+(g<<2)|0;c[j>>2]=(c[j>>2]|0)-n|0}fh(f,(f+((g*3&-1)<<2)|0)+12|0,(f+(g<<1<<2)|0)+8|0,g+1|0);fh((f+(g<<1<<2)|0)+4|0,(f+(g<<2<<2)|0)+16|0,(h+(g<<2)|0)+4|0,g+1|0);fh((f+(g<<2<<2)|0)+8|0,(h+((g*3&-1)<<2)|0)+12|0,(h+(g<<1<<2)|0)+8|0,g+1|0);fh(h+(g<<1<<2)|0,(h+(g<<2<<2)|0)+16|0,h,g+1|0);if((i|0)>(b|0)){n=h+((g*5&-1)<<2)|0;j=a+((g*3&-1)<<2)|0;k=i;l=d+(g<<1<<2)|0;m=b;e_(n,j,k,l,m);m=h;l=a;k=d;j=g;fh(m,l,k,j);n=h;o=g;p=e;q=f;r=f;s=g;t=s<<1;u=r+(t<<2)|0;v=u+4|0;w=f;x=g;y=x<<2;z=w+(y<<2)|0;A=z+8|0;B=b;C=i;D=B+C|0;gQ(n,o,p,q,v,A,D);return}else{E=h+((g*5&-1)<<2)|0;F=d+(g<<1<<2)|0;G=b;H=a+((g*3&-1)<<2)|0;I=i;e_(E,F,G,H,I);m=h;l=a;k=d;j=g;fh(m,l,k,j);n=h;o=g;p=e;q=f;r=f;s=g;t=s<<1;u=r+(t<<2)|0;v=u+4|0;w=f;x=g;y=x<<2;z=w+(y<<2)|0;A=z+8|0;B=b;C=i;D=B+C|0;gQ(n,o,p,q,v,A,D);return}}function gu(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;if((b*3&-1|0)>=(e*5&-1|0)){k=((b-1|0)>>>0)/5>>>0}else{k=((e-1|0)>>>0)/3>>>0}g=k+1|0;k=b-(g<<2)|0;b=e-(g<<1)|0;e=0;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;m=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;n=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;o=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;p=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;q=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;r=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;s=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;t=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;u=l;l=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;v=l;l=j;w=2&gK(m,n,4,a,g,k,l);w=w|1&gL(o,p,4,a,g,k,l);x=eP(q,a,g,1)|0;x=x+(eG(q,q,a+(g<<2)|0,g)|0)|0;x=(x<<1)+(eP(q,q,g,1)|0)|0;x=x+(eG(q,q,a+(g<<1<<2)|0,g)|0)|0;x=(x<<1)+(eP(q,q,g,1)|0)|0;x=x+(eG(q,q,a+((g*3&-1)<<2)|0,g)|0)|0;x=(x<<1)+(eP(q,q,g,1)|0)|0;c[q+(g<<2)>>2]=x+(eL(q,q,g,a+(g<<2<<2)|0,k)|0)|0;c[r+(g<<2)>>2]=eL(r,d,g,d+(g<<1<<2)|0,b)|0;do{if((c[r+(g<<2)>>2]|0)==0){if((fw(r,d+(g<<2)|0,g)|0)>=0){y=51;break}eI(s,d+(g<<2)|0,r,g);c[s+(g<<2)>>2]=0;w=w^2;break}else{y=51}}while(0);if((y|0)==51){y=c[r+(g<<2)>>2]|0;c[s+(g<<2)>>2]=y-(eI(s,r,d+(g<<2)|0,g)|0)|0}y=eG(r,r,d+(g<<2)|0,g)|0;z=r+(g<<2)|0;c[z>>2]=(c[z>>2]|0)+y|0;x=eP(l,d+(g<<1<<2)|0,b,2)|0;c[t+(g<<2)>>2]=eL(t,d,g,l,b)|0;y=t+(b<<2)|0;z=(c[y>>2]|0)+x|0;c[y>>2]=z;if(z>>>0<x>>>0){while(1){z=y+4|0;y=z;A=(c[z>>2]|0)+1|0;c[z>>2]=A;if((A|0)!=0){break}}}c[l+(g<<2)>>2]=eP(l,d+(g<<2)|0,g,1)|0;if((fw(t,l,g+1|0)|0)<0){y=u;A=l;z=t;B=g+1|0;eI(y,A,z,B);w=w^1}else{B=u;z=t;A=l;y=g+1|0;eI(B,z,A,y)}eG(t,t,l,g+1|0);x=eP(v,d,g,1)|0;x=x+(eG(v,v,d+(g<<2)|0,g)|0)|0;x=(x<<1)+(eP(v,v,g,1)|0)|0;c[v+(g<<2)>>2]=x+(eL(v,v,g,d+(g<<1<<2)|0,b)|0)|0;fh(f,o,t,g+1|0);fh((f+(g<<1<<2)|0)+4|0,p,u,g+1|0);fh((f+(g<<2<<2)|0)+8|0,q,v,g+1|0);c[((f+((g*6&-1)<<2)|0)+12|0)+(g<<1<<2)>>2]=0;fh((f+((g*6&-1)<<2)|0)+12|0,n,s,g+((c[n+(g<<2)>>2]|c[s+(g<<2)>>2]|0)!=0&1)|0);c[(j+(g<<1<<2)|0)+(g<<1<<2)>>2]=0;fh(j+(g<<1<<2)|0,m,r,g+((c[m+(g<<2)>>2]|c[r+(g<<2)>>2]|0)!=0&1)|0);fh(j,a,d,g);if((k|0)>(b|0)){r=j+((g*6&-1)<<2)|0;m=a+(g<<2<<2)|0;s=k;n=d+(g<<1<<2)|0;v=b;e_(r,m,s,n,v)}else{v=j+((g*6&-1)<<2)|0;n=d+(g<<1<<2)|0;d=b;s=a+(g<<2<<2)|0;a=k;e_(v,n,d,s,a)}gR(j,g,w,(f+(g<<1<<2)|0)+4|0,(f+((g*6&-1)<<2)|0)+12|0,f,(f+(g<<2<<2)|0)+8|0,k+b|0,(f+(g<<3<<2)|0)+16|0);if((((e|0)!=0&1|0)!=0&1|0)!=0){dE(e)}i=h;return}function gv(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;h=a;a=b;b=d;d=e;e=f;f=g;if((b|0)>=(e<<1|0)){i=((b-1|0)>>>0)/6>>>0}else{i=((e-1|0)>>>0)/3>>>0}g=i+1|0;i=b-(g*5&-1)|0;b=e-(g<<1)|0;e=gM((h+((g*5&-1)<<2)|0)+8|0,h+((g*3&-1)<<2)|0,5,a,g,i,2,h)|0;c[h+(g<<2)>>2]=eP(h,d+(g<<2)|0,g,2)|0;c[((h+((g*6&-1)<<2)|0)+12|0)+(b<<2)>>2]=eP((h+((g*6&-1)<<2)|0)+12|0,d+(g<<1<<2)|0,b,4)|0;if((g|0)==(b|0)){j=eG((h+((g*6&-1)<<2)|0)+12|0,(h+((g*6&-1)<<2)|0)+12|0,d+(0<<2)|0,g)|0;k=((h+((g*6&-1)<<2)|0)+12|0)+(g<<2)|0;c[k>>2]=(c[k>>2]|0)+j|0}else{c[((h+((g*6&-1)<<2)|0)+12|0)+(g<<2)>>2]=eL((h+((g*6&-1)<<2)|0)+12|0,d+(0<<2)|0,g,(h+((g*6&-1)<<2)|0)+12|0,b+1|0)|0}e=e^gw((h+(g<<2<<2)|0)+4|0,(h+((g*6&-1)<<2)|0)+12|0,h,g+1|0);fh(h,h+((g*3&-1)<<2)|0,(h+(g<<2<<2)|0)+4|0,g+1|0);fh((f+((g*3&-1)<<2)|0)+4|0,(h+((g*5&-1)<<2)|0)+8|0,(h+((g*6&-1)<<2)|0)+12|0,g+1|0);gE((f+((g*3&-1)<<2)|0)+4|0,(g<<1)+1|0,h,e,g,2,4);e=gK((h+((g*5&-1)<<2)|0)+8|0,h+((g*3&-1)<<2)|0,5,a,g,i,h)|0;j=eL((f+((g*6&-1)<<2)|0)+8|0,d+(0<<2)|0,g,d+(g<<1<<2)|0,b)|0;c[((h+((g*6&-1)<<2)|0)+12|0)+(g<<2)>>2]=j+(eG((h+((g*6&-1)<<2)|0)+12|0,(f+((g*6&-1)<<2)|0)+8|0,d+(g<<2)|0,g)|0)|0;do{if((j|0)==0){if((fw((f+((g*6&-1)<<2)|0)+8|0,d+(g<<2)|0,g)|0)>=0){l=115;break}eI((h+(g<<2<<2)|0)+4|0,d+(g<<2)|0,(f+((g*6&-1)<<2)|0)+8|0,g);c[((h+(g<<2<<2)|0)+4|0)+(g<<2)>>2]=0;e=e^-1;break}else{l=115}}while(0);if((l|0)==115){j=j-(eI((h+(g<<2<<2)|0)+4|0,(f+((g*6&-1)<<2)|0)+8|0,d+(g<<2)|0,g)|0)|0;c[((h+(g<<2<<2)|0)+4|0)+(g<<2)>>2]=j}fh(h,h+((g*3&-1)<<2)|0,(h+(g<<2<<2)|0)+4|0,g+1|0);fh(f,(h+((g*5&-1)<<2)|0)+8|0,(h+((g*6&-1)<<2)|0)+12|0,g+1|0);gE(f,(g<<1)+1|0,h,e,g,0,0);e=gL((h+((g*5&-1)<<2)|0)+8|0,h+((g*3&-1)<<2)|0,5,a,g,i,h)|0;c[h+(g<<2)>>2]=eP(h,d+(g<<2)|0,g,1)|0;c[((h+((g*6&-1)<<2)|0)+12|0)+(b<<2)>>2]=eP((h+((g*6&-1)<<2)|0)+12|0,d+(g<<1<<2)|0,b,2)|0;if((g|0)==(b|0)){j=eG((h+((g*6&-1)<<2)|0)+12|0,(h+((g*6&-1)<<2)|0)+12|0,d+(0<<2)|0,g)|0;l=((h+((g*6&-1)<<2)|0)+12|0)+(g<<2)|0;c[l>>2]=(c[l>>2]|0)+j|0}else{c[((h+((g*6&-1)<<2)|0)+12|0)+(g<<2)>>2]=eL((h+((g*6&-1)<<2)|0)+12|0,d+(0<<2)|0,g,(h+((g*6&-1)<<2)|0)+12|0,b+1|0)|0}e=e^gw((h+(g<<2<<2)|0)+4|0,(h+((g*6&-1)<<2)|0)+12|0,h,g+1|0);fh(h,h+((g*3&-1)<<2)|0,(h+(g<<2<<2)|0)+4|0,g+1|0);fh(h+((g*3&-1)<<2)|0,(h+((g*5&-1)<<2)|0)+8|0,(h+((g*6&-1)<<2)|0)+12|0,g+1|0);gE(h+((g*3&-1)<<2)|0,(g<<1)+1|0,h,e,g,1,2);fh(h,a,d,g);if((i|0)>(b|0)){e=h+((g*7&-1)<<2)|0;j=a+((g*5&-1)<<2)|0;l=i;k=d+(g<<1<<2)|0;m=b;e_(e,j,l,k,m);m=h;k=g;l=f;j=g;e=j*3&-1;n=l+(e<<2)|0;o=n+4|0;p=f;q=i;r=b;s=q+r|0;t=f;u=g;v=u*6&-1;w=t+(v<<2)|0;x=w+8|0;gS(m,k,o,p,s,x);return}else{y=h+((g*7&-1)<<2)|0;z=d+(g<<1<<2)|0;d=b;A=a+((g*5&-1)<<2)|0;a=i;e_(y,z,d,A,a);m=h;k=g;l=f;j=g;e=j*3&-1;n=l+(e<<2)|0;o=n+4|0;p=f;q=i;r=b;s=q+r|0;t=f;u=g;v=u*6&-1;w=t+(v<<2)|0;x=w+8|0;gS(m,k,o,p,s,x);return}}function gw(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b;b=c;c=d;d=gx(a,e,b,c)|0;eG(e,e,b,c);return d|0}function gx(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a;a=b;b=d;d=e;while(1){e=d-1|0;d=e;if(!((e|0)>=0)){g=147;break}h=c[a+(d<<2)>>2]|0;i=c[b+(d<<2)>>2]|0;if((h|0)!=(i|0)){break}c[f+(d<<2)>>2]=0}if((g|0)==147){j=0;k=j;return k|0}d=d+1|0;if(h>>>0>i>>>0){i=f;h=a;g=b;e=d;eI(i,h,g,e);j=0;k=j;return k|0}else{e=f;f=b;b=a;a=d;eI(e,f,b,a);j=-1;k=j;return k|0}return 0}function gy(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;h=a;a=b;b=d;d=e;e=g;g=b+3>>2;i=b-(g*3&-1)|0;b=f-(g*3&-1)|0;f=1&gJ(h,(h+(g<<2)|0)+4|0,a,g,i,(e+(g<<3<<2)|0)+20|0);f=f^1&gJ((h+(g<<2<<2)|0)+8|0,(h+(g<<1<<2)|0)+8|0,d,g,b,(e+(g<<3<<2)|0)+20|0);if((g+1|0)>=100){gs(e,h,g+1|0,(h+(g<<2<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}else{gl(e,h,g+1|0,(h+(g<<2<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}if((g+1|0)>=100){gs((e+(g<<1<<2)|0)+4|0,(h+(g<<2)|0)+4|0,g+1|0,(h+(g<<1<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}else{gl((e+(g<<1<<2)|0)+4|0,(h+(g<<2)|0)+4|0,g+1|0,(h+(g<<1<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}j=eP(h,a,g,1)|0;j=j+(eG(h,h,a+(g<<2)|0,g)|0)|0;j=(j<<1)+(eP(h,h,g,1)|0)|0;j=j+(eG(h,h,a+(g<<1<<2)|0,g)|0)|0;j=(j<<1)+(eP(h,h,g,1)|0)|0;c[h+(g<<2)>>2]=j+(eL(h,h,g,a+((g*3&-1)<<2)|0,i)|0)|0;j=eP((h+(g<<2<<2)|0)+8|0,d,g,1)|0;j=j+(eG((h+(g<<2<<2)|0)+8|0,(h+(g<<2<<2)|0)+8|0,d+(g<<2)|0,g)|0)|0;j=(j<<1)+(eP((h+(g<<2<<2)|0)+8|0,(h+(g<<2<<2)|0)+8|0,g,1)|0)|0;j=j+(eG((h+(g<<2<<2)|0)+8|0,(h+(g<<2<<2)|0)+8|0,d+(g<<1<<2)|0,g)|0)|0;j=(j<<1)+(eP((h+(g<<2<<2)|0)+8|0,(h+(g<<2<<2)|0)+8|0,g,1)|0)|0;c[((h+(g<<2<<2)|0)+8|0)+(g<<2)>>2]=j+(eL((h+(g<<2<<2)|0)+8|0,(h+(g<<2<<2)|0)+8|0,g,d+((g*3&-1)<<2)|0,b)|0)|0;if((g+1|0)>=100){gs((e+(g<<2<<2)|0)+8|0,h,g+1|0,(h+(g<<2<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}else{gl((e+(g<<2<<2)|0)+8|0,h,g+1|0,(h+(g<<2<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}f=f|2&gI(h,(h+(g<<2)|0)+4|0,a,g,i,(e+(g<<3<<2)|0)+20|0);f=f^2&gI((h+(g<<2<<2)|0)+8|0,(h+(g<<1<<2)|0)+8|0,d,g,b,(e+(g<<3<<2)|0)+20|0);if((g+1|0)>=100){gs((e+((g*6&-1)<<2)|0)+12|0,(h+(g<<2)|0)+4|0,g+1|0,(h+(g<<1<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}else{gl((e+((g*6&-1)<<2)|0)+12|0,(h+(g<<2)|0)+4|0,g+1|0,(h+(g<<1<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}if((g+1|0)>=100){gs(h+(g<<1<<2)|0,h,g+1|0,(h+(g<<2<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}else{gl(h+(g<<1<<2)|0,h,g+1|0,(h+(g<<2<<2)|0)+8|0,g+1|0,(e+(g<<3<<2)|0)+20|0)}if((g|0)>=100){gs(h,a,g,d,g,(e+(g<<3<<2)|0)+20|0)}else{gl(h,a,g,d,g,(e+(g<<3<<2)|0)+20|0)}if((i|0)>(b|0)){j=h+((g*6&-1)<<2)|0;k=a+((g*3&-1)<<2)|0;l=i;m=d+((g*3&-1)<<2)|0;n=b;e_(j,k,l,m,n);o=h;p=g;q=f;r=e;s=g;t=s<<1;u=r+(t<<2)|0;v=u+4|0;w=e;x=g;y=x*6&-1;z=w+(y<<2)|0;A=z+12|0;B=e;C=e;D=g;E=D<<2;F=C+(E<<2)|0;G=F+8|0;H=i;I=b;J=H+I|0;K=e;L=g;M=L<<3;N=K+(M<<2)|0;O=N+20|0;gR(o,p,q,v,A,B,G,J,O);return}if((i|0)>=100){gs(h+((g*6&-1)<<2)|0,a+((g*3&-1)<<2)|0,i,d+((g*3&-1)<<2)|0,i,(e+(g<<3<<2)|0)+20|0)}else{gl(h+((g*6&-1)<<2)|0,a+((g*3&-1)<<2)|0,i,d+((g*3&-1)<<2)|0,i,(e+(g<<3<<2)|0)+20|0)}o=h;p=g;q=f;r=e;s=g;t=s<<1;u=r+(t<<2)|0;v=u+4|0;w=e;x=g;y=x*6&-1;z=w+(y<<2)|0;A=z+12|0;B=e;C=e;D=g;E=D<<2;F=C+(E<<2)|0;G=F+8|0;H=i;I=b;J=H+I|0;K=e;L=g;M=L<<3;N=K+(M<<2)|0;O=N+20|0;gR(o,p,q,v,A,B,G,J,O);return}function gz(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;g=a;a=b;b=c;c=d;d=e;e=f;if((((b*17&-1|0)<(d*18&-1|0)&1|0)!=0&1|0)!=0){h=(((b-1|0)>>>0)/6>>>0)+1|0;i=5;j=5;k=0;l=b-(h*5&-1)|0;m=d-(h*5&-1)|0}else{if(((b*5&-1)*18&-1|0)<(d*119&-1|0)){j=7;i=6}else{if(((b*5&-1)*17&-1|0)<(d*126&-1|0)){j=7;i=5}else{if((b*18&-1|0)<(d*34&-1|0)){j=8;i=5}else{if((b*17&-1|0)<(d*36&-1|0)){j=8;i=4}else{j=9;i=4}}}}k=(j^i)&1;f=ab(i,b);if((f|0)>=(ab(j,d)|0)){n=((b-1|0)>>>0)/(j>>>0)>>>0}else{n=((d-1|0)>>>0)/(i>>>0)>>>0}h=n+1|0;j=j-1|0;i=i-1|0;l=b-ab(j,h)|0;m=d-ab(i,h)|0;if((k|0)!=0){if((((l|0)<1&1|0)!=0&1|0)!=0){j=j-1|0;l=l+h|0;k=0}else{if((((m|0)<1&1|0)!=0&1|0)!=0){i=i-1|0;m=m+h|0;k=0}}}}d=gN((g+((h*9&-1)<<2)|0)+8|0,g+((h*7&-1)<<2)|0,j,a,h,l,1,g)|0;b=d^gN((e+((h*9&-1)<<2)|0)+12|0,(g+(h<<3<<2)|0)+4|0,i,c,h,m,1,g);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){gz(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gz(e,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}else{gy(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gy(e,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gs(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gs(e,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gl(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gl(e,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}gE(e,(h<<1)+1|0,g,b,h,k+1|0,k);b=gK((g+((h*9&-1)<<2)|0)+8|0,g+((h*7&-1)<<2)|0,j,a,h,l,g)|0;if((((i|0)==3&1|0)!=0&1|0)!=0){b=b^gI((e+((h*9&-1)<<2)|0)+12|0,(g+(h<<3<<2)|0)+4|0,c,h,m,g)}else{b=b^gK((e+((h*9&-1)<<2)|0)+12|0,(g+(h<<3<<2)|0)+4|0,i,c,h,m,g)}if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){gz(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gz((e+((h*3&-1)<<2)|0)+4|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}else{gy(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gy((e+((h*3&-1)<<2)|0)+4|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gs(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gs((e+((h*3&-1)<<2)|0)+4|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gl(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gl((e+((h*3&-1)<<2)|0)+4|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}gE((e+((h*3&-1)<<2)|0)+4|0,(h<<1)+1|0,g,b,h,0,0);d=gM((g+((h*9&-1)<<2)|0)+8|0,g+((h*7&-1)<<2)|0,j,a,h,l,2,g)|0;b=d^gM((e+((h*9&-1)<<2)|0)+12|0,(g+(h<<3<<2)|0)+4|0,i,c,h,m,2,g);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){gz(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gz((e+((h*6&-1)<<2)|0)+8|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}else{gy(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gy((e+((h*6&-1)<<2)|0)+8|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gs(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gs((e+((h*6&-1)<<2)|0)+8|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gl(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gl((e+((h*6&-1)<<2)|0)+8|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}gE((e+((h*6&-1)<<2)|0)+8|0,(h<<1)+1|0,g,b,h,2,4);d=gN((g+((h*9&-1)<<2)|0)+8|0,g+((h*7&-1)<<2)|0,j,a,h,l,2,g)|0;b=d^gN((e+((h*9&-1)<<2)|0)+12|0,(g+(h<<3<<2)|0)+4|0,i,c,h,m,2,g);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){gz(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gz(g+((h*3&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}else{gy(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gy(g+((h*3&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gs(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gs(g+((h*3&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gl(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gl(g+((h*3&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}gE(g+((h*3&-1)<<2)|0,(h<<1)+1|0,g,b,h,k+1<<1,k<<1);d=gL((g+((h*9&-1)<<2)|0)+8|0,g+((h*7&-1)<<2)|0,j,a,h,l,g)|0;b=d^gL((e+((h*9&-1)<<2)|0)+12|0,(g+(h<<3<<2)|0)+4|0,i,c,h,m,g);if((h+1|0)>=100){if((h+1|0)>=300){if((h+1|0)>=350){gz(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gz(g+((h*7&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}else{gy(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gy(g+((h*7&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gs(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gs(g+((h*7&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}}else{gl(g,g+((h*7&-1)<<2)|0,h+1|0,(g+(h<<3<<2)|0)+4|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0);gl(g+((h*7&-1)<<2)|0,(g+((h*9&-1)<<2)|0)+8|0,h+1|0,(e+((h*9&-1)<<2)|0)+12|0,h+1|0,(e+((h*10&-1)<<2)|0)+16|0)}gE(g+((h*7&-1)<<2)|0,(h<<1)+1|0,g,b,h,1,2);if((h|0)>=100){if((h|0)>=300){if((h|0)>=350){gz(g,a,h,c,h,(e+((h*9&-1)<<2)|0)+12|0)}else{gy(g,a,h,c,h,(e+((h*9&-1)<<2)|0)+12|0)}}else{gs(g,a,h,c,h,(e+((h*9&-1)<<2)|0)+12|0)}}else{gl(g,a,h,c,h,(e+((h*9&-1)<<2)|0)+12|0)}if((((k|0)!=0&1|0)!=0&1|0)==0){o=g;p=e;q=h;r=q*6&-1;s=p+(r<<2)|0;t=s+8|0;u=e;v=h;w=v*3&-1;x=u+(w<<2)|0;y=x+4|0;z=e;A=h;B=l;C=m;D=B+C|0;E=k;F=e;G=h;H=G*9&-1;I=F+(H<<2)|0;J=I+12|0;gU(o,t,y,z,A,D,E,J);return}if((l|0)>(m|0)){b=g+((h*11&-1)<<2)|0;d=a+(ab(j,h)<<2)|0;n=l;f=c+(ab(i,h)<<2)|0;K=m;e_(b,d,n,f,K)}else{K=g+((h*11&-1)<<2)|0;f=c+(ab(i,h)<<2)|0;i=m;c=a+(ab(j,h)<<2)|0;j=l;e_(K,f,i,c,j)}o=g;p=e;q=h;r=q*6&-1;s=p+(r<<2)|0;t=s+8|0;u=e;v=h;w=v*3&-1;x=u+(w<<2)|0;y=x+4|0;z=e;A=h;B=l;C=m;D=B+C|0;E=k;F=e;G=h;H=G*9&-1;I=F+(H<<2)|0;J=I+12|0;gU(o,t,y,z,A,D,E,J);return}function gA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=b;b=c;c=d;d=(((b-1|0)>>>0)/6>>>0)+1|0;f=b-(d*5&-1)|0;gN((e+((d*9&-1)<<2)|0)+8|0,e+((d*7&-1)<<2)|0,5,a,d,f,1,e);gF(e,e+((d*7&-1)<<2)|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gF(c,(e+((d*9&-1)<<2)|0)+8|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gE(c,(d<<1)+1|0,e,0,d,1,0);gK((e+((d*9&-1)<<2)|0)+8|0,e+((d*7&-1)<<2)|0,5,a,d,f,e);gF(e,e+((d*7&-1)<<2)|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gF((c+((d*3&-1)<<2)|0)+4|0,(e+((d*9&-1)<<2)|0)+8|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gE((c+((d*3&-1)<<2)|0)+4|0,(d<<1)+1|0,e,0,d,0,0);gM((e+((d*9&-1)<<2)|0)+8|0,e+((d*7&-1)<<2)|0,5,a,d,f,2,e);gF(e,e+((d*7&-1)<<2)|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gF((c+((d*6&-1)<<2)|0)+8|0,(e+((d*9&-1)<<2)|0)+8|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gE((c+((d*6&-1)<<2)|0)+8|0,(d<<1)+1|0,e,0,d,2,4);gN((e+((d*9&-1)<<2)|0)+8|0,e+((d*7&-1)<<2)|0,5,a,d,f,2,e);gF(e,e+((d*7&-1)<<2)|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gF(e+((d*3&-1)<<2)|0,(e+((d*9&-1)<<2)|0)+8|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gE(e+((d*3&-1)<<2)|0,(d<<1)+1|0,e,0,d,2,0);gL((e+((d*9&-1)<<2)|0)+8|0,e+((d*7&-1)<<2)|0,5,a,d,f,e);gF(e,e+((d*7&-1)<<2)|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gF(e+((d*7&-1)<<2)|0,(e+((d*9&-1)<<2)|0)+8|0,d+1|0,(c+((d*9&-1)<<2)|0)+12|0);gE(e+((d*7&-1)<<2)|0,(d<<1)+1|0,e,0,d,1,2);gF(e,a,d,(c+((d*9&-1)<<2)|0)+12|0);gU(e,(c+((d*6&-1)<<2)|0)+8|0,(c+((d*3&-1)<<2)|0)+4|0,c,d,f<<1,0,(c+((d*9&-1)<<2)|0)+12|0);return}function gB(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;g=a;a=b;b=c;c=d;d=e;e=f;do{if((((b|0)==(d|0)&1|0)!=0&1|0)!=0){h=370}else{if((b*10&-1|0)<((d>>1)*21&-1|0)){h=370;break}if((b*13&-1|0)<(d<<4|0)){i=9;j=8}else{if((b*10&-1|0)<((d>>1)*27&-1|0)){i=9;j=7}else{if((b*10&-1|0)<((d>>1)*33&-1|0)){i=10;j=7}else{if((b<<2|0)<(d*7&-1|0)){i=10;j=6}else{if((b*6&-1|0)<(d*13&-1|0)){i=11;j=6}else{i=11;j=5}}}}}k=i+j&1;f=ab(j,b);if((f|0)>=(ab(i,d)|0)){l=((b-1|0)>>>0)/(i>>>0)>>>0}else{l=((d-1|0)>>>0)/(j>>>0)>>>0}m=l+1|0;i=i-1|0;j=j-1|0;n=b-ab(i,m)|0;o=d-ab(j,m)|0;if((k|0)!=0){if((((n|0)<1&1|0)!=0&1|0)!=0){i=i-1|0;n=n+m|0;k=0}else{if((((o|0)<1&1|0)!=0&1|0)!=0){j=j-1|0;o=o+m|0;k=0}}}break}}while(0);if((h|0)==370){k=0;m=(b-1>>3)+1|0;j=7;i=7;n=b-(m*7&-1)|0;o=d-(m*7&-1)|0}d=gN((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,3,g)|0;b=d^gN((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,3,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz(e,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy(e,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs(e,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl(e,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE(e,((m<<1)+1|0)+1|0,g,b,m,(k+1|0)*3&-1,k*3&-1);d=gN((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,2,g)|0;b=d^gN((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,2,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz((e+((m*3&-1)<<2)|0)+4|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy((e+((m*3&-1)<<2)|0)+4|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs((e+((m*3&-1)<<2)|0)+4|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl((e+((m*3&-1)<<2)|0)+4|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE((e+((m*3&-1)<<2)|0)+4|0,(m<<1)+1|0,g,b,m,k+1<<1,k<<1);d=gL((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,g)|0;b=d^gL((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz((e+((m*6&-1)<<2)|0)+8|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy((e+((m*6&-1)<<2)|0)+8|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs((e+((m*6&-1)<<2)|0)+8|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl((e+((m*6&-1)<<2)|0)+8|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE((e+((m*6&-1)<<2)|0)+8|0,(m<<1)+1|0,g,b,m,1,2);d=gM((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,3,g)|0;b=d^gM((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,3,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz((e+((m*9&-1)<<2)|0)+12|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy((e+((m*9&-1)<<2)|0)+12|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs((e+((m*9&-1)<<2)|0)+12|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl((e+((m*9&-1)<<2)|0)+12|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE((e+((m*9&-1)<<2)|0)+12|0,((m<<1)+1|0)+1|0,g,b,m,3,6);d=gN((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,1,g)|0;b=d^gN((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,1,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz(g+((m*3&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy(g+((m*3&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs(g+((m*3&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl(g+((m*3&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE(g+((m*3&-1)<<2)|0,(m<<1)+1|0,g,b,m,k+1|0,k);b=gK((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,g)|0;b=b^gK((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz(g+((m*7&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy(g+((m*7&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs(g+((m*7&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl(g+((m*7&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE(g+((m*7&-1)<<2)|0,(m<<1)+1|0,g,b,m,0,0);d=gM((g+((m*13&-1)<<2)|0)+8|0,g+((m*11&-1)<<2)|0,i,a,m,n,2,g)|0;b=d^gM((e+((m*12&-1)<<2)|0)+16|0,(g+((m*12&-1)<<2)|0)+4|0,j,c,m,o,2,g);if((m+1|0)>=100){if((m+1|0)>=300){if((m+1|0)>=350){gz(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gz(g+((m*11&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}else{gy(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gy(g+((m*11&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gs(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gs(g+((m*11&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}}else{gl(g,g+((m*11&-1)<<2)|0,m+1|0,(g+((m*12&-1)<<2)|0)+4|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0);gl(g+((m*11&-1)<<2)|0,(g+((m*13&-1)<<2)|0)+8|0,m+1|0,(e+((m*12&-1)<<2)|0)+16|0,m+1|0,(e+((m*13&-1)<<2)|0)+20|0)}gE(g+((m*11&-1)<<2)|0,(m<<1)+1|0,g,b,m,2,4);if((m|0)>=100){if((m|0)>=300){if((m|0)>=350){gz(g,a,m,c,m,(e+((m*12&-1)<<2)|0)+16|0)}else{gy(g,a,m,c,m,(e+((m*12&-1)<<2)|0)+16|0)}}else{gs(g,a,m,c,m,(e+((m*12&-1)<<2)|0)+16|0)}}else{gl(g,a,m,c,m,(e+((m*12&-1)<<2)|0)+16|0)}if((((k|0)!=0&1|0)!=0&1|0)==0){p=g;q=e;r=m;s=r*9&-1;t=q+(s<<2)|0;u=t+12|0;v=e;w=m;x=w*6&-1;y=v+(x<<2)|0;z=y+8|0;A=e;B=m;C=B*3&-1;D=A+(C<<2)|0;E=D+4|0;F=e;G=m;H=n;I=o;J=H+I|0;K=k;L=e;M=m;N=M*12&-1;O=L+(N<<2)|0;P=O+16|0;gW(p,u,z,E,F,G,J,K,P);return}if((n|0)>(o|0)){b=g+((m*15&-1)<<2)|0;d=a+(ab(i,m)<<2)|0;h=n;l=c+(ab(j,m)<<2)|0;f=o;e_(b,d,h,l,f)}else{f=g+((m*15&-1)<<2)|0;l=c+(ab(j,m)<<2)|0;j=o;c=a+(ab(i,m)<<2)|0;i=n;e_(f,l,j,c,i)}p=g;q=e;r=m;s=r*9&-1;t=q+(s<<2)|0;u=t+12|0;v=e;w=m;x=w*6&-1;y=v+(x<<2)|0;z=y+8|0;A=e;B=m;C=B*3&-1;D=A+(C<<2)|0;E=D+4|0;F=e;G=m;H=n;I=o;J=H+I|0;K=k;L=e;M=m;N=M*12&-1;O=L+(N<<2)|0;P=O+16|0;gW(p,u,z,E,F,G,J,K,P);return}function gC(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=b;b=c;c=d;d=(b-1>>3)+1|0;f=b-(d*7&-1)|0;gN((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,3,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC(c,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA(c,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH(c,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG(c,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF(c,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE(c,((d<<1)+1|0)+1|0,e,0,d,3,0);gN((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,2,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC((c+((d*3&-1)<<2)|0)+4|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA((c+((d*3&-1)<<2)|0)+4|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH((c+((d*3&-1)<<2)|0)+4|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG((c+((d*3&-1)<<2)|0)+4|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF((c+((d*3&-1)<<2)|0)+4|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE((c+((d*3&-1)<<2)|0)+4|0,(d<<1)+1|0,e,0,d,2,0);gL((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC((c+((d*6&-1)<<2)|0)+8|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA((c+((d*6&-1)<<2)|0)+8|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH((c+((d*6&-1)<<2)|0)+8|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG((c+((d*6&-1)<<2)|0)+8|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF((c+((d*6&-1)<<2)|0)+8|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE((c+((d*6&-1)<<2)|0)+8|0,(d<<1)+1|0,e,0,d,1,2);gM((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,3,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC((c+((d*9&-1)<<2)|0)+12|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA((c+((d*9&-1)<<2)|0)+12|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH((c+((d*9&-1)<<2)|0)+12|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG((c+((d*9&-1)<<2)|0)+12|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF((c+((d*9&-1)<<2)|0)+12|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE((c+((d*9&-1)<<2)|0)+12|0,((d<<1)+1|0)+1|0,e,0,d,3,6);gN((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,1,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC(e+((d*3&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA(e+((d*3&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH(e+((d*3&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG(e+((d*3&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF(e+((d*3&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE(e+((d*3&-1)<<2)|0,(d<<1)+1|0,e,0,d,1,0);gK((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC(e+((d*7&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA(e+((d*7&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH(e+((d*7&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG(e+((d*7&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF(e+((d*7&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE(e+((d*7&-1)<<2)|0,(d<<1)+1|0,e,0,d,0,0);gM((e+((d*13&-1)<<2)|0)+8|0,e+((d*11&-1)<<2)|0,7,a,d,f,2,e);if((d+1|0)>=120){if((d+1|0)>=400){if((d+1|0)>=350){if((d+1|0)>=450){gC(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gC(e+((d*11&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gA(e+((d*11&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gH(e+((d*11&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gG(e+((d*11&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,e+((d*11&-1)<<2)|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0);gF(e+((d*11&-1)<<2)|0,(e+((d*13&-1)<<2)|0)+8|0,d+1|0,(c+((d*12&-1)<<2)|0)+16|0)}gE(e+((d*11&-1)<<2)|0,(d<<1)+1|0,e,0,d,2,4);if((d|0)>=120){if((d|0)>=400){if((d|0)>=350){if((d|0)>=450){gC(e,a,d,(c+((d*12&-1)<<2)|0)+16|0)}else{gA(e,a,d,(c+((d*12&-1)<<2)|0)+16|0)}}else{gH(e,a,d,(c+((d*12&-1)<<2)|0)+16|0)}}else{gG(e,a,d,(c+((d*12&-1)<<2)|0)+16|0)}}else{gF(e,a,d,(c+((d*12&-1)<<2)|0)+16|0)}gW(e,(c+((d*9&-1)<<2)|0)+12|0,(c+((d*6&-1)<<2)|0)+8|0,(c+((d*3&-1)<<2)|0)+4|0,c,d,f<<1,0,(c+((d*12&-1)<<2)|0)+16|0);return}function gD(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b-1|0;while(1){if(!((a|0)>=0)){e=634;break}if((c[d+(a<<2)>>2]|0)!=0){e=631;break}a=a-1|0}if((e|0)==631){a=0;d=a;return d|0}else if((e|0)==634){a=1;d=a;return d|0}return 0}function gE(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0;i=a;a=b;b=d;d=f;f=g;g=h;if((e|0)!=0){e=b;h=i;j=b;k=a;eI(e,h,j,k);k=b;j=b;h=a;eQ(k,j,h,1)}else{h=b;j=i;k=b;e=a;eG(h,j,k,e);e=b;k=b;j=a;eQ(e,k,j,1)}eI(i,i,b,a);if((f|0)>0){j=i;k=i;e=a;h=f;eQ(j,k,e,h)}if((g|0)>0){h=b;e=b;k=a;j=g;eQ(h,e,k,j)}c[i+(a<<2)>>2]=eG(i+(d<<2)|0,i+(d<<2)|0,b,a-d|0)|0;eF(i+(a<<2)|0,(b+(a<<2)|0)+(-d<<2)|0,d,c[i+(a<<2)>>2]|0);return}function gF(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=b>>1;g=b-e|0;b=f;if((e|0)==(g|0)){if((fw(a,a+(g<<2)|0,g)|0)<0){h=b;i=a+(g<<2)|0;j=a;k=g;eI(h,i,j,k)}else{k=b;j=a;i=a+(g<<2)|0;h=g;eI(k,j,i,h)}}else{do{if((gD(a+(e<<2)|0,g-e|0)|0)!=0){if((fw(a,a+(g<<2)|0,e)|0)>=0){l=665;break}eI(b,a+(g<<2)|0,a,e);if((g-e|0)!=0){h=b+(e<<2)|0;i=g-e|0;while(1){j=h;h=j+4|0;c[j>>2]=0;j=i-1|0;i=j;if((j|0)==0){break}}}break}else{l=665}}while(0);if((l|0)==665){l=b;i=a;h=g;j=a+(g<<2)|0;k=e;eM(l,i,h,j,k)}}if((g|0)>=50){gF(d,b,g,d+(g<<1<<2)|0)}else{fm(d,b,g)}if((e|0)>=50){gF(f+(g<<1<<2)|0,a+(g<<2)|0,e,d+(g<<1<<2)|0)}else{fm(f+(g<<1<<2)|0,a+(g<<2)|0,e)}if((g|0)>=50){gF(f,a,g,d+(g<<1<<2)|0)}else{fm(f,a,g)}a=eG(f+(g<<1<<2)|0,f+(g<<2)|0,f+(g<<1<<2)|0,g)|0;b=a+(eG(f+(g<<2)|0,f+(g<<1<<2)|0,f,g)|0)|0;a=a+(eL(f+(g<<1<<2)|0,f+(g<<1<<2)|0,g,(f+(g<<1<<2)|0)+(g<<2)|0,(e+e|0)-g|0)|0)|0;a=a-(eI(f+(g<<2)|0,f+(g<<2)|0,d,g<<1)|0)|0;d=f+(g<<1<<2)|0;e=(c[d>>2]|0)+b|0;c[d>>2]=e;if(e>>>0<b>>>0){while(1){b=d+4|0;d=b;e=(c[b>>2]|0)+1|0;c[b>>2]=e;if((e|0)!=0){break}}}if(((a>>>0<=2&1|0)!=0&1|0)==0){d=f+((g*3&-1)<<2)|0;while(1){e=d;d=e+4|0;b=c[e>>2]|0;c[e>>2]=b-1|0;if((b|0)!=0){break}}return}d=f+((g*3&-1)<<2)|0;g=(c[d>>2]|0)+a|0;c[d>>2]=g;if(g>>>0<a>>>0){while(1){a=d+4|0;d=a;g=(c[a>>2]|0)+1|0;c[a>>2]=g;if((g|0)!=0){break}}}return}function gG(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=((b+2|0)>>>0)/3>>>0;g=b-(e<<1)|0;b=(d+(e<<2<<2)|0)+16|0;h=(d+(e<<1<<2)|0)+8|0;i=(f+(e<<2)|0)+4|0;j=d;k=eL(j,a,e,a+(e<<1<<2)|0,g)|0;c[b+(e<<2)>>2]=k+(eG(b,j,a+(e<<2)|0,e)|0)|0;do{if((k|0)==0){if((fw(j,a+(e<<2)|0,e)|0)>=0){l=716;break}eI(h,a+(e<<2)|0,j,e);c[h+(e<<2)>>2]=0;break}else{l=716}}while(0);if((l|0)==716){k=k-(eI(h,j,a+(e<<2)|0,e)|0)|0;c[h+(e<<2)>>2]=k}k=eG(i,a+(e<<1<<2)|0,b,g)|0;if((g|0)!=(e|0)){k=eF(i+(g<<2)|0,b+(g<<2)|0,e-g|0,k)|0}k=k+(c[b+(e<<2)>>2]|0)|0;k=(k<<1)+(eP(i,i,e,1)|0)|0;k=k-(eI(i,i,a,e)|0)|0;c[i+(e<<2)>>2]=k;if((e+1|0)>=50){if((e+1|0)>=120){gG(d,h,e+1|0,(d+((e*5&-1)<<2)|0)+20|0)}else{gF(d,h,e+1|0,(d+((e*5&-1)<<2)|0)+20|0)}}else{fm(d,h,e+1|0)}if((e+1|0)>=50){if((e+1|0)>=120){gG((d+(e<<1<<2)|0)+4|0,i,e+1|0,(d+((e*5&-1)<<2)|0)+20|0)}else{gF((d+(e<<1<<2)|0)+4|0,i,e+1|0,(d+((e*5&-1)<<2)|0)+20|0)}}else{fm((d+(e<<1<<2)|0)+4|0,i,e+1|0)}if((g|0)>=50){if((g|0)>=120){gG(f+(e<<2<<2)|0,a+(e<<1<<2)|0,g,(d+((e*5&-1)<<2)|0)+20|0)}else{gF(f+(e<<2<<2)|0,a+(e<<1<<2)|0,g,(d+((e*5&-1)<<2)|0)+20|0)}}else{fm(f+(e<<2<<2)|0,a+(e<<1<<2)|0,g)}i=c[f+(e<<2<<2)>>2]|0;k=c[(f+(e<<2<<2)|0)+4>>2]|0;if((e+1|0)>=50){if((e+1|0)>=120){gG(f+(e<<1<<2)|0,b,e+1|0,(d+((e*5&-1)<<2)|0)+20|0)}else{gF(f+(e<<1<<2)|0,b,e+1|0,(d+((e*5&-1)<<2)|0)+20|0)}}else{fm(f+(e<<1<<2)|0,b,e+1|0)}c[(f+(e<<2<<2)|0)+4>>2]=k;if((e|0)>=50){if((e|0)>=120){gG(f,a,e,(d+((e*5&-1)<<2)|0)+20|0)}else{gF(f,a,e,(d+((e*5&-1)<<2)|0)+20|0)}}else{fm(f,a,e)}gP(f,(d+(e<<1<<2)|0)+4|0,d,e,g+g|0,0,i);return}function gH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=a;a=b;b=d;d=e;e=b+3>>2;g=b-(e*3&-1)|0;gJ(f,(f+(e<<2<<2)|0)+8|0,a,e,g,(d+(e<<3<<2)|0)+20|0);if((e+1|0)>=120){gG(d,f,e+1|0,(d+(e<<3<<2)|0)+20|0)}else{gF(d,f,e+1|0,(d+(e<<3<<2)|0)+20|0)}if((e+1|0)>=120){gG((d+(e<<1<<2)|0)+4|0,(f+(e<<2<<2)|0)+8|0,e+1|0,(d+(e<<3<<2)|0)+20|0)}else{gF((d+(e<<1<<2)|0)+4|0,(f+(e<<2<<2)|0)+8|0,e+1|0,(d+(e<<3<<2)|0)+20|0)}b=eP(f,a,e,1)|0;b=b+(eG(f,f,a+(e<<2)|0,e)|0)|0;b=(b<<1)+(eP(f,f,e,1)|0)|0;b=b+(eG(f,f,a+(e<<1<<2)|0,e)|0)|0;b=(b<<1)+(eP(f,f,e,1)|0)|0;c[f+(e<<2)>>2]=b+(eL(f,f,e,a+((e*3&-1)<<2)|0,g)|0)|0;if((e+1|0)>=120){gG((d+(e<<2<<2)|0)+8|0,f,e+1|0,(d+(e<<3<<2)|0)+20|0)}else{gF((d+(e<<2<<2)|0)+8|0,f,e+1|0,(d+(e<<3<<2)|0)+20|0)}gI(f,(f+(e<<2<<2)|0)+8|0,a,e,g,(d+(e<<3<<2)|0)+20|0);if((e+1|0)>=120){gG(f+(e<<1<<2)|0,f,e+1|0,(d+(e<<3<<2)|0)+20|0)}else{gF(f+(e<<1<<2)|0,f,e+1|0,(d+(e<<3<<2)|0)+20|0)}if((e+1|0)>=120){gG((d+((e*6&-1)<<2)|0)+12|0,(f+(e<<2<<2)|0)+8|0,e+1|0,(d+(e<<3<<2)|0)+20|0)}else{gF((d+((e*6&-1)<<2)|0)+12|0,(f+(e<<2<<2)|0)+8|0,e+1|0,(d+(e<<3<<2)|0)+20|0)}if((e|0)>=120){gG(f,a,e,(d+(e<<3<<2)|0)+20|0)}else{gF(f,a,e,(d+(e<<3<<2)|0)+20|0)}if((g|0)>=120){gG(f+((e*6&-1)<<2)|0,a+((e*3&-1)<<2)|0,g,(d+(e<<3<<2)|0)+20|0)}else{gF(f+((e*6&-1)<<2)|0,a+((e*3&-1)<<2)|0,g,(d+(e<<3<<2)|0)+20|0)}gR(f,e,0,(d+(e<<1<<2)|0)+4|0,(d+((e*6&-1)<<2)|0)+12|0,d,(d+(e<<2<<2)|0)+8|0,g<<1,(d+(e<<3<<2)|0)+20|0);return}function gI(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a;a=b;b=d;d=e;e=g;c[h+(d<<2)>>2]=eG(h,b,b+(d<<1<<2)|0,d)|0;c[e+(d<<2)>>2]=eL(e,b+(d<<2)|0,d,b+((d*3&-1)<<2)|0,f)|0;f=(fw(h,e,d+1|0)|0)<0?-1:0;if((f|0)!=0){b=a;g=e;i=h;j=d+1|0;eI(b,g,i,j)}else{j=a;a=h;i=e;g=d+1|0;eI(j,a,i,g)}eG(h,h,e,d+1|0);return f|0}function gJ(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a;a=b;b=d;d=e;e=f;f=g;g=eP(f,b+(d<<1<<2)|0,d,2)|0;c[h+(d<<2)>>2]=g+(eG(h,f,b,d)|0)|0;c[f+(e<<2)>>2]=eP(f,b+((d*3&-1)<<2)|0,e,2)|0;if((e|0)<(d|0)){c[f+(d<<2)>>2]=eL(f,b+(d<<2)|0,d,f,e+1|0)|0}else{e=eG(f,b+(d<<2)|0,f,d)|0;b=f+(d<<2)|0;c[b>>2]=(c[b>>2]|0)+e|0}eP(f,f,d+1|0,1);e=(fw(h,f,d+1|0)|0)<0?-1:0;if((e|0)!=0){b=a;g=f;i=h;j=d+1|0;eI(b,g,i,j)}else{j=a;a=h;i=f;g=d+1|0;eI(j,a,i,g)}eG(h,h,f,d+1|0);return e|0}function gK(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;c[i+(e<<2)>>2]=eG(i,d,d+(e<<1<<2)|0,e)|0;h=4;while(1){if(h>>>0>=b>>>0){break}eL(i,i,e+1|0,d+(ab(h,e)<<2)|0,e);h=h+2|0}c[g+(e<<2)>>2]=eG(g,d+(e<<2)|0,d+((e*3&-1)<<2)|0,e)|0;h=5;while(1){if(h>>>0>=b>>>0){break}eL(g,g,e+1|0,d+(ab(h,e)<<2)|0,e);h=h+2|0}if((b&1|0)!=0){h=g;j=g;k=e+1|0;l=d+(ab(b,e)<<2)|0;m=f;eL(h,j,k,l,m)}else{m=i;l=i;k=e+1|0;j=d+(ab(b,e)<<2)|0;b=f;eL(m,l,k,j,b)}b=(fw(i,g,e+1|0)|0)<0?-1:0;if((b|0)!=0){j=a;k=g;l=i;m=e+1|0;eI(j,k,l,m)}else{m=a;a=i;l=g;k=e+1|0;eI(m,a,l,k)}eG(i,i,g,e+1|0);return b|0}function gL(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=0;h=h<<2;h=h+(eP(i,d+(ab(b,e)<<2)|0,f,2)|0)|0;h=h+(eG(i,i,d+(ab(b-2|0,e)<<2)|0,f)|0)|0;if((f|0)!=(e|0)){h=eF(i+(f<<2)|0,(d+(ab(b-2|0,e)<<2)|0)+(f<<2)|0,e-f|0,h)|0}f=b-4|0;while(1){if(!((f|0)>=0)){break}h=h<<2;h=h+(eP(i,i,e,2)|0)|0;h=h+(eG(i,i,d+(ab(f,e)<<2)|0,e)|0)|0;f=f-2|0}c[i+(e<<2)>>2]=h;b=b-1|0;h=0;h=h<<2;h=h+(eP(g,d+(ab(b,e)<<2)|0,e,2)|0)|0;h=h+(eG(g,g,d+(ab(b-2|0,e)<<2)|0,e)|0)|0;f=b-4|0;while(1){if(!((f|0)>=0)){break}h=h<<2;h=h+(eP(g,g,e,2)|0)|0;h=h+(eG(g,g,d+(ab(f,e)<<2)|0,e)|0)|0;f=f-2|0}c[g+(e<<2)>>2]=h;if((b&1|0)!=0){h=g;f=g;d=e+1|0;eP(h,f,d,1)}else{d=i;f=i;h=e+1|0;eP(d,f,h,1)}h=(fw(i,g,e+1|0)|0)<0?-1:0;if((h|0)!=0){f=a;d=g;j=i;k=e+1|0;eI(f,d,j,k)}else{k=a;a=i;j=g;d=e+1|0;eI(k,a,j,d)}eG(i,i,g,e+1|0);h=h^(b&1)-1;return h|0}function gM(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0;j=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;c[j+(e<<2)>>2]=eP(h,d+(e<<1<<2)|0,e,g<<1)|0;i=eG(j,d,h,e)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+i|0;i=4;while(1){if(i>>>0>=b>>>0){break}k=d+(ab(i,e)<<2)|0;l=eP(h,k,e,ab(i,g))|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+l|0;l=eG(j,j,h,e)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+l|0;i=i+2|0}c[h+(e<<2)>>2]=eP(h,d+(e<<2)|0,e,g)|0;i=3;while(1){if(i>>>0>=b>>>0){break}l=d+(ab(i,e)<<2)|0;k=eP(a,l,e,ab(i,g))|0;l=h+(e<<2)|0;c[l>>2]=(c[l>>2]|0)+k|0;k=eG(h,h,a,e)|0;l=h+(e<<2)|0;c[l>>2]=(c[l>>2]|0)+k|0;i=i+2|0}i=d+(ab(b,e)<<2)|0;c[a+(f<<2)>>2]=eP(a,i,f,ab(b,g))|0;if((b&1|0)!=0){b=h;g=h;i=e+1|0;d=a;k=f+1|0;eL(b,g,i,d,k)}else{k=j;d=j;i=e+1|0;g=a;b=f+1|0;eL(k,d,i,g,b)}b=(fw(j,h,e+1|0)|0)<0?-1:0;if((b|0)!=0){g=a;i=h;d=j;k=e+1|0;eI(g,i,d,k)}else{k=a;a=j;d=h;i=e+1|0;eI(k,a,d,i)}eG(j,j,h,e+1|0);return b|0}function gN(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0;j=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;c[j+(e<<2)>>2]=eP(j,d,e,ab(g,b))|0;c[h+(e<<2)>>2]=eP(h,d+(e<<2)|0,e,ab(g,b-1|0))|0;if((b&1|0)!=0){i=h;k=h;l=e+1|0;m=d+(ab(e,b)<<2)|0;n=f;eL(i,k,l,m,n);n=gO(j,d+(ab(e,b-1|0)<<2)|0,e,g,a)|0;m=j+(e<<2)|0;c[m>>2]=(c[m>>2]|0)+n|0}else{n=j;m=j;l=e+1|0;k=d+(ab(e,b)<<2)|0;i=f;eL(n,m,l,k,i)}i=2;while(1){if(i>>>0>=(b-1|0)>>>0){break}k=d+(ab(e,i)<<2)|0;l=gO(j,k,e,ab(g,b-i|0),a)|0;k=j+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+l|0;i=i+1|0;l=d+(ab(e,i)<<2)|0;k=gO(h,l,e,ab(g,b-i|0),a)|0;l=h+(e<<2)|0;c[l>>2]=(c[l>>2]|0)+k|0;i=i+1|0}i=(fw(j,h,e+1|0)|0)<0?-1:0;if((i|0)!=0){b=a;g=h;d=j;k=e+1|0;eI(b,g,d,k);k=j;d=j;g=h;b=e;l=b+1|0;m=eG(k,d,g,l)|0;n=i;return n|0}else{f=a;a=j;o=h;p=e+1|0;eI(f,a,o,p);k=j;d=j;g=h;b=e;l=b+1|0;m=eG(k,d,g,l)|0;n=i;return n|0}return 0}function gO(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=eP(c,b,a,d)|0;return e+(eG(f,f,c,a)|0)|0}function gP(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=d+d|0;j=h+1|0;k=i+(d<<2)|0;l=k+(d<<2)|0;m=l+(d<<2)|0;n=m+(d<<2)|0;if((f|0)!=0){o=a;p=a;q=b;r=j;eG(o,p,q,r)}else{r=a;q=a;p=b;o=j;eI(r,q,p,o)}if((f|0)!=0){f=b;o=l;p=b;q=j;eG(f,o,p,q);q=b;p=b;o=j;eQ(q,p,o,1)}else{o=b;p=l;q=b;f=j;eI(o,p,q,f);f=b;q=b;p=j;eQ(f,q,p,1)}p=eI(l,l,i,h)|0;h=n|0;c[h>>2]=(c[h>>2]|0)-p|0;eI(a,a,l,j);eQ(a,a,j,1);eI(l,l,b,j);p=eG(k,k,b,j)|0;h=m+4|0;i=(c[h>>2]|0)+p|0;c[h>>2]=i;if(i>>>0<p>>>0){while(1){i=h+4|0;h=i;q=(c[i>>2]|0)+1|0;c[i>>2]=q;if((q|0)!=0){break}}}h=c[n>>2]|0;c[n>>2]=g;p=eP(b,n,e,1)|0;p=p+(eI(a,a,b,e)|0)|0;b=a+(e<<2)|0;q=c[b>>2]|0;c[b>>2]=q-p|0;if(q>>>0<p>>>0){while(1){q=b+4|0;b=q;i=c[q>>2]|0;c[q>>2]=i-1|0;if((i|0)!=0){break}}}if((((e|0)>(d+1|0)&1|0)!=0&1|0)!=0){p=eG(n,n,a+(d<<2)|0,d+1|0)|0;b=m+(j<<2)|0;j=(c[b>>2]|0)+p|0;c[b>>2]=j;if(j>>>0<p>>>0){while(1){j=b+4|0;b=j;i=(c[j>>2]|0)+1|0;c[j>>2]=i;if((i|0)!=0){break}}}}else{eG(n,n,a+(d<<2)|0,e)}p=eI(l,l,n,e)|0;g=c[n>>2]|0;c[n>>2]=h;h=l+(e<<2)|0;e=c[h>>2]|0;c[h>>2]=e-p|0;if(e>>>0<p>>>0){while(1){e=h+4|0;h=e;b=c[e>>2]|0;c[e>>2]=b-1|0;if((b|0)!=0){break}}}p=eI(k,k,a,d)|0;k=l;l=c[k>>2]|0;c[k>>2]=l-p|0;if(l>>>0<p>>>0){while(1){l=k+4|0;k=l;h=c[l>>2]|0;c[l>>2]=h-1|0;if((h|0)!=0){break}}}p=eG(m,m,a,d)|0;d=n|0;c[d>>2]=(c[d>>2]|0)+p|0;p=n;n=(c[p>>2]|0)+g|0;c[p>>2]=n;if(n>>>0<g>>>0){while(1){g=p+4|0;p=g;n=(c[g>>2]|0)+1|0;c[g>>2]=n;if((n|0)!=0){break}}}return}function gQ(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;if((b&2|0)!=0){h=e;j=f;k=e;l=(a<<1)+1|0;eG(h,j,k,l)}else{l=e;k=f;j=e;h=(a<<1)+1|0;eI(l,k,j,h)}eQ(e,e,(a<<1)+1|0,2);h=eI(f,f,i,a<<1)|0;j=f+(a<<1<<2)|0;c[j>>2]=(c[j>>2]|0)-h|0;eQ(f,f,(a<<1)+1|0,1);eI(f,f,e,(a<<1)+1|0);eQ(f,f,(a<<1)+1|0,1);if((b&1|0)!=0){b=d;h=i+(a<<1<<2)|0;j=d;k=(a<<1)+1|0;eG(b,h,j,k);k=d;j=d;h=(a<<1)+1|0;eQ(k,j,h,1)}else{h=d;j=i+(a<<1<<2)|0;k=d;b=(a<<1)+1|0;eI(h,j,k,b);b=d;k=d;j=(a<<1)+1|0;eQ(b,k,j,1)}eI(e,e,d,(a<<1)+1|0);eI(i+(a<<1<<2)|0,i+(a<<1<<2)|0,d,(a<<1)+1|0);j=eI(i+(a<<1<<2)|0,i+(a<<1<<2)|0,i,a<<1)|0;k=(i+(a<<1<<2)|0)+(a<<1<<2)|0;c[k>>2]=(c[k>>2]|0)-j|0;eI(f,f,i+(a<<1<<2)|0,(a<<1)+1|0);j=eG(i+(a<<2)|0,i+(a<<2)|0,d,(a<<1)+1|0)|0;k=(i+((a*3&-1)<<2)|0)+4|0;b=(c[k>>2]|0)+j|0;c[k>>2]=b;if(b>>>0<j>>>0){while(1){b=k+4|0;k=b;h=(c[b>>2]|0)+1|0;c[b>>2]=h;if((h|0)!=0){break}}}j=eP(d,i+((a*5&-1)<<2)|0,g,2)|0;j=j+(eI(e,e,d,g)|0)|0;d=e+(g<<2)|0;k=c[d>>2]|0;c[d>>2]=k-j|0;if(k>>>0<j>>>0){while(1){k=d+4|0;d=k;h=c[k>>2]|0;c[k>>2]=h-1|0;if((h|0)!=0){break}}}j=eI(i+(a<<2)|0,i+(a<<2)|0,e,a)|0;d=i+(a<<1<<2)|0;h=c[d>>2]|0;c[d>>2]=h-j|0;if(h>>>0<j>>>0){while(1){h=d+4|0;d=h;k=c[h>>2]|0;c[h>>2]=k-1|0;if((k|0)!=0){break}}}d=c[(i+(a<<1<<2)|0)+(a<<1<<2)>>2]|0;k=d+(eG(i+((a*3&-1)<<2)|0,i+((a*3&-1)<<2)|0,e,a)|0)|0;d=c[e+(a<<1<<2)>>2]|0;j=d+(eG(i+(a<<2<<2)|0,f,e+(a<<2)|0,a)|0)|0;e=f+(a<<2)|0;d=(c[e>>2]|0)+j|0;c[e>>2]=d;if(d>>>0<j>>>0){while(1){d=e+4|0;e=d;h=(c[d>>2]|0)+1|0;c[d>>2]=h;if((h|0)!=0){break}}}if((((g|0)>(a|0)&1|0)!=0&1|0)!=0){e=c[f+(a<<1<<2)>>2]|0;m=e+(eG(i+((a*5&-1)<<2)|0,i+((a*5&-1)<<2)|0,f+(a<<2)|0,a)|0)|0}else{m=eG(i+((a*5&-1)<<2)|0,i+((a*5&-1)<<2)|0,f+(a<<2)|0,g)|0}j=eI(i+(a<<1<<2)|0,i+(a<<1<<2)|0,i+(a<<2<<2)|0,a+g|0)|0;f=(c[(i+((a*5&-1)<<2)|0)+(g-1<<2)>>2]|0)-1|0;c[(i+((a*5&-1)<<2)|0)+(g-1<<2)>>2]=1;if((((g|0)>(a|0)&1|0)!=0&1|0)==0){e=i+(a<<2<<2)|0;h=(c[e>>2]|0)+k|0;c[e>>2]=h;if(h>>>0<k>>>0){while(1){h=e+4|0;e=h;d=(c[h>>2]|0)+1|0;c[h>>2]=d;if((d|0)!=0){break}}}e=(i+((a*3&-1)<<2)|0)+(g<<2)|0;d=c[e>>2]|0;c[e>>2]=d-(j+m|0)|0;if(d>>>0<(j+m|0)>>>0){while(1){d=e+4|0;e=d;h=c[d>>2]|0;c[d>>2]=h-1|0;if((h|0)!=0){break}}}n=f;o=g;p=o-1|0;q=i;r=a;s=r*5&-1;t=q+(s<<2)|0;u=t+(p<<2)|0;v=c[u>>2]|0;w=v+n|0;c[u>>2]=w;return}if(k>>>0>m>>>0){e=i+(a<<2<<2)|0;h=(c[e>>2]|0)+(k-m|0)|0;c[e>>2]=h;if(h>>>0<(k-m|0)>>>0){while(1){h=e+4|0;e=h;d=(c[h>>2]|0)+1|0;c[h>>2]=d;if((d|0)!=0){break}}}}else{e=i+(a<<2<<2)|0;d=c[e>>2]|0;c[e>>2]=d-(m-k|0)|0;if(d>>>0<(m-k|0)>>>0){while(1){k=e+4|0;e=k;d=c[k>>2]|0;c[k>>2]=d-1|0;if((d|0)!=0){break}}}}e=(i+((a*3&-1)<<2)|0)+(g<<2)|0;d=c[e>>2]|0;c[e>>2]=d-j|0;if(d>>>0<j>>>0){while(1){j=e+4|0;e=j;d=c[j>>2]|0;c[j>>2]=d-1|0;if((d|0)!=0){break}}}e=(i+((a*5&-1)<<2)|0)+(a<<2)|0;d=(c[e>>2]|0)+m|0;c[e>>2]=d;if(d>>>0<m>>>0){while(1){m=e+4|0;e=m;d=(c[m>>2]|0)+1|0;c[m>>2]=d;if((d|0)!=0){break}}}n=f;o=g;p=o-1|0;q=i;r=a;s=r*5&-1;t=q+(s<<2)|0;u=t+(p<<2)|0;v=c[u>>2]|0;w=v+n|0;c[u>>2]=w;return}function gR(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=(a<<1)+1|0;eG(g,g,f,j);if((b&1|0)!=0){l=d;m=d;n=f;o=j;eG(l,m,n,o);o=d;n=d;m=j;eQ(o,n,m,1)}else{m=d;n=f;o=d;l=j;eI(m,n,o,l);l=d;o=d;n=j;eQ(l,o,n,1)}eM(f,f,j,k,a<<1);eI(f,f,d,j);eQ(f,f,j,2);c[i+(h<<2)>>2]=eP(i,k+((a*6&-1)<<2)|0,h,4)|0;eM(f,f,j,i,h+1|0);if((b&2|0)!=0){b=e;n=e;o=k+(a<<1<<2)|0;l=j;eG(b,n,o,l);l=e;o=e;n=j;eQ(l,o,n,1)}else{n=e;o=k+(a<<1<<2)|0;l=e;b=j;eI(n,o,l,b);b=e;l=e;o=j;eQ(b,l,o,1)}eI(k+(a<<1<<2)|0,k+(a<<1<<2)|0,e,j);eO(g,k+(a<<1<<2)|0,j,65);eM(k+(a<<1<<2)|0,k+(a<<1<<2)|0,j,k+((a*6&-1)<<2)|0,h);eM(k+(a<<1<<2)|0,k+(a<<1<<2)|0,j,k,a<<1);eN(g,k+(a<<1<<2)|0,j,45);eQ(g,g,j,1);eI(f,f,k+(a<<1<<2)|0,j);eI(k+(a<<1<<2)|0,k+(a<<1<<2)|0,f,j);eI(d,g,d,j);eP(i,e,j,3);eI(g,g,i,j);eR(g,g,j,9);eI(e,e,g,j);eG(d,d,g,j);eQ(d,d,j,1);eI(g,g,d,j);i=eG(k+(a<<2)|0,k+(a<<2)|0,d,j)|0;j=((k+(a<<1<<2)|0)+(a<<2)|0)+4|0;d=(c[j>>2]|0)+i|0;c[j>>2]=d;if(d>>>0<i>>>0){while(1){d=j+4|0;j=d;o=(c[d>>2]|0)+1|0;c[d>>2]=o;if((o|0)!=0){break}}}i=eG(k+((a*3&-1)<<2)|0,k+((a*3&-1)<<2)|0,e,a)|0;j=e+(a<<2)|0;o=(c[j>>2]|0)+((c[(k+(a<<1<<2)|0)+(a<<1<<2)>>2]|0)+i|0)|0;c[j>>2]=o;if(o>>>0<((c[(k+(a<<1<<2)|0)+(a<<1<<2)>>2]|0)+i|0)>>>0){while(1){o=j+4|0;j=o;d=(c[o>>2]|0)+1|0;c[o>>2]=d;if((d|0)!=0){break}}}i=eG(k+(a<<2<<2)|0,e+(a<<2)|0,f,a)|0;j=f+(a<<2)|0;d=(c[j>>2]|0)+((c[e+(a<<1<<2)>>2]|0)+i|0)|0;c[j>>2]=d;if(d>>>0<((c[e+(a<<1<<2)>>2]|0)+i|0)>>>0){while(1){e=j+4|0;j=e;d=(c[e>>2]|0)+1|0;c[e>>2]=d;if((d|0)!=0){break}}}i=eG(k+((a*5&-1)<<2)|0,f+(a<<2)|0,g,a)|0;j=g+(a<<2)|0;d=(c[j>>2]|0)+((c[f+(a<<1<<2)>>2]|0)+i|0)|0;c[j>>2]=d;if(d>>>0<((c[f+(a<<1<<2)>>2]|0)+i|0)>>>0){while(1){i=j+4|0;j=i;f=(c[i>>2]|0)+1|0;c[i>>2]=f;if((f|0)!=0){break}}}if((h|0)>(a+1|0)){j=k+((a*6&-1)<<2)|0;f=k+((a*6&-1)<<2)|0;i=h;d=g+(a<<2)|0;e=a+1|0;eL(j,f,i,d,e);return}else{e=k+((a*6&-1)<<2)|0;d=k+((a*6&-1)<<2)|0;k=g+(a<<2)|0;a=h;eG(e,d,k,a);return}}function gS(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=a;a=b;b=d;d=e;e=f;f=g;g=h+((a*3&-1)<<2)|0;i=h+((a*7&-1)<<2)|0;j=b+(a<<2)|0;k=c[j>>2]|0;c[j>>2]=k-((c[h>>2]|0)>>>4)|0;if(k>>>0<(c[h>>2]|0)>>>4>>>0){while(1){k=j+4|0;j=k;l=c[k>>2]|0;c[k>>2]=l-1|0;if((l|0)!=0){break}}}j=gT(b+(a<<2)|0,h+4|0,(a<<1)-1|0,28,f)|0;l=((b+(a<<2)|0)+(a<<1<<2)|0)-4|0;k=c[l>>2]|0;c[l>>2]=k-j|0;if(k>>>0<j>>>0){while(1){j=l+4|0;l=j;k=c[j>>2]|0;c[j>>2]=k-1|0;if((k|0)!=0){break}}}l=gT(b,i,e,12,f)|0;k=b+(e<<2)|0;j=c[k>>2]|0;c[k>>2]=j-l|0;if(j>>>0<l>>>0){while(1){j=k+4|0;k=j;m=c[j>>2]|0;c[j>>2]=m-1|0;if((m|0)!=0){break}}}k=g+(a<<2)|0;m=c[k>>2]|0;c[k>>2]=m-((c[h>>2]|0)>>>2)|0;if(m>>>0<(c[h>>2]|0)>>>2>>>0){while(1){m=k+4|0;k=m;j=c[m>>2]|0;c[m>>2]=j-1|0;if((j|0)!=0){break}}}k=gT(g+(a<<2)|0,h+4|0,(a<<1)-1|0,30,f)|0;j=((g+(a<<2)|0)+(a<<1<<2)|0)-4|0;m=c[j>>2]|0;c[j>>2]=m-k|0;if(m>>>0<k>>>0){while(1){k=j+4|0;j=k;m=c[k>>2]|0;c[k>>2]=m-1|0;if((m|0)!=0){break}}}l=gT(g,i,e,6,f)|0;j=g+(e<<2)|0;m=c[j>>2]|0;c[j>>2]=m-l|0;if(m>>>0<l>>>0){while(1){m=j+4|0;j=m;k=c[m>>2]|0;c[m>>2]=k-1|0;if((k|0)!=0){break}}}j=eI(d+(a<<2)|0,d+(a<<2)|0,h,a<<1)|0;k=d+((a*3&-1)<<2)|0;c[k>>2]=(c[k>>2]|0)-j|0;l=eI(d,d,i,e)|0;i=d+(e<<2)|0;j=c[i>>2]|0;c[i>>2]=j-l|0;if(j>>>0<l>>>0){while(1){j=i+4|0;i=j;k=c[j>>2]|0;c[j>>2]=k-1|0;if((k|0)!=0){break}}}eI(b,b,g,(a*3&-1)+1|0);eQ(b,b,(a*3&-1)+1|0,2);eI(g,g,d,(a*3&-1)+1|0);eI(b,b,g,(a*3&-1)+1|0);eR(b,b,(a*3&-1)+1|0,45);gT(g,b,(a*3&-1)+1|0,2,f);l=eG(h+(a<<2)|0,h+(a<<2)|0,d,a)|0;l=l-(eI(h+(a<<2)|0,h+(a<<2)|0,g,a)|0)|0;if(0>(l|0)){f=d+(a<<2)|0;while(1){i=f;f=i+4|0;k=c[i>>2]|0;c[i>>2]=k-1|0;if((k|0)!=0){break}}}else{f=d+(a<<2)|0;k=(c[f>>2]|0)+l|0;c[f>>2]=k;if(k>>>0<l>>>0){while(1){k=f+4|0;f=k;i=(c[k>>2]|0)+1|0;c[k>>2]=i;if((i|0)!=0){break}}}}l=eI(h+(a<<1<<2)|0,d+(a<<2)|0,g+(a<<2)|0,a)|0;f=d+(a<<1<<2)|0;i=c[f>>2]|0;c[f>>2]=i-l|0;if(i>>>0<l>>>0){while(1){i=f+4|0;f=i;k=c[i>>2]|0;c[i>>2]=k-1|0;if((k|0)!=0){break}}}l=eG(h+((a*3&-1)<<2)|0,g,d+(a<<1<<2)|0,a+1|0)|0;d=eG(g+(a<<1<<2)|0,g+(a<<1<<2)|0,b,a)|0;f=g+((a*3&-1)<<2)|0;c[f>>2]=(c[f>>2]|0)+d|0;l=l-(eI(h+((a*3&-1)<<2)|0,h+((a*3&-1)<<2)|0,g+(a<<1<<2)|0,a+1|0)|0)|0;if(((0>(l|0)&1|0)!=0&1|0)!=0){d=(g+(a<<2)|0)+4|0;while(1){f=d;d=f+4|0;k=c[f>>2]|0;c[f>>2]=k-1|0;if((k|0)!=0){break}}}else{d=(g+(a<<2)|0)+4|0;k=(c[d>>2]|0)+l|0;c[d>>2]=k;if(k>>>0<l>>>0){while(1){k=d+4|0;d=k;f=(c[k>>2]|0)+1|0;c[k>>2]=f;if((f|0)!=0){break}}}}eI(h+(a<<2<<2)|0,g+(a<<2)|0,b+(a<<2)|0,(a<<1)+1|0);l=eF(h+((a*6&-1)<<2)|0,b+(a<<2)|0,a,c[h+((a*6&-1)<<2)>>2]|0)|0;g=b+(a<<1<<2)|0;d=(c[g>>2]|0)+l|0;c[g>>2]=d;if(d>>>0<l>>>0){while(1){d=g+4|0;g=d;f=(c[d>>2]|0)+1|0;c[d>>2]=f;if((f|0)!=0){break}}}l=eG(h+((a*7&-1)<<2)|0,h+((a*7&-1)<<2)|0,b+(a<<1<<2)|0,a)|0;if((((e|0)!=(a|0)&1|0)!=0&1|0)==0){return}e=h+(a<<3<<2)|0;h=(c[e>>2]|0)+(l+(c[b+((a*3&-1)<<2)>>2]|0)|0)|0;c[e>>2]=h;if(h>>>0<(l+(c[b+((a*3&-1)<<2)>>2]|0)|0)>>>0){while(1){a=e+4|0;e=a;b=(c[a>>2]|0)+1|0;c[a>>2]=b;if((b|0)!=0){break}}}return}function gT(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=eP(c,b,a,d)|0;return e+(eI(f,f,c,a)|0)|0}function gU(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0;j=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=e*3&-1;k=i+1|0;if((g|0)!=0){l=eI(b,b,j+((e*11&-1)<<2)|0,f)|0;m=b+(f<<2)|0;n=c[m>>2]|0;c[m>>2]=n-l|0;if(n>>>0<l>>>0){while(1){n=m+4|0;m=n;o=c[n>>2]|0;c[n>>2]=o-1|0;if((o|0)!=0){break}}}l=gV(j+((e*7&-1)<<2)|0,j+((e*11&-1)<<2)|0,f,10,h)|0;m=(j+((e*7&-1)<<2)|0)+(f<<2)|0;o=c[m>>2]|0;c[m>>2]=o-l|0;if(o>>>0<l>>>0){while(1){o=m+4|0;m=o;n=c[o>>2]|0;c[o>>2]=n-1|0;if((n|0)!=0){break}}}m=d;n=c[m>>2]|0;c[m>>2]=n-((c[j+((e*11&-1)<<2)>>2]|0)>>>2)|0;if(n>>>0<(c[j+((e*11&-1)<<2)>>2]|0)>>>2>>>0){while(1){n=m+4|0;m=n;o=c[n>>2]|0;c[n>>2]=o-1|0;if((o|0)!=0){break}}}m=gV(d,(j+((e*11&-1)<<2)|0)+4|0,f-1|0,30,h)|0;o=(d+(f<<2)|0)-4|0;n=c[o>>2]|0;c[o>>2]=n-m|0;if(n>>>0<m>>>0){while(1){m=o+4|0;o=m;n=c[m>>2]|0;c[m>>2]=n-1|0;if((n|0)!=0){break}}}l=gV(a,j+((e*11&-1)<<2)|0,f,20,h)|0;o=a+(f<<2)|0;n=c[o>>2]|0;c[o>>2]=n-l|0;if(n>>>0<l>>>0){while(1){n=o+4|0;o=n;m=c[n>>2]|0;c[n>>2]=m-1|0;if((m|0)!=0){break}}}o=j+(i<<2)|0;m=c[o>>2]|0;c[o>>2]=m-((c[j+((e*11&-1)<<2)>>2]|0)>>>4)|0;if(m>>>0<(c[j+((e*11&-1)<<2)>>2]|0)>>>4>>>0){while(1){m=o+4|0;o=m;n=c[m>>2]|0;c[m>>2]=n-1|0;if((n|0)!=0){break}}}o=gV(j+(i<<2)|0,(j+((e*11&-1)<<2)|0)+4|0,f-1|0,28,h)|0;n=((j+(i<<2)|0)+(f<<2)|0)-4|0;m=c[n>>2]|0;c[n>>2]=m-o|0;if(m>>>0<o>>>0){while(1){o=n+4|0;n=o;m=c[o>>2]|0;c[o>>2]=m-1|0;if((m|0)!=0){break}}}}n=gV((j+(i<<2)|0)+(e<<2)|0,j,e<<1,20,h)|0;m=(j+(i<<2)|0)+(i<<2)|0;c[m>>2]=(c[m>>2]|0)-n|0;n=a+(e<<2)|0;m=c[n>>2]|0;c[n>>2]=m-((c[j>>2]|0)>>>4)|0;if(m>>>0<(c[j>>2]|0)>>>4>>>0){while(1){m=n+4|0;n=m;o=c[m>>2]|0;c[m>>2]=o-1|0;if((o|0)!=0){break}}}n=gV(a+(e<<2)|0,j+4|0,(e<<1)-1|0,28,h)|0;o=((a+(e<<2)|0)+(e<<1<<2)|0)-4|0;m=c[o>>2]|0;c[o>>2]=m-n|0;if(m>>>0<n>>>0){while(1){n=o+4|0;o=n;m=c[n>>2]|0;c[n>>2]=m-1|0;if((m|0)!=0){break}}}eG(h,a,j+(i<<2)|0,k);eI(j+(i<<2)|0,j+(i<<2)|0,a,k);o=a;a=h;h=o;o=gV(d+(e<<2)|0,j,e<<1,10,h)|0;m=d+(i<<2)|0;c[m>>2]=(c[m>>2]|0)-o|0;o=(j+((e*7&-1)<<2)|0)+(e<<2)|0;m=c[o>>2]|0;c[o>>2]=m-((c[j>>2]|0)>>>2)|0;if(m>>>0<(c[j>>2]|0)>>>2>>>0){while(1){m=o+4|0;o=m;n=c[m>>2]|0;c[m>>2]=n-1|0;if((n|0)!=0){break}}}o=gV((j+((e*7&-1)<<2)|0)+(e<<2)|0,j+4|0,(e<<1)-1|0,30,h)|0;n=(((j+((e*7&-1)<<2)|0)+(e<<2)|0)+(e<<1<<2)|0)-4|0;m=c[n>>2]|0;c[n>>2]=m-o|0;if(m>>>0<o>>>0){while(1){o=n+4|0;n=o;m=c[o>>2]|0;c[o>>2]=m-1|0;if((m|0)!=0){break}}}eI(h,d,j+((e*7&-1)<<2)|0,k);eG(j+((e*7&-1)<<2)|0,j+((e*7&-1)<<2)|0,d,k);n=d;d=h;h=n;n=eI(b+(e<<2)|0,b+(e<<2)|0,j,e<<1)|0;m=b+(i<<2)|0;c[m>>2]=(c[m>>2]|0)-n|0;eO(j+(i<<2)|0,d,k,257);eR(j+(i<<2)|0,j+(i<<2)|0,k,11340);if((c[(j+(i<<2)|0)+(i<<2)>>2]&-536870912|0)!=0){n=(j+(i<<2)|0)+(i<<2)|0;c[n>>2]=c[n>>2]|-1073741824}eN(d,j+(i<<2)|0,k,60);gV(j+((e*7&-1)<<2)|0,b,k,5,h);eO(a,j+((e*7&-1)<<2)|0,k,100);gV(a,b,k,9,h);eR(a,a,k,42525);eO(j+((e*7&-1)<<2)|0,a,k,225);eR(j+((e*7&-1)<<2)|0,j+((e*7&-1)<<2)|0,k,36);eI(b,b,j+((e*7&-1)<<2)|0,k);eI(j+(i<<2)|0,j+((e*7&-1)<<2)|0,j+(i<<2)|0,k);eQ(j+(i<<2)|0,j+(i<<2)|0,k,1);eI(j+((e*7&-1)<<2)|0,j+((e*7&-1)<<2)|0,j+(i<<2)|0,k);eG(d,d,a,k);eQ(d,d,k,1);eI(b,b,a,k);eI(a,a,d,k);l=eG(j+(e<<2)|0,j+(e<<2)|0,d,e)|0;l=eF(j+(e<<1<<2)|0,d+(e<<2)|0,e,l)|0;k=d+(e<<1<<2)|0;h=(c[k>>2]|0)+l|0;c[k>>2]=h;if(h>>>0<l>>>0){while(1){h=k+4|0;k=h;n=(c[h>>2]|0)+1|0;c[h>>2]=n;if((n|0)!=0){break}}}k=c[d+(i<<2)>>2]|0;l=k+(eG(j+(i<<2)|0,j+(i<<2)|0,d+(e<<1<<2)|0,e)|0)|0;d=(j+(i<<2)|0)+(e<<2)|0;k=(c[d>>2]|0)+l|0;c[d>>2]=k;if(k>>>0<l>>>0){while(1){k=d+4|0;d=k;n=(c[k>>2]|0)+1|0;c[k>>2]=n;if((n|0)!=0){break}}}d=eG(j+((e*5&-1)<<2)|0,j+((e*5&-1)<<2)|0,b,e)|0;n=j+(i<<1<<2)|0;c[n>>2]=(c[n>>2]|0)+d|0;l=eF(j+(i<<1<<2)|0,b+(e<<2)|0,e,c[j+(i<<1<<2)>>2]|0)|0;d=b+(e<<1<<2)|0;n=(c[d>>2]|0)+l|0;c[d>>2]=n;if(n>>>0<l>>>0){while(1){n=d+4|0;d=n;k=(c[n>>2]|0)+1|0;c[n>>2]=k;if((k|0)!=0){break}}}d=c[b+(i<<2)>>2]|0;l=d+(eG(j+((e*7&-1)<<2)|0,j+((e*7&-1)<<2)|0,b+(e<<1<<2)|0,e)|0)|0;b=j+(e<<3<<2)|0;d=(c[b>>2]|0)+l|0;c[b>>2]=d;if(d>>>0<l>>>0){while(1){d=b+4|0;b=d;k=(c[d>>2]|0)+1|0;c[d>>2]=k;if((k|0)!=0){break}}}b=eG(j+((e*9&-1)<<2)|0,j+((e*9&-1)<<2)|0,a,e)|0;k=j+((e*10&-1)<<2)|0;c[k>>2]=(c[k>>2]|0)+b|0;if((g|0)==0){g=j+((e*10&-1)<<2)|0;b=a+(e<<2)|0;k=f;d=c[j+((e*10&-1)<<2)>>2]|0;eF(g,b,k,d);return}l=eF(j+((e*10&-1)<<2)|0,a+(e<<2)|0,e,c[j+((e*10&-1)<<2)>>2]|0)|0;d=a+(e<<1<<2)|0;k=(c[d>>2]|0)+l|0;c[d>>2]=k;if(k>>>0<l>>>0){while(1){k=d+4|0;d=k;b=(c[k>>2]|0)+1|0;c[k>>2]=b;if((b|0)!=0){break}}}if((((f|0)>(e|0)&1|0)!=0&1|0)!=0){d=c[a+(i<<2)>>2]|0;l=d+(eG(j+((e*11&-1)<<2)|0,j+((e*11&-1)<<2)|0,a+(e<<1<<2)|0,e)|0)|0;d=j+(i<<2<<2)|0;i=(c[d>>2]|0)+l|0;c[d>>2]=i;if(i>>>0<l>>>0){while(1){l=d+4|0;d=l;i=(c[l>>2]|0)+1|0;c[l>>2]=i;if((i|0)!=0){break}}}}else{eG(j+((e*11&-1)<<2)|0,j+((e*11&-1)<<2)|0,a+(e<<1<<2)|0,f)}return}function gV(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=eP(c,b,a,d)|0;return e+(eI(f,f,c,a)|0)|0}function gW(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;k=a;a=b;b=d;d=e;e=f;f=g;g=h;h=i;i=j;j=f*3&-1;l=j+1|0;if((h|0)!=0){m=eI(k+((f*7&-1)<<2)|0,k+((f*7&-1)<<2)|0,k+((f*15&-1)<<2)|0,g)|0;n=(k+((f*7&-1)<<2)|0)+(g<<2)|0;o=c[n>>2]|0;c[n>>2]=o-m|0;if(o>>>0<m>>>0){while(1){o=n+4|0;n=o;p=c[o>>2]|0;c[o>>2]=p-1|0;if((p|0)!=0){break}}}m=gX(b,k+((f*15&-1)<<2)|0,g,14,i)|0;n=b+(g<<2)|0;p=c[n>>2]|0;c[n>>2]=p-m|0;if(p>>>0<m>>>0){while(1){p=n+4|0;n=p;o=c[p>>2]|0;c[p>>2]=o-1|0;if((o|0)!=0){break}}}n=k+(j<<2)|0;o=c[n>>2]|0;c[n>>2]=o-((c[k+((f*15&-1)<<2)>>2]|0)>>>2)|0;if(o>>>0<(c[k+((f*15&-1)<<2)>>2]|0)>>>2>>>0){while(1){o=n+4|0;n=o;p=c[o>>2]|0;c[o>>2]=p-1|0;if((p|0)!=0){break}}}n=gX(k+(j<<2)|0,(k+((f*15&-1)<<2)|0)+4|0,g-1|0,30,i)|0;p=((k+(j<<2)|0)+(g<<2)|0)-4|0;o=c[p>>2]|0;c[p>>2]=o-n|0;if(o>>>0<n>>>0){while(1){n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1|0;if((o|0)!=0){break}}}m=gX(k+((f*11&-1)<<2)|0,k+((f*15&-1)<<2)|0,g,28,i)|0;p=(k+((f*11&-1)<<2)|0)+(g<<2)|0;o=c[p>>2]|0;c[p>>2]=o-m|0;if(o>>>0<m>>>0){while(1){o=p+4|0;p=o;n=c[o>>2]|0;c[o>>2]=n-1|0;if((n|0)!=0){break}}}p=d;n=c[p>>2]|0;c[p>>2]=n-((c[k+((f*15&-1)<<2)>>2]|0)>>>4)|0;if(n>>>0<(c[k+((f*15&-1)<<2)>>2]|0)>>>4>>>0){while(1){n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1|0;if((o|0)!=0){break}}}p=gX(d,(k+((f*15&-1)<<2)|0)+4|0,g-1|0,28,i)|0;o=(d+(g<<2)|0)-4|0;n=c[o>>2]|0;c[o>>2]=n-p|0;if(n>>>0<p>>>0){while(1){p=o+4|0;o=p;n=c[p>>2]|0;c[p>>2]=n-1|0;if((n|0)!=0){break}}}m=gX(a+4|0,k+((f*15&-1)<<2)|0,g,10,i)|0;m=eH((a+(g<<2)|0)+4|0,(a+(g<<2)|0)+4|0,(l-g|0)-1|0,m)|0;m=c[e+(l<<2)>>2]|0;c[e+(l<<2)>>2]=128;o=e;n=c[o>>2]|0;c[o>>2]=n-((c[k+((f*15&-1)<<2)>>2]|0)>>>6)|0;if(n>>>0<(c[k+((f*15&-1)<<2)>>2]|0)>>>6>>>0){while(1){n=o+4|0;o=n;p=c[n>>2]|0;c[n>>2]=p-1|0;if((p|0)!=0){break}}}o=gX(e,(k+((f*15&-1)<<2)|0)+4|0,g-1|0,26,i)|0;p=(e+(g<<2)|0)-4|0;n=c[p>>2]|0;c[p>>2]=n-o|0;if(n>>>0<o>>>0){while(1){o=p+4|0;p=o;n=c[o>>2]|0;c[o>>2]=n-1|0;if((n|0)!=0){break}}}c[e+(l<<2)>>2]=m}p=gX(d+(f<<2)|0,k,f<<1,28,i)|0;n=d+(j<<2)|0;c[n>>2]=(c[n>>2]|0)-p|0;p=(k+((f*11&-1)<<2)|0)+(f<<2)|0;n=c[p>>2]|0;c[p>>2]=n-((c[k>>2]|0)>>>4)|0;if(n>>>0<(c[k>>2]|0)>>>4>>>0){while(1){n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1|0;if((o|0)!=0){break}}}p=gX((k+((f*11&-1)<<2)|0)+(f<<2)|0,k+4|0,(f<<1)-1|0,28,i)|0;o=(((k+((f*11&-1)<<2)|0)+(f<<2)|0)+(f<<1<<2)|0)-4|0;n=c[o>>2]|0;c[o>>2]=n-p|0;if(n>>>0<p>>>0){while(1){p=o+4|0;o=p;n=c[p>>2]|0;c[p>>2]=n-1|0;if((n|0)!=0){break}}}eI(i,d,k+((f*11&-1)<<2)|0,l);eG(k+((f*11&-1)<<2)|0,k+((f*11&-1)<<2)|0,d,l);o=d;d=i;i=o;o=gX((k+(j<<2)|0)+(f<<2)|0,k,f<<1,14,i)|0;n=(k+(j<<2)|0)+(j<<2)|0;c[n>>2]=(c[n>>2]|0)-o|0;o=b+(f<<2)|0;n=c[o>>2]|0;c[o>>2]=n-((c[k>>2]|0)>>>2)|0;if(n>>>0<(c[k>>2]|0)>>>2>>>0){while(1){n=o+4|0;o=n;p=c[n>>2]|0;c[n>>2]=p-1|0;if((p|0)!=0){break}}}o=gX(b+(f<<2)|0,k+4|0,(f<<1)-1|0,30,i)|0;p=((b+(f<<2)|0)+(f<<1<<2)|0)-4|0;n=c[p>>2]|0;c[p>>2]=n-o|0;if(n>>>0<o>>>0){while(1){o=p+4|0;p=o;n=c[o>>2]|0;c[o>>2]=n-1|0;if((n|0)!=0){break}}}eG(i,b,k+(j<<2)|0,l);eI(k+(j<<2)|0,k+(j<<2)|0,b,l);p=b;b=i;i=p;m=gX((e+(f<<2)|0)+4|0,k,f<<1,10,i)|0;p=a+(f<<2)|0;n=c[p>>2]|0;c[p>>2]=n-((c[k>>2]|0)>>>6)|0;if(n>>>0<(c[k>>2]|0)>>>6>>>0){while(1){n=p+4|0;p=n;o=c[n>>2]|0;c[n>>2]=o-1|0;if((o|0)!=0){break}}}m=gX(a+(f<<2)|0,k+4|0,(f<<1)-1|0,26,i)|0;m=eH((a+((f*3&-1)<<2)|0)-4|0,(a+((f*3&-1)<<2)|0)-4|0,2,m)|0;eI(i,e,a,l);eG(a,a,e,l);p=e;e=i;i=p;p=eI((k+((f*7&-1)<<2)|0)+(f<<2)|0,(k+((f*7&-1)<<2)|0)+(f<<2)|0,k,f<<1)|0;o=(k+((f*7&-1)<<2)|0)+(j<<2)|0;c[o>>2]=(c[o>>2]|0)-p|0;eO(d,k+(j<<2)|0,l,1028);eO(e,d,l,1300);eO(e,k+(j<<2)|0,l,1052688);eR(e,e,l,188513325);eO(d,e,l,12567555);eR(d,d,l,181440);if((c[d+(j<<2)>>2]&-33554432|0)!=0){p=d+(j<<2)|0;c[p>>2]=c[p>>2]|-67108864}eO(k+(j<<2)|0,e,l,4095);eN(k+(j<<2)|0,d,l,240);eR(k+(j<<2)|0,k+(j<<2)|0,l,1020);if((c[(k+(j<<2)|0)+(j<<2)>>2]&-536870912|0)!=0){p=(k+(j<<2)|0)+(j<<2)|0;c[p>>2]=c[p>>2]|-1073741824}gX(b,k+((f*7&-1)<<2)|0,l,7,i);gX(k+((f*11&-1)<<2)|0,k+((f*7&-1)<<2)|0,l,13,i);eO(k+((f*11&-1)<<2)|0,b,l,400);gX(a,k+((f*7&-1)<<2)|0,l,19,i);eO(a,k+((f*11&-1)<<2)|0,l,1428);eO(a,b,l,112896);eR(a,a,l,182712915);eO(k+((f*11&-1)<<2)|0,a,l,15181425);eR(k+((f*11&-1)<<2)|0,k+((f*11&-1)<<2)|0,l,680400);eO(b,a,l,3969);eO(b,k+((f*11&-1)<<2)|0,l,900);eR(b,b,l,144);eI(k+((f*7&-1)<<2)|0,k+((f*7&-1)<<2)|0,a,l);eI(k+((f*7&-1)<<2)|0,k+((f*7&-1)<<2)|0,b,l);eI(k+((f*7&-1)<<2)|0,k+((f*7&-1)<<2)|0,k+((f*11&-1)<<2)|0,l);eG(k+(j<<2)|0,k+((f*11&-1)<<2)|0,k+(j<<2)|0,l);eQ(k+(j<<2)|0,k+(j<<2)|0,l,1);eI(k+((f*11&-1)<<2)|0,k+((f*11&-1)<<2)|0,k+(j<<2)|0,l);eI(d,b,d,l);eQ(d,d,l,1);eI(b,b,d,l);eG(e,a,e,l);eQ(e,e,l,1);eI(a,a,e,l);m=eG(k+(f<<2)|0,k+(f<<2)|0,e,f)|0;m=eF(k+(f<<1<<2)|0,e+(f<<2)|0,f,m)|0;l=e+(f<<1<<2)|0;i=(c[l>>2]|0)+m|0;c[l>>2]=i;if(i>>>0<m>>>0){while(1){i=l+4|0;l=i;p=(c[i>>2]|0)+1|0;c[i>>2]=p;if((p|0)!=0){break}}}l=c[e+(j<<2)>>2]|0;m=l+(eG(k+(j<<2)|0,k+(j<<2)|0,e+(f<<1<<2)|0,f)|0)|0;e=k+(f<<2<<2)|0;l=(c[e>>2]|0)+m|0;c[e>>2]=l;if(l>>>0<m>>>0){while(1){l=e+4|0;e=l;p=(c[l>>2]|0)+1|0;c[l>>2]=p;if((p|0)!=0){break}}}e=eG(k+((f*5&-1)<<2)|0,k+((f*5&-1)<<2)|0,d,f)|0;p=k+(j<<1<<2)|0;c[p>>2]=(c[p>>2]|0)+e|0;m=eF(k+(j<<1<<2)|0,d+(f<<2)|0,f,c[k+(j<<1<<2)>>2]|0)|0;e=d+(f<<1<<2)|0;p=(c[e>>2]|0)+m|0;c[e>>2]=p;if(p>>>0<m>>>0){while(1){p=e+4|0;e=p;l=(c[p>>2]|0)+1|0;c[p>>2]=l;if((l|0)!=0){break}}}e=c[d+(j<<2)>>2]|0;m=e+(eG(k+((f*7&-1)<<2)|0,k+((f*7&-1)<<2)|0,d+(f<<1<<2)|0,f)|0)|0;d=k+(f<<3<<2)|0;e=(c[d>>2]|0)+m|0;c[d>>2]=e;if(e>>>0<m>>>0){while(1){e=d+4|0;d=e;l=(c[e>>2]|0)+1|0;c[e>>2]=l;if((l|0)!=0){break}}}d=eG(k+((f*9&-1)<<2)|0,k+((f*9&-1)<<2)|0,b,f)|0;l=k+((f*10&-1)<<2)|0;c[l>>2]=(c[l>>2]|0)+d|0;m=eF(k+((f*10&-1)<<2)|0,b+(f<<2)|0,f,c[k+((f*10&-1)<<2)>>2]|0)|0;d=b+(f<<1<<2)|0;l=(c[d>>2]|0)+m|0;c[d>>2]=l;if(l>>>0<m>>>0){while(1){l=d+4|0;d=l;e=(c[l>>2]|0)+1|0;c[l>>2]=e;if((e|0)!=0){break}}}d=c[b+(j<<2)>>2]|0;m=d+(eG(k+((f*11&-1)<<2)|0,k+((f*11&-1)<<2)|0,b+(f<<1<<2)|0,f)|0)|0;b=k+((f*12&-1)<<2)|0;d=(c[b>>2]|0)+m|0;c[b>>2]=d;if(d>>>0<m>>>0){while(1){d=b+4|0;b=d;e=(c[d>>2]|0)+1|0;c[d>>2]=e;if((e|0)!=0){break}}}b=eG(k+((f*13&-1)<<2)|0,k+((f*13&-1)<<2)|0,a,f)|0;e=k+((f*14&-1)<<2)|0;c[e>>2]=(c[e>>2]|0)+b|0;if((h|0)==0){h=k+((f*14&-1)<<2)|0;b=a+(f<<2)|0;e=g;d=c[k+((f*14&-1)<<2)>>2]|0;eF(h,b,e,d);return}m=eF(k+((f*14&-1)<<2)|0,a+(f<<2)|0,f,c[k+((f*14&-1)<<2)>>2]|0)|0;d=a+(f<<1<<2)|0;e=(c[d>>2]|0)+m|0;c[d>>2]=e;if(e>>>0<m>>>0){while(1){e=d+4|0;d=e;b=(c[e>>2]|0)+1|0;c[e>>2]=b;if((b|0)!=0){break}}}if((((g|0)>(f|0)&1|0)!=0&1|0)!=0){d=c[a+(j<<2)>>2]|0;m=d+(eG(k+((f*15&-1)<<2)|0,k+((f*15&-1)<<2)|0,a+(f<<1<<2)|0,f)|0)|0;d=k+(f<<4<<2)|0;j=(c[d>>2]|0)+m|0;c[d>>2]=j;if(j>>>0<m>>>0){while(1){m=d+4|0;d=m;j=(c[m>>2]|0)+1|0;c[m>>2]=j;if((j|0)!=0){break}}}}else{eG(k+((f*15&-1)<<2)|0,k+((f*15&-1)<<2)|0,a+(f<<1<<2)|0,g)}return}function gX(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=c;c=e;e=eP(c,b,a,d)|0;return e+(eI(f,f,c,a)|0)|0}function gY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+104|0;g=f|0;h=f+96|0;j=a;a=b;b=d;d=e;e=g|0;k=b;while(1){c[e>>2]=k;k=(k>>1)+1|0;e=e+4|0;if(!((k|0)>=200)){break}}a=a+(b<<2)|0;j=j+(b<<2)|0;g_(j+(-k<<2)|0,a+(-k<<2)|0,k,d);c[h>>2]=0;l=g8(b+1|0)|0;if(((gZ(l,b,(b>>1)+1|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){m=gZ(l,b,(b>>1)+1|0)<<2;n=i;i=i+m|0;i=i+7>>3<<3;o=n}else{o=dD(h,gZ(l,b,(b>>1)+1|0)<<2)|0}n=o;o=(d+(b<<2)|0)+12|0;while(1){m=e-4|0;e=m;b=c[m>>2]|0;m=g8(b+1|0)|0;l=m;if((m|0)>(b+k|0)){m=o;p=a+(-b<<2)|0;q=b;r=j+(-k<<2)|0;s=k;e_(m,p,q,r,s);s=o+(k<<2)|0;r=o+(k<<2)|0;q=a+(-b<<2)|0;p=(b-k|0)+1|0;eG(s,r,q,p);t=1}else{g5(o,l,a+(-b<<2)|0,b,j+(-k<<2)|0,k,n);c[o+(l<<2)>>2]=(eG(o+(k<<2)|0,o+(k<<2)|0,a+(-b<<2)|0,l-k|0)|0)+1|0;u=eG(o,o,a+(-(b-(l-k|0)|0)<<2)|0,b-(l-k|0)|0)|0;p=(o+(b<<2)|0)+(-(l-k|0)<<2)|0;q=(c[p>>2]|0)+u|0;c[p>>2]=q;if(q>>>0<u>>>0){while(1){q=p+4|0;p=q;r=(c[q>>2]|0)+1|0;c[q>>2]=r;if((r|0)!=0){break}}}p=((o+(k<<2)|0)+(b<<2)|0)+(-l<<2)|0;while(1){r=p;p=r+4|0;q=c[r>>2]|0;c[r>>2]=q-1|0;if((q|0)!=0){break}}if((c[o+(l<<2)>>2]|0)!=0){p=o;q=(c[p>>2]|0)+((c[o+(l<<2)>>2]|0)-1|0)|0;c[p>>2]=q;if(q>>>0<((c[o+(l<<2)>>2]|0)-1|0)>>>0){while(1){q=p+4|0;p=q;r=(c[q>>2]|0)+1|0;c[q>>2]=r;if((r|0)!=0){break}}}}else{p=o;while(1){r=p;p=r+4|0;q=c[r>>2]|0;c[r>>2]=q-1|0;if((q|0)!=0){break}}}t=0}if((c[o+(b<<2)>>2]|0)>>>0<2){u=1;while(1){if((c[o+(b<<2)>>2]|0)!=0){v=1}else{v=(fw(o,a+(-b<<2)|0,b)|0)>0}if(!v){break}p=eI(o,o,a+(-b<<2)|0,b)|0;q=o+(b<<2)|0;c[q>>2]=(c[q>>2]|0)-p|0;u=u+1|0}p=j+(-k<<2)|0;q=c[p>>2]|0;c[p>>2]=q-u|0;if(q>>>0<u>>>0){while(1){q=p+4|0;p=q;r=c[q>>2]|0;c[q>>2]=r-1|0;if((r|0)!=0){break}}}eI(o,a+(-b<<2)|0,o,b)}else{p=o;r=o;q=b+1|0;while(1){s=r;r=s+4|0;m=p;p=m+4|0;c[m>>2]=c[s>>2]^-1;s=q-1|0;q=s;if((s|0)==0){break}}q=o;p=(c[q>>2]|0)+t|0;c[q>>2]=p;if(p>>>0<t>>>0){while(1){p=q+4|0;q=p;r=(c[p>>2]|0)+1|0;c[p>>2]=r;if((r|0)!=0){break}}}if((c[o+(b<<2)>>2]|0)!=0){q=j+(-k<<2)|0;while(1){r=q;q=r+4|0;p=(c[r>>2]|0)+1|0;c[r>>2]=p;if((p|0)!=0){break}}eI(o,o,a+(-b<<2)|0,b)}}fh(d,(o+(b<<2)|0)+(-k<<2)|0,j+(-k<<2)|0,k);u=eG(d+(k<<2)|0,d+(k<<2)|0,(o+(b<<2)|0)+(-k<<2)|0,(k<<1)-b|0)|0;u=g$(j+(-b<<2)|0,(d+((k*3&-1)<<2)|0)+(-b<<2)|0,o+(k<<2)|0,b-k|0,u)|0;q=j+(-k<<2)|0;p=(c[q>>2]|0)+(u+0|0)|0;c[q>>2]=p;if(p>>>0<(u+0|0)>>>0){while(1){p=q+4|0;q=p;r=(c[p>>2]|0)+1|0;c[p>>2]=r;if((r|0)!=0){break}}}if((e|0)==(g|0)){break}k=b}u=(c[d+(((k*3&-1)-b|0)-1<<2)>>2]|0)>>>0>4294967288&1;if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}i=f;return u|0}function gZ(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function g_(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;do{if((b|0)==1){e=(c[a>>2]|0)>>>16;j=c[a>>2]&65535;k=((c[a>>2]^-1)>>>0)/(e>>>0)>>>0;l=c[a>>2]^-1;m=l-ab(k,e)|0;l=ab(k,j);m=m<<16|65535;if(m>>>0<l>>>0){k=k-1|0;m=m+(c[a>>2]|0)|0;if(m>>>0>=(c[a>>2]|0)>>>0){if(m>>>0<l>>>0){k=k-1|0;m=m+(c[a>>2]|0)|0}}}m=m-l|0;n=(m>>>0)/(e>>>0)>>>0;o=m-ab(n,e)|0;l=ab(n,j);o=o<<16|65535;if(o>>>0<l>>>0){n=n-1|0;o=o+(c[a>>2]|0)|0;if(o>>>0>=(c[a>>2]|0)>>>0){if(o>>>0<l>>>0){n=n-1|0;o=o+(c[a>>2]|0)|0}}}o=o-l|0;c[h>>2]=k<<16|n;}else{n=(d+(b<<2)|0)+8|0;k=b-1|0;while(1){if(!((k|0)>=0)){break}c[n+(k<<2)>>2]=-1;k=k-1|0}k=n+(b<<2)|0;l=a;o=b;while(1){j=l;l=j+4|0;e=k;k=e+4|0;c[e>>2]=c[j>>2]^-1;j=o-1|0;o=j;if((j|0)==0){break}}if((b|0)==2){o=h;k=n;l=a;eT(o,0,k,4,l);break}l=(c[a+(b-1<<2)>>2]|0)>>>16;k=c[a+(b-1<<2)>>2]&65535;o=((c[a+(b-1<<2)>>2]^-1)>>>0)/(l>>>0)>>>0;j=c[a+(b-1<<2)>>2]^-1;e=j-ab(o,l)|0;j=ab(o,k);e=e<<16|65535;if(e>>>0<j>>>0){o=o-1|0;e=e+(c[a+(b-1<<2)>>2]|0)|0;if(e>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0){if(e>>>0<j>>>0){o=o-1|0;e=e+(c[a+(b-1<<2)>>2]|0)|0}}}e=e-j|0;m=(e>>>0)/(l>>>0)>>>0;p=e-ab(m,l)|0;j=ab(m,k);p=p<<16|65535;if(p>>>0<j>>>0){m=m-1|0;p=p+(c[a+(b-1<<2)>>2]|0)|0;if(p>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0){if(p>>>0<j>>>0){m=m-1|0;p=p+(c[a+(b-1<<2)>>2]|0)|0}}}p=p-j|0;j=o<<16|m;m=ab(c[a+(b-1<<2)>>2]|0,j);m=m+(c[a+(b-2<<2)>>2]|0)|0;if(m>>>0<(c[a+(b-2<<2)>>2]|0)>>>0){j=j-1|0;o=-(m>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0&1)|0;m=m-(c[a+(b-1<<2)>>2]|0)|0;j=j+o|0;m=m-(o&c[a+(b-1<<2)>>2])|0}o=c[a+(b-2<<2)>>2]|0;p=j;k=o&65535;l=o>>>16;o=p&65535;e=p>>>16;p=ab(k,o);q=ab(k,e);k=ab(l,o);o=ab(l,e);q=q+(p>>>16)|0;q=q+k|0;if(q>>>0<k>>>0){o=o+65536|0}k=o+(q>>>16)|0;o=(q<<16)+(p&65535)|0;m=m+k|0;if(m>>>0<k>>>0){j=j-1|0;if(((m>>>0>=(c[a+(b-1<<2)>>2]|0)>>>0&1|0)!=0&1|0)!=0){do{if(m>>>0>(c[a+(b-1<<2)>>2]|0)>>>0){r=1811}else{if(o>>>0>=(c[a+(b-2<<2)>>2]|0)>>>0){r=1811;break}else{break}}}while(0);if((r|0)==1811){j=j-1|0}}}c[g>>2]=j;hg(h,n,b<<1,a,b,c[g>>2]|0);o=h;while(1){m=o;o=m+4|0;k=c[m>>2]|0;c[m>>2]=k-1|0;if((k|0)!=0){break}}s=1;t=s;i=f;return t|0}}while(0);s=0;t=s;i=f;return t|0}function g$(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eG(f,b,c,a)|0;d=d+(eF(f,f,a,e)|0)|0;return d|0}function g0(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function g1(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;c[g>>2]=0;if((d|0)==0){if((((b*3&-1)+2<<2>>>0<65536&1|0)!=0&1|0)!=0){e=i;i=i+((b*3&-1)+2<<2)|0;i=i+7>>3<<3;j=e}else{j=dD(g,(b*3&-1)+2<<2)|0}d=j}if((b|0)>=200){k=gY(h,a,b,d)|0}else{k=g_(h,a,b,d)|0}if((((c[g>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[g>>2]|0)}i=f;return k|0}function g2(a){a=a|0;var b=0;b=a;a=g8(b)|0;return a+(g0(a,b,b+1>>1)|0)|0}function g3(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+96|0;h=a;a=b;b=e;e=f;f=g|0;j=b;while(1){if(!((j|0)>=300)){break}k=f;f=k+4|0;c[k>>2]=j;j=j+1>>1}k=e;if((j|0)!=0){e=k;l=j;while(1){m=e;e=m+4|0;c[m>>2]=0;m=l-1|0;l=m;if((m|0)==0){break}}}c[k>>2]=1;l=c[a>>2]|0;e=d[15904+((l>>>0)/2>>>0&127)|0]|0;e=(e<<1)-ab(ab(e,e),l)|0;e=(e<<1)-ab(ab(e,e),l)|0;l=e;if((j|0)>=180){ht(h,k,j,a,j,-l|0)}else{hp(h,k,j,a,j,-l|0)}while(1){if((j|0)>=(b|0)){break}l=f-4|0;f=l;e=c[l>>2]|0;l=g8(e)|0;g5(k,l,a,e,h,j,k+(l<<2)|0);eH(k+(l<<2)|0,k,j-(l-e|0)|0,1);gh(h+(j<<2)|0,h,k+(j<<2)|0,e-j|0);eJ(h+(j<<2)|0,h+(j<<2)|0,e-j|0);j=e}i=g;return}function g4(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=e;e=f;fh(e,b,d,a);d=eG(g,e,e+(a<<2)|0,a)|0;a=g;g=(c[a>>2]|0)+d|0;c[a>>2]=g;if(g>>>0<d>>>0){while(1){d=a+4|0;a=d;g=(c[d>>2]|0)+1|0;c[d>>2]=g;if((g|0)!=0){break}}}return}function g5(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;do{if((a&1|0)==0){if(!((a|0)>=16)){break}h=a>>1;if((((d|0)>(h|0)&1|0)!=0&1|0)!=0){j=g;k=eL(g,b,h,b+(h<<2)|0,d-h|0)|0;l=g;m=(c[l>>2]|0)+k|0;c[l>>2]=m;if(m>>>0<k>>>0){while(1){m=l+4|0;l=m;n=(c[m>>2]|0)+1|0;c[m>>2]=n;if((n|0)!=0){break}}}o=h;if((((f|0)>(h|0)&1|0)!=0&1|0)!=0){p=g+(h<<2)|0;k=eL(g+(h<<2)|0,e,h,e+(h<<2)|0,f-h|0)|0;l=g+(h<<2)|0;n=(c[l>>2]|0)+k|0;c[l>>2]=n;if(n>>>0<k>>>0){while(1){n=l+4|0;l=n;m=(c[n>>2]|0)+1|0;c[n>>2]=m;if((m|0)!=0){break}}}q=h;r=g+(h<<1<<2)|0}else{r=g+(h<<2)|0;p=e;q=f}}else{r=g;j=b;o=d;p=e;q=f}g5(i,h,j,o,p,q,r);if((((d|0)>(h|0)&1|0)!=0&1|0)!=0){s=(g+(h<<1<<2)|0)+8|0;k=eM((g+(h<<1<<2)|0)+8|0,b,h,b+(h<<2)|0,d-h|0)|0;c[((g+(h<<1<<2)|0)+8|0)+(h<<2)>>2]=0;l=(g+(h<<1<<2)|0)+8|0;m=(c[l>>2]|0)+k|0;c[l>>2]=m;if(m>>>0<k>>>0){while(1){m=l+4|0;l=m;n=(c[m>>2]|0)+1|0;c[m>>2]=n;if((n|0)!=0){break}}}t=h+(c[s+(h<<2)>>2]|0)|0}else{s=b;t=d}if((((f|0)>(h|0)&1|0)!=0&1|0)!=0){u=(((g+(h<<1<<2)|0)+8|0)+(h<<2)|0)+4|0;k=eM((((g+(h<<1<<2)|0)+8|0)+(h<<2)|0)+4|0,e,h,e+(h<<2)|0,f-h|0)|0;c[((g+(h<<1<<2)|0)+8|0)+((h<<1)+1<<2)>>2]=0;l=(((g+(h<<1<<2)|0)+8|0)+(h<<2)|0)+4|0;n=(c[l>>2]|0)+k|0;c[l>>2]=n;if(n>>>0<k>>>0){while(1){n=l+4|0;l=n;m=(c[n>>2]|0)+1|0;c[n>>2]=m;if((m|0)!=0){break}}}v=h+(c[u+(h<<2)>>2]|0)|0}else{u=e;v=f}if((h|0)>=300){w=e3(h,0)|0;l=(1<<w)-1|0;while(1){if((h&l|0)==0){break}w=w-1|0;l=l>>1}}else{w=0}if((w|0)>=4){c[g+(h<<2)>>2]=e5(g,h,s,t,u,v,w)|0}else{if((((u|0)==(e|0)&1|0)!=0&1|0)!=0){l=g;m=s;n=t;x=u;y=v;e_(l,m,n,x,y);t=(t+v|0)-h|0;t=t-((t|0)>(h|0)&1)|0;k=eM(g,g,h,g+(h<<2)|0,t)|0;c[g+(h<<2)>>2]=0;y=g;x=(c[y>>2]|0)+k|0;c[y>>2]=x;if(x>>>0<k>>>0){while(1){x=y+4|0;y=x;n=(c[x>>2]|0)+1|0;c[x>>2]=n;if((n|0)!=0){break}}}}else{g6(g,s,u,h,g)}}y=c[g+(h<<2)>>2]|0;k=y+(eG(i,i,g,h)|0)|0;k=k+(c[i>>2]&1)|0;eQ(i,i,h,1);y=k<<31;k=k>>>1;n=i+(h-1<<2)|0;c[n>>2]=c[n>>2]|y;y=i;n=(c[y>>2]|0)+k|0;c[y>>2]=n;if(n>>>0<k>>>0){while(1){n=y+4|0;y=n;x=(c[n>>2]|0)+1|0;c[n>>2]=x;if((x|0)!=0){break}}}if((((d+f|0)<(a|0)&1|0)!=0&1|0)!=0){k=eI(i+(h<<2)|0,i,g,(d+f|0)-h|0)|0;y=c[g+(h<<2)>>2]|0;k=y+(g7(((g+(d<<2)|0)+(f<<2)|0)+(-h<<2)|0,((i+(d<<2)|0)+(f<<2)|0)+(-h<<2)|0,((g+(d<<2)|0)+(f<<2)|0)+(-h<<2)|0,a-(d+f|0)|0,k)|0)|0;k=eH(i,i,d+f|0,k)|0}else{y=c[g+(h<<2)>>2]|0;k=y+(eI(i+(h<<2)|0,i,g,h)|0)|0;y=i;x=c[y>>2]|0;c[y>>2]=x-k|0;if(x>>>0<k>>>0){while(1){x=y+4|0;y=x;n=c[x>>2]|0;c[x>>2]=n-1|0;if((n|0)!=0){break}}}}return}}while(0);if((((f|0)<(a|0)&1|0)!=0&1|0)!=0){if((((d+f|0)<=(a|0)&1|0)!=0&1|0)!=0){k=i;u=b;s=d;t=e;v=f;e_(k,u,s,t,v)}else{v=g;t=b;s=d;u=e;k=f;e_(v,t,s,u,k);k=eL(i,g,a,g+(a<<2)|0,(d+f|0)-a|0)|0;f=i;d=(c[f>>2]|0)+k|0;c[f>>2]=d;if(d>>>0<k>>>0){while(1){k=f+4|0;f=k;d=(c[k>>2]|0)+1|0;c[k>>2]=d;if((d|0)!=0){break}}}}}else{g4(i,b,e,a,g)}return}function g6(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=e;e=f;fh(e,b,d,a+1|0);d=c[e+(a<<1<<2)>>2]|0;b=d+(eI(g,e,e+(a<<2)|0,a)|0)|0;c[g+(a<<2)>>2]=0;a=g;g=(c[a>>2]|0)+b|0;c[a>>2]=g;if(g>>>0<b>>>0){while(1){b=a+4|0;a=b;g=(c[b>>2]|0)+1|0;c[b>>2]=g;if((g|0)!=0){break}}}return}function g7(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eI(f,b,c,a)|0;d=d+(eH(f,f,a,e)|0)|0;return d|0}function g8(a){a=a|0;var b=0,c=0;b=a;do{if((b|0)>=16){if(!((b|0)>=61)){c=b+1&-2;break}if(!((b|0)>=121)){c=b+3&-4;break}a=b+1>>1;if((a|0)>=300){c=e1(a,e3(a,0)|0)<<1;break}else{c=b+7&-8;break}}else{c=b}}while(0);return c|0}function g9(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=a;a=b;b=d;d=e;e=f;do{if((a&1|0)==0){if(!((a|0)>=16)){break}f=a>>1;if((((d|0)>(f|0)&1|0)!=0&1|0)!=0){h=e+(f<<2)|0;i=e;j=eL(e,b,f,b+(f<<2)|0,d-f|0)|0;k=e;l=(c[k>>2]|0)+j|0;c[k>>2]=l;if(l>>>0<j>>>0){while(1){l=k+4|0;k=l;m=(c[l>>2]|0)+1|0;c[l>>2]=m;if((m|0)!=0){break}}}n=f}else{h=e;i=b;n=d}g9(g,f,i,n,h);if((((d|0)>(f|0)&1|0)!=0&1|0)!=0){o=(e+(f<<1<<2)|0)+8|0;j=eM((e+(f<<1<<2)|0)+8|0,b,f,b+(f<<2)|0,d-f|0)|0;c[((e+(f<<1<<2)|0)+8|0)+(f<<2)>>2]=0;k=(e+(f<<1<<2)|0)+8|0;m=(c[k>>2]|0)+j|0;c[k>>2]=m;if(m>>>0<j>>>0){while(1){m=k+4|0;k=m;l=(c[m>>2]|0)+1|0;c[m>>2]=l;if((l|0)!=0){break}}}p=f+(c[o+(f<<2)>>2]|0)|0}else{o=b;p=d}if((f|0)>=300){q=e3(f,1)|0;k=(1<<q)-1|0;while(1){if((f&k|0)==0){break}q=q-1|0;k=k>>1}}else{q=0}if((q|0)>=4){c[e+(f<<2)>>2]=e5(e,f,o,p,o,p,q)|0}else{if((((o|0)==(b|0)&1|0)!=0&1|0)!=0){fi(e,b,d);p=(d<<1)-f|0;j=eM(e,e,f,e+(f<<2)|0,p)|0;c[e+(f<<2)>>2]=0;k=e;l=(c[k>>2]|0)+j|0;c[k>>2]=l;if(l>>>0<j>>>0){while(1){l=k+4|0;k=l;m=(c[l>>2]|0)+1|0;c[l>>2]=m;if((m|0)!=0){break}}}}else{hb(e,o,f,e)}}k=c[e+(f<<2)>>2]|0;j=k+(eG(g,g,e,f)|0)|0;j=j+(c[g>>2]&1)|0;eQ(g,g,f,1);k=j<<31;j=j>>>1;m=g+(f-1<<2)|0;c[m>>2]=c[m>>2]|k;k=g;m=(c[k>>2]|0)+j|0;c[k>>2]=m;if(m>>>0<j>>>0){while(1){m=k+4|0;k=m;l=(c[m>>2]|0)+1|0;c[m>>2]=l;if((l|0)!=0){break}}}if((((d<<1|0)<(a|0)&1|0)!=0&1|0)!=0){j=eI(g+(f<<2)|0,g,e,(d<<1)-f|0)|0;k=c[e+(f<<2)>>2]|0;j=k+(hc((e+(d<<1<<2)|0)+(-f<<2)|0,(g+(d<<1<<2)|0)+(-f<<2)|0,(e+(d<<1<<2)|0)+(-f<<2)|0,a-(d<<1)|0,j)|0)|0;j=eH(g,g,d<<1,j)|0}else{k=c[e+(f<<2)>>2]|0;j=k+(eI(g+(f<<2)|0,g,e,f)|0)|0;k=g;l=c[k>>2]|0;c[k>>2]=l-j|0;if(l>>>0<j>>>0){while(1){l=k+4|0;k=l;m=c[l>>2]|0;c[l>>2]=m-1|0;if((m|0)!=0){break}}}}return}}while(0);if((((d|0)<(a|0)&1|0)!=0&1|0)!=0){if((((d<<1|0)<=(a|0)&1|0)!=0&1|0)!=0){fi(g,b,d)}else{fi(e,b,d);j=eL(g,e,a,e+(a<<2)|0,(d<<1)-a|0)|0;d=g;o=(c[d>>2]|0)+j|0;c[d>>2]=o;if(o>>>0<j>>>0){while(1){j=d+4|0;d=j;o=(c[j>>2]|0)+1|0;c[j>>2]=o;if((o|0)!=0){break}}}}}else{ha(g,b,a,e)}return}function ha(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=e;fi(d,b,a);b=eG(f,d,d+(a<<2)|0,a)|0;a=f;f=(c[a>>2]|0)+b|0;c[a>>2]=f;if(f>>>0<b>>>0){while(1){b=a+4|0;a=b;f=(c[b>>2]|0)+1|0;c[b>>2]=f;if((f|0)!=0){break}}}return}function hb(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=e;fi(d,b,a+1|0);b=c[d+(a<<1<<2)>>2]|0;e=b+(eI(f,d,d+(a<<2)|0,a)|0)|0;c[f+(a<<2)>>2]=0;a=f;f=(c[a>>2]|0)+e|0;c[a>>2]=f;if(f>>>0<e>>>0){while(1){e=a+4|0;a=e;f=(c[e>>2]|0)+1|0;c[e>>2]=f;if((f|0)!=0){break}}}return}function hc(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eI(f,b,c,a)|0;d=d+(eH(f,f,a,e)|0)|0;return d|0}function hd(a){a=a|0;var b=0,c=0;b=a;do{if((b|0)>=16){if(!((b|0)>=61)){c=b+1&-2;break}if(!((b|0)>=121)){c=b+3&-4;break}a=b+1>>1;if((a|0)>=360){c=e1(a,e3(a,1)|0)<<1;break}else{c=b+7&-8;break}}else{c=b}}while(0);return c|0}function he(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;b=b+(d-2<<2)|0;h=c[b+4>>2]|0;j=c[b>>2]|0;k=0;do{if(h>>>0>=e>>>0){if(h>>>0<=e>>>0){if(!(j>>>0>=f>>>0)){break}}h=(h-e|0)-(j>>>0<f>>>0&1)|0;j=j-f|0;k=1}}while(0);l=(d-2|0)-1|0;while(1){if(!((l|0)>=0)){break}d=c[b-4>>2]|0;m=h;n=g;o=m&65535;p=m>>>16;m=n&65535;q=n>>>16;n=ab(o,m);r=ab(o,q);o=ab(p,m);m=ab(p,q);r=r+(n>>>16)|0;r=r+o|0;if(r>>>0<o>>>0){m=m+65536|0}o=m+(r>>>16)|0;m=(r<<16)+(n&65535)|0;n=m+j|0;o=(o+h|0)+(n>>>0<m>>>0&1)|0;m=n;h=j-ab(e,o)|0;h=(h-e|0)-(d>>>0<f>>>0&1)|0;j=d-f|0;d=f;n=o;r=d&65535;q=d>>>16;d=n&65535;p=n>>>16;n=ab(r,d);s=ab(r,p);r=ab(q,d);d=ab(q,p);s=s+(n>>>16)|0;s=s+r|0;if(s>>>0<r>>>0){d=d+65536|0}r=(s<<16)+(n&65535)|0;h=(h-(d+(s>>>16)|0)|0)-(j>>>0<r>>>0&1)|0;j=j-r|0;o=o+1|0;r=-(h>>>0>=m>>>0&1)|0;o=o+r|0;m=j+(r&f)|0;h=(h+(r&e)|0)+(m>>>0<j>>>0&1)|0;j=m;if(((h>>>0>=e>>>0&1|0)!=0&1|0)!=0){do{if(h>>>0>e>>>0){t=2209}else{if(j>>>0>=f>>>0){t=2209;break}else{break}}}while(0);if((t|0)==2209){t=0;o=o+1|0;h=(h-e|0)-(j>>>0<f>>>0&1)|0;j=j-f|0}}b=b-4|0;c[i+(l<<2)>>2]=o;l=l-1|0}c[a+4>>2]=h;c[a>>2]=j;return k|0}function hf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=a;a=b;b=d;d=e;e=f;f=g;a=a+(b<<2)|0;g=(fw(a+(-e<<2)|0,d,e)|0)>=0&1;if((g|0)!=0){i=a+(-e<<2)|0;j=a+(-e<<2)|0;k=d;l=e;eI(i,j,k,l)}h=h+(b-e<<2)|0;e=e-2|0;l=c[d+(e+1<<2)>>2]|0;k=c[d+(e<<2)>>2]|0;a=a-8|0;j=c[a+4>>2]|0;i=b-(e+2|0)|0;while(1){if((i|0)<=0){break}a=a-4|0;do{if((((j|0)==(l|0)&1|0)!=0&1|0)!=0){if((c[a+4>>2]|0)!=(k|0)){m=2230;break}n=-1;eO(a+(-e<<2)|0,d,e+2|0,n);j=c[a+4>>2]|0;break}else{m=2230}}while(0);if((m|0)==2230){m=0;b=j;o=f;p=b&65535;q=b>>>16;b=o&65535;r=o>>>16;o=ab(p,b);s=ab(p,r);p=ab(q,b);b=ab(q,r);s=s+(o>>>16)|0;s=s+p|0;if(s>>>0<p>>>0){b=b+65536|0}n=b+(s>>>16)|0;b=(s<<16)+(o&65535)|0;o=b+(c[a+4>>2]|0)|0;n=(n+j|0)+(o>>>0<b>>>0&1)|0;b=o;o=c[a+4>>2]|0;j=o-ab(l,n)|0;j=(j-l|0)-((c[a>>2]|0)>>>0<k>>>0&1)|0;o=(c[a>>2]|0)-k|0;s=k;p=n;r=s&65535;q=s>>>16;s=p&65535;t=p>>>16;p=ab(r,s);u=ab(r,t);r=ab(q,s);s=ab(q,t);u=u+(p>>>16)|0;u=u+r|0;if(u>>>0<r>>>0){s=s+65536|0}r=(u<<16)+(p&65535)|0;j=(j-(s+(u>>>16)|0)|0)-(o>>>0<r>>>0&1)|0;o=o-r|0;n=n+1|0;r=-(j>>>0>=b>>>0&1)|0;n=n+r|0;b=o+(r&k)|0;j=(j+(r&l)|0)+(b>>>0<o>>>0&1)|0;o=b;if(((j>>>0>=l>>>0&1|0)!=0&1|0)!=0){do{if(j>>>0>l>>>0){m=2250}else{if(o>>>0>=k>>>0){m=2250;break}else{break}}}while(0);if((m|0)==2250){m=0;n=n+1|0;j=(j-l|0)-(o>>>0<k>>>0&1)|0;o=o-k|0}}b=eO(a+(-e<<2)|0,d,e,n)|0;r=o>>>0<b>>>0&1;o=o-b|0;b=j>>>0<r>>>0&1;j=j-r|0;c[a>>2]=o;if((((b|0)!=0&1|0)!=0&1|0)!=0){j=j+(l+(eG(a+(-e<<2)|0,a+(-e<<2)|0,d,e+1|0)|0)|0)|0;n=n-1|0}}b=h-4|0;h=b;c[b>>2]=n;i=i-1|0}c[a+4>>2]=j;return g|0}function hg(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=a;a=b;b=d;d=e;e=f;f=g;a=a+(b<<2)|0;g=b-e|0;if((g+1|0)<(e|0)){d=d+(e-(g+1|0)<<2)|0;e=g+1|0}b=(fw(a+(-e<<2)|0,d,e)|0)>=0&1;if((b|0)!=0){i=a+(-e<<2)|0;j=a+(-e<<2)|0;k=d;l=e;eI(i,j,k,l)}h=h+(g<<2)|0;e=e-2|0;l=c[d+(e+1<<2)>>2]|0;k=c[d+(e<<2)>>2]|0;a=a-8|0;j=c[a+4>>2]|0;i=g-(e+2|0)|0;while(1){if(!((i|0)>=0)){break}a=a-4|0;do{if((((j|0)==(l|0)&1|0)!=0&1|0)!=0){if((c[a+4>>2]|0)!=(k|0)){m=2276;break}n=-1;eO(a+(-e<<2)|0,d,e+2|0,n);j=c[a+4>>2]|0;break}else{m=2276}}while(0);if((m|0)==2276){m=0;g=j;o=f;p=g&65535;q=g>>>16;g=o&65535;r=o>>>16;o=ab(p,g);s=ab(p,r);p=ab(q,g);g=ab(q,r);s=s+(o>>>16)|0;s=s+p|0;if(s>>>0<p>>>0){g=g+65536|0}n=g+(s>>>16)|0;g=(s<<16)+(o&65535)|0;o=g+(c[a+4>>2]|0)|0;n=(n+j|0)+(o>>>0<g>>>0&1)|0;g=o;o=c[a+4>>2]|0;j=o-ab(l,n)|0;j=(j-l|0)-((c[a>>2]|0)>>>0<k>>>0&1)|0;t=(c[a>>2]|0)-k|0;o=k;s=n;p=o&65535;r=o>>>16;o=s&65535;q=s>>>16;s=ab(p,o);u=ab(p,q);p=ab(r,o);o=ab(r,q);u=u+(s>>>16)|0;u=u+p|0;if(u>>>0<p>>>0){o=o+65536|0}p=(u<<16)+(s&65535)|0;j=(j-(o+(u>>>16)|0)|0)-(t>>>0<p>>>0&1)|0;t=t-p|0;n=n+1|0;p=-(j>>>0>=g>>>0&1)|0;n=n+p|0;g=t+(p&k)|0;j=(j+(p&l)|0)+(g>>>0<t>>>0&1)|0;t=g;if(((j>>>0>=l>>>0&1|0)!=0&1|0)!=0){do{if(j>>>0>l>>>0){m=2296}else{if(t>>>0>=k>>>0){m=2296;break}else{break}}}while(0);if((m|0)==2296){m=0;n=n+1|0;j=(j-l|0)-(t>>>0<k>>>0&1)|0;t=t-k|0}}v=eO(a+(-e<<2)|0,d,e,n)|0;w=t>>>0<v>>>0&1;t=t-v|0;v=j>>>0<w>>>0&1;j=j-w|0;c[a>>2]=t;if((((v|0)!=0&1|0)!=0&1|0)!=0){j=j+(l+(eG(a+(-e<<2)|0,a+(-e<<2)|0,d,e+1|0)|0)|0)|0;n=n-1|0}}g=h-4|0;h=g;c[g>>2]=n;i=i-1|0}g=-1;if((e|0)>=0){i=e;while(1){if((i|0)<=0){break}a=a-4|0;if(((j>>>0>=(l&g)>>>0&1|0)!=0&1|0)!=0){n=-1;v=eO(a+(-e<<2)|0,d,e+2|0,n)|0;if((((j|0)!=(v|0)&1|0)!=0&1|0)!=0){if(j>>>0<(v&g)>>>0){n=n-1|0;p=a+(-e<<2)|0;u=a+(-e<<2)|0;o=d;s=e+2|0;eG(p,u,o,s)}else{g=0}}j=c[a+4>>2]|0}else{s=j;o=f;u=s&65535;p=s>>>16;s=o&65535;q=o>>>16;o=ab(u,s);r=ab(u,q);u=ab(p,s);s=ab(p,q);r=r+(o>>>16)|0;r=r+u|0;if(r>>>0<u>>>0){s=s+65536|0}n=s+(r>>>16)|0;s=(r<<16)+(o&65535)|0;o=s+(c[a+4>>2]|0)|0;n=(n+j|0)+(o>>>0<s>>>0&1)|0;s=o;o=c[a+4>>2]|0;j=o-ab(l,n)|0;j=(j-l|0)-((c[a>>2]|0)>>>0<k>>>0&1)|0;t=(c[a>>2]|0)-k|0;o=k;r=n;u=o&65535;q=o>>>16;o=r&65535;p=r>>>16;r=ab(u,o);x=ab(u,p);u=ab(q,o);o=ab(q,p);x=x+(r>>>16)|0;x=x+u|0;if(x>>>0<u>>>0){o=o+65536|0}u=(x<<16)+(r&65535)|0;j=(j-(o+(x>>>16)|0)|0)-(t>>>0<u>>>0&1)|0;t=t-u|0;n=n+1|0;u=-(j>>>0>=s>>>0&1)|0;n=n+u|0;s=t+(u&k)|0;j=(j+(u&l)|0)+(s>>>0<t>>>0&1)|0;t=s;if(((j>>>0>=l>>>0&1|0)!=0&1|0)!=0){do{if(j>>>0>l>>>0){m=2336}else{if(t>>>0>=k>>>0){m=2336;break}else{break}}}while(0);if((m|0)==2336){m=0;n=n+1|0;j=(j-l|0)-(t>>>0<k>>>0&1)|0;t=t-k|0}}v=eO(a+(-e<<2)|0,d,e,n)|0;w=t>>>0<v>>>0&1;t=t-v|0;v=j>>>0<w>>>0&1;j=j-w|0;c[a>>2]=t;if((((v|0)!=0&1|0)!=0&1|0)!=0){j=j+(l+(eG(a+(-e<<2)|0,a+(-e<<2)|0,d,e+1|0)|0)|0)|0;n=n-1|0}}s=h-4|0;h=s;c[s>>2]=n;e=e-1|0;d=d+4|0;i=i-1|0}a=a-4|0;if(((j>>>0>=(l&g)>>>0&1|0)!=0&1|0)!=0){n=-1;v=eO(a,d,2,n)|0;if((((j|0)!=(v|0)&1|0)!=0&1|0)!=0){if(j>>>0<(v&g)>>>0){n=n-1|0;v=(c[a>>2]|0)+(c[d>>2]|0)|0;c[a+4>>2]=((c[a+4>>2]|0)+(c[d+4>>2]|0)|0)+(v>>>0<(c[a>>2]|0)>>>0&1)|0;c[a>>2]=v}else{g=0}}j=c[a+4>>2]|0}else{g=j;v=f;f=g&65535;d=g>>>16;g=v&65535;i=v>>>16;v=ab(f,g);e=ab(f,i);f=ab(d,g);g=ab(d,i);e=e+(v>>>16)|0;e=e+f|0;if(e>>>0<f>>>0){g=g+65536|0}n=g+(e>>>16)|0;g=(e<<16)+(v&65535)|0;v=g+(c[a+4>>2]|0)|0;n=(n+j|0)+(v>>>0<g>>>0&1)|0;g=v;v=c[a+4>>2]|0;j=v-ab(l,n)|0;j=(j-l|0)-((c[a>>2]|0)>>>0<k>>>0&1)|0;t=(c[a>>2]|0)-k|0;v=k;e=n;f=v&65535;i=v>>>16;v=e&65535;d=e>>>16;e=ab(f,v);w=ab(f,d);f=ab(i,v);v=ab(i,d);w=w+(e>>>16)|0;w=w+f|0;if(w>>>0<f>>>0){v=v+65536|0}f=(w<<16)+(e&65535)|0;j=(j-(v+(w>>>16)|0)|0)-(t>>>0<f>>>0&1)|0;t=t-f|0;n=n+1|0;f=-(j>>>0>=g>>>0&1)|0;n=n+f|0;g=t+(f&k)|0;j=(j+(f&l)|0)+(g>>>0<t>>>0&1)|0;t=g;if(((j>>>0>=l>>>0&1|0)!=0&1|0)!=0){do{if(j>>>0>l>>>0){m=2375}else{if(t>>>0>=k>>>0){m=2375;break}else{break}}}while(0);if((m|0)==2375){n=n+1|0;j=(j-l|0)-(t>>>0<k>>>0&1)|0;t=t-k|0}}c[a+4>>2]=j;c[a>>2]=t}t=h-4|0;h=t;c[t>>2]=n}if(((((c[a+4>>2]|0)==(j|0)^1)&1|0)!=0&1|0)!=0){dF(6136,185,8392);return 0}return b|0}function hh(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=a;a=b;b=d;d=e;e=f;f=g;g=d>>1;i=d-g|0;if((i|0)>=50){j=hh(h+(g<<2)|0,a+(g<<1<<2)|0,b+(g<<2)|0,i,e,f)|0}else{j=hf(h+(g<<2)|0,a+(g<<1<<2)|0,i<<1,b+(g<<2)|0,i,c[e>>2]|0)|0}e_(f,h+(g<<2)|0,i,b,g);k=eI(a+(g<<2)|0,a+(g<<2)|0,f,d)|0;if((j|0)!=0){k=k+(eI(a+(d<<2)|0,a+(d<<2)|0,b,g)|0)|0}while(1){if((k|0)==0){break}j=j-(eH(h+(g<<2)|0,h+(g<<2)|0,i,1)|0)|0;k=k-(eG(a+(g<<2)|0,a+(g<<2)|0,b,d)|0)|0}if((g|0)>=50){l=hh(h,a+(i<<2)|0,b+(i<<2)|0,g,e,f)|0}else{l=hf(h,a+(i<<2)|0,g<<1,b+(i<<2)|0,g,c[e>>2]|0)|0}e_(f,b,i,h,g);k=eI(a,a,f,d)|0;if((l|0)!=0){k=k+(eI(a+(g<<2)|0,a+(g<<2)|0,b,i)|0)|0}while(1){if((k|0)==0){break}eH(h,h,g,1);k=k-(eG(a,a,b,d)|0)|0}return j|0}function hi(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;g=0;k=i;i=i+(e<<2)|0;i=i+7>>3<<3;l=k;k=b-e|0;j=j+(k<<2)|0;a=a+(b<<2)|0;d=d+(e<<2)|0;if((k|0)>(e|0)){while(1){k=k-e|0;if((k|0)<=(e|0)){break}}j=j+(-k<<2)|0;a=a+(-k<<2)|0;if((k|0)==1){m=(fw((a+(-e<<2)|0)+4|0,d+(-e<<2)|0,e)|0)>=0&1;if((m|0)!=0){n=(a+(-e<<2)|0)+4|0;o=(a+(-e<<2)|0)+4|0;p=d+(-e<<2)|0;q=e;eI(n,o,p,q)}q=c[a>>2]|0;p=c[a-4>>2]|0;o=c[a-8>>2]|0;n=c[d-4>>2]|0;r=c[d-8>>2]|0;do{if((((q|0)==(n|0)&1|0)!=0&1|0)!=0){if((p|0)!=(r|0)){s=2424;break}t=-1;u=eO(a+(-e<<2)|0,d+(-e<<2)|0,e,t)|0;break}else{s=2424}}while(0);if((s|0)==2424){v=q;w=c[f>>2]|0;x=v&65535;y=v>>>16;v=w&65535;z=w>>>16;w=ab(x,v);A=ab(x,z);x=ab(y,v);v=ab(y,z);A=A+(w>>>16)|0;A=A+x|0;if(A>>>0<x>>>0){v=v+65536|0}t=v+(A>>>16)|0;v=(A<<16)+(w&65535)|0;w=v+p|0;t=(t+q|0)+(w>>>0<v>>>0&1)|0;v=w;p=p-ab(n,t)|0;p=(p-n|0)-(o>>>0<r>>>0&1)|0;o=o-r|0;w=r;q=t;A=w&65535;x=w>>>16;w=q&65535;z=q>>>16;q=ab(A,w);y=ab(A,z);A=ab(x,w);w=ab(x,z);y=y+(q>>>16)|0;y=y+A|0;if(y>>>0<A>>>0){w=w+65536|0}A=(y<<16)+(q&65535)|0;p=(p-(w+(y>>>16)|0)|0)-(o>>>0<A>>>0&1)|0;o=o-A|0;t=t+1|0;A=-(p>>>0>=v>>>0&1)|0;t=t+A|0;v=o+(A&r)|0;p=(p+(A&n)|0)+(v>>>0<o>>>0&1)|0;o=v;if(((p>>>0>=n>>>0&1|0)!=0&1|0)!=0){do{if(p>>>0>n>>>0){s=2444}else{if(o>>>0>=r>>>0){s=2444;break}else{break}}}while(0);if((s|0)==2444){t=t+1|0;p=(p-n|0)-(o>>>0<r>>>0&1)|0;o=o-r|0}}if((e|0)>2){r=eO(a+(-e<<2)|0,d+(-e<<2)|0,e-2|0,t)|0;s=o>>>0<r>>>0&1;o=o-r|0;r=p>>>0<s>>>0&1;p=p-s|0;c[a-8>>2]=o;if((((r|0)!=0&1|0)!=0&1|0)!=0){p=p+(n+(eG(a+(-e<<2)|0,a+(-e<<2)|0,d+(-e<<2)|0,e-1|0)|0)|0)|0;m=m-((t|0)==0&1)|0;t=t-1|0}}else{c[a-8>>2]=o}c[a-4>>2]=p}c[j>>2]=t}else{if((k|0)==2){m=eT(j,0,a-8|0,4,d-8|0)|0}else{if((k|0)>=50){m=hh(j,a+(-k<<2)|0,d+(-k<<2)|0,k,f,l)|0}else{m=hf(j,a+(-k<<2)|0,k<<1,d+(-k<<2)|0,k,c[f>>2]|0)|0}}if((k|0)!=(e|0)){if((k|0)>(e-k|0)){t=l;p=j;o=k;n=d+(-e<<2)|0;r=e-k|0;e_(t,p,o,n,r)}else{r=l;n=d+(-e<<2)|0;o=e-k|0;p=j;t=k;e_(r,n,o,p,t)}u=eI(a+(-e<<2)|0,a+(-e<<2)|0,l,e)|0;if((m|0)!=0){u=u+(eI((a+(-e<<2)|0)+(k<<2)|0,(a+(-e<<2)|0)+(k<<2)|0,d+(-e<<2)|0,e-k|0)|0)|0}while(1){if((u|0)==0){break}m=m-(eH(j,j,k,1)|0)|0;u=u-(eG(a+(-e<<2)|0,a+(-e<<2)|0,d+(-e<<2)|0,e)|0)|0}}}k=(b-e|0)-k|0;while(1){j=j+(-e<<2)|0;a=a+(-e<<2)|0;hh(j,a+(-e<<2)|0,d+(-e<<2)|0,e,f,l);k=k-e|0;if((k|0)<=0){break}}}else{j=j+(-k<<2)|0;a=a+(-k<<2)|0;if((k|0)>=50){m=hh(j,a+(-k<<2)|0,d+(-k<<2)|0,k,f,l)|0}else{m=hf(j,a+(-k<<2)|0,k<<1,d+(-k<<2)|0,k,c[f>>2]|0)|0}if((k|0)!=(e|0)){if((k|0)>(e-k|0)){f=l;b=j;t=k;p=d+(-e<<2)|0;o=e-k|0;e_(f,b,t,p,o)}else{o=l;p=d+(-e<<2)|0;t=e-k|0;b=j;f=k;e_(o,p,t,b,f)}u=eI(a+(-e<<2)|0,a+(-e<<2)|0,l,e)|0;if((m|0)!=0){u=u+(eI((a+(-e<<2)|0)+(k<<2)|0,(a+(-e<<2)|0)+(k<<2)|0,d+(-e<<2)|0,e-k|0)|0)|0}while(1){if((u|0)==0){break}m=m-(eH(j,j,k,1)|0)|0;u=u-(eG(a+(-e<<2)|0,a+(-e<<2)|0,d+(-e<<2)|0,e)|0)|0}}}if((((g|0)!=0&1|0)!=0&1|0)!=0){dE(g)}i=h;return m|0}function hj(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=d-f|0;if((h+100|0)>=(f|0)){j=hk(i,a,b,d,e,f,g)|0;k=j;return k|0}j=hk(i,(a+(d<<2)|0)+(-((h<<1)+1|0)<<2)|0,(b+(d<<2)|0)+(-((h<<1)+1|0)<<2)|0,(h<<1)+1|0,(e+(f<<2)|0)+(-(h+1|0)<<2)|0,h+1|0,g)|0;if((f-(h+1|0)|0)>(h|0)){l=g;m=e;n=f-(h+1|0)|0;o=i;p=h;e_(l,m,n,o,p)}else{p=g;o=i;n=h;m=e;l=f-(h+1|0)|0;e_(p,o,n,m,l)}if((j|0)!=0){q=eG(g+(h<<2)|0,g+(h<<2)|0,e,f-(h+1|0)|0)|0}else{q=0}c[g+(f-1<<2)>>2]=q;q=eI(a,b,g,d-((h<<1)+1|0)|0)|0;q=hl((a+(d<<2)|0)+(-((h<<1)+1|0)<<2)|0,(a+(d<<2)|0)+(-((h<<1)+1|0)<<2)|0,(g+(d<<2)|0)+(-((h<<1)+1|0)<<2)|0,h+1|0,q)|0;if((q|0)!=0){j=j-(eH(i,i,h,1)|0)|0;h=a;i=a;a=e;e=f;eG(h,i,a,e)}k=j;return k|0}function hk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=hm(d-f|0,f,0)|0;j=g;k=(g+(h<<2)|0)+4|0;if((f|0)!=(h|0)){if((((eF(k,(e+(f<<2)|0)+(-(h+1|0)<<2)|0,h+1|0,1)|0)!=0&1|0)!=0&1|0)!=0){if((h|0)!=0){l=j;m=h;while(1){n=l;l=n+4|0;c[n>>2]=0;n=m-1|0;m=n;if((n|0)==0){break}}}}else{g1(j,k,h+1|0,0);if((h|0)!=0){m=h-1|0;l=j;n=j+4|0;o=n;n=o+4|0;p=c[o>>2]|0;if((m|0)!=0){while(1){o=l;l=o+4|0;c[o>>2]=p;o=n;n=o+4|0;p=c[o>>2]|0;o=m-1|0;m=o;if((o|0)==0){break}}}m=l;l=m+4|0;c[m>>2]=p}}q=i;r=a;s=b;t=d;u=e;v=f;w=j;x=h;y=g;z=h;A=y+(z<<2)|0;B=hq(q,r,s,t,u,v,w,x,A)|0;C=B;D=C;return D|0}if((h|0)!=0){p=h-1|0;m=k+4|0;l=e;n=l;l=n+4|0;o=c[n>>2]|0;if((p|0)!=0){while(1){n=m;m=n+4|0;c[n>>2]=o;n=l;l=n+4|0;o=c[n>>2]|0;n=p-1|0;p=n;if((n|0)==0){break}}}p=m;m=p+4|0;c[p>>2]=o}c[k>>2]=1;g1(j,k,h+1|0,0);if((h|0)!=0){k=h-1|0;o=j;p=j+4|0;m=p;p=m+4|0;l=c[m>>2]|0;if((k|0)!=0){while(1){m=o;o=m+4|0;c[m>>2]=l;m=p;p=m+4|0;l=c[m>>2]|0;m=k-1|0;k=m;if((m|0)==0){break}}}k=o;o=k+4|0;c[k>>2]=l}q=i;r=a;s=b;t=d;u=e;v=f;w=j;x=h;y=g;z=h;A=y+(z<<2)|0;B=hq(q,r,s,t,u,v,w,x,A)|0;C=B;D=C;return D|0}function hl(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eI(f,b,c,a)|0;d=d+(eH(f,f,a,e)|0)|0;return d|0}function hm(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=c;if((b|0)!=0){if((a|0)<(d|0)){e=a}else{e=d}f=((e-1|0)/(b|0)&-1)+1|0;g=f;return g|0}if((d|0)>(a|0)){f=((d-1|0)/(((d-1|0)/(a|0)&-1)+1|0)&-1)+1|0}else{if((d*3&-1|0)>(a|0)){f=((d-1|0)/2&-1)+1|0}else{f=(d-1&-1)+1|0}}g=f;return g|0}function hn(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function ho(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=b;b=g8(d+1|0)|0;e=hm(a-d|0,d,c)|0;return(e+b|0)+(hn(b,d,e)|0)|0}function hp(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=a;a=b;b=d;d=e;e=f;f=g;g=b-e|0;while(1){if((g|0)<=0){break}i=ab(f,c[a>>2]|0);eF(a+(e<<2)|0,a+(e<<2)|0,g,eN(a,d,e,i)|0);c[h>>2]=i^-1;h=h+4|0;a=a+4|0;g=g-1|0}g=e;while(1){if((g|0)<=1){break}i=ab(f,c[a>>2]|0);eN(a,d,g,i);c[h>>2]=i^-1;h=h+4|0;a=a+4|0;g=g-1|0}i=ab(f,c[a>>2]|0);c[h>>2]=i^-1;eF((h+(-b<<2)|0)+4|0,(h+(-b<<2)|0)+4|0,b,1);return}function hq(a,b,d,e,f,g,h,i,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=a;a=b;b=d;d=f;f=g;g=h;h=i;i=j;j=e-f|0;b=b+(j<<2)|0;k=k+(j<<2)|0;e=(fw(b,d,f)|0)>=0&1;if((e|0)!=0){l=a;m=b;n=d;o=f;eI(l,m,n,o)}else{if((f|0)!=0){o=f-1|0;n=a;m=b;l=m;m=l+4|0;p=c[l>>2]|0;if((o|0)!=0){while(1){l=n;n=l+4|0;c[l>>2]=p;l=m;m=l+4|0;p=c[l>>2]|0;l=o-1|0;o=l;if((l|0)==0){break}}}o=n;n=o+4|0;c[o>>2]=p}}if((j|0)==0){q=e;r=q;return r|0}while(1){if((j|0)<=0){s=2696;break}if((j|0)<(h|0)){g=g+(h-j<<2)|0;h=j}b=b+(-h<<2)|0;k=k+(-h<<2)|0;fh(i,(a+(f<<2)|0)+(-h<<2)|0,g,h);p=eG(k,i+(h<<2)|0,(a+(f<<2)|0)+(-h<<2)|0,h)|0;if(((((p|0)==0^1)&1|0)!=0&1|0)!=0){s=2642;break}j=j-h|0;if((h|0)>=40){o=g8(f+1|0)|0;g5(i,o,d,f,k,h,i+(o<<2)|0);n=(f+h|0)-o|0;if((n|0)>0){p=eI(i,i,(a+(f<<2)|0)+(-n<<2)|0,n)|0;p=eH(i+(n<<2)|0,i+(n<<2)|0,o-n|0,p)|0;n=(fw((a+(f<<2)|0)+(-h<<2)|0,i+(f<<2)|0,o-f|0)|0)<0&1;if((((n>>>0>=p>>>0^1)&1|0)!=0&1|0)!=0){s=2649;break}o=i;m=(c[o>>2]|0)+(n-p|0)|0;c[o>>2]=m;if(m>>>0<(n-p|0)>>>0){while(1){n=o+4|0;o=n;m=(c[n>>2]|0)+1|0;c[n>>2]=m;if((m|0)!=0){break}}}}}else{e_(i,d,f,k,h)}o=(c[a+(f-h<<2)>>2]|0)-(c[i+(f<<2)>>2]|0)|0;if((f|0)!=(h|0)){p=eI(i,b,i,h)|0;p=hl(i+(h<<2)|0,a,i+(h<<2)|0,f-h|0,p)|0;if((f|0)!=0){m=f-1|0;n=a;l=i;t=l;l=t+4|0;u=c[t>>2]|0;if((m|0)!=0){while(1){t=n;n=t+4|0;c[t>>2]=u;t=l;l=t+4|0;u=c[t>>2]|0;t=m-1|0;m=t;if((t|0)==0){break}}}m=n;n=m+4|0;c[m>>2]=u}}else{p=eI(a,b,i,h)|0}o=o-p|0;while(1){if((o|0)==0){break}m=k;while(1){l=m;m=l+4|0;t=(c[l>>2]|0)+1|0;c[l>>2]=t;if((t|0)!=0){break}}p=eI(a,a,d,f)|0;o=o-p|0}if((fw(a,d,f)|0)>=0){o=k;while(1){u=o;o=u+4|0;n=(c[u>>2]|0)+1|0;c[u>>2]=n;if((n|0)!=0){break}}p=eI(a,a,d,f)|0}}if((s|0)==2649){dF(6016,289,7008);return 0}else if((s|0)==2696){q=e;r=q;return r|0}else if((s|0)==2642){dF(6016,269,8376);return 0}return 0}function hr(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=a;a=b;b=d;d=e;e=f;f=g;g=b-e|0;i=0;j=1;while(1){if((g|0)<=(e|0)){break}k=0;while(1){if((k|0)>=(e|0)){break}l=ab(f,c[a+(k<<2)>>2]|0);c[a+(k<<2)>>2]=eN(a+(k<<2)|0,d,e,l)|0;c[h+(k<<2)>>2]=l^-1;k=k+1|0}i=i+(eL(a+(e<<2)|0,a+(e<<2)|0,g,a,e)|0)|0;j=eF(h,h,e,j)|0;h=h+(e<<2)|0;g=g-e|0;a=a+(e<<2)|0;b=b-e|0}k=0;while(1){if((k|0)>=(g|0)){break}b=ab(f,c[a+(k<<2)>>2]|0);c[a+(k<<2)>>2]=eN(a+(k<<2)|0,d,e,b)|0;c[h+(k<<2)>>2]=b^-1;k=k+1|0}i=i+(eG(a+(e<<2)|0,a+(e<<2)|0,a,g)|0)|0;j=eF(h,h,g,j)|0;if(((j>>>0>0&1|0)!=0&1|0)!=0){j=0;h=j;return h|0}else{j=(eI(a+(g<<2)|0,a+(g<<2)|0,d,e)|0)-i|0;h=j;return h|0}return 0}function hs(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;h=a;a=b;b=d;d=e;e=f;f=g;while(1){if(!((d|0)>=180)){break}g=d>>1;i=d-g|0;j=hu(h,a,b,g,e,f)|0;gh(f,h,b+(i<<2)|0,g);eI(a+(i<<2)|0,a+(i<<2)|0,f,g);if((g|0)<(i|0)){j=j+(eO(a+(g<<2)|0,h,g,c[b+(g<<2)>>2]|0)|0)|0;i=a+(d-1<<2)|0;c[i>>2]=(c[i>>2]|0)-j|0}h=h+(g<<2)|0;a=a+(g<<2)|0;d=d-g|0}hp(h,a,d,b,d,e);return}function ht(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;j=a;a=b;b=d;d=e;e=f;f=g;g=0;k=i;i=i+(e<<2)|0;i=i+7>>3<<3;l=k;k=b;if((k|0)>(e|0)){while(1){k=k-e|0;if((k|0)<=(e|0)){break}}if((k|0)>=50){m=hu(j,a,d,k,f,l)|0}else{m=hr(j,a,k<<1,d,k,f)|0}if((k|0)!=(e|0)){if((k|0)>(e-k|0)){n=l;o=j;p=k;q=d+(k<<2)|0;r=e-k|0;e_(n,o,p,q,r)}else{r=l;q=d+(k<<2)|0;p=e-k|0;o=j;n=k;e_(r,q,p,o,n)}n=l+(k<<2)|0;o=(c[n>>2]|0)+m|0;c[n>>2]=o;if(o>>>0<m>>>0){while(1){o=n+4|0;n=o;p=(c[o>>2]|0)+1|0;c[o>>2]=p;if((p|0)!=0){break}}}eM(a+(k<<2)|0,a+(k<<2)|0,b-k|0,l,e);m=0}a=a+(k<<2)|0;j=j+(k<<2)|0;k=b-k|0;while(1){if((k|0)<=(e|0)){break}eH(a+(e<<2)|0,a+(e<<2)|0,k-e|0,m);m=hu(j,a,d,e,f,l)|0;j=j+(e<<2)|0;a=a+(e<<2)|0;k=k-e|0}hs(j,a,d,e,f,l)}else{if((k|0)>=180){hs(j,a,d,k,f,l)}else{hp(j,a,k,d,k,f)}}if((((g|0)!=0&1|0)!=0&1|0)!=0){dE(g)}i=h;return}function hu(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=a;a=b;b=d;d=e;e=f;f=g;g=d>>1;i=d-g|0;if((g|0)>=50){j=hu(h,a,b,g,e,f)|0}else{j=hr(h,a,g<<1,b,g,e)|0}e_(f,b+(g<<2)|0,i,h,g);k=f+(g<<2)|0;l=(c[k>>2]|0)+j|0;c[k>>2]=l;if(l>>>0<j>>>0){while(1){l=k+4|0;k=l;m=(c[l>>2]|0)+1|0;c[l>>2]=m;if((m|0)!=0){break}}}k=eM(a+(g<<2)|0,a+(g<<2)|0,d+i|0,f,d)|0;if((i|0)>=50){j=hu(h+(g<<2)|0,a+(g<<2)|0,b,i,e,f)|0}else{j=hr(h+(g<<2)|0,a+(g<<2)|0,i<<1,b,i,e)|0}e_(f,h+(g<<2)|0,i,b+(i<<2)|0,g);g=f+(i<<2)|0;i=(c[g>>2]|0)+j|0;c[g>>2]=i;if(i>>>0<j>>>0){while(1){j=g+4|0;g=j;i=(c[j>>2]|0)+1|0;c[j>>2]=i;if((i|0)!=0){break}}}k=k+(eI(a+(d<<2)|0,a+(d<<2)|0,f,d)|0)|0;return k|0}function hv(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=a;a=b;b=e;e=f;f=g;g=d;if((g|0)<=(e|0)){i=g-(g>>1)|0;g3(f,b,i,f+(i<<2)|0);gh(h,a,f,i);if((i|0)>=40){j=g8(g)|0;g5(f+(i<<2)|0,j,b,g,h,i,(f+(i<<2)|0)+(j<<2)|0);k=(g+i|0)-j|0;if((k|0)>0){l=(fw(f+(i<<2)|0,a,k)|0)<0&1;d=(f+(i<<2)|0)+(k<<2)|0;m=c[d>>2]|0;c[d>>2]=m-l|0;if(m>>>0<l>>>0){while(1){m=d+4|0;d=m;n=c[m>>2]|0;c[m>>2]=n-1|0;if((n|0)!=0){break}}}}}else{e_(f+(i<<2)|0,b,g,h,i)}eI(f+(i<<2)|0,a+(i<<2)|0,(f+(i<<2)|0)+(i<<2)|0,g-i|0);gh(h+(i<<2)|0,f+(i<<2)|0,f,g-i|0);return}i=((g-1|0)/(((g-1|0)/(e|0)&-1)+1|0)&-1)+1|0;g3(f,b,i,f+(i<<2)|0);d=0;if((e|0)!=0){n=e-1|0;m=f+(i<<2)|0;o=a;p=o;o=p+4|0;q=c[p>>2]|0;if((n|0)!=0){while(1){p=m;m=p+4|0;c[p>>2]=q;p=o;o=p+4|0;q=c[p>>2]|0;p=n-1|0;n=p;if((p|0)==0){break}}}n=m;m=n+4|0;c[n>>2]=q}a=a+(e<<2)|0;gh(h,f+(i<<2)|0,f,i);g=g-i|0;while(1){if((g|0)<=(i|0)){break}if((i|0)>=40){j=g8(e)|0;g5((f+(i<<2)|0)+(e<<2)|0,j,b,e,h,i,((f+(i<<2)|0)+(e<<2)|0)+(j<<2)|0);k=(e+i|0)-j|0;if((k|0)>0){l=eI(((f+(i<<2)|0)+(e<<2)|0)+(j<<2)|0,(f+(i<<2)|0)+(e<<2)|0,f+(i<<2)|0,k)|0;q=((f+(i<<2)|0)+(e<<2)|0)+(k<<2)|0;n=c[q>>2]|0;c[q>>2]=n-l|0;if(n>>>0<l>>>0){while(1){n=q+4|0;q=n;m=c[n>>2]|0;c[n>>2]=m-1|0;if((m|0)!=0){break}}}}}else{e_((f+(i<<2)|0)+(e<<2)|0,b,e,h,i)}h=h+(i<<2)|0;if((e|0)!=(i|0)){d=d+(eI(f+(i<<2)|0,(f+(i<<2)|0)+(i<<2)|0,((f+(i<<2)|0)+(e<<2)|0)+(i<<2)|0,e-i|0)|0)|0;if((d|0)==2){q=((f+(i<<2)|0)+(e<<2)|0)+(e<<2)|0;while(1){m=q;q=m+4|0;n=(c[m>>2]|0)+1|0;c[m>>2]=n;if((n|0)!=0){break}}d=1}}d=hw(((f+(i<<2)|0)+(e<<2)|0)+(-i<<2)|0,a,((f+(i<<2)|0)+(e<<2)|0)+(e<<2)|0,i,d)|0;a=a+(i<<2)|0;gh(h,f+(i<<2)|0,f,i);g=g-i|0}if((i|0)>=40){j=g8(e)|0;g5((f+(i<<2)|0)+(e<<2)|0,j,b,e,h,i,((f+(i<<2)|0)+(e<<2)|0)+(j<<2)|0);k=(e+i|0)-j|0;if((k|0)>0){l=eI(((f+(i<<2)|0)+(e<<2)|0)+(j<<2)|0,(f+(i<<2)|0)+(e<<2)|0,f+(i<<2)|0,k)|0;j=((f+(i<<2)|0)+(e<<2)|0)+(k<<2)|0;k=c[j>>2]|0;c[j>>2]=k-l|0;if(k>>>0<l>>>0){while(1){l=j+4|0;j=l;k=c[l>>2]|0;c[l>>2]=k-1|0;if((k|0)!=0){break}}}}}else{e_((f+(i<<2)|0)+(e<<2)|0,b,e,h,i)}h=h+(i<<2)|0;if((e|0)!=(i|0)){d=d+(eI(f+(i<<2)|0,(f+(i<<2)|0)+(i<<2)|0,((f+(i<<2)|0)+(e<<2)|0)+(i<<2)|0,e-i|0)|0)|0;if((d|0)==2){b=((f+(i<<2)|0)+(e<<2)|0)+(e<<2)|0;while(1){j=b;b=j+4|0;k=(c[j>>2]|0)+1|0;c[j>>2]=k;if((k|0)!=0){break}}d=1}}hw(((f+(i<<2)|0)+(e<<2)|0)+(-i<<2)|0,a,((f+(i<<2)|0)+(e<<2)|0)+(e<<2)|0,g-(e-i|0)|0,d);gh(h,f+(i<<2)|0,f,g);return}function hw(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0;f=a;a=d;d=eI(f,b,c,a)|0;d=d+(eH(f,f,a,e)|0)|0;return d|0}function hx(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0,i=0;c=b;b=a;if((b|0)>(c|0)){a=((b-1|0)/(((b-1|0)/(c|0)&-1)+1|0)&-1)+1|0;if((a|0)>=40){d=g8(c)|0;e=hy(d,c,a)|0}else{d=c+a|0;e=0}f=g2(a)|0;g=(c+d|0)+e|0;if((g|0)>(f|0)){h=g}else{h=f}c=a+h|0;h=c;return h|0}else{a=b-(b>>1)|0;if((a|0)>=40){d=g8(b)|0;e=hy(d,b,a)|0}else{d=b+a|0;e=0}f=g2(a)|0;g=d+e|0;if((g|0)>(f|0)){i=g}else{i=f}c=a+i|0;h=c;return h|0}return 0}function hy(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function hz(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=a;a=b;b=d;d=e;e=f;f=0;while(1){if((f|0)>=(b|0)){break}h=c[a+(f<<2)>>2]|0;i=d<<0;j=h&65535;k=h>>>16;h=i&65535;l=i>>>16;i=ab(j,h);m=ab(j,l);j=ab(k,h);h=ab(k,l);m=m+(i>>>16)|0;m=m+j|0;if(m>>>0<j>>>0){h=h+65536|0}j=(m<<16)+(i&65535)|0;j=j>>>0;i=e>>>0<j>>>0&1;e=e-j|0;c[g+(f<<2)>>2]=e;e=(e-(h+(m>>>16)|0)|0)-i|0;f=f+1|0}return e|0}function hA(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0;i=a;a=b;b=e;e=f;f=g;g=h;if(!((f|0)>=180)){if((b|0)!=0){h=b-1|0;j=g;k=a;l=k;k=l+4|0;m=c[l>>2]|0;if((h|0)!=0){while(1){l=j;j=l+4|0;c[l>>2]=m;l=k;k=l+4|0;m=c[l>>2]|0;l=h-1|0;h=l;if((l|0)==0){break}}}h=j;j=h+4|0;c[h>>2]=m}m=c[e>>2]|0;h=d[15904+((m>>>0)/2>>>0&127)|0]|0;h=(h<<1)-ab(ab(h,h),m)|0;h=(h<<1)-ab(ab(h,h),m)|0;n=h;n=-n|0;hp(i,g,b,e,f,n);return}if((f|0)>=2e3){hv(i,a,b,e,f,g)}else{if((b|0)!=0){h=b-1|0;m=g;j=a;a=j;j=a+4|0;k=c[a>>2]|0;if((h|0)!=0){while(1){a=m;m=a+4|0;c[a>>2]=k;a=j;j=a+4|0;k=c[a>>2]|0;a=h-1|0;h=a;if((a|0)==0){break}}}h=m;m=h+4|0;c[h>>2]=k}k=c[e>>2]|0;h=d[15904+((k>>>0)/2>>>0&127)|0]|0;h=(h<<1)-ab(ab(h,h),k)|0;h=(h<<1)-ab(ab(h,h),k)|0;n=h;n=-n|0;ht(i,g,b,e,f,n)}return}function hB(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;if((a|0)>=2e3){b=hx(c,a)|0;a=b;return a|0}else{b=c;a=b;return a|0}return 0}function hC(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;h=i;i=i+8|0;j=h|0;k=a;a=b;b=e;e=f;f=g;while(1){if((c[e>>2]|0)!=0){break}e=e+4|0;a=a+4|0;f=f-1|0;b=b-1|0}if((f|0)==1){eR(k,a,b,c[e>>2]|0);i=h;return}c[j>>2]=0;g=(b+1|0)-f|0;b=c[e>>2]|0;if((((b&255|0)!=0&1|0)!=0&1|0)!=0){l=(d[9872+(b&-b)|0]|0)-2|0}else{m=6;while(1){if((m|0)>=30){break}b=b>>>8;if((((b&255|0)!=0&1|0)!=0&1|0)!=0){n=2995;break}m=m+8|0}l=m+(d[9872+(b&-b)|0]|0)|0}if(l>>>0>0){if((f|0)>(g|0)){o=g+1|0}else{o=f}b=o;if(((b<<2>>>0<65536&1|0)!=0&1|0)!=0){o=i;i=i+(b<<2)|0;i=i+7>>3<<3;p=o}else{p=dD(j,b<<2)|0}q=p;eQ(q,e,b,l);e=q;if(((g+1<<2>>>0<65536&1|0)!=0&1|0)!=0){b=i;i=i+(g+1<<2)|0;i=i+7>>3<<3;r=b}else{r=dD(j,g+1<<2)|0}b=r;eQ(b,a,g+1|0,l);a=b}if((f|0)>(g|0)){f=g}if(((hB(g,f)<<2>>>0<65536&1|0)!=0&1|0)!=0){b=hB(g,f)<<2;l=i;i=i+b|0;i=i+7>>3<<3;s=l}else{s=dD(j,hB(g,f)<<2)|0}q=s;hA(k,a,g,e,f,q);if((((c[j>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[j>>2]|0)}i=h;return}function hD(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=a;a=b;b=d;d=e;e=f;f=d-1|0;while(1){if(!((f|0)>=0)){break}h=eN(a,b,d,ab(c[a>>2]|0,e))|0;c[a>>2]=h;a=a+4|0;f=f-1|0}h=eG(g,a,a+(-d<<2)|0,d)|0;return h|0}function hE(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0;d=a;a=d>>1;e=d+4|0;if((b|0)>(a|0)){if((c|0)>(a|0)){f=d}else{f=a}g=f}else{g=0}return e+g|0}function hF(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;c[h>>2]=0;e=g8(d)|0;if((((d+e|0)+(hE(e,d,d)|0)<<2>>>0<65536&1|0)!=0&1|0)!=0){k=(d+e|0)+(hE(e,d,d)|0)<<2;l=i;i=i+k|0;i=i+7>>3<<3;m=l}else{m=dD(h,(d+e|0)+(hE(e,d,d)|0)<<2)|0}l=m;m=l;gh(m,a,f,d);f=l+(d<<2)|0;g5(f,e,m,d,b,d,(l+(d<<2)|0)+(e<<2)|0);if(((((d<<1|0)>(e|0)^1)&1|0)!=0&1|0)!=0){dF(5848,60,8264)}l=eI(f+(e<<2)|0,f,a,(d<<1)-e|0)|0;m=(f+(d<<1<<2)|0)+(-e<<2)|0;e=c[m>>2]|0;c[m>>2]=e-l|0;if(e>>>0<l>>>0){while(1){e=m+4|0;m=e;k=c[e>>2]|0;c[e>>2]=k-1|0;if((k|0)!=0){break}}}l=eI(j,a+(d<<2)|0,f+(d<<2)|0,d)|0;if((l|0)!=0){l=j;f=j;j=b;b=d;eG(l,f,j,b)}if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}i=g;return}function hG(a,b,e,f,g,h,j,k){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;l=i;i=i+16|0;m=l|0;n=l+8|0;o=a;a=b;b=e;e=f;f=g;g=h;h=j;j=k;c[n>>2]=0;k=c[e+(f-1<<2)>>2]|0;if(k>>>0<65536){p=k>>>0<256?1:9}else{p=k>>>0<16777216?17:25}q=p;p=((((f<<5)-((33-q|0)-(d[9872+(k>>>(q>>>0))|0]|0)|0)|0)+1|0)-1|0)>>>0>>>0;q=hH(p)|0;if((h|0)>=100){if(((h<<2>>>0<65536&1|0)!=0&1|0)!=0){k=i;i=i+(h<<2)|0;i=i+7>>3<<3;r=k}else{r=dD(n,h<<2)|0}s=r;g3(s,g,h,j)}else{s=m|0;m=c[g>>2]|0;r=d[15904+((m>>>0)/2>>>0&127)|0]|0;r=(r<<1)-ab(ab(r,r),m)|0;r=(r<<1)-ab(ab(r,r),m)|0;c[s>>2]=r;c[s>>2]=-(c[s>>2]|0)|0}if(((h<<q-1<<2>>>0<65536&1|0)!=0&1|0)!=0){r=i;i=i+(h<<q-1<<2)|0;i=i+7>>3<<3;t=r}else{t=dD(n,h<<q-1<<2)|0}r=t;t=r;hJ(t,a,b,g,h);fi(j,t,h);if((h|0)>=100){hF(o,j,g,h,s)}else{if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){b=o;a=o;m=g;k=h;eI(b,a,m,k)}}k=(1<<q-1)-1|0;while(1){if((k|0)<=0){break}fh(j,t,o,h);t=t+(h<<2)|0;if((h|0)>=100){hF(t,j,g,h,s)}else{if((hD(t,j,g,h,c[s>>2]|0)|0)!=0){m=t;a=t;b=g;f=h;eI(m,a,b,f)}}k=k-1|0}k=hI(e,p,q)|0;if(p>>>0<q>>>0){p=0}else{p=p-q|0}t=k;if((((t&255|0)!=0&1|0)!=0&1|0)!=0){u=(d[9872+(t&-t)|0]|0)-2|0}else{f=6;while(1){if((f|0)>=30){break}t=t>>>8;if((((t&255|0)!=0&1|0)!=0&1|0)!=0){v=3121;break}f=f+8|0}u=f+(d[9872+(t&-t)|0]|0)|0}p=p+u|0;k=k>>>(u>>>0);if((h|0)!=0){t=h-1|0;f=o;b=r+(ab(h,k>>>1)<<2)|0;a=b;b=a+4|0;m=c[a>>2]|0;if((t|0)!=0){while(1){a=f;f=a+4|0;c[a>>2]=m;a=b;b=a+4|0;m=c[a>>2]|0;a=t-1|0;t=a;if((a|0)==0){break}}}t=f;f=t+4|0;c[t>>2]=m}L3824:do{if((h|0)>=30){do{if((h|0)>=100){L3828:while(1){if((p|0)==0){v=3246;break}while(1){if(((c[e+(((p-1|0)>>>0)/32>>>0<<2)>>2]|0)>>>(((p-1|0)>>>0)%32>>>0)&1|0)!=0){break}fi(j,o,h);hF(o,j,g,h,s);p=p-1|0;if((p|0)==0){v=3226;break L3828}}k=hI(e,p,q)|0;w=q;if(p>>>0<q>>>0){w=w-(q-p|0)|0;p=0}else{p=p-q|0}m=k;if((((m&255|0)!=0&1|0)!=0&1|0)!=0){u=(d[9872+(m&-m)|0]|0)-2|0}else{t=6;while(1){if((t|0)>=30){break}m=m>>>8;if((((m&255|0)!=0&1|0)!=0&1|0)!=0){v=3237;break}t=t+8|0}if((v|0)==3237){v=0}u=t+(d[9872+(m&-m)|0]|0)|0}w=w-u|0;p=p+u|0;k=k>>>(u>>>0);while(1){fi(j,o,h);hF(o,j,g,h,s);w=w-1|0;if((w|0)==0){break}}fh(j,o,r+(ab(h,k>>>1)<<2)|0,h);hF(o,j,g,h,s)}if((v|0)==3226){break L3824}else if((v|0)==3246){break}}else{L3862:while(1){if((p|0)==0){v=3220;break}while(1){if(((c[e+(((p-1|0)>>>0)/32>>>0<<2)>>2]|0)>>>(((p-1|0)>>>0)%32>>>0)&1|0)!=0){break}fi(j,o,h);if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){m=o;t=o;f=g;b=h;eI(m,t,f,b)}p=p-1|0;if((p|0)==0){v=3192;break L3862}}k=hI(e,p,q)|0;w=q;if(p>>>0<q>>>0){w=w-(q-p|0)|0;p=0}else{p=p-q|0}b=k;if((((b&255|0)!=0&1|0)!=0&1|0)!=0){u=(d[9872+(b&-b)|0]|0)-2|0}else{f=6;while(1){if((f|0)>=30){break}b=b>>>8;if((((b&255|0)!=0&1|0)!=0&1|0)!=0){v=3203;break}f=f+8|0}if((v|0)==3203){v=0}u=f+(d[9872+(b&-b)|0]|0)|0}w=w-u|0;p=p+u|0;k=k>>>(u>>>0);while(1){fi(j,o,h);if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){t=o;m=o;a=g;x=h;eI(t,m,a,x)}w=w-1|0;if((w|0)==0){break}}fh(j,o,r+(ab(h,k>>>1)<<2)|0,h);if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){b=o;f=o;x=g;a=h;eI(b,f,x,a)}}if((v|0)==3220){break}else if((v|0)==3192){break L3824}}}while(0);v=3248;break}else{L3912:while(1){if((p|0)==0){v=3181;break}while(1){if(((c[e+(((p-1|0)>>>0)/32>>>0<<2)>>2]|0)>>>(((p-1|0)>>>0)%32>>>0)&1|0)!=0){break}fm(j,o,h);if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){a=o;x=o;f=g;b=h;eI(a,x,f,b)}p=p-1|0;if((p|0)==0){v=3153;break L3912}}k=hI(e,p,q)|0;w=q;if(p>>>0<q>>>0){w=w-(q-p|0)|0;p=0}else{p=p-q|0}b=k;if((((b&255|0)!=0&1|0)!=0&1|0)!=0){u=(d[9872+(b&-b)|0]|0)-2|0}else{f=6;while(1){if((f|0)>=30){break}b=b>>>8;if((((b&255|0)!=0&1|0)!=0&1|0)!=0){v=3164;break}f=f+8|0}if((v|0)==3164){v=0}u=f+(d[9872+(b&-b)|0]|0)|0}w=w-u|0;p=p+u|0;k=k>>>(u>>>0);while(1){fm(j,o,h);if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){x=o;a=o;m=g;t=h;eI(x,a,m,t)}w=w-1|0;if((w|0)==0){break}}fj(j,o,h,r+(ab(h,k>>>1)<<2)|0,h);if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){b=o;f=o;t=g;m=h;eI(b,f,t,m)}}if((v|0)==3181){v=3248;break}else if((v|0)==3153){break}}}while(0);if((h|0)!=0){v=h-1|0;k=j;r=o;w=r;r=w+4|0;u=c[w>>2]|0;if((v|0)!=0){while(1){w=k;k=w+4|0;c[w>>2]=u;w=r;r=w+4|0;u=c[w>>2]|0;w=v-1|0;v=w;if((w|0)==0){break}}}v=k;k=v+4|0;c[v>>2]=u}if((h|0)!=0){u=j+(h<<2)|0;v=h;while(1){k=u;u=k+4|0;c[k>>2]=0;k=v-1|0;v=k;if((k|0)==0){break}}}if((h|0)>=100){hF(o,j,g,h,s)}else{if((hD(o,j,g,h,c[s>>2]|0)|0)!=0){s=o;j=o;v=g;u=h;eI(s,j,v,u)}}if((fw(o,g,h)|0)>=0){u=o;v=o;o=g;g=h;eI(u,v,o,g)}if((((c[n>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[n>>2]|0)}i=l;return}function hH(a){a=a|0;var b=0;b=a;a=1;while(1){if(b>>>0<=(c[656+(a<<2)>>2]|0)>>>0){break}a=a+1|0}return a|0}function hI(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;if(a>>>0<b>>>0){f=c[e>>2]&(1<<a)-1;g=f;return g|0}a=a-b|0;d=(a>>>0)/32>>>0;a=(a>>>0)%32;h=(c[e+(d<<2)>>2]|0)>>>(a>>>0);i=32-a|0;if((i|0)<(b|0)){h=h+(c[e+(d+1<<2)>>2]<<i)|0}f=h&(1<<b)-1;g=f;return g|0}function hJ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;c[h>>2]=0;if(((b+e<<2>>>0<65536&1|0)!=0&1|0)!=0){f=i;i=i+(b+e<<2)|0;i=i+7>>3<<3;k=f}else{k=dD(h,b+e<<2)|0}f=k;if(((b+1<<2>>>0<65536&1|0)!=0&1|0)!=0){k=i;i=i+(b+1<<2)|0;i=i+7>>3<<3;l=k}else{l=dD(h,b+1<<2)|0}k=l;if((e|0)!=0){l=f;m=e;while(1){n=l;l=n+4|0;c[n>>2]=0;n=m-1|0;m=n;if((n|0)==0){break}}}if((b|0)!=0){m=b-1|0;l=f+(e<<2)|0;n=a;a=n;n=a+4|0;o=c[a>>2]|0;if((m|0)!=0){while(1){a=l;l=a+4|0;c[a>>2]=o;a=n;n=a+4|0;o=c[a>>2]|0;a=m-1|0;m=a;if((a|0)==0){break}}}m=l;l=m+4|0;c[m>>2]=o}fF(k,j,0,f,b+e|0,d,e);if((((c[h>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[h>>2]|0)}i=g;return}function hK(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;j=i;i=i+8|0;k=j|0;l=a;a=b;b=e;e=f;f=g;g=h;c[k>>2]=0;h=c[b+(e-1<<2)>>2]|0;if(h>>>0<65536){m=h>>>0<256?1:9}else{m=h>>>0<16777216?17:25}n=m;m=((((e<<5)-((33-n|0)-(d[9872+(h>>>(n>>>0))|0]|0)|0)|0)+1|0)-1|0)>>>0>>>0;n=hL(m)|0;if((((f<<n-1)+f<<2>>>0<65536&1|0)!=0&1|0)!=0){h=i;i=i+((f<<n-1)+f<<2)|0;i=i+7>>3<<3;o=h}else{o=dD(k,(f<<n-1)+f<<2)|0}h=o;o=h;if((f|0)!=0){e=f-1|0;p=o;q=a;r=q;q=r+4|0;s=c[r>>2]|0;if((e|0)!=0){while(1){r=p;p=r+4|0;c[r>>2]=s;r=q;q=r+4|0;s=c[r>>2]|0;r=e-1|0;e=r;if((r|0)==0){break}}}e=p;p=e+4|0;c[e>>2]=s}s=g+(f<<1<<2)|0;fi(g,a,f);if((f|0)!=0){a=f-1|0;e=s;p=g;q=p;p=q+4|0;r=c[q>>2]|0;if((a|0)!=0){while(1){q=e;e=q+4|0;c[q>>2]=r;q=p;p=q+4|0;r=c[q>>2]|0;q=a-1|0;a=q;if((q|0)==0){break}}}a=e;e=a+4|0;c[a>>2]=r}r=(1<<n-1)-1|0;while(1){if((r|0)<=0){break}a=o;o=o+(f<<2)|0;gh(o,a,s,f);r=r-1|0}r=hM(b,m,n)|0;if(m>>>0<n>>>0){m=0}else{m=m-n|0}s=r;if((((s&255|0)!=0&1|0)!=0&1|0)!=0){t=(d[9872+(s&-s)|0]|0)-2|0}else{o=6;while(1){if((o|0)>=30){break}s=s>>>8;if((((s&255|0)!=0&1|0)!=0&1|0)!=0){u=3402;break}o=o+8|0}t=o+(d[9872+(s&-s)|0]|0)|0}m=m+t|0;r=r>>>(t>>>0);if((f|0)!=0){s=f-1|0;o=l;a=h+(ab(f,r>>>1)<<2)|0;e=a;a=e+4|0;p=c[e>>2]|0;if((s|0)!=0){while(1){e=o;o=e+4|0;c[e>>2]=p;e=a;a=e+4|0;p=c[e>>2]|0;e=s-1|0;s=e;if((e|0)==0){break}}}s=o;o=s+4|0;c[s>>2]=p}L4173:while(1){if((m|0)==0){u=3500;break}while(1){if(((c[b+(((m-1|0)>>>0)/32>>>0<<2)>>2]|0)>>>(((m-1|0)>>>0)%32>>>0)&1|0)!=0){break}fi(g,l,f);if((f|0)!=0){p=f-1|0;s=l;o=g;a=o;o=a+4|0;e=c[a>>2]|0;if((p|0)!=0){while(1){a=s;s=a+4|0;c[a>>2]=e;a=o;o=a+4|0;e=c[a>>2]|0;a=p-1|0;p=a;if((a|0)==0){break}}}p=s;s=p+4|0;c[p>>2]=e}m=m-1|0;if((m|0)==0){u=3446;break L4173}}r=hM(b,m,n)|0;p=n;if(m>>>0<n>>>0){p=p-(n-m|0)|0;m=0}else{m=m-n|0}o=r;if((((o&255|0)!=0&1|0)!=0&1|0)!=0){t=(d[9872+(o&-o)|0]|0)-2|0}else{a=6;while(1){if((a|0)>=30){break}o=o>>>8;if((((o&255|0)!=0&1|0)!=0&1|0)!=0){u=3457;break}a=a+8|0}if((u|0)==3457){u=0}t=a+(d[9872+(o&-o)|0]|0)|0}p=p-t|0;m=m+t|0;r=r>>>(t>>>0);while(1){fi(g,l,f);if((f|0)!=0){q=f-1|0;v=l;w=g;x=w;w=x+4|0;y=c[x>>2]|0;if((q|0)!=0){while(1){x=v;v=x+4|0;c[x>>2]=y;x=w;w=x+4|0;y=c[x>>2]|0;x=q-1|0;q=x;if((x|0)==0){break}}}q=v;v=q+4|0;c[q>>2]=y}p=p-1|0;if((p|0)==0){break}}gh(g,l,h+(ab(f,r>>>1)<<2)|0,f);if((f|0)!=0){p=f-1|0;o=l;a=g;q=a;a=q+4|0;w=c[q>>2]|0;if((p|0)!=0){while(1){q=o;o=q+4|0;c[q>>2]=w;q=a;a=q+4|0;w=c[q>>2]|0;q=p-1|0;p=q;if((q|0)==0){break}}}p=o;o=p+4|0;c[p>>2]=w}}if((((c[k>>2]|0)!=0&1|0)!=0&1|0)!=0){dE(c[k>>2]|0)}i=j;return}function hL(a){a=a|0;var b=0;b=a;a=0;while(1){if(b>>>0<=(c[608+(a<<2)>>2]|0)>>>0){break}a=a+1|0}return a|0}function hM(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;a=b;b=d;if(a>>>0<b>>>0){f=c[e>>2]&(1<<a)-1;g=f;return g|0}a=a-b|0;d=(a>>>0)/32>>>0;a=(a>>>0)%32;h=(c[e+(d<<2)>>2]|0)>>>(a>>>0);i=32-a|0;if((i|0)<(b|0)){h=h+(c[e+(d+1<<2)>>2]<<i)|0}f=h&(1<<b)-1;g=f;return g|0}function hN(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;h=i;i=i+96|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=h+32|0;o=h+80|0;p=d;d=e;e=f;c[j>>2]=g;g=0;aS(k|0,j|0);j=(uJ(e|0)|0)+1|0;f=bm[c[4008]&1023](j)|0;q=f;uM(q|0,e|0);e=q;aS(m|0,k|0);L4288:while(1){q=aL(q|0,37)|0;if((q|0)==0){r=3521;break}s=q;aS(l|0,k|0);q=q+1|0;t=0;u=n+44|0;c[n>>2]=10;c[n+4>>2]=0;c[n+8>>2]=5712;c[n+12>>2]=0;a[n+16|0]=32;c[n+20>>2]=2;c[n+24>>2]=6;c[n+28>>2]=2;c[n+32>>2]=0;c[n+36>>2]=1;a[n+40|0]=0;c[n+44>>2]=0;v=0;L4291:while(1){w=q;q=w+1|0;x=a[w]|0;if((x|0)==0){r=3524;break}w=x;do{if((w|0)==110){r=3660;break L4291}else if((w|0)==108){if((t|0)!=108){r=3649;break}else{t=76;break}}else if((w|0)==71){r=3650;break L4291}else if((w|0)==109){r=3658;break L4291}else if((w|0)==77){a[q-1|0]=108;t=108;break}else if((w|0)==46){v=1;c[n+24>>2]=-1;u=n+24|0;break}else if((w|0)==42){y=c[k>>2]|0;c[k>>2]=y+4|0;z=c[y>>2]|0;if((u|0)==(n+44|0)){if((z|0)<0){c[n+20>>2]=1;z=-z|0}c[n+44>>2]=z}else{if(0>(z|0)){A=0}else{A=z}c[n+24>>2]=A}break}else if((w|0)==70|(w|0)==106|(w|0)==76|(w|0)==78|(w|0)==113|(w|0)==81|(w|0)==116|(w|0)==122|(w|0)==90){r=3649;break}else if((w|0)==104){if((t|0)!=104){r=3649;break}else{t=72;break}}else if((w|0)==103){r=3651;break L4291}else if((w|0)==111){r=3706;break L4291}else if((w|0)==112|(w|0)==115){r=3707;break L4291}else if((w|0)==120){r=3708;break L4291}else if((w|0)==88){r=3709;break L4291}else if((w|0)==49|(w|0)==50|(w|0)==51|(w|0)==52|(w|0)==53|(w|0)==54|(w|0)==55|(w|0)==56|(w|0)==57){z=0;while(1){z=(z*10&-1)+(x-48|0)|0;y=q;q=y+1|0;x=a[y]|0;if(x>>>0<=127){B=(aG(x|0)|0)!=0}else{B=0}if(!B){break}}q=q-1|0;c[u>>2]=z;break}else if((w|0)==97){r=3526;break L4291}else if((w|0)==65){r=3527;break L4291}else if((w|0)==99){r=3531;break L4291}else if((w|0)==100|(w|0)==105|(w|0)==117){r=3532;break L4291}else if((w|0)==69){r=3616;break L4291}else if((w|0)==101){r=3617;break L4291}else if((w|0)==102){r=3647;break L4291}else if((w|0)==48){if((u|0)==(n+44|0)){a[n+16|0]=48;if((c[n+20>>2]|0)==2){c[n+20>>2]=3}}else{c[u>>2]=0}break}else if((w|0)==37){r=3710;break L4291}else if((w|0)==35){c[n+28>>2]=3;break}else if((w|0)==39){break}else if((w|0)==43|(w|0)==32){a[n+40|0]=x&255;break}else if((w|0)==45){c[n+20>>2]=1;break}else{r=3737;break L4291}}while(0);if((r|0)==3649){r=0;t=x}}do{if((r|0)==3660){r=0;if((s|0)!=(e|0)){a[s]=0;u=bi[c[p>>2]&1023](d,e,c[m>>2]|0)|0;if((u|0)==-1){r=3672;break L4288}g=g+u|0}u=c[k>>2]|0;c[k>>2]=u+4|0;w=c[u>>2]|0;u=t;if((u|0)==78){y=c[k>>2]|0;c[k>>2]=y+4|0;C=c[y>>2]|0;if((C|0)>=0){D=C}else{D=-C|0}C=D;if((C|0)!=0){c[w>>2]=g;if((C-1|0)!=0){y=w+4|0;E=C-1|0;while(1){C=y;y=C+4|0;c[C>>2]=0;C=E-1|0;E=C;if((C|0)==0){break}}}}}else if((u|0)==81){eC(w,g,1)}else if((u|0)==0){c[w>>2]=g}else if((u|0)==70){dw(w,g)}else if((u|0)==116){c[w>>2]=g}else if((u|0)==122){c[w>>2]=g}else if((u|0)==90){ep(w,g)}else if((u|0)==72){a[w]=g&255}else if((u|0)==104){b[w>>1]=g&65535}else if((u|0)==106){E=g;y=w;c[y>>2]=E;c[y+4>>2]=(E|0)<0?-1:0}else if((u|0)==108){c[w>>2]=g}else if((u|0)==113){r=3684;break L4288}else if((u|0)==76){r=3685;break L4288}aS(m|0,k|0);e=q;break}else if((r|0)==3650){r=0;c[n>>2]=-10;c[n+8>>2]=5288;r=3651;break}else if((r|0)==3658){r=0;break}else if((r|0)==3706){r=0;c[n>>2]=8;r=3533;break}else if((r|0)==3707){r=0;E=c[k>>2]|0;c[k>>2]=E+4|0;break}else if((r|0)==3708){r=0;c[n>>2]=16;r=3533;break}else if((r|0)==3709){r=0;c[n>>2]=-16;r=3533;break}else if((r|0)==3737){r=0;break}else if((r|0)==3524){r=0;break}else if((r|0)==3526){r=0;c[n>>2]=16;c[n+8>>2]=8200;r=3528;break}else if((r|0)==3527){r=0;c[n>>2]=-16;c[n+8>>2]=6976;r=3528;break}else if((r|0)==3531){r=0;E=c[k>>2]|0;c[k>>2]=E+4|0;break}else if((r|0)==3532){r=0;r=3533;break}else if((r|0)==3616){r=0;c[n>>2]=-10;c[n+8>>2]=5288;r=3617;break}else if((r|0)==3647){r=0;c[n+4>>2]=1;r=3618;break}else if((r|0)==3710){r=0;break}}while(0);do{if((r|0)==3651){r=0;c[n+4>>2]=3;c[n+36>>2]=0;r=3618;break}else if((r|0)==3528){r=0;c[n+4>>2]=2;c[n+12>>2]=1;if((v|0)==0){c[n+24>>2]=-1}c[n+28>>2]=1;c[n+36>>2]=1;r=3621;break}else if((r|0)==3533){r=0;if((v|0)==0){c[n+24>>2]=-1}E=t;do{if((E|0)==106){y=c[k>>2]|0;x=y;c[k>>2]=y+8|0;break}else if((E|0)==108){y=c[k>>2]|0;c[k>>2]=y+4|0;break}else if((E|0)==76){r=3538;break L4288}else if((E|0)==78){if((s|0)!=(e|0)){a[s]=0;y=bi[c[p>>2]&1023](d,e,c[m>>2]|0)|0;if((y|0)==-1){r=3551;break L4288}g=g+y|0}y=c[k>>2]|0;c[k>>2]=y+4|0;x=c[y>>2]|0;c[(o|0)+8>>2]=x;y=c[k>>2]|0;c[k>>2]=y+4|0;C=c[y>>2]|0;if((C|0)>=0){F=C}else{F=-C|0}y=F;while(1){if((y|0)<=0){break}if((c[x+(y-1<<2)>>2]|0)!=0){r=3563;break}y=y-1|0}if((r|0)==3563){r=0}if((C|0)>=0){G=y}else{G=-y|0}c[(o|0)+4>>2]=G;H=d1(0,c[n>>2]|0,o|0)|0;r=3609;break}else if((E|0)==113){r=3570;break L4288}else if((E|0)==81){if((s|0)!=(e|0)){a[s]=0;x=bi[c[p>>2]&1023](d,e,c[m>>2]|0)|0;if((x|0)==-1){r=3583;break L4288}g=g+x|0}x=c[n>>2]|0;z=c[k>>2]|0;c[k>>2]=z+4|0;H=eD(0,x,c[z>>2]|0)|0;r=3609;break}else if((E|0)==116){z=c[k>>2]|0;c[k>>2]=z+4|0;break}else if((E|0)==122){z=c[k>>2]|0;c[k>>2]=z+4|0;break}else if((E|0)==90){if((s|0)!=(e|0)){a[s]=0;z=bi[c[p>>2]&1023](d,e,c[m>>2]|0)|0;if((z|0)==-1){r=3603;break L4288}g=g+z|0}z=c[n>>2]|0;x=c[k>>2]|0;c[k>>2]=x+4|0;H=d1(0,z,c[x>>2]|0)|0;r=3609;break}else{x=c[k>>2]|0;c[k>>2]=x+4|0;break}}while(0);if((r|0)==3609){r=0;E=hP(p,d,n,H)|0;u=c[3848]|0;w=(uJ(H|0)|0)+1|0;bl[u&1023](H,w);w=E;if((w|0)==-1){r=3611;break L4288}g=g+w|0;aS(m|0,k|0);e=q}break}else if((r|0)==3617){r=0;c[n+4>>2]=2;r=3618;break}}while(0);do{if((r|0)==3618){r=0;if((c[n+28>>2]|0)==3){c[n+32>>2]=1;c[n+36>>2]=1}r=3621;break}}while(0);if((r|0)==3621){r=0;v=t;if((v|0)==70){if((s|0)!=(e|0)){a[s]=0;w=bi[c[p>>2]&1023](d,e,c[m>>2]|0)|0;if((w|0)==-1){r=3634;break}g=g+w|0}w=aK(50)|0;E=c[k>>2]|0;c[k>>2]=E+4|0;u=hO(p,d,n,w,c[E>>2]|0)|0;if((u|0)==-1){r=3641;break}g=g+u|0;aS(m|0,k|0);e=q}else if((v|0)==76){r=3644;break}else{v=c[k>>2]|0;u=v;c[k>>2]=v+8|0;}}}L4535:do{if((r|0)==3684){dF(6280,464,5416);return 0}else if((r|0)==3685){dF(6280,469,5792);return 0}else if((r|0)!=3672)if((r|0)==3521){if((a[e]|0|0)!=0){k=bi[c[p>>2]&1023](d,e,c[m>>2]|0)|0;if((k|0)==-1){break}g=g+k|0}do{if((c[p+12>>2]|0)!=0){if((bm[c[p+12>>2]&1023](d)|0)==-1){break L4535}else{break}}}while(0);I=c[3848]|0;J=f;K=j;bl[I&1023](J,K);L=g;i=h;return L|0}else if((r|0)==3538){dF(6280,285,5792);return 0}else if((r|0)!=3551)if((r|0)==3570){dF(6280,312,5416);return 0}else if((r|0)!=3583)if((r|0)!=3603)if((r|0)!=3611)if((r|0)!=3634)if((r|0)!=3641)if((r|0)==3644){dF(6280,378,5024);return 0}}while(0);g=-1;I=c[3848]|0;J=f;K=j;bl[I&1023](J,K);L=g;i=h;return L|0}function hO(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;h=i;i=i+56|0;j=h|0;k=h+8|0;l=b;b=d;d=e;e=f;f=g;g=0;m=c[d+24>>2]|0;if((m|0)<=-1){n=0;if((c[d+4>>2]|0)==3){o=c[(10008+((c[f>>2]|0)*20&-1)|0)+4>>2]|0;if((c[d>>2]|0)>=0){p=c[d>>2]|0}else{p=-(c[d>>2]|0)|0}q=p-1<<5;p=o&65535;r=o>>>16;o=q&65535;s=q>>>16;q=ab(p,o);t=ab(p,s);p=ab(r,o);o=ab(r,s);t=t+(q>>>16)|0;t=t+p|0;if(t>>>0<p>>>0){o=o+65536|0}m=(o+(t>>>16)|0)+2|0}}else{t=c[d+4>>2]|0;do{if((t|0)==3){u=3791}else if((t|0)==1){if((c[d>>2]|0)>=0){v=c[d>>2]|0}else{v=-(c[d>>2]|0)|0}n=((m+2|0)+1|0)+ab(c[f+8>>2]|0,(c[10008+(v*20&-1)>>2]|0)+((c[f+8>>2]|0)>=0&1)|0)|0;if((n|0)>1){x=n}else{x=1}n=x;break}else if((t|0)==2){n=m+1|0;break}else{u=3791;break}}while(0);if((u|0)==3791){if((m|0)>1){y=m}else{y=1}n=y}}y=dK(0,j,c[d>>2]|0,n,f)|0;f=uJ(y|0)|0;n=y;t=f+1|0;x=a[d+40|0]|0;if((a[y|0]|0|0)==45){x=a[y|0]|0;y=y+1|0;f=f-1|0}v=(x|0)!=0&1;o=c[d+4>>2]|0;do{if((o|0)==1){if((m|0)<=-1){if(0>(f-(c[j>>2]|0)|0)){z=0}else{z=f-(c[j>>2]|0)|0}m=z}p=(c[j>>2]|0)+m|0;if((p|0)<0){f=0;c[j>>2]=0}else{if(!((f|0)<=(p|0))){q=(c[d>>2]|0)>=0?5672:8160;if((c[d>>2]|0)>=0){A=c[d>>2]|0}else{A=-(c[d>>2]|0)|0}s=A;f=p;if((aG(a[y+f|0]|0|0)|0)!=0){B=(a[y+f|0]|0)-48|0}else{if((bf(a[y+f|0]|0|0)|0)!=0){C=((a[y+f|0]|0)-97|0)+10|0}else{C=((a[y+f|0]|0)-65|0)+10|0}B=C}p=B;if((p|0)>=((s+1|0)/2&-1|0)){while(1){if((f|0)==0){u=3826;break}if((aG(a[y+(f-1|0)|0]|0|0)|0)!=0){D=(a[y+(f-1|0)|0]|0)-48|0}else{if((bf(a[y+(f-1|0)|0]|0|0)|0)!=0){E=((a[y+(f-1|0)|0]|0)-97|0)+10|0}else{E=((a[y+(f-1|0)|0]|0)-65|0)+10|0}D=E}p=D;p=p+1|0;if((p|0)!=(s|0)){u=3836;break}f=f-1|0}if((u|0)==3826){a[y|0]=49;f=1;c[j>>2]=(c[j>>2]|0)+1|0}else if((u|0)==3836){a[y+(f-1|0)|0]=a[q+p|0]|0}}else{while(1){if((f|0)>0){F=(a[y+(f-1|0)|0]|0|0)==48}else{F=0}if(!F){break}f=f-1|0}}if((f|0)==0){c[j>>2]=0}}}u=3850;break}else if((o|0)==2){if((m|0)<=-1){if(0>(f-1|0)){G=0}else{G=f-1|0}m=G}u=3865;break}else if((o|0)==3){u=3879}else{u=3879;break}}while(0);L4696:do{if((u|0)==3879){do{if(((c[j>>2]|0)-1|0)>=-4){if(1>(m|0)){H=1}else{H=m}if(((c[j>>2]|0)-1|0)>=(H|0)){break}u=3850;break L4696}}while(0);u=3865;break}}while(0);if((u|0)==3865){if(1<(f|0)){I=1}else{I=f}J=I;K=(J|0)==0?1:0;L=0;M=f-J|0;I=(c[j>>2]|0)-J|0;if((c[d+12>>2]|0)!=0){I=I<<2}H=((I|0)>=0?43:45)&255;if((I|0)>=0){N=I}else{N=-I|0}I=N;O=ay(k|0,42,c[d+8>>2]|0,(w=i,i=i+16|0,c[w>>2]=H<<24>>24,c[w+8>>2]=I,w)|0)|0}else if((u|0)==3850){if((c[j>>2]|0)<=0){J=0;K=1;L=-(c[j>>2]|0)|0;M=f}else{if((f|0)<(c[j>>2]|0)){P=f}else{P=c[j>>2]|0}J=P;K=(c[j>>2]|0)-J|0;L=0;M=f-J|0}O=0}if((c[d+36>>2]|0)!=0){if((c[d+4>>2]|0)==3){Q=J+K|0}else{Q=0}R=m-((L+M|0)+Q|0)|0;if(0>(R|0)){S=0}else{S=R}R=S}else{R=0}do{if(((L+M|0)+R|0)!=0){u=3899}else{if((c[d+32>>2]|0)!=0){u=3899;break}T=0;break}}while(0);if((u|0)==3899){T=uJ(e|0)|0}S=T;T=0;Q=0;m=c[d+28>>2]|0;L4753:do{if((m|0)==1){u=3910}else if((m|0)==2){u=3905}else if((m|0)==3){do{if((J|0)==0){if((M|0)!=0){break}break L4753}}while(0);u=3910;break}else{u=3905;break}}while(0);if((u|0)==3910){m=c[d>>2]|0;if((m|0)==16){T=6968;Q=2}else if((m|0)==(-16|0)){T=6272;Q=2}else if((m|0)==8){T=5784;Q=1}}m=(c[d+44>>2]|0)-((((((((v+Q|0)+J|0)+K|0)+S|0)+L|0)+M|0)+R|0)+O|0)|0;f=c[d+20>>2]|0;if((m|0)<=0){f=0}do{if((f|0)==2){j=bi[c[l+8>>2]&1023](b,a[d+16|0]|0,m)|0;if((j|0)==-1){break}g=g+j|0;u=3927;break}else{u=3927}}while(0);do{if((u|0)==3927){if((v|0)!=0){j=bi[c[l+8>>2]&1023](b,x,1)|0;if((j|0)==-1){break}g=g+j|0}if((Q|0)!=0){j=bi[c[l+4>>2]&1023](b,T,Q)|0;if((j|0)==-1){break}g=g+j|0}if((f|0)==3){j=bi[c[l+8>>2]&1023](b,a[d+16|0]|0,m)|0;if((j|0)==-1){break}g=g+j|0}j=bi[c[l+4>>2]&1023](b,y,J)|0;if((j|0)==-1){break}g=g+j|0;if((K|0)!=0){j=bi[c[l+8>>2]&1023](b,48,K)|0;if((j|0)==-1){break}g=g+j|0}if((S|0)!=0){j=bi[c[l+4>>2]&1023](b,e,S)|0;if((j|0)==-1){break}g=g+j|0}if((L|0)!=0){j=bi[c[l+8>>2]&1023](b,48,L)|0;if((j|0)==-1){break}g=g+j|0}if((M|0)!=0){j=bi[c[l+4>>2]&1023](b,y+J|0,M)|0;if((j|0)==-1){break}g=g+j|0}if((R|0)!=0){j=bi[c[l+8>>2]&1023](b,48,R)|0;if((j|0)==-1){break}g=g+j|0}if((O|0)!=0){j=bi[c[l+4>>2]&1023](b,k|0,O)|0;if((j|0)==-1){break}g=g+j|0}if((f|0)==1){j=bi[c[l+8>>2]&1023](b,a[d+16|0]|0,m)|0;if((j|0)==-1){break}g=g+j|0}U=c[3848]|0;V=n;W=t;bl[U&1023](V,W);X=g;i=h;return X|0}}while(0);g=-1;U=c[3848]|0;V=n;W=t;bl[U&1023](V,W);X=g;i=h;return X|0}function hP(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;b=d;d=e;e=f;f=0;h=a[d+40|0]|0;if((a[e|0]|0|0)==45){h=a[e|0]|0;e=e+1|0}i=(h|0)!=0&1;do{if((a[e]|0|0)==48){if((c[d+24>>2]|0)!=0){break}e=e+1|0}}while(0);j=uJ(e|0)|0;k=aL(e|0,47)|0;l=0;m=0;if((c[d+28>>2]|0)!=2){n=c[d>>2]|0;if((n|0)==(-16|0)){l=8152;m=2}else if((n|0)==8){l=6960;m=1}else if((n|0)==16){l=5608;m=2}}n=m;do{if((k|0)==0){o=4068}else{if((c[d+28>>2]|0)!=3){break}if((a[k+1|0]|0|0)==48){o=4068;break}else{break}}}while(0);if((o|0)==4068){n=0}do{if((c[d+28>>2]|0)==3){if((a[e|0]|0|0)!=48){break}m=0}}while(0);if(0>((c[d+24>>2]|0)-j|0)){p=0}else{p=(c[d+24>>2]|0)-j|0}q=p;p=c[d+44>>2]|0;r=p-(((((uJ(e|0)|0)+i|0)+m|0)+n|0)+q|0)|0;p=c[d+20>>2]|0;if((r|0)<=0){p=0}do{if((p|0)==2){s=bi[c[g+8>>2]&1023](b,a[d+16|0]|0,r)|0;if((s|0)==-1){break}f=f+s|0;o=4087;break}else{o=4087}}while(0);do{if((o|0)==4087){if((i|0)!=0){s=bi[c[g+8>>2]&1023](b,h,i)|0;if((s|0)==-1){break}f=f+s|0}if((m|0)!=0){s=bi[c[g+4>>2]&1023](b,l,m)|0;if((s|0)==-1){break}f=f+s|0}if((q|0)!=0){s=bi[c[g+8>>2]&1023](b,48,q)|0;if((s|0)==-1){break}f=f+s|0}if((p|0)==3){s=bi[c[g+8>>2]&1023](b,a[d+16|0]|0,r)|0;if((s|0)==-1){break}f=f+s|0}if((n|0)!=0){s=(k+1|0)-e|0;t=bi[c[g+4>>2]&1023](b,e,s)|0;if((t|0)==-1){break}f=f+t|0;j=j-s|0;e=e+s|0;s=bi[c[g+4>>2]&1023](b,l,n)|0;if((s|0)==-1){break}f=f+s|0}s=bi[c[g+4>>2]&1023](b,e,j)|0;if((s|0)==-1){break}f=f+s|0;if((p|0)==1){s=bi[c[g+8>>2]&1023](b,a[d+16|0]|0,r)|0;if((s|0)==-1){break}f=f+s|0}u=f;return u|0}}while(0);f=-1;u=f;return u|0}function hQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=f;c[g>>2]=d;c[g+4>>2]=0;g=hN(15400,a,b,c[f>>2]|0)|0;i=e;return g|0}function hR(a,b,c){a=a|0;b=b|0;c=c|0;return aR(b|0,1,c|0,a|0)|0}function hS(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+256|0;e=d|0;f=a;a=c;if(a>>>0<256){g=a}else{g=256}uI(e|0,b&255|0,g|0);g=a;while(1){if((g|0)<=0){h=4194;break}if(g>>>0<256){j=g}else{j=256}k=aR(e|0,1,j|0,f|0)|0;if((k|0)==-1){h=4189;break}g=g-256|0}if((h|0)==4189){g=k;k=g;i=d;return k|0}else if((h|0)==4194){g=a;k=g;i=d;return k|0}return 0}function hT(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f|0;h=f+8|0;j=h;c[j>>2]=e;c[j+4>>2]=0;c[g>>2]=a;c[g+4>>2]=b;b=hN(15152,g,d,c[h>>2]|0)|0;i=f;return b|0}function hU(b){b=b|0;var d=0;d=b;if(!((c[d+4>>2]|0)>>>0>=1)){return 0}a[c[d>>2]|0]=0;return 0}function hV(a){a=a|0;var b=0,d=0;b=a;a=0;while(1){if((a|0)>=227){break}d=c[b+(a<<2)>>2]&-2147483648|c[b+(a+1<<2)>>2]&2147483647;c[b+(a<<2)>>2]=c[b+(a+397<<2)>>2]^d>>>1^((d&1|0)!=0?-1727483681:0);a=a+1|0}while(1){if((a|0)>=623){break}d=c[b+(a<<2)>>2]&-2147483648|c[b+(a+1<<2)>>2]&2147483647;c[b+(a<<2)>>2]=c[b+(a-227<<2)>>2]^d>>>1^((d&1|0)!=0?-1727483681:0);a=a+1|0}d=c[b+2492>>2]&-2147483648|c[b>>2]&2147483647;c[b+2492>>2]=c[b+1584>>2]^d>>>1^((d&1|0)!=0?-1727483681:0);return}function hW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=a;a=b;c[f>>2]=d;d=c[h+4>>2]|0;if((d|0)>1){aS(g|0,f|0);j=az(c[h>>2]|0,d|0,a|0,c[g>>2]|0)|0;if((j|0)==-1){j=d-1|0}if((j|0)<(d-1|0)){k=j}else{k=d-1|0}b=k;k=h+4|0;c[k>>2]=(c[k>>2]|0)-b|0;k=h|0;c[k>>2]=(c[k>>2]|0)+b|0;if((j|0)!=(d-1|0)){l=j;m=l;i=e;return m|0}if(128>(j|0)){n=128}else{n=j}o=n}else{o=128}while(1){o=o<<1;n=bm[c[4008]&1023](o)|0;aS(g|0,f|0);j=az(n|0,o|0,a|0,c[g>>2]|0)|0;bl[c[3848]&1023](n,o);if((j|0)==(o-1|0)){p=1}else{p=(j|0)==-1}if(!p){break}}l=j;m=l;i=e;return m|0}function hX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=d;if((c[e+4>>2]|0)>>>0<=1){f=a;return f|0}if(((c[e+4>>2]|0)-1|0)>>>0<a>>>0){g=(c[e+4>>2]|0)-1|0}else{g=a}d=g;uK(c[e>>2]|0,b|0,d);b=e|0;c[b>>2]=(c[b>>2]|0)+d|0;b=e+4|0;c[b>>2]=(c[b>>2]|0)-d|0;f=a;return f|0}function hY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=d;if((c[e+4>>2]|0)>>>0<=1){f=a;return f|0}if(((c[e+4>>2]|0)-1|0)>>>0<a>>>0){g=(c[e+4>>2]|0)-1|0}else{g=a}d=g;uI(c[e>>2]|0,b&255|0,d|0);b=e|0;c[b>>2]=(c[b>>2]|0)+d|0;b=e+4|0;c[b>>2]=(c[b>>2]|0)-d|0;f=a;return f|0}function hZ(a){a=a|0;h2(a);return}function h_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a;a=b;b=d;d=(c[(e|0)+8>>2]|0)+2496|0;f=c[(e|0)+8>>2]|0;e=(b>>>0)/32>>>0;g=(b>>>0)%32;b=0;while(1){if((b|0)>=(e|0)){break}if((c[d>>2]|0)>=624){hV(f);c[d>>2]=0}h=d;i=c[h>>2]|0;c[h>>2]=i+1|0;j=c[f+(i<<2)>>2]|0;j=j^j>>>11;j=j^j<<7&-1658038656;j=j^j<<15&-272236544;j=j^j>>>18;c[a+(b<<2)>>2]=j;b=b+1|0}if((g|0)==0){return}if((c[d>>2]|0)>=624){hV(f);c[d>>2]=0}b=d;d=c[b>>2]|0;c[b>>2]=d+1|0;j=c[f+(d<<2)>>2]|0;j=j^j>>>11;j=j^j<<7&-1658038656;j=j^j<<15&-272236544;j=j^j>>>18;c[a+(e<<2)>>2]=j&(-1<<g^-1);return}function h$(a){a=a|0;var b=0;b=a;bl[c[3848]&1023](c[(b|0)+8>>2]|0,c[b>>2]<<2);return}function h0(a,b){a=a|0;b=b|0;var d=0;d=a;c[d+16>>2]=16048;a=bm[c[4008]&1023](2500)|0;c[(d|0)+8>>2]=a;c[d>>2]=625;d=c[(b|0)+8>>2]|0;b=0;while(1){if((b|0)>=624){break}c[(a|0)+(b<<2)>>2]=c[(d|0)+(b<<2)>>2]|0;b=b+1|0}c[a+2496>>2]=c[d+2496>>2]|0;return}function h1(a){a=a|0;var b=0;b=a;c[b+16>>2]=16048;a=bm[c[4008]&1023](2500)|0;c[(b|0)+8>>2]=a;c[b>>2]=625;b=0;while(1){if((b|0)>=624){break}c[(a|0)+(b<<2)>>2]=c[1376+(b<<2)>>2]|0;b=b+1|0}c[a+2496>>2]=128;return}function h2(a){a=a|0;var b=0;b=a;h1(b);c[b+16>>2]=16064;return}function h3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+40|0;e=d|0;f=d+8|0;g=d+24|0;h=c[(a|0)+8>>2]|0;d3(f|0);d3(g|0);eq(f|0,0);ev(f|0,19937);ex(f|0,f|0,20027);d8(g|0,b,f|0);dN(g|0,g|0,2);h7(g|0,g|0);c[h>>2]=(eB(g|0,19936)|0)!=0?-2147483648:0;dV(g|0,19936);dZ((h|0)+4|0,e,-1,4,0,0,g|0);c[e>>2]=(c[e>>2]|0)+1|0;while(1){if((c[e>>2]|0)>>>0>=624){break}b=c[e>>2]|0;c[e>>2]=b+1|0;c[(h|0)+(b<<2)>>2]=0}dU(f|0);dU(g|0);g=0;while(1){if((g|0)>=3){break}hV(h|0);g=g+1|0}c[h+2496>>2]=128;i=d;return}function h4(a){a=a|0;return 0}function h5(a,b){a=a|0;b=b|0;return 0}function h6(a){a=a|0;var b=0,d=0;b=a;if((c[b+4>>2]|0)<0){d=-1}else{d=(c[b+4>>2]|0)>0&1}return((d|0)!=0^1)&1|0}function h7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+32|0;e=d|0;f=d+16|0;g=a;a=1074888996;h=536870912;d3(e|0);d5(f|0,b);er(g,f|0);while(1){d9(g,g,g);while(1){while(1){ey(e|0,g,19937);if((c[(e|0)+4>>2]|0)<0){j=-1}else{j=(c[(e|0)+4>>2]|0)>0&1}if((j|0)==0){break}ez(g,g,19937);dP(g,e|0,20023)}if((a&h|0)==0){break}a=a&(h^-1);d9(g,g,f|0)}h=h>>>1;if((h|0)==0){break}}dU(e|0);dU(f|0);i=d;return}function h8(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[c[d+16>>2]>>2]&1023](d,b);return}function h9(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+24|0;e=d|0;f=d+16|0;c[f>>2]=b;c[(e|0)+8>>2]=f|0;c[(e|0)+4>>2]=(c[f>>2]|0)!=0&1;h8(a,e|0);i=d;return}function ia(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function ib(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function ic(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function id(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function ie(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function ig(a){a=a|0;var b=0;b=a;c[b+208>>2]=bm[c[198]&1023](8)|0;ib(c[b+208>>2]|0,b);while(1){ih(c[b+208>>2]|0);if((ii(c[b+208>>2]|0)|0)==0){break}}return}function ih(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+128>>2]&1023](b);return}function ii(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+52>>2]&1023](b)|0}function ij(a){a=a|0;var b=0;b=a;if((c[b+208>>2]|0)==0){ig(b)}return c[b+208>>2]|0}function ik(a,b){a=a|0;b=b|0;var d=0;d=b;bl[c[d+176>>2]&1023](a,d);return}function il(a){a=a|0;var b=0;b=a;c[b+208>>2]=0;d3(b+196|0);c[b>>2]=722;c[b+176>>2]=86;c[b+108>>2]=298;c[b+96>>2]=174;c[b+112>>2]=748;c[b+84>>2]=10;c[b+88>>2]=46;c[b+148>>2]=164;c[b+44>>2]=704;c[b+92>>2]=730;c[b+80>>2]=186;c[b+172>>2]=158;c[b+12>>2]=110;c[b+16>>2]=120;c[b+128>>2]=690;c[b+76>>2]=26;c[b+136>>2]=252;c[b+140>>2]=254;c[b+60>>2]=402;c[b+64>>2]=760;c[b+68>>2]=194;c[b+72>>2]=196;c[b+116>>2]=726;c[b+180>>2]=28;c[b+184>>2]=556;c[b+188>>2]=480;c[b+168>>2]=238;c[b+32>>2]=14;c[b+192>>2]=0;return}function im(a){a=a|0;var b=0;b=i;oq(7328,(w=i,i=i+8|0,c[w>>2]=a,w)|0);i=b;return}function io(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=b;oz(a,8960,(w=i,i=i+16|0,c[w>>2]=e,c[w+8>>2]=e+196|0,w)|0);i=d;return}function ip(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=a;ib(e|0,c[f>>2]|0);ja(e|0,2);iR(e|0,e|0);ic(f,b,e|0);ie(e|0);i=d;return}function iq(a,b){a=a|0;b=b|0;var c=0;c=b;i6(a,c,c);return}function ir(a,b){a=a|0;b=b|0;var c=0;c=b;ic(a,c,c);return}function is(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;ib(f|0,c[g>>2]|0);i5(f|0,d);ic(g,b,f|0);ie(f|0);i=e;return}function it(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;ib(f|0,c[g>>2]|0);ja(f|0,d);ic(g,b,f|0);ie(f|0);i=e;return}function iu(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;a=b;if((d|0)==(a|0)){e=0;f=e;return f|0}b=i8(d)|0;if((b|0)!=(i8(a)|0)){e=1;f=e;return f|0}else{g=bm[c[198]&1023](b)|0;h=bm[c[198]&1023](b)|0;i=g;j=d;i9(i,j);j=h;i=a;i9(j,i);i=uN(g|0,h|0,b|0)|0;bk[c[200]&1023](g);bk[c[200]&1023](h);e=i;f=e;return f|0}return 0}function iv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;if((g|0)!=(a|0)){i7(g,b);i6(g,g,a);i=e;return}else{ib(f|0,c[a>>2]|0);i7(f|0,b);i6(g,f|0,a);ie(f|0);i=e;return}}function iw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;if((g|0)!=(a|0)){iR(g,b);ic(g,g,a);i=e;return}else{ib(f|0,c[a>>2]|0);iR(f|0,b);ic(g,f|0,a);ie(f|0);i=e;return}}function ix(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=a;ib(f|0,c[h>>2]|0);d3(g|0);eq(g|0,d);i5(f|0,g|0);i6(h,b,f|0);dU(g|0);ie(f|0);i=e;return}function iy(a,b){a=a|0;b=b|0;eq(a,0);return}function iz(a,b){a=a|0;b=b|0;iX(a);return}function iA(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;i=i+16|0;d=c|0;d3(d|0);kT(d|0,b);i5(a,d|0);dU(d|0);i=c;return}function iB(a){a=a|0;iX(a);return}function iC(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;i=i+16|0;d=c|0;d3(d|0);ep(d|0,b);i5(a,d|0);dU(d|0);i=c;return}function iD(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+8|0;d=b|0;e=a;ib(d|0,c[e>>2]|0);ia(d|0);a=i4(e,d|0)|0;ie(d|0);i=b;return a|0}function iE(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+8|0;d=b|0;e=a;ib(d|0,c[e>>2]|0);a=i4(e,d|0)|0;ie(d|0);i=b;return a|0}function iF(a){a=a|0;return i3(a,0)|0}function iG(a){a=a|0;return i3(a,1)|0}function iH(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=a;a=c;if((h6(a)|0)!=0){ia(d);return}else{c=i_(a)|0;e=i$(b,c)|0;i0(d,a,c,e);i1(c,e);return}}function iI(a,b){a=a|0;b=b|0;var d=0;d=b;c[a+4>>2]=iZ(d,eu((c[d>>2]|0)+196|0,2)|0,5)|0;return}function iJ(b,c,d){b=b|0;c=c|0;d=d|0;d=b;b=c;if((b|0)==1){a[d|0]=48;return 1}if(b>>>0>=2){a[d|0]=63;a[d+1|0]=0}return 1}function iK(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=c[a+4>>2]|0;a=1<<c[b>>2];d=c[b+12>>2]|0;e=0;while(1){if((e|0)>=(c[b+8>>2]|0)){break}f=c[d+(e<<2)>>2]|0;g=0;while(1){if((g|0)>=(a|0)){break}ie(f+(g<<3)|0);g=g+1|0}bk[c[200]&1023](f);e=e+1|0}bk[c[200]&1023](d);bk[c[200]&1023](b);return}function iL(a,b,d){a=a|0;b=b|0;d=d|0;iY(a,b,c[d+4>>2]|0);return}function iM(a,b,c){a=a|0;b=b|0;c=c|0;iX(a);return 0}function iN(a){a=a|0;var b=0;b=a;if((c[b+208>>2]|0)!=0){ie(c[b+208>>2]|0);bk[c[200]&1023](c[b+208>>2]|0)}dU(b+196|0);bk[c[b>>2]&1023](b);return}function iO(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;do{if((c[b+4>>2]|0)<0){if(1){f=4411;break}else{f=4412;break}}else{if((c[b+4>>2]|0)>0){f=4411;break}else{f=4412;break}}}while(0);if((f|0)==4412){uI(e|0,0,a|0);return}else if((f|0)==4411){f=(((eu(b,2)|0)+7|0)>>>0)/8>>>0;dZ(e+(a-f|0)|0,0,1,1,1,0,b);uI(e|0,0,a-f|0);return}}function iP(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;g=b;b=c;c=d;d=e;e=0;h=(((eu(b,2)|0)+7|0)>>>0)/8>>>0;j=bb()|0;k=i;i=i+h|0;i=i+7>>3<<3;l=0;m=0;while(1){if(d>>>0>=(h-e|0)>>>0){n=h-e|0;m=1}else{n=d}uK(k+e|0,c|0,n);e=e+n|0;if((m|0)!=0){o=4421;break}a[k+e|0]=l;l=l+1&255;e=e+1|0;if((e|0)==(h|0)){o=4423;break}}d2(g,h,1,1,1,0,k);while(1){if((dR(g,b)|0)<=0){break}ey(g,g,1)}aN(j|0);i=f;return}function iQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+64|0;e=d|0;f=d+16|0;g=d+32|0;h=d+48|0;j=d+56|0;k=a;a=b;d3(f|0);d3(e|0);d3(g|0);ib(h|0,c[a>>2]|0);ib(j|0,c[a>>2]|0);b=ij(c[a>>2]|0)|0;iR(h|0,b);ex(f|0,(c[a>>2]|0)+196|0,1);l=en(f|0,0)|0;ey(f|0,f|0,l);eq(e|0,0);m=2;while(1){if(!((m|0)<=(l|0))){break}ex(g|0,(c[a>>2]|0)+196|0,1);ey(g|0,g|0,m);iS(j|0,h|0,e|0);ic(j|0,j|0,a);iS(j|0,j|0,g|0);if((iT(j|0)|0)==0){ev(e|0,m-1|0)}m=m+1|0}iS(j|0,h|0,e|0);ic(j|0,j|0,a);dN(f|0,f|0,1);ey(f|0,f|0,1);ey(e|0,e|0,1);iS(j|0,j|0,f|0);iS(k,b,e|0);ic(k,k,j|0);dU(f|0);dU(e|0);dU(g|0);ie(h|0);ie(j|0);i=d;return}function iR(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function iS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function iT(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function iU(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b;b=c;c=d;d=0;eq(e,0);L5383:do{if((c|0)!=0){do{if((c|0)>=2){if((c|0)>36){break}f=c;break L5383}}while(0);g=0;h=g;return h|0}else{f=10}}while(0);while(1){c=a[b+d|0]|0;if(c<<24>>24==0){i=4448;break}if((a_(c<<24>>24|0)|0)!=0){d=d+1|0;continue}if((aG(c<<24>>24|0)|0)!=0){j=(c<<24>>24)-48|0}else{do{if((c<<24>>24|0)>=65){if(!((c<<24>>24|0)<=90)){i=4456;break}j=(c<<24>>24)-65|0;break}else{i=4456}}while(0);if((i|0)==4456){i=0;if(!((c<<24>>24|0)>=97)){i=4459;break}if(!((c<<24>>24|0)<=122)){i=4459;break}j=(c<<24>>24)-97|0}}if((j|0)>=(f|0)){i=4463;break}ec(e,e,f);dN(e,e,j);d=d+1|0}g=d;h=g;return h|0}function iV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=b;b=d;d=bm[c[198]&1023](b<<2)|0;f=bm[c[198]&1023](b<<2)|0;g=0;while(1){if((g|0)>=(b|0)){break}c[d+(g<<2)>>2]=e+(g<<3)|0;c[f+(g<<2)>>2]=a+(g<<3)|0;g=g+1|0}bn[c[(c[e>>2]|0)+100>>2]&1023](d,f,b);bk[c[200]&1023](d);bk[c[200]&1023](f);return}function iW(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=a;a=b;b=d;d=e;e=d<<2;g=bm[c[198]&1023](e)|0;h=bm[c[198]&1023](e)|0;i=bm[c[198]&1023](e)|0;e=0;while(1){if((e|0)>=(d|0)){break}c[g+(e<<2)>>2]=f+(e<<3)|0;c[h+(e<<2)>>2]=a+(e<<3)|0;c[i+(e<<2)>>2]=b+(e<<3)|0;e=e+1|0}bs[c[(c[f>>2]|0)+104>>2]&1023](g,h,i,d);bk[c[200]&1023](g);bk[c[200]&1023](h);bk[c[200]&1023](i);return}function iX(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function iY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=a;a=d;d5(g|0,b);do{if((c[(g|0)+4>>2]|0)<0){if(1){break}else{j=4483;break}}else{if((c[(g|0)+4>>2]|0)>0){break}else{j=4483;break}}}while(0);if((j|0)==4483){ia(h);i=e;return}if((dR(g|0,(c[h>>2]|0)+196|0)|0)>0){d8(g|0,g|0,(c[h>>2]|0)+196|0)}ib(f|0,c[h>>2]|0);ia(f|0);j=eu(g|0,2)|0;b=((j>>>0)/((c[a>>2]|0)>>>0)>>>0)+1|0;j=0;while(1){if((j|0)>=(b|0)){break}d=0;k=0;while(1){if((k|0)>=(c[a>>2]|0)){break}d=d|eB(g|0,ab(c[a>>2]|0,j)+k|0)<<k;k=k+1|0}if((d|0)>0){ic(f|0,f|0,(c[(c[a+12>>2]|0)+(j<<2)>>2]|0)+(d<<3)|0)}j=j+1|0}id(h,f|0);ie(f|0);dU(g|0);i=e;return}function iZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;d=1<<b;h=bm[c[198]&1023](16)|0;c[h+8>>2]=((a|0)/(b|0)&-1)+1|0;c[h>>2]=b;c[h+4>>2]=a;c[h+12>>2]=bm[c[198]&1023](c[h+8>>2]<<2)|0;ib(f|0,c[g>>2]|0);id(f|0,g);a=0;while(1){if((a|0)>=(c[h+8>>2]|0)){break}b=bm[c[198]&1023](d<<3)|0;ib(b|0,c[g>>2]|0);ia(b|0);j=1;while(1){if((j|0)>=(d|0)){break}ib(b+(j<<3)|0,c[g>>2]|0);ic(b+(j<<3)|0,f|0,b+(j-1<<3)|0);j=j+1|0}ic(f|0,f|0,b+(d-1<<3)|0);c[(c[h+12>>2]|0)+(a<<2)>>2]=b;a=a+1|0}ie(f|0);i=e;return h|0}function i_(a){a=a|0;var b=0,c=0,d=0,e=0,f=0,g=0;b=eu(a,2)|0;if((b|0)>9065){c=8;return c|0}if((b|0)>3529){d=7}else{if((b|0)>1324){e=6}else{if((b|0)>474){f=5}else{if((b|0)>157){g=4}else{g=(b|0)>47?3:2}f=g}e=f}d=e}c=d;return c|0}function i$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;if((a|0)<1){e=0;f=e;return f|0}b=1<<a;a=bm[c[198]&1023](b<<3)|0;ib(a|0,c[d>>2]|0);ia(a|0);g=1;while(1){if((g|0)>=(b|0)){break}ib(a+(g<<3)|0,c[d>>2]|0);ic(a+(g<<3)|0,a+(g-1<<3)|0,d);g=g+1|0}e=a;f=e;return f|0}function i0(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+8|0;g=f|0;h=a;a=b;b=d;d=e;e=0;j=0;do{if((c[a+4>>2]|0)<0){if(1){break}else{k=4540;break}}else{if((c[a+4>>2]|0)>0){break}else{k=4540;break}}}while(0);if((k|0)==4540){ia(h);i=f;return}ib(g|0,c[h>>2]|0);ia(g|0);l=0;m=(eu(a,2)|0)-1|0;while(1){if(!((m|0)>=0)){break}i2(g|0,g|0);n=eB(a,m)|0;do{if((l|0)!=0){k=4546}else{if((n|0)!=0){k=4546;break}break}}while(0);if((k|0)==4546){k=0;if((l|0)!=0){e=(e<<1)+n|0;j=j+1|0}else{l=1;e=1;j=1}do{if((j|0)==(b|0)){k=4551}else{if((m|0)==0){k=4551;break}else{break}}}while(0);if((k|0)==4551){k=0;ic(g|0,g|0,d+(e<<3)|0);l=0}}m=m-1|0}id(h,g|0);ie(g|0);i=f;return}function i1(a,b){a=a|0;b=b|0;var d=0;d=b;b=1<<a;a=0;while(1){if((a|0)>=(b|0)){break}ie(d+(a<<3)|0);a=a+1|0}bk[c[200]&1023](d);return}function i2(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function i3(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+64>>2]&1023](d,b)|0}function i4(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+148>>2]&1023](d,b)|0}function i5(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function i6(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function i7(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function i8(a){a=a|0;var b=0,d=0;b=a;if((c[(c[b>>2]|0)+164>>2]|0)<0){a=bm[c[(c[b>>2]|0)+160>>2]&1023](b)|0;d=a;return d|0}else{a=c[(c[b>>2]|0)+164>>2]|0;d=a;return d|0}return 0}function i9(a,b){a=a|0;b=b|0;var d=0;d=b;return bq[c[(c[d>>2]|0)+152>>2]&1023](a,d)|0}function ja(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function jb(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;il(d);c[d+4>>2]=620;c[d+8>>2]=292;c[d+76>>2]=600;c[d+12>>2]=348;c[d+36>>2]=240;c[d+168>>2]=440;c[d+32>>2]=90;c[d+144>>2]=((c[a+4>>2]|0)!=0&1&c[c[a+8>>2]>>2]|0)!=0?580:530;c[d+40>>2]=82;c[d+44>>2]=614;c[d+20>>2]=222;c[d+112>>2]=638;c[d+96>>2]=388;c[d+108>>2]=190;c[d+48>>2]=496;c[d+84>>2]=740;c[d+88>>2]=384;c[d+116>>2]=184;c[d+124>>2]=346;c[d+148>>2]=764;c[d+120>>2]=502;c[d+128>>2]=132;c[d+132>>2]=776;c[d+136>>2]=372;c[d+140>>2]=374;c[d+24>>2]=216;c[d+28>>2]=218;c[d+52>>2]=490;c[d+56>>2]=8;c[d>>2]=512;c[d+152>>2]=432;c[d+156>>2]=796;c[d+172>>2]=286;c[d+176>>2]=510;er(d+196|0,a);c[d+212>>2]=0;c[d+164>>2]=(((eu(a,2)|0)+7|0)>>>0)/8>>>0;return}function jc(a){a=a|0;var b=0;b=a;c[b+4>>2]=bm[c[198]&1023](12)|0;d3(c[b+4>>2]|0);return}function jd(a){a=a|0;var b=0;b=a;dU(c[b+4>>2]|0);bk[c[200]&1023](c[b+4>>2]|0);return}function je(a){a=a|0;return}function jf(a){a=a|0;var b=0,d=0;b=a;if((c[b+4>>2]|0)<0){d=-1}else{d=(c[b+4>>2]|0)>0&1}return((d|0)!=0^1)&1|0}function jg(a,b){a=a|0;b=b|0;var d=0;d=a;ep(c[d+4>>2]|0,b);d8(c[d+4>>2]|0,c[d+4>>2]|0,(c[d>>2]|0)+196|0);return}function jh(a,b){a=a|0;b=b|0;var d=0;d=a;er(c[d+4>>2]|0,b);d8(c[d+4>>2]|0,c[d+4>>2]|0,(c[d>>2]|0)+196|0);return}function ji(a,b,d){a=a|0;b=b|0;d=d|0;return ef(a,b,c[d+4>>2]|0)|0}function jj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=hT(a,b,7896,(w=i,i=i+8|0,c[w>>2]=c[d+4>>2]|0,w)|0)|0;i=e;return f|0}function jk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=iU(c[e+4>>2]|0,b,d)|0;d8(c[e+4>>2]|0,c[e+4>>2]|0,(c[e>>2]|0)+196|0);return a|0}function jl(a){a=a|0;var b=0;b=c[a+4>>2]|0;if((jf(b)|0)!=0){a=0;return a|0}else{a=((c[b+4>>2]|0)!=0&1&c[c[b+8>>2]>>2]|0)!=0?1:-1;return a|0}return 0}function jm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;d=b|0;e=a;d3(d|0);if((jf(c[e+4>>2]|0)|0)!=0){a=0;f=d|0;dU(f);g=a;i=b;return g|0}else{dM(d|0,c[e+4>>2]|0,c[e+4>>2]|0);a=dR(d|0,(c[e>>2]|0)+196|0)|0;f=d|0;dU(f);g=a;i=b;return g|0}return 0}function jn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;dM(c[e+4>>2]|0,c[b+4>>2]|0,c[d+4>>2]|0);if(!((dR(c[e+4>>2]|0,(c[e>>2]|0)+196|0)|0)>=0)){return}ew(c[e+4>>2]|0,c[e+4>>2]|0,(c[e>>2]|0)+196|0);return}function jo(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;ew(c[e+4>>2]|0,c[b+4>>2]|0,c[d+4>>2]|0);if((c[(c[e+4>>2]|0)+4>>2]|0)<0){f=-1}else{f=(c[(c[e+4>>2]|0)+4>>2]|0)>0&1}if((f|0)>=0){return}dM(c[e+4>>2]|0,c[e+4>>2]|0,(c[e>>2]|0)+196|0);return}function jp(a,b){a=a|0;b=b|0;er(c[a+4>>2]|0,c[b+4>>2]|0);return}function jq(a,b){a=a|0;b=b|0;var d=0;d=a;ej(c[d+4>>2]|0,c[b+4>>2]|0,2,(c[d>>2]|0)+196|0);return}function jr(a,b){a=a|0;b=b|0;var d=0;d=a;ea(c[d+4>>2]|0,c[b+4>>2]|0,1);if(!((dR(c[d+4>>2]|0,(c[d>>2]|0)+196|0)|0)>=0)){return}ew(c[d+4>>2]|0,c[d+4>>2]|0,(c[d>>2]|0)+196|0);return}function js(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=c[a+4>>2]|0;if(((c[b+4>>2]|0)!=0&1&c[c[b+8>>2]>>2]|0)!=0){dM(c[d+4>>2]|0,b,(c[a>>2]|0)+196|0);ey(c[d+4>>2]|0,c[d+4>>2]|0,1);return}else{ey(c[d+4>>2]|0,c[a+4>>2]|0,1);return}}function jt(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;d9(c[e+4>>2]|0,c[b+4>>2]|0,c[d+4>>2]|0);d8(c[e+4>>2]|0,c[e+4>>2]|0,(c[e>>2]|0)+196|0);return}function ju(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;d9(c[e+4>>2]|0,c[b+4>>2]|0,d);d8(c[e+4>>2]|0,c[e+4>>2]|0,(c[e>>2]|0)+196|0);return}function jv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;eb(c[e+4>>2]|0,c[b+4>>2]|0,d);d8(c[e+4>>2]|0,c[e+4>>2]|0,(c[e>>2]|0)+196|0);return}function jw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;ei(c[e+4>>2]|0,c[b+4>>2]|0,d,(c[e>>2]|0)+196|0);return}function jx(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;if((jf(c[a+4>>2]|0)|0)!=0){eq(c[d+4>>2]|0,0);return}else{ew(c[d+4>>2]|0,(c[d>>2]|0)+196|0,c[a+4>>2]|0);return}}function jy(a,b){a=a|0;b=b|0;return dR(c[a+4>>2]|0,c[b+4>>2]|0)|0}function jz(a,b){a=a|0;b=b|0;var d=0;d=a;d4(c[d+4>>2]|0,c[b+4>>2]|0,(c[d>>2]|0)+196|0);return}function jA(a){a=a|0;var b=0;b=a;n4(c[b+4>>2]|0,(c[b>>2]|0)+196|0);return}function jB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;iP(c[e+4>>2]|0,(c[e>>2]|0)+196|0,b,d);return}function jC(a){a=a|0;return((dS(c[a+4>>2]|0,1)|0)!=0^1)&1|0}function jD(a){a=a|0;return jf(c[a+4>>2]|0)|0}function jE(a){a=a|0;ep(c[a+4>>2]|0,0);return}function jF(a){a=a|0;ep(c[a+4>>2]|0,1);return}function jG(a){a=a|0;var b=0,d=0;b=a;if((jf(c[b+4>>2]|0)|0)!=0){a=1;d=a;return d|0}else{a=(d6(c[b+4>>2]|0,(c[b>>2]|0)+196|0)|0)==1&1;d=a;return d|0}return 0}function jH(a,b){a=a|0;b=b|0;var d=0;d=b;b=c[(c[d>>2]|0)+164>>2]|0;iO(a,b,c[d+4>>2]|0);return b|0}function jI(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[(c[d>>2]|0)+164>>2]|0;d2(c[d+4>>2]|0,a,1,1,1,0,b);return a|0}function jJ(a,b){a=a|0;b=b|0;er(a,c[b+4>>2]|0);return}function jK(a,b){a=a|0;b=b|0;var d=0;d=i;oz(a,5512,(w=i,i=i+8|0,c[w>>2]=b+196|0,w)|0);i=d;return}function jL(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;if((dY(a)|0)!=0){jb(d,a);return}if(((c[a+4>>2]|0)!=0&1&c[c[a+8>>2]>>2]|0)!=0){bl[c[214]&1023](d,a)}else{jM(d,a)}return}function jM(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;il(d);c[d+4>>2]=442;c[d+8>>2]=92;c[d+76>>2]=608;c[d+12>>2]=576;c[d+36>>2]=448;c[d+40>>2]=284;c[d+44>>2]=804;c[d+20>>2]=786;c[d+48>>2]=736;c[d+88>>2]=644;c[d+112>>2]=656;c[d+96>>2]=18;c[d+108>>2]=276;c[d+116>>2]=370;c[d+124>>2]=172;c[d+148>>2]=816;c[d+144>>2]=((c[a+4>>2]|0)!=0&1&c[c[a+8>>2]>>2]|0)!=0?506:208;c[d+120>>2]=44;c[d+128>>2]=246;c[d+132>>2]=456;c[d+136>>2]=800;c[d+140>>2]=824;c[d+24>>2]=84;c[d+28>>2]=104;c[d+52>>2]=234;c[d+56>>2]=8;c[d>>2]=326;c[d+152>>2]=708;c[d+156>>2]=406;c[d+172>>2]=538;c[d+176>>2]=202;b=bm[c[198]&1023](12)|0;c[d+212>>2]=b;e=b;c[e>>2]=et(a)|0;c[e+4>>2]=c[e>>2]<<2;c[e+8>>2]=bm[c[198]&1023](c[e+4>>2]|0)|0;dZ(c[e+8>>2]|0,e|0,-1,4,0,0,a);er(d+196|0,a);c[d+164>>2]=(((eu(a,2)|0)+7|0)>>>0)/8>>>0;return}function jN(a){a=a|0;var b=0,d=0;b=a;a=c[(c[b>>2]|0)+212>>2]|0;d=bm[c[198]&1023](8)|0;c[b+4>>2]=d;b=d;c[b>>2]=0;c[b+4>>2]=bm[c[198]&1023](c[a+4>>2]|0)|0;return}function jO(a){a=a|0;var b=0;b=a;bk[c[200]&1023](c[(c[b+4>>2]|0)+4>>2]|0);bk[c[200]&1023](c[b+4>>2]|0);return}function jP(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=b;b=c[d+4>>2]|0;if((a|0)==0){c[b>>2]=0;return}e=c[(c[d>>2]|0)+212>>2]|0;d=c[e>>2]|0;if((a|0)<0){f=c[b+4>>2]|0;g=c[e+8>>2]|0;e=d;h=-a|0;eH(f,g,e,h)}else{c[c[b+4>>2]>>2]=a;uI((c[b+4>>2]|0)+4|0,0,d-1<<2|0)}c[b>>2]=2;return}function jQ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d|0;f=a;a=b;b=c[f+4>>2]|0;do{if((c[a+4>>2]|0)<0){if(1){g=4681;break}else{g=4680;break}}else{if((c[a+4>>2]|0)>0){g=4681;break}else{g=4680;break}}}while(0);if((g|0)==4680){c[b>>2]=0;i=d;return}else if((g|0)==4681){d3(e|0);d8(e|0,a,(c[f>>2]|0)+196|0);kg(f,e|0);dU(e|0);c[b>>2]=2;i=d;return}}function jR(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=d|0;d3(e|0);ke(e|0,c);c=ef(a,b,e|0)|0;dU(e|0);i=d;return c|0}function jS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a;a=b;b=d;d=c[a+4>>2]|0;f=c[b+4>>2]|0;if((c[d>>2]|0)==0){jU(e,b);return}if((c[f>>2]|0)!=0){b=c[e+4>>2]|0;g=c[(c[a>>2]|0)+212>>2]|0;h=c[g>>2]|0;if((eG(c[b+4>>2]|0,c[d+4>>2]|0,c[f+4>>2]|0,h)|0)!=0){f=c[b+4>>2]|0;d=c[b+4>>2]|0;i=c[g+8>>2]|0;j=h;eI(f,d,i,j);c[b>>2]=2}else{j=fw(c[b+4>>2]|0,c[g+8>>2]|0,h)|0;if((j|0)!=0){c[b>>2]=2;if((j|0)>0){j=c[b+4>>2]|0;i=c[b+4>>2]|0;d=c[g+8>>2]|0;g=h;eI(j,i,d,g)}}else{c[b>>2]=0}}}else{jU(e,a)}return}function jT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=a;a=b;b=d;d=c[a+4>>2]|0;f=c[b+4>>2]|0;if((c[d>>2]|0)==0){j3(e,b);return}if((c[f>>2]|0)!=0){b=c[(c[e>>2]|0)+212>>2]|0;g=c[b>>2]|0;h=c[e+4>>2]|0;i=fw(c[d+4>>2]|0,c[f+4>>2]|0,g)|0;if((i|0)==0){c[h>>2]=0}else{c[h>>2]=2;j=c[h+4>>2]|0;k=c[d+4>>2]|0;d=c[f+4>>2]|0;f=g;eI(j,k,d,f);if((i|0)<0){i=c[h+4>>2]|0;f=c[h+4>>2]|0;h=c[b+8>>2]|0;b=g;eG(i,f,h,b)}}}else{jU(e,a)}return}function jU(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+32|0;e=d|0;f=d+16|0;g=a;a=b;b=c[a+4>>2]|0;h=c[g+4>>2]|0;if((a|0)==(g|0)){i=d;return}if((c[b>>2]|0)!=0){g=c[(c[a>>2]|0)+212>>2]|0;c[(e|0)+8>>2]=c[h+4>>2]|0;c[(f|0)+8>>2]=c[b+4>>2]|0;b=c[g>>2]|0;c[f>>2]=b;c[(f|0)+4>>2]=b;c[e>>2]=b;c[(e|0)+4>>2]=b;er(e|0,f|0);c[h>>2]=2;i=d;return}else{c[h>>2]=0;i=d;return}}function jV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=a;a=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[f+4>>2]|0;do{if((c[a>>2]|0)!=0){if((c[b>>2]|0)==0){break}g=c[(c[f>>2]|0)+212>>2]|0;h=c[g>>2]|0;j=bb()|0;k=i;i=i+((h<<1)*4&-1)|0;i=i+7>>3<<3;l=i;i=i+((h+1|0)*4&-1)|0;i=i+7>>3<<3;fh(k,c[a+4>>2]|0,c[b+4>>2]|0,h);fF(l,c[d+4>>2]|0,0,k,h<<1,c[g+8>>2]|0,h);c[d>>2]=2;aN(j|0);i=e;return}}while(0);c[d>>2]=0;i=e;return}function jW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;d=c[a+4>>2]|0;h=c[g+4>>2]|0;do{if((c[d>>2]|0)!=0){if((b|0)==0){break}c[h>>2]=2;j=c[(c[a>>2]|0)+212>>2]|0;k=c[j>>2]|0;l=bb()|0;m=i;i=i+((k+1|0)*4&-1)|0;i=i+7>>3<<3;n=c[d+4>>2]|0;c[m+(k<<2)>>2]=eK(m,n,k,Q(b|0)|0)|0;fF(f|0,c[h+4>>2]|0,0,m,k+1|0,c[j+8>>2]|0,k);if((b|0)<0){j3(g,g)}aN(l|0);i=e;return}}while(0);c[h>>2]=0;i=e;return}function jX(a){a=a|0;var b=0;b=c[a+4>>2]|0;if((c[b>>2]|0)!=0){a=(c[c[b+4>>2]>>2]&1|0)!=0?1:-1;b=a;return b|0}else{a=0;b=a;return b|0}return 0}function jY(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;a=c[b+4>>2]|0;if((c[a>>2]|0)==0){d=0;e=d;return e|0}f=c[c[(c[b>>2]|0)+212>>2]>>2]|0;if((c[c[a+4>>2]>>2]|0)!=1){d=0;e=d;return e|0}b=1;while(1){if(b>>>0>=f>>>0){g=4758;break}if((c[(c[a+4>>2]|0)+(b<<2)>>2]|0)!=0){g=4755;break}b=b+1|0}if((g|0)==4758){d=1;e=d;return e|0}else if((g|0)==4755){d=0;e=d;return e|0}return 0}function jZ(a){a=a|0;return((c[c[a+4>>2]>>2]|0)!=0^1)&1|0}function j_(a){a=a|0;c[c[a+4>>2]>>2]=0;return}function j$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+32|0;e=d|0;f=d+16|0;g=a;a=b;b=c[(c[g>>2]|0)+212>>2]|0;h=c[a+4>>2]|0;j=c[g+4>>2]|0;if((c[h>>2]|0)==0){c[j>>2]=0;i=d;return}c[j>>2]=2;c[(e|0)+8>>2]=c[j+4>>2]|0;j=c[b>>2]|0;c[e>>2]=j;c[(e|0)+4>>2]=j;if((g|0)==(a|0)){ej(e|0,e|0,2,(c[g>>2]|0)+196|0)}else{c[(f|0)+8>>2]=c[h+4>>2]|0;h=c[b>>2]|0;c[f>>2]=h;c[(f|0)+4>>2]=h;ej(e|0,f|0,2,(c[g>>2]|0)+196|0)}g=(c[b>>2]|0)-(c[(e|0)+4>>2]|0)|0;if((g|0)!=0){uI((c[(e|0)+8>>2]|0)+(c[(e|0)+4>>2]<<2)|0,0,g<<2|0)}i=d;return}function j0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=c[b+4>>2]|0;b=c[d+4>>2]|0;if((c[a>>2]|0)==0){c[b>>2]=0;return}e=c[(c[d>>2]|0)+212>>2]|0;d=c[e>>2]|0;if((eP(c[b+4>>2]|0,c[a+4>>2]|0,d,1)|0)!=0){c[b>>2]=2;a=c[b+4>>2]|0;f=c[b+4>>2]|0;g=c[e+8>>2]|0;h=d;eI(a,f,g,h)}else{h=fw(c[b+4>>2]|0,c[e+8>>2]|0,d)|0;if((h|0)!=0){c[b>>2]=2;if((h|0)>0){h=c[b+4>>2]|0;g=c[b+4>>2]|0;f=c[e+8>>2]|0;e=d;eI(h,g,f,e)}}else{c[b>>2]=0}}return}function j1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;b=c[a+4>>2]|0;e=c[d+4>>2]|0;if((c[b>>2]|0)==0){c[e>>2]=0;return}f=c[(c[d>>2]|0)+212>>2]|0;g=c[f>>2]|0;h=0;i=c[b+4>>2]|0;b=c[e+4>>2]|0;if((c[i>>2]&1|0)!=0){h=eG(b,i,c[f+8>>2]|0,g)|0}else{jU(d,a)}eQ(b,b,g,1);if((h|0)!=0){h=b+(g-1<<2)|0;c[h>>2]=c[h>>2]|-2147483648}return}function j2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=a;a=b;b=c[g+4>>2]|0;if((c[c[a+4>>2]>>2]|0)!=0){d3(f|0);ke(f|0,a);ei(f|0,f|0,d,(c[a>>2]|0)+196|0);kg(g,f|0);dU(f|0);c[b>>2]=2;i=e;return}else{c[b>>2]=0;i=e;return}}function j3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=b;b=c[d+4>>2]|0;e=c[a+4>>2]|0;if((c[b>>2]|0)!=0){a=c[(c[d>>2]|0)+212>>2]|0;d=c[e+4>>2]|0;f=c[a+8>>2]|0;g=c[b+4>>2]|0;b=c[a>>2]|0;eI(d,f,g,b);c[e>>2]=2;return}else{c[e>>2]=0;return}}function j4(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;if((c[a>>2]|0)!=0){b=fw(c[a+4>>2]|0,c[e+4>>2]|0,c[c[(c[d>>2]|0)+212>>2]>>2]|0)|0;d=b;return d|0}else{b=c[e>>2]|0;d=b;return d|0}return 0}function j5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=a;a=c[(c[d>>2]|0)+212>>2]|0;e=c[d+4>>2]|0;if((c[e>>2]|0)==0){f=0;g=f;i=b;return g|0}d=c[a>>2]|0;h=bb()|0;j=i;i=i+(d*4&-1)|0;i=i+7>>3<<3;if((eG(j,c[e+4>>2]|0,c[e+4>>2]|0,c[a>>2]|0)|0)!=0){f=1;e=1}else{f=fw(j,c[a+8>>2]|0,c[a>>2]|0)|0;e=1}aN(h|0);g=f;i=b;return g|0}function j6(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=a;a=b;b=c[f+4>>2]|0;d3(e|0);ke(e|0,a);d4(e|0,e|0,(c[a>>2]|0)+196|0);kg(f,e|0);dU(e|0);c[b>>2]=2;i=d;return}function j7(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b|0;e=a;a=c[e+4>>2]|0;d3(d|0);n4(d|0,(c[e>>2]|0)+196|0);do{if((c[(d|0)+4>>2]|0)<0){if(1){f=4833;break}else{f=4834;break}}else{if((c[(d|0)+4>>2]|0)>0){f=4833;break}else{f=4834;break}}}while(0);if((f|0)==4833){kg(e,d|0);c[a>>2]=2;e=d|0;dU(e);i=b;return}else if((f|0)==4834){c[a>>2]=0;e=d|0;dU(e);i=b;return}}function j8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=a;d3(f|0);iP(f|0,(c[g>>2]|0)+196|0,b,d);jQ(g,f|0);dU(f|0);i=e;return}function j9(a){a=a|0;var b=0,d=0;b=a;a=c[(c[b>>2]|0)+212>>2]|0;d=c[b+4>>2]|0;c[d>>2]=2;uI((c[d+4>>2]|0)+4|0,0,(c[a+4>>2]|0)-4|0);c[c[d+4>>2]>>2]=1;return}function ka(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b|0;e=a;a=c[e+4>>2]|0;d3(d|0);if((c[a>>2]|0)!=0){ke(d|0,e);a=(d6(d|0,(c[e>>2]|0)+196|0)|0)==1&1;dU(d|0);d=a;a=d;i=b;return a|0}else{d=1;a=d;i=b;return a|0}return 0}function kb(a){a=a|0;var b=0;b=c[a+212>>2]|0;bk[c[200]&1023](c[b+8>>2]|0);bk[c[200]&1023](b);return}function kc(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=a;a=b;b=c[(c[a>>2]|0)+164>>2]|0;if((c[c[a+4>>2]>>2]|0)!=0){d3(e|0);ke(e|0,a);iO(f,b,e|0);dU(e|0);e=b;i=d;return e|0}else{uI(f|0,0,b|0);e=b;i=d;return e|0}return 0}function kd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+16|0;e=d|0;f=a;a=c[f+4>>2]|0;d3(e|0);g=c[(c[f>>2]|0)+164>>2]|0;d2(e|0,g,1,1,1,0,b);do{if((c[(e|0)+4>>2]|0)<0){if(1){h=4857;break}else{h=4856;break}}else{if((c[(e|0)+4>>2]|0)>0){h=4857;break}else{h=4856;break}}}while(0);if((h|0)==4856){c[a>>2]=0;b=e|0;dU(b);j=g;i=d;return j|0}else if((h|0)==4857){c[a>>2]=2;kg(f,e|0);b=e|0;dU(b);j=g;i=d;return j|0}return 0}function ke(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=c[a+4>>2]|0;if((c[b>>2]|0)!=0){d2(d,c[c[(c[a>>2]|0)+212>>2]>>2]|0,-1,4,0,0,c[b+4>>2]|0);return}else{eq(d,0);return}}function kf(a,b){a=a|0;b=b|0;var d=0;d=i;oz(a,8664,(w=i,i=i+8|0,c[w>>2]=b+196|0,w)|0);i=d;return}function kg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;f=a;a=c[(c[f>>2]|0)+212>>2]|0;g=c[f+4>>2]|0;dZ(c[g+4>>2]|0,e,-1,4,0,0,b);uI((c[g+4>>2]|0)+(c[e>>2]<<2)|0,0,(c[a>>2]|0)-(c[e>>2]|0)<<2|0);i=d;return}function kh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d|0;f=a;a=b;il(f);c[f+4>>2]=350;c[f+8>>2]=220;c[f+76>>2]=498;c[f+12>>2]=666;c[f+36>>2]=550;c[f+168>>2]=418;c[f+32>>2]=278;c[f+40>>2]=420;c[f+44>>2]=118;c[f+20>>2]=466;c[f+48>>2]=754;c[f+96>>2]=260;c[f+108>>2]=422;c[f+116>>2]=452;c[f+124>>2]=282;c[f+144>>2]=214;c[f+148>>2]=674;c[f+120>>2]=744;c[f+128>>2]=624;c[f+132>>2]=588;c[f+136>>2]=126;c[f+140>>2]=494;c[f+24>>2]=768;c[f+28>>2]=832;c[f+52>>2]=470;c[f+56>>2]=8;c[f>>2]=100;c[f+152>>2]=112;c[f+156>>2]=680;c[f+172>>2]=662;c[f+176>>2]=756;b=bm[c[198]&1023](24)|0;c[f+212>>2]=b;g=b;c[g>>2]=et(a)|0;c[g+4>>2]=c[g>>2]<<2;c[g+8>>2]=bm[c[198]&1023](c[g+4>>2]|0)|0;dZ(c[g+8>>2]|0,g|0,-1,4,0,0,a);er(f+196|0,a);c[f+164>>2]=(((eu(a,2)|0)+7|0)>>>0)/8>>>0;d3(e|0);c[g+16>>2]=bm[c[198]&1023](c[g+4>>2]|0)|0;c[g+20>>2]=bm[c[198]&1023](c[g+4>>2]|0)|0;ev(e|0,c[g+4>>2]<<3);d8(e|0,e|0,a);kQ(c[g+16>>2]|0,e|0,c[g>>2]|0);ej(e|0,e|0,3,a);kQ(c[g+20>>2]|0,e|0,c[g>>2]|0);eq(e|0,0);ev(e|0,c[g+4>>2]<<3);d4(e|0,a,e|0);c[g+12>>2]=-(d0(e|0)|0)|0;dU(e|0);i=d;return}function ki(b){b=b|0;var d=0,e=0;d=b;b=c[(c[d>>2]|0)+212>>2]|0;e=bm[c[198]&1023](8)|0;c[d+4>>2]=e;d=e;a[d|0]=0;c[d+4>>2]=bm[c[198]&1023](c[b+4>>2]|0)|0;return}function kj(a){a=a|0;var b=0;b=a;bk[c[200]&1023](c[(c[b+4>>2]|0)+4>>2]|0);bk[c[200]&1023](c[b+4>>2]|0);return}function kk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+16|0;f=e|0;g=b;b=d;d=c[(c[g>>2]|0)+212>>2]|0;h=c[g+4>>2]|0;if((b|0)==0){a[h|0]=0;i=e;return}d3(f|0);ep(f|0,b);ea(f|0,f|0,c[d+4>>2]<<3);d8(f|0,f|0,(c[g>>2]|0)+196|0);do{if((c[(f|0)+4>>2]|0)<0){if(1){j=4878;break}else{j=4877;break}}else{if((c[(f|0)+4>>2]|0)>0){j=4878;break}else{j=4877;break}}}while(0);if((j|0)==4878){kQ(c[h+4>>2]|0,f|0,c[d>>2]|0);a[h|0]=2}else if((j|0)==4877){a[h|0]=0}dU(f|0);i=e;return}function kl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+16|0;f=e|0;g=b;b=d;d=c[(c[g>>2]|0)+212>>2]|0;h=c[g+4>>2]|0;do{if((c[b+4>>2]|0)<0){if(1){break}else{j=4886;break}}else{if((c[b+4>>2]|0)>0){break}else{j=4886;break}}}while(0);if((j|0)==4886){a[h|0]=0;i=e;return}d3(f|0);ea(f|0,b,c[d+4>>2]<<3);d8(f|0,f|0,(c[g>>2]|0)+196|0);do{if((c[(f|0)+4>>2]|0)<0){if(1){j=4891;break}else{j=4890;break}}else{if((c[(f|0)+4>>2]|0)>0){j=4891;break}else{j=4890;break}}}while(0);if((j|0)==4890){a[h|0]=0}else if((j|0)==4891){kQ(c[h+4>>2]|0,f|0,c[d>>2]|0);a[h|0]=2}dU(f|0);i=e;return}function km(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=d|0;d3(e|0);kO(e|0,c);c=ef(a,b,e|0)|0;dU(e|0);i=d;return c|0}function kn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e|0;d3(f|0);kO(f|0,d);d=hT(a,b,8208,(w=i,i=i+8|0,c[w>>2]=f|0,w)|0)|0;dU(f|0);i=e;return d|0}function ko(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=a;d3(f|0);a=iU(f|0,b,d)|0;d8(f|0,f|0,(c[g>>2]|0)+196|0);kl(g,f|0);dU(f|0);i=e;return a|0}function kp(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;b=d;d=e;e=c[b+4>>2]|0;g=c[d+4>>2]|0;if((a[e|0]|0)==0){kr(f,d);return}if((a[g|0]|0)!=0){d=c[f+4>>2]|0;h=c[(c[b>>2]|0)+212>>2]|0;i=c[h>>2]|0;if((eG(c[d+4>>2]|0,c[e+4>>2]|0,c[g+4>>2]|0,i)|0)!=0){g=c[d+4>>2]|0;e=c[d+4>>2]|0;j=c[h+8>>2]|0;k=i;eI(g,e,j,k);a[d|0]=2}else{k=fw(c[d+4>>2]|0,c[h+8>>2]|0,i)|0;if((k|0)!=0){a[d|0]=2;if((k|0)>0){k=c[d+4>>2]|0;j=c[d+4>>2]|0;e=c[h+8>>2]|0;h=i;eI(k,j,e,h)}}else{a[d|0]=0}}}else{kr(f,b)}return}function kq(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=b;b=d;d=e;e=c[b+4>>2]|0;g=c[d+4>>2]|0;if((a[e|0]|0)==0){kw(f,d);return}if((a[g|0]|0)!=0){d=c[(c[f>>2]|0)+212>>2]|0;h=c[d>>2]|0;i=c[f+4>>2]|0;j=fw(c[e+4>>2]|0,c[g+4>>2]|0,h)|0;if((j|0)==0){a[i|0]=0}else{a[i|0]=2;k=c[i+4>>2]|0;l=c[e+4>>2]|0;e=c[g+4>>2]|0;g=h;eI(k,l,e,g);if((j|0)<0){j=c[i+4>>2]|0;g=c[i+4>>2]|0;i=c[d+8>>2]|0;d=h;eG(j,g,i,d)}}}else{kr(f,b)}return}function kr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+32|0;f=e|0;g=e+16|0;h=b;b=d;d=c[b+4>>2]|0;j=c[h+4>>2]|0;if((b|0)==(h|0)){i=e;return}if((a[d|0]|0)!=0){h=c[(c[b>>2]|0)+212>>2]|0;c[(f|0)+8>>2]=c[j+4>>2]|0;c[(g|0)+8>>2]=c[d+4>>2]|0;d=c[h>>2]|0;c[g>>2]=d;c[(g|0)+4>>2]=d;c[f>>2]=d;c[(f|0)+4>>2]=d;er(f|0,g|0);a[j|0]=2;i=e;return}else{a[j|0]=0;i=e;return}}function ks(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b;b=c[d+4>>2]|0;d=c[e+4>>2]|0;e=c[f+4>>2]|0;do{if((a[b|0]|0)!=0){if((a[d|0]|0)==0){break}kS(c[e+4>>2]|0,c[b+4>>2]|0,c[d+4>>2]|0,c[(c[f>>2]|0)+212>>2]|0);a[e|0]=2;return}}while(0);a[e|0]=0;return}function kt(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b;b=c[d+4>>2]|0;d=c[e+4>>2]|0;if((a[b|0]|0)==0){a[d|0]=0;return}f=c[(c[e>>2]|0)+212>>2]|0;e=c[f>>2]|0;if((eP(c[d+4>>2]|0,c[b+4>>2]|0,e,1)|0)!=0){a[d|0]=2;b=c[d+4>>2]|0;g=c[d+4>>2]|0;h=c[f+8>>2]|0;i=e;eI(b,g,h,i)}else{i=fw(c[d+4>>2]|0,c[f+8>>2]|0,e)|0;if((i|0)!=0){a[d|0]=2;if((i|0)>0){i=c[d+4>>2]|0;h=c[d+4>>2]|0;g=c[f+8>>2]|0;f=e;eI(i,h,g,f)}}else{a[d|0]=0}}return}function ku(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=b;b=d;d=c[b+4>>2]|0;f=c[e+4>>2]|0;if((a[d|0]|0)==0){a[f|0]=0;return}g=c[(c[e>>2]|0)+212>>2]|0;h=c[g>>2]|0;i=0;j=c[d+4>>2]|0;d=c[f+4>>2]|0;if((c[j>>2]&1|0)!=0){i=eG(d,j,c[g+8>>2]|0,h)|0}else{kr(e,b)}eQ(d,d,h,1);if((i|0)!=0){i=d+(h-1<<2)|0;c[i>>2]=c[i>>2]|-2147483648}return}function kv(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f|0;h=d;d=c[(c[h>>2]|0)+212>>2]|0;j=c[b+4>>2]|0;if((a[c[h+4>>2]|0]|0)!=0){d3(g|0);kO(g|0,h);ei(g|0,g|0,e,(c[h>>2]|0)+196|0);ea(g|0,g|0,c[d+4>>2]<<3);d8(g|0,g|0,(c[h>>2]|0)+196|0);kQ(c[j+4>>2]|0,g|0,c[d>>2]|0);dU(g|0);a[j|0]=2;i=f;return}else{a[j|0]=0;i=f;return}}function kw(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=d;d=c[e+4>>2]|0;f=c[b+4>>2]|0;if((a[d|0]|0)!=0){b=c[(c[e>>2]|0)+212>>2]|0;e=c[f+4>>2]|0;g=c[b+8>>2]|0;h=c[d+4>>2]|0;d=c[b>>2]|0;eI(e,g,h,d);a[f|0]=2;return}else{a[f|0]=0;return}}function kx(b){b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=b;if((a[c[f+4>>2]|0]|0)!=0){d3(e|0);kO(e|0,f);f=((c[(e|0)+4>>2]|0)!=0&1&c[c[(e|0)+8>>2]>>2]|0)!=0?1:-1;dU(e|0);e=f;f=e;i=d;return f|0}else{e=0;f=e;i=d;return f|0}return 0}function ky(b,d){b=b|0;d=d|0;var e=0,f=0;e=b;b=c[e+4>>2]|0;f=c[d+4>>2]|0;if((a[b|0]|0)!=0){d=fw(c[b+4>>2]|0,c[f+4>>2]|0,c[c[(c[e>>2]|0)+212>>2]>>2]|0)|0;e=d;return e|0}else{d=a[f|0]|0;e=d;return e|0}return 0}function kz(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;f=e|0;g=d;d=c[g+4>>2]|0;h=c[b+4>>2]|0;b=c[(c[g>>2]|0)+212>>2]|0;j=c[b>>2]|0;k=bb()|0;l=i;i=i+(j*4&-1)|0;i=i+7>>3<<3;d3(f|0);d2(f|0,c[b>>2]|0,-1,4,0,0,c[d+4>>2]|0);d4(f|0,f|0,(c[g>>2]|0)+196|0);kQ(l,f|0,c[b>>2]|0);kS(c[h+4>>2]|0,l,c[b+20>>2]|0,b);a[h|0]=2;dU(f|0);aN(k|0);i=e;return}function kA(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=b;b=c[(c[f>>2]|0)+212>>2]|0;g=c[f+4>>2]|0;d3(e|0);n4(e|0,(c[f>>2]|0)+196|0);do{if((c[(e|0)+4>>2]|0)<0){if(1){h=4999;break}else{h=5e3;break}}else{if((c[(e|0)+4>>2]|0)>0){h=4999;break}else{h=5e3;break}}}while(0);if((h|0)==4999){ea(e|0,e|0,c[b+4>>2]<<3);d8(e|0,e|0,(c[f>>2]|0)+196|0);kQ(c[g+4>>2]|0,e|0,c[b>>2]|0);a[g|0]=2;b=e|0;dU(b);i=d;return}else if((h|0)==5e3){a[g|0]=0;b=e|0;dU(b);i=d;return}}function kB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=a;d3(f|0);iP(f|0,(c[g>>2]|0)+196|0,b,d);kl(g,f|0);dU(f|0);i=e;return}function kC(b){b=b|0;return((a[c[b+4>>2]|0]|0)!=0^1)&1|0}function kD(b){b=b|0;a[c[b+4>>2]|0]=0;return}function kE(a,b){a=a|0;b=b|0;return c[(c[a>>2]|0)+(b<<2)>>2]|0}function kF(a){a=a|0;var b=0,d=0;b=a;if((c[b+4>>2]|0)<0){d=-1}else{d=(c[b+4>>2]|0)>0&1}return((d|0)!=0^1)&1|0}function kG(b){b=b|0;return 0==(a[b|0]|0|0)&1|0}function kH(a){a=a|0;return c[a+4>>2]|0}function kI(b){b=b|0;var d=0,e=0;d=b;b=c[d+4>>2]|0;if((a[b|0]|0)!=0){e=c[(c[d>>2]|0)+212>>2]|0;d=((fw(c[b+4>>2]|0,c[e+16>>2]|0,c[e>>2]|0)|0)!=0^1)&1;e=d;return e|0}else{d=0;e=d;return e|0}return 0}function kJ(b){b=b|0;var d=0,e=0;d=b;b=c[(c[d>>2]|0)+212>>2]|0;e=c[d+4>>2]|0;a[e|0]=2;uK(c[e+4>>2]|0,c[b+16>>2]|0,c[b+4>>2]|0);return}function kK(b){b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=b;b=c[f+4>>2]|0;d3(e|0);if((a[b|0]|0)!=0){kO(e|0,f);b=(d6(e|0,(c[f>>2]|0)+196|0)|0)==1&1;dU(e|0);e=b;b=e;i=d;return b|0}else{e=1;b=e;i=d;return b|0}return 0}function kL(a){a=a|0;var b=0;b=c[a+212>>2]|0;bk[c[200]&1023](c[b+8>>2]|0);bk[c[200]&1023](c[b+16>>2]|0);bk[c[200]&1023](c[b+20>>2]|0);bk[c[200]&1023](b);return}function kM(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=b;b=c[(c[f>>2]|0)+164>>2]|0;d3(e|0);kO(e|0,f);iO(a,b,e|0);dU(e|0);i=d;return b|0}function kN(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;f=e|0;g=b;b=c[(c[g>>2]|0)+212>>2]|0;h=c[g+4>>2]|0;d3(f|0);j=c[(c[g>>2]|0)+164>>2]|0;d2(f|0,j,1,1,1,0,d);do{if((c[(f|0)+4>>2]|0)<0){if(1){k=5033;break}else{k=5032;break}}else{if((c[(f|0)+4>>2]|0)>0){k=5033;break}else{k=5032;break}}}while(0);if((k|0)==5032){a[h|0]=0;d=f|0;dU(d);l=j;i=e;return l|0}else if((k|0)==5033){a[h|0]=2;ea(f|0,f|0,c[b+4>>2]<<3);d8(f|0,f|0,(c[g>>2]|0)+196|0);kQ(c[h+4>>2]|0,f|0,c[b>>2]|0);d=f|0;dU(d);l=j;i=e;return l|0}return 0}function kO(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;f=b;b=d;d=c[b+4>>2]|0;if((a[d|0]|0)==0){eq(f,0);i=e;return}g=c[(c[b>>2]|0)+212>>2]|0;b=c[g>>2]<<1;h=bb()|0;j=i;i=i+(b*4&-1)|0;i=i+7>>3<<3;uK(j|0,c[d+4>>2]|0,c[g>>2]<<2);uI(j+(c[g>>2]<<2)|0,0,c[g>>2]<<2|0);eo(f,c[g>>2]|0);kR(c[f+8>>2]|0,j,g);c[f+4>>2]=c[g>>2]|0;while(1){if(!((c[(c[f+8>>2]|0)+((c[f+4>>2]|0)-1<<2)>>2]|0)!=0^1)){break}g=f+4|0;c[g>>2]=(c[g>>2]|0)-1|0}aN(h|0);i=e;return}function kP(a,b){a=a|0;b=b|0;var d=0;d=i;oz(a,5728,(w=i,i=i+8|0,c[w>>2]=b+196|0,w)|0);i=d;return}function kQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;g=a;dZ(g,f,-1,4,0,0,b);uI(g+(c[f>>2]<<2)|0,0,d-(c[f>>2]|0)<<2|0);i=e;return}function kR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=d;d=c[b>>2]|0;f=0;g=0;while(1){if(g>>>0>=d>>>0){break}h=ab(c[a+(g<<2)>>2]|0,c[b+12>>2]|0);f=f+(eF(a+(g+d<<2)|0,a+(g+d<<2)|0,d-g|0,eN(a+(g<<2)|0,c[b+8>>2]|0,d,h)|0)|0)|0;g=g+1|0}do{if((f|0)==0){if((fw(a+(d<<2)|0,c[b+8>>2]|0,d)|0)>=0){break}uK(e|0,a+(d<<2)|0,d<<2);return}}while(0);eI(e,a+(d<<2)|0,c[b+8>>2]|0,d);return}function kS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;g=a;a=b;b=d;d=e;e=c[d>>2]|0;h=bb()|0;j=i;i=i+(((e<<1)+1|0)*4&-1)|0;i=i+7>>3<<3;k=ab(c[a>>2]|0,c[b>>2]|0);l=ab(k,c[d+12>>2]|0);k=eK(j,b,e,c[a>>2]|0)|0;c[j+(e<<2)>>2]=k;m=k;k=eN(j,c[d+8>>2]|0,e,l)|0;n=j+(e<<2)|0;c[n>>2]=(c[n>>2]|0)+k|0;c[j+(e+1<<2)>>2]=(c[j+(e<<2)>>2]|0)>>>0<m>>>0&1;k=1;while(1){if(k>>>0>=e>>>0){break}n=c[j+(k<<2)>>2]|0;o=n+ab(c[a+(k<<2)>>2]|0,c[b>>2]|0)|0;l=ab(o,c[d+12>>2]|0);o=eN(j+(k<<2)|0,b,e,c[a+(k<<2)>>2]|0)|0;n=j+(e+k<<2)|0;p=(c[n>>2]|0)+o|0;c[n>>2]=p;m=p;p=eN(j+(k<<2)|0,c[d+8>>2]|0,e,l)|0;n=j+(e+k<<2)|0;c[n>>2]=(c[n>>2]|0)+p|0;c[j+((e+k|0)+1<<2)>>2]=(c[j+(e+k<<2)>>2]|0)>>>0<m>>>0&1;k=k+1|0}do{if((c[j+(e<<1<<2)>>2]|0)==0){if((fw(j+(e<<2)|0,c[d+8>>2]|0,e)|0)>=0){break}uK(g|0,j+(e<<2)|0,e<<2);q=h;aN(q|0);i=f;return}}while(0);eI(g,j+(e<<2)|0,c[d+8>>2]|0,e);q=h;aN(q|0);i=f;return}function kT(b,c){b=b|0;c=c|0;var d=0;d=b;b=c;while(1){if((a[b|0]|0|0)!=1){break}b=kE(b+4|0,0)|0}er(d,b+4|0);return}function kU(b){b=b|0;var c=0,d=0,e=0;c=b;if((a[c|0]|0|0)!=0){d=0;e=d&1;return e|0}d=(kF(c+4|0)|0)!=0;e=d&1;return e|0}function kV(b){b=b|0;var c=0,d=0;c=b;if(1!=(a[c|0]|0|0)){b=-1;d=b;return d|0}else{b=kH(c+4|0)|0;d=b;return d|0}return 0}function kW(a,b){a=a|0;b=b|0;return kE(a+4|0,b)|0}function kX(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function kY(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function kZ(a){a=a|0;return}function k_(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;il(d);c[d>>2]=566;c[d+212>>2]=a;c[d+4>>2]=330;c[d+8>>2]=302;c[d+76>>2]=746;c[d+12>>2]=206;c[d+172>>2]=70;c[d+36>>2]=182;c[d+168>>2]=50;c[d+16>>2]=738;c[d+32>>2]=590;c[d+144>>2]=700;c[d+40>>2]=56;c[d+44>>2]=504;c[d+20>>2]=102;c[d+48>>2]=734;c[d+84>>2]=386;c[d+88>>2]=290;c[d+112>>2]=444;c[d+96>>2]=200;c[d+124>>2]=658;c[d+148>>2]=646;c[d+120>>2]=528;c[d+128>>2]=628;c[d+132>>2]=22;c[d+136>>2]=136;c[d+140>>2]=134;c[d+24>>2]=338;c[d+28>>2]=336;c[d+52>>2]=138;c[d+56>>2]=268;c[d+152>>2]=634;c[d+156>>2]=664;c[d+176>>2]=230;c[d+60>>2]=344;c[d+64>>2]=546;c[d+68>>2]=150;c[d+72>>2]=148;d9(d+196|0,a+196|0,a+196|0);if((c[a+164>>2]|0)<0){c[d+160>>2]=698;c[d+164>>2]=-1;return}else{c[d+164>>2]=c[a+164>>2]<<1;return}}function k$(a){a=a|0;var b=0,d=0;b=a;a=bm[c[198]&1023](16)|0;c[b+4>>2]=a;d=a;a=c[(c[b>>2]|0)+212>>2]|0;lI(d|0,a);lI(d+8|0,a);return}function k0(a){a=a|0;var b=0;b=a;a=c[b+4>>2]|0;lR(a|0);lR(a+8|0);bk[c[200]&1023](c[b+4>>2]|0);return}function k1(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;lM(d|0,b);kY(d+8|0);return}function k2(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;ma(d|0,b);kY(d+8|0);return}function k3(a,b){a=a|0;b=b|0;l9(a,c[b+4>>2]|0);return}function k4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=4;f=c[d+4>>2]|0;if(-1==(aM(91,e|0)|0)){g=0;h=g;return h|0}b=l8(e,a,f|0)|0;if((b|0)==0){g=0;h=g;return h|0}if(-1==(aV(6672,e|0)|0)){g=0;h=g;return h|0}d=l8(e,a,f+8|0)|0;if((d|0)==0){g=0;h=g;return h|0}if(-1==(aM(93,e|0)|0)){g=0;h=g;return h|0}else{g=b+d|0;h=g;return h|0}return 0}function k5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=a;a=b;b=c[d+4>>2]|0;d=0;g=ay(f|0,a|0,7456,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){k=0}else{k=a-d|0}l=k;g=l7(f+d|0,l,b|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){m=0}else{m=a-d|0}l=m;g=ay(f+d|0,l|0,6672,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){n=0}else{n=a-d|0}l=n;g=l7(f+d|0,l,b+8|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){o=0}else{o=a-d|0}l=o;g=ay(f+d|0,l|0,6008,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}else{h=d+g|0;j=h;i=e;return j|0}return 0}function k6(a,b){a=a|0;b=b|0;var d=0;d=b;b=c[a+4>>2]|0;if((kG(d)|0)!=0){l6(b|0,d);kY(b+8|0);return}l6(b|0,kW(d,0)|0);if(2>(kV(d)|0)){kY(b+8|0);return}else{l6(b+8|0,kW(d,1)|0);return}}function k7(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b;b=d;d=e;e=b;kY(f);while(1){if((a[e]|0|0)!=0){g=(a_(a[e]|0|0)|0)!=0}else{g=0}if(!g){break}e=e+1|0}g=e;e=g+1|0;if((a[g]|0|0)!=91){h=0;i=h;return i|0}g=c[f+4>>2]|0;e=e+(l5(g|0,e,d)|0)|0;while(1){if((a[e]|0|0)!=0){j=(a_(a[e]|0|0)|0)!=0}else{j=0}if(!j){break}e=e+1|0}j=e;e=j+1|0;if((a[j]|0|0)!=44){h=0;i=h;return i|0}e=e+(l5(g+8|0,e,d)|0)|0;d=e;e=d+1|0;if((a[d]|0|0)!=93){h=0;i=h;return i|0}else{h=e-b|0;i=h;return i|0}return 0}function k8(a){a=a|0;var b=0,d=0;b=c[a+4>>2]|0;a=l4(b|0)|0;if((a|0)!=0){d=a;a=d;return a|0}else{d=l4(b+8|0)|0;a=d;return a|0}return 0}function k9(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[a+4>>2]|0;lK(d|0,e|0,b|0);lK(d+8|0,e+8|0,b+8|0);return}function la(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[a+4>>2]|0;lQ(d|0,e|0,b|0);lQ(d+8|0,e+8|0,b+8|0);return}function lb(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;b=c[a+4>>2]|0;kX(b|0,d|0);kX(b+8|0,d+8|0);return}function lc(a){a=a|0;return 2}function ld(a,b){a=a|0;b=b|0;var d=0,e=0;d=c[a+4>>2]|0;a=b;if((a|0)==1){e=d+8|0}else if((a|0)==0){e=d|0}else{e=0}return e|0}function le(a){a=a|0;return c[a+4>>2]|0}function lf(a){a=a|0;return(c[a+4>>2]|0)+8|0}function lg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[j+4>>2]|0;k=lU(c[j>>2]|0)|0;lI(f|0,c[a>>2]|0);lI(g|0,c[f>>2]|0);lI(h|0,c[f>>2]|0);lK(f|0,a|0,a+8|0);lK(g|0,b|0,b+8|0);lO(h|0,f|0,g|0);lO(f|0,a|0,b|0);lO(g|0,a+8|0,b+8|0);lO(d|0,g|0,k);lK(d|0,d|0,f|0);lQ(h|0,h|0,f|0);lQ(d+8|0,h|0,g|0);lR(f|0);lR(g|0);lR(h|0);i=e;return}function lh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;d=c[b+4>>2]|0;b=c[a+4>>2]|0;l3(b|0,d|0,e);l3(b+8|0,d+8|0,e);return}function li(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;d=c[b+4>>2]|0;b=c[a+4>>2]|0;l2(b|0,d|0,e);l2(b+8|0,d+8|0,e);return}function lj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=c[b+4>>2]|0;b=c[g+4>>2]|0;h=lU(c[g>>2]|0)|0;lI(e|0,c[a>>2]|0);lI(f|0,c[e>>2]|0);lJ(e|0,a|0);lJ(f|0,a+8|0);lO(f|0,f|0,h);lK(e|0,e|0,f|0);lO(f|0,a|0,a+8|0);l1(f|0,f|0);kX(b|0,e|0);kX(b+8|0,f|0);lR(e|0);lR(f|0);i=d;return}function lk(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;b=c[a+4>>2]|0;l1(b|0,d|0);l1(b+8|0,d+8|0);return}function ll(a,b){a=a|0;b=b|0;var d=0;d=c[b+4>>2]|0;b=c[a+4>>2]|0;lS(b|0,d|0);lS(b+8|0,d+8|0);return}function lm(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=c[a+4>>2]|0;a=c[b+4>>2]|0;if((l0(d|0,a|0)|0)!=0){e=1;f=e&1;return f|0}e=(l0(d+8|0,a+8|0)|0)!=0;f=e&1;return f|0}function ln(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=c[b+4>>2]|0;b=c[g+4>>2]|0;h=lU(c[g>>2]|0)|0;lI(e|0,c[a>>2]|0);lI(f|0,c[e>>2]|0);lJ(e|0,a|0);lJ(f|0,a+8|0);lO(f|0,f|0,h);lQ(e|0,e|0,f|0);lN(e|0,e|0);lO(b|0,a|0,e|0);lS(e|0,e|0);lO(b+8|0,a+8|0,e|0);lR(e|0);lR(f|0);i=d;return}function lo(a){a=a|0;var b=0;b=c[a+4>>2]|0;l$(b|0);l$(b+8|0);return}function lp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=b;b=d;d=c[a+4>>2]|0;a=(b|0)/2&-1;l_(d|0,e,a);l_(d+8|0,e+a|0,b-a|0);return}function lq(a){a=a|0;var b=0,d=0,e=0;b=c[a+4>>2]|0;if((lZ(b|0)|0)==0){d=0;e=d&1;return e|0}d=(lY(b+8|0)|0)!=0;e=d&1;return e|0}function lr(a){a=a|0;var b=0,d=0,e=0;b=c[a+4>>2]|0;if((lY(b|0)|0)==0){d=0;e=d&1;return e|0}d=(lY(b+8|0)|0)!=0;e=d&1;return e|0}function ls(a){a=a|0;var b=0;b=c[a+4>>2]|0;kY(b|0);kY(b+8|0);return}function lt(a){a=a|0;var b=0;b=c[a+4>>2]|0;lX(b|0);kY(b+8|0);return}function lu(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;a=c[f+4>>2]|0;g=lU(c[f>>2]|0)|0;lI(d|0,c[a>>2]|0);lI(e|0,c[d>>2]|0);lJ(d|0,a|0);lJ(e|0,a+8|0);lO(e|0,e|0,g);lQ(d|0,d|0,e|0);g=lP(d|0)|0;lR(d|0);lR(e|0);i=b;return g|0}function lv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;h=a;a=c[b+4>>2]|0;b=c[h+4>>2]|0;j=lU(c[h>>2]|0)|0;lI(e|0,c[a>>2]|0);lI(f|0,c[e>>2]|0);lI(g|0,c[e>>2]|0);lJ(e|0,a|0);lJ(f|0,a+8|0);lO(f|0,f|0,j);lQ(e|0,e|0,f|0);lL(e|0,e|0);lK(f|0,a|0,e|0);lM(g|0,2);lN(g|0,g|0);lO(f|0,f|0,g|0);if((lP(f|0)|0)==0){lQ(f|0,f|0,e|0)}lL(e|0,f|0);lK(f|0,e|0,e|0);lN(f|0,f|0);lO(b+8|0,a+8|0,f|0);kX(b|0,e|0);lR(e|0);lR(f|0);lR(g|0);i=d;return}function lw(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[b+4>>2]|0;b=lW(d,a|0)|0;b=b+(lW(d+b|0,a+8|0)|0)|0;return b|0}function lx(a,b){a=a|0;b=b|0;var d=0;d=b;b=c[a+4>>2]|0;a=lV(b|0,d)|0;a=a+(lV(b+8|0,d+a|0)|0)|0;return a|0}function ly(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=b;b=c[a+212>>2]|0;f=lU(a)|0;oz(e,9136,(w=i,i=i+8|0,c[w>>2]=f,w)|0);ik(e,b);i=d;return}function lz(a){a=a|0;var b=0;b=c[a+4>>2]|0;a=lT(b|0)|0;return a+(lT(b+8|0)|0)|0}function lA(a){a=a|0;return}function lB(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;il(d);c[d>>2]=554;c[d+212>>2]=a;c[d+4>>2]=330;c[d+8>>2]=302;c[d+76>>2]=746;c[d+12>>2]=206;c[d+172>>2]=70;c[d+36>>2]=182;c[d+168>>2]=50;c[d+16>>2]=738;c[d+32>>2]=590;c[d+144>>2]=700;c[d+40>>2]=56;c[d+44>>2]=504;c[d+20>>2]=102;c[d+48>>2]=34;c[d+84>>2]=386;c[d+88>>2]=290;c[d+112>>2]=308;c[d+96>>2]=200;c[d+124>>2]=658;c[d+148>>2]=646;c[d+120>>2]=476;c[d+128>>2]=628;c[d+132>>2]=22;c[d+136>>2]=136;c[d+140>>2]=134;c[d+24>>2]=338;c[d+28>>2]=336;c[d+52>>2]=168;c[d+56>>2]=178;c[d+152>>2]=634;c[d+156>>2]=664;c[d+176>>2]=654;c[d+60>>2]=344;c[d+64>>2]=546;c[d+68>>2]=150;c[d+72>>2]=148;d9(d+196|0,a+196|0,a+196|0);if((c[a+164>>2]|0)<0){c[d+160>>2]=698;c[d+164>>2]=-1;return}else{c[d+164>>2]=c[a+164>>2]<<1;return}}function lC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[a+4>>2]|0;lI(f|0,c[j>>2]|0);lI(g|0,c[f>>2]|0);lI(h|0,c[f>>2]|0);lK(f|0,j|0,j+8|0);lK(g|0,b|0,b+8|0);lO(h|0,f|0,g|0);lO(f|0,j|0,b|0);lQ(h|0,h|0,f|0);lO(g|0,j+8|0,b+8|0);lQ(d|0,f|0,g|0);lQ(d+8|0,h|0,g|0);lR(f|0);lR(g|0);lR(h|0);i=e;return}function lD(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=c[b+4>>2]|0;b=c[a+4>>2]|0;lI(e|0,c[g>>2]|0);lI(f|0,c[e>>2]|0);lK(e|0,g|0,g+8|0);lQ(f|0,g|0,g+8|0);lO(e|0,e|0,f|0);lO(f|0,g|0,g+8|0);lK(f|0,f|0,f|0);kX(b|0,e|0);kX(b+8|0,f|0);lR(e|0);lR(f|0);i=d;return}function lE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=c[b+4>>2]|0;b=c[a+4>>2]|0;lI(e|0,c[g>>2]|0);lI(f|0,c[e>>2]|0);lJ(e|0,g|0);lJ(f|0,g+8|0);lK(e|0,e|0,f|0);lN(e|0,e|0);lO(b|0,g|0,e|0);lS(e|0,e|0);lO(b+8|0,g+8|0,e|0);lR(e|0);lR(f|0);i=d;return}function lF(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=c[a+4>>2]|0;lI(d|0,c[f>>2]|0);lI(e|0,c[d>>2]|0);lJ(d|0,f|0);lJ(e|0,f+8|0);lK(d|0,d|0,e|0);f=lP(d|0)|0;lR(d|0);lR(e|0);i=b;return f|0}function lG(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;h=c[b+4>>2]|0;b=c[a+4>>2]|0;lI(e|0,c[h>>2]|0);lI(f|0,c[e>>2]|0);lI(g|0,c[e>>2]|0);lJ(e|0,h|0);lJ(f|0,h+8|0);lK(e|0,e|0,f|0);lL(e|0,e|0);lK(f|0,h|0,e|0);lM(g|0,2);lN(g|0,g|0);lO(f|0,f|0,g|0);if((lP(f|0)|0)==0){lQ(f|0,f|0,e|0)}lL(e|0,f|0);lK(f|0,e|0,e|0);lN(f|0,f|0);lO(b+8|0,h+8|0,f|0);kX(b|0,e|0);lR(e|0);lR(f|0);lR(g|0);i=d;return}function lH(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=c[b+212>>2]|0;aE(e|0,9344,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);ik(e,a);i=d;return}function lI(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function lJ(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function lK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function lL(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+56>>2]&1023](d,b);return}function lM(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function lN(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function lO(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function lP(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+52>>2]&1023](b)|0}function lQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function lR(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function lS(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function lT(a){a=a|0;var b=0,d=0;b=a;if((c[(c[b>>2]|0)+164>>2]|0)<0){a=bm[c[(c[b>>2]|0)+160>>2]&1023](b)|0;d=a;return d|0}else{a=c[(c[b>>2]|0)+164>>2]|0;d=a;return d|0}return 0}function lU(a){a=a|0;return ij(c[a+212>>2]|0)|0}function lV(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+156>>2]&1023](d,b)|0}function lW(a,b){a=a|0;b=b|0;var d=0;d=b;return bq[c[(c[d>>2]|0)+152>>2]&1023](a,d)|0}function lX(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function lY(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+140>>2]&1023](b)|0}function lZ(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function l_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+132>>2]&1023](e,b,d);return}function l$(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+128>>2]&1023](b);return}function l0(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+148>>2]&1023](d,b)|0}function l1(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function l2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function l3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+84>>2]&1023](e,b,d);return}function l4(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+144>>2]&1023](b)|0}function l5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;return bi[c[(c[e>>2]|0)+32>>2]&1023](e,b,d)|0}function l6(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+16>>2]&1023](d,b);return}function l7(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+168>>2]&1023](a,b,e)|0}function l8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+36>>2]&1023](a,b,e)|0}function l9(a,b){a=a|0;b=b|0;var d=0;d=b;bl[c[(c[d>>2]|0)+172>>2]&1023](a,d);return}function ma(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function mb(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;il(d);a=bm[c[198]&1023](8)|0;c[d+212>>2]=a;e=a;c[e>>2]=b;c[e+4>>2]=404;c[d>>2]=228;c[d+4>>2]=380;c[d+8>>2]=356;c[d+76>>2]=762;c[d+16>>2]=116;c[d+12>>2]=618;c[d+172>>2]=438;c[d+36>>2]=688;c[d+168>>2]=60;c[d+20>>2]=668;c[d+144>>2]=314;c[d+40>>2]=572;c[d+96>>2]=534;c[d+140>>2]=812;c[d+136>>2]=810;c[d+24>>2]=772;c[d+28>>2]=774;c[d+44>>2]=258;c[d+124>>2]=574;c[d+48>>2]=140;c[d+84>>2]=392;c[d+88>>2]=520;c[d+148>>2]=410;c[d+176>>2]=256;c[d+60>>2]=522;c[d+64>>2]=414;c[d+152>>2]=176;c[d+156>>2]=128;c[d+164>>2]=-1;c[d+160>>2]=542;return}function mc(a,b){a=a|0;b=b|0;var c=0;c=a;mH(c,1);mI(mr(c,0)|0,b);mK(c);return}function md(a){a=a|0;bk[c[200]&1023](c[a+212>>2]|0);return}function me(a){a=a|0;var b=0;b=bm[c[198]&1023](12)|0;c[a+4>>2]=b;ob(b|0);return}
function mf(a){a=a|0;var b=0;b=a;a=c[b+4>>2]|0;mH(b,0);od(a|0);bk[c[200]&1023](c[b+4>>2]|0);return}function mg(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[d+4>>2]|0;mH(d,1);nD(c[c[a>>2]>>2]|0,b);mK(d);return}function mh(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=a;a=b;if((kG(a)|0)!=0){d3(e|0);kT(e|0,a);mi(f,e|0);dU(e|0);i=d;return}e=c[f+4>>2]|0;b=kV(a)|0;mH(f,b);g=0;while(1){if((g|0)>=(b|0)){break}h=c[(c[e>>2]|0)+(g<<2)>>2]|0;n$(h,kW(a,g)|0);g=g+1|0}mK(f);i=d;return}function mi(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[d+4>>2]|0;mH(d,1);n2(c[c[a>>2]>>2]|0,b);mK(d);return}function mj(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;if((mq(a)|0)!=0){nX(c,mr(a,0)|0);return}else{eq(c,0);return}}function mk(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;a=b;b=c;c=mq(b)|0;e=2;if(-1==(aM(91,d|0)|0)){f=0;g=f;return g|0}h=0;while(1){if((h|0)>=(c|0)){i=5317;break}if((h|0)!=0){if(-1==(aV(5280,d|0)|0)){i=5311;break}e=e+2|0}j=n1(d,a,mr(b,h)|0)|0;if((j|0)==0){i=5314;break}e=e+j|0;h=h+1|0}if((i|0)==5311){f=0;g=f;return g|0}else if((i|0)==5314){f=0;g=f;return g|0}else if((i|0)==5317){if(-1==(aM(93,d|0)|0)){f=0;g=f;return g|0}else{f=e;g=f;return g|0}}return 0}function ml(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;f=a;a=b;b=d;d=mq(b)|0;g=0;h=ay(f|0,a|0,5536,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((h|0)<0){j=h;k=j;i=e;return k|0}g=g+h|0;if(g>>>0>=a>>>0){l=0}else{l=a-g|0}m=l;l=0;while(1){if((l|0)>=(d|0)){n=5347;break}if((l|0)!=0){h=ay(f+g|0,m|0,5280,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((h|0)<0){n=5335;break}g=g+h|0;if(g>>>0>=a>>>0){o=0}else{o=a-g|0}m=o}h=n0(f+g|0,m,mr(b,l)|0)|0;if((h|0)<0){n=5341;break}g=g+h|0;if(g>>>0>=a>>>0){p=0}else{p=a-g|0}m=p;l=l+1|0}if((n|0)==5347){h=ay(f+g|0,m|0,5016,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((h|0)<0){j=h;k=j;i=e;return k|0}else{j=g+h|0;k=j;i=e;return k|0}}else if((n|0)==5335){j=h;k=j;i=e;return k|0}else if((n|0)==5341){j=h;k=j;i=e;return k|0}return 0}function mm(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[b+4>>2]|0;b=c[d+4>>2]|0;mH(d,c[(a|0)+4>>2]|0);d=0;while(1){if((d|0)>=(c[(a|0)+4>>2]|0)){break}mI(c[(c[b>>2]|0)+(d<<2)>>2]|0,c[(c[a>>2]|0)+(d<<2)>>2]|0);d=d+1|0}return}function mn(a){a=a|0;var b=0,c=0,d=0,e=0,f=0;b=a;a=0;c=mq(b)|0;d=0;while(1){if((d|0)>=(c|0)){e=5368;break}a=nZ(mr(b,d)|0)|0;if((a|0)!=0){break}d=d+1|0}if((e|0)==5368){f=a;return f|0}f=a;return f|0}function mo(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;b=c;c=mq(a)|0;e=mq(b)|0;if((c|0)>(e|0)){f=a;c=e;e=mq(a)|0}else{f=b}mH(d,e);g=0;while(1){if((g|0)>=(c|0)){break}h=mr(d,g)|0;i=mr(a,g)|0;nF(h,i,mr(b,g)|0);g=g+1|0}while(1){if((g|0)>=(e|0)){break}b=mr(d,g)|0;mI(b,mr(f,g)|0);g=g+1|0}mK(d);return}function mp(a){a=a|0;return((c[(c[a+4>>2]|0)+4>>2]|0)!=0^1)&1|0}function mq(a){a=a|0;return c[(c[a+4>>2]|0)+4>>2]|0}function mr(a,b){a=a|0;b=b|0;return c[(c[c[a+4>>2]>>2]|0)+(b<<2)>>2]|0}function ms(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;b=c[(e|0)+4>>2]|0;mH(d,b);d=0;while(1){if((d|0)>=(b|0)){break}nY(c[(c[a>>2]|0)+(d<<2)>>2]|0,c[(c[e>>2]|0)+(d<<2)>>2]|0);d=d+1|0}return}function mt(a){a=a|0;var b=0;b=c[a+4>>2]|0;if((c[(b|0)+4>>2]|0)==1){a=nM(c[c[b>>2]>>2]|0)|0;b=a;return b|0}else{a=0;b=a;return b|0}return 0}function mu(a){a=a|0;mH(a,0);return}function mv(a){a=a|0;var b=0;b=a;a=c[b+4>>2]|0;mH(b,1);mN(c[c[a>>2]>>2]|0);return}function mw(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;b=c;c=mq(a)|0;e=mq(b)|0;if((c|0)>(e|0)){f=a;c=e;e=mq(a)|0}else{f=b}mH(d,e);g=0;while(1){if((g|0)>=(c|0)){break}h=mr(d,g)|0;i=mr(a,g)|0;nz(h,i,mr(b,g)|0);g=g+1|0}while(1){if((g|0)>=(e|0)){break}if((f|0)==(a|0)){b=mr(d,g)|0;mI(b,mr(f,g)|0)}else{b=mr(d,g)|0;nG(b,mr(f,g)|0)}g=g+1|0}mK(d);return}function mx(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;b=c[(e|0)+4>>2]|0;mH(d,b);d=0;while(1){if((d|0)>=(b|0)){break}nG(c[(c[a>>2]|0)+(d<<2)>>2]|0,c[(c[e>>2]|0)+(d<<2)>>2]|0);d=d+1|0}return}function my(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=a;a=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[(c[h>>2]|0)+212>>2]|0;j=c[(a|0)+4>>2]|0;k=c[(b|0)+4>>2]|0;do{if((j|0)!=0){if((k|0)==0){break}mS(f|0,c[h>>2]|0);l=c[(f|0)+4>>2]|0;m=(j+k|0)-1|0;mH(f|0,m);mS(g|0,c[d>>2]|0);n=0;while(1){if((n|0)>=(m|0)){break}o=c[(c[l>>2]|0)+(n<<2)>>2]|0;mL(o);p=0;while(1){if(!((p|0)<=(n|0))){break}do{if((p|0)<(j|0)){if((n-p|0)>=(k|0)){break}mP(g|0,c[(c[a>>2]|0)+(p<<2)>>2]|0,c[(c[b>>2]|0)+(n-p<<2)>>2]|0);nF(o,o,g|0)}}while(0);p=p+1|0}n=n+1|0}mK(f|0);mI(h,f|0);nA(g|0);nA(f|0);i=e;return}}while(0);mL(h);i=e;return}function mz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=d;d=c[e+4>>2]|0;f=c[b+4>>2]|0;b=c[(f|0)+4>>2]|0;mH(e,b);e=0;while(1){if((e|0)>=(b|0)){break}nU(c[(c[d>>2]|0)+(e<<2)>>2]|0,c[(c[f>>2]|0)+(e<<2)>>2]|0,a);e=e+1|0}return}function mA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=d;d=c[e+4>>2]|0;f=c[b+4>>2]|0;b=c[(f|0)+4>>2]|0;mH(e,b);e=0;while(1){if((e|0)>=(b|0)){break}nT(c[(c[d>>2]|0)+(e<<2)>>2]|0,c[(c[f>>2]|0)+(e<<2)>>2]|0,a);e=e+1|0}return}function mB(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;c=a;a=b;b=mq(c)|0;if((b|0)!=(mq(a)|0)){d=1;e=d;return e|0}f=0;while(1){if((f|0)>=(b|0)){g=5454;break}h=mr(c,f)|0;if((nL(h,mr(a,f)|0)|0)!=0){g=5451;break}f=f+1|0}if((g|0)==5454){d=0;e=d;return e|0}else if((g|0)==5451){d=1;e=d;return e|0}return 0}function mC(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=c[b+212>>2]|0;aE(e|0,4464,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);ik(e,c[a>>2]|0);i=d;return}function mD(b,c){b=b|0;c=c|0;var d=0,e=0,f=0;d=b;b=c;c=mq(b)|0;e=2;a[d|0]=c&255;a[d+1|0]=c>>8&255;f=0;while(1){if((f|0)>=(c|0)){break}e=e+(nK(d+e|0,mr(b,f)|0)|0)|0;f=f+1|0}return e|0}function mE(a,b){a=a|0;b=b|0;var c=0,e=0,f=0;c=a;a=b;b=2;e=(d[a|0]|0)+((d[a+1|0]|0)<<8)|0;mH(c,e);f=0;while(1){if((f|0)>=(e|0)){break}b=b+(nJ(mr(c,f)|0,a+b|0)|0)|0;f=f+1|0}return b|0}function mF(a){a=a|0;var b=0,c=0,d=0;b=a;a=mq(b)|0;c=2;d=0;while(1){if((d|0)>=(a|0)){break}c=c+(nI(mr(b,d)|0)|0)|0;d=d+1|0}return c|0}function mG(a){a=a|0;return c[(c[a+212>>2]|0)+8>>2]|0}function mH(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[(c[d>>2]|0)+212>>2]|0;e=c[d+4>>2]|0;d=c[(e|0)+4>>2]|0;while(1){if((d|0)>=(a|0)){break}f=bm[c[198]&1023](8)|0;mS(f,c[b>>2]|0);oc(e|0,f);d=d+1|0}while(1){if((d|0)<=(a|0)){break}d=d-1|0;f=nP(e|0,d)|0;nA(f);bk[c[200]&1023](f);nQ(e|0)}return}function mI(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function mJ(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+140>>2]&1023](b)|0}function mK(a){a=a|0;var b=0,d=0,e=0;b=c[a+4>>2]|0;a=(c[(b|0)+4>>2]|0)-1|0;while(1){if(!((a|0)>=0)){d=5491;break}e=c[(c[b>>2]|0)+(a<<2)>>2]|0;if((mJ(e)|0)==0){break}nA(e);bk[c[200]&1023](e);nQ(b|0);a=a-1|0}if((d|0)==5491){return}return}function mL(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function mM(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=c[d+4>>2]|0;if((c[(b|0)+4>>2]|0)<(a+1|0)){mH(d,a+1|0)}mN(c[(c[b>>2]|0)+(a<<2)>>2]|0);return}function mN(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function mO(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0;d=a;a=b;b=c;c=mq(b)|0;mH(d,c);e=0;while(1){if((e|0)>=(c|0)){break}f=mr(d,e)|0;mP(f,a,mr(b,e)|0);e=e+1|0}mK(d);return}function mP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function mQ(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+128>>2]&1023](b);return}function mR(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=a;a=b;b=c[(c[a>>2]|0)+212>>2]|0;il(d);e=bm[c[198]&1023](24)|0;c[d+212>>2]=e;f=e;c[f>>2]=c[b>>2]|0;c[f+4>>2]=404;mS(f+12|0,c[a>>2]|0);mI(f+12|0,a);e=mT(f+12|0)|0;c[f+8>>2]=e;g=e;c[d>>2]=750;c[d+4>>2]=80;c[d+8>>2]=478;c[d+76>>2]=4;c[d+12>>2]=352;c[d+36>>2]=2;c[d+168>>2]=706;c[d+16>>2]=532;c[d+32>>2]=24;c[d+20>>2]=784;c[d+144>>2]=312;c[d+40>>2]=524;c[d+96>>2]=130;c[d+44>>2]=12;c[d+124>>2]=486;c[d+140>>2]=792;c[d+136>>2]=794;c[d+24>>2]=76;c[d+28>>2]=74;c[d+148>>2]=562;c[d+172>>2]=758;c[d+60>>2]=458;c[d+64>>2]=592;e=g;if((e|0)==3){c[d+48>>2]=354;c[d+112>>2]=426}else if((e|0)==6){c[d+48>>2]=434;c[d+112>>2]=270}else{c[d+48>>2]=594;c[d+112>>2]=270}c[d+84>>2]=436;c[d+88>>2]=636;c[d+128>>2]=682;c[d+132>>2]=296;c[d+120>>2]=340;c[d+52>>2]=188;c[d+56>>2]=62;c[d+152>>2]=782;c[d+156>>2]=610;c[d+176>>2]=408;if((c[(c[b>>2]|0)+164>>2]|0)<0){c[d+164>>2]=-1;c[d+160>>2]=54;e=d;h=e+196|0;i=h|0;j=f;k=j|0;l=c[k>>2]|0;m=l+196|0;n=m|0;o=g;eh(i,n,o);p=c[198]|0;q=g;r=q<<3;s=bm[p&1023](r)|0;t=s;u=f;v=u+20|0;c[v>>2]=t;w=d;x=a;nw(w,x);return}else{y=c[(c[b>>2]|0)+164>>2]|0;c[d+164>>2]=ab(y,mT(a)|0);e=d;h=e+196|0;i=h|0;j=f;k=j|0;l=c[k>>2]|0;m=l+196|0;n=m|0;o=g;eh(i,n,o);p=c[198]|0;q=g;r=q<<3;s=bm[p&1023](r)|0;t=s;u=f;v=u+20|0;c[v>>2]=t;w=d;x=a;nw(w,x);return}}function mS(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function mT(a){a=a|0;return(n3(a)|0)-1|0}function mU(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+212>>2]|0;d=c[a+8>>2]|0;e=0;while(1){if((e|0)>=(d|0)){break}nA((c[a+20>>2]|0)+(e<<3)|0);e=e+1|0}bk[c[200]&1023](c[a+20>>2]|0);nA(a+12|0);bk[c[200]&1023](c[b+212>>2]|0);return}function mV(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[(c[b>>2]|0)+212>>2]|0;d=c[a+8>>2]|0;e=bm[c[198]&1023](d<<3)|0;c[b+4>>2]=e;b=e;e=0;while(1){if((e|0)>=(d|0)){break}mS(b+(e<<3)|0,c[a>>2]|0);e=e+1|0}return}function mW(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+4>>2]|0;d=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;e=0;while(1){if((e|0)>=(d|0)){break}nA(a+(e<<3)|0);e=e+1|0}bk[c[200]&1023](c[b+4>>2]|0);return}function mX(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;nD(a|0,b);b=1;while(1){if((b|0)>=(e|0)){break}mL(a+(b<<3)|0);b=b+1|0}return}function mY(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;n2(a|0,b);b=1;while(1){if((b|0)>=(e|0)){break}mL(a+(b<<3)|0);b=b+1|0}return}function mZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=a;a=b;b=d;d=2;f=c[b+4>>2]|0;g=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;if(-1==(aM(91,e|0)|0)){h=0;i=h;return i|0}b=0;while(1){if((b|0)>=(g|0)){j=5554;break}if((b|0)!=0){if(-1==(aV(5280,e|0)|0)){j=5548;break}d=d+2|0}k=n1(e,a,f+(b<<3)|0)|0;if((k|0)==0){j=5551;break}d=d+k|0;b=b+1|0}if((j|0)==5554){if(-1==(aM(93,e|0)|0)){h=0;i=h;return i|0}else{h=d;i=h;return i|0}}else if((j|0)==5551){h=0;i=h;return i|0}else if((j|0)==5548){h=0;i=h;return i|0}return 0}function m_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;f=a;a=b;b=d;d=c[b+4>>2]|0;g=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;b=0;h=ay(f|0,a|0,5536,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((h|0)<0){j=h;k=j;i=e;return k|0}b=b+h|0;if(b>>>0>=a>>>0){l=0}else{l=a-b|0}m=l;l=0;while(1){if((l|0)>=(g|0)){n=5584;break}if((l|0)!=0){h=ay(f+b|0,m|0,5280,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((h|0)<0){n=5572;break}b=b+h|0;if(b>>>0>=a>>>0){o=0}else{o=a-b|0}m=o}h=n0(f+b|0,m,d+(l<<3)|0)|0;if((h|0)<0){n=5578;break}b=b+h|0;if(b>>>0>=a>>>0){p=0}else{p=a-b|0}m=p;l=l+1|0}if((n|0)==5572){j=h;k=j;i=e;return k|0}else if((n|0)==5584){h=ay(f+b|0,m|0,5016,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((h|0)<0){j=h;k=j;i=e;return k|0}else{j=b+h|0;k=j;i=e;return k|0}}else if((n|0)==5578){j=h;k=j;i=e;return k|0}return 0}function m$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[d+4>>2]|0;e=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;if((kG(a)|0)!=0){n$(b|0,a);f=1;while(1){if((f|0)>=(e|0)){break}mL(b+(f<<3)|0);f=f+1|0}return}d=kV(a)|0;f=0;while(1){if((f|0)>=(e|0)){break}if((f|0)>=(d|0)){mL(b+(f<<3)|0)}else{n$(b+(f<<3)|0,kW(a,f)|0)}f=f+1|0}return}function m0(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;b=d;d=e;e=c[f+4>>2]|0;g=c[(c[(c[f>>2]|0)+212>>2]|0)+8>>2]|0;h=b;mL(f);while(1){if((a[h]|0|0)!=0){i=(a_(a[h]|0|0)|0)!=0}else{i=0}if(!i){break}h=h+1|0}i=h;h=i+1|0;if((a[i]|0|0)!=91){j=0;k=j;return k|0}i=0;while(1){if((i|0)>=(g|0)){break}h=h+(n_(e+(i<<3)|0,h,d)|0)|0;while(1){if((a[h]|0|0)!=0){l=(a_(a[h]|0|0)|0)!=0}else{l=0}if(!l){break}h=h+1|0}if((i|0)<(g-1|0)){f=h;h=f+1|0;if((a[f]|0|0)!=44){m=5625;break}}i=i+1|0}if((m|0)==5625){j=0;k=j;return k|0}m=h;h=m+1|0;if((a[m]|0|0)!=93){j=0;k=j;return k|0}else{j=h-b|0;k=j;return k|0}return 0}function m1(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;b=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;d=0;while(1){if((d|0)>=(b|0)){break}mI(a+(d<<3)|0,e+(d<<3)|0);d=d+1|0}return}function m2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;a=c[b+4>>2]|0;d=0;e=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;b=0;while(1){if((b|0)>=(e|0)){f=5649;break}d=nZ(a+(b<<3)|0)|0;if((d|0)!=0){break}b=b+1|0}if((f|0)==5649){g=d;return g|0}g=d;return g|0}function m3(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=c[e+4>>2]|0;f=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[(c[(c[e>>2]|0)+212>>2]|0)+8>>2]|0;e=0;while(1){if((e|0)>=(d|0)){break}nF(a+(e<<3)|0,f+(e<<3)|0,b+(e<<3)|0);e=e+1|0}return}function m4(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;b=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;d=0;while(1){if((d|0)>=(b|0)){break}nY(a+(d<<3)|0,e+(d<<3)|0);d=d+1|0}return}function m5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=c[e+4>>2]|0;f=c[b+4>>2]|0;b=c[d+4>>2]|0;d=c[(c[(c[e>>2]|0)+212>>2]|0)+8>>2]|0;e=0;while(1){if((e|0)>=(d|0)){break}nz(a+(e<<3)|0,f+(e<<3)|0,b+(e<<3)|0);e=e+1|0}return}function m6(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;b=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;d=0;while(1){if((d|0)>=(b|0)){break}nG(a+(d<<3)|0,e+(d<<3)|0);d=d+1|0}return}function m7(a){a=a|0;var b=0;b=a;return c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0}function m8(a,b){a=a|0;b=b|0;return(c[a+4>>2]|0)+(b<<3)|0}function m9(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+4>>2]|0;d=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;b=0;while(1){if((b|0)>=(d|0)){e=5678;break}if((mJ(a+(b<<3)|0)|0)==0){e=5675;break}b=b+1|0}if((e|0)==5678){b=1;a=b;return a|0}else if((e|0)==5675){b=0;a=b;return a|0}return 0}function na(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;a=c[b+4>>2]|0;d=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;if((nM(a|0)|0)==0){e=0;f=e;return f|0}b=1;while(1){if((b|0)>=(d|0)){g=5690;break}if((mJ(a+(b<<3)|0)|0)==0){g=5687;break}b=b+1|0}if((g|0)==5690){e=1;f=e;return f|0}else if((g|0)==5687){e=0;f=e;return f|0}return 0}function nb(a){a=a|0;var b=0,d=0;b=a;a=c[b+4>>2]|0;d=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;b=0;while(1){if((b|0)>=(d|0)){break}mL(a+(b<<3)|0);b=b+1|0}return}function nc(a){a=a|0;var b=0,d=0;b=a;a=c[b+4>>2]|0;d=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;mN(a|0);b=1;while(1){if((b|0)>=(d|0)){break}mL(a+(b<<3)|0);b=b+1|0}return}function nd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=c[d+4>>2]|0;e=c[b+4>>2]|0;b=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;d=0;while(1){if((d|0)>=(b|0)){f=5711;break}if((nL(a+(d<<3)|0,e+(d<<3)|0)|0)!=0){f=5708;break}d=d+1|0}if((f|0)==5711){d=0;e=d;return e|0}else if((f|0)==5708){d=1;e=d;return e|0}return 0}function ne(a,b){a=a|0;b=b|0;nX(a,m8(b,0)|0);return}function nf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=c[(c[j>>2]|0)+212>>2]|0;k=c[j+4>>2]|0;l=c[b+4>>2]|0;b=c[d+4>>2]|0;mS(h|0,c[j>>2]|0);mS(f|0,c[a>>2]|0);mS(g|0,c[a>>2]|0);nW(k,f|0,g|0,l,b,c[(h|0)+4>>2]|0);nx(h|0,f|0,c[a+20>>2]|0);nF(j,j,h|0);nx(h|0,g|0,(c[a+20>>2]|0)+8|0);nF(j,j,h|0);nA(h|0);nA(f|0);nA(g|0);i=e;return}function ng(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;h=a;a=c[h+4>>2]|0;j=c[b+4>>2]|0;b=c[(c[h>>2]|0)+212>>2]|0;mS(e|0,c[h>>2]|0);mS(f|0,c[b>>2]|0);mS(g|0,c[b>>2]|0);k=c[(e|0)+4>>2]|0;l=k+8|0;mP(k,j|0,j+8|0);mP(l,j|0,j+16|0);nV(a|0,j|0);mP(g|0,j+8|0,j+16|0);nV(f|0,j+16|0);nV(a+16|0,j+8|0);nF(a+8|0,k,k);nF(l,l,l);nF(a+16|0,a+16|0,l);nx(e|0,f|0,(c[b+20>>2]|0)+8|0);nF(h,h,e|0);nF(g|0,g|0,g|0);nx(e|0,g|0,c[b+20>>2]|0);nF(h,h,e|0);nA(e|0);nA(f|0);nA(g|0);i=d;return}function nh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=a;a=c[(c[k>>2]|0)+212>>2]|0;l=c[k+4>>2]|0;m=c[b+4>>2]|0;b=c[d+4>>2]|0;d=m;n=m+24|0;o=b;p=b+24|0;mS(f|0,c[k>>2]|0);mS(g|0,c[k>>2]|0);mS(h|0,c[k>>2]|0);mS(j|0,c[k>>2]|0);q=c[(f|0)+4>>2]|0;m=c[(g|0)+4>>2]|0;b=c[(h|0)+4>>2]|0;nF(q|0,d|0,n|0);nF(q+8|0,d+8|0,n+8|0);nF(q+16|0,d+16|0,n+16|0);nF(m|0,o|0,p|0);nF(m+8|0,o+8|0,p+8|0);nF(m+16|0,o+16|0,p+16|0);nW(b,b+24|0,b+32|0,q,m,c[(j|0)+4>>2]|0);nW(q,q+24|0,q+32|0,d,o,c[(j|0)+4>>2]|0);nW(m,m+24|0,m+32|0,n,p,c[(j|0)+4>>2]|0);mI(l|0,q|0);mI(l+8|0,q+8|0);mI(l+16|0,q+16|0);nz(l+24|0,q+24|0,q|0);nz(l+24|0,l+24|0,m|0);nF(l+24|0,l+24|0,b|0);nz(l+32|0,q+32|0,q+8|0);nz(l+32|0,l+32|0,m+8|0);nF(l+32|0,l+32|0,b+8|0);nz(l+40|0,b+16|0,q+16|0);nz(l+40|0,l+40|0,m+16|0);nz(q|0,b+24|0,q+24|0);nz(q|0,q|0,m+24|0);nF(q|0,q|0,m|0);nz(q+8|0,b+32|0,q+32|0);nz(q+8|0,q+8|0,m+32|0);nF(q+8|0,q+8|0,m+8|0);nx(j|0,q|0,c[a+20>>2]|0);nF(k,k,j|0);nx(j|0,q+8|0,(c[a+20>>2]|0)+8|0);nF(k,k,j|0);nx(j|0,m+16|0,(c[a+20>>2]|0)+16|0);nF(k,k,j|0);nx(j|0,m+24|0,(c[a+20>>2]|0)+24|0);nF(k,k,j|0);nx(j|0,m+32|0,(c[a+20>>2]|0)+32|0);nF(k,k,j|0);nA(f|0);nA(g|0);nA(h|0);nA(j|0);i=e;return}function ni(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;d=i;i=i+24|0;e=d|0;f=d+8|0;g=d+16|0;h=a;a=c[b+4>>2]|0;b=c[(c[h>>2]|0)+212>>2]|0;j=c[b+8>>2]|0;k=bm[c[198]&1023](j-1<<3)|0;l=0;while(1){if((l|0)>=(j-1|0)){break}mS(k+(l<<3)|0,c[b>>2]|0);mL(k+(l<<3)|0);l=l+1|0}mS(e|0,c[h>>2]|0);m=c[(e|0)+4>>2]|0;mS(f|0,c[h>>2]|0);mS(g|0,c[b>>2]|0);l=0;while(1){if((l|0)>=(j|0)){break}n=l<<1;nV(g|0,a+(l<<3)|0);if((n|0)<(j|0)){nF(m+(n<<3)|0,m+(n<<3)|0,g|0)}else{nF(k+(n-j<<3)|0,k+(n-j<<3)|0,g|0)}n=l+1|0;while(1){if((n|0)>=(j-l|0)){break}mP(g|0,a+(l<<3)|0,a+(n<<3)|0);nF(g|0,g|0,g|0);nF(m+(l+n<<3)|0,m+(l+n<<3)|0,g|0);n=n+1|0}while(1){if((n|0)>=(j|0)){break}mP(g|0,a+(l<<3)|0,a+(n<<3)|0);nF(g|0,g|0,g|0);nF(k+((l+n|0)-j<<3)|0,k+((l+n|0)-j<<3)|0,g|0);n=n+1|0}l=l+1|0}l=0;while(1){if((l|0)>=(j-1|0)){break}nx(f|0,k+(l<<3)|0,(c[b+20>>2]|0)+(l<<3)|0);nF(e|0,e|0,f|0);nA(k+(l<<3)|0);l=l+1|0}bk[c[200]&1023](k);mI(h,e|0);nA(e|0);nA(f|0);nA(g|0);i=d;return}function nj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=c[(c[j>>2]|0)+212>>2]|0;k=c[a+8>>2]|0;l=c[b+4>>2]|0;b=c[d+4>>2]|0;d=bm[c[198]&1023](k-1<<3)|0;m=0;while(1){if((m|0)>=(k-1|0)){break}mS(d+(m<<3)|0,c[a>>2]|0);mL(d+(m<<3)|0);m=m+1|0}mS(f|0,c[j>>2]|0);n=c[(f|0)+4>>2]|0;mS(g|0,c[j>>2]|0);mS(h|0,c[a>>2]|0);m=0;while(1){if((m|0)>=(k|0)){break}o=k-m|0;p=0;while(1){if((p|0)>=(o|0)){break}mP(h|0,l+(m<<3)|0,b+(p<<3)|0);nF(n+(m+p<<3)|0,n+(m+p<<3)|0,h|0);p=p+1|0}while(1){if((p|0)>=(k|0)){break}mP(h|0,l+(m<<3)|0,b+(p<<3)|0);nF(d+(p-o<<3)|0,d+(p-o<<3)|0,h|0);p=p+1|0}m=m+1|0}m=0;while(1){if((m|0)>=(k-1|0)){break}nx(g|0,d+(m<<3)|0,(c[a+20>>2]|0)+(m<<3)|0);nF(f|0,f|0,g|0);nA(d+(m<<3)|0);m=m+1|0}bk[c[200]&1023](d);mI(j,f|0);nA(f|0);nA(g|0);nA(h|0);i=e;return}function nk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=d;d=c[e+4>>2]|0;f=c[b+4>>2]|0;b=c[(c[(c[e>>2]|0)+212>>2]|0)+8>>2]|0;e=0;while(1){if((e|0)>=(b|0)){break}nU(d+(e<<3)|0,f+(e<<3)|0,a);e=e+1|0}return}function nl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=d;d=c[e+4>>2]|0;f=c[b+4>>2]|0;b=c[(c[(c[e>>2]|0)+212>>2]|0)+8>>2]|0;e=0;while(1){if((e|0)>=(b|0)){break}nT(d+(e<<3)|0,f+(e<<3)|0,a);e=e+1|0}return}function nm(a){a=a|0;var b=0,d=0;b=a;a=c[b+4>>2]|0;d=mG(c[b>>2]|0)|0;b=0;while(1){if((b|0)>=(d|0)){break}mQ(a+(b<<3)|0);b=b+1|0}return}function nn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;d=c[e+4>>2]|0;f=mG(c[e>>2]|0)|0;e=0;while(1){if((e|0)>=(f|0)){break}nS(d+(e<<3)|0,a,b);e=e+1|0}return}function no(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=c[(c[g>>2]|0)+212>>2]|0;h=a+12|0;mS(e|0,c[h>>2]|0);mS(f|0,c[h>>2]|0);nC(e|0,b);nR(f|0,e|0,a+12|0);nE(g,f|0);nA(e|0);nA(f|0);i=d;return}function np(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+24|0;d=b|0;e=b+16|0;f=a;mS(e|0,c[f>>2]|0);d3(d|0);ex(d|0,(c[f>>2]|0)+196|0,1);dX(d|0,d|0,2);ny(e|0,f,d|0);f=nM(e|0)|0;nA(e|0);dU(d|0);i=b;return f|0}function nq(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=i;i=i+264|0;e=d|0;f=d+216|0;g=d+224|0;h=d+232|0;j=d+240|0;k=d+248|0;l=a;a=b;mb(e|0,c[a>>2]|0);d3(k|0);mS(f|0,e|0);mS(g|0,e|0);mS(h|0,e|0);mS(j|0,c[a>>2]|0);mH(f|0,3);mN(mr(f|0,2)|0);nG(mr(f|0,0)|0,a);ex(k|0,(c[a>>2]|0)+196|0,1);dX(k|0,k|0,2);while(1){mH(g|0,2);mN(mr(g|0,1)|0);m=mr(g|0,0)|0;mQ(m);mP(j|0,m,m);if((nL(j|0,a)|0)==0){n=5788;break}mN(h|0);b=(eu(k|0,2)|0)-1|0;while(1){if(!((b|0)>=0)){break}mP(h|0,h|0,h|0);if((mT(h|0)|0)==2){o=mr(h|0,0)|0;p=mr(h|0,2)|0;mP(j|0,p,a);nF(o,o,j|0);mH(h|0,2);mK(h|0)}if((eB(k|0,b)|0)!=0){mP(h|0,h|0,g|0);if((mT(h|0)|0)==2){o=mr(h|0,0)|0;p=mr(h|0,2)|0;mP(j|0,p,a);nF(o,o,j|0);mH(h|0,2);mK(h|0)}}b=b-1|0}if((mT(h|0)|0)<1){continue}mN(j|0);o=mr(h|0,0)|0;p=mr(h|0,1)|0;nF(o,o,j|0);nH(j|0,p);mP(j|0,j|0,o);mP(p,j|0,j|0);if((nL(p,a)|0)==0){n=5802;break}}if((n|0)==5802){mI(l,j|0);a=k|0;dU(a);p=f|0;nA(p);o=g|0;nA(o);b=h|0;nA(b);q=j|0;nA(q);r=e|0;iN(r);i=d;return}else if((n|0)==5788){mI(l,m);a=k|0;dU(a);p=f|0;nA(p);o=g|0;nA(o);b=h|0;nA(b);q=j|0;nA(q);r=e|0;iN(r);i=d;return}}function nr(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[a+4>>2]|0;e=c[(c[(c[a>>2]|0)+212>>2]|0)+8>>2]|0;a=0;f=0;while(1){if((f|0)>=(e|0)){break}a=a+(nK(d+a|0,b+(f<<3)|0)|0)|0;f=f+1|0}return a|0}function ns(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[d+4>>2]|0;e=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;d=0;f=0;while(1){if((f|0)>=(e|0)){break}d=d+(nJ(b+(f<<3)|0,a+d|0)|0)|0;f=f+1|0}return d|0}function nt(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=c[b+212>>2]|0;oz(e,5952,(w=i,i=i+8|0,c[w>>2]=a+12|0,w)|0);ik(e,c[a>>2]|0);i=d;return}function nu(a){a=a|0;return c[c[(c[a>>2]|0)+212>>2]>>2]|0}function nv(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+4>>2]|0;d=c[(c[(c[b>>2]|0)+212>>2]|0)+8>>2]|0;b=0;e=0;while(1){if((e|0)>=(d|0)){break}b=b+(nI(a+(e<<3)|0)|0)|0;e=e+1|0}return b|0}function nw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=a;a=b;b=c[f+212>>2]|0;g=c[b+8>>2]|0;h=c[b+20>>2]|0;mS(e|0,f);b=0;while(1){if((b|0)>=(g|0)){break}mS(h+(b<<3)|0,f);b=b+1|0}f=h|0;nE(f,a);nG(f,f);b=1;while(1){if((b|0)>=(g|0)){break}a=c[(h+(b-1<<3)|0)+4>>2]|0;j=c[(h+(b<<3)|0)+4>>2]|0;mL(j|0);k=1;while(1){if((k|0)>=(g|0)){break}mI(j+(k<<3)|0,a+(k-1<<3)|0);k=k+1|0}nx(e|0,a+(g-1<<3)|0,f);nF(h+(b<<3)|0,h+(b<<3)|0,e|0);b=b+1|0}nA(e|0);i=d;return}function nx(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=b;b=d;d=c[b+4>>2]|0;f=c[a+4>>2]|0;a=mG(c[b>>2]|0)|0;b=0;while(1){if((b|0)>=(a|0)){break}mP(f+(b<<3)|0,d+(b<<3)|0,e);b=b+1|0}return}function ny(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function nz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function nA(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function nB(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+4>>2]|0;e=c[(c[(c[d>>2]|0)+212>>2]|0)+8>>2]|0;mI(a|0,b);b=1;while(1){if((b|0)>=(e|0)){break}mL(a+(b<<3)|0);b=b+1|0}return}function nC(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=c[a+4>>2]|0;e=c[(c[(c[a>>2]|0)+212>>2]|0)+8>>2]|0;mH(d,e);a=0;while(1){if((a|0)>=(e|0)){break}mI(mr(d,a)|0,b+(a<<3)|0);a=a+1|0}mK(d);return}function nD(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function nE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[(c[d>>2]|0)+212>>2]|0;e=c[d+4>>2]|0;d=mq(a)|0;if((d|0)>(c[b+8>>2]|0)){d=c[b+8>>2]|0}f=0;while(1){if((f|0)>=(d|0)){break}mI(e+(f<<3)|0,mr(a,f)|0);f=f+1|0}while(1){if((f|0)>=(c[b+8>>2]|0)){break}mL(e+(f<<3)|0);f=f+1|0}return}function nF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function nG(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function nH(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function nI(a){a=a|0;var b=0,d=0;b=a;if((c[(c[b>>2]|0)+164>>2]|0)<0){a=bm[c[(c[b>>2]|0)+160>>2]&1023](b)|0;d=a;return d|0}else{a=c[(c[b>>2]|0)+164>>2]|0;d=a;return d|0}return 0}function nJ(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+156>>2]&1023](d,b)|0}function nK(a,b){a=a|0;b=b|0;var d=0;d=b;return bq[c[(c[d>>2]|0)+152>>2]&1023](a,d)|0}function nL(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+148>>2]&1023](d,b)|0}function nM(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function nN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+32|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=a;a=b;b=d;d=e;e=c[(c[b>>2]|0)+212>>2]|0;if((mJ(d)|0)!=0){oI(6600,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)}m=mT(d)|0;n=mT(b)|0;if((m|0)>(n|0)){mI(a,b);mL(l);i=f;return}mS(h|0,c[b>>2]|0);mS(g|0,c[b>>2]|0);mS(j|0,c[e>>2]|0);mS(k|0,c[e>>2]|0);e=c[(g|0)+4>>2]|0;o=c[(h|0)+4>>2]|0;mI(h|0,b);b=n-m|0;mH(g|0,b+1|0);nH(j|0,mr(d,m)|0);while(1){if(!((b|0)>=0)){break}p=c[(c[e>>2]|0)+(b<<2)>>2]|0;mP(p,j|0,c[(c[o>>2]|0)+(n<<2)>>2]|0);q=0;while(1){if(!((q|0)<=(m|0))){break}mP(k|0,p,mr(d,q)|0);nz(c[(c[o>>2]|0)+(q+b<<2)>>2]|0,c[(c[o>>2]|0)+(q+b<<2)>>2]|0,k|0);q=q+1|0}b=b-1|0;n=n-1|0}mK(h|0);mI(l,g|0);mI(a,h|0);nA(g|0);nA(h|0);nA(k|0);nA(j|0);i=f;return}function nO(a,b){a=a|0;b=b|0;c[974]=a;c[972]=b;c[192]=1;return}function nP(a,b){a=a|0;b=b|0;return c[(c[a>>2]|0)+(b<<2)>>2]|0}function nQ(a){a=a|0;var b=0;b=a+4|0;c[b>>2]=(c[b>>2]|0)-1|0;return}function nR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+64|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=a;mS(k|0,c[o>>2]|0);mS(l|0,c[o>>2]|0);mS(m|0,c[o>>2]|0);mS(f|0,c[o>>2]|0);mS(g|0,c[o>>2]|0);mS(h|0,c[o>>2]|0);mS(j|0,c[o>>2]|0);mS(n|0,nu(o)|0);mL(k|0);mN(l|0);mI(g|0,d);mI(h|0,b);while(1){nN(f|0,j|0,g|0,h|0);if((mJ(j|0)|0)!=0){break}mP(m|0,l|0,f|0);nz(m|0,k|0,m|0);mI(k|0,l|0);mI(l|0,m|0);mI(g|0,h|0);mI(h|0,j|0)}nH(n|0,mr(h|0,0)|0);mO(o,n|0,l|0);nA(n|0);nA(f|0);nA(g|0);nA(h|0);nA(j|0);nA(k|0);nA(l|0);nA(m|0);i=e;return}function nS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+132>>2]&1023](e,b,d);return}function nT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function nU(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+84>>2]&1023](e,b,d);return}function nV(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function nW(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=a;a=b;b=c;c=d;d=e;e=f;f=e|0;h=e+8|0;i=e+16|0;nF(a,c|0,c+8|0);nF(b,d|0,d+8|0);mP(i,a,b);nF(a,c|0,c+16|0);nF(b,d|0,d+16|0);mP(h,a,b);nF(a,c+8|0,c+16|0);nF(b,d+8|0,d+16|0);mP(f,a,b);mP(g+8|0,c+8|0,d+8|0);mP(g|0,c|0,d|0);mP(b,c+16|0,d+16|0);nF(a,g+8|0,b);nz(a,f,a);nF(g+16|0,b,g|0);nz(h,h,g+16|0);nF(g+16|0,g+8|0,h);nz(i,i,g|0);nz(g+8|0,i,g+8|0);return}function nX(a,b){a=a|0;b=b|0;var d=0;d=b;bl[c[(c[d>>2]|0)+172>>2]&1023](a,d);return}function nY(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function nZ(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+144>>2]&1023](b)|0}function n_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;return bi[c[(c[e>>2]|0)+32>>2]&1023](e,b,d)|0}function n$(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+16>>2]&1023](d,b);return}function n0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+168>>2]&1023](a,b,e)|0}function n1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+36>>2]&1023](a,b,e)|0}function n2(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function n3(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+60>>2]&1023](b)|0}function n4(a,b){a=a|0;b=b|0;if((c[192]|0)==0){oa()}bn[c[974]&1023](a,b,c[972]|0);return}function n5(a){a=a|0;h9(n6()|0,a);nO(396,0);return}function n6(){if((c[320]|0)!=0){return 1288}hZ(1288);c[320]=1;return 1288}function n7(a,b,c){a=a|0;b=b|0;c=c|0;eE(a,n6()|0,b);return}function n8(a){a=a|0;nO(98,a);return}function n9(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+16|0;h=g|0;j=b;b=e;d3(h|0);e=aI(f|0,7784)|0;if((e|0)==0){i=g;return}f=eu(b,2)|0;k=(f+7|0)/8&-1;l=(f|0)%8;f=bm[c[198]&1023](k)|0;while(1){if((a0(f|0,1,k|0,e|0)|0)==0){m=5932;break}if((l|0)!=0){a[f]=(d[f]|0|0)%(1<<l|0)&255}d2(h|0,k,1,1,0,0,f);if((dR(h|0,b)|0)<0){break}}if((m|0)==5932){oq(8904,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);i=g;return}aB(e|0);er(j,h|0);dU(h|0);bk[c[200]&1023](f);i=g;return}function oa(){var a=0,b=0,d=0;a=i;b=aI(7768,8896)|0;if((b|0)!=0){n8(7768);d=b;aB(d|0);i=a;return}else{oq(7248,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);n5(0);i=a;return}}function ob(a){a=a|0;var b=0;b=a;c[b+8>>2]=8;c[b+4>>2]=0;c[b>>2]=bm[c[198]&1023](c[b+8>>2]<<2)|0;return}function oc(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;if((c[d+4>>2]|0)==(c[d+8>>2]|0)){if((c[d+8>>2]|0)!=0){b=d+8|0;c[b>>2]=c[b>>2]<<1}else{c[d+8>>2]=8}c[d>>2]=bq[c[194]&1023](c[d>>2]|0,c[d+8>>2]<<2)|0}c[(c[d>>2]|0)+(c[d+4>>2]<<2)>>2]=a;a=d+4|0;c[a>>2]=(c[a>>2]|0)+1|0;return}function od(a){a=a|0;var b=0;b=a;bk[c[200]&1023](c[b>>2]|0);c[b+8>>2]=0;c[b+4>>2]=0;return}function oe(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=c[d+4>>2]|0;e=0;while(1){if((e|0)>=(b|0)){break}bk[a&1023](c[(c[d>>2]|0)+(e<<2)>>2]|0);e=e+1|0}return}function of(a){a=a|0;ob(a|0);return}function og(a){a=a|0;var b=0;b=a;oe(b|0,362);od(b|0);return}function oh(a){a=a|0;var b=0;b=a;bk[c[200]&1023](c[b>>2]|0);bk[c[200]&1023](b);return}function oi(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=d;d=c[(e|0)+4>>2]|0;f=0;while(1){if((f|0)>=(d|0)){g=5971;break}h=c[(c[e>>2]|0)+(f<<2)>>2]|0;if((bh(c[h>>2]|0,b|0)|0)==0){g=5968;break}f=f+1|0}if((g|0)==5971){h=bm[c[198]&1023](8)|0;c[h>>2]=ot(b)|0;oc(e|0,h);e=a;b=h;f=b+4|0;c[f>>2]=e;return}else if((g|0)==5968){e=a;b=h;f=b+4|0;c[f>>2]=e;return}}function oj(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=d+12|0;c[a>>2]=(c[a>>2]|0)+b|0;if((c[d+12>>2]|0)>>>0>=(c[d+4>>2]|0)>>>0){b=0;a=d;e=a+8|0;c[e>>2]=b;return}else{b=(c[d+4>>2]|0)-(c[d+12>>2]|0)|0;a=d;e=a+8|0;c[e>>2]=b;return}}function ok(a){a=a|0;c[a+128>>2]=42;return}function ol(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[(d|0)+4>>2]|0;e=0;while(1){if((e|0)>=(b|0)){f=5988;break}if((bh(c[c[(c[d>>2]|0)+(e<<2)>>2]>>2]|0,a|0)|0)==0){f=5985;break}e=e+1|0}if((f|0)==5988){e=0;a=e;return a|0}else if((f|0)==5985){e=1;a=e;return a|0}return 0}function om(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=b;b=c[(d|0)+4>>2]|0;e=0;while(1){if((e|0)>=(b|0)){f=5998;break}g=c[(c[d>>2]|0)+(e<<2)>>2]|0;if((bh(c[g>>2]|0,a|0)|0)==0){f=5995;break}e=e+1|0}if((f|0)==5998){e=0;a=e;return a|0}else if((f|0)==5995){e=c[g+4>>2]|0;a=e;return a|0}return 0}function on(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=c[(d|0)+4>>2]|0;e=0;while(1){if((e|0)>=(b|0)){break}bk[a&1023](c[(c[(c[d>>2]|0)+(e<<2)>>2]|0)+4>>2]|0);e=e+1|0}return}function oo(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;if((c[196]|0)!=0){f=e|0;c[f>>2]=b;c[f+4>>2]=0;f=a6(c[p>>2]|0,a|0,e|0)|0;e=f;i=d;return e|0}else{f=0;e=f;i=d;return e|0}return 0}function op(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+1024|0;f=e|0;oA(f|0,1024,b,d);oo(4456,(w=i,i=i+16|0,c[w>>2]=a,c[w+8>>2]=f|0,w)|0);i=e;return}function oq(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=e|0;c[f>>2]=b;c[f+4>>2]=0;op(5264,a,e|0);i=d;return}function or(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=e|0;c[f>>2]=b;c[f+4>>2]=0;op(5008,a,e|0);i=d;return}function os(a){a=a|0;uu(a);return}function ot(a){a=a|0;var b=0,d=0;b=a;a=uJ(b|0)|0;d=bm[c[198]&1023](a+1|0)|0;uM(d|0,b|0);return d|0}function ou(a,b,c){a=a|0;b=b|0;c=c|0;return ov(262,482,264,a,b,c)|0}function ov(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=b;b=d;d=e;e=f;f=h;h=0;j=ot(g)|0;g=j;k=g;l=g;L7192:while(1){while(1){m=aL(k|0,37)|0;if((m|0)==0){n=6022;break L7192}if((a[m+1|0]|0)==0){n=6027;break L7192}if((a[m+1|0]|0|0)!=37){break}k=m+2|0}a[m]=0;o=bq[i&1023](e,l)|0;if((o|0)<0){n=6032;break}h=h+o|0;a[m]=37;l=m;g=0;while(1){if(!((g|0)!=0^1)){break}m=m+1|0;p=a[m]|0;if((p|0)==0){n=6037;break L7192}else if((p|0)==66){p=f;o=bq[d&1023](e,(w=c[p+4>>2]|0,c[p+4>>2]=w+8,c[(c[p>>2]|0)+w>>2]|0))|0;if((o|0)<0){n=6039;break L7192}h=h+o|0;g=1}else{if((aL(8696,a[m]|0|0)|0)!=0){if((a[m]|0|0)==90){m=m+1|0}p=a[m+1|0]|0;a[m+1|0]=0;q=f;o=bi[b&1023](e,l,(w=c[q+4>>2]|0,c[q+4>>2]=w+8,c[(c[q>>2]|0)+w>>2]|0))|0;if((o|0)<0){n=6046;break L7192}h=h+o|0;a[m+1|0]=p;g=1}}}g=m+1|0;l=g;k=g}if((n|0)==6022){o=bq[i&1023](e,l)|0;if((o|0)<0){h=-1}else{h=h+o|0}}else if((n|0)!=6037)if((n|0)==6032){h=-1}else if((n|0)==6046){h=-1}else if((n|0)!=6027)if((n|0)==6039){h=-1}bk[c[200]&1023](j);return h|0}function ow(a,b){a=a|0;b=b|0;var c=0;c=b;if((aV(c|0,a|0)|0)==-1){a=-1;b=a;return b|0}else{a=uJ(c|0)|0;b=a;return b|0}return 0}function ox(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=hQ(a,b,(w=i,i=i+8|0,c[w>>2]=d,w)|0)|0;i=e;return f|0}function oy(a,b){a=a|0;b=b|0;return oF(a,0,b)|0}function oz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e|0;g=f|0;c[g>>2]=d;c[g+4>>2]=0;g=ou(a,b,f|0)|0;i=e;return g|0}function oA(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f|0;c[g>>2]=a;a=b;c[g+4>>2]=a;c[g+8>>2]=a;c[g+12>>2]=0;ov(142,678,460,g,d,e);i=f;return c[g+12>>2]|0}function oB(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;a=e;f=ay((c[a>>2]|0)+(c[a+12>>2]|0)|0,c[a+8>>2]|0,7360,(w=i,i=i+8|0,c[w>>2]=b,w)|0)|0;if((f|0)<0){b=f;a=b;i=d;return a|0}else{oj(e,f);b=f;a=b;i=d;return a|0}return 0}function oC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=a;a=f;g=hT((c[a>>2]|0)+(c[a+12>>2]|0)|0,c[a+8>>2]|0,b,(w=i,i=i+8|0,c[w>>2]=d,w)|0)|0;if((g|0)<0){d=g;b=d;i=e;return b|0}else{oj(f,g);d=g;b=d;i=e;return b|0}return 0}function oD(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=d;e=oE((c[a>>2]|0)+(c[a+12>>2]|0)|0,c[a+8>>2]|0,b)|0;if((e|0)<0){b=e;a=b;return a|0}else{oj(d,e);b=e;a=b;return a|0}return 0}function oE(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+168>>2]&1023](a,b,e)|0}function oF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+36>>2]&1023](a,b,e)|0}function oG(a){a=a|0;var b=0;b=a;a=c[(c[b>>2]|0)+212>>2]|0;pk(b);if((c[a+20>>2]|0)==0){return}pl(b,b,c[a+20>>2]|0);return}function oH(a){a=a|0;var b=0;b=a;oL(b,(c[(c[b>>2]|0)+212>>2]|0)+24|0);return}function oI(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;f=e|0;c[f>>2]=b;c[f+4>>2]=0;op(5904,a,e|0);aX(128);i=d;return}function oJ(a){a=a|0;var b=0,d=0;b=i;d=uq(a)|0;if((d|0)!=0){i=b;return d|0}else{oI(7208,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);return 0}return 0}function oK(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=uw(a,b)|0;if((e|0)!=0){i=d;return e|0}else{oI(8720,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);return 0}return 0}function oL(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function oM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=a;a=b;b=e;e=f;il(g);er(g+196|0,b);f=bm[c[198]&1023](44)|0;c[g+212>>2]=f;h=f;c[h>>2]=c[a>>2]|0;oN(h+4|0,c[h>>2]|0);oN(h+12|0,c[h>>2]|0);oL(h+4|0,a);oL(h+12|0,d);c[g+4>>2]=584;c[g+8>>2]=492;c[g+120>>2]=720;c[g+124>>2]=720;c[g+96>>2]=156;c[g+112>>2]=156;c[g+100>>2]=450;c[g+48>>2]=488;c[g+40>>2]=488;c[g+104>>2]=818;c[g+84>>2]=146;c[g+148>>2]=830;c[g+28>>2]=306;c[g+24>>2]=306;c[g+136>>2]=464;c[g+140>>2]=464;c[g+144>>2]=788;c[g+20>>2]=828;c[g+128>>2]=280;c[g+132>>2]=294;c[g+36>>2]=20;c[g+168>>2]=606;c[g+16>>2]=72;c[g+32>>2]=474;c[g>>2]=242;if((c[(c[h>>2]|0)+164>>2]|0)<0){c[g+160>>2]=484}else{c[g+164>>2]=c[(c[h>>2]|0)+164>>2]<<1}c[g+152>>2]=702;c[g+156>>2]=518;c[g+176>>2]=416;c[g+60>>2]=578;c[g+64>>2]=622;c[g+68>>2]=558;c[g+72>>2]=560;if(((c[b+4>>2]|0)!=0&1&c[c[b+8>>2]>>2]|0)!=0){c[g+52>>2]=598}else{c[g+52>>2]=114}oN(h+24|0,g);oN(h+32|0,g);pk(h+24|0);if((e|0)!=0){c[h+20>>2]=bm[c[198]&1023](12)|0;d3(c[h+20>>2]|0);er(c[h+20>>2]|0,e);pl(h+32|0,h+24|0,e);e=h;g=e+40|0;c[g>>2]=0;return}else{c[h+20>>2]=0;oL(h+32|0,h+24|0);e=h;g=e+40|0;c[g>>2]=0;return}}function oN(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function oO(a){a=a|0;var b=0,d=0;b=a;a=c[(c[b>>2]|0)+212>>2]|0;d=bm[c[198]&1023](20)|0;c[b+4>>2]=d;b=d;oN(b+4|0,c[a>>2]|0);oN(b+12|0,c[a>>2]|0);c[b>>2]=1;return}function oP(a){a=a|0;var b=0;b=a;a=c[b+4>>2]|0;ps(a+4|0);ps(a+12|0);bk[c[200]&1023](c[b+4>>2]|0);return}function oQ(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;a=c[b+4>>2]|0;if((c[a>>2]|0)!=0){c[d>>2]=1;return}else{c[d>>2]=0;oL(d+4|0,a+4|0);pp(d+12|0,a+12|0);return}}function oR(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=c[(c[d>>2]|0)+212>>2]|0;e=c[a+4>>2]|0;a=c[d+4>>2]|0;if((c[a>>2]|0)!=0){c[e>>2]=1;return}if((pG(a+12|0)|0)!=0){c[e>>2]=1;return}else{pY(e,a,b+4|0);return}}function oS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=b;b=d;d=uq(b<<3)|0;k=c[(c[c[a>>2]>>2]|0)+212>>2]|0;l=c[(c[a>>2]|0)+4>>2]|0;oN(f|0,c[l+12>>2]|0);oN(g|0,c[l+12>>2]|0);oN(h|0,c[l+12>>2]|0);m=0;while(1){if((m|0)>=(b|0)){break}l=c[(c[a+(m<<2)>>2]|0)+4>>2]|0;n=c[(c[j+(m<<2)>>2]|0)+4>>2]|0;oN(d+(m<<3)|0,c[l+12>>2]|0);do{if((c[l>>2]|0)!=0){c[n>>2]=1}else{if((pG(l+12|0)|0)!=0){c[n>>2]=1;break}else{break}}}while(0);m=m+1|0}m=0;while(1){if((m|0)>=(b|0)){break}l=c[(c[a+(m<<2)>>2]|0)+4>>2]|0;p_(d+(m<<3)|0,l+12|0);if((m|0)>0){pu(d+(m<<3)|0,d+(m<<3)|0,d+(m-1<<3)|0)}m=m+1|0}px(h|0,d+(b-1<<3)|0);m=b-1|0;while(1){if((m|0)<=0){break}l=c[(c[a+(m<<2)>>2]|0)+4>>2]|0;pu(d+(m<<3)|0,d+(m-1<<3)|0,h|0);pu(h|0,h|0,l+12|0);p_(h|0,h|0);m=m-1|0}oL(d|0,h|0);m=0;while(1){if((m|0)>=(b|0)){break}l=c[(c[a+(m<<2)>>2]|0)+4>>2]|0;n=c[(c[j+(m<<2)>>2]|0)+4>>2]|0;if((c[n>>2]|0)==0){pB(h|0,l+4|0);pZ(h|0,h|0,3);py(h|0,h|0,k+4|0);pu(h|0,h|0,d+(m<<3)|0);p_(g|0,l+4|0);pB(f|0,h|0);pw(f|0,f|0,g|0);pw(g|0,l+4|0,f|0);pu(g|0,g|0,h|0);pw(g|0,g|0,l+12|0);oL(n+4|0,f|0);oL(n+12|0,g|0);c[n>>2]=0}m=m+1|0}ps(f|0);ps(g|0);ps(h|0);m=0;while(1){if((m|0)>=(b|0)){break}ps(d+(m<<3)|0);m=m+1|0}uu(d);i=e;return}function oT(a){a=a|0;c[c[a+4>>2]>>2]=1;return}function oU(a){a=a|0;return c[c[a+4>>2]>>2]|0}function oV(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=b;b=d;d=c[(c[a>>2]|0)+212>>2]|0;k=c[j+4>>2]|0;l=c[a+4>>2]|0;m=c[b+4>>2]|0;if((c[l>>2]|0)!=0){o_(j,b);i=e;return}if((c[m>>2]|0)!=0){o_(j,a);i=e;return}if((pN(l+4|0,m+4|0)|0)!=0){oN(f|0,c[d>>2]|0);oN(g|0,c[d>>2]|0);oN(h|0,c[d>>2]|0);pw(g|0,m+4|0,l+4|0);px(g|0,g|0);pw(f|0,m+12|0,l+12|0);pu(f|0,f|0,g|0);pB(g|0,f|0);pw(g|0,g|0,l+4|0);pw(g|0,g|0,m+4|0);pw(h|0,l+4|0,g|0);pu(h|0,h|0,f|0);pw(h|0,h|0,l+12|0);oL(k+4|0,g|0);oL(k+12|0,h|0);c[k>>2]=0;ps(f|0);ps(g|0);ps(h|0);i=e;return}if((pN(l+12|0,m+12|0)|0)!=0){c[k>>2]=1;i=e;return}if((pG(l+12|0)|0)!=0){c[k>>2]=1;i=e;return}else{pY(k,l,d+4|0);i=e;return}}function oW(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=i;i=i+24|0;g=f|0;h=f+8|0;j=f+16|0;k=a;a=b;b=d;d=e;e=uq(d<<3)|0;l=c[(c[c[a>>2]>>2]|0)+212>>2]|0;m=c[(c[a>>2]|0)+4>>2]|0;n=c[(c[b>>2]|0)+4>>2]|0;oN(g|0,c[m+4>>2]|0);oN(h|0,c[m+4>>2]|0);oN(j|0,c[m+4>>2]|0);oN(e|0,c[m+4>>2]|0);pw(e|0,n+4|0,m+4|0);o=1;while(1){if((o|0)>=(d|0)){break}m=c[(c[a+(o<<2)>>2]|0)+4>>2]|0;n=c[(c[b+(o<<2)>>2]|0)+4>>2]|0;oN(e+(o<<3)|0,c[m+4>>2]|0);pw(e+(o<<3)|0,n+4|0,m+4|0);pu(e+(o<<3)|0,e+(o<<3)|0,e+(o-1<<3)|0);o=o+1|0}px(j|0,e+(d-1<<3)|0);o=d-1|0;while(1){if((o|0)<=0){break}m=c[(c[a+(o<<2)>>2]|0)+4>>2]|0;n=c[(c[b+(o<<2)>>2]|0)+4>>2]|0;pu(e+(o<<3)|0,e+(o-1<<3)|0,j|0);pw(h|0,n+4|0,m+4|0);pu(j|0,j|0,h|0);o=o-1|0}oL(e|0,j|0);o=0;while(1){if((o|0)>=(d|0)){break}m=c[(c[a+(o<<2)>>2]|0)+4>>2]|0;n=c[(c[b+(o<<2)>>2]|0)+4>>2]|0;p=c[(c[k+(o<<2)>>2]|0)+4>>2]|0;do{if((c[m>>2]|0)!=0){o_(c[k+(o<<2)>>2]|0,c[b+(o<<2)>>2]|0)}else{if((c[n>>2]|0)!=0){o_(c[k+(o<<2)>>2]|0,c[a+(o<<2)>>2]|0);break}if((pN(m+4|0,n+4|0)|0)!=0){pw(j|0,n+12|0,m+12|0);pu(j|0,j|0,e+(o<<3)|0);pB(g|0,j|0);pw(g|0,g|0,m+4|0);pw(g|0,g|0,n+4|0);pw(h|0,m+4|0,g|0);pu(h|0,h|0,j|0);pw(h|0,h|0,m+12|0);oL(p+4|0,g|0);oL(p+12|0,h|0);c[p>>2]=0;break}if((pN(m+12|0,n+12|0)|0)!=0){c[p>>2]=1;break}if((pG(m+12|0)|0)!=0){c[p>>2]=1;break}else{pY(p,m,l+4|0);break}}}while(0);o=o+1|0}ps(g|0);ps(h|0);ps(j|0);o=0;while(1){if((o|0)>=(d|0)){break}ps(e+(o<<3)|0);o=o+1|0}uu(e);i=f;return}function oX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function oY(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+8|0;e=d|0;f=a;a=b;if((f|0)==(a|0)){g=0;h=g;i=d;return h|0}b=c[(c[f>>2]|0)+212>>2]|0;if((c[b+40>>2]|0)!=0){pV(e|0,f);pW(e|0,f,a);oX(e|0,e|0,c[b+40>>2]|0);b=((pF(e|0)|0)!=0^1)&1;ps(e|0);g=b;h=g;i=d;return h|0}else{g=pX(c[f+4>>2]|0,c[a+4>>2]|0)|0;h=g;i=d;return h|0}return 0}function oZ(a){a=a|0;var b=0,d=0;b=c[a+4>>2]|0;if((c[b>>2]|0)!=0){a=0;d=a;return d|0}else{a=pn(b+12|0)|0;d=a;return d|0}return 0}function o_(a,b){a=a|0;b=b|0;var d=0;d=c[a+4>>2]|0;a=c[b+4>>2]|0;if((c[a>>2]|0)!=0){c[d>>2]=1;return}else{c[d>>2]=0;oL(d+4|0,a+4|0);oL(d+12|0,a+12|0);return}}function o$(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+16|0;d=b|0;e=a;a=c[(c[e>>2]|0)+212>>2]|0;d3(d|0);n4(d|0,(c[e>>2]|0)+196|0);pl(e,a+32|0,d|0);dU(d|0);i=b;return}function o0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=a;a=c[h+4>>2]|0;j=c[(c[h>>2]|0)+212>>2]|0;oN(f|0,c[j>>2]|0);oN(g|0,c[j>>2]|0);c[a>>2]=0;pS(a+4|0,b,d);while(1){pB(f|0,a+4|0);py(f|0,f|0,j+4|0);pu(f|0,f|0,a+4|0);py(f|0,f|0,j+12|0);if((pE(f|0)|0)!=0){break}pB(a+4|0,a+4|0);pT(f|0);py(a+4|0,a+4|0,f|0)}pC(a+12|0,f|0);if((pU(a+12|0)|0)<0){pp(a+12|0,a+12|0)}if((c[j+20>>2]|0)==0){k=f|0;ps(k);l=g|0;ps(l);i=e;return}pl(h,h,c[j+20>>2]|0);k=f|0;ps(k);l=g|0;ps(l);i=e;return}function o1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=b;b=c[d+4>>2]|0;do{if((c[b>>2]|0)!=0){if(-1==(aM(79,e|0)|0)){f=0;break}else{f=1;break}}else{if(-1==(aM(91,e|0)|0)){f=0;break}d=pR(e,a,b+4|0)|0;if((d|0)==0){f=0;break}if(-1==(aV(5e3,e|0)|0)){f=0;break}g=pR(e,a,b+12|0)|0;if((g|0)==0){f=0;break}if(-1==(aM(93,e|0)|0)){f=0;break}else{f=(d+g|0)+4|0;break}}}while(0);return f|0}function o2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=a;a=b;b=c[d+4>>2]|0;d=0;if((c[b>>2]|0)!=0){g=ay(f|0,a|0,5480,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}else{h=1;j=h;i=e;return j|0}}g=ay(f|0,a|0,5256,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){k=0}else{k=a-d|0}l=k;g=pQ(f+d|0,l,b+4|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){m=0}else{m=a-d|0}l=m;g=ay(f+d|0,l|0,5e3,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){n=0}else{n=a-d|0}l=n;g=pQ(f+d|0,l,b+12|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}d=d+g|0;if(d>>>0>=a>>>0){o=0}else{o=a-d|0}l=o;g=ay(f+d|0,l|0,4416,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)|0;if((g|0)<0){h=g;j=h;i=e;return j|0}else{h=d+g|0;j=h;i=e;return j|0}return 0}function o3(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((kG(a)|0)!=0){if((kU(a)|0)!=0){pM(e);i=d;return}else{oq(6472,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);i=d;return}}else{if((kV(a)|0)<2){oq(5872,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);i=d;return}else{b=c[e+4>>2]|0;c[b>>2]=0;pP(b+4|0,kW(a,0)|0);pP(b+12|0,kW(a,1)|0);i=d;return}}}function o4(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;b=d;d=e;e=c[f+4>>2]|0;g=b;pM(f);while(1){if((a[g]|0|0)!=0){h=(a_(a[g]|0|0)|0)!=0}else{h=0}if(!h){break}g=g+1|0}if((a[g]|0|0)==79){i=(g-b|0)+1|0;j=i;return j|0}c[e>>2]=0;if((a[g]|0|0)!=91){i=0;j=i;return j|0}g=g+1|0;g=g+(pO(e+4|0,g,d)|0)|0;while(1){if((a[g]|0|0)!=0){k=(a_(a[g]|0|0)|0)!=0}else{k=0}if(!k){break}g=g+1|0}if((a[g]|0|0)!=44){i=0;j=i;return j|0}g=g+1|0;g=g+(pO(e+12|0,g,d)|0)|0;if((a[g]|0|0)!=93){i=0;j=i;return j|0}if((pL(f)|0)!=0){i=(g-b|0)+1|0;j=i;return j|0}else{pM(f);i=0;j=i;return j|0}return 0}function o5(a){a=a|0;var b=0;b=c[a+212>>2]|0;ps(b+32|0);ps(b+24|0);if((c[b+20>>2]|0)!=0){dU(c[b+20>>2]|0);bk[c[200]&1023](c[b+20>>2]|0)}if((c[b+40>>2]|0)!=0){dU(c[b+40>>2]|0);bk[c[200]&1023](c[b+40>>2]|0)}ps(b+4|0);ps(b+12|0);bk[c[200]&1023](b);return}function o6(a){a=a|0;return 1}function o7(a){a=a|0;return(c[a+4>>2]|0)+4|0}function o8(a){a=a|0;return(c[a+4>>2]|0)+12|0}function o9(a){a=a|0;return(c[a+4>>2]|0)+4|0}function pa(a){a=a|0;return(c[a+4>>2]|0)+12|0}function pb(a){a=a|0;return(c[(c[a>>2]|0)+212>>2]|0)+4|0}function pc(a){a=a|0;return(c[(c[a>>2]|0)+212>>2]|0)+12|0}function pd(a){a=a|0;var b=0;b=c[a+4>>2]|0;a=pq(b+4|0)|0;return a+(pq(b+12|0)|0)|0}function pe(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[b+4>>2]|0;b=pm(d,a+4|0)|0;b=b+(pm(d+b|0,a+12|0)|0)|0;return b|0}function pf(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=c[d+4>>2]|0;c[b>>2]=0;e=po(b+4|0,a)|0;e=e+(po(b+12|0,a+e|0)|0)|0;if((pL(d)|0)!=0){f=e;return f|0}pM(d);f=e;return f|0}function pg(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a;aE(e|0,7056,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);a=c[b+164>>2]|0;if((a|0)!=0){b=e;f=(a<<3|0)/2&-1;aE(b|0,8600,(w=i,i=i+8|0,c[w>>2]=f,w)|0);i=d;return}else{f=e;aE(f|0,7176,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);i=d;return}}function ph(a){a=a|0;var b=0;if((pG(a)|0)!=0){b=0}else{b=2}return b|0}function pi(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;do{if((pG(d)|0)!=0){e=0}else{a=c[d+4>>2]|0;f=b;if((f|0)==0){e=a+4|0;break}else if((f|0)==1){e=a+12|0;break}else{e=0;break}}}while(0);return e|0}function pj(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+24|0;d=b|0;e=b+16|0;f=a;d3(d|0);oN(e|0,c[f>>2]|0);ex(d|0,(c[f>>2]|0)+196|0,1);dT(d|0,d|0,1);oX(e|0,f,d|0);f=pF(e|0)|0;dU(d|0);ps(e|0);i=b;return f|0}function pk(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+8|0;d=b|0;e=a;a=c[(c[e>>2]|0)+212>>2]|0;f=c[e+4>>2]|0;oN(d|0,c[a>>2]|0);c[f>>2]=0;while(1){pD(f+4|0);pB(d|0,f+4|0);py(d|0,d|0,a+4|0);pu(d|0,d|0,f+4|0);py(d|0,d|0,a+12|0);if(!((pE(d|0)|0)!=0^1)){break}}pC(f+12|0,d|0);ps(d|0);i=b;return}function pl(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+84>>2]&1023](e,b,d);return}function pm(a,b){a=a|0;b=b|0;var d=0;d=b;return bq[c[(c[d>>2]|0)+152>>2]&1023](a,d)|0}function pn(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+144>>2]&1023](b)|0}function po(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+156>>2]&1023](d,b)|0}function pp(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function pq(a){a=a|0;var b=0,d=0;b=a;if((c[(c[b>>2]|0)+164>>2]|0)<0){a=bm[c[(c[b>>2]|0)+160>>2]&1023](b)|0;d=a;return d|0}else{a=c[(c[b>>2]|0)+164>>2]|0;d=a;return d|0}return 0}function pr(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;h=i;i=i+16|0;j=h|0;k=h+8|0;l=d;d=e;e=c[b+212>>2]|0;oN(j|0,d);oN(k|0,d);bl[l&1023](j|0,e+4|0);bl[l&1023](k|0,e+12|0);oM(a,j|0,k|0,f,g);ps(j|0);ps(k|0);i=h;return}function ps(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function pt(a){a=a|0;var b=0;b=c[a+212>>2]|0;a=ij(c[b>>2]|0)|0;pu(b+4|0,b+4|0,a);pu(b+4|0,b+4|0,a);pu(b+12|0,b+12|0,a);pu(b+12|0,b+12|0,a);pu(b+12|0,b+12|0,a);pk(b+24|0);if((c[b+20>>2]|0)!=0){pl(b+32|0,b+24|0,c[b+20>>2]|0);return}else{oL(b+32|0,b+24|0);return}}function pu(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function pv(a,b){a=a|0;b=b|0;var d=0;d=c[a+212>>2]|0;c[d+40>>2]=bm[c[198]&1023](12)|0;d3(c[d+40>>2]|0);er(c[d+40>>2]|0,b);return}function pw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function px(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function py(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function pz(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+64|0;f=e|0;g=e+16|0;h=e+32|0;j=e+48|0;k=a;a=b;b=c;c=d;d3(f|0);d3(g|0);d3(h|0);d3(j|0);eq(h|0,2);er(g|0,b);d=2;while(1){if(!((d|0)<=(c|0))){break}d9(f|0,b,g|0);d9(j|0,a,h|0);ew(f|0,f|0,j|0);er(h|0,g|0);er(g|0,f|0);d=d+1|0}er(k,g|0);dU(j|0);dU(h|0);dU(g|0);dU(f|0);i=e;return}function pA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+32|0;f=e|0;g=e+16|0;h=b;b=d;d3(f|0);d3(g|0);eh(f|0,h,b);dN(f|0,f|0,1);pz(g|0,h,c,b);ew(f|0,f|0,g|0);er(a,f|0);dU(f|0);dU(g|0);i=e;return}function pB(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function pC(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+56>>2]&1023](d,b);return}function pD(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+128>>2]&1023](b);return}function pE(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+52>>2]&1023](b)|0}function pF(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function pG(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+140>>2]&1023](b)|0}function pH(a,b,c){a=a|0;b=b|0;c=c|0;return}function pI(a){a=a|0;return}function pJ(a){a=a|0;return}function pK(a,b,d){a=a|0;b=b|0;d=d|0;c[a+4>>2]=b;return}function pL(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;a=c[(c[f>>2]|0)+212>>2]|0;g=c[f+4>>2]|0;if((c[g>>2]|0)!=0){f=1;h=f;i=b;return h|0}else{oN(d|0,c[a>>2]|0);oN(e|0,c[a>>2]|0);pB(d|0,g+4|0);py(d|0,d|0,a+4|0);pu(d|0,d|0,g+4|0);py(d|0,d|0,a+12|0);pB(e|0,g+12|0);g=((pN(d|0,e|0)|0)!=0^1)&1;ps(d|0);ps(e|0);f=g;h=f;i=b;return h|0}return 0}function pM(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function pN(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+148>>2]&1023](d,b)|0}function pO(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;return bi[c[(c[e>>2]|0)+32>>2]&1023](e,b,d)|0}function pP(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+16>>2]&1023](d,b);return}function pQ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+168>>2]&1023](a,b,e)|0}function pR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+36>>2]&1023](a,b,e)|0}function pS(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+132>>2]&1023](e,b,d);return}function pT(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function pU(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+144>>2]&1023](b)|0}function pV(a,b){a=a|0;b=b|0;oN(a,c[b>>2]|0);return}function pW(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+92>>2]&1023](e,b,d);return}function pX(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=b;do{if((c[d>>2]|0)==0){if((c[a>>2]|0)!=0){break}if((pN(d+4|0,a+4|0)|0)!=0){e=1}else{e=(pN(d+12|0,a+12|0)|0)!=0}f=e&1;g=f;return g|0}}while(0);if((c[d>>2]|0)!=0){h=(c[a>>2]|0)!=0}else{h=0}f=(h^1)&1;g=f;return g|0}function pY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=b;b=c[j+4>>2]|0;oN(f|0,b);oN(g|0,b);oN(h|0,b);pB(f|0,a+4|0);pZ(f|0,f|0,3);py(f|0,f|0,d);p_(g|0,a+12|0);px(g|0,g|0);pu(f|0,f|0,g|0);p_(h|0,a+4|0);pB(g|0,f|0);pw(g|0,g|0,h|0);pw(h|0,a+4|0,g|0);pu(h|0,h|0,f|0);pw(h|0,h|0,a+12|0);oL(j+4|0,g|0);oL(j+12|0,h|0);c[j>>2]=0;ps(f|0);ps(g|0);ps(h|0);i=e;return}function pZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function p_(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function p$(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d+500>>2]=568;c[d+484>>2]=88;c[d+488>>2]=300;c[d+492>>2]=154;c[d+476>>2]=446;c[d+464>>2]=728;c[d+472>>2]=742;bl[c[(c[a>>2]|0)+4>>2]&1023](d,c[a+4>>2]|0);c[(c[d+228>>2]|0)+192>>2]=d;c[(c[d+232>>2]|0)+192>>2]=d;c[(d+236|0)+192>>2]=d;return}function p0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;bs[c[(c[e>>2]|0)+468>>2]&1023](a,c[e+4>>2]|0,b,c[e>>2]|0);return}function p1(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f|0;h=f+8|0;j=e;e=0;qV(g|0,j+236|0);qV(h|0,j+236|0);qX(g|0,a,d);qX(h|0,b,c);if((qS(g|0,h|0)|0)==0){e=1;k=g|0;qU(k);l=h|0;qU(l);m=e;i=f;return m|0}qG(g|0,g|0,h|0);if((qC(g|0)|0)!=0){e=1}k=g|0;qU(k);l=h|0;qU(l);m=e;i=f;return m|0}function p2(a,b,d){a=a|0;b=b|0;d=d|0;d=i;aF(7104,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);i=d;return}function p3(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+8|0;h=g|0;j=a;a=b;b=d;d=e;e=f;bs[c[e+468>>2]&1023](j,a|0,b|0,e);qW(h|0,j);f=1;while(1){if((f|0)>=(d|0)){break}bs[c[e+468>>2]&1023](h|0,a+(f<<3)|0,b+(f<<3)|0,e);qG(j,j,h|0);f=f+1|0}qU(h|0);i=g;return}function p4(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+8|0;f=e|0;if((q8(f|0,b,d)|0)!=0){or(6768,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);d=1;b=d;i=e;return b|0}else{p$(a,f|0);p5(f|0);d=0;b=d;i=e;return b|0}return 0}function p5(a){a=a|0;var b=0;b=a;bk[c[c[b>>2]>>2]&1023](c[b+4>>2]|0);return}function p6(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=d+236|0;il(b);c[b+212>>2]=a;c[a+192>>2]=d;er(b+196|0,d|0);c[b>>2]=310;c[b+176>>2]=808;c[b+4>>2]=366;c[b+8>>2]=514;c[b+20>>2]=602;c[b+148>>2]=304;c[b+36>>2]=398;c[b+16>>2]=802;c[b+32>>2]=204;c[b+152>>2]=68;c[b+156>>2]=40;c[b+160>>2]=552;c[b+164>>2]=c[a+164>>2]|0;c[b+172>>2]=198;c[b+168>>2]=224;c[b+64>>2]=64;c[b+60>>2]=564;c[b+24>>2]=508;c[b+40>>2]=288;c[b+44>>2]=38;c[b+84>>2]=160;c[b+124>>2]=94;c[b+140>>2]=106;c[b+28>>2]=508;c[b+48>>2]=288;c[b+92>>2]=38;c[b+116>>2]=160;c[b+120>>2]=94;c[b+136>>2]=106;c[b+180>>2]=250;c[b+184>>2]=616;c[b+188>>2]=358;c[b+128>>2]=192;c[b+132>>2]=462;return}function p7(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;hQ(e,8504,(w=i,i=i+8|0,c[w>>2]=a+196|0,w)|0);ik(e,c[a+212>>2]|0);i=d;return}function p8(a){a=a|0;var b=0;b=a;c[b+4>>2]=bm[c[198]&1023](8)|0;qV(c[b+4>>2]|0,c[(c[b>>2]|0)+212>>2]|0);qH(c[b+4>>2]|0);return}function p9(a){a=a|0;var b=0;b=a;qU(c[b+4>>2]|0);bk[c[200]&1023](c[b+4>>2]|0);return}function qa(a,b){a=a|0;b=b|0;qT(c[a+4>>2]|0,c[b+4>>2]|0);return}function qb(a,b){a=a|0;b=b|0;return qS(c[a+4>>2]|0,c[b+4>>2]|0)|0}function qc(a,b,d){a=a|0;b=b|0;d=d|0;return qR(a,b,c[d+4>>2]|0)|0}function qd(a,b){a=a|0;b=b|0;qQ(c[a+4>>2]|0,b);return}function qe(a,b,d){a=a|0;b=b|0;d=d|0;return qP(c[a+4>>2]|0,b,d)|0}function qf(a,b){a=a|0;b=b|0;return qO(a,c[b+4>>2]|0)|0}function qg(a,b){a=a|0;b=b|0;return qN(c[a+4>>2]|0,b)|0}function qh(a){a=a|0;return qM(c[a+4>>2]|0)|0}function qi(a,b){a=a|0;b=b|0;qL(a,c[b+4>>2]|0);return}function qj(a,b,d){a=a|0;b=b|0;d=d|0;return qK(a,b,c[d+4>>2]|0)|0}function qk(a,b){a=a|0;b=b|0;return qJ(c[a+4>>2]|0,b)|0}function ql(a){a=a|0;return qI(c[a+4>>2]|0)|0}function qm(a){a=a|0;qH(c[a+4>>2]|0);return}function qn(a,b,d){a=a|0;b=b|0;d=d|0;qG(c[a+4>>2]|0,c[b+4>>2]|0,c[d+4>>2]|0);return}function qo(a,b,d){a=a|0;b=b|0;d=d|0;qF(c[a+4>>2]|0,c[b+4>>2]|0,c[d+4>>2]|0);return}function qp(a,b,d){a=a|0;b=b|0;d=d|0;qE(c[a+4>>2]|0,c[b+4>>2]|0,d);return}function qq(a,b){a=a|0;b=b|0;qD(c[a+4>>2]|0,c[b+4>>2]|0);return}function qr(a){a=a|0;return qC(c[a+4>>2]|0)|0}function qs(a,b){a=a|0;b=b|0;var d=0;d=a;c[d+4>>2]=bm[c[198]&1023](8)|0;qB(c[d+4>>2]|0,c[b+4>>2]|0);return}function qt(a){a=a|0;var b=0;b=a;qA(c[b+4>>2]|0);bk[c[200]&1023](c[b+4>>2]|0);return}function qu(a,b,d){a=a|0;b=b|0;d=d|0;qz(c[a+4>>2]|0,b,c[d+4>>2]|0);return}function qv(a){a=a|0;var b=0;b=a;a=c[(c[b>>2]|0)+192>>2]|0;qy(c[b+4>>2]|0);bk[c[a+496>>2]&1023](b);return}function qw(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=c[(c[e>>2]|0)+192>>2]|0;qx(c[e+4>>2]|0,b,d);bk[c[a+496>>2]&1023](e);return}function qx(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+132>>2]&1023](e,b,d);return}function qy(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+128>>2]&1023](b);return}function qz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;bn[c[(c[e>>2]|0)+188>>2]&1023](a,b,e);return}function qA(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+184>>2]&1023](b);return}function qB(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=c[a>>2]|0;bl[c[(c[a>>2]|0)+180>>2]&1023](d,a);return}function qC(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function qD(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function qE(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function qF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+92>>2]&1023](e,b,d);return}function qG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function qH(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function qI(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+60>>2]&1023](b)|0}function qJ(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+64>>2]&1023](d,b)|0}function qK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+168>>2]&1023](a,b,e)|0}function qL(a,b){a=a|0;b=b|0;var d=0;d=b;bl[c[(c[d>>2]|0)+172>>2]&1023](a,d);return}function qM(a){a=a|0;var b=0,d=0;b=a;if((c[(c[b>>2]|0)+164>>2]|0)<0){a=bm[c[(c[b>>2]|0)+160>>2]&1023](b)|0;d=a;return d|0}else{a=c[(c[b>>2]|0)+164>>2]|0;d=a;return d|0}return 0}function qN(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+156>>2]&1023](d,b)|0}function qO(a,b){a=a|0;b=b|0;var d=0;d=b;return bq[c[(c[d>>2]|0)+152>>2]&1023](a,d)|0}function qP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;return bi[c[(c[e>>2]|0)+32>>2]&1023](e,b,d)|0}function qQ(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+16>>2]&1023](d,b);return}function qR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=d;return bi[c[(c[e>>2]|0)+36>>2]&1023](a,b,e)|0}function qS(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+148>>2]&1023](d,b)|0}function qT(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function qU(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function qV(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function qW(a,b){a=a|0;b=b|0;qV(a,c[b>>2]|0);return}function qX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;qY(e,b,d,c[(c[e>>2]|0)+192>>2]|0);return}function qY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=b;b=d;d=e;if((qZ(a)|0)!=0){q_(f);return}if((qZ(b)|0)!=0){q_(f);return}else{bs[c[d+468>>2]&1023](c[f+4>>2]|0,a,b,d);return}}function qZ(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+140>>2]&1023](b)|0}function q_(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function q$(a,b){a=a|0;b=b|0;var d=0;d=i;aE(a|0,6456,(w=i,i=i+8|0,c[w>>2]=b,w)|0);i=d;return}function q0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=a;aE(f|0,8472,(w=i,i=i+8|0,c[w>>2]=b,w)|0);ef(f,0,d);aE(f|0,7072,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);i=e;return}function q1(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+16|0;e=d|0;d3(e|0);ep(e|0,c);q0(a,b,e|0);dU(e|0);i=d;return}function q2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;f=d;d=q3(b,f)|0;if((d|0)!=0){b=a;a=d;es(b,a,0);a=0;b=a;i=e;return b|0}else{or(6352,(w=i,i=i+8|0,c[w>>2]=f,w)|0);a=1;b=a;i=e;return b|0}return 0}function q3(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=a;a=b;if((ol(e,a)|0)!=0){b=om(e,a)|0;e=b;i=d;return e|0}else{or(6352,(w=i,i=i+8|0,c[w>>2]=a,w)|0);b=0;e=b;i=d;return e|0}return 0}function q4(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[b+4>>2]=0;return}function q5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e|0;g=d;d=q3(b,g)|0;if((d|0)!=0){d3(f|0);b=f|0;h=d;es(b,h,0);c[a>>2]=d$(f|0)|0;dU(f|0);f=0;a=f;i=e;return a|0}else{or(6352,(w=i,i=i+8|0,c[w>>2]=g,w)|0);f=1;a=f;i=e;return a|0}return 0}function q6(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;if((b|0)!=0){h=a+b|0}else{h=0}b=h;q4(f|0);while(1){a=q9(f|0,a,b)|0;if((c[f>>2]|0)!=4){j=228;break}k=ot(c[(f|0)+4>>2]|0)|0;a=q9(f|0,a,b)|0;if((c[f>>2]|0)!=4){j=230;break}oi(g,ot(c[(f|0)+4>>2]|0)|0,k);bk[c[200]&1023](k)}if((j|0)==228){g=f|0;ra(g);i=e;return}else if((j|0)==230){bk[c[200]&1023](k);g=f|0;ra(g);i=e;return}}function q7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;e=a;a=b;b=q3(a,5864)|0;f=1;do{if((b|0)!=0){g=0;while(1){if(g>>>0>=6){h=244;break}if((bh(b|0,c[808+(g<<3)>>2]|0)|0)==0){break}g=g+1|0}if((h|0)==244){break}f=bq[c[(808+(g<<3)|0)+4>>2]&1023](e,a)|0;if((f|0)!=0){or(9024,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)}j=f;k=j;i=d;return k|0}}while(0);or(8624,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0);j=f;k=j;i=d;return k|0}function q8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+16|0;f=e|0;of(f|0);q6(f|0,b,d);d=q7(a,f|0)|0;on(f|0,c[200]|0);og(f|0);i=e;return d|0}function q9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;b=d;d=e;e=32;L265:while(1){while(1){do{if((d|0)!=0){if(b>>>0<d>>>0){g=254;break}else{g=256;break}}else{g=254}}while(0);do{if((g|0)==254){g=0;if((a[b]|0|0)==0){g=256;break}h=b;b=h+1|0;i=a[h]|0;if(0){g=257;break L265}else{break}}}while(0);if((g|0)==256){g=0;if(1){g=257;break L265}}if((aL(8480,i<<24>>24|0)|0)==0){break}}if((i<<24>>24|0)!=35){g=271;break}while(1){do{if((d|0)!=0){if(b>>>0<d>>>0){g=264;break}else{g=266;break}}else{g=264}}while(0);do{if((g|0)==264){g=0;if((a[b]|0|0)==0){g=266;break}h=b;b=h+1|0;i=a[h]|0;if(0){g=267;break L265}else{break}}}while(0);if((g|0)==266){g=0;if(1){g=267;break L265}}if((i<<24>>24|0)==10){break}}}if((g|0)==271){c[f>>2]=4;bk[c[200]&1023](c[f+4>>2]|0);h=bm[c[198]&1023](e)|0;j=0;L296:while(1){a[h+j|0]=i;j=j+1|0;if((j|0)==(e|0)){e=e+32|0;h=bq[c[194]&1023](h,e)|0}do{if((d|0)!=0){if(b>>>0<d>>>0){g=278;break}else{g=280;break}}else{g=278}}while(0);do{if((g|0)==278){g=0;if((a[b]|0|0)==0){g=280;break}k=b;b=k+1|0;i=a[k]|0;if(0){break L296}else{break}}}while(0);if((g|0)==280){g=0;if(1){break}}if((aL(8288,i<<24>>24|0)|0)!=0){break}}a[h+j|0]=0;c[f+4>>2]=h;h=b;j=h;return j|0}else if((g|0)==267){c[f>>2]=5;h=b;j=h;return j|0}else if((g|0)==257){c[f>>2]=5;h=b;j=h;return j|0}return 0}function ra(a){a=a|0;bk[c[200]&1023](c[a+4>>2]|0);return}function rb(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;g=i;i=i+56|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=a;a=b;b=d;d=e;e=f;f=c[e+504>>2]|0;q=uq(d<<3)|0;r=uq(d<<3)|0;s=0;while(1){if((s|0)>=(d|0)){break}rc(q+(s<<3)|0,f+432|0);rc(r+(s<<3)|0,f+432|0);rd(q+(s<<3)|0,a+(s<<3)|0);s=s+1|0}rc(h|0,f+216|0);rc(j|0,f+216|0);rc(k|0,f+216|0);re(h|0);rc(l|0,f|0);rc(m|0,f|0);rc(n|0,f|0);rc(o|0,f|0);a=c[f+652>>2]|0;s=0;while(1){if((s|0)>=(a|0)){break}rf(h|0,h|0);t=0;while(1){if((t|0)>=(d|0)){break}u=o9(q+(t<<3)|0)|0;v=pa(q+(t<<3)|0)|0;w=o9(b+(t<<3)|0)|0;x=pa(b+(t<<3)|0)|0;rg(l|0,m|0,n|0,u,v,o|0);rh(j|0,l|0,m|0,n|0,w,x);ri(h|0,h|0,j|0);t=t+1|0}iV(q,q,d);s=s+1|0}if((c[f+656>>2]|0)<0){t=0;while(1){if((t|0)>=(d|0)){break}rj(r+(t<<3)|0,q+(t<<3)|0);t=t+1|0}rk(k|0,h|0)}else{t=0;while(1){if((t|0)>=(d|0)){break}rd(r+(t<<3)|0,q+(t<<3)|0);t=t+1|0}rd(k|0,h|0)}a=c[f+648>>2]|0;while(1){if((s|0)>=(a|0)){break}rf(h|0,h|0);t=0;while(1){if((t|0)>=(d|0)){break}u=o9(q+(t<<3)|0)|0;v=pa(q+(t<<3)|0)|0;w=o9(b+(t<<3)|0)|0;x=pa(b+(t<<3)|0)|0;rg(l|0,m|0,n|0,u,v,o|0);rh(j|0,l|0,m|0,n|0,w,x);ri(h|0,h|0,j|0);t=t+1|0}iV(q,q,d);s=s+1|0}ri(h|0,h|0,k|0);t=0;while(1){if((t|0)>=(d|0)){break}u=o9(q+(t<<3)|0)|0;v=pa(q+(t<<3)|0)|0;s=o9(r+(t<<3)|0)|0;a=pa(r+(t<<3)|0)|0;w=o9(b+(t<<3)|0)|0;x=pa(b+(t<<3)|0)|0;rl(l|0,m|0,n|0,u,v,s,a,o|0);rh(j|0,l|0,m|0,n|0,w,x);ri(h|0,h|0,j|0);t=t+1|0}rm(p,h|0,j|0,e+452|0);rn(h|0);rn(j|0);rn(k|0);t=0;while(1){if((t|0)>=(d|0)){break}rn(q+(t<<3)|0);rn(r+(t<<3)|0);t=t+1|0}uu(q);uu(r);rn(l|0);rn(m|0);rn(n|0);rn(o|0);i=g;return}function rc(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function rd(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function re(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function rf(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function rg(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;a=b;b=c;c=d;d=e;e=f;rf(g,c);rN(e,g,g);rN(g,e,g);re(a);rN(g,g,a);rj(g,g);rO(a,d);ri(e,a,d);ri(b,g,c);rN(b,b,e);rj(b,b);return}function rh(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0;g=a;ri(rr(g)|0,b,e);e=rQ(g)|0;rP(e,d,rr(g)|0);ri(rr(g)|0,c,f);return}function ri(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function rj(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function rk(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function rl(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;i=c;c=d;d=e;e=f;f=g;g=h;rP(a,d,f);rP(b,e,c);ri(i,c,f);ri(g,d,e);rP(i,i,g);return}function rm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b;b=c;c=rr(e)|0;rk(b,e);rj(c,c);ri(e,e,b);r3(a,e,b,d);return}function rn(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function ro(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;rp(d);b=c[d+4>>2]|0;d=0;d=d+(q2(b+28|0,a,6336)|0)|0;d=d+(q2(b+16|0,a,8448)|0)|0;d=d+(q2(b+40|0,a,7048)|0)|0;d=d+(q5(b|0,a,6344)|0)|0;d=d+(q5(b+4|0,a,5840)|0)|0;d=d+(q5(b+8|0,a,5464)|0)|0;d=d+(q5(b+12|0,a,5240)|0)|0;return d|0}function rp(a){a=a|0;var b=0;b=a;c[b>>2]=4128;a=bm[c[198]&1023](52)|0;c[b+4>>2]=a;b=a;d3(b+16|0);d3(b+28|0);d3(b+40|0);return}function rq(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+48|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=a;a=b;b=d;d=e;e=f;f=c[e+504>>2]|0;p=uq(d<<3)|0;q=0;while(1){if((q|0)>=(d|0)){break}rc(p+(q<<3)|0,f+432|0);rd(p+(q<<3)|0,a+(q<<3)|0);q=q+1|0}rc(h|0,f+216|0);rc(j|0,f+216|0);re(h|0);rc(k|0,f|0);rc(l|0,f|0);rc(m|0,f|0);rc(n|0,f|0);f=(eu(e|0,2)|0)-2|0;while(1){q=0;while(1){if((q|0)>=(d|0)){break}r=o9(p+(q<<3)|0)|0;s=pa(p+(q<<3)|0)|0;t=o9(b+(q<<3)|0)|0;u=pa(b+(q<<3)|0)|0;rg(k|0,l|0,m|0,r,s,n|0);rh(j|0,k|0,l|0,m|0,t,u);ri(h|0,h|0,j|0);q=q+1|0}if((f|0)==0){break}iV(p,p,d);if((eB(e|0,f)|0)!=0){q=0;while(1){if((q|0)>=(d|0)){break}r=o9(p+(q<<3)|0)|0;s=pa(p+(q<<3)|0)|0;v=o9(a+(q<<3)|0)|0;w=pa(a+(q<<3)|0)|0;t=o9(b+(q<<3)|0)|0;u=pa(b+(q<<3)|0)|0;rl(k|0,l|0,m|0,r,s,v,w,n|0);rh(j|0,k|0,l|0,m|0,t,u);ri(h|0,h|0,j|0);q=q+1|0}iW(p,p,a,d)}f=f-1|0;rf(h|0,h|0)}rk(j|0,h|0);f=rr(h|0)|0;rj(f,rr(h|0)|0);ri(h|0,h|0,j|0);rs(o,h|0,e+452|0);rn(h|0);rn(j|0);q=0;while(1){if((q|0)>=(d|0)){break}rn(p+(q<<3)|0);q=q+1|0}uu(p);rn(k|0);rn(l|0);rn(m|0);rn(n|0);i=g;return}function rr(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+72>>2]&1023](b)|0}function rs(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function rt(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;ru(d);b=c[d+4>>2]|0;d=0;d=d+(q2(b|0,a,4984)|0)|0;d=d+(q2(b+12|0,a,4400)|0)|0;d=d+(q5(b+24|0,a,4248)|0)|0;return d|0}function ru(a){a=a|0;var b=0;b=a;c[b>>2]=4144;a=bm[c[198]&1023](28)|0;c[b+4>>2]=a;b=a;d3(b|0);d3(b+12|0);return}function rv(a){a=a|0;var b=0;b=a;a=b;dU(a|0);dU(a+12|0);bk[c[200]&1023](b);return}function rw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=b;d3(g|0);er(g|0,a+12|0);jL(g+12|0,g|0);b=bm[c[198]&1023](648)|0;c[g+504>>2]=b;h=b;d3(g+452|0);eq(g+452|0,c[a+24>>2]|0);jL(h|0,a|0);rc(e|0,h|0);rc(f|0,h|0);re(e|0);ry(f|0);oM(h+432|0,e|0,f|0,g|0,g+452|0);ok(h+432|0);rn(e|0);rn(f|0);lB(h+216|0,h|0);c[g+496>>2]=536;c[g+228>>2]=bm[c[198]&1023](216)|0;f=h+432|0;c[g+228>>2]=f;c[g+232>>2]=f;p6(g,h+216|0);c[g+468>>2]=732;c[g+464>>2]=582;c[g+472>>2]=332;c[g+480>>2]=780;c[g+484>>2]=632;c[g+488>>2]=428;c[g+492>>2]=96;c[g+500>>2]=544;i=d;return}function rx(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;q$(d,9216);q0(d,4984,a|0);q0(d,4400,a+12|0);q1(d,4248,c[a+24>>2]|0);return}function ry(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function rz(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;i=i+16|0;d=b|0;e=b+8|0;f=a;a=c[(c[f>>2]|0)+192>>2]|0;rM(d|0,c[f+4>>2]|0);rM(e|0,c[f+4>>2]|0);rm(d|0,c[f+4>>2]|0,e|0,a+452|0);rd(c[f+4>>2]|0,d|0);rn(d|0);rn(e|0);i=b;return}function rA(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=i;i=i+72|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+40|0;n=f+48|0;o=f+56|0;p=f+64|0;q=a;a=b;b=d;d=e;e=c[d+504>>2]|0;r=m|0;s=n|0;t=o|0;u=o9(a)|0;v=pa(a)|0;w=o9(b)|0;x=pa(b)|0;rc(g|0,e+432|0);rd(g|0,a);a=o9(g|0)|0;b=pa(g|0)|0;rc(k|0,e+216|0);rc(l|0,e+216|0);re(k|0);rc(m|0,e|0);rc(n|0,e|0);rc(o|0,e|0);rc(p|0,e|0);rc(h|0,e|0);rc(j|0,e|0);re(h|0);re(j|0);e=(eu(d|0,2)|0)-2|0;while(1){rT(m|0,n|0,o|0,a,b,h|0,j|0,p|0);rh(l|0,m|0,n|0,o|0,w,x);ri(k|0,k|0,l|0);if((e|0)==0){break}rf(p|0,a);rO(r,p|0);rN(p|0,r,p|0);rf(r,j|0);rN(p|0,p|0,r);ri(h|0,b,h|0);rO(h|0,h|0);rf(j|0,h|0);rf(s,b);ri(r,a,s);rO(r,r);rO(r,r);rO(t,r);rf(a,p|0);rP(a,a,t);rf(s,s);rO(s,s);rO(s,s);rO(s,s);rP(r,r,a);ri(p|0,p|0,r);rP(b,p|0,s);if((eB(d|0,e)|0)!=0){rU(m|0,n|0,o|0,a,b,h|0,j|0,u,v,p|0);rh(l|0,m|0,n|0,o|0,w,x);ri(k|0,k|0,l|0);ri(p|0,u,j|0);rP(p|0,p|0,a);rf(r,p|0);ri(s,h|0,j|0);ri(s,s,v);rP(s,s,b);rd(j|0,a);rf(a,s);ri(t,p|0,r);rP(a,a,t);rO(t,j|0);ri(t,t,r);rP(a,a,t);ri(t,j|0,r);rP(t,t,a);ri(t,t,s);ri(s,p|0,r);ri(s,s,b);rP(b,t,s);ri(h|0,h|0,p|0);rf(j|0,h|0)}e=e-1|0;rf(k|0,k|0)}rk(l|0,k|0);e=rr(k|0)|0;rj(e,rr(k|0)|0);ri(k|0,k|0,l|0);rs(q,k|0,d+452|0);rn(k|0);rn(l|0);rn(h|0);rn(j|0);rn(g|0);rn(m|0);rn(n|0);rn(o|0);rn(p|0);i=f;return}function rB(a,b,c){a=a|0;b=b|0;c=c|0;rd(a,b);return}function rC(a){a=a|0;var b=0;b=a;iN(b+236|0);a=c[b+504>>2]|0;iN(a+432|0);iN(a+216|0);iN(a|0);bk[c[200]&1023](a);dU(b+452|0);dU(b|0);iN(b+12|0);return}function rD(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+80|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=a;a=b;b=d;d=o9(a)|0;r=pa(a)|0;s=c[b+504>>2]|0;t=c[198]|0;u=eu(b|0,2)<<2;c[q+4>>2]=bm[t&1023](u)|0;u=c[q+4>>2]|0;rc(f|0,s+432|0);rd(f|0,a);q=o9(f|0)|0;t=pa(f|0)|0;rc(g|0,s|0);rc(h|0,s|0);rc(j|0,s|0);rc(n|0,s|0);rc(o|0,s|0);rc(p|0,s|0);rc(k|0,s|0);rc(l|0,s|0);rc(m|0,s|0);s=(eu(b|0,2)|0)-2|0;while(1){rg(g|0,h|0,j|0,q,t,n|0);if((s|0)==0){break}rO(f|0,f|0);if((eB(b|0,s)|0)!=0){rl(k|0,l|0,m|0,q,t,d,r,n|0);rN(f|0,f|0,a);ri(n|0,g|0,m|0);ri(o|0,k|0,j|0);rN(n|0,n|0,o|0);ri(o|0,l|0,j|0);ri(p|0,h|0,m|0);rN(o|0,o|0,p|0);ri(j|0,j|0,m|0);ri(m|0,g|0,l|0);ri(p|0,k|0,h|0);rN(m|0,m|0,p|0);ri(g|0,g|0,k|0);ri(h|0,h|0,l|0);c[u>>2]=bm[c[198]&1023](48)|0;rR(c[u>>2]|0,g|0,h|0,m|0,n|0,o|0,j|0)}else{c[u>>2]=bm[c[198]&1023](24)|0;rS(c[u>>2]|0,g|0,h|0,j|0)}u=u+4|0;s=s-1|0}c[u>>2]=bm[c[198]&1023](24)|0;rS(c[u>>2]|0,g|0,h|0,j|0);u=u+4|0;c[u>>2]=0;rn(k|0);rn(l|0);rn(m|0);rn(p|0);rn(o|0);rn(n|0);rn(g|0);rn(h|0);rn(j|0);rn(f|0);i=e;return}function rE(a){a=a|0;var b=0;b=a;a=c[b+4>>2]|0;while(1){if((c[a>>2]|0)==0){break}bk[c[200]&1023](c[a>>2]|0);a=a+4|0}bk[c[200]&1023](c[b+4>>2]|0);return}function rF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+56|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=a;a=b;b=d;d=c[b+4>>2]|0;o=c[(c[b>>2]|0)+504>>2]|0;p=o9(a)|0;q=pa(a)|0;rc(f|0,c[n>>2]|0);rc(g|0,c[n>>2]|0);re(f|0);rc(h|0,o|0);rc(j|0,o|0);rc(k|0,o|0);rc(l|0,o|0);rc(m|0,o|0);rf(k|0,p);rf(l|0,q);ri(m|0,p,q);o=(eu(c[b>>2]|0,2)|0)-2|0;while(1){if((o|0)<=0){break}if((eB(c[b>>2]|0,o)|0)!=0){a=c[d>>2]|0;ri(h|0,a|0,k|0);ri(j|0,a+8|0,l|0);rP(h|0,h|0,j|0);ri(j|0,a+24|0,p);rP(h|0,h|0,j|0);rN(rQ(g|0)|0,h|0,a+40|0);ri(h|0,a+32|0,q);ri(j|0,a+16|0,m|0);rP(rr(g|0)|0,h|0,j|0)}else{a=c[d>>2]|0;rh(g|0,a|0,a+8|0,a+16|0,p,q)}ri(f|0,f|0,g|0);d=d+4|0;o=o-1|0;rf(f|0,f|0)}o=c[d>>2]|0;rh(g|0,o|0,o+8|0,o+16|0,p,q);ri(f|0,f|0,g|0);rk(g|0,f|0);q=rr(f|0)|0;rj(q,rr(f|0)|0);ri(f|0,f|0,g|0);rs(n,f|0,(c[b>>2]|0)+452|0);rn(k|0);rn(l|0);rn(m|0);rn(f|0);rn(g|0);rn(j|0);rn(h|0);i=e;return}function rG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=d;if((bh(b|0,9008)|0)!=0){return}if((bh(a|0,8592)|0)!=0){if((bh(a|0,8456)|0)!=0){if((bh(a|0,8248)|0)==0){c[e+468>>2]=66;c[e+484>>2]=124;c[e+488>>2]=676;c[e+492>>2]=364}}else{c[e+468>>2]=390;c[e+484>>2]=632;c[e+488>>2]=428;c[e+492>>2]=96}}else{c[e+468>>2]=732;c[e+484>>2]=632;c[e+488>>2]=428;c[e+492>>2]=96}return}function rH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+56|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+40|0;n=f+48|0;o=a;a=b;b=d;d=e;e=c[d+504>>2]|0;p=o9(a)|0;q=pa(a)|0;r=o9(b)|0;s=pa(b)|0;rc(g|0,e+432|0);rd(g|0,a);b=o9(g|0)|0;t=pa(g|0)|0;rc(h|0,e+216|0);rc(j|0,e+216|0);re(h|0);rc(k|0,e|0);rc(l|0,e|0);rc(m|0,e|0);rc(n|0,e|0);e=(eu(d|0,2)|0)-2|0;while(1){rg(k|0,l|0,m|0,b,t,n|0);rh(j|0,k|0,l|0,m|0,r,s);ri(h|0,h|0,j|0);if((e|0)==0){break}rO(g|0,g|0);if((eB(d|0,e)|0)!=0){rl(k|0,l|0,m|0,b,t,p,q,n|0);rh(j|0,k|0,l|0,m|0,r,s);ri(h|0,h|0,j|0);rN(g|0,g|0,a)}e=e-1|0;rf(h|0,h|0)}rk(j|0,h|0);e=rr(h|0)|0;rj(e,rr(h|0)|0);ri(h|0,h|0,j|0);rs(o,h|0,d+452|0);rn(h|0);rn(j|0);rn(g|0);rn(k|0);rn(l|0);rn(m|0);rn(n|0);i=f;return}function rI(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;e=i;i=i+240|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=e+80|0;r=e+88|0;s=e+96|0;t=e+104|0;u=e+112|0;v=e+120|0;w=e+128|0;x=e+136|0;y=e+144|0;z=e+152|0;A=e+160|0;B=e+168|0;C=e+176|0;D=e+184|0;E=e+192|0;F=e+200|0;G=e+208|0;H=e+216|0;I=e+224|0;J=e+232|0;K=a;a=b;b=c;c=d;d=o9(a)|0;L=pa(a)|0;a=o9(b)|0;M=pa(b)|0;rM(f|0,d);rM(g|0,d);rM(h|0,d);rM(j|0,d);rM(k|0,d);rM(l|0,d);rM(m|0,d);rM(n|0,d);rM(t|0,d);rM(o|0,K);rM(p|0,K);rM(q|0,K);rM(r|0,d);rM(s|0,K);rO(k|0,L);re(j|0);rj(f|0,k|0);rj(g|0,j|0);rf(h|0,d);rf(t|0,h|0);rP(l|0,t|0,h|0);rO(m|0,l|0);rO(m|0,m|0);rN(m|0,m|0,l|0);ri(l|0,t|0,h|0);rN(m|0,m|0,l|0);rN(m|0,m|0,g|0);ri(m|0,m|0,k|0);rO(m|0,m|0);rO(h|0,h|0);rN(h|0,h|0,t|0);rO(t|0,h|0);rN(t|0,t|0,h|0);rN(l|0,t|0,g|0);rf(t|0,k|0);ri(n|0,t|0,k|0);ri(n|0,n|0,m|0);rf(t|0,l|0);ri(t|0,t|0,l|0);rP(n|0,n|0,t|0);rN(r|0,d,a);rO(t|0,d);rP(t|0,t|0,a);rf(h|0,r|0);ri(h|0,t|0,h|0);rd(rQ(q|0)|0,L);rd(rr(q|0)|0,M);rf(q|0,q|0);a=rQ(q|0)|0;rP(a,rQ(q|0)|0,h|0);rj(s|0,q|0);rk(s|0,s|0);rk(r|0,r|0);ri(rQ(q|0)|0,L,r|0);L=rQ(q|0)|0;rj(L,rQ(q|0)|0);ri(rr(q|0)|0,M,r|0);rf(q|0,q|0);M=rQ(q|0)|0;rP(M,t|0,rQ(q|0)|0);M=rr(q|0)|0;rj(M,rr(q|0)|0);ry(h|0);rk(t|0,k|0);re(o|0);re(p|0);rM(u|0,d);rM(v|0,d);rM(w|0,d);rM(x|0,d);rM(y|0,d);rM(z|0,d);rM(A|0,d);rM(B|0,d);rM(C|0,d);rM(D|0,d);rM(E|0,d);rM(F|0,d);rM(G|0,d);rM(H|0,d);rM(I|0,p|0);rM(J|0,p|0);d=(eu(c|0,2)|0)-2|0;while(1){rf(u|0,g|0);rf(v|0,h|0);rf(w|0,j|0);rf(x|0,k|0);rf(y|0,l|0);rf(z|0,m|0);ri(A|0,f|0,h|0);ri(B|0,g|0,j|0);ri(C|0,h|0,k|0);ri(D|0,j|0,l|0);ri(E|0,k|0,m|0);ri(F|0,l|0,n|0);rf(I|0,p|0);ri(J|0,o|0,q|0);if((eB(c|0,d)|0)!=0){ri(G|0,C|0,u|0);ri(H|0,A|0,w|0);rP(f|0,G|0,H|0);ri(f|0,f|0,t|0);ri(G|0,C|0,v|0);ri(H|0,B|0,w|0);rP(g|0,G|0,H|0);ri(G|0,D|0,v|0);ri(H|0,B|0,x|0);rP(h|0,G|0,H|0);ri(h|0,h|0,t|0);ri(G|0,D|0,w|0);ri(H|0,C|0,x|0);rP(j|0,G|0,H|0);ri(G|0,E|0,w|0);ri(H|0,C|0,y|0);rP(k|0,G|0,H|0);ri(k|0,k|0,t|0);ri(G|0,E|0,x|0);ri(H|0,D|0,y|0);rP(l|0,G|0,H|0);ri(G|0,F|0,x|0);ri(H|0,D|0,z|0);rP(m|0,G|0,H|0);ri(m|0,m|0,t|0);ri(G|0,F|0,y|0);ri(H|0,E|0,z|0);rP(n|0,G|0,H|0);M=rQ(K)|0;ri(M,rQ(I|0)|0,C|0);M=rr(K)|0;ri(M,rr(I|0)|0,C|0);M=rQ(o|0)|0;ri(M,rQ(J|0)|0,w|0);M=rr(o|0)|0;ri(M,rr(J|0)|0,w|0);rP(o|0,o|0,K);M=rQ(K)|0;ri(M,rQ(I|0)|0,D|0);M=rr(K)|0;ri(M,rr(I|0)|0,D|0);M=rQ(p|0)|0;ri(M,rQ(J|0)|0,x|0);M=rr(p|0)|0;ri(M,rr(J|0)|0,x|0);rP(p|0,p|0,K);M=rQ(p|0)|0;ri(M,rQ(p|0)|0,r|0);M=rr(p|0)|0;ri(M,rr(p|0)|0,r|0);M=rQ(K)|0;ri(M,rQ(I|0)|0,E|0);M=rr(K)|0;ri(M,rr(I|0)|0,E|0);M=rQ(q|0)|0;ri(M,rQ(J|0)|0,y|0);M=rr(q|0)|0;ri(M,rr(J|0)|0,y|0);rP(q|0,q|0,K);ri(q|0,q|0,s|0)}else{ri(G|0,B|0,u|0);ri(H|0,A|0,v|0);rP(f|0,G|0,H|0);ri(G|0,C|0,u|0);ri(H|0,A|0,w|0);rP(g|0,G|0,H|0);ri(g|0,g|0,t|0);ri(G|0,C|0,v|0);ri(H|0,B|0,w|0);rP(h|0,G|0,H|0);ri(G|0,D|0,v|0);ri(H|0,B|0,x|0);rP(j|0,G|0,H|0);ri(j|0,j|0,t|0);ri(G|0,D|0,w|0);ri(H|0,C|0,x|0);rP(k|0,G|0,H|0);ri(G|0,E|0,w|0);ri(H|0,C|0,y|0);rP(l|0,G|0,H|0);ri(l|0,l|0,t|0);ri(G|0,E|0,x|0);ri(H|0,D|0,y|0);rP(m|0,G|0,H|0);ri(G|0,F|0,x|0);ri(H|0,D|0,z|0);rP(n|0,G|0,H|0);ri(n|0,n|0,t|0);M=rQ(K)|0;ri(M,rQ(I|0)|0,B|0);M=rr(K)|0;ri(M,rr(I|0)|0,B|0);M=rQ(o|0)|0;ri(M,rQ(J|0)|0,v|0);M=rr(o|0)|0;ri(M,rr(J|0)|0,v|0);rP(o|0,o|0,K);M=rQ(K)|0;ri(M,rQ(I|0)|0,C|0);M=rr(K)|0;ri(M,rr(I|0)|0,C|0);M=rQ(p|0)|0;ri(M,rQ(J|0)|0,w|0);M=rr(p|0)|0;ri(M,rr(J|0)|0,w|0);rP(p|0,p|0,K);M=rQ(K)|0;ri(M,rQ(I|0)|0,D|0);M=rr(K)|0;ri(M,rr(I|0)|0,D|0);M=rQ(q|0)|0;ri(M,rQ(J|0)|0,x|0);M=rr(q|0)|0;ri(M,rr(J|0)|0,x|0);rP(q|0,q|0,K);M=rQ(q|0)|0;ri(M,rQ(q|0)|0,r|0);M=rr(q|0)|0;ri(M,rr(q|0)|0,r|0)}if((d|0)==0){break}d=d-1|0}rm(K,q|0,p|0,c+452|0);rn(o|0);rn(p|0);rn(q|0);rn(f|0);rn(g|0);rn(h|0);rn(j|0);rn(k|0);rn(l|0);rn(m|0);rn(n|0);rn(u|0);rn(v|0);rn(w|0);rn(x|0);rn(y|0);rn(z|0);rn(A|0);rn(B|0);rn(C|0);rn(D|0);rn(E|0);rn(F|0);rn(G|0);rn(H|0);rn(r|0);rn(s|0);rn(t|0);rn(I|0);rn(J|0);i=e;return}function rJ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;e=i;i=i+120|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=e+80|0;r=e+88|0;s=e+96|0;t=e+104|0;u=e+112|0;v=b;b=d;d=o9(v)|0;w=pa(v)|0;v=eu(b|0,2)|0;x=bm[c[198]&1023](20)|0;c[a+4>>2]=x;a=x;c[a+16>>2]=bm[c[198]&1023](v<<6)|0;rM(a|0,d);rM(a+8|0,w);rd(a|0,d);rd(a+8|0,w);x=0;while(1){if((x|0)>=(v|0)){break}y=(c[a+16>>2]|0)+(x<<6)|0;rM(y|0,d);rM(y+8|0,d);rM(y+16|0,d);rM(y+24|0,d);rM(y+32|0,d);rM(y+40|0,d);rM(y+48|0,d);rM(y+56|0,d);x=x+1|0}rM(f|0,d);rM(g|0,d);rM(h|0,d);rM(j|0,d);rM(k|0,d);rM(l|0,d);rM(m|0,d);rM(n|0,d);rM(o|0,d);rO(k|0,w);re(j|0);rj(f|0,k|0);rj(g|0,j|0);rf(h|0,d);rf(o|0,h|0);rP(l|0,o|0,h|0);rO(m|0,l|0);rO(m|0,m|0);rN(m|0,m|0,l|0);ri(l|0,o|0,h|0);rN(m|0,m|0,l|0);rN(m|0,m|0,g|0);ri(m|0,m|0,k|0);rO(m|0,m|0);rO(h|0,h|0);rN(h|0,h|0,o|0);rO(o|0,h|0);rN(o|0,o|0,h|0);rN(l|0,o|0,g|0);rf(o|0,k|0);ri(n|0,o|0,k|0);ri(n|0,n|0,m|0);rf(o|0,l|0);ri(o|0,o|0,l|0);rP(n|0,n|0,o|0);ry(h|0);rk(o|0,k|0);w=0;rM(p|0,d);rM(q|0,d);rM(r|0,d);rM(s|0,d);rM(t|0,d);rM(u|0,d);d=v-2|0;while(1){v=(c[a+16>>2]|0)+(w<<6)|0;x=v|0;y=v+8|0;z=v+16|0;A=v+24|0;B=v+32|0;C=v+40|0;D=v+48|0;E=v+56|0;rf(p|0,g|0);rf(x,h|0);rf(y,j|0);rf(z,k|0);rf(A,l|0);rf(q|0,m|0);ri(r|0,f|0,h|0);ri(B,g|0,j|0);ri(C,h|0,k|0);ri(D,j|0,l|0);ri(E,k|0,m|0);ri(s|0,l|0,n|0);if((d|0)==0){break}w=w+1|0;if((eB(b|0,d)|0)!=0){ri(t|0,C,p|0);ri(u|0,r|0,y);rP(f|0,t|0,u|0);ri(f|0,f|0,o|0);ri(t|0,C,x);ri(u|0,B,y);rP(g|0,t|0,u|0);ri(t|0,D,x);ri(u|0,B,z);rP(h|0,t|0,u|0);ri(h|0,h|0,o|0);ri(t|0,D,y);ri(u|0,C,z);rP(j|0,t|0,u|0);ri(t|0,E,y);ri(u|0,C,A);rP(k|0,t|0,u|0);ri(k|0,k|0,o|0);ri(t|0,E,z);ri(u|0,D,A);rP(l|0,t|0,u|0);ri(t|0,s|0,z);ri(u|0,D,q|0);rP(m|0,t|0,u|0);ri(m|0,m|0,o|0);ri(t|0,s|0,A);ri(u|0,E,q|0);rP(n|0,t|0,u|0)}else{ri(t|0,B,p|0);ri(u|0,r|0,x);rP(f|0,t|0,u|0);ri(t|0,C,p|0);ri(u|0,r|0,y);rP(g|0,t|0,u|0);ri(g|0,g|0,o|0);ri(t|0,C,x);ri(u|0,B,y);rP(h|0,t|0,u|0);ri(t|0,D,x);ri(u|0,B,z);rP(j|0,t|0,u|0);ri(j|0,j|0,o|0);ri(t|0,D,y);ri(u|0,C,z);rP(k|0,t|0,u|0);ri(t|0,E,y);ri(u|0,C,A);rP(l|0,t|0,u|0);ri(l|0,l|0,o|0);ri(t|0,E,z);ri(u|0,D,A);rP(m|0,t|0,u|0);ri(t|0,s|0,z);ri(u|0,D,q|0);rP(n|0,t|0,u|0);ri(n|0,n|0,o|0)}d=d-1|0}rn(f|0);rn(g|0);rn(h|0);rn(j|0);rn(k|0);rn(l|0);rn(m|0);rn(n|0);rn(p|0);rn(q|0);rn(r|0);rn(s|0);rn(t|0);rn(u|0);rn(o|0);i=e;return}function rK(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b+4>>2]|0;d=eu(c[b>>2]|0,2)|0;e=0;while(1){if((e|0)>=(d|0)){break}f=(c[a+16>>2]|0)+(e<<6)|0;rn(f|0);rn(f+8|0);rn(f+16|0);rn(f+24|0);rn(f+32|0);rn(f+40|0);rn(f+48|0);rn(f+56|0);e=e+1|0}rn(a|0);rn(a+8|0);bk[c[200]&1023](c[a+16>>2]|0);bk[c[200]&1023](c[b+4>>2]|0);return}function rL(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+72|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=a;a=b;b=d;d=o9(a)|0;q=pa(a)|0;a=c[b+4>>2]|0;r=0;s=(eu(c[b>>2]|0,2)|0)-2|0;rM(f|0,d);rM(g|0,p);rM(h|0,d);rM(j|0,d);rM(k|0,p);rM(l|0,p);rM(m|0,p);rM(n|0,p);rM(o|0,p);rN(f|0,a|0,d);rO(h|0,a|0);rP(h|0,h|0,d);rf(j|0,f|0);ri(j|0,h|0,j|0);rd(rQ(m|0)|0,a+8|0);rd(rr(m|0)|0,q);rf(m|0,m|0);d=rQ(m|0)|0;rP(d,rQ(m|0)|0,j|0);rj(g|0,m|0);rk(g|0,g|0);rk(f|0,f|0);ri(rQ(m|0)|0,a+8|0,f|0);d=rQ(m|0)|0;rj(d,rQ(m|0)|0);ri(rr(m|0)|0,q,f|0);rf(m|0,m|0);q=rQ(m|0)|0;rP(q,h|0,rQ(m|0)|0);q=rr(m|0)|0;rj(q,rr(m|0)|0);re(k|0);re(l|0);while(1){q=(c[a+16>>2]|0)+(r<<6)|0;d=q|0;t=q+8|0;u=q+16|0;v=q+24|0;w=q+32|0;x=q+40|0;y=q+48|0;z=q+56|0;r=r+1|0;rf(n|0,l|0);ri(o|0,k|0,m|0);if((eB(c[b>>2]|0,s)|0)!=0){q=rQ(p)|0;ri(q,rQ(n|0)|0,x);q=rr(p)|0;ri(q,rr(n|0)|0,x);q=rQ(k|0)|0;ri(q,rQ(o|0)|0,t);q=rr(k|0)|0;ri(q,rr(o|0)|0,t);rP(k|0,k|0,p);q=rQ(p)|0;ri(q,rQ(n|0)|0,y);q=rr(p)|0;ri(q,rr(n|0)|0,y);q=rQ(l|0)|0;ri(q,rQ(o|0)|0,u);q=rr(l|0)|0;ri(q,rr(o|0)|0,u);rP(l|0,l|0,p);q=rQ(l|0)|0;ri(q,rQ(l|0)|0,f|0);q=rr(l|0)|0;ri(q,rr(l|0)|0,f|0);q=rQ(p)|0;ri(q,rQ(n|0)|0,z);q=rr(p)|0;ri(q,rr(n|0)|0,z);z=rQ(m|0)|0;ri(z,rQ(o|0)|0,v);z=rr(m|0)|0;ri(z,rr(o|0)|0,v);rP(m|0,m|0,p);ri(m|0,m|0,g|0)}else{v=rQ(p)|0;ri(v,rQ(n|0)|0,w);v=rr(p)|0;ri(v,rr(n|0)|0,w);w=rQ(k|0)|0;ri(w,rQ(o|0)|0,d);w=rr(k|0)|0;ri(w,rr(o|0)|0,d);rP(k|0,k|0,p);d=rQ(p)|0;ri(d,rQ(n|0)|0,x);d=rr(p)|0;ri(d,rr(n|0)|0,x);x=rQ(l|0)|0;ri(x,rQ(o|0)|0,t);x=rr(l|0)|0;ri(x,rr(o|0)|0,t);rP(l|0,l|0,p);t=rQ(p)|0;ri(t,rQ(n|0)|0,y);t=rr(p)|0;ri(t,rr(n|0)|0,y);y=rQ(m|0)|0;ri(y,rQ(o|0)|0,u);y=rr(m|0)|0;ri(y,rr(o|0)|0,u);rP(m|0,m|0,p);u=rQ(m|0)|0;ri(u,rQ(m|0)|0,f|0);u=rr(m|0)|0;ri(u,rr(m|0)|0,f|0)}if((s|0)==0){break}s=s-1|0}rm(p,m|0,l|0,(c[b>>2]|0)+452|0);rn(f|0);rn(g|0);rn(h|0);rn(j|0);rn(k|0);rn(l|0);rn(m|0);rn(n|0);rn(o|0);i=e;return}function rM(a,b){a=a|0;b=b|0;rc(a,c[b>>2]|0);return}function rN(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function rO(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function rP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function rQ(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+68>>2]&1023](b)|0}function rR(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;rc(i|0,c[a>>2]|0);rc(i+8|0,c[b>>2]|0);rc(i+16|0,c[d>>2]|0);rc(i+24|0,c[e>>2]|0);rc(i+32|0,c[f>>2]|0);rc(i+40|0,c[g>>2]|0);rd(i|0,a);rd(i+8|0,b);rd(i+16|0,d);rd(i+24|0,e);rd(i+32|0,f);rd(i+40|0,g);return}function rS(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=b;b=d;d=e;rc(f|0,c[a>>2]|0);rc(f+8|0,c[b>>2]|0);rc(f+16|0,c[d>>2]|0);rd(f|0,a);rd(f+8|0,b);rd(f+16|0,d);return}function rT(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;i=a;a=b;b=c;c=d;d=e;e=g;g=h;rf(i,e);rf(a,c);rO(g,a);rN(a,g,a);rN(i,i,a);rj(i,i);rO(g,d);ri(a,g,e);ri(a,a,f);ri(b,c,i);ri(i,i,e);ri(g,g,d);rN(b,b,g);rj(b,b);return}function rU(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0;k=a;a=b;b=c;c=f;f=h;h=i;i=j;ri(b,c,g);ri(i,h,b);rP(k,e,i);ri(a,b,f);ri(i,d,c);rP(a,a,i);ri(b,a,h);ri(i,k,f);rN(b,b,i);rj(b,b);return}function rV(a){a=a|0;var b=0;b=a;a=b;dU(a+16|0);dU(a+28|0);dU(a+40|0);bk[c[200]&1023](b);return}function rW(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=b;b=bm[c[198]&1023](660)|0;c[g+504>>2]=b;h=b;c[h+648>>2]=c[a>>2]|0;c[h+652>>2]=c[a+4>>2]|0;c[h+656>>2]=c[a+8>>2]|0;d3(g|0);er(g|0,a+16|0);jL(g+12|0,g|0);c[g+468>>2]=210;c[g+472>>2]=686;jL(h|0,a+28|0);rc(e|0,h|0);rc(f|0,h|0);re(e|0);ry(f|0);oM(h+432|0,e|0,f|0,g|0,a+40|0);rn(e|0);rn(f|0);lB(h+216|0,h|0);d3(g+452|0);er(g+452|0,a+40|0);c[g+228>>2]=h+432|0;c[g+232>>2]=c[g+228>>2]|0;c[g+464>>2]=582;p6(g,h+216|0);c[g+496>>2]=536;c[g+480>>2]=266;c[g+500>>2]=626;c[g+484>>2]=454;c[g+488>>2]=798;c[g+492>>2]=672;i=d;return}function rX(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;q$(d,8032);q0(d,6336,a+28|0);q0(d,7048,a+40|0);q0(d,8448,a+16|0);q1(d,6344,c[a>>2]|0);q1(d,5840,c[a+4>>2]|0);q1(d,5464,c[a+8>>2]|0);q1(d,5240,c[a+12>>2]|0);return}function rY(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+88|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+40|0;n=f+48|0;o=f+56|0;p=f+64|0;q=f+72|0;r=f+80|0;s=a;a=d;d=e;e=c[d+504>>2]|0;t=o|0;u=p|0;v=q|0;w=o9(a)|0;x=pa(a)|0;rc(g|0,e+432|0);rc(h|0,e+432|0);rd(g|0,b);b=o9(g|0)|0;a=pa(g|0)|0;y=o9(h|0)|0;z=pa(h|0)|0;rc(l|0,e+216|0);rc(m|0,e+216|0);rc(n|0,e+216|0);re(l|0);rc(o|0,e|0);rc(p|0,e|0);rc(q|0,e|0);rc(r|0,e|0);rc(j|0,e|0);rc(k|0,e|0);re(j|0);re(k|0);A=c[e+652>>2]|0;B=0;while(1){if((B|0)>=(A|0)){break}rf(l|0,l|0);rT(o|0,p|0,q|0,b,a,j|0,k|0,r|0);rh(m|0,o|0,p|0,q|0,w,x);ri(l|0,l|0,m|0);rf(r|0,b);rO(t,r|0);rN(r|0,t,r|0);rf(t,k|0);rN(r|0,r|0,t);ri(j|0,a,j|0);rO(j|0,j|0);rf(k|0,j|0);rf(u,a);ri(t,b,u);rO(t,t);rO(t,t);rO(v,t);rf(b,r|0);rP(b,b,v);rf(u,u);rO(u,u);rO(u,u);rO(u,u);rP(t,t,b);ri(r|0,r|0,t);rP(a,r|0,u);B=B+1|0}rk(j|0,j|0);rf(r|0,j|0);ri(b,b,r|0);ri(r|0,r|0,j|0);ri(a,a,r|0);re(j|0);re(k|0);if((c[e+656>>2]|0)<0){rj(h|0,g|0);rk(n|0,l|0)}else{rd(h|0,g|0);rd(n|0,l|0)}A=c[e+648>>2]|0;while(1){if((B|0)>=(A|0)){break}rf(l|0,l|0);rT(o|0,p|0,q|0,b,a,j|0,k|0,r|0);rh(m|0,o|0,p|0,q|0,w,x);ri(l|0,l|0,m|0);rf(r|0,b);rO(t,r|0);rN(r|0,t,r|0);rf(t,k|0);rN(r|0,r|0,t);ri(j|0,a,j|0);rO(j|0,j|0);rf(k|0,j|0);rf(u,a);ri(t,b,u);rO(t,t);rO(t,t);rO(v,t);rf(b,r|0);rP(b,b,v);rf(u,u);rO(u,u);rO(u,u);rO(u,u);rP(t,t,b);ri(r|0,r|0,t);rP(a,r|0,u);B=B+1|0}ri(l|0,l|0,n|0);rk(j|0,j|0);rf(r|0,j|0);ri(b,b,r|0);ri(r|0,r|0,j|0);ri(a,a,r|0);re(j|0);re(k|0);rl(o|0,p|0,q|0,b,a,y,z,r|0);rh(m|0,o|0,p|0,q|0,w,x);ri(l|0,l|0,m|0);rm(s,l|0,m|0,d+452|0);rn(l|0);rn(m|0);rn(n|0);rn(j|0);rn(k|0);rn(g|0);rn(h|0);rn(o|0);rn(p|0);rn(q|0);rn(r|0);i=f;return}function rZ(a){a=a|0;var b=0;b=a;iN(b+236|0);a=c[b+504>>2]|0;iN(a+432|0);iN(a|0);iN(a+216|0);bk[c[200]&1023](a);dU(b|0);dU(b+452|0);iN(b+12|0);return}function r_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=d;if((bh(b|0,9008)|0)!=0){return}if((bh(a|0,8592)|0)!=0){if((bh(a|0,8456)|0)!=0){if((bh(a|0,8248)|0)==0){c[e+468>>2]=66;c[e+484>>2]=124;c[e+488>>2]=676;c[e+492>>2]=364}}else{c[e+468>>2]=322;c[e+484>>2]=454;c[e+488>>2]=798;c[e+492>>2]=672}}else{c[e+468>>2]=210;c[e+484>>2]=454;c[e+488>>2]=798;c[e+492>>2]=672}return}function r$(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+48|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=a;a=c[d+504>>2]|0;c[m+4>>2]=bm[c[198]&1023](((c[a+648>>2]|0)+1|0)*24&-1)|0;d=c[m+4>>2]|0;rc(f|0,a+432|0);rc(g|0,a+432|0);rd(f|0,b);b=o9(f|0)|0;m=pa(f|0)|0;n=o9(g|0)|0;o=pa(g|0)|0;rc(l|0,a|0);rc(h|0,a|0);rc(j|0,a|0);rc(k|0,a|0);p=c[a+652>>2]|0;q=0;while(1){if((q|0)>=(p|0)){break}rg(h|0,j|0,k|0,b,m,l|0);rS(d+(q*24&-1)|0,h|0,j|0,k|0);rO(f|0,f|0);q=q+1|0}if((c[a+656>>2]|0)<0){rj(g|0,f|0)}else{rd(g|0,f|0)}p=c[a+648>>2]|0;while(1){if((q|0)>=(p|0)){break}rg(h|0,j|0,k|0,b,m,l|0);rS(d+(q*24&-1)|0,h|0,j|0,k|0);rO(f|0,f|0);q=q+1|0}rl(h|0,j|0,k|0,b,m,n,o,l|0);rS(d+(q*24&-1)|0,h|0,j|0,k|0);rn(l|0);rn(h|0);rn(j|0);rn(k|0);rn(f|0);rn(g|0);i=e;return}function r0(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b+4>>2]|0;d=(c[(c[(c[b>>2]|0)+504>>2]|0)+648>>2]|0)+1|0;e=0;while(1){if((e|0)>=(d|0)){break}f=a+(e*24&-1)|0;rn(f|0);rn(f+8|0);rn(f+16|0);e=e+1|0}bk[c[200]&1023](c[b+4>>2]|0);return}function r1(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;f=e|0;g=e+8|0;h=a;a=b;b=d;d=o9(a)|0;j=pa(a)|0;a=c[(c[b>>2]|0)+504>>2]|0;k=c[b+4>>2]|0;rc(f|0,a+216|0);rc(g|0,a+216|0);re(f|0);l=c[a+652>>2]|0;m=0;while(1){if((m|0)>=(l|0)){break}n=k+(m*24&-1)|0;rf(f|0,f|0);rh(g|0,n|0,n+8|0,n+16|0,d,j);ri(f|0,f|0,g|0);m=m+1|0}if((c[a+656>>2]|0)<0){rk(h,f|0)}else{rd(h,f|0)}l=c[a+648>>2]|0;while(1){if((m|0)>=(l|0)){break}rf(f|0,f|0);a=k+(m*24&-1)|0;rh(g|0,a|0,a+8|0,a+16|0,d,j);ri(f|0,f|0,g|0);m=m+1|0}ri(f|0,f|0,h);l=k+(m*24&-1)|0;rh(g|0,l|0,l+8|0,l+16|0,d,j);ri(f|0,f|0,g|0);rm(h,f|0,g|0,(c[b>>2]|0)+452|0);rn(f|0);rn(g|0);i=e;return}function r2(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+72|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+40|0;n=f+48|0;o=f+56|0;p=f+64|0;q=a;a=d;d=e;e=c[d+504>>2]|0;r=o9(a)|0;s=pa(a)|0;rc(g|0,e+432|0);rc(h|0,e+432|0);a=o9(g|0)|0;t=pa(g|0)|0;u=o9(h|0)|0;v=pa(h|0)|0;rd(g|0,b);rc(j|0,e+216|0);rc(k|0,e+216|0);rc(l|0,e+216|0);re(j|0);rc(m|0,e|0);rc(n|0,e|0);rc(o|0,e|0);rc(p|0,e|0);b=c[e+652>>2]|0;w=0;while(1){if((w|0)>=(b|0)){break}rf(j|0,j|0);rg(m|0,n|0,o|0,a,t,p|0);rh(k|0,m|0,n|0,o|0,r,s);ri(j|0,j|0,k|0);rO(g|0,g|0);w=w+1|0}if((c[e+656>>2]|0)<0){rj(h|0,g|0);rk(l|0,j|0)}else{rd(h|0,g|0);rd(l|0,j|0)}b=c[e+648>>2]|0;while(1){if((w|0)>=(b|0)){break}rf(j|0,j|0);rg(m|0,n|0,o|0,a,t,p|0);rh(k|0,m|0,n|0,o|0,r,s);ri(j|0,j|0,k|0);rO(g|0,g|0);w=w+1|0}ri(j|0,j|0,l|0);rl(m|0,n|0,o|0,a,t,u,v,p|0);rh(k|0,m|0,n|0,o|0,r,s);ri(j|0,j|0,k|0);rm(q,j|0,k|0,d+452|0);rn(j|0);rn(k|0);rn(l|0);rn(g|0);rn(h|0);rn(m|0);rn(n|0);rn(o|0);rn(p|0);i=f;return}function r3(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=b;b=c;c=d;d=rQ(a)|0;f=rr(a)|0;a=rQ(e)|0;g=rr(e)|0;e=rQ(b)|0;h=rr(b)|0;r4(e,2);rO(h,d);rd(a,e);rd(g,h);b=(eu(c,2)|0)-1|0;while(1){if((b|0)==0){break}if((eB(c,b)|0)!=0){ri(a,a,g);rP(a,a,h);rf(g,g);rP(g,g,e)}else{ri(g,a,g);rP(g,g,h);rf(a,a);rP(a,a,e)}b=b-1|0}ri(g,a,g);rP(g,g,h);rf(a,a);rP(a,a,e);ri(d,a,h);rO(g,g);rP(g,g,d);rf(h,h);rP(h,h,e);rP(h,h,e);r5(g,g,h);r6(a,a);ri(g,g,f);return}function r4(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function r5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+92>>2]&1023](e,b,d);return}function r6(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+108>>2]&1023](d,b);return}function r7(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=a;a=b;b=d;d=e;e=f;f=uq(d<<3)|0;h=uq(d<<3)|0;i=c[e+504>>2]|0;j=0;while(1){if((j|0)>=(d|0)){break}r8(f+(j<<3)|0,i+432|0);r8(h+(j<<3)|0,i+432|0);k=b+(j<<3)|0;r9(f+(j<<3)|0,o9(k)|0,i+1296|0);r9(h+(j<<3)|0,pa(k)|0,i+1304|0);j=j+1|0}sa(g,e|0,a,f,h,d);sb(g,g,e);j=0;while(1){if((j|0)>=(d|0)){break}sc(f+(j<<3)|0);sc(h+(j<<3)|0);j=j+1|0}uu(f);uu(h);return}function r8(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function r9(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function sa(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;h=i;i=i+48|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=h+32|0;o=h+40|0;p=a;a=b;b=d;d=e;e=f;f=g;g=pb(b|0)|0;q=uq(f<<3)|0;r=o9(b|0)|0;r8(k|0,c[r>>2]|0);r8(l|0,c[k>>2]|0);r8(m|0,c[k>>2]|0);r8(n|0,c[k>>2]|0);r8(o|0,c[p>>2]|0);r8(j|0,c[p>>2]|0);s=0;while(1){if((s|0)>=(f|0)){break}r8(q+(s<<3)|0,c[b+(s<<3)>>2]|0);sC(q+(s<<3)|0,b+(s<<3)|0);s=s+1|0}sl(j|0);t=(eu(a,2)|0)-2|0;while(1){s=0;while(1){if((s|0)>=(f|0)){break}r=o9(b+(s<<3)|0)|0;u=pa(b+(s<<3)|0)|0;v=o9(q+(s<<3)|0)|0;w=pa(q+(s<<3)|0)|0;sn(k|0,v);sH(k|0,k|0,3);sB(k|0,k|0,g);sE(k|0,k|0);sB(l|0,w,w);r9(n|0,l|0,w);r9(m|0,k|0,v);sB(m|0,m|0,n|0);sE(m|0,m|0);sy(o|0,k|0,l|0,m|0,d+(s<<3)|0,e+(s<<3)|0);r9(j|0,j|0,o|0);s=s+1|0}if((t|0)==0){break}iV(q,q,f);if((eB(a,t)|0)!=0){s=0;while(1){if((s|0)>=(f|0)){break}r=o9(b+(s<<3)|0)|0;u=pa(b+(s<<3)|0)|0;v=o9(q+(s<<3)|0)|0;w=pa(q+(s<<3)|0)|0;sF(l|0,r,v);sF(k|0,w,u);r9(n|0,l|0,w);r9(m|0,k|0,v);sB(m|0,m|0,n|0);sE(m|0,m|0);sy(o|0,k|0,l|0,m|0,d+(s<<3)|0,e+(s<<3)|0);r9(j|0,j|0,o|0);s=s+1|0}iW(q,q,b,f)}t=t-1|0;sn(j|0,j|0)}sC(p,j|0);sc(j|0);s=0;while(1){if((s|0)>=(f|0)){break}sc(q+(s<<3)|0);s=s+1|0}uu(q);sc(k|0);sc(l|0);sc(m|0);sc(n|0);sc(o|0);i=h;return}function sb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;i=i+24|0;f=e|0;g=e+8|0;h=e+16|0;j=a;a=b;b=d;d=c[b+504>>2]|0;if((c[d+1324>>2]|0)==6){r8(f|0,d+648|0);r8(g|0,d+432|0);r8(h|0,d+648|0);k=sz(f|0)|0;l=sA(f|0)|0;m=c[k+4>>2]|0;n=c[l+4>>2]|0;o=c[(sz(a)|0)+4>>2]|0;p=c[(sA(a)|0)+4>>2]|0;nx(g|0,o+8|0,d+1328|0);sC(k,g|0);nx(g|0,o+16|0,d+1336|0);sB(k,k,g|0);sB(m,m,o|0);nx(g|0,p+8|0,d+1328|0);sC(l,g|0);nx(g|0,p+16|0,d+1336|0);sB(l,l,g|0);sB(n,n,p|0);sC(h|0,f|0);sC(k,sz(a)|0);sE(l,sA(a)|0);r9(h|0,h|0,f|0);nx(g|0,o+8|0,d+1328|0);sC(k,g|0);nx(g|0,o+16|0,d+1336|0);sB(k,k,g|0);sB(m,m,o|0);nx(g|0,p+8|0,d+1328|0);sE(l,g|0);nx(g|0,p+16|0,d+1336|0);sF(l,l,g|0);sF(n,n,p|0);r9(f|0,f|0,a);so(f|0,f|0);r9(a,h|0,f|0);sC(f|0,a);sK(j,f|0,b+452|0);sc(f|0);sc(g|0);sc(h|0);i=e;return}else{sm(j,a,d+1312|0);i=e;return}}function sc(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function sd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+80|0;e=d|0;f=a;a=b;se(f);b=c[f+4>>2]|0;f=0;f=f+(q2(b|0,a,6128)|0)|0;f=f+(q2(b+12|0,a,8384)|0)|0;f=f+(q2(b+24|0,a,7024)|0)|0;f=f+(q2(b+36|0,a,6328)|0)|0;f=f+(q2(b+48|0,a,5832)|0)|0;f=f+(q2(b+60|0,a,5456)|0)|0;f=f+(q5(b+72|0,a,5232)|0)|0;f=f+(q2(b+76|0,a,4976)|0)|0;f=f+(q2(b+88|0,a,4392)|0)|0;f=f+(q2(b+104|0,a,4240)|0)|0;g=(c[b+72>>2]|0)/2&-1;c[b+100>>2]=bq[c[194]&1023](c[b+100>>2]|0,g*12&-1)|0;h=0;while(1){if((h|0)>=(g|0)){break}aY(e|0,9208,(w=i,i=i+8|0,c[w>>2]=h,w)|0);d3((c[b+100>>2]|0)+(h*12&-1)|0);f=f+(q2((c[b+100>>2]|0)+(h*12&-1)|0,a,e|0)|0)|0;h=h+1|0}i=d;return f|0}function se(a){a=a|0;var b=0;b=a;c[b>>2]=3872;a=bm[c[198]&1023](116)|0;c[b+4>>2]=a;b=a;d3(b|0);d3(b+12|0);d3(b+24|0);d3(b+36|0);d3(b+48|0);d3(b+60|0);d3(b+76|0);d3(b+88|0);c[b+72>>2]=0;c[b+100>>2]=0;d3(b+104|0);return}function sf(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+64>>2]&1023](d,b)|0}function sg(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function sh(a){a=a|0;var b=0,d=0,e=0;b=a;a=b;d=(c[a+72>>2]|0)/2&-1;dU(a|0);dU(a+12|0);dU(a+24|0);dU(a+36|0);dU(a+48|0);dU(a+60|0);dU(a+76|0);dU(a+88|0);dU(a+104|0);e=0;while(1){if((e|0)>=(d|0)){break}dU((c[a+100>>2]|0)+(e*12&-1)|0);e=e+1|0}bk[c[200]&1023](c[a+100>>2]|0);bk[c[200]&1023](b);return}function si(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+8|0;e=d|0;f=a;a=b;b=(c[a+72>>2]|0)/2&-1;q$(f,9e3);q0(f,6128,a|0);q0(f,8384,a+12|0);q0(f,7024,a+24|0);q0(f,6328,a+36|0);q0(f,5832,a+48|0);q0(f,5456,a+60|0);q1(f,5232,c[a+72>>2]|0);q0(f,4976,a+76|0);q0(f,4392,a+88|0);g=0;while(1){if((g|0)>=(b|0)){break}aY(e|0,9208,(w=i,i=i+8|0,c[w>>2]=g,w)|0);q0(f,e|0,(c[a+100>>2]|0)+(g*12&-1)|0);g=g+1|0}q0(f,4240,a+104|0);i=d;return}function sj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f|0;h=f+8|0;j=a;a=e;e=d;d=c[a+504>>2]|0;r8(g|0,d+432|0);r8(h|0,d+432|0);r9(g|0,o9(e)|0,d+1296|0);r9(h|0,pa(e)|0,d+1304|0);bj[c[982]&1023](j,a|0,b,g|0,h|0);sb(j,j,a);sc(g|0);sc(h|0);i=f;return}function sk(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+56|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=d;d=e;e=f;f=0;q=c[e+504>>2]|0;r8(l|0,q+432|0);r8(m|0,q+432|0);r8(n|0,q+432|0);r8(o|0,q+432|0);r8(h|0,q+648|0);r8(j|0,q+648|0);r8(k|0,q+648|0);r9(l|0,o9(p)|0,q+1296|0);r9(n|0,o9(d)|0,q+1296|0);r9(m|0,pa(p)|0,q+1304|0);r9(o|0,pa(d)|0,q+1304|0);bj[c[982]&1023](h|0,e|0,a,n|0,o|0);bj[c[982]&1023](j|0,e|0,b,l|0,m|0);sb(h|0,h|0,e);sb(j|0,j|0,e);r9(k|0,h|0,j|0);if((sJ(k|0)|0)!=0){f=1;r=l|0;sc(r);s=m|0;sc(s);t=n|0;sc(t);u=o|0;sc(u);v=h|0;sc(v);w=j|0;sc(w);x=k|0;sc(x);y=f;i=g;return y|0}so(j|0,j|0);r9(k|0,h|0,j|0);if((sJ(k|0)|0)!=0){f=1}r=l|0;sc(r);s=m|0;sc(s);t=n|0;sc(t);u=o|0;sc(u);v=h|0;sc(v);w=j|0;sc(w);x=k|0;sc(x);y=f;i=g;return y|0}function sl(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function sm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function sn(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function so(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function sp(a){a=a|0;var b=0;b=a;sb(c[b+4>>2]|0,c[b+4>>2]|0,c[(c[b>>2]|0)+192>>2]|0);return}function sq(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+40|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=a;a=b;b=(c[a+72>>2]|0)/2&-1;if(((c[a+72>>2]|0)%2|0)!=0){oI(8560,(w=i,i=i+1|0,i=i+7>>3<<3,c[w>>2]=0,w)|0)}d3(j|0);er(j|0,a+36|0);jL(j+12|0,j|0);c[j+468>>2]=232;c[j+472>>2]=826;c[j+476>>2]=394;k=bm[c[198]&1023](1344)|0;c[j+504>>2]=k;l=k;jL(l|0,a|0);r8(e|0,l|0);r8(f|0,l|0);sg(e|0,a+48|0);sg(f|0,a+60|0);oM(l+864|0,e|0,f|0,j|0,a+24|0);mb(l+216|0,l|0);r8(g|0,l+216|0);mM(g|0,b);k=0;while(1){if((k|0)>=(b|0)){break}m=sf(g|0,k)|0;sg(m,(c[a+100>>2]|0)+(k*12&-1)|0);k=k+1|0}mR(l+432|0,g|0);sc(g|0);c[(l+432|0)+208>>2]=bm[c[198]&1023](8)|0;r8(c[(l+432|0)+208>>2]|0,l+432|0);sg(c[(c[(l+432|0)+208>>2]|0)+4>>2]|0,a+104|0);k_(l+648|0,l+432|0);if((c[a+72>>2]|0)==6){g=a|0;k=j+452|0;d3(k);d9(k,g,g);ew(k,k,g);dN(k,k,1);dW(k,k,j|0);k=l+1328|0;r8(k,l+432|0);sl((c[k+4>>2]|0)+8|0);sm(k,k,g);r8(l+1336|0,l+432|0);sn(l+1336|0,k)}else{d3(l+1312|0);ex(l+1312|0,(l+648|0)+196|0,1);dW(l+1312|0,l+1312|0,j|0)}pr(l+1080|0,l+864|0,660,l+432|0,j|0,0);pt(l+1080|0);d3(h|0);ew(h|0,a|0,a+12|0);dN(h|0,h|0,1);ee(h|0,h|0);pA(h|0,a|0,h|0,b);dW(h|0,h|0,a+36|0);pv(l+1080|0,h|0);dU(h|0);r8(l+1296|0,l+432|0);so(l+1296|0,ij(l+432|0)|0);r8(l+1304|0,l+432|0);sn(l+1304|0,l+1296|0);c[j+228>>2]=l+864|0;c[j+232>>2]=l+1080|0;c[l+1324>>2]=c[a+72>>2]|0;p6(j,l+648|0);c[j+496>>2]=248;c[982]=244;c[j+500>>2]=16;c[j+484>>2]=766;c[j+488>>2]=548;c[j+492>>2]=236;c[j+480>>2]=814;sc(e|0);sc(f|0);i=d;return}function sr(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+56|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=a;a=b;b=d;d=e;e=f;f=pb(b)|0;q=o9(b)|0;r=pa(b)|0;r8(k|0,c[q>>2]|0);r8(l|0,c[k>>2]|0);r8(m|0,c[k>>2]|0);r8(n|0,c[k>>2]|0);r8(o|0,c[p>>2]|0);r8(h|0,c[p>>2]|0);r8(j|0,c[b>>2]|0);sC(j|0,b);s=o9(j|0)|0;t=pa(j|0)|0;sl(h|0);u=(eu(a,2)|0)-2|0;while(1){sn(k|0,s);sH(k|0,k|0,3);sB(k|0,k|0,f);sE(k|0,k|0);sB(l|0,t,t);r9(n|0,l|0,t);r9(m|0,k|0,s);sB(m|0,m|0,n|0);sE(m|0,m|0);sy(o|0,k|0,l|0,m|0,d,e);r9(h|0,h|0,o|0);if((u|0)==0){break}sD(j|0,j|0);if((eB(a,u)|0)!=0){sF(l|0,q,s);sF(k|0,t,r);r9(n|0,l|0,t);r9(m|0,k|0,s);sB(m|0,m|0,n|0);sE(m|0,m|0);sy(o|0,k|0,l|0,m|0,d,e);r9(h|0,h|0,o|0);sB(j|0,j|0,b)}u=u-1|0;sn(h|0,h|0)}sC(p,h|0);sc(h|0);sc(j|0);sc(k|0);sc(l|0);sc(m|0);sc(n|0);sc(o|0);i=g;return}function ss(a,b,d){a=a|0;b=b|0;d=d|0;a=d;if((bh(b|0,8440)|0)!=0){return}if((bh(a|0,8240)|0)!=0){if((bh(a|0,7952)|0)==0){c[982]=244}}else{c[982]=696}return}function st(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+40|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=a;a=d;d=b;b=o9(d)|0;m=pa(d)|0;n=c[a+504>>2]|0;o=a|0;a=pb(d)|0;r8(f|0,c[d>>2]|0);sC(f|0,d);p=o9(f|0)|0;q=pa(f|0)|0;r8(g|0,n);r8(h|0,n);r8(j|0,n);r8(k|0,n);r=(eu(o,2)|0)-2|0;c[l+4>>2]=bm[c[198]&1023](r*48&-1)|0;s=c[l+4>>2]|0;while(1){sn(h|0,p);sD(g|0,h|0);sB(h|0,h|0,g|0);sB(h|0,h|0,a);sE(h|0,h|0);sB(j|0,q,q);r9(g|0,j|0,q);r9(k|0,h|0,p);sB(k|0,k|0,g|0);sE(k|0,k|0);r8(s|0,n);r8(s+8|0,n);r8(s+16|0,n);sC(s|0,h|0);sC(s+8|0,j|0);sC(s+16|0,k|0);s=s+24|0;if((r|0)==0){break}sD(f|0,f|0);if((eB(o,r)|0)!=0){sF(j|0,b,p);sF(h|0,q,m);r9(g|0,j|0,q);r9(k|0,h|0,p);sB(k|0,k|0,g|0);sE(k|0,k|0);r8(s|0,n);r8(s+8|0,n);r8(s+16|0,n);sC(s|0,h|0);sC(s+8|0,j|0);sC(s+16|0,k|0);s=s+24|0;sB(f|0,f|0,d)}r=r-1|0}sc(g|0);sc(h|0);sc(j|0);sc(k|0);sc(f|0);i=e;return}function su(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b>>2]|0;d=eu(a,2)|0;e=(d+(eg(a)|0)|0)-3|0;a=c[b+4>>2]|0;d=0;while(1){if((d|0)>=(e|0)){break}f=a+(d*24&-1)|0;sc(f|0);sc(f+8|0);sc(f+16|0);d=d+1|0}bk[c[200]&1023](c[b+4>>2]|0);return}function sv(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=a;a=d;d=c[a>>2]|0;l=c[(c[a>>2]|0)+504>>2]|0;m=(eu(d,2)|0)-2|0;n=c[a+4>>2]|0;o=b;sx(f|0,k);sx(j|0,k);r8(g|0,l+432|0);r8(h|0,l+432|0);r9(g|0,o9(o)|0,l+1296|0);r9(h|0,pa(o)|0,l+1304|0);sl(k);while(1){sy(f|0,n|0,n+8|0,n+16|0,g|0,h|0);r9(k,k,f|0);n=n+24|0;if((m|0)==0){break}if((eB(d,m)|0)!=0){sy(f|0,n|0,n+8|0,n+16|0,g|0,h|0);r9(k,k,f|0);n=n+24|0}m=m-1|0;sn(k,k)}sb(k,k,c[a>>2]|0);sc(f|0);sc(g|0);sc(h|0);sc(j|0);i=e;return}function sw(a){a=a|0;var b=0;b=a;iN(b+236|0);a=c[b+504>>2]|0;if((c[a+1324>>2]|0)==6){sc(a+1328|0);sc(a+1336|0);dU(b+452|0)}else{dU(a+1312|0)}iN(a+1080|0);iN(a+864|0);sc(a+1296|0);sc(a+1304|0);iN(a+648|0);iN(a+432|0);iN(a+216|0);iN(a|0);iN(b+12|0);dU(b|0);bk[c[200]&1023](a);return}function sx(a,b){a=a|0;b=b|0;r8(a,c[b>>2]|0);return}function sy(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;h=a;a=b;b=d;d=e;e=f;f=g;g=sz(h)|0;i=sA(h)|0;h=mG(c[g>>2]|0)|0;j=0;while(1){if((j|0)>=(h|0)){break}k=sf(g,j)|0;r9(k,sf(e,j)|0,a);k=sf(i,j)|0;r9(k,sf(f,j)|0,b);j=j+1|0}j=sf(g,0)|0;sB(j,sf(g,0)|0,d);return}function sz(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+68>>2]&1023](b)|0}function sA(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+72>>2]&1023](b)|0}function sB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function sC(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function sD(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function sE(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function sF(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function sG(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+80|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=g+56|0;q=g+64|0;r=g+72|0;s=a;a=b;b=d;d=e;e=f;f=k|0;t=l|0;u=m|0;v=pb(b)|0;w=o9(b)|0;x=pa(b)|0;r8(k|0,c[w>>2]|0);r8(l|0,c[k>>2]|0);r8(m|0,c[k>>2]|0);r8(n|0,c[k>>2]|0);r8(o|0,c[k>>2]|0);r8(p|0,c[s>>2]|0);r8(q|0,c[k>>2]|0);r8(r|0,c[k>>2]|0);sl(q|0);sl(r|0);r8(h|0,c[s>>2]|0);r8(j|0,c[b>>2]|0);sC(j|0,b);b=o9(j|0)|0;y=o9(j|0)|0;sl(h|0);z=(eu(a,2)|0)-2|0;while(1){sn(k|0,r|0);r9(k|0,k|0,v);sn(l|0,b);sD(n|0,l|0);sB(l|0,l|0,n|0);sB(k|0,k|0,l|0);sE(k|0,k|0);r9(l|0,q|0,r|0);r9(l|0,l|0,y);sH(l|0,l|0,2);r9(m|0,b,k|0);r9(k|0,k|0,r|0);sn(n|0,y);sH(n|0,n|0,2);sB(m|0,m|0,n|0);sE(m|0,m|0);sy(p|0,k|0,l|0,m|0,d,e);r9(h|0,h|0,p|0);if((z|0)==0){break}sn(n|0,b);sD(o|0,n|0);sB(n|0,n|0,o|0);sn(o|0,r|0);r9(o|0,o|0,v);sB(n|0,n|0,o|0);r9(q|0,y,q|0);sD(q|0,q|0);sn(r|0,q|0);sn(f,y);r9(o|0,b,f);sD(o|0,o|0);sD(o|0,o|0);sD(t,o|0);sn(b,n|0);sF(b,b,t);sn(f,f);sD(f,f);sD(f,f);sD(f,f);sF(o|0,o|0,b);r9(n|0,n|0,o|0);sF(y,n|0,f);if((eB(a,z)|0)!=0){r9(n|0,b,q|0);r9(o|0,r|0,q|0);r9(k|0,x,o|0);sF(k|0,y,k|0);r9(l|0,w,o|0);sF(l|0,l|0,n|0);r9(n|0,n|0,x);r9(m|0,y,w);sF(m|0,n|0,m|0);sy(p|0,k|0,l|0,m|0,d,e);r9(h|0,h|0,p|0);r9(f,r|0,w);sF(t,b,f);r9(n|0,r|0,x);r9(n|0,n|0,q|0);sF(o|0,y,n|0);sB(f,b,f);sB(n|0,y,n|0);r9(q|0,q|0,t);sn(r|0,q|0);sn(u,t);r9(t,u,t);sn(b,o|0);r9(u,f,u);sF(b,b,u);sF(u,u,b);sF(u,u,b);r9(u,u,o|0);r9(n|0,n|0,t);sF(u,u,n|0);sI(y,u)}z=z-1|0;sn(h|0,h|0)}sC(s,h|0);sc(h|0);sc(j|0);sc(k|0);sc(l|0);sc(m|0);sc(n|0);sc(o|0);sc(p|0);sc(q|0);sc(r|0);i=g;return}function sH(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function sI(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+108>>2]&1023](d,b);return}function sJ(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function sK(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=a;a=b;b=c;if((sJ(a)|0)!=0){sC(f,a);i=d;return}sx(e|0,f);c=sz(a)|0;g=sA(a)|0;a=sz(f)|0;h=sA(f)|0;f=sz(e|0)|0;j=sA(e|0)|0;sL(f,2);sD(j,c);sC(a,f);sC(h,j);k=(eu(b,2)|0)-1|0;while(1){if((k|0)==0){break}if((eB(b,k)|0)!=0){r9(a,a,h);sF(a,a,j);sn(h,h);sF(h,h,f)}else{r9(h,a,h);sF(h,h,j);sn(a,a);sF(a,a,f)}k=k-1|0}r9(h,a,h);sF(h,h,j);sn(a,a);sF(a,a,f);sD(a,a);r9(c,j,h);sF(c,c,a);sn(j,j);sF(j,j,f);sF(j,j,f);sI(a,h);sM(h,c,j);r9(h,h,g);sc(e|0);i=d;return}function sL(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function sM(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+92>>2]&1023](e,b,d);return}function sN(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;sO(d);b=c[d+4>>2]|0;d=0;d=d+(q2(b|0,a,5912)|0)|0;d=d+(q2(b+12|0,a,8280)|0)|0;d=d+(q2(b+24|0,a,6992)|0)|0;d=d+(q2(b+36|0,a,6304)|0)|0;d=d+(q2(b+48|0,a,5824)|0)|0;d=d+(q5(b+60|0,a,5448)|0)|0;d=d+(q5(b+64|0,a,5224)|0)|0;d=d+(q5(b+68|0,a,4968)|0)|0;d=d+(q5(b+72|0,a,4384)|0)|0;return d|0}function sO(a){a=a|0;var b=0;b=a;c[b>>2]=1360;a=bm[c[198]&1023](76)|0;c[b+4>>2]=a;b=a;d3(b|0);d3(b+12|0);d3(b+24|0);d3(b+36|0);d3(b+48|0);return}function sP(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function sQ(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function sR(a){a=a|0;var b=0;b=a;a=b;dU(a|0);dU(a+12|0);dU(a+24|0);dU(a+36|0);dU(a+48|0);bk[c[200]&1023](b);return}function sS(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=a;a=b;d3(g|0);er(g|0,a+12|0);jL(g+12|0,g|0);c[g+468>>2]=516;c[338]=640;b=bm[c[198]&1023](456)|0;c[g+504>>2]=b;h=b;c[h+432>>2]=c[a+60>>2]|0;c[h+436>>2]=c[a+64>>2]|0;c[h+440>>2]=c[a+68>>2]|0;c[h+444>>2]=c[a+72>>2]|0;jL(h|0,a|0);sP(e|0,h|0);sP(f|0,h|0);sW(e|0,a+36|0);sW(f|0,a+48|0);oM(h+216|0,e|0,f|0,g|0,a+24|0);d3(g+452|0);ex(g+452|0,(h|0)+196|0,1);dW(g+452|0,g+452|0,g|0);a=h+216|0;c[g+228>>2]=a;c[g+232>>2]=a;p6(g,h|0);c[g+496>>2]=30;c[g+464>>2]=166;c[g+500>>2]=692;c[g+480>>2]=152;sP(h+448|0,h+216|0);oH(h+448|0);sQ(e|0);sQ(f|0);i=d;return}function sT(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;q$(d,4232);q0(d,5912,a|0);q0(d,8280,a+12|0);q0(d,6992,a+24|0);q0(d,6304,a+36|0);q0(d,5824,a+48|0);q1(d,5448,c[a+60>>2]|0);q1(d,5224,c[a+64>>2]|0);q1(d,4968,c[a+68>>2]|0);q1(d,4384,c[a+72>>2]|0);return}function sU(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+8|0;g=f|0;h=a;a=e;e=c[a+504>>2]|0;sP(g|0,e+216|0);s6(g|0,d,e+448|0);bj[c[338]&1023](h,b,g|0,e+448|0,e);tb(h,h,a+452|0);sQ(g|0);i=f;return}function sV(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;g=i;i=i+104|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=g+56|0;q=g+64|0;r=g+72|0;s=g+80|0;t=g+88|0;u=g+96|0;v=a;a=b;b=d;d=e;e=f;f=pb(a)|0;w=o|0;x=p|0;y=o9(a)|0;z=o9(b)|0;A=pa(b)|0;b=o9(d)|0;B=pa(d)|0;sP(o|0,c[v>>2]|0);sP(p|0,c[v>>2]|0);sP(q|0,c[v>>2]|0);sP(r|0,c[v>>2]|0);sP(s|0,c[v>>2]|0);sP(t|0,c[v>>2]|0);sP(u|0,c[v>>2]|0);s8(t|0);s8(u|0);sP(h|0,c[v>>2]|0);sP(j|0,c[v>>2]|0);sP(k|0,c[v>>2]|0);sP(l|0,c[v>>2]|0);sP(m|0,c[a>>2]|0);sP(n|0,c[a>>2]|0);tc(m|0,a);a=o9(m|0)|0;d=pa(m|0)|0;s8(h|0);s8(j|0);s8(k|0);s8(l|0);C=c[e+436>>2]|0;D=0;while(1){if((D|0)>=(C|0)){break}s4(h|0,h|0);s4(j|0,j|0);s4(o|0,u|0);s5(o|0,o|0,f);s4(p|0,a);s2(r|0,p|0);s6(p|0,p|0,r|0);s6(o|0,o|0,p|0);s3(o|0,o|0);s2(r|0,d);s5(p|0,r|0,u|0);s5(p|0,p|0,t|0);s5(q|0,a,o|0);s5(o|0,o|0,u|0);s5(r|0,r|0,d);s6(q|0,q|0,r|0);s3(q|0,q|0);s5(r|0,o|0,z);s5(s|0,p|0,A);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(h|0,h|0,r|0);s5(r|0,o|0,b);s5(s|0,p|0,B);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(j|0,j|0,r|0);E=a;F=d;s4(r|0,E);s2(s|0,r|0);s6(r|0,r|0,s|0);s4(s|0,u|0);s5(s|0,s|0,f);s6(r|0,r|0,s|0);s5(t|0,F,t|0);s2(t|0,t|0);s4(u|0,t|0);s4(w,F);s5(s|0,E,w);s2(s|0,s|0);s2(s|0,s|0);s2(x,s|0);s4(E,r|0);s7(E,E,x);s4(w,w);s2(w,w);s2(w,w);s2(w,w);s7(s|0,s|0,E);s5(r|0,r|0,s|0);s7(F,r|0,w);s5(r|0,z,u|0);s7(r|0,r|0,a);s5(j|0,j|0,r|0);s5(r|0,b,u|0);s7(r|0,r|0,a);s5(h|0,h|0,r|0);D=D+1|0}s9(t|0,t|0);s4(r|0,t|0);s5(a,a,r|0);s5(r|0,r|0,t|0);s5(d,d,r|0);s8(t|0);s8(u|0);if((c[e+440>>2]|0)<0){tc(k|0,j|0);tc(l|0,h|0);s5(r|0,z,u|0);s7(r|0,r|0,a);s5(l|0,l|0,r|0);s5(r|0,b,u|0);s7(r|0,r|0,a);s5(k|0,k|0,r|0);s3(n|0,m|0)}else{tc(k|0,h|0);tc(l|0,j|0);tc(n|0,m|0)}C=c[e+432>>2]|0;while(1){if((D|0)>=(C|0)){break}s4(h|0,h|0);s4(j|0,j|0);s4(o|0,u|0);s5(o|0,o|0,f);s4(p|0,a);s2(r|0,p|0);s6(p|0,p|0,r|0);s6(o|0,o|0,p|0);s3(o|0,o|0);s2(r|0,d);s5(p|0,r|0,u|0);s5(p|0,p|0,t|0);s5(q|0,a,o|0);s5(o|0,o|0,u|0);s5(r|0,r|0,d);s6(q|0,q|0,r|0);s3(q|0,q|0);s5(r|0,o|0,z);s5(s|0,p|0,A);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(h|0,h|0,r|0);s5(r|0,o|0,b);s5(s|0,p|0,B);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(j|0,j|0,r|0);F=a;E=d;s4(r|0,F);s2(s|0,r|0);s6(r|0,r|0,s|0);s4(s|0,u|0);s5(s|0,s|0,f);s6(r|0,r|0,s|0);s5(t|0,E,t|0);s2(t|0,t|0);s4(u|0,t|0);s4(w,E);s5(s|0,F,w);s2(s|0,s|0);s2(s|0,s|0);s2(x,s|0);s4(F,r|0);s7(F,F,x);s4(w,w);s2(w,w);s2(w,w);s2(w,w);s7(s|0,s|0,F);s5(r|0,r|0,s|0);s7(E,r|0,w);s5(r|0,z,u|0);s7(r|0,r|0,a);s5(j|0,j|0,r|0);s5(r|0,b,u|0);s7(r|0,r|0,a);s5(h|0,h|0,r|0);D=D+1|0}s9(t|0,t|0);s4(r|0,t|0);s5(a,a,r|0);s5(r|0,r|0,t|0);s5(d,d,r|0);s8(t|0);s8(u|0);s5(h|0,h|0,k|0);s5(j|0,j|0,l|0);d=o9(m|0)|0;D=pa(m|0)|0;w=o9(n|0)|0;x=pa(n|0)|0;s7(p|0,w,d);s7(o|0,D,x);s5(q|0,d,x);s5(r|0,D,w);s7(q|0,q|0,r|0);s5(r|0,o|0,z);s5(s|0,p|0,A);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(h|0,h|0,r|0);s5(r|0,o|0,b);s5(s|0,p|0,B);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(j|0,j|0,r|0);s6(m|0,m|0,n|0);s5(r|0,z,u|0);s7(r|0,r|0,a);s5(j|0,j|0,r|0);s5(r|0,b,u|0);s7(r|0,r|0,a);s5(h|0,h|0,r|0);if((c[e+444>>2]|0)<=0){G=j|0;H=j|0;s9(G,H);I=v;J=h|0;K=j|0;s5(I,J,K);L=h|0;sQ(L);M=j|0;sQ(M);N=k|0;sQ(N);O=l|0;sQ(O);P=t|0;sQ(P);Q=u|0;sQ(Q);R=m|0;sQ(R);S=n|0;sQ(S);T=o|0;sQ(T);U=p|0;sQ(U);V=q|0;sQ(V);W=r|0;sQ(W);X=s|0;sQ(X);i=g;return}s5(r|0,z,u|0);s7(r|0,r|0,y);s5(h|0,h|0,r|0);s5(r|0,b,u|0);s7(r|0,r|0,y);s5(j|0,j|0,r|0);G=j|0;H=j|0;s9(G,H);I=v;J=h|0;K=j|0;s5(I,J,K);L=h|0;sQ(L);M=j|0;sQ(M);N=k|0;sQ(N);O=l|0;sQ(O);P=t|0;sQ(P);Q=u|0;sQ(Q);R=m|0;sQ(R);S=n|0;sQ(S);T=o|0;sQ(T);U=p|0;sQ(U);V=q|0;sQ(V);W=r|0;sQ(W);X=s|0;sQ(X);i=g;return}function sW(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function sX(a){a=a|0;var b=0;b=a;tb(c[b+4>>2]|0,c[b+4>>2]|0,(c[(c[b>>2]|0)+192>>2]|0)+452|0);return}function sY(a,b,c){a=a|0;b=b|0;c=c|0;tc(a,b);return}function sZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=d;if((bh(b|0,9200)|0)!=0){return}if((bh(a|0,8992)|0)!=0){if((bh(a|0,8544)|0)!=0){if((bh(a|0,8424)|0)==0){c[e+468>>2]=526}}else{c[e+468>>2]=516;c[338]=162}}else{c[e+468>>2]=516;c[338]=640}return}function s_(a){a=a|0;var b=0;b=a;iN(b+236|0);a=c[b+504>>2]|0;iN(a|0);iN(a+216|0);sQ(a+448|0);bk[c[200]&1023](a);dU(b+452|0);dU(b|0);iN(b+12|0);return}function s$(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;g=i;i=i+88|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=g+56|0;q=g+64|0;r=g+72|0;s=g+80|0;t=a;a=b;b=d;d=e;e=f;f=o9(a)|0;u=pb(a)|0;v=o9(b)|0;w=pa(b)|0;b=o9(d)|0;x=pa(d)|0;sP(o|0,c[t>>2]|0);sP(p|0,c[t>>2]|0);sP(q|0,c[t>>2]|0);sP(r|0,c[t>>2]|0);sP(s|0,c[t>>2]|0);sP(h|0,c[t>>2]|0);sP(j|0,c[t>>2]|0);sP(k|0,c[t>>2]|0);sP(l|0,c[t>>2]|0);sP(m|0,c[a>>2]|0);sP(n|0,c[a>>2]|0);tc(m|0,a);a=o9(m|0)|0;d=pa(m|0)|0;s8(h|0);s8(j|0);s8(k|0);s8(l|0);y=c[e+436>>2]|0;z=0;while(1){if((z|0)>=(y|0)){break}s4(h|0,h|0);s4(j|0,j|0);s4(o|0,a);td(o|0,o|0,3);s6(o|0,o|0,u);s3(o|0,o|0);s6(p|0,d,d);s5(r|0,p|0,d);s5(q|0,o|0,a);s6(q|0,q|0,r|0);s3(q|0,q|0);s5(r|0,o|0,v);s5(s|0,p|0,w);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(h|0,h|0,r|0);s5(r|0,o|0,b);s5(s|0,p|0,x);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(j|0,j|0,r|0);s2(m|0,m|0);s7(r|0,v,a);s5(j|0,j|0,r|0);s7(r|0,b,a);s5(h|0,h|0,r|0);z=z+1|0}if((c[e+440>>2]|0)<0){tc(k|0,j|0);tc(l|0,h|0);s7(r|0,v,a);s5(l|0,l|0,r|0);s7(r|0,b,a);s5(k|0,k|0,r|0);s3(n|0,m|0)}else{tc(k|0,h|0);tc(l|0,j|0);tc(n|0,m|0)}y=c[e+432>>2]|0;while(1){if((z|0)>=(y|0)){break}s4(h|0,h|0);s4(j|0,j|0);s4(o|0,a);td(o|0,o|0,3);s6(o|0,o|0,u);s3(o|0,o|0);s6(p|0,d,d);s5(r|0,p|0,d);s5(q|0,o|0,a);s6(q|0,q|0,r|0);s3(q|0,q|0);s5(r|0,o|0,v);s5(s|0,p|0,w);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(h|0,h|0,r|0);s5(r|0,o|0,b);s5(s|0,p|0,x);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(j|0,j|0,r|0);s2(m|0,m|0);s7(r|0,v,a);s5(j|0,j|0,r|0);s7(r|0,b,a);s5(h|0,h|0,r|0);z=z+1|0}s5(h|0,h|0,k|0);s5(j|0,j|0,l|0);z=o9(m|0)|0;d=pa(m|0)|0;u=o9(n|0)|0;y=pa(n|0)|0;s7(p|0,u,z);s7(o|0,d,y);s5(q|0,z,y);s5(r|0,d,u);s7(q|0,q|0,r|0);s5(r|0,o|0,v);s5(s|0,p|0,w);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(h|0,h|0,r|0);s5(r|0,o|0,b);s5(s|0,p|0,x);s6(r|0,r|0,s|0);s6(r|0,r|0,q|0);s5(j|0,j|0,r|0);s6(m|0,m|0,n|0);s7(r|0,v,a);s5(j|0,j|0,r|0);s7(r|0,b,a);s5(h|0,h|0,r|0);if((c[e+444>>2]|0)<=0){A=j|0;B=j|0;s9(A,B);C=t;D=h|0;E=j|0;s5(C,D,E);F=h|0;sQ(F);G=j|0;sQ(G);H=k|0;sQ(H);I=l|0;sQ(I);J=m|0;sQ(J);K=n|0;sQ(K);L=o|0;sQ(L);M=p|0;sQ(M);N=q|0;sQ(N);O=r|0;sQ(O);P=s|0;sQ(P);i=g;return}s7(r|0,v,f);s5(h|0,h|0,r|0);s7(r|0,b,f);s5(j|0,j|0,r|0);A=j|0;B=j|0;s9(A,B);C=t;D=h|0;E=j|0;s5(C,D,E);F=h|0;sQ(F);G=j|0;sQ(G);H=k|0;sQ(H);I=l|0;sQ(I);J=m|0;sQ(J);K=n|0;sQ(K);L=o|0;sQ(L);M=p|0;sQ(M);N=q|0;sQ(N);O=r|0;sQ(O);P=s|0;sQ(P);i=g;return}function s0(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;e=i;i=i+240|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=e+40|0;m=e+48|0;n=e+56|0;o=e+64|0;p=e+72|0;q=e+80|0;r=e+88|0;s=e+96|0;t=e+104|0;u=e+112|0;v=e+120|0;w=e+128|0;x=e+136|0;y=e+144|0;z=e+152|0;A=e+160|0;B=e+168|0;C=e+176|0;D=e+184|0;E=e+192|0;F=e+200|0;G=e+208|0;H=e+216|0;I=e+224|0;J=e+232|0;K=a;a=b;b=c;c=d;d=pb(a)|0;L=pc(a)|0;M=o9(a)|0;N=pa(a)|0;a=o9(b)|0;O=pa(b)|0;s1(f|0,M);s1(g|0,M);s1(h|0,M);s1(j|0,M);s1(k|0,M);s1(l|0,M);s1(m|0,M);s1(n|0,M);s1(t|0,M);s1(o|0,K);s1(p|0,K);s1(q|0,K);s1(r|0,M);s1(s|0,K);s2(k|0,N);s3(f|0,k|0);s4(g|0,M);s4(t|0,g|0);s5(h|0,L,M);s2(h|0,h|0);s4(n|0,d);s5(l|0,h|0,g|0);s2(l|0,l|0);s5(j|0,d,t|0);s6(l|0,l|0,j|0);s5(j|0,n|0,g|0);s7(l|0,l|0,j|0);s2(j|0,l|0);s2(j|0,j|0);s6(l|0,l|0,j|0);s5(j|0,h|0,d);s4(m|0,L);s2(m|0,m|0);s2(m|0,m|0);s6(j|0,j|0,m|0);s2(j|0,j|0);s5(m|0,d,n|0);s6(j|0,j|0,m|0);s7(l|0,l|0,j|0);s5(j|0,g|0,t|0);s6(m|0,j|0,l|0);s5(m|0,m|0,k|0);s2(m|0,m|0);s5(j|0,d,g|0);s6(j|0,j|0,h|0);s2(j|0,j|0);s6(j|0,j|0,t|0);s2(l|0,j|0);s6(j|0,j|0,l|0);s7(l|0,j|0,n|0);s8(j|0);s3(g|0,j|0);s4(t|0,k|0);s5(n|0,t|0,k|0);s5(n|0,n|0,m|0);s4(t|0,l|0);s5(t|0,t|0,l|0);s7(n|0,n|0,t|0);s7(r|0,M,a);s2(t|0,M);s6(t|0,t|0,a);s4(h|0,r|0);s5(h|0,t|0,h|0);s6(q|0,N,O);s4(q|0,q|0);s7(s|0,h|0,q|0);s9(s|0,s|0);s9(r|0,r|0);s7(q|0,N,O);s5(q|0,q|0,r|0);s4(q|0,q|0);s7(q|0,t|0,q|0);ta(h|0);s9(t|0,k|0);s8(o|0);s8(p|0);s1(u|0,M);s1(v|0,M);s1(w|0,M);s1(x|0,M);s1(y|0,M);s1(z|0,M);s1(A|0,M);s1(B|0,M);s1(C|0,M);s1(D|0,M);s1(E|0,M);s1(F|0,M);s1(G|0,M);s1(H|0,M);s1(I|0,p|0);s1(J|0,p|0);M=(eu(c|0,2)|0)-2|0;while(1){s4(u|0,g|0);s4(v|0,h|0);s4(w|0,j|0);s4(x|0,k|0);s4(y|0,l|0);s4(z|0,m|0);s5(A|0,f|0,h|0);s5(B|0,g|0,j|0);s5(C|0,h|0,k|0);s5(D|0,j|0,l|0);s5(E|0,k|0,m|0);s5(F|0,l|0,n|0);s4(I|0,p|0);s5(J|0,o|0,q|0);if((eB(c|0,M)|0)!=0){s5(G|0,C|0,u|0);s5(H|0,A|0,w|0);s7(f|0,G|0,H|0);s5(f|0,f|0,t|0);s5(G|0,C|0,v|0);s5(H|0,B|0,w|0);s7(g|0,G|0,H|0);s5(G|0,D|0,v|0);s5(H|0,B|0,x|0);s7(h|0,G|0,H|0);s5(h|0,h|0,t|0);s5(G|0,D|0,w|0);s5(H|0,C|0,x|0);s7(j|0,G|0,H|0);s5(G|0,E|0,w|0);s5(H|0,C|0,y|0);s7(k|0,G|0,H|0);s5(k|0,k|0,t|0);s5(G|0,E|0,x|0);s5(H|0,D|0,y|0);s7(l|0,G|0,H|0);s5(G|0,F|0,x|0);s5(H|0,D|0,z|0);s7(m|0,G|0,H|0);s5(m|0,m|0,t|0);s5(G|0,F|0,y|0);s5(H|0,E|0,z|0);s7(n|0,G|0,H|0);s5(K,I|0,C|0);s5(o|0,J|0,w|0);s7(o|0,o|0,K);s5(K,I|0,D|0);s5(p|0,J|0,x|0);s7(p|0,p|0,K);s5(p|0,p|0,r|0);s5(K,I|0,E|0);s5(q|0,J|0,y|0);s7(q|0,q|0,K);s5(q|0,q|0,s|0)}else{s5(G|0,B|0,u|0);s5(H|0,A|0,v|0);s7(f|0,G|0,H|0);s5(G|0,C|0,u|0);s5(H|0,A|0,w|0);s7(g|0,G|0,H|0);s5(g|0,g|0,t|0);s5(G|0,C|0,v|0);s5(H|0,B|0,w|0);s7(h|0,G|0,H|0);s5(G|0,D|0,v|0);s5(H|0,B|0,x|0);s7(j|0,G|0,H|0);s5(j|0,j|0,t|0);s5(G|0,D|0,w|0);s5(H|0,C|0,x|0);s7(k|0,G|0,H|0);s5(G|0,E|0,w|0);s5(H|0,C|0,y|0);s7(l|0,G|0,H|0);s5(l|0,l|0,t|0);s5(G|0,E|0,x|0);s5(H|0,D|0,y|0);s7(m|0,G|0,H|0);s5(G|0,F|0,x|0);s5(H|0,D|0,z|0);s7(n|0,G|0,H|0);s5(n|0,n|0,t|0);s5(K,I|0,B|0);s5(o|0,J|0,v|0);s7(o|0,o|0,K);s5(K,I|0,C|0);s5(p|0,J|0,w|0);s7(p|0,p|0,K);s5(K,I|0,D|0);s5(q|0,J|0,x|0);s7(q|0,q|0,K);s5(q|0,q|0,r|0)}if((M|0)==0){break}M=M-1|0}s9(k|0,k|0);s5(q|0,q|0,k|0);tb(K,q|0,c+452|0);sQ(o|0);sQ(p|0);sQ(q|0);sQ(f|0);sQ(g|0);sQ(h|0);sQ(j|0);sQ(k|0);sQ(l|0);sQ(m|0);sQ(n|0);sQ(u|0);sQ(v|0);sQ(w|0);sQ(x|0);sQ(y|0);sQ(z|0);sQ(A|0);sQ(B|0);sQ(C|0);sQ(D|0);sQ(E|0);sQ(F|0);sQ(G|0);sQ(H|0);sQ(r|0);sQ(s|0);sQ(t|0);sQ(I|0);sQ(J|0);i=e;return}function s1(a,b){a=a|0;b=b|0;sP(a,c[b>>2]|0);return}function s2(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function s3(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function s4(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function s5(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function s6(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function s7(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function s8(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function s9(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function ta(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function tb(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function tc(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function td(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function te(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;tf(d);b=c[d+4>>2]|0;d=0;d=d+(q2(b|0,a,5768)|0)|0;d=d+(q2(b+12|0,a,8216)|0)|0;d=d+(q2(b+24|0,a,6984)|0)|0;d=d+(q2(b+36|0,a,6296)|0)|0;d=d+(q2(b+48|0,a,5816)|0)|0;d=d+(q2(b+60|0,a,5440)|0)|0;return d|0}function tf(a){a=a|0;var b=0;b=a;c[b>>2]=1336;a=bm[c[198]&1023](72)|0;c[b+4>>2]=a;b=a;d3(b|0);d3(b+12|0);d3(b+24|0);d3(b+36|0);d3(b+48|0);d3(b+60|0);return}function tg(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function th(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function ti(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+64>>2]&1023](d,b)|0}function tj(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function tk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function tl(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function tm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function tn(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+68>>2]&1023](b)|0}function to(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+72>>2]&1023](b)|0}function tp(a){a=a|0;var b=0;b=a;a=b;dU(a|0);dU(a+12|0);dU(a+24|0);dU(a+36|0);dU(a+48|0);dU(a+60|0);bk[c[200]&1023](b);return}function tq(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+56|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+32|0;k=d+48|0;l=a;a=b;b=bm[c[198]&1023](1348)|0;c[l+504>>2]=b;m=b;d3(l|0);er(l|0,a+12|0);jL(l+12|0,l|0);jL(m|0,a|0);c[(m|0)+208>>2]=bm[c[198]&1023](8)|0;tg(c[(m|0)+208>>2]|0,m|0);tj(c[(m|0)+208>>2]|0,a+36|0);k_(m+216|0,m|0);mb(m+432|0,m+216|0);tg(e|0,m+432|0);mM(e|0,6);tg(m+1296|0,m+216|0);tg(m+1304|0,m+216|0);tj(tn(m+1296|0)|0,a+48|0);tj(to(m+1296|0)|0,a+60|0);ts(ti(e|0,0)|0,m+1296|0);mR(m+648|0,e|0);tl(m+1296|0,m+1296|0);tt(m+1304|0,m+1296|0);th(e|0);tg(f|0,m|0);tg(g|0,m|0);tg(h|0,m+216|0);tj(g|0,a+24|0);oM(m+864|0,f|0,g|0,l|0,0);tj(f|0,a+48|0);tl(f|0,f|0);tk(tn(h|0)|0,f|0,g|0);tj(f|0,a+60|0);tl(f|0,f|0);tk(to(h|0)|0,f|0,g|0);th(f|0);tg(f|0,m+216|0);oM(m+1080|0,f|0,h|0,l|0,0);th(f|0);th(g|0);th(h|0);d3(j|0);ew(j|0,a|0,a+12|0);dN(j|0,j|0,1);pA(j|0,a|0,j|0,12);dW(j|0,j|0,a+12|0);dW(j|0,j|0,a+12|0);pv(m+1080|0,j|0);dU(j|0);c[l+228>>2]=m+864|0;c[l+232>>2]=m+1080|0;p6(l,m+648|0);c[l+496>>2]=272;c[l+468>>2]=472;c[l+480>>2]=694;d3(m+1312|0);l=m+1312|0;d9(l,a|0,a|0);ex(l,l,1);d9(l,l,a|0);d9(l,l,a|0);dN(l,l,1);dW(l,l,a+12|0);tg(m+1324|0,m+216|0);tg(m+1332|0,m+216|0);tg(m+1340|0,m+216|0);tg(k|0,m+648|0);tx(ti(k|0,1)|0);tm(k|0,k|0,a|0);tm(k|0,k|0,a|0);ts(m+1324|0,ti(k|0,1)|0);tm(k|0,k|0,a|0);tm(k|0,k|0,a|0);tm(k|0,k|0,a|0);tm(k|0,k|0,a|0);ts(m+1332|0,ti(k|0,1)|0);tm(k|0,k|0,a|0);tm(k|0,k|0,a|0);ts(m+1340|0,ti(k|0,1)|0);th(k|0);i=d;return}function tr(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;q$(c,5216);q0(c,5768,a|0);q0(c,8216,a+12|0);q0(c,6984,a+24|0);q0(c,6296,a+36|0);q0(c,5816,a+48|0);q0(c,5440,a+60|0);return}function ts(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function tt(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function tu(a){a=a|0;tz(c[a+4>>2]|0);return}function tv(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f|0;h=f+8|0;j=a;a=e;e=d;d=c[a+504>>2]|0;tg(g|0,d+216|0);tg(h|0,d+216|0);tk(g|0,o9(e)|0,d+1304|0);tk(h|0,pa(e)|0,d+1304|0);ty(j,a|0,b,g|0,h|0,d+1296|0);th(g|0);th(h|0);tz(j);i=f;return}function tw(a){a=a|0;var b=0;b=a;iN(b+236|0);a=c[b+504>>2]|0;th(a+1296|0);th(a+1304|0);dU(a+1312|0);th(a+1324|0);th(a+1332|0);th(a+1340|0);iN(a+1080|0);iN(a+864|0);iN(a+648|0);iN(a+432|0);iN(a+216|0);iN(a|0);bk[c[200]&1023](a);dU(b|0);iN(b+12|0);return}function tx(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function ty(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=i;i=i+64|0;j=h|0;k=h+8|0;l=h+16|0;m=h+24|0;n=h+32|0;o=h+40|0;p=h+48|0;q=h+56|0;r=a;a=b;b=d;d=e;e=f;f=g;g=o9(b)|0;s=pa(b)|0;tg(l|0,c[g>>2]|0);tg(m|0,c[l>>2]|0);tg(n|0,c[l>>2]|0);tg(o|0,c[l>>2]|0);tg(p|0,c[r>>2]|0);tg(q|0,c[d>>2]|0);tg(j|0,c[r>>2]|0);tg(k|0,c[b>>2]|0);ts(k|0,b);t=o9(k|0)|0;u=pa(k|0)|0;tx(j|0);v=(eu(a,2)|0)-2|0;while(1){tA(l|0,t);tB(l|0,l|0,3);tl(l|0,l|0);tC(m|0,u,u);tk(o|0,m|0,u);tk(n|0,l|0,t);tC(n|0,n|0,o|0);tl(n|0,n|0);w=ti(p|0,0)|0;tk(q|0,ti(j|0,2)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,3)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);tk(w,w,f);x=tn(q|0)|0;tk(x,tn(ti(j|0,0)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,0)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,1)|0;tk(q|0,ti(j|0,3)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,4)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);tk(w,w,f);x=tn(q|0)|0;tk(x,tn(ti(j|0,1)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,1)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,2)|0;tk(q|0,ti(j|0,4)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,5)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);tk(w,w,f);x=tn(q|0)|0;tk(x,tn(ti(j|0,2)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,2)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,3)|0;tk(q|0,ti(j|0,5)|0,d);tk(q|0,q|0,f);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,0)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);x=tn(q|0)|0;tk(x,tn(ti(j|0,3)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,3)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,4)|0;tk(q|0,ti(j|0,0)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,1)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);x=tn(q|0)|0;tk(x,tn(ti(j|0,4)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,4)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,5)|0;tk(q|0,ti(j|0,1)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,2)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);x=tn(q|0)|0;tk(x,tn(ti(j|0,5)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,5)|0)|0,n|0);tC(w,w,q|0);ts(j|0,p|0);if((v|0)==0){break}tD(k|0,k|0);if((eB(a,v)|0)!=0){tE(m|0,g,t);tE(l|0,u,s);tk(o|0,m|0,u);tk(n|0,l|0,t);tC(n|0,n|0,o|0);tl(n|0,n|0);w=ti(p|0,0)|0;tk(q|0,ti(j|0,2)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,3)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);tk(w,w,f);x=tn(q|0)|0;tk(x,tn(ti(j|0,0)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,0)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,1)|0;tk(q|0,ti(j|0,3)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,4)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);tk(w,w,f);x=tn(q|0)|0;tk(x,tn(ti(j|0,1)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,1)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,2)|0;tk(q|0,ti(j|0,4)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,5)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);tk(w,w,f);x=tn(q|0)|0;tk(x,tn(ti(j|0,2)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,2)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,3)|0;tk(q|0,ti(j|0,5)|0,d);tk(q|0,q|0,f);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,0)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);x=tn(q|0)|0;tk(x,tn(ti(j|0,3)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,3)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,4)|0;tk(q|0,ti(j|0,0)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,1)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);x=tn(q|0)|0;tk(x,tn(ti(j|0,4)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,4)|0)|0,n|0);tC(w,w,q|0);w=ti(p|0,5)|0;tk(q|0,ti(j|0,1)|0,d);x=tn(q|0)|0;tk(x,tn(q|0)|0,l|0);x=to(q|0)|0;tk(x,to(q|0)|0,l|0);tk(w,ti(j|0,2)|0,e);x=tn(w)|0;tk(x,tn(w)|0,m|0);x=to(w)|0;tk(x,to(w)|0,m|0);tC(w,w,q|0);x=tn(q|0)|0;tk(x,tn(ti(j|0,5)|0)|0,n|0);x=to(q|0)|0;tk(x,to(ti(j|0,5)|0)|0,n|0);tC(w,w,q|0);ts(j|0,p|0);tC(k|0,k|0,b)}v=v-1|0;tA(j|0,j|0)}ts(r,j|0);th(j|0);th(k|0);th(l|0);th(m|0);th(n|0);th(o|0);th(p|0);th(q|0);i=h;return}function tz(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;i=i+24|0;d=b|0;e=b+8|0;f=b+16|0;g=a;a=c[(c[(c[g>>2]|0)+192>>2]|0)+504>>2]|0;tg(d|0,a+648|0);tg(e|0,a+648|0);tg(f|0,a+216|0);h=ti(e|0,0)|0;ts(h,ti(g,0)|0);h=ti(e|0,1)|0;tk(h,ti(g,1)|0,a+1340|0);tA(f|0,a+1340|0);h=ti(e|0,2)|0;tk(h,ti(g,2)|0,f|0);tk(f|0,f|0,a+1340|0);h=ti(e|0,3)|0;tk(h,ti(g,3)|0,f|0);tk(f|0,f|0,a+1340|0);h=ti(e|0,4)|0;tk(h,ti(g,4)|0,f|0);tk(f|0,f|0,a+1340|0);h=ti(e|0,5)|0;tk(h,ti(g,5)|0,f|0);h=ti(d|0,0)|0;ts(h,ti(g,0)|0);h=ti(d|0,1)|0;tk(h,ti(g,1)|0,a+1332|0);tA(f|0,a+1332|0);h=ti(d|0,2)|0;tk(h,ti(g,2)|0,f|0);tk(f|0,f|0,a+1332|0);h=ti(d|0,3)|0;tk(h,ti(g,3)|0,f|0);tk(f|0,f|0,a+1332|0);h=ti(d|0,4)|0;tk(h,ti(g,4)|0,f|0);tk(f|0,f|0,a+1332|0);h=ti(d|0,5)|0;tk(h,ti(g,5)|0,f|0);tk(e|0,e|0,d|0);h=ti(d|0,0)|0;ts(h,ti(g,0)|0);h=ti(d|0,1)|0;tk(h,ti(g,1)|0,a+1324|0);tA(f|0,a+1324|0);h=ti(d|0,2)|0;tk(h,ti(g,2)|0,f|0);tk(f|0,f|0,a+1324|0);h=ti(d|0,3)|0;tk(h,ti(g,3)|0,f|0);tk(f|0,f|0,a+1324|0);h=ti(d|0,4)|0;tk(h,ti(g,4)|0,f|0);tk(f|0,f|0,a+1324|0);h=ti(d|0,5)|0;tk(h,ti(g,5)|0,f|0);tk(d|0,d|0,g);tt(d|0,d|0);tk(g,e|0,d|0);th(f|0);th(d|0);th(e|0);tm(g,g,a+1312|0);i=b;return}function tA(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function tB(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function tC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function tD(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function tE(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function tF(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+80|0;e=d|0;f=a;a=b;tG(f);b=c[f+4>>2]|0;f=0;f=f+(q2(b|0,a,5600)|0)|0;f=f+(q2(b+12|0,a,8144)|0)|0;f=f+(q2(b+24|0,a,6952)|0)|0;f=f+(q2(b+36|0,a,6264)|0)|0;f=f+(q2(b+48|0,a,5776)|0)|0;f=f+(q2(b+60|0,a,5408)|0)|0;f=f+(q2(b+72|0,a,5208)|0)|0;f=f+(q2(b+84|0,a,4960)|0)|0;f=f+(q2(b+100|0,a,4376)|0)|0;c[b+96>>2]=bq[c[194]&1023](c[b+96>>2]|0,60)|0;g=0;while(1){if((g|0)>=5){break}aY(e|0,4224,(w=i,i=i+8|0,c[w>>2]=g,w)|0);d3((c[b+96>>2]|0)+(g*12&-1)|0);f=f+(q2((c[b+96>>2]|0)+(g*12&-1)|0,a,e|0)|0)|0;g=g+1|0}i=d;return f|0}function tG(a){a=a|0;var b=0;b=a;c[b>>2]=1312;a=bm[c[198]&1023](112)|0;c[b+4>>2]=a;b=a;d3(b|0);d3(b+12|0);d3(b+24|0);d3(b+36|0);d3(b+48|0);d3(b+60|0);d3(b+72|0);d3(b+84|0);c[b+96>>2]=0;d3(b+100|0);return}function tH(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;c[d>>2]=a;bk[c[a+4>>2]&1023](d);return}function tI(a,b){a=a|0;b=b|0;var d=0;d=a;return bq[c[(c[d>>2]|0)+64>>2]&1023](d,b)|0}function tJ(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+8>>2]&1023](b);return}function tK(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+12>>2]&1023](d,b);return}function tL(a){a=a|0;var b=0,d=0;b=a;a=b;dU(a|0);dU(a+12|0);dU(a+24|0);dU(a+36|0);dU(a+48|0);dU(a+60|0);dU(a+72|0);dU(a+84|0);dU(a+100|0);d=0;while(1){if((d|0)>=5){break}dU((c[a+96>>2]|0)+(d*12&-1)|0);d=d+1|0}bk[c[200]&1023](c[a+96>>2]|0);uu(b);return}function tM(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;i=i+56|0;e=d|0;f=d+8|0;g=d+16|0;h=d+24|0;j=d+40|0;k=a;a=b;d3(k|0);er(k|0,a+36|0);jL(k+12|0,k|0);c[k+468>>2]=122;c[k+476>>2]=790;b=bm[c[198]&1023](1344)|0;c[k+504>>2]=b;l=b;jL(l|0,a|0);tH(e|0,l|0);tH(f|0,l|0);tK(e|0,a+48|0);tK(f|0,a+60|0);oM(l+864|0,e|0,f|0,k|0,a+24|0);mb(l+216|0,l|0);tH(g|0,l+216|0);mM(g|0,5);b=0;while(1){if((b|0)>=5){break}m=tI(g|0,b)|0;tK(m,(c[a+96>>2]|0)+(b*12&-1)|0);b=b+1|0}mR(l+432|0,g|0);tJ(g|0);c[(l+432|0)+208>>2]=bm[c[198]&1023](8)|0;tH(c[(l+432|0)+208>>2]|0,l+432|0);tK(c[(c[(l+432|0)+208>>2]|0)+4>>2]|0,a+100|0);k_(l+648|0,l+432|0);g=l+1312|0;b=a|0;m=k+452|0;d3(m);d3(h|0);eq(m,1);ew(m,m,b);d9(h|0,b,b);dM(m,m,h|0);d9(h|0,h|0,b);ew(m,m,h|0);d9(h|0,h|0,b);dM(m,m,h|0);dU(h|0);dW(m,m,k|0);tH(g,l+432|0);tH(l+1320|0,l+432|0);tH(l+1328|0,l+432|0);tH(l+1336|0,l+432|0);tQ((c[g+4>>2]|0)+8|0);tR(g,g,b);tS(l+1320|0,l+1312|0);tS(l+1336|0,l+1320|0);tT(l+1328|0,l+1320|0,l+1312|0);pr(l+1080|0,l+864|0,660,l+432|0,k|0,0);pt(l+1080|0);tH(l+1296|0,l+432|0);tU(l+1296|0,ij(l+432|0)|0);tH(l+1304|0,l+432|0);tS(l+1304|0,l+1296|0);d3(j|0);ew(j|0,a|0,a+12|0);dN(j|0,j|0,1);ee(j|0,j|0);pA(j|0,a|0,j|0,5);dW(j|0,j|0,a+36|0);pv(l+1080|0,j|0);dU(j|0);c[k+228>>2]=l+864|0;c[k+232>>2]=l+1080|0;p6(k,l+648|0);c[k+496>>2]=612;c[980]=58;c[k+500>>2]=822;c[k+484>>2]=36;c[k+488>>2]=684;c[k+492>>2]=378;c[k+480>>2]=596;tJ(e|0);tJ(f|0);i=d;return}function tN(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+8|0;e=d|0;f=a;a=b;q$(f,9192);q0(f,5600,a|0);q0(f,8144,a+12|0);q0(f,6952,a+24|0);q0(f,6264,a+36|0);q0(f,5776,a+48|0);q0(f,5408,a+60|0);q0(f,5208,a+72|0);q0(f,4960,a+84|0);b=0;while(1){if((b|0)>=5){break}aY(e|0,4224,(w=i,i=i+8|0,c[w>>2]=b,w)|0);q0(f,e|0,(c[a+96>>2]|0)+(b*12&-1)|0);b=b+1|0}q0(f,4376,a+100|0);i=d;return}function tO(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f|0;h=f+8|0;j=a;a=e;e=d;d=c[a+504>>2]|0;tH(g|0,d+432|0);tH(h|0,d+432|0);tT(g|0,o9(e)|0,d+1296|0);tT(h|0,pa(e)|0,d+1304|0);bj[c[980]&1023](j,a|0,b,g|0,h|0);t2(j,j,a);tJ(g|0);tJ(h|0);i=f;return}function tP(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+56|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=d;d=e;e=f;f=0;q=c[e+504>>2]|0;tH(l|0,q+432|0);tH(m|0,q+432|0);tH(n|0,q+432|0);tH(o|0,q+432|0);tH(h|0,q+648|0);tH(j|0,q+648|0);tH(k|0,q+648|0);tT(l|0,o9(p)|0,q+1296|0);tT(n|0,o9(d)|0,q+1296|0);tT(m|0,pa(p)|0,q+1304|0);tT(o|0,pa(d)|0,q+1304|0);bj[c[980]&1023](h|0,e|0,a,n|0,o|0);bj[c[980]&1023](j|0,e|0,b,l|0,m|0);t2(h|0,h|0,e);t2(j|0,j|0,e);tT(k|0,h|0,j|0);if((uj(k|0)|0)!=0){f=1;r=l|0;tJ(r);s=m|0;tJ(s);t=n|0;tJ(t);u=o|0;tJ(u);v=h|0;tJ(v);w=j|0;tJ(w);x=k|0;tJ(x);y=f;i=g;return y|0}tU(j|0,j|0);tT(k|0,h|0,j|0);if((uj(k|0)|0)!=0){f=1}r=l|0;tJ(r);s=m|0;tJ(s);t=n|0;tJ(t);u=o|0;tJ(u);v=h|0;tJ(v);w=j|0;tJ(w);x=k|0;tJ(x);y=f;i=g;return y|0}function tQ(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+28>>2]&1023](b);return}function tR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+116>>2]&1023](e,b,d);return}function tS(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+112>>2]&1023](d,b);return}function tT(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+48>>2]&1023](e,b,d);return}function tU(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+120>>2]&1023](d,b);return}function tV(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+8|0;d=b|0;e=a;t0(d|0,c[e+4>>2]|0);t2(d|0,c[e+4>>2]|0,c[(c[e>>2]|0)+192>>2]|0);t5(c[e+4>>2]|0,d|0);tJ(d|0);i=b;return}function tW(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=i;i=i+56|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=a;a=b;b=d;d=e;e=f;f=pb(b)|0;q=o9(b)|0;r=pa(b)|0;tH(k|0,c[q>>2]|0);tH(l|0,c[k>>2]|0);tH(m|0,c[k>>2]|0);tH(n|0,c[k>>2]|0);tH(o|0,c[p>>2]|0);tH(h|0,c[p>>2]|0);tH(j|0,c[b>>2]|0);t5(j|0,b);s=o9(j|0)|0;t=pa(j|0)|0;tQ(h|0);u=(eu(a,2)|0)-2|0;while(1){tS(k|0,s);uh(k|0,k|0,3);t6(k|0,k|0,f);t7(k|0,k|0);t6(l|0,t,t);tT(n|0,l|0,t);tT(m|0,k|0,s);t6(m|0,m|0,n|0);t7(m|0,m|0);t1(o|0,k|0,l|0,m|0,d,e);tT(h|0,h|0,o|0);if((u|0)==0){break}ub(j|0,j|0);if((eB(a,u)|0)!=0){t8(l|0,q,s);t8(k|0,t,r);tT(n|0,l|0,t);tT(m|0,k|0,s);t6(m|0,m|0,n|0);t7(m|0,m|0);t1(o|0,k|0,l|0,m|0,d,e);tT(h|0,h|0,o|0);t6(j|0,j|0,b)}u=u-1|0;tS(h|0,h|0)}t5(p,h|0);tJ(h|0);tJ(j|0);tJ(k|0);tJ(l|0);tJ(m|0);tJ(n|0);tJ(o|0);i=g;return}function tX(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=d;if((bh(b|0,8952)|0)!=0){return}if((bh(a|0,8536)|0)!=0){if((bh(a|0,8408)|0)!=0){if((bh(a|0,8224)|0)==0){c[e+468>>2]=382}}else{c[980]=58}}else{c[980]=318}return}function tY(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+40|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=e+32|0;l=a;a=d;d=b;b=o9(d)|0;m=pa(d)|0;n=c[a+504>>2]|0;o=a|0;a=pb(d)|0;tH(f|0,c[d>>2]|0);t5(f|0,d);p=o9(f|0)|0;q=pa(f|0)|0;tH(g|0,n);tH(h|0,n);tH(j|0,n);tH(k|0,n);r=(eu(o,2)|0)-2|0;c[l+4>>2]=bm[c[198]&1023](r*48&-1)|0;s=c[l+4>>2]|0;while(1){tS(h|0,p);ub(g|0,h|0);t6(h|0,h|0,g|0);t6(h|0,h|0,a);t7(h|0,h|0);t6(j|0,q,q);tT(g|0,j|0,q);tT(k|0,h|0,p);t6(k|0,k|0,g|0);t7(k|0,k|0);tH(s|0,n);tH(s+8|0,n);tH(s+16|0,n);t5(s|0,h|0);t5(s+8|0,j|0);t5(s+16|0,k|0);s=s+24|0;if((r|0)==0){break}ub(f|0,f|0);if((eB(o,r)|0)!=0){t8(j|0,b,p);t8(h|0,q,m);tT(g|0,j|0,q);tT(k|0,h|0,p);t6(k|0,k|0,g|0);t7(k|0,k|0);tH(s|0,n);tH(s+8|0,n);tH(s+16|0,n);t5(s|0,h|0);t5(s+8|0,j|0);t5(s+16|0,k|0);s=s+24|0;t6(f|0,f|0,d)}r=r-1|0}tJ(g|0);tJ(h|0);tJ(j|0);tJ(k|0);tJ(f|0);i=e;return}function tZ(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b>>2]|0;d=eu(a,2)|0;e=(d+(eg(a)|0)|0)-3|0;a=c[b+4>>2]|0;d=0;while(1){if((d|0)>=(e|0)){break}f=a+(d*24&-1)|0;tJ(f|0);tJ(f+8|0);tJ(f+16|0);d=d+1|0}bk[c[200]&1023](c[b+4>>2]|0);return}function t_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=a;a=d;d=c[a>>2]|0;l=c[(c[a>>2]|0)+504>>2]|0;m=(eu(d,2)|0)-2|0;n=c[a+4>>2]|0;o=b;t0(f|0,k);t0(j|0,k);tH(g|0,l+432|0);tH(h|0,l+432|0);tT(g|0,o9(o)|0,l+1296|0);tT(h|0,pa(o)|0,l+1304|0);tQ(k);while(1){t1(f|0,n|0,n+8|0,n+16|0,g|0,h|0);tT(k,k,f|0);n=n+24|0;if((m|0)==0){break}if((eB(d,m)|0)!=0){t1(f|0,n|0,n+8|0,n+16|0,g|0,h|0);tT(k,k,f|0);n=n+24|0}m=m-1|0;tS(k,k)}t2(k,k,c[a>>2]|0);tJ(f|0);tJ(g|0);tJ(h|0);tJ(j|0);i=e;return}function t$(a){a=a|0;var b=0;b=a;iN(b+236|0);a=c[b+504>>2]|0;tJ(a+1312|0);tJ(a+1320|0);tJ(a+1328|0);tJ(a+1336|0);dU(b+452|0);iN(a+1080|0);iN(a+864|0);tJ(a+1296|0);tJ(a+1304|0);iN(a+648|0);iN(a+432|0);iN(a+216|0);iN(a|0);iN(b+12|0);dU(b|0);bk[c[200]&1023](a);return}function t0(a,b){a=a|0;b=b|0;tH(a,c[b>>2]|0);return}function t1(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;h=a;a=b;b=d;d=e;e=f;f=g;g=t3(h)|0;i=t4(h)|0;h=mG(c[g>>2]|0)|0;j=0;while(1){if((j|0)>=(h|0)){break}k=tI(g,j)|0;tT(k,tI(e,j)|0,a);k=tI(i,j)|0;tT(k,tI(f,j)|0,b);j=j+1|0}j=tI(g,0)|0;t6(j,tI(g,0)|0,d);return}function t2(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+32|0;f=e|0;g=e+8|0;h=e+16|0;j=e+24|0;k=b;b=d;d=c[b+504>>2]|0;tH(f|0,d+648|0);tH(g|0,d+432|0);tH(h|0,d+432|0);tH(j|0,d+648|0);l=t3(f|0)|0;m=t4(f|0)|0;n=c[l+4>>2]|0;o=c[m+4>>2]|0;p=c[(t3(k)|0)+4>>2]|0;q=c[(t4(k)|0)+4>>2]|0;nx(h|0,p+8|0,d+1312|0);t5(l,h|0);nx(h|0,p+16|0,d+1320|0);t6(l,l,h|0);nx(h|0,p+24|0,d+1328|0);t6(l,l,h|0);nx(h|0,p+32|0,d+1336|0);t6(l,l,h|0);t6(n,n,p|0);nx(h|0,q+8|0,d+1312|0);t5(m,h|0);nx(h|0,q+16|0,d+1320|0);t6(m,m,h|0);nx(h|0,q+24|0,d+1328|0);t6(m,m,h|0);nx(h|0,q+32|0,d+1336|0);t6(m,m,h|0);t6(o,o,q|0);t5(j|0,f|0);t5(l,t3(k)|0);t7(m,t4(k)|0);tT(j|0,j|0,f|0);nx(h|0,p+8|0,d+1312|0);t5(l,h|0);nx(h|0,p+16|0,d+1320|0);t6(l,l,h|0);nx(h|0,p+24|0,d+1328|0);t6(l,l,h|0);nx(h|0,p+32|0,d+1336|0);t6(l,l,h|0);t6(n,n,p|0);nx(h|0,q+8|0,d+1312|0);t7(m,h|0);nx(h|0,q+16|0,d+1320|0);t8(m,m,h|0);nx(h|0,q+24|0,d+1328|0);t8(m,m,h|0);nx(h|0,q+32|0,d+1336|0);t8(m,m,h|0);t8(o,o,q|0);tT(f|0,f|0,k);tU(f|0,f|0);tT(k,j|0,f|0);t5(f|0,k);t9(a,f|0,b+452|0);tJ(f|0);tJ(g|0);tJ(h|0);tJ(j|0);i=e;return}function t3(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+68>>2]&1023](b)|0}function t4(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+72>>2]&1023](b)|0}function t5(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+20>>2]&1023](d,b);return}function t6(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+40>>2]&1023](e,b,d);return}function t7(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+124>>2]&1023](d,b);return}function t8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+44>>2]&1023](e,b,d);return}function t9(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=a;a=b;b=c;t0(e|0,f);c=t3(a)|0;g=t4(a)|0;a=t3(f)|0;h=t4(f)|0;f=t3(e|0)|0;j=t4(e|0)|0;ua(f,2);ub(j,c);t5(a,f);t5(h,j);k=(eu(b,2)|0)-1|0;while(1){if((k|0)==0){break}if((eB(b,k)|0)!=0){tT(a,a,h);t8(a,a,j);tS(h,h);t8(h,h,f)}else{tT(h,a,h);t8(h,h,j);tS(a,a);t8(a,a,f)}k=k-1|0}tT(h,a,h);t8(h,h,j);tS(a,a);t8(a,a,f);ub(a,a);tT(c,j,h);t8(c,c,a);tS(j,j);t8(j,j,f);t8(j,j,f);uc(a,h);ud(h,c,j);tT(h,h,g);tJ(e|0);i=d;return}function ua(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+76>>2]&1023](d,b);return}function ub(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+96>>2]&1023](d,b);return}function uc(a,b){a=a|0;b=b|0;var d=0;d=a;bl[c[(c[d>>2]|0)+108>>2]&1023](d,b);return}function ud(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+92>>2]&1023](e,b,d);return}function ue(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+80|0;h=g|0;j=g+8|0;k=g+16|0;l=g+24|0;m=g+32|0;n=g+40|0;o=g+48|0;p=g+56|0;q=g+64|0;r=g+72|0;s=a;a=b;b=d;d=e;e=f;f=k|0;t=l|0;u=m|0;v=pb(b)|0;w=o9(b)|0;x=pa(b)|0;tH(k|0,c[w>>2]|0);tH(l|0,c[k>>2]|0);tH(m|0,c[k>>2]|0);tH(n|0,c[k>>2]|0);tH(o|0,c[k>>2]|0);tH(p|0,c[s>>2]|0);tH(q|0,c[k>>2]|0);tH(r|0,c[k>>2]|0);tQ(q|0);tQ(r|0);tH(h|0,c[s>>2]|0);tH(j|0,c[b>>2]|0);t5(j|0,b);b=o9(j|0)|0;y=o9(j|0)|0;tQ(h|0);z=(eu(a,2)|0)-2|0;while(1){tS(k|0,r|0);tT(k|0,k|0,v);tS(l|0,b);ub(n|0,l|0);t6(l|0,l|0,n|0);t6(k|0,k|0,l|0);t7(k|0,k|0);tT(l|0,q|0,r|0);tT(l|0,l|0,y);uh(l|0,l|0,2);tT(m|0,b,k|0);tT(k|0,k|0,r|0);tS(n|0,y);uh(n|0,n|0,2);t6(m|0,m|0,n|0);t7(m|0,m|0);t1(p|0,k|0,l|0,m|0,d,e);tT(h|0,h|0,p|0);if((z|0)==0){break}tS(n|0,b);ub(o|0,n|0);t6(n|0,n|0,o|0);tS(o|0,r|0);tT(o|0,o|0,v);t6(n|0,n|0,o|0);tT(q|0,y,q|0);ub(q|0,q|0);tS(r|0,q|0);tS(f,y);tT(o|0,b,f);ub(o|0,o|0);ub(o|0,o|0);ub(t,o|0);tS(b,n|0);t8(b,b,t);tS(f,f);ub(f,f);ub(f,f);ub(f,f);t8(o|0,o|0,b);tT(n|0,n|0,o|0);t8(y,n|0,f);if((eB(a,z)|0)!=0){tT(n|0,b,q|0);tT(o|0,r|0,q|0);tT(k|0,x,o|0);t8(k|0,y,k|0);tT(l|0,w,o|0);t8(l|0,l|0,n|0);tT(n|0,n|0,x);tT(m|0,y,w);t8(m|0,n|0,m|0);t1(p|0,k|0,l|0,m|0,d,e);tT(h|0,h|0,p|0);tT(f,r|0,w);t8(t,b,f);tT(n|0,r|0,x);tT(n|0,n|0,q|0);t8(o|0,y,n|0);t6(f,b,f);t6(n|0,y,n|0);tT(q|0,q|0,t);tS(r|0,q|0);tS(u,t);tT(t,u,t);tS(b,o|0);tT(u,f,u);t8(b,b,u);t8(u,u,b);t8(u,u,b);tT(u,u,o|0);tT(n|0,n|0,t);t8(u,u,n|0);uc(y,u)}z=z-1|0;tS(h|0,h|0)}t5(s,h|0);tJ(h|0);tJ(j|0);tJ(k|0);tJ(l|0);tJ(m|0);tJ(n|0);tJ(o|0);tJ(p|0);tJ(q|0);tJ(r|0);i=g;return}function uf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;f=i;i=i+240|0;g=f|0;h=f+8|0;j=f+16|0;k=f+24|0;l=f+32|0;m=f+40|0;n=f+48|0;o=f+56|0;p=f+64|0;q=f+72|0;r=f+80|0;s=f+88|0;t=f+96|0;u=f+104|0;v=f+112|0;w=f+120|0;x=f+128|0;y=f+136|0;z=f+144|0;A=f+152|0;B=f+160|0;C=f+168|0;D=f+176|0;E=f+184|0;F=f+192|0;G=f+200|0;H=f+208|0;I=f+216|0;J=f+224|0;K=f+232|0;L=a;a=b;b=d;d=e;e=c[d+504>>2]|0;M=pb(a)|0;N=pc(a)|0;O=o9(a)|0;P=pa(a)|0;a=o9(b)|0;Q=pa(b)|0;t0(g|0,O);t0(h|0,O);t0(j|0,O);t0(k|0,O);t0(l|0,O);t0(m|0,O);t0(n|0,O);t0(o|0,O);t0(u|0,O);t0(p|0,L);t0(q|0,L);t0(r|0,L);t0(s|0,L);t0(t|0,L);ub(l|0,P);t7(g|0,l|0);tS(h|0,O);tS(u|0,h|0);tT(j|0,N,O);ub(j|0,j|0);tS(o|0,M);tT(m|0,j|0,h|0);ub(m|0,m|0);tT(k|0,M,u|0);t6(m|0,m|0,k|0);tT(k|0,o|0,h|0);t8(m|0,m|0,k|0);ub(k|0,m|0);ub(k|0,k|0);t6(m|0,m|0,k|0);tT(k|0,j|0,M);tS(n|0,N);ub(n|0,n|0);ub(n|0,n|0);t6(k|0,k|0,n|0);ub(k|0,k|0);tT(n|0,M,o|0);t6(k|0,k|0,n|0);t8(m|0,m|0,k|0);tT(k|0,h|0,u|0);t6(n|0,k|0,m|0);tT(n|0,n|0,l|0);ub(n|0,n|0);tT(k|0,M,h|0);t6(k|0,k|0,j|0);ub(k|0,k|0);t6(k|0,k|0,u|0);ub(m|0,k|0);t6(k|0,k|0,m|0);t8(m|0,k|0,o|0);tQ(k|0);t7(h|0,k|0);tS(u|0,l|0);tT(o|0,u|0,l|0);tT(o|0,o|0,n|0);tS(u|0,m|0);tT(u|0,u|0,m|0);t8(o|0,o|0,u|0);tT(t3(q|0)|0,a,e+1296|0);t7(s|0,q|0);a=tI(t3(s|0)|0,0)|0;t6(a,tI(t3(s|0)|0,0)|0,O);ub(u|0,O);a=tI(t3(q|0)|0,0)|0;t6(a,tI(t3(q|0)|0,0)|0,u|0);tS(p|0,s|0);tT(p|0,q|0,p|0);tT(t4(r|0)|0,Q,e+1304|0);t5(tI(t3(r|0)|0,0)|0,P);tS(r|0,r|0);t8(r|0,p|0,r|0);tU(t|0,r|0);tU(s|0,s|0);tT(t4(r|0)|0,Q,e+1304|0);ug(t3(r|0)|0);t7(tI(t3(r|0)|0,0)|0,P);tT(r|0,r|0,s|0);tS(r|0,r|0);t8(r|0,q|0,r|0);ug(j|0);tU(u|0,l|0);tQ(p|0);tQ(q|0);t0(v|0,O);t0(w|0,O);t0(x|0,O);t0(y|0,O);t0(z|0,O);t0(A|0,O);t0(B|0,O);t0(C|0,O);t0(D|0,O);t0(E|0,O);t0(F|0,O);t0(G|0,O);t0(H|0,O);t0(I|0,O);t0(J|0,q|0);t0(K|0,q|0);O=(eu(d|0,2)|0)-2|0;while(1){tS(v|0,h|0);tS(w|0,j|0);tS(x|0,k|0);tS(y|0,l|0);tS(z|0,m|0);tS(A|0,n|0);tT(B|0,g|0,j|0);tT(C|0,h|0,k|0);tT(D|0,j|0,l|0);tT(E|0,k|0,m|0);tT(F|0,l|0,n|0);tT(G|0,m|0,o|0);tS(J|0,q|0);tT(K|0,p|0,r|0);if((eB(d|0,O)|0)!=0){tT(H|0,D|0,v|0);tT(I|0,B|0,x|0);t8(g|0,H|0,I|0);tT(g|0,g|0,u|0);tT(H|0,D|0,w|0);tT(I|0,C|0,x|0);t8(h|0,H|0,I|0);tT(H|0,E|0,w|0);tT(I|0,C|0,y|0);t8(j|0,H|0,I|0);tT(j|0,j|0,u|0);tT(H|0,E|0,x|0);tT(I|0,D|0,y|0);t8(k|0,H|0,I|0);tT(H|0,F|0,x|0);tT(I|0,D|0,z|0);t8(l|0,H|0,I|0);tT(l|0,l|0,u|0);tT(H|0,F|0,y|0);tT(I|0,E|0,z|0);t8(m|0,H|0,I|0);tT(H|0,G|0,y|0);tT(I|0,E|0,A|0);t8(n|0,H|0,I|0);tT(n|0,n|0,u|0);tT(H|0,G|0,z|0);tT(I|0,F|0,A|0);t8(o|0,H|0,I|0);P=t3(L)|0;nx(P,D|0,t3(J|0)|0);P=t4(L)|0;nx(P,D|0,t4(J|0)|0);P=t3(p|0)|0;nx(P,x|0,t3(K|0)|0);P=t4(p|0)|0;nx(P,x|0,t4(K|0)|0);t8(p|0,p|0,L);P=t3(L)|0;nx(P,E|0,t3(J|0)|0);P=t4(L)|0;nx(P,E|0,t4(J|0)|0);P=t3(q|0)|0;nx(P,y|0,t3(K|0)|0);P=t4(q|0)|0;nx(P,y|0,t4(K|0)|0);t8(q|0,q|0,L);tT(q|0,q|0,s|0);P=t3(L)|0;nx(P,F|0,t3(J|0)|0);P=t4(L)|0;nx(P,F|0,t4(J|0)|0);P=t3(r|0)|0;nx(P,z|0,t3(K|0)|0);P=t4(r|0)|0;nx(P,z|0,t4(K|0)|0);t8(r|0,r|0,L);tT(r|0,r|0,t|0)}else{tT(H|0,C|0,v|0);tT(I|0,B|0,w|0);t8(g|0,H|0,I|0);tT(H|0,D|0,v|0);tT(I|0,B|0,x|0);t8(h|0,H|0,I|0);tT(h|0,h|0,u|0);tT(H|0,D|0,w|0);tT(I|0,C|0,x|0);t8(j|0,H|0,I|0);tT(H|0,E|0,w|0);tT(I|0,C|0,y|0);t8(k|0,H|0,I|0);tT(k|0,k|0,u|0);tT(H|0,E|0,x|0);tT(I|0,D|0,y|0);t8(l|0,H|0,I|0);tT(H|0,F|0,x|0);tT(I|0,D|0,z|0);t8(m|0,H|0,I|0);tT(m|0,m|0,u|0);tT(H|0,F|0,y|0);tT(I|0,E|0,z|0);t8(n|0,H|0,I|0);tT(H|0,G|0,y|0);tT(I|0,E|0,A|0);t8(o|0,H|0,I|0);tT(o|0,o|0,u|0);P=t3(L)|0;nx(P,C|0,t3(J|0)|0);P=t4(L)|0;nx(P,C|0,t4(J|0)|0);P=t3(p|0)|0;nx(P,w|0,t3(K|0)|0);P=t4(p|0)|0;nx(P,w|0,t4(K|0)|0);t8(p|0,p|0,L);P=t3(L)|0;nx(P,D|0,t3(J|0)|0);P=t4(L)|0;nx(P,D|0,t4(J|0)|0);P=t3(q|0)|0;nx(P,x|0,t3(K|0)|0);P=t4(q|0)|0;nx(P,x|0,t4(K|0)|0);t8(q|0,q|0,L);P=t3(L)|0;nx(P,E|0,t3(J|0)|0);P=t4(L)|0;nx(P,E|0,t4(J|0)|0);P=t3(r|0)|0;nx(P,y|0,t3(K|0)|0);P=t4(r|0)|0;nx(P,y|0,t4(K|0)|0);t8(r|0,r|0,L);tT(r|0,r|0,s|0)}if((O|0)==0){break}O=O-1|0}t2(L,r|0,d);tJ(p|0);tJ(q|0);tJ(r|0);tJ(g|0);tJ(h|0);tJ(j|0);tJ(k|0);tJ(l|0);tJ(m|0);tJ(n|0);tJ(o|0);tJ(v|0);tJ(w|0);tJ(x|0);tJ(y|0);tJ(z|0);tJ(A|0);tJ(B|0);tJ(C|0);tJ(D|0);tJ(E|0);tJ(F|0);tJ(G|0);tJ(H|0);tJ(I|0);tJ(s|0);tJ(t|0);tJ(u|0);tJ(J|0);tJ(K|0);i=f;return}function ug(a){a=a|0;var b=0;b=a;bk[c[(c[b>>2]|0)+24>>2]&1023](b);return}function uh(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;bn[c[(c[e>>2]|0)+88>>2]&1023](e,b,d);return}function ui(a){a=a|0;var b=0;b=a;c[b>>2]=0;c[(b|0)+4>>2]=0;c[b+8>>2]=1732584193;c[(b+8|0)+4>>2]=-271733879;c[(b+8|0)+8>>2]=-1732584194;c[(b+8|0)+12>>2]=271733878;c[(b+8|0)+16>>2]=-1009589776;return}function uj(a){a=a|0;var b=0;b=a;return bm[c[(c[b>>2]|0)+136>>2]&1023](b)|0}function uk(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;i=i+64|0;f=e|0;g=a;a=b;c[f>>2]=(d[a|0]|0)<<24|(d[a+1|0]|0)<<16|(d[a+2|0]|0)<<8|(d[a+3|0]|0);c[f+4>>2]=(d[a+4|0]|0)<<24|(d[a+5|0]|0)<<16|(d[a+6|0]|0)<<8|(d[a+7|0]|0);c[f+8>>2]=(d[a+8|0]|0)<<24|(d[a+9|0]|0)<<16|(d[a+10|0]|0)<<8|(d[a+11|0]|0);c[f+12>>2]=(d[a+12|0]|0)<<24|(d[a+13|0]|0)<<16|(d[a+14|0]|0)<<8|(d[a+15|0]|0);c[f+16>>2]=(d[a+16|0]|0)<<24|(d[a+17|0]|0)<<16|(d[a+18|0]|0)<<8|(d[a+19|0]|0);c[f+20>>2]=(d[a+20|0]|0)<<24|(d[a+21|0]|0)<<16|(d[a+22|0]|0)<<8|(d[a+23|0]|0);c[f+24>>2]=(d[a+24|0]|0)<<24|(d[a+25|0]|0)<<16|(d[a+26|0]|0)<<8|(d[a+27|0]|0);c[f+28>>2]=(d[a+28|0]|0)<<24|(d[a+29|0]|0)<<16|(d[a+30|0]|0)<<8|(d[a+31|0]|0);c[f+32>>2]=(d[a+32|0]|0)<<24|(d[a+33|0]|0)<<16|(d[a+34|0]|0)<<8|(d[a+35|0]|0);c[f+36>>2]=(d[a+36|0]|0)<<24|(d[a+37|0]|0)<<16|(d[a+38|0]|0)<<8|(d[a+39|0]|0);c[f+40>>2]=(d[a+40|0]|0)<<24|(d[a+41|0]|0)<<16|(d[a+42|0]|0)<<8|(d[a+43|0]|0);c[f+44>>2]=(d[a+44|0]|0)<<24|(d[a+45|0]|0)<<16|(d[a+46|0]|0)<<8|(d[a+47|0]|0);c[f+48>>2]=(d[a+48|0]|0)<<24|(d[a+49|0]|0)<<16|(d[a+50|0]|0)<<8|(d[a+51|0]|0);c[f+52>>2]=(d[a+52|0]|0)<<24|(d[a+53|0]|0)<<16|(d[a+54|0]|0)<<8|(d[a+55|0]|0);c[f+56>>2]=(d[a+56|0]|0)<<24|(d[a+57|0]|0)<<16|(d[a+58|0]|0)<<8|(d[a+59|0]|0);c[f+60>>2]=(d[a+60|0]|0)<<24|(d[a+61|0]|0)<<16|(d[a+62|0]|0)<<8|(d[a+63|0]|0);a=c[g+8>>2]|0;b=c[(g+8|0)+4>>2]|0;h=c[(g+8|0)+8>>2]|0;j=c[(g+8|0)+12>>2]|0;k=c[(g+8|0)+16>>2]|0;k=k+((((a<<5|a>>>27)+(j^b&(h^j))|0)+1518500249|0)+(c[f>>2]|0)|0)|0;b=b<<30|b>>>2;j=j+((((k<<5|k>>>27)+(h^a&(b^h))|0)+1518500249|0)+(c[f+4>>2]|0)|0)|0;a=a<<30|a>>>2;h=h+((((j<<5|j>>>27)+(b^k&(a^b))|0)+1518500249|0)+(c[f+8>>2]|0)|0)|0;k=k<<30|k>>>2;b=b+((((h<<5|h>>>27)+(a^j&(k^a))|0)+1518500249|0)+(c[f+12>>2]|0)|0)|0;j=j<<30|j>>>2;a=a+((((b<<5|b>>>27)+(k^h&(j^k))|0)+1518500249|0)+(c[f+16>>2]|0)|0)|0;h=h<<30|h>>>2;k=k+((((a<<5|a>>>27)+(j^b&(h^j))|0)+1518500249|0)+(c[f+20>>2]|0)|0)|0;b=b<<30|b>>>2;j=j+((((k<<5|k>>>27)+(h^a&(b^h))|0)+1518500249|0)+(c[f+24>>2]|0)|0)|0;a=a<<30|a>>>2;h=h+((((j<<5|j>>>27)+(b^k&(a^b))|0)+1518500249|0)+(c[f+28>>2]|0)|0)|0;k=k<<30|k>>>2;b=b+((((h<<5|h>>>27)+(a^j&(k^a))|0)+1518500249|0)+(c[f+32>>2]|0)|0)|0;j=j<<30|j>>>2;a=a+((((b<<5|b>>>27)+(k^h&(j^k))|0)+1518500249|0)+(c[f+36>>2]|0)|0)|0;h=h<<30|h>>>2;k=k+((((a<<5|a>>>27)+(j^b&(h^j))|0)+1518500249|0)+(c[f+40>>2]|0)|0)|0;b=b<<30|b>>>2;j=j+((((k<<5|k>>>27)+(h^a&(b^h))|0)+1518500249|0)+(c[f+44>>2]|0)|0)|0;a=a<<30|a>>>2;h=h+((((j<<5|j>>>27)+(b^k&(a^b))|0)+1518500249|0)+(c[f+48>>2]|0)|0)|0;k=k<<30|k>>>2;b=b+((((h<<5|h>>>27)+(a^j&(k^a))|0)+1518500249|0)+(c[f+52>>2]|0)|0)|0;j=j<<30|j>>>2;a=a+((((b<<5|b>>>27)+(k^h&(j^k))|0)+1518500249|0)+(c[f+56>>2]|0)|0)|0;h=h<<30|h>>>2;k=k+((((a<<5|a>>>27)+(j^b&(h^j))|0)+1518500249|0)+(c[f+60>>2]|0)|0)|0;b=b<<30|b>>>2;l=c[f+52>>2]^c[f+32>>2]^c[f+8>>2]^c[f>>2];m=l<<1|l>>>31;c[f>>2]=m;j=j+((((k<<5|k>>>27)+(h^a&(b^h))|0)+1518500249|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+56>>2]^c[f+36>>2]^c[f+12>>2]^c[f+4>>2];m=l<<1|l>>>31;c[f+4>>2]=m;h=h+((((j<<5|j>>>27)+(b^k&(a^b))|0)+1518500249|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+60>>2]^c[f+40>>2]^c[f+16>>2]^c[f+8>>2];m=l<<1|l>>>31;c[f+8>>2]=m;b=b+((((h<<5|h>>>27)+(a^j&(k^a))|0)+1518500249|0)+m|0)|0;j=j<<30|j>>>2;l=c[f>>2]^c[f+44>>2]^c[f+20>>2]^c[f+12>>2];m=l<<1|l>>>31;c[f+12>>2]=m;a=a+((((b<<5|b>>>27)+(k^h&(j^k))|0)+1518500249|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+4>>2]^c[f+48>>2]^c[f+24>>2]^c[f+16>>2];m=l<<1|l>>>31;c[f+16>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)+1859775393|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+8>>2]^c[f+52>>2]^c[f+28>>2]^c[f+20>>2];m=l<<1|l>>>31;c[f+20>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)+1859775393|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+12>>2]^c[f+56>>2]^c[f+32>>2]^c[f+24>>2];m=l<<1|l>>>31;c[f+24>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)+1859775393|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+16>>2]^c[f+60>>2]^c[f+36>>2]^c[f+28>>2];m=l<<1|l>>>31;c[f+28>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)+1859775393|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+20>>2]^c[f>>2]^c[f+40>>2]^c[f+32>>2];m=l<<1|l>>>31;c[f+32>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)+1859775393|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+24>>2]^c[f+4>>2]^c[f+44>>2]^c[f+36>>2];m=l<<1|l>>>31;c[f+36>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)+1859775393|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+28>>2]^c[f+8>>2]^c[f+48>>2]^c[f+40>>2];m=l<<1|l>>>31;c[f+40>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)+1859775393|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+32>>2]^c[f+12>>2]^c[f+52>>2]^c[f+44>>2];m=l<<1|l>>>31;c[f+44>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)+1859775393|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+36>>2]^c[f+16>>2]^c[f+56>>2]^c[f+48>>2];m=l<<1|l>>>31;c[f+48>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)+1859775393|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+40>>2]^c[f+20>>2]^c[f+60>>2]^c[f+52>>2];m=l<<1|l>>>31;c[f+52>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)+1859775393|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+44>>2]^c[f+24>>2]^c[f>>2]^c[f+56>>2];m=l<<1|l>>>31;c[f+56>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)+1859775393|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+48>>2]^c[f+28>>2]^c[f+4>>2]^c[f+60>>2];m=l<<1|l>>>31;c[f+60>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)+1859775393|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+52>>2]^c[f+32>>2]^c[f+8>>2]^c[f>>2];m=l<<1|l>>>31;c[f>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)+1859775393|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+56>>2]^c[f+36>>2]^c[f+12>>2]^c[f+4>>2];m=l<<1|l>>>31;c[f+4>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)+1859775393|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+60>>2]^c[f+40>>2]^c[f+16>>2]^c[f+8>>2];m=l<<1|l>>>31;c[f+8>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)+1859775393|0)+m|0)|0;h=h<<30|h>>>2;l=c[f>>2]^c[f+44>>2]^c[f+20>>2]^c[f+12>>2];m=l<<1|l>>>31;c[f+12>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)+1859775393|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+4>>2]^c[f+48>>2]^c[f+24>>2]^c[f+16>>2];m=l<<1|l>>>31;c[f+16>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)+1859775393|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+8>>2]^c[f+52>>2]^c[f+28>>2]^c[f+20>>2];m=l<<1|l>>>31;c[f+20>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)+1859775393|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+12>>2]^c[f+56>>2]^c[f+32>>2]^c[f+24>>2];m=l<<1|l>>>31;c[f+24>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)+1859775393|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+16>>2]^c[f+60>>2]^c[f+36>>2]^c[f+28>>2];m=l<<1|l>>>31;c[f+28>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)+1859775393|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+20>>2]^c[f>>2]^c[f+40>>2]^c[f+32>>2];m=l<<1|l>>>31;c[f+32>>2]=m;k=k+((((a<<5|a>>>27)+(b&h|j&(b|h))|0)-1894007588|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+24>>2]^c[f+4>>2]^c[f+44>>2]^c[f+36>>2];m=l<<1|l>>>31;c[f+36>>2]=m;j=j+((((k<<5|k>>>27)+(a&b|h&(a|b))|0)-1894007588|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+28>>2]^c[f+8>>2]^c[f+48>>2]^c[f+40>>2];m=l<<1|l>>>31;c[f+40>>2]=m;h=h+((((j<<5|j>>>27)+(k&a|b&(k|a))|0)-1894007588|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+32>>2]^c[f+12>>2]^c[f+52>>2]^c[f+44>>2];m=l<<1|l>>>31;c[f+44>>2]=m;b=b+((((h<<5|h>>>27)+(j&k|a&(j|k))|0)-1894007588|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+36>>2]^c[f+16>>2]^c[f+56>>2]^c[f+48>>2];m=l<<1|l>>>31;c[f+48>>2]=m;a=a+((((b<<5|b>>>27)+(h&j|k&(h|j))|0)-1894007588|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+40>>2]^c[f+20>>2]^c[f+60>>2]^c[f+52>>2];m=l<<1|l>>>31;c[f+52>>2]=m;k=k+((((a<<5|a>>>27)+(b&h|j&(b|h))|0)-1894007588|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+44>>2]^c[f+24>>2]^c[f>>2]^c[f+56>>2];m=l<<1|l>>>31;c[f+56>>2]=m;j=j+((((k<<5|k>>>27)+(a&b|h&(a|b))|0)-1894007588|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+48>>2]^c[f+28>>2]^c[f+4>>2]^c[f+60>>2];m=l<<1|l>>>31;c[f+60>>2]=m;h=h+((((j<<5|j>>>27)+(k&a|b&(k|a))|0)-1894007588|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+52>>2]^c[f+32>>2]^c[f+8>>2]^c[f>>2];m=l<<1|l>>>31;c[f>>2]=m;b=b+((((h<<5|h>>>27)+(j&k|a&(j|k))|0)-1894007588|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+56>>2]^c[f+36>>2]^c[f+12>>2]^c[f+4>>2];m=l<<1|l>>>31;c[f+4>>2]=m;a=a+((((b<<5|b>>>27)+(h&j|k&(h|j))|0)-1894007588|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+60>>2]^c[f+40>>2]^c[f+16>>2]^c[f+8>>2];m=l<<1|l>>>31;c[f+8>>2]=m;k=k+((((a<<5|a>>>27)+(b&h|j&(b|h))|0)-1894007588|0)+m|0)|0;b=b<<30|b>>>2;l=c[f>>2]^c[f+44>>2]^c[f+20>>2]^c[f+12>>2];m=l<<1|l>>>31;c[f+12>>2]=m;j=j+((((k<<5|k>>>27)+(a&b|h&(a|b))|0)-1894007588|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+4>>2]^c[f+48>>2]^c[f+24>>2]^c[f+16>>2];m=l<<1|l>>>31;c[f+16>>2]=m;h=h+((((j<<5|j>>>27)+(k&a|b&(k|a))|0)-1894007588|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+8>>2]^c[f+52>>2]^c[f+28>>2]^c[f+20>>2];m=l<<1|l>>>31;c[f+20>>2]=m;b=b+((((h<<5|h>>>27)+(j&k|a&(j|k))|0)-1894007588|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+12>>2]^c[f+56>>2]^c[f+32>>2]^c[f+24>>2];m=l<<1|l>>>31;c[f+24>>2]=m;a=a+((((b<<5|b>>>27)+(h&j|k&(h|j))|0)-1894007588|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+16>>2]^c[f+60>>2]^c[f+36>>2]^c[f+28>>2];m=l<<1|l>>>31;c[f+28>>2]=m;k=k+((((a<<5|a>>>27)+(b&h|j&(b|h))|0)-1894007588|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+20>>2]^c[f>>2]^c[f+40>>2]^c[f+32>>2];m=l<<1|l>>>31;c[f+32>>2]=m;j=j+((((k<<5|k>>>27)+(a&b|h&(a|b))|0)-1894007588|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+24>>2]^c[f+4>>2]^c[f+44>>2]^c[f+36>>2];m=l<<1|l>>>31;c[f+36>>2]=m;h=h+((((j<<5|j>>>27)+(k&a|b&(k|a))|0)-1894007588|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+28>>2]^c[f+8>>2]^c[f+48>>2]^c[f+40>>2];m=l<<1|l>>>31;c[f+40>>2]=m;b=b+((((h<<5|h>>>27)+(j&k|a&(j|k))|0)-1894007588|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+32>>2]^c[f+12>>2]^c[f+52>>2]^c[f+44>>2];m=l<<1|l>>>31;c[f+44>>2]=m;a=a+((((b<<5|b>>>27)+(h&j|k&(h|j))|0)-1894007588|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+36>>2]^c[f+16>>2]^c[f+56>>2]^c[f+48>>2];m=l<<1|l>>>31;c[f+48>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)-899497514|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+40>>2]^c[f+20>>2]^c[f+60>>2]^c[f+52>>2];m=l<<1|l>>>31;c[f+52>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)-899497514|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+44>>2]^c[f+24>>2]^c[f>>2]^c[f+56>>2];m=l<<1|l>>>31;c[f+56>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)-899497514|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+48>>2]^c[f+28>>2]^c[f+4>>2]^c[f+60>>2];m=l<<1|l>>>31;c[f+60>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)-899497514|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+52>>2]^c[f+32>>2]^c[f+8>>2]^c[f>>2];m=l<<1|l>>>31;c[f>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)-899497514|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+56>>2]^c[f+36>>2]^c[f+12>>2]^c[f+4>>2];m=l<<1|l>>>31;c[f+4>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)-899497514|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+60>>2]^c[f+40>>2]^c[f+16>>2]^c[f+8>>2];m=l<<1|l>>>31;c[f+8>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)-899497514|0)+m|0)|0;a=a<<30|a>>>2;l=c[f>>2]^c[f+44>>2]^c[f+20>>2]^c[f+12>>2];m=l<<1|l>>>31;c[f+12>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)-899497514|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+4>>2]^c[f+48>>2]^c[f+24>>2]^c[f+16>>2];m=l<<1|l>>>31;c[f+16>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)-899497514|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+8>>2]^c[f+52>>2]^c[f+28>>2]^c[f+20>>2];m=l<<1|l>>>31;c[f+20>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)-899497514|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+12>>2]^c[f+56>>2]^c[f+32>>2]^c[f+24>>2];m=l<<1|l>>>31;c[f+24>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)-899497514|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+16>>2]^c[f+60>>2]^c[f+36>>2]^c[f+28>>2];m=l<<1|l>>>31;c[f+28>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)-899497514|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+20>>2]^c[f>>2]^c[f+40>>2]^c[f+32>>2];m=l<<1|l>>>31;c[f+32>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)-899497514|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+24>>2]^c[f+4>>2]^c[f+44>>2]^c[f+36>>2];m=l<<1|l>>>31;c[f+36>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)-899497514|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+28>>2]^c[f+8>>2]^c[f+48>>2]^c[f+40>>2];m=l<<1|l>>>31;c[f+40>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)-899497514|0)+m|0)|0;h=h<<30|h>>>2;l=c[f+32>>2]^c[f+12>>2]^c[f+52>>2]^c[f+44>>2];m=l<<1|l>>>31;c[f+44>>2]=m;k=k+((((a<<5|a>>>27)+(b^h^j)|0)-899497514|0)+m|0)|0;b=b<<30|b>>>2;l=c[f+36>>2]^c[f+16>>2]^c[f+56>>2]^c[f+48>>2];m=l<<1|l>>>31;c[f+48>>2]=m;j=j+((((k<<5|k>>>27)+(a^b^h)|0)-899497514|0)+m|0)|0;a=a<<30|a>>>2;l=c[f+40>>2]^c[f+20>>2]^c[f+60>>2]^c[f+52>>2];m=l<<1|l>>>31;c[f+52>>2]=m;h=h+((((j<<5|j>>>27)+(k^a^b)|0)-899497514|0)+m|0)|0;k=k<<30|k>>>2;l=c[f+44>>2]^c[f+24>>2]^c[f>>2]^c[f+56>>2];m=l<<1|l>>>31;c[f+56>>2]=m;b=b+((((h<<5|h>>>27)+(j^k^a)|0)-899497514|0)+m|0)|0;j=j<<30|j>>>2;l=c[f+48>>2]^c[f+28>>2]^c[f+4>>2]^c[f+60>>2];m=l<<1|l>>>31;c[f+60>>2]=m;a=a+((((b<<5|b>>>27)+(h^j^k)|0)-899497514|0)+m|0)|0;h=h<<30|h>>>2;m=g+8|0;c[m>>2]=(c[m>>2]|0)+a|0;a=(g+8|0)+4|0;c[a>>2]=(c[a>>2]|0)+b|0;b=(g+8|0)+8|0;c[b>>2]=(c[b>>2]|0)+h|0;h=(g+8|0)+12|0;c[h>>2]=(c[h>>2]|0)+j|0;j=(g+8|0)+16|0;c[j>>2]=(c[j>>2]|0)+k|0;i=e;return}function ul(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;h=b;b=e;e=f;f=g;if((f|0)==0){i=0;j=i;return j|0}g=(f<<3>>>0)/6>>>0;k=(f<<3)-(g*6&-1)|0;if((k|0)==2){g=g+3|0}else if((k|0)==4){g=g+2|0}if((c[b>>2]|0)>>>0<(g+1|0)>>>0){c[b>>2]=g+1|0;i=-42;j=i;return j|0}g=((f>>>0)/3>>>0)*3&-1;k=0;l=h;while(1){if(k>>>0>=g>>>0){break}m=e;e=m+1|0;n=d[m]|0;m=e;e=m+1|0;o=d[m]|0;m=e;e=m+1|0;p=d[m]|0;m=l;l=m+1|0;a[m]=a[3936+(n>>2&63)|0]|0;m=l;l=m+1|0;a[m]=a[3936+(((n&3)<<4)+(o>>4)&63)|0]|0;m=l;l=m+1|0;a[m]=a[3936+(((o&15)<<2)+(p>>6)&63)|0]|0;m=l;l=m+1|0;a[m]=a[3936+(p&63)|0]|0;k=k+3|0}if(k>>>0<f>>>0){g=e;e=g+1|0;n=d[g]|0;if((k+1|0)>>>0<f>>>0){g=e;e=g+1|0;q=d[g]|0}else{q=0}o=q;q=l;l=q+1|0;a[q]=a[3936+(n>>2&63)|0]|0;q=l;l=q+1|0;a[q]=a[3936+(((n&3)<<4)+(o>>4)&63)|0]|0;if((k+1|0)>>>0<f>>>0){f=l;l=f+1|0;a[f]=a[3936+((o&15)<<2&63)|0]|0}else{o=l;l=o+1|0;a[o]=61}o=l;l=o+1|0;a[o]=61}c[b>>2]=l-h|0;a[l]=0;i=0;j=i;return j|0}function um(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;h=b;b=e;e=f;f=g;g=0;i=0;j=0;L1123:while(1){if(j>>>0>=f>>>0){k=988;break}do{if((f-j|0)>>>0>=2){if((d[e+j|0]|0|0)!=13){k=975;break}if((d[e+(j+1|0)|0]|0|0)!=10){k=975;break}break}else{k=975}}while(0);do{if((k|0)==975){k=0;if((d[e+j|0]|0|0)==10){break}if((d[e+j|0]|0|0)==61){l=i+1|0;i=l;if(l>>>0>2){k=979;break L1123}}if((d[e+j|0]|0|0)>127){k=982;break L1123}if((d[4e3+(d[e+j|0]|0)|0]|0|0)==127){k=982;break L1123}if((d[4e3+(d[e+j|0]|0)|0]|0|0)<64){if((i|0)!=0){k=985;break L1123}}g=g+1|0}}while(0);j=j+1|0}if((k|0)==988){if((g|0)==0){m=0;n=m;return n|0}g=((g*6&-1)+7|0)>>>3;if((c[b>>2]|0)>>>0<g>>>0){c[b>>2]=g;m=-42;n=m;return n|0}i=3;f=0;g=0;l=h;while(1){if(j>>>0<=0){break}do{if((d[e]|0|0)==13){k=996}else{if((d[e]|0|0)==10){k=996;break}i=i-((d[4e3+(d[e]|0)|0]|0|0)==64&1)|0;f=f<<6|a[4e3+(d[e]|0)|0]&63;o=g+1|0;g=o;if((o|0)==4){g=0;if(i>>>0>0){o=l;l=o+1|0;a[o]=f>>>16&255}if(i>>>0>1){o=l;l=o+1|0;a[o]=f>>>8&255}if(i>>>0>2){o=l;l=o+1|0;a[o]=f&255}}break}}while(0);if((k|0)==996){k=0}j=j-1|0;e=e+1|0}c[b>>2]=l-h|0;m=0;n=m;return n|0}else if((k|0)==979){m=-44;n=m;return n|0}else if((k|0)==982){m=-44;n=m;return n|0}else if((k|0)==985){m=-44;n=m;return n|0}return 0}function un(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=b;b=d;if(b>>>0<=0){return}d=c[e>>2]&63;f=64-d|0;g=e|0;c[g>>2]=(c[g>>2]|0)+b|0;g=e|0;c[g>>2]=c[g>>2]|0;if((c[e>>2]|0)>>>0<b>>>0){g=(e|0)+4|0;c[g>>2]=(c[g>>2]|0)+1|0}do{if((d|0)!=0){if(!(b>>>0>=f>>>0)){break}uK((e+28|0)+d|0,a|0,f);uk(e,e+28|0);a=a+f|0;b=b-f|0;d=0}}while(0);while(1){if(!(b>>>0>=64)){break}uk(e,a);a=a+64|0;b=b-64|0}if(b>>>0<=0){return}uK((e+28|0)+d|0,a|0,b);return}function uo(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+8|0;f=e|0;g=b;b=d;d=(c[g>>2]|0)>>>29|c[(g|0)+4>>2]<<3;h=c[g>>2]<<3;a[f|0]=d>>>24&255;a[f+1|0]=d>>>16&255;a[f+2|0]=d>>>8&255;a[f+3|0]=d&255;a[f+4|0]=h>>>24&255;a[f+5|0]=h>>>16&255;a[f+6|0]=h>>>8&255;a[f+7|0]=h&255;h=c[g>>2]&63;if(h>>>0<56){j=56-h|0}else{j=120-h|0}un(g,704,j);un(g,f|0,8);a[b|0]=(c[g+8>>2]|0)>>>24&255;a[b+1|0]=(c[g+8>>2]|0)>>>16&255;a[b+2|0]=(c[g+8>>2]|0)>>>8&255;a[b+3|0]=c[g+8>>2]&255;a[b+4|0]=(c[(g+8|0)+4>>2]|0)>>>24&255;a[b+5|0]=(c[(g+8|0)+4>>2]|0)>>>16&255;a[b+6|0]=(c[(g+8|0)+4>>2]|0)>>>8&255;a[b+7|0]=c[(g+8|0)+4>>2]&255;a[b+8|0]=(c[(g+8|0)+8>>2]|0)>>>24&255;a[b+9|0]=(c[(g+8|0)+8>>2]|0)>>>16&255;a[b+10|0]=(c[(g+8|0)+8>>2]|0)>>>8&255;a[b+11|0]=c[(g+8|0)+8>>2]&255;a[b+12|0]=(c[(g+8|0)+12>>2]|0)>>>24&255;a[b+13|0]=(c[(g+8|0)+12>>2]|0)>>>16&255;a[b+14|0]=(c[(g+8|0)+12>>2]|0)>>>8&255;a[b+15|0]=c[(g+8|0)+12>>2]&255;a[b+16|0]=(c[(g+8|0)+16>>2]|0)>>>24&255;a[b+17|0]=(c[(g+8|0)+16>>2]|0)>>>16&255;a[b+18|0]=(c[(g+8|0)+16>>2]|0)>>>8&255;a[b+19|0]=c[(g+8|0)+16>>2]&255;i=e;return}function up(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;i=i+224|0;e=d|0;ui(e);un(e,a,b);uo(e,c);uI(e|0,0,220);i=d;return}function uq(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;b=a;if(b>>>0<=244){if(b>>>0<11){d=16}else{d=(b+4|0)+7&-8}e=d;d=e>>>3;a=(c[2348]|0)>>>(d>>>0);if((a&3|0)!=0){d=d+((a^-1)&1)|0;f=9432+(d<<1<<2)|0;g=c[f+8>>2]|0;h=c[g+8>>2]|0;if((f|0)==(h|0)){c[2348]=c[2348]&(1<<d^-1)}else{if(h>>>0>=(c[2352]|0)>>>0){i=(c[h+12>>2]|0)==(g|0)}else{i=0}if((i&1|0)==0){aD();return 0;return 0}c[h+12>>2]=f;c[f+8>>2]=h}c[g+4>>2]=d<<3|1|2;h=(g+(d<<3)|0)+4|0;c[h>>2]=c[h>>2]|1;j=g+8|0;k=j;return k|0}do{if(e>>>0>(c[2350]|0)>>>0){if((a|0)==0){do{if((c[2349]|0)!=0){g=ur(9392,e)|0;j=g;if((g|0)==0){break}k=j;return k|0}}while(0);break}g=a<<d&(1<<d<<1|-(1<<d<<1));h=(g&-g)-1|0;g=h>>>12&16;f=g;h=h>>>(g>>>0);i=h>>>5&8;g=i;f=f+i|0;h=h>>>(g>>>0);i=h>>>2&4;g=i;f=f+i|0;h=h>>>(g>>>0);i=h>>>1&2;g=i;f=f+i|0;h=h>>>(g>>>0);i=h>>>1&1;g=i;f=f+i|0;h=h>>>(g>>>0);g=f+h|0;h=9432+(g<<1<<2)|0;f=c[h+8>>2]|0;i=c[f+8>>2]|0;if((h|0)==(i|0)){c[2348]=c[2348]&(1<<g^-1)}else{if(i>>>0>=(c[2352]|0)>>>0){l=(c[i+12>>2]|0)==(f|0)}else{l=0}if((l&1|0)==0){aD();return 0;return 0}c[i+12>>2]=h;c[h+8>>2]=i}i=(g<<3)-e|0;c[f+4>>2]=e|1|2;g=f+e|0;c[g+4>>2]=i|1;c[g+i>>2]=i;h=c[2350]|0;if((h|0)!=0){m=c[2353]|0;n=h>>>3;h=9432+(n<<1<<2)|0;o=h;if((c[2348]&1<<n|0)!=0){if(((c[h+8>>2]|0)>>>0>=(c[2352]|0)>>>0&1|0)==0){aD();return 0;return 0}o=c[h+8>>2]|0}else{c[2348]=c[2348]|1<<n}c[h+8>>2]=m;c[o+12>>2]=m;c[m+8>>2]=o;c[m+12>>2]=h}c[2350]=i;c[2353]=g;j=f+8|0;k=j;return k|0}}while(0)}else{if(b>>>0>=4294967232){e=-1}else{e=(b+4|0)+7&-8;do{if((c[2349]|0)!=0){b=us(9392,e)|0;j=b;if((b|0)==0){break}k=j;return k|0}}while(0)}}if(e>>>0<=(c[2350]|0)>>>0){b=(c[2350]|0)-e|0;l=c[2353]|0;if(b>>>0>=16){d=l+e|0;c[2353]=d;a=d;c[2350]=b;c[a+4>>2]=b|1;c[a+b>>2]=b;c[l+4>>2]=e|1|2}else{b=c[2350]|0;c[2350]=0;c[2353]=0;c[l+4>>2]=b|1|2;a=(l+b|0)+4|0;c[a>>2]=c[a>>2]|1}j=l+8|0;k=j;return k|0}if(e>>>0<(c[2351]|0)>>>0){l=(c[2351]|0)-e|0;c[2351]=l;a=c[2354]|0;b=a+e|0;c[2354]=b;c[b+4>>2]=l|1;c[a+4>>2]=e|1|2;j=a+8|0;k=j;return k|0}j=ut(9392,e)|0;k=j;return k|0}function ur(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=a;a=b;b=(c[d+4>>2]&-(c[d+4>>2]|0))-1|0;e=b>>>12&16;f=e;b=b>>>(e>>>0);g=b>>>5&8;e=g;f=f+g|0;b=b>>>(e>>>0);g=b>>>2&4;e=g;f=f+g|0;b=b>>>(e>>>0);g=b>>>1&2;e=g;f=f+g|0;b=b>>>(e>>>0);g=b>>>1&1;e=g;f=f+g|0;b=b>>>(e>>>0);e=c[(d+304|0)+(f+b<<2)>>2]|0;b=e;f=e;e=(c[b+4>>2]&-8)-a|0;while(1){if((c[b+16>>2]|0)!=0){h=c[b+16>>2]|0}else{h=c[(b+16|0)+4>>2]|0}b=h;if((h|0)==0){break}g=(c[b+4>>2]&-8)-a|0;if(g>>>0<e>>>0){e=g;f=b}}if((f>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}b=f+a|0;if((f>>>0<b>>>0&1|0)==0){aD();return 0;return 0}h=c[f+24>>2]|0;if((c[f+12>>2]|0)!=(f|0)){g=c[f+8>>2]|0;i=c[f+12>>2]|0;do{if(g>>>0>=(c[d+16>>2]|0)>>>0){if((c[g+12>>2]|0)!=(f|0)){j=0;break}j=(c[i+8>>2]|0)==(f|0)}else{j=0}}while(0);if((j&1|0)==0){aD();return 0;return 0}c[g+12>>2]=i;c[i+8>>2]=g}else{g=(f+16|0)+4|0;j=g;k=c[g>>2]|0;i=k;do{if((k|0)!=0){l=1120}else{g=f+16|0;j=g;m=c[g>>2]|0;i=m;if((m|0)!=0){l=1120;break}else{break}}}while(0);if((l|0)==1120){while(1){l=(i+16|0)+4|0;k=l;if((c[l>>2]|0)!=0){n=1}else{l=i+16|0;k=l;n=(c[l>>2]|0)!=0}if(!n){break}l=k;j=l;i=c[l>>2]|0}if((j>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[j>>2]=0}}if((h|0)!=0){j=(d+304|0)+(c[f+28>>2]<<2)|0;if((f|0)==(c[j>>2]|0)){n=i;c[j>>2]=n;if((n|0)==0){n=d+4|0;c[n>>2]=c[n>>2]&(1<<c[f+28>>2]^-1)}}else{if((h>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}if((c[h+16>>2]|0)==(f|0)){c[h+16>>2]=i}else{c[(h+16|0)+4>>2]=i}}if((i|0)!=0){if((i>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[i+24>>2]=h;h=c[f+16>>2]|0;n=h;if((h|0)!=0){if((n>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[i+16>>2]=n;c[n+24>>2]=i}n=c[(f+16|0)+4>>2]|0;h=n;if((n|0)!=0){if((h>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[(i+16|0)+4>>2]=h;c[h+24>>2]=i}}}if(e>>>0<16){c[f+4>>2]=e+a|1|2;i=(f+(e+a|0)|0)+4|0;c[i>>2]=c[i>>2]|1;o=f;p=o;q=p+8|0;return q|0}c[f+4>>2]=a|1|2;c[b+4>>2]=e|1;c[b+e>>2]=e;a=c[d+8>>2]|0;if((a|0)!=0){i=c[d+20>>2]|0;h=a>>>3;a=(d+40|0)+(h<<1<<2)|0;n=a;if((c[d>>2]&1<<h|0)!=0){if(((c[a+8>>2]|0)>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}n=c[a+8>>2]|0}else{j=d|0;c[j>>2]=c[j>>2]|1<<h}c[a+8>>2]=i;c[n+12>>2]=i;c[i+8>>2]=n;c[i+12>>2]=a}c[d+8>>2]=e;c[d+20>>2]=b;o=f;p=o;q=p+8|0;return q|0}function us(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=a;a=b;b=0;e=-a|0;f=a>>>8;if((f|0)==0){g=0}else{if(f>>>0>65535){g=31}else{h=f;f=(h-256|0)>>>16&8;i=h<<f;h=i;j=(i-4096|0)>>>16&4;f=f+j|0;i=h<<j;h=i;k=(i-16384|0)>>>16&2;j=k;f=f+k|0;k=h<<j;h=k;j=(14-f|0)+(k>>>15)|0;g=(j<<1)+(a>>>((j+7|0)>>>0)&1)|0}}j=c[(d+304|0)+(g<<2)>>2]|0;k=j;if((j|0)!=0){if((g|0)==31){l=0}else{l=31-(((g>>>1)+8|0)-2|0)|0}j=a<<l;l=0;while(1){f=(c[k+4>>2]&-8)-a|0;if(f>>>0<e>>>0){b=k;h=f;e=h;if((h|0)==0){m=1189;break}}h=c[(k+16|0)+4>>2]|0;k=c[(k+16|0)+((j>>>31&1)<<2)>>2]|0;do{if((h|0)!=0){if((h|0)==(k|0)){break}l=h}}while(0);if((k|0)==0){m=1195;break}j=j<<1}if((m|0)!=1189)if((m|0)==1195){k=l}}do{if((k|0)==0){if((b|0)!=0){break}l=(1<<g<<1|-(1<<g<<1))&c[d+4>>2];if((l|0)!=0){j=(l&-l)-1|0;l=j>>>12&16;h=l;j=j>>>(l>>>0);f=j>>>5&8;l=f;h=h+f|0;j=j>>>(l>>>0);f=j>>>2&4;l=f;h=h+f|0;j=j>>>(l>>>0);f=j>>>1&2;l=f;h=h+f|0;j=j>>>(l>>>0);f=j>>>1&1;l=f;h=h+f|0;j=j>>>(l>>>0);k=c[(d+304|0)+(h+j<<2)>>2]|0}}}while(0);while(1){if((k|0)==0){break}g=(c[k+4>>2]&-8)-a|0;if(g>>>0<e>>>0){e=g;b=k}if((c[k+16>>2]|0)!=0){n=c[k+16>>2]|0}else{n=c[(k+16|0)+4>>2]|0}k=n}do{if((b|0)!=0){if(e>>>0>=((c[d+8>>2]|0)-a|0)>>>0){break}if((b>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}n=b+a|0;if((b>>>0<n>>>0&1|0)==0){aD();return 0;return 0}k=c[b+24>>2]|0;if((c[b+12>>2]|0)!=(b|0)){g=c[b+8>>2]|0;o=c[b+12>>2]|0;do{if(g>>>0>=(c[d+16>>2]|0)>>>0){if((c[g+12>>2]|0)!=(b|0)){p=0;break}p=(c[o+8>>2]|0)==(b|0)}else{p=0}}while(0);if((p&1|0)==0){aD();return 0;return 0}c[g+12>>2]=o;c[o+8>>2]=g}else{j=(b+16|0)+4|0;h=j;l=c[j>>2]|0;o=l;do{if((l|0)!=0){m=1225}else{j=b+16|0;h=j;f=c[j>>2]|0;o=f;if((f|0)!=0){m=1225;break}else{break}}}while(0);if((m|0)==1225){while(1){l=(o+16|0)+4|0;g=l;if((c[l>>2]|0)!=0){q=1}else{l=o+16|0;g=l;q=(c[l>>2]|0)!=0}if(!q){break}l=g;h=l;o=c[l>>2]|0}if((h>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[h>>2]=0}}if((k|0)!=0){l=(d+304|0)+(c[b+28>>2]<<2)|0;if((b|0)==(c[l>>2]|0)){g=o;c[l>>2]=g;if((g|0)==0){g=d+4|0;c[g>>2]=c[g>>2]&(1<<c[b+28>>2]^-1)}}else{if((k>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}if((c[k+16>>2]|0)==(b|0)){c[k+16>>2]=o}else{c[(k+16|0)+4>>2]=o}}if((o|0)!=0){if((o>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[o+24>>2]=k;g=c[b+16>>2]|0;l=g;if((g|0)!=0){if((l>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[o+16>>2]=l;c[l+24>>2]=o}l=c[(b+16|0)+4>>2]|0;g=l;if((l|0)!=0){if((g>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[(o+16|0)+4>>2]=g;c[g+24>>2]=o}}}if(e>>>0<16){c[b+4>>2]=e+a|1|2;g=(b+(e+a|0)|0)+4|0;c[g>>2]=c[g>>2]|1}else{c[b+4>>2]=a|1|2;c[n+4>>2]=e|1;c[n+e>>2]=e;if(e>>>3>>>0<32){g=e>>>3;l=(d+40|0)+(g<<1<<2)|0;f=l;if((c[d>>2]&1<<g|0)!=0){if(((c[l+8>>2]|0)>>>0>=(c[d+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}f=c[l+8>>2]|0}else{j=d|0;c[j>>2]=c[j>>2]|1<<g}c[l+8>>2]=n;c[f+12>>2]=n;c[n+8>>2]=f;c[n+12>>2]=l}else{l=n;f=e>>>8;if((f|0)==0){r=0}else{if(f>>>0>65535){r=31}else{g=f;f=(g-256|0)>>>16&8;j=g<<f;g=j;i=(j-4096|0)>>>16&4;f=f+i|0;j=g<<i;g=j;s=(j-16384|0)>>>16&2;i=s;f=f+s|0;s=g<<i;g=s;i=(14-f|0)+(s>>>15)|0;r=(i<<1)+(e>>>((i+7|0)>>>0)&1)|0}}i=(d+304|0)+(r<<2)|0;c[l+28>>2]=r;c[(l+16|0)+4>>2]=0;c[l+16>>2]=0;if((c[d+4>>2]&1<<r|0)!=0){s=c[i>>2]|0;if((r|0)==31){t=0}else{t=31-(((r>>>1)+8|0)-2|0)|0}f=e<<t;while(1){if((c[s+4>>2]&-8|0)==(e|0)){m=1292;break}u=(s+16|0)+((f>>>31&1)<<2)|0;f=f<<1;if((c[u>>2]|0)==0){m=1288;break}s=c[u>>2]|0}do{if((m|0)==1288){if((u>>>0>=(c[d+16>>2]|0)>>>0&1|0)!=0){c[u>>2]=l;c[l+24>>2]=s;f=l;c[l+12>>2]=f;c[l+8>>2]=f;break}else{aD();return 0;return 0}}else if((m|0)==1292){f=c[s+8>>2]|0;if(s>>>0>=(c[d+16>>2]|0)>>>0){v=f>>>0>=(c[d+16>>2]|0)>>>0}else{v=0}if((v&1|0)!=0){n=l;c[f+12>>2]=n;c[s+8>>2]=n;c[l+8>>2]=f;c[l+12>>2]=s;c[l+24>>2]=0;break}else{aD();return 0;return 0}}}while(0)}else{s=d+4|0;c[s>>2]=c[s>>2]|1<<r;c[i>>2]=l;c[l+24>>2]=i;s=l;c[l+12>>2]=s;c[l+8>>2]=s}}}w=b+8|0;x=w;return x|0}}while(0);w=0;x=w;return x|0}function ut(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;d=a;a=b;b=-1;e=0;f=0;if((c[248]|0)!=0){g=1}else{g=(uz()|0)!=0}do{if((c[d+444>>2]&0|0)!=0){if(!(a>>>0>=(c[251]|0)>>>0)){break}if((c[d+12>>2]|0)==0){break}g=uE(d,a)|0;if((g|0)==0){break}h=g;i=h;return i|0}}while(0);g=(a+48|0)+((c[250]|0)-1|0)&((c[250]|0)-1^-1);if(g>>>0<=a>>>0){h=0;i=h;return i|0}L1591:do{if((c[d+440>>2]|0)!=0){j=(c[d+432>>2]|0)+g|0;do{if(!(j>>>0<=(c[d+432>>2]|0)>>>0)){if(j>>>0>(c[d+440>>2]|0)>>>0){break}break L1591}}while(0);h=0;i=h;return i|0}}while(0);if((c[d+444>>2]&4|0)==0){j=-1;k=g;if((c[d+24>>2]|0)==0){l=0}else{l=uC(d,c[d+24>>2]|0)|0}m=l;if((m|0)==0){l=bd(0)|0;if((l|0)!=-1){if((l&(c[249]|0)-1|0)!=0){k=k+((l+((c[249]|0)-1|0)&((c[249]|0)-1^-1))-l|0)|0}n=(c[d+432>>2]|0)+k|0;do{if(k>>>0>a>>>0){if(k>>>0>=2147483647){break}if((c[d+440>>2]|0)!=0){if(n>>>0<=(c[d+432>>2]|0)>>>0){break}if(!(n>>>0<=(c[d+440>>2]|0)>>>0)){break}}o=bd(k|0)|0;j=o;if((o|0)!=(l|0)){break}b=l;e=k}}while(0)}}else{k=((a-(c[d+12>>2]|0)|0)+48|0)+((c[250]|0)-1|0)&((c[250]|0)-1^-1);do{if(k>>>0<2147483647){l=bd(k|0)|0;j=l;if((l|0)!=((c[m>>2]|0)+(c[m+4>>2]|0)|0)){break}b=j;e=k}}while(0)}if((b|0)==-1){if((j|0)!=-1){do{if(k>>>0<2147483647){if(k>>>0>=(a+48|0)>>>0){break}m=((a+48|0)-k|0)+((c[250]|0)-1|0)&((c[250]|0)-1^-1);if(m>>>0<2147483647){if((bd(m|0)|0)!=-1){k=k+m|0}else{m=-k|0;bd(m|0);j=-1}}}}while(0)}if((j|0)!=-1){b=j;e=k}else{k=d+444|0;c[k>>2]=c[k>>2]|4}}}if((b|0)==-1){if(g>>>0<2147483647){k=-1;j=-1;k=bd(g|0)|0;j=bd(0)|0;do{if((k|0)!=-1){if((j|0)==-1){break}if(k>>>0>=j>>>0){break}g=j-k|0;if(g>>>0>(a+40|0)>>>0){b=k;e=g}}}while(0)}}do{if((b|0)!=-1){k=d+432|0;j=(c[k>>2]|0)+e|0;c[k>>2]=j;if(j>>>0>(c[d+436>>2]|0)>>>0){c[d+436>>2]=c[d+432>>2]|0}if((c[d+24>>2]|0)!=0){j=d+448|0;while(1){if((j|0)!=0){p=(b|0)!=((c[j>>2]|0)+(c[j+4>>2]|0)|0)}else{p=0}if(!p){break}j=c[j+8>>2]|0}do{if((j|0)!=0){if((c[j+12>>2]&8|0)!=0){q=1394;break}if((c[j+12>>2]&0|0)!=(f|0)){q=1394;break}if(!((c[d+24>>2]|0)>>>0>=(c[j>>2]|0)>>>0)){q=1394;break}if((c[d+24>>2]|0)>>>0>=((c[j>>2]|0)+(c[j+4>>2]|0)|0)>>>0){q=1394;break}k=j+4|0;c[k>>2]=(c[k>>2]|0)+e|0;uD(d,c[d+24>>2]|0,(c[d+12>>2]|0)+e|0);break}else{q=1394}}while(0);if((q|0)==1394){if(b>>>0<(c[d+16>>2]|0)>>>0){c[d+16>>2]=b}j=d+448|0;while(1){if((j|0)!=0){r=(c[j>>2]|0)!=(b+e|0)}else{r=0}if(!r){break}j=c[j+8>>2]|0}do{if((j|0)!=0){if((c[j+12>>2]&8|0)!=0){break}if((c[j+12>>2]&0|0)!=(f|0)){break}k=c[j>>2]|0;c[j>>2]=b;g=j+4|0;c[g>>2]=(c[g>>2]|0)+e|0;h=uG(d,b,k,a)|0;i=h;return i|0}}while(0);uH(d,b,e,f)}}else{do{if((c[d+16>>2]|0)==0){q=1378}else{if(b>>>0<(c[d+16>>2]|0)>>>0){q=1378;break}else{break}}}while(0);if((q|0)==1378){c[d+16>>2]=b}c[d+448>>2]=b;c[(d+448|0)+4>>2]=e;c[(d+448|0)+12>>2]=f;c[d+36>>2]=c[248]|0;c[d+32>>2]=-1;uF(d);if((d|0)==9392){uD(d,b,e-40|0)}else{j=(d-8|0)+(c[(d-8|0)+4>>2]&-8)|0;uD(d,j,((b+e|0)-j|0)-40|0)}}if(a>>>0>=(c[d+12>>2]|0)>>>0){break}j=d+12|0;k=(c[j>>2]|0)-a|0;c[j>>2]=k;j=c[d+24>>2]|0;g=j+a|0;c[d+24>>2]=g;c[g+4>>2]=k|1;c[j+4>>2]=a|1|2;h=j+8|0;i=h;return i|0}}while(0);c[bc()>>2]=12;h=0;i=h;return i|0}function uu(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=a;if((b|0)==0){return}a=b-8|0;if(a>>>0>=(c[2352]|0)>>>0){d=(c[a+4>>2]&3|0)!=1}else{d=0}L1728:do{if((d&1|0)!=0){b=c[a+4>>2]&-8;e=a+b|0;L1730:do{if((c[a+4>>2]&1|0)!=0){f=1504}else{g=c[a>>2]|0;if((c[a+4>>2]&3|0)==0){b=b+(g+16|0)|0;break}h=a+(-g|0)|0;b=b+g|0;a=h;if((h>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}do{if((a|0)!=(c[2353]|0)){if(g>>>3>>>0<32){h=c[a+8>>2]|0;i=c[a+12>>2]|0;j=g>>>3;if((h|0)==(9432+(j<<1<<2)|0)){k=1}else{if(h>>>0>=(c[2352]|0)>>>0){l=(c[h+12>>2]|0)==(a|0)}else{l=0}k=l}if((k&1|0)==0){aD()}if((i|0)==(h|0)){c[2348]=c[2348]&(1<<j^-1)}else{if((i|0)==(9432+(j<<1<<2)|0)){m=1}else{if(i>>>0>=(c[2352]|0)>>>0){n=(c[i+8>>2]|0)==(a|0)}else{n=0}m=n}if((m&1|0)==0){aD()}c[h+12>>2]=i;c[i+8>>2]=h}}else{h=a;i=c[h+24>>2]|0;if((c[h+12>>2]|0)!=(h|0)){j=c[h+8>>2]|0;o=c[h+12>>2]|0;do{if(j>>>0>=(c[2352]|0)>>>0){if((c[j+12>>2]|0)!=(h|0)){p=0;break}p=(c[o+8>>2]|0)==(h|0)}else{p=0}}while(0);if((p&1|0)==0){aD()}c[j+12>>2]=o;c[o+8>>2]=j}else{q=(h+16|0)+4|0;r=q;s=c[q>>2]|0;o=s;do{if((s|0)!=0){f=1457}else{q=h+16|0;r=q;t=c[q>>2]|0;o=t;if((t|0)!=0){f=1457;break}else{break}}}while(0);if((f|0)==1457){while(1){s=(o+16|0)+4|0;j=s;if((c[s>>2]|0)!=0){u=1}else{s=o+16|0;j=s;u=(c[s>>2]|0)!=0}if(!u){break}s=j;r=s;o=c[s>>2]|0}if((r>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[r>>2]=0}}if((i|0)!=0){s=9696+(c[h+28>>2]<<2)|0;if((h|0)==(c[s>>2]|0)){j=o;c[s>>2]=j;if((j|0)==0){c[2349]=c[2349]&(1<<c[h+28>>2]^-1)}}else{if((i>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}if((c[i+16>>2]|0)==(h|0)){c[i+16>>2]=o}else{c[(i+16|0)+4>>2]=o}}if((o|0)!=0){if((o>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[o+24>>2]=i;j=c[h+16>>2]|0;s=j;if((j|0)!=0){if((s>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[o+16>>2]=s;c[s+24>>2]=o}s=c[(h+16|0)+4>>2]|0;j=s;if((s|0)!=0){if((j>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[(o+16|0)+4>>2]=j;c[j+24>>2]=o}}}}}else{if((c[e+4>>2]&3|0)==3){c[2350]=b;j=e+4|0;c[j>>2]=c[j>>2]&-2;c[a+4>>2]=b|1;c[a+b>>2]=b;break L1730}else{break}}}while(0);f=1504;break}}while(0);do{if((f|0)==1504){if(a>>>0<e>>>0){v=(c[e+4>>2]&1|0)!=0}else{v=0}if((v&1|0)==0){break L1728}if((c[e+4>>2]&2|0)!=0){g=e+4|0;c[g>>2]=c[g>>2]&-2;c[a+4>>2]=b|1;c[a+b>>2]=b}else{if((e|0)==(c[2354]|0)){g=(c[2351]|0)+b|0;c[2351]=g;j=g;c[2354]=a;c[a+4>>2]=j|1;if((a|0)==(c[2353]|0)){c[2353]=0;c[2350]=0}if(j>>>0>(c[2355]|0)>>>0){uv(9392,0)}break}if((e|0)==(c[2353]|0)){j=(c[2350]|0)+b|0;c[2350]=j;g=j;c[2353]=a;c[a+4>>2]=g|1;c[a+g>>2]=g;break}g=c[e+4>>2]&-8;b=b+g|0;if(g>>>3>>>0<32){j=c[e+8>>2]|0;s=c[e+12>>2]|0;t=g>>>3;if((j|0)==(9432+(t<<1<<2)|0)){w=1}else{if(j>>>0>=(c[2352]|0)>>>0){x=(c[j+12>>2]|0)==(e|0)}else{x=0}w=x}if((w&1|0)==0){aD()}if((s|0)==(j|0)){c[2348]=c[2348]&(1<<t^-1)}else{if((s|0)==(9432+(t<<1<<2)|0)){y=1}else{if(s>>>0>=(c[2352]|0)>>>0){z=(c[s+8>>2]|0)==(e|0)}else{z=0}y=z}if((y&1|0)==0){aD()}c[j+12>>2]=s;c[s+8>>2]=j}}else{j=e;s=c[j+24>>2]|0;if((c[j+12>>2]|0)!=(j|0)){t=c[j+8>>2]|0;A=c[j+12>>2]|0;do{if(t>>>0>=(c[2352]|0)>>>0){if((c[t+12>>2]|0)!=(j|0)){B=0;break}B=(c[A+8>>2]|0)==(j|0)}else{B=0}}while(0);if((B&1|0)==0){aD()}c[t+12>>2]=A;c[A+8>>2]=t}else{g=(j+16|0)+4|0;q=g;C=c[g>>2]|0;A=C;do{if((C|0)!=0){f=1545}else{g=j+16|0;q=g;D=c[g>>2]|0;A=D;if((D|0)!=0){f=1545;break}else{break}}}while(0);if((f|0)==1545){while(1){C=(A+16|0)+4|0;t=C;if((c[C>>2]|0)!=0){E=1}else{C=A+16|0;t=C;E=(c[C>>2]|0)!=0}if(!E){break}C=t;q=C;A=c[C>>2]|0}if((q>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[q>>2]=0}}if((s|0)!=0){C=9696+(c[j+28>>2]<<2)|0;if((j|0)==(c[C>>2]|0)){t=A;c[C>>2]=t;if((t|0)==0){c[2349]=c[2349]&(1<<c[j+28>>2]^-1)}}else{if((s>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}if((c[s+16>>2]|0)==(j|0)){c[s+16>>2]=A}else{c[(s+16|0)+4>>2]=A}}if((A|0)!=0){if((A>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[A+24>>2]=s;t=c[j+16>>2]|0;C=t;if((t|0)!=0){if((C>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[A+16>>2]=C;c[C+24>>2]=A}C=c[(j+16|0)+4>>2]|0;t=C;if((C|0)!=0){if((t>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}c[(A+16|0)+4>>2]=t;c[t+24>>2]=A}}}}c[a+4>>2]=b|1;c[a+b>>2]=b;if((a|0)==(c[2353]|0)){c[2350]=b;break}}if(b>>>3>>>0<32){t=b>>>3;C=9432+(t<<1<<2)|0;D=C;if((c[2348]&1<<t|0)!=0){if(((c[C+8>>2]|0)>>>0>=(c[2352]|0)>>>0&1|0)==0){aD()}D=c[C+8>>2]|0}else{c[2348]=c[2348]|1<<t}c[C+8>>2]=a;c[D+12>>2]=a;c[a+8>>2]=D;c[a+12>>2]=C}else{C=a;D=b>>>8;if((D|0)==0){F=0}else{if(D>>>0>65535){F=31}else{t=D;D=(t-256|0)>>>16&8;g=t<<D;t=g;G=(g-4096|0)>>>16&4;D=D+G|0;g=t<<G;t=g;H=(g-16384|0)>>>16&2;G=H;D=D+H|0;H=t<<G;t=H;G=(14-D|0)+(H>>>15)|0;F=(G<<1)+(b>>>((G+7|0)>>>0)&1)|0}}G=9696+(F<<2)|0;c[C+28>>2]=F;c[(C+16|0)+4>>2]=0;c[C+16>>2]=0;if((c[2349]&1<<F|0)!=0){H=c[G>>2]|0;if((F|0)==31){I=0}else{I=31-(((F>>>1)+8|0)-2|0)|0}D=b<<I;while(1){if((c[H+4>>2]&-8|0)==(b|0)){f=1617;break}J=(H+16|0)+((D>>>31&1)<<2)|0;D=D<<1;if((c[J>>2]|0)==0){f=1613;break}H=c[J>>2]|0}do{if((f|0)==1613){if((J>>>0>=(c[2352]|0)>>>0&1|0)!=0){c[J>>2]=C;c[C+24>>2]=H;D=C;c[C+12>>2]=D;c[C+8>>2]=D;break}else{aD()}}else if((f|0)==1617){D=c[H+8>>2]|0;if(H>>>0>=(c[2352]|0)>>>0){K=D>>>0>=(c[2352]|0)>>>0}else{K=0}if((K&1|0)!=0){j=C;c[D+12>>2]=j;c[H+8>>2]=j;c[C+8>>2]=D;c[C+12>>2]=H;c[C+24>>2]=0;break}else{aD()}}}while(0)}else{c[2349]=c[2349]|1<<F;c[G>>2]=C;c[C+24>>2]=G;H=C;c[C+12>>2]=H;c[C+8>>2]=H}H=(c[2356]|0)-1|0;c[2356]=H;if((H|0)==0){ux(9392)}}}}while(0);return}}while(0);aD()}function uv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;a=b;b=0;if((c[248]|0)!=0){e=1}else{e=(uz()|0)!=0}if(a>>>0>=4294967232){f=b;g=(f|0)!=0;h=g?1:0;return h|0}if((c[d+24>>2]|0)==0){f=b;g=(f|0)!=0;h=g?1:0;return h|0}a=a+40|0;if((c[d+12>>2]|0)>>>0>a>>>0){e=c[250]|0;i=ab((((((c[d+12>>2]|0)-a|0)+(e-1|0)|0)>>>0)/(e>>>0)>>>0)-1|0,e);a=uC(d,c[d+24>>2]|0)|0;if((c[a+12>>2]&8|0)==0){if((c[a+12>>2]&0|0)==0){if(i>>>0>=2147483647){i=-2147483648-e|0}e=bd(0)|0;if((e|0)==((c[a>>2]|0)+(c[a+4>>2]|0)|0)){j=bd(-i|0)|0;i=bd(0)|0;do{if((j|0)!=-1){if(i>>>0>=e>>>0){break}b=e-i|0}}while(0)}}}if((b|0)!=0){i=a+4|0;c[i>>2]=(c[i>>2]|0)-b|0;i=d+432|0;c[i>>2]=(c[i>>2]|0)-b|0;uD(d,c[d+24>>2]|0,(c[d+12>>2]|0)-b|0)}}do{if((b|0)==0){if((c[d+12>>2]|0)>>>0<=(c[d+28>>2]|0)>>>0){break}c[d+28>>2]=-1}}while(0);f=b;g=(f|0)!=0;h=g?1:0;return h|0}function uw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;b=0;if((d|0)==0){b=uq(a)|0;e=b;return e|0}if(a>>>0>=4294967232){c[bc()>>2]=12}else{if(a>>>0<11){f=16}else{f=(a+4|0)+7&-8}g=d-8|0;h=uy(9392,g,f,1)|0;if((h|0)!=0){b=h+8|0}else{b=uq(a)|0;if((b|0)!=0){h=(c[g+4>>2]&-8)-((c[g+4>>2]&3|0)==0?8:4)|0;if(h>>>0<a>>>0){i=h}else{i=a}uK(b|0,d|0,i);uu(d)}}}e=b;return e|0}function ux(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;b=a;a=0;d=0;e=b+448|0;f=c[e+8>>2]|0;L2085:while(1){if((f|0)==0){g=1774;break}h=c[f>>2]|0;i=c[f+4>>2]|0;j=c[f+8>>2]|0;d=d+1|0;do{if((c[f+12>>2]&0|0)!=0){if((c[f+12>>2]&8|0)!=0){break}if((h+8&7|0)==0){k=0}else{k=8-(h+8&7)&7}l=h+k|0;m=c[l+4>>2]&-8;do{if((c[l+4>>2]&3|0)==1){if(!((l+m|0)>>>0>=((h+i|0)-40|0)>>>0)){break}n=l;if((l|0)==(c[b+20>>2]|0)){c[b+20>>2]=0;c[b+8>>2]=0}else{o=c[n+24>>2]|0;if((c[n+12>>2]|0)!=(n|0)){p=c[n+8>>2]|0;q=c[n+12>>2]|0;do{if(p>>>0>=(c[b+16>>2]|0)>>>0){if((c[p+12>>2]|0)!=(n|0)){r=0;break}r=(c[q+8>>2]|0)==(n|0)}else{r=0}}while(0);if((r&1|0)==0){g=1702;break L2085}c[p+12>>2]=q;c[q+8>>2]=p}else{s=(n+16|0)+4|0;t=s;u=c[s>>2]|0;q=u;do{if((u|0)!=0){g=1706}else{s=n+16|0;t=s;v=c[s>>2]|0;q=v;if((v|0)!=0){g=1706;break}else{break}}}while(0);if((g|0)==1706){g=0;while(1){u=(q+16|0)+4|0;p=u;if((c[u>>2]|0)!=0){w=1}else{u=q+16|0;p=u;w=(c[u>>2]|0)!=0}if(!w){break}u=p;t=u;q=c[u>>2]|0}if((t>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1713;break L2085}c[t>>2]=0}}if((o|0)!=0){u=(b+304|0)+(c[n+28>>2]<<2)|0;if((n|0)==(c[u>>2]|0)){p=q;c[u>>2]=p;if((p|0)==0){p=b+4|0;c[p>>2]=c[p>>2]&(1<<c[n+28>>2]^-1)}}else{if((o>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1726;break L2085}if((c[o+16>>2]|0)==(n|0)){c[o+16>>2]=q}else{c[(o+16|0)+4>>2]=q}}if((q|0)!=0){if((q>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1741;break L2085}c[q+24>>2]=o;p=c[n+16>>2]|0;u=p;if((p|0)!=0){if((u>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1733;break L2085}c[q+16>>2]=u;c[u+24>>2]=q}u=c[(n+16|0)+4>>2]|0;p=u;if((u|0)!=0){if((p>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1738;break L2085}c[(q+16|0)+4>>2]=p;c[p+24>>2]=q}}}}p=m>>>8;if((p|0)==0){x=0}else{if(p>>>0>65535){x=31}else{u=p;p=(u-256|0)>>>16&8;v=u<<p;u=v;s=(v-4096|0)>>>16&4;p=p+s|0;v=u<<s;u=v;y=(v-16384|0)>>>16&2;s=y;p=p+y|0;y=u<<s;u=y;s=(14-p|0)+(y>>>15)|0;x=(s<<1)+(m>>>((s+7|0)>>>0)&1)|0}}s=(b+304|0)+(x<<2)|0;c[n+28>>2]=x;c[(n+16|0)+4>>2]=0;c[n+16>>2]=0;if((c[b+4>>2]&1<<x|0)!=0){y=c[s>>2]|0;if((x|0)==31){z=0}else{z=31-(((x>>>1)+8|0)-2|0)|0}p=m<<z;while(1){if((c[y+4>>2]&-8|0)==(m|0)){g=1764;break}A=(y+16|0)+((p>>>31&1)<<2)|0;p=p<<1;if((c[A>>2]|0)==0){g=1760;break}y=c[A>>2]|0}if((g|0)==1764){g=0;p=c[y+8>>2]|0;if(y>>>0>=(c[b+16>>2]|0)>>>0){B=p>>>0>=(c[b+16>>2]|0)>>>0}else{B=0}if((B&1|0)==0){g=1768;break L2085}o=n;c[p+12>>2]=o;c[y+8>>2]=o;c[n+8>>2]=p;c[n+12>>2]=y;c[n+24>>2]=0}else if((g|0)==1760){g=0;if((A>>>0>=(c[b+16>>2]|0)>>>0&1|0)==0){g=1762;break L2085}c[A>>2]=n;c[n+24>>2]=y;p=n;c[n+12>>2]=p;c[n+8>>2]=p}}else{p=b+4|0;c[p>>2]=c[p>>2]|1<<x;c[s>>2]=n;c[n+24>>2]=s;p=n;c[n+12>>2]=p;c[n+8>>2]=p}}}while(0)}}while(0);e=f;f=j}if((g|0)==1768){aD();return 0;return 0}else if((g|0)==1774){if(d>>>0>4294967295){f=d;d=b;e=d+32|0;c[e>>2]=f;x=a;return x|0}else{f=-1;d=b;e=d+32|0;c[e>>2]=f;x=a;return x|0}}else if((g|0)==1726){aD();return 0;return 0}else if((g|0)==1762){aD();return 0;return 0}else if((g|0)==1733){aD();return 0;return 0}else if((g|0)==1702){aD();return 0;return 0}else if((g|0)==1738){aD();return 0;return 0}else if((g|0)==1741){aD();return 0;return 0}else if((g|0)==1713){aD();return 0;return 0}return 0}function uy(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=a;a=b;b=d;d=e;e=0;g=c[a+4>>2]&-8;h=a+g|0;do{if(a>>>0>=(c[f+16>>2]|0)>>>0){if((c[a+4>>2]&3|0)==1){i=0;break}if(a>>>0>=h>>>0){i=0;break}i=(c[h+4>>2]&1|0)!=0}else{i=0}}while(0);if((i&1|0)==0){aD();return 0;return 0}if((c[a+4>>2]&3|0)==0){e=uB(f,a,b,d)|0}else{if(g>>>0>=b>>>0){d=g-b|0;if(d>>>0>=16){i=a+b|0;c[a+4>>2]=c[a+4>>2]&1|b|2;j=(a+b|0)+4|0;c[j>>2]=c[j>>2]|1;c[i+4>>2]=c[i+4>>2]&1|d|2;j=(i+d|0)+4|0;c[j>>2]=c[j>>2]|1;uA(f,i,d)}e=a}else{if((h|0)==(c[f+24>>2]|0)){if((g+(c[f+12>>2]|0)|0)>>>0>b>>>0){d=(g+(c[f+12>>2]|0)|0)-b|0;i=a+b|0;c[a+4>>2]=c[a+4>>2]&1|b|2;j=(a+b|0)+4|0;c[j>>2]=c[j>>2]|1;c[i+4>>2]=d|1;c[f+24>>2]=i;c[f+12>>2]=d;e=a}}else{if((h|0)==(c[f+20>>2]|0)){d=c[f+8>>2]|0;if((g+d|0)>>>0>=b>>>0){i=(g+d|0)-b|0;if(i>>>0>=16){j=a+b|0;c[a+4>>2]=c[a+4>>2]&1|b|2;k=(a+b|0)+4|0;c[k>>2]=c[k>>2]|1;c[j+4>>2]=i|1;c[j+i>>2]=i;k=(j+i|0)+4|0;c[k>>2]=c[k>>2]&-2;c[f+8>>2]=i;c[f+20>>2]=j}else{j=g+d|0;c[a+4>>2]=c[a+4>>2]&1|j|2;d=(a+j|0)+4|0;c[d>>2]=c[d>>2]|1;c[f+8>>2]=0;c[f+20>>2]=0}e=a}}else{if((c[h+4>>2]&2|0)==0){d=c[h+4>>2]&-8;if((g+d|0)>>>0>=b>>>0){j=(g+d|0)-b|0;if(d>>>3>>>0<32){i=c[h+8>>2]|0;k=c[h+12>>2]|0;l=d>>>3;if((i|0)==((f+40|0)+(l<<1<<2)|0)){m=1}else{if(i>>>0>=(c[f+16>>2]|0)>>>0){n=(c[i+12>>2]|0)==(h|0)}else{n=0}m=n}if((m&1|0)==0){aD();return 0;return 0}if((k|0)==(i|0)){m=f|0;c[m>>2]=c[m>>2]&(1<<l^-1)}else{if((k|0)==((f+40|0)+(l<<1<<2)|0)){o=1}else{if(k>>>0>=(c[f+16>>2]|0)>>>0){p=(c[k+8>>2]|0)==(h|0)}else{p=0}o=p}if((o&1|0)==0){aD();return 0;return 0}c[i+12>>2]=k;c[k+8>>2]=i}}else{i=h;h=c[i+24>>2]|0;if((c[i+12>>2]|0)!=(i|0)){k=c[i+8>>2]|0;q=c[i+12>>2]|0;do{if(k>>>0>=(c[f+16>>2]|0)>>>0){if((c[k+12>>2]|0)!=(i|0)){r=0;break}r=(c[q+8>>2]|0)==(i|0)}else{r=0}}while(0);if((r&1|0)==0){aD();return 0;return 0}c[k+12>>2]=q;c[q+8>>2]=k}else{k=(i+16|0)+4|0;r=k;o=c[k>>2]|0;q=o;do{if((o|0)!=0){s=1833}else{k=i+16|0;r=k;p=c[k>>2]|0;q=p;if((p|0)!=0){s=1833;break}else{break}}}while(0);if((s|0)==1833){while(1){s=(q+16|0)+4|0;o=s;if((c[s>>2]|0)!=0){t=1}else{s=q+16|0;o=s;t=(c[s>>2]|0)!=0}if(!t){break}s=o;r=s;q=c[s>>2]|0}if((r>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[r>>2]=0}}if((h|0)!=0){r=(f+304|0)+(c[i+28>>2]<<2)|0;if((i|0)==(c[r>>2]|0)){t=q;c[r>>2]=t;if((t|0)==0){t=f+4|0;c[t>>2]=c[t>>2]&(1<<c[i+28>>2]^-1)}}else{if((h>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}if((c[h+16>>2]|0)==(i|0)){c[h+16>>2]=q}else{c[(h+16|0)+4>>2]=q}}if((q|0)!=0){if((q>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[q+24>>2]=h;h=c[i+16>>2]|0;t=h;if((h|0)!=0){if((t>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[q+16>>2]=t;c[t+24>>2]=q}t=c[(i+16|0)+4>>2]|0;i=t;if((t|0)!=0){if((i>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[(q+16|0)+4>>2]=i;c[i+24>>2]=q}}}}if(j>>>0<16){q=g+d|0;c[a+4>>2]=c[a+4>>2]&1|q|2;d=(a+q|0)+4|0;c[d>>2]=c[d>>2]|1}else{d=a+b|0;c[a+4>>2]=c[a+4>>2]&1|b|2;q=(a+b|0)+4|0;c[q>>2]=c[q>>2]|1;c[d+4>>2]=c[d+4>>2]&1|j|2;q=(d+j|0)+4|0;c[q>>2]=c[q>>2]|1;uA(f,d,j)}e=a}}}}}}return e|0}function uz(){var a=0,b=0;if((c[248]|0)!=0){return 1}a=a$(8)|0;b=a;if((b&b-1|0)!=0){aD();return 0;return 0}if((a&a-1|0)!=0){aD();return 0;return 0}c[250]=b;c[249]=a;c[251]=-1;c[252]=2097152;c[253]=0;c[2459]=c[253]|0;a=be(0)^1431655765;a=a|8;a=a&-8;c[248]=a;return 1}function uA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=a;a=b;b=d;d=a+b|0;if((c[a+4>>2]&1|0)==0){f=c[a>>2]|0;if((c[a+4>>2]&3|0)==0){b=b+(f+16|0)|0;return}g=a+(-f|0)|0;b=b+f|0;a=g;if((g>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}do{if((a|0)!=(c[e+20>>2]|0)){if(f>>>3>>>0<32){g=c[a+8>>2]|0;h=c[a+12>>2]|0;i=f>>>3;if((g|0)==((e+40|0)+(i<<1<<2)|0)){j=1}else{if(g>>>0>=(c[e+16>>2]|0)>>>0){k=(c[g+12>>2]|0)==(a|0)}else{k=0}j=k}if((j&1|0)==0){aD()}if((h|0)==(g|0)){l=e|0;c[l>>2]=c[l>>2]&(1<<i^-1)}else{if((h|0)==((e+40|0)+(i<<1<<2)|0)){m=1}else{if(h>>>0>=(c[e+16>>2]|0)>>>0){n=(c[h+8>>2]|0)==(a|0)}else{n=0}m=n}if((m&1|0)==0){aD()}c[g+12>>2]=h;c[h+8>>2]=g}}else{g=a;h=c[g+24>>2]|0;if((c[g+12>>2]|0)!=(g|0)){i=c[g+8>>2]|0;o=c[g+12>>2]|0;do{if(i>>>0>=(c[e+16>>2]|0)>>>0){if((c[i+12>>2]|0)!=(g|0)){p=0;break}p=(c[o+8>>2]|0)==(g|0)}else{p=0}}while(0);if((p&1|0)==0){aD()}c[i+12>>2]=o;c[o+8>>2]=i}else{l=(g+16|0)+4|0;q=l;r=c[l>>2]|0;o=r;do{if((r|0)!=0){s=1928}else{l=g+16|0;q=l;t=c[l>>2]|0;o=t;if((t|0)!=0){s=1928;break}else{break}}}while(0);if((s|0)==1928){while(1){r=(o+16|0)+4|0;i=r;if((c[r>>2]|0)!=0){u=1}else{r=o+16|0;i=r;u=(c[r>>2]|0)!=0}if(!u){break}r=i;q=r;o=c[r>>2]|0}if((q>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[q>>2]=0}}if((h|0)!=0){r=(e+304|0)+(c[g+28>>2]<<2)|0;if((g|0)==(c[r>>2]|0)){i=o;c[r>>2]=i;if((i|0)==0){i=e+4|0;c[i>>2]=c[i>>2]&(1<<c[g+28>>2]^-1)}}else{if((h>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}if((c[h+16>>2]|0)==(g|0)){c[h+16>>2]=o}else{c[(h+16|0)+4>>2]=o}}if((o|0)!=0){if((o>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[o+24>>2]=h;i=c[g+16>>2]|0;r=i;if((i|0)!=0){if((r>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[o+16>>2]=r;c[r+24>>2]=o}r=c[(g+16|0)+4>>2]|0;i=r;if((r|0)!=0){if((i>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[(o+16|0)+4>>2]=i;c[i+24>>2]=o}}}}}else{if((c[d+4>>2]&3|0)!=3){break}c[e+8>>2]=b;i=d+4|0;c[i>>2]=c[i>>2]&-2;c[a+4>>2]=b|1;c[a+b>>2]=b;return}}while(0)}if((d>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}if((c[d+4>>2]&2|0)!=0){o=d+4|0;c[o>>2]=c[o>>2]&-2;c[a+4>>2]=b|1;c[a+b>>2]=b}else{if((d|0)==(c[e+24>>2]|0)){o=e+12|0;u=(c[o>>2]|0)+b|0;c[o>>2]=u;c[e+24>>2]=a;c[a+4>>2]=u|1;if((a|0)==(c[e+20>>2]|0)){c[e+20>>2]=0;c[e+8>>2]=0}return}if((d|0)==(c[e+20>>2]|0)){u=e+8|0;o=(c[u>>2]|0)+b|0;c[u>>2]=o;u=o;c[e+20>>2]=a;c[a+4>>2]=u|1;c[a+u>>2]=u;return}u=c[d+4>>2]&-8;b=b+u|0;if(u>>>3>>>0<32){o=c[d+8>>2]|0;p=c[d+12>>2]|0;m=u>>>3;if((o|0)==((e+40|0)+(m<<1<<2)|0)){v=1}else{if(o>>>0>=(c[e+16>>2]|0)>>>0){w=(c[o+12>>2]|0)==(d|0)}else{w=0}v=w}if((v&1|0)==0){aD()}if((p|0)==(o|0)){v=e|0;c[v>>2]=c[v>>2]&(1<<m^-1)}else{if((p|0)==((e+40|0)+(m<<1<<2)|0)){x=1}else{if(p>>>0>=(c[e+16>>2]|0)>>>0){y=(c[p+8>>2]|0)==(d|0)}else{y=0}x=y}if((x&1|0)==0){aD()}c[o+12>>2]=p;c[p+8>>2]=o}}else{o=d;d=c[o+24>>2]|0;if((c[o+12>>2]|0)!=(o|0)){p=c[o+8>>2]|0;z=c[o+12>>2]|0;do{if(p>>>0>=(c[e+16>>2]|0)>>>0){if((c[p+12>>2]|0)!=(o|0)){A=0;break}A=(c[z+8>>2]|0)==(o|0)}else{A=0}}while(0);if((A&1|0)==0){aD()}c[p+12>>2]=z;c[z+8>>2]=p}else{p=(o+16|0)+4|0;A=p;x=c[p>>2]|0;z=x;do{if((x|0)!=0){s=2011}else{p=o+16|0;A=p;y=c[p>>2]|0;z=y;if((y|0)!=0){s=2011;break}else{break}}}while(0);if((s|0)==2011){while(1){x=(z+16|0)+4|0;y=x;if((c[x>>2]|0)!=0){B=1}else{x=z+16|0;y=x;B=(c[x>>2]|0)!=0}if(!B){break}x=y;A=x;z=c[x>>2]|0}if((A>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[A>>2]=0}}if((d|0)!=0){A=(e+304|0)+(c[o+28>>2]<<2)|0;if((o|0)==(c[A>>2]|0)){B=z;c[A>>2]=B;if((B|0)==0){B=e+4|0;c[B>>2]=c[B>>2]&(1<<c[o+28>>2]^-1)}}else{if((d>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}if((c[d+16>>2]|0)==(o|0)){c[d+16>>2]=z}else{c[(d+16|0)+4>>2]=z}}if((z|0)!=0){if((z>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[z+24>>2]=d;d=c[o+16>>2]|0;B=d;if((d|0)!=0){if((B>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[z+16>>2]=B;c[B+24>>2]=z}B=c[(o+16|0)+4>>2]|0;o=B;if((B|0)!=0){if((o>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}c[(z+16|0)+4>>2]=o;c[o+24>>2]=z}}}}c[a+4>>2]=b|1;c[a+b>>2]=b;if((a|0)==(c[e+20>>2]|0)){c[e+8>>2]=b;return}}if(b>>>3>>>0<32){z=b>>>3;o=(e+40|0)+(z<<1<<2)|0;B=o;if((c[e>>2]&1<<z|0)!=0){if(((c[o+8>>2]|0)>>>0>=(c[e+16>>2]|0)>>>0&1|0)==0){aD()}B=c[o+8>>2]|0}else{d=e|0;c[d>>2]=c[d>>2]|1<<z}c[o+8>>2]=a;c[B+12>>2]=a;c[a+8>>2]=B;c[a+12>>2]=o}else{o=a;a=b>>>8;if((a|0)==0){C=0}else{if(a>>>0>65535){C=31}else{B=a;a=(B-256|0)>>>16&8;z=B<<a;B=z;d=(z-4096|0)>>>16&4;a=a+d|0;z=B<<d;B=z;A=(z-16384|0)>>>16&2;d=A;a=a+A|0;A=B<<d;B=A;d=(14-a|0)+(A>>>15)|0;C=(d<<1)+(b>>>((d+7|0)>>>0)&1)|0}}d=(e+304|0)+(C<<2)|0;c[o+28>>2]=C;c[(o+16|0)+4>>2]=0;c[o+16>>2]=0;if((c[e+4>>2]&1<<C|0)!=0){A=c[d>>2]|0;if((C|0)==31){D=0}else{D=31-(((C>>>1)+8|0)-2|0)|0}a=b<<D;while(1){if((c[A+4>>2]&-8|0)==(b|0)){s=2083;break}E=(A+16|0)+((a>>>31&1)<<2)|0;a=a<<1;if((c[E>>2]|0)==0){s=2079;break}A=c[E>>2]|0}do{if((s|0)==2083){a=c[A+8>>2]|0;if(A>>>0>=(c[e+16>>2]|0)>>>0){F=a>>>0>=(c[e+16>>2]|0)>>>0}else{F=0}if((F&1|0)!=0){b=o;c[a+12>>2]=b;c[A+8>>2]=b;c[o+8>>2]=a;c[o+12>>2]=A;c[o+24>>2]=0;break}else{aD()}}else if((s|0)==2079){if((E>>>0>=(c[e+16>>2]|0)>>>0&1|0)!=0){c[E>>2]=o;c[o+24>>2]=A;a=o;c[o+12>>2]=a;c[o+8>>2]=a;break}else{aD()}}}while(0)}else{A=e+4|0;c[A>>2]=c[A>>2]|1<<C;c[d>>2]=o;c[o+24>>2]=d;d=o;c[o+12>>2]=d;c[o+8>>2]=d}}return}function uB(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;e=a;a=b;b=d;d=c[a+4>>2]&-8;if(b>>>3>>>0<32){f=0;g=f;return g|0}do{if(d>>>0>=(b+4|0)>>>0){if(!((d-b|0)>>>0<=c[250]<<1>>>0)){break}f=a;g=f;return g|0}}while(0);h=c[a>>2]|0;a=((b+24|0)+7|0)+((c[249]|0)-1|0)&((c[249]|0)-1^-1);b=-1;if((b|0)==-1){f=0;g=f;return g|0}i=b+h|0;j=(a-h|0)-16|0;c[i+4>>2]=j;c[(i+j|0)+4>>2]=7;c[(i+(j+4|0)|0)+4>>2]=0;if(b>>>0<(c[e+16>>2]|0)>>>0){c[e+16>>2]=b}b=e+432|0;j=(c[b>>2]|0)+(a-((d+h|0)+16|0)|0)|0;c[b>>2]=j;if(j>>>0>(c[e+436>>2]|0)>>>0){c[e+436>>2]=c[e+432>>2]|0}f=i;g=f;return g|0}function uC(a,b){a=a|0;b=b|0;var d=0,e=0;d=b;b=a+448|0;while(1){if(d>>>0>=(c[b>>2]|0)>>>0){if(d>>>0<((c[b>>2]|0)+(c[b+4>>2]|0)|0)>>>0){e=2121;break}}a=c[b+8>>2]|0;b=a;if((a|0)==0){e=2123;break}}if((e|0)==2121){d=b;b=d;return b|0}else if((e|0)==2123){d=0;b=d;return b|0}return 0}function uD(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=a;a=b;b=d;if((a+8&7|0)==0){f=0}else{f=8-(a+8&7)&7}d=f;a=a+d|0;b=b-d|0;c[e+24>>2]=a;c[e+12>>2]=b;c[a+4>>2]=b|1;c[(a+b|0)+4>>2]=40;c[e+28>>2]=c[252]|0;return}function uE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=a;a=b;b=((a+24|0)+7|0)+((c[249]|0)-1|0)&((c[249]|0)-1^-1);L2682:do{if((c[d+440>>2]|0)!=0){e=(c[d+432>>2]|0)+b|0;do{if(!(e>>>0<=(c[d+432>>2]|0)>>>0)){if(e>>>0>(c[d+440>>2]|0)>>>0){break}break L2682}}while(0);f=0;g=f;return g|0}}while(0);do{if(b>>>0>a>>>0){e=-1;if((e|0)==-1){break}if((e+8&7|0)==0){h=0}else{h=8-(e+8&7)&7}i=h;j=(b-i|0)-16|0;k=e+i|0;c[k>>2]=i;c[k+4>>2]=j;c[(k+j|0)+4>>2]=7;c[(k+(j+4|0)|0)+4>>2]=0;do{if((c[d+16>>2]|0)==0){l=2144}else{if(e>>>0<(c[d+16>>2]|0)>>>0){l=2144;break}else{break}}}while(0);if((l|0)==2144){c[d+16>>2]=e}j=d+432|0;i=(c[j>>2]|0)+b|0;c[j>>2]=i;if(i>>>0>(c[d+436>>2]|0)>>>0){c[d+436>>2]=c[d+432>>2]|0}f=k+8|0;g=f;return g|0}}while(0);f=0;g=f;return g|0}function uF(a){a=a|0;var b=0,d=0,e=0;b=a;a=0;while(1){if(a>>>0>=32){break}d=(b+40|0)+(a<<1<<2)|0;e=d;c[d+12>>2]=e;c[d+8>>2]=e;a=a+1|0}return}function uG(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=a;a=b;b=d;d=e;if((a+8&7|0)==0){g=0}else{g=8-(a+8&7)&7}e=a+g|0;if((b+8&7|0)==0){h=0}else{h=8-(b+8&7)&7}g=b+h|0;h=e+d|0;b=(g-e|0)-d|0;c[e+4>>2]=d|1|2;if((g|0)==(c[f+24>>2]|0)){d=f+12|0;a=(c[d>>2]|0)+b|0;c[d>>2]=a;c[f+24>>2]=h;c[h+4>>2]=a|1;i=e;j=i;k=j+8|0;return k|0}if((g|0)==(c[f+20>>2]|0)){a=f+8|0;d=(c[a>>2]|0)+b|0;c[a>>2]=d;a=d;c[f+20>>2]=h;c[h+4>>2]=a|1;c[h+a>>2]=a}else{if((c[g+4>>2]&3|0)==1){a=c[g+4>>2]&-8;if(a>>>3>>>0<32){d=c[g+8>>2]|0;l=c[g+12>>2]|0;m=a>>>3;if((d|0)==((f+40|0)+(m<<1<<2)|0)){n=1}else{if(d>>>0>=(c[f+16>>2]|0)>>>0){o=(c[d+12>>2]|0)==(g|0)}else{o=0}n=o}if((n&1|0)==0){aD();return 0;return 0}if((l|0)==(d|0)){n=f|0;c[n>>2]=c[n>>2]&(1<<m^-1)}else{if((l|0)==((f+40|0)+(m<<1<<2)|0)){p=1}else{if(l>>>0>=(c[f+16>>2]|0)>>>0){q=(c[l+8>>2]|0)==(g|0)}else{q=0}p=q}if((p&1|0)==0){aD();return 0;return 0}c[d+12>>2]=l;c[l+8>>2]=d}}else{d=g;l=c[d+24>>2]|0;if((c[d+12>>2]|0)!=(d|0)){p=c[d+8>>2]|0;r=c[d+12>>2]|0;do{if(p>>>0>=(c[f+16>>2]|0)>>>0){if((c[p+12>>2]|0)!=(d|0)){s=0;break}s=(c[r+8>>2]|0)==(d|0)}else{s=0}}while(0);if((s&1|0)==0){aD();return 0;return 0}c[p+12>>2]=r;c[r+8>>2]=p}else{p=(d+16|0)+4|0;s=p;q=c[p>>2]|0;r=q;do{if((q|0)!=0){t=2199}else{p=d+16|0;s=p;m=c[p>>2]|0;r=m;if((m|0)!=0){t=2199;break}else{break}}}while(0);if((t|0)==2199){while(1){q=(r+16|0)+4|0;m=q;if((c[q>>2]|0)!=0){u=1}else{q=r+16|0;m=q;u=(c[q>>2]|0)!=0}if(!u){break}q=m;s=q;r=c[q>>2]|0}if((s>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[s>>2]=0}}if((l|0)!=0){s=(f+304|0)+(c[d+28>>2]<<2)|0;if((d|0)==(c[s>>2]|0)){u=r;c[s>>2]=u;if((u|0)==0){u=f+4|0;c[u>>2]=c[u>>2]&(1<<c[d+28>>2]^-1)}}else{if((l>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}if((c[l+16>>2]|0)==(d|0)){c[l+16>>2]=r}else{c[(l+16|0)+4>>2]=r}}if((r|0)!=0){if((r>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[r+24>>2]=l;l=c[d+16>>2]|0;u=l;if((l|0)!=0){if((u>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[r+16>>2]=u;c[u+24>>2]=r}u=c[(d+16|0)+4>>2]|0;d=u;if((u|0)!=0){if((d>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}c[(r+16|0)+4>>2]=d;c[d+24>>2]=r}}}}g=g+a|0;b=b+a|0}a=g+4|0;c[a>>2]=c[a>>2]&-2;c[h+4>>2]=b|1;c[h+b>>2]=b;if(b>>>3>>>0<32){a=b>>>3;g=(f+40|0)+(a<<1<<2)|0;r=g;if((c[f>>2]&1<<a|0)!=0){if(((c[g+8>>2]|0)>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD();return 0;return 0}r=c[g+8>>2]|0}else{d=f|0;c[d>>2]=c[d>>2]|1<<a}c[g+8>>2]=h;c[r+12>>2]=h;c[h+8>>2]=r;c[h+12>>2]=g}else{g=h;h=b>>>8;if((h|0)==0){v=0}else{if(h>>>0>65535){v=31}else{r=h;h=(r-256|0)>>>16&8;a=r<<h;r=a;d=(a-4096|0)>>>16&4;h=h+d|0;a=r<<d;r=a;u=(a-16384|0)>>>16&2;d=u;h=h+u|0;u=r<<d;r=u;d=(14-h|0)+(u>>>15)|0;v=(d<<1)+(b>>>((d+7|0)>>>0)&1)|0}}d=(f+304|0)+(v<<2)|0;c[g+28>>2]=v;c[(g+16|0)+4>>2]=0;c[g+16>>2]=0;if((c[f+4>>2]&1<<v|0)!=0){u=c[d>>2]|0;if((v|0)==31){w=0}else{w=31-(((v>>>1)+8|0)-2|0)|0}h=b<<w;while(1){if((c[u+4>>2]&-8|0)==(b|0)){t=2266;break}x=(u+16|0)+((h>>>31&1)<<2)|0;h=h<<1;if((c[x>>2]|0)==0){t=2262;break}u=c[x>>2]|0}do{if((t|0)==2262){if((x>>>0>=(c[f+16>>2]|0)>>>0&1|0)!=0){c[x>>2]=g;c[g+24>>2]=u;h=g;c[g+12>>2]=h;c[g+8>>2]=h;break}else{aD();return 0;return 0}}else if((t|0)==2266){h=c[u+8>>2]|0;if(u>>>0>=(c[f+16>>2]|0)>>>0){y=h>>>0>=(c[f+16>>2]|0)>>>0}else{y=0}if((y&1|0)!=0){b=g;c[h+12>>2]=b;c[u+8>>2]=b;c[g+8>>2]=h;c[g+12>>2]=u;c[g+24>>2]=0;break}else{aD();return 0;return 0}}}while(0)}else{u=f+4|0;c[u>>2]=c[u>>2]|1<<v;c[d>>2]=g;c[g+24>>2]=d;d=g;c[g+12>>2]=d;c[g+8>>2]=d}}}i=e;j=i;k=j+8|0;return k|0}function uH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=a;a=b;b=d;d=c[f+24>>2]|0;g=uC(f,d)|0;h=(c[g>>2]|0)+(c[g+4>>2]|0)|0;g=24;i=h+(-((g+16|0)+7|0)|0)|0;if((i+8&7|0)==0){j=0}else{j=8-(i+8&7)&7}k=i+j|0;if(k>>>0<(d+16|0)>>>0){l=d}else{l=k}k=l;l=k;j=l+8|0;i=l+g|0;m=0;uD(f,a,b-40|0);c[l+4>>2]=g|1|2;g=j;l=f+448|0;c[g>>2]=c[l>>2]|0;c[g+4>>2]=c[l+4>>2]|0;c[g+8>>2]=c[l+8>>2]|0;c[g+12>>2]=c[l+12>>2]|0;c[f+448>>2]=a;c[(f+448|0)+4>>2]=b;c[(f+448|0)+12>>2]=e;c[(f+448|0)+8>>2]=j;while(1){j=i+4|0;c[i+4>>2]=7;m=m+1|0;if((j+4|0)>>>0>=h>>>0){break}i=j}if((k|0)==(d|0)){return}i=d;h=k-d|0;d=(i+h|0)+4|0;c[d>>2]=c[d>>2]&-2;c[i+4>>2]=h|1;c[i+h>>2]=h;if(h>>>3>>>0<32){d=h>>>3;k=(f+40|0)+(d<<1<<2)|0;m=k;if((c[f>>2]&1<<d|0)!=0){if(((c[k+8>>2]|0)>>>0>=(c[f+16>>2]|0)>>>0&1|0)==0){aD()}m=c[k+8>>2]|0}else{j=f|0;c[j>>2]=c[j>>2]|1<<d}c[k+8>>2]=i;c[m+12>>2]=i;c[i+8>>2]=m;c[i+12>>2]=k}else{k=i;i=h>>>8;if((i|0)==0){n=0}else{if(i>>>0>65535){n=31}else{m=i;i=(m-256|0)>>>16&8;d=m<<i;m=d;j=(d-4096|0)>>>16&4;i=i+j|0;d=m<<j;m=d;e=(d-16384|0)>>>16&2;j=e;i=i+e|0;e=m<<j;m=e;j=(14-i|0)+(e>>>15)|0;n=(j<<1)+(h>>>((j+7|0)>>>0)&1)|0}}j=(f+304|0)+(n<<2)|0;c[k+28>>2]=n;c[(k+16|0)+4>>2]=0;c[k+16>>2]=0;if((c[f+4>>2]&1<<n|0)!=0){e=c[j>>2]|0;if((n|0)==31){o=0}else{o=31-(((n>>>1)+8|0)-2|0)|0}i=h<<o;while(1){if((c[e+4>>2]&-8|0)==(h|0)){p=2318;break}q=(e+16|0)+((i>>>31&1)<<2)|0;i=i<<1;if((c[q>>2]|0)==0){p=2314;break}e=c[q>>2]|0}do{if((p|0)==2314){if((q>>>0>=(c[f+16>>2]|0)>>>0&1|0)!=0){c[q>>2]=k;c[k+24>>2]=e;i=k;c[k+12>>2]=i;c[k+8>>2]=i;break}else{aD()}}else if((p|0)==2318){i=c[e+8>>2]|0;if(e>>>0>=(c[f+16>>2]|0)>>>0){r=i>>>0>=(c[f+16>>2]|0)>>>0}else{r=0}if((r&1|0)!=0){h=k;c[i+12>>2]=h;c[e+8>>2]=h;c[k+8>>2]=i;c[k+12>>2]=e;c[k+24>>2]=0;break}else{aD()}}}while(0)}else{e=f+4|0;c[e>>2]=c[e>>2]|1<<n;c[j>>2]=k;c[k+24>>2]=j;j=k;c[k+12>>2]=j;c[k+8>>2]=j}}return}function uI(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function uJ(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function uK(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function uL(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{uK(b,c,d)}}function uM(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function uN(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function uO(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(F=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function uP(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(F=e,a-c>>>0|0)|0}function uQ(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}F=a<<c-32;return 0}function uR(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=0;return b>>>c-32|0}function uS(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=(b|0)<0?-1:0;return b>>c-32|0}function uT(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function uU(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function uV(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=ab(d,c);f=a>>>16;a=(e>>>16)+ab(d,f)|0;d=b>>>16;b=ab(d,c);return(F=((a>>>16)+ab(d,f)|0)+(((a&65535)+b|0)>>>16)|0,0|(a+b<<16|e&65535))|0}function uW(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=uP(e^a,f^b,e,f)|0;b=F;a=g^e;e=h^f;f=uP(u$(i,b,uP(g^c,h^d,g,h)|0,F,0)^a,F^e,a,e)|0;return(F=F,f)|0}function uX(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=uP(h^a,j^b,h,j)|0;b=F;u$(m,b,uP(k^d,l^e,k,l)|0,F,g);l=uP(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=F;i=f;return(F=j,l)|0}function uY(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=uV(e,a)|0;f=F;return(F=(ab(b,a)+ab(d,e)|0)+f|f&0,0|c&-1)|0}function uZ(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=u$(a,b,c,d,0)|0;return(F=F,e)|0}function u_(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;u$(a,b,d,e,g);i=f;return(F=c[g+4>>2]|0,c[g>>2]|0)|0}function u$(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(F=n,o)|0}else{if(!m){n=0;o=0;return(F=n,o)|0}c[f>>2]=a&-1;c[f+4>>2]=b&0;n=0;o=0;return(F=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(F=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(F=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=0|a&-1;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((uU(l|0)|0)>>>0);return(F=n,o)|0}p=(uT(l|0)|0)-(uT(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(F=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(F=n,o)|0}else{if(!m){r=(uT(l|0)|0)-(uT(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(F=n,o)|0}c[f>>2]=0|a&-1;c[f+4>>2]=h|b&0;n=0;o=0;return(F=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=((uT(j|0)|0)+33|0)-(uT(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=0|a&-1;return(F=n,o)|0}else{p=uU(j|0)|0;n=0|i>>>(p>>>0);o=i<<32-p|g>>>(p>>>0)|0;return(F=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;D=u;E=t;G=0;H=0}else{g=0|d&-1;d=k|e&0;e=uO(g,d,-1,-1)|0;k=F;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=0|(u<<1|i>>>31);a=u>>>31|v<<1|0;uP(e,k,j,a);b=F;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=uP(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=F;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;D=M;E=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=0|E;c[f+4>>2]=D|0}n=(0|K)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(F=n,o)|0}
function u0(a,b,c){a=a|0;b=b|0;c=c|0;return a6(a|0,b|0,c|0)|0}function u1(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return bi[a&1023](b|0,c|0,d|0)|0}function u2(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;bj[a&1023](b|0,c|0,d|0,e|0,f|0)}function u3(a,b){a=a|0;b=b|0;bk[a&1023](b|0)}function u4(a,b,c){a=a|0;b=b|0;c=c|0;bl[a&1023](b|0,c|0)}function u5(a,b){a=a|0;b=b|0;return bm[a&1023](b|0)|0}function u6(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;bn[a&1023](b|0,c|0,d|0)}function u7(a){a=a|0;bo[a&1023]()}function u8(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;bp[a&1023](b|0,c|0,d|0,e|0,f|0,g|0)}function u9(a,b,c){a=a|0;b=b|0;c=c|0;return bq[a&1023](b|0,c|0)|0}function va(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return br[a&1023](b|0,c|0,d|0,e|0,f|0)|0}function vb(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;bs[a&1023](b|0,c|0,d|0,e|0)}function vc(a,b,c){a=a|0;b=b|0;c=c|0;ac(0);return 0}function vd(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ac(1)}function ve(a){a=a|0;ac(2)}function vf(a,b){a=a|0;b=b|0;ac(3)}function vg(a){a=a|0;ac(4);return 0}function vh(a,b,c){a=a|0;b=b|0;c=c|0;ac(5)}function vi(){ac(6)}function vj(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ac(7)}function vk(a,b){a=a|0;b=b|0;ac(8);return 0}function vl(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ac(9);return 0}function vm(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ac(10)}
// EMSCRIPTEN_END_FUNCS
var bi=[vc,vc,mZ,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,iM,vc,vc,vc,vc,vc,o1,vc,vc,vc,m0,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,k5,vc,vc,vc,vc,vc,vc,vc,vc,vc,ml,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,jk,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,hW,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,dJ,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,k4,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,qe,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,qj,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,iJ,vc,ji,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,ko,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,u0,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,hR,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,qc,vc,hS,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,kn,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,jj,vc,vc,vc,vc,vc,vc,vc,jR,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,o4,vc,vc,vc,vc,vc,vc,vc,ox,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,km,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,k7,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,o2,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,hX,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,oC,vc,vc,vc,vc,vc,vc,vc,vc,vc,mk,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,m_,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,hY,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc,vc];var bj=[vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,tW,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,s$,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,sr,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,ue,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,rq,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,sV,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,rb,vd,vd,vd,vd,vd,vd,vd,vd,vd,sG,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,p3,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,r7,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd,vd];var bk=[ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,sX,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,oG,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,nc,ve,nb,ve,ve,ve,mV,ve,ve,ve,j_,ve,ve,ve,ve,ve,ve,ve,jO,ve,ve,ve,ve,ve,ve,ve,kL,ve,ve,ve,j9,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,jA,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,rV,ve,ve,ve,ve,ve,ve,ve,s_,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,os,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,qv,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,jE,ve,jF,ve,kj,ve,ve,ve,ve,ve,ve,ve,md,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,o5,ve,ve,ve,j7,ve,sp,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,rZ,ve,ve,ve,ve,ve,tu,ve,h$,ve,ve,ve,ve,ve,o$,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,jd,ve,ve,ve,ve,ve,ve,ve,pI,ve,k0,ve,ve,ve,oT,ve,ve,ve,pJ,ve,ve,ve,ve,ve,ve,ve,ve,ve,rv,ve,ve,ve,ve,ve,kb,ve,ve,ve,k$,ve,ve,ve,tL,ve,lt,ve,ls,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ki,ve,ve,ve,ve,ve,mf,ve,ve,ve,ve,ve,oh,ve,ve,ve,p8,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,me,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,sR,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,rE,ve,sh,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,jN,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,mW,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,oP,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,qm,ve,ve,ve,je,ve,p9,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,rz,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,su,ve,ve,ve,ve,ve,lA,ve,iK,ve,ve,ve,ve,ve,ve,ve,ve,ve,kZ,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,oO,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,t$,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,tV,ve,ve,ve,qt,ve,ve,ve,jc,ve,ve,ve,kA,ve,ve,ve,lo,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,tp,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,rK,ve,ve,ve,ve,ve,nm,ve,tZ,ve,ve,ve,ve,ve,iB,ve,ve,ve,tw,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,im,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,mU,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,kD,ve,ve,ve,mu,ve,mv,ve,ve,ve,ve,ve,rC,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,r0,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,sw,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,kJ,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve,ve];var bl=[vf,vf,vf,vf,mX,vf,vf,vf,iQ,vf,vf,vf,vf,vf,vf,vf,vf,vf,j0,vf,vf,vf,vf,vf,vf,vf,iC,vf,iI,vf,vf,vf,rw,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,j6,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,nq,vf,vf,vf,vf,vf,vf,vf,k3,vf,o3,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,io,vf,vf,vf,vf,vf,vf,vf,qq,vf,vf,vf,vf,vf,vf,vf,lb,vf,vf,vf,vf,vf,vf,vf,iz,vf,vf,vf,vf,vf,mh,vf,vf,vf,iA,vf,vf,vf,vf,vf,vf,vf,vf,vf,m4,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,oR,vf,iy,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,j3,vf,iq,vf,vf,vf,lG,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,js,vf,vf,vf,vf,vf,vf,vf,qi,vf,lk,vf,kf,vf,vf,vf,k2,vf,vf,vf,vf,vf,rW,vf,vf,vf,vf,vf,vf,vf,vf,vf,jp,vf,vf,vf,sT,vf,vf,vf,ly,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,qs,vf,vf,vf,vf,vf,mC,vf,vf,vf,kt,vf,vf,vf,vf,vf,vf,vf,lv,vf,ni,vf,vf,vf,vf,vf,j1,vf,vf,vf,vf,vf,kw,vf,vf,vf,jJ,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,ip,vf,vf,vf,vf,vf,vf,vf,vf,vf,lD,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,tM,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,no,vf,vf,vf,vf,vf,jx,vf,jh,vf,vf,vf,mY,vf,vf,vf,vf,vf,vf,vf,sS,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,dC,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,jr,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,mc,vf,vf,vf,nt,vf,vf,vf,vf,vf,vf,vf,pg,vf,vf,vf,vf,vf,ku,vf,vf,vf,ng,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,mj,vf,vf,vf,vf,vf,lj,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,kr,vf,sq,vf,vf,vf,vf,vf,vf,vf,lE,vf,vf,vf,vf,vf,vf,vf,vf,vf,m6,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,kk,vf,tN,vf,jz,vf,vf,vf,vf,vf,vf,vf,jK,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,ln,vf,vf,vf,m$,vf,ms,vf,vf,vf,ke,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,rX,vf,vf,vf,mx,vf,jQ,vf,vf,vf,vf,vf,vf,vf,vf,vf,kh,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,jg,vf,qa,vf,vf,vf,vf,vf,jP,vf,vf,vf,vf,vf,vf,vf,vf,vf,mi,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,jq,vf,vf,vf,h3,vf,vf,vf,vf,vf,tr,vf,vf,vf,vf,vf,lH,vf,j$,vf,ll,vf,nB,vf,kO,vf,vf,vf,kl,vf,mm,vf,h0,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,oQ,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,k6,vf,vf,vf,vf,vf,kz,vf,k1,vf,ir,vf,vf,vf,si,vf,vf,vf,kP,vf,ne,vf,vf,vf,mg,vf,vf,vf,vf,vf,vf,vf,tq,vf,vf,vf,vf,vf,vf,vf,rx,vf,vf,vf,vf,vf,m1,vf,jU,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,qd,vf,vf,vf,vf,vf,p7,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,o_,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf,vf];var bm=[vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,nv,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,hU,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,qr,vg,vg,vg,vg,vg,vg,vg,pj,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,kI,vg,vg,vg,vg,vg,vg,vg,lr,vg,lq,vg,lu,vg,vg,vg,vg,vg,vg,vg,vg,vg,lf,vg,le,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,lF,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,np,vg,vg,vg,vg,vg,iF,vg,iG,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,j5,vg,vg,vg,vg,vg,kx,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,ka,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,iD,vg,iE,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,m2,vg,mn,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,lc,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,jC,vg,jD,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,h4,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,oJ,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,m7,vg,vg,vg,vg,vg,oU,vg,vg,vg,vg,vg,kK,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,pd,vg,vg,vg,vg,vg,jG,vg,vg,vg,kC,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,jX,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,mq,vg,vg,vg,vg,vg,vg,vg,jm,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,mF,vg,vg,vg,vg,vg,vg,vg,vg,vg,qh,vg,vg,vg,vg,vg,o7,vg,o8,vg,vg,vg,ql,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,ph,vg,jl,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,o6,vg,vg,vg,vg,vg,dI,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,lz,vg,k8,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,oZ,vg,vg,vg,m9,vg,na,vg,vg,vg,vg,vg,jY,vg,vg,vg,vg,vg,vg,vg,vg,vg,mt,vg,mp,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,jZ,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg,vg];var bn=[vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,is,vh,m5,vh,vh,vh,ss,vh,vh,vh,vh,vh,lp,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,lC,vh,tY,vh,qo,vh,vh,vh,vh,vh,vh,vh,it,vh,vh,vh,vh,vh,vh,vh,vh,vh,k9,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,jn,vh,vh,vh,vh,vh,pK,vh,vh,vh,vh,vh,vh,vh,rF,vh,n9,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,kq,vh,vh,vh,vh,vh,rJ,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,my,vh,vh,vh,vh,vh,oX,vh,vh,vh,vh,vh,vh,vh,p0,vh,vh,vh,vh,vh,qp,vh,vh,vh,vh,vh,sY,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,jw,vh,ix,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,sv,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,mw,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,jS,vh,vh,vh,qn,vh,li,vh,vh,vh,o0,vh,nn,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,nf,vh,vh,vh,qu,vh,vh,vh,vh,vh,rL,vh,vh,vh,vh,vh,j2,vh,vh,vh,vh,vh,vh,vh,t_,vh,vh,vh,vh,vh,jv,vh,lh,vh,vh,vh,vh,vh,mz,vh,vh,vh,n7,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,kp,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,nh,vh,nk,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,oS,vh,kv,vh,r$,vh,j8,vh,vh,vh,vh,vh,qw,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,iL,vh,vh,vh,vh,vh,vh,vh,oV,vh,vh,vh,vh,vh,vh,vh,jt,vh,vh,vh,vh,vh,vh,vh,la,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,mA,vh,vh,vh,m3,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,rG,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,pH,vh,vh,vh,mo,vh,vh,vh,vh,vh,vh,vh,vh,vh,rB,vh,vh,vh,vh,vh,kB,vh,vh,vh,vh,vh,nj,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,jo,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,r_,vh,vh,vh,vh,vh,rD,vh,vh,vh,nl,vh,vh,vh,vh,vh,vh,vh,jW,vh,vh,vh,vh,vh,vh,vh,h_,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,r1,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,sZ,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,iv,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,iH,vh,p2,vh,iw,vh,vh,vh,lg,vh,jV,vh,vh,vh,ju,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,ks,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,st,vh,vh,vh,vh,vh,vh,vh,vh,vh,jB,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,jT,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,tX,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh,vh];var bo=[vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi,vi];var bp=[vj,vj,vj,vj,vj,vj,fL,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,f$,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,gg,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,fD,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj,vj];var bq=[vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,qg,vk,vk,vk,vk,vk,vk,vk,b6,vk,vk,vk,rt,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,qk,vk,vk,vk,qf,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,kM,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,mE,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,oB,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,iu,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,mD,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,ow,vk,oy,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,qb,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,c$,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,kd,vk,vk,vk,mB,vk,vk,vk,mr,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,jH,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,oD,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,pf,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,ld,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,nd,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,m8,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,ns,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,pi,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,lw,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,lm,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,lx,vk,vk,vk,vk,vk,vk,vk,vk,vk,ky,vk,vk,vk,vk,vk,kN,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,pe,vk,vk,vk,vk,vk,kc,vk,tF,vk,te,vk,sN,vk,sd,vk,ro,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,h5,vk,vk,vk,jy,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,nr,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,jI,vk,vk,vk,vk,vk,vk,vk,vk,vk,oK,vk,vk,vk,vk,vk,vk,vk,vk,vk,j4,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,oY,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk,vk];var br=[vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,sk,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,p1,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,tP,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl,vl];var bs=[vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,rI,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,tO,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,rY,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,sj,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,r2,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,uf,vm,vm,vm,vm,vm,vm,vm,rH,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,tv,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,sU,vm,vm,vm,vm,vm,vm,vm,vm,vm,s0,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,rA,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,oW,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm,vm];return{_memcmp:uN,_strlen:uJ,_cpabe_enc:bJ,_free:uu,_realloc:uw,_memmove:uL,_memset:uI,_malloc:uq,_memcpy:uK,_cpabe_get_private_key:bI,_cpabe_random_init:bM,_cpabe_dec:bK,_strcpy:uM,_cpabe_setup:bH,stackAlloc:bt,stackSave:bu,stackRestore:bv,setThrew:bw,setTempRet0:bx,setTempRet1:by,setTempRet2:bz,setTempRet3:bA,setTempRet4:bB,setTempRet5:bC,setTempRet6:bD,setTempRet7:bE,setTempRet8:bF,setTempRet9:bG,dynCall_iiii:u1,dynCall_viiiii:u2,dynCall_vi:u3,dynCall_vii:u4,dynCall_ii:u5,dynCall_viii:u6,dynCall_v:u7,dynCall_viiiiii:u8,dynCall_iii:u9,dynCall_iiiiii:va,dynCall_viiii:vb}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, invoke_iiii: invoke_iiii, invoke_viiiii: invoke_viiiii, invoke_vi: invoke_vi, invoke_vii: invoke_vii, invoke_ii: invoke_ii, invoke_viii: invoke_viii, invoke_v: invoke_v, invoke_viiiiii: invoke_viiiiii, invoke_iii: invoke_iii, invoke_iiiiii: invoke_iiiiii, invoke_viiii: invoke_viiii, _llvm_va_end: _llvm_va_end, _strncmp: _strncmp, _pread: _pread, _sscanf: _sscanf, _snprintf: _snprintf, _vsnprintf: _vsnprintf, __scanString: __scanString, _fclose: _fclose, _strtok_r: _strtok_r, _abort: _abort, _fprintf: _fprintf, _printf: _printf, _isdigit: _isdigit, _close: _close, _fopen: _fopen, __reallyNegative: __reallyNegative, _nl_langinfo: _nl_langinfo, _strchr: _strchr, _fputc: _fputc, _llvm_stackrestore: _llvm_stackrestore, _open: _open, _strtok: _strtok, ___setErrNo: ___setErrNo, _fwrite: _fwrite, _llvm_va_copy: _llvm_va_copy, _qsort: _qsort, _write: _write, _fputs: _fputs, _isalpha: _isalpha, _exit: _exit, _sprintf: _sprintf, _strdup: _strdup, _isspace: _isspace, _sysconf: _sysconf, _fread: _fread, _read: _read, _asprintf: _asprintf, _ferror: _ferror, __formatString: __formatString, _labs: _labs, _vfprintf: _vfprintf, _pwrite: _pwrite, __isFloat: __isFloat, _isalnum: _isalnum, _fsync: _fsync, _llvm_stacksave: _llvm_stacksave, ___errno_location: ___errno_location, _sbrk: _sbrk, _time: _time, _islower: _islower, __exit: __exit, _strcmp: _strcmp, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, cttz_i8: cttz_i8, ctlz_i8: ctlz_i8, NaN: NaN, Infinity: Infinity, _stdout: _stdout, _stderr: _stderr }, buffer);
var _memcmp = Module["_memcmp"] = asm._memcmp;
var _strlen = Module["_strlen"] = asm._strlen;
var _cpabe_enc = Module["_cpabe_enc"] = asm._cpabe_enc;
var _free = Module["_free"] = asm._free;
var _realloc = Module["_realloc"] = asm._realloc;
var _memmove = Module["_memmove"] = asm._memmove;
var _memset = Module["_memset"] = asm._memset;
var _malloc = Module["_malloc"] = asm._malloc;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var _cpabe_get_private_key = Module["_cpabe_get_private_key"] = asm._cpabe_get_private_key;
var _cpabe_random_init = Module["_cpabe_random_init"] = asm._cpabe_random_init;
var _cpabe_dec = Module["_cpabe_dec"] = asm._cpabe_dec;
var _strcpy = Module["_strcpy"] = asm._strcpy;
var _cpabe_setup = Module["_cpabe_setup"] = asm._cpabe_setup;
var dynCall_iiii = Module["dynCall_iiii"] = asm.dynCall_iiii;
var dynCall_viiiii = Module["dynCall_viiiii"] = asm.dynCall_viiiii;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_vii = Module["dynCall_vii"] = asm.dynCall_vii;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_viii = Module["dynCall_viii"] = asm.dynCall_viii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm.dynCall_viiiiii;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm.dynCall_iiiiii;
var dynCall_viiii = Module["dynCall_viiii"] = asm.dynCall_viiii;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
