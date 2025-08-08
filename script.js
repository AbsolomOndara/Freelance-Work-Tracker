// Freelance Work Tracker JavaScript with Monthly Tithe Calculator
class FreelanceTracker {
    constructor() {
        this.orders = this.loadOrders();
        this.employers = this.loadEmployers() || ['Joe Mac', 'Brian Oyaro'];
        this.monthlyExpenses = 11000 + 2000 + 500 + 5000;
        this.savingsGoal = 10000;
        this.targetIncome = this.monthlyExpenses + this.savingsGoal;
        this.currentFilter = 'all';
        this.paymentCategories = ['savings', 'rent', 'wifi', 'utilities', 'shopping', 'tithe', 'other'];
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
        this.updateMonthlyTithe();
        this.renderOrders();
    }

    // New method to calculate monthly tithe
    calculateMonthlyTithe() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const monthlyPaidAmount = this.orders
            .filter(order => {
                if (!order.payment?.isPaid || !order.payment.datePaid) return false;
                
                const paymentDate = new Date(order.payment.datePaid);
                return paymentDate.getMonth() === currentMonth && 
                       paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, order) => sum + order.amount, 0);
        
        const titheAmount = monthlyPaidAmount * 0.10;
        
        // Calculate already paid tithe this month
        const paidTithe = this.orders
            .filter(order => {
                if (!order.payment?.isPaid || !order.payment.datePaid) return false;
                if (order.payment.expenseCategory !== 'tithe') return false;
                
                const paymentDate = new Date(order.payment.datePaid);
                return paymentDate.getMonth() === currentMonth && 
                       paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, order) => sum + order.amount, 0);
        
        const remainingTithe = Math.max(0, titheAmount - paidTithe);
        
