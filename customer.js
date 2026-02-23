/**
 * customer.js - ตรรกะฝั่งลูกค้า
 */

let tableId = new URLSearchParams(window.location.search).get('table') || '1';
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth('customer')) return;

    // 1. ตั้งหน้าจอ
    document.getElementById('table-display').innerText = `โต๊ะ: ${tableId}`;
    document.getElementById('chat-table-no').innerText = tableId;

    // 2. เริ่มระบบ Sync
    setupCoreSync('customer', tableId, renderCustomerUI);

    // 3. เริ่มต้นข้อมูลตัวอย่าง (ถ้ายังไม่มี)
    initMockData();
});

function renderCustomerUI() {
    renderMenu();
    renderOrders();
    renderChat();
    updateCartDisplay();
}

function initMockData() {
    const currentMenu = getMenus();
    if (currentMenu.length === 0) {
        const mockMenus = [
            { id: 1, name: 'กะเพราไข่ดาว', price: 60, image: 'https://images.unsplash.com/photo-1562607378-27419e048a07?w=300' },
            { id: 2, name: 'ข้าวผัดปู', price: 120, image: 'https://images.unsplash.com/photo-1512058560524-72249e1bccc3?w=300' },
            { id: 3, name: 'ต้มยำกุ้ง', price: 180, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300' }
        ];
        setData(DB_KEYS.MENUS, mockMenus);
    }
}

// --- Menu Functions ---
function renderMenu() {
    const menus = getMenus();
    const container = document.getElementById('menu-list');
    container.innerHTML = menus.map(m => `
        <div class="card fade-in" style="padding: 10px;">
            <img src="${m.image}" style="width:100%; height:120px; object-fit:cover; border-radius:12px;">
            <div class="mt-1">
                <strong>${m.name}</strong>
                <div class="flex-between">
                    <span class="text-primary">${m.price}฿</span>
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${m.id}, '${m.name}', ${m.price})">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- Cart Functions ---
function addToCart(id, name, price) {
    const item = cart.find(i => i.id === id);
    if (item) item.qty++;
    else cart.push({ id, name, price, qty: 1 });
    updateCartDisplay();
}

function updateCartDisplay() {
    document.getElementById('cart-count').innerText = cart.reduce((sum, i) => sum + i.qty, 0);
    const container = document.getElementById('cart-items');
    if (!container) return;

    container.innerHTML = cart.map(i => `
        <div class="flex-between mb-1">
            <span>${i.name} x ${i.qty}</span>
            <span>${i.price * i.qty}฿</span>
        </div>
    `).join('');

    document.getElementById('cart-total').innerText = `${cart.reduce((sum, i) => sum + (i.price * i.qty), 0)}฿`;
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function confirmOrder() {
    if (cart.length === 0) return alert('กรุณาเลือกอาหารก่อนครับ');
    createOrder(tableId, cart);
    cart = [];
    toggleCart();
    alert('สั่งอาหารเรียบร้อย! กรุณารอสักครู่ครับ');
}

// --- Order Status ---
function renderOrders() {
    const orders = getOrders().filter(o => o.table == tableId && !o.paid);
    const container = document.getElementById('order-list');
    const section = document.getElementById('my-orders');

    if (orders.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    container.innerHTML = orders.map(o => `
        <div class="card mb-1">
            <div class="flex-between">
                <strong>ออเดอร์: ${o.id}</strong>
                <span class="badge bg-${o.status}">${getStatusText(o.status)}</span>
            </div>
            <div class="text-muted mt-1">
                ${o.items.map(i => `${i.name} x${i.qty}`).join(', ')}
            </div>
            ${o.status === 'ready' ? `
                <button class="btn btn-success btn-sm mt-1" style="width:100%" onclick="handlePayment('${o.id}')">เช็คบิล (${o.totalPrice}฿)</button>
            ` : ''}
        </div>
    `).join('');
}

function handlePayment(id) {
    if (confirm('ยืนยันแจ้งชำระเงิน?')) {
        updateOrderStatus(id, 'paid');
    }
}

// --- Chat Functions ---
function toggleChat() {
    const modal = document.getElementById('chat-modal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
}

function handleSend() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    sendMessage(tableId, 'customer', text);
    input.value = '';
}

function renderChat() {
    const msgs = getData(DB_KEYS.MESSAGES).filter(m => m.table == tableId);
    const box = document.getElementById('chat-box');
    if (!box) return;

    box.innerHTML = msgs.map(m => `
        <div style="margin-bottom: 8px; text-align: ${m.sender === 'customer' ? 'right' : 'left'};">
            <div style="display: inline-block; padding: 8px; border-radius: 12px; background: ${m.sender === 'customer' ? 'var(--primary)' : '#eee'}; color: ${m.sender === 'customer' ? 'white' : 'black'}; max-width: 80%;">
                ${m.text}
            </div>
        </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
}

function callStaff() {
    addNotification('staff', 'call', `โต๊ะ ${tableId} เรียกพนักงาน!`, null, tableId);
    alert('เรียกพนักงานแล้วครับ');
}
