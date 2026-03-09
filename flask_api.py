from flask import Flask, jsonify, request
from game_data import CAR_CATALOG, BOSS_CARS, TOURNAMENTS, calculate_effective_stats
from backend.race_engine import simulate_quarter_mile

app = Flask(__name__)

# Load car data from catalogs
cars = list(CAR_CATALOG.values())
boss_cars = list(BOSS_CARS.values())
races = []  # Store ongoing and completed races
player_stats = {}  # Store player stats

def calculate_race_results(race_info):
    """Calculate race results from race_info dict.

    Expected keys:
        player_stats (dict): Stats for the player's car (hp, weight, etc.).
        opponent_stats (dict): Stats for the opponent's car.
    """
    player = race_info.get('player_stats')
    opponent = race_info.get('opponent_stats')
    if not isinstance(player, dict) or not isinstance(opponent, dict):
        raise ValueError("race_info must contain 'player_stats' and 'opponent_stats' dicts")
    results = simulate_quarter_mile(player, opponent)
    return results

@app.route('/api/cars', methods=['GET'])
def get_cars():
    return jsonify(cars)

@app.route('/api/boss-cars', methods=['GET'])
def get_boss_cars():
    return jsonify(boss_cars)

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    return jsonify(TOURNAMENTS)

@app.route('/api/race/start', methods=['POST'])
def start_race():
    race_info = request.json
    # Logic to start a race and add to the races list
    return jsonify({'status': 'Race started'}), 200

@app.route('/api/race/complete', methods=['POST'])
def complete_race():
    race_info = request.json
    try:
        results = calculate_race_results(race_info)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400
    return jsonify(results), 200

@app.route('/api/player/stats', methods=['GET'])
def get_player_stats():
    # Replace with actual player ID lookup
    return jsonify(player_stats)

@app.route('/api/player/garage', methods=['POST'])
def update_player_garage():
    player_id = request.json.get('player_id')
    car_id = request.json.get('car_id')
    # Logic to update player garage
    return jsonify({'status': 'Garage updated'}), 200

if __name__ == '__main__':
    app.run(debug=True)