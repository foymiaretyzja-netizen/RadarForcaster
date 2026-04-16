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

                // Ground Radiative Heating/Cooling + Chaos
                // The air tries to return to the ground's base temp, but we add slight noise
                cell.temperature += (cell.baseTemp - cell.temperature) * 0.05;
                cell.temperature += (Math.random() - 0.5) * 0.2;

                // Update Pressure dynamically based on the shifting temperature
                let targetPressure = world.basePressure - (cell.elevation * 100) + (10 - cell.temperature);
                cell.pressure += (targetPressure - cell.pressure) * 0.1; 

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

                let left = (i - 1 + world.cols) % world.cols;
                let right = (i + 1) % world.cols;
                let up = (j - 1 + world.rows) % world.rows;
                let down = (j + 1) % world.rows;

                // Pressure Gradient Force (PGF)
                let dPdx = (world.grid[right][j].pressure - world.grid[left][j].pressure) * 0.5;
                let dPdy = (world.grid[i][down].pressure - world.grid[i][up].pressure) * 0.5;

                let accU = -dPdx * 0.05; 
                let accV = -dPdy * 0.05;

                // Coriolis Effect
                let f = 0.25; 
                let corU = -cell.windV * f;
                let corV = cell.windU * f;

                cell.windU += accU + corU;
                cell.windV += accV + corV;

                // Friction
                let friction = 0.90 - (cell.surfaceFriction * 0.15);
                cell.windU *= friction;
                cell.windV *= friction;

                // Gentle Westerly drift
                cell.windU += 0.1; 

                // Clamp wind limits
                cell.windU = Math.max(-2.0, Math.min(cell.windU, 2.0));
                cell.windV = Math.max(-2.0, Math.min(cell.windV, 2.0));
            }
        }
    },

    // --- 3. FLUID ADVECTION ---
    processAdvection: function(world) {
        let nextClouds = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));
        let nextHumidity = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));
        let nextTemp = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));

        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];
                
                let srcX = i - cell.windU;
                let srcY = j - cell.windV;

                srcX = (srcX % world.cols + world.cols) % world.cols;
                srcY = (srcY % world.rows + world.rows) % world.rows;

                let x0 = Math.floor(srcX);
                let x1 = (x0 + 1) % world.cols;
                let y0 = Math.floor(srcY);
                let y1 = (y0 + 1) % world.rows;

                let dx = srcX - x0;
                let dy = srcY - y0;

                // Advect Clouds
                let c00 = world.grid[x0][y0].clouds; let c10 = world.grid[x1][y0].clouds;
                let c01 = world.grid[x0][y1].clouds; let c11 = world.grid[x1][y1].clouds;
                nextClouds[i][j] = c00*(1-dx)*(1-dy) + c10*dx*(1-dy) + c01*(1-dx)*dy + c11*dx*dy;

                // Advect Humidity
                let h00 = world.grid[x0][y0].humidity; let h10 = world.grid[x1][y0].humidity;
                let h01 = world.grid[x0][y1].humidity; let h11 = world.grid[x1][y1].humidity;
                nextHumidity[i][j] = h00*(1-dx)*(1-dy) + h10*dx*(1-dy) + h01*(1-dx)*dy + h11*dx*dy;

                // Advect Temperature (This makes the weather systems shift!)
                let t00 = world.grid[x0][y0].temperature; let t10 = world.grid[x1][y0].temperature;
                let t01 = world.grid[x0][y1].temperature; let t11 = world.grid[x1][y1].temperature;
                nextTemp[i][j] = t00*(1-dx)*(1-dy) + t10*dx*(1-dy) + t01*(1-dx)*dy + t11*dx*dy;
            }
        }

        // Apply new values
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                world.grid[i][j].clouds = Math.max(0, nextClouds[i][j]);
                world.grid[i][j].humidity = Math.max(0, nextHumidity[i][j]);
                world.grid[i][j].temperature = nextTemp[i][j];
            }
        }
    }
};
