/**
 * Weather System Filters Tool
 * Handles the rendering of different data layers, overlays, and the dynamic UI.
 */
const FilterSystem = {
    currentMode: 'composite', 
    uiInitialized: false,
    
    // Toggles for our new overlay checkboxes
    overlays: {
        fronts: false,
        wind: false
    },

    setMode: function(mode) {
        this.currentMode = mode;
        console.log(`Filter changed to: ${mode}`);
        if (this.uiInitialized) this.updateLegend();
    },

    // --- DOM UI GENERATION ---
    initUI: function() {
        if (this.uiInitialized) return;

        const style = document.createElement('style');
        style.textContent = `
            #weather-ui { position: absolute; top: 10px; right: 10px; background: rgba(20,20,20,0.85); color: white; padding: 15px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.5); z-index: 100; width: 220px; backdrop-filter: blur(4px); border: 1px solid #444; }
            .ui-header { display: flex; justify-content: space-between; cursor: pointer; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #555; padding-bottom: 5px; }
            #ui-content { display: block; }
            .ui-section-title { font-size: 12px; color: #aaa; text-transform: uppercase; margin-bottom: 5px; margin-top: 10px; }
            .legend-bar { height: 12px; width: 100%; border-radius: 3px; margin: 5px 0; }
            .legend-labels { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 15px; color: #ccc; }
            .toggle-row { margin-bottom: 8px; font-size: 13px; display: flex; align-items: center; cursor: pointer; }
            .toggle-row input { margin-right: 8px; cursor: pointer; }
        `;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.id = 'weather-ui';
        
        container.innerHTML = `
            <div class="ui-header" id="ui-toggle-btn">
                <span>Weather Controls</span>
                <span id="ui-arrow">▼</span>
            </div>
            <div id="ui-content">
                <div class="ui-section-title" id="legend-title">Legend</div>
                <div id="legend-gradient" class="legend-bar"></div>
                <div class="legend-labels">
                    <span id="legend-low">Low</span>
                    <span id="legend-high">High</span>
                </div>
                
                <div class="ui-section-title">Overlays</div>
                <label class="toggle-row">
                    <input type="checkbox" id="toggle-fronts"> Show Fronts (Red/Blue)
                </label>
                <label class="toggle-row">
                    <input type="checkbox" id="toggle-wind"> Show Wind Direction
                </label>
            </div>
        `;
        document.body.appendChild(container);

        document.getElementById('ui-toggle-btn').addEventListener('click', () => {
            const content = document.getElementById('ui-content');
            const arrow = document.getElementById('ui-arrow');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                arrow.textContent = '▼';
            } else {
                content.style.display = 'none';
                arrow.textContent = '▲';
            }
        });

        document.getElementById('toggle-fronts').addEventListener('change', (e) => {
            this.overlays.fronts = e.target.checked;
        });

        document.getElementById('toggle-wind').addEventListener('change', (e) => {
            this.overlays.wind = e.target.checked;
        });

        this.uiInitialized = true;
        this.updateLegend();
    },

    updateLegend: function() {
        const gradientEl = document.getElementById('legend-gradient');
        const lowEl = document.getElementById('legend-low');
        const highEl = document.getElementById('legend-high');
        const titleEl = document.getElementById('legend-title');

        if (this.currentMode === 'temperature' || this.currentMode === 'composite') {
            titleEl.textContent = 'Temperature Scale';
            gradientEl.style.background = 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)';
            lowEl.textContent = '-10°C';
            highEl.textContent = '40°C';
        } else if (this.currentMode === 'moisture') {
            titleEl.textContent = 'Humidity Scale';
            gradientEl.style.background = 'linear-gradient(to right, #a08c5a, #4a804d, #00008b)';
            lowEl.textContent = 'Dry (0%)';
            highEl.textContent = 'Moist (100%)';
        } else if (this.currentMode === 'terrain') {
            titleEl.textContent = 'Terrain Elevation';
            gradientEl.style.background = 'linear-gradient(to right, #00008b, #4169e1, #e6dca1, #228b22, #7f8c8d, #ecf0f1)';
            lowEl.textContent = 'Deep Ocean';
            highEl.textContent = 'Mountain Peak';
        }
    },

    // --- MAIN RENDER LOOP ---
    render: function(ctx, grid, cols, rows, cellSize) {
        if (!this.uiInitialized) this.initUI();

        // Clear canvas with black as base
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const cell = grid[i][j];

                if (this.currentMode === 'composite') {
                    this.drawComposite(ctx, cell, i, j, cellSize);
                } else {
                    let fillColor = '#000000';
                    if (this.currentMode === 'terrain') fillColor = this.getTerrainColor(cell);
                    else if (this.currentMode === 'temperature') fillColor = this.getTemperatureColor(cell);
                    else if (this.currentMode === 'moisture') fillColor = this.getMoistureColor(cell);

                    ctx.fillStyle = fillColor;
                    ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                }

                if (this.overlays.fronts) this.drawFronts(ctx, grid, cell, i, j, cols, rows, cellSize);
                if (this.overlays.wind) this.drawWind(ctx, cell, i, j, cellSize);
            }
        }
    },

    // --- FILTER COLOR MAPPERS ---
    getTerrainColor: function(cell) {
        let el = cell.elevation;
        let t = cell.baseTemp || cell.temperature || 15; 
        let m = cell.baseMoisture || cell.humidity || 0.5; 

        if (el < 0.45) {
            let hue = 240 - ((t - 5) / 25) * 60;
            return `hsl(${Math.max(180, Math.min(240, hue))}, 80%, ${el < 0.35 ? 30 : 45}%)`;
        } else if (el < 0.50) return '#e6dca1';
        else if (el >= 0.70) return el > 0.85 ? '#ecf0f1' : '#7f8c8d';
        else return `hsl(${50 + (m * 70)}, 40%, 40%)`;
    },

    getTemperatureColor: function(cell) {
        const clampedTemp = Math.max(-10, Math.min(40, cell.temperature)); 
        return `hsl(${240 - ((clampedTemp + 10) / 50) * 240}, 100%, 50%)`;
    },

    getMoistureColor: function(cell) {
        return `hsl(${40 + (cell.humidity * 180)}, 80%, ${70 - (cell.humidity * 30)}%)`;
    },

    drawComposite: function(ctx, cell, x, y, cellSize) {
        // 1. Draw the terrain
        ctx.fillStyle = this.getTerrainColor(cell);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // 2. Draw the subtle temperature radar overlay
        const tempIntensity = Math.max(0, Math.min(255, Math.floor((cell.temperature / 30) * 255)));
        ctx.fillStyle = `rgba(${tempIntensity}, 50, ${255 - tempIntensity}, 0.05)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // 3. Continental Scale Clouds
        if (cell.clouds > 0.1) {
            // Use a fixed size ratio (e.g., 85% of the cell).
            // This prevents the "growing boxes" look while keeping the gaps between cells.
            const sizeRatio = 0.85; 
            const cloudSize = cellSize * sizeRatio;
            const offset = (cellSize - cloudSize) / 2;

            // Use ONLY opacity to show cloud thickness/formation
            const cloudOpacity = Math.min(0.95, cell.clouds * 0.3);
            
            ctx.fillStyle = `rgba(255, 255, 255, ${cloudOpacity})`;
            ctx.fillRect((x * cellSize) + offset, (y * cellSize) + offset, cloudSize, cloudSize);
        }
    },

    // --- OVERLAY RENDERERS ---
    drawFronts: function(ctx, grid, cell, i, j, cols, rows, cellSize) {
        let upwindX = Math.floor((i - cell.windU + cols) % cols);
        let upwindY = Math.floor((j - cell.windV + rows) % rows);
        let upwindCell = grid[upwindX][upwindY];

        let tempGradient = upwindCell.temperature - cell.temperature;

        if (Math.abs(tempGradient) > 0.6) {
            if (tempGradient < 0) {
                ctx.fillStyle = 'rgba(0, 50, 255, 0.6)'; // Cold Front
            } else {
                ctx.fillStyle = 'rgba(255, 50, 0, 0.6)'; // Warm Front
            }
            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
    },

    drawWind: function(ctx, cell, x, y, cellSize) {
        if (x % 3 === 0 && y % 3 === 0) {
            ctx.beginPath();
            let centerX = (x * cellSize) + (cellSize / 2);
            let centerY = (y * cellSize) + (cellSize / 2);
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX + (cell.windU * 3), centerY + (cell.windV * 3));
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
};
