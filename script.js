// Configuración de la API - The Guardian (funciona con HTTPS y sin CORS)
const API_KEY = 'test'; // The Guardian permite 'test' para desarrollo
const API_BASE_URL = 'https://content.guardianapis.com';

// Estado de la aplicación
const state = {
    currentCategory: 'general',
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    currentNews: []
};

// Elementos del DOM
const elements = {
    newsGrid: document.getElementById('newsGrid'),
    loading: document.getElementById('loading'),
    emptyState: document.getElementById('emptyState'),
    navButtons: document.querySelectorAll('.nav-btn'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    favCount: document.querySelector('.fav-count')
};

// Inicializar la aplicación
function init() {
    updateFavoriteCount();
    loadNews(state.currentCategory);
    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    // Botones de navegación
    elements.navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            handleCategoryChange(category);
        });
    });

    // Búsqueda
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// Cambiar categoría
function handleCategoryChange(category) {
    // Actualizar botón activo
    elements.navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    state.currentCategory = category;

    // Limpiar búsqueda
    elements.searchInput.value = '';

    // Cargar noticias o favoritos
    if (category === 'favorites') {
        displayFavorites();
    } else {
        loadNews(category);
    }
}

// Realizar búsqueda
function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (query) {
        searchNews(query);
        // Desactivar todos los botones
        elements.navButtons.forEach(btn => btn.classList.remove('active'));
    }
}

// Mapeo de categorías a secciones de The Guardian
const categoryMap = {
    'general': 'world',
    'technology': 'technology',
    'business': 'business',
    'sports': 'sport',
    'entertainment': 'culture'
};

