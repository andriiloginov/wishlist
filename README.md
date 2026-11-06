# Вішліст на день народження (GitHub Pages)

Статична сторінка в стилі інтернет-магазину 1999 року: один файл `index.html`, обкладинки в `covers/`, аватарка `avatar.jpg`.

## Як додати гру
Допишіть рядок у масив `ITEMS` в `index.html` і покладіть обкладинку в `covers/`:
```js
{ id: "slug", img: "covers/файл.png", title: "Назва", note: "Платформа", price: "999 ₴", link: R + "slug-товару" },
```

## Лічильник відвідувачів
Рахує abacus.jasoncameron.dev (ключ `andriiloginov-wishlist/visits`). Кожен новий браузер додає 1 і запам'ятовує свій номер, повторні заходи не рахуються.

## Публікація
Закомітьте й запуште в `main`. Сайт: https://andriiloginov.github.io/wishlist/
