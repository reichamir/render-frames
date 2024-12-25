import MP4Box from "mp4box";

export class MP4Source {
  constructor() {
    this.file = MP4Box.createFile();
    this.file.onError = console.error.bind(console);
    this.file.onReady = this.onReady.bind(this);
    this.file.onSamples = this.onSamples.bind(this);
    this.offset = 0;

    this.info = null;
    this._info_resolver = null;
  }

  write(chunk) {
    const buffer = new ArrayBuffer(chunk.byteLength);
    new Uint8Array(buffer).set(chunk);

    buffer.fileStart = this.offset;
    this.offset += buffer.byteLength;

    this.file.appendBuffer(buffer);
  }

  async fetchFile(uri) {
    const response = await fetch(uri);

    const reader = response.body.getReader();

    function appendBuffers({ done, value }) {
      if (done) {
        this.file.flush();
        return;
      }

      this.write(value.buffer);

      return reader.read().then(appendBuffers.bind(this));
    }

    return reader.read().then(appendBuffers.bind(this));
  }

  onReady(info) {
    this.info = info;

    if (this._info_resolver) {
      this._info_resolver(info);
      this._info_resolver = null;
    }
  }

  getInfo() {
    if (this.info) return Promise.resolve(this.info);

    return new Promise((resolver) => {
      this._info_resolver = resolver;
    });
  }

  getDescriptionBox() {
    const entry = this.file.moov.traks[0].mdia.minf.stbl.stsd.entries[0];
    const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
    if (!box) {
      throw new Error("avcC, hvcC, vpcC, or av1C box not found!");
    }
    return box;
  }

  selectTrack(track) {
    this.file.setExtractionOptions(track.id);
  }

  start(onSamples) {
    this._onSamples = onSamples;
    this.file.start();
  }

  seek(time) {
    this.file.seek(time, true);
  }

  stop() {
    this.file.stop();
  }

  onSamples(track_id, ref, samples) {
    this._onSamples(samples);
  }
}