// Cargar noticias por categoría
async function loadNews(category) {
    showLoading();
    
    try {
        const section = categoryMap[category] || 'world';
        const url = `${API_BASE_URL}/search?section=${section}&show-fields=thumbnail,trailText&page-size=12&api-key=${API_KEY}`;
        
        console.log('Cargando noticias desde:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.response && data.response.results && data.response.results.length > 0) {
            // Adaptar formato de The Guardian a nuestro formato
            const articles = data.response.results.map(item => ({
                title: item.webTitle,
                description: item.fields?.trailText || 'Lee la noticia completa para más detalles',
                url: item.webUrl,
                image: item.fields?.thumbnail || 'https://via.placeholder.com/400x200?text=Sin+Imagen',
                source: { name: 'The Guardian' },
                publishedAt: item.webPublicationDate
            }));
            
            state.currentNews = articles;
            displayNews(articles);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error al cargar noticias:', error);
        showEmptyState();
        showNotification('Error al cargar noticias. Intenta de nuevo.');
    }
}

// Buscar noticias
async function searchNews(query) {
    showLoading();
    
    try {
        const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&show-fields=thumbnail,trailText&page-size=12&api-key=${API_KEY}`;
        
        console.log('Buscando noticias:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Resultados de búsqueda:', data);
        
        if (data.response && data.response.results && data.response.results.length > 0) {
            // Adaptar formato
            const articles = data.response.results.map(item => ({
                title: item.webTitle,
                description: item.fields?.trailText || 'Lee la noticia completa para más detalles',
                url: item.webUrl,
                image: item.fields?.thumbnail || 'https://via.placeholder.com/400x200?text=Sin+Imagen',
                source: { name: 'The Guardian' },
                publishedAt: item.webPublicationDate
            }));
            
            state.currentNews = articles;
            displayNews(articles);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error al buscar noticias:', error);
        showEmptyState();
        showNotification('Error en la búsqueda. Intenta de nuevo.');
    }
}

// Mostrar noticias
function displayNews(articles) {
    hideLoading();
    
    if (!articles || articles.length === 0) {
        showEmptyState();
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    
    const newsHTML = articles.map(article => createNewsCard(article)).join('');
    elements.newsGrid.innerHTML = newsHTML;
    
    // Agregar animación escalonada
    const cards = document.querySelectorAll('.news-card');
    cards.forEach((card, index) => {
        card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;
    });
    
    attachCardListeners();
}

// Crear tarjeta de noticia
function createNewsCard(article) {
    const isFavorite = state.favorites.some(fav => fav.url === article.url);
    const imageUrl = article.image || 'https://via.placeholder.com/400x200?text=Sin+Imagen';
    const title = article.title || 'Sin título';
    const description = article.description || 'Sin descripción disponible';
    const source = article.source?.name || 'Fuente desconocida';
    const date = formatDate(article.publishedAt);
    
    return `
        <article class="news-card" data-url="${article.url}">
            <div class="news-image-container">
                <img src="${imageUrl}" alt="${title}" class="news-image" onerror="this.src='https://via.placeholder.com/400x200?text=Sin+Imagen'">
            </div>
            <div class="news-content">
                <div class="news-header">
                    <span class="news-source">${source}</span>
                    <button class="fav-btn ${isFavorite ? 'active' : ''}" data-url="${article.url}">
                        ❤️
                    </button>
                </div>
                <h3 class="news-title">${title}</h3>
                <p class="news-description">${description}</p>
                <div class="news-footer">
                    <span class="news-date">${date}</span>
                    <a href="${article.url}" class="read-more" target="_blank" rel="noopener noreferrer">
                        Leer más →
                    </a>
                </div>
            </div>
        </article>
    `;
}

// Adjuntar listeners a las tarjetas
function attachCardListeners() {
    const favButtons = document.querySelectorAll('.fav-btn');
    
    favButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(btn.dataset.url);
        });
    });
}

// Toggle favorito
function toggleFavorite(url) {
    const article = state.currentNews.find(a => a.url === url);
    if (!article) return;
    
    const index = state.favorites.findIndex(fav => fav.url === url);
    
    if (index === -1) {
        // Agregar a favoritos
        state.favorites.push(article);
        showNotification('Agregado a favoritos ❤️');
    } else {
        // Remover de favoritos
        state.favorites.splice(index, 1);
        showNotification('Removido de favoritos 💔');
    }
    
    // Guardar en localStorage
    localStorage.setItem('favorites', JSON.stringify(state.favorites));
    
    // Actualizar UI
    updateFavoriteCount();
    
    // Si estamos en la vista de favoritos, recargar
    if (state.currentCategory === 'favorites') {
        displayFavorites();
    } else {
        // Actualizar solo el botón
        const btn = document.querySelector(`.fav-btn[data-url="${url}"]`);
        if (btn) {
            btn.classList.toggle('active');
        }
    }
}

// Mostrar favoritos
function displayFavorites() {
    hideLoading();
    
    if (state.favorites.length === 0) {
        elements.newsGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        elements.emptyState.querySelector('h2').textContent = 'No tienes favoritos';
        elements.emptyState.querySelector('p').textContent = 'Agrega noticias a tus favoritos para verlas aquí';
        return;
    }
    
    state.currentNews = state.favorites;
    displayNews(state.favorites);
}

// Actualizar contador de favoritos
function updateFavoriteCount() {
    elements.favCount.textContent = state.favorites.length;
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
        return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
        return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
}

// Mostrar notificación
function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #FF4444, #FF6B35);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(255, 68, 68, 0.4);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Estados de carga
function showLoading() {
    elements.loading.classList.remove('hidden');
    elements.newsGrid.innerHTML = '';
    elements.emptyState.classList.add('hidden');
}

function hideLoading() {
    elements.loading.classList.add('hidden');
}

function showEmptyState() {
    hideLoading();
    elements.newsGrid.innerHTML = '';
    elements.emptyState.classList.remove('hidden');
    elements.emptyState.querySelector('h2').textContent = 'No hay noticias disponibles';
    elements.emptyState.querySelector('p').textContent = 'Intenta con otra búsqueda o categoría';
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}