import os
import unittest

os.environ["TESTING"] = "true"

from peewee import SqliteDatabase

from app import TimelinePost

MODELS = [TimelinePost]

test_db = SqliteDatabase(":memory:")


class TestTimelinePost(unittest.TestCase):
    def setUp(self):
        test_db.bind(MODELS, bind_refs=False, bind_backrefs=False)
        test_db.connect()
        test_db.create_tables(MODELS)

    def tearDown(self):
        test_db.drop_tables(MODELS)
        test_db.close()

    def test_timeline_post(self):
        john = TimelinePost.create(
            name="John Doe", email="john@example.com", content="Hello world, I'm John!"
        )
        assert john.id == 1

        jane = TimelinePost.create(
            name="Jane Doe", email="jane@example.com", content="Hello world, I'm Jane!"
        )
        assert jane.id == 2

        posts = list(TimelinePost.select().order_by(TimelinePost.created_at.desc()))
        assert len(posts) == 2

        newest = posts[0]
        assert newest.id == jane.id
        assert newest.name == "Jane Doe"
        assert newest.email == "jane@example.com"
        assert newest.content == "Hello world, I'm Jane!"
        assert newest.created_at is not None

        oldest = posts[1]
        assert oldest.name == "John Doe"
        assert oldest.created_at is not None

        by_john = list(TimelinePost.select().where(TimelinePost.name == "John Doe"))
        assert len(by_john) == 1
        assert by_john[0].id == john.id
