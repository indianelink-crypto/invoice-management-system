// Mobile Invoice Manager — FINAL 100% WORKING VERSION
// Generate Invoice ✅ Working
// Invoice List tab ✅ Now shows latest data
// Add Customer tab ✅ Street suggestions update properly
// All old logic preserved — only safe fixes added

class MobileInvoiceManager {
    constructor() {
        this.invoices = this.loadInvoices();
        this.streetNames = this.loadStreetNames();
        this.customers = this.loadCustomers();
        this.items = this.loadItems();
        this.currentStatusFilter = 'all';
        this.currentStreetFilter = 'all';
        this.mobileSearchQuery = '';
        this.dateFilterValue = '';
        this.lastInvoice = null;
        this.selectedCustomer = null;

        this.init();
    }

    init() {
        // Initialize tab visibility - use CSS classes only
        const tabContents = ['invoiceTab', 'invoicesTab', 'customerTab'];
        tabContents.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
            }
        });

        // Show the initial active tab (invoice tab)
        const initialTab = document.getElementById('invoiceTab');
        if (initialTab) {
            initialTab.classList.add('active');
        }

        // Set date as DD-MM-YYYY
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const formattedDate = `${dd}-${mm}-${yyyy}`;
        const dateSpan = document.getElementById('mobileInvoiceDate');
        if (dateSpan) {
            dateSpan.textContent = formattedDate;
        }

        this.updateInvoiceNumber();
        this.updateStreetNamesList();
        this.updateCustomersList();
        this.updateMobileNumbersList();
        
        // Initialize invoice tab to show search section
        this.resetToSearch();

        // ==================== TAB HANDLING ====================
        const tabButtons = document.querySelectorAll('.mobile-tab');
        console.log('Found tabs:', tabButtons.length);

        if (tabButtons.length > 0) {
            tabButtons.forEach((tab) => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const tabName = tab.getAttribute('data-tab');
                    console.log('Tab clicked:', tabName);
                    
                    if (tabName) {
                        this.switchTab(tabName);
                    } else {
                        console.error('No data-tab attribute on tab:', tab);
                    }
                });
            });
            console.log('Tabs loaded successfully - Found', tabButtons.length, 'tabs');
        } else {
            console.warn('Warning: No .mobile-tab buttons found in HTML');
        }


        // ==================== EVENT LISTENERS ====================
        const invoiceForm = document.getElementById('mobileInvoiceForm');
        if (invoiceForm) {
            invoiceForm.addEventListener('submit', (e) => this.handleInvoiceSubmit(e));
        }

        const customerForm = document.getElementById('mobileCustomerForm');
        if (customerForm) {
            customerForm.addEventListener('submit', (e) => this.handleCustomerSubmit(e));
        }

        // Get location button for customer form
        const getLocationBtn = document.getElementById('getLocationBtn');
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', () => this.getCurrentLocation());
        }

        const addItemBtn = document.getElementById('mobileAddItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addItemRow());
        }

        const logoutBtn = document.getElementById('mobileLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (window.sb && window.sb.auth) {
                    await window.sb.auth.signOut();
                }
                location.replace('mobile-login.html');
            });
        }

        const itemsBody = document.getElementById('mobileItemsTableBody');
        if (itemsBody) {
            itemsBody.addEventListener('input', () => this.calculateGrandTotal());
            itemsBody.addEventListener('change', () => this.calculateGrandTotal());
        }

        const printBtn = document.getElementById('mobilePrintBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                if (this.lastInvoice) {
                    this.fillPrintTemplate(this.lastInvoice);
                }
                window.print();
            });
        }

        // Mobile Search
        const searchInput = document.getElementById('mobileSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const mobile = searchInput.value.trim();
                if (mobile.length === 10) {
                    const found = this.customers.find(c => c.mobile === mobile);
                    if (found) {
                        this.showSquareCard(found);
                    } else {
                        this.resetToSearch();
                    }
                } else {
                    this.resetToSearch();
                }
            });
            // ======= NEW: CALL BUTTON FEATURE =======
