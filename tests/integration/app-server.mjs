import express from 'express';

const app = express();

app.get('/test1', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
