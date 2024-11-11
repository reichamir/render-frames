// Wraps an MP4Box File as a WritableStream underlying sink.
export class MP4FileSink {
    #file = null;
    #offset = 0;
  
    constructor(file) {
      this.#file = file;
    }
  
    write(chunk) {
      // MP4Box.js requires buffers to be ArrayBuffers, but we have a Uint8Array.
      const buffer = new ArrayBuffer(chunk.byteLength);
      new Uint8Array(buffer).set(chunk);
  
      // Inform MP4Box where in the file this chunk is from.
      buffer.fileStart = this.#offset;
      this.#offset += buffer.byteLength;
  
      // Append chunk.
      this.#file.appendBuffer(buffer);
    }
  
    close() {
      this.#file.flush();
    }
  }