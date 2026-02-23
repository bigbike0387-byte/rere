/**
 * staff.js - ตรรกะฝั่งสตาฟ
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth('staff')) return;
    setupCoreSync('staff', null, renderStaffUI);
});

function renderStaffUI() {
    const orders = getOrders().filter(o => !o.paid);
    document.getElementById('staff-order-list').innerHTML = orders.reverse().map(o => `
        <div class="card">
            <div class="flex-between">
                <strong>โต๊ะ ${o.table}</strong>
                <span class="badge bg-${o.status}">${getStatusText(o.status)}</span>
            </div>
            <div class="mt-1">
                ${o.status === 'waiting' ? `<button class="btn btn-primary" onclick="updateOrderStatus('${o.id}', 'cooking')">เริ่มทำ</button>` : ''}
                ${o.status === 'cooking' ? `<button class="btn btn-primary" onclick="updateOrderStatus('${o.id}', 'ready')">เสร็จแล้ว</button>` : ''}
            </div>
        </div>
    `).join('');
}
