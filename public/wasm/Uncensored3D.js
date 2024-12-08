var Module = typeof Module != "undefined" ? Module : {};
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
  throw toThrow;
};
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE =
  typeof process == "object" &&
  typeof process.versions == "object" &&
  typeof process.versions.node == "string";
var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}
var read_, readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
  var fs = require("fs");
  var nodePath = require("path");
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = nodePath.dirname(scriptDirectory) + "/";
  } else {
    scriptDirectory = __dirname + "/";
  }
  read_ = (filename, binary) => {
    filename = isFileURI(filename)
      ? new URL(filename)
      : nodePath.normalize(filename);
    return fs.readFileSync(filename, binary ? undefined : "utf8");
  };
  readBinary = (filename) => {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    return ret;
  };
  readAsync = (filename, onload, onerror, binary = true) => {
    filename = isFileURI(filename)
      ? new URL(filename)
      : nodePath.normalize(filename);
    fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
      if (err) onerror(err);
      else onload(binary ? data.buffer : data);
    });
  };
  if (!Module["thisProgram"] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  process.on("uncaughtException", (ex) => {
    if (
      ex !== "unwind" &&
      !(ex instanceof ExitStatus) &&
      !(ex.context instanceof ExitStatus)
    ) {
      throw ex;
    }
  });
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
  Module["inspect"] = () => "[Emscripten Module object]";
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (scriptDirectory.indexOf("blob:") !== 0) {
    scriptDirectory = scriptDirectory.substr(
      0,
      scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1
    );
  } else {
    scriptDirectory = "";
  }
  {
    read_ = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText;
    };
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = (url) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(xhr.response);
      };
    }
    readAsync = (url, onload, onerror) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => {
        if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
          onload(xhr.response);
          return;
        }
        onerror();
      };
      xhr.onerror = onerror;
      xhr.send(null);
    };
  }
} else {
}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
if (typeof WebAssembly != "object") {
  abort("no native wasm support detected");
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
  if (!condition) {
    abort(text);
  }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module["HEAP8"] = HEAP8 = new Int8Array(b);
  Module["HEAP16"] = HEAP16 = new Int16Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
  Module["HEAP32"] = HEAP32 = new Int32Array(b);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function")
      Module["preRun"] = [Module["preRun"]];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function initRuntime() {
  runtimeInitialized = true;
  if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
  FS.ignorePermissions = false;
  TTY.init();
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  ___funcs_on_exit();
  callRuntimeCallbacks(__ATEXIT__);
  FS.quit();
  TTY.shutdown();
  runtimeExited = true;
}
function postRun() {
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function")
      Module["postRun"] = [Module["postRun"]];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
  return id;
}
function addRunDependency(id) {
  runDependencies++;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
}
function removeRunDependency(id) {
  runDependencies--;
  if (Module["monitorRunDependencies"]) {
    Module["monitorRunDependencies"](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}
function abort(what) {
  if (Module["onAbort"]) {
    Module["onAbort"](what);
  }
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  what += ". Build with -sASSERTIONS for more info.";
  var e = new WebAssembly.RuntimeError(what);
  throw e;
}
var dataURIPrefix = "data:application/octet-stream;base64,";
var isDataURI = (filename) => filename.startsWith(dataURIPrefix);
var isFileURI = (filename) => filename.startsWith("file://");
var wasmBinaryFile;
wasmBinaryFile = "Uncensored3D.wasm";
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}
function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
}
function getBinaryPromise(binaryFile) {
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
    if (typeof fetch == "function" && !isFileURI(binaryFile)) {
      return fetch(binaryFile, { credentials: "same-origin" })
        .then((response) => {
          if (!response["ok"]) {
            throw "failed to load wasm binary file at '" + binaryFile + "'";
          }
          return response["arrayBuffer"]();
        })
        .catch(() => getBinarySync(binaryFile));
    } else if (readAsync) {
      return new Promise((resolve, reject) => {
        readAsync(
          binaryFile,
          (response) => resolve(new Uint8Array(response)),
          reject
        );
      });
    }
  }
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile)
    .then((binary) => WebAssembly.instantiate(binary, imports))
    .then((instance) => instance)
    .then(receiver, (reason) => {
      err(`failed to asynchronously prepare wasm: ${reason}`);
      abort(reason);
    });
}
function instantiateAsync(binary, binaryFile, imports, callback) {
  if (
    !binary &&
    typeof WebAssembly.instantiateStreaming == "function" &&
    !isDataURI(binaryFile) &&
    !isFileURI(binaryFile) &&
    !ENVIRONMENT_IS_NODE &&
    typeof fetch == "function"
  ) {
    return fetch(binaryFile, { credentials: "same-origin" }).then(
      (response) => {
        var result = WebAssembly.instantiateStreaming(response, imports);
        return result.then(callback, function (reason) {
          err(`wasm streaming compile failed: ${reason}`);
          err("falling back to ArrayBuffer instantiation");
          return instantiateArrayBuffer(binaryFile, imports, callback);
        });
      }
    );
  }
  return instantiateArrayBuffer(binaryFile, imports, callback);
}
function createWasm() {
  var info = { a: wasmImports };
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    wasmExports = Asyncify.instrumentWasmExports(wasmExports);
    wasmMemory = wasmExports["ka"];
    updateMemoryViews();
    addOnInit(wasmExports["la"]);
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  addRunDependency("wasm-instantiate");
  function receiveInstantiationResult(result) {
    receiveInstance(result["instance"]);
  }
  if (Module["instantiateWasm"]) {
    try {
      return Module["instantiateWasm"](info, receiveInstance);
    } catch (e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
      return false;
    }
  }
  instantiateAsync(
    wasmBinary,
    wasmBinaryFile,
    info,
    receiveInstantiationResult
  );
  return {};
}
var tempDouble;
var tempI64;
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = `Program terminated with exit(${status})`;
  this.status = status;
}
var callRuntimeCallbacks = (callbacks) => {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
};
var noExitRuntime = Module["noExitRuntime"] || false;
var UTF8Decoder =
  typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u0 =
        ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};
var UTF8ToString = (ptr, maxBytesToRead) =>
  ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
var ___assert_fail = (condition, filename, line, func) => {
  abort(
    `Assertion failed: ${UTF8ToString(condition)}, at: ` +
      [
        filename ? UTF8ToString(filename) : "unknown filename",
        line,
        func ? UTF8ToString(func) : "unknown function",
      ]
  );
};
var setErrNo = (value) => {
  HEAP32[___errno_location() >> 2] = value;
  return value;
};
var PATH = {
  isAbs: (path) => path.charAt(0) === "/",
  splitPath: (filename) => {
    var splitPathRe =
      /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    return splitPathRe.exec(filename).slice(1);
  },
  normalizeArray: (parts, allowAboveRoot) => {
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === ".") {
        parts.splice(i, 1);
      } else if (last === "..") {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) {
      for (; up; up--) {
        parts.unshift("..");
      }
    }
    return parts;
  },
  normalize: (path) => {
    var isAbsolute = PATH.isAbs(path),
      trailingSlash = path.substr(-1) === "/";
    path = PATH.normalizeArray(
      path.split("/").filter((p) => !!p),
      !isAbsolute
    ).join("/");
    if (!path && !isAbsolute) {
      path = ".";
    }
    if (path && trailingSlash) {
      path += "/";
    }
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: (path) => {
    var result = PATH.splitPath(path),
      root = result[0],
      dir = result[1];
    if (!root && !dir) {
      return ".";
    }
    if (dir) {
      dir = dir.substr(0, dir.length - 1);
    }
    return root + dir;
  },
  basename: (path) => {
    if (path === "/") return "/";
    path = PATH.normalize(path);
    path = path.replace(/\/$/, "");
    var lastSlash = path.lastIndexOf("/");
    if (lastSlash === -1) return path;
    return path.substr(lastSlash + 1);
  },
  join: function () {
    var paths = Array.prototype.slice.call(arguments);
    return PATH.normalize(paths.join("/"));
  },
  join2: (l, r) => PATH.normalize(l + "/" + r),
};
var initRandomFill = () => {
  if (
    typeof crypto == "object" &&
    typeof crypto["getRandomValues"] == "function"
  ) {
    return (view) => crypto.getRandomValues(view);
  } else if (ENVIRONMENT_IS_NODE) {
    try {
      var crypto_module = require("crypto");
      var randomFillSync = crypto_module["randomFillSync"];
      if (randomFillSync) {
        return (view) => crypto_module["randomFillSync"](view);
      }
      var randomBytes = crypto_module["randomBytes"];
      return (view) => (view.set(randomBytes(view.byteLength)), view);
    } catch (e) {}
  }
  abort("initRandomDevice");
};
var randomFill = (view) => (randomFill = initRandomFill())(view);
var PATH_FS = {
  resolve: function () {
    var resolvedPath = "",
      resolvedAbsolute = false;
    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = i >= 0 ? arguments[i] : FS.cwd();
      if (typeof path != "string") {
        throw new TypeError("Arguments to path.resolve must be strings");
      } else if (!path) {
        return "";
      }
      resolvedPath = path + "/" + resolvedPath;
      resolvedAbsolute = PATH.isAbs(path);
    }
    resolvedPath = PATH.normalizeArray(
      resolvedPath.split("/").filter((p) => !!p),
      !resolvedAbsolute
    ).join("/");
    return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
  },
  relative: (from, to) => {
    from = PATH_FS.resolve(from).substr(1);
    to = PATH_FS.resolve(to).substr(1);
    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== "") break;
      }
      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== "") break;
      }
      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }
    var fromParts = trim(from.split("/"));
    var toParts = trim(to.split("/"));
    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }
    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push("..");
    }
    outputParts = outputParts.concat(toParts.slice(samePartsLength));
    return outputParts.join("/");
  },
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = (str) => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};
var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
};
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
var FS_stdin_getChar = () => {
  if (!FS_stdin_getChar_buffer.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
      var BUFSIZE = 256;
      var buf = Buffer.alloc(BUFSIZE);
      var bytesRead = 0;
      var fd = process.stdin.fd;
      try {
        bytesRead = fs.readSync(fd, buf);
      } catch (e) {
        if (e.toString().includes("EOF")) bytesRead = 0;
        else throw e;
      }
      if (bytesRead > 0) {
        result = buf.slice(0, bytesRead).toString("utf-8");
      } else {
        result = null;
      }
    } else if (
      typeof window != "undefined" &&
      typeof window.prompt == "function"
    ) {
      result = window.prompt("Input: ");
      if (result !== null) {
        result += "\n";
      }
    } else if (typeof readline == "function") {
      result = readline();
      if (result !== null) {
        result += "\n";
      }
    }
    if (!result) {
      return null;
    }
    FS_stdin_getChar_buffer = intArrayFromString(result, true);
  }
  return FS_stdin_getChar_buffer.shift();
};
var TTY = {
  ttys: [],
  init() {},
  shutdown() {},
  register(dev, ops) {
    TTY.ttys[dev] = { input: [], output: [], ops: ops };
    FS.registerDevice(dev, TTY.stream_ops);
  },
  stream_ops: {
    open(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    },
    close(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    fsync(stream) {
      stream.tty.ops.fsync(stream.tty);
    },
    read(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i = 0; i < length; i++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === undefined && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === undefined) break;
        bytesRead++;
        buffer[offset + i] = result;
      }
      if (bytesRead) {
        stream.node.timestamp = Date.now();
      }
      return bytesRead;
    },
    write(stream, buffer, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i = 0; i < length; i++) {
          stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.timestamp = Date.now();
      }
      return i;
    },
  },
  default_tty_ops: {
    get_char(tty) {
      return FS_stdin_getChar();
    },
    put_char(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output && tty.output.length > 0) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      }
    },
    ioctl_tcgets(tty) {
      return {
        c_iflag: 25856,
        c_oflag: 5,
        c_cflag: 191,
        c_lflag: 35387,
        c_cc: [
          3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
      };
    },
    ioctl_tcsets(tty, optional_actions, data) {
      return 0;
    },
    ioctl_tiocgwinsz(tty) {
      return [24, 80];
    },
  },
  default_tty1_ops: {
    put_char(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      } else {
        if (val != 0) tty.output.push(val);
      }
    },
    fsync(tty) {
      if (tty.output && tty.output.length > 0) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      }
    },
  },
};
var mmapAlloc = (size) => {
  abort();
};
var MEMFS = {
  ops_table: null,
  mount(mount) {
    return MEMFS.createNode(null, "/", 16384 | 511, 0);
  },
  createNode(parent, name, mode, dev) {
    if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
      throw new FS.ErrnoError(63);
    }
    if (!MEMFS.ops_table) {
      MEMFS.ops_table = {
        dir: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            lookup: MEMFS.node_ops.lookup,
            mknod: MEMFS.node_ops.mknod,
            rename: MEMFS.node_ops.rename,
            unlink: MEMFS.node_ops.unlink,
            rmdir: MEMFS.node_ops.rmdir,
            readdir: MEMFS.node_ops.readdir,
            symlink: MEMFS.node_ops.symlink,
          },
          stream: { llseek: MEMFS.stream_ops.llseek },
        },
        file: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
          },
          stream: {
            llseek: MEMFS.stream_ops.llseek,
            read: MEMFS.stream_ops.read,
            write: MEMFS.stream_ops.write,
            allocate: MEMFS.stream_ops.allocate,
            mmap: MEMFS.stream_ops.mmap,
            msync: MEMFS.stream_ops.msync,
          },
        },
        link: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
            readlink: MEMFS.node_ops.readlink,
          },
          stream: {},
        },
        chrdev: {
          node: {
            getattr: MEMFS.node_ops.getattr,
            setattr: MEMFS.node_ops.setattr,
          },
          stream: FS.chrdev_stream_ops,
        },
      };
    }
    var node = FS.createNode(parent, name, mode, dev);
    if (FS.isDir(node.mode)) {
      node.node_ops = MEMFS.ops_table.dir.node;
      node.stream_ops = MEMFS.ops_table.dir.stream;
      node.contents = {};
    } else if (FS.isFile(node.mode)) {
      node.node_ops = MEMFS.ops_table.file.node;
      node.stream_ops = MEMFS.ops_table.file.stream;
      node.usedBytes = 0;
      node.contents = null;
    } else if (FS.isLink(node.mode)) {
      node.node_ops = MEMFS.ops_table.link.node;
      node.stream_ops = MEMFS.ops_table.link.stream;
    } else if (FS.isChrdev(node.mode)) {
      node.node_ops = MEMFS.ops_table.chrdev.node;
      node.stream_ops = MEMFS.ops_table.chrdev.stream;
    }
    node.timestamp = Date.now();
    if (parent) {
      parent.contents[name] = node;
      parent.timestamp = node.timestamp;
    }
    return node;
  },
  getFileDataAsTypedArray(node) {
    if (!node.contents) return new Uint8Array(0);
    if (node.contents.subarray)
      return node.contents.subarray(0, node.usedBytes);
    return new Uint8Array(node.contents);
  },
  expandFileStorage(node, newCapacity) {
    var prevCapacity = node.contents ? node.contents.length : 0;
    if (prevCapacity >= newCapacity) return;
    var CAPACITY_DOUBLING_MAX = 1024 * 1024;
    newCapacity = Math.max(
      newCapacity,
      (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125)) >>> 0
    );
    if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
    var oldContents = node.contents;
    node.contents = new Uint8Array(newCapacity);
    if (node.usedBytes > 0)
      node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
  },
  resizeFileStorage(node, newSize) {
    if (node.usedBytes == newSize) return;
    if (newSize == 0) {
      node.contents = null;
      node.usedBytes = 0;
    } else {
      var oldContents = node.contents;
      node.contents = new Uint8Array(newSize);
      if (oldContents) {
        node.contents.set(
          oldContents.subarray(0, Math.min(newSize, node.usedBytes))
        );
      }
      node.usedBytes = newSize;
    }
  },
  node_ops: {
    getattr(node) {
      var attr = {};
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.timestamp);
      attr.mtime = new Date(node.timestamp);
      attr.ctime = new Date(node.timestamp);
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    },
    setattr(node, attr) {
      if (attr.mode !== undefined) {
        node.mode = attr.mode;
      }
      if (attr.timestamp !== undefined) {
        node.timestamp = attr.timestamp;
      }
      if (attr.size !== undefined) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    },
    lookup(parent, name) {
      throw FS.genericErrors[44];
    },
    mknod(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev);
    },
    rename(old_node, new_dir, new_name) {
      if (FS.isDir(old_node.mode)) {
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {}
        if (new_node) {
          for (var i in new_node.contents) {
            throw new FS.ErrnoError(55);
          }
        }
      }
      delete old_node.parent.contents[old_node.name];
      old_node.parent.timestamp = Date.now();
      old_node.name = new_name;
      new_dir.contents[new_name] = old_node;
      new_dir.timestamp = old_node.parent.timestamp;
      old_node.parent = new_dir;
    },
    unlink(parent, name) {
      delete parent.contents[name];
      parent.timestamp = Date.now();
    },
    rmdir(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.timestamp = Date.now();
    },
    readdir(node) {
      var entries = [".", ".."];
      for (var key in node.contents) {
        if (!node.contents.hasOwnProperty(key)) {
          continue;
        }
        entries.push(key);
      }
      return entries;
    },
    symlink(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    },
    readlink(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    },
  },
  stream_ops: {
    read(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes) return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      if (size > 8 && contents.subarray) {
        buffer.set(contents.subarray(position, position + size), offset);
      } else {
        for (var i = 0; i < size; i++)
          buffer[offset + i] = contents[position + i];
      }
      return size;
    },
    write(stream, buffer, offset, length, position, canOwn) {
      if (buffer.buffer === HEAP8.buffer) {
        canOwn = false;
      }
      if (!length) return 0;
      var node = stream.node;
      node.timestamp = Date.now();
      if (buffer.subarray && (!node.contents || node.contents.subarray)) {
        if (canOwn) {
          node.contents = buffer.subarray(offset, offset + length);
          node.usedBytes = length;
          return length;
        } else if (node.usedBytes === 0 && position === 0) {
          node.contents = buffer.slice(offset, offset + length);
          node.usedBytes = length;
          return length;
        } else if (position + length <= node.usedBytes) {
          node.contents.set(buffer.subarray(offset, offset + length), position);
          return length;
        }
      }
      MEMFS.expandFileStorage(node, position + length);
      if (node.contents.subarray && buffer.subarray) {
        node.contents.set(buffer.subarray(offset, offset + length), position);
      } else {
        for (var i = 0; i < length; i++) {
          node.contents[position + i] = buffer[offset + i];
        }
      }
      node.usedBytes = Math.max(node.usedBytes, position + length);
      return length;
    },
    llseek(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    },
    allocate(stream, offset, length) {
      MEMFS.expandFileStorage(stream.node, offset + length);
      stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
    },
    mmap(stream, length, position, prot, flags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length);
          } else {
            contents = Array.prototype.slice.call(
              contents,
              position,
              position + length
            );
          }
        }
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        HEAP8.set(contents, ptr);
      }
      return { ptr: ptr, allocated: allocated };
    },
    msync(stream, buffer, offset, length, mmapFlags) {
      MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
      return 0;
    },
  },
};
var asyncLoad = (url, onload, onerror, noRunDep) => {
  var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
  readAsync(
    url,
    (arrayBuffer) => {
      assert(
        arrayBuffer,
        `Loading data file "${url}" failed (no arrayBuffer).`
      );
      onload(new Uint8Array(arrayBuffer));
      if (dep) removeRunDependency(dep);
    },
    (event) => {
      if (onerror) {
        onerror();
      } else {
        throw `Loading data file "${url}" failed.`;
      }
    }
  );
  if (dep) addRunDependency(dep);
};
var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) =>
  FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn);
