document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginBtn = document.getElementById('login-btn');
    const genTokenBtn = document.getElementById('gen-token-btn');
    const saveBtn = document.getElementById('save-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    
    const tokenDisplay = document.getElementById('token-display');
    const tokenBox = document.getElementById('token-box');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    const loginLoader = document.getElementById('login-loader');
    const genLoader = document.getElementById('gen-loader');
    const saveLoader = document.getElementById('save-loader');

    const resultsContainer = document.getElementById('results-container');
    const proxyList = document.getElementById('proxy-list');

    // State
    let accessToken = localStorage.getItem('access_token');
    let userCreds = JSON.parse(localStorage.getItem('user_creds'));

    // Init
    if (accessToken) {
        showDashboard();
    }

    // Login Action
    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        loginError.textContent = '';
        loginLoader.classList.remove('hidden');
        loginBtn.disabled = true;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                accessToken = data.access_token;
                userCreds = { username, password };
                localStorage.setItem('access_token', accessToken);
                localStorage.setItem('user_creds', JSON.stringify(userCreds));
                showDashboard();
            } else {
                showError(data.error || 'Authentication failed');
            }
        } catch (err) {
            showError('Server connection error');
        } finally {
            loginLoader.classList.add('hidden');
            loginBtn.disabled = false;
        }
    });

    // Generate Token Action
    genTokenBtn.addEventListener('click', async () => {
        if (!userCreds) {
            logout();
            return;
        }

        genLoader.classList.remove('hidden');
        genTokenBtn.disabled = true;

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userCreds)
            });

            const data = await response.json();

            if (response.ok) {
                accessToken = data.access_token;
                localStorage.setItem('access_token', accessToken);
                tokenBox.textContent = accessToken;
                tokenDisplay.classList.remove('hidden');
                updateStatus('Token refreshed successfully', 'success');
            } else {
                updateStatus('Failed to refresh token', 'error');
            }
        } catch (err) {
            updateStatus('Network error', 'error');
        } finally {
            genLoader.classList.add('hidden');
            genTokenBtn.disabled = false;
        }
    });

    // Save Data Action
    saveBtn.addEventListener('click', async () => {
        if (!accessToken) return;

        saveLoader.classList.remove('hidden');
        saveBtn.disabled = true;
        updateStatus('Syncing data with database...', 'pending');

        try {
            const response = await fetch('/proxies/sync', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            const data = await response.json();

            if (response.ok) {
                updateStatus(`${data.count} proxies stored in PostgreSQL!`, 'success');
                renderResults(data.data);
            } else {
                updateStatus(`Sync failed: ${data.error}`, 'error');
            }
        } catch (err) {
            updateStatus('Sync error: Check server logs', 'error');
        } finally {
            saveLoader.classList.add('hidden');
            saveBtn.disabled = false;
        }
    });

    function renderResults(proxies) {
        proxyList.innerHTML = '';
        proxies.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${p.id}</td>
                <td class="proxy-name">${p.proxy}</td>
                <td class="timestamp">${new Date(p.created_at).toLocaleString()}</td>
            `;
            proxyList.appendChild(tr);
        });
        resultsContainer.classList.remove('hidden');
    }

    // UI Helper Functions
    function showDashboard() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        if (accessToken) {
            tokenBox.textContent = accessToken;
        }
    }

    function showError(msg) {
        loginError.textContent = msg;
    }

    function updateStatus(msg, type) {
        statusText.textContent = msg;
        statusDot.className = 'dot';
        if (type === 'success') statusDot.classList.add('active');
        if (type === 'error') statusText.style.color = '#ef4444';
        else statusText.style.color = 'var(--text-dim)';
    }

    function logout() {
        localStorage.clear();
        window.location.reload();
    }

    logoutBtn.addEventListener('click', logout);
});
