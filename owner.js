/**
 * owner.js - ตรรกะฝั่งเจ้าของร้าน
 */

let activeOwnerTab = 'reports';

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth('owner')) return;
    // เริ่มระบบ Sync
    setupCoreSync('owner', null, renderOwnerUI);
});

function switchTab(tab) {
    activeOwnerTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.getElementById(`btn-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function renderOwnerUI() {
    renderStatsAtOwner();
    renderIssuesAtOwner();
    renderMenuListAtOwner();
    renderOwnerNotifications();
}

function renderStatsAtOwner() {
    const report = getReportData();
    document.getElementById('owner-sales').innerText = `${report.totalSales.toLocaleString()}฿`;
    document.getElementById('owner-orders').innerText = report.orderCount;

    const bestList = document.getElementById('best-seller-list');
    if (report.bestSellers.length === 0) {
        bestList.innerHTML = '<p class="text-muted">ยังไม่มีข้อมูลการขาย</p>';
    } else {
        bestList.innerHTML = report.bestSellers.map(([name, qty]) => `
            <div class="flex-between mb-1" style="background: rgba(0,0,0,0.03); padding: 10px; border-radius: 10px;">
                <span>${name}</span>
                <strong>x ${qty}</strong>
            </div>
        `).join('');
    }
}

function renderIssuesAtOwner() {
    const issues = getData(DB_KEYS.ISSUES).filter(i => i.status === 'pending');
    const container = document.getElementById('recent-issues');

    if (issues.length === 0) {
        container.innerHTML = '<p style="color: green;">✅ ทุกอย่างปกติ</p>';
        return;
    }

    container.innerHTML = issues.map(i => `
        <div class="card mb-1" style="padding: 10px; border-left: 4px solid var(--danger);">
            <div class="flex-between">
                <strong>โต๊ะ ${i.table}</strong>
                <button class="btn btn-sm btn-outline" onclick="solveIssue(${i.id})">รับทราบ</button>
            </div>
            <div class="text-muted">${i.message}</div>
        </div>
    `).join('');
}

function solveIssue(id) {
    const issues = getData(DB_KEYS.ISSUES);
    const idx = issues.findIndex(i => i.id === id);
    if (idx !== -1) {
        issues[idx].status = 'resolved';
        setData(DB_KEYS.ISSUES, issues);
    }
}

function renderMenuListAtOwner() {
    const menus = getMenus();
    const container = document.getElementById('owner-menu-list');
    container.innerHTML = menus.map(m => `
        <div class="flex-between mb-1">
            <span>${m.name}</span>
            <strong>${m.price}฿</strong>
        </div>
    `).join('');
}

function renderOwnerNotifications() {
    const notis = getData(DB_KEYS.NOTIFICATIONS).filter(n => n.role === 'owner');
    const container = document.getElementById('owner-noti-list');

    if (notis.length === 0) {
        container.innerHTML = '<p class="text-muted">ไม่มีความเคลื่อนไหว</p>';
        return;
    }

    container.innerHTML = notis.slice(0, 5).map(n => `
        <div class="mb-1" style="font-size: 0.9rem; border-bottom: 1px solid #eee; padding-bottom: 5px;">
            ${n.message} <br>
            <small class="text-muted">${new Date(n.createdAt).toLocaleTimeString()}</small>
        </div>
    `).join('');
}
