document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (movieId) {
        loadMovieDetails(movieId);
    } else {
        console.error('لم يتم العثور على معرف الفيلم.');
    }

    // إضافة تأثير السحب (مرة واحدة فقط)
    let isScrolled = false; // متغير لتتبع حالة التمرير
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50 && !isScrolled) { // بدء الظهور عند السحب قليلاً
            document.body.classList.add('scrolled');
            isScrolled = true; // منع التكرار
        }
    });
});

const loadMovieDetails = async (id) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.get(parseInt(id));

    request.onsuccess = () => {
        const movie = request.result;
        if (movie) {
            document.getElementById('bannerPoster').style.backgroundImage = `url('${movie.posterLandscapeUrl}')`;
            document.getElementById('verticalPoster').style.backgroundImage = `url('${movie.posterPortraitUrl}')`;
            document.getElementById('movieTitle').textContent = movie.title;
            document.getElementById('movieDescription').textContent = movie.description;
            document.getElementById('movieYear').textContent = `السنة: ${movie.year}`;
            document.getElementById('movieRating').textContent = `التقييم: ${movie.rating}/10`;
            document.getElementById('movieCategories').textContent = `التصنيفات: ${movie.categories.join(', ')}`;
            document.getElementById('videoSource').src = movie.videoUrl;

            const player = new Plyr('#player', {
                controls: [
                    'play',
                    'progress',
                    'current-time',
                    'duration',
                    'mute',
                    'volume',
                    'captions',
                    'settings',
                    'pip',
                    'fullscreen',
                ],
                settings: ['quality', 'speed'],
                quality: {
                    default: 1080,
                    options: [1080],
                },
                speed: {
                    selected: 1,
                    options: [0.5, 0.75, 1, 1.25, 1.5, 2],
                },
            });
        }
    };

    request.onerror = () => {
        console.error('حدث خطأ أثناء جلب بيانات الفيلم.');
    };
};

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 3);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};