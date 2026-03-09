class RaceCar:
    def __init__(self, make, model, horsepower, weight):
        self.make = make
        self.model = model
        self.horsepower = horsepower
        self.weight = weight
        self.speed = 0  # Speed in mph

    def accelerate(self, time):
        # Simulate acceleration (simple physics model)
        acceleration = (self.horsepower / self.weight) * 100  # A basic formula
        self.speed += acceleration * time  # speed = u + at

    def quarter_mile_time(self):
        # Simplistic quarter-mile calculation based on speed
        return (1320 / (self.speed * 1.46667)) ** 0.5  # Convert mph to seconds

class Race:
    def __init__(self, car1, car2):
        self.car1 = car1
        self.car2 = car2

    def start_race(self):
        time_elapsed = 0
        while True:
            self.car1.accelerate(0.5)  # Accelerate for half a second
            self.car2.accelerate(0.5)
            time_elapsed += 0.5
            if self.car1.quarter_mile_time() < self.car2.quarter_mile_time():
                return f"{self.car1.make} {self.car1.model} wins!"
            elif self.car2.quarter_mile_time() < self.car1.quarter_mile_time():
                return f"{self.car2.make} {self.car2.model} wins!"

# Example usage
if __name__ == "__main__":
    car1 = RaceCar('Ford', 'Mustang', 450, 3500)
    car2 = RaceCar('Chevrolet', 'Camaro', 475, 3600)
    race = Race(car1, car2)
    print(race.start_race())