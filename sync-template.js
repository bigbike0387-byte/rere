/**
 * sync-template.js - ตรรกะการ Sync ข้อมูลแบบ Real-time
 */

function setupCoreSync(role, table, renderFn) {
    renderFn();
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('krua_')) renderFn();
    });
    setInterval(renderFn, 3000);
    window.addEventListener('krua_sync', renderFn);
}
