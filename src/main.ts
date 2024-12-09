import {
  startSimpleKit,
  setSKDrawCallback,
  setSKEventListener,
  SKResizeEvent,
  SKMouseEvent,
  setSKAnimationCallback,
  addSKEventTranslator,
  SKKeyboardEvent,
} from "simplekit/canvas-mode";

import { Circle } from "./circle";
import { Line } from "./line";
import { longClickTranslator } from "./translator";

// #region variables

let mode: "start" | "play" | "end" = "start";
const topMargin = 50; // space from the top of the canvas to the line
let angleOffset = 0; // random offset for the target around the circle pattern
let targetRadius = 30; // radius for the targets
let correctTarget = 1; // target to select in sequence
let layout = true; // flag to perform a layout on the next draw frame
const canvasSize = { width: 0, height: 0 }; // canvas size for resize events
let showError = false; // show error state (red background)

// lines and targets
let lines: Line[] = [];
let targets = createTargets(6);

// timer
let time = 0;
let startTime = 0;
let bestTime = Number.MAX_VALUE; // save value for the best time




// #endregion

// #region event listener
setSKEventListener((e) => {
  switch (e.type) {
    case "longclick":
      if (mode === "play") {
        mode = "start";
        targets = createTargets(targets.length);
        layout = true;
        correctTarget = 1;
      }
      break;
    case "resize":
      const { width, height } = e as SKResizeEvent;
      canvasSize.width = width;
      canvasSize.height = height;
      layout = true;
      break;
    case "mousedown":
      if (mode === "start" || mode === "play") {
        const { x, y } = e as SKMouseEvent;
        const target = targets.find((t) => t.hitTest(x, y));
        if (target) {
          target.isDown = true;
          showError = target.id !== correctTarget;
        } else {
          showError = true;
        }
      }
      break;
    case "mouseup":
      if (mode === "start" || mode === "play") {
        targets.forEach((t) => (t.isDown = false));
        showError = false;
      }
      break;
    case "mousemove":
      if (mode === "start" || mode === "play") {
        const { x, y } = e as SKMouseEvent;
        const target = targets.find((t) => t.hitTest(x, y));
        if (target) {
          target.isHover = true;
        } else {
          targets.forEach((t) => (t.isHover = false));
        }
      }
      break;
    case "click":
      if (mode === "start" || mode === "play") {
        const { x, y } = e as SKMouseEvent;
        const target = targets.find((t) => t.hitTest(x, y));
        if (target) {
          if (target.id === correctTarget) {
            target.onClick(e.timeStamp);
            targetClicked(target, e.timeStamp);
          }
        }
      }
      break;
    case "keydown":
      const { key } = e as SKKeyboardEvent
      switch (key) {
        case "]":
          if (mode === "start" && targets.length < 8) {
            targets = createTargets(targets.length + 1);
            layout = true;
            resetBestTime();
          }
          break;
        case "[":
          if (mode === "start" && targets.length > 3) {
            targets = createTargets(targets.length - 1);
            layout = true;
            resetBestTime();
          }
          break;
        case "}":
          if (mode === "start" && targetRadius < 45) {
            targetRadius += 5;
            layout = true;
          }
          break;
        case "{":
          if (mode === "start" && targetRadius > 15) {
            targetRadius -= 5;
            layout = true;
          }
          break;
        case " ":
          if (mode === "start" || mode === "end") {
            targets = createTargets(targets.length);
            layout = true;
            if (mode === "end") {
              mode = "start";
              correctTarget = 1;
            }
          }
          break;
        case "c":
          if (mode === "play") {
            const target = targets.find((t) => t.id === correctTarget);
            if (target) {
              target.onClick(e.timeStamp);
              targetClicked(target, e.timeStamp);
            }
          }
          break;
      }
      break;
  }

  if (layout) {
    layoutTargets(
      0,
      topMargin,
      canvasSize.width,
      canvasSize.height - topMargin
    );
    layout = false;
  }
});

// #endregion

// #region animation

setSKAnimationCallback((t) => {
  if (mode === "play") {
    time = (t - startTime) / 1000;
  }

  lines.forEach((l) => l.update(t));
  targets.forEach((tt) => tt.update(t));

  if (mode === "end") {
    wiggleAnimation(t);
  }
});

