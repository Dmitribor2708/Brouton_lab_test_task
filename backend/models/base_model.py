# sqlalchemy.exc.InvalidRequestError: Cannot use 'DeclarativeBase' directly as a declarative base class. Create a Base by creating a subclass of it. TODO - правильный ли обход????
from sqlalchemy.orm import DeclarativeBase


class BaseModel(DeclarativeBase):
    pass
