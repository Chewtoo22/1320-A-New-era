import requests
import json
import sys
from datetime import datetime

class TurboShowdownAPITester:
    def __init__(self, base_url="https://turbo-showdown-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.player_id = None
        self.player_car_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}: {message}")
        
        if success:
            self.tests_passed += 1
        
        self.test_results.append({
            "test_name": name,
            "success": success,
            "message": message,
            "response_data": response_data
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_json = response.json()
                    self.log_test(name, True, f"Status {response.status_code}", response_json)
                    return True, response_json
                except Exception as e:
                    self.log_test(name, True, f"Status {response.status_code}", {})
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                    error_msg += f" - {error_detail}"
                except Exception as e:
                    error_msg += f" - Response: {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_player_creation(self):
        """Test creating a new player"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_username = f"TestRacer{timestamp}"
        
        success, response = self.run_test(
            "Create Player",
            "POST",
            "player/create",
            200,
            data={"username": test_username}
        )
        
        if success and 'id' in response:
            self.player_id = response['id']
            if response.get('cash') == 20000:
                self.log_test("Player Starting Cash", True, f"Player has $20,000 starting cash")
            else:
                self.log_test("Player Starting Cash", False, f"Expected $20,000, got ${response.get('cash', 0)}")
        
        return success

    def test_get_player(self):
        """Test retrieving player data"""
        if not self.player_id:
            self.log_test("Get Player", False, "No player ID available")
            return False
            
        success, response = self.run_test(
            "Get Player",
            "GET",
            f"player/{self.player_id}",
            200
        )
        
        if success:
            required_fields = ['id', 'username', 'cash', 'wins', 'losses']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                self.log_test("Player Data Fields", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Player Data Fields", True, "All required fields present")
        
        return success

    def test_car_catalog(self):
        """Test car catalog endpoint"""
        success, response = self.run_test(
            "Get Car Catalog",
            "GET",
            "cars/catalog",
            200
        )
        
        if success:
            if len(response) == 17:
                self.log_test("Car Catalog Count", True, f"Found {len(response)} cars as expected")
                
                # Check if cars have required fields
                if response:
                    car = response[0]
                    required_fields = ['id', 'name', 'price', 'category', 'hp', 'quarterMile', 'trapSpeed']
                    missing_fields = [field for field in required_fields if field not in car]
                    if missing_fields:
                        self.log_test("Car Data Fields", False, f"Missing fields in car: {missing_fields}")
                    else:
                        self.log_test("Car Data Fields", True, "All required car fields present")
                        
                        # Check categories
                        categories = set(car.get('category') for car in response)
                        expected_categories = {'compact', 'jdm', 'muscle', 'truck', 'suv', 'euro', 'exotic', 'electric'}
                        found_categories = categories.intersection(expected_categories)
                        if len(found_categories) >= 5:  # At least 5 different categories
                            self.log_test("Car Categories", True, f"Found diverse categories: {found_categories}")
                        else:
                            self.log_test("Car Categories", False, f"Limited categories found: {categories}")
            else:
                self.log_test("Car Catalog Count", False, f"Expected 17 cars, got {len(response)}")
        
        return success

    def test_parts_catalog(self):
        """Test parts catalog endpoint"""
        success, response = self.run_test(
            "Get Parts Catalog",
            "GET",
            "parts/catalog",
            200
        )
        
        if success:
            expected_parts = ['intake', 'exhaust', 'turbo', 'ecu', 'clutch', 'transmission', 'suspension', 'tires', 'weight_reduction', 'nitrous']
            found_parts = list(response.keys()) if isinstance(response, dict) else []
            missing_parts = [part for part in expected_parts if part not in found_parts]
            
            if not missing_parts:
                self.log_test("Parts Catalog Completeness", True, f"All {len(expected_parts)} part types found")
                
                # Check tier structure
                if 'intake' in response:
                    tiers = response['intake'].get('tiers', {})
                    expected_tiers = ['ebay', 'rockauto', 'performance']
                    missing_tiers = [tier for tier in expected_tiers if tier not in tiers]
                    if not missing_tiers:
                        self.log_test("Parts Tier Structure", True, "All 3 tiers found (eBay, RockAuto, Performance)")
                    else:
                        self.log_test("Parts Tier Structure", False, f"Missing tiers: {missing_tiers}")
            else:
                self.log_test("Parts Catalog Completeness", False, f"Missing parts: {missing_parts}")
        
        return success

    def test_tournaments(self):
        """Test tournaments endpoint"""
        success, response = self.run_test(
            "Get Tournaments",
            "GET",
            "tournaments",
            200
        )
        
        if success:
            if len(response) == 3:
                self.log_test("Tournament Count", True, f"Found {len(response)} tournaments as expected")
                
                difficulties = [t.get('difficulty') for t in response]
                expected_difficulties = ['easy', 'medium', 'hard']
                if set(difficulties) == set(expected_difficulties):
                    self.log_test("Tournament Difficulties", True, "All 3 difficulty levels present")
                else:
                    self.log_test("Tournament Difficulties", False, f"Expected {expected_difficulties}, got {difficulties}")
            else:
                self.log_test("Tournament Count", False, f"Expected 3 tournaments, got {len(response)}")
        
        return success

    def test_buy_car(self):
        """Test buying a car"""
        if not self.player_id:
            self.log_test("Buy Car", False, "No player ID available")
            return False
        
        # Try to buy Honda Civic Si for $5,000
        success, response = self.run_test(
            "Buy Car (Honda Civic Si)",
            "POST",
            "cars/buy",
            200,
            data={"player_id": self.player_id, "car_id": "civic_si"}
        )
        
        if success:
            if 'car' in response and 'new_cash' in response:
                self.player_car_id = response['car'].get('id')
                expected_cash = 20000 - 5000  # Starting cash - car price
                actual_cash = response['new_cash']
                
                if actual_cash == expected_cash:
                    self.log_test("Cash Update After Purchase", True, f"Cash correctly updated to ${actual_cash}")
                else:
                    self.log_test("Cash Update After Purchase", False, f"Expected ${expected_cash}, got ${actual_cash}")
                
                # Check car data structure
                car_data = response['car']
                required_fields = ['id', 'player_id', 'car_id', 'upgrades', 'catalog', 'effective_stats']
                missing_fields = [field for field in required_fields if field not in car_data]
                if not missing_fields:
                    self.log_test("Purchased Car Data", True, "All required fields present in purchased car")
                else:
                    self.log_test("Purchased Car Data", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Buy Car Response Structure", False, "Missing 'car' or 'new_cash' in response")
        
        return success

    def test_get_player_cars(self):
        """Test getting player's cars"""
        if not self.player_id:
            self.log_test("Get Player Cars", False, "No player ID available")
            return False
        
        success, response = self.run_test(
            "Get Player Cars",
            "GET",
            f"cars/player/{self.player_id}",
            200
        )
        
        if success:
            if len(response) >= 1:
                self.log_test("Player Cars Count", True, f"Player has {len(response)} car(s)")
                
                if response:
                    car = response[0]
                    if car.get('car_id') == 'civic_si':
                        self.log_test("Player Car Verification", True, "Honda Civic Si found in garage")
                    else:
                        self.log_test("Player Car Verification", False, f"Expected civic_si, found {car.get('car_id')}")
            else:
                self.log_test("Player Cars Count", False, "Player should have at least 1 car after purchase")
        
        return success

    def test_upgrade_car(self):
        """Test upgrading a car part"""
        if not self.player_id or not self.player_car_id:
            self.log_test("Upgrade Car", False, "No player or car ID available")
            return False
        
        # Try to buy eBay Cold Air Intake for $200
        success, response = self.run_test(
            "Upgrade Car (eBay Cold Air Intake)",
            "POST",
            "cars/upgrade",
            200,
            data={
                "player_id": self.player_id,
                "player_car_id": self.player_car_id,
                "part_key": "intake",
                "tier": "ebay"
            }
        )
        
        if success:
            if 'car' in response and 'new_cash' in response:
                # Cash should be reduced by $200
                expected_reduction = 200
                new_cash = response['new_cash']
                self.log_test("Cash Update After Upgrade", True, f"Cash updated after upgrade: ${new_cash}")
                
                # Check if upgrade was applied
                car_data = response['car']
                upgrades = car_data.get('upgrades', {})
                if upgrades.get('intake') == 'ebay':
                    self.log_test("Upgrade Applied", True, "eBay intake upgrade successfully applied")
                else:
                    self.log_test("Upgrade Applied", False, f"Expected 'ebay' intake, got {upgrades.get('intake')}")
                
                # Check effective stats
                effective_stats = car_data.get('effective_stats', {})
                if 'effectiveET' in effective_stats and 'effectiveHP' in effective_stats:
                    self.log_test("Effective Stats Calculation", True, "Effective stats calculated after upgrade")
                else:
                    self.log_test("Effective Stats Calculation", False, "Missing effective stats in response")
            else:
                self.log_test("Upgrade Response Structure", False, "Missing 'car' or 'new_cash' in response")
        
        return success

    def test_race_result(self):
        """Test recording a race result"""
        if not self.player_id or not self.player_car_id:
            self.log_test("Race Result", False, "No player or car ID available")
            return False
        
        race_data = {
            "player_id": self.player_id,
            "player_car_id": self.player_car_id,
            "opponent_name": "Test Opponent",
            "opponent_car": "Test Car",
            "player_et": 15.5,
            "opponent_et": 16.0,
            "player_speed": 90.0,
            "opponent_speed": 88.0,
            "result": "win",
            "earnings": 500,
            "race_type": "quick"
        }
        
        success, response = self.run_test(
            "Record Race Result (Win)",
            "POST",
            "race/result",
            200,
            data=race_data
        )
        
        if success:
            # Check if wins and cash were updated
            if 'wins' in response and 'cash' in response:
                wins = response['wins']
                cash = response['cash']
                if wins >= 1:
                    self.log_test("Win Count Update", True, f"Win count updated: {wins}")
                else:
                    self.log_test("Win Count Update", False, f"Win count not updated: {wins}")
                
                self.log_test("Cash Update After Race", True, f"Cash after race: ${cash}")
            else:
                self.log_test("Race Result Response", False, "Missing wins or cash in response")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🏁 Starting Turbo Showdown API Tests")
        print("=" * 50)
        
        # Core API tests
        test_methods = [
            self.test_player_creation,
            self.test_get_player,
            self.test_car_catalog,
            self.test_parts_catalog,
            self.test_tournaments,
            self.test_buy_car,
            self.test_get_player_cars,
            self.test_upgrade_car,
            self.test_race_result
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ FAIL - {test_method.__name__}: Exception occurred: {str(e)}")
                self.tests_run += 1
        
        # Final results
        print("\n" + "=" * 50)
        print(f"🏁 API Testing Complete")
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed ({(self.tests_passed/self.tests_run)*100:.1f}%)")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend APIs are working correctly.")
            return True
        else:
            failed_tests = self.tests_run - self.tests_passed
            print(f"⚠️  {failed_tests} test(s) failed. Check the issues above.")
            return False

def main():
    """Main test execution"""
    tester = TurboShowdownAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())