import os
from openai import OpenAI
from fastapi import FastAPI
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

# local
# from prompt_utils import system_msg

load_dotenv()
try:
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
except KeyError:
    print("Error: 'OPEN_AI_API' not found in environment variables.")

OPENAI_MODEL = "gpt-3.5-turbo"


class AskRequest(BaseModel):
    query: str

# parameters
TEMPERATURE = 0.0
TOP_P = 0.0
MAX_TOKENS = 4000
FREQUENCY_PENALTY = 0.0
PRESENCE_PENALTY = 0.0


async def ask_chatgpt_stream(query: str):
    messages = [
        {
            "role": "system",
            # "content": system_msg
            "content": "you are an useful assistant."
        },
        {
            "role": "user",
            "content": f"{query}"
        }
    ]

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        stream=True,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        top_p=TOP_P,
        frequency_penalty=FREQUENCY_PENALTY,
        presence_penalty=PRESENCE_PENALTY,
        messages=messages
    )

    try:
        return_message = ""
        for item in response:
            delta = item.choices[0].delta
            return_message = return_message + delta.content
            yield {"data": return_message}
        yield {"data": "[DONE]"}
    except Exception as e:
        print(f"An error occurred: {e}")


app = FastAPI()

# cross origin for local test
origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/streaming/ask")
async def ask_stream(req: AskRequest) -> EventSourceResponse:
    return EventSourceResponse(ask_chatgpt_stream(req.query))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)