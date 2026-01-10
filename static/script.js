// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Fetch and display recipes
async function loadRecipes(query = '', category = '') {
    try {
        const params = new URLSearchParams();
        if (query) params.append('search', query);
        if (category) params.append('category', category);
        const response = await fetch(`/api/recipes?${params}`);
        const recipes = await response.json();
        const recipeGrid = document.getElementById('recipeGrid');
        recipeGrid.innerHTML = '';

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <p>${recipe.description}</p>
                <div class="card-actions">
                    <a href="#" class="view-recipe" data-id="${recipe.id}">View Recipe</a>
                    <button class="favorite-btn" data-id="${recipe.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            `;
            recipeGrid.appendChild(card);
        });

        // Add click event for recipe details
        document.querySelectorAll('.view-recipe').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = e.target.getAttribute('data-id');
                showRecipeDetails(recipeId, recipes);
            });
        });

        // Add favorite button events
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const recipeId = parseInt(e.currentTarget.getAttribute('data-id'));
                toggleFavorite(recipeId);
            });
        });
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    loadRecipes(query);
});

// Category filter
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
        const category = card.getAttribute('data-category');
        loadRecipes(category);
    });
});

// Newsletter form submission
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    alert(`Thank you for subscribing with ${email}!`);
    e.target.reset();
});

// Show recipe details
function showRecipeDetails(recipeId, recipes) {
    const recipe = recipes.find(r => r.id == recipeId);
    if (!recipe) return;

    const ingredients = recipe.ingredients ? recipe.ingredients.map(ing => `<li>${ing}</li>`).join('') : '';
    const instructions = recipe.instructions ? recipe.instructions.map(inst => `<li>${inst}</li>`).join('') : '';

    const modal = document.createElement('div');
    modal.className = 'recipe-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${recipe.title}</h2>
            <img src="${recipe.image}" alt="${recipe.title}">
            <p>${recipe.description}</p>
            <h3>Ingredients</h3>
            <ul>${ingredients}</ul>
            <h3>Instructions</h3>
            <ol>${instructions}</ol>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Toggle favorite
async function toggleFavorite(recipeId) {
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipe_id: recipeId })
        });
        if (response.ok) {
            loadFavorites();
            // Update button state
            const btn = document.querySelector(`.favorite-btn[data-id="${recipeId}"]`);
            if (btn) btn.classList.toggle('favorited');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// Load favorites
async function loadFavorites() {
    try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
            const favorites = await response.json();
            const favoritesGrid = document.getElementById('favoritesGrid');
            favoritesGrid.innerHTML = '';

            if (favorites.length === 0) {
                favoritesGrid.innerHTML = '<p>No favorite recipes yet.</p>';
                return;
            }

            favorites.forEach(recipe => {
                const card = document.createElement('div');
                card.className = 'recipe-card';
                card.innerHTML = `
                    <img src="${recipe.image}" alt="${recipe.title}">
                    <h3>${recipe.title}</h3>
                    <p>${recipe.description}</p>
                    <div class="card-actions">
                        <a href="#" class="view-recipe" data-id="${recipe.id}">View Recipe</a>
                        <button class="favorite-btn favorited" data-id="${recipe.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                `;
                favoritesGrid.appendChild(card);
            });

            // Add events for favorites
            document.querySelectorAll('#favoritesGrid .view-recipe').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const recipeId = e.target.getAttribute('data-id');
                    showRecipeDetails(recipeId, favorites);
                });
            });

            document.querySelectorAll('#favoritesGrid .favorite-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const recipeId = parseInt(e.currentTarget.getAttribute('data-id'));
                    await fetch('/api/favorites', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recipe_id: recipeId })
                    });
                    loadFavorites();
                });
            });
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Category filter dropdown
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    const category = e.target.value;
    loadRecipes('', category);
});

// Load favorites on favorites page
async function loadFavoritesPage() {
    try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
            const recipes = await response.json();
            const favoritesGrid = document.getElementById('favoritesGrid');
            const noFavorites = document.getElementById('noFavorites');

            if (recipes.length === 0) {
                favoritesGrid.style.display = 'none';
                noFavorites.style.display = 'block';
            } else {
                favoritesGrid.style.display = 'grid';
                noFavorites.style.display = 'none';
                favoritesGrid.innerHTML = '';

                recipes.forEach(recipe => {
                    const card = document.createElement('div');
                    card.className = 'recipe-card';
                    card.innerHTML = `
                        <img src="${recipe.image}" alt="${recipe.title}">
                        <h3>${recipe.title}</h3>
                        <p>${recipe.description}</p>
                        <div class="card-actions">
                            <a href="#" class="view-recipe" data-id="${recipe.id}">View Recipe</a>
                            <button class="favorite-btn favorited" data-id="${recipe.id}">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    `;
                    favoritesGrid.appendChild(card);
                });

                // Add click event for recipe details
                document.querySelectorAll('.view-recipe').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const recipeId = e.target.getAttribute('data-id');
                        showRecipeDetails(recipeId, recipes);
                    });
                });

                // Add click event for favorite buttons
                document.querySelectorAll('.favorite-btn').forEach(button => {
                    button.addEventListener('click', toggleFavorite);
                });
            }
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

// Load recipes and favorites on page load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/favorites') {
        loadFavoritesPage();
    } else {
        loadRecipes();
        // Only load favorites if logged in (check via API or assume from UI)
        if (document.querySelector('.auth-links span')) {
            loadFavorites();
        }
    }
});
