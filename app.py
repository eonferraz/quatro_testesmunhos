"""Servidor Flask para a Timeline dos Evangelhos."""

import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from werkzeug.middleware.proxy_fix import ProxyFix


BASE_DIR = Path(__file__).resolve().parent


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

    @app.get("/")
    def index():
        return send_from_directory(BASE_DIR, "index.html")

    @app.get("/css/<path:filename>")
    def css(filename: str):
        return send_from_directory(BASE_DIR / "css", filename)

    @app.get("/js/<path:filename>")
    def javascript(filename: str):
        return send_from_directory(BASE_DIR / "js", filename)

    @app.get("/data/<path:filename>")
    def data(filename: str):
        return send_from_directory(BASE_DIR / "data", filename)

    @app.get("/health")
    def health():
        return jsonify(status="ok")

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