var preloadPlugins = Module["preloadPlugins"] || [];
var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
  if (typeof Browser != "undefined") Browser.init();
  var handled = false;
  preloadPlugins.forEach((plugin) => {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
      plugin["handle"](byteArray, fullname, finish, onerror);
      handled = true;
    }
  });
  return handled;
};
var FS_createPreloadedFile = (
  parent,
  name,
  url,
  canRead,
  canWrite,
  onload,
  onerror,
  dontCreateFile,
  canOwn,
  preFinish
) => {
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency(`cp ${fullname}`);
  function processData(byteArray) {
    function finish(byteArray) {
      if (preFinish) preFinish();
      if (!dontCreateFile) {
        FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
      }
      if (onload) onload();
      removeRunDependency(dep);
    }
    if (
      FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
        if (onerror) onerror();
        removeRunDependency(dep);
      })
    ) {
      return;
    }
    finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
    asyncLoad(url, (byteArray) => processData(byteArray), onerror);
  } else {
    processData(url);
  }
};
var FS_modeStringToFlags = (str) => {
  var flagModes = {
    r: 0,
    "r+": 2,
    w: 512 | 64 | 1,
    "w+": 512 | 64 | 2,
    a: 1024 | 64 | 1,
    "a+": 1024 | 64 | 2,
  };
  var flags = flagModes[str];
  if (typeof flags == "undefined") {
    throw new Error(`Unknown file open mode: ${str}`);
  }
  return flags;
};
var FS_getMode = (canRead, canWrite) => {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
};
var FS = {
  root: null,
  mounts: [],
  devices: {},
  streams: [],
  nextInode: 1,
  nameTable: null,
  currentPath: "/",
  initialized: false,
  ignorePermissions: true,
  ErrnoError: null,
  genericErrors: {},
  filesystems: null,
  syncFSRequests: 0,
  lookupPath(path, opts = {}) {
    path = PATH_FS.resolve(path);
    if (!path) return { path: "", node: null };
    var defaults = { follow_mount: true, recurse_count: 0 };
    opts = Object.assign(defaults, opts);
    if (opts.recurse_count > 8) {
      throw new FS.ErrnoError(32);
    }
    var parts = path.split("/").filter((p) => !!p);
    var current = FS.root;
    var current_path = "/";
    for (var i = 0; i < parts.length; i++) {
      var islast = i === parts.length - 1;
      if (islast && opts.parent) {
        break;
      }
      current = FS.lookupNode(current, parts[i]);
      current_path = PATH.join2(current_path, parts[i]);
      if (FS.isMountpoint(current)) {
        if (!islast || (islast && opts.follow_mount)) {
          current = current.mounted.root;
        }
      }
      if (!islast || opts.follow) {
        var count = 0;
        while (FS.isLink(current.mode)) {
          var link = FS.readlink(current_path);
          current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
          var lookup = FS.lookupPath(current_path, {
            recurse_count: opts.recurse_count + 1,
          });
          current = lookup.node;
          if (count++ > 40) {
            throw new FS.ErrnoError(32);
          }
        }
      }
    }
    return { path: current_path, node: current };
  },
  getPath(node) {
    var path;
    while (true) {
      if (FS.isRoot(node)) {
        var mount = node.mount.mountpoint;
        if (!path) return mount;
        return mount[mount.length - 1] !== "/"
          ? `${mount}/${path}`
          : mount + path;
      }
      path = path ? `${node.name}/${path}` : node.name;
      node = node.parent;
    }
  },
  hashName(parentid, name) {
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
    }
    return ((parentid + hash) >>> 0) % FS.nameTable.length;
  },
  hashAddNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    node.name_next = FS.nameTable[hash];
    FS.nameTable[hash] = node;
  },
  hashRemoveNode(node) {
    var hash = FS.hashName(node.parent.id, node.name);
    if (FS.nameTable[hash] === node) {
      FS.nameTable[hash] = node.name_next;
    } else {
      var current = FS.nameTable[hash];
      while (current) {
        if (current.name_next === node) {
          current.name_next = node.name_next;
          break;
        }
        current = current.name_next;
      }
    }
  },
  lookupNode(parent, name) {
    var errCode = FS.mayLookup(parent);
    if (errCode) {
      throw new FS.ErrnoError(errCode, parent);
    }
    var hash = FS.hashName(parent.id, name);
    for (var node = FS.nameTable[hash]; node; node = node.name_next) {
      var nodeName = node.name;
      if (node.parent.id === parent.id && nodeName === name) {
        return node;
      }
    }
    return FS.lookup(parent, name);
  },
  createNode(parent, name, mode, rdev) {
    var node = new FS.FSNode(parent, name, mode, rdev);
    FS.hashAddNode(node);
    return node;
  },
  destroyNode(node) {
    FS.hashRemoveNode(node);
  },
  isRoot(node) {
    return node === node.parent;
  },
  isMountpoint(node) {
    return !!node.mounted;
  },
  isFile(mode) {
    return (mode & 61440) === 32768;
  },
  isDir(mode) {
    return (mode & 61440) === 16384;
  },
  isLink(mode) {
    return (mode & 61440) === 40960;
  },
  isChrdev(mode) {
    return (mode & 61440) === 8192;
  },
  isBlkdev(mode) {
    return (mode & 61440) === 24576;
  },
  isFIFO(mode) {
    return (mode & 61440) === 4096;
  },
  isSocket(mode) {
    return (mode & 49152) === 49152;
  },
  flagsToPermissionString(flag) {
    var perms = ["r", "w", "rw"][flag & 3];
    if (flag & 512) {
      perms += "w";
    }
    return perms;
  },
  nodePermissions(node, perms) {
    if (FS.ignorePermissions) {
      return 0;
    }
    if (perms.includes("r") && !(node.mode & 292)) {
      return 2;
    } else if (perms.includes("w") && !(node.mode & 146)) {
      return 2;
    } else if (perms.includes("x") && !(node.mode & 73)) {
      return 2;
    }
    return 0;
  },
  mayLookup(dir) {
    var errCode = FS.nodePermissions(dir, "x");
    if (errCode) return errCode;
    if (!dir.node_ops.lookup) return 2;
    return 0;
  },
  mayCreate(dir, name) {
    try {
      var node = FS.lookupNode(dir, name);
      return 20;
    } catch (e) {}
    return FS.nodePermissions(dir, "wx");
  },
  mayDelete(dir, name, isdir) {
    var node;
    try {
      node = FS.lookupNode(dir, name);
    } catch (e) {
      return e.errno;
    }
    var errCode = FS.nodePermissions(dir, "wx");
    if (errCode) {
      return errCode;
    }
    if (isdir) {
      if (!FS.isDir(node.mode)) {
        return 54;
      }
      if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
        return 10;
      }
    } else {
      if (FS.isDir(node.mode)) {
        return 31;
      }
    }
    return 0;
  },
  mayOpen(node, flags) {
    if (!node) {
      return 44;
    }
    if (FS.isLink(node.mode)) {
      return 32;
    } else if (FS.isDir(node.mode)) {
      if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
        return 31;
      }
    }
    return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
  },
  MAX_OPEN_FDS: 4096,
  nextfd() {
    for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
      if (!FS.streams[fd]) {
        return fd;
      }
    }
    throw new FS.ErrnoError(33);
  },
  getStreamChecked(fd) {
    var stream = FS.getStream(fd);
    if (!stream) {
      throw new FS.ErrnoError(8);
    }
    return stream;
  },
  getStream: (fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
    if (!FS.FSStream) {
      FS.FSStream = function () {
        this.shared = {};
      };
      FS.FSStream.prototype = {};
      Object.defineProperties(FS.FSStream.prototype, {
        object: {
          get() {
            return this.node;
          },
          set(val) {
            this.node = val;
          },
        },
        isRead: {
          get() {
            return (this.flags & 2097155) !== 1;
          },
        },
        isWrite: {
          get() {
            return (this.flags & 2097155) !== 0;
          },
        },
        isAppend: {
          get() {
            return this.flags & 1024;
          },
        },
        flags: {
          get() {
            return this.shared.flags;
          },
          set(val) {
            this.shared.flags = val;
          },
        },
        position: {
          get() {
            return this.shared.position;
          },
          set(val) {
            this.shared.position = val;
          },
        },
      });
    }
    stream = Object.assign(new FS.FSStream(), stream);
    if (fd == -1) {
      fd = FS.nextfd();
    }
    stream.fd = fd;
    FS.streams[fd] = stream;
    return stream;
  },
  closeStream(fd) {
    FS.streams[fd] = null;
  },
  chrdev_stream_ops: {
    open(stream) {
      var device = FS.getDevice(stream.node.rdev);
      stream.stream_ops = device.stream_ops;
      if (stream.stream_ops.open) {
        stream.stream_ops.open(stream);
      }
    },
    llseek() {
      throw new FS.ErrnoError(70);
    },
  },
  major: (dev) => dev >> 8,
  minor: (dev) => dev & 255,
  makedev: (ma, mi) => (ma << 8) | mi,
  registerDevice(dev, ops) {
    FS.devices[dev] = { stream_ops: ops };
  },
  getDevice: (dev) => FS.devices[dev],
  getMounts(mount) {
    var mounts = [];
    var check = [mount];
    while (check.length) {
      var m = check.pop();
      mounts.push(m);
      check.push.apply(check, m.mounts);
    }
    return mounts;
  },
  syncfs(populate, callback) {
    if (typeof populate == "function") {
      callback = populate;
      populate = false;
    }
    FS.syncFSRequests++;
    if (FS.syncFSRequests > 1) {
      err(
        `warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`
      );
    }
    var mounts = FS.getMounts(FS.root.mount);
    var completed = 0;
    function doCallback(errCode) {
      FS.syncFSRequests--;
      return callback(errCode);
    }
    function done(errCode) {
      if (errCode) {
        if (!done.errored) {
          done.errored = true;
          return doCallback(errCode);
        }
        return;
      }
      if (++completed >= mounts.length) {
        doCallback(null);
      }
    }
    mounts.forEach((mount) => {
      if (!mount.type.syncfs) {
        return done(null);
      }
      mount.type.syncfs(mount, populate, done);
    });
  },
  mount(type, opts, mountpoint) {
    var root = mountpoint === "/";
    var pseudo = !mountpoint;
    var node;
    if (root && FS.root) {
      throw new FS.ErrnoError(10);
    } else if (!root && !pseudo) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      mountpoint = lookup.path;
      node = lookup.node;
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      if (!FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
    }
    var mount = { type: type, opts: opts, mountpoint: mountpoint, mounts: [] };
    var mountRoot = type.mount(mount);
    mountRoot.mount = mount;
    mount.root = mountRoot;
    if (root) {
      FS.root = mountRoot;
    } else if (node) {
      node.mounted = mount;
      if (node.mount) {
        node.mount.mounts.push(mount);
      }
    }
    return mountRoot;
  },
  unmount(mountpoint) {
    var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
    if (!FS.isMountpoint(lookup.node)) {
      throw new FS.ErrnoError(28);
    }
    var node = lookup.node;
    var mount = node.mounted;
    var mounts = FS.getMounts(mount);
    Object.keys(FS.nameTable).forEach((hash) => {
      var current = FS.nameTable[hash];
      while (current) {
        var next = current.name_next;
        if (mounts.includes(current.mount)) {
          FS.destroyNode(current);
        }
        current = next;
      }
    });
    node.mounted = null;
    var idx = node.mount.mounts.indexOf(mount);
    node.mount.mounts.splice(idx, 1);
  },
  lookup(parent, name) {
    return parent.node_ops.lookup(parent, name);
  },
  mknod(path, mode, dev) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    if (!name || name === "." || name === "..") {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.mayCreate(parent, name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.mknod) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.mknod(parent, name, mode, dev);
  },
  create(path, mode) {
    mode = mode !== undefined ? mode : 438;
    mode &= 4095;
    mode |= 32768;
    return FS.mknod(path, mode, 0);
  },
  mkdir(path, mode) {
    mode = mode !== undefined ? mode : 511;
    mode &= 511 | 512;
    mode |= 16384;
    return FS.mknod(path, mode, 0);
  },
  mkdirTree(path, mode) {
    var dirs = path.split("/");
    var d = "";
    for (var i = 0; i < dirs.length; ++i) {
      if (!dirs[i]) continue;
      d += "/" + dirs[i];
      try {
        FS.mkdir(d, mode);
      } catch (e) {
        if (e.errno != 20) throw e;
      }
    }
  },
  mkdev(path, mode, dev) {
    if (typeof dev == "undefined") {
      dev = mode;
      mode = 438;
    }
    mode |= 8192;
    return FS.mknod(path, mode, dev);
  },
  symlink(oldpath, newpath) {
    if (!PATH_FS.resolve(oldpath)) {
      throw new FS.ErrnoError(44);
    }
    var lookup = FS.lookupPath(newpath, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var newname = PATH.basename(newpath);
    var errCode = FS.mayCreate(parent, newname);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.symlink) {
      throw new FS.ErrnoError(63);
    }
    return parent.node_ops.symlink(parent, newname, oldpath);
  },
  rename(old_path, new_path) {
    var old_dirname = PATH.dirname(old_path);
    var new_dirname = PATH.dirname(new_path);
    var old_name = PATH.basename(old_path);
    var new_name = PATH.basename(new_path);
    var lookup, old_dir, new_dir;
    lookup = FS.lookupPath(old_path, { parent: true });
    old_dir = lookup.node;
    lookup = FS.lookupPath(new_path, { parent: true });
    new_dir = lookup.node;
    if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
    if (old_dir.mount !== new_dir.mount) {
      throw new FS.ErrnoError(75);
    }
    var old_node = FS.lookupNode(old_dir, old_name);
    var relative = PATH_FS.relative(old_path, new_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(28);
    }
    relative = PATH_FS.relative(new_path, old_dirname);
    if (relative.charAt(0) !== ".") {
      throw new FS.ErrnoError(55);
    }
    var new_node;
    try {
      new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (old_node === new_node) {
      return;
    }
    var isdir = FS.isDir(old_node.mode);
    var errCode = FS.mayDelete(old_dir, old_name, isdir);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    errCode = new_node
      ? FS.mayDelete(new_dir, new_name, isdir)
      : FS.mayCreate(new_dir, new_name);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!old_dir.node_ops.rename) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
      throw new FS.ErrnoError(10);
    }
    if (new_dir !== old_dir) {
      errCode = FS.nodePermissions(old_dir, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    FS.hashRemoveNode(old_node);
    try {
      old_dir.node_ops.rename(old_node, new_dir, new_name);
    } catch (e) {
      throw e;
    } finally {
      FS.hashAddNode(old_node);
    }
  },
  rmdir(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, true);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.rmdir) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.rmdir(parent, name);
    FS.destroyNode(node);
  },
  readdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    if (!node.node_ops.readdir) {
      throw new FS.ErrnoError(54);
    }
    return node.node_ops.readdir(node);
  },
  unlink(path) {
    var lookup = FS.lookupPath(path, { parent: true });
    var parent = lookup.node;
    if (!parent) {
      throw new FS.ErrnoError(44);
    }
    var name = PATH.basename(path);
    var node = FS.lookupNode(parent, name);
    var errCode = FS.mayDelete(parent, name, false);
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    if (!parent.node_ops.unlink) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isMountpoint(node)) {
      throw new FS.ErrnoError(10);
    }
    parent.node_ops.unlink(parent, name);
    FS.destroyNode(node);
  },
  readlink(path) {
    var lookup = FS.lookupPath(path);
    var link = lookup.node;
    if (!link) {
      throw new FS.ErrnoError(44);
    }
    if (!link.node_ops.readlink) {
      throw new FS.ErrnoError(28);
    }
    return PATH_FS.resolve(
      FS.getPath(link.parent),
      link.node_ops.readlink(link)
    );
  },
  stat(path, dontFollow) {
    var lookup = FS.lookupPath(path, { follow: !dontFollow });
    var node = lookup.node;
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (!node.node_ops.getattr) {
      throw new FS.ErrnoError(63);
    }
    return node.node_ops.getattr(node);
  },
  lstat(path) {
    return FS.stat(path, true);
  },
  chmod(path, mode, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63);
    }
    node.node_ops.setattr(node, {
      mode: (mode & 4095) | (node.mode & ~4095),
      timestamp: Date.now(),
    });
  },
  lchmod(path, mode) {
    FS.chmod(path, mode, true);
  },
  fchmod(fd, mode) {
    var stream = FS.getStreamChecked(fd);
    FS.chmod(stream.node, mode);
  },
  chown(path, uid, gid, dontFollow) {
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      node = lookup.node;
    } else {
      node = path;
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63);
    }
    node.node_ops.setattr(node, { timestamp: Date.now() });
  },
  lchown(path, uid, gid) {
    FS.chown(path, uid, gid, true);
  },
  fchown(fd, uid, gid) {
    var stream = FS.getStreamChecked(fd);
    FS.chown(stream.node, uid, gid);
  },
  truncate(path, len) {
    if (len < 0) {
      throw new FS.ErrnoError(28);
    }
    var node;
    if (typeof path == "string") {
      var lookup = FS.lookupPath(path, { follow: true });
      node = lookup.node;
    } else {
      node = path;
    }
    if (!node.node_ops.setattr) {
      throw new FS.ErrnoError(63);
    }
    if (FS.isDir(node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!FS.isFile(node.mode)) {
      throw new FS.ErrnoError(28);
    }
    var errCode = FS.nodePermissions(node, "w");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
  },
  ftruncate(fd, len) {
    var stream = FS.getStreamChecked(fd);
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(28);
    }
    FS.truncate(stream.node, len);
  },
  utime(path, atime, mtime) {
    var lookup = FS.lookupPath(path, { follow: true });
    var node = lookup.node;
    node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
  },
  open(path, flags, mode) {
    if (path === "") {
      throw new FS.ErrnoError(44);
    }
    flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
    mode = typeof mode == "undefined" ? 438 : mode;
    if (flags & 64) {
      mode = (mode & 4095) | 32768;
    } else {
      mode = 0;
    }
    var node;
    if (typeof path == "object") {
      node = path;
    } else {
      path = PATH.normalize(path);
      try {
        var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
        node = lookup.node;
      } catch (e) {}
    }
    var created = false;
    if (flags & 64) {
      if (node) {
        if (flags & 128) {
          throw new FS.ErrnoError(20);
        }
      } else {
        node = FS.mknod(path, mode, 0);
        created = true;
      }
    }
    if (!node) {
      throw new FS.ErrnoError(44);
    }
    if (FS.isChrdev(node.mode)) {
      flags &= ~512;
    }
    if (flags & 65536 && !FS.isDir(node.mode)) {
      throw new FS.ErrnoError(54);
    }
    if (!created) {
      var errCode = FS.mayOpen(node, flags);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
    }
    if (flags & 512 && !created) {
      FS.truncate(node, 0);
    }
    flags &= ~(128 | 512 | 131072);
    var stream = FS.createStream({
      node: node,
      path: FS.getPath(node),
      flags: flags,
      seekable: true,
      position: 0,
      stream_ops: node.stream_ops,
      ungotten: [],
      error: false,
    });
    if (stream.stream_ops.open) {
      stream.stream_ops.open(stream);
    }
    if (Module["logReadFiles"] && !(flags & 1)) {
      if (!FS.readFiles) FS.readFiles = {};
      if (!(path in FS.readFiles)) {
        FS.readFiles[path] = 1;
      }
    }
    return stream;
  },
  close(stream) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (stream.getdents) stream.getdents = null;
    try {
      if (stream.stream_ops.close) {
        stream.stream_ops.close(stream);
      }
    } catch (e) {
      throw e;
    } finally {
      FS.closeStream(stream.fd);
    }
    stream.fd = null;
  },
  isClosed(stream) {
    return stream.fd === null;
  },
  llseek(stream, offset, whence) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (!stream.seekable || !stream.stream_ops.llseek) {
      throw new FS.ErrnoError(70);
    }
    if (whence != 0 && whence != 1 && whence != 2) {
      throw new FS.ErrnoError(28);
    }
    stream.position = stream.stream_ops.llseek(stream, offset, whence);
    stream.ungotten = [];
    return stream.position;
  },
  read(stream, buffer, offset, length, position) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.read) {
      throw new FS.ErrnoError(28);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesRead = stream.stream_ops.read(
      stream,
      buffer,
      offset,
      length,
      position
    );
    if (!seeking) stream.position += bytesRead;
    return bytesRead;
  },
  write(stream, buffer, offset, length, position, canOwn) {
    if (length < 0 || position < 0) {
      throw new FS.ErrnoError(28);
    }
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(31);
    }
    if (!stream.stream_ops.write) {
      throw new FS.ErrnoError(28);
    }
    if (stream.seekable && stream.flags & 1024) {
      FS.llseek(stream, 0, 2);
    }
    var seeking = typeof position != "undefined";
    if (!seeking) {
      position = stream.position;
    } else if (!stream.seekable) {
      throw new FS.ErrnoError(70);
    }
    var bytesWritten = stream.stream_ops.write(
      stream,
      buffer,
      offset,
      length,
      position,
      canOwn
    );
    if (!seeking) stream.position += bytesWritten;
    return bytesWritten;
  },
  allocate(stream, offset, length) {
    if (FS.isClosed(stream)) {
      throw new FS.ErrnoError(8);
    }
    if (offset < 0 || length <= 0) {
      throw new FS.ErrnoError(28);
    }
    if ((stream.flags & 2097155) === 0) {
      throw new FS.ErrnoError(8);
    }
    if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (!stream.stream_ops.allocate) {
      throw new FS.ErrnoError(138);
    }
    stream.stream_ops.allocate(stream, offset, length);
  },
  mmap(stream, length, position, prot, flags) {
    if (
      (prot & 2) !== 0 &&
      (flags & 2) === 0 &&
      (stream.flags & 2097155) !== 2
    ) {
      throw new FS.ErrnoError(2);
    }
    if ((stream.flags & 2097155) === 1) {
      throw new FS.ErrnoError(2);
    }
    if (!stream.stream_ops.mmap) {
      throw new FS.ErrnoError(43);
    }
    return stream.stream_ops.mmap(stream, length, position, prot, flags);
  },
  msync(stream, buffer, offset, length, mmapFlags) {
    if (!stream.stream_ops.msync) {
      return 0;
    }
    return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
  },
  munmap: (stream) => 0,
  ioctl(stream, cmd, arg) {
    if (!stream.stream_ops.ioctl) {
      throw new FS.ErrnoError(59);
    }
    return stream.stream_ops.ioctl(stream, cmd, arg);
  },
  readFile(path, opts = {}) {
    opts.flags = opts.flags || 0;
    opts.encoding = opts.encoding || "binary";
    if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
      throw new Error(`Invalid encoding type "${opts.encoding}"`);
    }
    var ret;
    var stream = FS.open(path, opts.flags);
    var stat = FS.stat(path);
    var length = stat.size;
    var buf = new Uint8Array(length);
    FS.read(stream, buf, 0, length, 0);
    if (opts.encoding === "utf8") {
      ret = UTF8ArrayToString(buf, 0);
    } else if (opts.encoding === "binary") {
      ret = buf;
    }
    FS.close(stream);
    return ret;
  },
  writeFile(path, data, opts = {}) {
    opts.flags = opts.flags || 577;
    var stream = FS.open(path, opts.flags, opts.mode);
    if (typeof data == "string") {
      var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
      var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
      FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
    } else if (ArrayBuffer.isView(data)) {
      FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
    } else {
      throw new Error("Unsupported data type");
    }
    FS.close(stream);
  },
  cwd: () => FS.currentPath,
  chdir(path) {
    var lookup = FS.lookupPath(path, { follow: true });
    if (lookup.node === null) {
      throw new FS.ErrnoError(44);
    }
    if (!FS.isDir(lookup.node.mode)) {
      throw new FS.ErrnoError(54);
    }
    var errCode = FS.nodePermissions(lookup.node, "x");
    if (errCode) {
      throw new FS.ErrnoError(errCode);
    }
    FS.currentPath = lookup.path;
  },
  createDefaultDirectories() {
    FS.mkdir("/tmp");
    FS.mkdir("/home");
    FS.mkdir("/home/web_user");
  },
  createDefaultDevices() {
    FS.mkdir("/dev");
    FS.registerDevice(FS.makedev(1, 3), {
      read: () => 0,
      write: (stream, buffer, offset, length, pos) => length,
    });
    FS.mkdev("/dev/null", FS.makedev(1, 3));
    TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
    TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
    FS.mkdev("/dev/tty", FS.makedev(5, 0));
    FS.mkdev("/dev/tty1", FS.makedev(6, 0));
    var randomBuffer = new Uint8Array(1024),
      randomLeft = 0;
    var randomByte = () => {
      if (randomLeft === 0) {
        randomLeft = randomFill(randomBuffer).byteLength;
      }
      return randomBuffer[--randomLeft];
    };
    FS.createDevice("/dev", "random", randomByte);
    FS.createDevice("/dev", "urandom", randomByte);
    FS.mkdir("/dev/shm");
    FS.mkdir("/dev/shm/tmp");
  },
  createSpecialDirectories() {
    FS.mkdir("/proc");
    var proc_self = FS.mkdir("/proc/self");
    FS.mkdir("/proc/self/fd");
    FS.mount(
      {
        mount() {
          var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
          node.node_ops = {
            lookup(parent, name) {
              var fd = +name;
              var stream = FS.getStreamChecked(fd);
              var ret = {
                parent: null,
                mount: { mountpoint: "fake" },
                node_ops: { readlink: () => stream.path },
              };
              ret.parent = ret;
              return ret;
            },
          };
          return node;
        },
      },
      {},
      "/proc/self/fd"
    );
  },
  createStandardStreams() {
    if (Module["stdin"]) {
      FS.createDevice("/dev", "stdin", Module["stdin"]);
    } else {
      FS.symlink("/dev/tty", "/dev/stdin");
    }
    if (Module["stdout"]) {
      FS.createDevice("/dev", "stdout", null, Module["stdout"]);
    } else {
      FS.symlink("/dev/tty", "/dev/stdout");
    }
    if (Module["stderr"]) {
      FS.createDevice("/dev", "stderr", null, Module["stderr"]);
    } else {
      FS.symlink("/dev/tty1", "/dev/stderr");
    }
    var stdin = FS.open("/dev/stdin", 0);
    var stdout = FS.open("/dev/stdout", 1);
    var stderr = FS.open("/dev/stderr", 1);
  },
  ensureErrnoError() {
    if (FS.ErrnoError) return;
    FS.ErrnoError = function ErrnoError(errno, node) {
      this.name = "ErrnoError";
      this.node = node;
      this.setErrno = function (errno) {
        this.errno = errno;
      };
      this.setErrno(errno);
      this.message = "FS error";
    };
    FS.ErrnoError.prototype = new Error();
    FS.ErrnoError.prototype.constructor = FS.ErrnoError;
    [44].forEach((code) => {
      FS.genericErrors[code] = new FS.ErrnoError(code);
      FS.genericErrors[code].stack = "<generic error, no stack>";
    });
  },
  staticInit() {
    FS.ensureErrnoError();
    FS.nameTable = new Array(4096);
    FS.mount(MEMFS, {}, "/");
    FS.createDefaultDirectories();
    FS.createDefaultDevices();
    FS.createSpecialDirectories();
    FS.filesystems = { MEMFS: MEMFS };
  },
  init(input, output, error) {
    FS.init.initialized = true;
    FS.ensureErrnoError();
    Module["stdin"] = input || Module["stdin"];
    Module["stdout"] = output || Module["stdout"];
    Module["stderr"] = error || Module["stderr"];
    FS.createStandardStreams();
  },
  quit() {
    FS.init.initialized = false;
    _fflush(0);
    for (var i = 0; i < FS.streams.length; i++) {
      var stream = FS.streams[i];
      if (!stream) {
        continue;
      }
      FS.close(stream);
    }
  },
  findObject(path, dontResolveLastLink) {
    var ret = FS.analyzePath(path, dontResolveLastLink);
    if (!ret.exists) {
      return null;
    }
    return ret.object;
  },
  analyzePath(path, dontResolveLastLink) {
    try {
      var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      path = lookup.path;
    } catch (e) {}
    var ret = {
      isRoot: false,
      exists: false,
      error: 0,
      name: null,
      path: null,
      object: null,
      parentExists: false,
      parentPath: null,
      parentObject: null,
    };
    try {
      var lookup = FS.lookupPath(path, { parent: true });
      ret.parentExists = true;
      ret.parentPath = lookup.path;
      ret.parentObject = lookup.node;
      ret.name = PATH.basename(path);
      lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
      ret.exists = true;
      ret.path = lookup.path;
      ret.object = lookup.node;
      ret.name = lookup.node.name;
      ret.isRoot = lookup.path === "/";
    } catch (e) {
      ret.error = e.errno;
    }
    return ret;
  },
  createPath(parent, path, canRead, canWrite) {
    parent = typeof parent == "string" ? parent : FS.getPath(parent);
    var parts = path.split("/").reverse();
    while (parts.length) {
      var part = parts.pop();
      if (!part) continue;
      var current = PATH.join2(parent, part);
      try {
        FS.mkdir(current);
      } catch (e) {}
      parent = current;
    }
    return current;
  },
  createFile(parent, name, properties, canRead, canWrite) {
    var path = PATH.join2(
      typeof parent == "string" ? parent : FS.getPath(parent),
      name
    );
    var mode = FS_getMode(canRead, canWrite);
    return FS.create(path, mode);
  },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
    var path = name;
    if (parent) {
      parent = typeof parent == "string" ? parent : FS.getPath(parent);
      path = name ? PATH.join2(parent, name) : parent;
    }
    var mode = FS_getMode(canRead, canWrite);
    var node = FS.create(path, mode);
    if (data) {
      if (typeof data == "string") {
        var arr = new Array(data.length);
        for (var i = 0, len = data.length; i < len; ++i)
          arr[i] = data.charCodeAt(i);
        data = arr;
      }
      FS.chmod(node, mode | 146);
      var stream = FS.open(node, 577);
      FS.write(stream, data, 0, data.length, 0, canOwn);
      FS.close(stream);
      FS.chmod(node, mode);
    }
    return node;
  },
  createDevice(parent, name, input, output) {
    var path = PATH.join2(
      typeof parent == "string" ? parent : FS.getPath(parent),
      name
    );
    var mode = FS_getMode(!!input, !!output);
    if (!FS.createDevice.major) FS.createDevice.major = 64;
    var dev = FS.makedev(FS.createDevice.major++, 0);
    FS.registerDevice(dev, {
      open(stream) {
        stream.seekable = false;
      },
      close(stream) {
        if (output && output.buffer && output.buffer.length) {
          output(10);
        }
      },
      read(stream, buffer, offset, length, pos) {
        var bytesRead = 0;
        for (var i = 0; i < length; i++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === undefined && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === undefined) break;
          bytesRead++;
          buffer[offset + i] = result;
        }
        if (bytesRead) {
          stream.node.timestamp = Date.now();
        }
        return bytesRead;
      },
      write(stream, buffer, offset, length, pos) {
        for (var i = 0; i < length; i++) {
          try {
            output(buffer[offset + i]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.timestamp = Date.now();
        }
        return i;
      },
    });
    return FS.mkdev(path, mode, dev);
  },
  forceLoadFile(obj) {
    if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
    if (typeof XMLHttpRequest != "undefined") {
      throw new Error(
        "Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread."
      );
    } else if (read_) {
      try {
        obj.contents = intArrayFromString(read_(obj.url), true);
        obj.usedBytes = obj.contents.length;
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
    } else {
      throw new Error("Cannot load without read() or XMLHttpRequest.");
    }
  },
  createLazyFile(parent, name, url, canRead, canWrite) {
    function LazyUint8Array() {
      this.lengthKnown = false;
      this.chunks = [];
    }
    LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
      if (idx > this.length - 1 || idx < 0) {
        return undefined;
      }
      var chunkOffset = idx % this.chunkSize;
      var chunkNum = (idx / this.chunkSize) | 0;
      return this.getter(chunkNum)[chunkOffset];
    };
    LazyUint8Array.prototype.setDataGetter =
      function LazyUint8Array_setDataGetter(getter) {
        this.getter = getter;
      };
    LazyUint8Array.prototype.cacheLength =
      function LazyUint8Array_cacheLength() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
          throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing =
          (header = xhr.getResponseHeader("Accept-Ranges")) &&
          header === "bytes";
        var usesGzip =
          (header = xhr.getResponseHeader("Content-Encoding")) &&
          header === "gzip";
        var chunkSize = 1024 * 1024;
        if (!hasByteServing) chunkSize = datalength;
        var doXHR = (from, to) => {
          if (from > to)
            throw new Error(
              "invalid range (" + from + ", " + to + ") or no bytes requested!"
            );
          if (to > datalength - 1)
            throw new Error(
              "only " + datalength + " bytes available! programmer error!"
            );
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          if (datalength !== chunkSize)
            xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
          xhr.responseType = "arraybuffer";
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr.send(null);
          if (!((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304))
            throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          if (xhr.response !== undefined) {
            return new Uint8Array(xhr.response || []);
          }
          return intArrayFromString(xhr.responseText || "", true);
        };
        var lazyArray = this;
        lazyArray.setDataGetter((chunkNum) => {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          end = Math.min(end, datalength - 1);
          if (typeof lazyArray.chunks[chunkNum] == "undefined") {
            lazyArray.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray.chunks[chunkNum] == "undefined")
            throw new Error("doXHR failed!");
          return lazyArray.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          chunkSize = datalength = 1;
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out(
            "LazyFiles on gzip forces download of the whole file when length is accessed"
          );
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      };
    if (typeof XMLHttpRequest != "undefined") {
      if (!ENVIRONMENT_IS_WORKER)
        throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
      var lazyArray = new LazyUint8Array();
      Object.defineProperties(lazyArray, {
        length: {
          get: function () {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          },
        },
        chunkSize: {
          get: function () {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          },
        },
      });
      var properties = { isDevice: false, contents: lazyArray };
    } else {
      var properties = { isDevice: false, url: url };
    }
    var node = FS.createFile(parent, name, properties, canRead, canWrite);
    if (properties.contents) {
      node.contents = properties.contents;
    } else if (properties.url) {
      node.contents = null;
      node.url = properties.url;
    }
    Object.defineProperties(node, {
      usedBytes: {
        get: function () {
          return this.contents.length;
        },
      },
    });
    var stream_ops = {};
    var keys = Object.keys(node.stream_ops);
    keys.forEach((key) => {
      var fn = node.stream_ops[key];
      stream_ops[key] = function forceLoadLazyFile() {
        FS.forceLoadFile(node);
        return fn.apply(null, arguments);
      };
    });
    function writeChunks(stream, buffer, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= contents.length) return 0;
      var size = Math.min(contents.length - position, length);
      if (contents.slice) {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents[position + i];
        }
      } else {
        for (var i = 0; i < size; i++) {
          buffer[offset + i] = contents.get(position + i);
        }
      }
      return size;
    }
    stream_ops.read = (stream, buffer, offset, length, position) => {
      FS.forceLoadFile(node);
      return writeChunks(stream, buffer, offset, length, position);
    };
    stream_ops.mmap = (stream, length, position, prot, flags) => {
      FS.forceLoadFile(node);
      var ptr = mmapAlloc(length);
      if (!ptr) {
        throw new FS.ErrnoError(48);
      }
      writeChunks(stream, HEAP8, ptr, length, position);
      return { ptr: ptr, allocated: true };
    };
    node.stream_ops = stream_ops;
    return node;
  },
};
var SYSCALLS = {
  DEFAULT_POLLMASK: 5,
  calculateAt(dirfd, path, allowEmpty) {
    if (PATH.isAbs(path)) {
      return path;
    }
    var dir;
    if (dirfd === -100) {
      dir = FS.cwd();
    } else {
      var dirstream = SYSCALLS.getStreamFromFD(dirfd);
      dir = dirstream.path;
    }
    if (path.length == 0) {
      if (!allowEmpty) {
        throw new FS.ErrnoError(44);
      }
      return dir;
    }
    return PATH.join2(dir, path);
  },
  doStat(func, path, buf) {
    try {
      var stat = func(path);
    } catch (e) {
      if (
        e &&
        e.node &&
        PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))
      ) {
        return -54;
      }
      throw e;
    }
    HEAP32[buf >> 2] = stat.dev;
    HEAP32[(buf + 4) >> 2] = stat.mode;
    HEAPU32[(buf + 8) >> 2] = stat.nlink;
    HEAP32[(buf + 12) >> 2] = stat.uid;
    HEAP32[(buf + 16) >> 2] = stat.gid;
    HEAP32[(buf + 20) >> 2] = stat.rdev;
    (tempI64 = [
      stat.size >>> 0,
      ((tempDouble = stat.size),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 24) >> 2] = tempI64[0]),
      (HEAP32[(buf + 28) >> 2] = tempI64[1]);
    HEAP32[(buf + 32) >> 2] = 4096;
    HEAP32[(buf + 36) >> 2] = stat.blocks;
    var atime = stat.atime.getTime();
    var mtime = stat.mtime.getTime();
    var ctime = stat.ctime.getTime();
    (tempI64 = [
      Math.floor(atime / 1e3) >>> 0,
      ((tempDouble = Math.floor(atime / 1e3)),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 40) >> 2] = tempI64[0]),
      (HEAP32[(buf + 44) >> 2] = tempI64[1]);
    HEAPU32[(buf + 48) >> 2] = (atime % 1e3) * 1e3;
    (tempI64 = [
      Math.floor(mtime / 1e3) >>> 0,
      ((tempDouble = Math.floor(mtime / 1e3)),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 56) >> 2] = tempI64[0]),
      (HEAP32[(buf + 60) >> 2] = tempI64[1]);
    HEAPU32[(buf + 64) >> 2] = (mtime % 1e3) * 1e3;
    (tempI64 = [
      Math.floor(ctime / 1e3) >>> 0,
      ((tempDouble = Math.floor(ctime / 1e3)),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 72) >> 2] = tempI64[0]),
      (HEAP32[(buf + 76) >> 2] = tempI64[1]);
    HEAPU32[(buf + 80) >> 2] = (ctime % 1e3) * 1e3;
    (tempI64 = [
      stat.ino >>> 0,
      ((tempDouble = stat.ino),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[(buf + 88) >> 2] = tempI64[0]),
      (HEAP32[(buf + 92) >> 2] = tempI64[1]);
    return 0;
  },
  doMsync(addr, stream, len, flags, offset) {
    if (!FS.isFile(stream.node.mode)) {
      throw new FS.ErrnoError(43);
    }
    if (flags & 2) {
      return 0;
    }
    var buffer = HEAPU8.slice(addr, addr + len);
    FS.msync(stream, buffer, offset, len, flags);
  },
  varargs: undefined,
  get() {
    var ret = HEAP32[+SYSCALLS.varargs >> 2];
    SYSCALLS.varargs += 4;
    return ret;
  },
  getp() {
    return SYSCALLS.get();
  },
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  },
  getStreamFromFD(fd) {
    var stream = FS.getStreamChecked(fd);
    return stream;
  },
};
function ___syscall_fcntl64(fd, cmd, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (cmd) {
      case 0: {
        var arg = SYSCALLS.get();
        if (arg < 0) {
          return -28;
        }
        while (FS.streams[arg]) {
          arg++;
        }
        var newStream;
        newStream = FS.createStream(stream, arg);
        return newStream.fd;
      }
      case 1:
      case 2:
        return 0;
      case 3:
        return stream.flags;
      case 4: {
        var arg = SYSCALLS.get();
        stream.flags |= arg;
        return 0;
      }
      case 5: {
        var arg = SYSCALLS.getp();
        var offset = 0;
        HEAP16[(arg + offset) >> 1] = 2;
        return 0;
      }
      case 6:
      case 7:
        return 0;
      case 16:
      case 8:
        return -28;
      case 9:
        setErrNo(28);
        return -1;
      default: {
        return -28;
      }
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}
function ___syscall_ioctl(fd, op, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    switch (op) {
      case 21509: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21505: {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcgets) {
          var termios = stream.tty.ops.ioctl_tcgets(stream);
          var argp = SYSCALLS.getp();
          HEAP32[argp >> 2] = termios.c_iflag || 0;
          HEAP32[(argp + 4) >> 2] = termios.c_oflag || 0;
          HEAP32[(argp + 8) >> 2] = termios.c_cflag || 0;
          HEAP32[(argp + 12) >> 2] = termios.c_lflag || 0;
          for (var i = 0; i < 32; i++) {
            HEAP8[(argp + i + 17) >> 0] = termios.c_cc[i] || 0;
          }
          return 0;
        }
        return 0;
      }
      case 21510:
      case 21511:
      case 21512: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21506:
      case 21507:
      case 21508: {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tcsets) {
          var argp = SYSCALLS.getp();
          var c_iflag = HEAP32[argp >> 2];
          var c_oflag = HEAP32[(argp + 4) >> 2];
          var c_cflag = HEAP32[(argp + 8) >> 2];
          var c_lflag = HEAP32[(argp + 12) >> 2];
          var c_cc = [];
          for (var i = 0; i < 32; i++) {
            c_cc.push(HEAP8[(argp + i + 17) >> 0]);
          }
          return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
            c_iflag: c_iflag,
            c_oflag: c_oflag,
            c_cflag: c_cflag,
            c_lflag: c_lflag,
            c_cc: c_cc,
          });
        }
        return 0;
      }
      case 21519: {
        if (!stream.tty) return -59;
        var argp = SYSCALLS.getp();
        HEAP32[argp >> 2] = 0;
        return 0;
      }
      case 21520: {
        if (!stream.tty) return -59;
        return -28;
      }
      case 21531: {
        var argp = SYSCALLS.getp();
        return FS.ioctl(stream, op, argp);
      }
      case 21523: {
        if (!stream.tty) return -59;
        if (stream.tty.ops.ioctl_tiocgwinsz) {
          var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
          var argp = SYSCALLS.getp();
          HEAP16[argp >> 1] = winsize[0];
          HEAP16[(argp + 2) >> 1] = winsize[1];
        }
        return 0;
      }
      case 21524: {
        if (!stream.tty) return -59;
        return 0;
      }
      case 21515: {
        if (!stream.tty) return -59;
        return 0;
      }
      default:
        return -28;
    }
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    path = SYSCALLS.getStr(path);
    path = SYSCALLS.calculateAt(dirfd, path);
    var mode = varargs ? SYSCALLS.get() : 0;
    return FS.open(path, flags, mode).fd;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return -e.errno;
  }
}
var __embind_register_bigint = (
  primitiveType,
  name,
  size,
  minRange,
  maxRange
) => {};
var embind_init_charCodes = () => {
  var codes = new Array(256);
  for (var i = 0; i < 256; ++i) {
    codes[i] = String.fromCharCode(i);
  }
  embind_charCodes = codes;
};
var embind_charCodes;
var readLatin1String = (ptr) => {
  var ret = "";
  var c = ptr;
  while (HEAPU8[c]) {
    ret += embind_charCodes[HEAPU8[c++]];
  }
  return ret;
};
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var BindingError;
var throwBindingError = (message) => {
  throw new BindingError(message);
};
var InternalError;
function sharedRegisterType(rawType, registeredInstance, options = {}) {
  var name = registeredInstance.name;
  if (!rawType) {
    throwBindingError(
      `type "${name}" must have a positive integer typeid pointer`
    );
  }
  if (registeredTypes.hasOwnProperty(rawType)) {
    if (options.ignoreDuplicateRegistrations) {
      return;
    } else {
      throwBindingError(`Cannot register type '${name}' twice`);
    }
  }
  registeredTypes[rawType] = registeredInstance;
  delete typeDependencies[rawType];
  if (awaitingDependencies.hasOwnProperty(rawType)) {
    var callbacks = awaitingDependencies[rawType];
    delete awaitingDependencies[rawType];
    callbacks.forEach((cb) => cb());
  }
}
function registerType(rawType, registeredInstance, options = {}) {
  if (!("argPackAdvance" in registeredInstance)) {
    throw new TypeError(
      "registerType registeredInstance requires argPackAdvance"
    );
  }
  return sharedRegisterType(rawType, registeredInstance, options);
}
var GenericWireTypeSize = 8;
var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    fromWireType: function (wt) {
      return !!wt;
    },
    toWireType: function (destructors, o) {
      return o ? trueValue : falseValue;
    },
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: function (pointer) {
      return this["fromWireType"](HEAPU8[pointer]);
    },
    destructorFunction: null,
  });
};
function handleAllocatorInit() {
  Object.assign(HandleAllocator.prototype, {
    get(id) {
      return this.allocated[id];
    },
    has(id) {
      return this.allocated[id] !== undefined;
    },
    allocate(handle) {
      var id = this.freelist.pop() || this.allocated.length;
      this.allocated[id] = handle;
      return id;
    },
    free(id) {
      this.allocated[id] = undefined;
      this.freelist.push(id);
    },
  });
}
function HandleAllocator() {
  this.allocated = [undefined];
  this.freelist = [];
}
var emval_handles = new HandleAllocator();
var __emval_decref = (handle) => {
  if (
    handle >= emval_handles.reserved &&
    0 === --emval_handles.get(handle).refcount
  ) {
    emval_handles.free(handle);
  }
};
var count_emval_handles = () => {
  var count = 0;
  for (
    var i = emval_handles.reserved;
    i < emval_handles.allocated.length;
    ++i
  ) {
    if (emval_handles.allocated[i] !== undefined) {
      ++count;
    }
  }
  return count;
};
var init_emval = () => {
  emval_handles.allocated.push(
    { value: undefined },
    { value: null },
    { value: true },
    { value: false }
  );
  emval_handles.reserved = emval_handles.allocated.length;
  Module["count_emval_handles"] = count_emval_handles;
};
var Emval = {
  toValue: (handle) => {
    if (!handle) {
      throwBindingError("Cannot use deleted val. handle = " + handle);
    }
    return emval_handles.get(handle).value;
  },
  toHandle: (value) => {
    switch (value) {
      case undefined:
        return 1;
      case null:
        return 2;
      case true:
        return 3;
      case false:
        return 4;
      default: {
        return emval_handles.allocate({ refcount: 1, value: value });
      }
    }
  },
};
function simpleReadValueFromPointer(pointer) {
  return this["fromWireType"](HEAP32[pointer >> 2]);
}
var __embind_register_emval = (rawType, name) => {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    fromWireType: (handle) => {
      var rv = Emval.toValue(handle);
      __emval_decref(handle);
      return rv;
    },
    toWireType: (destructors, value) => Emval.toHandle(value),
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: simpleReadValueFromPointer,
    destructorFunction: null,
  });
};
var floatReadValueFromPointer = (name, width) => {
  switch (width) {
    case 4:
      return function (pointer) {
        return this["fromWireType"](HEAPF32[pointer >> 2]);
      };
    case 8:
      return function (pointer) {
        return this["fromWireType"](HEAPF64[pointer >> 3]);
      };
    default:
      throw new TypeError(`invalid float width (${width}): ${name}`);
  }
};
var __embind_register_float = (rawType, name, size) => {
  name = readLatin1String(name);
  registerType(rawType, {
    name: name,
    fromWireType: (value) => value,
    toWireType: (destructors, value) => value,
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: floatReadValueFromPointer(name, size),
    destructorFunction: null,
  });
};
var integerReadValueFromPointer = (name, width, signed) => {
  switch (width) {
    case 1:
      return signed
        ? (pointer) => HEAP8[pointer >> 0]
        : (pointer) => HEAPU8[pointer >> 0];
    case 2:
      return signed
        ? (pointer) => HEAP16[pointer >> 1]
        : (pointer) => HEAPU16[pointer >> 1];
    case 4:
      return signed
        ? (pointer) => HEAP32[pointer >> 2]
        : (pointer) => HEAPU32[pointer >> 2];
    default:
      throw new TypeError(`invalid integer width (${width}): ${name}`);
  }
};
var __embind_register_integer = (
  primitiveType,
  name,
  size,
  minRange,
  maxRange
) => {
  name = readLatin1String(name);
  if (maxRange === -1) {
    maxRange = 4294967295;
  }
  var fromWireType = (value) => value;
  if (minRange === 0) {
    var bitshift = 32 - 8 * size;
    fromWireType = (value) => (value << bitshift) >>> bitshift;
  }
  var isUnsignedType = name.includes("unsigned");
  var checkAssertions = (value, toTypeName) => {};
  var toWireType;
  if (isUnsignedType) {
    toWireType = function (destructors, value) {
      checkAssertions(value, this.name);
      return value >>> 0;
    };
  } else {
    toWireType = function (destructors, value) {
      checkAssertions(value, this.name);
      return value;
    };
  }
  registerType(primitiveType, {
    name: name,
    fromWireType: fromWireType,
    toWireType: toWireType,
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: integerReadValueFromPointer(
      name,
      size,
      minRange !== 0
    ),
    destructorFunction: null,
  });
};
var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
  var typeMapping = [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
  ];
  var TA = typeMapping[dataTypeIndex];
  function decodeMemoryView(handle) {
    var size = HEAPU32[handle >> 2];
    var data = HEAPU32[(handle + 4) >> 2];
    return new TA(HEAP8.buffer, data, size);
  }
  name = readLatin1String(name);
  registerType(
    rawType,
    {
      name: name,
      fromWireType: decodeMemoryView,
      argPackAdvance: GenericWireTypeSize,
      readValueFromPointer: decodeMemoryView,
    },
    { ignoreDuplicateRegistrations: true }
  );
};
function readPointer(pointer) {
  return this["fromWireType"](HEAPU32[pointer >> 2]);
}
var stringToUTF8 = (str, outPtr, maxBytesToWrite) =>
  stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
