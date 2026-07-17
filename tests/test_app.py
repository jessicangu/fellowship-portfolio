import os
import unittest

os.environ["TESTING"] = "true"

from app import app, mydb, TimelinePost


class AppTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        mydb.drop_tables([TimelinePost])
        mydb.create_tables([TimelinePost])

    def test_home(self):
        resp = self.client.get("/")
        assert resp.status_code == 200

        page = resp.get_data(as_text=True)
        assert "<title>Jessica Nguyen Portfolio</title>" in page
        assert '<span class="hero__tagline-line">recent CS graduate</span>' in page
        assert '<a href="/" class="back-link">' not in page

    def test_timeline(self):
        empty = self.client.get("/api/timeline_post")
        assert empty.status_code == 200
        assert empty.is_json
        assert empty.get_json()["timeline_posts"] == []

        created = self.client.post(
            "/api/timeline_post",
            data={
                "name": "John Doe",
                "email": "john@example.com",
                "content": "Hello world, I'm John!",
            },
        )
        assert created.status_code == 201
        assert created.is_json

        post = created.get_json()
        assert post["id"] == 1
        assert post["name"] == "John Doe"
        assert post["email"] == "john@example.com"
        assert post["content"] == "Hello world, I'm John!"

        posts = self.client.get("/api/timeline_post").get_json()["timeline_posts"]
        assert len(posts) == 1
        assert posts[0]["name"] == "John Doe"
        assert posts[0]["content"] == "Hello world, I'm John!"

        self.client.post(
            "/api/timeline_post",
            data={
                "name": "Jane Doe",
                "email": "jane@example.com",
                "content": "Second post!",
            },
        )
        posts = self.client.get("/api/timeline_post").get_json()["timeline_posts"]
        assert len(posts) == 2
        assert posts[0]["content"] == "Second post!"

    def test_malformed_timeline_post(self):
        missing_name = self.client.post(
            "/api/timeline_post",
            data={"email": "john@example.com", "content": "Hello world, I'm John!"},
        )
        assert missing_name.status_code == 400
        assert "invalid name" in missing_name.get_data(as_text=True)

        empty_content = self.client.post(
            "/api/timeline_post",
            data={"name": "John Doe", "email": "john@example.com", "content": ""},
        )
        assert empty_content.status_code == 400
        assert "invalid content" in empty_content.get_data(as_text=True)

        bad_email = self.client.post(
            "/api/timeline_post",
            data={
                "name": "John Doe",
                "email": "not-an-email",
                "content": "Hello world, I'm John!",
            },
        )
        assert bad_email.status_code == 400
        assert "invalid email" in bad_email.get_data(as_text=True)

        posts = self.client.get("/api/timeline_post").get_json()["timeline_posts"]
        assert posts == []
