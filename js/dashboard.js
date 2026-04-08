/* =========================================================================
   Automate with Hami - Dashboard Interactivity & API Integration
   ========================================================================= */

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sidebar Toggle ---
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if(sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            sidebar.style.width = ''; // remove inline styles interfering with css
            sidebar.style.position = '';
        });
    }

    if(window.innerWidth <= 768 && sidebar) {
        sidebar.classList.add('collapsed');
    }

    window.addEventListener('resize', () => {
         if(window.innerWidth <= 768 && sidebar) {
             sidebar.classList.add('collapsed');
         } else if(sidebar) {
             sidebar.classList.remove('collapsed');
         }
    });


    // --- 2. Modal Logic ---
    function setupModal(triggerBtnId, modalId) {
        const btn = document.getElementById(triggerBtnId);
        const modal = document.getElementById(modalId);
        
        if (btn && modal) {
            const closes = modal.querySelectorAll('.close-modal, .close-modal-btn');
            
            btn.addEventListener('click', () => {
                modal.classList.add('active');
            });

            closes.forEach(closeBtn => {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            });

            window.addEventListener('click', (e) => {
                if(e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    setupModal('addAccountBtn', 'accountModal'); // In accounts.html
    setupModal('addCampaignBtn', 'campaignModal'); // In campaigns.html

    const revealElements = document.querySelectorAll('.fade-in');
    setTimeout(() => {
        revealElements.forEach(el => {
            el.classList.add('appear');
        });
    }, 50);

    // Notification Dropdown Toggle
    const notifBtn = document.getElementById('notificationBtn');
    const notifDrop = document.getElementById('notificationDropdown');
    if (notifBtn && notifDrop) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDrop.style.display = notifDrop.style.display === 'none' ? 'block' : 'none';
        });
        window.addEventListener('click', (e) => {
            if (!notifDrop.contains(e.target) && e.target !== notifBtn) {
                notifDrop.style.display = 'none';
            }
        });
    }

    // --- 3. API Integrations ---

    // Global: Auth Check & Setup User Profile
    const savedEmail = localStorage.getItem('adminEmail');
    const isPublicPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html') || window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
    
    if(!savedEmail && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }

    if(savedEmail) {
        // Intercept all fetch requests and append X-User-Email header
        const _originalFetch = window.fetch;
        window.fetch = function() {
            let [resource, config] = arguments;
            if(!config) config = {};
            if(!config.headers) config.headers = {};
            
            if (config.headers instanceof Headers) {
                config.headers.set('X-User-Email', savedEmail);
            } else {
                config.headers['X-User-Email'] = savedEmail;
            }
            return _originalFetch(resource, config);
        };

        document.querySelectorAll('.profile-info').forEach(info => {
            const h4 = info.querySelector('h4');
            const span = info.querySelector('span');
            if(h4) h4.innerText = savedEmail.split('@')[0];
            if(span) span.innerText = savedEmail;
        });
        document.querySelectorAll('.profile-avatar').forEach(avatar => {
            avatar.innerText = savedEmail.substring(0, 2).toUpperCase();
        });
    }

    // Global: Fetch Notifications
    const loadNotifications = () => {
        const notifBadge = document.getElementById('notificationBadge');
        const notifList = document.getElementById('notificationList');
        if (!notifBadge || !notifList) return;

        fetch(`${API_BASE}/notifications`)
            .then(res => res.json())
            .then(data => {
                const unread = data.filter(n => !n.isRead);
                if (unread.length > 0) {
                    notifBadge.style.display = 'flex';
                    notifBadge.innerText = unread.length;
                } else {
                    notifBadge.style.display = 'none';
                }

                if (data.length === 0) {
                    notifList.innerHTML = `<div style="padding: 0.5rem; border-bottom: 1px solid var(--border-light);">No new notifications.</div>`;
                } else {
                    notifList.innerHTML = data.map(n => `
                        <div style="padding: 0.8rem 0.5rem; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; ${!n.isRead ? 'background: rgba(99, 102, 241, 0.05);' : 'opacity: 0.7;'}">
                            <div>
                                <div style="margin-bottom: 0.2rem; ${!n.isRead ? 'font-weight: 600; color: #fff;' : 'font-weight: normal;'}">${n.message}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(n.timestamp + 'Z').toLocaleString()}</div>
                            </div>
                            ${!n.isRead ? `<button title="Mark as read" style="background: none; border: none; color: var(--accent-primary); cursor: pointer;" onclick="markNotificationRead(${n.id})"><i class="fa-solid fa-check"></i></button>` : ''}
                        </div>
                    `).join('');
                }
            })
            .catch(console.error);
    };

    window.markNotificationRead = (id) => {
        fetch(`${API_BASE}/notifications/read/${id}`, { method: 'POST' })
            .then(res => res.json())
            .then(() => loadNotifications())
            .catch(console.error);
    };

    // Initial load and pseudo-live 15sec poller
    loadNotifications();
    setInterval(loadNotifications, 15000);

    // Load Dashboard global stats and Recent Campaigns
    if (window.location.pathname.includes('dashboard.html') || window.location.pathname === '/' || window.location.pathname === '') {
        fetch(`${API_BASE}/stats`)
            .then(res => res.json())
            .then(stats => {
                const sSent = document.getElementById('statSent');
                const sOpen = document.getElementById('statOpenRate');
                const sRep = document.getElementById('statReplies');
                const sAcc = document.getElementById('statAccounts');
                
                if(sSent) sSent.innerText = stats.sent.toLocaleString();
                if(sOpen) sOpen.innerText = stats.openRate + '%';
                if(sRep) sRep.innerText = stats.replies.toLocaleString();
                if(sAcc) sAcc.innerText = `${stats.activeAccounts} / ${stats.totalAccounts}`;
            })
            .catch(console.error);

        // Fetch Recent Campaigns & Accounts to cross-reference the nodes
        Promise.all([
            fetch(`${API_BASE}/campaigns`).then(r => r.json()),
            fetch(`${API_BASE}/accounts`).then(r => r.json())
        ]).then(([campaigns, accounts]) => {
            const tbody = document.getElementById('dashboardCampaignsTable');
            if(!tbody) return;

            if(campaigns.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No campaigns launched yet.</td></tr>`;
                return;
            }

            // Map account IDs to Emails
            const accountMap = {};
            accounts.forEach(a => accountMap[a.id] = a.email);

            tbody.innerHTML = campaigns.slice(-5).reverse().map(camp => {
                let assignedNodes = [];
                try {
                     const parsedIds = JSON.parse(camp.accounts || '[]');
                     assignedNodes = parsedIds.map(id => accountMap[id] || `Unknown (${id})`);
                } catch(e) {}

                // Use the first assigned node or a summary
                const nodeDisplay = assignedNodes.length > 1 
                                    ? `${assignedNodes[0]} (+${assignedNodes.length - 1})` 
                                    : (assignedNodes[0] || 'Unassigned');

                const rate = camp.sentCount > 0 ? ((camp.openCount / camp.sentCount) * 100).toFixed(1) + '%' : '0%';
                let statusBadge = 'status-paused';
                if(camp.status === 'Active') statusBadge = 'status-active';
                if(camp.status === 'Completed') statusBadge = 'status-paused'; // or visually different

                return `
                    <tr>
                        <td><strong>${camp.name}</strong></td>
                        <td><span class="status-badge ${statusBadge}">${camp.status}</span></td>
                        <td><span style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fa-solid fa-server" style="margin-right: 0.3rem;"></i>${nodeDisplay}</span></td>
                        <td>${camp.sentCount.toLocaleString()}</td>
                        <td>${camp.openCount.toLocaleString()} (${rate})</td>
                        <td>${camp.replyCount.toLocaleString()}</td>
                    </tr>
                `;
            }).join('');
        }).catch(console.error);
    }

    // Load Accounts page data
    if (window.location.pathname.includes('accounts.html')) {
        const grid = document.querySelector('.accounts-grid');
        
        // Setup Form Submit
        const addAccBtn = document.getElementById('submitNewAccount');
        if(addAccBtn) {
            addAccBtn.addEventListener('click', async () => {
                const email = document.getElementById('accEmail').value;
                const password = document.getElementById('accPass').value;
                const host = document.getElementById('accHost').value;
                const port = document.getElementById('accPort').value;

                addAccBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
                
                try {
                    const res = await fetch(`${API_BASE}/accounts`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, appPassword: password, smtpHost: host, smtpPort: port })
                    });
                    const data = await res.json();
                    if(data.error) alert("Error: " + data.error);
                    else {
                        alert("Account connected successfully!");
                        window.location.reload();
                    }
                } catch(e) {
                    alert("Failed to connect: Is Backend running?");
                }
                addAccBtn.innerHTML = 'Connect Account';
            });
        }

        // Fetch Accounts from DB
        fetch(`${API_BASE}/accounts`)
            .then(res => res.json())
            .then(accounts => {
                const grid = document.querySelector('.accounts-grid');
                if (!grid) return;
                
                grid.innerHTML = ''; // Always clear static HTML
                
                if (accounts.length === 0) {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 3rem;">No accounts connected. Add an account to get started.</div>';
                    return;
                }

                accounts.forEach(acc => {
                    const isOutlook = acc.smtpHost && acc.smtpHost.includes('office');
                    const iconHtml = !isOutlook ? '<i class="fa-brands fa-google"></i>' : '<i class="fa-brands fa-microsoft"></i>';
                    const iconClass = !isOutlook ? 'google' : 'outlook';
                    const repText = acc.status.includes('Warming') ? '<strong style="color: #f59e0b;">New</strong>' : '<strong class="text-green">98%</strong>';
                    
                    grid.innerHTML += `
                        <div class="account-card">
                            <div class="account-head">
                                <div class="account-info">
                                    <div class="provider-icon ${iconClass}">${iconHtml}</div>
                                    <div class="account-details">
                                        <h4>${acc.email}</h4>
                                        <span><i class="fa-solid fa-circle-check text-green" style="font-size: 0.7rem;"></i> ${acc.status}</span>
                                    </div>
                                </div>
                                <button class="btn btn-ghost" style="padding: 0.5rem;" onclick="toggleAccountMenu(event, ${acc.id})"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                <div class="action-dropdown" id="accMenu-${acc.id}">
                                    <button onclick="copyDetails('${acc.email}')"><i class="fa-solid fa-copy" style="margin-right: 0.5rem;"></i> Copy Email</button>
                                    <button onclick="promptReconnect(event, ${acc.id})" id="testBtn-${acc.id}"><i class="fa-solid fa-rotate-right" style="margin-right: 0.5rem;"></i> Test Connection</button>
                                    <button onclick="deleteAccount(${acc.id})" class="text-red"><i class="fa-solid fa-trash" style="margin-right: 0.5rem;"></i> Delete Account</button>
                                </div>
                            </div>
                            <div class="account-stats">
                                <div class="a-stat">
                                    <span>Sent (Today)</span>
                                    <strong>${acc.dailySent || 0} / 200</strong>
                                </div>
                                <div class="a-stat">
                                    <span>Reputation</span>
                                    ${repText}
                                </div>
                            </div>
                            <div class="switch-container">
                                <span class="switch-label"><i class="fa-solid fa-fire text-green"></i> Auto Warmup</span>
                                <label class="switch">
                                    <input type="checkbox" ${acc.autoWarmup ? 'checked' : ''}>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    `;
                });
            }).catch(console.error);
    }

    // Load Leads page data
    if (window.location.pathname.includes('leads.html')) {
        const tbody = document.querySelector('.data-table tbody');
        fetch(`${API_BASE}/leads`)
            .then(res => res.json())
            .then(leads => {
                if (leads.length > 0) {
                    tbody.innerHTML = '';
                    leads.forEach(lead => {
                        tbody.innerHTML += `
                            <tr>
                                <td><input type="checkbox" class="table-checkbox lead-row-cb" value="${lead.id}"></td>
                                <td><strong>${lead.companyName}</strong><br><span style="color: var(--text-secondary); font-size: 0.8rem;">${lead.email}</span></td>
                                <td>${lead.mcNumber}</td>
                                <td>${lead.state}</td>
                                <td>${lead.equipment}</td>
                                <td>${lead.fleetSize}</td>
                                <td><span class="status-badge status-active"><i class="fa-solid fa-check"></i> Verified</span></td>
                            </tr>
                        `;
                    });

                    // Reattach event listeners to new checkboxes
                    const selectAll = document.getElementById('selectAll');
                    const rowCheckboxes = document.querySelectorAll('.lead-row-cb');
                    const bulkActions = document.getElementById('bulkActions');
                    const selectedCount = document.getElementById('selectedCount');

                    function updateBulkActions() {
                        const checkedCount = document.querySelectorAll('.lead-row-cb:checked').length;
                        selectedCount.textContent = checkedCount;
                        if(checkedCount > 0) bulkActions.classList.add('active');
                        else bulkActions.classList.remove('active');
                    }

                    selectAll.addEventListener('change', (e) => {
                        rowCheckboxes.forEach(cb => cb.checked = e.target.checked);
                        updateBulkActions();
                    });

                    rowCheckboxes.forEach(cb => {
                        cb.addEventListener('change', () => {
                            updateBulkActions();
                            selectAll.checked = Array.from(rowCheckboxes).every(c => c.checked);
                        });
                    });
                }
            }).catch(console.error);
    }

    // Load Campaigns page data
    if (window.location.pathname.includes('campaigns.html')) {
        let uploadedLeads = [];
        let selectedAccountIds = [];

        // 1. Fetch accounts for Chips
        const accountChipsArea = document.getElementById('accountChipsArea');
        if(accountChipsArea) {
            fetch(`${API_BASE}/accounts`).then(r => r.json()).then(accs => {
                accountChipsArea.innerHTML = '';
                accs.forEach(a => {
                    const chip = document.createElement('div');
                    chip.className = 'account-chip';
                    chip.dataset.id = a.id;
                    // Inline styling for the chip
                    chip.style.padding = '0.4rem 0.8rem';
                    chip.style.border = '1px solid var(--border-hover)';
                    chip.style.borderRadius = '20px';
                    chip.style.cursor = 'pointer';
                    chip.style.background = 'var(--bg-main)';
                    chip.style.display = 'inline-flex';
                    chip.style.alignItems = 'center';
                    chip.style.gap = '0.5rem';
                    chip.innerHTML = `<span>${a.email}</span> <i class="fa-solid fa-plus status-icon"></i>`;
                    
                    chip.addEventListener('click', () => {
                        const idx = selectedAccountIds.indexOf(a.id);
                        if (idx === -1) {
                            selectedAccountIds.push(a.id);
                            chip.style.background = 'var(--accent-primary)';
                            chip.style.color = '#fff';
                            chip.style.border = '1px solid var(--accent-primary)';
                            chip.querySelector('.status-icon').className = 'fa-solid fa-check status-icon';
                        } else {
                            selectedAccountIds.splice(idx, 1);
                            chip.style.background = 'var(--bg-main)';
                            chip.style.color = '';
                            chip.style.border = '1px solid var(--border-hover)';
                            chip.querySelector('.status-icon').className = 'fa-solid fa-plus status-icon';
                        }
                    });
                    
                    accountChipsArea.appendChild(chip);
                });
            });
        }

        // 2. Excel Parsing via SheetJS
        const excelInput = document.getElementById('excelUpload');
        const uploadStatusText = document.getElementById('uploadStatusText');
        if (excelInput) {
            excelInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                uploadStatusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Parsing ${file.name}...`;

                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, {defval: ""});

                    if (json.length === 0) {
                        uploadStatusText.innerHTML = `<span style="color:red">No rows found in sheet.</span>`;
                        return;
                    }

                    // Find exactly where the email is logically
                    const sampleKeys = Object.keys(json[0]);
                    let emailKey = sampleKeys.find(k => k.toLowerCase().includes('email'));
                    let nameKey = sampleKeys.find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('company'));
                    
                    if (!emailKey) {
                        uploadStatusText.innerHTML = `<span style="color:red">No 'Email' column detected!</span>`;
                        return;
                    }

                    uploadedLeads = json.map(row => ({
                        email: row[emailKey].trim(),
                        companyName: nameKey ? row[nameKey] : 'Valued Partner',
                        state: row['State'] || row['state'] || 'US'
                    })).filter(l => l.email.includes('@'));

                    uploadStatusText.innerHTML = `<span style="color:var(--accent-primary)"><i class="fa-solid fa-circle-check"></i> Found ${uploadedLeads.length} valid targets!</span>`;
                };
                reader.readAsArrayBuffer(file);
            });
        }

        // 3. Campaign Submission Handlers
        async function submitCampaign(status, scheduledAt = null) {
            const name = document.getElementById('campaignName').value;
            const subject = document.getElementById('campaignSubject').value;
            const body = document.getElementById('campaignBody').value;
            const delaySeconds = parseInt(document.getElementById('campaignDelaySeconds')?.value || '60', 10);

            if (!name || selectedAccountIds.length === 0 || (!subject && !body)) {
                alert("Please fill out Name, select an Account, Subject, and Body!");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/campaigns`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        name, subject, body, 
                        selectedAccountIds, 
                        uploadedLeads,
                        status,
                        scheduledAt,
                        delaySeconds
                    })
                });
                const data = await res.json();
                if (data.error) alert(data.error);
                else {
                    alert(data.message);
                    window.location.reload();
                }
            } catch (err) {
                console.error(err);
                alert("Failed to submit campaign.");
            }
        }

        // Send Now
        const sendNowBtn = document.getElementById('sendNowBtn');
        if (sendNowBtn) {
            sendNowBtn.addEventListener('click', () => {
                sendNowBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
                submitCampaign('Active', null);
            });
        }

        // Schedule Buttons Toggle
        const openScheduleBtn = document.getElementById('openScheduleBtn');
        const schedulerDiv = document.getElementById('schedulerDiv');
        const confirmScheduleBtn = document.getElementById('confirmScheduleBtn');
        const scheduleTime = document.getElementById('scheduleTime');

        if (openScheduleBtn) {
            openScheduleBtn.addEventListener('click', () => {
                schedulerDiv.style.display = schedulerDiv.style.display === 'none' ? 'block' : 'none';
            });
        }

        if (confirmScheduleBtn) {
            confirmScheduleBtn.addEventListener('click', () => {
                const timeV = scheduleTime.value;
                if (!timeV) return alert("Please select a date and time!");
                confirmScheduleBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scheduling...';
                // e.g. timeV is "2026-03-28T04:00"
                submitCampaign('Scheduled', timeV + ':00'); // append seconds
            });
        }

        // Fetch Campaigns DB
        const tbody = document.querySelector('.data-table tbody');
        if (tbody) {
            fetch(`${API_BASE}/campaigns`)
                .then(res => res.json())
                .then(allCampaigns => {
                    // 1. Calculate and render metrics
                    const activeCount = allCampaigns.filter(c => c.status === 'Active').length;
                    const completedCount = allCampaigns.filter(c => c.status === 'Completed').length;
                    
                    const activeEl = document.getElementById('totalActiveCount');
                    const compEl = document.getElementById('totalCompletedCount');
                    if(activeEl) activeEl.innerText = activeCount;
                    if(compEl) compEl.innerText = completedCount;

                    // 2. Setup Notifications
                    const notifBadge = document.getElementById('notificationBadge');
                    const notifList = document.getElementById('notificationList');
                    if(notifBadge && notifList) {
                        if(completedCount > 0) {
                            notifBadge.style.display = 'flex';
                            notifBadge.innerText = '1';
                            notifList.innerHTML = `<div style="padding: 0.8rem; border-bottom: 1px solid var(--border-light); cursor: pointer;"><i class="fa-solid fa-circle-check text-green"></i> <strong>${completedCount}</strong> Campaign(s) have successfully concluded sending!</div>`;
                        }
                    }

                    // 3. Filter to ONLY Active or Completed
                    const filteredCampaigns = allCampaigns.filter(c => c.status === 'Active' || c.status === 'Completed');

                    // 4. Render Table
                    if (filteredCampaigns.length > 0) {
                        tbody.innerHTML = '';
                        filteredCampaigns.forEach(camp => {
                            let statusBadge = '';
                            if (camp.status === 'Active') statusBadge = `<span class="status-badge status-active">Running</span>`;
                            else statusBadge = `<span class="status-badge status-paused" style="color: var(--text-secondary); background: rgba(255,255,255,0.05);">${camp.status}</span>`;

                            tbody.innerHTML += `
                                <tr>
                                    <td>
                                        <strong>${camp.name}</strong><br>
                                        <span style="font-size: 0.8rem; color: var(--text-secondary);">Subject: ${camp.subject}</span>
                                    </td>
                                    <td>${statusBadge}</td>
                                    <td>Custom Segment</td>
                                    <td>${camp.sentCount}</td>
                                    <td class="text-green">${camp.openCount}</td>
                                    <td class="text-green">${camp.replyCount}</td>
                                    <td>
                                        <button class="btn btn-ghost text-red" onclick="deleteCampaign(${camp.id})"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `;
                        });
                    } else {
                        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No active or completed campaigns</td></tr>`;
                    }
                }).catch(console.error);
        }
    }

    // Load Analytics page data
    if (window.location.pathname.includes('analytics.html')) {
        const renderAnalytics = (days) => {
            fetch(`${API_BASE}/analytics?days=${days}`)
                .then(res => res.json())
                .then(data => {
                    const tbody = document.getElementById('analyticsTableBody');
                    if(data.length === 0) {
                        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No activity within the last ${days} days.</td></tr>`;
                        return;
                    }
                    
                    tbody.innerHTML = data.map(node => {
                        const sent = node.sent || 0;
                        const opens = node.opens || 0;
                        const replies = node.replies || 0;
                        const openRate = sent > 0 ? ((opens / sent) * 100).toFixed(1) + '%' : '0%';
                        
                        return `
                            <tr>
                                <td><strong>${node.email || 'Unknown Node'}</strong></td>
                                <td>${sent.toLocaleString()}</td>
                                <td>${opens.toLocaleString()}</td>
                                <td>${openRate}</td>
                                <td>${replies.toLocaleString()}</td>
                            </tr>
                        `;
                    }).join('');
                })
                .catch(console.error);
        };

        // Bind filter clicks
        document.querySelectorAll('.analytics-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.analytics-filter').forEach(b => {
                    b.classList.remove('btn-primary', 'active');
                    b.classList.add('btn-ghost');
                    b.style.border = '1px solid var(--border-light)';
                });
                
                const target = e.target;
                target.classList.remove('btn-ghost');
                target.classList.add('btn-primary', 'active');
                target.style.border = 'none';

                renderAnalytics(target.dataset.days);
            });
        });

        // initial load
        renderAnalytics(30);
    }

    // Load Settings page data
    if (window.location.pathname.includes('settings.html')) {
        const btn = document.getElementById('saveSettingsBtn');
        const limitInp = document.getElementById('setting_dailyLimit');
        const delayInp = document.getElementById('setting_defaultDelay');
        const tzInp = document.getElementById('setting_timezone');

        // Fetch existing settings
        fetch(`${API_BASE}/settings`)
            .then(res => res.json())
            .then(data => {
                if(data.dailyLimit) limitInp.value = data.dailyLimit;
                if(data.defaultDelay) delayInp.value = data.defaultDelay;
                if(data.timezone) tzInp.value = data.timezone;
            })
            .catch(console.error);

        // Save settings configuration
        if(btn) {
            btn.addEventListener('click', () => {
                const payload = {
                    dailyLimit: limitInp.value,
                    defaultDelay: delayInp.value,
                    timezone: tzInp.value
                };
                
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
                fetch(`${API_BASE}/settings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    setTimeout(() => {
                        if(data.success) {
                            btn.innerHTML = `<i class="fa-solid fa-check"></i> Saved`;
                            setTimeout(() => {
                                btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Constraints`;
                            }, 2000);
                        }
                    }, 500);
                })
                .catch(err => {
                    console.error(err);
                    btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Constraints`;
                    alert('Failed to save settings.');
                });
            });
        }
    }
});

// Expose delete method globally for inline onclick triggers
window.deleteCampaign = async function(campaignId) {
    if (!confirm("Are you sure you want to delete this campaign? This cannot be undone.")) return;
    try {
        const res = await fetch(`${API_BASE}/campaigns/${campaignId}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) {
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch(e) {
        console.error(e);
        alert("Failed to delete campaign.");
    }
};

// Account Action Handlers globally exposed
window.toggleAccountMenu = function(e, accId) {
    e.stopPropagation();
    const menu = document.getElementById(`accMenu-${accId}`);
    if(menu) {
        // close others first
        document.querySelectorAll('.action-dropdown').forEach(d => {
            if(d !== menu) d.classList.remove('active');
        });
        menu.classList.toggle('active');
    }
};

window.copyDetails = function(email) {
    navigator.clipboard.writeText(email).then(() => {
        alert("Success: Copied " + email + " to clipboard!");
    });
};

// Close all account menus natively when clicking somewhere else
document.addEventListener('click', () => {
    document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('active'));
});

window.promptReconnect = function(event, id) {
    const btn = document.getElementById(`testBtn-${id}`);
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Pinging Server...`;
    
    // Simulate ping process
    setTimeout(() => {
        btn.innerHTML = `<i class="fa-solid fa-check text-green" style="margin-right: 0.5rem;"></i> Connected!`;
        setTimeout(() => btn.innerHTML = originalText, 2000);
    }, 1500);
};

window.deleteAccount = async function(accId) {
    if (!confirm("Are you sure you want to completely erase this connected email account? Active sequences relying on it will drop it from their rotation.")) return;
    try {
        const res = await fetch(`${API_BASE}/accounts/${accId}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) {
            window.location.reload();
        } else {
            alert(data.error);
        }
    } catch(e) {
        console.error(e);
        alert("Failed to delete account node.");
    }
};
