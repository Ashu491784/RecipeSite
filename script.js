
const API_CONFIG = {
    APP_ID:  '02a7b0c5',
    APP_KEY: 'fe5994f27d0d0c65c1c46610e93285e3',
    USER_ID: 'Ashu0406',
    BASE_URL: 'https://api.edamam.com/api/recipes/v2'

}


//DOM ELEMENT USE
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const recipeContainer = document.getElementById('recipes-container');
const quickSearchBtns = document.querySelectorAll('.quick-search');
const showFavoritesBtn = document.getElementById('show-favorites');
const recipeModal = new bootstrap.Modal(document.getElementById('recipeModal'));
const recipeModalTitle = document.getElementById('recipeModalTitle');
const recipeModalBody = document.getElementById('recipeModalBody');
const saveRecipeBtn = document.getElementById('save-recipe-btn');
const favoritesModal = new bootstrap.Modal(document.getElementById('favoritesModal'));
const favoritesModalBody = document.getElementById('favoritesModalBody');
const noFavoritesMessage = document.getElementById('no-favorites-message');

let currentRecipes = [];
let currentRecipesDetails = null;
let favourites = JSON.parse(localStorage.getItem('recipeFavourites')) || [];

function init(){
    //set event listener
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e){
        if(e.key == 'Enter') handleSearch(); //enter key eka gahuwth search wenawa
    });

    quickSearchBtns.forEach(btn => {
        btn.addEventListener('click', function(){
            searchInput.value = this.dataset.query; //index eke button tikata values set karagen thiyenw (chicken, seafood)
            handleSearch();
        })
    });
    showFavoritesBtn.addEventListener('click', showFavourites);
    saveRecipeBtn.addEventListener('click', toggleFavourite);

    renderFavourites();
}

function handleSearch(){

    const query = searchInput.value.trim(); //string ekaka space ain karanaw trim eken
    if(query){
        fetchRecipers(query);
    }else{
        alert('please enter a food name');
    }
}

async function fetchRecipers(query){ //API ekata call karanwa (async unction ekak ganne multi taskin wada walata)
    try{
     showLoadingState();

     const url = new URL(API_CONFIG.BASE_URL);
     url.searchParams.append('type', 'public'); 
     url.searchParams.append('q', query);
     url.searchParams.append('app_id', API_CONFIG.APP_ID);
     url.searchParams.append('app_key', API_CONFIG.APP_KEY);
     url.searchParams.append('to', '12');

     const response = await fetch(url, {
        headers:{
            'Edamam-Account-User': API_CONFIG.USER_ID
        }
     });

     if(!response.ok){
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fail to fetch recipes')
     }
    const data = await response.json();
    currentRecipes = data.hits.map(hit => hit.recipe);

    if(currentRecipes.length === 0){
        showResultMessage(query);
    }else{
        renderRecipe(currentRecipes);
       // alert(currentRecipes);
    }


    }  catch(error){
        showErrorMessage(error);
    }  

}

function showLoadingState(){
    recipeContainer.innerHTML = `
    <div class="col-12 text-center">
    <div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading....</span>
    </div>
    <P class="mt-2">Search for recipes...</P>
    </div>
    `;
}

function showResultMessage(query){}

function showErrorMessage(error){
    console.error('Error', error);
    recipeContainer.innerHTML = `
        <div class="col-12 text-center text-danger">
            <i class="bi bi-exclamation-triangle display-4"></i>
            <h3 class="mt-3">Error Loading Recipes</h3>
            <p>${error.message}</p>
        </div>
    `;
}

function renderRecipe(recipes){
    recipeContainer.innerHTML = '';
    recipes.forEach(recipe =>{
        const isFavourite = favourites.some(fav => fav.uri === recipe.uri);

        const recipeCard = document.createElement('div');
        recipeCard.className = 'col-md-6 col-lg-4 mb-4';
        recipeCard.innerHTML = `
            <div class="recipe-card card h-100">
            <img src=${recipe.image} class="recipe-img card-img-top" alt="${recipe.label}">
            <div class="card-body">
            <h5 class="card-title">${recipe.label}</h5>
            <p class="card-text text-muted">${recipe.source}</p>
            <div class="d-flex flex-wrap mb-2">
                ${recipe.healthLabels.slice(0,3).map(label =>`
                    <span class="badge bg-light text-dark health-label">${label}</span>
                    `).join('')}
            </div>
            <button class="btn btn-outline-primary btn-sm view-recipe" data-uri="${recipe.uri}">
                    <i class="bi bi-eye"></i> View Recepe....
            </button>

           ${isFavourite ? `<button class="btn btn-primary btn-sm ms-2 favorite-btn" data-uri="${recipe.uri}">
                    <i class="bi bi-heart-fill"></i> saved
           </button> `:
           `<button class="btn btn-online-secondary btn-sm ms-2 favorite-btn" data-uri="${recipe.uri}">
           <i class="bi bi-heart"></i> save
           </button>`}
            </div>
            </div>
        `;
        recipeContainer.appendChild(recipeCard);
    });
    addRecipeEventListeners();
}

//add event listener to the recipe button
function addRecipeEventListeners(){
    document.querySelectorAll('.view-recipe').forEach(btn =>{
        btn.addEventListener('click', function(){
            const uri = this.dataset.uri;
            showReciperDetails(uri);
        });
    });
    document.querySelectorAll('.favorite-btn').forEach(btn =>{
        btn.addEventListener('click', function(e){
            const uri = this.dataset.uri;
            toggleFavourite(uri);
        })
    })
}

