import { useEffect, useRef } from "react";
import Worker from "./worker?worker";

const worker = new Worker();

export function VideoMp4() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const offscreenCanvas = canvasRef.current!.transferControlToOffscreen();

    worker.postMessage(
      {
        url: `./bbb_video_hevc_frag.mp4`,
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