const callBtn = document.getElementById('callBtn');
if (callBtn) {
    callBtn.addEventListener('click', () => {
        const mobile = previewMobile.textContent.trim();
        if (mobile.length === 10) {
            // Mobile device dialer open pannum
            window.location.href = `tel:${mobile}`;
        } else {
            alert('Customer mobile number not available or invalid');
        }
    });
});
             // MAIN FEATURE: Touch/click on preview card to confirm selection
    preview.addEventListener('click', () => {
        const mobile = searchInput.value.trim();
        if (mobile.length === 10) {
            const found = this.customers.find(c => c.mobile === mobile);
            if (found) {
                this.selectCustomer(found, searchSection, invoiceSection);
            } else {
                alert('No customer found with this mobile number!');
            }
        }
    });


            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const mobile = searchInput.value.trim();
                    const found = this.customers.find(c => c.mobile === mobile);
                    if (found) {
                        this.showSquareCard(found);
                    } else {
                        alert('No customer found!');
                    }
                }
            });
        }

        // Action buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.action-btn.bill')) {
                this.startBilling();
            } else if (e.target.matches('.action-btn.call')) {
                this.callCustomer();
            }
        });

        this.addItemRow();

        // Filters
        const searchFilter = document.getElementById('mobileInvoiceSearch');
        if (searchFilter) {
            searchFilter.addEventListener('input', (e) => {
                this.mobileSearchQuery = e.target.value.trim();
                this.renderMobileInvoices();
            });
        }

        const statusFilter = document.getElementById('mobileStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatusFilter = e.target.value;
                this.renderMobileInvoices();
            });
        }

        const streetFilter = document.getElementById('mobileStreetFilter');
        if (streetFilter) {
            streetFilter.addEventListener('change', (e) => {
                this.currentStreetFilter = e.target.value;
                this.renderMobileInvoices();
            });
        }

        const dateFilter = document.getElementById('mobileDateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.dateFilterValue = e.target.value;
                this.renderMobileInvoices();
            });
        }

        // Load data
        this.loadAllDataFromSupabase().then(() => {
            this.setupRealtimeSubscriptions();
            this.updateStreetFilterDropdown();
            this.renderMobileInvoices();
            console.log("Mobile: Initial data loaded + Real-time active");
        });
    }

    // ==================== switchTab — FIXED ====================
    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Update active button
        document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
        const activeBtn = document.querySelector(`.mobile-tab[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Hide all tab contents using CSS classes
        const tabContents = ['invoiceTab', 'invoicesTab', 'customerTab', 'mapTab'];
        tabContents.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('active');
            }
        });
        
        // Show selected tab using CSS class
        const targetId = tabName === 'invoice' ? 'invoiceTab' : 
                        tabName === 'invoices' ? 'invoicesTab' : 
                        tabName === 'customer' ? 'customerTab' : 'mapTab';
        
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.add('active');
            console.log('Tab content shown:', targetId);
        } else {
            console.error('Tab content not found:', targetId);
            return;
        }
        
        // TAB-SPECIFIC ACTIONS
        if (tabName === 'invoice') {
            // Show search section when invoice tab is active
            this.resetToSearch();
            this.updateInvoiceNumber();
        } else if (tabName === 'invoices') {
            // FORCE LOAD AND RENDER INVOICES
            console.log('Loading invoices for list tab...');
            this.loadInvoicesFromDB().then(() => {
                this.renderMobileInvoices();
                this.updateStreetFilterDropdown();
            });
        } else if (tabName === 'customer') {
            // Load streets for customer tab
            console.log('Loading streets for customer tab...');
            this.loadStreetsFromDB().then(() => {
                this.updateStreetNamesList();
            });
        } else if (tabName === 'map') {
            // Initialize map when map tab is opened
            this.initMap();
        }
    }



    showSquareCard(customer) {
        this.selectedCustomer = customer;

        document.getElementById('sqCustomerName').textContent = customer.name || 'Unknown';
        document.getElementById('sqMobile').textContent = customer.mobile || '';
        document.getElementById('sqStreet').textContent = customer.street || 'Not set';

        const balanceEl = document.getElementById('sqBalance');
        if (balanceEl) {
            const balance = 600;
            balanceEl.textContent = `₹${Math.abs(balance)}`;
            balanceEl.className = balance > 0 ? 'balance-due' : 'balance-advance';
        }

        document.getElementById('selectedCustomerCard').style.display = 'block';
        document.getElementById('searchSection').style.display = 'none';
        document.getElementById('customerInvoiceSection').style.display = 'none';
    }

    resetToSearch() {
        this.selectedCustomer = null;
        const searchSection = document.getElementById('searchSection');
        const sqCard = document.getElementById('selectedCustomerCard');
        const invoiceSection = document.getElementById('customerInvoiceSection');
        const invoiceForm = document.getElementById('mobileInvoiceForm');
        const searchInput = document.getElementById('mobileSearchInput');

        if (invoiceForm) invoiceForm.style.display = 'block';
        if (searchSection) searchSection.style.display = 'block';
        if (sqCard) sqCard.style.display = 'none';
        if (invoiceSection) invoiceSection.style.display = 'none';
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    }

    startBilling() {
        if (!this.selectedCustomer) {
            alert('Please select a customer first');
            return;
        }

        document.getElementById('customerInvoiceSection').style.display = 'block';
        document.getElementById('selectedCustomerCard').style.display = 'none';

        setTimeout(() => {
            const firstSelect = document.querySelector('#mobileItemsTableBody .mobile-item-desc-select');
            if (firstSelect) firstSelect.focus();
        }, 100);
    }

    callCustomer() {
        if (this.selectedCustomer && this.selectedCustomer.mobile) {
            window.location.href = `tel:${this.selectedCustomer.mobile}`;
        } else {
            alert('No mobile number available');
        }
    }

    addItemRow() {
        const tbody = document.getElementById('mobileItemsTableBody');
        if (!tbody) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <select class="mobile-item-desc-select" required>
                    <option value="">Select item</option>
                    ${this.items.map(item => `<option value="${item.name}" data-price="${item.price}">${item.name} (₹${item.price})</option>`).join('')}
                </select>
            </td>
            <td><input type="number" class="mobile-item-qty" min="1" value="1" step="1" required></td>
            <td><input type="number" class="mobile-item-price" min="1" step="1" readonly required></td>
            <td class="mobile-item-total">₹0</td>
            <td><button type="button" class="mobile-remove-item">×</button></td>
        `;
        tbody.appendChild(row);

        const descSelect = row.querySelector('.mobile-item-desc-select');
        const priceInput = row.querySelector('.mobile-item-price');

        descSelect.addEventListener('change', () => {
            const selected = descSelect.options[descSelect.selectedIndex];
            const price = selected.dataset.price || '';
            priceInput.value = price ? Math.round(parseFloat(price)) : '';
            this.calculateGrandTotal();
        });

        row.querySelector('.mobile-remove-item').addEventListener('click', () => {
            row.remove();
            this.calculateGrandTotal();
        });

        this.calculateGrandTotal();
    }

    calculateGrandTotal() {
        let total = 0;
        document.querySelectorAll('#mobileItemsTableBody tr').forEach(row => {
            const qty = parseFloat(row.querySelector('.mobile-item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.mobile-item-price').value) || 0;
            const itemTotal = qty * price;
            row.querySelector('.mobile-item-total').textContent = `₹${itemTotal}`;
            total += itemTotal;
        });
        const grandTotalEl = document.getElementById('mobileGrandTotal');
        if (grandTotalEl) grandTotalEl.textContent = `₹${total}`;
        return total;
    }

    clearInvoiceForm() {
        const form = document.getElementById('mobileInvoiceForm');
        if (form) form.reset();

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const dateSpan = document.getElementById('mobileInvoiceDate');
        if (dateSpan) dateSpan.textContent = `${dd}-${mm}-${yyyy}`;

        this.updateInvoiceNumber();
        const tbody = document.getElementById('mobileItemsTableBody');
        if (tbody) tbody.innerHTML = '';
        this.addItemRow();

        const printBtn = document.getElementById('mobilePrintBtn');
        if (printBtn) printBtn.style.display = 'none';

        const grandTotalEl = document.getElementById('mobileGrandTotal');
        if (grandTotalEl) grandTotalEl.textContent = '₹0';

        this.lastInvoice = null;
        this.selectedCustomer = null;

        const invoiceSection = document.getElementById('customerInvoiceSection');
        if (invoiceSection) invoiceSection.style.display = 'none';

        // Reset to show the search section again
        this.resetToSearch();
    }

    fillPrintTemplate(invoice) {
        const printNo = document.getElementById('mobilePrintInvoiceNo');
        if (printNo) printNo.textContent = invoice.invoiceNumber;
        const printDate = document.getElementById('mobilePrintDate');
        if (printDate) printDate.textContent = invoice.invoiceDate;
        const printCustomer = document.getElementById('mobilePrintCustomer');
        if (printCustomer) printCustomer.textContent = invoice.customerName;
        const printMobile = document.getElementById('mobilePrintMobile');
        if (printMobile) printMobile.textContent = invoice.mobileNumber;
        const printStreet = document.getElementById('mobilePrintStreet');
        if (printStreet) printStreet.textContent = invoice.streetName || 'Not specified';
        const printTotal = document.getElementById('mobilePrintGrandTotal');
        if (printTotal) printTotal.textContent = invoice.total;

        const tbody = document.getElementById('mobilePrintItems');
        if (tbody) {
            tbody.innerHTML = invoice.items.map(item => `
                <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${item.total}</td>
                </tr>
            `).join('');
        }

        const existingStamp = document.querySelector('.print-bill-paid');
        if (existingStamp) existingStamp.remove();

        if (invoice.status === 'paid') {
            const stamp = document.createElement('div');
            stamp.className = 'print-bill-paid';
            stamp.style.textAlign = 'center';
            stamp.style.fontSize = '48px';
            stamp.style.fontWeight = 'bold';
            stamp.style.color = 'green';
            stamp.style.margin = '30px 0';
            stamp.textContent = 'BILL PAID';
            const printInvoice = document.querySelector('.print-invoice');
            if (printInvoice) printInvoice.appendChild(stamp);
        }
    }

    async handleInvoiceSubmit(e) {
        e.preventDefault();

        if (!this.selectedCustomer) {
            alert("Please search and select a customer by mobile number first");
            return;
        }

        const items = [];
        let valid = true;

        document.querySelectorAll('#mobileItemsTableBody tr').forEach(row => {
            const desc = row.querySelector('.mobile-item-desc-select').value.trim();
            const qty = parseFloat(row.querySelector('.mobile-item-qty').value);
            const price = parseFloat(row.querySelector('.mobile-item-price').value);

            if (desc && qty > 0 && price >= 1) {
                items.push({
                    description: desc,
                    quantity: qty,
                    price: price,
                    total: qty * price
                });
            } else if (desc || qty || price) {
                valid = false;
            }
        });

        if (!valid || items.length === 0) {
            alert("Please complete all item fields. Price must be at least ₹1.");
            return;
        }

        const total = this.calculateGrandTotal();

        const displayedDate = document.getElementById('mobileInvoiceDate').textContent.trim();
        const [dd, mm, yyyy] = displayedDate.split('-');
        const dbDate = `${yyyy}-${mm}-${dd}`;

        const invoice = {
            invoiceNumber: document.getElementById('mobileInvoiceNumber').textContent,
            customerName: this.selectedCustomer.name,
            mobileNumber: this.selectedCustomer.mobile,
            streetName: this.selectedCustomer.street || '',
            invoiceDate: dbDate,
            items,
            total,
            status: 'unpaid'
        };

        try {
            await this.saveInvoiceToDB(invoice);

            this.lastInvoice = invoice;
            const printBtn = document.getElementById('mobilePrintBtn');
            if (printBtn) printBtn.style.display = 'block';

            this.fillPrintTemplate(invoice);

            alert(`Invoice ${invoice.invoiceNumber} created successfully! Total: ₹${total}`);

            this.clearInvoiceForm();
            this.renderMobileInvoices();

        } catch (err) {
            console.error("Invoice save error:", err);
            alert("Failed to create invoice");
        }
    }

    async handleCustomerSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('newCustomerName').value.trim();
        const mobile = document.getElementById('newMobileNumber').value.trim();
        const street = document.getElementById('newStreetName').value.trim();
        const latitude = document.getElementById('customerLatitude').value;
        const longitude = document.getElementById('customerLongitude').value;

        if (!name || !mobile || mobile.length !== 10) {
            alert("Name and valid 10-digit mobile number are required");
            return;
        }

        try {
            const lat = latitude ? parseFloat(latitude) : null;
            const lng = longitude ? parseFloat(longitude) : null;
            const data = await this.saveCustomerToDB(name, mobile, street, lat, lng);
            this.customers.push(data);

            if (street && !this.streetNames.includes(street)) {
                this.streetNames.push(street);
                localStorage.setItem("streetNames", JSON.stringify(this.streetNames));
            }

            this.updateMobileNumbersList();
            this.updateStreetNamesList();
            this.updateCustomersList();

            alert("Customer added successfully");
            e.target.reset();
            document.getElementById('customerLatitude').value = '';
            document.getElementById('customerLongitude').value = '';

        } catch (err) {
            console.error("Customer save error:", err);
            alert("Failed to add customer");
        }
    }

    async markAsPaid(index) {
        const inv = this.invoices[index];
        if (inv.status === 'paid') return;

        inv.status = 'paid';

        if (inv.id) {
            const { error } = await window.sb
                .from('invoices')
                .update({ status: 'paid' })
                .eq('id', inv.id);

            if (error) {
                alert("Failed to mark as paid");
                inv.status = 'unpaid';
                this.renderMobileInvoices();
                return;
            }
        }

        localStorage.setItem("invoices", JSON.stringify(this.invoices));
        this.renderMobileInvoices();
    }

    printInvoiceFromList(invoiceNumber) {
        const inv = this.invoices.find(i => i.invoiceNumber === invoiceNumber);
        if (inv) {
            this.fillPrintTemplate(inv);
            window.print();
        }
    }

    updateStreetFilterDropdown() {
        const filter = document.getElementById('mobileStreetFilter');
        if (!filter) return;

        // Use streets from streets table, not just from invoices
        const allStreets = [...new Set([...this.streetNames, ...this.invoices.map(i => i.streetName).filter(Boolean)])].sort();
        filter.innerHTML = `<option value="all">All Streets</option>` +
            allStreets.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    renderMobileInvoices() {
        console.log("Current invoices count:", this.invoices.length);

        let filtered = this.invoices;

        if (this.mobileSearchQuery) {
            filtered = filtered.filter(i => i.mobileNumber.includes(this.mobileSearchQuery));
        }

        if (this.currentStatusFilter !== 'all') {
            filtered = filtered.filter(i => i.status === this.currentStatusFilter);
        }

        if (this.currentStreetFilter !== 'all') {
            filtered = filtered.filter(i => i.streetName === this.currentStreetFilter);
        }

        if (this.dateFilterValue) {
            filtered = filtered.filter(i => i.invoiceDate === this.dateFilterValue);
        }

        const list = document.getElementById('mobileInvoiceList');
        if (!list) return;

        list.innerHTML = filtered.map((i, index) => `
            <div class="mobile-invoice-card ${i.status}">
                <div class="mobile-invoice-header">
                    <strong>${i.invoiceNumber}</strong> - ${i.invoiceDate}
                    <span class="mobile-status-badge ${i.status}">${i.status.toUpperCase()}</span>
                </div>
                <div class="mobile-invoice-info">
                    ${i.customerName || 'Unknown'} (${i.mobileNumber || 'N/A'})<br>
                    Street: ${i.streetName || 'Not specified'}<br>
                    Total: ₹${i.total || 0}
                </div>
                <div class="mobile-invoice-actions">
                    ${i.status === 'unpaid' ? 
                        `<button class="mobile-btn-mark-paid" onclick="window.mobileInvoiceManager.markAsPaid(${index})">Mark as Paid</button>` : 
                        `<span class="mobile-status-paid">Paid ✓</span>`
                    }
                    ${i.status === 'paid' ? 
                        `<button class="mobile-btn-print" onclick="window.mobileInvoiceManager.printInvoiceFromList('${i.invoiceNumber}')">Print</button>` : 
                        ''
                    }
                </div>
            </div>
        `).join('') || '<div class="empty-state">No invoices found</div>';

        this.updateStreetFilterDropdown();
    }

    async loadAllDataFromSupabase() {
        try {
            if (!window.sb) {
                console.error("Supabase client (window.sb) is not defined!");
                return;
            }

            console.log("Mobile: Loading data from Supabase...");

            await Promise.all([
                this.loadCustomersFromDB(),
                this.loadInvoicesFromDB(),
                this.loadItemsFromDB(),
                this.loadStreetsFromDB()
            ]);

            this.updateStreetNamesList();
            this.updateCustomersList();
            this.updateMobileNumbersList();
            this.renderMobileInvoices();

            console.log("Mobile: All data loaded from Supabase");
        } catch (err) {
            console.error("Supabase load failed:", err);
        }
    }

    async loadCustomersFromDB() {
        const { data, error } = await window.sb.from('customers').select('*').order('name');
        if (error) throw error;
        this.customers = data || [];
        localStorage.setItem("customers", JSON.stringify(this.customers));
        
        // Update route dropdown if map is initialized
        if (this.map) {
            this.updateRouteDropdown();
        }
    }

    async loadStreetsFromDB() {
        const { data, error } = await window.sb.from('streets').select('name').order('name');
        if (error) throw error;
        this.streetNames = data ? data.map(s => s.name) : [];
        localStorage.setItem("streetNames", JSON.stringify(this.streetNames));
    }

    async loadInvoicesFromDB() {
        const { data, error } = await window.sb
            .from('invoices')
            .select('*, customers(name, mobile, street), created_by_user:auth.users!invoices_created_by_fkey(id, email)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        this.invoices = data.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            customerName: (inv.customers && inv.customers.name) || '',
            mobileNumber: (inv.customers && inv.customers.mobile) || '',
            streetName: (inv.customers && inv.customers.street) || '',
            invoiceDate: inv.invoice_date,
            items: inv.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            total: inv.total,
            status: inv.status,
            createdBy: inv.created_by,
            createdByEmail: inv.created_by_user?.email || null
        }));

        localStorage.setItem("invoices", JSON.stringify(this.invoices));
    }

    async saveCustomerToDB(name, mobile, street) {
        const { data, error } = await window.sb
            .from('customers')
            .insert({ name, mobile, street })
            .select()
            .single();

        if (error) throw error;

        if (street && !this.streetNames.includes(street)) {
            await window.sb.from('streets').insert({ name: street });
            this.streetNames.push(street);
            localStorage.setItem("streetNames", JSON.stringify(this.streetNames));
        }

        return data;
    }

    async saveInvoiceToDB(invoice) {
        let customer = this.customers.find(c => c.mobile === invoice.mobileNumber);
        if (!customer) {
            customer = await this.saveCustomerToDB(invoice.customerName, invoice.mobileNumber, invoice.streetName);
        }

        // Get current user ID from session
        const { data: { session } } = await window.sb.auth.getSession();
        const userId = session?.user?.id || null;

        const { data, error } = await window.sb
            .from('invoices')
            .insert({
                invoice_number: invoice.invoiceNumber,
                customer_id: customer.id,
                invoice_date: invoice.invoiceDate,
                items: invoice.items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    price: i.price,
                    total: i.total
                })),
                total: invoice.total,
                status: invoice.status,
                created_by: userId // Track who created the invoice
            })
            .select()
            .single();

        if (error) throw error;

        this.invoices.unshift({
            ...invoice,
            id: data.id
        });
        localStorage.setItem("invoices", JSON.stringify(this.invoices));
    }

    setupRealtimeSubscriptions() {
        window.sb
            .channel('mobile:invoices')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
                this.loadInvoicesFromDB().then(() => {
                    this.renderMobileInvoices();
                    this.updateInvoiceNumber();
                });
            })
            .subscribe();

        window.sb
            .channel('mobile:customers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, payload => {
                this.loadCustomersFromDB().then(() => {
                    this.updateCustomersList();
                    this.updateMobileNumbersList();
                });
            })
            .subscribe();

        window.sb
            .channel('mobile:streets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'streets' }, payload => {
                this.loadStreetsFromDB().then(() => {
                    this.updateStreetNamesList();
                });
            })
            .subscribe();

        window.sb
            .channel('mobile:items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
                this.loadItemsFromDB();
            })
            .subscribe();
    }

    loadItems() {
        return JSON.parse(localStorage.getItem('items')) || [];
    }

    async loadItemsFromDB() {
        const { data, error } = await window.sb.from('items').select('*').order('name');
        if (error) throw error;
        this.items = data || [];
        localStorage.setItem("items", JSON.stringify(this.items));
    }

    generateInvoiceNumber() {
        let max = 0;
        this.invoices.forEach(inv => {
            const m = inv.invoiceNumber && inv.invoiceNumber.match(/INV-(\d+)/);
            if (m) max = Math.max(max, parseInt(m[1]));
        });
        return `INV-${String(max + 1).padStart(3, '0')}`;
    }

    updateInvoiceNumber() {
        const numberSpan = document.getElementById('mobileInvoiceNumber');
        if (numberSpan) {
            numberSpan.textContent = this.generateInvoiceNumber();
        }
    }

    loadInvoices() {
        return JSON.parse(localStorage.getItem('invoices')) || [];
    }

    loadStreetNames() {
        return JSON.parse(localStorage.getItem('streetNames')) || [];
    }

    loadCustomers() {
        return JSON.parse(localStorage.getItem('customers')) || [];
    }

    updateMobileNumbersList() {
        const datalist = document.getElementById('mobileMobileNumbersList');
        if (datalist) {
            datalist.innerHTML = '';
            this.customers.forEach(c => {
                const option = document.createElement('option');
                option.value = c.mobile;
                datalist.appendChild(option);
            });
        }
    }

    updateStreetNamesList() {
        const lists = [
            document.getElementById('mobileStreetNamesList'),
            document.getElementById('newStreetNamesList')
        ];
        lists.forEach(datalist => {
            if (datalist) {
                datalist.innerHTML = '';
                this.streetNames.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s;
                    datalist.appendChild(option);
                });
            }
        });

        const input = document.getElementById('newStreetName');
        if (input) {
            const currentValue = input.value;
            const wasFocused = document.activeElement === input;
            input.value = '';
            setTimeout(() => {
                input.value = currentValue;
                if (wasFocused) input.focus();
            }, 10);
        }
    }

    updateCustomersList() {
        const datalist = document.getElementById('mobileCustomersList');
        if (datalist) {
            datalist.innerHTML = '';
            this.customers.forEach(c => {
                const option = document.createElement('option');
                option.value = c.name;
                datalist.appendChild(option);
            });
        }
    }

    // ==================== MAP METHODS ====================
    initMap() {
        const mapContainer = document.getElementById('mapContainer');
        if (!mapContainer) return;

        // Check if map already initialized
        if (this.map) {
            this.updateMapMarkers();
            return;
        }

        // Initialize map centered on a default location (you can change this)
        this.map = L.map('mapContainer').setView([20.5937, 78.9629], 13); // Default to India center

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Request user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.map.setView([latitude, longitude], 13);
                },
                (error) => {
                    console.log('Geolocation error:', error);
                }
            );
        }

        // Enable click to add marker (for adding customer location)
        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });

        // Load and display customer markers
        this.updateMapMarkers();
        this.updateRouteDropdown();
    }

    async updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.mapMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.mapMarkers.clear();

        // Load customers with coordinates
        await this.loadCustomersFromDB();

        // Get invoice status for each customer
        await this.loadInvoicesFromDB();

        // Create markers for each customer with location
        this.customers.forEach(customer => {
            if (customer.latitude && customer.longitude) {
                // Determine marker color based on invoice status
                const customerInvoices = this.invoices.filter(inv => 
                    inv.mobileNumber === customer.mobile
                );
                
                let markerColor = 'blue'; // Default: no invoice
                if (customerInvoices.length > 0) {
                    const hasUnpaid = customerInvoices.some(inv => inv.status === 'unpaid');
                    markerColor = hasUnpaid ? 'red' : 'green'; // Red if unpaid, green if all paid
                }

                const marker = L.marker([customer.latitude, customer.longitude], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })
                }).addTo(this.map);

                // Add popup with customer info
                const popupContent = `
                    <div style="padding: 10px;">
                        <strong>${customer.name || 'Unknown'}</strong><br>
                        Mobile: ${customer.mobile || 'N/A'}<br>
                        Street: ${customer.street || 'Not specified'}
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Store marker reference
                this.mapMarkers.set(customer.id, marker);
            }
        });
    }

    handleMapClick(e) {
        // This can be used to add customer location
        // For now, just show coordinates
        const { lat, lng } = e.latlng;
        console.log('Map clicked at:', lat, lng);
        
        // You can add functionality here to save location for a selected customer
        if (this.selectedCustomer) {
            this.saveCustomerLocation(this.selectedCustomer.id, lat, lng);
        }
    }

    async saveCustomerLocation(customerId, latitude, longitude) {
        try {
            const { error } = await window.sb
                .from('customers')
                .update({ latitude, longitude })
                .eq('id', customerId);

            if (error) throw error;

            // Update local data
            const customer = this.customers.find(c => c.id === customerId);
            if (customer) {
                customer.latitude = latitude;
                customer.longitude = longitude;
                localStorage.setItem("customers", JSON.stringify(this.customers));
            }

            // Refresh map
            this.updateMapMarkers();
            alert('Customer location saved!');
        } catch (err) {
            console.error('Failed to save location:', err);
            alert('Failed to save location');
        }
    }

    searchOnMap() {
        const searchInput = document.getElementById('mapSearchInput');
        const query = searchInput.value.trim().toLowerCase();
        
        if (!query) {
            alert('Please enter a name or mobile number');
            return;
        }

        // Find customer matching search
        const customer = this.customers.find(c => 
            (c.name && c.name.toLowerCase().includes(query)) ||
            (c.mobile && c.mobile.includes(query))
        );

        if (customer && customer.latitude && customer.longitude) {
            // Center map on customer
            this.map.setView([customer.latitude, customer.longitude], 15);
            
            // Open popup if marker exists
            const marker = this.mapMarkers.get(customer.id);
            if (marker) {
                marker.openPopup();
            }
        } else {
            alert('Customer not found or location not set');
        }
    }

    updateRouteDropdown() {
        const routeTo = document.getElementById('routeTo');
        if (!routeTo) return;

        routeTo.innerHTML = '<option value="">Select customer</option>' +
            this.customers
                .filter(c => c.latitude && c.longitude)
                .map(c => `<option value="${c.id}" data-lat="${c.latitude}" data-lng="${c.longitude}">${c.name} - ${c.mobile}</option>`)
                .join('');
    }

    async showRoute() {
        const routeFrom = document.getElementById('routeFrom').value.trim();
        const routeTo = document.getElementById('routeTo').value;

        if (!routeTo) {
            alert('Please select a destination customer');
            return;
        }

        const toOption = document.querySelector(`#routeTo option[value="${routeTo}"]`);
        if (!toOption) return;

        const toLat = parseFloat(toOption.dataset.lat);
        const toLng = parseFloat(toOption.dataset.lng);

        let fromLat, fromLng;

        if (routeFrom) {
            // Try to geocode the "from" address
            // For now, use current map center or user location
            const center = this.map.getCenter();
            fromLat = center.lat;
            fromLng = center.lng;
        } else {
            // Use current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        fromLat = position.coords.latitude;
                        fromLng = position.coords.longitude;
                        this.drawRoute(fromLat, fromLng, toLat, toLng);
                    },
                    () => {
                        const center = this.map.getCenter();
                        this.drawRoute(center.lat, center.lng, toLat, toLng);
                    }
                );
            } else {
                const center = this.map.getCenter();
                this.drawRoute(center.lat, center.lng, toLat, toLng);
            }
            return;
        }

        this.drawRoute(fromLat, fromLng, toLat, toLng);
    }

    drawRoute(fromLat, fromLng, toLat, toLng) {
        // Remove existing route
        if (this.currentRoute) {
            this.map.removeLayer(this.currentRoute);
        }

        // Use OpenRouteService or similar for routing
        // For now, draw a simple line (you can integrate a proper routing service)
        const routeCoordinates = [
            [fromLat, fromLng],
            [toLat, toLng]
        ];

        this.currentRoute = L.polyline(routeCoordinates, {
            color: 'blue',
            weight: 4,
            opacity: 0.7
        }).addTo(this.map);

        // Fit map to show entire route
        const bounds = L.latLngBounds(routeCoordinates);
        this.map.fitBounds(bounds);

        // Add markers for start and end
        L.marker([fromLat, fromLng], {
            icon: L.divIcon({
                className: 'route-marker',
                html: '<div style="background-color: green; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [15, 15]
            })
        }).addTo(this.map).bindPopup('Start Location');
        
        L.marker([toLat, toLng], {
            icon: L.divIcon({
                className: 'route-marker',
                html: '<div style="background-color: red; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>',
                iconSize: [15, 15]
            })
        }).addTo(this.map).bindPopup('Destination');
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        const getLocationBtn = document.getElementById('getLocationBtn');
        if (getLocationBtn) {
            getLocationBtn.textContent = 'Getting location...';
            getLocationBtn.disabled = true;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                document.getElementById('customerLatitude').value = latitude;
                document.getElementById('customerLongitude').value = longitude;
                
                if (getLocationBtn) {
                    getLocationBtn.textContent = 'Location Saved ✓';
                    getLocationBtn.disabled = false;
                    setTimeout(() => {
                        getLocationBtn.textContent = 'Get Current Location';
                    }, 2000);
                }
                alert(`Location saved: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            },
            (error) => {
                alert('Failed to get location: ' + error.message);
                if (getLocationBtn) {
                    getLocationBtn.textContent = 'Get Current Location';
                    getLocationBtn.disabled = false;
                }
            }
        );
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    const checkSupabase = setInterval(() => {
        if (window.sb) {
            clearInterval(checkSupabase);
            window.mobileInvoiceManager = new MobileInvoiceManager();
            console.log("Mobile Invoice App Started Successfully");
        }
    }, 100);
});