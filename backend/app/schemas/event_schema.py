from app.extensions import ma
from app.models.event_model import Event, EventParticipant, Category, Match, EventJoinRequest, EventJoinLink, MatchParticipant, ParticipantCategory
from app.schemas.user_schema import ClubSchema

class CategoryWithSeedSchema(ma.Schema):
    id = ma.Int()
    name = ma.Str()
    seed = ma.Int()


class ParticipantCategorySchema(ma.SQLAlchemyAutoSchema):
    category = ma.Nested("CategorySchemaSimple")  # nested category info
    seed = ma.Int()  # expose the seed

    class Meta:
        model = ParticipantCategory
        include_fk = True
        load_instance = True

class EventParticipantSchema(ma.SQLAlchemyAutoSchema):
    club = ma.Nested(ClubSchema)
    categories = ma.Method("get_categories_with_seed")

    def get_categories_with_seed(self, obj):
        return [
            {"id": pc.category.id, "name": pc.category.name, "seed": pc.seed}
            for pc in obj.participant_categories
        ]

    class Meta:
        model = EventParticipant
        include_fk = True
        load_instance = True

class EventParticipantSchemaSimple(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = EventParticipant
        include_fk = True
        load_instance = True

class MatchParticipantSchema(ma.SQLAlchemyAutoSchema):
    participant = ma.Nested(EventParticipantSchemaSimple)
    class Meta:
        model = MatchParticipant
        include_fk = True
        load_instance = True

class MatchSchema(ma.SQLAlchemyAutoSchema):
    participants = ma.Nested(MatchParticipantSchema, many=True)

    class Meta:
        model = Match
        include_fk = True
        load_instance = True

class CategorySchemaFull(ma.SQLAlchemyAutoSchema):
    matches = ma.Nested(MatchSchema, many=True)

    class Meta:
        model = Category
        include_fk = True
        load_instance = True

class CategorySchemaSimple(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Category
        include_fk = True
        load_instance = True

class EventJoinLinkSchema(ma.SQLAlchemyAutoSchema):
    class Meta: 
        model = EventJoinLink
        load_instance = True
        include_fk = True

class EventSchema(ma.SQLAlchemyAutoSchema):
    organizer = ma.Nested(ClubSchema)
    participating_clubs = ma.Nested(ClubSchema, many=True)
    participants = ma.Nested(EventParticipantSchema, many=True)
    categories = ma.Nested(CategorySchemaFull, many=True)
    join_links = ma.Nested(EventJoinLinkSchema, many=True)
    class Meta:
        model = Event
        include_fk = True
        load_instance = True

class EventJoinRequestSchema(ma.SQLAlchemyAutoSchema):
    club = ma.Nested(ClubSchema)
    class Meta:
        model = EventJoinRequest
        include_fk = True
        load_instance = True




event_schema = EventSchema()
events_schema = EventSchema(many=True)
join_requests_schema = EventJoinRequestSchema(many=True)