class CharacterEditor {
    constructor() {
        this.stats = {
            'Сила': 0, 'Удача': 0, 'Внимательность': 0, 'Ловкость': 0, 'Харизма': 0
        };

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

        this.perksDB = {
            'Нежное обаяние': { picked: false, desc: 'Персонажи женского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону.' },
            'Твердое слово': { picked: false, desc: 'Персонажи мужского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону.' },
            'Ответка': { picked: false, desc: 'Увернувшись от удара, получаешь +1 к следующей атаке против обидчика.' },
            'Крепкий орешек': { picked: false, desc: 'Ваш персонаж получает дополнительные 20ХП.' },
            'Мастер-торговец': { picked: false, desc: 'Ваш персонаж имеет больший шанс получить скидку и доп валюты при продаже.' },
            'Химик': { picked: false, desc: 'При употреблении препаратов или боевых стимуляторов его действия продляются на 1 ход.' },
            'Голос за кадром': { picked: false, desc: 'ГМ может дать расплывчатую подсказку игроку' }
        };

        this.mySkills = [];
        this.myPerks = [];
        this.points = { charPoints: 2, freePoints: 3, skillLimit: 4, totalLimit: 4 };
        this.isUnlimited = false;
        this.typeTimeout = null;
        this.volume = 0.3;
        this.audioCtx = null;

        this.resetAll();
        this.start();
    }

