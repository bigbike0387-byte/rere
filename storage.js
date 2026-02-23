/**
 * storage.js - "ครัวรีเทิน" Clean Rebuild with strict RBAC
 */

const DB_KEYS = {
    MENUS: 'krua_menus',
    ORDERS: 'krua_orders',
    NOTIFICATIONS: 'krua_notifications',
    MESSAGES: 'krua_messages',
    ISSUES: 'krua_issues',
    USERS: 'krua_users',
    SESSION: 'krua_session'
};

// --- ตั้งค่าสิทธิ์และบัญชีถาวร (Strict RBAC Configuration) ---

const FIXED_ACCOUNTS = {
    'guest_customer': { pass: 'krua123', role: 'customer', page: 'customer.html' },
    'staff_kds': { pass: 'kds5678', role: 'staff', page: 'staff.html' },
    'admin_saran': { pass: 'saran9999', role: 'owner', page: 'owner.html' }
};

/**
 * ตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บรวดเร็ว
 * @param {string} requiredRole - บทบาทที่ต้องการ (customer/staff/owner)
 */
function checkAuth(requiredRole) {
    const sessionStr = localStorage.getItem(DB_KEYS.SESSION);
    if (!sessionStr) {
        window.location.href = 'login.html';
        return false;
    }

    const user = JSON.parse(sessionStr);

    // กฎ: เจ้าของร้าน (Owner) เข้าได้ทุกหน้า
    if (user.role === 'owner') return true;

    // กฎ: บทบาททั่วไปต้องตรงกับที่หน้าที่กำหนด
    if (user.role !== requiredRole) {
        alert('❌ คุณไม่มีสิทธิ์เข้าใช้หน้านี้ครับ');
        window.location.href = user.page; // ส่งกลับหน้าหลักของตัวเอง
        return false;
    }

    return true;
}

function handleLogout() {
    localStorage.removeItem(DB_KEYS.SESSION);
    window.location.href = 'login.html';
}

// --- จัดการข้อมูลพื้นฐาน (Base Operations) ---

function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error(`Error reading ${key}:`, e);
        return [];
    }
}

function setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('krua_sync', { detail: { key, data } }));
}

// --- Menu Management ---
function getMenus() { return getData(DB_KEYS.MENUS); }

// --- Order Management ---
function getOrders() { return getData(DB_KEYS.ORDERS); }

function createOrder(table, items) {
    const orders = getOrders();
    const newOrder = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        table: parseInt(table),
        items: items.map(item => ({ ...item, status: 'waiting' })),
        status: 'waiting',
        createdAt: Date.now(),
        paid: false,
        totalPrice: items.reduce((sum, i) => sum + (i.price * i.qty), 0)
    };
    orders.push(newOrder);
    setData(DB_KEYS.ORDERS, orders);
    addNotification('staff', 'order', `โต๊ะ ${table} สั่งอาหารใหม่!`, newOrder.id);
    return newOrder;
}

function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = newStatus;
        if (newStatus === 'paid') orders[idx].paid = true;
        setData(DB_KEYS.ORDERS, orders);
    }
}

// --- Notifications ---
function addNotification(role, type, message, refId = null, targetTable = null) {
    const notifications = getData(DB_KEYS.NOTIFICATIONS);
    notifications.unshift({
        id: Date.now(),
        role, type, message, refId, targetTable,
        read: false, createdAt: Date.now()
    });
    setData(DB_KEYS.NOTIFICATIONS, notifications.slice(0, 50));
}

// --- Chat ---
function sendMessage(table, sender, text) {
    const messages = getData(DB_KEYS.MESSAGES);
    const msg = { id: Date.now(), table, sender, text, time: Date.now() };
    messages.push(msg);
    setData(DB_KEYS.MESSAGES, messages);
}

// --- ระบบวิเคราะห์และรายงาน (Restored Analytics) ---

function getHourlySalesData() {
    const orders = getOrders().filter(o => o.paid);
    const hourly = new Array(24).fill(0);
    orders.forEach(o => {
        const hour = new Date(o.createdAt).getHours();
        hourly[hour] += o.totalPrice;
    });
    return hourly;
}

function getReportData() {
    const orders = getOrders().filter(o => o.paid);
    const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const names = {};
    orders.forEach(o => o.items.forEach(i => names[i.name] = (names[i.name] || 0) + i.qty));
    const bestSellers = Object.entries(names).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
        totalSales,
        orderCount: orders.length,
        bestSellers,
        hourly: getHourlySalesData()
    };
}

// --- UI Helper ---
function getStatusText(status) {
    const map = { waiting: 'รอคิว', cooking: 'กำลังปรุง', ready: 'พร้อมเสิร์ฟ', served: 'เสิร์ฟแล้ว', paid: 'จ่ายแล้ว' };
    return map[status] || status;
}