var __embind_register_std_string = (rawType, name) => {
  name = readLatin1String(name);
  var stdStringIsUTF8 = name === "std::string";
  registerType(rawType, {
    name: name,
    fromWireType(value) {
      var length = HEAPU32[value >> 2];
      var payload = value + 4;
      var str;
      if (stdStringIsUTF8) {
        var decodeStartPtr = payload;
        for (var i = 0; i <= length; ++i) {
          var currentBytePtr = payload + i;
          if (i == length || HEAPU8[currentBytePtr] == 0) {
            var maxRead = currentBytePtr - decodeStartPtr;
            var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
            if (str === undefined) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }
            decodeStartPtr = currentBytePtr + 1;
          }
        }
      } else {
        var a = new Array(length);
        for (var i = 0; i < length; ++i) {
          a[i] = String.fromCharCode(HEAPU8[payload + i]);
        }
        str = a.join("");
      }
      _free(value);
      return str;
    },
    toWireType(destructors, value) {
      if (value instanceof ArrayBuffer) {
        value = new Uint8Array(value);
      }
      var length;
      var valueIsOfTypeString = typeof value == "string";
      if (
        !(
          valueIsOfTypeString ||
          value instanceof Uint8Array ||
          value instanceof Uint8ClampedArray ||
          value instanceof Int8Array
        )
      ) {
        throwBindingError("Cannot pass non-string to std::string");
      }
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        length = lengthBytesUTF8(value);
      } else {
        length = value.length;
      }
      var base = _malloc(4 + length + 1);
      var ptr = base + 4;
      HEAPU32[base >> 2] = length;
      if (stdStringIsUTF8 && valueIsOfTypeString) {
        stringToUTF8(value, ptr, length + 1);
      } else {
        if (valueIsOfTypeString) {
          for (var i = 0; i < length; ++i) {
            var charCode = value.charCodeAt(i);
            if (charCode > 255) {
              _free(ptr);
              throwBindingError(
                "String has UTF-16 code units that do not fit in 8 bits"
              );
            }
            HEAPU8[ptr + i] = charCode;
          }
        } else {
          for (var i = 0; i < length; ++i) {
            HEAPU8[ptr + i] = value[i];
          }
        }
      }
      if (destructors !== null) {
        destructors.push(_free, base);
      }
      return base;
    },
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: readPointer,
    destructorFunction(ptr) {
      _free(ptr);
    },
  });
};
var UTF16Decoder =
  typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;
