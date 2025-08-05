// Freelance Work Tracker JavaScript
class FreelanceTracker {
    constructor() {
        this.orders = this.loadOrders();
        this.employers = this.loadEmployers() || ['Joe Mac', 'Brian Oyaro'];
        this.monthlyExpenses = 11000 + 2000 + 500 + 5000;
        this.savingsGoal = 10000;
        this.targetIncome = this.monthlyExpenses + this.savingsGoal;
        this.currentFilter = 'all';
        this.paymentCategories = ['savings', 'rent', 'wifi', 'utilities', 'shopping', 'other'];
        this.financialSummary = this.calculateFinancialSummary();
        
        // Track collapsed sections
        this.collapsedSections = this.loadCollapsedSections() || {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentMonth();
        this.updateFinancialOverview();
        this.updateFinancialSummary();
        this.renderOrders();
    }

    setupEventListeners() {
        // Form toggle
        const toggleFormBtn = document.getElementById('toggleFormBtn');
        const addOrderForm = document.getElementById('addOrderForm');
        
        toggleFormBtn.addEventListener('click', () => {
            addOrderForm.classList.toggle('collapsed');
            toggleFormBtn.classList.toggle('collapsed');
        });

        // Work category change
        const workCategory = document.getElementById('workCategory');
        const employerNameGroup = document.getElementById('employerNameGroup');
        
        workCategory.addEventListener('change', (e) => {
            if (e.target.value === 'employer') {
                employerNameGroup.style.display = 'block';
                document.getElementById('employerName').required = true;
                this.populateEmployerSelect();
            } else {
                employerNameGroup.style.display = 'none';
                document.getElementById('employerName').required = false;
                document.getElementById('employerName').value = '';
            }
        });

        // Form submission
        addOrderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addOrder();
        });

        // Filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderOrders();
            });
        });

        // Set today's date as default
        document.getElementById('dateAssigned').valueAsDate = new Date();

        // Payment modal toggle
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('paymentModal').style.display = 'none';
        });

        // Payment status toggle
        document.getElementById('isPaid').addEventListener('change', (e) => {
            const paymentDetails = document.getElementById('paymentDetails');
            const statusText = document.getElementById('paidStatusText');
            if (e.target.checked) {
                paymentDetails.style.display = 'block';
                statusText.textContent = 'Paid';
            } else {
                paymentDetails.style.display = 'none';
                statusText.textContent = 'Unpaid';
            }
        });

        // Payment form submission
        document.getElementById('paymentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePaymentDetails();
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('paymentModal')) {
                document.getElementById('paymentModal').style.display = 'none';
            }
        });

        // Event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            // Status buttons
            if (e.target.closest('.status-btn')) {
                const btn = e.target.closest('.status-btn');
                const orderId = btn.dataset.orderId;
                const newStatus = btn.dataset.status;
                this.updateOrderStatus(orderId, newStatus);
            }
            
            // Delete buttons
            if (e.target.closest('.delete-btn')) {
                const btn = e.target.closest('.delete-btn');
                const orderId = btn.dataset.orderId;
                this.deleteOrder(orderId);
            }
            
            // Export buttons
            if (e.target.closest('.export-btn:not(.disabled)')) {
                const btn = e.target.closest('.export-btn');
                const category = btn.dataset.category;
                const status = btn.dataset.status;
                this.exportOrders(category, status);
            }
            
            // Delete employer buttons
            if (e.target.closest('.delete-employer-btn')) {
                const btn = e.target.closest('.delete-employer-btn');
                const employerName = btn.dataset.employer;
                this.deleteEmployer(employerName);
            }

            // Payment buttons
            if (e.target.closest('.payment-btn')) {
                const btn = e.target.closest('.payment-btn');
                const orderId = btn.dataset.orderId;
                this.showPaymentModal(orderId);
            }

            // Section collapse toggle buttons
            if (e.target.closest('.section-toggle-btn')) {
                const btn = e.target.closest('.section-toggle-btn');
                const sectionId = btn.dataset.sectionId;
                this.toggleSectionCollapse(sectionId);
            }
        });
    }

    // New method to handle section collapse/expand
    toggleSectionCollapse(sectionId) {
        const section = document.querySelector(`[data-section-id="${sectionId}"]`);
        const ordersList = section.querySelector('.orders-list');
        const toggleIcon = section.querySelector('.section-toggle-btn i');
        
        if (this.collapsedSections[sectionId]) {
            // Expand section
            ordersList.style.display = 'grid';
            toggleIcon.style.transform = 'rotate(0deg)';
            this.collapsedSections[sectionId] = false;
        } else {
            // Collapse section
            ordersList.style.display = 'none';
            toggleIcon.style.transform = 'rotate(-90deg)';
            this.collapsedSections[sectionId] = true;
        }
        
        this.saveCollapsedSections();
    }

    // Save collapsed sections state
    saveCollapsedSections() {
        try {
            localStorage.setItem('freelanceCollapsedSections', JSON.stringify(this.collapsedSections));
        } catch (error) {
            console.error('Error saving collapsed sections:', error);
        }
    }

    // Load collapsed sections state
    loadCollapsedSections() {
        try {
            const collapsed = localStorage.getItem('freelanceCollapsedSections');
            return collapsed ? JSON.parse(collapsed) : {};
        } catch (error) {
            console.error('Error loading collapsed sections:', error);
            return {};
        }
    }

    calculateFinancialSummary() {
        const summary = {
            savings: 0,
            rent: 0,
            wifi: 0,
            utilities: 0,
            shopping: 0,
            other: 0,
            totalPaid: 0
        };

        this.orders.forEach(order => {
            if (order.payment?.isPaid && order.payment.expenseCategory) {
                const category = order.payment.expenseCategory;
                if (this.paymentCategories.includes(category)) {
                    summary[category] += order.amount;
                    summary.totalPaid += order.amount;
                }
            }
        });

        return summary;
    }

    updateFinancialSummary() {
        this.financialSummary = this.calculateFinancialSummary();
        this.renderFinancialSummary();
    }

    renderFinancialSummary() {
        const container = document.getElementById('financialSummaryContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="financial-summary-card">
                <h3>Financial Summary</h3>
                <div class="financial-categories">
                    ${this.paymentCategories.map(category => `
                        <div class="financial-category ${category}">
                            <div class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                            <div class="category-amount">KSh ${this.financialSummary[category].toLocaleString()}</div>
                        </div>
                    `).join('')}
                    <div class="financial-total">
                        <div class="total-name">Total Paid</div>
                        <div class="total-amount">KSh ${this.financialSummary.totalPaid.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `;
    }

    populateEmployerSelect() {
        const select = document.getElementById('employerSelect');
        select.innerHTML = '<option value="">Select Existing</option>';
        this.employers.forEach(employer => {
            const option = document.createElement('option');
            option.value = employer;
            option.textContent = employer;
            select.appendChild(option);
        });
    }

    loadEmployers() {
        return JSON.parse(localStorage.getItem('freelanceEmployers'));
    }

    saveEmployers() {
        localStorage.setItem('freelanceEmployers', JSON.stringify(this.employers));
    }

    updateCurrentMonth() {
        const now = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    addOrder() {
        const workCategory = document.getElementById('workCategory').value;
        let employerName = '';

        if (workCategory === 'employer') {
            employerName = document.getElementById('employerName').value;
            if (!employerName.trim()) {
                this.showNotification('Employer name is required!', 'error');
                return;
            }

            // Add new employer if not exists
            if (!this.employers.includes(employerName)) {
                this.employers.push(employerName);
                this.saveEmployers();
            }
        }

        const formData = {
            id: Date.now().toString(),
            category: workCategory,
            employerName: workCategory === 'employer' ? employerName : '',
            title: document.getElementById('orderTitle').value,
            dateAssigned: document.getElementById('dateAssigned').value,
            pages: parseInt(document.getElementById('numPages').value),
            amount: parseFloat(document.getElementById('valueAmount').value),
            status: 'active',
            dateCreated: new Date().toISOString(),
            payment: {
                isPaid: false,
                datePaid: null,
                expenseCategory: null,
                notes: null
            }
        };

        this.orders.push(formData);
        this.saveOrders();
        this.updateFinancialOverview();
        this.renderOrders();
        this.resetForm();
        this.showNotification('Order added successfully!', 'success');
    }

    showPaymentModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById('paymentModal');
        document.getElementById('paymentOrderTitle').textContent = order.title;
        
        // Set current values
        const payment = order.payment || {};
        document.getElementById('isPaid').checked = payment.isPaid || false;
        document.getElementById('datePaid').value = payment.datePaid || '';
        document.getElementById('expenseCategory').value = payment.expenseCategory || '';
        document.getElementById('paymentNotes').value = payment.notes || '';
        
        // Trigger change event to show/hide details
        document.getElementById('isPaid').dispatchEvent(new Event('change'));
        
        modal.style.display = 'block';
    }

    savePaymentDetails() {
        const orderTitle = document.getElementById('paymentOrderTitle').textContent;
        const order = this.orders.find(o => o.title === orderTitle);
        if (!order) return;

        const wasPaid = order.payment?.isPaid || false;
        const previousCategory = order.payment?.expenseCategory || null;

        order.payment = {
            isPaid: document.getElementById('isPaid').checked,
            datePaid: document.getElementById('datePaid').value,
            expenseCategory: document.getElementById('expenseCategory').value,
            notes: document.getElementById('paymentNotes').value
        };

        this.saveOrders();
        this.renderOrders();
        document.getElementById('paymentModal').style.display = 'none';
        this.showNotification('Payment details saved!', 'success');

        // Update financial summary if payment status or category changed
        if (wasPaid !== order.payment.isPaid || previousCategory !== order.payment.expenseCategory) {
            this.updateFinancialSummary();
        }
    }

    deleteEmployer(employerName) {
        if (confirm(`Delete ${employerName} and all their orders?`)) {
            this.orders = this.orders.filter(order => 
                order.category !== 'employer' || order.employerName !== employerName
            );
            this.employers = this.employers.filter(name => name !== employerName);
            this.saveOrders();
            this.saveEmployers();
            this.renderOrders();
            this.updateFinancialSummary();
            this.showNotification(`${employerName} deleted!`, 'success');
        }
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = newStatus;
            this.saveOrders();
            this.updateFinancialOverview();
            this.renderOrders();
        }
    }

    deleteOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        if (confirm('Are you sure you want to delete this order?')) {
            const wasPaid = order.payment?.isPaid || false;
            
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.saveOrders();
            this.updateFinancialOverview();
            this.renderOrders();
            
            // Update financial summary if the deleted order was paid
            if (wasPaid) {
                this.updateFinancialSummary();
            }
            
            this.showNotification('Order deleted successfully!', 'success');
        }
    }

    updateFinancialOverview() {
        const totals = this.calculateTotals();
        
        document.getElementById('activeTotal').textContent = `KSh ${totals.active.toLocaleString()}`;
        document.getElementById('submittedTotal').textContent = `KSh ${totals.submitted.toLocaleString()}`;
        document.getElementById('completedTotal').textContent = `KSh ${totals.completed.toLocaleString()}`;
        
        const totalEarned = totals.completed;
        const progressPercentage = Math.min((totalEarned / this.targetIncome) * 100, 100);
        const remainingAmount = Math.max(this.targetIncome - totalEarned, 0);
        
        document.getElementById('progressFill').style.width = `${progressPercentage}%`;
        document.getElementById('progressPercentage').textContent = `${Math.round(progressPercentage)}%`;
        document.getElementById('remainingAmount').textContent = `KSh ${remainingAmount.toLocaleString()}`;
    }

    calculateTotals() {
        return this.orders.reduce((totals, order) => {
            totals[order.status] += order.amount;
            return totals;
        }, { active: 0, submitted: 0, completed: 0 });
    }

    renderOrders() {
        const container = document.getElementById('ordersContainer');
        container.innerHTML = '';

        // 1. Writers Admin Section
        const writersAdminOrders = this.filterOrders('writers-admin');
        if (writersAdminOrders.length > 0) {
            container.appendChild(this.createCategorySection('Writers Admin', writersAdminOrders, false, 'writers-admin'));
        }

        // 2. Employers Section (sorted alphabetically)
        [...this.employers].sort().forEach(employer => {
            const employerOrders = this.filterOrders('employer', employer);
            if (employerOrders.length > 0) {
                container.appendChild(this.createCategorySection(employer, employerOrders, true, `employer-${employer}`));
            }
        });

        // 3. Others Section
        const otherOrders = this.filterOrders('others');
        if (otherOrders.length > 0) {
            container.appendChild(this.createCategorySection('Others', otherOrders, false, 'others'));
        }

        // Show empty state if no orders
        if (container.children.length === 0) {
            container.appendChild(document.getElementById('emptyState'));
        }
    }

    filterOrders(category, employerName = '') {
        let filtered = this.orders;
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(order => order.status === this.currentFilter);
        }

        if (category === 'employer') {
            return filtered.filter(order => 
                order.category === 'employer' && order.employerName === employerName
            );
        } else {
            return filtered.filter(order => order.category === category);
        }
    }

    createCategorySection(title, orders, isEmployer = false, sectionId = '') {
        const section = document.createElement('div');
        section.className = 'category-section';
        section.setAttribute('data-section-id', sectionId);
        
        // Calculate counts and totals
        const statusCounts = {
            active: orders.filter(o => o.status === 'active').length,
            submitted: orders.filter(o => o.status === 'submitted').length,
            completed: orders.filter(o => o.status === 'completed').length
        };
        const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

        // Check if section should be collapsed
        const isCollapsed = this.collapsedSections[sectionId] || false;
        const chevronRotation = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';

        // Create section header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <div class="section-title-group">
                <button class="section-toggle-btn" data-section-id="${sectionId}">
                    <i class="fas fa-chevron-down" style="transform: ${chevronRotation}; transition: transform 0.3s ease;"></i>
                </button>
                <h3>${title} <span class="order-count">(${orders.length} orders)</span></h3>
            </div>
            <div class="section-total">Total: KSh ${totalAmount.toLocaleString()}</div>
            <div class="export-buttons">
                <button class="export-btn ${statusCounts.active ? '' : 'disabled'}" 
                        data-category="${title}" 
                        data-status="active">
                    <i class="fas fa-download"></i> Active (${statusCounts.active})
                </button>
                <button class="export-btn submitted ${statusCounts.submitted ? '' : 'disabled'}" 
                        data-category="${title}" 
                        data-status="submitted">
                    <i class="fas fa-download"></i> Submitted (${statusCounts.submitted})
                </button>
                <button class="export-btn completed ${statusCounts.completed ? '' : 'disabled'}" 
                        data-category="${title}" 
                        data-status="completed">
                    <i class="fas fa-download"></i> Completed (${statusCounts.completed})
                </button>
                ${isEmployer ? `
                <button class="delete-employer-btn" data-employer="${title}">
                    <i class="fas fa-trash"></i> Delete Employer
                </button>` : ''}
            </div>
        `;

        // Create orders list
        const ordersList = document.createElement('div');
        ordersList.className = 'orders-list';
        
        // Apply collapsed state
        if (isCollapsed) {
            ordersList.style.display = 'none';
        }

        // Sort orders by date (newest first) and add to list
        orders.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
              .forEach(order => {
                  ordersList.appendChild(this.createOrderCard(order));
              });

        // Assemble the section
        section.appendChild(header);
        section.appendChild(ordersList);

        return section;
    }

    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = `order-card ${order.status}`;
        
        const categoryDisplay = order.category === 'employer' ? 
            `${order.employerName} (Employer)` : 
            order.category === 'writers-admin' ? 'Writers Admin' : 'Other';
        
        const formattedDate = new Date(order.dateAssigned).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Add payment status to order header
        const paymentStatus = order.payment?.isPaid ? 
            `<span class="payment-badge paid">Paid - ${order.payment.expenseCategory}</span>` : 
            `<span class="payment-badge unpaid">Unpaid</span>`;

        card.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-title">${order.title}</div>
                    <div class="order-category ${order.category}">${categoryDisplay}</div>
                </div>
                ${paymentStatus}
            </div>
            
            <div class="order-details">
                <div class="detail-item">
                    <div class="detail-label">Date Assigned</div>
                    <div class="detail-value">${formattedDate}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Pages</div>
                    <div class="detail-value">${order.pages}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value amount">KSh ${order.amount.toLocaleString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Per Page</div>
                    <div class="detail-value">KSh ${(order.amount / order.pages).toFixed(2)}</div>
                </div>
            </div>
            
            <div class="status-controls">
                <div class="status-toggle">
                    <button class="status-btn ${order.status === 'active' ? 'active' : ''}" 
                            data-status="active"
                            data-order-id="${order.id}">
                        Active
                    </button>
                    <button class="status-btn ${order.status === 'submitted' ? 'active' : ''}" 
                            data-status="submitted"
                            data-order-id="${order.id}">
                        Submitted
                    </button>
                    <button class="status-btn ${order.status === 'completed' ? 'active' : ''}" 
                            data-status="completed"
                            data-order-id="${order.id}">
                        Completed
                    </button>
                </div>
                <button class="payment-btn" data-order-id="${order.id}">
                    <i class="fas fa-money-bill-wave"></i> Payment
                </button>
                <button class="delete-btn" data-order-id="${order.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return card;
    }

    exportOrders(category, status) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Get filtered orders
            const filteredOrders = this.getOrdersByCategoryAndStatus(category, status);
            const totalAmount = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
            
            // PDF Header
            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text(`${category} - ${status.charAt(0).toUpperCase() + status.slice(1)} Orders`, 14, 22);
            
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString()} | Total: KSh ${totalAmount.toLocaleString()}`, 14, 28);
            
            // Prepare table data
            const tableData = filteredOrders.map(order => [
                order.title,
                new Date(order.dateAssigned).toLocaleDateString(),
                order.pages,
                `KSh ${order.amount.toLocaleString()}`,
                order.status.toUpperCase(),
                order.payment?.isPaid ? 'Yes' : 'No',
                order.payment?.expenseCategory || ''
            ]);
            
            // Generate table
            doc.autoTable({
                head: [['Title', 'Date', 'Pages', 'Amount', 'Status', 'Paid', 'Expense Category']],
                body: tableData,
                startY: 35,
                theme: 'grid',
                headStyles: {
                    fillColor: [67, 153, 225],
                    textColor: 255
                },
                alternateRowStyles: {
                    fillColor: [240, 240, 240]
                }
            });
            
            // Save PDF
            doc.save(`${category.replace(/[^a-z0-9]/gi, '_')}_${status}_orders.pdf`);
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Failed to generate PDF', 'error');
        }
    }

    getOrdersByCategoryAndStatus(category, status) {
        if (category === 'Writers Admin') {
            return this.orders.filter(o => 
                o.category === 'writers-admin' && o.status === status
            );
        } else if (category === 'Others') {
            return this.orders.filter(o => 
                o.category === 'others' && o.status === status
            );
        } else {
            return this.orders.filter(o => 
                o.category === 'employer' && 
                o.employerName === category && 
                o.status === status
            );
        }
    }

    resetForm() {
        document.getElementById('addOrderForm').reset();
        document.getElementById('employerNameGroup').style.display = 'none';
        document.getElementById('employerName').required = false;
        document.getElementById('dateAssigned').valueAsDate = new Date();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #48bb78, #38a169)' : 'linear-gradient(135deg, #4299e1, #3182ce)'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    loadOrders() {
        try {
            const savedOrders = localStorage.getItem('freelanceOrders');
            return savedOrders ? JSON.parse(savedOrders) : [];
        } catch (error) {
            console.error('Error loading orders:', error);
            return [];
        }
    }

    saveOrders() {
        try {
            localStorage.setItem('freelanceOrders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving orders:', error);
        }
    }

    clearAllData() {
        if (confirm('Delete ALL orders and employers? This cannot be undone!')) {
            this.orders = [];
            this.employers = ['Joe Mac', 'Brian Oyaro'];
            this.collapsedSections = {};
            this.saveOrders();
            this.saveEmployers();
            this.saveCollapsedSections();
            this.updateFinancialOverview();
            this.updateFinancialSummary();
            this.renderOrders();
            this.showNotification('All data cleared!', 'success');
        }
    }

    backupData() {
        const backup = {
            orders: this.orders,
            employers: this.employers,
            collapsedSections: this.collapsedSections,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `freelance-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    restoreFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        if (backup.orders && backup.employers) {
                            if (confirm('This will replace all current data. Continue?')) {
                                this.orders = backup.orders;
                                this.employers = backup.employers;
                                this.collapsedSections = backup.collapsedSections || {};
                                this.saveOrders();
                                this.saveEmployers();
                                this.saveCollapsedSections();
                                this.updateFinancialOverview();
                                this.updateFinancialSummary();
                                this.renderOrders();
                                this.showNotification('Data restored!', 'success');
                            }
                        } else {
                            throw new Error('Invalid backup file');
                        }
                    } catch (error) {
                        this.showNotification('Error restoring data', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }
}

