import { Canvas2DRenderer } from "./canvas2DRenderer.js";
import { TransmuxHlsToMp4 } from "./transmuxHlsToMp4";
import { MP4Demuxer } from './mp4Demuxer.js';

let decoder = null;
let renderer = null;
let pendingFrame = null;

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

function start(tsUrls) {
  const mp4Demuxer = new MP4Demuxer({
    onConfig: (data) => {
      initDecoder(data);
    },
    onChunk: (encodedVideoChunk) => {
      decoder.decode(encodedVideoChunk);
    },
  });

  new TransmuxHlsToMp4({
    tsUrls, 
    onChunk: (chunk) => {
      mp4Demuxer.write(chunk);
    }
  });
}

self.addEventListener("message", e => {
    const { type, ...data } = e.data;

    if (type === "initCanvas") {
      initCanvas(data.canvas);
    } else if (type === "start") {
      start(data.tsUrls);
    } 
});