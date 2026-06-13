import { createArray2D } from "./support.js";
import Player from "./player.js"
import Wall from "./wall.js"

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

        // ---------------- DELTATIME ------------
        this.dt = 0, this.lt = performance.now();

        // -------------------TEXT ---------------
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.font = `bold 20px sans-serif`;
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Player
        this.player = new Player(this, 4, 8);

        let gridSize = this.GRID_WIDTH + (this.GRID_WIDTH - 1);
        this.grid = createArray2D(gridSize, gridSize);

        this.walls = [];
        this.selectedWall = { x: 0, y: 0, valid: false};
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
            this.render();
        }
    }

    handleMouseUp(event) {
        this.mouse.down = false;
    }

    handleKeyDown(event) {
        this.keys[event.key] = true;

        // "Spacebar", "Shift", "Escape", "ArrowUp", "Delete"
        if (event.key === "r") {
            console.log("Key r pressed!");
        }
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    placeWall() {

        if (!this.selectedWall.valid) {
            return;
        }

        let wallIndex = -1;

        this.walls.forEach((wall, i) => {

            if (wall.x == this.selectedWall.x && wall.y == this.selectedWall.y && wall.vertical == this.mouse.vertical) {
                wallIndex = i;
            }

            // Fix case 1
            if ((wall.x == (this.selectedWall.x + 1)) && (!wall.vertical && !this.mouse.vertical)) {
                wallIndex = 0;
                console.log("Invalid wall!")
                return;
            }

        });

        if (wallIndex != -1) {
            return;
        }

        console.log("Wall placed!")

        if (this.mouse.vertical) {
            this.walls.push(new Wall(this.selectedWall.x, this.selectedWall.y, true))

        } else {
            this.walls.push(new Wall(this.selectedWall.x, this.selectedWall.y, false))
        }
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

                let colour = (y == 0 || (y == this.GRID_HEIGHT - 1)) ? "rgba(62, 50, 50, 1)" : "rgba(42, 42, 42, 1)";
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
            if (wall.vertical) {

                this.ctx.fillRect(wall.x * this.TILE_SIZE + wall.x * this.GAP_SIZE,
                    wall.y * this.TILE_SIZE + (wall.y + 1) * this.GAP_SIZE,
                    this.GAP_SIZE, 2 * this.TILE_SIZE + this.GAP_SIZE);

            } else {
                this.ctx.fillRect(wall.x * this.TILE_SIZE + (wall.x + 1) * this.GAP_SIZE,
                    wall.y * this.TILE_SIZE + wall.y * this.GAP_SIZE,
                    2 * this.TILE_SIZE + this.GAP_SIZE, this.GAP_SIZE);
            }
        }); 

        // Render player
        this.ctx.fillStyle = "rgba(183, 0, 255, 255)";
        this.ctx.fillRect(this.player.x * this.TILE_SIZE + (this.player.x + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE,
            this.player.y * this.TILE_SIZE + (this.player.y + 1) * this.GAP_SIZE + this.QUARTER_TILE_SIZE,
            this.HALF_TILE_SIZE, this.HALF_TILE_SIZE);
        

        if (this.mouse.inGap) {
            this.selectedWall.valid = false;
            this.renderSelectedWall();
        }

        // -------- RECTANGLE ----------
        // this.ctx.fillStyle = color;
        // this.ctx.fillRect(x, y, width, height);

        // -------- CIRCLE -------------
        // this.ctx.fillStyle = color;
        // this.ctx.beginPath();
        // this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        // this.ctx.fill();

        // --------- TEXT ------------
        // this.ctx.fillStyle = color;
        // this.ctx.fillText(text, x, y);
    }

    // update() {
    //     // ------- DELTATIME --------
    //     const now = performance.now();
    //     this.dt = (now - this.lt) / 1000;
    //     this.lt = now;

    //     requestAnimationFrame(this.update);
    // }

    run() {
        this.render();
        // requestAnimationFrame(this.update);
    }

}

let main = new Main();
main.run();

// let testText = document.getElementById("testText")

// async function loadData() {
//   const response = await fetch('./data.json');
//   const data = await response.json();

//   console.log(data); 
//   testText.textContent = data[0].name;      
// }

// loadData();