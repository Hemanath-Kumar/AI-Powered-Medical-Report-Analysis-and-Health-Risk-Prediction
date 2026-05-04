import time
import json
import httpx
from environ import Env
env=Env()
env.read_env()


class embedding:

    def embed(self,data):
            if isinstance(data, str):
                data = [data]
        
            print(f"Starting Embedding for report ")
            timeout_config = httpx.Timeout(connect=10.0, read=None, write=60.0, pool=10.0)
            response = None
            max_retries = 2
            
            for attempt in range(max_retries + 1):
                try:
                    response = httpx.post(
                        f"{env('fastapi_url')}embedding/extract",
                        json={"data": data},
                        timeout=timeout_config
                    )
                    response.raise_for_status()
                    break
                except (httpx.TimeoutException, httpx.RequestError) as request_error:
                    if attempt >= max_retries:
                        raise request_error
                    retry_delay = 2 ** attempt
                    print(
                        f"Embedding request retry {attempt + 1}/{max_retries} for report "
                       
                    )
                    time.sleep(retry_delay)

            result = []

            if response is not None:
                try:
                    extracted_payload = response.json().get("extracted_text", [])

                    # KEEP AS LIST (do NOT convert to string)
                    if isinstance(extracted_payload, list):
                        result = extracted_payload
                    else:
                        raise ValueError("Invalid embedding format received")

                except ValueError:
                    raise Exception("Invalid JSON response from embedding API")
            return result
