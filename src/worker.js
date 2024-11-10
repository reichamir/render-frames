import { Canvas2DRenderer } from "./canvas2DRenderer.js";
import { MP4Demuxer } from "./demuxerMp4.js";

let renderer = null;
  // Rendering. Drawing is limited to once per animation frame.
  let pendingFrame = null;

function setStatus(type, message) {
    console.log('setStatus',type, message);
  }


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
    console.log('renderAnimationFrame',pendingFrame);
  renderer.draw(pendingFrame);
  pendingFrame = null;
}

function start({dataUri, canvas}) {
    renderer = new Canvas2DRenderer(canvas);

    const decoder = new VideoDecoder({
        output(frame) {
          renderFrame(frame);
        },
        error(e) {
          console.error(e);
        }
      });

      new MP4Demuxer(dataUri, {
        onConfig(config) {
          console.log('config', config);
          decoder.configure(config);
        },
        onChunk(chunk) {
          decoder.decode(chunk);
        },
        setStatus
      });
}

self.addEventListener("message", e => {
    start(e.data);
}, {once: true});

self.postMessage("Hello from worker");