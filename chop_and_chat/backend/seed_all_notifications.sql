INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'new_follower', 'New Follower',
       'Jane Smith started following you',
       jsonb_build_object(
         'followerId',   (SELECT id FROM users WHERE email = 'jane@test.com'),
         'followerName', 'Jane Smith'
       ),
       false
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'new_follower'
);

INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'post_likes', 'Post Liked',
       'John Doe liked your post',
       jsonb_build_object(
         'postId',    1,
         'postTitle', 'Your Post',
         'likerId',   (SELECT id FROM users WHERE email = 'john@test.com'),
         'likerName', 'John Doe'
       ),
       false
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.type = 'post_likes'
);

INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'chef_review_received', 'Chef Review',
       'Chef reviewed your post',
       jsonb_build_object(
         'postId',          1,
         'postTitle',       'Your Post',
         'chefReactionId',  1,
         'chefId',          (SELECT id FROM users WHERE email = 'chef@test.com'),
         'chefName',        'Gordon Test'
       ),
       false
FROM users u
WHERE u.role = 'user' AND NOT EXISTS (
  SELECT 1 FROM notifications n
  WHERE n.user_id = u.id AND n.type = 'chef_review_received'
);

INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'comment_on_post', 'New Comment',
       'John Doe commented on your post',
       jsonb_build_object(
         'postId',        1,
         'postTitle',     'Your Post',
         'commentId',     1,
         'commenterId',   (SELECT id FROM users WHERE email = 'john@test.com'),
         'commenterName', 'John Doe',
         'commentText',   'Great post!'
       ),
       false
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.type = 'comment_on_post'
);

INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'chef_review_request', 'Review Request',
       'Test User wants your feedback',
       jsonb_build_object(
         'requestId', 1,
         'postId', 1,
         'requesterName', 'Test User',
         'postTitle', 'Classic Margherita Pizza'
       ),
       false
FROM users u
WHERE u.role = 'chef' AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.type = 'chef_review_request'
);