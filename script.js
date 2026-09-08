class CharacterEditor {
    constructor() {
        // Данные характеристик
        this.characteristics = {
            'Сила': 0,
            'Удача': 0,
            'Внимательность': 0,
            'Ловкость': 0,
            'Харизма': 0
        };

        // Данные навыков
        this.skills = {
            // Боевые
            'Стрельба': { value: 0, desc: '+1 на атаки дальнего боя', category: 'combat' },
            'Ближний бой': { value: 0, desc: '+1 на атаки в рукопашном бою', category: 'combat' },
            'Фехтование': { value: 0, desc: '+1 на атаки с оружием ближнего боя', category: 'combat' },
            'Скрытность': { value: 0, desc: '+1 к броску на скрытное перемещение', category: 'combat' },
            'Тяжелое оружие': { value: 0, desc: '+1 к броску: ракетницы, гранатометы и тп', category: 'combat' },
            // Специализация
            'Взлом': { value: 0, desc: '+1 к броску на взлом', category: 'specialization' },
            'Создание': { value: 0, desc: '+1 к броску на создание предметов', category: 'specialization' },
            'Ремонт': { value: 0, desc: '+1 к броску на починку', category: 'specialization' },
            'Кража': { value: 0, desc: '+1 к броску на воровство', category: 'specialization' },
            'Медицина': { value: 0, desc: '+1 к броскам связанные с медициной', category: 'specialization' },
            'Диагностика': { value: 0, desc: '+1 на бросок связанный с поиском поломок, дефектов', category: 'specialization' },
            'Вождение': { value: 0, desc: '+1 к управлению наземным транспортом', category: 'specialization' },
            'Интеллект': { value: 0, desc: 'Дает создавать более совершенные предметы', category: 'specialization' }
        };

        // Перки
        this.perks = {
            'Нежное обаяние': {
                selected: false,
                desc: 'Персонажи женского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против женщин. (Не работает на торговцев)'
            },
            'Твердое слово': {
                selected: false,
                desc: 'Персонажи мужского пола к вам более расположены: охотнее идут навстречу, легче верят и склонны трактовать ваши поступки в лучшую сторону. +1 к броскам на убеждение, обман или обаяние против мужчин. (Не работает на торговцев)'
            },
            'Плохая компания': {
                selected: false,
                desc: 'преступники, контрабандисты и теневики видят в тебе своего.'
            },
            'Ответка': {
                selected: false,
                desc: 'Увернувшись от удара, получаешь +1 к следующей атаке против обидчика.'
            },
            'Крепкий орешек': {
                selected: false,
                desc: 'Ваш персонаж получает дополнительные 20ХП.'
            },
            'Мастер-торговец': {
                selected: false,
                desc: 'Ваш персонаж имеет больший шанс получить скидку и доп валюты при продаже. (зависит от харизмы)'
            },
            'Химик': {
                selected: false,
                desc: 'При употреблении препаратов или боевых стимуляторов его действия продляются на 1 ход.'
            },
            'Таинственный незнакомец': {
                selected: false,
                desc: 'Дает вам личного ангела-хранителя.. Когда вы начинаете проигрывать в бою, с малым шансом может появиться таинственный незнакомец.'
            },
            'Грамотный подход': {
                selected: false,
                desc: 'Требуется меньше ресурсов на создание предметов'
            },
            'Ты видел это?!': {
                selected: false,
                desc: '35% шанс отвлечь противника, тыкнув пальцем куда-то туда'
            },
            'Голос за кадром': {
                selected: false,
                desc: 'ГМ может дать расплывчатую подсказку игроку'
            }
        };

        // Состояние
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
        grid.innerHTML = '';
        
        Object.entries(this.characteristics).forEach(([name, value]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <span class="stat-name">${name}</span>
                <div class="stat-controls">
                    <button class="dec-btn" data-stat="${name}">−</button>
                    <span class="stat-value ${value < 0 ? 'negative' : ''}">${value}</span>
                    <button class="inc-btn" data-stat="${name}">+</button>
                </div>
            `;
            grid.appendChild(div);
        });
    }

    renderSkills() {
        const combatGrid = document.getElementById('combatSkills');
        const specGrid = document.getElementById('specializationSkills');
        combatGrid.innerHTML = '';
        specGrid.innerHTML = '';

        Object.entries(this.skills).forEach(([name, data]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            const isSelected = data.value !== 0;
            div.innerHTML = `
                <span class="stat-name">${name}</span>
                <div class="stat-controls">
                    <button class="skill-dec-btn" data-skill="${name}" ${!isSelected ? 'disabled' : ''}>−</button>
                    <span class="stat-value ${data.value < 0 ? 'negative' : ''}">${data.value}</span>
                    <button class="skill-inc-btn" data-skill="${name}" ${isSelected ? 'disabled' : ''}>+</button>
                </div>
                <span style="font-size: 12px; color: #888; margin-left: 10px;">${data.desc}</span>
            `;
            
            if (data.category === 'combat') {
                combatGrid.appendChild(div);
            } else {
                specGrid.appendChild(div);
            }
        });
    }

    renderPerks() {
        const grid = document.getElementById('perksGrid');
        grid.innerHTML = '';

        Object.entries(this.perks).forEach(([name, data]) => {
            const div = document.createElement('div');
            div.className = `perk-item ${data.selected ? 'selected' : ''}`;
            div.dataset.perk = name;
            div.innerHTML = `
                <h4>${name}</h4>
                <div class="perk-description">${data.desc}</div>
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
        } else {
            if (this.state.selectedPerks >= this.state.maxPerks) {
                this.showMessage('Достигнут максимум перков (2)', 'error');
                return;
            }
            perk.selected = true;
            this.state.selectedPerks++;
        }
        
        this.renderPerks();
        this.updateUI();
        this.saveToLocalStorage();
    }

    updateCharacteristic(name, delta) {
        const current = this.characteristics[name];
        const newValue = current + delta;
        
        if (newValue < -4 || newValue > 4) return;
        
        // Проверка очков
        if (delta > 0 && this.state.points <= 0) {
            this.showMessage('Недостаточно очков распределения!', 'error');
            return;
        }
        
        if (delta < 0 && this.state.points >= 2) {
            this.showMessage('Нельзя убрать очки, когда у вас максимум!', 'error');
            return;
        }
        
        this.characteristics[name] = newValue;
        this.state.points -= delta;
        
        this.renderCharacteristics();
        this.updateUI();
        this.saveToLocalStorage();
    }

    updateSkill(name, delta) {
        const skill = this.skills[name];
        const newValue = skill.value + delta;
        
        if (newValue < -4 || newValue > 4) return;
        
        // Проверка выбора навыка
        if (delta > 0 && skill.value === 0) {
            if (this.state.selectedSkills >= this.state.maxSkills) {
                this.showMessage('Достигнут максимум навыков (4)', 'error');
                return;
            }
            if (this.state.skillPoints <= 0) {
                this.showMessage('Недостаточно очков навыков!', 'error');
                return;
            }
            this.state.selectedSkills++;
            this.state.skillPoints--;
        } else if (delta < 0 && skill.value === 1) {
            this.state.selectedSkills--;
            this.state.skillPoints++;
        } else if (delta > 0) {
            if (this.state.skillPoints <= 0) {
                this.showMessage('Недостаточно очков навыков!', 'error');
                return;
            }
            this.state.skillPoints--;
        } else if (delta < 0) {
            this.state.skillPoints++;
        }
        
        skill.value = newValue;
        
        this.renderSkills();
        this.updateUI();
        this.saveToLocalStorage();
    }

    updateUI() {
        document.getElementById('totalPoints').textContent = this.state.points;
        
        // Обновляем отображение очков навыков
        const skillPointsDisplay = document.querySelector('.tab-content#skills .points-display');
        if (skillPointsDisplay) {
            // Можно добавить отдельный дисплей для навыков
        }
    }

    setupEventListeners() {
        // Вкладки
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Характеристики (делегирование)
        document.getElementById('characteristicsGrid').addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            const stat = btn.dataset.stat;
            if (!stat) return;
            
            const delta = btn.classList.contains('inc-btn') ? 1 : -1;
            this.updateCharacteristic(stat, delta);
        });

        // Навыки (делегирование)
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

        // Кнопка сброса
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите сбросить все изменения?')) {
                this.resetAll();
            }
        });

        // Кнопка сохранения
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveToLocalStorage();
            this.showMessage('✅ Персонаж сохранен!', 'success');
        });

        // Кнопка экспорта
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportCharacter();
        });
    }

    resetAll() {
        // Сброс характеристик
        Object.keys(this.characteristics).forEach(key => {
            this.characteristics[key] = 0;
        });
        
        // Сброс навыков
        Object.keys(this.skills).forEach(key => {
            this.skills[key].value = 0;
        });
        
        // Сброс перков
        Object.keys(this.perks).forEach(key => {
            this.perks[key].selected = false;
        });
        
        // Сброс состояния
        this.state.points = 2;
        this.state.skillPoints = 3;
        this.state.selectedSkills = 0;
        this.state.selectedPerks = 0;
        
        this.renderCharacteristics();
        this.renderSkills();
        this.renderPerks();
        this.updateUI();
        this.saveToLocalStorage();
        this.showMessage('🔄 Все сброшено!', 'info');
    }

    saveToLocalStorage() {
        const data = {
            characteristics: this.characteristics,
            skills: this.skills,
            perks: this.perks,
            state: this.state
        };
        localStorage.setItem('characterData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('characterData');
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            Object.assign(this.characteristics, data.characteristics);
            Object.assign(this.skills, data.skills);
            Object.assign(this.perks, data.perks);
            Object.assign(this.state, data.state);
            
            this.renderCharacteristics();
            this.renderSkills();
            this.renderPerks();
            this.updateUI();
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
        }
    }

    exportCharacter() {
        const data = {
            characteristics: this.characteristics,
            skills: Object.fromEntries(
                Object.entries(this.skills)
                    .filter(([_, data]) => data.value !== 0)
                    .map(([name, data]) => [name, data.value])
            ),
            perks: Object.keys(this.perks).filter(name => this.perks[name].selected),
            totalCharacteristicsPoints: Object.values(this.characteristics).reduce((a, b) => a + b, 0),
            totalSkillPoints: Object.values(this.skills).reduce((a, b) => a + b.value, 0)
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'character.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showMessage('📤 Персонаж экспортирован!', 'success');
    }

    showMessage(text, type = 'info') {
        const msg = document.getElementById('savedMessage');
        msg.textContent = text;
        msg.className = 'message';
        
        if (type === 'error') {
            msg.style.background = 'rgba(255, 107, 107, 0.2)';
            msg.style.color = '#ff6b6b';
            msg.style.borderColor = 'rgba(255, 107, 107, 0.3)';
        } else if (type === 'success') {
            msg.style.background = 'rgba(46, 213, 115, 0.2)';
            msg.style.color = '#2ed573';
            msg.style.borderColor = 'rgba(46, 213, 115, 0.3)';
        } else {
            msg.style.background = 'rgba(54, 164, 235, 0.2)';
            msg.style.color = '#36a4eb';
            msg.style.borderColor = 'rgba(54, 164, 235, 0.3)';
        }
        
        msg.classList.remove('hidden');
        setTimeout(() => {
            msg.classList.add('hidden');
        }, 3000);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new CharacterEditor();
});
