/**
 * storage.js - "ครัวรีเทิน" Single Source of Truth
 * ส่วนกลางจัดการข้อมูลทั้งหมดในระบบ
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

// --- ตั้งค่าสิทธิ์และบัญชีถาวร (RBAC Configuration) ---

const FIXED_ACCOUNTS = {
    'guest_customer': { pass: 'krua123', role: 'customer', page: 'customer.html' },
    'staff_kds': { pass: 'kds5678', role: 'staff', page: 'staff.html' },
    'admin_saran': { pass: 'saran9999', role: 'owner', page: 'owner.html' }
};

/**
 * ตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บ
 * @param {string} requiredRole - บทบาทที่ต้องการ
 */
function checkAuth(requiredRole) {
    const session = localStorage.getItem(DB_KEYS.SESSION);
    if (!session) {
        window.location.href = 'login.html';
        return false;
    }
    const user = JSON.parse(session);
    if (requiredRole === 'any') return true;
    if (user.role !== requiredRole && user.role !== 'owner') { // เจ้าของเข้าได้ทุกหน้า
        alert('คุณไม่มีสิทธิ์เข้าใช้หน้านี้ครับ');
        window.location.href = user.page;
        return false;
    }
    return true;
}

function handleLogout() {
    localStorage.removeItem(DB_KEYS.SESSION);
    window.location.href = 'login.html';
}

// --- จัดการข้อมูลพื้นฐาน (Base Data Operations) ---

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
    // ส่ง Event เพื่อให้หน้าอื่นๆ รู้ว่าข้อมูลเปลี่ยน
    window.dispatchEvent(new CustomEvent('krua_sync', { detail: { key, data } }));
}

// --- สำหรับจัดการเมนู (Menu Management) ---

function getMenus() {
    return getData(DB_KEYS.MENUS);
}

// --- สำหรับจัดการออเดอร์ (Order Management) ---

function getOrders() {
    return getData(DB_KEYS.ORDERS);
}

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

    // แจ้งเตือนสตาฟ
    addNotification('staff', 'order', `โต๊ะ ${table} สั่งอาหารใหม่!`, newOrder.id);
    return newOrder;
}

function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        orders[idx].status = newStatus;
        if (newStatus === 'paid') {
            orders[idx].paid = true;
            addNotification('owner', 'payment', `โต๊ะ ${orders[idx].table} ชำระเงินเรียบร้อย`, orderId);
        } else if (newStatus === 'ready') {
            addNotification('customer', 'ready', `อาหารโต๊ะ ${orders[idx].table} พร้อมเสิร์ฟ!`, orderId, orders[idx].table);
        }
        setData(DB_KEYS.ORDERS, orders);
    }
}

// --- ระบบแจ้งเตือน (Notifications) ---

function addNotification(role, type, message, refId = null, targetTable = null) {
    const notifications = getData(DB_KEYS.NOTIFICATIONS);
    notifications.unshift({
        id: Date.now(),
        role,     // staff / owner / customer
        type,     // order / chat / issue / ready / payment
        message,
        refId,
        targetTable,
        read: false,
        createdAt: Date.now()
    });
    setData(DB_KEYS.NOTIFICATIONS, notifications.slice(0, 50)); // เก็บแค่ 50 ล่าสุด
}

// --- ระบบแชท (Chat Management) ---

function sendMessage(table, sender, text) {
    const messages = getData(DB_KEYS.MESSAGES);
    const msg = {
        id: Date.now(),
        table,
        sender,   // customer / staff
        text,
        time: Date.now()
    };
    messages.push(msg);
    setData(DB_KEYS.MESSAGES, messages);

    const target = sender === 'customer' ? 'staff' : 'customer';
    addNotification(target, 'chat', `ข้อความใหม่จาก ${sender === 'customer' ? 'โต๊ะ ' + table : 'ครัว'}`, table, table);
}

// --- ระบบวิเคราะห์และรายงาน (Analytics) ---

function getReportData() {
    const orders = getOrders();
    const paidOrders = orders.filter(o => o.paid);

    const totalSales = paidOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const menuCounts = {};
    paidOrders.forEach(o => {
        o.items.forEach(i => {
            menuCounts[i.name] = (menuCounts[i.name] || 0) + i.qty;
        });
    });

    const bestSellers = Object.entries(menuCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    return { totalSales, orderCount: paidOrders.length, bestSellers };
}

// --- ระบบตรวจสอบสิทธิ์ (Auth Utils) ---

function getCurrentUser() {
    const session = localStorage.getItem(DB_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
}

// --- สถานะแสดงผล (UI Helper) ---

function getStatusText(status) {
    const map = {
        waiting: 'รอคิว',
        cooking: 'กำลังปรุง',
        ready: 'พร้อมเสิร์ฟ',
        served: 'เสิร์ฟแล้ว',
        paid: 'จ่ายแล้ว'
    };
    return map[status] || status;
}