    // --- ЗВУКИ (Web Audio API) ---
    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playClick() {
        if (this.volume <= 0) return;
        this.initAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.05);
    }

    playTypewriter() {
        if (this.volume <= 0) return;
        this.initAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.03);
        gain.gain.setValueAtTime(this.volume * 0.6, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.03);
    }

    playError() {
        if (this.volume <= 0) return;
        this.initAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, this.audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(this.volume * 0.5, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.2);
    }

    setupAudioSettings() {
        const toggle = document.getElementById('settingsToggle');
        const panel = document.getElementById('settingsPanel');
        const slider = document.getElementById('volumeSlider');
        const valueDisplay = document.getElementById('volumeValue');

        if (toggle && panel) {
            toggle.addEventListener('click', () => panel.classList.toggle('hidden'));
        }

        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                this.volume = parseFloat(e.target.value);
                valueDisplay.textContent = Math.round(this.volume * 100) + '%';
            });
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.audioCtx && this.audioCtx.state === 'running') this.audioCtx.suspend();
            } else {
                if (this.audioCtx && this.audioCtx.state === 'suspended') this.audioCtx.resume();
            }
        });
    }

    // --- ОТРИСОВКА ---
    start() {
        this.renderStats();
        this.renderSkills();
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
        this.listeners();
        this.setupAudioSettings();
    }

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
            if (next < -4 || next > 4) { this.playError(); return; }
            if (delta > 0 && this.points.charPoints <= 0) {
                this.playError();
                return this.showMsg('Нет очков характеристик!', 'error');
            }
            if (delta < 0) this.points.charPoints += 1;
            else this.points.charPoints -= 1;
        } else {
            if (next < -99 || next > 99) { this.playError(); return; }
        }

        this.playClick();
        this.stats[name] = next;
        this.renderStats();
        this.updateDisplay();
    }

    renderSkills() {
        const container = document.getElementById('allSkillsList');
        if (!container) return;
        container.innerHTML = '';
        const combat = [], spec = [];

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
                el.innerHTML = `<span class="skill-name">${name}</span>`;
                el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'skill'));
                el.addEventListener('mouseleave', () => this.hideDesc());
                if (!picked) el.addEventListener('click', () => this.pickSkill(name));
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
            if (total >= this.points.totalLimit) { this.playError(); return this.showMsg('Максимум 4 выбора!', 'error'); }
            if (this.mySkills.length >= this.points.skillLimit) { this.playError(); return this.showMsg('Максимум 4 навыка!', 'error'); }
        }
        if (this.mySkills.includes(name)) return;
        
        this.playClick();
        this.mySkills.push(name);
        this.renderSkills();
        this.renderPicked();
        this.updateDisplay();
    }

    renderPerks() {
        const container = document.getElementById('allPerksList');
        if (!container) return;
        container.innerHTML = '';
        
        Object.entries(this.perksDB).forEach(([name, data]) => {
            const picked = this.myPerks.includes(name);
            const el = document.createElement('div');
            el.className = `skill-item ${picked ? 'selected' : ''}`;
            el.innerHTML = `<span class="skill-name">${name}</span>`;
            el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'perk'));
            el.addEventListener('mouseleave', () => this.hideDesc());
            if (!picked) el.addEventListener('click', () => this.pickPerk(name));
            container.appendChild(el);
        });
    }

    pickPerk(name) {
        const perk = this.perksDB[name];
        if (!perk) return;

        if (perk.picked) {
            this.playClick();
            perk.picked = false;
            this.myPerks = this.myPerks.filter(p => p !== name);
        } else {
            const total = this.mySkills.length + this.myPerks.length;
            if (!this.isUnlimited && total >= this.points.totalLimit) { this.playError(); return this.showMsg('Максимум 4 выбора!', 'error'); }
            this.playClick();
            perk.picked = true;
            this.myPerks.push(name);
        }

        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
    }

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
                this.playClick();
                if (btn.dataset.type === 'skill') this.unpickSkill(btn.dataset.name);
                else this.unpickPerk(btn.dataset.name);
            });
        });

        container.querySelectorAll('.dist-up, .dist-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.changeSkillVal(btn.dataset.name, btn.classList.contains('dist-up') ? 1 : -1);
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
            if (next < -4 || next > 4) { this.playError(); return; }
            if (delta > 0 && this.points.freePoints <= 0) { this.playError(); return this.showMsg('Нет очков!', 'error'); }
            if (delta < 0) this.points.freePoints += 1;
            else this.points.freePoints -= 1;
        } else {
            if (next < -99 || next > 99) { this.playError(); return; }
        }

        this.playClick();
        skill.val = next;
        this.renderPicked();
        this.updateDisplay();
    }

    showDesc(name, desc, type) {
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        if (placeholder) placeholder.style.display = 'none';
        
        clearTimeout(this.typeTimeout);

        area.innerHTML = `
            <div class="description-type">${type === 'skill' ? '📋 НАВЫК' : '🏅 ПЕРК'}</div>
            <div class="description-name">${name}</div>
            <div class="description-text" id="typewriter-text"></div>
        `;
        area.style.display = 'block';
        document.body.classList.add('no-scroll');

        const textEl = document.getElementById('typewriter-text');
        let i = 0;
        
        const typeChar = () => {
            if (i < desc.length) {
                textEl.textContent += desc.charAt(i);
                i++;
                if (i % 2 === 0) this.playTypewriter();
                this.typeTimeout = setTimeout(typeChar, 30);
            }
        };
        
        typeChar();
    }

    hideDesc() {
        clearTimeout(this.typeTimeout);
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        if (placeholder) placeholder.style.display = 'block';
        area.style.display = 'none';
        document.body.classList.remove('no-scroll');
    }

    randomize() {
        this.playClick();
        this.resetAll();

        const statKeys = Object.keys(this.stats);
        if (this.isUnlimited) {
            statKeys.forEach(key => this.stats[key] = Math.floor(Math.random() * 9) - 4);
        } else {
            for (let i = 0; i < 2; i++) {
                const rKey = statKeys[Math.floor(Math.random() * statKeys.length)];
                if (this.stats[rKey] < 4) this.stats[rKey] += 1;
                else i--;
            }
        }

        const skillKeys = Object.keys(this.skillsDB);
        const skillCount = this.isUnlimited ? Math.floor(Math.random() * 3) + 2 : 4; 
        const shuffledSkills = [...skillKeys].sort(() => 0.5 - Math.random());
        this.mySkills = shuffledSkills.slice(0, skillCount);

        const perkKeys = Object.keys(this.perksDB);
        const perkCount = this.isUnlimited ? Math.floor(Math.random() * 3) + 1 : 2;
        const shuffledPerks = [...perkKeys].sort(() => 0.5 - Math.random());
        this.myPerks = shuffledPerks.slice(0, perkCount);

        Object.keys(this.perksDB).forEach(k => this.perksDB[k].picked = false);
        this.myPerks.forEach(name => this.perksDB[name].picked = true);

        if (this.mySkills.length > 0) {
            if (this.isUnlimited) {
                this.mySkills.forEach(name => { this.skillsDB[name].val = Math.floor(Math.random() * 9) - 4; });
            } else {
                for (let i = 0; i < 3; i++) {
                    const rSkill = this.mySkills[Math.floor(Math.random() * this.mySkills.length)];
                    if (this.skillsDB[rSkill].val < 4) this.skillsDB[rSkill].val += 1;
                    else i--;
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
            const isStats = document.querySelector('.tab-btn.active')?.dataset.tab === 'characteristics';
            statusSector.textContent = isStats ? '01' : '02';
        }
    }

    listeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (window.editor) window.editor.playClick();
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
            this.changeStat(btn.dataset.name, btn.classList.contains('stat-up') ? 1 : -1);
        });

        const unlimBtn = document.getElementById('unlimitedBtn');
        const unlimText = document.getElementById('unlimitedText');
        if (unlimBtn) {
            unlimBtn.addEventListener('click', () => {
                this.playClick();
                this.isUnlimited = !this.isUnlimited;
                
                if (this.isUnlimited) {
                    unlimBtn.classList.add('active');
                    unlimText.textContent = 'БЕЗ ЛИМИТОВ';
                    this.showMsg('БЕЗЛИМИТНЫЙ РЕЖИМ ВКЛЮЧЕН', 'success');
                    this.points.charPoints = 999;
                    this.points.freePoints = 999;
                } else {
                    unlimBtn.classList.remove('active');
                    unlimText.textContent = 'ЛИМИТЫ ВКЛ';
                    this.showMsg('ЛИМИТЫ ВОССТАНОВЛЕНЫ', 'error');
                    this.resetAll();
                }
                
                this.renderStats();
                this.renderPicked();
                this.updateDisplay();
            });
        }

        document.getElementById('randomBtn')?.addEventListener('click', () => this.randomize());

        document.getElementById('doneBtn')?.addEventListener('click', () => {
            this.playClick();
            this.showResult();
        });
        
        document.getElementById('closeModalBtn')?.addEventListener('click', () => {
            this.playClick();
            document.getElementById('resultModal').classList.add('hidden');
        });

        document.getElementById('resultModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
        });
        
        document.getElementById('copyBtn')?.addEventListener('click', () => {
            this.playClick();
            const text = document.getElementById('resultBody').textContent;
            navigator.clipboard.writeText(text).then(() => this.showMsg('📋 Скопировано!', 'success'));
        });
    }

    showResult() {
        const body = document.getElementById('resultBody');
        if (!body) return;
        let text = '📋 ХАРАКТЕРИСТИКИ:\n';
        Object.entries(this.stats).forEach(([n, v]) => text += `  ${n}: ${v > 0 ? '+' : ''}${v}\n`);
        
        if (this.mySkills.length) {
            text += '\n🎯 НАВЫКИ:\n';
            this.mySkills.forEach(n => text += `  ${n}: ${this.skillsDB[n].val > 0 ? '+' : ''}${this.skillsDB[n].val}\n`);
        }
        if (this.myPerks.length) {
            text += '\n🏅 ПЕРКИ:\n';
            this.myPerks.forEach(n => text += `  ${n}\n`);
        }
        body.textContent = text;
        document.getElementById('resultModal').classList.remove('hidden');
    }

    resetAll() {
        Object.keys(this.stats).forEach(k => this.stats[k] = 0);
        Object.keys(this.skillsDB).forEach(k => this.skillsDB[k].val = 0);
        Object.keys(this.perksDB).forEach(k => this.perksDB[k].picked = false);
        this.mySkills = [];
        this.myPerks = [];
        this.points.charPoints = 2;
        this.points.freePoints = 3;
    }

    showMsg(text, type = 'info') {
        const msg = document.getElementById('savedMessage');
        if (!msg) return;
        msg.textContent = text;
        msg.className = 'message';
        msg.style.borderColor = type === 'error' ? 'var(--accent-warn)' : 'var(--accent)';
        msg.style.color = type === 'error' ? 'var(--accent-warn)' : 'var(--accent)';
        msg.classList.remove('hidden');
        clearTimeout(this._timer);
        this._timer = setTimeout(() => msg.classList.add('hidden'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.editor = new CharacterEditor();
});
