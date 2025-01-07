document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');

    if (seriesId) {
        loadSeriesDetails(seriesId);
    } else {
        console.error('لم يتم العثور على معرف المسلسل.');
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

const loadSeriesDetails = async (id) => {
    const db = await openDB();
    const transaction = db.transaction('content', 'readonly');
    const store = transaction.objectStore('content');
    const request = store.get(parseInt(id));

    request.onsuccess = () => {
        const series = request.result;
        if (series) {
            document.getElementById('bannerPoster').style.backgroundImage = `url('${series.posterLandscapeUrl}')`;
            document.getElementById('verticalPoster').style.backgroundImage = `url('${series.posterPortraitUrl}')`;
            document.getElementById('seriesTitle').textContent = series.title;
            document.getElementById('seriesDescription').textContent = series.description;
            document.getElementById('seriesYear').textContent = `السنة: ${series.year}`;
            document.getElementById('seriesRating').textContent = `التقييم: ${series.rating}/10`;
            document.getElementById('seriesCategories').textContent = `التصنيفات: ${series.categories.join(', ')}`;

            // عرض المواسم والحلقات
            displaySeasons(series.seasons);
        }
    };

    request.onerror = () => {
        console.error('حدث خطأ أثناء جلب بيانات المسلسل.');
    };
};

const displaySeasons = (seasons) => {
    const seasonsSection = document.getElementById('seasonsSection');
    seasonsSection.innerHTML = seasons.map(season => `
        <div class="season">
            <h2>الموسم ${season.number}</h2>
            <div class="episodes">
                ${season.episodes.map(episode => `
                    <div class="episode" onclick="playEpisode('${episode.videoUrl}')">
                        <h3>${episode.title}</h3>
                        <p>${episode.duration}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
};

const playEpisode = (videoUrl) => {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    videoSource.src = videoUrl;
    videoPlayer.style.display = 'block';

    // إخفاء قائمة المواسم والحلقات
    document.getElementById('seasonsSection').style.display = 'none';

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
};

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ContentDatabase', 3);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};