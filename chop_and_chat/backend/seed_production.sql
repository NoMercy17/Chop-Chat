-- ============================================================================
-- PRODUCTION SEED — fully idempotent, safe to run multiple times
-- docker exec -it licenta_postgres psql -U licenta_user -d licenta_db < chop_and_chat/backend/seed_production.sql
-- ============================================================================

-- 1. SYSTEM ADMIN
INSERT INTO users (email, password, name, role, bio) VALUES
  ('admin@chopnchat.app', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Chop & Chat', 'chef', 'System account for universal reference recipes.')
ON CONFLICT (email) DO NOTHING;

-- 2. TEST USERS
INSERT INTO users (email, password, name, role, bio) VALUES
  ('user@test.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Test User',    'user', 'Food Enthusiast'),
  ('john@test.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John Doe',     'user', 'Food Enthusiast'),
  ('jane@test.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jane Smith',   'user', 'Food Enthusiast'),
  ('chef@test.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gordon Test',  'chef', 'Professional Chef'),
  ('maria@test.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Maria Garcia', 'chef', 'Professional Chef')
ON CONFLICT (email) DO NOTHING;

-- 3. SAMPLE COMMUNITY POSTS (is_global = false) — exactly 2 posts
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT u.id,
  'Homemade Pizza Margherita',
  'Finally nailed the dough after two failed attempts — crispy base, chewy crust, bubbling mozzarella.',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  '["500g pizza flour","7g instant yeast","300ml warm water","1 tsp salt","2 tbsp olive oil","Tomato passata","Fresh mozzarella","Fresh basil"]'::jsonb,
  'Mix flour, yeast and salt. Add warm water and olive oil, knead 10 minutes until smooth and elastic. Cover, rest 1 hour until doubled.

Preheat oven to 250°C with a heavy baking tray inside.
Stretch dough thin. Spread passata sparingly, tear mozzarella on top.
Slide onto the hot tray, bake 10–12 minutes until crust is golden and cheese is bubbling.
Finish with fresh basil and a drizzle of olive oil.',
  '["oven"]'::jsonb, '1h 30m', 'Medium', false
FROM users u WHERE u.email = 'john@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Homemade Pizza Margherita');

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT u.id,
  'Grandma''s Secret Pasta Recipe',
  'Finally got grandma to share her Sunday carbonara. The key is guanciale and real Pecorino — no cream, ever.',
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
  '["400g spaghetti","200g guanciale","4 egg yolks","1 whole egg","100g Pecorino Romano","50g Parmesan","Coarsely ground black pepper","Salt"]'::jsonb,
  'Cook spaghetti in heavily salted water until al dente. Reserve 200ml pasta water before draining.

Dice guanciale, cook in a dry pan over medium heat until golden and fat renders, about 8 minutes. Remove from heat.

Whisk egg yolks, whole egg, Pecorino, Parmesan and lots of cracked black pepper.

Add drained pasta to guanciale pan (off heat). Pour egg mixture over, tossing vigorously. Add pasta water a splash at a time until silky and coating every strand.

Serve at once with extra Pecorino and black pepper.',
  '["stove","pot","pan"]'::jsonb, '25m', 'Medium', false
FROM users u WHERE u.email = 'jane@test.com'
  AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.user_id = u.id AND p.title = 'Grandma''s Secret Pasta Recipe');

-- 4. CHEF REACTIONS — gordon reacts to Pizza, maria reacts to Pasta
INSERT INTO chef_reactions (chef_id, post_id, reaction_text)
SELECT c.id, p.id,
  'This dough technique is solid — the long rest really develops the gluten. For an even crispier base, try stretching it thinner and pre-heating your baking stone for at least 45 minutes.'
FROM users c, posts p
WHERE c.email = 'gordon@test.com' AND p.title = 'Homemade Pizza Margherita' AND p.is_global = false
ON CONFLICT DO NOTHING;

INSERT INTO chef_reactions (chef_id, post_id, reaction_text)
SELECT c.id, p.id,
  'The carbonara technique here is spot on — removing the pan from heat before adding the egg mixture is the one step most home cooks miss. Your grandma clearly knows what she is doing.'
FROM users c, posts p
WHERE c.email = 'maria@test.com' AND p.title = 'Grandma''s Secret Pasta Recipe' AND p.is_global = false
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. GLOBAL REFERENCE RECIPES (is_global = true — visible to all users)
-- ============================================================================

-- BURGERS & SANDWICHES -------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Classic Smash Burger',
  'A proper smash burger — thin, crispy-edged beef with melted American cheese on a toasted brioche bun. Better than any fast food chain.',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
  '["250g 80/20 ground beef","2 slices American cheese","Brioche bun","Butter","Shredded lettuce","Tomato slices","Pickles","Yellow mustard","Ketchup","Salt"]'::jsonb,
  'Divide beef into two 125g balls — do not overwork the meat.

