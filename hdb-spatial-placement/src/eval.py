# Python file to train RL Plant Allocation model
import gc
import os
import logging
import random
import argparse

from stable_baselines3 import PPO

from src.utils.type_allocation_env import plantTypeAllocationEnv

def parse_arguments():
    """
    Function defining all arguments for the data
    """
    parser = argparse.ArgumentParser(description="Training script for the RL model.")
    
    # Define the arguments
    parser.add_argument('--model_name', type=str, default='plantTypeAllocationModel.zip', help='Zip File model name, defaults to plantTypeAllocationModel.zip')
    parser.add_argument('--model_folder', type=str, default='./src/models/', help='Folder path to model, defaults to ./src/models')
    parser.add_argument('--environment_octave', type=float, default=None, help='Environment octave for perlin noise, float range within 1 to 2, defaults to None (randomly create environment).')
    parser.add_argument('--environment_seed', type=int, default=None, help='Environment seed for perlin noise, defaults to None (randomly create environment).')
    parser.add_argument('--environment_context', type=int, default=0, help='Environment context, 0 for Road and 1 for Walkway. Defaults to 0.')


    return parser.parse_args()


def eval_model(model:PPO, eval_env:plantTypeAllocationEnv, show_results:bool=True, return_results:bool=True):
    """
    Function to evaluate model onto a defined environment

    Args:
        model (PPO): trained PPO model
        eval_env: environment to evaluate model on
        show_results (bool, optional): Render final grid. Defaults to True.
        return_results (bool, optional): Return the results (call environment.retrieve_results()). Defaults to True.
    """
    obs, info = eval_env.reset()
    total_reward = 0

    for i in range(eval_env.max_step):
        # Get action from the model
        action, _ = model.predict(obs)  # Get the predicted action
        obs, reward, done, trunacted, info = eval_env.step(action)  # Step the environment
        total_reward += reward  # Accumulate rewards

        if done:
            break

    print(f"Model completed in {i} steps, total reward {total_reward}")
    if show_results:
        eval_env.render(True)
    if return_results:
        return eval_env.retrieve_results()



def main():
    args = parse_arguments()

    # Accessing the arguments
    model_name = args.model_name
    model_folder = args.model_folder
    octave = random.uniform(1, 2) if args.environment_octave is None else args.environment_octave
    seed = random.uniform(0, 50) if args.environment_seed is None else args.environment_seed
    context = args.environment_context

    model_path = os.path.join(model_folder, model_name)

    # Setup Logger
    logging.basicConfig(
        filename= os.path.join('src/logs', 'eval.log'),
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        filemode='w'
    )

    # Create environment
    logging.info(f"Checking environment, selected octave: {octave},  seed: {seed} and context: {'Road' if context == 0 else 'Walkway'}")
    eval_env = plantTypeAllocationEnv(octave, context, seed)

    logging.info(f"Successfully created environment, loading model from {model_path}")
    # Create Model
    gc.collect()
    model = PPO.load(model_path)
    # Train model
    logging.info("Successfully loaded model, starting evaluation")
    theme, grid, coordinates = eval_model(model, eval_env)
    logging.info(f"Evaluation completed.")
    logging.info(coordinates)


if __name__ == "__main__":
    main()