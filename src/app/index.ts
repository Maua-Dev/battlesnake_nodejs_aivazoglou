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
    limites.push({"x": 11, "y": temp_var});

    limites.push({"x": temp_var, "y": -1});
    limites.push({"x": temp_var, "y": 11});
}

let posicoes_ocupadas = [];
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
    console.log('req.body.board');
    console.log(req.body);

    let posicoes_ocupadas: any[] = [];

    for (let n_cobras = 0; n_cobras<req.body.board.snakes.length; n_cobras++){
        posicoes_ocupadas = [...posicoes_ocupadas, ...req.body.board.snakes[n_cobras].body];
    }

    posicoes_ocupadas = [...posicoes_ocupadas, ...limites];

    // console.log(posicoes_ocupadas);
    // posicoes_ocupadas = [...limites, ...req.body.you.body, ...req.body.board.snakes];
    
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

    let NextPosition: { x: any; y: any};
    let isCoordinateIncluded;
    let randomDirection = directions[Math.floor(Math.random() * directions.length)];

    do {
        // Select a random direction
        randomDirection = directions[Math.floor(Math.random() * directions.length)];
        // Find the opposite direction
        NextPosition = calculateNextPosition(head, randomDirection);

        isCoordinateIncluded = posicoes_ocupadas.some(coordinate =>
            coordinate.x === NextPosition.x && coordinate.y === NextPosition.y
        );

    } while (isCoordinateIncluded === true); // Ensure we don't pick the same direction twice
    
    
    // const NextPosition = calculateNextPosition(head, randomDirection);
    const response = {
        move: randomDirection,
        shout: 'fe'
    };
    res.json(response);

    //console.log(posicoes_ocupadas);
    //console.log(    );
    //console.log(isCoordinateIncluded);
    //console.log(response);
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


