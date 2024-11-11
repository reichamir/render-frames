import { Canvas2DRenderer } from "./canvas2DRenderer.js";
import { MP4Demuxer } from "./mp4Demuxer.js";

let renderer = null;
  // Rendering. Drawing is limited to once per animation frame.
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

function start({url, canvas}) {
    renderer = new Canvas2DRenderer(canvas);

    const decoder = new VideoDecoder({
        output(frame) {
          renderFrame(frame);
        },
        error(e) {
          console.error(e);
        }
      });

      const demuxer = new MP4Demuxer({
        onConfig(config) {
          console.log('config', config);
          decoder.configure(config);
        },
        onChunk(chunk) {
          decoder.decode(chunk);
        },
      });

      demuxer.fetchData(url)
}

self.addEventListener("message", e => {
    start(e.data);
}, {once: true});