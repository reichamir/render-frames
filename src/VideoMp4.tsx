import { useEffect, useRef } from "react";
import Worker from "./worker?worker";

const worker = new Worker();

// const worker = new Worker(new URL("./worker.js?worker", import.meta.url), {
//   type: "module",
// });

export function VideoMp4() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.log("gere");
    worker.onmessage = (e) => {
      console.log(e.data);
    };

    const offscreenCanvas = canvasRef.current!.transferControlToOffscreen();

    worker.postMessage(
      {
        dataUri: `./bbb_video_hevc_frag.mp4`,
        canvas: offscreenCanvas,
      },
      [offscreenCanvas]
    );
  }, [canvasRef]);

  return (
    <div>
      <canvas ref={canvasRef} width="640" height="480"></canvas>
    </div>
  );
}