var UTF16ToString = (ptr, maxBytesToRead) => {
  var endPtr = ptr;
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;
  if (endPtr - ptr > 32 && UTF16Decoder)
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  var str = "";
  for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
    var codeUnit = HEAP16[(ptr + i * 2) >> 1];
    if (codeUnit == 0) break;
    str += String.fromCharCode(codeUnit);
  }
  return str;
};
var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2;
  var startPtr = outPtr;
  var numCharsToWrite =
    maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    var codeUnit = str.charCodeAt(i);
    HEAP16[outPtr >> 1] = codeUnit;
    outPtr += 2;
  }
  HEAP16[outPtr >> 1] = 0;
  return outPtr - startPtr;
};
var lengthBytesUTF16 = (str) => str.length * 2;
var UTF32ToString = (ptr, maxBytesToRead) => {
  var i = 0;
  var str = "";
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(ptr + i * 4) >> 2];
    if (utf32 == 0) break;
    ++i;
    if (utf32 >= 65536) {
      var ch = utf32 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
};
var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 2147483647;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = (65536 + ((codeUnit & 1023) << 10)) | (trailSurrogate & 1023);
    }
    HEAP32[outPtr >> 2] = codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  HEAP32[outPtr >> 2] = 0;
  return outPtr - startPtr;
};
var lengthBytesUTF32 = (str) => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
    len += 4;
  }
  return len;
};
var __embind_register_std_wstring = (rawType, charSize, name) => {
  name = readLatin1String(name);
  var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
  if (charSize === 2) {
    decodeString = UTF16ToString;
    encodeString = stringToUTF16;
    lengthBytesUTF = lengthBytesUTF16;
    getHeap = () => HEAPU16;
    shift = 1;
  } else if (charSize === 4) {
    decodeString = UTF32ToString;
    encodeString = stringToUTF32;
    lengthBytesUTF = lengthBytesUTF32;
    getHeap = () => HEAPU32;
    shift = 2;
  }
  registerType(rawType, {
    name: name,
    fromWireType: (value) => {
      var length = HEAPU32[value >> 2];
      var HEAP = getHeap();
      var str;
      var decodeStartPtr = value + 4;
      for (var i = 0; i <= length; ++i) {
        var currentBytePtr = value + 4 + i * charSize;
        if (i == length || HEAP[currentBytePtr >> shift] == 0) {
          var maxReadBytes = currentBytePtr - decodeStartPtr;
          var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
          if (str === undefined) {
            str = stringSegment;
          } else {
            str += String.fromCharCode(0);
            str += stringSegment;
          }
          decodeStartPtr = currentBytePtr + charSize;
        }
      }
      _free(value);
      return str;
    },
    toWireType: (destructors, value) => {
      if (!(typeof value == "string")) {
        throwBindingError(`Cannot pass non-string to C++ string type ${name}`);
      }
      var length = lengthBytesUTF(value);
      var ptr = _malloc(4 + length + charSize);
      HEAPU32[ptr >> 2] = length >> shift;
      encodeString(value, ptr + 4, length + charSize);
      if (destructors !== null) {
        destructors.push(_free, ptr);
      }
      return ptr;
    },
    argPackAdvance: GenericWireTypeSize,
    readValueFromPointer: simpleReadValueFromPointer,
    destructorFunction(ptr) {
      _free(ptr);
    },
  });
};
var __embind_register_void = (rawType, name) => {
  name = readLatin1String(name);
  registerType(rawType, {
    isVoid: true,
    name: name,
    argPackAdvance: 0,
    fromWireType: () => undefined,
    toWireType: (destructors, o) => undefined,
  });
};
var runtimeKeepaliveCounter = 0;
var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
var _proc_exit = (code) => {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    if (Module["onExit"]) Module["onExit"](code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
};
var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  if (!keepRuntimeAlive()) {
    exitRuntime();
  }
  _proc_exit(status);
};
var _exit = exitJS;
var __emscripten_runtime_keepalive_clear = () => {
  noExitRuntime = false;
  runtimeKeepaliveCounter = 0;
};
var _emscripten_force_exit = (status) => {
  __emscripten_runtime_keepalive_clear();
  _exit(status);
};
var _emscripten_memcpy_js = (dest, src, num) =>
  HEAPU8.copyWithin(dest, src, src + num);