Butter bun halves and toast cut-side down in a dry pan until golden. Set aside.

Heat a cast iron pan over high heat until smoking. Place beef balls on the surface. Using a flat spatula, smash each one firmly into a thin patty. Season with salt.
Cook 2 minutes until edges are deeply browned and lacy.
Flip, immediately lay cheese on top, cook 1 minute.

Assemble: ketchup and mustard on bottom bun, patty with cheese, pickles, tomato, lettuce, top bun.',
  '["stove","pan"]'::jsonb, '15m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Classic Smash Burger' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Crispy Buttermilk Chicken Sandwich',
  'Buttermilk-brined chicken thigh fried to a shattering golden crust. The brine is everything — do not skip it.',
  'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800',
  '["2 boneless chicken thighs","250ml buttermilk","1 tsp hot sauce","1 cup plain flour","1 tsp garlic powder","1 tsp paprika","Salt and pepper","Brioche buns","Coleslaw","Pickles","Mayo","Neutral oil for frying"]'::jsonb,
  'Mix buttermilk and hot sauce. Submerge chicken and refrigerate at least 2 hours — overnight is better.

Combine flour, garlic powder, paprika, 1 tsp salt and pepper in a shallow bowl.

Remove chicken from brine, letting excess drip off. Dredge in flour, pressing firmly so it adheres. Rest 5 minutes.

Heat 4cm of oil to 175°C in a deep pan. Fry chicken 5–6 minutes per side until deep golden and cooked through (internal 75°C).

Drain on a rack. Assemble with mayo, pickles and coleslaw on a toasted brioche bun.',
  '["stove","pot"]'::jsonb, '30m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Crispy Buttermilk Chicken Sandwich' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Philly Cheesesteak',
  'Paper-thin ribeye, caramelised onions and peppers, smothered in provolone on a hoagie roll. A Philadelphia original.',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
  '["300g ribeye, frozen 30 min then sliced paper-thin","1 green bell pepper","1 large onion","4 slices provolone","2 hoagie rolls","Salt and pepper","Butter"]'::jsonb,
  'Slice onion and pepper into thin strips. Melt butter in a flat pan over medium heat, cook onions and peppers 15 minutes, stirring occasionally, until deeply caramelised. Push to one side.

Increase heat to high. Add sliced beef in a single layer, season, cook 1 minute undisturbed. Flip, break apart slightly, mix with vegetables.

Divide mixture into roll-sized portions. Lay provolone over each. Cover pan 30 seconds to melt.

Scoop onto hoagie rolls with a spatula. Serve immediately.',
  '["stove","pan"]'::jsonb, '25m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Philly Cheesesteak' AND is_global = true);

-- PASTA ----------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Spaghetti Carbonara',
  'The real Roman carbonara — no cream, no shortcuts. Eggs, guanciale, Pecorino and technique. Rich, silky and done in 20 minutes.',
  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800',
  '["400g spaghetti","200g guanciale or pancetta","4 egg yolks","1 whole egg","100g Pecorino Romano, grated","50g Parmesan, grated","Coarsely ground black pepper","Salt"]'::jsonb,
  'Cook spaghetti in heavily salted water until al dente. Reserve 200ml pasta water.

Dice guanciale, cook in a cold dry pan over medium heat, stirring occasionally, until golden and fat renders — about 8 minutes. Remove from heat.

Whisk egg yolks, whole egg, both cheeses and generous black pepper.

Add drained pasta to the guanciale pan (off heat). Add egg mixture immediately, tossing fast. Thin with pasta water a splash at a time until each strand is coated and the sauce looks glossy.

Serve at once with extra Pecorino and black pepper.',
  '["stove","pot","pan"]'::jsonb, '20m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Spaghetti Carbonara' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Pesto alla Genovese',
  'Bright, fresh basil pesto from Genoa — made in 5 minutes in a blender. Toss with trofie or linguine.',
  'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800',
  '["60g fresh basil leaves","30g pine nuts","50g Parmesan, grated","50g Pecorino, grated","2 garlic cloves","120ml extra-virgin olive oil","Salt","400g trofie or linguine"]'::jsonb,
  'Toast pine nuts in a dry pan over medium heat until golden, 3 minutes. Cool.

Blend basil, pine nuts, garlic and a pinch of salt until coarsely chopped.
Add both cheeses. With blender running, stream in olive oil until smooth. Taste and adjust salt.

Cook pasta in heavily salted water until al dente. Reserve a cup of pasta water before draining.

