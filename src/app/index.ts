import { config } from 'dotenv';
config()
import express, { Request, Response } from 'express';
import ServerlessHttp from 'serverless-http';
import { STAGE } from './enums/stage_enum';
import { router } from './routes/snake_routes'

const app = express();
app.use(express.json());
app.use(router)
let not_prox_mov = "down";

app.post('/start', (req: Request, res: Response) => {
    res.send("ok");
});

const limites: { x: number; y: number }[] = []

for (let temp_var=0; temp_var<11; temp_var++){
    limites.push({"x": -1, "y": temp_var});
    limites.push({"x": 12, "y": temp_var});

    limites.push({"x": temp_var, "y": -1});
    limites.push({"x": temp_var, "y": 12});
}

let poscoes_ocupadas = [];
let NextPosition = null;

function calculateNextPosition(head: { x: number; y: number }, direction: string): { x: number; y: number } {
    switch (direction) {
        case 'up':
            return { x: head.x, y: head.y + 1 }; // Move up
        case 'down':
            return { x: head.x, y: head.y - 1 }; // Move down
        case 'left':
            return { x: head.x - 1, y: head.y }; // Move left
        case 'right':
            return { x: head.x + 1, y: head.y }; // Move right
        default:
            throw new Error('Invalid direction');
    }
}

app.post('/move', (req: Request, res: Response) => {
    console.log(req.body.you.head);

    poscoes_ocupadas = [...limites, ...req.body.you.body];
    
    const head = req.body.you.head;

    //const head = { x: 2, y: 2}

    const directions = ["up", "down", "left", "right"];
    // Define opposite directions
    const opposites: { [key: string]: string } = {
        "up": "down",
        "down": "up",
        "left": "right",
        "right": "left"
    };

    let isCoordinateIncluded;
    let randomDirection = directions[Math.floor(Math.random() * directions.length)];

    do {
        // Select a random direction
        randomDirection = directions[Math.floor(Math.random() * directions.length)];
        // Find the opposite direction
        const NextPosition = calculateNextPosition(head, randomDirection);

        const isCoordinateIncluded = limites.some(coordinate => 
            coordinate.x === NextPosition.x && coordinate.y === NextPosition.y
        );

    } while (isCoordinateIncluded === true); // Ensure we don't pick the same direction twice
    
    
    const NextPosition = calculateNextPosition(head, randomDirection);
    const response = {
        move: randomDirection,
        shout: 'teste'
    };
    res.json(response);

    console.log(response);
    not_prox_mov = opposites[randomDirection];
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


