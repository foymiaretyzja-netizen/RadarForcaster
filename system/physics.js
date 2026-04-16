/**
 * Atmospheric Physics Engine
 * Handles thermodynamics, geostrophic wind dynamics, and fluid advection.
 */
const PhysicsEngine = {
    
    update: function(world) {
        this.processThermodynamics(world);
        this.calculateWind(world);
        this.processAdvection(world);
    },

    // --- 1. THERMODYNAMICS & PRESSURE ---
    processThermodynamics: function(world) {
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];

                // Update Pressure (Warm air expands/rises = lower pressure; Cold = higher)
                let targetPressure = world.basePressure - (cell.elevation * 100) + (10 - cell.temperature);
                cell.pressure += (targetPressure - cell.pressure) * 0.1; // Smooth transitions

                // Evaporation
                if (cell.elevation < 0.45 && cell.temperature > 10) {
                    let evapRate = (cell.temperature - 10) * 0.002;
                    cell.humidity += evapRate;
                }

                // Condensation
                let maxCapacity = Math.max(0.1, cell.temperature * 0.08);
                if (cell.humidity > maxCapacity) {
                    let excess = cell.humidity - maxCapacity;
                    cell.clouds += excess; 
                    cell.humidity = maxCapacity; 
                }

                // Dissipation
                if (cell.clouds > 0 && cell.humidity < maxCapacity) {
                    let absorb = Math.min(cell.clouds, (maxCapacity - cell.humidity) * 0.05);
                    cell.clouds -= absorb;
                    cell.humidity += absorb;
                }

                // Bounds
                cell.humidity = Math.max(0, cell.humidity);
                cell.clouds = Math.max(0, Math.min(cell.clouds, 5.0));
            }
        }
    },

    // --- 2. GEOSTROPHIC WIND DYNAMICS ---
    calculateWind: function(world) {
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];

                // Wrap-around coordinates for looking at neighbors
                let left = (i - 1 + world.cols) % world.cols;
                let right = (i + 1) % world.cols;
                let up = (j - 1 + world.rows) % world.rows;
                let down = (j + 1) % world.rows;

                // Pressure Gradient Force (PGF)
                let dPdx = (world.grid[right][j].pressure - world.grid[left][j].pressure) * 0.5;
                let dPdy = (world.grid[i][down].pressure - world.grid[i][up].pressure) * 0.5;

                // Wind accelerates from High to Low pressure
                let accU = -dPdx * 0.05; 
                let accV = -dPdy * 0.05;

                // Coriolis Effect (Northern Hemisphere: deflects wind to the right)
                // Canvas Y is inverted (Down is positive), so the math adapts here:
                let f = 0.25; 
                let corU = -cell.windV * f;
                let corV = cell.windU * f;

                // Apply forces
                cell.windU += accU + corU;
                cell.windV += accV + corV;

                // Apply Terrain Friction (Slows wind, causes it to angle inward/outward)
                let friction = 0.90 - (cell.surfaceFriction * 0.15);
                cell.windU *= friction;
                cell.windV *= friction;

                // Add a gentle global Westerly drift so the atmosphere doesn't stall completely
                cell.windU += 0.1; 

                // Clamp max wind speeds for simulation stability
                cell.windU = Math.max(-2.0, Math.min(cell.windU, 2.0));
                cell.windV = Math.max(-2.0, Math.min(cell.windV, 2.0));
            }
        }
    },

    // --- 3. FLUID ADVECTION (Moving the clouds) ---
    processAdvection: function(world) {
        let nextClouds = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));
        let nextHumidity = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));

        // Semi-Lagrangian Advection: Look BACKWARDS along the wind vector to find where the air came from
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];
                
                let srcX = i - cell.windU;
                let srcY = j - cell.windV;

                // Wrap coordinates safely
                srcX = (srcX % world.cols + world.cols) % world.cols;
                srcY = (srcY % world.rows + world.rows) % world.rows;

                // Smooth bilinear interpolation (prevents pixelated blocky clouds)
                let x0 = Math.floor(srcX);
                let x1 = (x0 + 1) % world.cols;
                let y0 = Math.floor(srcY);
                let y1 = (y0 + 1) % world.rows;

                let dx = srcX - x0;
                let dy = srcY - y0;

                // Grab cloud data from the 4 surrounding pixels
                let c00 = world.grid[x0][y0].clouds; let c10 = world.grid[x1][y0].clouds;
                let c01 = world.grid[x0][y1].clouds; let c11 = world.grid[x1][y1].clouds;
                
                nextClouds[i][j] = c00*(1-dx)*(1-dy) + c10*dx*(1-dy) + c01*(1-dx)*dy + c11*dx*dy;

                // Grab humidity data
                let h00 = world.grid[x0][y0].humidity; let h10 = world.grid[x1][y0].humidity;
                let h01 = world.grid[x0][y1].humidity; let h11 = world.grid[x1][y1].humidity;
                
                nextHumidity[i][j] = h00*(1-dx)*(1-dy) + h10*dx*(1-dy) + h01*(1-dx)*dy + h11*dx*dy;
            }
        }

        // Apply new values
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                world.grid[i][j].clouds = Math.max(0, nextClouds[i][j]);
                world.grid[i][j].humidity = Math.max(0, nextHumidity[i][j]);
            }
        }
    }
};
