const readline = require("readline");

class IObserver {
  update(msg) { }
}

class ConsoleNotifier extends IObserver {
  update(msg) {
    console.log(`[NOTIFICATION] ${msg}`)
  }
}

class Symbol {
  constructor(mark) {
    this.mark = mark;
  }

  getMark() {
    return this.mark;
  }
}

class Board {
  constructor(size) {
    this.size = size;
    this.emptyCell = new Symbol("-");
    this.grid = Array.from({ length: size }, () => (
      Array.from({ length: size }, () => this.emptyCell)
    ));
  }

  isValidPos(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c < this.size;
  }

  isCellEmpty(r, c) {
    if (!this.isValidPos(r, c))
      return false;
    return this.grid[r][c] === this.emptyCell;
  }

  placeMark(r, c, symbol) {
    if (!this.isCellEmpty(r, c))
      return false;
    this.grid[r][c] = symbol;
    return true;
  }

  getCell(r, c) {
    if (!this.isValidPos(r, c))
      return this.emptyCell;
    return this.grid[r][c];
  }

  getSize() {
    return this.size;
  }

  display() {
    console.log("\n  " + [...Array(this.size).keys()].join(" "));
    for (let i = 0; i < this.size; i++) {
      let row = `${i} `;
      for (let j = 0; j < this.size; j++) {
        row += this.grid[i][j].getMark() + " ";
      }
      console.log(row);

      console.log();
    }
  }
}

class TicTacToePlayer {
  constructor(id, name, symbol) {
    this.id = id;
    this.name = name;
    this.symbol = symbol;
    this.score = 0;
  }

  incrementScore() {
    this.score++;
  }

  getName() {
    return this.name;
  }

  getSymbol() {
    return this.symbol;
  }
}

class TicTacToeRules {
  checkWinCondition(board, symbol) { }
  isValidMove(board, r, c) { }
  checkDrawCondition(board) { }
}

class StandardTicTacToeRules extends TicTacToeRules {
  isValidMove(board, r, c) {
    return board.isCellEmpty(r, c);
  }

  checkWinCondition(board, symbol) {
    const size = board.getSize();
    for (let i = 0; i < size; i++) {
      let win = true;
      for (let j = 0; j < size; j++) {
        if (board.getCell(i, j) !== symbol) {
          win = false;
          break;
        }
      }
      if (win)
        return true;
    }

    for (let i = 0; i < size; i++) {
      let win = true;
      for (let j = 0; j < size; j++) {
        if (board.getCell(j, i) !== symbol) {
          win = false;
          break;
        }
      }
      if (win)
        return true;
    }

    let win = true;
    for (let i = 0; i < size; i++) {
      if (board.getCell(i, i) !== symbol) {
        win = false;
        break;
      }
    }
    if (win)
      return true;

    for (let i = 0; i < size; i++) {
      if (board.getCell(i, size - i - 1) !== symbol)
        return false;
    }
    return true;
  }

  checkDrawCondition(board) {
    const size = board.getSize();
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (board.isCellEmpty(i, j))
          return false;
      }
    }
    return true;
  }
}

class TicTacToeGame {
  constructor(size) {
    this.board = new Board(size);
    this.rules = new StandardTicTacToeRules();
    this.players = [];
    this.observers = [];
    this.gameOver = false;
  }

  addPlayer(player) {
    this.players.push(player);
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  notify(msg) {
    this.observers.forEach(o => o.update(msg));
  }

  rotatePlayers() {
    const p = this.players.shift();
    this.players.push(p);
  }

  async play() {
    if (this.players.length < 2) {
      console.log("Need at least 2 players!");
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = q => new Promise(res => rl.question(q, res));
    this.notify("Tic Tac Toe Game Started!");

    while (!this.gameOver) {
      this.board.display();
      const player = this.players[0];
      const input = await ask(
        `${player.getName()} (${player.getSymbol().getMark()}) - Enter row and column: `
      );

      const [row, col] = input.split(" ").map(Number);
      if (this.rules.isValidMove(this.board, row, col)) {
        this.board.placeMark(row, col, player.getSymbol());
        this.notify(`${player.getName()} played (${row},${col})`);
        if (this.rules.checkWinCondition(this.board, player.getSymbol())) {
          this.board.display();
          console.log(`${player.getName()} wins!`);
          player.incrementScore();
          this.notify(`${player.getName()} wins!`);
          this.gameOver = true;
        } else if (this.rules.checkDrawCondition(this.board)) {
          this.board.display();
          console.log("It's a draw!");
          this.notify("Game is Draw!");
          this.gameOver = true;
        } else
          this.rotatePlayers();
      } else {
        console.log("Invalid move! Try again.");
        this.notify(`${player.getName()} made an invalid move.`);
      }
    }
    rl.close();
  }
}

const GameType = {
  STANDARD: "STANDARD"
};

class TicTacToeGameFactory {
  static createGame(type, size) {
    if (type === GameType.STANDARD) {
      return new TicTacToeGame(size);
    }
    return null;
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = q => new Promise(res => rl.question(q, res));

  console.log("=== TIC TAC TOE GAME ===");

  const size = parseInt(await ask("Enter board size (e.g., 3): "));
  rl.close();

  const game = TicTacToeGameFactory.createGame(GameType.STANDARD, size);

  const notifier = new ConsoleNotifier();
  game.addObserver(notifier);

  const player1 = new TicTacToePlayer(1, "Aditya", new Symbol("X"));
  const player2 = new TicTacToePlayer(2, "Harshita", new Symbol("O"));

  game.addPlayer(player1);
  game.addPlayer(player2);

  await game.play();
}

main();