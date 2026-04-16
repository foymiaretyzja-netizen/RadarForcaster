/**
 * World Data Storage
 * Centralized state management for the planetary grid and atmospheric constants.
 */
const WorldState = {
    // --- GRID DATA ---
    grid: [],
    cols: 0,
    rows: 0,
    cellSize: 10,

    // --- PLANETARY CONSTANTS ---
    basePressure: 1013.25,      // Standard sea-level pressure in millibars (hPa)
    rotationRate: 0.000072921,  // Earth's angular velocity (Omega)
    equatorY: 0,                // Y-coordinate of the equator (set dynamically)
    coriolisFactor: 1.0,        // A multiplier to tweak the visual strength of the spin

    // --- INITIALIZATION ---
    setup: function(columns, mapRows, size) {
        this.cols = columns;
        this.rows = mapRows;
        this.cellSize = size;
        
        // Place the equator right in the middle of the map
        this.equatorY = Math.floor(this.rows / 2); 
        
        // Clear and prepare the grid array
        this.grid = new Array(this.cols);
        for (let i = 0; i < this.cols; i++) {
            this.grid[i] = new Array(this.rows);
        }
        
        console.log(`World State Initialized: ${this.cols}x${this.rows} (Equator at Y:${this.equatorY})`);
    },

    // --- HELPER METHODS ---
    // Safely get a cell, returning null if out of bounds (useful for physics checks)
    getCell: function(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
        return this.grid[x][y];
    }
};
