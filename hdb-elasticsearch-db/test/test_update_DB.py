import argparse
import os
import logging
import pandas as pd

from src.utils.ES_manager import ESManager

"""
TO UPDATE
"""
os.environ['ELASTIC_PORT'] = '9200'
os.environ['ELASTIC_HOST'] = 'localhost' #If using docker, please use your docker container name here
os.environ['ELASTIC_USERNAME'] = 'elastic'
os.environ['ELASTIC_PASSWORD'] = '' # To be filled

def parse_arguments():
    """
    Function defining all arguments for the data
    """
    parser = argparse.ArgumentParser(description="Updating elasticsearch database requirements")
    
    # Define the arguments
    parser.add_argument('--filter_data', type=bool, default=True, help='Filter through dataset to ensure that only clean data was uploaded to ElasticSearch. Defaults to True.')
    parser.add_argument('--dataset_size', type=int, default=10, help='Number of randomly selected sample to upload to database. Use None if upload entire dataset. Defaults to 30.')
    parser.add_argument('--seed', type=int, default=None, help='Seed to randomly select dataset.')
    parser.add_argument('--dataset_filepath', type=str, default='./test/flora_data/cleaned_flora_species.csv', help='Filepath to csv file containing data to be injested to ElasticSearch.')
    parser.add_argument('--collection_name', type=str, default='flora', help='Collection name for dataset in ElastiSearch. Defaults to flora.')
    parser.add_argument('--output_folder', type=str, default='./test/flora_data/', help='Dataset CSV output folder.')
    parser.add_argument('--logs_folder', type=str, default='./test/flora_data/logs/', help='Logs output folder.')

    return parser.parse_args()


def ingest_dataset(csv_filepath:str, esManager:ESManager, collection_name:str):
    """
    Function to ingest flora csv dataset file into elasticsearch

    Args:
        csv_filepath (str): filepath to csv file
        esManager (ESManager): ESManager instance
        collection_name (str): Collection Name to ingest data
    """

    dataset = pd.read_csv(csv_filepath, sep=',', header=0)
    # Update empty data and 'None' to N/A
    dataset = dataset.where(pd.notnull(dataset), 'N/A')
    # Update any edited boolean to true booleans
    dataset = dataset.applymap(lambda x: True if str(x).strip().upper() == 'TRUE' 
                           else False if str(x).strip().upper() == 'FALSE' 
                           else x)

    NA_columns = ['Common Name', 'Hazard', 'Attracted Animals', 'Young Flush Leaf Colour']
    false_column = ['Fragrant Plant?'] 
    int_column = ["Species ID"]
    float_column = ["Maximum Height"]
    keyword_column = ["Plant Type", "Light Preference", "Water Preference", "Growth Rate", 'Leaf Texture']

    all_documents = []
    headers = dataset.columns

    for index, row in dataset.iterrows():
        document_data = {}

        for attribute in headers:
            data = row[attribute]
            
            if attribute in NA_columns and data == '-':
                data = "N/A"
            
            # False for '-' but if N/A (for trees, use null and remove frm DB)
            if attribute in false_column and data == '-':
                data = False

            if attribute in false_column and data == 'N/A':
                data = None
            
            if attribute in int_column:
                data = int(data)
            
            if attribute in float_column:
                data = float(data)
                attribute = "Maximum Height (m)"

            if attribute in keyword_column:
                data = [attr.strip() for attr in data.split(",")]
            
            if '?' in attribute:
                attribute = attribute[:-1]
            
            document_data[attribute] = data
       
        all_documents.append(document_data)

    logging.info(f"Ingesting {len(all_documents)} documents")
    return esManager.create_document(collection_name, all_documents)


