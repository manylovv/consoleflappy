import tty from 'node:tty';
import pkg from 'terminal-kit';
const onChange = require('on-change');
const cliCanvas = require('cli-canvas');
const keypress = require('keypress');
const utils = require('./utils');
// random 

const { terminal: term } = pkg;
const G = 1;
let ctx: any = new cliCanvas.Context();

const app = () => {
  // settings for full screen:
  // heigth: process.stdout.rows,
  // width: process.stdout.columns,
  const settings = {
    heigth: 20,
    width: 30,
    bird: '%',
    bg: ' ',
    column: 'v',
  };

  const generateHole = (heigth: number) => random(0, heigth - 1);

  term.clear();
  term.hideCursor();
  // stream.cursorTo(0, 0, () => {
  //   stream.write(renderFrame(field));
  // });
  ctx.begin();
  for (let i = 0; i < settings.heigth; i++) {
    ctx.line(0, i, settings.width, 0, settings.bg);
  }
  ctx.end();

  const game = onChange(
    {
      heigth: settings.heigth,
      width: settings.width,
      score: -1,
      bird: {
        x: 3,
        y: Math.round(settings.heigth / 2),
        startFallingTime: Date.now(),
      },
      column: {
        x: 0,
        holeY: generateHole(settings.heigth),
      },
    },
    () => {
      const { bird, column } = game;
      ctx.begin();
      for (let i = 0; i < settings.heigth; i++) {
        ctx.line(0, i, settings.width, 0, settings.bg);
        ctx.point(column.x, i, settings.column);
      }

      ctx.line(0, column.holeY, settings.width, 0, settings.bg);
      ctx.line(0, column.holeY + 1, settings.width, 0, settings.bg);
      ctx.line(0, column.holeY + 2, settings.width, 0, settings.bg);

      ctx.text(bird.x, bird.y, settings.bird);

      ctx.text(0, 0, `Score: ${game.score}`);

      ctx.end();
    }
  );

  // if player press space, bird will fly up
  const jumpHandler = () => {
    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
      if (key && key.ctrl && key.name == 'c') {
        process.exit();
      }

      if (key && key.name == 'space') {
        let counter = 0;
        game.bird.startFallingTime = Date.now();

        const interval = setInterval(() => {
          if (counter === 7 || game.bird.y <= 0) {
            clearInterval(interval);
            return;
          }

          counter++;
          game.bird.y -= 1;
        }, 25);
      }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();
  };

  // column is moving from right to left
  // if column is out of the screen, generate new column
  const moveColumn = () => {
    if (game.column.x === 0) {
      game.column.x = settings.width - 1;
      game.column.holeY = generateHole(settings.heigth);
      game.score++;
    } else {
      game.column.x -= 1;
    }
  };

  const moveBird = () => {
    // calculate the time passed since the bird started falling
    // and calculate the distance fallen by the bird: d = 0.5gt^2
    const deltaTime = (Date.now() - game.bird.startFallingTime) / 1000; // in seconds
    const distance = Math.ceil(0.5 * G * deltaTime ** 1.5);

    const bottom = settings.heigth - 1;
    if (game.bird.y + distance > bottom) {
      game.bird.y = bottom;
    } else {
      game.bird.y += distance;
    }
  };

  // game loop and jump handler
  jumpHandler();
  const interval = setInterval(() => {
    moveColumn();
    moveBird();

    // check if bird is crashed
    if (
      game.bird.y !== game.column.holeY &&
      game.bird.y !== game.column.holeY + 1 &&
      game.bird.y !== game.column.holeY + 2 &&
      game.bird.x === game.column.x
    ) {
      clearInterval(interval);
      term.clear();
      term.restoreCursor();

      console.log(`SCORE: ${game.score}`);
      console.log(gameOver.join('\n'));
      process.exit();
    }
  }, 50);
};

app();
