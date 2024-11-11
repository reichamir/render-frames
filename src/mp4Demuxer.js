import MP4Box from 'mp4box'
import { MP4FileSink } from './mp4FileSink.js'

// Demuxes the first video track of an MP4 file using MP4Box, calling
// `onConfig()` and `onChunk()` with appropriate WebCodecs objects.
export class MP4Demuxer {
  #onConfig = null;
  #onChunk = null;
  #setStatus = null;
  #file = null;
  #fileSink = null;

  constructor({onConfig, onChunk}) {
    this.#onConfig = onConfig;
    this.#onChunk = onChunk;

    // Configure an MP4Box File for demuxing.
    this.#file = MP4Box.createFile();
    this.#file.onError = error => {console.error(error) };
    this.#file.onReady = this.#onReady.bind(this);
    this.#file.onSamples = this.#onSamples.bind(this);

    // Fetch the file and pipe the data through.
    this.#fileSink = new MP4FileSink(this.#file);
  }

  fetchData(url) {
    fetch(url).then(response => {
      // highWaterMark should be large enough for smooth streaming, but lower is
      // better for memory usage.
      response.body.pipeTo(new WritableStream(this.#fileSink, {highWaterMark: 2}));
    });
  }

  write(chunk) {
    this.#fileSink.write(chunk);
  }

  // Get the appropriate `description` for a specific track. Assumes that the
  // track is H.264, H.265, VP8, VP9, or AV1.
  #description(track) {
    const trak = this.#file.getTrackById(track.id);
    for (const entry of trak.mdia.minf.stbl.stsd.entries) {
      const box = entry.avcC || entry.hvcC || entry.vpcC || entry.av1C;
      if (box) {
        const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN);
        box.write(stream);
        return new Uint8Array(stream.buffer, 8);  // Remove the box header.
      }
    }
    throw new Error("avcC, hvcC, vpcC, or av1C box not found");
  }

  #onReady(info) {
    const track = info.videoTracks[0];

    this.#onConfig({
      // Browser doesn't support parsing full vp8 codec (eg: `vp08.00.41.08`),
      // they only support `vp8`.
      codec: track.codec.startsWith('vp08') ? 'vp8' : track.codec,
      codedHeight: track.video.height,
      codedWidth: track.video.width,
      description: this.#description(track),
    });

    // Start demuxing.
    this.#file.setExtractionOptions(track.id);
    this.#file.start();
  }

  #onSamples(track_id, ref, samples) {
    // Generate and emit an EncodedVideoChunk for each demuxed sample.
    for (const sample of samples) {
      this.#onChunk(new EncodedVideoChunk({
        type: sample.is_sync ? "key" : "delta",
        timestamp: 1e6 * sample.cts / sample.timescale,
        duration: 1e6 * sample.duration / sample.timescale,
        data: sample.data
      }));
    }
  }
}