/**
 * Weather System Storm Logic
 * Evaluates the grid to spawn, grow, and dissipate storms based on atmospheric instability.
 */
const StormSystem = {
    update: function(grid, cols, rows) {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                let cell = grid[i][j];

                // 1. Initialize storm properties safely if they don't exist yet
                if (cell.precipitation === undefined) cell.precipitation = 0;
                if (cell.lightning === undefined) cell.lightning = 0;

                // 2. Calculate Instability (The fuel for storms)
                // Hot air + high moisture + existing condensation = boom.
                // We divide temperature by 40 to normalize it a bit for the math.
                let instability = Math.max(0, (cell.temperature / 40)) * cell.humidity * cell.clouds;

                // 3. Storm Trigger!
                if (instability > 0.35) { // Threshold for storm formation
                    // Build up rain
                    cell.precipitation = Math.min(1.0, cell.precipitation + 0.1);
                    
                    // Chance for a lightning strike based on how intense the storm is
                    if (Math.random() < instability * 0.08) {
                        cell.lightning = 1.0; 
                    }
                } else {
                    // Dissipate rain if conditions drop below the threshold
                    cell.precipitation = Math.max(0, cell.precipitation - 0.05);
                }

                // 4. Fade lightning very quickly (it's just a flash!)
                if (cell.lightning > 0) {
                    cell.lightning = Math.max(0, cell.lightning - 0.2);
                }

                // 5. The Downdraft (Physics feedback loop)
                // Rain cools the air and rips moisture out of the sky. 
                // This prevents storms from lasting forever in one spot.
                if (cell.precipitation > 0) {
                    cell.temperature -= cell.precipitation * 0.5; // Evaporative cooling
                    cell.clouds = Math.max(0, cell.clouds - (cell.precipitation * 0.05)); // Rain depletes the cloud
                }
            }
        }
    }
};
