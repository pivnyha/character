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

        this.allPerks = {
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

        this.selectedSkills = [];
        this.selectedPerks = [];

        this.state = {
            points: 2,
            skillPoints: 3,
            maxSkills: 4,
            maxTotal: 4
        };

        this.init();
    }

    init() {
        this.renderCharacteristics();
        this.renderAllSkills();
        this.renderAllPerks();
        this.renderSelected();
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

    renderAllSkills() {
        const container = document.getElementById('allSkillsList');
        if (!container) return;
        container.innerHTML = '';

        const combatSkills = [];
        const specSkills = [];

        Object.entries(this.allSkills).forEach(([name, data]) => {
            const isSelected = this.selectedSkills.includes(name);
            if (data.category === 'combat') {
                combatSkills.push({ name, data, isSelected });
            } else {
                specSkills.push({ name, data, isSelected });
            }
        });

        const createGroup = (title, skills) => {
            const group = document.createElement('div');
            group.className = 'skill-group';
            group.innerHTML = `<div class="skill-group-title">${title}</div>`;

            skills.forEach(({ name, data, isSelected }) => {
                const item = document.createElement('div');
                item.className = `skill-item ${isSelected ? 'selected' : ''}`;
                item.dataset.skill = name;
                item.innerHTML = `
                    <span class="skill-name">${name}</span>
                `;
                if (!isSelected) {
                    item.addEventListener('click', () => this.selectSkill(name));
                    item.addEventListener('mouseenter', () => this.showDescription(name, data.desc, 'skill'));
                    item.addEventListener('mouseleave', () => this.hideDescription());
                } else {
                    item.addEventListener('mouseenter', () => this.showDescription(name, data.desc, 'skill'));
                    item.addEventListener('mouseleave', () => this.hideDescription());
                }
                group.appendChild(item);
            });
            return group;
        };

        if (combatSkills.length > 0) {
            container.appendChild(createGroup('⚔ БОЕВЫЕ', combatSkills));
        }
        if (specSkills.length > 0) {
            container.appendChild(createGroup('🔧 СПЕЦИАЛИЗАЦИЯ', specSkills));
        }
    }

    selectSkill(name) {
        const totalSelected = this.selectedSkills.length + this.selectedPerks.length;
        if (totalSelected >= this.state.maxTotal) {
            this.showMessage('Максимум 4 выбора!', 'error');
            return;
        }
        if (this.selectedSkills.includes(name)) return;
        if (this.selectedSkills.length >= this.state.maxSkills) {
            this.showMessage('Максимум 4 навыка!', 'error');
            return;
        }
        if (this.state.skillPoints <= 0) {
            this.showMessage('Нет очков распределения!', 'error');
            return;
        }

        this.selectedSkills.push(name);
        this.state.skillPoints -= 1;
        this.renderAllSkills();
        this.renderSelected();
        this.updateUI();
        this.saveToLocalStorage();
    }

    renderAllPerks() {
        const container = document.getElementById('allPerksList');
        if (!container) return;
        container.innerHTML = '';

        Object.entries(this.allPerks).forEach(([name, data]) => {
            const isSelected = this.selectedPerks.includes(name);
            const item = document.createElement('div');
            item.className = `skill-item ${isSelected ? 'selected' : ''}`;
            item.dataset.perk = name;
            item.innerHTML = `
                <span class="skill-name">${name}</span>
            `;
            if (!isSelected) {
                item.addEventListener('click', () => this.selectPerk(name));
                item.addEventListener('mouseenter', () => this.showDescription(name, data.desc, 'perk'));
                item.addEventListener('mouseleave', () => this.hideDescription());
            } else {
                item.addEventListener('mouseenter', () => this.showDescription(name, data.desc, 'perk'));
                item.addEventListener('mouseleave', () => this.hideDescription());
            }
            container.appendChild(item);
        });
    }

    selectPerk(name) {
        const perk = this.allPerks[name];
        if (!perk) return;

        if (perk.selected) {
            perk.selected = false;
            this.selectedPerks = this.selectedPerks.filter(p => p !== name);
            this.state.skillPoints += 1;
        } else {
            const totalSelected = this.selectedSkills.length + this.selectedPerks.length;
            if (totalSelected >= this.state.maxTotal) {
                this.showMessage('Максимум 4 выбора!', 'error');
                return;
            }
            if (this.selectedPerks.length >= this.state.maxPerks) {
                this.showMessage('Максимум 2 перка!', 'error');
                return;
            }
            if (this.state.skillPoints <= 0) {
                this.showMessage('Нет очков распределения!', 'error');
                return;
            }
            perk.selected = true;
            this.selectedPerks.push(name);
            this.state.skillPoints -= 1;
        }

        this.renderAllPerks();
        this.renderSelected();
        this.updateUI();
        this.saveToLocalStorage();
    }

    renderSelected() {
        const container = document.getElementById('selectedList');
        if (!container) return;
        container.innerHTML = '';

        const total = this.selectedSkills.length + this.selectedPerks.length;
        if (total === 0) {
            container.innerHTML = '<div class="empty-message">Ничего не выбрано</div>';
            return;
        }

        this.selectedSkills.forEach(name => {
            const data = this.allSkills[name];
            if (!data) return;

            const item = document.createElement('div');
            item.className = 'selected-item';
            item.innerHTML = `
                <div class="selected-header">
                    <span class="selected-name">${name}</span>
                    <span class="selected-remove" data-type="skill" data-name="${name}">✕</span>
                </div>
                <div class="distribute-controls">
                    <button class="dist-dec" data-skill="${name}">−</button>
                    <span class="dist-value ${data.value < 0 ? 'negative' : data.value > 0 ? 'positive' : ''}">${data.value}</span>
                    <button class="dist-inc" data-skill="${name}">+</button>
                </div>
            `;
            container.appendChild(item);
        });

        this.selectedPerks.forEach(name => {
            const data = this.allPerks[name];
            if (!data) return;

            const item = document.createElement('div');
            item.className = 'selected-item perk-item-selected';
            item.innerHTML = `
                <div class="selected-header">
                    <span class="selected-name perk-color">${name}</span>
                    <span class="selected-remove" data-type="perk" data-name="${name}">✕</span>
                </div>
                <div class="perk-check">✓ ВЫБРАН</div>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('.selected-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                const name = btn.dataset.name;
                if (type === 'skill') {
                    this.removeSkill(name);
                } else {
                    this.removePerk(name);
                }
            });
        });

        container.querySelectorAll('.dist-inc, .dist-dec').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const skillName = btn.dataset.skill;
                const delta = btn.classList.contains('dist-inc') ? 1 : -1;
                this.updateDistribution(skillName, delta);
            });
        });
    }

    removeSkill(name) {
        const index = this.selectedSkills.indexOf(name);
        if (index === -1) return;
        const data = this.allSkills[name];
        if (data && data.value !== 0) {
            this.state.skillPoints += data.value;
            data.value = 0;
        }
        this.selectedSkills.splice(index, 1);
        this.state.skillPoints += 1;
        this.renderAllSkills();
        this.renderSelected();
        this.updateUI();
        this.saveToLocalStorage();
    }

    removePerk(name) {
        const index = this.selectedPerks.indexOf(name);
        if (index === -1) return;
        this.selectedPerks.splice(index, 1);
        this.allPerks[name].selected = false;
        this.state.skillPoints += 1;
        this.renderAllPerks();
        this.renderSelected();
        this.updateUI();
        this.saveToLocalStorage();
    }

    updateDistribution(name, delta) {
        const skill = this.allSkills[name];
        if (!skill) return;

        const newValue = skill.value + delta;
        if (newValue < -4 || newValue > 4) return;

        if (delta > 0 && this.state.skillPoints <= 0) {
            this.showMessage('Нет очков распределения!', 'error');
            return;
        }

        if (delta < 0) this.state.skillPoints += 1;
        else this.state.skillPoints -= 1;

        skill.value = newValue;
        this.renderSelected();
        this.updateUI();
        this.saveToLocalStorage();
    }

    showDescription(name, desc, type) {
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        
        if (placeholder) placeholder.style.display = 'none';
        
        const typeLabel = type === 'skill' ? '📋 НАВЫК' : '🏅 ПЕРК';
        area.innerHTML = `
            <div class="description-type">${typeLabel}</div>
            <div class="description-name">${name}</div>
            <div class="description-text">${desc}</div>
        `;
        area.style.display = 'block';
    }

    hideDescription() {
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        
        if (placeholder) placeholder.style.display = 'block';
        area.style.display = 'none';
        area.innerHTML = '';
    }

    updateUI() {
        const charPoints = document.getElementById('charPointsDisplay');
        const skillPoints = document.getElementById('skillPointsDisplay');
        const selectedDisplay = document.getElementById('selectedDisplay');

        const totalSelected = this.selectedSkills.length + this.selectedPerks.length;

        if (charPoints) charPoints.textContent = `ОЧКОВ: ${this.state.points}`;
        if (skillPoints) skillPoints.textContent = `ОЧКОВ РАСПРЕДЕЛЕНИЯ: ${this.state.skillPoints}`;
        if (selectedDisplay) selectedDisplay.textContent = `ВЫБРАНО: ${totalSelected}/${this.state.maxTotal}`;
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

        if (this.selectedSkills.length > 0) {
            text += '\n🎯 НАВЫКИ:\n';
            this.selectedSkills.forEach(name => {
                const val = this.allSkills[name].value;
                text += `  ${name}: ${val > 0 ? '+' : ''}${val}\n`;
            });
        }

        if (this.selectedPerks.length > 0) {
            text += '\n🏅 ПЕРКИ:\n';
            this.selectedPerks.forEach(name => {
                text += `  ${name}\n`;
            });
        }

        body.textContent = text;
        document.getElementById('resultModal').classList.remove('hidden');
    }

    resetAll() {
        Object.keys(this.characteristics).forEach(k => this.characteristics[k] = 0);
        Object.keys(this.allSkills).forEach(k => this.allSkills[k].value = 0);
        Object.keys(this.allPerks).forEach(k => k.selected = false);
        this.selectedSkills = [];
        this.selectedPerks = [];
        this.state.points = 2;
        this.state.skillPoints = 3;
        this.renderCharacteristics();
        this.renderAllSkills();
        this.renderAllPerks();
        this.renderSelected();
        this.updateUI();
        this.saveToLocalStorage();
        this.showMessage('Сброшено!', 'success');
    }

    saveToLocalStorage() {
        try {
            const data = {
                characteristics: this.characteristics,
                allSkills: this.allSkills,
                allPerks: this.allPerks,
                selectedSkills: this.selectedSkills,
                selectedPerks: this.selectedPerks,
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
            Object.assign(this.allPerks, data.allPerks);
            this.selectedSkills = data.selectedSkills || [];
            this.selectedPerks = data.selectedPerks || [];
            Object.assign(this.state, data.state);
            this.renderCharacteristics();
            this.renderAllSkills();
            this.renderAllPerks();
            this.renderSelected();
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
