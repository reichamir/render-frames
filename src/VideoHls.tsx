import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import WorkerHls from "./workerHls?worker";

export function VideoHls() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
      "https://prod-eus2.clipro.tv/api/clone-playlist/InternalPlaylist.m3u8?stream=streamid=2315822,startindex=1796,endindex=1879,source=0,discoforgap=1,removeduplications=1"
      // "https://prod-eus2.clipro.tv/api/clone-playlist/InternalPlaylist.m3u8?stream=streamid=3091124,audiotrack=2,startindex=2354,endindex=2364,source=0,discoforgap=1,removeduplications=1"
    );
    hlsRef.current.attachMedia(videoRef.current!);

    hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log("MANIFEST_PARSED");
    });

    hlsRef.current.on(Hls.Events.LEVEL_LOADED, (event, data) => {
      const tsUrls = data.details.fragments.map((frag) => frag.url);

      workerRef.current.postMessage({
        type: "start",
        tsUrls: [tsUrls[0]],
      });

      // segments.current = fragments.map((frag) => frag.url);

      // appendFirstSegment();
    });

    hlsRef.current.on(Hls.Events.ERROR, (_event, data) => {
      console.log("ERROR", data);
    });

    workerRef.current.onmessage = (event) => {
      if (event.data.type === "init") {
        setIsLoaded(true);
      }
    };
  }, [hlsRef, canvasRef]);

  function onTogglePlaying() {
    if (isPlaying) {
      workerRef.current.postMessage({
        type: "pause",
      });
    } else {
      workerRef.current.postMessage({
        type: "play",
      });
    }

    setIsPlaying(!isPlaying);
  }

  function onSeek(timeMiliSec: number) {
    workerRef.current.postMessage({
      type: "seek",
      timeMiliSec: timeMiliSec,
    });
  }

  function onSeekToNextFrame() {
    workerRef.current.postMessage({
      type: "seekToNextFrame",
    });
  }

  function onSeekToPreviousFrame() {
    workerRef.current.postMessage({
      type: "seekToPreviousFrame",
    });
  }

  return (
    <div>
      <canvas ref={canvasRef} width="1280" height="720"></canvas>
      <br></br>
      <button disabled={!isLoaded} onClick={onTogglePlaying}>
        {isPlaying ? "Pause" : "Play"}
      </button>
      <button disabled={!isLoaded} onClick={onSeekToPreviousFrame}>
        Seek To Previous Frame
      </button>
      <button disabled={!isLoaded} onClick={onSeekToNextFrame}>
        Seek To Next Frame
      </button>
      <button
        disabled={!isLoaded}
        onClick={() => {
          onSeek(2000);
        }}
      >
        Seek to 2 sec
      </button>
      <button
        disabled={!isLoaded}
        onClick={() => {
          onSeek(0);
        }}
      >
        Seek to 0 sec
      </button>
      <br></br>
      <video
        autoPlay={false}
        ref={videoRef}
        width="1280"
        height="720"
        controls
      ></video>
    </div>
  );
}
