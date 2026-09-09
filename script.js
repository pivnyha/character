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

        // ===== ВСЕ НАВЫКИ =====
        this.skillsDB = {
            'Стрельба': { val: 0, desc: '+1 на атаки дальнего боя', type: 'combat' },
            'Ближний бой': { val: 0, desc: '+1 на атаки в рукопашном бою', type: 'combat' },
            'Фехтование': { val: 0, desc: '+1 на атаки с оружием ближнего боя', type: 'combat' },
            'Скрытность': { val: 0, desc: '+1 к броску на скрытное перемещение', type: 'combat' },
            'Тяжелое оружие': { val: 0, desc: '+1 к броску: ракетницы, гранатометы и тп', type: 'combat' },
            'Взлом': { val: 0, desc: '+1 к броску на взлом', type: 'spec' },
            'Создание': { val: 0, desc: '+1 к броску на создание предметов', type: 'spec' },
            'Ремонт': { val: 0, desc: '+1 к броску на починку', type: 'spec' },
            'Кража': { val: 0, desc: '+1 к броску на воровство', type: 'spec' },
            'Медицина': { val: 0, desc: '+1 к броскам связанные с медициной', type: 'spec' },
            'Диагностика': { val: 0, desc: '+1 на бросок связанный с поиском поломок, дефектов', type: 'spec' },
            'Вождение': { val: 0, desc: '+1 к управлению наземным транспортом', type: 'spec' },
            'Интеллект': { val: 0, desc: 'Дает создавать более совершенные предметы', type: 'spec' }
        };

        // ===== ВСЕ ПЕРКИ =====
        this.perksDB = {
            'Нежное обаяние': { picked: false, desc: 'Персонажи женского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против женщин.' },
            'Твердое слово': { picked: false, desc: 'Персонажи мужского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против мужчин.' },
            'Плохая компания': { picked: false, desc: 'Преступники, контрабандисты и теневики видят в тебе своего.' },
            'Ответка': { picked: false, desc: 'Увернувшись от удара, получаешь +1 к следующей атаке против обидчика.' },
            'Крепкий орешек': { picked: false, desc: 'Ваш персонаж получает дополнительные 20ХП.' },
            'Мастер-торговец': { picked: false, desc: 'Ваш персонаж имеет больший шанс получить скидку и доп валюты при продаже. (зависит от харизмы)' },
            'Химик': { picked: false, desc: 'При употреблении препаратов или боевых стимуляторов его действия продляются на 1 ход.' },
            'Таинственный незнакомец': { picked: false, desc: 'Дает вам личного ангела-хранителя. Когда вы начинаете проигрывать в бою, с малым шансом может появиться таинственный незнакомец.' },
            'Грамотный подход': { picked: false, desc: 'Требуется меньше ресурсов на создание предметов' },
            'Ты видел это?!': { picked: false, desc: '35% шанс отвлечь противника, тыкнув пальцем куда-то туда' },
            'Голос за кадром': { picked: false, desc: 'ГМ может дать расплывчатую подсказку игроку' }
        };

        // ===== ВЫБРАННОЕ =====
        this.mySkills = [];
        this.myPerks = [];

        // ===== НОВАЯ СИСТЕМА ОЧКОВ =====
        this.points = {
            charPoints: 2,      // очки для характеристик
            freePoints: 3,      // очки ТОЛЬКО для прокачки навыков (НЕ тратятся на выбор!)
            skillLimit: 4,      // максимум навыков
            totalLimit: 4       // всего выборов (навыки + перки)
        };

        this.start();
    }

    start() {
        this.renderStats();
        this.renderSkills();
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
        this.listeners();
        this.loadData();
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
        if (next < -4 || next > 4) return;
        if (delta > 0 && this.points.charPoints <= 0) {
            this.showMsg('Нет очков характеристик!', 'error');
            return;
        }
        if (delta < 0) this.points.charPoints += 1;
        else this.points.charPoints -= 1;
        this.stats[name] = next;
        this.renderStats();
        this.updateDisplay();
        this.saveData();
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
                if (!picked) {
                    el.addEventListener('click', () => this.pickSkill(name));
                    el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'skill'));
                    el.addEventListener('mouseleave', () => this.hideDesc());
                } else {
                    el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'skill'));
                    el.addEventListener('mouseleave', () => this.hideDesc());
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
        if (total >= this.points.totalLimit) {
            this.showMsg('Максимум 4 выбора!', 'error');
            return;
        }
        if (this.mySkills.includes(name)) return;
        if (this.mySkills.length >= this.points.skillLimit) {
            this.showMsg('Максимум 4 навыка!', 'error');
            return;
        }

        // ✅ НЕ ТРАТИМ ОЧКИ НА ВЫБОР!
        this.mySkills.push(name);
        this.renderSkills();
        this.renderPicked();
        this.updateDisplay();
        this.saveData();
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
            if (!picked) {
                el.addEventListener('click', () => this.pickPerk(name));
                el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'perk'));
                el.addEventListener('mouseleave', () => this.hideDesc());
            } else {
                el.addEventListener('mouseenter', () => this.showDesc(name, data.desc, 'perk'));
                el.addEventListener('mouseleave', () => this.hideDesc());
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
            if (total >= this.points.totalLimit) {
                this.showMsg('Максимум 4 выбора!', 'error');
                return;
            }
            // ✅ НЕ ТРАТИМ ОЧКИ НА ВЫБОР!
            perk.picked = true;
            this.myPerks.push(name);
        }

        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
        this.saveData();
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
            this.points.freePoints += data.val;
            data.val = 0;
        }
        this.mySkills.splice(idx, 1);
        this.renderSkills();
        this.renderPicked();
        this.updateDisplay();
        this.saveData();
    }

    unpickPerk(name) {
        const idx = this.myPerks.indexOf(name);
        if (idx === -1) return;
        this.myPerks.splice(idx, 1);
        this.perksDB[name].picked = false;
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
        this.saveData();
    }

    changeSkillVal(name, delta) {
        const skill = this.skillsDB[name];
        if (!skill) return;
        const next = skill.val + delta;
        if (next < -4 || next > 4) return;
        if (delta > 0 && this.points.freePoints <= 0) {
            this.showMsg('Нет очков!', 'error');
            return;
        }
        if (delta < 0) this.points.freePoints += 1;
        else this.points.freePoints -= 1;
        skill.val = next;
        this.renderPicked();
        this.updateDisplay();
        this.saveData();
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
    }

    hideDesc() {
        const area = document.getElementById('descriptionContent');
        const placeholder = document.querySelector('.description-placeholder');
        if (!area) return;
        if (placeholder) placeholder.style.display = 'block';
        area.style.display = 'none';
        area.innerHTML = '';
    }

    // ===== UI =====
    updateDisplay() {
        const charEl = document.getElementById('charPointsDisplay');
        const freeEl = document.getElementById('skillPointsDisplay');
        const selEl = document.getElementById('selectedDisplay');
        const total = this.mySkills.length + this.myPerks.length;
        if (charEl) charEl.textContent = `ОЧКОВ: ${this.points.charPoints}`;
        if (freeEl) freeEl.textContent = `ОЧКОВ: ${this.points.freePoints}`;
        if (selEl) selEl.textContent = `ВЫБРАНО: ${total}/${this.points.totalLimit}`;
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

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            if (confirm('Сбросить всё?')) this.resetAll();
        });

        document.getElementById('doneBtn')?.addEventListener('click', () => {
            this.showResult();
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
                    this.showMsg('📋 Скопировано!', 'success');
                }).catch(() => this.fallbackCopy(text));
            } else {
                this.fallbackCopy(text);
            }
        });
    }

    fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        this.showMsg('📋 Скопировано!', 'success');
    }

    showResult() {
        const body = document.getElementById('resultBody');
        if (!body) return;
        let text = '📋 ХАРАКТЕРИСТИКИ:\n';
        Object.entries(this.stats).forEach(([name, value]) => {
            text += `  ${name}: ${value > 0 ? '+' : ''}${value}\n`;
        });
        if (this.mySkills.length) {
            text += '\n🎯 НАВЫКИ:\n';
            this.mySkills.forEach(name => {
                const val = this.skillsDB[name].val;
                text += `  ${name}: ${val > 0 ? '+' : ''}${val}\n`;
            });
        }
        if (this.myPerks.length) {
            text += '\n🏅 ПЕРКИ:\n';
            this.myPerks.forEach(name => {
                text += `  ${name}\n`;
            });
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
        this.renderStats();
        this.renderSkills();
        this.renderPerks();
        this.renderPicked();
        this.updateDisplay();
        this.saveData();
        this.showMsg('Сброшено!', 'success');
    }

    saveData() {
        try {
            const data = {
                stats: this.stats,
                skillsDB: this.skillsDB,
                perksDB: this.perksDB,
                mySkills: this.mySkills,
                myPerks: this.myPerks,
                points: this.points
            };
            localStorage.setItem('charData', JSON.stringify(data));
        } catch (e) {}
    }

    loadData() {
        try {
            const saved = localStorage.getItem('charData');
            if (!saved) return;
            const data = JSON.parse(saved);
            Object.assign(this.stats, data.stats);
            Object.assign(this.skillsDB, data.skillsDB);
            Object.assign(this.perksDB, data.perksDB);
            this.mySkills = data.mySkills || [];
            this.myPerks = data.myPerks || [];
            Object.assign(this.points, data.points);
            this.renderStats();
            this.renderSkills();
            this.renderPerks();
            this.renderPicked();
            this.updateDisplay();
        } catch (e) {}
    }

    showMsg(text, type = 'info') {
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
        clearTimeout(this._timer);
        this._timer = setTimeout(() => msg.classList.add('hidden'), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CharacterEditor();
});