let wiggle = 0;
function wiggleAnimation(t: number) {
  wiggle += 0.2;

  targets.forEach((t, i) => {
    t.offsetX = Math.sin(wiggle + i * 2) * 10;
    t.offsetY = Math.cos(wiggle + i * 2) * 10;
  });

  const sorted = targets.slice(0).sort((a, b) => a.id - b.id);

  lines.forEach((l, i) => {
    l.start.x = sorted[i].x + sorted[i].offsetX;
    l.start.y = sorted[i].y + sorted[i].offsetY;
    l.end.x = sorted[i + 1].x + sorted[i + 1].offsetX;
    l.end.y = sorted[i + 1].y + sorted[i + 1].offsetY;
  });
}

// #endregion

// #region drawing

setSKDrawCallback((gc) => {
  gc.fillStyle = showError ? "darkred" : "black";
  gc.fillRect(0, 0, gc.canvas.width, gc.canvas.height);

  // top line
  gc.strokeStyle = "white";
  gc.lineWidth = 2;
  gc.beginPath();
  gc.moveTo(0, topMargin);
  gc.lineTo(gc.canvas.width, topMargin);
  gc.stroke();

  // message
  gc.fillStyle = "white";
  gc.font = "24px sans-serif";
  gc.textAlign = "center";
  gc.textBaseline = "middle";

  switch (mode) {
    case "start":
      gc.fillText(
        "click target 1 to begin",
        gc.canvas.width / 2,
        topMargin / 2
      );
      break;
    case "play":
      gc.fillText(`${time.toFixed(2)}s`, gc.canvas.width / 2, topMargin / 2);
      break;
    case "end":
      const bestMessage =
        time === bestTime ? "(new best!)" : `(best ${bestTime.toFixed(2)}s)`;
      gc.fillText(
        `${time.toFixed(2)}s ${bestMessage}`,
        gc.canvas.width / 2,
        topMargin / 2
      );
  }

  // draw the targets and connecting lines
  lines.forEach((l) => l.draw(gc));
  targets.forEach((t) => t.draw(gc));
});

// #endregion

addSKEventTranslator(longClickTranslator);

startSimpleKit();

// #region helper functions for game logic

// function to reset the value saved for best time
function resetBestTime() {
  bestTime = Number.MAX_VALUE;
}

// function to make new targets
function createTargets(n: number): Circle[] {
  lines = [];
  let targets: Circle[] = [];
  for (let i = 0; i < n; i++) {
    targets.push(new Circle(i + 1, targetRadius));
  }
  targets[0].state = "next";

  targets.sort(() => Math.random() - 0.5);

  angleOffset = Math.random() * 2 * Math.PI;

  return targets;
}

// function to set the targets in a circle patter layout
function layoutTargets(x: number, y: number, width: number, height: number) {
  const margin = targetRadius + 30;
  x += margin;
  y += margin;
  width -= margin * 2;
  height -= margin * 2;

  const radius = Math.min(width, height) / 2;
  const cx = width / 2;
  const cy = height / 2;
  const num = targets.length;

  targets.forEach((t, i) => {
    const angle = angleOffset + (i * 2 * Math.PI) / num;
    t.x = x + cx + radius * Math.cos(angle);
    t.y = y + cy + radius * Math.sin(angle);
    t.radius = targetRadius;
  });

  lines.forEach((l, i) => {
    l.start.x = targets[i].x;
    l.start.y = targets[i].y;
    l.end.x = targets[i + 1].x;
    l.end.y = targets[i + 1].y;
  });
}

// function to handle when a target is clicked
function targetClicked(target: Circle, timeStamp: number) {
  if (correctTarget === 1) {
    mode = "play";
    startTime = timeStamp;
    time = 0;
  }

  target.state = "clicked";
  target.fill = `hsl(${(correctTarget / targets.length) * 360}, 100%, 50%)`;

  const last = targets.find((t) => t.id === correctTarget - 1);
  if (last) {
    const line = new Line(
      { x: last.x, y: last.y },
      { x: target.x, y: target.y },
      `hsl(${((correctTarget - 1) / targets.length) * 360}, 100%, 50%)`
    );
    line.startAnimation(timeStamp);
    lines.push(line);
  }
  correctTarget++;

  if (correctTarget <= targets.length) {
    const next = targets.find((t) => t.id === correctTarget);
    if (next) {
      next.state = "next";
    }
  } else {
    targets.forEach((t) => (t.isHover = false));
    mode = "end";
    bestTime = Math.min(bestTime, time);
  }
}

// #endregion