# Imports
import numpy as np
import random
import cv2
from perlin_noise import PerlinNoise
from scipy.spatial.distance import cdist

class proceduralGeneratedEnv():
    def __init__(self, octave:float, seed:int, grid_size:tuple, minimum_distance:int, padded_boundary:int):
        """
        Class to randomly generate an environment using perlin noise and dithering

        Args:
            octave (float): octave value from range [1-2] for perlin noise
            seed (int, optional): environment seed to recreate the same environment. Defaults to None.
            grid_size (tuple, optional): (w,h) of environment grid. Defaults to (100,100).
            minimum_distance (int): minimum distance between 2 planting coordinate
            padded_boundary (int): padded distance around the corners that will have no planting coordinate
        """
        self.octave = octave
        self.seed = seed
        self.grid_size = grid_size
        self.minimum_distance = minimum_distance
        self.padded_boundary = padded_boundary

    def create_environment(self):
        """
        Function to create an environment
        Runs perlin noise, dithers
        Ensure that at least 7.5% is plantable (if random seed)
        Filters to ensure self.min_distance grid between all coordinates

        Returns:
            boundary_grid (np.ndarray): self.grid_size grid of 0 and 1 for planting boundary
            filled_boundary_grid (np.ndarray): self.grid_size grid of 0 and 1 for planting area (entire environment)
            planting_grid (np.ndarray): self.grid_size grid of 0 for background and 1 for plantable coordinates (just the spot)
            planting_coord (np.ndarray): (1, num_planting_coord) numpy array of all planting coordinates in (y,x) 
        """ 
        while True:
            noise = PerlinNoise(octaves=self.octave, seed= self.seed if self.seed is not None else random.randint(0,50))
            width, height = self.grid_size

            # Create environment and dither 
            perlin_env = np.array([[noise([i/height, j/width]) for j in range(width)] for i in range(height)])
            # Adding boundary to ensure that the values are 1 for the boundary removal
            perlin_env[:self.padded_boundary, :] = 1 # Top boundary
            perlin_env[-self.padded_boundary:, :] = 1 # Bottom boundary
            perlin_env[:, :self.padded_boundary] = 1 # Left boundary
            perlin_env[:, -self.padded_boundary:] = 1 # Right boundary

            # Dither environment
            dithered_perlin_env = self._dither_environment(perlin_env)

            # Retrieve all planting positions
            planting_positions = np.argwhere(dithered_perlin_env == 1)
            
            # Non pre-set seed, check to ensure 7.5% must be plantable, else ignore
            if self.seed != None or len(planting_positions) / len(dithered_perlin_env.flatten()) > 7.5/100:
                break

        boundary_grid, filled_boundary_grid = self._extract_boundary(perlin_env)
        planting_grid, planting_coords  = self._filter_planting_coords(planting_positions)

        return boundary_grid.astype(np.int64), filled_boundary_grid.astype(np.int64), planting_grid.astype(np.int64), planting_coords
    
    def _dither_environment(self, perlin_env:np.ndarray):
        """
        Function to dither perlin environment using bayer matrix
        
        Args:
            perlin_env (np.ndarray): self.grid_size numpy array with random noise from perlin

        Returns:
            dithered_grid (np.ndarray): self.grid_size grid of 0 for unplantable and 1 for plantable
        """
        # 4x4 Normalised Bayer matrix
        bayer_matrix = np.array([
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5]
        ]) / 16.0  # Normalisation

        # Dither with Bayer Matrix
        bayer_tile_size = bayer_matrix.shape[0]  # Size of the Bayer matrix (4x4)
        dithered_grid = np.zeros_like(perlin_env)
        width, height = self.grid_size

        # Apply Bayer matrix
        for y in range(height):
            for x in range(width):
                # Ensure that padded boundary is actually 0 instead of 1
                if y <= self.padded_boundary or y >= height - self.padded_boundary:
                    dithered_grid[y, x] = 0
                
                elif x <= self.padded_boundary or x >= width - self.padded_boundary:
                    dithered_grid[y, x] = 0

                else:
                    bayer_value = bayer_matrix[y % bayer_tile_size, x % bayer_tile_size]
                    dithered_grid[y, x] = 1 if perlin_env[y, x] > bayer_value else 0
            
        return dithered_grid
    
    def _extract_boundary(self, perlin_grid:np.ndarray):
        """
        Funtion to extract the boundary of the dithered_grid (boundary)

        Args:
            perlin_grid (np.ndarray): Perlin noise grid
        
        Returns:
            boundary_grid (np.ndarray): self.grid_size grid of 0 and 1 for planting boundary
            filled_boundary_grid (np.ndarray): self.grid_size grid of 0 and 1 for planting area (entire environment)
        """
        # Normalised to uint before adding a threshold from 128 to 255 (0.5 float pixel and above)
        normalised_grid = (perlin_grid * 255).astype(np.uint8)
        _, thresh = cv2.threshold(normalised_grid, 128, 255, cv2.THRESH_BINARY) 
        
        # Invert the thresholded image, so border is around the white part, planting area
        thresh_inverted = cv2.bitwise_not(thresh)

        # For dilating, expanding the points so that they form a nice boundary blob
        kernel = np.ones((3,3), np.uint8) 
        dilate_image = cv2.dilate(thresh_inverted, kernel, iterations=2)

        # Find contours on flood filled image for outline
        contours, _ = cv2.findContours(dilate_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
        boundary_grid = np.zeros(self.grid_size)
        filled_boundary_grid = np.zeros(self.grid_size)

        # Draw contours
        cv2.drawContours(boundary_grid, contours, -1, (1), thickness=1)
        # Draw and colour contours
        cv2.fillPoly(filled_boundary_grid, contours, [1,1,1])

        return boundary_grid, filled_boundary_grid
    
    def _filter_planting_coords(self, planting_positions:np.ndarray):
        """
        Function to remove close coordinates, ensuring all coordinates are at least self.minimum_distance apart
        
        Args:
            planting_positions (np.ndarray): numpy array of all plantable coordinates from dithering algorithm

        Returns:
            final_grid (np.ndarray): self.grid_size grid of 0 for unplantable and 1 for plantable
            final_planting_coordinates (np.ndarray): (1, num_planting_coord) numpy array        
        """
        filtered_planting_positions = planting_positions.copy()
        
        # Calculate elucidean distance between coordinates
        distances = cdist(filtered_planting_positions, filtered_planting_positions)

        # Keep a numpy array of all filtered position and assume is true
        # numpy mask
        keep_array = np.ones(len(filtered_planting_positions), dtype=bool)

        # Check for points that are too close
        for i in range(len(filtered_planting_positions)):
            # Only consider points that haven't been removed
            if keep_array[i]:  
                for j in range(i + 1, len(filtered_planting_positions)):
                    if distances[i, j] < self.minimum_distance:
                        # Remove the second point if it's too close
                        keep_array[j] = False

        # Apply mask to remove coordinates that are too close
        final_planting_coordinates = filtered_planting_positions[keep_array]
        
        # Final grid (All 0s)
        final_grid = np.zeros(self.grid_size)
        
        # Update grid with planting position
        for coordinates in final_planting_coordinates:
            final_grid[coordinates[0], coordinates[1]] = 1
        
        return final_grid, final_planting_coordinates    