var getHeapMax = () => 2147483648;
var growMemory = (size) => {
  var b = wasmMemory.buffer;
  var pages = (size - b.byteLength + 65535) / 65536;
  try {
    wasmMemory.grow(pages);
    updateMemoryViews();
    return 1;
  } catch (e) {}
};
var _emscripten_resize_heap = (requestedSize) => {
  var oldSize = HEAPU8.length;
  requestedSize >>>= 0;
  var maxHeapSize = getHeapMax();
  if (requestedSize > maxHeapSize) {
    return false;
  }
  var alignUp = (x, multiple) => x + ((multiple - (x % multiple)) % multiple);
  for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
    var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
    overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
    var newSize = Math.min(
      maxHeapSize,
      alignUp(Math.max(requestedSize, overGrownHeapSize), 65536)
    );
    var replacement = growMemory(newSize);
    if (replacement) {
      return true;
    }
  }
  return false;
};
var handleException = (e) => {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  quit_(1, e);
};
var maybeExit = () => {
  if (runtimeExited) {
    return;
  }
  if (!keepRuntimeAlive()) {
    try {
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};
var callUserCallback = (func) => {
  if (runtimeExited || ABORT) {
    return;
  }
  try {
    func();
    maybeExit();
  } catch (e) {
    handleException(e);
  }
};
var runtimeKeepalivePush = () => {
  runtimeKeepaliveCounter += 1;
};
var runtimeKeepalivePop = () => {
  runtimeKeepaliveCounter -= 1;
};
var safeSetTimeout = (func, timeout) => {
  runtimeKeepalivePush();
  return setTimeout(() => {
    runtimeKeepalivePop();
    callUserCallback(func);
  }, timeout);
};
var warnOnce = (text) => {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
    err(text);
  }
};
var Browser = {
  mainLoop: {
    running: false,
    scheduler: null,
    method: "",
    currentlyRunningMainloop: 0,
    func: null,
    arg: 0,
    timingMode: 0,
    timingValue: 0,
    currentFrameNumber: 0,
    queue: [],
    pause() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.currentlyRunningMainloop++;
    },
    resume() {
      Browser.mainLoop.currentlyRunningMainloop++;
      var timingMode = Browser.mainLoop.timingMode;
      var timingValue = Browser.mainLoop.timingValue;
      var func = Browser.mainLoop.func;
      Browser.mainLoop.func = null;
      setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
      _emscripten_set_main_loop_timing(timingMode, timingValue);
      Browser.mainLoop.scheduler();
    },
    updateStatus() {
      if (Module["setStatus"]) {
        var message = Module["statusMessage"] || "Please wait...";
        var remaining = Browser.mainLoop.remainingBlockers;
        var expected = Browser.mainLoop.expectedBlockers;
        if (remaining) {
          if (remaining < expected) {
            Module["setStatus"](
              message + " (" + (expected - remaining) + "/" + expected + ")"
            );
          } else {
            Module["setStatus"](message);
          }
        } else {
          Module["setStatus"]("");
        }
      }
    },
    runIter(func) {
      if (ABORT) return;
      if (Module["preMainLoop"]) {
        var preRet = Module["preMainLoop"]();
        if (preRet === false) {
          return;
        }
      }
      callUserCallback(func);
      if (Module["postMainLoop"]) Module["postMainLoop"]();
    },
  },
  isFullscreen: false,
  pointerLock: false,
  moduleContextCreatedCallbacks: [],
  workers: [],
  init() {
    if (Browser.initted) return;
    Browser.initted = true;
    var imagePlugin = {};
    imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
      return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
    };
    imagePlugin["handle"] = function imagePlugin_handle(
      byteArray,
      name,
      onload,
      onerror
    ) {
      var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
      if (b.size !== byteArray.length) {
        b = new Blob([new Uint8Array(byteArray).buffer], {
          type: Browser.getMimetype(name),
        });
      }
      var url = URL.createObjectURL(b);
      var img = new Image();
      img.onload = () => {
        assert(img.complete, `Image ${name} could not be decoded`);
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        preloadedImages[name] = canvas;
        URL.revokeObjectURL(url);
        if (onload) onload(byteArray);
      };
      img.onerror = (event) => {
        err(`Image ${url} could not be decoded`);
        if (onerror) onerror();
      };
      img.src = url;
    };
    preloadPlugins.push(imagePlugin);
    var audioPlugin = {};
    audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
      return (
        !Module.noAudioDecoding &&
        name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 }
      );
    };
    audioPlugin["handle"] = function audioPlugin_handle(
      byteArray,
      name,
      onload,
      onerror
    ) {
      var done = false;
      function finish(audio) {
        if (done) return;
        done = true;
        preloadedAudios[name] = audio;
        if (onload) onload(byteArray);
      }
      var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
      var url = URL.createObjectURL(b);
      var audio = new Audio();
      audio.addEventListener("canplaythrough", () => finish(audio), false);
      audio.onerror = function audio_onerror(event) {
        if (done) return;
        err(
          `warning: browser could not fully decode audio ${name}, trying slower base64 approach`
        );
        function encode64(data) {
          var BASE =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var PAD = "=";
          var ret = "";
          var leftchar = 0;
          var leftbits = 0;
          for (var i = 0; i < data.length; i++) {
            leftchar = (leftchar << 8) | data[i];
            leftbits += 8;
            while (leftbits >= 6) {
              var curr = (leftchar >> (leftbits - 6)) & 63;
              leftbits -= 6;
              ret += BASE[curr];
            }
          }
          if (leftbits == 2) {
            ret += BASE[(leftchar & 3) << 4];
            ret += PAD + PAD;
          } else if (leftbits == 4) {
            ret += BASE[(leftchar & 15) << 2];
            ret += PAD;
          }
          return ret;
        }
        audio.src =
          "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
        finish(audio);
      };
      audio.src = url;
      safeSetTimeout(() => {
        finish(audio);
      }, 1e4);
    };
    preloadPlugins.push(audioPlugin);
    function pointerLockChange() {
      Browser.pointerLock =
        document["pointerLockElement"] === Module["canvas"] ||
        document["mozPointerLockElement"] === Module["canvas"] ||
        document["webkitPointerLockElement"] === Module["canvas"] ||
        document["msPointerLockElement"] === Module["canvas"];
    }
    var canvas = Module["canvas"];
    if (canvas) {
      canvas.requestPointerLock =
        canvas["requestPointerLock"] ||
        canvas["mozRequestPointerLock"] ||
        canvas["webkitRequestPointerLock"] ||
        canvas["msRequestPointerLock"] ||
        (() => {});
      canvas.exitPointerLock =
        document["exitPointerLock"] ||
        document["mozExitPointerLock"] ||
        document["webkitExitPointerLock"] ||
        document["msExitPointerLock"] ||
        (() => {});
      canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
      document.addEventListener("pointerlockchange", pointerLockChange, false);
      document.addEventListener(
        "mozpointerlockchange",
        pointerLockChange,
        false
      );
      document.addEventListener(
        "webkitpointerlockchange",
        pointerLockChange,
        false
      );
      document.addEventListener(
        "mspointerlockchange",
        pointerLockChange,
        false
      );
      if (Module["elementPointerLock"]) {
        canvas.addEventListener(
          "click",
          (ev) => {
            if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
              Module["canvas"].requestPointerLock();
              ev.preventDefault();
            }
          },
          false
        );
      }
    }
  },
  createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
    if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
    var ctx;
    var contextHandle;
    if (useWebGL) {
      var contextAttributes = {
        antialias: false,
        alpha: false,
        majorVersion: typeof WebGL2RenderingContext != "undefined" ? 2 : 1,
      };
      if (webGLContextAttributes) {
        for (var attribute in webGLContextAttributes) {
          contextAttributes[attribute] = webGLContextAttributes[attribute];
        }
      }
      if (typeof GL != "undefined") {
        contextHandle = GL.createContext(canvas, contextAttributes);
        if (contextHandle) {
          ctx = GL.getContext(contextHandle).GLctx;
        }
      }
    } else {
      ctx = canvas.getContext("2d");
    }
    if (!ctx) return null;
    if (setInModule) {
      if (!useWebGL)
        assert(
          typeof GLctx == "undefined",
          "cannot set in module if GLctx is used, but we are a non-GL context that would replace it"
        );
      Module.ctx = ctx;
      if (useWebGL) GL.makeContextCurrent(contextHandle);
      Module.useWebGL = useWebGL;
      Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
      Browser.init();
    }
    return ctx;
  },
  destroyContext(canvas, useWebGL, setInModule) {},
  fullscreenHandlersInstalled: false,
  lockPointer: undefined,
  resizeCanvas: undefined,
  requestFullscreen(lockPointer, resizeCanvas) {
    Browser.lockPointer = lockPointer;
    Browser.resizeCanvas = resizeCanvas;
    if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
    if (typeof Browser.resizeCanvas == "undefined")
      Browser.resizeCanvas = false;
    var canvas = Module["canvas"];
    function fullscreenChange() {
      Browser.isFullscreen = false;
      var canvasContainer = canvas.parentNode;
      if (
        (document["fullscreenElement"] ||
          document["mozFullScreenElement"] ||
          document["msFullscreenElement"] ||
          document["webkitFullscreenElement"] ||
          document["webkitCurrentFullScreenElement"]) === canvasContainer
      ) {
        canvas.exitFullscreen = Browser.exitFullscreen;
        if (Browser.lockPointer) canvas.requestPointerLock();
        Browser.isFullscreen = true;
        if (Browser.resizeCanvas) {
          Browser.setFullscreenCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      } else {
        canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
        canvasContainer.parentNode.removeChild(canvasContainer);
        if (Browser.resizeCanvas) {
          Browser.setWindowedCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      }
      if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
      if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
    }
    if (!Browser.fullscreenHandlersInstalled) {
      Browser.fullscreenHandlersInstalled = true;
      document.addEventListener("fullscreenchange", fullscreenChange, false);
      document.addEventListener("mozfullscreenchange", fullscreenChange, false);
      document.addEventListener(
        "webkitfullscreenchange",
        fullscreenChange,
        false
      );
      document.addEventListener("MSFullscreenChange", fullscreenChange, false);
    }
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    canvasContainer.requestFullscreen =
      canvasContainer["requestFullscreen"] ||
      canvasContainer["mozRequestFullScreen"] ||
      canvasContainer["msRequestFullscreen"] ||
      (canvasContainer["webkitRequestFullscreen"]
        ? () =>
            canvasContainer["webkitRequestFullscreen"](
              Element["ALLOW_KEYBOARD_INPUT"]
            )
        : null) ||
      (canvasContainer["webkitRequestFullScreen"]
        ? () =>
            canvasContainer["webkitRequestFullScreen"](
              Element["ALLOW_KEYBOARD_INPUT"]
            )
        : null);
    canvasContainer.requestFullscreen();
  },
  exitFullscreen() {
    if (!Browser.isFullscreen) {
      return false;
    }
    var CFS =
      document["exitFullscreen"] ||
      document["cancelFullScreen"] ||
      document["mozCancelFullScreen"] ||
      document["msExitFullscreen"] ||
      document["webkitCancelFullScreen"] ||
      (() => {});
    CFS.apply(document, []);
    return true;
  },
  nextRAF: 0,
  fakeRequestAnimationFrame(func) {
    var now = Date.now();
    if (Browser.nextRAF === 0) {
      Browser.nextRAF = now + 1e3 / 60;
    } else {
      while (now + 2 >= Browser.nextRAF) {
        Browser.nextRAF += 1e3 / 60;
      }
    }
    var delay = Math.max(Browser.nextRAF - now, 0);
    setTimeout(func, delay);
  },
  requestAnimationFrame(func) {
    if (typeof requestAnimationFrame == "function") {
      requestAnimationFrame(func);
      return;
    }
    var RAF = Browser.fakeRequestAnimationFrame;
    RAF(func);
  },
  safeSetTimeout(func, timeout) {
    return safeSetTimeout(func, timeout);
  },
  safeRequestAnimationFrame(func) {
    runtimeKeepalivePush();
    return Browser.requestAnimationFrame(() => {
      runtimeKeepalivePop();
      callUserCallback(func);
    });
  },
  getMimetype(name) {
    return {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      bmp: "image/bmp",
      ogg: "audio/ogg",
      wav: "audio/wav",
      mp3: "audio/mpeg",
    }[name.substr(name.lastIndexOf(".") + 1)];
  },
  getUserMedia(func) {
    if (!window.getUserMedia) {
      window.getUserMedia =
        navigator["getUserMedia"] || navigator["mozGetUserMedia"];
    }
    window.getUserMedia(func);
  },
  getMovementX(event) {
    return (
      event["movementX"] ||
      event["mozMovementX"] ||
      event["webkitMovementX"] ||
      0
    );
  },
  getMovementY(event) {
    return (
      event["movementY"] ||
      event["mozMovementY"] ||
      event["webkitMovementY"] ||
      0
    );
  },
  getMouseWheelDelta(event) {
    var delta = 0;
    switch (event.type) {
      case "DOMMouseScroll":
        delta = event.detail / 3;
        break;
      case "mousewheel":
        delta = event.wheelDelta / 120;
        break;
      case "wheel":
        delta = event.deltaY;
        switch (event.deltaMode) {
          case 0:
            delta /= 100;
            break;
          case 1:
            delta /= 3;
            break;
          case 2:
            delta *= 80;
            break;
          default:
            throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
        }
        break;
      default:
        throw "unrecognized mouse wheel event: " + event.type;
    }
    return delta;
  },
  mouseX: 0,
  mouseY: 0,
  mouseMovementX: 0,
  mouseMovementY: 0,
  touches: {},
  lastTouches: {},
  calculateMouseEvent(event) {
    if (Browser.pointerLock) {
      if (event.type != "mousemove" && "mozMovementX" in event) {
        Browser.mouseMovementX = Browser.mouseMovementY = 0;
      } else {
        Browser.mouseMovementX = Browser.getMovementX(event);
        Browser.mouseMovementY = Browser.getMovementY(event);
      }
      if (typeof SDL != "undefined") {
        Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
        Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
      } else {
        Browser.mouseX += Browser.mouseMovementX;
        Browser.mouseY += Browser.mouseMovementY;
      }
    } else {
      var rect = Module["canvas"].getBoundingClientRect();
      var cw = Module["canvas"].width;
      var ch = Module["canvas"].height;
      var scrollX =
        typeof window.scrollX != "undefined"
          ? window.scrollX
          : window.pageXOffset;
      var scrollY =
        typeof window.scrollY != "undefined"
          ? window.scrollY
          : window.pageYOffset;
      if (
        event.type === "touchstart" ||
        event.type === "touchend" ||
        event.type === "touchmove"
      ) {
        var touch = event.touch;
        if (touch === undefined) {
          return;
        }
        var adjustedX = touch.pageX - (scrollX + rect.left);
        var adjustedY = touch.pageY - (scrollY + rect.top);
        adjustedX = adjustedX * (cw / rect.width);
        adjustedY = adjustedY * (ch / rect.height);
        var coords = { x: adjustedX, y: adjustedY };
        if (event.type === "touchstart") {
          Browser.lastTouches[touch.identifier] = coords;
          Browser.touches[touch.identifier] = coords;
        } else if (event.type === "touchend" || event.type === "touchmove") {
          var last = Browser.touches[touch.identifier];
          if (!last) last = coords;
          Browser.lastTouches[touch.identifier] = last;
          Browser.touches[touch.identifier] = coords;
        }
        return;
      }
      var x = event.pageX - (scrollX + rect.left);
      var y = event.pageY - (scrollY + rect.top);
      x = x * (cw / rect.width);
      y = y * (ch / rect.height);
      Browser.mouseMovementX = x - Browser.mouseX;
      Browser.mouseMovementY = y - Browser.mouseY;
      Browser.mouseX = x;
      Browser.mouseY = y;
    }
  },
  resizeListeners: [],
  updateResizeListeners() {
    var canvas = Module["canvas"];
    Browser.resizeListeners.forEach((listener) =>
      listener(canvas.width, canvas.height)
    );
  },
  setCanvasSize(width, height, noUpdates) {
    var canvas = Module["canvas"];
    Browser.updateCanvasDimensions(canvas, width, height);
    if (!noUpdates) Browser.updateResizeListeners();
  },
  windowedWidth: 0,
  windowedHeight: 0,
  setFullscreenCanvasSize() {
    if (typeof SDL != "undefined") {
      var flags = HEAPU32[SDL.screen >> 2];
      flags = flags | 8388608;
      HEAP32[SDL.screen >> 2] = flags;
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners();
  },
  setWindowedCanvasSize() {
    if (typeof SDL != "undefined") {
      var flags = HEAPU32[SDL.screen >> 2];
      flags = flags & ~8388608;
      HEAP32[SDL.screen >> 2] = flags;
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners();
  },
  updateCanvasDimensions(canvas, wNative, hNative) {
    if (wNative && hNative) {
      canvas.widthNative = wNative;
      canvas.heightNative = hNative;
    } else {
      wNative = canvas.widthNative;
      hNative = canvas.heightNative;
    }
    var w = wNative;
    var h = hNative;
    if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
      if (w / h < Module["forcedAspectRatio"]) {
        w = Math.round(h * Module["forcedAspectRatio"]);
      } else {
        h = Math.round(w / Module["forcedAspectRatio"]);
      }
    }
    if (
      (document["fullscreenElement"] ||
        document["mozFullScreenElement"] ||
        document["msFullscreenElement"] ||
        document["webkitFullscreenElement"] ||
        document["webkitCurrentFullScreenElement"]) === canvas.parentNode &&
      typeof screen != "undefined"
    ) {
      var factor = Math.min(screen.width / w, screen.height / h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    if (Browser.resizeCanvas) {
      if (canvas.width != w) canvas.width = w;
      if (canvas.height != h) canvas.height = h;
      if (typeof canvas.style != "undefined") {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    } else {
      if (canvas.width != wNative) canvas.width = wNative;
      if (canvas.height != hNative) canvas.height = hNative;
      if (typeof canvas.style != "undefined") {
        if (w != wNative || h != hNative) {
          canvas.style.setProperty("width", w + "px", "important");
          canvas.style.setProperty("height", h + "px", "important");
        } else {
          canvas.style.removeProperty("width");
          canvas.style.removeProperty("height");
        }
      }
    }
  },
};
var _emscripten_set_main_loop_timing = (mode, value) => {
  Browser.mainLoop.timingMode = mode;
  Browser.mainLoop.timingValue = value;
  if (!Browser.mainLoop.func) {
    return 1;
  }
  if (!Browser.mainLoop.running) {
    runtimeKeepalivePush();
    Browser.mainLoop.running = true;
  }
  if (mode == 0) {
    Browser.mainLoop.scheduler =
      function Browser_mainLoop_scheduler_setTimeout() {
        var timeUntilNextTick =
          Math.max(
            0,
            Browser.mainLoop.tickStartTime + value - _emscripten_get_now()
          ) | 0;
        setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
      };
    Browser.mainLoop.method = "timeout";
  } else if (mode == 1) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
      Browser.requestAnimationFrame(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "rAF";
  } else if (mode == 2) {
    if (typeof setImmediate == "undefined") {
      var setImmediates = [];
      var emscriptenMainLoopMessageId = "setimmediate";
      var Browser_setImmediate_messageHandler = (event) => {
        if (
          event.data === emscriptenMainLoopMessageId ||
          event.data.target === emscriptenMainLoopMessageId
        ) {
          event.stopPropagation();
          setImmediates.shift()();
        }
      };
      addEventListener("message", Browser_setImmediate_messageHandler, true);
      setImmediate = function Browser_emulated_setImmediate(func) {
        setImmediates.push(func);
        if (ENVIRONMENT_IS_WORKER) {
          if (Module["setImmediates"] === undefined)
            Module["setImmediates"] = [];
          Module["setImmediates"].push(func);
          postMessage({ target: emscriptenMainLoopMessageId });
        } else postMessage(emscriptenMainLoopMessageId, "*");
      };
    }
    Browser.mainLoop.scheduler =
      function Browser_mainLoop_scheduler_setImmediate() {
        setImmediate(Browser.mainLoop.runner);
      };
    Browser.mainLoop.method = "immediate";
  }
  return 0;
};
var _emscripten_get_now;
_emscripten_get_now = () => performance.now();
var setMainLoop = (
  browserIterationFunc,
  fps,
  simulateInfiniteLoop,
  arg,
  noSetTiming
) => {
  assert(
    !Browser.mainLoop.func,
    "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters."
  );
  Browser.mainLoop.func = browserIterationFunc;
  Browser.mainLoop.arg = arg;
  var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  function checkIsRunning() {
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
      runtimeKeepalivePop();
      maybeExit();
      return false;
    }
    return true;
  }
  Browser.mainLoop.running = false;
  Browser.mainLoop.runner = function Browser_mainLoop_runner() {
    if (ABORT) return;
    if (Browser.mainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = Browser.mainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (Browser.mainLoop.remainingBlockers) {
        var remaining = Browser.mainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          Browser.mainLoop.remainingBlockers = next;
        } else {
          next = next + 0.5;
          Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      Browser.mainLoop.updateStatus();
      if (!checkIsRunning()) return;
      setTimeout(Browser.mainLoop.runner, 0);
      return;
    }
    if (!checkIsRunning()) return;
    Browser.mainLoop.currentFrameNumber =
      (Browser.mainLoop.currentFrameNumber + 1) | 0;
    if (
      Browser.mainLoop.timingMode == 1 &&
      Browser.mainLoop.timingValue > 1 &&
      Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0
    ) {
      Browser.mainLoop.scheduler();
      return;
    } else if (Browser.mainLoop.timingMode == 0) {
      Browser.mainLoop.tickStartTime = _emscripten_get_now();
    }
    GL.newRenderingFrameStarted();
    Browser.mainLoop.runIter(browserIterationFunc);
    if (!checkIsRunning()) return;
    if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData)
      SDL.audio.queueNewAudioData();
    Browser.mainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps && fps > 0) {
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    } else {
      _emscripten_set_main_loop_timing(1, 1);
    }
    Browser.mainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
};
var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
  var browserIterationFunc = () => dynCall_v.call(null, func);
  setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop);
};
function _fd_close(fd) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.close(stream);
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var doReadv = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[iov >> 2];
    var len = HEAPU32[(iov + 4) >> 2];
    iov += 8;
    var curr = FS.read(stream, HEAP8, ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (curr < len) break;
    if (typeof offset !== "undefined") {
      offset += curr;
    }
  }
  return ret;
};
function _fd_read(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doReadv(stream, iov, iovcnt);
    HEAPU32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var convertI32PairToI53Checked = (lo, hi) =>
  (hi + 2097152) >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  var offset = convertI32PairToI53Checked(offset_low, offset_high);
  try {
    if (isNaN(offset)) return 61;
    var stream = SYSCALLS.getStreamFromFD(fd);
    FS.llseek(stream, offset, whence);
    (tempI64 = [
      stream.position >>> 0,
      ((tempDouble = stream.position),
      +Math.abs(tempDouble) >= 1
        ? tempDouble > 0
          ? +Math.floor(tempDouble / 4294967296) >>> 0
          : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>>
            0
        : 0),
    ]),
      (HEAP32[newOffset >> 2] = tempI64[0]),
      (HEAP32[(newOffset + 4) >> 2] = tempI64[1]);
    if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var doWritev = (stream, iov, iovcnt, offset) => {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = HEAPU32[iov >> 2];
    var len = HEAPU32[(iov + 4) >> 2];
    iov += 8;
    var curr = FS.write(stream, HEAP8, ptr, len, offset);
    if (curr < 0) return -1;
    ret += curr;
    if (typeof offset !== "undefined") {
      offset += curr;
    }
  }
  return ret;
};
function _fd_write(fd, iov, iovcnt, pnum) {
  try {
    var stream = SYSCALLS.getStreamFromFD(fd);
    var num = doWritev(stream, iov, iovcnt);
    HEAPU32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
    return e.errno;
  }
}
var webgl_enable_ANGLE_instanced_arrays = (ctx) => {
  var ext = ctx.getExtension("ANGLE_instanced_arrays");
  if (ext) {
    ctx["vertexAttribDivisor"] = (index, divisor) =>
      ext["vertexAttribDivisorANGLE"](index, divisor);
    ctx["drawArraysInstanced"] = (mode, first, count, primcount) =>
      ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
    ctx["drawElementsInstanced"] = (mode, count, type, indices, primcount) =>
      ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
    return 1;
  }
};
var webgl_enable_OES_vertex_array_object = (ctx) => {
  var ext = ctx.getExtension("OES_vertex_array_object");
  if (ext) {
    ctx["createVertexArray"] = () => ext["createVertexArrayOES"]();
    ctx["deleteVertexArray"] = (vao) => ext["deleteVertexArrayOES"](vao);
    ctx["bindVertexArray"] = (vao) => ext["bindVertexArrayOES"](vao);
    ctx["isVertexArray"] = (vao) => ext["isVertexArrayOES"](vao);
    return 1;
  }
};
var webgl_enable_WEBGL_draw_buffers = (ctx) => {
  var ext = ctx.getExtension("WEBGL_draw_buffers");
  if (ext) {
    ctx["drawBuffers"] = (n, bufs) => ext["drawBuffersWEBGL"](n, bufs);
    return 1;
  }
};
var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = (ctx) =>
  !!(ctx.dibvbi = ctx.getExtension(
    "WEBGL_draw_instanced_base_vertex_base_instance"
  ));
var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = (ctx) =>
  !!(ctx.mdibvbi = ctx.getExtension(
    "WEBGL_multi_draw_instanced_base_vertex_base_instance"
  ));
var webgl_enable_WEBGL_multi_draw = (ctx) =>
  !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
var GL = {
  counter: 1,
  buffers: [],
  mappedBuffers: {},
  programs: [],
  framebuffers: [],
  renderbuffers: [],
  textures: [],
  shaders: [],
  vaos: [],
  contexts: [],
  offscreenCanvases: {},
  queries: [],
  samplers: [],
  transformFeedbacks: [],
  syncs: [],
  byteSizeByTypeRoot: 5120,
  byteSizeByType: [1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8],
  stringCache: {},
  stringiCache: {},
  unpackAlignment: 4,
  recordError: function recordError(errorCode) {
    if (!GL.lastError) {
      GL.lastError = errorCode;
    }
  },
  getNewId: (table) => {
    var ret = GL.counter++;
    for (var i = table.length; i < ret; i++) {
      table[i] = null;
    }
    return ret;
  },
  MAX_TEMP_BUFFER_SIZE: 2097152,
  numTempVertexBuffersPerSize: 64,
  log2ceilLookup: (i) => 32 - Math.clz32(i === 0 ? 0 : i - 1),
  generateTempBuffers: (quads, context) => {
    var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
    context.tempVertexBufferCounters1 = [];
    context.tempVertexBufferCounters2 = [];
    context.tempVertexBufferCounters1.length =
      context.tempVertexBufferCounters2.length = largestIndex + 1;
    context.tempVertexBuffers1 = [];
    context.tempVertexBuffers2 = [];
    context.tempVertexBuffers1.length = context.tempVertexBuffers2.length =
      largestIndex + 1;
    context.tempIndexBuffers = [];
    context.tempIndexBuffers.length = largestIndex + 1;
    for (var i = 0; i <= largestIndex; ++i) {
      context.tempIndexBuffers[i] = null;
      context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[
        i
      ] = 0;
      var ringbufferLength = GL.numTempVertexBuffersPerSize;
      context.tempVertexBuffers1[i] = [];
      context.tempVertexBuffers2[i] = [];
      var ringbuffer1 = context.tempVertexBuffers1[i];
      var ringbuffer2 = context.tempVertexBuffers2[i];
      ringbuffer1.length = ringbuffer2.length = ringbufferLength;
      for (var j = 0; j < ringbufferLength; ++j) {
        ringbuffer1[j] = ringbuffer2[j] = null;
      }
    }
    if (quads) {
      context.tempQuadIndexBuffer = GLctx.createBuffer();
      context.GLctx.bindBuffer(34963, context.tempQuadIndexBuffer);
      var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
      var quadIndexes = new Uint16Array(numIndexes);
      var i = 0,
        v = 0;
      while (1) {
        quadIndexes[i++] = v;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 1;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 2;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 2;
        if (i >= numIndexes) break;
        quadIndexes[i++] = v + 3;
        if (i >= numIndexes) break;
        v += 4;
      }
      context.GLctx.bufferData(34963, quadIndexes, 35044);
      context.GLctx.bindBuffer(34963, null);
    }
  },
  getTempVertexBuffer: function getTempVertexBuffer(sizeBytes) {
    var idx = GL.log2ceilLookup(sizeBytes);
    var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
    var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
    GL.currentContext.tempVertexBufferCounters1[idx] =
      (GL.currentContext.tempVertexBufferCounters1[idx] + 1) &
      (GL.numTempVertexBuffersPerSize - 1);
    var vbo = ringbuffer[nextFreeBufferIndex];
    if (vbo) {
      return vbo;
    }
    var prevVBO = GLctx.getParameter(34964);
    ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
    GLctx.bindBuffer(34962, ringbuffer[nextFreeBufferIndex]);
    GLctx.bufferData(34962, 1 << idx, 35048);
    GLctx.bindBuffer(34962, prevVBO);
    return ringbuffer[nextFreeBufferIndex];
  },
  getTempIndexBuffer: function getTempIndexBuffer(sizeBytes) {
    var idx = GL.log2ceilLookup(sizeBytes);
    var ibo = GL.currentContext.tempIndexBuffers[idx];
    if (ibo) {
      return ibo;
    }
    var prevIBO = GLctx.getParameter(34965);
    GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
    GLctx.bindBuffer(34963, GL.currentContext.tempIndexBuffers[idx]);
    GLctx.bufferData(34963, 1 << idx, 35048);
    GLctx.bindBuffer(34963, prevIBO);
    return GL.currentContext.tempIndexBuffers[idx];
  },
  newRenderingFrameStarted: function newRenderingFrameStarted() {
    if (!GL.currentContext) {
      return;
    }
    var vb = GL.currentContext.tempVertexBuffers1;
    GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
    GL.currentContext.tempVertexBuffers2 = vb;
    vb = GL.currentContext.tempVertexBufferCounters1;
    GL.currentContext.tempVertexBufferCounters1 =
      GL.currentContext.tempVertexBufferCounters2;
    GL.currentContext.tempVertexBufferCounters2 = vb;
    var largestIndex = GL.log2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
    for (var i = 0; i <= largestIndex; ++i) {
      GL.currentContext.tempVertexBufferCounters1[i] = 0;
    }
  },
  getSource: (shader, count, string, length) => {
    var source = "";
    for (var i = 0; i < count; ++i) {
      var len = length ? HEAP32[(length + i * 4) >> 2] : -1;
      source += UTF8ToString(
        HEAP32[(string + i * 4) >> 2],
        len < 0 ? undefined : len
      );
    }
    return source;
  },
  calcBufLength: function calcBufLength(size, type, stride, count) {
    if (stride > 0) {
      return count * stride;
    }
    var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
    return size * typeSize * count;
  },
  usedTempBuffers: [],
  preDrawHandleClientVertexAttribBindings:
    function preDrawHandleClientVertexAttribBindings(count) {
      GL.resetBufferBinding = false;
      for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
        var cb = GL.currentContext.clientBuffers[i];
        if (!cb.clientside || !cb.enabled) continue;
        GL.resetBufferBinding = true;
        var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
        var buf = GL.getTempVertexBuffer(size);
        GLctx.bindBuffer(34962, buf);
        GLctx.bufferSubData(34962, 0, HEAPU8.subarray(cb.ptr, cb.ptr + size));
        cb.vertexAttribPointerAdaptor.call(
          GLctx,
          i,
          cb.size,
          cb.type,
          cb.normalized,
          cb.stride,
          0
        );
      }
    },
  postDrawHandleClientVertexAttribBindings:
    function postDrawHandleClientVertexAttribBindings() {
      if (GL.resetBufferBinding) {
        GLctx.bindBuffer(34962, GL.buffers[GLctx.currentArrayBufferBinding]);
      }
    },
  createContext: (canvas, webGLContextAttributes) => {
    if (!canvas.getContextSafariWebGL2Fixed) {
      canvas.getContextSafariWebGL2Fixed = canvas.getContext;
      function fixedGetContext(ver, attrs) {
        var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
        return (ver == "webgl") == gl instanceof WebGLRenderingContext
          ? gl
          : null;
      }
      canvas.getContext = fixedGetContext;
    }
    var ctx =
      webGLContextAttributes.majorVersion > 1
        ? canvas.getContext("webgl2", webGLContextAttributes)
        : canvas.getContext("webgl", webGLContextAttributes);
    if (!ctx) return 0;
    var handle = GL.registerContext(ctx, webGLContextAttributes);
    return handle;
  },
  registerContext: (ctx, webGLContextAttributes) => {
    var handle = GL.getNewId(GL.contexts);
    var context = {
      handle: handle,
      attributes: webGLContextAttributes,
      version: webGLContextAttributes.majorVersion,
      GLctx: ctx,
    };
    if (ctx.canvas) ctx.canvas.GLctxObject = context;
    GL.contexts[handle] = context;
    if (
      typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" ||
      webGLContextAttributes.enableExtensionsByDefault
    ) {
      GL.initExtensions(context);
    }
    context.maxVertexAttribs = context.GLctx.getParameter(34921);
    context.clientBuffers = [];
    for (var i = 0; i < context.maxVertexAttribs; i++) {
      context.clientBuffers[i] = {
        enabled: false,
        clientside: false,
        size: 0,
        type: 0,
        normalized: 0,
        stride: 0,
        ptr: 0,
        vertexAttribPointerAdaptor: null,
      };
    }
    GL.generateTempBuffers(false, context);
    return handle;
  },
  makeContextCurrent: (contextHandle) => {
    GL.currentContext = GL.contexts[contextHandle];
    Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
    return !(contextHandle && !GLctx);
  },
  getContext: (contextHandle) => GL.contexts[contextHandle],
  deleteContext: (contextHandle) => {
    if (GL.currentContext === GL.contexts[contextHandle])
      GL.currentContext = null;
    if (typeof JSEvents == "object")
      JSEvents.removeAllHandlersOnTarget(
        GL.contexts[contextHandle].GLctx.canvas
      );
    if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas)
      GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
    GL.contexts[contextHandle] = null;
  },
  initExtensions: (context) => {
    if (!context) context = GL.currentContext;
    if (context.initExtensionsDone) return;
    context.initExtensionsDone = true;
    var GLctx = context.GLctx;
    webgl_enable_ANGLE_instanced_arrays(GLctx);
    webgl_enable_OES_vertex_array_object(GLctx);
    webgl_enable_WEBGL_draw_buffers(GLctx);
    webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
    webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
    if (context.version >= 2) {
      GLctx.disjointTimerQueryExt = GLctx.getExtension(
        "EXT_disjoint_timer_query_webgl2"
      );
    }
    if (context.version < 2 || !GLctx.disjointTimerQueryExt) {
      GLctx.disjointTimerQueryExt = GLctx.getExtension(
        "EXT_disjoint_timer_query"
      );
    }
    webgl_enable_WEBGL_multi_draw(GLctx);
    var exts = GLctx.getSupportedExtensions() || [];
    exts.forEach((ext) => {
      if (!ext.includes("lose_context") && !ext.includes("debug")) {
        GLctx.getExtension(ext);
      }
    });
  },
};
function _glActiveTexture(x0) {
  GLctx.activeTexture(x0);
}
var _glAttachShader = (program, shader) => {
  GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
};
var _glBindBuffer = (target, buffer) => {
  if (target == 34962) {
    GLctx.currentArrayBufferBinding = buffer;
  } else if (target == 34963) {
    GLctx.currentElementArrayBufferBinding = buffer;
  }
  if (target == 35051) {
    GLctx.currentPixelPackBufferBinding = buffer;
  } else if (target == 35052) {
    GLctx.currentPixelUnpackBufferBinding = buffer;
  }
  GLctx.bindBuffer(target, GL.buffers[buffer]);
};
var _glBindTexture = (target, texture) => {
  GLctx.bindTexture(target, GL.textures[texture]);
};
var _glBindVertexArray = (vao) => {
  GLctx.bindVertexArray(GL.vaos[vao]);
  var ibo = GLctx.getParameter(34965);
  GLctx.currentElementArrayBufferBinding = ibo ? ibo.name | 0 : 0;
};
function _glBlendEquation(x0) {
  GLctx.blendEquation(x0);
}
function _glBlendFunc(x0, x1) {
  GLctx.blendFunc(x0, x1);
}
var _glBufferData = (target, size, data, usage) => {
  if (GL.currentContext.version >= 2) {
    if (data && size) {
      GLctx.bufferData(target, HEAPU8, usage, data, size);
    } else {
      GLctx.bufferData(target, size, usage);
    }
  } else {
    GLctx.bufferData(
      target,
      data ? HEAPU8.subarray(data, data + size) : size,
      usage
    );
  }
};
function _glClear(x0) {
  GLctx.clear(x0);
}
function _glClearColor(x0, x1, x2, x3) {
  GLctx.clearColor(x0, x1, x2, x3);
}
var _glCompileShader = (shader) => {
  GLctx.compileShader(GL.shaders[shader]);
};
var _glCreateProgram = () => {
  var id = GL.getNewId(GL.programs);
  var program = GLctx.createProgram();
  program.name = id;
  program.maxUniformLength =
    program.maxAttributeLength =
    program.maxUniformBlockNameLength =
      0;
  program.uniformIdCounter = 1;
  GL.programs[id] = program;
  return id;
};
var _glCreateShader = (shaderType) => {
  var id = GL.getNewId(GL.shaders);
  GL.shaders[id] = GLctx.createShader(shaderType);
  return id;
};
var _glDeleteShader = (id) => {
  if (!id) return;
  var shader = GL.shaders[id];
  if (!shader) {
    GL.recordError(1281);
    return;
  }
  GLctx.deleteShader(shader);
  GL.shaders[id] = null;
};
var _glDrawArrays = (mode, first, count) => {
  GL.preDrawHandleClientVertexAttribBindings(first + count);
  GLctx.drawArrays(mode, first, count);
  GL.postDrawHandleClientVertexAttribBindings();
};
function _glEnable(x0) {
  GLctx.enable(x0);
}
var _glEnableVertexAttribArray = (index) => {
  var cb = GL.currentContext.clientBuffers[index];
  cb.enabled = true;
  GLctx.enableVertexAttribArray(index);
};
var __glGenObject = (n, buffers, createFunction, objectTable) => {
  for (var i = 0; i < n; i++) {
    var buffer = GLctx[createFunction]();
    var id = buffer && GL.getNewId(objectTable);
    if (buffer) {
      buffer.name = id;
      objectTable[id] = buffer;
    } else {
      GL.recordError(1282);
    }
    HEAP32[(buffers + i * 4) >> 2] = id;
  }
};
var _glGenBuffers = (n, buffers) => {
  __glGenObject(n, buffers, "createBuffer", GL.buffers);
};
var _glGenTextures = (n, textures) => {
  __glGenObject(n, textures, "createTexture", GL.textures);
};
function _glGenVertexArrays(n, arrays) {
  __glGenObject(n, arrays, "createVertexArray", GL.vaos);
}
function _glGenerateMipmap(x0) {
  GLctx.generateMipmap(x0);
}
var _glGetProgramInfoLog = (program, maxLength, length, infoLog) => {
  var log = GLctx.getProgramInfoLog(GL.programs[program]);
  if (log === null) log = "(unknown error)";
  var numBytesWrittenExclNull =
    maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
};
var _glGetProgramiv = (program, pname, p) => {
  if (!p) {
    GL.recordError(1281);
    return;
  }
  if (program >= GL.counter) {
    GL.recordError(1281);
    return;
  }
  program = GL.programs[program];
  if (pname == 35716) {
    var log = GLctx.getProgramInfoLog(program);
    if (log === null) log = "(unknown error)";
    HEAP32[p >> 2] = log.length + 1;
  } else if (pname == 35719) {
    if (!program.maxUniformLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
        program.maxUniformLength = Math.max(
          program.maxUniformLength,
          GLctx.getActiveUniform(program, i).name.length + 1
        );
      }
    }
    HEAP32[p >> 2] = program.maxUniformLength;
  } else if (pname == 35722) {
    if (!program.maxAttributeLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
        program.maxAttributeLength = Math.max(
          program.maxAttributeLength,
          GLctx.getActiveAttrib(program, i).name.length + 1
        );
      }
    }
    HEAP32[p >> 2] = program.maxAttributeLength;
  } else if (pname == 35381) {
    if (!program.maxUniformBlockNameLength) {
      for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
        program.maxUniformBlockNameLength = Math.max(
          program.maxUniformBlockNameLength,
          GLctx.getActiveUniformBlockName(program, i).length + 1
        );
      }
    }
    HEAP32[p >> 2] = program.maxUniformBlockNameLength;
  } else {
    HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname);
  }
};
var _glGetShaderInfoLog = (shader, maxLength, length, infoLog) => {
  var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
  if (log === null) log = "(unknown error)";
  var numBytesWrittenExclNull =
    maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
  if (length) HEAP32[length >> 2] = numBytesWrittenExclNull;
};
var _glGetShaderiv = (shader, pname, p) => {
  if (!p) {
    GL.recordError(1281);
    return;
  }
  if (pname == 35716) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var logLength = log ? log.length + 1 : 0;
    HEAP32[p >> 2] = logLength;
  } else if (pname == 35720) {
    var source = GLctx.getShaderSource(GL.shaders[shader]);
    var sourceLength = source ? source.length + 1 : 0;
    HEAP32[p >> 2] = sourceLength;
  } else {
    HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
  }
};
var jstoi_q = (str) => parseInt(str);
var webglGetLeftBracePos = (name) =>
  name.slice(-1) == "]" && name.lastIndexOf("[");
