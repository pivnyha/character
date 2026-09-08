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
                desc: 'Преступники, контрабандисты и теневики видят в тебе своего.'
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

    // ========== ХАРАКТЕРИСТИКИ ==========
    renderCharacteristics() {
        const grid = document.getElementById('characteristicsGrid');
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
        
        // Проверка очков при увеличении
        if (delta > 0 && this.state.points <= 0) {
            this.showMessage('Недостаточно очков распределения!', 'error');
            return;
        }
        
        // При уменьшении — возвращаем очко
        if (delta < 0) {
            this.state.points += 1;
        } else {
            this.state.points -= 1;
        }
        
        this.characteristics[name] = newValue;
        this.renderCharacteristics();
        this.updateUI();
        this.saveToLocalStorage();
    }

    // ========== НАВЫКИ ==========
    renderSkills() {
        const combatGrid = document.getElementById('combatSkills');
        const specGrid = document.getElementById('specializationSkills');
        combatGrid.innerHTML = '';
        specGrid.innerHTML = '';

        Object.entries(this.skills).forEach(([name, data]) => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            const isSelected = data.value > 0;
            div.innerHTML = `
                <span class="stat-name
});
