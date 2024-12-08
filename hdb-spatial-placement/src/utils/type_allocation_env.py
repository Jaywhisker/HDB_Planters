# Imports
import numpy as np
import matplotlib.pyplot as plt

from scipy.spatial.distance import cdist
from scipy.ndimage import distance_transform_edt
from scipy.ndimage import label, center_of_mass

import gymnasium as gym
from gymnasium import spaces

from src.utils.procedural_generation_env import proceduralGeneratedEnv

class plantTypeAllocationEnv(gym.Env):
    def __init__(self, octave:float, theme:int, seed:int=None, grid_size:tuple=(100,100)):
        """
        Environment Class for Plant Type Allocation Model
        Assign each planting coordinate to be either a Tree, Shrub or do not plant
        
        Args:
            octave (float): octave value from range [1-2] for perlin noise
            theme (int): either 0 or 1, 0 for road while 1 for walkway
            seed (int, optional): environment seed to recreate the same environment. Defaults to None.
            grid_size (tuple, optional): (w,h) of environment grid. Defaults to (100,100).
        """
        super(plantTypeAllocationEnv, self).__init__()

        # Step for environment termination
        self.current_step = 0
        self.max_step = 250

        # Base Variables
        self.minimum_distance = 10
        self.tree_distance = 50
        self.padded_boundary = 5
        self.contour_distance = 5

        # Grid variables
        self.theme = theme
        self.seed = seed
        self.grid_size = grid_size

        # Create environment grid
        self.maximum_planting_spots = ((self.grid_size[0] - 2*self.padded_boundary)//self.minimum_distance + 1)**2
        self.env = proceduralGeneratedEnv(octave, seed, grid_size, self.minimum_distance, self.padded_boundary)
        self.boundary, self.filled_boundary, self.grid, self.planting_coordinates = self.env.create_environment()

        # Class Data
        # In y,x coordinates, need to be modified
        self.coordinates = {
            "Tree": [],
            "Shrubs" : []
        }
        self.class_count = {0:0, 1:0, 2:0}
        self.class_density = {0:0.0, 1:0.0, 2:0.0}

        # Generate embedded coordinates & result grid
        self.result_grid = np.full(((self.maximum_planting_spots), 3), -1, dtype=np.float32)
        self.embeded_planting_coords = self._embed_coordinates()

        # Observation and Action Space
        self.observation_space = spaces.Box(low=-1, high=100, shape=(self.maximum_planting_spots, 3), dtype=np.float32)
        self.action_space = spaces.MultiDiscrete([self.maximum_planting_spots, 3])

    def _embed_coordinates(self):
        """
        Function to convert planting coordinates into their respective embedding
        [xCoord, yCoord, coordDistance, nearCurve, remainingPlantableTrees, originalTreeScore, finalTreeScore, shrubScore, naScore]
        Pad the remaining planting coordintes to ensure they remain a fixed length for the environment
        Padded data has (-1,-1,-1,-1,-1,-1,-1,-1,-1)

        Returns:
            embed_planting_list (np.ndarray): Numpy array of all embeded planting cordinates and padded coordinates 
        """
        # Padded
        embed_planting_list = np.full(((self.maximum_planting_spots), 9), -1, dtype=np.float32)  # Initialize with (-1, -1, ...)
        curve_data = []

        # Get the distance from the boundary, used to measure if near curves
        distance_from_boundary_grid = distance_transform_edt(self.filled_boundary)

        if self.theme == 0:
            # Road
            grid_distance  = self._distance_from_centre()
        else:
            # Walkway
            grid_distance =  distance_from_boundary_grid

        # Minimum distance before can plant tree
        min_tree_distance = (grid_distance.max() -  grid_distance.min())*0.3 + grid_distance.min()

        # Update ratio, leave the rest padded
        for i, planting_coords in enumerate(self.planting_coordinates): #planting coords is (y,x)
            # Retrieve the coordinate distance & the contour line it lies on
            contour, coord_dist = self._get_contour(grid_distance, planting_coords[1], planting_coords[0])
            # Retrieve the coordinate distance & contour line from the boundary
            if self.theme == 0:
                border_contour, border_dist = self._get_contour(distance_from_boundary_grid, planting_coords[1], planting_coords[0])
            else:
                border_contour, border_dist = contour, coord_dist
            curve_data.append([border_contour, border_dist])
            # Retrieve all remaining plantable trees after planting for this coordinate
            remaining_plantable_trees = self._get_remaining_plantable_tree_count(planting_coords[1], planting_coords[0])

            # Calculating the tree, shrub and NA scores
            tree_score = 2 if coord_dist >= min_tree_distance else -1 # Unplantable
            shrub_score = 2 
            na_score = 1 
            if self.theme == 0:
                # Road, shrub should be near center and not near boundary
                if border_contour <= 1:
                    shrub_score = 0
                    na_score = 3
                elif coord_dist <= min_tree_distance:
                    shrub_score = 3
            else:
                # Walkway, shrub is closer to boundary
                if border_contour <= 2:
                    shrub_score = 3
                    na_score = 0 

            # Update embeddings
            embed_planting_list[i] = (planting_coords[1], planting_coords[0], round(coord_dist), border_dist, remaining_plantable_trees, tree_score, tree_score, shrub_score, na_score)

        # Calculate near curve (the idea behind it is if they are in the same contour line and distance, )
        unique_contours, indices, counts = np.unique(np.array(curve_data), axis=0, return_inverse=True, return_counts=True)
        # Duplicated length likely to be at straight line
        is_duplicate = counts[indices] > 1
        # Update near Curve
        embed_planting_list[:len(self.planting_coordinates), 3] = np.where(is_duplicate, 0, 1)
        
        # Update tree score, if near curve and tree score becomes 2 -> 3
        embed_planting_list[(embed_planting_list[:, 3] == 1) & (embed_planting_list[:, 5] == 2), 5] = 3
        # Sum the tree plantable & maximum plantable trees together
        embed_planting_list[:, 6] = np.where(
            embed_planting_list[:, 6] != -1,  # Condition: 6th index is not -
            embed_planting_list[:, 4] + embed_planting_list[:, 5],  # Valid log operation
            embed_planting_list[:, 6]  # Remains unchanged if 6th index is -1
        )
        
        self.result_grid = embed_planting_list[:, 6:]

        return embed_planting_list.astype(np.int64)

    def _distance_from_centre(self):
        """
        Function to create a numpy grid with each grid being the distance from the centre of planting grid

        Returns:
            distance_from_center (np.ndarray): Array with the distance from centre
        """
        # Retrieve the labels and number of features (either 0 or 1)
        labeled_array, num_features = label(self.filled_boundary)
        # Prepare an array to store distances from the center of each area
        distance_from_center = np.zeros_like(self.filled_boundary, dtype=float)

        # For each labeled component, calculate distances from the centroid
        for label_num in range(1, num_features + 1):
            # Find the centroid of the current component
            centroid = center_of_mass(self.filled_boundary, labeled_array, label_num)
            # Create a mask for the current component
            mask = labeled_array == label_num
            # Get the coordinates of points in the current component
            coords = np.argwhere(mask)
            # Calculate distances from the centroid for each point in the component with elucidean distance
            for coord in coords:
                distance = np.sqrt((coord[0] - centroid[0])**2 + (coord[1] - centroid[1])**2)
                distance_from_center[tuple(coord)] = distance

        return distance_from_center

    def _get_contour(self, grid_distance:np.ndarray, xcoord:int, ycoord:int):
        """
        Function to retrieve the distance of a coordinate from the grid distance and the contour it belongs to

        Args:
            grid_distance (np.ndarray): numpy array with each coordinate showing the distance
            xcoord (int): x coordinate
            ycoord (int): y coordinate

        Returns:
            chosen_contour (int): contour coordinate belongs to
            coordinate_distance (float): distance of coordinate based off grid_distance
        """
        coordinate_distance = grid_distance[ycoord, xcoord]
        # Find the closest contour
        chosen_contour = coordinate_distance//self.contour_distance + (1 if coordinate_distance%self.contour_distance > self.contour_distance/2 else 0) 
        return chosen_contour, coordinate_distance

    def _get_remaining_plantable_tree_count(self, xcoord:int, ycoord:int):
        """
        Function to retrieve the log number of remaining plantable trees that are self.tree_distance away from coordinate

        Args:
            xcoord (int):  x coordinate
            ycoord (int): y coordinate
        """
        # Get all current tree coordinates
        new_tree_coordinates = np.array(self.coordinates['Tree'] + [[ycoord, xcoord]])
        # Calculate the distance of all planting coordinates from existing tree coordinates
        coordinate_distances = cdist(self.planting_coordinates, new_tree_coordinates, metric='euclidean')
        min_distances = np.min(coordinate_distances, axis=1)
        # Return all counts where the min_distance > self.tree_distances
        return np.log(np.sum(min_distances >= 50)) if np.sum(min_distances >= self.tree_distance) > 0 else 0
        
    # RL model environment setup
    def _get_observation(self):
        return self.result_grid
    
    def reset(self, seed=None, options=None):
        """
        Reset environment
        """
        self.current_step = 0
        self.coordinates = {
                    "Tree": [],
                    "Shrubs" : []
                }        
        self.class_count = {0:0, 1:0, 2:0}
        self.class_density = {0:0.0, 1:0.0, 2:0.0}
        self.boundary, self.filled_boundary, self.grid, self.planting_coordinates = self.env.create_environment()
        self.result_grid = np.full(((self.maximum_planting_spots), 3), -1, dtype=np.float32)
        self.embeded_planting_coords = self._embed_coordinates()
        return self._get_observation() , {}
    
    def step(self, action):

        self.current_step +=  1
        reward = 0
        
        # Decode action
        chosen_index = action[0]
        class_value = action[1]
        chosen_value = self.embeded_planting_coords[chosen_index]

        reward = self.result_grid[chosen_index, class_value]

        if reward >= 0:
            # Update coordinate values
            if class_value == 0:
                self.coordinates['Tree'].append((chosen_value[1], chosen_value[0]))
                self._update_tree_distance()   

            elif class_value == 1:
                self.coordinates['Shrubs'].append((chosen_value[1], chosen_value[0]))

            # Update grid
            self.grid[chosen_value[1], chosen_value[0]] = class_value + 2
            self.class_count[class_value] += 1
            # Update result grid
            self.result_grid[chosen_index, :] = -1
            self._update_density_reward()
        
        done = bool(np.all(np.isin(self.result_grid[:, -1], [-1]))) or self.current_step >= self.max_step
        return self._get_observation(), float(reward), done ,False, {}
    
    def _update_tree_distance(self):
        """
        Function to update which coordinates are now no longer plantable after planting a new tree coordinate
        """
        tree_coordinates = np.array(self.coordinates['Tree'])
        # Get distance from all planting coordinates to all tree coordinates
        coordinate_distances = cdist(self.planting_coordinates, tree_coordinates, metric='euclidean')
        min_distances = np.min(coordinate_distances, axis=1)

        for index, dist in enumerate(min_distances):
            if dist < self.tree_distance:
                # No longer plantable
                # Update embedded_coordinates and result grid
                self.embeded_planting_coords[index][-4] = -1
                self.result_grid[index][0] = -1

        # Recalculate all new possible maximum tree planted after the tree coordinate update
        for index, result_row in enumerate(self.result_grid):
            if result_row[0] != -1:
                remaining_plantable_trees = self._get_remaining_plantable_tree_count(self.embeded_planting_coords[index][0], self.embeded_planting_coords[index][1])
                result_row[0] = remaining_plantable_trees + self.embeded_planting_coords[index][5] # Original Tree Score + new log(Max trees)
    
    def _update_density_reward(self):
        """
        Function to calculate the density reward
        """
        total_count = sum(self.class_count.values())
        for class_num in self.class_density.keys():
            density = self.class_count[class_num] / total_count
            self.class_density[class_num] = density

        # Shrub, NA ratio
        density_ratios = [0.65, 0.35]
        
        for index, class_index in enumerate([1, 2]):
            mask = self.result_grid[:, class_index] != -1  # Create a mask for values not equal to -1
            # Shrub is -2 in normalised_planting_list, NA is -1, class index is 1 and 2 so -3+classindex
            self.result_grid[mask, class_index] = self.embeded_planting_coords[mask, (-3+class_index)]*(np.exp(-(self.class_density[class_index])/density_ratios[index])**3)  # Apply exponential function
    
    def retrieve_results(self):
        """
        Function the returns the coordinates and numpy grid of the map
        Map index:
        {
        0: surrounding
        1: planting areas
        2: trees
        3: shrub 
        }

        Returns:
            theme (int): 0 for road, 1 for walkway
            grid (np.npdarray): numpy array of the updated grid with planted coordinates
            coordinates (dict): dictionary of {Tree: [], Shrubs:[]} with all the coordinates
        """
        # Swap the (y,x) to (x,y) coordinates
        updated_coordinates = {key: [(x, y) for y, x in value] for key, value in self.coordinates.items()}
        updated_grid = self.filled_boundary.copy()
        # Append the correct coordinates to the grid
        for key, coordinates in updated_coordinates.items():
            for x, y in coordinates:
                # Set the value at the given (x, y) position in the array
                updated_grid[y, x] = 2 if key=='Tree' else 3
                
        return self.theme, updated_grid, updated_coordinates
    
    def render(self, only_plant:bool=False, show_coord:bool=False):
        """
        Function to render the grid

        Args:
            only_plant (bool, optional): Show only planted spots, NA is not shown. Defaults to False.
            show_coord (bool, optional): Show reward values. Defaults to False.
        """
        value_to_colour_all = {
            0: (169/255, 169/255, 169/255),
            1: (1, 0, 0),
            2: (0, 51/255, 25/255),
            3: (0, 204/255, 0),
            4: (0/255, 204/255, 204/255),
            5: (204/255, 255/255, 229/255)
        }

        value_to_colour_plant={
            0: (169/255, 169/255, 169/255),
            1: (204/255, 255/255, 229/255),
            2: (0, 51/255, 25/255),
            3: (0, 204/255, 0),
            4: (204/255, 255/255, 229/255),
            5: (204/255, 255/255, 229/255)
        }
        
        value_to_colour = value_to_colour_plant if only_plant else value_to_colour_all

        img = np.zeros((100, 100, 3))
        for value, color in value_to_colour.items():
            img[self.grid == value] = color
        
        img[(self.filled_boundary == 1) & (self.grid == 0)] = value_to_colour[5]

        if show_coord:
            plt.figure(figsize=(12, 12))

            # Plot each coordinate and label them with [a,b]
            for i, coord in enumerate(self.normalised_planting_list):
                x, y, d, nc, d2, d3, tp, sp, nap= coord
                ts,ss,nas = self.result_grid[i]
                if x == -1:
                    pass
                else:
                    # Add 0.5 to place text in the center of the cell
                    plt.text(x, y, f"{ts,ss,nas}", color="black", fontsize=6, ha="center", va="center", backgroundcolor='white')


        plt.imshow(img)  # Set origin to lower to align with the grid's coordinate syste
        # Add legend
        handles = [plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=np.array(color), markersize=10) for color in value_to_colour.values()]
        labels = list(value_to_colour.keys())
        plt.legend(handles, labels, title='Legend', bbox_to_anchor=(1.05, 1), loc='upper left')

        plt.show()

if __name__ == "__main__":
    pass