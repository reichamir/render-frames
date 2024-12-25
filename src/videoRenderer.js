import { TransmuxHlsToMp4 } from "./transmuxHlsToMp4";
const FRAME_BUFFER_TARGET_SIZE = 3;

// Controls demuxing and decoding of the video track, as well as rendering
// VideoFrames to canvas. Maintains a buffer of FRAME_BUFFER_TARGET_SIZE
// decoded frames for future rendering.
export class VideoRenderer {
  seekResolve = null;
  seekTimestamp = null;
  onNewFrameBuffred = null;

  async initialize({
    tsUrls,
    demuxer,
    canvasCtx,
    wasmModule: { GL, _register_gl_tex_handle },
  }) {
    this.frameBuffer = [];
    this.fillInProgress = false;
    this.texResource = null;

    this.demuxer = demuxer;
    this.canvasCtx = canvasCtx;
    this.GL = GL;
    this._register_gl_tex_handle = _register_gl_tex_handle;
    this.firstFrameTime = null;

    new TransmuxHlsToMp4({
      tsUrls,
      onChunk: (chunk) => {
        this.demuxer.write(chunk);
      },
    });

    await this.demuxer.initialize();

    const config = this.demuxer.getDecoderConfig();

    this.createAndRegisterGLTex(
      config.displayWidth,
      config.displayHeight,
      this.canvasCtx.RGB,
      this.canvasCtx.RGB8
    );

    this.decoder = new VideoDecoder({
      output: (frame) => {
        if (this.firstFrameTime === null) {
          this.firstFrameTime = frame.timestamp;
        }

        this.bufferFrame(frame);
      },
      error: (e) => console.error(e),
    });

    this.decoder.configure(config);

    this.init_resolver = null;
    let promise = new Promise((resolver) => (this.init_resolver = resolver));

    this.fillFrameBuffer();
    return promise;
  }

  render(timestamp) {
    let frame = this.chooseFrame(timestamp);
    this.fillFrameBuffer();

    if (frame == null) {
      console.warn("VideoRenderer.render(): no frame ");
      return;
    }

    this.paint(frame);
  }

  async seek(timestamp) {
    let counter = 0;
    let frame = this.chooseFrame(timestamp);

    if (frame === null) {
      this.demuxer.seek(timestamp / 1000 / 1000);
    }

    while (frame === null && counter < 1000) {
      await this.asyncFillFrameBuffer();
      frame = this.chooseFrame(timestamp);
      counter++;
    }

    if (frame) {
      console.log("seek frame", frame, counter);
      this.paint(frame);
    }
  }

  asyncFillFrameBuffer() {
    const p = new Promise((resolve) => {
      setTimeout(() => {
        this.fillFrameBuffer();
        resolve();
      }, 0);
    });

    return p;
  }

  chooseFrame(timestamp) {
    if (this.frameBuffer.length == 0) return null;

    let prevTimeDelta = Number.MAX_VALUE;
    let frameIndex = -1;

    for (let i = 0; i < this.frameBuffer.length; i++) {
      const frameStartTime = this.frameBuffer[i].timestamp;
      const frameEndTime = frameStartTime + this.frameBuffer[i].duration;

      if (frameStartTime <= timestamp && timestamp <= frameEndTime) {
        frameIndex = i;
        break;
      }
    }

    if (frameIndex > 0) console.log("dropping %d stale frames", frameIndex);

    if (frameIndex == -1) {
      const staleFramesLength = this.frameBuffer.length;
      for (let i = 0; i < staleFramesLength; i++) {
        let staleFrame = this.frameBuffer.shift();
        staleFrame.close();
      }

      return null;
    }

    for (let i = 0; i < frameIndex; i++) {
      let staleFrame = this.frameBuffer.shift();
      staleFrame.close();
    }

    let chosenFrame = this.frameBuffer[0];
    // console.log(
    //   "frame time delta = %dms (%d vs %d)",
    //   minTimeDelta / 1000,
    //   timestamp,
    //   chosenFrame.timestamp
    // );
    return chosenFrame;
  }

