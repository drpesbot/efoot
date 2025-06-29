from app import app, socketio
import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Render يحدد البورت من هنا
    socketio.run(app, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)