from flask import Flask, jsonify, request
from backend.game_data import CAR_CATALOG, PARTS_CATALOG, TOURNAMENTS, BOSS_CARS

app = Flask(__name__)

# Populate data from the canonical game_data module
cars = list(CAR_CATALOG.values())
boss_cars = list(BOSS_CARS.values())
races = []          # Store ongoing and completed races
player_stats = {}   # Store player stats


def calculate_race_results(race_info):
    # Basic race result calculation
    results = {
        "status": "completed",
        "race_info": race_info,
    }
    return results

@app.route('/api/cars', methods=['GET'])
def get_cars():
    return jsonify(cars)

@app.route('/api/boss-cars', methods=['GET'])
def get_boss_cars():
    return jsonify(boss_cars)

@app.route('/api/tournaments', methods=['GET'])
def get_tournaments():
    # Logic to get tournaments
    return jsonify(TOURNAMENTS)

@app.route('/api/race/start', methods=['POST'])
def start_race():
    race_info = request.json
    # Logic to start a race and add to the races list
    return jsonify({'status': 'Race started'}), 200

@app.route('/api/race/complete', methods=['POST'])
def complete_race():
    race_info = request.json
    results = calculate_race_results(race_info)
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