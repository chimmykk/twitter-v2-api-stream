import tweepy

# Authenticate and authorize your API client
consumer_key = "5hBfsMXOHOBcXHr1bEijuv1pj"
consumer_secret = "Q9aGLBDeJMLI46Pgv3YqEAKbgmEtbRkxjB9o4xE2sYwBNkfG4e"
access_token = "1576014870084030465-1Og1xYzLG3Mn7b1FOVP7h60It7N9tI"
access_token_secret = "8IautMJbEFRA9lgEejHrWEN5p005VdCnhI7XerEH8zBDm"


auth = tweepy.OAuth1UserHandler(consumer_key, consumer_secret, access_token, access_token_secret)
api = tweepy.API(auth)

# Define the tweet status id to like
status_id = "1654539442609176579"

# Use the `favorites/create` endpoint to like the tweet
api.create_favorite(status_id)
