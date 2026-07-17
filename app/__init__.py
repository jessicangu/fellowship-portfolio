import os
import re
import datetime

from flask import Flask, render_template, request
from dotenv import load_dotenv
from peewee import *
from playhouse.shortcuts import model_to_dict

load_dotenv()

app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

if os.getenv("TESTING") == "true":
    print("Running in test mode")
    mydb = SqliteDatabase(":memory:")
else:
    mydb = MySQLDatabase(
        os.getenv("MYSQL_DATABASE"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        host=os.getenv("MYSQL_HOST"),
        port=3306,
    )

class TimelinePost(Model):
    name = CharField()
    email = CharField()
    content = TextField()
    created_at = DateTimeField(default=datetime.datetime.now)

    class Meta:
        database = mydb

mydb.connect(reuse_if_open=True)
mydb.create_tables([TimelinePost])

print(mydb)

@app.route("/")
def index():
    return render_template(
        "index.html",
        title="Jessica Nguyen Portfolio",
        url=os.getenv("URL"),
    )

EMAIL_REGEX = re.compile(r"[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}")

@app.route("/api/timeline_post", methods=["POST"])
def post_timeline_post():
    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip()
    content = request.form.get("content", "").strip()

    if not name:
        return "invalid name", 400

    if not EMAIL_REGEX.fullmatch(email):
        return "invalid email", 400

    if not content:
        return "invalid content", 400

    timeline_post = TimelinePost.create(
        name=name,
        email=email,
        content=content
    )

    return model_to_dict(timeline_post), 201

@app.route("/api/timeline_post", methods=["GET"])
def get_timeline_post():
    return {
        "timeline_posts": [
            model_to_dict(post)
            for post in TimelinePost.select().order_by(
                TimelinePost.created_at.desc()
            )
        ]
    }

@app.route("/timeline")
def timeline():
    return render_template("timeline.html", title="Timeline")

