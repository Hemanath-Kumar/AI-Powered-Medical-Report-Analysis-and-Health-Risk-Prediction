import chromadb
from .Embedding import embedding
import uuid
import environ
import os
env = environ.Env()
environ.Env.read_env(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

class ChromaEmbeddingWrapper:
    """Wraps our embedding into a ChromaDB-compatible embedding function."""
    def __init__(self):
        self._embed = embedding()

    def name(self):
        return "default"

    def __call__(self, input):
        return self._embed.embed(input)

class vector_db:
    def __init__(self):
        self.client = chromadb.CloudClient(
            tenant=env("CHROMA_TENANT"),
            database=env("CHROMA_DATABASE"),
            api_key=env("CHROMA_API_KEY"),
        )
        self.collection = self.client.get_or_create_collection(
            name="medical_reports",
            embedding_function=ChromaEmbeddingWrapper()
        )

    def add(self,documents,metadata):
        self.collection.add(
            documents=documents,
            metadatas=metadata,
            ids=[str(uuid.uuid4())] 
        )

    def query(self,query,k=5,where=None):
        return self.collection.query(
            query_texts=[query],
            n_results=k,
            where=where
        )
    def get(self, where):
        return self.collection.get(where=where)
    
    def get_Report_Ai_Insights_summary(self,report_id,option):
        where_clause = {
            "$and": [
                {"Content_Type":"AI_Report_Insights"},
                {"report_id": report_id},
                {"type": option},
                {"Ai_Report_Insights": True}
            ]
        }
        data=self.collection.get(where=where_clause)
        if data and data.get("documents"):
            return data["documents"][0]
        return ""

    def get_prediction_Ai_summary(self,report_id):
        where_clause = {
            "$and": [
                {"Content_Type":"Prediction_AI_Summary"},
                {"predication_id": report_id},
            ]
        }
        data=self.collection.get(where=where_clause)
        if data and data.get("documents"):
            return data["documents"][0]
        return ""

    def get_prediction_Ai_Insights_summary(self,report_id,option):
        where_clause = {
            "$and": [
                {"Content_Type":"Prediction_AI_Insights_Summary"},
                {"predication_id": report_id},
                {"predictionQuestionId": option},
            ]
        }
        data=self.collection.get(where=where_clause)
        if data and data.get("documents"):
            return data["documents"][0]
        return ""

if __name__ == "__main__":
    obj=vector_db()
    result = obj.collection.get()
    print(result)
 
      