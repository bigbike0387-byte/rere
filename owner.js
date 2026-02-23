/**
 * owner.js - ตรรกะฝั่งเจ้าของร้าน
 */

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth('owner')) return;
    setupCoreSync('owner', null, renderStatsAtOwner);
});

function renderStatsAtOwner() {
    const report = getReportData();
    document.getElementById('owner-sales').innerText = `${report.totalSales.toLocaleString()}฿`;
    document.getElementById('owner-orders').innerText = report.orderCount;

    renderChartAtOwner(report.hourly);

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

function renderChartAtOwner(hourlyData) {
    const container = document.getElementById('hourly-chart');
    if (!container) return;

    const maxVal = Math.max(...hourlyData, 1);
    container.innerHTML = hourlyData.map((val, h) => `
        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100px;">
            <div style="width: 70%; background: var(--primary); height: ${(val / maxVal) * 100}%; border-radius: 3px; min-height: ${val > 0 ? '2px' : '0'}"></div>
            <small style="font-size: 0.6rem; color: #888;">${h}</small>
        </div>
    `).join('');
}