Toss pasta with pesto, loosening with pasta water until every strand is coated. Serve immediately.',
  '["stove","pot","blender"]'::jsonb, '15m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Pesto alla Genovese' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Lasagna Bolognese',
  'A Sunday project worth every minute. Slow-cooked beef and pork ragù layered with béchamel and pasta sheets. Feeds six.',
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
  '["300g ground beef","200g ground pork","1 onion","2 carrots","2 celery stalks","400g canned tomatoes","150ml red wine","Lasagna sheets","500ml whole milk","50g butter","50g flour","100g Parmesan","Nutmeg","Salt and pepper","Olive oil"]'::jsonb,
  'Ragù: finely dice onion, carrot and celery. Sauté in olive oil 10 minutes. Add beef and pork, cook until browned. Add wine, let evaporate. Add tomatoes, season, simmer on low 1.5 hours.

Béchamel: melt butter, whisk in flour, cook 1 minute. Gradually whisk in warm milk until smooth and thick. Season with salt and nutmeg.

Preheat oven to 180°C. Spread thin ragù on base of dish. Layer: pasta sheets, ragù, béchamel, Parmesan. Repeat, finishing with béchamel and Parmesan.

Bake uncovered 40 minutes until golden and bubbling. Rest 15 minutes before serving.',
  '["oven","stove","pot","pan"]'::jsonb, '2h 30m', 'Hard', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Lasagna Bolognese' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Spaghetti Aglio e Olio',
  'Five ingredients, ten minutes, perfect midnight pasta. The emulsification of pasta water and olive oil is the technique worth learning.',
  'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800',
  '["400g spaghetti","6 garlic cloves","120ml extra-virgin olive oil","1 tsp chili flakes","Fresh parsley","Salt","Parmesan (optional)"]'::jsonb,
  'Cook spaghetti in heavily salted boiling water until al dente. Reserve 200ml pasta water.

While pasta cooks, slice garlic very thin. Heat olive oil in a wide pan over medium-low heat. Add garlic and chili flakes. Cook gently, stirring, until garlic turns pale golden — about 4 minutes. Do not let it brown.

Add a ladle of pasta water to the pan — it will sizzle and emulsify with the oil. Add drained pasta and toss vigorously for 2 minutes, adding more pasta water until a light, glossy sauce coats each strand.

Finish with fresh parsley and serve immediately.',
  '["stove","pot","pan"]'::jsonb, '12m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Spaghetti Aglio e Olio' AND is_global = true);

-- ASIAN ----------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Pad Thai',
  'Tangy tamarind noodles with shrimp, tofu, egg and bean sprouts. Thailand''s most iconic street food, made at home.',
  'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?w=800',
  '["200g flat rice noodles","150g shrimp, peeled","100g firm tofu, cubed","2 eggs","100g bean sprouts","3 spring onions","2 garlic cloves","3 tbsp tamarind paste","2 tbsp fish sauce","1 tbsp palm or brown sugar","Crushed peanuts","Lime","Chili flakes","Neutral oil"]'::jsonb,
  'Soak rice noodles in cold water 30 minutes until pliable but still firm. Drain.

Mix sauce: tamarind paste, fish sauce, sugar — it should be sour, salty and slightly sweet.

Heat wok over the highest flame. Add oil, fry tofu until golden, push to side. Add shrimp, cook until pink, push to side. Crack eggs in centre, scramble lightly, mix in when half set.

Add drained noodles and pour over sauce. Toss everything together, pressing noodles against the hot wok surface for 30-second intervals to caramelise slightly.

Add bean sprouts and spring onions, toss 30 seconds. Serve with peanuts, lime and chili flakes.',
  '["stove","wok"]'::jsonb, '25m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Pad Thai' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Vegetable Fried Rice',
  'Day-old cold rice, a screaming hot wok, no crowding. Those three rules are the entire recipe.',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
  '["3 cups day-old cooked rice","2 eggs","1 cup frozen peas and carrots","3 spring onions","3 garlic cloves","3 tbsp soy sauce","1 tbsp oyster sauce","1 tsp sesame oil","Neutral oil","Salt and white pepper"]'::jsonb,
  'Break up cold rice with your hands until all clumps are gone.

Heat wok over the highest flame until smoking. Add 2 tbsp oil.
Fry garlic 20 seconds. Add peas and carrots, toss 2 minutes.

Push veg to sides, crack eggs into the centre. Scramble until just set, mix with vegetables.

Add rice in one layer — do not stir for 1 minute, letting it crisp on the bottom.
Toss vigorously. Repeat frying and tossing twice more.

