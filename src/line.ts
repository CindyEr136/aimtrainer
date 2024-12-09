import { Animator } from "./animator";

export class Line {
    constructor(
        public start: { x: number, y: number },
        public end: { x: number, y: number },
        public fill = "white"
    ) {}

    private offsetX = 0;
    private offsetY = 0

    animate = new Animator(0, 1, 750, (p) => {
        this.offsetX = (this.end.x - this.start.x) * p;
        this.offsetY = (this.end.y - this.start.y) * p;
    });

    update(t: number) {
        this.animate.update(t);
    }

    startAnimation(t: number) {
        this.animate.start(t);
    }

    draw(gc: CanvasRenderingContext2D) {
        gc.save();
        const endX = this.animate.isRunning ? this.start.x + this.offsetX : this.end.x;
        const endY = this.animate.isRunning ? this.start.y + this.offsetY : this.end.y;

        gc.beginPath();
        gc.moveTo(this.start.x, this.start.y);
        gc.lineTo(endX, endY);
        gc.lineWidth = 5;
        gc.strokeStyle = this.fill;
        gc.stroke();

        gc.restore();
    }
}