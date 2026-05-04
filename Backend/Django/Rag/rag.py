from langchain_core.prompts import PromptTemplate, ChatPromptTemplate
from langchain_openai import ChatOpenAI
from environ import Env
import os
import json

env=Env()
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env')
env.read_env(env_path)

if __package__:
    from .Dataloader import dataloader
    from .Chunking import chunking
    from .Embedding import embedding
    from .vectordb import vector_db
else:
    try:
        from Dataloader import dataloader
        from Chunking import chunking
        from Embedding import embedding
        from vectordb import vector_db
    except ModuleNotFoundError:
        from Rag.Dataloader import dataloader
        from Rag.Chunking import chunking
        from Rag.Embedding import embedding
        from Rag.vectordb import vector_db

class rag_pipeline_class:

    def __init__(self):

        self.llm = ChatOpenAI(
        model="mistralai/mistral-large-3-675b-instruct-2512",
        api_key=env("API"),
        base_url="https://integrate.api.nvidia.com/v1"
        )
        self.vector_database=vector_db()
        # self.embed=embedding()

    def rag_data_upload_pipeline(self,data,user_id,report_id,user_name,created_at):

        loader=dataloader(data,user_id,report_id,user_name,created_at)
        data=loader.load()

        chunker=chunking(data.page_content)
        chunk_data=chunker.chunk()

        
        # embedding_data=self.embed.embed(chunk_data)


        self.vector_database.add(documents=chunk_data,metadata=data.metadata)
   

    def query(self,query,user_id):
        vector_database=vector_db()
        v=vector_database.query(query,where={"user_id":user_id})

        for k,v in v.items():
            print(k,v)

    def rag_medical_report_report_retrieval_pipeline(self, report_instance):
        try:
            

            result = self.vector_database.get(
                where={"$and": [
                    {"report_id": str(report_instance.MedicalReportid)},
                    {"Content_Type": "Medical_Report"}
                ]}
            )
            
            # No data case
            if not result or not result.get("documents"):
                print("No data found for summary ")
                return None

            documents = result.get("documents", [])

            if not documents:
                print("No data")
                return

            # handle both formats safely
            if isinstance(documents[0], list):
                # nested list → flatten
                flat_docs = [doc for sublist in documents for doc in sublist]
            else:
                # already flat
                flat_docs = documents

            full_text = "\n".join(flat_docs)

            return full_text

        except Exception as e:
            print(f"Summary pipeline failed: {e}")
            return None
        
    def AI_report_summary(self,report_instance):

        data=self.rag_medical_report_report_retrieval_pipeline(report_instance)

        prompt = ChatPromptTemplate.from_messages([
            ("system",
            """You are a medical assistant. Your output must be exactly 5 lines only.
                Don't use any symbols or numbers in your output example * * *.
        Each line must be clear simple and useful for a patient with no medical background.
        Include summary abnormal findings diet advice lifestyle and exercise and precautions.
        Avoid detailed explanations numbers repetition or medical jargon.
        Keep language short direct and practical.
        Suggest specialist doctor for the user to consult based on the report and why its needed and what tests are needed to be done ."""
            ),
            ("user",
            """Analyze this medical report and generate the output in exactly 5 lines.

        {report}
        """)
        ])

        chain = prompt | self.llm

        result = chain.invoke({"report": data})

        #  Save summary (recommended)
        report_instance.summary = result.content
        report_instance.save()

        metadata = {
            "Content_Type":"AI_Report_Summary",
            "user_id":   report_instance.user.id,
            "user_name": report_instance.user.name,
            "report_id": str(report_instance.MedicalReportid),
        }

        report_complete_info={
            "report_content":data,
            "Report_summary":result.content
        }
        self.vector_database.add(
            documents=[json.dumps(report_complete_info)],
            metadata=[metadata]
        )    


        print("AI Summary generated successfully")

    def Report_Ai_Insights_summary(self,report_instance,option):

        if option == "food" or option == "workout" or option == "short_summary" or option == "specialist":
            prompt_text = f"""
            You are a healthcare assistant. Follow instructions strictly.

            MODE: {option}

            CRITICAL RULES:
            - Output exactly 5 lines.
            - Each line under 20 words.
            - No symbols or formatting.
            - No repeated meaning or structure.
            - Use simple non-medical language.

            STRICT MODE CONTROL:
            - You MUST ONLY generate content relevant to the selected MODE.
            - If MODE is workout, DO NOT mention food, diet, nutrients, or eating.
            - If MODE is food, DO NOT mention exercise, walking, or workouts.
            - If you violate this, the answer is incorrect.

            ANTI-REPETITION:
            - Do not reuse ideas across lines.
            - Do not give generic advice.
            - Each line must be clearly different in meaning.

            MODE TASKS:

            FOOD:
            Line 1 what to eat more
            Line 2 what to avoid and why
            Line 3 eating habit
            Line 4 hydration
            Line 5 key nutrient need

            WORKOUT:
            Line 1 safest physical activity
            Line 2 what activity to avoid and why
            Line 3 duration and frequency
            Line 4 rest or recovery advice
            Line 5 simple daily movement habit

            SHORT_SUMMARY:
            Line 1 overall condition
            Line 2 main concern
            Line 3 one issue explained
            Line 4 one positive
            Line 5 next step

            SPECIALIST:
            Line 1 which doctor and why
            Line 2 urgency
            Line 3 what to carry
            Line 4 question to ask
            Line 5 likely test

            FINAL CHECK BEFORE ANSWERING:
            - Ensure output matches MODE exactly.
            - Ensure no overlap with other modes.
            """
        else:
            raise ValueError(f"Unknown type: '{type}'. Choose 'food', 'workout', 'short_summary' or 'specialist'")
            
        data = self.rag_medical_report_report_retrieval_pipeline(report_instance)

        prompt = ChatPromptTemplate.from_messages([
            ("system", prompt_text),
            ("user", """
                        Analyze the medical report below.

                        STRICT INSTRUCTIONS:
                        - Each line MUST be based on a DIFFERENT finding from the report.
                        - Do NOT give generic advice.
                        - Mention the specific issue indirectly in plain language.
                        - If two reports are different, output MUST also be different.

                        Medical Report:
                        {report}
                        """)
            ])

        chain = prompt | self.llm
        result = chain.invoke({"report": data})

     
        
        metadata = {
            "Content_Type":"AI_Report_Insights",
            "user_id":   report_instance.user_id,
            "report_id": str(report_instance.MedicalReportid),
            "user_name": report_instance.user.name,
            "type":      option,
            "Ai_Report_Insights": True
        }
        self.vector_database.add(
            documents=[result.content],
            metadata=[metadata]
        )


    def Prediction_AI_Summary(self,report_instance,prediciton):
        content=""

        for report_id in report_instance:
            data=self.rag_medical_report_report_retrieval_pipeline(report_id)
         
            if data:
                content += data
   
        prompt = ChatPromptTemplate.from_messages([
            ("system",
            """You are a clinical AI assistant generating structured patient risk summary cards.
                Your output must be EXACTLY valid JSON — no markdown, no backticks, no extra text.
                Return only this JSON structure:
                {{
                "prediction": {{
                    "condition": "<1 sentence: concise clinical label summarising the dominant abnormality found in the report, e.g. 'Elevated fasting glucose with low HDL and mild anemia'>",
                    "confidence": <integer 0-100: how confident the model is in this risk classification, derived from prediction_score>,
                    "risk": "<one of: 'low' | 'moderate' | 'high' — map from prediction_label>",
                    "recommendations": [
                    "<specific, actionable step 1 the patient should take>",
                    "<specific, actionable step 2>",
                    "<specific, actionable step 3>",
                    "<specific, actionable step 4>"
                    ]
                }},
                "aiSummary": {{
                    "summary": "<2-3 sentences: explain the 10-year risk prediction, what current report findings are contributing to that risk, and why early action matters now>",
                    "key_findings": [
                    "<current abnormal finding from report that increases future heart disease risk>",
                    "<second contributing risk factor from report>",
                    "<third contributing risk factor from report>",
                    "<what the model predicts: chance of heart disease within 10 years, framed simply>"
                    ],
                    "doctors_note": "<1-2 sentences: recommend which specialist to see, what preventive tests to do now, and what lifestyle or medication steps can reduce the 10-year risk>"
                }}
                }}

                Rules:
                - This is a FUTURE RISK prediction, NOT a current diagnosis. Never say the patient HAS heart disease.
                - prediction.condition is the ONLY place allowed to sound clinical — it labels the dominant pattern.
                - prediction.confidence = round(prediction_score) as an integer.
                - prediction.risk mapping: score < 20 → 'low', 20–60 → 'moderate', > 60 → 'high'.
                - prediction.recommendations must be concrete and actionable (diet, tests, monitoring, specialist).
                - aiSummary uses language like 'your current readings suggest...', 'over the next 10 years, your risk of...'
                - key_findings must each be a DIFFERENT factor from the report.
                - Avoid medical jargon in aiSummary. Write for a patient with no medical background.
                - Never hallucinate values. Only use what is in the report and prediction.
                """),
            ("user",
            """Generate a structured risk card using the data below.

                Medical Report (from RAG retrieval):
                {report}

                10-Year Heart Disease Risk Prediction:
                - Risk Level: {prediction_label}
                - Probability of Heart Disease in 10 Years: {prediction_score}%

                Instructions:
                - prediction.condition: summarise the dominant clinical pattern from the report in one phrase.
                - prediction.recommendations: 4 specific next steps (medications, diet, monitoring, specialist referral).
                - aiSummary: frame everything as future risk, not current condition.
                - doctors_note: focus on PREVENTION and EARLY INTERVENTION.
                - Keep aiSummary language simple, reassuring but honest.
                """)
        ])
        chain = prompt | self.llm
        # Unpack from Django model fields directly
        result_value = prediciton.prediction_result                       # 0 or 1
        probability  = float(prediciton.probability_value["probability"]) # 0.384 (plain float)
        risk_label   = "High Risk" if result_value == 1 else "Low Risk"
        risk_score   = round(probability * 100, 1)                        # 38.4

        result = chain.invoke({
            "report": content,
            "prediction_label": risk_label,
            "prediction_score": risk_score,
        })

        prediciton.summary=result.content
        prediciton.save()

        metadata = {
            "Content_Type":"Prediction_AI_Summary",
            "user_id":   prediciton.user.id,
            "user_name": prediciton.user.name,
            "predication_id": str(prediciton.Predicationid),
        }


        predication_complete_info={
            "report_content":content,
            "predication_summary":result.content
        }
        self.vector_database.add(
            documents=[json.dumps(predication_complete_info)],
            metadata=[metadata]
        )    


    def Prediction_Ai_Insights_summary(self, predication, predictionQuestionId):
        predication_id_str = str(predication.Predicationid)
        
        question_prompts = {
                    "q1": """
                    You are a healthcare assistant analyzing a patient's heart health data.
                    The patient wants to know: Am I at risk of a heart attack?

                    CRITICAL RULES:
                    - Output exactly 5 lines.
                    - Each line under 20 words.
                    - No symbols or formatting.
                    - No repeated meaning or structure.
                    - Use simple non-medical language.
                    - Every line must directly answer the patient's heart attack risk based on their data.

                    ANTI-REPETITION:
                    - Each line must give a different piece of information.
                    - Do not repeat the same idea in different words.

                    FINAL CHECK: Every line must directly answer "Am I at risk of a heart attack?"
                    """,

                    "q2": """
                    You are a healthcare assistant analyzing a patient's heart health data.
                    The patient wants to know: How soon could this become dangerous?

                    CRITICAL RULES:
                    - Output exactly 5 lines.
                    - Each line under 20 words.
                    - No symbols or formatting.
                    - No repeated meaning or structure.
                    - Use simple non-medical language.
                    - Every line must reflect the urgency and danger timeline based on the patient's data.

                    ANTI-REPETITION:
                    - Each line must give a different piece of information.
                    - Do not repeat the same idea in different words.

                    FINAL CHECK: Every line must directly answer "How soon could this become dangerous?"
                    """,

                    "q3": """
                    You are a healthcare assistant analyzing a patient's heart health data.
                    The patient wants to know: What are the warning signs of a heart attack?

                    CRITICAL RULES:
                    - Output exactly 5 lines.
                    - Each line under 20 words.
                    - No symbols or formatting.
                    - No repeated meaning or structure.
                    - Use simple non-medical language.
                    - Every line must describe a warning sign relevant to this patient's specific health data.

                    ANTI-REPETITION:
                    - Each line must give a different piece of information.
                    - Do not repeat the same idea in different words.

                    FINAL CHECK: Every line must directly answer "What are the warning signs of a heart attack?"
                    """,

                    "q4": """
                    You are a healthcare assistant analyzing a patient's heart health data.
                    The patient wants to know: When should I go to the hospital immediately?

                    CRITICAL RULES:
                    - Output exactly 5 lines.
                    - Each line under 20 words.
                    - No symbols or formatting.
                    - No repeated meaning or structure.
                    - Use simple non-medical language.
                    - Every line must describe a clear emergency trigger or action threshold for this patient.

                    ANTI-REPETITION:
                    - Each line must give a different piece of information.
                    - Do not repeat the same idea in different words.

                    FINAL CHECK: Every line must directly answer "When should I go to the hospital immediately?"
                    """
                }

        prompt_text = question_prompts.get(str(predictionQuestionId), question_prompts["q1"])

        data = self.vector_database.get_prediction_Ai_summary(predication_id_str)

        prompt = ChatPromptTemplate.from_messages([
            ("system", prompt_text),
            ("user", """
                        Analyze the medical report below.

                        STRICT INSTRUCTIONS:
                        - Each line MUST be based on a DIFFERENT finding from the report.
                        - Do NOT give generic advice.
                        - Mention the specific issue indirectly in plain language.
                        - If two reports are different, output MUST also be different.

                        Medical Report:
                        {report}
                        """)
            ])

        chain = prompt | self.llm
        result = chain.invoke({"report": data})


        metadata = {
            "Content_Type": "Prediction_AI_Insights_Summary",
            "user_id":   predication.user.id,
            "predication_id": predication_id_str,
            "user_name": predication.user.name,
            "predictionQuestionId": predictionQuestionId,
        }

        self.vector_database.add(
            documents=[result.content],
            metadata=[metadata]
        )
if __name__ == "__main__":
    obj=rag_pipeline_class()
    
    obj.get({"report_id": "48c435c6-711e-4d66-a820-fc5723029dbc"})
      
    
    # obj.query("What is my blood sugar?",user_id=1)