Add soy sauce, oyster sauce and sesame oil. Toss to combine. Finish with spring onions and white pepper.',
  '["stove","wok"]'::jsonb, '15m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Vegetable Fried Rice' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Beef and Broccoli',
  'Classic Cantonese stir-fry — tender flank steak and crisp broccoli in a savoury oyster sauce glaze. Better than takeout.',
  'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=800',
  '["400g flank steak, sliced thin against the grain","300g broccoli florets","3 garlic cloves","2cm ginger","3 tbsp oyster sauce","2 tbsp soy sauce","1 tbsp Shaoxing wine","1 tsp sesame oil","1 tsp cornstarch","Neutral oil"]'::jsonb,
  'Toss sliced beef with cornstarch, a splash of soy sauce and Shaoxing wine. Marinate 15 minutes.
Mix sauce: oyster sauce, remaining soy sauce, sesame oil, 2 tbsp water.

Blanch broccoli in boiling water 90 seconds. Drain and set aside.

Heat wok over the highest heat. Add oil, sear beef in a single layer 1 minute without touching. Flip, cook 30 seconds. Remove.

Add garlic and ginger, fry 30 seconds. Add broccoli, toss. Return beef. Pour sauce over, toss 1 minute until glossy.

Serve immediately over steamed rice.',
  '["stove","wok","pot"]'::jsonb, '20m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Beef and Broccoli' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Tonkotsu Ramen',
  'Rich, creamy pork bone broth that turns milky white after hours of vigorous boiling. A weekend project that rivals any ramen shop.',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
  '["1kg pork trotters or neck bones","4 garlic cloves","5cm ginger","2 spring onions","Ramen noodles","Chashu pork belly (store-bought or homemade)","Soft-boiled soy-marinated eggs","Bamboo shoots","Nori","Sesame seeds","Sesame oil","Salt"]'::jsonb,
  'Blanch pork bones in boiling water 5 minutes to remove impurities. Drain and rinse well.

Cover bones with fresh water in a large pot. Bring to a vigorous boil and cook uncovered 4 hours, topping up water as needed. The broth will turn milky white.

Add garlic, ginger and spring onions in the last 30 minutes. Strain through a fine sieve. Season well with salt.

Cook ramen noodles according to packet. Halve marinated eggs.

In each bowl: ladle hot broth, add noodles. Top with sliced chashu, egg half, bamboo shoots and nori. Finish with sesame oil and sesame seeds.',
  '["stove","pot"]'::jsonb, '4h 30m', 'Hard', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Tonkotsu Ramen' AND is_global = true);

-- SOUPS & SALADS -------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Roasted Tomato Basil Soup',
  'Roasting concentrates sweetness and kills the acidity. Finished with cream and fresh basil — the most comforting bowl you can make.',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800',
  '["1kg ripe plum tomatoes, halved","1 large onion, quartered","6 garlic cloves","Fresh basil","3 tbsp olive oil","500ml vegetable stock","100ml double cream","Salt, pepper, pinch of sugar"]'::jsonb,
  'Preheat oven to 200°C. Place tomatoes, onion and garlic cut-side up on a baking tray. Drizzle with olive oil, season well. Roast 40 minutes until caramelised at the edges.

Transfer everything to a large saucepan, scraping all the caramelised bits off the tray.
Add vegetable stock, simmer 10 minutes.

Remove from heat, add a handful of fresh basil. Blend until completely smooth.
Stir in cream, taste and adjust seasoning. A pinch of sugar balances any acidity.

Serve hot with crusty bread.',
  '["oven","stove","pot","blender"]'::jsonb, '55m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Roasted Tomato Basil Soup' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Classic Caesar Salad',
  'The original 1924 Caesar — no anchovy fillets in the dressing, just Worcestershire. Crisp romaine, hand-torn croutons, shaved Parmesan.',
  'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800',
  '["2 romaine hearts","80g Parmesan, shaved","2 thick baguette slices","3 tbsp olive oil","1 egg yolk","1 tsp Dijon mustard","1 tsp Worcestershire sauce","2 tbsp lemon juice","1 small garlic clove","Salt and black pepper"]'::jsonb,
  'Croutons: tear baguette into rough chunks, toss with olive oil and salt. Bake at 190°C for 12 minutes until golden. Cool.

Dressing: crush garlic with salt to a paste. Whisk with egg yolk, Dijon and Worcestershire. Add lemon juice, then slowly drizzle in olive oil, whisking to emulsify. Season generously.

Separate romaine into large pieces. Dry thoroughly — water ruins this dressing.

