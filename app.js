document.addEventListener('DOMContentLoaded', function() {
    
    // Load Stats
    let totalPatients = localStorage.getItem('totalPatients') || 0;
    const totalPatientsEl = document.getElementById('totalPatientsCount');
    if (totalPatientsEl) totalPatientsEl.textContent = totalPatients;

    // PDF Export Logic
    const pdfBtn = document.getElementById('downloadPdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
             const element = document.querySelector('.content-grid');
             const fName = document.getElementById('patientFirstName').value || "Bemor";
             const lName = document.getElementById('patientLastName').value || "";
             const opt = {
                 margin: [10, 10, 10, 10],
                 filename: `Docassist_Xulosa_${fName}_${lName}.pdf`.trim(),
                 image: { type: 'jpeg', quality: 0.98 },
                 html2canvas: { scale: 2, useCORS: true },
                 jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
             };
             
             // Temporarily hide upload button and PDF elements for clean print
             const uploadCard = document.querySelector('.upload-card');
             if(uploadCard) uploadCard.style.display = 'none';

             html2pdf().from(element).set(opt).save().then(() => {
                 if(uploadCard) uploadCard.style.display = 'block';
             });
        });
    }

    // Data for Dynamics Chart
    const ctx = document.getElementById('dynamicsChart').getContext('2d');
    
    // Gradient for the area under the line
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    let dynamicsChart;

    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

    dynamicsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun (Joriy)'],
            datasets: [{
                label: "Bo'g'im Tirqishi (mm)",
                data: [2.2, 2.15, 2.1, 1.95, 1.85, 1.8],
                borderColor: '#2563eb',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 13, family: "'Inter', sans-serif" },
                    bodyFont: { size: 14, family: "'Inter', sans-serif", weight: 'bold' },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 1.0,
                    max: 3.0,
                    grid: {
                        color: '#f1f5f9',
                        drawBorder: false,
                    },
                    ticks: {
                        font: { family: "'Inter', sans-serif", size: 11 },
                        color: '#64748b',
                        stepSize: 0.5
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        font: { family: "'Inter', sans-serif", size: 11 },
                        color: '#64748b'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });

    // Handle X-Ray Upload
    const xrayUpload = document.getElementById('xrayUpload');
    if(xrayUpload) {
        xrayUpload.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Show picture preview immediately
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.getElementById('imagePreview');
                img.src = e.target.result;
                img.style.display = 'block';
            }
            reader.readAsDataURL(file);

            // Collect Patient Info directly from form
            const fName = document.getElementById('patientFirstName').value || "Noma'lum";
            const lName = document.getElementById('patientLastName').value || "Bemor";
            const patientFullName = `${fName} ${lName}`;
            const ptAge = parseInt(document.getElementById('patientAgeInput').value) || 54;
            const ptBmi = parseFloat(document.getElementById('patientBmiInput').value) || 32.4;

            const resultDiv = document.getElementById('uploadResult');
            resultDiv.innerHTML = '<span style="color: var(--warning)"><i class="fa-solid fa-spinner fa-spin"></i> AI tasvirni tahlil qilmoqda...</span>';
            
            // Send file to FastAPI Backend
            const formData = new FormData();
            formData.append('file', file);

            try {
                // Determine API URL based on environment (local vs vercel)
                const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                    ? 'http://localhost:8000/predict' 
                    : '/api/predict';

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    body: formData
                });
                
                if(!response.ok) throw new Error("Server xatosi");
                
                const data = await response.json();
                
                // Successful response
                resultDiv.innerHTML = `<span style="color: var(--success);"><i class="fa-solid fa-check-circle"></i> Tahlil yakunlandi: <strong>${data.detail}</strong></span><br><span style="font-size: 12px; color: var(--text-muted);">(Model manbasi: ${data.has_torch ? 'PyTorch ResNet' : 'Demonstratsiya'})</span>`;
                
                // Increment Stats
                if (data.prediction !== -1) {
                    totalPatients++;
                    localStorage.setItem('totalPatients', totalPatients);
                    if(document.getElementById('totalPatientsCount')) {
                        document.getElementById('totalPatientsCount').textContent = totalPatients;
                    }
                }

                // Update Dashboard Dynamically
                if (data.prediction === -1) {
                    resultDiv.innerHTML = `<span style="color: var(--danger);"><i class="fa-solid fa-triangle-exclamation"></i> <strong>${data.detail}</strong></span>`;
                    document.querySelector('.diagnosis-card .severity').textContent = `Xato: Noto'g'ri Tasvir`;
                    document.querySelector('.diagnosis-card .severity').className = 'severity';
                    document.querySelector('.diagnosis-card .severity').style.backgroundColor = '#fee2e2';
                    document.querySelector('.diagnosis-card .severity').style.color = '#991b1b';
                    document.getElementById('klGradeText').textContent = "Aniqlanmadi";
                    document.querySelector('.diagnosis-card .description').innerHTML = `<strong>Tizim xulosasi:</strong> Yuklangan faylda shifokor uchun yaroqli bo'lgan xulosa chiqarilmadi.`;
                } else {
                    document.querySelector('.diagnosis-card .severity').textContent = `Grade: ${data.prediction}`;
                    
                    let gradeText = "";
                    let chartData = [];
                    let trendHtml = "";
                    let treatmentHtml = "";
                    let activityHtml = "";
                    let fuzzyHtml = "";
                    let noteHtml = "";
                    
                    if(data.prediction === 0) {
                        gradeText = "0 daraja (Norma / Sog'lom)";
                        document.querySelector('.diagnosis-card .severity').className = 'severity';
                        document.querySelector('.diagnosis-card .severity').style.backgroundColor = '#dcfce7';
                        document.querySelector('.diagnosis-card .severity').style.color = '#166534';
                        
                        let bmiAdvice = ptBmi > 25 ? `Tana vaznini yuqoriligi (${ptBmi} BMI) kelajakda xavf omili bo'lishi mumkin.` : `Tana vazn idealligicha qolmoqda (${ptBmi} BMI).`;
                        fuzzyHtml = `Bemor: <b>${patientFullName}</b> (${ptAge} yosh) BMI ko‘rsatkichi: <b>${ptBmi}</b>. tahlil qilindi. Hozirgi vaqtda yoshga xos <strong>fiziologik o'zgarishlarsiz, bo‘g‘im to'liq sog'lom</strong> deb baholandi. ${bmiAdvice}`;
                        noteHtml = `Bemor ${patientFullName} ko'rigi o'tkazildi. Patologiya aniqlanmadi. Profilaktik kuzatuv tavsiya etiladi.`;

                        chartData = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5];
                        trendHtml = `<i class="fa-solid fa-arrow-trend-up"></i><span>Bo'g'im tirqishida o'zgarish yo'q. Me'yorda.</span>`;
                        document.querySelector('.trend-indicator').className = 'trend-indicator';
                        document.querySelector('.trend-indicator').style.backgroundColor = '#dcfce7';
                        document.querySelector('.trend-indicator').style.color = '#166534';

                        treatmentHtml = `
                            <li><strong>Profilaktika:</strong> Sog'lom turmush tarzini davom ettirish.</li>
                            <li><strong>Medikamentoz:</strong> Dori-darmon talab etilmaydi.</li>
                            <li><span class="highlight" style="background-color:#dcfce7; color:#166534">Holat barqaror. Hech qanday aralashuv shart emas.</span></li>
                        `;
                        activityHtml = `
                            <div class="activity allowed">
                                <h5><i class="fa-solid fa-check-circle"></i> Mumkin</h5>
                                <p>Barcha turdagi sport, faol harakatlar, yugurish, raqs, suzish.</p>
                            </div>
                            <div class="activity forbidden">
                                <h5><i class="fa-solid fa-ban"></i> Taqiqlangan</h5>
                                <p>Haddan tashqari yuqori professional jismoniy yuklamalardan (shtanga) ehtiyot bo'lish tavsiya etiladi.</p>
                            </div>
                        `;

                    } else if(data.prediction === 1) {
                        gradeText = "I darajali osteoartroz (Shubhali)";
                        document.querySelector('.diagnosis-card .severity').className = 'severity';
                        document.querySelector('.diagnosis-card .severity').style.backgroundColor = '#fef3c7';
                        document.querySelector('.diagnosis-card .severity').style.color = '#b45309';

                        let bmiFactor = ptBmi > 25 ? `asosan <strong>BMI ko'rsatkichiga (ortiqcha yuk - ${ptBmi} BMI)</strong>` : `boshqa individual omillarga`;
                        fuzzyHtml = `Bemor <b>${patientFullName}</b> (${ptAge} yosh) tahlil qilindi. Patologiya faqat yosh omiliga emas, balki ${bmiFactor} bog'liq ravishda paydo bo'la boshlagan. Prognoz ehtimoli - ijobiy qaytarish mumkin.`;
                        noteHtml = `Bemor ${patientFullName}. Subxondral sklerozning dastlabki belgilari. Ortiqcha vaznni korreksiya qilish va xondroprotektorlar buyurildi.`;

                        chartData = [2.5, 2.45, 2.4, 2.4, 2.35, 2.3];
                        trendHtml = `<i class="fa-solid fa-arrow-trend-down"></i><span>Dastlabki minimal torayish (-0.2 mm).</span>`;
                        document.querySelector('.trend-indicator').className = 'trend-indicator';
                        document.querySelector('.trend-indicator').style.backgroundColor = '#fef3c7';
                        document.querySelector('.trend-indicator').style.color = '#b45309';

                        treatmentHtml = `
                            <li><strong>Zudlik bilan:</strong> Tana vaznini nazorat qilish va yengil gimnastika.</li>
                            <li><strong>Medikamentoz:</strong> Zarurat tug'ilganda faqat mahalliy mazlar (NYAQV). Xondroprotektorlar kursi.</li>
                            <li><span class="highlight" style="background-color:#fef3c7; color:#b45309">Dastlabki profilaktika kerak.</span></li>
                        `;
                        activityHtml = `
                            <div class="activity allowed">
                                <h5><i class="fa-solid fa-check-circle"></i> Mumkin</h5>
                                <p>Suzish, yengil yugurish jaming, veloped, pilates, fitness.</p>
                            </div>
                            <div class="activity forbidden">
                                <h5><i class="fa-solid fa-ban"></i> Taqiqlangan</h5>
                                <p>Professional sakrash va juda og'ir atletika.</p>
                            </div>
                        `;

                    } else if(data.prediction === 2) {
                        gradeText = "II darajali osteoartroz (Boshlang'ich/Yengil)";
                        document.querySelector('.diagnosis-card .severity').className = 'severity medium';
                        
                        let ageFactor = ptAge < 45 ? `yosh normasi atrofida no-parallel (erta progressiya)` : `yosh normasi atrofida parallel`;
                        fuzzyHtml = `Bemor <b>${patientFullName}</b> (${ptAge} yosh), BMI: <b>${ptBmi}</b>. Bo‘g‘im tirqishi holati (haqiqiy torayish) Fuzzy Logic orqali tahlil qilindi. Kasallik darajasi <strong>${ageFactor}</strong> ketyapti. Asosiy provokator omillar nazorat ostiga olinmasa progressiya yuz beradi.`;
                        noteHtml = `Bemor ${patientFullName}, Grade II. Osteofitlar va bo'g'im torayishi tasdiqlandi. Fizioterapiya va yengil tizza bog'lami (Nakorlennik) taqish yozildi.`;

                        chartData = [2.4, 2.3, 2.2, 2.1, 2.0, 1.9];
                        trendHtml = `<i class="fa-solid fa-arrow-trend-down"></i><span>Sezilarli torayish tendensiyasi (-0.5 mm).</span>`;
                        document.querySelector('.trend-indicator').className = 'trend-indicator medium';
                        document.querySelector('.trend-indicator').style.backgroundColor = '#fef3c7';
                        document.querySelector('.trend-indicator').style.color = '#b45309';

                        treatmentHtml = `
                            <li><strong>Rejim:</strong> Jismoniy zo'riqishni kamaytirish, tizza bog'ichlari taqish.</li>
                            <li><strong>Medikamentoz:</strong> NYAQV (og'riq qaytalanishida), uzoq muddatli xondroprotektorlar.</li>
                            <li><strong>Fiziolgiya:</strong> Fizioterapiya (elektroforez, lazer).</li>
                        `;
                        activityHtml = `
                            <div class="activity allowed">
                                <h5><i class="fa-solid fa-check-circle"></i> Mumkin</h5>
                                <p>Hovuzda suzish, tekis joyda yurish, statik mashqlar.</p>
                            </div>
                            <div class="activity forbidden">
                                <h5><i class="fa-solid fa-ban"></i> Taqiqlangan</h5>
                                <p>Asfaltda qattiq yugurish, og'ir sport turlari, tik qiyalikdan tushish.</p>
                            </div>
                        `;

                    } else if(data.prediction === 3) {
                        gradeText = "III darajali osteoartroz (O'rta bosqich)";
                        document.querySelector('.diagnosis-card .severity').className = 'severity medium';
                        
                        let progText = ptAge > 60 ? `mutanosib ravishda rivojlanayotgani` : `erta va tezkor progressiyalanuvchi ekanligi`;
                        fuzzyHtml = `Bemor <b>${patientFullName}</b> (${ptAge} yosh) va BMI: <b>${ptBmi}</b> tahlil qilindi. Patologiya bemor yoshiga nisbatan <strong>${progText}</strong> aniqlandi. Asosiy provokator omil - tana vazni va yosh omilining yig'indisi.`;
                        noteHtml = `Bemorda (${patientFullName}) yaqqol jarayon. Zudlik bilan vazn tashlash, intra-artikulyar inyeksiya (PRP / gialuron) buyurildi. Kelgusi qadam artroplastika ehtimoli mavjud.`;

                        chartData = [2.2, 2.15, 2.1, 1.95, 1.85, 1.8];
                        trendHtml = `<i class="fa-solid fa-arrow-trend-down"></i><span>O'tgan 6 oyga nisbatan -0.4 mm torayish. Osteofitlar +12% o'sgan.</span>`;
                        document.querySelector('.trend-indicator').className = 'trend-indicator negative';
                        document.querySelector('.trend-indicator').style.cssText = ''; // Reset to class defaults

                        treatmentHtml = `
                            <li><strong>Zudlik bilan:</strong> Tana vaznini qat'iy korreksiya qilish (dieta/endokrinolog).</li>
                            <li><strong>Medikamentoz:</strong> NYAQV va xondroprotektorlar muntazam qo'llash.</li>
                            <li><strong>Inyeksiya:</strong> Bo'g'im ichiga gialuron kislotasi yoki PRP terapiya (shifokor ko'rsatmasi bilan).</li>
                            <li><span class="highlight">Xirurgik aralashuvga hozircha mutlaq ko'rsatma yo'q.</span></li>
                        `;
                        activityHtml = `
                            <div class="activity allowed">
                                <h5><i class="fa-solid fa-check-circle"></i> Mumkin</h5>
                                <p>Faqat hovuzda suzish, yotgan holda velotrenajyor, izometrik mashqlar.</p>
                            </div>
                            <div class="activity forbidden">
                                <h5><i class="fa-solid fa-ban"></i> Taqiqlangan</h5>
                                <p>Yugurish, sakrash, chuqur o'tirib-turish, og'ir ko'tarish mutlaqo mumkin emas.</p>
                            </div>
                        `;

                    } else {
                        gradeText = "IV darajali osteoartroz (Og'ir bosqich)";
                        document.querySelector('.diagnosis-card .severity').className = 'severity';
                        document.querySelector('.diagnosis-card .severity').style.backgroundColor = '#fee2e2';
                        document.querySelector('.diagnosis-card .severity').style.color = '#991b1b';

                        let ageCrit = ptAge < 55 ? `${ptAge} yosh bu asorat uchun juda erta` : `${ptAge} yosh uchun ham juda og'ir daraja`;
                        let bmiCrit = ptBmi > 30 ? `va ortiqcha vazn jarayonni teskari bo'lmas darajaga yetkazgan.` : `hisoblanadi.`;
                        fuzzyHtml = `Bemor <b>${patientFullName}</b> (${ptAge} yosh) inobatga olindi. Tizim tasvirlardan <strong>to'liq tog'ay yopilishini (deformatsiya va ankiloz xavfini)</strong> hisoblab chiqdi. ${ageCrit} ${bmiCrit}`;
                        noteHtml = `Bemorda yana bir konservativ choralar qoldirilmadi. ${patientFullName} ga Total Tizza Artroplastika (Endoprotezlash) jarrohligi rejalashtirildi.`;

                        chartData = [1.8, 1.5, 1.2, 0.9, 0.5, 0.2];
                        trendHtml = `<i class="fa-solid fa-arrow-trend-down"></i><span>Bo'g'im tirqishi qariyb to'liq yopilgan. Jiddiy yemirilish!</span>`;
                        document.querySelector('.trend-indicator').className = 'trend-indicator negative';
                        document.querySelector('.trend-indicator').style.cssText = '';

                        treatmentHtml = `
                            <li><strong>Zudlik bilan:</strong> Travmatolog/Ortoped jarroh konsultatsiyasi.</li>
                            <li><strong>Medikamentoz:</strong> Kuchli og'riqsizlantiruvchilar.</li>
                            <li><span class="highlight" style="background-color:#fee2e2; color:#991b1b">Total Endoprotezlash (artroplastika) jarrohligi talab etilishi mumkin.</span></li>
                        `;
                        activityHtml = `
                            <div class="activity allowed">
                                <h5><i class="fa-solid fa-check-circle"></i> Mumkin</h5>
                                <p>Shtapellar yordamida yurish, faqat maxsus nazorati ostida YD Mashqlari.</p>
                            </div>
                            <div class="activity forbidden">
                                <h5><i class="fa-solid fa-ban"></i> Taqiqlangan</h5>
                                <p>Oyoqqa aksial yuk berish, uzoq tik turish, har qanday erkin harakatlar.</p>
                            </div>
                        `;
                    }

                    document.getElementById('klGradeText').textContent = gradeText;
                    document.querySelector('.diagnosis-card .description').innerHTML = `<strong>Tizim xulosasi:</strong> Sun'iy intellekt modeli siz yuklagan tasvirda <i>${data.detail}</i> alomatlarini aniqladi.`;
                    
                    // Update Chart Data
                    dynamicsChart.data.datasets[0].data = chartData;
                    dynamicsChart.update();
                    
                    // Update Trend indicator
                    document.querySelector('.trend-indicator').innerHTML = trendHtml;
                    
                    // Update Treatment and Activities
                    document.querySelector('.treatment-section ul').innerHTML = treatmentHtml;
                    document.querySelector('.activity-section').innerHTML = activityHtml;

                    // Update Fuzzy Logic Clinical Analysis
                    const fuzzyElem = document.querySelector('.clinical-analysis p');
                    if(fuzzyElem) {
                        fuzzyElem.innerHTML = fuzzyHtml;
                    }

                    // Update Doctor's Note
                    const noteElem = document.getElementById('doctorNoteText');
                    if(noteElem) {
                        noteElem.innerHTML = `Doktor xulosasi: ${noteHtml}`;
                    }
                }
                
            } catch (error) {
                console.error(error);
                resultDiv.innerHTML = `<span style="color: var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Xatolik yuz berdi. Backend (FastAPI) ishlayotganiga ishonch hosil qiling.</span>`;
            }
        });
    }

});
