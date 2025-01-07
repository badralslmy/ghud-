// فتح قاعدة بيانات IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 3); // الإصدار 3

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('sections')) {
                db.createObjectStore('sections', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// إضافة قسم إلى IndexedDB
const addSectionToDB = async (section) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readwrite');
        const store = transaction.objectStore('sections');
        const request = store.add(section);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// استرجاع جميع الأقسام من IndexedDB
const getAllSectionsFromDB = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readonly');
        const store = transaction.objectStore('sections');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// تحديث قسم في IndexedDB
const updateSectionInDB = async (section) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readwrite');
        const store = transaction.objectStore('sections');
        const request = store.put(section);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// حذف قسم من IndexedDB
const deleteSectionFromDB = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('sections', 'readwrite');
        const store = transaction.objectStore('sections');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// عرض الأقسام
const updateSectionsGrid = async () => {
    try {
        const sections = await getAllSectionsFromDB();
        const sectionsGrid = document.getElementById('sectionsGrid');
        sectionsGrid.innerHTML = sections.map(section => `
            <div class="section-item">
                <h3>${section.name}</h3>
                <div class="section-actions">
                    <button class="edit-btn" onclick="editSection(${section.id})"><i class="fas fa-edit"></i> تعديل</button>
                    <button class="delete-btn" onclick="deleteSection(${section.id})"><i class="fas fa-trash"></i> حذف</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء عرض الأقسام:', error);
    }
};

// إضافة قسم جديد
document.getElementById('sectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const sectionName = document.getElementById('sectionName').value;

    if (!sectionName) {
        alert('يرجى إدخال اسم القسم.');
        return;
    }

    const section = {
        id: Date.now(),
        name: sectionName
    };

    try {
        await addSectionToDB(section);
        await updateSectionsGrid();
        document.getElementById('sectionName').value = '';
    } catch (error) {
        console.error('حدث خطأ أثناء إضافة القسم:', error);
        alert('حدث خطأ أثناء إضافة القسم. يرجى المحاولة مرة أخرى.');
    }
});

// التحميل الأولي للأقسام
(async () => {
    await updateSectionsGrid();
})();