Toss lettuce with dressing until every leaf is coated. Top with croutons and shaved Parmesan.',
  '["oven"]'::jsonb, '20m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Classic Caesar Salad' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'French Onion Soup',
  'An hour and a half of slowly caramelised onions rewarded by the most warming bowl of soup imaginable. Non-negotiable: oven-safe bowls.',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=800',
  '["1.5kg yellow onions, thinly sliced","4 tbsp butter","1 tbsp olive oil","200ml dry white wine","1.5L beef stock","2 thyme sprigs","1 bay leaf","Salt and pepper","4 baguette slices, toasted","200g Gruyère, grated"]'::jsonb,
  'Melt butter and oil in a large heavy pot over medium-low heat. Add all onions and a pinch of salt. Cook 1–1.5 hours, stirring every 10 minutes, until deeply golden and jammy. Do not rush this.

Increase to medium, add wine, bubble 3 minutes. Add stock, thyme and bay leaf. Simmer 30 minutes. Season.

Ladle into oven-safe bowls. Float a toasted baguette slice on top, cover generously with Gruyère.
Grill 3–4 minutes until cheese is bubbling and speckled brown. Serve immediately.',
  '["stove","pot","oven"]'::jsonb, '2h', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'French Onion Soup' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Greek Salad',
  'No dressing required — just really good olive oil, dried oregano and ripe tomatoes. The Cretan way: no lettuce, no fuss.',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
  '["3 large ripe tomatoes","1 cucumber","1 red onion","150g kalamata olives","200g block of feta","3 tbsp extra-virgin olive oil","1 tsp dried oregano","Salt and black pepper"]'::jsonb,
  'Cut tomatoes into thick wedges, cucumber into half-moons (unpeeled), and red onion into thin rings.

Arrange in a wide shallow bowl or plate. Scatter olives over the top.

Lay the whole block of feta on top — do not crumble it.

Drizzle generously with olive oil. Sprinkle oregano over everything, season with salt and black pepper.

Serve with crusty bread. Do not toss — let each person break into the feta themselves.',
  '[]'::jsonb, '10m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Greek Salad' AND is_global = true);

-- BREAKFAST ------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Perfect Scrambled Eggs',
  'Low heat, constant movement, off the heat before they look done. Finished with crème fraîche — the creamiest scrambled eggs you''ve had.',
  'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800',
  '["6 eggs","2 tbsp butter","2 tbsp crème fraîche","Salt","Fresh chives","Sourdough toast"]'::jsonb,
  'Crack all eggs into a cold non-stick pan. Add butter. Do not whisk yet.

Place over medium heat. Stir constantly with a silicone spatula, folding eggs slowly from the edges inward.

Every 30 seconds: remove pan from heat, stir 10 seconds, return. Repeat this on-off process 4–5 times over about 8 minutes. The eggs will slowly thicken into large, soft curds.

When they are glossy and slightly underdone, remove from heat entirely.
Stir in crème fraîche immediately — it stops the cooking and adds richness. Season with salt.

Serve on warm sourdough with snipped chives.',
  '["stove","pan"]'::jsonb, '10m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Perfect Scrambled Eggs' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Fluffy Buttermilk Pancakes',
  'The secret: buttermilk reacting with baking soda for lift, and never over-mixing — lumps in the batter are intentional.',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
  '["250g plain flour","2 tsp baking powder","1/2 tsp baking soda","1 tsp salt","2 tbsp sugar","350ml buttermilk","2 eggs","3 tbsp melted butter","Extra butter for cooking","Maple syrup and berries to serve"]'::jsonb,
  'Whisk flour, baking powder, baking soda, salt and sugar in a large bowl.

In a separate bowl, whisk buttermilk, eggs and melted butter.

Pour wet into dry. Fold gently until just combined — lumps are fine and expected. Rest 5 minutes.

Heat a non-stick pan over medium heat. Melt a small knob of butter.
Pour in 80ml portions. Cook until bubbles form across the surface and edges look dry, about 2 minutes.
Flip and cook 1 minute.

Serve stacked with butter, maple syrup and fresh berries.',
  '["stove","pan"]'::jsonb, '20m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Fluffy Buttermilk Pancakes' AND is_global = true);


INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Avocado Toast with Poached Egg',
  'Properly poached eggs on smashed avocado with chili flakes and lemon. The technique for poaching is simpler than it looks.',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800',
  '["2 slices sourdough","1 ripe avocado","2 eggs","1 tbsp white wine vinegar","Lemon juice","Chili flakes","Salt and black pepper","Extra-virgin olive oil","Optional: everything bagel seasoning"]'::jsonb,
  'Toast sourdough until golden and firm.

Halve and pit avocado. Scoop flesh onto toast and smash with a fork. Season with lemon juice, salt and pepper.

For the eggs: bring a wide saucepan of water to a gentle simmer (not boiling). Add vinegar. Crack each egg into a small cup.
Stir the water to create a gentle whirlpool. Slide eggs in one at a time.
Cook 3 minutes for a runny yolk. Lift out with a slotted spoon, drain briefly on paper towel.

