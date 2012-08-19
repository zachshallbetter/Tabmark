#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
import logging
import datetime
import time
import json


class TTMUser(db.Model):
    tasks = db.TextProperty()
    email = db.EmailProperty()
    lastUpdated = db.DateTimeProperty(auto_now=True)


class MainHandler(webapp.RequestHandler):
    def get(self):
        current_user = users.get_current_user()
        user_k = db.Key.from_path('TTMUser', current_user.user_id())
        user = db.get(user_k)
        if user is None:
            user.tasks = []
            user.email = current_user.email()
            user.put()
        if self.request.get("user"):
            self.response.headers['Content-Type'] = 'text/plain'
            self.response.out.write(user.email)
            return
        serverTime = time.mktime(user.lastUpdated.utctimetuple())
        response = {"email": user.email, "lastUpdated": serverTime}
        localTime = 0
        if self.request.get("time"):
            localTime = float(self.request.get("time"))
        logging.info('Server time: %d, Local time: %d' % (serverTime, localTime))
        if self.request.get("time") is not None and serverTime > localTime:
            response["tasks"] = user.tasks
        self.response.headers['Content-Type'] = 'application/json'
        self.response.out.write(json.JSONEncoder().encode(response))

    def post(self):
        self.response.headers['Content-Type'] = 'text/plain'
        current_user = users.get_current_user()
        user_k = db.Key.from_path('TTMUser', current_user.user_id())
        user = db.get(user_k) or TTMUser(key_name=current_user.user_id())
        tasks = self.request.get("tasks")
        if tasks is not None:
            user.tasks = tasks
        user.put()
        self.response.out.write(time.mktime(user.lastUpdated.utctimetuple()))


app = webapp.WSGIApplication([('/', MainHandler)],
                              debug=True)


def main():
    run_wsgi_app(app)

if __name__ == "__main__":
    main()

SIMPLE_TYPES = (int, long, float, bool, dict, basestring, list)


def to_dict(model):
    output = {}

    for key, prop in model.properties().iteritems():
        value = getattr(model, key)

        if value is None or isinstance(value, SIMPLE_TYPES):
            output[key] = value
        elif isinstance(value, datetime.date):
            # Convert date/datetime to ms-since-epoch ("new Date()").
            ms = time.mktime(value.utctimetuple())
            ms += getattr(value, 'microseconds', 0) / 1000
            output[key] = int(ms)
        elif isinstance(value, db.GeoPt):
            output[key] = {'lat': value.lat, 'lon': value.lon}
        elif isinstance(value, db.Model):
            output[key] = to_dict(value)
        else:
            raise ValueError('cannot encode ' + repr(prop))

    return output
