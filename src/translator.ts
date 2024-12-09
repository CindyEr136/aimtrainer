import { distance } from "simplekit/utility";

// dig into SimpleKit to pull out the simulated "raw" events
// *** WARNING *** This is not the usual way to import from SimpleKit
import { FundamentalEvent } from "simplekit/canvas-mode";

import { SKEvent, SKMouseEvent } from "simplekit/canvas-mode";

export type EventTranslator = {
  update: (fe: FundamentalEvent) => SKEvent | undefined;
};

export const fundamentalTranslator = {
  update(fe: FundamentalEvent): SKEvent {
    switch (fe.type) {
      case "mousedown":
      case "mouseup":
      case "mousemove":
        return new SKMouseEvent(fe.type, fe.timeStamp, fe.x || 0, fe.y || 0);
        break;
      default:
        return new SKEvent(fe.type, fe.timeStamp);
    }
  },
};

export const longClickTranslator = {
  state: "IDLE",
  movementThreshold: 10,
  timeThreshold: 1000,
  startX: 0,
  startY: 0,
  startTime: 0,

  update(fe: FundamentalEvent): SKMouseEvent | undefined {
    switch (this.state) {
      case "IDLE":
        if (fe.type == "mousedown") {
          this.state = "DOWN";
          this.startX = fe.x ?? 0;
          this.startY = fe.y ?? 0;
          this.startTime = fe.timeStamp;
        }
        break;
      case "DOWN":
        if (
          fe.type == "mouseup" ||
          (fe.type == "mousemove" &&
            fe.x &&
            fe.y &&
            distance(fe.x, fe.y, this.startX, this.startY) >
              this.movementThreshold)
        ) {
          this.state = "IDLE";
        } else if (fe.timeStamp - this.startTime > this.timeThreshold) {
          this.state = "IDLE";
          return {
            type: "longclick",
            timeStamp: fe.timeStamp,
            x: fe.x ?? this.startX,
            y: fe.y ?? this.startY,
          } as SKMouseEvent;
        }
        break;
    }
    return;
  },
};