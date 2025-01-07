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

// تحديث عرض الملفات
const updateFilesTable = async (searchQuery = '', showMissingOnly = false) => {
    try {
        const content = await getAllContentFromDB();
        const filesTableBody = document.querySelector('#filesTable tbody');

        let filteredContent = content;
        if (searchQuery) {
            filteredContent = content.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toString().includes(searchQuery)
            );
        }

        if (showMissingOnly) {
            filteredContent = filteredContent.filter(item => !item.videoUrl || !item.subtitleUrl);
        }

        filesTableBody.innerHTML = filteredContent.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${item.title}</td>
                <td>
                    ${item.videoUrl ? `<a href="${item.videoUrl}" class="file-link" target="_blank">رابط الفيديو</a>` : '<span class="error">غير مرفق</span>'}
                </td>
                <td>
                    ${item.subtitleUrl ? `<a href="${item.subtitleUrl}" class="file-link" target="_blank">رابط الترجمة</a>` : '<span class="error">غير مرفق</span>'}
                </td>
                <td>
                    <button class="attach-btn" onclick="attachFile(${item.id}, 'video')">إرفاق فيديو</button>
                    <button class="attach-btn" onclick="attachFile(${item.id}, 'subtitle')">إرفاق ترجمة</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('حدث خطأ أثناء تحديث الجدول:', error);
    }
};

// إرفاق رابط (فيديو أو ترجمة)
const attachFile = async (id, type) => {
    try {
        const link = prompt(`أدخل رابط ${type === 'video' ? 'الفيديو' : 'الترجمة'}:`);
        if (link) {
            const content = await getAllContentFromDB();
            const selectedContent = content.find(item => item.id === id);

            if (selectedContent) {
                if (type === 'video') {
                    selectedContent.videoUrl = link;
                } else {
                    selectedContent.subtitleUrl = link;
                }

                await updateContentInDB(selectedContent);
                await updateFilesTable();
                alert(`تم إرفاق ${type === 'video' ? 'رابط الفيديو' : 'رابط الترجمة'} بنجاح!`);
            }
        }
    } catch (error) {
        console.error('حدث خطأ أثناء الإرفاق:', error);
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

// تفعيل البحث
document.getElementById('searchInput').addEventListener('input', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateFilesTable(searchQuery);
});

// تفعيل زر إظهار الأعمال غير المكتملة
document.getElementById('filterMissingFiles').addEventListener('click', () => {
    const searchQuery = document.getElementById('searchInput').value;
    updateFilesTable(searchQuery, true);
});

// التحميل الأولي للملفات
(async () => {
    await updateFilesTable();
})();