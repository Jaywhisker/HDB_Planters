# Python file to train RL Plant Allocation model
import gc
import os
import logging
import random
import argparse

from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.env_checker import check_env
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import EvalCallback

from src.utils.type_allocation_env import plantTypeAllocationEnv

def parse_arguments():
    """
    Function defining all arguments for the data
    """
    parser = argparse.ArgumentParser(description="Training script for the RL model.")
    
    # Define the arguments
    parser.add_argument('--num_steps', type=int, default=10, help='How many steps before policy updates')
    parser.add_argument('--num_env', type=int, default=50, help='Number of environments to use in training')
    parser.add_argument('--num_run', type=int, default=10000, help='Number of policy updates to run in training')
    parser.add_argument('--model_name', type=str, default='plantTypeAllocationModel.zip', help='Name to save zip file as. Defaults to plantTypeAllocationModel.zip' )

    return parser.parse_args()


def make_env(env):
    """
    Function to generate multiple environments if required (for procedural generation)

    Args:
        env (plantTypeAllocationEnv): model environment
    """
    def _init():
        return env
    return _init


def train_model(model:PPO, max_run:int, n_steps:int, model_path:str, call_back=None, progress_bar:bool=True):
    """
    Function to train model

    Args:
        model (PPO): PPO model
        max_run (int): total number of policy updates model should take
        n_steps (int): n_steps for each policy update
        model_path (str): model path to save model after training
        call_back (optional): callback for model. Defaults to None.
        progress_bar (bool, optional): Show training progress bar. Defaults to True.
    """
    # Calculate total timesteps
    total_timesteps = max_run*n_steps
    # Train model
    model.learn(total_timesteps=total_timesteps, progress_bar=progress_bar, callback=call_back)
    # Save model
    model.save(model_path)
    print(f"Model saved to {model_path}.")


def main():
    args = parse_arguments()

    # Accessing the arguments
    n_steps = args.num_steps
    n_env = args.num_env
    max_run = args.num_run
    model_name = args.model_name

    # Setup Logger
    logging.basicConfig(
        filename= os.path.join('src/logs', 'training.log'),
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        filemode='w'
    )

    # Create environment
    logging.info("Training Plant Type Allocation Model")
    logging.info("Checking environment")
    test = plantTypeAllocationEnv(random.uniform(1,2), 0)
    check_env(test)
    envs = DummyVecEnv([make_env(plantTypeAllocationEnv(random.uniform(1,2), 0)) for env in range(n_env)])
    eval_env = plantTypeAllocationEnv(random.uniform(1,2), random.randint(0,1), random.randint(0,50))

    logging.info("Successfully created environment, creating model")
    # Create Model
    gc.collect()
    model = PPO("MlpPolicy", 
                envs, 
                n_steps= n_steps,
                n_epochs= 10,
                batch_size= n_steps * n_env,
                verbose=0,
                tensorboard_log="./src/logs/tensorboard/")
    
    eval_callback = EvalCallback(eval_env, best_model_save_path="./src/models/",
                            log_path="./src/logs/", eval_freq=10000,
                            deterministic=True, render=False)
    # Train model
    logging.info("Successfully created model, starting training")
    train_model(model, max_run, n_steps, f'./src/models/{model_name}', eval_callback)
    logging.info(f"Training Completed, Model saved in ./src/models/{model_name}")


if __name__ == "__main__":
    main()