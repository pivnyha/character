class CharacterEditor {
    constructor() {
        this.characteristics = {
            'Сила': 0,
            'Удача': 0,
            'Внимательность': 0,
            'Ловкость': 0,
            'Харизма': 0
        };

        this.allSkills = {
            'Стрельба': { value: 0, desc: '+1 на атаки дальнего боя', category: 'combat' },
            'Ближний бой': { value: 0, desc: '+1 на атаки в рукопашном бою', category: 'combat' },
            'Фехтование': { value: 0, desc: '+1 на атаки с оружием ближнего боя', category: 'combat' },
            'Скрытность': { value: 0, desc: '+1 к броску на скрытное перемещение', category: 'combat' },
            'Тяжелое оружие': { value: 0, desc: '+1 к броску: ракетницы, гранатометы и тп', category: 'combat' },
            'Взлом': { value: 0, desc: '+1 к броску на взлом', category: 'specialization' },
            'Создание': { value: 0, desc: '+1 к броску на создание предметов', category: 'specialization' },
            'Ремонт': { value: 0, desc: '+1 к броску на починку', category: 'specialization' },
            'Кража': { value: 0, desc: '+1 к броску на воровство', category: 'specialization' },
            'Медицина': { value: 0, desc: '+1 к броскам связанные с медициной', category: 'specialization' },
            'Диагностика': { value: 0, desc: '+1 на бросок связанный с поиском поломок, дефектов', category: 'specialization' },
            'Вождение': { value: 0, desc: '+1 к управлению наземным транспортом', category: 'specialization' },
            'Интеллект': { value: 0, desc: 'Дает создавать более совершенные предметы', category: 'specialization' }
        };

        // Выбранные навыки (максимум 4)
        this.selectedSkillsList = [];

        this.perks = {
            'Нежное обаяние': { selected: false, desc: 'Персонажи женского пола к вам более расположены...' },
            'Твердое слово': { selected: false, desc: 'Персонажи мужского пола к вам более расположены...' },
            'Плохая компания': { selected: false, desc: 'Преступники, контрабандисты и теневики видят в тебе своего.' },
            'Ответка': { selected: false, desc: 'Увернувшись от удара, получаешь +1 к следующей атаке против обидчика.' },
            'Крепкий орешек': { selected: false, desc: 'Ваш персонаж получает дополнительные 20ХП.' },
            'Мастер-торговец': { selected: false, desc: 'Ваш персонаж имеет больший шанс получить скидку и доп валюты при продаже.' },
            'Химик': { selected: false, desc: 'При употреблении препаратов или боевых стимуляторов его действия продляются на 1 ход.' },
            'Таинственный незнакомец': { selected: false, desc: 'Дает вам личного ангела-хранителя...' },
            'Грамотный подход': { selected: false, desc: 'Требуется меньше ресурсов на создание предметов' },
            'Ты видел это?!': { selected: false, desc: '35% шанс отвлечь противника, тыкнув пальцем куда-то туда' },
            'Голос за кадром': { selected: false, desc: 'ГМ может дать расплывчатую подсказку игроку' }
        };

        this.state = {
            points: 2,
            skillPoints: 3,
            selectedSkillsCount: 0,
            selectedPerks: 0,
            maxSkills: 4,
            maxPerks: 2
        };

        this.init();
    }

    init() {
        this.renderCharacteristics();
        this.renderAllSkills();
        this.renderSelectedSkills();
        this.renderPerks();
        this.updateUI();
        this.setupEventListeners();
        this.loadFromLocalStorage();
    }

    // ===== ХАРАКТЕРИСТИКИ =====
    renderCharacteristics() {
        const grid = document.getElementById('characteristicsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        Object.entries(this.characteristics).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <span class="stat-name">${name}</span>
                <div class="stat-controls">
                    <button class="char-dec-btn" data-stat="${name}">−</button>
                    <span class="stat-value ${value < 0 ? 'negative' : value > 0 ? 'positive' : ''}">${value}</span>
                    <button class="char-inc-btn" data-stat="${name}">+</button>
                </div>
            `;
            grid.appendChild(div);
        });
    }

    updateCharacteristic(name, delta) {
        const current = this.characteristics[name];
        const newValue = current + delta;
        if (newValue < -4 || newValue > 4) return;
        if (delta > 0 && this.state.points <= 0) {
            this.showMessage('Недостаточно очков!', 'error');
            return;
        }
        if (delta < 0) this.state.points += 1;
        else this.state.points -= 1;
        this.characteristics[name] = newValue;
        this.renderCharacteristics();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // ===== ВСЕ НАВЫКИ (для выбора) =====
    renderAllSkills() {
        const grid = document.getElementById('allSkillsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        // Группируем по категориям
        const combatSkills = [];
        const specSkills = [];

        Object.entries(this.allSkills).forEach(([name, data]) => {
            const isSelected = this.selectedSkillsList.includes(name);
            if (data.category === 'combat') {
                combatSkills.push({ name, data, isSelected });
            } else {
                specSkills.push({ name, data, isSelected });
            }
        });

        // Создаем секции
        const createSection = (title, skills) => {
            const section = document.createElement('div');
            section.className = 'skill-category';
            section.innerHTML = `
                <div class="category-header">
                    <span class="category-icon">${title === 'БОЕВЫЕ' ? '⚔' : '🔧'}</span>
                    <span class="category-title">${title}</span>
                    <span class="category-line"></span>
                </div>
                <div class="stats-grid">
                    ${skills.map(({ name, data, isSelected }) => `
                        <div class="stat-item skill-select-item ${isSelected ? 'selected-skill' : ''}" data-skill="${name}">
                            <span class="stat-name">${name}</span>
                            <span class="stat-desc">${data.desc}</span>
                            <button class="skill-select-btn" data-skill="${name}" ${isSelected ? 'disabled' : ''}>
                                ${isSelected ? '✓ ВЫБРАН' : '+'}
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
            return section;
        };

        grid.appendChild(createSection('БОЕВЫЕ', combatSkills));
        grid.appendChild(createSection('СПЕЦИАЛИЗАЦИЯ', specSkills));

        // Обработчики для кнопок выбора
        grid.querySelectorAll('.skill-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillName = btn.dataset.skill;
                this.toggleSkillSelection(skillName);
            });
        });
    }

    toggleSkillSelection(skillName) {
        const index = this.selectedSkillsList.indexOf(skillName);

        if (index > -1) {
            // Убираем навык
            this.selectedSkillsList.splice(index, 1);
            this.state.selectedSkillsCount--;
            // Возвращаем очки, если они были распределены
            const skillData = this.allSkills[skillName];
            if (skillData && skillData.value !== 0) {
                this.state.skillPoints += skillData.value;
                skillData.value = 0;
            }
        } else {
            // Добавляем навык
            if (this.state.selectedSkillsCount >= this.state.maxSkills) {
                this.showMessage('Максимум 4 навыка!', 'error');
                return;
            }
            this.selectedSkillsList.push(skillName);
            this.state.selectedSkillsCount++;
        }

        this.renderAllSkills();
        this.renderSelectedSkills();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // ===== ВЫБРАННЫЕ НАВЫКИ (с распределением) =====
    renderSelectedSkills() {
        const grid = document.getElementById('selectedSkillsGrid');
        if (!grid) return;

        if (this.selectedSkillsList.length === 0) {
            grid.innerHTML = '<div class="empty-message">Выберите навыки выше</div>';
            return;
        }

        grid.innerHTML = '';
        this.selectedSkillsList.forEach(skillName => {
            const data = this.allSkills[skillName];
            if (!data) return;

            const div = document.createElement('div');
            div.className = 'stat-item selected-skill-item';
            div.innerHTML = `
                <span class="stat-name">${skillName}</span>
                <span class="stat-desc">${data.desc}</span>
                <div class="stat-controls">
                    <button class="selected-skill-dec" data-skill="${skillName}">−</button>
                    <span class="stat-value ${data.value < 0 ? 'negative' : data.value > 0 ? 'positive' : ''}">${data.value}</span>
                    <button class="selected-skill-inc" data-skill="${skillName}">+</button>
                </div>
            `;
            grid.appendChild(div);
        });

        // Обработчики для + и -
        grid.querySelectorAll('.selected-skill-inc, .selected-skill-dec').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillName = btn.dataset.skill;
                const delta = btn.classList.contains('selected-skill-inc') ? 1 : -1;
                this.updateSelectedSkill(skillName, delta);
            });
        });
    }

    updateSelectedSkill(skillName, delta) {
        const skill = this.allSkills[skillName];
        if (!skill) return;

        const newValue = skill.value + delta;
        if (newValue < -4 || newValue > 4) return;

        // Проверка очков
        if (delta > 0 && this.state.skillPoints <= 0) {
            this.showMessage('Нет очков навыков!', 'error');
            return;
        }

        if (delta < 0) {
            this.state.skillPoints += 1;
        } else {
            this.state.skillPoints -= 1;
        }

        skill.value = newValue;
        this.renderSelectedSkills();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // ===== ПЕРКИ =====
    renderPerks() {
        const grid = document.getElementById('perksGrid');
        if (!grid) return;
        grid.innerHTML = '';
        Object.entries(this.perks).forEach(([name, data]) => {
            const div = document.createElement('div');
            div.className = `perk-item ${data.selected ? 'selected' : ''}`;
            div.dataset.perk = name;
            div.innerHTML = `
                <div class="perk-info">
                    <h4>${name}</h4>
                </div>
                <div class="perk-status">${data.selected ? '✓ ВЫБРАН' : '—'}</div>
                <div class="perk-tooltip">
                    <div class="tooltip-title">${name}</div>
                    <div class="tooltip-desc">${data.desc}</div>
                </div>
            `;
            div.addEventListener('click', () => this.togglePerk(name));
            grid.appendChild(div);
        });
    }

    togglePerk(name) {
        const perk = this.perks[name];
        if (perk.selected) {
            perk.selected = false;
            this.state.selectedPerks--;
            this.state.skillPoints++;
        } else {
            if (this.state.selectedPerks >= this.state.maxPerks) {
                this.showMessage('Максимум 2 перка!', 'error');
                return;
            }
            if (this.state.skillPoints <= 0) {
                this.showMessage('Нет очков для перка!', 'error');
                return;
            }
            perk.selected = true;
            this.state.selectedPerks++;
            this.state.skillPoints--;
        }
        this.renderPerks();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // ===== UI =====
    updateUI() {
        const totalPoints = document.getElementById('totalPoints');
        const charPoints = document.getElementById('charPointsDisplay');
        const skillPoints = document.getElementById('skillPointsDisplay');
        const selectedSkills = document.getElementById('selectedSkillsDisplay');
        const perkPoints = document.getElementById('perkPointsDisplay');

        if (totalPoints) totalPoints.textContent = this.state.points;
        if (charPoints) charPoints.textContent = `ОЧКОВ: ${this.state.points}`;
        if (skillPoints) skillPoints.textContent = `ОЧКОВ: ${this.state.skillPoints}`;
        if (selectedSkills) selectedSkills.textContent = `ВЫБРАНО: ${this.state.selectedSkillsCount}/${this.state.maxSkills}`;
        if (perkPoints) perkPoints.textContent = `ОЧКОВ ПЕРКОВ: ${this.state.skillPoints}`;
    }

    // ===== СОБЫТИЯ =====
    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const target = document.getElementById(this.dataset.tab);
                if (target) target.classList.add('active');
            });
        });

        document.getElementById('characteristicsGrid')?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const stat = btn.dataset.stat;
            if (!stat) return;
            const delta = btn.classList.contains('char-inc-btn') ? 1 : -1;
            this.updateCharacteristic(stat, delta);
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            if (confirm('Сбросить всё?')) this.resetAll();
        });

        document.getElementById('doneBtn')?.addEventListener('click', () => {
            this.showResultModal();
        });

        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            document.getElementById('resultModal').classList.add('hidden');
        });

        document.getElementById('resultModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                document.getElementById('resultModal').classList.add('hidden');
            }
        });

        document.getElementById('copyBtn')?.addEventListener('click', () => {
            const text = document.getElementById('resultBody').textContent;
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showMessage('📋 Скопировано!', 'success');
                }).catch(() => this.fallbackCopy(text));
            } else {
                this.fallbackCopy(text);
            }
        });
    }

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showMessage('📋 Скопировано!', 'success');
    }

    showResultModal() {
        const body = document.getElementById('resultBody');
        if (!body) return;

        let text = '📋 ХАРАКТЕРИСТИКИ:\n';
        Object.entries(this.characteristics).forEach(([name, value]) => {
            text += `  ${name}: ${value > 0 ? '+' : ''}${value}\n`;
        });

        const selectedSkills = this.selectedSkillsList.filter(name => this.allSkills[name].value !== 0);
        if (selectedSkills.length > 0) {
            text += '\n🎯 НАВЫКИ:\n';
            selectedSkills.forEach(name => {
                const val = this.allSkills[name].value;
                text += `  ${name}: ${val > 0 ? '+' : ''}${val}\n`;
            });
        }

        const selectedPerks = Object.keys(this.perks).filter(name => this.perks[name].selected);
        if (selectedPerks.length > 0) {
            text += '\n🏅 ПЕРКИ:\n';
            selectedPerks.forEach(name => {
                text += `  ${name}\n`;
            });
        }

        body.textContent = text;
        document.getElementById('resultModal').classList.remove('hidden');
    }

    resetAll() {
        Object.keys(this.characteristics).forEach(k => this.characteristics[k] = 0);
        Object.keys(this.allSkills).forEach(k => this.allSkills[k].value = 0);
        Object.keys(this.perks).forEach(k => this.perks[k].selected = false);
        this.selectedSkillsList = [];
        this.state.points = 2;
        this.state.skillPoints = 3;
        this.state.selectedSkillsCount = 0;
        this.state.selectedPerks = 0;
        this.renderCharacteristics();
        this.renderAllSkills();
        this.renderSelectedSkills();
        this.renderPerks();
        this.updateUI();
        this.saveToLocalStorage();
        this.showMessage('Сброшено!', 'success');
    }

    saveToLocalStorage() {
        try {
            const data = {
                characteristics: this.characteristics,
                allSkills: this.allSkills,
                selectedSkillsList: this.selectedSkillsList,
                perks: this.perks,
                state: this.state
            };
            localStorage.setItem('characterData', JSON.stringify(data));
        } catch (e) {}
    }

    loadFromLocalStorage() {
        try {
            const saved = localStorage.getItem('characterData');
            if (!saved) return;
            const data = JSON.parse(saved);
            Object.assign(this.characteristics, data.characteristics);
            Object.assign(this.allSkills, data.allSkills);
            Object.assign(this.perks, data.perks);
            this.selectedSkillsList = data.selectedSkillsList || [];
            Object.assign(this.state, data.state);
            this.renderCharacteristics();
            this.renderAllSkills();
            this.renderSelectedSkills();
            this.renderPerks();
            this.updateUI();
        } catch (e) {}
    }

    showMessage(text, type = 'info') {
        const msg = document.getElementById('savedMessage');
        if (!msg) return;
        msg.textContent = text;
        msg.className = 'message';
        if (type === 'error') {
            msg.style.borderColor = '#8c3a3a';
            msg.style.color = '#e74c3c';
        } else {
            msg.style.borderColor = 'var(--accent-green)';
            msg.style.color = 'var(--accent-green-bright)';
        }
        msg.classList.remove('hidden');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => msg.classList.add('hidden'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CharacterEditor();
});
