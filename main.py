from app import app, socketio
import os

if _name_ == '_main_':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port)
