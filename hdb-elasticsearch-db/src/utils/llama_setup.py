import os
from transformers import AutoTokenizer, AutoModelForCausalLM

"""
Python File to download Llama2-7b locally

Note: 
To download LLama2-7b from hugging face, you require access from meta.
Once you have gotten access, please retrieve an authentication key from your own hugging face account.

Get access here: https://huggingface.co/meta-llama/Llama-2-7b

Authentication key should be in your .env file
"""

def setup_llama(model_directory:str='../src/llama/model', tokenizer_directory:str='../src/llama/tokenizer'):
    """
    Function to download llama2 7b model

    Args:
        model_directory (str): directory to the path with llama model, defaults to ../src/llama/model'
        tokenizer_directory (str): directory to the path with llama tokenizer, defaults to ../src/llama/tokenizer'

    Returns:
        0 for success and 1 for failure
    """
    hg_access_token = os.getenv('HG_ACCESS_TOKEN')
    if len(hg_access_token) <=0:
        print("No valid access key found, did you update your .env file?")
        return 1

    if not os.path.isdir(model_directory):
        os.makedirs(model_directory) 
        print("Llama Model directory not found, directory created")

    if not os.path.isdir(tokenizer_directory):
        os.makedirs(tokenizer_directory) 
        print("Llama tokenizer directory not found, directory created")

    print("Preparing to download LLama")

    try:
        llm_model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-2-7b-chat-hf', token=hg_access_token)
        llm_model.save_pretrained(model_directory)
        print("LLama Model downloaded")

        llm_tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-2-7b-chat-hf', token=hg_access_token)
        llm_tokenizer.save_pretrained(tokenizer_directory)
        print("LLama Tokenizer downloaded")
        return 0

    except Exception as e:
        print(f"Failed to download Llama, error: {e}")
        return 1


if __name__ == "__main__":
    setup_llama()