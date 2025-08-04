// Freelance Work Tracker JavaScript

class FreelanceTracker {
    constructor() {
        this.orders = this.loadOrders();
        this.monthlyExpenses = 18500; // Total monthly expenses
        this.savingsGoal = 10000; // Minimum savings goal
        this.targetIncome = this.monthlyExpenses + this.savingsGoal; // 28,500
        this.currentFilter = 'all';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCurrentMonth();
        this.updateFinancialOverview();
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
        const employerName = document.getElementById('employerName');
        
        workCategory.addEventListener('change', (e) => {
            if (e.target.value === 'employer') {
                employerNameGroup.style.display = 'block';
                employerName.required = true;
            } else {
                employerNameGroup.style.display = 'none';
                employerName.required = false;
                employerName.value = '';
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
    }

    updateCurrentMonth() {
        const now = new Date();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    }

    addOrder() {
        const formData = {
            id: Date.now().toString(),
            category: document.getElementById('workCategory').value,
            employerName: document.getElementById('employerName').value,
            title: document.getElementById('orderTitle').value,
            dateAssigned: document.getElementById('dateAssigned').value,
            pages: parseInt(document.getElementById('numPages').value),
            amount: parseFloat(document.getElementById('valueAmount').value),
            status: 'active',
            dateCreated: new Date().toISOString()
        };

        this.orders.push(formData);
        this.saveOrders();
        this.updateFinancialOverview();
        this.renderOrders();
        this.resetForm();
        
        // Show success message
        this.showNotification('Order added successfully!', 'success');
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
        if (confirm('Are you sure you want to delete this order?')) {
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.saveOrders();
            this.updateFinancialOverview();
            this.renderOrders();
            this.showNotification('Order deleted successfully!', 'success');
        }
    }

    updateFinancialOverview() {
        const totals = this.calculateTotals();
        
        // Update overview cards
        document.getElementById('activeTotal').textContent = `KSh ${totals.active.toLocaleString()}`;
        document.getElementById('submittedTotal').textContent = `KSh ${totals.submitted.toLocaleString()}`;
        document.getElementById('completedTotal').textContent = `KSh ${totals.completed.toLocaleString()}`;
        
        // Calculate progress
        const totalEarned = totals.completed;
        const progressPercentage = Math.min((totalEarned / this.targetIncome) * 100, 100);
        const remainingAmount = Math.max(this.targetIncome - totalEarned, 0);
        
        // Update progress bar
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
        const emptyState = document.getElementById('emptyState');
        
        let filteredOrders = this.orders;
        if (this.currentFilter !== 'all') {
            filteredOrders = this.orders.filter(order => order.status === this.currentFilter);
        }

        if (filteredOrders.length === 0) {
            container.innerHTML = '';
            container.appendChild(emptyState);
            return;
        }

        // Sort orders by date (newest first)
        filteredOrders.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));

        container.innerHTML = '';
        filteredOrders.forEach(order => {
            const orderCard = this.createOrderCard(order);
            container.appendChild(orderCard);
        });
    }

    createOrderCard(order) {
        const card = document.createElement('div');
        card.className = `order-card ${order.status}`;
        
        const categoryDisplay = order.category === 'employer' ? 
            `${order.employerName} (Employer)` : 'Writers Admin';
        
        const formattedDate = new Date(order.dateAssigned).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        card.innerHTML = `
            <div class="order-header">
                <div>
                    <div class="order-title">${order.title}</div>
                    <div class="order-category ${order.category}">${categoryDisplay}</div>
                </div>
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
                            onclick="tracker.updateOrderStatus('${order.id}', 'active')">
                        Active
                    </button>
                    <button class="status-btn ${order.status === 'submitted' ? 'active' : ''}" 
                            onclick="tracker.updateOrderStatus('${order.id}', 'submitted')">
                        Submitted
                    </button>
                    <button class="status-btn ${order.status === 'completed' ? 'active' : ''}" 
                            onclick="tracker.updateOrderStatus('${order.id}', 'completed')">
                        Completed
                    </button>
                </div>
                <button class="delete-btn" onclick="tracker.deleteOrder('${order.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return card;
    }

    resetForm() {
        document.getElementById('addOrderForm').reset();
        document.getElementById('employerNameGroup').style.display = 'none';
        document.getElementById('employerName').required = false;
        document.getElementById('dateAssigned').valueAsDate = new Date();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles for notification
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
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
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
            console.error('Error loading orders from localStorage:', error);
            return [];
        }
    }

    saveOrders() {
        try {
            localStorage.setItem('freelanceOrders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving orders to localStorage:', error);
            // Fallback to session storage if localStorage fails
            try {
                sessionStorage.setItem('freelanceOrders', JSON.stringify(this.orders));
            } catch (sessionError) {
                console.error('Error saving to sessionStorage:', sessionError);
            }
        }
    }

    // Clear all data
    clearAllData() {
        if (confirm('Are you sure you want to delete ALL orders? This action cannot be undone!')) {
            this.orders = [];
            this.saveOrders();
            this.updateFinancialOverview();
            this.renderOrders();
            this.showNotification('All data cleared successfully!', 'success');
        }
    }

    // Backup data to file
    backupData() {
        const backup = {
            orders: this.orders,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `freelance-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Backup created successfully!', 'success');
    }

    // Create file input for restore
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
                        if (backup.orders && Array.isArray(backup.orders)) {
                            if (confirm('This will replace all current data. Continue?')) {
                                this.orders = backup.orders;
                                this.saveOrders();
                                this.updateFinancialOverview();
                                this.renderOrders();
                                this.showNotification('Data restored successfully!', 'success');
                            }
                        } else {
                            throw new Error('Invalid backup file format');
                        }
                    } catch (error) {
                        this.showNotification('Error restoring data. Please check the file format.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    // Get monthly statistics
    getMonthlyStats(year, month) {
        const monthOrders = this.orders.filter(order => {
            const orderDate = new Date(order.dateAssigned);
            return orderDate.getFullYear() === year && orderDate.getMonth() === month;
        });

        return {
            totalOrders: monthOrders.length,
            totalEarnings: monthOrders.reduce((sum, order) => sum + (order.status === 'completed' ? order.amount : 0), 0),
            activeOrders: monthOrders.filter(order => order.status === 'active').length,
            completedOrders: monthOrders.filter(order => order.status === 'completed').length,
            totalPages: monthOrders.reduce((sum, order) => sum + order.pages, 0)
        };
    }
}

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new FreelanceTracker();
    
    // Only add sample data if no existing data is found
    if (tracker.orders.length === 0 && !localStorage.getItem('freelanceOrders')) {
        addSampleData();
    }
});

