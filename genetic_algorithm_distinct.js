import chalk from "chalk";

const COLORS = ["Red", "Blue", "Green", "Yellow", "Purple"];
const COLOR_CODES = {
  Red: chalk.red(" R "),
  Blue: chalk.blue(" B "),
  Green: chalk.green(" G "),
  Yellow: chalk.yellow(" Y "),
  Purple: chalk.magenta(" P "),
};

function generateRandomBoard() {
  const stones = [];

  for (const color of COLORS) {
    for (let i = 0; i < 5; i++) {
      stones.push(color);
    }
  }

  for (let i = stones.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stones[i], stones[j]] = [stones[j], stones[i]];
  }

  const board = [];
  for (let i = 0; i < 5; i++) {
    board.push(stones.slice(i * 5, (i + 1) * 5));
  }

  return board;
}

function printBoard(board, score) {
  console.log(
    chalk.bold("\n", chalk.red("Board Score:"), chalk.whiteBright(score))
  );
  for (let row of board) {
    console.log(row.map((c) => COLOR_CODES[c]).join(""));
  }
  console.log();
}

// +5 puan eger diagonal farkli renkse
// +1 puan eger row ayni renkse
// -2 puan her eksik ve fazla tas icin
function fitness(board) {
  let score = 0;

  const diagonalColors = new Set();
  for (let i = 0; i < 5; i++) {
    diagonalColors.add(board[i][i]);
  }
  if (diagonalColors.size === 5) {
    score += 5;
  }

  for (let i = 0; i < 5; i++) {
    const row = board[i];
    const refColor = row.find((_, j) => j !== i);
    let allSame = true;
    for (let j = 0; j < 5; j++) {
      if (j !== i && row[j] !== refColor) {
        allSame = false;
        break;
      }
    }
    if (allSame) score += 1;
  }

  const flat = board.flat();
  const count = {};
  for (const color of flat) {
    count[color] = (count[color] || 0) + 1;
  }

  for (const color of COLORS) {
    const diff = Math.abs((count[color] || 0) - 5);
    score -= diff * 2;
  }

  return score;
}

function generatePopulation(size = 100) {
  const population = [];
  for (let i = 0; i < size; i++) {
    const individual = generateRandomBoard();
    population.push({
      board: individual,
      fitness: fitness(individual),
    });
  }
  return population;
}

function crossover(parent1, parent2) {
  const flatten1 = parent1.flat();
  const flatten2 = parent2.flat();

  const child = [];
  const colorCount = {};

  const cutPoint = Math.floor(Math.random() * 25);
  for (let i = 0; i < cutPoint; i++) {
    const color = flatten1[i];
    child.push(color);
    colorCount[color] = (colorCount[color] || 0) + 1;
  }

  for (let i = 0; i < 25 && child.length < 25; i++) {
    const color = flatten2[i];
    if ((colorCount[color] || 0) < 5) {
      child.push(color);
      colorCount[color] = (colorCount[color] || 0) + 1;
    }
  }

  const board = [];
  for (let i = 0; i < 5; i++) {
    board.push(child.slice(i * 5, (i + 1) * 5));
  }

  return board;
}

function mutate2(board, mutationRate = 0.1) {
  const flat = board.flat();

  for (let i = 0; i < flat.length; i++) {
    if (Math.random() < mutationRate) {
      const currentColor = flat[i];
      const otherColors = COLORS.filter((c) => c !== currentColor);
      const newColor =
        otherColors[Math.floor(Math.random() * otherColors.length)];
      flat[i] = newColor;
    }
  }

  const mutated = [];
  for (let i = 0; i < 5; i++) {
    mutated.push(flat.slice(i * 5, (i + 1) * 5));
  }

  return mutated;
}
function mutate(board, mutationRate = 0.1) {
  const flat = board.flat();

  const colorIndices = {};
  for (let i = 0; i < flat.length; i++) {
    const color = flat[i];
    if (!colorIndices[color]) colorIndices[color] = [];
    colorIndices[color].push(i);
  }

  for (let i = 0; i < flat.length; i++) {
    if (Math.random() < mutationRate) {
      const originalColor = flat[i];
      const possibleNewColors = COLORS.filter((c) => c !== originalColor);
      const newColor =
        possibleNewColors[Math.floor(Math.random() * possibleNewColors.length)];

      const candidates = colorIndices[newColor];
      if (candidates && candidates.length > 0) {
        const swapIndex =
          candidates[Math.floor(Math.random() * candidates.length)];

        flat[i] = newColor;
        flat[swapIndex] = originalColor;

        colorIndices[originalColor].splice(
          colorIndices[originalColor].indexOf(i),
          1
        );
        colorIndices[newColor].splice(
          colorIndices[newColor].indexOf(swapIndex),
          1
        );

        colorIndices[newColor].push(i);
        colorIndices[originalColor].push(swapIndex);
      }
    }
  }

  const mutated = [];
  for (let i = 0; i < 5; i++) {
    mutated.push(flat.slice(i * 5, (i + 1) * 5));
  }

  return mutated;
}

function rouletteWheelSelection(population) {
  const totalFitness = population.reduce((sum, ind) => sum + ind.fitness, 0);
  const pick = Math.random() * totalFitness;

  let current = 0;
  for (const individual of population) {
    current += individual.fitness;
    if (current >= pick) {
      return individual;
    }
  }

  return population[population.length - 1];
}

function runGA({
  populationSize = 100,
  generations = 200,
  mutationRate = 0.1,
  eliteCount = 1,
} = {}) {
  let population = generatePopulation(populationSize);

  for (let gen = 0; gen < generations; gen++) {
    population.sort((a, b) => b.fitness - a.fitness);
    const elites = population.slice(0, eliteCount);

    const newPopulation = [...elites];

    while (newPopulation.length < populationSize) {
      const parent1 = rouletteWheelSelection(population).board;
      const parent2 = rouletteWheelSelection(population).board;
      const child = crossover(parent1, parent2);
      const mutated = mutate(child, mutationRate);
      newPopulation.push({
        board: mutated,
        fitness: fitness(mutated),
      });
    }

    population = newPopulation;

    const best = population[0];
    console.log(
      chalk.bold(`\n📈 Generation ${gen + 1} - Best Fitness: ${best.fitness}`)
    );
    if (best.fitness === 10) {
      console.log(chalk.greenBright("\n🎉 Mükemmel çözüm bulundu!"));
      printBoard(best.board, best.fitness);
      return;
    }
  }

  console.log(chalk.bold.red("\n⛔ Maksimum jenerasyona ulaşıldı."));
  printBoard(population[0].board, population[0].fitness);
}

runGA({
  populationSize: 500,
  generations: 500,
  mutationRate: 0.1,
  eliteCount: 3,
});
