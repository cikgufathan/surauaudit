import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';
import { FIREBASE_CONFIG, FIRESTORE_COLLECTION } from './firebase-config.js';

const STORAGE_KEY = 'masjid_audit_transactions_v1';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

const loginSection = document.getElementById('loginSection');
const appSection = document.getElementById('appSection');
const topActions = document.getElementById('topActions');
const auditBody = document.getElementById('auditBody');
const receiptDialog = document.getElementById('receiptDialog');
const receiptContent = document.getElementById('receiptContent');
const syncStatus = document.getElementById('syncStatus');
const txnForm = document.getElementById('txnForm');

txnForm.date.value = new Date().toISOString().slice(0, 10);

const isCloudEnabled = Boolean(FIREBASE_CONFIG?.projectId);
let cloudDb = null;
let cloudStorage = null;
let allTransactions = [];
let stopCloudSync = null;

if (isCloudEnabled) {
  const app = initializeApp(FIREBASE_CONFIG);
  cloudDb = getFirestore(app);
  cloudStorage = getStorage(app);
  syncStatus.textContent = 'Mod: cloud sync aktif';
} else {
  syncStatus.textContent = 'Mod: local sahaja';
  allTransactions = getLocalTransactions();
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  if (fd.get('username') === ADMIN_USER && fd.get('password') === ADMIN_PASS) {
    sessionStorage.setItem('isAdmin', 'true');
    renderApp();
  } else {
    alert('Login gagal.');
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('isAdmin');
  renderApp();
});

txnForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const attachment = fd.get('attachment');

  const txn = {
    date: fd.get('date'),
    type: fd.get('type'),
    amount: Number(fd.get('amount')),
    category: fd.get('category'),
    method: fd.get('method'),
    name: fd.get('name') || '',
    description: fd.get('description') || '',
    attachmentName: '',
    attachmentUrl: '',
    attachmentPath: '',
    receiptNumber: null,
    createdAt: new Date().toISOString(),
  };

  if (txn.type === 'masuk' && txn.method === 'tunai') {
    const tempId = crypto.randomUUID().slice(0, 6).toUpperCase();
    txn.receiptNumber = `RCPT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${tempId}`;
  }

  try {
    if (isCloudEnabled) {
      if (attachment && attachment.size > 0) {
        const safeName = attachment.name.replace(/\s+/g, '_');
        const storagePath = `masjid-bukti/${Date.now()}-${safeName}`;
        txn.attachmentName = attachment.name;
        txn.attachmentPath = storagePath;
        const fileRef = ref(cloudStorage, storagePath);
        await uploadBytes(fileRef, attachment);
        txn.attachmentUrl = await getDownloadURL(fileRef);
      }

      await addDoc(collection(cloudDb, FIRESTORE_COLLECTION), {
        ...txn,
        createdAtServer: serverTimestamp(),
      });
    } else {
      if (attachment && attachment.size > 0) {
        txn.attachmentName = attachment.name;
        txn.attachmentUrl = await toBase64(attachment);
      }
      txn.id = crypto.randomUUID();
      allTransactions.push(txn);
      saveLocalTransactions(allTransactions);
      renderAudit();
    }

    if (txn.receiptNumber) openReceipt(txn);
    txnForm.reset();
    txnForm.date.value = new Date().toISOString().slice(0, 10);
  } catch (err) {
    console.error(err);
    alert('Gagal simpan transaksi. Sila semak config cloud atau cuba lagi.');
  }
});

document.getElementById('generateBtn').addEventListener('click', renderAudit);
document.getElementById('printBtn').addEventListener('click', () => window.print());
document.getElementById('printReceipt').addEventListener('click', () => window.print());
document.getElementById('closeReceipt').addEventListener('click', () => receiptDialog.close());

