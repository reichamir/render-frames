export class Canvas2DRenderer {
  canvas = null;
  ctx = null;

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("webgl2", { antialias: false });
  }

  draw(frame) {
    this.canvas.width = frame.displayWidth;
    this.canvas.height = frame.displayHeight;
    // this.ctx.drawImage(frame, 0, 0, frame.displayWidth, frame.displayHeight);
    frame.close();
  }
}
