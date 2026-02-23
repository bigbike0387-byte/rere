/**
 * customer.js - ตรรกะฝั่งลูกค้า (Restored)
 */

let tableId = new URLSearchParams(window.location.search).get('table') || '1';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth('customer')) return;

    document.getElementById('table-display').innerText = `โต๊ะ: ${tableId}`;
    setupCoreSync('customer', tableId, renderCustomerUI);
    initMockData();
});

function initMockData() {
    if (getMenus().length === 0) {
        setData(DB_KEYS.MENUS, [
            { id: 1, name: 'กะเพราไข่ดาว', price: 60, image: 'https://images.unsplash.com/photo-1562607378-27419e048a07?w=300' },
            { id: 2, name: 'ข้าวผัดปู', price: 120, image: 'https://images.unsplash.com/photo-1512058560524-72249e1bccc3?w=300' }
        ]);
    }
}

function renderCustomerUI() {
    renderMenu();
    renderOrders();
    updateCartDisplay();
}

function renderMenu() {
    const menus = getMenus();
    document.getElementById('menu-list').innerHTML = menus.map(m => `
        <div class="card">
            <strong>${m.name}</strong>
            <div class="flex-between">
                <span>${m.price}฿</span>
                <button class="btn btn-primary" onclick="addToCart(${m.id}, '${m.name}', ${m.price})">+</button>
            </div>
        </div>
    `).join('');
}

function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);
    if (item) item.qty++; else cart.push({ id, name, price, qty: 1 });
    updateCartDisplay();
}

function updateCartDisplay() {
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.qty, 0);
}

function confirmOrder() {
    if (cart.length === 0) return alert('กรุณาเลือกอาหารครับ');
    createOrder(tableId, cart);
    cart = [];
    alert('สั่งอาหารเรียบร้อย!');
}

function renderOrders() {
    const orders = getOrders().filter(o => o.table == tableId && !o.paid);
    document.getElementById('order-list').innerHTML = orders.map(o => `
        <div class="card">
            <div class="flex-between">
                <strong>ออเดอร์: ${o.id}</strong>
                <span class="badge bg-${o.status}">${getStatusText(o.status)}</span>
            </div>
        </div>
    `).join('');
}
