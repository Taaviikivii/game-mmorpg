from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    password = Column(String)

    x = Column(Integer, default=100)
    y = Column(Integer, default=100)