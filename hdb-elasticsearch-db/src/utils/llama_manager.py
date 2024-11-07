import os
import torch
import json
from transformers import AutoTokenizer, AutoModelForCausalLM, GenerationConfig

"""
Python File for Llama2-7b prompt and data cleaning class
By default the class expects an authentication key in .env file

If you want to locally host Llama2, please run llama_setup.py and update the LlamaModel with the filepaths

Note: 
To download LLama2-7b from hugging face, you require access from meta.
Once you have gotten access, please retrieve an authentication key from your own hugging face account.

Get access here: https://huggingface.co/meta-llama/Llama-2-7b
"""
class PromptTemplate:

    """
    Class to generate prompt template for Llama2-7b
    """
    system_prompt = None
    user_messages = []
    model_replies = []

    def __init__(self, system_prompt=None):
        self.system_prompt = system_prompt

    def add_user_message(self, message: str, return_prompt=True):
        self.user_messages.append(message)
        if return_prompt:
            return self.build_prompt()

    def add_model_reply(self, reply: str, includes_history=True, return_reply=True):
        reply_ = reply.replace(self.build_prompt(), "") if includes_history else reply
        self.model_replies.append(reply_)
        if len(self.user_messages) != len(self.model_replies):
            raise ValueError(
                "Number of user messages does not equal number of system replies."
            )
        if return_reply:
            return reply_

    def get_user_messages(self, strip=True):
        return [x.strip() for x in self.user_messages] if strip else self.user_messages

    def get_model_replies(self, strip=True):
        return [x.strip() for x in self.model_replies] if strip else self.model_replies

    def clear_chat_history(self):
        self.user_messages.clear()
        self.model_replies.clear()

    def build_prompt(self):
        if self.user_messages == [] and self.model_replies == []:
            return f"<s>[INST] <<SYS>>\n{self.system_prompt}\n<</SYS>> [/INST]</s>"
        
        elif len(self.user_messages) != len(self.model_replies) + 1:
            raise ValueError(
                "Error: Expected len(user_messages) = len(model_replies) + 1. Add a new user message!"
            )

        if self.system_prompt is not None:
            SYS = f"[INST] <<SYS>>\n{self.system_prompt}\n<</SYS>>"
        else:
            SYS = ""

        CONVO = ""
        SYS = "<s>" + SYS
        for i in range(len(self.user_messages) - 1):
            user_message, model_reply = self.user_messages[i], self.model_replies[i]
            conversation_ = f"{user_message} [/INST] {model_reply} </s>"
            if i != 0:
                conversation_ = "[INST] " + conversation_
            CONVO += conversation_

        CONVO += f"[INST] {self.user_messages[-1]} [/INST]"

        return SYS + CONVO
    

