from langchain_huggingface import HuggingFaceEmbeddings

class embedding:
    def __init__(self):
        self.embeddings=HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
    def embed(self,data):
        return self.embeddings.embed_documents(data)
