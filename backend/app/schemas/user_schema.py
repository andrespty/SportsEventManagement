from marshmallow import Schema, fields, validate
from app.extensions import ma
from app.models.user_model import User, UserRole, Club

class ClubSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Club
        include_fk = True
        load_instance = True

class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ("password_hash",)
    role = fields.Str(required=True, validate=validate.OneOf([role.value for role in UserRole]))
    clubs = ma.Nested(ClubSchema, many=True)

user_schema = UserSchema()
users_schema = UserSchema(many=True)

club_schema = ClubSchema()
clubs_schema = ClubSchema(many=True)

