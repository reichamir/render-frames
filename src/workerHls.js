import { Canvas2DRenderer } from "./canvas2DRenderer.js";
import muxjs from "mux.js";
import { MP4Demuxer } from "./transmuxTsToMp4";

let decoder = null;
let renderer = null;
let pendingFrame = null;
const tsMuxer = new muxjs.mp4.Transmuxer();
let demuxer = null;

function renderFrame(frame) {
  if (!pendingFrame) {
    // Schedule rendering in the next animation frame.
    requestAnimationFrame(renderAnimationFrame);
  } else {  
    // Close the current pending frame before replacing it.
    pendingFrame.close();
  }
  // Set or replace the pending frame.
  pendingFrame = frame;
}

function renderAnimationFrame() {
  renderer.draw(pendingFrame);
  pendingFrame = null;
}

function initCanvas(canvas) {
    renderer = new Canvas2DRenderer(canvas);
}

function initDecoder(decoderConfig) {
    decoder = new VideoDecoder({
        output(frame) {
          renderFrame(frame);
        },
        error(e) {
          console.error(e);
        }
      });

      decoder.configure(decoderConfig);
}

demuxer = new MP4Demuxer({
  onConfig: (e) => {
    initDecoder(e);
  },
  onChunk: (e) => {
    const chunk = new EncodedVideoChunk({
        type: e.type,
        timestamp: e.timestamp,
        duration: e.duration,
        data: e.data,
    });

    decoder.decode(chunk);
  },
  setStatus: (e) => console.log("setStatus", e),
})

function handleInitTs(tsMpegUrl) {
  return new Promise(async(resolve) => {
    tsMuxer.on("data", (segment) => {
      let data = new Uint8Array(
        segment.initSegment.byteLength + segment.data.byteLength
      );
      data.set(segment.initSegment, 0);
      data.set(segment.data, segment.initSegment.byteLength);
  
      demuxer.writeChunk(data);
    });
  
    const response = await fetch(tsMpegUrl)
    const buffer = await response.arrayBuffer();
    tsMuxer.push(new Uint8Array(buffer));
    tsMuxer.flush();
    resolve();
  })
}

function handleNextTs(tsMpegUrls) {
  tsMuxer.off("data");
  tsMuxer.on("data", (segment) => {
    const data = new Uint8Array(segment.data);
    demuxer.writeChunk(data);
  });

  tsMpegUrls.forEach(async tsMpegUrl => {
    const response = await fetch(tsMpegUrl)
    const buffer = await response.arrayBuffer();
    tsMuxer.push(new Uint8Array(buffer));
    tsMuxer.flush();
  })
}

async function handleTsMpegList(tsMpegUrls) {
  await handleInitTs(tsMpegUrls[0]);
  handleNextTs(tsMpegUrls.slice(1));
}

self.addEventListener("message", e => {
    const { type, ...data } = e.data;

    if (type === "initCanvas") {
      initCanvas(data.canvas);
    } else if (type === "handleTsMpegList") {
      handleTsMpegList(data.tsMpegUrls);
    } 
});