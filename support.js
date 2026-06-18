import Tile from "./tile.js"

export const DIRECTION4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export const DIRECTION8 = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

export function getRandomIntInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function rectangleCollision(a, b) {
    return (a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]);
}

export function inBounds(x, y, maxX, maxY) {
    return ((x >= 0) && (x < maxX) && (y >= 0) && (y < maxY));
}

export function calculateDistance(x1, y1, x2, y2) {
    const dx = Math.abs((x2 * 10) - (x1 * 10));
    const dy = Math.abs((y2 * 10) - (y1 * 10));
    return dx + dy;
}

export function createArray2DTiles(width, height) {
    const output = [];
    for (let x = 0; x < width; x++) {
        const new_line = [];
        for (let y = 0; y < height; y++) {
            new_line[y] = new Tile(x, y);
        }
        output[x] = new_line;
    }
    return output;
}

export function checkWallCollisions(walls, x, y, vertical, parallelDirection) {
    if (vertical) {

        // y direction positive means neighbour is BELOW current tile
        const yOffset = (parallelDirection[1] > 0) ? 1 : 0;

        let wallKey = `${x};${y + yOffset};${false}`;
        if (walls.has(wallKey)) return true;

        wallKey = `${x - 1};${y + yOffset};${false}`;
        if (walls.has(wallKey)) return true;

    } else {

        // x direction positive means neighbour is RIGHT of current tile
        const xOffset = (parallelDirection[0] > 0) ? 1 : 0;

        let wallKey = `${x + xOffset};${y};${true}`;
        if (walls.has(wallKey)) return true;

        wallKey = `${x + xOffset};${y - 1};${true}`;
        if (walls.has(wallKey)) return true;

    }
    return false;
}