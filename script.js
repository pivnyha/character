class CharacterEditor {
    constructor() {
        // ===== ХАРАКТЕРИСТИКИ =====
        this.stats = {
            'Сила': 0,
            'Удача': 0,
            'Внимательность': 0,
            'Ловкость': 0,
            'Харизма': 0
        };

        // ===== ВСЕ НАВЫКИ (Интеллект УДАЛЁН) =====
        this.skillsDB = {
            'Стрельба': { val: 0, desc: '+1 на атаки дальнего боя', type: 'combat' },
            'Ближний бой': { val: 0, desc: '+1 на атаки в рукопашном бою', type: 'combat' },
            'Фехтование': { val: 0, desc: '+1 на атаки с оружием ближнего боя', type: 'combat' },
            'Тяжелое оружие': { val: 0, desc: '+1 к броску: ракетницы, гранатометы и тп', type: 'combat' },
            'Взлом': { val: 0, desc: '+1 к броску на взлом', type: 'spec' },
            'Создание': { val: 0, desc: '+1 к броску на создание предметов', type: 'spec' },
            'Ремонт': { val: 0, desc: '+1 к броску на починку', type: 'spec' },
            'Медицина': { val: 0, desc: '+1 к броскам связанные с медициной', type: 'spec' },
            'Диагностика': { val: 0, desc: '+1 на бросок связанный с поиском поломок, дефектов', type: 'spec' },
            'Вождение': { val: 0, desc: '+1 к управлению наземным транспортом', type: 'spec' }
        };

        // ===== ВСЕ ПЕРКИ =====
        this.perksDB = {
            'Нежное обаяние': { picked: false, desc: 'Персонажи женского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против женщин.' },
            'Твердое слово': { picked: false, desc: 'Персонажи мужского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против мужчин.' },
            'Ответка': { picked: false, desc: 'Увернувшись от удара, получаешь +1 к следующей атаке против обидчика.' },
            'Крепкий орешек': { picked: false, desc: 'Ваш персонаж получает дополнительные 20ХП.' },
            'Мастер-торговец': { picked: false, desc: 'Ваш персонаж имеет больший шанс получить скидку и доп валюты при продаже. (зависит от харизмы)' },
            'Химик': { picked: false, desc: 'При употреблении препаратов или боевых стимуляторов его действия продляются на 1 ход.' },
            'Голос за кадром': { picked: false, desc: 'ГМ может дать расплывчатую подсказку игроку' }
        };

        // ===== ВЫБРАННОЕ =====
        this.mySkills = [];
        this.myPerks = [];

        // ===== СИСТЕМА ОЧКОВ =====
        this.points = {
            charPoints: 2,
            freePoints: 3,
            skillLimit: 4,
            totalLimit: 4
        };

        this.isUnlimited = false;

        this.resetAll();
        this.start();
    }

    start() {
        this.renderStats();
        this.renderSkills();
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
        this.listeners();
    }

    // ===== ХАРАКТЕРИСТИКИ =====
    renderStats() {
        const grid = document.getElementById('characteristicsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        Object.entries(this.stats).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <span class="stat-name">${name}</span>
                <div class="stat-controls">
                    <button class="stat-down" data-name="${name}">−</button>
                    <span class="stat-value ${value < 0 ? 'negative' : value > 0 ? 'positive' : ''}">${value}</span>
                    <button class="stat-up" data-name="${name}">+</button>
                </div>
            `;
            grid.appendChild(div);
        });
    }

    changeStat(name, delta) {
        const cur = this.stats[name];
        const next = cur + delta;
        
        if (!this.isUnlimited) {
            if (next < -4 || next > 4) return;
            if (delta > 0 && this.points.charPoints <= 0) {
                this.showMsg('Нет очков характеристик!', 'error');
                return;
            }
            if (delta < 0) this.points.charPoints += 1;
            else this.points.charPoints -= 1;
        } else {
            if (next < -99 || next > 99) return;
        }

        this.stats[name] = next;
        this.renderStats();
        this.updateDisplay();
    }

    // ===== НАВЫКИ =====
    renderSkills() {
        const container = document.getElementById('allSkillsList');
        if (!container) return;
        container.innerHTML = '';

        const combat = [];
        const spec = [];

        Object.entries(this.skillsDB).forEach(([name, data]) => {
            const picked = this.mySkills.includes(name);
            if (data.type === 'combat') combat.push({ name, data, picked });
            else spec.push({ name, data, picked });
        });

        const buildGroup = (title, items) => {
            const group = document.createElement('div');
            group.className = 'skill-group';
            group.innerHTML = `<div class="skill-group-title">${title}</div>`;
            items.forEach(({ name, data, picked }) => {
                const el = document.createElement('div');
                el.className = `skill-item ${picked ? 'selected' : ''}`;
                el.dataset.name = name;
                el.innerHTML = `<span class="skill-name">${name}</span>`;
                
                el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'skill'));
                el.addEventListener('mouseleave', () => this.hideDesc());

                if (!picked) {
                    el.addEventListener('click', () => this.pickSkill(name));
                }
                group.appendChild(el);
            });
            return group;
        };

        if (combat.length) container.appendChild(buildGroup('⚔ БОЕВЫЕ', combat));
        if (spec.length) container.appendChild(buildGroup('🔧 СПЕЦИАЛИЗАЦИЯ', spec));
    }

    pickSkill(name) {
        const total = this.mySkills.length + this.myPerks.length;
        
        if (!this.isUnlimited) {
            if (total >= this.points.totalLimit) {
                this.showMsg('Максимум 4 выбора!', 'error');
                return;
            }
            if (this.mySkills.length >= this.points.skillLimit) {
                this.showMsg('Максимум 4 навыка!', 'error');
                return;
            }
        }

        if (this.mySkills.includes(name)) return;

        this.mySkills.push(name);
        this.renderSkills();
        this.renderPicked();
        this.updateDisplay();
    }

    // ===== ПЕРКИ =====
    renderPerks() {
        const container = document.getElementById('allPerksList');
        if (!container) return;
        container.innerHTML = '';

        Object.entries(this.perksDB).forEach(([name, data]) => {
            const picked = this.myPerks.includes(name);
            const el = document.createElement('div');
            el.className = `skill-item ${picked ? 'selected' : ''}`;
            el.dataset.name = name;
            el.innerHTML = `<span class="skill-name">${name}</span>`;
            
            el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'perk'));
            el.addEventListener('mouseleave', () => this.hideDesc());

            if (!picked) {
                el.addEventListener('click', () => this.pickPerk(name));
            }
            container.appendChild(el);
        });
    }

    pickPerk(name) {
        const perk = this.perksDB[name];
        if (!perk) return;

        if (perk.picked) {
            perk.picked = false;
            this.myPerks = this.myPerks.filter(p => p !== name);
        } else {
            const total = this.mySkills.length + this.myPerks.length;
            if (!this.isUnlimited && total >= this.points.totalLimit) {
                this.showMsg('Максимум 4 выбора!', 'error');
                return;
            }
            perk.picked = true;
            this.myPerks.push(name);
        }

        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
    }

    // ===== ВЫБРАННОЕ =====
    renderPicked() {
        const container = document.getElementById('selectedList');
        if (!container) return;
        container.innerHTML = '';

        const total = this.mySkills.length + this.myPerks.length;
        if (total === 0) {
            container.innerHTML = '<div class="empty-message">Ничего не выбрано</div>';
            return;
        }

        this.mySkills.forEach(name => {
            const data = this.skillsDB[name];
            if (!data) return;
            const el = document.createElement('div');
            el.className = 'selected-item';
            el.innerHTML = `
                <div class="selected-header">
                    <span class="selected-name">${name}</span>
                    <span class="selected-remove" data-type="skill" data-name="${name}">✕</span>
                </div>
                <div class="distribute-controls">
                    <button class="dist-down" data-name="${name}">−</button>
                    <span class="dist-value ${data.val < 0 ? 'negative' : data.val > 0 ? 'positive' : ''}">${data.val}</span>
                    <button class="dist-up" data-name="${name}">+</button>
                </div>
            `;
            container.appendChild(el);
        });

        this.myPerks.forEach(name => {
            const data = this.perksDB[name];
            if (!data) return;
            const el = document.createElement('div');
            el.className = 'selected-item perk-item-selected';
            el.innerHTML = `
                <div class="selected-header">
                    <span class="selected-name perk-color">${name}</span>
                    <span class="selected-remove" data-type="perk" data-name="${name}">✕</span>
                </div>
                <div class="perk-check">✓ ВЫБРАН</div>
            `;
            container.appendChild(el);
        });

        container.querySelectorAll('.selected-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                const name = btn.dataset.name;
                if (type === 'skill') this.unpickSkill(name);
                else this.unpickPerk(name);
            });
        });

        container.querySelectorAll('.dist-up, .dist-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = btn.dataset.name;
                const delta = btn.classList.contains('dist-up') ? 1 : -1;
                this.changeSkillVal(name, delta);
            });
        });
    }

    unpickSkill(name) {
        const idx = this.mySkills.indexOf(name);
        if (idx === -1) return;
        const data = this.skillsDB[name];
        if (data && data.val !== 0) {
            if (!this.isUnlimited) this.points.freePoints += data.val;
            data.val = 0;
        }
        this.mySkills.splice(idx, 1);
        this.renderSkills();
        this.renderPicked();
        this.updateDisplay();
    }

    unpickPerk(name) {
        const idx = this.myPerks.indexOf(name);
        if (idx === -1) return;
        this.myPerks.splice(idx, 1);
        this.perksDB[name].picked = false;
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
    }

    changeSkillVal(name, delta) {
        const skill = this.skillsDB[name];
        if (!skill) return;
        const next = skill.val + delta;
        
        if (!this.isUnlimited) {
            if (next < -4 || next > 4) return;
            if (delta > 0 && this.points.freePoints <= 0) {
                this.showMsg('Нет очков!', 'error');
                return;
            }
            if (delta < 0) this.points.freePoints += 1;
            else this.points.freePoints -= 1;
        } else {
            if (next < -99 || next > 99) return;
        }

        skill.val = next;
        this.renderPicked();
        this.updateDisplay();
    }

    // ===== ОПИСАНИЕ =====
    showDesc(name, desc, type) {
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        if (placeholder) placeholder.style.display = 'none';
        const label = type === 'skill' ? '📋 НАВЫК' : '🏅 ПЕРК';
        area.innerHTML = `
            <div class="description-type">${label}</div>
            <div class="description-name">${name}</div>
            <div class="description-text">${desc}</div>
        `;
        area.style.display = 'block';
        document.body.classList.add('no-scroll');
    }

    hideDesc() {
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        if (placeholder) placeholder.style.display = 'block';
        area.style.display = 'none';
        area.innerHTML = '';
        document.body.classList.remove('no-scroll');
    }

    // ===== РАНДОМАЙЗЕР =====
    randomize() {
        this.resetAll();

        let statPoints = this.isUnlimited ? 10 : 2;
        const statKeys = Object.keys(this.stats);
        
        if (this.isUnlimited) {
            statKeys.forEach(key => {
                this.stats[key] = Math.floor(Math.random() * 9) - 4;
            });
        } else {
            for (let i = 0; i < statPoints; i++) {
                const randomKey = statKeys[Math.floor(Math.random() * statKeys.length)];
                if (this.stats[randomKey] < 4) {
                    this.stats[randomKey] += 1;
                } else {
                    i--;
                }
            }
        }

        const skillKeys = Object.keys(this.skillsDB);
        const skillLimit = this.isUnlimited ? skillKeys.length : 4;
        const shuffledSkills = [...skillKeys].sort(() => 0.5 - Math.random());
        
        this.mySkills = shuffledSkills.slice(0, skillLimit);

        const perkKeys = Object.keys(this.perksDB);
        const perkLimit = this.isUnlimited ? perkKeys.length : 2;
        const shuffledPerks = [...perkKeys].sort(() => 0.5 - Math.random());
        
        this.myPerks = shuffledPerks.slice(0, perkLimit);

        Object.keys(this.perksDB).forEach(k => this.perksDB[k].picked = false);
        this.myPerks.forEach(name => this.perksDB[name].picked = true);

        let freePoints = this.isUnlimited ? 10 : 3;
        const availableSkills = [...this.mySkills];
        
        if (availableSkills.length > 0) {
            if (this.isUnlimited) {
                this.mySkills.forEach(name => {
                    this.skillsDB[name].val = Math.floor(Math.random() * 9) - 4;
                });
            } else {
                for (let i = 0; i < freePoints; i++) {
                    const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
                    if (this.skillsDB[randomSkill].val < 4) {
                        this.skillsDB[randomSkill].val += 1;
                    } else {
                        i--;
                    }
                }
            }
        }

        this.points.charPoints = 0;
        this.points.freePoints = 0;

        this.renderStats();
        this.renderSkills();
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();

        const btn = document.getElementById('randomBtn');
        if (btn) {
            btn.classList.add('shaking');
            setTimeout(() => btn.classList.remove('shaking'), 400);
        }
    }

    // ===== UI =====
    updateDisplay() {
        const charEl = document.getElementById('charPointsDisplay');
        const freeEl = document.getElementById('skillPointsDisplay');
        const selEl = document.getElementById('selectedDisplay');
        const total = this.mySkills.length + this.myPerks.length;
        
        if (charEl) charEl.textContent = this.isUnlimited ? `ОЧКОВ: ∞` : `ОЧКОВ: ${this.points.charPoints}`;
        if (freeEl) freeEl.textContent = this.isUnlimited ? `ОЧКОВ: ∞` : `ОЧКОВ: ${this.points.freePoints}`;
        if (selEl) selEl.textContent = this.isUnlimited ? `ВЫБРАНО: ${total}` : `ВЫБРАНО: ${total}/${this.points.totalLimit}`;
        
        this.updateStatusBar();
    }

    updateStatusBar() {
        const total = this.mySkills.length + this.myPerks.length;
        const totalLimit = this.points.totalLimit;
        const free = this.points.freePoints;

        const statusText = document.getElementById('statusText');
        const statusLed = document.getElementById('statusLed');
        
        if (statusText && statusLed) {
            if (this.isUnlimited) {
                statusText.textContent = 'БЕЗЛИМИТ';
                statusLed.className = 'status-led warn';
            } else if (total >= totalLimit) {
                statusText.textContent = 'МАКСИМУМ';
                statusLed.className = 'status-led warn';
            } else if (free <= 0) {
                statusText.textContent = 'НЕТ ОЧКОВ';
                statusLed.className = 'status-led warn';
            } else {
                statusText.textContent = 'ГОТОВ';
                statusLed.className = 'status-led';
            }
        }

        const dots = document.querySelectorAll('#statusDots .dot');
        dots.forEach((dot, i) => {
            dot.className = 'dot';
            if (this.isUnlimited) {
                dot.classList.add('full');
            } else if (i < total) {
                dot.classList.add('filled');
                if (i >= totalLimit - 1) dot.classList.add('full');
            }
        });

        const statusSelected = document.getElementById('statusSelected');
        if (statusSelected) statusSelected.textContent = this.isUnlimited ? total : `${total}/${totalLimit}`;

        const statusPoints = document.getElementById('statusPoints');
        if (statusPoints) statusPoints.textContent = this.isUnlimited ? '∞' : free;

        const statusSector = document.getElementById('statusSector');
        if (statusSector) {
            const activeTab = document.querySelector('.tab-btn.active');
            const isStats = activeTab?.dataset.tab === 'characteristics';
            statusSector.textContent = isStats ? '01' : '02';
        }
    }

    // ===== СОБЫТИЯ =====
    listeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                const target = document.getElementById(this.dataset.tab);
                if (target) target.classList.add('active');
                if (window.editor) window.editor.updateStatusBar();
            });
        });

        document.getElementById('characteristicsGrid')?.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const name = btn.dataset.name;
            if (!name) return;
            const delta = btn.classList.contains('stat-up') ? 1 : -1;
            this.changeStat(name, delta);
        });

        // Тумблер безлимита
        document.getElementById('unlimitedToggle')?.addEventListener('change', (e) => {
            this.isUnlimited = e.target.checked;
            
            if (this.isUnlimited) {
                this.points.charPoints = 999;
                this.points.freePoints = 999;
                this.showMsg('БЕЗЛИМИТНЫЙ РЕЖИМ ВКЛЮЧЕН', 'success');
            } else {
                this.resetAll();
                this.showMsg('ЛИМИТЫ ВОССТАНОВЛЕНЫ', 'error');
            }
            
            this.renderStats();
            this.renderPicked();
            this.updateDisplay();
        });

        // Кнопка рандома
        document.getElementById('