Place poached eggs on the smashed avocado. Finish with chili flakes, a drizzle of olive oil and black pepper.',
  '["stove","pot"]'::jsonb, '15m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Avocado Toast with Poached Egg' AND is_global = true);

-- CHICKEN --------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Crispy Roasted Chicken Thighs',
  'Completely dry skin and a very hot oven — two rules that guarantee genuinely crispy chicken thighs every single time.',
  'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800',
  '["6 bone-in skin-on chicken thighs","2 tsp garlic powder","1 tsp smoked paprika","1 tsp dried thyme","1 tsp salt","1/2 tsp black pepper","1 tbsp olive oil"]'::jsonb,
  'Preheat oven to 220°C (200°C fan). Line a baking tray with foil.

Pat chicken thighs completely dry with paper towels — this is the single most important step.

Mix garlic powder, paprika, thyme, salt and pepper. Rub chicken with olive oil, then coat thoroughly with the spice mix, pressing it into the skin.

Arrange skin-side up on the tray, leaving space between pieces.
Roast 38–42 minutes until skin is deep golden and crackly.
Internal temperature should reach 75°C.

Rest 5 minutes before serving.',
  '["oven"]'::jsonb, '45m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Crispy Roasted Chicken Thighs' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Chicken Tikka Masala',
  'Charred yoghurt-marinated chicken in a rich, aromatic tomato cream sauce. One of the most popular dishes in the world — now reproducible at home.',
  'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800',
  '["600g chicken thigh","200ml full-fat yoghurt","2 tsp garam masala","1 tsp cumin","1 tsp turmeric","1 tsp chili powder","Salt","2 tbsp oil","1 large onion","4 garlic cloves","3cm ginger","400g canned tomatoes","200ml double cream","1 tsp sugar","Fresh coriander","Basmati rice or naan"]'::jsonb,
  'Cube chicken, mix with yoghurt, 1 tsp garam masala, cumin, turmeric, chili and 1 tsp salt. Marinate at least 1 hour (overnight is better).

Grill or pan-fry chicken over high heat until charred in spots, about 8 minutes. Set aside.

Sauté diced onion in oil until golden, 12 minutes. Add minced garlic and ginger, cook 2 minutes. Add remaining 1 tsp garam masala, cook 1 minute. Add tomatoes, simmer 15 minutes.
Blend until smooth. Return to pan. Add cream, sugar and chicken.
Simmer 10 minutes.

Serve over basmati rice or with naan, topped with fresh coriander.',
  '["stove","pan","blender"]'::jsonb, '45m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Chicken Tikka Masala' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Honey Garlic Chicken Wings',
  'Sticky, glossy wings with a lacquered honey garlic glaze. Bake first for crispiness, then toss in sauce and broil for two minutes.',
  'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800',
  '["1kg chicken wings, tips removed","1 tsp baking powder","Salt and pepper","4 garlic cloves, minced","4 tbsp honey","2 tbsp soy sauce","1 tbsp butter","1 tsp chili flakes","Spring onions and sesame seeds to finish"]'::jsonb,
  'Preheat oven to 200°C. Pat wings completely dry. Toss with baking powder, salt and pepper — the baking powder draws out moisture and makes them extra crispy.

Arrange on a wire rack set over a baking tray. Bake 45 minutes, flipping once, until deeply golden and crisp.

While wings bake, melt butter in a small saucepan. Add garlic, cook 1 minute. Add honey, soy sauce and chili flakes. Simmer 3 minutes until slightly thickened.

Toss baked wings in the glaze. Return to the rack and broil on high 2 minutes until sticky and caramelised.
Finish with spring onions and sesame seeds.',
  '["oven","stove","pot"]'::jsonb, '55m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Honey Garlic Chicken Wings' AND is_global = true);

-- SEAFOOD --------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Pan-Seared Salmon',
  'Restaurant-quality salmon with genuinely crispy skin. The single technique worth learning: press the fillet flat for the first 60 seconds.',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
  '["4 salmon fillets, skin-on","2 tbsp olive oil","2 tbsp butter","2 garlic cloves","Lemon","Salt and black pepper","Fresh dill or parsley"]'::jsonb,
  'Remove salmon from the fridge 15 minutes before cooking. Pat the skin completely dry with paper towels. Season both sides with salt and pepper.

Heat olive oil in a stainless steel or cast iron pan over medium-high heat until shimmering.

Place salmon skin-side down. Using a spatula, press each fillet firmly against the pan for 60 seconds to stop the skin from curling.
Cook undisturbed 4 minutes until flesh is opaque about 3/4 of the way up.

