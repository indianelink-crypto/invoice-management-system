// Mobile Invoice Manager — FULLY UPGRADED + ALL LATEST FIXES (Top Search Hide + Preview Card Tap)

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

        document.querySelectorAll('.mobile-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('mobileInvoiceForm').addEventListener('submit', (e) => this.handleInvoiceSubmit(e));
        document.getElementById('mobileCustomerForm').addEventListener('submit', (e) => this.handleCustomerSubmit(e));
        document.getElementById('mobileAddItemBtn').addEventListener('click', () => this.addItemRow());

        document.getElementById('mobileLogoutBtn').addEventListener('click', async () => {
            await window.sb.auth.signOut();
            location.replace('mobile-login.html');
        });

        this.renderMobileInvoices();

        this.loadAllDataFromSupabase().then(() => {
            this.setupRealtimeSubscriptions();
            this.updateStreetFilterDropdown();
            console.log("✅ Mobile: Initial data loaded + Real-time active");
        });

        // ==================== UPGRADED CUSTOMER SEARCH & SELECTION ====================
        // Touch/click on preview card is now primary (mobile friendly)
        // Enter key kept as optional backup
        const searchInput = document.getElementById('mobileSearchInput');
        const preview = document.getElementById('selectedCustomerPreview');
        const previewName = document.getElementById('previewName');
        const previewMobile = document.getElementById('previewMobile');
        const previewStreet = document.getElementById('previewStreet');
        const invoiceSection = document.getElementById('customerInvoiceSection');
        const searchSection = document.getElementById('searchSection');

        if (searchInput && preview) {
            // Real-time preview update as user types
            searchInput.addEventListener('input', () => {
                const mobile = searchInput.value.trim();
                this.handleMobileSearch(mobile, preview, previewName, previewMobile, previewStreet);
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


            // Optional backup: Enter key also works
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const mobile = searchInput.value.trim();
                    const found = this.customers.find(c => c.mobile === mobile);
                    if (found) {
                        this.selectCustomer(found, searchSection, invoiceSection);
                    } else {
                        alert('No customer found with this mobile number!');
                    }
                }
            });
        }

        this.addItemRow();

        document.getElementById('mobileItemsTableBody').addEventListener('input', () => {
            this.calculateGrandTotal();
        });

        document.getElementById('mobilePrintBtn').addEventListener('click', () => {
            if (this.lastInvoice) {
                this.fillPrintTemplate(this.lastInvoice);
            }
            window.print();
        });

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
    }

    // ==================== NEW HELPER METHODS (added at the end of class) ====================

    // Real-time search preview update
    handleMobileSearch(mobile, preview, previewName, previewMobile, previewStreet) {
        if (mobile.length === 10) {
            const found = this.customers.find(c => c.mobile === mobile);
            if (found) {
                this.selectedCustomer = found;
                previewName.textContent = found.name || 'Unknown';
                previewMobile.textContent = found.mobile;
                previewStreet.textContent = found.street || 'Not set';
                preview.style.display = 'block';
            } else {
                this.selectedCustomer = null;
                preview.style.display = 'none';
            }
        } else {
            this.selectedCustomer = null;
            preview.style.display = 'none';
        }
    }

    // Confirm selection and switch to invoice section
    selectCustomer(customer, searchSection, invoiceSection) {
        this.selectedCustomer = customer;

        // Fill the clean display fields in invoice section
        document.getElementById('displayCustomerName').textContent = customer.name || 'Unknown';
        document.getElementById('displayMobile').textContent = customer.mobile;
        document.getElementById('displayStreet').textContent = customer.street || 'Not set';

        // Hide search section completely
        if (searchSection) {
            searchSection.style.display = 'none';
        }

        // Hide preview card
        document.getElementById('selectedCustomerPreview').style.display = 'none';

        // Show invoice section
        invoiceSection.style.display = 'block';

        // Optional: Focus first item input for smooth UX
        setTimeout(() => {
            const firstInput = document.querySelector('#mobileItemsTableBody input, #mobileItemsTableBody select');
            if (firstInput) firstInput.focus();
        }, 200);
    }

    // ==================== YOUR ORIGINAL METHODS (unchanged) ====================

    // NEW METHOD: Called from HTML onclick or Enter key (kept for compatibility)
    selectCustomerFromPreview() {
        if (!this.selectedCustomer) return;

        // Fill clean display card
        document.getElementById('displayCustomerName').textContent = this.selectedCustomer.name || 'Unknown';
        document.getElementById('displayMobile').textContent = this.selectedCustomer.mobile;
        document.getElementById('displayStreet').textContent = this.selectedCustomer.street || 'Not set';

        // Show invoice section
        document.getElementById('customerInvoiceSection').style.display = 'block';

        // HIDE TOP SEARCH SECTION COMPLETELY
        const searchSection = document.getElementById('searchSection');
        if (searchSection) {
            searchSection.style.display = 'none';
        }

        // Hide preview
        document.getElementById('selectedCustomerPreview').style.display = 'none';

        // Focus first item dropdown
        setTimeout(() => {
            const firstSelect = document.querySelector('#mobileItemsTableBody .mobile-item-desc-select');
            if (firstSelect) firstSelect.focus();
        }, 200);
    }

    addItemRow() {
        const tbody = document.getElementById('mobileItemsTableBody');
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
        document.getElementById('mobileGrandTotal').textContent = `₹${total}`;
        return total;
    }

    clearInvoiceForm() {
        document.getElementById('mobileInvoiceForm').reset();

        // Reset date to today DD-MM-YYYY
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const dateSpan = document.getElementById('mobileInvoiceDate');
        if (dateSpan) dateSpan.textContent = `${dd}-${mm}-${yyyy}`;

        this.updateInvoiceNumber();
        document.getElementById('mobileItemsTableBody').innerHTML = '';
        this.addItemRow();
        document.getElementById('mobilePrintBtn').style.display = 'none';
        document.getElementById('mobileGrandTotal').textContent = '₹0';
        this.lastInvoice = null;
        this.selectedCustomer = null;
        document.getElementById('customerInvoiceSection').style.display = 'none';

        // SHOW TOP SEARCH SECTION AGAIN
        const searchSection = document.getElementById('searchSection');
        if (searchSection) {
            searchSection.style.display = 'block';
        }

        document.getElementById('mobileSearchInput').value = '';
        document.getElementById('selectedCustomerPreview').style.display = 'none';

        // Clear display card
        document.getElementById('displayCustomerName').textContent = '';
        document.getElementById('displayMobile').textContent = '';
        document.getElementById('displayStreet').textContent = '';
    }

    fillPrintTemplate(invoice) {
        document.getElementById('mobilePrintInvoiceNo').textContent = invoice.invoiceNumber;
        document.getElementById('mobilePrintDate').textContent = invoice.invoiceDate;
        document.getElementById('mobilePrintCustomer').textContent = invoice.customerName;
        document.getElementById('mobilePrintMobile').textContent = invoice.mobileNumber;
        document.getElementById('mobilePrintStreet').textContent = invoice.streetName || 'Not specified';
        document.getElementById('mobilePrintGrandTotal').textContent = invoice.total;

        const tbody = document.getElementById('mobilePrintItems');
        tbody.innerHTML = invoice.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.total}</td>
            </tr>
        `).join('');

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
            document.querySelector('.print-invoice').appendChild(stamp);
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

        // Get displayed date (DD-MM-YYYY)
        const displayedDate = document.getElementById('mobileInvoiceDate').textContent.trim();

        // Convert to YYYY-MM-DD for Supabase
        const [dd, mm, yyyy] = displayedDate.split('-');
        const dbDate = `${yyyy}-${mm}-${dd}`;

        const invoice = {
            invoiceNumber: document.getElementById('mobileInvoiceNumber').textContent || document.getElementById('mobileInvoiceNumber').value,
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
            document.getElementById('mobilePrintBtn').style.display = 'block';
            this.fillPrintTemplate(invoice);

            alert(`Invoice ${invoice.invoiceNumber} created! Total: ₹${total}`);
            this.clearInvoiceForm();
            this.renderMobileInvoices();
        } catch (err) {
            alert("Failed to create invoice");
        }
    }

    async handleCustomerSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('newCustomerName').value.trim();
        const mobile = document.getElementById('newMobileNumber').value.trim();
        const street = document.getElementById('newStreetName').value.trim();

        if (!name || !mobile) {
            return alert("Name and mobile are required");
        }

        try {
            await this.saveCustomerToDB(name, mobile, street);
            alert("✅ Customer added successfully");

            e.target.reset();

            this.updateCustomersList();
            this.updateMobileNumbersList();
            this.updateStreetNamesList();
        } catch (err) {
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

        const uniqueStreets = [...new Set(this.invoices.map(i => i.streetName).filter(Boolean))];
        filter.innerHTML = `<option value="all">All Streets</option>` +
            uniqueStreets.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    renderMobileInvoices() {
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
            <div class="mobile-invoice-card">
                <div class="mobile-invoice-header">
                    <strong>${i.invoiceNumber}</strong> - ${i.invoiceDate}
                    <span class="mobile-status-badge ${i.status}">${i.status.toUpperCase()}</span>
                </div>
                <div class="mobile-invoice-info">
                    ${i.customerName} (${i.mobileNumber})<br>
                    Street: ${i.streetName || 'Not specified'}<br>
                    Total: ₹${i.total}
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

    switchTab(tabName) {
        document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.mobile-tab-content').forEach(c => c.classList.remove('active'));

        document.querySelector(`.mobile-tab[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');

        if (tabName === 'invoices') {
            this.renderMobileInvoices();
        }

        if (tabName === 'invoice') {
            this.clearInvoiceForm();
        }
    }

    async loadAllDataFromSupabase() {
        try {
            await Promise.all([
                this.loadCustomersFromDB(),
                this.loadStreetsFromDB(),
                this.loadInvoicesFromDB(),
                this.loadItemsFromDB()
            ]);

            this.updateStreetNamesList();
            this.updateCustomersList();
            this.updateMobileNumbersList();
            this.renderMobileInvoices();
            this.updateInvoiceNumber();

            console.log("✅ Mobile: All data loaded from Supabase");
        } catch (err) {
            console.error("Mobile: Supabase load failed, using localStorage fallback", err);
        }
    }

    async loadCustomersFromDB() {
        const { data, error } = await window.sb.from('customers').select('*').order('name');
        if (error) throw error;
        this.customers = data || [];
        localStorage.setItem("customers", JSON.stringify(this.customers));
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
            .select('*, customers(name, mobile, street)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        this.invoices = data.map(inv => ({
            id: inv.id,
            invoiceNumber: inv.invoice_number,
            customerName: inv.customers?.name || '',
            mobileNumber: inv.customers?.mobile || '',
            streetName: inv.customers?.street || '',
            invoiceDate: inv.invoice_date,
            items: inv.items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                price: item.price,
                total: item.total
            })),
            total: inv.total,
            status: inv.status
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

        this.customers.push(data);
        localStorage.setItem("customers", JSON.stringify(this.customers));
        return data;
    }

    async saveInvoiceToDB(invoice) {
        let customer = this.customers.find(c => c.mobile === invoice.mobileNumber);
        if (!customer) {
            customer = await this.saveCustomerToDB(invoice.customerName, invoice.mobileNumber, invoice.streetName);
        }

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
                status: invoice.status
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
            const m = inv.invoiceNumber?.match(/INV-(\d+)/);
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
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    window.mobileInvoiceManager = new MobileInvoiceManager();
});