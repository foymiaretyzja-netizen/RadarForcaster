/**
 * Atmospheric Physics Engine
 * Handles thermodynamics, fluid dynamics, and cloud lifecycles.
 */
const PhysicsEngine = {
    
    update: function(world) {
        this.processThermodynamics(world);
        this.processWindAdvection(world); // <-- Now calling the wind logic!
    },

    processThermodynamics: function(world) {
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];

                // --- 1. EVAPORATION ---
                if (cell.elevation < 0.45 && cell.temperature > 10) {
                    let evapRate = (cell.temperature - 10) * 0.002;
                    cell.humidity += evapRate;
                }

                // --- 2. CONDENSATION (Cloud Formation) ---
                let maxHumidityCapacity = Math.max(0.1, cell.temperature * 0.08);

                if (cell.humidity > maxHumidityCapacity) {
                    let excessVapor = cell.humidity - maxHumidityCapacity;
                    cell.clouds += excessVapor; 
                    cell.humidity = maxHumidityCapacity; 
                }

                // --- 3. DISSIPATION ---
                if (cell.clouds > 0 && cell.humidity < maxHumidityCapacity) {
                    let absorbAmount = Math.min(cell.clouds, (maxHumidityCapacity - cell.humidity) * 0.05);
                    cell.clouds -= absorbAmount;
                    cell.humidity += absorbAmount;
                }

                // Keep values within sane bounds
                cell.humidity = Math.max(0, cell.humidity);
                cell.clouds = Math.max(0, Math.min(cell.clouds, 5.0));
            }
        }
    },

    // --- 4. FLUID DYNAMICS (WIND) ---
    processWindAdvection: function(world) {
        // Create a temporary buffer so we don't overwrite data mid-calculation
        let nextClouds = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));
        let nextHumidity = Array(world.cols).fill(0).map(() => Array(world.rows).fill(0));

        // First, copy the current state to the buffer
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                nextClouds[i][j] = world.grid[i][j].clouds;
                nextHumidity[i][j] = world.grid[i][j].humidity;
            }
        }

        // Push clouds and humidity to neighboring cells based on wind
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];
                
                // Simple Global Wind: Blowing West to East (left to right)
                // We subtract surfaceFriction so the wind slows down over land/mountains!
                let windSpeed = 0.8 - cell.surfaceFriction; 
                windSpeed = Math.max(0.05, windSpeed); // Ensure it never fully stops

                // Calculate destination cell index (wrap around map like a globe)
                let destI = (i + 1) % world.cols; 

                // Calculate how much stuff to move (percentage of current cell contents)
                let transferRate = windSpeed * 0.4; 
                let cloudTransfer = cell.clouds * transferRate;
                let humidityTransfer = cell.humidity * transferRate;

                // Deduct from current cell
                nextClouds[i][j] -= cloudTransfer;
                nextHumidity[i][j] -= humidityTransfer;

                // Add to neighbor cell to the East
                nextClouds[destI][j] += cloudTransfer;
                nextHumidity[destI][j] += humidityTransfer;
            }
        }

        // Apply the moved buffer data back to the live world grid
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                world.grid[i][j].clouds = Math.max(0, nextClouds[i][j]);
                world.grid[i][j].humidity = Math.max(0, nextHumidity[i][j]);
            }
        }
    }
};
