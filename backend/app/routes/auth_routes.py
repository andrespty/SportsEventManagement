# app/routes/auth.py
from app.services.auth_service import register_user, login_user, get_all_users_by_manager
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.schemas.user_schema import user_schema, users_schema, User
from app.utils.response import *
from app.services.roles_service import manager_required, verify_manager_role
from flask_jwt_extended import jwt_required, create_refresh_token, get_jwt_identity, set_refresh_cookies, unset_jwt_cookies
from flask_cors import cross_origin

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON data"}), 400

    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "user")

    result, code = register_user(email, password, role)
    if code == 201:
        return success_response({
            "access_token": result["access_token"],
            "user": user_schema.dump(result["user"])
        }, code)
    else:
        return error_response(result, code)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON data"}), 400

    email = data.get("email")
    password = data.get("password")

    result, code = login_user(email, password)
    
    if code != 200:
        return jsonify({"error": result}), code

    resp = jsonify({
        "success": True,
        "data":{
            "access_token": result["access_token"],
            "user": user_schema.dump(result["user"])
        }
    })
    set_refresh_cookies(resp, result['refresh_token'])
    return resp, 200

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return success_response({"token": access_token}, 200)

@auth_bp.route("/logout", methods=["POST"])
def logout():
    resp = jsonify({"msg": "Logged out"})
    unset_jwt_cookies(resp)
    return success_response({"message":"Logged Out"}, 200)

@auth_bp.route("/me", methods=["GET"])
@jwt_required() 
def me():
    user_id = get_jwt_identity()   # the identity stored in the access token
    
    # Lookup user in your database
    user = User.query.get(user_id)
    if not user:
        return error_response({"error": "User not found"}, 404)

    return success_response(user_schema.dump(user), 200)

@auth_bp.route("/", methods=["GET", "OPTIONS"])
@manager_required
def get_users():
    result = get_all_users_by_manager()
    return success_response(users_schema.dump(result), 200)