function showReciperDetails(uri){
    const recipe = currentRecipes.find(r => r.uri === uri);
    if(!recipe) return;
    const isFavourite = favourites.some(fav => fav.uri === recipe.uri);

    currentRecipesDetailsn= recipe;
    saveRecipeBtn.innerHTML = isFavourite ?
    `<i class="bi bi-heart-fill"></i> Remove from Favourite`:
    `<i class="bi bi-heart"></i> Save to Favourite`;

    recipeModalBody.innerHTML = createRecipeModalContent(recipe);
    recipeModal.show();
}

function createRecipeModalContent(recipe){
    const ingredientList = recipe.ingredientLines.map(ing => `<li class="list-group-item">${ing}</li>`
        ).join('');

        const nutritionBadge = Object.entries(recipe.totalNutrients).slice(0,8)
        .map(([key, nut]) =>`
        <span class="badge bg-light text-dark nutrition-badge">
        ${nut.label}: ${Math.round(nut.quantity)} ${nut.unit}
        </span>
        `).join('');
        return `
        <div class="row">
            <div class="col-md-6">
                <img src="${recipe.image}" class="img-fluid rounded mb-3" alt="${recipe.label}">
                </img>
                <div class="mb-3">
                    <h6>Diet & health</h6>
                    <div class="d-flex flex-wrap">
                        ${recipe.healthLabels.slice(0,5).map(label => `
                            <span class="badge bg-dark text-bg-dark health-label mb-1">
                            ${label}
                            </span>`).join('')
                            }
                    </div>
                </div>
                <div class="mb-3">
                    <h6>nutrition Information :</h6>
                    <div class="d-flex flex-wrap">
                        ${nutritionBadge}
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <h5>Ingredients</h5>
                <ul class="list-group ingredient-list mb-3">
                    ${ingredientList}
                </ul>
                <a href="" target="blank" class="btn btn-primary">
                    <i class="bi bi-link"></i> Full recipe On ${recipe.source}
                </a>
            </div>
        </div>
        
        `; 

        
    
}

function toggleFavourite(uri){
    if(!uri && currentRecipesDetails){
        uri = currentRecipesDetails.uri;
    }
    const recipe = currentRecipes.find(r => r.uri === uri) || currentRecipesDetails;
    if(!recipe) return;

    const favoriteIndex =  favourites.findIndex(fav => fav.uri === uri);

    if(favoriteIndex === -1){
        favourites.unshift({
            uri: recipe.uri,
            label: recipe.label,
            image: recipe.image,
            source: recipe.source,
            url: recipe.url
        });
    } else{
        favourites.splice(favoriteIndex,1);
    }
    saveFavourites();
    updateFavouritesURL(uri, favoriteIndex === -1);
}

function saveFavourites(){
    localStorage.setItem('recipeFavourites', JSON.stringify(favourites));
    renderFavourites();
}

function showFavourites(){
    renderFavourites();
    favoritesModal.show();
}

function updateFavouritesURL(uri, isNowFvourites){
    if(currentRecipesDetails && currentRecipesDetails.uri === uri){
        saveRecipeBtn.innerHTML = isNowFvourites ?
        `<i class="bi bi-heart-fill"></i> Remove from favourite`:
        `<i class="bi bi-heart"></i> save to Favourite`;
    }
    const favoriteBtn = document.querySelector(`.favorite-btn[data-uri= "${uri}"]`);
    if(favoriteBtn){
        favoriteBtn.innerHTML = isNowFvourites ?
        `<i class="bi bi-heart-fill"></i> saved`:
        `<i class="bi bi-heart"></i> save`;
        favoriteBtn.classList.toggle('btn-outline-secondary', !isNowFvourites);
        favoriteBtn.classList.toggle('btn-primary', isNowFvourites);

    }
}

function renderFavourites(){
    if(favourites.length === 0){
        noFavoritesMessage.style.display = 'block';
        favoritesModalBody.innerHTML = '';
        favoritesModalBody.appendChild(noFavoritesMessage);
        return;
    }
    noFavoritesMessage.style.display = 'none';
    const favoriteList = document.createElement('div');
    favoriteList.className = 'list-group';

    favourites.forEach(fav =>{
        const favoriteItem =document.createElement('div');
        favoriteItem.className = 'list-group-item favorite-card';
        favoriteItem.innerHTML = `<div class="d-flex align-item-center">
        <img src="${fav.image}" class="favorite-image me-3" alt="${fav.label}">
        <div class="flex-group-1">
        <h5>${fav.label}</h5>
        <p class="mb-1 text-muted">${fav.source}</p>
        <div class="d-flex">
        <a href="${fav.url}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
        <i class="bi bi-link"></i></a>
        <button class="btn btn-sm btn-outline-danger remove-favorite"
         data-uri="${fav.uri}"><i class="bi bi-trash"></i></button>
        </div>
        </div>
        </div>`;

        favoriteList.appendChild(favoriteItem);
    });

    favoritesModalBody.innerHTML = '';
    favoritesModalBody.appendChild(favoriteList);

    document.querySelectorAll('.remove-favorite').forEach(btn =>{
        btn.addEventListener('click', function(){
            const uri = this.dataset.uri;
            toggleFavourite(uri);

        })
    })
}

//initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