var webglPrepareUniformLocationsBeforeFirstUse = (program) => {
  var uniformLocsById = program.uniformLocsById,
    uniformSizeAndIdsByName = program.uniformSizeAndIdsByName,
    i,
    j;
  if (!uniformLocsById) {
    program.uniformLocsById = uniformLocsById = {};
    program.uniformArrayNamesById = {};
    for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
      var u = GLctx.getActiveUniform(program, i);
      var nm = u.name;
      var sz = u.size;
      var lb = webglGetLeftBracePos(nm);
      var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
      var id = program.uniformIdCounter;
      program.uniformIdCounter += sz;
      uniformSizeAndIdsByName[arrayName] = [sz, id];
      for (j = 0; j < sz; ++j) {
        uniformLocsById[id] = j;
        program.uniformArrayNamesById[id++] = arrayName;
      }
    }
  }
};
var _glGetUniformLocation = (program, name) => {
  name = UTF8ToString(name);
  if ((program = GL.programs[program])) {
    webglPrepareUniformLocationsBeforeFirstUse(program);
    var uniformLocsById = program.uniformLocsById;
    var arrayIndex = 0;
    var uniformBaseName = name;
    var leftBrace = webglGetLeftBracePos(name);
    if (leftBrace > 0) {
      arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
      uniformBaseName = name.slice(0, leftBrace);
    }
    var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
    if (sizeAndId && arrayIndex < sizeAndId[0]) {
      arrayIndex += sizeAndId[1];
      if (
        (uniformLocsById[arrayIndex] =
          uniformLocsById[arrayIndex] ||
          GLctx.getUniformLocation(program, name))
      ) {
        return arrayIndex;
      }
    }
  } else {
    GL.recordError(1281);
  }
  return -1;
};
var _glLinkProgram = (program) => {
  program = GL.programs[program];
  GLctx.linkProgram(program);
  program.uniformLocsById = 0;
  program.uniformSizeAndIdsByName = {};
};
var _glShaderSource = (shader, count, string, length) => {
  var source = GL.getSource(shader, count, string, length);
  GLctx.shaderSource(GL.shaders[shader], source);
};
function _glTexParameteri(x0, x1, x2) {
  GLctx.texParameteri(x0, x1, x2);
}
function _glTexStorage2D(x0, x1, x2, x3, x4) {
  GLctx.texStorage2D(x0, x1, x2, x3, x4);
}
var computeUnpackAlignedImageSize = (
  width,
  height,
  sizePerPixel,
  alignment
) => {
  function roundedToNextMultipleOf(x, y) {
    return (x + y - 1) & -y;
  }
  var plainRowSize = width * sizePerPixel;
  var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
  return height * alignedRowSize;
};
var colorChannelsInGlTextureFormat = (format) => {
  var colorChannels = {
    5: 3,
    6: 4,
    8: 2,
    29502: 3,
    29504: 4,
    26917: 2,
    26918: 2,
    29846: 3,
    29847: 4,
  };
  return colorChannels[format - 6402] || 1;
};
var heapObjectForWebGLType = (type) => {
  type -= 5120;
  if (type == 0) return HEAP8;
  if (type == 1) return HEAPU8;
  if (type == 2) return HEAP16;
  if (type == 4) return HEAP32;
  if (type == 6) return HEAPF32;
  if (
    type == 5 ||
    type == 28922 ||
    type == 28520 ||
    type == 30779 ||
    type == 30782
  )
    return HEAPU32;
  return HEAPU16;
};
var heapAccessShiftForWebGLHeap = (heap) =>
  31 - Math.clz32(heap.BYTES_PER_ELEMENT);
var emscriptenWebGLGetTexPixelData = (
  type,
  format,
  width,
  height,
  pixels,
  internalFormat
) => {
  var heap = heapObjectForWebGLType(type);
  var shift = heapAccessShiftForWebGLHeap(heap);
  var byteSize = 1 << shift;
  var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
  var bytes = computeUnpackAlignedImageSize(
    width,
    height,
    sizePerPixel,
    GL.unpackAlignment
  );
  return heap.subarray(pixels >> shift, (pixels + bytes) >> shift);
};
var _glTexSubImage2D = (
  target,
  level,
  xoffset,
  yoffset,
  width,
  height,
  format,
  type,
  pixels
) => {
  if (GL.currentContext.version >= 2) {
    if (GLctx.currentPixelUnpackBufferBinding) {
      GLctx.texSubImage2D(
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        type,
        pixels
      );
    } else if (pixels) {
      var heap = heapObjectForWebGLType(type);
      GLctx.texSubImage2D(
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        type,
        heap,
        pixels >> heapAccessShiftForWebGLHeap(heap)
      );
    } else {
      GLctx.texSubImage2D(
        target,
        level,
        xoffset,
        yoffset,
        width,
        height,
        format,
        type,
        null
      );
    }
    return;
  }
  var pixelData = null;
  if (pixels)
    pixelData = emscriptenWebGLGetTexPixelData(
      type,
      format,
      width,
      height,
      pixels,
      0
    );
  GLctx.texSubImage2D(
    target,
    level,
    xoffset,
    yoffset,
    width,
    height,
    format,
    type,
    pixelData
  );
};
var webglGetUniformLocation = (location) => {
  var p = GLctx.currentProgram;
  if (p) {
    var webglLoc = p.uniformLocsById[location];
    if (typeof webglLoc == "number") {
      p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(
        p,
        p.uniformArrayNamesById[location] +
          (webglLoc > 0 ? "[" + webglLoc + "]" : "")
      );
    }
    return webglLoc;
  } else {
    GL.recordError(1282);
  }
};
var _glUniform1i = (location, v0) => {
  GLctx.uniform1i(webglGetUniformLocation(location), v0);
};
var miniTempWebGLFloatBuffers = [];
var _glUniform4fv = (location, count, value) => {
  if (GL.currentContext.version >= 2) {
    count &&
      GLctx.uniform4fv(
        webglGetUniformLocation(location),
        HEAPF32,
        value >> 2,
        count * 4
      );
    return;
  }
  if (count <= 72) {
    var view = miniTempWebGLFloatBuffers[4 * count - 1];
    var heap = HEAPF32;
    value >>= 2;
    for (var i = 0; i < 4 * count; i += 4) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3];
    }
  } else {
    var view = HEAPF32.subarray(value >> 2, (value + count * 16) >> 2);
  }
  GLctx.uniform4fv(webglGetUniformLocation(location), view);
};
var _glUniformMatrix4fv = (location, count, transpose, value) => {
  if (GL.currentContext.version >= 2) {
    count &&
      GLctx.uniformMatrix4fv(
        webglGetUniformLocation(location),
        !!transpose,
        HEAPF32,
        value >> 2,
        count * 16
      );
    return;
  }
  if (count <= 18) {
    var view = miniTempWebGLFloatBuffers[16 * count - 1];
    var heap = HEAPF32;
    value >>= 2;
    for (var i = 0; i < 16 * count; i += 16) {
      var dst = value + i;
      view[i] = heap[dst];
      view[i + 1] = heap[dst + 1];
      view[i + 2] = heap[dst + 2];
      view[i + 3] = heap[dst + 3];
      view[i + 4] = heap[dst + 4];
      view[i + 5] = heap[dst + 5];
      view[i + 6] = heap[dst + 6];
      view[i + 7] = heap[dst + 7];
      view[i + 8] = heap[dst + 8];
      view[i + 9] = heap[dst + 9];
      view[i + 10] = heap[dst + 10];
      view[i + 11] = heap[dst + 11];
      view[i + 12] = heap[dst + 12];
      view[i + 13] = heap[dst + 13];
      view[i + 14] = heap[dst + 14];
      view[i + 15] = heap[dst + 15];
    }
  } else {
    var view = HEAPF32.subarray(value >> 2, (value + count * 64) >> 2);
  }
  GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view);
};
var _glUseProgram = (program) => {
  program = GL.programs[program];
  GLctx.useProgram(program);
  GLctx.currentProgram = program;
};
var _glVertexAttribPointer = (index, size, type, normalized, stride, ptr) => {
  var cb = GL.currentContext.clientBuffers[index];
  if (!GLctx.currentArrayBufferBinding) {
    cb.size = size;
    cb.type = type;
    cb.normalized = normalized;
    cb.stride = stride;
    cb.ptr = ptr;
    cb.clientside = true;
    cb.vertexAttribPointerAdaptor = function (
      index,
      size,
      type,
      normalized,
      stride,
      ptr
    ) {
      this.vertexAttribPointer(index, size, type, normalized, stride, ptr);
    };
    return;
  }
  cb.clientside = false;
  GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
};
function _glViewport(x0, x1, x2, x3) {
  GLctx.viewport(x0, x1, x2, x3);
}
function GLFW_Window(id, width, height, title, monitor, share) {
  this.id = id;
  this.x = 0;
  this.y = 0;
  this.fullscreen = false;
  this.storedX = 0;
  this.storedY = 0;
  this.width = width;
  this.height = height;
  this.storedWidth = width;
  this.storedHeight = height;
  this.title = title;
  this.monitor = monitor;
  this.share = share;
  this.attributes = GLFW.hints;
  this.inputModes = { 208897: 212993, 208898: 0, 208899: 0 };
  this.buttons = 0;
  this.keys = new Array();
  this.domKeys = new Array();
  this.shouldClose = 0;
  this.title = null;
  this.windowPosFunc = null;
  this.windowSizeFunc = null;
  this.windowCloseFunc = null;
  this.windowRefreshFunc = null;
  this.windowFocusFunc = null;
  this.windowIconifyFunc = null;
  this.windowMaximizeFunc = null;
  this.framebufferSizeFunc = null;
  this.windowContentScaleFunc = null;
  this.mouseButtonFunc = null;
  this.cursorPosFunc = null;
  this.cursorEnterFunc = null;
  this.scrollFunc = null;
  this.dropFunc = null;
  this.keyFunc = null;
  this.charFunc = null;
  this.userptr = null;
}
var stringToNewUTF8 = (str) => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8(str, ret, size);
  return ret;
};
var _emscripten_set_window_title = (title) =>
  (document.title = UTF8ToString(title));
