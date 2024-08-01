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

let limites: { x: number; y: number }[] = []

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

// Função para embaralhar um array
function shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function calculateDistance(pos1: { x: number, y: number }, pos2: { x: number, y: number }): number {
    return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

function isEqual(coord1: { x: any; y: any; }, coord2: { x: any; y: any; }) {
    return coord1.x === coord2.x && coord1.y === coord2.y;
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
    let posicoes_ocupadas: any[] = [];

    const body_snake = req.body.you.body;
    const vida = req.body.you.health;
    const tail = body_snake[body_snake.length - 1];
    const pre_tail = body_snake[body_snake.length - 2];
    const size = req.body.you.length
    let cabecas_vida = [];
    let posicoesFuturasAmeaca: { x: number; y: number }[] = [];

    const comidas = [...req.body.board.food];

    const head = req.body.you.head;
    let directions = ["up", "down", "left", "right"];
    directions = shuffle(directions);

    for (let n_cobras = 0; n_cobras < req.body.board.snakes.length; n_cobras++) {
        posicoes_ocupadas.push(...req.body.board.snakes[n_cobras].body);
    }

    let limites: { x: number; y: number }[] = []

    const altura = req.body.board.height;
    const base = req.body.board.width;
    for (let temp_var=0; temp_var<altura; temp_var++){
        limites.push({"x": -1, "y": temp_var});
        limites.push({"x": base, "y": temp_var});
    }

    for (let temp_var=0; temp_var<base; temp_var++){
        limites.push({"x": temp_var, "y": -1});
        limites.push({"x": temp_var, "y": altura});
    }

    posicoes_ocupadas.push(...limites);

    // Coletar cabeças e vidas das outras cobras
    for (let n_cobra = 0; n_cobra < req.body.board.snakes.length; n_cobra++) {
        const cobra = req.body.board.snakes[n_cobra];
        // Adicionar apenas se a cabeça da cobra for diferente da sua cabeça
        if (!isEqual(cobra.head, head)) {
            cabecas_vida.push({ head: cobra.head, size: cobra.length });
        }
    }

    // Filtrar para manter apenas as cobras que tenham vida igual ou maior que minha vida
    let cabecasAmeaca = cabecas_vida.filter(cobra => cobra.size >= size);

    cabecasAmeaca.forEach(cobra => {
        const head = cobra.head;
    
        directions.forEach(direction => {
            const nextPos = calculateNextPosition(head, direction);
            posicoesFuturasAmeaca.push(nextPos);
        });
    });

    let UnSafeDirections: string[] = [];

    // Calcular a próxima posição para cada direção e verificar colisão
    directions.forEach(direction => {
        const nextPos = calculateNextPosition(head, direction);
        const isCollision = posicoesFuturasAmeaca.some(pos => pos.x === nextPos.x && pos.y === nextPos.y);

        if (isCollision) {
            UnSafeDirections.push(direction);
        }
    });

    let indexToRemove = posicoes_ocupadas.findIndex(coord => isEqual(coord, tail));

    // Verificar se a coordenada foi encontrada
    if (indexToRemove !== -1) {
        // Remover a coordenada do array
        posicoes_ocupadas.splice(indexToRemove, 1);
    }

    //console.log(posicoes_ocupadas);


    

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

    if ((comidas.length >= 3 && size % 2 === 0 && cabecasAmeaca.length <= 2)){
        closestFood = tail;
    }

    let possibleMoves: { direction: string, nextPos: { x: number, y: number } }[] = [];
    directions.forEach(direction => {
        let nextPos = calculateNextPosition(head, direction);
        let isOccupied = posicoes_ocupadas.some(pos => pos.x === nextPos.x && pos.y === nextPos.y);
        if (!isOccupied) {
            possibleMoves.push({ direction, nextPos });
        }
    });

    // Avaliar as direções possíveis e evitar becos sem saída
    let bestFloodFillDirections: string[] = [];
    let maxSpace = -1;
    let closestMoveToFood = possibleMoves[0];
    let minFoodDistance = calculateDistance(closestMoveToFood.nextPos, closestFood);
    let bestFoodDirections: string[] = [];

    possibleMoves.forEach(move => {
        const space = floodFill(move.nextPos, posicoes_ocupadas);
        if (space > maxSpace) {
            maxSpace = space;
            bestFloodFillDirections = [move.direction];
        } else if (space === maxSpace) {
            bestFloodFillDirections.push(move.direction);
        }

        const distanceToFood = calculateDistance(move.nextPos, closestFood);
        if (distanceToFood < minFoodDistance) {
            minFoodDistance = distanceToFood;
            bestFoodDirections = [move.direction];
        } else if (distanceToFood === minFoodDistance) {
            bestFoodDirections.push(move.direction);
        }
    });

    console.log(req.body.board);

    let commonDirections = bestFloodFillDirections
        .filter(direction => bestFoodDirections.includes(direction))
        .filter(direction => !UnSafeDirections.includes(direction));

    let finalDirection;
    if (commonDirections.length > 0) {
        finalDirection = commonDirections[Math.floor(Math.random() * commonDirections.length)];
    } else {
        // Caso não haja direção comum segura, escolher uma direção segura, priorizando flood fill
        const safeFloodFillDirections = bestFloodFillDirections.filter(direction => !UnSafeDirections.includes(direction));
        if (safeFloodFillDirections.length > 0) {
            finalDirection = safeFloodFillDirections[Math.floor(Math.random() * safeFloodFillDirections.length)];
        } else {
            // Caso não haja nenhuma direção segura, escolher uma direção insegura se necessário
            finalDirection = bestFloodFillDirections.length > 0 ? 
                bestFloodFillDirections[Math.floor(Math.random() * bestFloodFillDirections.length)] : 
                directions[Math.floor(Math.random() * directions.length)];
        }
    }

    const response = {
        move: finalDirection || "up",
        //move: "up",
        shout: 'Moving towards food!'
    };
    res.json(response);
});

app.post('/end', (req: Request, res: Response) => {
    res.send("ok");
});

//console.log('process.env.STAGE: ' + process.env.STAGE)

if (process.env.STAGE === STAGE.TEST) {
    app.listen(3000, () => {console.log('Server up and running on: http://localhost:3000 🚀')})
} else {
    module.exports.handler = ServerlessHttp(app)
}


