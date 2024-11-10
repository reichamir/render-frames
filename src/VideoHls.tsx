import { useEffect, useRef } from "react";
import Hls from "hls.js";
import WorkerHls from "./workerHls?worker";

export function VideoHls() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const workerRef = useRef(new WorkerHls());

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
    // function appendFirstSegment() {
    //   if (segments.current.length == 0) {
    //     return;
    //   }

    //   muxerRef.current.on("data", (segment) => {
    //     let data = new Uint8Array(
    //       segment.initSegment.byteLength + segment.data.byteLength
    //     );
    //     data.set(segment.initSegment, 0);
    //     data.set(segment.data, segment.initSegment.byteLength);

    //     demuxerRef.current.writeChunk(data);

    //     appendNextSegment();
    //   });

    //   fetch(segments.current.shift())
    //     .then((response) => {
    //       return response.arrayBuffer();
    //     })
    //     .then((response) => {
    //       muxerRef.current.push(new Uint8Array(response));
    //       muxerRef.current.flush();
    //     });
    // }

    // function appendNextSegment() {
    //   // reset the 'data' event listener to just append (moof/mdat) boxes to the Source Buffer
    //   muxerRef.current.off("data");
    //   muxerRef.current.on("data", (segment) => {
    //     const data = new Uint8Array(segment.data);
    //     demuxerRef.current.writeChunk(data);
    //   });

    //   segments.current.forEach((segment) => {
    //     fetch(segments.current.shift())
    //       .then((response) => {
    //         return response.arrayBuffer();
    //       })
    //       .then((response) => {
    //         muxerRef.current.push(new Uint8Array(response));
    //         muxerRef.current.flush();
    //       });
    //   });
    // }

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
    hlsRef.current.attachMedia(videoRef.current!);

    hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log("MANIFEST_PARSED");
    });

    hlsRef.current.on(Hls.Events.LEVEL_LOADED, (event, data) => {
      const tsMpegUrls = data.details.fragments.map((frag) => frag.url);

      workerRef.current.postMessage({
        type: "handleTsMpegList",
        tsMpegUrls,
      });

      // segments.current = fragments.map((frag) => frag.url);

      // appendFirstSegment();
    });

    hlsRef.current.on(Hls.Events.ERROR, (_event, data) => {
      console.log("ERROR", data);
    });
  }, [hlsRef, canvasRef]);

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
