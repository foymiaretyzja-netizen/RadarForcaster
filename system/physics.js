/**
 * Atmospheric Physics Engine
 * Handles thermodynamics, fluid dynamics, and cloud lifecycles.
 */
const PhysicsEngine = {
    
    update: function(world) {
        this.processThermodynamics(world);
        // We will add this.processWindAdvection(world) here next!
    },

    processThermodynamics: function(world) {
        for (let i = 0; i < world.cols; i++) {
            for (let j = 0; j < world.rows; j++) {
                let cell = world.grid[i][j];

                // --- 1. EVAPORATION ---
                // If over water (elevation < 0.45) and warm enough, add to invisible humidity
                if (cell.elevation < 0.45 && cell.temperature > 10) {
                    let evapRate = (cell.temperature - 10) * 0.002;
                    cell.humidity += evapRate;
                }

                // --- 2. CONDENSATION (Cloud Formation) ---
                // Calculate how much water the air can hold. 
                // Warm air holds a lot; cold air holds very little.
                let maxHumidityCapacity = Math.max(0.1, cell.temperature * 0.08);

                // If humidity exceeds capacity, it condenses into visible clouds
                if (cell.humidity > maxHumidityCapacity) {
                    let excessVapor = cell.humidity - maxHumidityCapacity;
                    
                    // Vapor becomes cloud
                    cell.clouds += excessVapor; 
                    
                    // Air is maxed out
                    cell.humidity = maxHumidityCapacity; 
                }

                // --- 3. DISSIPATION ---
                // If the air is dry and warm, clouds evaporate back into invisible vapor
                if (cell.clouds > 0 && cell.humidity < maxHumidityCapacity) {
                    let absorbAmount = Math.min(cell.clouds, (maxHumidityCapacity - cell.humidity) * 0.05);
                    cell.clouds -= absorbAmount;
                    cell.humidity += absorbAmount;
                }

                // --- HOUSEKEEPING ---
                // Keep values within sane bounds for the simulation
                cell.humidity = Math.max(0, cell.humidity);
                cell.clouds = Math.max(0, Math.min(cell.clouds, 5.0)); // Cap max cloud density
            }
        }
    }
};
