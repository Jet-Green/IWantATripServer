// Configured only by the server; never accept an origin from the request.
const SOURCE = new URL(process.env.RENTAL_API_ORIGIN || 'https://api.rent.gorodaivesi.ru').origin;
const allowed = ['page', 'limit', 'search', 'categorySlugs', 'priceFrom', 'priceTo', 'pickupMethod', 'unitsNeeded', 'sortBy', 'dateFrom', 'dateTo'];
class CatalogError extends Error {
    constructor(status, message) { super(message); this.status = status; }
}
function buildQuery(query) {
    const params = new URLSearchParams();
    for (const key of allowed) {
        const value = query[key];
        if (value === undefined) continue;
        if (typeof value !== 'string' || value.length > 500) throw new CatalogError(400, `Некорректный параметр ${key}`);
        params.set(key, value);
    }
    return params;
}
function normalizeListing(listing) {
    if (!listing || listing.status !== 'active') throw new CatalogError(404, 'Объявление не найдено');
    const { id, title, description, photo, pricePerDay, minRentalDays, availableUnits, pickupMethods, pickupAddress, deliveryZone, categorySlugs } = listing;
    let image;
    if (photo) {
        try { const url = new URL(photo, SOURCE); if (['http:', 'https:'].includes(url.protocol)) image = url.href; } catch { /* no image */ }
    }
    return { id, title, description, photo: image, pricePerDay, minRentalDays, availableUnits, pickupMethods, pickupAddress, deliveryZone, categorySlugs, status: 'active' };
}
function createCatalogService(fetchImpl = globalThis.fetch) {
    async function request(path, params) {
        let response;
        try { response = await fetchImpl(`${SOURCE}/api/${path}?${params || ''}`, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' }, redirect: 'error' }); }
        catch { throw new CatalogError(502, 'Каталог аренды временно недоступен'); }
        if (!response.ok) throw new CatalogError([400, 404].includes(response.status) ? response.status : 502, response.status === 404 ? 'Объявление не найдено' : 'Не удалось получить каталог аренды');
        try { return await response.json(); } catch { throw new CatalogError(502, 'Некорректный ответ каталога аренды'); }
    }
    return {
        async list(query) {
            const result = await request('listings', buildQuery(query));
            if (!Array.isArray(result.data) || !Number.isFinite(result.total)) throw new CatalogError(502, 'Некорректный ответ каталога аренды');
            if (result.data.some(row => row.status !== 'active')) throw new CatalogError(502, 'Некорректный ответ каталога аренды');
            return { data: result.data.map(normalizeListing), page: result.page, total: result.total, totalPages: result.totalPages };
        },
        async detail(id) {
            if (!/^[a-f\d]{24}$/i.test(id)) throw new CatalogError(404, 'Объявление не найдено');
            const result = await request(`listings/${id}`);
            return { listing: normalizeListing(result.listing) };
        },
        async categories() {
            const result = await request('categories', 'isActive=true');
            if (!Array.isArray(result.data)) throw new CatalogError(502, 'Некорректный ответ каталога аренды');
            return { data: result.data.filter(row => row.isActive).map(({id,title,slug,icon,sortOrder,isActive}) => ({id,title,slug,icon,sortOrder,isActive})) };
        }
    };
}
module.exports = { createCatalogService, buildQuery, CatalogError };
