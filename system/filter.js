drawComposite: function(ctx, cell, x, y, cellSize) {
        // 1. Draw the solid terrain base
        ctx.fillStyle = this.getTerrainColor(cell);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // 2. Overlay current temperature shifts (Radar style, kept subtle)
        const tempIntensity = Math.max(0, Math.min(255, Math.floor((cell.temperature / 30) * 255)));
        ctx.fillStyle = `rgba(${tempIntensity}, 50, ${255 - tempIntensity}, 0.05)`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // 3. CLOUD OVERLAY (Continental Scale)
        // We raised the threshold slightly (> 0.1) so ultra-thin vapor is invisible, 
        // creating more broken, scattered cloud covers.
        if (cell.clouds > 0.1) { 
            // Scale the cloud to be smaller than the cell itself
            const sizeRatio = Math.min(0.85, cell.clouds * 0.2); 
            const cloudSize = cellSize * sizeRatio;
            
            // Calculate offset to keep the cloud centered in its cell
            const offset = (cellSize - cloudSize) / 2;

            const cloudOpacity = Math.min(0.9, cell.clouds * 0.25);
            ctx.fillStyle = `rgba(255, 255, 255, ${cloudOpacity})`;
            
            // Draw the scaled-down cloud
            ctx.fillRect((x * cellSize) + offset, (y * cellSize) + offset, cloudSize, cloudSize);
        }
    },
