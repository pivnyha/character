class CharacterEditor {
    constructor() {
        this.characteristics = {
            'Сила': 0,
            'Удача': 0,
            'Внимательность': 0,
            'Ловкость': 0,
            'Харизма': 0
        };

        this.skills = {
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

        this.perks = {
            'Нежное обаяние': { selected: false, desc: 'Персонажи женского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против женщин.' },
            'Твердое слово': { selected: false, desc: 'Персонажи мужского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против мужчин.' },
            'Плохая компания': { selected: false, desc: 'Преступники, контрабандисты и теневики видят в тебе своего.' },
            'Ответка': { selected: false, desc: 'Увернувшись от удара, получаешь +1 к следующей атаке против обидчика.' },
            'Крепкий орешек': { selected: false, desc: 'Ваш персонаж получает дополнительные 20ХП.' },
            'Мастер-торговец': { selected: false, desc: 'Ваш персонаж имеет больший шанс получить скидку и доп валюты при продаже. (зависит от харизмы)' },
            'Химик': { selected: false, desc: 'При употреблении препаратов или боевых стимуляторов его действия продляются на 1 ход.' },
            'Таинственный незнакомец': { selected: false, desc: 'Дает вам личного ангела-хранителя. Когда вы начинаете проигрывать в бою, с малым шансом может появиться таинственный незнакомец.' },
            'Грамотный подход': { selected: false, desc: 'Требуется меньше ресурсов на создание предметов' },
            'Ты видел это?!': { selected: false, desc: '35% шанс отвлечь противника, тыкнув пальцем куда-то туда' },
            'Голос за кадром': { selected: false, desc: 'ГМ может дать расплывчатую подсказку игроку' }
        };

        this.state = {
            points: 2,
            skillPoints: 3,
            selectedSkills: 0,
            selectedPerks: 0,
            maxSkills: 4,
            maxPerks: 2
        };

        this.init();
    }

    init() {
        this.renderCharacteristics();
        this.renderSkills();
        this.renderPerks();
        this.updateUI();
        this.setupEventListeners();
        this.loadFromLocalStorage();
    }

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

    renderSkills() {
        const combatGrid = document.getElementById('combatSkills');
        const specGrid = document.getElementById('specializationSkills');
        if (!combatGrid || !specGrid) return;
        combatGrid.innerHTML = '';
        specGrid.innerHTML = '';

        Object.entries(this.skills).forEach(([name, data]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            const isSelected = data.value > 0;
            div.innerHTML = `
                <span>
                    <span class="stat-name">${name}</span>
                    <span class="stat-desc">${data.desc}</span>
                </span>
                <div class="stat-controls">
                    <button class="skill-dec-btn" data-skill="${name}" ${!isSelected ? 'disabled' : ''}>−</button>
                    <span class="stat-value ${data.value < 0 ? 'negative' : data.value > 0 ? 'positive' : ''}">${data.value}</span>
                    <button class="skill-inc-btn" data-skill="${name}" ${isSelected && data.value >= 4 ? 'disabled' : ''}>+</button>
                </div>
            `;
            if (data.category === 'combat') combatGrid.appendChild(div);
            else specGrid.appendChild(div);
        });
    }

    updateSkill(name, delta) {
        const skill = this.skills[name];
        if (!skill) return;
        const newValue = skill.value + delta;
        if (newValue < -4 || newValue > 4) return;

        if (delta > 0 && skill.value === 0) {
            if (this.state.selectedSkills >= this.state.maxSkills) {
                this.showMessage('Максимум 4 навыка!', 'error');
                return;
            }
            if (this.state.skillPoints <= 0) {
                this.showMessage('Нет очков навыков!', 'error');
                return;
            }
            this.state.selectedSkills++;
            this.state.skillPoints--;
        } else if (delta < 0 && skill.value === 1) {
            this.state.selectedSkills--;
            this.state.skillPoints++;
        } else if (delta > 0 && skill.value > 0) {
            if (this.state.skillPoints <= 0) {
                this.showMessage('Нет очков навыков!', 'error');
                return;
            }
            this.state.skillPoints--;
        } else if (delta < 0 && skill.value > 1) {
            this.state.skillPoints++;
        }

        skill.value = newValue;
        this.renderSkills();
        this.updateUI();
        this.saveToLocalStorage();
    }

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
                    <div class="perk-description">${data.desc}</div>
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
                this.showMessage('Нет очков для выбора перка!', 'error');
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

    updateUI() {
        const totalPoints = document.getElementById('totalPoints');
        const charPoints = document.getElementById('charPointsDisplay');
        const skillPoints = document.getElementById('skillPointsDisplay');
        const selectedSkills = document.getElementById('selectedSkillsDisplay');
        const perkPoints = document.getElementById('perkPointsDisplay');

        if (totalPoints) totalPoints.textContent = this.state.points;
        if (charPoints) charPoints.textContent = `ОЧКОВ: ${this.state.points}`;
        if (skillPoints) skillPoints.textContent = `ОЧКОВ: ${this.state.skillPoints}`;
        if (selectedSkills) selectedSkills.textContent = `ВЫБРАНО: ${this.state.selectedSkills}/${this.state.maxSkills}`;
        if (perkPoints) perkPoints.textContent = `ОЧКОВ ПЕРКОВ: ${this.state.skillPoints}`;
    }

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

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.classList.contains('skill-inc-btn') || btn.classList.contains('skill-dec-btn')) {
                const skill = btn.dataset.skill;
                if (!skill) return;
                const delta = btn.classList.contains('skill-inc-btn') ? 1 : -1;
                this.updateSkill(skill, delta);
            }
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

        const selectedSkills = Object.entries(this.skills).filter(([_, data]) => data.value > 0);
        if (selectedSkills.length > 0) {
            text += '\n🎯 НАВЫКИ:\n';
            selectedSkills.forEach(([name, data]) => {
                text += `  ${name}: +${data.value}\n`;
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
        Object.keys(this.skills).forEach(k => this.skills[k].value = 0);
        Object.keys(this.perks).forEach(k => this.perks[k].selected = false);
        this.state.points = 2;
        this.state.skillPoints = 3;
        this.state.selectedSkills = 0;
        this.state.selectedPerks = 0;
        this.renderCharacteristics();
        this.renderSkills();
        this.renderPerks();
        this.updateUI();
        this.saveToLocalStorage();
        this.showMessage('Сброшено!', 'success');
    }

    saveToLocalStorage() {
        try {
            const data = {
                characteristics: this.characteristics,
                skills: this.skills,
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
            Object.assign(this.skills, data.skills);
            Object.assign(this.perks, data.perks);
            Object.assign(this.state, data.state);
            this.renderCharacteristics();
            this.renderSkills();
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