var GLFW = {
  WindowFromId: (id) => {
    if (id <= 0 || !GLFW.windows) return null;
    return GLFW.windows[id - 1];
  },
  joystickFunc: null,
  errorFunc: null,
  monitorFunc: null,
  active: null,
  scale: null,
  windows: null,
  monitors: null,
  monitorString: null,
  versionString: null,
  initialTime: null,
  extensions: null,
  hints: null,
  defaultHints: {
    131073: 0,
    131074: 0,
    131075: 1,
    131076: 1,
    131077: 1,
    131082: 0,
    135169: 8,
    135170: 8,
    135171: 8,
    135172: 8,
    135173: 24,
    135174: 8,
    135175: 0,
    135176: 0,
    135177: 0,
    135178: 0,
    135179: 0,
    135180: 0,
    135181: 0,
    135182: 0,
    135183: 0,
    139265: 196609,
    139266: 1,
    139267: 0,
    139268: 0,
    139269: 0,
    139270: 0,
    139271: 0,
    139272: 0,
    139276: 0,
  },
  DOMToGLFWKeyCode: (keycode) => {
    switch (keycode) {
      case 32:
        return 32;
      case 222:
        return 39;
      case 188:
        return 44;
      case 173:
        return 45;
      case 189:
        return 45;
      case 190:
        return 46;
      case 191:
        return 47;
      case 48:
        return 48;
      case 49:
        return 49;
      case 50:
        return 50;
      case 51:
        return 51;
      case 52:
        return 52;
      case 53:
        return 53;
      case 54:
        return 54;
      case 55:
        return 55;
      case 56:
        return 56;
      case 57:
        return 57;
      case 59:
        return 59;
      case 61:
        return 61;
      case 187:
        return 61;
      case 65:
        return 65;
      case 66:
        return 66;
      case 67:
        return 67;
      case 68:
        return 68;
      case 69:
        return 69;
      case 70:
        return 70;
      case 71:
        return 71;
      case 72:
        return 72;
      case 73:
        return 73;
      case 74:
        return 74;
      case 75:
        return 75;
      case 76:
        return 76;
      case 77:
        return 77;
      case 78:
        return 78;
      case 79:
        return 79;
      case 80:
        return 80;
      case 81:
        return 81;
      case 82:
        return 82;
      case 83:
        return 83;
      case 84:
        return 84;
      case 85:
        return 85;
      case 86:
        return 86;
      case 87:
        return 87;
      case 88:
        return 88;
      case 89:
        return 89;
      case 90:
        return 90;
      case 219:
        return 91;
      case 220:
        return 92;
      case 221:
        return 93;
      case 192:
        return 96;
      case 27:
        return 256;
      case 13:
        return 257;
      case 9:
        return 258;
      case 8:
        return 259;
      case 45:
        return 260;
      case 46:
        return 261;
      case 39:
        return 262;
      case 37:
        return 263;
      case 40:
        return 264;
      case 38:
        return 265;
      case 33:
        return 266;
      case 34:
        return 267;
      case 36:
        return 268;
      case 35:
        return 269;
      case 20:
        return 280;
      case 145:
        return 281;
      case 144:
        return 282;
      case 44:
        return 283;
      case 19:
        return 284;
      case 112:
        return 290;
      case 113:
        return 291;
      case 114:
        return 292;
      case 115:
        return 293;
      case 116:
        return 294;
      case 117:
        return 295;
      case 118:
        return 296;
      case 119:
        return 297;
      case 120:
        return 298;
      case 121:
        return 299;
      case 122:
        return 300;
      case 123:
        return 301;
      case 124:
        return 302;
      case 125:
        return 303;
      case 126:
        return 304;
      case 127:
        return 305;
      case 128:
        return 306;
      case 129:
        return 307;
      case 130:
        return 308;
      case 131:
        return 309;
      case 132:
        return 310;
      case 133:
        return 311;
      case 134:
        return 312;
      case 135:
        return 313;
      case 136:
        return 314;
      case 96:
        return 320;
      case 97:
        return 321;
      case 98:
        return 322;
      case 99:
        return 323;
      case 100:
        return 324;
      case 101:
        return 325;
      case 102:
        return 326;
      case 103:
        return 327;
      case 104:
        return 328;
      case 105:
        return 329;
      case 110:
        return 330;
      case 111:
        return 331;
      case 106:
        return 332;
      case 109:
        return 333;
      case 107:
        return 334;
      case 16:
        return 340;
      case 17:
        return 341;
      case 18:
        return 342;
      case 91:
        return 343;
      case 93:
        return 348;
      default:
        return -1;
    }
  },
  getModBits: (win) => {
    var mod = 0;
    if (win.keys[340]) mod |= 1;
    if (win.keys[341]) mod |= 2;
    if (win.keys[342]) mod |= 4;
    if (win.keys[343]) mod |= 8;
    return mod;
  },
  onKeyPress: (event) => {
    if (!GLFW.active || !GLFW.active.charFunc) return;
    if (event.ctrlKey || event.metaKey) return;
    var charCode = event.charCode;
    if (charCode == 0 || (charCode >= 0 && charCode <= 31)) return;
    ((a1, a2) => dynCall_vii.apply(null, [GLFW.active.charFunc, a1, a2]))(
      GLFW.active.id,
      charCode
    );
  },
  onKeyChanged: (keyCode, status) => {
    if (!GLFW.active) return;
    var key = GLFW.DOMToGLFWKeyCode(keyCode);
    if (key == -1) return;
    var repeat = status && GLFW.active.keys[key];
    GLFW.active.keys[key] = status;
    GLFW.active.domKeys[keyCode] = status;
    if (GLFW.active.keyFunc) {
      if (repeat) status = 2;
      ((a1, a2, a3, a4, a5) =>
        dynCall_viiiii.apply(null, [GLFW.active.keyFunc, a1, a2, a3, a4, a5]))(
        GLFW.active.id,
        key,
        keyCode,
        status,
        GLFW.getModBits(GLFW.active)
      );
    }
  },
  onGamepadConnected: (event) => {
    GLFW.refreshJoysticks();
  },
  onGamepadDisconnected: (event) => {
    GLFW.refreshJoysticks();
  },
  onKeydown: (event) => {
    GLFW.onKeyChanged(event.keyCode, 1);
    if (event.keyCode === 8 || event.keyCode === 9) {
      event.preventDefault();
    }
  },
  onKeyup: (event) => {
    GLFW.onKeyChanged(event.keyCode, 0);
  },
  onBlur: (event) => {
    if (!GLFW.active) return;
    for (var i = 0; i < GLFW.active.domKeys.length; ++i) {
      if (GLFW.active.domKeys[i]) {
        GLFW.onKeyChanged(i, 0);
      }
    }
  },
  onMousemove: (event) => {
    if (!GLFW.active) return;
    Browser.calculateMouseEvent(event);
    if (event.target != Module["canvas"] || !GLFW.active.cursorPosFunc) return;
    if (GLFW.active.cursorPosFunc) {
      ((a1, a2, a3) => {})(GLFW.active.id, Browser.mouseX, Browser.mouseY);
    }
  },
  DOMToGLFWMouseButton: (event) => {
    var eventButton = event["button"];
    if (eventButton > 0) {
      if (eventButton == 1) {
        eventButton = 2;
      } else {
        eventButton = 1;
      }
    }
    return eventButton;
  },
  onMouseenter: (event) => {
    if (!GLFW.active) return;
    if (event.target != Module["canvas"]) return;
    if (GLFW.active.cursorEnterFunc) {
      ((a1, a2) =>
        dynCall_vii.apply(null, [GLFW.active.cursorEnterFunc, a1, a2]))(
        GLFW.active.id,
        1
      );
    }
  },
  onMouseleave: (event) => {
    if (!GLFW.active) return;
    if (event.target != Module["canvas"]) return;
    if (GLFW.active.cursorEnterFunc) {
      ((a1, a2) =>
        dynCall_vii.apply(null, [GLFW.active.cursorEnterFunc, a1, a2]))(
        GLFW.active.id,
        0
      );
    }
  },
  onMouseButtonChanged: (event, status) => {
    if (!GLFW.active) return;
    Browser.calculateMouseEvent(event);
    if (event.target != Module["canvas"]) return;
    var eventButton = GLFW.DOMToGLFWMouseButton(event);
    if (status == 1) {
      GLFW.active.buttons |= 1 << eventButton;
      try {
        event.target.setCapture();
      } catch (e) {}
    } else {
      GLFW.active.buttons &= ~(1 << eventButton);
    }
    if (GLFW.active.mouseButtonFunc) {
      ((a1, a2, a3, a4) =>
        dynCall_viiii.apply(null, [
          GLFW.active.mouseButtonFunc,
          a1,
          a2,
          a3,
          a4,
        ]))(GLFW.active.id, eventButton, status, GLFW.getModBits(GLFW.active));
    }
  },
  onMouseButtonDown: (event) => {
    if (!GLFW.active) return;
    GLFW.onMouseButtonChanged(event, 1);
  },
  onMouseButtonUp: (event) => {
    if (!GLFW.active) return;
    GLFW.onMouseButtonChanged(event, 0);
  },
  onMouseWheel: (event) => {
    var delta = -Browser.getMouseWheelDelta(event);
    delta =
      delta == 0 ? 0 : delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1);
    GLFW.wheelPos += delta;
    if (
      !GLFW.active ||
      !GLFW.active.scrollFunc ||
      event.target != Module["canvas"]
    )
      return;
    var sx = 0;
    var sy = delta;
    if (event.type == "mousewheel") {
      sx = event.wheelDeltaX;
    } else {
      sx = event.deltaX;
    }
    ((a1, a2, a3) => {})(GLFW.active.id, sx, sy);
    event.preventDefault();
  },
  onCanvasResize: (width, height) => {
    if (!GLFW.active) return;
    var resizeNeeded = true;
    if (
      document["fullscreen"] ||
      document["fullScreen"] ||
      document["mozFullScreen"] ||
      document["webkitIsFullScreen"]
    ) {
      GLFW.active.storedX = GLFW.active.x;
      GLFW.active.storedY = GLFW.active.y;
      GLFW.active.storedWidth = GLFW.active.width;
      GLFW.active.storedHeight = GLFW.active.height;
      GLFW.active.x = GLFW.active.y = 0;
      GLFW.active.width = screen.width;
      GLFW.active.height = screen.height;
      GLFW.active.fullscreen = true;
    } else if (GLFW.active.fullscreen == true) {
      GLFW.active.x = GLFW.active.storedX;
      GLFW.active.y = GLFW.active.storedY;
      GLFW.active.width = GLFW.active.storedWidth;
      GLFW.active.height = GLFW.active.storedHeight;
      GLFW.active.fullscreen = false;
    } else if (GLFW.active.width != width || GLFW.active.height != height) {
      GLFW.active.width = width;
      GLFW.active.height = height;
    } else {
      resizeNeeded = false;
    }
    if (resizeNeeded) {
      Browser.setCanvasSize(GLFW.active.width, GLFW.active.height, true);
      GLFW.onWindowSizeChanged();
      GLFW.onFramebufferSizeChanged();
    }
  },
  onWindowSizeChanged: () => {
    if (!GLFW.active) return;
    if (GLFW.active.windowSizeFunc) {
      ((a1, a2, a3) =>
        dynCall_viii.apply(null, [GLFW.active.windowSizeFunc, a1, a2, a3]))(
        GLFW.active.id,
        GLFW.active.width,
        GLFW.active.height
      );
    }
  },
  onFramebufferSizeChanged: () => {
    if (!GLFW.active) return;
    if (GLFW.active.framebufferSizeFunc) {
      ((a1, a2, a3) =>
        dynCall_viii.apply(null, [
          GLFW.active.framebufferSizeFunc,
          a1,
          a2,
          a3,
        ]))(GLFW.active.id, GLFW.active.width, GLFW.active.height);
    }
  },
  onWindowContentScaleChanged: (scale) => {
    GLFW.scale = scale;
    if (!GLFW.active) return;
    if (GLFW.active.windowContentScaleFunc) {
      ((a1, a2, a3) => {})(GLFW.active.id, GLFW.scale, GLFW.scale);
    }
  },
  getTime: () => _emscripten_get_now() / 1e3,
  setWindowTitle: (winid, title) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    win.title = title;
    if (GLFW.active.id == win.id) {
      _emscripten_set_window_title(title);
    }
  },
  setJoystickCallback: (cbfun) => {
    GLFW.joystickFunc = cbfun;
    GLFW.refreshJoysticks();
  },
  joys: {},
  lastGamepadState: [],
  lastGamepadStateFrame: null,
  refreshJoysticks: () => {
    if (
      Browser.mainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame ||
      !Browser.mainLoop.currentFrameNumber
    ) {
      GLFW.lastGamepadState = navigator.getGamepads
        ? navigator.getGamepads()
        : navigator.webkitGetGamepads
        ? navigator.webkitGetGamepads
        : [];
      GLFW.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
      for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
        var gamepad = GLFW.lastGamepadState[joy];
        if (gamepad) {
          if (!GLFW.joys[joy]) {
            out("glfw joystick connected:", joy);
            GLFW.joys[joy] = {
              id: stringToNewUTF8(gamepad.id),
              buttonsCount: gamepad.buttons.length,
              axesCount: gamepad.axes.length,
              buttons: _malloc(gamepad.buttons.length),
              axes: _malloc(gamepad.axes.length * 4),
            };
            if (GLFW.joystickFunc) {
              ((a1, a2) =>
                dynCall_vii.apply(null, [GLFW.joystickFunc, a1, a2]))(
                joy,
                262145
              );
            }
          }
          var data = GLFW.joys[joy];
          for (var i = 0; i < gamepad.buttons.length; ++i) {
            HEAP8[(data.buttons + i) >> 0] = gamepad.buttons[i].pressed;
          }
          for (var i = 0; i < gamepad.axes.length; ++i) {
            HEAPF32[(data.axes + i * 4) >> 2] = gamepad.axes[i];
          }
        } else {
          if (GLFW.joys[joy]) {
            out("glfw joystick disconnected", joy);
            if (GLFW.joystickFunc) {
              ((a1, a2) =>
                dynCall_vii.apply(null, [GLFW.joystickFunc, a1, a2]))(
                joy,
                262146
              );
            }
            _free(GLFW.joys[joy].id);
            _free(GLFW.joys[joy].buttons);
            _free(GLFW.joys[joy].axes);
            delete GLFW.joys[joy];
          }
        }
      }
    }
  },
  setKeyCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.keyFunc;
    win.keyFunc = cbfun;
    return prevcbfun;
  },
  setCharCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.charFunc;
    win.charFunc = cbfun;
    return prevcbfun;
  },
  setMouseButtonCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.mouseButtonFunc;
    win.mouseButtonFunc = cbfun;
    return prevcbfun;
  },
  setCursorPosCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.cursorPosFunc;
    win.cursorPosFunc = cbfun;
    return prevcbfun;
  },
  setScrollCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.scrollFunc;
    win.scrollFunc = cbfun;
    return prevcbfun;
  },
  setDropCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.dropFunc;
    win.dropFunc = cbfun;
    return prevcbfun;
  },
  onDrop: (event) => {
    if (!GLFW.active || !GLFW.active.dropFunc) return;
    if (
      !event.dataTransfer ||
      !event.dataTransfer.files ||
      event.dataTransfer.files.length == 0
    )
      return;
    event.preventDefault();
    var filenames = _malloc(event.dataTransfer.files.length * 4);
    var filenamesArray = [];
    var count = event.dataTransfer.files.length;
    var written = 0;
    var drop_dir = ".glfw_dropped_files";
    FS.createPath("/", drop_dir);
    function save(file) {
      var path = "/" + drop_dir + "/" + file.name.replace(/\//g, "_");
      var reader = new FileReader();
      reader.onloadend = (e) => {
        if (reader.readyState != 2) {
          ++written;
          out(
            "failed to read dropped file: " + file.name + ": " + reader.error
          );
          return;
        }
        var data = e.target.result;
        FS.writeFile(path, new Uint8Array(data));
        if (++written === count) {
          ((a1, a2, a3) =>
            dynCall_viii.apply(null, [GLFW.active.dropFunc, a1, a2, a3]))(
            GLFW.active.id,
            count,
            filenames
          );
          for (var i = 0; i < filenamesArray.length; ++i) {
            _free(filenamesArray[i]);
          }
          _free(filenames);
        }
      };
      reader.readAsArrayBuffer(file);
      var filename = stringToNewUTF8(path);
      filenamesArray.push(filename);
      HEAPU32[(filenames + i * 4) >> 2] = filename;
    }
    for (var i = 0; i < count; ++i) {
      save(event.dataTransfer.files[i]);
    }
    return false;
  },
  onDragover: (event) => {
    if (!GLFW.active || !GLFW.active.dropFunc) return;
    event.preventDefault();
    return false;
  },
  setWindowSizeCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.windowSizeFunc;
    win.windowSizeFunc = cbfun;
    return prevcbfun;
  },
  setWindowCloseCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.windowCloseFunc;
    win.windowCloseFunc = cbfun;
    return prevcbfun;
  },
  setWindowRefreshCallback: (winid, cbfun) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return null;
    var prevcbfun = win.windowRefreshFunc;
    win.windowRefreshFunc = cbfun;
    return prevcbfun;
  },
  onClickRequestPointerLock: (e) => {
    if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
      Module["canvas"].requestPointerLock();
      e.preventDefault();
    }
  },
  setInputMode: (winid, mode, value) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    switch (mode) {
      case 208897: {
        switch (value) {
          case 212993: {
            win.inputModes[mode] = value;
            Module["canvas"].removeEventListener(
              "click",
              GLFW.onClickRequestPointerLock,
              true
            );
            Module["canvas"].exitPointerLock();
            break;
          }
          case 212994: {
            err(
              "glfwSetInputMode called with GLFW_CURSOR_HIDDEN value not implemented"
            );
            break;
          }
          case 212995: {
            win.inputModes[mode] = value;
            Module["canvas"].addEventListener(
              "click",
              GLFW.onClickRequestPointerLock,
              true
            );
            Module["canvas"].requestPointerLock();
            break;
          }
          default: {
            err(
              `glfwSetInputMode called with unknown value parameter value: ${value}`
            );
            break;
          }
        }
        break;
      }
      case 208898: {
        err(
          "glfwSetInputMode called with GLFW_STICKY_KEYS mode not implemented"
        );
        break;
      }
      case 208899: {
        err(
          "glfwSetInputMode called with GLFW_STICKY_MOUSE_BUTTONS mode not implemented"
        );
        break;
      }
      case 208900: {
        err(
          "glfwSetInputMode called with GLFW_LOCK_KEY_MODS mode not implemented"
        );
        break;
      }
      case 3342341: {
        err(
          "glfwSetInputMode called with GLFW_RAW_MOUSE_MOTION mode not implemented"
        );
        break;
      }
      default: {
        err(
          `glfwSetInputMode called with unknown mode parameter value: ${mode}`
        );
        break;
      }
    }
  },
  getKey: (winid, key) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return 0;
    return win.keys[key];
  },
  getMouseButton: (winid, button) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return 0;
    return (win.buttons & (1 << button)) > 0;
  },
  getCursorPos: (winid, x, y) => {
    HEAPF64[x >> 3] = Browser.mouseX;
    HEAPF64[y >> 3] = Browser.mouseY;
  },
  getMousePos: (winid, x, y) => {
    HEAP32[x >> 2] = Browser.mouseX;
    HEAP32[y >> 2] = Browser.mouseY;
  },
  setCursorPos: (winid, x, y) => {},
  getWindowPos: (winid, x, y) => {
    var wx = 0;
    var wy = 0;
    var win = GLFW.WindowFromId(winid);
    if (win) {
      wx = win.x;
      wy = win.y;
    }
    if (x) {
      HEAP32[x >> 2] = wx;
    }
    if (y) {
      HEAP32[y >> 2] = wy;
    }
  },
  setWindowPos: (winid, x, y) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    win.x = x;
    win.y = y;
  },
  getWindowSize: (winid, width, height) => {
    var ww = 0;
    var wh = 0;
    var win = GLFW.WindowFromId(winid);
    if (win) {
      ww = win.width;
      wh = win.height;
    }
    if (width) {
      HEAP32[width >> 2] = ww;
    }
    if (height) {
      HEAP32[height >> 2] = wh;
    }
  },
  setWindowSize: (winid, width, height) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    if (GLFW.active.id == win.id) {
      if (width == screen.width && height == screen.height) {
        Browser.requestFullscreen();
      } else {
        Browser.exitFullscreen();
        Browser.setCanvasSize(width, height);
        win.width = width;
        win.height = height;
      }
    }
    if (win.windowSizeFunc) {
      ((a1, a2, a3) =>
        dynCall_viii.apply(null, [win.windowSizeFunc, a1, a2, a3]))(
        win.id,
        width,
        height
      );
    }
  },
  createWindow: (width, height, title, monitor, share) => {
    var i, id;
    for (i = 0; i < GLFW.windows.length && GLFW.windows[i] !== null; i++) {}
    if (i > 0)
      throw "glfwCreateWindow only supports one window at time currently";
    id = i + 1;
    if (width <= 0 || height <= 0) return 0;
    if (monitor) {
      Browser.requestFullscreen();
    } else {
      Browser.setCanvasSize(width, height);
    }
    for (i = 0; i < GLFW.windows.length && GLFW.windows[i] == null; i++) {}
    var useWebGL = GLFW.hints[139265] > 0;
    if (i == GLFW.windows.length) {
      if (useWebGL) {
        var contextAttributes = {
          antialias: GLFW.hints[135181] > 1,
          depth: GLFW.hints[135173] > 0,
          stencil: GLFW.hints[135174] > 0,
          alpha: GLFW.hints[135172] > 0,
        };
        Module.ctx = Browser.createContext(
          Module["canvas"],
          true,
          true,
          contextAttributes
        );
      } else {
        Browser.init();
      }
    }
    if (!Module.ctx && useWebGL) return 0;
    var win = new GLFW_Window(id, width, height, title, monitor, share);
    if (id - 1 == GLFW.windows.length) {
      GLFW.windows.push(win);
    } else {
      GLFW.windows[id - 1] = win;
    }
    GLFW.active = win;
    return win.id;
  },
  destroyWindow: (winid) => {
    var win = GLFW.WindowFromId(winid);
    if (!win) return;
    if (win.windowCloseFunc) {
      ((a1) => dynCall_vi.apply(null, [win.windowCloseFunc, a1]))(win.id);
    }
    GLFW.windows[win.id - 1] = null;
    if (GLFW.active.id == win.id) GLFW.active = null;
    for (var i = 0; i < GLFW.windows.length; i++)
      if (GLFW.windows[i] !== null) return;
    Module.ctx = Browser.destroyContext(Module["canvas"], true, true);
  },
  swapBuffers: (winid) => {},
  GLFW2ParamToGLFW3Param: (param) => {
    var table = {
      196609: 0,
      196610: 0,
      196611: 0,
      196612: 0,
      196613: 0,
      196614: 0,
      131073: 0,
      131074: 0,
      131075: 0,
      131076: 0,
      131077: 135169,
      131078: 135170,
      131079: 135171,
      131080: 135172,
      131081: 135173,
      131082: 135174,
      131083: 135183,
      131084: 135175,
      131085: 135176,
      131086: 135177,
      131087: 135178,
      131088: 135179,
      131089: 135180,
      131090: 0,
      131091: 135181,
      131092: 139266,
      131093: 139267,
      131094: 139270,
      131095: 139271,
      131096: 139272,
    };
    return table[param];
  },
};
var _glfwCreateWindow = (width, height, title, monitor, share) =>
  GLFW.createWindow(width, height, title, monitor, share);
