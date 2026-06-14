import { DIRECTION4, inBounds, checkWallCollisions } from "./support.js";

export default class Player {
    constructor(main, x, y) {
        this.main = main;

        this.x = x;
        this.y = y;

        this.colour = "rgb(202, 35, 35)";

        this.availableMoves = new Set();
    }

    updateAvailableMoves() {
        this.availableMoves = new Set();
        DIRECTION4.forEach((direction) => {
            const new_x = this.x + direction[0];
            const new_y = this.y + direction[1];

            // Neighbour is not traversable -> return
            if (!inBounds(new_x, new_y, this.main.GRID_WIDTH, this.main.GRID_HEIGHT)) return;

            let neighbour = this.main.grid[new_x][new_y];

            // Neighbour requires passing through a wall -> NO
            let vertical = (new_x == this.x);
            if (checkWallCollisions(this.main.walls, this.x, this.y, vertical, direction)) {
                return;
            }

            // Move IS available
            const key = `${new_x};${new_y}`;
            this.availableMoves.add(key);
        });
    }

    move(x, y) {
        this.x = x;
        this.y = y;

        this.updateAvailableMoves();
    }
}