from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import torch
import gc


class ocr:

    def __init__(self):
        self.__MODEL_PATH = "zai-org/GLM-OCR"

        self.__device = "cuda" if torch.cuda.is_available() else "cpu"
        self.__dtype = torch.float16 if self.__device == "cuda" else torch.float32

        self.processor = AutoProcessor.from_pretrained(
            self.__MODEL_PATH,
            trust_remote_code=True
        )

        self.model = AutoModelForImageTextToText.from_pretrained(
            self.__MODEL_PATH,
            trust_remote_code=True,
            torch_dtype=self.__dtype,
            device_map=self.__device
        )


    def excude_ocr(self,image):
        self.image = image

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": self.image
                    },
                    {
                        "type": "text",
                        "text": "Text Recognition:"
                    }
                ],
            }
        ]


        inputs = self.processor.apply_chat_template(
            messages,
            tokenize=True,
            add_generation_prompt=True,
            return_dict=True,
            return_tensors="pt"
        ).to(self.__device)

        inputs.pop("token_type_ids", None)

        with torch.no_grad():
            # generated_ids = model.generate(**inputs, max_new_tokens=1024)
            generated_ids = self.model.generate(
                                **inputs,
                                max_new_tokens=2048,
                                do_sample=False,
                                temperature=0.0
                            )

        output_text = self.processor.decode(
            generated_ids[0][inputs["input_ids"].shape[1]:],
            skip_special_tokens=True
        )

        if self.__device == "cuda":
            torch.cuda.empty_cache()
        gc.collect()

        return output_text
