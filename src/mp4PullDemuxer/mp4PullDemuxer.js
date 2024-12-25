import { MP4Source } from "./mp4Source";
import MP4Box from "mp4box";

// Wrapper around MP4Box.js that shims pull-based demuxing on top their
// push-based API.
export class MP4PullDemuxer {
  constructor() {
    this.source = new MP4Source();
    this.readySamples = [];
    this._pending_read_resolver = null;
  }

  async initialize() {
    await this._tracksReady();

    this._selectTrack(this.videoTrack);
  }

  write(chunk) {
    this.source.write(chunk);
  }

  seek(timestamp) {
    this.source.seek(timestamp);
  }

  async _tracksReady() {
    let info = await this.source.getInfo();
    this.videoTrack = info.videoTracks[0];
  }

  getDecoderConfig() {
    return {
      // Browser doesn't support parsing full vp8 codec (eg: `vp08.00.41.08`),
      // they only support `vp8`.
      codec: this.videoTrack.codec.startsWith("vp08")
        ? "vp8"
        : this.videoTrack.codec,
      displayWidth: this.videoTrack.track_width,
      displayHeight: this.videoTrack.track_height,
      description: this._getDescription(this.source.getDescriptionBox()),
    };
  }

  async getNextChunk() {
    let sample = await this._readSample();
    const type = sample.is_sync ? "key" : "delta";
    const pts_us = (sample.cts * 1000000) / sample.timescale;
    const duration_us = (sample.duration * 1000000) / sample.timescale;

    return new EncodedVideoChunk({
      type: type,
      timestamp: pts_us,
      duration: duration_us,
      data: sample.data,
    });
  }

  _getDescription(descriptionBox) {
    const stream = new MP4Box.DataStream(
      undefined,
      0,
      MP4Box.DataStream.BIG_ENDIAN
    );
    descriptionBox.write(stream);
    return new Uint8Array(stream.buffer, 8); // Remove the box header.
  }

  _selectTrack(track) {
    this.selectedTrack = track;
    this.source.selectTrack(track);
  }

  async _readSample() {
    if (this.readySamples.length) {
      return Promise.resolve(this.readySamples.shift());
    }

    let promise = new Promise((resolver) => {
      this._pending_read_resolver = resolver;
    });

    this.source.start(this._onSamples.bind(this));
    return promise;
  }

  _onSamples(samples) {
    const SAMPLE_BUFFER_TARGET_SIZE = 50;

    this.readySamples.push(...samples);
    if (this.readySamples.length >= SAMPLE_BUFFER_TARGET_SIZE)
      this.source.stop();

    if (this._pending_read_resolver) {
      this._pending_read_resolver(this.readySamples.shift());
      this._pending_read_resolver = null;
    }
  }
}
