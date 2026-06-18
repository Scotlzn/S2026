import { DIRECTION4, inBounds, checkWallCollisions } from "./support.js";

export default class Player {
    constructor(main, x, y, player) {
        this.main = main;

        this.x = x;
        this.y = y;

        this.player = player;
        this.oppositePlayer = Math.abs(this.player - 1)
        this.goal = (this.player == 0) ? 0 : (this.main.GRID_HEIGHT - 1);

        this.colour = (player == 0) ? "rgb(202, 35, 35)" : "rgb(27, 126, 207)";

        this.availableMoves = new Set();
    }

    updateAvailableMoves() {
        this.availableMoves = new Set();
        DIRECTION4.forEach((direction) => {
            let jump = false;
            let new_x = this.x + direction[0];
            let new_y = this.y + direction[1];

            // Other player is in this tile -> check if jump is available
            if ((new_x == this.main.players[this.oppositePlayer].x) && (new_y == this.main.players[this.oppositePlayer].y)) {
                jump = true;
                new_x = this.x + direction[0] * 2;
                new_y = this.y + direction[1] * 2;
            }

            // Neighbour is out of bounds -> NO
            if (!inBounds(new_x, new_y, this.main.GRID_WIDTH, this.main.GRID_HEIGHT)) return;

            let neighbour = this.main.grid[new_x][new_y];

            // Neighbour requires passing through a wall -> NO
            let vertical = (new_x == this.x);
            if (checkWallCollisions(this.main.walls, this.x, this.y, vertical, direction)) {
                return;
            }

            // If jump is possible, another wall must be checked
            if (jump) {
                if (checkWallCollisions(this.main.walls, new_x - direction[0], new_y - direction[1], vertical, direction)) {
                    return;
                }
            }

            // Move IS available
            const key = `${new_x};${new_y}`;
            this.availableMoves.add(key);
        });
    }

    move(x, y) {
        this.x = x;
        this.y = y;
    }
}