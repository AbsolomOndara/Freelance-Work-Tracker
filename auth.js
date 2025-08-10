// Add this to the beginning of your tracker.html file, right after the opening <script> tag

// Authentication and Session Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupLogoutHandler();
    }

    checkAuthStatus() {
        // Check for active session
        const sessionData = localStorage.getItem('freelanceSession') || 
                           sessionStorage.getItem('freelanceSession');
        
        if (!sessionData) {
            // No active session, redirect to login
            this.redirectToLogin();
            return false;
        }

        try {
            const session = JSON.parse(sessionData);
            this.currentUser = session.user;
            
            // Verify session validity (optional: add expiration check)
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const timeDiff = now.getTime() - loginTime.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            
            // If session is older than 24 hours and not "remember me", require re-login
            if (hoursDiff > 24 && !session.rememberMe) {
                this.logout();
                return false;
            }
            
            // Update user display
            this.updateUserDisplay();
            return true;
            
        } catch (error) {
            console.error('Invalid session data:', error);
            this.logout();
            return false;
        }
    }

    updateUserDisplay() {
        if (!this.currentUser) return;
        
        // Update header with user information
        const header = document.querySelector('header') || document.querySelector('.header');
        if (header) {
            // Create or update user menu
            let userMenu = document.getElementById('userMenu');
            if (!userMenu) {
                userMenu = document.createElement('div');
                userMenu.id = 'userMenu';
                userMenu.className = 'user-menu';
                userMenu.innerHTML = `
                    <div class="user-avatar">
                        <i class="fas fa-user-circle"></i>
                    </div>
                    <div class="user-info">
                        <div class="user-name">${this.currentUser.firstName} ${this.currentUser.lastName}</div>
                        <div class="user-email">${this.currentUser.email}</div>
                    </div>
                    <div class="user-actions">
                        <button class="btn-logout" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                `;
                header.appendChild(userMenu);
            }
        }
        
        // Add welcome message
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        // Create a welcome notification
        const notification = document.createElement('div');
        notification.className = 'welcome-notification';
        notification.innerHTML = `
            <div class="welcome-content">
                <i class="fas fa-user-check"></i>
                <span>Welcome back, ${this.currentUser.firstName}!</span>
            </div>
        `;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    setupLogoutHandler() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logoutBtn')) {
                this.logout();
            }
        });
    }

    logout() {
        // Clear session data
        localStorage.removeItem('freelanceSession');
        sessionStorage.removeItem('freelanceSession');
        
        // Show logout notification
        this.showLogoutNotification();
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    showLogoutNotification() {
        const notification = document.createElement('div');
        notification.className = 'logout-notification';
        notification.innerHTML = `
            <div class="logout-content">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logged out successfully. Redirecting...</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
    }

    redirectToLogin() {
        // Show redirect notification
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Please log in to access the tracker</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-weight: 600;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// User Data Manager - Separate user data by account
class UserDataManager {
    constructor(userId) {
        this.userId = userId;
        this.userPrefix = `freelance_user_${userId}_`;
    }

    // Override localStorage methods to be user-specific
    getItem(key) {
        return localStorage.getItem(this.userPrefix + key);
    }

    setItem(key, value) {
        localStorage.setItem(this.userPrefix + key, value);
    }

    removeItem(key) {
        localStorage.removeItem(this.userPrefix + key);
    }

    // Migration method to move existing data to user-specific storage
    migrateExistingData() {
        const oldKeys = ['freelanceOrders', 'freelanceEmployers', 'freelanceCollapsedSections'];
        
        oldKeys.forEach(key => {
            const existingData = localStorage.getItem(key);
            if (existingData) {
                this.setItem(key.replace('freelance', ''), existingData);
                // Don't remove old data immediately to allow for rollback if needed
            }
        });
    }
}

// Enhanced FreelanceTracker with Authentication
class AuthenticatedFreelanceTracker extends FreelanceTracker {
    constructor() {
        // Initialize auth manager first
        this.authManager = new AuthManager();
        
        // Only proceed if user is authenticated
        if (!this.authManager.getCurrentUser()) {
            return; // Will redirect to login
        }
        
        // Initialize user-specific data manager
        this.userDataManager = new UserDataManager(this.authManager.getCurrentUser().id);
        this.userDataManager.migrateExistingData();
        
        // Call parent constructor
        super();
        
        // Add user-specific customizations
        this.setupUserInterface();
    }

    setupUserInterface() {
        // Add user menu styles
        this.addUserMenuStyles();
        
        // Customize the tracker for the specific user
        this.personalizeInterface();
    }

    addUserMenuStyles() {
        const styles = `
            <style>
                .user-menu {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    padding: 15px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    z-index: 999;
                    min-width: 280px;
                }

                .user-avatar {
                    font-size: 2.5rem;
                    color: #667eea;
                }

                .user-info {
                    flex: 1;
                }

                .user-name {
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 1rem;
                    margin-bottom: 2px;
                }

                .user-email {
                    color: #718096;
                    font-size: 0.85rem;
                }

                .btn-logout {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                }

                .btn-logout:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }

                @media (max-width: 768px) {
                    .user-menu {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                        padding: 12px;
                    }
                    
                    .user-avatar {
                        font-size: 2rem;
                    }
                    
                    .user-name {
                        font-size: 0.9rem;
                    }
                    
                    .user-email {
                        font-size: 0.8rem;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    personalizeInterface() {
        const user = this.authManager.getCurrentUser();
        
        // Update page title
        document.title = `FreeLance Pro - ${user.firstName}'s Dashboard`;
        
        // Add personal greeting to the main header if it exists
        const mainHeader = document.querySelector('h1');
        if (mainHeader && mainHeader.textContent.includes('FreeLance')) {
            mainHeader.innerHTML = `Welcome, ${user.firstName}! <span style="font-weight: 300; color: #718096;">FreeLance Pro Dashboard</span>`;
        }
    }

    // Override data loading/saving methods to use user-specific storage
    loadOrders() {
        try {
            const savedOrders = this.userDataManager.getItem('orders');
            return savedOrders ? JSON.parse(savedOrders) : [];
        } catch (error) {
            console.error('Error loading user orders:', error);
            return [];
        }
    }

    saveOrders() {
        try {
            this.userDataManager.setItem('orders', JSON.stringify(this.orders));
        } catch (error) {
            console.error('Error saving user orders:', error);
        }
    }

    loadEmployers() {
        try {
            const savedEmployers = this.userDataManager.getItem('employers');
            return savedEmployers ? JSON.parse(savedEmployers) : ['Joe Mac', 'Brian Oyaro'];
        } catch (error) {
            console.error('Error loading user employers:', error);
            return ['Joe Mac', 'Brian Oyaro'];
        }
    }

    saveEmployers() {
        try {
            this.userDataManager.setItem('employers', JSON.stringify(this.employers));
        } catch (error) {
            console.error('Error saving user employers:', error);
        }
    }

    loadCollapsedSections() {
        try {
            const collapsed = this.userDataManager.getItem('collapsedSections');
            return collapsed ? JSON.parse(collapsed) : {};
        } catch (error) {
            console.error('Error loading collapsed sections:', error);
            return {};
        }
    }

    saveCollapsedSections() {
        try {
            this.userDataManager.setItem('collapsedSections', JSON.stringify(this.collapsedSections));
        } catch (error) {
            console.error('Error saving collapsed sections:', error);
        }
    }

    // Enhanced backup with user info
    backupData() {
        const user = this.authManager.getCurrentUser();
        const backup = {
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            orders: this.orders,
            employers: this.employers,
            collapsedSections: this.collapsedSections,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `freelance-backup-${user.firstName}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Backup created successfully!', 'success');
    }

    // Enhanced restore with user verification
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
                        
                        if (!backup.orders || !backup.employers) {
                            throw new Error('Invalid backup file format');
                        }
                        
                        // Show restore confirmation with backup info
                        const currentUser = this.authManager.getCurrentUser();
                        const backupInfo = backup.user ? 
                            `${backup.user.firstName} ${backup.user.lastName} (${backup.user.email})` : 
                            'Unknown user';
                        
                        const confirmMessage = `Restore data from backup?\n\nBackup from: ${backupInfo}\nDate: ${new Date(backup.exportDate).toLocaleDateString()}\n\nThis will replace all current data.`;
                        
                        if (confirm(confirmMessage)) {
                            this.orders = backup.orders;
                            this.employers = backup.employers;
                            this.collapsedSections = backup.collapsedSections || {};
                            
                            this.saveOrders();
                            this.saveEmployers();
                            this.saveCollapsedSections();
                            
                            this.updateFinancialOverview();
                            this.updateFinancialSummary();
                            this.renderOrders();
                            
                            this.showNotification('Data restored successfully!', 'success');
                        }
                    } catch (error) {
                        console.error('Restore error:', error);
                        this.showNotification('Error restoring backup file', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    // Enhanced clear data with user confirmation
    clearAllData() {
        const user = this.authManager.getCurrentUser();
        const confirmMessage = `${user.firstName}, are you sure you want to delete ALL your orders and employers?\n\nThis action cannot be undone!\n\nType "DELETE" to confirm:`;
        
        const confirmation = prompt(confirmMessage);
        if (confirmation === 'DELETE') {
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
        } else if (confirmation !== null) {
            this.showNotification('Data not cleared - confirmation failed', 'warning');
        }
    }
}

// Initialize the authenticated tracker
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    // Replace the original FreelanceTracker initialization with authenticated version
    tracker = new AuthenticatedFreelanceTracker();
    
    // Only add sample data if no existing user data and user is authenticated
    if (tracker && tracker.orders.length === 0 && !tracker.userDataManager.getItem('orders')) {
        const user = tracker.authManager.getCurrentUser();
        
        // Personalized sample data
        const sampleOrders = [
            {
                id: '1',
                category: 'writers-admin',
                employerName: '',
                title: `Welcome ${user.firstName} - Sample Research Paper`,
                dateAssigned: new Date().toISOString().split('T')[0],
                pages: 5,
                amount: 2500,
                status: 'completed',
                dateCreated: new Date().toISOString(),
                payment: {
                    isPaid: true,
                    datePaid: new Date().toISOString().split('T')[0],
                    expenseCategory: 'savings',
                    notes: 'Sample completed order'
                }
            },
            {
                id: '2',
                category: 'employer',
                employerName: 'Joe Mac',
                title: 'Getting Started - Website Content',
                dateAssigned: new Date().toISOString().split('T')[0],
                pages: 3,
                amount: 1500,
                status: 'active',
                dateCreated: new Date().toISOString(),
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
        
        // Show welcome message for new users
        setTimeout(() => {
            tracker.showNotification(
                `Welcome to FreeLance Pro, ${user.firstName}! We've added some sample data to get you started.`, 
                'success'
            );
        }, 2000);
    }

    // Add event listeners for existing buttons if they exist
    const analyzeBtn = document.getElementById('analyzeFinanceBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            if (tracker) tracker.analyzeFinances();
        });
    }
});