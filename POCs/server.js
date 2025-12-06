import express from 'express';
import path from 'path';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), './POCs/UI.html'));
})
app.post('/', (req, res) => {
    console.log(req.body);
    res.send('Hello World!!!');
});

app.listen(3000, () => {
    console.log('listening...');
});