// Function to add sample data for demonstration
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
            dateCreated: new Date('2024-08-01').toISOString()
        },
        {
            id: '2',
            category: 'employer',
            employerName: 'Tech Solutions Ltd',
            title: 'Website Content Writing',
            dateAssigned: '2024-08-02',
            pages: 8,
            amount: 4000,
            status: 'submitted',
            dateCreated: new Date('2024-08-02').toISOString()
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
            dateCreated: new Date('2024-08-03').toISOString()
        }
    ];
    
    tracker.orders = sampleOrders;
    tracker.saveOrders();
    tracker.updateFinancialOverview();
    tracker.renderOrders();
}

// Utility functions for future enhancements
function formatCurrency(amount) {
    return `KSh ${amount.toLocaleString()}`;
}

function calculateDaysUntilDeadline(dateString) {
    const deadline = new Date(dateString);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to toggle form
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('toggleFormBtn').click();
    }
    
    // Escape to close form
    if (e.key === 'Escape') {
        const form = document.getElementById('addOrderForm');
        if (!form.classList.contains('collapsed')) {
            document.getElementById('toggleFormBtn').click();
        }
    }
});

// Auto-save functionality (runs every 30 seconds)
setInterval(() => {
    if (tracker && tracker.orders.length > 0) {
        tracker.saveOrders();
    }
}, 30000);

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});