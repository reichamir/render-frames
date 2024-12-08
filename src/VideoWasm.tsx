import { useCallback, useEffect, useRef } from "react";

export function VideoWasm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());

  const getCanvasContext = useCallback(() => {
    const ctx = canvasRef.current.getContext("2d");
    const [width, height] = [canvasRef.current.width, canvasRef.current.height];

    return { ctx, width, height };
  }, [canvasRef]);

  async function loadWasm() {
    const { width, height } = getCanvasContext();
    const arraySize = (width * height * 4) >>> 0;
    const nPages = ((arraySize + 0xffff) & ~0xffff) >>> 16;
    const memory = new WebAssembly.Memory({ initial: nPages });

    const wasm = await WebAssembly.instantiateStreaming(
      fetch("./wasm/imaging.wasm"),
      {
        env: {
          memory,
          abort: (_msg, _file, line, column) =>
            console.error(`Abort at ${line}:${column}`),
          seed: () => new Date().getTime(),
        },
      }
    );

    return wasm.instance.exports;
  }

  function original() {
    const { ctx, width, height } = getCanvasContext();
    ctx.drawImage(imgRef.current, 0, 0, width, height);
  }

  function originalImageData() {
    const { ctx, width, height } = getCanvasContext();
    original();
    return ctx.getImageData(0, 0, width, height);
  }

  function copyData(src, dest) {
    for (let i = 0; i < src.length; i++) dest[i] = src[i];
  }

  function writeImageData(imageData, bytes) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i++) data[i] = bytes[i];

    const { ctx } = getCanvasContext();
    ctx.putImageData(imageData, 0, 0);
  }

  async function manipulate() {
    const wasm = await loadWasm();

    const imageData = originalImageData();
    const bytes = new Uint8ClampedArray(wasm.memory.buffer);

    copyData(imageData.data, bytes);

    const { width, height } = getCanvasContext();

    wasm.grayscale(width, height);

    writeImageData(imageData, bytes);
  }

  useEffect(() => {
    const importObject = {
      my_namespace: {
        imported_func: (arg) => {
          console.log(arg);
        },
      },
    };

    WebAssembly.instantiateStreaming(
      fetch("/wasm/simple.wasm"),
      importObject
    ).then((obj) => obj.instance.exports.exported_func());

    const memory = new WebAssembly.Memory({ initial: 10, maximum: 100 });
    const data = new DataView(memory.buffer);
    data.setUint32(0, 42, true);
    console.log(data.getUint32(0, true));

    WebAssembly.instantiateStreaming(fetch("/wasm/memory.wasm"), {
      js: { mem: memory },
    }).then((results) => {
      const summands = new DataView(memory.buffer);
      for (let i = 0; i < 10; i++) {
        summands.setUint32(i * 4, i, true);
      }
      const sum = results.instance.exports.accumulate(0, 10);
      console.log(sum);
    });

    WebAssembly.instantiateStreaming(fetch("/wasm/table.wasm")).then(
      (results) => {
        const tbl = results.instance.exports.tbl;
        console.log(tbl.get(0)()); // 13
        console.log(tbl.get(1)()); // 42
      }
    );

    const global = new WebAssembly.Global({ value: "i32", mutable: true }, 0);

    WebAssembly.instantiateStreaming(fetch("/wasm/global.wasm"), {
      js: { global },
    }).then(({ instance }) => {
      console.log(instance.exports.getGlobal());

      global.value = 42;

      console.log(instance.exports.getGlobal());

      instance.exports.incGlobal();

      console.log(instance.exports.getGlobal());
      console.log(global.value);
    });

    const { ctx, width, height } = getCanvasContext();
    imgRef.current.src = "./waterlily.png";
    imgRef.current.crossOrigin = "anonymous";
    imgRef.current.onload = () =>
      ctx.drawImage(imgRef.current, 0, 0, width, height);

    // init().then((instance) => {
    //   instance.exports.test();
    // });

    // fetch("./simple.wasm")
    //   .then((response) => response.arrayBuffer())
    //   .then((bytes) => WebAssembly.instantiate(bytes, importObject))
    //   .then((results) => {
    //     results.instance.exports.exported_func();
    //   });
  }, [imgRef, getCanvasContext]);

  return (
    <div>
      Hellooo
      <canvas id="canvas" ref={canvasRef} width="500" height="500"></canvas>
      <button onClick={() => manipulate()}>Grayscale</button>
    </div>
  );
}
