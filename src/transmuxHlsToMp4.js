import muxjs from "mux.js";

export class TransmuxHlsToMp4 {
    transmuxer;
    demuxer;
    onChunk;

    constructor({tsUrls, onChunk}) {
        this.transmuxer = new muxjs.mp4.Transmuxer();
        this.onChunk = onChunk;

        this.transmuxProcess(tsUrls)
    } 

    async transmuxProcess(tsUrls) {
        await this.handleInitTs(tsUrls[0]);

        this.transmuxer.off("data");

        this.handleNextTs(tsUrls.slice(1));
    }

    async handleInitTs(tsMpegUrl) {
        this.transmuxer.on("data", (segment) => {
            let data = new Uint8Array(
              segment.initSegment.byteLength + segment.data.byteLength
            );
            data.set(segment.initSegment, 0);
            data.set(segment.data, segment.initSegment.byteLength);
        
            this.onChunk(data);
          });
        
          await this.pushTsDataProcess(tsMpegUrl);
      }

      handleNextTs(tsMpegUrls) {
        this.transmuxer.on("data", (segment) => {
          const data = new Uint8Array(segment.data);
          
          this.onChunk(data);
        });
      
        tsMpegUrls.forEach(async tsMpegUrl => {
            await this.pushTsDataProcess(tsMpegUrl);     
        })
      }

      async pushTsDataProcess(url) {
        const tsData = await this.fetchTsData(url);

        this.transmuxer.push(new Uint8Array(tsData));
        this.transmuxer.flush();
      }

      async fetchTsData(url) {
        const response = await fetch(url)
        return await response.arrayBuffer();
      }
}