const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCatalogService } = require('../service/rental-catalog-service');
const id = '6ae620e8fb45e4ba0ee52cb7';
const row = { id, title: 'Палатка', pricePerDay: 123.45, status: 'active', photo: '/uploads/tent.png' };
const mock = (body, status = 200) => async () => ({ ok: status === 200, status, json: async () => body });
test('forwards all filters, strips unknown keys and normalizes images without rounding prices', async () => {
    let url;
    const service = createCatalogService(async input => { url = new URL(input); return mock({data:[row],page:1,total:1,totalPages:1})(); });
    const result = await service.list({search:'палатка',dateFrom:'2026-12-01',dateTo:'2026-12-03',unitsNeeded:'2',pickupMethod:'delivery',categorySlugs:'tent',priceFrom:'100.50',unknown:'no'});
    assert.equal(url.searchParams.get('dateTo'), '2026-12-03'); assert.equal(url.searchParams.get('unitsNeeded'), '2'); assert.equal(url.searchParams.has('unknown'), false);
    assert.equal(result.data[0].photo, 'https://api.rent.gorodaivesi.ru/uploads/tent.png'); assert.equal(result.data[0].pricePerDay,123.45);
});
test('empty catalog stays empty', async () => assert.deepEqual(await createCatalogService(mock({data:[],page:1,total:0,totalPages:0})).list({}),{data:[],page:1,total:0,totalPages:0}));
test('detail allows active only and rejects malformed IDs before provider call', async () => {
    assert.equal((await createCatalogService(mock({listing:row})).detail(id)).listing.id,id);
    await assert.rejects(createCatalogService(mock({listing:{...row,status:'hidden'}})).detail(id),{status:404});
    await assert.rejects(createCatalogService(() => {throw Error('must not call');}).detail('bad'),{status:404});
});
test('provider failures and non-active list are explicit errors', async () => {
    await assert.rejects(createCatalogService(mock({},500)).list({}),{status:502});
    await assert.rejects(createCatalogService(mock({},400)).list({}),{status:400});
    await assert.rejects(createCatalogService(mock({data:[{...row,status:'draft'}],total:1})).list({}),{status:502});
    await assert.rejects(createCatalogService(async()=>{throw Error('timeout');}).list({}),{status:502});
});
test('category public projection and query object rejection', async () => {
    assert.deepEqual(await createCatalogService(mock({data:[{id:'1',title:'T',slug:'t',isActive:true,secret:'x'},{id:'2',isActive:false}]})).categories(),{data:[{id:'1',title:'T',slug:'t',isActive:true,icon:undefined,sortOrder:undefined}]});
    await assert.rejects(createCatalogService(mock({})).list({search:{$ne:''}}),{status:400});
});
