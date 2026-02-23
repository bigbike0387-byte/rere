/**
 * staff.js - ตรรกะฝั่งห้องเครื่อง (KDS)
 */

let activeChatTable = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth('staff')) return;
    // เริ่มระบบ Sync
    setupCoreSync('staff', null, renderStaffUI);
});

function renderStaffUI() {
    renderOrdersAtStaff();
    renderChatActiveTables();
    if (activeChatTable) renderChatAtStaff();
    updateNotiBadgeAtStaff();
}

// --- Order Management ---
function renderOrdersAtStaff() {
    const orders = getOrders().filter(o => !o.paid);
    const container = document.getElementById('staff-order-list');

    if (orders.length === 0) {
        container.innerHTML = '<div class="card" style="grid-column: 1/-1; text-align: center;">ไม่มีออเดอร์ค้าง</div>';
        return;
    }

    container.innerHTML = orders.reverse().map(o => `
        <div class="card fade-in">
            <div class="flex-between">
                <strong>โต๊ะ ${o.table} [ID: ${o.id}]</strong>
                <span class="badge bg-${o.status}">${getStatusText(o.status)}</span>
            </div>
            <div class="mt-1" style="font-size: 1.1rem; border-top: 1px solid #eee; padding-top: 10px;">
                ${o.items.map(i => `<div class="mb-1">• ${i.name} <strong>x${i.qty}</strong></div>`).join('')}
            </div>
            <div class="mt-1" style="display: flex; gap: 5px;">
                ${o.status === 'waiting' ? `<button class="btn btn-warning btn-sm" onclick="changeStatus('${o.id}', 'cooking')">เริ่มทำ 👨🍳</button>` : ''}
                ${o.status === 'cooking' ? `<button class="btn btn-info btn-sm" onclick="changeStatus('${o.id}', 'ready')">เสร็จแล้ว ✨</button>` : ''}
                ${o.status === 'ready' ? `<button class="btn btn-success btn-sm" onclick="changeStatus('${o.id}', 'served')">เสิร์ฟแล้ว ✅</button>` : ''}
            </div>
        </div>
    `).join('');
}

function changeStatus(id, status) {
    updateOrderStatus(id, status);
}

// --- Chat Functions ---
function renderChatActiveTables() {
    const msgs = getData(DB_KEYS.MESSAGES);
    const container = document.getElementById('staff-chat-list');

    // ดึงโต๊ะที่เคยแชทมาแบบไม่ซ้ำกัน
    const tables = [...new Set(msgs.map(m => m.table))];

    if (tables.length === 0) {
        container.innerHTML = '<p class="text-muted">ยังไม่มีประวัติการแชท</p>';
        return;
    }

    container.innerHTML = tables.map(t => `
        <button class="btn btn-outline" style="margin-right: 10px;" onclick="openStaffChat('${t}')">
            แชทโต๊ะ ${t}
        </button>
    `).join('');
}

function openStaffChat(table) {
    activeChatTable = table;
    document.getElementById('current-chat-table').innerText = table;
    document.getElementById('staff-chat-modal').style.display = 'flex';
    renderChatAtStaff();
}

function closeStaffChat() {
    activeChatTable = null;
    document.getElementById('staff-chat-modal').style.display = 'none';
}

function renderChatAtStaff() {
    const msgs = getData(DB_KEYS.MESSAGES).filter(m => m.table == activeChatTable);
    const box = document.getElementById('staff-chat-box');
    if (!box) return;

    box.innerHTML = msgs.map(m => `
        <div style="margin-bottom: 8px; text-align: ${m.sender === 'staff' ? 'right' : 'left'};">
            <div style="display: inline-block; padding: 8px; border-radius: 12px; background: ${m.sender === 'staff' ? 'var(--info)' : '#eee'}; color: ${m.sender === 'staff' ? 'white' : 'black'}; max-width: 80%;">
                ${m.text}
            </div>
        </div>
    `).join('');
    box.scrollTop = box.scrollHeight;
}

function sendStaffMsg() {
    const input = document.getElementById('staff-chat-input');
    const text = input.value.trim();
    if (!text || !activeChatTable) return;
    sendMessage(activeChatTable, 'staff', text);
    input.value = '';
}

function updateNotiBadgeAtStaff() {
    const notis = getData(DB_KEYS.NOTIFICATIONS).filter(n => n.role === 'staff' && !n.read);
    const badge = document.getElementById('noti-badge');
    if (notis.length > 0) {
        badge.innerText = notis.length;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}
