import { config } from 'dotenv';
config()
import express, { Request, Response } from 'express';
import ServerlessHttp from 'serverless-http';
import { STAGE } from './enums/stage_enum';
import { router } from './routes/snake_routes'

const app = express();
app.use(express.json());
app.use(router)

const not_prox_mov = "down";

app.post('/start', (req: Request, res: Response) => {
    res.send("ok");
});

app.post('/move', (req: Request, res: Response) => {
    console.log(req.body);
    const directions = ["up", "down", "left", "right"];
    // Define opposite directions
    const opposites = {
        "up": "down",
        "down": "up",
        "left": "right",
        "right": "left"
    };

    let not_prox_mov;

    do {
        // Select a random direction
        const i = directions[Math.floor(Math.random() * directions.length)];
        // Find the opposite direction
    } while (directions[i] === not_prox_mov); // Ensure we don't pick the same direction twice
    
    not_prox_mov = opposites[i];

    const response = {
        move: directions[i],
        shout: `I'm moving ${directions[i]}!`
    };
    res.json(response);
});

app.post('/end', (req: Request, res: Response) => {
    res.send("ok");
});

console.log('process.env.STAGE: ' + process.env.STAGE)

if (process.env.STAGE === STAGE.TEST) {
    app.listen(3000, () => {console.log('Server up and running on: http://localhost:3000 🚀')})
} else {
    module.exports.handler = ServerlessHttp(app)
}