  async fillFrameBuffer(timestamp) {
    if (this.frameBufferFull()) {
      if (this.init_resolver) {
        this.init_resolver();
        this.init_resolver = null;
      }

      return;
    }

    // This method can be called from multiple places and we some may already
    // be awaiting a demuxer read (only one read allowed at a time).
    if (this.fillInProgress) {
      return false;
    }

    this.fillInProgress = true;

    while (
      this.frameBuffer.length < FRAME_BUFFER_TARGET_SIZE &&
      this.decoder.decodeQueueSize < FRAME_BUFFER_TARGET_SIZE
    ) {
      let chunk = await this.demuxer.getNextChunk();
      this.decoder.decode(chunk);
    }

    this.fillInProgress = false;

    // Give decoder a chance to work, see if we saturated the pipeline.
    setTimeout(this.fillFrameBuffer.bind(this), 0);
  }

  frameBufferFull() {
    return this.frameBuffer.length >= FRAME_BUFFER_TARGET_SIZE;
  }

  bufferFrame(frame) {
    this.frameBuffer.push(frame);
  }

  paint(frame) {
    this.updateGLTexture(frame);
  }

  createAndRegisterGLTex(w, h, format, internalFormat) {
    this.texResource = this.createGLTexture(
      format,
      internalFormat,
      w,
      h,
      this.canvasCtx.CLAMP_TO_EDGE,
      false,
      false,
      null
    );

    var id = this.GL.getNewId(this.GL.textures);
    this.texResource.name = id;
    this.GL.textures[id] = this.texResource;
    var bpp = format == this.canvasCtx.RGB ? 3 : 4;
    this._register_gl_tex_handle(id, w, h, bpp);
  }

  createGLTexture(format, intFormat, w, h, wrapType, flip, genMipmaps, data) {
    var texture = this.canvasCtx.createTexture();
    this.canvasCtx.bindTexture(this.canvasCtx.TEXTURE_2D, texture);
    this.canvasCtx.pixelStorei(this.canvasCtx.UNPACK_FLIP_Y_WEBGL, flip);
    this.canvasCtx.texParameteri(
      this.canvasCtx.TEXTURE_2D,
      this.canvasCtx.TEXTURE_MAG_FILTER,
      this.canvasCtx.LINEAR
    );
    this.canvasCtx.texParameteri(
      this.canvasCtx.TEXTURE_2D,
      this.canvasCtx.TEXTURE_WRAP_S,
      wrapType
    );
    this.canvasCtx.texParameteri(
      this.canvasCtx.TEXTURE_2D,
      this.canvasCtx.TEXTURE_WRAP_T,
      wrapType
    );

    if (genMipmaps === true) {
      this.canvasCtx.texParameteri(
        this.canvasCtx.TEXTURE_2D,
        this.canvasCtx.TEXTURE_MIN_FILTER,
        this.canvasCtx.LINEAR_MIPMAP_LINEAR
      );
      this.canvasCtx.texStorage2D(
        this.canvasCtx.TEXTURE_2D,
        1,
        intFormat,
        w,
        h
      );
    } else {
      this.canvasCtx.texParameteri(
        this.canvasCtx.TEXTURE_2D,
        this.canvasCtx.TEXTURE_MIN_FILTER,
        this.canvasCtx.LINEAR
      );
      this.canvasCtx.texStorage2D(
        this.canvasCtx.TEXTURE_2D,
        1,
        intFormat,
        w,
        h
      );
    }

    if (data != null) {
      this.canvasCtx.texSubImage2D(
        this.canvasCtx.TEXTURE_2D,
        0,
        0,
        0,
        format,
        this.canvasCtx.UNSIGNED_BYTE,
        data
      );
    }

    if (genMipmaps === true) {
      this.canvasCtx.generateMipmap(this.canvasCtx.TEXTURE_2D);
    }

    return texture;
  }

  updateGLTexture(frame) {
    this.canvasCtx.bindTexture(this.canvasCtx.TEXTURE_2D, this.texResource);

    this.canvasCtx.texSubImage2D(
      this.canvasCtx.TEXTURE_2D,
      0,
      0,
      0,
      frame.displayWidth,
      frame.displayHeight,
      this.canvasCtx.RGB,
      this.canvasCtx.UNSIGNED_BYTE,
      frame
    );

    this.canvasCtx.bindTexture(this.canvasCtx.TEXTURE_2D, null);
  }
}
