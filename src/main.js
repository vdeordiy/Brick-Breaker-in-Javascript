$(function () {
  console.info("Use A/D or ←/→ to move the paddle!");

  const Constants = Object.freeze({
    width: 350,
    height: 330 * 1.6180339887,

    paddleWidth: 80,
    paddleHeight: 100 * (1 / 1.6180339887) ** 4,
    paddleSpeed: 3,

    brickWidth: 35 * 1.6180339887,
    brickHeight: 30 * (1 / 1.6180339887) ** 0.9,
    NumberOfBrickRows: 6,
    brickXPadding: 1,
    brickYPadding: 26,

    ballRadius: 8,
  });

  const canvas = document.querySelector("canvas");
  canvas.width = Constants.width;
  canvas.height = Constants.height;

  const ctx = canvas.getContext("2d");

  class StillObject {
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
  }

  const MovingObject = {
    __proto__: StillObject,
    xv: 0,
    yv: 0,
  };

  class Brick extends StillObject {
    constructor() {
      super();
      this.color = "red";
      this.width = Constants.brickWidth;
      this.height = Constants.brickHeight;
    }

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    static generateList() {
      const brickList = [];

      let NumberOfBrickColumns = canvas.width / Constants.brickWidth;
      NumberOfBrickColumns -= 1;

      const yOffset = 5;
      const xOffset = 2;

      for (let i = 0; i < Constants.NumberOfBrickRows; i++) {
        for (let j = 0; j < NumberOfBrickColumns; j++) {
          const brick = new Brick();
          brick.x = j * Constants.brickWidth + xOffset;
          brick.y = i * Constants.brickHeight + yOffset;

          // Padding
          brick.x += Constants.brickXPadding * j;
          brick.y += Constants.brickYPadding * i;

          brickList.push(brick);
        }
      }

      return brickList;
    }

    static drawList(brickList) {
      for (let brick of brickList) {
        brick.draw();
      }
    }

    static bulkCheckCollision(brickList, ball) {
      for (let brick of brickList) {
        if (!ball.collidesWith(brick)) continue;

        // Bounce
        ball.yv = -ball.yv;

        // Delete brick
        const index = brickList.indexOf(brick);
        brickList.splice(index, 1);
      }
    }
  }

  const paddle = {
    __proto__: MovingObject,
    color: "black",
    width: Constants.paddleWidth,
    height: Constants.paddleHeight,

    spawn() {
      this.x = (canvas.width - this.width) / 2;
      this.y = canvas.height - this.height - 30;
    },

    move() {
      this.x += this.xv;
    },

    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    },
  };

  // Keyboard input
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "a":
      case "A":
      case "ArrowLeft":
        paddle.xv = -Constants.paddleSpeed;
        break;
      case "d":
      case "D":
      case "ArrowRight":
        paddle.xv = Constants.paddleSpeed;
        break;
    }
  });

  document.addEventListener("keyup", function (e) {
    switch (e.key) {
      case "a":
      case "A":
      case "ArrowLeft":
        if (paddle.xv < 0) paddle.xv = 0;
        break;
      case "d":
      case "D":
      case "ArrowRight":
        if (paddle.xv > 0) paddle.xv = 0;
        break;
    }
  });

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const ball = {
    __proto__: MovingObject,
    color: "blue",
    radius: Constants.ballRadius,

    spawn() {
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;

      this.xv = 2 * (Math.random() < 0.5 ? -1 : 1);
      this.yv = 2.2;
    },

    move() {
      this.outOfBoundaries();

      if (this.collidesWith(paddle)) {
        this.yv = -Math.abs(this.yv);

        // Change angle according to center
        this.xv = this.x - (paddle.x + paddle.width / 2);

        // Make it less strong
        this.xv *= 0.13;
        this.xv = clamp(this.xv, -8, 8);
      }

      this.x += this.xv;
      this.y += this.yv;
    },

    draw() {
      ctx.beginPath();
      ctx.fillStyle = this.color;
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    },

    outOfBoundaries() {
      if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
        this.xv = -this.xv;
        return true;
      }

      if (this.y - this.radius <= 0) {
        //|| this.y + this.radius >= canvas.height) {
        this.yv = -this.yv;
        return true;
      }

      return false;
    },

    collidesWith(rectangle) {
      var dx = Math.abs(this.x - rectangle.x - rectangle.width / 2);
      var dy = Math.abs(this.y - rectangle.y - rectangle.height / 2);

      if (
        dx <= rectangle.width / 2 + this.radius &&
        dy <= rectangle.height / 2 + this.radius
      ) {
        return true;
      } else {
        return false;
      }
    },
  };

  function drawMessage(message, color = "black") {
    ctx.font = "15px Courier New";
    ctx.fillStyle = color;
    const measure = ctx.measureText(message);
    ctx.fillText(
      message,
      canvas.width / 2 - measure.width / 2,
      canvas.height / 2
    );
  }

  // Set up
  paddle.spawn();
  ball.spawn();
  brickList = Brick.generateList();

  function draw(timeStamp) {
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    Brick.bulkCheckCollision(brickList, ball);
    Brick.drawList(brickList);

    // Boundaries
    if (paddle.x < 0 && paddle.xv < 0) {
      paddle.xv = 0;
    } else if (paddle.x + paddle.width > canvas.width && paddle.xv > 0) {
      paddle.xv = 0;
    }

    paddle.move();
    paddle.draw();

    ball.move();
    ball.draw();
    window.requestAnimationFrame(draw);

    // Check winning & losing condition
    if (brickList.length == 0) {
      drawMessage("Winner Winner Chicken Dinner", "fuchsia");
    } else if (ball.y > canvas.height + 100) {
      drawMessage("Game over", "red");
    }
  }

  window.requestAnimationFrame(draw);
});
