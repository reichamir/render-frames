import { useEffect, useRef } from "react";
import Hls from "hls.js";
import WorkerHls from "./workerHls?worker";
import muxjs from "mux.js";
import { MP4Demuxer } from "./demuxerMp4WMuxJS";

export function VideoHls() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const once = useRef<boolean>(false);

  const frameIndex = useRef<number>(0);
  const frameRate = 30; // Assuming 30 FPS; adjust if you know the actual FPS
  const frameDuration = 1000000 / frameRate;

  const muxerRef = useRef(new muxjs.mp4.Transmuxer());
  const segments = useRef([]);

  const workerRef = useRef(new WorkerHls());

  const demuxerRef = useRef(
    new MP4Demuxer({
      onConfig: (e) => {
        workerRef.current.postMessage({
          type: "initDecoder",
          decoderConfig: e,
        });
      },
      onChunk: (e) => {
        workerRef.current.postMessage({
          type: "decodeMeTwo",
          chunkType: e.type,
          timestamp: e.timestamp,
          duration: e.duration,
          data: e.data,
        });

        /*
        const chunk = new EncodedVideoChunk({
            type: data.chunkType,
            timestamp: data.timestamp,
            duration: data.duration,
            data: data.data,
        });
        */
      },
      setStatus: (e) => console.log("setStatus", e),
    })
  );

  const hlsRef = useRef<Hls>(
    new Hls({
      startPosition: 0,
      xhrSetup(xhr, url) {
        if (new URL(url).pathname.endsWith(".m3u8")) {
          xhr.withCredentials = true;
        }
      },
    })
  );

  useEffect(() => {
    function appendFirstSegment() {
      if (segments.current.length == 0) {
        return;
      }

      muxerRef.current.on("data", (segment) => {
        let data = new Uint8Array(
          segment.initSegment.byteLength + segment.data.byteLength
        );
        data.set(segment.initSegment, 0);
        data.set(segment.data, segment.initSegment.byteLength);
        // console.log(muxerRef.current.mp4.tools.inspect(data));

        // sourceBuffer.appendBuffer(data);
        console.log("appendFirstSegment data", data);
        demuxerRef.current.writeChunk(data);

        appendNextSegment();
      });

      fetch(segments.current.shift())
        .then((response) => {
          return response.arrayBuffer();
        })
        .then((response) => {
          muxerRef.current.push(new Uint8Array(response));
          muxerRef.current.flush();
        });
    }

    function appendNextSegment() {
      // reset the 'data' event listener to just append (moof/mdat) boxes to the Source Buffer
      muxerRef.current.off("data");
      muxerRef.current.on("data", (segment) => {
        const data = new Uint8Array(segment.data);
        console.log("appendNextSegment data", data);
        demuxerRef.current.writeChunk(data);
        // sourceBuffer.appendBuffer(new Uint8Array(segment.data));
      });

      if (segments.length == 0) {
        // notify MSE that we have no more segments to append.
        // >>> mediaSource.endOfStream();
      }

      segments.current.forEach((segment) => {
        // fetch the next segment from the segments array and pass it into the transmuxer.push method
        fetch(segments.current.shift())
          .then((response) => {
            return response.arrayBuffer();
          })
          .then((response) => {
            muxerRef.current.push(new Uint8Array(response));
            muxerRef.current.flush();
          });
      });
    }

    const offscreenCanvas = canvasRef.current!.transferControlToOffscreen();

    workerRef.current.postMessage(
      {
        type: "initCanvas",
        canvas: offscreenCanvas,
      },
      [offscreenCanvas]
    );

    hlsRef.current.loadSource(
      "https://prod-eus2.clipro.tv/api/clone-playlist/InternalPlaylist.m3u8?stream=streamid=3091124,audiotrack=2,startindex=2354,endindex=2364,source=0,discoforgap=1,removeduplications=1"
    );
    // "https://prod-eus2.clipro.tv/api/playlist/InternalPlaylist.m3u8?stream=streamid=3096395,audiotrack=3,startindex=0,source=0"
    hlsRef.current.attachMedia(videoRef.current!);

    hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log("MANIFEST_PARSED");
    });

    hlsRef.current.on(Hls.Events.ERROR, (_event, data) => {
      console.log("ERROR", data);
    });

    hlsRef.current.on(Hls.Events.LEVEL_LOADED, (event, data) => {
      const fragments = data.details.fragments;

      console.log("LEVEL_LOADED", fragments);

      segments.current = fragments.map((frag) => frag.url);

      appendFirstSegment();

      //   const segments = fragments.map((frag) => ({
      //     start: frag.start,
      //     end: frag.start + frag.duration,
      //     url: frag.url,
      //   }));

      //   worker.postMessage({
      //     type: "updateSegments",
      //     payload: segments,
      //   });
    });

    hlsRef.current.on(Hls.Events.FRAG_PARSING_INIT_SEGMENT, (_event, data) => {
      // @ts-ignore
      const videoTrack = data.tracks.video;

      if (videoTrack) {
        const config = {
          codec: videoTrack.codec, // "avc1.42E01E", //"avc1.42002A",
          //   avc: { format: "annexb" },
          //   pt: 1,
          width: videoTrack.metadata.width,
          height: videoTrack.metadata.height,
          // description: new Uint8Array(videoTrack.initSegment),
        };

        // worker.postMessage({
        //   type: "setInitSegment",
        //   payload: videoTrack.initSegment,
        // });

        console.log(config);

        // console.log({
        //   codec: "avc1.42002A", // videoTrack.codec, "avc1.42E01E",
        //   //   avc: { format: "annexb" },
        //   //   pt: 1,
        //   // description: new Uint8Array(videoTrack.initSegment),
        //   width: videoTrack.metadata.width,
        //   height: videoTrack.metadata.height,
        // });

        // const avccBox = findAVCCBox(videoTrack.initSegment);

        // workerRef.current.postMessage({
        //   type: "initDecoder",
        //   decoderConfig: config,
        // });
      }
    });

    // hlsRef.current.on(Hls.Events.FRAG_LOADING, (_event, data) => {
    //   console.log("FRAG_LOADING", data);
    // });

    function extractNalUnits(buffer) {
      const nalUnits = [];
      const length = buffer.length;
      let startCodePos = 0;

      // Helper function to detect the start code
      function findStartCode(buffer, offset) {
        if (buffer[offset] === 0x00 && buffer[offset + 1] === 0x00) {
          if (buffer[offset + 2] === 0x01) return 3; // 0x000001
          if (buffer[offset + 2] === 0x00 && buffer[offset + 3] === 0x01)
            return 4; // 0x00000001
        }
        return 0;
      }

      for (let i = 0; i < length - 4; i++) {
        const startCodeLength = findStartCode(buffer, i);

        if (startCodeLength > 0) {
          // If we've found a new start code, push the previous NAL unit if it exists
          if (startCodePos < i) {
            const nalUnit = buffer.subarray(startCodePos, i);
            nalUnits.push(new Uint8Array(nalUnit));
          }

          // Move startCodePos to the beginning of the new NAL unit
          startCodePos = i + startCodeLength;
          i += startCodeLength - 1;
        }
      }

      // Add the final NAL unit after the loop completes, if any
      if (startCodePos < length) {
        const nalUnit = buffer.subarray(startCodePos, length);
        nalUnits.push(new Uint8Array(nalUnit));
      }

      return nalUnits;
    }

    hlsRef.current.on(Hls.Events.FRAG_LOADED, (_event, data) => {
      if (data.frag.type === "main") {
        // worker.postMessage({
        //   type: "decodeMeThree",
        //   timestamp: data.frag.start,
        //   payload: data.payload,
        // });
        // const tsParser = new muxjs.mp4.Transmuxer();
        // tsParser.on("data", (segment) => {
        //   if (segment.data && segment.type === "video") {
        //     const nalUnits = extractNalUnits(segment.data);
        //     // Send NAL units to the VideoDecoder
        //     nalUnits.forEach((nalUnit, i) => {
        //       worker.postMessage({
        //         type: "decodeMeTwo",
        //         chunkType: i === 0 ? "key" : "delta",
        //         timestamp: frameIndex.current * frameDuration,
        //         duration: frameDuration,
        //         data: nalUnit,
        //       });
        //       frameIndex.current++;
        //     });
        //   }
        // });
        // tsParser.on("done", () => console.log("Transmuxing done"));
        // tsParser.on("error", (error) =>
        //   console.error("Transmuxing error:", error)
        // );
        // if (data.payload instanceof Uint8Array) {
        //   tsParser.push(data.payload);
        //   tsParser.flush();
        // }
        // const tsParser = new muxjs.mp4.Transmuxer();
        // tsParser.on("error", (error) => {
        //   console.error("Error event fired:", error);
        // });
        // tsParser.on("data", (segment) => {
        //   if (segment.type === "video") {
        //     const nalUnits = extractNalUnits(segment.data);
        //     // Decode each chunk in the segment as a video frame
        //     nalUnits.forEach((nalUnit, index) => {
        //       const timestamp = frameIndex.current * frameDuration;
        //       worker.postMessage({
        //         type: "decodeMeTwo",
        //         chunkType: index === 0 ? "key" : "delta",
        //         timestamp,
        //         duration: frameDuration,
        //         data: new Uint8Array(nalUnit),
        //       });
        //       frameIndex.current++;
        //     });
        //   }
        // });
        // // Demux MPEG-TS data directly from data.payload
        // // tsParser.push(new Uint8Array(data.payload));
        // tsParser.push(new Uint8Array(data.payload));
        // tsParser.flush();
        // const transmuxer = new muxJs.mp4.Transmuxer();
        // transmuxer.on("data", (segment) => {
        //   let data = new Uint8Array(
        //     segment.initSegment.byteLength + segment.data.byteLength
        //   );
        //   // Add the segment.initSegment (ftyp/moov) starting at position 0
        //   data.set(segment.initSegment, 0);
        //   // Add the segment.data (moof/mdat) starting after the initSegment
        //   data.set(segment.data, segment.initSegment.byteLength);
        //   const mp4Data = new Uint8Array(segment.data); // Get MP4 data
        //   worker.postMessage({
        //     type: "decodeMe",
        //     mp4Data,
        //   });
        // });
        // transmuxer.push(new Uint8Array(data.payload)); // Push data into mux.js
        // transmuxer.flush(); // Flush to ensure we process all data
        // worker.postMessage(
        //   {
        //     type: "appendFragment",
        //     // buffer: sharedArray,
        //     payload: data.payload,
        //     start: data.frag.start,
        //   },
        //   [data.payload]
        // );
        // worker.postMessage(
        //   {
        //     type: "onChunk",
        //     // buffer: sharedArray,
        //     data: data.payload,
        //   },
        //   [data.payload]
        // );
      }

      //   if (once.current) {
      //     return;
      //   }

      // once.current = true;

      //   const fragmentData = data.payload;

      //   const sharedBuffer = new SharedArrayBuffer(fragmentData.byteLength);
      //   const sharedArray = new Uint8Array(sharedBuffer);
      //   sharedArray.set(new Uint8Array(fragmentData));
    });
  }, [hlsRef, canvasRef, once, muxerRef, demuxerRef]);

  return (
    <div>
      <canvas ref={canvasRef} width="1280" height="720"></canvas>
      <br></br>
      <video
        autoPlay={true}
        ref={videoRef}
        width="1280"
        height="720"
        controls
      ></video>
    </div>
  );
}
