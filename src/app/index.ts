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

function calculateDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

function floodFill(head: { x: number; y: number }, occupiedPositions: { x: number; y: number }[]): number {
    const stack = [head];
    const visited = new Set();
    const key = (pos: { x: number; y: number }) => `${pos.x},${pos.y}`;
    let count = 0;

    while (stack.length > 0) {
        const current = stack.pop();
        if (!current || visited.has(key(current))) continue;
        visited.add(key(current));

        if (occupiedPositions.some(pos => pos.x === current.x && pos.y === current.y)) continue;

        count++;
        stack.push({ x: current.x + 1, y: current.y });
        stack.push({ x: current.x - 1, y: current.y });
        stack.push({ x: current.x, y: current.y + 1 });
        stack.push({ x: current.x, y: current.y - 1 });
    }

    return count;
    
    
}

app.post('/move', (req: Request, res: Response) => {
    console.log('req.body.board');
    console.log(req.body.board.food);
    console.log(req.body);

    let posicoes_ocupadas: any[] = [];

    for (let n_cobras = 0; n_cobras < req.body.board.snakes.length; n_cobras++) {
        posicoes_ocupadas = [...posicoes_ocupadas, ...req.body.board.snakes[n_cobras].body];
    }

    posicoes_ocupadas = [...posicoes_ocupadas, ...limites];
    let comidas = [...req.body.board.food];

    const head = req.body.you.head;
    let directions = ["up", "down", "left", "right"];
    directions = shuffle(directions);
    const opposites: { [key: string]: string } = {
        "up": "down",
        "down": "up",
        "left": "right",
        "right": "left"
    };

    // Encontre a comida mais próxima
    let closestFood = comidas[0];
    let minDistance = calculateDistance(head, closestFood);
    for (let food of comidas) {
        let distance = calculateDistance(head, food);
        if (distance < minDistance) {
            minDistance = distance;
            closestFood = food;
        }
    }

    let possibleMoves: { direction: string, nextPos: { x: number, y: number } }[] = [];
    directions.forEach(direction => {
        let nextPos = calculateNextPosition(head, direction);
        let isOccupied = posicoes_ocupadas.some(pos => pos.x === nextPos.x && pos.y === nextPos.y);
        if (!isOccupied) {
            possibleMoves.push({ direction, nextPos });
        }
    });

    // Função para embaralhar um array
    function shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
}
    // Avaliar as direções possíveis e evitar becos sem saída
    //possibleMoves = shuffle(possibleMoves);

    let bestDirection = possibleMoves[0].direction;
    let maxSpace = -1;
    possibleMoves.forEach(move => {
        const space = floodFill(move.nextPos, posicoes_ocupadas);
        if (space > maxSpace) {
            maxSpace = space;
            bestDirection = move.direction;
        }
    });

    const response = {
        move: bestDirection,
        shout: 'Avoiding dead ends!'
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