var _emscripten_get_device_pixel_ratio = () =>
  (typeof devicePixelRatio == "number" && devicePixelRatio) || 1;
var _glfwInit = () => {
  if (GLFW.windows) return 1;
  GLFW.initialTime = GLFW.getTime();
  GLFW.hints = GLFW.defaultHints;
  GLFW.windows = new Array();
  GLFW.active = null;
  GLFW.scale = _emscripten_get_device_pixel_ratio();
  window.addEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
  window.addEventListener(
    "gamepaddisconnected",
    GLFW.onGamepadDisconnected,
    true
  );
  window.addEventListener("keydown", GLFW.onKeydown, true);
  window.addEventListener("keypress", GLFW.onKeyPress, true);
  window.addEventListener("keyup", GLFW.onKeyup, true);
  window.addEventListener("blur", GLFW.onBlur, true);
  (function updatePixelRatio() {
    window
      .matchMedia("(resolution: " + window.devicePixelRatio + "dppx)")
      .addEventListener("change", updatePixelRatio, { once: true });
    GLFW.onWindowContentScaleChanged(_emscripten_get_device_pixel_ratio());
  })();
  Module["canvas"].addEventListener("touchmove", GLFW.onMousemove, true);
  Module["canvas"].addEventListener("touchstart", GLFW.onMouseButtonDown, true);
  Module["canvas"].addEventListener("touchcancel", GLFW.onMouseButtonUp, true);
  Module["canvas"].addEventListener("touchend", GLFW.onMouseButtonUp, true);
  Module["canvas"].addEventListener("mousemove", GLFW.onMousemove, true);
  Module["canvas"].addEventListener("mousedown", GLFW.onMouseButtonDown, true);
  Module["canvas"].addEventListener("mouseup", GLFW.onMouseButtonUp, true);
  Module["canvas"].addEventListener("wheel", GLFW.onMouseWheel, true);
  Module["canvas"].addEventListener("mousewheel", GLFW.onMouseWheel, true);
  Module["canvas"].addEventListener("mouseenter", GLFW.onMouseenter, true);
  Module["canvas"].addEventListener("mouseleave", GLFW.onMouseleave, true);
  Module["canvas"].addEventListener("drop", GLFW.onDrop, true);
  Module["canvas"].addEventListener("dragover", GLFW.onDragover, true);
  Browser.resizeListeners.push((width, height) => {
    GLFW.onCanvasResize(width, height);
  });
  return 1;
};
var _glfwMakeContextCurrent = (winid) => {};
var _glfwPollEvents = () => {};
var _glfwSwapBuffers = (winid) => GLFW.swapBuffers(winid);
var _glfwWindowHint = (target, hint) => {
  GLFW.hints[target] = hint;
};
var runAndAbortIfError = (func) => {
  try {
    return func();
  } catch (e) {
    abort(e);
  }
};
var Asyncify = {
  instrumentWasmImports(imports) {
    var importPattern = /^(invoke_.*|__asyncjs__.*)$/;
    for (var x in imports) {
      (function (x) {
        var original = imports[x];
        var sig = original.sig;
        if (typeof original == "function") {
          var isAsyncifyImport = original.isAsync || importPattern.test(x);
        }
      })(x);
    }
  },
  instrumentWasmExports(exports) {
    var ret = {};
    for (var x in exports) {
      (function (x) {
        var original = exports[x];
        if (typeof original == "function") {
          ret[x] = function () {
            Asyncify.exportCallStack.push(x);
            try {
              return original.apply(null, arguments);
            } finally {
              if (!ABORT) {
                var y = Asyncify.exportCallStack.pop();
                assert(y === x);
                Asyncify.maybeStopUnwind();
              }
            }
          };
        } else {
          ret[x] = original;
        }
      })(x);
    }
    return ret;
  },
  State: { Normal: 0, Unwinding: 1, Rewinding: 2, Disabled: 3 },
  state: 0,
  StackSize: 4096,
  currData: null,
  handleSleepReturnValue: 0,
  exportCallStack: [],
  callStackNameToId: {},
  callStackIdToName: {},
  callStackId: 0,
  asyncPromiseHandlers: null,
  sleepCallbacks: [],
  getCallStackId(funcName) {
    var id = Asyncify.callStackNameToId[funcName];
    if (id === undefined) {
      id = Asyncify.callStackId++;
      Asyncify.callStackNameToId[funcName] = id;
      Asyncify.callStackIdToName[id] = funcName;
    }
    return id;
  },
  maybeStopUnwind() {
    if (
      Asyncify.currData &&
      Asyncify.state === Asyncify.State.Unwinding &&
      Asyncify.exportCallStack.length === 0
    ) {
      Asyncify.state = Asyncify.State.Normal;
      runtimeKeepalivePush();
      runAndAbortIfError(_asyncify_stop_unwind);
      if (typeof Fibers != "undefined") {
        Fibers.trampoline();
      }
    }
  },
  whenDone() {
    return new Promise((resolve, reject) => {
      Asyncify.asyncPromiseHandlers = { resolve: resolve, reject: reject };
    });
  },
  allocateData() {
    var ptr = _malloc(12 + Asyncify.StackSize);
    Asyncify.setDataHeader(ptr, ptr + 12, Asyncify.StackSize);
    Asyncify.setDataRewindFunc(ptr);
    return ptr;
  },
  setDataHeader(ptr, stack, stackSize) {
    HEAPU32[ptr >> 2] = stack;
    HEAPU32[(ptr + 4) >> 2] = stack + stackSize;
  },
  setDataRewindFunc(ptr) {
    var bottomOfCallStack = Asyncify.exportCallStack[0];
    var rewindId = Asyncify.getCallStackId(bottomOfCallStack);
    HEAP32[(ptr + 8) >> 2] = rewindId;
  },
  getDataRewindFunc(ptr) {
    var id = HEAP32[(ptr + 8) >> 2];
    var name = Asyncify.callStackIdToName[id];
    var func = wasmExports[name];
    return func;
  },
  doRewind(ptr) {
    var start = Asyncify.getDataRewindFunc(ptr);
    runtimeKeepalivePop();
    return start();
  },
  handleSleep(startAsync) {
    if (ABORT) return;
    if (Asyncify.state === Asyncify.State.Normal) {
      var reachedCallback = false;
      var reachedAfterCallback = false;
      startAsync((handleSleepReturnValue = 0) => {
        if (ABORT) return;
        Asyncify.handleSleepReturnValue = handleSleepReturnValue;
        reachedCallback = true;
        if (!reachedAfterCallback) {
          return;
        }
        Asyncify.state = Asyncify.State.Rewinding;
        runAndAbortIfError(() => _asyncify_start_rewind(Asyncify.currData));
        if (typeof Browser != "undefined" && Browser.mainLoop.func) {
          Browser.mainLoop.resume();
        }
        var asyncWasmReturnValue,
          isError = false;
        try {
          asyncWasmReturnValue = Asyncify.doRewind(Asyncify.currData);
        } catch (err) {
          asyncWasmReturnValue = err;
          isError = true;
        }
        var handled = false;
        if (!Asyncify.currData) {
          var asyncPromiseHandlers = Asyncify.asyncPromiseHandlers;
          if (asyncPromiseHandlers) {
            Asyncify.asyncPromiseHandlers = null;
            (isError
              ? asyncPromiseHandlers.reject
              : asyncPromiseHandlers.resolve)(asyncWasmReturnValue);
            handled = true;
          }
        }
        if (isError && !handled) {
          throw asyncWasmReturnValue;
        }
      });
      reachedAfterCallback = true;
      if (!reachedCallback) {
        Asyncify.state = Asyncify.State.Unwinding;
        Asyncify.currData = Asyncify.allocateData();
        if (typeof Browser != "undefined" && Browser.mainLoop.func) {
          Browser.mainLoop.pause();
        }
        runAndAbortIfError(() => _asyncify_start_unwind(Asyncify.currData));
      }
    } else if (Asyncify.state === Asyncify.State.Rewinding) {
      Asyncify.state = Asyncify.State.Normal;
      runAndAbortIfError(_asyncify_stop_rewind);
      _free(Asyncify.currData);
      Asyncify.currData = null;
      Asyncify.sleepCallbacks.forEach((func) => callUserCallback(func));
    } else {
      abort(`invalid state: ${Asyncify.state}`);
    }
    return Asyncify.handleSleepReturnValue;
  },
  handleAsync(startAsync) {
    return Asyncify.handleSleep((wakeUp) => {
      startAsync().then(wakeUp);
    });
  },
};
var FSNode = function (parent, name, mode, rdev) {
  if (!parent) {
    parent = this;
  }
  this.parent = parent;
  this.mount = parent.mount;
  this.mounted = null;
  this.id = FS.nextInode++;
  this.name = name;
  this.mode = mode;
  this.node_ops = {};
  this.stream_ops = {};
  this.rdev = rdev;
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
  read: {
    get: function () {
      return (this.mode & readMode) === readMode;
    },
    set: function (val) {
      val ? (this.mode |= readMode) : (this.mode &= ~readMode);
    },
  },
  write: {
    get: function () {
      return (this.mode & writeMode) === writeMode;
    },
    set: function (val) {
      val ? (this.mode |= writeMode) : (this.mode &= ~writeMode);
    },
  },
  isFolder: {
    get: function () {
      return FS.isDir(this.mode);
    },
  },
  isDevice: {
    get: function () {
      return FS.isChrdev(this.mode);
    },
  },
});
FS.FSNode = FSNode;
FS.createPreloadedFile = FS_createPreloadedFile;
FS.staticInit();
embind_init_charCodes();
BindingError = Module["BindingError"] = class BindingError extends Error {
  constructor(message) {
    super(message);
    this.name = "BindingError";
  }
};
InternalError = Module["InternalError"] = class InternalError extends Error {
  constructor(message) {
    super(message);
    this.name = "InternalError";
  }
};
handleAllocatorInit();
init_emval();
Module["requestFullscreen"] = (lockPointer, resizeCanvas) =>
  Browser.requestFullscreen(lockPointer, resizeCanvas);
Module["requestAnimationFrame"] = (func) => Browser.requestAnimationFrame(func);
Module["setCanvasSize"] = (width, height, noUpdates) =>
  Browser.setCanvasSize(width, height, noUpdates);
Module["pauseMainLoop"] = () => Browser.mainLoop.pause();
Module["resumeMainLoop"] = () => Browser.mainLoop.resume();
Module["getUserMedia"] = () => Browser.getUserMedia();
Module["createContext"] = (
  canvas,
  useWebGL,
  setInModule,
  webGLContextAttributes
) =>
  Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
var preloadedImages = {};
var preloadedAudios = {};
var GLctx;
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
  miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(
    0,
    i + 1
  );
}
var wasmImports = {
  a: ___assert_fail,
  n: ___syscall_fcntl64,
  F: ___syscall_ioctl,
  G: ___syscall_openat,
  C: __embind_register_bigint,
  K: __embind_register_bool,
  I: __embind_register_emval,
  p: __embind_register_float,
  c: __embind_register_integer,
  b: __embind_register_memory_view,
  o: __embind_register_std_string,
  h: __embind_register_std_wstring,
  L: __embind_register_void,
  Y: _emscripten_force_exit,
  H: _emscripten_memcpy_js,
  D: _emscripten_resize_heap,
  U: _emscripten_set_main_loop,
  l: _fd_close,
  E: _fd_read,
  B: _fd_seek,
  m: _fd_write,
  fa: _glActiveTexture,
  u: _glAttachShader,
  f: _glBindBuffer,
  i: _glBindTexture,
  j: _glBindVertexArray,
  W: _glBlendEquation,
  V: _glBlendFunc,
  ca: _glBufferData,
  ia: _glClear,
  y: _glClearColor,
  v: _glCompileShader,
  ha: _glCreateProgram,
  x: _glCreateShader,
  s: _glDeleteShader,
  O: _glDrawArrays,
  q: _glEnable,
  $: _glEnableVertexAttribArray,
  da: _glGenBuffers,
  ja: _glGenTextures,
  ba: _glGenVertexArrays,
  A: _glGenerateMipmap,
  ea: _glGetProgramInfoLog,
  t: _glGetProgramiv,
  r: _glGetShaderInfoLog,
  g: _glGetShaderiv,
  k: _glGetUniformLocation,
  ga: _glLinkProgram,
  w: _glShaderSource,
  e: _glTexParameteri,
  S: _glTexStorage2D,
  J: _glTexSubImage2D,
  R: _glUniform1i,
  P: _glUniform4fv,
  Q: _glUniformMatrix4fv,
  T: _glUseProgram,
  aa: _glVertexAttribPointer,
  z: _glViewport,
  Z: _glfwCreateWindow,
  _: _glfwInit,
  X: _glfwMakeContextCurrent,
  N: _glfwPollEvents,
  M: _glfwSwapBuffers,
  d: _glfwWindowHint,
};
var wasmExports = createWasm();
var ___wasm_call_ctors = () => (___wasm_call_ctors = wasmExports["la"])();
var _free = (Module["_free"] = (a0) =>
  (_free = Module["_free"] = wasmExports["ma"])(a0));
var _malloc = (Module["_malloc"] = (a0) =>
  (_malloc = Module["_malloc"] = wasmExports["na"])(a0));
var _hellow_world = (Module["_hellow_world"] = () =>
  (_hellow_world = Module["_hellow_world"] = wasmExports["oa"])());
var _get_string = (Module["_get_string"] = () =>
  (_get_string = Module["_get_string"] = wasmExports["pa"])());
var _print_string_c = (Module["_print_string_c"] = (a0) =>
  (_print_string_c = Module["_print_string_c"] = wasmExports["qa"])(a0));
var _register_gl_tex_handle = (Module["_register_gl_tex_handle"] = (
  a0,
  a1,
  a2,
  a3
) =>
  (_register_gl_tex_handle = Module["_register_gl_tex_handle"] =
    wasmExports["ra"])(a0, a1, a2, a3));
var _main = (Module["_main"] = (a0, a1) =>
  (_main = Module["_main"] = wasmExports["sa"])(a0, a1));
var ___getTypeName = (a0) =>
  (___getTypeName = wasmExports["__getTypeName"])(a0);
var __embind_initialize_bindings = (Module["__embind_initialize_bindings"] =
  () =>
    (__embind_initialize_bindings = Module["__embind_initialize_bindings"] =
      wasmExports["ua"])());
var ___errno_location = () => (___errno_location = wasmExports["va"])();
var ___funcs_on_exit = () => (___funcs_on_exit = wasmExports["wa"])();
var _fflush = (Module["_fflush"] = (a0) =>
  (_fflush = Module["_fflush"] = wasmExports["xa"])(a0));
var dynCall_viii = (Module["dynCall_viii"] = (a0, a1, a2, a3) =>
  (dynCall_viii = Module["dynCall_viii"] = wasmExports["ya"])(a0, a1, a2, a3));
var dynCall_v = (Module["dynCall_v"] = (a0) =>
  (dynCall_v = Module["dynCall_v"] = wasmExports["za"])(a0));
var dynCall_vii = (Module["dynCall_vii"] = (a0, a1, a2) =>
  (dynCall_vii = Module["dynCall_vii"] = wasmExports["Aa"])(a0, a1, a2));
var dynCall_vi = (Module["dynCall_vi"] = (a0, a1) =>
  (dynCall_vi = Module["dynCall_vi"] = wasmExports["Ba"])(a0, a1));
var dynCall_viiiii = (Module["dynCall_viiiii"] = (a0, a1, a2, a3, a4, a5) =>
  (dynCall_viiiii = Module["dynCall_viiiii"] = wasmExports["Ca"])(
    a0,
    a1,
    a2,
    a3,
    a4,
    a5
  ));
var dynCall_viiii = (Module["dynCall_viiii"] = (a0, a1, a2, a3, a4) =>
  (dynCall_viiii = Module["dynCall_viiii"] = wasmExports["Da"])(
    a0,
    a1,
    a2,
    a3,
    a4
  ));
var _asyncify_start_unwind = (a0) =>
  (_asyncify_start_unwind = wasmExports["Ea"])(a0);
var _asyncify_stop_unwind = () => (_asyncify_stop_unwind = wasmExports["Fa"])();
var _asyncify_start_rewind = (a0) =>
  (_asyncify_start_rewind = wasmExports["Ga"])(a0);
var _asyncify_stop_rewind = () => (_asyncify_stop_rewind = wasmExports["Ha"])();
Module["UTF8ToString"] = UTF8ToString;
Module["stringToNewUTF8"] = stringToNewUTF8;
var calledRun;
dependenciesFulfilled = function runCaller() {
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};
function callMain() {
  var entryFunction = _main;
  var argc = 0;
  var argv = 0;
  try {
    var ret = entryFunction(argc, argv);
    exitJS(ret, true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}
function run() {
  if (runDependencies > 0) {
    return;
  }
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    if (shouldRunNow) callMain();
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function () {
      setTimeout(function () {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function")
    Module["preInit"] = [Module["preInit"]];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) shouldRunNow = false;
run();
