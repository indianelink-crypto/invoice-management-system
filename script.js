console.log("✅ script.js loaded - Street Name Dropdown Only + Grand Total Live + Print Invoice Fixed + DD-MM-YYYY Date");

class InvoiceManagementSystem {
    constructor() {
        this.customers = JSON.parse(localStorage.getItem("customers")) || [];
        this.users = JSON.parse(localStorage.getItem("users")) || [];
        this.invoices = JSON.parse(localStorage.getItem("invoices")) || [];
        this.items = JSON.parse(localStorage.getItem("items")) || [];
        this.streets = JSON.parse(localStorage.getItem("streets")) || [];

        this.currentStatusFilter = 'all';

        this.init();
    }

    init() {
        this.initTabs();
        this.initMasterForms();
        this.initInvoiceForm();
        this.renderCustomers();
        this.renderUsers();
        this.renderItems();
        this.renderInvoices();
        this.populateDatalists();
        this.populateItemDatalist();
        this.initInvoiceDefaults(); // This now sets DD-MM-YYYY
        this.setupFilters();

        this.migrateStreets();
        this.renderStreetsDropdown();

        const printBtn = document.getElementById('printInvoiceBtn');
        if (printBtn) printBtn.style.display = 'none';

        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }

        this.loadAllDataFromSupabase().then(() => {
            this.setupRealtimeSubscriptions();
            console.log("✅ Initial data loaded + Real-time subscriptions active");
        });
    }

    // ====================== SUPABASE METHODS ======================

    async loadAllDataFromSupabase() {
        try {
            await Promise.all([
                this.loadCustomersFromDB(),
                this.loadItemsFromDB(),
                this.loadStreetsFromDB(),
                this.loadInvoicesFromDB()
            ]);

            this.renderCustomers();
            this.renderUsers();
            this.renderItems();
            this.renderInvoices();
            this.populateDatalists();
            this.populateItemDatalist();
            this.renderStreetsDropdown();
            this.setupFilters();
            this.updateInvoiceNumber();

            console.log("✅ All data loaded from Supabase");
        } catch (err) {
            console.error("Supabase load failed, using localStorage fallback", err);
        }
    }

    async loadCustomersFromDB() {
        const { data, error } = await window.sb.from('customers').select('*').order('name');
        if (error) throw error;
        this.customers = data || [];
        localStorage.setItem("customers", JSON.stringify(this.customers));
    }

    async loadItemsFromDB() {
        const { data, error } = await window.sb.from('items').select('*').order('name');
        if (error) throw error;
        this.items = data || [];
        localStorage.setItem("items", JSON.stringify(this.items));
    }

    async loadStreetsFromDB() {
        const { data, error } = await window.sb.from('streets').select('*').order('name');
        if (error) throw error;
        this.streets = data ? data.map(s => s.name) : [];
        localStorage.setItem("streets", JSON.stringify(this.streets));
    }

    async loadInvoicesFromDB() {
        const { data, error } = await window.sb
            .from('invoices')
            .select('*, customers(name, mobile, street)')
            .order('created_at', { ascending: false });
        if (error) throw error;

        this.invoices = data.map(inv => ({
            invoiceNumber: inv.invoice_number,
            date: inv.invoice_date,
            customer: inv.customers?.name || '',
            mobile: inv.customers?.mobile || '',
            street: inv.customers?.street || '',
            items: inv.items.map(item => ({
                desc: item.description,
                qty: item.quantity,
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
        if (error) {
            alert("Customer save failed: " + error.message);
            throw error;
        }
        this.customers.push(data);
        localStorage.setItem("customers", JSON.stringify(this.customers));
        return data;
    }

    async updateCustomerInDB(id, name, mobile, street) {
        const { error } = await window.sb
            .from('customers')
            .update({ name, mobile, street })
            .eq('id', id);
        if (error) throw error;

        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers[index] = { id, name, mobile, street };
            localStorage.setItem("customers", JSON.stringify(this.customers));
        }
    }

    async deleteCustomerFromDB(id) {
        const { error } = await window.sb.from('customers').delete().eq('id', id);
        if (error) throw error;
        this.customers = this.customers.filter(c => c.id !== id);
        localStorage.setItem("customers", JSON.stringify(this.customers));
    }

    async saveItemToDB(name, price) {
        const { data, error } = await window.sb
            .from('items')
            .insert({ name, price })
            .select()
            .single();
        if (error) throw error;
        this.items.push(data);
        localStorage.setItem("items", JSON.stringify(this.items));
        return data;
    }

    async updateItemInDB(id, name, price) {
        const { error } = await window.sb
            .from('items')
            .update({ name, price })
            .eq('id', id);
        if (error) throw error;
        const index = this.items.findIndex(i => i.id === id);
        if (index !== -1) this.items[index] = { id, name, price };
        localStorage.setItem("items", JSON.stringify(this.items));
    }

    async deleteItemFromDB(id) {
        const { error } = await window.sb.from('items').delete().eq('id', id);
        if (error) throw error;
        this.items = this.items.filter(i => i.id !== id);
        localStorage.setItem("items", JSON.stringify(this.items));
    }

    async saveStreetToDB(name) {
        const { data, error } = await window.sb
            .from('streets')
            .insert({ name })
            .select()
            .single();
        if (error && error.code !== '23505') throw error;
        if (data && !this.streets.includes(data.name)) {
            this.streets.push(data.name);
            localStorage.setItem("streets", JSON.stringify(this.streets));
        }
    }

    async saveInvoiceToDB(invoice) {
        let customer = this.customers.find(c => c.mobile === invoice.mobile);
        if (!customer) {
            customer = await this.saveCustomerToDB(invoice.customer, invoice.mobile, invoice.street);
        }

        const { data, error } = await window.sb
            .from('invoices')
            .insert({
                invoice_number: invoice.invoiceNumber,
                customer_id: customer.id,
                invoice_date: invoice.date,
                items: invoice.items.map(i => ({
                    description: i.desc,
                    quantity: i.qty,
                    price: i.price,
                    total: i.total
                })),
                total: invoice.total,
                status: invoice.status
            })
            .select()
            .single();

        if (error) {
            alert("Invoice save failed: " + error.message);
            throw error;
        }

        this.invoices.unshift(invoice);
        localStorage.setItem("invoices", JSON.stringify(this.invoices));
        return data;
    }

    async togglePaidStatusInDB(invoiceIndex) {
        const inv = this.invoices[invoiceIndex];
        if (!inv.id) return;

        const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
        const { error } = await window.sb
            .from('invoices')
            .update({ status: newStatus })
            .eq('id', inv.id);

        if (!error) {
            inv.status = newStatus;
            localStorage.setItem("invoices", JSON.stringify(this.invoices));
        }
    }

    setupRealtimeSubscriptions() {
        window.sb
            .channel('admin:invoices')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, payload => {
                console.log('Real-time: Invoice change detected');
                this.loadInvoicesFromDB().then(() => {
                    this.renderInvoices();
                    this.updateInvoiceNumber();
                    this.setupFilters();
                });
            })
            .subscribe();

        window.sb
            .channel('admin:customers')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, payload => {
                console.log('Real-time: Customer change detected');
                this.loadCustomersFromDB().then(() => {
                    this.renderCustomers();
                    this.populateDatalists();
                });
            })
            .subscribe();

        window.sb
            .channel('admin:streets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'streets' }, payload => {
                console.log('Real-time: Street change detected');
                this.loadStreetsFromDB().then(() => {
                    this.renderStreetsDropdown();
                    this.populateDatalists();
                });
            })
            .subscribe();

        window.sb
            .channel('admin:items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
                console.log('Real-time: Item change detected');
                this.loadItemsFromDB().then(() => {
                    this.renderItems();
                    this.populateItemDatalist();
                });
            })
            .subscribe();
    }

    // ====================== UI & LOGIC ======================

    migrateStreets() {
        this.customers.forEach(c => {
            if (c.street && !this.streets.includes(c.street)) {
                this.streets.push(c.street);
            }
        });
        this.streets = [...new Set(this.streets.sort())];
        this.save();
    }

    renderStreetsDropdown() {
        const select = document.getElementById('masterStreetNameSelect');
        if (select) {
            select.innerHTML = '<option value="">Select a street</option>' +
                this.streets.map(s => `<option value="${s}">${s}</option>`).join('');
        }
    }

    initTabs() {
        document.querySelectorAll(".section-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".section-tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
                tab.classList.add("active");
                document.getElementById(tab.dataset.tab + "Tab").classList.add("active");
            });
        });

        document.querySelectorAll(".master-sub-tab").forEach(tab => {
            tab.addEventListener("click", () => {
                document.querySelectorAll(".master-sub-tab").forEach(t => t.classList.remove("active"));
                document.querySelectorAll(".master-sub-content").forEach(c => c.classList.remove("active"));
                tab.classList.add("active");
                document.getElementById(tab.dataset.subtab + "SubTab").classList.add("active");
            });
        });
    }

    initMasterForms() {
        document.getElementById('addNewStreetBtn').addEventListener('click', async () => {
            const newStreet = document.getElementById('newStreetName').value.trim();
            if (!newStreet) {
                alert("Please enter a street name");
                return;
            }

            try {
                const { data, error } = await window.sb
                    .from('streets')
                    .insert({ name: newStreet })
                    .select()
                    .single();

                if (error) {
                    if (error.code === '23505') {
                        alert("⚠️ This street name already exists!");
                    } else {
                        alert("Failed to add street: " + error.message);
                    }
                    return;
                }

                if (!this.streets.includes(data.name)) {
                    this.streets.push(data.name);
                    localStorage.setItem("streets", JSON.stringify(this.streets));
                }

                this.renderStreetsDropdown();
                this.populateDatalists();
                document.getElementById('newStreetName').value = '';
                alert("✅ New street added!");

            } catch (err) {
                alert("Unexpected error while adding street");
                console.error(err);
            }
        });

        document.getElementById("masterForm").addEventListener("submit", async e => {
            e.preventDefault();
            const name = document.getElementById("masterCustomerName").value.trim();
            const mobile = document.getElementById("masterMobileNumber").value.trim();
            const street = document.getElementById("masterStreetNameSelect").value;
            const editIndex = document.getElementById("customerEditIndex").value;
            const customerId = editIndex !== "-1" ? this.customers[editIndex]?.id : null;

            if (!name || !mobile || !street) {
                alert("All fields are required");
                return;
            }

            try {
                if (editIndex === "-1") {
                    await this.saveCustomerToDB(name, mobile, street);
                    alert("✅ Customer added");
                } else {
                    await this.updateCustomerInDB(customerId, name, mobile, street);
                    alert("✅ Customer updated");
                }

                e.target.reset();
                document.getElementById("customerEditIndex").value = "-1";
                document.getElementById("customerSubmitBtn").textContent = "Add Customer";

                this.renderCustomers();
                this.populateDatalists();
            } catch (err) {
                alert("Operation failed");
            }
        });

        const itemsForm = document.getElementById("itemsForm");
        if (itemsForm) {
            itemsForm.addEventListener("submit", async e => {
                e.preventDefault();
                const name = document.getElementById("itemName").value.trim();
                const price = parseFloat(document.getElementById("itemPrice").value);
                const editIndex = document.getElementById("itemEditIndex").value;
                const itemId = editIndex !== "-1" ? this.items[editIndex]?.id : null;

                if (!name || isNaN(price)) return;

                try {
                    if (editIndex === "-1") {
                        await this.saveItemToDB(name, price);
                        alert("✅ Item added");
                    } else {
                        await this.updateItemInDB(itemId, name, price);
                        alert("✅ Item updated");
                    }

                    e.target.reset();
                    document.getElementById("itemEditIndex").value = "-1";
                    document.getElementById("itemSubmitBtn").textContent = "Add Item";

                    this.renderItems();
                    this.populateItemDatalist();
                } catch (err) {
                    alert("Operation failed");
                }
            });
        }
    }

    async editCustomer(i) {
        const c = this.customers[i];
        document.getElementById("masterCustomerName").value = c.name;
        document.getElementById("masterMobileNumber").value = c.mobile;
        document.getElementById("masterStreetNameSelect").value = c.street || '';
        document.getElementById("customerEditIndex").value = i;
        document.getElementById("customerSubmitBtn").textContent = "Update Customer";
    }

    async deleteCustomer(i) {
        if (confirm("Delete this customer?")) {
            const customerId = this.customers[i]?.id;
            if (customerId) {
                try {
                    await this.deleteCustomerFromDB(customerId);
                    this.renderCustomers();
                    this.populateDatalists();
                } catch (err) {
                    alert("Delete failed");
                }
            }
        }
    }

    async editItem(i) {
        const item = this.items[i];
        document.getElementById("itemName").value = item.name;
        document.getElementById("itemPrice").value = item.price;
        document.getElementById("itemEditIndex").value = i;
        document.getElementById("itemSubmitBtn").textContent = "Update Item";
    }

    async deleteItem(i) {
        if (confirm("Delete this item?")) {
            const itemId = this.items[i]?.id;
            if (itemId) {
                try {
                    await this.deleteItemFromDB(itemId);
                    this.renderItems();
                    this.populateItemDatalist();
                } catch (err) {
                    alert("Delete failed");
                }
            }
        }
    }

    initInvoiceForm() {
        const mobileInput = document.getElementById('mobileNumber');
        const customerNameInput = document.getElementById('customerName');
        const streetInput = document.getElementById('streetName');

        if (mobileInput && customerNameInput && streetInput) {
            const autoFillCustomer = () => {
                const mobile = mobileInput.value.trim();
                const found = this.customers.find(c => c.mobile === mobile);
                if (found) {
                    customerNameInput.value = found.name;
                    streetInput.value = found.street || '';
                } else {
                    customerNameInput.value = '';
                    streetInput.value = '';
                }
            };

            mobileInput.addEventListener('change', autoFillCustomer);
            mobileInput.addEventListener('blur', autoFillCustomer);
            mobileInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    autoFillCustomer();
                }
            });
        }

        document.getElementById('invoiceForm').addEventListener('submit', async e => {
            e.preventDefault();

            const items = [];
            let valid = true;

            document.querySelectorAll('.item-row').forEach(row => {
                const desc = row.querySelector('.item-description-select').value.trim();
                const qty = parseInt(row.querySelector('.item-quantity').value);
                const price = parseFloat(row.querySelector('.item-price').value);

                if (desc && qty > 0 && price >= 0) {
                    items.push({ desc, qty, price, total: qty * price });
                } else if (desc || qty || price) {
                    valid = false;
                }
            });

            if (!valid || items.length === 0) {
                alert("Please complete all item fields or add at least one item");
                return;
            }

            const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

            const newInvoice = {
                invoiceNumber: document.getElementById('invoiceNumber').value,
                date: document.getElementById('invoiceDate').value,
                customer: customerNameInput.value.trim(),
                mobile: mobileInput.value.trim(),
                street: streetInput.value.trim(),
                items,
                total: totalAmount,
                status: "unpaid"
            };

            try {
                await this.saveInvoiceToDB(newInvoice);

                this.renderInvoices();
                this.updateInvoiceNumber();
                this.setupFilters();
                e.target.reset();
                document.getElementById('itemsContainer').innerHTML = '';
                this.addItem();

                const printBtn = document.getElementById('printInvoiceBtn');
                if (printBtn) printBtn.style.display = 'block';

                this.fillPrintTemplate(newInvoice);

                alert(`✅ Invoice created! Total: ₹${totalAmount.toFixed(2)}`);
            } catch (err) {
                alert("Failed to save invoice");
            }
        });
    }

    async togglePaid(index) {
        const inv = this.invoices[index];
        inv.status = inv.status === 'paid' ? 'unpaid' : 'paid';
        this.save();
        await this.togglePaidStatusInDB(index);
        this.renderInvoices();
        this.setupFilters();
    }

    renderCustomers() {
        const list = document.getElementById("customerList");
        list.innerHTML = this.customers.map((c, i) => `
            <div class="master-item">
                <span>${c.name} - ${c.mobile} - ${c.street}</span>
                <div class="actions">
                    <button class="btn-edit" onclick="window.app.editCustomer(${i})">Edit</button>
                    <button class="btn-delete" onclick="window.app.deleteCustomer(${i})">Delete</button>
                </div>
            </div>
        `).join("") || "<p>No customers yet</p>";
    }

    renderUsers() {
        const list = document.getElementById("userList");
        list.innerHTML = this.users.map((u, i) => `
            <div class="master-item">
                <span>${u.username} (${u.role})</span>
                <div class="actions">
                    <button class="btn-edit" onclick="window.app.editUser(${i})">Edit</button>
                    <button class="btn-delete" onclick="window.app.deleteUser(${i})">Delete</button>
                </div>
            </div>
        `).join("") || "<p>No users yet</p>";
    }

    renderItems() {
        const list = document.getElementById("itemsList");
        list.innerHTML = this.items.map((item, i) => `
            <div class="master-item">
                <span>${item.name} - ₹${item.price.toFixed(2)}</span>
                <div class="actions">
                    <button class="btn-edit" onclick="window.app.editItem(${i})">Edit</button>
                    <button class="btn-delete" onclick="window.app.deleteItem(${i})">Delete</button>
                </div>
            </div>
        `).join("") || "<p>No items yet</p>";
    }

    // NEW: DD-MM-YYYY Date Format
    initInvoiceDefaults() {
        const dateInput = document.getElementById('invoiceDate');
        if (dateInput) {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const formatted = `${dd}-${mm}-${yyyy}`;
            dateInput.value = formatted;
            dateInput.type = 'text'; // Hide calendar picker
            dateInput.readOnly = true;
        }

        this.updateInvoiceNumber();
        this.addItem();
        this.calculateGrandTotal();
    }

    updateInvoiceNumber() {
        let max = 0;
        this.invoices.forEach(inv => {
            const match = inv.invoiceNumber?.match(/INV-(\d+)/);
            if (match) max = Math.max(max, parseInt(match[1]));
        });
        const next = String(max + 1).padStart(4, '0');
        document.getElementById('invoiceNumber').value = `INV-${next}`;
    }

    calculateGrandTotal() {
        let total = 0;
        document.querySelectorAll('.item-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            total += qty * price;
        });
        const totalElement = document.getElementById('grandTotal');
        if (totalElement) {
            totalElement.textContent = `₹${total.toFixed(2)}`;
        }
    }

    addItem() {
        const container = document.getElementById('itemsContainer');
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `
            <select class="item-description-select" required>
                <option value="">Select an item</option>
                ${this.items.map(item => 
                    `<option value="${item.name}" data-price="${item.price}">
                        ${item.name} (₹${item.price.toFixed(2)})
                    </option>`
                ).join('')}
            </select>
            <input type="number" class="item-quantity" placeholder="Qty" min="1" value="1" step="1" required>
            <input type="number" class="item-price" placeholder="Price (₹)" min="0" step="0.01" readonly>
            <button type="button" class="remove-item-btn" onclick="this.closest('.item-row').remove(); window.app.calculateGrandTotal()">×</button>
        `;
        container.appendChild(row);

        const select = row.querySelector('.item-description-select');
        const priceInput = row.querySelector('.item-price');
        const qtyInput = row.querySelector('.item-quantity');

        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            const price = selectedOption.dataset.price || '';
            priceInput.value = price ? parseFloat(price).toFixed(2) : '';
            this.calculateGrandTotal();
        });

        qtyInput.addEventListener('input', () => this.calculateGrandTotal());
        this.calculateGrandTotal();
    }

    populateItemDatalist() {
        const datalist = document.getElementById('itemNamesList');
        if (datalist) {
            datalist.innerHTML = this.items.map(item => `<option value="${item.name}">`).join('');
        }
    }

    populateDatalists() {
        const customersList = document.getElementById('customersList');
        if (customersList) customersList.innerHTML = this.customers.map(c => `<option value="${c.name}">`).join('');

        const mobileNumbersList = document.getElementById('mobileNumbersList');
        if (mobileNumbersList) mobileNumbersList.innerHTML = this.customers.map(c => `<option value="${c.mobile}">`).join('');

        const streetNamesList = document.getElementById('streetNamesList');
        if (streetNamesList) {
            streetNamesList.innerHTML = this.streets.map(s => `<option value="${s}">`).join('');
        }
    }

    fillPrintTemplate(invoice) {
        document.getElementById('printInvoiceNo').textContent = invoice.invoiceNumber;
        document.getElementById('printDate').textContent = invoice.date;
        document.getElementById('printCustomer').textContent = invoice.customer;
        document.getElementById('printMobile').textContent = invoice.mobile;
        document.getElementById('printStreet').textContent = invoice.street || 'Not specified';
        document.getElementById('printGrandTotal').textContent = invoice.total.toFixed(2);
        document.getElementById('printStatus').textContent = invoice.status.toUpperCase();

        const printItemsBody = document.getElementById('printItems');
        printItemsBody.innerHTML = invoice.items.map(item => `
            <tr>
                <td>${item.desc}</td>
                <td>${item.qty}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>₹${(item.qty * item.price).toFixed(2)}</td>
            </tr>
        `).join('');
    }

    printFromList(index) {
        const invoice = this.invoices[index];
        this.fillPrintTemplate(invoice);
        window.print();
    }

    setupFilters() {
        const streetSelect = document.getElementById('streetFilter');
        const uniqueStreets = [...new Set(this.invoices.map(inv => inv.street).filter(Boolean))];
        streetSelect.innerHTML = `<option value="all">All Streets</option>` + 
            uniqueStreets.map(s => `<option value="${s}">${s}</option>`).join('');
        streetSelect.addEventListener('change', () => this.renderInvoices());

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentStatusFilter = btn.dataset.filter;
                this.renderInvoices();
            });
        });
    }

    renderInvoices() {
        let filtered = this.invoices;

        if (this.currentStatusFilter !== 'all') {
            filtered = filtered.filter(inv => inv.status === this.currentStatusFilter);
        }

        const streetValue = document.getElementById('streetFilter')?.value || 'all';
        if (streetValue !== 'all') {
            filtered = filtered.filter(inv => inv.street === streetValue);
        }

        const list = document.getElementById('invoiceList');
        list.innerHTML = filtered.map((inv, index) => `
            <div class="invoice-card">
                <div class="invoice-header">
                    <strong>${inv.invoiceNumber}</strong> - ${inv.date}
                    <span class="status-badge ${inv.status}">${inv.status.toUpperCase()}</span>
                </div>
                <div class="invoice-info">
                    ${inv.customer} (${inv.mobile})<br>
                    Street: ${inv.street || 'Not specified'}<br>
                    Total: ₹${inv.total.toFixed(2)}
                </div>
                <div class="invoice-actions">
                    <button class="btn-toggle-paid" onclick="window.app.togglePaid(${index})">
                        ${inv.status === 'paid' ? 'Mark Unpaid' : 'Mark as Paid'}
                    </button>
                    <button class="btn-print-list" onclick="window.app.printFromList(${index})">
                        Print
                    </button>
                </div>
            </div>
        `).join("") || "<p class='empty-state'>No invoices found</p>";
    }

    save() {
        localStorage.setItem("customers", JSON.stringify(this.customers));
        localStorage.setItem("users", JSON.stringify(this.users));
        localStorage.setItem("invoices", JSON.stringify(this.invoices));
        localStorage.setItem("items", JSON.stringify(this.items));
        localStorage.setItem("streets", JSON.stringify(this.streets));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.app = new InvoiceManagementSystem();
});