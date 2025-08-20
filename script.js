// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // ==================== DATA ====================
    // In a real application, this data would come from a database.
    let products = [
        { id: 1, name: 'Basmati Rice', price: 90, image: 'https://via.placeholder.com/150?text=Rice', unit: 'kg' },
        { id: 2, name: 'Sugar', price: 45, image: 'https://via.placeholder.com/150?text=Sugar', unit: 'kg' },
        { id: 3, name: 'Milk Packet', price: 28, image: 'https://via.placeholder.com/150?text=Milk', unit: 'packet' },
        { id: 4, name: 'Toor Dal', price: 120, image: 'https://via.placeholder.com/150?text=Dal', unit: 'kg' },
        { id: 5, name: 'Sunflower Oil', price: 150, image: 'https://via.placeholder.com/150?text=Oil', unit: 'litre' },
        { id: 6, name: 'Wheat Flour (Atta)', price: 40, image: 'https://via.placeholder.com/150?text=Atta', unit: 'kg' },
        { id: 7, name: 'Salt', price: 20, image: 'https://via.placeholder.com/150?text=Salt', unit: 'kg' },
        { id: 8, name: 'Tea Powder', price: 80, image: 'https://via.placeholder.com/150?text=Tea', unit: 'g' },
        { id: 9, name: 'Biscuits', price: 30, image: 'https://via.placeholder.com/150?text=Biscuits', unit: 'packet' },
    ];

    let cart = [];
    let customerRecords = {}; // To store previous records

    // ==================== DOM ELEMENTS ====================
    const productList = document.getElementById('product-list');
    const searchBar = document.getElementById('search-bar');
    const cartCount = document.getElementById('cart-count');
    
    // Modals
    const cartModal = document.getElementById('cart-modal');
    const billingModal = document.getElementById('billing-modal');
    const loginModal = document.getElementById('owner-login-modal');
    const adminModal = document.getElementById('admin-panel-modal');
    
    // Modal Content
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalSpan = document.getElementById('cart-total');
    const billSummary = document.getElementById('bill-summary');
    const adminProductList = document.getElementById('admin-product-list');

    // Buttons
    const openCartBtn = document.getElementById('cart-btn');
    const openLoginBtn = document.getElementById('owner-login-btn');
    const generateBillBtn = document.getElementById('generate-bill-btn');
    const printBillBtn = document.getElementById('print-bill-btn');
    const closeButtons = document.querySelectorAll('.close-btn');
    
    // Forms
    const loginForm = document.getElementById('login-form');
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');


    // ==================== FUNCTIONS ====================

    /**
     * Renders products on the page based on an array of products.
     * @param {Array} productsToRender - The array of product objects to display.
     */
    function renderProducts(productsToRender = products) {
        productList.innerHTML = ''; // Clear existing products
        if (productsToRender.length === 0) {
            productList.innerHTML = '<p>No products found.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product.id;

            let optionsHtml = '';
            if (product.unit === 'kg') {
                optionsHtml = '<option value="kg">kg</option><option value="g">g</option>';
            } else {
                optionsHtml = `<option value="${product.unit}">${product.unit}</option>`;
            }

            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">₹<span class="price-value">${product.price}</span> per ${product.unit}</p>
                <div class="quantity-control">
                    <input type="number" class="quantity-input" value="1" min="0.1" step="0.1">
                    <select class="unit-select">${optionsHtml}</select>
                </div>
                <button class="add-to-cart-btn">Add to Cart</button>
            `;
            productList.appendChild(card);
        });
    }

    /**
     * Handles the "Add to Cart" button click event.
     */
    function handleAddToCart(e) {
        if (!e.target.classList.contains('add-to-cart-btn')) return;

        const card = e.target.closest('.product-card');
        const id = parseInt(card.dataset.id);
        const product = products.find(p => p.id === id);
        
        const quantityInput = card.querySelector('.quantity-input');
        const unitSelect = card.querySelector('.unit-select');
        
        let quantity = parseFloat(quantityInput.value);
        const selectedUnit = unitSelect.value;

        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }
        
        // Convert grams to kg for price calculation if needed
        let quantityInBaseUnit = quantity;
        if (product.unit === 'kg' && selectedUnit === 'g') {
            quantityInBaseUnit = quantity / 1000;
        }
        
        const price = product.price * quantityInBaseUnit;
        
        // Check if item is already in cart
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.displayQty = `${existingItem.quantity} ${selectedUnit}`;
            existingItem.price += price;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                quantity: quantity,
                displayQty: `${quantity} ${selectedUnit}`,
                price: price
            });
        }
        
        updateCartDisplay();
        alert(`${product.name} added to cart!`);
    }

    /**
     * Updates the cart modal display and header count.
     */
    function updateCartDisplay() {
        cartCount.textContent = cart.length;
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            cartTotalSpan.textContent = '0.00';
            return;
        }

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <span>${item.name} (${item.displayQty})</span>
                <span>₹${item.price.toFixed(2)}</span>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotalSpan.textContent = total.toFixed(2);
    }
    
    /**
     * Filters products based on search bar input.
     */
    function filterProducts() {
        const query = searchBar.value.toLowerCase();
        const filteredProducts = products.filter(product => product.name.toLowerCase().includes(query));
        renderProducts(filteredProducts);
    }

    /**
     * Generates and displays the final bill.
     */
    function handleGenerateBill() {
        if (cart.length === 0) {
            alert("Cart is empty. Please add items to generate a bill.");
            return;
        }
        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            alert("Please enter the customer's name.");
            return;
        }

        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const date = new Date();
        const billDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        billSummary.innerHTML = `
            <h3>Bill for: ${customerName}</h3>
            <p>Date: ${billDate}</p>
            <hr>
            ${cart.map(item => `<p>${item.name} (${item.displayQty}) - <strong>₹${item.price.toFixed(2)}</strong></p>`).join('')}
            <hr>
            <h4>Total Amount: ₹${total.toFixed(2)}</h4>
        `;
        
        // Save record
        const phone = customerPhoneInput.value.trim() || 'N/A';
        if (!customerRecords[phone]) {
            customerRecords[phone] = [];
        }
        customerRecords[phone].push({ name: customerName, date: billDate, cart: [...cart], total: total });
        
        closeModal(cartModal);
        openModal(billingModal);
    }

    /**
     * Handles the login form submission.
     */
    function handleLogin(e) {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        // Simple hardcoded credentials for demonstration
        if (username === 'admin' && password === 'pass123') {
            closeModal(loginModal);
            renderAdminPanel();
            openModal(adminModal);
        } else {
            alert('Invalid username or password.');
        }
        loginForm.reset();
    }
    
    /**
     * Renders the admin panel with options to update prices.
     */
    function renderAdminPanel() {
        adminProductList.innerHTML = products.map(p => `
            <div class="admin-product-item">
                <span>${p.name}</span>
                <input type="number" value="${p.price}" data-id="${p.id}" class="admin-price-input" step="0.5">
            </div>
        `).join('');
    }
    
    /**
     * Handles price updates from the admin panel.
     */
    function handlePriceUpdate(e) {
        if (!e.target.classList.contains('admin-price-input')) return;
        
        const id = parseInt(e.target.dataset.id);
        const newPrice = parseFloat(e.target.value);
        
        if (isNaN(newPrice) || newPrice < 0) {
            alert('Please enter a valid price.');
            return;
        }

        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex > -1) {
            products[productIndex].price = newPrice;
            renderProducts(); // Re-render the main product list to show updated prices
            alert(`${products[productIndex].name} price updated to ₹${newPrice}.`);
        }
    }


    // ==================== MODAL HANDLING ====================
    function openModal(modal) {
        modal.style.display = 'flex';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    // ==================== EVENT LISTENERS ====================
    productList.addEventListener('click', handleAddToCart);
    searchBar.addEventListener('input', filterProducts);
    
    // Modal Open/Close Listeners
    openCartBtn.addEventListener('click', () => openModal(cartModal));
    openLoginBtn.addEventListener('click', () => openModal(loginModal));
    closeButtons.forEach(btn => btn.addEventListener('click', () => {
        closeModal(btn.closest('.modal'));
    }));
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target);
        }
    });
    
    // Action Button Listeners
    generateBillBtn.addEventListener('click', handleGenerateBill);
    printBillBtn.addEventListener('click', () => window.print());
    loginForm.addEventListener('submit', handleLogin);
    adminProductList.addEventListener('change', handlePriceUpdate); // Updates when user clicks away from input


    // ==================== INITIALIZATION ====================
    renderProducts();
    updateCartDisplay();

});
      
