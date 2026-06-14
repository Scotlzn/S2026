import { createArray2DTiles } from "./support.js";
import Player from "./player.js"
import Wall from "./wall.js"
import Tile from "./tile.js"
import Pathfinding from "./pathfinding.js";
import UIManager from "./ui.js";

class Main {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext('2d');

        this.GRID_WIDTH = 9, this.GRID_HEIGHT = 9;
        this.GAP_SIZE = 14;

        // What im doing is calculating the tile size based on how many (tile + gap) units fit in the fixed
        // canvas size + an additional gap at the start ((canvas width - 1 gap) / (tileSize + gapSize) = grid width, and solving for tileSize)
        let total_gap_size = this.GRID_WIDTH * this.GAP_SIZE;
        this.TILE_SIZE = ((this.canvas.width - this.GAP_SIZE) - total_gap_size) / this.GRID_WIDTH;
        this.HALF_TILE_SIZE = this.TILE_SIZE * 0.5;
        this.QUARTER_TILE_SIZE = this.HALF_TILE_SIZE * 0.5;

        this.BOUNDING_BOX = this.canvas.getBoundingClientRect();

        // -------------- MOUSE EVENTS -----------
        this.mouse = { x: 0, y: 0, tileX: 0, tileY: 0, down: false, inGap: false, vertical: false, relativePositionY: 0};
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // ---------------- KEYBOARD -------------
        this.keys = {};
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));

        // -------------------TEXT ---------------
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.font = `bold 20px sans-serif`;
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.uiManager = new UIManager(this);

        this.player = new Player(this, 4, 8); // 4, 8

        this.grid = createArray2DTiles(this.GRID_WIDTH, this.GRID_HEIGHT);

        this.walls = new Set();
        this.selectedWall = { x: 0, y: 0, valid: false};

        this.pathfinding = new Pathfinding(this);

        this.player.updateAvailableMoves();
    }

    handleMouseMove(event) {
        this.mouse.x = event.clientX - this.BOUNDING_BOX.left;
        this.mouse.y = event.clientY - this.BOUNDING_BOX.top;

        // A "unit" is a tile with a gap to the top (vertical) or left (horizontal) of it
        let unitSize = this.TILE_SIZE + this.GAP_SIZE;

        let unitX = Math.floor(this.mouse.x / unitSize);
        let relativeXPositionInUnit = this.mouse.x - (unitX * unitSize);
        let unitY = Math.floor(this.mouse.y / unitSize);
        let relativeYPositionInUnit = this.mouse.y - (unitY * unitSize);

        this.mouse.tileX = unitX;
        this.mouse.tileY = unitY;
        this.mouse.relativePositionY = relativeYPositionInUnit;

        // Vertical gaps (favoured over when both)
        if (relativeXPositionInUnit <= this.GAP_SIZE) {
            this.mouse.vertical = true;
            this.mouse.inGap = true;
        
        // Horizontal gaps
        } else if (relativeYPositionInUnit <= this.GAP_SIZE) {
            this.mouse.vertical = false;
            this.mouse.inGap = true;
        } else {
            this.mouse.inGap = false;
        }


        this.render();
    }

    handleMouseDown(event) {
        this.mouse.down = true;

        if (this.mouse.inGap) {
            this.placeWall();
        } else {

            const movementKey = `${this.mouse.tileX};${this.mouse.tileY}`;
            if (this.player.availableMoves.has(movementKey)) {
                this.player.move(this.mouse.tileX, this.mouse.tileY);
            }

        }

        this.render();
    }

    handleMouseUp(event) {
        this.mouse.down = false;
    }

    handleKeyDown(event) {
        this.keys[event.key] = true;

        // "Spacebar", "Shift", "Escape", "ArrowUp", "Delete"
        if (event.key === "r") {

            if (this.pathfinding.complete) return;

            this.pathfinding.step();
            this.render();
        }

        if (event.key === "c") {
            this.pathfinding.setup();
            this.render();
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    placeWall() {

        if (!this.selectedWall.valid) {
            return;
        }

        const key = `${this.selectedWall.x};${this.selectedWall.y};${this.mouse.vertical}`;

        // Check if wall being placed already exists
        if (this.walls.has(key)) {
            return;
        } 

        // Collision checks
        if (this.mouse.vertical) {

            // Case 1, Cross shape
            if (this.wallIsColliding(this.selectedWall.x - 1, this.selectedWall.y + 1, !this.mouse.vertical)) return;

            // Case 2, Bottom overlap
            if (this.wallIsColliding(this.selectedWall.x, this.selectedWall.y + 1, this.mouse.vertical)) return;

            // Case 3, Top overlap
            if (this.wallIsColliding(this.selectedWall.x, this.selectedWall.y - 1, this.mouse.vertical)) return;

        } else {
            // Case 1, Cross shape
            if (this.wallIsColliding(this.selectedWall.x + 1, this.selectedWall.y - 1, !this.mouse.vertical)) return;

            // Case 2, Right overlap
            if (this.wallIsColliding(this.selectedWall.x + 1, this.selectedWall.y, this.mouse.vertical)) return;

            // Case 3, Left overlap
            if (this.wallIsColliding(this.selectedWall.x - 1, this.selectedWall.y, this.mouse.vertical)) return;
        }

        // Place wall
        this.walls.add(key);

        // There must always be a path towards the goal (test this with new wall)
        this.pathfinding.setup();
        const validWall = this.pathfinding.pathfind();
        if (!validWall) {
            console.log("Wall fully blocks path!")
            this.walls.delete(key);
            return;
        }


        this.player.updateAvailableMoves();
    }

    wallIsColliding(x, y, o) {
        const checkingKey = `${x};${y};${o}`;
        if (this.walls.has(checkingKey)) {
            console.log("Invalid wall!");
            return true;
        }
        return false;
    }

    renderSelectedWall() {
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.5)";

        // Prevent right and bottom edge walls
        if (this.mouse.tileX == this.GRID_WIDTH || this.mouse.tileY == this.GRID_HEIGHT) {
            return;
        }

        // Prevent top (for horizontal walls) and left (for vertical walls) edge walls
        if ((this.mouse.tileX == 0 && this.mouse.vertical) || (this.mouse.tileY == 0 && !this.mouse.vertical)) {
            return;
        }

        let wallY = this.mouse.tileY;
        let wallX = this.mouse.tileX;
        this.selectedWall.valid = true;

        // Vertical wall
        if (this.mouse.vertical) {

            // If mouse is in the intersection between horizontal and vertical gaps ensure wall still
            // passes through the mouse by shifting the vertical wall upwards until no longer in intersection
            if ((this.mouse.relativePositionY <= this.GAP_SIZE) && !(this.mouse.tileY == 0)) {
                wallY--;
            
            // Clamp vertical walls to the bottom so they still remain ~2 units tall
            } else if (this.mouse.tileY >= (this.GRID_HEIGHT - 1)) {
                wallY = this.GRID_HEIGHT - 2;
            }

            // Render vertical wall
            this.ctx.fillRect(this.mouse.tileX * this.TILE_SIZE + this.mouse.tileX * this.GAP_SIZE,
                wallY * this.TILE_SIZE + (wallY + 1) * this.GAP_SIZE,
                this.GAP_SIZE, 2 * this.TILE_SIZE + this.GAP_SIZE);


        // Horizontal wall
        } else { 

            // Clamp horizontal walls to the right so they still remain ~2 units long
            if (this.mouse.tileX >= (this.GRID_WIDTH - 1)) {
                wallX = this.GRID_WIDTH - 2;
            }

            // Render horizontal wall
            this.ctx.fillRect(wallX * this.TILE_SIZE + (wallX + 1) * this.GAP_SIZE,
                this.mouse.tileY * this.TILE_SIZE + this.mouse.tileY * this.GAP_SIZE,
                2 * this.TILE_SIZE + this.GAP_SIZE, this.GAP_SIZE);

        }

        this.selectedWall.x = wallX;
        this.selectedWall.y = wallY;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render grid
        this.lineWidth = 2;
        for (let x = 0; x < this.GRID_WIDTH; x++) {
            for (let y = 0; y < this.GRID_HEIGHT; y++) {

                let colour = "rgba(42, 42, 42, 1)";
                if (y == 0) {
                    colour = "rgba(62, 50, 50, 1)";
                } else if (y == this.GRID_HEIGHT - 1) {
                    colour = "rgba(47, 54, 64, 1)";
                }

                // Pathfinding background
                if (this.uiManager.display_sets) {
                    let tile = this.grid[x][y];
                    if (this.pathfinding.open.has(tile)) {
                        colour = "rgb(92, 109, 73)";
                    } else if (this.pathfinding.closed.has(tile)) {
                        colour = "rgb(107, 55, 52)";
                    }
                }

                this.ctx.fillStyle = colour;
                this.ctx.fillRect(x * this.TILE_SIZE + (x + 1) * this.GAP_SIZE,
                    y * this.TILE_SIZE + (y + 1) * this.GAP_SIZE,
                    this.TILE_SIZE,
                    this.TILE_SIZE);

            }
        }

        // Render placed walls
        this.ctx.fillStyle = "rgba(255, 0, 0, 1)";
        this.walls.forEach((wall) => {

            const wallData = wall.split(";");
            const x = +wallData[0];
            const y = +wallData[1];
            const vertical = (wallData[2] == "true");

            if (vertical) {

                this.ctx.fillRect(x * this.TILE_SIZE + x * this.GAP_SIZE,
                    y * this.TILE_SIZE + (y + 1) * this.GAP_SIZE,
                    this.GAP_SIZE, 2 * this.TILE_SIZE + this.GAP_SIZE);

            } else {
                this.ctx.fillRect(x * this.TILE_SIZE + (x + 1) * this.GAP_SIZE,
                    y * this.TILE_SIZE + y * this.GAP_SIZE,
                    2 * this.TILE_SIZE + this.GAP_SIZE, this.GAP_SIZE);
            }
        }); 

        // Render player
        this.ctx.fillStyle = this.player.colour;
        this.ctx.fillRect(this.player.x * this.TILE_SIZE + (this.player.x + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE,
            this.player.y * this.TILE_SIZE + (this.player.y + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE,
            this.HALF_TILE_SIZE, this.HALF_TILE_SIZE);
        

        // Wall outline for selected wall
        if (this.mouse.inGap) {
            this.selectedWall.valid = false;
            this.renderSelectedWall();
        }

        // Player move outlines
        this.player.availableMoves.forEach((move) => {
            const moveData = move.split(";");
            const x = +moveData[0];
            const y = +moveData[1];

            this.ctx.strokeStyle = "rgb(252, 252, 252)";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x * this.TILE_SIZE + (x + 1) * this.GAP_SIZE,
                y * this.TILE_SIZE + (y + 1) * this.GAP_SIZE,
                this.TILE_SIZE,
                this.TILE_SIZE);
        });


        // Pathfinding text
        if (this.uiManager.display_costs) {

            for (let x = 0; x < this.GRID_WIDTH; x++) {
                for (let y = 0; y < this.GRID_HEIGHT; y++) {

                    if (x == this.player.x && y == this.player.y) {
                        continue;
                    }

                    const tile = this.grid[x][y];

                    if (tile.f == 0) continue;

                    this.ctx.fillStyle = "rgb(34, 185, 255)";

                    // F cost
                    this.ctx.font = `bold ${20}px sans-serif`;
                    this.ctx.fillText(+tile.f,
                        x * this.TILE_SIZE + (x + 1) * this.GAP_SIZE + this.HALF_TILE_SIZE,
                        y * this.TILE_SIZE + (y + 1) * this.GAP_SIZE + this.HALF_TILE_SIZE + (this.QUARTER_TILE_SIZE * 0.5));
                    
                    // G and H costs
                    this.ctx.font = `bold ${12}px sans-serif`;
                    this.ctx.fillText(+tile.g,
                        x * this.TILE_SIZE + (x + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE,
                        y * this.TILE_SIZE + (y + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE);
                    this.ctx.fillText(+tile.h,
                        x * this.TILE_SIZE + (x + 1) * this.GAP_SIZE + this.TILE_SIZE - this.QUARTER_TILE_SIZE,
                        y * this.TILE_SIZE + (y + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE);

                }
            }
        }
    }

    reset() {
        this.player.x = 4;
        this.player.y = 8;

        this.walls = new Set();

        this.pathfinding.setup();
        this.player.updateAvailableMoves();
    }

    run() {
        this.render();
    }

}

let main = new Main();
main.run();