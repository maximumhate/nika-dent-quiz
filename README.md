# NIKA DENT Quiz

Небольшая интерактивная викторина о здоровье зубов и полости рта.

## Запуск

```bash
npm install
npm run dev
```

## Production

Приложение собирается в статические файлы и запускается через nginx:

```bash
docker build -t nika-dent-quiz .
docker run --rm -p 8080:80 nika-dent-quiz
```
