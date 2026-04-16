/**
 * Weather System Filters Tool
 * Handles the rendering of different data layers on the canvas.
 */
const FilterSystem = {
    // Default view mode. Options: 'terrain', 'temperature', 'moisture', 'composite'
    currentMode: 'composite', 

    // Update the active filter
    setMode: function(mode) {
        this.currentMode = mode;
        console.log(`Filter changed to: ${mode}`);
    },

    // Main render loop called every frame
    render: function(ctx, grid, cols, rows, cellSize) {
        // Clear the canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const cell = grid[i][j];

                if (this.currentMode === 'composite') {
                    // Draw base terrain and weather overlay
                    this.drawComposite(ctx, cell, i, j, cellSize);
                } else {
                    // Draw raw data maps (Thermal, Moisture, Terrain only)
                    let fillColor = '#000000';
                    
                    if (this.currentMode === 'terrain') fillColor = this.getTerrainColor(cell);
                    else if (this.currentMode === 'temperature') fillColor = this.getTemperatureColor(cell);
                    else if (this.currentMode === 'moisture') fillColor = this.getMoistureColor(cell);

                    ctx.fillStyle = fillColor;
                    ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                }
            }
        }
    },

    // --- FILTER COLOR MAPPERS ---

    // 1. Terrain Only View (No Weather)
    getTerrainColor: function(cell) {
        let el = cell.elevation;
        let t = cell.baseTemp;
        let m = cell.baseMoisture;

        if (el < 0.45) {
            // Water
            let hue = 240 - ((t - 5) / 25) * 60;
            hue = Math.max(180, Math.min(240, hue));
            let lightness = el < 0.35 ? 30 : 45;
            return `hsl(${hue}, 80%, ${lightness}%)`;
        } else if (el < 0.50) {
            // Beach
            return '#e6dca1';
        } else if (el >= 0.70) {
            // Mountains
            if (el > 0.85) return '#ecf0f1';
            return '#7f8c8d';
        } else {
            // Inland
            let hue = 50 + (m * 70); 
            return `hsl(${hue}, 40%, 40%)`;
        }
    },

    // 2. Thermal Camera View (Hot/Cold)
    getTemperatureColor: function(cell) {
        const temp = cell.temperature;
        // Clamp between -10C and 40C for the color scale
        const clampedTemp = Math.max(-10, Math.min(40, temp)); 
        
        // Map -10C to Blue (Hue 240) and 40C to Red (Hue 0)
        const hue = 240 - ((clampedTemp + 10) / 50) * 240; 
        return `hsl(${hue}, 100%, 50%)`;
    },

    // 3. Water Vapor / Moisture View (Dry/Moist)
    getMoistureColor: function(cell) {
        const moisture = cell.humidity;
        // Dry (0.0) = Brown/Khaki, Moist (1.0) = Deep Blue
        const hue = 40 + (moisture * 180); 
        const lightness = 70 - (moisture * 30); // Gets darker as it gets wetter
        return `hsl(${hue}, 80%, ${lightness}%)`;
    },

    // 4. Composite View (Terrain Base + Weather Overlay)
    drawComposite: function(ctx, cell, x, y, cellSize) {
        // Draw the solid terrain base
        ctx.fillStyle = this.getTerrainColor(cell);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Overlay current temperature shifts (Radar style)
        const tempIntensity = Math.max(0, Math.min(255, Math.floor((cell.temperature / 30) * 255)));
        ctx.fillStyle = `rgba(${tempIntensity}, 50, ${255 - tempIntensity}, 0.15)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
};
