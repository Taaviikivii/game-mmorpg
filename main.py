from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from database import engine, SessionLocal
from models import Base, Player
from auth import hash_password, verify_password
from websocket import active_players
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def home():
    return {"message": "MMORPG Backend Online"}


@app.post("/register")
def register(username: str, password: str):

    print("USERNAME:", username)
    print("PASSWORD:", password)
    print("PASSWORD LENGTH:", len(password))

    db = SessionLocal()

    existing = db.query(Player).filter(
        Player.username == username
    ).first()

    if existing:
        return {"error": "Username already exists"}

    player = Player(
        username=username,
        password=hash_password(password)
    )

    db.add(player)
    db.commit()

    return {"success": True}


@app.post("/login")
def login(username: str, password: str):

    db = SessionLocal()

    player = db.query(Player).filter(
        Player.username == username
    ).first()

    if not player:
        return {"error": "User not found"}

    if not verify_password(
        password,
        player.password
    ):
        return {"error": "Wrong password"}

    return {
        "success": True,
        "player": player.username,
        "x": player.x,
        "y": player.y
    }

@app.websocket("/ws/{username}")
async def websocket_endpoint(
    websocket: WebSocket,
    username: str
):
    await websocket.accept()

    active_players[username] = {
        "ws": websocket,
        "x": 100,
        "y": 100
    }

    try:

        while True:

            raw = await websocket.receive_text()

            data = json.loads(raw)

            if data["type"] == "move":

                active_players[username]["x"] = data["x"]
                active_players[username]["y"] = data["y"]

                players = {}

                for name, player in active_players.items():

                    players[name] = {
                        "x": player["x"],
                        "y": player["y"]
                    }

                packet = {
                    "type": "players",
                    "players": players
                }

                for player in active_players.values():

                    await player["ws"].send_text(
                        json.dumps(packet)
                    )

            elif data["type"] == "chat":

                packet = {
                    "type": "chat",
                    "player": username,
                    "message": data["message"]
                }

                for player in active_players.values():

                    await player["ws"].send_text(
                        json.dumps(packet)
                    )

    except WebSocketDisconnect:

        del active_players[username]
