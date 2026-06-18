import { getRandomIntInRange, calculateDistance, DIRECTION4, inBounds, checkWallCollisions } from "./support.js";

export default class Pathfinding {
    constructor(main) {
        this.main = main;

        this.open; // Nodes to be evaluated
        this.closed; // Nodes already evaluated
        this.current;
        this.complete = false;
        this.failed = true;

        this.currentPlayer = 0;

        this.setup(0);
    }

    setup(player) {

        // Reset costs of all tiles
        for (let x = 0; x < this.main.GRID_WIDTH; x++) {
            for (let y = 0; y < this.main.GRID_HEIGHT; y++) {
                this.main.grid[x][y].h = 0;
                this.main.grid[x][y].g = 0;
                this.main.grid[x][y].f = 0;
            }
        }

        this.open = new Set();
        this.closed = new Set();
        this.complete = false;
        this.failed = true;

        this.currentPlayer = player;

        this.open.add(this.main.grid[this.main.players[player].x][this.main.players[player].y]);
    }

    step() {

        // Find node in OPEN with lowest F cost
        const open_array = [...this.open];
        const lowest_f = Math.min(...open_array.map(tile => tile.f));
        const possible_tiles = open_array.filter(tile => tile.f === lowest_f);
        this.current = possible_tiles[getRandomIntInRange(0, possible_tiles.length - 1)];

        // Remove current from OPEN
        this.open.delete(this.current);
        // Add current to CLOSED
        this.closed.add(this.current);

        // if current == END, path has been found
        const endY = (this.currentPlayer == 0) ? 0 : (this.main.GRID_HEIGHT - 1);
        if (this.current.y == endY) {
            this.complete = true;
            this.failed = false;
            return;
        }

        DIRECTION4.forEach((direction) => {
            let new_x = this.current.x + direction[0];
            let new_y = this.current.y + direction[1];

            // Neighbour is not traversable -> return
            if (!inBounds(new_x, new_y, this.main.GRID_WIDTH, this.main.GRID_HEIGHT)) return;

            let neighbour = this.main.grid[new_x][new_y];

            // Neighbour requires passing through a wall -> NO
            let vertical = (new_x == this.current.x);
            if (checkWallCollisions(this.main.walls, this.current.x, this.current.y, vertical, direction)) {
                return;
            }

            // Neighbour is in CLOSED -> NO (already fully checked)
            if (this.closed.has(neighbour)) return;

            // tentative_gScore = gScore[current] + distance(current, neighbor)
            let temp_g = this.current.g + calculateDistance(this.current.x, this.current.y, neighbour.x, neighbour.y);

            // If neighbour not in OPEN or new path to neighbour is shorter
            if (!this.open.has(neighbour) || temp_g < neighbour.g) {
                // Set costs of neighbour
                neighbour.g = temp_g;
                neighbour.h = this.heuristic(neighbour.x, neighbour.y);
                neighbour.f = neighbour.g + neighbour.h;

                // Set parent of neighbour to current
                neighbour.parent = [this.current.x, this.current.y];

                // If neighbour is not in OPEN --> add neighbour to OPEN
                this.open.add(neighbour);
            }
        });

        // if OPEN is empty -> no solution is possible!
        if (this.open.size == 0) {
            this.failed = true;
            this.complete = true;
        }
    }

    pathfind() {
        while (!this.complete) {
            this.step();
        }
        return !this.failed;
    }

    heuristic(x, y) {
        if (this.currentPlayer == 0) {
            return y * 10;
        }
        return Math.abs((8 - y) * 10);
    }

}