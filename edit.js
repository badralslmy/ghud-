// فتح قاعدة بيانات IndexedDB
const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 3); // الإصدار 3

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('content')) {
                db.createObjectStore('content', { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// استرجاع جميع المحتويات من IndexedDB
const getAllContentFromDB = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readonly');
        const store = transaction.objectStore('content');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// تحديد حالة الاكتمال
const getCompletionStatus = (content) => {
    if (content.videoUrl && content.subtitleUrl) {
        return "مكتمل";
    } else if (!content.videoUrl && !content.subtitleUrl) {
        return "غير مكتمل";
    } else {
        return "مكتمل جزئيا";
    }
};

// تحديث عرض المحتوى
const updateContentGrid = async (filter = 'all', searchQuery = '', completionFilter = 'all', statusFilter = 'all') => {
    try {
        const content = await getAllContentFromDB();
        const contentGrid = document.getElementById('contentGrid');

        let filteredContent = content;
        if (filter !== 'all') {
            filteredContent = content.filter(item => item.type === filter);
        }

        if (searchQuery) {
            filteredContent = filteredContent.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (completionFilter !== 'all') {
            filteredContent = filteredContent.filter(item => getCompletionStatus(item) === completionFilter);
        }

        if (statusFilter !== 'all') {
            filteredContent = filteredContent.filter(item => item.status === statusFilter);
        }

        contentGrid.innerHTML = filteredContent.map(item => `
            <div class="content-item">
                <img src="${item.posterPortraitUrl}" alt="${item.title}" class="content-poster">
                <div class="content-info">
                    <h3 class="content-title">${item.title}</h3>
                    <div class="content-actions">
                        <button class="edit-btn" onclick="editContent(${item.id})"><i class="fas fa-edit"></i> تعديل</button>
                        <button class="delete-btn" onclick="confirmDelete(${item.id})"><i class="fas fa-trash"></i> حذف</button>
                        <select class="status-select" onchange="changeStatus(${item.id}, this.value)">
                            <option value="تم نشره" ${item.status === 'تم نشره' ? 'selected' : ''}>تم نشره</option>
                            <option value="لم يتم نشره" ${item.status === 'لم يتم نشره' ? 'selected' : ''}>لم يتم نشره</option>
                            <option value="معلق" ${item.status === 'معلق' ? 'selected' : ''}>معلق</option>
                            <option value="مرفوض" ${item.status === 'مرفوض' ? 'selected' : ''}>مرفوض</option>
                        </select>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء عرض المحتوى:', error);
    }
};

// تأكيد الحذف
const confirmDelete = (id) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا المحتوى؟')) {
        deleteContent(id);
    }
};

// حذف محتوى
const deleteContent = async (id) => {
    try {
        const db = await openDB();
        const transaction = db.transaction('content', 'readwrite');
        const store = transaction.objectStore('content');
        store.delete(id);
        await updateContentGrid();
        alert('تم حذف المحتوى بنجاح!');
    } catch (error) {
        console.error('حدث خطأ أثناء الحذف:', error);
    }
};

// تحميل المحتوى المراد تعديله عند التحميل
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');
if (editId) {
    loadContentForEdit(parseInt(editId));
}

// تحميل المحتوى المراد تعديله
const loadContentForEdit = async (id) => {
    try {
        const content = await getAllContentFromDB();
        const selectedContent = content.find(item => item.id === id);

        if (selectedContent) {
            window.location.href = `add.html?edit=${selectedContent.id}`;
        }
    } catch (error) {
        console.error('حدث خطأ أثناء تحميل المحتوى:', error);
    }
};

// تغيير حالة العمل
const changeStatus = async (id, newStatus) => {
    try {
        const content = await getAllContentFromDB();
        const selectedContent = content.find(item => item.id === id);

        if (selectedContent) {
            selectedContent.status = newStatus;
            await updateContentInDB(selectedContent);
            await updateContentGrid();
            alert('تم تغيير الحالة بنجاح!');
        }
    } catch (error) {
        console.error('حدث خطأ أثناء تغيير الحالة:', error);
    }
};

// تحديث محتوى في IndexedDB
const updateContentInDB = async (content) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('content', 'readwrite');
        const store = transaction.objectStore('content');
        const request = store.put(content);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

// تفعيل الفلترة
document.getElementById('typeFilter').addEventListener('change', () => {
    const filter = document.getElementById('typeFilter').value;
    updateContentGrid(filter);
});

// تفعيل البحث
document.getElementById('searchInput').addEventListener('input', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateContentGrid('all', searchQuery);
});

// تفعيل فلترة الاكتمال
document.getElementById('completionFilter').addEventListener('change', () => {
    const completionFilter = document.getElementById('completionFilter').value;
    updateContentGrid('all', '', completionFilter);
});

// تفعيل فلترة الحالة
document.getElementById('statusFilter').addEventListener('change', () => {
    const statusFilter = document.getElementById('statusFilter').value;
    updateContentGrid('all', '', 'all', statusFilter);
});

// التحميل الأولي للمحتوى
(async () => {
    await updateContentGrid();
})();

// وظيفة تعديل المحتوى
const editContent = (id) => {
    window.location.href = `add.html?edit=${id}`;
};