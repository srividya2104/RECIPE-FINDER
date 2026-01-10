
from flask import Flask, render_template, jsonify, request, session, redirect, url_for
import json
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production

# Simple user storage (in production, use a database)
USERS_FILE = 'users.json'
FAVORITES_FILE = 'favorites.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as file:
            return json.load(file)
    return {'admin': 'password'}  # Default user

def save_users(users):
    with open(USERS_FILE, 'w') as file:
        json.dump(users, file)

def load_favorites():
    if os.path.exists(FAVORITES_FILE):
        with open(FAVORITES_FILE, 'r') as file:
            return json.load(file)
    return {}  # Default empty favorites

def save_favorites(favorites):
    with open(FAVORITES_FILE, 'w') as file:
        json.dump(favorites, file)

users = load_users()
favorites_db = load_favorites()

# Reload favorites_db on each request to ensure persistence across app restarts
@app.before_request
def reload_favorites():
    global favorites_db
    favorites_db = load_favorites()

# Load recipes from JSON file
def load_recipes():
    with open('static/recipes.json', 'r') as file:
        return json.load(file)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

        if password != confirm_password:
            return render_template('signup.html', error='Passwords do not match')

        if username in users:
            return render_template('signup.html', error='Username already exists')

        users[username] = password
        save_users(users)
        session['logged_in'] = True
        session['username'] = username
        return redirect(url_for('index'))

    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        # Check against registered users
        if username in users and users[username] == password:
            session['logged_in'] = True
            session['username'] = username
            # Load user-specific favorites into session
            session['favorites'] = [int(fid) for fid in favorites_db.get(username, [])]
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid credentials')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/favorites')
def favorites():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('favorites.html')

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    query = request.args.get('search', '').lower()
    category_filter = request.args.get('category', '').lower()
    recipes = load_recipes()

    filtered_recipes = recipes

    # Apply category filter
    if category_filter:
        filtered_recipes = [r for r in filtered_recipes if r['category'].lower() == category_filter]

    # Apply search filter
    if query:
        filtered_recipes = [
            recipe for recipe in filtered_recipes
            if query in recipe['title'].lower() or
            query in recipe['description'].lower() or
            query in recipe['category'].lower() or
            any(query in ingredient.lower() for ingredient in recipe.get('ingredients', []))
        ]

    return jsonify(filtered_recipes)

@app.route('/api/favorites', methods=['GET', 'POST', 'DELETE'])
def manage_favorites():
    if not session.get('logged_in'):
        return jsonify({'error': 'Not logged in'}), 401

    username = session.get('username')

    if request.method == 'GET':
        favorites = session.get('favorites', [])
        recipes = load_recipes()
        favorite_recipes = [r for r in recipes if r['id'] in favorites]
        return jsonify(favorite_recipes)

    elif request.method == 'POST':
        recipe_id = request.json.get('recipe_id')
        favorites = session.get('favorites', [])
        if recipe_id not in favorites:
            favorites.append(recipe_id)
            session['favorites'] = favorites
            # Save to persistent storage
            favorites_db[username] = favorites
            save_favorites(favorites_db)
        return jsonify({'success': True})

    elif request.method == 'DELETE':
        recipe_id = request.json.get('recipe_id')
        favorites = session.get('favorites', [])
        if recipe_id in favorites:
            favorites.remove(recipe_id)
            session['favorites'] = favorites
            # Save to persistent storage
            favorites_db[username] = favorites
            save_favorites(favorites_db)
        return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