Flip, add butter and garlic. Baste with foaming butter for 1–2 minutes.
Serve immediately with lemon and fresh herbs.',
  '["stove","pan"]'::jsonb, '15m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Pan-Seared Salmon' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Garlic Butter Shrimp',
  'Ten-minute dinner that tastes like it took an hour. Serve over pasta, rice, or with crusty bread to soak up every drop of the sauce.',
  'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800',
  '["500g large shrimp, peeled and deveined","5 garlic cloves, minced","3 tbsp butter","2 tbsp olive oil","100ml dry white wine","Juice of 1 lemon","1 tsp chili flakes","Fresh parsley","Salt and pepper"]'::jsonb,
  'Pat shrimp completely dry. Season with salt and pepper.

Heat olive oil in a large pan over high heat until smoking. Add shrimp in a single layer — do not overcrowd. Cook 1 minute until pink on the bottom. Flip, cook 30 seconds. Remove from pan.

Reduce heat to medium. Add butter and garlic, cook 1 minute until fragrant.
Add wine, reduce by half — about 2 minutes. Add lemon juice and chili flakes.

Return shrimp, toss to coat, cook 30 seconds. Finish with fresh parsley. Serve immediately.',
  '["stove","pan"]'::jsonb, '10m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Garlic Butter Shrimp' AND is_global = true);

-- DESSERTS -------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Chocolate Lava Cake',
  'Warm, molten-centred chocolate cake that takes 20 minutes to make. The trick is exact timing — 12 minutes at 200°C, not a second more.',
  'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800',
  '["200g dark chocolate (70%)","200g butter","4 eggs","4 egg yolks","200g icing sugar","60g plain flour","Cocoa powder for dusting","Vanilla ice cream to serve"]'::jsonb,
  'Preheat oven to 200°C. Butter 6 ramekins generously and dust with cocoa powder, tapping out excess.

Melt chocolate and butter in a heatproof bowl set over simmering water. Stir until smooth. Cool slightly.

Whisk eggs, yolks and icing sugar until thick and pale, about 3 minutes.
Fold in melted chocolate. Sift in flour and fold until just combined.

Divide among ramekins. At this point they can be refrigerated up to 24 hours.

Bake exactly 12 minutes — edges set, centre still jiggles. Run a knife around each, invert onto plates immediately.
Serve at once with vanilla ice cream.',
  '["oven","mixer"]'::jsonb, '25m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Chocolate Lava Cake' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Classic Tiramisu',
  'No-bake Italian dessert — coffee-soaked ladyfingers layered with mascarpone cream. Better made the day before. Feeds eight.',
  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
  '["500g mascarpone","4 eggs, separated","120g caster sugar","300ml strong espresso, cooled","3 tbsp Marsala or coffee liqueur","200g savoiardi (ladyfingers)","Cocoa powder for dusting"]'::jsonb,
  'Beat egg yolks and sugar until thick and pale yellow, about 5 minutes.
Stir in mascarpone until smooth.

Whisk egg whites to stiff peaks in a clean bowl. Fold into mascarpone in three additions.

Mix espresso and Marsala in a shallow bowl.
Dip each ladyfinger in coffee for 2 seconds per side — no longer or they become soggy.

Layer soaked ladyfingers in a dish. Spread half the cream over top. Repeat layers.
Dust generously with cocoa through a sieve.

Refrigerate at least 4 hours, overnight preferred.',
  '["mixer"]'::jsonb, '30m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Classic Tiramisu' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Apple and Cinnamon Crumble',
  'Sharp Bramley apples under a buttery oat crumble. British comfort food at its finest — served warm with vanilla custard or ice cream.',
  'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800',
  '["1kg Bramley or Granny Smith apples","2 tbsp caster sugar","1 tsp cinnamon","150g plain flour","100g cold butter, cubed","75g rolled oats","100g demerara sugar","Pinch of salt"]'::jsonb,
  'Preheat oven to 190°C.
Peel, core and slice apples. Toss with caster sugar and cinnamon in a baking dish.

Crumble: rub cold butter into flour with your fingertips until it resembles coarse breadcrumbs. Stir in oats, demerara sugar and salt.

Spread crumble evenly over apples without pressing it down — keeping it loose gives better texture.

Bake 35–40 minutes until topping is deep golden and apple juices bubble around the edges.
Rest 10 minutes. Serve with ice cream or warm vanilla custard.',
  '["oven"]'::jsonb, '55m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Apple and Cinnamon Crumble' AND is_global = true);


