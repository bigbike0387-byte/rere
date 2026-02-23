/**
 * login.js - ระบบล็อกอินและจัดการสิทธิ์ (RBAC)
 */

function performLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    // 1. เช็คใน FIXED_ACCOUNTS จาก storage.js
    if (FIXED_ACCOUNTS[user] && FIXED_ACCOUNTS[user].pass === pass) {
        saveSession(user, FIXED_ACCOUNTS[user].role, FIXED_ACCOUNTS[user].page);
        return;
    }

    // 2. เช็คบัญชีลูกค้าทั่วไป
    const users = getData(DB_KEYS.USERS);
    const found = users.find(u => u.username === user && u.password === pass);

    if (found) {
        saveSession(user, 'customer', 'customer.html');
        return;
    }

    showError('Username หรือ Password ไม่ถูกต้องครับ');
}

function saveSession(username, role, page) {
    const sessionData = {
        username,
        role,
        page,
        loginTime: Date.now()
    };
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(sessionData));

    // ไปยังหน้าที่กำหนด
    window.location.href = page;
}

function showError(msg) {
    const el = document.getElementById('error-msg');
    el.innerText = msg;
    el.style.display = 'block';
}