function getLocalTransactions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveLocalTransactions(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function startCloudSync() {
  if (stopCloudSync) return;
  const q = query(collection(cloudDb, FIRESTORE_COLLECTION), orderBy('date', 'asc'));
  stopCloudSync = onSnapshot(q, (snapshot) => {
    allTransactions = snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    renderAudit();
  });
}

function renderApp() {
  const loggedIn = sessionStorage.getItem('isAdmin') === 'true';
  loginSection.classList.toggle('hidden', loggedIn);
  appSection.classList.toggle('hidden', !loggedIn);
  topActions.classList.toggle('hidden', !loggedIn);

  if (loggedIn) {
    if (isCloudEnabled) startCloudSync();
    renderAudit();
  }
}

function renderAudit() {
  const from = document.getElementById('fromDate').value;
  const to = document.getElementById('toDate').value;
  const txns = allTransactions.filter((t) => (!from || t.date >= from) && (!to || t.date <= to));

  const totalIn = txns.filter((t) => t.type === 'masuk').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = txns.filter((t) => t.type === 'keluar').reduce((sum, t) => sum + Number(t.amount), 0);

  document.getElementById('sumIn').textContent = `RM ${totalIn.toFixed(2)}`;
  document.getElementById('sumOut').textContent = `RM ${totalOut.toFixed(2)}`;
  document.getElementById('balance').textContent = `RM ${(totalIn - totalOut).toFixed(2)}`;

  auditBody.innerHTML = '';
  txns.sort((a, b) => a.date.localeCompare(b.date)).forEach((t) => {
    const tr = document.createElement('tr');
    const detail = `${t.description || '-'} ${t.name ? `(${t.name})` : ''}`;
    const attachmentHtml = t.attachmentUrl
      ? `<a href="${t.attachmentUrl}" target="_blank" rel="noopener noreferrer">${t.attachmentName || 'Lampiran'}</a>`
      : '-';

    tr.innerHTML = `
      <td>${t.date}</td>
      <td>${t.type}</td>
      <td>${t.category}</td>
      <td>RM ${Number(t.amount).toFixed(2)}</td>
      <td>${detail}</td>
      <td>${attachmentHtml}${t.receiptNumber ? `<br/><a href="#" data-receipt="${t.id}">${t.receiptNumber}</a>` : ''}</td>
      <td><button type="button" class="btn-delete" data-delete="${t.id}">Padam</button></td>
    `;
    auditBody.appendChild(tr);
  });

  auditBody.querySelectorAll('[data-receipt]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.getAttribute('data-receipt');
      const txn = allTransactions.find((t) => t.id === id);
      if (txn) openReceipt(txn);
    });
  });

  auditBody.querySelectorAll('[data-delete]').forEach((el) => {
    el.addEventListener('click', async () => {
      const id = el.getAttribute('data-delete');
      await deleteTransaction(id);
    });
  });
}

async function deleteTransaction(id) {
  const txn = allTransactions.find((item) => item.id === id);
  if (!txn) return;

  const ok = window.confirm(`Padam transaksi ${txn.category} pada ${txn.date}?`);
  if (!ok) return;

  try {
    if (isCloudEnabled) {
      await deleteDoc(doc(cloudDb, FIRESTORE_COLLECTION, id));
      if (txn.attachmentPath) {
        try {
          await deleteObject(ref(cloudStorage, txn.attachmentPath));
        } catch (storageError) {
          console.warn('Lampiran mungkin sudah tiada dalam Storage:', storageError);
        }
      }
    } else {
      allTransactions = allTransactions.filter((item) => item.id !== id);
      saveLocalTransactions(allTransactions);
      renderAudit();
    }
  } catch (error) {
    console.error(error);
    alert('Gagal padam transaksi. Sila cuba lagi.');
  }
}

function openReceipt(txn) {
  receiptContent.innerHTML = `
    <h3>Resit Sumbangan Tunai</h3>
    <p>No Resit: <strong>${txn.receiptNumber || '-'}</strong></p>
    <p>Tarikh: ${txn.date}</p>
    <p>Nama: ${txn.name || 'Tidak dinyatakan'}</p>
    <p>Kategori: ${txn.category}</p>
    <p>Amaun: RM ${Number(txn.amount).toFixed(2)}</p>
    <p>Keterangan: ${txn.description || '-'}</p>
    <small>Resit ini dijana automatik oleh sistem audit.</small>
  `;
  receiptDialog.showModal();
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

renderApp();
