from app import db
from datetime import datetime
import json

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    position = db.Column(db.String(10), nullable=False)
    team = db.Column(db.String(100), nullable=False)
    nationality = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    image_path = db.Column(db.String(200), default='')
    
    # Player stats as JSON string
    stats = db.Column(db.Text, default='{}')
    
    # Playing styles as JSON string
    playing_styles = db.Column(db.Text, default='[]')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_stats(self):
        """Get player stats as dictionary"""
        try:
            return json.loads(self.stats) if self.stats else {}
        except:
            return {}
    
    def set_stats(self, stats_dict):
        """Set player stats from dictionary"""
        self.stats = json.dumps(stats_dict)
    
    def get_playing_styles(self):
        """Get playing styles as list"""
        try:
            return json.loads(self.playing_styles) if self.playing_styles else []
        except:
            return []
    
    def set_playing_styles(self, styles_list):
        """Set playing styles from list"""
        self.playing_styles = json.dumps(styles_list)
    
    def to_dict(self):
        """Convert player to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'rating': self.rating,
            'position': self.position,
            'team': self.team,
            'nationality': self.nationality,
            'age': self.age,
            'image_path': self.image_path,
            'stats': self.get_stats(),
            'playing_styles': self.get_playing_styles(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
