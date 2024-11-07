import os
import collections
from typing import Union, List, Dict
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk, scan, streaming_bulk

# Map common python types to ES Types
TYPE_MAP = {
    "int": "integer",
    "float": "float",
    "double": "double",
    "str": "text",
    "bool": "boolean",
    "datetime": "date",
    "list[int]": "integer",
    "list[str]": "text",
    "list[float]": "float",
    "list[double]": "double",
    "torch.tensor": "dense_vector",
    "numpy.ndarray": "dense_vector",
    "keyword": "keyword"
}

MAX_BULK_SIZE = 100

class ESManager():
    """
    Class to manage ElaticSearch
    """
    def __init__(self):
        self.url = f"http://{os.getenv('ELASTIC_HOST')}:{os.getenv('ELASTIC_PORT')}"
        self.username =  os.getenv('ELASTIC_USERNAME')
        self.password = os.getenv('ELASTIC_PASSWORD')

        self.client = Elasticsearch(self.url,
                                    verify_certs=False,
                                    basic_auth=(self.username, self.password), request_timeout=30, max_retries=10, retry_on_timeout=True)

        print(self.client.info())

        self.consolidated_actions = []

    def _check_data_type(self, var, var_type):
        try:
            assert type(var) == var_type
        except:
            return False
        return True

    def _check_valid_values(self, map_dict: dict) -> int:
        """
        Traverse mapping dictionary to ensure that all types are valid types within TYPE_MAP

        Args:
            map_dict (dict): Mapping to be checked

        Returns:
            int: 0 if there is invalid types, 1 otherwise

        """
        ret_val = 1
        for k, v in map_dict.items():
            if isinstance(v, dict):
                ret_val = self._check_valid_values(v)
            else:
                if not v in TYPE_MAP:
                    print(f"'{v}' type for '{k}' NOT FOUND")
                    return 0

        return ret_val * 1

    def _traverse_map(self, map_dict: Dict) -> Dict:
        """
        Traverse mapping dictionary to convert data type into framework specific type

        Args:
            map_dict (dict): Mapping to be used to create ES index

        Returns:
            dict: updated mapping dictionary

        """
        dictionary = {"properties": dict()}
        for k, v in map_dict.items():
            if isinstance(v, dict):
                dictionary['properties'][k] = self._traverse_map(v)
            else:
                dictionary['properties'][k] = {"type": TYPE_MAP[v]}
        return dictionary

    def _flush(self):
        errors = []
        list_of_es_ids = []
        for ok, item in streaming_bulk(self.client, self.consolidated_actions):
            if not ok:
                errors.append(item)
            else:
                list_of_es_ids.append(item['index']['_id'])
        if len(errors) != 0:
            print("List of faulty documents:", errors)
        self.consolidated_actions = []  # Reset List
        return list_of_es_ids

    def _flatten(self, d, parent_key='', sep='.'):
        """
        Flatten nested dictionary keys to dotted parameters because Elasticsearch. 
        """
        items = []
        for k, v in d.items():
            new_key = parent_key + sep + k if parent_key else k
            if isinstance(v, collections.MutableMapping):
                items.extend(self._flatten(v, new_key, sep=sep).items())
            else:
                items.append((new_key, v))
        return dict(items)

    def create_collection(self, collection_name: str, schema: Dict, custom_schema: bool = False) -> Dict:
        """
        Create the index on ElasticSearch

        Args:
            collection_name (str): Index name of ES
            schema (dict): Mapping to be used to create ES index
            custom_schema (bool): If set to True, user may input schema that in accordance to ElasticSearch Mapping's format. The schema will not be parsed. 

        Returns:
            dict: response of error, or 200 if no errors caught

        """
        if not self._check_data_type(schema, dict):
            return {"response": "Type of 'schema' is not dict"}
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not self._check_data_type(custom_schema, bool):
            return {"response": "Type of 'custom_schema' is not bool"}
        if custom_schema:
            try:
                self.client.indices.create(
                    index=collection_name, mappings=schema)
            except Exception as e:
                return {"response": f"{e}"}
            return {"response": "200"}
        else:
            mapping_validity = self._check_valid_values(schema)
            if not mapping_validity:
                return {"response": "KeyError: data type not found in TYPE_MAP"}
            updated_mapping = self._traverse_map(schema)
            try:
                self.client.indices.create(
                    index=collection_name, mappings=updated_mapping)
            except Exception as e:
                return {"response": f"{e}"}
            return {"response": "200"}

    def delete_collection(self, collection_name: str) -> dict:
        """
        Create the index on ElasticSearch

        Args:
            collection_name (str): Index name of ES
            schema (dict): Mapping to be used to create ES index

        Returns:
            dict: response of error, or 200 if no errors caught

        """
        try:
            self.client.indices.delete(index=collection_name)
        except Exception as e:
            return {"response": f"{e}"}
        return {"response": "200"}

    def create_document(self, collection_name: str, documents: Union[list, dict], id_field: str = None) -> dict:
        """
        Upload document(s) in the specified index within ElasticSearch

        Args:
            collection_name (str): Index name of ES
            documents (dict, list): A dict of document objects to be ingested. A list of dict is accepted as well. 
            id_field (str, Optional): Specify the key amongst the document object to be the id field. If not specified, id will be generated by ES. 

        Returns:
            dict: response of error along with the faulty document, or code 200 along with the ids of ingested document if no errors caught

        """
        if not self._check_data_type(documents, list):
            if not self._check_data_type(documents, dict):
                return {"response": "Type of 'documents' is not dict or a list"}
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not id_field is None:
            if not self._check_data_type(id_field, str):
                return {"response": "Type of 'id_field' is not str"}

        # If single document, wrap it in a list so it can be an iterable as it would be when a list of document is submitted
        if type(documents) == dict:
            documents = [documents]

        # If id_field is specified, verify that all documents possess the id_field.
        if id_field != None:
            for doc in documents:
                if not id_field in doc.keys():
                    print(
                        "Fix document, or set 'id_field' to None. No documents uploaded.")
                    return {"response": "Fix document, or set 'id_field' to None. No documents uploaded.",
                            "error_doc": doc}
                try:
                    doc[id_field] = str(doc[id_field])
                except Exception as e:
                    return {"response": "id cannot be casted to String type. No documents uploaded.",
                            "error_doc": doc}
        all_id = []
        for doc in documents:
            doc_copy = dict(doc)
            action_dict = {}
            action_dict['_op_type'] = 'index'
            action_dict['_index'] = collection_name
            if id_field != None:
                action_dict['_id'] = doc_copy[id_field]
                doc_copy.pop(id_field)
            action_dict['_source'] = doc_copy
            self.consolidated_actions.append(action_dict)
            if len(self.consolidated_actions) == MAX_BULK_SIZE:
                all_id = all_id+self._flush()

        all_id = all_id+self._flush()

        return {"response": "200", "ids": all_id}

    def delete_document(self, collection_name: str, doc_id: str) -> dict:
        """
        Delete document from index based on the specified document id. 

        Args:
            collection_name (str): Index name of ES
            doc_id (str): id of doc to be deleted

        Returns:
            dict: response of error along with the faulty document, or code 200 along with elastic API response

        """
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not self._check_data_type(doc_id, str):
            return {"response": "Type of 'doc_id' is not str"}

        # Check for document's existence
        search_result = self.client.search(index=collection_name, query={
                                           "match": {"_id": doc_id}})
        result_count = search_result['hits']['total']['value']

        if result_count == 0:
            return {"response": f"Document '{doc_id}' not found!"}

        try:
            resp = self.client.delete(index=collection_name, id=doc_id)
        except Exception as e:
            return {"response": f"{e.__class__.__name__}. Document Deletion failed"}

        return {"response": "200", "api_resp": resp}

    def update_document(self, collection_name: str, doc_id: str, document: dict) -> dict:
        """
        Delete document from index based on the specified document id. 

        Args:
            collection_name (str): Index name of ES
            doc_id (str): id of doc to be updated
            document (dict): key and values of fields to be updated.

        Returns:
            dict: response of error along with the faulty document, or code 200 along with elastic API response

        """
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not self._check_data_type(doc_id, str):
            return {"response": "Type of 'doc_id' is not str"}
        if not self._check_data_type(document, dict):
            return {"response": "Type of 'document' is not dict"}

        # Check for document's existence
        search_result = self.client.search(index=collection_name, query={
                                           "match": {"_id": doc_id}})
        result_count = search_result['hits']['total']['value']

        if result_count == 0:
            return {"response": f"Document '{doc_id}' not found, create document first"}

        try:
            for key in document.keys():

                q = {
                    "script": {
                        "source": f"ctx._source.{key}=params.infer",
                        "params": {
                            "infer": document[key]
                        },
                        "lang": "painless"
                    },
                    "query": {
                        "match": {
                            "_id": doc_id
                        }
                    }
                }
                resp = self.client.update_by_query(
                    body=q, index=collection_name)
        except Exception as e:
            return {"response": f"{e.__class__.__name__}. Document Update failed"}

        return {"response": "200", "api_resp": resp}

    def read_document(self, collection_name: str, doc_id: str) -> dict:
        """
        Read document from index based on the specified document id. 

        Args:
            collection_name (str): Index name of ES
            doc_id (str): id of doc to be read

        Returns:
            dict: response of error along with the faulty document, or code 200 along with the retrieved document

        """
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not self._check_data_type(doc_id, str):
            return {"response": "Type of 'doc_id' is not str"}

        # Check for document's existence
        search_result = self.client.search(index=collection_name, query={
                                           "match": {"_id": doc_id}})
        result_count = search_result['hits']['total']['value']

        if result_count == 0:
            return {"response": f"Document '{doc_id}' not found!"}

        doc_body = search_result['hits']['hits']

        return {"response": "200", "api_resp": doc_body}

    def query_collection(self, collection_name: str, field_value_dict: dict) -> dict:
        """
        Read document from index based on the specific key-value dictionary query. 

        Args:
            collection_name (str): Index name of ES
            field_value_dict (dict): A dictionary with the field to be queried as the key, and the value to be queried as the value of the dictionary. 
                                    example: {"field1":"query1", "field2", "query2"}

        Returns:
            dict: response of error along with the faulty document, or code 200 along with the list of retrieved document

        """
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not self._check_data_type(field_value_dict, dict):
            return {"response": "Type of 'field_value_dict' is not dict"}

        # Check for document's existence
        reorg_dict = {"bool":{
            "should":[]
            }
        }
        for field in field_value_dict:
            reorg_dict['bool']['should'].append({"match":{field:field_value_dict[field]}})

        search_result = self.client.search(index=collection_name, query=reorg_dict)
        result_count = search_result['hits']['total']['value']

        if result_count == 0:
            return {"response": f"No documents found."}

        docs = search_result['hits']['hits']

        return {"response": "200", "api_resp": docs}

    def custom_query(self, collection_name: str, query: dict) -> dict:
        """
        Read document from index based on custom ES query syntax. 

        Args:
            collection_name (str): Index name of ES
            query (dict): Custom query for ES users who are familiar with the query format

        Returns:
            dict: response of error along with the faulty document, or code 200 along with the list of retrieved document

        """
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        if not self._check_data_type(query, dict):
            return {"response": "Type of 'field_value_dict' is not dict"}

        # Check for document's existence
        search_result = self.client.search(index=collection_name, query=query)
        result_count = search_result['hits']['total']['value']

        if result_count == 0:
            return {"response": f"No documents found."}

        docs = search_result['hits']['hits']

        return {"response": "200", "api_resp": docs}

    def get_all_documents(self, collection_name: str) -> dict:
        """
        Generator method to retrieve all documents within the index

        Args:
            collection_name (str): Index name of ES

        Returns:
            Generator Object: Iterable object containing all documents within index specified. 
        """
        if not self._check_data_type(collection_name, str):
            return {"response": "Type of 'collection_name' is not str"}
        docs_response = scan(self.client, index=collection_name, query={
                             "query": {"match_all": {}}})
        for item in docs_response:
            yield item


if __name__ == "__main__":
    pass