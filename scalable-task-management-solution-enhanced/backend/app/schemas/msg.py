from pydantic import BaseModel

class Msg(BaseModel):
    message: str