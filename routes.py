import os
import uuid
from flask import render_template, request, redirect, url_for, flash, jsonify, session
from flask_socketio import emit
from werkzeug.utils import secure_filename
from PIL import Image
from app import app, db, socketio
from models import Player

# Admin password - in production, this should be hashed and stored securely
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "0113023404")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_image(image_path, max_size=(400, 400)):
    """Resize uploaded image to optimize storage"""
    try:
        with Image.open(image_path) as img:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            img.save(image_path, optimize=True, quality=85)
    except Exception as e:
        app.logger.error(f"Error resizing image: {e}")

@app.route('/')
def index():
    players = Player.query.all()
    return render_template('index.html', players=players)

@app.route('/api/check_admin', methods=['POST'])
def check_admin():
    password = request.json.get('password')
    if password == ADMIN_PASSWORD:
        session['is_admin'] = True
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'كلمة مرور خاطئة'})

@app.route('/api/logout_admin', methods=['POST'])
def logout_admin():
    session.pop('is_admin', None)
    return jsonify({'success': True})

@app.route('/api/add_player', methods=['POST'])
def add_player():
    if not session.get('is_admin'):
        return jsonify({'success': False, 'message': 'غير مصرح'})
    
    try:
        # Handle image upload
        image_path = ''
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                # Generate unique filename
                filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Resize image
                resize_image(filepath)
                image_path = f'uploads/{filename}'
        
        # Extract player data
        name = request.form.get('name', '').strip()
        rating = int(request.form.get('rating', 50))
        position = request.form.get('position', '').strip()
        team = request.form.get('team', '').strip()
        nationality = request.form.get('nationality', '').strip()
        age = int(request.form.get('age', 18))
        
        # Extract stats
        stats = {
            'shooting': int(request.form.get('shooting', 50)),
            'passing': int(request.form.get('passing', 50)),
            'dribbling': int(request.form.get('dribbling', 50)),
            'dexterity': int(request.form.get('dexterity', 50)),
            'lower_body_strength': int(request.form.get('lower_body_strength', 50)),
            'aerial_strength': int(request.form.get('aerial_strength', 50)),
            'defending': int(request.form.get('defending', 50)),
            'gk_1': int(request.form.get('gk_1', 50)),
            'gk_2': int(request.form.get('gk_2', 50)),
            'gk_3': int(request.form.get('gk_3', 50))
        }
        
        # Extract playing styles
        playing_styles = []
        for i in range(1, 4):  # Up to 3 playing styles
            style = request.form.get(f'style{i}', '').strip()
            if style:
                playing_styles.append(style)
        
        # Validate required fields
        if not all([name, position, team, nationality]):
            return jsonify({'success': False, 'message': 'جميع الحقول مطلوبة'})
        
        # Create new player
        player = Player(
            name=name,
            rating=rating,
            position=position,
            team=team,
            nationality=nationality,
            age=age,
            image_path=image_path
        )
        player.set_stats(stats)
        player.set_playing_styles(playing_styles)
        
        db.session.add(player)
        db.session.commit()
        
        # Emit real-time update to all clients
        socketio.emit('player_added', player.to_dict(), broadcast=True)
        
        return jsonify({'success': True, 'message': 'تم إضافة اللاعب بنجاح'})
        
    except Exception as e:
        app.logger.error(f"Error adding player: {e}")
        return jsonify({'success': False, 'message': 'حدث خطأ أثناء إضافة اللاعب'})

@app.route('/api/delete_player', methods=['POST'])
def delete_player():
    if not session.get('is_admin'):
        return jsonify({'success': False, 'message': 'غير مصرح'})
    
    try:
        player_id = request.json.get('player_id')
        player = Player.query.get_or_404(player_id)
        
        # Delete image file if exists
        if player.image_path:
            image_file_path = os.path.join('static', player.image_path)
            if os.path.exists(image_file_path):
                os.remove(image_file_path)
        
        player_data = player.to_dict()
        db.session.delete(player)
        db.session.commit()
        
        # Emit real-time update to all clients
        socketio.emit('player_deleted', {'player_id': player_id}, broadcast=True)
        
        return jsonify({'success': True, 'message': 'تم حذف اللاعب بنجاح'})
        
    except Exception as e:
        app.logger.error(f"Error deleting player: {e}")
        return jsonify({'success': False, 'message': 'حدث خطأ أثناء حذف اللاعب'})

@app.route('/api/players')
def get_players():
    players = Player.query.all()
    return jsonify([player.to_dict() for player in players])

@app.route('/api/export_data')
def export_data():
    if not session.get('is_admin'):
        return jsonify({'success': False, 'message': 'غير مصرح'})
    
    players = Player.query.all()
    players_data = [player.to_dict() for player in players]
    
    return jsonify({
        'success': True,
        'data': players_data,
        'total_players': len(players_data)
    })

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    emit('connected', {'message': 'متصل بالخادم'})

@socketio.on('disconnect')
def handle_disconnect():
    pass
