document.addEventListener("DOMContentLoaded", () => {
            const subtitle = document.getElementById("page-subtitle");
            const surahSelect = document.getElementById("surah-select");
            const aboutCard = document.getElementById("about-card");
            const sectionHeading = document.getElementById("section-heading");
            const ayahList = document.getElementById("ayah-list");
            const lessonsCard = document.getElementById("lessons-card");

            const audioBase = "https://everyayah.com/data/Minshawy_Teacher_128kbps/";
            let currentAudio = null;
            let currentButton = null;
            let currentSurahKey = surahSelect.value;

            function pad3(number) {
                return String(number).padStart(3, "0");
            }

            function toArabicDigits(number) {
                const digits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
                return String(number).replace(/\d/g, (digit) => digits[Number(digit)]);
            }

            function resetButton(button) {
                if (!button) {
                    return;
                }

                button.classList.remove("playing");
                button.innerHTML = `<span>🔊</span> ${button.dataset.defaultLabel}`;
            }

            function stopCurrentAudio() {
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                    currentAudio = null;
                }

                if (currentButton) {
                    resetButton(currentButton);
                    currentButton = null;
                }
            }

            function buildWordList(words) {
                if (!words || !words.length) {
                    return "";
                }

                const items = words
                    .map((word) => `<li><span class="word-ar">${word.arabic}</span> = ${word.meaning}</li>`)
                    .join("");

                return `
                    <div class="study-box">
                        <p class="study-title">Word by Word</p>
                        <ul class="word-list">${items}</ul>
                    </div>
                `;
            }

            function renderAbout(surah) {
                const aboutItems = surah.about.items
                    .map((item) => `<li><strong>${item.label}:</strong> ${item.value}</li>`)
                    .join("");

                aboutCard.innerHTML = `
                    <h2 class="about-title">${surah.about.title}</h2>
                    <ul class="about-list">${aboutItems}</ul>
                    <p class="summary">${surah.about.summary}</p>
                `;
            }

            function renderLessons(surah) {
                if (!surah.lessons || !surah.lessons.length) {
                    lessonsCard.hidden = true;
                    lessonsCard.innerHTML = "";
                    return;
                }

                const items = surah.lessons.map((lesson) => `<li>${lesson}</li>`).join("");
                lessonsCard.hidden = false;
                lessonsCard.innerHTML = `
                    <h2 class="lessons-title">Lessons from the Surah</h2>
                    <ol class="lessons-list">${items}</ol>
                `;
            }

            function renderVerses(surah) {
                ayahList.innerHTML = surah.verses
                    .map((verse) => `
                        <div class="card verse-card">
                            <div class="badge">${verse.number}</div>
                            <div class="arabic">${verse.arabic}</div>
                            ${buildWordList(verse.words)}
                            <div class="english"><span class="emoji">${verse.emoji}</span>${verse.meaning}</div>
                            <button class="play-btn" data-default-label="Play Ayah" onclick="playAyah(${verse.number}, this)"><span>🔊</span> Play Ayah</button>
                        </div>
                    `)
                    .join("");
            }

            function renderSurah(surahKey) {
                const surah = surahData[surahKey];

                stopCurrentAudio();
                currentSurahKey = surahKey;
                const pageNumber = currentSurahKey === "takweer" ? 586 : 587;
                document.getElementById("dynamic-font-style").textContent = `
                    @font-face {
                        font-family: "PageFont";
                        src: url("https://cdn.jsdelivr.net/gh/quran/quran.com-frontend-next@master/public/fonts/quran/hafs/v4/ot-svg/light/woff2/p${pageNumber}.woff2") format("woff2");
                        font-weight: normal;
                        font-style: normal;
                        font-display: swap;
                    }
                `;
                document.title = `${surah.title} for Ibrahim`;
                subtitle.textContent = `Memorization with Ibrahim: ${surah.title}`;
                sectionHeading.textContent = surah.sectionHeading;

                renderAbout(surah);
                renderVerses(surah);
                renderLessons(surah);
            }

            window.playAyah = function(ayahNumber, buttonElement) {
                const currentSurah = surahData[currentSurahKey];
                const audioUrl = ayahNumber === 0
                    ? `${audioBase}001001.mp3`
                    : `${audioBase}${pad3(currentSurah.number)}${pad3(ayahNumber)}.mp3`;

                if (currentButton === buttonElement && buttonElement.classList.contains("playing")) {
                    stopCurrentAudio();
                    return;
                }

                if (currentButton && currentButton !== buttonElement) {
                    resetButton(currentButton);
                }

                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }

                currentAudio = new Audio(audioUrl);
                currentButton = buttonElement;
                currentButton.classList.add("playing");
                currentButton.innerHTML = "<span>⏸️</span> Stop Audio";

                currentAudio.onerror = function() {
                    alert("Oops! Could not load the audio. Please check your internet connection.");
                    stopCurrentAudio();
                };

                currentAudio.onended = function() {
                    stopCurrentAudio();
                };

                currentAudio.play().catch((error) => {
                    console.log("Audio play blocked by browser:", error);
                });
            };

            surahSelect.addEventListener("change", (event) => {
                renderSurah(event.target.value);
            });

            renderSurah(currentSurahKey);
        });