        return {
            monthlyIncome: monthlyPaidAmount,
            recommendedTithe: titheAmount,
            paidTithe: paidTithe,
            remainingTithe: remainingTithe,
            tithePercentage: monthlyPaidAmount > 0 ? (paidTithe / monthlyPaidAmount * 100) : 0
        };
    }

    // New method to update monthly tithe display
    updateMonthlyTithe() {
        const titheData = this.calculateMonthlyTithe();
        
        // Update tithe overview card
        const titheOverview = document.getElementById('titheOverview');
        if (titheOverview) {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const currentMonth = monthNames[new Date().getMonth()];
            
            titheOverview.innerHTML = `
                <div class="tithe-card">
                    <div class="tithe-header">
                        <h3><i class="fas fa-hands-praying"></i> ${currentMonth} Tithe</h3>
                        <div class="tithe-percentage">${titheData.tithePercentage.toFixed(1)}%</div>
                    </div>
                    <div class="tithe-details">
                        <div class="tithe-item">
                            <span class="label">Monthly Income:</span>
                            <span class="value">KSh ${titheData.monthlyIncome.toLocaleString()}</span>
                        </div>
                        <div class="tithe-item">
                            <span class="label">Recommended (10%):</span>
                            <span class="value recommended">KSh ${titheData.recommendedTithe.toLocaleString()}</span>
                        </div>
                        <div class="tithe-item">
                            <span class="label">Already Paid:</span>
                            <span class="value paid">KSh ${titheData.paidTithe.toLocaleString()}</span>
                        </div>
                        <div class="tithe-item ${titheData.remainingTithe > 0 ? 'remaining' : 'complete'}">
                            <span class="label">Remaining:</span>
                            <span class="value">KSh ${titheData.remainingTithe.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="tithe-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(titheData.tithePercentage / 10 * 100, 100)}%"></div>
                        </div>
                        <div class="progress-text">
                            ${titheData.remainingTithe > 0 ? 
                                `KSh ${titheData.remainingTithe.toLocaleString()} needed to reach 10%` : 
                                'Monthly tithe goal achieved! 🙏'}
                        </div>
                    </div>
                    ${titheData.remainingTithe > 0 ? 
                        `<button class="quick-tithe-btn" onclick="tracker.quickTitheEntry(${titheData.remainingTithe})">
                            <i class="fas fa-plus"></i> Add Tithe Payment
                        </button>` : 
                        '<div class="tithe-complete"><i class="fas fa-check-circle"></i> Tithe Complete</div>'
                    }
                </div>
            `;
        }
    }

    // New method for quick tithe entry
    quickTitheEntry(suggestedAmount) {
        const modal = this.createQuickTitheModal(suggestedAmount);
        document.body.appendChild(modal);
        modal.style.display = 'block';
    }

    createQuickTitheModal(suggestedAmount) {
        const modal = document.createElement('div');
        modal.id = 'quickTitheModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-hands-praying"></i> Record Tithe Payment</h3>
                    <span class="close-tithe-modal">&times;</span>
                </div>
                <form id="quickTitheForm">
                    <div class="form-group">
                        <label for="titheTitle">Title</label>
                        <input type="text" id="titheTitle" value="Monthly Tithe" required>
                    </div>
                    <div class="form-group">
                        <label for="titheAmount">Amount (KSh)</label>
                        <input type="number" id="titheAmount" min="0" step="0.01" 
                               value="${suggestedAmount.toFixed(2)}" required>
                        <small>Suggested amount based on 10% of monthly income</small>
                    </div>
                    <div class="form-group">
                        <label for="titheDate">Date Paid</label>
                        <input type="date" id="titheDate" required>
                    </div>
                    <div class="form-group">
                        <label for="titheNotes">Notes (Optional)</label>
                        <textarea id="titheNotes" rows="3" placeholder="Church name, payment method, etc."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn">Record Tithe</button>
                    </div>
                </form>
            </div>
        `;

        // Set today's date as default
        modal.querySelector('#titheDate').valueAsDate = new Date();

        // Setup event listeners
        modal.querySelector('.close-tithe-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#quickTitheForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveQuickTithe();
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    saveQuickTithe() {
        const titheOrder = {
            id: Date.now().toString(),
            category: 'others',
            employerName: '',
            title: document.getElementById('titheTitle').value,
            dateAssigned: document.getElementById('titheDate').value,
            pages: 1, // Default to 1 page for tithe entries
            amount: parseFloat(document.getElementById('titheAmount').value),
            status: 'completed', // Tithe payments are always completed
            dateCreated: new Date().toISOString(),
            payment: {
                isPaid: true,
                datePaid: document.getElementById('titheDate').value,
                expenseCategory: 'tithe',
                notes: document.getElementById('titheNotes').value || 'Tithe payment'
            }
        };

        this.orders.push(titheOrder);
        this.saveOrders();
        this.updateFinancialOverview();
        this.updateFinancialSummary();
        this.updateMonthlyTithe();
        this.renderOrders();
        this.showNotification('Tithe payment recorded successfully! 🙏', 'success');
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
            if (e.target === document.getElementById('editModal')) {
                document.getElementById('editModal').style.display = 'none';
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

            // Edit buttons
            if (e.target.closest('.edit-btn')) {
                const btn = e.target.closest('.edit-btn');
                const orderId = btn.dataset.orderId;
                this.showEditModal(orderId);
            }

            // Section collapse toggle buttons
            if (e.target.closest('.section-toggle-btn')) {
                const btn = e.target.closest('.section-toggle-btn');
                const sectionId = btn.dataset.sectionId;
                this.toggleSectionCollapse(sectionId);
            }
        });
    }

    showEditModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Create or get modal
        let modal = document.getElementById('editModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'editModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-edit-modal">&times;</span>
                    <h3>Edit Order</h3>
                    <form id="editOrderForm">
                        <input type="hidden" id="editOrderId">
                        <div class="form-group">
                            <label for="editOrderTitle">Title</label>
                            <input type="text" id="editOrderTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="editWorkCategory">Category</label>
                            <select id="editWorkCategory" required>
                                <option value="writers-admin">Writers Admin</option>
                                <option value="employer">Employer</option>
                                <option value="others">Others</option>
                            </select>
                        </div>
                        <div class="form-group" id="editEmployerNameGroup" style="display: none;">
                            <label for="editEmployerName">Employer Name</label>
                            <input type="text" id="editEmployerName">
                        </div>
                        <div class="form-group">
                            <label for="editDateAssigned">Date Assigned</label>
                            <input type="date" id="editDateAssigned" required>
                        </div>
                        <div class="form-group">
                            <label for="editNumPages">Pages</label>
                            <input type="number" id="editNumPages" min="1" required>
                        </div>
                        <div class="form-group">
                            <label for="editValueAmount">Amount (KSh)</label>
                            <input type="number" id="editValueAmount" min="0" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label for="editStatus">Status</label>
                            <select id="editStatus" required>
                                <option value="active">Active</option>
                                <option value="submitted">Submitted</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <button type="submit" class="btn">Save Changes</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Setup event listeners for the modal
            document.querySelector('.close-edit-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            document.getElementById('editWorkCategory').addEventListener('change', (e) => {
                const employerGroup = document.getElementById('editEmployerNameGroup');
                if (e.target.value === 'employer') {
                    employerGroup.style.display = 'block';
                } else {
                    employerGroup.style.display = 'none';
                }
            });
            
            document.getElementById('editOrderForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEditedOrder();
            });
        }
        
        // Populate form with order data
        document.getElementById('editOrderId').value = order.id;
        document.getElementById('editOrderTitle').value = order.title;
        document.getElementById('editWorkCategory').value = order.category;
        document.getElementById('editEmployerName').value = order.employerName || '';
        document.getElementById('editDateAssigned').value = order.dateAssigned;
        document.getElementById('editNumPages').value = order.pages;
        document.getElementById('editValueAmount').value = order.amount;
        document.getElementById('editStatus').value = order.status;
        
        // Show employer field if needed
        if (order.category === 'employer') {
            document.getElementById('editEmployerNameGroup').style.display = 'block';
        }
        
        modal.style.display = 'block';
    }

    saveEditedOrder() {
        const orderId = document.getElementById('editOrderId').value;
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        
        const wasPaid = order.payment?.isPaid || false;
        const previousCategory = order.payment?.expenseCategory || null;
        
        // Update order with new values
        order.title = document.getElementById('editOrderTitle').value;
        order.category = document.getElementById('editWorkCategory').value;
        order.employerName = order.category === 'employer' ? 
            document.getElementById('editEmployerName').value : '';
        order.dateAssigned = document.getElementById('editDateAssigned').value;
        order.pages = parseInt(document.getElementById('editNumPages').value);
        order.amount = parseFloat(document.getElementById('editValueAmount').value);
        order.status = document.getElementById('editStatus').value;
        
        this.saveOrders();
        document.getElementById('editModal').style.display = 'none';
        this.renderOrders();
        this.updateFinancialOverview();
        this.updateMonthlyTithe(); // Update tithe calculation
        
        // Update financial summary if payment status or category might have been affected
        if (wasPaid || previousCategory) {
            this.updateFinancialSummary();
        }
        
        this.showNotification('Order updated successfully!', 'success');
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
            tithe: 0,
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
        this.updateMonthlyTithe(); // Update tithe when financial summary changes
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

        // Update financial summary and tithe if payment status or category changed
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
            
            // Update financial summary and tithe if the deleted order was paid
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
                <button class="export-btn ${orders.length ? '' : 'disabled'}" 
                        data-category="${title}" 
                        data-status="all">
                    <i class="fas fa-download"></i> All (${orders.length})
                </button>
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

        // Add payment status to order header with special styling for tithe
        let paymentStatus = '';
        if (order.payment?.isPaid) {
            const category = order.payment.expenseCategory;
            const categoryDisplay = category === 'tithe' ? '🙏 Tithe' : category;
            paymentStatus = `<span class="payment-badge paid ${category}">${categoryDisplay}</span>`;
        } else {
            paymentStatus = `<span class="payment-badge unpaid">Unpaid</span>`;
        }

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
                <button class="edit-btn" data-order-id="${order.id}">
                    <i class="fas fa-edit"></i>
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
        if (status === 'all') {
            if (category === 'Writers Admin') {
                return this.orders.filter(o => o.category === 'writers-admin');
            } else if (category === 'Others') {
                return this.orders.filter(o => o.category === 'others');
            } else {
                return this.orders.filter(o => 
                    o.category === 'employer' && 
                    o.employerName === category
                );
            }
        }
        
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

    analyzeFinances() {
        // Calculate total income from paid orders
        const paidOrders = this.orders.filter(order => order.payment?.isPaid);
        const totalIncome = paidOrders.reduce((sum, order) => sum + order.amount, 0);

        // Calculate category totals
        const categoryTotals = {};
        this.paymentCategories.forEach(category => {
            categoryTotals[category] = paidOrders
                .filter(order => order.payment.expenseCategory === category)
                .reduce((sum, order) => sum + order.amount, 0);
        });

        // Generate monthly data for line chart
        const monthlyData = this.generateMonthlyData(paidOrders);

        // Generate recommendations
        const recommendations = this.generateRecommendations(categoryTotals, totalIncome);

        // Show the analysis modal
        this.showFinancialAnalysis(monthlyData, recommendations, totalIncome);
    }

    generateMonthlyData(paidOrders) {
        const monthlyData = {};

        paidOrders.forEach(order => {
            const date = new Date(order.payment.datePaid);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = {
                    income: 0,
                    expenses: {}
                };
                this.paymentCategories.forEach(category => {
                    monthlyData[monthYear].expenses[category] = 0;
                });
            }
            
            monthlyData[monthYear].income += order.amount;
            
            const category = order.payment.expenseCategory;
            if (category) {
                monthlyData[monthYear].expenses[category] += order.amount;
            }
        });

        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyData).sort();
        
        // Prepare data for Chart.js
        const labels = sortedMonths;
        const incomeData = sortedMonths.map(month => monthlyData[month].income);
        
        const expenseDatasets = this.paymentCategories.map(category => {
            return {
                label: category.charAt(0).toUpperCase() + category.slice(1),
                data: sortedMonths.map(month => monthlyData[month].expenses[category]),
                borderColor: this.getCategoryColor(category),
                backgroundColor: 'rgba(0, 0, 0, 0)',
                tension: 0.3
            };
        });

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                ...expenseDatasets
            ]
        };
    }

    getCategoryColor(category) {
        const colors = {
            savings: '#2ecc71',
            rent: '#e74c3c',
            wifi: '#3498db',
            utilities: '#f39c12',
            shopping: '#9b59b6',
            tithe: '#ff6b6b',
            other: '#7f8c8d'
        };
        return colors[category] || '#95a5a6';
    }

    generateRecommendations(categoryTotals, totalIncome) {
        const recommendations = [];
        
        // Tithe recommendation (ideal: 10% of income)
        const tithePct = totalIncome > 0 ? (categoryTotals.tithe / totalIncome * 100) : 0;
        if (tithePct < 10) {
            recommendations.push({
                category: 'tithe',
                message: `Your tithe (${tithePct.toFixed(1)}%) is below the biblical 10%. Consider increasing your tithe commitment.`,
                type: 'warning'
            });
        } else {
            recommendations.push({
                category: 'tithe',
                message: `Blessed giving! You're tithing ${tithePct.toFixed(1)}% of your income. 🙏`,
                type: 'good'
            });
        }
        
        // Savings recommendation (ideal: 20% of income)
        const savingsPct = totalIncome > 0 ? (categoryTotals.savings / totalIncome * 100) : 0;
        if (savingsPct < 15) {
            recommendations.push({
                category: 'savings',
                message: `Your savings (${savingsPct.toFixed(1)}%) are below the recommended 20%. Try to save more each month.`,
                type: 'warning'
            });
        } else {
            recommendations.push({
                category: 'savings',
                message: `Good job! You're saving ${savingsPct.toFixed(1)}% of your income.`,
                type: 'good'
            });
        }

        // Rent recommendation (ideal: <30% of income)
        const rentPct = totalIncome > 0 ? (categoryTotals.rent / totalIncome * 100) : 0;
        if (rentPct > 35) {
            recommendations.push({
                category: 'rent',
                message: `Your rent (${rentPct.toFixed(1)}%) is high compared to your income. Consider more affordable options.`,
                type: 'warning'
            });
        } else if (rentPct > 0) {
            recommendations.push({
                category: 'rent',
                message: `Your rent (${rentPct.toFixed(1)}%) is within reasonable limits.`,
                type: 'good'
            });
        }

        return recommendations;
    }

    showFinancialAnalysis(chartData, recommendations, totalIncome) {
        // Create or reuse modal
        let modal = document.querySelector('.analysis-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'analysis-modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="analysis-content">
                <div class="analysis-header">
                    <h3><i class="fas fa-chart-line"></i> Financial Analysis</h3>
                    <button class="close-analysis">&times;</button>
                </div>
                <div class="financial-summary">
                    <div class="summary-item">
                        <span>Total Income</span>
                        <strong>KSh ${totalIncome.toLocaleString()}</strong>
                    </div>
                    <div class="summary-item">
                        <span>Total Expenses</span>
                        <strong>KSh ${Object.values(chartData.datasets.slice(1)).reduce((sum, dataset) => 
                            sum + dataset.data.reduce((s, v) => s + v, 0), 0).toLocaleString()}</strong>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="financeChart"></canvas>
                </div>
                <div class="recommendations">
                    <h4>Recommendations</h4>
                    ${recommendations.length > 0 ? 
                        recommendations.map(rec => `
                            <div class="recommendation-item ${rec.type}">
                                <strong>${rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}:</strong>
                                ${rec.message}
                            </div>
                        `).join('') 
                        : '<div class="recommendation-item good">Your finances look well balanced!</div>'
                    }
                </div>
            </div>
        `;

        // Show modal
        modal.classList.add('active');

        // Initialize chart
        const ctx = modal.querySelector('#financeChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: KSh ${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'KSh ' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });

        // Close modal when clicking X
        modal.querySelector('.close-analysis').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Initialize tracker
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new FreelanceTracker();
    
    if (tracker.orders.length === 0 && !localStorage.getItem('freelanceOrders')) {
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

    // Add event listener for the analysis button
    document.getElementById('analyzeFinanceBtn').addEventListener('click', function() {
        tracker.analyzeFinances();
    });
});

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