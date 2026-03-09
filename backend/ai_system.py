class AISystem:
    def __init__(self):
        self.level = 1
        self.experience = 0
        self.skill_points = 0

    def gain_experience(self, amount):
        self.experience += amount
        self.check_level_up()

    def check_level_up(self):
        required_experience = 100 * self.level
        if self.experience >= required_experience:
            self.level += 1
            self.skill_points += 5
            print(f'Leveled up! Now at level {self.level}.')

    def spend_skill_points(self, amount):
        if amount <= self.skill_points:
            self.skill_points -= amount
            print(f'Spent {amount} skill points. Remaining: {self.skill_points}')
        else:
            print('Not enough skill points!')

    def get_status(self):
        return {
            'level': self.level,
            'experience': self.experience,
            'skill_points': self.skill_points,
        }