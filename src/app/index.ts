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
    console.log(req.body.board.food);
    console.log(req.body);

    let posicoes_ocupadas: any[] = [];

    for (let n_cobras = 0; n_cobras < req.body.board.snakes.length; n_cobras++) {
        posicoes_ocupadas = [...posicoes_ocupadas, ...req.body.board.snakes[n_cobras].body];
    }

    posicoes_ocupadas = [...posicoes_ocupadas, ...limites];
    let comidas = [...req.body.board.food];

    const head = req.body.you.head;
    const directions = ["up", "down", "left", "right"];
    const opposites: { [key: string]: string } = {
        "up": "down",
        "down": "up",
        "left": "right",
        "right": "left"
    };

    // Função para calcular a próxima posição baseada na direção
    const calculateNextPosition = (position: { x: number, y: number }, direction: string) => {
        switch (direction) {
            case "up":
                return { x: position.x, y: position.y - 1 };
            case "down":
                return { x: position.x, y: position.y + 1 };
            case "left":
                return { x: position.x - 1, y: position.y };
            case "right":
                return { x: position.x + 1, y: position.y };
            default:
                return position;
        }
    };

    // Função para calcular a distância manhattan entre duas posições
    const calculateDistance = (pos1: { x: number, y: number }, pos2: { x: number, y: number }) => {
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
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

    let possibleMoves: string[] = [];
    directions.forEach(direction => {
        let nextPos = calculateNextPosition(head, direction);
        let isOccupied = posicoes_ocupadas.some(pos => pos.x === nextPos.x && pos.y === nextPos.y);
        if (!isOccupied) {
            possibleMoves.push(direction);
        }
    });

    // Função para selecionar a melhor direção em direção à comida mais próxima
    const selectBestDirection = () => {
        let bestDirection = possibleMoves[0];
        let minFoodDistance = calculateDistance(calculateNextPosition(head, bestDirection), closestFood);
        possibleMoves.forEach(direction => {
            let nextPos = calculateNextPosition(head, direction);
            let foodDistance = calculateDistance(nextPos, closestFood);
            if (foodDistance < minFoodDistance) {
                minFoodDistance = foodDistance;
                bestDirection = direction;
            }
        });
        return bestDirection;
    };

    let selectedMove = selectBestDirection();

    const response = {
        move: selectedMove,
        shout: 'Moving towards food!'
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


