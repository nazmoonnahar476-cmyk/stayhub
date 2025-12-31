// Main page functionality

async function loadFeaturedProperties() {
    try {
        const { response, data } = await api.getFeaturedProperties();
        if (response.ok) {
            displayProperties(data, 'featuredProperties');
        }
    } catch (error) {
        console.error('Error loading featured properties:', error);
    }
}

function displayProperties(properties, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (properties.length === 0) {
        container.innerHTML = '<p>No properties available at the moment.</p>';
        return;
    }
    
    container.innerHTML = properties.map(property => `
        <div class="property-card">
            <img src="${property.images && property.images[0] ? property.images[0] : 'https://via.placeholder.com/300x200'}" 
                 alt="${property.title}"
                 onerror="this.src='https://via.placeholder.com/300x200'">
            <div class="property-info">
                <h3>${property.title}</h3>
                <p class="property-location">${property.city}, ${property.country || 'Bangladesh'}</p>
                <p class="property-price">৳${property.price_per_night}/night</p>
                <p class="property-details">${property.bedrooms} bed • ${property.bathrooms} bath • ${property.max_guests} guests</p>
                <a href="property-details.html?id=${property.id}" class="btn-primary">View Details</a>
            </div>
        </div>
    `).join('');
}

function searchProperties() {
    const location = document.getElementById('searchLocation').value;
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    
    let url = 'properties.html';
    const params = new URLSearchParams();
    
    if (location) params.append('city', location);
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    
    if (params.toString()) {
        url += '?' + params.toString();
    }
    
    window.location.href = url;
}

// Set minimum dates for date inputs
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const checkInInput = document.getElementById('checkInDate');
    const checkOutInput = document.getElementById('checkOutDate');
    
    if (checkInInput) {
        checkInInput.min = today;
        checkInInput.addEventListener('change', () => {
            if (checkOutInput) {
                const checkInDate = new Date(checkInInput.value);
                checkInDate.setDate(checkInDate.getDate() + 1);
                checkOutInput.min = checkInDate.toISOString().split('T')[0];
            }
        });
    }
    
    if (checkOutInput) {
        checkOutInput.min = today;
    }
    
    // Load featured properties on homepage
    if (document.getElementById('featuredProperties')) {
        loadFeaturedProperties();
    }
});

