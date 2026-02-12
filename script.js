// Функция для фильтрации товаров
function filterProducts() {
    // Получаем значения фильтров (делаем код устойчивым к отсутствию полей)
    const color = document.getElementById('color')?.value || '';
    const material = document.getElementById('material')?.value || '';
    const bridge = document.querySelector('input[name="bridge"]:checked')?.value || '';

    // Поддержка цен (необязательно) - поля: #price-min и #price-max
    const minPrice = parseInt(document.getElementById('price-min')?.value) || null;
    const maxPrice = parseInt(document.getElementById('price-max')?.value) || null;

    // Получаем выбранные типы гитар
    const selectedTypes = Array.from(document.querySelectorAll('input[name="type"]:checked'))
        .map(checkbox => checkbox.value);

    // Находим все карточки товаров
    const products = document.querySelectorAll('.product-card');

    products.forEach(product => {
        let isVisible = true;

        // Проверяем каждый активный фильтр
        // Поддерживаем множественные цвета в продукте через data-colors="red,black" или одиночный data-color
        const productColorsRaw = (product.dataset.colors || product.dataset.color || '').toString();
        const productColors = productColorsRaw
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean);
        if (color && !productColors.includes(color.toLowerCase())) {
            isVisible = false;
        }

        if (material && material !== product.dataset.material) {
            isVisible = false;
        }

        if (bridge && bridge !== product.dataset.bridge) {
            isVisible = false;
        }

        if (selectedTypes.length > 0 && !selectedTypes.includes(product.dataset.type)) {
            isVisible = false;
        }

        // Цена (если указана на карточке как data-price или в тексте .product-price)
        if ((minPrice || maxPrice) && isVisible) {
            const priceStr = product.dataset.price || product.querySelector('.product-price')?.textContent || '';
            const productPrice = parseInt((priceStr + '').replace(/\D/g, '')) || 0;
            if (minPrice && productPrice < minPrice) isVisible = false;
            if (maxPrice && productPrice > maxPrice) isVisible = false;
        }

        // Показываем или скрываем карточку
        product.style.display = isVisible ? '' : 'none';
    });
}

// Добавляем обработчики событий для всех элементов фильтра
document.addEventListener('DOMContentLoaded', () => {
    // Находим форму фильтров
    const form = document.getElementById('filters-form');
    if (!form) return;

    // Добавляем обработчики для всех элементов формы
    form.querySelectorAll('select, input[type="checkbox"], input[type="radio"], input[type="number"], input[type="range"], input[type="text"]').
        forEach(element => element.addEventListener('change', filterProducts));

    // Обработчик кнопки "Скинути" (если есть)
    const resetBtn = form.querySelector('button[type="reset"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            // Даем время на сброс формы
            setTimeout(() => {
                // Показываем все товары
                document.querySelectorAll('.product-card')
                    .forEach(card => card.style.display = '');
                // Также можно повторно применить фильтр (пустые значения) для синхронизации
                filterProducts();
            }, 0);
        });
    }

    // Предотвращаем отправку формы
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        filterProducts();
    });
});

// Автопрефикс для телефона в форме контактов
document.addEventListener('DOMContentLoaded', () => {
    const phoneInput = document.getElementById('phone-input');
    if (!phoneInput) return;
    const prefix = '+380';

    const ensurePrefix = () => {
        if (!phoneInput.value) {
            phoneInput.value = prefix;
        }
        // ставим курсор в конец
        const len = phoneInput.value.length;
        phoneInput.setSelectionRange(len, len);
    };

    const normalize = () => {
        let value = phoneInput.value || '';
        value = value.replace(/[^\d+]/g, '');
        if (!value.startsWith(prefix)) {
            value = prefix + value.replace(/\+/g, '').replace(/^380/, '');
        }
        if (value.length > 13) value = value.slice(0, 13);
        phoneInput.value = value;
    };

    ensurePrefix();
    phoneInput.addEventListener('focus', ensurePrefix);
    phoneInput.addEventListener('blur', () => {
        normalize();
        if (phoneInput.value === prefix) {
            phoneInput.value = '';
        }
    });
    phoneInput.addEventListener('input', normalize);
});

// Отправка формы "Напишіть нам" на сервер
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;
    let endpoint = form.getAttribute('data-endpoint') || '/api/contact';
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        endpoint = 'http://localhost:3000/api/contact';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            name: form.querySelector('input[name="name"]')?.value?.trim() || '',
            phone: form.querySelector('input[name="phone"]')?.value?.trim() || '',
            message: form.querySelector('textarea[name="message"]')?.value?.trim() || ''
        };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Request failed');
            form.reset();
            alert('Дякуємо! Повідомлення надіслано.');
        } catch (err) {
            alert('Не вдалося надіслати повідомлення. Спробуйте пізніше.');
        }
    });
});


// Лупа/зум при наведении на спецпредложения
document.addEventListener('DOMContentLoaded', () => {
    const mediaBlocks = document.querySelectorAll('.offer-media');
    if (!mediaBlocks.length) return;

    mediaBlocks.forEach((media) => {
        let indicator = media.querySelector('.zoom-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'zoom-indicator';
            indicator.innerHTML = '<div class="zoom-dot"></div>';
            media.appendChild(indicator);
        }
        const dot = indicator.querySelector('.zoom-dot');
        let isZooming = false;

        let zoomBtn = media.querySelector('.zoom-toggle');
        if (!zoomBtn) {
            zoomBtn = document.createElement('button');
            zoomBtn.type = 'button';
            zoomBtn.className = 'zoom-toggle';
            zoomBtn.textContent = 'Збільшити';
            media.appendChild(zoomBtn);
        }

        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
        const updateZoom = (e) => {
            if (!isZooming) return;
            const rect = media.getBoundingClientRect();
            const nx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            const ny = clamp((e.clientY - rect.top) / rect.height, 0, 1);

            // Усиливаем реакцию на движение курсора
            const sensitivity = 1.8;
            const sx = clamp(0.5 + (nx - 0.5) * sensitivity, 0, 1) * 100;
            const sy = clamp(0.5 + (ny - 0.5) * sensitivity, 0, 1) * 100;

            media.style.setProperty('--zoom-x', `${sx}%`);
            media.style.setProperty('--zoom-y', `${sy}%`);
            if (dot) {
                dot.style.left = `${nx * 100}%`;
                dot.style.top = `${ny * 100}%`;
            }
        };

        media.addEventListener('mousemove', updateZoom);
        zoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isZooming = !isZooming;
            media.classList.toggle('is-zooming', isZooming);
            if (!isZooming) {
                media.style.removeProperty('--zoom-x');
                media.style.removeProperty('--zoom-y');
            }
        });
        media.addEventListener('mouseleave', () => {
            if (isZooming) return;
            media.style.removeProperty('--zoom-x');
            media.style.removeProperty('--zoom-y');
        });
    });
});
