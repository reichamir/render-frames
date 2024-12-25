import { VideoRenderer } from "./videoRenderer.js";
import { MP4PullDemuxer } from "./mp4PullDemuxer/mp4PullDemuxer.js";

let canvasCtx = null;
let tsUrls = null;
let isWasmLoaded = false;
const videoRenderer = new VideoRenderer();
let startPlayTime = 0;
let currentTime = 0;
let prevRenderTime = null;
let isPlaying = false;

self.Module = {
  print: (e) => {
    console.log("print", e);
  },
  setStatus: (text) => {
    console.log("setStatus", text);
  },
  totalDependencies: 0,
  monitorRunDependencies: (left) => {
    console.log("monitorRunDependencies", left);
  },
  onRuntimeInitialized: () => {
    console.log("wasm loaded");

    isWasmLoaded = true;

    onInit();
  },
};

async function initCanvas(canvas) {
  self.Module.canvas = canvas;
  canvasCtx = canvas.getContext("webgl2", { antialias: false });

  await import("../public/wasm/Uncensored3D.js");
}

function onTsLoaded(_tsUrls) {
  tsUrls = _tsUrls;
  onInit();
}

async function onInit() {
  if (tsUrls === null || isWasmLoaded === false) {
    return;
  }

  const mp4Demuxer = new MP4PullDemuxer();

  await videoRenderer.initialize({
    tsUrls,
    demuxer: mp4Demuxer,
    canvasCtx,
    wasmModule: {
      GL: self.Module.GL,
      _register_gl_tex_handle: self.Module._register_gl_tex_handle,
    },
  });

  self.postMessage({ type: "init" });
}

async function onPlay() {
  isPlaying = true;

  self.requestAnimationFrame(function renderVideo() {
    if (!isPlaying) {
      return;
    }

    const now = performance.now();
    currentTime += now - (prevRenderTime ?? now);
    prevRenderTime = now;

    console.log({ currentTime });

    const videoTime = videoRenderer.firstFrameTime + currentTime * 1000;

    videoRenderer.render(videoTime);

    self.requestAnimationFrame(renderVideo);
  });
}

async function onSeekToNextFrame() {
  if (videoRenderer.frameBuffer.length == 0) {
    return;
    // this.fillFrameBuffer();

    // const onNewFrameBuffredPromise = new Promise((resolve) => {
    //   this.onNewFrameBuffred = resolve;
    // });

    // await onNewFrameBuffredPromise;
  }

  currentTime += videoRenderer.frameBuffer[0].duration / 1000;

  const videoTime = videoRenderer.firstFrameTime + currentTime * 1000;

  videoRenderer.seek(videoTime);
}

async function onSeekToPreviousFrame() {
  if (videoRenderer.frameBuffer.length == 0) {
    return;
    // this.fillFrameBuffer();

    // const onNewFrameBuffredPromise = new Promise((resolve) => {
    //   this.onNewFrameBuffred = resolve;
    // });

    // await onNewFrameBuffredPromise;
  }

  currentTime -= videoRenderer.frameBuffer[0].duration / 1000;

  const videoTime = videoRenderer.firstFrameTime + currentTime * 1000;

  videoRenderer.seek(videoTime);
}

function onPause() {
  isPlaying = false;
  prevRenderTime = null;
}

function onSeek(_currentTime) {
  onPause();

  currentTime = _currentTime;

  const videoTime = videoRenderer.firstFrameTime + currentTime * 1000;

  videoRenderer.seek(videoTime);
}

self.addEventListener("message", (e) => {
  const { type, ...data } = e.data;

  if (type === "initCanvas") {
    initCanvas(data.canvas);
  } else if (type === "start") {
    onTsLoaded(data.tsUrls);
  } else if (type === "play") {
    onPlay();
  } else if (type === "pause") {
    onPause();
  } else if (type === "seek") {
    onSeek(data.timeMiliSec);
  } else if (type === "seekToNextFrame") {
    onSeekToNextFrame();
  } else if (type === "seekToPreviousFrame") {
    onSeekToPreviousFrame();
  }
});
