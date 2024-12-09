import { Animator } from "./animator";

export class Circle{
  constructor(
    public id: number = 0,
    public x: number = 0,
    public y: number = 0,
    public radius = 20,
    public fill = "grey"
  ) {}

  ring: Animator | null = null;
  ringSize = 1;

  onClick(t: number) {
    this.ring = new Animator(1, 1.5, 333, (p) => {
      this.ringSize = p;
    });
    this.ring.start(t);
  }

  update(t: number) {
    if (this.ring){
      this.ring.update(t);
    }
  }

  // for wiggles
  offsetX = 0;
  offsetY = 0;

  state: "next" | "clicked" | "future" = "future";
  isHover = false;
  isDown = false;

  draw(gc: CanvasRenderingContext2D) {
    gc.save();
    
    let colour;
    switch(this.state) {
      case "next":
        colour = "white";
        break;
      case "clicked":
        colour = this.fill;
        break;
      case "future":
        colour = "darkgrey";
        break;
    }

    const x = this.x + this.offsetX;
    const y = this.y+ this.offsetY;

    gc.beginPath();
    gc.arc(x, y, this.radius, 0, 2 * Math.PI);
    gc.fillStyle = colour;
    gc.fill();

    if (this.isHover) {
      gc.beginPath();
      gc.arc(x, y, this.radius, 0, 2 * Math.PI);
      gc.strokeStyle = "lightblue";
      gc.lineWidth = 3;
      gc.stroke();
    }

    if (this.isDown){
      gc.beginPath();
      gc.arc(x, y, this.radius + 3, 0, 2 * Math.PI);
      gc.strokeStyle = "yellow";
      gc.lineWidth = 3;
      gc.stroke();
    }

    if (this.ring?.isRunning) {
      gc.beginPath();
      gc.arc(x, y, this.radius + this.ringSize, 0, 2 * Math.PI);
      gc.strokeStyle = "yellow";
      gc.lineWidth = 3;
      gc.stroke();
    }

    gc.fillStyle = this.state === "future" ? "lightgrey" : "black";
    gc.font = "20px sans-serif";
    gc.textAlign = "center";
    gc.textBaseline = "middle";
    gc.fillText(`${this.id}`, x, y);

    gc.restore();
  }

  hitTest (mx: number, my: number) {
      const dx = mx - this.x;
      const dy = my - this.y;
      return dx * dx + dy * dy <= this.radius * this.radius;
  }
}