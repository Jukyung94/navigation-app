/**
 * Marker Service
 *
 * Mock implementation of the marker API.
 * All functions return Promises to match real HTTP calls.
 * Replace the bodies with fetch() / axios calls when the backend is ready.
 *
 * Expected REST contract (future):
 *   GET    /api/markers          → list all markers (optionally filtered by groupId)
 *   GET    /api/markers/:id      → single marker
 *   POST   /api/markers          → create marker
 *   PUT    /api/markers/:id      → update marker
 *   DELETE /api/markers/:id      → delete marker
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'exits';
const SIMULATED_DELAY_MS = 400; // simulate network latency

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeStorage = (markers) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
};

// ─── API ────────────────────────────────────────────────────────────────────

/**
 * Fetch all markers.
 * Future: GET /api/markers?groupId=xxx
 *
 * @param {{ groupId?: string }} [params]
 * @returns {Promise<Marker[]>}
 */
export async function getMarkers({ groupId } = {}) {
  await delay(SIMULATED_DELAY_MS);

  // TODO: replace with:
  // const res = await fetch(`/api/markers${groupId ? `?groupId=${groupId}` : ''}`);
  // if (!res.ok) throw new Error('Failed to fetch markers');
  // return res.json();

  const all = readStorage();
  if (groupId) return all.filter((m) => m.groupId === groupId);
  return all;
}

/**
 * Fetch a single marker by id.
 * Future: GET /api/markers/:id
 *
 * @param {string} id
 * @returns {Promise<Marker>}
 */
export async function getMarker(id) {
  await delay(SIMULATED_DELAY_MS);

  // TODO: replace with:
  // const res = await fetch(`/api/markers/${id}`);
  // if (!res.ok) throw new Error('Marker not found');
  // return res.json();

  const marker = readStorage().find((m) => m.id === id);
  if (!marker) throw new Error(`Marker ${id} not found`);
  return marker;
}

/**
 * Save a new marker.
 * Future: POST /api/markers
 *
 * @param {Omit<Marker, 'id'>} data
 * @returns {Promise<Marker>}
 */
export async function createMarker(data) {
  await delay(SIMULATED_DELAY_MS);

  // TODO: replace with:
  // const res = await fetch('/api/markers', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error('Failed to create marker');
  // return res.json();

  const newMarker = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const all = readStorage();
  writeStorage([...all, newMarker]);
  return newMarker;
}

/**
 * Update an existing marker.
 * Future: PUT /api/markers/:id
 *
 * @param {string} id
 * @param {Partial<Marker>} data
 * @returns {Promise<Marker>}
 */
export async function updateMarker(id, data) {
  await delay(SIMULATED_DELAY_MS);

  // TODO: replace with:
  // const res = await fetch(`/api/markers/${id}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // if (!res.ok) throw new Error('Failed to update marker');
  // return res.json();

  const all = readStorage();
  const index = all.findIndex((m) => m.id === id);
  if (index === -1) throw new Error(`Marker ${id} not found`);

  const updated = { ...all[index], ...data, updatedAt: new Date().toISOString() };
  all[index] = updated;
  writeStorage(all);
  return updated;
}

/**
 * Delete a marker.
 * Future: DELETE /api/markers/:id
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteMarker(id) {
  await delay(SIMULATED_DELAY_MS);

  // TODO: replace with:
  // const res = await fetch(`/api/markers/${id}`, { method: 'DELETE' });
  // if (!res.ok) throw new Error('Failed to delete marker');

  const all = readStorage();
  writeStorage(all.filter((m) => m.id !== id));
}

/**
 * Share markers with another user / group.
 * Future: POST /api/markers/share
 *
 * @param {string[]} markerIds
 * @param {string} groupId
 * @returns {Promise<{ shared: number }>}
 */
export async function shareMarkers(markerIds, groupId) {
  await delay(SIMULATED_DELAY_MS);

  // TODO: replace with:
  // const res = await fetch('/api/markers/share', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ markerIds, groupId }),
  // });
  // if (!res.ok) throw new Error('Failed to share markers');
  // return res.json();

  const all = readStorage();
  let count = 0;
  const updated = all.map((m) => {
    if (markerIds.includes(m.id)) {
      count++;
      return { ...m, groupId, updatedAt: new Date().toISOString() };
    }
    return m;
  });
  writeStorage(updated);
  return { shared: count };
}

/**
 * @typedef {Object} Marker
 * @property {string}      id          - UUID
 * @property {string}      name        - Display name
 * @property {number}      lat         - Latitude
 * @property {number}      lng         - Longitude
 * @property {number|null} altitude    - Elevation in metres
 * @property {number}      accuracy    - GPS accuracy in metres
 * @property {string}      timestamp   - ISO date when the user was at this location
 * @property {string}      createdAt   - ISO date of record creation
 * @property {string}      updatedAt   - ISO date of last update
 * @property {string}      [groupId]   - Optional group / building ID for sharing
 */
