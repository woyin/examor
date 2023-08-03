from pydantic import BaseModel


class Profile(BaseModel):
    questionAmount: str
    currentModel: str
    openaiKey: str
    azureKey: str
    openaiBase: str
    openaiVersion: str
    deploymentName: str
    notionKey: str
    proxy: str


class Icon(BaseModel):
    id: int
    icon: str


class AnswerQuestion(BaseModel):
    id: int
    language: str
    answer: str