class LlamaModel():
    def __init__(self, mode:str, llama_model_path:str='./src/llama/model', llama_tokenizer_path:str='./src/llama/tokenizer'):
        """
        Llama Model Class for data cleaning

        Args:
            mode (str): Determines what type the LLama model should be, QnA or Classification
            llama_model_path (str, optional): If locally hosting llama model, show the path of the model folder. Defaults to None.
            llama_tokenizer_path (str, optional): If locally hosting llama model, show the path of the tokenizer folder. Defaults to None.        
        """
        # Setup llama models
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.llama_model, self.llama_tokenizer = self._load_llama(llama_model_path, llama_tokenizer_path)
        self.config = GenerationConfig(max_new_tokens=1024,
                        do_sample=True,
                        top_k = 10,
                        num_return_sequences = 1,
                        return_full_text = False,
                        temperature = 0.01,
                        )

        self.QAsystemPrompt = """You are a question answering model, given a question and context in the format of a JSON:
        {
        "question":'',
        "context":''
        }
        , you are to return the answer with the following JSON format.
        {
        "answer": 
        }
        If the context does not answer the question, the answer is -.
        Only return the JSON with the correct answer. No other text is allowed.
        """
        # Note: Classification System Prompt is very specific to the leaf texture
        self.ClassificationsystemPrompt = """You are a classification model with 3 possible categories. Each category and it's description is given in the following JSON.
        {
        "fine": "Linear, thin shaped leaves and stems with no spikes or rough edges. Leaves are needle like shape and should not stand upwards.",
        "medium": "The most common texture in plants, medium size and shape. Often fleshy, rounded or oval, and not overly detailed. If unsure, pick this class.",
        "coarse": "Must be large, broad leaves with size larger than 15cm. Often rough or thick with prominent veins, lobes or edges that stand out visually."
        }
        You will be given a description of the plant leaf type. Categorise the description into one of the classes and return your answer in following JSON format. Always prioritise the size before the shape texture in your classification.
        {
        "answer": class
        }
        Only return the JSON with the classification. No description is accepted. No other text.
        """
        # Setup the correct system prompt based on the model requirements
        self.promptGenerator = PromptTemplate(system_prompt= self.QAsystemPrompt if mode == 'QnA' else self.ClassificationsystemPrompt)


    def _load_llama(self, llama_model_path:str, llama_tokenizer_path:str):
        """
        Function to load llama 2-7b model
        Uses hg_access from .env as a default, if there isn't any hg_access it looks for the directory of downloaded Llama models

        Returns:
            llama_model
            llama_tokenizer
        """
        hg_access = os.getenv('HG_ACCESS_TOKEN')
        if hg_access != None:
            try:
                print("Loading Llama Models")
                llama_model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-2-7b-chat-hf', token=hg_access, torch_dtype=torch.bfloat16, device_map="auto")
                llama_tokenizer = AutoTokenizer.from_pretrained('meta-llama/Llama-2-7b-chat-hf', token=hg_access)
                print("Llama Loaded Successfully")
                return llama_model, llama_tokenizer
            
            except Exception as e:
                raise Exception(f"Unable to load Llama model from hugging face, reasons: {e}")

        elif llama_model_path != None and llama_tokenizer_path != None:
            try:
                print("Loading Llama Models")
                llama_model = AutoModelForCausalLM.from_pretrained(llama_model_path, torch_dtype=torch.bfloat16, device_map="auto")
                llama_tokenizer = AutoTokenizer.from_pretrained(llama_tokenizer_path)
                print("Llama Loaded Successfully")
                return llama_model, llama_tokenizer
            
            except Exception as e:
                raise Exception(f"Unable to load Llama model from directory, reasons: {e}")
        
        else:
            raise Exception("No Llama resources provided")


    def question_answer(self, question:str, context:str):
        """
        Function to call the llama model to question answer

        Args:
            question (str): The question to be asked
            context (str): The context that contains the answer to the question

        Returns:
            response (str): Llama2-7b model's response
        """
        # Add user prompt
        llama_prompt = self.promptGenerator.add_user_message(
            json.dumps({
                "question": question,
                "context": context
            })
        )
        # Generate response
        encoded_input = self.llama_tokenizer.encode(llama_prompt, return_tensors='pt', add_special_tokens=False).to(self.device)
        results = self.llama_model.generate(encoded_input, generation_config=self.config)
        decoded_output = self.llama_tokenizer.decode(results[0], skip_special_tokens=True)
        response = decoded_output.split("[/INST]")[-1].strip()
        self.promptGenerator.clear_chat_history() #Clear history to reset back to just system prompt

        return response


    def classify(self, context:str):
        """
        Function to call the llama model to classify leaf texture

        Args:
            context (str): The context to help the model classify

        Returns:
            response (str): Llama2-7b model's response
        """
        llama_prompt = self.promptGenerator.add_user_message(context)

        encoded_input = self.llama_tokenizer.encode(llama_prompt, return_tensors='pt', add_special_tokens=False).to(self.device)
        results = self.llama_model.generate(encoded_input, generation_config=self.config)
        decoded_output = self.llama_tokenizer.decode(results[0], skip_special_tokens=True)
        response = decoded_output.split("[/INST]")[-1].strip()
        self.promptGenerator.clear_chat_history()

        return response
    

if __name__ == "__main__":
    pass