-- VEGETARIAN -----------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Mushroom Risotto',
  'Creamy, deeply savoury risotto with mixed mushrooms. Give it your full attention for 20 minutes of constant stirring and it repays you completely.',
  'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=800',
  '["320g Arborio rice","500g mixed mushrooms (porcini, chestnut, cremini)","1 onion","3 garlic cloves","150ml dry white wine","1.2L hot vegetable stock","50g cold butter","50g Parmesan, grated","2 tbsp olive oil","Fresh thyme","Salt and pepper"]'::jsonb,
  'Keep stock warm in a separate saucepan on low heat.

Sauté mushrooms in 1 tbsp butter over high heat until golden and all moisture has evaporated, about 5–7 minutes. Season, set aside.

In a wide, heavy pan, soften diced onion in olive oil 8 minutes. Add garlic and thyme, cook 1 minute.
Add rice, stir to toast 2 minutes. Pour in wine, stir until absorbed.

Add hot stock one ladleful at a time, stirring frequently, waiting until each addition is absorbed. This takes 17–20 minutes. Rice should be al dente and creamy.

Remove from heat. Stir in cold butter and Parmesan vigorously — this creates the emulsion that gives risotto its creaminess. Fold in mushrooms. Season and serve immediately.',
  '["stove","pot","pan"]'::jsonb, '40m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Mushroom Risotto' AND is_global = true);

INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Black Bean Tacos',
  'Smoky, spiced black beans in warm corn tortillas with pickled onion, avocado and lime. Ready in 20 minutes, endlessly customisable.',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  '["2 cans black beans (400g each), drained","1 tsp cumin","1 tsp smoked paprika","1/2 tsp chili powder","2 garlic cloves","Lime juice","Corn or flour tortillas","1 avocado","Red onion, thinly sliced","Coriander","Sour cream or yoghurt","Salt and olive oil"]'::jsonb,
  'Quick pickled onion: slice red onion thin, cover with lime juice and a pinch of salt. Leave 15 minutes.

Heat olive oil in a pan over medium heat. Add minced garlic, cumin, paprika and chili, cook 1 minute.
Add drained beans, stir to coat. Add 3 tbsp water, season with salt. Cook 5 minutes, mashing some beans lightly.

Warm tortillas directly over a gas flame or in a dry pan until charred in spots.

Assemble: spoon beans onto tortillas, top with sliced avocado, pickled onion, fresh coriander and a dollop of sour cream. Finish with a generous squeeze of lime.',
  '["stove","pan"]'::jsonb, '20m', 'Easy', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Black Bean Tacos' AND is_global = true);

-- BAKING ---------------------------------------------------------------------
INSERT INTO posts (user_id, title, description, image_url, ingredients, instructions, utensils, cook_time, difficulty, is_global)
SELECT id, 'Classic Chocolate Chip Cookies',
  'Crispy edges, chewy centres, pools of dark chocolate. Chilling the dough overnight is the step most people skip — and the most important one.',
  'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
  '["225g unsalted butter, browned","200g caster sugar","200g light brown sugar","2 eggs plus 1 yolk","2 tsp vanilla extract","360g plain flour","1 tsp baking soda","1 tsp salt","300g dark chocolate, roughly chopped","Flaky sea salt for finishing"]'::jsonb,
  'Brown the butter in a light-coloured saucepan over medium heat, swirling occasionally, until it smells nutty and turns amber. Pour into a bowl and cool 10 minutes.

Whisk brown butter with both sugars until combined. Beat in eggs, extra yolk and vanilla until pale and thick.

Fold in flour, baking soda and salt until almost combined. Fold in chopped chocolate.

Cover and refrigerate at least 24 hours — this dries the dough and intensifies flavour.

When ready, preheat oven to 190°C. Scoop 60g balls onto lined baking trays, leaving 5cm between each.
Bake 10–12 minutes until edges are set and golden but centres still look underdone. They firm up as they cool.
Immediately sprinkle with flaky salt.',
  '["oven","mixer","stove","pan"]'::jsonb, '30m', 'Medium', true
FROM users WHERE email = 'admin@chopnchat.app'
  AND NOT EXISTS (SELECT 1 FROM posts WHERE title = 'Classic Chocolate Chip Cookies' AND is_global = true);

-- NOTIFICATIONS (idempotent) -------------------------------------------------
INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'new_follower', 'New Follower', 'Jane Smith started following you',
  jsonb_build_object('followerName', 'Jane Smith'), false
FROM users u WHERE u.email = 'user@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.type = 'new_follower' AND n.subtitle = 'Jane Smith started following you'
  );

INSERT INTO notifications (user_id, type, title, subtitle, data, is_read)
SELECT u.id, 'post_likes', 'Post Liked', 'John Doe liked your pizza',
  jsonb_build_object('postTitle', 'Homemade Pizza Margherita'), false
FROM users u WHERE u.email = 'user@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.type = 'post_likes' AND n.subtitle = 'John Doe liked your pizza'
  );