def test():
    args = parse_arguments()

    # Accessing the arguments
    filter_data = args.filter_data
    dataset_size = args.dataset_size
    seed = args.seed
    csv_filepath = args.dataset_filepath
    collection_name = args.collection_name
    DATA_FOLDER = args.output_folder
    LOGS_FOLDER = args.logs_folder

    CSV_FILE_PATH = os.path.join(DATA_FOLDER, 'dataset.csv')

    # Create folders
    if not os.path.exists(DATA_FOLDER):
        os.makedirs(DATA_FOLDER)

    if not os.path.exists(LOGS_FOLDER):
        os.makedirs(LOGS_FOLDER)

    # Logs configuration
    logging.basicConfig(
        filename=os.path.join(LOGS_FOLDER, 'es_manager.log'),
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        filemode='w'
    )
    print(f"Starting ingestion, logs can be found in {os.path.join(LOGS_FOLDER, 'es_manager.log')}")

    # Read dataset
    flora_data = pd.read_csv(csv_filepath, sep=',', header=0)
    logging.info("CSV successfully read.")

    # Filter dataset
    if filter_data:
        tree_shrub_data = flora_data[flora_data['Plant Type'].str.contains('Tree|Shrub|Palm', case=False)]
        # Filter empty / incomplete data
        # Note: For Attracted animals, Hazard, Fragrant Plant -> '-' means False 
        invalid_data_list = ['Maximum Height', 'Flower Colour', 'Native habitat', 'Mature Leaf Colour', 'Leaf Area Index', 'Growth Rate', 'Trunk Texture', 'Trunk Colour', 'Leaf Texture']
        # Remove any '-' which shows invalid data
        flora_data = tree_shrub_data[
            ~tree_shrub_data[invalid_data_list].apply(lambda row: (row.astype(str) == '-').any(), axis=1)
        ]
        logging.info("Dataset successfully filtered to remove all incomplete data.")

    # Randomly selecting dataset
    selected_dataset = flora_data
    if dataset_size !=  None:
        selected_dataset = flora_data.sample(n=dataset_size, random_state=seed)
        logging.info(f"Successfully sampled dataset of size {dataset_size}.")
    
    # Ensure None remains as a string, save dataset
    selected_dataset = selected_dataset.where(pd.notnull(selected_dataset), 'None')
    selected_dataset.to_csv(CSV_FILE_PATH, index=False)
    logging.info(f"Dataset saved, injesting dataset into ElasticSearch")
    print(f"Dataset saved, injesting dataset into ElasticSearch")

    # Injest data to ES
    esManager = ESManager()
    dataset_schema = {
        "mappings": {
            "properties": {
                "Scientific Name" : {"type": "str"},
                "Common Name": {"type": "str"},
                "Species ID": {"type": "int"},
                "Link": {"type": "str"},
                "Plant Type": {"type": "keyword"},
                "Light Preference": {"type": "keyword"},
                "Water Preference": {"type": "keyword"}, 
                "Drought Tolerant": {"type": "bool"},
                "Native to SG": {"type": "bool"},
                "Fruit Bearing": {"type": "bool"},
                "Fragrant Plant": {"type": "bool"},
                "Maximum Height (m)": {"type": "float"},
                "Flower Colour": {"type": "str"},
                "Hazard": {"type": "str"},
                "Attracted Animals": {"type": "str"},
                "Native habitat": {"type": "str"},
                "Mature Leaf Colour": {"type": "str"},
                "Young Flush Leaf Colour": {"type": "str"},
                "Leaf Area Index": {"type": "str"},
                "Growth Rate": {"type": "keyword"},
                "Trunk Colour": {"type": "str"},
                "Trunk Texture": {"type": "str"},
                "Leaf Texture": {"type": "keyword"},            
            }
        }
    }

    # Create collection
    resp = esManager.create_collection(collection_name, dataset_schema)
    if resp['response'] != "200":
        logging.warning(f'Collection {collection_name} already exists. Appending dataset to existing collection.')
    else:
        logging.info(f'Collection {collection_name} successfully created.')
    
    # Upload documents to database
    logging.info("Injesting documents into ElasticSearch.")
    resp = ingest_dataset(CSV_FILE_PATH, esManager, collection_name)
    if resp['response'] != "200":
        logging.error(f"Ingesting failed. {resp}")
    else:
        logging.info(f"Successfully ingested documents. Documents IDs: {resp['ids']}")
        print(f"Successfully ingested documents. Documents IDs: {resp['ids']}")


if __name__ == "__main__":
    test()


    