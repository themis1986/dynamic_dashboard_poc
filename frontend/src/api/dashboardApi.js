// ── API Configuration ──────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const USER_ID = 'user-1' // In production, get from authentication service

// ── Helper for authenticated API requests ──────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: USER_ID,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
    throw error
  }
}

// ── API Methods ────────────────────────────────────────────────────────────────

/**
 * Fetch all available domains
 * @returns {Promise<Array>} Array of domains with {id, name, icon, description}
 */
export async function fetchDomains() {
  return apiRequest('/domains')
}

/**
 * Fetch datasets for a specific domain
 * @param {string} domainKey - Domain key (e.g., 'sales', 'finance')
 * @returns {Promise<Array>} Array of datasets with {id, name, description, tags}
 */
export async function fetchDatasets(domainKey) {
  return apiRequest(`/domains/${domainKey}/datasets`)
}

/**
 * Fetch data for a specific domain and dataset
 * @param {string} domainKey - Domain key
 * @param {string} datasetKey - Dataset key
 * @returns {Promise<Object>} Data object with {cats, series, rows, kpi}
 */
export async function fetchData(domainKey, datasetKey) {
  return apiRequest(`/data/${domainKey}/${datasetKey}`)
}

/**
 * Fetch user's dashboard with all widgets
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Dashboard object with {id, userId, name, widgets}
 */
export async function fetchDashboard(userId = USER_ID) {
  return apiRequest(`/dashboards/${userId}`)
}

/**
 * Save dashboard widgets and layout
 * @param {Array} widgets - Array of widget objects
 * @param {string} layout - Layout ID (e.g., 'single', 'two-equal', etc.)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Saved dashboard
 */
export async function saveDashboard(widgets, layout = 'single', userId = USER_ID) {
  return apiRequest(`/dashboards/${userId}`, {
    method: 'POST',
    body: JSON.stringify({ widgets, layout }),
  })
}
