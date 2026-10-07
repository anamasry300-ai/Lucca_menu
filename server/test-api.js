const BASE = 'http://localhost:3000';
const API_KEY = 'lucca-secret-key';

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ ${name}`);
    } catch (e) {
        console.log(`  ❌ ${name}: ${e.message}`);
    }
}

async function assert(condition, msg) {
    if (!condition) throw new Error(msg);
}

async function run() {
    console.log('\n☕ Lucca Caffè - اختبار السيرفر\n');

    // 1. Public key
    await test('Public key', async () => {
        const r = await fetch(`${BASE}/api/public-key`);
        assert(r.ok, 'status not ok');
        const d = await r.json();
        assert(d.apiKey === API_KEY, 'wrong api key');
    });

    // 2. Auth required (no key)
    await test('رفض بدون مفتاح', async () => {
        const r = await fetch(`${BASE}/api/tables`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
        assert(r.status === 401, 'should be 401');
    });

    // 3. Create table
    let tableId;
    await test('إضافة طاولة', async () => {
        const r = await fetch(`${BASE}/api/tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ number: 1, status: 'available', capacity: 4 })
        });
        assert(r.ok, 'create failed');
        const d = await r.json();
        tableId = d.id;
        assert(d.number === 1, 'wrong number');
    });

    // 4. Get all tables
    await test('جلب الطاولات', async () => {
        const r = await fetch(`${BASE}/api/tables`);
        assert(r.ok, 'get failed');
        const d = await r.json();
        assert(Array.isArray(d), 'not an array');
        assert(d.length > 0, 'empty');
    });

    // 5. Update table
    await test('تحديث طاولة', async () => {
        const r = await fetch(`${BASE}/api/tables/${tableId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({ status: 'occupied' })
        });
        assert(r.ok, 'update failed');
        const d = await r.json();
        assert(d.status === 'occupied', 'status not updated');
    });

    // 6. Get single table
    await test('جلب طاولة واحدة', async () => {
        const r = await fetch(`${BASE}/api/tables/${tableId}`);
        assert(r.ok, 'get failed');
        const d = await r.json();
        assert(d.id === tableId, 'wrong id');
    });

    // 7. Create order
    let orderId;
    await test('إضافة طلب', async () => {
        const r = await fetch(`${BASE}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({
                tableId: 1,
                items: [{ name: 'قهوة', price: 30, quantity: 2 }],
                customerName: 'عميل',
                status: 'pending',
                total: 60
            })
        });
        assert(r.ok, 'create failed');
        const d = await r.json();
        orderId = d.id;
        assert(d.total === 60, 'wrong total');
    });

    // 8. Get orders
    await test('جلب الطلبات', async () => {
        const r = await fetch(`${BASE}/api/orders`);
        assert(r.ok, 'get failed');
        const d = await r.json();
        assert(Array.isArray(d), 'not an array');
    });

    // 9. Sync
    await test('المزامنة', async () => {
        const r = await fetch(`${BASE}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
            body: JSON.stringify({
                orders: [{ id: 999, tableId: 5, items: [], total: 100 }],
                customers: [{ phone: '010000', name: 'test' }]
            })
        });
        assert(r.ok, 'sync failed');
        const d = await r.json();
        assert(d.success === true, 'wrong response');
    });

    // 10. 404
    await test('404', async () => {
        const r = await fetch(`${BASE}/api/tables/999999`);
        assert(r.status === 404, 'should be 404');
    });

    // 11. Delete table
    await test('مسح طاولة', async () => {
        const r = await fetch(`${BASE}/api/tables/${tableId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY }
        });
        assert(r.ok, 'delete failed');
        const d = await r.json();
        assert(d.success === true, 'wrong response');
    });

    console.log('\n✨ انتهى الاختبار\n');
}

run().catch(e => console.error('❌', e.message));