// Initialize tracker
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new FreelanceTracker();
    
    if (tracker.orders.length === 0 && !localStorage.getItem('freelanceOrders')) {
        addSampleData();
    }
});

function addSampleData() {
    const sampleOrders = [
        {
            id: '1',
            category: 'writers-admin',
            employerName: '',
            title: 'Research Paper on Climate Change',
            dateAssigned: '2024-08-01',
            pages: 5,
            amount: 2500,
            status: 'completed',
            dateCreated: new Date('2024-08-01').toISOString(),
            payment: {
                isPaid: true,
                datePaid: '2024-08-10',
                expenseCategory: 'savings',
                notes: 'Paid via M-Pesa'
            }
        },
        {
            id: '2',
            category: 'employer',
            employerName: 'Joe Mac',
            title: 'Website Content Writing',
            dateAssigned: '2024-08-02',
            pages: 8,
            amount: 4000,
            status: 'submitted',
            dateCreated: new Date('2024-08-02').toISOString(),
            payment: {
                isPaid: true,
                datePaid: '2024-08-12',
                expenseCategory: 'rent',
                notes: 'Paid via bank transfer'
            }
        },
        {
            id: '3',
            category: 'writers-admin',
            employerName: '',
            title: 'Essay on Digital Marketing',
            dateAssigned: '2024-08-03',
            pages: 3,
            amount: 1500,
            status: 'active',
            dateCreated: new Date('2024-08-03').toISOString(),
            payment: {
                isPaid: false,
                datePaid: null,
                expenseCategory: null,
                notes: null
            }
        }
    ];
    
    tracker.orders = sampleOrders;
    tracker.saveOrders();
    tracker.updateFinancialOverview();
    tracker.updateFinancialSummary();
    tracker.renderOrders();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('toggleFormBtn').click();
    }
    
    if (e.key === 'Escape') {
        const form = document.getElementById('addOrderForm');
        if (!form.classList.contains('collapsed')) {
            document.getElementById('toggleFormBtn').click();
        }
    }
});

// Auto-save every 30 seconds
setInterval(() => {
    if (tracker && tracker.orders.length > 0) {
        tracker.saveOrders();
    }
}, 30000);

// Ensure Font Awesome is loaded for WhatsApp icon
if (!document.querySelector('link[href*="font-awesome"]')) {
    const faLink = document.createElement('link');
    faLink.rel = 'stylesheet';
    faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
    document.head.appendChild(faLink);
}