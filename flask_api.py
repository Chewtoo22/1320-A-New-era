import uuid
from flask import Flask, jsonify, request
from backend.game_data import CAR_CATALOG, BOSS_CARS, TOURNAMENTS, PARTS_CATALOG, calculate_effective_stats
from backend.race_engine import simulate_quarter_mile

app = Flask(__name__)

# ---------------------------------------------------------------------------
# In-memory stores (suitable for development / testing)
# ---------------------------------------------------------------------------
players = {}        # player_id -> player dict
player_cars = {}    # player_car_id -> player_car dict

STARTING_CASH = 20000


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_player_car(player_id: str, car_id: str) -> dict:
    catalog = CAR_CATALOG[car_id]
    upgrades: dict = {}
    effective = calculate_effective_stats(catalog, upgrades)
    return {
        "id": str(uuid.uuid4()),
        "player_id": player_id,
        "car_id": car_id,
        "upgrades": upgrades,
        "catalog": catalog,
        "effective_stats": effective,
    }


def calculate_race_results(race_info):
    """Calculate race results from race_info dict.

    Expected keys:
        player_stats (dict): Stats for the player's car (hp, weight, etc.).
        opponent_stats (dict): Stats for the opponent's car.
    """
    if not isinstance(race_info, dict):
        raise ValueError("Request body must be a JSON object")
    player = race_info.get('player_stats')
    opponent = race_info.get('opponent_stats')
    if not isinstance(player, dict) or not isinstance(opponent, dict):
        raise ValueError("race_info must contain 'player_stats' and 'opponent_stats' dicts")
    results = simulate_quarter_mile(player, opponent)
    return results


# ---------------------------------------------------------------------------
# Player endpoints
# ---------------------------------------------------------------------------

@app.route('/api/player/create', methods=['POST'])
def create_player():
    body = request.get_json(silent=True) or {}
    username = body.get('username', 'Racer')
    player = {
        "id": str(uuid.uuid4()),
        "username": username,
        "cash": STARTING_CASH,
        "wins": 0,
        "losses": 0,
    }
    players[player["id"]] = player
    return jsonify(player), 200


@app.route('/api/player/<player_id>', methods=['GET'])
def get_player(player_id):
    player = players.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404
    return jsonify(player), 200


@app.route('/api/player/stats', methods=['GET'])
def get_player_stats():
    return jsonify(players), 200


# ---------------------------------------------------------------------------
# Car endpoints
# ---------------------------------------------------------------------------

@app.route('/api/cars/catalog', methods=['GET'])
def get_car_catalog():
    return jsonify(list(CAR_CATALOG.values())), 200


@app.route('/api/cars', methods=['GET'])
def get_cars():
    return jsonify(list(CAR_CATALOG.values()))


@app.route('/api/boss-cars', methods=['GET'])
def get_boss_cars():
    return jsonify(list(BOSS_CARS.values()))


@app.route('/api/cars/buy', methods=['POST'])
def buy_car():
    body = request.get_json(silent=True) or {}
    player_id = body.get('player_id')
    car_id = body.get('car_id')

    player = players.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404

    catalog = CAR_CATALOG.get(car_id)
    if not catalog:
        return jsonify({"error": "Car not found"}), 404

    price = catalog.get("price", 0)
    if player["cash"] < price:
        return jsonify({"error": "Insufficient funds"}), 400

    player["cash"] -= price
    car = _build_player_car(player_id, car_id)
    player_cars[car["id"]] = car

    return jsonify({"car": car, "new_cash": player["cash"]}), 200


@app.route('/api/cars/player/<player_id>', methods=['GET'])
def get_player_cars(player_id):
    if player_id not in players:
        return jsonify({"error": "Player not found"}), 404
    cars = [c for c in player_cars.values() if c["player_id"] == player_id]
    return jsonify(cars), 200


@app.route('/api/cars/upgrade', methods=['POST'])
def upgrade_car():
    body = request.get_json(silent=True) or {}
    player_id = body.get('player_id')
    player_car_id = body.get('player_car_id')
    part_key = body.get('part_key')
    tier = body.get('tier')

    player = players.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404

    car = player_cars.get(player_car_id)
    if not car or car["player_id"] != player_id:
        return jsonify({"error": "Car not found"}), 404

    part = PARTS_CATALOG.get(part_key)
    if not part:
        return jsonify({"error": "Part not found"}), 404

    tier_data = part.get("tiers", {}).get(tier)
    if not tier_data:
        return jsonify({"error": "Invalid tier"}), 400

    price = tier_data.get("price", 0)
    if player["cash"] < price:
        return jsonify({"error": "Insufficient funds"}), 400

    player["cash"] -= price
    car["upgrades"][part_key] = tier
    car["effective_stats"] = calculate_effective_stats(car["catalog"], car["upgrades"])

    return jsonify({"car": car, "new_cash": player["cash"]}), 200


@app.route('/api/player/garage', methods=['POST'])
def update_player_garage():
    body = request.get_json(silent=True) or {}
    player_id = body.get('player_id')
    car_id = body.get('car_id')
    if player_id and car_id:
        return jsonify({'status': 'Garage updated'}), 200
    return jsonify({'error': 'player_id and car_id required'}), 400


# ---------------------------------------------------------------------------
# Parts endpoint
# ---------------------------------------------------------------------------

@app.route('/api/parts/catalog', methods=['GET'])
def get_parts_catalog():
    return jsonify(PARTS_CATALOG), 200


# ---------------------------------------------------------------------------
# Tournament endpoint
# ---------------------------------------------------------------------------

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    return jsonify(TOURNAMENTS)


# ---------------------------------------------------------------------------
# Race endpoints
# ---------------------------------------------------------------------------

@app.route('/api/race/start', methods=['POST'])
def start_race():
    return jsonify({'status': 'Race started'}), 200


@app.route('/api/race/complete', methods=['POST'])
def complete_race():
    race_info = request.get_json(silent=True)
    try:
        results = calculate_race_results(race_info)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    return jsonify(results), 200


@app.route('/api/race/result', methods=['POST'])
def record_race_result():
    body = request.get_json(silent=True) or {}
    player_id = body.get('player_id')

    player = players.get(player_id)
    if not player:
        return jsonify({"error": "Player not found"}), 404

    result = body.get('result', 'loss')
    try:
        earnings = int(body.get('earnings', 0))
    except (TypeError, ValueError):
        earnings = 0

    if result == 'win':
        player['wins'] += 1
        player['cash'] += earnings
    else:
        player['losses'] += 1

    return jsonify(player), 200


if __name__ == '__main__':
    app.run(debug=True)